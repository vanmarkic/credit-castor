import { describe, it, expect, beforeEach } from 'vitest';
import { createActor } from 'xstate';
import { sharedSpaceMachine } from './sharedSpaceMachine';
import type {
  SharedSpace,
  UsageAgreement,
  SolidaireConfig,
  CommercialConfig,
  QuotaConfig
} from './types';

describe('Shared Space State Machine', () => {
  describe('Governance Model: SOLIDAIRE (Collective)', () => {
    let solidaireSpace: SharedSpace;
    let agreement: UsageAgreement;

    beforeEach(() => {
      const solidaireConfig: SolidaireConfig = {
        operatorParticipantId: 'p1',
        operatorCompensation: {
          type: 'paid',
          monthlyAmount: 500
        },
        revenueToCollective: 100,  // 100% to collective
        accessRules: {
          residentsAccess: 'cost_price',
          externalsAllowed: true,
          externalsPricing: 'cost_price_plus_margin'
        },
        votingRules: {
          method: 'hybrid',
          quorumPercentage: 50,
          majorityPercentage: 50,
          hybridWeights: {
            democraticWeight: 0.5,
            quotiteWeight: 0.5
          }
        }
      };

      solidaireSpace = {
        id: 'space-1',
        name: 'Atelier Bois Communautaire',
        type: 'atelier_bois',
        description: 'Atelier de menuiserie collectif géré par la communauté',
        governanceModel: 'solidaire',
        surface: 50,
        capacity: 8,
        equipment: ['Scie circulaire', 'Rabot', 'Établis'],
        operatingCosts: {
          electricity: 150,
          heating: 200,
          maintenance: 100,
          insurance: 80,
          other: 70
        },
        solidaireConfig,
        status: 'active',
        createdDate: new Date('2024-01-01'),
        approvalDate: new Date('2024-01-15')
      };

      agreement = {
        id: 'agreement-1',
        sharedSpaceId: 'space-1',
        participantId: 'p2',
        usageType: 'collective',
        startDate: new Date('2024-02-01'),
        daysUsedThisYear: 0,
        quotaUsed: 0,
        quotaRemaining: 0,
        totalFeesGenerated: 0,
        revenueToACP: 0,
        requiresApproval: true,
        approvalStatus: 'pending',
        status: 'proposed'
      };
    });

    it('should require community vote for solidaire model', () => {
      const actor = createActor(sharedSpaceMachine, {
        input: {
          agreement,
          sharedSpace: solidaireSpace
        }
      });

      actor.start();

      // Should start in awaiting_vote state
      expect(actor.getSnapshot().matches('awaiting_vote')).toBe(true);
    });

    it('should approve agreement when vote passes', () => {
      const actor = createActor(sharedSpaceMachine, {
        input: {
          agreement,
          sharedSpace: solidaireSpace
        }
      });

      actor.start();

      // Record votes
      actor.send({
        type: 'VOTE_ON_USAGE',
        participantId: 'p1',
        vote: 'for'
      });

      actor.send({
        type: 'VOTE_ON_USAGE',
        participantId: 'p3',
        vote: 'for'
      });

      actor.send({
        type: 'VOTE_ON_USAGE',
        participantId: 'p4',
        vote: 'for'
      });

      // Complete voting
      actor.send({ type: 'VOTING_COMPLETE' });

      // Should transition to active (via vote_decision)
      const snapshot = actor.getSnapshot();
      expect(
        snapshot.matches('active') || snapshot.matches('vote_decision')
      ).toBe(true);
    });

    it('should collect revenue for collective in solidaire model', () => {
      // Pre-approved agreement
      const approvedAgreement: UsageAgreement = {
        ...agreement,
        status: 'active',
        approvalStatus: 'approved',
        requiresApproval: false
      };

      const actor = createActor(sharedSpaceMachine, {
        input: {
          agreement: approvedAgreement,
          sharedSpace: solidaireSpace
        }
      });

      actor.start();

      // Record payment
      actor.send({
        type: 'RECORD_PAYMENT',
        amount: 600
      });

      // Distribute revenue (100% to collective)
      actor.send({
        type: 'DISTRIBUTE_REVENUE',
        amount: 600
      });

      const context = actor.getSnapshot().context;

      // All revenue should go to ACP (100%)
      expect(context.agreement.revenueToACP).toBe(600);
    });
  });

  describe('Governance Model: COMMERCIAL (Rental)', () => {
    let commercialSpace: SharedSpace;
    let agreement: UsageAgreement;

    beforeEach(() => {
      const commercialConfig: CommercialConfig = {
        tenantParticipantId: 'p1',
        rentalContract: {
          monthlyRent: 800,
          charges: 200,
          deposit: 2400,
          startDate: new Date('2024-01-01'),
          renewalTerms: '1 year auto-renewal'
        },
        costBreakdown: {
          baseCost: 500,
          operatingCosts: 200,
          insurance: 50,
          margin: 50,
          totalMonthly: 800
        },
        taxImplications: {
          tenantMustDeclareRevenue: true,
          tenantMustPayTVA: true,
          separateInsuranceRequired: true
        }
      };

      commercialSpace = {
        id: 'space-2',
        name: 'Atelier Menuiserie Pro',
        type: 'atelier_bois',
        description: 'Atelier professionnel loué au menuisier habitant',
        governanceModel: 'commercial',
        surface: 60,
        capacity: 4,
        equipment: ['Machines professionnelles'],
        operatingCosts: {
          electricity: 200,
          heating: 250,
          maintenance: 150,
          insurance: 100,
          other: 100
        },
        commercialConfig,
        status: 'active',
        createdDate: new Date('2024-01-01'),
        approvalDate: new Date('2024-01-15')
      };

      agreement = {
        id: 'agreement-2',
        sharedSpaceId: 'space-2',
        participantId: 'p1',
        usageType: 'professional',
        startDate: new Date('2024-02-01'),
        endDate: new Date('2025-02-01'),
        daysUsedThisYear: 0,
        quotaUsed: 0,
        quotaRemaining: 0,
        totalFeesGenerated: 0,
        revenueToACP: 0,
        requiresApproval: true,
        approvalStatus: 'pending',
        status: 'proposed'
      };
    });

    it('should require vote for commercial model', () => {
      const actor = createActor(sharedSpaceMachine, {
        input: {
          agreement,
          sharedSpace: commercialSpace
        }
      });

      actor.start();

      // Commercial model requires vote
      expect(actor.getSnapshot().matches('awaiting_vote')).toBe(true);
    });

    it('should charge full commercial rate', () => {
      const approvedAgreement: UsageAgreement = {
        ...agreement,
        status: 'active',
        approvalStatus: 'approved',
        requiresApproval: false
      };

      const actor = createActor(sharedSpaceMachine, {
        input: {
          agreement: approvedAgreement,
          sharedSpace: commercialSpace
        }
      });

      actor.start();

      // Record usage: 20 days
      actor.send({
        type: 'RECORD_USAGE',
        startDate: new Date('2024-02-01'),
        endDate: new Date('2024-02-21'),
        usageType: 'professional',
        purpose: 'Client projects'
      });

      const context = actor.getSnapshot().context;

      // Should have usage record
      expect(context.usageRecords.length).toBe(1);
      expect(context.usageRecords[0].durationDays).toBe(20);

      // Fee should be based on daily rate from monthly rent
      // 800€/month ÷ 30 days = ~26.67€/day × 20 days = ~533€
      expect(context.usageRecords[0].feeCharged).toBeGreaterThan(500);
      expect(context.usageRecords[0].feeCharged).toBeLessThan(550);
    });

    it('should send all revenue to ACP in commercial model', () => {
      const approvedAgreement: UsageAgreement = {
        ...agreement,
        status: 'active',
        approvalStatus: 'approved',
        requiresApproval: false
      };

      const actor = createActor(sharedSpaceMachine, {
        input: {
          agreement: approvedAgreement,
          sharedSpace: commercialSpace
        }
      });

      actor.start();

      // Record monthly payment
      actor.send({
        type: 'RECORD_PAYMENT',
        amount: 800
      });

      // Distribute revenue (100% to ACP in commercial model)
      actor.send({
        type: 'DISTRIBUTE_REVENUE',
        amount: 800
      });

      const context = actor.getSnapshot().context;

      // All revenue goes to ACP
      expect(context.agreement.revenueToACP).toBe(800);
    });

    it('should raise alert for insurance requirement', () => {
      const approvedAgreement: UsageAgreement = {
        ...agreement,
        status: 'active',
        approvalStatus: 'approved',
        requiresApproval: false
      };

      const actor = createActor(sharedSpaceMachine, {
        input: {
          agreement: approvedAgreement,
          sharedSpace: commercialSpace
        }
      });

      actor.start();

      // Raise insurance alert
      actor.send({
        type: 'RAISE_ALERT',
        alert: {
          type: 'insurance_issue',
          severity: 'critical',
          sharedSpaceId: 'space-2',
          participantId: 'p1',
          agreementId: 'agreement-2',
          title: 'Assurance professionnelle requise',
          description: 'Le locataire doit souscrire une assurance RC professionnelle',
          status: 'open',
          requiresVote: false,
          requiresInsuranceUpdate: true,
          requiresTaxDeclaration: false
        }
      });

      const context = actor.getSnapshot().context;

      expect(context.alerts.length).toBe(1);
      expect(context.alerts[0].type).toBe('insurance_issue');
      expect(context.alerts[0].requiresInsuranceUpdate).toBe(true);
    });
  });

  describe('Governance Model: QUOTA (Fair Usage)', () => {
    let quotaSpace: SharedSpace;
    let personalAgreement: UsageAgreement;
    let professionalAgreement: UsageAgreement;

    beforeEach(() => {
      const quotaConfig: QuotaConfig = {
        personalUsageQuota: 40,
        professionalUsageQuota: 30,
        personalUsageFee: 10,  // 10€/day
        professionalUsageFee: 20,  // 20€/day
        beyondQuotaFee: 50,  // 50€/day beyond quota
        maxConsecutiveDays: 7,
        advanceBookingDays: 30,
        cancellationPolicy: '48h notice',
        priorityRules: {
          collectiveActivitiesPriority: true,
          firstComeFirstServed: true,
          rotationSystem: false
        }
      };

      quotaSpace = {
        id: 'space-3',
        name: 'Atelier Partagé',
        type: 'atelier_general',
        description: 'Atelier avec système de quotas équitables',
        governanceModel: 'quota',
        surface: 45,
        capacity: 6,
        equipment: ['Outils divers'],
        operatingCosts: {
          electricity: 120,
          heating: 180,
          maintenance: 90,
          insurance: 70,
          other: 60
        },
        quotaConfig,
        status: 'active',
        createdDate: new Date('2024-01-01'),
        approvalDate: new Date('2024-01-15')
      };

      personalAgreement = {
        id: 'agreement-3a',
        sharedSpaceId: 'space-3',
        participantId: 'p2',
        usageType: 'personal',
        startDate: new Date('2024-01-01'),
        daysUsedThisYear: 0,
        quotaUsed: 0,
        quotaRemaining: 40,  // Personal quota
        totalFeesGenerated: 0,
        revenueToACP: 0,
        requiresApproval: false,
        approvalStatus: 'pending',
        status: 'proposed'
      };

      professionalAgreement = {
        id: 'agreement-3b',
        sharedSpaceId: 'space-3',
        participantId: 'p3',
        usageType: 'professional',
        startDate: new Date('2024-01-01'),
        daysUsedThisYear: 0,
        quotaUsed: 0,
        quotaRemaining: 30,  // Professional quota
        totalFeesGenerated: 0,
        revenueToACP: 0,
        requiresApproval: true,  // Professional might require vote
        approvalStatus: 'pending',
        status: 'proposed'
      };
    });

    it('should auto-approve personal usage under quota', () => {
      const actor = createActor(sharedSpaceMachine, {
        input: {
          agreement: personalAgreement,
          sharedSpace: quotaSpace
        }
      });

      actor.start();

      // Should auto-approve (no vote required for quota model personal use)
      expect(actor.getSnapshot().matches('active')).toBe(true);
    });

    it('should track quota usage correctly', () => {
      const approvedAgreement: UsageAgreement = {
        ...personalAgreement,
        status: 'active',
        approvalStatus: 'approved',
        requiresApproval: false
      };

      const actor = createActor(sharedSpaceMachine, {
        input: {
          agreement: approvedAgreement,
          sharedSpace: quotaSpace
        }
      });

      actor.start();

      // Record 15 days usage
      actor.send({
        type: 'RECORD_USAGE',
        startDate: new Date('2024-02-01'),
        endDate: new Date('2024-02-16'),
        usageType: 'personal',
        purpose: 'DIY projects'
      });

      const context = actor.getSnapshot().context;

      // Should have consumed 15 days of quota
      expect(context.agreement.quotaUsed).toBe(15);
      expect(context.agreement.quotaRemaining).toBe(25);  // 40 - 15
      expect(context.agreement.daysUsedThisYear).toBe(15);
    });

    it('should charge beyond-quota rate when quota exceeded', () => {
      // Agreement with quota almost exhausted
      const nearLimitAgreement: UsageAgreement = {
        ...personalAgreement,
        status: 'active',
        approvalStatus: 'approved',
        requiresApproval: false,
        quotaUsed: 38,
        quotaRemaining: 2,  // Only 2 days left
        daysUsedThisYear: 38
      };

      const actor = createActor(sharedSpaceMachine, {
        input: {
          agreement: nearLimitAgreement,
          sharedSpace: quotaSpace
        }
      });

      actor.start();

      // Try to use 10 days (2 within quota + 8 beyond)
      actor.send({
        type: 'RECORD_USAGE',
        startDate: new Date('2024-12-01'),
        endDate: new Date('2024-12-11'),
        usageType: 'personal',
        purpose: 'Year-end projects'
      });

      const context = actor.getSnapshot().context;

      // Should have usage record
      expect(context.usageRecords.length).toBe(1);

      // Fee should be: 2 days @ 10€ + 8 days @ 50€ = 20€ + 400€ = 420€
      expect(context.usageRecords[0].feeCharged).toBe(420);
      expect(context.usageRecords[0].beyondQuota).toBe(true);
    });

    it('should raise alert when quota exceeded', () => {
      const exceededAgreement: UsageAgreement = {
        ...personalAgreement,
        status: 'active',
        approvalStatus: 'approved',
        requiresApproval: false,
        quotaUsed: 45,  // Exceeded
        quotaRemaining: 0,
        daysUsedThisYear: 45
      };

      const actor = createActor(sharedSpaceMachine, {
        input: {
          agreement: exceededAgreement,
          sharedSpace: quotaSpace
        }
      });

      actor.start();

      // Send quota exceeded event
      actor.send({ type: 'QUOTA_EXCEEDED', daysOver: 5 });

      const snapshot = actor.getSnapshot();

      // Should be in quota_exceeded state
      expect(snapshot.matches({ active: 'quota_exceeded' })).toBe(true);

      // Should have alert
      expect(snapshot.context.alerts.length).toBeGreaterThan(0);
      expect(snapshot.context.alerts[0].type).toBe('quota_exceeded');
    });

    it('should allow transition to commercial model when quota exceeded', () => {
      const exceededAgreement: UsageAgreement = {
        ...professionalAgreement,
        status: 'active',
        approvalStatus: 'approved',
        requiresApproval: false,
        quotaUsed: 35,  // Exceeded professional quota (30)
        quotaRemaining: 0,
        daysUsedThisYear: 35
      };

      const actor = createActor(sharedSpaceMachine, {
        input: {
          agreement: exceededAgreement,
          sharedSpace: quotaSpace
        }
      });

      actor.start();

      // Trigger quota exceeded
      actor.send({ type: 'QUOTA_EXCEEDED', daysOver: 5 });

      // Should be in quota_exceeded state
      expect(actor.getSnapshot().matches({ active: 'quota_exceeded' })).toBe(true);

      // Propose transition to commercial model
      actor.send({
        type: 'TRANSITION_TO_COMMERCIAL',
        commercialConfig: {
          /* commercial config */
        }
      });

      // Should return to awaiting_vote for approval
      expect(actor.getSnapshot().matches('awaiting_vote')).toBe(true);
    });

    it('should reset quota annually', () => {
      const endOfYearAgreement: UsageAgreement = {
        ...personalAgreement,
        status: 'active',
        approvalStatus: 'approved',
        requiresApproval: false,
        quotaUsed: 35,
        quotaRemaining: 5,
        daysUsedThisYear: 35
      };

      const actor = createActor(sharedSpaceMachine, {
        input: {
          agreement: endOfYearAgreement,
          sharedSpace: quotaSpace
        }
      });

      actor.start();

      // Reset annual quota (simulating New Year)
      actor.send({ type: 'RESET_ANNUAL_QUOTA' });

      const context = actor.getSnapshot().context;

      // Quota should be reset
      expect(context.agreement.quotaUsed).toBe(0);
      expect(context.agreement.quotaRemaining).toBe(40);  // Full quota restored
      expect(context.agreement.daysUsedThisYear).toBe(0);
      expect(context.currentYear).toBeGreaterThan(new Date().getFullYear() - 1);
    });

    it('should distribute revenue 70% to ACP, 30% to participants', () => {
      const approvedAgreement: UsageAgreement = {
        ...personalAgreement,
        status: 'active',
        approvalStatus: 'approved',
        requiresApproval: false
      };

      const actor = createActor(sharedSpaceMachine, {
        input: {
          agreement: approvedAgreement,
          sharedSpace: quotaSpace
        }
      });

      actor.start();

      // Distribute revenue from fees
      actor.send({
        type: 'DISTRIBUTE_REVENUE',
        amount: 1000
      });

      const context = actor.getSnapshot().context;

      // 70% to ACP = 700€
      expect(context.agreement.revenueToACP).toBe(700);
    });
  });

  describe('Agreement Lifecycle Management', () => {
    it('should allow agreement suspension', () => {
      const activeAgreement: UsageAgreement = {
        id: 'agreement-suspend',
        sharedSpaceId: 'space-1',
        participantId: 'p1',
        usageType: 'professional',
        startDate: new Date('2024-01-01'),
        daysUsedThisYear: 10,
        quotaUsed: 10,
        quotaRemaining: 20,
        totalFeesGenerated: 200,
        revenueToACP: 200,
        requiresApproval: false,
        approvalStatus: 'approved',
        status: 'active'
      };

      const space: SharedSpace = {
        id: 'space-1',
        name: 'Test Space',
        type: 'atelier_general',
        description: 'Test',
        governanceModel: 'quota',
        surface: 50,
        operatingCosts: {
          electricity: 100,
          heating: 150,
          maintenance: 80,
          insurance: 60,
          other: 50
        },
        quotaConfig: {
          personalUsageQuota: 40,
          professionalUsageQuota: 30,
          personalUsageFee: 10,
          professionalUsageFee: 20,
          beyondQuotaFee: 50,
          maxConsecutiveDays: 7,
          advanceBookingDays: 30,
          cancellationPolicy: '48h',
          priorityRules: {
            collectiveActivitiesPriority: true,
            firstComeFirstServed: true,
            rotationSystem: false
          }
        },
        status: 'active',
        createdDate: new Date('2024-01-01')
      };

      const actor = createActor(sharedSpaceMachine, {
        input: {
          agreement: activeAgreement,
          sharedSpace: space
        }
      });

      actor.start();

      // Suspend agreement
      actor.send({
        type: 'SUSPEND_AGREEMENT',
        reason: 'Conflict with other residents'
      });

      expect(actor.getSnapshot().matches('suspended')).toBe(true);
      expect(actor.getSnapshot().context.agreement.status).toBe('suspended');
    });

    it('should allow agreement renewal', () => {
      const activeAgreement: UsageAgreement = {
        id: 'agreement-renew',
        sharedSpaceId: 'space-1',
        participantId: 'p1',
        usageType: 'professional',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
        daysUsedThisYear: 25,
        quotaUsed: 25,
        quotaRemaining: 5,
        totalFeesGenerated: 500,
        revenueToACP: 500,
        requiresApproval: false,
        approvalStatus: 'approved',
        status: 'active'
      };

      const space: SharedSpace = {
        id: 'space-1',
        name: 'Test Space',
        type: 'atelier_general',
        description: 'Test',
        governanceModel: 'quota',
        surface: 50,
        operatingCosts: {
          electricity: 100,
          heating: 150,
          maintenance: 80,
          insurance: 60,
          other: 50
        },
        quotaConfig: {
          personalUsageQuota: 40,
          professionalUsageQuota: 30,
          personalUsageFee: 10,
          professionalUsageFee: 20,
          beyondQuotaFee: 50,
          maxConsecutiveDays: 7,
          advanceBookingDays: 30,
          cancellationPolicy: '48h',
          priorityRules: {
            collectiveActivitiesPriority: true,
            firstComeFirstServed: true,
            rotationSystem: false
          }
        },
        status: 'active',
        createdDate: new Date('2024-01-01')
      };

      const actor = createActor(sharedSpaceMachine, {
        input: {
          agreement: activeAgreement,
          sharedSpace: space
        }
      });

      actor.start();

      // Renew agreement for another year
      const newEndDate = new Date('2025-12-31');
      actor.send({
        type: 'RENEW_AGREEMENT',
        newEndDate
      });

      const context = actor.getSnapshot().context;

      expect(context.agreement.endDate).toEqual(newEndDate);
      expect(context.agreement.status).toBe('active');
    });
  });
});
