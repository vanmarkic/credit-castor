import { useState, useEffect, useCallback, useRef } from 'react';
import {
  saveScenarioToFirestore,
  loadScenarioFromFirestore,
  subscribeToFirestoreChanges,
  isFirestoreSyncAvailable,
  detectConflict,
  type FirestoreScenarioData,
  type FirestoreChangeEvent,
} from '../services/firestoreSync';
import { saveToLocalStorage, loadFromLocalStorage } from '../utils/storage';
import type { Participant, ProjectParams, PortageFormulaParams } from '../utils/calculatorUtils';

/**
 * Sync mode: determines whether to use Firestore or localStorage
 */
export type SyncMode = 'firestore' | 'localStorage' | 'offline';

/**
 * Conflict state
 */
export interface ConflictState {
  hasConflict: boolean;
  localData?: FirestoreScenarioData;
  remoteData?: FirestoreScenarioData;
  message?: string;
}

/**
 * Hook for syncing scenario data with Firestore
 *
 * Provides:
 * - Automatic sync to Firestore when data changes
 * - Real-time updates from Firestore
 * - Conflict detection
 * - Graceful fallback to localStorage
 *
 * @param userEmail - Email of the current user (from unlock state)
 * @param enabled - Whether sync is enabled (default: true)
 */
export function useFirestoreSync(
  userEmail: string | null,
  enabled: boolean = true
) {
  const [syncMode, setSyncMode] = useState<SyncMode>('offline');
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const [conflictState, setConflictState] = useState<ConflictState>({
    hasConflict: false,
  });
  const [syncError, setSyncError] = useState<string | null>(null);

  const localVersionRef = useRef<number>(1);
  const isSavingRef = useRef(false);

  /**
   * Initialize sync mode based on Firebase availability
   */
  useEffect(() => {
    if (!enabled) {
      setSyncMode('offline');
      return;
    }

    if (isFirestoreSyncAvailable()) {
      setSyncMode('firestore');
      console.log('🔥 Firestore sync enabled');
    } else {
      setSyncMode('localStorage');
      console.log('💾 Using localStorage (Firestore not configured)');
    }
  }, [enabled]);

  /**
   * Load initial data from Firestore or localStorage
   */
  const loadInitialData = useCallback(async (): Promise<{
    participants: Participant[];
    projectParams: ProjectParams;
    deedDate: string;
    portageFormula: PortageFormulaParams;
  } | null> => {
    if (syncMode === 'firestore') {
      const result = await loadScenarioFromFirestore();
      if (result.success && result.data) {
        localVersionRef.current = result.data.version;
        setLastSyncedAt(new Date());
        return {
          participants: result.data.participants,
          projectParams: result.data.projectParams,
          deedDate: result.data.deedDate,
          portageFormula: result.data.portageFormula,
        };
      }
    }

    // Fallback to localStorage
    const localData = loadFromLocalStorage();
    if (localData) {
      return {
        participants: localData.participants,
        projectParams: localData.projectParams,
        deedDate: localData.deedDate,
        portageFormula: localData.portageFormula,
      };
    }

    return null;
  }, [syncMode]);

  /**
   * Save data to Firestore and/or localStorage
   */
  const saveData = useCallback(
    async (
      participants: Participant[],
      projectParams: ProjectParams,
      deedDate: string,
      portageFormula: PortageFormulaParams
    ): Promise<{ success: boolean; error?: string }> => {
      // Prevent concurrent saves
      if (isSavingRef.current) {
        return { success: false, error: 'Sauvegarde déjà en cours' };
      }

      isSavingRef.current = true;
      setIsSyncing(true);
      setSyncError(null);

      try {
        // Always save to localStorage as backup
        saveToLocalStorage(participants, projectParams, deedDate, portageFormula);

        // If Firestore sync is enabled and user is authenticated
        if (syncMode === 'firestore' && userEmail) {
          localVersionRef.current += 1;

          const result = await saveScenarioToFirestore(
            {
              participants,
              projectParams,
              deedDate,
              portageFormula,
              version: localVersionRef.current,
            },
            userEmail
          );

          if (result.success) {
            setLastSyncedAt(new Date());
            return { success: true };
          } else {
            setSyncError(result.error || 'Erreur de synchronisation');
            return { success: false, error: result.error };
          }
        }

        // localStorage-only mode
        return { success: true };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
        setSyncError(errorMessage);
        return { success: false, error: errorMessage };
      } finally {
        isSavingRef.current = false;
        setIsSyncing(false);
      }
    },
    [syncMode, userEmail]
  );

  /**
   * Subscribe to real-time Firestore updates
   */
  useEffect(() => {
    if (syncMode !== 'firestore' || !enabled) {
      return;
    }

    const unsubscribe = subscribeToFirestoreChanges((event: FirestoreChangeEvent) => {
      // Skip if this is our own local write
      if (event.source === 'local') {
        return;
      }

      // Skip first load (already handled by loadInitialData)
      if (event.isFirstLoad) {
        return;
      }

      // Detect conflicts
      const conflict = detectConflict(localVersionRef.current, event.data.version);
      if (conflict.hasConflict) {
        console.warn('⚠️ Conflict detected:', conflict.message);
        setConflictState({
          hasConflict: true,
          remoteData: event.data,
          message: conflict.message,
        });
      } else {
        // Update local version
        localVersionRef.current = event.data.version;
        setLastSyncedAt(new Date());
      }
    });

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [syncMode, enabled]);

  /**
   * Resolve conflict by choosing local or remote data
   */
  const resolveConflict = useCallback(
    async (choice: 'local' | 'remote' | 'cancel'): Promise<void> => {
      if (!conflictState.hasConflict) {
        return;
      }

      if (choice === 'cancel') {
        setConflictState({ hasConflict: false });
        return;
      }

      if (choice === 'remote' && conflictState.remoteData) {
        // Accept remote changes
        const { participants, projectParams, deedDate, portageFormula } =
          conflictState.remoteData;

        // Save to localStorage
        saveToLocalStorage(participants, projectParams, deedDate, portageFormula);

        // Update local version
        localVersionRef.current = conflictState.remoteData.version;
        setConflictState({ hasConflict: false });
        setLastSyncedAt(new Date());

        // Trigger a page reload to reflect changes
        window.location.reload();
      } else if (choice === 'local') {
        // Keep local changes (user will need to save again)
        setConflictState({ hasConflict: false });
      }
    },
    [conflictState]
  );

  return {
    syncMode,
    isSyncing,
    lastSyncedAt,
    conflictState,
    syncError,
    loadInitialData,
    saveData,
    resolveConflict,
  };
}
