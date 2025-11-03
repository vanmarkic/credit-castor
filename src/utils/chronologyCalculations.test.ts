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
  projectTimeline
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

// ============================================
// Cash Flow Calculations Tests
// ============================================

describe('Participant Cash Flows', () => {
  const unitDetails = {
    1: { casco: 178080, parachevements: 56000 },
    2: { casco: 213060, parachevements: 67000 }
  };

  it('should calculate monthly recurring costs for own lot', () => {
    const events = [createTestInitialPurchaseEvent()];
    const phases = projectTimeline(events, unitDetails);

    const phase0 = phases[0];
    const buyerACashFlow = phase0.participantCashFlows.get('Buyer A');

    expect(buyerACashFlow).toBeDefined();
    expect(buyerACashFlow!.monthlyRecurring.ownLotExpenses.loanPayment).toBeGreaterThan(0);
    expect(buyerACashFlow!.monthlyRecurring.ownLotExpenses.propertyTax).toBeCloseTo(388.38 / 12, 2);
    expect(buyerACashFlow!.monthlyRecurring.ownLotExpenses.insurance).toBeCloseTo(2000 / 12 / 2, 2); // Split between 2 participants
  });

  it('should calculate carried lot expenses when participant carries multiple lots', () => {
    // Create event where Buyer B carries 2 lots
    const initialEvent = createTestInitialPurchaseEvent();
    initialEvent.participants[1].surface = 268; // Double surface

    const initialState = createInitialState();
    let state = applyEvent(initialState, initialEvent);

    // Manually set Buyer B to have 2 lots
    state = {
      ...state,
      participants: state.participants.map(p =>
        p.name === 'Buyer B' ? { ...p, quantity: 2 } : p
      )
    };

    // Create a phase from this state
    const events = [initialEvent];
    const phases = projectTimeline(events, unitDetails);

    // Manually modify phase to have Buyer B with 2 lots (simulating portage scenario)
    const phase = phases[0];
    phase.participants = phase.participants.map(p =>
      p.name === 'Buyer B' ? { ...p, quantity: 2 } : p
    );

    // Re-calculate cash flows for this modified phase
    const buyerBCashFlow = phase.participantCashFlows.get('Buyer B');

    if (buyerBCashFlow?.monthlyRecurring.carriedLotExpenses) {
      expect(buyerBCashFlow.monthlyRecurring.carriedLotExpenses.loanInterestOnly).toBeGreaterThan(0);
      expect(buyerBCashFlow.monthlyRecurring.carriedLotExpenses.emptyPropertyTax).toBeCloseTo(388.38 / 12, 2);
      expect(buyerBCashFlow.monthlyRecurring.carriedLotExpenses.insurance).toBeCloseTo(2000 / 12, 2);
    }
  });

  it('should calculate phase transition events for lot sale', () => {
    const events = [
      createTestInitialPurchaseEvent(),
      createNewcomerJoinsEvent()
    ];
    const phases = projectTimeline(events, unitDetails);

    // Phase 1: Buyer B sold to Emma
    const buyerBCashFlow = phases[1].participantCashFlows.get('Buyer B');
    expect(buyerBCashFlow).toBeDefined();

    const saleEvent = buyerBCashFlow!.phaseTransitionEvents.find(e => e.type === 'SALE');
    expect(saleEvent).toBeDefined();
    expect(saleEvent!.amount).toBe(165000);
    expect(saleEvent!.breakdown).toEqual({
      basePrice: 143000,
      indexation: 5720,
      carryingCostRecovery: 10800,
      feesRecovery: 5480,
      renovations: 0
    });
  });

  it('should calculate phase transition events for lot purchase', () => {
    const events = [
      createTestInitialPurchaseEvent(),
      createNewcomerJoinsEvent()
    ];
    const phases = projectTimeline(events, unitDetails);

    // Phase 1: Emma purchased from Buyer B
    const emmaCashFlow = phases[1].participantCashFlows.get('Emma');
    expect(emmaCashFlow).toBeDefined();

    const purchaseEvent = emmaCashFlow!.phaseTransitionEvents.find(e => e.type === 'PURCHASE');
    expect(purchaseEvent).toBeDefined();
    expect(purchaseEvent!.amount).toBe(-(165000 + 20625)); // Purchase price + notary fees
  });

  it('should calculate phase summary correctly', () => {
    const events = [
      createTestInitialPurchaseEvent(),
      createNewcomerJoinsEvent()
    ];
    const phases = projectTimeline(events, unitDetails);

    const phase0 = phases[0];
    const buyerACashFlow = phase0.participantCashFlows.get('Buyer A');

    expect(buyerACashFlow).toBeDefined();
    expect(buyerACashFlow!.phaseSummary.durationMonths).toBeGreaterThan(0);
    expect(buyerACashFlow!.phaseSummary.totalRecurring).toBe(
      buyerACashFlow!.monthlyRecurring.totalMonthly * buyerACashFlow!.phaseSummary.durationMonths
    );
  });

  it('should calculate cumulative position across phases', () => {
    const events = [
      createTestInitialPurchaseEvent(),
      createNewcomerJoinsEvent()
    ];
    const phases = projectTimeline(events, unitDetails);

    // Phase 0: Buyer B has initial investment
    const phase0BuyerB = phases[0].participantCashFlows.get('Buyer B');
    expect(phase0BuyerB!.cumulativePosition.totalInvested).toBeGreaterThan(0);
    expect(phase0BuyerB!.cumulativePosition.totalReceived).toBe(0);

    // Phase 1: Buyer B sold lot, should have received money
    const phase1BuyerB = phases[1].participantCashFlows.get('Buyer B');
    expect(phase1BuyerB!.cumulativePosition.totalReceived).toBe(165000);
    expect(phase1BuyerB!.cumulativePosition.netPosition).toBeLessThan(0); // Still net negative after selling
  });
});

describe('Copropriété Cash Flows', () => {
  const unitDetails = {
    1: { casco: 178080, parachevements: 56000 },
    2: { casco: 213060, parachevements: 67000 }
  };

  it('should calculate monthly recurring costs', () => {
    const events = [createTestInitialPurchaseEvent()];
    const phases = projectTimeline(events, unitDetails);

    const coproCashFlow = phases[0].coproproprieteCashFlow;

    expect(coproCashFlow.monthlyRecurring.insurance).toBeCloseTo(2000 / 12, 2);
    expect(coproCashFlow.monthlyRecurring.accountingFees).toBeCloseTo(1000 / 12, 2);
    expect(coproCashFlow.monthlyRecurring.totalMonthly).toBeGreaterThan(0);
  });

  it('should calculate balance sheet with lots owned value', () => {
    const events = [createTestInitialPurchaseEvent()];
    const phases = projectTimeline(events, unitDetails);

    const coproCashFlow = phases[0].coproproprieteCashFlow;

    // Copro owns lots 5 and 6
    expect(coproCashFlow.balanceSheet.lotsOwnedValue).toBeGreaterThan(0);
    expect(coproCashFlow.balanceSheet.cashReserve).toBe(0);
    expect(coproCashFlow.balanceSheet.outstandingLoans).toBe(0);
  });

  it('should update balance sheet after hidden lot sale', () => {
    const hiddenLotEvent = {
      id: 'evt_hidden_001',
      type: 'HIDDEN_LOT_REVEALED' as const,
      date: new Date('2026-06-15T10:00:00Z'),
      buyer: {
        name: 'Sarah',
        surface: 100,
        unitId: 5,
        capitalApporte: 80000,
        notaryFeesRate: 12.5,
        interestRate: 4.5,
        durationYears: 25,
        parachevementsPerM2: 500
      },
      lotId: 5,
      salePrice: 200000,
      redistribution: {
        'Buyer A': {
          quotite: 0.455,
          amount: 91000
        },
        'Buyer B': {
          quotite: 0.545,
          amount: 109000
        }
      },
      notaryFees: 25000
    };

    const events = [
      createTestInitialPurchaseEvent(),
      hiddenLotEvent
    ];
    const phases = projectTimeline(events, unitDetails);

    // Phase 1: After hidden lot sale
    const coproCashFlow = phases[1].coproproprieteCashFlow;

    // Copro should have reduced lots and updated cash
    expect(coproCashFlow.balanceSheet.lotsOwnedValue).toBeLessThan(
      phases[0].coproproprieteCashFlow.balanceSheet.lotsOwnedValue
    );
    expect(coproCashFlow.balanceSheet.cashReserve).toBe(0); // All redistributed
  });

  it('should calculate phase summary correctly', () => {
    const events = [
      createTestInitialPurchaseEvent(),
      createNewcomerJoinsEvent()
    ];
    const phases = projectTimeline(events, unitDetails);

    const phase0 = phases[0];
    const coproCashFlow = phase0.coproproprieteCashFlow;

    expect(coproCashFlow.phaseSummary.durationMonths).toBeGreaterThan(0);
    expect(coproCashFlow.phaseSummary.totalRecurring).toBe(
      coproCashFlow.monthlyRecurring.totalMonthly * coproCashFlow.phaseSummary.durationMonths
    );
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
