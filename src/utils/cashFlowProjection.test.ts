/**
 * Cash Flow Projection Tests (Phase 2.2)
 *
 * Tests for buildParticipantCashFlow() function
 * Generates complete cash flow from events starting at deed date
 */

import { describe, it, expect } from 'vitest';
import { buildParticipantCashFlow } from './cashFlowProjection';
import type { DomainEvent, InitialPurchaseEvent, Lot } from '../types/timeline';
import type { Participant } from './calculatorUtils';

// ============================================
// Test Fixtures
// ============================================

const DEED_DATE = new Date('2026-02-01');

function createMockParticipant(name: string, deedDate: Date, lotsOwned: Lot[]): Participant {
  return {
    name,
    isFounder: true,
    entryDate: deedDate,
    lotsOwned,
    capitalApporte: 50000,
    registrationFeesRate: 0.125,
    interestRate: 0.04,
    durationYears: 20,
  };
}

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

function createInitialPurchaseEvent(deedDate: Date): InitialPurchaseEvent {
  const lot = createMockLot(1, false, deedDate);
  const alice = createMockParticipant('Alice', deedDate, [lot]);

  return {
    id: 'evt-001',
    date: deedDate,
    type: 'INITIAL_PURCHASE',
    participants: [alice],
    projectParams: {
      totalPurchase: 170000,
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
    copropropriete: {
      name: 'Les Acacias',
      hiddenLots: [],
    },
  };
}

// ============================================
// Tests
// ============================================

describe('buildParticipantCashFlow from deed date', () => {
  it('should return empty transactions for non-existent participant', () => {
    const events = [createInitialPurchaseEvent(DEED_DATE)];

    const cashFlow = buildParticipantCashFlow(events, 'NonExistent');

    expect(cashFlow.participantName).toBe('NonExistent');
    expect(cashFlow.transactions).toHaveLength(0);
    expect(cashFlow.summary.totalInvested).toBe(0);
    expect(cashFlow.summary.totalReceived).toBe(0);
  });
});
