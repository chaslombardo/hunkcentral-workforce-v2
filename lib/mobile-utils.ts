'use client';

type NetworkInformation = {
  downlink?: number;
  effectiveType?: string;
};

type NetworkAwareNavigator = Navigator & {
  connection?: NetworkInformation;
  mozConnection?: NetworkInformation;
  webkitConnection?: NetworkInformation;
};

type WindowWithIdleCallback = Window & {
  requestIdleCallback?: (
    callback: IdleRequestCallback,
    options?: IdleRequestOptions
  ) => number;
};

/**
 * Mobile utility functions for enhanced mobile experience
 */

// Device detection utilities
export const isMobileDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < 768;
};

export const isTabletDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth >= 768 && window.innerWidth < 1024;
};

export const isTouchDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
};

export const isIOSDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
};

export const isAndroidDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  return /Android/.test(navigator.userAgent);
};

// Keyboard type mapping for mobile inputs
export const getOptimalKeyboardType = (
  inputType: string
): {
  inputMode?:
    | 'search'
    | 'text'
    | 'email'
    | 'tel'
    | 'url'
    | 'none'
    | 'numeric'
    | 'decimal';
  pattern?: string;
  autoComplete?: string;
  autoCapitalize?: 'off' | 'none' | 'on' | 'sentences' | 'words' | 'characters';
  autoCorrect?: 'on' | 'off';
} => {
  switch (inputType) {
    case 'email':
      return {
        inputMode: 'email',
        autoComplete: 'email',
        autoCapitalize: 'off',
        autoCorrect: 'off',
      };
    case 'tel':
    case 'phone':
      return {
        inputMode: 'tel',
        autoComplete: 'tel',
        autoCapitalize: 'off',
        autoCorrect: 'off',
      };
    case 'url':
      return {
        inputMode: 'url',
        autoComplete: 'url',
        autoCapitalize: 'off',
        autoCorrect: 'off',
      };
    case 'number':
    case 'currency':
      return {
        inputMode: 'numeric',
        pattern: '[0-9]*',
        autoComplete: 'off',
        autoCapitalize: 'off',
        autoCorrect: 'off',
      };
    case 'decimal':
      return {
        inputMode: 'decimal',
        pattern: '[0-9]*',
        autoComplete: 'off',
        autoCapitalize: 'off',
        autoCorrect: 'off',
      };
    case 'search':
      return {
        inputMode: 'search',
        autoComplete: 'off',
        autoCapitalize: 'off',
      };
    case 'password':
      return {
        autoComplete: 'current-password',
        autoCapitalize: 'off',
        autoCorrect: 'off',
      };
    case 'new-password':
      return {
        autoComplete: 'new-password',
        autoCapitalize: 'off',
        autoCorrect: 'off',
      };
    case 'name':
      return {
        autoComplete: 'name',
        autoCapitalize: 'words',
      };
    case 'given-name':
      return {
        autoComplete: 'given-name',
        autoCapitalize: 'words',
      };
    case 'family-name':
      return {
        autoComplete: 'family-name',
        autoCapitalize: 'words',
      };
    default:
      return {
        autoCapitalize: 'sentences',
      };
  }
};

// Touch target size validation
export const validateTouchTarget = (element: HTMLElement): boolean => {
  const rect = element.getBoundingClientRect();
  const minSize = 44; // 44px minimum as per WCAG guidelines
  return rect.width >= minSize && rect.height >= minSize;
};

// Viewport utilities
export const getViewportHeight = (): number => {
  if (typeof window === 'undefined') return 0;
  return window.innerHeight;
};

export const getDynamicViewportHeight = (): number => {
  if (typeof window === 'undefined') return 0;
  // Use dynamic viewport height if available (better for mobile)
  return window.visualViewport?.height ?? window.innerHeight;
};

// Keyboard detection
export const isVirtualKeyboardOpen = (): boolean => {
  if (typeof window === 'undefined') return false;

  const visualViewport = window.visualViewport;
  if (visualViewport) {
    return visualViewport.height < window.innerHeight * 0.75;
  }

  // Fallback for older browsers
  return window.innerHeight < window.screen.height * 0.75;
};

// Safe area utilities for iOS
export const getSafeAreaInsets = () => {
  if (typeof window === 'undefined')
    return { top: 0, bottom: 0, left: 0, right: 0 };

  const style = getComputedStyle(document.documentElement);
  return {
    top: parseInt(style.getPropertyValue('env(safe-area-inset-top)') || '0'),
    bottom: parseInt(
      style.getPropertyValue('env(safe-area-inset-bottom)') || '0'
    ),
    left: parseInt(style.getPropertyValue('env(safe-area-inset-left)') || '0'),
    right: parseInt(
      style.getPropertyValue('env(safe-area-inset-right)') || '0'
    ),
  };
};

// Scroll utilities
export const preventBodyScroll = () => {
  if (typeof document === 'undefined') return;
  document.body.style.overflow = 'hidden';
  document.body.style.position = 'fixed';
  document.body.style.width = '100%';
};

export const restoreBodyScroll = () => {
  if (typeof document === 'undefined') return;
  document.body.style.overflow = '';
  document.body.style.position = '';
  document.body.style.width = '';
};

// Form utilities
export const scrollToFormError = (errorElement: HTMLElement) => {
  if (!errorElement) return;

  const offset = isMobileDevice() ? 100 : 50;
  const elementPosition =
    errorElement.getBoundingClientRect().top + window.pageYOffset;
  const offsetPosition = elementPosition - offset;

  window.scrollTo({
    top: offsetPosition,
    behavior: 'smooth',
  });
};

// Network utilities
export const getConnectionType = (): string => {
  if (typeof navigator === 'undefined') return 'unknown';

  const networkNavigator = navigator as NetworkAwareNavigator;
  const connection =
    networkNavigator.connection ||
    networkNavigator.mozConnection ||
    networkNavigator.webkitConnection;
  return connection?.effectiveType || 'unknown';
};

export const isSlowConnection = (): boolean => {
  const connectionType = getConnectionType();
  return ['slow-2g', '2g'].includes(connectionType);
};

// Performance utilities
export const requestIdleCallback = (callback: () => void, timeout = 5000) => {
  if (typeof window === 'undefined') return;

  const browserWindow = window as WindowWithIdleCallback;
  if (typeof browserWindow.requestIdleCallback === 'function') {
    browserWindow.requestIdleCallback(() => callback(), { timeout });
  } else {
    // Fallback for browsers that don't support requestIdleCallback
    setTimeout(callback, 1);
  }
};

// Gesture utilities
export const addSwipeGesture = (
  element: HTMLElement,
  onSwipeLeft?: () => void,
  onSwipeRight?: () => void,
  threshold = 50
) => {
  let startX = 0;
  let startY = 0;
  let endX = 0;
  let endY = 0;

  const handleTouchStart = (e: TouchEvent) => {
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: TouchEvent) => {
    endX = e.changedTouches[0].clientX;
    endY = e.changedTouches[0].clientY;

    const deltaX = endX - startX;
    const deltaY = endY - startY;

    // Check if horizontal swipe is more significant than vertical
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > threshold) {
      if (deltaX > 0 && onSwipeRight) {
        onSwipeRight();
      } else if (deltaX < 0 && onSwipeLeft) {
        onSwipeLeft();
      }
    }
  };

  element.addEventListener('touchstart', handleTouchStart, { passive: true });
  element.addEventListener('touchend', handleTouchEnd, { passive: true });

  // Return cleanup function
  return () => {
    element.removeEventListener('touchstart', handleTouchStart);
    element.removeEventListener('touchend', handleTouchEnd);
  };
};

// Orientation utilities
export const getOrientation = (): 'portrait' | 'landscape' => {
  if (typeof window === 'undefined') return 'portrait';
  return window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
};

export const onOrientationChange = (
  callback: (orientation: 'portrait' | 'landscape') => void
) => {
  if (typeof window === 'undefined') return () => {};

  const handleOrientationChange = () => {
    // Small delay to ensure dimensions are updated
    setTimeout(() => {
      callback(getOrientation());
    }, 100);
  };

  window.addEventListener('orientationchange', handleOrientationChange);
  window.addEventListener('resize', handleOrientationChange);

  return () => {
    window.removeEventListener('orientationchange', handleOrientationChange);
    window.removeEventListener('resize', handleOrientationChange);
  };
};

// Focus management for mobile
export const manageMobileFocus = (element: HTMLElement) => {
  if (!isMobileDevice()) return;

  // Prevent zoom on iOS when focusing inputs
  if (isIOSDevice()) {
    const originalFontSize = element.style.fontSize;
    element.style.fontSize = '16px';

    const restoreFontSize = () => {
      element.style.fontSize = originalFontSize;
      element.removeEventListener('blur', restoreFontSize);
    };

    element.addEventListener('blur', restoreFontSize);
  }
};

// Debounced resize handler for mobile
export const createMobileResizeHandler = (
  callback: () => void,
  delay = 250
) => {
  let timeoutId: NodeJS.Timeout;

  return () => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(callback, delay);
  };
};
