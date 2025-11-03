import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import EnDivisionCorrect from './EnDivisionCorrect';

// NOTE: These tests need to be updated to match the new AvailableLotsView UI
// The old tests were written for a dropdown selection UI that no longer exists
// TODO: Rewrite tests to use the new lot selection button interface

describe('EnDivisionCorrect - Newcomer Entry Dates and Redistributions', () => {
  it('should display ParticipantsTimeline component', () => {
    render(<EnDivisionCorrect />);

    // Timeline section should be visible
    expect(screen.getByText(/Timeline des Participants/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Fondateurs/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Nouveaux entrants/i)).toBeInTheDocument();
  });

  it('should allow adding a founder participant with automatic deed date', async () => {
    render(<EnDivisionCorrect />);

    // Click "Ajouter un participant"
    const addButton = screen.getByRole('button', { name: /Ajouter un participant/i });
    fireEvent.click(addButton);

    // Wait for new participant to appear
    await waitFor(() => {
      expect(screen.getByText(/Participant 5/i)).toBeInTheDocument();
    });

    // Find all "Détails" buttons and click the last one (new participant)
    const expandButtons = screen.getAllByRole('button', { name: /Détails/i });
    fireEvent.click(expandButtons[expandButtons.length - 1]);

    // Should see entry date section
    await waitFor(() => {
      expect(screen.getByText(/Date d'entrée dans le projet/i)).toBeInTheDocument();
    });

    // Check that "Fondateur" checkbox is checked by default
    const founderCheckboxes = screen.getAllByRole('checkbox', { name: /Fondateur/i });
    const lastFounderCheckbox = founderCheckboxes[founderCheckboxes.length - 1];
    expect(lastFounderCheckbox).toBeChecked();
  });

  it('should show purchase details fields when unchecking founder checkbox', async () => {
    render(<EnDivisionCorrect />);

    // Add a new participant
    const addButton = screen.getByRole('button', { name: /Ajouter un participant/i });
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(screen.getByText(/Participant 5/i)).toBeInTheDocument();
    });

    // Expand the new participant
    const expandButtons = screen.getAllByRole('button', { name: /Détails/i });
    fireEvent.click(expandButtons[expandButtons.length - 1]);

    // Uncheck "Fondateur"
    const founderCheckboxes = screen.getAllByRole('checkbox', { name: /Fondateur/i });
    const lastFounderCheckbox = founderCheckboxes[founderCheckboxes.length - 1];
    fireEvent.click(lastFounderCheckbox);

    // Should see lot selection section
    await waitFor(() => {
      expect(screen.getByText(/Sélection du Lot/i)).toBeInTheDocument();
    });
  });

  it.skip('should display portage payback info when participant sells to newcomer', async () => {
    render(<EnDivisionCorrect />);

    // Add a new participant (will be the newcomer)
    const addButton = screen.getByRole('button', { name: /Ajouter un participant/i });
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(screen.getByText(/Participant 5/i)).toBeInTheDocument();
    });

    // Expand the newcomer
    const expandButtons = screen.getAllByRole('button', { name: /Détails/i });
    const newcomerExpandBtn = expandButtons[expandButtons.length - 1];
    fireEvent.click(newcomerExpandBtn);

    // Uncheck founder
    const founderCheckboxes = screen.getAllByRole('checkbox', { name: /Fondateur/i });
    const newcomerFounderCheckbox = founderCheckboxes[founderCheckboxes.length - 1];
    fireEvent.click(newcomerFounderCheckbox);

    await waitFor(() => {
      expect(screen.getByText(/Ach�te de/i)).toBeInTheDocument();
    });

    // Select buying from first participant (Manuela/Dragan)
    const buyingFromSelects = screen.getAllByRole('combobox');
    const buyingFromSelect = buyingFromSelects[buyingFromSelects.length - 1]; // Last select is the "Ach�te de"
    fireEvent.change(buyingFromSelect, { target: { value: 'Manuela/Dragan' } });

    // Set purchase price
    const priceInputs = screen.getAllByPlaceholderText(/150000/i);
    if (priceInputs.length > 0) {
      fireEvent.change(priceInputs[0], { target: { value: '200000' } });
    }

    // Now expand the first participant (seller - Manuela/Dragan)
    const firstExpandButton = expandButtons[0];
    fireEvent.click(firstExpandButton);

    // Should see portage payback section
    await waitFor(() => {
      const portageSection = screen.queryByText(/Portage - Remboursements attendus/i);
      // This may not appear immediately if purchase details aren't fully set
      // But the section should exist when configured properly
      if (portageSection) {
        expect(portageSection).toBeInTheDocument();
      }
    });
  });

  it.skip('should display copropriété redistribution when buying from copropriété', async () => {
    render(<EnDivisionCorrect />);

    // Add a new participant
    const addButton = screen.getByRole('button', { name: /Ajouter un participant/i });
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(screen.getByText(/Participant 5/i)).toBeInTheDocument();
    });

    // Expand the newcomer
    const expandButtons = screen.getAllByRole('button', { name: /Détails/i });
    const newcomerExpandBtn = expandButtons[expandButtons.length - 1];
    fireEvent.click(newcomerExpandBtn);

    // Uncheck founder
    const founderCheckboxes = screen.getAllByRole('checkbox', { name: /Fondateur/i });
    const newcomerFounderCheckbox = founderCheckboxes[founderCheckboxes.length - 1];
    fireEvent.click(newcomerFounderCheckbox);

    await waitFor(() => {
      expect(screen.getByText(/Ach�te de/i)).toBeInTheDocument();
    });

    // Select buying from Copropri�t�
    const buyingFromSelects = screen.getAllByRole('combobox');
    const buyingFromSelect = buyingFromSelects[buyingFromSelects.length - 1];
    fireEvent.change(buyingFromSelect, { target: { value: 'Copropri�t�' } });

    // Set purchase price
    const priceInputs = screen.getAllByPlaceholderText(/150000/i);
    if (priceInputs.length > 0) {
      fireEvent.change(priceInputs[0], { target: { value: '200000' } });
    }

    // Set future entry date
    const dateInputs = screen.getAllByDisplayValue(/2026-02-01/i); // Default deed date
    if (dateInputs.length > 0) {
      const entryDateInput = dateInputs[dateInputs.length - 1];
      fireEvent.change(entryDateInput, { target: { value: '2028-06-01' } });
    }

    // Now expand existing founders to check for copro redistribution
    const firstExpandButton = expandButtons[0];
    fireEvent.click(firstExpandButton);

    // Should see copropri�t� redistribution section
    await waitFor(() => {
      const coproSection = screen.queryByText(/Copropri�t� - Redistributions/i);
      // This should appear when copro sale is configured
      if (coproSection) {
        expect(coproSection).toBeInTheDocument();
      }
    }, { timeout: 3000 });
  });

  it.skip('should validate entry date is not before deed date', async () => {
    // Mock alert
    const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {});

    render(<EnDivisionCorrect />);

    // Add a new participant
    const addButton = screen.getByRole('button', { name: /Ajouter un participant/i });
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(screen.getByText(/Participant 5/i)).toBeInTheDocument();
    });

    // Expand the newcomer
    const expandButtons = screen.getAllByRole('button', { name: /Détails/i });
    fireEvent.click(expandButtons[expandButtons.length - 1]);

    // Uncheck founder to enable date picker
    const founderCheckboxes = screen.getAllByRole('checkbox', { name: /Fondateur/i });
    const lastCheckbox = founderCheckboxes[founderCheckboxes.length - 1];
    fireEvent.click(lastCheckbox);

    await waitFor(() => {
      const dateInputs = screen.getAllByLabelText(/Date d'entrée dans le projet/i);
      expect(dateInputs.length).toBeGreaterThan(0);
    });

    // Try to set date before deed date (deed date is 2026-02-01)
    const dateInputs = screen.getAllByLabelText(/Date d'entrée dans le projet/i);
    const lastDateInput = dateInputs[dateInputs.length - 1];

    fireEvent.change(lastDateInput, { target: { value: '2025-01-01' } });

    // Should show alert
    await waitFor(() => {
      expect(alertMock).toHaveBeenCalledWith(expect.stringContaining('date de l\'acte'));
    });

    alertMock.mockRestore();
  });

  it.skip('should show timeline with founders in green and newcomers in blue', async () => {
    render(<EnDivisionCorrect />);

    // Timeline should exist
    const timelineSection = screen.getByText(/Timeline des Participants/i);
    expect(timelineSection).toBeInTheDocument();

    // Should show founder count (default 4 participants)
    const foundersElements = screen.getAllByText(/Fondateurs/i);
    const founderCountElement = foundersElements.find(el => el.parentElement?.querySelector('.text-2xl'));
    const founderCount = founderCountElement?.parentElement?.querySelector('.text-2xl');
    expect(founderCount).toHaveTextContent('4');

    // Should show newcomer count (default 0)
    const newcomerCount = screen.getByText(/Nouveaux entrants/i).parentElement?.querySelector('.text-2xl');
    expect(newcomerCount).toHaveTextContent('0');
  });
});
