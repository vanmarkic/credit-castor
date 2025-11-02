/**
 * Chronology Calculations Test Suite
 *
 * Tests for event reducers and timeline projection.
 * Uses TDD approach: tests first, then implementation.
 */

import { describe, it, expect } from 'vitest';
import {
  applyEvent,
  createInitialState,
  projectTimeline,
  type ProjectionState
} from './chronologyCalculations';
import type {
  InitialPurchaseEvent,
  NewcomerJoinsEvent,
  ParticipantDetails
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
        notaryFeesRate: 3,
        interestRate: 4.5,
        durationYears: 25,
        parachevementsPerM2: 500
      },
      {
        name: 'Buyer B',
        surface: 134,
        unitId: 2,
        capitalApporte: 170000,
        notaryFeesRate: 12.5,
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
    scenario: {
      constructionCostChange: 0,
      infrastructureReduction: 0,
      purchasePriceReduction: 0
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
      notaryFeesRate: 12.5,
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
    notaryFees: 20625,
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
    expect(participant).toHaveProperty('notaryFeesRate');
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
    expect(newState.copropropriete.lotsOwned).toEqual([5, 6]);
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

  it('should set scenario from event', () => {
    const initialState = createInitialState();
    const event = createTestInitialPurchaseEvent();

    const newState = applyEvent(initialState, event);

    expect(newState.scenario.constructionCostChange).toBe(0);
    expect(newState.scenario.infrastructureReduction).toBe(0);
  });

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
// projectTimeline Tests
// ============================================

describe('projectTimeline', () => {
  const unitDetails = {
    1: { casco: 178080, parachevements: 56000 },
    2: { casco: 213060, parachevements: 67000 }
  };

  it('should return empty array for empty events', () => {
    const phases = projectTimeline([], unitDetails);
    expect(phases).toEqual([]);
  });

  it('should throw error if first event is not INITIAL_PURCHASE', () => {
    const invalidEvents = [createNewcomerJoinsEvent()];

    expect(() => projectTimeline(invalidEvents, unitDetails)).toThrow(
      'Timeline must start with INITIAL_PURCHASE event'
    );
  });

  it('should create phase 0 from INITIAL_PURCHASE event', () => {
    const events = [createTestInitialPurchaseEvent()];

    const phases = projectTimeline(events, unitDetails);

    expect(phases).toHaveLength(1);
    expect(phases[0].phaseNumber).toBe(0);
    expect(phases[0].startDate).toEqual(new Date('2025-01-15T10:00:00Z'));
    expect(phases[0].participants).toHaveLength(2);
  });

  it('should call calculateAll for phase snapshot', () => {
    const events = [createTestInitialPurchaseEvent()];

    const phases = projectTimeline(events, unitDetails);

    // Check that snapshot has the structure from calculateAll
    expect(phases[0].snapshot).toBeDefined();
    expect(phases[0].snapshot).toHaveProperty('totalSurface');
    expect(phases[0].snapshot).toHaveProperty('pricePerM2');
    expect(phases[0].snapshot).toHaveProperty('participantBreakdown');
    expect(phases[0].snapshot).toHaveProperty('totals');
  });

  it('should create phase 1 when NEWCOMER_JOINS', () => {
    const events = [
      createTestInitialPurchaseEvent(),
      createNewcomerJoinsEvent()
    ];

    const phases = projectTimeline(events, unitDetails);

    expect(phases).toHaveLength(2);
    expect(phases[0].phaseNumber).toBe(0);
    expect(phases[1].phaseNumber).toBe(1);
    expect(phases[1].participants).toHaveLength(3); // Added Emma
  });

  it('should calculate phase duration from event dates', () => {
    const events = [
      createTestInitialPurchaseEvent(), // 2025-01-15
      createNewcomerJoinsEvent()         // 2027-01-20
    ];

    const phases = projectTimeline(events, unitDetails);

    // Phase 0 duration: 2025-01-15 to 2027-01-20 = ~24 months
    expect(phases[0].durationMonths).toBeGreaterThan(23);
    expect(phases[0].durationMonths).toBeLessThan(26);
    expect(phases[0].endDate).toEqual(new Date('2027-01-20T14:30:00Z'));
  });

  it('should leave final phase without endDate', () => {
    const events = [
      createTestInitialPurchaseEvent(),
      createNewcomerJoinsEvent()
    ];

    const phases = projectTimeline(events, unitDetails);

    expect(phases[0].endDate).toBeDefined();
    expect(phases[1].endDate).toBeUndefined(); // Final phase ongoing
    expect(phases[1].durationMonths).toBeUndefined();
  });

  it('should store triggering event in phase', () => {
    const events = [
      createTestInitialPurchaseEvent(),
      createNewcomerJoinsEvent()
    ];

    const phases = projectTimeline(events, unitDetails);

    expect(phases[0].triggeringEvent?.type).toBe('INITIAL_PURCHASE');
    expect(phases[1].triggeringEvent?.type).toBe('NEWCOMER_JOINS');
  });

  it('should handle multiple phase transitions', () => {

    // Create third event
    const thirdEvent: NewcomerJoinsEvent = {
      id: 'evt_003',
      type: 'NEWCOMER_JOINS',
      date: new Date('2030-05-10T10:00:00Z'),
      buyer: {
        name: 'Tom',
        surface: 100,
        unitId: 3,
        capitalApporte: 60000,
        notaryFeesRate: 12.5,
        interestRate: 4.5,
        durationYears: 25,
        parachevementsPerM2: 500
      },
      acquisition: {
        from: 'Buyer A',
        lotId: 3,
        purchasePrice: 180000,
        breakdown: {
          basePrice: 150000,
          indexation: 15000,
          carryingCostRecovery: 10000,
          feesRecovery: 5000,
          renovations: 0
        }
      },
      notaryFees: 22500,
      financing: {
        capitalApporte: 60000,
        loanAmount: 142500,
        interestRate: 4.5,
        durationYears: 25
      }
    };

    const events = [
      createTestInitialPurchaseEvent(),
      createNewcomerJoinsEvent(),
      thirdEvent
    ];

    const phases = projectTimeline(events, unitDetails);

    expect(phases).toHaveLength(3);
    expect(phases[0].participants).toHaveLength(2);
    expect(phases[1].participants).toHaveLength(3);
    expect(phases[2].participants).toHaveLength(4);
  });

  it('should maintain transaction history across phases', () => {
    const events = [
      createTestInitialPurchaseEvent(),
      createNewcomerJoinsEvent()
    ];

    const phases = projectTimeline(events, unitDetails);

    // Phase 0: no transactions
    // Phase 1: LOT_SALE + NOTARY_FEES transactions
    expect(phases[1].snapshot.participantBreakdown.find(p => p.name === 'Emma')).toBeDefined();
  });

  it('should recalculate everything for each phase', () => {
    const events = [
      createTestInitialPurchaseEvent(),
      createNewcomerJoinsEvent()
    ];

    const phases = projectTimeline(events, unitDetails);

    // Each phase should have fresh calculations
    expect(phases[0].snapshot.totalSurface).toBe(246); // 112 + 134
    expect(phases[1].snapshot.totalSurface).toBe(380); // 112 + 134 + 134 (Emma)
  });
});
