# Breaking Changes - Quick Reference Card

## 🛡️ Automatic Protection Active

**Pre-push hook installed:** Every push automatically validates schemas!

## 🚀 Quick Commands

```bash
# Check for breaking changes (runs 36 tests)
npm run test:schema
# - dataSchema.test.ts: 14 tests (field name/type validation)
# - schemaRegistry.test.ts: 22 tests (cross-format validation)

# View hook status
ls -l .git/hooks/pre-push

# Test hook without pushing
.git/hooks/pre-push
```

## ✅ Safe Changes (Minor/Patch Version)

```typescript
// Add optional field
interface Participant {
  email?: string; // ✅ Safe
}

// Add new optional nested object
interface Participant {
  preferences?: {
    language: string;
  }; // ✅ Safe
}

// Deprecate field (keep it)
interface Participant {
  /** @deprecated Use newField */
  oldField?: string; // ✅ Safe
  newField?: string;
}
```

## ❌ Breaking Changes (Major Version)

```typescript
// Rename field
interface Participant {
  // notaryFeesRate → registrationFeesRate
  registrationFeesRate: number; // ❌ Breaking
}

// Remove field
interface Participant {
  // Removed: oldField
  // ❌ Breaking
}

// Change type
interface Participant {
  date: Date; // Was: string
  // ❌ Breaking
}

// Make optional field required
interface Participant {
  email: string; // Was: email?: string
  // ❌ Breaking
}
```

## 🔄 Workflow for Breaking Changes

### If Schema Tests Fail:

1. **Bump major version**
   ```typescript
   // src/utils/version.ts
   export const RELEASE_VERSION = '2.0.0'; // Was 1.x.x
   ```

2. **Update schema tests**
   ```typescript
   // src/utils/dataSchema.test.ts
   const currentMajorVersion = 2; // Was 1
   const needsMajorVersionBump = false; // Reset
   ```

3. **Update field names in tests**
   ```typescript
   const requiredFields = [
     'name',
     'capitalApporte',
     'registrationFeesRate', // ← Updated
     'interestRate',
     'durationYears',
   ];
   ```

4. **Document the change**
   ```typescript
   /**
    * Version history:
    * - 2.0.0: BREAKING - Renamed notaryFeesRate → registrationFeesRate
    * ...
    */
   ```

## 📋 Critical Interfaces

| Interface | Where Stored | Breaking If Changed |
|-----------|--------------|---------------------|
| `Participant` | localStorage, JSON, Firestore | ✓ |
| `ProjectParams` | localStorage, JSON, Firestore | ✓ |
| `PortageFormulaParams` | localStorage, JSON, Firestore | ✓ |
| `ScenarioData` | JSON exports (imported back) | ✓ |
| `FirestoreScenarioData` | Firestore | ✓ |
| `ParticipantCalculation` | Not stored (calculated) | ✗ |
| XLSX export structure | One-way export (never imported) | ✗* |

**Note:** XLSX changes aren't "breaking" for the app, but snapshot tests exist to catch structure changes that might affect users with external tools.

## 🎯 Decision Tree

```
Making changes to data structures?
│
├─ Participant/ProjectParams/PortageFormulaParams?
│  │
│  ├─ YES → Run npm run test:schema
│  │  │
│  │  ├─ Tests PASS → Safe (minor/patch)
│  │  └─ Tests FAIL → Breaking (major v2.0.0)
│  │
│  └─ NO → Check if it's stored data
│     │
│     ├─ Stored (localStorage/JSON/Firestore)? → Breaking
│     └─ Calculated only? → Safe
│
└─ Not data structures? → Regular commit
```

## 🚨 Emergency: Push Blocked?

**If pre-push hook blocks your push:**

```bash
# 1. Check what failed
npm run test:schema

# 2. If intentional breaking change:
#    - Bump to v2.0.0 in src/utils/version.ts
#    - Update schema tests
#    - Document the change

# 3. If false positive (rare):
git push --no-verify  # ⚠️ Use with caution!
```

## 📚 Full Documentation

- **Comprehensive Guide:** [breaking-changes-guide.md](./breaking-changes-guide.md)
- **Schema Registry:** [schema-registry-guide.md](./schema-registry-guide.md) ⭐ NEW
- **Pre-Commit Checklist:** [pre-commit-checklist.md](./pre-commit-checklist.md)
- **System Summary:** [breaking-changes-summary.md](./breaking-changes-summary.md)
- **Hook Setup:** [git-hooks-setup.md](./git-hooks-setup.md)

## 📞 Quick Help

**Question:** "Is my change breaking?"
**Answer:** Run `npm run test:schema` - if it fails, it's breaking

**Question:** "Can I rename a field?"
**Answer:** Only with major version bump (v2.0.0) and migration

**Question:** "Can I add a field?"
**Answer:** Yes, if optional. No, if required (without migration).

**Question:** "Hook blocking my push?"
**Answer:** Either fix breaking change + bump v2.0.0, or bypass with `--no-verify`

---

**Print this page and keep it handy!** 📄

Last Updated: 2025-11-12 (v1.17.0)
