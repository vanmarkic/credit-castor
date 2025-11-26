import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PaymentPhaseCard } from './PaymentPhaseCard';

describe('PaymentPhaseCard', () => {
  it('should display phase label, subtitle, icon and total amount', () => {
    render(
      <PaymentPhaseCard
        label="SIGNATURE"
        subtitle="Je deviens propriétaire"
        icon="🔑"
        total={45200}
        items={[
          { label: "Part d'achat", amount: 35000 },
          { label: 'Enregistrement', amount: 5200 },
          { label: 'Notaire', amount: 5000 },
        ]}
      />
    );

    expect(screen.getByText('SIGNATURE')).toBeInTheDocument();
    expect(screen.getByText('Je deviens propriétaire')).toBeInTheDocument();
    expect(screen.getByText('🔑')).toBeInTheDocument();
    expect(screen.getByText('45 200 €')).toBeInTheDocument();
  });

  it('should show details when expanded', () => {
    render(
      <PaymentPhaseCard
        label="SIGNATURE"
        subtitle="Je deviens propriétaire"
        icon="🔑"
        total={45200}
        items={[
          { label: "Part d'achat", amount: 35000 },
          { label: 'Enregistrement', amount: 5200 },
        ]}
      />
    );

    // Click to expand
    fireEvent.click(screen.getByText('Détails'));

    expect(screen.getByText("Part d'achat")).toBeInTheDocument();
    expect(screen.getByText('35 000 €')).toBeInTheDocument();
    expect(screen.getByText('Enregistrement')).toBeInTheDocument();
    expect(screen.getByText('5 200 €')).toBeInTheDocument();
  });

  it('should not render items with zero amount', () => {
    render(
      <PaymentPhaseCard
        label="CONSTRUCTION"
        subtitle="Mon logement prend forme"
        icon="🏗️"
        total={60000}
        items={[
          { label: 'CASCO', amount: 60000 },
          { label: 'Travaux communs', amount: 0 },
        ]}
      />
    );

    fireEvent.click(screen.getByText('Détails'));

    expect(screen.getByText('CASCO')).toBeInTheDocument();
    expect(screen.queryByText('Travaux communs')).not.toBeInTheDocument();
  });

  it('should apply variant styling for different phases', () => {
    const { container } = render(
      <PaymentPhaseCard
        label="EMMÉNAGEMENT"
        subtitle="J'emménage chez moi"
        icon="🏠"
        total={25000}
        variant="flexible"
        items={[{ label: 'Parachèvements', amount: 25000 }]}
      />
    );

    // Flexible variant should have dashed border
    expect(container.querySelector('.border-dashed')).toBeInTheDocument();
  });
});
