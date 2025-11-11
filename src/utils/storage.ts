// Import types first
import { RELEASE_VERSION, isCompatibleVersion } from './version';
import { DEFAULT_PORTAGE_FORMULA, type PortageFormulaParams, type Participant, type ProjectParams } from './calculatorUtils';

// Default deed date: February 1st, 2026 (future date - deed not signed yet)
export const DEFAULT_DEED_DATE = '2026-02-01';

// Old participant interface for migration (includes deprecated fields)
interface OldParticipant extends Participant {
  cascoPerM2?: number; // Deprecated: moved to globalCascoPerM2 in ProjectParams
}

// Default values for reset functionality
export const DEFAULT_PARTICIPANTS: Participant[] = [
  { name: 'Manuela/Dragan', capitalApporte: 50000, notaryFeesRate: 12.5, unitId: 1, surface: 112, interestRate: 4.5, durationYears: 25, quantity: 1, parachevementsPerM2: 500, isFounder: true, entryDate: new Date(DEFAULT_DEED_DATE) },
  { name: 'Cathy/Jim', capitalApporte: 170000, notaryFeesRate: 12.5, unitId: 3, surface: 134, interestRate: 4.5, durationYears: 25, quantity: 1, parachevementsPerM2: 500, isFounder: true, entryDate: new Date(DEFAULT_DEED_DATE) },
  {
    name: 'Annabelle/Colin',
    capitalApporte: 200000,
    notaryFeesRate: 12.5,
    unitId: 5,
    surface: 198,
    interestRate: 4.5,
    durationYears: 25,
    quantity: 2,
    parachevementsPerM2: 500,
    isFounder: true,
    entryDate: new Date(DEFAULT_DEED_DATE),
    lotsOwned: [
      {
        lotId: 1,
        surface: 118,
        unitId: 5,
        isPortage: false,
        allocatedSurface: 118,
        acquiredDate: new Date('2026-02-01')
      },
      {
        lotId: 2,
        surface: 80,
        unitId: 5,
        isPortage: true,
        allocatedSurface: 80,
        acquiredDate: new Date('2026-02-01'),
        originalPrice: 94200,
        originalNotaryFees: 11775,
        originalConstructionCost: 127200
      }
    ]
  },
  { name: 'Julie/Séverin', capitalApporte: 70000, notaryFeesRate: 12.5, unitId: 6, surface: 108, interestRate: 4.5, durationYears: 25, quantity: 1, parachevementsPerM2: 500, isFounder: true, entryDate: new Date(DEFAULT_DEED_DATE) },
  {
    name: 'Nouveau·elle Arrivant·e',
    capitalApporte: 80000,
    notaryFeesRate: 12.5,
    unitId: 5,
    surface: 80,
    interestRate: 4.5,
    durationYears: 25,
    quantity: 1,
    parachevementsPerM2: 500,
    isFounder: false,
    entryDate: new Date('2027-06-01'),
    purchaseDetails: {
      buyingFrom: 'Annabelle/Colin',
      lotId: 2,
      // Calculated: 16 months (1.33 years) of portage on lot 2
      // Base: €233,175 (94,200 + 11,775 + 127,200)
      // Indexation (2% × 1.33 years): €6,212
      // Carrying costs recovery (100%): €17,103
      // Total: €256,490
      purchasePrice: 256490
    }
  }
];

export const DEFAULT_PROJECT_PARAMS = {
  totalPurchase: 650000,
  mesuresConservatoires: 0,
  demolition: 0,
  infrastructures: 0,
  etudesPreparatoires: 0,
  fraisEtudesPreparatoires: 0,
  fraisGeneraux3ans: 0,
  batimentFondationConservatoire: 0,
  batimentFondationComplete: 0,
  batimentCoproConservatoire: 0,
  globalCascoPerM2: 1590,
  expenseCategories: {
    conservatoire: [
      { label: 'Traitement Mérule', amount: 40000 },
      { label: 'Démolition (mérule)', amount: 20000 },
      { label: 'nettoyage du site', amount: 6000 },
      { label: 'toitures', amount: 10000 },
      { label: 'sécurité du site? (portes, accès..)', amount: 2000 },
    ],
    habitabiliteSommaire: [
      { label: 'plomberie', amount: 1000 },
      { label: 'électricité (refaire un tableau)', amount: 1000 },
      { label: 'retirer des lignes (électrique)', amount: 2000 },
      { label: 'isolation thermique', amount: 1000 },
      { label: 'cloisons', amount: 2000 },
      { label: 'chauffage', amount: 0 },
    ],
    premierTravaux: [
      { label: 'poulailler', amount: 150 },
      { label: 'atelier maintenance (et reparation)', amount: 500 },
      { label: 'stockage ressources/énergie/consommables (eau, bois,...)', amount: 700 },
      { label: 'verger prix par 1ha', amount: 2000 },
      { label: 'atelier construction', amount: 2500 },
      { label: 'Cuisine (commune)', amount: 3000 },
      { label: 'travaux chapelle rudimentaires', amount: 5000 },
      { label: 'local + outil jardin', amount: 5000 },
    ],
  },
};

// DEFAULT_SCENARIO removed - no longer using percentage-based adjustments

export const STORAGE_KEY = 'credit-castor-scenario';
export const PINNED_PARTICIPANT_KEY = 'credit-castor-pinned-participant';

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
export const saveToLocalStorage = (participants: Participant[], projectParams: ProjectParams, deedDate: string, portageFormula?: PortageFormulaParams) => {
  try {
    const data = {
      releaseVersion: RELEASE_VERSION, // Release version for compatibility check
      version: 2, // Data version for migrations within same release
      timestamp: new Date().toISOString(),
      participants,
      projectParams,
      // scenario removed - no longer saving percentage-based adjustments
      deedDate,
      portageFormula: portageFormula || DEFAULT_PORTAGE_FORMULA
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
        // scenario removed - old data may have it but we ignore it
        deedDate: data.deedDate, // May be undefined for old saved data
        portageFormula: data.portageFormula || DEFAULT_PORTAGE_FORMULA,
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
          result.participants = result.participants.map((p: OldParticipant) => {
            const { cascoPerM2: _cascoPerM2, ...rest } = p;
            return rest as Participant;
          });
        }

        // Migration: Convert date strings back to Date objects
        if (result.participants) {
          result.participants = result.participants.map((p: Participant) => {
            // Convert participant dates
            const participant = { ...p };
            if (participant.entryDate && typeof participant.entryDate === 'string') {
              participant.entryDate = new Date(participant.entryDate);
            }
            if (participant.exitDate && typeof participant.exitDate === 'string') {
              participant.exitDate = new Date(participant.exitDate);
            }

            // Convert lot dates
            if (participant.lotsOwned) {
              participant.lotsOwned = participant.lotsOwned.map(lot => {
                const updatedLot = { ...lot };
                if (updatedLot.acquiredDate && typeof updatedLot.acquiredDate === 'string') {
                  updatedLot.acquiredDate = new Date(updatedLot.acquiredDate);
                }
                if (updatedLot.soldDate && typeof updatedLot.soldDate === 'string') {
                  updatedLot.soldDate = new Date(updatedLot.soldDate);
                }
                return updatedLot;
              });
            }

            return participant;
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
