import { describe, it, expect } from 'vitest';
import type { Participant, Lot, PortageSale, CoproSale, ClassicSale, LoanApplication, ACPLoan, ProjectFinancials } from './types';

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

describe('Sale Types', () => {
  it('should create portage sale with pricing breakdown', () => {
    const sale: PortageSale = {
      type: 'portage',
      lotId: 'lot1',
      seller: 'p1',
      buyer: 'p2',
      saleDate: new Date(),
      pricing: {
        baseAcquisitionCost: 100000,
        indexation: 5000,
        carryingCosts: {
          monthlyLoanInterest: 200,
          propertyTax: 100,
          buildingInsurance: 50,
          syndicFees: 100,
          chargesCommunes: 50,
          totalMonths: 24,
          total: 12000
        },
        renovations: 10000,
        registrationFeesRecovery: 3000,
        fraisCommunsRecovery: 5000,
        loanInterestRecovery: 4800,
        totalPrice: 139800
      }
    };

    expect(sale.type).toBe('portage');
    expect(sale.pricing.totalPrice).toBe(139800);
  });

  it('should create copro sale with dynamic pricing', () => {
    const sale: CoproSale = {
      type: 'copro',
      lotId: 'lot2',
      buyer: 'p3',
      surface: 50,
      saleDate: new Date(),
      pricing: {
        baseCostPerSqm: 2000,
        gen1CompensationPerSqm: 200,
        pricePerSqm: 2200,
        surface: 50,
        totalPrice: 110000
      }
    };

    expect(sale.type).toBe('copro');
    expect(sale.pricing.totalPrice).toBe(110000);
  });

  it('should create classic sale with governance', () => {
    const sale: ClassicSale = {
      type: 'classic',
      lotId: 'lot3',
      seller: 'p4',
      buyer: 'p5',
      price: 120000,
      priceCap: 125000,
      saleDate: new Date(),
      buyerApproval: {
        candidateId: 'p5',
        interviewDate: new Date(),
        approved: true,
        notes: 'Good fit for community'
      }
    };

    expect(sale.type).toBe('classic');
    expect(sale.price).toBeLessThanOrEqual(sale.priceCap);
  });
});

describe('Financing Types', () => {
  it('should create individual loan application', () => {
    const loan: LoanApplication = {
      participantId: 'p1',
      status: 'pending',
      loanAmount: 200000,
      interestRate: 0.035,
      durationYears: 25,
      purpose: 'purchase',
      applicationDate: new Date(),
      bankName: 'KBC'
    };

    expect(loan.status).toBe('pending');
  });

  it('should create ACP collective loan with voting', () => {
    const acpLoan: ACPLoan = {
      id: 'acp1',
      purpose: 'roof',
      description: 'Replace aging roof',
      totalAmount: 50000,
      capitalRequired: 15000,
      capitalGathered: 0,
      contributions: new Map(),
      loanAmount: 0,
      interestRate: 0.035,
      durationYears: 10,
      votingRules: {
        method: 'hybrid',
        quorumPercentage: 50,
        majorityPercentage: 50,
        hybridWeights: {
          democraticWeight: 0.5,
          quotiteWeight: 0.5
        }
      },
      votes: new Map(),
      approvedByCoowners: false,
      votingDate: null,
      applicationDate: new Date(),
      approvalDate: null,
      disbursementDate: null,
      status: 'proposed'
    };

    expect(acpLoan.purpose).toBe('roof');
    expect(acpLoan.votingRules.method).toBe('hybrid');
  });
});

describe('Project Financials', () => {
  it('should create project financials structure', () => {
    const financials: ProjectFinancials = {
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
      indexRates: [
        { year: 2023, rate: 1.02 },
        { year: 2024, rate: 1.03 }
      ]
    };

    expect(financials.totalPurchasePrice).toBe(500000);
    expect(financials.fraisGeneraux.total3Years).toBe(45000);
  });
});
