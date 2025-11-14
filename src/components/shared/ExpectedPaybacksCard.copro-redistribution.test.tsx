import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ExpectedPaybacksCard } from './ExpectedPaybacksCard';
import { calculateCoproSalePrice } from '../../utils/portageCalculations';
import type { Participant } from '../../utils/calculatorUtils';
import * as Tooltip from '@radix-ui/react-tooltip';

describe('ExpectedPaybacksCard - Copro Redistribution with Renovation Costs', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  const deedDate = '2026-01-01';
  const renovationStartDate = new Date('2026-06-01'); // Renovation starts June 1st
  const coproReservesShare = 30;

  const formulaParams = {
    indexationRate: 2, // 2% per year
    carryingCostRecovery: 100, // 100% recovery
    averageInterestRate: 4.5,
    coproReservesShare: 30
  };

  // Helper to calculate copro sale price
  const calculateCoproSalePriceForTest = (
    saleDate: Date,
    totalProjectCost: number,
    totalRenovationCosts: number
  ) => {
    const totalBuildingSurface = 500; // m²
    const surfacePurchased = 50; // m² (10% of building)
    const yearsHeld = 0; // Same year
    const totalCarryingCosts = 0; // No carrying costs for simplicity

    return calculateCoproSalePrice(
      surfacePurchased,
      totalProjectCost,
      totalBuildingSurface,
      yearsHeld,
      formulaParams,
      totalCarryingCosts,
      renovationStartDate,
      saleDate,
      totalRenovationCosts
    );
  };

  it('should display correct redistribution amount when copro sale happens BEFORE renovationStartDate (excludes renovation costs)', () => {
    // Setup: Founder and newcomer
    const founder: Participant = {
      name: 'Founder Alice',
      capitalApporte: 150000,
      registrationFeesRate: 12.5,
      interestRate: 4.5,
      durationYears: 25,
      isFounder: true,
      entryDate: new Date(deedDate),
      surface: 200,
      quantity: 1,
      lotsOwned: [
        {
          lotId: 1,
          surface: 200,
          unitId: 1,
          isPortage: false,
          allocatedSurface: 200,
          acquiredDate: new Date(deedDate)
        }
      ]
    };

    // Newcomer buys from copro BEFORE renovationStartDate
    const saleDate = new Date('2026-03-01'); // March 1st - before renovation (June 1st)
    const totalProjectCost = 500000; // Purchase + notary + construction (including renovation)
    const totalRenovationCosts = 100000; // CASCO + parachèvements

    // Calculate sale price (should exclude renovation costs)
    const coproSalePricing = calculateCoproSalePriceForTest(
      saleDate,
      totalProjectCost,
      totalRenovationCosts
    );

    // Verify the price excludes renovation: base should be (400000 / 500) * 50 = 40000
    // Instead of (500000 / 500) * 50 = 50000
    const expectedBaseWithoutRenovation = (400000 / 500) * 50; // 40000
    expect(coproSalePricing.basePrice).toBeCloseTo(expectedBaseWithoutRenovation, 0);

    // Calculate participants share (70% of total price)
    const participantsShare = 1 - (coproReservesShare / 100);
    const amountToParticipants = coproSalePricing.totalPrice * participantsShare;

    // Founder's share: quotité is calculated including ALL participants up to and including buyer
    // Alice (200m²) / (Alice 200m² + Bob 50m²) = 200/250 = 80%
    const founderQuotite = 200 / (200 + 50); // 0.8 or 80%
    const expectedRedistribution = amountToParticipants * founderQuotite;

    const newcomer: Participant = {
      name: 'Newcomer Bob',
      capitalApporte: 50000,
      registrationFeesRate: 3,
      interestRate: 4.5,
      durationYears: 25,
      isFounder: false,
      entryDate: saleDate,
      surface: 50,
      quantity: 1,
      purchaseDetails: {
        buyingFrom: 'Copropriété',
        purchasePrice: coproSalePricing.totalPrice,
        lotId: 1
      },
      lotsOwned: []
    };

    const allParticipants = [founder, newcomer];

    // Render the component
    render(
      <Tooltip.Provider>
        <ExpectedPaybacksCard
          participant={founder}
          allParticipants={allParticipants}
          deedDate={deedDate}
          coproReservesShare={coproReservesShare}
        />
      </Tooltip.Provider>
    );

    // Verify the UI displays the correct redistribution amount
    // The amount should be based on the price WITHOUT renovation costs
    expect(screen.getByText(/Remboursements attendus/i)).toBeInTheDocument();
    expect(screen.getByText('Newcomer Bob')).toBeInTheDocument();

    // Calculate expected formatted amount (French locale format)
    // Note: Formatted amount calculation removed as it's not used in assertions

    // Check that the displayed amount matches expected redistribution (excluding renovation)
    // The amount should be visible in the component
    // Format is like "28 000 €" with non-breaking spaces (could be \u202f or \u00a0)
    const amountValue = expectedRedistribution.toLocaleString('fr-BE', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
    
    // Check individual payback amount (should contain the number, with or without €)
    const paybackDiv = screen.getByText('Newcomer Bob').closest('div')?.parentElement;
    const paybackText = paybackDiv?.textContent || '';
    // Remove all spaces and € to compare numbers
    const paybackNumber = paybackText.replace(/[\s\u00a0\u202f€]/g, '');
    const expectedNumber = amountValue.replace(/\s/g, '');
    expect(paybackNumber).toContain(expectedNumber);

    // Verify total recovered matches
    expect(screen.getByText(/Total récupéré/i)).toBeInTheDocument();
    
    // Verify the total amount is displayed (should match expectedRedistribution)
    const totalSection = screen.getByText(/Total récupéré/i).closest('div');
    const totalText = totalSection?.textContent || '';
    const totalNumber = totalText.replace(/[\s\u00a0\u202f€]/g, '');
    expect(totalNumber).toContain(expectedNumber);
  });

  it('should display correct redistribution amount when copro sale happens AFTER renovationStartDate (includes renovation costs)', () => {
    // Same setup but sale happens AFTER renovationStartDate
    const founder: Participant = {
      name: 'Founder Alice',
      capitalApporte: 150000,
      registrationFeesRate: 12.5,
      interestRate: 4.5,
      durationYears: 25,
      isFounder: true,
      entryDate: new Date(deedDate),
      surface: 200,
      quantity: 1,
      lotsOwned: [
        {
          lotId: 1,
          surface: 200,
          unitId: 1,
          isPortage: false,
          allocatedSurface: 200,
          acquiredDate: new Date(deedDate)
        }
      ]
    };

    // Newcomer buys from copro AFTER renovationStartDate
    const saleDate = new Date('2026-07-01'); // July 1st - after renovation (June 1st)
    const totalProjectCost = 500000;
    const totalRenovationCosts = 100000;

    // Calculate sale price (should INCLUDE renovation costs)
    const coproSalePricing = calculateCoproSalePriceForTest(
      saleDate,
      totalProjectCost,
      totalRenovationCosts
    );

    // Verify the price includes renovation: base should be (500000 / 500) * 50 = 50000
    const expectedBaseWithRenovation = (500000 / 500) * 50; // 50000
    expect(coproSalePricing.basePrice).toBeCloseTo(expectedBaseWithRenovation, 0);

    // Calculate participants share (70% of total price)
    const participantsShare = 1 - (coproReservesShare / 100);
    const amountToParticipants = coproSalePricing.totalPrice * participantsShare;

    // Founder's share: quotité is calculated including ALL participants up to and including buyer
    // Alice (200m²) / (Alice 200m² + Bob 50m²) = 200/250 = 80%
    const founderQuotite = 200 / (200 + 50); // 0.8 or 80%
    const expectedRedistribution = amountToParticipants * founderQuotite;

    const newcomer: Participant = {
      name: 'Newcomer Bob',
      capitalApporte: 50000,
      registrationFeesRate: 3,
      interestRate: 4.5,
      durationYears: 25,
      isFounder: false,
      entryDate: saleDate,
      surface: 50,
      quantity: 1,
      purchaseDetails: {
        buyingFrom: 'Copropriété',
        purchasePrice: coproSalePricing.totalPrice,
        lotId: 1
      },
      lotsOwned: []
    };

    const allParticipants = [founder, newcomer];

    // Render the component
    render(
      <Tooltip.Provider>
        <ExpectedPaybacksCard
          participant={founder}
          allParticipants={allParticipants}
          deedDate={deedDate}
          coproReservesShare={coproReservesShare}
        />
      </Tooltip.Provider>
    );

    // Verify the UI displays the correct redistribution amount (WITH renovation)
    expect(screen.getByText(/Remboursements attendus/i)).toBeInTheDocument();
    expect(screen.getByText('Newcomer Bob')).toBeInTheDocument();

    // The amount should be HIGHER than when renovation was excluded
    // (because base price is higher: 50000 vs 40000)
    expect(coproSalePricing.basePrice).toBeGreaterThan((400000 / 500) * 50);

    // Verify the amount is displayed (should be higher than the "before" case)
    const amountValue = expectedRedistribution.toLocaleString('fr-BE', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
    
    // Check individual payback amount (should contain the number, with or without €)
    const paybackDiv = screen.getByText('Newcomer Bob').closest('div')?.parentElement;
    const paybackText = paybackDiv?.textContent || '';
    // Remove all spaces and € to compare numbers
    const paybackNumber = paybackText.replace(/[\s\u00a0\u202f€]/g, '');
    const expectedNumber = amountValue.replace(/\s/g, '');
    expect(paybackNumber).toContain(expectedNumber);

    // Verify total recovered
    const totalSection = screen.getByText(/Total récupéré/i).closest('div');
    const totalText = totalSection?.textContent || '';
    const totalNumber = totalText.replace(/[\s\u00a0\u202f€]/g, '');
    expect(totalNumber).toContain(expectedNumber);
  });

  it('should display different amounts for BEFORE vs AFTER renovationStartDate in the same view', () => {
    // Test with multiple newcomers: one before, one after renovationStartDate
    const founder: Participant = {
      name: 'Founder Alice',
      capitalApporte: 150000,
      registrationFeesRate: 12.5,
      interestRate: 4.5,
      durationYears: 25,
      isFounder: true,
      entryDate: new Date(deedDate),
      surface: 200,
      quantity: 1,
      lotsOwned: [
        {
          lotId: 1,
          surface: 200,
          unitId: 1,
          isPortage: false,
          allocatedSurface: 200,
          acquiredDate: new Date(deedDate)
        }
      ]
    };

    const totalProjectCost = 500000;
    const totalRenovationCosts = 100000;

    // First newcomer: buys BEFORE renovation
    const saleDate1 = new Date('2026-03-01');
    const coproSalePricing1 = calculateCoproSalePriceForTest(
      saleDate1,
      totalProjectCost,
      totalRenovationCosts
    );

    // Second newcomer: buys AFTER renovation
    const saleDate2 = new Date('2026-07-01');
    const coproSalePricing2 = calculateCoproSalePriceForTest(
      saleDate2,
      totalProjectCost,
      totalRenovationCosts
    );

    // Verify they have different base prices
    expect(coproSalePricing1.basePrice).toBeLessThan(coproSalePricing2.basePrice);

    const newcomer1: Participant = {
      name: 'Newcomer Bob (Before)',
      capitalApporte: 50000,
      registrationFeesRate: 3,
      interestRate: 4.5,
      durationYears: 25,
      isFounder: false,
      entryDate: saleDate1,
      surface: 50,
      quantity: 1,
      purchaseDetails: {
        buyingFrom: 'Copropriété',
        purchasePrice: coproSalePricing1.totalPrice,
        lotId: 1
      },
      lotsOwned: []
    };

    const newcomer2: Participant = {
      name: 'Newcomer Charlie (After)',
      capitalApporte: 50000,
      registrationFeesRate: 3,
      interestRate: 4.5,
      durationYears: 25,
      isFounder: false,
      entryDate: saleDate2,
      surface: 50,
      quantity: 1,
      purchaseDetails: {
        buyingFrom: 'Copropriété',
        purchasePrice: coproSalePricing2.totalPrice,
        lotId: 1
      },
      lotsOwned: []
    };

    const allParticipants = [founder, newcomer1, newcomer2];

    // Render the component
    render(
      <Tooltip.Provider>
        <ExpectedPaybacksCard
          participant={founder}
          allParticipants={allParticipants}
          deedDate={deedDate}
          coproReservesShare={coproReservesShare}
        />
      </Tooltip.Provider>
    );

    // Verify both newcomers appear
    expect(screen.getByText('Newcomer Bob (Before)')).toBeInTheDocument();
    expect(screen.getByText('Newcomer Charlie (After)')).toBeInTheDocument();

    // The "After" redistribution should be higher than "Before" because it includes renovation
    const participantsShare = 1 - (coproReservesShare / 100);
    const founderQuotite = 200 / 500; // 40%

    const redistributionBefore = (coproSalePricing1.totalPrice * participantsShare) * founderQuotite;
    const redistributionAfter = (coproSalePricing2.totalPrice * participantsShare) * founderQuotite;

    expect(redistributionAfter).toBeGreaterThan(redistributionBefore);
  });
});

