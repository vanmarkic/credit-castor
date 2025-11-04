import { describe, it, expect } from 'vitest';
import { syncSoldDatesFromPurchaseDetails, validateSoldDateConsistency } from './participantSync';
import type { Participant } from './calculatorUtils';

describe('participantSync', () => {
  describe('syncSoldDatesFromPurchaseDetails', () => {
    it('should set soldDate on seller lot when buyer has purchaseDetails', () => {
      const participants: Participant[] = [
        {
          name: 'Seller',
          capitalApporte: 100000,
          notaryFeesRate: 12.5,
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
        },
        {
          name: 'Buyer',
          capitalApporte: 80000,
          notaryFeesRate: 12.5,
          interestRate: 4.5,
          durationYears: 25,
          isFounder: false,
          entryDate: new Date('2027-06-01'),
          purchaseDetails: {
            buyingFrom: 'Seller',
            lotId: 2,
            purchasePrice: 256490
          }
        }
      ];

      const synced = syncSoldDatesFromPurchaseDetails(participants);

      // Check that seller's lot now has soldDate
      const seller = synced.find(p => p.name === 'Seller');
      expect(seller).toBeDefined();
      expect(seller?.lotsOwned).toBeDefined();
      expect(seller?.lotsOwned?.[0].soldDate).toBeDefined();
      expect(seller?.lotsOwned?.[0].soldDate).toEqual(new Date('2027-06-01'));
    });

    it('should not modify lots that are not being purchased', () => {
      const participants: Participant[] = [
        {
          name: 'Seller',
          capitalApporte: 100000,
          notaryFeesRate: 12.5,
          interestRate: 4.5,
          durationYears: 25,
          isFounder: true,
          entryDate: new Date('2026-02-01'),
          lotsOwned: [
            {
              lotId: 1,
              surface: 118,
              unitId: 5,
              isPortage: false,
              acquiredDate: new Date('2026-02-01')
            },
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
        },
        {
          name: 'Buyer',
          capitalApporte: 80000,
          notaryFeesRate: 12.5,
          interestRate: 4.5,
          durationYears: 25,
          isFounder: false,
          entryDate: new Date('2027-06-01'),
          purchaseDetails: {
            buyingFrom: 'Seller',
            lotId: 2,
            purchasePrice: 256490
          }
        }
      ];

      const synced = syncSoldDatesFromPurchaseDetails(participants);

      const seller = synced.find(p => p.name === 'Seller');
      expect(seller?.lotsOwned?.[0].soldDate).toBeUndefined(); // Lot 1 not sold
      expect(seller?.lotsOwned?.[1].soldDate).toEqual(new Date('2027-06-01')); // Lot 2 sold
    });

    it('should skip copropriété purchases', () => {
      const participants: Participant[] = [
        {
          name: 'Buyer',
          capitalApporte: 80000,
          notaryFeesRate: 12.5,
          interestRate: 4.5,
          durationYears: 25,
          isFounder: false,
          entryDate: new Date('2027-06-01'),
          purchaseDetails: {
            buyingFrom: 'Copropriété',
            lotId: 100,
            purchasePrice: 150000
          }
        }
      ];

      const synced = syncSoldDatesFromPurchaseDetails(participants);

      // Should not crash, just return as-is
      expect(synced).toHaveLength(1);
    });

    it('should handle multiple buyers from same seller', () => {
      const participants: Participant[] = [
        {
          name: 'Seller',
          capitalApporte: 100000,
          notaryFeesRate: 12.5,
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
        },
        {
          name: 'Buyer1',
          capitalApporte: 80000,
          notaryFeesRate: 12.5,
          interestRate: 4.5,
          durationYears: 25,
          isFounder: false,
          entryDate: new Date('2027-06-01'),
          purchaseDetails: {
            buyingFrom: 'Seller',
            lotId: 2,
            purchasePrice: 256490
          }
        },
        {
          name: 'Buyer2',
          capitalApporte: 90000,
          notaryFeesRate: 12.5,
          interestRate: 4.5,
          durationYears: 25,
          isFounder: false,
          entryDate: new Date('2028-01-01'),
          purchaseDetails: {
            buyingFrom: 'Seller',
            lotId: 3,
            purchasePrice: 300000
          }
        }
      ];

      const synced = syncSoldDatesFromPurchaseDetails(participants);

      const seller = synced.find(p => p.name === 'Seller');
      expect(seller?.lotsOwned?.[0].soldDate).toEqual(new Date('2027-06-01'));
      expect(seller?.lotsOwned?.[1].soldDate).toEqual(new Date('2028-01-01'));
    });
  });

  describe('validateSoldDateConsistency', () => {
    it('should return empty array for valid data', () => {
      const participants: Participant[] = [
        {
          name: 'Seller',
          capitalApporte: 100000,
          notaryFeesRate: 12.5,
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
        },
        {
          name: 'Buyer',
          capitalApporte: 80000,
          notaryFeesRate: 12.5,
          interestRate: 4.5,
          durationYears: 25,
          isFounder: false,
          entryDate: new Date('2027-06-01'),
          purchaseDetails: {
            buyingFrom: 'Seller',
            lotId: 2,
            purchasePrice: 256490
          }
        }
      ];

      const errors = validateSoldDateConsistency(participants);
      expect(errors).toEqual([]);
    });

    it('should detect missing soldDate', () => {
      const participants: Participant[] = [
        {
          name: 'Seller',
          capitalApporte: 100000,
          notaryFeesRate: 12.5,
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
              // Missing soldDate!
            }
          ]
        },
        {
          name: 'Buyer',
          capitalApporte: 80000,
          notaryFeesRate: 12.5,
          interestRate: 4.5,
          durationYears: 25,
          isFounder: false,
          entryDate: new Date('2027-06-01'),
          purchaseDetails: {
            buyingFrom: 'Seller',
            lotId: 2,
            purchasePrice: 256490
          }
        }
      ];

      const errors = validateSoldDateConsistency(participants);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0]).toContain('no soldDate');
    });

    it('should detect mismatched dates', () => {
      const participants: Participant[] = [
        {
          name: 'Seller',
          capitalApporte: 100000,
          notaryFeesRate: 12.5,
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
              soldDate: new Date('2028-01-01') // Wrong date!
            }
          ]
        },
        {
          name: 'Buyer',
          capitalApporte: 80000,
          notaryFeesRate: 12.5,
          interestRate: 4.5,
          durationYears: 25,
          isFounder: false,
          entryDate: new Date('2027-06-01'),
          purchaseDetails: {
            buyingFrom: 'Seller',
            lotId: 2,
            purchasePrice: 256490
          }
        }
      ];

      const errors = validateSoldDateConsistency(participants);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0]).toContain("doesn't match");
    });
  });
});
