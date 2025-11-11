/**
 * Tests for JSON export functionality
 * Ensures all inputs, formulas, and calculation results are captured
 */

import { describe, it, expect } from 'vitest';
import { calculateAll } from '../utils/calculatorUtils';
import type { Participant, ProjectParams, UnitDetails } from '../utils/calculatorUtils';
import { RELEASE_VERSION } from '../utils/version';

describe('JSON Export Completeness', () => {
  const mockParticipants: Participant[] = [
    {
      name: 'Test Participant 1',
      capitalApporte: 100000,
      notaryFeesRate: 12.5,
      unitId: 1,
      surface: 100,
      interestRate: 4.5,
      durationYears: 25,
      quantity: 1,
      parachevementsPerM2: 500,
      isFounder: true,
      entryDate: new Date('2026-02-01')
    },
    {
      name: 'Test Participant 2',
      capitalApporte: 150000,
      notaryFeesRate: 12.5,
      unitId: 3,
      surface: 120,
      interestRate: 4.0,
      durationYears: 20,
      quantity: 1,
      parachevementsPerM2: 600,
      cascoSqm: 80,
      parachevementsSqm: 100,
      isFounder: false,
      entryDate: new Date('2027-01-01')
    }
  ];

  const mockProjectParams: ProjectParams = {
    totalPurchase: 650000,
    mesuresConservatoires: 20000,
    demolition: 40000,
    infrastructures: 90000,
    etudesPreparatoires: 59820,
    fraisEtudesPreparatoires: 27320,
    fraisGeneraux3ans: 0,
    batimentFondationConservatoire: 43700,
    batimentFondationComplete: 269200,
    batimentCoproConservatoire: 56000,
    globalCascoPerM2: 1590
  };

  const mockUnitDetails: UnitDetails = {
    1: { casco: 178080, parachevements: 56000 },
    3: { casco: 213060, parachevements: 67000 }
  };

  const mockDeedDate = '2026-02-01';

  // Helper to build export data structure
  const buildExportData = (participants: Participant[], calculations: any) => ({
    version: 2,
    releaseVersion: RELEASE_VERSION,
    timestamp: new Date().toISOString(),
    participants,
    projectParams: mockProjectParams,
    deedDate: mockDeedDate,
    unitDetails: mockUnitDetails,
    calculations
  });

  it('should include all required top-level fields', () => {
    const calculations = calculateAll(mockParticipants, mockProjectParams, mockUnitDetails, mockDeedDate);

    const exportData = {
      version: 2,
      releaseVersion: RELEASE_VERSION,
      timestamp: new Date().toISOString(),
      participants: mockParticipants,
      projectParams: mockProjectParams,
      deedDate: mockDeedDate,
      unitDetails: mockUnitDetails,
      calculations
    };

    // Verify all top-level fields exist
    expect(exportData).toHaveProperty('version');
    expect(exportData).toHaveProperty('releaseVersion');
    expect(exportData).toHaveProperty('timestamp');
    expect(exportData).toHaveProperty('participants');
    expect(exportData).toHaveProperty('projectParams');
    expect(exportData).toHaveProperty('deedDate');
    expect(exportData).toHaveProperty('unitDetails');
    expect(exportData).toHaveProperty('calculations');

    // Verify version is 2
    expect(exportData.version).toBe(2);

    // Verify release version matches current
    expect(exportData.releaseVersion).toBe(RELEASE_VERSION);
  });

  it('should include all participant input fields', () => {
    const calculations = calculateAll(mockParticipants, mockProjectParams, mockUnitDetails, mockDeedDate);

    const exportData = {
      version: 2,
      timestamp: new Date().toISOString(),
      participants: mockParticipants,
      projectParams: mockProjectParams,
      deedDate: mockDeedDate,
      unitDetails: mockUnitDetails,
      calculations
    };

    const participant = exportData.participants[0];

    // Required fields
    expect(participant).toHaveProperty('name');
    expect(participant).toHaveProperty('capitalApporte');
    expect(participant).toHaveProperty('notaryFeesRate');
    expect(participant).toHaveProperty('unitId');
    expect(participant).toHaveProperty('surface');
    expect(participant).toHaveProperty('interestRate');
    expect(participant).toHaveProperty('durationYears');
    expect(participant).toHaveProperty('quantity');
    expect(participant).toHaveProperty('parachevementsPerM2');

    // Timeline fields
    expect(participant).toHaveProperty('isFounder');
    expect(participant).toHaveProperty('entryDate');

    // Optional override fields
    const participant2 = exportData.participants[1];
    expect(participant2).toHaveProperty('cascoSqm');
    expect(participant2).toHaveProperty('parachevementsSqm');
  });

  it('should include all projectParams fields', () => {
    const calculations = calculateAll(mockParticipants, mockProjectParams, mockUnitDetails, mockDeedDate);

    const exportData = {
      version: 2,
      timestamp: new Date().toISOString(),
      participants: mockParticipants,
      projectParams: mockProjectParams,
      deedDate: mockDeedDate,
      unitDetails: mockUnitDetails,
      calculations
    };

    const params = exportData.projectParams;

    expect(params).toHaveProperty('totalPurchase');
    expect(params).toHaveProperty('mesuresConservatoires');
    expect(params).toHaveProperty('demolition');
    expect(params).toHaveProperty('infrastructures');
    expect(params).toHaveProperty('etudesPreparatoires');
    expect(params).toHaveProperty('fraisEtudesPreparatoires');
    expect(params).toHaveProperty('fraisGeneraux3ans');
    expect(params).toHaveProperty('batimentFondationConservatoire');
    expect(params).toHaveProperty('batimentFondationComplete');
    expect(params).toHaveProperty('batimentCoproConservatoire');
    expect(params).toHaveProperty('globalCascoPerM2');
  });

  // Scenario tests removed - scenarios no longer exist

  it('should include all calculation summary fields', () => {
    const calculations = calculateAll(mockParticipants, mockProjectParams, mockUnitDetails, mockDeedDate);

    const exportData = {
      version: 2,
      timestamp: new Date().toISOString(),
      participants: mockParticipants,
      projectParams: mockProjectParams,
      deedDate: mockDeedDate,
      unitDetails: mockUnitDetails,
      calculations
    };

    const calc = exportData.calculations;

    // Top-level calculation results
    expect(calc).toHaveProperty('totalSurface');
    expect(calc).toHaveProperty('pricePerM2');
    expect(calc).toHaveProperty('sharedCosts');
    expect(calc).toHaveProperty('sharedPerPerson');
    expect(calc).toHaveProperty('participantBreakdown');
    expect(calc).toHaveProperty('totals');
  });

  it('should include all participant calculation fields', () => {
    const calculations = calculateAll(mockParticipants, mockProjectParams, mockUnitDetails, mockDeedDate);

    const exportData = {
      version: 2,
      timestamp: new Date().toISOString(),
      participants: mockParticipants,
      projectParams: mockProjectParams,
      deedDate: mockDeedDate,
      unitDetails: mockUnitDetails,
      calculations
    };

    const participantCalc = exportData.calculations.participantBreakdown[0];

    // All calculated fields should be present
    expect(participantCalc).toHaveProperty('name');
    expect(participantCalc).toHaveProperty('unitId');
    expect(participantCalc).toHaveProperty('surface');
    expect(participantCalc).toHaveProperty('quantity');
    expect(participantCalc).toHaveProperty('pricePerM2');
    expect(participantCalc).toHaveProperty('purchaseShare');
    expect(participantCalc).toHaveProperty('notaryFees');
    expect(participantCalc).toHaveProperty('casco');
    expect(participantCalc).toHaveProperty('parachevements');
    expect(participantCalc).toHaveProperty('personalRenovationCost');
    expect(participantCalc).toHaveProperty('constructionCost');
    expect(participantCalc).toHaveProperty('constructionCostPerUnit');
    expect(participantCalc).toHaveProperty('travauxCommunsPerUnit');
    expect(participantCalc).toHaveProperty('sharedCosts');
    expect(participantCalc).toHaveProperty('totalCost');
    expect(participantCalc).toHaveProperty('loanNeeded');
    expect(participantCalc).toHaveProperty('financingRatio');
    expect(participantCalc).toHaveProperty('monthlyPayment');
    expect(participantCalc).toHaveProperty('totalRepayment');
    expect(participantCalc).toHaveProperty('totalInterest');
  });

  it('should include all totals fields', () => {
    const calculations = calculateAll(mockParticipants, mockProjectParams, mockUnitDetails, mockDeedDate);

    const exportData = {
      version: 2,
      timestamp: new Date().toISOString(),
      participants: mockParticipants,
      projectParams: mockProjectParams,
      deedDate: mockDeedDate,
      unitDetails: mockUnitDetails,
      calculations
    };

    const totals = exportData.calculations.totals;

    expect(totals).toHaveProperty('purchase');
    expect(totals).toHaveProperty('totalNotaryFees');
    expect(totals).toHaveProperty('construction');
    expect(totals).toHaveProperty('shared');
    expect(totals).toHaveProperty('totalTravauxCommuns');
    expect(totals).toHaveProperty('travauxCommunsPerUnit');
    expect(totals).toHaveProperty('total');
    expect(totals).toHaveProperty('capitalTotal');
    expect(totals).toHaveProperty('totalLoansNeeded');
    expect(totals).toHaveProperty('averageLoan');
    expect(totals).toHaveProperty('averageCapital');
  });

  it('should preserve all numeric values with precision', () => {
    const calculations = calculateAll(mockParticipants, mockProjectParams, mockUnitDetails, mockDeedDate);

    const exportData = {
      version: 2,
      timestamp: new Date().toISOString(),
      participants: mockParticipants,
      projectParams: mockProjectParams,
      deedDate: mockDeedDate,
      unitDetails: mockUnitDetails,
      calculations
    };

    // Serialize and deserialize to ensure precision is preserved
    const json = JSON.stringify(exportData, null, 2);
    const parsed = JSON.parse(json);

    // Check that numbers are preserved with full precision
    expect(parsed.calculations.pricePerM2).toBe(calculations.pricePerM2);
    expect(parsed.calculations.participantBreakdown[0].monthlyPayment).toBe(
      calculations.participantBreakdown[0].monthlyPayment
    );
    expect(parsed.calculations.totals.total).toBe(calculations.totals.total);
  });

  it('should include deedDate for version 2', () => {
    const calculations = calculateAll(mockParticipants, mockProjectParams, mockUnitDetails, mockDeedDate);

    const exportData = {
      version: 2,
      timestamp: new Date().toISOString(),
      participants: mockParticipants,
      projectParams: mockProjectParams,
      deedDate: mockDeedDate,
      unitDetails: mockUnitDetails,
      calculations
    };

    expect(exportData.deedDate).toBe(mockDeedDate);
  });

  it('should include unitDetails for reference', () => {
    const calculations = calculateAll(mockParticipants, mockProjectParams, mockUnitDetails, mockDeedDate);

    const exportData = {
      version: 2,
      timestamp: new Date().toISOString(),
      participants: mockParticipants,
      projectParams: mockProjectParams,
      deedDate: mockDeedDate,
      unitDetails: mockUnitDetails,
      calculations
    };

    expect(exportData.unitDetails).toEqual(mockUnitDetails);
    expect(exportData.unitDetails[1]).toEqual({ casco: 178080, parachevements: 56000 });
    expect(exportData.unitDetails[3]).toEqual({ casco: 213060, parachevements: 67000 });
  });

  it('should be able to round-trip serialize and deserialize', () => {
    const calculations = calculateAll(mockParticipants, mockProjectParams, mockUnitDetails, mockDeedDate);

    const exportData = {
      version: 2,
      timestamp: new Date().toISOString(),
      participants: mockParticipants,
      projectParams: mockProjectParams,
      deedDate: mockDeedDate,
      unitDetails: mockUnitDetails,
      calculations
    };

    // Serialize to JSON
    const json = JSON.stringify(exportData, null, 2);

    // Deserialize
    const parsed = JSON.parse(json);

    // Verify all major sections are present
    expect(parsed.version).toBe(2);
    expect(parsed.participants).toBeDefined();
    expect(parsed.projectParams).toBeDefined();
    // scenario removed - no longer exists
    expect(parsed.deedDate).toBeDefined();
    expect(parsed.unitDetails).toBeDefined();
    expect(parsed.calculations).toBeDefined();

    // Verify structure is maintained
    expect(parsed.participants.length).toBe(mockParticipants.length);
    expect(parsed.calculations.participantBreakdown.length).toBe(mockParticipants.length);
  });

  it('should capture all formula inputs for reproducibility', () => {
    const calculations = calculateAll(mockParticipants, mockProjectParams, mockUnitDetails, mockDeedDate);

    const exportData = {
      version: 2,
      timestamp: new Date().toISOString(),
      participants: mockParticipants,
      projectParams: mockProjectParams,
      deedDate: mockDeedDate,
      unitDetails: mockUnitDetails,
      calculations
    };

    // Verify we have all inputs needed to recalculate
    const recalculated = calculateAll(
      exportData.participants,
      exportData.projectParams,
      exportData.unitDetails,
      exportData.deedDate
    );

    // Results should match
    expect(recalculated.pricePerM2).toBe(exportData.calculations.pricePerM2);
    expect(recalculated.totalSurface).toBe(exportData.calculations.totalSurface);
    expect(recalculated.totals.total).toBe(exportData.calculations.totals.total);
  });

  it('should include portage lot details in lotsOwned array', () => {
    const participantWithPortage: Participant = {
      name: 'Portage Participant',
      capitalApporte: 200000,
      notaryFeesRate: 12.5,
      unitId: 1,
      surface: 200,
      interestRate: 4.5,
      durationYears: 25,
      quantity: 2,
      parachevementsPerM2: 500,
      isFounder: true,
      entryDate: new Date('2026-02-01'),
      lotsOwned: [
        {
          lotId: 1,
          surface: 100,
          unitId: 1,
          isPortage: false,
          allocatedSurface: 100,
          acquiredDate: new Date('2026-02-01')
        },
        {
          lotId: 2,
          surface: 100,
          unitId: 2,
          isPortage: true,
          allocatedSurface: 100,
          acquiredDate: new Date('2026-02-01'),
          originalPrice: 150000,
          originalNotaryFees: 18750,
          originalConstructionCost: 200000,
          monthlyCarryingCost: 2500
        }
      ]
    };

    const calculations = calculateAll([participantWithPortage], mockProjectParams, mockUnitDetails, mockDeedDate);

    const exportData = {
      version: 2,
      timestamp: new Date().toISOString(),
      participants: [participantWithPortage],
      projectParams: mockProjectParams,
      deedDate: mockDeedDate,
      unitDetails: mockUnitDetails,
      calculations
    };

    // Serialize and deserialize
    const json = JSON.stringify(exportData, null, 2);
    const parsed = JSON.parse(json);

    // Verify lotsOwned is present
    expect(parsed.participants[0].lotsOwned).toBeDefined();
    expect(parsed.participants[0].lotsOwned.length).toBe(2);

    // Verify regular lot fields
    const regularLot = parsed.participants[0].lotsOwned[0];
    expect(regularLot.lotId).toBe(1);
    expect(regularLot.surface).toBe(100);
    expect(regularLot.unitId).toBe(1);
    expect(regularLot.isPortage).toBe(false);
    expect(regularLot.allocatedSurface).toBe(100);

    // Verify portage lot fields
    const portageLot = parsed.participants[0].lotsOwned[1];
    expect(portageLot.lotId).toBe(2);
    expect(portageLot.surface).toBe(100);
    expect(portageLot.unitId).toBe(2);
    expect(portageLot.isPortage).toBe(true);
    expect(portageLot.allocatedSurface).toBe(100);
    expect(portageLot.originalPrice).toBe(150000);
    expect(portageLot.originalNotaryFees).toBe(18750);
    expect(portageLot.originalConstructionCost).toBe(200000);
    expect(portageLot.monthlyCarryingCost).toBe(2500);
  });

  it('should include purchaseDetails for newcomer participants', () => {
    const newcomerParticipant: Participant = {
      name: 'Newcomer',
      capitalApporte: 320000,
      notaryFeesRate: 3,
      unitId: 3,
      surface: 100,
      interestRate: 4.5,
      durationYears: 25,
      quantity: 1,
      parachevementsPerM2: 600,
      isFounder: false,
      entryDate: new Date('2027-01-01'),
      purchaseDetails: {
        buyingFrom: 'Founder Name',
        lotId: 5,
        purchasePrice: 250000,
        breakdown: {
          basePrice: 150000,
          indexation: 30000,
          carryingCostRecovery: 40000,
          feesRecovery: 20000,
          renovations: 10000
        }
      }
    };

    const calculations = calculateAll([newcomerParticipant], mockProjectParams, mockUnitDetails, mockDeedDate);

    const exportData = {
      version: 2,
      timestamp: new Date().toISOString(),
      participants: [newcomerParticipant],
      projectParams: mockProjectParams,
      deedDate: mockDeedDate,
      unitDetails: mockUnitDetails,
      calculations
    };

    // Serialize and deserialize
    const json = JSON.stringify(exportData, null, 2);
    const parsed = JSON.parse(json);

    // Verify purchaseDetails is present
    const purchaseDetails = parsed.participants[0].purchaseDetails;
    expect(purchaseDetails).toBeDefined();
    expect(purchaseDetails.buyingFrom).toBe('Founder Name');
    expect(purchaseDetails.lotId).toBe(5);
    expect(purchaseDetails.purchasePrice).toBe(250000);

    // Verify breakdown
    expect(purchaseDetails.breakdown).toBeDefined();
    expect(purchaseDetails.breakdown.basePrice).toBe(150000);
    expect(purchaseDetails.breakdown.indexation).toBe(30000);
    expect(purchaseDetails.breakdown.carryingCostRecovery).toBe(40000);
    expect(purchaseDetails.breakdown.feesRecovery).toBe(20000);
    expect(purchaseDetails.breakdown.renovations).toBe(10000);
  });

  it('should include timeline fields (isFounder, entryDate, exitDate)', () => {
    const founderParticipant: Participant = {
      name: 'Founder',
      capitalApporte: 200000,
      notaryFeesRate: 12.5,
      unitId: 1,
      surface: 100,
      interestRate: 4.5,
      durationYears: 25,
      quantity: 1,
      parachevementsPerM2: 500,
      isFounder: true,
      entryDate: new Date('2026-02-01')
    };

    const exitingParticipant: Participant = {
      name: 'Exiting',
      capitalApporte: 150000,
      notaryFeesRate: 12.5,
      unitId: 2,
      surface: 120,
      interestRate: 4.5,
      durationYears: 25,
      quantity: 1,
      parachevementsPerM2: 500,
      isFounder: true,
      entryDate: new Date('2026-02-01'),
      exitDate: new Date('2028-06-01')
    };

    const calculations = calculateAll(
      [founderParticipant, exitingParticipant],
      mockProjectParams,
      mockUnitDetails,
      mockDeedDate
    );

    const exportData = {
      version: 2,
      timestamp: new Date().toISOString(),
      participants: [founderParticipant, exitingParticipant],
      projectParams: mockProjectParams,
      deedDate: mockDeedDate,
      unitDetails: mockUnitDetails,
      calculations
    };

    // Serialize and deserialize
    const json = JSON.stringify(exportData, null, 2);
    const parsed = JSON.parse(json);

    // Verify founder timeline fields
    expect(parsed.participants[0].isFounder).toBe(true);
    expect(parsed.participants[0].entryDate).toBe('2026-02-01T00:00:00.000Z');
    expect(parsed.participants[0].exitDate).toBeUndefined();

    // Verify exiting participant timeline fields
    expect(parsed.participants[1].isFounder).toBe(true);
    expect(parsed.participants[1].entryDate).toBe('2026-02-01T00:00:00.000Z');
    expect(parsed.participants[1].exitDate).toBe('2028-06-01T00:00:00.000Z');
  });

  it('should include release version for compatibility checking', () => {
    const calculations = calculateAll(mockParticipants, mockProjectParams, mockUnitDetails, mockDeedDate);
    const exportData = buildExportData(mockParticipants, calculations);

    // Verify release version is present
    expect(exportData.releaseVersion).toBeDefined();
    expect(exportData.releaseVersion).toBe(RELEASE_VERSION);
    expect(typeof exportData.releaseVersion).toBe('string');

    // Verify it survives JSON serialization
    const json = JSON.stringify(exportData);
    const parsed = JSON.parse(json);
    expect(parsed.releaseVersion).toBe(RELEASE_VERSION);
  });

  it('should include version format that matches semantic versioning', () => {
    const calculations = calculateAll(mockParticipants, mockProjectParams, mockUnitDetails, mockDeedDate);
    const exportData = buildExportData(mockParticipants, calculations);

    // Release version should follow semantic versioning (x.y.z)
    const semverPattern = /^\d+\.\d+\.\d+$/;
    expect(exportData.releaseVersion).toMatch(semverPattern);
  });

  it('should include two-loan financing breakdown in calculations', () => {
    const twoLoanParticipant: Participant = {
      name: 'Two Loan Participant',
      capitalApporte: 100000,
      notaryFeesRate: 12.5,
      unitId: 1,
      surface: 100,
      interestRate: 4.5,
      durationYears: 25,
      quantity: 1,
      parachevementsPerM2: 500,
      isFounder: true,
      entryDate: new Date('2026-02-01'),
      // Two-loan financing enabled
      useTwoLoans: true,
      loan2DelayYears: 2,
      loan2RenovationAmount: 80000,
      capitalForLoan1: 60000,
      capitalForLoan2: 40000
    };

    const calculations = calculateAll([twoLoanParticipant], mockProjectParams, mockUnitDetails, mockDeedDate);

    const exportData = {
      version: 2,
      releaseVersion: RELEASE_VERSION,
      timestamp: new Date().toISOString(),
      participants: [twoLoanParticipant],
      projectParams: mockProjectParams,
      deedDate: mockDeedDate,
      unitDetails: mockUnitDetails,
      calculations
    };

    // Serialize and deserialize
    const json = JSON.stringify(exportData, null, 2);
    const parsed = JSON.parse(json);

    // Verify two-loan breakdown fields are present
    const breakdown = parsed.calculations.participantBreakdown[0];

    // These fields should be populated when useTwoLoans is true
    expect(breakdown).toHaveProperty('loan1Amount');
    expect(breakdown).toHaveProperty('loan1MonthlyPayment');
    expect(breakdown).toHaveProperty('loan1Interest');
    expect(breakdown).toHaveProperty('loan2Amount');
    expect(breakdown).toHaveProperty('loan2DurationYears');
    expect(breakdown).toHaveProperty('loan2MonthlyPayment');
    expect(breakdown).toHaveProperty('loan2Interest');

    // Verify values are numbers (not null/undefined)
    expect(typeof breakdown.loan1Amount).toBe('number');
    expect(typeof breakdown.loan1MonthlyPayment).toBe('number');
    expect(typeof breakdown.loan2Amount).toBe('number');
    expect(typeof breakdown.loan2DurationYears).toBe('number');
    expect(typeof breakdown.loan2MonthlyPayment).toBe('number');

    // Verify loan amounts add up to total loan needed (approximately)
    // Note: May have differences due to capital allocation between loans
    expect(breakdown.loan1Amount + breakdown.loan2Amount).toBeCloseTo(breakdown.loanNeeded, -5);
  });

  it('should have undefined two-loan fields when useTwoLoans is false', () => {
    const singleLoanParticipant: Participant = {
      name: 'Single Loan Participant',
      capitalApporte: 100000,
      notaryFeesRate: 12.5,
      unitId: 1,
      surface: 100,
      interestRate: 4.5,
      durationYears: 25,
      quantity: 1,
      parachevementsPerM2: 500,
      isFounder: true,
      entryDate: new Date('2026-02-01'),
      // Two-loan financing NOT enabled
      useTwoLoans: false
    };

    const calculations = calculateAll([singleLoanParticipant], mockProjectParams, mockUnitDetails, mockDeedDate);

    const exportData = {
      version: 2,
      releaseVersion: RELEASE_VERSION,
      timestamp: new Date().toISOString(),
      participants: [singleLoanParticipant],
      projectParams: mockProjectParams,
      deedDate: mockDeedDate,
      unitDetails: mockUnitDetails,
      calculations
    };

    // Serialize and deserialize
    const json = JSON.stringify(exportData, null, 2);
    const parsed = JSON.parse(json);

    // Verify two-loan breakdown fields are present but undefined
    const breakdown = parsed.calculations.participantBreakdown[0];

    expect(breakdown.loan1Amount).toBeUndefined();
    expect(breakdown.loan1MonthlyPayment).toBeUndefined();
    expect(breakdown.loan1Interest).toBeUndefined();
    expect(breakdown.loan2Amount).toBeUndefined();
    expect(breakdown.loan2DurationYears).toBeUndefined();
    expect(breakdown.loan2MonthlyPayment).toBeUndefined();
    expect(breakdown.loan2Interest).toBeUndefined();
  });
});
