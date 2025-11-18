/**
 * Calculator utility functions for real estate division purchase calculations
 * All functions are pure and testable
 */

import type { Lot } from '../types/timeline';
import { calculateIndexation, calculateCoproSalePrice } from './portageCalculations';
import { calculateCoproRedistribution } from './coproRedistribution';

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

  // Enable/disable participant (excludes from calculations)
  enabled?: boolean; // Defaults to true for backward compatibility
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

export interface TravauxCommunsItem {
  label: string;
  sqm: number; // Surface area in square meters
  cascoPricePerSqm: number; // CASCO price per square meter
  parachevementPricePerSqm: number; // Parachèvement price per square meter
  // amount is calculated: (sqm * cascoPricePerSqm) + (sqm * parachevementPricePerSqm)
  amount?: number; // Optional: stored value for backward compatibility, will be calculated if not provided
}

export interface TravauxCommuns {
  enabled: boolean; // Toggle for entire section
  items: TravauxCommunsItem[]; // Customizable line items with sqm and price per sqm
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
  travauxCommuns?: TravauxCommuns; // Customizable common works with equal cost distribution
  maxTotalLots?: number; // Maximum total number of lots (founder + copropriété). Default: 10
  renovationStartDate?: string; // ISO date string for "début des rénovations" - linked to deedDate
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
 * Calculate the amount for a travaux communs item from sqm and prices
 * Formula: (sqm * cascoPricePerSqm) + (sqm * parachevementPricePerSqm)
 */
export function calculateTravauxCommunsItemAmount(item: TravauxCommunsItem): number {
  // If amount is explicitly provided (backward compatibility), use it
  // Otherwise, calculate from sqm and prices
  if (item.amount !== undefined && (item.sqm === undefined || item.sqm === 0)) {
    return item.amount;
  }
  
  const sqm = item.sqm || 0;
  const cascoAmount = sqm * (item.cascoPricePerSqm || 0);
  const parachevementAmount = sqm * (item.parachevementPricePerSqm || 0);
  return cascoAmount + parachevementAmount;
}

/**
 * Calculate CASCO-only amount for a travaux communs item (for honoraires calculation)
 * Formula: sqm * cascoPricePerSqm
 */
export function calculateTravauxCommunsItemCascoAmount(item: TravauxCommunsItem): number {
  const sqm = item.sqm || 0;
  return sqm * (item.cascoPricePerSqm || 0);
}

/**
 * Calculate travaux communs (common works) total
 * Total includes both CASCO and parachevements: (sqm * cascoPricePerSqm) + (sqm * parachevementPricePerSqm)
 */
export function calculateTotalTravauxCommuns(
  projectParams: ProjectParams
): number {
  // Calculate base travaux communs from fixed fields
  const baseTotal = (
    projectParams.batimentFondationConservatoire +
    projectParams.batimentFondationComplete +
    projectParams.batimentCoproConservatoire
  );

  // Add customizable travaux communs if enabled
  const customTotal = projectParams.travauxCommuns?.enabled
    ? projectParams.travauxCommuns.items.reduce((sum, item) => {
        return sum + calculateTravauxCommunsItemAmount(item);
      }, 0)
    : 0;

  return baseTotal + customTotal;
}

/**
 * Calculate CASCO-only amount from travaux communs (for honoraires calculation)
 * Only includes CASCO portion: sqm * cascoPricePerSqm
 */
export function calculateTravauxCommunsCascoAmount(
  projectParams: ProjectParams
): number {
  // Base travaux communs are included in total (they don't have separate CASCO/parachevement breakdown)
  // So we include them in the CASCO calculation for honoraires
  const baseTotal = (
    projectParams.batimentFondationConservatoire +
    projectParams.batimentFondationComplete +
    projectParams.batimentCoproConservatoire
  );

  // Add only CASCO portion from customizable travaux communs if enabled
  const customCascoTotal = projectParams.travauxCommuns?.enabled
    ? projectParams.travauxCommuns.items.reduce((sum, item) => {
        return sum + calculateTravauxCommunsItemCascoAmount(item);
      }, 0)
    : 0;

  return baseTotal + customCascoTotal;
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
  _unitDetails: UnitDetails
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

  // Add common building works CASCO (without TVA) - only CASCO portion, not parachevements
  // When travaux communs is enabled, include only the CASCO amount (sqm * cascoPricePerSqm)
  totalCascoHorsTva += calculateTravauxCommunsCascoAmount(projectParams);

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
 * 
 * @param participants - Array of all participants
 * @param projectParams - Project parameters
 * @param unitDetails - Unit details for CASCO and parachèvements
 * @param deedDate - Optional deed date for newcomer calculations
 * @param formulaParams - Optional portage formula parameters for newcomer calculations
 */
export function calculateAll(
  participants: Participant[],
  projectParams: ProjectParams,
  unitDetails: UnitDetails,
  deedDate?: string,
  formulaParams?: PortageFormulaParams
): CalculationResults {
  // Filter enabled participants for calculations (enabled defaults to true for backward compatibility)
  const enabledParticipants = participants.filter(p => p.enabled !== false);
  
  const totalSurface = calculateTotalSurface(enabledParticipants);
  const pricePerM2 = calculatePricePerM2(projectParams.totalPurchase, totalSurface);

  // Calculate fraisGeneraux3ans dynamically based on construction costs (only enabled participants)
  const dynamicFraisGeneraux3ans = calculateFraisGeneraux3ans(
    enabledParticipants,
    projectParams,
    unitDetails
  );

  // Create updated projectParams with dynamic fraisGeneraux3ans
  const updatedProjectParams = {
    ...projectParams,
    fraisGeneraux3ans: dynamicFraisGeneraux3ans,
  };

  const sharedCosts = calculateSharedCosts(updatedProjectParams);
  const enabledCount = enabledParticipants.length || 1; // Avoid division by zero
  const sharedPerPerson = sharedCosts / enabledCount;

  const travauxCommunsPerUnit = calculateTravauxCommunsPerUnit(
    projectParams,
    enabledCount
  );

  // Calculate breakdown for all participants, but use enabled participants for shared calculations
  const participantBreakdown: ParticipantCalculation[] = participants.map(p => {
    // If participant is disabled, return zero values
    if (p.enabled === false) {
      return {
        ...p,
        quantity: p.quantity || 1,
        pricePerM2,
        purchaseShare: 0,
        droitEnregistrements: 0,
        fraisNotaireFixe: 0,
        casco: 0,
        parachevements: 0,
        personalRenovationCost: 0,
        constructionCost: 0,
        constructionCostPerUnit: 0,
        travauxCommunsPerUnit: 0,
        sharedCosts: 0,
        totalCost: 0,
        loanNeeded: 0,
        financingRatio: 0,
        monthlyPayment: 0,
        totalRepayment: 0,
        totalInterest: 0,
      };
    }
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

    // Calculate purchase share
    // For newcomers buying from copropriété, use quotité-based calculation
    // For others (founders or buying from participant), use standard calculation or stored value
    let purchaseShare: number;
    
    if (!p.isFounder && p.purchaseDetails?.buyingFrom === 'Copropriété' && p.entryDate && deedDate) {
      // Use quotité-based calculation for newcomers buying from copropriété
      // Calculate quotité based on ALL participants who entered on or before this buyer's entry date
      // This includes the buyer themselves in the total surface
      const buyerEntryDate = p.entryDate 
        ? (p.entryDate instanceof Date ? p.entryDate : new Date(p.entryDate))
        : new Date(deedDate);
      
      const existingParticipants = participants.filter(existing => {
        // Include all participants who entered before or on the same day as this buyer (including the buyer)
        const existingEntryDate = existing.entryDate 
          ? (existing.entryDate instanceof Date ? existing.entryDate : new Date(existing.entryDate))
          : (existing.isFounder ? new Date(deedDate) : null);
        if (!existingEntryDate) return false;
        
        return existingEntryDate <= buyerEntryDate;
      });
      
      try {
        // Defensive check: if surface is 0, we can't calculate quotité properly
        if (surface <= 0) {
          console.warn(`Newcomer ${p.name} has surface ${surface}, cannot calculate quotité-based price. Using fallback.`);
          purchaseShare = p.purchaseDetails?.purchasePrice ?? calculatePurchaseShare(surface, pricePerM2);
        } else {
          // Verify existingParticipants includes participants with surface > 0
          const totalSurface = existingParticipants.reduce((sum, ep) => sum + (ep.surface || 0), 0);
          if (totalSurface <= 0) {
            console.warn(`Total surface is ${totalSurface} for newcomer ${p.name}, cannot calculate quotité. Using fallback.`);
            purchaseShare = p.purchaseDetails?.purchasePrice ?? calculatePurchaseShare(surface, pricePerM2);
          } else {
            const newcomerPrice = calculateNewcomerPurchasePrice(
              surface,
              existingParticipants, // All participants up to and including the buyer's entry date
              projectParams.totalPurchase,
              deedDate,
              p.entryDate,
              formulaParams
            );
            // Use calculated price if valid (> 0), otherwise fall back to stored price
            purchaseShare = newcomerPrice.totalPrice > 0 
              ? newcomerPrice.totalPrice 
              : (p.purchaseDetails?.purchasePrice ?? calculatePurchaseShare(surface, pricePerM2));
          }
        }
      } catch (error) {
        console.error('Error calculating newcomer price, falling back to standard calculation:', error);
        purchaseShare = p.purchaseDetails?.purchasePrice ?? calculatePurchaseShare(surface, pricePerM2);
      }
    } else {
      // For founders or newcomers buying from participants, use stored price or standard calculation
      purchaseShare = p.purchaseDetails?.purchasePrice ?? calculatePurchaseShare(surface, pricePerM2);
    }
    
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
    capitalTotal: enabledParticipants.reduce((sum, p) => sum + p.capitalApporte, 0),
    totalLoansNeeded: participantBreakdown.reduce((sum, p) => sum + p.loanNeeded, 0),
    averageLoan: enabledCount > 0 ? participantBreakdown.reduce((sum, p) => sum + p.loanNeeded, 0) / enabledCount : 0,
    averageCapital: enabledCount > 0 ? enabledParticipants.reduce((sum, p) => sum + p.capitalApporte, 0) / enabledCount : 0,
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

// ============================================
// Newcomer Quotité and Purchase Price Calculation
// ============================================

/**
 * Calculate quotité for a newcomer buying from copropriété
 * Quotité = newcomer's surface / total building surface (all participants)
 * 
 * @param newcomerSurface - Surface area the newcomer is purchasing (m²)
 * @param allParticipants - All participants (founders + newcomers)
 * @returns Quotité as a decimal (e.g., 0.079 for 79/1000)
 */
export function calculateNewcomerQuotite(
  newcomerSurface: number,
  allParticipants: Participant[]
): number {
  // Defensive check: if newcomerSurface is 0 or negative, quotité is 0
  if (newcomerSurface <= 0) {
    return 0;
  }
  
  const totalBuildingSurface = allParticipants.reduce((sum, p) => sum + (p.surface || 0), 0);
  
  if (totalBuildingSurface <= 0) {
    return 0;
  }
  
  return newcomerSurface / totalBuildingSurface;
}

/**
 * Calculate purchase price for newcomer using quotité-based portage formula
 * 
 * Formula:
 * 1. Quotité = newcomer's surface / total building surface (all participants)
 * 2. Base Price = Quotité × Total Project Cost
 * 3. Apply portage formula: indexation + carrying cost recovery
 * 4. Final Price = Base Price + Indexation + Carrying Cost Recovery
 * 
 * @param newcomerSurface - Surface area the newcomer is purchasing (m²)
 * @param allParticipants - All participants (founders + newcomers)
 * @param totalProjectCost - Original total project cost (purchase price)
 * @param deedDate - Project deed date (T0)
 * @param entryDate - Date when newcomer is entering
 * @param formulaParams - Portage formula parameters
 * @returns Purchase price breakdown
 */
export function calculateNewcomerPurchasePrice(
  newcomerSurface: number,
  allParticipants: Participant[],
  totalProjectCost: number,
  deedDate: string | Date,
  entryDate: string | Date,
  formulaParams?: PortageFormulaParams
): {
  quotite: number;
  basePrice: number;
  indexation: number;
  carryingCostRecovery: number;
  totalPrice: number;
  yearsHeld: number;
} {
  // Calculate quotité
  const quotite = calculateNewcomerQuotite(newcomerSurface, allParticipants);
  
  // Calculate base price using quotité
  const basePrice = quotite * totalProjectCost;
  
  // Calculate years held (from deed date to entry date)
  const deedDateObj = deedDate instanceof Date ? deedDate : new Date(deedDate);
  const entryDateObj = entryDate instanceof Date ? entryDate : new Date(entryDate);
  const yearsHeld = (entryDateObj.getTime() - deedDateObj.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
  
  // Apply portage formula
  const indexationRate = formulaParams?.indexationRate ?? 2; // 2% per year default
  const indexation = basePrice * (Math.pow(1 + indexationRate / 100, yearsHeld) - 1);
  
  // Carrying costs (simplified - proportional to quotité)
  // TODO: Use actual carrying costs calculation
  const monthlyCarryingCosts = 500; // €500/month (should be calculated from actual costs)
  const totalCarryingCosts = monthlyCarryingCosts * yearsHeld * 12;
  const carryingCostRecovery = totalCarryingCosts * quotite;
  
  // Final price
  const totalPrice = basePrice + indexation + carryingCostRecovery;
  
  return {
    quotite,
    basePrice,
    indexation,
    carryingCostRecovery,
    totalPrice,
    yearsHeld
  };
}

// ============================================
// Commun Costs Breakdown Calculations
// ============================================

/**
 * Calculate number of participants at purchase time (founders + those buying same day as deed date)
 */
export function calculateParticipantsAtPurchaseTime(
  allParticipants: Participant[],
  deedDate?: string
): number {
  if (!allParticipants || allParticipants.length === 0) {
    return 1;
  }

  if (!deedDate) {
    return Math.max(1, allParticipants.length);
  }

  try {
    const deedDateObj = new Date(deedDate);
    if (isNaN(deedDateObj.getTime())) {
      return Math.max(1, allParticipants.length);
    }

    const deedDateStr = deedDateObj.toISOString().split('T')[0];
    const count = allParticipants.filter(p => {
      // Include founders (they are always at purchase time)
      if (p.isFounder === true) {
        return true;
      }
      // Include non-founders who entered on the deed date
      if (p.entryDate) {
        try {
          const entryDateObj = new Date(p.entryDate);
          if (isNaN(entryDateObj.getTime())) return false;
          const entryDateStr = entryDateObj.toISOString().split('T')[0];
          return entryDateStr === deedDateStr;
        } catch {
          return false;
        }
      }
      return false;
    }).length;
    return Math.max(1, count);
  } catch {
    return Math.max(1, allParticipants.length);
  }
}

/**
 * Calculate number of participants at a given entry date (for newcomers)
 * Includes all founders + all newcomers who entered on or before the entry date
 */
export function calculateParticipantsAtEntryDate(
  allParticipants: Participant[],
  entryDate: Date | string,
  deedDate?: string
): number {
  if (!allParticipants || allParticipants.length === 0) {
    return 1;
  }

  try {
    const entryDateObj = entryDate instanceof Date ? entryDate : new Date(entryDate);
    if (isNaN(entryDateObj.getTime())) {
      // Fallback to purchase time count
      return calculateParticipantsAtPurchaseTime(allParticipants, deedDate);
    }

    const entryDateStr = entryDateObj.toISOString().split('T')[0];
    const count = allParticipants.filter(p => {
      // Include all founders
      if (p.isFounder === true) {
        return true;
      }
      // Include all newcomers who entered on or before this entry date
      if (p.entryDate) {
        try {
          const pEntryDateObj = new Date(p.entryDate);
          if (isNaN(pEntryDateObj.getTime())) return false;
          const pEntryDateStr = pEntryDateObj.toISOString().split('T')[0];
          return pEntryDateStr <= entryDateStr;
        } catch {
          return false;
        }
      }
      return false;
    }).length;
    return Math.max(1, count);
  } catch {
    // Fallback to purchase time count
    return calculateParticipantsAtPurchaseTime(allParticipants, deedDate);
  }
}

export interface CommunCostsBreakdown {
  totalCommunBeforeDivision: number;
  expenseCategoriesTotal: number;
  honorairesPerParticipant: number;
  frais3ansPerParticipant: number;
  ponctuelsPerParticipant: number;
  travauxCommunsPerParticipant: number;
  sharedCostsPerParticipant: number;
  participantsCount: number;
}

export interface CommunCostsWithPortageCopro {
  base: number;
  indexation: number;
  total: number;
  yearsHeld: number;
}

/**
 * Calculate commun costs breakdown for a participant
 * Returns per-participant amounts for each component
 */
export function calculateCommunCostsBreakdown(
  participant: Participant,
  allParticipants: Participant[],
  projectParams: ProjectParams,
  unitDetails: UnitDetails,
  deedDate?: string
): CommunCostsBreakdown {
  // Calculate frais généraux breakdown
  const fraisGenerauxBreakdown = getFraisGenerauxBreakdown(
    allParticipants,
    projectParams,
    unitDetails
  );

  // Calculate totals before division
  const expenseCategoriesTotalBeforeDivision = projectParams.expenseCategories
    ? (calculateExpenseCategoriesTotal(projectParams.expenseCategories) || 0)
    : 0;

  const travauxCommunsTotalBeforeDivision = calculateTotalTravauxCommuns(projectParams) || 0;

  const totalFraisGeneraux = (fraisGenerauxBreakdown.honorairesTotal3Years || 0) +
    (fraisGenerauxBreakdown.recurringTotal3Years || 0) +
    ((fraisGenerauxBreakdown.oneTimeCosts?.total) || 0);

  const totalCommunBeforeDivision = expenseCategoriesTotalBeforeDivision +
    totalFraisGeneraux +
    travauxCommunsTotalBeforeDivision;

  // Determine participant count (founders vs newcomers)
  const isNewcomer = !participant.isFounder;
  let participantsCount: number;

  if (isNewcomer && participant.entryDate) {
    participantsCount = calculateParticipantsAtEntryDate(
      allParticipants,
      participant.entryDate,
      deedDate
    );
  } else {
    participantsCount = calculateParticipantsAtPurchaseTime(allParticipants, deedDate);
  }

  // Calculate per-participant amounts
  const honorairesPerParticipant = (fraisGenerauxBreakdown.honorairesTotal3Years || 0) / participantsCount;
  const frais3ansPerParticipant = (fraisGenerauxBreakdown.recurringTotal3Years || 0) / participantsCount;
  const ponctuelsPerParticipant = ((fraisGenerauxBreakdown.oneTimeCosts?.total) || 0) / participantsCount;
  const expenseCategoriesTotal = expenseCategoriesTotalBeforeDivision / participantsCount;
  const travauxCommunsPerParticipant = travauxCommunsTotalBeforeDivision / participantsCount;

  const sharedCostsPerParticipant = expenseCategoriesTotal +
    honorairesPerParticipant +
    frais3ansPerParticipant +
    ponctuelsPerParticipant +
    travauxCommunsPerParticipant;

  return {
    totalCommunBeforeDivision,
    expenseCategoriesTotal,
    honorairesPerParticipant,
    frais3ansPerParticipant,
    ponctuelsPerParticipant,
    travauxCommunsPerParticipant,
    sharedCostsPerParticipant,
    participantsCount
  };
}

/**
 * Calculate commun costs for newcomer using portage copro formula
 * Formula: base (total ÷ participants) + indexation
 */
export function calculateCommunCostsWithPortageCopro(
  totalCommunBeforeDivision: number,
  participantsAtEntryDate: number,
  deedDate: string,
  entryDate: Date | string,
  formulaParams: PortageFormulaParams
): CommunCostsWithPortageCopro {
  // Calculate base commun cost per participant at entry date
  const baseCommunCost = totalCommunBeforeDivision / participantsAtEntryDate;

  // Calculate years held from deed date to entry date
  const deedDateObj = new Date(deedDate);
  const entryDateObj = entryDate instanceof Date ? entryDate : new Date(entryDate);

  if (isNaN(deedDateObj.getTime()) || isNaN(entryDateObj.getTime())) {
    // Invalid dates, return base only
    return {
      base: baseCommunCost,
      indexation: 0,
      total: baseCommunCost,
      yearsHeld: 0
    };
  }

  const yearsHeld = (entryDateObj.getTime() - deedDateObj.getTime()) / (1000 * 60 * 60 * 24 * 365.25);

  // Apply indexation using portage copro formula
  const indexationRate = formulaParams.indexationRate || 2;
  const indexation = calculateIndexation(
    baseCommunCost,
    indexationRate,
    Math.max(0, yearsHeld)
  );

  // Total = base + indexation
  const total = baseCommunCost + indexation;

  return {
    base: baseCommunCost,
    indexation,
    total,
    yearsHeld: Math.max(0, yearsHeld)
  };
}

// ============================================
// Quotité Calculation for Founders
// ============================================

/**
 * Calculate quotité for a founder as (founder's surface at T0) / (total surface of all founders at T0)
 * Returns the quotité formatted as "integer/1000" (e.g., "450/1000")
 * 
 * @param founder - The founder participant
 * @param allParticipants - All participants in the project
 * @returns Quotité formatted as "numerator/denominator" or null if calculation is not possible
 */
export function calculateQuotiteForFounder(
  founder: Participant,
  allParticipants?: Participant[]
): string | null {
  if (!founder.isFounder || !allParticipants) {
    return null;
  }

  const founderSurface = founder.surface || 0;
  if (founderSurface === 0) {
    return null;
  }

  // Calculate total surface of all founders at T0
  const totalFounderSurface = allParticipants
    .filter(p => p.isFounder === true)
    .reduce((sum, p) => sum + (p.surface || 0), 0);

  if (totalFounderSurface === 0) {
    return null;
  }

  // Calculate quotité as a fraction
  const quotite = founderSurface / totalFounderSurface;
  
  // Convert to "integer/1000" format
  // Multiply by 1000 and round to nearest integer
  const numerator = Math.round(quotite * 1000);
  const denominator = 1000;

  // Simplify the fraction if possible (find GCD)
  const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b);
  const divisor = gcd(numerator, denominator);
  const simplifiedNumerator = numerator / divisor;
  const simplifiedDenominator = denominator / divisor;

  return `${simplifiedNumerator}/${simplifiedDenominator}`;
}

// ============================================
// Expected Paybacks Calculation
// ============================================

export interface Payback {
  date: Date;
  buyer: string;
  amount: number;
  type: 'portage' | 'copro';
  description: string;
}

export interface ExpectedPaybacksResult {
  paybacks: Payback[];
  totalRecovered: number;
}

/**
 * Helper to normalize dates to Date objects
 */
function ensureDate(date: Date | string | undefined, fallback: Date): Date {
  if (!date) return fallback;
  if (date instanceof Date) return date;
  return new Date(date);
}

/**
 * Compare two dates by ISO date string (ignoring time)
 * Returns true if dates are on the same calendar day
 */
function isSameDay(date1: Date, date2: Date): boolean {
  const str1 = date1.toISOString().split('T')[0];
  const str2 = date2.toISOString().split('T')[0];
  return str1 === str2;
}

/**
 * Calculate expected paybacks for a participant
 * Includes both portage lot sales and copropriété redistributions
 * 
 * Exclusion rules:
 * 1. Non-founders do NOT receive redistribution from their own purchase
 * 2. Non-founders buying on the same day do NOT receive redistribution from each other
 * 
 * @param participant - The participant to calculate paybacks for
 * @param allParticipants - All participants in the project
 * @param deedDate - Date of the initial purchase (deed date)
 * @param coproReservesShare - Percentage of copro sale proceeds going to reserves (default: 30%)
 * @param projectParams - Optional project parameters (for renovationStartDate logic)
 * @param calculations - Optional calculation results (for recalculating copro sale prices)
 * @param formulaParams - Optional portage formula parameters
 * @returns Paybacks result with array of paybacks and total recovered amount
 */
export function calculateExpectedPaybacks(
  participant: Participant,
  allParticipants: Participant[],
  deedDate: string,
  coproReservesShare: number = 30,
  projectParams?: ProjectParams,
  calculations?: CalculationResults,
  formulaParams?: PortageFormulaParams
): ExpectedPaybacksResult {
  const deedDateObj = new Date(deedDate);
  const effectiveFormulaParams = formulaParams || DEFAULT_PORTAGE_FORMULA;
  const participantsShare = 1 - (coproReservesShare / 100);

  // 1. Calculate portage paybacks (participants buying from this participant)
  const portagePaybacks: Payback[] = allParticipants
    .filter((buyer) => buyer.purchaseDetails?.buyingFrom === participant.name)
    .map((buyer) => ({
      date: ensureDate(buyer.entryDate || deedDateObj, deedDateObj),
      buyer: buyer.name,
      amount: buyer.purchaseDetails?.purchasePrice || 0,
      type: 'portage' as const,
      description: 'Achat de lot portage'
    }));

  // 2. Calculate copropriété redistributions for this participant
  // Prepare data for recalculation (if available)
  const totalProjectCost = calculations?.totals
    ? (calculations.totals.purchase || 0) +
      (calculations.totals.totalDroitEnregistrements || 0) +
      (calculations.totals.construction || 0)
    : 0;
  const totalBuildingSurface = calculations?.totalSurface || 0;
  const renovationStartDate = projectParams?.renovationStartDate;
  
  // Calculate total renovation costs (CASCO + parachèvements) from all participants
  const totalRenovationCosts = calculations?.participantBreakdown
    ? calculations.participantBreakdown.reduce(
        (sum, p) => sum + (p.personalRenovationCost || 0),
        0
      )
    : 0;

  // Normalize participant entry date
  const participantEntryDate = ensureDate(
    participant.entryDate || (participant.isFounder ? deedDateObj : undefined),
    participant.isFounder ? deedDateObj : new Date()
  );

  // Process copro sales
  const coproPaybacks: Payback[] = [];
  const coproSales = allParticipants.filter(
    (buyer) => buyer.purchaseDetails?.buyingFrom === 'Copropriété'
  );

  // Sort copro sales by entry date
  const sortedCoproSales = [...coproSales].sort((a, b) => {
    const dateA = ensureDate(a.entryDate || deedDateObj, deedDateObj);
    const dateB = ensureDate(b.entryDate || deedDateObj, deedDateObj);
    return dateA.getTime() - dateB.getTime();
  });

  for (const buyer of sortedCoproSales) {
    const saleDate = ensureDate(buyer.entryDate || deedDateObj, deedDateObj);
    const buyerName = buyer.name;
    const surfacePurchased = buyer.surface || 0;

    // Exclusion Rule 1: Participant does NOT receive redistribution from their own purchase
    if (buyerName === participant.name) {
      continue;
    }

    // Exclusion Rule 2: Participants buying on the same day do NOT receive redistribution from each other
    // Check if this buyer bought on the same day as the participant
    if (!participant.isFounder && isSameDay(saleDate, participantEntryDate)) {
      continue;
    }

    // Only calculate if this participant existed before the sale
    if (participantEntryDate > saleDate) {
      continue; // Participant didn't exist yet, skip this sale
    }

    // Skip if participant has no surface
    const participantSurface = participant.surface || 0;
    if (participantSurface <= 0) {
      continue;
    }

    // Calculate amount to participants for this sale
    let amountToParticipants: number;
    
    if (
      totalProjectCost > 0 &&
      totalBuildingSurface > 0 &&
      surfacePurchased > 0 &&
      renovationStartDate &&
      totalRenovationCosts > 0
    ) {
      // Recalculate copro sale price with renovation cost exclusion logic
      const yearsHeld = (saleDate.getTime() - deedDateObj.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
      
      const coproSalePricing = calculateCoproSalePrice(
        surfacePurchased,
        totalProjectCost,
        totalBuildingSurface,
        yearsHeld,
        effectiveFormulaParams,
        0, // Carrying costs - simplified
        renovationStartDate,
        saleDate,
        totalRenovationCosts
      );
      
      amountToParticipants = coproSalePricing.distribution.toParticipants;
    } else {
      // Fallback to stored purchasePrice if we don't have enough data to recalculate
      const totalPrice = buyer.purchaseDetails?.purchasePrice || 0;
      amountToParticipants = totalPrice * participantsShare;
    }

    // Get all participants who existed before this sale (excluding the buyer and same-day buyers)
    const existingParticipants = allParticipants
      .filter(p => {
        const pEntryDate = ensureDate(
          p.entryDate || (p.isFounder ? deedDateObj : undefined),
          p.isFounder ? deedDateObj : new Date()
        );
        const pSurface = p.surface || 0;
        
        // Must exist before the sale
        if (pEntryDate > saleDate) {
          return false;
        }
        
        // Must have surface
        if (pSurface <= 0) {
          return false;
        }
        
        // Exclusion Rule 1: Exclude the buyer from their own purchase
        if (p.name === buyerName) {
          return false;
        }
        
        // Exclusion Rule 2: Exclude same-day buyers (non-founders who entered on the same day as the buyer)
        if (!p.isFounder && isSameDay(pEntryDate, saleDate) && p.name !== participant.name) {
          return false;
        }
        
        return true;
      })
      .map(p => ({
        name: p.name,
        surface: p.surface || 0,
        isFounder: p.isFounder || false,
        entryDate: ensureDate(
          p.entryDate || (p.isFounder ? deedDateObj : undefined),
          p.isFounder ? deedDateObj : new Date()
        )
      }));

    // Calculate redistribution for this sale
    const redistribution = calculateCoproRedistribution(
      amountToParticipants,
      existingParticipants,
      saleDate
    );

    // Find this participant's share
    const participantShare = redistribution.find(r => r.participantName === participant.name);
    if (participantShare && participantShare.share > 0) {
      coproPaybacks.push({
        date: saleDate,
        buyer: buyerName,
        amount: participantShare.share,
        type: 'copro' as const,
        description: `Redistribution vente copropriété (quotité: ${(participantShare.quotite * 100).toFixed(1)}%)`
      });
    }
  }

  // 3. Combine and sort all paybacks by date
  const allPaybacks = [...portagePaybacks, ...coproPaybacks]
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  // 4. Calculate total
  const totalRecovered = allPaybacks.reduce((sum, pb) => sum + pb.amount, 0);

  return {
    paybacks: allPaybacks,
    totalRecovered
  };
}
