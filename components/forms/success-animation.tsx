'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { CheckCircle2, Sparkles } from 'lucide-react';
import { usePerformanceMonitor, bundleAnalysis } from '@/lib/performance-monitor';

interface SuccessAnimationProps {
  size?: 'sm' | 'md' | 'lg';
  showSparkles?: boolean;
  duration?: number;
  onComplete?: () => void;
  className?: string;
}

export const SuccessAnimation = React.memo(function SuccessAnimation({
  size = 'md',
  showSparkles = true,
  duration = 1000,
  onComplete,
  className
}: SuccessAnimationProps) {
  const monitor = usePerformanceMonitor('SuccessAnimation');
  const startMarkRef = React.useRef<string>('');

  // Performance monitoring
  React.useLayoutEffect(() => {
    startMarkRef.current = monitor.startRender();
  });

  React.useLayoutEffect(() => {
    monitor.endRender(startMarkRef.current);
  });

  // Warn about large props in development
  React.useEffect(() => {
    bundleAnalysis.warnLargeProps('SuccessAnimation', { size, showSparkles, duration, className }, 200);
  }, [size, showSparkles, duration, className]);
  const [isVisible, setIsVisible] = React.useState(false);
  const [showCheck, setShowCheck] = React.useState(false);

  // Memoize size classes to prevent unnecessary re-renders
  const sizeClasses = React.useMemo(() => ({
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-16 w-16'
  }), []);

  const sparkleSize = React.useMemo(() => ({
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  }), []);

  // Memoize check icon size
  const checkIconSize = React.useMemo(() => 
    size === 'sm' ? 'h-5 w-5' : size === 'md' ? 'h-7 w-7' : 'h-9 w-9',
    [size]
  );

  // Memoize sparkle positions
  const sparklePositions = React.useMemo(() => ({
    top: size === 'sm' ? '-top-2 -right-1' : size === 'md' ? '-top-3 -right-2' : '-top-4 -right-3',
    bottom: size === 'sm' ? '-bottom-2 -left-1' : size === 'md' ? '-bottom-3 -left-2' : '-bottom-4 -left-3',
    side: size === 'sm' ? 'top-0 -left-3' : size === 'md' ? 'top-1 -left-4' : 'top-2 -left-5'
  }), [size]);

  React.useEffect(() => {
    // Start animation immediately
    setIsVisible(true);
    
    // Show check mark after initial scale
    const checkTimer = setTimeout(() => {
      setShowCheck(true);
    }, 200);

    // Complete animation
    const completeTimer = setTimeout(() => {
      onComplete?.();
    }, duration);

    return () => {
      clearTimeout(checkTimer);
      clearTimeout(completeTimer);
    };
  }, [duration, onComplete]);

  return (
    <div className={cn('relative flex items-center justify-center', className)}>
      {/* Main success circle */}
      <div
        className={cn(
          'relative rounded-full bg-hunks-green flex items-center justify-center transition-all duration-500 ease-out',
          sizeClasses[size],
          isVisible 
            ? 'scale-100 opacity-100' 
            : 'scale-0 opacity-0'
        )}
      >
        {/* Check mark */}
        <CheckCircle2
          className={cn(
            'text-white transition-all duration-300 ease-out',
            checkIconSize,
            showCheck 
              ? 'scale-100 opacity-100' 
              : 'scale-0 opacity-0'
          )}
        />
        
        {/* Pulse ring */}
        <div
          className={cn(
            'absolute inset-0 rounded-full bg-hunks-green animate-ping opacity-20',
            isVisible ? 'animate-ping' : ''
          )}
          style={{
            animationDuration: '1s',
            animationIterationCount: '2'
          }}
        />
      </div>

      {/* Sparkles */}
      {showSparkles && isVisible && (
        <>
          {/* Top sparkle */}
          <Sparkles
            className={cn(
              'absolute text-hunks-green animate-bounce',
              sparkleSize[size],
              sparklePositions.top
            )}
            style={{
              animationDelay: '0.3s',
              animationDuration: '0.8s',
              animationIterationCount: '2'
            }}
          />
          
          {/* Bottom sparkle */}
          <Sparkles
            className={cn(
              'absolute text-hunks-orange animate-bounce',
              sparkleSize[size],
              sparklePositions.bottom
            )}
            style={{
              animationDelay: '0.5s',
              animationDuration: '0.8s',
              animationIterationCount: '2'
            }}
          />
          
          {/* Side sparkle */}
          <Sparkles
            className={cn(
              'absolute text-hunks-green animate-bounce',
              sparkleSize[size],
              sparklePositions.side
            )}
            style={{
              animationDelay: '0.7s',
              animationDuration: '0.8s',
              animationIterationCount: '2'
            }}
          />
        </>
      )}
    </div>
  );
});

// Confetti-style success animation for major achievements
export const ConfettiSuccess = React.memo(function ConfettiSuccess({
  onComplete,
  className
}: {
  onComplete?: () => void;
  className?: string;
}) {
  const [particles, setParticles] = React.useState<Array<{
    id: number;
    x: number;
    y: number;
    color: string;
    delay: number;
  }>>([]);

  React.useEffect(() => {
    // Generate random particles
    const newParticles = Array.from({ length: 12 }, (_, i) => ({
      id: i,
      x: Math.random() * 200 - 100, // -100 to 100
      y: Math.random() * 200 - 100,
      color: i % 2 === 0 ? '#026937' : '#ea7200', // Alternate brand colors
      delay: Math.random() * 0.5
    }));
    
    setParticles(newParticles);

    // Complete animation
    const timer = setTimeout(() => {
      onComplete?.();
    }, 2000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className={cn('relative flex items-center justify-center', className)}>
      {/* Central success icon */}
      <SuccessAnimation size="lg" showSparkles={false} />
      
      {/* Confetti particles */}
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute w-2 h-2 rounded-full animate-bounce"
          style={{
            backgroundColor: particle.color,
            transform: `translate(${particle.x}px, ${particle.y}px)`,
            animationDelay: `${particle.delay}s`,
            animationDuration: '1.5s',
            animationIterationCount: '1',
            animationFillMode: 'forwards'
          }}
        />
      ))}
    </div>
  );
});

// Subtle success checkmark for inline feedback
export const InlineSuccessCheck = React.memo(function InlineSuccessCheck({
  className
}: {
  className?: string;
}) {
  const [isVisible, setIsVisible] = React.useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <CheckCircle2
      className={cn(
        'h-4 w-4 text-hunks-green transition-all duration-300 ease-out',
        isVisible 
          ? 'scale-100 opacity-100' 
          : 'scale-0 opacity-0',
        className
      )}
    />
  );
});

// Loading to success transition
export const LoadingToSuccess = React.memo(function LoadingToSuccess({
  isLoading,
  onComplete,
  className
}: {
  isLoading: boolean;
  onComplete?: () => void;
  className?: string;
}) {
  const [showSuccess, setShowSuccess] = React.useState(false);

  React.useEffect(() => {
    if (!isLoading && !showSuccess) {
      // Small delay before showing success
      const timer = setTimeout(() => {
        setShowSuccess(true);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [isLoading, showSuccess]);

  if (isLoading) {
    return (
      <div className={cn('flex items-center justify-center', className)}>
        <div className="h-8 w-8 rounded-full border-2 border-hunks-green border-t-transparent animate-spin" />
      </div>
    );
  }

  if (showSuccess) {
    return (
      <SuccessAnimation
        size="md"
        onComplete={onComplete}
        className={className}
      />
    );
  }

  return null;
});