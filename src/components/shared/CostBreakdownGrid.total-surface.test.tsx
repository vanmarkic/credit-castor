/**
 * TDD Test for CostBreakdownGrid - Total Surface Calculation Bug
 * 
 * Tests that existingParticipantsTotal is correctly calculated when filtering participants
 * by entry date. This reproduces the bug where total surface is 0.
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CostBreakdownGrid } from './CostBreakdownGrid';
import type { Participant, ParticipantCalculation, ProjectParams, PortageFormulaParams, UnitDetails } from '../../utils/calculatorUtils';

describe('CostBreakdownGrid - Total Surface Calculation', () => {
  const deedDate = '2026-02-01';
  
  const founders: Participant[] = [
    {
      name: 'Founder 1',
      surface: 500,
      isFounder: true,
      entryDate: new Date('2026-02-01T00:00:00.000Z'),
      unitId: 1,
      quantity: 1,
      registrationFeesRate: 3,
      interestRate: 4,
      durationYears: 25,
      capitalApporte: 150000,
    },
    {
      name: 'Founder 2',
      surface: 400,
      isFounder: true,
      entryDate: new Date('2026-02-01T00:00:00.000Z'),
      unitId: 3,
      quantity: 1,
      registrationFeesRate: 3,
      interestRate: 4.5,
      durationYears: 25,
      capitalApporte: 450000,
    },
    {
      name: 'Founder 3',
      surface: 373,
      isFounder: true,
      entryDate: new Date('2026-02-01T00:00:00.000Z'),
      unitId: 5,
      quantity: 1,
      registrationFeesRate: 12.5,
      interestRate: 4,
      durationYears: 25,
      capitalApporte: 200000,
    },
  ];

  const nonFounder: Participant = {
    name: 'Participant·e 5',
    surface: 100,
    isFounder: false,
    entryDate: new Date('2027-02-01T00:00:00.000Z'),
    unitId: 7,
    quantity: 1,
    registrationFeesRate: 12.5,
    interestRate: 4,
    durationYears: 25,
    capitalApporte: 40000,
    purchaseDetails: {
      buyingFrom: 'Copropriété',
      lotId: 999,
      purchasePrice: 147332.3837512903,
    },
    enabled: true,
  };

  const allParticipants: Participant[] = [
    ...founders,
    nonFounder,
  ];

  const projectParams: ProjectParams = {
    totalPurchase: 650000,
    globalCascoPerM2: 1590,
    cascoTvaRate: 6,
    mesuresConservatoires: 0,
    demolition: 0,
    infrastructures: 0,
    etudesPreparatoires: 0,
    fraisEtudesPreparatoires: 0,
    fraisGeneraux3ans: 0,
    batimentFondationConservatoire: 0,
    batimentFondationComplete: 0,
    batimentCoproConservatoire: 0,
  };

  const formulaParams: PortageFormulaParams = {
    indexationRate: 2,
    carryingCostRecovery: 100,
    coproReservesShare: 0,
    averageInterestRate: 4.5,
  };

  const unitDetails: UnitDetails = {};

  const participantCalc: ParticipantCalculation = {
    name: 'Participant·e 5',
    unitId: 7,
    surface: 100,
    quantity: 1,
    capitalApporte: 40000,
    registrationFeesRate: 12.5,
    interestRate: 4,
    durationYears: 25,
    pricePerM2: 510.6048703849175,
    purchaseShare: 147332.3837512903,
    droitEnregistrements: 18416.54796891129,
    fraisNotaireFixe: 1000,
    casco: 168540,
    parachevements: 50000,
    personalRenovationCost: 218540,
    constructionCost: 245580,
    constructionCostPerUnit: 245580,
    travauxCommunsPerUnit: 27040,
    sharedCosts: 22283.678999999996,
    totalCost: 0,
    loanNeeded: 0,
    financingRatio: 0,
    monthlyPayment: 0,
    totalRepayment: 0,
    totalInterest: 0,
  };

  it('should calculate total surface correctly for newcomer with founders', () => {
    render(
      <CostBreakdownGrid
        participant={nonFounder}
        participantCalc={participantCalc}
        projectParams={projectParams}
        allParticipants={allParticipants}
        unitDetails={unitDetails}
        deedDate={deedDate}
        formulaParams={formulaParams}
      />
    );

    // Should NOT show an error about total surface being 0
    const errorElement = screen.queryByTestId('newcomer-calculation-error');
    expect(errorElement).toBeNull();

    // Should show the calculation with correct total surface
    const calculationText = screen.getByTestId('newcomer-calculation-text');
    const calculationContent = calculationText.textContent || '';
    
    // Total surface should be 1273m² (500 + 400 + 373) or 1373m² (including the newcomer)
    // The calculation includes the newcomer in the total, so it should be 1373m²
    expect(calculationContent).toContain('1373m² total');
  });

  it('should handle founders without explicit entryDate', () => {
    const foundersWithoutEntryDate: Participant[] = [
      {
        name: 'Founder 1',
        surface: 500,
        isFounder: true,
        // No entryDate - should use deedDate
        unitId: 1,
        quantity: 1,
        registrationFeesRate: 3,
        interestRate: 4,
        durationYears: 25,
        capitalApporte: 150000,
      },
      {
        name: 'Founder 2',
        surface: 400,
        isFounder: true,
        // No entryDate - should use deedDate
        unitId: 3,
        quantity: 1,
        registrationFeesRate: 3,
        interestRate: 4.5,
        durationYears: 25,
        capitalApporte: 450000,
      },
    ];

    const allParticipantsNoEntryDate: Participant[] = [
      ...foundersWithoutEntryDate,
      nonFounder,
    ];

    render(
      <CostBreakdownGrid
        participant={nonFounder}
        participantCalc={participantCalc}
        projectParams={projectParams}
        allParticipants={allParticipantsNoEntryDate}
        unitDetails={unitDetails}
        deedDate={deedDate}
        formulaParams={formulaParams}
      />
    );

    // Should NOT show an error about total surface being 0
    const errorElement = screen.queryByTestId('newcomer-calculation-error');
    expect(errorElement).toBeNull();

    // Should show the calculation with correct total surface (900m² from founders + 100m² from newcomer = 1000m²)
    const calculationText = screen.getByTestId('newcomer-calculation-text');
    const calculationContent = calculationText.textContent || '';
    
    expect(calculationContent).toContain('1000m² total');
  });

  it('should handle string entryDate for founders', () => {
    const foundersWithStringDate: Participant[] = [
      {
        name: 'Founder 1',
        surface: 500,
        isFounder: true,
        entryDate: '2026-02-01' as any, // String date
        unitId: 1,
        quantity: 1,
        registrationFeesRate: 3,
        interestRate: 4,
        durationYears: 25,
        capitalApporte: 150000,
      },
    ];

    const allParticipantsStringDate: Participant[] = [
      ...foundersWithStringDate,
      nonFounder,
    ];

    render(
      <CostBreakdownGrid
        participant={nonFounder}
        participantCalc={participantCalc}
        projectParams={projectParams}
        allParticipants={allParticipantsStringDate}
        unitDetails={unitDetails}
        deedDate={deedDate}
        formulaParams={formulaParams}
      />
    );

    // Should NOT show an error about total surface being 0
    const errorElement = screen.queryByTestId('newcomer-calculation-error');
    expect(errorElement).toBeNull();
  });

  it('should handle newcomer entryDate as string', () => {
    const nonFounderWithStringDate: Participant = {
      ...nonFounder,
      entryDate: '2027-02-01' as any, // String date instead of Date object
    };

    const allParticipantsStringEntryDate: Participant[] = [
      ...founders,
      nonFounderWithStringDate,
    ];

    render(
      <CostBreakdownGrid
        participant={nonFounderWithStringDate}
        participantCalc={participantCalc}
        projectParams={projectParams}
        allParticipants={allParticipantsStringEntryDate}
        unitDetails={unitDetails}
        deedDate={deedDate}
        formulaParams={formulaParams}
      />
    );

    // Should NOT show an error about total surface being 0
    const errorElement = screen.queryByTestId('newcomer-calculation-error');
    expect(errorElement).toBeNull();
  });

  it('should show error when no participants match the filter', () => {
    // Create a scenario where no participants have valid entry dates
    const invalidParticipants: Participant[] = [
      {
        name: 'Invalid Participant',
        surface: 500,
        isFounder: false, // Not a founder
        // No entryDate
        unitId: 1,
        quantity: 1,
        registrationFeesRate: 3,
        interestRate: 4,
        durationYears: 25,
        capitalApporte: 150000,
      },
    ];

    const invalidNewcomer: Participant = {
      ...nonFounder,
      entryDate: new Date('2027-02-01T00:00:00.000Z'),
    };

    render(
      <CostBreakdownGrid
        participant={invalidNewcomer}
        participantCalc={participantCalc}
        projectParams={projectParams}
        allParticipants={invalidParticipants}
        unitDetails={unitDetails}
        deedDate={deedDate}
        formulaParams={formulaParams}
      />
    );

    // Should show an error about total surface being 0
    const errorElement = screen.getByTestId('newcomer-calculation-error');
    expect(errorElement).toBeTruthy();
    expect(errorElement.textContent).toContain('surface totale est 0m²');
  });

  it('should handle date comparison edge cases that cause total surface to be 0', () => {
    // Test case: entryDate as string vs Date comparison
    const foundersWithMixedDates: Participant[] = [
      {
        name: 'Founder 1',
        surface: 500,
        isFounder: true,
        entryDate: '2026-02-01' as any, // String date
        unitId: 1,
        quantity: 1,
        registrationFeesRate: 3,
        interestRate: 4,
        durationYears: 25,
        capitalApporte: 150000,
      },
    ];

    const newcomerWithStringDate: Participant = {
      ...nonFounder,
      entryDate: '2027-02-01' as any, // String date
    };

    render(
      <CostBreakdownGrid
        participant={newcomerWithStringDate}
        participantCalc={participantCalc}
        projectParams={projectParams}
        allParticipants={[...foundersWithMixedDates, newcomerWithStringDate]}
        unitDetails={unitDetails}
        deedDate={deedDate}
        formulaParams={formulaParams}
      />
    );

    // Should NOT show an error - dates should be compared correctly
    const errorElement = screen.queryByTestId('newcomer-calculation-error');
    expect(errorElement).toBeNull();
  });

  it('should debug: reproduce the actual bug scenario', () => {
    // Reproduce the exact scenario from the user's data
    // The issue is likely that date comparison is failing
    const buggyFounders: Participant[] = [
      {
        name: 'Founder 1',
        surface: 500,
        isFounder: true,
        entryDate: new Date('2026-02-01T00:00:00.000Z'),
        unitId: 1,
        quantity: 1,
        registrationFeesRate: 3,
        interestRate: 4,
        durationYears: 25,
        capitalApporte: 150000,
      },
      {
        name: 'Founder 2',
        surface: 400,
        isFounder: true,
        entryDate: new Date('2026-02-01T00:00:00.000Z'),
        unitId: 3,
        quantity: 1,
        registrationFeesRate: 3,
        interestRate: 4.5,
        durationYears: 25,
        capitalApporte: 450000,
      },
      {
        name: 'Founder 3',
        surface: 373,
        isFounder: true,
        entryDate: new Date('2026-02-01T00:00:00.000Z'),
        unitId: 5,
        quantity: 1,
        registrationFeesRate: 12.5,
        interestRate: 4,
        durationYears: 25,
        capitalApporte: 200000,
      },
    ];

    const buggyNewcomer: Participant = {
      name: 'Participant·e 5',
      surface: 100,
      isFounder: false,
      entryDate: new Date('2027-02-01T00:00:00.000Z'),
      unitId: 7,
      quantity: 1,
      registrationFeesRate: 12.5,
      interestRate: 4,
      durationYears: 25,
      capitalApporte: 40000,
      purchaseDetails: {
        buyingFrom: 'Copropriété',
        lotId: 999,
        purchasePrice: 147332.3837512903,
      },
      enabled: true,
    };

    const allBuggyParticipants = [...buggyFounders, buggyNewcomer];

    // Debug: Log what's happening in the filter
    const existingParticipants = allBuggyParticipants.filter(existing => {
      const existingEntryDate = existing.entryDate || (existing.isFounder ? new Date(deedDate) : null);
      if (!existingEntryDate) {
        console.log(`Filtered out ${existing.name}: no entryDate`);
        return false;
      }
      
      const buyerEntryDate = buggyNewcomer.entryDate 
        ? (buggyNewcomer.entryDate instanceof Date ? buggyNewcomer.entryDate : new Date(buggyNewcomer.entryDate))
        : new Date(deedDate);
      
      const isBeforeOrEqual = existingEntryDate <= buyerEntryDate;
      console.log(`${existing.name}: existingEntryDate=${existingEntryDate}, buyerEntryDate=${buyerEntryDate}, isBeforeOrEqual=${isBeforeOrEqual}`);
      return isBeforeOrEqual;
    });

    const totalSurface = existingParticipants.reduce((sum, p) => sum + (p.surface || 0), 0);
    console.log(`Total surface: ${totalSurface}, Participants: ${existingParticipants.length}`);

    render(
      <CostBreakdownGrid
        participant={buggyNewcomer}
        participantCalc={participantCalc}
        projectParams={projectParams}
        allParticipants={allBuggyParticipants}
        unitDetails={unitDetails}
        deedDate={deedDate}
        formulaParams={formulaParams}
      />
    );

    // Should NOT show an error - this should work
    const errorElement = screen.queryByTestId('newcomer-calculation-error');
    if (errorElement) {
      console.error('Error found:', errorElement.textContent);
    }
    expect(errorElement).toBeNull();
    expect(totalSurface).toBeGreaterThan(0);
  });
});

