'use client';

import { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { Trash2, ChevronDown, ChevronUp } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';

import type { DailyLogFormData, LogJobFormData } from '@/lib/validations';

interface JobTileProps {
  jobIndex: number;
  jobType: 'junk' | 'move';
  onRemove: () => void;
  canRemove: boolean;
}

export function JobTile({ jobIndex, jobType, onRemove, canRemove }: JobTileProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const { control, watch, formState: { errors } } = useFormContext<DailyLogFormData>();
  
  const jobData = watch(`jobs.${jobIndex}`) as LogJobFormData;
  const isMove = jobType === 'move';
  
  // Check if this job has validation errors
  const hasErrors = errors.jobs?.[jobIndex];

  return (
    <Card className={`relative ${hasErrors ? 'border-destructive' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium">
            {isMove ? 'Move' : 'Junk'} Job
            {jobData?.clientName && (
              <span className="text-sm font-normal text-muted-foreground ml-2">
                - {jobData.clientName}
              </span>
            )}
            {jobData?.jobId && (
              <span className="text-xs font-normal text-muted-foreground ml-2">
                ({jobData.jobId})
              </span>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
            </Collapsible>
            {canRemove && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onRemove}
                className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleContent>
          <CardContent className="space-y-4">
            {/* Basic Job Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={control}
                name={`jobs.${jobIndex}.jobId`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Job ID *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Enter job ID"
                        className="focus-visible:ring-hunks-green"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name={`jobs.${jobIndex}.clientName`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Client Name *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Enter client name"
                        className="focus-visible:ring-hunks-green"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Revenue and Tips */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={control}
                name={`jobs.${jobIndex}.revenue`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Revenue *</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                          $
                        </span>
                        <Input
                          {...field}
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          className="pl-8 focus-visible:ring-hunks-green"
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name={`jobs.${jobIndex}.tips`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tips</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                          $
                        </span>
                        <Input
                          {...field}
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          className="pl-8 focus-visible:ring-hunks-green"
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Move-specific fields */}
            {isMove && (
              <>
                <Separator />
                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-hunks-green">Move Upsells</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={control}
                      name={`jobs.${jobIndex}.junkOnMove`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Junk on Move</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                                $
                              </span>
                              <Input
                                {...field}
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="0.00"
                                className="pl-8 focus-visible:ring-hunks-green"
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={control}
                      name={`jobs.${jobIndex}.valuation`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Valuation</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                                $
                              </span>
                              <Input
                                {...field}
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="0.00"
                                className="pl-8 focus-visible:ring-hunks-green"
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={control}
                      name={`jobs.${jobIndex}.materials`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Materials</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                                $
                              </span>
                              <Input
                                {...field}
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="0.00"
                                className="pl-8 focus-visible:ring-hunks-green"
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}