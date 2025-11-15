import { describe, it, expect, beforeEach } from 'vitest';
import { queries } from './queries';
import type { ProjectContext } from './types';

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
      precadApprovalDate: null,
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
      rentToOwnAgreements: new Map(),
      sharedSpaces: new Map(),
      usageAgreements: new Map(),
      usageRecords: [],
      sharedSpaceAlerts: [],
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

describe('Lot Queries', () => {
  let context: ProjectContext;

  beforeEach(() => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore - Minimal test context
    context = {
      participants: [],
      lots: [
        {
          id: 'lot1',
          origin: 'founder',
          status: 'available',
          ownerId: 'p1',
          surface: 100,
          heldForPortage: true
        },
        {
          id: 'lot2',
          origin: 'copro',
          status: 'hidden',
          ownerId: 'copropriete',
          surface: 50,
          heldForPortage: false
        },
        {
          id: 'lot3',
          origin: 'copro',
          status: 'available',
          ownerId: 'copropriete',
          surface: 75,
          heldForPortage: false
        }
      ],
      salesHistory: [],
      acteTranscriptionDate: new Date(),
      permitEnactedDate: null,
      // ... minimal context
    } as ProjectContext;
  });

  it('should get lots by origin', () => {
    const founderLots = queries.getLotsByOrigin(context, 'founder');
    expect(founderLots).toHaveLength(1);
    expect(founderLots[0].id).toBe('lot1');

    const coproLots = queries.getLotsByOrigin(context, 'copro');
    expect(coproLots).toHaveLength(2);
  });

  it('should get available lots', () => {
    const available = queries.getAvailableLots(context);
    expect(available).toHaveLength(2);
  });

  it('should get portage lots', () => {
    const portage = queries.getPortageLots(context);
    expect(portage).toHaveLength(1);
    expect(portage[0].id).toBe('lot1');
  });

  it('should get hidden lots', () => {
    const hidden = queries.getHiddenLots(context);
    expect(hidden).toHaveLength(1);
    expect(hidden[0].id).toBe('lot2');
  });

  it('should detect sale type correctly', () => {
    expect(queries.getSaleType(context, 'lot1', 'p1')).toBe('portage');
    expect(queries.getSaleType(context, 'lot3', 'copropriete')).toBe('copro');
  });

  it('should check if portage sales are allowed', () => {
    expect(queries.canSellPortageLots(context)).toBe(true);

    context.acteTranscriptionDate = null;
    expect(queries.canSellPortageLots(context)).toBe(false);
  });
});
