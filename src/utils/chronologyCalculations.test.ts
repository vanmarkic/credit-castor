/**
 * Chronology Calculations Test Suite
 *
 * Tests for event reducers and timeline projection.
 * Uses TDD approach: tests first, then implementation.
 */

import { describe, it, expect } from 'vitest';
import {
  applyEvent,
  createInitialState
} from './chronologyCalculations';
import type {
  InitialPurchaseEvent,
  NewcomerJoinsEvent,
  PortageSettlementEvent,
  CoproTakesLoanEvent,
  ParticipantExitsEvent
} from '../types/timeline';

// ============================================
// Test Helpers
// ============================================

function createTestInitialPurchaseEvent(): InitialPurchaseEvent {
  return {
    id: 'evt_001',
    type: 'INITIAL_PURCHASE',
    date: new Date('2025-01-15T10:00:00Z'),
    participants: [
      {
        name: 'Buyer A',
        surface: 112,
        unitId: 1,
        capitalApporte: 50000,
        registrationFeesRate: 3,
        interestRate: 4.5,
        durationYears: 25,
        parachevementsPerM2: 500
      },
      {
        name: 'Buyer B',
        surface: 134,
        unitId: 2,
        capitalApporte: 170000,
        registrationFeesRate: 12.5,
        interestRate: 4.5,
        durationYears: 25,
        parachevementsPerM2: 500
      }
    ],
    projectParams: {
      totalPurchase: 650000,
      mesuresConservatoires: 20000,
      demolition: 40000,
      infrastructures: 90000,
      etudesPreparatoires: 59820,
      fraisEtudesPreparatoires: 27320,
      fraisGeneraux3ans: 0,
      batimentFondationConservatoire: 43700,
      batimentFondationComplete: 269200,
      batimentCoproConservatoire: 56000,
      globalCascoPerM2: 1590
    },
    copropropriete: {
      name: 'Copropriété Ferme du Temple',
      hiddenLots: [5, 6] // Two lots held collectively
    }
  };
}

function createNewcomerJoinsEvent(): NewcomerJoinsEvent {
  return {
    id: 'evt_002',
    type: 'NEWCOMER_JOINS',
    date: new Date('2027-01-20T14:30:00Z'),
    buyer: {
      name: 'Emma',
      surface: 134,
      unitId: 2,
      capitalApporte: 40000,
      registrationFeesRate: 12.5,
      interestRate: 4.5,
      durationYears: 25,
      parachevementsPerM2: 500
    },
    acquisition: {
      from: 'Buyer B',
      lotId: 2,
      purchasePrice: 165000,
      breakdown: {
        basePrice: 143000,
        indexation: 5720,
        carryingCostRecovery: 10800,
        feesRecovery: 5480,
        renovations: 0
      }
    },
    droitEnregistrements: 20625,
    financing: {
      capitalApporte: 40000,
      loanAmount: 145625,
      interestRate: 4.5,
      durationYears: 25
    }
  };
}

// ============================================
// applyEvent Tests
// ============================================

describe('applyEvent', () => {
  it('should route INITIAL_PURCHASE to correct handler', () => {
    const initialState = createInitialState();
    const event = createTestInitialPurchaseEvent();

    const newState = applyEvent(initialState, event);

    expect(newState.participants).toHaveLength(2);
    expect(newState.currentDate).toEqual(event.date);
  });

  it('should be a pure function (no mutations)', () => {
    const initialState = createInitialState();
    const event = createTestInitialPurchaseEvent();

    const stateBefore = JSON.stringify(initialState);
    applyEvent(initialState, event);
    const stateAfter = JSON.stringify(initialState);

    expect(stateBefore).toBe(stateAfter);
  });
});

// ============================================
// applyInitialPurchase Tests
// ============================================

describe('applyInitialPurchase', () => {
  it('should initialize participants from event', () => {
    const initialState = createInitialState();
    const event = createTestInitialPurchaseEvent();

    const newState = applyEvent(initialState, event);

    expect(newState.participants).toHaveLength(2);
    expect(newState.participants[0].name).toBe('Buyer A');
    expect(newState.participants[0].surface).toBe(112);
    expect(newState.participants[0].capitalApporte).toBe(50000);
  });

  it('should convert ParticipantDetails to Participant type', () => {
    const initialState = createInitialState();
    const event = createTestInitialPurchaseEvent();

    const newState = applyEvent(initialState, event);

    // Check that Participant has required fields
    const participant = newState.participants[0];
    expect(participant).toHaveProperty('name');
    expect(participant).toHaveProperty('surface');
    expect(participant).toHaveProperty('unitId');
    expect(participant).toHaveProperty('capitalApporte');
    expect(participant).toHaveProperty('registrationFeesRate');
    expect(participant).toHaveProperty('interestRate');
    expect(participant).toHaveProperty('durationYears');
    expect(participant).toHaveProperty('quantity');
  });

  it('should set quantity to 1 for each participant', () => {
    const initialState = createInitialState();
    const event = createTestInitialPurchaseEvent();

    const newState = applyEvent(initialState, event);

    newState.participants.forEach(p => {
      expect(p.quantity).toBe(1);
    });
  });

  it('should initialize copropriété with hidden lots', () => {
    const initialState = createInitialState();
    const event = createTestInitialPurchaseEvent();

    const newState = applyEvent(initialState, event);

    expect(newState.copropropriete.name).toBe('Copropriété Ferme du Temple');
    expect(newState.copropropriete.lotsOwned).toHaveLength(2);
    expect(newState.copropropriete.lotsOwned[0].lotId).toBe(5);
    expect(newState.copropropriete.lotsOwned[1].lotId).toBe(6);
    expect(newState.copropropriete.cashReserve).toBe(0);
    expect(newState.copropropriete.loans).toEqual([]);
  });

  it('should set project params from event', () => {
    const initialState = createInitialState();
    const event = createTestInitialPurchaseEvent();

    const newState = applyEvent(initialState, event);

    expect(newState.projectParams.totalPurchase).toBe(650000);
    expect(newState.projectParams.globalCascoPerM2).toBe(1590);
  });

  // Scenario tests removed - scenarios no longer exist

  it('should initialize with empty transaction history', () => {
    const initialState = createInitialState();
    const event = createTestInitialPurchaseEvent();

    const newState = applyEvent(initialState, event);

    expect(newState.transactionHistory).toEqual([]);
  });

  it('should set currentDate from event', () => {
    const initialState = createInitialState();
    const event = createTestInitialPurchaseEvent();

    const newState = applyEvent(initialState, event);

    expect(newState.currentDate).toEqual(new Date('2025-01-15T10:00:00Z'));
  });
});

// ============================================
// applyNewcomerJoins Tests
// ============================================

describe('applyNewcomerJoins', () => {
  it('should add newcomer as full participant', () => {
    // Start with state after initial purchase
    const initialState = createInitialState();
    const initialEvent = createTestInitialPurchaseEvent();
    const stateAfterInit = applyEvent(initialState, initialEvent);

    // Apply newcomer joins
    const newcomerEvent = createNewcomerJoinsEvent();
    const finalState = applyEvent(stateAfterInit, newcomerEvent);

    expect(finalState.participants).toHaveLength(3); // Was 2, now 3
    const emma = finalState.participants.find(p => p.name === 'Emma');
    expect(emma).toBeDefined();
    expect(emma!.surface).toBe(134);
    expect(emma!.quantity).toBe(1);
  });

  it('should reduce seller lot count (if quantity > 1)', () => {
    // Create modified initial event where Buyer B has 2 lots
    const initialEvent = createTestInitialPurchaseEvent();
    initialEvent.participants[1].surface = 268; // Double surface for 2 lots

    const initialState = createInitialState();
    let state = applyEvent(initialState, initialEvent);

    // Manually set Buyer B to have 2 lots (simulating carrying)
    state = {
      ...state,
      participants: state.participants.map(p =>
        p.name === 'Buyer B' ? { ...p, quantity: 2 } : p
      )
    };

    // Apply newcomer joins
    const newcomerEvent = createNewcomerJoinsEvent();
    const finalState = applyEvent(state, newcomerEvent);

    const buyerB = finalState.participants.find(p => p.name === 'Buyer B');
    expect(buyerB!.quantity).toBe(1); // Reduced from 2 to 1
  });

  it('should NOT reduce seller lot count if quantity is 1', () => {
    // Buyer B starts with quantity 1
    const initialState = createInitialState();
    const initialEvent = createTestInitialPurchaseEvent();
    const stateAfterInit = applyEvent(initialState, initialEvent);

    const buyerBBefore = stateAfterInit.participants.find(p => p.name === 'Buyer B');
    expect(buyerBBefore!.quantity).toBe(1);

    // Apply newcomer joins
    const newcomerEvent = createNewcomerJoinsEvent();
    const finalState = applyEvent(stateAfterInit, newcomerEvent);

    // Buyer B should still be there with quantity 1
    const buyerBAfter = finalState.participants.find(p => p.name === 'Buyer B');
    expect(buyerBAfter!.quantity).toBe(1);
  });

  it('should record LOT_SALE transaction', () => {
    const initialState = createInitialState();
    const initialEvent = createTestInitialPurchaseEvent();
    const stateAfterInit = applyEvent(initialState, initialEvent);

    const newcomerEvent = createNewcomerJoinsEvent();
    const finalState = applyEvent(stateAfterInit, newcomerEvent);

    const lotSaleTx = finalState.transactionHistory.find(
      tx => tx.type === 'LOT_SALE' && tx.from === 'Buyer B' && tx.to === 'Emma'
    );

    expect(lotSaleTx).toBeDefined();
    expect(lotSaleTx!.amount).toBe(165000);
    expect(lotSaleTx!.breakdown).toEqual({
      basePrice: 143000,
      indexation: 5720,
      carryingCostRecovery: 10800,
      feesRecovery: 5480,
      renovations: 0
    });
  });

  it('should record NOTARY_FEES transaction', () => {
    const initialState = createInitialState();
    const initialEvent = createTestInitialPurchaseEvent();
    const stateAfterInit = applyEvent(initialState, initialEvent);

    const newcomerEvent = createNewcomerJoinsEvent();
    const finalState = applyEvent(stateAfterInit, newcomerEvent);

    const notaryTx = finalState.transactionHistory.find(
      tx => tx.type === 'NOTARY_FEES' && tx.from === 'Emma'
    );

    expect(notaryTx).toBeDefined();
    expect(notaryTx!.amount).toBe(20625);
    expect(notaryTx!.to).toBe('NOTARY');
  });

  it('should update currentDate from event', () => {
    const initialState = createInitialState();
    const initialEvent = createTestInitialPurchaseEvent();
    const stateAfterInit = applyEvent(initialState, initialEvent);

    const newcomerEvent = createNewcomerJoinsEvent();
    const finalState = applyEvent(stateAfterInit, newcomerEvent);

    expect(finalState.currentDate).toEqual(new Date('2027-01-20T14:30:00Z'));
  });
});


// ============================================
// applyPortageSettlement Tests
// ============================================

describe('applyPortageSettlement', () => {
  function createPortageSettlementEvent(): PortageSettlementEvent {
    return {
      id: 'evt_portage_001',
      type: 'PORTAGE_SETTLEMENT',
      date: new Date('2027-06-15T10:00:00Z'),
      seller: 'Buyer B',
      buyer: 'Buyer A',
      lotId: 3,
      carryingPeriodMonths: 24,
      carryingCosts: {
        monthlyInterest: 348.75,
        monthlyTax: 32.37,
        monthlyInsurance: 166.67,
        totalCarried: 13147
      },
      saleProceeds: 172649,
      netPosition: 159502 // saleProceeds - totalCarried
    };
  }

  it('should reduce seller lot count if quantity > 1', () => {
    // Setup: Buyer B has 2 lots (carrying one for portage)
    const initialState = createInitialState();
    const initialEvent = createTestInitialPurchaseEvent();
    let state = applyEvent(initialState, initialEvent);

    // Manually set Buyer B to have 2 lots
    state = {
      ...state,
      participants: state.participants.map(p =>
        p.name === 'Buyer B' ? { ...p, quantity: 2 } : p
      )
    };

    // Apply portage settlement
    const portageEvent = createPortageSettlementEvent();
    const finalState = applyEvent(state, portageEvent);

    const buyerB = finalState.participants.find(p => p.name === 'Buyer B');
    expect(buyerB!.quantity).toBe(1); // Reduced from 2 to 1
  });

  it('should record LOT_SALE transaction', () => {
    const initialState = createInitialState();
    const initialEvent = createTestInitialPurchaseEvent();
    let state = applyEvent(initialState, initialEvent);

    state = {
      ...state,
      participants: state.participants.map(p =>
        p.name === 'Buyer B' ? { ...p, quantity: 2 } : p
      )
    };

    const portageEvent = createPortageSettlementEvent();
    const finalState = applyEvent(state, portageEvent);

    const lotSaleTx = finalState.transactionHistory.find(
      tx => tx.type === 'LOT_SALE' && tx.from === 'Buyer B' && tx.to === 'Buyer A'
    );

    expect(lotSaleTx).toBeDefined();
    expect(lotSaleTx!.amount).toBe(172649);
    expect(lotSaleTx!.date).toEqual(new Date('2027-06-15T10:00:00Z'));
  });

  it('should include carrying costs in transaction metadata', () => {
    const initialState = createInitialState();
    const initialEvent = createTestInitialPurchaseEvent();
    let state = applyEvent(initialState, initialEvent);

    state = {
      ...state,
      participants: state.participants.map(p =>
        p.name === 'Buyer B' ? { ...p, quantity: 2 } : p
      )
    };

    const portageEvent = createPortageSettlementEvent();
    const finalState = applyEvent(state, portageEvent);

    const lotSaleTx = finalState.transactionHistory.find(
      tx => tx.type === 'LOT_SALE' && tx.from === 'Buyer B'
    );

    expect(lotSaleTx!.metadata).toBeDefined();
    expect(lotSaleTx!.metadata!.carryingCosts).toBe(13147);
    expect(lotSaleTx!.metadata!.carryingPeriodMonths).toBe(24);
    expect(lotSaleTx!.metadata!.netPosition).toBe(159502);
  });

  it('should update current date', () => {
    const initialState = createInitialState();
    const initialEvent = createTestInitialPurchaseEvent();
    let state = applyEvent(initialState, initialEvent);

    state = {
      ...state,
      participants: state.participants.map(p =>
        p.name === 'Buyer B' ? { ...p, quantity: 2 } : p
      )
    };

    const portageEvent = createPortageSettlementEvent();
    const finalState = applyEvent(state, portageEvent);

    expect(finalState.currentDate).toEqual(new Date('2027-06-15T10:00:00Z'));
  });
});

// ============================================
// applyCoproTakesLoan Tests
// ============================================

describe('applyCoproTakesLoan', () => {
  function createCoproTakesLoanEvent(): CoproTakesLoanEvent {
    return {
      id: 'evt_loan_001',
      type: 'COPRO_TAKES_LOAN',
      date: new Date('2026-03-01T10:00:00Z'),
      loanAmount: 50000,
      purpose: 'Emergency roof repairs',
      interestRate: 3.5,
      durationYears: 10,
      monthlyPayment: 493.31
    };
  }

  it('should add loan to copropriete loans array', () => {
    const initialState = createInitialState();
    const initialEvent = createTestInitialPurchaseEvent();
    const state = applyEvent(initialState, initialEvent);

    const loanEvent = createCoproTakesLoanEvent();
    const finalState = applyEvent(state, loanEvent);

    expect(finalState.copropropriete.loans).toHaveLength(1);
    const loan = finalState.copropropriete.loans[0];
    expect(loan.amount).toBe(50000);
    expect(loan.purpose).toBe('Emergency roof repairs');
    expect(loan.interestRate).toBe(3.5);
    expect(loan.durationYears).toBe(10);
    expect(loan.monthlyPayment).toBe(493.31);
    expect(loan.remainingBalance).toBe(50000);
  });

  it('should update copro monthly loan payments', () => {
    const initialState = createInitialState();
    const initialEvent = createTestInitialPurchaseEvent();
    const state = applyEvent(initialState, initialEvent);

    const loanEvent = createCoproTakesLoanEvent();
    const finalState = applyEvent(state, loanEvent);

    expect(finalState.copropropriete.monthlyObligations.loanPayments).toBe(493.31);
  });

  it('should accumulate monthly payments for multiple loans', () => {
    const initialState = createInitialState();
    const initialEvent = createTestInitialPurchaseEvent();
    let state = applyEvent(initialState, initialEvent);

    // First loan
    const loan1 = createCoproTakesLoanEvent();
    state = applyEvent(state, loan1);

    // Second loan
    const loan2: CoproTakesLoanEvent = {
      id: 'evt_loan_002',
      type: 'COPRO_TAKES_LOAN',
      date: new Date('2027-01-01T10:00:00Z'),
      loanAmount: 30000,
      purpose: 'Facade renovation',
      interestRate: 4.0,
      durationYears: 8,
      monthlyPayment: 363.78
    };
    state = applyEvent(state, loan2);

    expect(state.copropropriete.loans).toHaveLength(2);
    expect(state.copropropriete.monthlyObligations.loanPayments).toBe(493.31 + 363.78);
  });

  it('should update current date', () => {
    const initialState = createInitialState();
    const initialEvent = createTestInitialPurchaseEvent();
    const state = applyEvent(initialState, initialEvent);

    const loanEvent = createCoproTakesLoanEvent();
    const finalState = applyEvent(state, loanEvent);

    expect(finalState.currentDate).toEqual(new Date('2026-03-01T10:00:00Z'));
  });
});

// ============================================
// applyParticipantExits Tests
// ============================================

describe('applyParticipantExits', () => {
  function createParticipantExitsEvent(buyerType: 'NEWCOMER' | 'EXISTING_PARTICIPANT' | 'COPRO' = 'COPRO'): ParticipantExitsEvent {
    return {
      id: 'evt_exit_001',
      type: 'PARTICIPANT_EXITS',
      date: new Date('2028-01-15T10:00:00Z'),
      participant: 'Buyer A',
      lotId: 1,
      buyerType,
      buyerName: buyerType === 'NEWCOMER' ? 'New Buyer' : buyerType === 'EXISTING_PARTICIPANT' ? 'Buyer B' : undefined,
      salePrice: 200000
    };
  }

  it('should remove participant if they have only 1 lot', () => {
    const initialState = createInitialState();
    const initialEvent = createTestInitialPurchaseEvent();
    const state = applyEvent(initialState, initialEvent);

    const exitEvent = createParticipantExitsEvent('COPRO');
    const finalState = applyEvent(state, exitEvent);

    // Buyer A should be removed
    const buyerA = finalState.participants.find(p => p.name === 'Buyer A');
    expect(buyerA).toBeUndefined();
    expect(finalState.participants).toHaveLength(1); // Only Buyer B remains
  });

  it('should reduce participant lot count if they have multiple lots', () => {
    const initialState = createInitialState();
    const initialEvent = createTestInitialPurchaseEvent();
    let state = applyEvent(initialState, initialEvent);

    // Manually set Buyer A to have 2 lots
    state = {
      ...state,
      participants: state.participants.map(p =>
        p.name === 'Buyer A' ? { ...p, quantity: 2 } : p
      )
    };

    const exitEvent = createParticipantExitsEvent('COPRO');
    const finalState = applyEvent(state, exitEvent);

    const buyerA = finalState.participants.find(p => p.name === 'Buyer A');
    expect(buyerA!.quantity).toBe(1); // Reduced from 2 to 1
  });

  it('should add lot to copro when buyerType is COPRO', () => {
    const initialState = createInitialState();
    const initialEvent = createTestInitialPurchaseEvent();
    const state = applyEvent(initialState, initialEvent);

    const exitEvent = createParticipantExitsEvent('COPRO');
    const finalState = applyEvent(state, exitEvent);

    expect(finalState.copropropriete.lotsOwned.some(lot => lot.lotId === 1)).toBe(true);
  });

  it('should increase existing participant lot count when buyerType is EXISTING_PARTICIPANT', () => {
    const initialState = createInitialState();
    const initialEvent = createTestInitialPurchaseEvent();
    const state = applyEvent(initialState, initialEvent);

    const exitEvent = createParticipantExitsEvent('EXISTING_PARTICIPANT');
    const finalState = applyEvent(state, exitEvent);

    const buyerB = finalState.participants.find(p => p.name === 'Buyer B');
    expect(buyerB!.quantity).toBe(2); // Increased from 1 to 2
  });

  it('should record LOT_SALE transaction', () => {
    const initialState = createInitialState();
    const initialEvent = createTestInitialPurchaseEvent();
    const state = applyEvent(initialState, initialEvent);

    const exitEvent = createParticipantExitsEvent('COPRO');
    const finalState = applyEvent(state, exitEvent);

    const lotSaleTx = finalState.transactionHistory.find(
      tx => tx.type === 'LOT_SALE' && tx.from === 'Buyer A'
    );

    expect(lotSaleTx).toBeDefined();
    expect(lotSaleTx!.amount).toBe(200000);
    expect(lotSaleTx!.to).toBe('COPRO');
  });

  it('should update current date', () => {
    const initialState = createInitialState();
    const initialEvent = createTestInitialPurchaseEvent();
    const state = applyEvent(initialState, initialEvent);

    const exitEvent = createParticipantExitsEvent('COPRO');
    const finalState = applyEvent(state, exitEvent);

    expect(finalState.currentDate).toEqual(new Date('2028-01-15T10:00:00Z'));
  });
});
