import { describe, it, expect } from 'vitest';
import type { Participant } from './calculatorUtils';

/**
 * Calculate portage paybacks for a given participant
 * Returns array of buyers purchasing from this participant with dates and amounts
 */
function calculatePortagePaybacks(
  participants: Participant[],
  sellerName: string,
  deedDate: string
): Array<{ buyer: string; date: Date; amount: number }> {
  return participants
    .filter(p => p.purchaseDetails?.buyingFrom === sellerName)
    .map(p => ({
      buyer: p.name,
      date: p.entryDate || new Date(deedDate),
      amount: p.purchaseDetails?.purchasePrice || 0
    }))
    .sort((a, b) => a.date.getTime() - b.date.getTime());
}

/**
 * Calculate copropri�t� redistribution for a given participant
 * Share is based on time in project (months from entry to sale)
 */
function calculateCoproRedistribution(
  participants: Participant[],
  participantIndex: number,
  deedDate: string
): Array<{ buyer: string; saleDate: Date; totalAmount: number; shareAmount: number; shareRatio: number; monthsInProject: number }> {
  const participant = participants[participantIndex];
  const participantEntryDate = participant.entryDate
    ? new Date(participant.entryDate)
    : new Date(deedDate);

  // Find all copropri�t� sales
  const coproSales = participants
    .filter(p => p.purchaseDetails?.buyingFrom === 'Copropri�t�')
    .map(p => ({
      buyer: p.name,
      saleDate: p.entryDate || new Date(deedDate),
      amount: p.purchaseDetails?.purchasePrice || 0
    }));

  return coproSales
    .map(sale => {
      // Only participants who entered before sale get a share
      if (participantEntryDate >= sale.saleDate) {
        return null;
      }

      // Calculate months in project until sale
      const monthsInProject = (sale.saleDate.getTime() - participantEntryDate.getTime()) / (1000 * 60 * 60 * 24 * 30.44);

      // Calculate total months for all eligible participants
      const eligibleParticipants = participants.filter(p => {
        const pEntryDate = p.entryDate ? new Date(p.entryDate) : new Date(deedDate);
        return pEntryDate < sale.saleDate;
      });

      const totalMonths = eligibleParticipants.reduce((sum, p) => {
        const pEntryDate = p.entryDate ? new Date(p.entryDate) : new Date(deedDate);
        const pMonths = (sale.saleDate.getTime() - pEntryDate.getTime()) / (1000 * 60 * 60 * 24 * 30.44);
        return sum + pMonths;
      }, 0);

      // Calculate share
      const shareRatio = totalMonths > 0 ? monthsInProject / totalMonths : 0;
      const shareAmount = sale.amount * shareRatio;

      return {
        buyer: sale.buyer,
        saleDate: sale.saleDate,
        totalAmount: sale.amount,
        shareAmount,
        shareRatio,
        monthsInProject: Math.round(monthsInProject)
      };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null);
}

describe('Portage Payback Calculations', () => {
  it('should calculate when a founder gets paid back for portage', () => {
    const deedDate = '2025-01-01';
    const participants: Participant[] = [
      {
        name: 'Alice',
        surface: 100,
        unitId: 1,
        capitalApporte: 100000,
        notaryFeesRate: 12.5,
        interestRate: 4.5,
        durationYears: 25,
        isFounder: true,
        entryDate: new Date(deedDate)
      },
      {
        name: 'Bob',
        surface: 120,
        unitId: 2,
        capitalApporte: 50000,
        notaryFeesRate: 12.5,
        interestRate: 4.5,
        durationYears: 25,
        isFounder: false,
        entryDate: new Date('2027-06-01'),
        purchaseDetails: {
          buyingFrom: 'Alice',
          lotId: 2,
          purchasePrice: 200000
        }
      }
    ];

    const paybacks = calculatePortagePaybacks(participants, 'Alice', deedDate);

    expect(paybacks).toHaveLength(1);
    expect(paybacks[0].buyer).toBe('Bob');
    expect(paybacks[0].amount).toBe(200000);
    expect(paybacks[0].date).toEqual(new Date('2027-06-01'));
  });

  it('should calculate multiple portage paybacks chronologically', () => {
    const deedDate = '2025-01-01';
    const participants: Participant[] = [
      {
        name: 'Alice',
        surface: 100,
        unitId: 1,
        capitalApporte: 100000,
        notaryFeesRate: 12.5,
        interestRate: 4.5,
        durationYears: 25,
        isFounder: true,
        entryDate: new Date(deedDate)
      },
      {
        name: 'Bob',
        surface: 120,
        unitId: 2,
        capitalApporte: 50000,
        notaryFeesRate: 12.5,
        interestRate: 4.5,
        durationYears: 25,
        isFounder: false,
        entryDate: new Date('2027-06-01'),
        purchaseDetails: {
          buyingFrom: 'Alice',
          lotId: 2,
          purchasePrice: 200000
        }
      },
      {
        name: 'Carol',
        surface: 110,
        unitId: 3,
        capitalApporte: 80000,
        notaryFeesRate: 12.5,
        interestRate: 4.5,
        durationYears: 25,
        isFounder: false,
        entryDate: new Date('2028-01-15'),
        purchaseDetails: {
          buyingFrom: 'Alice',
          lotId: 3,
          purchasePrice: 180000
        }
      }
    ];

    const paybacks = calculatePortagePaybacks(participants, 'Alice', deedDate);

    expect(paybacks).toHaveLength(2);
    // Should be chronologically sorted
    expect(paybacks[0].buyer).toBe('Bob');
    expect(paybacks[0].amount).toBe(200000);
    expect(paybacks[1].buyer).toBe('Carol');
    expect(paybacks[1].amount).toBe(180000);
  });

  it('should return empty array if no one buys from the participant', () => {
    const deedDate = '2025-01-01';
    const participants: Participant[] = [
      {
        name: 'Alice',
        surface: 100,
        unitId: 1,
        capitalApporte: 100000,
        notaryFeesRate: 12.5,
        interestRate: 4.5,
        durationYears: 25,
        isFounder: true,
        entryDate: new Date(deedDate)
      },
      {
        name: 'Bob',
        surface: 120,
        unitId: 2,
        capitalApporte: 50000,
        notaryFeesRate: 12.5,
        interestRate: 4.5,
        durationYears: 25,
        isFounder: false,
        entryDate: new Date('2027-06-01'),
        purchaseDetails: {
          buyingFrom: 'Copropriété',
          lotId: 100,
          purchasePrice: 200000
        }
      }
    ];

    const paybacks = calculatePortagePaybacks(participants, 'Alice', deedDate);

    expect(paybacks).toHaveLength(0);
  });

  it('should calculate total payback amount correctly', () => {
    const deedDate = '2025-01-01';
    const participants: Participant[] = [
      {
        name: 'Alice',
        surface: 100,
        unitId: 1,
        capitalApporte: 100000,
        notaryFeesRate: 12.5,
        interestRate: 4.5,
        durationYears: 25,
        isFounder: true,
        entryDate: new Date(deedDate)
      },
      {
        name: 'Bob',
        surface: 120,
        unitId: 2,
        capitalApporte: 50000,
        notaryFeesRate: 12.5,
        interestRate: 4.5,
        durationYears: 25,
        isFounder: false,
        entryDate: new Date('2027-06-01'),
        purchaseDetails: {
          buyingFrom: 'Alice',
          lotId: 2,
          purchasePrice: 200000
        }
      },
      {
        name: 'Carol',
        surface: 110,
        unitId: 3,
        capitalApporte: 80000,
        notaryFeesRate: 12.5,
        interestRate: 4.5,
        durationYears: 25,
        isFounder: false,
        entryDate: new Date('2028-01-15'),
        purchaseDetails: {
          buyingFrom: 'Alice',
          lotId: 3,
          purchasePrice: 180000
        }
      }
    ];

    const paybacks = calculatePortagePaybacks(participants, 'Alice', deedDate);
    const totalPayback = paybacks.reduce((sum, p) => sum + p.amount, 0);

    expect(totalPayback).toBe(380000);
  });
});

describe('Copropri�t� Redistribution Calculations', () => {
  it('should calculate 50/50 split for two founders with equal time', () => {
    const deedDate = '2025-01-01';
    const participants: Participant[] = [
      {
        name: 'Alice',
        surface: 100,
        unitId: 1,
        capitalApporte: 100000,
        notaryFeesRate: 12.5,
        interestRate: 4.5,
        durationYears: 25,
        isFounder: true,
        entryDate: new Date(deedDate)
      },
      {
        name: 'Bob',
        surface: 120,
        unitId: 2,
        capitalApporte: 150000,
        notaryFeesRate: 12.5,
        interestRate: 4.5,
        durationYears: 25,
        isFounder: true,
        entryDate: new Date(deedDate)
      },
      {
        name: 'Carol',
        surface: 110,
        unitId: 3,
        capitalApporte: 80000,
        notaryFeesRate: 12.5,
        interestRate: 4.5,
        durationYears: 25,
        isFounder: false,
        entryDate: new Date('2027-06-01'),
        purchaseDetails: {
          buyingFrom: 'Copropriété',
          lotId: 100,
          purchasePrice: 200000
        }
      }
    ];

    // Alice's share
    const aliceRedist = calculateCoproRedistribution(participants, 0, deedDate);
    expect(aliceRedist).toHaveLength(1);
    expect(aliceRedist[0].buyer).toBe('Carol');
    expect(aliceRedist[0].totalAmount).toBe(200000);
    expect(aliceRedist[0].shareRatio).toBeCloseTo(0.5, 2); // 50%
    expect(aliceRedist[0].shareAmount).toBeCloseTo(100000, 0);

    // Bob's share
    const bobRedist = calculateCoproRedistribution(participants, 1, deedDate);
    expect(bobRedist).toHaveLength(1);
    expect(bobRedist[0].shareRatio).toBeCloseTo(0.5, 2); // 50%
    expect(bobRedist[0].shareAmount).toBeCloseTo(100000, 0);
  });

  it('should exclude newcomers who join after the sale', () => {
    const deedDate = '2025-01-01';
    const participants: Participant[] = [
      {
        name: 'Alice',
        surface: 100,
        unitId: 1,
        capitalApporte: 100000,
        notaryFeesRate: 12.5,
        interestRate: 4.5,
        durationYears: 25,
        isFounder: true,
        entryDate: new Date(deedDate)
      },
      {
        name: 'Bob',
        surface: 120,
        unitId: 2,
        capitalApporte: 150000,
        notaryFeesRate: 12.5,
        interestRate: 4.5,
        durationYears: 25,
        isFounder: true,
        entryDate: new Date(deedDate)
      },
      {
        name: 'Carol',
        surface: 110,
        unitId: 3,
        capitalApporte: 80000,
        notaryFeesRate: 12.5,
        interestRate: 4.5,
        durationYears: 25,
        isFounder: false,
        entryDate: new Date('2027-06-01'),
        purchaseDetails: {
          buyingFrom: 'Copropriété',
          lotId: 100,
          purchasePrice: 200000
        }
      },
      {
        name: 'Dave',
        surface: 90,
        unitId: 4,
        capitalApporte: 70000,
        notaryFeesRate: 12.5,
        interestRate: 4.5,
        durationYears: 25,
        isFounder: false,
        entryDate: new Date('2028-01-01') // After Carol's purchase
      }
    ];

    // Dave should get nothing (entered after the copro sale)
    const daveRedist = calculateCoproRedistribution(participants, 3, deedDate);
    expect(daveRedist).toHaveLength(0);
  });

  it('should calculate pro-rata based on time in project', () => {
    const deedDate = '2025-01-01';
    const participants: Participant[] = [
      {
        name: 'Alice',
        surface: 100,
        unitId: 1,
        capitalApporte: 100000,
        notaryFeesRate: 12.5,
        interestRate: 4.5,
        durationYears: 25,
        isFounder: true,
        entryDate: new Date(deedDate) // 30 months before sale
      },
      {
        name: 'Bob',
        surface: 120,
        unitId: 2,
        capitalApporte: 150000,
        notaryFeesRate: 12.5,
        interestRate: 4.5,
        durationYears: 25,
        isFounder: false,
        entryDate: new Date('2026-01-01') // 18 months before sale (joined 1 year after Alice)
      },
      {
        name: 'Carol',
        surface: 110,
        unitId: 3,
        capitalApporte: 80000,
        notaryFeesRate: 12.5,
        interestRate: 4.5,
        durationYears: 25,
        isFounder: false,
        entryDate: new Date('2027-07-01'), // Sale date
        purchaseDetails: {
          buyingFrom: 'Copropriété',
          lotId: 100,
          purchasePrice: 240000
        }
      }
    ];

    // Alice: 30 months, Bob: 18 months, Total: 48 months
    // Alice should get 30/48 = 62.5%
    // Bob should get 18/48 = 37.5%

    const aliceRedist = calculateCoproRedistribution(participants, 0, deedDate);
    expect(aliceRedist[0].shareRatio).toBeCloseTo(0.625, 2); // 62.5%
    // Actual value depends on precise month calculation, verify it's approximately correct
    expect(aliceRedist[0].shareAmount).toBeGreaterThan(149000);
    expect(aliceRedist[0].shareAmount).toBeLessThan(151000);

    const bobRedist = calculateCoproRedistribution(participants, 1, deedDate);
    expect(bobRedist[0].shareRatio).toBeCloseTo(0.375, 2); // 37.5%
    expect(bobRedist[0].shareAmount).toBeGreaterThan(89000);
    expect(bobRedist[0].shareAmount).toBeLessThan(91000);
  });

  it('should handle multiple copropri�t� sales', () => {
    const deedDate = '2025-01-01';
    const participants: Participant[] = [
      {
        name: 'Alice',
        surface: 100,
        unitId: 1,
        capitalApporte: 100000,
        notaryFeesRate: 12.5,
        interestRate: 4.5,
        durationYears: 25,
        isFounder: true,
        entryDate: new Date(deedDate)
      },
      {
        name: 'Bob',
        surface: 120,
        unitId: 2,
        capitalApporte: 150000,
        notaryFeesRate: 12.5,
        interestRate: 4.5,
        durationYears: 25,
        isFounder: true,
        entryDate: new Date(deedDate)
      },
      {
        name: 'Carol',
        surface: 110,
        unitId: 3,
        capitalApporte: 80000,
        notaryFeesRate: 12.5,
        interestRate: 4.5,
        durationYears: 25,
        isFounder: false,
        entryDate: new Date('2027-06-01'),
        purchaseDetails: {
          buyingFrom: 'Copropriété',
          lotId: 100,
          purchasePrice: 200000
        }
      },
      {
        name: 'Dave',
        surface: 90,
        unitId: 4,
        capitalApporte: 70000,
        notaryFeesRate: 12.5,
        interestRate: 4.5,
        durationYears: 25,
        isFounder: false,
        entryDate: new Date('2028-01-01'),
        purchaseDetails: {
          buyingFrom: 'Copropriété',
          lotId: 100,
          purchasePrice: 180000
        }
      }
    ];

    const aliceRedist = calculateCoproRedistribution(participants, 0, deedDate);
    expect(aliceRedist).toHaveLength(2); // Two copro sales

    const totalAliceShare = aliceRedist.reduce((sum, r) => sum + r.shareAmount, 0);
    expect(totalAliceShare).toBeGreaterThan(0);
  });

  it('should verify total redistribution equals sale price', () => {
    const deedDate = '2025-01-01';
    const participants: Participant[] = [
      {
        name: 'Alice',
        surface: 100,
        unitId: 1,
        capitalApporte: 100000,
        notaryFeesRate: 12.5,
        interestRate: 4.5,
        durationYears: 25,
        isFounder: true,
        entryDate: new Date(deedDate)
      },
      {
        name: 'Bob',
        surface: 120,
        unitId: 2,
        capitalApporte: 150000,
        notaryFeesRate: 12.5,
        interestRate: 4.5,
        durationYears: 25,
        isFounder: true,
        entryDate: new Date(deedDate)
      },
      {
        name: 'Carol',
        surface: 110,
        unitId: 3,
        capitalApporte: 80000,
        notaryFeesRate: 12.5,
        interestRate: 4.5,
        durationYears: 25,
        isFounder: false,
        entryDate: new Date('2027-06-01'),
        purchaseDetails: {
          buyingFrom: 'Copropriété',
          lotId: 100,
          purchasePrice: 200000
        }
      }
    ];

    const aliceRedist = calculateCoproRedistribution(participants, 0, deedDate);
    const bobRedist = calculateCoproRedistribution(participants, 1, deedDate);

    const totalRedistributed = aliceRedist[0].shareAmount + bobRedist[0].shareAmount;
    const salePrice = 200000;

    // Total should equal sale price (within rounding error)
    expect(totalRedistributed).toBeCloseTo(salePrice, 0);
  });
});
