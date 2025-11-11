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

import { AVERAGE_DAYS_PER_MONTH } from './timeConstants';

// Re-export for backwards compatibility
export { AVERAGE_DAYS_PER_MONTH };

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
 * Business rule: Only founders who entered before the sale date are
 * eligible to receive a share of the redistribution.
 *
 * @param participants - All participants in the project
 * @param saleDate - Date when the copropriété lot was sold
 * @param deedDate - Default entry date for participants without explicit entryDate
 * @returns Array of eligible founders with their surface area
 *
 * @example
 * const eligible = getEligibleParticipants(
 *   [
 *     { name: 'Alice', isFounder: true, surface: 100, entryDate: new Date('2024-01-01') },
 *     { name: 'Bob', isFounder: true, surface: 50, entryDate: new Date('2024-07-01') }
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
): Array<{ name: string; entryDate: Date; surface: number }> {
  return participants
    .filter(p => p.isFounder === true) // Only founders receive copro redistribution
    .map(p => {
      const entryDate = p.entryDate ? new Date(p.entryDate) : new Date(deedDate);
      const surface = p.surface || 0;
      return {
        name: p.name,
        entryDate,
        surface
      };
    })
    .filter(p => p.entryDate < saleDate);
}

/**
 * Calculate share ratio for a participant based on surface area
 *
 * Share ratio = (participant surface) / (total surface of all eligible participants)
 *
 * @param participantSurface - Surface area this participant owns (m²)
 * @param totalSurface - Sum of surface for all eligible participants
 * @returns Share ratio (0-1), or 0 if totalSurface is 0
 *
 * @example
 * const ratio = calculateShareRatio(100, 150);
 * // Returns 0.666... (100/150)
 */
export function calculateShareRatio(
  participantSurface: number,
  totalSurface: number
): number {
  if (totalSurface === 0) {
    return 0;
  }
  return participantSurface / totalSurface;
}

/**
 * Calculate copropriété redistribution for a single participant
 *
 * For each copropriété sale, this function:
 * 1. Checks if participant is a founder and eligible (entered before sale)
 * 2. Gets participant's surface area (m²)
 * 3. Finds all other eligible founders
 * 4. Calculates proportional share based on surface (quotité)
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
 *   { name: 'Alice', isFounder: true, surface: 100, entryDate: new Date('2024-01-01') },
 *   [
 *     { buyer: 'Dan', entryDate: new Date('2024-06-01'), amount: 100000 }
 *   ],
 *   [
 *     { name: 'Alice', isFounder: true, surface: 100, entryDate: new Date('2024-01-01') },
 *     { name: 'Bob', isFounder: true, surface: 50, entryDate: new Date('2024-01-01') }
 *   ],
 *   new Date('2024-01-01')
 * );
 * // Returns [{ buyer: 'Dan', amount: 66667, shareRatio: 0.6667, ... }] (100/150 × 100000)
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

      // Only founders who entered before the sale date get a share
      if (participantEntryDate >= saleDate || !participant.isFounder) {
        return null;
      }

      // Get participant's surface
      const participantSurface = participant.surface || 0;

      // Get all eligible founders for this sale
      const eligibleParticipants = getEligibleParticipants(
        allParticipants,
        saleDate,
        deedDate
      );

      // Calculate total surface for all eligible founders
      const totalSurface = eligibleParticipants.reduce(
        (sum, p) => sum + p.surface,
        0
      );

      // Calculate this participant's share based on surface quotité
      const shareRatio = calculateShareRatio(participantSurface, totalSurface);
      const shareAmount = sale.amount * shareRatio;

      return {
        date: sale.entryDate,
        buyer: sale.buyer,
        amount: shareAmount,
        type: 'copro' as const,
        description: `Part copropriété (${(shareRatio * 100).toFixed(1)}%)`,
        monthsInProject: 0, // Deprecated: keeping for backward compatibility
        shareRatio
      };
    })
    .filter((r): r is RedistributionPayback => r !== null);
}

// ============================================
// Distribution Split Calculations
// ============================================

/**
 * Calculate distribution percentages for copro reserves and founders
 *
 * When a copropriété sale occurs, the proceeds are split between:
 * - Copropriété reserves (typically 30%)
 * - Founders/participants (typically 70%)
 *
 * @param toCoproReserves - Amount going to copropriété reserves
 * @param toParticipants - Total amount going to participants (sum of all distributions)
 * @param totalPrice - Total sale price
 * @returns Object with coproReservesPercent and foundersPercent
 *
 * @example
 * const percentages = calculateDistributionPercentages(30000, 70000, 100000);
 * // Returns { coproReservesPercent: 30, foundersPercent: 70 }
 */
export function calculateDistributionPercentages(
  toCoproReserves: number,
  toParticipants: number,
  totalPrice: number
): { coproReservesPercent: number; foundersPercent: number } {
  if (totalPrice === 0) {
    return { coproReservesPercent: 0, foundersPercent: 0 };
  }
  return {
    coproReservesPercent: (toCoproReserves / totalPrice) * 100,
    foundersPercent: (toParticipants / totalPrice) * 100
  };
}

/**
 * Calculate quotité (ownership percentage) from distribution amount
 *
 * Quotité represents a participant's ownership percentage in the project.
 * This is calculated from their share of the total distribution.
 *
 * @param amount - Amount this participant receives
 * @param totalToParticipants - Total amount distributed to all participants
 * @returns Quotité percentage (0-100)
 *
 * @example
 * const quotite = calculateQuotiteFromAmount(35000, 70000);
 * // Returns 50 (this participant receives 50% of the distribution)
 */
export function calculateQuotiteFromAmount(
  amount: number,
  totalToParticipants: number
): number {
  if (totalToParticipants === 0) {
    return 0;
  }
  return (amount / totalToParticipants) * 100;
}

/**
 * Sum all amounts in a distribution map
 *
 * @param distribution - Map of participant names to amounts
 * @returns Total sum of all amounts
 *
 * @example
 * const total = sumDistributionAmounts(new Map([
 *   ['Alice', 35000],
 *   ['Bob', 35000]
 * ]));
 * // Returns 70000
 */
export function sumDistributionAmounts(
  distribution: Map<string, number>
): number {
  return Array.from(distribution.values()).reduce((sum, amt) => sum + amt, 0);
}

// ============================================
// Expected Paybacks Calculation
// ============================================

/**
 * Participant interface with purchase details for portage and copro sales
 */
export interface ParticipantWithPurchaseDetails extends ParticipantWithEntry {
  purchaseDetails?: {
    buyingFrom?: string;
    purchasePrice?: number;
  };
}

/**
 * Calculate total expected paybacks for a participant (pure function)
 *
 * This includes:
 * 1. Portage sales: when someone buys a portage lot from this participant
 * 2. Copropriété redistributions: when someone buys from copropriété and proceeds are redistributed
 *
 * The copro redistribution respects the coproReservesShare configuration:
 * - A portion goes to copro reserves (e.g., 60%)
 * - The remaining portion is redistributed to founders based on time in project
 *
 * @param participant - The participant to calculate paybacks for
 * @param allParticipants - All participants in the project
 * @param deedDate - Default entry date (T0)
 * @param coproReservesShare - Percentage of copro sales going to reserves (default 30%)
 * @returns Total amount expected to be received by this participant
 *
 * @example
 * const totalPaybacks = calculateExpectedPaybacksTotal(
 *   { name: 'Alice', entryDate: new Date('2024-01-01') },
 *   allParticipants,
 *   new Date('2024-01-01'),
 *   30 // 30% to reserves, 70% to participants
 * );
 */
export function calculateExpectedPaybacksTotal(
  participant: ParticipantWithPurchaseDetails,
  allParticipants: ParticipantWithPurchaseDetails[],
  deedDate: Date,
  coproReservesShare: number = 30
): number {
  // 1. Calculate portage paybacks (direct sales from this participant)
  const portagePaybacks = allParticipants
    .filter((buyer) => buyer.purchaseDetails?.buyingFrom === participant.name)
    .reduce((sum, buyer) => sum + (buyer.purchaseDetails?.purchasePrice || 0), 0);

  // 2. Calculate copropriété redistributions
  // First, apply the split to find amount that goes to participants
  const participantsShare = 1 - (coproReservesShare / 100);
  const coproSales: CoproSale[] = allParticipants
    .filter((buyer) => buyer.purchaseDetails?.buyingFrom === 'Copropriété')
    .map((buyer) => {
      const totalPrice = buyer.purchaseDetails?.purchasePrice || 0;
      const amountToParticipants = totalPrice * participantsShare;
      return {
        buyer: buyer.name,
        entryDate: buyer.entryDate || deedDate,
        amount: amountToParticipants
      };
    });

  // Calculate this participant's share of copro redistributions
  const coproRedistributions = calculateCoproRedistributionForParticipant(
    participant,
    coproSales,
    allParticipants,
    deedDate
  );

  const coproRedistributionTotal = coproRedistributions.reduce(
    (sum, r) => sum + r.amount,
    0
  );

  // 3. Return total of both portage and copro paybacks
  return portagePaybacks + coproRedistributionTotal;
}
