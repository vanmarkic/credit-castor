import type { Participant, CalculationResults } from './calculatorUtils';
import type { CoproLot } from '../types/timeline';
// timelineProjection removed - event sourcing feature was dropped

export interface AvailableLot {
  lotId: number;
  surface: number;
  source: 'FOUNDER' | 'COPRO';
  surfaceImposed: boolean;
  fromParticipant?: string; // If source = FOUNDER
  totalCoproSurface?: number; // If source = COPRO (for ratio calculation)

  // Portage lot pricing data (for FOUNDER lots)
  originalPrice?: number;
  originalNotaryFees?: number;
  originalConstructionCost?: number;
}

/**
 * Get all lots available for a newcomer to purchase
 *
 * Rules:
 * - Founders' portage lots (isPortage = true) with imposed surface
 * - Copropriété lots with free surface choice
 *
 * @param participants - List of participants
 * @param coproLots - Copropriété lots
 * @param calculations - Optional calculation results to dynamically compute acquisition costs
 */
export function getAvailableLotsForNewcomer(
  participants: Participant[],
  coproLots: CoproLot[],
  calculations?: CalculationResults
): AvailableLot[] {
  const available: AvailableLot[] = [];

  // Add portage lots from founders
  for (let i = 0; i < participants.length; i++) {
    const participant = participants[i];
    if (participant.isFounder && participant.lotsOwned) {
      // Get participant's calculation results if available
      const participantCalc = calculations?.participantBreakdown[i];
      const quantity = participant.quantity || 1;

      for (const lot of participant.lotsOwned) {
        if (lot.isPortage && !lot.soldDate) {
          // Use lot's stored values if available, otherwise calculate dynamically
          let originalPrice = lot.originalPrice;
          let originalNotaryFees = lot.originalNotaryFees;
          let originalConstructionCost = lot.originalConstructionCost;

          // If calculations are provided and lot doesn't have values, calculate them
          if (participantCalc && (!originalPrice || !originalNotaryFees || !originalConstructionCost)) {
            originalPrice = (participantCalc.purchaseShare || 0) / quantity;
            originalNotaryFees = (participantCalc.droitEnregistrements || 0) / quantity;
            originalConstructionCost = (participantCalc.constructionCost || 0) / quantity;
          }

          available.push({
            lotId: lot.lotId,
            surface: lot.allocatedSurface || lot.surface,
            source: 'FOUNDER',
            surfaceImposed: true,
            fromParticipant: participant.name,
            originalPrice,
            originalNotaryFees,
            originalConstructionCost
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
