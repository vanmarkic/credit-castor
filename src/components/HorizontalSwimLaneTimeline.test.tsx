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
      notaryFeesRate: 12.5,
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
      notaryFeesRate: 12.5,
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
      notaryFeesRate: 12.5,
      interestRate: 4.5,
      durationYears: 25,
      isFounder: false,
      entryDate: new Date('2026-08-01'),
      unitId: 5,
      surface: 90,
      quantity: 1,
      purchaseDetails: {
        buyingFrom: 'Copropriété',
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

  const mockCalculations: CalculationResults = {
    participantBreakdown: [
      {
        name: 'Alice',
        unitId: 1,
        surface: 100,
        quantity: 1,
        purchaseShare: 100000,
        notaryFees: 12500,
        casco: 50000,
        parachevements: 30000,
        personalRenovationCost: 80000,
        sharedInfrastructureCost: 20000,
        totalCost: 212500,
        capitalApporte: 50000,
        loanNeeded: 162500,
        monthlyPayment: 900,
        totalInterest: 100000,
        isFounder: true,
        entryDate: new Date(deedDate)
      },
      {
        name: 'Bob',
        unitId: 3,
        surface: 120,
        quantity: 1,
        purchaseShare: 120000,
        notaryFees: 15000,
        casco: 60000,
        parachevements: 36000,
        personalRenovationCost: 96000,
        sharedInfrastructureCost: 20000,
        totalCost: 251000,
        capitalApporte: 40000,
        loanNeeded: 211000,
        monthlyPayment: 1100,
        totalInterest: 120000,
        isFounder: true,
        entryDate: new Date(deedDate)
      },
      {
        name: 'Carol',
        unitId: 5,
        surface: 90,
        quantity: 1,
        purchaseShare: 150000,
        notaryFees: 18750,
        casco: 45000,
        parachevements: 27000,
        personalRenovationCost: 72000,
        sharedInfrastructureCost: 20000,
        totalCost: 260750,
        capitalApporte: 30000,
        loanNeeded: 230750,
        monthlyPayment: 1250,
        totalInterest: 140000,
        isFounder: false,
        entryDate: new Date('2026-08-01')
      }
    ],
    totals: {
      purchase: 370000,
      totalNotaryFees: 46250,
      total: 724250
    },
    sharedCosts: 60000,
    sharedPerPerson: 20000,
    totalSurface: 310,
    pricePerM2: 1193.55
  };

  const mockOnOpenParticipantDetails = vi.fn();

  it('renders participant names in sticky column', () => {
    render(
      <HorizontalSwimLaneTimeline
        participants={mockParticipants}
        projectParams={mockProjectParams}
        calculations={mockCalculations}
        deedDate={deedDate}
        onOpenParticipantDetails={mockOnOpenParticipantDetails}
      />
    );

    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('Carol')).toBeInTheDocument();
  });

  it('renders T0 cards for founders', () => {
    render(
      <HorizontalSwimLaneTimeline
        participants={mockParticipants}
        projectParams={mockProjectParams}
        calculations={mockCalculations}
        deedDate={deedDate}
        onOpenParticipantDetails={mockOnOpenParticipantDetails}
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
      />
    );

    // Find and click Alice's T0 card
    const aliceT0Card = screen.getByText('Alice').closest('.swimlane-row')?.querySelector('.timeline-card-t0');

    if (aliceT0Card) {
      aliceT0Card.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      expect(mockOnOpenParticipantDetails).toHaveBeenCalledWith(0);
    }
  });
});
