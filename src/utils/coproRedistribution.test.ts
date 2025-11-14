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
      { name: 'Alice', isFounder: true, surface: 100, entryDate: new Date('2024-01-01') },
      { name: 'Bob', isFounder: true, surface: 120, entryDate: new Date('2024-01-01') },
      { name: 'Charlie', isFounder: true, surface: 80, entryDate: new Date('2024-01-01') }
    ];
    const saleDate = new Date('2024-06-01');

    const result = getEligibleParticipants(participants, saleDate, deedDate);

    expect(result).toHaveLength(3);
    expect(result.map(p => p.name)).toEqual(['Alice', 'Bob', 'Charlie']);
    result.forEach(p => {
      expect(p.surface).toBeGreaterThan(0);
    });
  });

  it('should only include founders, not newcomers', () => {
    const participants: ParticipantWithEntry[] = [
      { name: 'Alice', isFounder: true, surface: 100, entryDate: new Date('2024-01-01') }, // Founder
      { name: 'Bob', isFounder: false, surface: 90, entryDate: new Date('2024-03-01') },   // Newcomer (NOT eligible)
      { name: 'Charlie', isFounder: true, surface: 80, entryDate: new Date('2024-01-01') } // Founder
    ];
    const saleDate = new Date('2024-06-01');

    const result = getEligibleParticipants(participants, saleDate, deedDate);

    expect(result).toHaveLength(2); // Only Alice and Charlie (founders)
    expect(result.map(p => p.name)).toEqual(['Alice', 'Charlie']);

    // Alice should have larger surface than Charlie
    const alice = result.find(p => p.name === 'Alice')!;
    const charlie = result.find(p => p.name === 'Charlie')!;
    expect(alice.surface).toBeGreaterThan(charlie.surface);
  });

  it('should exclude founder entered after sale', () => {
    const participants: ParticipantWithEntry[] = [
      { name: 'Alice', isFounder: true, surface: 100, entryDate: new Date('2024-01-01') }, // Eligible
      { name: 'Bob', isFounder: true, surface: 120, entryDate: new Date('2024-08-01') },   // NOT eligible (after sale)
      { name: 'Charlie', isFounder: true, surface: 80, entryDate: new Date('2024-03-01') } // Eligible
    ];
    const saleDate = new Date('2024-06-01');

    const result = getEligibleParticipants(participants, saleDate, deedDate);

    expect(result).toHaveLength(2);
    expect(result.map(p => p.name)).toEqual(['Alice', 'Charlie']);
  });

  it('should exclude founder entered on exact sale date', () => {
    const participants: ParticipantWithEntry[] = [
      { name: 'Alice', isFounder: true, surface: 100, entryDate: new Date('2024-01-01') }, // Eligible
      { name: 'Bob', isFounder: true, surface: 120, entryDate: new Date('2024-06-01') }    // NOT eligible (same day)
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
      { name: 'Alice', isFounder: true, surface: 100, entryDate: undefined }, // Should use deedDate
      { name: 'Bob', isFounder: true, surface: 120, entryDate: new Date('2024-03-01') }
    ];
    const saleDate = new Date('2024-06-01');

    const result = getEligibleParticipants(participants, saleDate, deedDate);

    expect(result).toHaveLength(2);
    const alice = result.find(p => p.name === 'Alice')!;

    // Alice should have surface defined
    expect(alice.surface).toBe(100);
  });

  it('should include surface for each participant', () => {
    const participants: ParticipantWithEntry[] = [
      { name: 'Alice', isFounder: true, surface: 100, entryDate: new Date('2024-01-01') },
      { name: 'Bob', isFounder: true, surface: 120, entryDate: new Date('2024-02-01') }
    ];
    const saleDate = new Date('2024-04-01');

    const result = getEligibleParticipants(participants, saleDate, deedDate);

    const alice = result.find(p => p.name === 'Alice')!;
    const bob = result.find(p => p.name === 'Bob')!;

    // Alice: 100m²
    expect(alice.surface).toBe(100);
    // Bob: 120m²
    expect(bob.surface).toBe(120);
  });
});

// ============================================
// calculateShareRatio Tests
// ============================================

describe('calculateShareRatio', () => {
  it('should calculate equal surface (50/50 split)', () => {
    const result = calculateShareRatio(100, 200);
    expect(result).toBe(0.5);
  });

  it('should calculate different surfaces (proportional)', () => {
    const result = calculateShareRatio(80, 200);
    expect(result).toBe(0.4); // 80/200 = 0.4
  });

  it('should handle zero total surface (edge case)', () => {
    const result = calculateShareRatio(0, 0);
    expect(result).toBe(0);
  });

  it('should handle single participant (100%)', () => {
    const result = calculateShareRatio(12, 12);
    expect(result).toBe(1);
  });

  it('should handle fractional surfaces', () => {
    const result = calculateShareRatio(50, 200);
    expect(result).toBe(0.25);
  });

  it('should return 0 if participant has 0 surface', () => {
    const result = calculateShareRatio(0, 200);
    expect(result).toBe(0);
  });

  it('should handle very small surfaces', () => {
    const result = calculateShareRatio(1, 1000);
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
      isFounder: true,
      surface: 100,
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
    expect(result[0].amount).toBe(100000); // 100% share (sole founder)
    expect(result[0].shareRatio).toBe(1);
    expect(result[0].type).toBe('copro');
    expect(result[0].description).toContain('100.0%');
  });

  it('should calculate single sale, multiple participants with equal surface', () => {
    const alice: ParticipantWithEntry = {
      name: 'Alice',
      isFounder: true,
      surface: 100,
      entryDate: new Date('2024-01-01')
    };

    const bob: ParticipantWithEntry = {
      name: 'Bob',
      isFounder: true,
      surface: 100,
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
    expect(result[0].amount).toBeCloseTo(50000, 2); // 50% share (100/200)
    expect(result[0].shareRatio).toBeCloseTo(0.5, 2);
  });

  it('should calculate single sale, multiple participants with different surfaces', () => {
    const alice: ParticipantWithEntry = {
      name: 'Alice',
      isFounder: true,
      surface: 100, // 100m²
      entryDate: new Date('2024-01-01')
    };

    const bob: ParticipantWithEntry = {
      name: 'Bob',
      isFounder: true,
      surface: 120, // 120m²
      entryDate: new Date('2024-03-01')
    };

    const charlie: ParticipantWithEntry = {
      name: 'Charlie',
      isFounder: true,
      surface: 80, // 80m²
      entryDate: new Date('2024-04-01')
    };

    const coproSales: CoproSale[] = [
      {
        buyer: 'Dan',
        entryDate: new Date('2024-06-01'),
        amount: 100000
      }
    ];

    const allParticipants: ParticipantWithEntry[] = [alice, bob, charlie];

    // Calculate surface shares
    const totalSurface = 100 + 120 + 80; // 300m²
    const expectedRatio = 100 / totalSurface; // Alice: 100/300 = 0.333...

    const result = calculateCoproRedistributionForParticipant(
      alice,
      coproSales,
      allParticipants,
      deedDate
    );

    expect(result).toHaveLength(1);
    expect(result[0].shareRatio).toBeCloseTo(expectedRatio, 3);
    expect(result[0].amount).toBeCloseTo(100000 * expectedRatio, 2);
  });

  it('should calculate multiple sales over time', () => {
    const alice: ParticipantWithEntry = {
      name: 'Alice',
      isFounder: true,
      surface: 120, // 120m²
      entryDate: new Date('2024-01-01')
    };

    const bob: ParticipantWithEntry = {
      name: 'Bob',
      isFounder: true,
      surface: 80, // 80m²
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

    // First sale: Alice has 120/200 = 60% share
    expect(result[0].buyer).toBe('Dan');
    expect(result[0].amount).toBe(60000); // 60% of 100,000

    // Second sale: Same ratio (120/200 = 60%)
    expect(result[1].buyer).toBe('Eve');
    expect(result[1].amount).toBe(90000); // 60% of 150,000
  });

  it('should return empty array if participant not eligible for any sales', () => {
    const alice: ParticipantWithEntry = {
      name: 'Alice',
      isFounder: true,
      surface: 100,
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
      isFounder: true,
      surface: 100,
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
      isFounder: true,
      surface: 100,
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

  it('should include monthsInProject in result (deprecated, now 0)', () => {
    const alice: ParticipantWithEntry = {
      name: 'Alice',
      isFounder: true,
      surface: 100,
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

    // monthsInProject is now deprecated and set to 0 (surface-based distribution)
    expect(result[0].monthsInProject).toBe(0);
  });

  it('should handle real-world scenario from component', () => {
    // Scenario: 3 founders with equal surface, 1 copro sale
    const founders: ParticipantWithEntry[] = [
      { name: 'Alice', isFounder: true, surface: 100, entryDate: new Date('2024-01-01') },
      { name: 'Bob', isFounder: true, surface: 100, entryDate: new Date('2024-01-01') },
      { name: 'Charlie', isFounder: true, surface: 100, entryDate: new Date('2024-01-01') }
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

    // Each founder should get 1/3 of the sale (equal surfaces)
    expect(result[0].amount).toBeCloseTo(50000, 2);
    expect(result[0].shareRatio).toBeCloseTo(0.333, 2);
    expect(result[0].type).toBe('copro');
    expect(result[0].buyer).toBe('Dan');
  });

  it('should format description with percentage', () => {
    const alice: ParticipantWithEntry = {
      name: 'Alice',
      isFounder: true,
      surface: 100,
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

  it('should handle founder joining after first sale but before second', () => {
    const alice: ParticipantWithEntry = {
      name: 'Alice',
      isFounder: true,
      surface: 120, // 120m²
      entryDate: new Date('2024-01-01')
    };

    const bob: ParticipantWithEntry = {
      name: 'Bob',
      isFounder: true,
      surface: 80, // 80m²
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
    expect(aliceResult[1].amount).toBe(90000); // 120/(120+80) * 150000 = 60% of second sale

    // Bob should only get share from second sale
    expect(bobResult).toHaveLength(1);
    expect(bobResult[0].buyer).toBe('Eve');
    expect(bobResult[0].amount).toBe(60000); // 80/(120+80) * 150000 = 40% of second sale

    // Alice's share of second sale should be larger (she has more surface)
    expect(aliceResult[1].amount).toBeGreaterThan(bobResult[0].amount);
  });

  describe('Multiple newcomers buying at same date', () => {
    it('should distribute proceeds from both sales when 2 newcomers buy at same date', () => {
      // Setup: 2 founders with different surfaces
      const alice = {
        name: 'Alice',
        isFounder: true,
        surface: 100, // 100m²
        entryDate: new Date('2024-01-01')
      } as ParticipantWithEntry & { isFounder: boolean; surface: number };

      const bob = {
        name: 'Bob',
        isFounder: true,
        surface: 120, // 120m²
        entryDate: new Date('2024-01-01')
      } as ParticipantWithEntry & { isFounder: boolean; surface: number };

      // 2 newcomers buy from copropriété at the same date
      const sameDate = new Date('2024-06-01');
      const coproSales: CoproSale[] = [
        {
          buyer: 'Dan',
          entryDate: sameDate,
          amount: 100000 // First sale: 100k
        },
        {
          buyer: 'Eve',
          entryDate: sameDate,
          amount: 150000 // Second sale: 150k (same date)
        }
      ];

      const allParticipants: ParticipantWithEntry[] = [alice, bob];

      // Calculate redistributions for Alice
      const aliceResult = calculateCoproRedistributionForParticipant(
        alice,
        coproSales,
        allParticipants,
        deedDate
      );

      // Calculate redistributions for Bob
      const bobResult = calculateCoproRedistributionForParticipant(
        bob,
        coproSales,
        allParticipants,
        deedDate
      );

      // Both should receive redistributions from both sales
      expect(aliceResult).toHaveLength(2);
      expect(bobResult).toHaveLength(2);

      // Calculate expected shares
      // Total surface: 100 + 120 = 220m²
      // Alice's share ratio: 100/220 = 0.4545...
      // Bob's share ratio: 120/220 = 0.5454...

      const aliceShareRatio = 100 / 220;
      const bobShareRatio = 120 / 220;

      // Alice's proceeds from first sale
      const aliceFromSale1 = 100000 * aliceShareRatio;
      // Alice's proceeds from second sale
      const aliceFromSale2 = 150000 * aliceShareRatio;
      // Alice's total (sum of both)
      const aliceTotal = aliceFromSale1 + aliceFromSale2;

      // Bob's proceeds from first sale
      const bobFromSale1 = 100000 * bobShareRatio;
      // Bob's proceeds from second sale
      const bobFromSale2 = 150000 * bobShareRatio;
      // Bob's total (sum of both)
      const bobTotal = bobFromSale1 + bobFromSale2;

      // Verify Alice's individual redistributions
      expect(aliceResult[0].amount).toBeCloseTo(aliceFromSale1, 2);
      expect(aliceResult[1].amount).toBeCloseTo(aliceFromSale2, 2);
      expect(aliceResult[0].shareRatio).toBeCloseTo(aliceShareRatio, 3);
      expect(aliceResult[1].shareRatio).toBeCloseTo(aliceShareRatio, 3);

      // Verify Bob's individual redistributions
      expect(bobResult[0].amount).toBeCloseTo(bobFromSale1, 2);
      expect(bobResult[1].amount).toBeCloseTo(bobFromSale2, 2);
      expect(bobResult[0].shareRatio).toBeCloseTo(bobShareRatio, 3);
      expect(bobResult[1].shareRatio).toBeCloseTo(bobShareRatio, 3);

      // Verify totals (sum of prorated proceeds from each sale)
      const aliceTotalReceived = aliceResult.reduce((sum, r) => sum + r.amount, 0);
      const bobTotalReceived = bobResult.reduce((sum, r) => sum + r.amount, 0);

      expect(aliceTotalReceived).toBeCloseTo(aliceTotal, 2);
      expect(bobTotalReceived).toBeCloseTo(bobTotal, 2);

      // Verify that total distributed equals total sales (after applying coproReservesShare if applicable)
      // Note: In this test, we're using the full amount (coproReservesShare is applied elsewhere)
      const totalDistributed = aliceTotalReceived + bobTotalReceived;
      const totalSales = 100000 + 150000;
      expect(totalDistributed).toBeCloseTo(totalSales, 2);
    });

    it('should handle 2 newcomers at same date with 3 founders (unequal surfaces)', () => {
      const alice = {
        name: 'Alice',
        isFounder: true,
        surface: 100, // 100m²
        entryDate: new Date('2024-01-01')
      } as ParticipantWithEntry & { isFounder: boolean; surface: number };

      const bob = {
        name: 'Bob',
        isFounder: true,
        surface: 120, // 120m²
        entryDate: new Date('2024-01-01')
      } as ParticipantWithEntry & { isFounder: boolean; surface: number };

      const charlie = {
        name: 'Charlie',
        isFounder: true,
        surface: 80, // 80m²
        entryDate: new Date('2024-01-01')
      } as ParticipantWithEntry & { isFounder: boolean; surface: number };

      const sameDate = new Date('2024-06-01');
      const coproSales: CoproSale[] = [
        {
          buyer: 'Dan',
          entryDate: sameDate,
          amount: 200000
        },
        {
          buyer: 'Eve',
          entryDate: sameDate,
          amount: 300000
        }
      ];

      const allParticipants: ParticipantWithEntry[] = [alice, bob, charlie];

      // Total surface: 100 + 120 + 80 = 300m²
      const totalSurface = 300;
      const aliceRatio = 100 / totalSurface; // 0.333...
      const bobRatio = 120 / totalSurface;   // 0.4
      const charlieRatio = 80 / totalSurface; // 0.266...

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

      const charlieResult = calculateCoproRedistributionForParticipant(
        charlie,
        coproSales,
        allParticipants,
        deedDate
      );

      // All should receive from both sales
      expect(aliceResult).toHaveLength(2);
      expect(bobResult).toHaveLength(2);
      expect(charlieResult).toHaveLength(2);

      // Calculate expected totals (sum of prorated proceeds from each sale)
      const aliceTotal = (200000 * aliceRatio) + (300000 * aliceRatio);
      const bobTotal = (200000 * bobRatio) + (300000 * bobRatio);
      const charlieTotal = (200000 * charlieRatio) + (300000 * charlieRatio);

      // Verify totals
      const aliceReceived = aliceResult.reduce((sum, r) => sum + r.amount, 0);
      const bobReceived = bobResult.reduce((sum, r) => sum + r.amount, 0);
      const charlieReceived = charlieResult.reduce((sum, r) => sum + r.amount, 0);

      expect(aliceReceived).toBeCloseTo(aliceTotal, 2);
      expect(bobReceived).toBeCloseTo(bobTotal, 2);
      expect(charlieReceived).toBeCloseTo(charlieTotal, 2);

      // Verify Bob gets the most (largest surface), Charlie gets the least
      expect(bobReceived).toBeGreaterThan(aliceReceived);
      expect(aliceReceived).toBeGreaterThan(charlieReceived);

      // Verify all redistributions sum to total sales
      const totalDistributed = aliceReceived + bobReceived + charlieReceived;
      expect(totalDistributed).toBeCloseTo(500000, 2); // 200k + 300k
    });

    it('should handle 2 newcomers at same date with equal surface founders', () => {
      const alice = {
        name: 'Alice',
        isFounder: true,
        surface: 100,
        entryDate: new Date('2024-01-01')
      } as ParticipantWithEntry & { isFounder: boolean; surface: number };

      const bob = {
        name: 'Bob',
        isFounder: true,
        surface: 100,
        entryDate: new Date('2024-01-01')
      } as ParticipantWithEntry & { isFounder: boolean; surface: number };

      const sameDate = new Date('2024-06-01');
      const coproSales: CoproSale[] = [
        {
          buyer: 'Dan',
          entryDate: sameDate,
          amount: 100000
        },
        {
          buyer: 'Eve',
          entryDate: sameDate,
          amount: 200000
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

      // Both should get equal shares (50/50)
      expect(aliceResult).toHaveLength(2);
      expect(bobResult).toHaveLength(2);

      // Each should get 50% of each sale
      expect(aliceResult[0].amount).toBeCloseTo(50000, 2); // 50% of 100k
      expect(aliceResult[1].amount).toBeCloseTo(100000, 2); // 50% of 200k
      expect(bobResult[0].amount).toBeCloseTo(50000, 2);
      expect(bobResult[1].amount).toBeCloseTo(100000, 2);

      // Totals should be equal
      const aliceTotal = aliceResult.reduce((sum, r) => sum + r.amount, 0);
      const bobTotal = bobResult.reduce((sum, r) => sum + r.amount, 0);
      expect(aliceTotal).toBeCloseTo(bobTotal, 2);
      expect(aliceTotal).toBeCloseTo(150000, 2); // 50k + 100k
    });

    it('should verify each sale is processed independently with same proration ratio', () => {
      // When sales happen at the same date, the eligible participants are the same
      // So each participant should get the same share ratio from both sales
      const alice = {
        name: 'Alice',
        isFounder: true,
        surface: 75,
        entryDate: new Date('2024-01-01')
      } as ParticipantWithEntry & { isFounder: boolean; surface: number };

      const bob = {
        name: 'Bob',
        isFounder: true,
        surface: 125,
        entryDate: new Date('2024-01-01')
      } as ParticipantWithEntry & { isFounder: boolean; surface: number };

      const sameDate = new Date('2024-06-01');
      const coproSales: CoproSale[] = [
        {
          buyer: 'Dan',
          entryDate: sameDate,
          amount: 50000 // Smaller sale
        },
        {
          buyer: 'Eve',
          entryDate: sameDate,
          amount: 200000 // Larger sale
        }
      ];

      const allParticipants: ParticipantWithEntry[] = [alice, bob];

      const aliceResult = calculateCoproRedistributionForParticipant(
        alice,
        coproSales,
        allParticipants,
        deedDate
      );

      // Total surface: 75 + 125 = 200m²
      // Alice's ratio: 75/200 = 0.375
      const expectedRatio = 75 / 200;

      // Both redistributions should have the same share ratio
      expect(aliceResult[0].shareRatio).toBeCloseTo(expectedRatio, 3);
      expect(aliceResult[1].shareRatio).toBeCloseTo(expectedRatio, 3);

      // But different amounts (proportional to sale amounts)
      expect(aliceResult[0].amount).toBeCloseTo(50000 * expectedRatio, 2);
      expect(aliceResult[1].amount).toBeCloseTo(200000 * expectedRatio, 2);

      // Total should be sum of both
      const total = aliceResult.reduce((sum, r) => sum + r.amount, 0);
      expect(total).toBeCloseTo((50000 + 200000) * expectedRatio, 2);
    });
  });
});
