import { useMemo } from 'react';
import { calculateExpectedPaybacks, type Payback } from '../utils/calculatorUtils';
import type { Participant, ProjectParams, CalculationResults, PortageFormulaParams } from '../utils/calculatorUtils';

/**
 * Hook to calculate expected paybacks for a participant
 * Includes both portage lot sales and copropriété redistributions
 * 
 * All calculation logic is in calculatorUtils.ts (pure function).
 * This hook just wraps it with React memoization.
 * 
 * Exclusion rules enforced:
 * 1. Non-founders do NOT receive redistribution from their own purchase
 * 2. Non-founders buying on the same day do NOT receive redistribution from each other
 */
export function useExpectedPaybacks(
  participant: Participant,
  allParticipants: Participant[],
  deedDate: string,
  coproReservesShare: number = 30,
  projectParams?: ProjectParams,
  calculations?: CalculationResults,
  formulaParams?: PortageFormulaParams
): { paybacks: Payback[]; totalRecovered: number } {
  return useMemo(() => {
    return calculateExpectedPaybacks(
      participant,
      allParticipants,
      deedDate,
      coproReservesShare,
      projectParams,
      calculations,
      formulaParams
    );
  }, [
    participant,
    allParticipants,
    deedDate,
    coproReservesShare,
    projectParams?.renovationStartDate, // Explicit dependency on renovationStartDate - triggers recalculation when changed
    projectParams, // Also include parent object for broader changes
    calculations?.totals?.purchase, // Explicit dependencies on the values we use
    calculations?.totals?.totalDroitEnregistrements,
    calculations?.totals?.construction,
    calculations?.totalSurface,
    calculations?.participantBreakdown, // Array reference - changes when participants change
    formulaParams
  ]);
}

// Re-export Payback type for backward compatibility
export type { Payback };
