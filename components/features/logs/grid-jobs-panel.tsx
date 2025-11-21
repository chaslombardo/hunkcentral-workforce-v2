'use client';

import { useFormContext } from 'react-hook-form';
import { Plus, Trash2, DollarSign, AlertCircle } from 'lucide-react';
import { useState } from 'react';

import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';

interface GridJobsPanelProps {
  jobs: any[];
  employees: any[];
}

export function GridJobsPanel({ jobs, employees }: GridJobsPanelProps) {
  const { control, setValue, getValues } = useFormContext();
  const [isAddingJob, setIsAddingJob] = useState(false);

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
    
    const currentJobs = getValues('jobs') || [];
    setValue('jobs', [...currentJobs, newJob]);
    setIsAddingJob(false);
  };

  const removeJob = (index: number) => {
    const currentJobs = getValues('jobs') || [];
    setValue('jobs', currentJobs.filter((_: any, i: number) => i !== index));
  };

  const updateJobField = (index: number, field: string, value: any) => {
    const currentJobs = getValues('jobs') || [];
    setValue(`jobs.${index}.${field}`, value);
  };

  const calculateJobTotal = (job: any) => {
    return job.revenue + job.tips + (job.junkOnMove || 0) + (job.valuation || 0) + (job.materials || 0);
  };

  const totalRevenue = jobs.reduce((sum, job) => sum + calculateJobTotal(job), 0);

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Jobs Revenue</CardTitle>
          <Badge variant="outline" className="text-xs">
            ${totalRevenue.toFixed(2)} total
          </Badge>
        </div>
        <CardDescription>
          Add and track all jobs for this log
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Add Job Buttons */}
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => addNewJob('junk')}
            className="text-xs border-green-600 text-green-600 hover:bg-green-600 hover:text-white"
          >
            <Plus className="h-3 w-3 mr-1" />
            Add Junk Job
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => addNewJob('move')}
            className="text-xs border-orange-600 text-orange-600 hover:bg-orange-600 hover:text-white"
          >
            <Plus className="h-3 w-3 mr-1" />
            Add Move Job
          </Button>
        </div>

        {/* Job Cards */}
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {jobs.map((job, index) => (
            <Card key={index} className="p-3">
              <div className="space-y-3">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {job.jobType === 'junk' ? (
                      <Badge className="bg-green-100 text-green-800 text-xs">Junk</Badge>
                    ) : (
                      <Badge className="bg-orange-100 text-orange-800 text-xs">Move</Badge>
                    )}
                    <span className="font-medium text-sm">
                      {job.jobId || 'New Job'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-hunks-orange">
                      ${calculateJobTotal(job).toFixed(2)}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeJob(index)}
                      className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                {/* Fields */}
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="Job ID"
                    value={job.jobId}
                    onChange={(e) => updateJobField(index, 'jobId', e.target.value)}
                    className="text-sm h-8"
                  />
                  <Input
                    placeholder="Client Name"
                    value={job.clientName}
                    onChange={(e) => updateJobField(index, 'clientName', e.target.value)}
                    className="text-sm h-8"
                  />
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">$</span>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="Revenue"
                      value={job.revenue || ''}
                      onChange={(e) => updateJobField(index, 'revenue', parseFloat(e.target.value) || 0)}
                      className="pl-5 text-sm h-8"
                    />
                  </div>
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">$</span>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="Tips"
                      value={job.tips || ''}
                      onChange={(e) => updateJobField(index, 'tips', parseFloat(e.target.value) || 0)}
                      className="pl-5 text-sm h-8"
                    />
                  </div>
                </div>

                {/* Move-specific fields */}
                {job.jobType === 'move' && (
                  <div className="grid grid-cols-3 gap-2">
                    <div className="relative">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">$</span>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="Junk"
                        value={job.junkOnMove || ''}
                        onChange={(e) => updateJobField(index, 'junkOnMove', parseFloat(e.target.value) || 0)}
                        className="pl-5 text-sm h-8"
                      />
                    </div>
                    <div className="relative">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">$</span>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="Valuation"
                        value={job.valuation || ''}
                        onChange={(e) => updateJobField(index, 'valuation', parseFloat(e.target.value) || 0)}
                        className="pl-5 text-sm h-8"
                      />
                    </div>
                    <div className="relative">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">$</span>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="Materials"
                        value={job.materials || ''}
                        onChange={(e) => updateJobField(index, 'materials', parseFloat(e.target.value) || 0)}
                        className="pl-5 text-sm h-8"
                      />
                    </div>
                  </div>
                )}
              </div>
            </Card>
          ))}

          {jobs.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">No jobs added yet</p>
              <p className="text-xs">Click the buttons above to add jobs</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
