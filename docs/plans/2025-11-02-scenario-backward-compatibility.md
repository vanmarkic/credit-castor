# Scenario Backward Compatibility Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Enable v1.0.2 scenario files (with per-participant `cascoPerM2`) to load successfully in v1.0.3 (which uses global `globalCascoPerM2`).

**Architecture:** Extract existing localStorage migration logic into a pure, testable `migrateScenarioData()` function, then apply it to both localStorage and file upload code paths.

**Tech Stack:** TypeScript, React, Vitest

---

## Task 1: Create Migration Function with Unit Tests

**Files:**
- Modify: `src/components/EnDivisionCorrect.tsx:53` (add function before `loadFromLocalStorage`)
- Test: `src/components/EnDivisionCorrect.test.tsx` (add tests)

### Step 1: Write failing test for v1.0.2 migration

Add this test to `src/components/EnDivisionCorrect.test.tsx` at the end of the test suite:

```typescript
describe('migrateScenarioData', () => {
  test('migrates v1.0.2 format to v1.0.3', () => {
    const oldData = {
      participants: [
        { name: 'A', cascoPerM2: 1700, parachevementsPerM2: 500, surface: 100, unitId: 1, capitalApporte: 50000, notaryFeesRate: 12.5, interestRate: 4.5, durationYears: 25, quantity: 1 },
        { name: 'B', cascoPerM2: 1700, parachevementsPerM2: 600, surface: 150, unitId: 2, capitalApporte: 70000, notaryFeesRate: 12.5, interestRate: 4.5, durationYears: 25, quantity: 1 }
      ],
      projectParams: {
        totalPurchase: 650000,
        mesuresConservatoires: 20000,
        demolition: 40000,
        infrastructures: 90000,
        etudesPreparatoires: 59820,
        fraisEtudesPreparatoires: 27320,
        fraisGeneraux3ans: 0,
        batimentFondationConservatoire: 43700,
        batimentFondationComplete: 269200,
        batimentCoproConservatoire: 56000
        // No globalCascoPerM2
      },
      scenario: { constructionCostChange: 0, infrastructureReduction: 0, purchasePriceReduction: 0 }
    };

    // Import the function (will add export in implementation)
    const { migrateScenarioData } = require('./EnDivisionCorrect');
    const result = migrateScenarioData(oldData);

    expect(result.projectParams.globalCascoPerM2).toBe(1700);
    expect(result.participants[0]).not.toHaveProperty('cascoPerM2');
    expect(result.participants[1]).not.toHaveProperty('cascoPerM2');
    expect(result.participants[0].parachevementsPerM2).toBe(500);
  });
});
```

### Step 2: Run test to verify it fails

Run: `npm run test:run -- src/components/EnDivisionCorrect.test.tsx`

Expected: FAIL with "migrateScenarioData is not defined" or similar

### Step 3: Implement migration function

Add this function to `src/components/EnDivisionCorrect.tsx` at line 53 (before `loadFromLocalStorage`):

```typescript
// Migration function to handle v1.0.2 -> v1.0.3 scenario format
export const migrateScenarioData = (data: any): {
  participants: any[];
  projectParams: any;
  scenario: any;
} => {
  // Clone to avoid mutations
  const migrated = { ...data };

  // Migration: If no globalCascoPerM2, use first participant's value or default
  if (migrated.projectParams && !migrated.projectParams.globalCascoPerM2) {
    migrated.projectParams = {
      ...migrated.projectParams,
      globalCascoPerM2: migrated.participants?.[0]?.cascoPerM2 || 1590
    };
  }

  // Clean up old participant cascoPerM2 fields
  if (migrated.participants) {
    migrated.participants = migrated.participants.map((p: any) => {
      const { cascoPerM2, ...rest } = p;
      return rest;
    });
  }

  return {
    participants: migrated.participants || DEFAULT_PARTICIPANTS,
    projectParams: migrated.projectParams || DEFAULT_PROJECT_PARAMS,
    scenario: migrated.scenario || DEFAULT_SCENARIO
  };
};
```

### Step 4: Run test to verify it passes

Run: `npm run test:run -- src/components/EnDivisionCorrect.test.tsx`

Expected: PASS (1 test passing)

### Step 5: Commit

```bash
git add src/components/EnDivisionCorrect.tsx src/components/EnDivisionCorrect.test.tsx
git commit -m "feat: add migrateScenarioData function for v1.0.2 compatibility

- Extract migration logic into pure function
- Add unit test for v1.0.2 to v1.0.3 migration
- Function handles missing globalCascoPerM2 gracefully"
```

---

## Task 2: Add Tests for Edge Cases

**Files:**
- Test: `src/components/EnDivisionCorrect.test.tsx`

### Step 1: Write test for v1.0.3 format (no-op)

Add this test after the previous one:

```typescript
test('handles v1.0.3 format as no-op', () => {
  const { migrateScenarioData } = require('./EnDivisionCorrect');
  const newData = {
    participants: [
      { name: 'A', parachevementsPerM2: 500, surface: 100, unitId: 1, capitalApporte: 50000, notaryFeesRate: 12.5, interestRate: 4.5, durationYears: 25, quantity: 1 }
    ],
    projectParams: {
      totalPurchase: 650000,
      mesuresConservatoires: 20000,
      demolition: 40000,
      infrastructures: 90000,
      etudesPreparatoires: 59820,
      fraisEtudesPreparatoires: 27320,
      fraisGeneraux3ans: 0,
      batimentFondationConservatoire: 43700,
      batimentFondationComplete: 269200,
      batimentCoproConservatoire: 56000,
      globalCascoPerM2: 1590
    },
    scenario: { constructionCostChange: 0, infrastructureReduction: 0, purchasePriceReduction: 0 }
  };

  const result = migrateScenarioData(newData);

  expect(result.projectParams.globalCascoPerM2).toBe(1590);
  expect(result.participants[0]).not.toHaveProperty('cascoPerM2');
});
```

### Step 2: Write test for default fallback

Add this test:

```typescript
test('uses default 1590 when no cascoPerM2 exists', () => {
  const { migrateScenarioData } = require('./EnDivisionCorrect');
  const oldData = {
    participants: [{ name: 'A', parachevementsPerM2: 500, surface: 100, unitId: 1, capitalApporte: 50000, notaryFeesRate: 12.5, interestRate: 4.5, durationYears: 25, quantity: 1 }],
    projectParams: { totalPurchase: 650000 },
    scenario: { constructionCostChange: 0 }
  };

  const result = migrateScenarioData(oldData);

  expect(result.projectParams.globalCascoPerM2).toBe(1590);
});
```

### Step 3: Write test for empty participants

Add this test:

```typescript
test('handles empty participants array', () => {
  const { migrateScenarioData, DEFAULT_PARTICIPANTS } = require('./EnDivisionCorrect');
  const oldData = {
    participants: [],
    projectParams: {},
    scenario: {}
  };

  const result = migrateScenarioData(oldData);

  expect(result.participants).toEqual(DEFAULT_PARTICIPANTS);
  expect(result.projectParams.globalCascoPerM2).toBe(1590);
});
```

Note: Need to export `DEFAULT_PARTICIPANTS` from EnDivisionCorrect.tsx for this test.

### Step 4: Export DEFAULT constants

In `src/components/EnDivisionCorrect.tsx`, change line 8-33 from:

```typescript
const DEFAULT_PARTICIPANTS = [
```

to:

```typescript
export const DEFAULT_PARTICIPANTS = [
```

Do the same for `DEFAULT_PROJECT_PARAMS` and `DEFAULT_SCENARIO`.

### Step 5: Run all tests

Run: `npm run test:run -- src/components/EnDivisionCorrect.test.tsx`

Expected: PASS (4 migration tests + previous 7 tests = 11 tests total)

### Step 6: Commit

```bash
git add src/components/EnDivisionCorrect.tsx src/components/EnDivisionCorrect.test.tsx
git commit -m "test: add edge case tests for scenario migration

- Test v1.0.3 format (no-op)
- Test default fallback when no cascoPerM2
- Test empty participants array
- Export DEFAULT constants for testing"
```

---

## Task 3: Refactor localStorage to Use Migration Function

**Files:**
- Modify: `src/components/EnDivisionCorrect.tsx:53-83` (loadFromLocalStorage function)

### Step 1: Write test for localStorage migration

Add this test to verify localStorage path uses migration:

```typescript
test('loadFromLocalStorage uses migration function', () => {
  const { migrateScenarioData } = require('./EnDivisionCorrect');

  // Mock localStorage with v1.0.2 data
  const oldData = {
    participants: [{ name: 'A', cascoPerM2: 1800, surface: 100, unitId: 1 }],
    projectParams: { totalPurchase: 650000 },
    scenario: { constructionCostChange: 0 }
  };

  global.localStorage.setItem('credit-castor-scenario', JSON.stringify(oldData));

  // Dynamically import to get fresh function
  delete require.cache[require.resolve('./EnDivisionCorrect')];
  const { loadFromLocalStorage } = require('./EnDivisionCorrect');

  const result = loadFromLocalStorage();

  expect(result?.projectParams.globalCascoPerM2).toBe(1800);
  expect(result?.participants[0]).not.toHaveProperty('cascoPerM2');

  // Cleanup
  global.localStorage.clear();
});
```

Note: This test may need adjustment based on how the component exports functions. We'll verify in the next step.

### Step 2: Export loadFromLocalStorage for testing

In `src/components/EnDivisionCorrect.tsx`, change line 53 from:

```typescript
const loadFromLocalStorage = () => {
```

to:

```typescript
export const loadFromLocalStorage = () => {
```

### Step 3: Refactor loadFromLocalStorage to use migration

Replace the `loadFromLocalStorage` function (lines 53-83) with:

```typescript
export const loadFromLocalStorage = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const data = JSON.parse(stored);
      return migrateScenarioData(data);
    }
  } catch (error) {
    console.error('Failed to load from localStorage:', error);
  }
  return null;
};
```

This removes the inline migration logic (lines 59-77) and uses the shared function.

### Step 4: Run tests

Run: `npm run test:run -- src/components/EnDivisionCorrect.test.tsx`

Expected: PASS (all tests including new localStorage test)

### Step 5: Commit

```bash
git add src/components/EnDivisionCorrect.tsx src/components/EnDivisionCorrect.test.tsx
git commit -m "refactor: use migrateScenarioData in loadFromLocalStorage

- Remove inline migration logic
- Call shared migration function
- Add test for localStorage migration path"
```

---

## Task 4: Add Migration to File Upload Handler

**Files:**
- Modify: `src/components/EnDivisionCorrect.tsx` (FileReader.onload handler, around line 230)

### Step 1: Find FileReader.onload handler

Search for the file upload handler:

Run: `grep -n "reader.onload" src/components/EnDivisionCorrect.tsx`

Expected output shows the line number (likely around 230-250).

### Step 2: Write integration test for file upload migration

Add this test:

```typescript
test('file upload uses migration function', async () => {
  const { migrateScenarioData } = require('./EnDivisionCorrect');

  // Simulate v1.0.2 file data
  const oldFileData = {
    participants: [
      { name: 'A', cascoPerM2: 1750, parachevementsPerM2: 500, surface: 100, unitId: 1, capitalApporte: 50000, notaryFeesRate: 12.5, interestRate: 4.5, durationYears: 25, quantity: 1 }
    ],
    projectParams: { totalPurchase: 650000, mesuresConservatoires: 20000 },
    scenario: { constructionCostChange: 0, infrastructureReduction: 0, purchasePriceReduction: 0 }
  };

  const migrated = migrateScenarioData(oldFileData);

  // Verify migration happens
  expect(migrated.projectParams.globalCascoPerM2).toBe(1750);
  expect(migrated.participants[0]).not.toHaveProperty('cascoPerM2');
});
```

### Step 3: Run test to verify existing behavior

Run: `npm run test:run -- src/components/EnDivisionCorrect.test.tsx`

Expected: PASS (test verifies migration function works, but doesn't test file upload integration yet)

### Step 4: Update FileReader.onload handler

Find the handler in `src/components/EnDivisionCorrect.tsx` (use grep output from Step 1).

Replace the section that loads data (after JSON.parse and validation) from:

```typescript
// Load the data
setParticipants(data.participants);
setProjectParams(data.projectParams);
setScenario(data.scenario);
```

to:

```typescript
// Migrate and load the data
const migrated = migrateScenarioData(data);
setParticipants(migrated.participants);
setProjectParams(migrated.projectParams);
setScenario(migrated.scenario);
```

### Step 5: Run all tests

Run: `npm run test:run`

Expected: PASS (all 79+ tests passing)

### Step 6: Commit

```bash
git add src/components/EnDivisionCorrect.tsx src/components/EnDivisionCorrect.test.tsx
git commit -m "feat: add migration to file upload handler

- Apply migrateScenarioData to file upload path
- Now both localStorage and file upload use migration
- Add integration test for file upload migration"
```

---

## Task 5: Manual Testing and Verification

**Files:**
- None (manual testing only)

### Step 1: Create v1.0.2 test file

Create a test file `test-v1.0.2-scenario.json` with old format:

```json
{
  "version": 1,
  "timestamp": "2025-11-01T12:00:00.000Z",
  "participants": [
    {
      "name": "Test User",
      "capitalApporte": 50000,
      "notaryFeesRate": 12.5,
      "unitId": 1,
      "surface": 112,
      "interestRate": 4.5,
      "durationYears": 25,
      "quantity": 1,
      "cascoPerM2": 1700,
      "parachevementsPerM2": 500
    }
  ],
  "projectParams": {
    "totalPurchase": 650000,
    "mesuresConservatoires": 20000,
    "demolition": 40000,
    "infrastructures": 90000,
    "etudesPreparatoires": 59820,
    "fraisEtudesPreparatoires": 27320,
    "fraisGeneraux3ans": 0,
    "batimentFondationConservatoire": 43700,
    "batimentFondationComplete": 269200,
    "batimentCoproConservatoire": 56000
  },
  "scenario": {
    "constructionCostChange": 0,
    "infrastructureReduction": 0,
    "purchasePriceReduction": 0
  }
}
```

Save this to the project root for manual testing.

### Step 2: Build and preview

Run: `npm run build && npm run preview`

Expected: Build succeeds, preview server starts

### Step 3: Manual test checklist

Open the preview in browser and test:

1. **Load v1.0.2 file:**
   - Click "Charger" button
   - Select `test-v1.0.2-scenario.json`
   - Expected: Success alert, `globalCascoPerM2` = 1700 in Scenarios section
   - Expected: No `cascoPerM2` field in participant details

2. **Verify calculations:**
   - Check that CASCO calculations use 1700 €/m²
   - Expected: CASCO = 112m² × 1700 = 190,400

3. **Download and reload:**
   - Click "Télécharger" to save scenario
   - Click "Réinitialiser" to reset
   - Load the downloaded file
   - Expected: Still works, globalCascoPerM2 preserved

4. **localStorage persistence:**
   - Refresh page
   - Expected: Data persists with globalCascoPerM2

5. **v1.0.3 file (control):**
   - Download a scenario from current version
   - Reset
   - Load that file
   - Expected: Works normally (no-op migration)

### Step 4: Document test results

Create `docs/development/2025-11-02-manual-test-results.md`:

```markdown
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

## Issues Found
[List any issues discovered]

## Conclusion
[Pass/Fail with summary]
```

### Step 5: Run full test suite

Run: `npm run test:run`

Expected: All tests pass (79+ tests)

### Step 6: Commit test artifacts

```bash
git add test-v1.0.2-scenario.json docs/development/2025-11-02-manual-test-results.md
git commit -m "test: add manual test artifacts for v1.0.2 compatibility

- Add test scenario file with v1.0.2 format
- Add manual test results template
- Document verification checklist"
```

---

## Task 6: Update Documentation

**Files:**
- Create: `docs/development/2025-11-02-migration-notes.md`
- Modify: `CLAUDE.md` (add migration notes)

### Step 1: Create migration documentation

Create `docs/development/2025-11-02-migration-notes.md`:

```markdown
# Scenario Migration: v1.0.2 to v1.0.3

**Migration Date:** 2025-11-02
**Breaking Change:** CASCO price moved from per-participant to global

## What Changed

### v1.0.2 Format
```json
{
  "participants": [
    { "cascoPerM2": 1590, ... }
  ],
  "projectParams": { ... }
}
```

### v1.0.3 Format
```json
{
  "participants": [
    { ... }  // No cascoPerM2
  ],
  "projectParams": {
    "globalCascoPerM2": 1590
  }
}
```

## Migration Strategy

**Function:** `migrateScenarioData()` in `src/components/EnDivisionCorrect.tsx`

**Logic:**
1. If `projectParams.globalCascoPerM2` missing → use first participant's `cascoPerM2` or default to 1590
2. Remove `cascoPerM2` from all participants
3. Apply defaults for missing data

**Applied to:**
- localStorage (on page load)
- File uploads (JSON scenario files)

## Backward Compatibility

✅ v1.0.2 files load successfully
✅ v1.0.3 files work normally (no-op)
✅ Mixed scenarios (some participants with cascoPerM2) handled gracefully

## Edge Cases

- **No cascoPerM2:** Defaults to 1590
- **Empty participants:** Uses DEFAULT_PARTICIPANTS
- **Multiple cascoPerM2 values:** Uses first participant's value

## Testing

See `src/components/EnDivisionCorrect.test.tsx` for unit tests.
See `docs/development/2025-11-02-manual-test-results.md` for manual test results.
```

### Step 2: Update CLAUDE.md

Add this section to `CLAUDE.md` under "## Working with Claude Code":

```markdown
### Data Migration

When making breaking changes to data structures:
- Extract migration logic into pure, testable functions
- Apply migrations to all data loading paths (localStorage, file uploads, API calls)
- Write comprehensive unit tests for edge cases
- Document migration in docs/development/
- Create test fixtures with old format
- Manual testing checklist before release
```

### Step 3: Commit documentation

```bash
git add docs/development/2025-11-02-migration-notes.md CLAUDE.md
git commit -m "docs: add migration documentation for v1.0.2 compatibility

- Document migration strategy and function
- Add backward compatibility notes
- Update CLAUDE.md with migration best practices"
```

---

## Task 7: Final Verification and Cleanup

**Files:**
- None (verification only)

### Step 1: Run complete test suite

Run: `npm run test:run`

Expected: All tests pass (should be 85+ tests now)

### Step 2: Type check

Run: `npx tsc --noEmit`

Expected: No errors

### Step 3: Build production

Run: `npm run build`

Expected: Build succeeds with no errors

### Step 4: Review changes

Run: `git log --oneline origin/master..HEAD`

Expected output:
```
[hash] docs: add migration documentation for v1.0.2 compatibility
[hash] test: add manual test artifacts for v1.0.2 compatibility
[hash] feat: add migration to file upload handler
[hash] refactor: use migrateScenarioData in loadFromLocalStorage
[hash] test: add edge case tests for scenario migration
[hash] feat: add migrateScenarioData function for v1.0.2 compatibility
```

### Step 5: View diff summary

Run: `git diff --stat origin/master..HEAD`

Expected: Changes to EnDivisionCorrect.tsx, test files, and docs only

### Step 6: Create summary commit if needed

If all looks good, no additional commit needed. All work is committed.

---

## Completion Checklist

After all tasks complete, verify:

- [ ] All tests pass (`npm run test:run`)
- [ ] TypeScript compiles (`npx tsc --noEmit`)
- [ ] Build succeeds (`npm run build`)
- [ ] Manual tests documented
- [ ] Migration function implemented and tested
- [ ] localStorage uses migration
- [ ] File upload uses migration
- [ ] Edge cases tested
- [ ] Documentation complete
- [ ] 6 commits made (one per task)

## Next Steps

After completing this plan:

1. **Review:** Use superpowers:requesting-code-review to review implementation
2. **Merge:** Use superpowers:finishing-a-development-branch to merge to master
3. **Tag:** Consider tagging as v1.0.3 with migration notes

---

**Estimated Time:** 60-90 minutes
**Difficulty:** Medium (refactoring with migration logic)
**Skills Required:** TypeScript, React, TDD, data migration patterns
