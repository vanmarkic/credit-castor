import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ParticipantDetailsPanel } from './ParticipantDetailsPanel';
import ParticipantDetailModal from './ParticipantDetailModal';
import { calculateCoproSalePrice } from '../../utils/portageCalculations';
import type { Participant, ParticipantCalculation, CalculationResults, ProjectParams, UnitDetails } from '../../utils/calculatorUtils';
import { UnlockProvider } from '../../contexts/UnlockContext';
import * as Tooltip from '@radix-ui/react-tooltip';

describe('Copro Redistribution Display - Main View and Detail Modal', () => {
  beforeEach(() => {
    localStorage.clear();
    const unlockState = {
      isUnlocked: true,
      unlockedBy: 'test@example.com',
      unlockedAt: new Date().toISOString(),
    };
    localStorage.setItem('credit-castor-unlock-state', JSON.stringify(unlockState));
  });

  const deedDate = '2026-01-01';
  const renovationStartDate = new Date('2026-06-01'); // Renovation starts June 1st
  const coproReservesShare = 30;

  const formulaParams = {
    indexationRate: 2,
    carryingCostRecovery: 100,
    averageInterestRate: 4.5,
    coproReservesShare: 30
  };

  const mockProjectParams: ProjectParams = {
    totalPurchase: 400000, // Base purchase (without renovation)
    mesuresConservatoires: 0,
    demolition: 0,
    infrastructures: 0,
    etudesPreparatoires: 0,
    fraisEtudesPreparatoires: 0,
    fraisGeneraux3ans: 0,
    batimentFondationConservatoire: 0,
    batimentFondationComplete: 0,
    batimentCoproConservatoire: 0,
    globalCascoPerM2: 1590,
    renovationStartDate: renovationStartDate.toISOString().split('T')[0]
  };

  const mockUnitDetails: UnitDetails = {
    1: { casco: 0, parachevements: 0 }
  };

  const mockCalculations: CalculationResults = {
    totalSurface: 250, // 200 founder + 50 newcomer
    pricePerM2: 1600,
    sharedCosts: 0,
    sharedPerPerson: 0,
    participantBreakdown: [],
    totals: {
      purchase: 400000,
      totalDroitEnregistrements: 0,
      construction: 0,
      shared: 0,
      totalTravauxCommuns: 0,
      travauxCommunsPerUnit: 0,
      total: 400000,
      capitalTotal: 0,
      totalLoansNeeded: 0,
      averageLoan: 0,
      averageCapital: 0
    }
  };

  // Helper to calculate copro sale price
  const calculateCoproSalePriceForTest = (
    saleDate: Date,
    totalProjectCost: number,
    totalRenovationCosts: number
  ) => {
    const totalBuildingSurface = 500; // m²
    const surfacePurchased = 50; // m² (10% of building)
    const yearsHeld = 0; // Same year
    const totalCarryingCosts = 0; // No carrying costs for simplicity

    return calculateCoproSalePrice(
      surfacePurchased,
      totalProjectCost,
      totalBuildingSurface,
      yearsHeld,
      formulaParams,
      totalCarryingCosts,
      renovationStartDate,
      saleDate,
      totalRenovationCosts
    );
  };

  it('should display correct redistribution in ParticipantDetailsPanel when copro sale happens BEFORE renovationStartDate', () => {
    // Setup founder
    const founder: Participant = {
      name: 'Founder Alice',
      capitalApporte: 150000,
      registrationFeesRate: 12.5,
      interestRate: 4.5,
      durationYears: 25,
      isFounder: true,
      entryDate: new Date(deedDate),
      surface: 200,
      quantity: 1,
      unitId: 1,
      lotsOwned: [
        {
          lotId: 1,
          surface: 200,
          unitId: 1,
          isPortage: false,
          allocatedSurface: 200,
          acquiredDate: new Date(deedDate)
        }
      ]
    };

    // Newcomer buys BEFORE renovationStartDate
    const saleDate = new Date('2026-03-01');
    const totalProjectCost = 500000; // Including renovation
    const totalRenovationCosts = 100000; // CASCO + parachèvements

    const coproSalePricing = calculateCoproSalePriceForTest(
      saleDate,
      totalProjectCost,
      totalRenovationCosts
    );

    // Verify base price excludes renovation
    expect(coproSalePricing.basePrice).toBeCloseTo((400000 / 500) * 50, 0); // 40000, not 50000

    const participantsShare = 1 - (coproReservesShare / 100);
    const amountToParticipants = coproSalePricing.totalPrice * participantsShare;
    const expectedRedistribution = amountToParticipants; // 100% for single founder

    const newcomer: Participant = {
      name: 'Newcomer Bob',
      capitalApporte: 50000,
      registrationFeesRate: 3,
      interestRate: 4.5,
      durationYears: 25,
      isFounder: false,
      entryDate: saleDate,
      surface: 50,
      quantity: 1,
      unitId: 1,
      purchaseDetails: {
        buyingFrom: 'Copropriété',
        purchasePrice: coproSalePricing.totalPrice,
        lotId: undefined
      },
      lotsOwned: []
    };

    const founderCalc: ParticipantCalculation = {
      ...founder,
      quantity: 1,
      pricePerM2: 1600,
      purchaseShare: 320000,
      droitEnregistrements: 40000,
      fraisNotaireFixe: 5000,
      casco: 0,
      parachevements: 0,
      personalRenovationCost: 0,
      constructionCost: 0,
      constructionCostPerUnit: 0,
      travauxCommunsPerUnit: 0,
      sharedCosts: 0,
      totalCost: 365000,
      loanNeeded: 215000,
      financingRatio: 59,
      monthlyPayment: 1200,
      totalRepayment: 360000,
      totalInterest: 145000
    };

    const allParticipants = [founder, newcomer];

    // Render ParticipantDetailsPanel
    render(
      <UnlockProvider>
        <Tooltip.Provider>
          <ParticipantDetailsPanel
            participant={founder}
            participantCalc={founderCalc}
            participantIndex={0}
            allParticipants={allParticipants}
            calculations={mockCalculations}
            projectParams={mockProjectParams}
            deedDate={deedDate}
            formulaParams={formulaParams}
            pinnedParticipant={null}
            onPinParticipant={() => {}}
            onUnpinParticipant={() => {}}
            onUpdateParticipant={() => {}}
            onUpdateParticipantSurface={() => {}}
            onUpdateCapital={() => {}}
            onUpdateNotaryRate={() => {}}
            onUpdateQuantity={() => {}}
            onUpdateParachevementsPerM2={() => {}}
            onUpdateCascoSqm={() => {}}
            onUpdateParachevementsSqm={() => {}}
            onUpdateInterestRate={() => {}}
            onUpdateDuration={() => {}}
            onAddPortageLot={() => {}}
            onRemovePortageLot={() => {}}
            onUpdatePortageLotSurface={() => {}}
          />
        </Tooltip.Provider>
      </UnlockProvider>
    );

    // Verify the card is displayed
    expect(screen.getByText(/Remboursements attendus/i)).toBeInTheDocument();
    expect(screen.getByText('Newcomer Bob')).toBeInTheDocument();

    // Verify the amount is correct (should exclude renovation costs)
    const amountValue = expectedRedistribution.toLocaleString('fr-BE', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
    const expectedNumber = amountValue.replace(/\s/g, '');
    
    // Find the payback card
    const paybackSection = screen.getByText('Newcomer Bob').closest('div')?.parentElement?.parentElement;
    const paybackText = paybackSection?.textContent || '';
    const paybackNumber = paybackText.replace(/[\s\u00a0\u202f€]/g, '');
    expect(paybackNumber).toContain(expectedNumber);

    // Verify total recovered
    expect(screen.getByText(/Total récupéré/i)).toBeInTheDocument();
  });

  it('should display correct redistribution in ParticipantDetailModal when copro sale happens BEFORE renovationStartDate', () => {
    // Same setup as above
    const founder: Participant = {
      name: 'Founder Alice',
      capitalApporte: 150000,
      registrationFeesRate: 12.5,
      interestRate: 4.5,
      durationYears: 25,
      isFounder: true,
      entryDate: new Date(deedDate),
      surface: 200,
      quantity: 1,
      unitId: 1,
      lotsOwned: [
        {
          lotId: 1,
          surface: 200,
          unitId: 1,
          isPortage: false,
          allocatedSurface: 200,
          acquiredDate: new Date(deedDate)
        }
      ]
    };

    const saleDate = new Date('2026-03-01');
    const totalProjectCost = 500000;
    const totalRenovationCosts = 100000;

    const coproSalePricing = calculateCoproSalePriceForTest(
      saleDate,
      totalProjectCost,
      totalRenovationCosts
    );

    const participantsShare = 1 - (coproReservesShare / 100);
    const amountToParticipants = coproSalePricing.totalPrice * participantsShare;
    const expectedRedistribution = amountToParticipants;

    const newcomer: Participant = {
      name: 'Newcomer Bob',
      capitalApporte: 50000,
      registrationFeesRate: 3,
      interestRate: 4.5,
      durationYears: 25,
      isFounder: false,
      entryDate: saleDate,
      surface: 50,
      quantity: 1,
      unitId: 1,
      purchaseDetails: {
        buyingFrom: 'Copropriété',
        purchasePrice: coproSalePricing.totalPrice,
        lotId: undefined
      },
      lotsOwned: []
    };

    const founderCalc: ParticipantCalculation = {
      ...founder,
      quantity: 1,
      pricePerM2: 1600,
      purchaseShare: 320000,
      droitEnregistrements: 40000,
      fraisNotaireFixe: 5000,
      casco: 0,
      parachevements: 0,
      personalRenovationCost: 0,
      constructionCost: 0,
      constructionCostPerUnit: 0,
      travauxCommunsPerUnit: 0,
      sharedCosts: 0,
      totalCost: 365000,
      loanNeeded: 215000,
      financingRatio: 59,
      monthlyPayment: 1200,
      totalRepayment: 360000,
      totalInterest: 145000
    };

    const allParticipants = [founder, newcomer];

    // Render ParticipantDetailModal
    render(
      <Tooltip.Provider>
        <ParticipantDetailModal
          isOpen={true}
          onClose={() => {}}
          participantIndex={0}
          participant={founder}
          participantBreakdown={founderCalc}
          deedDate={deedDate}
          allParticipants={allParticipants}
          calculations={mockCalculations}
          projectParams={mockProjectParams}
          unitDetails={mockUnitDetails}
          formulaParams={formulaParams}
          isPinned={false}
          onPin={() => {}}
          onUnpin={() => {}}
          onUpdateName={() => {}}
          onUpdateSurface={() => {}}
          onUpdateCapital={() => {}}
          onUpdateNotaryRate={() => {}}
          onUpdateInterestRate={() => {}}
          onUpdateDuration={() => {}}
          onUpdateQuantity={() => {}}
          onUpdateParachevementsPerM2={() => {}}
          onUpdateCascoSqm={() => {}}
          onUpdateParachevementsSqm={() => {}}
          onUpdateParticipant={() => {}}
          onAddPortageLot={() => {}}
          onRemovePortageLot={() => {}}
          onUpdatePortageLotSurface={() => {}}
          onUpdatePortageLotConstructionPayment={() => {}}
          onRemove={() => {}}
          totalParticipants={2}
        />
      </Tooltip.Provider>
    );

    // Verify the card is displayed in the modal
    expect(screen.getByText(/Remboursements attendus/i)).toBeInTheDocument();
    expect(screen.getByText('Newcomer Bob')).toBeInTheDocument();

    // Verify the amount is correct (should exclude renovation costs)
    const amountValue = expectedRedistribution.toLocaleString('fr-BE', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
    const expectedNumber = amountValue.replace(/\s/g, '');
    
    // Find the payback card
    const paybackSection = screen.getByText('Newcomer Bob').closest('div')?.parentElement?.parentElement;
    const paybackText = paybackSection?.textContent || '';
    const paybackNumber = paybackText.replace(/[\s\u00a0\u202f€]/g, '');
    expect(paybackNumber).toContain(expectedNumber);

    // Verify total recovered
    expect(screen.getByText(/Total récupéré/i)).toBeInTheDocument();
  });

  it('should display different amounts in both views when comparing BEFORE vs AFTER renovationStartDate', () => {
    // Test that the amounts differ between before/after renovationStartDate
    const founder: Participant = {
      name: 'Founder Alice',
      capitalApporte: 150000,
      registrationFeesRate: 12.5,
      interestRate: 4.5,
      durationYears: 25,
      isFounder: true,
      entryDate: new Date(deedDate),
      surface: 200,
      quantity: 1,
      unitId: 1,
      lotsOwned: [
        {
          lotId: 1,
          surface: 200,
          unitId: 1,
          isPortage: false,
          allocatedSurface: 200,
          acquiredDate: new Date(deedDate)
        }
      ]
    };

    const totalProjectCost = 500000;
    const totalRenovationCosts = 100000;

    // Before renovation
    const saleDateBefore = new Date('2026-03-01');
    const coproSalePricingBefore = calculateCoproSalePriceForTest(
      saleDateBefore,
      totalProjectCost,
      totalRenovationCosts
    );

    // After renovation
    const saleDateAfter = new Date('2026-07-01');
    const coproSalePricingAfter = calculateCoproSalePriceForTest(
      saleDateAfter,
      totalProjectCost,
      totalRenovationCosts
    );

    // Verify they have different base prices
    expect(coproSalePricingBefore.basePrice).toBeLessThan(coproSalePricingAfter.basePrice);

    // Calculate redistributions
    const participantsShare = 1 - (coproReservesShare / 100);
    const redistributionBefore = coproSalePricingBefore.totalPrice * participantsShare;
    const redistributionAfter = coproSalePricingAfter.totalPrice * participantsShare;

    // Redistribution after should be higher (includes renovation)
    expect(redistributionAfter).toBeGreaterThan(redistributionBefore);

    const newcomer1: Participant = {
      name: 'Newcomer Before',
      capitalApporte: 50000,
      registrationFeesRate: 3,
      interestRate: 4.5,
      durationYears: 25,
      isFounder: false,
      entryDate: saleDateBefore,
      surface: 50,
      quantity: 1,
      unitId: 1,
      purchaseDetails: {
        buyingFrom: 'Copropriété',
        purchasePrice: coproSalePricingBefore.totalPrice,
        lotId: undefined
      },
      lotsOwned: []
    };

    const newcomer2: Participant = {
      name: 'Newcomer After',
      capitalApporte: 50000,
      registrationFeesRate: 3,
      interestRate: 4.5,
      durationYears: 25,
      isFounder: false,
      entryDate: saleDateAfter,
      surface: 50,
      quantity: 1,
      unitId: 1,
      purchaseDetails: {
        buyingFrom: 'Copropriété',
        purchasePrice: coproSalePricingAfter.totalPrice,
        lotId: undefined
      },
      lotsOwned: []
    };

    const founderCalc: ParticipantCalculation = {
      ...founder,
      quantity: 1,
      pricePerM2: 1600,
      purchaseShare: 320000,
      droitEnregistrements: 40000,
      fraisNotaireFixe: 5000,
      casco: 0,
      parachevements: 0,
      personalRenovationCost: 0,
      constructionCost: 0,
      constructionCostPerUnit: 0,
      travauxCommunsPerUnit: 0,
      sharedCosts: 0,
      totalCost: 365000,
      loanNeeded: 215000,
      financingRatio: 59,
      monthlyPayment: 1200,
      totalRepayment: 360000,
      totalInterest: 145000
    };

    const allParticipants = [founder, newcomer1, newcomer2];

    // Render ParticipantDetailsPanel
    render(
      <UnlockProvider>
        <Tooltip.Provider>
          <ParticipantDetailsPanel
            participant={founder}
            participantCalc={founderCalc}
            participantIndex={0}
            allParticipants={allParticipants}
            calculations={mockCalculations}
            projectParams={mockProjectParams}
            deedDate={deedDate}
            formulaParams={formulaParams}
            pinnedParticipant={null}
            onPinParticipant={() => {}}
            onUnpinParticipant={() => {}}
            onUpdateParticipant={() => {}}
            onUpdateParticipantSurface={() => {}}
            onUpdateCapital={() => {}}
            onUpdateNotaryRate={() => {}}
            onUpdateQuantity={() => {}}
            onUpdateParachevementsPerM2={() => {}}
            onUpdateCascoSqm={() => {}}
            onUpdateParachevementsSqm={() => {}}
            onUpdateInterestRate={() => {}}
            onUpdateDuration={() => {}}
            onAddPortageLot={() => {}}
            onRemovePortageLot={() => {}}
            onUpdatePortageLotSurface={() => {}}
          />
        </Tooltip.Provider>
      </UnlockProvider>
    );

    // Verify both newcomers appear
    expect(screen.getByText('Newcomer Before')).toBeInTheDocument();
    expect(screen.getByText('Newcomer After')).toBeInTheDocument();

    // Verify both amounts are displayed and "After" is higher than "Before"
    const amountBefore = redistributionBefore.toLocaleString('fr-BE', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).replace(/\s/g, '');
    const amountAfter = redistributionAfter.toLocaleString('fr-BE', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).replace(/\s/g, '');

    const beforeSection = screen.getByText('Newcomer Before').closest('div')?.parentElement?.parentElement;
    const beforeText = beforeSection?.textContent?.replace(/[\s\u00a0\u202f€]/g, '') || '';
    expect(beforeText).toContain(amountBefore);

    const afterSection = screen.getByText('Newcomer After').closest('div')?.parentElement?.parentElement;
    const afterText = afterSection?.textContent?.replace(/[\s\u00a0\u202f€]/g, '') || '';
    expect(afterText).toContain(amountAfter);

    // Total should be sum of both
    expect(screen.getByText(/Total récupéré/i)).toBeInTheDocument();
    const totalExpected = redistributionBefore + redistributionAfter;
    const totalValue = totalExpected.toLocaleString('fr-BE', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).replace(/\s/g, '');
    const totalSection = screen.getByText(/Total récupéré/i).closest('div');
    const totalText = totalSection?.textContent?.replace(/[\s\u00a0\u202f€]/g, '') || '';
    expect(totalText).toContain(totalValue);
  });
});



