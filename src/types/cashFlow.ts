/**
 * Cash Flow Transaction Types
 *
 * Tracks all financial transactions for participants and copropriété
 * From deed date onwards
 */

/**
 * Transaction type discriminator
 */
export type TransactionType =
  | 'LOT_PURCHASE'       // Initial or subsequent lot purchase
  | 'LOT_SALE'           // Sale of a lot
  | 'NOTARY_FEES'        // Notary fees for purchase
  | 'LOAN_PAYMENT'       // Monthly loan payment (principal + interest)
  | 'PROPERTY_TAX'       // Property tax payment
  | 'INSURANCE'          // Building insurance
  | 'COMMON_CHARGES'     // Monthly common charges (copro fees)
  | 'COPRO_CONTRIBUTION' // One-time copro contribution for works
  | 'REDISTRIBUTION';    // Share of hidden lot sale proceeds

/**
 * Transaction category
 */
export type TransactionCategory = 'ONE_SHOT' | 'RECURRING';

/**
 * Individual cash flow transaction
 */
export interface CashFlowTransaction {
  id: string;
  participantName: string;
  date: Date;
  type: TransactionType;
  category: TransactionCategory;
  amount: number; // Negative = cash out, Positive = cash in
  description: string;
  metadata?: Record<string, unknown>;
  runningBalance?: number; // Cumulative cash position after this transaction
}

/**
 * Participant's complete cash flow
 */
export interface ParticipantCashFlow {
  participantName: string;
  transactions: CashFlowTransaction[];
  summary: {
    totalInvested: number;   // Sum of all cash out
    totalReceived: number;   // Sum of all cash in
    netPosition: number;     // totalReceived - totalInvested
    monthlyBurnRate: number; // Average monthly recurring expenses
  };
}
