# Rent-to-Own (Location-Accession) Design

**Created**: 2025-11-05
**Status**: Design Complete - Ready for Review
**Architecture**: Compositional wrapper around existing sale types
**Framework**: XState v5 compatible

---

## Executive Summary

This document specifies a **rent-to-own (location-accession)** feature for Credit Castor that allows newcomers and current participants to establish a trial period before committing to a full purchase. This reduces risk for both parties while maintaining cohousing values of community fit and fairness.

**Key Features:**
- **Universal availability**: Works with all sale types (portage, copropriété, classic)
- **Equity buildup**: Monthly payments split between rent and equity (configurable)
- **Provisional status**: Trial participants are observers (no voting rights, excluded from quotité)
- **Mutual decision**: Both buyer and community must approve final purchase
- **Flexible duration**: 3-24 months configurable trial period with extension options
- **Pluggable formula**: Like `portageFormula`, communities can evolve the equity/rent split rules

---

## Business Requirements

### Goals

1. **Risk reduction for buyers**: Try before committing to full purchase
2. **Risk reduction for sellers**: Ensure buyer is good community fit
3. **Financial fairness**: Equity buildup compensates buyer for trial commitment
4. **Community integration**: Provisional participants attend meetings as observers
5. **Flexibility**: Configurable durations, payments, and equity splits

### Non-Goals

- Rent-to-own is **not** a financing mechanism (use individual loans for that)
- Rent-to-own is **not** a rental agreement (equity builds toward purchase)
- Does **not** replace buyer approval process (happens at end of trial)

---

## Architecture: Compositional Wrapper (Approach 3)

Rent-to-own **wraps** existing sale types rather than being a distinct sale type.

```
RentToOwnAgreement
    │
    ├─ Underlying Sale (one of):
    │   ├─ PortageSale (cost recovery pricing)
    │   ├─ CoproSale (dynamic pricing)
    │   └─ ClassicSale (market pricing with governance)
    │
    ├─ Trial Configuration
    │   ├─ Duration (3-24 months)
    │   ├─ Monthly payment
    │   └─ Formula (equity/rent split)
    │
    └─ Provisional Participant
        ├─ Observer status (attends meetings)
        ├─ No voting rights
        └─ Excluded from quotité
```

**Why This Approach:**
- ✅ Reuses all existing pricing logic (no duplication)
- ✅ "Rent-to-own portage sale" is clean composition
- ✅ Can convert any sale to rent-to-own mode
- ✅ Scales with actor model (spawn `RentToOwnMachine` per trial)

---

## Data Model

### Core Types

```typescript
// Rent-to-own wraps any existing sale type
interface RentToOwnAgreement {
  id: string;
  underlyingSale: Sale;  // PortageSale | CoproSale | ClassicSale

  // Trial period
  trialStartDate: Date;
  trialEndDate: Date;
  trialDurationMonths: number;  // 3-24 months (configurable bounds)

  // Financial tracking
  monthlyPayment: number;
  totalPaid: number;
  equityAccumulated: number;
  rentPaid: number;

  // Formula plugin (like portageFormula)
  rentToOwnFormula: RentToOwnFormulaParams;

  // Participants
  provisionalBuyer: ProvisionalParticipant;
  seller: string;  // participantId or 'copropriete'

  // Status tracking
  status: 'active' | 'ending_soon' | 'decision_pending' | 'completed' | 'cancelled';
  extensionRequests: ExtensionRequest[];
}

// Provisional participant during trial
interface ProvisionalParticipant extends Participant {
  participantStatus: 'provisional';  // NEW field on base Participant
  rentToOwnAgreementId: string;

  // Rights restrictions
  hasVotingRights: false;
  excludeFromQuotite: true;
  canAttendMeetings: true;  // Observer status
}

// Extension request
interface ExtensionRequest {
  requestDate: Date;
  additionalMonths: number;
  approved: boolean | null;  // null = pending vote
  votingResults?: VotingResults;
}

// Monthly payment breakdown
interface RentToOwnPayment {
  month: Date;
  totalAmount: number;
  equityPortion: number;    // Builds toward purchase
  rentPortion: number;      // Compensates seller for use
  percentToEquity: number;  // From formula (e.g., 50%)
}
```

### Participant Extension

```typescript
// Extend base Participant interface
interface Participant {
  // ... existing fields ...

  participantStatus?: 'provisional' | 'full';  // NEW: Default 'full'
  hasVotingRights?: boolean;  // NEW: Default true
  excludeFromQuotite?: boolean;  // NEW: Default false
  canAttendMeetings?: boolean;  // NEW: Default true
  rentToOwnAgreementId?: string;  // NEW: Link to agreement if provisional
}
```

---

## Pluggable Formula System

### Formula Interface

```typescript
interface RentToOwnFormulaParams {
  version: 'v1';  // For future evolution

  // Equity/rent split configuration
  equityPercentage: number;  // 0-100, e.g., 50 = 50% to equity
  rentPercentage: number;    // Must sum to 100 with equityPercentage

  // Duration bounds
  minTrialMonths: number;    // Default: 3
  maxTrialMonths: number;    // Default: 24

  // Termination rules
  equityForfeitureOnBuyerExit: number;  // 0-100, e.g., 100 = loses all equity
  equityReturnOnCommunityReject: number; // 0-100, e.g., 100 = gets all equity back

  // Extension rules
  allowExtensions: boolean;
  maxExtensions?: number;
  extensionIncrementMonths?: number;  // e.g., 6 months per extension
}

// Default formula (conservative start)
const DEFAULT_RENT_TO_OWN_FORMULA: RentToOwnFormulaParams = {
  version: 'v1',

  equityPercentage: 50,  // 50/50 split
  rentPercentage: 50,

  minTrialMonths: 3,
  maxTrialMonths: 24,

  equityForfeitureOnBuyerExit: 100,  // Buyer walks = loses all equity
  equityReturnOnCommunityReject: 100, // Community rejects = full refund

  allowExtensions: true,
  maxExtensions: 2,
  extensionIncrementMonths: 6
};
```

### Calculation Functions

```typescript
// Calculate monthly payment breakdown
function calculateRentToOwnPayment(
  agreement: RentToOwnAgreement,
  month: Date
): RentToOwnPayment {
  const { monthlyPayment, rentToOwnFormula } = agreement;
  const { equityPercentage, rentPercentage } = rentToOwnFormula;

  const equityPortion = monthlyPayment * (equityPercentage / 100);
  const rentPortion = monthlyPayment * (rentPercentage / 100);

  return {
    month,
    totalAmount: monthlyPayment,
    equityPortion,
    rentPortion,
    percentToEquity: equityPercentage
  };
}

// Calculate accumulated equity over time
function calculateAccumulatedEquity(
  agreement: RentToOwnAgreement,
  asOfDate: Date = new Date()
): number {
  const monthsElapsed = Math.floor(
    (asOfDate.getTime() - agreement.trialStartDate.getTime()) / (1000 * 60 * 60 * 24 * 30.44)
  );

  const paymentsCount = Math.min(monthsElapsed, agreement.trialDurationMonths);
  const equityPerMonth = agreement.monthlyPayment * (agreement.rentToOwnFormula.equityPercentage / 100);

  return paymentsCount * equityPerMonth;
}

// Calculate final purchase price (sale price - equity)
function calculateFinalPurchasePrice(agreement: RentToOwnAgreement): number {
  const salePrice = agreement.underlyingSale.totalPrice;  // From portage/copro/classic pricing
  const equity = agreement.equityAccumulated;

  return Math.max(0, salePrice - equity);
}
```

---

## State Machine Integration

### Main Machine Changes

```typescript
// Add to ProjectContext
interface ProjectContext {
  // ... existing fields ...

  rentToOwnAgreements: Map<string, RentToOwnAgreement>;  // Track active trials
  rentToOwnFormula: RentToOwnFormulaParams;  // Global default formula
}

// Add to ProjectEvents
type ProjectEvents =
  // ... existing events ...
  | { type: 'INITIATE_RENT_TO_OWN'; saleType: SaleType; lotId: string; buyerId: string; durationMonths: number }
  | { type: 'RECORD_RENT_TO_OWN_PAYMENT'; agreementId: string; amount: number; date: Date }
  | { type: 'BUYER_REQUEST_PURCHASE'; agreementId: string }
  | { type: 'BUYER_DECLINE_PURCHASE'; agreementId: string }
  | { type: 'REQUEST_TRIAL_EXTENSION'; agreementId: string; additionalMonths: number }
  | { type: 'END_RENT_TO_OWN'; agreementId: string; reason: 'completed' | 'cancelled' | 'community_rejected' };
```

### RentToOwnMachine (Spawned Actor)

```typescript
const rentToOwnMachine = setup({
  types: {} as {
    context: RentToOwnAgreement;
    events: RentToOwnEvents;
  },

  guards: {
    isTrialEnding: ({ context }) => {
      const daysRemaining = (context.trialEndDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
      return daysRemaining <= 30;  // Last month
    },

    canExtend: ({ context }) => {
      if (!context.rentToOwnFormula.allowExtensions) return false;
      const maxExtensions = context.rentToOwnFormula.maxExtensions || 0;
      return context.extensionRequests.filter(e => e.approved).length < maxExtensions;
    },

    withinDurationBounds: ({ context }, params: { months: number }) => {
      const { minTrialMonths, maxTrialMonths } = context.rentToOwnFormula;
      return params.months >= minTrialMonths && params.months <= maxTrialMonths;
    }
  },

  actions: {
    recordPayment: assign({
      totalPaid: ({ context, event }) => context.totalPaid + event.amount,
      equityAccumulated: ({ context, event }) => {
        const payment = calculateRentToOwnPayment(context, event.date);
        return context.equityAccumulated + payment.equityPortion;
      },
      rentPaid: ({ context, event }) => {
        const payment = calculateRentToOwnPayment(context, event.date);
        return context.rentPaid + payment.rentPortion;
      }
    }),

    markProvisionalBuyer: assign({
      provisionalBuyer: ({ context, event }) => ({
        ...event.buyerData,
        participantStatus: 'provisional',
        hasVotingRights: false,
        excludeFromQuotite: true,
        canAttendMeetings: true,
        rentToOwnAgreementId: context.id
      })
    })
  }

}).createMachine({
  id: 'rentToOwn',
  initial: 'trial_active',

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
      // Uses existing voting system (like classic resale)
      on: {
        VOTE_APPROVED: 'purchase_finalization',
        VOTE_REJECTED: 'community_rejected'
      }
    },

    extension_vote: {
      on: {
        EXTENSION_APPROVED: {
          target: 'trial_active',
          actions: assign({
            trialEndDate: ({ context, event }) => {
              const increment = context.rentToOwnFormula.extensionIncrementMonths || 6;
              const newDate = new Date(context.trialEndDate);
              newDate.setMonth(newDate.getMonth() + increment);
              return newDate;
            },
            trialDurationMonths: ({ context }) =>
              context.trialDurationMonths + (context.rentToOwnFormula.extensionIncrementMonths || 6)
          })
        },
        EXTENSION_REJECTED: 'trial_ending'  // Must decide
      }
    },

    purchase_finalization: {
      invoke: {
        src: 'finalizePurchase',
        input: ({ context }) => ({
          underlyingSale: context.underlyingSale,
          equityToApply: context.equityAccumulated,
          buyer: context.provisionalBuyer
        }),
        onDone: {
          target: 'completed',
          actions: [
            'convertProvisionalToFullParticipant',
            'recordSaleCompletion'
          ]
        },
        onError: 'error'
      }
    },

    buyer_declined: {
      type: 'final',
      entry: [
        'forfeitEquity',  // Equity lost per formula
        'removeProvisionalBuyer',
        'notifyParticipants'
      ]
    },

    community_rejected: {
      type: 'final',
      entry: [
        'returnEquity',  // Full equity refund per formula
        'removeProvisionalBuyer',
        'notifyParticipants'
      ]
    },

    completed: {
      type: 'final',
      entry: 'recordSuccessfulTransition'
    },

    error: {
      type: 'final'
    }
  }
});
```

### State Diagram

```
TRIAL_ACTIVE
    │
    │ (monthly payments recorded)
    │ RECORD_PAYMENT → accumulate equity
    │
    │ (auto-transition when 30 days remain)
    ▼
TRIAL_ENDING
    │
    ├─ BUYER_REQUEST_PURCHASE → COMMUNITY_VOTE
    │                                ├─ APPROVED → PURCHASE_FINALIZATION
    │                                │                  ├─ onDone → COMPLETED
    │                                │                  └─ onError → ERROR
    │                                │
    │                                └─ REJECTED → COMMUNITY_REJECTED (final)
    │
    ├─ BUYER_DECLINE_PURCHASE → BUYER_DECLINED (final)
    │
    └─ REQUEST_EXTENSION → EXTENSION_VOTE
                               ├─ APPROVED → TRIAL_ACTIVE (extended)
                               └─ REJECTED → TRIAL_ENDING (must decide)
```

---

## Composition with Existing Sale Types

### Example 1: Rent-to-Own Portage Sale

```typescript
// Scenario: Annabelle/Colin selling Lot 2 to newcomer via rent-to-own
const rentToOwnPortageSale: RentToOwnAgreement = {
  id: 'rto-001',

  // Underlying portage sale (reuses all existing portage pricing)
  underlyingSale: {
    type: 'portage',
    lotId: 2,
    seller: 'Annabelle/Colin',

    pricing: {
      baseAcquisitionCost: 233175,
      indexation: 6212,  // 2% × 1.33 years
      carryingCosts: {
        totalMonths: 16,
        monthlyLoanInterest: 800,
        propertyTax: 32.36,
        buildingInsurance: 13.33,
        total: 17103
      },
      totalPrice: 256490  // Total portage price
    }
  },

  // Rent-to-own wrapper
  trialStartDate: new Date('2027-06-01'),
  trialEndDate: new Date('2028-06-01'),  // 12 months trial
  trialDurationMonths: 12,

  monthlyPayment: 1500,  // Negotiated by parties
  totalPaid: 0,
  equityAccumulated: 0,
  rentPaid: 0,

  rentToOwnFormula: DEFAULT_RENT_TO_OWN_FORMULA,  // 50/50 split

  provisionalBuyer: {
    name: 'Nouveau·elle Arrivant·e',
    participantStatus: 'provisional',
    hasVotingRights: false,
    excludeFromQuotite: true,
    canAttendMeetings: true,
    // ... other participant fields
  },

  seller: 'Annabelle/Colin',
  status: 'active'
};

// After 12 months:
// - Total paid: €18,000 (12 × €1,500)
// - Equity accumulated: €9,000 (50% of €18,000)
// - Rent paid to Annabelle/Colin: €9,000 (50% of €18,000)
// - Final purchase price: €256,490 - €9,000 = €247,490
```

### Example 2: Rent-to-Own Copropriété Sale

```typescript
// Scenario: ACP selling hidden lot to newcomer via rent-to-own
const rentToOwnCoproSale: RentToOwnAgreement = {
  id: 'rto-002',

  // Underlying copro sale (reuses dynamic pricing)
  underlyingSale: {
    type: 'copro',
    lotId: 'copro-hidden-1',
    seller: 'copropriete',

    pricing: {
      baseCostPerSqm: 2500,  // Actual costs incurred
      gen1CompensationPerSqm: 250,  // 10% premium (decreases over time)
      pricePerSqm: 2750,
      surface: 60,  // Buyer chooses surface
      totalPrice: 165000  // 60m² × €2,750
    }
  },

  trialStartDate: new Date('2028-01-01'),
  trialEndDate: new Date('2028-07-01'),  // 6 months trial
  trialDurationMonths: 6,

  monthlyPayment: 2000,

  // ... rest same as above
};

// After 6 months:
// - Total paid: €12,000 (6 × €2,000)
// - Equity: €6,000
// - Rent (distributed to all co-owners by quotité): €6,000
// - Final price: €165,000 - €6,000 = €159,000
```

### Example 3: Rent-to-Own Classic Resale

```typescript
// Scenario: Dave leaving project, selling to newcomer via rent-to-own
const rentToOwnClassicSale: RentToOwnAgreement = {
  id: 'rto-003',

  // Underlying classic sale (with governance)
  underlyingSale: {
    type: 'classic',
    lotId: 5,
    seller: 'Dave',

    price: 180000,  // Market price (subject to cap)
    priceCap: 185000,  // Original cost + indexation

    buyerApproval: {
      candidateId: 'new-buyer-123',
      interviewDate: new Date('2029-03-15'),
      approved: null,  // Pending during rent-to-own trial
      notes: 'Trial period serves as extended interview'
    }
  },

  trialStartDate: new Date('2029-04-01'),
  trialEndDate: new Date('2030-04-01'),  // 12 months
  trialDurationMonths: 12,

  monthlyPayment: 1200,

  // ... rest same
};

// Key difference: Buyer approval happens at END of trial
// Community votes on whether newcomer is good fit after living together
```

---

## Query Functions

Add to existing query layer (`src/stateMachine/queries.ts`):

```typescript
const rentToOwnQueries = {
  // Active agreements
  getActiveRentToOwnAgreements: (context: ProjectContext): RentToOwnAgreement[] => {
    return Array.from(context.rentToOwnAgreements.values())
      .filter(a => a.status === 'active' || a.status === 'ending_soon');
  },

  // Provisional participants
  getProvisionalParticipants: (context: ProjectContext): ProvisionalParticipant[] => {
    return context.participants.filter(p => p.participantStatus === 'provisional');
  },

  // Exclude provisionals from quotité calculations
  getVotingParticipants: (context: ProjectContext): Participant[] => {
    return context.participants.filter(p =>
      p.participantStatus !== 'provisional' && p.hasVotingRights !== false
    );
  },

  // Financial queries
  getRentToOwnEquityForBuyer: (context: ProjectContext, buyerId: string): number => {
    const agreement = Array.from(context.rentToOwnAgreements.values())
      .find(a => a.provisionalBuyer.id === buyerId);

    return agreement ? agreement.equityAccumulated : 0;
  },

  // Deadline warnings
  getRentToOwnDeadlines: (context: ProjectContext): Warning[] => {
    const warnings: Warning[] = [];

    context.rentToOwnAgreements.forEach(agreement => {
      const daysRemaining = Math.floor(
        (agreement.trialEndDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );

      if (daysRemaining <= 30 && daysRemaining > 0) {
        warnings.push({
          type: 'rent_to_own_ending',
          severity: daysRemaining <= 7 ? 'critical' : 'warning',
          message: `Rent-to-own trial for ${agreement.provisionalBuyer.name} ends in ${daysRemaining} days`,
          agreementId: agreement.id
        });
      }
    });

    return warnings;
  }
};
```

---

## UI Integration Points

### 1. Sale Initiation (Add rent-to-own option)

```tsx
// In AvailableLotsView or sale initiation UI
<button onClick={() => initiateSale('direct')}>
  Achat Direct
</button>
<button onClick={() => initiateSale('rent-to-own')}>
  Location-Accession (Essai)
</button>

// Modal for rent-to-own setup
interface RentToOwnSetupModal {
  saleType: 'portage' | 'copro' | 'classic';
  lotId: string;
  basePrice: number;  // From underlying sale calculation

  // User configures:
  trialDurationMonths: number;  // Slider: 3-24 months
  monthlyPayment: number;  // Input field

  // Show preview:
  equityAfterTrial: number;  // monthlyPayment × duration × equityPercentage
  finalPurchasePrice: number;  // basePrice - equityAfterTrial
}
```

### 2. Participant List (Show provisional status)

```tsx
// In EnDivisionCorrect participant breakdown
{participants.map(p => (
  <div className={p.participantStatus === 'provisional' ? 'provisional-participant' : ''}>
    <h3>
      {p.name}
      {p.participantStatus === 'provisional' && (
        <span className="badge">En Essai</span>
      )}
    </h3>

    {p.participantStatus === 'provisional' && (
      <div className="trial-status">
        <p>📅 Fin d'essai: {formatDate(getRentToOwnAgreement(p).trialEndDate)}</p>
        <p>💰 Équité accumulée: €{p.rentToOwnEquity.toLocaleString()}</p>
        <p>🏠 Loue de: {getRentToOwnAgreement(p).seller}</p>
      </div>
    )}
  </div>
))}
```

### 3. Voting UI (Exclude provisionals)

```tsx
// When displaying voters for ACP loan or governance decision
const eligibleVoters = queries.getVotingParticipants(context);
// Provisionals are excluded automatically

// But show them as observers
<div className="voting-panel">
  <h3>Votants ({eligibleVoters.length})</h3>
  {eligibleVoters.map(renderVoter)}

  <h3>Observateurs</h3>
  {provisionalParticipants.map(p => (
    <div className="observer">
      {p.name} (En période d'essai)
    </div>
  ))}
</div>
```

---

## Testing Strategy

### Unit Tests

```typescript
describe('RentToOwnFormula', () => {
  it('should split payment 50/50 with default formula', () => {
    const payment = calculateRentToOwnPayment(agreement, new Date());
    expect(payment.equityPortion).toBe(750);  // 50% of €1500
    expect(payment.rentPortion).toBe(750);
  });

  it('should accumulate equity over time', () => {
    const equity = calculateAccumulatedEquity(agreementAfter6Months);
    expect(equity).toBe(4500);  // 6 × €750
  });

  it('should reduce final price by accumulated equity', () => {
    const final = calculateFinalPurchasePrice(agreement);
    expect(final).toBe(247490);  // €256,490 - €9,000
  });
});

describe('RentToOwnMachine', () => {
  it('should transition to trial_ending when 30 days remain', () => {
    const state = rentToOwnMachine.transition('trial_active', { type: 'CHECK_DEADLINE' });
    expect(state.matches('trial_ending')).toBe(true);
  });

  it('should forfeit equity when buyer declines', () => {
    const state = rentToOwnMachine.transition('trial_ending', {
      type: 'BUYER_DECLINE_PURCHASE'
    });
    expect(state.matches('buyer_declined')).toBe(true);
    expect(state.context.equityForfeited).toBe(9000);
  });

  it('should return equity when community rejects', () => {
    const state = rentToOwnMachine.transition('community_vote', {
      type: 'VOTE_REJECTED'
    });
    expect(state.matches('community_rejected')).toBe(true);
    expect(state.context.equityReturned).toBe(9000);
  });
});
```

### Integration Tests

```typescript
describe('Rent-to-Own + Portage Sale', () => {
  it('should compose portage pricing with rent-to-own equity', () => {
    const portagePrice = calculatePortagePrice(lot, saleDate);
    const rtoAgreement = createRentToOwnAgreement(portagePrice, 12);

    expect(rtoAgreement.underlyingSale.pricing.totalPrice).toBe(256490);
    expect(calculateFinalPurchasePrice(rtoAgreement)).toBe(247490);
  });
});

describe('Provisional Participant Exclusion', () => {
  it('should exclude provisionals from quotité calculations', () => {
    const context = {
      participants: [
        { name: 'Alice', quotite: 0.3, participantStatus: 'full' },
        { name: 'Bob', quotite: 0.3, participantStatus: 'full' },
        { name: 'Provisional', quotite: 0, participantStatus: 'provisional' }
      ]
    };

    const voters = queries.getVotingParticipants(context);
    expect(voters).toHaveLength(2);
    expect(voters.map(p => p.name)).toEqual(['Alice', 'Bob']);
  });
});
```

---

## Implementation Guidance

### Phase 1: Core Types & Formula (Week 1)

**Day 1-2: Type Definitions**
- [ ] Add rent-to-own types to `src/utils/calculatorUtils.ts`
- [ ] Extend `Participant` interface with provisional fields
- [ ] Create `RentToOwnFormulaParams` interface
- [ ] Add `DEFAULT_RENT_TO_OWN_FORMULA` constant

**Day 3-4: Calculation Functions**
- [ ] Implement `calculateRentToOwnPayment()`
- [ ] Implement `calculateAccumulatedEquity()`
- [ ] Implement `calculateFinalPurchasePrice()`
- [ ] Write unit tests for all calculations

**Day 5: Storage Integration**
- [ ] Add `rentToOwnFormula` to localStorage
- [ ] Add migration for existing data
- [ ] Update `DEFAULT_PARTICIPANTS` if needed

### Phase 2: State Machine (Week 2)

**Day 1-3: RentToOwnMachine**
- [ ] Create `src/stateMachine/rentToOwnMachine.ts`
- [ ] Implement all states and transitions
- [ ] Add guards (isTrialEnding, canExtend, withinDurationBounds)
- [ ] Add actions (recordPayment, markProvisionalBuyer)
- [ ] Write state transition tests

**Day 4-5: Main Machine Integration**
- [ ] Add `rentToOwnAgreements` to ProjectContext
- [ ] Add rent-to-own events to ProjectEvents
- [ ] Implement spawning logic
- [ ] Test parent-child communication

### Phase 3: Query Functions & UI (Week 3)

**Day 1-2: Query Layer**
- [ ] Add rent-to-own queries to `src/stateMachine/queries.ts`
- [ ] Update existing quotité queries to exclude provisionals
- [ ] Add deadline warning queries
- [ ] Write query tests

**Day 3-5: UI Components**
- [ ] Add rent-to-own option to sale initiation UI
- [ ] Create `RentToOwnSetupModal` component
- [ ] Update participant list to show provisional status
- [ ] Update voting UI to show observers
- [ ] Add trial deadline warnings to UI

### Phase 4: End-to-End Testing (Week 4)

**Day 1-3: Integration Tests**
- [ ] Test rent-to-own + portage sale
- [ ] Test rent-to-own + copro sale
- [ ] Test rent-to-own + classic sale
- [ ] Test extension flow
- [ ] Test buyer decline flow
- [ ] Test community rejection flow

**Day 4-5: Documentation & Polish**
- [ ] Generate state diagram from machine
- [ ] Update user guide with rent-to-own examples
- [ ] Add formula configuration UI
- [ ] Test with real project data

---

## Migration Strategy

### Existing Data Compatibility

**No breaking changes** - rent-to-own is additive:

```typescript
// storage.ts migration
function migrateRentToOwnFields(stored: any) {
  return {
    ...stored,
    rentToOwnAgreements: stored.rentToOwnAgreements || new Map(),
    rentToOwnFormula: stored.rentToOwnFormula || DEFAULT_RENT_TO_OWN_FORMULA,
    participants: stored.participants.map(p => ({
      ...p,
      participantStatus: p.participantStatus || 'full',
      hasVotingRights: p.hasVotingRights !== undefined ? p.hasVotingRights : true,
      excludeFromQuotite: p.excludeFromQuotite || false,
      canAttendMeetings: p.canAttendMeetings !== undefined ? p.canAttendMeetings : true
    }))
  };
}
```

### Feature Flags (Optional)

If you want to roll out gradually:

```typescript
interface ProjectParams {
  // ... existing fields ...
  enableRentToOwn?: boolean;  // Default: false initially
}

// In UI
{projectParams.enableRentToOwn && (
  <button onClick={() => initiateSale('rent-to-own')}>
    Location-Accession (Essai)
  </button>
)}
```

---

## Next Steps

### Immediate (Today)

1. ✅ Review this design document for accuracy
2. [ ] Update state machine design doc with rent-to-own section
3. [ ] Commit both docs to git

### Short-Term (This Week)

1. [ ] Create implementation plan using `/superpowers:write-plan`
2. [ ] Set up git worktree for feature development
3. [ ] Implement Phase 1 (core types & formula)

### Medium-Term (Next 3 Weeks)

1. [ ] Implement Phase 2 (state machine)
2. [ ] Implement Phase 3 (query functions & UI)
3. [ ] Implement Phase 4 (end-to-end testing)

### Long-Term (Future)

1. [ ] Gather feedback from real rent-to-own trials
2. [ ] Evolve formula based on community experience
3. [ ] Consider adding rent-to-own to timeline visualization
4. [ ] Add analytics dashboard for equity tracking

---

## References

### Design Documents
- [State Machine Design](./2025-11-03-state-machine-design.md) - Main state machine architecture
- [Business Logic Validated](../analysis/business-logic-validated.md) - Business requirements

### XState Documentation
- [Guards](https://stately.ai/docs/guards) - Best practices for guards
- [Actions](https://stately.ai/docs/actions) - Best practices for actions
- [Spawning Actors](https://stately.ai/docs/spawn) - Actor model patterns

### Related Concepts
- Location-accession (French legal concept for progressive property acquisition)
- Lease-purchase agreements in real estate
- Equity buildup in rent-to-own arrangements

---

**End of Design Document**

*This design extends the Credit Castor state machine with rent-to-own capability while maintaining compositional architecture and pluggable business rules.*
