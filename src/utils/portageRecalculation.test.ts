import { describe, it, expect } from 'vitest';
import {
  recalculatePortagePurchasePrice,
  updateBuyerWithRecalculatedPrice,
  recalculateAllPortagePrices
} from './portageRecalculation';
import type { Participant } from './calculatorUtils';

const formulaParams = {
  indexationRate: 2,
  carryingCostRecovery: 100,
  averageInterestRate: 4.5,
  coproReservesShare: 30
};

describe('portageRecalculation', () => {
  const seller: Participant = {
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
        originalConstructionCost: 127200
      }
    ]
  };

  describe('recalculatePortagePurchasePrice', () => {
    it('should calculate correct price for 16 months portage', () => {
      const buyer: Participant = {
        name: 'Buyer',
        capitalApporte: 80000,
        registrationFeesRate: 12.5,
        interestRate: 4.5,
        durationYears: 25,
        isFounder: false,
        entryDate: new Date('2027-06-01'), // 16 months after seller
        purchaseDetails: {
          buyingFrom: 'Seller',
          lotId: 2,
          purchasePrice: 0 // Will be recalculated
        }
      };

      const price = recalculatePortagePurchasePrice(
        buyer,
        seller,
        '2026-02-01',
        formulaParams
      );

      expect(price).toBeDefined();
      expect(price).toBeCloseTo(256563, 0); // Actual calculated value
    });

    it('should calculate higher price for 24 months portage', () => {
      const buyer: Participant = {
        name: 'Buyer',
        capitalApporte: 80000,
        registrationFeesRate: 12.5,
        interestRate: 4.5,
        durationYears: 25,
        isFounder: false,
        entryDate: new Date('2028-02-01'), // 24 months after seller
        purchaseDetails: {
          buyingFrom: 'Seller',
          lotId: 2,
          purchasePrice: 0
        }
      };

      const price16Months = 256563; // Reference price for comparison

      const price = recalculatePortagePurchasePrice(
        buyer,
        seller,
        '2026-02-01',
        formulaParams
      );

      expect(price).toBeDefined();
      expect(price!).toBeGreaterThan(price16Months); // More than 16 months
    });

    it('should return undefined for copropriété purchases', () => {
      const buyer: Participant = {
        name: 'Buyer',
        capitalApporte: 80000,
        registrationFeesRate: 12.5,
        interestRate: 4.5,
        durationYears: 25,
        isFounder: false,
        entryDate: new Date('2027-06-01'),
        purchaseDetails: {
          buyingFrom: 'Copropriété',
          lotId: 100,
          purchasePrice: 150000
        }
      };

      const price = recalculatePortagePurchasePrice(
        buyer,
        seller,
        '2026-02-01',
        formulaParams
      );

      expect(price).toBeUndefined();
    });

    it('should return undefined when no purchaseDetails', () => {
      const buyer: Participant = {
        name: 'Buyer',
        capitalApporte: 80000,
        registrationFeesRate: 12.5,
        interestRate: 4.5,
        durationYears: 25,
        isFounder: false,
        entryDate: new Date('2027-06-01')
      };

      const price = recalculatePortagePurchasePrice(
        buyer,
        seller,
        '2026-02-01',
        formulaParams
      );

      expect(price).toBeUndefined();
    });
  });

  describe('updateBuyerWithRecalculatedPrice', () => {
    it('should update buyer purchasePrice', () => {
      const buyer: Participant = {
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
          purchasePrice: 999999 // Wrong price
        }
      };

      const updated = updateBuyerWithRecalculatedPrice(
        buyer,
        seller,
        '2026-02-01',
        formulaParams
      );

      expect(updated.purchaseDetails?.purchasePrice).not.toBe(999999);
      expect(updated.purchaseDetails?.purchasePrice).toBeCloseTo(256563, 0);
    });

    it('should preserve other purchaseDetails fields', () => {
      const buyer: Participant = {
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
          purchasePrice: 999999,
          breakdown: {
            basePrice: 233175,
            indexation: 6212,
            carryingCostRecovery: 17103,
            feesRecovery: 0,
            renovations: 0
          }
        }
      };

      const updated = updateBuyerWithRecalculatedPrice(
        buyer,
        seller,
        '2026-02-01',
        formulaParams
      );

      expect(updated.purchaseDetails?.buyingFrom).toBe('Seller');
      expect(updated.purchaseDetails?.lotId).toBe(2);
      // Breakdown is preserved (though it may become outdated)
      expect(updated.purchaseDetails?.breakdown).toBeDefined();
    });
  });

  describe('recalculateAllPortagePrices', () => {
    it('should recalculate all portage transactions', () => {
      const participants: Participant[] = [
        seller,
        {
          name: 'Buyer1',
          capitalApporte: 80000,
          registrationFeesRate: 12.5,
          interestRate: 4.5,
          durationYears: 25,
          isFounder: false,
          entryDate: new Date('2027-06-01'),
          purchaseDetails: {
            buyingFrom: 'Seller',
            lotId: 2,
            purchasePrice: 0 // Wrong
          }
        },
        {
          name: 'Buyer2',
          capitalApporte: 90000,
          registrationFeesRate: 12.5,
          interestRate: 4.5,
          durationYears: 25,
          isFounder: false,
          entryDate: new Date('2027-06-01'),
          purchaseDetails: {
            buyingFrom: 'Copropriété',
            lotId: 100,
            purchasePrice: 150000 // Should not change
          }
        }
      ];

      const updated = recalculateAllPortagePrices(
        participants,
        '2026-02-01',
        formulaParams
      );

      // Seller unchanged
      expect(updated[0]).toEqual(seller);

      // Buyer1 price updated
      expect(updated[1].purchaseDetails?.purchasePrice).toBeCloseTo(256563, 0);

      // Buyer2 (copro) unchanged
      expect(updated[2].purchaseDetails?.purchasePrice).toBe(150000);
    });

    it('should handle multiple buyers from same seller', () => {
      const multiLotSeller: Participant = {
        ...seller,
        lotsOwned: [
          {
            lotId: 2,
            surface: 80,
            unitId: 5,
            isPortage: true,
            acquiredDate: new Date('2026-02-01'),
            originalPrice: 94200,
            originalNotaryFees: 11775,
            originalConstructionCost: 127200
          },
          {
            lotId: 3,
            surface: 100,
            unitId: 5,
            isPortage: true,
            acquiredDate: new Date('2026-02-01'),
            originalPrice: 120000,
            originalNotaryFees: 15000,
            originalConstructionCost: 150000
          }
        ]
      };

      const participants: Participant[] = [
        multiLotSeller,
        {
          name: 'Buyer1',
          capitalApporte: 80000,
          registrationFeesRate: 12.5,
          interestRate: 4.5,
          durationYears: 25,
          isFounder: false,
          entryDate: new Date('2027-06-01'),
          purchaseDetails: {
            buyingFrom: 'Seller',
            lotId: 2,
            purchasePrice: 0
          }
        },
        {
          name: 'Buyer2',
          capitalApporte: 90000,
          registrationFeesRate: 12.5,
          interestRate: 4.5,
          durationYears: 25,
          isFounder: false,
          entryDate: new Date('2028-01-01'), // Different date
          purchaseDetails: {
            buyingFrom: 'Seller',
            lotId: 3,
            purchasePrice: 0
          }
        }
      ];

      const updated = recalculateAllPortagePrices(
        participants,
        '2026-02-01',
        formulaParams
      );

      // Both buyers should have recalculated prices
      expect(updated[1].purchaseDetails?.purchasePrice).toBeGreaterThan(250000);
      expect(updated[2].purchaseDetails?.purchasePrice).toBeGreaterThan(300000);

      // Buyer2 price should be higher (more time held)
      const buyer1Price = updated[1].purchaseDetails?.purchasePrice ?? 0;
      const buyer2Price = updated[2].purchaseDetails?.purchasePrice ?? 0;
      expect(buyer2Price).toBeGreaterThan(buyer1Price);
    });
  });
});
