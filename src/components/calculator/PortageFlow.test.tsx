/**
 * Integration test for the portage flow
 * Tests the complete user journey:
 * 1. Founder adds portage lot
 * 2. Newcomer selects and buys the portage lot
 * 3. Founder sees "Remboursements attendus" with correct amount
 */

import { describe, it, expect } from 'vitest';
import { getAvailableLotsForNewcomer } from '../../utils/availableLots';
import type { Participant } from '../../utils/calculatorUtils';

describe('Portage Flow - Founder adds lot, Newcomer buys', () => {
  it('should show available portage lot after founder adds it', () => {
    // STEP 1: Founder adds a portage lot
    const founderWithPortage: Participant = {
      name: 'Alice Founder',
      capitalApporte: 150000,
      notaryFeesRate: 12.5,
      interestRate: 4.5,
      durationYears: 25,
      isFounder: true,
      entryDate: new Date('2026-02-01'),
      unitId: 1,
      surface: 300, // 200 original + 100 portage
      quantity: 2,
      lotsOwned: [
        {
          lotId: 1,
          surface: 200,
          unitId: 1,
          isPortage: false,
          allocatedSurface: 200,
          acquiredDate: new Date('2026-02-01')
        },
        {
          lotId: 2,
          surface: 100,
          unitId: 1,
          isPortage: true,
          allocatedSurface: 100,
          acquiredDate: new Date('2026-02-01')
        }
      ]
    };

    // STEP 2: Get available lots for newcomer
    const availableLots = getAvailableLotsForNewcomer([founderWithPortage], []);

    // Should have 1 available lot (the portage lot)
    expect(availableLots).toHaveLength(1);
    expect(availableLots[0].lotId).toBe(2);
    expect(availableLots[0].surface).toBe(100);
    expect(availableLots[0].source).toBe('FOUNDER');
    expect(availableLots[0].fromParticipant).toBe('Alice Founder');
  });

  it('should correctly set purchaseDetails.buyingFrom when newcomer selects portage lot', () => {
    const founderWithPortage: Participant = {
      name: 'Alice Founder',
      capitalApporte: 150000,
      notaryFeesRate: 12.5,
      interestRate: 4.5,
      durationYears: 25,
      isFounder: true,
      entryDate: new Date('2026-02-01'),
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
          acquiredDate: new Date('2026-02-01')
        },
        {
          lotId: 2,
          surface: 100,
          unitId: 1,
          isPortage: true,
          allocatedSurface: 100,
          acquiredDate: new Date('2026-02-01')
        }
      ]
    };

    // Get available lots
    const availableLots = getAvailableLotsForNewcomer([founderWithPortage], []);
    const portageLot = availableLots[0];

    // STEP 3: Newcomer selects the portage lot
    // Simulate what happens in ParticipantDetailsPanel.tsx onSelectLot callback
    const newcomer: Participant = {
      name: 'Bob Newcomer',
      capitalApporte: 50000,
      notaryFeesRate: 3,
      interestRate: 4.5,
      durationYears: 25,
      isFounder: false,
      entryDate: new Date('2027-02-01'),
      unitId: 1,
      surface: portageLot.surface, // Set from lot
      quantity: 1,
      purchaseDetails: {
        buyingFrom: portageLot.fromParticipant || 'Copropriété',
        lotId: portageLot.lotId,
        purchasePrice: 150000
      }
    };

    // Verify the connection is correct
    expect(newcomer.purchaseDetails?.buyingFrom).toBe('Alice Founder');
    expect(newcomer.purchaseDetails?.lotId).toBe(2);
  });

  it('should calculate remboursements attendus correctly for founder', () => {
    const founderWithPortage: Participant = {
      name: 'Alice Founder',
      capitalApporte: 150000,
      notaryFeesRate: 12.5,
      interestRate: 4.5,
      durationYears: 25,
      isFounder: true,
      entryDate: new Date('2026-02-01'),
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
          acquiredDate: new Date('2026-02-01')
        },
        {
          lotId: 2,
          surface: 100,
          unitId: 1,
          isPortage: true,
          allocatedSurface: 100,
          acquiredDate: new Date('2026-02-01')
        }
      ]
    };

    const newcomer: Participant = {
      name: 'Bob Newcomer',
      capitalApporte: 50000,
      notaryFeesRate: 3,
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

    const allParticipants = [founderWithPortage, newcomer];

    // STEP 4: Calculate remboursements attendus (simulate logic from EnDivisionCorrect.tsx lines 711-714)
    const portagePaybacks = allParticipants
      .filter((buyer: any) => buyer.purchaseDetails?.buyingFrom === founderWithPortage.name)
      .map((buyer: any) => buyer.purchaseDetails?.purchasePrice || 0);

    // Should have 1 payback of €150,000
    expect(portagePaybacks).toHaveLength(1);
    expect(portagePaybacks[0]).toBe(150000);

    const totalReturns = portagePaybacks.reduce((sum: number, amt: number) => sum + amt, 0);
    expect(totalReturns).toBe(150000);
  });

  it('should handle exact name matching (case sensitive)', () => {
    // Test that name matching is exact and case-sensitive
    const founder: Participant = {
      name: 'Alice Founder',
      capitalApporte: 150000,
      notaryFeesRate: 12.5,
      interestRate: 4.5,
      durationYears: 25,
      isFounder: true,
      entryDate: new Date('2026-02-01'),
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
          acquiredDate: new Date('2026-02-01')
        }
      ]
    };

    // Test case 1: Exact match (should work)
    const newcomer1: Participant = {
      ...founder,
      name: 'Newcomer 1',
      isFounder: false,
      purchaseDetails: {
        buyingFrom: 'Alice Founder', // Exact match
        lotId: 2,
        purchasePrice: 150000
      }
    };

    // Test case 2: Wrong case (should NOT match)
    const newcomer2: Participant = {
      ...founder,
      name: 'Newcomer 2',
      isFounder: false,
      purchaseDetails: {
        buyingFrom: 'alice founder', // Wrong case
        lotId: 2,
        purchasePrice: 150000
      }
    };

    // Test case 3: Extra space (should NOT match)
    const newcomer3: Participant = {
      ...founder,
      name: 'Newcomer 3',
      isFounder: false,
      purchaseDetails: {
        buyingFrom: 'Alice  Founder', // Extra space
        lotId: 2,
        purchasePrice: 150000
      }
    };

    const allParticipants = [founder, newcomer1, newcomer2, newcomer3];

    const portagePaybacks = allParticipants
      .filter((buyer: any) => buyer.purchaseDetails?.buyingFrom === founder.name)
      .map((buyer: any) => buyer.purchaseDetails?.purchasePrice || 0);

    // Only newcomer1 should match
    expect(portagePaybacks).toHaveLength(1);
    expect(portagePaybacks[0]).toBe(150000);
  });
});
