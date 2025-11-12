/**
 * Tests for data loading service
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { validateSchema, loadApplicationData } from './dataLoader';
import * as firestoreSync from './firestoreSync';
import * as storage from '../utils/storage';
import { DEFAULT_PORTAGE_FORMULA } from '../utils/calculatorUtils';

// Mock modules
vi.mock('./firestoreSync');
vi.mock('../utils/storage');

describe('validateSchema', () => {
  it('should validate valid data structure', () => {
    const validData = {
      participants: [
        {
          name: 'Test User',
          capitalApporte: 50000,
          registrationFeesRate: 12.5,
          surface: 100,
          interestRate: 4.5,
          durationYears: 25,
        },
      ],
      projectParams: {
        totalPurchase: 650000,
        globalCascoPerM2: 1590,
      },
      deedDate: '2026-02-01',
      portageFormula: {
        indexationRate: 2,
        portageRecoveryRate: 100,
      },
    };

    expect(validateSchema(validData)).toBe(true);
  });

  it('should reject data with missing participants', () => {
    const invalidData = {
      projectParams: {},
      deedDate: '2026-02-01',
      portageFormula: {},
    };

    expect(validateSchema(invalidData)).toBe(false);
  });

  it('should reject data with invalid participants array', () => {
    const invalidData = {
      participants: 'not an array',
      projectParams: {},
      deedDate: '2026-02-01',
      portageFormula: {},
    };

    expect(validateSchema(invalidData)).toBe(false);
  });

  it('should reject data with missing projectParams', () => {
    const invalidData = {
      participants: [],
      deedDate: '2026-02-01',
      portageFormula: {},
    };

    expect(validateSchema(invalidData)).toBe(false);
  });

  it('should reject data with invalid participant structure', () => {
    const invalidData = {
      participants: [
        {
          // Missing name
          capitalApporte: 50000,
        },
      ],
      projectParams: {},
      deedDate: '2026-02-01',
      portageFormula: {},
    };

    expect(validateSchema(invalidData)).toBe(false);
  });

  it('should reject null or undefined data', () => {
    expect(validateSchema(null)).toBe(false);
    expect(validateSchema(undefined)).toBe(false);
  });
});

describe('loadApplicationData', () => {
  const mockParticipant = {
    name: 'Test User',
    capitalApporte: 50000,
    registrationFeesRate: 12.5,
    surface: 100,
    interestRate: 4.5,
    durationYears: 25,
    quantity: 1,
    parachevementsPerM2: 500,
    isFounder: true,
    entryDate: new Date('2026-02-01'),
  };

  const mockProjectParams = {
    totalPurchase: 650000,
    globalCascoPerM2: 1590,
    cascoTvaRate: 6,
    mesuresConservatoires: 0,
    demolition: 0,
    infrastructures: 0,
    etudesPreparatoires: 0,
    fraisEtudesPreparatoires: 0,
    fraisGeneraux3ans: 0,
    batimentFondationConservatoire: 0,
    batimentFondationComplete: 0,
    batimentCoproConservatoire: 0,
  };

  const mockFirestoreData = {
    participants: [mockParticipant],
    projectParams: mockProjectParams,
    deedDate: '2026-02-01',
    portageFormula: DEFAULT_PORTAGE_FORMULA,
    lastModifiedBy: 'test@example.com',
    lastModifiedAt: new Date().toISOString(),
    version: 1,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock window.alert
    vi.stubGlobal('alert', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should load from Firestore when available and valid', async () => {
    vi.mocked(firestoreSync.isFirestoreSyncAvailable).mockReturnValue(true);
    vi.mocked(firestoreSync.loadScenarioFromFirestore).mockResolvedValue({
      success: true,
      data: mockFirestoreData,
    });

    const result = await loadApplicationData();

    expect(result.success).toBe(true);
    expect(result.data?.source).toBe('firestore');
    expect(result.data?.participants).toEqual([mockParticipant]);
  });

  it('should fallback to localStorage when Firestore unavailable', async () => {
    vi.mocked(firestoreSync.isFirestoreSyncAvailable).mockReturnValue(false);
    vi.mocked(storage.loadFromLocalStorage).mockReturnValue({
      isCompatible: true,
      participants: [mockParticipant],
      projectParams: mockProjectParams,
      deedDate: '2026-02-01',
      portageFormula: DEFAULT_PORTAGE_FORMULA,
      storedVersion: '1.0.0',
      currentVersion: '1.0.0',
      timestamp: new Date().toISOString(),
    });

    const result = await loadApplicationData();

    expect(result.success).toBe(true);
    expect(result.data?.source).toBe('localStorage');
    expect(result.data?.participants).toEqual([mockParticipant]);
  });

  it('should fallback to localStorage when Firestore has no data', async () => {
    vi.mocked(firestoreSync.isFirestoreSyncAvailable).mockReturnValue(true);
    vi.mocked(firestoreSync.loadScenarioFromFirestore).mockResolvedValue({
      success: false,
      error: 'No data found',
    });
    vi.mocked(storage.loadFromLocalStorage).mockReturnValue({
      isCompatible: true,
      participants: [mockParticipant],
      projectParams: mockProjectParams,
      deedDate: '2026-02-01',
      portageFormula: DEFAULT_PORTAGE_FORMULA,
      storedVersion: '1.0.0',
      currentVersion: '1.0.0',
      timestamp: new Date().toISOString(),
    });

    const result = await loadApplicationData();

    expect(result.success).toBe(true);
    expect(result.data?.source).toBe('localStorage');
    expect(result.data?.needsMigration).toBe(true); // Should suggest migration
  });

  it('should show alert when no valid data source available', async () => {
    vi.mocked(firestoreSync.isFirestoreSyncAvailable).mockReturnValue(false);
    vi.mocked(storage.loadFromLocalStorage).mockReturnValue(null);

    const result = await loadApplicationData();

    expect(result.success).toBe(false);
    expect(result.requiresAlert).toBe(true);
    expect(window.alert).toHaveBeenCalledWith(
      expect.stringContaining('DEVELOPER ALERT')
    );
  });

  it('should reject localStorage data with incompatible version', async () => {
    vi.mocked(firestoreSync.isFirestoreSyncAvailable).mockReturnValue(false);
    vi.mocked(storage.loadFromLocalStorage).mockReturnValue({
      isCompatible: false,
      participants: [mockParticipant],
      projectParams: mockProjectParams,
      deedDate: '2026-02-01',
      portageFormula: DEFAULT_PORTAGE_FORMULA,
      storedVersion: '0.5.0',
      currentVersion: '1.0.0',
      timestamp: new Date().toISOString(),
    });

    const result = await loadApplicationData();

    expect(result.success).toBe(false);
    expect(window.alert).toHaveBeenCalled();
  });

  it('should reject data that fails schema validation', async () => {
    vi.mocked(firestoreSync.isFirestoreSyncAvailable).mockReturnValue(true);
    vi.mocked(firestoreSync.loadScenarioFromFirestore).mockResolvedValue({
      success: true,
      data: {
        // Invalid: missing required fields
        participants: [],
      } as any,
    });
    vi.mocked(storage.loadFromLocalStorage).mockReturnValue(null);

    const result = await loadApplicationData();

    expect(result.success).toBe(false);
    expect(window.alert).toHaveBeenCalled();
  });

  it('should skip Firestore when skipFirestore option is true', async () => {
    vi.mocked(storage.loadFromLocalStorage).mockReturnValue({
      isCompatible: true,
      participants: [mockParticipant],
      projectParams: mockProjectParams,
      deedDate: '2026-02-01',
      portageFormula: DEFAULT_PORTAGE_FORMULA,
      storedVersion: '1.0.0',
      currentVersion: '1.0.0',
      timestamp: new Date().toISOString(),
    });

    const result = await loadApplicationData({ skipFirestore: true });

    expect(firestoreSync.isFirestoreSyncAvailable).not.toHaveBeenCalled();
    expect(firestoreSync.loadScenarioFromFirestore).not.toHaveBeenCalled();
    expect(result.success).toBe(true);
    expect(result.data?.source).toBe('localStorage');
  });

  it('should NOT fallback to localStorage on Firestore network error', async () => {
    // Setup mocks
    vi.mocked(firestoreSync.isFirestoreSyncAvailable).mockReturnValue(true);
    vi.mocked(firestoreSync.loadScenarioFromFirestore).mockResolvedValue({
      success: false,
      error: 'Network error',
      errorType: 'network-error',
    });
    vi.mocked(storage.loadFromLocalStorage).mockReturnValue({
      isCompatible: true,
      participants: [mockParticipant],
      projectParams: mockProjectParams,
      deedDate: '2026-02-01',
      portageFormula: DEFAULT_PORTAGE_FORMULA,
      storedVersion: '1.0.0',
      currentVersion: '1.0.0',
      timestamp: new Date().toISOString(),
    });

    const result = await loadApplicationData();

    // Should fail with network error
    expect(result.success).toBe(false);
    expect(result.errorType).toBe('network-error');
    expect(result.showToast).toBe(true);

    // Should NOT have attempted to load from localStorage
    expect(storage.loadFromLocalStorage).not.toHaveBeenCalled();
  });

  it('should fallback to localStorage when Firestore has no-data error', async () => {
    // Setup mocks
    vi.mocked(firestoreSync.isFirestoreSyncAvailable).mockReturnValue(true);
    vi.mocked(firestoreSync.loadScenarioFromFirestore).mockResolvedValue({
      success: false,
      error: 'No data found',
      errorType: 'no-data',
    });
    vi.mocked(storage.loadFromLocalStorage).mockReturnValue({
      isCompatible: true,
      participants: [mockParticipant],
      projectParams: mockProjectParams,
      deedDate: '2026-02-01',
      portageFormula: DEFAULT_PORTAGE_FORMULA,
      storedVersion: '1.0.0',
      currentVersion: '1.0.0',
      timestamp: new Date().toISOString(),
    });

    const result = await loadApplicationData();

    // Should succeed with localStorage fallback
    expect(result.success).toBe(true);
    expect(result.data?.source).toBe('localStorage');

    // Should have attempted to load from localStorage
    expect(storage.loadFromLocalStorage).toHaveBeenCalled();
  });
});
