import { describe, it, expect } from 'vitest';
import { calculateAll } from './calculatorUtils';
import { buildExportSheetData } from './excelExport';
import type { Participant, ProjectParams, Scenario, UnitDetails } from './calculatorUtils';

/**
 * Integration test to verify that Excel export accurately reflects UI data
 * This ensures that all fields visible/editable in the UI are captured in the export
 */
describe('Excel Export Integration - UI Data Accuracy', () => {
  // Simulate real UI state with all possible fields
  const participants: Participant[] = [
    {
      name: 'Test Participant 1',
      capitalApporte: 100000,
      notaryFeesRate: 12.5,
      interestRate: 4.5,
      durationYears: 25,
      unitId: 1,
      surface: 112,
      quantity: 1,
      // Optional overrides that can be set in UI
      parachevementsPerM2: 600,
      cascoSqm: 100,
      parachevementsSqm: 110,
      // Timeline fields
      isFounder: true,
      entryDate: new Date('2024-01-15'),
    },
    {
      name: 'Test Participant 2',
      capitalApporte: 150000,
      notaryFeesRate: 12.5,
      interestRate: 4.5,
      durationYears: 25,
      unitId: 3,
      surface: 134,
      quantity: 2, // Multi-unit participant
      isFounder: true,
      entryDate: new Date('2024-01-15'),
    }
  ];

  const projectParams: ProjectParams = {
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
    globalCascoPerM2: 1590,
    // Expense categories (new feature)
    expenseCategories: {
      conservatoire: [
        { label: 'Mesures conservatoires', amount: 20000 },
        { label: 'Démolition', amount: 40000 },
      ],
      habitabiliteSommaire: [
        { label: 'Chauffage provisoire', amount: 5000 },
      ],
      premierTravaux: [
        { label: 'Toiture', amount: 30000 },
      ]
    }
  };

  const scenario: Scenario = {
    constructionCostChange: 10,
    infrastructureReduction: 5,
    purchasePriceReduction: 2,
  };

  const unitDetails: UnitDetails = {
    1: { casco: 178080, parachevements: 56000 },
    3: { casco: 213060, parachevements: 67000 },
  };

  it('should export all participant input fields from UI', () => {
    const calculations = calculateAll(participants, projectParams, scenario, unitDetails);
    const sheetData = buildExportSheetData(calculations, projectParams, scenario, unitDetails);

    // Find participant rows
    const p1Row = sheetData.cells.find(c => c.data.value === 'Test Participant 1')!.row;
    const p2Row = sheetData.cells.find(c => c.data.value === 'Test Participant 2')!.row;

    // Verify all participant inputs are exported
    // Name
    expect(sheetData.cells.find(c => c.row === p1Row && c.col === 'A')?.data.value).toBe('Test Participant 1');

    // Unit ID
    expect(sheetData.cells.find(c => c.row === p1Row && c.col === 'B')?.data.value).toBe(1);

    // Surface
    expect(sheetData.cells.find(c => c.row === p1Row && c.col === 'C')?.data.value).toBe(112);

    // Quantity (NEW - was missing before)
    expect(sheetData.cells.find(c => c.row === p1Row && c.col === 'D')?.data.value).toBe(1);
    expect(sheetData.cells.find(c => c.row === p2Row && c.col === 'D')?.data.value).toBe(2);

    // Capital
    expect(sheetData.cells.find(c => c.row === p1Row && c.col === 'E')?.data.value).toBe(100000);

    // Notary rate
    expect(sheetData.cells.find(c => c.row === p1Row && c.col === 'F')?.data.value).toBe(12.5);

    // Interest rate
    expect(sheetData.cells.find(c => c.row === p1Row && c.col === 'G')?.data.value).toBe(4.5);

    // Duration
    expect(sheetData.cells.find(c => c.row === p1Row && c.col === 'H')?.data.value).toBe(25);

    // Overrides (NEW - were missing before)
    expect(sheetData.cells.find(c => c.row === p1Row && c.col === 'U')?.data.value).toBe(600); // parachevementsPerM2
    expect(sheetData.cells.find(c => c.row === p1Row && c.col === 'W')?.data.value).toBe(100); // cascoSqm
    expect(sheetData.cells.find(c => c.row === p1Row && c.col === 'X')?.data.value).toBe(110); // parachevementsSqm
  });

  it('should export all calculated values shown in UI', () => {
    const calculations = calculateAll(participants, projectParams, scenario, unitDetails);
    const sheetData = buildExportSheetData(calculations, projectParams, scenario, unitDetails);

    const p1Row = sheetData.cells.find(c => c.data.value === 'Test Participant 1')!.row;
    const p1Calc = calculations.participantBreakdown[0];

    // Verify all calculated fields match
    expect(sheetData.cells.find(c => c.row === p1Row && c.col === 'K')?.data.value).toBe(p1Calc.casco);
    expect(sheetData.cells.find(c => c.row === p1Row && c.col === 'L')?.data.value).toBe(p1Calc.parachevements);

    // Personal renovation cost (NEW - was missing before)
    expect(sheetData.cells.find(c => c.row === p1Row && c.col === 'T')?.data.value).toBe(p1Calc.personalRenovationCost);
  });

  it('should export all project parameters from UI', () => {
    const calculations = calculateAll(participants, projectParams, scenario, unitDetails);
    const sheetData = buildExportSheetData(calculations, projectParams, scenario, unitDetails);

    // Verify project params
    expect(sheetData.cells.find(c => c.row === 5 && c.col === 'B')?.data.value).toBe(650000); // totalPurchase

    // Global CASCO rate (NEW - was missing before)
    expect(sheetData.cells.find(c => c.row === 23 && c.col === 'B')?.data.value).toBe(1590);

    // Scenario params
    expect(sheetData.cells.find(c => c.row === 6 && c.col === 'B')?.data.value).toBe(2); // purchasePriceReduction
    expect(sheetData.cells.find(c => c.row === 12 && c.col === 'B')?.data.value).toBe(10); // constructionCostChange
    expect(sheetData.cells.find(c => c.row === 13 && c.col === 'B')?.data.value).toBe(5); // infrastructureReduction
  });

  it('should export expense categories when present', () => {
    const calculations = calculateAll(participants, projectParams, scenario, unitDetails);
    const sheetData = buildExportSheetData(calculations, projectParams, scenario, unitDetails);

    // Verify expense categories section exists (NEW - was missing before)
    const detailHeader = sheetData.cells.find(c => c.data.value === 'DETAIL DEPENSES COMMUNES');
    expect(detailHeader).toBeDefined();

    // Verify category headers
    expect(sheetData.cells.find(c => c.data.value === 'CONSERVATOIRE')).toBeDefined();
    expect(sheetData.cells.find(c => c.data.value === 'HABITABILITE SOMMAIRE')).toBeDefined();
    expect(sheetData.cells.find(c => c.data.value === 'PREMIER TRAVAUX')).toBeDefined();

    // Verify expense items
    expect(sheetData.cells.find(c => c.data.value === '  Mesures conservatoires')).toBeDefined();
    expect(sheetData.cells.find(c => c.data.value === '  Chauffage provisoire')).toBeDefined();
    expect(sheetData.cells.find(c => c.data.value === '  Toiture')).toBeDefined();
  });

  it('should export unit details reference', () => {
    const calculations = calculateAll(participants, projectParams, scenario, unitDetails);
    const sheetData = buildExportSheetData(calculations, projectParams, scenario, unitDetails);

    // Verify unit details section exists (NEW - was missing before)
    const unitDetailsHeader = sheetData.cells.find(c => c.data.value === 'DETAILS PAR TYPE D UNITE');
    expect(unitDetailsHeader).toBeDefined();

    // Verify unit entries
    const unit1Entry = sheetData.cells.find(c => c.data.value === 'Unite 1');
    const unit3Entry = sheetData.cells.find(c => c.data.value === 'Unite 3');
    expect(unit1Entry).toBeDefined();
    expect(unit3Entry).toBeDefined();

    // Verify unit details contain CASCO and parachevements info
    const unit1Details = sheetData.cells.find(c => c.row === unit1Entry!.row && c.col === 'B')?.data.value as string;
    expect(unit1Details).toContain('178080');
    expect(unit1Details).toContain('56000');
  });

  it('should export all summary totals shown in UI', () => {
    const calculations = calculateAll(participants, projectParams, scenario, unitDetails);
    const sheetData = buildExportSheetData(calculations, projectParams, scenario, unitDetails);

    // Find synthesis section
    const synthHeader = sheetData.cells.find(c => c.data.value === 'SYNTHESE GLOBALE');
    expect(synthHeader).toBeDefined();
    const synthRow = synthHeader!.row;

    // Verify summary formulas exist (these match UI totals)
    expect(sheetData.cells.find(c => c.row === synthRow + 1 && c.col === 'A')?.data.value).toBe('Cout total projet');
    expect(sheetData.cells.find(c => c.row === synthRow + 2 && c.col === 'A')?.data.value).toBe('Capital total apporte');
    expect(sheetData.cells.find(c => c.row === synthRow + 3 && c.col === 'A')?.data.value).toBe('Total emprunts necessaires');
    expect(sheetData.cells.find(c => c.row === synthRow + 4 && c.col === 'A')?.data.value).toBe('Emprunt moyen');
  });

  it('should match calculations between UI and export', () => {
    const calculations = calculateAll(participants, projectParams, scenario, unitDetails);
    const sheetData = buildExportSheetData(calculations, projectParams, scenario, unitDetails);

    // Verify totals match
    expect(calculations.totalSurface).toBe(246); // 112 + 134

    const totalSurfaceCell = sheetData.cells.find(c => c.row === 8 && c.col === 'B');
    expect(totalSurfaceCell?.data.value).toBe(246);

    // Verify price per m2
    const pricePerM2 = calculations.pricePerM2;
    expect(pricePerM2).toBeGreaterThan(0);

    // Verify participant totals
    expect(calculations.participantBreakdown.length).toBe(2);
    expect(calculations.totals.capitalTotal).toBe(250000); // 100000 + 150000
  });
});
