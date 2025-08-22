'use client';

import { useState } from 'react';
import { BrandButton } from '@/components/brand/brand-button';
import {
  exportCommissionData,
  emailCommissionReport,
} from '@/lib/actions/commission-export';
import { DataExporter } from '@/lib/export-utils';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Download, Mail, FileText, Loader2, Settings } from 'lucide-react';
import { format } from 'date-fns';

interface CommissionExportButtonsProps {
  entries: any[];
  canViewAllData: boolean;
  currentUserId: string;
}

export function CommissionExportButtons({
  entries,
  canViewAllData,
  currentUserId,
}: CommissionExportButtonsProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [emailForm, setEmailForm] = useState({
    recipients: '',
    subject: `Commission Report - ${format(new Date(), 'MMM yyyy')}`,
    message: 'Please find the attached commission report.',
    includeCalculations: true,
    includeProjections: false,
  });

  const handleExport = async (exportFormat: 'excel' | 'csv' | 'pdf') => {
    setIsExporting(true);

    try {
      const result = await exportCommissionData({
        format: exportFormat,
        includeCalculations: true,
        includeProjections: false,
      });

      if (result.success && result.data) {
        // Use the DataExporter utility to generate and download the file
        const filename = `commission-report-${format(new Date(), 'yyyy-MM-dd')}`;

        const exporter = new DataExporter(result.data, result.columns!, {
          format: exportFormat,
          filename:
            exportFormat === 'excel'
              ? `${filename}.xlsx`
              : exportFormat === 'csv'
                ? `${filename}.csv`
                : `${filename}.pdf`,
          includeHeaders: true,
        });

        if (exportFormat === 'excel') {
          await exporter.exportToExcel();
        } else if (exportFormat === 'csv') {
          await exporter.exportToCSV();
        } else if (exportFormat === 'pdf') {
          await exporter.exportToPDF();
        }

        toast.success(
          `Commission report exported successfully as ${exportFormat.toUpperCase()}`
        );
      } else {
        toast.error(result.error || 'Export failed');
      }
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export commission report');
    } finally {
      setIsExporting(false);
    }
  };

  const handleEmailReport = async () => {
    if (!emailForm.recipients.trim()) {
      toast.error('Please enter at least one recipient email address');
      return;
    }

    setIsExporting(true);

    try {
      const recipients = emailForm.recipients
        .split(',')
        .map((email) => email.trim())
        .filter((email) => email.length > 0);

      const result = await emailCommissionReport({
        format: 'pdf',
        recipients,
        subject: emailForm.subject,
        message: emailForm.message,
        includeCalculations: emailForm.includeCalculations,
        includeProjections: emailForm.includeProjections,
      });

      if (result.success) {
        toast.success(
          `Commission report emailed to ${recipients.length} recipient(s)`
        );
        setIsEmailDialogOpen(false);
        setEmailForm({
          ...emailForm,
          recipients: '',
        });
      } else {
        toast.error('error' in result ? result.error : 'Failed to send email');
      }
    } catch (error) {
      console.error('Email error:', error);
      toast.error('Failed to send commission report');
    } finally {
      setIsExporting(false);
    }
  };

  const handleQuickExport = async (format: 'excel' | 'csv') => {
    await handleExport(format);
  };

  return (
    <div className="space-y-4">
      {/* Quick Export Buttons */}
      <div className="flex flex-wrap gap-3">
        <BrandButton
          variant="outline"
          size="sm"
          className="transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-hunks-green/20"
          onClick={() => handleQuickExport('excel')}
          disabled={isExporting}
        >
          {isExporting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-2 h-4 w-4" />
          )}
          Export to Excel
        </BrandButton>

        <BrandButton
          variant="outline"
          size="sm"
          className="transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-hunks-green/20"
          onClick={() => handleQuickExport('csv')}
          disabled={isExporting}
        >
          {isExporting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-2 h-4 w-4" />
          )}
          Export to CSV
        </BrandButton>

        <BrandButton
          variant="outline"
          size="sm"
          className="transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-hunks-orange/20"
          onClick={() => handleExport('pdf')}
          disabled={isExporting}
        >
          {isExporting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <FileText className="mr-2 h-4 w-4" />
          )}
          Generate PDF Report
        </BrandButton>

        {canViewAllData && (
          <Dialog open={isEmailDialogOpen} onOpenChange={setIsEmailDialogOpen}>
            <DialogTrigger asChild>
              <BrandButton
                variant="outline"
                size="sm"
                className="transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/20"
                disabled={isExporting}
              >
                <Mail className="mr-2 h-4 w-4" />
                Email Report
              </BrandButton>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-hunks-green">
                  Email Commission Report
                </DialogTitle>
                <DialogDescription>
                  Send a detailed commission report to specified recipients
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="recipients">
                    Recipients (comma-separated)
                  </Label>
                  <Input
                    id="recipients"
                    placeholder="email1@example.com, email2@example.com"
                    value={emailForm.recipients}
                    onChange={(e) =>
                      setEmailForm({ ...emailForm, recipients: e.target.value })
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    value={emailForm.subject}
                    onChange={(e) =>
                      setEmailForm({ ...emailForm, subject: e.target.value })
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    rows={3}
                    value={emailForm.message}
                    onChange={(e) =>
                      setEmailForm({ ...emailForm, message: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="includeCalculations"
                      checked={emailForm.includeCalculations}
                      onCheckedChange={(checked) =>
                        setEmailForm({
                          ...emailForm,
                          includeCalculations: checked as boolean,
                        })
                      }
                    />
                    <Label htmlFor="includeCalculations" className="text-sm">
                      Include detailed calculations and variance analysis
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="includeProjections"
                      checked={emailForm.includeProjections}
                      onCheckedChange={(checked) =>
                        setEmailForm({
                          ...emailForm,
                          includeProjections: checked as boolean,
                        })
                      }
                    />
                    <Label htmlFor="includeProjections" className="text-sm">
                      Include earnings projections and forecasts
                    </Label>
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <BrandButton
                    variant="outline"
                    onClick={() => setIsEmailDialogOpen(false)}
                    disabled={isExporting}
                  >
                    Cancel
                  </BrandButton>
                  <BrandButton
                    onClick={handleEmailReport}
                    disabled={isExporting || !emailForm.recipients.trim()}
                  >
                    {isExporting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Mail className="mr-2 h-4 w-4" />
                        Send Report
                      </>
                    )}
                  </BrandButton>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Export Statistics */}
      <div className="text-xs text-muted-foreground bg-hunks-green/5 p-3 rounded-lg border border-hunks-green/20">
        <div className="flex items-center gap-2 mb-2">
          <Settings className="h-3 w-3 text-hunks-green" />
          <span className="font-medium text-hunks-green">Export Details</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <span className="font-medium">Records:</span> {entries.length}{' '}
            commission entries
          </div>
          <div>
            <span className="font-medium">Date Range:</span> All time
          </div>
          <div>
            <span className="font-medium">Includes:</span> Calculations,
            accuracy metrics, variance analysis
          </div>
          <div>
            <span className="font-medium">Formats:</span> Excel (.xlsx), CSV
            (.csv), PDF (.pdf)
          </div>
        </div>
      </div>
    </div>
  );
}
