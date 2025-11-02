/**
 * Timeline & Event Sourcing Types
 *
 * Domain model for chronology feature using event sourcing.
 * Events = immutable facts about what happened
 * Projections = computed views derived from events
 */

import type { Participant, ProjectParams, Scenario, CalculationResults } from '../utils/calculatorUtils';

// ============================================
// Base Event Structure
// ============================================

export interface BaseEvent {
  id: string;
  date: Date;
  metadata?: {
    createdAt: Date;
    createdBy?: string;
    notes?: string;
  };
}

// ============================================
// Participant Details (for event payloads)
// ============================================

export interface ParticipantDetails {
  name: string;
  surface: number;
  unitId: number;
  capitalApporte: number;
  notaryFeesRate: number;
  interestRate: number;
  durationYears: number;
  parachevementsPerM2?: number;
  cascoSqm?: number;
  parachevementsSqm?: number;
}

// ============================================
// Copropriété Setup
// ============================================

export interface CoproEntitySetup {
  name: string;
  hiddenLots?: number[]; // Lots held collectively from start
}

export interface CoproEntity {
  name: string;
  lotsOwned: number[];
  cashReserve: number;
  loans: Loan[];
  monthlyObligations: {
    loanPayments: number;
    insurance: number;
    accountingFees: number;
    maintenanceReserve: number;
  };
}

export interface Loan {
  id: string;
  amount: number;
  purpose: string;
  interestRate: number;
  durationYears: number;
  monthlyPayment: number;
  remainingBalance: number;
  startDate: Date;
}

// ============================================
// Domain Events
// ============================================

export interface InitialPurchaseEvent extends BaseEvent {
  type: 'INITIAL_PURCHASE';
  participants: ParticipantDetails[];
  projectParams: ProjectParams;
  scenario: Scenario;
  copropropriete: CoproEntitySetup;
}

export interface NewcomerJoinsEvent extends BaseEvent {
  type: 'NEWCOMER_JOINS';
  buyer: ParticipantDetails;
  acquisition: {
    from: string; // Participant name who sold
    lotId: number;
    purchasePrice: number;
    breakdown: {
      basePrice: number;
      indexation: number;
      carryingCostRecovery: number;
      feesRecovery: number;
      renovations: number;
    };
  };
  notaryFees: number;
  financing: {
    capitalApporte: number;
    loanAmount: number;
    interestRate: number;
    durationYears: number;
  };
}

export interface HiddenLotRevealedEvent extends BaseEvent {
  type: 'HIDDEN_LOT_REVEALED';
  buyer: ParticipantDetails;
  lotId: number;
  salePrice: number;
  redistribution: {
    [participantName: string]: {
      quotite: number; // Percentage (0-1)
      amount: number;
    };
  };
  notaryFees: number;
}

export interface PortageSettlementEvent extends BaseEvent {
  type: 'PORTAGE_SETTLEMENT';
  seller: string;
  buyer: string;
  lotId: number;
  carryingPeriodMonths: number;
  carryingCosts: {
    monthlyInterest: number;
    monthlyTax: number;
    monthlyInsurance: number;
    totalCarried: number;
  };
  saleProceeds: number;
  netPosition: number;
}

export interface CoproTakesLoanEvent extends BaseEvent {
  type: 'COPRO_TAKES_LOAN';
  loanAmount: number;
  purpose: string;
  interestRate: number;
  durationYears: number;
  monthlyPayment: number;
}

export interface ParticipantExitsEvent extends BaseEvent {
  type: 'PARTICIPANT_EXITS';
  participant: string;
  lotId: number;
  buyerType: 'NEWCOMER' | 'EXISTING_PARTICIPANT' | 'COPRO';
  buyerName?: string;
  salePrice: number;
}

// Union type for all events
export type DomainEvent =
  | InitialPurchaseEvent
  | NewcomerJoinsEvent
  | HiddenLotRevealedEvent
  | PortageSettlementEvent
  | CoproTakesLoanEvent
  | ParticipantExitsEvent;

// ============================================
// Projections (Computed Views)
// ============================================

export interface PhaseProjection {
  phaseNumber: number;
  startDate: Date;
  endDate?: Date;
  durationMonths?: number;

  // Current state at this phase
  participants: Participant[];
  copropropriete: CoproEntity;
  projectParams: ProjectParams;
  scenario: Scenario;

  // Snapshot calculations (reuse existing calculateAll)
  snapshot: CalculationResults;

  // Cash flow perspective
  participantCashFlows: Map<string, ParticipantCashFlow>;
  coproproprieteCashFlow: CoproCashFlow;

  // Metadata
  triggeringEvent?: DomainEvent;
}

export interface Timeline {
  // Source of truth
  events: DomainEvent[];

  // Metadata
  createdAt: Date;
  lastModifiedAt: Date;
  version: number;

  // Computed (lazy, not stored)
  phases?: PhaseProjection[];
}

// ============================================
// Cash Flow Types
// ============================================

export interface ParticipantCashFlow {
  participantName: string;
  phaseNumber: number;

  // Recurring costs during phase
  monthlyRecurring: {
    ownLotExpenses: {
      loanPayment: number;
      propertyTax: number;
      insurance: number;
      commonCharges: number;
    };
    carriedLotExpenses?: {
      loanInterestOnly: number;
      emptyPropertyTax: number;
      insurance: number;
    };
    totalMonthly: number;
  };

  // One-time events at phase boundaries
  phaseTransitionEvents: TransitionEvent[];

  // Summary for this phase
  phaseSummary: {
    durationMonths: number;
    totalRecurring: number;
    transitionNet: number;
    phaseNetCashImpact: number;
  };

  // Cumulative since T0
  cumulativePosition: {
    totalInvested: number;
    totalReceived: number;
    netPosition: number;
  };
}

export interface TransitionEvent {
  type: 'SALE' | 'PURCHASE' | 'REDISTRIBUTION_RECEIVED';
  amount: number;
  date: Date;
  description: string;
  breakdown?: Record<string, number>;
}

export interface CoproCashFlow {
  monthlyRecurring: {
    loanPayments: number;
    commonAreaMaintenance: number;
    insurance: number;
    accountingFees: number;
    totalMonthly: number;
  };

  phaseSummary: {
    durationMonths: number;
    totalRecurring: number;
    transitionNet: number;
    phaseNetCashImpact: number;
  };

  balanceSheet: {
    cashReserve: number;
    lotsOwnedValue: number;
    outstandingLoans: number;
    netWorth: number;
  };
}

// ============================================
// Transaction History (for cash flow tracking)
// ============================================

export interface Transaction {
  type: 'LOT_SALE' | 'NOTARY_FEES' | 'REDISTRIBUTION';
  from: string;
  to: string;
  amount: number;
  date: Date;
  breakdown?: Record<string, number>;
  metadata?: Record<string, unknown>;
}

// ============================================
// Projection State (internal, for reducers)
// ============================================

export interface ProjectionState {
  currentDate: Date;
  participants: Participant[];
  copropropriete: CoproEntity;
  projectParams: ProjectParams;
  scenario: Scenario;
  transactionHistory: Transaction[];
}
