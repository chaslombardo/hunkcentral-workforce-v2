'use client';

import * as React from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { 
  Clock, 
  DollarSign, 
  Users, 
  TrendingUp, 
  Calendar as CalendarIcon,
  MapPin,
  Award
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/formatters';
import type { Department } from '@/types';
import { cn } from '@/lib/utils';
import type { DailyWorkEntry, WorkPatternStats } from '@/lib/actions/daily-work';

// Types are now imported from the action file

interface DailyWorkCalendarProps {
  workEntries: DailyWorkEntry[];
  workPatternStats: WorkPatternStats;
  selectedDate?: Date;
  onDateSelect: (date: Date | undefined) => void;
  payPeriodStart: Date;
  payPeriodEnd: Date;
}

export function DailyWorkCalendar({
  workEntries,
  workPatternStats,
  selectedDate,
  onDateSelect,
  payPeriodStart,
  payPeriodEnd,
}: DailyWorkCalendarProps) {
  // Create lookup map for work entries by date
  const workEntryMap = React.useMemo(() => {
    const map = new Map<string, DailyWorkEntry>();
    workEntries.forEach(entry => {
      const dateKey = entry.date.toDateString();
      map.set(dateKey, entry);
    });
    return map;
  }, [workEntries]);

  // Get work entry for selected date
  const selectedEntry = selectedDate ? workEntryMap.get(selectedDate.toDateString()) : null;

  // Calculate modifiers for calendar styling
  const workDays = workEntries.map(entry => entry.date);
  const highTipDays = workEntries.filter(entry => entry.tips > workPatternStats.avgTipsPerDay * 1.5).map(entry => entry.date);
  const highHourDays = workEntries.filter(entry => entry.totalHours > workPatternStats.avgHoursPerDay * 1.2).map(entry => entry.date);

  return (
    <div className="space-y-6">
      {/* Work Pattern Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Work Pattern Analysis
          </CardTitle>
          <CardDescription>
            Your work patterns and performance metrics for this pay period
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <div className="text-2xl font-bold">{workPatternStats.totalDaysWorked}</div>
              <div className="text-sm text-muted-foreground">Days Worked</div>
            </div>
            <div className="space-y-2">
              <div className="text-2xl font-bold">{workPatternStats.avgHoursPerDay.toFixed(1)}h</div>
              <div className="text-sm text-muted-foreground">Avg Hours/Day</div>
            </div>
            <div className="space-y-2">
              <div className="text-2xl font-bold capitalize">{workPatternStats.mostCommonDepartment}</div>
              <div className="text-sm text-muted-foreground">Primary Dept</div>
            </div>
            <div className="space-y-2">
              <div className="text-2xl font-bold">{formatCurrency(workPatternStats.avgTipsPerDay)}</div>
              <div className="text-sm text-muted-foreground">Avg Tips/Day</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Calendar */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Daily Work Calendar
            </CardTitle>
            <CardDescription>
              Click on any date to view detailed work breakdown
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={onDateSelect}
              defaultMonth={payPeriodStart}
              disabled={{
                before: payPeriodStart,
                after: payPeriodEnd,
              }}
              modifiers={{
                workDay: workDays,
                highTips: highTipDays,
                highHours: highHourDays,
              }}
              modifiersStyles={{
                workDay: { 
                  backgroundColor: 'var(--primary)', 
                  color: 'var(--primary-foreground)',
                  fontWeight: '600'
                },
                highTips: { 
                  backgroundColor: '#ea7200', 
                  color: 'white',
                  fontWeight: '600'
                },
                highHours: { 
                  backgroundColor: '#026937', 
                  color: 'white',
                  fontWeight: '600'
                },
              }}
              className={cn(
                "w-full",
                // Mobile optimizations
                "[--cell-size:44px] md:[--cell-size:40px]", // Larger touch targets on mobile
                "touch-manipulation", // Optimize for touch
                "[&_button]:min-h-[44px] [&_button]:min-w-[44px]", // Ensure minimum touch target size
                "[&_button]:touch-manipulation" // Optimize button touches
              )}
            />
            
            {/* Legend */}
            <div className="mt-4 space-y-2">
              <div className="text-sm font-medium">Legend:</div>
              <div className="flex flex-wrap gap-2 text-xs">
                <div className="flex items-center gap-1">
                  <div className="h-3 w-3 rounded-sm bg-primary"></div>
                  <span>Work Day</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="h-3 w-3 rounded-sm bg-[#ea7200]"></div>
                  <span>High Tips</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="h-3 w-3 rounded-sm bg-[#026937]"></div>
                  <span>Long Hours</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Daily Detail View */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              {selectedDate ? formatDate(selectedDate) : 'Select a Date'}
            </CardTitle>
            <CardDescription>
              {selectedEntry ? 'Detailed work breakdown for this day' : 'Choose a date from the calendar to view details'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedEntry ? (
              <DailyWorkDetail entry={selectedEntry} />
            ) : (
              <div className="flex h-48 items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <CalendarIcon className="mx-auto h-12 w-12 opacity-50" />
                  <p className="mt-2">Select a date to view work details</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

interface DailyWorkDetailProps {
  entry: DailyWorkEntry;
}

function DailyWorkDetail({ entry }: DailyWorkDetailProps) {
  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <div className="text-2xl font-bold">{entry.totalHours}h</div>
          <div className="text-sm text-muted-foreground">Total Hours</div>
        </div>
        <div className="space-y-1">
          <div className="text-2xl font-bold">{formatCurrency(entry.grossPay)}</div>
          <div className="text-sm text-muted-foreground">Gross Pay</div>
        </div>
        <div className="space-y-1">
          <div className="text-2xl font-bold">{formatCurrency(entry.tips)}</div>
          <div className="text-sm text-muted-foreground">Tips Earned</div>
        </div>
        <div className="space-y-1">
          <div className="text-2xl font-bold">{entry.jobsCompleted}</div>
          <div className="text-sm text-muted-foreground">Jobs Done</div>
        </div>
      </div>

      <Separator />

      {/* Department Breakdown */}
      <div className="space-y-3">
        <h4 className="font-medium">Department Breakdown</h4>
        {entry.departments.map((dept, index) => (
          <div key={index} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge 
                  variant={dept.role === 'captain' ? 'default' : 'secondary'}
                  className={cn(
                    dept.role === 'captain' && 'bg-[#026937] hover:bg-[#026937]/80',
                    dept.role === 'co-captain' && 'bg-[#ea7200] hover:bg-[#ea7200]/80'
                  )}
                >
                  {dept.role === 'captain' && <Award className="h-3 w-3 mr-1" />}
                  {dept.role === 'co-captain' && <Users className="h-3 w-3 mr-1" />}
                  <span className="capitalize">{dept.department}</span>
                </Badge>
                <span className="text-sm text-muted-foreground capitalize">
                  {dept.role}
                </span>
              </div>
              <div className="text-right">
                <div className="font-mono font-medium">
                  {formatCurrency(dept.hours * dept.rate)}
                </div>
                <div className="text-sm text-muted-foreground">
                  {dept.hours}h @ {formatCurrency(dept.rate)}/hr
                </div>
              </div>
            </div>
            <Progress 
              value={(dept.hours / entry.totalHours) * 100} 
              className="h-2"
            />
          </div>
        ))}
      </div>

      <Separator />

      {/* Quick Actions */}
      <div className="flex gap-2">
        <Button variant="outline" size="sm" asChild>
          <a href={`/logs/${entry.logId}`}>
            <MapPin className="h-4 w-4 mr-2" />
            View Log
          </a>
        </Button>
        {entry.tips > 0 && (
          <Button variant="outline" size="sm">
            <DollarSign className="h-4 w-4 mr-2" />
            Tip Details
          </Button>
        )}
      </div>
    </div>
  );
}