import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PortageFormulaConfig from './PortageFormulaConfig';
import type { PortageFormulaParams } from '../utils/calculatorUtils';
import { UnlockProvider } from '../contexts/UnlockContext';

describe('PortageFormulaConfig', () => {
  it('should render formula parameters inputs', async () => {
    const user = userEvent.setup();
    const params: PortageFormulaParams = {
      indexationRate: 2.0,
      carryingCostRecovery: 100,
      averageInterestRate: 4.5,
      coproReservesShare: 30
    };

    render(
      <UnlockProvider>
        <PortageFormulaConfig
          formulaParams={params}
          onUpdateParams={() => {}}
          deedDate={new Date('2023-01-01')}
        />
      </UnlockProvider>
    );

    expect(screen.getByText(/Configuration Formule de Portage/i)).toBeInTheDocument();

    // Expand the component to see the inputs
    const expandButton = screen.getByText(/Configuration Formule de Portage/i);
    await user.click(expandButton);

    expect(screen.getByLabelText(/Taux d'indexation annuel/i)).toHaveValue(2.0);
    expect(screen.getByLabelText(/Récupération frais de portage/i)).toHaveValue(100);
    expect(screen.getByLabelText(/Taux d'intérêt moyen/i)).toHaveValue(4.5);
  });

  it('should call onUpdateParams when indexation rate changes', async () => {
    const user = userEvent.setup();
    const mockUpdate = vi.fn();
    const params: PortageFormulaParams = {
      indexationRate: 2.0,
      carryingCostRecovery: 100,
      averageInterestRate: 4.5,
      coproReservesShare: 30
    };

    // Mock localStorage to have unlocked state
    const unlockState = {
      isUnlocked: true,
      unlockedBy: 'test@example.com',
      unlockedAt: new Date().toISOString(),
    };
    localStorage.setItem('credit-castor-unlock-state', JSON.stringify(unlockState));

    render(
      <UnlockProvider>
        <PortageFormulaConfig
          formulaParams={params}
          onUpdateParams={mockUpdate}
          deedDate={new Date('2023-01-01')}
        />
      </UnlockProvider>
    );

    // Expand the component to see the inputs
    const expandButton = screen.getByText(/Configuration Formule de Portage/i);
    await user.click(expandButton);

    const input = screen.getByLabelText(/Taux d'indexation annuel/i) as HTMLInputElement;

    // Verify input is not disabled
    expect(input).not.toBeDisabled();

    // Select all text and replace with new value
    await user.tripleClick(input);
    await user.keyboard('3');

    // Check that mockUpdate was called with the new value
    expect(mockUpdate).toHaveBeenCalled();
    const lastCall = mockUpdate.mock.calls[mockUpdate.mock.calls.length - 1];
    expect(lastCall[0]).toEqual({
      ...params,
      indexationRate: 3
    });
  });
});
