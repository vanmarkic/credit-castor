import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import * as Tooltip from '@radix-ui/react-tooltip';
import PortageLotConfig from './PortageLotConfig';
import type { PortageFormulaParams } from '../utils/calculatorUtils';

describe('PortageLotConfig', () => {
  const defaultFormulaParams: PortageFormulaParams = {
    indexationRate: 2.0,
    carryingCostRecovery: 100,
    averageInterestRate: 4.5
  };

  it('should render empty state when no portage lots', () => {
    render(
      <Tooltip.Provider>
        <PortageLotConfig
          portageLots={[]}
          onAddLot={vi.fn()}
          onRemoveLot={vi.fn()}
          onUpdateSurface={vi.fn()}
          deedDate={new Date('2023-01-01')}
          formulaParams={defaultFormulaParams}
        />
      </Tooltip.Provider>
    );

    expect(screen.getByText(/Aucun lot en portage/i)).toBeInTheDocument();
  });

  it('should call onAddLot when add button clicked', () => {
    const onAddLot = vi.fn();

    render(
      <Tooltip.Provider>
        <PortageLotConfig
          portageLots={[]}
          onAddLot={onAddLot}
          onRemoveLot={vi.fn()}
          onUpdateSurface={vi.fn()}
          deedDate={new Date('2023-01-01')}
          formulaParams={defaultFormulaParams}
        />
      </Tooltip.Provider>
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
        acquiredDate: new Date('2026-02-01'),
        originalPrice: 60000,
        originalNotaryFees: 7500,
        originalConstructionCost: 0
      }
    ];

    render(
      <Tooltip.Provider>
        <PortageLotConfig
          portageLots={lots}
          onAddLot={vi.fn()}
          onRemoveLot={vi.fn()}
          onUpdateSurface={vi.fn()}
          deedDate={new Date('2023-01-01')}
          formulaParams={defaultFormulaParams}
        />
      </Tooltip.Provider>
    );

    const input = screen.getByDisplayValue('50');
    expect(input).toBeInTheDocument();
  });

  it('should display price breakdown table for portage lot', () => {
    const lot = {
      lotId: 1,
      surface: 45,
      allocatedSurface: 45,
      unitId: 1,
      isPortage: true,
      originalPrice: 60000,
      originalNotaryFees: 7500,
      originalConstructionCost: 0,
      acquiredDate: new Date('2023-01-01')
    };

    const formulaParams: PortageFormulaParams = {
      indexationRate: 2.0,
      carryingCostRecovery: 100,
      averageInterestRate: 4.5
    };

    render(
      <Tooltip.Provider>
        <PortageLotConfig
          portageLots={[lot]}
          onAddLot={() => {}}
          onRemoveLot={() => {}}
          onUpdateSurface={() => {}}
          deedDate={new Date('2023-01-01')}
          formulaParams={formulaParams}
        />
      </Tooltip.Provider>
    );

    expect(screen.getByText(/Base acquisition/i)).toBeInTheDocument();
    expect(screen.getByText(/Indexation/i)).toBeInTheDocument();
    expect(screen.getByText(/Frais de portage/i)).toBeInTheDocument();
    expect(screen.getByText(/Prix total/i)).toBeInTheDocument();
  });

  it('should display tooltip icon for Prix total', () => {
    const lot = {
      lotId: 1,
      surface: 45,
      allocatedSurface: 45,
      unitId: 1,
      isPortage: true,
      originalPrice: 60000,
      originalNotaryFees: 7500,
      originalConstructionCost: 0,
      acquiredDate: new Date('2023-01-01')
    };

    const formulaParams: PortageFormulaParams = {
      indexationRate: 2.0,
      carryingCostRecovery: 100,
      averageInterestRate: 4.5
    };

    render(
      <Tooltip.Provider>
        <PortageLotConfig
          portageLots={[lot]}
          onAddLot={() => {}}
          onRemoveLot={() => {}}
          onUpdateSurface={() => {}}
          deedDate={new Date('2023-01-01')}
          formulaParams={formulaParams}
        />
      </Tooltip.Provider>
    );

    // Check for Info icon (from FormulaTooltip)
    const icons = document.querySelectorAll('svg');
    expect(icons.length).toBeGreaterThan(0);
  });
});
