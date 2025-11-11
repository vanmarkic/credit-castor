/**
 * Calculator to Timeline Bridge (Phase 5.1)
 *
 * Converts calculator inputs to InitialPurchaseEvent for timeline
 */

import type { Participant, ProjectParams, CalculationResults } from './calculatorUtils';
import type { InitialPurchaseEvent, Lot } from '../types/timeline';
import { calculateAll } from './calculatorUtils';

/**
 * Convert calculator inputs to InitialPurchaseEvent
 *
 * @param participants - Calculator participants
 * @param projectParams - Project parameters
 * @param deedDate - Deed date (T0)
 * @param coproName - Optional copropriété name
 * @param hiddenLots - Optional hidden lot IDs
 * @param coproReservesShare - Percentage of copro sales going to reserves (default 30%)
 * @returns InitialPurchaseEvent ready for timeline
 */
export function convertCalculatorToInitialPurchaseEvent(
  participants: Participant[],
  projectParams: ProjectParams,
  deedDate: Date,
  coproName: string = 'Copropriété',
  hiddenLots: number[] = []
): InitialPurchaseEvent {
  // Build basic unit details from global CASCO
  const unitDetails: Record<number, any> = {};
  participants.forEach(p => {
    if (p.unitId) {
      unitDetails[p.unitId] = {
        casco: (p.surface || 0) * projectParams.globalCascoPerM2,
        parachevements: (p.surface || 0) * (p.parachevementsPerM2 || 0),
      };
    }
  });

  // Calculate all financial details
  const results = calculateAll(participants, projectParams, unitDetails);

  // Convert each participant to timeline format
  let lotIdCounter = 1;
  const timelineParticipants: Participant[] = participants.map((p, participantIndex) => {
    const participantResults = results.participantBreakdown[participantIndex];
    const quantity = p.quantity || 1;

    // Create lots for this participant
    const lotsOwned: Lot[] = [];
    for (let i = 0; i < quantity; i++) {
      const isPortage = i > 0; // First lot is own, rest are portage

      const pricePerLot = (participantResults.purchaseShare || 0) / quantity;
      const notaryPerLot = (participantResults.notaryFees || 0) / quantity;

      // Construction cost per lot includes:
      // - CASCO
      // - Parachevements
      // - Travaux communs (per unit share)
      const constructionCostPerLot = (participantResults.constructionCost || 0) / quantity;

      lotsOwned.push({
        lotId: lotIdCounter++,
        surface: p.surface || 0,
        unitId: p.unitId || 0,
        isPortage,
        acquiredDate: deedDate,
        originalPrice: pricePerLot,
        originalNotaryFees: notaryPerLot,
        originalConstructionCost: constructionCostPerLot,
        monthlyCarryingCost: isPortage ? calculateMonthlyCarryingCost(participantResults, quantity) : undefined,
      });
    }

    return {
      ...p,
      isFounder: true,
      entryDate: deedDate,
      lotsOwned,
    };
  });

  // Generate unique event ID
  const eventId = `evt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  return {
    id: eventId,
    date: deedDate,
    type: 'INITIAL_PURCHASE',
    participants: timelineParticipants,
    projectParams,
    // scenario removed - no longer using percentage-based adjustments
    copropropriete: {
      name: coproName,
      hiddenLots,
    },
  };
}

/**
 * Calculate monthly carrying cost for portage lots
 */
function calculateMonthlyCarryingCost(
  participantResults: CalculationResults['participantBreakdown'][0],
  quantity: number
): number {
  // Monthly carrying cost = (loan payment + taxes + insurance) / quantity
  // This is a simplified calculation
  const monthlyLoan = participantResults.monthlyPayment || 0;

  // Estimate monthly costs (would need actual tax/insurance data)
  const estimatedMonthlyTax = 50; // Placeholder
  const estimatedMonthlyInsurance = 30; // Placeholder

  return (monthlyLoan + estimatedMonthlyTax + estimatedMonthlyInsurance) / quantity;
}
