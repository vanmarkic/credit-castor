/**
 * Portage Calculations
 *
 * Implements habitat-beaver formulas for:
 * - Carrying costs during portage period
 * - Fair resale price calculation
 * - Redistribution when copropriété sells hidden lots
 *
 * All functions are pure (no side effects) for testability.
 */

import { startOfDay, differenceInMilliseconds, isBefore } from 'date-fns';
import type { PortageFormulaParams as PortageFormulaParamsImport } from './calculatorUtils';
import { DAYS_PER_YEAR } from './timeConstants';

// Re-export for convenience
export type PortageFormulaParams = PortageFormulaParamsImport;

// ============================================
// Types
// ============================================

export interface CarryingCosts {
  monthlyInterest: number;
  monthlyTax: number;
  monthlyInsurance: number;
  totalMonthly: number;
  totalForPeriod: number;
}

export interface ResalePrice {
  basePrice: number;
  feesRecovery: number;
  indexation: number;
  carryingCostRecovery: number;
  renovations: number;
  totalPrice: number;
  breakdown: {
    base: number;
    fees: number;
    indexation: number;
    carrying: number;
    renovations: number;
  };
}

export interface Redistribution {
  participantName: string;
  quotite: number; // Percentage (0-1)
  amount: number;
}

export interface ParticipantSurface {
  name: string;
  surface: number;
}

// ============================================
// Carrying Costs Calculation
// ============================================

/**
 * Calculate carrying costs for portage period
 *
 * Based on habitat-beaver guide formulas:
 * - Monthly interest on loan amount
 * - Belgian empty property tax (388.38€/year)
 * - Insurance (2000€/year shared)
 *
 * @param lotValue - Total value of the lot being carried
 * @param capitalApporte - Capital contribution (to calculate loan)
 * @param durationMonths - How long the lot is carried
 * @param interestRate - Annual interest rate (percentage)
 * @returns Breakdown of monthly and total carrying costs
 */
export function calculateCarryingCosts(
  lotValue: number,
  capitalApporte: number,
  durationMonths: number,
  interestRate: number
): CarryingCosts {
  // Calculate loan amount
  const loanAmount = lotValue - capitalApporte;

  // Monthly interest
  const monthlyInterest = loanAmount > 0
    ? (loanAmount * interestRate / 100) / 12
    : 0;

  // Belgian empty property tax (from habitat-beaver guide)
  const yearlyTax = 388.38;
  const monthlyTax = yearlyTax / 12;

  // Insurance (from habitat-beaver guide)
  const yearlyInsurance = 2000;
  const monthlyInsurance = yearlyInsurance / 12;

  // Totals
  const totalMonthly = monthlyInterest + monthlyTax + monthlyInsurance;
  const totalForPeriod = totalMonthly * durationMonths;

  return {
    monthlyInterest,
    monthlyTax,
    monthlyInsurance,
    totalMonthly,
    totalForPeriod
  };
}

// ============================================
// Resale Price Calculation
// ============================================

/**
 * Calculate fair resale price using habitat-beaver formula
 *
 * Formula breakdown:
 * - Base acquisition cost (purchase price + notary fees + construction costs)
 * - + Indexation (compound interest using rate from formula params)
 * - + Carrying cost recovery
 * - + Additional renovations after initial acquisition
 *
 * @param originalPurchaseShare - Original purchase price
 * @param originalNotaryFees - Notary fees paid at purchase
 * @param originalConstructionCost - Construction costs (CASCO + parachevements + travaux communs)
 * @param yearsHeld - Years the lot was carried
 * @param formulaParams - Global formula parameters (indexation rate, etc.)
 * @param carryingCosts - Calculated carrying costs
 * @param renovationsConducted - Any additional renovation costs after acquisition
 * @returns Complete breakdown of resale price
 */
export function calculateResalePrice(
  originalPurchaseShare: number,
  originalNotaryFees: number,
  originalConstructionCost: number,
  yearsHeld: number,
  formulaParams: PortageFormulaParams,
  carryingCosts: CarryingCosts,
  renovationsConducted: number = 0
): ResalePrice {
  // Total acquisition cost = purchase + notary + construction
  const totalAcquisitionCost = originalPurchaseShare + originalNotaryFees + originalConstructionCost;

  // Calculate indexation on total acquisition cost (compound) using formula params
  const indexation = calculateIndexation(totalAcquisitionCost, formulaParams.indexationRate, yearsHeld);

  // Fee recovery no longer applicable (fees included in acquisition cost)
  const feesRecovery = 0;

  // Apply carrying cost recovery percentage from formula params
  const carryingCostRecovery = carryingCosts.totalForPeriod * (formulaParams.carryingCostRecovery / 100);

  // Total price
  const totalPrice =
    totalAcquisitionCost +
    indexation +
    carryingCostRecovery +
    renovationsConducted;

  return {
    basePrice: totalAcquisitionCost,
    feesRecovery,
    indexation,
    carryingCostRecovery,
    renovations: renovationsConducted,
    totalPrice,
    breakdown: {
      base: totalAcquisitionCost,
      fees: feesRecovery,
      indexation,
      carrying: carryingCostRecovery,
      renovations: renovationsConducted
    }
  };
}

// ============================================
// Portage Lot Pricing
// ============================================

export interface PortageLotPrice {
  basePrice: number;
  surfaceImposed: boolean;
  indexation: number;
  carryingCostRecovery: number;
  feesRecovery: number;
  totalPrice: number;
  pricePerM2: number;
}

/**
 * Calculate price for portage lot from founder (surface imposed)
 */
export function calculatePortageLotPrice(
  originalPrice: number,
  originalNotaryFees: number,
  originalConstructionCost: number,
  yearsHeld: number,
  formulaParams: PortageFormulaParams,
  carryingCosts: CarryingCosts,
  renovations: number = 0
): PortageLotPrice {
  const resale = calculateResalePrice(
    originalPrice,
    originalNotaryFees,
    originalConstructionCost,
    yearsHeld,
    formulaParams,
    carryingCosts,
    renovations
  );

  return {
    basePrice: resale.basePrice,
    surfaceImposed: true,
    indexation: resale.indexation,
    carryingCostRecovery: resale.carryingCostRecovery,
    feesRecovery: resale.feesRecovery,
    totalPrice: resale.totalPrice,
    pricePerM2: 0 // Not applicable - surface is imposed
  };
}

/**
 * Calculate price for portage lot from copropriété (surface free)
 */
export function calculatePortageLotPriceFromCopro(
  surfaceChosen: number,
  totalCoproLotSurface: number,
  totalCoproLotOriginalPrice: number,
  yearsHeld: number,
  formulaParams: PortageFormulaParams,
  totalCarryingCosts: number
): PortageLotPrice {
  // Validate inputs to prevent division by zero
  if (totalCoproLotSurface <= 0) {
    throw new Error('Total copropriété lot surface must be greater than zero');
  }
  if (surfaceChosen <= 0) {
    throw new Error('Surface chosen must be greater than zero');
  }
  if (surfaceChosen > totalCoproLotSurface) {
    throw new Error('Surface chosen cannot exceed total copropriété lot surface');
  }

  // Calculate proportional base price
  const surfaceRatio = surfaceChosen / totalCoproLotSurface;
  const basePrice = totalCoproLotOriginalPrice * surfaceRatio;

  // Calculate indexation using formula params
  const indexation = calculateIndexation(basePrice, formulaParams.indexationRate, yearsHeld);

  // Proportional carrying costs with recovery percentage
  const carryingCostRecovery = totalCarryingCosts * surfaceRatio * (formulaParams.carryingCostRecovery / 100);

  // No fee recovery for copro lots (copro doesn't recover fees)
  const feesRecovery = 0;

  const totalPrice = basePrice + indexation + carryingCostRecovery;
  const pricePerM2 = totalPrice / surfaceChosen;

  return {
    basePrice,
    surfaceImposed: false,
    indexation,
    carryingCostRecovery,
    feesRecovery,
    totalPrice,
    pricePerM2
  };
}

// ============================================
// Redistribution Calculation
// ============================================

/**
 * Calculate redistribution when copropriété sells hidden lot
 *
 * Based on Belgian copropriété law and habitat-beaver guide:
 * - All current participants (founders + newcomers) receive proportional share
 * - Proportion = their surface / total building surface
 * - This is their quotité in the copropriété
 *
 * Quotité Model:
 * - Every participant with owned surface gets quotité
 * - Quotité = (participant surface) / (total building surface)
 * - Newcomers who join get quotité same as founders
 *
 * @param saleProceeds - Total amount from lot sale
 * @param allCurrentParticipants - All current participants (founders + newcomers)
 * @param totalBuildingSurface - Total surface of the building (constant denominator)
 * @returns Array of redistributions per participant
 */
export function calculateRedistribution(
  saleProceeds: number,
  allCurrentParticipants: ParticipantSurface[],
  totalBuildingSurface: number
): Redistribution[] {
  if (totalBuildingSurface <= 0) {
    throw new Error('Total building surface must be greater than zero');
  }

  return allCurrentParticipants.map(participant => {
    const quotite = participant.surface / totalBuildingSurface;
    const amount = saleProceeds * quotite;

    return {
      participantName: participant.name,
      quotite,
      amount
    };
  });
}

// ============================================
// Date Calculations
// ============================================

/**
 * Calculate years held between two dates
 *
 * Used to determine the portage period for pricing calculations.
 * Returns fractional years (e.g., 2.5 for 2 years and 6 months).
 *
 * Uses date-fns for reliable date handling and normalization to avoid timezone issues.
 *
 * @param founderEntryDate - Date when the founder acquired the property (deed date)
 * @param buyerEntryDate - Date when the buyer is purchasing (or current date)
 * @returns Years held as a decimal number (minimum 0, no negative values)
 */
export function calculateYearsHeld(founderEntryDate: Date, buyerEntryDate: Date): number {
  // Normalize dates to start of day to avoid timezone issues
  const normalizedFounderDate = startOfDay(founderEntryDate);
  const normalizedBuyerDate = startOfDay(buyerEntryDate);

  // If buyer date is before founder date, return 0 (no negative time)
  if (isBefore(normalizedBuyerDate, normalizedFounderDate)) {
    console.log('Buyer entry date is before founder entry date, returning 0');
    return 0;
  }

  const diffMs = differenceInMilliseconds(normalizedBuyerDate, normalizedFounderDate);
  console.log(`Date difference in ms: ${diffMs}`);
  const diffYears = diffMs / (1000 * 60 * 60 * 24 * DAYS_PER_YEAR);
  console.log(`Calculated years held: ${diffYears} years`);
  return diffYears;
}

// ============================================
// Indexation Calculation
// ============================================

/**
 * Calculate compound indexation/growth
 *
 * Applies compound interest formula: principal × [(1 + rate/100)^years - 1]
 *
 * @param principal - Base amount to apply indexation to
 * @param ratePercentage - Annual rate as percentage (e.g., 2 for 2%, not 0.02)
 * @param years - Number of years (can be fractional, e.g., 2.5)
 * @returns Indexation amount (growth only, not including principal)
 *
 * @example
 * calculateIndexation(100000, 2, 2.5) // Returns ~5050.80 (2% for 2.5 years)
 */
export function calculateIndexation(
  principal: number,
  ratePercentage: number,
  years: number
): number {
  const multiplier = Math.pow(1 + ratePercentage / 100, years);
  return principal * (multiplier - 1);
}

// ============================================
// Formula Preview Calculation
// ============================================

export interface FormulaPreview {
  basePrice: number;
  indexation: number;
  carryingCostRecovery: number;
  totalPrice: number;
}

/**
 * Calculate preview values for formula visualization
 *
 * Simplified version of resale price calculation for UI preview/examples.
 * Uses the same formulas as calculateResalePrice but with simplified inputs.
 *
 * @param basePrice - Base acquisition cost for the example
 * @param yearsHeld - Years held for the example
 * @param formulaParams - Global formula parameters
 * @param carryingCosts - Calculated carrying costs for the period
 * @returns Breakdown showing indexation and carrying cost recovery
 */
export function calculateFormulaPreview(
  basePrice: number,
  yearsHeld: number,
  formulaParams: PortageFormulaParams,
  carryingCosts: CarryingCosts
): FormulaPreview {
  // Calculate indexation using same formula as calculateResalePrice
  const indexation = calculateIndexation(basePrice, formulaParams.indexationRate, yearsHeld);

  // Apply carrying cost recovery percentage (same as calculateResalePrice)
  const carryingCostRecovery = carryingCosts.totalForPeriod * (formulaParams.carryingCostRecovery / 100);

  // Total price
  const totalPrice = basePrice + indexation + carryingCostRecovery;

  return {
    basePrice,
    indexation,
    carryingCostRecovery,
    totalPrice
  };
}

// ============================================
// Copropriété Estimation Constants
// ============================================

/**
 * Estimated base price per m² for copropriété lots (MVP simplified pricing)
 * This is used when actual copropriété acquisition costs are not available.
 */
export const COPRO_BASE_PRICE_PER_M2 = 1377;

/**
 * Estimated annual carrying cost rate for copropriété lots (as percentage of price)
 * This is used when actual carrying costs are not available.
 * Default: 5% per year
 */
export const COPRO_CARRYING_COST_RATE = 0.05;

// ============================================
// Copropriété Price Estimation
// ============================================

/**
 * Calculate estimated price for copropriété lot with free surface choice
 *
 * This is a simplified estimation used when detailed copropriété financials
 * are not available. It uses hardcoded constants for base price and carrying costs.
 *
 * **MVP Simplification**: In production, actual copropriété acquisition costs
 * and carrying costs should be used instead of estimates.
 *
 * @param surfaceChosen - Surface area chosen by the buyer (in m²)
 * @param availableSurface - Total available surface of the copro lot (in m²)
 * @param yearsHeld - Years the copropriété held the lot
 * @param formulaParams - Global formula parameters (indexation rate, etc.)
 * @returns PortageLotPrice with calculated breakdown, or null if invalid input
 */
export function calculateCoproEstimatedPrice(
  surfaceChosen: number,
  availableSurface: number,
  yearsHeld: number,
  formulaParams: PortageFormulaParams
): PortageLotPrice | null {
  // Validate input
  if (!surfaceChosen || surfaceChosen <= 0 || surfaceChosen > availableSurface) {
    return null;
  }

  // Estimate total original price for the copro lot using standard rate
  const estimatedOriginalPrice = availableSurface * COPRO_BASE_PRICE_PER_M2;

  // Estimate carrying costs: 5% per year of the original price
  const estimatedCarryingCosts = estimatedOriginalPrice * COPRO_CARRYING_COST_RATE * yearsHeld;

  // Calculate proportional price using the existing function
  return calculatePortageLotPriceFromCopro(
    surfaceChosen,
    availableSurface,
    estimatedOriginalPrice,
    yearsHeld,
    formulaParams,
    estimatedCarryingCosts
  );
}
