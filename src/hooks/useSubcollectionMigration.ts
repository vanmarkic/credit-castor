/**
 * React hook for subcollection migration
 *
 * Provides a simple interface for triggering migration from UI
 */

import { useState, useCallback } from 'react';
import {
  migrateToSubcollections,
  isAlreadyMigrated,
  validateMigration,
  type MigrationResult,
} from '../services/subcollectionMigration';

export interface UseMigrationResult {
  isMigrating: boolean;
  migrationResult: MigrationResult | null;
  migrationError: string | null;
  checkIfMigrated: () => Promise<boolean>;
  triggerMigration: (userEmail: string) => Promise<void>;
  validateMigrationResult: (expectedCount: number) => Promise<boolean>;
}

/**
 * Hook for managing subcollection migration
 *
 * @param projectId - Firestore project document ID (default: 'shared-project')
 * @returns Migration state and control functions
 */
export function useSubcollectionMigration(
  projectId: string = 'shared-project'
): UseMigrationResult {
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationResult, setMigrationResult] = useState<MigrationResult | null>(null);
  const [migrationError, setMigrationError] = useState<string | null>(null);

  /**
   * Check if project has already been migrated
   */
  const checkIfMigrated = useCallback(async (): Promise<boolean> => {
    try {
      return await isAlreadyMigrated(projectId);
    } catch (error) {
      console.error('Error checking migration status:', error);
      return false;
    }
  }, [projectId]);

  /**
   * Trigger the migration process
   */
  const triggerMigration = useCallback(
    async (userEmail: string): Promise<void> => {
      setIsMigrating(true);
      setMigrationError(null);
      setMigrationResult(null);

      try {
        console.log('🚀 Starting subcollection migration...');

        const result = await migrateToSubcollections(projectId, userEmail);

        setMigrationResult(result);

        if (!result.success) {
          setMigrationError(result.error || 'Migration failed');
          console.error('❌ Migration failed:', result.error);
        } else if (result.alreadyMigrated) {
          console.log('✅ Project already migrated');
        } else {
          console.log(`✅ Migration complete: ${result.migratedCount} participants migrated`);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        setMigrationError(errorMessage);
        setMigrationResult({ success: false, error: errorMessage });
        console.error('❌ Migration error:', error);
      } finally {
        setIsMigrating(false);
      }
    },
    [projectId]
  );

  /**
   * Validate migration completed successfully
   */
  const validateMigrationResult = useCallback(
    async (expectedCount: number): Promise<boolean> => {
      try {
        const result = await validateMigration(projectId, expectedCount);

        if (!result.valid) {
          console.error('❌ Migration validation failed:', result.error);
          setMigrationError(result.error || 'Validation failed');
        } else {
          console.log(`✅ Migration validated: ${result.actualCount} participants found`);
        }

        return result.valid;
      } catch (error) {
        console.error('Error validating migration:', error);
        return false;
      }
    },
    [projectId]
  );

  return {
    isMigrating,
    migrationResult,
    migrationError,
    checkIfMigrated,
    triggerMigration,
    validateMigrationResult,
  };
}
