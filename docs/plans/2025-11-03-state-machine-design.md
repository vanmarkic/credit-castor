# Credit Castor State Machine Design

**Created**: 2025-11-03
**Status**: Design Complete - Ready for Implementation
**Architecture**: Pattern A (Flat context with query abstraction, migration-ready for Actor model)
**Framework**: Framework-agnostic (optimized for XState v5)

---

## Executive Summary

This document specifies a comprehensive state machine to model the Credit Castor project lifecycle, encompassing:

- **11 legal phases** from initial purchase through copropriété establishment to lot sales
- **3 transaction types** with distinct pricing models (portage, copropriété, classic resale)
- **2 financing flows** (individual mortgages + ACP collective loans)
- **Hybrid governance** system (democratic + quotité-weighted voting)
- **Belgian legal compliance** (PRECAD, registration fees, permit timelines, quotité)

The design follows XState best practices while remaining framework-agnostic, uses Pattern A (flat context with query functions) for simplicity with a clear migration path to Actor model (Pattern B) when needed.

---

## Context & Motivation

### Business Requirements (from [business-logic-validated.md](../analysis/business-logic-validated.md))

Credit Castor is a Belgian cohousing project in Wallonia that requires:

1. **Fairness pricing for GEN1**: Founders who take initial risk should recover costs + compensation when selling to newcomers (portage mechanism)
2. **Dynamic copropriété pricing**: Hidden lots priced based on actual costs incurred, not fixed estimates
3. **Governance for resales**: Classic resales require buyer interviews and price caps (future CLT transition)
4. **Legal compliance**: 3-year deadlines, Belgian registration fees (3%/12.5%), quotité-based distributions
5. **Collective financing**: ACP can take loans with capital pooled from co-owners

### Why a State Machine?

Current calculator handles financial calculations but lacks:

- **Lifecycle management**: What can happen when (e.g., can't sell before acte transcribed)
- **Validation rules**: Prevent invalid state transitions (e.g., permit must be enacted within 3 years)
- **Process orchestration**: Multi-step flows (financing, voting, sales approval)
- **Audit trail**: Track state history for legal/financial transparency

A state machine provides:

✅ **Declarative validation**: Business rules encoded as guards, not scattered conditionals
✅ **Visual documentation**: States and transitions are self-documenting
✅ **Type safety**: Impossible states become unrepresentable
✅ **Testability**: State transitions are pure, deterministic functions

---

## Architecture Overview

### Pattern A: Flat Context + Query Functions

**Why Pattern A?**

- Simple mental model (one machine, flat data)
- Fast initial implementation
- Easy to test (no actor coordination complexity)
- Clear migration path to Pattern B when needed

**Structure:**

```
┌─────────────────────────────────────────┐
│   State Machine (Project Lifecycle)    │
│                                         │
│  Context: {                             │
│    participants: [],                    │
│    lots: [],                            │
│    salesHistory: [],                    │
│    financingApplications: Map,          │
│    acpLoans: Map                        │
│  }                                      │
└─────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│      Query Functions Layer              │
│                                         │
│  - getAvailableLots()                   │
│  - getPortageLots()                     │
│  - calculatePortagePrice()              │
│  - calculateVotingResults()             │
└─────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│   Pure Calculation Functions            │
│                                         │
│  - calculateIndexation()                │
│  - calculateCarryingCosts()             │
│  - calculateQuotite()                   │
└─────────────────────────────────────────┘
```

**Migration to Pattern B:**

When complexity grows (many lots, complex sales workflows), migrate to Actor model:
- Spawn `LotMachine` for each lot
- Spawn `LoanMachine` for each financing application
- Spawn `ACPLoanMachine` for each collective loan
- Parent machine coordinates via events

Query functions remain the same, only implementation changes.

---

## Phase A: Project Lifecycle States

### State Diagram

```
PRE_PURCHASE
    │
    │ COMPROMIS_SIGNED
    ▼
COMPROMIS_PERIOD (parallel)
    ├─ financing_coordination
    │    ├─ awaiting_applications
    │    ├─ applications_in_progress
    │    ├─ all_approved ✓
    │    ├─ some_rejected
    │    └─ deadline_expired
    │
    └─ participant_loans (spawned actors)
         └─ IndividualLoanMachine × N
    │
    │ ALL_CONDITIONS_MET
    ▼
READY_FOR_DEED
    │
    │ DEED_SIGNED
    ▼
DEED_REGISTRATION_PENDING (max 15 days)
    │
    │ DEED_REGISTERED
    ▼
OWNERSHIP_TRANSFERRED
    │
    │ START_COPRO_CREATION
    ▼
COPRO_CREATION (hierarchical)
    ├─ technical_preparation
    ├─ precad_process
    ├─ precad_pending
    ├─ acte_drafting
    ├─ acte_signature
    └─ acte_transcription
    │
    │ ACTE_TRANSCRIBED
    ▼
COPRO_ESTABLISHED (ACP has legal personality)
    │
    │ REQUEST_PERMIT
    ▼
PERMIT_PROCESS
    ├─ permit_pending
    ├─ permit_granted
    └─ permit_rejected
    │
    │ PERMIT_ENACTED (within 3 years of deed)
    ▼
PERMIT_ACTIVE
    │
    │ DECLARE_HIDDEN_LOTS (within 3 years of permit)
    ▼
LOTS_DECLARED
    │
    │ FIRST_SALE
    ▼
SALES_ACTIVE (parallel)
    ├─ portage_sales
    ├─ copro_sales
    └─ classic_resales (with governance)
    │
    │ ALL_LOTS_SOLD
    ▼
COMPLETED
```

### Key Legal Milestones (Belgian Law)

| Milestone | Deadline | Legal Requirement | Source |
|-----------|----------|-------------------|--------|
| Deed after compromis | 4 months | Standard Belgian practice | Web research |
| Notary registration | 15 days | Mandatory registration window | DLA Piper |
| PRECAD | Before acte | Mandatory since 2013 | Belgian law |
| Permit enactment | 3 years from deed | User requirement | business-logic-validated.md |
| Lot declaration | 3 years from permit | User requirement | business-logic-validated.md |

### Guards (Time-based)

```typescript
guards: {
  withinTimeLimit: ({ context }, params: {
    dateField: keyof ProjectContext;
    yearsLimit: number
  }) => {
    const date = context[params.dateField] as Date | null;
    if (!date) return false;
    const yearsSince = (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24 * 365);
    return yearsSince <= params.yearsLimit;
  },

  // Usage:
  // { guard: { type: 'withinTimeLimit', params: { dateField: 'deedDate', yearsLimit: 3 } } }
}
```

---

## Phase B: Transaction Types

### 1. Portage Sales (GEN1 → GEN2, Cost Recovery)

**Who**: Founders or copropriété selling lots held for portage
**When**: After acte de base transcribed
**Pricing**: Full cost recovery + indexation + carrying costs

```typescript
interface PortagePricing {
  baseAcquisitionCost: number;        // Original purchase + construction + fees
  indexation: number;                 // Belgian legal index (not fixed 2%)
  carryingCosts: CarryingCosts;       // Monthly holding costs × months held
  renovations: number;                // Renovation investments
  registrationFeesRecovery: number;   // 3% or 12.5% paid at purchase
  fraisCommunsRecovery: number;       // Share of common expenses
  loanInterestRecovery: number;       // Interest paid on loans
  totalPrice: number;                 // Sum of all above
}

interface CarryingCosts {
  monthlyLoanInterest: number;
  propertyTax: number;                // 388.38€/year ÷ 12
  buildingInsurance: number;          // 2000€/year × quotité ÷ 12
  syndicFees: number;                 // Copropriété management
  chargesCommunes: number;            // Utilities, maintenance
  totalMonths: number;
  total: number;
}
```

**State Flow:**

```
SALE_INITIATED (portage lot)
    │
    │ guard: canSellPortageLot = and(['isPortageSale', 'acteTranscribed'])
    ▼
PORTAGE_SALE
    │
    │ invoke: calculatePortagePrice
    ▼
SALE_COMPLETED
    │
    │ actions: [recordPortageSale, notifyParticipants]
    ▼
IDLE
```

### 2. Copropriété Sales (Hidden Lots → GEN2, Dynamic Pricing)

**Who**: Copropriété (ACP) selling hidden lots
**When**: After permit enacted and lots declared
**Pricing**: Dynamic (based on costs incurred) + GEN1 compensation for risk

```typescript
interface CoproPricing {
  baseCostPerSqm: number;             // Actual costs ÷ total surface
  gen1CompensationPerSqm: number;     // Fairness premium (5-15%, decreases over time)
  pricePerSqm: number;                // baseCost + gen1Compensation
  surface: number;                    // Buyer chooses (flexible until permit sets limits)
  totalPrice: number;                 // pricePerSqm × surface
}

function calculateGen1Compensation(context, saleDate): number {
  const yearsFromStart = (saleDate - context.deedDate) / (365 * 24 * 60 * 60 * 1000);

  // Compensation decreases over time (early risk > later stability)
  const compensationPercentage = Math.max(0.05, 0.15 - (yearsFromStart * 0.02));

  return baseCost * compensationPercentage;
}
```

**State Flow:**

```
SALE_INITIATED (copro lot)
    │
    │ guard: canSellCoproLot = and(['isCoproSale', 'permitEnacted'])
    ▼
COPRO_SALE
    │
    │ invoke: calculateCoproPrice
    ▼
SALE_COMPLETED
    │
    │ actions: [recordCoproSale, redistributeProceeds]
    ▼
IDLE
```

**Sale Proceeds Redistribution:**

Proceeds go to all current co-owners (not including buyer) based on quotité. Co-owners can:
- Reduce outstanding loans
- Withdraw as cash
- Leave in ACP account for future expenses

### 3. Classic Resales (Anyone → Anyone, Market Price with Governance)

**Who**: Any participant selling their own lot
**When**: Anytime after ownership (someone leaving project)
**Pricing**: Market price, subject to price cap and buyer approval

```typescript
interface ClassicSale extends BaseSale {
  type: 'classic';
  seller: string;
  price: number;
  buyerApproval: BuyerApproval;
  priceCap: number;                   // Original cost + indexation (no profit beyond index)
}

interface BuyerApproval {
  candidateId: string;
  interviewDate: Date;
  approved: boolean;                  // Cohousing fit, values alignment
  notes: string;
}
```

**State Flow:**

```
CLASSIC_RESALE_PROPOSED
    │
    ▼
BUYER_INTERVIEW
    │
    ├─ BUYER_APPROVED ──────▶ PRICE_VALIDATION
    │                              │
    │                              ├─ priceWithinCap ──▶ SALE_READY
    │                              │
    │                              └─ priceAboveCap ───▶ PRICE_NEGOTIATION
    │                                                        │
    │                                                        ├─ PRICE_ADJUSTED ─┐
    │                                                        │                  │
    │                                                        └──────────────────┘
    │
    └─ BUYER_REJECTED ──────▶ IDLE
```

**Governance Rules (Future CLT Transition):**

- Buyer interview required (cohousing values, community fit)
- Price cap enforced (prevent speculation)
- ~5 years: Transition to Community Land Trust model
- CLT may impose additional restrictions (affordability, resale formulas)

---

## Phase C: Financing Flows

### 1. Individual Loans (Belgian Mortgage Process)

**Timeline**: 2-8 weeks (residents), 4-8 weeks (non-residents)
**Stages**: 5 (preliminary → file → submit → monitoring → conclusion)

```typescript
type LoanStatus = 'not_applied' | 'pending' | 'approved' | 'rejected';

interface LoanApplication {
  participantId: string;
  status: LoanStatus;
  loanAmount: number;
  interestRate: number;
  durationYears: number;
  applicationDate: Date;
  approvalDate?: Date;
  bankName?: string;
}
```

**State Machine (Spawned Actor per Participant):**

```
PRELIMINARY_APPLICATION (1-2 weeks)
    │
    │ invoke: submitPreliminaryApplication
    ▼
PREPARING_FILE
    │
    │ SUBMIT_DOCUMENTS
    ▼
FILE_SUBMITTED
    │
    │ invoke: submitToBank
    ▼
VALUATION_SCHEDULING
    │
    │ VALUATION_SCHEDULED
    ▼
AWAITING_VALUATION (1-2 weeks)
    │
    │ VALUATION_COMPLETED
    ▼
BANK_DECISION
    │
    ├─ BANK_APPROVES ──▶ APPROVED (final)
    │
    └─ BANK_REJECTS ───▶ REJECTED (final)
```

**Integration with Main Machine:**

```typescript
// Compromis period is PARALLEL
compromis_period: {
  type: 'parallel',

  states: {
    financing_coordination: {
      // Tracks overall progress
      // Guard: allFoundersFinanced
    },

    participant_loans: {
      // Spawns IndividualLoanMachine for each application
      // Each actor notifies parent on status change
    }
  }
}
```

### 2. ACP Collective Loans (Copropriété Renovations)

**Who**: ACP (legal entity) with capital from co-owners
**When**: After acte transcribed (ACP has legal personality)
**Purpose**: Common property renovations (roof, staircases, facade)

```typescript
interface ACPLoan {
  id: string;
  purpose: 'roof' | 'staircases' | 'facade' | 'common_areas' | 'other';
  description: string;
  totalAmount: number;

  // Capital pooling from co-owners
  capitalRequired: number;            // Down payment (e.g., 30%)
  capitalGathered: number;
  contributions: Map<string, ACPContribution>;

  // Loan details
  loanAmount: number;                 // totalAmount - capitalGathered
  interestRate: number;               // Typically better rates for ACP
  durationYears: number;

  // Voting process
  votingRules: VotingRules;
  votes: Map<string, ParticipantVote>;
  votingResults?: VotingResults;
  approvedByCoowners: boolean;

  status: 'proposed' | 'voting' | 'capital_gathering' | 'loan_application' | 'approved' | 'disbursed' | 'rejected';
}

interface ACPContribution {
  participantId: string;
  amountPledged: number;
  amountPaid: number;
  quotiteShare: number;               // Their fair share based on ownership
  paymentDate: Date | null;
}
```

**State Machine (Spawned Actor per ACP Loan):**

```
PROPOSED
    │
    │ SCHEDULE_VOTE
    ▼
VOTING
    │
    │ VOTE_ON_LOAN (multiple participants)
    │ VOTING_COMPLETE
    ▼
VOTE_COUNTING
    │
    ├─ quorumReached && majorityApproved ──▶ CAPITAL_GATHERING
    │                                             │
    │                                             │ PLEDGE_CAPITAL
    │                                             │ PAY_CAPITAL
    │                                             │
    │                                             │ guard: capitalTargetReached &&
    │                                             │        allContributionsPaid
    │                                             ▼
    │                                        LOAN_APPLICATION
    │                                             │
    │                                             │ invoke: applyForACPBankLoan
    │                                             │
    │                                             ├─ onDone ──▶ APPROVED
    │                                             │                 │
    │                                             │                 │ DISBURSE_ACP_LOAN
    │                                             │                 ▼
    │                                             │             DISBURSED (final)
    │                                             │
    │                                             └─ onError ─▶ REJECTED (final)
    │
    └─ not(majorityApproved) ───────────────────▶ REJECTED (final)
```

---

## Hybrid Voting System

### Voting Methods

```typescript
type VotingMethod = 'one_person_one_vote' | 'quotite_weighted' | 'hybrid';

interface VotingRules {
  method: VotingMethod;
  quorumPercentage: number;           // e.g., 50% must participate
  majorityPercentage: number;         // e.g., 50% must vote 'for'

  // Hybrid configuration
  hybridWeights?: {
    democraticWeight: number;         // e.g., 0.5 = 50% weight to one-person-one-vote
    quotiteWeight: number;            // e.g., 0.5 = 50% weight to ownership shares
  };
}
```

### Calculation Examples

**Scenario**: 5 co-owners voting on roof renovation (€50,000)

| Co-owner | Quotité | Vote |
|----------|---------|------|
| Alice    | 20%     | FOR  |
| Bob      | 30%     | FOR  |
| Carol    | 25%     | AGAINST |
| Dave     | 15%     | FOR  |
| Eve      | 10%     | ABSTAIN |

**Democratic (one person one vote):**
- 3 FOR, 1 AGAINST, 1 ABSTAIN
- Result: 3/4 = 75% approval ✅

**Quotité-weighted:**
- FOR: 20% + 30% + 15% = 65%
- AGAINST: 25%
- ABSTAIN: 10%
- Result: 65/90 = 72.2% approval ✅

**Hybrid (50/50 weights):**
- Democratic score: 75%
- Quotité score: 72.2%
- Hybrid: (75% × 0.5) + (72.2% × 0.5) = 73.6% approval ✅

**Hybrid (60/40 democratic-leaning):**
- Hybrid: (75% × 0.6) + (72.2% × 0.4) = 73.9% approval ✅

**Hybrid (70/30 quotité-leaning):**
- Hybrid: (75% × 0.3) + (72.2% × 0.7) = 73.0% approval ✅

### Configuration Flexibility

Voting rules can be:
- **Global**: Set per ACP (applies to all decisions)
- **Per-decision type**: E.g., major renovations use quotité-weighted, minor decisions use democratic
- **Evolving**: Start with quotité-weighted (founders have more stake), evolve to more democratic over time

---

## Type System (Framework-Agnostic)

### Core Types

```typescript
// Participant
interface Participant {
  id: string;
  name: string;
  isFounder: boolean;                 // GEN1 (portage eligible) vs GEN2+
  entryDate: Date;
  lotsOwned: LotOwnership[];
  financingDetails?: FinancingDetails;
}

interface LotOwnership {
  lotId: string;
  acquisitionDate: Date;
  acquisitionCost: number;
  surface: number;
}

// Lot
type LotOrigin = 'founder' | 'copro';
type LotStatus = 'available' | 'reserved' | 'sold' | 'hidden';

interface Lot {
  id: string;
  origin: LotOrigin;
  status: LotStatus;
  ownerId: string | 'copropriete';

  surface: number;
  imposedSurface?: number;            // Founder lots: fixed in acte de base
  flexibleSurface?: boolean;          // Copro lots: can adjust until permit

  heldForPortage: boolean;            // GEN1 holding for cost recovery sale

  acquisition?: {
    date: Date;
    totalCost: number;
    purchaseShare: number;
    registrationFees: number;         // 3% or 12.5% (Wallonia rates)
    constructionCost: number;
    fraisCommuns: number;
  };

  renovationCosts?: number;
  permitAllowsModification?: boolean;
}

// Sales
type SaleType = 'portage' | 'copro' | 'classic';
type Sale = PortageSale | CoproSale | ClassicSale;

// Project Financials
interface ProjectFinancials {
  totalPurchasePrice: number;
  fraisGeneraux: FraisGeneraux;
  travauxCommuns: number;
  expenseCategories: {
    conservatoire: number;
    habitabiliteSommaire: number;
    premierTravaux: number;
  };
  globalCascoPerM2: number;
  indexRates: IndexRate[];            // Belgian legal index (not fixed 2%)
}

interface FraisGeneraux {
  architectFees: number;              // Total CASCO × 15% × 30%
  recurringCosts: RecurringCosts;
  oneTimeCosts: number;
  total3Years: number;
}

interface RecurringCosts {
  propertyTax: number;                // 388.38€/year (précompte immobilier)
  accountant: number;                 // 1000€/year
  podio: number;                      // 600€/year
  buildingInsurance: number;          // 2000€/year total
  reservationFees: number;            // 2000€/year
  contingencies: number;              // 2000€/year
  syndicFees?: number;                // If applicable
  chargesCommunes?: number;           // If applicable
}
```

---

## Query Functions (Migration-Friendly)

**Design Principle**: Never access `context.lots` or `context.participants` directly. Always use query functions.

```typescript
const queries = {
  // Participants
  getFounders: (context: ProjectContext): Participant[] => {
    return context.participants.filter(p => p.isFounder);
  },

  getNewcomers: (context: ProjectContext): Participant[] => {
    return context.participants.filter(p => !p.isFounder);
  },

  // Lots
  getLotsByOrigin: (context: ProjectContext, origin: 'founder' | 'copro'): Lot[] => {
    return context.lots.filter(l => l.origin === origin);
  },

  getAvailableLots: (context: ProjectContext): Lot[] => {
    return context.lots.filter(l => l.status === 'available');
  },

  getPortageLots: (context: ProjectContext): Lot[] => {
    return context.lots.filter(l => l.heldForPortage === true);
  },

  getHiddenLots: (context: ProjectContext): Lot[] => {
    return context.lots.filter(l => l.type === 'copro' && l.status === 'hidden');
  },

  // Sale type detection
  getSaleType: (context: ProjectContext, lotId: string, sellerId: string): SaleType => {
    const lot = context.lots.find(l => l.id === lotId);

    if (sellerId === 'copropriete' && lot?.origin === 'copro') {
      return 'copro';
    }

    if (lot?.heldForPortage) {
      return 'portage';
    }

    return 'classic';
  },

  // Financial queries
  calculatePortagePrice: (context, lotId, saleDate): PortagePricing => {
    // Invoked as service, returns complete pricing breakdown
  },

  calculateCoproPrice: (context, lotId, saleDate): CoproPricing => {
    // Invoked as service, returns dynamic pricing
  },

  // State queries
  canSellPortageLots: (context: ProjectContext): boolean => {
    return context.acteTranscriptionDate !== null;
  },

  canSellCoproLots: (context: ProjectContext): boolean => {
    return context.permitEnactedDate !== null &&
           queries.getRevealedCoproLots(context).length > 0;
  },

  // Warnings
  getDeadlineWarnings: (context: ProjectContext): Warning[] => {
    const warnings: Warning[] = [];

    // Permit enactment deadline (3 years from deed)
    if (context.deedDate && !context.permitEnactedDate) {
      const yearsSince = (Date.now() - context.deedDate.getTime()) / (1000 * 60 * 60 * 24 * 365);
      if (yearsSince > 2.5) {
        warnings.push({
          type: 'permit_deadline',
          severity: yearsSince > 2.9 ? 'critical' : 'warning',
          message: `Permit must be enacted within 3 years of deed (${(3 - yearsSince).toFixed(1)} years remaining)`
        });
      }
    }

    // Lot declaration deadline (3 years from permit)
    if (context.permitGrantedDate && queries.getHiddenLots(context).length > 0) {
      const yearsSince = (Date.now() - context.permitGrantedDate.getTime()) / (1000 * 60 * 60 * 24 * 365);
      if (yearsSince > 2.5) {
        warnings.push({
          type: 'declaration_deadline',
          severity: yearsSince > 2.9 ? 'critical' : 'warning',
          message: `Hidden lots must be declared within 3 years of permit (${(3 - yearsSince).toFixed(1)} years remaining)`
        });
      }
    }

    return warnings;
  }
};
```

**Why This Matters:**

When migrating to Actor model (Pattern B), only query implementations change:

```typescript
// Pattern A: Direct array access
const getAvailableLots = (context) =>
  context.lots.filter(l => l.status === 'available');

// Pattern B: Query spawned actors
const getAvailableLots = (context) =>
  Object.values(context.lotMachines)
    .filter(ref => ref.getSnapshot().matches('available'))
    .map(ref => ref.getSnapshot().context);
```

All calling code remains unchanged.

---

## XState Best Practices Applied

### 1. Setup Pattern (Type-Safe)

```typescript
import { setup, assign, and, or, not } from 'xstate';

const creditCastorMachine = setup({
  types: {} as {
    context: ProjectContext;
    events: ProjectEvents;
  },

  guards: {
    // Serialized guards (not inline functions)
    isPortageSale: ({ context, event }) => { ... },
    canSellPortageLot: and(['isPortageSale', 'acteTranscribed']),
  },

  actions: {
    // Serialized actions with params
    recordPortageSale: assign({
      salesHistory: ({ context, event }, params: { pricing: PortagePricing }) => [
        ...context.salesHistory,
        { type: 'portage', ...params.pricing }
      ]
    })
  }

}).createMachine({ ... });
```

### 2. Guarded Transitions Array (Switch-Case Pattern)

```typescript
on: {
  SALE_INITIATED: [
    {
      target: 'portage_sale',
      guard: 'canSellPortageLot',
      description: 'GEN1 selling with cost recovery pricing'
    },
    {
      target: 'copro_sale',
      guard: 'canSellCoproLot',
      description: 'Copropriété selling hidden lot'
    },
    {
      target: 'classic_sale',
      guard: 'isClassicSale',
      description: 'Participant reselling at market price'
    },
    {
      // Fallback - no guard
      target: 'sale_error',
      actions: { type: 'logError', params: { error: 'Invalid sale type' } },
      description: 'Invalid sale configuration'
    }
  ]
}
```

### 3. Parameterized Guards/Actions

```typescript
guards: {
  withinTimeLimit: ({ context }, params: {
    dateField: keyof ProjectContext;
    yearsLimit: number
  }) => {
    const date = context[params.dateField] as Date | null;
    if (!date) return false;
    const yearsSince = (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24 * 365);
    return yearsSince <= params.yearsLimit;
  }
}

// Usage:
{
  guard: {
    type: 'withinTimeLimit',
    params: { dateField: 'deedDate', yearsLimit: 3 }
  }
}
```

### 4. Invoke for Async Calculations

```typescript
portage_sale: {
  invoke: {
    src: 'calculatePortagePrice',
    input: ({ context, event }) => ({
      lotId: event.lotId,
      saleDate: event.saleDate,
      context
    }),
    onDone: {
      target: 'sale_completed',
      actions: {
        type: 'recordPortageSale',
        params: ({ event }) => ({ pricing: event.output })
      }
    },
    onError: 'sale_error'
  }
}
```

### 5. Immutable Context Updates

```typescript
actions: {
  recordSale: assign({
    // ✅ Immutable - creates new array
    salesHistory: ({ context, event }) => [
      ...context.salesHistory,
      newSale
    ],

    // ✅ Immutable - maps to new array
    lots: ({ context, event }) =>
      context.lots.map(lot =>
        lot.id === event.lotId
          ? { ...lot, status: 'sold' }
          : lot
      )
  })
}

// ❌ DON'T DO THIS (mutates context)
recordSale: ({ context }) => {
  context.salesHistory.push(newSale);
  context.lots[0].status = 'sold';
}
```

---

## Implementation Guidance

### Phase 1: Core Machine Structure (Week 1)

**Day 1-2: Setup & Types**
- [ ] Create `src/stateMachine/types.ts` with all TypeScript interfaces
- [ ] Create `src/stateMachine/context.ts` with initial context factory
- [ ] Create `src/stateMachine/events.ts` with event type definitions

**Day 3-4: Base Machine**
- [ ] Create `src/stateMachine/creditCastorMachine.ts`
- [ ] Implement project lifecycle states (pre_purchase → sales_active)
- [ ] Add basic guards (time limits, legal gates)
- [ ] Write unit tests for state transitions

**Day 5: Query Layer**
- [ ] Create `src/stateMachine/queries.ts`
- [ ] Implement all query functions
- [ ] Write unit tests for queries

### Phase 2: Transaction Flows (Week 2)

**Day 1-2: Portage Sales**
- [ ] Implement portage sale state machine
- [ ] Add `calculatePortagePrice` service
- [ ] Write tests for portage pricing calculations
- [ ] Test state transitions (SALE_INITIATED → SALE_COMPLETED)

**Day 3-4: Copropriété & Classic Sales**
- [ ] Implement copro sale flow with dynamic pricing
- [ ] Implement classic sale flow with governance (buyer approval, price cap)
- [ ] Write tests for all sale types
- [ ] Test guarded transitions (routing by sale type)

**Day 5: Integration**
- [ ] Connect sales flows to main machine
- [ ] Test parallel sales (multiple lots selling simultaneously)
- [ ] Test edge cases (invalid sales, rejected buyers)

### Phase 3: Financing Flows (Week 3)

**Day 1-2: Individual Loans**
- [ ] Implement `IndividualLoanMachine` (5 stages)
- [ ] Add spawning from main machine
- [ ] Test parent-child communication
- [ ] Test compromis period deadline enforcement

**Day 3-5: ACP Collective Loans**
- [ ] Implement `ACPLoanMachine` with voting
- [ ] Implement voting calculation (democratic, quotité, hybrid)
- [ ] Add capital gathering flow
- [ ] Write tests for all voting scenarios
- [ ] Test ACP loan from proposal to disbursement

### Phase 4: Integration & Testing (Week 4)

**Day 1-2: End-to-End Tests**
- [ ] Write full lifecycle test (purchase → sales → completion)
- [ ] Test all 3 sale types in sequence
- [ ] Test deadline warnings (permit, declaration)
- [ ] Test financing coordination (all founders must be approved)

**Day 3: Documentation**
- [ ] Generate state diagram from machine (using XState visualizer)
- [ ] Document all guards and their business rules
- [ ] Document all actions and side effects
- [ ] Create usage examples

**Day 4-5: Calculator Integration**
- [ ] Connect state machine to existing calculator utils
- [ ] Add state validation to UI (disable invalid actions)
- [ ] Add deadline warnings to UI
- [ ] Test with real project data

### Testing Strategy

**Unit Tests:**
- Guards (pure boolean functions)
- Actions (pure context transformations)
- Query functions
- Calculation functions (indexation, carrying costs, quotité)

**Integration Tests:**
- State transitions (event → new state)
- Guarded transitions (event + guard → correct target)
- Parallel states (financing coordination)
- Spawned actors (loan machines, ACP loan machines)

**E2E Tests:**
- Full project lifecycle scenarios
- Multiple participants with different loan statuses
- Multiple sales happening in parallel
- ACP loan with voting and capital gathering

---

## Migration Path: Pattern A → Pattern B

### When to Migrate

Migrate to Actor model when:

1. **Many lots** (>20): Individual lot state machines provide better organization
2. **Complex sales workflows**: Each lot sale becomes independent process
3. **Real-time coordination**: Multiple users interacting with different lots simultaneously
4. **Performance**: Spawned actors can be lazily loaded/unloaded

### Migration Steps

**Step 1: Extract Lot State Logic (1 day)**

```typescript
// Create lot machine definition (but don't use it yet)
const lotMachine = setup({
  types: {} as {
    context: Lot;
    events: LotEvents;
  }
}).createMachine({
  id: 'lot',
  initial: 'available',
  states: {
    available: {
      on: { LIST_FOR_SALE: 'listed' }
    },
    listed: {
      on: { SOLD: 'sold' }
    },
    sold: { type: 'final' }
  }
});
```

**Step 2: Add Spawning (1 day)**

```typescript
const projectMachine = setup({
  // ... existing setup

  actions: {
    spawnLotMachine: ({ spawn, event }) => {
      spawn(lotMachine, {
        id: `lot-${event.lotId}`,
        input: event.lotData
      });
    }
  }
}).createMachine({
  context: {
    // Add actor references
    lotMachines: {} as Record<string, ActorRef>
  }
});
```

**Step 3: Update Queries (1 day)**

```typescript
// Pattern A
const getAvailableLots = (context) =>
  context.lots.filter(l => l.status === 'available');

// Pattern B
const getAvailableLots = (context) =>
  Object.values(context.lotMachines)
    .filter(ref => ref.getSnapshot().matches('available'))
    .map(ref => ref.getSnapshot().context);
```

**Step 4: Migrate Events (1-2 days)**

```typescript
// Pattern A: Direct mutation
on: {
  LOT_SOLD: {
    actions: assign({
      lots: (ctx, event) => ctx.lots.map(lot =>
        lot.id === event.lotId ? { ...lot, status: 'sold' } : lot
      )
    })
  }
}

// Pattern B: Delegate to actor
on: {
  LOT_SOLD: {
    actions: sendTo(
      (ctx, event) => ctx.lotMachines[event.lotId],
      { type: 'SOLD' }
    )
  }
}
```

**Step 5: Clean Up (0.5 day)**

- Remove `context.lots` array
- Update all query function implementations
- Update tests to work with actors

**Total Migration Time: 4-5 days**

---

## Next Steps

### Immediate (Today)

1. ✅ Review this design document for accuracy
2. [ ] Commit to git: `git add docs/plans/2025-11-03-state-machine-design.md`
3. [ ] Create implementation plan: `/superpowers:write-plan`

### Short-Term (This Week)

1. [ ] Set up git worktree: `superpowers:using-git-worktrees`
2. [ ] Implement core machine structure (Phase 1)
3. [ ] Write comprehensive tests (TDD approach)
4. [ ] Create state diagram visualization

### Medium-Term (Next 2 Weeks)

1. [ ] Implement transaction flows (Phase 2)
2. [ ] Implement financing flows (Phase 3)
3. [ ] Integration testing (Phase 4)
4. [ ] Connect to existing calculator

### Long-Term (Future)

1. [ ] Add UI state visualization (show current phase, warnings)
2. [ ] Add audit log export (all state transitions with timestamps)
3. [ ] Consider Actor model migration if complexity grows
4. [ ] Extend for CLT transition (new governance rules)

---

## References

### Business Logic
- [business-logic-validated.md](../analysis/business-logic-validated.md) - Validated business requirements
- [business-logic-assertions.md](../analysis/business-logic-assertions.md) - Original Q&A session

### XState Documentation
- [Guards](https://stately.ai/docs/guards) - Best practices for guards
- [Actions](https://stately.ai/docs/actions) - Best practices for actions
- [Transitions](https://stately.ai/docs/transitions) - Guarded transitions, eventless transitions
- [Context](https://stately.ai/docs/context) - Immutable context management

### Belgian Real Estate Law
- [DLA Piper REALWORLD](https://www.dlapiperrealworld.com) - Belgian real estate transaction process
- [Wallonia Urban Planning Reform (May 2025)](https://www.christiesrealestatebelgium.be/en/urban-planning-permit-reform-in-wallonia-a-long-awaited-simplification-from-may-1-2025/) - Permit process
- Belgian copropriété regulations - Acte de base, PRECAD, quotité calculations

### Implementation Resources
- XState Visualizer - Generate state diagrams
- TypeScript Playground - Test type definitions
- Vitest - Testing framework (already in project)

---

## Appendix: Complete Type Definitions

See implementation for full type system including:

- `ProjectContext` - Complete state machine context
- `ProjectEvents` - All event types (purchase, sales, financing, voting)
- `Participant`, `Lot`, `Sale` types with all variants
- `PortagePricing`, `CoproPricing`, `ClassicSale` pricing models
- `LoanApplication`, `ACPLoan` financing types
- `VotingRules`, `VotingResults` governance types
- `Warning`, `ProjectPhase` monitoring types

All types are framework-agnostic and can be used with or without XState.

---

**End of Design Document**

*This design represents the complete state machine architecture for Credit Castor. Implementation should follow XState best practices while maintaining framework agnosticism for long-term flexibility.*
