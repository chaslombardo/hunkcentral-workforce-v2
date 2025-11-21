'use client';

import { useFormContext } from 'react-hook-form';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormDescription,
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

interface WizardStepInfoProps {
  form: any;
  captains: any[];
  user: any;
}

export function WizardStepInfo({ form, captains, user }: WizardStepInfoProps) {
  const { control, watch } = form;
  const watchedSections = watch('sections');

  return (
    <div className="space-y-6">
      {/* Captain and Date */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Captain Selector */}
        <FormField
          control={control}
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
                Select the captain responsible for this log
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Date Selector */}
        <FormField
          control={control}
          name="logDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Log Date</FormLabel>
              <FormControl>
                <Input
                  type="date"
                  placeholder="Select date"
                  value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''}
                  onChange={(e) => {
                    const date = e.target.value;
                    field.onChange(date ? new Date(date) : new Date());
                  }}
                  max={new Date().toISOString().split('T')[0]}
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

      {/* Section Selection */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium">Log Sections</h3>
          <p className="text-sm text-muted-foreground">
            Choose which sections to include in this daily log
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Junk Section */}
          <FormField
            control={control}
            name="sections.junk"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Junk Jobs</FormLabel>
                  <FormDescription>
                    Junk removal jobs and disposal costs
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />

          {/* Move Section */}
          <FormField
            control={control}
            name="sections.move"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Move Jobs</FormLabel>
                  <FormDescription>
                    Moving jobs and upsells
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />

          {/* Other Hours Section */}
          <FormField
            control={control}
            name="sections.otherHours"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Other Hours</FormLabel>
                  <FormDescription>
                    Training, admin, and other activities
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />
        </div>
      </div>

      {/* Summary */}
      <div className="bg-muted/20 p-4 rounded-lg">
        <h4 className="font-medium mb-2">Log Summary</h4>
        <div className="text-sm text-muted-foreground space-y-1">
          <p>• {watchedSections.junk ? '✓' : '✗'} Junk jobs section included</p>
          <p>• {watchedSections.move ? '✓' : '✗'} Move jobs section included</p>
          <p>• {watchedSections.otherHours ? '✓' : '✗'} Other hours section included</p>
        </div>
      </div>
    </div>
  );
}
