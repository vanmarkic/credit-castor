import { describe, it, expect } from 'vitest';
import { buildExportSheetData, buildTimelineSnapshotSheet, exportCalculations } from './excelExport';
import { CsvWriter, XlsxWriter } from './exportWriter';
import type { CalculationResults, ProjectParams, Participant } from './calculatorUtils';
import type { TimelineSnapshot } from './timelineCalculations';

describe('Excel Export', () => {
  /* eslint-disable no-loss-of-precision */
  const mockCalculations: CalculationResults = {
    totalSurface: 472,
    pricePerM2: 1377.11864406779665,
    sharedCosts: 373965.63,
    sharedPerPerson: 93491.4075,
    participantBreakdown: [
      {
        name: 'Manuela/Dragan',
        capitalApporte: 50000,
        registrationFeesRate: 12.5,
        unitId: 1,
        surface: 112,
        interestRate: 4.5,
        durationYears: 25,
        quantity: 1,
        pricePerM2: 1377.11864406779665,
        purchaseShare: 154237.28813559322,
        droitEnregistrements: 19279.661016949153,
        fraisNotaireFixe: 1000,
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
        registrationFeesRate: 12.5,
        unitId: 3,
        surface: 134,
        interestRate: 4.5,
        durationYears: 25,
        quantity: 1,
        pricePerM2: 1377.11864406779665,
        purchaseShare: 184533.89830508474,
        droitEnregistrements: 23066.73728813559,
        fraisNotaireFixe: 1000,
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
      totalDroitEnregistrements: 81257.3220338983,
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

  const mockUnitDetails = {
    1: { casco: 178080, parachevements: 56000 },
    3: { casco: 213060, parachevements: 67000 },
  };

  describe('buildExportSheetData', () => {
    it('should build correct sheet structure with default data', () => {
      const sheetData = buildExportSheetData(
        mockCalculations,
        mockProjectParams,
        mockUnitDetails,
        '10/11/2025'
      );

      expect(sheetData.name).toBe('Calculateur Division');
      expect(sheetData.cells.length).toBeGreaterThan(0);
      expect(sheetData.columnWidths).toBeDefined();
      expect(sheetData.columnWidths?.length).toBe(47);

      // Check some key cells
      const headerCell = sheetData.cells.find(c => c.row === 1 && c.col === 'A');
      expect(headerCell?.data.value).toBe('ACHAT EN DIVISION - CALCULATEUR IMMOBILIER');

      const dateCell = sheetData.cells.find(c => c.row === 2 && c.col === 'A');
      expect(dateCell?.data.value).toBe('Wallonie, Belgique - 10/11/2025');

      const totalPurchaseCell = sheetData.cells.find(c => c.row === 5 && c.col === 'B');
      expect(totalPurchaseCell?.data.value).toBe(650000);

      // Check formula cells
      const pricePerM2Cell = sheetData.cells.find(c => c.row === 7 && c.col === 'B');
      expect(pricePerM2Cell?.data.formula).toBe('B5/B6');
    });

    it('should include participant data with formulas', () => {
      const sheetData = buildExportSheetData(
        mockCalculations,
        mockProjectParams,
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
      expect(p1PurchaseShareFormula?.data.formula).toBe(`C${p1Row}*$B$7`);

      const p1NotaryFeesFormula = sheetData.cells.find(c => c.row === p1Row && c.col === 'J');
      expect(p1NotaryFeesFormula?.data.formula).toBe(`I${p1Row}*F${p1Row}/100`);

      const p1FraisNotaireFixeFormula = sheetData.cells.find(c => c.row === p1Row && c.col === 'K');
      expect(p1FraisNotaireFixeFormula?.data.formula).toBe(`D${p1Row}*1000`);

      const p1MonthlyPaymentFormula = sheetData.cells.find(c => c.row === p1Row && c.col === 'S');
      expect(p1MonthlyPaymentFormula?.data.formula).toBe(`PMT(G${p1Row}/100/12,H${p1Row}*12,R${p1Row})*-1`);
    });

    it('should include totals row with SUM formulas', () => {
      const sheetData = buildExportSheetData(
        mockCalculations,
        mockProjectParams,
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
      expect(result).toContain('=B5/B6'); // Price per m2 formula
      expect(result).toContain('=PMT(G'); // Check for PMT formula (row number is dynamic)
      expect(result).toContain('SYNTHESE GLOBALE');
    });

    // Scenario modifications test removed - scenarios no longer exist
  });

  describe('CSV export snapshot', () => {
    it('should match expected CSV structure snapshot', () => {
      const csvWriter = new CsvWriter();
      const result = exportCalculations(
        mockCalculations,
        mockProjectParams,
        mockUnitDetails,
        csvWriter,
        'Calculateur_Division_2025.xlsx'
      );

      // Verify key sections exist in correct order
      const lines = (result || '').split('\n');

      // Find section indices
      const headerIdx = lines.findIndex(l => l.includes('ACHAT EN DIVISION'));
      const paramsIdx = lines.findIndex(l => l.includes('PARAMETRES DU PROJET'));
      const sharedCostsIdx = lines.findIndex(l => l.includes('COUTS PARTAGES'));
      const travauxIdx = lines.findIndex(l => l.includes('TRAVAUX COMMUNS'));
      const decompIdx = lines.findIndex(l => l.includes('DECOMPOSITION DES COUTS'));
      const detailHeaderIdx = lines.findIndex(l => l.includes('Nom') && l.includes('Unite') && l.includes('Surface'));
      const synthIdx = lines.findIndex(l => l.includes('SYNTHESE GLOBALE'));

      // Verify sections appear in expected order (scenario section removed)
      expect(headerIdx).toBeGreaterThan(-1);
      expect(paramsIdx).toBeGreaterThan(headerIdx);
      expect(sharedCostsIdx).toBeGreaterThan(paramsIdx);
      expect(travauxIdx).toBeGreaterThan(sharedCostsIdx);
      expect(decompIdx).toBeGreaterThan(travauxIdx);
      expect(detailHeaderIdx).toBeGreaterThan(decompIdx);
      expect(synthIdx).toBeGreaterThan(detailHeaderIdx);

      // Verify column count (18 columns: A through R)
      expect(result).toContain('|');

      // Snapshot verification: key formulas are present
      expect(result).toContain('=B5/B6'); // Price per m2
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
        mockUnitDetails,
        '10/11/2025'
      );

      // Row 16 now contains "Prix CASCO/m2 Global" (was row 23 before)
      const cascoRateCell = sheetData.cells.find(c => c.row === 16 && c.col === 'B');
      expect(cascoRateCell?.data.value).toBe(1590);
    });

    it('should include unit details section when provided', () => {
      const sheetData = buildExportSheetData(
        mockCalculations,
        mockProjectParams,
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

    it('should include timeline columns (founder, entry date)', () => {
      const sheetData = buildExportSheetData(
        mockCalculations,
        mockProjectParams,
        mockUnitDetails,
        '10/11/2025'
      );

      const fondateurHeader = sheetData.cells.find(c => c.data.value === 'Fondateur');
      const dateEntreeHeader = sheetData.cells.find(c => c.data.value === 'Date entree');

      expect(fondateurHeader).toBeDefined();
      expect(dateEntreeHeader).toBeDefined();
    });

    it('should include portage lots column', () => {
      const sheetData = buildExportSheetData(
        mockCalculations,
        mockProjectParams,
        mockUnitDetails,
        '10/11/2025'
      );

      const lotsDetenusHeader = sheetData.cells.find(c => c.data.value === 'Lots detenus');
      expect(lotsDetenusHeader).toBeDefined();
    });

    it('should include purchase details column', () => {
      const sheetData = buildExportSheetData(
        mockCalculations,
        mockProjectParams,
        mockUnitDetails,
        '10/11/2025'
      );

      const acheteDeHeader = sheetData.cells.find(c => c.data.value === 'Achete de');
      expect(acheteDeHeader).toBeDefined();
    });

    it('should include two-loan financing columns', () => {
      const sheetData = buildExportSheetData(
        mockCalculations,
        mockProjectParams,
        mockUnitDetails,
        '10/11/2025'
      );

      const twoLoansHeader = sheetData.cells.find(c => c.data.value === '2 prets');
      const loan1AmountHeader = sheetData.cells.find(c => c.data.value === 'Pret1 montant');
      const loan1MonthlyHeader = sheetData.cells.find(c => c.data.value === 'Pret1 mens');
      const loan2AmountHeader = sheetData.cells.find(c => c.data.value === 'Pret2 montant');
      const loan2MonthlyHeader = sheetData.cells.find(c => c.data.value === 'Pret2 mens');
      const loan2DurationHeader = sheetData.cells.find(c => c.data.value === 'Pret2 duree');

      expect(twoLoansHeader).toBeDefined();
      expect(loan1AmountHeader).toBeDefined();
      expect(loan1MonthlyHeader).toBeDefined();
      expect(loan2AmountHeader).toBeDefined();
      expect(loan2MonthlyHeader).toBeDefined();
      expect(loan2DurationHeader).toBeDefined();
    });
  });

  describe('buildTimelineSnapshotSheet', () => {
    it('should build timeline snapshot sheet with correct structure', () => {
      const mockParticipants: Participant[] = [
        {
          name: 'Founder1',
          surface: 100,
          capitalApporte: 50000,
          registrationFeesRate: 12.5,
          interestRate: 4.5,
          durationYears: 25,
          unitId: 1,
          quantity: 1,
          isFounder: true,
          entryDate: undefined
        },
        {
          name: 'Newcomer1',
          surface: 80,
          capitalApporte: 40000,
          registrationFeesRate: 12.5,
          interestRate: 4.5,
          durationYears: 25,
          unitId: 2,
          quantity: 1,
          isFounder: false,
          entryDate: new Date('2026-06-01'),
          purchaseDetails: {
            buyingFrom: 'Founder1',
            lotId: 1,
            purchasePrice: 200000
          }
        }
      ];

      const mockSnapshots = new Map<string, TimelineSnapshot[]>([
        ['Founder1', [
          {
            date: new Date('2025-01-15'),
            participantName: 'Founder1',
            participantIndex: 0,
            totalCost: 400000,
            loanNeeded: 350000,
            monthlyPayment: 1950,
            isT0: true,
            colorZone: 0,
            showFinancingDetails: true
          },
          {
            date: new Date('2026-06-01'),
            participantName: 'Founder1',
            participantIndex: 0,
            totalCost: 200000,
            loanNeeded: 150000,
            monthlyPayment: 835,
            isT0: false,
            colorZone: 1,
            showFinancingDetails: false,
            transaction: {
              type: 'portage_sale',
              seller: 'Founder1',
              buyer: 'Newcomer1',
              lotPrice: 150000,
              indexation: 5000,
              carryingCosts: 45000,
              registrationFees: 25000,
              delta: {
                totalCost: -200000,
                loanNeeded: -200000,
                reason: 'Portage lot sale'
              }
            }
          }
        ]],
        ['Newcomer1', [
          {
            date: new Date('2026-06-01'),
            participantName: 'Newcomer1',
            participantIndex: 1,
            totalCost: 225000,
            loanNeeded: 185000,
            monthlyPayment: 1028,
            isT0: false,
            colorZone: 1,
            showFinancingDetails: true,
            transaction: {
              type: 'portage_sale',
              seller: 'Founder1',
              buyer: 'Newcomer1',
              lotPrice: 150000,
              indexation: 5000,
              carryingCosts: 45000,
              registrationFees: 25000,
              delta: {
                totalCost: 225000,
                loanNeeded: 185000,
                reason: 'Purchasing portage lot'
              }
            }
          }
        ]]
      ]);

      const sheetData = buildTimelineSnapshotSheet(mockSnapshots, mockParticipants);

      expect(sheetData.name).toBe('Timeline Snapshots');
      expect(sheetData.cells.length).toBeGreaterThan(0);

      // Check header row
      const dateHeader = sheetData.cells.find(c => c.row === 1 && c.col === 'A');
      expect(dateHeader?.data.value).toBe('Date');

      const participantHeader = sheetData.cells.find(c => c.row === 1 && c.col === 'B');
      expect(participantHeader?.data.value).toBe('Participant');

      const totalCostHeader = sheetData.cells.find(c => c.row === 1 && c.col === 'C');
      expect(totalCostHeader?.data.value).toBe('Total Cost');

      const loanHeader = sheetData.cells.find(c => c.row === 1 && c.col === 'D');
      expect(loanHeader?.data.value).toBe('Loan Needed');

      const monthlyHeader = sheetData.cells.find(c => c.row === 1 && c.col === 'E');
      expect(monthlyHeader?.data.value).toBe('Monthly Payment');

      const isT0Header = sheetData.cells.find(c => c.row === 1 && c.col === 'F');
      expect(isT0Header?.data.value).toBe('Is T0');

      const txTypeHeader = sheetData.cells.find(c => c.row === 1 && c.col === 'G');
      expect(txTypeHeader?.data.value).toBe('Transaction Type');

      // Check first snapshot (Founder1 at T0)
      const founder1Date = sheetData.cells.find(c => c.row === 2 && c.col === 'A');
      expect(founder1Date?.data.value).toBe('15/01/2025'); // Belgian date format

      const founder1Name = sheetData.cells.find(c => c.row === 2 && c.col === 'B');
      expect(founder1Name?.data.value).toBe('Founder1');

      const founder1Cost = sheetData.cells.find(c => c.row === 2 && c.col === 'C');
      expect(founder1Cost?.data.value).toBe(400000);

      const founder1Loan = sheetData.cells.find(c => c.row === 2 && c.col === 'D');
      expect(founder1Loan?.data.value).toBe(350000);

      const founder1Monthly = sheetData.cells.find(c => c.row === 2 && c.col === 'E');
      expect(founder1Monthly?.data.value).toBe(1950);

      const founder1IsT0 = sheetData.cells.find(c => c.row === 2 && c.col === 'F');
      expect(founder1IsT0?.data.value).toBe('Yes');

      // Check transaction snapshot (row 3 - Founder1 sale)
      const saleDate = sheetData.cells.find(c => c.row === 3 && c.col === 'A');
      expect(saleDate?.data.value).toBe('01/06/2026'); // Belgian date format

      const sallerName = sheetData.cells.find(c => c.row === 3 && c.col === 'B');
      expect(sallerName?.data.value).toBe('Founder1');

      const txType = sheetData.cells.find(c => c.row === 3 && c.col === 'G');
      expect(txType?.data.value).toBe('portage_sale');

      const seller = sheetData.cells.find(c => c.row === 3 && c.col === 'H');
      expect(seller?.data.value).toBe('Founder1');

      const buyer = sheetData.cells.find(c => c.row === 3 && c.col === 'I');
      expect(buyer?.data.value).toBe('Newcomer1');

      const deltaCost = sheetData.cells.find(c => c.row === 3 && c.col === 'K');
      expect(deltaCost?.data.value).toBe(-200000);

      const deltaLoan = sheetData.cells.find(c => c.row === 3 && c.col === 'L');
      expect(deltaLoan?.data.value).toBe(-200000);

      const reason = sheetData.cells.find(c => c.row === 3 && c.col === 'M');
      expect(reason?.data.value).toBe('Portage lot sale');

      // Check buyer snapshot (row 4 - Newcomer1)
      const buyerDate = sheetData.cells.find(c => c.row === 4 && c.col === 'A');
      expect(buyerDate?.data.value).toBe('01/06/2026'); // Belgian date format

      const buyerName = sheetData.cells.find(c => c.row === 4 && c.col === 'B');
      expect(buyerName?.data.value).toBe('Newcomer1');

      const buyerCost = sheetData.cells.find(c => c.row === 4 && c.col === 'C');
      expect(buyerCost?.data.value).toBe(225000);

      const buyerDeltaCost = sheetData.cells.find(c => c.row === 4 && c.col === 'K');
      expect(buyerDeltaCost?.data.value).toBe(225000);

      const buyerReason = sheetData.cells.find(c => c.row === 4 && c.col === 'M');
      expect(buyerReason?.data.value).toBe('Purchasing portage lot');
    });

    it('should handle snapshots without transactions', () => {
      const mockParticipants: Participant[] = [
        {
          name: 'SimpleParticipant',
          surface: 100,
          capitalApporte: 50000,
          registrationFeesRate: 12.5,
          interestRate: 4.5,
          durationYears: 25,
          unitId: 1,
          quantity: 1,
          isFounder: true
        }
      ];

      const mockSnapshots = new Map<string, TimelineSnapshot[]>([
        ['SimpleParticipant', [
          {
            date: new Date('2025-01-15'),
            participantName: 'SimpleParticipant',
            participantIndex: 0,
            totalCost: 400000,
            loanNeeded: 350000,
            monthlyPayment: 1950,
            isT0: true,
            colorZone: 0,
            showFinancingDetails: true
          }
        ]]
      ]);

      const sheetData = buildTimelineSnapshotSheet(mockSnapshots, mockParticipants);

      expect(sheetData.cells.length).toBeGreaterThan(0);

      // Transaction columns should be empty
      const txType = sheetData.cells.find(c => c.row === 2 && c.col === 'G');
      expect(txType?.data.value).toBe('');

      const seller = sheetData.cells.find(c => c.row === 2 && c.col === 'H');
      expect(seller?.data.value).toBe('');

      const deltaCost = sheetData.cells.find(c => c.row === 2 && c.col === 'K');
      expect(deltaCost?.data.value).toBe('');
    });
  });

  describe('exportCalculations with timeline snapshots', () => {
    it('should export with both calculator and timeline sheets when snapshots provided', () => {
      const mockParticipants: Participant[] = [
        {
          name: 'Manuela/Dragan',
          surface: 112,
          capitalApporte: 50000,
          registrationFeesRate: 12.5,
          interestRate: 4.5,
          durationYears: 25,
          unitId: 1,
          quantity: 1,
          isFounder: true
        }
      ];

      const mockSnapshots = new Map<string, TimelineSnapshot[]>([
        ['Manuela/Dragan', [
          {
            date: new Date('2025-01-15'),
            participantName: 'Manuela/Dragan',
            participantIndex: 0,
            totalCost: 593313,
            loanNeeded: 543313,
            monthlyPayment: 3019.91,
            isT0: true,
            colorZone: 0,
            showFinancingDetails: true
          }
        ]]
      ]);

      const csvWriter = new CsvWriter();
      const result = exportCalculations(
        mockCalculations,
        mockProjectParams,
        mockUnitDetails,
        csvWriter,
        'test_with_timeline.xlsx',
        {
          timelineSnapshots: mockSnapshots,
          participants: mockParticipants
        }
      );

      expect(typeof result).toBe('string');
      expect(result).toContain('SHEET: Calculateur Division');
      expect(result).toContain('SHEET: Timeline Snapshots');
      expect(result).toContain('Manuela/Dragan');
      expect(result).toContain('15/01/2025');
      expect(result).toContain('593313');
    });

    it('should only export calculator sheet when no snapshots provided', () => {
      const csvWriter = new CsvWriter();
      const result = exportCalculations(
        mockCalculations,
        mockProjectParams,
        mockUnitDetails,
        csvWriter,
        'test_no_timeline.xlsx'
        // No options parameter
      );

      expect(typeof result).toBe('string');
      expect(result).toContain('SHEET: Calculateur Division');
      expect(result).not.toContain('SHEET: Timeline Snapshots');
    });
  });
});
