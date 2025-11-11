# Phase 2: Toast Notifications - Manual Testing Guide

**Version:** 1.0
**Date:** 2025-11-11
**Feature:** Cross-tab presence detection and change notifications

---

## 🎯 Overview

This guide will help you manually test the toast notification system. The system detects when other users open the app in different browser tabs and when data changes occur, showing French notifications with action buttons.

---

## ⚙️ Prerequisites

1. **Dev server running:** http://localhost:4321/credit-castor
2. **Multiple browser tabs** (2-3 tabs recommended)
3. **Fresh browser session** (optional - clear localStorage to start fresh)

---

## 🧪 Test Scenarios

### Test 1: Initial State - No Notifications

**Goal:** Verify no notifications appear on first load

**Steps:**
1. Open http://localhost:4321/credit-castor in a new browser tab
2. Navigate past the password gate (if shown)
3. Wait 5 seconds

**Expected Results:**
- ✅ No toast notifications appear
- ✅ App loads normally
- ✅ No console errors

---

### Test 2: Presence Detection - User Joins

**Goal:** Verify notification when another user (tab) joins

**Steps:**
1. Open Credit Castor in **Tab 1**
2. Unlock the system (click "Déverrouiller" button, use password `admin2025`)
3. Open Credit Castor in **Tab 2** (new tab, same browser)
4. In Tab 2, unlock the system with a different email (e.g., `user2@example.com`)

**Expected Results in Tab 1:**
- ✅ Toast notification appears in top-right corner
- ✅ Notification shows green user icon (Users icon)
- ✅ Title: "Utilisateur actif"
- ✅ Message: "user2@example.com a ouvert l'application"
- ✅ Notification auto-dismisses after 5 seconds
- ✅ X button allows manual dismissal

**Visual:**
- Green background circle with users icon
- White background card
- Clean, professional styling

---

### Test 3: Data Change Detection - Participant Added

**Goal:** Verify notification when data changes in another tab

**Steps:**
1. Keep **Tab 1** and **Tab 2** both open and unlocked
2. In **Tab 2**, add a new participant:
   - Click "Ajouter un participant" button
   - A new participant should appear
3. Check **Tab 1**

**Expected Results in Tab 1:**
- ✅ Toast notification appears
- ✅ Blue file edit icon
- ✅ Title: "Données modifiées"
- ✅ Description: "Participant ajouté : [Name]"
- ✅ Changed by: "Par user2@example.com" (if unlocked by that user)
- ✅ Three action buttons visible:
  - "Recharger" (blue, with refresh icon)
  - "Fusionner" (light blue outline, with merge icon) - may be grayed out
  - "Ignorer" (gray)
- ✅ Notification does NOT auto-dismiss (stays until user interacts)

---

### Test 4: Change Notification - Action Buttons

**Goal:** Test the action buttons on change notifications

**Steps:**
1. Trigger a data change from Tab 2 (e.g., modify a participant's capital)
2. In Tab 1, observe the notification
3. **Test "Ignorer":**
   - Click "Ignorer" button
   - **Expected:** Notification dismisses, no other changes

4. Trigger another change from Tab 2
5. **Test "Recharger":**
   - Click "Recharger" button
   - **Expected:** Page reloads, sees the new data

**Expected Results:**
- ✅ "Ignorer" dismisses the toast
- ✅ "Recharger" refreshes the page and shows updated data
- ✅ "Fusionner" button exists but may show as disabled (Phase 3 feature)

---

### Test 5: Multiple Change Types

**Goal:** Verify different change types are detected

**Test each change type by making changes in Tab 2 and observing Tab 1:**

1. **Participant removed:**
   - Delete a participant in Tab 2
   - **Expected in Tab 1:** "1 participant(s) supprimé(s)"

2. **Participant modified:**
   - Change a participant's name or capital in Tab 2
   - **Expected in Tab 1:** "Données participant modifiées"

3. **Project params modified:**
   - Change "Prix CASCO/m² Global" in Tab 2
   - **Expected in Tab 1:** "Paramètres projet modifiés"

4. **Portage formula modified:**
   - Open "Configuration Formule de Portage" in Tab 2
   - Change "Taux d'indexation annuel"
   - **Expected in Tab 1:** "Formule de portage modifiée"

5. **Deed date modified:**
   - Change the deed date in Tab 2
   - **Expected in Tab 1:** "Date acte notarié modifiée"

**Expected Results:**
- ✅ Each change type shows appropriate French description
- ✅ All notifications have same format and buttons
- ✅ Notifications stack if multiple changes occur

---

### Test 6: Notification Stacking

**Goal:** Verify multiple notifications display correctly

**Steps:**
1. In Tab 2, make rapid changes:
   - Add participant
   - Change CASCO price
   - Modify portage formula
   - All within 5 seconds
2. Check Tab 1

**Expected Results:**
- ✅ Multiple notification toasts appear
- ✅ They stack vertically in top-right corner
- ✅ Each is independently dismissible
- ✅ No overlap or visual glitches
- ✅ Maximum of ~3-4 visible at once (react-hot-toast default)

---

### Test 7: User Leave Detection

**Goal:** Verify behavior when a tab is closed

**Steps:**
1. Have Tab 1 and Tab 2 both open
2. Close Tab 2
3. Wait 15-20 seconds (heartbeat timeout)
4. Check Tab 1

**Expected Results:**
- ✅ No notification appears when user leaves (intentional design)
- ✅ Internal presence state updates (check in DevTools if needed)
- ✅ No console errors

---

### Test 8: Locked vs Unlocked State

**Goal:** Verify notifications work regardless of lock state

**Steps:**
1. **Tab 1:** Keep LOCKED (do not unlock)
2. **Tab 2:** UNLOCK and make changes
3. Observe Tab 1

**Expected Results:**
- ✅ Change notifications still appear in Tab 1
- ✅ Presence notifications still appear in Tab 1
- ✅ Lock state doesn't affect notification system

**Note:** Unlock state is only for field editing permissions, not for notifications.

---

### Test 9: Notification Persistence

**Goal:** Verify notifications don't persist across page reloads

**Steps:**
1. Trigger a change notification in Tab 1
2. Do NOT dismiss it
3. Refresh Tab 1 (F5 or Cmd+R)

**Expected Results:**
- ✅ Notification disappears on reload
- ✅ Fresh state after reload
- ✅ No duplicate notifications

---

### Test 10: Toast Positioning

**Goal:** Verify toast positioning doesn't interfere with UI

**Steps:**
1. Trigger a notification
2. Scroll the page up and down
3. Open participant panels
4. Interact with buttons near top-right corner

**Expected Results:**
- ✅ Toasts remain fixed in top-right corner
- ✅ They don't block critical UI elements
- ✅ Z-index is high enough to appear above all content
- ✅ Toasts are readable and clickable at all scroll positions

---

### Test 11: Browser DevTools Console

**Goal:** Verify no errors during notification operations

**Steps:**
1. Open browser DevTools (F12 or Cmd+Option+I)
2. Go to Console tab
3. Perform all the above tests
4. Watch for any errors or warnings

**Expected Results:**
- ✅ No React errors or warnings
- ✅ No TypeScript errors
- ✅ No localStorage errors
- ✅ Only expected warnings (like postcss.config.js)

---

### Test 12: LocalStorage Inspection - Presence

**Goal:** Verify localStorage is tracking presence correctly

**Steps:**
1. Open browser DevTools → Application tab → Local Storage
2. Look for `credit-castor-presence` key
3. Have 2 tabs open with different users

**Expected Structure:**
```json
{
  "session-id-1": {
    "email": "user1@example.com",
    "lastSeen": "2025-11-11T22:30:00.000Z",
    "sessionId": "session-id-1"
  },
  "session-id-2": {
    "email": "user2@example.com",
    "lastSeen": "2025-11-11T22:30:15.000Z",
    "sessionId": "session-id-2"
  }
}
```

**Expected Results:**
- ✅ Key exists in localStorage
- ✅ Each tab has unique sessionId
- ✅ `lastSeen` updates every 5 seconds (heartbeat)
- ✅ Closed tabs are removed after 15 seconds

---

### Test 13: Heartbeat Mechanism

**Goal:** Verify presence heartbeat works correctly

**Steps:**
1. Open Tab 1, unlock system
2. Open DevTools → Application → Local Storage
3. Watch `credit-castor-presence` → your session → `lastSeen`
4. Observe for 30 seconds

**Expected Results:**
- ✅ `lastSeen` timestamp updates approximately every 5 seconds
- ✅ Updates are automatic (no user interaction needed)
- ✅ Timestamp is in ISO 8601 format

---

## 🐛 Known Issues / Limitations

- **"Fusionner" button** is visible but not functional (Phase 3 feature)
- **Storage events** only work within the same browser (not across different browsers)
- **Presence detection** is per-browser-tab, not per actual user (same user in multiple tabs = multiple entries)

---

## 📊 Test Results Checklist

Use this checklist to track your testing progress:

- [ ] Test 1: Initial State - No Notifications
- [ ] Test 2: Presence Detection - User Joins
- [ ] Test 3: Data Change Detection - Participant Added
- [ ] Test 4: Change Notification - Action Buttons (Ignorer)
- [ ] Test 4: Change Notification - Action Buttons (Recharger)
- [ ] Test 5: Multiple Change Types (all 5 types)
- [ ] Test 6: Notification Stacking
- [ ] Test 7: User Leave Detection
- [ ] Test 8: Locked vs Unlocked State
- [ ] Test 9: Notification Persistence
- [ ] Test 10: Toast Positioning
- [ ] Test 11: Browser Console (no errors)
- [ ] Test 12: LocalStorage Inspection - Presence
- [ ] Test 13: Heartbeat Mechanism

---

## 🎨 Visual Reference

**Presence Notification (User Joins):**
- Green circular background with Users icon
- Title: "Utilisateur actif"
- Message: "user@example.com a ouvert l'application"
- Auto-dismisses after 5 seconds
- X button for manual dismiss

**Change Notification:**
- Blue circular background with FileEdit icon
- Title: "Données modifiées"
- Description: "[Specific change description]"
- "Par [email]" if user is known
- Three buttons: Recharger (blue), Fusionner (outlined), Ignorer (gray)
- Does NOT auto-dismiss

**Toast Styling:**
- Position: top-right corner
- Background: white card with shadow
- Border radius: rounded-lg
- Max width: ~400px
- Stack vertically when multiple

---

## 🔧 Troubleshooting

### Notifications not appearing?
1. Check both tabs are from same browser
2. Verify unlock state has email set (check localStorage)
3. Clear cache and hard reload (Cmd+Shift+R)
4. Check browser console for errors

### Presence not updating?
1. Verify sessionStorage has `credit-castor-session-id`
2. Check localStorage `credit-castor-presence` key exists
3. Wait 5 seconds for first heartbeat
4. Look for console errors

### Recharger button not working?
1. Should reload the entire page
2. Check for browser popup blockers
3. Verify no JavaScript errors in console

### Multiple notifications for same change?
1. This may be expected if change affects multiple fields
2. Each unique change type generates separate notification
3. Check if you have multiple tabs listening

---

## 📝 Reporting Issues

If you find bugs during testing, please report:

1. **Test number** that failed
2. **Browser** and version
3. **Number of tabs** open
4. **Steps to reproduce**
5. **Expected vs actual behavior**
6. **Screenshots** if visual issue
7. **Console errors** if any
8. **LocalStorage state** (from Application tab)

---

## ✅ Sign-off

**Tester:** _______________
**Date:** _______________
**Status:** PASS / FAIL / PARTIAL
**Notes:**

---

## 🔮 Phase 3 Preview

Features coming in Phase 3 (Firestore Sync):

- **"Fusionner" button** will merge changes from other users
- **Real-time sync** across different browsers/devices
- **Conflict resolution** dialog for simultaneous edits
- **User authentication** with Firestore-stored credentials
- **Persistent data** in cloud database

Phase 2 lays the groundwork for these features by establishing the notification patterns and UI.
