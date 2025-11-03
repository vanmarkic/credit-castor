import type { Participant } from './calculatorUtils';

export interface TwoLoanValidationErrors {
  capitalAllocation?: string;
  renovationAmount?: string;
  loanDelay?: string;
}

/**
 * Validate two-loan financing parameters
 */
export function validateTwoLoanFinancing(
  participant: Participant,
  personalRenovationCost: number
): TwoLoanValidationErrors {
  const errors: TwoLoanValidationErrors = {};

  if (!participant.useTwoLoans) {
    return errors; // No validation needed
  }

  // Validate capital allocation
  const capitalForLoan1 = participant.capitalForLoan1 || 0;
  const capitalForLoan2 = participant.capitalForLoan2 || 0;
  const totalAllocated = capitalForLoan1 + capitalForLoan2;

  if (totalAllocated > participant.capitalApporte) {
    errors.capitalAllocation = `Capital alloué (€${totalAllocated.toLocaleString()}) dépasse le capital disponible (€${participant.capitalApporte.toLocaleString()})`;
  }

  // Validate renovation amount
  const loan2RenovationAmount = participant.loan2RenovationAmount || 0;
  if (loan2RenovationAmount > personalRenovationCost) {
    errors.renovationAmount = `Montant rénovation prêt 2 (€${loan2RenovationAmount.toLocaleString()}) dépasse la rénovation totale (€${personalRenovationCost.toLocaleString()})`;
  }

  // Validate loan delay
  const loan2DelayYears = participant.loan2DelayYears ?? 2;
  if (loan2DelayYears >= participant.durationYears) {
    errors.loanDelay = `Délai prêt 2 (${loan2DelayYears} ans) doit être inférieur à la durée totale (${participant.durationYears} ans)`;
  }

  const loan2DurationYears = participant.durationYears - loan2DelayYears;
  if (loan2DurationYears < 1) {
    errors.loanDelay = `Durée prêt 2 résultante (${loan2DurationYears} ans) doit être au moins 1 an`;
  }

  return errors;
}
