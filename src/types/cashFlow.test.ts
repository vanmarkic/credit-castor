/**
 * Tests for Cash Flow Transaction Types
 *
 * Following TDD approach from continuous-timeline-implementation.md
 */

import { describe, it, expect } from 'vitest';
import type { CashFlowTransaction } from './cashFlow';

describe('CashFlowTransaction types', () => {
  it('should represent lot purchase transaction at deed date', () => {
    const txn: CashFlowTransaction = {
      id: 'txn-001',
      participantName: 'Alice',
      date: new Date('2026-02-01'), // Deed date
      type: 'LOT_PURCHASE',
      category: 'ONE_SHOT',
      amount: -191250, // Negative = cash out
      description: 'Purchase of lot #1 (deed date)',
      metadata: {
        lotId: 1,
        purchasePrice: 170000,
        notaryFees: 21250,
      },
    };
    expect(txn.date).toEqual(new Date('2026-02-01'));
    expect(txn.amount).toBeLessThan(0);
    expect(txn.category).toBe('ONE_SHOT');
  });

  it('should represent monthly loan payment starting from deed date', () => {
    const txn: CashFlowTransaction = {
      id: 'txn-002',
      participantName: 'Alice',
      date: new Date('2026-03-01'), // First payment: 1 month after deed
      type: 'LOAN_PAYMENT',
      category: 'RECURRING',
      amount: -714,
      description: 'Monthly loan payment (Mar 2026)',
      metadata: {
        principal: 447,
        interest: 267,
        lotId: 1,
        monthsSinceDeed: 1,
      },
    };
    expect(txn.category).toBe('RECURRING');
    expect(txn.metadata?.monthsSinceDeed).toBe(1);
  });

  it('should represent lot sale proceeds', () => {
    const txn: CashFlowTransaction = {
      id: 'txn-003',
      participantName: 'Bob',
      date: new Date('2028-01-01'),
      type: 'LOT_SALE',
      category: 'ONE_SHOT',
      amount: 195000,
      description: 'Sale of lot #2 to Emma',
      metadata: {
        lotId: 2,
        buyer: 'Emma',
        salePrice: 195000,
        monthsHeld: 23, // From deed date to sale date
      },
    };
    expect(txn.amount).toBeGreaterThan(0);
  });

  it('should represent copro contribution', () => {
    const txn: CashFlowTransaction = {
      id: 'txn-004',
      participantName: 'Alice',
      date: new Date('2026-06-15'),
      type: 'COPRO_CONTRIBUTION',
      category: 'ONE_SHOT',
      amount: -5000,
      description: 'Share of roof repair costs',
      metadata: {
        workType: 'roof_repair',
        totalCost: 15000,
        share: 0.333,
      },
    };
    expect(txn.type).toBe('COPRO_CONTRIBUTION');
  });

  it('should represent redistribution from hidden lot sale', () => {
    const txn: CashFlowTransaction = {
      id: 'txn-005',
      participantName: 'Alice',
      date: new Date('2027-03-01'),
      type: 'REDISTRIBUTION',
      category: 'ONE_SHOT',
      amount: 65000,
      description: 'Share of hidden lot #10 sale',
      metadata: {
        lotId: 10,
        totalSalePrice: 195000,
        quotite: 0.333,
      },
    };
    expect(txn.amount).toBeGreaterThan(0);
  });
});
