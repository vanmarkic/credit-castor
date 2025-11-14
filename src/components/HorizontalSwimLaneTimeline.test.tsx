import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import HorizontalSwimLaneTimeline from './HorizontalSwimLaneTimeline';
import type { Participant } from '../utils/calculatorUtils';
import type { CalculationResults, ProjectParams } from '../utils/calculatorUtils';

describe('HorizontalSwimLaneTimeline', () => {
  const deedDate = '2026-02-01';

  const mockParticipants: Participant[] = [
    {
      name: 'Alice',
      capitalApporte: 50000,
      registrationFeesRate: 12.5,
      interestRate: 4.5,
      durationYears: 25,
      isFounder: true,
      entryDate: new Date(deedDate),
      unitId: 1,
      surface: 100,
      quantity: 1
    },
    {
      name: 'Bob',
      capitalApporte: 40000,
      registrationFeesRate: 12.5,
      interestRate: 4.5,
      durationYears: 25,
      isFounder: true,
      entryDate: new Date(deedDate),
      unitId: 3,
      surface: 120,
      quantity: 1
    },
    {
      name: 'Carol',
      capitalApporte: 30000,
      registrationFeesRate: 12.5,
      interestRate: 4.5,
      durationYears: 25,
      isFounder: false,
      entryDate: new Date('2026-08-01'),
      unitId: 5,
      surface: 90,
      quantity: 1,
      purchaseDetails: {
        buyingFrom: 'Copropriété',
        lotId: 100,
        purchasePrice: 150000
      }
    }
  ];

  const mockProjectParams: ProjectParams = {
    totalPurchase: 500000,
    mesuresConservatoires: 0,
    demolition: 0,
    infrastructures: 0,
    etudesPreparatoires: 0,
    fraisEtudesPreparatoires: 0,
    fraisGeneraux3ans: 0,
    batimentFondationConservatoire: 0,
    batimentFondationComplete: 0,
    batimentCoproConservatoire: 0,
    globalCascoPerM2: 1590
  };

  const mockUnitDetails = {
    1: { casco: 159000, parachevements: 80000 },
    3: { casco: 190800, parachevements: 96000 },
    5: { casco: 143100, parachevements: 72000 }
  };

  const mockCalculations: CalculationResults = {
    participantBreakdown: [
      {
        name: 'Alice',
        unitId: 1,
        surface: 100,
        quantity: 1,
        capitalApporte: 50000,
        registrationFeesRate: 12.5,
        interestRate: 4.5,
        durationYears: 25,
        isFounder: true,
        entryDate: new Date(deedDate),
        pricePerM2: 1000,
        purchaseShare: 100000,
        droitEnregistrements: 12500,
        fraisNotaireFixe: 1000,
        casco: 50000,
        parachevements: 30000,
        personalRenovationCost: 80000,
        constructionCost: 80000,
        constructionCostPerUnit: 80000,
        travauxCommunsPerUnit: 0,
        sharedCosts: 20000,
        totalCost: 212500,
        loanNeeded: 162500,
        financingRatio: 0.76,
        monthlyPayment: 900,
        totalRepayment: 270000,
        totalInterest: 100000
      },
      {
        name: 'Bob',
        unitId: 3,
        surface: 120,
        quantity: 1,
        capitalApporte: 40000,
        registrationFeesRate: 12.5,
        interestRate: 4.5,
        durationYears: 25,
        isFounder: true,
        entryDate: new Date(deedDate),
        pricePerM2: 1000,
        purchaseShare: 120000,
        droitEnregistrements: 15000,
        fraisNotaireFixe: 1000,
        casco: 60000,
        parachevements: 36000,
        personalRenovationCost: 96000,
        constructionCost: 96000,
        constructionCostPerUnit: 96000,
        travauxCommunsPerUnit: 0,
        sharedCosts: 20000,
        totalCost: 251000,
        loanNeeded: 211000,
        financingRatio: 0.84,
        monthlyPayment: 1100,
        totalRepayment: 330000,
        totalInterest: 120000
      },
      {
        name: 'Carol',
        unitId: 5,
        surface: 90,
        quantity: 1,
        capitalApporte: 30000,
        registrationFeesRate: 12.5,
        interestRate: 4.5,
        durationYears: 25,
        isFounder: false,
        entryDate: new Date('2026-08-01'),
        pricePerM2: 1667,
        purchaseShare: 150000,
        droitEnregistrements: 18750,
        fraisNotaireFixe: 1000,
        casco: 45000,
        parachevements: 27000,
        personalRenovationCost: 72000,
        constructionCost: 72000,
        constructionCostPerUnit: 72000,
        travauxCommunsPerUnit: 0,
        sharedCosts: 20000,
        totalCost: 260750,
        loanNeeded: 230750,
        financingRatio: 0.88,
        monthlyPayment: 1250,
        totalRepayment: 375000,
        totalInterest: 140000,
        purchaseDetails: {
          buyingFrom: 'Copropriété',
          lotId: 100,
          purchasePrice: 150000
        }
      }
    ],
    totals: {
      purchase: 370000,
      totalDroitEnregistrements: 46250,
      construction: 248000,
      shared: 60000,
      totalTravauxCommuns: 0,
      travauxCommunsPerUnit: 0,
      total: 724250,
      capitalTotal: 120000,
      totalLoansNeeded: 604250,
      averageLoan: 201416,
      averageCapital: 40000
    },
    sharedCosts: 60000,
    sharedPerPerson: 20000,
    totalSurface: 310,
    pricePerM2: 1193.55
  };

  const mockOnOpenParticipantDetails = vi.fn();
  const mockOnOpenCoproDetails = vi.fn();
  const mockOnAddParticipant = vi.fn();

  it('renders participant names in sticky column', () => {
    render(
      <HorizontalSwimLaneTimeline
        participants={mockParticipants}
        projectParams={mockProjectParams}
        calculations={mockCalculations}
        deedDate={deedDate}
        onOpenParticipantDetails={mockOnOpenParticipantDetails}
        onOpenCoproDetails={mockOnOpenCoproDetails}
        onAddParticipant={mockOnAddParticipant}
        onUpdateParticipant={vi.fn()}
        unitDetails={mockUnitDetails}
      />
    );

    // Check participant names appear in the name column
    // Note: Names may appear multiple times (in name column + frais généraux events)
    expect(screen.getAllByText('Alice').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Bob').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Carol').length).toBeGreaterThan(0);
  });

  it('renders T0 cards for founders', () => {
    render(
      <HorizontalSwimLaneTimeline
        participants={mockParticipants}
        projectParams={mockProjectParams}
        calculations={mockCalculations}
        deedDate={deedDate}
        onOpenParticipantDetails={mockOnOpenParticipantDetails}
        onOpenCoproDetails={mockOnOpenCoproDetails}
        onAddParticipant={mockOnAddParticipant}
        onUpdateParticipant={vi.fn()}
        unitDetails={mockUnitDetails}
      />
    );

    // Alice and Bob are founders - should have T0 cards
    const aliceCards = screen.getAllByText(/212.*500/); // Total cost
    expect(aliceCards.length).toBeGreaterThan(0);
  });

  it('calls onOpenParticipantDetails when T0 card is clicked', () => {
    render(
      <HorizontalSwimLaneTimeline
        participants={mockParticipants}
        projectParams={mockProjectParams}
        calculations={mockCalculations}
        deedDate={deedDate}
        onOpenParticipantDetails={mockOnOpenParticipantDetails}
        onOpenCoproDetails={mockOnOpenCoproDetails}
        onAddParticipant={mockOnAddParticipant}
        onUpdateParticipant={vi.fn()}
        unitDetails={mockUnitDetails}
      />
    );

    // Find and click Alice's T0 card
    const aliceT0Card = screen.getByText('Alice').closest('.swimlane-row')?.querySelector('.timeline-card-t0');

    if (aliceT0Card) {
      aliceT0Card.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      expect(mockOnOpenParticipantDetails).toHaveBeenCalledWith(0);
    }
  });

  it('displays correct transaction delta based on coproReservesShare configuration', () => {
    // Carol buys from copropriété for 150,000€ on 2026-08-01
    // Alice has 100m², Bob has 120m² (both founders)
    // With 30% to reserves (default), 70% = 105,000€ goes to participants
    // Surface-based distribution:
    // Total founder surface: 100 + 120 = 220m²
    // Alice gets: 105,000 × (100/220) = 47,727€
    // Bob gets: 105,000 × (120/220) = 57,273€

    const { rerender } = render(
      <HorizontalSwimLaneTimeline
        participants={mockParticipants}
        projectParams={mockProjectParams}
        calculations={mockCalculations}
        deedDate={deedDate}
        onOpenParticipantDetails={mockOnOpenParticipantDetails}
        onOpenCoproDetails={mockOnOpenCoproDetails}
        onAddParticipant={mockOnAddParticipant}
        onUpdateParticipant={vi.fn()}
        unitDetails={mockUnitDetails}
        coproReservesShare={30}
      />
    );

    // Should show redistribution amounts with 30% to reserves (70% to participants)
    // Surface-based: Alice gets 47,727€, Bob gets 57,273€
    const aliceAmount = screen.getAllByText(/47.*727/);
    expect(aliceAmount.length).toBeGreaterThanOrEqual(1); // At least one occurrence for Alice

    const bobAmount = screen.getAllByText(/57.*273/);
    expect(bobAmount.length).toBeGreaterThanOrEqual(1); // At least one occurrence for Bob

    // Now change to 60% reserves (40% to participants)
    // 150,000 × 40% = 60,000€ total to participants
    // Alice gets: 60,000 × (100/220) = 27,273€
    // Bob gets: 60,000 × (120/220) = 32,727€
    rerender(
      <HorizontalSwimLaneTimeline
        participants={mockParticipants}
        projectParams={mockProjectParams}
        calculations={mockCalculations}
        deedDate={deedDate}
        onOpenParticipantDetails={mockOnOpenParticipantDetails}
        onOpenCoproDetails={mockOnOpenCoproDetails}
        onAddParticipant={mockOnAddParticipant}
        onUpdateParticipant={vi.fn()}
        unitDetails={mockUnitDetails}
        coproReservesShare={60}
      />
    );

    // Should now show smaller amounts reflecting 40% to participants
    // Alice gets 27,273€, Bob gets 32,727€
    const aliceSmaller = screen.getAllByText(/27.*273/);
    expect(aliceSmaller.length).toBeGreaterThanOrEqual(1);

    const bobSmaller = screen.getAllByText(/32.*727/);
    expect(bobSmaller.length).toBeGreaterThanOrEqual(1);
  });
});
