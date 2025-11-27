import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PaymentTimeline } from './PaymentTimeline';
import type { PhaseCosts } from '../../utils/phaseCostsCalculation';

describe('PaymentTimeline', () => {
  const mockPhaseCosts: PhaseCosts = {
    signature: {
      purchaseShare: 35000,
      registrationFees: 5200,
      notaryFees: 5000,
      total: 45200,
    },
    construction: {
      casco: 60000,
      travauxCommuns: 12500,
      commun: 15000,
      total: 87500,
    },
    emmenagement: {
      parachevements: 25000,
      total: 25000,
    },
    grandTotal: 157700,
  };

  it('should display all three phases with icons and subtitles', () => {
    render(
      <PaymentTimeline
        phaseCosts={mockPhaseCosts}
        capitalApporte={30000}
        monthlyPayment={639}
      />
    );

    expect(screen.getByText('SIGNATURE')).toBeInTheDocument();
    expect(screen.getByText('CONSTRUCTION')).toBeInTheDocument();
    expect(screen.getByText('EMMÉNAGEMENT')).toBeInTheDocument();

    // Emotional subtitles
    expect(screen.getByText('Je deviens propriétaire')).toBeInTheDocument();
    expect(screen.getByText('Mon logement prend forme')).toBeInTheDocument();
    expect(screen.getByText("J'emménage chez moi")).toBeInTheDocument();

    expect(screen.getByText('45 200 €')).toBeInTheDocument();
    expect(screen.getByText('87 500 €')).toBeInTheDocument();
    expect(screen.getByText('25 000 €')).toBeInTheDocument();
  });

  it('should display summary bar with total, to finance, and monthly payment', () => {
    render(
      <PaymentTimeline
        phaseCosts={mockPhaseCosts}
        capitalApporte={30000}
        monthlyPayment={639}
      />
    );

    // Summary bar - answers key questions at a glance
    expect(screen.getByText('TOTAL')).toBeInTheDocument();
    expect(screen.getByText('157 700 €')).toBeInTheDocument();
    expect(screen.getByText('À FINANCER')).toBeInTheDocument();
    expect(screen.getByText('127 700 €')).toBeInTheDocument(); // 157700 - 30000
    expect(screen.getByText('MENSUALITÉ')).toBeInTheDocument();
    expect(screen.getByText('~639 €/mois')).toBeInTheDocument();
  });

  it('should display timeline header with title', () => {
    render(
      <PaymentTimeline
        phaseCosts={mockPhaseCosts}
        capitalApporte={30000}
        monthlyPayment={639}
      />
    );

    expect(screen.getByText('MON PARCOURS DE PAIEMENT')).toBeInTheDocument();
  });

  it('should only show 3 timeline dots (phases only, not total)', () => {
    const { container } = render(
      <PaymentTimeline
        phaseCosts={mockPhaseCosts}
        capitalApporte={30000}
        monthlyPayment={639}
      />
    );

    // Timeline should have exactly 3 dots for 3 phases
    const dots = container.querySelectorAll('[data-testid="timeline-dot"]');
    expect(dots).toHaveLength(3);
  });
});
