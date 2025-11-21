'use client';

import { useFormContext } from 'react-hook-form';
import { Plus, Trash2, DollarSign, AlertCircle } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface WizardJobsStepProps {
  form: any;
  employees: any[];
}

export function WizardJobsStep({ form, employees }: WizardJobsStepProps) {
  const { control, setValue, getValues, watch } = useFormContext();
  const jobs = watch('jobs') || [];
  const sections = watch('sections');

  const addNewJob = (jobType: 'junk' | 'move') => {
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

    setValue('jobs', [...jobs, newJob]);
  };

  const removeJob = (index: number) => {
    const currentJobs = getValues('jobs') || [];
    setValue(
      'jobs',
      currentJobs.filter((_: any, i: number) => i !== index)
    );
  };

  const updateJobField = (index: number, field: string, value: any) => {
    setValue(`jobs.${index}.${field}`, value);
  };

  const calculateJobTotal = (job: any) => {
    return (
      job.revenue +
      job.tips +
      (job.junkOnMove || 0) +
      (job.valuation || 0) +
      (job.materials || 0)
    );
  };

  // Separate jobs by type
  const junkJobs = jobs.filter((job: any) => job.jobType === 'junk');
  const moveJobs = jobs.filter((job: any) => job.jobType === 'move');

  return (
    <div className="space-y-6">
      {/* Instructions */}
      <Alert>
        <DollarSign className="h-4 w-4" />
        <AlertDescription>
          Enter all jobs completed for this log. Include job IDs, client names,
          and revenue details. Job IDs must be 7-10 digits and contain only
          numbers.
        </AlertDescription>
      </Alert>

      {/* Tabs for Job Types */}
      <Tabs defaultValue="junk" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger
            value="junk"
            disabled={!sections.junk}
            className="data-[state=active]:bg-green-600 data-[state=active]:text-white"
          >
            Junk Jobs ({junkJobs.length})
          </TabsTrigger>
          <TabsTrigger
            value="move"
            disabled={!sections.move}
            className="data-[state=active]:bg-orange-600 data-[state=active]:text-white"
          >
            Move Jobs ({moveJobs.length})
          </TabsTrigger>
        </TabsList>

        {/* Junk Jobs Tab */}
        <TabsContent value="junk" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Junk Removal Jobs</h3>
            <Button
              type="button"
              onClick={() => addNewJob('junk')}
              className="bg-green-600 hover:bg-green-600/90 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Junk Job
            </Button>
          </div>

          <div className="grid gap-4">
            {junkJobs.map((job: any, index: number) => {
              const globalIndex = jobs.indexOf(job);
              return (
                <JobCard
                  key={globalIndex}
                  job={job}
                  index={globalIndex}
                  onUpdate={updateJobField}
                  onRemove={removeJob}
                  jobType="junk"
                />
              );
            })}
          </div>

          {junkJobs.length === 0 && (
            <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
              <p className="text-sm">No junk jobs added yet</p>
              <Button
                type="button"
                variant="outline"
                onClick={() => addNewJob('junk')}
                className="mt-4"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add First Junk Job
              </Button>
            </div>
          )}
        </TabsContent>

        {/* Move Jobs Tab */}
        <TabsContent value="move" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Moving Jobs</h3>
            <Button
              type="button"
              onClick={() => addNewJob('move')}
              className="bg-orange-600 hover:bg-orange-600/90 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Move Job
            </Button>
          </div>

          <div className="grid gap-4">
            {moveJobs.map((job: any, index: number) => {
              const globalIndex = jobs.indexOf(job);
              return (
                <JobCard
                  key={globalIndex}
                  job={job}
                  index={globalIndex}
                  onUpdate={updateJobField}
                  onRemove={removeJob}
                  jobType="move"
                />
              );
            })}
          </div>

          {moveJobs.length === 0 && (
            <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
              <p className="text-sm">No move jobs added yet</p>
              <Button
                type="button"
                variant="outline"
                onClick={() => addNewJob('move')}
                className="mt-4"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add First Move Job
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Job Summary */}
      {jobs.length > 0 && (
        <Card className="bg-muted/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Job Summary</h4>
                <div className="text-sm text-muted-foreground">
                  {junkJobs.length} junk job(s), {moveJobs.length} move job(s)
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-muted-foreground">
                  Total Revenue
                </div>
                <div className="text-lg font-bold text-hunks-green">
                  $
                  {jobs
                    .reduce(
                      (sum: number, job: any) => sum + calculateJobTotal(job),
                      0
                    )
                    .toFixed(2)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

interface JobCardProps {
  job: any;
  index: number;
  onUpdate: (index: number, field: string, value: any) => void;
  onRemove: (index: number) => void;
  jobType: 'junk' | 'move';
}

function JobCard({ job, index, onUpdate, onRemove, jobType }: JobCardProps) {
  const calculateJobTotal = (job: any) => {
    return (
      job.revenue +
      job.tips +
      (job.junkOnMove || 0) +
      (job.valuation || 0) +
      (job.materials || 0)
    );
  };

  const hasError =
    !job.jobId || !/^\d{7,10}$/.test(job.jobId) || !job.clientName?.trim();

  return (
    <Card
      className={`relative ${hasError ? 'border-red-200 bg-red-50/50' : ''}`}
    >
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {!job.jobId ||
                (!/^\d{7,10}$/.test(job.jobId) && (
                  <AlertCircle className="h-4 w-4 text-destructive" />
                ))}
              <span className="font-medium">{job.jobId || 'New Job'}</span>
              <Badge variant={jobType === 'junk' ? 'default' : 'secondary'}>
                {jobType === 'junk' ? 'Junk' : 'Move'}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold">
                ${calculateJobTotal(job).toFixed(2)}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onRemove(index)}
                className="h-6 w-6 p-0 text-destructive hover:text-destructive"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {/* Fields */}
          <div className="grid grid-cols-2 gap-3">
            <Input
              placeholder="Job ID (1234567)"
              value={job.jobId}
              onChange={(e) => onUpdate(index, 'jobId', e.target.value)}
              className={hasError ? 'border-red-300' : ''}
            />
            <Input
              placeholder="Client Name"
              value={job.clientName}
              onChange={(e) => onUpdate(index, 'clientName', e.target.value)}
              className={hasError ? 'border-red-300' : ''}
            />
            <Input
              placeholder="Revenue"
              type="number"
              step="0.01"
              min="0"
              value={job.revenue || ''}
              onChange={(e) =>
                onUpdate(index, 'revenue', parseFloat(e.target.value) || 0)
              }
              prefix="$"
            />
            <Input
              placeholder="Tips"
              type="number"
              step="0.01"
              min="0"
              value={job.tips || ''}
              onChange={(e) =>
                onUpdate(index, 'tips', parseFloat(e.target.value) || 0)
              }
              prefix="$"
            />
          </div>

          {/* Move-specific fields */}
          {jobType === 'move' && (
            <div className="grid grid-cols-3 gap-3">
              <Input
                placeholder="Junk on Move"
                type="number"
                step="0.01"
                min="0"
                value={job.junkOnMove || ''}
                onChange={(e) =>
                  onUpdate(index, 'junkOnMove', parseFloat(e.target.value) || 0)
                }
                prefix="$"
              />
              <Input
                placeholder="Valuation"
                type="number"
                step="0.01"
                min="0"
                value={job.valuation || ''}
                onChange={(e) =>
                  onUpdate(index, 'valuation', parseFloat(e.target.value) || 0)
                }
                prefix="$"
              />
              <Input
                placeholder="Materials"
                type="number"
                step="0.01"
                min="0"
                value={job.materials || ''}
                onChange={(e) =>
                  onUpdate(index, 'materials', parseFloat(e.target.value) || 0)
                }
                prefix="$"
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
