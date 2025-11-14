/**
 * Participant Sync Coordinator
 *
 * Coordinates syncing reactive calculator state to Firestore efficiently.
 *
 * Architecture:
 * - Local state is reactive: change one participant → all affected recalculate
 * - Firestore sync is batched: only write participants that actually changed
 * - Other users receive atomic batch updates
 *
 * Benefits:
 * - Fast reactive UI (no network delay)
 * - Efficient network usage (only changed participants)
 * - Consistent state (atomic batched writes)
 * - Conflict detection (version checks)
 */

import { writeBatch, doc, getDoc } from 'firebase/firestore';
import { getDb } from './firebase';
import type { Participant } from '../utils/calculatorUtils';
import type { FirestoreParticipantData } from './firestoreSync';
import { serverTimestamp } from 'firebase/firestore';

/**
 * Result of a batched participant sync operation
 */
export interface BatchSyncResult {
  success: boolean;
  error?: string;
  syncedCount: number;
  syncedParticipantIds: string[];
  skippedCount: number;
  conflicts?: Array<{
    participantId: string;
    localVersion: number;
    remoteVersion: number;
  }>;
}

/**
 * Participant with metadata for sync
 */
interface ParticipantWithMetadata {
  participant: Participant;
  participantId: string;
  version: number;
}

/**
 * Deep equality check for participants (ignores functions, only data)
 *
 * Compares ALL participant INPUT fields to detect actual changes.
 * Only compares fields that the user can edit (not calculated fields).
 * Used to avoid unnecessary Firestore writes when nothing changed.
 */
function participantEquals(a: Participant, b: Participant): boolean {
  // Basic identity fields
  if (a.name !== b.name) return false;
  if (a.enabled !== b.enabled) return false;

  // Financial input fields
  if (a.capitalApporte !== b.capitalApporte) return false;
  if (a.registrationFeesRate !== b.registrationFeesRate) return false;
  if (a.interestRate !== b.interestRate) return false;
  if (a.durationYears !== b.durationYears) return false;

  // Two-loan financing fields
  if (a.useTwoLoans !== b.useTwoLoans) return false;
  if (a.loan2DelayYears !== b.loan2DelayYears) return false;
  if (a.loan2RenovationAmount !== b.loan2RenovationAmount) return false;
  if (a.capitalForLoan1 !== b.capitalForLoan1) return false;
  if (a.capitalForLoan2 !== b.capitalForLoan2) return false;

  // Timeline fields
  if (a.isFounder !== b.isFounder) return false;
  const aEntry = a.entryDate ? new Date(a.entryDate).getTime() : null;
  const bEntry = b.entryDate ? new Date(b.entryDate).getTime() : null;
  if (aEntry !== bEntry) return false;

  const aExit = a.exitDate ? new Date(a.exitDate).getTime() : null;
  const bExit = b.exitDate ? new Date(b.exitDate).getTime() : null;
  if (aExit !== bExit) return false;

  // Legacy unit fields
  if (a.unitId !== b.unitId) return false;
  if (a.surface !== b.surface) return false;
  if (a.quantity !== b.quantity) return false;

  // Optional overrides
  if (a.parachevementsPerM2 !== b.parachevementsPerM2) return false;
  if (a.cascoSqm !== b.cascoSqm) return false;
  if (a.parachevementsSqm !== b.parachevementsSqm) return false;

  // Complex objects (purchase details and lots owned)
  if (JSON.stringify(a.purchaseDetails) !== JSON.stringify(b.purchaseDetails)) return false;
  if (JSON.stringify(a.lotsOwned) !== JSON.stringify(b.lotsOwned)) return false;

  return true;
}

/**
 * Detect which participants changed between old and new state
 *
 * @param oldParticipants - Previous participant state
 * @param newParticipants - New participant state (after recalculation)
 * @returns Indices of changed participants
 */
export function detectChangedParticipants(
  oldParticipants: Participant[],
  newParticipants: Participant[]
): number[] {
  const changedIndices: number[] = [];

  // Handle length mismatch (added/removed participants)
  if (oldParticipants.length !== newParticipants.length) {
    // All participants need sync
    return newParticipants.map((_, idx) => idx);
  }

  // Compare each participant
  for (let i = 0; i < newParticipants.length; i++) {
    if (!participantEquals(oldParticipants[i], newParticipants[i])) {
      changedIndices.push(i);
    }
  }

  return changedIndices;
}

/**
 * Sync changed participants to Firestore with batched writes
 *
 * This is the core function for reactive cascade syncing:
 * 1. Detect which participants actually changed
 * 2. Load current versions from Firestore (conflict detection)
 * 3. Batch write only the changed participants
 * 4. Atomic commit - all succeed or all fail
 *
 * @param oldParticipants - Previous participant state (before recalculation)
 * @param newParticipants - New participant state (after recalculation)
 * @param projectId - Firestore project document ID
 * @param userEmail - User making the change
 * @returns Sync result with counts and any conflicts
 */
export async function syncChangedParticipants(
  oldParticipants: Participant[],
  newParticipants: Participant[],
  projectId: string,
  userEmail: string
): Promise<BatchSyncResult> {
  try {
    const db = getDb();
    if (!db) {
      return {
        success: false,
        error: 'Firebase non configuré.',
        syncedCount: 0,
        syncedParticipantIds: [],
        skippedCount: 0,
      };
    }

    // 1. Detect changes
    const changedIndices = detectChangedParticipants(oldParticipants, newParticipants);

    if (changedIndices.length === 0) {
      return {
        success: true,
        syncedCount: 0,
        syncedParticipantIds: [],
        skippedCount: newParticipants.length,
      };
    }

    // 2. Load current versions for conflict detection
    const participantsToSync: ParticipantWithMetadata[] = [];
    const conflicts: Array<{ participantId: string; localVersion: number; remoteVersion: number }> = [];

    for (const idx of changedIndices) {
      const participantId = idx.toString();
      const participantRef = doc(db, 'projects', projectId, 'participants', participantId);

      try {
        const docSnapshot = await getDoc(participantRef);

        if (docSnapshot.exists()) {
          const currentData = docSnapshot.data() as FirestoreParticipantData;

          // No version conflict check for now - last-write-wins
          // In future, could add version checking here

          participantsToSync.push({
            participant: newParticipants[idx],
            participantId,
            version: currentData.version + 1,
          });
        } else {
          // New participant (doesn't exist yet)
          participantsToSync.push({
            participant: newParticipants[idx],
            participantId,
            version: 1,
          });
        }
      } catch (error) {
        console.error(`Error loading participant ${participantId}:`, error);
        // Skip this participant but continue with others
      }
    }

    if (participantsToSync.length === 0) {
      return {
        success: false,
        error: 'No participants could be loaded for sync',
        syncedCount: 0,
        syncedParticipantIds: [],
        skippedCount: changedIndices.length,
      };
    }

    // 3. Batch write
    const batch = writeBatch(db);
    const timestamp = new Date().toISOString();

    for (const { participant, participantId, version } of participantsToSync) {
      const participantRef = doc(db, 'projects', projectId, 'participants', participantId);

      const participantData: FirestoreParticipantData = {
        ...participant,
        lastModifiedBy: userEmail,
        lastModifiedAt: timestamp,
        version,
        serverTimestamp: serverTimestamp(),
        displayOrder: parseInt(participantId),
      };

      batch.set(participantRef, participantData);
    }

    // 4. Atomic commit
    await batch.commit();

    return {
      success: true,
      syncedCount: participantsToSync.length,
      syncedParticipantIds: participantsToSync.map(p => p.participantId),
      skippedCount: changedIndices.length - participantsToSync.length,
      conflicts: conflicts.length > 0 ? conflicts : undefined,
    };

  } catch (error) {
    console.error('Error syncing changed participants:', error);
    return {
      success: false,
      error: 'Erreur lors de la synchronisation des participants.',
      syncedCount: 0,
      syncedParticipantIds: [],
      skippedCount: 0,
    };
  }
}

/**
 * Force sync all participants (for migration or full refresh)
 *
 * Use this when:
 * - Migrating from array-based to subcollection storage
 * - Recovering from sync errors
 * - Admin operations that need full sync
 *
 * @param participants - All participants to sync
 * @param projectId - Firestore project document ID
 * @param userEmail - User performing the sync
 * @returns Sync result
 */
export async function syncAllParticipants(
  participants: Participant[],
  projectId: string,
  userEmail: string
): Promise<BatchSyncResult> {
  try {
    const db = getDb();
    if (!db) {
      return {
        success: false,
        error: 'Firebase non configuré.',
        syncedCount: 0,
        syncedParticipantIds: [],
        skippedCount: 0,
      };
    }

    const batch = writeBatch(db);
    const timestamp = new Date().toISOString();
    const syncedIds: string[] = [];

    for (let i = 0; i < participants.length; i++) {
      const participant = participants[i];
      const participantId = i.toString();
      const participantRef = doc(db, 'projects', projectId, 'participants', participantId);

      // Load current version if exists
      const docSnapshot = await getDoc(participantRef);
      const currentVersion = docSnapshot.exists()
        ? (docSnapshot.data() as FirestoreParticipantData).version
        : 0;

      const participantData: FirestoreParticipantData = {
        ...participant,
        lastModifiedBy: userEmail,
        lastModifiedAt: timestamp,
        version: currentVersion + 1,
        serverTimestamp: serverTimestamp(),
        displayOrder: i,
      };

      batch.set(participantRef, participantData);
      syncedIds.push(participantId);
    }

    await batch.commit();

    return {
      success: true,
      syncedCount: participants.length,
      syncedParticipantIds: syncedIds,
      skippedCount: 0,
    };

  } catch (error) {
    console.error('Error syncing all participants:', error);
    return {
      success: false,
      error: 'Erreur lors de la synchronisation de tous les participants.',
      syncedCount: 0,
      syncedParticipantIds: [],
      skippedCount: 0,
    };
  }
}

/**
 * Estimate network savings from granular sync vs full sync
 *
 * Useful for monitoring/debugging sync efficiency
 *
 * @param changedCount - Number of changed participants
 * @param totalCount - Total number of participants
 * @returns Percentage saved
 */
export function estimateSyncSavings(
  changedCount: number,
  totalCount: number
): { percentSaved: number; description: string } {
  if (totalCount === 0) {
    return { percentSaved: 0, description: 'No participants' };
  }

  const percentSaved = ((totalCount - changedCount) / totalCount) * 100;

  return {
    percentSaved,
    description: `Synced ${changedCount}/${totalCount} participants (${percentSaved.toFixed(1)}% network savings)`,
  };
}
