import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import PortageLotConfig from './PortageLotConfig';

describe('PortageLotConfig', () => {
  it('should render empty state when no portage lots', () => {
    const { container } = render(
      <PortageLotConfig
        participantIndex={0}
        portageLots={[]}
        onAddLot={vi.fn()}
        onRemoveLot={vi.fn()}
        onUpdateSurface={vi.fn()}
      />
    );

    expect(screen.getByText(/Aucun lot en portage/i)).toBeInTheDocument();
  });

  it('should call onAddLot when add button clicked', () => {
    const onAddLot = vi.fn();

    render(
      <PortageLotConfig
        participantIndex={0}
        portageLots={[]}
        onAddLot={onAddLot}
        onRemoveLot={vi.fn()}
        onUpdateSurface={vi.fn()}
      />
    );

    const addButton = screen.getByText(/Ajouter lot portage/i);
    fireEvent.click(addButton);

    expect(onAddLot).toHaveBeenCalledTimes(1);
  });

  it('should render portage lots with surface input', () => {
    const lots = [
      {
        lotId: 1,
        surface: 50,
        unitId: 1,
        isPortage: true,
        allocatedSurface: 50,
        acquiredDate: new Date('2026-02-01')
      }
    ];

    render(
      <PortageLotConfig
        participantIndex={0}
        portageLots={lots}
        onAddLot={vi.fn()}
        onRemoveLot={vi.fn()}
        onUpdateSurface={vi.fn()}
      />
    );

    const input = screen.getByDisplayValue('50');
    expect(input).toBeInTheDocument();
  });
});
