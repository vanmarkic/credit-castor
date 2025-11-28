/**
 * Unit tests for non-founder quotité calculation
 *
 * Tests the calculateNewcomerQuotite function to understand why quotité might be 0
 */

import { describe, it, expect } from 'vitest';
import { calculateNewcomerQuotite, calculateNewcomerPurchasePrice } from './calculatorUtils';
import type { Participant, PortageFormulaParams } from './calculatorUtils';

// Helper to create minimal participant for testing (only surface and isFounder needed for quotité calculation)
const p = (partial: Partial<Participant> & { name: string }): Participant => ({
  capitalApporte: 0,
  registrationFeesRate: 0,
  interestRate: 0,
  durationYears: 0,
  ...partial,
});

describe('Non-Founder Quotité Calculation', () => {
  describe('calculateNewcomerQuotite', () => {
    it('should calculate quotité correctly for a newcomer with 100m² when total building is 1273m²', () => {
      const newcomerSurface = 100;
      const allParticipants: Participant[] = [
        p({ name: 'Founder 1', surface: 500, isFounder: true }),
        p({ name: 'Founder 2', surface: 400, isFounder: true }),
        p({ name: 'Founder 3', surface: 373, isFounder: true }),
        p({ name: 'Newcomer', surface: 100, isFounder: false }),
      ];

      const quotite = calculateNewcomerQuotite(newcomerSurface, allParticipants);

      // Expected: 100 / 1373 = 0.0728... (not 0!)
      // But wait, if we include the newcomer in the total, it's 100 / 1373
      // If we don't include the newcomer, it's 100 / 1273 = 0.0785...
      const expectedQuotite = 100 / 1373; // Including newcomer in total
      expect(quotite).toBeCloseTo(expectedQuotite, 5);
      expect(quotite).toBeGreaterThan(0);
    });

    it('should return 0 if total building surface is 0 (no participants with surface)', () => {
      const newcomerSurface = 100;
      const allParticipants: Participant[] = [
        p({ name: 'Founder 1', surface: 0, isFounder: true }),
        // Note: If we include the newcomer in the array, total is 100, not 0
        // So quotité = 100/100 = 1, not 0
        // To get 0, we need an empty array or all participants with 0 surface
      ];

      const quotite = calculateNewcomerQuotite(newcomerSurface, allParticipants);
      // Total surface = 0, so quotité should be 0
      expect(quotite).toBe(0);
    });

    it('should return 0 if newcomer surface is 0', () => {
      const newcomerSurface = 0;
      const allParticipants: Participant[] = [
        p({ name: 'Founder 1', surface: 500, isFounder: true }),
        p({ name: 'Newcomer', surface: 0, isFounder: false }),
      ];

      const quotite = calculateNewcomerQuotite(newcomerSurface, allParticipants);
      expect(quotite).toBe(0);
    });

    it('should calculate quotité correctly when newcomer is NOT included in total building surface', () => {
      // This tests the scenario where quotité = newcomer surface / (total WITHOUT newcomer)
      const newcomerSurface = 100;
      const foundersOnly: Participant[] = [
        p({ name: 'Founder 1', surface: 500, isFounder: true }),
        p({ name: 'Founder 2', surface: 400, isFounder: true }),
        p({ name: 'Founder 3', surface: 373, isFounder: true }),
      ];

      // If quotité is calculated as: newcomer / (founders only), not including newcomer
      const quotite = calculateNewcomerQuotite(newcomerSurface, foundersOnly);
      const expectedQuotite = 100 / 1273; // 0.0785... = 7.85% = 78.5/1000

      expect(quotite).toBeCloseTo(expectedQuotite, 5);
      expect(quotite).toBeGreaterThan(0);
      expect(Math.round(quotite * 1000)).toBe(79); // 79/1000, not 0/1000
    });

    it('should calculate quotité correctly when newcomer IS included in total building surface', () => {
      // This tests the scenario where quotité = newcomer surface / (total INCLUDING newcomer)
      const newcomerSurface = 100;
      const allParticipants: Participant[] = [
        p({ name: 'Founder 1', surface: 500, isFounder: true }),
        p({ name: 'Founder 2', surface: 400, isFounder: true }),
        p({ name: 'Founder 3', surface: 373, isFounder: true }),
        p({ name: 'Newcomer', surface: 100, isFounder: false }),
      ];

      const quotite = calculateNewcomerQuotite(newcomerSurface, allParticipants);
      const expectedQuotite = 100 / 1373; // 0.0728... = 7.28% = 72.8/1000

      expect(quotite).toBeCloseTo(expectedQuotite, 5);
      expect(quotite).toBeGreaterThan(0);
      expect(Math.round(quotite * 1000)).toBe(73); // 73/1000, not 0/1000
    });

    it('should handle participants with undefined or null surface', () => {
      const newcomerSurface = 100;
      const allParticipants: Participant[] = [
        p({ name: 'Founder 1', surface: 500, isFounder: true }),
        p({ name: 'Founder 2', surface: undefined, isFounder: true }),
        p({ name: 'Founder 3', surface: 373, isFounder: true }),
      ];

      const quotite = calculateNewcomerQuotite(newcomerSurface, allParticipants);
      // Should use 0 for undefined surface: 100 / (500 + 0 + 373) = 100 / 873
      const expectedQuotite = 100 / 873;

      expect(quotite).toBeCloseTo(expectedQuotite, 5);
      expect(quotite).toBeGreaterThan(0);
    });
  });

  describe('calculateNewcomerPurchasePrice - quotité calculation', () => {
    it('should calculate quotité correctly in purchase price calculation', () => {
      const newcomerSurface = 100;
      const allParticipants: Participant[] = [
        p({ name: 'Founder 1', surface: 500, isFounder: true }),
        p({ name: 'Founder 2', surface: 400, isFounder: true }),
        p({ name: 'Founder 3', surface: 373, isFounder: true }),
      ];
      const totalProjectCost = 650000;
      const deedDate = new Date('2024-01-01');
      const entryDate = new Date('2025-02-01');
      const formulaParams: PortageFormulaParams = {
        indexationRate: 2,
        carryingCostRecovery: 0,
        averageInterestRate: 4.5,
        coproReservesShare: 0,
      };

      const result = calculateNewcomerPurchasePrice(
        newcomerSurface,
        allParticipants,
        totalProjectCost,
        deedDate,
        entryDate,
        formulaParams
      );

      // Quotité should be 100 / 1273 = 0.0785...
      const expectedQuotite = 100 / 1273;
      expect(result.quotite).toBeCloseTo(expectedQuotite, 5);
      expect(result.quotite).toBeGreaterThan(0);
      expect(Math.round(result.quotite * 1000)).toBe(79); // 79/1000, not 0/1000

      // Base price should be quotité × total project cost
      const expectedBasePrice = expectedQuotite * totalProjectCost;
      expect(result.basePrice).toBeCloseTo(expectedBasePrice, 0);
      expect(result.basePrice).toBeGreaterThan(0);
    });

    it('should return quotité 0 if newcomer surface is 0', () => {
      const newcomerSurface = 0;
      const allParticipants: Participant[] = [
        p({ name: 'Founder 1', surface: 500, isFounder: true }),
      ];
      const totalProjectCost = 650000;
      const deedDate = new Date('2024-01-01');
      const entryDate = new Date('2025-02-01');

      const result = calculateNewcomerPurchasePrice(
        newcomerSurface,
        allParticipants,
        totalProjectCost,
        deedDate,
        entryDate
      );

      expect(result.quotite).toBe(0);
      expect(result.basePrice).toBe(0);
      expect(result.totalPrice).toBe(0);
    });

    it('should return quotité 0 if total building surface is 0', () => {
      const newcomerSurface = 100;
      const allParticipants: Participant[] = [
        p({ name: 'Founder 1', surface: 0, isFounder: true }),
      ];
      const totalProjectCost = 650000;
      const deedDate = new Date('2024-01-01');
      const entryDate = new Date('2025-02-01');

      const result = calculateNewcomerPurchasePrice(
        newcomerSurface,
        allParticipants,
        totalProjectCost,
        deedDate,
        entryDate
      );

      expect(result.quotite).toBe(0);
      expect(result.basePrice).toBe(0);
    });
  });

  describe('Bug investigation: Why quotité might be 0 in UI (with entry dates)', () => {
    it('should calculate quotité correctly when all participants have entry dates', () => {
      // Real scenario: All participants have entry dates
      const deedDate = new Date('2024-01-01');
      const newcomer: Participant = p({
        name: 'Newcomer',
        surface: 100,
        isFounder: false,
        entryDate: new Date('2025-02-01'),
      });

      const allParticipants: Participant[] = [
        p({ name: 'Founder 1', surface: 500, isFounder: true, entryDate: deedDate }),
        p({ name: 'Founder 2', surface: 400, isFounder: true, entryDate: deedDate }),
        p({ name: 'Founder 3', surface: 373, isFounder: true, entryDate: deedDate }),
        newcomer,
      ];

      // Simulate the exact filtering logic from CostBreakdownGrid
      const existingParticipants = allParticipants.filter(existing => {
        const existingEntryDate = existing.entryDate || (existing.isFounder ? deedDate : null);
        if (!existingEntryDate) return false;

        const buyerEntryDate = newcomer.entryDate
          ? (newcomer.entryDate instanceof Date ? newcomer.entryDate : new Date(newcomer.entryDate))
          : deedDate;
        return existingEntryDate <= buyerEntryDate;
      });

      // Should include all founders + newcomer (all have entry dates <= newcomer's entry date)
      expect(existingParticipants.length).toBe(4);

      // Calculate quotité - newcomer surface / total surface of existingParticipants
      // Total = 500 + 400 + 373 + 100 = 1373
      // Quotité = 100 / 1373 = 0.0728... = 7.28% = 73/1000
      const quotite = calculateNewcomerQuotite(newcomer.surface || 0, existingParticipants);
      expect(quotite).toBeCloseTo(100 / 1373, 5);
      expect(quotite).toBeGreaterThan(0);
      expect(Math.round(quotite * 1000)).toBe(73); // 73/1000, NOT 0/1000
    });

    it('should identify if newcomer is included in total surface calculation (double counting)', () => {
      // Potential bug: If newcomer is included in existingParticipants array,
      // their surface gets counted in the total, which is correct
      // But if the calculation uses newcomerSurface separately AND includes newcomer in array,
      // there might be confusion
      const newcomerSurface = 100;
      const allParticipants: Participant[] = [
        p({ name: 'Founder 1', surface: 500, isFounder: true }),
        p({ name: 'Founder 2', surface: 400, isFounder: true }),
        p({ name: 'Founder 3', surface: 373, isFounder: true }),
        p({ name: 'Newcomer', surface: 100, isFounder: false }),
      ];

      // When calculating quotité, we pass:
      // 1. newcomerSurface = 100 (the surface being purchased)
      // 2. existingParticipants = [founders + newcomer] (includes newcomer)
      //
      // The function calculates: newcomerSurface / total(existingParticipants)
      // = 100 / (500 + 400 + 373 + 100) = 100 / 1373
      // This is CORRECT - newcomer's surface should be in the denominator

      const quotite = calculateNewcomerQuotite(newcomerSurface, allParticipants);
      expect(quotite).toBeCloseTo(100 / 1373, 5);
      expect(quotite).toBeGreaterThan(0);
    });

    it('should identify if the issue is in how existingParticipants is constructed', () => {
      // Check if the filtering might exclude the newcomer themselves
      const deedDate = new Date('2024-01-01');
      const newcomer: Participant = p({
        name: 'Newcomer',
        surface: 100,
        isFounder: false,
        entryDate: new Date('2025-02-01'),
      });

      const allParticipants: Participant[] = [
        p({ name: 'Founder 1', surface: 500, isFounder: true, entryDate: deedDate }),
        p({ name: 'Founder 2', surface: 400, isFounder: true, entryDate: deedDate }),
        p({ name: 'Founder 3', surface: 373, isFounder: true, entryDate: deedDate }),
        newcomer,
      ];

      // Filter logic from CostBreakdownGrid
      const existingParticipants = allParticipants.filter(existing => {
        const existingEntryDate = existing.entryDate || (existing.isFounder ? deedDate : null);
        if (!existingEntryDate) return false;

        const buyerEntryDate = newcomer.entryDate
          ? (newcomer.entryDate instanceof Date ? newcomer.entryDate : new Date(newcomer.entryDate))
          : deedDate;
        return existingEntryDate <= buyerEntryDate;
      });

      // CRITICAL: Check if newcomer is included
      const newcomerIncluded = existingParticipants.some(p => p.name === newcomer.name);
      expect(newcomerIncluded).toBe(true); // Newcomer should be included!

      // If newcomer is NOT included, total would be 1273, not 1373
      // But that's still not 0, so quotité would be 100/1273 = 0.0785, not 0

      const totalSurface = existingParticipants.reduce((sum, p) => sum + (p.surface || 0), 0);
      expect(totalSurface).toBe(1373); // 500 + 400 + 373 + 100

      const quotite = calculateNewcomerQuotite(newcomer.surface || 0, existingParticipants);
      expect(quotite).toBeGreaterThan(0);
    });

    it('should identify if participant.surface is 0 or undefined', () => {
      // If participant.surface is 0 or undefined, quotité will be 0
      const deedDate = new Date('2024-01-01');
      const newcomer: Participant = p({
        name: 'Newcomer',
        surface: 0, // BUG: Surface is 0!
        isFounder: false,
        entryDate: new Date('2025-02-01'),
      });

      const allParticipants: Participant[] = [
        p({ name: 'Founder 1', surface: 500, isFounder: true, entryDate: deedDate }),
        p({ name: 'Founder 2', surface: 400, isFounder: true, entryDate: deedDate }),
        p({ name: 'Founder 3', surface: 373, isFounder: true, entryDate: deedDate }),
        newcomer,
      ];

      const existingParticipants = allParticipants.filter(existing => {
        const existingEntryDate = existing.entryDate || (existing.isFounder ? deedDate : null);
        if (!existingEntryDate) return false;
        const buyerEntryDate = newcomer.entryDate || deedDate;
        return existingEntryDate <= buyerEntryDate;
      });

      // If surface is 0, quotité will be 0
      const quotite = calculateNewcomerQuotite(newcomer.surface || 0, existingParticipants);
      expect(quotite).toBe(0); // This is the bug - surface should not be 0
    });

    it('should identify if try-catch is swallowing errors', () => {
      // If calculateNewcomerPurchasePrice throws an error, newcomerPriceCalculation will be undefined
      // This would cause the display to show 0€ instead of the calculated value
      const deedDate = new Date('2024-01-01');
      const newcomer: Participant = p({
        name: 'Newcomer',
        surface: 100,
        isFounder: false,
        entryDate: new Date('2025-02-01'),
      });

      const allParticipants: Participant[] = [
        p({ name: 'Founder 1', surface: 500, isFounder: true, entryDate: deedDate }),
      ];

      // If projectParams.totalPurchase is 0 or undefined, calculation might fail
      const totalProjectCost = 0; // BUG: Total project cost is 0!

      try {
        const result = calculateNewcomerPurchasePrice(
          newcomer.surface || 0,
          allParticipants,
          totalProjectCost,
          deedDate,
          newcomer.entryDate!
        );
        // Even with 0 totalProjectCost, quotité should still be calculated correctly
        expect(result.quotite).toBeGreaterThan(0); // Quotité = 100/600 = 0.166...
        expect(result.basePrice).toBe(0); // But base price will be 0
      } catch (error) {
        // If error is thrown, newcomerPriceCalculation will be undefined
        // This would cause quotité display to show 0
        expect(error).toBeDefined();
      }
    });
  });

  describe('Bug investigation: Why quotité might be 0 in UI', () => {
    it('should identify if existingParticipants array is empty after filtering', () => {
      // This could happen if all participants are filtered out
      const newcomer: Participant = p({
        name: 'Newcomer',
        surface: 100,
        isFounder: false,
        entryDate: new Date('2025-02-01'),
      });

      const allParticipants: Participant[] = [
        // Founders without entryDate - should use deedDate
        p({ name: 'Founder 1', surface: 500, isFounder: true }),
        p({ name: 'Founder 2', surface: 400, isFounder: true }),
        p({ name: 'Founder 3', surface: 373, isFounder: true }),
        newcomer,
      ];

      const deedDate = new Date('2024-01-01');

      // Simulate the exact filtering logic from CostBreakdownGrid
      const existingParticipants = allParticipants.filter(existing => {
        const existingEntryDate = existing.entryDate || (existing.isFounder ? deedDate : null);
        if (!existingEntryDate) return false;

        const buyerEntryDate = newcomer.entryDate
          ? (newcomer.entryDate instanceof Date ? newcomer.entryDate : new Date(newcomer.entryDate))
          : deedDate;
        return existingEntryDate <= buyerEntryDate;
      });

      // Should include all founders + newcomer
      expect(existingParticipants.length).toBe(4);

      const quotite = calculateNewcomerQuotite(newcomer.surface || 0, existingParticipants);
      expect(quotite).toBeGreaterThan(0);
    });

    it('should identify if display total differs from calculation total', () => {
      // The display shows: allParticipants.reduce(...)
      // But calculation uses: existingParticipants
      // This test verifies they might differ
      const newcomer: Participant = p({
        name: 'Newcomer',
        surface: 100,
        isFounder: false,
        entryDate: new Date('2025-02-01'),
      });

      const allParticipants: Participant[] = [
        p({ name: 'Founder 1', surface: 500, isFounder: true }),
        p({ name: 'Founder 2', surface: 400, isFounder: true }),
        p({ name: 'Founder 3', surface: 373, isFounder: true }),
        p({ name: 'Future Newcomer', surface: 200, isFounder: false, entryDate: new Date('2026-01-01') }), // Enters later
        newcomer,
      ];

      const deedDate = new Date('2024-01-01');

      // Filtered participants (used in calculation)
      const existingParticipants = allParticipants.filter(existing => {
        const existingEntryDate = existing.entryDate || (existing.isFounder ? deedDate : null);
        if (!existingEntryDate) return false;
        const buyerEntryDate = newcomer.entryDate || deedDate;
        return existingEntryDate <= buyerEntryDate;
      });

      // Display total (all participants)
      const displayTotal = allParticipants.reduce((s, p) => s + (p.surface || 0), 0);
      // Calculation total (filtered participants)
      const calculationTotal = existingParticipants.reduce((s, p) => s + (p.surface || 0), 0);

      // They should differ (display includes future newcomer, calculation doesn't)
      expect(displayTotal).toBe(1573); // 500 + 400 + 373 + 200 + 100
      expect(calculationTotal).toBe(1373); // 500 + 400 + 373 + 100 (no future newcomer)

      // Quotité calculation uses filtered participants
      const quotite = calculateNewcomerQuotite(newcomer.surface || 0, existingParticipants);
      expect(quotite).toBeCloseTo(100 / 1373, 5);
      expect(quotite).toBeGreaterThan(0);

      // But display shows different total
      // This mismatch could confuse users, but shouldn't cause quotité to be 0
    });
  });

  describe('Edge cases that could cause quotité to be 0', () => {
    it('should identify if filtering by entry date causes quotité to be 0', () => {
      // Simulate the scenario from CostBreakdownGrid where existingParticipants
      // are filtered by entry date
      const newcomer: Participant = p({
        name: 'Newcomer',
        surface: 100,
        isFounder: false,
        entryDate: new Date('2025-02-01'),
      });

      const allParticipants: Participant[] = [
        p({ name: 'Founder 1', surface: 500, isFounder: true }),
        p({ name: 'Founder 2', surface: 400, isFounder: true }),
        p({ name: 'Founder 3', surface: 373, isFounder: true }),
        newcomer,
      ];

      // Simulate filtering: only participants who entered on or before newcomer's entry date
      const existingParticipants = allParticipants.filter(existing => {
        const existingEntryDate = existing.entryDate || (existing.isFounder ? new Date('2024-01-01') : null);
        if (!existingEntryDate) return false;
        const buyerEntryDate = newcomer.entryDate || new Date('2024-01-01');
        return existingEntryDate <= buyerEntryDate;
      });

      // Calculate quotité using filtered participants
      const quotite = calculateNewcomerQuotite(newcomer.surface || 0, existingParticipants);

      // Should NOT be 0 if filtering works correctly
      expect(quotite).toBeGreaterThan(0);

      // Should include all founders + newcomer = 1373 total
      const expectedQuotite = 100 / 1373;
      expect(quotite).toBeCloseTo(expectedQuotite, 5);
    });

    it('should identify if missing entry dates cause filtering to exclude participants', () => {
      const newcomer: Participant = p({
        name: 'Newcomer',
        surface: 100,
        isFounder: false,
        entryDate: new Date('2025-02-01'),
      });

      const allParticipants: Participant[] = [
        p({ name: 'Founder 1', surface: 500, isFounder: true }), // No entryDate, should use deedDate
        p({ name: 'Founder 2', surface: 400, isFounder: true, entryDate: undefined }),
        p({ name: 'Founder 3', surface: 373, isFounder: true }),
        newcomer,
      ];

      const deedDate = new Date('2024-01-01');

      // Simulate the exact filtering logic from CostBreakdownGrid
      const existingParticipants = allParticipants.filter(existing => {
        const existingEntryDate = existing.entryDate || (existing.isFounder ? deedDate : null);
        if (!existingEntryDate) return false;

        const buyerEntryDate = newcomer.entryDate
          ? (newcomer.entryDate instanceof Date ? newcomer.entryDate : new Date(newcomer.entryDate))
          : deedDate;
        return existingEntryDate <= buyerEntryDate;
      });

      // All founders should be included (they have entryDate = deedDate or isFounder = true)
      expect(existingParticipants.length).toBeGreaterThan(0);

      const quotite = calculateNewcomerQuotite(newcomer.surface || 0, existingParticipants);
      expect(quotite).toBeGreaterThan(0);
    });
  });
});
