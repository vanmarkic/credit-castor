/**
 * Calculator Context - Centralized state management for calculator data
 *
 * Provides:
 * - Calculator state (participants, projectParams, deedDate, portageFormula)
 * - Mutation actions (add/remove/update participants, etc.)
 * - Persistence (localStorage + Firestore sync)
 * - Notifications and presence detection
 */

import { createContext, useContext } from 'react';
import type { Participant, ProjectParams, PortageFormulaParams, CalculationResults } from '../utils/calculatorUtils';
import type { UnitDetails } from '../utils/calculatorUtils';
import type { SyncMode, ConflictState } from '../hooks/useFirestoreSync';

/**
 * Calculator state interface
 */
export interface CalculatorState {
  // Core data
  participants: Participant[];
  projectParams: ProjectParams;
  deedDate: string;
  portageFormula: PortageFormulaParams;
  pinnedParticipant: string | null;

  // UI state
  fullscreenParticipantIndex: number | null;
  versionMismatch: {
    show: boolean;
    storedVersion?: string;
  };

  // Sync state
  syncMode: SyncMode;
  isSyncing: boolean;
  lastSyncedAt: Date | null;
  conflictState: ConflictState;
  syncError: string | null;

  // Presence
  activeUsers: Array<{ email: string; lastSeen: Date; sessionId: string }>;

  // Computed
  calculations: CalculationResults;
  unitDetails: UnitDetails;
}

/**
 * Calculator actions interface
 */
export interface CalculatorActions {
  // Participant mutations
  addParticipant: () => void;
  removeParticipant: (index: number) => void;
  updateParticipant: (index: number, updated: Participant) => void;
  updateParticipantName: (index: number, name: string) => void;
  updateParticipantSurface: (index: number, surface: number) => void;
  setParticipants: (participants: Participant[]) => void;

  // Project mutations
  setProjectParams: (params: ProjectParams) => void;
  setDeedDate: (date: string) => void;
  handleDeedDateChange: (date: string) => void;
  handleRenovationStartDateChange: (date: string) => void;
  setPortageFormula: (formula: PortageFormulaParams) => void;

  // UI mutations
  setFullscreenParticipantIndex: (index: number | null) => void;
  setVersionMismatch: (mismatch: { show: boolean; storedVersion?: string }) => void;
  handlePinParticipant: (name: string) => void;
  handleUnpinParticipant: () => void;

  // File operations
  downloadScenario: () => void;
  loadScenario: () => void;
  resetToDefaults: () => void;
  exportToExcel: () => void;

  // Sync operations
  resolveConflict: (choice: 'local' | 'remote' | 'cancel') => Promise<void>;
}

/**
 * Combined context value
 */
export interface CalculatorContextValue {
  state: CalculatorState;
  actions: CalculatorActions;
}

/**
 * Calculator context
 */
export const CalculatorContext = createContext<CalculatorContextValue | null>(null);

/**
 * Hook to access calculator context
 */
export function useCalculator() {
  const context = useContext(CalculatorContext);
  if (!context) {
    throw new Error('useCalculator must be used within CalculatorProvider');
  }
  return context;
}

/**
 * Hook to access calculator state only
 */
export function useCalculatorState() {
  const { state } = useCalculator();
  return state;
}

/**
 * Hook to access calculator actions only
 */
export function useCalculatorActions() {
  const { actions } = useCalculator();
  return actions;
}
