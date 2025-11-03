import type { Participant } from './calculatorUtils';
import type { CoproLot } from '../types/timeline';
import type { ParticipantTimeline } from './timelineProjection';

export interface AvailableLot {
  lotId: number;
  surface: number;
  source: 'FOUNDER' | 'COPRO';
  surfaceImposed: boolean;
  fromParticipant?: string; // If source = FOUNDER
  totalCoproSurface?: number; // If source = COPRO (for ratio calculation)
}

/**
 * Get all lots available for a newcomer to purchase
 *
 * Rules:
 * - Founders' portage lots (isPortage = true) with imposed surface
 * - Copropriété lots with free surface choice
 */
export function getAvailableLotsForNewcomer(
  participants: Participant[] | ParticipantTimeline[],
  coproLots: CoproLot[]
): AvailableLot[] {
  const available: AvailableLot[] = [];

  // Normalize participants to Participant type
  const normalizedParticipants: Participant[] = participants.map(p => {
    // If it's a ParticipantTimeline, extract the participant
    if ('participant' in p) {
      return p.participant;
    }
    // Otherwise it's already a Participant
    return p;
  });

  // Add portage lots from founders
  for (const participant of normalizedParticipants) {
    if (participant.isFounder && participant.lotsOwned) {
      for (const lot of participant.lotsOwned) {
        if (lot.isPortage && !lot.soldDate) {
          available.push({
            lotId: lot.lotId,
            surface: lot.allocatedSurface || lot.surface,
            source: 'FOUNDER',
            surfaceImposed: true,
            fromParticipant: participant.name
          });
        }
      }
    }
  }

  // Add copro lots
  for (const coproLot of coproLots) {
    if (!coproLot.soldDate) {
      available.push({
        lotId: coproLot.lotId,
        surface: coproLot.surface,
        source: 'COPRO',
        surfaceImposed: false,
        totalCoproSurface: coproLot.surface
      });
    }
  }

  return available;
}
