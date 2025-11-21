'use client';

import { useState, useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import { Plus, Trash2, Users, Clock, Briefcase } from 'lucide-react';

import {
  FormControl,
  FormField,
  FormItem,
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
import { cn } from '@/lib/utils';

import type { User } from '@/types';

// Department colors and labels
const departmentConfig = {
  junk: { label: 'Junk', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100', borderColor: 'border-green-300 dark:border-green-700' },
  move: { label: 'Move', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100', borderColor: 'border-orange-300 dark:border-orange-700' },
  zigma: { label: 'Zigma', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100', borderColor: 'border-purple-300 dark:border-purple-700' },
  training: { label: 'Training', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100', borderColor: 'border-blue-300 dark:border-blue-700' },
  estimating: { label: 'Estimating', color: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-100', borderColor: 'border-teal-300 dark:border-teal-700' },
  warehouse: { label: 'Warehouse', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100', borderColor: 'border-gray-300 dark:border-gray-700' },
  admin: { label: 'Admin', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100', borderColor: 'border-red-300 dark:border-red-700' },
};

interface TeamTimeGridProps {
  employees: User[];
  captainId: string;
  jobs: any[];
  hours: any[];
}

export function TeamTimeGrid({ employees, captainId, jobs, hours }: TeamTimeGridProps) {
  const { control, setValue, getValues } = useFormContext();
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);

  // Grid departments we'll display
  const gridDepartments = ['junk', 'move', 'zigma', 'training', 'estimating', 'warehouse', 'admin'];

  // Get employees already in hours data
  const existingHoursMap = new Map<string, Map<string, any>>();
  hours.forEach((hourEntry, index) => {
    if (!existingHoursMap.has(hourEntry.employeeId)) {
      existingHoursMap.set(hourEntry.employeeId, new Map());
    }
    existingHoursMap.get(hourEntry.employeeId)!.set(hourEntry.department, { ...hourEntry, index });
  });

  // Auto-select captain
  useEffect(() => {
    if (captainId && !selectedEmployees.includes(captainId)) {
      setSelectedEmployees(prev => [...prev, captainId]);
    }
  }, [captainId]);

  const addEmployeeToGrid = (employeeId: string) => {
    if (!selectedEmployees.includes(employeeId)) {
      setSelectedEmployees(prev => [...prev, employeeId]);
    }
  };

  const removeEmployeeFromGrid = (employeeId: string) => {
    setSelectedEmployees(prev => prev.filter(id => id !== employeeId));
    
    // Remove all hour entries for this employee
    const currentHours = getValues('hours') || [];
    const filteredHours = currentHours.filter((hour: any) => hour.employeeId !== employeeId);
    setValue('hours', filteredHours);
  };

  const updateEmployeeHours = (employeeId: string, department: string, hours: number, isCoCaptain: boolean = false) => {
    const currentHours = getValues('hours') || [];
    const existingEntryIndex = currentHours.findIndex((hour: any) => 
      hour.employeeId === employeeId && hour.department === department
    );

    if (hours > 0) {
      // Update or add entry
      if (existingEntryIndex >= 0) {
        setValue(`hours.${existingEntryIndex}.hours`, hours);
        setValue(`hours.${existingEntryIndex}.isCoCaptain`, isCoCaptain);
      } else {
        // Add new entry
        setValue('hours', [
          ...currentHours,
          {
            employeeId,
            department,
            hours,
            isCoCaptain,
          }
        ]);
      }
    } else if (existingEntryIndex >= 0) {
      // Remove entry if hours is 0
      const filteredHours = currentHours.filter((hour: any, index: number) => index !== existingEntryIndex);
      setValue('hours', filteredHours);
    }
  };

  const getEmployeeHours = (employeeId: string, department: string) => {
    const existingEntry = existingHoursMap.get(employeeId)?.get(department);
    return existingEntry?.hours || 0;
  };

  const getEmployeeIsCoCaptain = (employeeId: string, department: string) => {
    const existingEntry = existingHoursMap.get(employeeId)?.get(department);
    return existingEntry?.isCoCaptain || false;
  };

  const getEmployeeTotalHours = (employeeId: string) => {
    return gridDepartments.reduce((total, dept) => total + getEmployeeHours(employeeId, dept), 0);
  };

  const getDepartmentTotalHours = (department: string) => {
    return selectedEmployees.reduce((total, empId) => total + getEmployeeHours(empId, department), 0);
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Time Allocation Grid</CardTitle>
          <Badge variant="outline" className="text-xs">
            {selectedEmployees.length} team members
          </Badge>
        </div>
        <CardDescription>
          Click cells to add hours, double-click to clear. 5-minute increments supported.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="flex justify-center">
          <p className="text-sm text-muted-foreground">Grid time tracking interface - basic implementation</p>
        </div>
      </CardContent>
    </Card>
  );
}
