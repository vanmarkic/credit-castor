/**
 * Cash Flow Projection (Phase 2.2)
 *
 * Builds participant cash flow from events starting at deed date
 */

import type { DomainEvent, InitialPurchaseEvent, Lot } from '../types/timeline';
import type { CashFlowTransaction, ParticipantCashFlow } from '../types/cashFlow';
import type { Participant } from './calculatorUtils';
import { calculateMonthsBetween } from './coproRedistribution';

/**
 * Build participant's complete cash flow from events
 *
 * @param events - All domain events
 * @param participantName - Name of participant
 * @param endDate - Optional end date for projections (defaults to now)
 * @returns Complete cash flow with transactions and summary
 */
export function buildParticipantCashFlow(
  events: DomainEvent[],
  participantName: string,
  endDate?: Date
): ParticipantCashFlow {
  const transactions: CashFlowTransaction[] = [];
  const finalEndDate = endDate || new Date();

  // Find participant's data from INITIAL_PURCHASE event
  const initialEvent = events.find(e => e.type === 'INITIAL_PURCHASE') as InitialPurchaseEvent | undefined;

  if (!initialEvent) {
    return createEmptyCashFlow(participantName);
  }

  const participant = initialEvent.participants.find(p => p.name === participantName);

  if (!participant) {
    return createEmptyCashFlow(participantName);
  }

  // Extract deed date from initial purchase event
  const deedDate = initialEvent.date;

  // Generate one-shot transactions at deed date
  generateInitialPurchaseTransactions(participant, deedDate, transactions);

  // Generate recurring monthly expenses from deed date to endDate
  generateRecurringExpenses(participant, deedDate, finalEndDate, transactions);

  // Sort by date
  transactions.sort((a, b) => a.date.getTime() - b.date.getTime());

  // Calculate running balance
  let balance = 0;
  transactions.forEach(txn => {
    balance += txn.amount;
    txn.runningBalance = balance;
  });

  // Calculate summary
  const summary = calculateSummary(transactions);

  return {
    participantName,
    transactions,
    summary,
  };
}

/**
 * Generate initial purchase transactions (lot purchase + notary fees)
 */
function generateInitialPurchaseTransactions(
  participant: Participant,
  deedDate: Date,
  transactions: CashFlowTransaction[]
): void {
  // Generate transactions for each lot owned
  participant.lotsOwned?.forEach(lot => {
    // Lot purchase
    const purchasePrice = lot.originalPrice || 0;
    transactions.push({
      id: `txn-purchase-${lot.lotId}`,
      participantName: participant.name,
      date: deedDate,
      type: 'LOT_PURCHASE',
      category: 'ONE_SHOT',
      amount: -purchasePrice,
      description: `Purchase of lot #${lot.lotId} (deed date)`,
      metadata: {
        lotId: lot.lotId,
        purchasePrice,
      },
    });

    // Notary fees
    const notaryFees = lot.originalNotaryFees || 0;
    if (notaryFees > 0) {
      transactions.push({
        id: `txn-notary-${lot.lotId}`,
        participantName: participant.name,
        date: deedDate,
        type: 'NOTARY_FEES',
        category: 'ONE_SHOT',
        amount: -notaryFees,
        description: `Notary fees for lot #${lot.lotId}`,
        metadata: {
          lotId: lot.lotId,
          notaryFees,
        },
      });
    }
  });
}

/**
 * Generate recurring monthly expenses from deed date to end date
 */
function generateRecurringExpenses(
  participant: Participant,
  deedDate: Date,
  endDate: Date,
  transactions: CashFlowTransaction[]
): void {
  const monthsToProject = Math.ceil(calculateMonthsBetween(deedDate, endDate));

  // Generate monthly expenses for each month
  for (let month = 1; month <= monthsToProject; month++) {
    const txnDate = addMonths(deedDate, month);

    // Generate loan payments for each lot
    participant.lotsOwned?.forEach(lot => {
      generateLoanPayment(participant, lot, txnDate, month, transactions);
    });
  }
}

/**
 * Generate a single loan payment transaction
 */
function generateLoanPayment(
  participant: Participant,
  lot: Lot,
  date: Date,
  monthsSinceDeed: number,
  transactions: CashFlowTransaction[]
): void {
  const loanAmount = lot.originalPrice || 0;
  const capitalApporte = participant.capitalApporte || 0;
  const borrowedAmount = Math.max(0, loanAmount - capitalApporte);

  if (borrowedAmount === 0) {
    return; // No loan needed
  }

  const interestRate = participant.interestRate || 0.04;
  const monthlyRate = interestRate / 12;
  const durationMonths = (participant.durationYears || 20) * 12;

  // Calculate monthly payment (principal + interest)
  const monthlyPayment = borrowedAmount * (monthlyRate * Math.pow(1 + monthlyRate, durationMonths)) /
    (Math.pow(1 + monthlyRate, durationMonths) - 1);

  // Calculate principal and interest for this month
  const remainingBalance = borrowedAmount * (
    (Math.pow(1 + monthlyRate, durationMonths) - Math.pow(1 + monthlyRate, monthsSinceDeed - 1)) /
    (Math.pow(1 + monthlyRate, durationMonths) - 1)
  );

  const interest = remainingBalance * monthlyRate;
  const principal = monthlyPayment - interest;

  // For portage lots: interest only
  const actualPrincipal = lot.isPortage ? 0 : principal;
  const actualPayment = lot.isPortage ? interest : monthlyPayment;

  transactions.push({
    id: `txn-loan-${lot.lotId}-${monthsSinceDeed}`,
    participantName: participant.name,
    date,
    type: 'LOAN_PAYMENT',
    category: 'RECURRING',
    amount: -actualPayment,
    description: `Monthly loan payment (${formatDate(date)})`,
    metadata: {
      lotId: lot.lotId,
      monthsSinceDeed,
      principal: actualPrincipal,
      interest,
      isPortage: lot.isPortage,
    },
  });
}

/**
 * Calculate summary metrics
 */
function calculateSummary(
  transactions: CashFlowTransaction[]
): ParticipantCashFlow['summary'] {
  const totalInvested = transactions
    .filter(t => t.amount < 0)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const totalReceived = transactions
    .filter(t => t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0);

  const netPosition = totalReceived - totalInvested;

  // Calculate monthly burn rate (recurring expenses only)
  const recurringExpenses = transactions
    .filter(t => t.category === 'RECURRING' && t.amount < 0);

  const monthlyBurnRate = recurringExpenses.length > 0
    ? recurringExpenses.reduce((sum, t) => sum + Math.abs(t.amount), 0) / recurringExpenses.length
    : 0;

  return {
    totalInvested,
    totalReceived,
    netPosition,
    monthlyBurnRate,
  };
}

/**
 * Create empty cash flow for non-existent participant
 */
function createEmptyCashFlow(participantName: string): ParticipantCashFlow {
  return {
    participantName,
    transactions: [],
    summary: {
      totalInvested: 0,
      totalReceived: 0,
      netPosition: 0,
      monthlyBurnRate: 0,
    },
  };
}

/**
 * Add months to a date
 */
function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

/**
 * Format date as MMM YYYY
 */
function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}
