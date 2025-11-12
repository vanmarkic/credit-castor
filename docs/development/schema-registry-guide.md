# Schema Registry Guide

## Overview

The **Schema Registry** is a centralized system that documents and validates all data schemas across different export formats (JSON, Firestore, XLSX).

**Purpose:** Ensure all export formats stay in sync when core data structures change.

## Problem Solved

**Before Schema Registry:**
- ❌ No single source of truth for schemas
- ❌ JSON export, Firestore, and XLSX could drift apart
- ❌ No automatic validation that formats stayed in sync
- ❌ Manual checking required for each export format

**After Schema Registry:**
- ✅ Single source of truth in `schemaRegistry.ts`
- ✅ Automated validation via tests
- ✅ Clear documentation of which formats must stay in sync
- ✅ Automatic detection when formats drift

## Architecture

### Core Types (Source of Truth)

Defined in `src/utils/calculatorUtils.ts`:
- **`Participant`** - User/participant data
- **`ProjectParams`** - Project configuration
- **`PortageFormulaParams`** - Portage calculation parameters

### Export Formats

| Format | File | Loaded Back? | Must Match Core? |
|--------|------|--------------|------------------|
| **JSON** | `scenarioFileIO.ts` | ✅ Yes (file upload) | ✅ Yes (breaking) |
| **Firestore** | `firestoreSync.ts` | ✅ Yes (sync) | ✅ Yes (breaking) |
| **XLSX** | `excelExport.ts` | ❌ No (display only) | ❌ No (tracked) |

### Schema Registry Components

1. **`schemaRegistry.ts`** - Central schema definitions
   - `CORE_SCHEMAS` - Documents all fields for core types
   - `EXPORT_SCHEMAS` - Documents each export format
   - `SCHEMA_COMPATIBILITY` - Defines which formats must match

2. **`schemaRegistry.test.ts`** - Validation tests (22 tests)
   - Validates all export formats include required fields
   - Ensures JSON and Firestore stay in sync
   - Tracks XLSX changes (non-blocking)

## How to Use

### Check Schema Validity

```bash
# Run all schema validation (36 tests total)
npm run test:schema

# Includes:
# - dataSchema.test.ts (14 tests) - Breaking change detection
# - schemaRegistry.test.ts (22 tests) - Cross-format validation
```

### When Making Schema Changes

#### 1. Changing Core Types (Participant, ProjectParams, etc.)

```typescript
// BEFORE making changes, check current schema
// src/utils/schemaRegistry.ts

export const CORE_SCHEMAS = {
  Participant: {
    version: 1,
    requiredFields: [
      'name',
      'capitalApporte',
      'registrationFeesRate', // ← You want to rename this
      // ...
    ],
  },
};
```

**Steps:**
1. Update the core type in `calculatorUtils.ts`
2. Update `CORE_SCHEMAS` in `schemaRegistry.ts`
3. Run `npm run test:schema` - tests will fail
4. Update all affected export formats (JSON, Firestore)
5. Update tests to match new schema
6. Bump major version (`2.0.0`)

#### 2. Adding Optional Fields (Safe)

```typescript
// In calculatorUtils.ts
export interface Participant {
  name: string;
  capitalApporte: number;
  // ... existing fields
  newOptionalField?: string; // ← New optional field
}

// In schemaRegistry.ts
export const CORE_SCHEMAS = {
  Participant: {
    version: 1, // ← Same version (backward compatible)
    requiredFields: [/* unchanged */],
    optionalFields: [
      // ... existing optional fields
      'newOptionalField', // ← Add here
    ],
  },
};
```

**Steps:**
1. Add optional field to core type
2. Add to `optionalFields` in `schemaRegistry.ts`
3. Run `npm run test:schema` - should pass
4. Bump minor version (`1.18.0`)

#### 3. Changing Export Format Only

If you only change how data is exported (e.g., XLSX column order):

```bash
# Check if it affects core types
npm run test:schema

# If tests pass → Safe (no breaking changes)
# If tests fail → Must update schema registry
```

### Query Schema Information

```typescript
import {
  getAllFields,
  isRequiredField,
  validateSchema,
  getBreakingChangeFormats,
} from './schemaRegistry';

// Get all fields for a schema
const participantFields = getAllFields('Participant');
// ['name', 'capitalApporte', 'registrationFeesRate', ...]

// Check if a field is required
const isRequired = isRequiredField('Participant', 'name');
// true

// Validate an object matches a schema
const result = validateSchema('Participant', someObject);
if (!result.valid) {
  console.error('Missing fields:', result.missingFields);
}

// Get formats that require major version bump if changed
const breakingFormats = getBreakingChangeFormats();
// ['JSON', 'Firestore']
```

## Validation Tests

### dataSchema.test.ts (14 tests)
**Purpose:** Detect breaking changes in stored data structures

Tests:
- Required field names and types
- Backward compatibility
- Version bump reminders

**When it fails:** You made a breaking change to a stored interface

### schemaRegistry.test.ts (22 tests)
**Purpose:** Ensure all export formats stay in sync

Tests:
- Core schema definitions are consistent
- Export formats include all required fields
- JSON and Firestore match core types
- XLSX changes are tracked

**When it fails:** Export formats drifted out of sync

## Common Scenarios

### Scenario 1: Rename a Core Field

**Example:** Rename `notaryFeesRate` → `registrationFeesRate`

```typescript
// 1. Update calculatorUtils.ts
export interface Participant {
  registrationFeesRate: number; // ← Renamed
}

// 2. Update schemaRegistry.ts
export const CORE_SCHEMAS = {
  Participant: {
    version: 2, // ← Increment version
    requiredFields: [
      'registrationFeesRate', // ← Update here
    ],
  },
};

// 3. Update scenarioFileIO.ts (JSON export)
// Ensure it saves/loads using new name

// 4. Update firestoreSync.ts (Firestore export)
// Ensure it syncs using new name

// 5. Run tests
npm run test:schema
// Will fail until all formats updated

// 6. Bump major version
// version.ts: RELEASE_VERSION = '2.0.0'
```

### Scenario 2: Add Optional Field

**Example:** Add `email?: string` to Participant

```typescript
// 1. Update calculatorUtils.ts
export interface Participant {
  email?: string; // ← New optional field
}

// 2. Update schemaRegistry.ts
export const CORE_SCHEMAS = {
  Participant: {
    version: 1, // ← Same version (backward compatible)
    optionalFields: [
      'email', // ← Add here
    ],
  },
};

// 3. Run tests
npm run test:schema
// Should pass (backward compatible)

// 4. Bump minor version
// version.ts: RELEASE_VERSION = '1.18.0'
```

### Scenario 3: Change XLSX Export Only

**Example:** Add a new column to XLSX export

```typescript
// 1. Update excelExport.ts
// Add new column to buildExportSheetData()

// 2. Run tests
npm run test:schema
// Should pass (XLSX not breaking)

// 3. Update XLSX snapshot test if needed
npm run test:run -- src/utils/excelExport.test.ts

// 4. Bump minor version (new feature)
// version.ts: RELEASE_VERSION = '1.18.0'
```

## Pre-Push Hook Integration

The schema registry tests are automatically run by the pre-push hook:

```bash
git push
# 🔍 Running schema validation tests before push...
# ✓ src/utils/dataSchema.test.ts (14 tests)
# ✓ src/utils/schemaRegistry.test.ts (22 tests)
# ✅ Schema validation passed!
```

If tests fail, the push is blocked with instructions.

## Best Practices

1. **Always update schema registry when changing core types**
   - Update `CORE_SCHEMAS` in `schemaRegistry.ts`
   - Run `npm run test:schema` to validate

2. **Document optional vs required fields**
   - Use `requiredFields` array for mandatory fields
   - Use `optionalFields` array for optional fields

3. **Track XLSX changes even though not breaking**
   - Update snapshot tests in `excelExport.test.ts`
   - Document in schema registry comments

4. **Use validation helpers in production code**
   ```typescript
   import { validateSchema } from './schemaRegistry';

   const result = validateSchema('Participant', data);
   if (!result.valid) {
     // Handle validation error
   }
   ```

5. **Increment schema version for breaking changes**
   - `CORE_SCHEMA_VERSION` in `schemaRegistry.ts`
   - Triggers test reminder to bump major version

## Troubleshooting

### Tests Fail: "Missing required fields"

**Cause:** Export format is missing a field that's in the core schema

**Solution:**
1. Check which format failed (JSON/Firestore)
2. Add the missing field to that format
3. Re-run tests

### Tests Fail: "Field not in required list"

**Cause:** Core type has a new required field not documented in schema registry

**Solution:**
1. Update `requiredFields` in `schemaRegistry.ts`
2. Update all breaking change formats (JSON, Firestore)
3. Bump major version

### Pre-Push Blocked by Schema Tests

**Solution:**
```bash
# Check what failed
npm run test:schema

# If intentional breaking change:
# 1. Update schema registry
# 2. Bump major version to 2.0.0
# 3. Update failing tests

# If unintentional:
# Fix the export format to match core schema
```

## Related Documentation

- [Breaking Changes Guide](./breaking-changes-guide.md) - When to bump major version
- [Data Schema Tests](../../src/utils/dataSchema.test.ts) - Breaking change detection
- [Pre-Commit Checklist](./pre-commit-checklist.md) - Before committing changes

---

**Last Updated:** 2025-11-12 (v1.17.0)
