'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { SmartInput, commonValidationRules } from './smart-input';
import { MobileForm, useMobileForm } from './mobile-form';
import { MobileFormValidation, useMobileFormValidation, mobileValidationRules } from './mobile-form-validation';
import { FormFeedback, useFormFeedback } from './form-feedback';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

// Demo form schema
const mobileFormSchema = z.object({
  name: z.string().min(1, 'Name is required').min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().min(1, 'Phone number is required'),
  jobType: z.string().min(1, 'Please select a job type'),
  amount: z.string().min(1, 'Amount is required').refine(
    (val) => !isNaN(Number(val)) && Number(val) > 0,
    'Amount must be a positive number'
  ),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  priority: z.enum(['low', 'medium', 'high']),
});

type MobileFormData = z.infer<typeof mobileFormSchema>;

export function MobileFormDemo() {
  const form = useForm<MobileFormData>({
    resolver: zodResolver(mobileFormSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      jobType: '',
      amount: '',
      description: '',
      priority: 'medium',
    },
  });

  const { 
    autoSaveStatus, 
    lastSaved, 
    autoSaveError, 
    createAutoSaveHandler 
  } = useMobileForm();

  const { 
    errors, 
    addError, 
    removeError, 
    clearErrors, 
    hasErrors,
    validateField 
  } = useMobileFormValidation();

  const { feedback, showSuccess, showError } = useFormFeedback();

  // Watch form data for auto-save (used by auto-save internally)
  form.watch();

  // Auto-save handler
  const handleAutoSave = createAutoSaveHandler(async () => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Simulate occasional failures for demo
    if (Math.random() < 0.1) {
      throw new Error('Network error');
    }
    
    return { success: true };
  });

  // Manual save handler
  const handleManualSave = async () => {
    try {
      await handleAutoSave();
      showSuccess({
        title: 'Draft Saved',
        message: 'Your form has been saved as a draft.',
      });
    } catch {
      showError({
        title: 'Save Failed',
        message: 'Unable to save your form. Please try again.',
      });
    }
  };

  // Form submission
  const onSubmit = async (data: MobileFormData) => {
    clearErrors();
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simulate validation errors for demo
      if (data.name.toLowerCase().includes('test')) {
        addError({
          field: 'name',
          message: 'Test names are not allowed in production',
          type: 'error',
        });
        return;
      }
      
      showSuccess({
        title: 'Form Submitted Successfully',
        message: 'Your information has been processed.',
      });
      
      // Reset form after successful submission
      form.reset();
      clearErrors();
    } catch {
      showError({
        title: 'Submission Failed',
        message: 'Unable to submit your form. Please try again.',
      });
    }
  };

  // Field validation handlers
  const handleFieldValidation = (field: keyof MobileFormData, value: unknown) => {
    switch (field) {
      case 'name':
        validateField(field, value, [
          mobileValidationRules.required('Name is required'),
          mobileValidationRules.minLength(2, 'Name must be at least 2 characters'),
        ]);
        break;
      case 'email':
        validateField(field, value, [
          mobileValidationRules.required('Email is required'),
          mobileValidationRules.email(),
        ]);
        break;
      case 'phone':
        validateField(field, value, [
          mobileValidationRules.required('Phone number is required'),
          mobileValidationRules.phone(),
        ]);
        break;
      case 'amount':
        validateField(field, value, [
          mobileValidationRules.required('Amount is required'),
          mobileValidationRules.positiveNumber(),
        ]);
        break;
      case 'description':
        validateField(field, value, [
          mobileValidationRules.required('Description is required'),
          mobileValidationRules.minLength(10, 'Description must be at least 10 characters'),
        ]);
        break;
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Demo header */}
      <Card>
        <CardHeader>
          <CardTitle className="text-hunks-green">Mobile Form Optimization Demo</CardTitle>
          <CardDescription>
            This form demonstrates mobile-optimized inputs, auto-save functionality, and enhanced validation.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">48px Touch Targets</Badge>
            <Badge variant="secondary">16px Font Size</Badge>
            <Badge variant="secondary">Auto-Save</Badge>
            <Badge variant="secondary">Smart Keyboards</Badge>
            <Badge variant="secondary">Progressive Validation</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Form feedback */}
      {feedback && (
        <FormFeedback {...feedback} />
      )}

      {/* Validation errors */}
      <MobileFormValidation
        errors={errors}
        onErrorClick={(field) => {
          const element = document.getElementById(field);
          element?.focus();
          element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }}
        onDismiss={removeError}
      />

      {/* Main form */}
      <MobileForm
        title="Job Request Form"
        description="Fill out this form to request a new job. All fields are required."
        autoSave={{
          enabled: true,
          interval: 10000, // 10 seconds for demo
          onSave: handleAutoSave,
          lastSaved,
          status: autoSaveStatus,
          error: autoSaveError,
        }}
        onSubmit={form.handleSubmit(onSubmit)}
        submitButton={{
          text: 'Submit Request',
          loadingText: 'Submitting...',
          disabled: hasErrors,
        }}
        saveButton={{
          text: 'Save Draft',
          onSave: handleManualSave,
        }}
      >
        <div className="grid gap-6">
          {/* Personal Information */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium">Personal Information</h3>
              <p className="text-sm text-muted-foreground">
                Enter your contact details
              </p>
            </div>

            <div className="grid gap-4">
              <SmartInput
                id="name"
                label="Full Name"
                placeholder="Enter your full name"
                value={form.watch('name')}
                onValueChange={(value) => {
                  form.setValue('name', value);
                  handleFieldValidation('name', value);
                }}
                validationRules={[
                  commonValidationRules.required('Name is required'),
                  commonValidationRules.minLength(2, 'Name must be at least 2 characters'),
                ]}
                mobileOptimized={true}
                keyboardType="default"
              />

              <SmartInput
                id="email"
                label="Email Address"
                placeholder="Enter your email"
                value={form.watch('email')}
                onValueChange={(value) => {
                  form.setValue('email', value);
                  handleFieldValidation('email', value);
                }}
                validationRules={[
                  commonValidationRules.required('Email is required'),
                  commonValidationRules.email(),
                ]}
                mobileOptimized={true}
                keyboardType="email"
              />

              <SmartInput
                id="phone"
                label="Phone Number"
                placeholder="Enter your phone number"
                value={form.watch('phone')}
                onValueChange={(value) => {
                  form.setValue('phone', value);
                  handleFieldValidation('phone', value);
                }}
                validationRules={[
                  commonValidationRules.required('Phone is required'),
                  commonValidationRules.phone(),
                ]}
                mobileOptimized={true}
                keyboardType="tel"
              />
            </div>
          </div>

          <Separator />

          {/* Job Details */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium">Job Details</h3>
              <p className="text-sm text-muted-foreground">
                Provide information about the job
              </p>
            </div>

            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="jobType">Job Type</Label>
                <Select
                  value={form.watch('jobType')}
                  onValueChange={(value) => form.setValue('jobType', value)}
                >
                  <SelectTrigger id="jobType" mobileOptimized={true}>
                    <SelectValue placeholder="Select job type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="junk-removal" mobileOptimized={true}>
                      Junk Removal
                    </SelectItem>
                    <SelectItem value="moving" mobileOptimized={true}>
                      Moving Services
                    </SelectItem>
                    <SelectItem value="labor" mobileOptimized={true}>
                      Labor Only
                    </SelectItem>
                    <SelectItem value="donation" mobileOptimized={true}>
                      Donation Pickup
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <SmartInput
                id="amount"
                label="Estimated Amount"
                placeholder="0.00"
                value={form.watch('amount')}
                onValueChange={(value) => {
                  form.setValue('amount', value);
                  handleFieldValidation('amount', value);
                }}
                validationRules={[
                  commonValidationRules.required('Amount is required'),
                  commonValidationRules.positiveNumber(),
                ]}
                mobileOptimized={true}
                keyboardType="numeric"
              />

              <div className="space-y-2">
                <Label htmlFor="priority">Priority Level</Label>
                <Select
                  value={form.watch('priority')}
                  onValueChange={(value: 'low' | 'medium' | 'high') => form.setValue('priority', value)}
                >
                  <SelectTrigger id="priority" mobileOptimized={true}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low" mobileOptimized={true}>
                      Low Priority
                    </SelectItem>
                    <SelectItem value="medium" mobileOptimized={true}>
                      Medium Priority
                    </SelectItem>
                    <SelectItem value="high" mobileOptimized={true}>
                      High Priority
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Job Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe the job requirements, location, and any special instructions..."
                  value={form.watch('description')}
                  onChange={(e) => {
                    const value = e.target.value;
                    form.setValue('description', value);
                    handleFieldValidation('description', value);
                  }}
                  mobileOptimized={true}
                  rows={4}
                />
              </div>
            </div>
          </div>
        </div>
      </MobileForm>

      {/* Demo info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Demo Features</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <p>• <strong>Touch Targets:</strong> All inputs are 48px+ tall for easy mobile interaction</p>
          <p>• <strong>iOS Zoom Prevention:</strong> 16px font size prevents unwanted zooming</p>
          <p>• <strong>Smart Keyboards:</strong> Appropriate keyboard types for each input</p>
          <p>• <strong>Auto-Save:</strong> Form saves automatically every 10 seconds</p>
          <p>• <strong>Progressive Validation:</strong> Real-time feedback as you type</p>
          <p>• <strong>Mobile Optimized:</strong> Enhanced for touch devices and small screens</p>
        </CardContent>
      </Card>
    </div>
  );
}