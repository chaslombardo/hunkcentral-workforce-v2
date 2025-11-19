import { ExportOptions } from '@/components/features/data';

// Export utilities for different formats
interface DataRecord {
  [key: string]: unknown;
}

interface ColumnDefinition {
  key?: string;
  accessorKey?: string;
  id?: string;
  title?: string;
  header?: string | ((...args: unknown[]) => unknown);
  format?: (value: unknown) => string;
  formatter?: (value: unknown) => string;
}

export class DataExporter {
  private data: DataRecord[];
  private columns: ColumnDefinition[];
  private options: ExportOptions;

  constructor(
    data: DataRecord[],
    columns: ColumnDefinition[],
    options: ExportOptions
  ) {
    this.data = data;
    this.columns = columns;
    this.options = options;
  }

  // Export to CSV
  async exportToCSV(): Promise<void> {
    const csvContent = this.generateCSV();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    this.downloadFile(blob, this.options.filename || 'export.csv');
  }

  // Export to Excel (using CSV for now, could be enhanced with a library like xlsx)
  async exportToExcel(): Promise<void> {
    const csvContent = this.generateCSV();
    const blob = new Blob([csvContent], { type: 'application/vnd.ms-excel' });
    this.downloadFile(blob, this.options.filename || 'export.xlsx');
  }

  // Export to PDF
  async exportToPDF(): Promise<void> {
    const htmlContent = this.generateHTML();

    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      throw new Error('Unable to open print window');
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Export - ${this.options.filename}</title>
          <style>
            ${this.getPrintStyles()}
          </style>
        </head>
        <body>
          ${htmlContent}
        </body>
      </html>
    `);

    printWindow.document.close();

    // Wait for content to load then trigger print
    printWindow.onload = () => {
      printWindow.print();
      printWindow.close();
    };
  }

  // Print functionality
  async print(): Promise<void> {
    const htmlContent = this.generateHTML();

    // Create a hidden iframe for printing
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    document.body.appendChild(iframe);

    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) {
      throw new Error('Unable to access iframe document');
    }

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print - ${this.options.filename}</title>
          <style>
            ${this.getPrintStyles()}
          </style>
        </head>
        <body>
          ${htmlContent}
          <script>
            window.onload = function() {
              window.print();
              parent.document.body.removeChild(parent.document.querySelector('iframe[style*="display: none"]'));
            }
          </script>
        </body>
      </html>
    `);
    doc.close();
  }

  private generateCSV(): string {
    const exportData = this.getExportData();

    if (exportData.length === 0) return '';

    const headers = this.getColumnHeaders();
    const rows = [
      ...(this.options.includeHeaders ? [headers.join(',')] : []),
      ...exportData.map((row) =>
        headers
          .map((header) => {
            const value = row[header];
            // Handle CSV escaping
            if (
              typeof value === 'string' &&
              (value.includes(',') ||
                value.includes('"') ||
                value.includes('\n'))
            ) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return value ?? '';
          })
          .join(',')
      ),
    ];

    return rows.join('\n');
  }

  private generateHTML(): string {
    const exportData = this.getExportData();
    const headers = this.getColumnHeaders();
    const columnLabels = this.getColumnLabels();

    return `
      <div class="export-container">
        <div class="export-header">
          <div class="company-info">
            <h1>College Hunks Hauling Junk & Moving</h1>
            <p>Data Export Report</p>
          </div>
          <div class="export-meta">
            <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
            <p><strong>Records:</strong> ${exportData.length}</p>
          </div>
        </div>
        
        <table class="export-table">
          ${
            this.options.includeHeaders
              ? `
            <thead>
              <tr>
                ${columnLabels.map((label) => `<th>${label}</th>`).join('')}
              </tr>
            </thead>
          `
              : ''
          }
          <tbody>
            ${exportData
              .map(
                (row) => `
              <tr>
                ${headers.map((header) => `<td>${this.formatCellValue(row[header])}</td>`).join('')}
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>
        
        <div class="export-footer">
          <p>© ${new Date().getFullYear()} College Hunks Hauling Junk & Moving</p>
        </div>
      </div>
    `;
  }

  private getPrintStyles(): string {
    return `
      @page {
        margin: 1in;
        size: letter;
      }
      
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 12px;
        line-height: 1.4;
        color: #333;
        margin: 0;
        padding: 0;
      }
      
      .export-container {
        max-width: 100%;
        margin: 0 auto;
      }
      
      .export-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 30px;
        padding-bottom: 20px;
        border-bottom: 2px solid #026937;
      }
      
      .company-info h1 {
        color: #026937;
        font-size: 24px;
        font-weight: bold;
        margin: 0 0 5px 0;
      }
      
      .company-info p {
        color: #ea7200;
        font-size: 16px;
        font-weight: 600;
        margin: 0;
      }
      
      .export-meta {
        text-align: right;
        font-size: 11px;
        color: #666;
      }
      
      .export-meta p {
        margin: 2px 0;
      }
      
      .export-table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 30px;
        font-size: 11px;
      }
      
      .export-table th {
        background-color: #026937;
        color: white;
        font-weight: 600;
        padding: 8px 6px;
        text-align: left;
        border: 1px solid #024d29;
      }
      
      .export-table td {
        padding: 6px;
        border: 1px solid #ddd;
        vertical-align: top;
      }
      
      .export-table tbody tr:nth-child(even) {
        background-color: #f8f9fa;
      }
      
      .export-table tbody tr:hover {
        background-color: #e8f5e8;
      }
      
      .export-footer {
        text-align: center;
        font-size: 10px;
        color: #666;
        margin-top: 20px;
        padding-top: 20px;
        border-top: 1px solid #ddd;
      }
      
      /* Print-specific styles */
      @media print {
        .export-table {
          page-break-inside: auto;
        }
        
        .export-table tr {
          page-break-inside: avoid;
          page-break-after: auto;
        }
        
        .export-table thead {
          display: table-header-group;
        }
        
        .export-table tfoot {
          display: table-footer-group;
        }
      }
    `;
  }

  private getExportData(): DataRecord[] {
    return this.options.selectedOnly && this.options.columns
      ? this.data.filter((_, index) =>
          this.options.columns?.includes(index.toString())
        )
      : this.data;
  }

  private getColumnHeaders(): string[] {
    return this.columns
      .filter((col) => col.accessorKey || col.id || col.key)
      .map((col) => col.accessorKey || col.id || col.key!)
      .filter(Boolean);
  }

  private getColumnLabels(): string[] {
    return this.columns
      .filter((col) => col.accessorKey || col.id || col.key)
      .map((col) => {
        if (typeof col.title === 'string') return col.title;
        if (typeof col.header === 'string') return col.header;
        const fallback = col.accessorKey || col.id || col.key;
        return fallback ?? '';
      });
  }

  private formatCellValue(value: unknown): string {
    if (value === null || value === undefined) return '';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (value instanceof Date) return value.toLocaleDateString();
    if (typeof value === 'number') return value.toLocaleString();
    return String(value);
  }

  private downloadFile(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }
}

// Email report functionality
export interface EmailReportOptions {
  recipients: string[];
  subject: string;
  message: string;
  format: 'pdf' | 'excel' | 'csv';
  data: DataRecord[];
  columns: ColumnDefinition[];
}

export class EmailReporter {
  async sendReport(options: EmailReportOptions): Promise<void> {
    // This would integrate with your email service (SendGrid, AWS SES, etc.)
    // For now, we'll simulate the process

    console.warn('Sending email report:', {
      recipients: options.recipients,
      subject: options.subject,
      recordCount: options.data.length,
      format: options.format,
    });

    // Generate the export data
    const exporter = new DataExporter(options.data, options.columns, {
      format: options.format,
      filename: `report.${options.format}`,
      includeHeaders: true,
    });
    void exporter;

    // In a real implementation, you would:
    // 1. Generate the file using the exporter
    // 2. Upload it to a temporary storage (S3, etc.)
    // 3. Send email with attachment link
    // 4. Clean up temporary files

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // For demo purposes, we'll just log the action
    console.warn('Email sent successfully to:', options.recipients.join(', '));
  }
}

// Bulk operations utilities
export interface BulkOperationResult {
  success: boolean;
  processedCount: number;
  errorCount: number;
  errors: Array<{ index: number; error: string }>;
}

export class BulkOperationProcessor {
  async processBulkOperation<T>(
    items: T[],
    operation: (item: T, index: number) => Promise<void>,
    options: {
      batchSize?: number;
      onProgress?: (processed: number, total: number) => void;
    } = {}
  ): Promise<BulkOperationResult> {
    const { batchSize = 10, onProgress } = options;
    const result: BulkOperationResult = {
      success: true,
      processedCount: 0,
      errorCount: 0,
      errors: [],
    };

    // Process items in batches
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);

      await Promise.allSettled(
        batch.map(async (item, batchIndex) => {
          const globalIndex = i + batchIndex;
          try {
            await operation(item, globalIndex);
            result.processedCount++;
          } catch (error) {
            result.errorCount++;
            result.errors.push({
              index: globalIndex,
              error: error instanceof Error ? error.message : String(error),
            });
          }
        })
      );

      // Report progress
      if (onProgress) {
        onProgress(Math.min(i + batchSize, items.length), items.length);
      }
    }

    result.success = result.errorCount === 0;
    return result;
  }
}

// Branded print templates
export function generateBrandedPrintTemplate(
  title: string,
  data: DataRecord[],
  columns: ColumnDefinition[],
  options: {
    includeHeaders?: boolean;
    includeFooter?: boolean;
    customStyles?: string;
  } = {}
): string {
  const {
    includeHeaders = true,
    includeFooter = true,
    customStyles = '',
  } = options;

  const headers = columns
    .map((col) => col.accessorKey ?? col.id)
    .filter((key): key is string => typeof key === 'string');

  const columnLabels = columns
    .map((col) => {
      if (typeof col.header === 'string') return col.header;
      return col.accessorKey ?? col.id;
    })
    .filter((label): label is string => typeof label === 'string');

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title}</title>
        <style>
          @page {
            margin: 0.75in;
            size: letter;
          }
          
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 11px;
            line-height: 1.4;
            color: #333;
            margin: 0;
            padding: 0;
          }
          
          .print-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 25px;
            padding-bottom: 15px;
            border-bottom: 3px solid #026937;
          }
          
          .logo-section h1 {
            color: #026937;
            font-size: 20px;
            font-weight: bold;
            margin: 0 0 3px 0;
          }
          
          .logo-section p {
            color: #ea7200;
            font-size: 14px;
            font-weight: 600;
            margin: 0;
          }
          
          .report-info {
            text-align: right;
            font-size: 10px;
            color: #666;
          }
          
          .report-info p {
            margin: 1px 0;
          }
          
          .data-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 25px;
            font-size: 10px;
          }
          
          .data-table th {
            background: linear-gradient(135deg, #026937 0%, #024d29 100%);
            color: white;
            font-weight: 600;
            padding: 8px 5px;
            text-align: left;
            border: 1px solid #024d29;
            font-size: 9px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          
          .data-table td {
            padding: 5px;
            border: 1px solid #ddd;
            vertical-align: top;
          }
          
          .data-table tbody tr:nth-child(even) {
            background-color: #f8f9fa;
          }
          
          .print-footer {
            position: fixed;
            bottom: 0.5in;
            left: 0.75in;
            right: 0.75in;
            text-align: center;
            font-size: 9px;
            color: #666;
            border-top: 1px solid #ddd;
            padding-top: 10px;
          }
          
          ${customStyles}
          
          @media print {
            .data-table {
              page-break-inside: auto;
            }
            
            .data-table tr {
              page-break-inside: avoid;
              page-break-after: auto;
            }
            
            .data-table thead {
              display: table-header-group;
            }
          }
        </style>
      </head>
      <body>
        <div class="print-header">
          <div class="logo-section">
            <h1>College Hunks Hauling Junk & Moving</h1>
            <p>${title}</p>
          </div>
          <div class="report-info">
            <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
            <p><strong>Records:</strong> ${data.length.toLocaleString()}</p>
            <p><strong>Page:</strong> <span class="page-number"></span></p>
          </div>
        </div>
        
        <table class="data-table">
          ${
            includeHeaders
              ? `
            <thead>
              <tr>
                ${columnLabels.map((label) => `<th>${label}</th>`).join('')}
              </tr>
            </thead>
          `
              : ''
          }
          <tbody>
            ${data
              .map(
                (row) => `
              <tr>
                ${headers
                  .map((header) => {
                    const value = row[header];
                    let formattedValue = '';

                    if (value === null || value === undefined) {
                      formattedValue = '';
                    } else if (typeof value === 'boolean') {
                      formattedValue = value ? 'Yes' : 'No';
                    } else if (value instanceof Date) {
                      formattedValue = value.toLocaleDateString();
                    } else if (typeof value === 'number') {
                      formattedValue = value.toLocaleString();
                    } else {
                      formattedValue = String(value);
                    }

                    return `<td>${formattedValue}</td>`;
                  })
                  .join('')}
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>
        
        ${
          includeFooter
            ? `
          <div class="print-footer">
            <p>© ${new Date().getFullYear()} College Hunks Hauling Junk & Moving - Confidential Report</p>
          </div>
        `
            : ''
        }
        
        <script>
          // Add page numbers
          window.onload = function() {
            const pageNumbers = document.querySelectorAll('.page-number');
            pageNumbers.forEach(el => {
              el.textContent = '1'; // In a real implementation, this would be dynamic
            });
          }
        </script>
      </body>
    </html>
  `;
}
