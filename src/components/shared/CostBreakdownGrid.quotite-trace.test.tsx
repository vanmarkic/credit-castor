/**
 * Trace test to verify where quotité display value comes from
 * Methodically traces each step of the calculation and display
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CostBreakdownGrid } from './CostBreakdownGrid';
import * as calculatorUtils from '../../utils/calculatorUtils';
import type { Participant, ParticipantCalculation, ProjectParams, PortageFormulaParams, UnitDetails } from '../../utils/calculatorUtils';

describe('CostBreakdownGrid - Quotité Display Trace', () => {
  // Mock the calculation function to trace calls
  const mockCalculateNewcomerPurchasePrice = vi.spyOn(calculatorUtils, 'calculateNewcomerPurchasePrice');

  const deedDate = '2026-02-01';
  
  const founders: Participant[] = [
    {
      name: 'Founder 1',
      surface: 140,
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
      surface: 225,
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
      surface: 200,
      isFounder: true,
      entryDate: new Date('2026-02-01T00:00:00.000Z'),
      unitId: 5,
      quantity: 1,
      registrationFeesRate: 12.5,
      interestRate: 4,
      durationYears: 25,
      capitalApporte: 200000,
    },
    {
      name: 'Founder 4',
      surface: 108,
      isFounder: true,
      entryDate: new Date('2026-02-01T00:00:00.000Z'),
      unitId: 6,
      quantity: 1,
      registrationFeesRate: 3,
      interestRate: 4,
      durationYears: 25,
      capitalApporte: 245000,
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
  };

  const allParticipants: Participant[] = [
    ...founders,
    nonFounder,
    // Add other non-founders
    {
      name: 'Participant·e 6',
      surface: 100,
      isFounder: false,
      entryDate: new Date('2027-02-01T00:00:00.000Z'),
      unitId: 8,
      quantity: 1,
      registrationFeesRate: 12.5,
      interestRate: 4.5,
      durationYears: 25,
      capitalApporte: 100000,
      purchaseDetails: { buyingFrom: 'Copropriété', lotId: 999, purchasePrice: 147332.3837512903 },
    },
    {
      name: 'Participant·e 7',
      surface: 100,
      isFounder: false,
      entryDate: new Date('2027-02-01T00:00:00.000Z'),
      unitId: 9,
      quantity: 1,
      registrationFeesRate: 12.5,
      interestRate: 4.5,
      durationYears: 25,
      capitalApporte: 100000,
      purchaseDetails: { buyingFrom: 'Copropriété', lotId: 999, purchasePrice: 147332.3837512903 },
    },
    {
      name: 'Participant·e 8',
      surface: 100,
      isFounder: false,
      entryDate: new Date('2027-02-01T00:00:00.000Z'),
      unitId: 10,
      quantity: 1,
      registrationFeesRate: 12.5,
      interestRate: 4.5,
      durationYears: 25,
      capitalApporte: 100000,
      purchaseDetails: { buyingFrom: 'Copropriété', lotId: 999, purchasePrice: 147332.3837512903 },
    },
    {
      name: 'Participant·e 9',
      surface: 100,
      isFounder: false,
      entryDate: new Date('2027-02-01T00:00:00.000Z'),
      unitId: 11,
      quantity: 1,
      registrationFeesRate: 12.5,
      interestRate: 4.5,
      durationYears: 25,
      capitalApporte: 100000,
      purchaseDetails: { buyingFrom: 'Copropriété', lotId: 999, purchasePrice: 147332.3837512903 },
    },
    {
      name: 'Participant·e 10',
      surface: 100,
      isFounder: false,
      entryDate: new Date('2027-02-02T00:00:00.000Z'), // Enters LATER
      unitId: 14,
      quantity: 1,
      registrationFeesRate: 12.5,
      interestRate: 4.5,
      durationYears: 25,
      capitalApporte: 100000,
      purchaseDetails: { buyingFrom: 'Copropriété', lotId: 999, purchasePrice: 147332.3837512903 },
    },
  ];

  const projectParams: ProjectParams = {
    totalPurchase: 650000,
    globalCascoPerM2: 1590,
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
    purchaseShare: 0,
    droitEnregistrements: 0,
    fraisNotaireFixe: 1000,
    casco: 168540,
    parachevements: 50000,
    personalRenovationCost: 218540,
    constructionCost: 245580,
    constructionCostPerUnit: 245580,
    travauxCommunsPerUnit: 27040,
    sharedCosts: 22283.678999999996,
    totalCost: 268863.679,
    loanNeeded: 228863.679,
    financingRatio: 85.12257209721511,
    monthlyPayment: 1208.0268118228314,
    totalRepayment: 362408.0435468494,
    totalInterest: 133544.3645468494,
  };

  beforeEach(() => {
    mockCalculateNewcomerPurchasePrice.mockClear();
  });

  it('should trace step-by-step where quotité value comes from', () => {
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

    // Step 1: Verify calculateNewcomerPurchasePrice was called
    expect(mockCalculateNewcomerPurchasePrice).toHaveBeenCalledTimes(1);

    // Step 2: Check what parameters were passed
    const callArgs = mockCalculateNewcomerPurchasePrice.mock.calls[0];
    console.log('Step 2 - Function called with:', {
      newcomerSurface: callArgs[0],
      allParticipantsCount: callArgs[1].length,
      totalProjectCost: callArgs[2],
      deedDate: callArgs[3],
      entryDate: callArgs[4],
    });

    // Step 3: Verify the filtered participants array
    const filteredParticipants = callArgs[1];
    const filteredTotal = filteredParticipants.reduce((sum: number, p: Participant) => sum + (p.surface || 0), 0);
    console.log('Step 3 - Filtered participants:', {
      count: filteredParticipants.length,
      totalSurface: filteredTotal,
      participants: filteredParticipants.map((p: Participant) => ({ name: p.name, surface: p.surface, entryDate: p.entryDate })),
    });

    // Expected: Should include founders + non-founders who entered on or before 2027-02-01
    // Founders: 140 + 225 + 200 + 108 = 673
    // Non-founders on 2027-02-01: 100 + 100 + 100 + 100 + 100 = 500
    // Total: 1173 (NOT 1273, because Participant·e 10 enters on 2027-02-02)
    expect(filteredTotal).toBe(1173);

    // Step 4: Check the return value
    const returnValue = mockCalculateNewcomerPurchasePrice.mock.results[0].value;
    console.log('Step 4 - Return value:', returnValue);
    
    if (returnValue) {
      console.log('Step 5 - Quotité from return value:', {
        quotite: returnValue.quotite,
        quotitePercent: (returnValue.quotite * 100).toFixed(1) + '%',
        quotiteFraction: Math.round(returnValue.quotite * 1000) + '/1000',
      });

      // Step 6: Verify quotité is NOT 0
      expect(returnValue.quotite).toBeGreaterThan(0);
      expect(returnValue.quotite).toBeCloseTo(100 / 1173, 5); // 0.0852...
    }

    // Step 7: Check what's displayed in the UI
    const calculationText = screen.getByTestId('newcomer-calculation-text');
    const textContent = calculationText.textContent || '';
    console.log('Step 7 - Displayed text:', textContent);

    // Step 8: Extract values from displayed text
    const quotiteMatch = textContent.match(/Quotité = (\d+)m² ÷ (\d+)m² total = ([\d.]+)% \((\d+)\/1000\)/);
    if (quotiteMatch) {
      const [, surface, total, percent, fraction] = quotiteMatch;
      console.log('Step 8 - Extracted from display:', {
        surface: surface + 'm²',
        total: total + 'm²',
        percent: percent + '%',
        fraction: fraction + '/1000',
      });

      // Step 9: Verify the mismatch
      console.log('Step 9 - MISMATCH DETECTED:');
      console.log('  - Calculation used:', filteredTotal, 'm² (filtered participants)');
      console.log('  - Display shows:', total, 'm² (all participants)');
      console.log('  - Quotité value:', percent + '% (' + fraction + '/1000)');
      console.log('  - This quotité is correct for', filteredTotal, 'm², not', total, 'm²');

      // The displayed total should match the calculation total
      // After fix: display now correctly shows filtered total
      expect(parseInt(total)).toBe(1173); // Now correctly shows filtered participants
      expect(filteredTotal).toBe(1173); // Calculation uses filtered
      expect(parseInt(total)).toBe(filteredTotal); // Display and calculation now match!
    }
  });

  it('should identify if newcomerPriceCalculation is undefined', () => {
    // Test scenario where calculation might fail
    mockCalculateNewcomerPurchasePrice.mockImplementation(() => {
      throw new Error('Test error');
    });

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

    // If calculation throws error, newcomerPriceCalculation should be undefined
    // and calculation details should not be shown
    const calculationDetails = screen.queryByTestId('newcomer-calculation-details');
    
    // With error, calculation details might not render
    // This would cause quotité to not be displayed
    console.log('If calculation throws error, calculationDetails exists:', !!calculationDetails);
  });
});

