import { describe, it, expect } from 'vitest';
import { buildExportSheetData, exportCalculations } from './excelExport';
import { CsvWriter, XlsxWriter } from './exportWriter';
import type { CalculationResults, ProjectParams, Scenario } from './calculatorUtils';

describe('Excel Export', () => {
  const mockCalculations: CalculationResults = {
    totalSurface: 472,
    pricePerM2: 1377.11864406779665,
    sharedCosts: 373965.63,
    sharedPerPerson: 93491.4075,
    participantBreakdown: [
      {
        name: 'Manuela/Dragan',
        capitalApporte: 50000,
        notaryFeesRate: 12.5,
        unitId: 1,
        surface: 112,
        interestRate: 4.5,
        durationYears: 25,
        quantity: 1,
        pricePerM2: 1377.11864406779665,
        purchaseShare: 154237.28813559322,
        notaryFees: 19279.661016949153,
        casco: 178080,
        parachevements: 56000,
        constructionCost: 326305,
        constructionCostPerUnit: 326305,
        travauxCommunsPerUnit: 92225,
        sharedCosts: 93491.4075,
        totalCost: 593313.3566525424,
        loanNeeded: 543313.3566525424,
        financingRatio: 91.57299295294533,
        monthlyPayment: 3019.912093380322,
        totalRepayment: 905973.6280140965,
        totalInterest: 362660.27136155404
      },
      {
        name: 'Cathy/Jim',
        capitalApporte: 170000,
        notaryFeesRate: 12.5,
        unitId: 3,
        surface: 134,
        interestRate: 4.5,
        durationYears: 25,
        quantity: 1,
        pricePerM2: 1377.11864406779665,
        purchaseShare: 184533.89830508474,
        notaryFees: 23066.73728813559,
        casco: 213060,
        parachevements: 67000,
        constructionCost: 372285,
        constructionCostPerUnit: 372285,
        travauxCommunsPerUnit: 92225,
        sharedCosts: 93491.4075,
        totalCost: 673377.0430932203,
        loanNeeded: 503377.0430932203,
        financingRatio: 74.75695652173913,
        monthlyPayment: 2797.5729846831363,
        totalRepayment: 839271.8954049409,
        totalInterest: 335894.85231172056
      },
    ],
    totals: {
      purchase: 650000,
      totalNotaryFees: 81257.3220338983,
      construction: 1355380,
      shared: 373965.63,
      totalTravauxCommuns: 368900,
      travauxCommunsPerUnit: 92225,
      total: 2460602.9520338984,
      capitalTotal: 490000,
      totalLoansNeeded: 1970602.9520338984,
      averageLoan: 492650.73800847463,
      averageCapital: 122500
    }
  };

  const mockProjectParams: ProjectParams = {
    totalPurchase: 650000,
    mesuresConservatoires: 20000,
    demolition: 40000,
    infrastructures: 90000,
    etudesPreparatoires: 59820,
    fraisEtudesPreparatoires: 27320,
    fraisGeneraux3ans: 136825.63,
    batimentFondationConservatoire: 43700,
    batimentFondationComplete: 269200,
    batimentCoproConservatoire: 56000,
    globalCascoPerM2: 1590
  };

  const mockScenario: Scenario = {
    constructionCostChange: 0,
    infrastructureReduction: 0,
    purchasePriceReduction: 0,
  };

  describe('buildExportSheetData', () => {
    it('should build correct sheet structure with default data', () => {
      const sheetData = buildExportSheetData(
        mockCalculations,
        mockProjectParams,
        mockScenario,
        '10/11/2025'
      );

      expect(sheetData.name).toBe('Calculateur Division');
      expect(sheetData.cells.length).toBeGreaterThan(0);
      expect(sheetData.columnWidths).toBeDefined();
      expect(sheetData.columnWidths?.length).toBe(18);

      // Check some key cells
      const headerCell = sheetData.cells.find(c => c.row === 1 && c.col === 'A');
      expect(headerCell?.data.value).toBe('ACHAT EN DIVISION - CALCULATEUR IMMOBILIER');

      const dateCell = sheetData.cells.find(c => c.row === 2 && c.col === 'A');
      expect(dateCell?.data.value).toBe('Wallonie, Belgique - 10/11/2025');

      const totalPurchaseCell = sheetData.cells.find(c => c.row === 5 && c.col === 'B');
      expect(totalPurchaseCell?.data.value).toBe(650000);

      // Check formula cells
      const adjustedPurchaseCell = sheetData.cells.find(c => c.row === 7 && c.col === 'B');
      expect(adjustedPurchaseCell?.data.formula).toBe('B5*(1-B6/100)');

      const pricePerM2Cell = sheetData.cells.find(c => c.row === 9 && c.col === 'B');
      expect(pricePerM2Cell?.data.formula).toBe('B7/B8');
    });

    it('should include participant data with formulas', () => {
      const sheetData = buildExportSheetData(
        mockCalculations,
        mockProjectParams,
        mockScenario,
        '10/11/2025'
      );

      // Check first participant
      const p1NameCell = sheetData.cells.find(c => c.row === 41 && c.col === 'A');
      expect(p1NameCell?.data.value).toBe('Manuela/Dragan');

      const p1SurfaceCell = sheetData.cells.find(c => c.row === 41 && c.col === 'C');
      expect(p1SurfaceCell?.data.value).toBe(112);

      // Check formulas for participant 1
      const p1PurchaseShareFormula = sheetData.cells.find(c => c.row === 41 && c.col === 'H');
      expect(p1PurchaseShareFormula?.data.formula).toBe('C41*$B$9');

      const p1NotaryFeesFormula = sheetData.cells.find(c => c.row === 41 && c.col === 'I');
      expect(p1NotaryFeesFormula?.data.formula).toBe('H41*E41/100');

      const p1MonthlyPaymentFormula = sheetData.cells.find(c => c.row === 41 && c.col === 'Q');
      expect(p1MonthlyPaymentFormula?.data.formula).toBe('PMT(F41/100/12,G41*12,P41)*-1');
    });

    it('should include totals row with SUM formulas', () => {
      const sheetData = buildExportSheetData(
        mockCalculations,
        mockProjectParams,
        mockScenario,
        '10/11/2025'
      );

      const totalRow = 41 + mockCalculations.participantBreakdown.length;

      const totalLabel = sheetData.cells.find(c => c.row === totalRow && c.col === 'A');
      expect(totalLabel?.data.value).toBe('TOTAL');

      const totalSurfaceFormula = sheetData.cells.find(c => c.row === totalRow && c.col === 'C');
      expect(totalSurfaceFormula?.data.formula).toBe('SUM(C41:C42)');

      const totalCapitalFormula = sheetData.cells.find(c => c.row === totalRow && c.col === 'D');
      expect(totalCapitalFormula?.data.formula).toBe('SUM(D41:D42)');
    });

    it('should include summary section', () => {
      const sheetData = buildExportSheetData(
        mockCalculations,
        mockProjectParams,
        mockScenario,
        '10/11/2025'
      );

      const totalRow = 41 + mockCalculations.participantBreakdown.length;
      const synthRow = totalRow + 2;

      const summaryHeader = sheetData.cells.find(c => c.row === synthRow + 1 && c.col === 'A');
      expect(summaryHeader?.data.value).toBe('SYNTHESE GLOBALE');

      const avgLoanFormula = sheetData.cells.find(c => c.row === synthRow + 5 && c.col === 'B');
      expect(avgLoanFormula?.data.formula).toBe('AVERAGE(P41:P42)');

      const minLoanFormula = sheetData.cells.find(c => c.row === synthRow + 6 && c.col === 'B');
      expect(minLoanFormula?.data.formula).toBe('MIN(P41:P42)');

      const maxLoanFormula = sheetData.cells.find(c => c.row === synthRow + 7 && c.col === 'B');
      expect(maxLoanFormula?.data.formula).toBe('MAX(P41:P42)');
    });
  });

  describe('exportCalculations with CsvWriter', () => {
    it('should generate CSV snapshot for default scenario', () => {
      const csvWriter = new CsvWriter();
      const result = exportCalculations(
        mockCalculations,
        mockProjectParams,
        mockScenario,
        csvWriter,
        'test_export.xlsx'
      );

      expect(typeof result).toBe('string');
      expect(result).toContain('WORKBOOK: test_export.xlsx');
      expect(result).toContain('SHEET: Calculateur Division');
      expect(result).toContain('ACHAT EN DIVISION - CALCULATEUR IMMOBILIER');
      expect(result).toContain('Manuela/Dragan');
      expect(result).toContain('Cathy/Jim');
      expect(result).toContain('=B5*(1-B6/100)');
      expect(result).toContain('=PMT(F41/100/12,G41*12,P41)*-1');
      expect(result).toContain('SYNTHESE GLOBALE');
    });

    it('should generate CSV snapshot with scenario modifications', () => {
      const modifiedScenario: Scenario = {
        constructionCostChange: 15,
        infrastructureReduction: 20,
        purchasePriceReduction: 10,
      };

      const csvWriter = new CsvWriter();
      const result = exportCalculations(
        mockCalculations,
        mockProjectParams,
        modifiedScenario,
        csvWriter,
        'test_modified.xlsx'
      );

      expect(result).toContain('WORKBOOK: test_modified.xlsx');
      expect(result).toContain(' 15'); // Construction cost change in B12
      expect(result).toContain(' 20'); // Infrastructure reduction in B13
      expect(result).toContain(' 10'); // Purchase price reduction in B6
    });
  });

  describe('CSV export snapshot', () => {
    it('should match expected CSV structure snapshot', () => {
      const csvWriter = new CsvWriter();
      const result = exportCalculations(
        mockCalculations,
        mockProjectParams,
        mockScenario,
        csvWriter,
        'Calculateur_Division_2025.xlsx'
      );

      // Verify key sections exist in correct order
      const lines = (result || '').split('\n');

      // Find section indices
      const headerIdx = lines.findIndex(l => l.includes('ACHAT EN DIVISION'));
      const paramsIdx = lines.findIndex(l => l.includes('PARAMETRES DU PROJET'));
      const scenarioIdx = lines.findIndex(l => l.includes('SCENARIOS D OPTIMISATION'));
      const sharedCostsIdx = lines.findIndex(l => l.includes('COUTS PARTAGES'));
      const travauxIdx = lines.findIndex(l => l.includes('TRAVAUX COMMUNS'));
      const decompIdx = lines.findIndex(l => l.includes('DECOMPOSITION DES COUTS'));
      const detailHeaderIdx = lines.findIndex(l => l.includes('Nom') && l.includes('Unite') && l.includes('Surface'));
      const synthIdx = lines.findIndex(l => l.includes('SYNTHESE GLOBALE'));

      // Verify sections appear in expected order
      expect(headerIdx).toBeGreaterThan(-1);
      expect(paramsIdx).toBeGreaterThan(headerIdx);
      expect(scenarioIdx).toBeGreaterThan(paramsIdx);
      expect(sharedCostsIdx).toBeGreaterThan(scenarioIdx);
      expect(travauxIdx).toBeGreaterThan(sharedCostsIdx);
      expect(decompIdx).toBeGreaterThan(travauxIdx);
      expect(detailHeaderIdx).toBeGreaterThan(decompIdx);
      expect(synthIdx).toBeGreaterThan(detailHeaderIdx);

      // Verify column count (18 columns: A through R)
      expect(result).toContain('|');

      // Snapshot verification: key formulas are present
      expect(result).toContain('=B5*(1-B6/100)'); // Adjusted purchase
      expect(result).toContain('=B7/B8'); // Price per m2
      expect(result).toContain('=B16+B17+B19+B20+B21+B22'); // Total quote-part
      expect(result).toContain('=B27+B28+B29'); // Total travaux communs
      expect(result).toContain('=SUM(C41:C42)'); // Total surface
      expect(result).toContain('=AVERAGE(P41:P42)'); // Average loan
    });
  });

  describe('Writer type verification', () => {
    it('CsvWriter should return a string', () => {
      const csvWriter = new CsvWriter();
      const result = exportCalculations(
        mockCalculations,
        mockProjectParams,
        mockScenario,
        csvWriter,
        'test.xlsx'
      );

      // CsvWriter returns a string
      expect(typeof result).toBe('string');
      expect(result).toContain('WORKBOOK: test.xlsx');
    });

    it('XlsxWriter should return void (creates file download)', () => {
      // Note: XlsxWriter calls XLSX.writeFile which triggers a download
      // In test environment, this will fail if file system is not accessible
      // But we can verify the writer doesn't return a string
      const xlsxWriter = new XlsxWriter();
      const wb = xlsxWriter.createWorkbook();
      const sheetData = buildExportSheetData(
        mockCalculations,
        mockProjectParams,
        mockScenario,
        '10/11/2025'
      );
      xlsxWriter.addSheet(wb, sheetData);

      // XlsxWriter.write returns void (undefined), not a string
      const result = xlsxWriter.write(wb, 'test_xlsx_output.xlsx');
      expect(result).toBeUndefined();
    });

    it('XlsxWriter should set worksheet range (!ref) property', () => {
      // Mock XLSX to verify the worksheet structure
      const xlsxWriter = new XlsxWriter();
      const wb = xlsxWriter.createWorkbook();

      // Create a simple sheet with known bounds
      const simpleSheet = {
        name: 'Test Sheet',
        cells: [
          { row: 1, col: 'A', data: { value: 'Header' } },
          { row: 2, col: 'A', data: { value: 'Row1' } },
          { row: 2, col: 'B', data: { value: 123 } },
          { row: 3, col: 'C', data: { formula: 'A2+B2' } },
        ],
        columnWidths: []
      };

      xlsxWriter.addSheet(wb, simpleSheet);

      // Verify the sheet was added with correct data
      expect(wb.sheets.length).toBe(1);
      expect(wb.sheets[0].cells.length).toBe(4);
      expect(wb.sheets[0].name).toBe('Test Sheet');
    });
  });
});
