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

    expect(screen.getByText(/Founder A/i)).toBeInTheDocument();
    expect(screen.getByText(/50m²/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Prix/i).length).toBeGreaterThan(0);
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

    expect(screen.getByText(/Lots Copropriété \(Surface libre\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Founder A/i)).toBeInTheDocument();
    expect(screen.getByText(/Lot #10/i)).toBeInTheDocument();
  });

  it('should display portage lots with pricing details', () => {
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

    expect(screen.getByText(/Alice/i)).toBeInTheDocument();
    expect(screen.getByText(/45m²/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Prix/i).length).toBeGreaterThan(0);
  });

  it('should show error when buyer entry date is missing in interactive mode', () => {
    const lots: AvailableLot[] = [
      {
        lotId: 2,
        surface: 50,
        source: 'FOUNDER',
        surfaceImposed: true,
        fromParticipant: 'Founder A'
      }
    ];

    const mockOnSelectLot = () => {}; // Interactive mode enabled

    render(
      <AvailableLotsView
        availableLots={lots}
        deedDate={deedDate}
        formulaParams={defaultFormulaParams}
        onSelectLot={mockOnSelectLot}
        // buyerEntryDate is undefined
      />
    );

    expect(screen.getByText(/Impossible de calculer le prix en portage/i)).toBeInTheDocument();
    expect(screen.getByText(/doit avoir une date d'entrée valide/i)).toBeInTheDocument();
  });

  it('should show error when buyer entry date is before deed date', () => {
    const lots: AvailableLot[] = [
      {
        lotId: 2,
        surface: 50,
        source: 'FOUNDER',
        surfaceImposed: true,
        fromParticipant: 'Founder A'
      }
    ];

    const invalidBuyerDate = new Date('2025-01-01'); // Before deed date (2026-02-01)

    render(
      <AvailableLotsView
        availableLots={lots}
        deedDate={deedDate}
        formulaParams={defaultFormulaParams}
        buyerEntryDate={invalidBuyerDate}
      />
    );

    expect(screen.getByText(/Date d'entrée invalide/i)).toBeInTheDocument();
    expect(screen.getByText(/doit être égale ou postérieure/i)).toBeInTheDocument();
  });

  it('should work with valid buyer entry date equal to deed date', () => {
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
        buyerEntryDate={deedDate} // Same as deed date is valid
      />
    );

    expect(screen.queryByText(/invalide/i)).not.toBeInTheDocument();
    expect(screen.getByText(/Founder A/i)).toBeInTheDocument();
    expect(screen.getByText(/50m²/i)).toBeInTheDocument();
  });

  it('should work with valid buyer entry date after deed date', () => {
    const lots: AvailableLot[] = [
      {
        lotId: 2,
        surface: 50,
        source: 'FOUNDER',
        surfaceImposed: true,
        fromParticipant: 'Founder A'
      }
    ];

    const validBuyerDate = new Date('2027-06-01'); // After deed date

    render(
      <AvailableLotsView
        availableLots={lots}
        deedDate={deedDate}
        formulaParams={defaultFormulaParams}
        buyerEntryDate={validBuyerDate}
      />
    );

    expect(screen.queryByText(/invalide/i)).not.toBeInTheDocument();
    expect(screen.getByText(/Founder A/i)).toBeInTheDocument();
    expect(screen.getByText(/50m²/i)).toBeInTheDocument();
  });
});
