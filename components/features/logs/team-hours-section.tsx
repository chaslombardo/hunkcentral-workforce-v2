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

import { SectionSummary } from './section-summary';
import type { DailyLogFormData } from '@/lib/validations';
import { calculateOtherHoursSection } from '@/lib/logCalculations';
import type { User } from '@/types';

const departments = [
  { value: 'junk', label: 'Junk Removal' },
  { value: 'move', label: 'Moving' },
  { value: 'zigma', label: 'Zigma' },
  { value: 'training', label: 'Training' },
  { value: 'estimating', label: 'Estimating' },
  { value: 'warehouse', label: 'Warehouse' },
  { value: 'admin', label: 'Administrative' },
];

interface TeamHoursSectionProps {
  title: string;
  description: string;
  employees?: User[];
}

export function TeamHoursSection({
  title,
  description,
  employees,
}: TeamHoursSectionProps) {
  const { control, watch } = useFormContext<DailyLogFormData>();

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'hours',
  });

  const addTeamMember = () => {
    append({
      employeeId: '',
      department: 'junk',
      hours: 0,
      isCoCaptain: false,
    });
  };

  const removeTeamMember = (index: number) => {
    remove(index);
  };

  // Watch all hours for real-time calculations
  const allHours = watch('hours') || [];

  // Calculate other hours section summary - use empty array if no employees provided
  const otherHoursCalculation = calculateOtherHoursSection(
    allHours,
    employees || []
  );

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {fields.length === 0 ? (
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
                {fields.map((field, index) => {
                  const employeeId = watch(`hours.${index}.employeeId`);
                  const employee = employees?.find(
                    (emp) => emp.id === employeeId
                  );
                  const hours = watch(`hours.${index}.hours`);
                  const department = watch(`hours.${index}.department`);
                  const isCoCaptain = watch(`hours.${index}.isCoCaptain`);

                  return (
                    <AccordionItem key={field.id} value={`item-${index}`}>
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
                            <span>
                              {
                                departments.find((d) => d.value === department)
                                  ?.label
                              }
                            </span>
                            <span>{hours}h</span>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pt-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Employee Selection */}
                          <FormField
                            control={control}
                            name={`hours.${index}.employeeId`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Employee</FormLabel>
                                <Select
                                  onValueChange={field.onChange}
                                  value={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select employee" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {employees?.map((employee) => (
                                      <SelectItem
                                        key={employee.id}
                                        value={employee.id}
                                      >
                                        {employee.fullName}
                                      </SelectItem>
                                    )) || []}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          {/* Department Selection */}
                          <FormField
                            control={control}
                            name={`hours.${index}.department`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Department</FormLabel>
                                <Select
                                  onValueChange={field.onChange}
                                  value={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select department" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {departments.map((dept) => (
                                      <SelectItem
                                        key={dept.value}
                                        value={dept.value}
                                      >
                                        {dept.label}
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
                            name={`hours.${index}.hours`}
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
                                      field.onChange(
                                        value === '' ? 0 : parseFloat(value)
                                      );
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
                            name={`hours.${index}.isCoCaptain`}
                            render={({ field }) => (
                              <FormItem className="flex flex-col justify-end">
                                <div className="flex items-center space-x-2">
                                  <FormControl>
                                    <Checkbox
                                      id={`co-captain-${index}`}
                                      checked={field.value}
                                      onCheckedChange={field.onChange}
                                      className="data-[state=checked]:border-hunks-orange data-[state=checked]:bg-hunks-orange data-[state=checked]:text-white"
                                    />
                                  </FormControl>
                                  <Label
                                    htmlFor={`co-captain-${index}`}
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                  >
                                    Co-Captain
                                  </Label>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  Check if this employee served as co-captain
                                  for this section
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
                            onClick={() => removeTeamMember(index)}
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

      {/* Other Hours Summary - only show if there are hours */}
      {otherHoursCalculation.totalHours > 0 && (
        <SectionSummary
          title={`${title} Summary`}
          calculation={otherHoursCalculation}
        />
      )}
    </div>
  );
}
