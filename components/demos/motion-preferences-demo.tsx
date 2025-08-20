'use client';

import * as React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  CheckCircle2,
  Loader2,
  Sparkles,
  Settings,
  Play,
  Pause,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  useMotionPreference,
  getMicroInteractionClasses,
  ANIMATION_PRESETS,
} from '@/lib/motion-preferences';
import {
  FadeIn,
  SlideIn,
  SuccessMotion,
  HoverMotion,
  StaggeredMotion,
} from '@/components/ui/motion-wrapper';
import { BrandButton } from '@/components/brand/brand-button';
import { BrandLoading } from '@/components/brand/brand-loading';
import { SuccessAnimation } from '@/components/forms/success-animation';

export function MotionPreferencesDemo() {
  const { preference, prefersReducedMotion } = useMotionPreference();
  const [showAnimations, setShowAnimations] = React.useState(false);
  const [triggerSuccess, setTriggerSuccess] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(false);

  const handleTriggerAnimations = () => {
    setShowAnimations(!showAnimations);
  };

  const handleTriggerSuccess = () => {
    setTriggerSuccess((prev) => prev + 1);
  };

  const handleLoadingDemo = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 2000);
  };

  return (
    <div className="space-y-6 p-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Motion Preferences System</h1>
        <p className="text-muted-foreground">
          Motion-aware animations that respect user accessibility preferences
        </p>
      </div>

      {/* Motion Preference Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Current Motion Preference
          </CardTitle>
          <CardDescription>
            Your system&apos;s motion preference setting
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Badge variant={prefersReducedMotion ? 'destructive' : 'default'}>
              {preference === 'reduce' ? 'Reduced Motion' : 'No Preference'}
            </Badge>
            <p className="text-sm text-muted-foreground">
              {prefersReducedMotion
                ? 'Animations are simplified or disabled'
                : 'Full animations are enabled'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Animation Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Animation Controls</CardTitle>
          <CardDescription>Test different animation behaviors</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button onClick={handleTriggerAnimations} variant="outline">
              {showAnimations ? (
                <Pause className="h-4 w-4 mr-2" />
              ) : (
                <Play className="h-4 w-4 mr-2" />
              )}
              {showAnimations ? 'Reset' : 'Trigger'} Entrance Animations
            </Button>
            <Button onClick={handleTriggerSuccess} variant="outline">
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Trigger Success Animation
            </Button>
            <Button
              onClick={handleLoadingDemo}
              variant="outline"
              disabled={isLoading}
            >
              <Loader2
                className={cn('h-4 w-4 mr-2', isLoading && 'animate-spin')}
              />
              {isLoading ? 'Loading...' : 'Test Loading'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Motion Wrapper Examples */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Fade In Animation</CardTitle>
          </CardHeader>
          <CardContent>
            {showAnimations && (
              <FadeIn className="space-y-2">
                <div className="h-16 bg-hunks-green/20 rounded-md flex items-center justify-center">
                  <span className="text-sm font-medium">Fade In Content</span>
                </div>
              </FadeIn>
            )}
            {!showAnimations && (
              <div className="h-16 bg-muted rounded-md flex items-center justify-center">
                <span className="text-sm text-muted-foreground">
                  Click &quot;Trigger&quot; to see animation
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Slide In Animation</CardTitle>
          </CardHeader>
          <CardContent>
            {showAnimations && (
              <SlideIn className="space-y-2">
                <div className="h-16 bg-hunks-orange/20 rounded-md flex items-center justify-center">
                  <span className="text-sm font-medium">Slide In Content</span>
                </div>
              </SlideIn>
            )}
            {!showAnimations && (
              <div className="h-16 bg-muted rounded-md flex items-center justify-center">
                <span className="text-sm text-muted-foreground">
                  Click &quot;Trigger&quot; to see animation
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Success Animation</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center">
            <SuccessMotion key={triggerSuccess} trigger={triggerSuccess}>
              <SuccessAnimation
                size="md"
                showSparkles={!prefersReducedMotion}
                onComplete={() => {
                  // Animation completed
                }}
              />
            </SuccessMotion>
          </CardContent>
        </Card>
      </div>

      {/* Staggered Animation Example */}
      <Card>
        <CardHeader>
          <CardTitle>Staggered Animations</CardTitle>
          <CardDescription>
            Multiple items animating with delays
          </CardDescription>
        </CardHeader>
        <CardContent>
          {showAnimations && (
            <StaggeredMotion
              staggerDelay={100}
              className="grid grid-cols-2 md:grid-cols-4 gap-4"
            >
              {Array.from({ length: 8 }, (_, i) => (
                <div
                  key={i}
                  className="h-20 bg-gradient-to-br from-hunks-green/20 to-hunks-orange/20 rounded-md flex items-center justify-center"
                >
                  <span className="text-sm font-medium">Item {i + 1}</span>
                </div>
              ))}
            </StaggeredMotion>
          )}
          {!showAnimations && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Array.from({ length: 8 }, (_, i) => (
                <div
                  key={i}
                  className="h-20 bg-muted rounded-md flex items-center justify-center"
                >
                  <span className="text-sm text-muted-foreground">
                    Item {i + 1}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Micro-interactions */}
      <Card>
        <CardHeader>
          <CardTitle>Micro-interactions</CardTitle>
          <CardDescription>Subtle hover and focus effects</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <HoverMotion>
              <Card className="cursor-pointer">
                <CardContent className="p-4">
                  <div className="text-center">
                    <Sparkles className="h-8 w-8 mx-auto mb-2 text-hunks-green" />
                    <p className="text-sm font-medium">Hover Card</p>
                    <p className="text-xs text-muted-foreground">
                      Hover to see effect
                    </p>
                  </div>
                </CardContent>
              </Card>
            </HoverMotion>

            <div className={getMicroInteractionClasses('cardHover')}>
              <Card className="cursor-pointer">
                <CardContent className="p-4">
                  <div className="text-center">
                    <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-hunks-orange" />
                    <p className="text-sm font-medium">CSS Hover</p>
                    <p className="text-xs text-muted-foreground">
                      Pure CSS animation
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <Settings className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm font-medium">Static Card</p>
                  <p className="text-xs text-muted-foreground">
                    No hover effect
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Brand Components */}
      <Card>
        <CardHeader>
          <CardTitle>Brand Components with Motion</CardTitle>
          <CardDescription>
            Brand components that respect motion preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4 items-center">
            <BrandButton variant="primary" loading={isLoading}>
              Primary Button
            </BrandButton>
            <BrandButton variant="secondary" success={triggerSuccess > 0}>
              Success Button
            </BrandButton>
            <BrandButton variant="outline-primary">Outline Button</BrandButton>
          </div>

          <Separator />

          <div className="flex flex-wrap gap-4 items-center">
            <BrandLoading variant="spinner" size="sm" />
            <BrandLoading variant="dots" size="md" />
            <BrandLoading variant="pulse" size="lg" />
          </div>

          <Separator />

          <div className="text-sm text-muted-foreground space-y-1">
            <p>• Buttons have hover effects that respect motion preferences</p>
            <p>• Loading indicators adapt to reduced motion settings</p>
            <p>• Success states show appropriate feedback</p>
          </div>
        </CardContent>
      </Card>

      {/* Animation Presets */}
      <Card>
        <CardHeader>
          <CardTitle>Animation Presets</CardTitle>
          <CardDescription>Available animation configurations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(ANIMATION_PRESETS).map(([name, config]) => (
              <div key={name} className="p-3 border rounded-md">
                <h4 className="font-medium capitalize">
                  {name.replace(/([A-Z])/g, ' $1')}
                </h4>
                <div className="text-xs text-muted-foreground mt-1 space-y-1">
                  <div>Duration: {config.duration}ms</div>
                  <div>Easing: {config.easing}</div>
                  {'iterations' in config && config.iterations && (
                    <div>Iterations: {config.iterations}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Testing Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>To test reduced motion preferences:</p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>
              <strong>macOS:</strong> System Preferences → Accessibility →
              Display → Reduce motion
            </li>
            <li>
              <strong>Windows:</strong> Settings → Ease of Access → Display →
              Show animations
            </li>
            <li>
              <strong>Browser:</strong> DevTools → Rendering → Emulate CSS
              prefers-reduced-motion
            </li>
          </ul>
          <p className="mt-4">
            When reduced motion is enabled, animations will be simplified or
            replaced with static alternatives.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
