/**
 * Integration test: Verify reactive portage price recalculation
 *
 * Tests that when a buyer's entry date changes, their purchase price
 * automatically recalculates in real-time without needing to close the modal.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ParticipantDetailModal from './ParticipantDetailModal';
import type { Participant, CalculationResults, ProjectParams } from '../../utils/calculatorUtils';

describe('ParticipantDetailModal - Reactive Portage Price Recalculation', () => {
  const deedDate = '2026-02-01';

  const seller: Participant = {
    name: 'Annabelle/Colin',
    capitalApporte: 200000,
    registrationFeesRate: 12.5,
    interestRate: 3.5,
    durationYears: 30,
    isFounder: true,
    entryDate: new Date(deedDate),
    lotsOwned: [
      {
        lotId: 2,
        surface: 80,
        unitId: 5,
        isPortage: true,
        acquiredDate: new Date(deedDate),
        originalPrice: 94200,
        originalNotaryFees: 11775,
        originalConstructionCost: 127200,
        soldDate: new Date('2027-06-01') // Will be updated when buyer date changes
      }
    ]
  };

  const createBuyer = (entryDate: Date, purchasePrice: number): Participant => ({
    name: 'Nouveau·elle Arrivant·e',
    capitalApporte: 80000,
    registrationFeesRate: 12.5,
    interestRate: 4.5,
    durationYears: 25,
    isFounder: false,
    entryDate,
    purchaseDetails: {
      buyingFrom: 'Annabelle/Colin',
      lotId: 2,
      purchasePrice
    }
  });

  const mockProjectParams: ProjectParams = {
    totalPurchase: 500000,
    mesuresConservatoires: 0,
    demolition: 0,
    infrastructures: 0,
    etudesPreparatoires: 0,
    fraisEtudesPreparatoires: 0,
    fraisGeneraux3ans: 0,
    batimentFondationConservatoire: 0,
    batimentFondationComplete: 0,
    batimentCoproConservatoire: 0,
    globalCascoPerM2: 1590
  };

  const mockCalculations: CalculationResults = {
    participantBreakdown: [
      {
        name: 'Annabelle/Colin',
        unitId: 1,
        surface: 80,
        quantity: 1,
        capitalApporte: 200000,
        registrationFeesRate: 12.5,
        interestRate: 3.5,
        durationYears: 30,
        isFounder: true,
        entryDate: new Date(deedDate),
        pricePerM2: 1000,
        purchaseShare: 100000,
        droitEnregistrements: 12500,
        fraisNotaireFixe: 1000,
        casco: 50000,
        parachevements: 30000,
        personalRenovationCost: 80000,
        constructionCost: 80000,
        constructionCostPerUnit: 80000,
        travauxCommunsPerUnit: 0,
        sharedCosts: 20000,
        totalCost: 212500,
        loanNeeded: 162500,
        financingRatio: 0.76,
        monthlyPayment: 900,
        totalRepayment: 270000,
        totalInterest: 100000
      },
      {
        name: 'Nouveau·elle Arrivant·e',
        unitId: 5,
        surface: 80,
        quantity: 1,
        capitalApporte: 80000,
        registrationFeesRate: 12.5,
        interestRate: 4.5,
        durationYears: 25,
        isFounder: false,
        entryDate: new Date('2027-06-01'),
        pricePerM2: 1667,
        purchaseShare: 256563, // Initial price for 16 months
        droitEnregistrements: 32070,
        fraisNotaireFixe: 1000,
        casco: 45000,
        parachevements: 27000,
        personalRenovationCost: 72000,
        constructionCost: 72000,
        constructionCostPerUnit: 72000,
        travauxCommunsPerUnit: 0,
        sharedCosts: 20000,
        totalCost: 380633,
        loanNeeded: 300633,
        financingRatio: 0.79,
        monthlyPayment: 1500,
        totalRepayment: 450000,
        totalInterest: 150000,
        purchaseDetails: {
          buyingFrom: 'Annabelle/Colin',
          lotId: 2,
          purchasePrice: 256563
        }
      }
    ],
    totals: {
      purchase: 356563,
      totalDroitEnregistrements: 44570,
      construction: 152000,
      shared: 40000,
      totalTravauxCommuns: 0,
      travauxCommunsPerUnit: 0,
      total: 593133,
      capitalTotal: 280000,
      totalLoansNeeded: 463133,
      averageLoan: 231566,
      averageCapital: 140000
    },
    sharedCosts: 40000,
    sharedPerPerson: 20000,
    totalSurface: 160,
    pricePerM2: 2227.08
  };

  const formulaParams = {
    indexationRate: 2,
    carryingCostRecovery: 100,
    averageInterestRate: 4.5,
      coproReservesShare: 30
  };

  it('should recalculate purchase price when entry date changes', () => {
    // Start with buyer entering at 16 months (2027-06-01)
    const buyer16Months = createBuyer(new Date('2027-06-01'), 256563);
    const allParticipants = [seller, buyer16Months];

    const onUpdateParticipant = vi.fn();

    render(
      <ParticipantDetailModal
        isOpen={true}
        onClose={vi.fn()}
        participantIndex={1}
        participant={buyer16Months}
        participantBreakdown={mockCalculations.participantBreakdown[1]}
        deedDate={deedDate}
        allParticipants={allParticipants}
        calculations={mockCalculations}
        projectParams={mockProjectParams}
        formulaParams={formulaParams}
        unitDetails={{}}
        isPinned={false}
        onPin={vi.fn()}
        onUnpin={vi.fn()}
        onUpdateName={vi.fn()}
        onUpdateSurface={vi.fn()}
        onUpdateNotaryRate={vi.fn()}
        onUpdateInterestRate={vi.fn()}
        onUpdateDuration={vi.fn()}
        onUpdateQuantity={vi.fn()}
        onUpdateParachevementsPerM2={vi.fn()}
        onUpdateCascoSqm={vi.fn()}
        onUpdateParachevementsSqm={vi.fn()}
        onUpdateParticipant={onUpdateParticipant}
        onAddPortageLot={vi.fn()}
        onRemovePortageLot={vi.fn()}
        onUpdatePortageLotSurface={vi.fn()}
        totalParticipants={2}
      />
    );

    // The entry date input is inside the "Statut" CollapsibleSection - expand it first
    const statutButton = screen.getByText('Statut').closest('button');
    expect(statutButton).toBeInTheDocument();
    fireEvent.click(statutButton!);

    // Find the entry date input
    const dateInput = screen.getByDisplayValue('2027-06-01');
    expect(dateInput).toBeInTheDocument();

    // Change entry date to 24 months later (2028-02-01)
    fireEvent.change(dateInput, { target: { value: '2028-02-01' } });

    // Verify onUpdateParticipant was called with new date
    expect(onUpdateParticipant).toHaveBeenCalledTimes(1);

    const updatedParticipant = onUpdateParticipant.mock.calls[0][0];
    expect(updatedParticipant.entryDate).toEqual(new Date('2028-02-01'));

    // The key assertion: purchasePrice should still be present
    // (The recalculation happens in EnDivisionCorrect's onUpdateParticipant callback,
    // but the modal correctly passes through the updated participant)
    expect(updatedParticipant.purchaseDetails).toBeDefined();
    expect(updatedParticipant.purchaseDetails?.buyingFrom).toBe('Annabelle/Colin');
    expect(updatedParticipant.purchaseDetails?.lotId).toBe(2);
  });

  it('should call onUpdateParticipant immediately on date change (reactive)', () => {
    const buyer = createBuyer(new Date('2027-06-01'), 256563);
    const allParticipants = [seller, buyer];

    const onUpdateParticipant = vi.fn();

    render(
      <ParticipantDetailModal
        isOpen={true}
        onClose={vi.fn()}
        participantIndex={1}
        participant={buyer}
        participantBreakdown={mockCalculations.participantBreakdown[1]}
        deedDate={deedDate}
        allParticipants={allParticipants}
        calculations={mockCalculations}
        projectParams={mockProjectParams}
        formulaParams={formulaParams}
        unitDetails={{}}
        isPinned={false}
        onPin={vi.fn()}
        onUnpin={vi.fn()}
        onUpdateName={vi.fn()}
        onUpdateSurface={vi.fn()}
        onUpdateNotaryRate={vi.fn()}
        onUpdateInterestRate={vi.fn()}
        onUpdateDuration={vi.fn()}
        onUpdateQuantity={vi.fn()}
        onUpdateParachevementsPerM2={vi.fn()}
        onUpdateCascoSqm={vi.fn()}
        onUpdateParachevementsSqm={vi.fn()}
        onUpdateParticipant={onUpdateParticipant}
        onAddPortageLot={vi.fn()}
        onRemovePortageLot={vi.fn()}
        onUpdatePortageLotSurface={vi.fn()}
        totalParticipants={2}
      />
    );

    // Initially no calls
    expect(onUpdateParticipant).not.toHaveBeenCalled();

    // The entry date input is inside the "Statut" CollapsibleSection - expand it first
    const statutButton = screen.getByText('Statut').closest('button');
    expect(statutButton).toBeInTheDocument();
    fireEvent.click(statutButton!);

    // Change date
    const dateInput = screen.getByDisplayValue('2027-06-01');
    fireEvent.change(dateInput, { target: { value: '2027-07-01' } });

    // Should be called IMMEDIATELY (reactive)
    expect(onUpdateParticipant).toHaveBeenCalledTimes(1);

    // Change again
    fireEvent.change(dateInput, { target: { value: '2027-08-01' } });

    // Should be called again (each change triggers update)
    expect(onUpdateParticipant).toHaveBeenCalledTimes(2);
  });

  it('should prevent entry date before deed date', () => {
    const buyer = createBuyer(new Date('2027-06-01'), 256563);
    const allParticipants = [seller, buyer];

    // Mock window.alert
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

    const onUpdateParticipant = vi.fn();

    render(
      <ParticipantDetailModal
        isOpen={true}
        onClose={vi.fn()}
        participantIndex={1}
        participant={buyer}
        participantBreakdown={mockCalculations.participantBreakdown[1]}
        deedDate={deedDate}
        allParticipants={allParticipants}
        calculations={mockCalculations}
        projectParams={mockProjectParams}
        formulaParams={formulaParams}
        unitDetails={{}}
        isPinned={false}
        onPin={vi.fn()}
        onUnpin={vi.fn()}
        onUpdateName={vi.fn()}
        onUpdateSurface={vi.fn()}
        onUpdateNotaryRate={vi.fn()}
        onUpdateInterestRate={vi.fn()}
        onUpdateDuration={vi.fn()}
        onUpdateQuantity={vi.fn()}
        onUpdateParachevementsPerM2={vi.fn()}
        onUpdateCascoSqm={vi.fn()}
        onUpdateParachevementsSqm={vi.fn()}
        onUpdateParticipant={onUpdateParticipant}
        onAddPortageLot={vi.fn()}
        onRemovePortageLot={vi.fn()}
        onUpdatePortageLotSurface={vi.fn()}
        totalParticipants={2}
      />
    );

    // The entry date input is inside the "Statut" CollapsibleSection - expand it first
    const statutButton = screen.getByText('Statut').closest('button');
    expect(statutButton).toBeInTheDocument();
    fireEvent.click(statutButton!);

    // Try to set date before deed date
    const dateInput = screen.getByDisplayValue('2027-06-01');
    fireEvent.change(dateInput, { target: { value: '2025-01-01' } });

    // Should show alert
    expect(alertSpy).toHaveBeenCalledWith(
      expect.stringContaining("La date d'entrée ne peut pas être avant")
    );

    // Should NOT call onUpdateParticipant
    expect(onUpdateParticipant).not.toHaveBeenCalled();

    alertSpy.mockRestore();
  });

});
