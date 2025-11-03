// Default values for reset functionality
export const DEFAULT_PARTICIPANTS = [
  { name: 'Manuela/Dragan', capitalApporte: 50000, notaryFeesRate: 12.5, unitId: 1, surface: 112, interestRate: 4.5, durationYears: 25, quantity: 1, parachevementsPerM2: 500 },
  { name: 'Cathy/Jim', capitalApporte: 170000, notaryFeesRate: 12.5, unitId: 3, surface: 134, interestRate: 4.5, durationYears: 25, quantity: 1, parachevementsPerM2: 500 },
  { name: 'Annabelle/Colin', capitalApporte: 200000, notaryFeesRate: 12.5, unitId: 5, surface: 118, interestRate: 4.5, durationYears: 25, quantity: 1, parachevementsPerM2: 500 },
  { name: 'Julie/Séverin', capitalApporte: 70000, notaryFeesRate: 12.5, unitId: 6, surface: 108, interestRate: 4.5, durationYears: 25, quantity: 1, parachevementsPerM2: 500 }
];

export const DEFAULT_PROJECT_PARAMS = {
  totalPurchase: 650000,
  mesuresConservatoires: 20000,
  demolition: 40000,
  infrastructures: 90000,
  etudesPreparatoires: 59820,
  fraisEtudesPreparatoires: 27320,
  fraisGeneraux3ans: 0,
  batimentFondationConservatoire: 43700,
  batimentFondationComplete: 269200,
  batimentCoproConservatoire: 56000,
  globalCascoPerM2: 1590
};

export const DEFAULT_SCENARIO = {
  constructionCostChange: 0,
  infrastructureReduction: 0,
  purchasePriceReduction: 0
};

// Default deed date: February 1st, 2026
export const DEFAULT_DEED_DATE = '2026-02-01';

export const STORAGE_KEY = 'credit-castor-scenario';
export const PINNED_PARTICIPANT_KEY = 'credit-castor-pinned-participant';

// Import release version
import { RELEASE_VERSION, isCompatibleVersion } from './version';

// LocalStorage utilities for pinned participant
export const savePinnedParticipant = (participantName: string) => {
  try {
    localStorage.setItem(PINNED_PARTICIPANT_KEY, JSON.stringify({ participantName }));
  } catch (error) {
    console.error('Failed to save pinned participant:', error);
  }
};

export const loadPinnedParticipant = (): string | null => {
  try {
    const stored = localStorage.getItem(PINNED_PARTICIPANT_KEY);
    if (stored) {
      const data = JSON.parse(stored);
      return data.participantName || null;
    }
  } catch (error) {
    console.error('Failed to load pinned participant:', error);
  }
  return null;
};

export const clearPinnedParticipant = () => {
  try {
    localStorage.removeItem(PINNED_PARTICIPANT_KEY);
  } catch (error) {
    console.error('Failed to clear pinned participant:', error);
  }
};

// LocalStorage utilities for scenario data
export const saveToLocalStorage = (participants: any[], projectParams: any, scenario: any, deedDate: string) => {
  try {
    const data = {
      releaseVersion: RELEASE_VERSION, // Release version for compatibility check
      version: 2, // Data version for migrations within same release
      timestamp: new Date().toISOString(),
      participants,
      projectParams,
      scenario,
      deedDate
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save to localStorage:', error);
  }
};

export const loadFromLocalStorage = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const data = JSON.parse(stored);

      // Check version compatibility
      const storedVersion = data.releaseVersion;
      const isCompatible = isCompatibleVersion(storedVersion);

      // Return data with compatibility flag
      const result = {
        isCompatible,
        storedVersion,
        currentVersion: RELEASE_VERSION,
        participants: data.participants || DEFAULT_PARTICIPANTS,
        projectParams: data.projectParams || DEFAULT_PROJECT_PARAMS,
        scenario: data.scenario || DEFAULT_SCENARIO,
        deedDate: data.deedDate, // May be undefined for old saved data
        timestamp: data.timestamp
      };

      // If compatible, apply migrations
      if (isCompatible) {
        // Migration: If no globalCascoPerM2, use first participant's value or default
        if (result.projectParams && !result.projectParams.globalCascoPerM2) {
          result.projectParams.globalCascoPerM2 =
            result.participants?.[0]?.cascoPerM2 || 1590;
        }

        // Clean up old participant cascoPerM2 fields
        if (result.participants) {
          result.participants = result.participants.map((p: any) => {
            const { cascoPerM2, ...rest } = p;
            return rest;
          });
        }
      }

      return result;
    }
  } catch (error) {
    console.error('Failed to load from localStorage:', error);
  }
  return null;
};

export const clearLocalStorage = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear localStorage:', error);
  }
};
