/**
 * Migration helpers for browser console
 *
 * These utilities are exposed to window object for easy testing and manual migration.
 *
 * Usage in browser console:
 * ```
 * // Check if migrated
 * await window.creditCastor.checkMigration()
 *
 * // Run migration
 * await window.creditCastor.runMigration('your-email@example.com')
 *
 * // Validate migration
 * await window.creditCastor.validateMigration(10) // 10 = expected participant count
 * ```
 */

import {
  migrateToSubcollections,
  isAlreadyMigrated,
  validateMigration,
} from '../services/subcollectionMigration';

export const migrationHelpers = {
  /**
   * Check if project has been migrated to subcollections
   */
  async checkMigration(projectId: string = 'shared-project'): Promise<boolean> {
    console.log(`🔍 Checking migration status for project: ${projectId}`);
    const migrated = await isAlreadyMigrated(projectId);
    if (migrated) {
      console.log('✅ Project is already migrated to subcollections');
    } else {
      console.log('⏸️  Project is NOT migrated (still using legacy array)');
    }
    return migrated;
  },

  /**
   * Run migration from array to subcollections
   */
  async runMigration(
    userEmail: string,
    projectId: string = 'shared-project'
  ): Promise<void> {
    console.log(`🚀 Starting migration for project: ${projectId}`);
    console.log(`   User: ${userEmail}`);

    const result = await migrateToSubcollections(projectId, userEmail);

    if (result.success) {
      if (result.alreadyMigrated) {
        console.log('✅ Project already migrated');
      } else {
        console.log(`✅ Migration complete!`);
        console.log(`   Migrated ${result.migratedCount} participants to subcollections`);
        console.log(`   Reload the page to see granular participant updates in action`);
      }
    } else {
      console.error('❌ Migration failed:', result.error);
      throw new Error(result.error);
    }
  },

  /**
   * Validate migration completed successfully
   */
  async validateMigration(
    expectedCount: number,
    projectId: string = 'shared-project'
  ): Promise<boolean> {
    console.log(`🔍 Validating migration for project: ${projectId}`);
    console.log(`   Expected participant count: ${expectedCount}`);

    const result = await validateMigration(projectId, expectedCount);

    if (result.valid) {
      console.log('✅ Migration validation passed');
      console.log(`   Found ${result.actualCount} participants in subcollections`);
    } else {
      console.error('❌ Migration validation failed:', result.error);
      if (result.actualCount !== undefined) {
        console.error(`   Expected ${expectedCount}, found ${result.actualCount}`);
      }
    }

    return result.valid;
  },
};

// Expose to window for browser console access
if (typeof window !== 'undefined') {
  (window as any).creditCastor = {
    ...(window as any).creditCastor,
    ...migrationHelpers,
  };
}
