/**
 * Motion Preferences System
 * 
 * Comprehensive system for handling user motion preferences and providing
 * alternative static states for users who prefer reduced motion.
 */

import { type ClassValue, clsx } from "clsx";

/**
 * Motion preference types
 */
export type MotionPreference = 'no-preference' | 'reduce';

/**
 * Animation configuration interface
 */
export interface AnimationConfig {
  /** Duration in milliseconds */
  duration: number;
  /** CSS easing function */
  easing: string;
  /** Delay before animation starts */
  delay?: number;
  /** Number of iterations (or 'infinite') */
  iterations?: number | 'infinite';
  /** Animation direction */
  direction?: 'normal' | 'reverse' | 'alternate' | 'alternate-reverse';
  /** Fill mode */
  fillMode?: 'none' | 'forwards' | 'backwards' | 'both';
}

/**
 * Base animation preset interface
 */
interface BaseAnimationPreset {
  duration: number;
  easing: string;
  delay?: number;
  iterations?: number | 'infinite';
  direction?: 'normal' | 'reverse' | 'alternate' | 'alternate-reverse';
  fillMode?: 'none' | 'forwards' | 'backwards' | 'both';
}

/**
 * Predefined animation configurations
 */
export const ANIMATION_PRESETS: Record<string, BaseAnimationPreset> = {
  // Micro-interactions
  subtle: {
    duration: 150,
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)', // ease-out
  },
  gentle: {
    duration: 200,
    easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)', // ease-out-quad
  },
  smooth: {
    duration: 300,
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)', // ease-out
  },
  
  // Loading states
  spinner: {
    duration: 1000,
    easing: 'linear',
    iterations: 'infinite' as const,
  },
  pulse: {
    duration: 2000,
    easing: 'cubic-bezier(0.4, 0, 0.6, 1)', // ease-in-out
    iterations: 'infinite' as const,
    direction: 'alternate' as const,
  },
  bounce: {
    duration: 600,
    easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)', // bounce
    iterations: 2,
  },
  
  // Transitions
  slideIn: {
    duration: 250,
    easing: 'cubic-bezier(0.16, 1, 0.3, 1)', // ease-out-expo
  },
  slideOut: {
    duration: 200,
    easing: 'cubic-bezier(0.7, 0, 0.84, 0)', // ease-in-expo
  },
  fadeIn: {
    duration: 200,
    easing: 'ease-out',
  },
  fadeOut: {
    duration: 150,
    easing: 'ease-in',
  },
  
  // Success animations
  success: {
    duration: 500,
    easing: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)', // ease-out-back
  },
  celebration: {
    duration: 800,
    easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)', // bounce
  },
} as const;

/**
 * Motion preference detection and management
 */
export class MotionPreferenceManager {
  private static instance: MotionPreferenceManager;
  private preference: MotionPreference = 'no-preference';
  private listeners: Set<(preference: MotionPreference) => void> = new Set();
  private mediaQuery: MediaQueryList | null = null;

  private constructor() {
    if (typeof window !== 'undefined') {
      this.initializePreference();
    }
  }

  static getInstance(): MotionPreferenceManager {
    if (!MotionPreferenceManager.instance) {
      MotionPreferenceManager.instance = new MotionPreferenceManager();
    }
    return MotionPreferenceManager.instance;
  }

  private initializePreference(): void {
    this.mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    this.preference = this.mediaQuery.matches ? 'reduce' : 'no-preference';
    
    // Listen for changes
    this.mediaQuery.addEventListener('change', this.handlePreferenceChange);
  }

  private handlePreferenceChange = (event: MediaQueryListEvent): void => {
    this.preference = event.matches ? 'reduce' : 'no-preference';
    this.notifyListeners();
  };

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.preference));
  }

  /**
   * Get current motion preference
   */
  getPreference(): MotionPreference {
    return this.preference;
  }

  /**
   * Check if user prefers reduced motion
   */
  prefersReducedMotion(): boolean {
    return this.preference === 'reduce';
  }

  /**
   * Subscribe to preference changes
   */
  subscribe(listener: (preference: MotionPreference) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.mediaQuery) {
      this.mediaQuery.removeEventListener('change', this.handlePreferenceChange);
    }
    this.listeners.clear();
  }
}

/**
 * Get the global motion preference manager instance
 */
export const motionManager = MotionPreferenceManager.getInstance();

/**
 * Utility functions for motion-aware styling
 */
export const motionUtils = {
  /**
   * Check if user prefers reduced motion (static method)
   */
  prefersReducedMotion(): boolean {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  },

  /**
   * Get animation classes based on user preference
   */
  getAnimationClasses(
    animatedClasses: ClassValue,
    staticClasses: ClassValue = ''
  ): string {
    return clsx(
      motionManager.prefersReducedMotion() ? staticClasses : animatedClasses
    );
  },

  /**
   * Get conditional animation duration
   */
  getDuration(normalDuration: number, reducedDuration: number = 0): number {
    return motionManager.prefersReducedMotion() ? reducedDuration : normalDuration;
  },

  /**
   * Get conditional animation delay
   */
  getDelay(normalDelay: number, reducedDelay: number = 0): number {
    return motionManager.prefersReducedMotion() ? reducedDelay : normalDelay;
  },

  /**
   * Create CSS custom properties for motion-aware animations
   */
  createMotionProperties(config: BaseAnimationPreset): Record<string, string> {
    const reduced = motionManager.prefersReducedMotion();
    
    return {
      '--motion-duration': reduced ? '0ms' : `${config.duration}ms`,
      '--motion-easing': reduced ? 'linear' : config.easing,
      '--motion-delay': reduced ? '0ms' : `${config.delay || 0}ms`,
      '--motion-iterations': reduced ? '1' : String(config.iterations || 1),
      '--motion-direction': config.direction || 'normal',
      '--motion-fill-mode': config.fillMode || 'none',
    };
  },

  /**
   * Generate Tailwind classes for motion-aware animations
   */
  getTailwindClasses(preset: keyof typeof ANIMATION_PRESETS): string {
    const config = ANIMATION_PRESETS[preset];
    const reduced = motionManager.prefersReducedMotion();
    
    if (reduced) {
      return 'motion-reduce:transition-none motion-reduce:animate-none';
    }

    // Map duration to Tailwind classes
    const durationClass = (() => {
      if (config.duration <= 75) return 'duration-75';
      if (config.duration <= 100) return 'duration-100';
      if (config.duration <= 150) return 'duration-150';
      if (config.duration <= 200) return 'duration-200';
      if (config.duration <= 300) return 'duration-300';
      if (config.duration <= 500) return 'duration-500';
      if (config.duration <= 700) return 'duration-700';
      if (config.duration <= 1000) return 'duration-1000';
      return 'duration-1000';
    })();

    // Map easing to Tailwind classes
    const easingClass = (() => {
      if (config.easing.includes('linear')) return 'ease-linear';
      if (config.easing.includes('ease-in-out')) return 'ease-in-out';
      if (config.easing.includes('ease-in')) return 'ease-in';
      if (config.easing.includes('ease-out')) return 'ease-out';
      return 'ease-out';
    })();

    return `${durationClass} ${easingClass}`;
  },

  /**
   * Create inline styles for complex animations
   */
  getInlineStyles(preset: keyof typeof ANIMATION_PRESETS): React.CSSProperties {
    const config = ANIMATION_PRESETS[preset];
    const reduced = motionManager.prefersReducedMotion();
    
    if (reduced) {
      return {
        animationDuration: '0ms',
        transitionDuration: '0ms',
      };
    }

    return {
      animationDuration: `${config.duration}ms`,
      animationTimingFunction: config.easing,
      animationDelay: config.delay ? `${config.delay}ms` : undefined,
      animationIterationCount: config.iterations || 1,
      animationDirection: config.direction || 'normal',
      animationFillMode: config.fillMode || 'none',
    };
  },
};

/**
 * React hook for motion preferences
 */
export function useMotionPreference() {
  const [preference, setPreference] = React.useState<MotionPreference>(() => 
    motionManager.getPreference()
  );

  React.useEffect(() => {
    const unsubscribe = motionManager.subscribe(setPreference);
    return unsubscribe;
  }, []);

  return {
    preference,
    prefersReducedMotion: preference === 'reduce',
    getAnimationClasses: motionUtils.getAnimationClasses,
    getDuration: motionUtils.getDuration,
    getDelay: motionUtils.getDelay,
  };
}

/**
 * React hook for motion-aware animations
 */
export function useMotionAwareAnimation(
  preset: keyof typeof ANIMATION_PRESETS,
  options: {
    respectPreference?: boolean;
    fallbackDuration?: number;
  } = {}
) {
  const { respectPreference = true, fallbackDuration = 0 } = options;
  const { prefersReducedMotion } = useMotionPreference();
  
  const config = React.useMemo(() => {
    const baseConfig = ANIMATION_PRESETS[preset];
    
    if (respectPreference && prefersReducedMotion) {
      return {
        ...baseConfig,
        duration: fallbackDuration,
        iterations: 1,
      };
    }
    
    return baseConfig;
  }, [preset, respectPreference, prefersReducedMotion, fallbackDuration]);

  const classes = React.useMemo(() => 
    motionUtils.getTailwindClasses(preset),
    [preset]
  );

  const styles = React.useMemo(() => 
    motionUtils.getInlineStyles(preset),
    [preset]
  );

  return {
    config,
    classes,
    styles,
    prefersReducedMotion,
  };
}

/**
 * Higher-order component for motion-aware components
 */
export function withMotionPreference<P extends object>(
  Component: React.ComponentType<P>
): React.ComponentType<P> {
  const MotionAwareComponent = (props: P) => {
    const motionPreference = useMotionPreference();
    
    return React.createElement(Component, {
      ...props,
      motionPreference,
    } as P & { motionPreference: ReturnType<typeof useMotionPreference> });
  };

  MotionAwareComponent.displayName = `withMotionPreference(${Component.displayName || Component.name})`;
  
  return MotionAwareComponent;
}

/**
 * CSS-in-JS helper for motion-aware styles
 */
export function createMotionAwareStyles(
  animatedStyles: Record<string, unknown>,
  staticStyles: Record<string, unknown> = {}
) {
  return motionManager.prefersReducedMotion() ? staticStyles : animatedStyles;
}

/**
 * Micro-interaction utilities
 */
export const microInteractions = {
  /**
   * Button hover effect
   */
  buttonHover: {
    animated: 'transition-all duration-150 ease-out hover:scale-105 hover:shadow-md',
    static: 'hover:opacity-90',
  },

  /**
   * Card hover effect
   */
  cardHover: {
    animated: 'transition-all duration-200 ease-out hover:shadow-lg hover:-translate-y-1',
    static: 'hover:shadow-md',
  },

  /**
   * Input focus effect
   */
  inputFocus: {
    animated: 'transition-all duration-150 ease-out focus:ring-2 focus:ring-offset-2',
    static: 'focus:ring-2 focus:ring-offset-1',
  },

  /**
   * Loading pulse effect
   */
  loadingPulse: {
    animated: 'animate-pulse',
    static: 'opacity-60',
  },

  /**
   * Success checkmark animation
   */
  successCheck: {
    animated: 'animate-bounce',
    static: 'opacity-100',
  },

  /**
   * Notification slide in
   */
  notificationSlide: {
    animated: 'transition-transform duration-300 ease-out translate-x-0',
    static: 'opacity-100',
  },
};

/**
 * Get micro-interaction classes based on motion preference
 */
export function getMicroInteractionClasses(
  interaction: keyof typeof microInteractions
): string {
  const config = microInteractions[interaction];
  return motionUtils.getAnimationClasses(config.animated, config.static);
}

// Re-export React for the hooks
import * as React from 'react';