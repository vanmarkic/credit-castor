/**
 * Tests for Timeline Types
 *
 * Following TDD approach from continuous-timeline-implementation.md
 */

import { describe, it, expect } from 'vitest';
import type { Lot, CoproLot, InitialPurchaseEvent } from './timeline';
import type { ProjectParams, Scenario } from '../utils/calculatorUtils';

describe('Lot type', () => {
  it('should track lot ownership with acquisition date', () => {
    const lot: Lot = {
      lotId: 1,
      surface: 85,
      unitId: 101,
      isPortage: false,
      acquiredDate: new Date('2026-02-01'), // Deed date
    };
    expect(lot.acquiredDate).toEqual(new Date('2026-02-01'));
    expect(lot.isPortage).toBe(false);
  });

  it('should track sold lots with carrying costs based on holding duration', () => {
    const lot: Lot = {
      lotId: 2,
      surface: 85,
      unitId: 101,
      isPortage: true,
      acquiredDate: new Date('2026-02-01'), // Initial deed date
      soldDate: new Date('2028-02-01'), // Sold 24 months later
      soldTo: 'Emma',
      salePrice: 195000,
      carryingCosts: 12000, // 24 months of costs
    };

    const monthsHeld = 24;
    expect(lot.carryingCosts).toBe(500 * monthsHeld);
  });
});

describe('CoproLot type', () => {
  it('should track copropriété lot with deed date and carrying costs', () => {
    const coproLot: CoproLot = {
      lotId: 10,
      surface: 85,
      acquiredDate: new Date('2026-02-01'), // Initial deed date
      soldDate: new Date('2028-02-01'),
      soldTo: 'Emma',
      salePrice: 195000,
      totalCarryingCosts: 6000, // 24 months of copro costs
    };
    expect(coproLot.acquiredDate).toEqual(new Date('2026-02-01'));
    expect(coproLot.totalCarryingCosts).toBe(6000);
  });
});

describe('Event type unification', () => {
  it('should use Participant directly in InitialPurchaseEvent with deed date', () => {
    const deedDate = new Date('2026-02-01');
    const event: InitialPurchaseEvent = {
      id: 'evt-001',
      date: deedDate, // Event date = deed date
      type: 'INITIAL_PURCHASE',
      participants: [
        {
          name: 'Alice',
          isFounder: true,
          entryDate: deedDate, // Entry date = deed date for founders
          lotsOwned: [{
            lotId: 1,
            surface: 85,
            unitId: 101,
            isPortage: false,
            acquiredDate: deedDate, // Lot acquired at deed date
          }],
          capitalApporte: 50000,
          notaryFeesRate: 0.125,
          interestRate: 0.04,
          durationYears: 20,
        },
      ],
      projectParams: {} as ProjectParams,
      scenario: {} as Scenario,
      copropropriete: { name: 'Les Acacias', hiddenLots: [] },
    };
    expect(event.date).toEqual(deedDate);
    expect(event.participants[0].isFounder).toBe(true);
    expect(event.participants[0].entryDate).toEqual(deedDate);
    expect(event.participants[0].lotsOwned?.[0].acquiredDate).toEqual(deedDate);
  });
});
