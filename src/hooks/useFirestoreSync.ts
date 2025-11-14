import { useState, useEffect, useCallback, useRef } from 'react';
import {
  saveScenarioToFirestore,
  updateScenarioFields,
  updateParticipantFields,
  loadScenarioFromFirestore,
  loadParticipantsFromSubcollection,
  subscribeToFirestoreChanges,
  subscribeToAllParticipants,
  saveParticipantToSubcollection,
  isFirestoreSyncAvailable,
  detectConflict,
  type FirestoreScenarioData,
  type FirestoreChangeEvent,
  type TrackableField,
} from '../services/firestoreSync';
import { getDb } from '../services/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { saveToLocalStorage, loadFromLocalStorage } from '../utils/storage';
import { detectChangedParticipants, syncChangedParticipants } from '../services/participantSyncCoordinator';
import type { Participant, ProjectParams, PortageFormulaParams } from '../utils/calculatorUtils';

/**
 * Convert field names to human-readable French labels
 */
function getFieldLabel(field: TrackableField): string {
  const labels: Record<TrackableField, string> = {
    projectParams: 'Paramètres du projet',
    deedDate: 'Date d\'acte',
    portageFormula: 'Formule de portage',
    participants: 'Participants',
  };
  return labels[field];
}

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
 * @param onSyncSuccess - Optional callback when sync succeeds (for toast notifications)
 * @param onRemoteDataAccepted - Optional callback when user accepts remote data (to update React state without reload)
 */
export function useFirestoreSync(
  userEmail: string | null,
  enabled: boolean = true,
  onSyncSuccess?: (message: string, fields: TrackableField[]) => void,
  onRemoteDataAccepted?: (data: {
    participants: Participant[];
    projectParams: ProjectParams;
    deedDate: string;
    portageFormula: PortageFormulaParams;
  }) => void
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
  const [useSubcollection, setUseSubcollection] = useState(false);
  const prevParticipantsRef = useRef<Participant[]>([]);

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
      // Check if using subcollection
      const db = getDb();
      if (db) {
        try {
          const projectRef = doc(db, 'projects', 'shared-project');
          const projectDoc = await getDoc(projectRef);

          if (projectDoc.exists()) {
            const data = projectDoc.data() as any;
            const usesSubcoll = data.participantsInSubcollection === true;
            setUseSubcollection(usesSubcoll);

            if (usesSubcoll) {
              // Load separately
              const participantsResult = await loadParticipantsFromSubcollection('shared-project');
              const projectResult = await loadScenarioFromFirestore();

              if (participantsResult.success && projectResult.success && projectResult.data) {
                localVersionRef.current = projectResult.data.version;
                setLastSyncedAt(new Date());
                const loadedParticipants = participantsResult.participants || [];
                prevParticipantsRef.current = [...loadedParticipants];
                return {
                  participants: loadedParticipants,
                  projectParams: projectResult.data.projectParams,
                  deedDate: projectResult.data.deedDate,
                  portageFormula: projectResult.data.portageFormula,
                };
              }
            }
          }
        } catch (err) {
          console.error('Error checking subcollection:', err);
        }
      }

      // Legacy: load from array
      const result = await loadScenarioFromFirestore();
      if (result.success && result.data) {
        localVersionRef.current = result.data.version;
        setLastSyncedAt(new Date());
        const loadedParticipants = result.data.participants;
        prevParticipantsRef.current = [...loadedParticipants];
        return {
          participants: loadedParticipants,
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
   *
   * Strategy:
   * - If only simple fields changed: use updateDoc (granular)
   * - If only one participant changed AND subcollection mode: use updateParticipantFields (granular)
   * - Otherwise: use setDoc (full save)
   *
   * @param dirtyFields - Optional list of changed fields for optimization
   */
  const saveData = useCallback(
    async (
      participants: Participant[],
      projectParams: ProjectParams,
      deedDate: string,
      portageFormula: PortageFormulaParams,
      dirtyFields?: TrackableField[]
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
          // Re-check subcollection status before each save (in case it changed)
          let currentUseSubcollection = useSubcollection;
          const db = getDb();
          if (db) {
            try {
              const projectRef = doc(db, 'projects', 'shared-project');
              const projectDoc = await getDoc(projectRef);
              if (projectDoc.exists()) {
                const data = projectDoc.data() as any;
                const usesSubcoll = data.participantsInSubcollection === true;
                currentUseSubcollection = usesSubcoll;
                if (usesSubcoll !== useSubcollection) {
                  console.log('🔄 Updating subcollection mode:', usesSubcoll);
                  setUseSubcollection(usesSubcoll);
                }
              }
            } catch (err) {
              console.error('Error checking subcollection status:', err);
            }
          }

          // Determine if we can use field-level update
          const participantsChanged = !dirtyFields || dirtyFields.includes('participants');

          // Try granular participant update if:
          // 1. Participants changed
          // 2. Subcollection mode is enabled
          // 3. At least one participant changed (batched sync handles multiple changes efficiently)
          //
          // IMPORTANT: When using subcollections, each participant is a separate document.
          // - Changed participants are updated via syncChangedParticipants (batched granular update)
          // - Unchanged participants remain untouched in their subcollection documents
          // - Atomic batch write ensures all-or-nothing consistency
          // This follows Firestore best practices: only update what changed, leave others untouched
          console.log('🔍 Granular sync check:', {
            participantsChanged,
            useSubcollection: currentUseSubcollection,
            prevParticipantsLength: prevParticipantsRef.current.length,
            canUseGranular: participantsChanged && currentUseSubcollection && prevParticipantsRef.current.length > 0
          });

          if (participantsChanged && currentUseSubcollection && prevParticipantsRef.current.length > 0) {
            const changedIndices = detectChangedParticipants(prevParticipantsRef.current, participants);
            console.log('🔍 Changed participants detected:', changedIndices);

            if (changedIndices.length > 0) {
              // Use batched sync for granular participant updates
              // This handles 1+ changed participants efficiently with atomic batch writes
              const effectiveUserEmail = userEmail || 'participant-edit';

              const result = await syncChangedParticipants(
                prevParticipantsRef.current,
                participants,
                'shared-project',
                effectiveUserEmail
              );

              if (result.success) {
                prevParticipantsRef.current = [...participants];
                setLastSyncedAt(new Date());

                // Log which participants were synced
                console.log(`✅ Batched participant sync: ${result.syncedCount}/${participants.length} participants updated`);
                if (result.syncedParticipantIds.length > 0) {
                  console.log(`   Updated participants: ${result.syncedParticipantIds.join(', ')}`);
                }

                // Trigger toast notification
                if (onSyncSuccess) {
                  const message = result.syncedCount === 1
                    ? `Participant ${result.syncedParticipantIds[0]}`
                    : `${result.syncedCount} participants`;
                  onSyncSuccess(message, ['participants']);
                }

                return { success: true };
              } else {
                // Fallback to full save on error
                console.warn('⚠️ Batched participant sync failed, falling back to full save:', result.error);
              }
            }
          }

          // If only simple fields changed (not participants), use granular update
          if (!participantsChanged && dirtyFields && dirtyFields.length > 0) {
            // Use granular update (only changed fields)
            // IMPORTANT: Always include complete projectParams to ensure all fields are saved
            const fieldsToUpdate: any = {
              projectParams: projectParams, // Always save complete projectParams
            };

            if (dirtyFields.includes('deedDate')) {
              fieldsToUpdate.deedDate = deedDate;
            }
            if (dirtyFields.includes('portageFormula')) {
              fieldsToUpdate.portageFormula = portageFormula;
            }

            // Use first participant's name as fallback if no email is set
            const effectiveUserEmail = userEmail || 
              (participants && participants.length > 0 && participants[0].name) || 
              'participant-edit';

            const result = await updateScenarioFields(
              fieldsToUpdate,
              effectiveUserEmail,
              localVersionRef.current
            );

            if (result.success) {
              localVersionRef.current += 1;
              setLastSyncedAt(new Date());
              console.log(`✅ Granular update: ${result.updatedFields.join(', ')}`);

              // Trigger toast notification with updated fields
              if (onSyncSuccess) {
                const fieldLabels = result.updatedFields.map(getFieldLabel);
                const message = fieldLabels.length === 1
                  ? fieldLabels[0]
                  : fieldLabels.join(', ');
                onSyncSuccess(message, result.updatedFields);
              }

              return { success: true };
            } else {
              // Fallback to full save on conflict or error
              console.warn('⚠️ Granular update failed, falling back to full save');
            }
          }

          // Full document save (multiple participants changed, or fallback)
          prevParticipantsRef.current = [...participants];
          localVersionRef.current += 1;

          // Use first participant's name as fallback if no email is set
          const effectiveUserEmail = userEmail || 
            (participants && participants.length > 0 && participants[0].name) || 
            'participant-edit';

          const result = await saveScenarioToFirestore(
            {
              participants,
              projectParams,
              deedDate,
              portageFormula,
              version: localVersionRef.current,
            },
            effectiveUserEmail
          );

          if (result.success) {
            setLastSyncedAt(new Date());
            console.log('✅ Full document save');
            return { success: true };
          } else {
            setSyncError(result.error || 'Erreur de synchronisation');
            return { success: false, error: result.error };
          }
        }

        // localStorage-only mode
        prevParticipantsRef.current = [...participants];
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
    [syncMode, userEmail, useSubcollection, onSyncSuccess]
  );

  /**
   * Subscribe to real-time Firestore updates
   */
  useEffect(() => {
    if (syncMode !== 'firestore' || !enabled) {
      return;
    }

    if (useSubcollection) {
      // Subscribe to project document (without participants)
      const unsubscribeProject = subscribeToFirestoreChanges((event: FirestoreChangeEvent) => {
        if (event.source === 'local' || event.isFirstLoad) {
          return;
        }

        const conflict = detectConflict(localVersionRef.current, event.data.version);
        if (conflict.hasConflict) {
          console.warn('⚠️ Project conflict detected:', conflict.message);
          setConflictState({
            hasConflict: true,
            remoteData: event.data,
            message: conflict.message,
          });
        } else {
          localVersionRef.current = event.data.version;
          setLastSyncedAt(new Date());
        }
      });

      // Subscribe to all participants in subcollection
      const unsubscribeParticipants = subscribeToAllParticipants(
        'shared-project',
        (_participants, source) => {
          if (source === 'remote') {
            console.log('🔄 Remote participant update detected');
            // Note: The actual state update would happen in the parent component
            // This is just for logging and monitoring
            setLastSyncedAt(new Date());
          }
        }
      );

      return () => {
        if (unsubscribeProject) {
          unsubscribeProject();
        }
        if (unsubscribeParticipants) {
          unsubscribeParticipants();
        }
      };
    } else {
      // Legacy: subscribe to full document
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
    }
  }, [syncMode, enabled, useSubcollection]);

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

        // Update React state via callback (no reload needed!)
        if (onRemoteDataAccepted) {
          onRemoteDataAccepted({
            participants,
            projectParams,
            deedDate,
            portageFormula,
          });
        } else {
          // Fallback: reload if no callback provided (backward compatibility)
          window.location.reload();
        }
      } else if (choice === 'local') {
        // Keep local changes (user will need to save again)
        setConflictState({ hasConflict: false });
      }
    },
    [conflictState, onRemoteDataAccepted]
  );

  /**
   * Save single participant to subcollection
   * Only works if useSubcollection is true
   */
  const saveParticipant = useCallback(
    async (
      participant: Participant,
      participantIndex: number
    ): Promise<{ success: boolean; error?: string }> => {
      if (!useSubcollection) {
        return {
          success: false,
          error: 'Subcollection mode not enabled',
        };
      }

      if (!userEmail) {
        return {
          success: false,
          error: 'User email required',
        };
      }

      try {
        const result = await saveParticipantToSubcollection(
          participant,
          participantIndex.toString(),
          'shared-project',
          userEmail
        );

        if (result.success) {
          console.log(`✅ Saved participant ${participantIndex} to subcollection`);
        }

        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
        return { success: false, error: errorMessage };
      }
    },
    [useSubcollection, userEmail]
  );

  return {
    syncMode,
    isSyncing,
    lastSyncedAt,
    conflictState,
    syncError,
    useSubcollection,
    loadInitialData,
    saveData,
    saveParticipant,
    resolveConflict,
  };
}
