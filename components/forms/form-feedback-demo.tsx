'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { FormFeedback, useFormFeedback, formFeedbackPresets } from './form-feedback';
import { useFormToast, useFormSubmission, formToastPresets } from './form-toast';
import { SmartInput, commonValidationRules } from './smart-input';

export function FormFeedbackDemo() {
  const { feedback, showSuccess, showError, showWarning, showInfo, clearFeedback } = useFormFeedback();
  const formToast = useFormToast();
  const { isSubmitting, submitForm } = useFormSubmission();
  
  const [demoValue, setDemoValue] = React.useState('');

  // Demo functions for different feedback scenarios
  const demoSuccess = () => {
    showSuccess(formFeedbackPresets.formSubmitted('daily log'));
  };

  const demoError = () => {
    showError(formFeedbackPresets.validationError(3));
  };

  const demoWarning = () => {
    showWarning(formFeedbackPresets.unsavedChanges(
      () => {/* Save action */},
      () => {/* Discard action */}
    ));
  };

  const demoInfo = () => {
    showInfo(formFeedbackPresets.formTips([
      'Use the tab key to navigate between fields',
      'Required fields are marked with an asterisk (*)',
      'Your progress is automatically saved every 30 seconds'
    ]));
  };

  // Toast demo functions
  const demoSuccessToast = () => {
    formToast.showSubmissionSuccess({
      entityName: 'daily log',
      description: 'Your log has been submitted and is now pending review.'
    });
  };

  const demoErrorToast = () => {
    formToast.showSubmissionError({
      entityName: 'commission',
      description: 'Failed to create commission entry. Please check the job ID and try again.',
      onRetry: () => {/* Retry action */}
    });
  };

  const demoWarningToast = () => {
    formToast.showWarning({
      title: 'Unsaved Changes',
      description: 'You have unsaved changes that will be lost if you leave this page.',
      action: {
        label: 'Save Now',
        onClick: () => {/* Save action */}
      }
    });
  };

  const demoLoadingToast = () => {
    formToast.showLoading({
      title: 'Processing...',
      description: 'Submitting your daily log for review...'
    });
  };

  const demoNetworkError = () => {
    formToast.showNetworkError(() => {/* Retry network request */});
  };

  const demoValidationError = () => {
    formToast.showValidationError(2);
  };

  const demoAutoSave = () => {
    formToast.showAutoSave('form data');
  };

  // Form submission demo
  const demoFormSubmission = () => {
    submitForm(
      async () => {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 2000));
        // Simulate random success/failure
        if (Math.random() > 0.5) {
          throw new Error('Simulated submission error');
        }
      },
      {
        entityName: 'daily log',
        loadingMessage: 'Submitting your daily log...',
        successMessage: 'Your daily log has been submitted successfully!',
        errorMessage: 'Failed to submit daily log. Please try again.',
        onSuccess: () => {/* Form submitted successfully */},
        onError: (error) => {/* Form submission failed: */ error}
      }
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Form Feedback System</CardTitle>
          <CardDescription>
            Enhanced form feedback components with branded styling and animations.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current Feedback Display */}
          {feedback && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Current Feedback:</h3>
              <FormFeedback {...feedback} />
            </div>
          )}

          <Separator />

          {/* Inline Feedback Demos */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Inline Feedback Messages</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button onClick={demoSuccess} variant="outline" className="justify-start">
                Show Success Message
              </Button>
              <Button onClick={demoError} variant="outline" className="justify-start">
                Show Error Message
              </Button>
              <Button onClick={demoWarning} variant="outline" className="justify-start">
                Show Warning Message
              </Button>
              <Button onClick={demoInfo} variant="outline" className="justify-start">
                Show Info Message
              </Button>
            </div>
            {feedback && (
              <Button onClick={clearFeedback} variant="ghost" size="sm">
                Clear Feedback
              </Button>
            )}
          </div>

          <Separator />

          {/* Toast Demos */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Toast Notifications</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button onClick={demoSuccessToast} variant="outline" className="justify-start">
                Success Toast
              </Button>
              <Button onClick={demoErrorToast} variant="outline" className="justify-start">
                Error Toast
              </Button>
              <Button onClick={demoWarningToast} variant="outline" className="justify-start">
                Warning Toast
              </Button>
              <Button onClick={demoLoadingToast} variant="outline" className="justify-start">
                Loading Toast
              </Button>
              <Button onClick={demoNetworkError} variant="outline" className="justify-start">
                Network Error
              </Button>
              <Button onClick={demoValidationError} variant="outline" className="justify-start">
                Validation Error
              </Button>
              <Button onClick={demoAutoSave} variant="outline" className="justify-start">
                Auto-save Notice
              </Button>
            </div>
          </div>

          <Separator />

          {/* Form Submission Demo */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Form Submission with Feedback</h3>
            <div className="space-y-4">
              <SmartInput
                label="Demo Input Field"
                value={demoValue}
                onValueChange={setDemoValue}
                hint="This field demonstrates real-time validation"
                validateOnChange
                progressiveValidation
                validationRules={[
                  commonValidationRules.required(),
                  commonValidationRules.minLength(3),
                  commonValidationRules.characterCount(50)
                ]}
                placeholder="Enter some text to see validation in action"
              />
              <Button 
                onClick={demoFormSubmission} 
                disabled={isSubmitting}
                className="bg-hunks-green hover:bg-hunks-green/90"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Demo Form'}
              </Button>
              <p className="text-sm text-muted-foreground">
                This will randomly succeed or fail to demonstrate both success and error handling.
              </p>
            </div>
          </div>

          <Separator />

          {/* Static Examples */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Static Examples</h3>
            <div className="space-y-4">
              <FormFeedback
                type="success"
                title="Form Submitted Successfully"
                message="Your daily log has been submitted and is now pending manager review."
                showAnimation={false}
              />
              
              <FormFeedback
                type="error"
                title="Validation Error"
                message="Please fix the following errors before submitting:"
                suggestions={[
                  'Job ID is required and must be in format ABC123',
                  'Revenue must be a positive number',
                  'At least one employee must be assigned to the job'
                ]}
                onRetry={() => {/* Retry clicked */}}
                showAnimation={false}
              />
              
              <FormFeedback
                type="warning"
                title="Unsaved Changes"
                message="You have unsaved changes that will be lost if you navigate away."
                actions={[
                  {
                    label: 'Save Changes',
                    onClick: () => {/* Save clicked */},
                    variant: 'default'
                  },
                  {
                    label: 'Discard',
                    onClick: () => {/* Discard clicked */},
                    variant: 'outline'
                  }
                ]}
                showAnimation={false}
              />
              
              <FormFeedback
                type="info"
                title="Form Tips"
                message="Here are some tips to help you complete this form efficiently:"
                suggestions={[
                  'Use Tab to navigate between fields quickly',
                  'Required fields are marked with a red asterisk (*)',
                  'Your progress is automatically saved every 30 seconds'
                ]}
                helpLink={{
                  text: 'View Full Guide',
                  url: '/help/forms'
                }}
                showAnimation={false}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}