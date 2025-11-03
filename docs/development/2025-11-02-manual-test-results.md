# Manual Test Results: Scenario Backward Compatibility

**Date:** 2025-11-02
**Tester:** [Your name]
**Build:** [git commit hash]

## Test Cases

### 1. Load v1.0.2 file
- [ ] File loads without errors
- [ ] globalCascoPerM2 = 1700 (from cascoPerM2)
- [ ] No cascoPerM2 in participant display
- [ ] Calculations correct (CASCO = surface × 1700)

### 2. Download and reload
- [ ] Downloaded file contains globalCascoPerM2
- [ ] Downloaded file has no cascoPerM2 fields
- [ ] Reloading works correctly

### 3. localStorage persistence
- [ ] Refresh preserves migrated data
- [ ] No cascoPerM2 in localStorage

### 4. v1.0.3 file (control)
- [ ] Loads normally
- [ ] No changes to data

## Manual Testing Instructions

### Prerequisites
1. Build and start preview server:
   ```bash
   npm run build && npm run preview
   ```
2. Open browser to the preview URL (typically http://localhost:4321/credit-castor)
3. Have `test-v1.0.2-scenario.json` file ready in project root

### Test 1: Load v1.0.2 file

**Steps:**
1. Click the "Charger" button in the application
2. Select `test-v1.0.2-scenario.json` from the file picker
3. Verify success alert appears
4. Check the "Scenarios" section for `globalCascoPerM2` field
5. Verify it shows 1700 €/m²
6. Check participant details to ensure no `cascoPerM2` field is visible
7. Verify CASCO calculation: Should be 112m² × 1700 = 190,400 €

**Expected Results:**
- ✅ File loads without errors
- ✅ Global CASCO price = 1700 €/m² (migrated from participant's cascoPerM2)
- ✅ No cascoPerM2 in participant UI
- ✅ Calculations use the global value

### Test 2: Download and reload

**Steps:**
1. After loading the v1.0.2 file, click "Télécharger" to download
2. Open the downloaded JSON file in a text editor
3. Verify structure:
   - `projectParams.globalCascoPerM2` exists and equals 1700
   - No `participants[].cascoPerM2` fields
4. Click "Réinitialiser" to reset the application
5. Load the newly downloaded file
6. Verify data loads correctly with globalCascoPerM2

**Expected Results:**
- ✅ Downloaded file has v1.0.3 format (globalCascoPerM2 in projectParams)
- ✅ No per-participant cascoPerM2 fields
- ✅ File can be reloaded successfully

### Test 3: localStorage persistence

**Steps:**
1. Load the v1.0.2 file
2. Open browser DevTools > Application > Local Storage
3. Find `credit-castor-scenario` key
4. Verify the stored JSON has:
   - `projectParams.globalCascoPerM2` = 1700
   - No `participants[].cascoPerM2` fields
5. Refresh the page (F5 or Cmd+R)
6. Verify data persists correctly

**Expected Results:**
- ✅ localStorage contains migrated v1.0.3 format
- ✅ Page refresh preserves globalCascoPerM2
- ✅ No cascoPerM2 in localStorage

### Test 4: v1.0.3 file (control test)

**Steps:**
1. Reset the application
2. Enter some custom data manually
3. Download the scenario
4. Reset again
5. Load the downloaded v1.0.3 file
6. Verify no changes to data structure

**Expected Results:**
- ✅ v1.0.3 files load normally
- ✅ No migration side effects
- ✅ Data remains unchanged (no-op migration)

## Issues Found

[Document any issues discovered during testing]

## Browser Compatibility

Test in the following browsers if possible:
- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari

## Conclusion

[Pass/Fail with summary]

**Overall Status:** [PENDING/PASS/FAIL]

**Notes:**
- Test file location: `/Users/dragan/Documents/credit-castor/.worktrees/scenario-compat/test-v1.0.2-scenario.json`
- Build command: `npm run build && npm run preview`
- This document serves as a template for manual testing. Actual testing will be performed by the user.
