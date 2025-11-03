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
