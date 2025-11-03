import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import AvailableLotsView from './AvailableLotsView';
import type { AvailableLot } from '../utils/availableLots';

describe('AvailableLotsView', () => {
  const deedDate = new Date('2026-02-01');

  it('should display empty state when no lots available', () => {
    render(
      <AvailableLotsView
        availableLots={[]}
        deedDate={deedDate}
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
      />
    );

    expect(screen.getByText(/Lots Portage \(Fondateurs\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Lot #2/i)).toBeInTheDocument();
    expect(screen.getByText(/De Founder A/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Surface Imposée/i).length).toBeGreaterThan(0);
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
      />
    );

    expect(screen.getByText(/Lots Copropriété/i)).toBeInTheDocument();
    expect(screen.getByText(/Lot #10/i)).toBeInTheDocument();
    expect(screen.getByText(/De la copropriété/i)).toBeInTheDocument();
    expect(screen.getByText(/Surface Libre/i)).toBeInTheDocument();
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
      />
    );

    expect(screen.getByText(/Lots Portage \(Fondateurs\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Lots Copropriété/i)).toBeInTheDocument();
    expect(screen.getByText(/Lot #2/i)).toBeInTheDocument();
    expect(screen.getByText(/Lot #10/i)).toBeInTheDocument();
  });
});
