'use client';

import { useFieldArray, useFormContext } from 'react-hook-form';
import { Plus, Trash2, Users, DollarSign, Clock } from 'lucide-react';
import { useState } from 'react';

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
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { CollaborativeTextarea } from '@/components/ui/collaborative-textarea';

import { JobTileCompact } from './job-tile-compact';
import type { DailyLogFormData } from '@/lib/validations';
import { calculateSectionSummary } from '@/lib/logCalculations';
import type { User } from '@/types';

interface SinglePageJobSectionProps {
  jobType: 'junk' | 'move';
  title: string;
  description: string;
  employees?: User[];
  className?: string;
}

export function SinglePageJobSection({
  jobType,
  title,
  description,
  employees = [],
  className = '',
}: SinglePageJobSectionProps) {
  const { control, watch, setValue, getValues } = useFormContext<DailyLogFormData>();
  const [isAddingJob, setIsAddingJob] = useState(false);
  const [isAddingTeamMember, setIsAddingTeamMember] = useState(false);

  const {
    fields: jobFields,
    append: appendJob,
    remove: removeJob,
  } = useFieldArray({
    control,
    name: 'jobs',
  });

  const {
    fields: hourFields,
    append: appendHour,
    remove: removeHour,
  } = useFieldArray({
    control,
    name: 'hours',
  });

  // Get actual indices of jobs for this section (data isolation)
  const getSectionJobIndices = () => {
    return jobFields
      .map((_, index) => ({ index, job: watch(`jobs.${index}`) }))
      .filter(({ job }) => job?.jobType === jobType)
      .map(({ index }) => index);
  };

  // Get actual indices of hours for this section (data isolation)
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
    setIsAddingJob(false);
  };

  const addTeamMember = () => {
    // Get captain's ID from form
    const captainId = getValues('captainId');

    // Get employees already added to THIS specific section (data isolation)
    const currentSectionEntries = getValues('hours') || [];
    const alreadyAddedInThisSection = currentSectionEntries
      .filter((hour) => hour.department === jobType)
      .map((hour) => hour.employeeId);

    appendHour({
      employeeId:
        captainId && !alreadyAddedInThisSection.includes(captainId)
          ? captainId
          : '', // Default to captain if not already added
      department: jobType,
      hours: 0,
      isCoCaptain: false,
    });
    setIsAddingTeamMember(false);
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

  // Get employees already added to THIS section to filter them out (proper data isolation)
  const getAlreadyAddedEmployeesForThisSection = () => {
    return allHours
      .filter((hour) => hour.department === jobType)
      .map((hour) => hour.employeeId);
  };

  // Calculate section summary
  const sectionCalculation = calculateSectionSummary(
    allJobs,
    allHours,
    employees,
    jobType,
    jobType === 'junk' ? disposalCost : undefined
  );

  const jobColor = jobType === 'junk' ? 'hunks-green' : 'hunks-orange';
  const jobColorHex = jobType === 'junk' ? '#026937' : '#ea7200';
  
  return (
    <Card className={`h-full flex flex-col ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: jobColorHex }}
              />
              {title}
            </CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <Badge variant="outline" className="text-xs">
            {sectionJobIndices.length} jobs, {sectionHourIndices.length} team
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 space-y-4">
        {/* Jobs Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Jobs
            </Label>
            {!isAddingJob && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsAddingJob(true)}
                className="text-xs"
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Job
              </Button>
            )}
          </div>

          {isAddingJob && (
            <Card className="bg-muted/30 p-3">
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="Job ID (digits)"
                    className="text-sm"
                    onChange={(e) => {
                      if (e.target.value && /^\d+$/.test(e.target.value)) {
                        const lastIndex = jobFields.length;
                        const jobId = e.target.value;
                        // Find or create the job entry
                        let existingIndex = allJobs.findIndex(
                          (job) => job.jobType === jobType && job.jobId === jobId
                        );
                        if (existingIndex === -1) {
                          appendJob({
                            jobType,
                            jobId,
                            clientName: '',
                            revenue: 0,
                            tips: 0,
                            ...(jobType === 'move' && {
                              junkOnMove: 0,
                              valuation: 0,
                              materials: 0,
                            }),
                          });
                          existingIndex = allJobs.length;
                        }
                        setIsAddingJob(false);
                      }
                    }}
                  />
                  <Input
                    placeholder="Client Name"
                    className="text-sm"
                    onChange={(e) => {
                      const value = e.target.value;
                      const latestIndex = sectionJobIndices[sectionJobIndices.length - 1];
                      if (latestIndex !== undefined) {
                        setValue(`jobs.${latestIndex}.clientName`, value);
                      }
                    }}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    onClick={addJob}
                    className="text-xs"
                  >
                    Add
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsAddingJob(false)}
                    className="text-xs"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </Card>
          )}

          <div className="space-y-2">
            {sectionJobIndices.map((globalIndex, localIndex) => (
              <JobTileCompact
                key={`${jobType}-${globalIndex}-${jobFields[globalIndex]?.id || localIndex}`}
                jobIndex={globalIndex}
                jobType={jobType}
                onRemove={() => removeJob(globalIndex)}
                canRemove={sectionJobIndices.length > 1}
                compact={true}
              />
            ))}
          </div>

          {sectionJobIndices.length === 0 && !isAddingJob && (
            <div className="text-center py-4 text-muted-foreground text-sm">
              <p>No {jobType} jobs added yet</p>
              <Button
                type="button"
                onClick={() => setIsAddingJob(true)}
                variant="ghost"
                size="sm"
                className="mt-2 text-xs"
              >
                <Plus className="h-3 w-3 mr-1" />
                Add {jobType === 'junk' ? 'Junk' : 'Move'} Job
              </Button>
            </div>
          )}
        </div>

        <Separator />

        {/* Team Hours Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Team Hours
            </Label>
            {!isAddingTeamMember && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsAddingTeamMember(true)}
                className="text-xs"
              >
                <Plus className="h-3 w-3 mr-1" />
                Add HUNK
              </Button>
            )}
          </div>

          {isAddingTeamMember && (
            <Card className="bg-muted/30 p-3">
              <div className="space-y-3">
                <FormField
                  control={control}
                  name={`hours.${hourFields.length}.employeeId`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Team Member</FormLabel>
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value);
                          // Create the hour entry
                          appendHour({
                            employeeId: value,
                            department: jobType,
                            hours: 0,
                            isCoCaptain: false,
                          });
                          setIsAddingTeamMember(false);
                        }}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="text-sm">
                            <SelectValue placeholder="Select team member" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {employees
                            .filter(
                              (employee) =>
                                !getAlreadyAddedEmployeesForThisSection().includes(
                                  employee.id
                                )
                            )
                            .map((employee) => (
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
                <div className="flex.items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsAddingTeamMember(false)}
                    className="text-xs"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </Card>
          )}

          <div className="space-y-2">
            {sectionHourIndices.map((globalIndex, localIndex) => {
              const employeeId = watch(`hours.${globalIndex}.employeeId`);
              const employee = employees.find((emp) => emp.id === employeeId);
              const hours = watch(`hours.${globalIndex}.hours`);
              const isCoCaptain = watch(`hours.${globalIndex}.isCoCaptain`);

              return (
                <Card key={`${jobType}-hour-${globalIndex}-${hourFields[globalIndex]?.id || localIndex}`} className="p-3">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">
                          {employee ? employee.fullName : 'Unknown'}
                        </span>
                        {isCoCaptain && (
                          <Badge variant="secondary" className="text-xs">
                            Co-Captain
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <FormField
                          control={control}
                          name={`hours.${globalIndex}.hours`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3 text-muted-foreground" />
                                  <Input
                                    type="number"
                                    step="0.083333"
                                    min="0"
                                    max="24"
                                    placeholder="0.0"
                                    value={field.value || ''}
                                    onChange={(e) => {
                                      const value = e.target.value;
                                      field.onChange(
                                        value === '' ? 0 : parseFloat(value)
                                      );
                                    }}
                                    className="w-16 text-sm h-7"
                                  />
                                  <span className="text-xs text-muted-foreground">h</span>
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeHour(globalIndex)}
                          className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          {sectionHourIndices.length === 0 && !isAddingTeamMember && (
            <div className="text-center py-4 text-muted-foreground text-sm">
              <p>No team members added yet</p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsAddingTeamMember(true)}
                className="mt-2 text-xs"
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Team Member
              </Button>
            </div>
          )}

          {/* Junk-specific: Disposal Cost (section level) */}
          {jobType === 'junk' && (
            <>
              <Separator />
              <div className="space-y-2">
                <Label className="text-sm font-medium">Section Cost</Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">$</span>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={disposalCost}
                    onChange={(e) =>
                      setDisposalCost(parseFloat(e.target.value) || 0)
                    }
                    className="w-24 text-sm h-8"
                  />
                  <span className="text-xs text-muted-foreground">
                    Total disposal cost
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
