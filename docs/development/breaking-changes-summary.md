# Breaking Changes Protection System - Summary

## What Was Implemented

A comprehensive system to detect and prevent accidental breaking changes to stored data structures.

## Components

### 1. Schema Validation Tests (`src/utils/dataSchema.test.ts`)
- Validates the shape of all critical data structures
- Detects changes to field names, types, and required vs optional fields
- Includes a version bump reminder that fails if you forget to update the major version
- **Run with:** `npm run test:schema`

### 2. Breaking Changes Guide (`docs/development/breaking-changes-guide.md`)
Complete reference guide covering:
- What constitutes a breaking change
- Critical data structures (Participant, ProjectParams, etc.)
- Real-world examples (breaking vs safe changes)
- Step-by-step workflow for handling breaking changes
- Quick reference table
- Testing strategies

### 3. Pre-Commit Checklist (`docs/development/pre-commit-checklist.md`)
Quick checklist for developers:
- 30-second quick check
- Full breaking change checklist
- Version bump instructions
- Manual testing steps
- Example scenarios

### 4. Updated CLAUDE.md
Added "Version Management & Breaking Changes" section:
- Semantic versioning explained
- Critical data structures listed
- Before-commit workflow
- Quick rules (safe vs breaking)

### 5. NPM Script
Added convenience script:
```bash
npm run test:schema  # Run schema validation tests
```

## How to Use

### Before Making Changes to Data Structures

1. **Run the schema tests:**
   ```bash
   npm run test:schema
   ```

2. **If tests PASS after your changes** → You're good! (No breaking changes)

3. **If tests FAIL after your changes** → You have a breaking change:
   - Bump major version: `1.16.0` → `2.0.0`
   - Update `src/utils/version.ts`
   - Update schema tests
   - Document the change

### Quick Decision Tree

```
Did you change Participant/ProjectParams/PortageFormulaParams?
├─ YES → Run npm run test:schema
│  ├─ Tests PASS → Safe change (minor/patch)
│  └─ Tests FAIL → Breaking change (major)
└─ NO → Regular commit
```

## Protected Data Structures

Changes to these trigger breaking change detection:

1. **`Participant`** (in calculatorUtils.ts)
   - Stored in: localStorage, JSON exports, Firestore
   - Breaking: Rename/remove fields, change types

2. **`ProjectParams`** (in calculatorUtils.ts)
   - Stored in: localStorage, JSON exports, Firestore
   - Breaking: Rename/remove fields, change types

3. **`PortageFormulaParams`** (in calculatorUtils.ts)
   - Stored in: localStorage, JSON exports, Firestore
   - Breaking: Rename/remove fields, change types

4. **`ScenarioData`** (in scenarioFileIO.ts)
   - Used for: JSON export/import
   - Breaking: Change structure, remove fields

5. **`FirestoreScenarioData`** (in firestoreSync.ts)
   - Used for: Firestore sync
   - Breaking: Change metadata fields

## Examples

### ✅ Safe Change (No Version Bump Needed)
```typescript
// Adding optional field
interface Participant {
  name: string;
  email?: string; // ← New optional field
}
```
**Action:** Commit normally (minor version bump if it's a feature)

### ❌ Breaking Change (Major Version Bump Required)
```typescript
// Renaming field
interface Participant {
  droitEnregistrementsRate: number; // ← Was "notaryFeesRate"
}
```
**Action:**
1. Run `npm run test:schema` → FAILS
2. Bump to v2.0.0
3. Update schema tests
4. Create migration if needed
5. Document change

## Key Benefits

1. **Automated Detection**: Tests catch breaking changes immediately
2. **Clear Documentation**: Comprehensive guides for developers
3. **Version Enforcement**: Test fails if version not bumped
4. **Quick Validation**: `npm run test:schema` in 1 second
5. **Self-Documenting**: Test file serves as schema documentation

## Current Status

- ✅ Schema validation tests created (14 tests)
- ✅ Breaking changes guide documented
- ✅ Pre-commit checklist created
- ✅ NPM script added (`npm run test:schema`)
- ✅ CLAUDE.md updated with version management section
- ✅ **Pre-push hook installed** (`.git/hooks/pre-push`)
- ✅ All tests passing

## Pre-Push Hook

**Automatic protection is now active!** Every time you push:

```bash
git push
# 🔍 Running schema validation tests before push...
# ✅ Schema validation passed!
```

If breaking changes are detected, the push will be blocked with instructions on how to proceed.

**Location:** `.git/hooks/pre-push`

## Next Steps (Optional)

1. **CI/CD Integration**: Run schema tests in build pipeline
2. **Migration System**: Create `src/utils/migrations.ts` for major version transitions
3. **JSON Schema Validation**: Add runtime validation of loaded data

## Questions?

- See detailed guide: `docs/development/breaking-changes-guide.md`
- See quick checklist: `docs/development/pre-commit-checklist.md`
- Run tests: `npm run test:schema`

---

**Last Updated:** 2025-11-12 (v1.17.0)

## Testing the Pre-Push Hook

Want to see it in action? Try pushing:

```bash
# Schema validation will run automatically
git push

# Output:
# 🔍 Running schema validation tests before push...
# ✅ Schema validation passed!
```

If you make a breaking change and try to push without bumping the major version:

```bash
# ❌ Schema validation FAILED!
# Breaking change detected in data structures.
#
# If this is intentional:
#   1. Bump MAJOR version in src/utils/version.ts (e.g., 1.17.0 → 2.0.0)
#   2. Update schema tests in src/utils/dataSchema.test.ts
#   3. Document the breaking change
```
