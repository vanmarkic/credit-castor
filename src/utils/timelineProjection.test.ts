/**
 * Timeline Projection Tests (Phase 2.3 & 2.4)
 *
 * Tests for:
 * - buildParticipantTimeline() - Individual participant journey
 * - projectContinuousTimeline() - Complete project timeline
 */

import { describe, it, expect } from 'vitest';
import { buildParticipantTimeline, projectContinuousTimeline } from './timelineProjection';
import type { DomainEvent, InitialPurchaseEvent, Lot } from '../types/timeline';
import type { Participant } from './calculatorUtils';

// ============================================
// Test Fixtures
// ============================================

const DEED_DATE = new Date('2026-02-01');

function createMockLot(lotId: number, isPortage: boolean, acquiredDate: Date): Lot {
  return {
    lotId,
    surface: 85,
    unitId: 101,
    isPortage,
    acquiredDate,
    originalPrice: 170000,
    originalNotaryFees: 21250,
    monthlyCarryingCost: isPortage ? 500 : undefined,
  };
}

function createMockParticipant(name: string, deedDate: Date, lotsOwned: Lot[]): Participant {
  return {
    name,
    isFounder: true,
    entryDate: deedDate,
    lotsOwned,
    capitalApporte: 50000,
    notaryFeesRate: 0.125,
    interestRate: 0.04,
    durationYears: 20,
  };
}

function createInitialPurchaseEvent(deedDate: Date, participants: Participant[]): InitialPurchaseEvent {
  return {
    id: 'evt-001',
    date: deedDate,
    type: 'INITIAL_PURCHASE',
    participants,
    projectParams: {
      totalPurchase: 340000,
      mesuresConservatoires: 0,
      demolition: 0,
      infrastructures: 0,
      etudesPreparatoires: 0,
      fraisEtudesPreparatoires: 0,
      fraisGeneraux3ans: 0,
      batimentFondationConservatoire: 0,
      batimentFondationComplete: 0,
      batimentCoproConservatoire: 0,
      globalCascoPerM2: 0,
    },
    scenario: {
      constructionCostChange: 0,
      infrastructureReduction: 0,
      purchasePriceReduction: 0,
    },
    copropropriete: {
      name: 'Les Acacias',
      hiddenLots: [10, 11],
    },
  };
}

// ============================================
// Phase 2.3: buildParticipantTimeline Tests
// ============================================

describe('buildParticipantTimeline', () => {
  it('should project founder at deed date', () => {
    const lot = createMockLot(1, false, DEED_DATE);
    const alice = createMockParticipant('Alice', DEED_DATE, [lot]);
    const events: DomainEvent[] = [createInitialPurchaseEvent(DEED_DATE, [alice])];

    const timeline = buildParticipantTimeline(events, 'Alice');

    expect(timeline.participant.name).toBe('Alice');
    expect(timeline.participant.isFounder).toBe(true);
    expect(timeline.participant.entryDate).toEqual(DEED_DATE);
    expect(timeline.status).toBe('ACTIVE');
  });

  it('should include cash flow starting from deed date', () => {
    const lot = createMockLot(1, false, DEED_DATE);
    const alice = createMockParticipant('Alice', DEED_DATE, [lot]);
    const events = [createInitialPurchaseEvent(DEED_DATE, [alice])];

    const timeline = buildParticipantTimeline(events, 'Alice');

    expect(timeline.cashFlow).toBeDefined();
    expect(timeline.cashFlow.transactions.length).toBeGreaterThan(0);

    // First transaction should be at deed date
    const firstTxn = timeline.cashFlow.transactions[0];
    expect(firstTxn.date).toEqual(DEED_DATE);
  });

  it('should track lot acquisition at deed date', () => {
    const lot = createMockLot(1, false, DEED_DATE);
    const alice = createMockParticipant('Alice', DEED_DATE, [lot]);
    const events = [createInitialPurchaseEvent(DEED_DATE, [alice])];

    const timeline = buildParticipantTimeline(events, 'Alice');

    expect(timeline.lotsHistory).toHaveLength(1);
    expect(timeline.lotsHistory[0].acquiredDate).toEqual(DEED_DATE);
    expect(timeline.lotsHistory[0].lotId).toBe(1);
    expect(timeline.currentLots).toHaveLength(1);
  });

  it('should track portage status correctly', () => {
    const ownLot = createMockLot(1, false, DEED_DATE);
    const portageLot = createMockLot(2, true, DEED_DATE);
    const bob = createMockParticipant('Bob', DEED_DATE, [ownLot, portageLot]);
    const events = [createInitialPurchaseEvent(DEED_DATE, [bob])];

    const timeline = buildParticipantTimeline(events, 'Bob');

    expect(timeline.status).toBe('PORTAGE'); // Has at least one portage lot
    expect(timeline.currentLots).toHaveLength(2);
  });

  it('should include all relevant events', () => {
    const lot = createMockLot(1, false, DEED_DATE);
    const alice = createMockParticipant('Alice', DEED_DATE, [lot]);
    const events = [createInitialPurchaseEvent(DEED_DATE, [alice])];

    const timeline = buildParticipantTimeline(events, 'Alice');

    expect(timeline.events).toHaveLength(1);
    expect(timeline.events[0].type).toBe('INITIAL_PURCHASE');
  });

  it('should return empty timeline for non-existent participant', () => {
    const lot = createMockLot(1, false, DEED_DATE);
    const alice = createMockParticipant('Alice', DEED_DATE, [lot]);
    const events = [createInitialPurchaseEvent(DEED_DATE, [alice])];

    const timeline = buildParticipantTimeline(events, 'NonExistent');

    expect(timeline.participant.name).toBe('NonExistent');
    expect(timeline.events).toHaveLength(0);
    expect(timeline.lotsHistory).toHaveLength(0);
    expect(timeline.currentLots).toHaveLength(0);
    expect(timeline.status).toBe('ACTIVE');
  });
});

// ============================================
// Phase 2.4: projectContinuousTimeline Tests
// ============================================

describe('projectContinuousTimeline', () => {
  it('should create timeline with deed date as T0', () => {
    const lot1 = createMockLot(1, false, DEED_DATE);
    const lot2 = createMockLot(2, false, DEED_DATE);
    const alice = createMockParticipant('Alice', DEED_DATE, [lot1]);
    const bob = createMockParticipant('Bob', DEED_DATE, [lot2]);
    const events: DomainEvent[] = [createInitialPurchaseEvent(DEED_DATE, [alice, bob])];

    const timeline = projectContinuousTimeline(events);

    expect(timeline.deedDate).toEqual(DEED_DATE);
    expect(timeline.participants).toHaveLength(2);
  });

  it('should include cash flow for each participant from deed date', () => {
    const lot1 = createMockLot(1, false, DEED_DATE);
    const lot2 = createMockLot(2, false, DEED_DATE);
    const alice = createMockParticipant('Alice', DEED_DATE, [lot1]);
    const bob = createMockParticipant('Bob', DEED_DATE, [lot2]);
    const events = [createInitialPurchaseEvent(DEED_DATE, [alice, bob])];

    const timeline = projectContinuousTimeline(events);

    timeline.participants.forEach(p => {
      expect(p.cashFlow).toBeDefined();

      if (p.participant.isFounder) {
        // Founders should have transactions starting at deed date
        const firstTxn = p.cashFlow.transactions[0];
        expect(firstTxn.date).toEqual(DEED_DATE);
      }
    });
  });

  it('should track copropriété entity', () => {
    const lot = createMockLot(1, false, DEED_DATE);
    const alice = createMockParticipant('Alice', DEED_DATE, [lot]);
    const events = [createInitialPurchaseEvent(DEED_DATE, [alice])];

    const timeline = projectContinuousTimeline(events);

    expect(timeline.copropropriete).toBeDefined();
    expect(timeline.copropropriete.name).toBe('Les Acacias');
    expect(timeline.copropropriete.lotsOwned).toHaveLength(2); // Hidden lots
  });

  it('should preserve all events', () => {
    const lot = createMockLot(1, false, DEED_DATE);
    const alice = createMockParticipant('Alice', DEED_DATE, [lot]);
    const events = [createInitialPurchaseEvent(DEED_DATE, [alice])];

    const timeline = projectContinuousTimeline(events);

    expect(timeline.events).toHaveLength(1);
    expect(timeline.events[0].type).toBe('INITIAL_PURCHASE');
  });

  it('should handle empty events array', () => {
    const timeline = projectContinuousTimeline([]);

    expect(timeline.deedDate).toBeInstanceOf(Date);
    expect(timeline.participants).toHaveLength(0);
    expect(timeline.events).toHaveLength(0);
  });

  it('should extract deed date from first INITIAL_PURCHASE event', () => {
    const customDeedDate = new Date('2027-06-15');
    const lot = createMockLot(1, false, customDeedDate);
    const alice = createMockParticipant('Alice', customDeedDate, [lot]);
    const events = [createInitialPurchaseEvent(customDeedDate, [alice])];

    const timeline = projectContinuousTimeline(events);

    expect(timeline.deedDate).toEqual(customDeedDate);
  });
});
