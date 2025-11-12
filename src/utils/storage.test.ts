import { describe, it, expect, beforeEach } from 'vitest';
import { loadFromLocalStorage, STORAGE_KEY } from './storage';
import { RELEASE_VERSION } from './version';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    }
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('storage - notaryFeesRate → registrationFeesRate migration', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  it('should migrate notaryFeesRate to registrationFeesRate for old data', () => {
    const oldData = {
      releaseVersion: RELEASE_VERSION,
      version: 2,
      timestamp: new Date().toISOString(),
      participants: [
        {
          name: 'Test Participant',
          capitalApporte: 100000,
          notaryFeesRate: 12.5, // Old field name
          interestRate: 4.5,
          durationYears: 25,
          surface: 100,
          quantity: 1,
          parachevementsPerM2: 500
        }
      ],
      projectParams: {},
      deedDate: '2026-02-01',
      portageFormula: {
        indexationRate: 2.0,
        carryingCostRecovery: 100,
        averageInterestRate: 4.5,
        coproReservesShare: 30
      }
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(oldData));

    const loaded = loadFromLocalStorage();

    expect(loaded).not.toBeNull();
    expect(loaded!.participants[0].registrationFeesRate).toBe(12.5);
    expect(loaded!.participants[0]).not.toHaveProperty('notaryFeesRate');
  });

  it('should preserve registrationFeesRate if already present in new data', () => {
    const newData = {
      releaseVersion: RELEASE_VERSION,
      version: 2,
      timestamp: new Date().toISOString(),
      participants: [
        {
          name: 'Test Participant',
          capitalApporte: 100000,
          registrationFeesRate: 3.0, // New field name
          interestRate: 4.5,
          durationYears: 25,
          surface: 100,
          quantity: 1,
          parachevementsPerM2: 500
        }
      ],
      projectParams: {},
      deedDate: '2026-02-01',
      portageFormula: {
        indexationRate: 2.0,
        carryingCostRecovery: 100,
        averageInterestRate: 4.5,
        coproReservesShare: 30
      }
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));

    const loaded = loadFromLocalStorage();

    expect(loaded).not.toBeNull();
    expect(loaded!.participants[0].registrationFeesRate).toBe(3.0);
  });
});

describe('storage - portageFormula migration', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  it('should merge stored portageFormula with defaults when coproReservesShare is missing', () => {
    // Simulate old data without coproReservesShare
    const oldData = {
      releaseVersion: RELEASE_VERSION,
      version: 2,
      timestamp: new Date().toISOString(),
      participants: [],
      projectParams: {},
      deedDate: '2026-02-01',
      portageFormula: {
        indexationRate: 2.5, // Custom value
        carryingCostRecovery: 80, // Custom value
        averageInterestRate: 4.5
        // coproReservesShare is missing (old data)
      }
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(oldData));

    const loaded = loadFromLocalStorage();

    expect(loaded).not.toBeNull();
    expect(loaded!.portageFormula).toEqual({
      indexationRate: 2.5, // Preserved from old data
      carryingCostRecovery: 80, // Preserved from old data
      averageInterestRate: 4.5, // Preserved from old data
      coproReservesShare: 30 // Added from DEFAULT_PORTAGE_FORMULA
    });
  });

  it('should preserve existing coproReservesShare when present', () => {
    const dataWithCoproReserves = {
      releaseVersion: RELEASE_VERSION,
      version: 2,
      timestamp: new Date().toISOString(),
      participants: [],
      projectParams: {},
      deedDate: '2026-02-01',
      portageFormula: {
        indexationRate: 2.0,
        carryingCostRecovery: 100,
        averageInterestRate: 4.5,
        coproReservesShare: 60 // Custom value
      }
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataWithCoproReserves));

    const loaded = loadFromLocalStorage();

    expect(loaded).not.toBeNull();
    expect(loaded!.portageFormula.coproReservesShare).toBe(60);
  });

  it('should use DEFAULT_PORTAGE_FORMULA when portageFormula is missing entirely', () => {
    const oldDataNoFormula = {
      releaseVersion: RELEASE_VERSION,
      version: 2,
      timestamp: new Date().toISOString(),
      participants: [],
      projectParams: {},
      deedDate: '2026-02-01'
      // portageFormula is missing entirely
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(oldDataNoFormula));

    const loaded = loadFromLocalStorage();

    expect(loaded).not.toBeNull();
    expect(loaded!.portageFormula).toEqual({
      indexationRate: 2.0,
      carryingCostRecovery: 100,
      averageInterestRate: 4.5,
      coproReservesShare: 30
    });
  });

  it('should handle partial portageFormula objects correctly', () => {
    const partialData = {
      releaseVersion: RELEASE_VERSION,
      version: 2,
      timestamp: new Date().toISOString(),
      participants: [],
      projectParams: {},
      deedDate: '2026-02-01',
      portageFormula: {
        indexationRate: 3.0
        // All other fields missing
      }
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(partialData));

    const loaded = loadFromLocalStorage();

    expect(loaded).not.toBeNull();
    expect(loaded!.portageFormula).toEqual({
      indexationRate: 3.0, // Preserved from stored data
      carryingCostRecovery: 100, // From DEFAULT_PORTAGE_FORMULA
      averageInterestRate: 4.5, // From DEFAULT_PORTAGE_FORMULA
      coproReservesShare: 30 // From DEFAULT_PORTAGE_FORMULA (the new field)
    });
  });
});
