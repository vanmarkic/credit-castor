import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Users } from 'lucide-react';
import * as Tooltip from '@radix-ui/react-tooltip';
import { calculateAll } from '../utils/calculatorUtils';
import { exportCalculations } from '../utils/excelExport';
import { XlsxWriter } from '../utils/exportWriter';
import { ParticipantsTimeline } from './calculator/ParticipantsTimeline';
import { ProjectHeader } from './calculator/ProjectHeader';
import { VerticalToolbar } from './calculator/VerticalToolbar';
import ParticipantDetailModal from './calculator/ParticipantDetailModal';
import { FormulaTooltip } from './FormulaTooltip';
import { formatCurrency } from '../utils/formatting';
import { ExpenseCategorySection } from './ExpenseCategorySection';
import { calculateExpenseCategoriesTotal } from '../utils/calculatorUtils';
import {
  getPricePerM2Formula,
  getTotalProjectCostFormula
} from '../utils/formulaExplanations';
import {
  DEFAULT_PARTICIPANTS,
  DEFAULT_PROJECT_PARAMS,
  DEFAULT_SCENARIO,
  DEFAULT_DEED_DATE,
  savePinnedParticipant,
  loadPinnedParticipant,
  clearPinnedParticipant,
  saveToLocalStorage,
  loadFromLocalStorage,
  clearLocalStorage
} from '../utils/storage';
import { RELEASE_VERSION, isCompatibleVersion } from '../utils/version';
import { VersionMismatchWarning } from './VersionMismatchWarning';

export default function EnDivisionCorrect() {
  // Check version compatibility on mount
  const [versionMismatch, setVersionMismatch] = useState<{
    show: boolean;
    storedVersion?: string;
  }>({ show: false });

  const [participants, setParticipants] = useState(() => {
    const stored = loadFromLocalStorage();

    // Check version compatibility
    if (stored && !stored.isCompatible) {
      setVersionMismatch({
        show: true,
        storedVersion: stored.storedVersion
      });
      // Return defaults for now, will be reset after user action
      return DEFAULT_PARTICIPANTS.map((p: any) => ({
        ...p,
        isFounder: true,
        entryDate: new Date(DEFAULT_DEED_DATE)
      }));
    }

    const baseParticipants = stored ? stored.participants : DEFAULT_PARTICIPANTS;

    // Ensure all participants have isFounder and entryDate
    return baseParticipants.map((p: any) => ({
      ...p,
      isFounder: p.isFounder !== undefined ? p.isFounder : true,
      entryDate: p.entryDate || new Date(stored?.deedDate || DEFAULT_DEED_DATE)
    }));
  });

  const [pinnedParticipant, setPinnedParticipant] = useState<string | null>(() => loadPinnedParticipant());
  const [fullscreenParticipantIndex, setFullscreenParticipantIndex] = useState<number | null>(null);

  const participantRefs = useRef<(HTMLDivElement | null)[]>([]);

  const addParticipant = () => {
    const newId = Math.max(...participants.map((p: any) => p.unitId), 0) + 1;
    setParticipants([...participants, {
      name: 'Participant·e ' + (participants.length + 1),
      capitalApporte: 100000,
      notaryFeesRate: 12.5,
      unitId: newId,
      surface: 100,
      interestRate: 4.5,
      durationYears: 25,
      quantity: 1,
      parachevementsPerM2: 500,
      isFounder: true,
      entryDate: new Date(deedDate)
    }]);

    // Scroll to the newly added participant (will be at the last index after state update)
    setTimeout(() => {
      const newIndex = participants.length; // This will be the index of the newly added participant
      if (participantRefs.current[newIndex]?.scrollIntoView) {
        participantRefs.current[newIndex].scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 50);
  };

  const removeParticipant = (index: number) => {
    if (participants.length > 1) {
      // If removing the pinned participant, clear the pin
      if (participants[index].name === pinnedParticipant) {
        handleUnpinParticipant();
      }
      const newParticipants = participants.filter((_: any, i: number) => i !== index);
      setParticipants(newParticipants);
    }
  };

  const updateParticipantName = (index: number, name: string) => {
    const oldName = participants[index].name;
    const newParticipants = [...participants];
    newParticipants[index].name = name;
    setParticipants(newParticipants);

    // If renaming the pinned participant, update the pin
    if (oldName === pinnedParticipant) {
      savePinnedParticipant(name);
      setPinnedParticipant(name);
    }
  };

  const updateParticipantSurface = (index: number, surface: number) => {
    const newParticipants = [...participants];
    newParticipants[index].surface = surface;
    setParticipants(newParticipants);
  };

  const unitDetails = {
    1: { casco: 178080, parachevements: 56000 },
    3: { casco: 213060, parachevements: 67000 },
    5: { casco: 187620, parachevements: 59000 },
    6: { casco: 171720, parachevements: 54000 }
  };

  const [projectParams, setProjectParams] = useState(() => {
    const stored = loadFromLocalStorage();
    return stored ? stored.projectParams : DEFAULT_PROJECT_PARAMS;
  });

  const [scenario, setScenario] = useState(() => {
    const stored = loadFromLocalStorage();
    return stored ? stored.scenario : DEFAULT_SCENARIO;
  });

  const [deedDate, setDeedDate] = useState(() => {
    const stored = loadFromLocalStorage();
    return stored?.deedDate || DEFAULT_DEED_DATE;
  });

  // Auto-save to localStorage whenever state changes
  useEffect(() => {
    // Don't save if there's a version mismatch (user needs to resolve it first)
    if (!versionMismatch.show) {
      saveToLocalStorage(participants, projectParams, scenario, deedDate);
    }
  }, [participants, projectParams, scenario, deedDate, versionMismatch.show]);

  // Handle version mismatch - export data and reset
  const handleExportAndReset = () => {
    // Get the old data before clearing
    const stored = loadFromLocalStorage();

    if (stored) {
      // Create a blob with the old data
      const dataStr = JSON.stringify(stored, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);

      // Create download link
      const link = document.createElement('a');
      link.href = url;
      link.download = `credit-castor-backup-v${stored.storedVersion || 'unknown'}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }

    // Clear localStorage
    clearLocalStorage();
    clearPinnedParticipant();

    // Reset to defaults
    setParticipants(DEFAULT_PARTICIPANTS.map((p: any) => ({
      ...p,
      isFounder: true,
      entryDate: new Date(DEFAULT_DEED_DATE)
    })));
    setProjectParams(DEFAULT_PROJECT_PARAMS);
    setScenario(DEFAULT_SCENARIO);
    setDeedDate(DEFAULT_DEED_DATE);

    // Hide the warning
    setVersionMismatch({ show: false });

    // Reload to ensure clean state
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  const handleDismissVersionWarning = () => {
    setVersionMismatch({ show: false });
  };

  const calculations = useMemo(() => {
    return calculateAll(participants, projectParams, scenario, unitDetails);
  }, [participants, projectParams, scenario]);

  // Reorder participant breakdown to show pinned participant first
  const orderedParticipantBreakdown = useMemo(() => {
    if (!pinnedParticipant) {
      return calculations.participantBreakdown;
    }

    const pinnedIndex = calculations.participantBreakdown.findIndex(
      (p) => p.name === pinnedParticipant
    );

    if (pinnedIndex === -1) {
      // Pinned participant not found, return original order
      return calculations.participantBreakdown;
    }

    // Move pinned participant to the front
    const reordered = [...calculations.participantBreakdown];
    const [pinnedItem] = reordered.splice(pinnedIndex, 1);
    reordered.unshift(pinnedItem);

    return reordered;
  }, [calculations.participantBreakdown, pinnedParticipant]);

  const updateCapital = (index: number, value: number) => {
    const newParticipants = [...participants];
    newParticipants[index].capitalApporte = value;
    setParticipants(newParticipants);
  };

  const updateNotaryRate = (index: number, value: number) => {
    const newParticipants = [...participants];
    newParticipants[index].notaryFeesRate = value;
    setParticipants(newParticipants);
  };

  const updateInterestRate = (index: number, value: number) => {
    const newParticipants = [...participants];
    newParticipants[index].interestRate = value;
    setParticipants(newParticipants);
  };

  const updateDuration = (index: number, value: number) => {
    const newParticipants = [...participants];
    newParticipants[index].durationYears = value;
    setParticipants(newParticipants);
  };

  const updateQuantity = (index: number, value: number) => {
    const newParticipants = [...participants];
    newParticipants[index].quantity = Math.max(1, value);
    setParticipants(newParticipants);
  };

  const updateParachevementsPerM2 = (index: number, value: number) => {
    const newParticipants = [...participants];
    newParticipants[index].parachevementsPerM2 = value;
    setParticipants(newParticipants);
  };

  const updateCascoSqm = (index: number, value: number | undefined) => {
    const newParticipants = [...participants];
    newParticipants[index].cascoSqm = value;
    setParticipants(newParticipants);
  };

  const updateParachevementsSqm = (index: number, value: number | undefined) => {
    const newParticipants = [...participants];
    newParticipants[index].parachevementsSqm = value;
    setParticipants(newParticipants);
  };

  const handlePinParticipant = (participantName: string) => {
    savePinnedParticipant(participantName);
    setPinnedParticipant(participantName);
  };

  const handleUnpinParticipant = () => {
    clearPinnedParticipant();
    setPinnedParticipant(null);
  };

  const addPortageLot = (participantIndex: number) => {
    const newLotId = Math.max(
      ...participants.flatMap((p: any) => p.lotsOwned?.map((l: any) => l.lotId) || []),
      0
    ) + 1;

    // Update participant lotsOwned array
    const newParticipants = [...participants];
    if (!newParticipants[participantIndex].lotsOwned) {
      newParticipants[participantIndex].lotsOwned = [];
    }

    // Increase quantity (number of lots)
    const currentQuantity = newParticipants[participantIndex].quantity || 1;
    newParticipants[participantIndex].quantity = currentQuantity + 1;

    // NOTE: Surface starts at 0, will be updated when user enters portage lot surface
    // Purchase share will grow when surface is set via updatePortageLotSurface

    newParticipants[participantIndex].lotsOwned.push({
      lotId: newLotId,
      surface: 0,
      unitId: newParticipants[participantIndex].unitId || 0,
      isPortage: true,
      allocatedSurface: 0,
      acquiredDate: new Date(deedDate),
      // Acquisition costs will be calculated dynamically based on new total costs
      originalPrice: undefined,
      originalNotaryFees: undefined,
      originalConstructionCost: undefined
    });

    setParticipants(newParticipants);
  };

  const removePortageLot = (participantIndex: number, lotId: number) => {
    const newParticipants = [...participants];
    if (newParticipants[participantIndex].lotsOwned) {
      // Find the lot being removed to get its surface
      const lotToRemove = newParticipants[participantIndex].lotsOwned.find((l: any) => l.lotId === lotId);

      // Remove the lot
      newParticipants[participantIndex].lotsOwned =
        newParticipants[participantIndex].lotsOwned.filter((l: any) => l.lotId !== lotId);

      // Decrease quantity
      const currentQuantity = newParticipants[participantIndex].quantity || 1;
      newParticipants[participantIndex].quantity = Math.max(1, currentQuantity - 1);

      // Decrease total surface by the removed lot's surface
      if (lotToRemove) {
        const currentSurface = newParticipants[participantIndex].surface || 0;
        newParticipants[participantIndex].surface = Math.max(0, currentSurface - (lotToRemove.surface || 0));
      }
    }
    setParticipants(newParticipants);
  };

  const updatePortageLotSurface = (participantIndex: number, lotId: number, surface: number) => {
    const newParticipants = [...participants];
    if (newParticipants[participantIndex].lotsOwned) {
      const lot = newParticipants[participantIndex].lotsOwned.find((l: any) => l.lotId === lotId);
      if (lot) {
        // Calculate the surface change
        const oldSurface = lot.surface || 0;
        const surfaceChange = surface - oldSurface;

        // Update lot surface
        lot.surface = surface;
        lot.allocatedSurface = surface;

        // Update participant's total surface
        const currentTotalSurface = newParticipants[participantIndex].surface || 0;
        newParticipants[participantIndex].surface = currentTotalSurface + surfaceChange;
      }
    }
    setParticipants(newParticipants);
  };

  const exportToExcel = () => {
    const writer = new XlsxWriter();
    exportCalculations(calculations, projectParams, scenario, unitDetails, writer);
  };


  // Download scenario as JSON file
  const downloadScenario = () => {
    const data = {
      version: 2,
      releaseVersion: RELEASE_VERSION,
      timestamp: new Date().toISOString(),
      participants,
      projectParams,
      scenario,
      deedDate,
      unitDetails,
      calculations: {
        totalSurface: calculations.totalSurface,
        pricePerM2: calculations.pricePerM2,
        sharedCosts: calculations.sharedCosts,
        sharedPerPerson: calculations.sharedPerPerson,
        participantBreakdown: calculations.participantBreakdown.map(p => ({
          name: p.name,
          unitId: p.unitId,
          surface: p.surface,
          quantity: p.quantity,
          pricePerM2: p.pricePerM2,
          purchaseShare: p.purchaseShare,
          notaryFees: p.notaryFees,
          casco: p.casco,
          parachevements: p.parachevements,
          personalRenovationCost: p.personalRenovationCost,
          constructionCost: p.constructionCost,
          constructionCostPerUnit: p.constructionCostPerUnit,
          travauxCommunsPerUnit: p.travauxCommunsPerUnit,
          sharedCosts: p.sharedCosts,
          totalCost: p.totalCost,
          loanNeeded: p.loanNeeded,
          financingRatio: p.financingRatio,
          monthlyPayment: p.monthlyPayment,
          totalRepayment: p.totalRepayment,
          totalInterest: p.totalInterest
        })),
        totals: {
          purchase: calculations.totals.purchase,
          totalNotaryFees: calculations.totals.totalNotaryFees,
          construction: calculations.totals.construction,
          shared: calculations.totals.shared,
          totalTravauxCommuns: calculations.totals.totalTravauxCommuns,
          travauxCommunsPerUnit: calculations.totals.travauxCommunsPerUnit,
          total: calculations.totals.total,
          capitalTotal: calculations.totals.capitalTotal,
          totalLoansNeeded: calculations.totals.totalLoansNeeded,
          averageLoan: calculations.totals.averageLoan,
          averageCapital: calculations.totals.averageCapital
        }
      }
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;

    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10);
    const timeStr = now.toTimeString().slice(0, 5).replace(':', '-');
    link.download = `scenario_${dateStr}_${timeStr}.json`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Load scenario from JSON file
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadScenario = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);

        // Validate the data structure
        if (!data.participants || !data.projectParams || !data.scenario) {
          alert('Fichier invalide: structure de données manquante');
          return;
        }

        // Validate release version match
        if (!isCompatibleVersion(data.releaseVersion)) {
          const versionMsg = data.releaseVersion
            ? `ce fichier a été créé avec la version ${data.releaseVersion}, mais vous utilisez la version ${RELEASE_VERSION}`
            : `ce fichier n'a pas de numéro de version (ancien format)`;
          alert(`Version incompatible: ${versionMsg}.\n\nEnvoie le fichier à Dragan.`);
          return;
        }

        // Load the data (inputs only, ignore calculations)
        setParticipants(data.participants);
        setProjectParams(data.projectParams);
        setScenario(data.scenario);

        // Load deedDate if present (version 2+)
        if (data.deedDate) {
          setDeedDate(data.deedDate);
        }

        // Note: unitDetails are hardcoded in the component, not loaded from file
        // Note: calculations are derived, not loaded from file

        alert('Scénario chargé avec succès!');
      } catch (error) {
        console.error('Error loading scenario:', error);
        alert('Erreur lors du chargement du fichier. Vérifiez que le fichier est valide.');
      }
    };

    reader.readAsText(file);

    // Reset the input so the same file can be loaded again
    if (event.target) {
      event.target.value = '';
    }
  };

  // Reset to defaults
  const resetToDefaults = () => {
    if (confirm('Êtes-vous sûr de vouloir réinitialiser complètement? Toutes les données seront perdues.')) {
      clearLocalStorage();
      setParticipants(DEFAULT_PARTICIPANTS);
      setProjectParams(DEFAULT_PROJECT_PARAMS);
      setScenario(DEFAULT_SCENARIO);
      alert('Données réinitialisées aux valeurs par défaut.');
    }
  };

  return (
    <Tooltip.Provider>
      {/* Version Mismatch Warning Modal */}
      {versionMismatch.show && (
        <VersionMismatchWarning
          storedVersion={versionMismatch.storedVersion}
          currentVersion={RELEASE_VERSION}
          onExportAndReset={handleExportAndReset}
          onDismiss={handleDismissVersionWarning}
        />
      )}

      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-100 p-6">
      <div className="max-w-7xl mx-auto">

        <ProjectHeader
          calculations={calculations}
          participants={participants}
        />

        <VerticalToolbar
          onDownloadScenario={downloadScenario}
          onLoadScenario={loadScenario}
          onResetToDefaults={resetToDefaults}
          onExportToExcel={exportToExcel}
          fileInputRef={fileInputRef}
          onFileUpload={handleFileUpload}
        />

        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Décomposition des Coûts</h2>
          <div className="flex items-center justify-center gap-3">
            <div className="p-3 bg-white rounded-lg border border-gray-200 flex-1">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Achat Total</p>
              <p className="text-lg font-bold text-gray-900">{formatCurrency(calculations.totals.purchase)}</p>
              <p className="text-xs text-blue-600 mt-1">
                <FormulaTooltip formula={getPricePerM2Formula(calculations.totals, calculations.totalSurface)}>
                  {formatCurrency(calculations.pricePerM2)}/m²
                </FormulaTooltip>
              </p>
            </div>

            <div className="text-2xl font-bold text-gray-400 flex-shrink-0">+</div>

            <div className="p-3 bg-white rounded-lg border border-purple-200 flex-1">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Commun Infrastr.</p>
              <p className="text-lg font-bold text-purple-700">{formatCurrency(calculations.sharedCosts)}</p>
              <p className="text-xs text-purple-500 mt-1">{formatCurrency(calculations.sharedPerPerson)}/pers</p>
            </div>

            <div className="text-2xl font-bold text-gray-400 flex-shrink-0">+</div>

            <div className="p-3 bg-white rounded-lg border border-orange-200 flex-1">
              <FormulaTooltip formula={[
                "Rénovations personnelles",
                `CASCO (gros œuvre): ${formatCurrency(calculations.participantBreakdown.reduce((sum, p) => sum + p.casco, 0))}`,
                `+ Parachèvements: ${formatCurrency(calculations.participantBreakdown.reduce((sum, p) => sum + p.parachevements, 0))}`,
                `= ${formatCurrency(calculations.participantBreakdown.reduce((sum, p) => sum + p.personalRenovationCost, 0))}`
              ]}>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Rénovations Perso.</p>
              </FormulaTooltip>
              <p className="text-lg font-bold text-orange-700">{formatCurrency(calculations.participantBreakdown.reduce((sum, p) => sum + p.personalRenovationCost, 0))}</p>
              <p className="text-xs text-orange-500 mt-1">CASCO + Parachèv.</p>
            </div>

            <div className="text-2xl font-bold text-gray-400 flex-shrink-0">+</div>

            <div className="p-3 bg-white rounded-lg border border-gray-200 flex-1">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Frais de Notaire</p>
              <p className="text-lg font-bold text-gray-900">{formatCurrency(calculations.totals.totalNotaryFees)}</p>
              <p className="text-xs text-gray-400 mt-1">taux individuels</p>
            </div>

            <div className="text-2xl font-bold text-gray-400 flex-shrink-0">=</div>

            <div className="p-3 bg-gray-50 rounded-lg border border-gray-300 flex-1">
              <p className="text-xs text-gray-600 uppercase tracking-wide mb-1 font-semibold">TOTAL</p>
              <p className="text-lg font-bold text-gray-900">
                <FormulaTooltip formula={getTotalProjectCostFormula()}>
                  {formatCurrency(calculations.totals.total)}
                </FormulaTooltip>
              </p>
            </div>
          </div>

          <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
            <h3 className="text-sm font-semibold text-gray-800 mb-3">Détail Commun</h3>

            {projectParams.expenseCategories && (
              <div className="space-y-3">
                <ExpenseCategorySection
                  title="CONSERVATOIRE"
                  items={projectParams.expenseCategories.conservatoire}
                  onItemChange={(index: number, value: number) => {
                    const newCategories = {
                      ...projectParams.expenseCategories!,
                      conservatoire: projectParams.expenseCategories!.conservatoire.map((item: any, i: number) =>
                        i === index ? { ...item, amount: value } : item
                      ),
                    };
                    setProjectParams({ ...projectParams, expenseCategories: newCategories });
                  }}
                  onItemLabelChange={(index: number, label: string) => {
                    const newCategories = {
                      ...projectParams.expenseCategories!,
                      conservatoire: projectParams.expenseCategories!.conservatoire.map((item: any, i: number) =>
                        i === index ? { ...item, label } : item
                      ),
                    };
                    setProjectParams({ ...projectParams, expenseCategories: newCategories });
                  }}
                  onAddItem={() => {
                    const newCategories = {
                      ...projectParams.expenseCategories!,
                      conservatoire: [
                        ...projectParams.expenseCategories!.conservatoire,
                        { label: 'Nouvelle dépense', amount: 0 }
                      ],
                    };
                    setProjectParams({ ...projectParams, expenseCategories: newCategories });
                  }}
                  onRemoveItem={(index: number) => {
                    const newCategories = {
                      ...projectParams.expenseCategories!,
                      conservatoire: projectParams.expenseCategories!.conservatoire.filter((_: any, i: number) => i !== index),
                    };
                    setProjectParams({ ...projectParams, expenseCategories: newCategories });
                  }}
                />

                <ExpenseCategorySection
                  title="HABITABILITE SOMMAIRE"
                  items={projectParams.expenseCategories.habitabiliteSommaire}
                  onItemChange={(index: number, value: number) => {
                    const newCategories = {
                      ...projectParams.expenseCategories!,
                      habitabiliteSommaire: projectParams.expenseCategories!.habitabiliteSommaire.map((item: any, i: number) =>
                        i === index ? { ...item, amount: value } : item
                      ),
                    };
                    setProjectParams({ ...projectParams, expenseCategories: newCategories });
                  }}
                  onItemLabelChange={(index: number, label: string) => {
                    const newCategories = {
                      ...projectParams.expenseCategories!,
                      habitabiliteSommaire: projectParams.expenseCategories!.habitabiliteSommaire.map((item: any, i: number) =>
                        i === index ? { ...item, label } : item
                      ),
                    };
                    setProjectParams({ ...projectParams, expenseCategories: newCategories });
                  }}
                  onAddItem={() => {
                    const newCategories = {
                      ...projectParams.expenseCategories!,
                      habitabiliteSommaire: [
                        ...projectParams.expenseCategories!.habitabiliteSommaire,
                        { label: 'Nouvelle dépense', amount: 0 }
                      ],
                    };
                    setProjectParams({ ...projectParams, expenseCategories: newCategories });
                  }}
                  onRemoveItem={(index: number) => {
                    const newCategories = {
                      ...projectParams.expenseCategories!,
                      habitabiliteSommaire: projectParams.expenseCategories!.habitabiliteSommaire.filter((_: any, i: number) => i !== index),
                    };
                    setProjectParams({ ...projectParams, expenseCategories: newCategories });
                  }}
                />

                <ExpenseCategorySection
                  title="PREMIER TRAVAUX"
                  items={projectParams.expenseCategories.premierTravaux}
                  onItemChange={(index: number, value: number) => {
                    const newCategories = {
                      ...projectParams.expenseCategories!,
                      premierTravaux: projectParams.expenseCategories!.premierTravaux.map((item: any, i: number) =>
                        i === index ? { ...item, amount: value } : item
                      ),
                    };
                    setProjectParams({ ...projectParams, expenseCategories: newCategories });
                  }}
                  onItemLabelChange={(index: number, label: string) => {
                    const newCategories = {
                      ...projectParams.expenseCategories!,
                      premierTravaux: projectParams.expenseCategories!.premierTravaux.map((item: any, i: number) =>
                        i === index ? { ...item, label } : item
                      ),
                    };
                    setProjectParams({ ...projectParams, expenseCategories: newCategories });
                  }}
                  onAddItem={() => {
                    const newCategories = {
                      ...projectParams.expenseCategories!,
                      premierTravaux: [
                        ...projectParams.expenseCategories!.premierTravaux,
                        { label: 'Nouvelle dépense', amount: 0 }
                      ],
                    };
                    setProjectParams({ ...projectParams, expenseCategories: newCategories });
                  }}
                  onRemoveItem={(index: number) => {
                    const newCategories = {
                      ...projectParams.expenseCategories!,
                      premierTravaux: projectParams.expenseCategories!.premierTravaux.filter((_: any, i: number) => i !== index),
                    };
                    setProjectParams({ ...projectParams, expenseCategories: newCategories });
                  }}
                />

                <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="flex justify-between items-center p-3 bg-gray-50">
                <h4 className="text-sm font-semibold text-gray-800 uppercase tracking-wide">Frais Généraux étalés sur 3 ans</h4>
                <span className="text-sm font-bold text-purple-700">
                  {formatCurrency(
                    projectParams.expenseCategories
                      ? calculations.sharedCosts - calculateExpenseCategoriesTotal(projectParams.expenseCategories)
                      : projectParams.fraisGeneraux3ans
                  )}
                </span>
              </div>
              <div className="p-3 bg-white space-y-2">
                {/* Global CASCO rate input */}
                <div className="flex items-center gap-2">
                  <label className="text-xs text-gray-600 whitespace-nowrap">
                    Prix CASCO/m² Global:
                  </label>
                  <input
                    type="number"
                    step="10"
                    value={projectParams.globalCascoPerM2}
                    onChange={(e) => setProjectParams({
                      ...projectParams,
                      globalCascoPerM2: parseFloat(e.target.value) || 1590
                    })}
                    className="w-24 px-2 py-1 text-sm font-semibold border border-blue-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  />
                  <span className="text-xs text-blue-600">€/m²</span>
                </div>

                {/* Calculation breakdown */}
                <div className="text-xs text-gray-500 space-y-0.5">
                  <p>• Honoraires (15% × 30% CASCO)</p>
                  <p>• Frais récurrents × 3 ans</p>
                  <p className="text-gray-400 italic mt-1">Calculé automatiquement</p>
                </div>
              </div>
                </div>
              </div>
            )}

            <div className="mt-4 p-3 bg-purple-100 rounded-lg border border-purple-300">
              <div className="flex justify-between items-center">
                <p className="text-sm font-semibold text-gray-700">Total commun:</p>
                <p className="text-lg font-bold text-purple-800">{formatCurrency(calculations.sharedCosts)}</p>
              </div>
              <p className="text-xs text-gray-600 mt-1">
                {formatCurrency(calculations.sharedPerPerson)} par personne
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">💳 Besoins de Financement Individuels</h2>
            <button
              onClick={addParticipant}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded-lg transition-colors flex items-center gap-2"
            >
              <Users className="w-5 h-5" />
              Ajouter un·e participant·e
            </button>
          </div>
          
          <div className="space-y-6">
            {orderedParticipantBreakdown.map((p) => {
              // Find the original index in the participants array
              const idx = participants.findIndex((participant: any) => participant.name === p.name);

              return (
              <div
                key={idx}
                ref={(el) => { participantRefs.current[idx] = el; }}
                className="border border-gray-300 rounded-xl bg-white shadow-sm hover:shadow-md transition-shadow">

                {/* Always Visible Header */}
                <div
                  className="cursor-pointer transition-all p-6"
                  onClick={() => setFullscreenParticipantIndex(idx)}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                    {/* Left Column: Name and Info */}
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-3">
                        <input
                          type="text"
                          value={p.name}
                          onChange={(e) => updateParticipantName(idx, e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          className="text-lg font-bold text-gray-900 bg-transparent border-b-2 border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none px-1 py-1"
                          placeholder="Nom du·de la participant·e"
                        />
                        {!participants[idx].isFounder && participants.length > 1 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeParticipant(idx);
                            }}
                            className="text-red-600 hover:text-red-700 text-xs font-medium px-2 py-1 rounded border border-red-300 hover:bg-red-50 transition-colors"
                          >
                            Retirer
                          </button>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <span className="text-gray-400">Unité</span>
                          <span className="font-medium text-blue-600">{p.unitId}</span>
                        </span>
                        <span className="text-gray-300">•</span>
                        <span>{p.surface}m²</span>
                        <span className="text-gray-300">•</span>
                        <span>{p.quantity || 1} {(p.quantity || 1) > 1 ? 'unités' : 'unité'}</span>
                        {participants[idx].entryDate && (
                          <>
                            <span className="text-gray-300">•</span>
                            <span className={`font-medium ${participants[idx].isFounder ? 'text-green-600' : 'text-blue-600'}`}>
                              Entrée: {new Date(participants[idx].entryDate).toLocaleDateString('fr-BE')}
                            </span>
                          </>
                        )}
                        {participants[idx].purchaseDetails?.buyingFrom && (
                          <>
                            <span className="text-gray-300">•</span>
                            <span className="text-purple-600 text-xs">
                              Achète de {participants[idx].purchaseDetails.buyingFrom}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Right Column: Key Financial Metrics */}
                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-gray-50 rounded-lg p-2 border border-gray-200" onClick={(e) => e.stopPropagation()}>
                        <p className="text-xs text-gray-500 mb-1">Coût Total</p>
                        <p className="text-base font-bold text-gray-900">{formatCurrency(p.totalCost)}</p>
                      </div>
                      <div className="bg-red-50 rounded-lg p-2 border border-red-300" onClick={(e) => e.stopPropagation()}>
                        <p className="text-xs text-gray-600 mb-1">À emprunter</p>
                        <p className="text-base font-bold text-red-700">{formatCurrency(p.loanNeeded)}</p>
                      </div>
                      <div className="bg-white rounded-lg p-2 border border-gray-200" onClick={(e) => e.stopPropagation()}>
                        <p className="text-xs text-gray-500 mb-1">Mensualité</p>
                        <p className="text-base font-bold text-red-600">{formatCurrency(p.monthlyPayment)}</p>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
              );
            })}
          </div>
        </div>

        {/* Full-screen participant detail modal */}
        {fullscreenParticipantIndex !== null && (() => {
          const idx = fullscreenParticipantIndex;
          const p = orderedParticipantBreakdown.find(pb => pb.name === participants[idx].name);
          if (!p) return null;

          return (
            <ParticipantDetailModal
              isOpen={true}
              onClose={() => setFullscreenParticipantIndex(null)}
              participantIndex={idx}
              participant={participants[idx]}
              participantBreakdown={p}
              deedDate={deedDate}
              allParticipants={participants}
              calculations={calculations}
              projectParams={projectParams}
              isPinned={pinnedParticipant === p.name}
              onPin={() => handlePinParticipant(p.name)}
              onUnpin={handleUnpinParticipant}
              onUpdateName={(name) => updateParticipantName(idx, name)}
              onUpdateSurface={(surface) => updateParticipantSurface(idx, surface)}
              onUpdateCapital={(value) => updateCapital(idx, value)}
              onUpdateNotaryRate={(rate) => updateNotaryRate(idx, rate)}
              onUpdateInterestRate={(rate) => updateInterestRate(idx, rate)}
              onUpdateDuration={(years) => updateDuration(idx, years)}
              onUpdateQuantity={(qty) => updateQuantity(idx, qty)}
              onUpdateParachevementsPerM2={(value) => updateParachevementsPerM2(idx, value)}
              onUpdateCascoSqm={(value) => updateCascoSqm(idx, value)}
              onUpdateParachevementsSqm={(value) => updateParachevementsSqm(idx, value)}
              onUpdateParticipant={(updated) => {
                const newParticipants = [...participants];
                newParticipants[idx] = updated;
                setParticipants(newParticipants);
              }}
              onAddPortageLot={() => addPortageLot(idx)}
              onRemovePortageLot={(lotId) => removePortageLot(idx, lotId)}
              onUpdatePortageLotSurface={(lotId, surface) => updatePortageLotSurface(idx, lotId, surface)}
              onRemove={() => removeParticipant(idx)}
              totalParticipants={participants.length}
            />
          );
        })()}

        <ParticipantsTimeline
          participants={participants}
          deedDate={deedDate}
          onDeedDateChange={setDeedDate}
        />
      </div>
      </div>
    </Tooltip.Provider>
  );
}