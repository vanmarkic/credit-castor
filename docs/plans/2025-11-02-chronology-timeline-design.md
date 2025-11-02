# Chronology & Timeline Design (Event-Sourced Architecture)
**Date:** 2025-11-02
**Status:** Design Complete, Ready for Implementation

## Executive Summary

This design introduces **temporal modeling** to Credit Castor using an **event-sourced architecture**. The system records all changes as immutable events (NEWCOMER_JOINS, HIDDEN_LOT_REVEALED, etc.) and derives the current state by replaying these events.

**Why Event Sourcing?**
- **Domain Clarity**: Events speak the language of Belgian co-ownership law
- **Portability**: Event log is framework-agnostic, can be exported to notaries/consultants
- **Auditability**: Complete history of all transactions for legal compliance
- **Flexibility**: Phases are computed views, not hardcoded structures

**Key Goals:**
1. Show each buyer's cash flow across time (monthly costs + one-time events)
2. Calculate fair resale prices using habitat-beaver portage formulas
3. Model both individual portage (Buyer B carries lot) and collective portage (copropriété carries lot)
4. Treat newcomers as first-class participants (no special types)
5. Make business logic portable and testable

**User Experience:** Draggable timeline with real-time cost previews, powered by event replay underneath.

---

## Architecture Philosophy

### Separation of Concerns

```
┌─────────────────────────────────────────────────────┐
│ DOMAIN LAYER (Pure, Portable)                       │
│ • Event definitions                                  │
│ • Event reducers (pure functions)                   │
│ • Business logic calculations                       │
│ • NO UI, NO frameworks, NO I/O                      │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│ APPLICATION LAYER (React-specific)                  │
│ • State management                                   │
│ • Event dispatching                                  │
│ • Computed projections (memoized)                   │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│ UI LAYER (Components)                                │
│ • Timeline visualization                             │
│ • Participant cards                                  │
│ • Event creation forms                               │
└─────────────────────────────────────────────────────┘
```

### Event Sourcing Principles

1. **Events = Source of Truth**: All state changes recorded as events
2. **Projections = Views**: Phases, cash flows computed by replaying events
3. **Immutability**: Events never change, only append new ones
4. **Causality**: Every state change has an explicit cause (the event)

---

## Domain Model

### Event Types

Events represent **what happened** in the domain, using business language.

```typescript
// Base event structure
interface TimelineEvent {
  id: string;
  type: string;
  date: Date;
  metadata?: {
    createdAt: Date;
    createdBy?: string;
    notes?: string;
  };
}

// ============================================
// Core Events
// ============================================

interface InitialPurchaseEvent extends TimelineEvent {
  type: 'INITIAL_PURCHASE';
  participants: ParticipantDetails[];
  projectParams: ProjectParams;
  copropropriete: CoproEntitySetup;
  // Snapshot of initial conditions
}

interface NewcomerJoinsEvent extends TimelineEvent {
  type: 'NEWCOMER_JOINS';
  buyer: ParticipantDetails;
  acquisition: {
    from: string; // Participant name who sold
    lotId: number;
    purchasePrice: number;
    breakdown: {
      basePrice: number;
      indexation: number;
      carryingCostRecovery: number;
      feesRecovery: number;
      renovations: number;
    };
  };
  notaryFees: number;
  financing: {
    capitalApporte: number;
    loanAmount: number;
    interestRate: number;
    durationYears: number;
  };
}

interface HiddenLotRevealedEvent extends TimelineEvent {
  type: 'HIDDEN_LOT_REVEALED';
  buyer: ParticipantDetails;
  lotId: number;
  salePrice: number;
  redistribution: {
    [participantName: string]: {
      quotite: number; // Percentage (0-1)
      amount: number;
    };
  };
  notaryFees: number;
}

interface PortageSettlementEvent extends TimelineEvent {
  type: 'PORTAGE_SETTLEMENT';
  seller: string; // Who carried the lot
  buyer: string; // Who bought it
  lotId: number;
  carryingPeriodMonths: number;
  carryingCosts: {
    monthlyInterest: number;
    monthlyTax: number;
    monthlyInsurance: number;
    totalCarried: number;
  };
  saleProceeds: number;
  netPosition: number; // proceeds - total carrying costs
}

interface CoproTakesLoanEvent extends TimelineEvent {
  type: 'COPRO_TAKES_LOAN';
  loanAmount: number;
  purpose: string; // "Common renovations", "Hidden lot purchase", etc.
  interestRate: number;
  durationYears: number;
  monthlyPayment: number;
}

interface ParticipantExitsEvent extends TimelineEvent {
  type: 'PARTICIPANT_EXITS';
  participant: string;
  lotId: number;
  buyerType: 'NEWCOMER' | 'EXISTING_PARTICIPANT' | 'COPRO';
  buyerName?: string;
  salePrice: number;
}

// Union type for all events
type DomainEvent =
  | InitialPurchaseEvent
  | NewcomerJoinsEvent
  | HiddenLotRevealedEvent
  | PortageSettlementEvent
  | CoproTakesLoanEvent
  | ParticipantExitsEvent;
```

### Projections (Computed Views)

Projections are **derived from events**, not stored. They're recomputed on demand (with memoization for performance).

```typescript
// A Phase is a projection of state at a point in time
interface PhaseProjection {
  phaseNumber: number; // 0, 1, 2, ...
  startDate: Date;
  endDate?: Date; // null for ongoing phase
  durationMonths?: number;

  // Derived from events up to this point
  participants: Participant[]; // Uses existing interface
  copropropriete: CoproEntity;

  // Snapshot calculations (reuse existing calculateAll)
  snapshot: CalculationResults;

  // NEW: Cash flow perspective
  participantCashFlows: Map<string, ParticipantCashFlow>;
  coproproprieteCashFlow: CoproCashFlow;

  // Metadata
  triggeringEvent?: DomainEvent; // Event that started this phase
}

// Timeline is the complete event log + projections
interface Timeline {
  // Source of truth
  events: DomainEvent[];

  // Metadata
  createdAt: Date;
  lastModifiedAt: Date;
  version: number; // For migrations

  // Computed (memoized)
  phases?: PhaseProjection[]; // Lazy-computed
}
```

### Participant Continuity

**Key Principle:** Newcomers use the same `Participant` interface as initial buyers. No special types.

```typescript
// Phase 0 (after INITIAL_PURCHASE event)
phases[0].participants = [
  { name: 'Buyer A', surface: 112, quantity: 1, ... },
  { name: 'Buyer B', surface: 134, quantity: 2, ... }, // Carrying 2 lots
];

// Phase 1 (after NEWCOMER_JOINS event)
phases[1].participants = [
  { name: 'Buyer A', surface: 112, quantity: 1, ... }, // Unchanged
  { name: 'Buyer B', surface: 134, quantity: 1, ... }, // Now 1 lot
  { name: 'Emma', surface: 134, quantity: 1, ... }     // NEW, but same type!
];

// Phase 2 (Emma can now carry lots too!)
phases[2].participants = [
  { name: 'Buyer A', surface: 112, quantity: 1, ... },
  { name: 'Buyer B', surface: 134, quantity: 1, ... },
  { name: 'Emma', surface: 134, quantity: 2, ... }     // Emma carrying!
];
```

---

## Business Logic (Event Reducers)

Event reducers are **pure functions** that apply events to state. They live in `src/utils/chronologyCalculations.ts`.

```typescript
// ============================================
// Projection State (accumulator for reducer)
// ============================================

interface ProjectionState {
  currentDate: Date;
  participants: Participant[];
  copropropriete: CoproEntity;
  projectParams: ProjectParams;
  scenario: Scenario;

  // Transaction history for cash flow tracking
  transactionHistory: Transaction[];
}

// ============================================
// Main Reducer
// ============================================

export function applyEvent(
  state: ProjectionState,
  event: DomainEvent
): ProjectionState {
  switch (event.type) {
    case 'INITIAL_PURCHASE':
      return applyInitialPurchase(state, event);

    case 'NEWCOMER_JOINS':
      return applyNewcomerJoins(state, event);

    case 'HIDDEN_LOT_REVEALED':
      return applyHiddenLotRevealed(state, event);

    case 'PORTAGE_SETTLEMENT':
      return applyPortageSettlement(state, event);

    case 'COPRO_TAKES_LOAN':
      return applyCoproTakesLoan(state, event);

    case 'PARTICIPANT_EXITS':
      return applyParticipantExit(state, event);

    default:
      // Exhaustive check (TypeScript will error if case missed)
      const _exhaustive: never = event;
      return state;
  }
}

// ============================================
// Individual Event Handlers (Pure Functions)
// ============================================

function applyInitialPurchase(
  state: ProjectionState,
  event: InitialPurchaseEvent
): ProjectionState {
  return {
    ...state,
    currentDate: event.date,
    participants: event.participants.map(p => ({
      ...p,
      // Convert ParticipantDetails to full Participant
    })),
    copropropriete: {
      name: event.copropropriete.name,
      lotsOwned: event.copropropriete.hiddenLots || [],
      cashReserve: 0,
      loans: [],
      monthlyObligations: calculateInitialObligations(event.projectParams)
    },
    projectParams: event.projectParams,
    transactionHistory: []
  };
}

function applyNewcomerJoins(
  state: ProjectionState,
  event: NewcomerJoinsEvent
): ProjectionState {
  // 1. Add newcomer as full participant
  const newcomerParticipant: Participant = {
    name: event.buyer.name,
    surface: event.buyer.surface,
    unitId: event.acquisition.lotId,
    quantity: 1,
    capitalApporte: event.financing.capitalApporte,
    notaryFeesRate: event.buyer.notaryFeesRate,
    interestRate: event.financing.interestRate,
    durationYears: event.financing.durationYears,
    parachevementsPerM2: event.buyer.parachevementsPerM2
  };

  // 2. Reduce seller's lot count
  const updatedParticipants = state.participants.map(p => {
    if (p.name === event.acquisition.from && p.quantity > 1) {
      return { ...p, quantity: p.quantity - 1 };
    }
    return p;
  });

  // 3. Add newcomer
  updatedParticipants.push(newcomerParticipant);

  // 4. Record transactions
  const transactions: Transaction[] = [
    {
      type: 'LOT_SALE',
      from: event.acquisition.from,
      to: event.buyer.name,
      amount: event.acquisition.purchasePrice,
      date: event.date,
      breakdown: event.acquisition.breakdown
    },
    {
      type: 'NOTARY_FEES',
      from: event.buyer.name,
      to: 'NOTARY',
      amount: event.notaryFees,
      date: event.date
    }
  ];

  return {
    ...state,
    currentDate: event.date,
    participants: updatedParticipants,
    transactionHistory: [...state.transactionHistory, ...transactions]
  };
}

function applyHiddenLotRevealed(
  state: ProjectionState,
  event: HiddenLotRevealedEvent
): ProjectionState {
  // 1. Add buyer as participant
  const newParticipant: Participant = {
    name: event.buyer.name,
    surface: event.buyer.surface,
    unitId: event.lotId,
    quantity: 1,
    capitalApporte: event.buyer.capitalApporte,
    notaryFeesRate: event.buyer.notaryFeesRate,
    interestRate: event.buyer.interestRate,
    durationYears: event.buyer.durationYears,
    parachevementsPerM2: event.buyer.parachevementsPerM2
  };

  // 2. Remove lot from copro
  const updatedCopro = {
    ...state.copropropriete,
    lotsOwned: state.copropropriete.lotsOwned.filter(id => id !== event.lotId),
    cashReserve: state.copropropriete.cashReserve + event.salePrice
  };

  // 3. Record redistribution transactions
  const redistributionTxs = Object.entries(event.redistribution).map(
    ([participantName, distribution]) => ({
      type: 'REDISTRIBUTION' as const,
      from: 'COPRO',
      to: participantName,
      amount: distribution.amount,
      date: event.date,
      metadata: { quotite: distribution.quotite }
    })
  );

  // 4. Update copro cash reserve after redistribution
  const totalRedistributed = Object.values(event.redistribution)
    .reduce((sum, dist) => sum + dist.amount, 0);
  updatedCopro.cashReserve -= totalRedistributed;

  return {
    ...state,
    currentDate: event.date,
    participants: [...state.participants, newParticipant],
    copropropriete: updatedCopro,
    transactionHistory: [
      ...state.transactionHistory,
      {
        type: 'LOT_SALE',
        from: 'COPRO',
        to: event.buyer.name,
        amount: event.salePrice,
        date: event.date
      },
      ...redistributionTxs
    ]
  };
}

// ... other event handlers follow same pattern
```

### Event Replay (Main Projection Function)

```typescript
/**
 * Project timeline events into phase views
 * This is the core function that computes state from events
 */
export function projectTimeline(
  events: DomainEvent[],
  unitDetails: UnitDetails
): PhaseProjection[] {
  if (events.length === 0) {
    return [];
  }

  // Find initial purchase event
  const initialEvent = events.find(e => e.type === 'INITIAL_PURCHASE');
  if (!initialEvent || initialEvent.type !== 'INITIAL_PURCHASE') {
    throw new Error('Timeline must start with INITIAL_PURCHASE event');
  }

  // Initialize state
  let state: ProjectionState = {
    currentDate: initialEvent.date,
    participants: [],
    copropropriete: { name: '', lotsOwned: [], cashReserve: 0, loans: [], monthlyObligations: {} },
    projectParams: initialEvent.projectParams,
    scenario: { constructionCostChange: 0, infrastructureReduction: 0, purchasePriceReduction: 0 },
    transactionHistory: []
  };

  // Apply initial event
  state = applyEvent(state, initialEvent);

  // Create Phase 0
  const phases: PhaseProjection[] = [
    createPhaseProjection(state, 0, initialEvent.date, unitDetails, initialEvent)
  ];

  // Apply remaining events, creating new phase for each
  for (let i = 1; i < events.length; i++) {
    const event = events[i];
    state = applyEvent(state, event);

    // Calculate duration of previous phase
    if (phases.length > 0) {
      const prevPhase = phases[phases.length - 1];
      const durationMs = event.date.getTime() - prevPhase.startDate.getTime();
      const durationMonths = Math.round(durationMs / (1000 * 60 * 60 * 24 * 30.44));
      prevPhase.durationMonths = durationMonths;
      prevPhase.endDate = event.date;
    }

    phases.push(
      createPhaseProjection(state, i, event.date, unitDetails, event)
    );
  }

  return phases;
}

/**
 * Create a phase projection from current state
 */
function createPhaseProjection(
  state: ProjectionState,
  phaseNumber: number,
  startDate: Date,
  unitDetails: UnitDetails,
  triggeringEvent: DomainEvent
): PhaseProjection {
  // Reuse existing calculation engine
  const snapshot = calculateAll(
    state.participants,
    state.projectParams,
    state.scenario,
    unitDetails
  );

  // Calculate cash flows for each participant
  const participantCashFlows = new Map(
    state.participants.map(p => [
      p.name,
      calculateParticipantCashFlow(p, snapshot, state.transactionHistory)
    ])
  );

  // Calculate copro cash flow
  const coproproprieteCashFlow = calculateCoproCashFlow(
    state.copropropriete,
    snapshot,
    state.transactionHistory
  );

  return {
    phaseNumber,
    startDate,
    endDate: undefined, // Set by next event
    durationMonths: undefined,
    participants: state.participants,
    copropropriete: state.copropropriete,
    snapshot,
    participantCashFlows,
    coproproprieteCashFlow,
    triggeringEvent
  };
}
```

---

## Cash Flow Calculations

Cash flows are **projections** derived from transaction history and phase duration.

```typescript
interface ParticipantCashFlow {
  participantName: string;
  phaseNumber: number;

  // Recurring costs during phase
  monthlyRecurring: {
    ownLotExpenses: {
      loanPayment: number;
      propertyTax: number;
      insurance: number;
      commonCharges: number;
    };
    carriedLotExpenses?: {
      loanInterestOnly: number;
      emptyPropertyTax: number;
      insurance: number;
    };
    totalMonthly: number;
  };

  // One-time events at phase boundaries
  phaseTransitionEvents: TransitionEvent[];

  // Summary for this phase
  phaseSummary: {
    durationMonths: number;
    totalRecurring: number;
    transitionNet: number;
    phaseNetCashImpact: number;
  };

  // Cumulative since T0
  cumulativePosition: {
    totalInvested: number;
    totalReceived: number;
    netPosition: number;
  };
}

interface TransitionEvent {
  type: 'SALE' | 'PURCHASE' | 'REDISTRIBUTION_RECEIVED';
  amount: number;
  date: Date;
  description: string;
  breakdown?: Record<string, number>;
}

export function calculateParticipantCashFlow(
  participant: Participant,
  snapshot: CalculationResults,
  transactionHistory: Transaction[]
): ParticipantCashFlow {
  // Find participant's calculation in snapshot
  const calc = snapshot.participantBreakdown.find(
    p => p.name === participant.name
  );

  if (!calc) {
    throw new Error(`Participant ${participant.name} not found in snapshot`);
  }

  // Calculate monthly recurring
  const ownLotExpenses = {
    loanPayment: calc.monthlyPayment,
    propertyTax: 388.38 / 12,
    insurance: 2000 / 12 / snapshot.participantBreakdown.length,
    commonCharges: calc.sharedCosts / 12 // Approximate
  };

  // If carrying extra lots
  let carriedLotExpenses = undefined;
  if (participant.quantity > 1) {
    const extraLots = participant.quantity - 1;
    const loanAmount = calc.loanNeeded / participant.quantity; // Per lot
    const monthlyInterest = (loanAmount * participant.interestRate / 100) / 12;

    carriedLotExpenses = {
      loanInterestOnly: monthlyInterest * extraLots,
      emptyPropertyTax: (388.38 / 12) * extraLots,
      insurance: (2000 / 12) * extraLots
    };
  }

  const totalMonthly =
    ownLotExpenses.loanPayment +
    ownLotExpenses.propertyTax +
    ownLotExpenses.insurance +
    ownLotExpenses.commonCharges +
    (carriedLotExpenses
      ? carriedLotExpenses.loanInterestOnly +
        carriedLotExpenses.emptyPropertyTax +
        carriedLotExpenses.insurance
      : 0);

  // Extract transition events from transaction history
  const phaseTransitionEvents = transactionHistory
    .filter(tx => tx.from === participant.name || tx.to === participant.name)
    .map(tx => ({
      type: tx.type === 'LOT_SALE' && tx.from === participant.name ? 'SALE' :
            tx.type === 'LOT_SALE' && tx.to === participant.name ? 'PURCHASE' :
            'REDISTRIBUTION_RECEIVED',
      amount: tx.from === participant.name ? tx.amount : -tx.amount,
      date: tx.date,
      description: describeTransaction(tx),
      breakdown: tx.breakdown
    } as TransitionEvent));

  const transitionNet = phaseTransitionEvents.reduce((sum, e) => sum + e.amount, 0);

  return {
    participantName: participant.name,
    phaseNumber: 0, // Set by caller
    monthlyRecurring: {
      ownLotExpenses,
      carriedLotExpenses,
      totalMonthly
    },
    phaseTransitionEvents,
    phaseSummary: {
      durationMonths: 0, // Set by caller
      totalRecurring: 0,
      transitionNet,
      phaseNetCashImpact: transitionNet
    },
    cumulativePosition: {
      totalInvested: calc.totalCost,
      totalReceived: transitionNet > 0 ? transitionNet : 0,
      netPosition: transitionNet - calc.totalCost
    }
  };
}
```

---

## Portage & Redistribution Formulas

These are the **habitat-beaver domain logic**, implemented as pure functions.

```typescript
/**
 * Calculate carrying costs for portage (from habitat-beaver guide)
 */
export function calculateCarryingCosts(
  lot: Participant,
  durationMonths: number,
  interestRate: number
): CarryingCosts {
  const loanAmount = lot.totalCost - lot.capitalApporte;
  const monthlyInterest = (loanAmount * interestRate / 100) / 12;
  const monthlyTax = 388.38 / 12; // Belgian empty property tax
  const monthlyInsurance = 2000 / 12; // From guide

  return {
    monthlyInterest,
    monthlyTax,
    monthlyInsurance,
    totalMonthly: monthlyInterest + monthlyTax + monthlyInsurance,
    totalForPeriod: (monthlyInterest + monthlyTax + monthlyInsurance) * durationMonths
  };
}

/**
 * Calculate fair resale price (habitat-beaver formula)
 */
export function calculateResalePrice(
  originalPurchaseShare: number,
  originalNotaryFees: number,
  yearsHeld: number,
  indexationRate: number = 2, // Default 2%/year from guide
  carryingCosts: CarryingCosts,
  renovationsConducted: number = 0
): ResalePrice {
  const indexation = originalPurchaseShare * Math.pow(1 + indexationRate/100, yearsHeld)
                     - originalPurchaseShare;

  // 60% fee recovery if resold within 2 years (Belgian law)
  const feesRecovery = yearsHeld <= 2 ? originalNotaryFees * 0.6 : 0;

  return {
    basePrice: originalPurchaseShare,
    feesRecovery,
    indexation,
    carryingCostRecovery: carryingCosts.totalForPeriod,
    renovations: renovationsConducted,
    totalPrice: originalPurchaseShare + feesRecovery + indexation
                + carryingCosts.totalForPeriod + renovationsConducted,
    breakdown: {
      base: originalPurchaseShare,
      fees: feesRecovery,
      indexation,
      carrying: carryingCosts.totalForPeriod,
      renovations: renovationsConducted
    }
  };
}

/**
 * Calculate redistribution when copro sells hidden lot (habitat-beaver formula)
 */
export function calculateRedistribution(
  saleProceeds: number,
  initialCopropietaires: Participant[],
  totalSurfaceAtPurchase: number
): Redistribution[] {
  // Proportional to original quotités (surface-based)
  return initialCopropietaires.map(p => ({
    participantName: p.name,
    quotite: p.surface / totalSurfaceAtPurchase,
    amount: saleProceeds * (p.surface / totalSurfaceAtPurchase)
  }));
}
```

---

## User Interface Integration

### State Management (React)

```typescript
// ============================================
// React State Hook
// ============================================

interface TimelineState {
  // Source of truth
  timeline: Timeline;

  // UI state
  mode: 'SNAPSHOT' | 'TIMELINE';
  selectedPhaseIndex: number;

  // Computed (memoized)
  phases: PhaseProjection[];
}

function useTimeline() {
  const [timeline, setTimeline] = useState<Timeline>({
    events: [],
    createdAt: new Date(),
    lastModifiedAt: new Date(),
    version: 1
  });

  const [selectedPhaseIndex, setSelectedPhaseIndex] = useState(0);

  // Memoized projection
  const phases = useMemo(
    () => projectTimeline(timeline.events, unitDetails),
    [timeline.events]
  );

  // Event dispatchers
  const addEvent = useCallback((event: DomainEvent) => {
    setTimeline(prev => ({
      ...prev,
      events: [...prev.events, event],
      lastModifiedAt: new Date()
    }));
  }, []);

  const removeEvent = useCallback((eventId: string) => {
    setTimeline(prev => ({
      ...prev,
      events: prev.events.filter(e => e.id !== eventId),
      lastModifiedAt: new Date()
    }));
  }, []);

  return {
    timeline,
    phases,
    selectedPhaseIndex,
    setSelectedPhaseIndex,
    addEvent,
    removeEvent
  };
}
```

### Adding a Newcomer (User Flow)

```typescript
// ============================================
// UI Component Logic
// ============================================

function handleAddNewcomer(
  buyerDetails: ParticipantDetails,
  seller: string,
  joiningDate: Date
) {
  // 1. Calculate purchase price using domain logic
  const sellerLot = getCurrentPhase().participants.find(p => p.name === seller);
  const monthsHeld = calculateMonthsBetween(timeline.events[0].date, joiningDate);

  const carryingCosts = calculateCarryingCosts(
    sellerLot,
    monthsHeld,
    sellerLot.interestRate
  );

  const resalePrice = calculateResalePrice(
    sellerLot.purchaseShare,
    sellerLot.notaryFees,
    monthsHeld / 12,
    2, // indexation rate
    carryingCosts
  );

  // 2. Create event
  const event: NewcomerJoinsEvent = {
    id: generateId(),
    type: 'NEWCOMER_JOINS',
    date: joiningDate,
    buyer: buyerDetails,
    acquisition: {
      from: seller,
      lotId: sellerLot.unitId,
      purchasePrice: resalePrice.totalPrice,
      breakdown: resalePrice.breakdown
    },
    notaryFees: resalePrice.totalPrice * (buyerDetails.notaryFeesRate / 100),
    financing: {
      capitalApporte: buyerDetails.capitalApporte,
      loanAmount: resalePrice.totalPrice - buyerDetails.capitalApporte,
      interestRate: buyerDetails.interestRate,
      durationYears: buyerDetails.durationYears
    }
  };

  // 3. Dispatch event
  addEvent(event);

  // 4. Also create portage settlement event
  const settlementEvent: PortageSettlementEvent = {
    id: generateId(),
    type: 'PORTAGE_SETTLEMENT',
    date: joiningDate,
    seller,
    buyer: buyerDetails.name,
    lotId: sellerLot.unitId,
    carryingPeriodMonths: monthsHeld,
    carryingCosts,
    saleProceeds: resalePrice.totalPrice,
    netPosition: resalePrice.totalPrice - carryingCosts.totalForPeriod
  };

  addEvent(settlementEvent);
}
```

### Real-Time Preview While Dragging

```typescript
// ============================================
// Preview Calculation (No State Change)
// ============================================

function calculatePreview(
  currentTimeline: Timeline,
  proposedJoiningDate: Date,
  seller: string
): PreviewData {
  // Simulate event without applying
  const monthsHeld = calculateMonthsBetween(
    currentTimeline.events[0].date,
    proposedJoiningDate
  );

  const sellerLot = getCurrentState(currentTimeline).participants
    .find(p => p.name === seller);

  const carryingCosts = calculateCarryingCosts(
    sellerLot,
    monthsHeld,
    sellerLot.interestRate
  );

  const resalePrice = calculateResalePrice(
    sellerLot.purchaseShare,
    sellerLot.notaryFees,
    monthsHeld / 12,
    2,
    carryingCosts
  );

  return {
    sellerCarryingCost: carryingCosts.totalForPeriod,
    sellerMonthly: carryingCosts.totalMonthly,
    purchasePrice: resalePrice.totalPrice,
    sellerNet: resalePrice.totalPrice - carryingCosts.totalForPeriod,
    breakdown: resalePrice.breakdown
  };
}

// Show in tooltip while dragging timeline
<Tooltip>
  Preview: Phase 1 at T+{monthsDragged/12}y

  Seller carrying cost:
    ~{preview.sellerMonthly}€/month × {monthsHeld} = {preview.sellerCarryingCost}€

  Fair purchase price:
    ~{preview.purchasePrice}€

  Seller net: ~{preview.sellerNet}€
</Tooltip>
```

---

## Component Structure

```
src/
  utils/
    calculatorUtils.ts          # Existing + type extensions
    chronologyCalculations.ts   # NEW: Event reducers & projections
    chronologyCalculations.test.ts
    portageCalculations.ts      # NEW: Habitat-beaver formulas
    portageCalculations.test.ts

  types/
    timeline.ts                 # NEW: Events, projections
    cashflow.ts                 # NEW: Cash flow types

  components/
    EnDivisionCorrect.tsx       # Existing snapshot mode (unchanged)

    timeline/
      TimelineView.tsx          # Main timeline orchestrator
      TimelineEditor.tsx        # Draggable timeline component
      EventList.tsx             # Event history viewer
      PhaseCard.tsx             # Phase summary card
      AddEventModal.tsx         # Modal for creating events

    participants/
      ParticipantCard.tsx       # Refactored from EnDivisionCorrect
      ParticipantCashFlowCard.tsx  # Cash flow details
      ParticipantCashFlowChart.tsx # Visual cash flow over time

    copropropriete/
      CoproCard.tsx             # Copropriété finances
      CoproBalanceSheet.tsx     # Assets, liabilities

  hooks/
    useTimeline.ts              # Timeline state management
    useEventProjection.ts       # Memoized projection hook
```

---

## Testing Strategy

### Unit Tests (TDD)

**Event Reducers:**
```typescript
describe('applyNewcomerJoins', () => {
  it('should add newcomer as full participant', () => {
    const state = createInitialState();
    const event: NewcomerJoinsEvent = {
      type: 'NEWCOMER_JOINS',
      buyer: { name: 'Emma', surface: 134, ... },
      // ...
    };

    const newState = applyEvent(state, event);

    expect(newState.participants).toHaveLength(5);
    expect(newState.participants[4].name).toBe('Emma');
  });

  it('should reduce seller lot count', () => {
    const state = createStateWithCarrier('Buyer B', 2);
    const event: NewcomerJoinsEvent = {
      type: 'NEWCOMER_JOINS',
      acquisition: { from: 'Buyer B', ... },
      // ...
    };

    const newState = applyEvent(state, event);
    const buyerB = newState.participants.find(p => p.name === 'Buyer B');

    expect(buyerB.quantity).toBe(1);
  });
});
```

**Portage Calculations:**
```typescript
describe('calculateResalePrice', () => {
  it('should match habitat-beaver example', () => {
    // From habitat-beaver guide: 2 years portage
    const result = calculateResalePrice(
      143000,  // base price
      17875,   // notary fees (12.5%)
      2,       // years held
      2,       // indexation rate
      { totalForPeriod: 10800 }, // carrying costs
      0        // renovations
    );

    expect(result.totalPrice).toBeCloseTo(165720, 0);
    expect(result.breakdown.indexation).toBeCloseTo(5720, 0);
    expect(result.breakdown.fees).toBeCloseTo(10725, 0); // 60% recovery
  });
});
```

**Event Replay:**
```typescript
describe('projectTimeline', () => {
  it('should project 3 phases from 2 events', () => {
    const events: DomainEvent[] = [
      createInitialPurchaseEvent(),
      createNewcomerJoinsEvent()
    ];

    const phases = projectTimeline(events, unitDetails);

    expect(phases).toHaveLength(2);
    expect(phases[0].participants).toHaveLength(4);
    expect(phases[1].participants).toHaveLength(5);
  });

  it('should preserve participant continuity', () => {
    // Emma joins in phase 1, carries lot in phase 2
    const events = [
      initialPurchase,
      emmaJoins,
      emmaCarriesLot
    ];

    const phases = projectTimeline(events, unitDetails);
    const emmaPhase1 = phases[1].participants.find(p => p.name === 'Emma');
    const emmaPhase2 = phases[2].participants.find(p => p.name === 'Emma');

    expect(emmaPhase1.quantity).toBe(1);
    expect(emmaPhase2.quantity).toBe(2); // Emma now carrying!
  });
});
```

### Integration Tests

**Full Timeline Workflow:**
```typescript
describe('Timeline Integration', () => {
  it('should handle complete newcomer workflow', () => {
    const timeline: Timeline = { events: [] };

    // Add initial purchase
    timeline.events.push(createInitialPurchaseEvent());
    let phases = projectTimeline(timeline.events, unitDetails);
    expect(phases).toHaveLength(1);

    // Add newcomer after 2 years
    const newcomerEvent = createNewcomerJoinsEvent({
      buyer: 'Emma',
      seller: 'Buyer B',
      date: addYears(timeline.events[0].date, 2)
    });
    timeline.events.push(newcomerEvent);
    phases = projectTimeline(timeline.events, unitDetails);

    expect(phases).toHaveLength(2);
    expect(phases[1].participants[4].name).toBe('Emma');

    // Verify cash flows
    const emmaCashFlow = phases[1].participantCashFlows.get('Emma');
    expect(emmaCashFlow.phaseTransitionEvents).toContainEqual(
      expect.objectContaining({ type: 'PURCHASE' })
    );
  });
});
```

---

## Portability & Export

### Event Log as Exchange Format

```typescript
// Export timeline to JSON for notary/consultant
function exportTimelineToJSON(timeline: Timeline): string {
  return JSON.stringify({
    version: timeline.version,
    createdAt: timeline.createdAt,
    events: timeline.events.map(e => ({
      ...e,
      // Add human-readable descriptions
      description: describeEvent(e)
    }))
  }, null, 2);
}

// Example output:
{
  "version": 1,
  "createdAt": "2025-01-15T10:00:00Z",
  "events": [
    {
      "id": "evt_001",
      "type": "INITIAL_PURCHASE",
      "date": "2025-01-15T10:00:00Z",
      "participants": [...],
      "description": "Initial purchase by 4 co-owners for 650,000€"
    },
    {
      "id": "evt_002",
      "type": "NEWCOMER_JOINS",
      "date": "2027-01-20T14:30:00Z",
      "buyer": { "name": "Emma", ... },
      "acquisition": {
        "from": "Cathy/Jim",
        "purchasePrice": 165000,
        "breakdown": {
          "basePrice": 143000,
          "indexation": 5720,
          "carryingCostRecovery": 10800,
          "feesRecovery": 5480
        }
      },
      "description": "Emma purchased lot #7 from Cathy/Jim for 165,000€ (2 years portage)"
    }
  ]
}
```

### Excel Export Enhancement

```typescript
// Extend existing Excel export to include timeline
function exportTimelineToExcel(timeline: Timeline, phases: PhaseProjection[]) {
  const workbook = new ExcelJS.Workbook();

  // Sheet 1: Event Log
  const eventSheet = workbook.addWorksheet('Event Log');
  eventSheet.addRow(['Date', 'Type', 'Description', 'Amount']);
  timeline.events.forEach(event => {
    eventSheet.addRow([
      event.date,
      event.type,
      describeEvent(event),
      getEventAmount(event)
    ]);
  });

  // Sheet 2: Phase Summary
  const phaseSheet = workbook.addWorksheet('Phases');
  phases.forEach(phase => {
    phaseSheet.addRow([`Phase ${phase.phaseNumber}`, phase.startDate]);
    phase.participants.forEach(p => {
      const cashFlow = phase.participantCashFlows.get(p.name);
      phaseSheet.addRow([
        p.name,
        cashFlow.monthlyRecurring.totalMonthly,
        cashFlow.phaseSummary.phaseNetCashImpact
      ]);
    });
  });

  // Sheet 3-N: One sheet per participant showing full timeline
  // ...

  return workbook;
}
```

---

## Implementation Roadmap

### Phase 1: Core Domain Logic (TDD) - Week 1
**Goal:** Build event system and projections, fully tested

- [ ] Define TypeScript interfaces in `src/types/timeline.ts`
- [ ] Implement event reducers in `chronologyCalculations.ts`
  - [ ] `applyInitialPurchase()`
  - [ ] `applyNewcomerJoins()`
  - [ ] `applyHiddenLotRevealed()`
- [ ] Implement `projectTimeline()` main projection function
- [ ] Write comprehensive unit tests (TDD)
- [ ] Implement portage formulas in `portageCalculations.ts`
  - [ ] `calculateCarryingCosts()`
  - [ ] `calculateResalePrice()`
  - [ ] `calculateRedistribution()`
- [ ] Validate against habitat-beaver guide examples

**Deliverable:** Pure business logic, 100% test coverage, no UI

### Phase 2: Timeline UI Skeleton - Week 2
**Goal:** Basic timeline navigation

- [ ] Create `useTimeline()` hook with event storage
- [ ] Build `TimelineView.tsx` layout
- [ ] Build `TimelineEditor.tsx` (draggable milestones)
- [ ] Integrate `projectTimeline()` with memoization
- [ ] Click phase → show phase details

**Deliverable:** Interactive timeline that projects phases from events

### Phase 3: Event Creation UI - Week 3
**Goal:** Users can add newcomers

- [ ] Build `AddEventModal.tsx` with form
- [ ] Implement "Add Newcomer" flow
  - [ ] Select seller dropdown
  - [ ] Newcomer details form (reuse participant inputs)
  - [ ] Real-time price calculation preview
- [ ] Dispatch `NEWCOMER_JOINS` event
- [ ] Show new phase immediately

**Deliverable:** Can create timeline with newcomers joining

### Phase 4: Cash Flow Views - Week 4
**Goal:** Financial visibility per participant

- [ ] Implement `calculateParticipantCashFlow()`
- [ ] Build `ParticipantCashFlowCard.tsx`
  - [ ] Monthly recurring breakdown
  - [ ] Transition events list
  - [ ] Cumulative position
- [ ] Build `CoproCard.tsx`
- [ ] Integrate with phase display

**Deliverable:** Users see detailed cash flows per phase

### Phase 5: Copropriété Features - Week 5
**Goal:** Hidden lot revelation

- [ ] Implement `applyHiddenLotRevealed()` reducer
- [ ] Build "Reveal Hidden Lot" event creation
- [ ] Calculate and display redistribution
- [ ] Show copropriété balance sheet
- [ ] Copropriété loan tracking

**Deliverable:** Full copropriété entity support

### Phase 6: Polish & Export - Week 6
**Goal:** Production-ready

- [ ] Real-time preview tooltip while dragging
- [ ] Event log viewer (`EventList.tsx`)
- [ ] Undo/redo support (remove events)
- [ ] Export timeline to JSON
- [ ] Extend Excel export with timeline sheets
- [ ] Save/load timeline from localStorage
- [ ] Documentation and user guide

**Deliverable:** Feature-complete, deployed

---

## Open Questions

1. **Migration Strategy:** How do we migrate existing snapshot-mode scenarios to timeline format? Auto-convert on load?

2. **Conflict Resolution:** If two users edit timeline simultaneously (future collaboration feature), how to merge events?

3. **Validation Rules:** Should we enforce constraints (e.g., can't sell more lots than you own)? If yes, where: UI, event creation, or reducer?

4. **Performance:** With 50+ events, is re-projection on every render too slow? Need to benchmark and optimize memoization.

5. **Historical Corrections:** If user realizes they entered wrong data in Phase 0, do we allow editing events (breaks immutability) or require "correction events"?

---

## Success Criteria

### Functional Requirements
- ✅ User can create timeline with 2+ phases via events
- ✅ Newcomer in Phase 1 appears as regular participant (same interface)
- ✅ Carrying costs calculated per habitat-beaver formula
- ✅ Redistribution when copro sells hidden lot works
- ✅ Real-time cost preview while dragging timeline
- ✅ All business logic is pure functions (100% testable)
- ✅ Event log is exportable as JSON
- ✅ Can replay events to reconstruct any phase

### Non-Functional Requirements
- ✅ Timeline projection: <100ms for 10 events
- ✅ UI responsive on mobile
- ✅ Existing snapshot mode unaffected (no regressions)
- ✅ Event log is human-readable (notary/consultant can audit)

### Architectural Requirements
- ✅ Business logic separate from UI framework
- ✅ Domain events map to real-world concepts
- ✅ Projections are reproducible (same events → same phases)
- ✅ Can extend with new event types without breaking existing code

---

## References

- [Habitat Beaver Guide](/Users/dragan/Documents/BEAVER/ferme-du-temple/src/content/habitat-beaver-guide.md) - Domain formulas
- [Current Calculator Utils](/Users/dragan/Documents/credit-castor/src/utils/calculatorUtils.ts) - Existing pure functions
- Belgian Walloon property law: 3% vs 12.5% notary fees, 60% fee recovery
- Event Sourcing patterns: Greg Young, Martin Fowler resources

---

**Next Step:** Review design with stakeholders, then begin Phase 1 implementation (TDD core domain logic).
