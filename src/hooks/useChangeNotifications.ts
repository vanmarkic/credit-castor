import { useState, useEffect, useCallback, useRef } from 'react';
import { STORAGE_KEY } from '../utils/storage';
import { getUnlockState } from './useUnlockState';

/**
 * Types of changes that can occur
 */
export type ChangeType =
  | 'participant_added'
  | 'participant_removed'
  | 'participant_modified'
  | 'project_params_modified'
  | 'portage_formula_modified'
  | 'deed_date_modified'
  | 'unknown';

/**
 * Represents a detected change
 */
export interface ChangeEvent {
  /** Type of change */
  type: ChangeType;
  /** French description of the change */
  description: string;
  /** Email of user who made the change (if available) */
  changedBy: string | null;
  /** Timestamp of the change */
  timestamp: Date;
  /** Detailed change information */
  details?: Record<string, unknown>;
}

/**
 * Configuration for change notifications
 */
interface ChangeNotificationConfig {
  /** LocalStorage key to monitor */
  storageKey?: string;
  /** Whether to notify on initial load */
  notifyOnInitialLoad?: boolean;
}

const DEFAULT_CONFIG: Required<ChangeNotificationConfig> = {
  storageKey: STORAGE_KEY,
  notifyOnInitialLoad: false,
};

/**
 * Parse scenario data from localStorage
 */
function loadScenarioData(storageKey: string): Record<string, unknown> | null {
  try {
    const data = localStorage.getItem(storageKey);
    if (!data) return null;
    return JSON.parse(data);
  } catch (error) {
    console.error('Failed to load scenario data:', error);
    return null;
  }
}

/**
 * Compare two data snapshots and detect changes
 */
function detectChanges(
  oldData: Record<string, unknown> | null,
  newData: Record<string, unknown> | null
): ChangeEvent[] {
  if (!oldData || !newData) return [];

  const changes: ChangeEvent[] = [];
  const unlockState = getUnlockState();
  const changedBy = unlockState.unlockedBy || null;
  const timestamp = new Date();

  // Check participants
  const oldParticipants = (oldData.participants || []) as Array<{ name: string }>;
  const newParticipants = (newData.participants || []) as Array<{ name: string }>;

  // Participant added
  if (newParticipants.length > oldParticipants.length) {
    const addedNames = newParticipants
      .slice(oldParticipants.length)
      .map((p) => p.name)
      .join(', ');

    changes.push({
      type: 'participant_added',
      description: `Participant ajouté : ${addedNames}`,
      changedBy,
      timestamp,
      details: { addedNames },
    });
  }

  // Participant removed
  if (newParticipants.length < oldParticipants.length) {
    const removedCount = oldParticipants.length - newParticipants.length;
    changes.push({
      type: 'participant_removed',
      description: `${removedCount} participant(s) supprimé(s)`,
      changedBy,
      timestamp,
      details: { removedCount },
    });
  }

  // Participant modified (check by stringification as simple heuristic)
  if (
    newParticipants.length === oldParticipants.length &&
    JSON.stringify(oldParticipants) !== JSON.stringify(newParticipants)
  ) {
    changes.push({
      type: 'participant_modified',
      description: 'Données participant modifiées',
      changedBy,
      timestamp,
    });
  }

  // Project params modified
  if (
    oldData.projectParams &&
    newData.projectParams &&
    JSON.stringify(oldData.projectParams) !== JSON.stringify(newData.projectParams)
  ) {
    changes.push({
      type: 'project_params_modified',
      description: 'Paramètres projet modifiés',
      changedBy,
      timestamp,
    });
  }

  // Portage formula modified
  if (
    oldData.portageFormula &&
    newData.portageFormula &&
    JSON.stringify(oldData.portageFormula) !== JSON.stringify(newData.portageFormula)
  ) {
    changes.push({
      type: 'portage_formula_modified',
      description: 'Formule de portage modifiée',
      changedBy,
      timestamp,
    });
  }

  // Deed date modified
  if (oldData.deedDate !== newData.deedDate) {
    changes.push({
      type: 'deed_date_modified',
      description: 'Date acte notarié modifiée',
      changedBy,
      timestamp,
      details: { oldDate: oldData.deedDate, newDate: newData.deedDate },
    });
  }

  return changes;
}

/**
 * Hook for detecting and notifying about data changes from other browser tabs.
 *
 * For Phase 2: Uses localStorage + StorageEvent for cross-tab communication
 * For Phase 3: Can be upgraded to Firestore real-time listeners
 *
 * @example
 * ```tsx
 * const { changes, clearChanges } = useChangeNotifications();
 *
 * useEffect(() => {
 *   if (changes.length > 0) {
 *     changes.forEach(change => {
 *       toast.custom(<ChangeToast change={change} />);
 *     });
 *     clearChanges();
 *   }
 * }, [changes]);
 * ```
 */
export function useChangeNotifications(config: ChangeNotificationConfig = {}) {
  const { storageKey, notifyOnInitialLoad } = { ...DEFAULT_CONFIG, ...config };

  const [changes, setChanges] = useState<ChangeEvent[]>([]);
  const previousDataRef = useRef<Record<string, unknown> | null>(null);
  const isInitialLoadRef = useRef(true);

  /**
   * Clear all pending changes
   */
  const clearChanges = useCallback(() => {
    setChanges([]);
  }, []);

  /**
   * Manually check for changes
   */
  const checkForChanges = useCallback(() => {
    const currentData = loadScenarioData(storageKey);
    if (!currentData) return;

    // Skip detection on initial load if configured
    if (isInitialLoadRef.current && !notifyOnInitialLoad) {
      previousDataRef.current = currentData;
      isInitialLoadRef.current = false;
      return;
    }

    // Detect changes
    const detectedChanges = detectChanges(previousDataRef.current, currentData);
    if (detectedChanges.length > 0) {
      setChanges((prev) => [...prev, ...detectedChanges]);
    }

    // Update reference
    previousDataRef.current = currentData;
    isInitialLoadRef.current = false;
  }, [storageKey, notifyOnInitialLoad]);

  /**
   * Handle storage events from other tabs
   */
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === storageKey && event.newValue) {
        checkForChanges();
      }
    };

    // Load initial data
    previousDataRef.current = loadScenarioData(storageKey);

    // Listen for storage events
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [storageKey, checkForChanges]);

  return {
    /** List of detected changes */
    changes,
    /** Clear all pending changes */
    clearChanges,
    /** Manually trigger change detection */
    checkForChanges,
  };
}
