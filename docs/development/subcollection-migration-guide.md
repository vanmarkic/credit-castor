# Subcollection Migration Guide

## Overview

This guide explains how to migrate from the legacy participants array architecture to the new subcollection architecture, enabling granular participant updates in Firestore.

## Why Migrate?

### Legacy Architecture (Array)
- **Storage**: All participants stored as an array in the main project document
- **Updates**: Changing one participant requires saving the entire participants array
- **Network**: Full array sent on every save (10 participants × ~500 bytes = ~5KB per save)
- **Conflicts**: Higher chance of conflicts when multiple users edit different participants

### New Architecture (Subcollections)
- **Storage**: Each participant stored as a separate document in a subcollection
- **Updates**: Changing one participant only updates that participant's document
- **Network**: Only changed participants sent (~500 bytes for single participant)
- **Conflicts**: Isolated per participant, no conflicts when editing different participants
- **Efficiency**: Batched atomic writes for multiple changed participants

## Architecture Comparison

### Before (Legacy Array)
```
projects/shared-project/
  ├── participants: [participant1, participant2, ..., participant10]
  ├── projectParams: {...}
  ├── deedDate: "2024-01-01"
  └── ...
```

When you edit participant 3's surface area:
- ❌ Load entire participants array
- ❌ Modify participant 3 locally
- ❌ Save entire participants array back to Firestore
- ❌ Network cost: ~5KB

### After (Subcollections)
```
projects/shared-project/
  ├── participantsInSubcollection: true
  ├── participants: [] (cleared)
  ├── projectParams: {...}
  ├── deedDate: "2024-01-01"
  └── participants/ (subcollection)
      ├── 0/ (participant document)
      ├── 1/ (participant document)
      ├── 2/ (participant document)
      └── ...
```

When you edit participant 3's surface area:
- ✅ Only load participant 3's document
- ✅ Modify participant 3 locally
- ✅ Save only participant 3's document
- ✅ Network cost: ~500 bytes (10x reduction!)

## Migration Process

### Automatic Migration (Recommended)

The migration runs automatically in the browser console using exposed utilities.

#### Step 1: Check Current Status

```javascript
// Open browser console (F12) and run:
await window.creditCastor.checkMigration()
```

Expected output:
- If NOT migrated: `⏸️  Project is NOT migrated (still using legacy array)`
- If already migrated: `✅ Project is already migrated to subcollections`

#### Step 2: Run Migration

```javascript
// Replace with your email
await window.creditCastor.runMigration('your-email@example.com')
```

Expected output:
```
🚀 Starting migration for project: shared-project
   User: your-email@example.com
🔄 Starting subcollection migration for project: shared-project
📋 Found 10 participants to migrate
✅ Successfully migrated 10 participants to subcollections
✅ Migration complete!
   Migrated 10 participants to subcollections
   Reload the page to see granular participant updates in action
```

#### Step 3: Validate Migration

```javascript
// Verify migration with expected participant count
await window.creditCastor.validateMigration(10)
```

Expected output:
```
🔍 Validating migration for project: shared-project
   Expected participant count: 10
✅ Migration validation passed
   Found 10 participants in subcollections
```

#### Step 4: Reload Page

Reload the page to activate the new subcollection-based sync logic.

### Manual Migration (Advanced)

If you need more control, you can use the migration functions directly:

```typescript
import { migrateToSubcollections } from './services/subcollectionMigration';

const result = await migrateToSubcollections('shared-project', 'your-email@example.com');

if (result.success) {
  console.log(`Migrated ${result.migratedCount} participants`);
}
```

## What Happens During Migration

1. **Check if already migrated**: Skip if `participantsInSubcollection: true`
2. **Load participants array**: Read current participants from main document
3. **Create subcollection documents**: For each participant, create a document in `participants/` subcollection
4. **Update main document**: Set flag `participantsInSubcollection: true` and clear participants array
5. **Atomic commit**: All changes committed atomically (all-or-nothing)

## Verification

### Firestore Console Verification

1. Open Firebase Console → Firestore Database
2. Navigate to `projects/shared-project`
3. Verify:
   - ✅ `participantsInSubcollection: true`
   - ✅ `participants: []` (empty array)
   - ✅ `participants/` subcollection exists with documents `0`, `1`, `2`, ..., `9`

### Code Verification

```javascript
// Check flag
const projectDoc = await getDoc(doc(db, 'projects', 'shared-project'));
console.log(projectDoc.data().participantsInSubcollection); // Should be true

// Check subcollection
const participantDoc = await getDoc(doc(db, 'projects', 'shared-project', 'participants', '0'));
console.log(participantDoc.exists()); // Should be true
console.log(participantDoc.data()); // Should show participant data
```

## After Migration

### Granular Updates

After migration, the app automatically uses granular participant updates:

1. **Edit one participant**: Only that participant's document is updated
2. **Edit multiple participants**: Batched atomic write of changed participants only
3. **No cascading calculations**: Unchanged participants remain untouched in Firestore

### Console Logs

Watch for these logs in the browser console:

```
✅ Batched participant sync: 1/10 participants updated
   Updated participants: 3
```

This indicates that only participant 3 was saved, not all 10 participants.

### Network Monitoring

Open DevTools → Network tab and filter for Firestore requests:

- **Before migration**: `updateDoc` with entire participants array (~5KB)
- **After migration**: Batched `set` operations for individual participants (~500 bytes per participant)

## Rollback (If Needed)

If you need to rollback to legacy array architecture:

1. Load participants from subcollection
2. Save to main document participants array
3. Set `participantsInSubcollection: false`
4. Delete subcollection documents

```typescript
// Load from subcollection
const participants = await loadParticipantsFromSubcollection('shared-project');

// Save to main document
await updateDoc(doc(db, 'projects', 'shared-project'), {
  participants: participants.participants,
  participantsInSubcollection: false,
});

// Delete subcollection (manual cleanup in Firestore Console)
```

## Troubleshooting

### Migration Fails with "Project already migrated"

**Cause**: `participantsInSubcollection` flag is already `true`

**Solution**: This is expected. The migration is idempotent and safe to run multiple times.

### Migration Fails with "No participants array found"

**Cause**: Main document doesn't have a participants array

**Solution**: Check Firestore data integrity. The participants array should exist in the main document.

### Validation Fails with "Expected X, found Y"

**Cause**: Some participant documents are missing from subcollection

**Solution**: Re-run migration. The atomic batch ensures all-or-nothing migration.

### Save Still Uses Full Document

**Cause**: Page not reloaded after migration, or subcollection flag not detected

**Solution**:
1. Reload the page
2. Check browser console for `🔥 Firestore sync enabled`
3. Check for `📚 Loading from subcollection architecture...`

## Performance Comparison

### Network Savings

| Scenario | Legacy Array | Subcollections | Savings |
|----------|-------------|----------------|---------|
| Edit 1 participant | ~5KB | ~500 bytes | 90% |
| Edit 3 participants | ~5KB | ~1.5KB | 70% |
| Edit all participants | ~5KB | ~5KB | 0% |

### Real-World Example

Editing one participant's surface area (cascading recalculations affect 3 participants):

- **Before**: 5KB full document save
- **After**: 1.5KB batched update (3 participants only)
- **Savings**: 70% reduction in network usage

## Code References

### Migration Utilities
- [subcollectionMigration.ts](../../src/services/subcollectionMigration.ts) - Core migration logic
- [subcollectionMigration.test.ts](../../src/services/subcollectionMigration.test.ts) - Comprehensive tests
- [migrationHelpers.ts](../../src/utils/migrationHelpers.ts) - Browser console utilities

### Sync Infrastructure
- [participantSyncCoordinator.ts](../../src/services/participantSyncCoordinator.ts) - Batched sync logic
- [useFirestoreSync.ts](../../src/hooks/useFirestoreSync.ts) - React hook with granular updates
- [firestoreSync.ts](../../src/services/firestoreSync.ts) - Low-level Firestore operations

## Security Rules

The Firestore security rules already support subcollections:

```javascript
// Main document rules
match /projects/{projectId} {
  allow write: if (('lastModifiedBy' in request.resource.data) && ...) ||
                  request.auth != null;

  // Participant subcollection rules
  match /participants/{participantId} {
    allow read: if true;
    allow write: if (('lastModifiedBy' in request.resource.data) && ...) ||
                    request.auth != null;
  }
}
```

No changes needed to security rules for migration.

## Best Practices

1. **Run migration during low-traffic periods**: Minimize concurrent edits during migration
2. **Validate after migration**: Always run validation to ensure data integrity
3. **Monitor first few edits**: Watch console logs to verify granular updates working
4. **Keep localStorage backup**: localStorage still maintained as backup
5. **Reload after migration**: Always reload page to activate new sync logic

## FAQ

**Q: Does this affect localStorage?**
A: No. localStorage still stores the full participants array as backup.

**Q: Can multiple users edit different participants simultaneously?**
A: Yes! That's the main benefit. Each participant is an isolated document.

**Q: What happens if two users edit the same participant?**
A: Last write wins. Version conflict detection is planned for future.

**Q: Do I need to update security rules?**
A: No. Rules already support subcollections.

**Q: Can I rollback if something goes wrong?**
A: Yes. See "Rollback" section above.

## Next Steps

After successful migration:

1. ✅ Reload page to activate subcollection sync
2. ✅ Test editing a single participant
3. ✅ Monitor console logs for `✅ Batched participant sync`
4. ✅ Verify Network tab shows only changed participants
5. ✅ Enjoy 10x network savings! 🎉
