/**
 * Tests for Copropriété Redistribution (Time-Based)
 *
 * Black box testing approach - testing behavior, not implementation.
 * Tests cover business rules, edge cases, and real-world scenarios.
 */

import { describe, it, expect } from 'vitest';
import {
  calculateMonthsBetween,
  getEligibleParticipants,
  calculateShareRatio,
  calculateCoproRedistributionForParticipant,
  type CoproSale,
  type ParticipantWithEntry
} from './coproRedistribution';

// ============================================
// calculateMonthsBetween Tests
// ============================================

describe('calculateMonthsBetween', () => {
  it('should calculate exact months (1 month)', () => {
    const start = new Date('2024-01-01');
    const end = new Date('2024-02-01');
    const result = calculateMonthsBetween(start, end);
    // 31 days / 30.44 days per month ≈ 1.018 months
    expect(result).toBeCloseTo(1.018, 2);
  });

  it('should calculate exact months (3 months)', () => {
    const start = new Date('2024-01-01');
    const end = new Date('2024-04-01');
    const result = calculateMonthsBetween(start, end);
    // 91 days (Jan 31 + Feb 29 [leap year] + Mar 31) / 30.44 ≈ 2.989 months
    expect(result).toBeCloseTo(2.989, 2);
  });

  it('should calculate fractional months', () => {
    const start = new Date('2024-01-01');
    const end = new Date('2024-01-16');
    const result = calculateMonthsBetween(start, end);
    // 15 days / 30.44 ≈ 0.493 months
    expect(result).toBeCloseTo(0.493, 2);
  });

  it('should return 0 for same date', () => {
    const date = new Date('2024-01-01');
    const result = calculateMonthsBetween(date, date);
    expect(result).toBe(0);
  });

  it('should handle 1 day difference', () => {
    const start = new Date('2024-01-01');
    const end = new Date('2024-01-02');
    const result = calculateMonthsBetween(start, end);
    // 1 day / 30.44 ≈ 0.0328 months
    expect(result).toBeCloseTo(0.0328, 3);
  });

  it('should handle leap year correctly', () => {
    // Feb 2024 has 29 days (leap year)
    const start = new Date('2024-02-01');
    const end = new Date('2024-03-01');
    const result = calculateMonthsBetween(start, end);
    // 29 days / 30.44 ≈ 0.953 months
    expect(result).toBeCloseTo(0.953, 2);
  });

  it('should handle negative time (end before start)', () => {
    const start = new Date('2024-02-01');
    const end = new Date('2024-01-01');
    const result = calculateMonthsBetween(start, end);
    // Should return negative value (≈ -1.018)
    expect(result).toBeLessThan(0);
    expect(result).toBeCloseTo(-1.018, 2);
  });

  it('should handle 12 months (1 year)', () => {
    const start = new Date('2024-01-01');
    const end = new Date('2025-01-01');
    const result = calculateMonthsBetween(start, end);
    // 366 days (leap year) / 30.44 ≈ 12.026 months
    expect(result).toBeCloseTo(12.026, 2);
  });
});

// ============================================
// getEligibleParticipants Tests
// ============================================

describe('getEligibleParticipants', () => {
  const deedDate = new Date('2024-01-01');

  it('should include all founders entered before sale', () => {
    const participants: ParticipantWithEntry[] = [
      { name: 'Alice', entryDate: new Date('2024-01-01') },
      { name: 'Bob', entryDate: new Date('2024-01-01') },
      { name: 'Charlie', entryDate: new Date('2024-01-01') }
    ];
    const saleDate = new Date('2024-06-01');

    const result = getEligibleParticipants(participants, saleDate, deedDate);

    expect(result).toHaveLength(3);
    expect(result.map(p => p.name)).toEqual(['Alice', 'Bob', 'Charlie']);
    result.forEach(p => {
      expect(p.monthsInProject).toBeGreaterThan(0);
    });
  });

  it('should mix founders and eligible newcomers', () => {
    const participants: ParticipantWithEntry[] = [
      { name: 'Alice', entryDate: new Date('2024-01-01') }, // Founder
      { name: 'Bob', entryDate: new Date('2024-03-01') },   // Newcomer (eligible)
      { name: 'Charlie', entryDate: new Date('2024-01-01') } // Founder
    ];
    const saleDate = new Date('2024-06-01');

    const result = getEligibleParticipants(participants, saleDate, deedDate);

    expect(result).toHaveLength(3);
    expect(result.map(p => p.name)).toEqual(['Alice', 'Bob', 'Charlie']);

    // Alice should have more months than Bob
    const alice = result.find(p => p.name === 'Alice')!;
    const bob = result.find(p => p.name === 'Bob')!;
    expect(alice.monthsInProject).toBeGreaterThan(bob.monthsInProject);
  });

  it('should exclude newcomer entered after sale', () => {
    const participants: ParticipantWithEntry[] = [
      { name: 'Alice', entryDate: new Date('2024-01-01') }, // Eligible
      { name: 'Bob', entryDate: new Date('2024-08-01') },   // NOT eligible (after sale)
      { name: 'Charlie', entryDate: new Date('2024-03-01') } // Eligible
    ];
    const saleDate = new Date('2024-06-01');

    const result = getEligibleParticipants(participants, saleDate, deedDate);

    expect(result).toHaveLength(2);
    expect(result.map(p => p.name)).toEqual(['Alice', 'Charlie']);
  });

  it('should exclude newcomer entered on exact sale date', () => {
    const participants: ParticipantWithEntry[] = [
      { name: 'Alice', entryDate: new Date('2024-01-01') }, // Eligible
      { name: 'Bob', entryDate: new Date('2024-06-01') }    // NOT eligible (same day)
    ];
    const saleDate = new Date('2024-06-01');

    const result = getEligibleParticipants(participants, saleDate, deedDate);

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Alice');
  });

  it('should handle empty participants list', () => {
    const participants: ParticipantWithEntry[] = [];
    const saleDate = new Date('2024-06-01');

    const result = getEligibleParticipants(participants, saleDate, deedDate);

    expect(result).toHaveLength(0);
  });

  it('should use deedDate as default for missing entryDate', () => {
    const participants: ParticipantWithEntry[] = [
      { name: 'Alice', entryDate: undefined }, // Should use deedDate
      { name: 'Bob', entryDate: new Date('2024-03-01') }
    ];
    const saleDate = new Date('2024-06-01');

    const result = getEligibleParticipants(participants, saleDate, deedDate);

    expect(result).toHaveLength(2);
    const alice = result.find(p => p.name === 'Alice')!;

    // Alice should have months from deedDate to saleDate
    const expectedMonths = calculateMonthsBetween(deedDate, saleDate);
    expect(alice.monthsInProject).toBeCloseTo(expectedMonths, 2);
  });

  it('should calculate correct monthsInProject for each participant', () => {
    const participants: ParticipantWithEntry[] = [
      { name: 'Alice', entryDate: new Date('2024-01-01') },
      { name: 'Bob', entryDate: new Date('2024-02-01') }
    ];
    const saleDate = new Date('2024-04-01');

    const result = getEligibleParticipants(participants, saleDate, deedDate);

    const alice = result.find(p => p.name === 'Alice')!;
    const bob = result.find(p => p.name === 'Bob')!;

    // Alice: 2024-01-01 to 2024-04-01 = ~2.989 months
    expect(alice.monthsInProject).toBeCloseTo(2.989, 2);
    // Bob: 2024-02-01 to 2024-04-01 = ~1.971 months
    expect(bob.monthsInProject).toBeCloseTo(1.971, 2);
  });
});

// ============================================
// calculateShareRatio Tests
// ============================================

describe('calculateShareRatio', () => {
  it('should calculate equal time (50/50 split)', () => {
    const result = calculateShareRatio(5, 10);
    expect(result).toBe(0.5);
  });

  it('should calculate different times (proportional)', () => {
    const result = calculateShareRatio(3, 10);
    expect(result).toBe(0.3);
  });

  it('should handle zero total months (edge case)', () => {
    const result = calculateShareRatio(0, 0);
    expect(result).toBe(0);
  });

  it('should handle single participant (100%)', () => {
    const result = calculateShareRatio(12, 12);
    expect(result).toBe(1);
  });

  it('should handle fractional months', () => {
    const result = calculateShareRatio(2.5, 10);
    expect(result).toBe(0.25);
  });

  it('should return 0 if participant has 0 months', () => {
    const result = calculateShareRatio(0, 10);
    expect(result).toBe(0);
  });

  it('should handle very small fractions', () => {
    const result = calculateShareRatio(0.1, 100);
    expect(result).toBe(0.001);
  });
});

// ============================================
// calculateCoproRedistributionForParticipant Tests
// ============================================

describe('calculateCoproRedistributionForParticipant', () => {
  const deedDate = new Date('2024-01-01');

  it('should calculate single sale, single eligible participant', () => {
    const participant: ParticipantWithEntry = {
      name: 'Alice',
      entryDate: new Date('2024-01-01')
    };

    const coproSales: CoproSale[] = [
      {
        buyer: 'Dan',
        entryDate: new Date('2024-06-01'),
        amount: 100000
      }
    ];

    const allParticipants: ParticipantWithEntry[] = [participant];

    const result = calculateCoproRedistributionForParticipant(
      participant,
      coproSales,
      allParticipants,
      deedDate
    );

    expect(result).toHaveLength(1);
    expect(result[0].buyer).toBe('Dan');
    expect(result[0].amount).toBe(100000); // 100% share
    expect(result[0].shareRatio).toBe(1);
    expect(result[0].type).toBe('copro');
    expect(result[0].description).toContain('100.0%');
  });

  it('should calculate single sale, multiple participants with equal time', () => {
    const alice: ParticipantWithEntry = {
      name: 'Alice',
      entryDate: new Date('2024-01-01')
    };

    const bob: ParticipantWithEntry = {
      name: 'Bob',
      entryDate: new Date('2024-01-01')
    };

    const coproSales: CoproSale[] = [
      {
        buyer: 'Dan',
        entryDate: new Date('2024-06-01'),
        amount: 100000
      }
    ];

    const allParticipants: ParticipantWithEntry[] = [alice, bob];

    const result = calculateCoproRedistributionForParticipant(
      alice,
      coproSales,
      allParticipants,
      deedDate
    );

    expect(result).toHaveLength(1);
    expect(result[0].amount).toBeCloseTo(50000, 2); // 50% share
    expect(result[0].shareRatio).toBeCloseTo(0.5, 2);
  });

  it('should calculate single sale, multiple participants with different entry times', () => {
    const alice: ParticipantWithEntry = {
      name: 'Alice',
      entryDate: new Date('2024-01-01') // 5 months before sale
    };

    const bob: ParticipantWithEntry = {
      name: 'Bob',
      entryDate: new Date('2024-03-01') // 3 months before sale
    };

    const charlie: ParticipantWithEntry = {
      name: 'Charlie',
      entryDate: new Date('2024-04-01') // 2 months before sale
    };

    const coproSales: CoproSale[] = [
      {
        buyer: 'Dan',
        entryDate: new Date('2024-06-01'),
        amount: 100000
      }
    ];

    const allParticipants: ParticipantWithEntry[] = [alice, bob, charlie];

    // Calculate months for each
    const aliceMonths = calculateMonthsBetween(alice.entryDate!, new Date('2024-06-01'));
    const bobMonths = calculateMonthsBetween(bob.entryDate!, new Date('2024-06-01'));
    const charlieMonths = calculateMonthsBetween(charlie.entryDate!, new Date('2024-06-01'));
    const totalMonths = aliceMonths + bobMonths + charlieMonths;

    const result = calculateCoproRedistributionForParticipant(
      alice,
      coproSales,
      allParticipants,
      deedDate
    );

    expect(result).toHaveLength(1);

    const expectedRatio = aliceMonths / totalMonths;
    expect(result[0].shareRatio).toBeCloseTo(expectedRatio, 3);
    expect(result[0].amount).toBeCloseTo(100000 * expectedRatio, 2);
  });

  it('should calculate multiple sales over time', () => {
    const alice: ParticipantWithEntry = {
      name: 'Alice',
      entryDate: new Date('2024-01-01')
    };

    const bob: ParticipantWithEntry = {
      name: 'Bob',
      entryDate: new Date('2024-03-01')
    };

    const coproSales: CoproSale[] = [
      {
        buyer: 'Dan',
        entryDate: new Date('2024-06-01'),
        amount: 100000
      },
      {
        buyer: 'Eve',
        entryDate: new Date('2024-09-01'),
        amount: 150000
      }
    ];

    const allParticipants: ParticipantWithEntry[] = [alice, bob];

    const result = calculateCoproRedistributionForParticipant(
      alice,
      coproSales,
      allParticipants,
      deedDate
    );

    expect(result).toHaveLength(2);

    // First sale: Alice has more time than Bob
    expect(result[0].buyer).toBe('Dan');
    expect(result[0].amount).toBeGreaterThan(50000); // More than 50%

    // Second sale: Time gap has closed somewhat
    expect(result[1].buyer).toBe('Eve');
    expect(result[1].amount).toBeGreaterThan(0);
  });

  it('should return empty array if participant not eligible for any sales', () => {
    const alice: ParticipantWithEntry = {
      name: 'Alice',
      entryDate: new Date('2024-08-01') // After both sales
    };

    const coproSales: CoproSale[] = [
      {
        buyer: 'Dan',
        entryDate: new Date('2024-06-01'),
        amount: 100000
      },
      {
        buyer: 'Eve',
        entryDate: new Date('2024-07-01'),
        amount: 150000
      }
    ];

    const allParticipants: ParticipantWithEntry[] = [alice];

    const result = calculateCoproRedistributionForParticipant(
      alice,
      coproSales,
      allParticipants,
      deedDate
    );

    expect(result).toHaveLength(0);
  });

  it('should handle empty sales list', () => {
    const alice: ParticipantWithEntry = {
      name: 'Alice',
      entryDate: new Date('2024-01-01')
    };

    const result = calculateCoproRedistributionForParticipant(
      alice,
      [],
      [alice],
      deedDate
    );

    expect(result).toHaveLength(0);
  });

  it('should handle participant with missing entryDate (uses deedDate)', () => {
    const alice: ParticipantWithEntry = {
      name: 'Alice',
      entryDate: undefined // Should use deedDate
    };

    const coproSales: CoproSale[] = [
      {
        buyer: 'Dan',
        entryDate: new Date('2024-06-01'),
        amount: 100000
      }
    ];

    const allParticipants: ParticipantWithEntry[] = [alice];

    const result = calculateCoproRedistributionForParticipant(
      alice,
      coproSales,
      allParticipants,
      deedDate
    );

    expect(result).toHaveLength(1);
    expect(result[0].amount).toBe(100000); // 100% share
  });

  it('should include monthsInProject in result', () => {
    const alice: ParticipantWithEntry = {
      name: 'Alice',
      entryDate: new Date('2024-01-01')
    };

    const coproSales: CoproSale[] = [
      {
        buyer: 'Dan',
        entryDate: new Date('2024-06-01'),
        amount: 100000
      }
    ];

    const result = calculateCoproRedistributionForParticipant(
      alice,
      coproSales,
      [alice],
      deedDate
    );

    expect(result[0].monthsInProject).toBeGreaterThan(0);
    const expectedMonths = calculateMonthsBetween(new Date('2024-01-01'), new Date('2024-06-01'));
    expect(result[0].monthsInProject).toBeCloseTo(expectedMonths, 2);
  });

  it('should handle real-world scenario from component', () => {
    // Scenario: 3 founders, 1 copro sale
    const founders: ParticipantWithEntry[] = [
      { name: 'Alice', entryDate: new Date('2024-01-01') },
      { name: 'Bob', entryDate: new Date('2024-01-01') },
      { name: 'Charlie', entryDate: new Date('2024-01-01') }
    ];

    const coproSales: CoproSale[] = [
      {
        buyer: 'Dan',
        entryDate: new Date('2024-07-01'),
        amount: 150000
      }
    ];

    const result = calculateCoproRedistributionForParticipant(
      founders[0],
      coproSales,
      founders,
      deedDate
    );

    expect(result).toHaveLength(1);

    // Each founder should get 1/3 of the sale
    expect(result[0].amount).toBeCloseTo(50000, 2);
    expect(result[0].shareRatio).toBeCloseTo(0.333, 2);
    expect(result[0].type).toBe('copro');
    expect(result[0].buyer).toBe('Dan');
  });

  it('should format description with percentage', () => {
    const alice: ParticipantWithEntry = {
      name: 'Alice',
      entryDate: new Date('2024-01-01')
    };

    const coproSales: CoproSale[] = [
      {
        buyer: 'Dan',
        entryDate: new Date('2024-06-01'),
        amount: 100000
      }
    ];

    const result = calculateCoproRedistributionForParticipant(
      alice,
      coproSales,
      [alice],
      deedDate
    );

    expect(result[0].description).toBe('Part copropriété (100.0%)');
  });

  it('should handle newcomer joining after first sale but before second', () => {
    const alice: ParticipantWithEntry = {
      name: 'Alice',
      entryDate: new Date('2024-01-01')
    };

    const bob: ParticipantWithEntry = {
      name: 'Bob',
      entryDate: new Date('2024-07-01') // After first sale
    };

    const coproSales: CoproSale[] = [
      {
        buyer: 'Dan',
        entryDate: new Date('2024-06-01'),
        amount: 100000
      },
      {
        buyer: 'Eve',
        entryDate: new Date('2024-12-01'),
        amount: 150000
      }
    ];

    const allParticipants: ParticipantWithEntry[] = [alice, bob];

    const aliceResult = calculateCoproRedistributionForParticipant(
      alice,
      coproSales,
      allParticipants,
      deedDate
    );

    const bobResult = calculateCoproRedistributionForParticipant(
      bob,
      coproSales,
      allParticipants,
      deedDate
    );

    // Alice should get share from both sales
    expect(aliceResult).toHaveLength(2);
    expect(aliceResult[0].amount).toBe(100000); // 100% of first sale (only eligible participant)
    expect(aliceResult[1].amount).toBeGreaterThan(0); // Share of second sale

    // Bob should only get share from second sale
    expect(bobResult).toHaveLength(1);
    expect(bobResult[0].buyer).toBe('Eve');
    expect(bobResult[0].amount).toBeGreaterThan(0);

    // Alice's share of second sale should be larger (she has more time)
    expect(aliceResult[1].amount).toBeGreaterThan(bobResult[0].amount);
  });
});
