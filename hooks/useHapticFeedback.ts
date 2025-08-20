'use client';

import React, { useCallback } from 'react';

// Types of haptic feedback available on mobile devices
export type HapticFeedbackType =
  | 'light' // Light tap feedback
  | 'medium' // Medium tap feedback
  | 'heavy' // Heavy tap feedback
  | 'selection' // Selection change feedback
  | 'impact' // Impact feedback
  | 'notification'; // Notification feedback

/**
 * Hook for providing haptic feedback on mobile devices
 * Gracefully degrades on devices that don't support haptic feedback
 */
export function useHapticFeedback() {
  const triggerHaptic = useCallback((type: HapticFeedbackType = 'light') => {
    // Check if we're in a browser environment
    if (typeof window === 'undefined') return;

    // Check if the device supports haptic feedback
    if ('vibrate' in navigator) {
      // Map haptic types to vibration patterns
      const vibrationPatterns: Record<HapticFeedbackType, number | number[]> = {
        light: 10,
        medium: 20,
        heavy: 50,
        selection: [10, 10],
        impact: [20, 10, 20],
        notification: [50, 50, 50],
      };

      const pattern = vibrationPatterns[type];

      try {
        if (Array.isArray(pattern)) {
          navigator.vibrate(pattern);
        } else {
          navigator.vibrate(pattern);
        }
      } catch (error) {
        // Silently fail if vibration is not supported or blocked
        console.debug('Haptic feedback not available:', error);
      }
    }

    // For iOS devices, try to use the Haptic Feedback API if available
    // This is experimental and may not be available in all browsers
    if ('HapticFeedback' in window && (window as any).HapticFeedback) {
      try {
        const hapticMap: Record<HapticFeedbackType, string> = {
          light: 'light',
          medium: 'medium',
          heavy: 'heavy',
          selection: 'selection',
          impact: 'impact',
          notification: 'notification',
        };

        const hapticType = hapticMap[type] || 'light';
        (window as any).HapticFeedback.impact(hapticType);
      } catch (error) {
        // Silently fail if not supported
        console.debug('iOS Haptic feedback not available:', error);
      }
    }
  }, []);

  // Convenience methods for common haptic patterns
  const tapFeedback = useCallback(
    () => triggerHaptic('light'),
    [triggerHaptic]
  );
  const selectionFeedback = useCallback(
    () => triggerHaptic('selection'),
    [triggerHaptic]
  );
  const impactFeedback = useCallback(
    () => triggerHaptic('impact'),
    [triggerHaptic]
  );
  const notificationFeedback = useCallback(
    () => triggerHaptic('notification'),
    [triggerHaptic]
  );

  return {
    triggerHaptic,
    tapFeedback,
    selectionFeedback,
    impactFeedback,
    notificationFeedback,
  };
}

/**
 * Higher-order component to add haptic feedback to click events
 */
export function withHapticFeedback<T extends { onClick?: () => void }>(
  Component: React.ComponentType<T>,
  hapticType: HapticFeedbackType = 'light'
): React.ComponentType<T> {
  return function HapticComponent(props: T) {
    const { triggerHaptic } = useHapticFeedback();

    const handleClick = useCallback(() => {
      triggerHaptic(hapticType);
      props.onClick?.();
    }, [props.onClick, triggerHaptic]);

    return React.createElement(Component, { ...props, onClick: handleClick });
  };
}
