import {
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  serverTimestamp,
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
 * Load scenario data from Firestore
 *
 * @returns The scenario data or null if not found
 */
export async function loadScenarioFromFirestore(): Promise<{
  success: boolean;
  data?: FirestoreScenarioData;
  error?: string;
}> {
  try {
    const db = getDb();
    if (!db) {
      return {
        success: false,
        error: 'Firebase non configuré.',
      };
    }

    const projectRef = doc(db, 'projects', PROJECT_DOC_ID);
    const projectDoc = await getDoc(projectRef);

    if (!projectDoc.exists()) {
      return {
        success: false,
        error: 'Aucune donnée trouvée sur Firestore.',
      };
    }

    const data = projectDoc.data() as FirestoreScenarioData;

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error('Error loading from Firestore:', error);
    return {
      success: false,
      error: 'Erreur lors du chargement depuis Firestore.',
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
          const data = snapshot.data() as FirestoreScenarioData;
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
