/**
 * Export writer interface and implementations
 * Allows dependency injection for testing (CSV) vs production (XLSX)
 */

import * as XLSX from 'xlsx';

export interface CellValue {
  value?: string | number | null;
  formula?: string;
}

export interface SheetCell {
  row: number;
  col: string; // Excel column like 'A', 'B', 'C', etc.
  data: CellValue;
}

export interface ColumnWidth {
  col: number; // 0-based column index
  width: number;
}

export interface SheetData {
  name: string;
  cells: SheetCell[];
  columnWidths?: ColumnWidth[];
}

export interface Workbook {
  sheets: SheetData[];
}

export interface ExportWriter {
  /**
   * Create a new workbook
   */
  createWorkbook(): Workbook;

  /**
   * Add a sheet to the workbook
   */
  addSheet(wb: Workbook, sheetData: SheetData): void;

  /**
   * Write the workbook to a file or return as string
   */
  write(wb: Workbook, filename: string): void | string;
}

/**
 * XLSX writer for production use
 */
export class XlsxWriter implements ExportWriter {
  createWorkbook(): Workbook {
    return { sheets: [] };
  }

  addSheet(wb: Workbook, sheetData: SheetData): void {
    wb.sheets.push(sheetData);
  }

  write(wb: Workbook, filename: string): void {
    const xlsxWb = XLSX.utils.book_new();

    wb.sheets.forEach(sheet => {
      const ws: XLSX.WorkSheet = {};

      // Add cells
      sheet.cells.forEach(cell => {
        const cellRef = `${cell.col}${cell.row}`;
        if (cell.data.formula) {
          ws[cellRef] = { t: 'n', f: cell.data.formula };
        } else if (cell.data.value !== null && cell.data.value !== undefined) {
          const value = cell.data.value;
          if (typeof value === 'number') {
            ws[cellRef] = { t: 'n', v: value };
          } else {
            ws[cellRef] = { t: 's', v: value };
          }
        }
      });

      // Set column widths
      if (sheet.columnWidths && sheet.columnWidths.length > 0) {
        ws['!cols'] = sheet.columnWidths.map(cw => ({ wch: cw.width }));
      }

      XLSX.utils.book_append_sheet(xlsxWb, ws, sheet.name);
    });

    XLSX.writeFile(xlsxWb, filename);
  }
}

/**
 * CSV writer for testing use
 * Returns a human-readable string representation
 */
export class CsvWriter implements ExportWriter {
  createWorkbook(): Workbook {
    return { sheets: [] };
  }

  addSheet(wb: Workbook, sheetData: SheetData): void {
    wb.sheets.push(sheetData);
  }

  write(wb: Workbook, filename: string): string {
    let output = `WORKBOOK: ${filename}\n\n`;

    wb.sheets.forEach(sheet => {
      output += `SHEET: ${sheet.name}\n`;
      output += '='.repeat(80) + '\n\n';

      // Group cells by row
      const cellsByRow = new Map<number, Map<string, CellValue>>();
      let maxRow = 0;
      const columnSet = new Set<string>();

      sheet.cells.forEach(cell => {
        if (!cellsByRow.has(cell.row)) {
          cellsByRow.set(cell.row, new Map());
        }
        cellsByRow.get(cell.row)!.set(cell.col, cell.data);
        maxRow = Math.max(maxRow, cell.row);
        columnSet.add(cell.col);
      });

      // Sort columns alphabetically
      const columns = Array.from(columnSet).sort();

      // Header row
      output += '    |' + columns.map(col => ` ${col.padEnd(15)}`).join('|') + '|\n';
      output += '----+' + columns.map(() => '-'.repeat(17)).join('+') + '+\n';

      // Data rows
      for (let row = 1; row <= maxRow; row++) {
        const rowData = cellsByRow.get(row);
        if (rowData) {
          const rowStr = columns.map(col => {
            const cell = rowData.get(col);
            if (!cell) return ' '.repeat(16);

            if (cell.formula) {
              return ` =${cell.formula}`.padEnd(16);
            } else if (cell.value !== null && cell.value !== undefined) {
              return ` ${String(cell.value)}`.padEnd(16);
            }
            return ' '.repeat(16);
          }).join('|');

          output += `${String(row).padStart(3)} |${rowStr}|\n`;
        }
      }

      output += '\n';

      // Column widths if specified
      if (sheet.columnWidths && sheet.columnWidths.length > 0) {
        output += 'COLUMN WIDTHS:\n';
        sheet.columnWidths.forEach(cw => {
          output += `  Column ${cw.col}: ${cw.width}\n`;
        });
        output += '\n';
      }

      output += '\n';
    });

    return output;
  }
}
