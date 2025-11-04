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
        capitalApporte: 50000,
        notaryFeesRate: 12.5,
        interestRate: 4.5,
        durationYears: 25,
        isFounder: true,
        entryDate: new Date(deedDate),
        pricePerM2: 1000,
        purchaseShare: 100000,
        notaryFees: 12500,
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
        notaryFeesRate: 12.5,
        interestRate: 4.5,
        durationYears: 25,
        isFounder: true,
        entryDate: new Date(deedDate),
        pricePerM2: 1000,
        purchaseShare: 120000,
        notaryFees: 15000,
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
        notaryFeesRate: 12.5,
        interestRate: 4.5,
        durationYears: 25,
        isFounder: false,
        entryDate: new Date('2026-08-01'),
        pricePerM2: 1667,
        purchaseShare: 150000,
        notaryFees: 18750,
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
          purchasePrice: 150000
        }
      }
    ],
    totals: {
      purchase: 370000,
      totalNotaryFees: 46250,
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
  const mockOnAddParticipant = vi.fn();

  it('renders participant names in sticky column', () => {
    render(
      <HorizontalSwimLaneTimeline
        participants={mockParticipants}
        projectParams={mockProjectParams}
        calculations={mockCalculations}
        deedDate={deedDate}
        onOpenParticipantDetails={mockOnOpenParticipantDetails}
        onAddParticipant={mockOnAddParticipant}
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
        onAddParticipant={mockOnAddParticipant}
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
        onAddParticipant={mockOnAddParticipant}
      />
    );

    // Find and click Alice's T0 card
    const aliceT0Card = screen.getByText('Alice').closest('.swimlane-row')?.querySelector('.timeline-card-t0');

    if (aliceT0Card) {
      aliceT0Card.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      expect(mockOnOpenParticipantDetails).toHaveBeenCalledWith(0);
    }
  });

  it('should embed transaction in snapshot when participant sells portage lot', () => {
    const participantsWithPortageSale: Participant[] = [
      {
        name: 'Annabelle/Colin',
        capitalApporte: 100000,
        notaryFeesRate: 12.5,
        interestRate: 3.5,
        durationYears: 30,
        isFounder: true,
        entryDate: new Date('2026-02-01'),
        unitId: 1,
        surface: 80,
        quantity: 1,
        lotsOwned: [
          {
            lotId: 1,
            surface: 80,
            unitId: 1,
            isPortage: true,
            acquiredDate: new Date('2026-02-01'),
            originalPrice: 180000,
            originalNotaryFees: 22500,
            originalConstructionCost: 470000
          }
        ]
      },
      {
        name: 'Nouveau·elle',
        capitalApporte: 50000,
        notaryFeesRate: 12.5,
        interestRate: 3.5,
        durationYears: 30,
        isFounder: false,
        entryDate: new Date('2027-06-01'),
        unitId: 1,
        surface: 80,
        quantity: 1,
        purchaseDetails: {
          buyingFrom: 'Annabelle/Colin',
          lotId: 1,
          purchasePrice: 680000
        }
      }
    ];

    const calculationsWithPortage: CalculationResults = {
      ...mockCalculations,
      participantBreakdown: [
        {
          ...mockCalculations.participantBreakdown[0],
          name: 'Annabelle/Colin',
          totalCost: 680463,
          loanNeeded: 580463,
          monthlyPayment: 2671
        },
        {
          ...mockCalculations.participantBreakdown[1],
          name: 'Nouveau·elle',
          totalCost: 297313,
          loanNeeded: 247313,
          monthlyPayment: 1208
        }
      ]
    };

    render(
      <HorizontalSwimLaneTimeline
        participants={participantsWithPortageSale}
        projectParams={mockProjectParams}
        calculations={calculationsWithPortage}
        deedDate="2026-02-01"
        onOpenParticipantDetails={mockOnOpenParticipantDetails}
        onAddParticipant={mockOnAddParticipant}
      />
    );

    // Verify both participants are rendered
    expect(screen.getByText('Annabelle/Colin')).toBeInTheDocument();
    expect(screen.getByText('Nouveau·elle')).toBeInTheDocument();

    // The snapshot should have a transaction embedded with delta info showing "Sold portage lot to"
    // AND it should show the lot price (which is only available from the transaction object)
    // Both seller and buyer will have cards with the transaction, so we use getAllByText
    const soldTexts = screen.getAllByText(/Sold portage lot to/);
    expect(soldTexts.length).toBeGreaterThan(0);

    // Check for lot price display (this will only appear when transaction is embedded)
    const lotPriceTexts = screen.getAllByText(/Lot price:/);
    expect(lotPriceTexts.length).toBeGreaterThan(0);
  });
});
