import { describe, it, expect } from 'vitest';
import { getAvailableLotsForNewcomer } from './availableLots';
import type { Participant } from './calculatorUtils';
import type { CoproLot } from '../types/timeline';

describe('getAvailableLotsForNewcomer', () => {
  it('should return portage lots from founders with imposed surface', () => {
    const participants: Participant[] = [
      {
        name: 'Founder A',
        capitalApporte: 50000,
        notaryFeesRate: 12.5,
        interestRate: 4.5,
        durationYears: 25,
        isFounder: true,
        lotsOwned: [
          { lotId: 1, surface: 112, unitId: 1, isPortage: false, acquiredDate: new Date() },
          { lotId: 2, surface: 50, unitId: 2, isPortage: true, allocatedSurface: 50, acquiredDate: new Date() }
        ]
      }
    ];

    const coproLots: CoproLot[] = [];

    const result = getAvailableLotsForNewcomer(participants, coproLots);

    expect(result).toHaveLength(1);
    expect(result[0].lotId).toBe(2);
    expect(result[0].source).toBe('FOUNDER');
    expect(result[0].surfaceImposed).toBe(true);
    expect(result[0].surface).toBe(50);
  });

  it('should return copro lots with free surface', () => {
    const participants: Participant[] = [];
    const coproLots: CoproLot[] = [
      { lotId: 10, surface: 300, acquiredDate: new Date() }
    ];

    const result = getAvailableLotsForNewcomer(participants, coproLots);

    expect(result).toHaveLength(1);
    expect(result[0].lotId).toBe(10);
    expect(result[0].source).toBe('COPRO');
    expect(result[0].surfaceImposed).toBe(false);
    expect(result[0].surface).toBe(300);
  });

  it('should combine portage lots and copro lots', () => {
    const participants: Participant[] = [
      {
        name: 'Founder A',
        capitalApporte: 50000,
        notaryFeesRate: 12.5,
        interestRate: 4.5,
        durationYears: 25,
        isFounder: true,
        lotsOwned: [
          { lotId: 2, surface: 50, unitId: 2, isPortage: true, allocatedSurface: 50, acquiredDate: new Date() }
        ]
      }
    ];

    const coproLots: CoproLot[] = [
      { lotId: 10, surface: 300, acquiredDate: new Date() }
    ];

    const result = getAvailableLotsForNewcomer(participants, coproLots);

    expect(result).toHaveLength(2);
    expect(result.find(l => l.source === 'FOUNDER')).toBeDefined();
    expect(result.find(l => l.source === 'COPRO')).toBeDefined();
  });
});
