/**
 * Copropriété Health Metrics
 *
 * Pure functions for calculating copropriété financial health indicators.
 * Used to assess the financial stability and sustainability of the copropriété entity.
 *
 * Key metrics:
 * - Monthly obligations (total recurring costs)
 * - Reserve runway (months of obligations covered by reserves)
 * - Health status (whether reserves are adequate)
 *
 * All functions are pure (no side effects) for testability.
 */

// ============================================
// Types
// ============================================

/**
 * Monthly recurring obligations for copropriété
 */
export interface MonthlyObligations {
  loanPayments: number;
  insurance: number;
  accountingFees: number;
  maintenanceReserve: number;
}

/**
 * Financial health assessment result
 */
export interface HealthAssessment {
  totalMonthlyObligations: number;
  monthsOfReserve: number;
  isLowReserve: boolean;
  status: 'healthy' | 'warning' | 'critical';
}

// ============================================
// Core Functions
// ============================================

/**
 * Calculate total monthly obligations
 *
 * Sums all recurring monthly costs for the copropriété:
 * - Loan payments (mortgages)
 * - Insurance premiums
 * - Accounting/legal fees
 * - Maintenance reserve contributions
 *
 * @param obligations - Breakdown of monthly obligations
 * @returns Total monthly obligation amount
 *
 * @example
 * const total = calculateTotalMonthlyObligations({
 *   loanPayments: 2000,
 *   insurance: 150,
 *   accountingFees: 100,
 *   maintenanceReserve: 250
 * });
 * // Returns 2500
 */
export function calculateTotalMonthlyObligations(
  obligations: MonthlyObligations
): number {
  return (
    obligations.loanPayments +
    obligations.insurance +
    obligations.accountingFees +
    obligations.maintenanceReserve
  );
}

/**
 * Calculate months of reserve runway
 *
 * Determines how many months the current cash reserve can cover
 * all monthly obligations. This is a key indicator of financial health.
 *
 * @param cashReserve - Current cash reserve balance
 * @param monthlyObligations - Total monthly obligations
 * @returns Number of months covered, or Infinity if no obligations
 *
 * @example
 * const months = calculateMonthsOfReserve(15000, 5000);
 * // Returns 3 (15000 / 5000)
 *
 * @example
 * const months = calculateMonthsOfReserve(10000, 0);
 * // Returns Infinity (no obligations)
 */
export function calculateMonthsOfReserve(
  cashReserve: number,
  monthlyObligations: number
): number {
  if (monthlyObligations === 0) {
    return Infinity;
  }
  return cashReserve / monthlyObligations;
}

/**
 * Check if reserve is below threshold
 *
 * A reserve is considered "low" if it covers less than the threshold
 * number of months. The default threshold is 3 months (industry standard).
 *
 * @param monthsOfReserve - Months covered by current reserve
 * @param threshold - Minimum acceptable months (default: 3)
 * @returns True if reserve is below threshold
 *
 * @example
 * const isLow = isLowReserve(2.5);
 * // Returns true (below 3-month threshold)
 *
 * @example
 * const isLow = isLowReserve(6);
 * // Returns false (above 3-month threshold)
 */
export function isLowReserve(
  monthsOfReserve: number,
  threshold: number = 3
): boolean {
  return monthsOfReserve < threshold;
}

/**
 * Assess overall financial health
 *
 * Provides a comprehensive health assessment based on reserve levels:
 * - healthy: 6+ months of reserves
 * - warning: 3-6 months of reserves
 * - critical: <3 months of reserves
 *
 * @param cashReserve - Current cash reserve balance
 * @param obligations - Breakdown of monthly obligations
 * @returns Complete health assessment with status and metrics
 *
 * @example
 * const health = assessFinancialHealth(20000, {
 *   loanPayments: 2000,
 *   insurance: 150,
 *   accountingFees: 100,
 *   maintenanceReserve: 250
 * });
 * // Returns {
 * //   totalMonthlyObligations: 2500,
 * //   monthsOfReserve: 8,
 * //   isLowReserve: false,
 * //   status: 'healthy'
 * // }
 */
export function assessFinancialHealth(
  cashReserve: number,
  obligations: MonthlyObligations
): HealthAssessment {
  const totalMonthlyObligations = calculateTotalMonthlyObligations(obligations);
  const monthsOfReserve = calculateMonthsOfReserve(
    cashReserve,
    totalMonthlyObligations
  );
  const isLow = isLowReserve(monthsOfReserve);

  let status: 'healthy' | 'warning' | 'critical';
  if (monthsOfReserve >= 6) {
    status = 'healthy';
  } else if (monthsOfReserve >= 3) {
    status = 'warning';
  } else {
    status = 'critical';
  }

  return {
    totalMonthlyObligations,
    monthsOfReserve,
    isLowReserve: isLow,
    status
  };
}
