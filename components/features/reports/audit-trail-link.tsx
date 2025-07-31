'use client';

import * as React from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import {
  ExternalLink,
  Eye,
  FileText,
  History,
  Shield,
  User,
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/formatters';
import type { AuditTrailEntry } from '@/lib/payrollValidation';

interface AuditTrailLinkProps {
  entry: AuditTrailEntry;
  showDetails?: boolean;
  variant?: 'button' | 'badge' | 'link';
  size?: 'sm' | 'md' | 'lg';
}

export function AuditTrailLink({
  entry,
  showDetails = false,
  variant = 'button',
  size = 'sm',
}: AuditTrailLinkProps) {
  const [showPopover, setShowPopover] = React.useState(false);

  const renderTrigger = () => {
    switch (variant) {
      case 'badge':
        return (
          <Badge variant="outline" className="cursor-pointer hover:bg-muted">
            <Shield className="mr-1 h-3 w-3" />
            Audit
          </Badge>
        );
      case 'link':
        return (
          <Button variant="link" size={size} className="h-auto p-0">
            <History className="mr-1 h-3 w-3" />
            View Source
          </Button>
        );
      default:
        return (
          <Button variant="ghost" size={size}>
            <Eye className="mr-1 h-3 w-3" />
            {size !== 'sm' && 'View Details'}
          </Button>
        );
    }
  };

  const auditContent = (
    <div className="space-y-4 w-80">
      <div className="space-y-2">
        <h4 className="text-sm font-semibold flex items-center gap-2">
          <Shield className="h-4 w-4" />
          Audit Trail Details
        </h4>
        <Separator />
      </div>

      {/* Basic Information */}
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="text-muted-foreground">Department:</span>
            <div className="font-medium capitalize">{entry.department}</div>
          </div>
          <div>
            <span className="text-muted-foreground">Hours:</span>
            <div className="font-mono">{entry.hours}h</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="text-muted-foreground">Rate:</span>
            <div className="font-mono">{formatCurrency(entry.rate)}/hr</div>
          </div>
          <div>
            <span className="text-muted-foreground">Gross Pay:</span>
            <div className="font-mono">{formatCurrency(entry.grossPay)}</div>
          </div>
        </div>

        {(entry.tips > 0 || entry.bonuses > 0 || entry.commission > 0) && (
          <div className="space-y-2">
            <Separator />
            <div className="text-sm">
              <span className="text-muted-foreground">Additional Compensation:</span>
              <div className="space-y-1 mt-1">
                {entry.tips > 0 && (
                  <div className="flex justify-between">
                    <span>Tips:</span>
                    <span className="font-mono">{formatCurrency(entry.tips)}</span>
                  </div>
                )}
                {entry.bonuses > 0 && (
                  <div className="flex justify-between">
                    <span>Bonuses:</span>
                    <span className="font-mono">{formatCurrency(entry.bonuses)}</span>
                  </div>
                )}
                {entry.commission > 0 && (
                  <div className="flex justify-between">
                    <span>Commission:</span>
                    <span className="font-mono">{formatCurrency(entry.commission)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <Separator />

      {/* Metadata */}
      <div className="space-y-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <FileText className="h-3 w-3" />
          <span>Log ID: {entry.logId}</span>
        </div>
        <div className="flex items-center gap-2">
          <History className="h-3 w-3" />
          <span>Calculated: {formatDate(entry.calculationDate)}</span>
        </div>
        {entry.lastModified && (
          <div className="flex items-center gap-2">
            <History className="h-3 w-3" />
            <span>Modified: {formatDate(entry.lastModified)}</span>
          </div>
        )}
        {entry.approvedBy && (
          <div className="flex items-center gap-2">
            <User className="h-3 w-3" />
            <span>Approved by: {entry.approvedBy}</span>
          </div>
        )}
      </div>

      <Separator />

      {/* Actions */}
      <div className="flex gap-2">
        <Button variant="outline" size="sm" asChild>
          <Link href={`/logs/${entry.logId}`}>
            <ExternalLink className="mr-1 h-3 w-3" />
            View Log
          </Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link href={`/admin/audit?entityId=${entry.logId}&entityType=daily_log`}>
            <History className="mr-1 h-3 w-3" />
            Full Audit
          </Link>
        </Button>
      </div>
    </div>
  );

  if (showDetails) {
    return (
      <Popover open={showPopover} onOpenChange={setShowPopover}>
        <PopoverTrigger asChild>
          {renderTrigger()}
        </PopoverTrigger>
        <PopoverContent className="w-auto p-4" align="start">
          {auditContent}
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        {renderTrigger()}
      </HoverCardTrigger>
      <HoverCardContent className="w-auto p-4" align="start">
        {auditContent}
      </HoverCardContent>
    </HoverCard>
  );
}

interface AuditTrailSummaryProps {
  entries: AuditTrailEntry[];
  employeeId: string;
  payPeriodId: string;
}

export function AuditTrailSummary({
  entries,
  employeeId,
  payPeriodId,
}: AuditTrailSummaryProps) {
  const totalHours = entries.reduce((sum, entry) => sum + entry.hours, 0);
  const totalGrossPay = entries.reduce((sum, entry) => sum + entry.grossPay, 0);
  const totalTips = entries.reduce((sum, entry) => sum + entry.tips, 0);
  const totalBonuses = entries.reduce((sum, entry) => sum + entry.bonuses, 0);
  const totalCommission = entries.reduce((sum, entry) => sum + entry.commission, 0);

  const uniqueLogs = [...new Set(entries.map(entry => entry.logId))];
  const departments = [...new Set(entries.map(entry => entry.department))];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Audit Trail Summary
        </h3>
        <Button variant="outline" size="sm" asChild>
          <Link href={`/admin/audit?entityType=daily_log&employeeId=${employeeId}`}>
            <History className="mr-1 h-4 w-4" />
            Full Audit History
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold">{uniqueLogs.length}</div>
          <div className="text-sm text-muted-foreground">Logs</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold">{departments.length}</div>
          <div className="text-sm text-muted-foreground">Departments</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold">{totalHours}</div>
          <div className="text-sm text-muted-foreground">Total Hours</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold">{formatCurrency(totalGrossPay + totalTips + totalBonuses + totalCommission)}</div>
          <div className="text-sm text-muted-foreground">Total Pay</div>
        </div>
      </div>

      <div className="space-y-2">
        <h4 className="font-medium">Recent Entries</h4>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {entries.slice(0, 5).map((entry, index) => (
            <div key={index} className="flex items-center justify-between p-2 border rounded">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs capitalize">
                  {entry.department}
                </Badge>
                <span className="text-sm">
                  {entry.hours}h @ {formatCurrency(entry.rate)}/hr
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-mono">
                  {formatCurrency(entry.grossPay)}
                </span>
                <AuditTrailLink entry={entry} variant="badge" />
              </div>
            </div>
          ))}
        </div>
        {entries.length > 5 && (
          <div className="text-center">
            <Button variant="ghost" size="sm">
              View {entries.length - 5} more entries
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}