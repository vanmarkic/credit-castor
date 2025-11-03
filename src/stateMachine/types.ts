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

// ============================================
// SALE TYPES
// ============================================

export type SaleType = 'portage' | 'copro' | 'classic';

interface BaseSale {
  lotId: string;
  buyer: string;
  saleDate: Date;
}

export interface PortageSale extends BaseSale {
  type: 'portage';
  seller: string;
  pricing: PortagePricing;
}

export interface PortagePricing {
  baseAcquisitionCost: number;
  indexation: number;
  carryingCosts: CarryingCosts;
  renovations: number;
  registrationFeesRecovery: number;
  fraisCommunsRecovery: number;
  loanInterestRecovery: number;
  totalPrice: number;
}

export interface CarryingCosts {
  monthlyLoanInterest: number;
  propertyTax: number;
  buildingInsurance: number;
  syndicFees: number;
  chargesCommunes: number;
  totalMonths: number;
  total: number;
}

export interface CoproSale extends BaseSale {
  type: 'copro';
  surface: number;
  pricing: CoproPricing;
}

export interface CoproPricing {
  baseCostPerSqm: number;
  gen1CompensationPerSqm: number;
  pricePerSqm: number;
  surface: number;
  totalPrice: number;
}

export interface ClassicSale extends BaseSale {
  type: 'classic';
  seller: string;
  price: number;
  buyerApproval: BuyerApproval;
  priceCap: number;
}

export interface BuyerApproval {
  candidateId: string;
  interviewDate: Date;
  approved: boolean;
  notes: string;
}

export type Sale = PortageSale | CoproSale | ClassicSale;

// ============================================
// LOAN TYPES
// ============================================

export type LoanStatus = 'not_applied' | 'pending' | 'approved' | 'rejected';

export interface LoanApplication {
  participantId: string;
  status: LoanStatus;
  loanAmount: number;
  interestRate: number;
  durationYears: number;
  purpose: 'purchase' | 'renovation'; // Distinguish between initial purchase and private renovation
  applicationDate: Date;
  approvalDate?: Date;
  disbursementDate?: Date;
  bankName?: string;
  rejectionReason?: string;
}

// ============================================
// ACP COLLECTIVE LOAN TYPES
// ============================================

export type ACPLoanPurpose = 'roof' | 'staircases' | 'facade' | 'common_areas' | 'other';
export type ACPLoanStatus = 'proposed' | 'voting' | 'capital_gathering' | 'loan_application' | 'approved' | 'disbursed' | 'rejected';

export interface ACPLoan {
  id: string;
  purpose: ACPLoanPurpose;
  description: string;
  totalAmount: number;

  capitalRequired: number;
  capitalGathered: number;
  contributions: Map<string, ACPContribution>;

  loanAmount: number;
  interestRate: number;
  durationYears: number;

  votingRules: VotingRules;
  votes: Map<string, ParticipantVote>;
  votingResults?: VotingResults;
  approvedByCoowners: boolean;
  votingDate: Date | null;

  applicationDate: Date;
  approvalDate: Date | null;
  disbursementDate: Date | null;
  status: ACPLoanStatus;
}

export interface ACPContribution {
  participantId: string;
  amountPledged: number;
  amountPaid: number;
  quotiteShare: number;
  paymentDate: Date | null;
}

// ============================================
// VOTING TYPES
// ============================================

export type VotingMethod = 'one_person_one_vote' | 'quotite_weighted' | 'hybrid';

export interface VotingRules {
  method: VotingMethod;
  quorumPercentage: number;
  majorityPercentage: number;
  hybridWeights?: {
    democraticWeight: number;
    quotiteWeight: number;
  };
}

export interface ParticipantVote {
  participantId: string;
  vote: 'for' | 'against' | 'abstain';
  quotite: number;
  timestamp: Date;
}

export interface VotingResults {
  totalVoters: number;
  votesFor: number;
  votesAgainst: number;
  abstentions: number;

  totalQuotite: number;
  quotiteFor: number;
  quotiteAgainst: number;
  quotiteAbstained: number;

  hybridScore?: number;

  quorumReached: boolean;
  majorityReached: boolean;
  democraticMajority: boolean;
  quotiteMajority: boolean;
}

// ============================================
// FINANCIAL TYPES
// ============================================

export interface ProjectFinancials {
  totalPurchasePrice: number;
  fraisGeneraux: FraisGeneraux;
  travauxCommuns: number;
  expenseCategories: {
    conservatoire: number;
    habitabiliteSommaire: number;
    premierTravaux: number;
  };
  globalCascoPerM2: number;
  indexRates: IndexRate[];
}

export interface FraisGeneraux {
  architectFees: number;
  recurringCosts: RecurringCosts;
  oneTimeCosts: number;
  total3Years: number;
}

export interface RecurringCosts {
  propertyTax: number;
  accountant: number;
  podio: number;
  buildingInsurance: number;
  reservationFees: number;
  contingencies: number;
  syndicFees?: number;
  chargesCommunes?: number;
}

export interface IndexRate {
  year: number;
  rate: number;
}
