"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { 
  useMotionPreference, 
  useMotionAwareAnimation,
  ANIMATION_PRESETS
} from "@/lib/motion-preferences"

interface MotionWrapperProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Animation preset to use
   */
  preset?: keyof typeof ANIMATION_PRESETS
  /**
   * Custom animation configuration
   */
  animation?: React.CSSProperties
  /**
   * Whether to respect user's reduced motion preference
   */
  respectReducedMotion?: boolean
  /**
   * Fallback duration for reduced motion (in ms)
   */
  fallbackDuration?: number
  /**
   * Trigger animation when this value changes
   */
  trigger?: unknown
  /**
   * Animation type
   */
  type?: 'entrance' | 'exit' | 'hover' | 'focus' | 'loading' | 'success'
  /**
   * Whether animation should run on mount
   */
  animateOnMount?: boolean
  /**
   * Delay before animation starts (in ms)
   */
  delay?: number
  /**
   * Callback when animation completes
   */
  onAnimationComplete?: () => void
}

/**
 * Motion-aware wrapper component that respects user preferences
 */
export const MotionWrapper = React.forwardRef<HTMLDivElement, MotionWrapperProps>(
  ({
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
  }, ref) => {
    const [isAnimating, setIsAnimating] = React.useState(false)
    const [hasAnimated, setHasAnimated] = React.useState(false)
    const { prefersReducedMotion } = useMotionPreference()
    const { config, styles } = useMotionAwareAnimation(preset, {
      respectPreference: respectReducedMotion,
      fallbackDuration,
    })

    // Trigger animation on mount or when trigger changes
    React.useEffect(() => {
      if (animateOnMount && !hasAnimated) {
        const timer = setTimeout(() => {
          setIsAnimating(true)
          setHasAnimated(true)
        }, delay)
        return () => clearTimeout(timer)
      }
    }, [animateOnMount, hasAnimated, delay])

    // Trigger animation when trigger prop changes
    React.useEffect(() => {
      if (trigger !== undefined) {
        setIsAnimating(true)
      }
    }, [trigger])

    // Handle animation completion
    React.useEffect(() => {
      if (isAnimating && onAnimationComplete) {
        const timer = setTimeout(() => {
          onAnimationComplete()
          setIsAnimating(false)
        }, config.duration + (delay || 0))
        return () => clearTimeout(timer)
      }
    }, [isAnimating, config.duration, delay, onAnimationComplete])

    // Get animation classes based on type and state
    const getAnimationClasses = () => {
      if (!isAnimating && !respectReducedMotion) return ''
      if (respectReducedMotion && prefersReducedMotion) return ''

      switch (type) {
        case 'entrance':
          return 'animate-in fade-in slide-in-from-bottom-4'
        case 'exit':
          return 'animate-out fade-out slide-out-to-bottom-4'
        case 'hover':
          return 'transition-transform hover:scale-105'
        case 'focus':
          return 'transition-all focus-within:ring-2 focus-within:ring-offset-2'
        case 'loading':
          return 'animate-pulse'
        case 'success':
          return 'animate-bounce'
        default:
          return ''
      }
    }

    const animationClasses = getAnimationClasses()
    const combinedStyles = {
      ...styles,
      animationDelay: delay ? `${delay}ms` : undefined,
      ...animation,
    }

    return (
      <div
        ref={ref}
        className={cn(animationClasses, className)}
        style={combinedStyles}
        {...props}
      >
        {children}
      </div>
    )
  }
)

MotionWrapper.displayName = "MotionWrapper"

/**
 * Specialized motion components for common use cases
 */

/**
 * Fade in animation wrapper
 */
export const FadeIn = React.forwardRef<HTMLDivElement, Omit<MotionWrapperProps, 'type'>>(
  (props, ref) => (
    <MotionWrapper ref={ref} type="entrance" preset="fadeIn" {...props} />
  )
)
FadeIn.displayName = "FadeIn"

/**
 * Slide in animation wrapper
 */
export const SlideIn = React.forwardRef<HTMLDivElement, Omit<MotionWrapperProps, 'type'>>(
  (props, ref) => (
    <MotionWrapper ref={ref} type="entrance" preset="slideIn" {...props} />
  )
)
SlideIn.displayName = "SlideIn"

/**
 * Success animation wrapper
 */
export const SuccessMotion = React.forwardRef<HTMLDivElement, Omit<MotionWrapperProps, 'type'>>(
  (props, ref) => (
    <MotionWrapper ref={ref} type="success" preset="success" {...props} />
  )
)
SuccessMotion.displayName = "SuccessMotion"

/**
 * Loading animation wrapper
 */
export const LoadingMotion = React.forwardRef<HTMLDivElement, Omit<MotionWrapperProps, 'type'>>(
  (props, ref) => (
    <MotionWrapper ref={ref} type="loading" preset="pulse" {...props} />
  )
)
LoadingMotion.displayName = "LoadingMotion"

/**
 * Hover animation wrapper
 */
export const HoverMotion = React.forwardRef<HTMLDivElement, Omit<MotionWrapperProps, 'type'>>(
  (props, ref) => (
    <MotionWrapper ref={ref} type="hover" preset="gentle" {...props} />
  )
)
HoverMotion.displayName = "HoverMotion"

/**
 * Staggered animation container for lists
 */
interface StaggeredMotionProps extends Omit<MotionWrapperProps, 'delay'> {
  /**
   * Delay between each child animation (in ms)
   */
  staggerDelay?: number
  /**
   * Maximum number of children to animate
   */
  maxChildren?: number
}

export const StaggeredMotion = React.forwardRef<HTMLDivElement, StaggeredMotionProps>(
  ({
    children,
    staggerDelay = 100,
    maxChildren = 10,
    ...props
  }, ref) => {
    const childrenArray = React.Children.toArray(children)
    
    return (
      <div ref={ref}>
        {childrenArray.slice(0, maxChildren).map((child, index) => (
          <MotionWrapper
            key={index}
            delay={index * staggerDelay}
            {...props}
          >
            {child}
          </MotionWrapper>
        ))}
        {/* Render remaining children without animation if over limit */}
        {childrenArray.slice(maxChildren)}
      </div>
    )
  }
)
StaggeredMotion.displayName = "StaggeredMotion"

/**
 * Motion-aware transition group for dynamic content
 */
interface TransitionGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Current items to display
   */
  items: React.ReactNode[]
  /**
   * Key extractor for items
   */
  getKey?: (item: React.ReactNode, index: number) => string | number
  /**
   * Animation preset for enter/exit
   */
  preset?: keyof typeof ANIMATION_PRESETS
  /**
   * Stagger delay between items
   */
  staggerDelay?: number
}

export const TransitionGroup = React.forwardRef<HTMLDivElement, TransitionGroupProps>(
  ({
    items,
    getKey = (_, index) => index,
    preset = 'gentle',
    staggerDelay = 50,
    className,
    ...props
  }, ref) => {
    const [visibleItems, setVisibleItems] = React.useState<React.ReactNode[]>([])
    const { prefersReducedMotion } = useMotionPreference()

    React.useEffect(() => {
      if (prefersReducedMotion) {
        setVisibleItems(items)
        return
      }

      // Animate items in with stagger
      items.forEach((item, index) => {
        setTimeout(() => {
          setVisibleItems(prev => [...prev.slice(0, index), item, ...prev.slice(index + 1)])
        }, index * staggerDelay)
      })
    }, [items, staggerDelay, prefersReducedMotion])

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
    )
  }
)
TransitionGroup.displayName = "TransitionGroup"