import { describe, it, expect } from 'vitest';
import { calculateIndexation, calculateCarryingCosts, calculateFirstLoanAmount, calculateSecondLoanAmount, calculateVotingResults } from './calculations';
import type { Lot, ProjectContext, ParticipantCosts, ParticipantVote, VotingRules } from './types';

describe('Indexation Calculation', () => {
  it('should calculate indexation using Belgian legal index', () => {
    const indexRates = [
      { year: 2023, rate: 1.02 },
      { year: 2024, rate: 1.03 }
    ];

    const result = calculateIndexation(
      new Date('2023-01-01'),
      new Date('2025-01-01'),
      indexRates
    );

    // 2 years: 1.02 × 1.03 = 1.0506 → 5.06% growth
    expect(result).toBeCloseTo(0.0506, 3);
  });

  it('should handle partial years', () => {
    const indexRates = [
      { year: 2023, rate: 1.02 }
    ];

    const result = calculateIndexation(
      new Date('2023-01-01'),
      new Date('2023-07-01'),
      indexRates
    );

    // 0.5 years: partial application
    expect(result).toBeGreaterThan(0);
    expect(result).toBeLessThan(0.02);
  });
});

describe('Carrying Costs Calculation', () => {
  it('should calculate monthly carrying costs', () => {
    const lot: Lot = {
      id: 'lot1',
      origin: 'founder',
      status: 'sold',
      ownerId: 'p1',
      surface: 100,
      heldForPortage: true,
      acquisition: {
        date: new Date('2023-01-01'),
        totalCost: 100000,
        purchaseShare: 50000,
        registrationFees: 3000,
        constructionCost: 45000,
        fraisCommuns: 2000
      }
    };

    const context: ProjectContext = {
      participants: [{
        id: 'p1',
        name: 'Alice',
        isFounder: true,
        entryDate: new Date('2023-01-01'),
        lotsOwned: [{ lotId: 'lot1', acquisitionDate: new Date('2023-01-01'), acquisitionCost: 100000, surface: 100 }],
        loans: [{
          loanAmount: 80000,
          interestRate: 0.035,
          durationYears: 25,
          monthlyPayment: 400,
          purpose: 'purchase',
          disbursementDate: new Date('2023-01-01')
        }]
      }],
      lots: [lot],
      salesHistory: [],
      financingApplications: new Map(),
      requiredFinancing: 0,
      approvedFinancing: 0,
      bankDeadline: null,
      acpLoans: new Map(),
      acpBankAccount: 0,
      rentToOwnAgreements: new Map(),
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
      projectFinancials: {
        totalPurchasePrice: 500000,
        fraisGeneraux: {
          architectFees: 15000,
          recurringCosts: {
            propertyTax: 388.38,
            accountant: 1000,
            podio: 600,
            buildingInsurance: 2000,
            reservationFees: 2000,
            contingencies: 2000
          },
          oneTimeCosts: 5000,
          total3Years: 45000
        },
        travauxCommuns: 100000,
        expenseCategories: {
          conservatoire: 20000,
          habitabiliteSommaire: 30000,
          premierTravaux: 50000
        },
        globalCascoPerM2: 1500,
        indexRates: []
      }
    };

    const result = calculateCarryingCosts(
      lot,
      new Date('2025-01-01'), // 24 months later
      context
    );

    expect(result.totalMonths).toBeCloseTo(24, 0);
    expect(result.total).toBeGreaterThan(0);
    expect(result.monthlyLoanInterest).toBeCloseTo((80000 * 0.035) / 12, 2);
  });
});

describe('Loan Split Calculations', () => {
  const costs: ParticipantCosts = {
    partAchat: 80000,
    droitEnregistrement: 10000,
    travauxCommuns: 15000,
    casco: 40000,
    parachevements: 25000
  };

  it('should calculate first loan amount (1/3 construction)', () => {
    const firstLoan = calculateFirstLoanAmount(costs);

    const constructionCosts = costs.casco + costs.parachevements; // 65,000
    const expectedFirstLoan =
      costs.partAchat +                      // 80,000
      costs.droitEnregistrement +            // 10,000
      costs.travauxCommuns +                 // 15,000
      (constructionCosts / 3);               // 21,667

    expect(firstLoan).toBeCloseTo(126667, 0);
    expect(firstLoan).toBeCloseTo(expectedFirstLoan, 0);
  });

  it('should calculate second loan amount (2/3 construction)', () => {
    const secondLoan = calculateSecondLoanAmount(costs);

    const constructionCosts = costs.casco + costs.parachevements; // 65,000
    const expectedSecondLoan = (constructionCosts * 2) / 3;       // 43,333

    expect(secondLoan).toBeCloseTo(43333, 0);
    expect(secondLoan).toBeCloseTo(expectedSecondLoan, 0);
  });

  it('should verify split loans sum equals total', () => {
    const firstLoan = calculateFirstLoanAmount(costs);
    const secondLoan = calculateSecondLoanAmount(costs);

    const totalCosts =
      costs.partAchat +
      costs.droitEnregistrement +
      costs.travauxCommuns +
      costs.casco +
      costs.parachevements;

    expect(firstLoan + secondLoan).toBeCloseTo(totalCosts, 0);
  });

  it('should handle zero construction costs', () => {
    const noConstrucitonCosts: ParticipantCosts = {
      partAchat: 100000,
      droitEnregistrement: 12500,
      travauxCommuns: 20000,
      casco: 0,
      parachevements: 0
    };

    const firstLoan = calculateFirstLoanAmount(noConstrucitonCosts);
    const secondLoan = calculateSecondLoanAmount(noConstrucitonCosts);

    // When no construction, first loan = all costs, second loan = 0
    expect(firstLoan).toBe(132500);
    expect(secondLoan).toBe(0);
  });
});

describe('Voting Calculations', () => {
  it('should calculate democratic voting results', () => {
    const votes = new Map<string, ParticipantVote>([
      ['p1', { participantId: 'p1', vote: 'for', quotite: 0.2, timestamp: new Date() }],
      ['p2', { participantId: 'p2', vote: 'for', quotite: 0.3, timestamp: new Date() }],
      ['p3', { participantId: 'p3', vote: 'against', quotite: 0.25, timestamp: new Date() }],
      ['p4', { participantId: 'p4', vote: 'for', quotite: 0.15, timestamp: new Date() }]
    ]);

    const rules: VotingRules = {
      method: 'one_person_one_vote',
      quorumPercentage: 50,
      majorityPercentage: 50
    };

    const result = calculateVotingResults(votes, rules, 5, 1.0);

    expect(result.totalVoters).toBe(4);
    expect(result.votesFor).toBe(3);
    expect(result.votesAgainst).toBe(1);
    expect(result.quorumReached).toBe(true); // 4/5 = 80% > 50%
    expect(result.majorityReached).toBe(true); // 3/4 = 75% > 50%
    expect(result.democraticMajority).toBe(true);
  });

  it('should calculate quotité-weighted voting results', () => {
    const votes = new Map<string, ParticipantVote>([
      ['p1', { participantId: 'p1', vote: 'for', quotite: 0.2, timestamp: new Date() }],
      ['p2', { participantId: 'p2', vote: 'for', quotite: 0.3, timestamp: new Date() }],
      ['p3', { participantId: 'p3', vote: 'against', quotite: 0.25, timestamp: new Date() }]
    ]);

    const rules: VotingRules = {
      method: 'quotite_weighted',
      quorumPercentage: 50,
      majorityPercentage: 50
    };

    const result = calculateVotingResults(votes, rules, 5, 1.0);

    expect(result.quotiteFor).toBe(0.5); // 20% + 30%
    expect(result.quotiteAgainst).toBe(0.25);
    expect(result.quotiteMajority).toBe(true); // 0.5/0.75 = 66.7% > 50%
  });

  it('should calculate hybrid voting results', () => {
    const votes = new Map<string, ParticipantVote>([
      ['p1', { participantId: 'p1', vote: 'for', quotite: 0.2, timestamp: new Date() }],
      ['p2', { participantId: 'p2', vote: 'for', quotite: 0.3, timestamp: new Date() }],
      ['p3', { participantId: 'p3', vote: 'against', quotite: 0.25, timestamp: new Date() }],
      ['p4', { participantId: 'p4', vote: 'for', quotite: 0.15, timestamp: new Date() }]
    ]);

    const rules: VotingRules = {
      method: 'hybrid',
      quorumPercentage: 50,
      majorityPercentage: 50,
      hybridWeights: {
        democraticWeight: 0.5,
        quotiteWeight: 0.5
      }
    };

    const result = calculateVotingResults(votes, rules, 5, 1.0);

    // Democratic: 3/4 = 75%
    // Quotité: 0.65/0.9 = 72.2%
    // Hybrid: (75% × 0.5) + (72.2% × 0.5) = 73.6%
    expect(result.hybridScore).toBeCloseTo(0.736, 2);
    expect(result.majorityReached).toBe(true);
  });
});
