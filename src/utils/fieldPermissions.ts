/**
 * Field permission utilities for the locking system.
 * Categorizes fields as "collective" (locked by default) or "individual" (always editable).
 */

/**
 * Collective fields that require admin unlock to edit.
 * These affect the entire project and should be controlled centrally.
 */
const COLLECTIVE_FIELD_PATTERNS = [
  // All project parameters
  'projectParams',
  'projectParams.*',

  // Portage formula configuration
  'portageFormula',
  'portageFormula.*',

  // Global project dates
  'deedDate',

  // Participant financing terms (collective decision)
  'participants.*.interestRate',
  'participants.*.durationYears',
  'participants.*.notaryFeesRate',

  // Two-loan configuration
  'participants.*.useTwoLoans',
  'participants.*.loan2DelayYears',
  'participants.*.loan2RenovationAmount',

  // Timeline fields (managed collectively)
  'participants.*.isFounder',
  'participants.*.entryDate',
  'participants.*.exitDate',
];

/**
 * Individual fields that are always editable (personal besoins financiers).
 * These represent personal decisions by each participant.
 */
const INDIVIDUAL_FIELD_PATTERNS = [
  // The key field: capital contributed (besoins financiers)
  'participants.*.capitalApporte',

  // Personal information
  'participants.*.name',

  // Lot ownership (personal assets)
  'participants.*.lotsOwned',
  'participants.*.lotsOwned.*',

  // Legacy lot system
  'participants.*.surface',
  'participants.*.quantity',
  'participants.*.unitId',

  // Purchase details for newcomers
  'participants.*.purchaseDetails',
  'participants.*.purchaseDetails.*',

  // Construction cost overrides (personal choices)
  'participants.*.parachevementsPerM2',
  'participants.*.cascoSqm',
  'participants.*.parachevementsSqm',

  // Two-loan capital allocation
  'participants.*.capitalForLoan1',
  'participants.*.capitalForLoan2',
];

/**
 * Match a field path against a pattern.
 * Supports wildcards: 'participants.*.capitalApporte' matches 'participants.0.capitalApporte'
 */
function matchesPattern(path: string, pattern: string): boolean {
  // Exact match
  if (path === pattern) return true;

  // Wildcard match
  const regexPattern = pattern
    .replace(/\./g, '\\.')  // Escape dots
    .replace(/\*/g, '[^.]+'); // * matches any segment

  const regex = new RegExp(`^${regexPattern}$`);
  return regex.test(path);
}

/**
 * Check if a field path represents a collective field (requires unlock to edit).
 */
export function isCollectiveField(path: string): boolean {
  return COLLECTIVE_FIELD_PATTERNS.some(pattern => matchesPattern(path, pattern));
}

/**
 * Check if a field path represents an individual field (always editable).
 */
export function isIndividualField(path: string): boolean {
  return INDIVIDUAL_FIELD_PATTERNS.some(pattern => matchesPattern(path, pattern));
}

/**
 * Check if a field is editable given the current unlock state.
 * @param path Field path (e.g., 'projectParams.totalPurchase', 'participants.0.capitalApporte')
 * @param isUnlocked Whether the admin has unlocked collective fields
 * @returns true if the field can be edited
 */
export function isFieldEditable(path: string, isUnlocked: boolean): boolean {
  // Individual fields are always editable
  if (isIndividualField(path)) {
    return true;
  }

  // Collective fields require unlock
  if (isCollectiveField(path)) {
    return isUnlocked;
  }

  // Unknown fields default to editable (fail open)
  return true;
}

/**
 * Get a human-readable description of why a field is locked.
 */
export function getLockReason(path: string, isUnlocked: boolean): string | null {
  if (isFieldEditable(path, isUnlocked)) {
    return null;
  }

  return 'Ce champ est verrouillé. Demandez à un administrateur de déverrouiller les champs collectifs.';
}

/**
 * Extract the field path for a specific participant index.
 * Example: ('capitalApporte', 2) => 'participants.2.capitalApporte'
 */
export function getParticipantFieldPath(fieldName: string, participantIndex: number): string {
  return `participants.${participantIndex}.${fieldName}`;
}

/**
 * Extract the field path for project params.
 * Example: 'totalPurchase' => 'projectParams.totalPurchase'
 */
export function getProjectParamFieldPath(fieldName: string): string {
  return `projectParams.${fieldName}`;
}

/**
 * Extract the field path for portage formula.
 * Example: 'indexationRate' => 'portageFormula.indexationRate'
 */
export function getPortageFormulaFieldPath(fieldName: string): string {
  return `portageFormula.${fieldName}`;
}
