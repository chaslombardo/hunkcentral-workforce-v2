/**
 * Client-side Error Reporting API
 * Handles authentication and other client-side errors for production monitoring
 */

import { NextRequest, NextResponse } from 'next/server';
import { logProductionError } from '@/lib/production-error-logger';
import { validateProductionSession } from '@/lib/production-auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      type,
      error,
      code,
      context,
      message,
      stack,
      url,
      userAgent,
      timestamp,
    } = body;

    // Validate session (but don't require it for error reporting)
    const authResult = await validateProductionSession(request, {
      requireAuth: false,
      redirectOnFailure: false,
      allowGracefulDegradation: true,
    });

    const userId = authResult.user?.id;

    // Create error object
    const clientError = new Error(message || error || 'Client-side error');
    if (stack) {
      clientError.stack = stack;
    }

    // Log the client error with enhanced context
    await logProductionError(clientError, {
      component: 'client',
      action: type || 'client_error',
      userId,
      url: url || request.url,
      userAgent: userAgent || request.headers.get('user-agent') || 'unknown',
      category: 'component',
      metadata: {
        errorType: type,
        errorCode: code,
        clientContext: context,
        timestamp: timestamp || new Date().toISOString(),
        reportedFromClient: true,
        // Browser information
        browserInfo: {
          userAgent: userAgent || request.headers.get('user-agent'),
          referer: request.headers.get('referer'),
          acceptLanguage: request.headers.get('accept-language'),
        },
        // Request information
        requestInfo: {
          method: request.method,
          headers: Object.fromEntries(request.headers.entries()),
          ip:
            request.headers.get('x-forwarded-for') ||
            request.headers.get('x-real-ip') ||
            'unknown',
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Error reported successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Failed to process client error report:', error);

    // Log the error reporting failure
    await logProductionError(error, {
      component: 'error_reporting',
      action: 'client_error_report_failed',
      url: request.url,
      userAgent: request.headers.get('user-agent') || 'unknown',
      category: 'api',
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to report error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// Handle other HTTP methods
export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}

export async function PUT() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}

export async function DELETE() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}
