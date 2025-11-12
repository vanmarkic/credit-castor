import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import * as Tooltip from '@radix-ui/react-tooltip';
import { ParticipantDetailsPanel } from './ParticipantDetailsPanel';
import { DEFAULT_PORTAGE_FORMULA } from '../../utils/calculatorUtils';
import type { Participant, ParticipantCalculation, CalculationResults, ProjectParams } from '../../utils/calculatorUtils';
import { UnlockProvider } from '../../contexts/UnlockContext';

describe('ParticipantDetailsPanel - Remboursements attendus', () => {
  beforeEach(() => {
    // Clear localStorage and set unlocked state for all tests
    localStorage.clear();
    const unlockState = {
      isUnlocked: true,
      unlockedBy: 'test@example.com',
      unlockedAt: new Date().toISOString(),
    };
    localStorage.setItem('credit-castor-unlock-state', JSON.stringify(unlockState));
  });

  const mockProjectParams: ProjectParams = {
    totalPurchase: 1000000,
    mesuresConservatoires: 10000,
    demolition: 20000,
    infrastructures: 50000,
    etudesPreparatoires: 5000,
    fraisEtudesPreparatoires: 3000,
    fraisGeneraux3ans: 50000,
    batimentFondationConservatoire: 43700,
    batimentFondationComplete: 269200,
    batimentCoproConservatoire: 56000,
    globalCascoPerM2: 1590
  };

  const mockCalculations: CalculationResults = {
    totalSurface: 1000,
    pricePerM2: 1000,
    sharedCosts: 138000,
    sharedPerPerson: 34500,
    participantBreakdown: [],
    totals: {
      purchase: 1000000,
      totalDroitEnregistrements: 50000,
      construction: 500000,
      shared: 138000,
      totalTravauxCommuns: 368900,
      travauxCommunsPerUnit: 92225,
      total: 1688000,
      capitalTotal: 400000,
      totalLoansNeeded: 1288000,
      averageLoan: 322000,
      averageCapital: 100000
    }
  };

  it('should display remboursements attendus when founder adds portage lot and newcomer buys', () => {
    // Founder with portage lot
    const founderParticipant: Participant = {
      name: 'Founder Alice',
      capitalApporte: 150000,
      notaryFeesRate: 12.5,
      interestRate: 4.5,
      durationYears: 25,
      isFounder: true,
      entryDate: new Date('2026-02-01'),
      unitId: 1,
      surface: 300, // 200 original + 100 portage
      quantity: 2,
      lotsOwned: [
        {
          lotId: 1,
          surface: 200,
          unitId: 1,
          isPortage: false,
          allocatedSurface: 200,
          acquiredDate: new Date('2026-02-01')
        },
        {
          lotId: 2,
          surface: 100,
          unitId: 1,
          isPortage: true,
          allocatedSurface: 100,
          acquiredDate: new Date('2026-02-01')
        }
      ]
    };

    // Newcomer buying the portage lot
    const newcomerParticipant: Participant = {
      name: 'Newcomer Bob',
      capitalApporte: 50000,
      notaryFeesRate: 3,
      interestRate: 4.5,
      durationYears: 25,
      isFounder: false,
      entryDate: new Date('2027-02-01'),
      unitId: 1,
      surface: 100,
      quantity: 1,
      purchaseDetails: {
        buyingFrom: 'Founder Alice',
        lotId: 2,
        purchasePrice: 150000
      }
    };

    const founderCalc: ParticipantCalculation = {
      ...founderParticipant,
      pricePerM2: 1000,
      purchaseShare: 300000,
      droitEnregistrements: 37500,
      fraisNotaireFixe: 2000, // 2 lots * 1000€
      casco: 477000,
      parachevements: 150000,
      personalRenovationCost: 627000,
      constructionCost: 811450,
      constructionCostPerUnit: 405725,
      travauxCommunsPerUnit: 92225,
      sharedCosts: 34500,
      totalCost: 1182950,
      loanNeeded: 1032950,
      financingRatio: 87.3,
      monthlyPayment: 5700,
      totalRepayment: 1710000,
      totalInterest: 677050
    };

    const allParticipants = [founderParticipant, newcomerParticipant];

    render(
      <UnlockProvider>
        <Tooltip.Provider>
        <ParticipantDetailsPanel
        participant={founderParticipant}
        participantCalc={founderCalc}
        participantIndex={0}
        allParticipants={allParticipants}
        calculations={mockCalculations}
        projectParams={mockProjectParams}
        deedDate="2026-02-01"
        formulaParams={DEFAULT_PORTAGE_FORMULA}
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

    // Should show "Remboursements attendus" section
    expect(screen.getByText(/💰 Remboursements attendus/i)).toBeInTheDocument();

    // Should show the newcomer's name
    expect(screen.getByText('Newcomer Bob')).toBeInTheDocument();

    // Should show the purchase price (€150,000) in the purple section
    const purpleSection = screen.getByText(/💰 Remboursements attendus/i).closest('div');
    expect(purpleSection).toBeInTheDocument();

    // Check that the total shows €150,000
    const totalRecupereText = screen.getByText(/Total récupéré/i);
    expect(totalRecupereText).toBeInTheDocument();

    // Find the amount element (should be next to "Total récupéré")
    const parentElement = totalRecupereText.parentElement;
    expect(parentElement?.textContent).toContain('150');
  });

  it('should NOT display remboursements attendus when no one buys from founder', () => {
    const founderParticipant: Participant = {
      name: 'Founder Alone',
      capitalApporte: 150000,
      notaryFeesRate: 12.5,
      interestRate: 4.5,
      durationYears: 25,
      isFounder: true,
      entryDate: new Date('2026-02-01'),
      unitId: 1,
      surface: 300,
      quantity: 2,
      lotsOwned: [
        {
          lotId: 1,
          surface: 200,
          unitId: 1,
          isPortage: false,
          allocatedSurface: 200,
          acquiredDate: new Date('2026-02-01')
        },
        {
          lotId: 2,
          surface: 100,
          unitId: 1,
          isPortage: true,
          allocatedSurface: 100,
          acquiredDate: new Date('2026-02-01')
        }
      ]
    };

    const founderCalc: ParticipantCalculation = {
      ...founderParticipant,
      pricePerM2: 1000,
      purchaseShare: 300000,
      droitEnregistrements: 37500,
      fraisNotaireFixe: 2000, // 2 lots * 1000€
      casco: 477000,
      parachevements: 150000,
      personalRenovationCost: 627000,
      constructionCost: 811450,
      constructionCostPerUnit: 405725,
      travauxCommunsPerUnit: 92225,
      sharedCosts: 34500,
      totalCost: 1182950,
      loanNeeded: 1032950,
      financingRatio: 87.3,
      monthlyPayment: 5700,
      totalRepayment: 1710000,
      totalInterest: 677050
    };

    const allParticipants = [founderParticipant];

    render(
      <UnlockProvider>
        <Tooltip.Provider>
        <ParticipantDetailsPanel
        participant={founderParticipant}
        participantCalc={founderCalc}
        participantIndex={0}
        allParticipants={allParticipants}
        calculations={mockCalculations}
        projectParams={mockProjectParams}
        deedDate="2026-02-01"
        formulaParams={DEFAULT_PORTAGE_FORMULA}
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

    // Should NOT show "Remboursements attendus" section
    expect(screen.queryByText(/💰 Remboursements attendus/i)).not.toBeInTheDocument();
  });

  it('should display portage payment details with correct formatting', () => {
    const founderParticipant: Participant = {
      name: 'Alice Founder',
      capitalApporte: 150000,
      notaryFeesRate: 12.5,
      interestRate: 4.5,
      durationYears: 25,
      isFounder: true,
      entryDate: new Date('2026-02-01'),
      unitId: 1,
      surface: 300,
      quantity: 2,
      lotsOwned: [
        {
          lotId: 2,
          surface: 100,
          unitId: 1,
          isPortage: true,
          allocatedSurface: 100,
          acquiredDate: new Date('2026-02-01')
        }
      ]
    };

    const newcomerParticipant: Participant = {
      name: 'Bob Newcomer',
      capitalApporte: 50000,
      notaryFeesRate: 3,
      interestRate: 4.5,
      durationYears: 25,
      isFounder: false,
      entryDate: new Date('2027-02-01'),
      unitId: 1,
      surface: 100,
      quantity: 1,
      purchaseDetails: {
        buyingFrom: 'Alice Founder',
        lotId: 2,
        purchasePrice: 150000
      }
    };

    const founderCalc: ParticipantCalculation = {
      ...founderParticipant,
      pricePerM2: 1000,
      purchaseShare: 300000,
      droitEnregistrements: 37500,
      fraisNotaireFixe: 2000, // 2 lots * 1000€
      casco: 477000,
      parachevements: 150000,
      personalRenovationCost: 627000,
      constructionCost: 811450,
      constructionCostPerUnit: 405725,
      travauxCommunsPerUnit: 92225,
      sharedCosts: 34500,
      totalCost: 1182950,
      loanNeeded: 1032950,
      financingRatio: 87.3,
      monthlyPayment: 5700,
      totalRepayment: 1710000,
      totalInterest: 677050
    };

    const allParticipants = [founderParticipant, newcomerParticipant];

    render(
      <UnlockProvider>
        <Tooltip.Provider>
        <ParticipantDetailsPanel
          participant={founderParticipant}
          participantCalc={founderCalc}
          participantIndex={0}
          allParticipants={allParticipants}
          calculations={mockCalculations}
          projectParams={mockProjectParams}
          deedDate="2026-02-01"
          formulaParams={DEFAULT_PORTAGE_FORMULA}
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

    // Find the remboursements section
    const remboursementsSection = screen.getByText(/💰 Remboursements attendus/i).closest('div');
    expect(remboursementsSection).toBeInTheDocument();

    // Verify it's in a purple-themed section (purple-50 bg, purple-200 border)
    expect(remboursementsSection).toHaveClass('bg-purple-50', 'border-purple-200');

    // Within this section, find the buyer name and description
    const sectionContent = within(remboursementsSection!);
    expect(sectionContent.getByText('Bob Newcomer')).toBeInTheDocument();
    expect(sectionContent.getByText(/💼 Achat de lot portage/i)).toBeInTheDocument();

    // Verify the date is shown in French format
    expect(sectionContent.getByText(/2027/)).toBeInTheDocument();

    // Verify the total amount is displayed prominently
    const totalSection = sectionContent.getByText(/Total récupéré/i).closest('div');
    expect(totalSection).toBeInTheDocument();
  });

  it('should show multiple paybacks when multiple newcomers buy', () => {
    const founderParticipant: Participant = {
      name: 'Founder Alice',
      capitalApporte: 200000,
      notaryFeesRate: 12.5,
      interestRate: 4.5,
      durationYears: 25,
      isFounder: true,
      entryDate: new Date('2026-02-01'),
      unitId: 1,
      surface: 400,
      quantity: 3,
      lotsOwned: [
        {
          lotId: 1,
          surface: 200,
          unitId: 1,
          isPortage: false,
          allocatedSurface: 200,
          acquiredDate: new Date('2026-02-01')
        },
        {
          lotId: 2,
          surface: 100,
          unitId: 1,
          isPortage: true,
          allocatedSurface: 100,
          acquiredDate: new Date('2026-02-01')
        },
        {
          lotId: 3,
          surface: 100,
          unitId: 1,
          isPortage: true,
          allocatedSurface: 100,
          acquiredDate: new Date('2026-02-01')
        }
      ]
    };

    const newcomer1: Participant = {
      name: 'Bob Newcomer',
      capitalApporte: 50000,
      notaryFeesRate: 3,
      interestRate: 4.5,
      durationYears: 25,
      isFounder: false,
      entryDate: new Date('2027-02-01'),
      unitId: 1,
      surface: 100,
      quantity: 1,
      purchaseDetails: {
        buyingFrom: 'Founder Alice',
        lotId: 2,
        purchasePrice: 150000
      }
    };

    const newcomer2: Participant = {
      name: 'Charlie Newcomer',
      capitalApporte: 60000,
      notaryFeesRate: 3,
      interestRate: 4.5,
      durationYears: 25,
      isFounder: false,
      entryDate: new Date('2028-01-01'),
      unitId: 1,
      surface: 100,
      quantity: 1,
      purchaseDetails: {
        buyingFrom: 'Founder Alice',
        lotId: 3,
        purchasePrice: 160000
      }
    };

    const founderCalc: ParticipantCalculation = {
      ...founderParticipant,
      pricePerM2: 1000,
      purchaseShare: 400000,
      droitEnregistrements: 50000,
      fraisNotaireFixe: 3000, // 3 lots * 1000€
      casco: 636000,
      parachevements: 200000,
      personalRenovationCost: 836000,
      constructionCost: 1112675,
      constructionCostPerUnit: 370892,
      travauxCommunsPerUnit: 92225,
      sharedCosts: 34500,
      totalCost: 1597175,
      loanNeeded: 1397175,
      financingRatio: 87.5,
      monthlyPayment: 7700,
      totalRepayment: 2310000,
      totalInterest: 912825
    };

    const allParticipants = [founderParticipant, newcomer1, newcomer2];

    render(
      <UnlockProvider>
        <Tooltip.Provider>
        <ParticipantDetailsPanel
          participant={founderParticipant}
          participantCalc={founderCalc}
          participantIndex={0}
          allParticipants={allParticipants}
          calculations={mockCalculations}
          projectParams={mockProjectParams}
          deedDate="2026-02-01"
          formulaParams={DEFAULT_PORTAGE_FORMULA}
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

    // Should show both buyers
    expect(screen.getByText('Bob Newcomer')).toBeInTheDocument();
    expect(screen.getByText('Charlie Newcomer')).toBeInTheDocument();

    // Should show total of both payments (150000 + 160000 = 310000)
    const totalRecupereSection = screen.getByText(/Total récupéré/i).parentElement;
    expect(totalRecupereSection?.textContent).toContain('310');
  });

  it('should display portage icon (💼) for portage payments', () => {
    const founderParticipant: Participant = {
      name: 'Alice',
      capitalApporte: 150000,
      notaryFeesRate: 12.5,
      interestRate: 4.5,
      durationYears: 25,
      isFounder: true,
      entryDate: new Date('2026-02-01'),
      unitId: 1,
      surface: 300,
      quantity: 2,
      lotsOwned: [
        {
          lotId: 2,
          surface: 100,
          unitId: 1,
          isPortage: true,
          allocatedSurface: 100,
          acquiredDate: new Date('2026-02-01')
        }
      ]
    };

    const newcomer: Participant = {
      name: 'Bob',
      capitalApporte: 50000,
      notaryFeesRate: 3,
      interestRate: 4.5,
      durationYears: 25,
      isFounder: false,
      entryDate: new Date('2027-02-01'),
      unitId: 1,
      surface: 100,
      quantity: 1,
      purchaseDetails: {
        buyingFrom: 'Alice',
        lotId: 2,
        purchasePrice: 150000
      }
    };

    const founderCalc: ParticipantCalculation = {
      ...founderParticipant,
      pricePerM2: 1000,
      purchaseShare: 300000,
      droitEnregistrements: 37500,
      fraisNotaireFixe: 2000, // 2 lots * 1000€
      casco: 477000,
      parachevements: 150000,
      personalRenovationCost: 627000,
      constructionCost: 811450,
      constructionCostPerUnit: 405725,
      travauxCommunsPerUnit: 92225,
      sharedCosts: 34500,
      totalCost: 1182950,
      loanNeeded: 1032950,
      financingRatio: 87.3,
      monthlyPayment: 5700,
      totalRepayment: 1710000,
      totalInterest: 677050
    };

    render(
      <UnlockProvider>
        <Tooltip.Provider>
        <ParticipantDetailsPanel
          participant={founderParticipant}
          participantCalc={founderCalc}
          participantIndex={0}
          allParticipants={[founderParticipant, newcomer]}
          calculations={mockCalculations}
          projectParams={mockProjectParams}
          deedDate="2026-02-01"
          formulaParams={DEFAULT_PORTAGE_FORMULA}
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

    // Verify portage icon and description are shown
    expect(screen.getByText(/💼 Achat de lot portage/i)).toBeInTheDocument();
  });

  it('FAILING TEST: should show remboursements when buyer purchaseDetails matches founder name', () => {
    // Reproduce the exact scenario from the screenshot
    const founderParticipant: Participant = {
      name: 'Annabelle/Colin',
      capitalApporte: 200000,
      notaryFeesRate: 12.5,
      interestRate: 4.5,
      durationYears: 25,
      isFounder: true,
      entryDate: new Date('2026-01-02'),
      unitId: 5,
      surface: 218,
      quantity: 2,
      lotsOwned: [
        {
          lotId: 1,
          surface: 118,
          unitId: 5,
          isPortage: false,
          allocatedSurface: 118,
          acquiredDate: new Date('2026-01-02')
        },
        {
          lotId: 7,
          surface: 100,
          unitId: 7,
          isPortage: true,
          allocatedSurface: 100,
          acquiredDate: new Date('2026-01-02')
        }
      ]
    };

    const participant5: Participant = {
      name: 'Participant 5',
      capitalApporte: 320300,
      notaryFeesRate: 3,
      interestRate: 4.5,
      durationYears: 25,
      isFounder: false,
      entryDate: new Date('2026-02-01'),
      unitId: 7,
      surface: 100,
      quantity: 2,
      purchaseDetails: {
        buyingFrom: 'Annabelle/Colin',
        lotId: 7,
        purchasePrice: 200000
      }
    };

    const founderCalc: ParticipantCalculation = {
      ...founderParticipant,
      pricePerM2: 1000,
      purchaseShare: 218000,
      droitEnregistrements: 27250,
      fraisNotaireFixe: 2000, // 2 lots * 1000€
      casco: 346620,
      parachevements: 109000,
      personalRenovationCost: 455620,
      constructionCost: 640070,
      constructionCostPerUnit: 320035,
      travauxCommunsPerUnit: 92225,
      sharedCosts: 34500,
      totalCost: 919820,
      loanNeeded: 719820,
      financingRatio: 78.2,
      monthlyPayment: 3970,
      totalRepayment: 1191000,
      totalInterest: 471180
    };

    render(
      <UnlockProvider>
        <Tooltip.Provider>
        <ParticipantDetailsPanel
          participant={founderParticipant}
          participantCalc={founderCalc}
          participantIndex={0}
          allParticipants={[founderParticipant, participant5]}
          calculations={mockCalculations}
          projectParams={mockProjectParams}
          deedDate="2026-01-02"
          formulaParams={DEFAULT_PORTAGE_FORMULA}
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

    // This should show remboursements attendus
    expect(screen.getByText(/💰 Remboursements attendus/i)).toBeInTheDocument();
    expect(screen.getByText('Participant 5')).toBeInTheDocument();

    const totalRecupereSection = screen.getByText(/Total récupéré/i).parentElement;
    expect(totalRecupereSection?.textContent).toContain('200');
  });
});
