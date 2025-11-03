/**
 * Calculator to Timeline Bridge Tests (Phase 5.1)
 *
 * Tests for converting calculator inputs to InitialPurchaseEvent
 */

import { describe, it, expect } from 'vitest';
import { convertCalculatorToInitialPurchaseEvent } from './calculatorToTimeline';
import type { Participant, ProjectParams } from './calculatorUtils';

describe('convertCalculatorToInitialPurchaseEvent', () => {
  const deedDate = new Date('2026-02-01');

  const mockParticipants: Participant[] = [
    {
      name: 'Alice',
      capitalApporte: 50000,
      notaryFeesRate: 0.125,
      unitId: 1,
      surface: 112,
      interestRate: 0.045,
      durationYears: 25,
      quantity: 1,
      parachevementsPerM2: 500,
    },
    {
      name: 'Bob',
      capitalApporte: 170000,
      notaryFeesRate: 0.125,
      unitId: 2,
      surface: 134,
      interestRate: 0.045,
      durationYears: 25,
      quantity: 2, // Portage scenario
      parachevementsPerM2: 500,
    },
  ];

  const mockProjectParams: ProjectParams = {
    totalPurchase: 650000,
    mesuresConservatoires: 20000,
    demolition: 40000,
    infrastructures: 90000,
    etudesPreparatoires: 59820,
    fraisEtudesPreparatoires: 27320,
    fraisGeneraux3ans: 0,
    batimentFondationConservatoire: 43700,
    batimentFondationComplete: 269200,
    batimentCoproConservatoire: 56000,
    globalCascoPerM2: 1590,
  };

  it('should create InitialPurchaseEvent with deed date', () => {
    const event = convertCalculatorToInitialPurchaseEvent(
      mockParticipants,
      mockProjectParams,
      deedDate
    );

    expect(event.type).toBe('INITIAL_PURCHASE');
    expect(event.date).toEqual(deedDate);
    expect(event.id).toMatch(/^evt-/);
  });

  it('should set all founders entry date to deed date', () => {
    const event = convertCalculatorToInitialPurchaseEvent(
      mockParticipants,
      mockProjectParams,
      deedDate
    );

    expect(event.participants).toHaveLength(2);
    event.participants.forEach(p => {
      expect(p.isFounder).toBe(true);
      expect(p.entryDate).toEqual(deedDate);
    });
  });

  it('should set all lots acquisition date to deed date', () => {
    const event = convertCalculatorToInitialPurchaseEvent(
      mockParticipants,
      mockProjectParams,
      deedDate
    );

    const allLots = event.participants.flatMap(p => p.lotsOwned || []);
    expect(allLots.length).toBeGreaterThan(0);

    allLots.forEach(lot => {
      expect(lot.acquiredDate).toEqual(deedDate);
    });
  });

  it('should convert quantity to lotsOwned array', () => {
    const event = convertCalculatorToInitialPurchaseEvent(
      mockParticipants,
      mockProjectParams,
      deedDate
    );

    const alice = event.participants.find(p => p.name === 'Alice');
    expect(alice?.lotsOwned).toHaveLength(1);
    expect(alice?.lotsOwned?.[0].lotId).toBeDefined();
    expect(alice?.lotsOwned?.[0].surface).toBe(112);

    const bob = event.participants.find(p => p.name === 'Bob');
    expect(bob?.lotsOwned).toHaveLength(2);
    expect(bob?.lotsOwned?.[0].isPortage).toBe(false); // Own lot
    expect(bob?.lotsOwned?.[1].isPortage).toBe(true);  // Portage lot
  });

  it('should calculate lot purchase prices', () => {
    const event = convertCalculatorToInitialPurchaseEvent(
      mockParticipants,
      mockProjectParams,
      deedDate
    );

    const alice = event.participants.find(p => p.name === 'Alice');
    const aliceLot = alice?.lotsOwned?.[0];

    expect(aliceLot?.originalPrice).toBeGreaterThan(0);
    expect(aliceLot?.originalNotaryFees).toBeGreaterThan(0);
  });

  it('should preserve project parameters', () => {
    const event = convertCalculatorToInitialPurchaseEvent(
      mockParticipants,
      mockProjectParams,
      deedDate
    );

    expect(event.projectParams).toEqual(mockProjectParams);
  });

  // Scenario tests removed - scenarios no longer exist

  it('should create copropriété entity without hidden lots by default', () => {
    const event = convertCalculatorToInitialPurchaseEvent(
      mockParticipants,
      mockProjectParams,
      deedDate
    );

    expect(event.copropropriete.name).toBe('Copropriété');
    expect(event.copropropriete.hiddenLots).toEqual([]);
  });

  it('should support optional copro name', () => {
    const event = convertCalculatorToInitialPurchaseEvent(
      mockParticipants,
      mockProjectParams,
      deedDate,
      'Les Acacias'
    );

    expect(event.copropropriete.name).toBe('Les Acacias');
  });

  it('should support optional hidden lots', () => {
    const event = convertCalculatorToInitialPurchaseEvent(
      mockParticipants,
      mockProjectParams,
      deedDate,
      'Les Acacias',
      [10, 11]
    );

    expect(event.copropropriete.hiddenLots).toEqual([10, 11]);
  });

  it('should handle participant with no quantity (default to 1)', () => {
    const singleParticipant = [{
      ...mockParticipants[0],
      quantity: undefined,
    }];

    const event = convertCalculatorToInitialPurchaseEvent(
      singleParticipant,
      mockProjectParams,
      deedDate
    );

    const participant = event.participants[0];
    expect(participant.lotsOwned).toHaveLength(1);
  });

  it('should generate unique lot IDs', () => {
    const event = convertCalculatorToInitialPurchaseEvent(
      mockParticipants,
      mockProjectParams,
      deedDate
    );

    const allLots = event.participants.flatMap(p => p.lotsOwned || []);
    const lotIds = allLots.map(lot => lot.lotId);
    const uniqueIds = new Set(lotIds);

    expect(uniqueIds.size).toBe(lotIds.length); // All unique
  });
});
