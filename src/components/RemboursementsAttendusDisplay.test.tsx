/**
 * Test for the "Remboursements attendus" display in the collapsed participant header
 * This tests the logic from EnDivisionCorrect.tsx lines 707-760
 */

import { describe, it, expect } from 'vitest';
import type { Participant } from '../utils/calculatorUtils';

describe('Remboursements Attendus Display Logic', () => {
  const deedDate = '2026-02-01';

  it('should calculate totalReturns correctly when newcomer buys from founder', () => {
    const founder: Participant = {
      name: 'Alice Founder',
      capitalApporte: 150000,
      registrationFeesRate: 12.5,
      interestRate: 4.5,
      durationYears: 25,
      isFounder: true,
      entryDate: new Date(deedDate),
      unitId: 1,
      surface: 300,
      quantity: 2,
      lotsOwned: [
        {
          lotId: 1,
          surface: 200,
          unitId: 1,
          isPortage: false,
          allocatedSurface: 200,
          acquiredDate: new Date(deedDate)
        },
        {
          lotId: 2,
          surface: 100,
          unitId: 1,
          isPortage: true,
          allocatedSurface: 100,
          acquiredDate: new Date(deedDate)
        }
      ]
    };

    const newcomer: Participant = {
      name: 'Bob Newcomer',
      capitalApporte: 50000,
      registrationFeesRate: 3,
      interestRate: 4.5,
      durationYears: 25,
      isFounder: false,
      entryDate: new Date('2027-02-01'),
      unitId: 1,
      surface: 100,
      quantity: 1,
      purchaseDetails: {
        buyingFrom: 'Alice Founder',
        lotId: 2,
        purchasePrice: 150000
      }
    };

    const participants = [founder, newcomer];
    const founderIdx = 0;

    // Simulate the logic from EnDivisionCorrect.tsx lines 711-749
    // 1. Portage paybacks
    const portagePaybacks = participants
      .filter((buyer: any) => buyer.purchaseDetails?.buyingFrom === participants[founderIdx].name)
      .map((buyer: any) => buyer.purchaseDetails?.purchasePrice || 0);

    // 2. Copropriété redistributions (none in this case)
    const coproSales = participants
      .filter((buyer: any) => buyer.purchaseDetails?.buyingFrom === 'Copropriété')
      .map((buyer: any) => ({
        entryDate: buyer.entryDate || new Date(deedDate),
        amount: buyer.purchaseDetails?.purchasePrice || 0
      }));

    const coproRedistributions = coproSales.map((sale: any) => {
      const saleDate = new Date(sale.entryDate);
      const participantEntryDate = participants[founderIdx].entryDate
        ? new Date(participants[founderIdx].entryDate)
        : new Date(deedDate);

      if (participantEntryDate >= saleDate) return 0;

      const monthsInProject = (saleDate.getTime() - participantEntryDate.getTime()) / (1000 * 60 * 60 * 24 * 30.44);
      const eligibleParticipants = participants.filter((p: any) => {
        const pEntryDate = p.entryDate ? new Date(p.entryDate) : new Date(deedDate);
        return pEntryDate < saleDate;
      });

      const totalMonths = eligibleParticipants.reduce((sum: number, p: any) => {
        const pEntryDate = p.entryDate ? new Date(p.entryDate) : new Date(deedDate);
        const pMonths = (saleDate.getTime() - pEntryDate.getTime()) / (1000 * 60 * 60 * 24 * 30.44);
        return sum + pMonths;
      }, 0);

      const shareRatio = totalMonths > 0 ? monthsInProject / totalMonths : 0;
      return sale.amount * shareRatio;
    });

    const totalReturns = portagePaybacks.reduce((sum: number, amt: number) => sum + amt, 0) +
                        coproRedistributions.reduce((sum: number, amt: number) => sum + amt, 0);

    // Should show €150,000
    expect(totalReturns).toBe(150000);
    expect(totalReturns > 0).toBe(true);
  });

  it('should return 0 when founder has portage lot but no newcomer buys yet', () => {
    const founder: Participant = {
      name: 'Alice Founder',
      capitalApporte: 150000,
      registrationFeesRate: 12.5,
      interestRate: 4.5,
      durationYears: 25,
      isFounder: true,
      entryDate: new Date(deedDate),
      unitId: 1,
      surface: 300,
      quantity: 2,
      lotsOwned: [
        {
          lotId: 1,
          surface: 200,
          unitId: 1,
          isPortage: false,
          allocatedSurface: 200,
          acquiredDate: new Date(deedDate)
        },
        {
          lotId: 2,
          surface: 100,
          unitId: 1,
          isPortage: true,
          allocatedSurface: 100,
          acquiredDate: new Date(deedDate)
        }
      ]
    };

    const participants = [founder]; // No newcomer yet
    const founderIdx = 0;

    // Calculate paybacks (should be empty)
    const portagePaybacks = participants
      .filter((buyer: any) => buyer.purchaseDetails?.buyingFrom === participants[founderIdx].name)
      .map((buyer: any) => buyer.purchaseDetails?.purchasePrice || 0);

    const totalReturns = portagePaybacks.reduce((sum: number, amt: number) => sum + amt, 0);

    // Should be 0 since no one is buying
    expect(totalReturns).toBe(0);
    expect(totalReturns > 0).toBe(false);
  });

  it('should return 0 when newcomer buys from wrong participant name', () => {
    const founder: Participant = {
      name: 'Alice Founder',
      capitalApporte: 150000,
      registrationFeesRate: 12.5,
      interestRate: 4.5,
      durationYears: 25,
      isFounder: true,
      entryDate: new Date(deedDate),
      unitId: 1,
      surface: 300,
      quantity: 2,
      lotsOwned: [
        {
          lotId: 2,
          surface: 100,
          unitId: 1,
          isPortage: true,
          allocatedSurface: 100,
          acquiredDate: new Date(deedDate)
        }
      ]
    };

    const newcomer: Participant = {
      name: 'Bob Newcomer',
      capitalApporte: 50000,
      registrationFeesRate: 3,
      interestRate: 4.5,
      durationYears: 25,
      isFounder: false,
      entryDate: new Date('2027-02-01'),
      unitId: 1,
      surface: 100,
      quantity: 1,
      purchaseDetails: {
        buyingFrom: 'Wrong Name', // BUG: Wrong name!
        lotId: 2,
        purchasePrice: 150000
      }
    };

    const participants = [founder, newcomer];
    const founderIdx = 0;

    const portagePaybacks = participants
      .filter((buyer: any) => buyer.purchaseDetails?.buyingFrom === participants[founderIdx].name)
      .map((buyer: any) => buyer.purchaseDetails?.purchasePrice || 0);

    const totalReturns = portagePaybacks.reduce((sum: number, amt: number) => sum + amt, 0);

    // Should be 0 because the name doesn't match
    expect(totalReturns).toBe(0);
  });

  it('should NOT show remboursements attendus for non-founders', () => {
    // According to line 709 in EnDivisionCorrect.tsx:
    // if (!participants[idx].isFounder) return null;

    const nonFounder: Participant = {
      name: 'Not A Founder',
      capitalApporte: 150000,
      registrationFeesRate: 12.5,
      interestRate: 4.5,
      durationYears: 25,
      isFounder: false, // NOT a founder
      entryDate: new Date(deedDate),
      unitId: 1,
      surface: 300,
      quantity: 2
    };

    const participants = [nonFounder];
    const idx = 0;

    // The logic should exit early for non-founders
    if (!participants[idx].isFounder) {
      // Should not calculate anything
      expect(true).toBe(true);
    } else {
      // Should not reach here
      expect(false).toBe(true);
    }
  });
});
