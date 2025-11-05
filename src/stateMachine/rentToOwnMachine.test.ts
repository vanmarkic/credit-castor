import { describe, it, expect } from 'vitest';
import { createActor } from 'xstate';
import { rentToOwnMachine } from './rentToOwnMachine';
import { DEFAULT_RENT_TO_OWN_FORMULA } from './types';

describe('RentToOwnMachine', () => {
  it('should start in trial_active state', () => {
    const actor = createActor(rentToOwnMachine, {
      input: {
        id: 'rto-001',
        underlyingSale: {
          type: 'portage',
          lotId: 'lot-2',
          buyer: 'buyer-123',
          seller: 'seller-456',
          saleDate: new Date('2027-06-01'),
          pricing: {
            baseAcquisitionCost: 200000,
            indexation: 5000,
            carryingCosts: {
              monthlyLoanInterest: 500,
              propertyTax: 100,
              buildingInsurance: 50,
              syndicFees: 100,
              chargesCommunes: 50,
              totalMonths: 12,
              total: 9600
            },
            renovations: 0,
            registrationFeesRecovery: 25000,
            fraisCommunsRecovery: 5000,
            loanInterestRecovery: 6000,
            totalPrice: 250600
          }
        },
        trialStartDate: new Date('2027-06-01'),
        trialEndDate: new Date('2028-06-01'),
        trialDurationMonths: 12,
        monthlyPayment: 1500,
        totalPaid: 0,
        equityAccumulated: 0,
        rentPaid: 0,
        rentToOwnFormula: DEFAULT_RENT_TO_OWN_FORMULA,
        provisionalBuyerId: 'buyer-123',
        sellerId: 'seller-456',
        status: 'active',
        extensionRequests: []
      }
    });

    actor.start();
    expect(actor.getSnapshot().value).toBe('trial_active');
  });

  it('should transition to trial_ending when 30 days remain', () => {
    const nearEndDate = new Date();
    nearEndDate.setDate(nearEndDate.getDate() + 29);  // 29 days from now

    const actor = createActor(rentToOwnMachine, {
      input: {
        id: 'rto-001',
        underlyingSale: {
          type: 'portage',
          lotId: 'lot-2',
          buyer: 'buyer-123',
          seller: 'seller-456',
          saleDate: new Date('2027-06-01'),
          pricing: {
            baseAcquisitionCost: 200000,
            indexation: 5000,
            carryingCosts: {
              monthlyLoanInterest: 500,
              propertyTax: 100,
              buildingInsurance: 50,
              syndicFees: 100,
              chargesCommunes: 50,
              totalMonths: 12,
              total: 9600
            },
            renovations: 0,
            registrationFeesRecovery: 25000,
            fraisCommunsRecovery: 5000,
            loanInterestRecovery: 6000,
            totalPrice: 250600
          }
        },
        trialStartDate: new Date('2027-06-01'),
        trialEndDate: nearEndDate,
        trialDurationMonths: 12,
        monthlyPayment: 1500,
        totalPaid: 0,
        equityAccumulated: 0,
        rentPaid: 0,
        rentToOwnFormula: DEFAULT_RENT_TO_OWN_FORMULA,
        provisionalBuyerId: 'buyer-123',
        sellerId: 'seller-456',
        status: 'active',
        extensionRequests: []
      }
    });

    actor.start();
    // Should auto-transition to trial_ending
    expect(actor.getSnapshot().value).toBe('trial_ending');
  });

  it('should record payment and update equity', () => {
    const actor = createActor(rentToOwnMachine, {
      input: {
        id: 'rto-001',
        underlyingSale: {
          type: 'portage',
          lotId: 'lot-2',
          buyer: 'buyer-123',
          seller: 'seller-456',
          saleDate: new Date('2027-06-01'),
          pricing: {
            baseAcquisitionCost: 200000,
            indexation: 5000,
            carryingCosts: {
              monthlyLoanInterest: 500,
              propertyTax: 100,
              buildingInsurance: 50,
              syndicFees: 100,
              chargesCommunes: 50,
              totalMonths: 12,
              total: 9600
            },
            renovations: 0,
            registrationFeesRecovery: 25000,
            fraisCommunsRecovery: 5000,
            loanInterestRecovery: 6000,
            totalPrice: 250600
          }
        },
        trialStartDate: new Date('2027-06-01'),
        trialEndDate: new Date('2028-06-01'),
        trialDurationMonths: 12,
        monthlyPayment: 1500,
        totalPaid: 0,
        equityAccumulated: 0,
        rentPaid: 0,
        rentToOwnFormula: DEFAULT_RENT_TO_OWN_FORMULA,
        provisionalBuyerId: 'buyer-123',
        sellerId: 'seller-456',
        status: 'active',
        extensionRequests: []
      }
    });

    actor.start();

    actor.send({
      type: 'RECORD_PAYMENT',
      amount: 1500,
      date: new Date('2027-07-01')
    });

    const context = actor.getSnapshot().context;
    expect(context.totalPaid).toBe(1500);
    expect(context.equityAccumulated).toBe(750);  // 50% of 1500
    expect(context.rentPaid).toBe(750);  // 50% of 1500
  });

  it('should transition to community_vote when buyer requests purchase', () => {
    const nearEndDate = new Date();
    nearEndDate.setDate(nearEndDate.getDate() + 15);

    const actor = createActor(rentToOwnMachine, {
      input: {
        id: 'rto-001',
        underlyingSale: {
          type: 'portage',
          lotId: 'lot-2',
          buyer: 'buyer-123',
          seller: 'seller-456',
          saleDate: new Date('2027-06-01'),
          pricing: {
            baseAcquisitionCost: 200000,
            indexation: 5000,
            carryingCosts: {
              monthlyLoanInterest: 500,
              propertyTax: 100,
              buildingInsurance: 50,
              syndicFees: 100,
              chargesCommunes: 50,
              totalMonths: 12,
              total: 9600
            },
            renovations: 0,
            registrationFeesRecovery: 25000,
            fraisCommunsRecovery: 5000,
            loanInterestRecovery: 6000,
            totalPrice: 250600
          }
        },
        trialStartDate: new Date('2027-06-01'),
        trialEndDate: nearEndDate,
        trialDurationMonths: 12,
        monthlyPayment: 1500,
        totalPaid: 18000,
        equityAccumulated: 9000,
        rentPaid: 9000,
        rentToOwnFormula: DEFAULT_RENT_TO_OWN_FORMULA,
        provisionalBuyerId: 'buyer-123',
        sellerId: 'seller-456',
        status: 'ending_soon',
        extensionRequests: []
      }
    });

    actor.start();

    actor.send({ type: 'BUYER_REQUEST_PURCHASE' });

    expect(actor.getSnapshot().value).toBe('community_vote');
  });

  it('should transition to buyer_declined when buyer declines', () => {
    const nearEndDate = new Date();
    nearEndDate.setDate(nearEndDate.getDate() + 15);

    const actor = createActor(rentToOwnMachine, {
      input: {
        id: 'rto-001',
        underlyingSale: {
          type: 'portage',
          lotId: 'lot-2',
          buyer: 'buyer-123',
          seller: 'seller-456',
          saleDate: new Date('2027-06-01'),
          pricing: {
            baseAcquisitionCost: 200000,
            indexation: 5000,
            carryingCosts: {
              monthlyLoanInterest: 500,
              propertyTax: 100,
              buildingInsurance: 50,
              syndicFees: 100,
              chargesCommunes: 50,
              totalMonths: 12,
              total: 9600
            },
            renovations: 0,
            registrationFeesRecovery: 25000,
            fraisCommunsRecovery: 5000,
            loanInterestRecovery: 6000,
            totalPrice: 250600
          }
        },
        trialStartDate: new Date('2027-06-01'),
        trialEndDate: nearEndDate,
        trialDurationMonths: 12,
        monthlyPayment: 1500,
        totalPaid: 18000,
        equityAccumulated: 9000,
        rentPaid: 9000,
        rentToOwnFormula: DEFAULT_RENT_TO_OWN_FORMULA,
        provisionalBuyerId: 'buyer-123',
        sellerId: 'seller-456',
        status: 'ending_soon',
        extensionRequests: []
      }
    });

    actor.start();

    actor.send({ type: 'BUYER_DECLINE_PURCHASE' });

    expect(actor.getSnapshot().value).toBe('buyer_declined');
  });

  it('should allow extension when extensions are allowed and limit not reached', () => {
    const nearEndDate = new Date();
    nearEndDate.setDate(nearEndDate.getDate() + 15);

    const actor = createActor(rentToOwnMachine, {
      input: {
        id: 'rto-001',
        underlyingSale: {
          type: 'portage',
          lotId: 'lot-2',
          buyer: 'buyer-123',
          seller: 'seller-456',
          saleDate: new Date('2027-06-01'),
          pricing: {
            baseAcquisitionCost: 200000,
            indexation: 5000,
            carryingCosts: {
              monthlyLoanInterest: 500,
              propertyTax: 100,
              buildingInsurance: 50,
              syndicFees: 100,
              chargesCommunes: 50,
              totalMonths: 12,
              total: 9600
            },
            renovations: 0,
            registrationFeesRecovery: 25000,
            fraisCommunsRecovery: 5000,
            loanInterestRecovery: 6000,
            totalPrice: 250600
          }
        },
        trialStartDate: new Date('2027-06-01'),
        trialEndDate: nearEndDate,
        trialDurationMonths: 12,
        monthlyPayment: 1500,
        totalPaid: 18000,
        equityAccumulated: 9000,
        rentPaid: 9000,
        rentToOwnFormula: DEFAULT_RENT_TO_OWN_FORMULA,
        provisionalBuyerId: 'buyer-123',
        sellerId: 'seller-456',
        status: 'ending_soon',
        extensionRequests: []
      }
    });

    actor.start();

    actor.send({ type: 'REQUEST_EXTENSION', additionalMonths: 6 });

    expect(actor.getSnapshot().value).toBe('extension_vote');
  });
});
