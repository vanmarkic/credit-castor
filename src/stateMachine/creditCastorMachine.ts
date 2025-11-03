import { setup, assign } from 'xstate';
import type { ProjectContext, PortagePricing, CoproPricing, CarryingCosts } from './types';
import type { ProjectEvents } from './events';
import { queries } from './queries';

// Temporary storage for current sale in progress
interface CurrentSale {
  lotId: string;
  sellerId: string;
  buyerId: string;
  proposedPrice: number;
  saleDate: Date;
  saleType: 'portage' | 'copro' | 'classic';
  buyerApproval?: {
    candidateId: string;
    interviewDate: Date;
    approved: boolean;
    notes: string;
  };
}

// Extended context to track current sale
interface ExtendedContext extends ProjectContext {
  currentSale?: CurrentSale;
  firstSaleDate?: Date;
}

export const creditCastorMachine = setup({
  types: {} as {
    context: ExtendedContext;
    events: ProjectEvents;
  },

  guards: {
    isPortageSale: ({ context }) => {
      if (!context.currentSale) return false;
      return context.currentSale.saleType === 'portage';
    },
    isCoproSale: ({ context }) => {
      if (!context.currentSale) return false;
      return context.currentSale.saleType === 'copro';
    },
    isClassicSale: ({ context }) => {
      if (!context.currentSale) return false;
      return context.currentSale.saleType === 'classic';
    },
    isClassicSaleInitiation: ({ context, event }) => {
      if (event.type !== 'SALE_INITIATED') return false;
      const saleType = queries.getSaleType(context, event.lotId, event.sellerId);
      return saleType === 'classic';
    }
  },

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
    }),

    recordPermitRequest: assign({
      permitRequestedDate: () => {
        return new Date();
      }
    }),

    recordPermitGrant: assign({
      permitGrantedDate: ({ event }) => {
        if (event.type !== 'PERMIT_GRANTED') return null;
        return event.grantDate;
      }
    }),

    recordPermitEnactment: assign({
      permitEnactedDate: ({ event }) => {
        if (event.type !== 'PERMIT_ENACTED') return null;
        return event.enactmentDate;
      }
    }),

    // Sales actions
    recordFirstSale: assign({
      firstSaleDate: () => {
        return new Date();
      }
    }),

    initiateSale: assign({
      currentSale: ({ context, event }) => {
        if (event.type !== 'SALE_INITIATED') return context.currentSale;

        const saleType = queries.getSaleType(context, event.lotId, event.sellerId);

        return {
          lotId: event.lotId,
          sellerId: event.sellerId,
          buyerId: event.buyerId,
          proposedPrice: event.proposedPrice,
          saleDate: event.saleDate,
          saleType
        };
      }
    }),

    handleBuyerApproval: assign({
      currentSale: ({ context, event }) => {
        if (event.type !== 'BUYER_APPROVED' || !context.currentSale) {
          return context.currentSale;
        }

        return {
          ...context.currentSale,
          buyerApproval: {
            candidateId: event.candidateId,
            interviewDate: new Date(),
            approved: true,
            notes: ''
          }
        };
      }
    }),

    handleBuyerRejection: assign({
      currentSale: undefined
    }),

    recordCompletedSale: assign({
      salesHistory: ({ context }) => {
        if (!context.currentSale) return context.salesHistory;

        const { currentSale } = context;
        const lot = context.lots.find(l => l.id === currentSale.lotId);

        if (!lot) return context.salesHistory;

        let sale: any;

        if (currentSale.saleType === 'portage') {
          // Calculate portage pricing
          const carryingCosts: CarryingCosts = {
            monthlyLoanInterest: 500,
            propertyTax: 100,
            buildingInsurance: 50,
            syndicFees: 100,
            chargesCommunes: 50,
            totalMonths: 12,
            total: 800 * 12
          };

          const pricing: PortagePricing = {
            baseAcquisitionCost: lot.acquisition?.totalCost || 0,
            indexation: (lot.acquisition?.totalCost || 0) * 0.05,
            carryingCosts,
            renovations: lot.renovationCosts || 0,
            registrationFeesRecovery: lot.acquisition?.registrationFees || 0,
            fraisCommunsRecovery: lot.acquisition?.fraisCommuns || 0,
            loanInterestRecovery: carryingCosts.monthlyLoanInterest * carryingCosts.totalMonths,
            totalPrice: (lot.acquisition?.totalCost || 0) + carryingCosts.total + (lot.acquisition?.registrationFees || 0) + (lot.acquisition?.fraisCommuns || 0)
          };

          sale = {
            type: 'portage',
            lotId: currentSale.lotId,
            buyer: currentSale.buyerId,
            seller: currentSale.sellerId,
            saleDate: currentSale.saleDate,
            pricing
          };
        } else if (currentSale.saleType === 'copro') {
          // Calculate copro pricing
          const baseCostPerSqm = 1000;
          const gen1CompensationPerSqm = baseCostPerSqm * 0.10;
          const pricePerSqm = baseCostPerSqm + gen1CompensationPerSqm;

          const pricing: CoproPricing = {
            baseCostPerSqm,
            gen1CompensationPerSqm,
            pricePerSqm,
            surface: lot.surface,
            totalPrice: pricePerSqm * lot.surface
          };

          sale = {
            type: 'copro',
            lotId: currentSale.lotId,
            buyer: currentSale.buyerId,
            saleDate: currentSale.saleDate,
            surface: lot.surface,
            pricing
          };
        } else {
          // Classic sale
          const acquisitionCost = lot.acquisition?.totalCost || 0;
          const priceCap = acquisitionCost * 1.10; // Cost + 10% indexation

          sale = {
            type: 'classic',
            lotId: currentSale.lotId,
            buyer: currentSale.buyerId,
            seller: currentSale.sellerId,
            saleDate: currentSale.saleDate,
            price: currentSale.proposedPrice,
            buyerApproval: currentSale.buyerApproval || {
              candidateId: currentSale.buyerId,
              interviewDate: new Date(),
              approved: true,
              notes: ''
            },
            priceCap
          };
        }

        return [...context.salesHistory, sale];
      },
      currentSale: undefined
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

    copro_established: {
      on: {
        REQUEST_PERMIT: {
          target: 'permit_process',
          actions: ['recordPermitRequest']
        }
      }
    },

    permit_process: {
      initial: 'permit_review',
      states: {
        permit_review: {
          on: {
            PERMIT_GRANTED: {
              target: 'awaiting_enactment',
              actions: ['recordPermitGrant']
            },
            PERMIT_REJECTED: {
              target: 'awaiting_request'
            }
          }
        },
        awaiting_request: {
          on: {
            REQUEST_PERMIT: {
              target: 'permit_review',
              actions: ['recordPermitRequest']
            }
          }
        },
        awaiting_enactment: {
          on: {
            PERMIT_ENACTED: {
              target: '#creditCastorProject.permit_active',
              actions: ['recordPermitEnactment']
            }
          }
        }
      }
    },

    permit_active: {
      on: {
        DECLARE_HIDDEN_LOTS: 'lots_declared'
      }
    },

    lots_declared: {
      on: {
        FIRST_SALE: {
          target: 'sales_active',
          actions: ['recordFirstSale']
        }
      }
    },

    sales_active: {
      initial: 'awaiting_sale',
      states: {
        awaiting_sale: {
          on: {
            SALE_INITIATED: [
              {
                target: 'awaiting_buyer_approval',
                guard: 'isClassicSaleInitiation',
                actions: ['initiateSale']
              },
              {
                target: 'processing_sale',
                actions: ['initiateSale']
              }
            ],
            ALL_LOTS_SOLD: {
              target: '#creditCastorProject.completed'
            }
          }
        },
        processing_sale: {
          on: {
            COMPLETE_SALE: {
              target: 'awaiting_sale',
              actions: ['recordCompletedSale']
            }
          }
        },
        awaiting_buyer_approval: {
          on: {
            BUYER_APPROVED: {
              target: 'processing_sale',
              actions: ['handleBuyerApproval']
            },
            BUYER_REJECTED: {
              target: 'awaiting_sale',
              actions: ['handleBuyerRejection']
            }
          }
        }
      },
      on: {
        ALL_LOTS_SOLD: {
          target: 'completed'
        }
      }
    },

    completed: { type: 'final' }
  }
});
