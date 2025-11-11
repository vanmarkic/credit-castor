# Phase 1: Locking System - Manual Testing Guide

**Version:** 1.0
**Date:** 2025-11-11
**Feature:** Field-level permission system with admin unlock

---

## 🎯 Overview

This guide will help you manually test the newly implemented locking system. The system protects "collective" fields (project parameters, portage formula, financing terms) while keeping "individual" fields (capital apporté/besoins financiers) always editable.

---

## ⚙️ Prerequisites

1. **Dev server running:** http://localhost:4321/credit-castor
2. **Admin password:** `admin2025` (default)
3. **Fresh browser session** (recommended to clear localStorage first)

---

## 🧪 Test Scenarios

### Test 1: Initial Locked State

**Goal:** Verify all collective fields are locked on first load

**Steps:**
1. Open http://localhost:4321/credit-castor in a new browser tab
2. Navigate past the password gate (if shown)

**Expected Results:**
- ✅ "Déverrouiller" button appears in top-left corner (green/gray with lock icon)
- ✅ All expense category inputs are grayed out and disabled
- ✅ "Prix CASCO/m² Global" input is grayed out and disabled
- ✅ "TVA CASCO" input is grayed out and disabled
- ✅ Portage formula fields (if expanded) are grayed out and disabled
- ✅ Participant financing fields (interest rate, duration, notary fees) are grayed out
- ✅ Capital Apporté input remains editable (green, not grayed out)

**Visual Indicators:**
- Locked fields: 60% opacity, gray background, disabled cursor
- Unlocked fields: Normal appearance, white background

---

### Test 2: Admin Unlock

**Goal:** Verify password authentication and unlock functionality

**Steps:**
1. Click the "Déverrouiller" button (top-left)
2. A dialog should appear with:
   - Title: "Déverrouiller les champs collectifs"
   - Email input field
   - Password input field
   - Info text in French explaining what unlocking does
   - "Annuler" and "Déverrouiller" buttons

3. **Test invalid password first:**
   - Email: `test@example.com`
   - Password: `wrongpassword`
   - Click "Déverrouiller"

   **Expected:** Error message appears (should show in the dialog or as a toast)

4. **Test valid password:**
   - Email: `test@example.com`
   - Password: `admin2025`
   - Click "Déverrouiller"

**Expected Results:**
- ✅ Dialog closes
- ✅ Button changes to "Verrouiller" with unlock icon
- ✅ Button color changes to green
- ✅ Hover over button shows tooltip with: "Déverrouillé par test@example.com le [timestamp]"
- ✅ All previously locked fields become editable:
  - Expense categories can be modified
  - CASCO price can be changed
  - TVA rate can be adjusted
  - Portage formula fields can be edited
  - Participant financing terms become editable

---

### Test 3: Field Editing When Unlocked

**Goal:** Verify collective fields are fully functional when unlocked

**Steps:**
1. Ensure you're unlocked (from Test 2)
2. Navigate to the "Décomposition des Coûts" section
3. Expand an expense category (e.g., "CONSERVATOIRE")
4. Change a line item value
5. Change "Prix CASCO/m² Global"
6. Change "TVA CASCO" rate
7. Scroll to portage formula configuration
8. Expand it and modify "Taux d'indexation annuel"
9. Scroll to a participant panel
10. Modify "Taux d'intérêt (%)"
11. Modify "Durée (années)"
12. Toggle between "3%" and "12.5%" for "Droit d'enregistrements"

**Expected Results:**
- ✅ All inputs accept changes
- ✅ Values update in real-time
- ✅ Calculations recalculate correctly
- ✅ No console errors

---

### Test 4: Individual Fields Always Editable

**Goal:** Verify capital apporté (besoins financiers) is always editable

**Steps:**
1. **With system LOCKED** (click "Verrouiller" if unlocked):
   - Navigate to a participant panel
   - Try to edit "Capital à disposition" field

   **Expected:** ✅ Field is editable, accepts input, green styling

2. **With system UNLOCKED**:
   - Navigate to a participant panel
   - Try to edit "Capital à disposition" field

   **Expected:** ✅ Field remains editable, no visual changes

**Verify Always Editable:**
- Capital à disposition (green input)
- Participant name
- Surface and quantity fields
- Portage lot configuration (for founders)

---

### Test 5: Lock Persistence

**Goal:** Verify unlock state persists across page refreshes

**Steps:**
1. Ensure system is **unlocked** (from Test 2)
2. Note the button shows "Verrouiller" with green styling
3. **Refresh the page** (F5 or Cmd+R)
4. Wait for page to fully load

**Expected Results:**
- ✅ Button still shows "Verrouiller" with green styling
- ✅ Hover shows same email and timestamp from original unlock
- ✅ All collective fields remain editable
- ✅ No need to re-enter password

**Test Lock Persistence:**
1. Click "Verrouiller" button
2. Button changes to "Déverrouiller" (gray/locked state)
3. **Refresh the page**
4. **Expected:** ✅ Button still shows "Déverrouiller" (stays locked)

---

### Test 6: Re-locking Fields

**Goal:** Verify fields can be locked again after unlocking

**Steps:**
1. Ensure system is **unlocked**
2. Click the "Verrouiller" button (top-left)

**Expected Results:**
- ✅ Button immediately changes to "Déverrouiller" (gray/locked icon)
- ✅ All collective fields become disabled again:
  - Expense categories grayed out
  - CASCO price disabled
  - TVA rate disabled
  - Portage formula fields disabled
  - Participant financing terms disabled
- ✅ Capital Apporté remains editable
- ✅ No password prompt needed for locking

---

### Test 7: Multiple Participant Panels

**Goal:** Verify locking works consistently across all participants

**Steps:**
1. Lock the system (if unlocked)
2. Scroll through multiple participant panels
3. Verify financing fields (interest rate, duration, notary fees) are all locked
4. Verify capital apporté is editable in all panels
5. **Unlock the system**
6. Verify financing fields in all panels become editable

**Expected Results:**
- ✅ Lock state is consistent across all participant panels
- ✅ No participant-specific permissions (all financing terms locked/unlocked together)
- ✅ Capital apporté always editable regardless of lock state

---

### Test 8: Expense Categories

**Goal:** Verify expense category locking works for all three categories

**Steps:**
1. Navigate to "Détail Commun" section
2. **System LOCKED:**
   - Try to expand "CONSERVATOIRE" category
   - Expansion should work, but inputs inside should be disabled
   - Verify "Ajouter une ligne" button is disabled
   - Verify delete (X) buttons are disabled
   - Try typing in label fields → should not accept input
   - Try typing in amount fields → should not accept input

3. **Unlock the system**
4. **System UNLOCKED:**
   - All inputs should become editable
   - "Ajouter une ligne" button becomes clickable
   - Can add new line items
   - Can delete existing items
   - Can modify labels and amounts

**Repeat for all three categories:**
- CONSERVATOIRE
- HABITABILITE SOMMAIRE
- PREMIER TRAVAUX

**Expected Results:**
- ✅ All three categories respect lock state consistently
- ✅ Visual feedback (gray background, opacity) is consistent
- ✅ Functionality is fully locked/unlocked based on state

---

### Test 9: Portage Formula Configuration

**Goal:** Verify all 4 portage formula fields lock correctly

**Steps:**
1. Scroll to "Configuration Formule de Portage" section
2. Click to expand it
3. **System LOCKED:**
   - All 4 inputs should be grayed out and disabled:
     - Taux d'indexation annuel
     - Récupération frais de portage
     - Taux d'intérêt moyen
     - Part réserves copropriété

4. **Unlock the system**
5. **System UNLOCKED:**
   - All 4 inputs become editable
   - Can modify percentage values
   - Preview example updates correctly

**Expected Results:**
- ✅ All 4 fields lock/unlock together
- ✅ The computed "Part redistribution fondateurs" field remains read-only (always disabled)
- ✅ Example calculation updates when unlocked and values changed

---

### Test 10: Browser DevTools Console

**Goal:** Verify no errors or warnings in console

**Steps:**
1. Open browser DevTools (F12 or Cmd+Option+I)
2. Go to Console tab
3. Perform all the above tests again
4. Watch for any errors or warnings

**Expected Results:**
- ✅ No React errors or warnings
- ✅ No TypeScript errors
- ✅ No "Cannot read property" errors
- ✅ Only expected warnings (like the postcss.config.js warning which is cosmetic)

---

### Test 11: Cancel Dialog

**Goal:** Verify password dialog can be canceled

**Steps:**
1. Ensure system is **locked**
2. Click "Déverrouiller" button
3. Dialog appears
4. Click "Annuler" button (or X in corner)

**Expected Results:**
- ✅ Dialog closes
- ✅ System remains locked
- ✅ No state changes

---

### Test 12: LocalStorage Inspection

**Goal:** Verify localStorage is being used correctly

**Steps:**
1. Open browser DevTools → Application tab → Local Storage
2. Look for `credit-castor-unlock-state` key

**Locked state:**
```json
{
  "isUnlocked": false,
  "unlockedAt": null,
  "unlockedBy": null
}
```

**Unlocked state:**
```json
{
  "isUnlocked": true,
  "unlockedAt": "2025-11-11T22:30:00.000Z",
  "unlockedBy": "test@example.com"
}
```

**Expected Results:**
- ✅ Key exists in localStorage
- ✅ Value updates when locking/unlocking
- ✅ Timestamp is valid ISO string
- ✅ Email is stored correctly

---

## 🐛 Known Issues / Limitations

None currently identified. Report any issues found during testing.

---

## 📊 Test Results Checklist

Use this checklist to track your testing progress:

- [ ] Test 1: Initial Locked State
- [ ] Test 2: Admin Unlock (invalid password)
- [ ] Test 2: Admin Unlock (valid password)
- [ ] Test 3: Field Editing When Unlocked
- [ ] Test 4: Individual Fields (locked system)
- [ ] Test 4: Individual Fields (unlocked system)
- [ ] Test 5: Lock Persistence (refresh while unlocked)
- [ ] Test 5: Lock Persistence (refresh while locked)
- [ ] Test 6: Re-locking Fields
- [ ] Test 7: Multiple Participant Panels
- [ ] Test 8: Expense Categories (all 3 categories)
- [ ] Test 9: Portage Formula Configuration
- [ ] Test 10: Browser Console (no errors)
- [ ] Test 11: Cancel Dialog
- [ ] Test 12: LocalStorage Inspection

---

## 🎨 Visual Reference

**Locked Field Appearance:**
- Opacity: 60%
- Background: Light gray (#f9fafb or #f3f4f6)
- Cursor: not-allowed
- Border: Same as normal but grayed
- Optional: Small lock icon in corner

**Unlocked Field Appearance:**
- Opacity: 100%
- Background: White
- Cursor: text/pointer (normal)
- Border: Normal colors (blue, green, etc.)

**Unlock Button States:**
- **Locked:** Gray background, "Déverrouiller" text, Lock icon
- **Unlocked:** Green background, "Verrouiller" text, Unlock icon

---

## 🔧 Troubleshooting

### Fields not locking/unlocking?
1. Check browser console for errors
2. Verify UnlockProvider wraps the app in EnDivisionCorrect.tsx
3. Clear localStorage and refresh

### Password not working?
1. Default password: `admin2025`
2. Check .env for `VITE_ADMIN_PASSWORD` override
3. Case-sensitive

### State not persisting?
1. Check localStorage is enabled in browser
2. Look for localStorage quota errors in console
3. Verify `credit-castor-unlock-state` key exists

### Visual styling not applying?
1. Check for Tailwind CSS class conflicts
2. Verify disabled prop is being passed correctly
3. Inspect element in DevTools to see computed styles

---

## 📝 Reporting Issues

If you find bugs during testing, please report:

1. **Test number** that failed
2. **Browser** and version
3. **Steps to reproduce**
4. **Expected vs actual behavior**
5. **Screenshots** if visual issue
6. **Console errors** if any

---

## ✅ Sign-off

**Tester:** _______________
**Date:** _______________
**Status:** PASS / FAIL / PARTIAL
**Notes:**
