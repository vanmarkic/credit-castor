/**
 * Timeline Export/Import Tests (Phase 5.2)
 *
 * Tests for JSON serialization of timeline with deed date
 */

import { describe, it, expect } from 'vitest';
import { exportTimelineToJSON, importTimelineFromJSON } from './timelineExport';
import type { InitialPurchaseEvent } from '../types/timeline';

describe('Timeline Export/Import', () => {
  const deedDate = new Date('2026-02-01T00:00:00.000Z');

  const mockEvent: InitialPurchaseEvent = {
    id: 'evt-001',
    date: deedDate,
    type: 'INITIAL_PURCHASE',
    participants: [
      {
        name: 'Alice',
        isFounder: true,
        entryDate: deedDate,
        lotsOwned: [
          {
            lotId: 1,
            surface: 85,
            unitId: 101,
            isPortage: false,
            acquiredDate: deedDate,
            originalPrice: 170000,
            originalNotaryFees: 21250,
          },
        ],
        capitalApporte: 50000,
        notaryFeesRate: 0.125,
        interestRate: 0.04,
        durationYears: 20,
      },
    ],
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
      globalCascoPerM2: 1590,
    },
    scenario: {
      constructionCostChange: 0,
      infrastructureReduction: 0,
      purchasePriceReduction: 0,
    },
    copropropriete: {
      name: 'Les Acacias',
      hiddenLots: [10, 11],
    },
  };

  describe('exportTimelineToJSON', () => {
    it('should serialize events to JSON string', () => {
      const json = exportTimelineToJSON([mockEvent]);

      expect(typeof json).toBe('string');
      const parsed = JSON.parse(json);
      expect(parsed.version).toBe(1);
      expect(parsed.events).toHaveLength(1);
    });

    it('should serialize deed date correctly', () => {
      const json = exportTimelineToJSON([mockEvent]);
      const parsed = JSON.parse(json);

      expect(parsed.events[0].date).toBe(deedDate.toISOString());
    });

    it('should serialize participant entry dates', () => {
      const json = exportTimelineToJSON([mockEvent]);
      const parsed = JSON.parse(json);

      const participant = parsed.events[0].participants[0];
      expect(participant.entryDate).toBe(deedDate.toISOString());
    });

    it('should serialize lot acquisition dates', () => {
      const json = exportTimelineToJSON([mockEvent]);
      const parsed = JSON.parse(json);

      const lot = parsed.events[0].participants[0].lotsOwned[0];
      expect(lot.acquiredDate).toBe(deedDate.toISOString());
    });

    it('should include metadata with export timestamp', () => {
      const json = exportTimelineToJSON([mockEvent]);
      const parsed = JSON.parse(json);

      expect(parsed.exportedAt).toBeDefined();
      expect(new Date(parsed.exportedAt)).toBeInstanceOf(Date);
    });
  });

  describe('importTimelineFromJSON', () => {
    it('should deserialize JSON to events', () => {
      const json = exportTimelineToJSON([mockEvent]);
      const events = importTimelineFromJSON(json);

      expect(events).toHaveLength(1);
      expect(events[0].type).toBe('INITIAL_PURCHASE');
    });

    it('should deserialize dates as Date objects', () => {
      const json = exportTimelineToJSON([mockEvent]);
      const events = importTimelineFromJSON(json);

      expect(events[0].date).toBeInstanceOf(Date);
      expect(events[0].date).toEqual(deedDate);
    });

    it('should deserialize participant entry dates', () => {
      const json = exportTimelineToJSON([mockEvent]);
      const events = importTimelineFromJSON(json);

      const event = events[0] as InitialPurchaseEvent;
      expect(event.participants[0].entryDate).toBeInstanceOf(Date);
      expect(event.participants[0].entryDate).toEqual(deedDate);
    });

    it('should deserialize lot acquisition dates', () => {
      const json = exportTimelineToJSON([mockEvent]);
      const events = importTimelineFromJSON(json);

      const event = events[0] as InitialPurchaseEvent;
      const lot = event.participants[0].lotsOwned?.[0];
      expect(lot?.acquiredDate).toBeInstanceOf(Date);
      expect(lot?.acquiredDate).toEqual(deedDate);
    });

    it('should handle multiple events', () => {
      const events = [mockEvent, { ...mockEvent, id: 'evt-002' }];
      const json = exportTimelineToJSON(events);
      const imported = importTimelineFromJSON(json);

      expect(imported).toHaveLength(2);
    });

    it('should preserve all event data', () => {
      const json = exportTimelineToJSON([mockEvent]);
      const events = importTimelineFromJSON(json);

      const event = events[0] as InitialPurchaseEvent;
      expect(event.id).toBe('evt-001');
      expect(event.participants[0].name).toBe('Alice');
      expect(event.projectParams.totalPurchase).toBe(170000);
      expect(event.copropropriete.name).toBe('Les Acacias');
    });

    it('should throw error for invalid JSON', () => {
      expect(() => importTimelineFromJSON('invalid json')).toThrow();
    });

    it('should throw error for missing version', () => {
      const invalidJson = JSON.stringify({ events: [] });
      expect(() => importTimelineFromJSON(invalidJson)).toThrow();
    });
  });

  describe('Round-trip', () => {
    it('should maintain data integrity through export/import', () => {
      const json = exportTimelineToJSON([mockEvent]);
      const imported = importTimelineFromJSON(json);
      const jsonAgain = exportTimelineToJSON(imported);

      const original = JSON.parse(json);
      const roundTrip = JSON.parse(jsonAgain);

      // Compare events (excluding exportedAt which will differ)
      expect(roundTrip.events).toEqual(original.events);
    });
  });
});
