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
import { createCommissionEntry } from '@/lib/actions/commission';
import { useToast } from '@/hooks/use-toast';

import { BrandButton } from '@/components/brand/brand-button';
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';

interface CommissionFormProps {
  salesUsers: Array<{
    id: string;
    fullName: string;
    email: string;
    commissionRate: number | null;
  }>;
  currentUserId?: string;
}

export function CommissionForm({
  salesUsers,
  currentUserId,
}: CommissionFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<CommissionEntryFormData>({
    resolver: zodResolver(CommissionEntrySchema),
    defaultValues: {
      salesId: currentUserId || '',
      jobId: '',
      clientName: '',
      jobType: 'junk',
      targetDate: new Date(),
      estimatedRevenue: 0.01,
    },
  });

  const onSubmit = async (data: CommissionEntryFormData) => {
    setIsSubmitting(true);
    try {
      const result = await createCommissionEntry(data);

      if (result.success) {
        toast({
          title: 'Success',
          description: 'Commission entry created successfully',
        });
        form.reset();
        router.push('/commission/list');
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to create commission entry',
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
          {/* Sales Consultant Field with Enhanced UX */}
          <FormField
            control={form.control}
            name="salesId"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel className="flex items-center gap-2 text-base font-semibold">
                  <User className="h-4 w-4 text-[#026937]" />
                  Sales Consultant
                </FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="w-full h-12 transition-all duration-200 hover:border-[#026937]/50 focus:border-[#026937] focus:ring-2 focus:ring-[#026937]/20">
                      <SelectValue placeholder="Select sales consultant" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="max-h-60">
                    {salesUsers.map((user) => (
                      <SelectItem
                        key={user.id}
                        value={user.id}
                        className="transition-colors duration-150 hover:bg-[#026937]/5"
                      >
                        <div className="flex flex-col items-start text-left w-full py-1">
                          <span className="font-medium text-foreground">
                            {user.fullName}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {user.email}
                          </span>
                          {user.commissionRate && (
                            <span className="text-xs text-[#026937] font-medium flex items-center gap-1 mt-1">
                              <CheckCircle className="h-3 w-3" />
                              {user.commissionRate}% commission rate
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription className="text-sm text-muted-foreground">
                  Select the sales consultant who booked this job. You can
                  select any sales person with commission permissions.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Job ID Field with Enhanced Validation UX */}
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
                        // Only allow numeric input with smooth feedback
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
                  Must be 7-10 digits, numeric only. Must match exactly what
                  will be entered in the captain&apos;s log. Duplicate job IDs
                  are not allowed.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Client Name Field with Enhanced UX */}
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
                  <Input
                    placeholder="Enter client name"
                    {...field}
                    className="h-12 transition-all duration-200 hover:border-[#026937]/50 focus:border-[#026937] focus:ring-2 focus:ring-[#026937]/20"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Job Type Field with Enhanced UX */}
          <FormField
            control={form.control}
            name="jobType"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel className="flex items-center gap-2 text-base font-semibold">
                  <Briefcase className="h-4 w-4 text-[#026937]" />
                  Job Type
                </FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="h-12 transition-all duration-200 hover:border-[#026937]/50 focus:border-[#026937] focus:ring-2 focus:ring-[#026937]/20">
                      <SelectValue placeholder="Select job type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem
                      value="junk"
                      className="transition-colors duration-150 hover:bg-[#026937]/5"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-[#ea7200]"></div>
                        Junk Removal
                      </div>
                    </SelectItem>
                    <SelectItem
                      value="move"
                      className="transition-colors duration-150 hover:bg-[#026937]/5"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-[#026937]"></div>
                        Moving
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Target Date Field with Enhanced UX */}
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

          {/* Estimated Revenue Field with Enhanced UX */}
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
                      type="number"
                      step="0.01"
                      min="0.01"
                      placeholder="0.00"
                      className="pl-10 h-12 text-lg font-medium transition-all duration-200 hover:border-[#026937]/50 focus:border-[#026937] focus:ring-2 focus:ring-[#026937]/20"
                      {...field}
                      value={field.value || ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === '') {
                          field.onChange(0.01);
                        } else {
                          const numValue = parseFloat(value);
                          field.onChange(
                            isNaN(numValue) ? 0.01 : Math.max(0.01, numValue)
                          );
                        }
                      }}
                      onFocus={(e) => {
                        e.target.select();
                      }}
                    />
                    {field.value && field.value > 0.01 && (
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

          {/* Enhanced Action Buttons */}
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
              {isSubmitting ? 'Creating Entry...' : 'Create Entry'}
            </BrandButton>
          </div>
        </form>
      </Form>

      {/* Enhanced Success Animation Area */}
      <div className="mt-8 p-6 bg-gradient-to-r from-[#026937]/5 to-[#ea7200]/5 rounded-lg border border-[#026937]/20">
        <h3 className="font-semibold mb-3 text-[#026937] flex items-center gap-2">
          <CheckCircle className="h-5 w-5" />
          Important Notes:
        </h3>
        <ul className="text-sm text-muted-foreground space-y-2">
          <li className="flex items-start gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[#026937] mt-2 flex-shrink-0"></div>
            Job ID must be unique and match exactly what will be entered in the
            captain&apos;s log
          </li>
          <li className="flex items-start gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[#026937] mt-2 flex-shrink-0"></div>
            Commission entries can only be edited or deleted while in
            &quot;pending&quot; status
          </li>
          <li className="flex items-start gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[#026937] mt-2 flex-shrink-0"></div>
            Once matched to a completed job, the actual revenue and commission
            will be calculated automatically
          </li>
          <li className="flex items-start gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[#026937] mt-2 flex-shrink-0"></div>
            Booking accuracy is calculated by comparing estimated vs actual
            revenue
          </li>
        </ul>
      </div>
    </div>
  );
}
