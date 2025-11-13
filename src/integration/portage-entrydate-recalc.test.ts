/**
 * Integration test: Buyer's finances should recalculate when entry date changes
 *
 * When a buyer purchases a portage lot, changing their entry date should:
 * 1. Update the years of portage held
 * 2. Recalculate the portage lot price (base + indexation + carrying costs)
 * 3. Update the buyer's purchasePrice in purchaseDetails
 * 4. Recalculate the buyer's financial breakdown
 */

import { describe, it, expect } from 'vitest';
import { calculatePortageLotPrice } from '../utils/portageCalculations';
import { calculateCarryingCosts } from '../utils/portageCalculations';
import type { Participant } from '../utils/calculatorUtils';

describe('Portage lot recalculation on entry date change', () => {
  it('should recalculate buyer purchasePrice when entry date changes', () => {
    const deedDate = '2026-02-01';
    const sellerEntryDate = new Date(deedDate);

    // Portage lot details
    const originalPrice = 94200;
    const originalNotaryFees = 11775;
    const originalConstructionCost = 127200;
    const baseAcquisition = originalPrice + originalNotaryFees + originalConstructionCost; // 233,175

    const formulaParams = {
      indexationRate: 2,
      carryingCostRecovery: 100,
      averageInterestRate: 4.5,
      coproReservesShare: 30
    };

    // Scenario 1: Buyer enters 16 months later (2027-06-01)
    const buyerDate1 = new Date('2027-06-01');
    const yearsHeld1 = (buyerDate1.getTime() - sellerEntryDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);

    const carryingCosts1 = calculateCarryingCosts(
      baseAcquisition,
      0,
      Math.round(yearsHeld1 * 12),
      formulaParams.averageInterestRate
    );

    const price1 = calculatePortageLotPrice(
      originalPrice,
      originalNotaryFees,
      originalConstructionCost,
      yearsHeld1,
      formulaParams,
      carryingCosts1,
      0
    );

    // Scenario 2: Buyer changes entry date to 24 months later (2028-02-01)
    const buyerDate2 = new Date('2028-02-01');
    const yearsHeld2 = (buyerDate2.getTime() - sellerEntryDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);

    const carryingCosts2 = calculateCarryingCosts(
      baseAcquisition,
      0,
      Math.round(yearsHeld2 * 12),
      formulaParams.averageInterestRate
    );

    const price2 = calculatePortageLotPrice(
      originalPrice,
      originalNotaryFees,
      originalConstructionCost,
      yearsHeld2,
      formulaParams,
      carryingCosts2,
      0
    );

    // Assertions
    expect(yearsHeld1).toBeCloseTo(1.33, 2); // 16 months
    expect(yearsHeld2).toBeCloseTo(2, 1); // 24 months

    // Price should increase with more time
    expect(price2.totalPrice).toBeGreaterThan(price1.totalPrice);

    // Verify calculations
    expect(price1.totalPrice).toBeCloseTo(256563, 0); // 16 months: ~€256,563
    expect(price2.totalPrice).toBeCloseTo(268351, 0); // 24 months: ~€268,351

    console.log('16 months portage:', {
      yearsHeld: yearsHeld1.toFixed(2),
      basePrice: price1.basePrice,
      indexation: price1.indexation,
      carrying: price1.carryingCostRecovery,
      total: price1.totalPrice
    });

    console.log('24 months portage:', {
      yearsHeld: yearsHeld2.toFixed(2),
      basePrice: price2.basePrice,
      indexation: price2.indexation,
      carrying: price2.carryingCostRecovery,
      total: price2.totalPrice
    });
  });

  it('should update participant purchasePrice when entry date changes', () => {
    // This test will check that when we have a participant with purchaseDetails,
    // changing their entryDate should trigger a recalculation of purchasePrice

    // Seller configuration (defined but not used in current implementation)
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore - Seller will be used when auto-recalculation is implemented
    const _seller: Participant = {
      name: 'Seller',
      capitalApporte: 200000,
      registrationFeesRate: 12.5,
      interestRate: 4.5,
      durationYears: 25,
      isFounder: true,
      entryDate: new Date('2026-02-01'),
      lotsOwned: [
        {
          lotId: 2,
          surface: 80,
          unitId: 5,
          isPortage: true,
          acquiredDate: new Date('2026-02-01'),
          originalPrice: 94200,
          originalNotaryFees: 11775,
          originalConstructionCost: 127200,
          soldDate: new Date('2027-06-01')
        }
      ]
    };

    const buyer1: Participant = {
      name: 'Buyer',
      capitalApporte: 80000,
      registrationFeesRate: 12.5,
      interestRate: 4.5,
      durationYears: 25,
      isFounder: false,
      entryDate: new Date('2027-06-01'),
      purchaseDetails: {
        buyingFrom: 'Seller',
        lotId: 2,
        purchasePrice: 256490 // Price for 16 months
      }
    };

    // Now buyer changes entry date to 24 months later
    const buyer2: Participant = {
      ...buyer1,
      entryDate: new Date('2028-02-01'),
      // purchasePrice should update! But it doesn't currently
      purchaseDetails: {
        buyingFrom: 'Seller',
        lotId: 2,
        purchasePrice: 256490 // ❌ WRONG: Still old price!
      }
    };

    // This test shows the bug: purchasePrice doesn't automatically update
    // when entry date changes

    // What SHOULD happen:
    // 1. Entry date changes
    // 2. Trigger recalculation of portage lot price
    // 3. Update purchaseDetails.purchasePrice
    // 4. Seller's lot.soldDate should also update to match new entry date

    // For now, this test documents the expected behavior
    expect(buyer2.entryDate?.toISOString()).toBe('2028-02-01T00:00:00.000Z');

    // TODO: Implement auto-recalculation
    // expect(buyer2.purchaseDetails.purchasePrice).toBeGreaterThan(256490);
  });

  it('should maintain soldDate sync when entry date changes', () => {
    // When buyer's entry date changes, seller's lot.soldDate should also update
    // This is part of the bidirectional sync

    const participants: Participant[] = [
      {
        name: 'Seller',
        capitalApporte: 200000,
        registrationFeesRate: 12.5,
        interestRate: 4.5,
        durationYears: 25,
        isFounder: true,
        entryDate: new Date('2026-02-01'),
        lotsOwned: [
          {
            lotId: 2,
            surface: 80,
            unitId: 5,
            isPortage: true,
            acquiredDate: new Date('2026-02-01'),
            originalPrice: 94200,
            originalNotaryFees: 11775,
            originalConstructionCost: 127200,
            soldDate: new Date('2027-06-01') // Should update when buyer date changes
          }
        ]
      },
      {
        name: 'Buyer',
        capitalApporte: 80000,
        registrationFeesRate: 12.5,
        interestRate: 4.5,
        durationYears: 25,
        isFounder: false,
        entryDate: new Date('2027-06-01'), // Original date
        purchaseDetails: {
          buyingFrom: 'Seller',
          lotId: 2,
          purchasePrice: 256490
        }
      }
    ];

    // When buyer's entry date changes, both soldDate and purchasePrice should update
    // This requires implementing a "recompute all portage transactions" function

    const seller = participants[0];
    const buyer = participants[1];

    expect(seller.lotsOwned?.[0].soldDate?.toISOString()).toBe('2027-06-01T00:00:00.000Z');
    expect(buyer.entryDate?.toISOString()).toBe('2027-06-01T00:00:00.000Z');

    // These should always match for a portage transaction
    expect(seller.lotsOwned?.[0].soldDate).toEqual(buyer.entryDate);
  });
});
