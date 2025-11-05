import { setup, assign } from 'xstate';
import type { RentToOwnAgreement, ExtensionRequest } from './types';
import { calculateRentToOwnPayment } from './rentToOwnCalculations';

// Events
type RentToOwnEvents =
  | { type: 'RECORD_PAYMENT'; amount: number; date: Date }
  | { type: 'BUYER_REQUEST_PURCHASE' }
  | { type: 'BUYER_DECLINE_PURCHASE' }
  | { type: 'REQUEST_EXTENSION'; additionalMonths: number }
  | { type: 'EXTENSION_APPROVED' }
  | { type: 'EXTENSION_REJECTED' }
  | { type: 'VOTE_APPROVED' }
  | { type: 'VOTE_REJECTED' };

export const rentToOwnMachine = setup({
  types: {} as {
    context: RentToOwnAgreement;
    events: RentToOwnEvents;
    input: RentToOwnAgreement;
  },

  guards: {
    isTrialEnding: ({ context }) => {
      const daysRemaining = (context.trialEndDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
      return daysRemaining <= 30;  // Last month
    },

    canExtend: ({ context }) => {
      if (!context.rentToOwnFormula.allowExtensions) return false;
      const maxExtensions = context.rentToOwnFormula.maxExtensions || 0;
      const currentExtensions = context.extensionRequests.filter(e => e.approved === true).length;
      return currentExtensions < maxExtensions;
    }
  },

  actions: {
    recordPayment: assign({
      totalPaid: ({ context, event }) => {
        if (event.type !== 'RECORD_PAYMENT') return context.totalPaid;
        return context.totalPaid + event.amount;
      },
      equityAccumulated: ({ context, event }) => {
        if (event.type !== 'RECORD_PAYMENT') return context.equityAccumulated;
        const payment = calculateRentToOwnPayment(context, event.date);
        return context.equityAccumulated + payment.equityPortion;
      },
      rentPaid: ({ context, event }) => {
        if (event.type !== 'RECORD_PAYMENT') return context.rentPaid;
        const payment = calculateRentToOwnPayment(context, event.date);
        return context.rentPaid + payment.rentPortion;
      }
    }),

    extendTrial: assign({
      trialEndDate: ({ context }) => {
        const increment = context.rentToOwnFormula.extensionIncrementMonths || 6;
        const newDate = new Date(context.trialEndDate);
        newDate.setMonth(newDate.getMonth() + increment);
        return newDate;
      },
      trialDurationMonths: ({ context }) => {
        const increment = context.rentToOwnFormula.extensionIncrementMonths || 6;
        return context.trialDurationMonths + increment;
      },
      status: () => 'active' as const
    })
  }
}).createMachine({
  id: 'rentToOwn',
  initial: 'trial_active',

  context: ({ input }) => input,

  states: {
    trial_active: {
      on: {
        RECORD_PAYMENT: {
          actions: 'recordPayment'
        }
      },

      always: [
        {
          target: 'trial_ending',
          guard: 'isTrialEnding'
        }
      ]
    },

    trial_ending: {
      on: {
        BUYER_REQUEST_PURCHASE: 'community_vote',
        BUYER_DECLINE_PURCHASE: 'buyer_declined',
        REQUEST_EXTENSION: {
          target: 'extension_vote',
          guard: 'canExtend'
        }
      }
    },

    community_vote: {
      on: {
        VOTE_APPROVED: 'purchase_finalization',
        VOTE_REJECTED: 'community_rejected'
      }
    },

    extension_vote: {
      on: {
        EXTENSION_APPROVED: {
          target: 'trial_active',
          actions: 'extendTrial'
        },
        EXTENSION_REJECTED: 'trial_ending'
      }
    },

    purchase_finalization: {
      // Would invoke finalizePurchase service here
      after: {
        100: 'completed'  // Temporary - would be replaced with actual service
      }
    },

    buyer_declined: {
      type: 'final'
    },

    community_rejected: {
      type: 'final'
    },

    completed: {
      type: 'final'
    }
  }
});
