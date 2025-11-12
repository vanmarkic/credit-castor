/**
 * Calculator state management hook
 * Centralizes all state initialization and management for the calculator
 *
 * NOTE: Initial data loading is now handled by CalculatorProvider using dataLoader.ts
 * This hook only manages the state after initialization
 */

import { useState, useMemo, useRef } from 'react';
import {
  loadPinnedParticipant,
  savePinnedParticipant,
  clearPinnedParticipant
} from '../utils/storage';
import type { Participant, ProjectParams, PortageFormulaParams, CalculationResults } from '../utils/calculatorUtils';

export interface CalculatorState {
  // State values
  participants: Participant[] | null; // null = not yet initialized
  projectParams: ProjectParams | null; // null = not yet initialized
  deedDate: string | null; // null = not yet initialized
  portageFormula: PortageFormulaParams | null; // null = not yet initialized
  pinnedParticipant: string | null;
  fullscreenParticipantIndex: number | null;
  versionMismatch: { show: boolean; storedVersion?: string };
  isInitialized: boolean; // Track if data has been loaded

  // State setters
  setParticipants: (participants: Participant[]) => void;
  setProjectParams: (params: ProjectParams) => void;
  setDeedDate: (date: string) => void;
  setPortageFormula: (formula: PortageFormulaParams) => void;
  setPinnedParticipant: (name: string | null) => void;
  setFullscreenParticipantIndex: (index: number | null) => void;
  setVersionMismatch: (mismatch: { show: boolean; storedVersion?: string }) => void;
  setIsInitialized: (initialized: boolean) => void;

  // Helper methods
  handlePinParticipant: (participantName: string) => void;
  handleUnpinParticipant: () => void;

  // Refs
  participantRefs: React.MutableRefObject<(HTMLDivElement | null)[]>;
}

/**
 * Hook that manages all calculator state
 * Data initialization is handled externally by CalculatorProvider
 */
export function useCalculatorState(): CalculatorState {
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  const [versionMismatch, setVersionMismatch] = useState<{
    show: boolean;
    storedVersion?: string;
  }>({ show: false });

  // Initialize to null - will be set by CalculatorProvider after data loads
  const [participants, setParticipants] = useState<Participant[] | null>(null);

  const [pinnedParticipant, setPinnedParticipant] = useState<string | null>(() =>
    loadPinnedParticipant()
  );

  const [fullscreenParticipantIndex, setFullscreenParticipantIndex] = useState<number | null>(null);

  const participantRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Initialize to null - will be set by CalculatorProvider after data loads
  const [projectParams, setProjectParams] = useState<ProjectParams | null>(null);

  // Initialize to null - will be set by CalculatorProvider after data loads
  const [deedDate, setDeedDate] = useState<string | null>(null);

  // Initialize to null - will be set by CalculatorProvider after data loads
  const [portageFormula, setPortageFormula] = useState<PortageFormulaParams | null>(null);

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
    setPinnedParticipant,
    setFullscreenParticipantIndex,
    setVersionMismatch,
    setIsInitialized,
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
