import { setup, assign } from 'xstate';
import type {
  UsageAgreement,
  SharedSpace,
  UsageRecord,
  SharedSpaceAlert,
  ParticipantVote,
  UsageType
} from './types';

/**
 * Shared Space Machine Events
 *
 * Manages the lifecycle of shared space usage agreements
 * across the three governance models: solidaire, commercial, quota
 */
type SharedSpaceEvents =
  // Proposal and approval
  | { type: 'SUBMIT_FOR_APPROVAL' }
  | { type: 'VOTE_ON_USAGE'; participantId: string; vote: 'for' | 'against' | 'abstain' }
  | { type: 'VOTING_COMPLETE' }
  | { type: 'APPROVE_DIRECTLY' }  // For quota model (no vote needed)
  | { type: 'REJECT_PROPOSAL' }

  // Usage tracking
  | { type: 'RECORD_USAGE'; startDate: Date; endDate: Date; usageType: UsageType; purpose?: string }
  | { type: 'CANCEL_USAGE'; usageRecordId: string }

  // Quota management (quota model)
  | { type: 'RESET_ANNUAL_QUOTA' }  // Called yearly
  | { type: 'QUOTA_EXCEEDED'; daysOver: number }

  // Financial tracking
  | { type: 'RECORD_PAYMENT'; amount: number; period?: string }
  | { type: 'DISTRIBUTE_REVENUE'; amount: number }

  // Alerts and compliance
  | { type: 'RAISE_ALERT'; alert: Omit<SharedSpaceAlert, 'id' | 'createdDate'> }
  | { type: 'RESOLVE_ALERT'; alertId: string; resolutionNotes: string }
  | { type: 'INSURANCE_UPDATE_REQUIRED' }
  | { type: 'TAX_COMPLIANCE_CHECK' }

  // Model transitions
  | { type: 'TRANSITION_TO_COMMERCIAL'; commercialConfig: any }
  | { type: 'TRANSITION_TO_SOLIDAIRE'; solidaireConfig: any }
  | { type: 'TRANSITION_TO_QUOTA'; quotaConfig: any }

  // Suspension and termination
  | { type: 'SUSPEND_AGREEMENT'; reason: string }
  | { type: 'RESUME_AGREEMENT' }
  | { type: 'END_AGREEMENT'; reason: string }
  | { type: 'RENEW_AGREEMENT'; newEndDate?: Date };

// Context includes both the agreement and parent shared space
interface SharedSpaceMachineContext {
  agreement: UsageAgreement;
  sharedSpace: SharedSpace;
  usageRecords: UsageRecord[];
  alerts: SharedSpaceAlert[];
  currentYear: number;
}

export const sharedSpaceMachine = setup({
  types: {} as {
    context: SharedSpaceMachineContext;
    events: SharedSpaceEvents;
    input: {
      agreement: UsageAgreement;
      sharedSpace: SharedSpace;
    };
  },

  guards: {
    // Governance model guards
    isSolidaireModel: ({ context }) => context.sharedSpace.governanceModel === 'solidaire',
    isCommercialModel: ({ context }) => context.sharedSpace.governanceModel === 'commercial',
    isQuotaModel: ({ context }) => context.sharedSpace.governanceModel === 'quota',

    // Approval guards
    requiresVote: ({ context }) => {
      // If already approved, no vote needed
      if (context.agreement.approvalStatus === 'approved') return false;

      // Solidaire and commercial models require community vote
      // Quota model: auto-approve if within quota
      if (context.sharedSpace.governanceModel === 'quota') {
        return context.agreement.usageType === 'professional';  // Pro usage might require vote
      }
      return true;  // Solidaire and commercial always require vote
    },

    voteApproved: ({ context }) => {
      const results = context.agreement.votingResults;
      return results ? results.quorumReached && results.majorityReached : false;
    },

    // Quota guards
    quotaExceeded: ({ context }) => {
      if (context.sharedSpace.governanceModel !== 'quota') return false;
      const config = context.sharedSpace.quotaConfig;
      if (!config) return false;

      const agreement = context.agreement;
      const totalQuota = agreement.usageType === 'professional'
        ? config.professionalUsageQuota
        : config.personalUsageQuota;

      return agreement.quotaUsed > totalQuota;
    },

    hasActiveAlerts: ({ context }) => {
      return context.alerts.some(a => a.status === 'open' || a.status === 'acknowledged');
    },

    // Financial guards
    isProfessionalUse: ({ context }) => {
      return context.agreement.usageType === 'professional';
    }
  },

  actions: {
    // Proposal and approval actions
    submitForApproval: assign({
      agreement: ({ context }) => ({
        ...context.agreement,
        requiresApproval: true,
        approvalStatus: 'pending' as const,
        status: 'proposed' as const
      })
    }),

    recordVote: assign({
      agreement: ({ context, event }) => {
        if (event.type !== 'VOTE_ON_USAGE') return context.agreement;

        const votes = new Map(context.agreement.approvalVotes || new Map());
        const vote: ParticipantVote = {
          participantId: event.participantId,
          vote: event.vote,
          quotite: 1,  // Simplified for testing - in production would come from context
          timestamp: new Date()
        };
        votes.set(event.participantId, vote);

        return {
          ...context.agreement,
          approvalVotes: votes
        };
      }
    }),

    tallyVotes: assign({
      agreement: ({ context }) => {
        const votes = context.agreement.approvalVotes;
        if (!votes || votes.size === 0) return context.agreement;

        // Simple vote counting - majority wins
        let votesFor = 0;
        let votesAgainst = 0;
        let abstentions = 0;

        votes.forEach(vote => {
          if (vote.vote === 'for') votesFor++;
          else if (vote.vote === 'against') votesAgainst++;
          else abstentions++;
        });

        const totalVotes = votesFor + votesAgainst + abstentions;
        const quorumReached = totalVotes >= 2;  // At least 2 voters
        const majorityReached = votesFor > votesAgainst;  // Simple majority
        const approved = quorumReached && majorityReached;

        return {
          ...context.agreement,
          votingResults: {
            totalVoters: totalVotes,
            votesFor,
            votesAgainst,
            abstentions,
            totalQuotite: totalVotes,
            quotiteFor: votesFor,
            quotiteAgainst: votesAgainst,
            quotiteAbstained: abstentions,
            quorumReached,
            majorityReached,
            democraticMajority: majorityReached,
            quotiteMajority: majorityReached
          },
          approvalStatus: approved ? ('approved' as const) : ('rejected' as const),
          status: approved ? ('active' as const) : ('rejected' as const)
        };
      }
    }),

    approveDirectly: assign({
      agreement: ({ context }) => ({
        ...context.agreement,
        approvalStatus: 'approved' as const,
        status: 'active' as const
      })
    }),

    rejectProposal: assign({
      agreement: ({ context }) => ({
        ...context.agreement,
        approvalStatus: 'rejected' as const,
        status: 'rejected' as const
      })
    }),

    // Usage tracking actions
    recordUsage: assign({
      usageRecords: ({ context, event }) => {
        if (event.type !== 'RECORD_USAGE') return context.usageRecords;

        const durationDays = Math.ceil(
          (event.endDate.getTime() - event.startDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        // Calculate fee based on governance model and quota
        let feeCharged = 0;
        let quotaConsumed = durationDays;
        let beyondQuota = false;

        if (context.sharedSpace.governanceModel === 'quota' && context.sharedSpace.quotaConfig) {
          const config = context.sharedSpace.quotaConfig;
          const quotaRemaining = context.agreement.quotaRemaining;

          if (durationDays > quotaRemaining) {
            // Part within quota + part beyond
            const daysWithinQuota = Math.max(0, quotaRemaining);
            const daysBeyondQuota = durationDays - daysWithinQuota;

            const feePerDay = event.usageType === 'professional'
              ? config.professionalUsageFee
              : config.personalUsageFee;

            feeCharged = (daysWithinQuota * feePerDay) + (daysBeyondQuota * config.beyondQuotaFee);
            beyondQuota = daysBeyondQuota > 0;
          } else {
            const feePerDay = event.usageType === 'professional'
              ? config.professionalUsageFee
              : config.personalUsageFee;
            feeCharged = durationDays * feePerDay;
          }
        } else if (context.sharedSpace.governanceModel === 'commercial' && context.sharedSpace.commercialConfig) {
          // Commercial model: daily rate based on monthly rent
          const monthlyRent = context.sharedSpace.commercialConfig.rentalContract.monthlyRent;
          feeCharged = (monthlyRent / 30) * durationDays;
        } else if (context.sharedSpace.governanceModel === 'solidaire' && context.sharedSpace.solidaireConfig) {
          // Solidaire: could be free, cost-price, or subsidized
          const accessRules = context.sharedSpace.solidaireConfig.accessRules;
          if (accessRules.residentsAccess === 'cost_price') {
            const dailyCost = Object.values(context.sharedSpace.operatingCosts).reduce((a, b) => a + b, 0) / 30;
            feeCharged = dailyCost * durationDays;
          }
          // else free or subsidized
        }

        const newRecord: UsageRecord = {
          id: `usage-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          agreementId: context.agreement.id,
          participantId: context.agreement.participantId,
          sharedSpaceId: context.agreement.sharedSpaceId,
          startDate: event.startDate,
          endDate: event.endDate,
          durationDays,
          usageType: event.usageType,
          purpose: event.purpose,
          feeCharged,
          quotaConsumed,
          beyondQuota,
          createdDate: new Date(),
          confirmedDate: new Date()
        };

        return [...context.usageRecords, newRecord];
      },

      agreement: ({ context, event }) => {
        if (event.type !== 'RECORD_USAGE') return context.agreement;

        const durationDays = Math.ceil(
          (event.endDate.getTime() - event.startDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        return {
          ...context.agreement,
          daysUsedThisYear: context.agreement.daysUsedThisYear + durationDays,
          quotaUsed: context.agreement.quotaUsed + durationDays,
          quotaRemaining: Math.max(0, context.agreement.quotaRemaining - durationDays)
        };
      }
    }),

    // Quota management
    resetAnnualQuota: assign({
      agreement: ({ context }) => {
        if (context.sharedSpace.governanceModel !== 'quota' || !context.sharedSpace.quotaConfig) {
          return context.agreement;
        }

        const config = context.sharedSpace.quotaConfig;
        const totalQuota = context.agreement.usageType === 'professional'
          ? config.professionalUsageQuota
          : config.personalUsageQuota;

        return {
          ...context.agreement,
          daysUsedThisYear: 0,
          quotaUsed: 0,
          quotaRemaining: totalQuota
        };
      },
      currentYear: ({ context }) => context.currentYear + 1
    }),

    // Alert management
    raiseAlert: assign({
      alerts: ({ context, event }) => {
        if (event.type !== 'RAISE_ALERT') return context.alerts;

        const newAlert: SharedSpaceAlert = {
          ...event.alert,
          id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          createdDate: new Date(),
          status: 'open'
        };

        return [...context.alerts, newAlert];
      }
    }),

    resolveAlert: assign({
      alerts: ({ context, event }) => {
        if (event.type !== 'RESOLVE_ALERT') return context.alerts;

        return context.alerts.map(alert =>
          alert.id === event.alertId
            ? {
                ...alert,
                status: 'resolved' as const,
                resolvedDate: new Date(),
                resolutionNotes: event.resolutionNotes
              }
            : alert
        );
      }
    }),

    // Financial actions
    recordPayment: assign({
      agreement: ({ context, event }) => {
        if (event.type !== 'RECORD_PAYMENT') return context.agreement;

        return {
          ...context.agreement,
          totalFeesGenerated: context.agreement.totalFeesGenerated + event.amount
        };
      }
    }),

    distributeRevenue: assign({
      agreement: ({ context, event }) => {
        if (event.type !== 'DISTRIBUTE_REVENUE') return context.agreement;

        // Revenue distribution depends on governance model
        let revenueToACP = 0;

        if (context.sharedSpace.governanceModel === 'solidaire' && context.sharedSpace.solidaireConfig) {
          const config = context.sharedSpace.solidaireConfig;
          revenueToACP = event.amount * (config.revenueToCollective / 100);
        } else if (context.sharedSpace.governanceModel === 'commercial') {
          // All revenue goes to ACP in commercial model
          revenueToACP = event.amount;
        } else if (context.sharedSpace.governanceModel === 'quota') {
          // Quota model: revenue distributed based on configuration
          // For now, assume 70% to ACP, 30% to participants
          revenueToACP = event.amount * 0.7;
        }

        return {
          ...context.agreement,
          revenueToACP: context.agreement.revenueToACP + revenueToACP
        };
      }
    }),

    // Model transition actions
    transitionToCommercial: assign({
      agreement: ({ context }) => ({
        ...context.agreement,
        previousModel: context.sharedSpace.governanceModel,
        transitionDate: new Date(),
        status: 'proposed' as const  // Requires re-approval
      })
    }),

    // Suspension and termination
    suspendAgreement: assign({
      agreement: ({ context }) => ({
        ...context.agreement,
        status: 'suspended' as const
      })
    }),

    resumeAgreement: assign({
      agreement: ({ context }) => ({
        ...context.agreement,
        status: 'active' as const
      })
    }),

    endAgreement: assign({
      agreement: ({ context }) => ({
        ...context.agreement,
        status: 'ended' as const,
        endDate: new Date()
      })
    }),

    renewAgreement: assign({
      agreement: ({ context, event }) => {
        if (event.type !== 'RENEW_AGREEMENT') return context.agreement;

        const newEndDate = event.newEndDate || (() => {
          const date = new Date();
          date.setFullYear(date.getFullYear() + 1);
          return date;
        })();

        return {
          ...context.agreement,
          endDate: newEndDate,
          status: 'active' as const
        };
      }
    })
  }
}).createMachine({
  id: 'sharedSpace',
  initial: 'determining_approval_path',

  context: ({ input }) => ({
    agreement: input.agreement,
    sharedSpace: input.sharedSpace,
    usageRecords: [],
    alerts: [],
    currentYear: new Date().getFullYear()
  }),

  states: {
    /**
     * Determine if approval is needed based on governance model
     */
    determining_approval_path: {
      always: [
        {
          target: 'awaiting_vote',
          guard: 'requiresVote',
          actions: ['submitForApproval']
        },
        {
          target: 'active',
          actions: ['approveDirectly']
        }
      ]
    },

    /**
     * Awaiting community vote (solidaire, commercial, or professional quota usage)
     */
    awaiting_vote: {
      on: {
        VOTE_ON_USAGE: {
          actions: ['recordVote']
        },
        VOTING_COMPLETE: {
          actions: ['tallyVotes'],
          target: 'vote_decision'
        },
        REJECT_PROPOSAL: {
          target: 'rejected',
          actions: ['rejectProposal']
        }
      }
    },

    /**
     * Evaluate voting results
     */
    vote_decision: {
      always: [
        {
          target: 'active',
          guard: 'voteApproved'
        },
        {
          target: 'rejected'
        }
      ]
    },

    /**
     * Active usage agreement
     */
    active: {
      initial: 'tracking_usage',

      states: {
        tracking_usage: {
          on: {
            RECORD_USAGE: {
              actions: ['recordUsage']
            },
            QUOTA_EXCEEDED: {
              target: 'quota_exceeded',
              guard: 'quotaExceeded'
            },
            RESET_ANNUAL_QUOTA: {
              actions: ['resetAnnualQuota']
            }
          }
        },

        quota_exceeded: {
          entry: assign({
            alerts: ({ context }) => {
              const newAlert: SharedSpaceAlert = {
                id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                type: 'quota_exceeded',
                severity: 'warning',
                sharedSpaceId: context.agreement.sharedSpaceId,
                participantId: context.agreement.participantId,
                agreementId: context.agreement.id,
                title: 'Quota annuel dépassé',
                description: `Le participant a dépassé son quota annuel.`,
                status: 'open',
                createdDate: new Date(),
                requiresVote: false,
                requiresInsuranceUpdate: false,
                requiresTaxDeclaration: false
              };
              return [...context.alerts, newAlert];
            }
          }),

          on: {
            TRANSITION_TO_COMMERCIAL: {
              target: '#sharedSpace.awaiting_vote',
              actions: ['transitionToCommercial']
            },
            RESET_ANNUAL_QUOTA: {
              target: 'tracking_usage',
              actions: ['resetAnnualQuota']
            }
          }
        }
      },

      on: {
        RECORD_PAYMENT: {
          actions: ['recordPayment']
        },
        DISTRIBUTE_REVENUE: {
          actions: ['distributeRevenue']
        },
        RAISE_ALERT: {
          actions: ['raiseAlert']
        },
        RESOLVE_ALERT: {
          actions: ['resolveAlert']
        },
        SUSPEND_AGREEMENT: {
          target: 'suspended',
          actions: ['suspendAgreement']
        },
        END_AGREEMENT: {
          target: 'ended',
          actions: ['endAgreement']
        },
        RENEW_AGREEMENT: {
          actions: ['renewAgreement']
        },

        // Model transitions (require re-approval)
        TRANSITION_TO_COMMERCIAL: {
          target: 'awaiting_vote',
          actions: ['transitionToCommercial']
        },
        TRANSITION_TO_SOLIDAIRE: {
          target: 'awaiting_vote'
        },
        TRANSITION_TO_QUOTA: {
          target: 'awaiting_vote'
        }
      }
    },

    /**
     * Agreement suspended (conflict, compliance issue, etc.)
     */
    suspended: {
      on: {
        RESUME_AGREEMENT: {
          target: 'active',
          actions: ['resumeAgreement']
        },
        END_AGREEMENT: {
          target: 'ended',
          actions: ['endAgreement']
        },
        RESOLVE_ALERT: {
          actions: ['resolveAlert']
        }
      }
    },

    /**
     * Proposal rejected
     */
    rejected: {
      type: 'final'
    },

    /**
     * Agreement ended
     */
    ended: {
      type: 'final'
    }
  }
});
