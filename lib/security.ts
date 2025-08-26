/**
 * Comprehensive Security Utilities
 * Implements security measures including CSRF protection, rate limiting, input validation, and secure headers
 */

import { NextRequest, NextResponse } from 'next/server';
import { logProductionError } from '@/lib/monitoring';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

// Rate limiting store (in production, use Redis or similar)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export interface SecurityConfig {
  rateLimiting: {
    windowMs: number;
    maxRequests: number;
    skipSuccessfulRequests?: boolean;
  };
  csrf: {
    enabled: boolean;
    tokenLength: number;
    cookieName: string;
  };
  headers: {
    hsts: boolean;
    noSniff: boolean;
    frameOptions: string;
    referrerPolicy: string;
  };
  passwords: {
    minLength: number;
    requireUppercase: boolean;
    requireLowercase: boolean;
    requireNumbers: boolean;
    requireSpecialChars: boolean;
    saltRounds: number;
  };
}

export const DEFAULT_SECURITY_CONFIG: SecurityConfig = {
  rateLimiting: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
    skipSuccessfulRequests: false,
  },
  csrf: {
    enabled: true,
    tokenLength: 32,
    cookieName: 'csrf-token',
  },
  headers: {
    hsts: true,
    noSniff: true,
    frameOptions: 'DENY',
    referrerPolicy: 'origin-when-cross-origin',
  },
  passwords: {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    saltRounds: 12,
  },
};

/**
 * Rate limiting middleware
 */
export function createRateLimiter(config: SecurityConfig['rateLimiting']) {
  return async (request: NextRequest): Promise<NextResponse | null> => {
    try {
      const identifier = getClientIdentifier(request);
      const now = Date.now();

      // Clean up expired entries
      for (const [key, value] of rateLimitStore.entries()) {
        if (value.resetTime < now) {
          rateLimitStore.delete(key);
        }
      }

      const current = rateLimitStore.get(identifier);

      if (!current || current.resetTime < now) {
        // First request in window or window expired
        rateLimitStore.set(identifier, {
          count: 1,
          resetTime: now + config.windowMs,
        });
        return null; // Allow request
      }

      if (current.count >= config.maxRequests) {
        // Rate limit exceeded
        await logProductionError(new Error('Rate limit exceeded'), {
          component: 'security',
          action: 'rate_limit_exceeded',
          url: request.url,
          userAgent: request.headers.get('user-agent') || 'unknown',
          category: 'security',
          metadata: {
            identifier,
            currentCount: current.count,
            maxRequests: config.maxRequests,
            windowMs: config.windowMs,
            resetTime: current.resetTime,
          },
        });

        return new NextResponse(
          JSON.stringify({
            error: 'rate_limit_exceeded',
            message: 'Too many requests. Please try again later.',
            retryAfter: Math.ceil((current.resetTime - now) / 1000),
          }),
          {
            status: 429,
            headers: {
              'Content-Type': 'application/json',
              'Retry-After': Math.ceil(
                (current.resetTime - now) / 1000
              ).toString(),
              'X-RateLimit-Limit': config.maxRequests.toString(),
              'X-RateLimit-Remaining': '0',
              'X-RateLimit-Reset': current.resetTime.toString(),
            },
          }
        );
      }

      // Increment counter
      current.count++;
      rateLimitStore.set(identifier, current);

      return null; // Allow request
    } catch (error) {
      await logProductionError(error, {
        component: 'security',
        action: 'rate_limiter_error',
        url: request.url,
        userAgent: request.headers.get('user-agent') || 'unknown',
        category: 'security',
      });

      // Allow request on error to avoid breaking functionality
      return null;
    }
  };
}

/**
 * Get client identifier for rate limiting
 */
function getClientIdentifier(request: NextRequest): string {
  // Try to get real IP from various headers (for proxy/CDN scenarios)
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const cfConnectingIp = request.headers.get('cf-connecting-ip');

  const ip =
    forwardedFor?.split(',')[0] || realIp || cfConnectingIp || 'unknown';

  // Include user agent for additional uniqueness
  const userAgent = request.headers.get('user-agent') || 'unknown';

  return `${ip}:${crypto.createHash('md5').update(userAgent).digest('hex').substring(0, 8)}`;
}

/**
 * CSRF Protection
 */
export class CSRFProtection {
  private config: SecurityConfig['csrf'];

  constructor(config: SecurityConfig['csrf'] = DEFAULT_SECURITY_CONFIG.csrf) {
    this.config = config;
  }

  /**
   * Generate CSRF token
   */
  generateToken(): string {
    return crypto.randomBytes(this.config.tokenLength).toString('hex');
  }

  /**
   * Validate CSRF token
   */
  async validateToken(
    request: NextRequest,
    expectedToken: string
  ): Promise<boolean> {
    try {
      if (!this.config.enabled) {
        return true;
      }

      // Get token from header or body
      const headerToken = request.headers.get('x-csrf-token');
      const formData = await request.formData().catch(() => null);
      const bodyToken = formData?.get('csrf-token')?.toString();

      const providedToken = headerToken || bodyToken;

      if (!providedToken || !expectedToken) {
        return false;
      }

      // Use timing-safe comparison
      return crypto.timingSafeEqual(
        Buffer.from(providedToken, 'hex'),
        Buffer.from(expectedToken, 'hex')
      );
    } catch (error) {
      await logProductionError(error, {
        component: 'security',
        action: 'csrf_validation_error',
        url: request.url,
        userAgent: request.headers.get('user-agent') || 'unknown',
        category: 'security',
      });
      return false;
    }
  }

  /**
   * Create CSRF middleware
   */
  createMiddleware() {
    return async (request: NextRequest): Promise<NextResponse | null> => {
      if (!this.config.enabled) {
        return null;
      }

      // Skip CSRF for GET, HEAD, OPTIONS requests
      if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
        return null;
      }

      // Skip CSRF for API routes that use other authentication
      if (request.url.includes('/api/auth/')) {
        return null;
      }

      try {
        const cookieStore = request.cookies;
        const expectedToken = cookieStore.get(this.config.cookieName)?.value;

        if (!expectedToken) {
          return new NextResponse(
            JSON.stringify({
              error: 'csrf_token_missing',
              message: 'CSRF token is required',
            }),
            {
              status: 403,
              headers: { 'Content-Type': 'application/json' },
            }
          );
        }

        const isValid = await this.validateToken(request, expectedToken);

        if (!isValid) {
          await logProductionError(new Error('CSRF token validation failed'), {
            component: 'security',
            action: 'csrf_validation_failed',
            url: request.url,
            userAgent: request.headers.get('user-agent') || 'unknown',
            category: 'security',
            metadata: {
              hasExpectedToken: !!expectedToken,
              method: request.method,
            },
          });

          return new NextResponse(
            JSON.stringify({
              error: 'csrf_token_invalid',
              message: 'Invalid CSRF token',
            }),
            {
              status: 403,
              headers: { 'Content-Type': 'application/json' },
            }
          );
        }

        return null; // Allow request
      } catch (error) {
        await logProductionError(error, {
          component: 'security',
          action: 'csrf_middleware_error',
          url: request.url,
          userAgent: request.headers.get('user-agent') || 'unknown',
          category: 'security',
        });

        return new NextResponse(
          JSON.stringify({
            error: 'csrf_error',
            message: 'CSRF validation error',
          }),
          {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }
    };
  }
}

/**
 * Secure Headers Middleware
 */
export function createSecureHeadersMiddleware(
  config: SecurityConfig['headers']
) {
  return (response: NextResponse): NextResponse => {
    // Strict Transport Security
    if (config.hsts) {
      response.headers.set(
        'Strict-Transport-Security',
        'max-age=63072000; includeSubDomains; preload'
      );
    }

    // Content Type Options
    if (config.noSniff) {
      response.headers.set('X-Content-Type-Options', 'nosniff');
    }

    // Frame Options
    response.headers.set('X-Frame-Options', config.frameOptions);

    // Referrer Policy
    response.headers.set('Referrer-Policy', config.referrerPolicy);

    // Content Security Policy
    response.headers.set(
      'Content-Security-Policy',
      [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Next.js requires unsafe-inline/eval
        "style-src 'self' 'unsafe-inline'", // Tailwind requires unsafe-inline
        "img-src 'self' data: https:",
        "font-src 'self' data:",
        "connect-src 'self' https:",
        "frame-ancestors 'none'",
        "base-uri 'self'",
        "form-action 'self'",
      ].join('; ')
    );

    // Permissions Policy
    response.headers.set(
      'Permissions-Policy',
      [
        'camera=()',
        'microphone=()',
        'geolocation=()',
        'payment=()',
        'usb=()',
        'magnetometer=()',
        'gyroscope=()',
        'accelerometer=()',
      ].join(', ')
    );

    return response;
  };
}

/**
 * Password Security Utilities
 */
export class PasswordSecurity {
  private config: SecurityConfig['passwords'];

  constructor(
    config: SecurityConfig['passwords'] = DEFAULT_SECURITY_CONFIG.passwords
  ) {
    this.config = config;
  }

  /**
   * Validate password strength
   */
  validatePassword(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (password.length < this.config.minLength) {
      errors.push(
        `Password must be at least ${this.config.minLength} characters long`
      );
    }

    if (this.config.requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (this.config.requireLowercase && !/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (this.config.requireNumbers && !/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (
      this.config.requireSpecialChars &&
      !/[!@#$%^&*(),.?":{}|<>]/.test(password)
    ) {
      errors.push('Password must contain at least one special character');
    }

    // Check for common weak passwords
    const commonPasswords = [
      'password',
      '123456',
      '123456789',
      'qwerty',
      'abc123',
      'password123',
      'admin',
      'letmein',
      'welcome',
      'monkey',
    ];

    if (commonPasswords.includes(password.toLowerCase())) {
      errors.push(
        'Password is too common. Please choose a more secure password'
      );
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Hash password securely
   */
  async hashPassword(password: string): Promise<string> {
    try {
      const validation = this.validatePassword(password);
      if (!validation.isValid) {
        throw new Error(
          `Password validation failed: ${validation.errors.join(', ')}`
        );
      }

      return await bcrypt.hash(password, this.config.saltRounds);
    } catch (error) {
      await logProductionError(error, {
        component: 'security',
        action: 'password_hashing_error',
        url: '/password-hash',
        userAgent: 'server',
        category: 'security',
      });
      throw error;
    }
  }

  /**
   * Verify password
   */
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    try {
      return await bcrypt.compare(password, hash);
    } catch (error) {
      await logProductionError(error, {
        component: 'security',
        action: 'password_verification_error',
        url: '/password-verify',
        userAgent: 'server',
        category: 'security',
      });
      return false;
    }
  }
}

/**
 * Input Sanitization and Validation
 */
export class InputSecurity {
  /**
   * Sanitize HTML input to prevent XSS
   */
  static sanitizeHtml(input: string): string {
    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }

  /**
   * Validate and sanitize SQL input to prevent injection
   */
  static sanitizeSqlInput(input: string): string {
    // Remove or escape dangerous SQL characters
    return input
      .replace(/['";\\]/g, '') // Remove quotes and backslashes
      .replace(/--/g, '') // Remove SQL comments
      .replace(/\/\*/g, '') // Remove SQL block comments start
      .replace(/\*\//g, '') // Remove SQL block comments end
      .trim();
  }

  /**
   * Validate file upload security
   */
  static validateFileUpload(file: File): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/pdf',
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];

    if (file.size > maxSize) {
      errors.push('File size exceeds 10MB limit');
    }

    if (!allowedTypes.includes(file.type)) {
      errors.push('File type not allowed');
    }

    // Check for dangerous file extensions
    const dangerousExtensions = [
      '.exe',
      '.bat',
      '.cmd',
      '.scr',
      '.pif',
      '.com',
    ];
    const fileName = file.name.toLowerCase();

    if (dangerousExtensions.some((ext) => fileName.endsWith(ext))) {
      errors.push('File extension not allowed');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate URL to prevent SSRF attacks
   */
  static validateUrl(url: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    try {
      const parsedUrl = new URL(url);

      // Only allow HTTP and HTTPS
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        errors.push('Only HTTP and HTTPS URLs are allowed');
      }

      // Prevent localhost and private IP access
      const hostname = parsedUrl.hostname.toLowerCase();
      const privateIpPatterns = [
        /^localhost$/,
        /^127\./,
        /^10\./,
        /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
        /^192\.168\./,
        /^169\.254\./, // Link-local
        /^::1$/, // IPv6 localhost
        /^fc00:/, // IPv6 private
        /^fe80:/, // IPv6 link-local
      ];

      if (privateIpPatterns.some((pattern) => pattern.test(hostname))) {
        errors.push('Private IP addresses and localhost are not allowed');
      }
    } catch {
      errors.push('Invalid URL format');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

/**
 * Brute Force Protection
 */
export class BruteForceProtection {
  private attempts = new Map<
    string,
    { count: number; lastAttempt: number; blockedUntil?: number }
  >();
  private maxAttempts: number;
  private windowMs: number;
  private blockDurationMs: number;

  constructor(
    maxAttempts = 5,
    windowMs = 15 * 60 * 1000, // 15 minutes
    blockDurationMs = 30 * 60 * 1000 // 30 minutes
  ) {
    this.maxAttempts = maxAttempts;
    this.windowMs = windowMs;
    this.blockDurationMs = blockDurationMs;
  }

  /**
   * Check if identifier is currently blocked
   */
  isBlocked(identifier: string): boolean {
    const attempt = this.attempts.get(identifier);
    if (!attempt) return false;

    if (attempt.blockedUntil && Date.now() < attempt.blockedUntil) {
      return true;
    }

    // Clean up expired block
    if (attempt.blockedUntil && Date.now() >= attempt.blockedUntil) {
      this.attempts.delete(identifier);
    }

    return false;
  }

  /**
   * Record failed attempt
   */
  async recordFailedAttempt(
    identifier: string,
    context?: { url?: string; userAgent?: string }
  ): Promise<void> {
    const now = Date.now();
    const attempt = this.attempts.get(identifier);

    if (!attempt) {
      this.attempts.set(identifier, { count: 1, lastAttempt: now });
      return;
    }

    // Reset count if outside window
    if (now - attempt.lastAttempt > this.windowMs) {
      this.attempts.set(identifier, { count: 1, lastAttempt: now });
      return;
    }

    // Increment count
    attempt.count++;
    attempt.lastAttempt = now;

    // Block if max attempts reached
    if (attempt.count >= this.maxAttempts) {
      attempt.blockedUntil = now + this.blockDurationMs;

      await logProductionError(new Error('Brute force protection triggered'), {
        component: 'security',
        action: 'brute_force_block',
        url: context?.url || '/unknown',
        userAgent: context?.userAgent || 'unknown',
        category: 'security',
        metadata: {
          identifier,
          attemptCount: attempt.count,
          maxAttempts: this.maxAttempts,
          blockedUntil: attempt.blockedUntil,
        },
      });
    }

    this.attempts.set(identifier, attempt);
  }

  /**
   * Record successful attempt (clears failed attempts)
   */
  recordSuccessfulAttempt(identifier: string): void {
    this.attempts.delete(identifier);
  }

  /**
   * Get remaining block time in seconds
   */
  getRemainingBlockTime(identifier: string): number {
    const attempt = this.attempts.get(identifier);
    if (!attempt?.blockedUntil) return 0;

    const remaining = Math.max(0, attempt.blockedUntil - Date.now());
    return Math.ceil(remaining / 1000);
  }
}

/**
 * Security Monitoring
 */
export class SecurityMonitor {
  /**
   * Log security event
   */
  static async logSecurityEvent(
    event: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    context: {
      userId?: string;
      ip?: string;
      userAgent?: string;
      url?: string;
      metadata?: Record<string, unknown>;
    }
  ): Promise<void> {
    await logProductionError(new Error(`Security event: ${event}`), {
      component: 'security_monitor',
      action: event,
      userId: context.userId,
      url: context.url || '/security-event',
      userAgent: context.userAgent || 'unknown',
      category: 'security',
      metadata: {
        severity,
        ip: context.ip,
        securityEvent: true,
        ...context.metadata,
      },
    });
  }

  /**
   * Monitor suspicious activity patterns
   */
  static async detectSuspiciousActivity(
    userId: string,
    activity: string,
    context: Record<string, unknown>
  ): Promise<boolean> {
    // Implement pattern detection logic here
    // For now, just log the activity
    await this.logSecurityEvent(`suspicious_activity_${activity}`, 'medium', {
      userId,
      metadata: {
        activity,
        ...context,
      },
    });

    return false; // Return true if activity is deemed suspicious
  }
}

// Export instances with default configuration
export const defaultRateLimiter = createRateLimiter(
  DEFAULT_SECURITY_CONFIG.rateLimiting
);
export const defaultCSRFProtection = new CSRFProtection();
export const defaultPasswordSecurity = new PasswordSecurity();
export const defaultBruteForceProtection = new BruteForceProtection();
export const defaultSecureHeaders = createSecureHeadersMiddleware(
  DEFAULT_SECURITY_CONFIG.headers
);
