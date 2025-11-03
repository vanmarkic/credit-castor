# State Machine Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement XState-based state machine to model Credit Castor project lifecycle with 11 legal phases, 3 transaction types, and 2 financing flows.

**Architecture:** Pattern A (flat context + query functions) for simplicity with clear migration path to Actor model. Framework-agnostic TypeScript types with XState v5 optimization. All business logic in pure functions, state machine handles orchestration only.

**Tech Stack:** TypeScript, XState v5, Vitest (existing)

**Design Reference:** [2025-11-03-state-machine-design.md](./2025-11-03-state-machine-design.md)

---

## Phase 1: Core Types & Context (Week 1, Days 1-2)

### Task 1: Create Base Type Definitions

**Files:**
- Create: `src/stateMachine/types.ts`

**Step 1: Write types test file**

Create: `src/stateMachine/types.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import type { Participant, Lot, ProjectContext } from './types';

describe('Type Definitions', () => {
  it('should create valid Participant', () => {
    const participant: Participant = {
      id: 'p1',
      name: 'Alice',
      isFounder: true,
      entryDate: new Date('2023-01-01'),
      lotsOwned: []
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
```

**Step 2: Run test to verify it fails**

Run: `npm run test src/stateMachine/types.test.ts`
Expected: FAIL - "Cannot find module './types'"

**Step 3: Create base types file**

Create: `src/stateMachine/types.ts`

```typescript
// ============================================
// PARTICIPANT TYPES
// ============================================

export interface Participant {
  id: string;
  name: string;
  isFounder: boolean;
  entryDate: Date;
  lotsOwned: LotOwnership[];
  loans: FinancingDetails[]; // Array to support multiple loans (purchase + renovation)
}

export interface LotOwnership {
  lotId: string;
  acquisitionDate: Date;
  acquisitionCost: number;
  surface: number;
}

export interface FinancingDetails {
  loanAmount: number;
  interestRate: number;
  durationYears: number;
  monthlyPayment: number;
  purpose: 'purchase' | 'renovation'; // Purchase loan or private renovation loan
  disbursementDate?: Date;
}

// ============================================
// LOT TYPES
// ============================================

export type LotOrigin = 'founder' | 'copro';
export type LotStatus = 'available' | 'reserved' | 'sold' | 'hidden';

export interface Lot {
  id: string;
  origin: LotOrigin;
  status: LotStatus;
  ownerId: string | 'copropriete';

  surface: number;
  imposedSurface?: number;
  flexibleSurface?: boolean;

  heldForPortage: boolean;

  acquisition?: {
    date: Date;
    totalCost: number;
    purchaseShare: number;
    registrationFees: number;
    constructionCost: number;
    fraisCommuns: number;
  };

  renovationCosts?: number;
  permitAllowsModification?: boolean;
}

// ============================================
// PROJECT CONTEXT
// ============================================

export interface ProjectContext {
  // Legal milestones
  compromisDate: Date | null;
  deedDate: Date | null;
  registrationDate: Date | null;
  precadReferenceNumber: string | null;
  precadRequestDate: Date | null;
  acteDeBaseDate: Date | null;
  acteTranscriptionDate: Date | null;
  acpEnterpriseNumber: string | null;
  permitRequestedDate: Date | null;
  permitGrantedDate: Date | null;
  permitEnactedDate: Date | null;

  // Core data
  participants: Participant[];
  lots: Lot[];
  salesHistory: Sale[];

  // Financing
  financingApplications: Map<string, LoanApplication>;
  requiredFinancing: number;
  approvedFinancing: number;
  bankDeadline: Date | null;

  // ACP loans
  acpLoans: Map<string, ACPLoan>;
  acpBankAccount: number;

  // Project financials
  projectFinancials: ProjectFinancials;
}

// Stub types (will be filled in later tasks)
export type Sale = any;
export type LoanApplication = any;
export type ACPLoan = any;
export type ProjectFinancials = any;
```

**Step 4: Run test to verify it passes**

Run: `npm run test src/stateMachine/types.test.ts`
Expected: PASS (2 tests)

**Step 5: Commit**

```bash
git add src/stateMachine/types.ts src/stateMachine/types.test.ts
git commit -m "feat(state-machine): add base type definitions for participants and lots"
```

---

### Task 2: Add Sale Type Definitions

**Files:**
- Modify: `src/stateMachine/types.ts`
- Modify: `src/stateMachine/types.test.ts`

**Step 1: Write test for sale types**

Add to `src/stateMachine/types.test.ts`:

```typescript
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
```

**Step 2: Run test to verify it fails**

Run: `npm run test src/stateMachine/types.test.ts`
Expected: FAIL - "Cannot find name 'PortageSale'"

**Step 3: Add sale type definitions**

Add to `src/stateMachine/types.ts`:

```typescript
// ============================================
// SALE TYPES
// ============================================

export type SaleType = 'portage' | 'copro' | 'classic';

interface BaseSale {
  lotId: string;
  buyer: string;
  saleDate: Date;
}

export interface PortageSale extends BaseSale {
  type: 'portage';
  seller: string;
  pricing: PortagePricing;
}

export interface PortagePricing {
  baseAcquisitionCost: number;
  indexation: number;
  carryingCosts: CarryingCosts;
  renovations: number;
  registrationFeesRecovery: number;
  fraisCommunsRecovery: number;
  loanInterestRecovery: number;
  totalPrice: number;
}

export interface CarryingCosts {
  monthlyLoanInterest: number;
  propertyTax: number;
  buildingInsurance: number;
  syndicFees: number;
  chargesCommunes: number;
  totalMonths: number;
  total: number;
}

export interface CoproSale extends BaseSale {
  type: 'copro';
  surface: number;
  pricing: CoproPricing;
}

export interface CoproPricing {
  baseCostPerSqm: number;
  gen1CompensationPerSqm: number;
  pricePerSqm: number;
  surface: number;
  totalPrice: number;
}

export interface ClassicSale extends BaseSale {
  type: 'classic';
  seller: string;
  price: number;
  buyerApproval: BuyerApproval;
  priceCap: number;
}

export interface BuyerApproval {
  candidateId: string;
  interviewDate: Date;
  approved: boolean;
  notes: string;
}

export type Sale = PortageSale | CoproSale | ClassicSale;
```

**Step 4: Run test to verify it passes**

Run: `npm run test src/stateMachine/types.test.ts`
Expected: PASS (5 tests total)

**Step 5: Commit**

```bash
git add src/stateMachine/types.ts src/stateMachine/types.test.ts
git commit -m "feat(state-machine): add sale type definitions for portage, copro, and classic"
```

---

### Task 3: Add Financing Type Definitions

**Files:**
- Modify: `src/stateMachine/types.ts`
- Modify: `src/stateMachine/types.test.ts`

**Step 1: Write test for loan types**

Add to `src/stateMachine/types.test.ts`:

```typescript
describe('Financing Types', () => {
  it('should create individual loan application', () => {
    const loan: LoanApplication = {
      participantId: 'p1',
      status: 'pending',
      loanAmount: 200000,
      interestRate: 0.035,
      durationYears: 25,
      applicationDate: new Date(),
      bankName: 'KBC'
    };

    expect(loan.status).toBe('pending');
  });

  it('should create ACP collective loan with voting', () => {
    const acpLoan: ACPLoan = {
      id: 'acp1',
      purpose: 'roof',
      description: 'Replace aging roof',
      totalAmount: 50000,
      capitalRequired: 15000,
      capitalGathered: 0,
      contributions: new Map(),
      loanAmount: 0,
      interestRate: 0.035,
      durationYears: 10,
      votingRules: {
        method: 'hybrid',
        quorumPercentage: 50,
        majorityPercentage: 50,
        hybridWeights: {
          democraticWeight: 0.5,
          quotiteWeight: 0.5
        }
      },
      votes: new Map(),
      approvedByCoowners: false,
      votingDate: null,
      applicationDate: new Date(),
      approvalDate: null,
      disbursementDate: null,
      status: 'proposed'
    };

    expect(acpLoan.purpose).toBe('roof');
    expect(acpLoan.votingRules.method).toBe('hybrid');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm run test src/stateMachine/types.test.ts`
Expected: FAIL - "Cannot find name 'LoanApplication'"

**Step 3: Add financing type definitions**

Add to `src/stateMachine/types.ts`:

```typescript
// ============================================
// LOAN TYPES
// ============================================

export type LoanStatus = 'not_applied' | 'pending' | 'approved' | 'rejected';

export interface LoanApplication {
  participantId: string;
  status: LoanStatus;
  loanAmount: number;
  interestRate: number;
  durationYears: number;
  purpose: 'purchase' | 'renovation'; // Distinguish between initial purchase and private renovation
  applicationDate: Date;
  approvalDate?: Date;
  disbursementDate?: Date;
  bankName?: string;
  rejectionReason?: string;
}

// ============================================
// ACP COLLECTIVE LOAN TYPES
// ============================================

export type ACPLoanPurpose = 'roof' | 'staircases' | 'facade' | 'common_areas' | 'other';
export type ACPLoanStatus = 'proposed' | 'voting' | 'capital_gathering' | 'loan_application' | 'approved' | 'disbursed' | 'rejected';

export interface ACPLoan {
  id: string;
  purpose: ACPLoanPurpose;
  description: string;
  totalAmount: number;

  capitalRequired: number;
  capitalGathered: number;
  contributions: Map<string, ACPContribution>;

  loanAmount: number;
  interestRate: number;
  durationYears: number;

  votingRules: VotingRules;
  votes: Map<string, ParticipantVote>;
  votingResults?: VotingResults;
  approvedByCoowners: boolean;
  votingDate: Date | null;

  applicationDate: Date;
  approvalDate: Date | null;
  disbursementDate: Date | null;
  status: ACPLoanStatus;
}

export interface ACPContribution {
  participantId: string;
  amountPledged: number;
  amountPaid: number;
  quotiteShare: number;
  paymentDate: Date | null;
}

// ============================================
// VOTING TYPES
// ============================================

export type VotingMethod = 'one_person_one_vote' | 'quotite_weighted' | 'hybrid';

export interface VotingRules {
  method: VotingMethod;
  quorumPercentage: number;
  majorityPercentage: number;
  hybridWeights?: {
    democraticWeight: number;
    quotiteWeight: number;
  };
}

export interface ParticipantVote {
  participantId: string;
  vote: 'for' | 'against' | 'abstain';
  quotite: number;
  timestamp: Date;
}

export interface VotingResults {
  totalVoters: number;
  votesFor: number;
  votesAgainst: number;
  abstentions: number;

  totalQuotite: number;
  quotiteFor: number;
  quotiteAgainst: number;
  quotiteAbstained: number;

  hybridScore?: number;

  quorumReached: boolean;
  majorityReached: boolean;
  democraticMajority: boolean;
  quotiteMajority: boolean;
}
```

**Step 4: Run test to verify it passes**

Run: `npm run test src/stateMachine/types.test.ts`
Expected: PASS (7 tests total)

**Step 5: Commit**

```bash
git add src/stateMachine/types.ts src/stateMachine/types.test.ts
git commit -m "feat(state-machine): add financing types for individual and ACP loans"
```

---

**📝 Important Note: Multiple Loans per Participant**

Participants buying before the start of renovations can take **two separate loans**:

1. **Purchase Loan** (`purpose: 'purchase'`)
   - For initial property acquisition and construction costs
   - Disbursed at or shortly after deed signing
   - Used to pay: purchase share, registration fees, initial construction

2. **Private Renovation Loan** (`purpose: 'renovation'`)
   - For participant's private space renovations (parachèvements)
   - Disbursed later when renovations begin
   - NOT for common areas (those are covered by ACP collective loans)
   - Timing: Typically months/years after purchase when participant is ready to renovate

**Example Scenario:**
- Alice buys in January 2023: Takes €150,000 purchase loan
- Alice starts her private renovations in June 2024: Takes €50,000 renovation loan
- Both loans tracked in `participant.loans[]` array with different purposes

**Implementation Impact:**
- `Participant.loans` is an array, not a single optional field
- Each `FinancingDetails` has a `purpose` field to distinguish loan type
- Carrying costs calculations must consider all active loans
- Portage pricing includes interest from all loans held during ownership

---

### Task 4: Add Project Financials Types

**Files:**
- Modify: `src/stateMachine/types.ts`
- Modify: `src/stateMachine/types.test.ts`

**Step 1: Write test for financials**

Add to `src/stateMachine/types.test.ts`:

```typescript
describe('Project Financials', () => {
  it('should create project financials structure', () => {
    const financials: ProjectFinancials = {
      totalPurchasePrice: 500000,
      fraisGeneraux: {
        architectFees: 15000,
        recurringCosts: {
          propertyTax: 388.38,
          accountant: 1000,
          podio: 600,
          buildingInsurance: 2000,
          reservationFees: 2000,
          contingencies: 2000
        },
        oneTimeCosts: 5000,
        total3Years: 45000
      },
      travauxCommuns: 100000,
      expenseCategories: {
        conservatoire: 20000,
        habitabiliteSommaire: 30000,
        premierTravaux: 50000
      },
      globalCascoPerM2: 1500,
      indexRates: [
        { year: 2023, rate: 1.02 },
        { year: 2024, rate: 1.03 }
      ]
    };

    expect(financials.totalPurchasePrice).toBe(500000);
    expect(financials.fraisGeneraux.total3Years).toBe(45000);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm run test src/stateMachine/types.test.ts`
Expected: FAIL - "Cannot find name 'ProjectFinancials'"

**Step 3: Add financials type definitions**

Add to `src/stateMachine/types.ts`:

```typescript
// ============================================
// FINANCIAL TYPES
// ============================================

export interface ProjectFinancials {
  totalPurchasePrice: number;
  fraisGeneraux: FraisGeneraux;
  travauxCommuns: number;
  expenseCategories: {
    conservatoire: number;
    habitabiliteSommaire: number;
    premierTravaux: number;
  };
  globalCascoPerM2: number;
  indexRates: IndexRate[];
}

export interface FraisGeneraux {
  architectFees: number;
  recurringCosts: RecurringCosts;
  oneTimeCosts: number;
  total3Years: number;
}

export interface RecurringCosts {
  propertyTax: number;
  accountant: number;
  podio: number;
  buildingInsurance: number;
  reservationFees: number;
  contingencies: number;
  syndicFees?: number;
  chargesCommunes?: number;
}

export interface IndexRate {
  year: number;
  rate: number;
}
```

**Step 4: Run test to verify it passes**

Run: `npm run test src/stateMachine/types.test.ts`
Expected: PASS (8 tests total)

**Step 5: Commit**

```bash
git add src/stateMachine/types.ts src/stateMachine/types.test.ts
git commit -m "feat(state-machine): add project financials types"
```

---

### Task 5: Create Event Type Definitions

**Files:**
- Create: `src/stateMachine/events.ts`
- Create: `src/stateMachine/events.test.ts`

**Step 1: Write test for event types**

Create: `src/stateMachine/events.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import type { ProjectEvents, PurchaseEvents, SalesEvents, FinancingEvents } from './events';

describe('Event Types', () => {
  it('should create purchase event', () => {
    const event: PurchaseEvents = {
      type: 'COMPROMIS_SIGNED',
      compromisDate: new Date('2023-01-01'),
      deposit: 50000
    };

    expect(event.type).toBe('COMPROMIS_SIGNED');
  });

  it('should create sale event', () => {
    const event: SalesEvents = {
      type: 'SALE_INITIATED',
      lotId: 'lot1',
      sellerId: 'p1',
      buyerId: 'p2',
      proposedPrice: 150000,
      saleDate: new Date()
    };

    expect(event.type).toBe('SALE_INITIATED');
  });

  it('should create financing event', () => {
    const event: FinancingEvents = {
      type: 'APPLY_FOR_LOAN',
      participantId: 'p1',
      loanDetails: {
        amount: 200000,
        rate: 0.035,
        duration: 25,
        bankName: 'KBC'
      }
    };

    expect(event.type).toBe('APPLY_FOR_LOAN');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm run test src/stateMachine/events.test.ts`
Expected: FAIL - "Cannot find module './events'"

**Step 3: Create event type definitions**

Create: `src/stateMachine/events.ts`

```typescript
// ============================================
// PURCHASE & LEGAL EVENTS
// ============================================

export type PurchaseEvents =
  | { type: 'COMPROMIS_SIGNED'; compromisDate: Date; deposit: number }
  | { type: 'FINANCING_APPROVED'; participantId: string }
  | { type: 'FINANCING_REJECTED'; participantId: string; reason: string }
  | { type: 'ALL_CONDITIONS_MET' }
  | { type: 'DEED_SIGNED'; deedDate: Date; notaryId: string }
  | { type: 'DEED_REGISTERED'; registrationDate: Date };

// ============================================
// COPROPRIÉTÉ CREATION EVENTS
// ============================================

export type CoproCreationEvents =
  | { type: 'START_COPRO_CREATION' }
  | { type: 'TECHNICAL_REPORT_READY' }
  | { type: 'PRECAD_REQUESTED'; referenceNumber: string }
  | { type: 'PRECAD_APPROVED'; approvalDate: Date }
  | { type: 'ACTE_DRAFTED' }
  | { type: 'ACTE_SIGNED'; signatureDate: Date }
  | { type: 'ACTE_TRANSCRIBED'; transcriptionDate: Date; acpNumber: string };

// ============================================
// PERMIT EVENTS
// ============================================

export type PermitEvents =
  | { type: 'REQUEST_PERMIT' }
  | { type: 'PERMIT_GRANTED'; grantDate: Date }
  | { type: 'PERMIT_ENACTED'; enactmentDate: Date }
  | { type: 'PERMIT_REJECTED'; reason: string }
  | { type: 'DECLARE_HIDDEN_LOTS'; lotIds: string[] };

// ============================================
// SALES EVENTS
// ============================================

export type SalesEvents =
  | { type: 'FIRST_SALE' }
  | { type: 'SALE_INITIATED'; lotId: string; sellerId: string; buyerId: string; proposedPrice: number; saleDate: Date }
  | { type: 'BUYER_APPROVED'; candidateId: string }
  | { type: 'BUYER_REJECTED'; candidateId: string; reason: string }
  | { type: 'PRICE_ADJUSTED'; newPrice: number }
  | { type: 'COMPLETE_SALE' }
  | { type: 'SALE_CANCELLED'; reason: string }
  | { type: 'ALL_LOTS_SOLD' };

// ============================================
// FINANCING EVENTS
// ============================================

export interface LoanDetails {
  amount: number;
  rate: number;
  duration: number;
  bankName: string;
}

export type FinancingEvents =
  | { type: 'APPLY_FOR_LOAN'; participantId: string; loanDetails: LoanDetails }
  | { type: 'SUBMIT_DOCUMENTS'; participantId: string }
  | { type: 'BANK_REQUESTS_INFO'; participantId: string; request: string }
  | { type: 'PROVIDE_INFO'; participantId: string }
  | { type: 'BANK_APPROVES'; participantId: string }
  | { type: 'BANK_REJECTS'; participantId: string; reason: string }
  | { type: 'VALUATION_SCHEDULED'; participantId: string; date: Date }
  | { type: 'VALUATION_COMPLETED'; participantId: string; appraisedValue: number };

// ============================================
// ACP LOAN EVENTS
// ============================================

export interface ProposedACPLoan {
  purpose: 'roof' | 'staircases' | 'facade' | 'common_areas' | 'other';
  description: string;
  totalAmount: number;
  capitalRequired: number;
}

export type ACPLoanEvents =
  | { type: 'PROPOSE_ACP_LOAN'; loanDetails: ProposedACPLoan }
  | { type: 'SCHEDULE_VOTE'; votingDate: Date }
  | { type: 'VOTE_ON_LOAN'; participantId: string; vote: 'for' | 'against' | 'abstain' }
  | { type: 'VOTING_COMPLETE' }
  | { type: 'PLEDGE_CAPITAL'; participantId: string; amount: number }
  | { type: 'PAY_CAPITAL'; participantId: string; amount: number }
  | { type: 'APPLY_FOR_ACP_LOAN'; loanId: string }
  | { type: 'ACP_LOAN_APPROVED'; loanId: string }
  | { type: 'ACP_LOAN_REJECTED'; loanId: string; reason: string }
  | { type: 'DISBURSE_ACP_LOAN'; loanId: string };

// ============================================
// ALL EVENTS
// ============================================

export type ProjectEvents =
  | PurchaseEvents
  | CoproCreationEvents
  | PermitEvents
  | SalesEvents
  | FinancingEvents
  | ACPLoanEvents;
```

**Step 4: Run test to verify it passes**

Run: `npm run test src/stateMachine/events.test.ts`
Expected: PASS (3 tests)

**Step 5: Commit**

```bash
git add src/stateMachine/events.ts src/stateMachine/events.test.ts
git commit -m "feat(state-machine): add event type definitions for all state transitions"
```

---

## Phase 2: Pure Calculation Functions (Week 1, Days 3-4)

### Task 6: Create Calculation Utilities

**Files:**
- Create: `src/stateMachine/calculations.ts`
- Create: `src/stateMachine/calculations.test.ts`

**Step 1: Write test for indexation calculation**

Create: `src/stateMachine/calculations.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { calculateIndexation, calculateQuotite, calculateCarryingCosts } from './calculations';
import type { ProjectContext, Lot, Participant } from './types';

describe('Indexation Calculation', () => {
  it('should calculate indexation using Belgian legal index', () => {
    const indexRates = [
      { year: 2023, rate: 1.02 },
      { year: 2024, rate: 1.03 }
    ];

    const result = calculateIndexation(
      new Date('2023-01-01'),
      new Date('2025-01-01'),
      indexRates
    );

    // 2 years: 1.02 × 1.03 = 1.0506 → 5.06% growth
    expect(result).toBeCloseTo(0.0506, 4);
  });

  it('should handle partial years', () => {
    const indexRates = [
      { year: 2023, rate: 1.02 }
    ];

    const result = calculateIndexation(
      new Date('2023-01-01'),
      new Date('2023-07-01'),
      indexRates
    );

    // 0.5 years: partial application
    expect(result).toBeGreaterThan(0);
    expect(result).toBeLessThan(0.02);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm run test src/stateMachine/calculations.test.ts`
Expected: FAIL - "Cannot find module './calculations'"

**Step 3: Implement indexation calculation**

Create: `src/stateMachine/calculations.ts`

```typescript
import type { IndexRate, Lot, Participant, ProjectContext, CarryingCosts } from './types';

/**
 * Calculate indexation growth using Belgian legal index
 */
export function calculateIndexation(
  acquisitionDate: Date,
  saleDate: Date,
  indexRates: IndexRate[]
): number {
  const yearsHeld = (saleDate.getTime() - acquisitionDate.getTime()) / (1000 * 60 * 60 * 24 * 365);

  let indexedValue = 1;
  for (let year = 0; year < Math.floor(yearsHeld); year++) {
    const rate = indexRates[year]?.rate || 1.02; // Fallback to 2%
    indexedValue *= rate;
  }

  // Handle partial year
  const partialYear = yearsHeld - Math.floor(yearsHeld);
  if (partialYear > 0) {
    const nextRate = indexRates[Math.floor(yearsHeld)]?.rate || 1.02;
    const partialGrowth = (nextRate - 1) * partialYear;
    indexedValue *= (1 + partialGrowth);
  }

  return indexedValue - 1; // Return growth percentage
}

/**
 * Calculate participant's quotité (ownership share)
 */
export function calculateQuotite(
  participant: Participant | undefined,
  context: ProjectContext
): number {
  if (!participant) return 0;

  const totalSurface = context.lots.reduce((sum, lot) => sum + lot.surface, 0);
  const participantSurface = participant.lotsOwned.reduce((sum, lot) => sum + lot.surface, 0);

  return totalSurface > 0 ? participantSurface / totalSurface : 0;
}

/**
 * Calculate carrying costs for portage lot
 */
export function calculateCarryingCosts(
  lot: Lot,
  saleDate: Date,
  context: ProjectContext
): CarryingCosts {
  if (!lot.acquisition) {
    throw new Error('Lot has no acquisition data');
  }

  const monthsHeld = (saleDate.getTime() - lot.acquisition.date.getTime()) / (1000 * 60 * 60 * 24 * 30);

  // Get participant to calculate their quotité for insurance
  const participant = context.participants.find(p =>
    p.lotsOwned.some(lo => lo.lotId === lot.id)
  );

  const quotite = calculateQuotite(participant, context);

  // Monthly costs
  const monthlyLoanInterest = calculateMonthlyLoanInterest(lot, context);
  const propertyTax = 388.38 / 12; // Annual précompte immobilier
  const buildingInsurance = (2000 * quotite) / 12; // Annual insurance × quotité
  const syndicFees = 100; // Example monthly syndic fee
  const chargesCommunes = 50; // Example monthly charges

  const total =
    (monthlyLoanInterest * monthsHeld) +
    (propertyTax * monthsHeld) +
    (buildingInsurance * monthsHeld) +
    (syndicFees * monthsHeld) +
    (chargesCommunes * monthsHeld);

  return {
    monthlyLoanInterest,
    propertyTax: propertyTax * monthsHeld,
    buildingInsurance: buildingInsurance * monthsHeld,
    syndicFees: syndicFees * monthsHeld,
    chargesCommunes: chargesCommunes * monthsHeld,
    totalMonths: monthsHeld,
    total
  };
}

/**
 * Calculate monthly loan interest
 */
function calculateMonthlyLoanInterest(
  lot: Lot,
  context: ProjectContext
): number {
  const participant = context.participants.find(p =>
    p.lotsOwned.some(lo => lo.lotId === lot.id)
  );

  if (!participant || participant.loans.length === 0) return 0;

  // Sum monthly interest from all active loans (purchase + renovation)
  return participant.loans.reduce((total, loan) => {
    return total + (loan.loanAmount * loan.interestRate) / 12;
  }, 0);
}
```

**Step 4: Run test to verify it passes**

Run: `npm run test src/stateMachine/calculations.test.ts`
Expected: PASS (2 tests)

**Step 5: Commit**

```bash
git add src/stateMachine/calculations.ts src/stateMachine/calculations.test.ts
git commit -m "feat(state-machine): add calculation utilities for indexation and quotité"
```

---

### Task 7: Add Carrying Costs Calculation Tests

**Files:**
- Modify: `src/stateMachine/calculations.test.ts`

**Step 1: Write test for carrying costs**

Add to `src/stateMachine/calculations.test.ts`:

```typescript
describe('Carrying Costs Calculation', () => {
  it('should calculate monthly carrying costs', () => {
    const lot: Lot = {
      id: 'lot1',
      origin: 'founder',
      status: 'sold',
      ownerId: 'p1',
      surface: 100,
      heldForPortage: true,
      acquisition: {
        date: new Date('2023-01-01'),
        totalCost: 100000,
        purchaseShare: 50000,
        registrationFees: 3000,
        constructionCost: 45000,
        fraisCommuns: 2000
      }
    };

    const context: ProjectContext = {
      participants: [{
        id: 'p1',
        name: 'Alice',
        isFounder: true,
        entryDate: new Date('2023-01-01'),
        lotsOwned: [{ lotId: 'lot1', acquisitionDate: new Date('2023-01-01'), acquisitionCost: 100000, surface: 100 }],
        loans: [{
          loanAmount: 80000,
          interestRate: 0.035,
          durationYears: 25,
          monthlyPayment: 400,
          purpose: 'purchase',
          disbursementDate: new Date('2023-01-01')
        }]
      }],
      lots: [lot],
      // ... other context fields with defaults
    } as ProjectContext;

    const result = calculateCarryingCosts(
      lot,
      new Date('2025-01-01'), // 24 months later
      context
    );

    expect(result.totalMonths).toBeCloseTo(24, 0);
    expect(result.total).toBeGreaterThan(0);
    expect(result.monthlyLoanInterest).toBeCloseTo((80000 * 0.035) / 12, 2);
  });
});
```

**Step 2: Run test to verify it passes**

Run: `npm run test src/stateMachine/calculations.test.ts`
Expected: PASS (3 tests)

**Step 3: Commit**

```bash
git add src/stateMachine/calculations.test.ts
git commit -m "test(state-machine): add carrying costs calculation tests"
```

---

### Task 8: Add Voting Calculation Functions

**Files:**
- Modify: `src/stateMachine/calculations.ts`
- Modify: `src/stateMachine/calculations.test.ts`

**Step 1: Write test for voting calculations**

Add to `src/stateMachine/calculations.test.ts`:

```typescript
import { calculateVotingResults } from './calculations';
import type { ParticipantVote, VotingRules } from './types';

describe('Voting Calculations', () => {
  it('should calculate democratic voting results', () => {
    const votes = new Map<string, ParticipantVote>([
      ['p1', { participantId: 'p1', vote: 'for', quotite: 0.2, timestamp: new Date() }],
      ['p2', { participantId: 'p2', vote: 'for', quotite: 0.3, timestamp: new Date() }],
      ['p3', { participantId: 'p3', vote: 'against', quotite: 0.25, timestamp: new Date() }],
      ['p4', { participantId: 'p4', vote: 'for', quotite: 0.15, timestamp: new Date() }]
    ]);

    const rules: VotingRules = {
      method: 'one_person_one_vote',
      quorumPercentage: 50,
      majorityPercentage: 50
    };

    const result = calculateVotingResults(votes, rules, 5, 1.0);

    expect(result.totalVoters).toBe(4);
    expect(result.votesFor).toBe(3);
    expect(result.votesAgainst).toBe(1);
    expect(result.quorumReached).toBe(true); // 4/5 = 80% > 50%
    expect(result.majorityReached).toBe(true); // 3/4 = 75% > 50%
    expect(result.democraticMajority).toBe(true);
  });

  it('should calculate quotité-weighted voting results', () => {
    const votes = new Map<string, ParticipantVote>([
      ['p1', { participantId: 'p1', vote: 'for', quotite: 0.2, timestamp: new Date() }],
      ['p2', { participantId: 'p2', vote: 'for', quotite: 0.3, timestamp: new Date() }],
      ['p3', { participantId: 'p3', vote: 'against', quotite: 0.25, timestamp: new Date() }]
    ]);

    const rules: VotingRules = {
      method: 'quotite_weighted',
      quorumPercentage: 50,
      majorityPercentage: 50
    };

    const result = calculateVotingResults(votes, rules, 5, 1.0);

    expect(result.quotiteFor).toBe(0.5); // 20% + 30%
    expect(result.quotiteAgainst).toBe(0.25);
    expect(result.quotiteMajority).toBe(true); // 0.5/0.75 = 66.7% > 50%
  });

  it('should calculate hybrid voting results', () => {
    const votes = new Map<string, ParticipantVote>([
      ['p1', { participantId: 'p1', vote: 'for', quotite: 0.2, timestamp: new Date() }],
      ['p2', { participantId: 'p2', vote: 'for', quotite: 0.3, timestamp: new Date() }],
      ['p3', { participantId: 'p3', vote: 'against', quotite: 0.25, timestamp: new Date() }],
      ['p4', { participantId: 'p4', vote: 'for', quotite: 0.15, timestamp: new Date() }]
    ]);

    const rules: VotingRules = {
      method: 'hybrid',
      quorumPercentage: 50,
      majorityPercentage: 50,
      hybridWeights: {
        democraticWeight: 0.5,
        quotiteWeight: 0.5
      }
    };

    const result = calculateVotingResults(votes, rules, 5, 1.0);

    // Democratic: 3/4 = 75%
    // Quotité: 0.65/0.9 = 72.2%
    // Hybrid: (75% × 0.5) + (72.2% × 0.5) = 73.6%
    expect(result.hybridScore).toBeCloseTo(0.736, 2);
    expect(result.majorityReached).toBe(true);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm run test src/stateMachine/calculations.test.ts`
Expected: FAIL - "Cannot find name 'calculateVotingResults'"

**Step 3: Implement voting calculation**

Add to `src/stateMachine/calculations.ts`:

```typescript
import type { VotingRules, VotingResults, ParticipantVote } from './types';

/**
 * Calculate voting results based on voting method
 */
export function calculateVotingResults(
  votes: Map<string, ParticipantVote>,
  votingRules: VotingRules,
  totalParticipants: number,
  totalQuotitePossible: number = 1.0
): VotingResults {
  // Democratic counting
  const totalVoters = votes.size;
  const votesFor = Array.from(votes.values()).filter(v => v.vote === 'for').length;
  const votesAgainst = Array.from(votes.values()).filter(v => v.vote === 'against').length;
  const abstentions = Array.from(votes.values()).filter(v => v.vote === 'abstain').length;

  // Quotité-weighted counting
  const quotiteFor = Array.from(votes.values())
    .filter(v => v.vote === 'for')
    .reduce((sum, v) => sum + v.quotite, 0);

  const quotiteAgainst = Array.from(votes.values())
    .filter(v => v.vote === 'against')
    .reduce((sum, v) => sum + v.quotite, 0);

  const quotiteAbstained = Array.from(votes.values())
    .filter(v => v.vote === 'abstain')
    .reduce((sum, v) => sum + v.quotite, 0);

  const totalQuotite = quotiteFor + quotiteAgainst + quotiteAbstained;

  // Calculate majorities
  const democraticMajority = votesFor > (totalVoters * (votingRules.majorityPercentage / 100));
  const quotiteMajority = quotiteFor > (totalQuotite * (votingRules.majorityPercentage / 100));

  // Quorum checks
  let quorumReached = false;
  let majorityReached = false;
  let hybridScore: number | undefined;

  switch (votingRules.method) {
    case 'one_person_one_vote':
      quorumReached = totalVoters >= (totalParticipants * (votingRules.quorumPercentage / 100));
      majorityReached = democraticMajority;
      break;

    case 'quotite_weighted':
      quorumReached = totalQuotite >= (totalQuotitePossible * (votingRules.quorumPercentage / 100));
      majorityReached = quotiteMajority;
      break;

    case 'hybrid':
      if (!votingRules.hybridWeights) {
        throw new Error('Hybrid voting requires hybridWeights configuration');
      }

      const democraticQuorum = totalVoters >= (totalParticipants * (votingRules.quorumPercentage / 100));
      const quotiteQuorum = totalQuotite >= (totalQuotitePossible * (votingRules.quorumPercentage / 100));
      quorumReached = democraticQuorum && quotiteQuorum;

      const democraticScore = totalVoters > 0 ? votesFor / totalVoters : 0;
      const quotiteScore = totalQuotite > 0 ? quotiteFor / totalQuotite : 0;

      hybridScore =
        (democraticScore * votingRules.hybridWeights.democraticWeight) +
        (quotiteScore * votingRules.hybridWeights.quotiteWeight);

      majorityReached = hybridScore > (votingRules.majorityPercentage / 100);
      break;
  }

  return {
    totalVoters,
    votesFor,
    votesAgainst,
    abstentions,
    totalQuotite,
    quotiteFor,
    quotiteAgainst,
    quotiteAbstained,
    hybridScore,
    quorumReached,
    majorityReached,
    democraticMajority,
    quotiteMajority
  };
}
```

**Step 4: Run test to verify it passes**

Run: `npm run test src/stateMachine/calculations.test.ts`
Expected: PASS (6 tests)

**Step 5: Commit**

```bash
git add src/stateMachine/calculations.ts src/stateMachine/calculations.test.ts
git commit -m "feat(state-machine): add voting calculation functions for hybrid governance"
```

---

## Phase 3: Query Functions Layer (Week 1, Day 5)

### Task 9: Create Query Functions

**Files:**
- Create: `src/stateMachine/queries.ts`
- Create: `src/stateMachine/queries.test.ts`

**Step 1: Write tests for participant queries**

Create: `src/stateMachine/queries.test.ts`

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { queries } from './queries';
import type { ProjectContext, Participant, Lot } from './types';

describe('Participant Queries', () => {
  let context: ProjectContext;

  beforeEach(() => {
    context = {
      participants: [
        {
          id: 'p1',
          name: 'Alice',
          isFounder: true,
          entryDate: new Date('2023-01-01'),
          lotsOwned: []
        },
        {
          id: 'p2',
          name: 'Bob',
          isFounder: true,
          entryDate: new Date('2023-01-01'),
          lotsOwned: []
        },
        {
          id: 'p3',
          name: 'Carol',
          isFounder: false,
          entryDate: new Date('2024-01-01'),
          lotsOwned: []
        }
      ],
      lots: [],
      salesHistory: [],
      // ... minimal context
    } as ProjectContext;
  });

  it('should get all founders', () => {
    const founders = queries.getFounders(context);
    expect(founders).toHaveLength(2);
    expect(founders[0].name).toBe('Alice');
    expect(founders[1].name).toBe('Bob');
  });

  it('should get all newcomers', () => {
    const newcomers = queries.getNewcomers(context);
    expect(newcomers).toHaveLength(1);
    expect(newcomers[0].name).toBe('Carol');
  });

  it('should get participant by id', () => {
    const participant = queries.getParticipant(context, 'p2');
    expect(participant?.name).toBe('Bob');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm run test src/stateMachine/queries.test.ts`
Expected: FAIL - "Cannot find module './queries'"

**Step 3: Implement participant queries**

Create: `src/stateMachine/queries.ts`

```typescript
import type { ProjectContext, Participant, Lot, Sale, SaleType } from './types';

export const queries = {
  // ============================================
  // PARTICIPANT QUERIES
  // ============================================

  getFounders(context: ProjectContext): Participant[] {
    return context.participants.filter(p => p.isFounder);
  },

  getNewcomers(context: ProjectContext): Participant[] {
    return context.participants.filter(p => !p.isFounder);
  },

  getParticipant(context: ProjectContext, id: string): Participant | undefined {
    return context.participants.find(p => p.id === id);
  },

  // ============================================
  // LOT QUERIES
  // ============================================

  getLotsByOrigin(context: ProjectContext, origin: 'founder' | 'copro'): Lot[] {
    return context.lots.filter(l => l.origin === origin);
  },

  getAvailableLots(context: ProjectContext): Lot[] {
    return context.lots.filter(l => l.status === 'available');
  },

  getPortageLots(context: ProjectContext): Lot[] {
    return context.lots.filter(l => l.heldForPortage === true && l.status === 'available');
  },

  getHiddenLots(context: ProjectContext): Lot[] {
    return context.lots.filter(l => l.origin === 'copro' && l.status === 'hidden');
  },

  getRevealedCoproLots(context: ProjectContext): Lot[] {
    return context.lots.filter(l => l.origin === 'copro' && l.status !== 'hidden');
  },

  // ============================================
  // SALE TYPE DETECTION
  // ============================================

  getSaleType(context: ProjectContext, lotId: string, sellerId: string): SaleType {
    const lot = context.lots.find(l => l.id === lotId);

    if (!lot) throw new Error('Lot not found');

    if (sellerId === 'copropriete' && lot.origin === 'copro') {
      return 'copro';
    }

    if (lot.heldForPortage) {
      return 'portage';
    }

    return 'classic';
  },

  // ============================================
  // STATE QUERIES
  // ============================================

  canSellPortageLots(context: ProjectContext): boolean {
    return context.acteTranscriptionDate !== null;
  },

  canSellCoproLots(context: ProjectContext): boolean {
    return context.permitEnactedDate !== null &&
           this.getRevealedCoproLots(context).length > 0;
  }
};
```

**Step 4: Run test to verify it passes**

Run: `npm run test src/stateMachine/queries.test.ts`
Expected: PASS (3 tests)

**Step 5: Commit**

```bash
git add src/stateMachine/queries.ts src/stateMachine/queries.test.ts
git commit -m "feat(state-machine): add query functions for participants and lots"
```

---

### Task 10: Add Lot Queries Tests

**Files:**
- Modify: `src/stateMachine/queries.test.ts`

**Step 1: Write tests for lot queries**

Add to `src/stateMachine/queries.test.ts`:

```typescript
describe('Lot Queries', () => {
  let context: ProjectContext;

  beforeEach(() => {
    context = {
      participants: [],
      lots: [
        {
          id: 'lot1',
          origin: 'founder',
          status: 'available',
          ownerId: 'p1',
          surface: 100,
          heldForPortage: true
        },
        {
          id: 'lot2',
          origin: 'copro',
          status: 'hidden',
          ownerId: 'copropriete',
          surface: 50,
          heldForPortage: false
        },
        {
          id: 'lot3',
          origin: 'copro',
          status: 'available',
          ownerId: 'copropriete',
          surface: 75,
          heldForPortage: false
        }
      ],
      salesHistory: [],
      acteTranscriptionDate: new Date(),
      permitEnactedDate: null,
      // ... minimal context
    } as ProjectContext;
  });

  it('should get lots by origin', () => {
    const founderLots = queries.getLotsByOrigin(context, 'founder');
    expect(founderLots).toHaveLength(1);
    expect(founderLots[0].id).toBe('lot1');

    const coproLots = queries.getLotsByOrigin(context, 'copro');
    expect(coproLots).toHaveLength(2);
  });

  it('should get available lots', () => {
    const available = queries.getAvailableLots(context);
    expect(available).toHaveLength(2);
  });

  it('should get portage lots', () => {
    const portage = queries.getPortageLots(context);
    expect(portage).toHaveLength(1);
    expect(portage[0].id).toBe('lot1');
  });

  it('should get hidden lots', () => {
    const hidden = queries.getHiddenLots(context);
    expect(hidden).toHaveLength(1);
    expect(hidden[0].id).toBe('lot2');
  });

  it('should detect sale type correctly', () => {
    expect(queries.getSaleType(context, 'lot1', 'p1')).toBe('portage');
    expect(queries.getSaleType(context, 'lot3', 'copropriete')).toBe('copro');
  });

  it('should check if portage sales are allowed', () => {
    expect(queries.canSellPortageLots(context)).toBe(true);

    context.acteTranscriptionDate = null;
    expect(queries.canSellPortageLots(context)).toBe(false);
  });
});
```

**Step 2: Run test to verify it passes**

Run: `npm run test src/stateMachine/queries.test.ts`
Expected: PASS (9 tests)

**Step 3: Commit**

```bash
git add src/stateMachine/queries.test.ts
git commit -m "test(state-machine): add comprehensive lot query tests"
```

---

## Phase 4: State Machine Core (Week 2, Days 1-3)

### Task 11: Create Basic Machine Structure

**Files:**
- Create: `src/stateMachine/creditCastorMachine.ts`
- Create: `src/stateMachine/creditCastorMachine.test.ts`

**Step 1: Write test for basic machine**

Create: `src/stateMachine/creditCastorMachine.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { createActor } from 'xstate';
import { creditCastorMachine } from './creditCastorMachine';

describe('Credit Castor Machine', () => {
  it('should start in pre_purchase state', () => {
    const actor = createActor(creditCastorMachine);
    actor.start();

    expect(actor.getSnapshot().matches('pre_purchase')).toBe(true);
  });

  it('should transition to compromis_period on COMPROMIS_SIGNED', () => {
    const actor = createActor(creditCastorMachine);
    actor.start();

    actor.send({
      type: 'COMPROMIS_SIGNED',
      compromisDate: new Date('2023-01-01'),
      deposit: 50000
    });

    expect(actor.getSnapshot().matches('compromis_period')).toBe(true);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm run test src/stateMachine/creditCastorMachine.test.ts`
Expected: FAIL - "Cannot find module './creditCastorMachine'"

**Step 3: Create basic machine**

Create: `src/stateMachine/creditCastorMachine.ts`

```typescript
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
      // Will be expanded with parallel states
    },

    ready_for_deed: {},
    deed_registration_pending: {},
    ownership_transferred: {},
    copro_creation: {},
    copro_established: {},
    permit_process: {},
    permit_active: {},
    lots_declared: {},
    sales_active: {},
    completed: { type: 'final' }
  }
});
```

**Step 4: Run test to verify it passes**

Run: `npm run test src/stateMachine/creditCastorMachine.test.ts`
Expected: PASS (2 tests)

**Step 5: Install XState if not already**

Run: `npm install xstate@^5.0.0`

**Step 6: Commit**

```bash
git add src/stateMachine/creditCastorMachine.ts src/stateMachine/creditCastorMachine.test.ts package.json package-lock.json
git commit -m "feat(state-machine): create basic machine structure with pre-purchase state"
```

---

### Task 12: Add Legal Milestone States

**Files:**
- Modify: `src/stateMachine/creditCastorMachine.ts`
- Modify: `src/stateMachine/creditCastorMachine.test.ts`

**Step 1: Write tests for deed flow**

Add to `src/stateMachine/creditCastorMachine.test.ts`:

```typescript
describe('Legal Milestone Flow', () => {
  it('should transition through deed registration', () => {
    const actor = createActor(creditCastorMachine, {
      input: {
        // Provide minimal context to skip compromis
      }
    });
    actor.start();

    // Navigate to ready_for_deed
    actor.send({ type: 'COMPROMIS_SIGNED', compromisDate: new Date(), deposit: 50000 });
    actor.send({ type: 'ALL_CONDITIONS_MET' });

    expect(actor.getSnapshot().matches('ready_for_deed')).toBe(true);

    // Sign deed
    actor.send({ type: 'DEED_SIGNED', deedDate: new Date(), notaryId: 'notary1' });
    expect(actor.getSnapshot().matches('deed_registration_pending')).toBe(true);

    // Register deed
    actor.send({ type: 'DEED_REGISTERED', registrationDate: new Date() });
    expect(actor.getSnapshot().matches('ownership_transferred')).toBe(true);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm run test src/stateMachine/creditCastorMachine.test.ts`
Expected: FAIL - "Expected state to match..."

**Step 3: Implement deed flow states**

Modify `src/stateMachine/creditCastorMachine.ts`:

```typescript
// In actions section, add:
actions: {
  setBankDeadline: assign({ /* ... */ }),

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

// In states section:
states: {
  pre_purchase: { /* ... */ },

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

  // ... rest of states
}
```

**Step 4: Run test to verify it passes**

Run: `npm run test src/stateMachine/creditCastorMachine.test.ts`
Expected: PASS (3 tests)

**Step 5: Commit**

```bash
git add src/stateMachine/creditCastorMachine.ts src/stateMachine/creditCastorMachine.test.ts
git commit -m "feat(state-machine): add deed signing and registration flow"
```

---

## Summary & Next Steps

This implementation plan provides **12 detailed tasks** to get started with the state machine core. Each task follows TDD principles with exact file paths, code snippets, and verification steps.

**Remaining work** (to be added in subsequent iterations):
- Task 13-18: Complete copropriété creation states
- Task 19-24: Implement transaction flows (portage, copro, classic)
- Task 25-30: Add financing flows (individual + ACP loans)
- Task 31-36: Integration testing and calculator connection

**Total estimated time:**
- Phase 1 (Types & Context): 2 days
- Phase 2 (Calculations): 2 days
- Phase 3 (Queries): 1 day
- Phase 4 (Machine Core): 3 days
- **Phases 5-7**: 2 weeks additional

**References:**
- Design doc: `docs/plans/2025-11-03-state-machine-design.md`
- XState docs: https://stately.ai/docs
- Business logic: `docs/analysis/business-logic-validated.md`

**Skills to use during implementation:**
- @superpowers:test-driven-development - Write test first, watch fail, implement, watch pass
- @superpowers:systematic-debugging - If tests fail unexpectedly
- @superpowers:verification-before-completion - Before claiming any task complete

---

**Implementation complete when:**
- [ ] All 36 tasks completed
- [ ] All tests passing (`npm run test`)
- [ ] TypeScript compiles (`npx tsc --noEmit`)
- [ ] State machine visualized (XState inspector)
- [ ] Integrated with existing calculator utils
- [ ] Documentation updated

