'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import {
  useMotionPreference,
  useMotionAwareAnimation,
  ANIMATION_PRESETS,
} from '@/lib/motion-preferences';

interface MotionWrapperProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Animation preset to use
   */
  preset?: keyof typeof ANIMATION_PRESETS;
  /**
   * Custom animation configuration
   */
  animation?: React.CSSProperties;
  /**
   * Whether to respect user's reduced motion preference
   */
  respectReducedMotion?: boolean;
  /**
   * Fallback duration for reduced motion (in ms)
   */
  fallbackDuration?: number;
  /**
   * Trigger animation when this value changes
   */
  trigger?: unknown;
  /**
   * Animation type
   */
  type?:
    | 'entrance'
    | 'exit'
    | 'hover'
    | 'focus'
    | 'loading'
    | 'success'
    | 'explosion'
    | 'glitch'
    | 'shake'
    | 'rotate'
    | 'zoom'
    | 'slide'
    | 'flip'
    | 'wave'
    | 'elastic'
    | 'spin'
    | 'pulseGlow'
    | 'slideBounce'
    | 'morph';
  /**
   * Whether animation should run on mount
   */
  animateOnMount?: boolean;
  /**
   * Delay before animation starts (in ms)
   */
  delay?: number;
  /**
   * Callback when animation completes
   */
  onAnimationComplete?: () => void;
}

/**
 * Motion-aware wrapper component that respects user preferences
 */
export const MotionWrapper = React.forwardRef<
  HTMLDivElement,
  MotionWrapperProps
>(
  (
    {
      children,
      className,
      preset = 'gentle',
      animation,
      respectReducedMotion = true,
      fallbackDuration = 0,
      trigger,
      type = 'entrance',
      animateOnMount = true,
      delay = 0,
      onAnimationComplete,
      ...props
    },
    ref
  ) => {
    const [isAnimating, setIsAnimating] = React.useState(false);
    const [hasAnimated, setHasAnimated] = React.useState(false);
    const { prefersReducedMotion } = useMotionPreference();
    const { config, styles } = useMotionAwareAnimation(preset, {
      respectPreference: respectReducedMotion,
      fallbackDuration,
    });

    // Trigger animation on mount or when trigger changes
    React.useEffect(() => {
      if (animateOnMount && !hasAnimated) {
        const timer = setTimeout(() => {
          setIsAnimating(true);
          setHasAnimated(true);
        }, delay);
        return () => clearTimeout(timer);
      }
    }, [animateOnMount, hasAnimated, delay]);

    // Trigger animation when trigger prop changes
    React.useEffect(() => {
      if (trigger !== undefined) {
        setIsAnimating(true);
      }
    }, [trigger]);

    // Handle animation completion
    React.useEffect(() => {
      if (isAnimating && onAnimationComplete) {
        const timer = setTimeout(
          () => {
            onAnimationComplete();
            setIsAnimating(false);
          },
          config.duration + (delay || 0)
        );
        return () => clearTimeout(timer);
      }
    }, [isAnimating, config.duration, delay, onAnimationComplete]);

    // Get animation classes based on type and state
    const getAnimationClasses = () => {
      if (!isAnimating && !respectReducedMotion) return '';
      if (respectReducedMotion && prefersReducedMotion) return '';

      switch (type) {
        case 'entrance':
          return 'animate-in fade-in slide-in-from-bottom-4';
        case 'exit':
          return 'animate-out fade-out slide-out-to-bottom-4';
        case 'hover':
          return 'transition-transform hover:scale-105';
        case 'focus':
          return 'transition-all focus-within:ring-2 focus-within:ring-offset-2';
        case 'loading':
          return 'animate-pulse';
        case 'success':
          return 'animate-bounce';
        // EXTREME animation types
        case 'explosion':
          return 'animate-in zoom-in-95 rotate-in-12';
        case 'glitch':
          return 'animate-bounce';
        case 'shake':
          return 'animate-pulse';
        case 'rotate':
          return 'animate-spin';
        case 'zoom':
          return 'animate-in zoom-in-150';
        case 'slide':
          return 'animate-in slide-in-from-left-8';
        case 'flip':
          return 'animate-in flip-in-x';
        case 'wave':
          return 'animate-bounce';
        case 'elastic':
          return 'animate-in zoom-in-75';
        case 'spin':
          return 'animate-spin';
        case 'pulseGlow':
          return 'animate-pulse';
        case 'slideBounce':
          return 'animate-in slide-in-from-top-4';
        case 'morph':
          return 'animate-in fade-in';
        default:
          return '';
      }
    };

    const animationClasses = getAnimationClasses();
    const combinedStyles = {
      ...styles,
      animationDelay: delay ? `${delay}ms` : undefined,
      ...animation,
    };

    return (
      <div
        ref={ref}
        className={cn(animationClasses, className)}
        style={combinedStyles}
        {...props}
      >
        {children}
      </div>
    );
  }
);

MotionWrapper.displayName = 'MotionWrapper';

/**
 * Specialized motion components for common use cases
 */

/**
 * Fade in animation wrapper
 */
export const FadeIn = React.forwardRef<
  HTMLDivElement,
  Omit<MotionWrapperProps, 'type'>
>((props, ref) => (
  <MotionWrapper ref={ref} type="entrance" preset="fadeIn" {...props} />
));
FadeIn.displayName = 'FadeIn';

/**
 * Slide in animation wrapper
 */
export const SlideIn = React.forwardRef<
  HTMLDivElement,
  Omit<MotionWrapperProps, 'type'>
>((props, ref) => (
  <MotionWrapper ref={ref} type="entrance" preset="slideIn" {...props} />
));
SlideIn.displayName = 'SlideIn';

/**
 * Success animation wrapper
 */
export const SuccessMotion = React.forwardRef<
  HTMLDivElement,
  Omit<MotionWrapperProps, 'type'>
>((props, ref) => (
  <MotionWrapper ref={ref} type="success" preset="success" {...props} />
));
SuccessMotion.displayName = 'SuccessMotion';

/**
 * Loading animation wrapper
 */
export const LoadingMotion = React.forwardRef<
  HTMLDivElement,
  Omit<MotionWrapperProps, 'type'>
>((props, ref) => (
  <MotionWrapper ref={ref} type="loading" preset="pulse" {...props} />
));
LoadingMotion.displayName = 'LoadingMotion';

/**
 * Hover animation wrapper
 */
export const HoverMotion = React.forwardRef<
  HTMLDivElement,
  Omit<MotionWrapperProps, 'type'>
>((props, ref) => (
  <MotionWrapper ref={ref} type="hover" preset="gentle" {...props} />
));
HoverMotion.displayName = 'HoverMotion';

/**
 * EXTREME ANIMATION COMPONENTS
 */

/**
 * Explosion animation - dramatic zoom and rotate
 */
export const ExplosionMotion = React.forwardRef<
  HTMLDivElement,
  Omit<MotionWrapperProps, 'type'>
>((props, ref) => (
  <MotionWrapper ref={ref} type="explosion" preset="explosion" {...props} />
));
ExplosionMotion.displayName = 'ExplosionMotion';

/**
 * Glitch effect - jittery digital animation
 */
export const GlitchMotion = React.forwardRef<
  HTMLDivElement,
  Omit<MotionWrapperProps, 'type'>
>((props, ref) => (
  <MotionWrapper ref={ref} type="glitch" preset="glitch" {...props} />
));
GlitchMotion.displayName = 'GlitchMotion';

/**
 * Shake animation - horizontal shaking
 */
export const ShakeMotion = React.forwardRef<
  HTMLDivElement,
  Omit<MotionWrapperProps, 'type'>
>((props, ref) => (
  <MotionWrapper ref={ref} type="shake" preset="shake" {...props} />
));
ShakeMotion.displayName = 'ShakeMotion';

/**
 * Rotate animation - 360 degree rotation
 */
export const RotateMotion = React.forwardRef<
  HTMLDivElement,
  Omit<MotionWrapperProps, 'type'>
>((props, ref) => (
  <MotionWrapper ref={ref} type="rotate" preset="rotate" {...props} />
));
RotateMotion.displayName = 'RotateMotion';

/**
 * Zoom animation - dramatic scale
 */
export const ZoomMotion = React.forwardRef<
  HTMLDivElement,
  Omit<MotionWrapperProps, 'type'>
>((props, ref) => (
  <MotionWrapper ref={ref} type="zoom" preset="zoom" {...props} />
));
ZoomMotion.displayName = 'ZoomMotion';

/**
 * Slide animation - dramatic slide from side
 */
export const SlideMotion = React.forwardRef<
  HTMLDivElement,
  Omit<MotionWrapperProps, 'type'>
>((props, ref) => (
  <MotionWrapper ref={ref} type="slide" preset="slide" {...props} />
));
SlideMotion.displayName = 'SlideMotion';

/**
 * Flip animation - 3D flip effect
 */
export const FlipMotion = React.forwardRef<
  HTMLDivElement,
  Omit<MotionWrapperProps, 'type'>
>((props, ref) => (
  <MotionWrapper ref={ref} type="flip" preset="flip" {...props} />
));
FlipMotion.displayName = 'FlipMotion';

/**
 * Wave animation - smooth wave motion
 */
export const WaveMotion = React.forwardRef<
  HTMLDivElement,
  Omit<MotionWrapperProps, 'type'>
>((props, ref) => (
  <MotionWrapper ref={ref} type="wave" preset="wave" {...props} />
));
WaveMotion.displayName = 'WaveMotion';

/**
 * Elastic animation - bouncy elastic effect
 */
export const ElasticMotion = React.forwardRef<
  HTMLDivElement,
  Omit<MotionWrapperProps, 'type'>
>((props, ref) => (
  <MotionWrapper ref={ref} type="elastic" preset="elastic" {...props} />
));
ElasticMotion.displayName = 'ElasticMotion';

/**
 * Spin animation - continuous spinning
 */
export const SpinMotion = React.forwardRef<
  HTMLDivElement,
  Omit<MotionWrapperProps, 'type'>
>((props, ref) => (
  <MotionWrapper ref={ref} type="spin" preset="spin" {...props} />
));
SpinMotion.displayName = 'SpinMotion';

/**
 * Pulse glow animation - glowing pulse effect
 */
export const PulseGlowMotion = React.forwardRef<
  HTMLDivElement,
  Omit<MotionWrapperProps, 'type'>
>((props, ref) => (
  <MotionWrapper ref={ref} type="pulseGlow" preset="pulseGlow" {...props} />
));
PulseGlowMotion.displayName = 'PulseGlowMotion';

/**
 * Slide bounce animation - slide with bounce
 */
export const SlideBounceMotion = React.forwardRef<
  HTMLDivElement,
  Omit<MotionWrapperProps, 'type'>
>((props, ref) => (
  <MotionWrapper ref={ref} type="slideBounce" preset="slideBounce" {...props} />
));
SlideBounceMotion.displayName = 'SlideBounceMotion';

/**
 * Morph animation - shape morphing
 */
export const MorphMotion = React.forwardRef<
  HTMLDivElement,
  Omit<MotionWrapperProps, 'type'>
>((props, ref) => (
  <MotionWrapper ref={ref} type="morph" preset="morph" {...props} />
));
MorphMotion.displayName = 'MorphMotion';

/**
 * Staggered animation container for lists
 */
interface StaggeredMotionProps extends Omit<MotionWrapperProps, 'delay'> {
  /**
   * Delay between each child animation (in ms)
   */
  staggerDelay?: number;
  /**
   * Maximum number of children to animate
   */
  maxChildren?: number;
}

export const StaggeredMotion = React.forwardRef<
  HTMLDivElement,
  StaggeredMotionProps
>(({ children, staggerDelay = 100, maxChildren = 10, ...props }, ref) => {
  const childrenArray = React.Children.toArray(children);

  return (
    <div ref={ref}>
      {childrenArray.slice(0, maxChildren).map((child, index) => (
        <MotionWrapper key={index} delay={index * staggerDelay} {...props}>
          {child}
        </MotionWrapper>
      ))}
      {/* Render remaining children without animation if over limit */}
      {childrenArray.slice(maxChildren)}
    </div>
  );
});
StaggeredMotion.displayName = 'StaggeredMotion';

/**
 * Motion-aware transition group for dynamic content
 */
interface TransitionGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Current items to display
   */
  items: React.ReactNode[];
  /**
   * Key extractor for items
   */
  getKey?: (item: React.ReactNode, index: number) => string | number;
  /**
   * Animation preset for enter/exit
   */
  preset?: keyof typeof ANIMATION_PRESETS;
  /**
   * Stagger delay between items
   */
  staggerDelay?: number;
}

export const TransitionGroup = React.forwardRef<
  HTMLDivElement,
  TransitionGroupProps
>(
  (
    {
      items,
      getKey = (_, index) => index,
      preset = 'gentle',
      staggerDelay = 50,
      className,
      ...props
    },
    ref
  ) => {
    const [visibleItems, setVisibleItems] = React.useState<React.ReactNode[]>(
      []
    );
    const { prefersReducedMotion } = useMotionPreference();

    React.useEffect(() => {
      if (prefersReducedMotion) {
        setVisibleItems(items);
        return;
      }

      // Animate items in with stagger
      items.forEach((item, index) => {
        setTimeout(() => {
          setVisibleItems((prev) => [
            ...prev.slice(0, index),
            item,
            ...prev.slice(index + 1),
          ]);
        }, index * staggerDelay);
      });
    }, [items, staggerDelay, prefersReducedMotion]);

    return (
      <div ref={ref} className={className} {...props}>
        {visibleItems.map((item, index) => (
          <MotionWrapper
            key={getKey(item, index)}
            preset={preset}
            delay={prefersReducedMotion ? 0 : index * staggerDelay}
          >
            {item}
          </MotionWrapper>
        ))}
      </div>
    );
  }
);
TransitionGroup.displayName = 'TransitionGroup';
