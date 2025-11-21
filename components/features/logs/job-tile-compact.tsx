'use client';

import { Trash2, DollarSign, AlertCircle } from 'lucide-react';
import { useState, useEffect } from 'react';

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useFormContext } from 'react-hook-form';
import type { DailyLogFormData } from '@/lib/validations';

interface JobTileCompactProps {
  jobIndex: number;
  jobType: 'junk' | 'move';
  onRemove: () => void;
  canRemove: boolean;
  compact?: boolean;
}

export function JobTileCompact({
  jobIndex,
  jobType,
  onRemove,
  canRemove,
  compact = true,
}: JobTileCompactProps) {
  const { control, watch, setValue } = useFormContext<DailyLogFormData>();
  
  // Watch all fields for this job
  const jobId = watch(`jobs.${jobIndex}.jobId`);
  const clientName = watch(`jobs.${jobIndex}.clientName`);
  const revenue = watch(`jobs.${jobIndex}.revenue`);
  const tips = watch(`jobs.${jobIndex}.tips`);
  
  // Move-specific fields
  const junkOnMove = watch(`jobs.${jobIndex}.junkOnMove`);
  const valuation = watch(`jobs.${jobIndex}.valuation`);
  const materials = watch(`jobs.${jobIndex}.materials`);

  const jobColor = jobType === 'junk' ? 'hunks-green' : 'hunks-orange';
  const jobColorHex = jobType === 'junk' ? '#026937' : '#ea7200';

  // Calculate total
  const totalRevenue = revenue + tips + (junkOnMove || 0) + (valuation || 0) + (materials || 0);

  // Handle job ID validation
  const isValidJobId = jobId && /^\d{7,10}$/.test(jobId);
  const isValidClientName = clientName && clientName.trim().length > 0;

  const hasError = !isValidJobId || !isValidClientName;

  return (
    <Card className={`relative ${hasError ? 'border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-950/20' : ''} ${compact ? 'p-3' : 'p-4'}`}>
      <CardContent className={`${compact ? 'p-0' : 'p-0'} space-y-3`}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {!isValidJobId && (
              <AlertCircle className="h-4 w-4 text-destructive" />
            )}
            <span className={`font-medium ${compact ? 'text-sm' : ''}`}>
              {jobId || 'New Job'}
            </span>
            {jobType === 'junk' && (
              <Badge variant="secondary" className="text-xs">Junk</Badge>
            )}
            {jobType === 'move' && (
              <Badge variant="secondary" className="text-xs bg-hunks-orange text-white">Move</Badge>
            )}
          </div>
          {canRemove && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onRemove}
              className="h-6 w-6 p-0 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          )}
        </div>

        {/* Main Fields */}
        <div className={`grid grid-cols-2 gap-2 ${compact ? 'text-sm' : ''}`}>
          {/* Job ID */}
          <FormField
            control={control}
            name={`jobs.${jobIndex}.jobId`}
            render={({ field }) => (
              <FormItem>
                <FormLabel className={compact ? 'text-xs' : ''}>Job ID</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="1234567"
                    className={`${compact ? 'h-7 text-sm' : ''} ${
                      !isValidJobId ? 'border-red-300 focus:border-red-400' : ''
                    }`}
                  />
                </FormControl>
                {!isValidJobId && (
                  <FormMessage className="text-xs" />
                )}
              </FormItem>
            )}
          />

          {/* Client Name */}
          <FormField
            control={control}
            name={`jobs.${jobIndex}.clientName`}
            render={({ field }) => (
              <FormItem>
                <FormLabel className={compact ? 'text-xs' : ''}>Client</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="Client name"
                    className={`${compact ? 'h-7 text-sm' : ''} ${
                      !isValidClientName ? 'border-red-300 focus:border-red-400' : ''
                    }`}
                  />
                </FormControl>
                {!isValidClientName && (
                  <FormMessage className="text-xs" />
                )}
              </FormItem>
            )}
          />

          {/* Revenue */}
          <FormField
            control={control}
            name={`jobs.${jobIndex}.revenue`}
            render={({ field }) => (
              <FormItem>
                <FormLabel className={compact ? 'text-xs' : ''}>Revenue</FormLabel>
                <FormControl>
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                      $
                    </span>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      className={`pl-5 ${compact ? 'h-7 text-sm' : ''}`}
                    />
                  </div>
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />

          {/* Tips */}
          <FormField
            control={control}
            name={`jobs.${jobIndex}.tips`}
            render={({ field }) => (
              <FormItem>
                <FormLabel className={compact ? 'text-xs' : ''}>Tips</FormLabel>
                <FormControl>
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                      $
                    </span>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      className={`pl-5 ${compact ? 'h-7 text-sm' : ''}`}
                    />
                  </div>
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />
        </div>

        {/* Move-specific fields */}
        {jobType === 'move' && (
          <div className={`grid grid-cols-3 gap-2 ${compact ? 'text-sm' : ''}`}>
            {/* Junk on Move */}
            <FormField
              control={control}
              name={`jobs.${jobIndex}.junkOnMove`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={compact ? 'text-xs' : ''}>Junk</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                        $
                      </span>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        className={`pl-5 ${compact ? 'h-7 text-sm' : ''}`}
                      />
                    </div>
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            {/* Valuation */}
            <FormField
              control={control}
              name={`jobs.${jobIndex}.valuation`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={compact ? 'text-xs' : ''}>Valuation</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                        $
                      </span>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        className={`pl-5 ${compact ? 'h-7 text-sm' : ''}`}
                      />
                    </div>
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            {/* Materials */}
            <FormField
              control={control}
              name={`jobs.${jobIndex}.materials`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={compact ? 'text-xs' : ''}>Materials</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                        $
                      </span>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        className={`pl-5 ${compact ? 'h-7 text-sm' : ''}`}
                      />
                    </div>
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
          </div>
        )}

        {/* Total */}
        <div className="flex items-center justify-between pt-2 border-t">
          <span className={`font-medium ${compact ? 'text-sm' : ''}`}>Total</span>
          <span className={`font-bold ${compact ? 'text-sm' : ''} ${jobColor}`}>
            ${totalRevenue.toFixed(2)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
