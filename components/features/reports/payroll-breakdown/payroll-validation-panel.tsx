'use client';

import * as React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Info,
  Shield,
  TrendingUp,
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/formatters';
import type { PayrollValidationResult, ValidationError, AuditTrailEntry } from '@/lib/payrollValidation';

interface PayrollValidationPanelProps {
  validationResult: PayrollValidationResult;
  onReportDiscrepancy?: (errors: ValidationError[]) => void;
  onViewAuditTrail?: (entry: AuditTrailEntry) => void;
}

export function PayrollValidationPanel({
  validationResult,
  onReportDiscrepancy,
  onViewAuditTrail,
}: PayrollValidationPanelProps) {
  const [showErrors, setShowErrors] = React.useState(true);
  const [showWarnings, setShowWarnings] = React.useState(false);
  const [showInfo, setShowInfo] = React.useState(false);
  const [showAuditTrail, setShowAuditTrail] = React.useState(false);

  const getValidationIcon = () => {
    if (validationResult.errors.length > 0) {
      return <AlertCircle className="h-5 w-5 text-red-500" />;
    }
    if (validationResult.warnings.length > 0) {
      return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    }
    return <CheckCircle className="h-5 w-5 text-green-500" />;
  };

  const getValidationStatus = () => {
    if (validationResult.errors.length > 0) {
      return { text: 'Issues Found', color: 'text-red-600' };
    }
    if (validationResult.warnings.length > 0) {
      return { text: 'Warnings', color: 'text-yellow-600' };
    }
    return { text: 'Validated', color: 'text-green-600' };
  };

  const getErrorIcon = (type: ValidationError['type']) => {
    switch (type) {
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'info':
        return <Info className="h-4 w-4 text-blue-500" />;
      default:
        return <Info className="h-4 w-4 text-gray-500" />;
    }
  };

  const getErrorBadgeVariant = (type: ValidationError['type']) => {
    switch (type) {
      case 'error':
        return 'destructive';
      case 'warning':
        return 'secondary';
      case 'info':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const status = getValidationStatus();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {getValidationIcon()}
            <div>
              <CardTitle className="text-lg">Data Validation</CardTitle>
              <CardDescription>
                Payroll calculation accuracy and integrity check
              </CardDescription>
            </div>
          </div>
          <div className="text-right">
            <div className={`font-semibold ${status.color}`}>
              {status.text}
            </div>
            <div className="text-sm text-muted-foreground">
              {validationResult.calculationAccuracy.toFixed(1)}% accurate
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Accuracy Score */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Calculation Accuracy</span>
            <span className="font-mono">{validationResult.calculationAccuracy.toFixed(1)}%</span>
          </div>
          <Progress 
            value={validationResult.calculationAccuracy} 
            className="h-2"
          />
          <div className="text-xs text-muted-foreground">
            Based on {validationResult.errors.length + validationResult.warnings.length + validationResult.info.length} validation checks
          </div>
        </div>

        <Separator />

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">
              {validationResult.errors.length}
            </div>
            <div className="text-sm text-muted-foreground">Errors</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {validationResult.warnings.length}
            </div>
            <div className="text-sm text-muted-foreground">Warnings</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {validationResult.info.length}
            </div>
            <div className="text-sm text-muted-foreground">Info</div>
          </div>
        </div>

        {/* Errors Section */}
        {validationResult.errors.length > 0 && (
          <Collapsible open={showErrors} onOpenChange={setShowErrors}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-0 h-auto">
                <div className="flex items-center gap-2">
                  {showErrors ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  <span className="font-medium">Errors ({validationResult.errors.length})</span>
                </div>
                <Badge variant="destructive">{validationResult.errors.length}</Badge>
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-2 mt-3">
              {validationResult.errors.map((error, index) => (
                <Card key={index} className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-3">
                      {getErrorIcon(error.type)}
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant={getErrorBadgeVariant(error.type)} className="text-xs">
                            {error.code}
                          </Badge>
                          {error.logId && (
                            <Badge variant="outline" className="text-xs">
                              Log: {error.logId.slice(0, 8)}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm">{error.message}</p>
                        {(error.value !== undefined || error.expectedValue !== undefined) && (
                          <div className="text-xs text-muted-foreground space-y-1">
                            {error.value !== undefined && (
                              <div>Current: {String(error.value)}</div>
                            )}
                            {error.expectedValue !== undefined && (
                              <div>Expected: {String(error.expectedValue)}</div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {onReportDiscrepancy && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => onReportDiscrepancy(validationResult.errors)}
                  className="w-full mt-2"
                >
                  <AlertCircle className="mr-2 h-4 w-4" />
                  Report Discrepancy
                </Button>
              )}
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Warnings Section */}
        {validationResult.warnings.length > 0 && (
          <Collapsible open={showWarnings} onOpenChange={setShowWarnings}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-0 h-auto">
                <div className="flex items-center gap-2">
                  {showWarnings ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  <span className="font-medium">Warnings ({validationResult.warnings.length})</span>
                </div>
                <Badge variant="secondary">{validationResult.warnings.length}</Badge>
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-2 mt-3">
              {validationResult.warnings.map((warning, index) => (
                <Card key={index} className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950">
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-3">
                      {getErrorIcon(warning.type)}
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant={getErrorBadgeVariant(warning.type)} className="text-xs">
                            {warning.code}
                          </Badge>
                          {warning.logId && (
                            <Badge variant="outline" className="text-xs">
                              Log: {warning.logId.slice(0, 8)}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm">{warning.message}</p>
                        {(warning.value !== undefined || warning.expectedValue !== undefined) && (
                          <div className="text-xs text-muted-foreground space-y-1">
                            {warning.value !== undefined && (
                              <div>Current: {String(warning.value)}</div>
                            )}
                            {warning.expectedValue !== undefined && (
                              <div>Expected: {String(warning.expectedValue)}</div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Info Section */}
        {validationResult.info.length > 0 && (
          <Collapsible open={showInfo} onOpenChange={setShowInfo}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-0 h-auto">
                <div className="flex items-center gap-2">
                  {showInfo ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  <Info className="h-4 w-4 text-blue-500" />
                  <span className="font-medium">Information ({validationResult.info.length})</span>
                </div>
                <Badge variant="outline">{validationResult.info.length}</Badge>
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-2 mt-3">
              {validationResult.info.map((info, index) => (
                <Card key={index} className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-3">
                      {getErrorIcon(info.type)}
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant={getErrorBadgeVariant(info.type)} className="text-xs">
                            {info.code}
                          </Badge>
                          {info.logId && (
                            <Badge variant="outline" className="text-xs">
                              Log: {info.logId.slice(0, 8)}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm">{info.message}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Audit Trail Section */}
        <Collapsible open={showAuditTrail} onOpenChange={setShowAuditTrail}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between p-0 h-auto">
              <div className="flex items-center gap-2">
                {showAuditTrail ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                <Shield className="h-4 w-4 text-green-500" />
                <span className="font-medium">Audit Trail ({validationResult.auditTrail.length})</span>
              </div>
              <Badge variant="outline">{validationResult.auditTrail.length}</Badge>
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-2 mt-3">
            <div className="max-h-64 overflow-y-auto space-y-2">
              {validationResult.auditTrail.map((entry, index) => (
                <Card key={index} className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs capitalize">
                            {entry.department}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {entry.hours}h @ {formatCurrency(entry.rate)}/hr
                          </Badge>
                        </div>
                        <div className="text-sm">
                          Gross Pay: {formatCurrency(entry.grossPay)}
                          {entry.tips > 0 && ` • Tips: ${formatCurrency(entry.tips)}`}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Log: {entry.logId.slice(0, 8)} • {formatDate(entry.calculationDate)}
                        </div>
                      </div>
                      {onViewAuditTrail && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => onViewAuditTrail(entry)}
                        >
                          <TrendingUp className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Overall Status */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex items-center gap-2">
            {getValidationIcon()}
            <span className="font-medium">
              {validationResult.isValid ? 'Payroll data validated successfully' : 'Issues require attention'}
            </span>
          </div>
          <HoverCard>
            <HoverCardTrigger asChild>
              <Button variant="ghost" size="sm">
                <Info className="h-4 w-4" />
              </Button>
            </HoverCardTrigger>
            <HoverCardContent className="w-80">
              <div className="space-y-2">
                <h4 className="text-sm font-semibold">Validation Details</h4>
                <p className="text-sm text-muted-foreground">
                  This validation checks payroll calculations for accuracy, consistency, and data integrity. 
                  Errors indicate calculation problems that need immediate attention. Warnings suggest 
                  potential issues that should be reviewed.
                </p>
                <div className="text-xs text-muted-foreground">
                  Last validated: {formatDate(new Date())}
                </div>
              </div>
            </HoverCardContent>
          </HoverCard>
        </div>
      </CardContent>
    </Card>
  );
}