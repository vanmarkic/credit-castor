# Breaking Changes Guide

## What is a Breaking Change?

A **breaking change** is any modification that makes existing stored data incompatible with the new version of the application. This requires a **MAJOR version bump** (e.g., `1.16.0` → `2.0.0`).

## Critical Data Structures

Changes to these interfaces/types are **always breaking changes**:

### 1. **Participant Interface** (`src/utils/calculatorUtils.ts`)
Stored in:
- ✅ localStorage (`storage.ts`)
- ✅ JSON exports (`scenarioFileIO.ts`)
- ✅ Firestore (`firestoreSync.ts`)

**Breaking changes:**
- ❌ Renaming a field (e.g., `capitalApporte` → `capital`)
- ❌ Removing a required field
- ❌ Changing a field's type (e.g., `string` → `number`)
- ❌ Making an optional field required

**Safe changes:**
- ✅ Adding a new optional field
- ✅ Adding a new optional nested object
- ✅ Deprecating a field (keep it, add new one)

### 2. **ProjectParams Interface** (`src/utils/calculatorUtils.ts`)
Stored in: localStorage, JSON, Firestore

**Breaking changes:**
- ❌ Renaming fields (e.g., `totalPurchasePrice` → `purchasePrice`)
- ❌ Removing fields
- ❌ Changing types

**Safe changes:**
- ✅ Adding optional fields (e.g., `cascoTvaRate?: number`)

### 3. **PortageFormulaParams Interface** (`src/utils/calculatorUtils.ts`)
Stored in: localStorage, JSON, Firestore

Same rules as above.

### 4. **ScenarioData Interface** (`src/utils/scenarioFileIO.ts`)
JSON export format

**Breaking changes:**
- ❌ Changing `calculations.totals` field names
- ❌ Removing top-level fields
- ❌ Changing version format

### 5. **FirestoreScenarioData Interface** (`src/services/firestoreSync.ts`)
Firestore document structure

**Breaking changes:**
- ❌ Renaming metadata fields (`lastModifiedBy`, `lastModifiedAt`, `version`)
- ❌ Removing required fields

## Breaking Change Examples

### ❌ Breaking: Renaming a Field
```typescript
// OLD (v1.x)
interface Participant {
  notaryFeesRate: number;
}

// NEW (v2.0) - BREAKING!
interface Participant {
  droitEnregistrementsRate: number; // ❌ Old data has "notaryFeesRate"
}
```

**Solution:** Keep both fields and deprecate the old one:
```typescript
interface Participant {
  notaryFeesRate: number; // ✅ Keep for backward compatibility
  droitEnregistrementsRate?: number; // ✅ New optional field
}
```

### ❌ Breaking: Changing Calculated Field Names in Export
```typescript
// OLD (v1.x)
calculations: {
  totals: {
    totalNotaryFees: number;
  }
}

// NEW (v2.0) - BREAKING!
calculations: {
  totals: {
    totalDroitEnregistrements: number; // ❌ Old exports have "totalNotaryFees"
  }
}
```

**Solution:** If this is internal calculated data (not loaded back), it's safe to change. But JSON exports include calculations, so map the old field name during serialization:

```typescript
// In serializeScenario()
totals: {
  totalNotaryFees: calculations.totals.totalDroitEnregistrements, // ✅ Keep old name
}
```

### ✅ Safe: Adding Optional Fields
```typescript
// OLD (v1.x)
interface Participant {
  name: string;
  capitalApporte: number;
}

// NEW (v1.17.0) - SAFE!
interface Participant {
  name: string;
  capitalApporte: number;
  email?: string; // ✅ Optional field, old data works fine
}
```

### ✅ Safe: Deprecation Strategy
```typescript
interface Participant {
  /**
   * @deprecated Use lotsOwned instead. This field is kept for backward compatibility.
   */
  quantity?: number;

  /** New field that replaces quantity */
  lotsOwned?: Lot[];
}
```

## When to Bump Major Version

### Trigger Checklist

If you answer **YES** to any of these, bump to `2.0.0`:

- [ ] Did you rename a field in `Participant`, `ProjectParams`, or `PortageFormulaParams`?
- [ ] Did you remove a field that was previously stored?
- [ ] Did you change a field's type (e.g., `Date` → `string`)?
- [ ] Did you change the structure of `ScenarioData` in a way that breaks `deserializeScenario()`?
- [ ] Did you change the structure of `FirestoreScenarioData`?
- [ ] Did you change the `calculations` structure in JSON exports that users may have saved?

If **NO** to all, you can use minor/patch versions:
- Minor (`1.17.0`): New features, new optional fields
- Patch (`1.16.1`): Bug fixes, no API changes

## Workflow for Breaking Changes

### 1. Identify the Breaking Change
Run the schema validation tests:
```bash
npm run test:run -- src/utils/dataSchema.test.ts
```

If tests fail → breaking change detected.

### 2. Create a Migration Function
```typescript
// src/utils/migrations.ts
export function migrateV1toV2(oldData: any): ScenarioData {
  return {
    ...oldData,
    // Rename field
    participants: oldData.participants.map((p: any) => ({
      ...p,
      newFieldName: p.oldFieldName,
    })),
  };
}
```

### 3. Update Version Detection
```typescript
// In deserializeScenario() or loadFromLocalStorage()
if (data.version === 1) {
  data = migrateV1toV2(data);
}
```

### 4. Bump Major Version
```typescript
// src/utils/version.ts
export const RELEASE_VERSION = '2.0.0'; // ← Bump major version
```

### 5. Update Tests
```typescript
// src/utils/dataSchema.test.ts
const currentMajorVersion = 2; // ← Update
const needsMajorVersionBump = false; // ← Reset
```

### 6. Document the Change
```typescript
// src/utils/version.ts
/**
 * Version history:
 * - 2.0.0: BREAKING - Renamed notaryFeesRate → droitEnregistrementsRate
 * - 1.16.0: Implemented semantic versioning
 */
```

## Automated Safeguards

### 1. Schema Validation Tests
Run anytime:
```bash
npm run test:schema
```

These tests snapshot the data structure shapes. Any change triggers a failure.

### 2. Pre-Push Hook (Automatic) ✅
The repository now includes a **pre-push hook** that automatically runs schema validation before every push:

**Location:** `.git/hooks/pre-push`

When you try to push, the hook will:
- Run `npm run test:schema`
- Block the push if breaking changes are detected
- Show helpful instructions on how to proceed

**To bypass (not recommended):**
```bash
git push --no-verify
```

**Hook is already set up** - No action needed! It will run automatically on `git push`.

### 3. Manual Checklist
Before merging major changes:
- [ ] Ran schema validation tests (`npm run test:schema`)
- [ ] Checked if any field names changed in critical interfaces
- [ ] Verified localStorage data loads correctly
- [ ] Tested JSON export/import
- [ ] Tested Firestore sync (if applicable)

## Real-World Examples from This Project

### Example 1: notaryFees → droitEnregistrements (v1.15.0)
**Type:** Calculated field rename in internal types
**Breaking?** NO - because `ParticipantCalculation` is not stored, only `Participant` is
**Action:** Minor version bump

### Example 2: Added fraisNotaireFixe field (v1.16.0)
**Type:** New field in stored calculations
**Breaking?** NO - JSON export added new field, old exports still load
**Action:** Minor version bump

### Example 3: Hypothetical - Remove quantity field
**Type:** Remove field from `Participant`
**Breaking?** YES - old data has `quantity`, new code doesn't expect it
**Action:** Major version bump to `2.0.0` + migration function

## Quick Reference

| Change Type | Participant | ProjectParams | ScenarioData | Version Bump |
|-------------|-------------|---------------|--------------|--------------|
| Add optional field | ✅ Safe | ✅ Safe | ✅ Safe | Minor |
| Add required field | ❌ Breaking | ❌ Breaking | ❌ Breaking | Major |
| Rename field | ❌ Breaking | ❌ Breaking | ❌ Breaking | Major |
| Remove field | ❌ Breaking | ❌ Breaking | ❌ Breaking | Major |
| Change field type | ❌ Breaking | ❌ Breaking | ❌ Breaking | Major |
| Deprecate field (keep it) | ✅ Safe | ✅ Safe | ✅ Safe | Minor |
| Fix bug (no API change) | ✅ Safe | ✅ Safe | ✅ Safe | Patch |

## Testing Your Changes

### Manual Testing Checklist
1. **localStorage test:**
   - Load app with old localStorage data
   - Verify no console errors
   - Verify data displays correctly

2. **JSON export test:**
   - Export a scenario with old version
   - Bump your version
   - Import the old export
   - Verify it loads correctly

3. **Firestore test:**
   - Save data with old version
   - Bump your version
   - Load from Firestore
   - Verify it syncs correctly

### Automated Testing
```bash
# Run all schema validation tests
npm run test:run -- src/utils/dataSchema.test.ts

# Run specific storage tests
npm run test:run -- src/utils/storage.test.ts
npm run test:run -- src/utils/scenarioFileIO.test.ts
```

## Summary

✅ **DO:**
- Add optional fields
- Deprecate old fields (keep them)
- Run schema tests before committing
- Document your changes
- Bump major version for breaking changes

❌ **DON'T:**
- Rename fields without migration
- Remove fields without migration
- Change types without migration
- Assume "it's just internal" (check if it's stored!)

---

**Remember:** When in doubt, run the tests and ask yourself: "Will old saved data still work?" If not → major version bump.
