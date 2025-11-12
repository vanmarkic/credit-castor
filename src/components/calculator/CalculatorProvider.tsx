/**
 * Calculator Provider - Data management layer for the calculator
 *
 * Responsibilities:
 * - Data initialization (Firestore → localStorage → Error)
 * - State management (participants, projectParams, etc.)
 * - Persistence (localStorage + Firestore)
 * - Calculations (derived state)
 * - Actions (mutations)
 */

import { ReactNode, useMemo, useRef, useEffect, useState } from 'react';
import { calculateAll, DEFAULT_PORTAGE_FORMULA } from '../../utils/calculatorUtils';
import { exportCalculations } from '../../utils/excelExport';
import { XlsxWriter } from '../../utils/exportWriter';
import { generateParticipantSnapshots } from '../../utils/timelineCalculations';
import { downloadScenarioFile, createFileUploadHandler } from '../../utils/scenarioFileIO';
import { DEFAULT_PARTICIPANTS, DEFAULT_PROJECT_PARAMS, DEFAULT_DEED_DATE, clearLocalStorage } from '../../utils/storage';
import { useCalculatorState } from '../../hooks/useCalculatorState';
import { useParticipantOperations } from '../../hooks/useParticipantOperations';
import { useStoragePersistence } from '../../hooks/useStoragePersistence';
import { useFirestoreSync } from '../../hooks/useFirestoreSync';
import { usePresenceDetection } from '../../hooks/usePresenceDetection';
import { useUnlock } from '../../contexts/UnlockContext';
import { initializeFirebase } from '../../services/firebase';
import { loadApplicationData } from '../../services/dataLoader';
import { saveScenarioToFirestore } from '../../services/firestoreSync';
import { syncSoldDatesFromPurchaseDetails } from '../../utils/participantSync';
import { CalculatorContext, type CalculatorContextValue } from '../../contexts/CalculatorContext';
import { MigrationModal, type MigrationData } from '../MigrationModal';
import { SimpleNotificationToast } from '../shared/NotificationToast';
import toast from 'react-hot-toast';
import type { Participant } from '../../utils/calculatorUtils';

interface CalculatorProviderProps {
  children: ReactNode;
}

const unitDetails = {
  1: { casco: 178080, parachevements: 56000 },
  3: { casco: 213060, parachevements: 67000 },
  5: { casco: 187620, parachevements: 59000 },
  6: { casco: 171720, parachevements: 54000 }
};

export function CalculatorProvider({ children }: CalculatorProviderProps) {
  // Initialize Firebase on mount
  useEffect(() => {
    initializeFirebase();
  }, []);

  // Core state management
  const state = useCalculatorState();
  const {
    participants,
    projectParams,
    deedDate,
    portageFormula,
    pinnedParticipant,
    fullscreenParticipantIndex,
    versionMismatch,
    isInitialized,
    setParticipants,
    setProjectParams,
    setDeedDate,
    setPortageFormula,
    setFullscreenParticipantIndex,
    setVersionMismatch,
    setIsInitialized,
    handlePinParticipant,
    handleUnpinParticipant,
    participantRefs
  } = state;

  // Track data loading state
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Migration modal state
  const [migrationData, setMigrationData] = useState<MigrationData | null>(null);
  const [showMigrationModal, setShowMigrationModal] = useState(false);

  // Participant operations
  const participantOps = useParticipantOperations();

  // File input ref for scenario upload
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Unlock state
  const { unlockedBy } = useUnlock();

  // Initialize data on mount - load from Firestore → localStorage → Error
  useEffect(() => {
    let mounted = true;

    async function initializeData() {
      try {
        setIsLoading(true);
        setLoadError(null);

        const result = await loadApplicationData();

        if (!mounted) return;

        if (result.success && result.data) {
          // Process participants (ensure defaults and sync sold dates)
          const processedParticipants = result.data ? syncSoldDatesFromPurchaseDetails(
            result.data.participants.map((p: Participant) => ({
              ...p,
              isFounder: p.isFounder !== undefined ? p.isFounder : true,
              entryDate: p.entryDate || new Date(result.data!.deedDate)
            }))
          ) : [];

          // Set state
          setParticipants(processedParticipants);
          setProjectParams(result.data.projectParams);
          setDeedDate(result.data.deedDate);
          setPortageFormula(result.data.portageFormula);
          setIsInitialized(true);

          console.log(`✅ Data loaded from ${result.data.source}`);

          // Handle migration scenario - show modal to select participants
          if (result.data.needsMigration && unlockedBy) {
            setMigrationData({
              participants: processedParticipants,
              projectParams: result.data.projectParams,
              deedDate: result.data.deedDate,
              portageFormula: result.data.portageFormula,
            });
            setShowMigrationModal(true);
          }
        } else {
          // Check if this is a network error that should show a toast
          if (result.errorType === 'network-error' && result.showToast) {
            console.error('❌ Network error accessing Firestore');

            // Show toast notification
            toast.custom(
              (t) => (
                <SimpleNotificationToast
                  title="Firestore inaccessible"
                  message="Es-tu connecté-e à internet ?"
                  type="error"
                  onDismiss={() => toast.dismiss(t.id)}
                />
              ),
              { duration: 8000, position: 'top-right' }
            );

            // Set error but don't block the UI
            setLoadError(result.error || 'Network error');
          } else {
            setLoadError(result.error || 'Unknown error');
            console.error('❌ Failed to load data:', result.error);
          }
        }
      } catch (error) {
        if (!mounted) return;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        setLoadError(errorMessage);
        console.error('❌ Error during data initialization:', error);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    initializeData();

    return () => {
      mounted = false;
    };
  }, []); // Run once on mount

  // Firestore sync
  const {
    syncMode,
    isSyncing,
    lastSyncedAt,
    conflictState,
    syncError,
    saveData,
    resolveConflict,
  } = useFirestoreSync(unlockedBy, true);

  // Auto-save data to Firestore when it changes (only if initialized)
  // Debounced by 500ms to batch rapid changes (e.g., typing in surface fields)
  useEffect(() => {
    if (unlockedBy && isInitialized && participants && projectParams && deedDate && portageFormula) {
      const timeoutId = setTimeout(() => {
        saveData(participants, projectParams, deedDate, portageFormula);
      }, 500);

      return () => clearTimeout(timeoutId);
    }
  }, [participants, projectParams, deedDate, portageFormula, saveData, unlockedBy, isInitialized]);

  // Presence detection
  const { activeUsers } = usePresenceDetection(unlockedBy);

  // Auto-save to localStorage (only if initialized)
  useStoragePersistence(
    participants || [],
    projectParams || DEFAULT_PROJECT_PARAMS,
    deedDate || DEFAULT_DEED_DATE,
    portageFormula || DEFAULT_PORTAGE_FORMULA,
    versionMismatch.show || !isInitialized
  );

  // Calculations (only if data is initialized)
  const calculations = useMemo(() => {
    if (!participants || !projectParams) {
      // Return empty calculations if not initialized
      return {
        totalSurface: 0,
        pricePerM2: 0,
        sharedCosts: 0,
        sharedPerPerson: 0,
        participantBreakdown: [],
        totals: {
          purchase: 0,
          totalDroitEnregistrements: 0,
          construction: 0,
          shared: 0,
          totalTravauxCommuns: 0,
          travauxCommunsPerUnit: 0,
          total: 0,
          capitalTotal: 0,
          totalLoansNeeded: 0,
          averageLoan: 0,
          averageCapital: 0
        }
      };
    }
    return calculateAll(participants, projectParams, unitDetails);
  }, [participants, projectParams, isInitialized]);

  // Actions
  const addParticipant = () => {
    if (!participants || !deedDate) return;
    const newParticipants = participantOps.addParticipant(participants, deedDate);
    setParticipants(newParticipants);

    // Scroll to newly added participant
    setTimeout(() => {
      const newIndex = participants.length;
      if (participantRefs.current[newIndex]?.scrollIntoView) {
        participantRefs.current[newIndex].scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 50);
  };

  const removeParticipant = (index: number) => {
    if (!participants || participants.length <= 1) return;
    // If removing the pinned participant, clear the pin
    if (participants[index].name === pinnedParticipant) {
      handleUnpinParticipant();
    }
    const newParticipants = participantOps.removeParticipant(participants, index);
    setParticipants(newParticipants);
  };

  const updateParticipant = (index: number, updated: Participant) => {
    if (!participants) return;
    const newParticipants = [...participants];
    const oldName = newParticipants[index].name;
    newParticipants[index] = updated;
    setParticipants(newParticipants);

    // If renaming the pinned participant, update the pin
    if (oldName === pinnedParticipant && updated.name !== oldName) {
      handlePinParticipant(updated.name);
    }
  };

  const updateParticipantName = (index: number, name: string) => {
    if (!participants) return;
    const oldName = participants[index].name;
    const newParticipants = participantOps.updateParticipantName(participants, index, name);
    setParticipants(newParticipants);

    // If renaming the pinned participant, update the pin
    if (oldName === pinnedParticipant) {
      handlePinParticipant(name);
    }
  };

  const updateParticipantSurface = (index: number, surface: number) => {
    if (!participants) return;
    const newParticipants = participantOps.updateParticipantSurface(participants, index, surface);
    setParticipants(newParticipants);
  };

  const exportToExcel = () => {
    if (!participants || !projectParams || !deedDate || !portageFormula) return;
    const writer = new XlsxWriter();

    // Generate timeline snapshots for export
    const timelineSnapshots = generateParticipantSnapshots(
      participants,
      calculations,
      deedDate,
      portageFormula
    );

    exportCalculations(
      calculations,
      projectParams,
      unitDetails,
      writer,
      undefined, // use default filename
      {
        timelineSnapshots,
        participants
      }
    );
  };

  const downloadScenario = () => {
    if (!participants || !projectParams || !deedDate || !portageFormula) return;
    downloadScenarioFile(
      participants,
      projectParams,
      deedDate,
      portageFormula,
      unitDetails,
      calculations
    );
  };

  const loadScenario = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = createFileUploadHandler(
    (data) => {
      setParticipants(data.participants);
      setProjectParams(data.projectParams);
      if (data.deedDate) {
        setDeedDate(data.deedDate);
      }
      setPortageFormula(data.portageFormula);
      setIsInitialized(true);
      alert('Scénario chargé avec succès!');
    },
    (error) => {
      alert(error);
    }
  );

  const resetToDefaults = () => {
    if (confirm('Êtes-vous sûr de vouloir réinitialiser complètement? Toutes les données seront perdues.')) {
      clearLocalStorage();
      setParticipants(DEFAULT_PARTICIPANTS);
      setProjectParams(DEFAULT_PROJECT_PARAMS);
      setDeedDate(DEFAULT_DEED_DATE);
      setPortageFormula(DEFAULT_PORTAGE_FORMULA);
      setIsInitialized(true);
      alert('Données réinitialisées aux valeurs par défaut.');
    }
  };

  // Migration handlers
  const handleMigrationConfirm = async (selectedParticipants: Participant[]) => {
    if (!unlockedBy || !migrationData) return;

    console.log('🔄 Migrating selected participants to Firestore...');

    // Only migrate the selected participants
    const migrationResult = await saveScenarioToFirestore(
      {
        participants: selectedParticipants,
        projectParams: migrationData.projectParams,
        deedDate: migrationData.deedDate,
        portageFormula: migrationData.portageFormula,
        version: 1,
      },
      unlockedBy
    );

    setShowMigrationModal(false);
    setMigrationData(null);

    if (migrationResult.success) {
      alert(`✅ Migration réussie! ${selectedParticipants.length} participant(s) migré(s) vers Firestore.`);
    } else {
      alert('❌ Échec de la migration: ' + migrationResult.error);
    }
  };

  const handleMigrationCancel = () => {
    setShowMigrationModal(false);
    setMigrationData(null);
  };

  // Context value (only created after data is loaded, so we can safely assert non-null)
  const contextValue: CalculatorContextValue = {
    state: {
      participants: participants || [],
      projectParams: projectParams || DEFAULT_PROJECT_PARAMS,
      deedDate: deedDate || DEFAULT_DEED_DATE,
      portageFormula: portageFormula || DEFAULT_PORTAGE_FORMULA,
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
    },
    actions: {
      addParticipant,
      removeParticipant,
      updateParticipant,
      updateParticipantName,
      updateParticipantSurface,
      setParticipants,
      setProjectParams,
      setDeedDate,
      setPortageFormula,
      setFullscreenParticipantIndex,
      setVersionMismatch,
      handlePinParticipant,
      handleUnpinParticipant,
      downloadScenario,
      loadScenario,
      resetToDefaults,
      exportToExcel,
      resolveConflict
    }
  };

  // Show loading state while data is being initialized
  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '18px',
        color: '#666'
      }}>
        <div>
          <div style={{ marginBottom: '10px' }}>⏳ Chargement des données...</div>
          <div style={{ fontSize: '14px', color: '#999' }}>
            Vérification Firestore → localStorage
          </div>
        </div>
      </div>
    );
  }

  // Show error state if data loading failed
  if (loadError) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '18px',
        color: '#d32f2f'
      }}>
        <div>
          <div style={{ marginBottom: '10px' }}>❌ Erreur de chargement</div>
          <div style={{ fontSize: '14px', color: '#666' }}>
            {loadError}
          </div>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: '20px',
              padding: '10px 20px',
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            Recharger la page
          </button>
        </div>
      </div>
    );
  }

  return (
    <CalculatorContext.Provider value={contextValue}>
      {children}
      {/* Hidden file input for scenario upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        style={{ display: 'none' }}
        onChange={handleFileUpload}
      />
      {/* Migration modal */}
      {showMigrationModal && migrationData && (
        <MigrationModal
          data={migrationData}
          onConfirm={handleMigrationConfirm}
          onCancel={handleMigrationCancel}
        />
      )}
    </CalculatorContext.Provider>
  );
}
