'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { 
  AlertCircle, 
  AlertTriangle,
  Info, 
  RefreshCw,
  ExternalLink,
  Lightbulb
} from 'lucide-react';
import { InlineSuccessCheck } from './success-animation';
import { usePerformanceMonitor, bundleAnalysis } from '@/lib/performance-monitor';

export interface FormFeedbackProps {
  type: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
  details?: string;
  suggestions?: string[];
  actions?: Array<{
    label: string;
    onClick: () => void;
    variant?: 'default' | 'outline' | 'ghost';
    icon?: React.ComponentType<{ className?: string }>;
  }>;
  helpLink?: {
    text: string;
    url: string;
  };
  onRetry?: () => void;
  onDismiss?: () => void;
  showAnimation?: boolean;
  className?: string;
}

const feedbackVariants = {
  success: {
    icon: InlineSuccessCheck,
    alertClass: 'border-hunks-green/20 bg-hunks-green/5',
    iconClass: 'text-hunks-green',
    titleClass: 'text-hunks-green',
    messageClass: 'text-hunks-green/90',
    animationClass: 'animate-in slide-in-from-top-2 duration-500'
  },
  error: {
    icon: AlertCircle,
    alertClass: 'border-destructive/20 bg-destructive/5',
    iconClass: 'text-destructive',
    titleClass: 'text-destructive',
    messageClass: 'text-destructive/90',
    animationClass: 'animate-in slide-in-from-top-2 duration-300'
  },
  warning: {
    icon: AlertTriangle,
    alertClass: 'border-hunks-orange/20 bg-hunks-orange/5',
    iconClass: 'text-hunks-orange',
    titleClass: 'text-hunks-orange',
    messageClass: 'text-hunks-orange/90',
    animationClass: 'animate-in slide-in-from-top-2 duration-400'
  },
  info: {
    icon: Info,
    alertClass: 'border-blue-200 bg-blue-50',
    iconClass: 'text-blue-600',
    titleClass: 'text-blue-800',
    messageClass: 'text-blue-700',
    animationClass: 'animate-in slide-in-from-top-2 duration-400'
  }
};

export const FormFeedback = React.memo(function FormFeedback({
  type,
  title,
  message,
  details,
  suggestions = [],
  actions = [],
  helpLink,
  onRetry,
  onDismiss,
  showAnimation = true,
  className
}: FormFeedbackProps) {
  const monitor = usePerformanceMonitor('FormFeedback');
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
    bundleAnalysis.warnLargeProps('FormFeedback', { actions, suggestions }, 300);
  }, [actions, suggestions]);

  // Memoize variant and icon
  const variant = React.useMemo(() => feedbackVariants[type], [type]);
  const Icon = React.useMemo(() => variant.icon, [variant]);

  // Auto-dismiss success messages after 5 seconds
  React.useEffect(() => {
    if (type === 'success' && onDismiss) {
      const timer = setTimeout(() => {
        onDismiss();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [type, onDismiss]);

  return (
    <Alert 
      className={cn(
        variant.alertClass,
        showAnimation && variant.animationClass,
        'relative',
        className
      )}
    >
      <Icon className={cn('h-4 w-4', variant.iconClass)} />
      
      <div className="flex-1">
        {title && (
          <AlertTitle className={cn('mb-2', variant.titleClass)}>
            {title}
          </AlertTitle>
        )}
        
        <AlertDescription className={variant.messageClass}>
          <div className="space-y-3">
            {/* Main message */}
            <p>{message}</p>
            
            {/* Additional details */}
            {details && (
              <p className="text-sm opacity-80">
                {details}
              </p>
            )}
            
            {/* Suggestions */}
            {suggestions.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Lightbulb className="h-3 w-3" />
                  Suggestions:
                </div>
                <ul className="text-sm space-y-1 ml-5">
                  {suggestions.map((suggestion, index) => (
                    <li key={index} className="list-disc">
                      {suggestion}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {/* Actions */}
            {(actions.length > 0 || onRetry || helpLink) && (
              <div className="flex flex-wrap items-center gap-2 pt-2">
                {/* Retry button */}
                {onRetry && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onRetry}
                    className="h-8"
                  >
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Try Again
                  </Button>
                )}
                
                {/* Custom actions */}
                {actions.map((action, index) => {
                  const ActionIcon = action.icon;
                  return (
                    <Button
                      key={index}
                      variant={action.variant || 'outline'}
                      size="sm"
                      onClick={action.onClick}
                      className="h-8"
                    >
                      {ActionIcon && <ActionIcon className="h-3 w-3 mr-1" />}
                      {action.label}
                    </Button>
                  );
                })}
                
                {/* Help link */}
                {helpLink && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(helpLink.url, '_blank')}
                    className="h-8 text-xs"
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    {helpLink.text}
                  </Button>
                )}
              </div>
            )}
          </div>
        </AlertDescription>
      </div>
      
      {/* Dismiss button */}
      {onDismiss && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onDismiss}
          className="absolute top-2 right-2 h-6 w-6 p-0 hover:bg-black/5"
        >
          <span className="sr-only">Dismiss</span>
          ×
        </Button>
      )}
    </Alert>
  );
});

// Preset configurations for common form feedback scenarios
export const formFeedbackPresets = {
  // Success presets
  formSubmitted: (entityName = 'form'): Omit<FormFeedbackProps, 'type'> => ({
    title: 'Success!',
    message: `Your ${entityName} has been submitted successfully.`,
    showAnimation: true
  }),

  dataSaved: (entityName = 'data'): Omit<FormFeedbackProps, 'type'> => ({
    title: 'Saved',
    message: `Your ${entityName} has been saved.`,
    showAnimation: true
  }),

  // Error presets
  validationError: (fieldCount = 1): Omit<FormFeedbackProps, 'type'> => ({
    title: 'Validation Error',
    message: `Please fix ${fieldCount === 1 ? 'the error' : `${fieldCount} errors`} below and try again.`,
    suggestions: [
      'Check all required fields are filled',
      'Ensure all data is in the correct format',
      'Review any highlighted fields for specific requirements'
    ]
  }),

  networkError: (): Omit<FormFeedbackProps, 'type'> => ({
    title: 'Connection Error',
    message: 'Unable to submit your form due to a network issue.',
    details: 'Please check your internet connection and try again.',
    suggestions: [
      'Check your internet connection',
      'Try refreshing the page',
      'Contact support if the problem persists'
    ],
    helpLink: {
      text: 'Contact Support',
      url: '/support'
    }
  }),

  serverError: (): Omit<FormFeedbackProps, 'type'> => ({
    title: 'Server Error',
    message: 'Something went wrong on our end.',
    details: 'Our team has been notified and is working to fix this issue.',
    suggestions: [
      'Try submitting again in a few minutes',
      'Save your work locally if possible',
      'Contact support if you need immediate assistance'
    ],
    helpLink: {
      text: 'Contact Support',
      url: '/support'
    }
  }),

  permissionError: (): Omit<FormFeedbackProps, 'type'> => ({
    title: 'Permission Denied',
    message: 'You don\'t have permission to perform this action.',
    suggestions: [
      'Contact your administrator for access',
      'Make sure you\'re logged in with the correct account',
      'Check if your session has expired'
    ],
    actions: [
      {
        label: 'Login Again',
        onClick: () => window.location.href = '/auth/login',
        variant: 'outline' as const
      }
    ]
  }),

  // Warning presets
  unsavedChanges: (onSave: () => void, onDiscard: () => void): Omit<FormFeedbackProps, 'type'> => ({
    title: 'Unsaved Changes',
    message: 'You have unsaved changes that will be lost.',
    actions: [
      {
        label: 'Save Changes',
        onClick: onSave,
        variant: 'default' as const
      },
      {
        label: 'Discard Changes',
        onClick: onDiscard,
        variant: 'outline' as const
      }
    ]
  }),

  // Info presets
  autoSaved: (): Omit<FormFeedbackProps, 'type'> => ({
    message: 'Your changes have been automatically saved.',
    showAnimation: false
  }),

  formTips: (tips: string[]): Omit<FormFeedbackProps, 'type'> => ({
    title: 'Tips',
    message: 'Here are some tips to help you complete this form:',
    suggestions: tips
  })
};

// Hook for managing form feedback state
export function useFormFeedback() {
  const [feedback, setFeedback] = React.useState<(FormFeedbackProps & { id: string }) | null>(null);

  const showFeedback = React.useCallback((props: Omit<FormFeedbackProps, 'onDismiss'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    setFeedback({
      ...props,
      id,
      onDismiss: () => setFeedback(null)
    });
  }, []);

  const clearFeedback = React.useCallback(() => {
    setFeedback(null);
  }, []);

  // Convenience methods for common feedback types
  const showSuccess = React.useCallback((props: Omit<FormFeedbackProps, 'type' | 'onDismiss'>) => {
    showFeedback({ ...props, type: 'success' });
  }, [showFeedback]);

  const showError = React.useCallback((props: Omit<FormFeedbackProps, 'type' | 'onDismiss'>) => {
    showFeedback({ ...props, type: 'error' });
  }, [showFeedback]);

  const showWarning = React.useCallback((props: Omit<FormFeedbackProps, 'type' | 'onDismiss'>) => {
    showFeedback({ ...props, type: 'warning' });
  }, [showFeedback]);

  const showInfo = React.useCallback((props: Omit<FormFeedbackProps, 'type' | 'onDismiss'>) => {
    showFeedback({ ...props, type: 'info' });
  }, [showFeedback]);

  return {
    feedback,
    showFeedback,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    clearFeedback
  };
}