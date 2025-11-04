/**
 * Calculator state management hook
 * Centralizes all state initialization and management for the calculator
 */

import { useState, useMemo, useRef } from 'react';
import {
  DEFAULT_PARTICIPANTS,
  DEFAULT_PROJECT_PARAMS,
  DEFAULT_DEED_DATE,
  loadFromLocalStorage,
  loadPinnedParticipant,
  savePinnedParticipant,
  clearPinnedParticipant
} from '../utils/storage';
import { DEFAULT_PORTAGE_FORMULA } from '../utils/calculatorUtils';
import type { Participant, ProjectParams, PortageFormulaParams, CalculationResults } from '../utils/calculatorUtils';
import { syncSoldDatesFromPurchaseDetails } from '../utils/participantSync';

export interface CalculatorState {
  // State values
  participants: Participant[];
  projectParams: ProjectParams;
  // scenario removed - no longer using percentage-based adjustments
  deedDate: string;
  portageFormula: PortageFormulaParams;
  pinnedParticipant: string | null;
  fullscreenParticipantIndex: number | null;
  versionMismatch: { show: boolean; storedVersion?: string };

  // State setters
  setParticipants: (participants: Participant[]) => void;
  setProjectParams: (params: ProjectParams) => void;
  // setScenario removed
  setDeedDate: (date: string) => void;
  setPortageFormula: (formula: PortageFormulaParams) => void;
  setPinnedParticipant: (name: string | null) => void;
  setFullscreenParticipantIndex: (index: number | null) => void;
  setVersionMismatch: (mismatch: { show: boolean; storedVersion?: string }) => void;

  // Helper methods
  handlePinParticipant: (participantName: string) => void;
  handleUnpinParticipant: () => void;

  // Refs
  participantRefs: React.MutableRefObject<(HTMLDivElement | null)[]>;
}

/**
 * Initialize participants from localStorage with version compatibility check
 */
function initializeParticipants(
  setVersionMismatch: (mismatch: { show: boolean; storedVersion?: string }) => void
): Participant[] {
  const stored = loadFromLocalStorage();

  // Check version compatibility
  if (stored && !stored.isCompatible) {
    setVersionMismatch({
      show: true,
      storedVersion: stored.storedVersion
    });
    // Return defaults for now, will be reset after user action
    return DEFAULT_PARTICIPANTS.map((p: Participant) => ({
      ...p,
      isFounder: true,
      entryDate: new Date(DEFAULT_DEED_DATE)
    }));
  }

  const baseParticipants = stored ? stored.participants : DEFAULT_PARTICIPANTS;

  // Ensure all participants have isFounder and entryDate
  const participantsWithDefaults = baseParticipants.map((p: Participant) => ({
    ...p,
    isFounder: p.isFounder !== undefined ? p.isFounder : true,
    entryDate: p.entryDate || new Date(stored?.deedDate || DEFAULT_DEED_DATE)
  }));

  // Sync soldDate fields from purchaseDetails
  return syncSoldDatesFromPurchaseDetails(participantsWithDefaults);
}

/**
 * Hook that manages all calculator state
 */
export function useCalculatorState(): CalculatorState {
  const [versionMismatch, setVersionMismatch] = useState<{
    show: boolean;
    storedVersion?: string;
  }>({ show: false });

  const [participants, setParticipants] = useState<Participant[]>(() =>
    initializeParticipants(setVersionMismatch)
  );

  const [pinnedParticipant, setPinnedParticipant] = useState<string | null>(() =>
    loadPinnedParticipant()
  );

  const [fullscreenParticipantIndex, setFullscreenParticipantIndex] = useState<number | null>(null);

  const participantRefs = useRef<(HTMLDivElement | null)[]>([]);

  const [projectParams, setProjectParams] = useState<ProjectParams>(() => {
    const stored = loadFromLocalStorage();
    return stored ? stored.projectParams : DEFAULT_PROJECT_PARAMS;
  });

  // scenario state removed - no longer using percentage-based adjustments

  const [deedDate, setDeedDate] = useState<string>(() => {
    const stored = loadFromLocalStorage();
    return stored?.deedDate || DEFAULT_DEED_DATE;
  });

  const [portageFormula, setPortageFormula] = useState<PortageFormulaParams>(() => {
    const stored = loadFromLocalStorage();
    return stored?.portageFormula || DEFAULT_PORTAGE_FORMULA;
  });

  const handlePinParticipant = (participantName: string) => {
    savePinnedParticipant(participantName);
    setPinnedParticipant(participantName);
  };

  const handleUnpinParticipant = () => {
    clearPinnedParticipant();
    setPinnedParticipant(null);
  };

  return {
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
    setPinnedParticipant,
    setFullscreenParticipantIndex,
    setVersionMismatch,
    handlePinParticipant,
    handleUnpinParticipant,
    participantRefs
  };
}

/**
 * Helper hook to get ordered participant breakdown
 */
export function useOrderedParticipantBreakdown(
  calculations: CalculationResults,
  pinnedParticipant: string | null
) {
  return useMemo(() => {
    if (!pinnedParticipant) {
      return calculations.participantBreakdown;
    }

    const pinnedIndex = calculations.participantBreakdown.findIndex(
      (p) => p.name === pinnedParticipant
    );

    if (pinnedIndex === -1) {
      return calculations.participantBreakdown;
    }

    const reordered = [...calculations.participantBreakdown];
    const [pinnedItem] = reordered.splice(pinnedIndex, 1);
    reordered.unshift(pinnedItem);

    return reordered;
  }, [calculations.participantBreakdown, pinnedParticipant]);
}
