'use client';

import { useFieldArray, useFormContext } from 'react-hook-form';
import { Plus, Trash2 } from 'lucide-react';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
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
  FormControl,
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

import { JobTile } from './job-tile';
import { SectionSummary } from './section-summary';
import type { DailyLogFormData } from '@/lib/validations';
import { calculateSectionSummary } from '@/lib/logCalculations';
import type { User } from '@/types';

interface JobSectionProps {
  jobType: 'junk' | 'move';
  title: string;
  description: string;
  employees?: User[];
}

export function JobSection({ jobType, title, description, employees = [] }: JobSectionProps) {
  const { control, watch, setValue } = useFormContext<DailyLogFormData>();
  
  const { fields: jobFields, append: appendJob, remove: removeJob } = useFieldArray({
    control,
    name: 'jobs',
  });

  const { fields: hourFields, append: appendHour, remove: removeHour } = useFieldArray({
    control,
    name: 'hours',
  });

  // Get actual indices of jobs for this section
  const getSectionJobIndices = () => {
    return jobFields
      .map((_, index) => ({ index, job: watch(`jobs.${index}`) }))
      .filter(({ job }) => job?.jobType === jobType)
      .map(({ index }) => index);
  };

  // Get actual indices of hours for this section
  const getSectionHourIndices = () => {
    return hourFields
      .map((_, index) => ({ index, hour: watch(`hours.${index}`) }))
      .filter(({ hour }) => hour?.department === jobType)
      .map(({ index }) => index);
  };

  const addJob = () => {
    const newJob = {
      jobType,
      jobId: '',
      clientName: '',
      revenue: 0,
      tips: 0,
      ...(jobType === 'move' && {
        junkOnMove: 0,
        valuation: 0,
        materials: 0,
      }),
    };
    appendJob(newJob);
  };

  const addTeamMember = () => {
    appendHour({
      employeeId: '',
      department: jobType,
      hours: 0,
      isCoCaptain: false,
    });
  };

  const removeJobEntry = (globalIndex: number) => {
    removeJob(globalIndex);
  };

  const removeTeamMember = (globalIndex: number) => {
    removeHour(globalIndex);
  };

  // Handle disposal cost for junk section (section-level field)
  const disposalCost = watch('disposalCost') || 0;
  const setDisposalCost = (value: number) => {
    setValue('disposalCost', value);
  };

  const sectionJobIndices = getSectionJobIndices();
  const sectionHourIndices = getSectionHourIndices();

  // Watch all form data for real-time calculations
  const allJobs = watch('jobs') || [];
  const allHours = watch('hours') || [];
  const formDisposalCost = watch('disposalCost') || 0;

  // Calculate section summary
  const sectionCalculation = calculateSectionSummary(
    allJobs,
    allHours,
    employees,
    jobType,
    jobType === 'junk' ? formDisposalCost : undefined
  );

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {sectionJobIndices.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No {jobType} jobs added yet.</p>
              <Button
                type="button"
                onClick={addJob}
                className="mt-4 bg-hunks-green hover:bg-hunks-green/90 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add {jobType === 'junk' ? 'Junk' : 'Move'} Job
              </Button>
            </div>
          ) : (
            <>
              {/* Job Tiles */}
              <div className="space-y-4">
                {sectionJobIndices.map((globalIndex, localIndex) => (
                  <JobTile
                    key={`${jobType}-${globalIndex}-${jobFields[globalIndex]?.id || localIndex}`}
                    jobIndex={globalIndex}
                    jobType={jobType}
                    onRemove={() => removeJobEntry(globalIndex)}
                    canRemove={sectionJobIndices.length > 1}
                  />
                ))}
              </div>

              {/* Add Another Job Button */}
              <div className="flex justify-center pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={addJob}
                  className="border-hunks-green text-hunks-green hover:bg-hunks-green hover:text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Another {jobType === 'junk' ? 'Junk' : 'Move'} Job
                </Button>
              </div>

              {/* Junk-specific: Disposal Cost (section level) */}
              {jobType === 'junk' && (
                <>
                  <Separator />
                  <Card className="bg-muted/30">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Section Totals</CardTitle>
                      <CardDescription>
                        Disposal costs apply to all junk jobs in this section
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="max-w-xs">
                        <Label htmlFor="disposal-cost">Total Disposal Cost</Label>
                        <div className="relative mt-1">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                            $
                          </span>
                          <Input
                            id="disposal-cost"
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            value={disposalCost}
                            onChange={(e) => setDisposalCost(parseFloat(e.target.value) || 0)}
                            className="pl-8 focus-visible:ring-hunks-green"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Team Hours Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Team Hours - {title}</CardTitle>
          <CardDescription>
            Record employee hours for {jobType} department work
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {sectionHourIndices.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No team members added yet.</p>
              <Button
                type="button"
                onClick={addTeamMember}
                className="mt-4 bg-hunks-green hover:bg-hunks-green/90 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add HUNK
              </Button>
            </div>
          ) : (
            <>
              {/* Team Member Entries */}
              <Accordion type="multiple" className="w-full">
                {sectionHourIndices.map((globalIndex, localIndex) => {
                  const employeeId = watch(`hours.${globalIndex}.employeeId`);
                  const employee = employees.find(emp => emp.id === employeeId);
                  const hours = watch(`hours.${globalIndex}.hours`);
                  const isCoCaptain = watch(`hours.${globalIndex}.isCoCaptain`);
                  
                  return (
                    <AccordionItem key={`${jobType}-hour-${globalIndex}-${hourFields[globalIndex]?.id || localIndex}`} value={`item-${globalIndex}`}>
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center justify-between w-full mr-4">
                          <div className="flex items-center gap-3">
                            <span className="font-medium">
                              {employee ? employee.fullName : 'Select Employee'}
                            </span>
                            {isCoCaptain && (
                              <span className="px-2 py-1 text-xs bg-hunks-orange text-white rounded-full">
                                Co-Captain
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>{jobType === 'junk' ? 'Junk Removal' : 'Moving'}</span>
                            <span>{hours}h</span>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pt-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Employee Selection */}
                          <FormField
                            control={control}
                            name={`hours.${globalIndex}.employeeId`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Employee</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select employee" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {employees.map((employee) => (
                                      <SelectItem key={employee.id} value={employee.id}>
                                        {employee.fullName}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          {/* Hours Input */}
                          <FormField
                            control={control}
                            name={`hours.${globalIndex}.hours`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Hours Worked</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    step="0.25"
                                    min="0"
                                    max="24"
                                    placeholder="0.00"
                                    value={field.value || ''}
                                    onChange={(e) => {
                                      const value = e.target.value;
                                      field.onChange(value === '' ? 0 : parseFloat(value));
                                    }}
                                    className="focus-visible:ring-hunks-green"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          {/* Co-Captain Checkbox */}
                          <FormField
                            control={control}
                            name={`hours.${globalIndex}.isCoCaptain`}
                            render={({ field }) => (
                              <FormItem className="flex flex-col justify-end">
                                <div className="flex items-center space-x-2">
                                  <FormControl>
                                    <Checkbox
                                      id={`co-captain-${globalIndex}`}
                                      checked={field.value}
                                      onCheckedChange={field.onChange}
                                      className="data-[state=checked]:border-hunks-orange data-[state=checked]:bg-hunks-orange data-[state=checked]:text-white"
                                    />
                                  </FormControl>
                                  <Label 
                                    htmlFor={`co-captain-${globalIndex}`}
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                  >
                                    Co-Captain
                                  </Label>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  Check if this employee served as co-captain for this section
                                </p>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <Separator className="my-4" />

                        {/* Remove Button */}
                        <div className="flex justify-end">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeTeamMember(globalIndex)}
                            className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Remove Team Member
                          </Button>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>

              {/* Add Another Team Member Button */}
              <div className="flex justify-center pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={addTeamMember}
                  className="border-hunks-green text-hunks-green hover:bg-hunks-green hover:text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add HUNK
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Section Summary - only show if there are jobs or hours */}
      {(sectionJobIndices.length > 0 || sectionCalculation.totalHours > 0) && (
        <SectionSummary
          title={`${title} Summary`}
          calculation={sectionCalculation}
          showDisposalCost={jobType === 'junk'}
          showUpsells={jobType === 'move'}
        />
      )}
    </div>
  );
}