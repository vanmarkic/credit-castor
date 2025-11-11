/**
 * Year-by-year Frais Généraux calculations
 *
 * Requirements:
 * - Year 1: One-time costs + Recurring Year 1 + (Honoraires ÷ 3)
 * - Year 2: Recurring Year 2 + (Honoraires ÷ 3)
 * - Year 3: Recurring Year 3 + (Honoraires ÷ 3)
 * - Costs split equally per participant
 * - Founders pay at deed date
 * - Newcomers reimburse founders (reimbursement model)
 * - Participants who exit don't owe future costs
 */

import type { Participant, ProjectParams, UnitDetails } from './calculatorUtils';
import { getFraisGenerauxBreakdown } from './calculatorUtils';
import type {
  FraisGenerauxYearlyEvent,
  NewcomerFraisGenerauxReimbursementEvent
} from '../types/timeline';

/**
 * Year-by-year cost breakdown
 */
export interface YearlyFraisGeneraux {
  year: 1 | 2 | 3;
  date: Date;
  oneTimeCosts: number;
  recurringYearlyCosts: number;
  honorairesThisYear: number; // Honoraires ÷ 3
  total: number;
}

/**
 * Participant payment for a specific year
 */
export interface ParticipantYearlyPayment {
  participantName: string;
  year: 1 | 2 | 3;
  amountOwed: number;
  isFounder: boolean;
  isActive: boolean; // Active at this year's date
}

/**
 * Reimbursement when newcomer joins
 */
export interface NewcomerReimbursement {
  newcomerName: string;
  entryDate: Date;
  year: 1 | 2 | 3;
  reimbursements: Array<{
    toParticipant: string;
    amount: number;
  }>;
  totalPaid: number;
}

/**
 * Calculate Year 1 costs
 * Year 1 = One-time + Recurring Year 1 + (Honoraires ÷ 3)
 */
export function calculateYear1Costs(
  participants: Participant[],
  projectParams: ProjectParams,
  unitDetails: UnitDetails,
  deedDate: Date
): YearlyFraisGeneraux {
  const breakdown = getFraisGenerauxBreakdown(participants, projectParams, unitDetails);

  const honorairesYear1 = breakdown.honoraires / 3;
  const recurringYear1 = breakdown.recurringYearly.total;
  const oneTimeCosts = breakdown.oneTimeCosts.total;

  const total = oneTimeCosts + recurringYear1 + honorairesYear1;

  return {
    year: 1,
    date: deedDate,
    oneTimeCosts,
    recurringYearlyCosts: recurringYear1,
    honorairesThisYear: honorairesYear1,
    total
  };
}

/**
 * Calculate Year 2 costs
 * Year 2 = Recurring Year 2 + (Honoraires ÷ 3)
 */
export function calculateYear2Costs(
  participants: Participant[],
  projectParams: ProjectParams,
  unitDetails: UnitDetails,
  deedDate: Date
): YearlyFraisGeneraux {
  const breakdown = getFraisGenerauxBreakdown(participants, projectParams, unitDetails);

  const honorairesYear2 = breakdown.honoraires / 3;
  const recurringYear2 = breakdown.recurringYearly.total;

  const total = recurringYear2 + honorairesYear2;

  // Year 2 date = deed date + 1 year
  const year2Date = new Date(deedDate);
  year2Date.setFullYear(year2Date.getFullYear() + 1);

  return {
    year: 2,
    date: year2Date,
    oneTimeCosts: 0,
    recurringYearlyCosts: recurringYear2,
    honorairesThisYear: honorairesYear2,
    total
  };
}

/**
 * Calculate Year 3 costs
 * Year 3 = Recurring Year 3 + (Honoraires ÷ 3)
 */
export function calculateYear3Costs(
  participants: Participant[],
  projectParams: ProjectParams,
  unitDetails: UnitDetails,
  deedDate: Date
): YearlyFraisGeneraux {
  const breakdown = getFraisGenerauxBreakdown(participants, projectParams, unitDetails);

  const honorairesYear3 = breakdown.honoraires / 3;
  const recurringYear3 = breakdown.recurringYearly.total;

  const total = recurringYear3 + honorairesYear3;

  // Year 3 date = deed date + 2 years
  const year3Date = new Date(deedDate);
  year3Date.setFullYear(year3Date.getFullYear() + 2);

  return {
    year: 3,
    date: year3Date,
    oneTimeCosts: 0,
    recurringYearlyCosts: recurringYear3,
    honorairesThisYear: honorairesYear3,
    total
  };
}

/**
 * Calculate all 3 years of frais généraux
 */
export function calculateAllYearlyFraisGeneraux(
  participants: Participant[],
  projectParams: ProjectParams,
  unitDetails: UnitDetails,
  deedDate: Date
): YearlyFraisGeneraux[] {
  return [
    calculateYear1Costs(participants, projectParams, unitDetails, deedDate),
    calculateYear2Costs(participants, projectParams, unitDetails, deedDate),
    calculateYear3Costs(participants, projectParams, unitDetails, deedDate)
  ];
}

/**
 * Get active participants at a specific date
 * Active = entered before or at date AND (no exit date OR exit date is after date)
 */
export function getActiveParticipantsAtDate(
  participants: Participant[],
  date: Date
): Participant[] {
  return participants.filter(p => {
    const entryDate = p.entryDate || new Date(0); // Default to epoch if no entry date
    const hasEntered = entryDate <= date;

    const hasNotExited = !p.exitDate || p.exitDate > date;

    return hasEntered && hasNotExited;
  });
}

/**
 * Calculate payment per participant for a specific year
 * Split equally among active participants at that year's date
 */
export function calculateParticipantYearlyPayments(
  participants: Participant[],
  yearCosts: YearlyFraisGeneraux
): ParticipantYearlyPayment[] {
  const activeParticipants = getActiveParticipantsAtDate(participants, yearCosts.date);

  if (activeParticipants.length === 0) {
    return [];
  }

  const costPerParticipant = yearCosts.total / activeParticipants.length;

  return activeParticipants.map(p => ({
    participantName: p.name,
    year: yearCosts.year,
    amountOwed: costPerParticipant,
    isFounder: p.isFounder || false,
    isActive: true
  }));
}

/**
 * Calculate founders' initial payment at deed date
 * Only founders (isFounder = true) split Year 1 costs at deed date
 */
export function calculateFoundersInitialPayment(
  participants: Participant[],
  year1Costs: YearlyFraisGeneraux
): ParticipantYearlyPayment[] {
  const founders = participants.filter(p => p.isFounder === true);

  if (founders.length === 0) {
    return [];
  }

  const costPerFounder = year1Costs.total / founders.length;

  return founders.map(p => ({
    participantName: p.name,
    year: 1,
    amountOwed: costPerFounder,
    isFounder: true,
    isActive: true
  }));
}

/**
 * Calculate reimbursement when a newcomer joins
 *
 * Logic:
 * 1. Founders paid upfront at deed date (split among founders)
 * 2. When newcomer joins, recalculate costs for ALL participants
 * 3. Newcomer reimburses each existing participant for their overpayment
 *
 * Example:
 * - Year 1 total: €19,533.38
 * - 2 founders paid: €9,766.69 each
 * - Newcomer joins → recalculate: €19,533.38 ÷ 3 = €6,511.13 per person
 * - Founders overpaid: €9,766.69 - €6,511.13 = €3,255.56
 * - Newcomer pays: €3,255.56 × 2 = €6,511.12 (reimburses both founders)
 */
export function calculateNewcomerReimbursement(
  participants: Participant[],
  newcomer: Participant,
  year1Costs: YearlyFraisGeneraux
): NewcomerReimbursement {
  // Get all participants who were active at newcomer's entry date (including newcomer)
  const activeParticipants = getActiveParticipantsAtDate(participants, newcomer.entryDate!);

  // Fair share per person with newcomer included
  const fairSharePerPerson = year1Costs.total / activeParticipants.length;

  // Calculate reimbursements to existing participants (excluding newcomer)
  const existingParticipants = activeParticipants.filter(p => p.name !== newcomer.name);

  const reimbursements = existingParticipants.map(p => {
    // Each existing participant already paid their share as if there were fewer people
    // Calculate their original payment amount
    const foundersAtDeedDate = participants.filter(p => p.isFounder === true);
    const originalCostPerFounder = year1Costs.total / foundersAtDeedDate.length;

    // Their overpayment is the difference
    const overpayment = originalCostPerFounder - fairSharePerPerson;

    return {
      toParticipant: p.name,
      amount: overpayment
    };
  });

  // Newcomer's total payment = sum of all reimbursements
  const totalPaid = reimbursements.reduce((sum, r) => sum + r.amount, 0);

  return {
    newcomerName: newcomer.name,
    entryDate: newcomer.entryDate!,
    year: 1,
    reimbursements,
    totalPaid
  };
}

/**
 * Calculate reimbursement when multiple newcomers join at different times
 *
 * When a second newcomer joins:
 * - Recalculate fair share for ALL participants (founders + first newcomer + second newcomer)
 * - Second newcomer reimburses EVERYONE who already paid (founders + first newcomer)
 */
export function calculateMultipleNewcomerReimbursements(
  participants: Participant[],
  year1Costs: YearlyFraisGeneraux,
  deedDate: Date
): NewcomerReimbursement[] {
  // Sort newcomers by entry date
  const newcomers = participants
    .filter(p => !p.isFounder && p.entryDate && p.entryDate > deedDate)
    .sort((a, b) => (a.entryDate?.getTime() || 0) - (b.entryDate?.getTime() || 0));

  const reimbursements: NewcomerReimbursement[] = [];

  // Track who has paid and how much
  const participantPayments = new Map<string, number>();

  // Initialize founders' payments
  const founders = participants.filter(p => p.isFounder === true);
  const initialCostPerFounder = year1Costs.total / founders.length;
  founders.forEach(f => {
    participantPayments.set(f.name, initialCostPerFounder);
  });

  // Process each newcomer in chronological order
  for (const newcomer of newcomers) {
    const activeAtEntry = getActiveParticipantsAtDate(participants, newcomer.entryDate!);
    const fairShare = year1Costs.total / activeAtEntry.length;

    // Calculate reimbursements to everyone who already paid
    const existingParticipants = activeAtEntry.filter(p => p.name !== newcomer.name);

    const newcomerReimbursements = existingParticipants.map(p => {
      const currentPayment = participantPayments.get(p.name) || 0;
      const overpayment = currentPayment - fairShare;

      // Update their net payment after reimbursement
      participantPayments.set(p.name, fairShare);

      return {
        toParticipant: p.name,
        amount: overpayment
      };
    });

    const totalPaid = newcomerReimbursements.reduce((sum, r) => sum + r.amount, 0);

    // Record newcomer's payment
    participantPayments.set(newcomer.name, totalPaid);

    reimbursements.push({
      newcomerName: newcomer.name,
      entryDate: newcomer.entryDate!,
      year: 1,
      reimbursements: newcomerReimbursements,
      totalPaid
    });
  }

  return reimbursements;
}

/**
 * Generate timeline event for Year 1/2/3 frais généraux payment
 */
export function generateFraisGenerauxYearlyEvent(
  yearCosts: YearlyFraisGeneraux,
  payments: ParticipantYearlyPayment[]
): FraisGenerauxYearlyEvent {
  const eventType = `FRAIS_GENERAUX_YEAR_${yearCosts.year}` as 'FRAIS_GENERAUX_YEAR_1' | 'FRAIS_GENERAUX_YEAR_2' | 'FRAIS_GENERAUX_YEAR_3';

  return {
    id: `frais-generaux-year-${yearCosts.year}-${yearCosts.date.getTime()}`,
    type: eventType,
    date: yearCosts.date,
    year: yearCosts.year,
    breakdown: {
      oneTimeCosts: yearCosts.oneTimeCosts,
      recurringYearlyCosts: yearCosts.recurringYearlyCosts,
      honorairesThisYear: yearCosts.honorairesThisYear,
      total: yearCosts.total
    },
    payments: payments.map(p => ({
      participantName: p.participantName,
      amountOwed: p.amountOwed,
      isFounder: p.isFounder
    }))
  };
}

/**
 * Generate timeline event for newcomer reimbursement
 */
export function generateNewcomerReimbursementEvent(
  reimbursement: NewcomerReimbursement
): NewcomerFraisGenerauxReimbursementEvent {
  return {
    id: `newcomer-reimbursement-${reimbursement.newcomerName}-${reimbursement.entryDate.getTime()}`,
    type: 'NEWCOMER_FRAIS_GENERAUX_REIMBURSEMENT',
    date: reimbursement.entryDate,
    year: reimbursement.year,
    newcomerName: reimbursement.newcomerName,
    reimbursements: reimbursement.reimbursements,
    totalPaid: reimbursement.totalPaid,
    description: `${reimbursement.newcomerName} reimburses founders for Year ${reimbursement.year} Frais Généraux overpayment`
  };
}

/**
 * Generate all frais généraux timeline events for a project
 *
 * Returns:
 * - Year 1/2/3 payment events at deed date, +1 year, +2 years
 * - Newcomer reimbursement events when newcomers join
 */
export function generateAllFraisGenerauxEvents(
  participants: Participant[],
  projectParams: ProjectParams,
  unitDetails: UnitDetails,
  deedDate: Date
): Array<FraisGenerauxYearlyEvent | NewcomerFraisGenerauxReimbursementEvent> {
  const events: Array<FraisGenerauxYearlyEvent | NewcomerFraisGenerauxReimbursementEvent> = [];

  // Calculate all 3 years
  const allYears = calculateAllYearlyFraisGeneraux(participants, projectParams, unitDetails, deedDate);

  // Year 1: Founders pay at deed date
  const year1 = allYears[0];
  const year1Payments = calculateFoundersInitialPayment(participants, year1);
  events.push(generateFraisGenerauxYearlyEvent(year1, year1Payments));

  // Newcomer reimbursements for Year 1
  const reimbursements = calculateMultipleNewcomerReimbursements(participants, year1, deedDate);
  reimbursements.forEach(reimbursement => {
    events.push(generateNewcomerReimbursementEvent(reimbursement));
  });

  // Year 2: Active participants at Year 2 date
  const year2 = allYears[1];
  const year2Payments = calculateParticipantYearlyPayments(participants, year2);
  if (year2Payments.length > 0) {
    events.push(generateFraisGenerauxYearlyEvent(year2, year2Payments));
  }

  // Year 3: Active participants at Year 3 date
  const year3 = allYears[2];
  const year3Payments = calculateParticipantYearlyPayments(participants, year3);
  if (year3Payments.length > 0) {
    events.push(generateFraisGenerauxYearlyEvent(year3, year3Payments));
  }

  // Sort events by date
  events.sort((a, b) => a.date.getTime() - b.date.getTime());

  return events;
}
