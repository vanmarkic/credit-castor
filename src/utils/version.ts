/**
 * Application version information
 *
 * Semantic versioning (major.minor.patch):
 * - Major: Breaking changes (incompatible data structures) - triggers version warning
 * - Minor: New features (backward compatible) - no warning
 * - Patch: Bug fixes (backward compatible) - no warning
 *
 * Version history:
 * - 1.16.0: Implemented semantic versioning for version compatibility
 * - 1.15.0: Refactored notaryFees → droitEnregistrements (backward compatible)
 * - 1.14.0: Added Firestore sync and multi-user collaboration features
 * - 1.0.0: Initial version with portage lots, purchaseDetails, and timeline features
 */

export const RELEASE_VERSION = '1.34.0';

export interface VersionedData {
  releaseVersion: string;
  dataVersion: number; // For minor migrations within the same release
  timestamp: string;
}

/**
 * Check if stored data is compatible with current release
 * Uses semantic versioning: only major version changes are breaking
 */
export function isCompatibleVersion(storedVersion: string | undefined): boolean {
  if (!storedVersion) {
    return false; // No version = old data, needs reset
  }

  // Parse versions using semantic versioning
  const currentParts = RELEASE_VERSION.split('.').map(Number);
  const storedParts = storedVersion.split('.').map(Number);

  // Invalid version format
  if (currentParts.length !== 3 || storedParts.length !== 3) {
    return false;
  }

  const [currentMajor] = currentParts;
  const [storedMajor] = storedParts;

  // Only major version changes are breaking (1.x.x is compatible with 1.y.z)
  return currentMajor === storedMajor;
}

/**
 * Get version info for display
 */
export function getVersionInfo() {
  return {
    release: RELEASE_VERSION,
    buildDate: new Date().toISOString().split('T')[0]
  };
}
