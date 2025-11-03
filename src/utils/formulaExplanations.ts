/**
 * Formula explanation utilities for real estate calculator
 * Returns human-readable formula explanations for tooltips
 */

import type { ParticipantCalculation, CalculationTotals } from './calculatorUtils';

/**
 * Get formula explanation for total cost calculation
 */
export function getTotalCostFormula(p: ParticipantCalculation): string[] {
  return [
    "Total cost for this participant",
    `Purchase €${p.purchaseShare.toLocaleString()} + Notary €${p.notaryFees.toLocaleString()} + Construction €${p.constructionCost.toLocaleString()} + Shared €${p.sharedCosts.toLocaleString()}`
  ];
}

/**
 * Get formula explanation for purchase share calculation
 */
export function getPurchaseShareFormula(p: ParticipantCalculation, pricePerM2: number): string[] {
  return [
    "Your share of the building purchase",
    `€${pricePerM2.toFixed(2)}/m² × ${p.surface}m² = €${p.purchaseShare.toLocaleString()}`
  ];
}

/**
 * Get formula explanation for notary fees calculation
 */
export function getNotaryFeesFormula(p: ParticipantCalculation): string[] {
  return [
    "Belgian notary fees for property transfer",
    `€${p.purchaseShare.toLocaleString()} purchase × ${p.notaryFeesRate}% rate = €${p.notaryFees.toLocaleString()}`
  ];
}

/**
 * Get formula explanation for personal renovation costs (CASCO + Parachèvements)
 */
export function getPersonalRenovationFormula(p: ParticipantCalculation): string[] {
  return [
    "CASCO + Parachèvements for your units",
    `€${p.casco.toLocaleString()} CASCO + €${p.parachevements.toLocaleString()} parachèvements = €${p.personalRenovationCost.toLocaleString()}`
  ];
}

/**
 * Get formula explanation for construction cost calculation
 */
export function getConstructionCostFormula(
  p: ParticipantCalculation,
  totalConstruction: number,
  totalUnits: number
): string[] {
  return [
    "Your share of shared construction",
    `€${totalConstruction.toLocaleString()} total ÷ ${totalUnits} units × ${p.quantity} quantity = €${p.constructionCost.toLocaleString()}`
  ];
}

/**
 * Get formula explanation for shared costs calculation
 */
export function getSharedCostsFormula(p: ParticipantCalculation, participantCount: number): string[] {
  return [
    "Your share of common project expenses",
    `Infrastructure + Studies + Frais généraux ÷ ${participantCount} participants = €${p.sharedCosts.toLocaleString()}`
  ];
}

/**
 * Get formula explanation for loan amount needed
 */
export function getLoanNeededFormula(p: ParticipantCalculation): string[] {
  return [
    "Amount to borrow",
    `€${p.totalCost.toLocaleString()} total cost - €${p.capitalApporte.toLocaleString()} capital = €${p.loanNeeded.toLocaleString()} loan`
  ];
}

/**
 * Get formula explanation for monthly payment calculation
 */
export function getMonthlyPaymentFormula(p: ParticipantCalculation): string[] {
  return [
    "Loan repayment over duration",
    `€${p.loanNeeded.toLocaleString()} loan at ${p.interestRate}% over ${p.durationYears} years`,
    "PMT(rate/12, years×12, -principal)"
  ];
}

/**
 * Get formula explanation for price per m² calculation
 */
export function getPricePerM2Formula(totals: CalculationTotals, totalSurface: number): string[] {
  return [
    "Average price per square meter",
    `€${totals.purchase.toLocaleString()} total purchase ÷ ${totalSurface}m² total surface`
  ];
}

/**
 * Get formula explanation for total project cost
 */
export function getTotalProjectCostFormula(): string[] {
  return [
    "Sum of all project expenses",
    "Purchase + Notary + Construction + Shared"
  ];
}

/**
 * Get formula explanation for total loans
 */
export function getTotalLoansFormula(): string[] {
  return [
    "Sum of all participant loans",
    "Total of all individual loan amounts"
  ];
}

/**
 * Get formula explanation for CASCO (structural work) cost
 */
export function getCascoFormula(p: ParticipantCalculation, cascoSqm: number | undefined, globalCascoPerM2: number): string[] {
  const sqm = cascoSqm ?? p.surface;
  return [
    "CASCO (structural work) cost",
    `${sqm}m² × €${globalCascoPerM2}/m² = €${p.casco.toLocaleString()}`
  ];
}

/**
 * Get formula explanation for Parachèvements (finishing work) cost
 */
export function getParachevementsFormula(p: ParticipantCalculation, parachevementsSqm: number | undefined, parachevementsPerM2: number | undefined): string[] {
  const sqm = parachevementsSqm ?? p.surface;
  const perM2 = parachevementsPerM2 ?? 0;
  return [
    "Parachèvements (finishing work) cost",
    `${sqm}m² × €${perM2}/m² = €${p.parachevements.toLocaleString()}`
  ];
}

/**
 * Get formula explanation for Travaux Communs (common building works)
 */
export function getTravauxCommunsFormula(p: ParticipantCalculation): string[] {
  return [
    "Common building works per unit",
    `Foundation + Structure + Copro works ÷ participants × ${p.quantity || 1} unit(s)`,
    `= €${p.travauxCommunsPerUnit.toLocaleString()}`
  ];
}

/**
 * Get formula explanation for total repayment (principal + interest)
 */
export function getTotalRepaymentFormula(p: ParticipantCalculation): string[] {
  return [
    "Total amount repaid over loan duration",
    `€${p.monthlyPayment.toLocaleString()} monthly × ${p.durationYears} years × 12 months = €${p.totalRepayment.toLocaleString()}`
  ];
}

/**
 * Get formula explanation for total interest (cost of credit)
 */
export function getTotalInterestFormula(p: ParticipantCalculation): string[] {
  return [
    "Total interest paid (cost of credit)",
    `€${p.totalRepayment.toLocaleString()} total repaid - €${p.loanNeeded.toLocaleString()} principal = €${p.totalInterest.toLocaleString()}`
  ];
}

/**
 * Get formula explanation for expected paybacks total
 */
export function getExpectedPaybacksFormula(totalRecovered: number, paybackCount: number): string[] {
  return [
    "Total expected income from portage & copropriété sales",
    `Sum of ${paybackCount} payment(s) = €${totalRecovered.toLocaleString()}`,
    "Received when newcomers join the project"
  ];
}
