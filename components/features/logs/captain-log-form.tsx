'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import { CheckCircle2, AlertCircle, Loader2, Save, Send } from 'lucide-react';

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
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';

import { JobSection } from './job-section';
import { TeamHoursSection } from './team-hours-section';
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




interface CaptainLogFormProps {
  initialLogId?: string | null;
  initialData?: Partial<DailyLogFormData>;
}

export function CaptainLogForm({ initialLogId = null, initialData }: CaptainLogFormProps) {
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
  const { status: saveStatus, lastSaved, saveNow, error: saveError } = useAutoSave({
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
          description: 'Please add at least one job or hour entry before submitting.',
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
        
        // Redirect to logs list after successful submission
        router.push('/logs');
      } else {
        toast({
          title: 'Submission Failed',
          description: result.error || 'Unable to submit your log. Please try again.',
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

  const handleSectionToggle = (section: keyof typeof watchedSections, checked: boolean) => {
    form.setValue(`sections.${section}`, checked);
  };

  if (isLoading) {
    return <LogFormSkeleton />;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <OfflineStatusCard />
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Header Card with Captain Selection and Section Toggles */}
          <Card>
            <CardHeader>
              <CardTitle className="text-hunks-green">Log Information</CardTitle>
              <CardDescription>
                Select the captain and configure which sections to include in this log.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Captain Selector */}
              <FormField
                control={form.control}
                name="captainId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Captain</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                      Select the captain responsible for this log. Defaults to you if you have captain permissions.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Separator />

              {/* Section Visibility Toggles */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium">Log Sections</h3>
                  <p className="text-sm text-muted-foreground">
                    Choose which sections to include in this daily log.
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Junk Section Toggle */}
                  <Label className="flex items-start gap-3 rounded-lg border p-4 cursor-pointer hover:bg-accent/50 has-[[aria-checked=true]]:border-hunks-green has-[[aria-checked=true]]:bg-hunks-green/5">
                    <Checkbox
                      id="section-junk"
                      checked={watchedSections.junk}
                      onCheckedChange={(checked) => handleSectionToggle('junk', checked as boolean)}
                      className="data-[state=checked]:border-hunks-green data-[state=checked]:bg-hunks-green data-[state=checked]:text-white"
                    />
                    <div className="grid gap-1.5 font-normal">
                      <p className="text-sm leading-none font-medium">Junk Jobs</p>
                      <p className="text-muted-foreground text-xs">
                        Record junk removal jobs and disposal costs
                      </p>
                    </div>
                  </Label>

                  {/* Move Section Toggle */}
                  <Label className="flex items-start gap-3 rounded-lg border p-4 cursor-pointer hover:bg-accent/50 has-[[aria-checked=true]]:border-hunks-green has-[[aria-checked=true]]:bg-hunks-green/5">
                    <Checkbox
                      id="section-move"
                      checked={watchedSections.move}
                      onCheckedChange={(checked) => handleSectionToggle('move', checked as boolean)}
                      className="data-[state=checked]:border-hunks-green data-[state=checked]:bg-hunks-green data-[state=checked]:text-white"
                    />
                    <div className="grid gap-1.5 font-normal">
                      <p className="text-sm leading-none font-medium">Move Jobs</p>
                      <p className="text-muted-foreground text-xs">
                        Record moving jobs and upsells
                      </p>
                    </div>
                  </Label>

                  {/* Other Hours Section Toggle */}
                  <Label className="flex items-start gap-3 rounded-lg border p-4 cursor-pointer hover:bg-accent/50 has-[[aria-checked=true]]:border-hunks-green has-[[aria-checked=true]]:bg-hunks-green/5">
                    <Checkbox
                      id="section-other"
                      checked={watchedSections.otherHours}
                      onCheckedChange={(checked) => handleSectionToggle('otherHours', checked as boolean)}
                      className="data-[state=checked]:border-hunks-green data-[state=checked]:bg-hunks-green data-[state=checked]:text-white"
                    />
                    <div className="grid gap-1.5 font-normal">
                      <p className="text-sm leading-none font-medium">Other Hours</p>
                      <p className="text-muted-foreground text-xs">
                        Record training, admin, and other activities
                      </p>
                    </div>
                  </Label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Main Log Sections */}
          <Card>
            <CardHeader>
              <CardTitle className="text-hunks-green">Daily Log Entry</CardTitle>
              <CardDescription>
                Log Date: {format(form.watch('logDate'), 'EEEE, MMMM d, yyyy')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="junk" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger 
                    value="junk" 
                    disabled={!watchedSections.junk}
                    className="data-[state=active]:bg-hunks-green data-[state=active]:text-white"
                  >
                    Junk Jobs
                  </TabsTrigger>
                  <TabsTrigger 
                    value="move" 
                    disabled={!watchedSections.move}
                    className="data-[state=active]:bg-hunks-green data-[state=active]:text-white"
                  >
                    Move Jobs
                  </TabsTrigger>
                  <TabsTrigger 
                    value="other" 
                    disabled={!watchedSections.otherHours}
                    className="data-[state=active]:bg-hunks-green data-[state=active]:text-white"
                  >
                    Other Hours
                  </TabsTrigger>
                </TabsList>

                {/* Junk Jobs Tab */}
                <TabsContent value="junk" className="space-y-4">
                  <JobSection
                    jobType="junk"
                    title="Junk Removal Jobs"
                    description="Add junk removal jobs completed today. Include disposal costs for the entire section."
                    employees={employees}
                  />
                </TabsContent>

                {/* Move Jobs Tab */}
                <TabsContent value="move" className="space-y-4">
                  <JobSection
                    jobType="move"
                    title="Moving Jobs"
                    description="Add moving jobs completed today. Include upsells like junk on move, valuation, and materials."
                    employees={employees}
                  />
                </TabsContent>

                {/* Other Hours Tab */}
                <TabsContent value="other" className="space-y-4">
                  <TeamHoursSection
                    title="Other Hours"
                    description="Record training, administrative, and other non-job hours for team members."
                    employees={employees}
                  />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Overall Log Totals - only show if there's data */}
          {(overallCalculation.totalRevenue > 0 || overallCalculation.totalHours > 0) && (
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