import { describe, it, expect } from 'vitest';
import type { Lot } from './timeline';

describe('Portage Lot Configuration', () => {
  it('should allow participant to specify portage lot allocation', () => {
    const participant = {
      name: 'Founder A',
      isFounder: true,
      lotsOwned: [
        {
          lotId: 1,
          surface: 112,
          unitId: 1,
          isPortage: false,
          acquiredDate: new Date('2026-02-01')
        },
        {
          lotId: 2,
          surface: 50,
          unitId: 2,
          isPortage: true,
          allocatedSurface: 50,
          acquiredDate: new Date('2026-02-01')
        }
      ] as Lot[]
    };

    expect(participant.lotsOwned).toHaveLength(2);
    expect(participant.lotsOwned[1].isPortage).toBe(true);
    expect(participant.lotsOwned[1].allocatedSurface).toBe(50);
  });
});
