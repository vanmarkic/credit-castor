import { describe, it, expect } from 'vitest';
import { detectChangedParticipants, estimateSyncSavings } from './participantSyncCoordinator';
import type { Participant } from '../utils/calculatorUtils';

describe('participantSyncCoordinator', () => {
  describe('detectChangedParticipants', () => {
    it('should detect no changes when participants are identical', () => {
      const participants: Participant[] = [
        {
          name: 'Alice',
          surface: 100,
          purchaseShare: 50,
          isFounder: true,
          entryDate: new Date('2024-01-01'),
        },
        {
          name: 'Bob',
          surface: 100,
          purchaseShare: 50,
          isFounder: true,
          entryDate: new Date('2024-01-01'),
        },
      ];

      const changed = detectChangedParticipants(participants, participants);

      expect(changed).toEqual([]);
    });

    it('should detect single participant change', () => {
      const oldParticipants: Participant[] = [
        {
          name: 'Alice',
          surface: 100,
          purchaseShare: 50,
          isFounder: true,
          entryDate: new Date('2024-01-01'),
        },
        {
          name: 'Bob',
          surface: 100,
          purchaseShare: 50,
          isFounder: true,
          entryDate: new Date('2024-01-01'),
        },
      ];

      const newParticipants: Participant[] = [
        {
          name: 'Alice',
          surface: 120, // Changed
          purchaseShare: 50,
          isFounder: true,
          entryDate: new Date('2024-01-01'),
        },
        {
          name: 'Bob',
          surface: 100,
          purchaseShare: 50,
          isFounder: true,
          entryDate: new Date('2024-01-01'),
        },
      ];

      const changed = detectChangedParticipants(oldParticipants, newParticipants);

      expect(changed).toEqual([0]); // Only Alice (index 0) changed
    });

    it('should detect cascading changes (copro redistribution scenario)', () => {
      const oldParticipants: Participant[] = [
        {
          name: 'Alice',
          surface: 100,
          purchaseShare: 50,
          isFounder: true,
          entryDate: new Date('2024-01-01'),
          purchaseDetails: undefined,
        },
        {
          name: 'Bob',
          surface: 100,
          purchaseShare: 50,
          isFounder: true,
          entryDate: new Date('2024-01-01'),
          purchaseDetails: undefined,
        },
        {
          name: 'Charlie',
          surface: 0,
          purchaseShare: 0,
          isFounder: false,
          entryDate: new Date('2024-06-01'),
          purchaseDetails: undefined,
        },
      ];

      const newParticipants: Participant[] = [
        {
          name: 'Alice',
          surface: 100,
          purchaseShare: 50,
          isFounder: true,
          entryDate: new Date('2024-01-01'),
          purchaseDetails: undefined,
        },
        {
          name: 'Bob',
          surface: 100,
          purchaseShare: 50,
          isFounder: true,
          entryDate: new Date('2024-01-01'),
          purchaseDetails: undefined,
        },
        {
          name: 'Charlie',
          surface: 0,
          purchaseShare: 0,
          isFounder: false,
          entryDate: new Date('2024-06-01'),
          // Charlie now buying from copro - triggers cascade
          purchaseDetails: {
            buyingFrom: 'Copropriété',
            purchasePrice: 100000,
          },
        },
      ];

      const changed = detectChangedParticipants(oldParticipants, newParticipants);

      // Only Charlie changed (his purchaseDetails)
      // Alice and Bob's expected paybacks would recalculate in UI,
      // but if their Participant objects don't change, they won't sync
      expect(changed).toEqual([2]);
    });

    it('should detect multiple changes', () => {
      const oldParticipants: Participant[] = [
        {
          name: 'Alice',
          surface: 100,
          purchaseShare: 50,
          isFounder: true,
          entryDate: new Date('2024-01-01'),
        },
        {
          name: 'Bob',
          surface: 100,
          purchaseShare: 50,
          isFounder: true,
          entryDate: new Date('2024-01-01'),
        },
      ];

      const newParticipants: Participant[] = [
        {
          name: 'Alice',
          surface: 120, // Changed
          purchaseShare: 50,
          isFounder: true,
          entryDate: new Date('2024-01-01'),
        },
        {
          name: 'Bob',
          surface: 100,
          purchaseShare: 50,
          isFounder: true,
          entryDate: new Date('2024-02-01'), // Changed
        },
      ];

      const changed = detectChangedParticipants(oldParticipants, newParticipants);

      expect(changed).toEqual([0, 1]); // Both changed
    });

    it('should detect date changes correctly', () => {
      const oldParticipants: Participant[] = [
        {
          name: 'Alice',
          surface: 100,
          purchaseShare: 50,
          isFounder: true,
          entryDate: new Date('2024-01-01'),
        },
      ];

      const newParticipants: Participant[] = [
        {
          name: 'Alice',
          surface: 100,
          purchaseShare: 50,
          isFounder: true,
          entryDate: new Date('2024-01-02'), // Different date
        },
      ];

      const changed = detectChangedParticipants(oldParticipants, newParticipants);

      expect(changed).toEqual([0]);
    });

    it('should detect when participant count changes', () => {
      const oldParticipants: Participant[] = [
        {
          name: 'Alice',
          surface: 100,
          purchaseShare: 100,
          isFounder: true,
        },
      ];

      const newParticipants: Participant[] = [
        {
          name: 'Alice',
          surface: 100,
          purchaseShare: 50,
          isFounder: true,
        },
        {
          name: 'Bob',
          surface: 100,
          purchaseShare: 50,
          isFounder: true,
        },
      ];

      const changed = detectChangedParticipants(oldParticipants, newParticipants);

      // When count changes, all participants need sync
      expect(changed).toEqual([0, 1]);
    });

    it('should detect nested object changes (lots)', () => {
      const oldParticipants: Participant[] = [
        {
          name: 'Alice',
          surface: 100,
          purchaseShare: 100,
          isFounder: true,
          lotsOwned: [
            {
              lotId: 'lot1',
              surface: 50,
              isPortage: false,
              acquiredDate: new Date('2024-01-01'),
            },
          ],
        },
      ];

      const newParticipants: Participant[] = [
        {
          name: 'Alice',
          surface: 100,
          purchaseShare: 100,
          isFounder: true,
          lotsOwned: [
            {
              lotId: 'lot1',
              surface: 50,
              isPortage: false,
              acquiredDate: new Date('2024-01-01'),
              soldDate: new Date('2024-06-01'), // Lot sold
            },
          ],
        },
      ];

      const changed = detectChangedParticipants(oldParticipants, newParticipants);

      expect(changed).toEqual([0]);
    });
  });

  describe('estimateSyncSavings', () => {
    it('should calculate savings correctly', () => {
      const result = estimateSyncSavings(1, 10);

      expect(result.percentSaved).toBe(90);
      expect(result.description).toContain('1/10');
      expect(result.description).toContain('90.0%');
    });

    it('should handle no savings', () => {
      const result = estimateSyncSavings(10, 10);

      expect(result.percentSaved).toBe(0);
    });

    it('should handle empty case', () => {
      const result = estimateSyncSavings(0, 0);

      expect(result.percentSaved).toBe(0);
    });

    it('should calculate partial savings', () => {
      const result = estimateSyncSavings(3, 10);

      expect(result.percentSaved).toBe(70);
    });
  });

  describe('Cascade scenarios (documentation tests)', () => {
    it('documents typical cascade pattern: entry date change', () => {
      // SCENARIO: User changes Charlie's entry date
      // EXPECTED: Charlie syncs, but Alice and Bob don't (their data didn't change)
      // NOTE: UI will recalculate expected paybacks for Alice/Bob reactively,
      //       but since Participant objects don't store expected paybacks,
      //       they won't be synced to Firestore (calculated on-demand)

      const oldParticipants: Participant[] = [
        { name: 'Alice', surface: 100, purchaseShare: 50, isFounder: true },
        { name: 'Bob', surface: 100, purchaseShare: 50, isFounder: true },
        { name: 'Charlie', surface: 0, purchaseShare: 0, isFounder: false },
      ];

      const newParticipants: Participant[] = [
        { name: 'Alice', surface: 100, purchaseShare: 50, isFounder: true },
        { name: 'Bob', surface: 100, purchaseShare: 50, isFounder: true },
        { name: 'Charlie', surface: 0, purchaseShare: 0, isFounder: false, entryDate: new Date('2024-06-01') },
      ];

      const changed = detectChangedParticipants(oldParticipants, newParticipants);

      // Only Charlie changed - efficient!
      expect(changed).toEqual([2]);
    });

    it('documents cascade when portage price recalculates', () => {
      // SCENARIO: User changes buyer's entry date
      // EXPECTED: Buyer syncs with new entry date
      // NOTE: Purchase price would recalculate, but it's stored in purchaseDetails,
      //       so if recalculation updates purchaseDetails, buyer will sync

      const oldParticipants: Participant[] = [
        {
          name: 'Alice',
          surface: 100,
          purchaseShare: 100,
          isFounder: true,
          lotsOwned: [{ lotId: 'lot1', surface: 100, isPortage: true, acquiredDate: new Date('2024-01-01') }],
        },
        {
          name: 'Bob',
          surface: 0,
          purchaseShare: 0,
          isFounder: false,
          entryDate: new Date('2024-06-01'),
          purchaseDetails: {
            buyingFrom: 'Alice',
            lotId: 'lot1',
            purchasePrice: 100000,
          },
        },
      ];

      const newParticipants: Participant[] = [
        {
          name: 'Alice',
          surface: 100,
          purchaseShare: 100,
          isFounder: true,
          lotsOwned: [{ lotId: 'lot1', surface: 100, isPortage: true, acquiredDate: new Date('2024-01-01') }],
        },
        {
          name: 'Bob',
          surface: 0,
          purchaseShare: 0,
          isFounder: false,
          entryDate: new Date('2024-12-01'), // Changed (later entry = higher price)
          purchaseDetails: {
            buyingFrom: 'Alice',
            lotId: 'lot1',
            purchasePrice: 110000, // Recalculated (holding costs increased)
          },
        },
      ];

      const changed = detectChangedParticipants(oldParticipants, newParticipants);

      // Only Bob changed (both entryDate and purchasePrice)
      expect(changed).toEqual([1]);
    });
  });
});
