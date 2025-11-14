import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ExpenseCategoriesManager } from './ExpenseCategoriesManager';
import { formatCurrency } from '../../utils/formatting';
import type { ExpenseCategories, ProjectParams, Participant, UnitDetails } from '../../utils/calculatorUtils';

// Mock the useProjectParamPermissions hook
vi.mock('../../hooks/useFieldPermissions', () => ({
  useProjectParamPermissions: () => ({ canEdit: true })
}));

describe('ExpenseCategoriesManager - TRAVAUX COMMUNS Display', () => {
  const mockOnUpdateProjectParams = vi.fn();

  const defaultExpenseCategories: ExpenseCategories = {
    conservatoire: [],
    habitabiliteSommaire: [],
    premierTravaux: []
  };

  const defaultProjectParams: ProjectParams = {
    totalPurchase: 650000,
    mesuresConservatoires: 0,
    demolition: 0,
    infrastructures: 0,
    etudesPreparatoires: 0,
    fraisEtudesPreparatoires: 0,
    fraisGeneraux3ans: 0,
    batimentFondationConservatoire: 43700, // Base travaux communs
    batimentFondationComplete: 269200, // Base travaux communs
    batimentCoproConservatoire: 56000, // Base travaux communs
    globalCascoPerM2: 1590,
    cascoTvaRate: 6,
    travauxCommuns: {
      enabled: true,
      items: [
        { 
          label: 'Rénovation complète', 
          sqm: 100, 
          cascoPricePerSqm: 2000, 
          parachevementPricePerSqm: 700 
          // amount = (100 * 2000) + (100 * 700) = 270000
        },
        { 
          label: 'Travaux additionnels', 
          sqm: 50, 
          cascoPricePerSqm: 800, 
          parachevementPricePerSqm: 200 
          // amount = (50 * 800) + (50 * 200) = 50000
        }
      ]
    }
  };

  const defaultParticipants: Participant[] = [
    {
      name: 'Alice',
      quantity: 100,
      capitalApporte: 50000,
      registrationFeesRate: 15,
      tauxInteret: 4.5,
      dureeEmprunt: 20,
      parachevementsPerM2: 100,
      cascoPerM2: 1590
    },
    {
      name: 'Bob',
      quantity: 150,
      capitalApporte: 75000,
      registrationFeesRate: 15,
      tauxInteret: 4.5,
      dureeEmprunt: 20,
      parachevementsPerM2: 100,
      cascoPerM2: 1590
    }
  ];

  const defaultUnitDetails: UnitDetails = {};

  it('displays the full travaux communs total correctly', () => {
    const { container } = render(
      <ExpenseCategoriesManager
        expenseCategories={defaultExpenseCategories}
        projectParams={defaultProjectParams}
        sharedCosts={100000}
        onUpdateProjectParams={mockOnUpdateProjectParams}
        participants={defaultParticipants}
        unitDetails={defaultUnitDetails}
      />
    );

    // Calculate expected total: base (43700 + 269200 + 56000) + custom enabled (calculated from sqm and prices)
    // Item 1: (100 * 2000) + (100 * 700) = 270000
    // Item 2: (50 * 800) + (50 * 200) = 50000
    const expectedTotal = 43700 + 269200 + 56000 + 270000 + 50000;
    const formattedTotal = formatCurrency(expectedTotal);

    // Check if the total is displayed somewhere in the component
    expect(container.textContent).toContain(formattedTotal);
  });

  it('shows breakdown when expanded', async () => {
    const { container } = render(
      <ExpenseCategoriesManager
        expenseCategories={defaultExpenseCategories}
        projectParams={defaultProjectParams}
        sharedCosts={100000}
        onUpdateProjectParams={mockOnUpdateProjectParams}
        participants={defaultParticipants}
        unitDetails={defaultUnitDetails}
      />
    );

    // Click on the TRAVAUX COMMUNS button to expand
    const button = screen.getByText('TRAVAUX COMMUNS');
    fireEvent.click(button);

    // Check if custom items are displayed
    expect(screen.getByDisplayValue('Rénovation complète')).toBeDefined();
    expect(screen.getByDisplayValue('Travaux additionnels')).toBeDefined();
    
    // Check if sqm, casco price, and parachevement price fields are displayed
    expect(screen.getAllByLabelText('m²').length).toBeGreaterThan(0);
    expect(screen.getAllByLabelText('CASCO €/m²').length).toBeGreaterThan(0);
    expect(screen.getAllByLabelText('Parach. €/m²').length).toBeGreaterThan(0);

    // Check if the total summary is displayed
    expect(container.textContent).toContain('TOTAL Travaux Communs');

    // Check if per participant amount is shown (still includes base amounts in calculation)
    const perParticipantAmount = (43700 + 269200 + 56000 + 270000 + 50000) / 2;
    expect(container.textContent).toContain(`Par participant: ${formatCurrency(perParticipantAmount)}`);
  });

  it('shows base travaux communs total when custom items are disabled', () => {
    const disabledProjectParams = {
      ...defaultProjectParams,
      travauxCommuns: {
        enabled: false,
        items: [{ 
          label: 'Rénovation complète', 
          sqm: 0, 
          cascoPricePerSqm: 0, 
          parachevementPricePerSqm: 0,
          amount: 270000 // Backward compatibility
        }]
      }
    };

    const { container } = render(
      <ExpenseCategoriesManager
        expenseCategories={defaultExpenseCategories}
        projectParams={disabledProjectParams}
        sharedCosts={100000}
        onUpdateProjectParams={mockOnUpdateProjectParams}
        participants={defaultParticipants}
        unitDetails={defaultUnitDetails}
      />
    );

    // When disabled, should only show base travaux communs (not custom items)
    const expectedTotal = 43700 + 269200 + 56000; // Only base amounts
    expect(container.textContent).toContain(formatCurrency(expectedTotal));
  });

  it('updates custom items correctly', () => {
    render(
      <ExpenseCategoriesManager
        expenseCategories={defaultExpenseCategories}
        projectParams={defaultProjectParams}
        sharedCosts={100000}
        onUpdateProjectParams={mockOnUpdateProjectParams}
        participants={defaultParticipants}
        unitDetails={defaultUnitDetails}
      />
    );

    // Expand the section
    const button = screen.getByText('TRAVAUX COMMUNS');
    fireEvent.click(button);

    // Find and change the first custom item's sqm
    const sqmInputs = screen.getAllByLabelText('m²') as HTMLInputElement[];
    const renovationSqmInput = sqmInputs[0];

    expect(renovationSqmInput).toBeDefined();
    fireEvent.change(renovationSqmInput, { target: { value: '120' } });

    // Verify the update function was called with the new sqm value
    expect(mockOnUpdateProjectParams).toHaveBeenCalledWith(
      expect.objectContaining({
        travauxCommuns: {
          enabled: true,
          items: expect.arrayContaining([
            expect.objectContaining({
              label: 'Rénovation complète',
              sqm: 120,
              cascoPricePerSqm: 2000,
              parachevementPricePerSqm: 700
            })
          ])
        }
      })
    );
  });
});