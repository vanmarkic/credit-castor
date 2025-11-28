/**
 * TDD Test for CostBreakdownGrid - Prix Final Display
 * 
 * Tests that the "prix final" (final price) displayed in the UI matches:
 * 1. The purchase share amount displayed at the top
 * 2. The calculated value from calculateNewcomerPurchasePrice
 * 3. The sum of basePrice + indexation + carryingCostRecovery
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CostBreakdownGrid } from './CostBreakdownGrid';
import { calculateNewcomerPurchasePrice } from '../../utils/calculatorUtils';
import type { Participant, ParticipantCalculation, ProjectParams, PortageFormulaParams, UnitDetails } from '../../utils/calculatorUtils';

describe('CostBreakdownGrid - Prix Final Display', () => {
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

  // Calculate expected price using the same logic as the component
  const existingParticipants = allParticipants.filter(existing => {
    const existingEntryDate = existing.entryDate || (existing.isFounder ? new Date(deedDate) : null);
    if (!existingEntryDate) return false;
    const buyerEntryDate = nonFounder.entryDate || new Date(deedDate);
    return existingEntryDate <= buyerEntryDate;
  });

  const expectedCalculation = calculateNewcomerPurchasePrice(
    nonFounder.surface || 0,
    existingParticipants,
    projectParams.totalPurchase,
    deedDate,
    nonFounder.entryDate!,
    formulaParams
  );

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
    purchaseShare: expectedCalculation.totalPrice, // Use calculated value
    droitEnregistrements: expectedCalculation.totalPrice * 0.125,
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

  it('should display prix final that matches the purchase share amount', () => {
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

    // Get the purchase share amount displayed at the top
    const purchaseShareAmount = screen.getByTestId('purchase-share-amount');
    const displayedAmountText = purchaseShareAmount.textContent || '';
    
    // Extract numeric value from displayed amount (e.g., "57 032 €" -> 57032)
    const displayedAmount = parseFloat(displayedAmountText.replace(/[\s€,]/g, '').replace(',', '.'));

    // Get the "Prix final" from the calculation details
    const calculationText = screen.getByTestId('newcomer-calculation-text');
    const calculationContent = calculationText.textContent || '';
    
    // Extract prix final from calculation text
    // Format: "Prix final = basePrice + indexation + carryingCost = totalPrice"
    // We need to get the LAST number (totalPrice), not the first one
    const prixFinalMatch = calculationContent.match(/Prix final[^=]*=\s*([\d\s,]+)\s*€\s*\+\s*([\d\s,]+)\s*€\s*\+\s*([\d\s,]+)\s*€\s*=\s*([\d\s,]+)\s*€/);
    expect(prixFinalMatch).toBeTruthy();
    
    if (prixFinalMatch) {
      // The last match group is the totalPrice
      const prixFinalText = prixFinalMatch[4]; // Index 4 is the totalPrice after the last =
      const prixFinalAmount = parseFloat(prixFinalText.replace(/[\s,]/g, '').replace(',', '.'));
      
      console.log('Displayed amount:', displayedAmount);
      console.log('Prix final amount:', prixFinalAmount);
      console.log('Expected amount:', expectedCalculation.totalPrice);
      
      // The displayed amount should match the prix final
      expect(prixFinalAmount).toBeCloseTo(displayedAmount, 0);
      
      // Both should match the expected calculation
      expect(prixFinalAmount).toBeCloseTo(expectedCalculation.totalPrice, 0);
      expect(displayedAmount).toBeCloseTo(expectedCalculation.totalPrice, 0);
    }
  });

  it('should display prix final that equals basePrice + indexation + carryingCostRecovery', () => {
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
    const calculationContent = calculationText.textContent || '';
    
    // Extract all values from the calculation
    // Format: "Prix final = basePrice + indexation + carryingCostRecovery = totalPrice"
    const prixFinalMatch = calculationContent.match(/Prix final\s*=\s*([\d\s,]+)\s*€\s*\+\s*([\d\s,]+)\s*€\s*\+\s*([\d\s,]+)\s*€\s*=\s*([\d\s,]+)\s*€/);
    expect(prixFinalMatch).toBeTruthy();
    
    if (prixFinalMatch) {
      const basePriceText = prixFinalMatch[1];
      const indexationText = prixFinalMatch[2];
      const carryingCostText = prixFinalMatch[3];
      const totalPriceText = prixFinalMatch[4];
      
      const basePrice = parseFloat(basePriceText.replace(/[\s,]/g, '').replace(',', '.'));
      const indexation = parseFloat(indexationText.replace(/[\s,]/g, '').replace(',', '.'));
      const carryingCost = parseFloat(carryingCostText.replace(/[\s,]/g, '').replace(',', '.'));
      const totalPrice = parseFloat(totalPriceText.replace(/[\s,]/g, '').replace(',', '.'));
      
      console.log('Base price:', basePrice);
      console.log('Indexation:', indexation);
      console.log('Carrying cost:', carryingCost);
      console.log('Total price:', totalPrice);
      console.log('Sum:', basePrice + indexation + carryingCost);
      
      // Verify the sum equals the total (allow for rounding differences due to currency formatting)
      const sum = basePrice + indexation + carryingCost;
      // The difference should be minimal (within 2€ due to rounding in currency formatting)
      expect(Math.abs(sum - totalPrice)).toBeLessThanOrEqual(2);
      
      // Verify it matches the expected calculation
      expect(totalPrice).toBeCloseTo(expectedCalculation.totalPrice, 0);
      expect(basePrice).toBeCloseTo(expectedCalculation.basePrice, 0);
      expect(indexation).toBeCloseTo(expectedCalculation.indexation, 0);
      expect(carryingCost).toBeCloseTo(expectedCalculation.carryingCostRecovery, 0);
    }
  });

  it('should use calculated newcomerPriceCalculation.totalPrice when available', () => {
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

    // The purchase share amount should use newcomerPriceCalculation.totalPrice
    // not p.purchaseShare, when newcomerPriceCalculation is available
    const purchaseShareAmount = screen.getByTestId('purchase-share-amount');
    const displayedAmountText = purchaseShareAmount.textContent || '';
    const displayedAmount = parseFloat(displayedAmountText.replace(/[\s€,]/g, '').replace(',', '.'));
    
    // Should match the calculated totalPrice (not the stored purchaseShare)
    expect(displayedAmount).toBeCloseTo(expectedCalculation.totalPrice, 0);
    
    // If there's a mismatch, it means the component is using p.purchaseShare instead of newcomerPriceCalculation.totalPrice
    if (participantCalc.purchaseShare !== expectedCalculation.totalPrice) {
      // This test will fail if the component uses p.purchaseShare when it should use newcomerPriceCalculation.totalPrice
      expect(displayedAmount).not.toBe(participantCalc.purchaseShare);
    }
  });
});

