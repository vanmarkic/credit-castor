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
 * Calculate copropriété redistribution for a given participant
 * Share is based on time in project (months from entry to sale)
 */
// @ts-expect-error - Function defined for future use
function calculateCoproRedistribution(
  participants: Participant[],
  participantIndex: number,
  deedDate: string
): Array<{ buyer: string; saleDate: Date; totalAmount: number; shareAmount: number; shareRatio: number; monthsInProject: number }> {
  const participant = participants[participantIndex];
  const participantEntryDate = participant.entryDate
    ? new Date(participant.entryDate)
    : new Date(deedDate);

  // Find all copropriété sales
  const coproSales = participants
    .filter(p => p.purchaseDetails?.buyingFrom === 'Copropriété')
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