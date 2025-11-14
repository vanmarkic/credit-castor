/**
 * Lot validation utilities
 * Enforces business rule: Total available lots (founder + copropriété) = configurable maximum
 */

import type { Participant } from './calculatorUtils';
import type { CoproLot } from '../types/timeline';

/**
 * Default maximum total number of lots allowed (founder lots + copropriété lots)
 * Can be overridden via ProjectParams.maxTotalLots
 */
export const DEFAULT_MAX_TOTAL_LOTS = 10;

/**
 * Count total lots across all participants
 * Includes all lots owned by participants (founder lots + portage lots)
 */
export function countParticipantLots(participants: Participant[]): number {
  return participants.reduce((total, participant) => {
    if (participant.lotsOwned) {
      return total + participant.lotsOwned.length;
    }
    // Fallback to legacy quantity field if lotsOwned is not set
    return total + (participant.quantity || 1);
  }, 0);
}

/**
 * Count copropriété lots (hidden lots)
 */
export function countCoproLots(coproLots: CoproLot[]): number {
  return coproLots.length;
}

/**
 * Count total lots (participant lots + copropriété lots)
 */
export function countTotalLots(
  participants: Participant[],
  coproLots: CoproLot[]
): number {
  return countParticipantLots(participants) + countCoproLots(coproLots);
}

/**
 * Check if adding a lot would exceed the maximum
 * @param currentTotal - Current total lot count
 * @param maxTotalLots - Maximum total lots allowed (default: DEFAULT_MAX_TOTAL_LOTS)
 * @param lotsToAdd - Number of lots to add (default: 1)
 * @returns true if adding would exceed maxTotalLots
 */
export function wouldExceedMaxLots(
  currentTotal: number,
  maxTotalLots: number = DEFAULT_MAX_TOTAL_LOTS,
  lotsToAdd: number = 1
): boolean {
  return currentTotal + lotsToAdd > maxTotalLots;
}

/**
 * Get remaining lot capacity
 * @param currentTotal - Current total lot count
 * @param maxTotalLots - Maximum total lots allowed (default: DEFAULT_MAX_TOTAL_LOTS)
 * @returns Number of lots that can still be added
 */
export function getRemainingLotCapacity(
  currentTotal: number,
  maxTotalLots: number = DEFAULT_MAX_TOTAL_LOTS
): number {
  return Math.max(0, maxTotalLots - currentTotal);
}

/**
 * Validate if adding a portage lot is allowed
 * @param participants - Current participants
 * @param coproLots - Current copropriété lots
 * @param maxTotalLots - Maximum total lots allowed (default: DEFAULT_MAX_TOTAL_LOTS)
 * @returns Object with isValid flag and error message if invalid
 */
export function validateAddPortageLot(
  participants: Participant[],
  coproLots: CoproLot[],
  maxTotalLots: number = DEFAULT_MAX_TOTAL_LOTS
): { isValid: boolean; error?: string } {
  const currentTotal = countTotalLots(participants, coproLots);
  
  if (wouldExceedMaxLots(currentTotal, maxTotalLots, 1)) {
    const remaining = getRemainingLotCapacity(currentTotal, maxTotalLots);
    return {
      isValid: false,
      error: `Cannot add lot: Maximum of ${maxTotalLots} total lots reached. ${remaining} lot${remaining !== 1 ? 's' : ''} remaining.`
    };
  }
  
  return { isValid: true };
}

/**
 * Validate if adding a copropriété lot is allowed
 * @param participants - Current participants
 * @param coproLots - Current copropriété lots
 * @param maxTotalLots - Maximum total lots allowed (default: DEFAULT_MAX_TOTAL_LOTS)
 * @returns Object with isValid flag and error message if invalid
 */
export function validateAddCoproLot(
  participants: Participant[],
  coproLots: CoproLot[],
  maxTotalLots: number = DEFAULT_MAX_TOTAL_LOTS
): { isValid: boolean; error?: string } {
  const currentTotal = countTotalLots(participants, coproLots);
  
  if (wouldExceedMaxLots(currentTotal, maxTotalLots, 1)) {
    const remaining = getRemainingLotCapacity(currentTotal, maxTotalLots);
    return {
      isValid: false,
      error: `Cannot add copropriété lot: Maximum of ${maxTotalLots} total lots reached. ${remaining} lot${remaining !== 1 ? 's' : ''} remaining.`
    };
  }
  
  return { isValid: true };
}

