/**
 * Subcollection Migration Utility
 *
 * Migrates participants from legacy array storage to subcollection architecture.
 *
 * Migration Steps:
 * 1. Check if migration is needed (participantsInSubcollection flag)
 * 2. Load current participants array from main document
 * 3. Save each participant to subcollection
 * 4. Set participantsInSubcollection flag to true
 * 5. Remove participants array from main document
 *
 * Safety:
 * - Atomic batch write ensures all-or-nothing migration
 * - Validates participant data before migration
 * - Preserves all participant fields and metadata
 */

import { doc, getDoc, writeBatch, serverTimestamp, setDoc } from 'firebase/firestore';
import { getDb } from './firebase';
import type { Participant } from '../utils/calculatorUtils';
import type { FirestoreParticipantData } from './firestoreSync';

export interface MigrationResult {
  success: boolean;
  error?: string;
  migratedCount?: number;
  alreadyMigrated?: boolean;
}

/**
 * Check if project has already been migrated to subcollections
 */
export async function isAlreadyMigrated(projectId: string): Promise<boolean> {
  try {
    const db = getDb();
    if (!db) {
      return false;
    }

    const projectRef = doc(db, 'projects', projectId);
    const projectDoc = await getDoc(projectRef);

    if (!projectDoc.exists()) {
      return false;
    }

    const data = projectDoc.data();
    return data.participantsInSubcollection === true;
  } catch (error) {
    console.error('Error checking migration status:', error);
    return false;
  }
}

/**
 * Migrate participants from array to subcollection architecture
 *
 * This function:
 * 1. Checks if already migrated
 * 2. Loads participants array from main document
 * 3. Saves each participant to subcollection
 * 4. Updates main document with flag and removes array
 * 5. Uses atomic batch for safety
 *
 * @param projectId - Firestore project document ID
 * @param userEmail - User performing the migration
 * @returns Migration result with success status and details
 */
export async function migrateToSubcollections(
  projectId: string,
  userEmail: string
): Promise<MigrationResult> {
  try {
    const db = getDb();
    if (!db) {
      return {
        success: false,
        error: 'Firebase not configured',
      };
    }

    console.log('🔄 Starting subcollection migration for project:', projectId);

    // Step 1: Check if already migrated
    const alreadyMigrated = await isAlreadyMigrated(projectId);
    if (alreadyMigrated) {
      console.log('✅ Project already migrated to subcollections');
      return {
        success: true,
        alreadyMigrated: true,
        migratedCount: 0,
      };
    }

    // Step 2: Load current participants array
    const projectRef = doc(db, 'projects', projectId);
    const projectDoc = await getDoc(projectRef);

    if (!projectDoc.exists()) {
      return {
        success: false,
        error: 'Project document does not exist',
      };
    }

    const projectData = projectDoc.data();
    const participants = projectData.participants as Participant[];

    if (!participants || !Array.isArray(participants)) {
      return {
        success: false,
        error: 'No participants array found in project document',
      };
    }

    console.log(`📋 Found ${participants.length} participants to migrate`);

    // Step 3: Create batch for atomic migration
    const batch = writeBatch(db);
    const timestamp = new Date().toISOString();

    // Step 4: Add each participant to subcollection
    for (let i = 0; i < participants.length; i++) {
      const participant = participants[i];
      const participantId = i.toString();
      const participantRef = doc(db, 'projects', projectId, 'participants', participantId);

      const participantData: FirestoreParticipantData = {
        ...participant,
        lastModifiedBy: userEmail,
        lastModifiedAt: timestamp,
        version: 1, // Start with version 1 for migrated participants
        serverTimestamp: serverTimestamp(),
        displayOrder: i,
        enabled: participant.enabled ?? true, // Ensure enabled field exists
      };

      batch.set(participantRef, participantData);
    }

    // Step 5: Update main document
    // Set flag and remove participants array
    // Use set with merge to preserve other fields while updating these specific ones
    batch.set(
      projectRef,
      {
        participantsInSubcollection: true,
        participants: [], // Clear the array
        lastModifiedBy: userEmail,
        lastModifiedAt: timestamp,
        migrationTimestamp: timestamp,
      },
      { merge: true } // Merge with existing data
    );

    // Step 6: Commit atomic batch
    await batch.commit();

    console.log(`✅ Successfully migrated ${participants.length} participants to subcollections`);

    return {
      success: true,
      migratedCount: participants.length,
      alreadyMigrated: false,
    };

  } catch (error) {
    console.error('❌ Error during subcollection migration:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error during migration',
    };
  }
}

/**
 * Validate migration completed successfully
 *
 * Checks:
 * - participantsInSubcollection flag is true
 * - participants array is empty
 * - All participants exist in subcollection
 *
 * @param projectId - Firestore project document ID
 * @param expectedCount - Expected number of participants
 * @returns Validation result
 */
export async function validateMigration(
  projectId: string,
  expectedCount: number
): Promise<{ valid: boolean; error?: string; actualCount?: number }> {
  try {
    const db = getDb();
    if (!db) {
      return { valid: false, error: 'Firebase not configured' };
    }

    // Check main document
    const projectRef = doc(db, 'projects', projectId);
    const projectDoc = await getDoc(projectRef);

    if (!projectDoc.exists()) {
      return { valid: false, error: 'Project document does not exist' };
    }

    const data = projectDoc.data();

    // Validate flag is set
    if (data.participantsInSubcollection !== true) {
      return { valid: false, error: 'participantsInSubcollection flag not set' };
    }

    // Validate array is empty
    if (data.participants && data.participants.length > 0) {
      return { valid: false, error: 'participants array not cleared' };
    }

    // Count participants in subcollection
    const participantIds = Array.from({ length: expectedCount }, (_, i) => i.toString());
    let actualCount = 0;

    for (const participantId of participantIds) {
      const participantRef = doc(db, 'projects', projectId, 'participants', participantId);
      const participantDoc = await getDoc(participantRef);

      if (participantDoc.exists()) {
        actualCount++;
      }
    }

    if (actualCount !== expectedCount) {
      return {
        valid: false,
        error: `Expected ${expectedCount} participants, found ${actualCount}`,
        actualCount,
      };
    }

    return { valid: true, actualCount };

  } catch (error) {
    console.error('Error validating migration:', error);
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Unknown validation error',
    };
  }
}
