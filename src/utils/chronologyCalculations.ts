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
  ProjectionState,
  Transaction,
  ParticipantDetails
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
    case 'COPRO_TAKES_LOAN':
    case 'PARTICIPANT_EXITS':
      // TODO: Implement these handlers
      return state;

    default:
      // Exhaustive check (TypeScript will error if case missed)
      const _exhaustive: never = event;
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

  return {
    ...state,
    currentDate: event.date,
    participants,
    copropropriete: {
      name: event.copropropriete.name,
      lotsOwned: event.copropropriete.hiddenLots || [],
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
    if (p.name === event.acquisition.from && p.quantity > 1) {
      return { ...p, quantity: p.quantity - 1 };
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
    lotsOwned: state.copropropriete.lotsOwned.filter(id => id !== event.lotId),
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

// ============================================
// Helper Functions
// ============================================

/**
 * Convert ParticipantDetails (from event) to Participant (domain model)
 */
function convertToParticipant(details: ParticipantDetails): Participant {
  return {
    name: details.name,
    surface: details.surface,
    unitId: details.unitId,
    capitalApporte: details.capitalApporte,
    notaryFeesRate: details.notaryFeesRate,
    interestRate: details.interestRate,
    durationYears: details.durationYears,
    quantity: 1, // Default to 1 lot
    parachevementsPerM2: details.parachevementsPerM2,
    cascoSqm: details.cascoSqm,
    parachevementsSqm: details.parachevementsSqm
  };
}

// Export ProjectionState type for tests
export type { ProjectionState };
