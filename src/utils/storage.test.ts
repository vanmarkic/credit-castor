import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { saveToLocalStorage, loadFromLocalStorage, DEFAULT_PROJECT_PARAMS } from './storage';
import { DEFAULT_RENT_TO_OWN_FORMULA, DEFAULT_PORTAGE_FORMULA } from './calculatorUtils';

describe('Rent-to-Own Storage Migration', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should add rentToOwnFormula to new saves', () => {
    const testData = {
      participants: [],
      projectParams: DEFAULT_PROJECT_PARAMS,
      deedDate: '2026-02-01',
      portageFormula: DEFAULT_PORTAGE_FORMULA
    };

    saveToLocalStorage(testData.participants, testData.projectParams, testData.deedDate, testData.portageFormula);

    const loaded = loadFromLocalStorage();
    expect(loaded).toBeTruthy();
    expect(loaded?.rentToOwnFormula).toEqual(DEFAULT_RENT_TO_OWN_FORMULA);
  });

  it('should migrate old data without rentToOwnFormula', () => {
    // Simulate old saved data without rent-to-own fields
    const oldData = {
      releaseVersion: '1.0.0',
      version: 2,
      participants: [],
      projectParams: DEFAULT_PROJECT_PARAMS,
      deedDate: '2026-02-01',
      portageFormula: DEFAULT_PORTAGE_FORMULA
    };

    localStorage.setItem('credit-castor-scenario', JSON.stringify(oldData));

    const loaded = loadFromLocalStorage();
    expect(loaded).toBeTruthy();
    expect(loaded?.rentToOwnFormula).toEqual(DEFAULT_RENT_TO_OWN_FORMULA);
  });

  it('should add provisional participant fields during migration', () => {
    const oldData = {
      releaseVersion: '1.0.0',
      version: 2,
      participants: [{
        name: 'Test',
        capitalApporte: 50000,
        notaryFeesRate: 12.5,
        interestRate: 4.5,
        durationYears: 25
        // Missing: participantStatus, hasVotingRights, etc.
      }],
      projectParams: DEFAULT_PROJECT_PARAMS,
      deedDate: '2026-02-01',
      portageFormula: DEFAULT_PORTAGE_FORMULA
    };

    localStorage.setItem('credit-castor-scenario', JSON.stringify(oldData));

    const loaded = loadFromLocalStorage();
    expect(loaded).toBeTruthy();
    expect(loaded?.participants[0].participantStatus).toBe('full');
    expect(loaded?.participants[0].hasVotingRights).toBe(true);
    expect(loaded?.participants[0].excludeFromQuotite).toBe(false);
    expect(loaded?.participants[0].canAttendMeetings).toBe(true);
  });
});
