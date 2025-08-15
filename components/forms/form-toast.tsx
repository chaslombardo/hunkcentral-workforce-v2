'use client';

import * as React from 'react';
import { useToast } from '@/hooks/use-toast';


export interface FormToastOptions {
  title?: string;
  description: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export interface FormSubmissionToastOptions extends Omit<FormToastOptions, 'description'> {
  entityName?: string;
  showProgress?: boolean;
  description?: string;
}

// Enhanced toast hook with branded form-specific notifications
export function useFormToast() {
  const { toast, dismiss } = useToast();

  // Success toast with brand styling
  const showSuccess = React.useCallback((options: FormToastOptions) => {
    return toast({
      title: options.title,
      description: options.description,
      duration: options.duration || 4000,
      className: 'border-hunks-green/20 bg-hunks-green/5',
      action: options.action ? (
        <button
          onClick={options.action.onClick}
          className="inline-flex h-8 shrink-0 items-center justify-center rounded-md border border-hunks-green/20 bg-transparent px-3 text-sm font-medium text-hunks-green transition-colors hover:bg-hunks-green/10 focus:outline-none focus:ring-1 focus:ring-hunks-green disabled:pointer-events-none disabled:opacity-50"
        >
          {options.action.label}
        </button>
      ) : undefined,
    });
  }, [toast]);

  // Error toast with brand styling
  const showError = React.useCallback((options: FormToastOptions) => {
    return toast({
      title: options.title,
      description: options.description,
      duration: options.duration || 6000,
      variant: 'destructive',
      action: options.action ? (
        <button
          onClick={options.action.onClick}
          className="inline-flex h-8 shrink-0 items-center justify-center rounded-md border border-destructive/20 bg-transparent px-3 text-sm font-medium text-destructive-foreground transition-colors hover:bg-destructive/10 focus:outline-none focus:ring-1 focus:ring-destructive disabled:pointer-events-none disabled:opacity-50"
        >
          {options.action.label}
        </button>
      ) : undefined,
    });
  }, [toast]);

  // Warning toast with brand styling
  const showWarning = React.useCallback((options: FormToastOptions) => {
    return toast({
      title: options.title,
      description: options.description,
      duration: options.duration || 5000,
      className: 'border-hunks-orange/20 bg-hunks-orange/5',
      action: options.action ? (
        <button
          onClick={options.action.onClick}
          className="inline-flex h-8 shrink-0 items-center justify-center rounded-md border border-hunks-orange/20 bg-transparent px-3 text-sm font-medium text-hunks-orange transition-colors hover:bg-hunks-orange/10 focus:outline-none focus:ring-1 focus:ring-hunks-orange disabled:pointer-events-none disabled:opacity-50"
        >
          {options.action.label}
        </button>
      ) : undefined,
    });
  }, [toast]);

  // Info toast with brand styling
  const showInfo = React.useCallback((options: FormToastOptions) => {
    return toast({
      title: options.title,
      description: options.description,
      duration: options.duration || 4000,
      className: 'border-blue-200 bg-blue-50',
      action: options.action ? (
        <button
          onClick={options.action.onClick}
          className="inline-flex h-8 shrink-0 items-center justify-center rounded-md border border-blue-200 bg-transparent px-3 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-100 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:pointer-events-none disabled:opacity-50"
        >
          {options.action.label}
        </button>
      ) : undefined,
    });
  }, [toast]);

  // Loading toast for form submissions
  const showLoading = React.useCallback((options: FormToastOptions) => {
    return toast({
      title: options.title || 'Processing...',
      description: options.description,
      duration: options.duration || 0, // Don't auto-dismiss loading toasts
      className: 'border-hunks-green/20 bg-hunks-green/5',
    });
  }, [toast]);

  // Form submission success with animation
  const showSubmissionSuccess = React.useCallback((options: FormSubmissionToastOptions) => {
    const entityName = options.entityName || 'form';
    return showSuccess({
      title: options.title || 'Success!',
      description: options.description || `Your ${entityName} has been submitted successfully.`,
      duration: options.duration,
      action: options.action
    });
  }, [showSuccess]);

  // Form submission error with retry option
  const showSubmissionError = React.useCallback((options: FormSubmissionToastOptions & { onRetry?: () => void }) => {
    const entityName = options.entityName || 'form';
    return showError({
      title: options.title || 'Submission Failed',
      description: options.description || `Failed to submit your ${entityName}. Please try again.`,
      duration: options.duration,
      action: options.onRetry ? {
        label: 'Retry',
        onClick: options.onRetry
      } : options.action
    });
  }, [showError]);

  // Auto-save notification
  const showAutoSave = React.useCallback((entityName = 'changes') => {
    return showInfo({
      description: `Your ${entityName} have been automatically saved.`,
      duration: 2000
    });
  }, [showInfo]);

  // Validation error summary
  const showValidationError = React.useCallback((errorCount: number) => {
    return showWarning({
      title: 'Validation Error',
      description: `Please fix ${errorCount === 1 ? 'the error' : `${errorCount} errors`} in the form and try again.`,
      duration: 5000
    });
  }, [showWarning]);

  // Network error with retry
  const showNetworkError = React.useCallback((onRetry?: () => void) => {
    return showError({
      title: 'Connection Error',
      description: 'Unable to connect to the server. Please check your internet connection.',
      duration: 8000,
      action: onRetry ? {
        label: 'Retry',
        onClick: onRetry
      } : undefined
    });
  }, [showError]);

  // Permission error
  const showPermissionError = React.useCallback(() => {
    return showError({
      title: 'Permission Denied',
      description: 'You don\'t have permission to perform this action.',
      duration: 6000,
      action: {
        label: 'Login',
        onClick: () => window.location.href = '/auth/login'
      }
    });
  }, [showError]);

  return {
    // Basic toast methods
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showLoading,
    
    // Form-specific methods
    showSubmissionSuccess,
    showSubmissionError,
    showAutoSave,
    showValidationError,
    showNetworkError,
    showPermissionError,
    
    // Utility methods
    dismiss
  };
}

// Preset configurations for common form scenarios
export const formToastPresets = {
  // Success scenarios
  logSubmitted: {
    title: 'Log Submitted',
    description: 'Your daily log has been submitted for review.',
    entityName: 'log'
  },
  
  commissionCreated: {
    title: 'Commission Added',
    description: 'Commission entry has been created successfully.',
    entityName: 'commission'
  },
  
  userUpdated: {
    title: 'Profile Updated',
    description: 'Your profile information has been saved.',
    entityName: 'profile'
  },
  
  payPeriodClosed: {
    title: 'Pay Period Closed',
    description: 'The pay period has been successfully closed.',
    entityName: 'pay period'
  },

  // Error scenarios
  logSubmissionFailed: {
    title: 'Log Submission Failed',
    description: 'Unable to submit your log. Please check all fields and try again.',
    entityName: 'log'
  },
  
  commissionError: {
    title: 'Commission Error',
    description: 'Failed to create commission entry. Please verify the job details.',
    entityName: 'commission'
  },
  
  payrollError: {
    title: 'Payroll Error',
    description: 'Unable to generate payroll report. Please contact support.',
    entityName: 'payroll report'
  },

  // Warning scenarios
  unsavedChanges: {
    title: 'Unsaved Changes',
    description: 'You have unsaved changes that will be lost if you leave this page.'
  },
  
  sessionExpiring: {
    title: 'Session Expiring',
    description: 'Your session will expire in 5 minutes. Save your work to avoid losing changes.'
  },

  // Info scenarios
  autoSaveEnabled: {
    title: 'Auto-save Enabled',
    description: 'Your changes will be automatically saved every 30 seconds.'
  },
  
  formTips: {
    title: 'Form Tips',
    description: 'Click the help icon next to any field for additional guidance.'
  }
};

// Hook for managing form submission state with toasts
export function useFormSubmission() {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const formToast = useFormToast();

  const submitForm = React.useCallback(async (
    submitFn: () => Promise<void>,
    options: {
      entityName?: string;
      loadingMessage?: string;
      successMessage?: string;
      errorMessage?: string;
      onSuccess?: () => void;
      onError?: (error: Error) => void;
    } = {}
  ) => {
    setIsSubmitting(true);
    setSubmitError(null);

    // Show loading toast
    const loadingToast = formToast.showLoading({
      title: 'Submitting...',
      description: options.loadingMessage || `Submitting your ${options.entityName || 'form'}...`
    });

    try {
      await submitFn();
      
      // Dismiss loading toast
      formToast.dismiss(loadingToast.id);
      
      // Show success toast
      formToast.showSubmissionSuccess({
        description: options.successMessage,
        entityName: options.entityName
      });
      
      options.onSuccess?.();
    } catch (error) {
      // Dismiss loading toast
      formToast.dismiss(loadingToast.id);
      
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      setSubmitError(errorMessage);
      
      // Show error toast with retry option
      formToast.showSubmissionError({
        description: options.errorMessage || errorMessage,
        entityName: options.entityName,
        onRetry: () => submitForm(submitFn, options)
      });
      
      options.onError?.(error instanceof Error ? error : new Error(errorMessage));
    } finally {
      setIsSubmitting(false);
    }
  }, [formToast]);

  return {
    isSubmitting,
    submitError,
    submitForm,
    clearError: () => setSubmitError(null)
  };
}