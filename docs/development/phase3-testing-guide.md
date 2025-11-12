# Phase 3: Firestore Sync - Testing Guide

**Version:** 1.0
**Date:** 2025-11-12
**Status:** Ready for Testing

---

## 🎯 Testing Overview

This guide provides comprehensive manual testing scenarios for Phase 3 Firestore Sync features. It covers:

- Firebase initialization and graceful degradation
- User authentication (custom Firestore auth)
- Real-time data synchronization
- Conflict detection and resolution
- Cross-browser/device collaboration
- Edge cases and error handling

**Prerequisites**: Complete Firebase setup (see `firebase-setup-guide.md`)

---

## 🧪 Test Scenarios

### Test 1: Firebase Initialization

**Objective**: Verify Firebase initializes correctly with valid configuration

**Setup**:
1. Ensure `.env` file has all Firebase config variables
2. Restart dev server: `npm run dev`

**Steps**:
1. Open browser console
2. Navigate to http://localhost:4321/credit-castor
3. Look for console message: "🔥 Firestore sync enabled"

**Expected Results**:
- ✅ No Firebase initialization errors
- ✅ Console shows "Firestore sync enabled"
- ✅ No red errors in console

**Variations**:
- Test with valid config → Should show "Firestore sync enabled"
- Test with missing `.env` → Should show "Using localStorage (Firestore not configured)"

---

### Test 2: Graceful Degradation (No Firebase Config)

**Objective**: Verify app works without Firebase configuration

**Setup**:
1. Rename `.env` to `.env.backup` (temporarily disable Firebase)
2. Restart dev server

**Steps**:
1. Open app
2. Unlock with any email
3. Add a participant
4. Check localStorage in browser DevTools

**Expected Results**:
- ✅ App functions normally
- ✅ Sync indicator shows "Local" (blue dot)
- ✅ Console message: "Using localStorage (Firestore not configured)"
- ✅ Data saves to localStorage only
- ✅ No errors or crashes

**Cleanup**:
- Rename `.env.backup` back to `.env`
- Restart dev server

---

### Test 3: User Authentication

**Objective**: Verify custom authentication system

**Setup**:
1. Ensure Firebase is configured (`.env` present)
2. Clear browser localStorage
3. Clear Firestore `users` collection (Firebase Console)

**Steps**:
1. Open app
2. Click unlock button
3. Enter email: `test@example.com`
4. Click unlock

**Expected Results**:
- ✅ App unlocks successfully
- ✅ Sync indicator shows "Synchronisé" (green dot)
- ✅ Firestore Console shows new document in `users/test_example_com`
- ✅ Password is hashed (not plain text)

**Verify in Firestore Console**:
```
users/test_example_com:
{
  email: "test@example.com",
  passwordHash: "abc123..." (SHA-256 hash),
  createdAt: "2025-11-12T...",
  lastLogin: "2025-11-12T..."
}
```

---

### Test 4: Data Sync to Firestore

**Objective**: Verify data saves to Firestore automatically

**Setup**:
1. Firebase configured and unlocked
2. Open Firestore Console → Data tab

**Steps**:
1. In app: Add a new participant
2. Wait 2 seconds
3. Check Firestore Console

**Expected Results**:
- ✅ Sync indicator shows pulsing yellow dot while syncing
- ✅ Then shows green dot "Synchronisé" when complete
- ✅ Firestore shows `projects/shared-project` document
- ✅ Document contains `participants` array with new participant
- ✅ Metadata includes:
  - `lastModifiedBy`: your email
  - `lastModifiedAt`: current timestamp
  - `version`: incremented number

---

### Test 5: Real-time Updates (Cross-Tab Sync)

**Objective**: Verify changes sync between browser tabs in real-time

**Setup**:
1. Open app in **Tab 1**
2. Unlock with email: `user1@example.com`
3. Open app in **Tab 2** (same browser)
4. Unlock with email: `user2@example.com`

**Steps**:
1. In **Tab 1**: Add a participant named "Alice"
2. Wait 2 seconds
3. Observe **Tab 2**

**Expected Results**:
- ✅ **Tab 1**: Shows "Synchronisé" (green dot)
- ✅ **Tab 2**: Shows toast notification:
  ```
  🔄 Modifications détectées
  Un autre utilisateur a modifié les données
  [Recharger] [Ignorer]
  ```
- ✅ Click "Recharger" in Tab 2
- ✅ Alice appears in participant list

---

### Test 6: Presence Detection

**Objective**: Verify presence notifications when users join

**Setup**:
1. Close all tabs
2. Open fresh tab (**Tab 1**)
3. Unlock as `user1@example.com`

**Steps**:
1. Wait 5 seconds
2. Open **Tab 2**
3. Unlock as `user2@example.com`
4. Observe **Tab 1**

**Expected Results**:
- ✅ **Tab 1** shows toast notification:
  ```
  👤 Nouvel utilisateur
  user2@example.com vient de se connecter
  ```
- ✅ Notification disappears after 5 seconds
- ✅ No errors in console

---

### Test 7: Conflict Detection (Same Version)

**Objective**: Verify conflict detection when two users edit simultaneously

**Setup**:
1. Open app in **Tab 1**, unlock as `user1@example.com`
2. Open app in **Tab 2**, unlock as `user2@example.com`
3. Both tabs should show same data (synced)

**Steps**:
1. **Disconnect Tab 2 from internet** (Chrome DevTools → Network → Offline)
2. In **Tab 2** (offline): Add participant "Bob"
3. In **Tab 1** (online): Add participant "Charlie"
4. Wait for Tab 1 to sync
5. **Reconnect Tab 2** (Network → Online)
6. Wait 2-3 seconds

**Expected Results**:
- ✅ **Tab 2** detects conflict
- ✅ Shows **Conflict Resolution Dialog**:
  ```
  ⚠️ Conflit de synchronisation
  Des modifications concurrentes ont été détectées
  ```
- ✅ Dialog shows:
  - **Vos modifications locales**: Bob (your changes)
  - **Modifications distantes**: Charlie (remote changes)
  - Version numbers differ
  - Timestamps shown

---

### Test 8: Conflict Resolution - Keep Local

**Objective**: Verify "Keep Local" resolution overwrites remote

**Setup**:
1. Continue from Test 7 (conflict dialog open in Tab 2)

**Steps**:
1. Click **"Garder mes modifications"** button
2. Wait 2 seconds
3. Check both tabs

**Expected Results**:
- ✅ Conflict dialog closes
- ✅ **Tab 2**: Shows "Bob" in participant list
- ✅ **Tab 2**: Sync to Firestore
- ✅ **Tab 1**: Receives update, shows "Bob" (Charlie removed)
- ✅ Firestore has "Bob" (local version won)

---

### Test 9: Conflict Resolution - Accept Remote

**Objective**: Verify "Accept Remote" discards local changes

**Setup**:
1. Recreate conflict (repeat Test 7)

**Steps**:
1. Click **"Accepter les modifications distantes"** button
2. Observe result

**Expected Results**:
- ✅ Conflict dialog closes
- ✅ **Tab 2**: Page reloads automatically
- ✅ After reload: Shows "Charlie" (remote version)
- ✅ "Bob" is gone (local changes discarded)

---

### Test 10: Conflict Resolution - Cancel

**Objective**: Verify "Cancel" keeps conflict state

**Setup**:
1. Recreate conflict (repeat Test 7)

**Steps**:
1. Click **"Annuler"** button
2. Observe result

**Expected Results**:
- ✅ Conflict dialog closes
- ✅ App remains in same state
- ✅ No data changes
- ✅ No reload
- ✅ If user makes another change, conflict may reappear

---

### Test 11: Sync Status Indicator

**Objective**: Verify sync status indicator shows correct states

**Setup**:
1. Open app with Firebase configured
2. Observe top-right corner sync indicator

**Scenarios to Test**:

#### A. Offline Mode (no Firebase)
- Rename `.env`, restart server
- **Expected**: Gray dot, "Hors ligne"

#### B. localStorage Mode (Firebase not configured)
- Missing config variables
- **Expected**: Blue dot, "Local"

#### C. Firestore Mode - Synced
- Firebase configured, no pending changes
- **Expected**: Green dot, "Synchronisé"
- Shows: "Dernière sync: 10:23:45" (timestamp)

#### D. Firestore Mode - Syncing
- Make a change, observe immediately
- **Expected**: Yellow dot (pulsing), "Synchronisation..."

#### E. Sync Error
- Invalid Firebase config (wrong API key)
- **Expected**: Shows error message in sync indicator

---

### Test 12: Multi-Device Sync

**Objective**: Verify sync works across different devices/computers

**Setup**:
1. **Device 1**: Desktop computer
2. **Device 2**: Laptop or another computer (same network or different)

**Steps**:
1. On **Device 1**: Open app, unlock as `desktop@example.com`
2. On **Device 2**: Open app (use actual URL, not localhost), unlock as `laptop@example.com`
3. On **Device 1**: Add participant "David"
4. Observe **Device 2**

**Expected Results**:
- ✅ Both devices show "Synchronisé"
- ✅ **Device 2** receives change notification
- ✅ After reload, both show "David"

---

### Test 13: Large Data Sync

**Objective**: Verify sync works with realistic data volume

**Setup**:
1. Open app, unlock
2. Add 10 participants
3. Set project parameters (costs, dates, etc.)
4. Add portage lots to several participants

**Steps**:
1. Make changes to multiple fields
2. Wait for sync
3. Open in new tab
4. Reload and verify data

**Expected Results**:
- ✅ All data syncs correctly
- ✅ No data loss
- ✅ Performance is acceptable (< 2 seconds)
- ✅ Firestore document size < 1MB (check Console)

---

### Test 14: Network Interruption Recovery

**Objective**: Verify app handles network issues gracefully

**Setup**:
1. Open app, unlock, ensure synced

**Steps**:
1. Make several changes
2. **Disconnect internet** (WiFi off or DevTools offline)
3. Make more changes
4. Observe sync indicator
5. **Reconnect internet**
6. Wait 5 seconds

**Expected Results**:
- ✅ While offline: Sync fails silently, no crash
- ✅ Changes saved to localStorage (backup)
- ✅ Sync indicator shows error or offline state
- ✅ After reconnect: Automatically retries sync
- ✅ Data successfully syncs to Firestore

---

### Test 15: Rapid Sequential Changes

**Objective**: Verify app handles rapid changes without conflicts

**Setup**:
1. Open app, unlock

**Steps**:
1. Rapidly add 5 participants (click add 5 times quickly)
2. Immediately edit multiple fields
3. Wait 5 seconds

**Expected Results**:
- ✅ All changes are captured
- ✅ No conflicts detected (same user)
- ✅ Firestore eventually consistent (all changes visible)
- ✅ No duplicate data
- ✅ Version number increments correctly

---

### Test 16: Browser Reload During Sync

**Objective**: Verify data integrity after mid-sync reload

**Setup**:
1. Open app, unlock
2. Add participant
3. **Immediately reload page** (before sync completes)

**Steps**:
1. Wait for page to reload
2. Check if participant appears

**Expected Results**:
- ✅ If sync completed: Participant appears
- ✅ If sync didn't complete: Falls back to localStorage
- ✅ No data corruption
- ✅ No errors on reload

---

### Test 17: Firestore Security Rules

**Objective**: Verify security rules are enforced

**Setup**:
1. Ensure security rules are published (see firebase-setup-guide.md)

**Steps**:
1. Open browser console
2. Try to read/write without unlocking:
   ```javascript
   // Open console, paste this:
   const { getFirestore, doc, getDoc } = await import('firebase/firestore');
   const db = getFirestore();
   const docRef = doc(db, 'projects', 'shared-project');
   const docSnap = await getDoc(docRef);
   ```

**Expected Results**:
- ✅ Read succeeds (rules allow read)
- ✅ Write attempt without auth fails (if trying setDoc)
- ✅ Console shows permission errors if rules block action

---

### Test 18: Data Validation

**Objective**: Verify data structure is maintained

**Setup**:
1. Open app, unlock, add data

**Steps**:
1. Make various changes
2. Open Firestore Console → `projects/shared-project`
3. Inspect document structure

**Expected Results**:
Document should match this structure:
```javascript
{
  participants: [...],      // Array of participant objects
  projectParams: {...},     // Project configuration
  deedDate: "2024-01-01",  // ISO date string
  portageFormula: {...},   // Portage formula params

  // Metadata
  lastModifiedBy: "user@example.com",
  lastModifiedAt: "2025-11-12T10:23:45.123Z",
  version: 5,
  serverTimestamp: Timestamp
}
```

- ✅ All required fields present
- ✅ Data types correct
- ✅ No undefined or null in critical fields

---

### Test 19: Error Handling

**Objective**: Verify graceful error handling

**Scenarios to Test**:

#### A. Invalid Firebase Config
- Set wrong API key in `.env`
- **Expected**: Error message in sync indicator, app continues with localStorage

#### B. Firestore Permission Error
- Tighten security rules to block all writes
- **Expected**: Sync error shown, data saved to localStorage

#### C. Network Timeout
- Use DevTools to throttle network to "Slow 3G"
- **Expected**: Sync takes longer but eventually succeeds

#### D. Corrupted localStorage
- Manually corrupt localStorage data
- **Expected**: App handles gracefully, loads from Firestore

---

### Test 20: Version Migration

**Objective**: Verify version compatibility

**Setup**:
1. Save data in older version (if available)
2. Upgrade to new version

**Steps**:
1. Load old data
2. Check if migration needed
3. Verify data structure

**Expected Results**:
- ✅ Old data loads correctly
- ✅ Migration applied if needed
- ✅ New version number saved

---

## 📋 Regression Testing

After any changes to sync code, run these quick checks:

### Quick Smoke Test (5 minutes)

1. ✅ App loads without errors
2. ✅ Unlock works
3. ✅ Sync indicator shows correct state
4. ✅ Add participant → syncs to Firestore
5. ✅ Open new tab → receives change notification
6. ✅ Create conflict → conflict dialog appears
7. ✅ All 658 unit tests pass (`npm run test:run`)

---

## 🐛 Known Issues & Limitations

### Current Limitations

1. **Single Project**: All users share one `shared-project` document
   - **Impact**: Not suitable for multiple independent projects
   - **Future**: Implement per-project documents

2. **Last-Write-Wins**: Simple conflict resolution
   - **Impact**: One user's changes completely overwrite another's
   - **Future**: Implement field-level merging (CRDTs)

3. **No Offline Queue**: Changes while offline aren't queued
   - **Impact**: Must reconnect to sync pending changes
   - **Future**: Implement offline persistence with IndexedDB

4. **SHA-256 Password Hashing**: Adequate for POC, not production-grade
   - **Impact**: Vulnerable to rainbow table attacks
   - **Future**: Upgrade to bcrypt or Argon2

---

## 🎯 Test Coverage Summary

| Category | Tests | Coverage |
|----------|-------|----------|
| Initialization | 2 | ✅ Complete |
| Authentication | 1 | ✅ Complete |
| Data Sync | 4 | ✅ Complete |
| Conflict Resolution | 4 | ✅ Complete |
| UI/Status | 1 | ✅ Complete |
| Multi-Device | 1 | ✅ Complete |
| Error Handling | 4 | ✅ Complete |
| Edge Cases | 3 | ✅ Complete |

**Total Scenarios**: 20 manual tests + 658 automated unit tests

---

## 📊 Success Criteria

Phase 3 is considered successful if:

- ✅ All 20 manual test scenarios pass
- ✅ All 658 unit tests pass
- ✅ No data loss during conflicts
- ✅ Real-time sync latency < 2 seconds
- ✅ Graceful degradation to localStorage works
- ✅ No errors in production console
- ✅ App remains responsive during sync

---

## 🚀 Production Deployment Checklist

Before deploying Phase 3 to production:

- [ ] All tests pass (manual + automated)
- [ ] Security rules reviewed and published
- [ ] Environment variables set in production
- [ ] Firebase quotas reviewed (should be within free tier)
- [ ] Backup strategy in place (regular exports)
- [ ] Monitoring set up (Firebase Console)
- [ ] Team trained on conflict resolution
- [ ] Documentation reviewed by team
- [ ] Performance tested with realistic data volume
- [ ] Error handling tested in production environment

---

## 🆘 Troubleshooting Common Test Failures

### Test Fails: "Firestore not initialized"
**Solution**: Check `.env` file, restart server

### Test Fails: Real-time updates not working
**Solution**: Check browser console for WebSocket errors, verify security rules

### Test Fails: Conflict detection not triggering
**Solution**: Ensure version numbers are incrementing, check conflictState in React DevTools

### Test Fails: Permission denied errors
**Solution**: Verify security rules published, check unlock state

---

## 📝 Test Report Template

After completing testing, fill out this report:

```markdown
# Phase 3 Testing Report

**Date**: YYYY-MM-DD
**Tester**: Your Name
**Environment**: Development / Staging / Production

## Test Results

### Passed Tests (X/20)
- List passed scenarios...

### Failed Tests (X/20)
- List failed scenarios with details...

### Blocked Tests (X/20)
- List blocked scenarios with reasons...

## Issues Found
1. Issue description
   - Severity: High/Medium/Low
   - Steps to reproduce
   - Expected vs Actual

## Overall Assessment
- Ready for production: Yes / No
- Confidence level: High / Medium / Low
- Recommendations: ...

**Signature**: _____________
```

---

## 🎉 Conclusion

This testing guide covers comprehensive scenarios for Phase 3 Firestore Sync. Following these tests ensures:

- ✅ Robust real-time synchronization
- ✅ Reliable conflict detection
- ✅ Graceful error handling
- ✅ Production-ready implementation

**Next Steps**: After all tests pass, proceed with production deployment using the checklist above.

---

**Last Updated**: 2025-11-12
**Maintained By**: Credit Castor Development Team
