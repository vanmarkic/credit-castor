/**
 * Rent-to-Own calculation helpers for state machine
 * Minimal implementation for XState integration
 */

import type { RentToOwnAgreement } from './types';

export interface RentToOwnPayment {
  month: Date;
  totalAmount: number;
  equityPortion: number;    // Builds toward purchase
  rentPortion: number;      // Compensates seller for use
  percentToEquity: number;  // From formula (e.g., 50%)
}

/**
 * Calculate monthly payment breakdown
 */
export function calculateRentToOwnPayment(
  agreement: RentToOwnAgreement,
  month: Date
): RentToOwnPayment {
  const { monthlyPayment, rentToOwnFormula } = agreement;
  const { equityPercentage, rentPercentage } = rentToOwnFormula;

  const equityPortion = monthlyPayment * (equityPercentage / 100);
  const rentPortion = monthlyPayment * (rentPercentage / 100);

  return {
    month,
    totalAmount: monthlyPayment,
    equityPortion,
    rentPortion,
    percentToEquity: equityPercentage
  };
}
