/**
 * Calculator utility functions for real estate division purchase calculations
 * All functions are pure and testable
 */

import type { Lot } from '../types/timeline';

export interface Participant {
  name: string;
  capitalApporte: number;
  registrationFeesRate: number;
  interestRate: number;
  durationYears: number;

  // Two-loan financing (optional)
  useTwoLoans?: boolean;  // Checkbox: enable 2-loan financing
  loan2DelayYears?: number;  // Default: 2 (when loan 2 starts after loan 1)
  loan2RenovationAmount?: number;  // Absolute € amount of (casco+parachevements) in loan 2
  capitalForLoan1?: number;  // How much of capitalApporte goes to loan 1
  capitalForLoan2?: number;  // How much of capitalApporte goes to loan 2

  // Timeline fields
  isFounder?: boolean; // True if entered at deed date
  entryDate?: Date; // When participant joined (for founders = deed date)
  exitDate?: Date; // When participant left (if applicable)
  lotsOwned?: Lot[]; // Array of lots owned (replaces quantity + surface + unitId)

  // Purchase details (for newcomers only)
  // When set, lotId and purchasePrice are REQUIRED for type safety
  purchaseDetails?: {
    buyingFrom: string; // Participant name or "Copropriété"
    lotId: number;  // REQUIRED: ID of lot being purchased
    purchasePrice: number;  // REQUIRED: total purchase price in euros
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
  cascoTvaRate?: number; // TVA percentage for CASCO costs (e.g., 6 or 21)
  expenseCategories?: ExpenseCategories;
}

// Scenario interface removed - no longer using percentage-based adjustments
// Real numbers are used directly from ProjectParams instead

export interface PortageFormulaParams {
  indexationRate: number; // Annual percentage (default: 2.0)
  carryingCostRecovery: number; // Percentage of carrying costs to recover (default: 100)
  averageInterestRate: number; // Annual percentage for loan interest (default: 4.5)
  coproReservesShare: number; // Percentage to copro reserves when selling from copro (default: 30)
}

export const DEFAULT_PORTAGE_FORMULA: PortageFormulaParams = {
  indexationRate: 2.0,
  carryingCostRecovery: 100,
  averageInterestRate: 4.5,
  coproReservesShare: 30
};

export interface UnitDetails {
  [unitId: number]: {
    casco: number;
    parachevements: number;
  };
}

export interface ParticipantCalculation extends Participant {
  pricePerM2: number;
  purchaseShare: number;
  droitEnregistrements: number; // Registration fees (percentage-based on purchase share)
  fraisNotaireFixe: number; // Fixed notary fees: 1000€ per lot (quantity)
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

  // Two-loan breakdown (only populated if useTwoLoans = true)
  loan1Amount?: number;
  loan1MonthlyPayment?: number;
  loan1Interest?: number;
  loan2Amount?: number;
  loan2DurationYears?: number;  // Calculated to match loan 1 end date
  loan2MonthlyPayment?: number;
  loan2Interest?: number;
}

export interface CalculationTotals {
  purchase: number;
  totalDroitEnregistrements: number; // Total registration fees (formerly totalNotaryFees)
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
  totalSurface: number
): number {
  if (totalSurface <= 0) {
    throw new Error('Total surface must be greater than zero');
  }
  return totalPurchase / totalSurface;
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
  projectParams: ProjectParams
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
    projectParams.infrastructures +
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

export interface FraisGenerauxBreakdown {
  totalCasco: number;
  honorairesYearly: number;
  honorairesTotal3Years: number;
  recurringYearly: {
    precompteImmobilier: number;
    comptable: number;
    podioAbonnement: number;
    assuranceBatiment: number;
    fraisReservation: number;
    imprevus: number;
    total: number;
  };
  recurringTotal3Years: number;
  oneTimeCosts: {
    fraisDossierCredit: number;
    fraisGestionCredit: number;
    fraisNotaireBasePartagee: number;
    total: number;
  };
  total: number;
}

/**
 * Get detailed breakdown of frais généraux 3 ans
 * Returns all subcategories with their amounts for UI display
 */
export function getFraisGenerauxBreakdown(
  participants: Participant[],
  projectParams: ProjectParams,
  unitDetails: UnitDetails
): FraisGenerauxBreakdown {
  // Calculate total CASCO costs HORS TVA (not including parachevements or common works)
  // Honoraires are calculated on CASCO HORS TVA
  let totalCascoHorsTva = 0;

  for (const participant of participants) {
    // Skip if legacy fields not present (using new lotsOwned instead)
    if (!participant.unitId || !participant.surface || !participant.quantity) continue;

    // Calculate CASCO without TVA for honoraires calculation
    const actualCascoSqm = participant.cascoSqm !== undefined ? participant.cascoSqm : participant.surface;
    const cascoHorsTva = actualCascoSqm * projectParams.globalCascoPerM2;
    totalCascoHorsTva += cascoHorsTva * participant.quantity;
  }

  // Add common building works CASCO (without TVA)
  totalCascoHorsTva += calculateTotalTravauxCommuns(projectParams);

  // Calculate Honoraires (professional fees) = Total CASCO HORS TVA × 15% × 30%
  // This represents architects, stability experts, study offices, PEB, etc.
  // This is the TOTAL amount to be paid over 3 years (divided into 3 annual payments)
  const honorairesTotal3Years = totalCascoHorsTva * 0.15 * 0.30;
  const honorairesYearly = honorairesTotal3Years / 3;

  // Recurring yearly costs
  const precompteImmobilier = 388.38;
  const comptable = 1000;
  const podioAbonnement = 600;
  const assuranceBatiment = 2000;
  const fraisReservation = 2000;
  const imprevus = 2000;

  const recurringYearly = precompteImmobilier + comptable + podioAbonnement +
                          assuranceBatiment + fraisReservation + imprevus;

  // Recurring costs over 3 years (including honoraires paid annually)
  const recurringTotal3Years = recurringYearly * 3;

  // One-time costs (year 1 only)
  const fraisDossierCredit = 500;
  const fraisGestionCredit = 45;
  const fraisNotaireBasePartagee = 5000; // Shared notary fee base (total, will be divided among participants later)

  const oneTimeTotal = fraisDossierCredit + fraisGestionCredit + fraisNotaireBasePartagee;
  const total = honorairesTotal3Years + recurringTotal3Years + oneTimeTotal;

  return {
    totalCasco: totalCascoHorsTva,
    honorairesYearly,
    honorairesTotal3Years,
    recurringYearly: {
      precompteImmobilier,
      comptable,
      podioAbonnement,
      assuranceBatiment,
      fraisReservation,
      imprevus,
      total: recurringYearly
    },
    recurringTotal3Years,
    oneTimeCosts: {
      fraisDossierCredit,
      fraisGestionCredit,
      fraisNotaireBasePartagee,
      total: oneTimeTotal
    },
    total
  };
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
  const breakdown = getFraisGenerauxBreakdown(participants, projectParams, unitDetails);
  return breakdown.total;
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
 * Calculate droit d'enregistrements (registration fees)
 */
export function calculateDroitEnregistrements(
  purchaseShare: number,
  registrationFeesRate: number
): number {
  return purchaseShare * (registrationFeesRate / 100);
}

/**
 * Calculate fixed notary fees based on number of lots
 * Fixed at 1000€ per lot (quantity)
 */
export function calculateFraisNotaireFixe(quantity: number): number {
  return quantity * 1000;
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
  parachevementsSqm?: number,
  cascoTvaRate: number = 0
): { casco: number; parachevements: number } {
  const actualCascoSqm = cascoSqm !== undefined ? cascoSqm : surface;
  const actualParachevementsSqm = parachevementsSqm !== undefined ? parachevementsSqm : surface;

  // CASCO: Always use global rate
  let casco = actualCascoSqm * globalCascoPerM2;

  // Apply TVA to CASCO costs if rate is specified
  if (cascoTvaRate > 0) {
    casco = casco * (1 + cascoTvaRate / 100);
  }

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
  quantity: number = 1
): number {
  const constructionCostPerUnit = casco + parachevements + travauxCommunsPerUnit;
  return constructionCostPerUnit * quantity;
}

/**
 * Adjust construction costs for portage buyer
 * Removes costs already paid by founder during portage period
 */
export function adjustPortageBuyerConstructionCosts(
  baseCasco: number,
  baseParachevements: number,
  portageLot?: { founderPaysCasco?: boolean; founderPaysParachèvement?: boolean }
): { casco: number; parachevements: number } {
  if (!portageLot) {
    return { casco: baseCasco, parachevements: baseParachevements };
  }

  const casco = portageLot.founderPaysCasco ? 0 : baseCasco;
  const parachevements = portageLot.founderPaysParachèvement ? 0 : baseParachevements;

  return { casco, parachevements };
}

/**
 * Get construction costs paid by founder (for display/export)
 */
export function getFounderPaidConstructionCosts(
  portageLot: { founderPaysCasco?: boolean; founderPaysParachèvement?: boolean; surface: number },
  globalCascoPerM2: number,
  parachevementsPerM2: number
): { casco: number; parachevements: number } {
  const surface = portageLot.surface || 0;

  const casco = portageLot.founderPaysCasco ? surface * globalCascoPerM2 : 0;
  const parachevements = portageLot.founderPaysParachèvement
    ? surface * parachevementsPerM2
    : 0;

  return { casco, parachevements };
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
  if (totalCost <= 0) {
    return 0; // If no cost, financing ratio is 0%
  }
  return (loanAmount / totalCost) * 100;
}

/**
 * Calculate two-loan financing breakdown
 * Loan 1: purchaseShare + droitEnregistrements + fraisNotaireFixe + sharedCosts + (personalRenovationCost - loan2RenovationAmount) - capitalForLoan1
 * Loan 2: loan2RenovationAmount - capitalForLoan2
 */
export function calculateTwoLoanFinancing(
  purchaseShare: number,
  droitEnregistrements: number,
  fraisNotaireFixe: number,
  sharedCosts: number,
  personalRenovationCost: number,
  participant: Participant
): {
  loan1Amount: number;
  loan1MonthlyPayment: number;
  loan1Interest: number;
  loan2Amount: number;
  loan2DurationYears: number;
  loan2MonthlyPayment: number;
  loan2Interest: number;
  totalInterest: number;
} {
  const loan2RenovationAmount = participant.loan2RenovationAmount || 0;
  const capitalForLoan1 = participant.capitalForLoan1 || 0;
  const capitalForLoan2 = participant.capitalForLoan2 || 0;
  const loan2DelayYears = participant.loan2DelayYears ?? 2;

  // Loan 1: Everything except the renovation going to loan 2
  const loan1RenovationPortion = personalRenovationCost - loan2RenovationAmount;
  const loan1Amount = Math.max(0, purchaseShare + droitEnregistrements + fraisNotaireFixe + sharedCosts + loan1RenovationPortion - capitalForLoan1);

  // Loan 2: Only the specified renovation amount
  const loan2Amount = Math.max(0, loan2RenovationAmount - capitalForLoan2);

  // Loan 2 duration: Same end date as loan 1
  const loan2DurationYears = participant.durationYears - loan2DelayYears;

  // Monthly payments
  const loan1MonthlyPayment = calculateMonthlyPayment(loan1Amount, participant.interestRate, participant.durationYears);
  const loan2MonthlyPayment = calculateMonthlyPayment(loan2Amount, participant.interestRate, loan2DurationYears);

  // Interest calculations
  const loan1Interest = calculateTotalInterest(loan1MonthlyPayment, participant.durationYears, loan1Amount);
  const loan2Interest = calculateTotalInterest(loan2MonthlyPayment, loan2DurationYears, loan2Amount);

  return {
    loan1Amount,
    loan1MonthlyPayment,
    loan1Interest,
    loan2Amount,
    loan2DurationYears,
    loan2MonthlyPayment,
    loan2Interest,
    totalInterest: loan1Interest + loan2Interest
  };
}

/**
 * Main calculation function that computes all participant breakdowns and totals
 */
export function calculateAll(
  participants: Participant[],
  projectParams: ProjectParams,
  unitDetails: UnitDetails
): CalculationResults {
  const totalSurface = calculateTotalSurface(participants);
  const pricePerM2 = calculatePricePerM2(projectParams.totalPurchase, totalSurface);

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

  const sharedCosts = calculateSharedCosts(updatedProjectParams);
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

    let { casco, parachevements } = calculateCascoAndParachevements(
      unitId,
      surface,
      unitDetails,
      projectParams.globalCascoPerM2,
      p.parachevementsPerM2,
      p.cascoSqm,
      p.parachevementsSqm,
      projectParams.cascoTvaRate || 0
    );

    // Check if participant is buying a portage lot and adjust construction costs
    if (p.purchaseDetails?.lotId) {
      // Find the portage lot from all participants' lotsOwned
      const portageLot = participants
        .flatMap(seller => seller.lotsOwned || [])
        .find(lot => lot.lotId === p.purchaseDetails!.lotId && lot.isPortage);

      if (portageLot) {
        // Adjust construction costs based on what founder paid
        const adjusted = adjustPortageBuyerConstructionCosts(casco, parachevements, portageLot);
        casco = adjusted.casco;
        parachevements = adjusted.parachevements;
      }
    }

    const purchaseShare = calculatePurchaseShare(surface, pricePerM2);
    const droitEnregistrements = calculateDroitEnregistrements(purchaseShare, p.registrationFeesRate);
    const fraisNotaireFixe = calculateFraisNotaireFixe(quantity);

    // Since surface is TOTAL, casco and parachevements are already for total surface
    // Only multiply travauxCommunsPerUnit by quantity (shared building costs per unit)
    const cascoTotal = casco;
    const parachevementsTotal = parachevements;
    const personalRenovationCost = cascoTotal + parachevementsTotal;
    const travauxCommunsTotal = travauxCommunsPerUnit * quantity;

    const constructionCost = personalRenovationCost + travauxCommunsTotal;
    const constructionCostPerUnit = constructionCost / quantity;

    const totalCost = purchaseShare + droitEnregistrements + fraisNotaireFixe + constructionCost + sharedPerPerson;

    // Two-loan financing or single loan
    let loanNeeded: number;
    let monthlyPayment: number;
    let totalRepayment: number;
    let totalInterest: number;
    let loan1Amount: number | undefined;
    let loan1MonthlyPayment: number | undefined;
    let loan1Interest: number | undefined;
    let loan2Amount: number | undefined;
    let loan2DurationYears: number | undefined;
    let loan2MonthlyPayment: number | undefined;
    let loan2Interest: number | undefined;

    if (p.useTwoLoans) {
      // Use two-loan financing
      const twoLoanCalc = calculateTwoLoanFinancing(
        purchaseShare,
        droitEnregistrements,
        fraisNotaireFixe,
        sharedPerPerson,
        personalRenovationCost,
        p
      );

      loan1Amount = twoLoanCalc.loan1Amount;
      loan1MonthlyPayment = twoLoanCalc.loan1MonthlyPayment;
      loan1Interest = twoLoanCalc.loan1Interest;
      loan2Amount = twoLoanCalc.loan2Amount;
      loan2DurationYears = twoLoanCalc.loan2DurationYears;
      loan2MonthlyPayment = twoLoanCalc.loan2MonthlyPayment;
      loan2Interest = twoLoanCalc.loan2Interest;

      // Total loan needed is the sum of both loans
      loanNeeded = loan1Amount + loan2Amount;
      monthlyPayment = loan1MonthlyPayment;
      totalRepayment = (loan1MonthlyPayment * p.durationYears * 12) + (loan2MonthlyPayment * loan2DurationYears * 12);
      totalInterest = twoLoanCalc.totalInterest;
    } else {
      // Use single-loan financing (existing logic)
      loanNeeded = calculateLoanAmount(totalCost, p.capitalApporte);
      monthlyPayment = calculateMonthlyPayment(loanNeeded, p.interestRate, p.durationYears);
      totalRepayment = monthlyPayment * p.durationYears * 12;
      totalInterest = calculateTotalInterest(monthlyPayment, p.durationYears, loanNeeded);
    }

    const financingRatio = calculateFinancingRatio(loanNeeded, totalCost);

    return {
      ...p,
      quantity,
      pricePerM2,
      purchaseShare,
      droitEnregistrements,
      fraisNotaireFixe,
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
      // Two-loan fields (only populated if useTwoLoans = true)
      loan1Amount,
      loan1MonthlyPayment,
      loan1Interest,
      loan2Amount,
      loan2DurationYears,
      loan2MonthlyPayment,
      loan2Interest,
    };
  });

  const totals: CalculationTotals = {
    purchase: projectParams.totalPurchase,
    totalDroitEnregistrements: participantBreakdown.reduce((sum, p) => sum + p.droitEnregistrements, 0),
    construction: participantBreakdown.reduce((sum, p) => sum + p.constructionCost, 0),
    shared: sharedCosts,
    totalTravauxCommuns: calculateTotalTravauxCommuns(projectParams),
    travauxCommunsPerUnit,
    total: projectParams.totalPurchase +
           participantBreakdown.reduce((sum, p) => sum + p.droitEnregistrements, 0) +
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
