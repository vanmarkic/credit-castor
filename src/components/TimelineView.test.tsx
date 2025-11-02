import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import TimelineView from './TimelineView';
import { projectTimeline } from '../utils/chronologyCalculations';
import type { InitialPurchaseEvent, NewcomerJoinsEvent } from '../types/timeline';

describe('TimelineView', () => {
  const createTestInitialPurchaseEvent = (): InitialPurchaseEvent => ({
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
      hiddenLots: [5, 6]
    }
  });

  const createNewcomerJoinsEvent = (): NewcomerJoinsEvent => ({
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
  });

  const unitDetails = {
    1: { casco: 178080, parachevements: 56000 },
    2: { casco: 213060, parachevements: 67000 }
  };

  it('should render empty state when no phases', () => {
    render(<TimelineView phases={[]} />);
    expect(screen.getByText(/No timeline events yet/i)).toBeInTheDocument();
  });

  it('should render timeline header with phase count', () => {
    const events = [createTestInitialPurchaseEvent()];
    const phases = projectTimeline(events, unitDetails);

    render(<TimelineView phases={phases} />);
    expect(screen.getByText('Project Timeline')).toBeInTheDocument();
    expect(screen.getByText('1 phase tracked')).toBeInTheDocument();
  });

  it('should render phase 0 with initial purchase', () => {
    const events = [createTestInitialPurchaseEvent()];
    const phases = projectTimeline(events, unitDetails);

    render(<TimelineView phases={phases} />);
    expect(screen.getByText('Phase 0 - Initial Purchase')).toBeInTheDocument();
  });

  it('should display participant count for each phase', () => {
    const events = [createTestInitialPurchaseEvent()];
    const phases = projectTimeline(events, unitDetails);

    render(<TimelineView phases={phases} />);
    // Should show 2 participants in phase 0
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('should render multiple phases', () => {
    const events = [createTestInitialPurchaseEvent(), createNewcomerJoinsEvent()];
    const phases = projectTimeline(events, unitDetails);

    render(<TimelineView phases={phases} />);
    expect(screen.getByText('2 phases tracked')).toBeInTheDocument();
    expect(screen.getByText('Phase 0 - Initial Purchase')).toBeInTheDocument();
  });

  it('should show current phase indicator for last phase without endDate', () => {
    const events = [createTestInitialPurchaseEvent()];
    const phases = projectTimeline(events, unitDetails);

    render(<TimelineView phases={phases} />);
    expect(screen.getByText(/Current Phase \(ongoing\)/i)).toBeInTheDocument();
  });

  it('should display duration for completed phases', () => {
    const events = [createTestInitialPurchaseEvent(), createNewcomerJoinsEvent()];
    const phases = projectTimeline(events, unitDetails);

    render(<TimelineView phases={phases} />);
    // First phase should have duration
    expect(screen.getByText(/\d+ months?/)).toBeInTheDocument();
  });

  it('should show financial snapshot data', () => {
    const events = [createTestInitialPurchaseEvent()];
    const phases = projectTimeline(events, unitDetails);

    render(<TimelineView phases={phases} />);
    expect(screen.getByText('Total Surface')).toBeInTheDocument();
    expect(screen.getByText('Price per m²')).toBeInTheDocument();
    expect(screen.getByText('Total Cost')).toBeInTheDocument();
  });
});
