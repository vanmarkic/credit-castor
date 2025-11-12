/**
 * Calculator Provider - Data management layer for the calculator
 *
 * Responsibilities:
 * - State management (participants, projectParams, etc.)
 * - Persistence (localStorage + Firestore)
 * - Calculations (derived state)
 * - Actions (mutations)
 */

import { ReactNode, useMemo, useRef, useEffect } from 'react';
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
import { CalculatorContext, type CalculatorContextValue } from '../../contexts/CalculatorContext';
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
    setParticipants,
    setProjectParams,
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

  // File input ref for scenario upload
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Unlock state
  const { unlockedBy } = useUnlock();

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

  // Auto-save data to Firestore when it changes
  useEffect(() => {
    if (unlockedBy) {
      saveData(participants, projectParams, deedDate, portageFormula);
    }
  }, [participants, projectParams, deedDate, portageFormula, saveData, unlockedBy]);

  // Presence detection
  const { activeUsers } = usePresenceDetection(unlockedBy);

  // Auto-save to localStorage
  useStoragePersistence(
    participants,
    projectParams,
    deedDate,
    portageFormula,
    versionMismatch.show
  );

  // Calculations
  const calculations = useMemo(() => {
    return calculateAll(participants, projectParams, unitDetails);
  }, [participants, projectParams]);

  // Actions
  const addParticipant = () => {
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
    if (participants.length > 1) {
      // If removing the pinned participant, clear the pin
      if (participants[index].name === pinnedParticipant) {
        handleUnpinParticipant();
      }
      const newParticipants = participantOps.removeParticipant(participants, index);
      setParticipants(newParticipants);
    }
  };

  const updateParticipant = (index: number, updated: Participant) => {
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

  const exportToExcel = () => {
    const writer = new XlsxWriter();

    // Generate timeline snapshots for export
    const timelineSnapshots = generateParticipantSnapshots(
      participants,
      calculations,
      deedDate,
      portageFormula || DEFAULT_PORTAGE_FORMULA
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
      alert('Données réinitialisées aux valeurs par défaut.');
    }
  };

  // Context value
  const contextValue: CalculatorContextValue = {
    state: {
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
    </CalculatorContext.Provider>
  );
}
