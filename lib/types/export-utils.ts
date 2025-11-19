/**
 * Export utilities and types
 */

export interface ExportOptions {
  filename?: string;
  includeHeaders?: boolean;
  dateFormat?: string;
}

export interface ExportColumn {
  key: string;
  label: string;
  formatter?: (value: unknown) => string;
}

export class DataExporter {
  private data: Record<string, unknown>[] = [];
  private columns: ExportColumn[] = [];
  private options: ExportOptions;

  constructor(
    data: Record<string, unknown>[],
    columns: ExportColumn[],
    options: ExportOptions = {}
  ) {
    this.data = data;
    this.columns = columns;
    this.options = options;
  }

  // Generate CSV content
  generateCSV(): string {
    if (!this.data.length) return '';

    const headers =
      this.options.includeHeaders !== false
        ? [this.columns.map((col) => col.label).join(',')]
        : [];

    const rows = this.data.map((row) =>
      this.columns
        .map((col) => {
          const value = row[col.key];
          const formattedValue = col.formatter
            ? col.formatter(value)
            : String(value || '');
          // Escape commas and quotes in CSV
          return formattedValue.includes(',') || formattedValue.includes('"')
            ? `"${formattedValue.replace(/"/g, '""')}"`
            : formattedValue;
        })
        .join(',')
    );

    return [...headers, ...rows].join('\n');
  }

  // Generate HTML for PDF export
  generateHTML(): string {
    const headers = this.columns.map((col) => `<th>${col.label}</th>`).join('');
    const rows = this.data
      .map(
        (row) =>
          `<tr>${this.columns
            .map((col) => {
              const value = row[col.key];
              const formattedValue = col.formatter
                ? col.formatter(value)
                : String(value || '');
              return `<td>${formattedValue}</td>`;
            })
            .join('')}</tr>`
      )
      .join('');

    return `
      <html>
        <head>
          <title>Export Report</title>
          <style>
            table { border-collapse: collapse; width: 100%; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; font-weight: bold; }
          </style>
        </head>
        <body>
          <table>
            <thead><tr>${headers}</tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </body>
      </html>
    `;
  }

  // Download to Excel (using the CSV method as fallback)
  async exportToExcel(): Promise<void> {
    if (!this.data.length) return;

    try {
      const csvContent = this.generateCSV();
      const blob = new Blob([csvContent], { type: 'application/vnd.ms-excel' });
      this.downloadFile(blob, this.options.filename || 'export.xlsx');
    } catch (error) {
      console.error('Excel export failed:', error);
      throw error;
    }
  }

  // Download to CSV
  async exportToCSV(): Promise<void> {
    if (!this.data.length) return;

    try {
      const csvContent = this.generateCSV();
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      this.downloadFile(blob, this.options.filename || 'export.csv');
    } catch (error) {
      console.error('CSV export failed:', error);
      throw error;
    }
  }

  // Download to PDF (using HTML as fallback)
  async exportToPDF(): Promise<void> {
    if (!this.data.length) return;

    try {
      const htmlContent = this.generateHTML();
      const blob = new Blob([htmlContent], {
        type: 'text/html;charset=utf-8;',
      });
      this.downloadFile(blob, this.options.filename || 'export.html');
    } catch (error) {
      console.error('PDF export failed:', error);
      throw error;
    }
  }

  // Helper method to download file
  private downloadFile(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}
