// ============================================
// PARTICIPANT TYPES
// ============================================

export interface Participant {
  id: string;
  name: string;
  isFounder: boolean;
  entryDate: Date;
  lotsOwned: LotOwnership[];
  loans: FinancingDetails[]; // Array to support multiple loans (purchase + renovation)
}

export interface LotOwnership {
  lotId: string;
  acquisitionDate: Date;
  acquisitionCost: number;
  surface: number;
}

export interface FinancingDetails {
  loanAmount: number;
  interestRate: number;
  durationYears: number;
  monthlyPayment: number;
  purpose: 'purchase' | 'renovation'; // Purchase loan or private renovation loan
  disbursementDate?: Date;
}

export interface ParticipantCosts {
  partAchat: number;              // Purchase share
  droitEnregistrement: number;    // Registration fees (3% or 12.5%)
  travauxCommuns: number;         // Common areas costs
  casco: number;                  // Shell construction
  parachevements: number;         // Finishing work
}

// ============================================
// LOT TYPES
// ============================================

export type LotOrigin = 'founder' | 'copro';
export type LotStatus = 'available' | 'reserved' | 'sold' | 'hidden';

export interface Lot {
  id: string;
  origin: LotOrigin;
  status: LotStatus;
  ownerId: string | 'copropriete';

  surface: number;
  imposedSurface?: number;
  flexibleSurface?: boolean;

  heldForPortage: boolean;

  acquisition?: {
    date: Date;
    totalCost: number;
    purchaseShare: number;
    registrationFees: number;
    constructionCost: number;
    fraisCommuns: number;
  };

  renovationCosts?: number;
  permitAllowsModification?: boolean;
}

// ============================================
// PROJECT CONTEXT
// ============================================

export interface ProjectContext {
  // Legal milestones
  compromisDate: Date | null;
  deedDate: Date | null;
  registrationDate: Date | null;
  precadReferenceNumber: string | null;
  precadRequestDate: Date | null;
  acteDeBaseDate: Date | null;
  acteTranscriptionDate: Date | null;
  acpEnterpriseNumber: string | null;
  permitRequestedDate: Date | null;
  permitGrantedDate: Date | null;
  permitEnactedDate: Date | null;

  // Core data
  participants: Participant[];
  lots: Lot[];
  salesHistory: Sale[];

  // Financing
  financingApplications: Map<string, LoanApplication>;
  requiredFinancing: number;
  approvedFinancing: number;
  bankDeadline: Date | null;

  // ACP loans
  acpLoans: Map<string, ACPLoan>;
  acpBankAccount: number;

  // Project financials
  projectFinancials: ProjectFinancials;
}

// Stub types (will be filled in later tasks)
export type Sale = any;
export type LoanApplication = any;
export type ACPLoan = any;
export type ProjectFinancials = any;
