'use client';

import { useFieldArray, useFormContext } from 'react-hook-form';
import { Plus, Trash2, Users, Clock, Briefcase } from 'lucide-react';
import { useState } from 'react';

import {
  FormControl,
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
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';

import type { DailyLogFormData } from '@/lib/validations';
import { calculateOtherHoursSection } from '@/lib/logCalculations';
import type { User } from '@/types';

// Departments for Other Hours section (exclude junk and move)
const otherHoursDepartments = [
  { value: 'zigma', label: 'Zigma', color: 'hunks-purple' },
  { value: 'training', label: 'Training', color: 'hunks-blue' },
  { value: 'estimating', label: 'Estimating', color: 'hunks-teal' },
  { value: 'warehouse', label: 'Warehouse', color: 'hunks-gray' },
  { value: 'admin', label: 'Administrative', color: 'hunks-orange' },
];

interface SinglePageOtherHoursSectionProps {
  title: string;
  description: string;
  employees?: User[];
  className?: string;
}

export function SinglePageOtherHoursSection({
  title,
  description,
  employees = [],
  className = '',
}: SinglePageOtherHoursSectionProps) {
  const { control, watch, getValues, setValue } = useFormContext<DailyLogFormData>();
  const [isAddingTeamMember, setIsAddingTeamMember] = useState(false);

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'hours',
  });

  // Get captain's ID and departments worked already
  const captainId = getValues('captainId');
  const allHours = watch('hours') || [];
  const jobs = watch('jobs') || [];
  
  // Determine which departments the captain already worked in from jobs/move/junk
  const workedDepartments = new Set<string>();
  jobs.forEach(job => {
    if (job.jobType === 'junk') workedDepartments.add('junk');
    if (job.jobType === 'move') workedDepartments.add('move');
  });
  allHours.forEach(hour => {
    if (hour.department === 'junk' || hour.department === 'move') {
      workedDepartments.add(hour.department);
    }
  });

  // Get employees already in other hours section (proper data isolation)
  const getAlreadyAddedEmployeesInOtherHours = () => {
    return allHours
      .filter((hour) => !['junk', 'move'].includes(hour.department))
      .map((hour) => hour.employeeId);
  };

  // Smart default: add captains who've worked in junk/move but not yet in other hours
  const getCaptainsSuggestedForOtherHours = () => {
    const captainsWhoWorked = allHours
      .filter(hour => ['junk', 'move'].includes(hour.department))
      .filter(hour => hour.isCoCaptain || hour.employeeId === captainId)
      .map(hour => hour.employeeId);
    
    // Remove duplicates and those already added
    return [...new Set(captainsWhoWorked)]
      .filter(id => !getAlreadyAddedEmployeesInOtherHours().includes(id));
  };

  const addTeamMember = (defaultEmployeeId?: string) => {
    // Get captain's ID from form if not provided
    const employeeId = defaultEmployeeId || captainId || '';

    // Check if employee already added to other hours
    const alreadyAddedInOtherHours = getAlreadyAddedEmployeesInOtherHours();
    if (alreadyAddedInOtherHours.includes(employeeId)) {
      return; // Don't add duplicate
    }

    append({
      employeeId,
      department: 'admin', // Default department
      hours: 0,
      isCoCaptain: false,
    });
    setIsAddingTeamMember(false);
  };

  const addCaptainDefaults = () => {
    const suggestedCaptains = getCaptainsSuggestedForOtherHours();
    suggestedCaptains.forEach(captainId => {
      addTeamMember(captainId);
    });
  };

  // Get employees already added to THIS section to filter them out (proper data isolation)
  const getAlreadyAddedEmployeesForThisSection = () => {
    return allHours
      .filter((hour) => !['junk', 'move'].includes(hour.department))
      .map((hour) => hour.employeeId);
  };

  // Calculate other hours section summary
  const otherHoursCalculation = calculateOtherHoursSection(
    allHours,
    employees
  );

  // Filter hour entries for other hours only (proper data isolation)
  const otherHoursEntries = allHours.filter(hour => !['junk', 'move'].includes(hour.department));

  return (
    <Card className={`h-full flex flex-col ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              {title}
            </CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <Badge variant="outline" className="text-xs">
            {otherHoursEntries.length} team members
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 space-y-4">
        {/* Smart Defaults Section */}
        {(workedDepartments.size > 0 || getCaptainsSuggestedForOtherHours().length > 0) && (
          <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800 p-3">
            <div className="space-y-2">
              <div className="text-sm">
                <p className="font-medium text-blue-900 dark:text-blue-100">Smart Suggestions</p>
                <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                  {getCaptainsSuggestedForOtherHours().length > 0 
                    ? `Automatically add ${getCaptainsSuggestedForOtherHours().length} captain(s) who worked in other sections`
                    : 'No captains found who worked in other sections'}
                </p>
              </div>
              {getCaptainsSuggestedForOtherHours().length > 0 && (
                <Button
                  type="button"
                  size="sm"
                  onClick={addCaptainDefaults}
                  className="text-xs bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add Captains
                </Button>
              )}
            </div>
          </Card>
        )}

        {/* Team Hours Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Team Hours
            </div>
            <div className="flex items-center gap-2">
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
          </div>

          {isAddingTeamMember && (
            <Card className="bg-muted/30 p-3">
              <div className="space-y-3">
                <FormField
                  control={control}
                  name={`hours.${fields.length}.employeeId`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Team Member</FormLabel>
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value);
                          // Create the hour entry
                          appendHour({
                            employeeId: value,
                            department: 'admin',
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
                                {employee.id === captainId && ' (Captain)'}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex items-center gap-2">
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
            {otherHoursEntries.map((hourEntry, index) => {
              const globalIndex = allHours.findIndex(h => h === hourEntry);
              const employeeId = hourEntry.employeeId;
              const employee = employees.find((emp) => emp.id === employeeId);
              const hours = hourEntry.hours;
              const department = hourEntry.department;
              const isCoCaptain = hourEntry.isCoCaptain;

              const deptInfo = otherHoursDepartments.find(d => d.value === department);

              return (
                <Card key={`other-hour-${globalIndex}-${fields[globalIndex]?.id || index}`} className="p-3">
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
                        <Badge 
                          variant="outline" 
                          className={`text-xs border-${
                            deptInfo?.color || 'gray'
                          }-300 text-${
                            deptInfo?.color || 'gray'
                          }-700 dark:border-${
                            deptInfo?.color || 'gray'
                          }-600 dark:text-${
                            deptInfo?.color || 'gray'
                          }-300`}
                        >
                          {deptInfo?.label || department}
                        </Badge>
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
                                    step="0.083333" // 5-minute increments
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
                          onClick={() => remove(globalIndex)}
                          className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    
                    {/* Department Selection */}
                    <div className="grid grid-cols-2 gap-2">
                      <FormField
                        control={control}
                        name={`hours.${globalIndex}.department`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">Department</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger className="text-sm h-7">
                                  <SelectValue placeholder="Department" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {otherHoursDepartments.map((dept) => (
                                  <SelectItem key={dept.value} value={dept.value}>
                                    {dept.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      {/* Co-Captain Checkbox */}
                      <FormField
                        control={control}
                        name={`hours.${globalIndex}.isCoCaptain`}
                        render={({ field }) => (
                          <FormItem className="flex flex-col justify-center">
                            <div className="flex items-center space-x-2">
                              <FormControl>
                                <Checkbox
                                  id={`co-captain-${globalIndex}`}
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  className="data-[state=checked]:border-hunks-orange data-[state=checked]:bg-hunks-orange data-[state=checked]:text-white h-4 w-4"
                                />
                              </FormControl>
                              <span
                                id={`co-captain-${globalIndex}`}
                                className="text-xs font-medium leading-none cursor-pointer"
                              >
                                Co-Captain
                              </span>
                            </div>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          {otherHoursEntries.length === 0 && !isAddingTeamMember && (
            <div className="text-center py-4 text-muted-foreground text-sm">
              <p>No team members added yet</p>
              <p className="text-xs mt-1">Add captains who worked in other sections or team members for other activities</p>
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
        </div>
      </CardContent>
    </Card>
  );
}
