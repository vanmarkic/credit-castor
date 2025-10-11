/**
 * Calculator utility functions for real estate division purchase calculations
 * All functions are pure and testable
 */

export interface Participant {
  name: string;
  capitalApporte: number;
  notaryFeesRate: number;
  unitId: number;
  surface: number;
  interestRate: number;
  durationYears: number;
  quantity: number;
}

export interface ProjectParams {
  totalPurchase: number;
  mesuresConservatoires: number;
  demolition: number;
  infrastructures: number;
  etudesPreparatoires: number;
  fraisEtudesPreparatoires: number;
  fraisGeneraux3ans: number;
  batimentFondationConservatoire: number;
  batimentFondationComplete: number;
  batimentCoproConservatoire: number;
}

export interface Scenario {
  constructionCostChange: number; // percentage
  infrastructureReduction: number; // percentage
  purchasePriceReduction: number; // percentage
}

export interface UnitDetails {
  [unitId: number]: {
    casco: number;
    parachevements: number;
  };
}

export interface ParticipantCalculation extends Participant {
  pricePerM2: number;
  purchaseShare: number;
  notaryFees: number;
  casco: number;
  parachevements: number;
  constructionCost: number;
  constructionCostPerUnit: number;
  travauxCommunsPerUnit: number;
  sharedCosts: number;
  totalCost: number;
  loanNeeded: number;
  financingRatio: number;
  monthlyPayment: number;
  totalRepayment: number;
  totalInterest: number;
}

export interface CalculationTotals {
  purchase: number;
  totalNotaryFees: number;
  construction: number;
  shared: number;
  totalTravauxCommuns: number;
  travauxCommunsPerUnit: number;
  total: number;
  capitalTotal: number;
  totalLoansNeeded: number;
  averageLoan: number;
  averageCapital: number;
}

export interface CalculationResults {
  totalSurface: number;
  pricePerM2: number;
  sharedCosts: number;
  sharedPerPerson: number;
  participantBreakdown: ParticipantCalculation[];
  totals: CalculationTotals;
}

/**
 * Calculate price per square meter
 */
export function calculatePricePerM2(
  totalPurchase: number,
  totalSurface: number,
  purchasePriceReduction: number = 0
): number {
  const adjustedPurchase = totalPurchase * (1 - purchasePriceReduction / 100);
  return adjustedPurchase / totalSurface;
}

/**
 * Calculate total surface from all participants
 */
export function calculateTotalSurface(participants: Participant[]): number {
  return participants.reduce((sum, p) => sum + p.surface, 0);
}

/**
 * Calculate shared infrastructure costs
 */
export function calculateSharedCosts(
  projectParams: ProjectParams,
  infrastructureReduction: number = 0
): number {
  return (
    projectParams.mesuresConservatoires +
    projectParams.demolition +
    projectParams.infrastructures * (1 - infrastructureReduction / 100) +
    projectParams.etudesPreparatoires +
    projectParams.fraisEtudesPreparatoires +
    projectParams.fraisGeneraux3ans
  );
}

/**
 * Calculate travaux communs (common works) total
 */
export function calculateTotalTravauxCommuns(
  projectParams: ProjectParams
): number {
  return (
    projectParams.batimentFondationConservatoire +
    projectParams.batimentFondationComplete +
    projectParams.batimentCoproConservatoire
  );
}

/**
 * Calculate travaux communs per unit
 */
export function calculateTravauxCommunsPerUnit(
  projectParams: ProjectParams,
  numberOfParticipants: number
): number {
  const total = calculateTotalTravauxCommuns(projectParams);
  return total / numberOfParticipants;
}

/**
 * Calculate purchase share for a participant based on surface
 */
export function calculatePurchaseShare(
  surface: number,
  pricePerM2: number,
  quantity: number = 1
): number {
  return surface * pricePerM2 * quantity;
}

/**
 * Calculate notary fees
 */
export function calculateNotaryFees(
  purchaseShare: number,
  notaryFeesRate: number
): number {
  return purchaseShare * (notaryFeesRate / 100);
}

/**
 * Calculate CASCO and parachevements for a unit
 */
export function calculateCascoAndParachevements(
  unitId: number,
  surface: number,
  unitDetails: UnitDetails
): { casco: number; parachevements: number } {
  if (unitDetails[unitId]) {
    return {
      casco: unitDetails[unitId].casco,
      parachevements: unitDetails[unitId].parachevements,
    };
  }

  // Default calculation if unit not in details
  return {
    casco: surface * 1590,
    parachevements: surface * 500,
  };
}

/**
 * Calculate construction cost for a participant
 */
export function calculateConstructionCost(
  casco: number,
  parachevements: number,
  travauxCommunsPerUnit: number,
  constructionCostChange: number = 0,
  quantity: number = 1
): number {
  const constructionCostPerUnit =
    (casco * (1 + constructionCostChange / 100)) +
    (parachevements * (1 + constructionCostChange / 100)) +
    travauxCommunsPerUnit;

  return constructionCostPerUnit * quantity;
}

/**
 * Calculate loan amount needed
 */
export function calculateLoanAmount(
  totalCost: number,
  capitalApporte: number
): number {
  return totalCost - capitalApporte;
}

/**
 * Calculate monthly payment using mortgage formula (PMT)
 * Formula: P * (r * (1 + r)^n) / ((1 + r)^n - 1)
 * where P = principal, r = monthly rate, n = number of months
 */
export function calculateMonthlyPayment(
  loanAmount: number,
  annualInterestRate: number,
  durationYears: number
): number {
  if (loanAmount <= 0) {
    return 0;
  }

  const monthlyRate = (annualInterestRate / 100) / 12;
  const months = durationYears * 12;

  return loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);
}

/**
 * Calculate total interest paid over loan duration
 */
export function calculateTotalInterest(
  monthlyPayment: number,
  durationYears: number,
  loanAmount: number
): number {
  const totalRepayment = monthlyPayment * durationYears * 12;
  return totalRepayment - loanAmount;
}

/**
 * Calculate financing ratio (percentage of cost financed by loan)
 */
export function calculateFinancingRatio(
  loanAmount: number,
  totalCost: number
): number {
  return (loanAmount / totalCost) * 100;
}

/**
 * Main calculation function that computes all participant breakdowns and totals
 */
export function calculateAll(
  participants: Participant[],
  projectParams: ProjectParams,
  scenario: Scenario,
  unitDetails: UnitDetails
): CalculationResults {
  const totalSurface = calculateTotalSurface(participants);
  const adjustedPurchase = projectParams.totalPurchase * (1 - scenario.purchasePriceReduction / 100);
  const pricePerM2 = calculatePricePerM2(
    projectParams.totalPurchase,
    totalSurface,
    scenario.purchasePriceReduction
  );

  const sharedCosts = calculateSharedCosts(
    projectParams,
    scenario.infrastructureReduction
  );
  const sharedPerPerson = sharedCosts / participants.length;

  const travauxCommunsPerUnit = calculateTravauxCommunsPerUnit(
    projectParams,
    participants.length
  );

  const participantBreakdown: ParticipantCalculation[] = participants.map(p => {
    const { casco, parachevements } = calculateCascoAndParachevements(
      p.unitId,
      p.surface,
      unitDetails
    );

    const quantity = p.quantity || 1;
    const purchaseShare = calculatePurchaseShare(p.surface, pricePerM2, quantity);
    const notaryFees = calculateNotaryFees(purchaseShare, p.notaryFeesRate);

    const constructionCostPerUnit =
      (casco * (1 + scenario.constructionCostChange / 100)) +
      (parachevements * (1 + scenario.constructionCostChange / 100)) +
      travauxCommunsPerUnit;
    const constructionCost = constructionCostPerUnit * quantity;

    const totalCost = purchaseShare + notaryFees + constructionCost + sharedPerPerson;
    const loanNeeded = calculateLoanAmount(totalCost, p.capitalApporte);
    const financingRatio = calculateFinancingRatio(loanNeeded, totalCost);

    const monthlyPayment = calculateMonthlyPayment(
      loanNeeded,
      p.interestRate,
      p.durationYears
    );

    const totalRepayment = monthlyPayment * p.durationYears * 12;
    const totalInterest = calculateTotalInterest(monthlyPayment, p.durationYears, loanNeeded);

    return {
      ...p,
      quantity,
      pricePerM2,
      purchaseShare,
      notaryFees,
      casco,
      parachevements,
      constructionCost,
      constructionCostPerUnit,
      travauxCommunsPerUnit,
      sharedCosts: sharedPerPerson,
      totalCost,
      loanNeeded,
      financingRatio,
      monthlyPayment,
      totalRepayment,
      totalInterest,
    };
  });

  const totals: CalculationTotals = {
    purchase: adjustedPurchase,
    totalNotaryFees: participantBreakdown.reduce((sum, p) => sum + p.notaryFees, 0),
    construction: participantBreakdown.reduce((sum, p) => sum + p.constructionCost, 0),
    shared: sharedCosts,
    totalTravauxCommuns: calculateTotalTravauxCommuns(projectParams),
    travauxCommunsPerUnit,
    total: adjustedPurchase +
           participantBreakdown.reduce((sum, p) => sum + p.notaryFees, 0) +
           participantBreakdown.reduce((sum, p) => sum + p.constructionCost, 0) +
           sharedCosts,
    capitalTotal: participants.reduce((sum, p) => sum + p.capitalApporte, 0),
    totalLoansNeeded: participantBreakdown.reduce((sum, p) => sum + p.loanNeeded, 0),
    averageLoan: participantBreakdown.reduce((sum, p) => sum + p.loanNeeded, 0) / participants.length,
    averageCapital: participants.reduce((sum, p) => sum + p.capitalApporte, 0) / participants.length,
  };

  return {
    totalSurface,
    pricePerM2,
    sharedCosts,
    sharedPerPerson,
    participantBreakdown,
    totals,
  };
}
