import { useMemo, useRef } from 'react';
import * as Tooltip from '@radix-ui/react-tooltip';
import { calculateAll, type Participant } from '../utils/calculatorUtils';
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
import PortageFormulaConfig from './PortageFormulaConfig';
import AvailableLotsView from './AvailableLotsView';
import { getAvailableLotsForNewcomer } from '../utils/availableLots';
import {
  getPricePerM2Formula,
  getTotalProjectCostFormula
} from '../utils/formulaExplanations';
import {
  DEFAULT_PARTICIPANTS,
  DEFAULT_PROJECT_PARAMS,
  DEFAULT_DEED_DATE,
  loadFromLocalStorage,
  clearLocalStorage,
  clearPinnedParticipant
} from '../utils/storage';
import { RELEASE_VERSION } from '../utils/version';
import { VersionMismatchWarning } from './VersionMismatchWarning';
import { useCalculatorState, useOrderedParticipantBreakdown } from '../hooks/useCalculatorState';
import { useParticipantOperations } from '../hooks/useParticipantOperations';
import { useStoragePersistence } from '../hooks/useStoragePersistence';
import { downloadScenarioFile, createFileUploadHandler } from '../utils/scenarioFileIO';
import HorizontalSwimLaneTimeline from './HorizontalSwimLaneTimeline';

export default function EnDivisionCorrect() {
  // State management
  const state = useCalculatorState();
  const {
    participants,
    projectParams,
    // scenario removed
    deedDate,
    portageFormula,
    pinnedParticipant,
    fullscreenParticipantIndex,
    versionMismatch,
    setParticipants,
    setProjectParams,
    // setScenario removed
    setDeedDate,
    setPortageFormula,
    setFullscreenParticipantIndex,
    setVersionMismatch,
    handlePinParticipant,
    handleUnpinParticipant,
    participantRefs
  } = state;

  // Participant operations
  const participantOps = useParticipantOperations();

  const addParticipant = () => {
    const newParticipants = participantOps.addParticipant(participants, deedDate);
    setParticipants(newParticipants);

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
      const newParticipants = participantOps.removeParticipant(participants, index);
      setParticipants(newParticipants);
    }
  };

  const updateParticipantName = (index: number, name: string) => {
    const oldName = participants[index].name;
    const newParticipants = participantOps.updateParticipantName(participants, index, name);
    setParticipants(newParticipants);

    // If renaming the pinned participant, update the pin
    if (oldName === pinnedParticipant) {
      handlePinParticipant(name);
    }
  };

  const updateParticipantSurface = (index: number, surface: number) => {
    const newParticipants = participantOps.updateParticipantSurface(participants, index, surface);
    setParticipants(newParticipants);
  };

  const unitDetails = {
    1: { casco: 178080, parachevements: 56000 },
    3: { casco: 213060, parachevements: 67000 },
    5: { casco: 187620, parachevements: 59000 },
    6: { casco: 171720, parachevements: 54000 }
  };

  // Auto-save to localStorage
  useStoragePersistence(
    participants,
    projectParams,
    deedDate,
    portageFormula,
    versionMismatch.show
  );

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
    setParticipants(DEFAULT_PARTICIPANTS.map((p: Participant) => ({
      ...p,
      isFounder: p.isFounder !== undefined ? p.isFounder : true,
      entryDate: p.entryDate ? new Date(p.entryDate) : new Date(DEFAULT_DEED_DATE)
    })));
    setProjectParams(DEFAULT_PROJECT_PARAMS);
    // scenario removed - no longer using percentage-based adjustments
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
    return calculateAll(participants, projectParams, unitDetails);
  }, [participants, projectParams]);

  // Reorder participant breakdown to show pinned participant first
  const orderedParticipantBreakdown = useOrderedParticipantBreakdown(calculations, pinnedParticipant);

  const updateCapital = (index: number, value: number) => {
    setParticipants(participantOps.updateCapital(participants, index, value));
  };

  const updateNotaryRate = (index: number, value: number) => {
    setParticipants(participantOps.updateNotaryRate(participants, index, value));
  };

  const updateInterestRate = (index: number, value: number) => {
    setParticipants(participantOps.updateInterestRate(participants, index, value));
  };

  const updateDuration = (index: number, value: number) => {
    setParticipants(participantOps.updateDuration(participants, index, value));
  };

  const updateQuantity = (index: number, value: number) => {
    setParticipants(participantOps.updateQuantity(participants, index, value));
  };

  const updateParachevementsPerM2 = (index: number, value: number) => {
    setParticipants(participantOps.updateParachevementsPerM2(participants, index, value));
  };

  const updateCascoSqm = (index: number, value: number | undefined) => {
    setParticipants(participantOps.updateCascoSqm(participants, index, value));
  };

  const updateParachevementsSqm = (index: number, value: number | undefined) => {
    setParticipants(participantOps.updateParachevementsSqm(participants, index, value));
  };

  const addPortageLot = (participantIndex: number) => {
    const participantCalc = calculations.participantBreakdown[participantIndex];
    setParticipants(participantOps.addPortageLot(
      participants,
      participantIndex,
      deedDate,
      participantCalc ? {
        purchaseShare: participantCalc.purchaseShare,
        notaryFees: participantCalc.notaryFees,
        casco: participantCalc.casco
      } : undefined
    ));
  };

  const removePortageLot = (participantIndex: number, lotId: number) => {
    setParticipants(participantOps.removePortageLot(participants, participantIndex, lotId));
  };

  const updatePortageLotSurface = (participantIndex: number, lotId: number, surface: number) => {
    setParticipants(participantOps.updatePortageLotSurface(participants, participantIndex, lotId, surface));
  };

  const exportToExcel = () => {
    const writer = new XlsxWriter();
    exportCalculations(calculations, projectParams, unitDetails, writer);
  };

  // Download scenario as JSON file
  const downloadScenario = () => {
    downloadScenarioFile(
      participants,
      projectParams,
      deedDate,
      unitDetails,
      calculations
    );
  };

  // Load scenario from JSON file
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadScenario = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = createFileUploadHandler(
    (data) => {
      setParticipants(data.participants);
      setProjectParams(data.projectParams);
      // scenario removed - no longer using percentage-based adjustments
      if (data.deedDate) {
        setDeedDate(data.deedDate);
      }
      alert('Scénario chargé avec succès!');
    },
    (error) => {
      alert(error);
    }
  );

  // Reset to defaults
  const resetToDefaults = () => {
    if (confirm('Êtes-vous sûr de vouloir réinitialiser complètement? Toutes les données seront perdues.')) {
      clearLocalStorage();
      setParticipants(DEFAULT_PARTICIPANTS);
      setProjectParams(DEFAULT_PROJECT_PARAMS);
      // scenario removed - no longer using percentage-based adjustments
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

        {/* Horizontal Timeline */}
        <HorizontalSwimLaneTimeline
          participants={participants}
          projectParams={projectParams}
          calculations={calculations}
          deedDate={deedDate}
          onOpenParticipantDetails={setFullscreenParticipantIndex}
          onAddParticipant={addParticipant}
        />

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
              formulaParams={portageFormula}
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
                const oldParticipant = newParticipants[idx];

                // Update buyer participant
                newParticipants[idx] = updated;

                // Handle seller's lot soldDate updates
                const oldPurchase = oldParticipant.purchaseDetails;
                const newPurchase = updated.purchaseDetails;

                // If buyer selected a portage lot, set seller's soldDate
                if (newPurchase?.buyingFrom && newPurchase?.lotId) {
                  const sellerIdx = newParticipants.findIndex(p => p.name === newPurchase.buyingFrom);
                  if (sellerIdx !== -1 && newParticipants[sellerIdx].lotsOwned) {
                    newParticipants[sellerIdx] = {
                      ...newParticipants[sellerIdx],
                      lotsOwned: newParticipants[sellerIdx].lotsOwned?.map(lot =>
                        lot.lotId === newPurchase.lotId
                          ? { ...lot, soldDate: updated.entryDate }
                          : lot
                      )
                    };
                  }
                }
                // If buyer unselected a portage lot, clear seller's soldDate
                else if (oldPurchase?.buyingFrom && oldPurchase?.lotId && !newPurchase) {
                  const sellerIdx = newParticipants.findIndex(p => p.name === oldPurchase.buyingFrom);
                  if (sellerIdx !== -1 && newParticipants[sellerIdx].lotsOwned) {
                    newParticipants[sellerIdx] = {
                      ...newParticipants[sellerIdx],
                      lotsOwned: newParticipants[sellerIdx].lotsOwned?.map(lot =>
                        lot.lotId === oldPurchase.lotId
                          ? { ...lot, soldDate: undefined }
                          : lot
                      )
                    };
                  }
                }

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

        {/* Global Portage Formula Configuration */}
        <div className="mt-8">
          <PortageFormulaConfig
            formulaParams={portageFormula}
            onUpdateParams={setPortageFormula}
            deedDate={new Date(deedDate)}
          />
        </div>

        {/* Available Lots Marketplace */}
        <div className="mt-8">
          <AvailableLotsView
            availableLots={getAvailableLotsForNewcomer(
              participants,
              [], // Copro lots - empty for now
              calculations
            )}
            deedDate={new Date(deedDate)}
            formulaParams={portageFormula}
          />
        </div>
      </div>
      </div>
    </Tooltip.Provider>
  );
}