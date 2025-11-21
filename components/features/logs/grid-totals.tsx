'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calculator, DollarSign, Users, Clock } from 'lucide-react';

interface GridTotalsProps {
  calculation: any;
  jobs: any[];
  hours: any[];
  employees: any[];
  disposalCost: number;
}

export function GridTotals({ calculation, jobs, hours, employees, disposalCost }: GridTotalsProps) {
  // Department breakdown
  const departmentHours = {
    junk: { label: 'Junk', hours: 0, color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100' },
    move: { label: 'Move', hours: 0, color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100' },
    zigma: { label: 'Zigma', hours: 0, color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100' },
    training: { label: 'Training', hours: 0, color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100' },
    estimating: { label: 'Estimating', hours: 0, color: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-100' },
    warehouse: { label: 'Warehouse', hours: 0, color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100' },
    admin: { label: 'Admin', hours: 0, color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100' },
  };

  // Calculate hours by department
  hours.forEach(hour => {
    if (departmentHours[hour.department as keyof typeof departmentHours]) {
      departmentHours[hour.department as keyof typeof departmentHours].hours += hour.hours;
    }
  });

  const totalHours = Object.values(departmentHours).reduce((sum, dept) => sum + dept.hours, 0);
  const totalRevenue = jobs.reduce((sum, job) => {
    return sum + job.revenue + job.tips + (job.junkOnMove || 0) + (job.valuation || 0) + (job.materials || 0);
  }, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Grid Summary
        </CardTitle>
        <CardDescription>
          Time and revenue overview for this log
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Main Totals */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 text-hunks-green mb-1">
              <DollarSign className="h-4 w-4" />
              <span className="text-2xl font-bold">
                ${totalRevenue.toFixed(0)}
              </span>
            </div>
            <div className="text-xs text-muted-foreground">Total Revenue</div>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 text-hunks-orange mb-1">
              <Clock className="h-4 w-4" />
              <span className="text-2xl font-bold">
                {totalHours.toFixed(1)}
              </span>
            </div>
            <div className="text-xs text-muted-foreground">Total Hours</div>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 text-blue-600 mb-1">
              <Users className="h-4 w-4" />
              <span className="text-2xl font-bold">
                {employees.filter(emp => 
                  hours.some(hour => hour.employeeId === emp.id)
                ).length}
              </span>
            </div>
            <div className="text-xs text-muted-foreground">Team Members</div>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 text-purple-600 mb-1">
              <span className="text-2xl font-bold">
                ${totalHours > 0 ? (totalRevenue / totalHours).toFixed(0) : 0}
              </span>
            </div>
            <div className="text-xs text-muted-foreground">Revenue/Hour</div>
          </div>
        </div>

        <Separator />

        {/* Department Breakdown */}
        <div className="space-y-3">
          <div className="text-sm font-medium">Hours by Department</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.entries(departmentHours)
              .filter(([_, dept]) => dept.hours > 0)
              .map(([key, dept]) => (
                <div key={key} className="text-center">
                  <Badge className={dept.color} variant="secondary">
                    {dept.label}
                  </Badge>
                  <div className="text-sm font-medium mt-1">
                    {dept.hours.toFixed(1)}h
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {totalHours > 0 ? `${((dept.hours / totalHours) * 100).toFixed(0)}%` : '0%'}
                  </div>
                </div>
              ))}
          </div>
        </div>

        {jobs.length > 0 && (
          <>
            <Separator />
            <div className="space-y-3">
              <div className="text-sm font-medium">Job Summary</div>
              <div className="flex justify-between items-center">
                <div className="space-y-1">
                  <div className="text-sm">
                    <span className="font-medium">Jobs:</span> {jobs.length}
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">Avg Revenue:</span> ${jobs.length > 0 ? (totalRevenue / jobs.length).toFixed(0) : 0}
                  </div>
                </div>
                {disposalCost > 0 && (
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground">Disposal Cost</div>
                    <div className="font-medium">${disposalCost.toFixed(2)}</div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
