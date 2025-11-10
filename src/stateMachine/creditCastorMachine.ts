import { setup, assign, spawnChild, stopChild } from 'xstate';
import type { ProjectContext, PortagePricing, CoproPricing, CarryingCosts, LoanApplication, ACPLoan, ACPContribution, VotingRules, RentToOwnAgreement } from './types';
import { DEFAULT_RENT_TO_OWN_FORMULA } from './types';
import type { ProjectEvents } from './events';
import { queries } from './queries';
import { calculateQuotite, calculateVotingResults } from './calculations';
import { rentToOwnMachine } from './rentToOwnMachine';
import { calculateCoproSalePrice, distributeCoproProceeds, calculateYearsHeld } from '../utils/portageCalculations';
import type { ParticipantSurface } from '../utils/portageCalculations';

// Temporary storage for current sale in progress
interface CurrentSale {
  lotId: string;
  sellerId: string;
  buyerId: string;
  proposedPrice: number;
  saleDate: Date;
  saleType: 'portage' | 'copro' | 'classic';
  surfacePurchased?: number; // For copro sales (free choice)
  buyerApproval?: {
    candidateId: string;
    interviewDate: Date;
    approved: boolean;
    notes: string;
  };
}

// Extended context to track current sale and ACP loan
interface ExtendedContext extends ProjectContext {
  currentSale?: CurrentSale;
  firstSaleDate?: Date;
  currentACPLoanId?: string;
}

export const creditCastorMachine = setup({
  types: {} as {
    context: ExtendedContext;
    events: ProjectEvents;
  },

  actors: {
    rentToOwn: rentToOwnMachine
  },

  guards: {
    // Sales guards
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
    },

    // Financing guards
    allFinancingApproved: ({ context }) => {
      return context.approvedFinancing >= context.requiredFinancing;
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
          // NEW: Calculate copro sale pricing with distribution

          // Get total project cost from context
          const totalProjectCost = context.projectFinancials.totalPurchasePrice;

          // Calculate total building surface from all participants (founders)
          const totalBuildingSurface = context.participants
            .filter(p => p.isFounder)
            .reduce((sum, p) => sum + p.lotsOwned.reduce((lotSum, lot) => lotSum + lot.surface, 0), 0);

          // Calculate years held from acte transcription date (T0)
          const yearsHeld = context.acteTranscriptionDate
            ? calculateYearsHeld(context.acteTranscriptionDate, currentSale.saleDate)
            : 0;

          // Get total carrying costs (simplified for MVP - could be tracked more precisely)
          // This is a rough estimate: total monthly obligations × months
          const monthlyObligations = context.projectFinancials.fraisGeneraux.recurringCosts.propertyTax / 12 +
            context.projectFinancials.fraisGeneraux.recurringCosts.buildingInsurance / 12;
          const totalCarryingCosts = monthlyObligations * yearsHeld * 12;

          // Default formula params (should be configurable in production)
          const formulaParams = {
            indexationRate: 2, // 2% per year
            carryingCostRecovery: 100, // 100% recovery
            averageInterestRate: 4.5, // 4.5% (default average)
            coproReservesShare: 30 // 30% to reserves, 70% to founders
          };

          // Calculate surface purchased (default to lot surface if not specified)
          const surfacePurchased = currentSale.surfacePurchased || lot.surface;

          // Calculate price using new formula
          const coproSalePricing = calculateCoproSalePrice(
            surfacePurchased,
            totalProjectCost,
            totalBuildingSurface,
            yearsHeld,
            formulaParams,
            totalCarryingCosts
          );

          // Distribute 70% to founders based on T0 quotité
          const founders: ParticipantSurface[] = context.participants
            .filter(p => p.isFounder)
            .map(p => ({
              name: p.name,
              surface: p.lotsOwned.reduce((sum, lot) => sum + lot.surface, 0)
            }));

          const participantDistribution = distributeCoproProceeds(
            coproSalePricing.distribution.toParticipants,
            founders,
            totalBuildingSurface
          );

          // Build pricing object with both old and new formats for backward compatibility
          const pricing: CoproPricing = {
            baseCostPerSqm: coproSalePricing.basePrice / surfacePurchased,
            gen1CompensationPerSqm: 0, // Deprecated
            pricePerSqm: coproSalePricing.pricePerM2,
            surface: surfacePurchased,
            totalPrice: coproSalePricing.totalPrice,
            breakdown: {
              basePrice: coproSalePricing.basePrice,
              indexation: coproSalePricing.indexation,
              carryingCostRecovery: coproSalePricing.carryingCostRecovery
            },
            distribution: {
              toCoproReserves: coproSalePricing.distribution.toCoproReserves,
              toParticipants: participantDistribution
            }
          };

          sale = {
            type: 'copro',
            lotId: currentSale.lotId,
            buyer: currentSale.buyerId,
            saleDate: currentSale.saleDate,
            surface: surfacePurchased,
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

      // NEW: Update copro cash reserves with 30% from copro sales
      acpBankAccount: ({ context }) => {
        if (!context.currentSale || context.currentSale.saleType !== 'copro') {
          return context.acpBankAccount;
        }

        // Get the last sale (the one we just added)
        const sale = context.salesHistory[context.salesHistory.length - 1];
        if (sale?.type !== 'copro' || !sale.pricing.distribution) {
          return context.acpBankAccount;
        }

        return context.acpBankAccount + sale.pricing.distribution.toCoproReserves;
      },

      currentSale: undefined
    }),

    // Individual loan financing actions
    applyForLoan: assign({
      financingApplications: ({ context, event }) => {
        if (event.type !== 'APPLY_FOR_LOAN') return context.financingApplications;

        const newMap = new Map(context.financingApplications);
        const loanApp: LoanApplication = {
          participantId: event.participantId,
          status: 'pending',
          loanAmount: event.loanDetails.amount,
          interestRate: event.loanDetails.rate,
          durationYears: event.loanDetails.duration,
          purpose: 'purchase', // Default to purchase, can be overridden
          applicationDate: new Date(),
          bankName: event.loanDetails.bankName
        };

        newMap.set(event.participantId, loanApp);
        return newMap;
      }
    }),

    approveLoan: assign({
      financingApplications: ({ context, event }) => {
        if (event.type !== 'BANK_APPROVES') return context.financingApplications;

        const newMap = new Map(context.financingApplications);
        const loanApp = newMap.get(event.participantId);

        if (loanApp) {
          newMap.set(event.participantId, {
            ...loanApp,
            status: 'approved',
            approvalDate: new Date()
          });
        }

        return newMap;
      },
      approvedFinancing: ({ context, event }) => {
        if (event.type !== 'BANK_APPROVES') return context.approvedFinancing;

        const loanApp = context.financingApplications.get(event.participantId);
        if (loanApp) {
          return context.approvedFinancing + loanApp.loanAmount;
        }

        return context.approvedFinancing;
      }
    }),

    rejectLoan: assign({
      financingApplications: ({ context, event }) => {
        if (event.type !== 'BANK_REJECTS') return context.financingApplications;

        const newMap = new Map(context.financingApplications);
        const loanApp = newMap.get(event.participantId);

        if (loanApp) {
          newMap.set(event.participantId, {
            ...loanApp,
            status: 'rejected',
            rejectionReason: event.reason
          });
        }

        return newMap;
      }
    }),

    // ACP Collective Loan actions
    proposeACPLoan: assign(({ context, event }) => {
      if (event.type !== 'PROPOSE_ACP_LOAN') return {};

      const loanId = `acp-loan-${Date.now()}`;
      const newMap = new Map(context.acpLoans);

      const votingRules: VotingRules = {
        method: 'hybrid',
        quorumPercentage: 50,
        majorityPercentage: 50,
        hybridWeights: {
          democraticWeight: 0.5,
          quotiteWeight: 0.5
        }
      };

      const acpLoan: ACPLoan = {
        id: loanId,
        purpose: event.loanDetails.purpose,
        description: event.loanDetails.description,
        totalAmount: event.loanDetails.totalAmount,
        capitalRequired: event.loanDetails.capitalRequired,
        capitalGathered: 0,
        contributions: new Map(),
        loanAmount: event.loanDetails.totalAmount - event.loanDetails.capitalRequired,
        interestRate: 0.03, // Default 3%
        durationYears: 15, // Default 15 years
        votingRules,
        votes: new Map(),
        approvedByCoowners: false,
        votingDate: null,
        applicationDate: new Date(),
        approvalDate: null,
        disbursementDate: null,
        status: 'proposed'
      };

      newMap.set(loanId, acpLoan);

      return {
        acpLoans: newMap,
        currentACPLoanId: loanId
      };
    }),

    scheduleVote: assign({
      acpLoans: ({ context, event }) => {
        if (event.type !== 'SCHEDULE_VOTE' || !context.currentACPLoanId) return context.acpLoans;

        const newMap = new Map(context.acpLoans);
        const loan = newMap.get(context.currentACPLoanId);

        if (loan) {
          newMap.set(context.currentACPLoanId, {
            ...loan,
            status: 'voting',
            votingDate: event.votingDate
          });
        }

        return newMap;
      }
    }),

    recordVote: assign({
      acpLoans: ({ context, event }) => {
        if (event.type !== 'VOTE_ON_LOAN' || !context.currentACPLoanId) return context.acpLoans;

        const newMap = new Map(context.acpLoans);
        const loan = newMap.get(context.currentACPLoanId);

        if (loan) {
          const participant = context.participants.find(p => p.id === event.participantId);
          const quotite = calculateQuotite(participant, context);

          const newVotes = new Map(loan.votes);
          newVotes.set(event.participantId, {
            participantId: event.participantId,
            vote: event.vote,
            quotite,
            timestamp: new Date()
          });

          newMap.set(context.currentACPLoanId, {
            ...loan,
            votes: newVotes
          });
        }

        return newMap;
      }
    }),

    tallyVotes: assign({
      acpLoans: ({ context }) => {
        if (!context.currentACPLoanId) return context.acpLoans;

        const newMap = new Map(context.acpLoans);
        const loan = newMap.get(context.currentACPLoanId);

        if (loan) {
          const votingResults = calculateVotingResults(
            loan.votes,
            loan.votingRules,
            context.participants.length,
            1.0
          );

          const approved = votingResults.quorumReached && votingResults.majorityReached;

          newMap.set(context.currentACPLoanId, {
            ...loan,
            votingResults,
            approvedByCoowners: approved,
            status: approved ? 'capital_gathering' : 'rejected'
          });
        }

        return newMap;
      }
    }),

    pledgeCapital: assign({
      acpLoans: ({ context, event }) => {
        if (event.type !== 'PLEDGE_CAPITAL' || !context.currentACPLoanId) return context.acpLoans;

        const newMap = new Map(context.acpLoans);
        const loan = newMap.get(context.currentACPLoanId);

        if (loan) {
          const participant = context.participants.find(p => p.id === event.participantId);
          const quotite = calculateQuotite(participant, context);

          const newContributions = new Map(loan.contributions);
          const contribution: ACPContribution = {
            participantId: event.participantId,
            amountPledged: event.amount,
            amountPaid: 0,
            quotiteShare: quotite,
            paymentDate: null
          };
          newContributions.set(event.participantId, contribution);

          newMap.set(context.currentACPLoanId, {
            ...loan,
            contributions: newContributions
          });
        }

        return newMap;
      }
    }),

    payCapital: assign({
      acpLoans: ({ context, event }) => {
        if (event.type !== 'PAY_CAPITAL' || !context.currentACPLoanId) return context.acpLoans;

        const newMap = new Map(context.acpLoans);
        const loan = newMap.get(context.currentACPLoanId);

        if (loan) {
          const contribution = loan.contributions.get(event.participantId);

          if (contribution) {
            const newContributions = new Map(loan.contributions);
            const updatedContribution: ACPContribution = {
              ...contribution,
              amountPaid: event.amount,
              paymentDate: new Date()
            };
            newContributions.set(event.participantId, updatedContribution);

            const capitalGathered = Array.from(newContributions.values())
              .reduce((sum, c) => sum + c.amountPaid, 0);

            newMap.set(context.currentACPLoanId, {
              ...loan,
              contributions: newContributions,
              capitalGathered
            });
          }
        }

        return newMap;
      }
    }),

    applyForACPLoan: assign({
      acpLoans: ({ context, event }) => {
        if (event.type !== 'APPLY_FOR_ACP_LOAN') return context.acpLoans;

        const newMap = new Map(context.acpLoans);
        const loan = newMap.get(event.loanId);

        if (loan) {
          newMap.set(event.loanId, {
            ...loan,
            status: 'loan_application'
          });
        }

        return newMap;
      }
    }),

    approveACPLoan: assign({
      acpLoans: ({ context, event }) => {
        if (event.type !== 'ACP_LOAN_APPROVED') return context.acpLoans;

        const newMap = new Map(context.acpLoans);
        const loan = newMap.get(event.loanId);

        if (loan) {
          newMap.set(event.loanId, {
            ...loan,
            status: 'approved',
            approvalDate: new Date()
          });
        }

        return newMap;
      }
    }),

    disburseACPLoan: assign({
      acpLoans: ({ context, event }) => {
        if (event.type !== 'DISBURSE_ACP_LOAN') return context.acpLoans;

        const newMap = new Map(context.acpLoans);
        const loan = newMap.get(event.loanId);

        if (loan) {
          newMap.set(event.loanId, {
            ...loan,
            status: 'disbursed',
            disbursementDate: new Date()
          });
        }

        return newMap;
      },
      acpBankAccount: ({ context, event }) => {
        if (event.type !== 'DISBURSE_ACP_LOAN') return context.acpBankAccount;

        const loan = context.acpLoans.get(event.loanId);
        if (loan) {
          return context.acpBankAccount + loan.loanAmount;
        }

        return context.acpBankAccount;
      }
    }),

    // Rent-to-Own actions
    initiateRentToOwn: assign(({ context, event }) => {
      if (event.type !== 'INITIATE_RENT_TO_OWN') return {};

      // Find the sale from currentSale
      const { currentSale } = context as ExtendedContext;
      if (!currentSale) return {};

      const agreementId = `rto-${Date.now()}`;
      const trialStartDate = new Date();
      const trialEndDate = new Date(trialStartDate);
      trialEndDate.setMonth(trialEndDate.getMonth() + event.trialMonths);

      // Create the underlying sale object
      const lot = context.lots.find(l => l.id === currentSale.lotId);
      if (!lot) return {};

      let underlyingSale: any;

      if (currentSale.saleType === 'portage') {
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

        underlyingSale = {
          type: 'portage',
          lotId: currentSale.lotId,
          buyer: currentSale.buyerId,
          seller: currentSale.sellerId,
          saleDate: currentSale.saleDate,
          pricing
        };
      } else if (currentSale.saleType === 'copro') {
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

        underlyingSale = {
          type: 'copro',
          lotId: currentSale.lotId,
          buyer: currentSale.buyerId,
          saleDate: currentSale.saleDate,
          surface: lot.surface,
          pricing
        };
      } else {
        const acquisitionCost = lot.acquisition?.totalCost || 0;
        const priceCap = acquisitionCost * 1.10;

        underlyingSale = {
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

      const agreement: RentToOwnAgreement = {
        id: agreementId,
        underlyingSale,
        trialStartDate,
        trialEndDate,
        trialDurationMonths: event.trialMonths,
        monthlyPayment: event.monthlyPayment,
        totalPaid: 0,
        equityAccumulated: 0,
        rentPaid: 0,
        rentToOwnFormula: DEFAULT_RENT_TO_OWN_FORMULA,
        provisionalBuyerId: currentSale.buyerId,
        sellerId: currentSale.sellerId,
        status: 'active',
        extensionRequests: []
      };

      const newAgreements = new Map(context.rentToOwnAgreements);
      newAgreements.set(agreementId, agreement);

      return {
        rentToOwnAgreements: newAgreements,
        currentSale: undefined
      };
    }),

    spawnRentToOwnActor: spawnChild('rentToOwn', {
      id: ({ context, event }) => {
        if (event.type !== 'INITIATE_RENT_TO_OWN') return '';
        // Find the most recently added agreement
        const agreements = Array.from(context.rentToOwnAgreements.values());
        return agreements[agreements.length - 1]?.id || '';
      },
      input: ({ context }) => {
        // Get the most recently added agreement
        const agreements = Array.from(context.rentToOwnAgreements.values());
        return agreements[agreements.length - 1];
      }
    }),

    completeRentToOwn: assign({
      rentToOwnAgreements: ({ context, event }) => {
        if (event.type !== 'RENT_TO_OWN_COMPLETED') return context.rentToOwnAgreements;

        const newMap = new Map(context.rentToOwnAgreements);
        newMap.delete(event.agreementId);

        return newMap;
      },
      salesHistory: ({ context, event }) => {
        if (event.type !== 'RENT_TO_OWN_COMPLETED') return context.salesHistory;

        const agreement = context.rentToOwnAgreements.get(event.agreementId);
        if (agreement) {
          return [...context.salesHistory, agreement.underlyingSale];
        }

        return context.salesHistory;
      }
    }),

    cancelRentToOwn: assign({
      rentToOwnAgreements: ({ context, event }) => {
        if (event.type !== 'RENT_TO_OWN_CANCELLED') return context.rentToOwnAgreements;

        const newMap = new Map(context.rentToOwnAgreements);
        newMap.delete(event.agreementId);

        return newMap;
      }
    }),

    stopRentToOwnActor: stopChild(({ event }) => {
      if (event.type === 'RENT_TO_OWN_COMPLETED' || event.type === 'RENT_TO_OWN_CANCELLED') {
        return event.agreementId;
      }
      return '';
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

    // Rent-to-own agreements
    rentToOwnAgreements: new Map(),

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
        APPLY_FOR_LOAN: {
          actions: ['applyForLoan']
        },
        BANK_APPROVES: {
          actions: ['approveLoan']
        },
        BANK_REJECTS: {
          actions: ['rejectLoan']
        },
        ALL_CONDITIONS_MET: {
          target: 'ready_for_deed',
          guard: 'allFinancingApproved'
        }
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
        },
        PROPOSE_ACP_LOAN: {
          actions: ['proposeACPLoan']
        },
        SCHEDULE_VOTE: {
          actions: ['scheduleVote']
        },
        VOTE_ON_LOAN: {
          actions: ['recordVote']
        },
        VOTING_COMPLETE: {
          actions: ['tallyVotes']
        },
        PLEDGE_CAPITAL: {
          actions: ['pledgeCapital']
        },
        PAY_CAPITAL: {
          actions: ['payCapital']
        },
        APPLY_FOR_ACP_LOAN: {
          actions: ['applyForACPLoan']
        },
        ACP_LOAN_APPROVED: {
          actions: ['approveACPLoan']
        },
        DISBURSE_ACP_LOAN: {
          actions: ['disburseACPLoan']
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
            },
            INITIATE_RENT_TO_OWN: {
              target: 'awaiting_sale',
              actions: ['initiateRentToOwn', 'spawnRentToOwnActor']
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
        },
        RENT_TO_OWN_COMPLETED: {
          actions: ['stopRentToOwnActor', 'completeRentToOwn']
        },
        RENT_TO_OWN_CANCELLED: {
          actions: ['stopRentToOwnActor', 'cancelRentToOwn']
        }
      }
    },

    completed: { type: 'final' }
  }
});
