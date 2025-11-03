import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import AvailableLotsView from './AvailableLotsView';
import type { AvailableLot } from '../utils/availableLots';

describe('AvailableLotsView', () => {
  const deedDate = new Date('2026-02-01');
  const defaultFormulaParams = {
    indexationRate: 2.0,
    carryingCostRecovery: 100,
    averageInterestRate: 4.5
  };

  it('should display empty state when no lots available', () => {
    render(
      <AvailableLotsView
        availableLots={[]}
        deedDate={deedDate}
        formulaParams={defaultFormulaParams}
      />
    );

    expect(screen.getByText(/Aucun lot disponible pour le moment/i)).toBeInTheDocument();
  });

  it('should display founder portage lots with imposed surface', () => {
    const lots: AvailableLot[] = [
      {
        lotId: 2,
        surface: 50,
        source: 'FOUNDER',
        surfaceImposed: true,
        fromParticipant: 'Founder A'
      }
    ];

    render(
      <AvailableLotsView
        availableLots={lots}
        deedDate={deedDate}
        formulaParams={defaultFormulaParams}
      />
    );

    expect(screen.getByText(/Lots Portage \(Surface imposée\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Founder A/i)).toBeInTheDocument();
    expect(screen.getByText(/50m²/i)).toBeInTheDocument();
  });

  it('should display copropriété lots with free surface', () => {
    const lots: AvailableLot[] = [
      {
        lotId: 10,
        surface: 300,
        source: 'COPRO',
        surfaceImposed: false,
        totalCoproSurface: 300
      }
    ];

    render(
      <AvailableLotsView
        availableLots={lots}
        deedDate={deedDate}
        formulaParams={defaultFormulaParams}
      />
    );

    expect(screen.getByText(/Lots Copropriété \(Surface libre\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Lot #10/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText('0')).toBeInTheDocument();
  });

  it('should display both founder and copro lots together', () => {
    const lots: AvailableLot[] = [
      {
        lotId: 2,
        surface: 50,
        source: 'FOUNDER',
        surfaceImposed: true,
        fromParticipant: 'Founder A'
      },
      {
        lotId: 10,
        surface: 300,
        source: 'COPRO',
        surfaceImposed: false,
        totalCoproSurface: 300
      }
    ];

    render(
      <AvailableLotsView
        availableLots={lots}
        deedDate={deedDate}
        formulaParams={defaultFormulaParams}
      />
    );

    expect(screen.getByText(/Lots Portage \(Surface imposée\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Lots Copropriété \(Surface libre\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Founder A/i)).toBeInTheDocument();
    expect(screen.getByText(/Lot #10/i)).toBeInTheDocument();
  });

  it('should display generic formula alongside specific lots', () => {
    const lots: AvailableLot[] = [
      {
        lotId: 1,
        surface: 45,
        source: 'FOUNDER',
        surfaceImposed: true,
        fromParticipant: 'Alice',
        originalPrice: 60000,
        originalNotaryFees: 7500,
        originalConstructionCost: 0
      }
    ];

    const formulaParams = {
      indexationRate: 2.0,
      carryingCostRecovery: 100,
      averageInterestRate: 4.5
    };

    render(
      <AvailableLotsView
        availableLots={lots}
        deedDate={new Date('2023-01-01')}
        formulaParams={formulaParams}
      />
    );

    expect(screen.getByText(/Formule générale/i)).toBeInTheDocument();
    expect(screen.getAllByText(/disponibles/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Alice/i)).toBeInTheDocument();
  });
});
