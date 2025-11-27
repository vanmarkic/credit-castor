import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FinancingSection } from './FinancingSection';
import type { PhaseCosts } from '../../utils/phaseCostsCalculation';
import type { Participant, ParticipantCalculation } from '../../utils/calculatorUtils';

describe('FinancingSection', () => {
  const mockPhaseCosts: PhaseCosts = {
    signature: { purchaseShare: 35000, registrationFees: 5200, notaryFees: 5000, total: 45200 },
    construction: { casco: 60000, travauxCommuns: 12500, commun: 15000, total: 87500 },
    emmenagement: { parachevements: 25000, total: 25000 },
    grandTotal: 157700,
  };

  const mockParticipant: Partial<Participant> = {
    capitalApporte: 30000,
    useTwoLoans: false,
    interestRate: 3.5,
    durationYears: 25,
  };

  const mockParticipantCalc: Partial<ParticipantCalculation> = {
    loanNeeded: 127700,
    monthlyPayment: 640,
    loan1MonthlyPayment: 226,
    loan2MonthlyPayment: 413,
  };

  it('should show collapsed summary with monthly payment', () => {
    render(
      <FinancingSection
        phaseCosts={mockPhaseCosts}
        participant={mockParticipant as Participant}
        participantCalc={mockParticipantCalc as ParticipantCalculation}
        onUpdateParticipant={vi.fn()}
        defaultExpanded={false}
      />
    );

    // Collapsed state should show mini-summary
    expect(screen.getByText(/Financement/)).toBeInTheDocument();
    expect(screen.getByText(/640 €\/mois/)).toBeInTheDocument();
  });

  it('should expand to show full configuration when clicked', () => {
    render(
      <FinancingSection
        phaseCosts={mockPhaseCosts}
        participant={mockParticipant as Participant}
        participantCalc={mockParticipantCalc as ParticipantCalculation}
        onUpdateParticipant={vi.fn()}
        defaultExpanded={false}
      />
    );

    fireEvent.click(screen.getByRole('button'));

    expect(screen.getByText('Capital apporté:')).toBeInTheDocument();
    expect(screen.getByText('Un seul prêt')).toBeInTheDocument();
    expect(screen.getByText('Deux prêts')).toBeInTheDocument();
  });

  it('should show auto-suggested loan amounts when two loans enabled', () => {
    const participantWithTwoLoans = { ...mockParticipant, useTwoLoans: true };

    render(
      <FinancingSection
        phaseCosts={mockPhaseCosts}
        participant={participantWithTwoLoans as Participant}
        participantCalc={mockParticipantCalc as ParticipantCalculation}
        onUpdateParticipant={vi.fn()}
        defaultExpanded={true}
      />
    );

    expect(screen.getByText('PRÊT 1 (Signature)')).toBeInTheDocument();
    expect(screen.getByText('PRÊT 2 (Construction)')).toBeInTheDocument();
  });

  it('should reframe parachèvements as payment method choice', () => {
    const participantWithTwoLoans = { ...mockParticipant, useTwoLoans: true };

    render(
      <FinancingSection
        phaseCosts={mockPhaseCosts}
        participant={participantWithTwoLoans as Participant}
        participantCalc={mockParticipantCalc as ParticipantCalculation}
        onUpdateParticipant={vi.fn()}
        defaultExpanded={true}
      />
    );

    // Should ask HOW to pay, not WHETHER to include
    expect(screen.getByText('Comment payer les parachèvements?')).toBeInTheDocument();
    expect(screen.getByText('Cash (payer plus tard)')).toBeInTheDocument();
    expect(screen.getByText(/Ajouter au prêt 2/)).toBeInTheDocument();
  });
});
