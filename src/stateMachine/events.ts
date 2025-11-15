// ============================================
// PURCHASE & LEGAL EVENTS
// ============================================

export type PurchaseEvents =
  | { type: 'COMPROMIS_SIGNED'; compromisDate: Date; deposit: number }
  | { type: 'FINANCING_APPROVED'; participantId: string }
  | { type: 'FINANCING_REJECTED'; participantId: string; reason: string }
  | { type: 'ALL_CONDITIONS_MET' }
  | { type: 'DEED_SIGNED'; deedDate: Date; notaryId: string }
  | { type: 'DEED_REGISTERED'; registrationDate: Date };

// ============================================
// COPROPRIÉTÉ CREATION EVENTS
// ============================================

export type CoproCreationEvents =
  | { type: 'START_COPRO_CREATION' }
  | { type: 'TECHNICAL_REPORT_READY' }
  | { type: 'PRECAD_REQUESTED'; referenceNumber: string }
  | { type: 'PRECAD_APPROVED'; approvalDate: Date }
  | { type: 'ACTE_DRAFTED' }
  | { type: 'ACTE_SIGNED'; signatureDate: Date }
  | { type: 'ACTE_TRANSCRIBED'; transcriptionDate: Date; acpNumber: string };

// ============================================
// PERMIT EVENTS
// ============================================

export type PermitEvents =
  | { type: 'REQUEST_PERMIT' }
  | { type: 'PERMIT_GRANTED'; grantDate: Date }
  | { type: 'PERMIT_ENACTED'; enactmentDate: Date }
  | { type: 'PERMIT_REJECTED'; reason: string }
  | { type: 'DECLARE_HIDDEN_LOTS'; lotIds: string[] };

// ============================================
// SALES EVENTS
// ============================================

export type SalesEvents =
  | { type: 'FIRST_SALE' }
  | { type: 'SALE_INITIATED'; lotId: string; sellerId: string; buyerId: string; proposedPrice: number; saleDate: Date }
  | { type: 'BUYER_APPROVED'; candidateId: string }
  | { type: 'BUYER_REJECTED'; candidateId: string; reason: string }
  | { type: 'PRICE_ADJUSTED'; newPrice: number }
  | { type: 'COMPLETE_SALE' }
  | { type: 'SALE_CANCELLED'; reason: string }
  | { type: 'ALL_LOTS_SOLD' };

// ============================================
// FINANCING EVENTS
// ============================================

export interface LoanDetails {
  amount: number;
  rate: number;
  duration: number;
  bankName: string;
}

export type FinancingEvents =
  | { type: 'APPLY_FOR_LOAN'; participantId: string; loanDetails: LoanDetails }
  | { type: 'SUBMIT_DOCUMENTS'; participantId: string }
  | { type: 'BANK_REQUESTS_INFO'; participantId: string; request: string }
  | { type: 'PROVIDE_INFO'; participantId: string }
  | { type: 'BANK_APPROVES'; participantId: string }
  | { type: 'BANK_REJECTS'; participantId: string; reason: string }
  | { type: 'VALUATION_SCHEDULED'; participantId: string; date: Date }
  | { type: 'VALUATION_COMPLETED'; participantId: string; appraisedValue: number };

// ============================================
// ACP LOAN EVENTS
// ============================================

export interface ProposedACPLoan {
  purpose: 'roof' | 'staircases' | 'facade' | 'common_areas' | 'other';
  description: string;
  totalAmount: number;
  capitalRequired: number;
}

export type ACPLoanEvents =
  | { type: 'PROPOSE_ACP_LOAN'; loanDetails: ProposedACPLoan }
  | { type: 'SCHEDULE_VOTE'; votingDate: Date }
  | { type: 'VOTE_ON_LOAN'; participantId: string; vote: 'for' | 'against' | 'abstain' }
  | { type: 'VOTING_COMPLETE' }
  | { type: 'PLEDGE_CAPITAL'; participantId: string; amount: number }
  | { type: 'PAY_CAPITAL'; participantId: string; amount: number }
  | { type: 'APPLY_FOR_ACP_LOAN'; loanId: string }
  | { type: 'ACP_LOAN_APPROVED'; loanId: string }
  | { type: 'ACP_LOAN_REJECTED'; loanId: string; reason: string }
  | { type: 'DISBURSE_ACP_LOAN'; loanId: string };

// ============================================
// RENT-TO-OWN EVENTS
// ============================================

export type RentToOwnEvents =
  | { type: 'INITIATE_RENT_TO_OWN'; saleId: string; trialMonths: number; monthlyPayment: number }
  | { type: 'RENT_TO_OWN_PAYMENT_RECORDED'; agreementId: string; amount: number; date: Date }
  | { type: 'RENT_TO_OWN_BUYER_REQUESTS_PURCHASE'; agreementId: string }
  | { type: 'RENT_TO_OWN_BUYER_DECLINES'; agreementId: string }
  | { type: 'RENT_TO_OWN_EXTENSION_REQUESTED'; agreementId: string; additionalMonths: number }
  | { type: 'RENT_TO_OWN_COMPLETED'; agreementId: string }
  | { type: 'RENT_TO_OWN_CANCELLED'; agreementId: string };

// ============================================
// CALCULATOR INTEGRATION EVENTS
// ============================================

export type CalculatorEvents =
  | { type: 'UPDATE_PROJECT_PARAMS'; params: any } // ProjectParams from calculator
  | { type: 'UPDATE_UNIT_DETAILS'; unitDetails: any } // UnitDetails from calculator
  | { type: 'CALCULATE_PARTICIPANT_FINANCIAL_STATE'; participantId: string }
  | { type: 'UPDATE_PARTICIPANT_FINANCIAL_STATE'; participantId: string; financialState: any } // ParticipantFinancialState
  | { type: 'RECALCULATE_ALL_PARTICIPANTS' };

// ============================================
// PARTICIPANT MANAGEMENT EVENTS
// ============================================

export type ParticipantManagementEvents =
  | { type: 'ADD_PARTICIPANT'; participant: any } // Participant from calculator
  | { type: 'UPDATE_PARTICIPANT'; participantId: string; updates: Partial<any> }
  | { type: 'REMOVE_PARTICIPANT'; participantId: string }
  | { type: 'ENABLE_PARTICIPANT'; participantId: string }
  | { type: 'DISABLE_PARTICIPANT'; participantId: string };

// ============================================
// LOT MANAGEMENT EVENTS
// ============================================

export type LotManagementEvents =
  | { type: 'ADD_LOT'; lot: any } // Lot from calculator
  | { type: 'UPDATE_LOT'; lotId: string; updates: Partial<any> }
  | { type: 'REMOVE_LOT'; lotId: string }
  | { type: 'MARK_LOT_AS_PORTAGE'; lotId: string; heldForPortage: boolean }
  | { type: 'UPDATE_LOT_ACQUISITION'; lotId: string; acquisition: any };

// ============================================
// ALL EVENTS
// ============================================

export type ProjectEvents =
  | PurchaseEvents
  | CoproCreationEvents
  | PermitEvents
  | SalesEvents
  | FinancingEvents
  | ACPLoanEvents
  | RentToOwnEvents
  | CalculatorEvents
  | ParticipantManagementEvents
  | LotManagementEvents;
