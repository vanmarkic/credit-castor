# Pre-Commit Checklist for Breaking Changes

Before committing changes to critical data structures, run through this checklist:

## Quick Check (30 seconds)

```bash
# Run schema validation tests
npm run test:schema
```

✅ **If all tests pass** → You can commit safely (no breaking changes)

❌ **If tests fail** → You have a breaking change. Continue to full checklist below.

---

## Full Breaking Change Checklist

Did you modify any of these files?
- [ ] `src/utils/calculatorUtils.ts` (Participant, ProjectParams, PortageFormulaParams)
- [ ] `src/utils/scenarioFileIO.ts` (ScenarioData interface)
- [ ] `src/services/firestoreSync.ts` (FirestoreScenarioData interface)
- [ ] `src/utils/storage.ts` (localStorage save/load logic)

If **NO** → Skip this checklist, you're good to go!

If **YES** → Continue below:

### 1. What Changed?

Check all that apply:
- [ ] Added a new **optional** field → ✅ SAFE (minor version)
- [ ] Added a new **required** field → ❌ BREAKING (major version)
- [ ] Renamed a field → ❌ BREAKING (major version)
- [ ] Removed a field → ❌ BREAKING (major version)
- [ ] Changed a field's type → ❌ BREAKING (major version)
- [ ] Changed calculated output structure (JSON export) → ⚠️ Depends (check if users import old exports)

### 2. If Breaking Change Detected

#### A. Bump Major Version
```typescript
// src/utils/version.ts
export const RELEASE_VERSION = '2.0.0'; // ← Change from 1.x.x to 2.0.0
```

#### B. Update Version History
```typescript
/**
 * Version history:
 * - 2.0.0: BREAKING - [describe your change]
 * - 1.16.0: Implemented semantic versioning
 * ...
 */
```

#### C. Update Schema Tests
```typescript
// src/utils/dataSchema.test.ts
const currentMajorVersion = 2; // ← Update this
const needsMajorVersionBump = false; // ← Reset to false
```

#### D. Create Migration (if needed)
If users will have old data that needs to be migrated:

```typescript
// src/utils/migrations.ts (create this file)
export function migrateV1toV2(oldData: any) {
  // Transform old data structure to new format
  return {
    ...oldData,
    // Your migration logic
  };
}
```

Then apply it in `storage.ts` and `scenarioFileIO.ts`.

### 3. Manual Testing

Before pushing:

```bash
# Test 1: localStorage compatibility
# 1. Load app with old version
# 2. Create some data
# 3. Check localStorage (DevTools → Application → localStorage)
# 4. Apply your changes
# 5. Reload app
# 6. Verify data still loads correctly

# Test 2: JSON export/import
# 1. Export a scenario before your changes
# 2. Apply your changes
# 3. Import the old scenario file
# 4. Verify it loads correctly (or shows appropriate error)

# Test 3: Firestore (if applicable)
# 1. Save to Firestore before changes
# 2. Apply your changes
# 3. Load from Firestore
# 4. Verify sync works correctly
```

### 4. Documentation

Add to commit message:
```
feat: [Your feature]

BREAKING CHANGE: [Describe the breaking change and migration path]

Migration steps:
1. [Step 1]
2. [Step 2]
```

---

## Examples

### ✅ Safe Change (Minor Version)
```typescript
// Adding optional field
interface Participant {
  name: string;
  email?: string; // ← New optional field (v1.17.0)
}
```

**Action:** Commit with minor version bump

### ❌ Breaking Change (Major Version)
```typescript
// Renaming field
interface Participant {
  // notaryFeesRate: number; ← Removed
  droitEnregistrementsRate: number; // ← New name
}
```

**Action:**
1. Bump to v2.0.0
2. Create migration
3. Update tests
4. Document in commit message

---

## Quick Commands

```bash
# Check for breaking changes
npm run test:schema

# Run all tests
npm run test:run

# Check types
npx tsc --noEmit

# Lint check
npm run lint
```

---

## When in Doubt

Ask yourself:
> "Will data saved with the current version (1.16.0) still work after my changes?"

- **YES** → Safe change (minor/patch version)
- **NO** → Breaking change (major version)
- **UNSURE** → Run `npm run test:schema` and check the guide

**Still unsure?** → Check [breaking-changes-guide.md](./breaking-changes-guide.md) for detailed examples.
