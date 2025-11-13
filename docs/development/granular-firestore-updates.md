# Granular Firestore Updates for Participants

This document describes the granular update system for participant data in Credit Castor, including implementation details, deployment requirements, and migration strategies.

## Overview

The application now supports **granular participant updates** where only modified participants are synced to Firestore, rather than the entire participants array. This significantly improves performance and reduces Firestore costs.

## Architecture

### Current Implementation Status

1. **✅ Infrastructure Ready**
   - `updateParticipantFields()` - Update individual participant fields
   - `participantSyncCoordinator.ts` - Smart diff detection for batch updates
   - Firestore rules support participant subcollections

2. **⚠️ Not Yet Integrated**
   - Components still use array-based updates
   - Edit lock service built but not active

### Data Storage Options

#### Option 1: Array-Based (Current)
```
projects/shared-project
  ├── participants: [...] // All participants in one array
  └── projectParams: {...}
```

#### Option 2: Subcollection-Based (Supported)
```
projects/shared-project
  ├── projectParams: {...}
  └── participants/
      ├── 0/ {name: "Alice", ...}
      ├── 1/ {name: "Bob", ...}
      └── 2/ {name: "Charlie", ...}
```

## Key Functions

### 1. Update Single Participant Fields
[src/services/firestoreSync.ts:593-656](../../src/services/firestoreSync.ts#L593-L656)

```typescript
import { updateParticipantFields } from '../services/firestoreSync';

// Update only specific fields for one participant
const result = await updateParticipantFields(
  "0",                    // participantId (index as string)
  "shared-project",       // projectId
  {                       // fields to update
    cascoPerM2: 1200,
    parachevementsPerM2: 800,
    unitDetails: { casco: 1200, parachevements: 800 }
  },
  "user@example.com",     // userEmail
  currentVersion          // optional: for conflict detection
);
```

**Benefits:**
- Only writes changed fields (not entire participant)
- 1 Firestore write operation vs rewriting all participants
- Atomic updates with version checking

### 2. Batch Updates with Cascade Detection
[src/services/participantSyncCoordinator.ts](../../src/services/participantSyncCoordinator.ts)

```typescript
import { syncChangedParticipants } from '../services/participantSyncCoordinator';

// After reactive recalculation cascade
const result = await syncChangedParticipants(
  oldParticipants,        // State before changes
  newParticipants,        // State after cascade
  "shared-project",
  "user@example.com"
);

// Result shows efficiency:
// { syncedCount: 1, syncedParticipantIds: ['0'], skippedCount: 9 }
// 90% network savings!
```

**How It Works:**
1. User changes Alice's entry date
2. UI recalculates everything reactively (instant)
3. Diff detection finds only Alice changed
4. Only Alice syncs to Firestore
5. Other users receive atomic update

### 3. Migrate to Subcollections
[src/services/firestoreSync.ts:668-748](../../src/services/firestoreSync.ts#L668-L748)

```typescript
import { migrateParticipantsToSubcollection } from '../services/firestoreSync';

// One-time migration from array to subcollections
const result = await migrateParticipantsToSubcollection(
  "shared-project",
  "admin@example.com"
);
// Result: { success: true, migratedCount: 10 }
```

## Firebase Rules Deployment

### Current Rules Status

Your `firestore.rules` file already includes support for participant subcollections:

```javascript
match /projects/{projectId}/participants/{participantId} {
  allow read: if true;
  allow write: if request.auth != null || request.resource.data.lastModifiedBy != null;
}
```

### ⚠️ Deploy Rules to Firebase

**Check if rules are deployed:**
```bash
# View current active rules
firebase firestore:rules

# Or check in console:
# https://console.firebase.google.com/project/credit-castor/firestore/rules
```

**Deploy the rules:**
```bash
# Deploy only Firestore rules (fast, ~10 seconds)
firebase deploy --only firestore:rules

# Or deploy everything (rules + hosting)
firebase deploy
```

**Expected output:**
```
✔  Deploy complete!
Project Console: https://console.firebase.google.com/project/credit-castor/overview
```

## Cascade Behavior

### What Triggers Cascades?

Cascades are **desired behavior** - the reactive calculator automatically recalculates affected participants:

| Change | Local Cascade | Firestore Sync |
|--------|---------------|----------------|
| Alice's entry date | All copro redistributions recalculate | Only Alice syncs |
| Bob buys from Copropriété | All founders' expected paybacks update | Only Bob syncs |
| Charlie's surface changes | Copro share ratios recalculate | Only Charlie syncs |
| Dan's portage purchase date | Purchase price recalculates | Only Dan syncs |

### Why Cascades Don't Cause Extra Writes

Key insight: **Calculated values aren't stored in `Participant` objects**

- `expectedPaybacks` - Calculated on-demand via `calculateExpectedPaybacksTotal()`
- `coproRedistribution` - Calculated when rendering UI
- `totalCosts` - Calculated via `calculateAll()`

These values update in the UI but don't change the `Participant` data structure, so they don't trigger Firestore writes.

## Risk Analysis & Mitigation

### Risk 1: Simultaneous Edits
**Current:** No protection (localStorage only)
**Solution:** Activate `useEditLock` hook with Firestore transactions

### Risk 2: Race Conditions
**Current:** Last-write-wins
**Solution:** Version checking in `updateParticipantFields()`

### Risk 3: Cascade Consistency
**Current:** Handled correctly
**Why:** Cascades are UI-only calculations, not stored data

### Risk 4: Migration Complexity
**Mitigation:**
- Use feature flag during transition
- Run migration in test environment first
- Keep backward compatibility layer

## Performance Benefits

### Network Efficiency
```
Scenario: Change 1 participant in project with 10 participants

Old approach (array):
- Write size: ~15 KB (all 10 participants)
- Firestore writes: 1 (but large)

New approach (granular):
- Write size: ~1.5 KB (1 participant)
- Firestore writes: 1 (small)
- Savings: 90% bandwidth
```

### Cost Reduction
```
Firestore pricing: $0.18 per 100,000 writes

Daily usage (100 users, 50 edits each):
- Array approach: 5,000 writes × 15 KB = 75 MB bandwidth
- Granular approach: 5,000 writes × 1.5 KB = 7.5 MB bandwidth
- Cost remains same (charged per write count)
- But bandwidth savings improve performance
```

## Implementation Checklist

- [x] Create `updateParticipantFields()` function
- [x] Create `participantSyncCoordinator` with diff detection
- [x] Add tests for cascade scenarios
- [x] Update Firestore rules for subcollections
- [ ] Deploy Firestore rules to production
- [ ] Integrate `updateParticipantFields` in components
- [ ] Replace `useUnlockState` with `useEditLock`
- [ ] Run migration to subcollections
- [ ] Monitor performance metrics

## Example: Complete Integration

```typescript
// In your component (e.g., ParticipantDetailModal)
import { updateParticipantFields } from '../services/firestoreSync';
import { useEditLock } from '../hooks/useEditLock';

function ParticipantDetailModal({ participant, index }) {
  const { isOwnLock, acquireLock } = useEditLock(projectId, userEmail, sessionId);

  const handleSave = async (updates: Partial<Participant>) => {
    // Check edit lock
    if (!isOwnLock) {
      const acquired = await acquireLock();
      if (!acquired) {
        showError("Another user is editing");
        return;
      }
    }

    // Granular update - only this participant
    const result = await updateParticipantFields(
      index.toString(),
      "shared-project",
      updates,
      userEmail
    );

    if (result.success) {
      // Update local state (reactive cascade happens here)
      setParticipants(prev => prev.map((p, i) =>
        i === index ? { ...p, ...updates } : p
      ));

      // UI recalculates everything automatically
      // But only this participant syncs to Firestore!
    }
  };
}
```

## Best Practices

1. **Always use batched writes for related changes**
   ```typescript
   // If multiple participants must update together
   const batch = writeBatch(db);
   affectedParticipants.forEach(p => {
     batch.update(participantRef, updates);
   });
   await batch.commit(); // Atomic
   ```

2. **Let cascades happen locally**
   - Don't try to prevent recalculation
   - Embrace reactive UI updates
   - Trust diff detection to minimize syncs

3. **Use version checking for critical updates**
   ```typescript
   await updateParticipantFields(id, projectId, fields, email, currentVersion);
   ```

4. **Monitor sync efficiency**
   ```typescript
   const savings = estimateSyncSavings(changedCount, totalCount);
   console.log(savings.description); // "Synced 1/10 (90% savings)"
   ```

## Troubleshooting

### "Participant does not exist" Error
- Run migration: `migrateParticipantsToSubcollection()`
- Or ensure participant was created first with `saveParticipantToSubcollection()`

### Version Conflicts
- Implement retry logic with exponential backoff
- Show user conflict resolution UI
- Or use last-write-wins (remove version check)

### Rules Not Working
1. Check deployment: `firebase deploy --only firestore:rules`
2. Verify in console: Firebase Console → Firestore → Rules
3. Test in playground: Firebase Console → Rules Playground

## References

- [Firestore Subcollections Guide](https://firebase.google.com/docs/firestore/data-model#subcollections)
- [Batched Writes Documentation](https://firebase.google.com/docs/firestore/manage-data/transactions#batched-writes)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Project Firebase Console](https://console.firebase.google.com/project/credit-castor/firestore)