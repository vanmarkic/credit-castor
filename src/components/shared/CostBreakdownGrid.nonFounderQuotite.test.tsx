/**
 * RTL test for CostBreakdownGrid - Non-Founder Quotité Display
 * 
 * Tests that quotité is displayed correctly (not 0) for non-founders
 * Uses actual data from the user to reproduce the issue
 */

import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { CostBreakdownGrid } from './CostBreakdownGrid';
import type { Participant, ParticipantCalculation, ProjectParams, PortageFormulaParams, UnitDetails } from '../../utils/calculatorUtils';

describe('CostBreakdownGrid - Non-Founder Quotité Display', () => {
  // Actual data from user
  const deedDate = '2026-02-01';
  
  const founders: Participant[] = [
    {
      name: 'Manuela/Dragan',
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
      name: 'Cathy/Jim',
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
      name: 'Annabelle/Colin',
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
      name: 'Julie/Séverin',
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
    enabled: true,
  };

  const allParticipants: Participant[] = [
    ...founders,
    nonFounder,
    // Add other non-founders that enter on the same date
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
      purchaseDetails: {
        buyingFrom: 'Copropriété',
        lotId: 999,
        purchasePrice: 147332.3837512903,
      },
      enabled: true,
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
      purchaseDetails: {
        buyingFrom: 'Copropriété',
        lotId: 999,
        purchasePrice: 147332.3837512903,
      },
      enabled: true,
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
      purchaseDetails: {
        buyingFrom: 'Copropriété',
        lotId: 999,
        purchasePrice: 147332.3837512903,
      },
      enabled: true,
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
      purchaseDetails: {
        buyingFrom: 'Copropriété',
        lotId: 999,
        purchasePrice: 147332.3837512903,
      },
      enabled: true,
    },
    {
      name: 'Participant·e 10',
      surface: 100,
      isFounder: false,
      entryDate: new Date('2027-02-02T00:00:00.000Z'),
      unitId: 14,
      quantity: 1,
      registrationFeesRate: 12.5,
      interestRate: 4.5,
      durationYears: 25,
      capitalApporte: 100000,
      purchaseDetails: {
        buyingFrom: 'Copropriété',
        lotId: 999,
        purchasePrice: 147332.3837512903,
      },
      enabled: true,
    },
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
    travauxCommuns: {
      enabled: true,
      items: [
        {
          label: 'Rénovation complète',
          sqm: 338,
          amount: 270000,
          cascoPricePerSqm: 600,
          parachevementPricePerSqm: 200,
        },
      ],
    },
  };

  const formulaParams: PortageFormulaParams = {
    indexationRate: 2,
    carryingCostRecovery: 100,
    coproReservesShare: 0,
    averageInterestRate: 4.5,
  };

  const unitDetails: UnitDetails = {
    1: { casco: 178080, parachevements: 56000 },
    3: { casco: 213060, parachevements: 67000 },
    5: { casco: 187620, parachevements: 59000 },
    6: { casco: 171720, parachevements: 54000 },
  };

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
    purchaseShare: 0, // This is 0 in the calculations, but quotité should still be calculated
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

  it('should display quotité calculation for non-founder buying from Copropriété', () => {
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

    // Find the purchase share card
    const purchaseShareCard = screen.getByTestId('purchase-share-card');
    expect(purchaseShareCard).toBeInTheDocument();

    // Check that "Part d'achat" label is visible
    expect(within(purchaseShareCard).getByText("Part d'achat")).toBeInTheDocument();

    // Check for newcomer calculation details
    const calculationDetails = within(purchaseShareCard).queryByTestId('newcomer-calculation-details');
    expect(calculationDetails).toBeInTheDocument();

    // Check that quotité calculation text is displayed
    const calculationText = within(calculationDetails!).queryByTestId('newcomer-calculation-text');
    expect(calculationText).toBeInTheDocument();

    // CRITICAL: Check that quotité is NOT 0/1000
    const textContent = calculationText?.textContent || '';
    console.log('Calculation text:', textContent);
    
    // Should contain quotité calculation
    expect(textContent).toMatch(/Quotité/i);
    
    // Should NOT show 0/1000 or 0.0%
    expect(textContent).not.toMatch(/0\/1000|0\.0%/);
    
    // Should show a non-zero quotité (expected: 85/1000 or 8.5%)
    // When Participant·e 5 enters: 100 / (140 + 225 + 200 + 108 + 100 + 100 + 100 + 100 + 100) = 100 / 1173 = 0.0852 = 85/1000
    expect(textContent).toMatch(/\d+\/1000/); // Should have some fraction/1000
    expect(textContent).toMatch(/\d+\.\d+%/); // Should have some percentage
  });

  it('should display correct quotité percentage in calculation text', () => {
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

    const calculationText = screen.getByTestId('newcomer-calculation-text');
    const textContent = calculationText.textContent || '';

    // Expected quotité: 100 / 1173 = 0.0852 = 8.5% = 85/1000
    // Check that it shows approximately 8.5% (allowing for rounding)
    const percentageMatch = textContent.match(/(\d+\.\d+)%/);
    if (percentageMatch) {
      const percentage = parseFloat(percentageMatch[1]);
      console.log('Found percentage:', percentage);
      // Should be around 8.5% (allowing 7-10% range for rounding)
      expect(percentage).toBeGreaterThan(7);
      expect(percentage).toBeLessThan(10);
    }

    // Check fraction format (e.g., "85/1000")
    const fractionMatch = textContent.match(/(\d+)\/1000/);
    if (fractionMatch) {
      const numerator = parseInt(fractionMatch[1]);
      console.log('Found fraction:', numerator + '/1000');
      // Should be around 85 (allowing 80-90 range for rounding)
      expect(numerator).toBeGreaterThan(75);
      expect(numerator).toBeLessThan(95);
    }
  });

  it('should display purchase share amount (may be 0€ but quotité should not be 0)', () => {
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

    // Purchase share amount might be 0€ (from calculations)
    const purchaseShareAmount = screen.getByTestId('purchase-share-amount');
    const amountText = purchaseShareAmount.textContent || '';
    
    // Amount can be 0€, but quotité calculation should still be shown
    expect(amountText).toBeTruthy();

    // Check that calculation details are still displayed even if amount is 0€
    const calculationDetails = screen.queryByTestId('newcomer-calculation-details');
    expect(calculationDetails).toBeInTheDocument();
    
    // Quotité should NOT be 0
    const calculationText = within(calculationDetails!).queryByTestId('newcomer-calculation-text');
    if (calculationText) {
      const textContent = calculationText.textContent || '';
      expect(textContent).not.toMatch(/0\/1000|0\.0%/);
    }
  });
});

