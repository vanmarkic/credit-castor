/**
 * Central Schema Registry
 *
 * Single source of truth for all data schemas used across different export formats.
 * This ensures JSON exports, Firestore documents, and XLSX exports stay in sync.
 *
 * Referenced types:
 * - Participant, ProjectParams, PortageFormulaParams (src/utils/calculatorUtils.ts)
 * - ScenarioData (src/utils/scenarioFileIO.ts)
 * - FirestoreScenarioData (src/services/firestoreSync.ts)
 */

/**
 * Core schema version
 * Increment when making changes to Participant, ProjectParams, or PortageFormulaParams
 */
export const CORE_SCHEMA_VERSION = 1;

/**
 * Required fields for each core interface
 * Used for validation across all export formats
 */
export const CORE_SCHEMAS = {
  Participant: {
    version: CORE_SCHEMA_VERSION,
    requiredFields: [
      'name',
      'capitalApporte',
      'registrationFeesRate',
      'interestRate',
      'durationYears',
    ] as const,
    optionalFields: [
      'useTwoLoans',
      'loan2DelayYears',
      'loan2RenovationAmount',
      'capitalForLoan1',
      'capitalForLoan2',
      'isFounder',
      'entryDate',
      'exitDate',
      'lotsOwned',
      'purchaseDetails',
      'unitId',
      'surface',
      'quantity',
      'cascoPerM2',
      'parachevementsPerM2',
      'cascoSqm',
      'parachevementsSqm',
    ] as const,
  },
  ProjectParams: {
    version: CORE_SCHEMA_VERSION,
    requiredFields: [
      'totalPurchase',
      'mesuresConservatoires',
      'demolition',
      'infrastructures',
      'etudesPreparatoires',
      'globalCascoPerM2',
      'sharedFixedCosts',
      'travauxCommunsCasco',
      'travauxCommunsParachevements',
    ] as const,
    optionalFields: [
      'cascoTvaRate',
      'expenseCategories',
    ] as const,
  },
  PortageFormulaParams: {
    version: CORE_SCHEMA_VERSION,
    requiredFields: [
      'indexationRate',
      'carryingCostRecovery',
      'averageInterestRate',
      'coproReservesShare',
    ] as const,
    optionalFields: [] as const,
  },
} as const;

/**
 * Export format schemas
 * Documents which fields each export format includes
 */
export const EXPORT_SCHEMAS = {
  JSON: {
    format: 'JSON' as const,
    interface: 'ScenarioData' as const,
    location: 'src/utils/scenarioFileIO.ts' as const,
    includesCalculations: true,
    requiredTopLevelFields: [
      'version',
      'releaseVersion',
      'timestamp',
      'participants',
      'projectParams',
      'deedDate',
      'portageFormula',
      'unitDetails',
    ] as const,
    isLoadedBack: true, // JSON can be imported back into the app
  },
  Firestore: {
    format: 'Firestore' as const,
    interface: 'FirestoreScenarioData' as const,
    location: 'src/services/firestoreSync.ts' as const,
    includesCalculations: false,
    requiredTopLevelFields: [
      'participants',
      'projectParams',
      'deedDate',
      'portageFormula',
      'lastModifiedBy',
      'lastModifiedAt',
      'version',
    ] as const,
    isLoadedBack: true, // Firestore syncs back to the app
  },
  XLSX: {
    format: 'XLSX' as const,
    interface: 'SheetData' as const,
    location: 'src/utils/excelExport.ts' as const,
    includesCalculations: true,
    requiredTopLevelFields: [] as const, // XLSX uses columns, not fields
    isLoadedBack: false, // XLSX is one-way export only
  },
} as const;

/**
 * Schema compatibility matrix
 * Documents which export formats must stay in sync
 */
export const SCHEMA_COMPATIBILITY = {
  // Core types must match across all formats that load data back
  coreTypes: {
    JSON: true,      // Must match Participant/ProjectParams/PortageFormulaParams
    Firestore: true, // Must match Participant/ProjectParams/PortageFormulaParams
    XLSX: false,     // Display only, doesn't load back
  },
  // Breaking changes require major version bump
  breakingChangeFormats: ['JSON', 'Firestore'] as const,
  // Non-breaking change formats (tracked but not blocking)
  nonBreakingFormats: ['XLSX'] as const,
} as const;

/**
 * Helper: Get all fields from a schema
 */
export function getAllFields<T extends keyof typeof CORE_SCHEMAS>(
  schemaName: T
): readonly string[] {
  const schema = CORE_SCHEMAS[schemaName];
  return [...schema.requiredFields, ...schema.optionalFields];
}

/**
 * Helper: Check if a field is required
 */
export function isRequiredField<T extends keyof typeof CORE_SCHEMAS>(
  schemaName: T,
  fieldName: string
): boolean {
  const schema = CORE_SCHEMAS[schemaName];
  return schema.requiredFields.includes(fieldName as never);
}

/**
 * Helper: Get export formats that load data back (breaking changes)
 */
export function getBreakingChangeFormats(): readonly string[] {
  return SCHEMA_COMPATIBILITY.breakingChangeFormats;
}

/**
 * Type utilities for schema validation
 */
export type CoreSchemaName = keyof typeof CORE_SCHEMAS;
export type ExportFormatName = keyof typeof EXPORT_SCHEMAS;
export type BreakingChangeFormat = typeof SCHEMA_COMPATIBILITY.breakingChangeFormats[number];

/**
 * Validation: Ensure an object has all required fields
 */
export function validateSchema<T extends CoreSchemaName>(
  schemaName: T,
  obj: Record<string, any>
): { valid: boolean; missingFields: string[] } {
  const schema = CORE_SCHEMAS[schemaName];
  const missingFields = schema.requiredFields.filter(
    field => !(field in obj)
  );

  return {
    valid: missingFields.length === 0,
    missingFields: missingFields as string[],
  };
}
