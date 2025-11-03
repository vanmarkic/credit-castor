/**
 * Chronology Calculations - Event Reducers
 *
 * Implements event sourcing for timeline:
 * - Events → State transformations
 * - Pure functions (no side effects)
 * - Projections derived by replaying events
 */

import { calculateAll } from './calculatorUtils';
import type { Participant, UnitDetails, CalculationResults, ParticipantCalculation } from './calculatorUtils';
import { AVERAGE_DAYS_PER_MONTH } from './timeConstants';
import type {
  DomainEvent,
  InitialPurchaseEvent,
  NewcomerJoinsEvent,
  HiddenLotRevealedEvent,
  PortageSettlementEvent,
  CoproTakesLoanEvent,
  ParticipantExitsEvent,
  Loan,
  ProjectionState,
  PhaseProjection,
  Transaction,
  ParticipantCashFlow,
  CoproCashFlow,
  TransitionEvent,
  CoproLot
} from '../types/timeline';

// ============================================
// Initial State
// ============================================

export function createInitialState(): ProjectionState {
  return {
    currentDate: new Date(),
    participants: [],
    copropropriete: {
      name: '',
      lotsOwned: [],
      cashReserve: 0,
      loans: [],
      monthlyObligations: {
        loanPayments: 0,
        insurance: 0,
        accountingFees: 0,
        maintenanceReserve: 0
      }
    },
    projectParams: {
      totalPurchase: 0,
      mesuresConservatoires: 0,
      demolition: 0,
      infrastructures: 0,
      etudesPreparatoires: 0,
      fraisEtudesPreparatoires: 0,
      fraisGeneraux3ans: 0,
      batimentFondationConservatoire: 0,
      batimentFondationComplete: 0,
      batimentCoproConservatoire: 0,
      globalCascoPerM2: 0
    },
    scenario: {
      constructionCostChange: 0,
      infrastructureReduction: 0,
      purchasePriceReduction: 0
    },
    transactionHistory: []
  };
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
      return applyParticipantExits(state, event);

    default:
      // Exhaustive check (TypeScript will error if case missed)
      return state;
  }
}

// ============================================
// Event Handlers
// ============================================

/**
 * Apply INITIAL_PURCHASE event
 * Creates the initial state of the co-ownership
 */
function applyInitialPurchase(
  state: ProjectionState,
  event: InitialPurchaseEvent
): ProjectionState {
  // Convert ParticipantDetails to Participant
  const participants: Participant[] = event.participants.map(convertToParticipant);

  // Convert hidden lot IDs to CoproLot objects with deed date
  const coproLots: CoproLot[] = (event.copropropriete.hiddenLots || []).map(lotId => ({
    lotId,
    surface: 85, // TODO: Get actual surface from somewhere
    acquiredDate: event.date, // Acquired at deed date
  }));

  return {
    ...state,
    currentDate: event.date,
    participants,
    copropropriete: {
      name: event.copropropriete.name,
      lotsOwned: coproLots,
      cashReserve: 0,
      loans: [],
      monthlyObligations: {
        loanPayments: 0,
        insurance: 2000 / 12, // From habitat-beaver guide
        accountingFees: 1000 / 12, // From habitat-beaver guide
        maintenanceReserve: 0
      }
    },
    projectParams: event.projectParams,
    scenario: event.scenario,
    transactionHistory: []
  };
}

/**
 * Apply NEWCOMER_JOINS event
 * Adds newcomer as full participant, reduces seller lot count if applicable
 */
function applyNewcomerJoins(
  state: ProjectionState,
  event: NewcomerJoinsEvent
): ProjectionState {
  // 1. Convert newcomer to Participant
  const newcomer = convertToParticipant(event.buyer);

  // 2. Update seller's lot count if they were carrying multiple lots
  const updatedParticipants = state.participants.map(p => {
    if (p.name === event.acquisition.from && (p.quantity || 0) > 1) {
      return { ...p, quantity: (p.quantity || 0) - 1 };
    }
    return p;
  });

  // 3. Add newcomer
  updatedParticipants.push(newcomer);

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

/**
 * Apply HIDDEN_LOT_REVEALED event
 * Copropriété sells hidden lot, proceeds redistributed to members
 */
function applyHiddenLotRevealed(
  state: ProjectionState,
  event: HiddenLotRevealedEvent
): ProjectionState {
  // 1. Add buyer as participant
  const newParticipant = convertToParticipant(event.buyer);

  // 2. Remove lot from copro
  const updatedCopro = {
    ...state.copropropriete,
    lotsOwned: state.copropropriete.lotsOwned.filter(lot => lot.lotId !== event.lotId),
    cashReserve: state.copropropriete.cashReserve + event.salePrice
  };

  // 3. Record redistribution transactions
  const redistributionTxs: Transaction[] = Object.entries(event.redistribution).map(
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

/**
 * Apply PORTAGE_SETTLEMENT event
 * Participant carrying lot for portage sells it to buyer
 */
function applyPortageSettlement(
  state: ProjectionState,
  event: PortageSettlementEvent
): ProjectionState {
  // 1. Update seller's lot count (reduce by 1 if carrying multiple)
  const updatedParticipants = state.participants.map(p => {
    if (p.name === event.seller && (p.quantity || 0) > 1) {
      return { ...p, quantity: (p.quantity || 0) - 1 };
    }
    return p;
  });

  // 2. Record transaction
  const transaction: Transaction = {
    type: 'LOT_SALE',
    from: event.seller,
    to: event.buyer,
    amount: event.saleProceeds,
    date: event.date,
    metadata: {
      carryingCosts: event.carryingCosts.totalCarried,
      carryingPeriodMonths: event.carryingPeriodMonths,
      netPosition: event.netPosition
    }
  };

  return {
    ...state,
    currentDate: event.date,
    participants: updatedParticipants,
    transactionHistory: [...state.transactionHistory, transaction]
  };
}

/**
 * Apply COPRO_TAKES_LOAN event
 * Copropriété takes out a loan for collective expenses
 */
function applyCoproTakesLoan(
  state: ProjectionState,
  event: CoproTakesLoanEvent
): ProjectionState {
  // 1. Create new loan
  const newLoan: Loan = {
    id: event.id,
    amount: event.loanAmount,
    purpose: event.purpose,
    interestRate: event.interestRate,
    durationYears: event.durationYears,
    monthlyPayment: event.monthlyPayment,
    remainingBalance: event.loanAmount,
    startDate: event.date
  };

  // 2. Update copropriété with new loan
  const updatedCopro = {
    ...state.copropropriete,
    loans: [...state.copropropriete.loans, newLoan],
    monthlyObligations: {
      ...state.copropropriete.monthlyObligations,
      loanPayments: state.copropropriete.monthlyObligations.loanPayments + event.monthlyPayment
    }
  };

  return {
    ...state,
    currentDate: event.date,
    copropropriete: updatedCopro
  };
}

/**
 * Apply PARTICIPANT_EXITS event
 * Participant exits by selling their lot
 */
function applyParticipantExits(
  state: ProjectionState,
  event: ParticipantExitsEvent
): ProjectionState {
  // 1. Update or remove exiting participant
  let updatedParticipants = state.participants;
  const exitingParticipant = state.participants.find(p => p.name === event.participant);

  if (exitingParticipant) {
    if ((exitingParticipant.quantity || 0) > 1) {
      // Reduce lot count
      updatedParticipants = state.participants.map(p =>
        p.name === event.participant ? { ...p, quantity: (p.quantity || 0) - 1 } : p
      );
    } else {
      // Remove participant entirely
      updatedParticipants = state.participants.filter(p => p.name !== event.participant);
    }
  }

  // 2. Handle buyer based on type
  let updatedCopro = state.copropropriete;

  if (event.buyerType === 'COPRO') {
    // Copro acquires the lot
    const newCoproLot: CoproLot = {
      lotId: event.lotId,
      surface: 85, // TODO: Get actual surface
      acquiredDate: event.date,
      salePrice: event.salePrice,
    };
    updatedCopro = {
      ...state.copropropriete,
      lotsOwned: [...state.copropropriete.lotsOwned, newCoproLot]
    };
  } else if (event.buyerType === 'EXISTING_PARTICIPANT' && event.buyerName) {
    // Existing participant increases lot count
    updatedParticipants = updatedParticipants.map(p =>
      p.name === event.buyerName ? { ...p, quantity: (p.quantity || 0) + 1 } : p
    );
  }
  // TODO: Handle NEWCOMER case (would need buyer details in event)

  // 3. Record transaction
  const buyerName = event.buyerType === 'COPRO' ? 'COPRO' : event.buyerName || 'Unknown';
  const transaction: Transaction = {
    type: 'LOT_SALE',
    from: event.participant,
    to: buyerName,
    amount: event.salePrice,
    date: event.date
  };

  return {
    ...state,
    currentDate: event.date,
    participants: updatedParticipants,
    copropropriete: updatedCopro,
    transactionHistory: [...state.transactionHistory, transaction]
  };
}

// ============================================
// Helper Functions
// ============================================

/**
 * Convert event participant to full Participant (ensures defaults)
 */
function convertToParticipant(details: Participant): Participant {
  return {
    ...details,
    // Set defaults for any missing fields
    quantity: details.quantity || 1,
    isFounder: details.isFounder || false,
  };
}

// ============================================
// Timeline Projection
// ============================================

/**
 * Project timeline events into phase views
 *
 * This is the core function that replays events to compute phases.
 * Each phase is a complete snapshot of the co-ownership state.
 *
 * @param events - Chronological list of domain events
 * @param unitDetails - Unit configurations for calculations
 * @returns Array of phase projections
 */
export function projectTimeline(
  events: DomainEvent[],
  unitDetails: UnitDetails
): PhaseProjection[] {
  // Empty events = empty timeline
  if (events.length === 0) {
    return [];
  }

  // Validate: must start with INITIAL_PURCHASE
  const initialEvent = events[0];
  if (initialEvent.type !== 'INITIAL_PURCHASE') {
    throw new Error('Timeline must start with INITIAL_PURCHASE event');
  }

  // Initialize state
  let state: ProjectionState = createInitialState();

  // Apply initial event
  state = applyEvent(state, initialEvent);

  // Create Phase 0
  const phases: PhaseProjection[] = [
    createPhaseProjection(state, 0, initialEvent.date, unitDetails, initialEvent, [])
  ];

  // Apply remaining events, creating new phase for each
  for (let i = 1; i < events.length; i++) {
    const event = events[i];

    // Calculate duration of previous phase
    const prevPhase = phases[phases.length - 1];
    const durationMs = event.date.getTime() - prevPhase.startDate.getTime();
    const durationMonths = Math.round(durationMs / (1000 * 60 * 60 * 24 * 30.44));

    prevPhase.durationMonths = durationMonths;
    prevPhase.endDate = event.date;

    // Re-calculate previous phase cash flows with duration
    // We don't need to recalculate - the phase already has correct participants
    // Just update the summary with the now-known duration
    prevPhase.participantCashFlows.forEach(cashFlow => {
      cashFlow.phaseSummary.durationMonths = durationMonths;
      cashFlow.phaseSummary.totalRecurring = cashFlow.monthlyRecurring.totalMonthly * durationMonths;
      cashFlow.phaseSummary.phaseNetCashImpact = cashFlow.phaseSummary.totalRecurring + cashFlow.phaseSummary.transitionNet;
      // Update cumulative invested with recurring costs
      cashFlow.cumulativePosition.totalInvested += cashFlow.phaseSummary.totalRecurring;
      cashFlow.cumulativePosition.netPosition = cashFlow.cumulativePosition.totalReceived - cashFlow.cumulativePosition.totalInvested;
    });

    prevPhase.coproproprieteCashFlow.phaseSummary.durationMonths = durationMonths;
    prevPhase.coproproprieteCashFlow.phaseSummary.totalRecurring = prevPhase.coproproprieteCashFlow.monthlyRecurring.totalMonthly * durationMonths;
    prevPhase.coproproprieteCashFlow.phaseSummary.phaseNetCashImpact = prevPhase.coproproprieteCashFlow.phaseSummary.totalRecurring + prevPhase.coproproprieteCashFlow.phaseSummary.transitionNet;

    // Apply event to state
    state = applyEvent(state, event);

    // Create new phase
    phases.push(
      createPhaseProjection(state, i, event.date, unitDetails, event, phases)
    );
  }

  return phases;
}

// ============================================
// Cash Flow Calculations
// ============================================

/**
 * Calculate participant cash flow for a phase
 *
 * @param participant - The participant to calculate for
 * @param snapshot - Current phase snapshot from calculateAll
 * @param state - Projection state with transaction history
 * @param phaseNumber - Current phase number
 * @param durationMonths - Phase duration (undefined for ongoing phase)
 * @param previousPhases - All previous phases for cumulative calculations
 * @returns Participant cash flow structure
 */
function calculateParticipantCashFlow(
  participant: Participant,
  snapshot: CalculationResults,
  state: ProjectionState,
  phaseNumber: number,
  durationMonths: number | undefined,
  previousPhases: PhaseProjection[]
): ParticipantCashFlow {
  // Get participant breakdown from snapshot
  const participantData = snapshot.participantBreakdown.find(
    (p: ParticipantCalculation) => p.name === participant.name
  );

  if (!participantData) {
    throw new Error(`Participant ${participant.name} not found in snapshot`);
  }

  // Calculate monthly recurring costs for own lot
  const loanPayment = participantData.monthlyPayment;
  const propertyTax = 388.38 / 12; // Belgian empty property tax
  const insurance = (2000 / 12) / snapshot.participantBreakdown.length; // Split insurance
  const commonCharges = 0; // TODO: Implement common charges calculation

  // Calculate carried lot expenses if carrying multiple lots
  let carriedLotExpenses = undefined;
  const quantity = participant.quantity || 1;
  if (quantity > 1) {
    const carriedLotValue = participantData.totalCost / quantity;
    const carriedLoanAmount = carriedLotValue - participant.capitalApporte / quantity;
    const loanInterestOnly = carriedLoanAmount > 0
      ? (carriedLoanAmount * participant.interestRate / 100) / 12
      : 0;

    carriedLotExpenses = {
      loanInterestOnly,
      emptyPropertyTax: 388.38 / 12,
      insurance: 2000 / 12
    };
  }

  const totalMonthly = loanPayment + propertyTax + insurance + commonCharges +
    (carriedLotExpenses
      ? carriedLotExpenses.loanInterestOnly + carriedLotExpenses.emptyPropertyTax + carriedLotExpenses.insurance
      : 0);

  const monthlyRecurring = {
    ownLotExpenses: {
      loanPayment,
      propertyTax,
      insurance,
      commonCharges
    },
    carriedLotExpenses,
    totalMonthly
  };

  // Calculate phase transition events
  const phaseTransitionEvents: TransitionEvent[] = [];

  // Find transactions involving this participant in current phase
  state.transactionHistory.forEach(tx => {
    if (tx.from === participant.name && tx.type === 'LOT_SALE') {
      phaseTransitionEvents.push({
        type: 'SALE',
        amount: tx.amount,
        date: tx.date,
        description: `Sold lot to ${tx.to}`,
        breakdown: tx.breakdown
      });
    }

    if (tx.to === participant.name && tx.type === 'LOT_SALE') {
      // Find associated notary fees
      const notaryFees = state.transactionHistory.find(
        t => t.type === 'NOTARY_FEES' && t.from === participant.name && t.date.getTime() === tx.date.getTime()
      );
      const totalPurchase = tx.amount + (notaryFees?.amount || 0);

      phaseTransitionEvents.push({
        type: 'PURCHASE',
        amount: -totalPurchase,
        date: tx.date,
        description: `Purchased lot from ${tx.from}`,
        breakdown: tx.breakdown
      });
    }

    if (tx.to === participant.name && tx.type === 'REDISTRIBUTION') {
      phaseTransitionEvents.push({
        type: 'REDISTRIBUTION_RECEIVED',
        amount: tx.amount,
        date: tx.date,
        description: 'Redistribution from hidden lot sale'
      });
    }
  });

  // Calculate phase summary
  const totalRecurring = durationMonths !== undefined
    ? totalMonthly * durationMonths
    : 0;

  const transitionNet = phaseTransitionEvents.reduce((sum, evt) => sum + evt.amount, 0);
  const phaseNetCashImpact = totalRecurring + transitionNet;

  const phaseSummary = {
    durationMonths: durationMonths || 0,
    totalRecurring,
    transitionNet,
    phaseNetCashImpact
  };

  // Calculate cumulative position
  let totalInvested = participantData.capitalApporte + participantData.notaryFees;
  let totalReceived = 0;

  // Add cumulative from previous phases
  if (previousPhases.length > 0) {
    const prevPhase = previousPhases[previousPhases.length - 1];
    const prevCashFlow = prevPhase.participantCashFlows.get(participant.name);
    if (prevCashFlow) {
      totalInvested = prevCashFlow.cumulativePosition.totalInvested;
      totalReceived = prevCashFlow.cumulativePosition.totalReceived;
    }
  }

  // Add current phase recurring costs to invested
  totalInvested += totalRecurring;

  // Add current phase transactions
  phaseTransitionEvents.forEach(evt => {
    if (evt.amount > 0) {
      totalReceived += evt.amount;
    } else {
      totalInvested += Math.abs(evt.amount);
    }
  });

  const cumulativePosition = {
    totalInvested,
    totalReceived,
    netPosition: totalReceived - totalInvested
  };

  return {
    participantName: participant.name,
    phaseNumber,
    monthlyRecurring,
    phaseTransitionEvents,
    phaseSummary,
    cumulativePosition
  };
}

/**
 * Calculate copropriété cash flow for a phase
 *
 * @param state - Projection state
 * @param snapshot - Current phase snapshot
 * @param durationMonths - Phase duration (undefined for ongoing phase)
 * @param unitDetails - Unit configurations for lot valuation
 * @returns Copro cash flow structure
 */
function calculateCoproCashFlow(
  state: ProjectionState,
  snapshot: CalculationResults,
  durationMonths: number | undefined,
  _unitDetails: UnitDetails
): CoproCashFlow {
  const copro = state.copropropriete;

  // Calculate monthly recurring costs
  const loanPayments = copro.loans.reduce((sum, loan) => sum + loan.monthlyPayment, 0);
  const commonAreaMaintenance = copro.monthlyObligations.maintenanceReserve;
  const insurance = copro.monthlyObligations.insurance;
  const accountingFees = copro.monthlyObligations.accountingFees;
  const totalMonthly = loanPayments + commonAreaMaintenance + insurance + accountingFees;

  const monthlyRecurring = {
    loanPayments,
    commonAreaMaintenance,
    insurance,
    accountingFees,
    totalMonthly
  };

  // Calculate phase summary
  const totalRecurring = durationMonths !== undefined ? totalMonthly * durationMonths : 0;

  // Calculate transition net (lot sales/purchases)
  let transitionNet = 0;
  state.transactionHistory.forEach(tx => {
    if (tx.from === 'COPRO' && tx.type === 'LOT_SALE') {
      transitionNet += tx.amount;
    }
    if (tx.type === 'REDISTRIBUTION') {
      transitionNet -= tx.amount;
    }
  });

  const phaseSummary = {
    durationMonths: durationMonths || 0,
    totalRecurring,
    transitionNet,
    phaseNetCashImpact: totalRecurring + transitionNet
  };

  // Calculate balance sheet
  const cashReserve = copro.cashReserve;

  // Calculate value of owned lots
  let lotsOwnedValue = 0;
  copro.lotsOwned.forEach(_lotId => {
    // Estimate lot value based on price per m2
    // Assume standard lot size for hidden lots (100 m2 as placeholder)
    const lotSurface = 100; // TODO: Get actual lot surface from unit details
    lotsOwnedValue += snapshot.pricePerM2 * lotSurface;
  });

  const outstandingLoans = copro.loans.reduce((sum, loan) => sum + loan.remainingBalance, 0);
  const netWorth = cashReserve + lotsOwnedValue - outstandingLoans;

  const balanceSheet = {
    cashReserve,
    lotsOwnedValue,
    outstandingLoans,
    netWorth
  };

  return {
    monthlyRecurring,
    phaseSummary,
    balanceSheet
  };
}

/**
 * Create a phase projection from current state
 *
 * Calls calculateAll() to get financial snapshot,
 * then wraps it with phase metadata.
 */
function createPhaseProjection(
  state: ProjectionState,
  phaseNumber: number,
  startDate: Date,
  unitDetails: UnitDetails,
  triggeringEvent: DomainEvent,
  previousPhases: PhaseProjection[]
): PhaseProjection {
  // Reuse existing calculation engine
  const snapshot = calculateAll(
    state.participants,
    state.projectParams,
    state.scenario,
    unitDetails
  );

  // Calculate cash flows for all participants
  const participantCashFlows = new Map<string, ParticipantCashFlow>();
  state.participants.forEach(participant => {
    const cashFlow = calculateParticipantCashFlow(
      participant,
      snapshot,
      state,
      phaseNumber,
      undefined, // Duration not known yet
      previousPhases
    );
    participantCashFlows.set(participant.name, cashFlow);
  });

  // Calculate copro cash flow
  const coproproprieteCashFlow = calculateCoproCashFlow(
    state,
    snapshot,
    undefined, // Duration not known yet
    unitDetails
  );

  return {
    phaseNumber,
    startDate,
    endDate: undefined, // Set by next event
    durationMonths: undefined,
    participants: state.participants,
    copropropriete: state.copropropriete,
    projectParams: state.projectParams,
    scenario: state.scenario,
    snapshot,
    participantCashFlows,
    coproproprieteCashFlow,
    triggeringEvent
  };
}

// Export ProjectionState type for tests
export type { ProjectionState };
