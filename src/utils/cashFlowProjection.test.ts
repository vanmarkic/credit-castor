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
    notaryFeesRate: 0.125,
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
    scenario: {
      constructionCostChange: 0,
      infrastructureReduction: 0,
      purchasePriceReduction: 0,
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
  it('should create purchase transaction at deed date', () => {
    const events: DomainEvent[] = [createInitialPurchaseEvent(DEED_DATE)];

    const cashFlow = buildParticipantCashFlow(events, 'Alice');

    expect(cashFlow.participantName).toBe('Alice');
    expect(cashFlow.transactions.length).toBeGreaterThan(0);

    const purchase = cashFlow.transactions.find(t => t.type === 'LOT_PURCHASE');
    expect(purchase).toBeDefined();
    expect(purchase?.date).toEqual(DEED_DATE);
    expect(purchase?.amount).toBe(-170000); // Negative = cash out
    expect(purchase?.category).toBe('ONE_SHOT');
  });

  it('should create notary fees transaction at deed date', () => {
    const events: DomainEvent[] = [createInitialPurchaseEvent(DEED_DATE)];

    const cashFlow = buildParticipantCashFlow(events, 'Alice');

    const notaryFees = cashFlow.transactions.find(t => t.type === 'NOTARY_FEES');
    expect(notaryFees).toBeDefined();
    expect(notaryFees?.date).toEqual(DEED_DATE);
    expect(notaryFees?.amount).toBe(-21250);
    expect(notaryFees?.category).toBe('ONE_SHOT');
  });

  it('should generate monthly recurring expenses starting from deed date', () => {
    const events = [createInitialPurchaseEvent(DEED_DATE)];
    const endDate = new Date('2026-05-01'); // 3 months after deed

    const cashFlow = buildParticipantCashFlow(events, 'Alice', endDate);

    const loanPayments = cashFlow.transactions.filter(
      t => t.type === 'LOAN_PAYMENT'
    );

    // Should have loan payments for March, April, May (3 months)
    expect(loanPayments.length).toBeGreaterThanOrEqual(3);

    // First payment should be 1 month after deed
    expect(loanPayments[0].date).toEqual(new Date('2026-03-01'));
    expect(loanPayments[0].amount).toBeLessThan(0); // Cash out
    expect(loanPayments[0].category).toBe('RECURRING');
  });

  it('should track months since deed date in metadata', () => {
    const events = [createInitialPurchaseEvent(DEED_DATE)];
    const endDate = new Date('2026-05-01');

    const cashFlow = buildParticipantCashFlow(events, 'Alice', endDate);

    const firstLoan = cashFlow.transactions.find(t => t.type === 'LOAN_PAYMENT');
    expect(firstLoan?.metadata?.monthsSinceDeed).toBe(1);
  });

  it('should calculate running balance for all transactions', () => {
    const events = [createInitialPurchaseEvent(DEED_DATE)];
    const endDate = new Date('2026-05-01');

    const cashFlow = buildParticipantCashFlow(events, 'Alice', endDate);

    // All transactions should have running balance
    cashFlow.transactions.forEach((txn, idx) => {
      expect(txn.runningBalance).toBeDefined();

      if (idx > 0) {
        const previous = cashFlow.transactions[idx - 1];
        const expected = (previous.runningBalance || 0) + txn.amount;
        expect(txn.runningBalance).toBeCloseTo(expected, 2);
      }
    });
  });

  it('should calculate summary metrics correctly', () => {
    const events = [createInitialPurchaseEvent(DEED_DATE)];
    const endDate = new Date('2026-05-01');

    const cashFlow = buildParticipantCashFlow(events, 'Alice', endDate);

    expect(cashFlow.summary.totalInvested).toBeGreaterThan(0);
    expect(cashFlow.summary.totalReceived).toBe(0); // No income yet
    expect(cashFlow.summary.netPosition).toBeLessThan(0); // Negative position
    expect(cashFlow.summary.monthlyBurnRate).toBeGreaterThan(0);
  });

  it('should handle portage lots with carrying costs from deed date', () => {
    const deedDate = new Date('2026-02-01');
    const portageLot = createMockLot(2, true, deedDate);
    const bob = createMockParticipant('Bob', deedDate, [portageLot]);

    const event: InitialPurchaseEvent = {
      ...createInitialPurchaseEvent(deedDate),
      participants: [bob],
    };

    const endDate = new Date('2026-05-01');
    const cashFlow = buildParticipantCashFlow([event], 'Bob', endDate);

    // Portage lots should have loan interest payments
    const loanPayments = cashFlow.transactions.filter(t => t.type === 'LOAN_PAYMENT');
    expect(loanPayments.length).toBeGreaterThan(0);

    // Verify interest-only structure in metadata
    const firstPayment = loanPayments[0];
    expect(firstPayment.metadata?.principal).toBeDefined();
    expect(firstPayment.metadata?.interest).toBeDefined();
  });

  it('should return empty transactions for non-existent participant', () => {
    const events = [createInitialPurchaseEvent(DEED_DATE)];

    const cashFlow = buildParticipantCashFlow(events, 'NonExistent');

    expect(cashFlow.participantName).toBe('NonExistent');
    expect(cashFlow.transactions).toHaveLength(0);
    expect(cashFlow.summary.totalInvested).toBe(0);
    expect(cashFlow.summary.totalReceived).toBe(0);
  });

  it('should use current date as default endDate', () => {
    // Use a past deed date for this test
    const pastDeedDate = new Date('2024-01-01');
    const pastEvent = createInitialPurchaseEvent(pastDeedDate);

    // Don't specify endDate
    const cashFlow = buildParticipantCashFlow([pastEvent], 'Alice');

    // Should have many monthly payments (from 2024 to now)
    const loanPayments = cashFlow.transactions.filter(t => t.type === 'LOAN_PAYMENT');
    expect(loanPayments.length).toBeGreaterThan(10); // At least 10 months
  });
});
