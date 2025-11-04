/**
 * Application version information
 * Update this when making breaking changes to data structures
 *
 * Version history:
 * - 1.0.0: Initial version with portage lots, purchaseDetails, and timeline features
 */

export const RELEASE_VERSION = '1.4.0';

export interface VersionedData {
  releaseVersion: string;
  dataVersion: number; // For minor migrations within the same release
  timestamp: string;
}

/**
 * Check if stored data is compatible with current release
 */
export function isCompatibleVersion(storedVersion: string | undefined): boolean {
  if (!storedVersion) {
    return false; // No version = old data, needs reset
  }

  // For now, exact match required
  // In future, could implement semver comparison for minor/patch compatibility
  return storedVersion === RELEASE_VERSION;
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
