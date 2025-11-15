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
  
  // Financial state (calculated from calculator)
  financialState?: ParticipantFinancialState;
  
  // Two-loan financing support (from calculator)
  useTwoLoans?: boolean;
  loan2DelayYears?: number;
  loan2RenovationAmount?: number;
  capitalForLoan1?: number;
  capitalForLoan2?: number;
  
  // Purchase details for newcomers (from calculator)
  purchaseDetails?: {
    buyingFrom: string; // Participant name or "Copropriété"
    lotId: number;
    purchasePrice: number;
    breakdown?: {
      basePrice: number;
      indexation: number;
      carryingCostRecovery: number;
      feesRecovery: number;
      renovations: number;
    };
  };
  
  // Construction cost overrides (from calculator)
  parachevementsPerM2?: number;
  cascoSqm?: number;
  parachevementsSqm?: number;
  
  // Enable/disable participant
  enabled?: boolean;
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

/**
 * Participant Financial State - calculated from calculator
 * Tracks all financial calculations for a participant
 */
export interface ParticipantFinancialState {
  // Purchase costs
  purchaseShare: number;
  pricePerM2: number;
  quantity: number;
  
  // Fees
  droitEnregistrements: number;
  fraisNotaireFixe: number;
  
  // Construction costs
  casco: number;
  parachevements: number;
  personalRenovationCost: number; // CASCO + parachèvements
  constructionCost: number;
  
  // Shared costs
  sharedCosts: number;
  travauxCommunsPerUnit: number;
  
  // Total cost
  totalCost: number;
  capitalApporte: number;
  
  // Financing (single loan)
  loanNeeded?: number;
  monthlyPayment?: number;
  totalRepayment?: number;
  totalInterest?: number;
  financingRatio?: number;
  
  // Two-loan financing
  loan1Amount?: number;
  loan1MonthlyPayment?: number;
  loan1Interest?: number;
  loan2Amount?: number;
  loan2DurationYears?: number;
  loan2MonthlyPayment?: number;
  loan2Interest?: number;
  
  // Newcomer calculations
  quotite?: number; // For newcomers buying from copropriété
  newcomerBasePrice?: number;
  newcomerIndexation?: number;
  newcomerCarryingCostRecovery?: number;
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

  // Portage construction payment configuration
  founderPaysCasco?: boolean; // Founder pays for CASCO during portage period (default: false)
  founderPaysParachèvement?: boolean; // Founder pays for parachèvement during portage period (default: false, requires founderPaysCasco=true)
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
  precadApprovalDate: Date | null;
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

  // Rent-to-own agreements (spawned actors)
  rentToOwnAgreements: Map<string, RentToOwnAgreement>;

  // Shared spaces (spawned actors for usage agreements)
  sharedSpaces: Map<string, SharedSpace>;
  usageAgreements: Map<string, UsageAgreement>;
  usageRecords: UsageRecord[];
  sharedSpaceAlerts: SharedSpaceAlert[];

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
  // DEPRECATED fields (keep for backward compatibility)
  baseCostPerSqm: number;
  /** @deprecated Use breakdown.basePrice instead */
  gen1CompensationPerSqm: number;

  // Current fields
  pricePerSqm: number;
  surface: number;
  totalPrice: number;

  // NEW: Detailed breakdown
  breakdown?: {
    basePrice: number;
    indexation: number;
    carryingCostRecovery: number;
  };

  // NEW: Distribution tracking
  distribution?: {
    toCoproReserves: number;
    toParticipants: Map<string, number>;
  };
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
  
  // Calculator integration - dynamic calculations
  projectParams?: ProjectParams; // Full project parameters from calculator
  dynamicFraisGeneraux3ans?: number; // Calculated dynamically based on CASCO costs
  fraisGenerauxBreakdown?: FraisGenerauxBreakdown; // Detailed breakdown
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

/**
 * Project Parameters - from calculator
 * Used for dynamic calculations in state machine
 */
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
  cascoTvaRate?: number;
  renovationStartDate?: string;
  travauxCommuns?: TravauxCommuns;
}

/**
 * Travaux Communs - customizable common works
 */
export interface TravauxCommuns {
  enabled: boolean;
  items: TravauxCommunsItem[];
}

export interface TravauxCommunsItem {
  label: string;
  sqm: number;
  cascoPricePerSqm: number;
  parachevementPricePerSqm: number;
  amount?: number;
}

/**
 * Frais Généraux Breakdown - detailed breakdown from calculator
 */
export interface FraisGenerauxBreakdown {
  honoraires: {
    total3Years: number;
    yearly: number;
    description: string;
  };
  recurring: {
    precompteImmobilier: number;
    comptable: number;
    podioAbonnement: number;
    assuranceBatiment: number;
    fraisReservation: number;
    imprevus: number;
    yearly: number;
  };
  total: {
    yearly: number;
    total3Years: number;
  };
}

/**
 * Unit Details - from calculator
 * Used for CASCO and parachèvements calculations
 */
export interface UnitDetails {
  [unitId: number]: {
    casco: number;
    parachevements: number;
  };
}

// ============================================
// RENT-TO-OWN TYPES
// ============================================

export interface RentToOwnFormulaParams {
  version: 'v1';

  // Equity/rent split configuration
  equityPercentage: number;  // 0-100, e.g., 50 = 50% to equity
  rentPercentage: number;    // Must sum to 100 with equityPercentage

  // Duration bounds
  minTrialMonths: number;    // Default: 3
  maxTrialMonths: number;    // Default: 24

  // Termination rules
  equityForfeitureOnBuyerExit: number;  // 0-100, e.g., 100 = loses all equity
  equityReturnOnCommunityReject: number; // 0-100, e.g., 100 = gets all equity back

  // Extension rules
  allowExtensions: boolean;
  maxExtensions?: number;
  extensionIncrementMonths?: number;  // e.g., 6 months per extension
}

export const DEFAULT_RENT_TO_OWN_FORMULA: RentToOwnFormulaParams = {
  version: 'v1',

  equityPercentage: 50,  // 50/50 split
  rentPercentage: 50,

  minTrialMonths: 3,
  maxTrialMonths: 24,

  equityForfeitureOnBuyerExit: 100,  // Buyer walks = loses all equity
  equityReturnOnCommunityReject: 100, // Community rejects = full refund

  allowExtensions: true,
  maxExtensions: 2,
  extensionIncrementMonths: 6
};

export interface ExtensionRequest {
  requestDate: Date;
  additionalMonths: number;
  approved: boolean | null;  // null = pending vote
  votingResults?: VotingResults;
}

export interface RentToOwnAgreement {
  id: string;
  underlyingSale: Sale;  // Wraps portage/copro/classic sale

  // Trial configuration
  trialStartDate: Date;
  trialEndDate: Date;
  trialDurationMonths: number;  // 3-24 months

  // Financial tracking
  monthlyPayment: number;
  totalPaid: number;
  equityAccumulated: number;
  rentPaid: number;

  // Formula plugin
  rentToOwnFormula: RentToOwnFormulaParams;

  // Participants
  provisionalBuyerId: string;  // Participant ID
  sellerId: string;  // Participant ID or 'copropriete'

  // Status
  status: 'active' | 'ending_soon' | 'decision_pending' | 'completed' | 'cancelled';
  extensionRequests: ExtensionRequest[];
}

// ============================================
// SHARED SPACE MANAGEMENT TYPES
// ============================================

/**
 * Type of shared space in the building
 */
export type SharedSpaceType =
  | 'atelier_bois'      // Woodworking workshop
  | 'atelier_general'   // General workshop
  | 'salle_commune'     // Common room
  | 'buanderie'         // Laundry room
  | 'jardin_partage'    // Shared garden
  | 'atelier_artiste'   // Artist studio
  | 'cuisine_collective' // Collective kitchen
  | 'autre';            // Other

/**
 * Governance model for shared space usage
 *
 * Three models based on real habitat groupé practices:
 *
 * 1. SOLIDAIRE: Collective ownership model (L'Arbre qui Pousse style)
 *    - Space owned by ACP/collective
 *    - Revenues go to collective reserves
 *    - Operator is paid or rewarded by collective
 *    - All risks shared by collective
 *
 * 2. COMMERCIAL: Commercial rental model
 *    - ACP rents space to resident as commercial tenant
 *    - Full commercial pricing (real costs + margin)
 *    - Separate contract from residential lease
 *    - Operator pays taxes/TVA normally
 *
 * 3. QUOTA: Fair quota system (balanced approach)
 *    - Each resident has yearly quota (30-40 days) for professional use
 *    - Beyond quota → commercial pricing
 *    - Transparent shared calendar
 *    - Simple tracking, minimal admin overhead
 */
export type GovernanceModel = 'solidaire' | 'commercial' | 'quota';

/**
 * Usage type: personal vs professional/commercial
 */
export type UsageType =
  | 'personal'      // Personal use (resident hobby)
  | 'professional'  // Professional/commercial use (generates revenue)
  | 'collective';   // Collective activity (collective revenue)

/**
 * Shared space definition
 */
export interface SharedSpace {
  id: string;
  name: string;
  type: SharedSpaceType;
  description: string;

  // Governance configuration
  governanceModel: GovernanceModel;

  // Physical characteristics
  surface: number;  // m²
  capacity?: number; // Max occupancy

  // Equipment and resources
  equipment?: string[];

  // Operating costs (monthly)
  operatingCosts: {
    electricity: number;
    heating: number;
    maintenance: number;
    insurance: number;
    other: number;
  };

  // Configuration per governance model
  solidaireConfig?: SolidaireConfig;
  commercialConfig?: CommercialConfig;
  quotaConfig?: QuotaConfig;

  // Status
  status: 'proposed' | 'approved' | 'active' | 'suspended' | 'closed';
  createdDate: Date;
  approvalDate?: Date;
}

/**
 * Configuration for Solidaire (collective) model
 */
export interface SolidaireConfig {
  operatorParticipantId: string;  // Who manages the space
  operatorCompensation: {
    type: 'paid' | 'volunteer_valorized' | 'none';
    monthlyAmount?: number;  // If paid
    valorisationPoints?: number;  // If valorized
  };

  // Revenue distribution
  revenueToCollective: number;  // Percentage (0-100)
  revenueToOperator?: number;   // Percentage (0-100)

  // Access rules
  accessRules: {
    residentsAccess: 'free' | 'cost_price' | 'subsidized';
    externalsAllowed: boolean;
    externalsPricing?: 'market_rate' | 'cost_price_plus_margin';
  };

  // Voting rules for major decisions
  votingRules: VotingRules;
}

/**
 * Configuration for Commercial rental model
 */
export interface CommercialConfig {
  tenantParticipantId: string;  // Resident renting the space

  // Rental terms
  rentalContract: {
    monthlyRent: number;
    charges: number;  // Monthly charges
    deposit: number;
    startDate: Date;
    endDate?: Date;
    renewalTerms: string;
  };

  // Cost breakdown (transparency)
  costBreakdown: {
    baseCost: number;           // Proportional building costs
    operatingCosts: number;     // Electricity, heating, etc.
    insurance: number;          // Professional insurance
    margin: number;             // ACP margin
    totalMonthly: number;
  };

  // Legal and tax implications
  taxImplications: {
    tenantMustDeclareRevenue: boolean;
    tenantMustPayTVA: boolean;
    separateInsuranceRequired: boolean;
  };
}

/**
 * Configuration for Quota (fair usage) model
 */
export interface QuotaConfig {
  // Annual quotas
  personalUsageQuota: number;        // Days per year (e.g., 30-40)
  professionalUsageQuota: number;    // Days per year (e.g., 30-40)

  // Pricing
  personalUsageFee: number;          // Per day (often free or cost-price)
  professionalUsageFee: number;      // Per day (often cost-price)
  beyondQuotaFee: number;           // Per day (commercial rate)

  // Booking rules
  maxConsecutiveDays: number;        // Max consecutive booking
  advanceBookingDays: number;        // How far in advance can book
  cancellationPolicy: string;

  // Conflict resolution
  priorityRules: {
    collectiveActivitiesPriority: boolean;
    firstComeFirstServed: boolean;
    rotationSystem: boolean;
  };
}

/**
 * Usage agreement between participant and shared space
 */
export interface UsageAgreement {
  id: string;
  sharedSpaceId: string;
  participantId: string;

  // Usage details
  usageType: UsageType;
  startDate: Date;
  endDate?: Date;  // null for ongoing agreements

  // Financial tracking
  daysUsedThisYear: number;
  quotaUsed: number;          // For quota model
  quotaRemaining: number;     // For quota model
  totalFeesGenerated: number;

  // Revenue distribution (calculated)
  revenueToACP: number;
  revenueToParticipants?: Map<string, number>;  // If redistribution

  // Approval and voting
  requiresApproval: boolean;
  approvalVotes?: Map<string, ParticipantVote>;
  approvalStatus: 'pending' | 'approved' | 'rejected';
  votingResults?: VotingResults;

  // Status
  status: 'proposed' | 'active' | 'suspended' | 'ended' | 'rejected';

  // Transition tracking (for model changes)
  previousModel?: GovernanceModel;
  transitionDate?: Date;
  transitionReason?: string;
}

/**
 * Usage record - individual booking/usage event
 */
export interface UsageRecord {
  id: string;
  agreementId: string;
  participantId: string;
  sharedSpaceId: string;

  // Timing
  startDate: Date;
  endDate: Date;
  durationDays: number;

  // Classification
  usageType: UsageType;
  purpose?: string;  // Description

  // Financial impact
  feeCharged: number;
  quotaConsumed: number;
  beyondQuota: boolean;

  // Tracking
  createdDate: Date;
  confirmedDate?: Date;
}

/**
 * Conflict/alert for shared space usage
 */
export interface SharedSpaceAlert {
  id: string;
  type: 'quota_exceeded' | 'insurance_issue' | 'tax_compliance' | 'conflict_of_interest' | 'over_usage' | 'other';
  severity: 'info' | 'warning' | 'critical';

  sharedSpaceId: string;
  participantId?: string;
  agreementId?: string;

  title: string;
  description: string;

  // Resolution tracking
  status: 'open' | 'acknowledged' | 'resolved' | 'escalated';
  createdDate: Date;
  resolvedDate?: Date;
  resolutionNotes?: string;

  // Required action
  requiresVote: boolean;
  requiresInsuranceUpdate: boolean;
  requiresTaxDeclaration: boolean;
}
