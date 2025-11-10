/**
 * CSV Export Utilities
 *
 * Pure functions for exporting data to CSV format.
 * Handles CSV generation and browser download with proper escaping.
 *
 * All functions are pure (except exportToCSV which has browser side effects).
 */

// ============================================
// Types
// ============================================

/**
 * Options for CSV export
 */
export interface CSVExportOptions {
  delimiter?: string;
  escapeQuotes?: boolean;
  includeHeaders?: boolean;
}

// ============================================
// Core Functions
// ============================================

/**
 * Escape a CSV cell value
 *
 * Wraps the cell in quotes and escapes any internal quotes by doubling them.
 * This follows RFC 4180 CSV specification.
 *
 * @param cell - The cell value to escape
 * @returns Escaped cell value wrapped in quotes
 *
 * @example
 * const escaped = escapeCsvCell('Hello, "World"');
 * // Returns '"Hello, ""World"""'
 */
export function escapeCsvCell(cell: string): string {
  // Escape internal quotes by doubling them
  const escaped = cell.replace(/"/g, '""');
  // Wrap in quotes
  return `"${escaped}"`;
}

/**
 * Convert a row of cells to CSV format
 *
 * @param row - Array of cell values
 * @param delimiter - Column delimiter (default: ',')
 * @returns CSV-formatted row string
 *
 * @example
 * const csvRow = formatCsvRow(['Name', 'Age', 'City']);
 * // Returns '"Name","Age","City"'
 */
export function formatCsvRow(
  row: string[],
  delimiter: string = ','
): string {
  return row.map(escapeCsvCell).join(delimiter);
}

/**
 * Convert data to CSV string
 *
 * @param headers - Column headers
 * @param rows - Data rows (array of arrays)
 * @param options - Export options
 * @returns Complete CSV string
 *
 * @example
 * const csv = generateCsv(
 *   ['Name', 'Amount'],
 *   [['Alice', '1000'], ['Bob', '2000']]
 * );
 * // Returns:
 * // "Name","Amount"
 * // "Alice","1000"
 * // "Bob","2000"
 */
export function generateCsv(
  headers: string[],
  rows: string[][],
  options?: CSVExportOptions
): string {
  const delimiter = options?.delimiter || ',';
  const includeHeaders = options?.includeHeaders !== false; // default true

  const lines: string[] = [];

  if (includeHeaders) {
    lines.push(formatCsvRow(headers, delimiter));
  }

  for (const row of rows) {
    lines.push(formatCsvRow(row, delimiter));
  }

  return lines.join('\n');
}

/**
 * Download CSV string as file in browser
 *
 * Creates a blob from the CSV string and triggers a download.
 * NOTE: This function has side effects (browser download).
 *
 * @param csvContent - The CSV content string
 * @param filename - Desired filename (should end with .csv)
 *
 * @example
 * downloadCsv(csvContent, 'report.csv');
 */
export function downloadCsv(
  csvContent: string,
  filename: string
): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * Export data to CSV file (convenience function)
 *
 * Combines generateCsv and downloadCsv into a single function.
 * NOTE: This function has side effects (browser download).
 *
 * @param headers - Column headers
 * @param rows - Data rows (array of arrays)
 * @param filename - Desired filename (should end with .csv)
 * @param options - Export options
 *
 * @example
 * exportToCSV(
 *   ['Date', 'Type', 'Amount'],
 *   [
 *     ['2024-01-01', 'Sale', '50000'],
 *     ['2024-02-01', 'Purchase', '30000']
 *   ],
 *   'transactions.csv'
 * );
 */
export function exportToCSV(
  headers: string[],
  rows: string[][],
  filename: string,
  options?: CSVExportOptions
): void {
  const csv = generateCsv(headers, rows, options);
  downloadCsv(csv, filename);
}
