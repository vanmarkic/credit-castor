/**
 * Rent-to-Own calculation functions
 * All functions are pure and testable
 */

import type { RentToOwnAgreement, RentToOwnFormulaParams } from './calculatorUtils';

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

/**
 * Calculate accumulated equity over time
 */
export function calculateAccumulatedEquity(
  agreement: RentToOwnAgreement,
  asOfDate: Date = new Date()
): number {
  // Calculate months elapsed since trial start
  const msElapsed = asOfDate.getTime() - agreement.trialStartDate.getTime();

  // Return 0 if before trial starts
  if (msElapsed < 0) {
    return 0;
  }

  // Convert to months (using average month length of 30.44 days)
  const monthsElapsed = Math.floor(msElapsed / (1000 * 60 * 60 * 24 * 30.44));

  // Cap at trial duration
  const paymentsCount = Math.min(monthsElapsed, agreement.trialDurationMonths);

  // Calculate equity per month
  const equityPerMonth = agreement.monthlyPayment * (agreement.rentToOwnFormula.equityPercentage / 100);

  return paymentsCount * equityPerMonth;
}

/**
 * Calculate final purchase price (sale price - equity)
 */
export function calculateFinalPurchasePrice(
  agreement: RentToOwnAgreement,
  baseSalePrice: number
): number {
  const equity = agreement.equityAccumulated;
  return Math.max(0, baseSalePrice - equity);
}
