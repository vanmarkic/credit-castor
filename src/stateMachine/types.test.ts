import { describe, it, expect } from 'vitest';
import type { Participant, Lot, ProjectContext } from './types';

describe('Type Definitions', () => {
  it('should create valid Participant', () => {
    const participant: Participant = {
      id: 'p1',
      name: 'Alice',
      isFounder: true,
      entryDate: new Date('2023-01-01'),
      lotsOwned: [],
      loans: []
    };

    expect(participant.isFounder).toBe(true);
  });

  it('should create valid Lot with portage flag', () => {
    const lot: Lot = {
      id: 'lot1',
      origin: 'founder',
      status: 'available',
      ownerId: 'p1',
      surface: 100,
      heldForPortage: true
    };

    expect(lot.heldForPortage).toBe(true);
  });
});
