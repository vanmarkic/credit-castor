/**
 * Timeline Export/Import (Phase 5.2)
 *
 * JSON serialization for timeline with proper date handling
 */

import type { DomainEvent } from '../types/timeline';

interface TimelineExport {
  version: number;
  exportedAt: string;
  events: any[];
}

/**
 * Export timeline events to JSON string
 *
 * @param events - Domain events to export
 * @returns JSON string with serialized events
 */
export function exportTimelineToJSON(events: DomainEvent[]): string {
  const exportData: TimelineExport = {
    version: 1,
    exportedAt: new Date().toISOString(),
    events: events.map(serializeEvent),
  };

  return JSON.stringify(exportData, null, 2);
}

/**
 * Import timeline events from JSON string
 *
 * @param json - JSON string to parse
 * @returns Array of domain events with Date objects
 */
export function importTimelineFromJSON(json: string): DomainEvent[] {
  const data = JSON.parse(json);

  if (!data || typeof data !== 'object' || !data.version) {
    throw new Error('Invalid timeline export: missing version');
  }

  if (!Array.isArray(data.events)) {
    throw new Error('Invalid timeline export: events must be an array');
  }

  return data.events.map(deserializeEvent);
}

/**
 * Serialize event with proper date handling
 */
function serializeEvent(event: DomainEvent): any {
  return {
    ...event,
    date: event.date.toISOString(),
    participants: event.type === 'INITIAL_PURCHASE' || event.type === 'NEWCOMER_JOINS' || event.type === 'HIDDEN_LOT_REVEALED'
      ? serializeParticipants(event)
      : undefined,
  };
}

/**
 * Serialize participants with dates
 */
function serializeParticipants(event: any): any[] {
  const participants = event.type === 'INITIAL_PURCHASE'
    ? event.participants
    : event.type === 'NEWCOMER_JOINS' || event.type === 'HIDDEN_LOT_REVEALED'
    ? [event.buyer]
    : [];

  return participants.map((p: any) => ({
    ...p,
    entryDate: p.entryDate ? new Date(p.entryDate).toISOString() : undefined,
    exitDate: p.exitDate ? new Date(p.exitDate).toISOString() : undefined,
    lotsOwned: p.lotsOwned?.map((lot: any) => ({
      ...lot,
      acquiredDate: new Date(lot.acquiredDate).toISOString(),
      soldDate: lot.soldDate ? new Date(lot.soldDate).toISOString() : undefined,
    })),
  }));
}

/**
 * Deserialize event with Date objects
 */
function deserializeEvent(event: any): DomainEvent {
  const baseEvent = {
    ...event,
    date: new Date(event.date),
  };

  // Deserialize participants based on event type
  if (event.type === 'INITIAL_PURCHASE') {
    return {
      ...baseEvent,
      participants: deserializeParticipants(event.participants),
    };
  }

  if (event.type === 'NEWCOMER_JOINS' || event.type === 'HIDDEN_LOT_REVEALED') {
    return {
      ...baseEvent,
      buyer: deserializeParticipant(event.buyer),
    } as DomainEvent;
  }

  // For other event types (COPRO_TAKES_LOAN, PARTICIPANT_EXITS, PORTAGE_SETTLEMENT, etc.)
  return baseEvent as DomainEvent;
}

/**
 * Deserialize participants array
 */
function deserializeParticipants(participants: any[]): any[] {
  return participants.map(deserializeParticipant);
}

/**
 * Deserialize single participant with dates
 */
function deserializeParticipant(p: any): any {
  return {
    ...p,
    entryDate: p.entryDate ? new Date(p.entryDate) : undefined,
    exitDate: p.exitDate ? new Date(p.exitDate) : undefined,
    lotsOwned: p.lotsOwned?.map((lot: any) => ({
      ...lot,
      acquiredDate: new Date(lot.acquiredDate),
      soldDate: lot.soldDate ? new Date(lot.soldDate) : undefined,
    })),
  };
}
