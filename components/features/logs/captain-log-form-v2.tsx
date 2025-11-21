'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import { CheckCircle2, AlertCircle, Loader2, Save, Send, Users, Calendar, Grid3x3 } from 'lucide-react';

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
import { Badge } from '@/components/ui/badge';

import { TeamTimeGrid } from './team-time-grid';
import { GridJobsPanel } from './grid-jobs-panel';
import { GridTotals } from './grid-totals';
import { useSession } from '@/hooks/useSession';
import { useAutoSave } from '@/hooks/useAutoSave';
import { useToast } from '@/hooks/use-toast';
import { useCaptains, useEmployees } from '@/hooks/useUsers';
import { OfflineStatusCard } from '@/components/ui/offline-indicator';
import { LogFormSkeleton } from '@/components/ui/skeleton-components';
import { DailyLogFormSchema, type DailyLogFormData } from '@/lib/validations';
import { calculateOverallTotals } from '@/lib/logCalculations';
import { submitLog } from '@/lib/actions/logs';

interface CaptainLogFormV2Props {
  initialLogId?: string | null;
  initialData?: Partial<DailyLogFormData>;
}

export function CaptainLogFormV2({
  initialLogId = null,
  initialData,
}: CaptainLogFormV2Props) {
  const { user } = useSession();
  const { toast } = useToast();
  const router = useRouter();
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
    enabled: false, // Disabled to prevent problematic sync issues
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

  if (isLoading) {
    return <LogFormSkeleton />;
  }

  return (
    <div className="space-y-6">
      <OfflineStatusCard />
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Header Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-hunks-orange flex items-center gap-2">
                <Grid3x3 className="h-5 w-5" />
                Grid Time Tracking
              </CardTitle>
              <CardDescription>
                Visual team management interface for efficient time allocation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Captain and Date Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Captain Selector */}
                <FormField
                  control={form.control}
                  name="captainId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Captain
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select captain" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {captains.map((captain) => (
                            <SelectItem key={captain.id} value={captain.id}>
                              {captain.fullName}
                              {captain.id === user?.id && ' (You)'}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Team captain for this log
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Date Selector */}
                <FormField
                  control={form.control}
                  name="logDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Log Date
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          placeholder="Select date"
                          value={
                            field.value ? format(field.value, 'yyyy-MM-dd') : ''
                          }
                          onChange={(e) => {
                            const date = e.target.value;
                            field.onChange(date ? new Date(date) : new Date());
                          }}
                          className="focus-visible:ring-hunks-orange"
                          max={format(new Date(), 'yyyy-MM-dd')}
                        />
                      </FormControl>
                      <FormDescription>
                        Date for this log
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Main Grid Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column: Team Time Grid */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <Users className="h-5 w-5" />
                Team Time Allocation
              </h3>
              <TeamTimeGrid
                employees={employees}
                captainId={form.watch('captainId')}
                jobs={form.watch('jobs')}
                hours={form.watch('hours')}
              />
            </div>

            {/* Right Column: Jobs Panel */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Jobs Revenue</h3>
              <GridJobsPanel
                jobs={form.watch('jobs')}
                employees={employees}
              />
            </div>
          </div>

          {/* Overall Totals */}
          <GridTotals
            calculation={overallCalculation}
            jobs={form.watch('jobs')}
            hours={form.watch('hours')}
            employees={employees}
            disposalCost={form.watch('disposalCost') || 0}
          />

          {/* Save Status Alert */}
          {saveError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Save failed: {saveError}. Please try saving again.
              </AlertDescription>
            </Alert>
          )}

          {/* Form Actions */}
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
                    className="bg-hunks-orange hover:bg-hunks-orange/90 text-white"
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
              </div>
            </CardContent>
          </Card>
        </form>
      </Form>
    </div>
  );
}
