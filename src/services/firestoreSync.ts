import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  serverTimestamp,
  collection,
  getDocs,
  deleteDoc,
  writeBatch,
  query,
  orderBy,
  type Unsubscribe,
} from 'firebase/firestore';
import { getDb } from './firebase';
import type { Participant, ProjectParams, PortageFormulaParams } from '../utils/calculatorUtils';

/**
 * Document ID for the shared project scenario
 * For this POC, we use a single shared document
 */
const PROJECT_DOC_ID = 'shared-project';

/**
 * Scenario data structure stored in Firestore
 */
export interface FirestoreScenarioData {
  participants: Participant[];
  projectParams: ProjectParams;
  deedDate: string;
  portageFormula: PortageFormulaParams;
  // Metadata
  lastModifiedBy: string;
  lastModifiedAt: string;
  version: number;
  serverTimestamp?: any; // Firestore serverTimestamp
  // Field-level versioning for granular updates
  fieldVersions?: {
    projectParams?: number;
    deedDate?: number;
    portageFormula?: number;
    participants?: number;
  };
}

/**
 * Change event emitted when Firestore data changes
 */
export interface FirestoreChangeEvent {
  data: FirestoreScenarioData;
  source: 'remote' | 'local';
  isFirstLoad: boolean;
}

/**
 * Conflict detection result
 */
export interface ConflictDetectionResult {
  hasConflict: boolean;
  localVersion: number;
  remoteVersion: number;
  message?: string;
}

/**
 * Trackable field types for dirty tracking
 */
export type TrackableField =
  | 'projectParams'
  | 'deedDate'
  | 'portageFormula'
  | 'participants';

/**
 * Change tracking for field-level updates
 */
export interface FieldChangeTracker {
  changedFields: Set<TrackableField>;
  lastSaveTimestamp: number;
}

/**
 * Field-specific update payload
 */
export interface FieldUpdate {
  field: TrackableField;
  value: any;
  userEmail: string;
  timestamp: string;
}

/**
 * Result of a field-level update operation
 */
export interface FieldUpdateResult {
  success: boolean;
  error?: string;
  updatedFields: TrackableField[];
}

/**
 * Participant document structure in subcollection
 *
 * Path: projects/{projectId}/participants/{participantId}
 */
export interface FirestoreParticipantData extends Participant {
  // Metadata
  lastModifiedBy: string;
  lastModifiedAt: string;
  version: number;
  serverTimestamp?: any;
  // Order/index for stable sorting
  displayOrder: number;
}

/**
 * Main project document (without participants array)
 */
export interface FirestoreProjectData {
  projectParams: ProjectParams;
  deedDate: string;
  portageFormula: PortageFormulaParams;
  // Metadata
  lastModifiedBy: string;
  lastModifiedAt: string;
  version: number;
  serverTimestamp?: any;
  fieldVersions?: {
    projectParams?: number;
    deedDate?: number;
    portageFormula?: number;
  };
  // Migration flag
  participantsInSubcollection?: boolean;
}

/**
 * Save scenario data to Firestore
 *
 * @param data - The scenario data to save
 * @param userEmail - Email of the user making the change
 * @returns Success boolean and error message if failed
 */
export async function saveScenarioToFirestore(
  data: Omit<FirestoreScenarioData, 'lastModifiedBy' | 'lastModifiedAt' | 'serverTimestamp'>,
  userEmail: string
): Promise<{ success: boolean; error?: string; savedData?: FirestoreScenarioData }> {
  try {
    const db = getDb();
    if (!db) {
      return {
        success: false,
        error: 'Firebase non configuré. Sauvegarde locale uniquement.',
      };
    }

    const projectRef = doc(db, 'projects', PROJECT_DOC_ID);

    // Create document with metadata
    const dataToSave: FirestoreScenarioData = {
      ...data,
      lastModifiedBy: userEmail,
      lastModifiedAt: new Date().toISOString(),
      serverTimestamp: serverTimestamp(),
    };

    await setDoc(projectRef, dataToSave);

    return {
      success: true,
      savedData: dataToSave,
    };
  } catch (error) {
    console.error('Error saving to Firestore:', error);
    return {
      success: false,
      error: 'Erreur lors de la sauvegarde sur Firestore.',
    };
  }
}

/**
 * Update specific fields in Firestore (granular updates)
 *
 * Uses updateDoc() instead of setDoc() to only modify changed fields.
 * Falls back to full save if document doesn't exist.
 *
 * @param fields - Map of field names to values
 * @param userEmail - Email of user making changes
 * @param baseVersion - Current version number for conflict detection
 * @returns Success boolean, updated fields, and error if failed
 */
export async function updateScenarioFields(
  fields: Partial<Pick<FirestoreScenarioData, 'projectParams' | 'deedDate' | 'portageFormula'>>,
  userEmail: string,
  baseVersion: number
): Promise<FieldUpdateResult> {
  try {
    const db = getDb();
    if (!db) {
      return {
        success: false,
        error: 'Firebase non configuré.',
        updatedFields: [],
      };
    }

    const projectRef = doc(db, 'projects', PROJECT_DOC_ID);

    // Check if document exists
    const docSnapshot = await getDoc(projectRef);
    if (!docSnapshot.exists()) {
      // Document doesn't exist, can't use updateDoc
      return {
        success: false,
        error: 'Document does not exist. Use saveScenarioToFirestore for initial save.',
        updatedFields: [],
      };
    }

    // Check for conflicts
    const currentData = docSnapshot.data() as FirestoreScenarioData;
    if (currentData.version > baseVersion) {
      return {
        success: false,
        error: `Version conflict: local=${baseVersion}, remote=${currentData.version}`,
        updatedFields: [],
      };
    }

    // Build update payload
    const updatePayload: any = {
      ...fields,
      lastModifiedBy: userEmail,
      lastModifiedAt: new Date().toISOString(),
      version: baseVersion + 1,
      serverTimestamp: serverTimestamp(),
    };

    // Update field-level versions
    const fieldVersions = currentData.fieldVersions || {};
    const updatedFields = Object.keys(fields) as TrackableField[];

    updatedFields.forEach(field => {
      const currentFieldVersion = fieldVersions[field] || 0;
      fieldVersions[field] = currentFieldVersion + 1;
    });

    updatePayload.fieldVersions = fieldVersions;

    // Use updateDoc for partial update
    await updateDoc(projectRef, updatePayload);

    return {
      success: true,
      updatedFields,
    };
  } catch (error) {
    console.error('Error updating Firestore fields:', error);
    return {
      success: false,
      error: 'Erreur lors de la mise à jour des champs.',
      updatedFields: [],
    };
  }
}

/**
 * Convert Firestore Timestamps to Date objects in participant data
 *
 * @param data - Raw data from Firestore that may contain Timestamp objects
 * @returns Data with all Timestamps converted to Date objects
 */
function convertFirestoreTimestamps(data: FirestoreScenarioData): FirestoreScenarioData {
  // Helper to convert a single timestamp value to Date
  const convertTimestamp = (value: any): Date | undefined => {
    if (!value) return undefined;

    // Check if this is a Firestore Timestamp object (has seconds and nanoseconds or toDate method)
    if (value && typeof value === 'object') {
      if (typeof value.toDate === 'function') {
        // Use Firestore's built-in toDate() method if available
        return value.toDate();
      } else if ('seconds' in value && 'nanoseconds' in value) {
        // Manual conversion for serialized Timestamps
        return new Date(value.seconds * 1000 + value.nanoseconds / 1000000);
      }
    }

    // If it's already a Date, return as-is
    if (value instanceof Date) {
      return value;
    }

    // If it's a string, convert to Date
    if (typeof value === 'string') {
      return new Date(value);
    }

    return undefined;
  };

  // Convert timestamps in participants
  const participants = data.participants.map(p => {
    const converted = { ...p };

    // Convert entryDate
    if (p.entryDate) {
      converted.entryDate = convertTimestamp(p.entryDate);
    }

    // Convert exitDate
    if (p.exitDate) {
      converted.exitDate = convertTimestamp(p.exitDate);
    }

    // Convert lot dates
    if (p.lotsOwned) {
      converted.lotsOwned = p.lotsOwned.map(lot => {
        const convertedLot = { ...lot };
        if (lot.acquiredDate) {
          convertedLot.acquiredDate = convertTimestamp(lot.acquiredDate) as Date;
        }
        if (lot.soldDate) {
          convertedLot.soldDate = convertTimestamp(lot.soldDate);
        }
        return convertedLot;
      });
    }

    return converted;
  });

  return {
    ...data,
    participants,
  };
}

/**
 * Error types for Firestore operations
 */
export type FirestoreErrorType =
  | 'not-configured'  // Firebase not initialized
  | 'no-data'         // Document doesn't exist (legitimate first-time scenario)
  | 'network-error'   // Connection/network issues
  | 'unknown';        // Other errors

/**
 * Load scenario data from Firestore
 *
 * @returns The scenario data or null if not found
 */
export async function loadScenarioFromFirestore(): Promise<{
  success: boolean;
  data?: FirestoreScenarioData;
  error?: string;
  errorType?: FirestoreErrorType;
}> {
  try {
    const db = getDb();
    if (!db) {
      return {
        success: false,
        error: 'Firebase non configuré.',
        errorType: 'not-configured',
      };
    }

    const projectRef = doc(db, 'projects', PROJECT_DOC_ID);
    const projectDoc = await getDoc(projectRef);

    if (!projectDoc.exists()) {
      return {
        success: false,
        error: 'Aucune donnée trouvée sur Firestore.',
        errorType: 'no-data',
      };
    }

    const rawData = projectDoc.data() as FirestoreScenarioData;

    // Convert Firestore Timestamps to Date objects
    const data = convertFirestoreTimestamps(rawData);

    return {
      success: true,
      data,
    };
  } catch (error: any) {
    console.error('Error loading from Firestore:', error);

    // Detect network-related errors
    const errorCode = error?.code || '';
    const errorMessage = error?.message || '';
    const isNetworkError =
      errorCode === 'unavailable' ||
      errorCode === 'permission-denied' ||
      errorMessage.includes('network') ||
      errorMessage.includes('fetch') ||
      errorMessage.includes('timeout') ||
      errorMessage.includes('Failed to fetch');

    return {
      success: false,
      error: 'Erreur lors du chargement depuis Firestore.',
      errorType: isNetworkError ? 'network-error' : 'unknown',
    };
  }
}

/**
 * Subscribe to real-time changes from Firestore
 *
 * @param callback - Function to call when data changes
 * @returns Unsubscribe function to stop listening
 */
export function subscribeToFirestoreChanges(
  callback: (event: FirestoreChangeEvent) => void
): Unsubscribe | null {
  try {
    const db = getDb();
    if (!db) {
      console.warn('Firebase not configured, cannot subscribe to changes');
      return null;
    }

    const projectRef = doc(db, 'projects', PROJECT_DOC_ID);
    let isFirstLoad = true;

    const unsubscribe = onSnapshot(
      projectRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const rawData = snapshot.data() as FirestoreScenarioData;

          // Convert Firestore Timestamps to Date objects
          const data = convertFirestoreTimestamps(rawData);

          const source = snapshot.metadata.hasPendingWrites ? 'local' : 'remote';

          callback({
            data,
            source,
            isFirstLoad,
          });

          isFirstLoad = false;
        }
      },
      (error) => {
        console.error('Error in Firestore snapshot listener:', error);
      }
    );

    return unsubscribe;
  } catch (error) {
    console.error('Error subscribing to Firestore changes:', error);
    return null;
  }
}

/**
 * Detect conflicts between local and remote data
 *
 * @param localVersion - Version number of local data
 * @param remoteVersion - Version number of remote data
 * @returns Conflict detection result
 */
export function detectConflict(
  localVersion: number,
  remoteVersion: number
): ConflictDetectionResult {
  if (remoteVersion > localVersion) {
    return {
      hasConflict: true,
      localVersion,
      remoteVersion,
      message: `Conflit détecté : version locale (${localVersion}) vs version distante (${remoteVersion})`,
    };
  }

  return {
    hasConflict: false,
    localVersion,
    remoteVersion,
  };
}

/**
 * Merge local and remote changes (simple last-write-wins strategy for now)
 * In a more sophisticated implementation, this could do field-level merging
 *
 * @param localData - Local scenario data
 * @param remoteData - Remote scenario data
 * @returns Merged data
 */
export function mergeScenarioData(
  localData: FirestoreScenarioData,
  remoteData: FirestoreScenarioData
): FirestoreScenarioData {
  // For now, use simple last-write-wins based on timestamp
  const localTime = new Date(localData.lastModifiedAt).getTime();
  const remoteTime = new Date(remoteData.lastModifiedAt).getTime();

  if (remoteTime > localTime) {
    return {
      ...remoteData,
      version: Math.max(localData.version, remoteData.version) + 1,
    };
  }

  return {
    ...localData,
    version: Math.max(localData.version, remoteData.version) + 1,
  };
}

/**
 * Check if Firestore sync is available
 */
export function isFirestoreSyncAvailable(): boolean {
  return getDb() !== null;
}

/**
 * Save participant to subcollection
 *
 * @param participant - Participant data
 * @param participantId - Unique ID for participant (use index or generate)
 * @param projectId - Project document ID
 * @param userEmail - User making the change
 * @returns Success result
 */
export async function saveParticipantToSubcollection(
  participant: Participant,
  participantId: string,
  projectId: string,
  userEmail: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const db = getDb();
    if (!db) {
      return {
        success: false,
        error: 'Firebase non configuré.',
      };
    }

    const participantRef = doc(db, 'projects', projectId, 'participants', participantId);

    // Get current version if exists
    const existingDoc = await getDoc(participantRef);
    const currentVersion = existingDoc.exists()
      ? (existingDoc.data() as FirestoreParticipantData).version
      : 0;

    const participantData: FirestoreParticipantData = {
      ...participant,
      lastModifiedBy: userEmail,
      lastModifiedAt: new Date().toISOString(),
      version: currentVersion + 1,
      serverTimestamp: serverTimestamp(),
      displayOrder: parseInt(participantId), // Maintain order
    };

    await setDoc(participantRef, participantData);

    return { success: true };
  } catch (error) {
    console.error('Error saving participant to subcollection:', error);
    return {
      success: false,
      error: 'Erreur lors de la sauvegarde du participant.',
    };
  }
}

/**
 * Update specific fields of a participant (granular update)
 *
 * Uses updateDoc() instead of setDoc() to only modify changed fields.
 * More efficient for partial updates like detail data changes.
 *
 * @param participantId - Participant document ID
 * @param projectId - Project document ID
 * @param fields - Map of field names to values (subset of Participant)
 * @param userEmail - Email of user making changes
 * @param baseVersion - Current version number for conflict detection
 * @returns Success result with updated fields
 */
export async function updateParticipantFields(
  participantId: string,
  projectId: string,
  fields: Partial<Participant>,
  userEmail: string,
  baseVersion?: number
): Promise<{ success: boolean; error?: string; updatedFields?: string[] }> {
  try {
    const db = getDb();
    if (!db) {
      return {
        success: false,
        error: 'Firebase non configuré.',
      };
    }

    const participantRef = doc(db, 'projects', projectId, 'participants', participantId);

    // Check if document exists
    const docSnapshot = await getDoc(participantRef);
    if (!docSnapshot.exists()) {
      return {
        success: false,
        error: 'Participant does not exist.',
      };
    }

    // Check for conflicts if baseVersion provided
    if (baseVersion !== undefined) {
      const currentData = docSnapshot.data() as FirestoreParticipantData;
      if (currentData.version > baseVersion) {
        return {
          success: false,
          error: `Version conflict: local=${baseVersion}, remote=${currentData.version}`,
        };
      }
    }

    const currentData = docSnapshot.data() as FirestoreParticipantData;

    // Build update payload with only changed fields
    const updatePayload: any = {
      ...fields,
      lastModifiedBy: userEmail,
      lastModifiedAt: new Date().toISOString(),
      version: currentData.version + 1,
      serverTimestamp: serverTimestamp(),
    };

    // Use updateDoc for partial update
    await updateDoc(participantRef, updatePayload);

    return {
      success: true,
      updatedFields: Object.keys(fields),
    };
  } catch (error) {
    console.error('Error updating participant fields:', error);
    return {
      success: false,
      error: 'Erreur lors de la mise à jour du participant.',
    };
  }
}

/**
 * Load all participants from subcollection
 *
 * @param projectId - Project document ID
 * @returns List of participants ordered by displayOrder
 */
export async function loadParticipantsFromSubcollection(
  projectId: string
): Promise<{ success: boolean; participants?: Participant[]; error?: string }> {
  try {
    const db = getDb();
    if (!db) {
      return {
        success: false,
        error: 'Firebase non configuré.',
      };
    }

    const participantsRef = collection(db, 'projects', projectId, 'participants');
    const q = query(participantsRef, orderBy('displayOrder', 'asc'));
    const querySnapshot = await getDocs(q);

    const participants: Participant[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data() as FirestoreParticipantData;

      // Convert back to Participant type (exclude metadata)
      const { lastModifiedBy, lastModifiedAt, version, serverTimestamp: _, displayOrder, ...participant } = data;

      participants.push(participant as Participant);
    });

    return {
      success: true,
      participants,
    };
  } catch (error) {
    console.error('Error loading participants from subcollection:', error);
    return {
      success: false,
      error: 'Erreur lors du chargement des participants.',
    };
  }
}

/**
 * Delete participant from subcollection
 *
 * @param participantId - Participant document ID
 * @param projectId - Project document ID
 * @returns Success result
 */
export async function deleteParticipantFromSubcollection(
  participantId: string,
  projectId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const db = getDb();
    if (!db) {
      return {
        success: false,
        error: 'Firebase non configuré.',
      };
    }

    const participantRef = doc(db, 'projects', projectId, 'participants', participantId);
    await deleteDoc(participantRef);

    return { success: true };
  } catch (error) {
    console.error('Error deleting participant from subcollection:', error);
    return {
      success: false,
      error: 'Erreur lors de la suppression du participant.',
    };
  }
}

/**
 * Migrate participants from array to subcollection
 *
 * Atomically moves participants from main document to subcollection.
 * Uses batched writes for atomicity.
 *
 * @param projectId - Project document ID
 * @param userEmail - User performing migration
 * @returns Success result
 */
export async function migrateParticipantsToSubcollection(
  projectId: string,
  userEmail: string
): Promise<{ success: boolean; error?: string; migratedCount?: number }> {
  try {
    const db = getDb();
    if (!db) {
      return {
        success: false,
        error: 'Firebase non configuré.',
      };
    }

    const projectRef = doc(db, 'projects', projectId);
    const projectDoc = await getDoc(projectRef);

    if (!projectDoc.exists()) {
      return {
        success: false,
        error: 'Project document does not exist.',
      };
    }

    const projectData = projectDoc.data() as FirestoreScenarioData;

    // Check if already migrated
    if ((projectData as any).participantsInSubcollection) {
      return {
        success: true,
        migratedCount: 0,
        error: 'Already migrated.',
      };
    }

    const participants = projectData.participants || [];
    const batch = writeBatch(db);

    // Save each participant to subcollection
    participants.forEach((participant, index) => {
      const participantRef = doc(db, 'projects', projectId, 'participants', index.toString());
      const participantData: FirestoreParticipantData = {
        ...participant,
        lastModifiedBy: userEmail,
        lastModifiedAt: new Date().toISOString(),
        version: 1,
        displayOrder: index,
        serverTimestamp: serverTimestamp(),
      };
      batch.set(participantRef, participantData);
    });

    // Update main document to remove participants array and set migration flag
    const updatedProjectData: Partial<FirestoreProjectData> = {
      participantsInSubcollection: true,
      lastModifiedBy: userEmail,
      lastModifiedAt: new Date().toISOString(),
      serverTimestamp: serverTimestamp(),
    };

    batch.update(projectRef, {
      ...updatedProjectData,
      participants: [], // Clear array (keep for backward compat, but empty)
    });

    // Commit batch
    await batch.commit();

    console.log(`✅ Migrated ${participants.length} participants to subcollection`);

    return {
      success: true,
      migratedCount: participants.length,
    };
  } catch (error) {
    console.error('Error migrating participants to subcollection:', error);
    return {
      success: false,
      error: 'Erreur lors de la migration des participants.',
    };
  }
}

/**
 * Subscribe to real-time changes for a single participant
 *
 * @param participantId - Participant document ID
 * @param projectId - Project document ID
 * @param callback - Called when participant changes
 * @returns Unsubscribe function
 */
export function subscribeToParticipantChanges(
  participantId: string,
  projectId: string,
  callback: (participant: Participant | null, source: 'local' | 'remote') => void
): Unsubscribe | null {
  try {
    const db = getDb();
    if (!db) {
      console.warn('Firebase not configured');
      return null;
    }

    const participantRef = doc(db, 'projects', projectId, 'participants', participantId);

    const unsubscribe = onSnapshot(
      participantRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data() as FirestoreParticipantData;
          const source = snapshot.metadata.hasPendingWrites ? 'local' : 'remote';

          // Convert to Participant (exclude metadata)
          const { lastModifiedBy, lastModifiedAt, version, serverTimestamp: _, displayOrder, ...participant } = data;

          callback(participant as Participant, source);
        } else {
          callback(null, 'remote'); // Participant deleted
        }
      },
      (error) => {
        console.error('Error in participant snapshot listener:', error);
      }
    );

    return unsubscribe;
  } catch (error) {
    console.error('Error subscribing to participant changes:', error);
    return null;
  }
}

/**
 * Subscribe to all participants in subcollection
 *
 * @param projectId - Project document ID
 * @param callback - Called when any participant changes
 * @returns Unsubscribe function
 */
export function subscribeToAllParticipants(
  projectId: string,
  callback: (participants: Participant[], source: 'local' | 'remote') => void
): Unsubscribe | null {
  try {
    const db = getDb();
    if (!db) {
      console.warn('Firebase not configured');
      return null;
    }

    const participantsRef = collection(db, 'projects', projectId, 'participants');
    const q = query(participantsRef, orderBy('displayOrder', 'asc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const participants: Participant[] = [];
        const source = snapshot.metadata.hasPendingWrites ? 'local' : 'remote';

        snapshot.forEach((doc) => {
          const data = doc.data() as FirestoreParticipantData;

          // Convert to Participant (exclude metadata)
          const { lastModifiedBy, lastModifiedAt, version, serverTimestamp: _, displayOrder, ...participant } = data;

          participants.push(participant as Participant);
        });

        callback(participants, source);
      },
      (error) => {
        console.error('Error in participants collection listener:', error);
      }
    );

    return unsubscribe;
  } catch (error) {
    console.error('Error subscribing to participants collection:', error);
    return null;
  }
}
