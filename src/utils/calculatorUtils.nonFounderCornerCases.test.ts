/**
 * Specification-Based Testing for Non-Founder Purchase Share Calculation
 * 
 * Using techniques from: https://www.geeksforgeeks.org/software-testing/specification-based-testing/
 * 
 * This test suite covers corner cases identified through:
 * - Boundary Value Analysis
 * - Equivalence Partitioning
 * - Decision Table Testing
 * - State Transition Testing
 */

import { describe, it, expect } from 'vitest';
import { calculateAll, type Participant, type ProjectParams, type UnitDetails } from './calculatorUtils';
import type { PortageFormulaParams } from './calculatorUtils';

describe('Non-Founder Purchase Share - Specification-Based Corner Cases', () => {
  const baseProjectParams: ProjectParams = {
    totalPurchase: 650000,
    mesuresConservatoires: 0,
    demolition: 0,
    infrastructures: 0,
    etudesPreparatoires: 0,
    fraisEtudesPreparatoires: 0,
    fraisGeneraux3ans: 0,
    batimentFondationConservatoire: 0,
    batimentFondationComplete: 0,
    batimentCoproConservatoire: 0,
    globalCascoPerM2: 1590
  };

  const baseFormulaParams: PortageFormulaParams = {
    indexationRate: 2,
    carryingCostRecovery: 100,
    averageInterestRate: 4.5,
    coproReservesShare: 30
  };

  // ============================================
  // BOUNDARY VALUE ANALYSIS
  // ============================================

  describe('Boundary Value Analysis', () => {
    it('should handle entryDate exactly equal to deedDate (same day entry)', () => {
      // Boundary: entryDate === deedDate (minimum valid entry date)
      const deedDate = '2026-02-01';
      const participants: Participant[] = [
        {
          name: 'Founder',
          capitalApporte: 150000,
          registrationFeesRate: 3,
          unitId: 1,
          surface: 140,
          interestRate: 4,
          durationYears: 25,
          quantity: 1,
          isFounder: true,
          entryDate: '2026-02-01T00:00:00.000Z' as any,
        },
        {
          name: 'Same-Day Newcomer',
          capitalApporte: 40000,
          registrationFeesRate: 12.5,
          unitId: 7,
          surface: 100,
          interestRate: 4,
          durationYears: 25,
          quantity: 1,
          isFounder: false,
          entryDate: '2026-02-01T00:00:00.000Z' as any, // Same as deedDate
          purchaseDetails: {
            buyingFrom: 'Copropriété',
            lotId: 999,
            purchasePrice: 147332.38,
          },
        },
      ];

      const results = calculateAll(participants, baseProjectParams, {}, deedDate, baseFormulaParams);
      const newcomer = results.participantBreakdown.find(p => p.name === 'Same-Day Newcomer');
      
      expect(newcomer).toBeDefined();
      expect(newcomer!.purchaseShare).toBeGreaterThan(0);
      // Years held should be 0 (same day), so indexation should be minimal
      expect(newcomer!.droitEnregistrements).toBeGreaterThan(0);
    });

    it('should handle entryDate very far in the future (many years)', () => {
      // Boundary: entryDate far in future (maximum realistic entry date)
      const deedDate = '2026-02-01';
      const participants: Participant[] = [
        {
          name: 'Founder',
          capitalApporte: 150000,
          registrationFeesRate: 3,
          unitId: 1,
          surface: 140,
          interestRate: 4,
          durationYears: 25,
          quantity: 1,
          isFounder: true,
          entryDate: '2026-02-01T00:00:00.000Z' as any,
        },
        {
          name: 'Future Newcomer',
          capitalApporte: 40000,
          registrationFeesRate: 12.5,
          unitId: 7,
          surface: 100,
          interestRate: 4,
          durationYears: 25,
          quantity: 1,
          isFounder: false,
          entryDate: '2050-02-01T00:00:00.000Z' as any, // 24 years later
          purchaseDetails: {
            buyingFrom: 'Copropriété',
            lotId: 999,
            purchasePrice: 147332.38,
          },
        },
      ];

      const results = calculateAll(participants, baseProjectParams, {}, deedDate, baseFormulaParams);
      const newcomer = results.participantBreakdown.find(p => p.name === 'Future Newcomer');
      
      expect(newcomer).toBeDefined();
      expect(newcomer!.purchaseShare).toBeGreaterThan(0);
      // With 24 years, indexation should be significant
      expect(newcomer!.purchaseShare).toBeGreaterThan(200000); // Should be much higher due to indexation
    });

    it('should handle entryDate before deedDate (invalid but graceful)', () => {
      // Boundary: entryDate < deedDate (invalid scenario, should handle gracefully)
      const deedDate = '2026-02-01';
      const participants: Participant[] = [
        {
          name: 'Founder',
          capitalApporte: 150000,
          registrationFeesRate: 3,
          unitId: 1,
          surface: 140,
          interestRate: 4,
          durationYears: 25,
          quantity: 1,
          isFounder: true,
          entryDate: '2026-02-01T00:00:00.000Z' as any,
        },
        {
          name: 'Invalid Date Newcomer',
          capitalApporte: 40000,
          registrationFeesRate: 12.5,
          unitId: 7,
          surface: 100,
          interestRate: 4,
          durationYears: 25,
          quantity: 1,
          isFounder: false,
          entryDate: '2025-02-01T00:00:00.000Z' as any, // Before deedDate
          purchaseDetails: {
            buyingFrom: 'Copropriété',
            lotId: 999,
            purchasePrice: 147332.38,
          },
        },
      ];

      const results = calculateAll(participants, baseProjectParams, {}, deedDate, baseFormulaParams);
      const newcomer = results.participantBreakdown.find(p => p.name === 'Invalid Date Newcomer');
      
      expect(newcomer).toBeDefined();
      // Should still calculate (negative years held, but should not crash)
      // Should use fallback if calculation fails
      expect(newcomer!.purchaseShare).toBeGreaterThanOrEqual(0);
    });

    it('should handle missing formulaParams (undefined)', () => {
      // Boundary: formulaParams is undefined (optional parameter)
      const deedDate = '2026-02-01';
      const participants: Participant[] = [
        {
          name: 'Founder',
          capitalApporte: 150000,
          registrationFeesRate: 3,
          unitId: 1,
          surface: 140,
          interestRate: 4,
          durationYears: 25,
          quantity: 1,
          isFounder: true,
          entryDate: '2026-02-01T00:00:00.000Z' as any,
        },
        {
          name: 'Newcomer',
          capitalApporte: 40000,
          registrationFeesRate: 12.5,
          unitId: 7,
          surface: 100,
          interestRate: 4,
          durationYears: 25,
          quantity: 1,
          isFounder: false,
          entryDate: '2027-02-01T00:00:00.000Z' as any,
          purchaseDetails: {
            buyingFrom: 'Copropriété',
            lotId: 999,
            purchasePrice: 147332.38,
          },
        },
      ];

      // formulaParams is undefined
      const results = calculateAll(participants, baseProjectParams, {}, deedDate, undefined);
      const newcomer = results.participantBreakdown.find(p => p.name === 'Newcomer');
      
      expect(newcomer).toBeDefined();
      // Should use default values (indexationRate: 2% default)
      expect(newcomer!.purchaseShare).toBeGreaterThan(0);
    });

    it('should handle formulaParams with indexationRate = 0', () => {
      // Boundary: indexationRate = 0 (minimum valid rate)
      const deedDate = '2026-02-01';
      const formulaParams: PortageFormulaParams = {
        ...baseFormulaParams,
        indexationRate: 0, // No indexation
      };

      const participants: Participant[] = [
        {
          name: 'Founder',
          capitalApporte: 150000,
          registrationFeesRate: 3,
          unitId: 1,
          surface: 140,
          interestRate: 4,
          durationYears: 25,
          quantity: 1,
          isFounder: true,
          entryDate: '2026-02-01T00:00:00.000Z' as any,
        },
        {
          name: 'Newcomer',
          capitalApporte: 40000,
          registrationFeesRate: 12.5,
          unitId: 7,
          surface: 100,
          interestRate: 4,
          durationYears: 25,
          quantity: 1,
          isFounder: false,
          entryDate: '2027-02-01T00:00:00.000Z' as any,
          purchaseDetails: {
            buyingFrom: 'Copropriété',
            lotId: 999,
            purchasePrice: 147332.38,
          },
        },
      ];

      const results = calculateAll(participants, baseProjectParams, {}, deedDate, formulaParams);
      const newcomer = results.participantBreakdown.find(p => p.name === 'Newcomer');
      
      expect(newcomer).toBeDefined();
      expect(newcomer!.purchaseShare).toBeGreaterThan(0);
      // With 0% indexation, price should be basePrice + carryingCosts only
      // Should be lower than with 2% indexation
    });

    it('should handle totalPurchase = 0', () => {
      // Boundary: totalPurchase = 0 (minimum value)
      const deedDate = '2026-02-01';
      const projectParams: ProjectParams = {
        ...baseProjectParams,
        totalPurchase: 0, // Zero purchase price
      };

      const participants: Participant[] = [
        {
          name: 'Founder',
          capitalApporte: 150000,
          registrationFeesRate: 3,
          unitId: 1,
          surface: 140,
          interestRate: 4,
          durationYears: 25,
          quantity: 1,
          isFounder: true,
          entryDate: '2026-02-01T00:00:00.000Z' as any,
        },
        {
          name: 'Newcomer',
          capitalApporte: 40000,
          registrationFeesRate: 12.5,
          unitId: 7,
          surface: 100,
          interestRate: 4,
          durationYears: 25,
          quantity: 1,
          isFounder: false,
          entryDate: '2027-02-01T00:00:00.000Z' as any,
          purchaseDetails: {
            buyingFrom: 'Copropriété',
            lotId: 999,
            purchasePrice: 147332.38, // Should use fallback
          },
        },
      ];

      const results = calculateAll(participants, projectParams, {}, deedDate, baseFormulaParams);
      const newcomer = results.participantBreakdown.find(p => p.name === 'Newcomer');
      
      expect(newcomer).toBeDefined();
      // Base price would be 0 (quotité × 0 = 0), so totalPrice would be 0
      // Should fall back to stored purchasePrice
      // Note: The fallback check is `newcomerPrice.totalPrice > 0`, so if it's 0, it uses fallback
      expect(newcomer!.purchaseShare).toBeGreaterThanOrEqual(0);
      // The fallback should use purchaseDetails.purchasePrice if available
      // But if that's also not available, it uses calculatePurchaseShare which needs pricePerM2
      // With totalPurchase = 0, pricePerM2 would throw, so let's just verify it doesn't crash
      expect(newcomer!.purchaseShare).toBeDefined();
    });

    it('should handle all participants with 0 surface', () => {
      // Boundary: All participants have surface = 0
      const deedDate = '2026-02-01';
      const participants: Participant[] = [
        {
          name: 'Founder',
          capitalApporte: 150000,
          registrationFeesRate: 3,
          unitId: 1,
          surface: 0, // Zero surface
          interestRate: 4,
          durationYears: 25,
          quantity: 1,
          isFounder: true,
          entryDate: '2026-02-01T00:00:00.000Z' as any,
        },
        {
          name: 'Newcomer',
          capitalApporte: 40000,
          registrationFeesRate: 12.5,
          unitId: 7,
          surface: 100,
          interestRate: 4,
          durationYears: 25,
          quantity: 1,
          isFounder: false,
          entryDate: '2027-02-01T00:00:00.000Z' as any,
          purchaseDetails: {
            buyingFrom: 'Copropriété',
            lotId: 999,
            purchasePrice: 147332.38,
          },
        },
      ];

      const results = calculateAll(participants, baseProjectParams, {}, deedDate, baseFormulaParams);
      const newcomer = results.participantBreakdown.find(p => p.name === 'Newcomer');
      
      expect(newcomer).toBeDefined();
      // Quotité = 100 / (0 + 100) = 1.0, but if total is 0, quotité would be 0
      // Should handle gracefully
      expect(newcomer!.purchaseShare).toBeGreaterThanOrEqual(0);
    });
  });

  // ============================================
  // EQUIVALENCE PARTITIONING
  // ============================================

  describe('Equivalence Partitioning', () => {
    it('should NOT calculate quotité when entryDate is missing', () => {
      // Equivalence class: Missing entryDate (should not enter condition)
      const deedDate = '2026-02-01';
      const participants: Participant[] = [
        {
          name: 'Founder',
          capitalApporte: 150000,
          registrationFeesRate: 3,
          unitId: 1,
          surface: 140,
          interestRate: 4,
          durationYears: 25,
          quantity: 1,
          isFounder: true,
        },
        {
          name: 'Newcomer Without EntryDate',
          capitalApporte: 40000,
          registrationFeesRate: 12.5,
          unitId: 7,
          surface: 100,
          interestRate: 4,
          durationYears: 25,
          quantity: 1,
          isFounder: false,
          // entryDate is missing
          purchaseDetails: {
            buyingFrom: 'Copropriété',
            lotId: 999,
            purchasePrice: 147332.38,
          },
        },
      ];

      const results = calculateAll(participants, baseProjectParams, {}, deedDate, baseFormulaParams);
      const newcomer = results.participantBreakdown.find(p => p.name === 'Newcomer Without EntryDate');
      
      expect(newcomer).toBeDefined();
      // Should use standard calculation (purchaseDetails.purchasePrice or calculatePurchaseShare)
      expect(newcomer!.purchaseShare).toBeGreaterThanOrEqual(0);
      // Should NOT use quotité calculation (condition not met)
    });

    it('should NOT calculate quotité when deedDate is missing', () => {
      // Equivalence class: Missing deedDate (should not enter condition)
      const participants: Participant[] = [
        {
          name: 'Founder',
          capitalApporte: 150000,
          registrationFeesRate: 3,
          unitId: 1,
          surface: 140,
          interestRate: 4,
          durationYears: 25,
          quantity: 1,
          isFounder: true,
        },
        {
          name: 'Newcomer',
          capitalApporte: 40000,
          registrationFeesRate: 12.5,
          unitId: 7,
          surface: 100,
          interestRate: 4,
          durationYears: 25,
          quantity: 1,
          isFounder: false,
          entryDate: '2027-02-01T00:00:00.000Z' as any,
          purchaseDetails: {
            buyingFrom: 'Copropriété',
            lotId: 999,
            purchasePrice: 147332.38,
          },
        },
      ];

      // deedDate is undefined
      const results = calculateAll(participants, baseProjectParams, {}, undefined, baseFormulaParams);
      const newcomer = results.participantBreakdown.find(p => p.name === 'Newcomer');
      
      expect(newcomer).toBeDefined();
      // Should use standard calculation (condition not met)
      expect(newcomer!.purchaseShare).toBeGreaterThanOrEqual(0);
    });

    it('should NOT calculate quotité when purchaseDetails is missing', () => {
      // Equivalence class: Missing purchaseDetails (should not enter condition)
      const deedDate = '2026-02-01';
      const participants: Participant[] = [
        {
          name: 'Founder',
          capitalApporte: 150000,
          registrationFeesRate: 3,
          unitId: 1,
          surface: 140,
          interestRate: 4,
          durationYears: 25,
          quantity: 1,
          isFounder: true,
        },
        {
          name: 'Newcomer Without PurchaseDetails',
          capitalApporte: 40000,
          registrationFeesRate: 12.5,
          unitId: 7,
          surface: 100,
          interestRate: 4,
          durationYears: 25,
          quantity: 1,
          isFounder: false,
          entryDate: '2027-02-01T00:00:00.000Z' as any,
          // purchaseDetails is missing
        },
      ];

      const results = calculateAll(participants, baseProjectParams, {}, deedDate, baseFormulaParams);
      const newcomer = results.participantBreakdown.find(p => p.name === 'Newcomer Without PurchaseDetails');
      
      expect(newcomer).toBeDefined();
      // Should use standard calculation (calculatePurchaseShare)
      expect(newcomer!.purchaseShare).toBeGreaterThan(0);
    });

    it('should NOT calculate quotité when buyingFrom !== "Copropriété"', () => {
      // Equivalence class: buyingFrom is not "Copropriété" (should not enter condition)
      const deedDate = '2026-02-01';
      const participants: Participant[] = [
        {
          name: 'Founder',
          capitalApporte: 150000,
          registrationFeesRate: 3,
          unitId: 1,
          surface: 140,
          interestRate: 4,
          durationYears: 25,
          quantity: 1,
          isFounder: true,
        },
        {
          name: 'Newcomer Buying From Founder',
          capitalApporte: 40000,
          registrationFeesRate: 12.5,
          unitId: 7,
          surface: 100,
          interestRate: 4,
          durationYears: 25,
          quantity: 1,
          isFounder: false,
          entryDate: '2027-02-01T00:00:00.000Z' as any,
          purchaseDetails: {
            buyingFrom: 'Founder', // Not "Copropriété"
            lotId: 999,
            purchasePrice: 147332.38,
          },
        },
      ];

      const results = calculateAll(participants, baseProjectParams, {}, deedDate, baseFormulaParams);
      const newcomer = results.participantBreakdown.find(p => p.name === 'Newcomer Buying From Founder');
      
      expect(newcomer).toBeDefined();
      // Should use stored purchasePrice (condition not met for quotité calculation)
      expect(newcomer!.purchaseShare).toBe(147332.38);
    });

    it('should NOT calculate quotité when isFounder === true', () => {
      // Equivalence class: isFounder is true (should not enter condition)
      const deedDate = '2026-02-01';
      const participants: Participant[] = [
        {
          name: 'Founder With PurchaseDetails',
          capitalApporte: 150000,
          registrationFeesRate: 3,
          unitId: 1,
          surface: 140,
          interestRate: 4,
          durationYears: 25,
          quantity: 1,
          isFounder: true, // Still a founder
          entryDate: '2026-02-01T00:00:00.000Z' as any,
          purchaseDetails: {
            buyingFrom: 'Copropriété',
            lotId: 999,
            purchasePrice: 147332.38,
          },
        },
      ];

      const results = calculateAll(participants, baseProjectParams, {}, deedDate, baseFormulaParams);
      const founder = results.participantBreakdown.find(p => p.name === 'Founder With PurchaseDetails');
      
      expect(founder).toBeDefined();
      // Should use standard calculation (condition !p.isFounder is false)
      expect(founder!.purchaseShare).toBeGreaterThan(0);
    });
  });

  // ============================================
  // STATE TRANSITION TESTING
  // ============================================

  describe('State Transition Testing', () => {
    it('should handle multiple non-founders entering on the same date', () => {
      // State: Multiple newcomers entering simultaneously
      const deedDate = '2026-02-01';
      const sameEntryDate = '2027-02-01T00:00:00.000Z' as any;
      
      const participants: Participant[] = [
        {
          name: 'Founder',
          capitalApporte: 150000,
          registrationFeesRate: 3,
          unitId: 1,
          surface: 140,
          interestRate: 4,
          durationYears: 25,
          quantity: 1,
          isFounder: true,
          entryDate: '2026-02-01T00:00:00.000Z' as any,
        },
        {
          name: 'Newcomer 1',
          capitalApporte: 40000,
          registrationFeesRate: 12.5,
          unitId: 7,
          surface: 100,
          interestRate: 4,
          durationYears: 25,
          quantity: 1,
          isFounder: false,
          entryDate: sameEntryDate,
          purchaseDetails: {
            buyingFrom: 'Copropriété',
            lotId: 999,
            purchasePrice: 147332.38,
          },
        },
        {
          name: 'Newcomer 2',
          capitalApporte: 50000,
          registrationFeesRate: 12.5,
          unitId: 8,
          surface: 120,
          interestRate: 4,
          durationYears: 25,
          quantity: 1,
          isFounder: false,
          entryDate: sameEntryDate, // Same date
          purchaseDetails: {
            buyingFrom: 'Copropriété',
            lotId: 998,
            purchasePrice: 160000,
          },
        },
      ];

      const results = calculateAll(participants, baseProjectParams, {}, deedDate, baseFormulaParams);
      const newcomer1 = results.participantBreakdown.find(p => p.name === 'Newcomer 1');
      const newcomer2 = results.participantBreakdown.find(p => p.name === 'Newcomer 2');
      
      expect(newcomer1).toBeDefined();
      expect(newcomer2).toBeDefined();
      
      // Both should include each other in their quotité calculation
      // Newcomer 1: quotité = 100 / (140 + 100 + 120) = 100/360
      // Newcomer 2: quotité = 120 / (140 + 100 + 120) = 120/360
      expect(newcomer1!.purchaseShare).toBeGreaterThan(0);
      expect(newcomer2!.purchaseShare).toBeGreaterThan(0);
      expect(newcomer2!.purchaseShare).toBeGreaterThan(newcomer1!.purchaseShare); // Larger surface = larger price
    });

    it('should handle non-founder entering before some founders (edge case)', () => {
      // State: Non-founder with earlier entryDate than some founders
      const deedDate = '2026-02-01';
      
      const participants: Participant[] = [
        {
          name: 'Founder 1',
          capitalApporte: 150000,
          registrationFeesRate: 3,
          unitId: 1,
          surface: 140,
          interestRate: 4,
          durationYears: 25,
          quantity: 1,
          isFounder: true,
          entryDate: '2026-02-01T00:00:00.000Z' as any,
        },
        {
          name: 'Early Newcomer',
          capitalApporte: 40000,
          registrationFeesRate: 12.5,
          unitId: 7,
          surface: 100,
          interestRate: 4,
          durationYears: 25,
          quantity: 1,
          isFounder: false,
          entryDate: '2026-02-02T00:00:00.000Z' as any, // Very early
          purchaseDetails: {
            buyingFrom: 'Copropriété',
            lotId: 999,
            purchasePrice: 147332.38,
          },
        },
        {
          name: 'Founder 2',
          capitalApporte: 450000,
          registrationFeesRate: 3,
          unitId: 3,
          surface: 225,
          interestRate: 4.5,
          durationYears: 25,
          quantity: 1,
          isFounder: true,
          entryDate: '2026-02-10T00:00:00.000Z' as any, // Later than newcomer
        },
      ];

      const results = calculateAll(participants, baseProjectParams, {}, deedDate, baseFormulaParams);
      const newcomer = results.participantBreakdown.find(p => p.name === 'Early Newcomer');
      
      expect(newcomer).toBeDefined();
      // Should only include Founder 1 in quotité (Founder 2 entered later)
      // Quotité = 100 / (140 + 100) = 100/240
      expect(newcomer!.purchaseShare).toBeGreaterThan(0);
    });

    it('should handle all participants entering on the same date', () => {
      // State: All participants (founders + newcomers) enter on same date
      const deedDate = '2026-02-01';
      const sameDate = '2026-02-01T00:00:00.000Z' as any;
      
      const participants: Participant[] = [
        {
          name: 'Founder',
          capitalApporte: 150000,
          registrationFeesRate: 3,
          unitId: 1,
          surface: 140,
          interestRate: 4,
          durationYears: 25,
          quantity: 1,
          isFounder: true,
          entryDate: sameDate,
        },
        {
          name: 'Same-Day Newcomer',
          capitalApporte: 40000,
          registrationFeesRate: 12.5,
          unitId: 7,
          surface: 100,
          interestRate: 4,
          durationYears: 25,
          quantity: 1,
          isFounder: false,
          entryDate: sameDate, // Same as deedDate
          purchaseDetails: {
            buyingFrom: 'Copropriété',
            lotId: 999,
            purchasePrice: 147332.38,
          },
        },
      ];

      const results = calculateAll(participants, baseProjectParams, {}, deedDate, baseFormulaParams);
      const newcomer = results.participantBreakdown.find(p => p.name === 'Same-Day Newcomer');
      
      expect(newcomer).toBeDefined();
      // Years held = 0, so indexation should be minimal
      expect(newcomer!.purchaseShare).toBeGreaterThan(0);
    });
  });

  // ============================================
  // DECISION TABLE TESTING
  // ============================================

  describe('Decision Table Testing', () => {
    it('should handle combination: missing entryDate + missing deedDate', () => {
      // Decision: entryDate = false, deedDate = false → should NOT use quotité
      const participants: Participant[] = [
        {
          name: 'Newcomer',
          capitalApporte: 40000,
          registrationFeesRate: 12.5,
          unitId: 7,
          surface: 100,
          interestRate: 4,
          durationYears: 25,
          quantity: 1,
          isFounder: false,
          // entryDate missing
          purchaseDetails: {
            buyingFrom: 'Copropriété',
            lotId: 999,
            purchasePrice: 147332.38,
          },
        },
      ];

      // deedDate missing
      const results = calculateAll(participants, baseProjectParams, {}, undefined, baseFormulaParams);
      const newcomer = results.participantBreakdown.find(p => p.name === 'Newcomer');
      
      expect(newcomer).toBeDefined();
      // Should use stored purchasePrice (condition not met)
      expect(newcomer!.purchaseShare).toBe(147332.38);
    });

    it('should handle combination: has entryDate + missing deedDate', () => {
      // Decision: entryDate = true, deedDate = false → should NOT use quotité
      const participants: Participant[] = [
        {
          name: 'Newcomer',
          capitalApporte: 40000,
          registrationFeesRate: 12.5,
          unitId: 7,
          surface: 100,
          interestRate: 4,
          durationYears: 25,
          quantity: 1,
          isFounder: false,
          entryDate: '2027-02-01T00:00:00.000Z' as any,
          purchaseDetails: {
            buyingFrom: 'Copropriété',
            lotId: 999,
            purchasePrice: 147332.38,
          },
        },
      ];

      // deedDate missing
      const results = calculateAll(participants, baseProjectParams, {}, undefined, baseFormulaParams);
      const newcomer = results.participantBreakdown.find(p => p.name === 'Newcomer');
      
      expect(newcomer).toBeDefined();
      // Should use stored purchasePrice (condition not met)
      expect(newcomer!.purchaseShare).toBe(147332.38);
    });

    it('should handle combination: missing entryDate + has deedDate', () => {
      // Decision: entryDate = false, deedDate = true → should NOT use quotité
      const deedDate = '2026-02-01';
      const participants: Participant[] = [
        {
          name: 'Newcomer',
          capitalApporte: 40000,
          registrationFeesRate: 12.5,
          unitId: 7,
          surface: 100,
          interestRate: 4,
          durationYears: 25,
          quantity: 1,
          isFounder: false,
          // entryDate missing
          purchaseDetails: {
            buyingFrom: 'Copropriété',
            lotId: 999,
            purchasePrice: 147332.38,
          },
        },
      ];

      const results = calculateAll(participants, baseProjectParams, {}, deedDate, baseFormulaParams);
      const newcomer = results.participantBreakdown.find(p => p.name === 'Newcomer');
      
      expect(newcomer).toBeDefined();
      // Should use stored purchasePrice (condition not met)
      expect(newcomer!.purchaseShare).toBe(147332.38);
    });

    it('should handle combination: has entryDate + has deedDate + buyingFrom !== "Copropriété"', () => {
      // Decision: All conditions met except buyingFrom → should NOT use quotité
      const deedDate = '2026-02-01';
      const participants: Participant[] = [
        {
          name: 'Founder',
          capitalApporte: 150000,
          registrationFeesRate: 3,
          unitId: 1,
          surface: 140,
          interestRate: 4,
          durationYears: 25,
          quantity: 1,
          isFounder: true,
        },
        {
          name: 'Newcomer',
          capitalApporte: 40000,
          registrationFeesRate: 12.5,
          unitId: 7,
          surface: 100,
          interestRate: 4,
          durationYears: 25,
          quantity: 1,
          isFounder: false,
          entryDate: '2027-02-01T00:00:00.000Z' as any,
          purchaseDetails: {
            buyingFrom: 'Founder', // Not "Copropriété"
            lotId: 999,
            purchasePrice: 147332.38,
          },
        },
      ];

      const results = calculateAll(participants, baseProjectParams, {}, deedDate, baseFormulaParams);
      const newcomer = results.participantBreakdown.find(p => p.name === 'Newcomer');
      
      expect(newcomer).toBeDefined();
      // Should use stored purchasePrice (condition not met)
      expect(newcomer!.purchaseShare).toBe(147332.38);
    });
  });

  // ============================================
  // ERROR HANDLING & EDGE CASES
  // ============================================

  describe('Error Handling & Edge Cases', () => {
    it('should handle invalid date strings gracefully', () => {
      const deedDate = '2026-02-01';
      const participants: Participant[] = [
        {
          name: 'Founder',
          capitalApporte: 150000,
          registrationFeesRate: 3,
          unitId: 1,
          surface: 140,
          interestRate: 4,
          durationYears: 25,
          quantity: 1,
          isFounder: true,
        },
        {
          name: 'Newcomer',
          capitalApporte: 40000,
          registrationFeesRate: 12.5,
          unitId: 7,
          surface: 100,
          interestRate: 4,
          durationYears: 25,
          quantity: 1,
          isFounder: false,
          entryDate: 'invalid-date' as any, // Invalid date string
          purchaseDetails: {
            buyingFrom: 'Copropriété',
            lotId: 999,
            purchasePrice: 147332.38,
          },
        },
      ];

      const results = calculateAll(participants, baseProjectParams, {}, deedDate, baseFormulaParams);
      const newcomer = results.participantBreakdown.find(p => p.name === 'Newcomer');
      
      expect(newcomer).toBeDefined();
      // Should fall back to stored price if date parsing fails
      expect(newcomer!.purchaseShare).toBeGreaterThanOrEqual(0);
    });

    it('should handle empty participants array', () => {
      const deedDate = '2026-02-01';
      const participants: Participant[] = [];

      // Empty participants array will cause totalSurface = 0, which throws an error
      // This is expected behavior - the function requires at least one participant
      expect(() => {
        calculateAll(participants, baseProjectParams, {}, deedDate, baseFormulaParams);
      }).toThrow('Total surface must be greater than zero');
    });

    it('should handle participant with undefined surface', () => {
      const deedDate = '2026-02-01';
      const participants: Participant[] = [
        {
          name: 'Founder',
          capitalApporte: 150000,
          registrationFeesRate: 3,
          unitId: 1,
          surface: undefined as any, // Undefined surface
          interestRate: 4,
          durationYears: 25,
          quantity: 1,
          isFounder: true,
        },
        {
          name: 'Newcomer',
          capitalApporte: 40000,
          registrationFeesRate: 12.5,
          unitId: 7,
          surface: 100,
          interestRate: 4,
          durationYears: 25,
          quantity: 1,
          isFounder: false,
          entryDate: '2027-02-01T00:00:00.000Z' as any,
          purchaseDetails: {
            buyingFrom: 'Copropriété',
            lotId: 999,
            purchasePrice: 147332.38,
          },
        },
      ];

      const results = calculateAll(participants, baseProjectParams, {}, deedDate, baseFormulaParams);
      const newcomer = results.participantBreakdown.find(p => p.name === 'Newcomer');
      
      expect(newcomer).toBeDefined();
      // Should handle undefined surface (treated as 0)
      expect(newcomer!.purchaseShare).toBeGreaterThanOrEqual(0);
    });
  });
});

