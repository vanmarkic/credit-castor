import { describe, it, expect } from 'vitest';
import { calculateIndexation, calculateCarryingCosts } from './calculations';
import type { Lot, ProjectContext } from './types';

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
