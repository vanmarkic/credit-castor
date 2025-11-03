import { setup, assign } from 'xstate';
import type { ProjectContext, ProjectEvents } from './types';
import type { PurchaseEvents } from './events';

export const creditCastorMachine = setup({
  types: {} as {
    context: ProjectContext;
    events: ProjectEvents;
  },

  guards: {},

  actions: {
    setBankDeadline: assign({
      bankDeadline: ({ context, event }) => {
        if (event.type !== 'COMPROMIS_SIGNED') return context.bankDeadline;
        const deadline = new Date(event.compromisDate);
        deadline.setMonth(deadline.getMonth() + 4);
        return deadline;
      },
      compromisDate: ({ context, event }) => {
        if (event.type !== 'COMPROMIS_SIGNED') return context.compromisDate;
        return event.compromisDate;
      }
    }),

    recordDeedDate: assign({
      deedDate: ({ event }) => {
        if (event.type !== 'DEED_SIGNED') return null;
        return event.deedDate;
      }
    }),

    recordRegistrationDate: assign({
      registrationDate: ({ event }) => {
        if (event.type !== 'DEED_REGISTERED') return null;
        return event.registrationDate;
      }
    })
  }

}).createMachine({
  id: 'creditCastorProject',
  initial: 'pre_purchase',

  context: {
    // Legal milestones
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

    // Core data
    participants: [],
    lots: [],
    salesHistory: [],

    // Financing
    financingApplications: new Map(),
    requiredFinancing: 0,
    approvedFinancing: 0,
    bankDeadline: null,

    // ACP loans
    acpLoans: new Map(),
    acpBankAccount: 0,

    // Project financials
    projectFinancials: {
      totalPurchasePrice: 0,
      fraisGeneraux: {
        architectFees: 0,
        recurringCosts: {
          propertyTax: 388.38,
          accountant: 1000,
          podio: 600,
          buildingInsurance: 2000,
          reservationFees: 2000,
          contingencies: 2000
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
  },

  states: {
    pre_purchase: {
      on: {
        COMPROMIS_SIGNED: {
          target: 'compromis_period',
          actions: ['setBankDeadline']
        }
      }
    },

    compromis_period: {
      on: {
        ALL_CONDITIONS_MET: 'ready_for_deed'
      }
    },

    ready_for_deed: {
      on: {
        DEED_SIGNED: {
          target: 'deed_registration_pending',
          actions: ['recordDeedDate']
        }
      }
    },

    deed_registration_pending: {
      on: {
        DEED_REGISTERED: {
          target: 'ownership_transferred',
          actions: ['recordRegistrationDate']
        }
      }
    },

    ownership_transferred: {
      on: {
        START_COPRO_CREATION: 'copro_creation'
      }
    },

    copro_creation: {},
    copro_established: {},
    permit_process: {},
    permit_active: {},
    lots_declared: {},
    sales_active: {},
    completed: { type: 'final' }
  }
});
