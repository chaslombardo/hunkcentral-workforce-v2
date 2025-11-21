'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import { CheckCircle2, AlertCircle, Loader2, Save, Send, SeparatorVertical } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
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
import { Label } from '@/components/ui/label';
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

import { SinglePageJobSection } from './single-page-job-section';
import { SinglePageOtherHoursSection } from './single-page-other-hours-section';
import { LogTotals } from './log-totals';
import { useSession } from '@/hooks/useSession';
import { useAutoSave } from '@/hooks/useAutoSave';
import { useToast } from '@/hooks/use-toast';
import { useCaptains, useEmployees } from '@/hooks/useUsers';
import { OfflineStatusCard } from '@/components/ui/offline-indicator';
import { LogFormSkeleton } from '@/components/ui/skeleton-components';
import { DailyLogFormSchema, type DailyLogFormData } from '@/lib/validations';
import { calculateOverallTotals } from '@/lib/logCalculations';
import { submitLog } from '@/lib/actions/logs';

interface CaptainLogFormV1Props {
  initialLogId?: string | null;
  initialData?: Partial<DailyLogFormData>;
}

export function CaptainLogFormV1({
  initialLogId = null,
  initialData,
}: CaptainLogFormV1Props) {
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

  const watchedSections = form.watch('sections');

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

  const handleSectionToggle = (
    section: keyof typeof watchedSections,
    checked: boolean
  ) => {
    form.setValue(`sections.${section}`, checked);
  };

  if (isLoading) {
    return <LogFormSkeleton />;
  }

  return (
    <div className="space-y-6">
      <OfflineStatusCard />
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Header Card with Captain Selection and Section Toggles */}
          <Card>
            <CardHeader>
              <CardTitle className="text-hunks-green">
                Log Information
              </CardTitle>
              <CardDescription>
                Select the captain and configure which sections to include in
                this log.
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
                      <FormLabel>Captain</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select a captain" />
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
                        Select the captain responsible for this log
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
                      <FormLabel>Log Date</FormLabel>
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
                          className="focus-visible:ring-hunks-green"
                          max={format(new Date(), 'yyyy-MM-dd')} // Prevent future dates
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

              <Separator />

              {/* Section Visibility Toggles - Horizontal Layout */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium">Log Sections</h3>
                  <p className="text-sm text-muted-foreground">
                    Choose which sections to include in this daily log. All sections are visible at once in this layout.
                  </p>
                </div>

                <div className="flex items-center gap-6 p-4 bg-muted/20 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <Checkbox
                      id="section-junk"
                      checked={watchedSections.junk}
                      onCheckedChange={(checked) =>
                        handleSectionToggle('junk', checked as boolean)
                      }
                      className="data-[state=checked]:border-hunks-green data-[state=checked]:bg-hunks-green data-[state=checked]:text-white"
                    />
                    <Label
                      htmlFor="section-junk"
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <span className="font-medium">Junk Jobs</span>
                      <span className="text-xs text-muted-foreground">Junk removal & disposal</span>
                    </Label>
                  </div>

                  <SeparatorVertical className="h-6" />

                  <div className="flex items-center gap-3">
                    <Checkbox
                      id="section-move"
                      checked={watchedSections.move}
                      onCheckedChange={(checked) =>
                        handleSectionToggle('move', checked as boolean)
                      }
                      className="data-[state=checked]:border-hunks-green data-[state=checked]:bg-hunks-green data-[state=checked]:text-white"
                    />
                    <Label
                      htmlFor="section-move"
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <span className="font-medium">Move Jobs</span>
                      <span className="text-xs text-muted-foreground">Moving & upsells</span>
                    </Label>
                  </div>

                  <SeparatorVertical className="h-6" />

                  <div className="flex items-center gap-3">
                    <Checkbox
                      id="section-other"
                      checked={watchedSections.otherHours}
                      onCheckedChange={(checked) =>
                        handleSectionToggle('otherHours', checked as boolean)
                      }
                      className="data-[state=checked]:border-hunks-green data-[state=checked]:bg-hunks-green data-[state=checked]:text-white"
                    />
                    <Label
                      htmlFor="section-other"
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <span className="font-medium">Other Hours</span>
                      <span className="text-xs text-muted-foreground">Training & admin</span>
                    </Label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Main Content Grid - All Sections Visible */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Junk Jobs Section */}
            {watchedSections.junk && (
              <div className="lg:col-span-1">
                <SinglePageJobSection
                  jobType="junk"
                  title="Junk Removal Jobs"
                  description="Junk removal jobs and disposal costs"
                  employees={employees}
                  className="h-full"
                />
              </div>
            )}

            {/* Move Jobs Section */}
            {watchedSections.move && (
              <div className="lg:col-span-1">
                <SinglePageJobSection
                  jobType="move"
                  title="Moving Jobs"
                  description="Moving jobs and upsells"
                  employees={employees}
                  className="h-full"
                />
              </div>
            )}

            {/* Other Hours Section */}
            {watchedSections.otherHours && (
              <div className="lg:col-span-1">
                <SinglePageOtherHoursSection
                  title="Other Hours"
                  description="Training, admin, and other activities"
                  employees={employees}
                  className="h-full"
                />
              </div>
            )}
          </div>

          {/* Empty State Message */}
          {!watchedSections.junk && !watchedSections.move && !watchedSections.otherHours && (
            <Card className="bg-muted/20">
              <CardContent className="text-center py-8">
                <p className="text-muted-foreground">
                  No sections selected. Please select at least one section above to begin adding data.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Overall Log Totals - only show if there's data */}
          {(overallCalculation.totalRevenue > 0 ||
            overallCalculation.totalHours > 0) && (
            <LogTotals calculation={overallCalculation} />
          )}

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
              </div>
            </CardContent>
          </Card>
        </form>
      </Form>
    </div>
  );
}
