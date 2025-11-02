# Scenario Backward Compatibility Design

**Date:** 2025-11-02
**Status:** Approved
**Author:** Claude Code (via brainstorming skill)

## Overview

Add migration support to make scenario files from v1.0.2 compatible with v1.0.3, ensuring users can load old scenario JSON files without errors after the global CASCO price feature was introduced.

## Problem Statement

Version 1.0.3 introduced a breaking change to the data model:
- **v1.0.2:** CASCO price was per-participant (`participant.cascoPerM2`)
- **v1.0.3:** CASCO price is now global (`projectParams.globalCascoPerM2`)

**Current state:**
- ✅ localStorage migration EXISTS (lines 59-71 in EnDivisionCorrect.tsx)
- ❌ File upload migration MISSING (FileReader.onload handler)

**Impact:** Users who downloaded scenario JSON files in v1.0.2 cannot load them in v1.0.3 because:
1. `projectParams.globalCascoPerM2` is undefined → calculation errors
2. Old `participant.cascoPerM2` fields are ignored → data loss

## Requirements

✅ **File upload support** - Old scenario files (v1.0.2) load successfully in v1.0.3
✅ **localStorage support** - Maintain existing localStorage migration (already works)
✅ **No breaking changes** - New files (v1.0.3) continue to work
✅ **Data cleanliness** - Remove obsolete `cascoPerM2` fields from participants
✅ **Graceful fallbacks** - Handle missing data with sensible defaults

## Design Decision: Shared Migration Function

**Chosen approach:** Extract existing localStorage migration logic into a reusable function.

**Rationale:**
- DRY principle: Single source of truth for migration logic
- Consistency: Same behavior for localStorage and file uploads
- Maintainability: One place to update if migration logic changes
- Testability: Pure function, easy to unit test
- Proven: Logic already works in localStorage path

**Alternatives considered:**
1. **Versioned migration system** - Rejected: Overkill for single migration, adds unnecessary complexity
2. **Defensive loading with fallbacks** - Rejected: Leaves technical debt (polluted data model, old fields persist)

## Architecture

### Migration Function

**Location:** `src/components/EnDivisionCorrect.tsx` (around line 53, before `loadFromLocalStorage`)

**Signature:**
```typescript
const migrateScenarioData = (data: any): {
  participants: Participant[];
  projectParams: ProjectParams;
  scenario: Scenario;
}
```

**Implementation:**
```typescript
const migrateScenarioData = (data: any): {
  participants: Participant[];
  projectParams: ProjectParams;
  scenario: Scenario;
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

**Key features:**
- Immutable: Doesn't mutate input data
- Default fallbacks: Returns defaults if data is missing
- Clean output: Removes obsolete fields

### Data Flow

```
┌─────────────────┐
│ v1.0.2 JSON     │
│ {               │
│   participants: │
│     cascoPerM2  │ ───┐
│   projectParams │    │
│ }               │    │
└─────────────────┘    │
                       ├──→ migrateScenarioData() ──→ ┌─────────────────┐
┌─────────────────┐    │                               │ v1.0.3 format   │
│ v1.0.3 JSON     │    │                               │ {               │
│ {               │    │                               │   projectParams:│
│   projectParams:│ ───┘                               │     globalCasco │
│     globalCasco │                                    │   participants: │
│ }               │                                    │     (no casco)  │
└─────────────────┘                                    │ }               │
                                                       └─────────────────┘
```

### Integration Points

**1. localStorage Path** (update `loadFromLocalStorage` function, lines 53-83):
```typescript
const loadFromLocalStorage = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const data = JSON.parse(stored);
      return migrateScenarioData(data); // ← Use shared function
    }
  } catch (error) {
    console.error('Failed to load from localStorage:', error);
  }
  return null;
};
```

**Changes:** Replace inline migration logic with function call (lines 59-77 can be deleted).

**2. File Upload Path** (update FileReader.onload handler):

**Current location:** Find the `reader.onload = (e) => {` handler in the component.

**Updated implementation:**
```typescript
reader.onload = (e) => {
  try {
    const content = e.target?.result as string;
    const data = JSON.parse(content);

    // Validate basic structure
    if (!data.participants || !data.projectParams || !data.scenario) {
      alert('Fichier invalide: structure de données manquante');
      return;
    }

    // NEW: Migrate and destructure
    const migrated = migrateScenarioData(data);

    setParticipants(migrated.participants);
    setProjectParams(migrated.projectParams);
    setScenario(migrated.scenario);

    alert('Scénario chargé avec succès!');
  } catch (error) {
    console.error('Error loading scenario:', error);
    alert('Erreur lors du chargement du fichier. Vérifiez que le fichier est valide.');
  }
};
```

**Changes:** Add `migrateScenarioData()` call before setting state.

## Error Handling

### Migration Edge Cases

| Scenario | Behavior |
|----------|----------|
| Missing `globalCascoPerM2` | Use first participant's `cascoPerM2`, fallback to 1590 |
| No participants with `cascoPerM2` | Default to 1590 |
| Empty participants array | Use `DEFAULT_PARTICIPANTS` |
| Missing `projectParams` | Use `DEFAULT_PROJECT_PARAMS` |
| Missing `scenario` | Use `DEFAULT_SCENARIO` |
| Invalid JSON | Caught by try/catch, show error alert |
| v1.0.3 file (already migrated) | No-op, returns data unchanged |

### Validation Strategy

**Before migration:** Validate top-level structure exists
```typescript
if (!data.participants || !data.projectParams || !data.scenario) {
  alert('Fichier invalide: structure de données manquante');
  return;
}
```

**During migration:** Apply fallbacks for missing fields

**After migration:** State receives valid, complete data

## Testing Strategy

### Unit Tests

**Create new test file:** `src/utils/scenarioMigration.test.ts` (or add to existing test file)

```typescript
import { describe, test, expect } from 'vitest';

describe('migrateScenarioData', () => {
  test('migrates v1.0.2 format to v1.0.3', () => {
    const oldData = {
      participants: [
        { name: 'A', cascoPerM2: 1700, parachevementsPerM2: 500, surface: 100, unitId: 1 },
        { name: 'B', cascoPerM2: 1700, parachevementsPerM2: 600, surface: 150, unitId: 2 }
      ],
      projectParams: {
        totalPurchase: 650000,
        mesuresConservatoires: 20000
        // No globalCascoPerM2
      },
      scenario: { constructionCostChange: 0, infrastructureReduction: 0, purchasePriceReduction: 0 }
    };

    const result = migrateScenarioData(oldData);

    expect(result.projectParams.globalCascoPerM2).toBe(1700); // From first participant
    expect(result.participants[0]).not.toHaveProperty('cascoPerM2');
    expect(result.participants[1]).not.toHaveProperty('cascoPerM2');
    expect(result.participants[0].parachevementsPerM2).toBe(500); // Preserved
  });

  test('handles v1.0.3 format as no-op', () => {
    const newData = {
      participants: [
        { name: 'A', parachevementsPerM2: 500, surface: 100, unitId: 1 }
      ],
      projectParams: {
        totalPurchase: 650000,
        globalCascoPerM2: 1590
      },
      scenario: { constructionCostChange: 0, infrastructureReduction: 0, purchasePriceReduction: 0 }
    };

    const result = migrateScenarioData(newData);

    expect(result.projectParams.globalCascoPerM2).toBe(1590);
    expect(result.participants[0]).not.toHaveProperty('cascoPerM2');
  });

  test('uses default 1590 when no cascoPerM2 exists', () => {
    const oldData = {
      participants: [{ name: 'A', parachevementsPerM2: 500, surface: 100, unitId: 1 }],
      projectParams: { totalPurchase: 650000 },
      scenario: { constructionCostChange: 0 }
    };

    const result = migrateScenarioData(oldData);

    expect(result.projectParams.globalCascoPerM2).toBe(1590);
  });

  test('handles empty participants array', () => {
    const oldData = {
      participants: [],
      projectParams: {},
      scenario: {}
    };

    const result = migrateScenarioData(oldData);

    expect(result.participants).toEqual(DEFAULT_PARTICIPANTS);
    expect(result.projectParams.globalCascoPerM2).toBe(1590);
  });

  test('preserves parachevementsPerM2 and other participant fields', () => {
    const oldData = {
      participants: [
        {
          name: 'Test',
          cascoPerM2: 1800,
          parachevementsPerM2: 650,
          surface: 120,
          unitId: 3,
          capitalApporte: 100000
        }
      ],
      projectParams: { totalPurchase: 650000 },
      scenario: { constructionCostChange: 10 }
    };

    const result = migrateScenarioData(oldData);

    expect(result.participants[0].parachevementsPerM2).toBe(650);
    expect(result.participants[0].surface).toBe(120);
    expect(result.participants[0].unitId).toBe(3);
    expect(result.participants[0].capitalApporte).toBe(100000);
    expect(result.participants[0]).not.toHaveProperty('cascoPerM2');
  });
});
```

### Manual Testing Checklist

- [ ] Load v1.0.2 file with `cascoPerM2` → Calculations use `globalCascoPerM2`
- [ ] Load v1.0.3 file (already migrated) → No changes, works correctly
- [ ] Download scenario from v1.0.3 → Contains `globalCascoPerM2`, no `cascoPerM2`
- [ ] Load old file, refresh page → localStorage persists migrated format
- [ ] Load old file with different `cascoPerM2` per participant → Uses first participant's value
- [ ] Load file with missing `projectParams` → Uses defaults
- [ ] Load corrupted JSON → Shows error alert, doesn't crash
- [ ] Export to Excel after loading old file → Uses correct `globalCascoPerM2`

## Implementation Checklist

- [ ] Create `migrateScenarioData()` function
- [ ] Refactor `loadFromLocalStorage()` to use migration function
- [ ] Update FileReader.onload handler to use migration function
- [ ] Write unit tests for migration function
- [ ] Run `npm run test:run` to verify no regressions
- [ ] Create v1.0.2 test file with `cascoPerM2` fields
- [ ] Manual test: Load v1.0.2 file
- [ ] Manual test: Load v1.0.3 file
- [ ] Manual test: Verify calculations after migration
- [ ] Manual test: Export to Excel after loading old file

## Success Criteria

✅ v1.0.2 scenario files load successfully in v1.0.3
✅ v1.0.3 scenario files continue to work (no regression)
✅ localStorage migration continues to work
✅ Old `cascoPerM2` fields are removed after migration
✅ Calculations use correct `globalCascoPerM2` value
✅ All tests pass
✅ No console errors when loading old files
✅ Excel export uses migrated `globalCascoPerM2`

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Users with multiple different `cascoPerM2` per participant lose custom rates | Medium | Migration uses first participant's value; users can manually adjust `globalCascoPerM2` after loading |
| Invalid JSON crashes app | Low | Try/catch with error alert prevents crash |
| Missing fields cause calculation errors | Low | Fallbacks to DEFAULT values ensure complete data |
| localStorage migration breaks | Low | Reusing existing logic minimizes risk; unit tests verify behavior |

## Future Considerations

- If more breaking changes occur, consider implementing versioned migration system (Approach 2 from exploration phase)
- Add visual indicator when old file is loaded and migrated (e.g., "File migrated from v1.0.2")
- Consider adding version number to downloaded JSON files for better tracking
- Document migration in user-facing changelog/release notes
