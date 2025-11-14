/**
 * UI-to-Export Parity Test
 *
 * This test ensures that all data fields displayed in the UI are also exported to Excel.
 * It helps prevent missing fields in exports and maintains data completeness.
 */

import { describe, it, expect } from 'vitest';
import { buildExportSheetData } from './excelExport';
import type { ParticipantCalculation, CalculationResults, ProjectParams } from './calculatorUtils';

describe('UI-to-Export Parity', () => {
  /**
   * Critical fields that MUST be in the Excel export
   * These are displayed in the UI and are essential for analysis
   */
  const criticalParticipantFields = {
    // Basic info
    name: 'Nom',
    unitId: 'Unite',
    surface: 'Surface',
    quantity: 'Qty',
    capitalApporte: 'Capital',

    // Financing config
    registrationFeesRate: 'Taux notaire',
    interestRate: 'Taux interet',
    durationYears: 'Duree (ans)',

    // Dual loan system (input fields)
    useTwoLoans: '2 prets',
    loan2DelayYears: 'Pret2 delai',
    loan2RenovationAmount: 'Reno pret2',
    capitalForLoan1: 'Capital pret1',
    capitalForLoan2: 'Capital pret2',

    // Timeline
    isFounder: 'Fondateur',
    entryDate: 'Date entree',
    lotsOwned: 'Lots detenus',
    soldDate: 'Date vente lot',

    // Purchase details (for newcomers)
    'purchaseDetails.buyingFrom': 'Achete de',
    'purchaseDetails.lotId': 'Lot ID achete',
    'purchaseDetails.purchasePrice': 'Prix achat lot',

    // Construction customization
    parachevementsPerM2: 'Parachev m2',
    cascoSqm: 'CASCO sqm',
    parachevementsSqm: 'Parachev sqm',
    globalCascoPerM2: 'CASCO m2',

    // Portage construction payment (for buyers)
    founderPaysCasco: 'Porteur paie CASCO',
    founderPaysParachèvement: 'Porteur paie Parachev',
  } as const;

  const criticalCalculationFields = {
    // Cost breakdown
    purchaseShare: 'Part achat',
    droitEnregistrements: 'Droit enreg.',
    fraisNotaireFixe: 'Frais notaire',
    casco: 'CASCO',
    parachevements: 'Parachevements',
    travauxCommuns: 'Travaux communs',
    personalRenovationCost: 'Reno perso',
    constructionCost: 'Construction',
    sharedCosts: 'Commun',
    totalCost: 'TOTAL',

    // Single loan
    loanNeeded: 'Emprunt',
    monthlyPayment: 'Mensualite',
    totalRepayment: 'Total rembourse',
    totalInterest: '(calculated from loan1 + loan2)',

    // Dual loan breakdown
    loan1Amount: 'Pret1 montant',
    loan1MonthlyPayment: 'Pret1 mens',
    loan1Interest: 'Pret1 interets',
    loan2Amount: 'Pret2 montant',
    loan2MonthlyPayment: 'Pret2 mens',
    loan2Interest: 'Pret2 interets',
    loan2DurationYears: 'Pret2 duree',
  } as const;

  it('should include all critical participant fields in export headers', () => {
    // Create minimal test data
    const calculations: CalculationResults = {
      totalSurface: 100,
      pricePerM2: 1000,
      sharedCosts: 10000,
      sharedPerPerson: 5000,
      participantBreakdown: [],
      totals: {
        purchase: 100000,
        totalDroitEnregistrements: 12500,
        construction: 50000,
        shared: 10000,
        totalTravauxCommuns: 5000,
        travauxCommunsPerUnit: 2500,
        total: 177500,
        capitalTotal: 50000,
        totalLoansNeeded: 127500,
        averageLoan: 63750,
        averageCapital: 25000,
      },
    };

    const projectParams: ProjectParams = {
      totalPurchase: 100000,
      mesuresConservatoires: 2000,
      demolition: 1000,
      infrastructures: 3000,
      etudesPreparatoires: 1000,
      fraisEtudesPreparatoires: 500,
      fraisGeneraux3ans: 2500,
      batimentFondationConservatoire: 1000,
      batimentFondationComplete: 1500,
      batimentCoproConservatoire: 2500,
      globalCascoPerM2: 500,
    };

    const sheetData = buildExportSheetData(calculations, projectParams);

    // Extract header row (should be in cells)
    const headerCells = sheetData.cells.filter(cell => {
      const value = cell.data.value;
      return typeof value === 'string' && Object.values(criticalParticipantFields).includes(value as typeof criticalParticipantFields[keyof typeof criticalParticipantFields]);
    });

    // Check that all critical fields are present
    const missingFields: string[] = [];
    Object.entries(criticalParticipantFields).forEach(([field, header]) => {
      const found = headerCells.some(cell => cell.data.value === header);
      if (!found) {
        missingFields.push(`${field} (expected header: "${header}")`);
      }
    });

    expect(missingFields, `Missing participant fields in export: ${missingFields.join(', ')}`).toHaveLength(0);
  });

  it('should include all critical calculation fields in export headers', () => {
    const calculations: CalculationResults = {
      totalSurface: 100,
      pricePerM2: 1000,
      sharedCosts: 10000,
      sharedPerPerson: 5000,
      participantBreakdown: [],
      totals: {
        purchase: 100000,
        totalDroitEnregistrements: 12500,
        construction: 50000,
        shared: 10000,
        totalTravauxCommuns: 5000,
        travauxCommunsPerUnit: 2500,
        total: 177500,
        capitalTotal: 50000,
        totalLoansNeeded: 127500,
        averageLoan: 63750,
        averageCapital: 25000,
      },
    };

    const projectParams: ProjectParams = {
      totalPurchase: 100000,
      mesuresConservatoires: 2000,
      demolition: 1000,
      infrastructures: 3000,
      etudesPreparatoires: 1000,
      fraisEtudesPreparatoires: 500,
      fraisGeneraux3ans: 2500,
      batimentFondationConservatoire: 1000,
      batimentFondationComplete: 1500,
      batimentCoproConservatoire: 2500,
      globalCascoPerM2: 500,
    };

    const sheetData = buildExportSheetData(calculations, projectParams);

    const headerCells = sheetData.cells.filter(cell =>
      cell.data.value && typeof cell.data.value === 'string'
    );

    const missingFields: string[] = [];
    Object.entries(criticalCalculationFields).forEach(([field, header]) => {
      if (header === '(calculated from loan1 + loan2)') {
        // Skip - this is a derived field
        return;
      }
      const found = headerCells.some(cell => cell.data.value === header);
      if (!found) {
        missingFields.push(`${field} (expected header: "${header}")`);
      }
    });

    expect(missingFields, `Missing calculation fields in export: ${missingFields.join(', ')}`).toHaveLength(0);
  });

  it('should export dual loan data when useTwoLoans is true', () => {
    const participantWithDualLoan: ParticipantCalculation = {
      name: 'Alice',
      unitId: 1,
      surface: 100,
      quantity: 1,
      capitalApporte: 30000,
      registrationFeesRate: 12.5,
      interestRate: 4.5,
      durationYears: 25,
      pricePerM2: 1000,
      purchaseShare: 100000,
      droitEnregistrements: 12500,
      fraisNotaireFixe: 1000,
      casco: 25000,
      parachevements: 15000,
      personalRenovationCost: 40000,
      constructionCost: 42500,
      constructionCostPerUnit: 42500,
      travauxCommunsPerUnit: 2500,
      sharedCosts: 5000,
      totalCost: 160000,
      loanNeeded: 130000,
      financingRatio: 81.25,
      monthlyPayment: 0, // Not used with two loans
      totalRepayment: 200000,
      totalInterest: 70000,

      // Dual loan inputs
      useTwoLoans: true,
      loan2DelayYears: 2,
      loan2RenovationAmount: 20000,
      capitalForLoan1: 20000,
      capitalForLoan2: 10000,

      // Dual loan calculations
      loan1Amount: 80000,
      loan1MonthlyPayment: 500,
      loan1Interest: 30000,
      loan2Amount: 50000,
      loan2DurationYears: 23,
      loan2MonthlyPayment: 350,
      loan2Interest: 40000,
    };

    const calculations: CalculationResults = {
      totalSurface: 100,
      pricePerM2: 1000,
      sharedCosts: 10000,
      sharedPerPerson: 5000,
      participantBreakdown: [participantWithDualLoan],
      totals: {
        purchase: 100000,
        totalDroitEnregistrements: 12500,
        construction: 50000,
        shared: 10000,
        totalTravauxCommuns: 5000,
        travauxCommunsPerUnit: 2500,
        total: 177500,
        capitalTotal: 50000,
        totalLoansNeeded: 127500,
        averageLoan: 63750,
        averageCapital: 25000,
      },
    };

    const projectParams: ProjectParams = {
      totalPurchase: 100000,
      mesuresConservatoires: 2000,
      demolition: 1000,
      infrastructures: 3000,
      etudesPreparatoires: 1000,
      fraisEtudesPreparatoires: 500,
      fraisGeneraux3ans: 2500,
      batimentFondationConservatoire: 1000,
      batimentFondationComplete: 1500,
      batimentCoproConservatoire: 2500,
      globalCascoPerM2: 500,
    };

    const sheetData = buildExportSheetData(calculations, projectParams);

    // Find cells containing dual loan data
    const dualLoanCells = sheetData.cells.filter(cell =>
      cell.data.value === 'Oui' || // useTwoLoans flag
      cell.data.value === 80000 || // loan1Amount
      cell.data.value === 500 || // loan1MonthlyPayment
      cell.data.value === 30000 || // loan1Interest
      cell.data.value === 50000 || // loan2Amount
      cell.data.value === 350 || // loan2MonthlyPayment
      cell.data.value === 40000 || // loan2Interest
      cell.data.value === 2 || // loan2DelayYears
      cell.data.value === 20000 // loan2RenovationAmount or capitalForLoan1
    );

    // Should have found multiple cells with dual loan data
    expect(dualLoanCells.length).toBeGreaterThan(0);

    // Check specific critical fields
    const hasDualLoanFlag = sheetData.cells.some(cell => cell.data.value === 'Oui');
    const hasLoan1Amount = sheetData.cells.some(cell => cell.data.value === 80000);
    const hasLoan2Amount = sheetData.cells.some(cell => cell.data.value === 50000);
    const hasLoan1Interest = sheetData.cells.some(cell => cell.data.value === 30000);
    const hasLoan2Interest = sheetData.cells.some(cell => cell.data.value === 40000);

    expect(hasDualLoanFlag, 'Should export useTwoLoans flag').toBe(true);
    expect(hasLoan1Amount, 'Should export loan1Amount').toBe(true);
    expect(hasLoan2Amount, 'Should export loan2Amount').toBe(true);
    expect(hasLoan1Interest, 'Should export loan1Interest').toBe(true);
    expect(hasLoan2Interest, 'Should export loan2Interest').toBe(true);
  });

  it('should have correct column count (46 columns for complete data)', () => {
    const calculations: CalculationResults = {
      totalSurface: 100,
      pricePerM2: 1000,
      sharedCosts: 10000,
      sharedPerPerson: 5000,
      participantBreakdown: [],
      totals: {
        purchase: 100000,
        totalDroitEnregistrements: 12500,
        construction: 50000,
        shared: 10000,
        totalTravauxCommuns: 5000,
        travauxCommunsPerUnit: 2500,
        total: 177500,
        capitalTotal: 50000,
        totalLoansNeeded: 127500,
        averageLoan: 63750,
        averageCapital: 25000,
      },
    };

    const projectParams: ProjectParams = {
      totalPurchase: 100000,
      mesuresConservatoires: 2000,
      demolition: 1000,
      infrastructures: 3000,
      etudesPreparatoires: 1000,
      fraisEtudesPreparatoires: 500,
      fraisGeneraux3ans: 2500,
      batimentFondationConservatoire: 1000,
      batimentFondationComplete: 1500,
      batimentCoproConservatoire: 2500,
      globalCascoPerM2: 500,
    };

    const sheetData = buildExportSheetData(calculations, projectParams);

    // Should have 46 column widths (columns 0-45 = A-AT)
    expect(sheetData.columnWidths?.length).toBe(46);

    // Last column should be at index 45 (column AT in 0-based indexing)
    const lastColumnIndex = Math.max(...(sheetData.columnWidths ?? []).map(cw => cw.col));
    expect(lastColumnIndex).toBe(45); // Column AT (0-based: 45, Excel: AT)
  });
});
