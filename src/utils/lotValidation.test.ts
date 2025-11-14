/**
 * Tests for lot validation utilities
 */

import { describe, it, expect } from 'vitest';
import {
  DEFAULT_MAX_TOTAL_LOTS,
  countParticipantLots,
  countCoproLots,
  countTotalLots,
  wouldExceedMaxLots,
  getRemainingLotCapacity,
  validateAddPortageLot,
  validateAddCoproLot
} from './lotValidation';
import type { Participant } from './calculatorUtils';
import type { CoproLot } from '../types/timeline';

describe('lotValidation', () => {
  describe('DEFAULT_MAX_TOTAL_LOTS', () => {
    it('should be 10', () => {
      expect(DEFAULT_MAX_TOTAL_LOTS).toBe(10);
    });
  });

  describe('countParticipantLots', () => {
    it('should count lots from lotsOwned array', () => {
      const participants: Participant[] = [
        {
          name: 'Founder 1',
          capitalApporte: 100000,
          registrationFeesRate: 12.5,
          interestRate: 4.5,
          durationYears: 25,
          lotsOwned: [
            { lotId: 1, surface: 100, unitId: 1, isPortage: false, acquiredDate: new Date() },
            { lotId: 2, surface: 80, unitId: 1, isPortage: true, acquiredDate: new Date() }
          ]
        },
        {
          name: 'Founder 2',
          capitalApporte: 100000,
          registrationFeesRate: 12.5,
          interestRate: 4.5,
          durationYears: 25,
          lotsOwned: [
            { lotId: 3, surface: 100, unitId: 2, isPortage: false, acquiredDate: new Date() }
          ]
        }
      ];

      expect(countParticipantLots(participants)).toBe(3);
    });

    it('should fallback to quantity if lotsOwned is not set', () => {
      const participants: Participant[] = [
        {
          name: 'Founder 1',
          capitalApporte: 100000,
          registrationFeesRate: 12.5,
          interestRate: 4.5,
          durationYears: 25,
          quantity: 2
        },
        {
          name: 'Founder 2',
          capitalApporte: 100000,
          registrationFeesRate: 12.5,
          interestRate: 4.5,
          durationYears: 25,
          quantity: 1
        }
      ];

      expect(countParticipantLots(participants)).toBe(3);
    });

    it('should default to 1 if neither lotsOwned nor quantity is set', () => {
      const participants: Participant[] = [
        {
          name: 'Founder 1',
          capitalApporte: 100000,
          registrationFeesRate: 12.5,
          interestRate: 4.5,
          durationYears: 25
        }
      ];

      expect(countParticipantLots(participants)).toBe(1);
    });
  });

  describe('countCoproLots', () => {
    it('should count copropriété lots', () => {
      const coproLots: CoproLot[] = [
        { lotId: 10, surface: 100, acquiredDate: new Date() },
        { lotId: 11, surface: 85, acquiredDate: new Date() }
      ];

      expect(countCoproLots(coproLots)).toBe(2);
    });

    it('should return 0 for empty array', () => {
      expect(countCoproLots([])).toBe(0);
    });
  });

  describe('countTotalLots', () => {
    it('should sum participant and copropriété lots', () => {
      const participants: Participant[] = [
        {
          name: 'Founder 1',
          capitalApporte: 100000,
          registrationFeesRate: 12.5,
          interestRate: 4.5,
          durationYears: 25,
          lotsOwned: [
            { lotId: 1, surface: 100, unitId: 1, isPortage: false, acquiredDate: new Date() },
            { lotId: 2, surface: 80, unitId: 1, isPortage: true, acquiredDate: new Date() }
          ]
        }
      ];

      const coproLots: CoproLot[] = [
        { lotId: 10, surface: 100, acquiredDate: new Date() }
      ];

      expect(countTotalLots(participants, coproLots)).toBe(3);
    });
  });

  describe('wouldExceedMaxLots', () => {
    it('should return true if adding would exceed max', () => {
      expect(wouldExceedMaxLots(10, 10, 1)).toBe(true); // 10 + 1 > 10
      expect(wouldExceedMaxLots(9, 10, 2)).toBe(true); // 9 + 2 > 10
      // Test with default maxTotalLots
      expect(wouldExceedMaxLots(10)).toBe(true); // 10 + 1 > 10 (default)
    });

    it('should return false if adding would not exceed max', () => {
      expect(wouldExceedMaxLots(9, 10, 1)).toBe(false); // 9 + 1 <= 10
      expect(wouldExceedMaxLots(5, 10, 4)).toBe(false); // 5 + 4 <= 10
      // Test with default maxTotalLots
      expect(wouldExceedMaxLots(9)).toBe(false); // 9 + 1 <= 10 (default)
    });
  });

  describe('getRemainingLotCapacity', () => {
    it('should return remaining capacity', () => {
      expect(getRemainingLotCapacity(5)).toBe(5);
      expect(getRemainingLotCapacity(10)).toBe(0);
      expect(getRemainingLotCapacity(15)).toBe(0); // Don't allow negative
    });
  });

  describe('validateAddPortageLot', () => {
    it('should allow adding when under limit', () => {
      const participants: Participant[] = [
        {
          name: 'Founder 1',
          capitalApporte: 100000,
          registrationFeesRate: 12.5,
          interestRate: 4.5,
          durationYears: 25,
          lotsOwned: [
            { lotId: 1, surface: 100, unitId: 1, isPortage: false, acquiredDate: new Date() }
          ]
        }
      ];

      const coproLots: CoproLot[] = [];

      const result = validateAddPortageLot(participants, coproLots);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject adding when at limit', () => {
      const participants: Participant[] = Array.from({ length: 10 }, (_, i) => ({
        name: `Founder ${i + 1}`,
        capitalApporte: 100000,
        registrationFeesRate: 12.5,
        interestRate: 4.5,
        durationYears: 25,
        lotsOwned: [
          { lotId: i + 1, surface: 100, unitId: i + 1, isPortage: false, acquiredDate: new Date() }
        ]
      }));

      const coproLots: CoproLot[] = [];

      const result = validateAddPortageLot(participants, coproLots);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Maximum of 10 total lots reached');
    });

    it('should respect custom maxTotalLots parameter', () => {
      const participants: Participant[] = Array.from({ length: 5 }, (_, i) => ({
        name: `Founder ${i + 1}`,
        capitalApporte: 100000,
        registrationFeesRate: 12.5,
        interestRate: 4.5,
        durationYears: 25,
        lotsOwned: [
          { lotId: i + 1, surface: 100, unitId: i + 1, isPortage: false, acquiredDate: new Date() }
        ]
      }));

      const coproLots: CoproLot[] = [];

      // With maxTotalLots = 5, should reject adding when at limit
      const result = validateAddPortageLot(participants, coproLots, 5);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Maximum of 5 total lots reached');

      // With maxTotalLots = 20, should allow adding
      const result2 = validateAddPortageLot(participants, coproLots, 20);
      expect(result2.isValid).toBe(true);
    });

    it('should reject adding when over limit', () => {
      const participants: Participant[] = Array.from({ length: 11 }, (_, i) => ({
        name: `Founder ${i + 1}`,
        capitalApporte: 100000,
        registrationFeesRate: 12.5,
        interestRate: 4.5,
        durationYears: 25,
        lotsOwned: [
          { lotId: i + 1, surface: 100, unitId: i + 1, isPortage: false, acquiredDate: new Date() }
        ]
      }));

      const coproLots: CoproLot[] = [];

      const result = validateAddPortageLot(participants, coproLots);
      expect(result.isValid).toBe(false);
    });

    it('should account for copropriété lots', () => {
      const participants: Participant[] = Array.from({ length: 9 }, (_, i) => ({
        name: `Founder ${i + 1}`,
        capitalApporte: 100000,
        registrationFeesRate: 12.5,
        interestRate: 4.5,
        durationYears: 25,
        lotsOwned: [
          { lotId: i + 1, surface: 100, unitId: i + 1, isPortage: false, acquiredDate: new Date() }
        ]
      }));

      const coproLots: CoproLot[] = [
        { lotId: 10, surface: 100, acquiredDate: new Date() }
      ];

      const result = validateAddPortageLot(participants, coproLots);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Maximum of 10 total lots reached');
    });
  });

  describe('validateAddCoproLot', () => {
    it('should allow adding when under limit', () => {
      const participants: Participant[] = [
        {
          name: 'Founder 1',
          capitalApporte: 100000,
          registrationFeesRate: 12.5,
          interestRate: 4.5,
          durationYears: 25,
          lotsOwned: [
            { lotId: 1, surface: 100, unitId: 1, isPortage: false, acquiredDate: new Date() }
          ]
        }
      ];

      const coproLots: CoproLot[] = [];

      const result = validateAddCoproLot(participants, coproLots);
      expect(result.isValid).toBe(true);
    });

    it('should reject adding when at limit', () => {
      const participants: Participant[] = Array.from({ length: 10 }, (_, i) => ({
        name: `Founder ${i + 1}`,
        capitalApporte: 100000,
        registrationFeesRate: 12.5,
        interestRate: 4.5,
        durationYears: 25,
        lotsOwned: [
          { lotId: i + 1, surface: 100, unitId: i + 1, isPortage: false, acquiredDate: new Date() }
        ]
      }));

      const coproLots: CoproLot[] = [];

      const result = validateAddCoproLot(participants, coproLots);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('copropriété lot');
      expect(result.error).toContain('Maximum of 10 total lots reached');
    });

    it('should respect custom maxTotalLots parameter', () => {
      const participants: Participant[] = Array.from({ length: 3 }, (_, i) => ({
        name: `Founder ${i + 1}`,
        capitalApporte: 100000,
        registrationFeesRate: 12.5,
        interestRate: 4.5,
        durationYears: 25,
        lotsOwned: [
          { lotId: i + 1, surface: 100, unitId: i + 1, isPortage: false, acquiredDate: new Date() }
        ]
      }));

      const coproLots: CoproLot[] = [];

      // With maxTotalLots = 3, should reject adding when at limit
      const result = validateAddCoproLot(participants, coproLots, 3);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Maximum of 3 total lots reached');

      // With maxTotalLots = 15, should allow adding
      const result2 = validateAddCoproLot(participants, coproLots, 15);
      expect(result2.isValid).toBe(true);
    });
  });
});

