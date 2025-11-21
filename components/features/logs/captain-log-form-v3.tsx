'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import {
  CheckCircle2,
  AlertCircle,
  Loader2,
  Save,
  Send,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Users,
  DollarSign,
  Briefcase,
  FileCheck,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

import { WizardStepInfo } from './wizard-step-info';
import { WizardJobsStep } from './wizard-jobs-step';
import { WizardHoursStep } from './wizard-other-hours-step';
import { WizardReviewStep } from './wizard-review-step';
import { useSession } from '@/hooks/useSession';
import { useAutoSave } from '@/hooks/useAutoSave';
import { useToast } from '@/hooks/use-toast';
import { useCaptains, useEmployees } from '@/hooks/useUsers';
import { OfflineStatusCard } from '@/components/ui/offline-indicator';
import { LogFormSkeleton } from '@/components/ui/skeleton-components';
import { DailyLogFormSchema, type DailyLogFormData } from '@/lib/validations';
import { calculateOverallTotals } from '@/lib/logCalculations';
import { submitLog } from '@/lib/actions/logs';

interface CaptainLogFormV3Props {
  initialLogId?: string | null;
  initialData?: Partial<DailyLogFormData>;
}

interface WizardStep {
  id: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  component: React.ReactNode;
  isValid: boolean;
}

export function CaptainLogFormV3({
  initialLogId = null,
  initialData,
}: CaptainLogFormV3Props) {
  const { user } = useSession();
  const { toast } = useToast();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch real user data
  const { captains, loading: captainsLoading } = useCaptains();
  const { employees, loading: employeesLoading } = useEmployees();

  const form = useForm<DailyLogFormData>({
    resolver: zodResolver(DailyLogFormSchema),
    defaultValues: {
      captainId: initialData?.captainId || user?.id || '',
      logDate: initialData?.logDate || new Date(),
      sections: initialData?.sections || {
        junk: true,
        move: true,
        otherHours: true,
      },
      jobs: initialData?.jobs || [],
      disposalCost: initialData?.disposalCost || 0,
      hours: initialData?.hours || [],
    },
  });

  // Set captain to current user when user data loads and form is empty
  useEffect(() => {
    if (user?.id && !form.getValues('captainId') && !initialData?.captainId) {
      form.setValue('captainId', user.id);
    }
  }, [user?.id, form, initialData?.captainId]);

  // Manual save functionality (auto-save disabled to prevent sync issues)
  const {
    status: saveStatus,
    lastSaved,
    saveNow,
    error: saveError,
  } = useAutoSave({
    watch: form.watch,
    logId: initialLogId,
    interval: 30000, // 30 seconds
    enabled: false,
  });

  // Update loading state based on data fetching
  useEffect(() => {
    if (!captainsLoading && !employeesLoading) {
      setIsLoading(false);
    }
  }, [captainsLoading, employeesLoading]);

  // Watch all form data for real-time calculations
  const formData = form.watch();

  // Calculate overall totals
  const overallCalculation = calculateOverallTotals(formData, employees);

  // Check if current step is valid
  const isCurrentStepValid = () => {
    switch (currentStep) {
      case 0: // Basic Info
        return form.getValues('captainId') && form.getValues('logDate');
      case 1: // Jobs
        return (
          form.getValues('jobs').length > 0 ||
          (!form.getValues('sections.junk') && !form.getValues('sections.move'))
        );
      case 2: // Hours
        return (
          form.getValues('hours').length > 0 ||
          !form.getValues('sections.otherHours')
        );
      default:
        return true;
    }
  };

  const handleManualSave = async () => {
    const result = await saveNow();
    if (result.success) {
      toast({
        title: 'Draft Saved',
        description: 'Your log has been saved as a draft.',
      });
    }
  };

  const onSubmit = async (data: DailyLogFormData) => {
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);

      // Validate that there's at least some data to submit
      if (data.jobs.length === 0 && data.hours.length === 0) {
        toast({
          title: 'Cannot Submit Empty Log',
          description:
            'Please add at least one job or hour entry before submitting.',
          variant: 'destructive',
        });
        return;
      }

      const result = await submitLog(initialLogId, data);

      if (result.success) {
        toast({
          title: 'Log Submitted Successfully',
          description: 'Your daily log has been submitted for review.',
        });

        // Use a timeout to ensure toast is shown before navigation
        setTimeout(() => {
          try {
            router.push('/logs');
          } catch (navError) {
            console.error('Navigation error:', navError);
            // Fallback to window location if router fails
            window.location.href = '/logs';
          }
        }, 1000);
      } else {
        toast({
          title: 'Submission Failed',
          description:
            result.error || 'Unable to submit your log. Please try again.',
          variant: 'destructive',
        });
      }
    } catch {
      // Submission error occurred
      toast({
        title: 'Submission Failed',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1 && isCurrentStepValid()) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  if (isLoading) {
    return <LogFormSkeleton />;
  }

  // Define wizard steps
  const steps: WizardStep[] = [
    {
      id: 0,
      title: 'Log Information',
      description: 'Set captain, date, and sections',
      icon: <FileCheck className="h-5 w-5" />,
      component: <WizardStepInfo form={form} captains={captains} user={user} />,
      isValid:
        !!form.getValues('captainId') &&
        !!form.getValues('logDate') &&
        typeof form.getValues('logDate') === 'object',
    },
    {
      id: 1,
      title: 'Jobs & Revenue',
      description: 'Add junk and move jobs',
      icon: <DollarSign className="h-5 w-5" />,
      component: <WizardJobsStep form={form} employees={employees} />,
      isValid:
        form.getValues('jobs').length > 0 ||
        (!form.getValues('sections.junk') && !form.getValues('sections.move')),
    },
    {
      id: 2,
      title: 'Team Hours',
      description: 'Assign team hours and departments',
      icon: <Users className="h-5 w-5" />,
      component: <WizardHoursStep form={form} employees={employees} />,
      isValid:
        form.getValues('hours').length > 0 ||
        !form.getValues('sections.otherHours'),
    },
    {
      id: 3,
      title: 'Review & Submit',
      description: 'Review all data and submit log',
      icon: <CheckCircle2 className="h-5 w-5" />,
      component: (
        <WizardReviewStep
          form={form}
          calculation={overallCalculation}
          employees={employees}
        />
      ),
      isValid: true, // Always valid
    },
  ];

  return (
    <div className="space-y-6">
      <OfflineStatusCard />

      {/* Progress Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCheck className="h-5 w-5 text-purple-600" />
                <span className="text-sm font-medium">
                  Step {currentStep + 1} of {steps.length}
                </span>
              </div>
              <Badge variant="outline" className="text-xs">
                {Math.round(((currentStep + 1) / steps.length) * 100)}% Complete
              </Badge>
            </div>

            <Progress
              value={((currentStep + 1) / steps.length) * 100}
              className="h-2"
            />

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {steps.map((step, index) => (
                <div
                  key={step.id}
                  className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors ${
                    index === currentStep
                      ? 'border-purple-600 bg-purple-50 dark:bg-purple-950'
                      : index < currentStep
                        ? 'border-green-600 bg-green-50 dark:bg-green-950'
                        : 'border-muted/50'
                  }`}
                  onClick={() => index <= currentStep && setCurrentStep(index)}
                >
                  <div
                    className={`flex-shrink-0 ${
                      index === currentStep
                        ? 'text-purple-600'
                        : index < currentStep
                          ? 'text-green-600'
                          : 'text-muted-foreground'
                    }`}
                  >
                    {step.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-medium truncate">
                      {step.title}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {step.description}
                    </div>
                  </div>
                  {index < currentStep && (
                    <CheckCircle2 className="h-3 w-3 text-green-600 flex-shrink-0" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Step */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {steps[currentStep].icon}
                {steps[currentStep].title}
              </CardTitle>
              <CardDescription>
                {steps[currentStep].description}
              </CardDescription>
            </CardHeader>
            <CardContent>{steps[currentStep].component}</CardContent>
          </Card>

          {/* Navigation Buttons */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  {saveStatus === 'saved' && lastSaved && (
                    <div className="flex items-center gap-1 text-hunks-green">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Saved at {format(lastSaved, 'h:mm a')}</span>
                    </div>
                  )}
                  {saveStatus === 'saving' && (
                    <div className="flex items-center gap-1">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Saving...</span>
                    </div>
                  )}
                  {saveStatus === 'error' && (
                    <div className="flex items-center gap-1 text-destructive">
                      <AlertCircle className="h-4 w-4" />
                      <span>Save failed</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handlePrevious}
                    disabled={currentStep === 0}
                    className="border-purple-600 text-purple-600 hover:bg-purple-600 hover:text-white"
                  >
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Previous
                  </Button>

                  {currentStep < steps.length - 1 ? (
                    <Button
                      type="button"
                      onClick={handleNext}
                      disabled={!isCurrentStepValid()}
                      className="bg-purple-600 hover:bg-purple-600/90 text-white"
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                  ) : (
                    <div className="flex gap3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleManualSave}
                        disabled={saveStatus === 'saving'}
                        className="border-hunks-orange text-hunks-orange hover:bg-hunks-orange hover:text-white"
                      >
                        {saveStatus === 'saving' ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="mr-2 h-4 w-4" />
                            Save Draft
                          </>
                        )}
                      </Button>
                      <Button
                        type="submit"
                        disabled={isSubmitting || saveStatus === 'saving'}
                        className="bg-hunks-green hover:bg-hunks-green/90 text-white"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Submitting...
                          </>
                        ) : (
                          <>
                            <Send className="mr-2 h-4 w-4" />
                            Submit Log
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </form>
      </Form>

      {/* Save Status Alert */}
      {saveError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Save failed: {saveError}. Please try saving again.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
