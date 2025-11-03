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
 * - Base price (original purchase)
 * - + Indexation (compound interest at 2%/year default)
 * - + Carrying cost recovery
 * - + Renovation costs
 * - + Fee recovery (60% if resold within 2 years - Belgian law)
 *
 * @param originalPurchaseShare - Original purchase price
 * @param originalNotaryFees - Notary fees paid at purchase
 * @param yearsHeld - Years the lot was carried
 * @param indexationRate - Annual indexation rate (default 2%)
 * @param carryingCosts - Calculated carrying costs
 * @param renovationsConducted - Any renovation costs to recover
 * @returns Complete breakdown of resale price
 */
export function calculateResalePrice(
  originalPurchaseShare: number,
  originalNotaryFees: number,
  yearsHeld: number,
  indexationRate: number = 2,
  carryingCosts: CarryingCosts,
  renovationsConducted: number = 0
): ResalePrice {
  // Calculate indexation (compound)
  const indexationMultiplier = Math.pow(1 + indexationRate / 100, yearsHeld);
  const indexation = originalPurchaseShare * (indexationMultiplier - 1);

  // Fee recovery: 60% if within 2 years (Belgian law)
  const feesRecovery = yearsHeld <= 2
    ? originalNotaryFees * 0.6
    : 0;

  // Total price
  const totalPrice =
    originalPurchaseShare +
    indexation +
    carryingCosts.totalForPeriod +
    feesRecovery +
    renovationsConducted;

  return {
    basePrice: originalPurchaseShare,
    feesRecovery,
    indexation,
    carryingCostRecovery: carryingCosts.totalForPeriod,
    renovations: renovationsConducted,
    totalPrice,
    breakdown: {
      base: originalPurchaseShare,
      fees: feesRecovery,
      indexation,
      carrying: carryingCosts.totalForPeriod,
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
  yearsHeld: number,
  indexationRate: number,
  carryingCosts: CarryingCosts,
  renovations: number = 0
): PortageLotPrice {
  const resale = calculateResalePrice(
    originalPrice,
    originalNotaryFees,
    yearsHeld,
    indexationRate,
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
  indexationRate: number,
  totalCarryingCosts: number
): PortageLotPrice {
  // Calculate proportional base price
  const surfaceRatio = surfaceChosen / totalCoproLotSurface;
  const basePrice = totalCoproLotOriginalPrice * surfaceRatio;

  // Calculate indexation
  const indexationMultiplier = Math.pow(1 + indexationRate / 100, yearsHeld);
  const indexation = basePrice * (indexationMultiplier - 1);

  // Proportional carrying costs
  const carryingCostRecovery = totalCarryingCosts * surfaceRatio;

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
 * Based on habitat-beaver guide:
 * - Each initial co-owner receives proportional share
 * - Proportion = their surface / total surface at purchase
 * - This is their quotité in the copropriété
 *
 * @param saleProceeds - Total amount from lot sale
 * @param initialCopropietaires - Initial co-owners at purchase
 * @param totalSurfaceAtPurchase - Total surface at initial purchase
 * @returns Array of redistributions per participant
 */
export function calculateRedistribution(
  saleProceeds: number,
  initialCopropietaires: ParticipantSurface[],
  totalSurfaceAtPurchase: number
): Redistribution[] {
  return initialCopropietaires.map(participant => {
    const quotite = participant.surface / totalSurfaceAtPurchase;
    const amount = saleProceeds * quotite;

    return {
      participantName: participant.name,
      quotite,
      amount
    };
  });
}
