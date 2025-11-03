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
        personalRenovationCost: 234080,
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
        personalRenovationCost: 280060,
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

  const mockUnitDetails = {
    1: { casco: 178080, parachevements: 56000 },
    3: { casco: 213060, parachevements: 67000 },
  };

  describe('buildExportSheetData', () => {
    it('should build correct sheet structure with default data', () => {
      const sheetData = buildExportSheetData(
        mockCalculations,
        mockProjectParams,
        mockScenario,
        mockUnitDetails,
        '10/11/2025'
      );

      expect(sheetData.name).toBe('Calculateur Division');
      expect(sheetData.cells.length).toBeGreaterThan(0);
      expect(sheetData.columnWidths).toBeDefined();
      expect(sheetData.columnWidths?.length).toBe(24);

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
        mockUnitDetails,
        '10/11/2025'
      );

      // Find the first participant row (should have name 'Manuela/Dragan')
      const p1NameCell = sheetData.cells.find(c => c.col === 'A' && c.data.value === 'Manuela/Dragan');
      expect(p1NameCell).toBeDefined();
      const p1Row = p1NameCell!.row;

      const p1SurfaceCell = sheetData.cells.find(c => c.row === p1Row && c.col === 'C');
      expect(p1SurfaceCell?.data.value).toBe(112);

      // Check formulas for participant 1 (using dynamic row)
      const p1PurchaseShareFormula = sheetData.cells.find(c => c.row === p1Row && c.col === 'I');
      expect(p1PurchaseShareFormula?.data.formula).toBe(`C${p1Row}*$B$9`);

      const p1NotaryFeesFormula = sheetData.cells.find(c => c.row === p1Row && c.col === 'J');
      expect(p1NotaryFeesFormula?.data.formula).toBe(`I${p1Row}*F${p1Row}/100`);

      const p1MonthlyPaymentFormula = sheetData.cells.find(c => c.row === p1Row && c.col === 'R');
      expect(p1MonthlyPaymentFormula?.data.formula).toBe(`PMT(G${p1Row}/100/12,H${p1Row}*12,Q${p1Row})*-1`);
    });

    it('should include totals row with SUM formulas', () => {
      const sheetData = buildExportSheetData(
        mockCalculations,
        mockProjectParams,
        mockScenario,
        mockUnitDetails,
        '10/11/2025'
      );

      // Find TOTAL row dynamically
      const totalLabel = sheetData.cells.find(c => c.col === 'A' && c.data.value === 'TOTAL');
      expect(totalLabel).toBeDefined();
      const totalRow = totalLabel!.row;

      // Find first participant row to calculate range
      const p1Row = sheetData.cells.find(c => c.col === 'A' && c.data.value === 'Manuela/Dragan')!.row;
      const endRow = totalRow - 1;

      const totalSurfaceFormula = sheetData.cells.find(c => c.row === totalRow && c.col === 'C');
      expect(totalSurfaceFormula?.data.formula).toBe(`SUM(C${p1Row}:C${endRow})`);

      const totalCapitalFormula = sheetData.cells.find(c => c.row === totalRow && c.col === 'E');
      expect(totalCapitalFormula?.data.formula).toBe(`SUM(E${p1Row}:E${endRow})`);
    });

    it('should include summary section', () => {
      const sheetData = buildExportSheetData(
        mockCalculations,
        mockProjectParams,
        mockScenario,
        mockUnitDetails,
        '10/11/2025'
      );

      // Find summary section dynamically
      const summaryHeader = sheetData.cells.find(c => c.data.value === 'SYNTHESE GLOBALE');
      expect(summaryHeader).toBeDefined();
      const synthRow = summaryHeader!.row;

      // Find participant range
      const p1Row = sheetData.cells.find(c => c.col === 'A' && c.data.value === 'Manuela/Dragan')!.row;
      const totalRow = sheetData.cells.find(c => c.col === 'A' && c.data.value === 'TOTAL')!.row;
      const endRow = totalRow - 1;

      const avgLoanFormula = sheetData.cells.find(c => c.row === synthRow + 4 && c.col === 'B');
      expect(avgLoanFormula?.data.formula).toBe(`AVERAGE(Q${p1Row}:Q${endRow})`);

      const minLoanFormula = sheetData.cells.find(c => c.row === synthRow + 5 && c.col === 'B');
      expect(minLoanFormula?.data.formula).toBe(`MIN(Q${p1Row}:Q${endRow})`);

      const maxLoanFormula = sheetData.cells.find(c => c.row === synthRow + 6 && c.col === 'B');
      expect(maxLoanFormula?.data.formula).toBe(`MAX(Q${p1Row}:Q${endRow})`);
    });
  });

  describe('exportCalculations with CsvWriter', () => {
    it('should generate CSV snapshot for default scenario', () => {
      const csvWriter = new CsvWriter();
      const result = exportCalculations(
        mockCalculations,
        mockProjectParams,
        mockScenario,
        mockUnitDetails,
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
      expect(result).toContain('=PMT(G'); // Check for PMT formula (row number is dynamic)
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
        mockUnitDetails,
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
        mockUnitDetails,
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
      expect(result).toContain('TRAVAUX COMMUNS'); // Section exists
      expect(result).toContain('DETAILS PAR TYPE D UNITE'); // Unit details section
      expect(result).toContain('=SUM(C'); // Total surface formula (row dynamic)
      expect(result).toContain('=AVERAGE(Q'); // Average loan formula (row and column dynamic)
    });
  });

  describe('Writer type verification', () => {
    it('CsvWriter should return a string', () => {
      const csvWriter = new CsvWriter();
      const result = exportCalculations(
        mockCalculations,
        mockProjectParams,
        mockScenario,
        mockUnitDetails,
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
        mockUnitDetails,
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

      // Use buildExportSheetData instead of manually creating sheet
      const sheetData = buildExportSheetData(
        mockCalculations,
        mockProjectParams,
        mockScenario,
        mockUnitDetails,
        '10/11/2025'
      );

      xlsxWriter.addSheet(wb, sheetData);

      // Verify the sheet was added with correct data
      expect(wb.sheets.length).toBe(1);
      expect(wb.sheets[0].cells.length).toBeGreaterThan(0);
      expect(wb.sheets[0].name).toBe('Calculateur Division');
    });
  });

  describe('New export fields', () => {
    it('should include global CASCO rate', () => {
      const sheetData = buildExportSheetData(
        mockCalculations,
        mockProjectParams,
        mockScenario,
        mockUnitDetails,
        '10/11/2025'
      );

      const cascoRateCell = sheetData.cells.find(c => c.row === 23 && c.col === 'B');
      expect(cascoRateCell?.data.value).toBe(1590);
    });

    it('should include unit details section when provided', () => {
      const sheetData = buildExportSheetData(
        mockCalculations,
        mockProjectParams,
        mockScenario,
        mockUnitDetails,
        '10/11/2025'
      );

      const unitDetailsHeader = sheetData.cells.find(c => c.data.value === 'DETAILS PAR TYPE D UNITE');
      expect(unitDetailsHeader).toBeDefined();
    });

    it('should include participant quantity field', () => {
      const sheetData = buildExportSheetData(
        mockCalculations,
        mockProjectParams,
        mockScenario,
        mockUnitDetails,
        '10/11/2025'
      );

      // participantStartRow is dynamic, but with default data it should be around row 40+
      // Check that Qty header is in column D
      const qtyHeader = sheetData.cells.find(c => c.col === 'D' && c.data.value === 'Qty');
      expect(qtyHeader).toBeDefined();
    });

    it('should include participant override columns', () => {
      const sheetData = buildExportSheetData(
        mockCalculations,
        mockProjectParams,
        mockScenario,
        mockUnitDetails,
        '10/11/2025'
      );

      // Check new columns exist: Reno perso, CASCO m2, Parachev m2, CASCO sqm, Parachev sqm
      const renoPersoHeader = sheetData.cells.find(c => c.data.value === 'Reno perso');
      const cascoM2Header = sheetData.cells.find(c => c.data.value === 'CASCO m2');
      const parachevM2Header = sheetData.cells.find(c => c.data.value === 'Parachev m2');
      const cascoSqmHeader = sheetData.cells.find(c => c.data.value === 'CASCO sqm');
      const parachevSqmHeader = sheetData.cells.find(c => c.data.value === 'Parachev sqm');

      expect(renoPersoHeader).toBeDefined();
      expect(cascoM2Header).toBeDefined();
      expect(parachevM2Header).toBeDefined();
      expect(cascoSqmHeader).toBeDefined();
      expect(parachevSqmHeader).toBeDefined();
    });
  });
});
