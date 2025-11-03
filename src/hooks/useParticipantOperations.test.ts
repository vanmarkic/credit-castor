import { describe, it, expect } from 'vitest';
import {
  addParticipant,
  removeParticipant,
  updateParticipantName,
  updateParticipantSurface,
  updateCapital,
  updateNotaryRate,
  updateInterestRate,
  updateDuration,
  updateQuantity,
  updateParachevementsPerM2,
  updateCascoSqm,
  updateParachevementsSqm,
  addPortageLot,
  removePortageLot,
  updatePortageLotSurface
} from './useParticipantOperations';
import type { Participant } from '../utils/calculatorUtils';

describe('useParticipantOperations', () => {
  const baseParticipant: Participant = {
    name: 'Test Participant',
    capitalApporte: 100000,
    notaryFeesRate: 12.5,
    unitId: 1,
    surface: 100,
    interestRate: 4.5,
    durationYears: 25,
    quantity: 1,
    parachevementsPerM2: 500,
    isFounder: true,
    entryDate: new Date('2023-02-01')
  };

  describe('addParticipant', () => {
    it('should add a new participant with default values', () => {
      const participants = [baseParticipant];
      const result = addParticipant(participants, '2023-02-01');

      expect(result).toHaveLength(2);
      expect(result[1].name).toBe('Participant·e 2');
      expect(result[1].capitalApporte).toBe(100000);
      expect(result[1].unitId).toBe(2);
      expect(result[1].isFounder).toBe(true);
    });

    it('should not mutate original array', () => {
      const participants = [baseParticipant];
      const result = addParticipant(participants, '2023-02-01');

      expect(participants).toHaveLength(1);
      expect(result).not.toBe(participants);
    });
  });

  describe('removeParticipant', () => {
    it('should remove participant at index', () => {
      const participants = [
        baseParticipant,
        { ...baseParticipant, name: 'Participant 2' }
      ];
      const result = removeParticipant(participants, 0);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Participant 2');
    });

    it('should not remove if only one participant', () => {
      const participants = [baseParticipant];
      const result = removeParticipant(participants, 0);

      expect(result).toHaveLength(1);
      expect(result).toBe(participants);
    });

    it('should not mutate original array', () => {
      const participants = [
        baseParticipant,
        { ...baseParticipant, name: 'Participant 2' }
      ];
      const result = removeParticipant(participants, 0);

      expect(participants).toHaveLength(2);
      expect(result).not.toBe(participants);
    });
  });

  describe('updateParticipantName', () => {
    it('should update participant name', () => {
      const participants = [baseParticipant];
      const result = updateParticipantName(participants, 0, 'New Name');

      expect(result[0].name).toBe('New Name');
    });

    it('should not mutate original participant', () => {
      const participants = [baseParticipant];
      updateParticipantName(participants, 0, 'New Name');

      expect(participants[0].name).toBe('Test Participant');
    });
  });

  describe('updateParticipantSurface', () => {
    it('should update participant surface', () => {
      const participants = [baseParticipant];
      const result = updateParticipantSurface(participants, 0, 150);

      expect(result[0].surface).toBe(150);
    });
  });

  describe('updateCapital', () => {
    it('should update participant capital', () => {
      const participants = [baseParticipant];
      const result = updateCapital(participants, 0, 200000);

      expect(result[0].capitalApporte).toBe(200000);
    });
  });

  describe('updateNotaryRate', () => {
    it('should update notary rate', () => {
      const participants = [baseParticipant];
      const result = updateNotaryRate(participants, 0, 15);

      expect(result[0].notaryFeesRate).toBe(15);
    });
  });

  describe('updateInterestRate', () => {
    it('should update interest rate', () => {
      const participants = [baseParticipant];
      const result = updateInterestRate(participants, 0, 5.5);

      expect(result[0].interestRate).toBe(5.5);
    });
  });

  describe('updateDuration', () => {
    it('should update loan duration', () => {
      const participants = [baseParticipant];
      const result = updateDuration(participants, 0, 30);

      expect(result[0].durationYears).toBe(30);
    });
  });

  describe('updateQuantity', () => {
    it('should update quantity', () => {
      const participants = [baseParticipant];
      const result = updateQuantity(participants, 0, 2);

      expect(result[0].quantity).toBe(2);
    });

    it('should enforce minimum quantity of 1', () => {
      const participants = [baseParticipant];
      const result = updateQuantity(participants, 0, 0);

      expect(result[0].quantity).toBe(1);
    });
  });

  describe('updateParachevementsPerM2', () => {
    it('should update parachevements per m2', () => {
      const participants = [baseParticipant];
      const result = updateParachevementsPerM2(participants, 0, 600);

      expect(result[0].parachevementsPerM2).toBe(600);
    });
  });

  describe('updateCascoSqm', () => {
    it('should update casco sqm', () => {
      const participants = [baseParticipant];
      const result = updateCascoSqm(participants, 0, 80);

      expect(result[0].cascoSqm).toBe(80);
    });

    it('should allow undefined value', () => {
      const participants = [{ ...baseParticipant, cascoSqm: 80 }];
      const result = updateCascoSqm(participants, 0, undefined);

      expect(result[0].cascoSqm).toBeUndefined();
    });
  });

  describe('updateParachevementsSqm', () => {
    it('should update parachevements sqm', () => {
      const participants = [baseParticipant];
      const result = updateParachevementsSqm(participants, 0, 80);

      expect(result[0].parachevementsSqm).toBe(80);
    });

    it('should allow undefined value', () => {
      const participants = [{ ...baseParticipant, parachevementsSqm: 80 }];
      const result = updateParachevementsSqm(participants, 0, undefined);

      expect(result[0].parachevementsSqm).toBeUndefined();
    });
  });

  describe('addPortageLot', () => {
    it('should add a portage lot to participant', () => {
      const participants = [baseParticipant];
      const result = addPortageLot(participants, 0, '2023-02-01');

      expect(result[0].lotsOwned).toHaveLength(1);
      expect(result[0].lotsOwned![0].isPortage).toBe(true);
      expect(result[0].lotsOwned![0].surface).toBe(0);
      expect(result[0].quantity).toBe(2);
    });

    it('should assign unique lot IDs', () => {
      const participants = [
        {
          ...baseParticipant,
          lotsOwned: [
            {
              lotId: 1,
              surface: 100,
              unitId: 1,
              isPortage: false,
              allocatedSurface: 100,
              acquiredDate: new Date('2023-02-01')
            }
          ]
        }
      ];
      const result = addPortageLot(participants, 0, '2023-02-01');

      expect(result[0].lotsOwned![1].lotId).toBe(2);
    });
  });

  describe('removePortageLot', () => {
    it('should remove portage lot from participant', () => {
      const participants = [
        {
          ...baseParticipant,
          quantity: 2,
          surface: 150,
          lotsOwned: [
            {
              lotId: 1,
              surface: 100,
              unitId: 1,
              isPortage: false,
              allocatedSurface: 100,
              acquiredDate: new Date('2023-02-01')
            },
            {
              lotId: 2,
              surface: 50,
              unitId: 1,
              isPortage: true,
              allocatedSurface: 50,
              acquiredDate: new Date('2023-02-01')
            }
          ]
        }
      ];
      const result = removePortageLot(participants, 0, 2);

      expect(result[0].lotsOwned).toHaveLength(1);
      expect(result[0].quantity).toBe(1);
      expect(result[0].surface).toBe(100);
    });

    it('should not reduce quantity below 1', () => {
      const participants = [
        {
          ...baseParticipant,
          quantity: 1,
          lotsOwned: [
            {
              lotId: 1,
              surface: 100,
              unitId: 1,
              isPortage: false,
              allocatedSurface: 100,
              acquiredDate: new Date('2023-02-01')
            }
          ]
        }
      ];
      const result = removePortageLot(participants, 0, 1);

      expect(result[0].quantity).toBe(1);
    });
  });

  describe('updatePortageLotSurface', () => {
    it('should update lot surface and total participant surface', () => {
      const participants = [
        {
          ...baseParticipant,
          surface: 100,
          lotsOwned: [
            {
              lotId: 1,
              surface: 100,
              unitId: 1,
              isPortage: false,
              allocatedSurface: 100,
              acquiredDate: new Date('2023-02-01')
            },
            {
              lotId: 2,
              surface: 0,
              unitId: 1,
              isPortage: true,
              allocatedSurface: 0,
              acquiredDate: new Date('2023-02-01')
            }
          ]
        }
      ];
      const result = updatePortageLotSurface(participants, 0, 2, 50);

      expect(result[0].lotsOwned![1].surface).toBe(50);
      expect(result[0].lotsOwned![1].allocatedSurface).toBe(50);
      expect(result[0].surface).toBe(150);
    });

    it('should handle surface decrease', () => {
      const participants = [
        {
          ...baseParticipant,
          surface: 150,
          lotsOwned: [
            {
              lotId: 1,
              surface: 100,
              unitId: 1,
              isPortage: false,
              allocatedSurface: 100,
              acquiredDate: new Date('2023-02-01')
            },
            {
              lotId: 2,
              surface: 50,
              unitId: 1,
              isPortage: true,
              allocatedSurface: 50,
              acquiredDate: new Date('2023-02-01')
            }
          ]
        }
      ];
      const result = updatePortageLotSurface(participants, 0, 2, 30);

      expect(result[0].lotsOwned![1].surface).toBe(30);
      expect(result[0].surface).toBe(130);
    });
  });
});
