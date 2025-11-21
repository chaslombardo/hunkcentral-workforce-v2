'use client';

import { useFormContext } from 'react-hook-form';
import { CheckCircle2, AlertCircle, DollarSign, Users, Clock, FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

interface WizardReviewStepProps {
  form: any;
  calculation: any;
  employees: any[];
}

export function WizardReviewStep({ form, calculation, employees }: WizardReviewStepProps) {
  const { watch } = useFormContext();
  const formData = watch();
  
  const jobs = formData.jobs || [];
  const hours = formData.hours || [];
  const sections = formData.sections;
  const captainId = formData.captainId;
  const logDate = formData.logDate;

  const captain = employees.find(emp => emp.id === captainId);
  
  // Separate hours by department
  const junkHours = hours.filter(h => h.department === 'junk');
  const moveHours = hours.filter(h => h.department === 'move');
  const otherHours = hours.filter(h => !['junk', 'move'].includes(h.department));

  // Department breakdown for other hours
  const departmentBreakdown = otherHours.reduce((acc: any, hour) => {
    if (!acc[hour.department]) {
      acc[hour.department] = { hours: 0, employees: [] };
    }
    acc[hour.department].hours += hour.hours;
    if (!acc[hour.department].employees.includes(hour.employeeId)) {
      acc[hour.department].employees.push(hour.employeeId);
    }
    return acc;
  }, {});

  const departmentLabels: Record<string, string> = {
    zigma: 'Zigma',
    training: 'Training',
    estimating: 'Estimating',
    warehouse: 'Warehouse',
    admin: 'Administrative',
  };

  const calculateJobTotal = (job: any) => {
    return job.revenue + job.tips + (job.junkOnMove || 0) + (job.valuation || 0) + (job.materials || 0);
  };

  return (
    <div className="space-y-6">
      {/* Validation Status */}
      <Card className={`${
        jobs.length > 0 || hours.length > 0 
          ? 'border-green-600 bg-green-50/50 dark:bg-green-950/20' 
          : 'border-orange-600 bg-orange-50/50 dark:bg-orange-950/20'
      }`}>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            {jobs.length > 0 || hours.length > 0 ? (
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            ) : (
              <AlertCircle className="h-5 w-5 text-orange-600" />
            )}
            <div>
              <div className="font-medium">
                {jobs.length > 0 || hours.length > 0 
                  ? 'Ready to Submit' 
                  : 'Add Data Before Submitting'
                }
              </div>
              <div className="text-sm text-muted-foreground">
                {jobs.length > 0 || hours.length > 0 
                  ? 'All required information is complete'
                  : 'Please add at least one job or hour entry'
                }
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Log Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Log Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-muted-foreground">Captain</div>
              <div className="font-medium">{captain ? captain.fullName : 'Not selected'}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Date</div>
              <div className="font-medium">{logDate ? new Date(logDate).toLocaleDateString() : 'Not selected'}</div>
            </div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground mb-2">Included Sections</div>
            <div className="flex gap-2">
              {sections.junk && <Badge variant="secondary">Junk Jobs</Badge>}
              {sections.move && <Badge variant="secondary">Move Jobs</Badge>}
              {sections.otherHours && <Badge variant="secondary">Other Hours</Badge>}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Jobs Summary */}
      {jobs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Jobs Revenue
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {jobs.map((job: any, index: number) => (
              <div key={index} className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="font-medium">{job.jobId}</span>
                  <span className="text-sm text-muted-foreground">{job.clientName}</span>
                  <Badge variant="outline" className={job.jobType === 'junk' ? 'border-green-600 text-green-600' : 'border-orange-600 text-orange-600'}>
                    {job.jobType === 'junk' ? 'Junk' : 'Move'}
                  </Badge>
                </div>
                <div className="font-medium">${calculateJobTotal(job).toFixed(2)}</div>
              </div>
            ))}
            <Separator />
            <div className="flex justify-between items-center">
              <span className="font-medium">Total Jobs Revenue</span>
              <span className="text-lg font-bold text-hunks-green">
                ${jobs.reduce((sum: number, job: any) => sum + calculateJobTotal(job), 0).toFixed(2)}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Team Hours Summary */}
      {hours.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4" />
              Team Hours
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Junk Hours */}
            {junkHours.length > 0 && (
              <div>
                <div className="text-sm font-medium text-green-700 mb-2">Junk Department</div>
                {junkHours.map((hour: any, index: number) => {
                  const employee = employees.find(emp => emp.id === hour.employeeId);
                  return (
                    <div key={index} className="flex items-center justify-between p-2 bg-green-50/50 rounded">
                      <div className="flex items-center gap-2">
                        <span>{employee?.fullName || 'Unknown'}</span>
                        {hour.isCoCaptain && <Badge variant="secondary" className="text-xs">Co-Captain</Badge>}
                      </div>
                      <span>{hour.hours}h</span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Move Hours */}
            {moveHours.length > 0 && (
              <div>
                <div className="text-sm font-medium text-orange-700 mb-2">Move Department</div>
                {moveHours.map((hour: any, index: number) => {
                  const employee = employees.find(emp => emp.id === hour.employeeId);
                  return (
                    <div key={index} className="flex items-center justify-between p-2 bg-orange-50/50 rounded">
                      <div className="flex items-center gap-2">
                        <span>{employee?.fullName || 'Unknown'}</span>
                        {hour.isCoCaptain && <Badge variant="secondary" className="text-xs">Co-Captain</Badge>}
                      </div>
                      <span>{hour.hours}h</span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Other Hours */}
            {Object.entries(departmentBreakdown).map(([dept, info]: [string, any]) => (
              <div key={dept}>
                <div className="text-sm font-medium mb-2">{departmentLabels[dept] || dept}</div>
                <div className="flex items-center justify-between p-2 bg-muted/20 rounded">
                  <div className="flex items-center gap-2">
                    <span>{info.employees.map((empId: string) => 
                      employees.find(emp => emp.id === empId)?.fullName || 'Unknown'
                    ).filter(Boolean).join(', ')}</span>
                  </div>
                  <span>{info.hours}h</span>
                </div>
              </div>
            ))}

            <Separator />
            <div className="flex justify-between items-center">
              <span className="font-medium">Total Team Hours</span>
              <span className="text-lg font-bold">
                {hours.reduce((sum: number, hour: any) => sum + hour.hours, 0).toFixed(1)}h
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Final Summary */}
      <Card className="bg-muted/30">
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-hunks-green">
                ${jobs.reduce((sum: number, job: any) => sum + calculateJobTotal(job), 0).toFixed(0)}
              </div>
              <div className="text-xs text-muted-foreground">Revenue</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-hunks-orange">
                {hours.reduce((sum: number, hour: any) => sum + hour.hours, 0).toFixed(1)}
              </div>
              <div className="text-xs text-muted-foreground">Hours</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {new Set(hours.map((h: any) => h.employeeId)).size}
              </div>
              <div className="text-xs text-muted-foreground">Team Members</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">
                ${hours.reduce((sum: number, hour: any) => sum + hour.hours, 0) > 0 
                  ? (jobs.reduce((sum: number, job: any) => sum + calculateJobTotal(job), 0) / 
                     hours.reduce((sum: number, hour: any) => sum + hour.hours, 0)).toFixed(0)
                  : '0'
                }
              </div>
              <div className="text-xs text-muted-foreground">$ / Hour</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
