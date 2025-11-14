'use client';

import * as React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  Info,
  Send,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { ValidationError } from '@/lib/payrollValidation';

const discrepancyReportSchema = z.object({
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  category: z.enum([
    'calculation',
    'data_integrity',
    'rate_issue',
    'hours_mismatch',
    'tips_error',
    'other',
  ]),
  description: z
    .string()
    .min(10, 'Please provide a detailed description (minimum 10 characters)'),
  expectedOutcome: z.string().optional(),
  contactEmail: z
    .string()
    .email('Please enter a valid email address')
    .optional()
    .or(z.literal('')),
  requestCallback: z.boolean(),
});

type DiscrepancyReportFormData = z.infer<typeof discrepancyReportSchema>;

interface DiscrepancyReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  errors: ValidationError[];
  employeeId: string;
  payPeriodId: string;
  onSubmit?: (
    report: DiscrepancyReportFormData & { errors: ValidationError[] }
  ) => Promise<void>;
}

export function DiscrepancyReportDialog({
  open,
  onOpenChange,
  errors,
  onSubmit,
}: DiscrepancyReportDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<DiscrepancyReportFormData>({
    resolver: zodResolver(discrepancyReportSchema),
    defaultValues: {
      priority: 'medium',
      category: 'calculation',
      description: '',
      expectedOutcome: '',
      contactEmail: '',
      requestCallback: false,
    },
  });

  // Auto-determine priority based on error types
  React.useEffect(() => {
    if (errors.length === 0) return;

    const criticalErrors = errors.filter((error) =>
      [
        'HOURS_MISMATCH',
        'TIPS_MISMATCH',
        'DEPARTMENT_PAY_MISMATCH',
        'COMMISSION_MISMATCH',
      ].includes(error.code)
    );

    const rateErrors = errors.filter(
      (error) =>
        error.code === 'RATE_INCONSISTENCY' || error.code === 'MISSING_RATE'
    );

    let suggestedPriority: 'low' | 'medium' | 'high' | 'critical' = 'low';
    let suggestedCategory: DiscrepancyReportFormData['category'] = 'other';

    if (criticalErrors.length > 0) {
      suggestedPriority = 'critical';
      suggestedCategory = 'calculation';
    } else if (rateErrors.length > 0) {
      suggestedPriority = 'high';
      suggestedCategory = 'rate_issue';
    } else if (errors.some((e) => e.code.includes('HOURS'))) {
      suggestedPriority = 'medium';
      suggestedCategory = 'hours_mismatch';
    } else if (errors.some((e) => e.code.includes('TIPS'))) {
      suggestedPriority = 'medium';
      suggestedCategory = 'tips_error';
    } else if (errors.length > 2) {
      suggestedPriority = 'medium';
      suggestedCategory = 'data_integrity';
    }

    form.setValue('priority', suggestedPriority);
    form.setValue('category', suggestedCategory);

    // Auto-generate description based on errors
    const errorSummary = errors
      .slice(0, 3)
      .map((error) => `• ${error.message}`)
      .join('\n');
    const additionalCount =
      errors.length > 3
        ? `\n\n...and ${errors.length - 3} additional issues`
        : '';

    form.setValue(
      'description',
      `The following discrepancies were detected in my payroll calculation:\n\n${errorSummary}${additionalCount}\n\nPlease review and correct these issues.`
    );
  }, [errors, form]);

  const handleSubmit = async (data: DiscrepancyReportFormData) => {
    setIsSubmitting(true);

    try {
      if (onSubmit) {
        await onSubmit({ ...data, errors });
      } else {
        // Default submission logic - would typically send to an API
        // TODO: Implement API call for discrepancy report submission
      }

      toast({
        title: 'Report Submitted',
        description:
          'Your discrepancy report has been submitted successfully. You will receive a response within 24 hours.',
      });

      onOpenChange(false);
      form.reset();
    } catch {
      toast({
        title: 'Submission Failed',
        description: 'Failed to submit discrepancy report. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getErrorIcon = (type: ValidationError['type']) => {
    switch (type) {
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'info':
        return <Info className="h-4 w-4 text-blue-500" />;
      default:
        return <Info className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            Report Payroll Discrepancy
          </DialogTitle>
          <DialogDescription>
            Report issues with your payroll calculation. Our team will review
            and respond within 24 hours.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-6"
          >
            {/* Error Summary */}
            <div className="space-y-3">
              <h4 className="font-medium">Detected Issues ({errors.length})</h4>
              <div className="max-h-32 overflow-y-auto space-y-2">
                {errors.slice(0, 5).map((error, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-2 p-2 border rounded text-sm"
                  >
                    {getErrorIcon(error.type)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs">
                          {error.code}
                        </Badge>
                        {error.logId && (
                          <Badge variant="outline" className="text-xs">
                            Log: {error.logId.slice(0, 8)}
                          </Badge>
                        )}
                      </div>
                      <p>{error.message}</p>
                    </div>
                  </div>
                ))}
                {errors.length > 5 && (
                  <div className="text-center text-sm text-muted-foreground">
                    ...and {errors.length - 5} more issues
                  </div>
                )}
              </div>
            </div>

            {/* Priority and Category */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="low">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-green-500" />
                            Low
                          </div>
                        </SelectItem>
                        <SelectItem value="medium">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-yellow-500" />
                            Medium
                          </div>
                        </SelectItem>
                        <SelectItem value="high">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-orange-500" />
                            High
                          </div>
                        </SelectItem>
                        <SelectItem value="critical">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-red-500" />
                            Critical
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="calculation">
                          Calculation Error
                        </SelectItem>
                        <SelectItem value="data_integrity">
                          Data Integrity
                        </SelectItem>
                        <SelectItem value="rate_issue">Rate Issue</SelectItem>
                        <SelectItem value="hours_mismatch">
                          Hours Mismatch
                        </SelectItem>
                        <SelectItem value="tips_error">Tips Error</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe the issue in detail..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Provide as much detail as possible to help us resolve the
                    issue quickly.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Expected Outcome */}
            <FormField
              control={form.control}
              name="expectedOutcome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Expected Outcome (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="What do you expect the correct calculation to be?"
                      className="min-h-[60px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Help us understand what you believe the correct result
                    should be.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Contact Information */}
            <FormField
              control={form.control}
              name="contactEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact Email (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="your.email@example.com"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Provide an email if you want updates on this report.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm text-muted-foreground">
                  Reports are reviewed within 24 hours
                </span>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Submit Report
                    </>
                  )}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
