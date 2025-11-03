/**
 * Timeline Projection (Phase 2.3 & 2.4)
 *
 * Builds participant timelines and continuous project timeline
 */

import type { DomainEvent, InitialPurchaseEvent, Lot, CoproEntity } from '../types/timeline';
import type { Participant } from './calculatorUtils';
import type { ParticipantCashFlow } from '../types/cashFlow';
import { buildParticipantCashFlow } from './cashFlowProjection';
import { applyEvent, createInitialState } from './chronologyCalculations';

/**
 * Status of a participant in the project
 */
export type ParticipantStatus = 'ACTIVE' | 'PORTAGE' | 'EXITED';

/**
 * Participant timeline - complete journey of a participant
 */
export interface ParticipantTimeline {
  participant: Participant;
  events: DomainEvent[]; // Events involving this participant
  lotsHistory: Lot[]; // All lots ever owned
  currentLots: Lot[]; // Currently owned lots
  status: ParticipantStatus;
  cashFlow: ParticipantCashFlow;
}

/**
 * Complete continuous timeline for the project
 */
export interface ContinuousTimeline {
  deedDate: Date; // T0 - the initial deed date
  participants: ParticipantTimeline[];
  copropropriete: CoproEntity;
  events: DomainEvent[];
}

/**
 * Build timeline for a single participant
 *
 * @param events - All domain events
 * @param participantName - Name of participant
 * @returns Complete participant timeline
 */
export function buildParticipantTimeline(
  events: DomainEvent[],
  participantName: string
): ParticipantTimeline {
  // Find initial purchase event
  const initialEvent = events.find(e => e.type === 'INITIAL_PURCHASE') as InitialPurchaseEvent | undefined;

  if (!initialEvent) {
    return createEmptyParticipantTimeline(participantName);
  }

  // Get current state by replaying all events
  let state = createInitialState();
  for (const event of events) {
    state = applyEvent(state, event);
  }

  // Find participant in current state
  const participant = state.participants.find(p => p.name === participantName);

  if (!participant) {
    return createEmptyParticipantTimeline(participantName);
  }

  // Determine participant status
  const status = determineStatus(participant);

  // Build cash flow
  const cashFlow = buildParticipantCashFlow(events, participantName);

  // Collect lots history (all lots ever owned)
  const lotsHistory = collectLotsHistory(participant);

  // Current lots
  const currentLots = participant.lotsOwned || [];

  // Filter events relevant to this participant
  const relevantEvents = filterParticipantEvents(events, participantName);

  return {
    participant,
    events: relevantEvents,
    lotsHistory,
    currentLots,
    status,
    cashFlow,
  };
}

/**
 * Build complete continuous timeline for project
 *
 * @param events - All domain events
 * @returns Complete timeline with all participants
 */
export function projectContinuousTimeline(events: DomainEvent[]): ContinuousTimeline {
  // Extract deed date from initial purchase event
  const initialEvent = events.find(e => e.type === 'INITIAL_PURCHASE') as InitialPurchaseEvent | undefined;
  const deedDate = initialEvent?.date || new Date();

  // Get final state by replaying all events
  let state = createInitialState();
  for (const event of events) {
    state = applyEvent(state, event);
  }

  // Build timeline for each participant
  const participantNames = state.participants.map(p => p.name);
  const participants = participantNames.map(name =>
    buildParticipantTimeline(events, name)
  );

  return {
    deedDate,
    participants,
    copropropriete: state.copropropriete,
    events,
  };
}

/**
 * Determine participant status based on current lots
 */
function determineStatus(participant: Participant): ParticipantStatus {
  const lots = participant.lotsOwned || [];

  if (lots.length === 0) {
    return 'EXITED';
  }

  const hasPortageLot = lots.some(lot => lot.isPortage);
  return hasPortageLot ? 'PORTAGE' : 'ACTIVE';
}

/**
 * Collect complete lots history for participant
 */
function collectLotsHistory(participant: Participant): Lot[] {
  // For now, return current lots as history
  // TODO: Track sold lots from event history
  return [...(participant.lotsOwned || [])];
}

/**
 * Filter events relevant to a participant
 */
function filterParticipantEvents(events: DomainEvent[], participantName: string): DomainEvent[] {
  return events.filter(event => {
    switch (event.type) {
      case 'INITIAL_PURCHASE':
        return event.participants.some(p => p.name === participantName);

      case 'NEWCOMER_JOINS':
        return event.buyer.name === participantName || event.acquisition.from === participantName;

      case 'HIDDEN_LOT_REVEALED':
        return event.buyer.name === participantName ||
          Object.keys(event.redistribution).includes(participantName);

      case 'PORTAGE_SETTLEMENT':
        return event.seller === participantName || event.buyer === participantName;

      case 'PARTICIPANT_EXITS':
        return event.participant === participantName || event.buyerName === participantName;

      case 'COPRO_TAKES_LOAN':
        // All participants affected by copro loans
        return true;

      default:
        return false;
    }
  });
}

/**
 * Create empty participant timeline
 */
function createEmptyParticipantTimeline(participantName: string): ParticipantTimeline {
  return {
    participant: {
      name: participantName,
      lotsOwned: [],
      capitalApporte: 0,
      notaryFeesRate: 0,
      interestRate: 0,
      durationYears: 0,
    },
    events: [],
    lotsHistory: [],
    currentLots: [],
    status: 'ACTIVE',
    cashFlow: {
      participantName,
      transactions: [],
      summary: {
        totalInvested: 0,
        totalReceived: 0,
        netPosition: 0,
        monthlyBurnRate: 0,
      },
    },
  };
}
