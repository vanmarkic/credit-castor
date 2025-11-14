/**
 * Chronology Calculations - Event Reducers
 *
 * Implements event sourcing for timeline:
 * - Events → State transformations
 * - Pure functions (no side effects)
 * - Projections derived by replaying events
 */

import type { Participant } from './calculatorUtils';
import type {
  DomainEvent,
  InitialPurchaseEvent,
  NewcomerJoinsEvent,
  HiddenLotRevealedEvent,
  PortageSettlementEvent,
  CoproTakesLoanEvent,
  ParticipantExitsEvent,
  CoproSaleEvent,
  Loan,
  ProjectionState,
  Transaction,
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
    deedDate: '2026-02-01', // Default deed date
    coproReservesShare: 30, // Default copro reserves share (30%)
    // scenario removed - no longer using percentage-based adjustments
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

    case 'COPRO_SALE':
      return applyCoproSale(state, event);

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
    // scenario removed - no longer using percentage-based adjustments
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
      amount: event.droitEnregistrements,
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

/**
 * Apply COPRO_SALE event
 * Copropriété sells lot to newcomer with 30/70 distribution
 */
function applyCoproSale(
  state: ProjectionState,
  event: CoproSaleEvent
): ProjectionState {
  // 1. Add buyer as participant
  const newParticipant = convertToParticipant(event.buyer);

  // 2. Remove or reduce copro lot
  // Note: CoproSaleEvent allows buying any surface from copro lots,
  // so we need to either remove the lot or reduce its surface
  const updatedCoproLots = state.copropropriete.lotsOwned
    .map(lot => {
      if (lot.lotId === event.lotId) {
        const remainingSurface = lot.surface - event.surfacePurchased;
        if (remainingSurface <= 0) {
          return null; // Remove lot entirely
        }
        // Reduce surface
        return { ...lot, surface: remainingSurface };
      }
      return lot;
    })
    .filter((lot): lot is CoproLot => lot !== null);

  // 3. Update copro cash reserve with 30%
  const updatedCopro = {
    ...state.copropropriete,
    lotsOwned: updatedCoproLots,
    cashReserve: state.copropropriete.cashReserve + event.distribution.toCoproReserves
  };

  // 4. Record transactions
  const transactions: Transaction[] = [];

  // Lot sale transaction
  transactions.push({
    type: 'LOT_SALE',
    from: 'COPRO',
    to: event.buyer.name,
    amount: event.salePrice,
    date: event.date,
    breakdown: event.breakdown
  });

  // Notary fees transaction
  transactions.push({
    type: 'NOTARY_FEES',
    from: event.buyer.name,
    to: 'NOTARY',
    amount: event.droitEnregistrements,
    date: event.date
  });

  // Redistribution transactions (70% split by quotité)
  Object.entries(event.distribution.toParticipants).forEach(([participantName, distribution]) => {
    transactions.push({
      type: 'REDISTRIBUTION',
      from: 'COPRO',
      to: participantName,
      amount: distribution.amount,
      date: event.date,
      metadata: { quotite: distribution.quotite }
    });
  });

  return {
    ...state,
    currentDate: event.date,
    participants: [...state.participants, newParticipant],
    copropropriete: updatedCopro,
    transactionHistory: [...state.transactionHistory, ...transactions]
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


// Export ProjectionState type for tests
export type { ProjectionState };
