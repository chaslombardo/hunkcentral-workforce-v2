'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { addSwipeGesture, isMobileDevice } from '@/lib/mobile-utils';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';

export interface SwipeGestureProps {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  threshold?: number;
  className?: string;
  disabled?: boolean;
  enableHapticFeedback?: boolean;
}

export function SwipeGesture({
  children,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  threshold = 50,
  className,
  disabled = false,
  enableHapticFeedback = true,
}: SwipeGestureProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = React.useState(false);
  const { selectionFeedback } = useHapticFeedback();

  // Check if mobile on mount and resize
  React.useEffect(() => {
    const checkMobile = () => setIsMobile(isMobileDevice());
    checkMobile();

    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  React.useEffect(() => {
    if (!containerRef.current || !isMobile || disabled) return;

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

      // Determine if swipe is more horizontal or vertical
      const isHorizontalSwipe = Math.abs(deltaX) > Math.abs(deltaY);

      if (isHorizontalSwipe && Math.abs(deltaX) > threshold) {
        if (enableHapticFeedback) selectionFeedback();

        if (deltaX > 0 && onSwipeRight) {
          onSwipeRight();
        } else if (deltaX < 0 && onSwipeLeft) {
          onSwipeLeft();
        }
      } else if (!isHorizontalSwipe && Math.abs(deltaY) > threshold) {
        if (enableHapticFeedback) selectionFeedback();

        if (deltaY > 0 && onSwipeDown) {
          onSwipeDown();
        } else if (deltaY < 0 && onSwipeUp) {
          onSwipeUp();
        }
      }
    };

    const element = containerRef.current;
    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [
    isMobile,
    disabled,
    threshold,
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    enableHapticFeedback,
    selectionFeedback,
  ]);

  return (
    <div
      ref={containerRef}
      className={cn('touch-manipulation', isMobile && 'select-none', className)}
    >
      {children}
    </div>
  );
}

// Pull to refresh component
export interface PullToRefreshProps {
  children: React.ReactNode;
  onRefresh: () => Promise<void>;
  refreshThreshold?: number;
  className?: string;
  disabled?: boolean;
  refreshingText?: string;
  pullText?: string;
  releaseText?: string;
}

export function PullToRefresh({
  children,
  onRefresh,
  refreshThreshold = 80,
  className,
  disabled = false,
  refreshingText = 'Refreshing...',
  pullText = 'Pull to refresh',
  releaseText = 'Release to refresh',
}: PullToRefreshProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = React.useState(false);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [pullDistance, setPullDistance] = React.useState(0);
  const [isPulling, setIsPulling] = React.useState(false);
  const { impactFeedback } = useHapticFeedback();

  // Check if mobile on mount and resize
  React.useEffect(() => {
    const checkMobile = () => setIsMobile(isMobileDevice());
    checkMobile();

    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  React.useEffect(() => {
    if (!containerRef.current || !isMobile || disabled || isRefreshing) return;

    let startY = 0;
    let currentY = 0;
    let isAtTop = false;

    const handleTouchStart = (e: TouchEvent) => {
      // Check if we're at the top of the scrollable area
      isAtTop = containerRef.current!.scrollTop === 0;
      if (isAtTop) {
        startY = e.touches[0].clientY;
        setIsPulling(true);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isAtTop || !isPulling) return;

      currentY = e.touches[0].clientY;
      const distance = Math.max(0, currentY - startY);

      if (distance > 0) {
        e.preventDefault(); // Prevent default scroll behavior
        setPullDistance(Math.min(distance, refreshThreshold * 1.5));
      }
    };

    const handleTouchEnd = async () => {
      if (!isPulling) return;

      setIsPulling(false);

      if (pullDistance >= refreshThreshold) {
        impactFeedback();
        setIsRefreshing(true);

        try {
          await onRefresh();
        } finally {
          setIsRefreshing(false);
        }
      }

      setPullDistance(0);
    };

    const element = containerRef.current;
    element.addEventListener('touchstart', handleTouchStart, {
      passive: false,
    });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [
    isMobile,
    disabled,
    isRefreshing,
    isPulling,
    pullDistance,
    refreshThreshold,
    onRefresh,
    impactFeedback,
  ]);

  const getRefreshText = () => {
    if (isRefreshing) return refreshingText;
    if (pullDistance >= refreshThreshold) return releaseText;
    return pullText;
  };

  const refreshOpacity = Math.min(pullDistance / refreshThreshold, 1);
  const refreshScale = Math.min(
    0.8 + (pullDistance / refreshThreshold) * 0.2,
    1
  );

  return (
    <div
      ref={containerRef}
      className={cn('relative overflow-auto touch-manipulation', className)}
      style={{
        transform: isPulling
          ? `translateY(${Math.min(pullDistance * 0.5, 40)}px)`
          : undefined,
        transition: isPulling ? 'none' : 'transform 0.3s ease-out',
      }}
    >
      {/* Pull to refresh indicator */}
      {isMobile && (pullDistance > 0 || isRefreshing) && (
        <div
          className="absolute top-0 left-0 right-0 flex items-center justify-center py-4 text-sm text-muted-foreground z-10"
          style={{
            opacity: refreshOpacity,
            transform: `scale(${refreshScale}) translateY(-100%)`,
            transition: isPulling ? 'none' : 'all 0.3s ease-out',
          }}
        >
          <div className="flex items-center gap-2">
            {isRefreshing ? (
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            ) : (
              <div
                className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full"
                style={{
                  transform: `rotate(${pullDistance * 2}deg)`,
                }}
              />
            )}
            <span>{getRefreshText()}</span>
          </div>
        </div>
      )}

      {children}
    </div>
  );
}

// Long press gesture component
export interface LongPressProps {
  children: React.ReactNode;
  onLongPress: () => void;
  delay?: number;
  className?: string;
  disabled?: boolean;
  enableHapticFeedback?: boolean;
}

export function LongPress({
  children,
  onLongPress,
  delay = 500,
  className,
  disabled = false,
  enableHapticFeedback = true,
}: LongPressProps) {
  const [isPressed, setIsPressed] = React.useState(false);
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const { impactFeedback } = useHapticFeedback();

  const handleStart = React.useCallback(() => {
    if (disabled) return;

    setIsPressed(true);
    timeoutRef.current = setTimeout(() => {
      if (enableHapticFeedback) impactFeedback();
      onLongPress();
      setIsPressed(false);
    }, delay);
  }, [disabled, delay, onLongPress, enableHapticFeedback, impactFeedback]);

  const handleEnd = React.useCallback(() => {
    setIsPressed(false);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <div
      className={cn(
        'touch-manipulation select-none',
        isPressed && 'scale-95 opacity-80',
        'transition-all duration-150',
        className
      )}
      onTouchStart={handleStart}
      onTouchEnd={handleEnd}
      onTouchCancel={handleEnd}
      onMouseDown={handleStart}
      onMouseUp={handleEnd}
      onMouseLeave={handleEnd}
    >
      {children}
    </div>
  );
}

// Pinch to zoom gesture component
export interface PinchToZoomProps {
  children: React.ReactNode;
  onZoom?: (scale: number) => void;
  minScale?: number;
  maxScale?: number;
  className?: string;
  disabled?: boolean;
}

export function PinchToZoom({
  children,
  onZoom,
  minScale = 0.5,
  maxScale = 3,
  className,
  disabled = false,
}: PinchToZoomProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [scale, setScale] = React.useState(1);
  const [isMobile, setIsMobile] = React.useState(false);

  // Check if mobile on mount and resize
  React.useEffect(() => {
    const checkMobile = () => setIsMobile(isMobileDevice());
    checkMobile();

    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  React.useEffect(() => {
    if (!containerRef.current || !isMobile || disabled) return;

    let initialDistance = 0;
    let initialScale = scale;

    const getDistance = (touches: TouchList) => {
      const touch1 = touches[0];
      const touch2 = touches[1];
      return Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) +
          Math.pow(touch2.clientY - touch1.clientY, 2)
      );
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        initialDistance = getDistance(e.touches);
        initialScale = scale;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        const currentDistance = getDistance(e.touches);
        const scaleChange = currentDistance / initialDistance;
        const newScale = Math.max(
          minScale,
          Math.min(maxScale, initialScale * scaleChange)
        );

        setScale(newScale);
        onZoom?.(newScale);
      }
    };

    const element = containerRef.current;
    element.addEventListener('touchstart', handleTouchStart, {
      passive: false,
    });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
    };
  }, [isMobile, disabled, scale, minScale, maxScale, onZoom]);

  return (
    <div
      ref={containerRef}
      className={cn('touch-manipulation overflow-hidden', className)}
      style={{
        transform: `scale(${scale})`,
        transformOrigin: 'center',
        transition: 'transform 0.1s ease-out',
      }}
    >
      {children}
    </div>
  );
}
