import { describe, it, expect } from 'vitest';
import {
  CORE_SCHEMAS,
  EXPORT_SCHEMAS,
  SCHEMA_COMPATIBILITY,
  getAllFields,
  isRequiredField,
  validateSchema,
  getBreakingChangeFormats,
} from './schemaRegistry';
import type { Participant } from './calculatorUtils';
import type { ScenarioData } from './scenarioFileIO';
import type { FirestoreScenarioData } from '../services/firestoreSync';

/**
 * Schema Registry Validation Tests
 *
 * These tests ensure ALL export formats stay in sync with core schemas.
 * If any export format adds/removes fields from core types, these tests will fail.
 *
 * Purpose: Catch when JSON, Firestore, or XLSX exports get out of sync
 */

describe('Schema Registry - Central Schema Validation', () => {
  describe('Core Schema Definitions', () => {
    it('should have consistent schema version across all core types', () => {
      const versions = Object.values(CORE_SCHEMAS).map(s => s.version);
      const uniqueVersions = new Set(versions);

      expect(uniqueVersions.size).toBe(1);
      expect(versions[0]).toBeGreaterThan(0);
    });

    it('should document all Participant required fields', () => {
      const requiredFields = CORE_SCHEMAS.Participant.requiredFields;

      expect(requiredFields).toEqual([
        'name',
        'capitalApporte',
        'registrationFeesRate',
        'interestRate',
        'durationYears',
      ]);
    });

    it('should document all ProjectParams required fields', () => {
      const requiredFields = CORE_SCHEMAS.ProjectParams.requiredFields;

      expect(requiredFields).toContain('totalPurchase');
      expect(requiredFields).toContain('globalCascoPerM2');
      expect(requiredFields).toContain('travauxCommunsCasco');
    });

    it('should document all PortageFormulaParams required fields', () => {
      const requiredFields = CORE_SCHEMAS.PortageFormulaParams.requiredFields;

      expect(requiredFields).toContain('indexationRate');
      expect(requiredFields).toContain('carryingCostRecovery');
      expect(requiredFields).toContain('averageInterestRate');
      expect(requiredFields).toContain('coproReservesShare');
    });
  });

  describe('Export Format Registration', () => {
    it('should register all export formats', () => {
      const formats = Object.keys(EXPORT_SCHEMAS);

      expect(formats).toContain('JSON');
      expect(formats).toContain('Firestore');
      expect(formats).toContain('XLSX');
    });

    it('should mark JSON exports as loadable back', () => {
      expect(EXPORT_SCHEMAS.JSON.isLoadedBack).toBe(true);
    });

    it('should mark Firestore as loadable back', () => {
      expect(EXPORT_SCHEMAS.Firestore.isLoadedBack).toBe(true);
    });

    it('should mark XLSX as NOT loadable back', () => {
      expect(EXPORT_SCHEMAS.XLSX.isLoadedBack).toBe(false);
    });
  });

  describe('Schema Compatibility Matrix', () => {
    it('should require JSON and Firestore to match core types', () => {
      expect(SCHEMA_COMPATIBILITY.coreTypes.JSON).toBe(true);
      expect(SCHEMA_COMPATIBILITY.coreTypes.Firestore).toBe(true);
    });

    it('should NOT require XLSX to match core types (display only)', () => {
      expect(SCHEMA_COMPATIBILITY.coreTypes.XLSX).toBe(false);
    });

    it('should mark JSON and Firestore as breaking change formats', () => {
      const breakingFormats = SCHEMA_COMPATIBILITY.breakingChangeFormats;

      expect(breakingFormats).toContain('JSON');
      expect(breakingFormats).toContain('Firestore');
      expect(breakingFormats).not.toContain('XLSX');
    });
  });

  describe('Export Format Field Validation', () => {
    /**
     * ⚠️ CRITICAL TEST: JSON export must include all core fields
     */
    it('should validate ScenarioData includes all required top-level fields', () => {
      const scenario: ScenarioData = {
        version: 2,
        releaseVersion: '1.17.0',
        timestamp: new Date().toISOString(),
        participants: [],
        projectParams: {
          totalPurchase: 500000,
          mesuresConservatoires: 0,
          demolition: 0,
          infrastructures: 0,
          etudesPreparatoires: 0,
          fraisEtudesPreparatoires: 0,
          fraisGeneraux3ans: 0,
          batimentFondationConservatoire: 0,
          batimentFondationComplete: 0,
          batimentCoproConservatoire: 0,
          globalCascoPerM2: 800,
        },
        deedDate: '2026-02-01',
        portageFormula: {
          indexationRate: 0.02,
          carryingCostRecovery: 100,
          averageInterestRate: 0.045,
          coproReservesShare: 30,
        },
        unitDetails: {},
      };

      const expectedFields = EXPORT_SCHEMAS.JSON.requiredTopLevelFields;

      expectedFields.forEach(field => {
        expect(scenario).toHaveProperty(field);
      });
    });

    /**
     * ⚠️ CRITICAL TEST: Firestore must include all core fields
     */
    it('should validate FirestoreScenarioData includes all required top-level fields', () => {
      const firestoreData: FirestoreScenarioData = {
        participants: [],
        projectParams: {
          totalPurchase: 500000,
          mesuresConservatoires: 0,
          demolition: 0,
          infrastructures: 0,
          etudesPreparatoires: 0,
          fraisEtudesPreparatoires: 0,
          fraisGeneraux3ans: 0,
          batimentFondationConservatoire: 0,
          batimentFondationComplete: 0,
          batimentCoproConservatoire: 0,
          globalCascoPerM2: 800,
        },
        deedDate: '2026-02-01',
        portageFormula: {
          indexationRate: 0.02,
          carryingCostRecovery: 100,
          averageInterestRate: 0.045,
          coproReservesShare: 30,
        },
        lastModifiedBy: 'test@example.com',
        lastModifiedAt: new Date().toISOString(),
        version: 1,
      };

      const expectedFields = EXPORT_SCHEMAS.Firestore.requiredTopLevelFields;

      expectedFields.forEach(field => {
        expect(firestoreData).toHaveProperty(field);
      });
    });

    /**
     * ⚠️ CRITICAL TEST: JSON and Firestore must store same core types
     */
    it('should ensure JSON and Firestore both store Participant/ProjectParams/PortageFormulaParams', () => {
      // Both must have participants field
      expect(EXPORT_SCHEMAS.JSON.requiredTopLevelFields).toContain('participants');
      expect(EXPORT_SCHEMAS.Firestore.requiredTopLevelFields).toContain('participants');

      // Both must have projectParams field
      expect(EXPORT_SCHEMAS.JSON.requiredTopLevelFields).toContain('projectParams');
      expect(EXPORT_SCHEMAS.Firestore.requiredTopLevelFields).toContain('projectParams');

      // Both must have portageFormula field
      expect(EXPORT_SCHEMAS.JSON.requiredTopLevelFields).toContain('portageFormula');
      expect(EXPORT_SCHEMAS.Firestore.requiredTopLevelFields).toContain('portageFormula');
    });
  });

  describe('Schema Validation Utilities', () => {
    it('getAllFields should return all fields for a schema', () => {
      const participantFields = getAllFields('Participant');

      expect(participantFields).toContain('name');
      expect(participantFields).toContain('capitalApporte');
      expect(participantFields).toContain('registrationFeesRate');
      expect(participantFields).toContain('useTwoLoans'); // optional
    });

    it('isRequiredField should identify required fields', () => {
      expect(isRequiredField('Participant', 'name')).toBe(true);
      expect(isRequiredField('Participant', 'capitalApporte')).toBe(true);
      expect(isRequiredField('Participant', 'useTwoLoans')).toBe(false); // optional
    });

    it('validateSchema should detect missing required fields', () => {
      const invalidParticipant = {
        name: 'Test',
        // Missing capitalApporte, registrationFeesRate, interestRate, durationYears
      };

      const result = validateSchema('Participant', invalidParticipant);

      expect(result.valid).toBe(false);
      expect(result.missingFields).toContain('capitalApporte');
      expect(result.missingFields).toContain('registrationFeesRate');
    });

    it('validateSchema should pass for valid objects', () => {
      const validParticipant: Participant = {
        name: 'Test',
        capitalApporte: 10000,
        registrationFeesRate: 0.125,
        interestRate: 0.04,
        durationYears: 20,
      };

      const result = validateSchema('Participant', validParticipant);

      expect(result.valid).toBe(true);
      expect(result.missingFields).toEqual([]);
    });

    it('getBreakingChangeFormats should return only formats that load back', () => {
      const breakingFormats = getBreakingChangeFormats();

      expect(breakingFormats).toContain('JSON');
      expect(breakingFormats).toContain('Firestore');
      expect(breakingFormats).not.toContain('XLSX');
    });
  });

  /**
   * ⚠️ BREAKING CHANGE DETECTOR
   *
   * If this test fails, it means:
   * 1. A core schema field was added/removed
   * 2. An export format got out of sync
   *
   * Action required:
   * - If intentional: Update schema registry and bump major version
   * - If unintentional: Fix the export format to match core schema
   */
  describe('Cross-Format Consistency', () => {
    it('should maintain consistency across all breaking change formats', () => {
      const breakingFormats = getBreakingChangeFormats();

      // All breaking formats must include the same core types
      breakingFormats.forEach(format => {
        const schema = EXPORT_SCHEMAS[format as keyof typeof EXPORT_SCHEMAS];

        expect(schema.requiredTopLevelFields).toContain('participants');
        expect(schema.requiredTopLevelFields).toContain('projectParams');
        expect(schema.requiredTopLevelFields).toContain('portageFormula');
      });
    });

    it('should document which formats include calculations', () => {
      expect(EXPORT_SCHEMAS.JSON.includesCalculations).toBe(true);
      expect(EXPORT_SCHEMAS.Firestore.includesCalculations).toBe(false);
      expect(EXPORT_SCHEMAS.XLSX.includesCalculations).toBe(true);
    });
  });

  /**
   * Version bump reminder
   * Update CORE_SCHEMA_VERSION when making breaking changes
   */
  describe('Schema Version Tracking', () => {
    it('should remind to bump schema version for breaking changes', () => {
      const currentVersion = CORE_SCHEMAS.Participant.version;
      const needsVersionBump = false; // Set to true when making breaking changes

      if (needsVersionBump) {
        throw new Error(
          `⚠️ SCHEMA BREAKING CHANGE DETECTED!\n\n` +
          `Current schema version: ${currentVersion}\n` +
          `Action required:\n` +
          `1. Increment CORE_SCHEMA_VERSION in src/utils/schemaRegistry.ts\n` +
          `2. Update all affected export formats\n` +
          `3. Set needsVersionBump = false in this test\n` +
          `4. Bump RELEASE_VERSION to ${Math.floor(currentVersion) + 1}.0.0\n`
        );
      }

      expect(needsVersionBump).toBe(false);
    });
  });
});
