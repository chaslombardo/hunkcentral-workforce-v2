'use client';

import { useFormContext } from 'react-hook-form';
import { Plus, Trash2, Users, Clock, Briefcase } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';

interface WizardHoursStepProps {
  form: any;
  employees: any[];
}

const departmentConfig = {
  zigma: { label: 'Zigma', color: 'bg-purple-100 text-purple-800' },
  training: { label: 'Training', color: 'bg-blue-100 text-blue-800' },
  estimating: { label: 'Estimating', color: 'bg-teal-100 text-teal-800' },
  warehouse: { label: 'Warehouse', color: 'bg-gray-100 text-gray-800' },
  admin: { label: 'Administrative', color: 'bg-red-100 text-red-800' },
};

export function WizardHoursStep({ form, employees }: WizardHoursStepProps) {
  const { control, setValue, getValues, watch } = useFormContext();
  const hours = watch('hours') || [];
  const captainId = watch('captainId');

  // Filter out junk and move hours
  const otherHours = hours.filter(hour => !['junk', 'move'].includes(hour.department));

  const addTeamMember = (employeeId?: string) => {
    const newHour = {
      employeeId: employeeId || captainId || '',
      department: 'admin',
      hours: 0,
      isCoCaptain: false,
    };
    
    setValue('hours', [...hours, newHour]);
  };

  const removeHour = (globalIndex: number) => {
    setValue('hours', hours.filter((_: any, i: number) => i !== globalIndex));
  };

  const updateHourField = (globalIndex: number, field: string, value: any) => {
    setValue(`hours.${globalIndex}.${field}`, value);
  };

  const addCaptainDefaults = () => {
    // Auto-add captain with default department
    if (captainId && !otherHours.some(hour => hour.employeeId === captainId)) {
      addTeamMember(captainId);
    }
  };

  return (
    <div className="space-y-6">
      {/* Instructions */}
      <Alert>
        <Briefcase className="h-4 w-4" />
        <AlertDescription>
          Add team members for other departments like training, estimating, warehouse, or administrative work. 
          Time should be entered in 5-minute increments (0.08 = 5 minutes, 0.25 = 15 minutes, etc.).
        </AlertDescription>
      </Alert>

      {/* Smart Suggestion */}
      {captainId && !otherHours.some(hour => hour.employeeId === captainId) && (
        <Alert className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
          <Users className="h-4 w-4" />
          <div className="flex items-center justify-between">
            <AlertDescription>
              <strong>Suggestion:</strong> Add the captain to Other Hours since they worked in other sections
            </AlertDescription>
            <Button
              type="button"
              size="sm"
              onClick={addCaptainDefaults}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="h-3 w-3 mr-1" />
              Add Captain
            </Button>
          </div>
        </Alert>
      )}

      {/* Add Team Member */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Team Members - Other Hours</h3>
        <Button
          type="button"
          onClick={() => addTeamMember()}
          className="bg-purple-600 hover:bg-purple-600/90 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Team Member
        </Button>
      </div>

      {/* Team Members List */}
      <div className="space-y-4">
        {hours
          .map((hour, globalIndex) => {
            if (['junk', 'move'].includes(hour.department)) return null;
            
            const employee = employees.find(emp => emp.id === hour.employeeId);
            const deptConfig = departmentConfig[hour.department as keyof typeof departmentConfig];
            
            return (
              <Card key={globalIndex} className="relative">
                <CardContent className="p-4">
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {employee ? employee.fullName : 'Unknown'}
                        </span>
                        {hour.employeeId === captainId && (
                          <Badge variant="secondary" className="text-xs">Captain</Badge>
                        )}
                        <Badge 
                          variant="outline"
                          className={deptConfig?.color || 'bg-gray-100 text-gray-800'}
                        >
                          {deptConfig?.label || hour.department}
                        </Badge>
                        {hour.isCoCaptain && (
                          <Badge variant="secondary" className="text-xs">Co-Captain</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <Input
                            type="number"
                            step="0.083333"
                            min="0"
                            max="24"
                            placeholder="0.0"
                            value={hour.hours}
                            onChange={(e) => updateHourField(globalIndex, 'hours', parseFloat(e.target.value) || 0)}
                            className="w-20 text-sm"
                          />
                          <span className="text-xs text-muted-foreground">h</span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeHour(globalIndex)}
                          className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    {/* Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {/* Employee Selection */}
                      <div>
                        <Label className="text-sm">Employee</Label>
                        <Select
                          value={hour.employeeId}
                          onValueChange={(value) => updateHourField(globalIndex, 'employeeId', value)}
                        >
                          <SelectTrigger className="text-sm">
                            <SelectValue placeholder="Select employee" />
                          </SelectTrigger>
                          <SelectContent>
                            {employees.map((employee) => (
                              <SelectItem key={employee.id} value={employee.id}>
                                {employee.fullName}
                                {employee.id === captainId && ' (Captain)'}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Department Selection */}
                      <div>
                        <Label className="text-sm">Department</Label>
                        <Select
                          value={hour.department}
                          onValueChange={(value) => updateHourField(globalIndex, 'department', value)}
                        >
                          <SelectTrigger className="text-sm">
                            <SelectValue placeholder="Department" />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(departmentConfig).map(([value, config]) => (
                              <SelectItem key={value} value={value}>
                                {config.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Co-Captain Checkbox */}
                      <div className="flex items-center space-x-2 pt-5">
                        <Checkbox
                          id={`co-captain-${globalIndex}`}
                          checked={hour.isCoCaptain}
                          onCheckedChange={(checked) => updateHourField(globalIndex, 'isCoCaptain', checked)}
                        />
                        <Label htmlFor={`co-captain-${globalIndex}`} className="text-sm">
                          Co-Captain
                        </Label>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
          .filter(Boolean)}
      </div>

      {otherHours.length === 0 && (
        <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
          <p className="text-sm mb-4">No team members added for other hours</p>
          <Button
            type="button"
            variant="outline"
            onClick={() => addTeamMember()}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add First Team Member
          </Button>
        </div>
      )}

      {/* Hours Summary */}
      {otherHours.length > 0 && (
        <Card className="bg-muted/20">
          <CardContent className="pt-6">
            <div className="space-y-3">
              <h4 className="font-medium">Hours Summary</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Object.entries(departmentConfig).map(([dept, config]) => {
                  const deptHours = otherHours
                    .filter(hour => hour.department === dept)
                    .reduce((sum, hour) => sum + hour.hours, 0);
                  
                  if (deptHours === 0) return null;
                  
                  return (
                    <div key={dept} className="text-center">
                      <Badge variant="outline" className={config.color}>
                        {config.label}
                      </Badge>
                      <div className="text-sm font-medium mt-1">
                        {deptHours.toFixed(1)}h
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="pt-2 border-t flex justify-between">
                <span className="font-medium">Total Other Hours:</span>
                <span className="font-bold">
                  {otherHours.reduce((sum, hour) => sum + hour.hours, 0).toFixed(1)}h
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
