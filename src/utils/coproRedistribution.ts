/**
 * Copropriété Redistribution (Time-Based)
 *
 * Implements time-based redistribution when copropriété sells hidden lots.
 * This is different from surface-based redistribution (portageCalculations.ts).
 *
 * Business Rule:
 * - When copropriété sells a lot, the proceeds are distributed to participants
 * - Only participants who entered BEFORE the sale date are eligible
 * - Distribution is proportional to time spent in the project
 * - Share = (participant months in project) / (total months of all eligible participants)
 *
 * All functions are pure (no side effects) for testability.
 */

import { AVERAGE_DAYS_PER_MONTH as AVERAGE_DAYS_PER_MONTH_IMPORT } from './timeConstants';

// Re-export for backwards compatibility
export { AVERAGE_DAYS_PER_MONTH_IMPORT as AVERAGE_DAYS_PER_MONTH };

// ============================================
// Types
// ============================================

/**
 * Represents a sale from copropriété to a buyer
 */
export interface CoproSale {
  buyer: string;
  entryDate: Date;
  amount: number;
}

/**
 * Participant with entry date information
 */
export interface ParticipantWithEntry {
  name: string;
  entryDate?: Date;
}

/**
 * Redistribution payback result for UI display
 */
export interface RedistributionPayback {
  date: Date;
  buyer: string;
  amount: number;
  type: 'copro';
  description: string;
  monthsInProject: number;
  shareRatio: number;
}

// ============================================
// Core Functions
// ============================================

/**
 * Calculate months between two dates (using average month length)
 *
 * Uses the average month length (30.44 days) to convert time differences
 * to months. This accounts for varying month lengths and leap years.
 *
 * @param start - Start date
 * @param end - End date
 * @returns Number of months (can be fractional, can be negative if end < start)
 *
 * @example
 * const months = calculateMonthsBetween(
 *   new Date('2024-01-01'),
 *   new Date('2024-04-01')
 * );
 * // Returns approximately 2.989 (91 days / 30.44)
 */
export function calculateMonthsBetween(start: Date, end: Date): number {
  const diffMs = end.getTime() - start.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  return diffDays / AVERAGE_DAYS_PER_MONTH;
}

/**
 * Filter participants eligible for redistribution (entered before sale date)
 *
 * Business rule: Only participants who entered before the sale date are
 * eligible to receive a share of the redistribution.
 *
 * @param participants - All participants in the project
 * @param saleDate - Date when the copropriété lot was sold
 * @param deedDate - Default entry date for participants without explicit entryDate
 * @returns Array of eligible participants with their months in project
 *
 * @example
 * const eligible = getEligibleParticipants(
 *   [
 *     { name: 'Alice', entryDate: new Date('2024-01-01') },
 *     { name: 'Bob', entryDate: new Date('2024-07-01') }
 *   ],
 *   new Date('2024-06-01'),
 *   new Date('2024-01-01')
 * );
 * // Returns only Alice (Bob entered after sale)
 */
export function getEligibleParticipants(
  participants: ParticipantWithEntry[],
  saleDate: Date,
  deedDate: Date
): Array<{ name: string; entryDate: Date; monthsInProject: number }> {
  return participants
    .map(p => {
      const entryDate = p.entryDate ? new Date(p.entryDate) : new Date(deedDate);
      const monthsInProject = calculateMonthsBetween(entryDate, saleDate);
      return {
        name: p.name,
        entryDate,
        monthsInProject
      };
    })
    .filter(p => p.entryDate < saleDate);
}

/**
 * Calculate share ratio for a participant based on time in project
 *
 * Share ratio = (participant months) / (total months of all eligible participants)
 *
 * @param participantMonths - Months this participant spent in project
 * @param totalMonths - Sum of months for all eligible participants
 * @returns Share ratio (0-1), or 0 if totalMonths is 0
 *
 * @example
 * const ratio = calculateShareRatio(5, 15);
 * // Returns 0.333... (5/15)
 */
export function calculateShareRatio(
  participantMonths: number,
  totalMonths: number
): number {
  if (totalMonths === 0) {
    return 0;
  }
  return participantMonths / totalMonths;
}

/**
 * Calculate copropriété redistribution for a single participant
 *
 * For each copropriété sale, this function:
 * 1. Checks if participant is eligible (entered before sale)
 * 2. Calculates months in project until sale
 * 3. Finds all other eligible participants
 * 4. Calculates proportional share based on time
 * 5. Returns redistribution payback details
 *
 * @param participant - The participant to calculate redistributions for
 * @param coproSales - All copropriété sales that occurred
 * @param allParticipants - All participants in the project (for eligibility check)
 * @param deedDate - Default entry date for participants without explicit entryDate
 * @returns Array of redistribution paybacks (one per eligible sale)
 *
 * @example
 * const redistributions = calculateCoproRedistributionForParticipant(
 *   { name: 'Alice', entryDate: new Date('2024-01-01') },
 *   [
 *     { buyer: 'Dan', entryDate: new Date('2024-06-01'), amount: 100000 }
 *   ],
 *   [
 *     { name: 'Alice', entryDate: new Date('2024-01-01') },
 *     { name: 'Bob', entryDate: new Date('2024-01-01') }
 *   ],
 *   new Date('2024-01-01')
 * );
 * // Returns [{ buyer: 'Dan', amount: 50000, shareRatio: 0.5, ... }]
 */
export function calculateCoproRedistributionForParticipant(
  participant: ParticipantWithEntry,
  coproSales: CoproSale[],
  allParticipants: ParticipantWithEntry[],
  deedDate: Date
): RedistributionPayback[] {
  const participantEntryDate = participant.entryDate
    ? new Date(participant.entryDate)
    : new Date(deedDate);

  return coproSales
    .map(sale => {
      const saleDate = new Date(sale.entryDate);

      // Only participants who entered before the sale date get a share
      if (participantEntryDate >= saleDate) {
        return null;
      }

      // Calculate months in project until sale
      const monthsInProject = calculateMonthsBetween(participantEntryDate, saleDate);

      // Get all eligible participants for this sale
      const eligibleParticipants = getEligibleParticipants(
        allParticipants,
        saleDate,
        deedDate
      );

      // Calculate total months for all eligible participants
      const totalMonths = eligibleParticipants.reduce(
        (sum, p) => sum + p.monthsInProject,
        0
      );

      // Calculate this participant's share
      const shareRatio = calculateShareRatio(monthsInProject, totalMonths);
      const shareAmount = sale.amount * shareRatio;

      return {
        date: sale.entryDate,
        buyer: sale.buyer,
        amount: shareAmount,
        type: 'copro' as const,
        description: `Part copropriété (${(shareRatio * 100).toFixed(1)}%)`,
        monthsInProject,
        shareRatio
      };
    })
    .filter((r): r is RedistributionPayback => r !== null);
}
