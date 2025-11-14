import { describe, it, expect } from 'vitest';
import type { Participant, ProjectParams, PortageFormulaParams } from './calculatorUtils';
import type { ScenarioData } from './scenarioFileIO';
import type { FirestoreScenarioData } from '../services/firestoreSync';

/**
 * Data Schema Validation Tests
 *
 * These tests validate the shape of data structures that are persisted.
 * If any of these tests fail, it indicates a BREAKING CHANGE that requires
 * a MAJOR VERSION BUMP (e.g., 1.x.x → 2.0.0).
 *
 * Protected data structures:
 * - localStorage (storage.ts)
 * - JSON export (scenarioFileIO.ts)
 * - Firestore (firestoreSync.ts)
 */

describe('Data Schema Validation - Breaking Change Detection', () => {
  describe('Participant interface (CRITICAL - stored in localStorage/Firestore/JSON)', () => {
    it('should have required fields with correct types', () => {
      const participant: Participant = {
        name: 'Test',
        capitalApporte: 10000,
        registrationFeesRate: 0.125,
        interestRate: 0.04,
        durationYears: 20,
        // All other fields are optional
      };

      // Type checking ensures this compiles
      expect(participant.name).toBeDefined();
      expect(typeof participant.capitalApporte).toBe('number');
      expect(typeof participant.registrationFeesRate).toBe('number');
      expect(typeof participant.interestRate).toBe('number');
      expect(typeof participant.durationYears).toBe('number');
    });

    it('should support optional timeline fields', () => {
      const participant: Participant = {
        name: 'Test',
        capitalApporte: 10000,
        registrationFeesRate: 0.125,
        interestRate: 0.04,
        durationYears: 20,
        isFounder: true,
        entryDate: new Date(),
        exitDate: undefined,
        lotsOwned: [],
      };

      expect(participant.isFounder).toBeDefined();
      expect(participant.entryDate).toBeInstanceOf(Date);
    });

    it('should support optional two-loan financing fields', () => {
      const participant: Participant = {
        name: 'Test',
        capitalApporte: 10000,
        registrationFeesRate: 0.125,
        interestRate: 0.04,
        durationYears: 20,
        useTwoLoans: true,
        loan2DelayYears: 2,
        loan2RenovationAmount: 50000,
        capitalForLoan1: 5000,
        capitalForLoan2: 5000,
      };

      expect(participant.useTwoLoans).toBe(true);
    });

    it('should support optional purchase details for newcomers', () => {
      const participant: Participant = {
        name: 'Test',
        capitalApporte: 10000,
        registrationFeesRate: 0.125,
        interestRate: 0.04,
        durationYears: 20,
        purchaseDetails: {
          buyingFrom: 'Alice',
          lotId: 1,
          purchasePrice: 100000,
          breakdown: {
            basePrice: 80000,
            indexation: 5000,
            carryingCostRecovery: 10000,
            feesRecovery: 5000,
            renovations: 0,
          },
        },
      };

      expect(participant.purchaseDetails?.lotId).toBeDefined();
      expect(participant.purchaseDetails?.purchasePrice).toBeDefined();
    });

    /**
     * ⚠️ BREAKING CHANGE DETECTOR
     * If you rename, remove, or change the type of any field in Participant,
     * this test will fail, indicating you need to bump the MAJOR version.
     */
    it('should maintain backward compatibility with required field names', () => {
      const requiredFields = [
        'name',
        'capitalApporte',
        'registrationFeesRate',
        'interestRate',
        'durationYears',
      ];

      const participant: Participant = {
        name: 'Test',
        capitalApporte: 10000,
        registrationFeesRate: 0.125,
        interestRate: 0.04,
        durationYears: 20,
      };

      requiredFields.forEach((field) => {
        expect(participant).toHaveProperty(field);
      });
    });
  });

  describe('ProjectParams interface (CRITICAL - stored in localStorage/Firestore/JSON)', () => {
    it('should have required fields with correct types', () => {
      const params: ProjectParams = {
        totalPurchase: 500000,
        globalCascoPerM2: 800,
        travauxCommunsCasco: 30000,
        travauxCommunsParachevements: 20000,
      };

      expect(typeof params.totalPurchase).toBe('number');
      expect(typeof params.globalCascoPerM2).toBe('number');
    });

    it('should support optional TVA rate', () => {
      const params: ProjectParams = {
        totalPurchase: 500000,
        globalCascoPerM2: 800,
        travauxCommunsCasco: 30000,
        travauxCommunsParachevements: 20000,
        cascoTvaRate: 0.06,
      };

      expect(params.cascoTvaRate).toBe(0.06);
    });

    /**
     * ⚠️ BREAKING CHANGE DETECTOR
     */
    it('should maintain backward compatibility with required field names', () => {
      const requiredFields = [
        'totalPurchase',
        'globalCascoPerM2',
        'travauxCommunsCasco',
        'travauxCommunsParachevements',
      ];

      const params: ProjectParams = {
        totalPurchase: 500000,
        globalCascoPerM2: 800,
        travauxCommunsCasco: 30000,
        travauxCommunsParachevements: 20000,
      };

      requiredFields.forEach((field) => {
        expect(params).toHaveProperty(field);
      });
    });
  });

  describe('PortageFormulaParams interface (CRITICAL - stored in localStorage/Firestore/JSON)', () => {
    it('should have required fields with correct types', () => {
      const formula: PortageFormulaParams = {
        indexationRate: 0.02,
        insuranceMonthly: 40,
      };

      expect(typeof formula.indexationRate).toBe('number');
    });

    it('should support optional carrying cost recovery rate', () => {
      const formula: PortageFormulaParams = {
        indexationRate: 0.02,
        insuranceMonthly: 40,
        carryingCostRecovery: 70,
      };

      expect(formula.carryingCostRecovery).toBe(70);
    });
  });

  describe('ScenarioData interface (JSON export format)', () => {
    /**
     * ⚠️ BREAKING CHANGE DETECTOR for JSON export
     */
    it('should maintain required top-level fields', () => {
      const requiredFields = [
        'version',
        'releaseVersion',
        'timestamp',
        'participants',
        'projectParams',
        'deedDate',
        'portageFormula',
        'unitDetails',
      ];

      // Create a minimal valid ScenarioData
      const data: ScenarioData = {
        version: 2,
        releaseVersion: '1.16.0',
        timestamp: new Date().toISOString(),
        participants: [],
        projectParams: {
          totalPurchase: 500000,
          globalCascoPerM2: 800,
          travauxCommunsCasco: 30000,
          travauxCommunsParachevements: 20000,
        },
        deedDate: '2026-02-01',
        portageFormula: {
          indexationRate: 0.02,
          insuranceMonthly: 40,
        },
        unitDetails: {},
      };

      requiredFields.forEach((field) => {
        expect(data).toHaveProperty(field);
      });
    });

    it('should include calculations field structure', () => {
      const calculations = {
        totalSurface: 100,
        pricePerM2: 5000,
        sharedCosts: 50000,
        sharedPerPerson: 10000,
        participantBreakdown: [],
        totals: {
          purchase: 500000,
          totalDroitEnregistrements: 62500,
          totalFraisNotaireFixe: 1000,
          construction: 100000,
          shared: 50000,
          totalTravauxCommuns: 50000,
          travauxCommunsPerUnit: 10000,
          total: 712500,
          capitalTotal: 100000,
          totalLoansNeeded: 612500,
          averageLoan: 153125,
          averageCapital: 25000,
        },
      };

      expect(calculations.totals).toHaveProperty('totalDroitEnregistrements');
      expect(calculations.totals).toHaveProperty('totalFraisNotaireFixe');
    });
  });

  describe('FirestoreScenarioData interface (Firestore format)', () => {
    /**
     * ⚠️ BREAKING CHANGE DETECTOR for Firestore
     */
    it('should maintain required top-level fields', () => {
      const requiredFields = [
        'participants',
        'projectParams',
        'deedDate',
        'portageFormula',
        'lastModifiedBy',
        'lastModifiedAt',
        'version',
      ];

      const data: FirestoreScenarioData = {
        participants: [],
        projectParams: {
          totalPurchase: 500000,
          globalCascoPerM2: 800,
          travauxCommunsCasco: 30000,
          travauxCommunsParachevements: 20000,
        },
        deedDate: '2026-02-01',
        portageFormula: {
          indexationRate: 0.02,
          insuranceMonthly: 40,
        },
        lastModifiedBy: 'test@example.com',
        lastModifiedAt: new Date().toISOString(),
        version: 1,
      };

      requiredFields.forEach((field) => {
        expect(data).toHaveProperty(field);
      });
    });
  });

  /**
   * Version bump reminder test
   * This test intentionally fails when you need to bump the major version.
   *
   * When to update:
   * 1. Made a breaking change? Set needsMajorVersionBump = true
   * 2. Bumped major version? Set needsMajorVersionBump = false and update currentMajor
   */
  describe('Version Bump Reminder', () => {
    it('should remind to bump major version when breaking changes are made', () => {
      const currentMajorVersion = 1;
      const needsMajorVersionBump = false; // Set to true when making breaking changes

      if (needsMajorVersionBump) {
        throw new Error(
          `⚠️ BREAKING CHANGE DETECTED!\n\n` +
          `Current major version: ${currentMajorVersion}\n` +
          `Action required:\n` +
          `1. Update RELEASE_VERSION to ${currentMajorVersion + 1}.0.0 in src/utils/version.ts\n` +
          `2. Set needsMajorVersionBump = false in this test\n` +
          `3. Update currentMajorVersion = ${currentMajorVersion + 1} in this test\n` +
          `4. Document the breaking change in version.ts\n`
        );
      }

      expect(needsMajorVersionBump).toBe(false);
    });
  });
});
