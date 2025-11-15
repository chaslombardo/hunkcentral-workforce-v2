'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import {
  CalendarIcon,
  CheckCircle,
  DollarSign,
  User,
  Calendar as CalendarLucide,
  Briefcase,
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  CommissionEntrySchema,
  type CommissionEntryFormData,
} from '@/lib/validations';
import { updateCommissionEntry } from '@/lib/actions/commission';
import { useToast } from '@/hooks/use-toast';

import { BrandButton } from '@/components/brand/brand-button';
import { ClientAutocomplete } from './client-autocomplete';
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { SalesConsultantSelect } from './sales-consultant-select';
import {
  COMMISSION_JOB_TYPE_OPTIONS,
  normalizeCommissionJobType,
} from './job-type-options';

interface EditCommissionFormProps {
  commissionEntry: {
    id: string;
    salesId: string;
    jobId: string;
    clientName: string;
    jobType: string;
    targetDate: Date;
    estimatedRevenue: number;
    sales: {
      id: string;
      fullName: string;
      email: string;
      commissionRate: number | null;
    };
  };
  salesUsers: Array<{
    id: string;
    fullName: string;
    email: string;
    commissionRate: number | null;
  }>;
}

export function EditCommissionForm({
  commissionEntry,
  salesUsers,
}: EditCommissionFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const normalizedJobType = normalizeCommissionJobType(commissionEntry.jobType);

  const form = useForm<CommissionEntryFormData>({
    resolver: zodResolver(CommissionEntrySchema),
    defaultValues: {
      salesId: commissionEntry.salesId,
      jobId: commissionEntry.jobId,
      clientName: commissionEntry.clientName,
      jobType: normalizedJobType,
      targetDate: new Date(commissionEntry.targetDate),
      estimatedRevenue:
        commissionEntry.estimatedRevenue ?? (undefined as unknown as number),
    },
  });

  const onSubmit = async (data: CommissionEntryFormData) => {
    setIsSubmitting(true);
    try {
      const result = await updateCommissionEntry(commissionEntry.id, data);

      if (result.success) {
        toast({
          title: 'Success',
          description: 'Commission entry updated successfully',
        });
        router.push('/commission/list');
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to update commission entry',
          variant: 'destructive',
        });
      }
    } catch {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/* Sales Consultant Field */}
          <FormField
            control={form.control}
            name="salesId"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel className="flex items-center gap-2 text-base font-semibold">
                  <User className="h-4 w-4 text-[#026937]" />
                  Sales Consultant
                </FormLabel>
                <FormControl>
                  <SalesConsultantSelect
                    salesUsers={salesUsers}
                    value={field.value}
                    onChange={field.onChange}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Job ID Field */}
          <FormField
            control={form.control}
            name="jobId"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel className="flex items-center gap-2 text-base font-semibold">
                  <Briefcase className="h-4 w-4 text-[#026937]" />
                  Job ID *
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      placeholder="Enter 7-10 digit job ID (e.g., 1234567)"
                      {...field}
                      className="font-mono h-12 text-lg tracking-wider transition-all duration-200 hover:border-[#026937]/50 focus:border-[#026937] focus:ring-2 focus:ring-[#026937]/20 pr-12"
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '');
                        field.onChange(value);
                      }}
                      maxLength={10}
                      inputMode="numeric"
                      pattern="[0-9]*"
                    />
                    {field.value &&
                      field.value.length >= 7 &&
                      field.value.length <= 10 && (
                        <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#026937] animate-in fade-in-0 duration-200" />
                      )}
                  </div>
                </FormControl>
                <FormDescription className="text-sm text-muted-foreground">
                  Must be 7-10 digits, numeric only.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Client Name Field */}
          <FormField
            control={form.control}
            name="clientName"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel className="flex items-center gap-2 text-base font-semibold">
                  <User className="h-4 w-4 text-[#026937]" />
                  Client Name
                </FormLabel>
                <FormControl>
                  <ClientAutocomplete
                    value={field.value}
                    onValueChange={field.onChange}
                    placeholder="Enter or search for client name"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Job Type Field */}
          <FormField
            control={form.control}
            name="jobType"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel className="flex items-center gap-2 text-base font-semibold">
                  <Briefcase className="h-4 w-4 text-[#026937]" />
                  Job Type
                </FormLabel>
                <div className="grid gap-3 sm:grid-cols-2">
                  {COMMISSION_JOB_TYPE_OPTIONS.map((option) => (
                    <button
                      type="button"
                      key={option.value}
                      onClick={() => field.onChange(option.value)}
                      className={cn(
                        'rounded-xl border p-3 text-left transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#026937]/40',
                        field.value === option.value
                          ? 'border-[#026937] bg-[#026937]/5 shadow-sm'
                          : 'border-border hover:border-[#026937]/40'
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            'h-2 w-2 rounded-full',
                            option.indicatorClass
                          )}
                        />
                        <span className="text-sm font-semibold">
                          {option.label}
                        </span>
                      </div>
                      <p className="mt-2 text-xs text-muted-foreground">
                        {option.description}
                      </p>
                    </button>
                  ))}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Target Date Field */}
          <FormField
            control={form.control}
            name="targetDate"
            render={({ field }) => (
              <FormItem className="flex flex-col space-y-3">
                <FormLabel className="flex items-center gap-2 text-base font-semibold">
                  <CalendarLucide className="h-4 w-4 text-[#026937]" />
                  Target Date
                </FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <BrandButton
                        variant="outline"
                        className={cn(
                          'w-full h-12 pl-4 text-left font-normal transition-all duration-200 hover:border-[#026937]/50 focus:border-[#026937] focus:ring-2 focus:ring-[#026937]/20',
                          !field.value && 'text-muted-foreground'
                        )}
                      >
                        {field.value ? (
                          <span className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-[#026937]" />
                            {format(field.value, 'PPP')}
                          </span>
                        ) : (
                          <span className="flex items-center gap-2">
                            <CalendarIcon className="h-4 w-4 opacity-50" />
                            Pick a date
                          </span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </BrandButton>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      initialFocus
                      className="rounded-md border"
                    />
                  </PopoverContent>
                </Popover>
                <FormDescription className="text-sm text-muted-foreground">
                  Expected completion date for this job
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Estimated Revenue Field */}
          <FormField
            control={form.control}
            name="estimatedRevenue"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel className="flex items-center gap-2 text-base font-semibold">
                  <DollarSign className="h-4 w-4 text-[#026937]" />
                  Estimated Revenue
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium text-lg">
                      $
                    </span>
                    <Input
                      type="text"
                      inputMode="decimal"
                      placeholder="0.00"
                      className="pl-10 h-12 text-lg font-medium transition-all duration-200 hover:border-[#026937]/50 focus:border-[#026937] focus:ring-2 focus:ring-[#026937]/20"
                      value={
                        field.value === undefined ? '' : String(field.value)
                      }
                      onChange={(e) => {
                        const rawValue = e.target.value.replace(/[^0-9.]/g, '');
                        if (rawValue === '') {
                          field.onChange(undefined as unknown as number);
                          return;
                        }
                        const parsed = parseFloat(rawValue);
                        field.onChange(
                          Number.isNaN(parsed)
                            ? (undefined as unknown as number)
                            : parsed
                        );
                      }}
                      onBlur={() => {
                        if (typeof field.value === 'number') {
                          field.onChange(Number(field.value.toFixed(2)));
                        }
                      }}
                    />
                    {typeof field.value === 'number' && field.value > 0 && (
                      <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#026937] animate-in fade-in-0 duration-200" />
                    )}
                  </div>
                </FormControl>
                <FormDescription className="text-sm text-muted-foreground">
                  Your estimated revenue for this job
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Action Buttons */}
          <div className="flex gap-4 pt-8 border-t border-border/50">
            <BrandButton
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isSubmitting}
              className="flex-1 h-12 transition-all duration-200 hover:border-[#026937]/50"
            >
              Cancel
            </BrandButton>
            <BrandButton
              type="submit"
              variant="primary"
              loading={isSubmitting}
              className="flex-1 h-12 bg-gradient-to-r from-[#026937] to-[#026937]/90 hover:from-[#026937]/90 hover:to-[#026937] transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              {isSubmitting ? 'Updating Entry...' : 'Update Entry'}
            </BrandButton>
          </div>
        </form>
      </Form>
    </div>
  );
}
