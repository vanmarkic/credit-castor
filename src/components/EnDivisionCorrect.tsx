import { useRef, useState, useEffect } from 'react';
import * as Tooltip from '@radix-ui/react-tooltip';
import { type Participant, calculateTotalTravauxCommuns } from '../utils/calculatorUtils';
import { ParticipantsTimeline } from './calculator/ParticipantsTimeline';
import { ProjectHeader } from './calculator/ProjectHeader';
import { VerticalToolbar } from './calculator/VerticalToolbar';
import ParticipantDetailModal from './calculator/ParticipantDetailModal';
import CoproDetailModal from './calculator/CoproDetailModal';
import { FormulaTooltip } from './FormulaTooltip';
import { formatCurrency } from '../utils/formatting';
import { ExpenseCategoriesManager } from './shared/ExpenseCategoriesManager';
import PortageFormulaConfig from './PortageFormulaConfig';
import AvailableLotsView from './AvailableLotsView';
import { getAvailableLotsForNewcomer } from '../utils/availableLots';
import { validateAddPortageLot } from '../utils/lotValidation';
import type { CoproLot } from '../types/timeline';
import {
  getPricePerM2Formula,
  getTotalProjectCostFormula
} from '../utils/formulaExplanations';
import { loadFromLocalStorage, clearPinnedParticipant } from '../utils/storage';
import { RELEASE_VERSION } from '../utils/version';
import { VersionMismatchWarning } from './VersionMismatchWarning';
import { useOrderedParticipantBreakdown } from '../hooks/useCalculatorState';
import HorizontalSwimLaneTimeline from './HorizontalSwimLaneTimeline';
import { updateBuyerWithRecalculatedPrice } from '../utils/portageRecalculation';
import { UnlockProvider, useUnlock } from '../contexts/UnlockContext';
import { UnlockButton } from './shared/UnlockButton';
import toast, { Toaster } from 'react-hot-toast';
import { useChangeNotifications } from '../hooks/useChangeNotifications';
import { ChangeNotificationToast, PresenceNotificationToast } from './shared/NotificationToast';
import { ConflictResolutionDialog } from './ConflictResolutionDialog';
import { useCalculator } from '../contexts/CalculatorContext';

interface CoproSnapshot {
  date: Date;
  availableLots: number;
  totalSurface: number;
  soldThisDate: string[];
  reserveIncrease: number;
  colorZone: number;
}

export default function EnDivisionCorrect() {
  // Get state and actions from context
  const { state, actions } = useCalculator();
  const {
    participants,
    projectParams,
    deedDate,
    portageFormula,
    pinnedParticipant,
    fullscreenParticipantIndex,
    versionMismatch,
    syncMode,
    isSyncing,
    lastSyncedAt,
    conflictState,
    syncError,
    activeUsers,
    calculations,
    unitDetails
  } = state;

  const {
    setParticipants,
    setProjectParams,
    handleDeedDateChange,
    handleRenovationStartDateChange,
    setPortageFormula,
    setFullscreenParticipantIndex,
    setVersionMismatch,
    handlePinParticipant,
    handleUnpinParticipant,
    addParticipant,
    updateParticipant,
    updateParticipantName,
    updateParticipantSurface,
    removeParticipant,
    downloadScenario,
    loadScenario,
    resetToDefaults,
    exportToExcel,
    resolveConflict
  } = actions;

  // Copropriété modal state
  const [coproSnapshot, setCoproSnapshot] = useState<CoproSnapshot | null>(null);

  // Presence detection and change notifications (for toast UI)
  const { unlockedBy } = useUnlock();
  const { changes, clearChanges } = useChangeNotifications();
  const previousActiveUsersRef = useRef<number>(0);

  // Show presence notifications when users join/leave
  useEffect(() => {
    const currentCount = activeUsers.length;
    const previousCount = previousActiveUsersRef.current;

    if (currentCount > previousCount && currentCount > 0) {
      // New user joined
      const newUser = activeUsers[currentCount - 1];
      toast.custom(
        (t) => (
          <PresenceNotificationToast
            user={newUser}
            action="joined"
            onDismiss={() => toast.dismiss(t.id)}
          />
        ),
        { duration: 5000, position: 'top-right' }
      );
    } else if (currentCount < previousCount) {
      // User left (don't show notification for this - less important)
      // Could be uncommented if desired:
      // toast.info('Un utilisateur a quitté', { duration: 3000 });
    }

    previousActiveUsersRef.current = currentCount;
  }, [activeUsers]);

  // Show change notifications
  useEffect(() => {
    if (changes.length > 0) {
      changes.forEach((change) => {
        toast.custom(
          (t) => (
            <ChangeNotificationToast
              change={change}
              onReload={() => {
                window.location.reload();
                toast.dismiss(t.id);
              }}
              onMerge={undefined} // Merge functionality will be added in Phase 3
              onDismiss={() => toast.dismiss(t.id)}
            />
          ),
          { duration: Infinity, position: 'top-right' } // Don't auto-dismiss
        );
      });
      clearChanges();
    }
  }, [changes, clearChanges]);

  // Version mismatch handler (unique to this component)
  const handleExportAndReset = () => {
    const stored = loadFromLocalStorage();
    if (stored) {
      const dataStr = JSON.stringify(stored, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `credit-castor-backup-v${stored.storedVersion || 'unknown'}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
    clearPinnedParticipant();
    resetToDefaults();
    setTimeout(() => window.location.reload(), 500);
  };

  const handleDismissVersionWarning = () => {
    setVersionMismatch({ show: false });
  };

  // Reorder participant breakdown to show pinned participant first
  const orderedParticipantBreakdown = useOrderedParticipantBreakdown(calculations, pinnedParticipant);

  // Participant detail operations (wrappers for provider actions)
  const updateCapital = (index: number, value: number) => {
    const participantOps = { updateCapital: (ps: Participant[], i: number, v: number) => {
      const updated = [...ps];
      updated[i] = { ...updated[i], capitalApporte: v };
      return updated;
    }};
    setParticipants(participantOps.updateCapital(participants, index, value));
  };

  const updateNotaryRate = (index: number, value: number) => {
    const newParticipants = [...participants];
    newParticipants[index] = { ...newParticipants[index], registrationFeesRate: value };
    setParticipants(newParticipants);
  };

  const updateInterestRate = (index: number, value: number) => {
    const newParticipants = [...participants];
    newParticipants[index] = { ...newParticipants[index], interestRate: value };
    setParticipants(newParticipants);
  };

  const updateDuration = (index: number, value: number) => {
    const newParticipants = [...participants];
    newParticipants[index] = { ...newParticipants[index], durationYears: value };
    setParticipants(newParticipants);
  };

  const updateQuantity = (index: number, value: number) => {
    const newParticipants = [...participants];
    newParticipants[index] = { ...newParticipants[index], quantity: value };
    setParticipants(newParticipants);
  };

  const updateParachevementsPerM2 = (index: number, value: number) => {
    const newParticipants = [...participants];
    newParticipants[index] = { ...newParticipants[index], parachevementsPerM2: value };
    setParticipants(newParticipants);
  };

  const updateCascoSqm = (index: number, value: number | undefined) => {
    const newParticipants = [...participants];
    newParticipants[index] = { ...newParticipants[index], cascoSqm: value };
    setParticipants(newParticipants);
  };

  const updateParachevementsSqm = (index: number, value: number | undefined) => {
    const newParticipants = [...participants];
    newParticipants[index] = { ...newParticipants[index], parachevementsSqm: value };
    setParticipants(newParticipants);
  };

  // Portage lot operations
  const addPortageLot = (participantIndex: number, coproLots: CoproLot[] = []) => {
    // Validate against maxTotalLots constraint from projectParams
    const maxTotalLots = projectParams.maxTotalLots ?? 10;
    const validation = validateAddPortageLot(participants, coproLots, maxTotalLots);
    if (!validation.isValid) {
      toast.error(validation.error || 'Cannot add lot: Maximum total lots reached');
      return;
    }

    const participantCalc = calculations.participantBreakdown[participantIndex];
    const newParticipants = [...participants];
    const currentLots = newParticipants[participantIndex].lotsOwned || [];
    const nextLotId = currentLots.length > 0 ? Math.max(...currentLots.map(l => l.lotId)) + 1 : 1;

    // Get unitId from first lot if available, otherwise use 0 for custom portage lot
    const defaultUnitId = currentLots.length > 0 ? currentLots[0].unitId : 0;

    newParticipants[participantIndex] = {
      ...newParticipants[participantIndex],
      lotsOwned: [
        ...currentLots,
        {
          lotId: nextLotId,
          unitId: defaultUnitId,
          surface: 80,
          isPortage: true,
          allocatedSurface: 80,
          acquiredDate: new Date(deedDate),
          originalPrice: participantCalc?.purchaseShare || 0,
          originalNotaryFees: participantCalc?.droitEnregistrements || 0,
          originalConstructionCost: participantCalc?.casco || 0
        }
      ]
    };
    setParticipants(newParticipants);
  };

  const removePortageLot = (participantIndex: number, lotId: number) => {
    const newParticipants = [...participants];
    const currentLots = newParticipants[participantIndex].lotsOwned || [];
    newParticipants[participantIndex] = {
      ...newParticipants[participantIndex],
      lotsOwned: currentLots.filter(lot => lot.lotId !== lotId)
    };
    setParticipants(newParticipants);
  };

  const updatePortageLotSurface = (participantIndex: number, lotId: number, surface: number) => {
    const newParticipants = [...participants];
    const currentLots = newParticipants[participantIndex].lotsOwned || [];
    newParticipants[participantIndex] = {
      ...newParticipants[participantIndex],
      lotsOwned: currentLots.map(lot =>
        lot.lotId === lotId ? { ...lot, surface, allocatedSurface: surface } : lot
      )
    };
    setParticipants(newParticipants);
  };

  const updatePortageLotConstructionPayment = (
    participantIndex: number,
    lotId: number,
    founderPaysCasco: boolean,
    founderPaysParachèvement: boolean
  ) => {
    const newParticipants = [...participants];
    const currentLots = newParticipants[participantIndex].lotsOwned || [];
    newParticipants[participantIndex] = {
      ...newParticipants[participantIndex],
      lotsOwned: currentLots.map(lot =>
        lot.lotId === lotId
          ? { ...lot, founderPaysCasco, founderPaysParachèvement }
          : lot
      )
    };
    setParticipants(newParticipants);
  };

  return (
    <UnlockProvider>
      <Tooltip.Provider>
        {/* Toast Notifications */}
        <Toaster />

        {/* Version Mismatch Warning Modal */}
        {versionMismatch.show && (
          <VersionMismatchWarning
            storedVersion={versionMismatch.storedVersion}
            currentVersion={RELEASE_VERSION}
            onExportAndReset={handleExportAndReset}
            onDismiss={handleDismissVersionWarning}
          />
        )}

        {/* Firestore Conflict Resolution Dialog */}
        {conflictState.hasConflict && (
          <ConflictResolutionDialog
            conflictState={conflictState}
            onResolve={resolveConflict}
          />
        )}

        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-100 p-6">
          {/* Floating Unlock Button */}
          <div className="fixed top-6 left-6 z-40 no-print">
            <UnlockButton />
          </div>

          {/* Sync Status Indicator */}
          {unlockedBy && (
            <div className="fixed top-6 right-6 z-40 no-print">
              <div className="bg-white rounded-lg shadow-md px-3 py-2 text-xs">
                <div className="flex items-center gap-2">
                  {syncMode === 'firestore' && (
                    <>
                      <div className={`w-2 h-2 rounded-full ${isSyncing ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'}`} />
                      <span className="text-gray-700 font-medium">
                        {isSyncing ? 'Synchronisation...' : 'Synchronisé'}
                      </span>
                    </>
                  )}
                  {syncMode === 'localStorage' && (
                    <>
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                      <span className="text-gray-700 font-medium">Local</span>
                    </>
                  )}
                  {syncMode === 'offline' && (
                    <>
                      <div className="w-2 h-2 rounded-full bg-gray-400" />
                      <span className="text-gray-700 font-medium">Hors ligne</span>
                    </>
                  )}
                </div>
                {lastSyncedAt && syncMode === 'firestore' && (
                  <div className="text-gray-500 mt-1">
                    Dernière sync: {new Date(lastSyncedAt).toLocaleTimeString('fr-BE')}
                  </div>
                )}
                {syncError && (
                  <div className="text-red-600 mt-1">
                    ⚠️ {syncError}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="max-w-7xl mx-auto">
            {/* Print-only header */}
            <div className="print-header hidden">
              <h1 className="text-2xl font-bold">Achat Ferme du Temple - Rapport de Division</h1>
              <p className="text-sm text-gray-600 mt-2">
                Généré le {new Date().toLocaleDateString('fr-BE', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>

            <ProjectHeader
              calculations={calculations}
              participants={participants}
            />

        <VerticalToolbar
          onDownloadScenario={downloadScenario}
          onLoadScenario={loadScenario}
          onExportToExcel={exportToExcel}
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
              <p className="text-lg font-bold text-purple-700">
                {formatCurrency(calculations.sharedCosts + calculateTotalTravauxCommuns(projectParams))}
              </p>
              <p className="text-xs text-purple-500 mt-1">
                {formatCurrency((calculations.sharedCosts + calculateTotalTravauxCommuns(projectParams)) / participants.length)}/pers
              </p>
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
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Frais d'enregistrements</p>
              <p className="text-lg font-bold text-gray-900">{formatCurrency(calculations.totals.totalDroitEnregistrements)}</p>
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
              <ExpenseCategoriesManager
                expenseCategories={projectParams.expenseCategories}
                projectParams={projectParams}
                sharedCosts={calculations.sharedCosts}
                onUpdateProjectParams={setProjectParams}
                participants={participants}
                unitDetails={unitDetails}
              />
            )}

            <div className="mt-4 p-3 bg-purple-100 rounded-lg border border-purple-300">
              <div className="flex justify-between items-center">
                <p className="text-sm font-semibold text-gray-700">Total commun:</p>
                <p className="text-lg font-bold text-purple-800">
                  {formatCurrency(calculations.sharedCosts + calculateTotalTravauxCommuns(projectParams))}
                </p>
              </div>
              <p className="text-xs text-gray-600 mt-1">
                {formatCurrency((calculations.sharedCosts + calculateTotalTravauxCommuns(projectParams)) / participants.length)} par personne
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
          onOpenCoproDetails={setCoproSnapshot}
          onAddParticipant={addParticipant}
          onUpdateParticipant={updateParticipant}
          coproReservesShare={portageFormula.coproReservesShare}
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
              unitDetails={unitDetails}
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

                // Check if entry date changed
                const entryDateChanged = oldParticipant.entryDate?.getTime() !== updated.entryDate?.getTime();

                // Handle seller's lot soldDate updates
                const oldPurchase = oldParticipant.purchaseDetails;
                const newPurchase = updated.purchaseDetails;

                // If buyer has a portage lot purchase
                if (newPurchase?.buyingFrom && newPurchase?.lotId && newPurchase.buyingFrom !== 'Copropriété') {
                  const sellerIdx = newParticipants.findIndex(p => p.name === newPurchase.buyingFrom);
                  if (sellerIdx !== -1 && newParticipants[sellerIdx].lotsOwned) {
                    const seller = newParticipants[sellerIdx];

                    // Update seller's lot soldDate (always, even if date didn't change)
                    newParticipants[sellerIdx] = {
                      ...seller,
                      lotsOwned: seller.lotsOwned?.map(lot =>
                        lot.lotId === newPurchase.lotId
                          ? { ...lot, soldDate: updated.entryDate }
                          : lot
                      )
                    };

                    // ALWAYS recalculate buyer's purchase price for portage lots
                    // This ensures reactive updates when entry date changes
                    console.log('🔄 Recalculating portage price for', updated.name, {
                      oldDate: oldParticipant.entryDate?.toISOString(),
                      newDate: updated.entryDate?.toISOString(),
                      entryDateChanged,
                      oldPrice: newParticipants[idx].purchaseDetails?.purchasePrice
                    });

                    newParticipants[idx] = updateBuyerWithRecalculatedPrice(
                      newParticipants[idx],
                      newParticipants[sellerIdx],
                      deedDate,
                      portageFormula
                    );

                    console.log('✅ New purchase price:', newParticipants[idx].purchaseDetails?.purchasePrice);
                  }
                }
                // If buyer has copro purchase, just update soldDate
                else if (newPurchase?.buyingFrom === 'Copropriété' && newPurchase?.lotId) {
                  // Copro purchases don't need price recalculation
                  // They're sold at a fixed price from the copropriété inventory
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
              onUpdatePortageLotConstructionPayment={(lotId, founderPaysCasco, founderPaysParachèvement) =>
                updatePortageLotConstructionPayment(idx, lotId, founderPaysCasco, founderPaysParachèvement)}
              onRemove={() => removeParticipant(idx)}
              totalParticipants={participants.length}
            />
          );
        })()}

        {/* Copropriété detail modal */}
        {coproSnapshot && (
          <CoproDetailModal
            isOpen={true}
            onClose={() => setCoproSnapshot(null)}
            snapshot={coproSnapshot}
            coproReservesShare={portageFormula.coproReservesShare}
            allParticipants={participants}
            deedDate={deedDate}
          />
        )}

        <ParticipantsTimeline
          participants={participants}
          deedDate={deedDate}
          renovationStartDate={projectParams.renovationStartDate}
          onDeedDateChange={handleDeedDateChange}
          onRenovationStartDateChange={handleRenovationStartDateChange}
          onUpdateParticipant={updateParticipant}
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
    </UnlockProvider>
  );
}