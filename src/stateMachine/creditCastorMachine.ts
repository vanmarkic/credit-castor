import { setup, assign } from 'xstate';
import type { ProjectContext } from './types';
import type { ProjectEvents } from './events';

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
    }),

    recordPrecadRequest: assign({
      precadReferenceNumber: ({ event }) => {
        if (event.type !== 'PRECAD_REQUESTED') return null;
        return event.referenceNumber;
      },
      precadRequestDate: () => {
        return new Date();
      }
    }),

    recordPrecadApproval: assign({
      precadApprovalDate: ({ event }) => {
        if (event.type !== 'PRECAD_APPROVED') return null;
        return event.approvalDate;
      }
    }),

    recordActeSignature: assign({
      acteDeBaseDate: ({ event }) => {
        if (event.type !== 'ACTE_SIGNED') return null;
        return event.signatureDate;
      }
    }),

    recordActeTranscription: assign({
      acteTranscriptionDate: ({ event }) => {
        if (event.type !== 'ACTE_TRANSCRIBED') return null;
        return event.transcriptionDate;
      },
      acpEnterpriseNumber: ({ event }) => {
        if (event.type !== 'ACTE_TRANSCRIBED') return null;
        return event.acpNumber;
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
    precadApprovalDate: null,
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

    copro_creation: {
      initial: 'awaiting_technical_report',
      states: {
        awaiting_technical_report: {
          on: {
            TECHNICAL_REPORT_READY: 'awaiting_precad'
          }
        },
        awaiting_precad: {
          on: {
            PRECAD_REQUESTED: {
              target: 'precad_review',
              actions: ['recordPrecadRequest']
            }
          }
        },
        precad_review: {
          on: {
            PRECAD_APPROVED: {
              target: 'drafting_acte',
              actions: ['recordPrecadApproval']
            }
          }
        },
        drafting_acte: {
          on: {
            ACTE_DRAFTED: 'awaiting_signatures'
          }
        },
        awaiting_signatures: {
          on: {
            ACTE_SIGNED: {
              target: 'awaiting_transcription',
              actions: ['recordActeSignature']
            }
          }
        },
        awaiting_transcription: {
          on: {
            ACTE_TRANSCRIBED: {
              target: '#creditCastorProject.copro_established',
              actions: ['recordActeTranscription']
            }
          }
        }
      }
    },

    copro_established: {},
    permit_process: {},
    permit_active: {},
    lots_declared: {},
    sales_active: {},
    completed: { type: 'final' }
  }
});
