/**
 * Calculator utility functions for real estate division purchase calculations
 * All functions are pure and testable
 */

import type { Lot } from '../types/timeline';

export interface Participant {
  name: string;
  capitalApporte: number;
  notaryFeesRate: number;
  interestRate: number;
  durationYears: number;

  // Timeline fields
  isFounder?: boolean; // True if entered at deed date
  entryDate?: Date; // When participant joined (for founders = deed date)
  exitDate?: Date; // When participant left (if applicable)
  lotsOwned?: Lot[]; // Array of lots owned (replaces quantity + surface + unitId)

  // Purchase details (for newcomers only)
  purchaseDetails?: {
    buyingFrom: string; // Participant name or "Copropriété"
    lotId?: number;
    purchasePrice?: number;
    breakdown?: {
      basePrice: number;
      indexation: number;
      carryingCostRecovery: number;
      feesRecovery: number;
      renovations: number;
    };
  };

  // Legacy fields (still used in calculator, but will be replaced by lotsOwned)
  unitId?: number;
  surface?: number;
  quantity?: number;

  // Optional overrides
  parachevementsPerM2?: number;
  cascoSqm?: number;
  parachevementsSqm?: number;
}

export interface ExpenseLineItem {
  label: string;
  amount: number;
}

export interface ExpenseCategories {
  conservatoire: ExpenseLineItem[];
  habitabiliteSommaire: ExpenseLineItem[];
  premierTravaux: ExpenseLineItem[];
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
  globalCascoPerM2: number;
  expenseCategories?: ExpenseCategories;
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
  personalRenovationCost: number; // casco + parachevements (personal renovation)
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
  return participants.reduce((sum, p) => sum + (p.surface || 0), 0);
}

/**
 * Calculate total from expense categories
 */
export function calculateExpenseCategoriesTotal(
  expenseCategories: ExpenseCategories | undefined
): number {
  if (!expenseCategories) {
    return 0;
  }

  const conservatoireTotal = expenseCategories.conservatoire.reduce(
    (sum, item) => sum + item.amount,
    0
  );
  const habitabiliteSommaireTotal = expenseCategories.habitabiliteSommaire.reduce(
    (sum, item) => sum + item.amount,
    0
  );
  const premierTravauxTotal = expenseCategories.premierTravaux.reduce(
    (sum, item) => sum + item.amount,
    0
  );

  return conservatoireTotal + habitabiliteSommaireTotal + premierTravauxTotal;
}

/**
 * Calculate shared infrastructure costs
 * Note: If expenseCategories is provided, it replaces the old infrastructure fields
 */
export function calculateSharedCosts(
  projectParams: ProjectParams,
  infrastructureReduction: number = 0
): number {
  // If new expense categories are defined, use them instead of old fields
  if (projectParams.expenseCategories) {
    const expenseCategoriesTotal = calculateExpenseCategoriesTotal(projectParams.expenseCategories);
    return expenseCategoriesTotal + projectParams.fraisGeneraux3ans;
  }

  // Legacy calculation (for backward compatibility)
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
 * Calculate frais généraux 3 ans based on the Excel formula:
 * Honoraires = Total CASCO × 15% × 30% (professional fees)
 * Plus recurring costs over 3 years
 *
 * From Excel: FRAIS GENERAUX sheet, cell C13: ='PRIX TRAVAUX'!E14*0.15*0.3
 */
export function calculateFraisGeneraux3ans(
  participants: Participant[],
  projectParams: ProjectParams,
  unitDetails: UnitDetails
): number {
  // Calculate total CASCO costs (not including parachevements or common works)
  let totalCasco = 0;

  for (const participant of participants) {
    // Skip if legacy fields not present (using new lotsOwned instead)
    if (!participant.unitId || !participant.surface || !participant.quantity) continue;

    const { casco } = calculateCascoAndParachevements(
      participant.unitId,
      participant.surface,
      unitDetails,
      projectParams.globalCascoPerM2,
      participant.parachevementsPerM2,
      participant.cascoSqm,
      participant.parachevementsSqm
    );
    totalCasco += casco * participant.quantity;
  }

  // Add common building works CASCO
  totalCasco += calculateTotalTravauxCommuns(projectParams);

  // Calculate Honoraires (professional fees) = Total CASCO × 15% × 30%
  // This represents architects, stability experts, study offices, PEB, etc.
  const honoraires = totalCasco * 0.15 * 0.30;

  // Recurring yearly costs
  const precompteImmobilier = 388.38;
  const comptable = 1000;
  const podioAbonnement = 600;
  const assuranceBatiment = 2000;
  const fraisReservation = 2000;
  const imprevus = 2000;

  // One-time costs (year 1 only)
  const fraisDossierCredit = 500;
  const fraisGestionCredit = 45;

  // Total recurring costs for 3 years
  const recurringYearly = precompteImmobilier + comptable + podioAbonnement +
                          assuranceBatiment + fraisReservation + imprevus;
  const recurringTotal = recurringYearly * 3;

  // One-time costs
  const oneTimeCosts = fraisDossierCredit + fraisGestionCredit;

  // Honoraires split over 3 years
  // (but counted as total in the calculation)

  // Total Frais Généraux 3 ans
  return honoraires + recurringTotal + oneTimeCosts;
}

/**
 * Calculate purchase share for a participant based on surface
 * Note: surface represents TOTAL surface, not per unit
 */
export function calculatePurchaseShare(
  surface: number,
  pricePerM2: number
): number {
  return surface * pricePerM2;
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
  unitDetails: UnitDetails,
  globalCascoPerM2: number,
  parachevementsPerM2?: number,
  cascoSqm?: number,
  parachevementsSqm?: number
): { casco: number; parachevements: number } {
  const actualCascoSqm = cascoSqm !== undefined ? cascoSqm : surface;
  const actualParachevementsSqm = parachevementsSqm !== undefined ? parachevementsSqm : surface;

  // CASCO: Always use global rate
  const casco = actualCascoSqm * globalCascoPerM2;

  // Parachevements: Use participant-specific rate or fallback
  let parachevements: number;
  if (parachevementsPerM2 !== undefined) {
    parachevements = actualParachevementsSqm * parachevementsPerM2;
  } else if (unitDetails[unitId]) {
    const unitParachevementsPerM2 = unitDetails[unitId].parachevements / surface;
    parachevements = actualParachevementsSqm * unitParachevementsPerM2;
  } else {
    parachevements = actualParachevementsSqm * 500;
  }

  return { casco, parachevements };
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

  // Calculate fraisGeneraux3ans dynamically based on construction costs
  const dynamicFraisGeneraux3ans = calculateFraisGeneraux3ans(
    participants,
    projectParams,
    unitDetails
  );

  // Create updated projectParams with dynamic fraisGeneraux3ans
  const updatedProjectParams = {
    ...projectParams,
    fraisGeneraux3ans: dynamicFraisGeneraux3ans,
  };

  const sharedCosts = calculateSharedCosts(
    updatedProjectParams,
    scenario.infrastructureReduction
  );
  const sharedPerPerson = sharedCosts / participants.length;

  const travauxCommunsPerUnit = calculateTravauxCommunsPerUnit(
    projectParams,
    participants.length
  );

  const participantBreakdown: ParticipantCalculation[] = participants.map(p => {
    // For backward compatibility, require legacy fields
    const unitId = p.unitId || 0;
    const surface = p.surface || 0;
    const quantity = p.quantity || 1;

    const { casco, parachevements } = calculateCascoAndParachevements(
      unitId,
      surface,
      unitDetails,
      projectParams.globalCascoPerM2,
      p.parachevementsPerM2,
      p.cascoSqm,
      p.parachevementsSqm
    );

    const purchaseShare = calculatePurchaseShare(surface, pricePerM2);
    const notaryFees = calculateNotaryFees(purchaseShare, p.notaryFeesRate);

    // Since surface is TOTAL, casco and parachevements are already for total surface
    // Only multiply travauxCommunsPerUnit by quantity (shared building costs per unit)
    const cascoTotal = casco * (1 + scenario.constructionCostChange / 100);
    const parachevementsTotal = parachevements * (1 + scenario.constructionCostChange / 100);
    const personalRenovationCost = cascoTotal + parachevementsTotal;
    const travauxCommunsTotal = travauxCommunsPerUnit * quantity;

    const constructionCost = personalRenovationCost + travauxCommunsTotal;
    const constructionCostPerUnit = constructionCost / quantity;

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
      personalRenovationCost,
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
