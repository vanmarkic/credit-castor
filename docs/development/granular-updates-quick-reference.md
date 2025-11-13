# Granular Updates - Quick Reference

## 🚀 Quick Start

### Deploy Firebase Rules (Required First!)
```bash
firebase deploy --only firestore:rules
```

### Update One Participant's Fields
```typescript
import { updateParticipantFields } from '../services/firestoreSync';

await updateParticipantFields(
  "0",                      // participantId (index as string)
  "shared-project",         // projectId
  { cascoPerM2: 1200 },     // only fields that changed
  "user@example.com"        // userEmail
);
```

## 📊 When to Use What

| Scenario | Function | Writes |
|----------|----------|--------|
| Edit one participant's details | `updateParticipantFields()` | 1 |
| Add/remove participant | `syncAllParticipants()` | All |
| Cascade from entry date change | `syncChangedParticipants()` | 1-2 |
| Initial setup | `migrateParticipantsToSubcollection()` | All |

## 🔄 Cascade Behavior

```
User changes Alice's entry date
    ↓
UI recalculates ALL expected paybacks (instant)
    ↓
syncChangedParticipants() detects only Alice changed
    ↓
Only Alice syncs to Firestore (90% bandwidth saved!)
    ↓
Other users receive update & recalculate locally
```

## ⚠️ Common Issues & Fixes

| Issue | Cause | Fix |
|-------|-------|-----|
| "Participant does not exist" | Not migrated to subcollections | Run `migrateParticipantsToSubcollection()` |
| Permission denied | Rules not deployed | Run `firebase deploy --only firestore:rules` |
| Version conflict | Simultaneous edits | Add retry logic or use last-write-wins |
| All participants syncing | Not using diff detection | Use `syncChangedParticipants()` not `syncAllParticipants()` |

## 💰 Cost Impact

**Before:** Write all 10 participants every change = 10× data transfer
**After:** Write only changed participant = 90% bandwidth reduction

Same Firestore write cost, but:
- ✅ Faster sync
- ✅ Less bandwidth
- ✅ Better UX

## 🎯 Integration Example

```typescript
// In ParticipantDetailModal.tsx
const handleSave = async (updates: Partial<Participant>) => {
  // Local update (triggers UI cascade)
  setParticipants(prev => prev.map((p, i) =>
    i === index ? { ...p, ...updates } : p
  ));

  // Granular Firestore sync (only this participant)
  await updateParticipantFields(
    index.toString(),
    "shared-project",
    updates,
    userEmail
  );
};
```

## 📝 Checklist Before Production

- [ ] Run `firebase deploy --only firestore:rules`
- [ ] Test with 2+ users editing simultaneously
- [ ] Verify only changed participants sync (check Network tab)
- [ ] Consider running migration to subcollections
- [ ] Update components to use `updateParticipantFields()`

## 🔗 Links

- [Full Documentation](./granular-firestore-updates.md)
- [Firebase Console](https://console.firebase.google.com/project/credit-castor/firestore)
- [Test Implementation](../../src/services/participantSyncCoordinator.test.ts)