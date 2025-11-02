/**
 * Timeline Calculations
 *
 * Per-transaction calculations from deed date
 */

import type { Lot } from '../types/timeline';

/**
 * Calculate months between two dates
 */
export function monthsBetween(startDate: Date, endDate: Date): number {
  const start = new Date(startDate);
  const end = new Date(endDate);

  const yearDiff = end.getFullYear() - start.getFullYear();
  const monthDiff = end.getMonth() - start.getMonth();

  return yearDiff * 12 + monthDiff;
}

/**
 * Sale price breakdown result
 */
export interface SalePriceBreakdown {
  base: number;
  indexation: number;
  carryingCosts: number;
  feeRecovery: number;
  total: number;
  monthsHeld: number;
}

/**
 * Calculate sale price for a lot based on holding duration from deed date
 *
 * Formula:
 * - Base: original purchase price
 * - Indexation: 3% per year (compound)
 * - Carrying costs: monthly cost × months held (portage only)
 * - Fee recovery: 60% of notary fees if sold within 2 years
 *
 * @param lot The lot being sold
 * @param saleDate The date of sale
 * @returns Sale price breakdown
 */
export function calculateSalePrice(lot: Lot, saleDate: Date): SalePriceBreakdown {
  const monthsHeld = monthsBetween(lot.acquiredDate, saleDate);
  const yearsHeld = monthsHeld / 12;

  // Base price
  const base = lot.originalPrice || 0;

  // Indexation (3% per year, compounded)
  const indexationRate = 0.03;
  const indexation = base * (Math.pow(1 + indexationRate, yearsHeld) - 1);

  // Carrying costs (portage lots only)
  const carryingCosts = lot.isPortage && lot.monthlyCarryingCost
    ? lot.monthlyCarryingCost * monthsHeld
    : 0;

  // Fee recovery (60% if sold within 2 years)
  const feeRecovery = monthsHeld < 24 && lot.originalNotaryFees
    ? lot.originalNotaryFees * 0.6
    : 0;

  const total = base + indexation + carryingCosts + feeRecovery;

  return {
    base,
    indexation,
    carryingCosts,
    feeRecovery,
    total,
    monthsHeld,
  };
}
