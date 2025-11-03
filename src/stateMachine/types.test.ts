import { describe, it, expect } from 'vitest';
import type { Participant, Lot, ProjectContext, PortageSale, CoproSale, ClassicSale } from './types';

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
