import { describe, it, expect, beforeEach } from 'vitest';
import { queries } from './queries';
import type { ProjectContext, Participant, Lot } from './types';

describe('Participant Queries', () => {
  let context: ProjectContext;

  beforeEach(() => {
    context = {
      participants: [
        {
          id: 'p1',
          name: 'Alice',
          isFounder: true,
          entryDate: new Date('2023-01-01'),
          lotsOwned: [],
          loans: []
        },
        {
          id: 'p2',
          name: 'Bob',
          isFounder: true,
          entryDate: new Date('2023-01-01'),
          lotsOwned: [],
          loans: []
        },
        {
          id: 'p3',
          name: 'Carol',
          isFounder: false,
          entryDate: new Date('2024-01-01'),
          lotsOwned: [],
          loans: []
        }
      ],
      lots: [],
      salesHistory: [],
      compromisDate: null,
      deedDate: null,
      registrationDate: null,
      precadReferenceNumber: null,
      precadRequestDate: null,
      acteDeBaseDate: null,
      acteTranscriptionDate: null,
      acpEnterpriseNumber: null,
      permitRequestedDate: null,
      permitGrantedDate: null,
      permitEnactedDate: null,
      financingApplications: new Map(),
      requiredFinancing: 0,
      approvedFinancing: 0,
      bankDeadline: null,
      acpLoans: new Map(),
      acpBankAccount: 0,
      projectFinancials: {
        totalPurchasePrice: 0,
        fraisGeneraux: {
          architectFees: 0,
          recurringCosts: {
            propertyTax: 0,
            accountant: 0,
            podio: 0,
            buildingInsurance: 0,
            reservationFees: 0,
            contingencies: 0
          },
          oneTimeCosts: 0,
          total3Years: 0
        },
        travauxCommuns: 0,
        expenseCategories: {
          conservatoire: 0,
          habitabiliteSommaire: 0,
          premierTravaux: 0
        },
        globalCascoPerM2: 0,
        indexRates: []
      }
    } as ProjectContext;
  });

  it('should get all founders', () => {
    const founders = queries.getFounders(context);
    expect(founders).toHaveLength(2);
    expect(founders[0].name).toBe('Alice');
    expect(founders[1].name).toBe('Bob');
  });

  it('should get all newcomers', () => {
    const newcomers = queries.getNewcomers(context);
    expect(newcomers).toHaveLength(1);
    expect(newcomers[0].name).toBe('Carol');
  });

  it('should get participant by id', () => {
    const participant = queries.getParticipant(context, 'p2');
    expect(participant?.name).toBe('Bob');
  });
});
