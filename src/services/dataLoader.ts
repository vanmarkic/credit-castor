/**
 * Unified data loading service
 *
 * Priority: Firestore → localStorage → Error Alert
 *
 * Responsibilities:
 * - Load data from Firestore first (if available)
 * - Fallback to localStorage if Firestore unavailable
 * - Validate schema for loaded data
 * - Show migration prompt if localStorage has data but Firestore becomes available
 * - Show developer alert if no valid data source available
 */

import { loadScenarioFromFirestore, isFirestoreSyncAvailable, type FirestoreErrorType } from './firestoreSync';
import { loadFromLocalStorage } from '../utils/storage';
import type { Participant, ProjectParams, PortageFormulaParams } from '../utils/calculatorUtils';

export interface LoadedData {
  participants: Participant[];
  projectParams: ProjectParams;
  deedDate: string;
  portageFormula: PortageFormulaParams;
  source: 'firestore' | 'localStorage' | 'none';
  needsMigration?: boolean;
  localStorageData?: {
    participants: Participant[];
    projectParams: ProjectParams;
    deedDate: string;
    portageFormula: PortageFormulaParams;
  };
}

export interface DataLoadResult {
  success: boolean;
  data?: LoadedData;
  error?: string;
  errorType?: FirestoreErrorType;
  requiresAlert?: boolean;
  showToast?: boolean;
}

/**
 * Validate that data has required fields and structure
 */
export function validateSchema(data: any): boolean {
  if (!data) return false;

  // Check required fields
  if (!data.participants || !Array.isArray(data.participants)) {
    console.error('Schema validation failed: participants missing or invalid');
    return false;
  }

  if (!data.projectParams || typeof data.projectParams !== 'object') {
    console.error('Schema validation failed: projectParams missing or invalid');
    return false;
  }

  if (!data.deedDate || typeof data.deedDate !== 'string') {
    console.error('Schema validation failed: deedDate missing or invalid');
    return false;
  }

  if (!data.portageFormula || typeof data.portageFormula !== 'object') {
    console.error('Schema validation failed: portageFormula missing or invalid');
    return false;
  }

  // Basic participant validation
  for (const participant of data.participants) {
    if (!participant.name || typeof participant.name !== 'string') {
      console.error('Schema validation failed: participant missing name');
      return false;
    }
    if (participant.capitalApporte === undefined || typeof participant.capitalApporte !== 'number') {
      console.error('Schema validation failed: participant missing capitalApporte');
      return false;
    }
  }

  return true;
}

/**
 * Show developer alert when no valid data source is available
 */
function showDataSourceAlert(): void {
  alert(
    '⚠️ DEVELOPER ALERT\n\n' +
    'No valid data source found:\n' +
    '- Firestore: Not available or no data\n' +
    '- localStorage: Not available or schema invalid\n\n' +
    'The application cannot initialize without valid data.\n' +
    'Please check your Firebase configuration or clear corrupted localStorage data.'
  );
}

/**
 * Get migration info for display in UI
 * Returns formatted information about the data to be migrated
 */
export function getMigrationInfo(): { participantCount: number; timestamp: string } | null {
  const lastModified = localStorage.getItem('credit-castor-scenario');

  if (!lastModified) return null;

  try {
    const parsed = JSON.parse(lastModified);
    return {
      participantCount: parsed.participants?.length || 0,
      timestamp: parsed.timestamp ? new Date(parsed.timestamp).toLocaleString() : 'Unknown'
    };
  } catch (e) {
    return null;
  }
}

/**
 * Load application data with priority: Firestore → localStorage → Error
 *
 * @param options - Loading options
 * @param options.skipFirestore - Skip Firestore and load from localStorage only (for testing)
 * @returns Data load result with source information
 */
export async function loadApplicationData(options?: {
  skipFirestore?: boolean;
}): Promise<DataLoadResult> {
  const firestoreAvailable = !options?.skipFirestore && isFirestoreSyncAvailable();

  // Step 1: Try loading from Firestore first
  if (firestoreAvailable) {
    console.log('🔥 Attempting to load from Firestore...');
    const firestoreResult = await loadScenarioFromFirestore();

    if (firestoreResult.success && firestoreResult.data) {
      // Validate Firestore data
      if (validateSchema(firestoreResult.data)) {
        console.log('✅ Loaded valid data from Firestore');

        // Check if we also have localStorage data (potential migration scenario)
        const localData = loadFromLocalStorage();
        const hasLocalData = localData && localData.isCompatible && validateSchema(localData);

        return {
          success: true,
          data: {
            participants: firestoreResult.data.participants,
            projectParams: firestoreResult.data.projectParams,
            deedDate: firestoreResult.data.deedDate,
            portageFormula: firestoreResult.data.portageFormula,
            source: 'firestore',
            needsMigration: false,
            ...(hasLocalData && {
              localStorageData: {
                participants: localData.participants,
                projectParams: localData.projectParams,
                deedDate: localData.deedDate,
                portageFormula: localData.portageFormula,
              }
            })
          },
        };
      } else {
        console.error('❌ Firestore data failed schema validation');
        alert(
          '⚠️ DEVELOPER ALERT\n\n' +
          'Firestore data failed schema validation:\n' +
          '- Data structure is invalid or corrupted\n' +
          '- Required fields may be missing\n\n' +
          'Falling back to localStorage if available.\n' +
          'Please check Firestore data integrity.'
        );
      }
    } else {
      // Firestore load failed - check error type
      if (firestoreResult.errorType === 'network-error') {
        // Network error - don't fall back to localStorage, show toast
        console.error('❌ Network error accessing Firestore');
        return {
          success: false,
          error: firestoreResult.error || 'Erreur réseau lors de l\'accès à Firestore',
          errorType: 'network-error',
          showToast: true,
        };
      }

      // For 'no-data' or 'not-configured', continue to localStorage fallback
      console.log('ℹ️ No data found in Firestore, checking localStorage...');
    }
  }

  // Step 2: Try loading from localStorage as fallback
  console.log('💾 Attempting to load from localStorage...');
  const localData = loadFromLocalStorage();

  if (localData && localData.isCompatible) {
    // Validate localStorage data
    if (validateSchema(localData)) {
      console.log('✅ Loaded valid data from localStorage');

      return {
        success: true,
        data: {
          participants: localData.participants,
          projectParams: localData.projectParams,
          deedDate: localData.deedDate,
          portageFormula: localData.portageFormula,
          source: 'localStorage',
          needsMigration: firestoreAvailable, // Migration needed if Firestore is available
        },
      };
    } else {
      console.error('❌ localStorage data failed schema validation');
    }
  } else if (localData && !localData.isCompatible) {
    console.error('❌ localStorage data version incompatible');
  } else {
    console.log('ℹ️ No data found in localStorage');
  }

  // Step 3: No valid data source available
  console.error('❌ No valid data source available');
  showDataSourceAlert();

  return {
    success: false,
    error: 'No valid data source available',
    requiresAlert: true,
  };
}
