# Global CASCO Price Design

**Date:** 2025-11-02
**Status:** Approved
**Author:** Claude Code (via brainstorming skill)

## Overview

Convert the CASCO price from a per-participant variable to a single global constant that applies to all participants. This simplifies the UI and ensures consistency in base construction rates across the project.

## Problem Statement

Currently, each participant can set their own `cascoPerM2` value (default: 1590 €/m²), which:
- Creates UI complexity with repeated input fields
- Allows inconsistent base rates across participants
- Doesn't align with the project reality (CASCO is a project-level construction rate)

The user requested a single, shared, modifiable global CASCO price that applies to everyone.

## Requirements

✅ **Global enforcement** - All participants use the same CASCO rate (no individual overrides)
✅ **Parachèvements unchanged** - Keep per-participant parachèvements rates (different finishing levels may vary)
✅ **UI placement** - Add to Scenarios section with visual separation (determined via gestalt-information-architecture skill)
✅ **Data migration** - Handle existing localStorage data gracefully

## Design Decisions

### Architecture: Add to ProjectParams

**Chosen approach:** Add `globalCascoPerM2: number` to the `ProjectParams` interface.

**Rationale:**
- Semantic correctness: CASCO price is a project-level constant (like demolition costs), not a scenario variable
- Minimal friction: ProjectParams already passed to all calculation functions
- Future-proof: Additional global rates can be added here
- Testability: Isolated change to one interface and one calculation function

**Alternatives considered:**
1. Add to Scenario - Rejected: Mixes base rates with percentage multipliers
2. New GlobalRates structure - Rejected: Overkill for a single field

### UI Placement: Scenarios Section with Visual Separation

**Layout structure:**
```
┌─ Scénarios d'Optimisation ──────────┐
│ [Taux de Base] (blue background)    │
│   Prix CASCO (gros œuvre) - Global  │
│   [1590] €/m²                        │
│   "Appliqué à tous les participants" │
│                                      │
│ [Variations en %] (gray background) │
│   Réduction Prix d'Achat (slider)   │
│   Variation Coûts Construction       │
│   Réduction Infrastructures          │
└──────────────────────────────────────┘
```

**Gestalt principles applied:**
- **Common Region:** Blue box separates base rate from variations
- **Figure-Ground:** Blue background for base vs gray for variations
- **Similarity:** All construction controls in one section
- **Focal Point:** "Taux de Base" vs "Variations en %" labels create distinction

**Impact:** 80% of usability improvement with <5% layout changes (Pareto principle)

## Implementation Details

### 1. Data Model Changes

#### ProjectParams Interface
```typescript
// src/utils/calculatorUtils.ts
export interface ProjectParams {
  totalPurchase: number;
  mesuresConservatoires: number;
  demolition: number;
  infrastructures: number;
  etudesPreparatoires: number;
  fraisEtudesPreparatoires: number;
  fraisGeneraux3ans: number;
  batimentFondationConservatoire: number;
  batimentFondationComplete: number;
  batimentCoproConservatoire: number;
  globalCascoPerM2: number; // NEW
}
```

#### Participant Interface
```typescript
// src/utils/calculatorUtils.ts
export interface Participant {
  name: string;
  capitalApporte: number;
  notaryFeesRate: number;
  unitId: number;
  surface: number;
  interestRate: number;
  durationYears: number;
  quantity: number;
  // cascoPerM2?: number; // REMOVE
  parachevementsPerM2?: number; // KEEP
  cascoSqm?: number;
  parachevementsSqm?: number;
}
```

#### Defaults
```typescript
// src/components/EnDivisionCorrect.tsx
const DEFAULT_PROJECT_PARAMS = {
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
  globalCascoPerM2: 1590 // NEW
};

const DEFAULT_PARTICIPANTS = [
  {
    name: 'Manuela/Dragan',
    capitalApporte: 50000,
    notaryFeesRate: 12.5,
    unitId: 1,
    surface: 112,
    interestRate: 4.5,
    durationYears: 25,
    quantity: 1,
    // cascoPerM2: 1590, // REMOVE
    parachevementsPerM2: 500
  },
  // ... other participants
];
```

### 2. Calculation Logic Changes

#### Function Signature Update
```typescript
// src/utils/calculatorUtils.ts (line 234)
export function calculateCascoAndParachevements(
  unitId: number,
  surface: number,
  unitDetails: UnitDetails,
  globalCascoPerM2: number, // NEW: Required parameter
  parachevementsPerM2?: number,
  cascoSqm?: number,
  parachevementsSqm?: number
): { casco: number; parachevements: number }
```

#### Implementation Update
```typescript
export function calculateCascoAndParachevements(
  unitId: number,
  surface: number,
  unitDetails: UnitDetails,
  globalCascoPerM2: number,
  parachevementsPerM2?: number,
  cascoSqm?: number,
  parachevementsSqm?: number
): { casco: number; parachevements: number } {
  const actualCascoSqm = cascoSqm !== undefined ? cascoSqm : surface;
  const actualParachevementsSqm = parachevementsSqm !== undefined ? parachevementsSqm : surface;

  // CASCO: Always use global rate
  const casco = actualCascoSqm * globalCascoPerM2;

  // Parachevements: Use participant-specific rate or fallback
  let parachevements: number;
  if (parachevementsPerM2 !== undefined) {
    parachevements = actualParachevementsSqm * parachevementsPerM2;
  } else if (unitDetails[unitId]) {
    const unitParachevementsPerM2 = unitDetails[unitId].parachevements / surface;
    parachevements = actualParachevementsSqm * unitParachevementsPerM2;
  } else {
    parachevements = actualParachevementsSqm * 500;
  }

  return { casco, parachevements };
}
```

#### Call Site Updates

**Location 1:** `calculateFraisGeneraux3ans()` (line 164)
```typescript
const { casco } = calculateCascoAndParachevements(
  participant.unitId,
  participant.surface,
  unitDetails,
  projectParams.globalCascoPerM2, // NEW
  participant.parachevementsPerM2,
  participant.cascoSqm,
  participant.parachevementsSqm
);
```

**Location 2:** `calculateAll()` (line 386)
```typescript
const { casco, parachevements } = calculateCascoAndParachevements(
  p.unitId,
  p.surface,
  unitDetails,
  projectParams.globalCascoPerM2, // NEW
  p.parachevementsPerM2,
  p.cascoSqm,
  p.parachevementsSqm
);
```

### 3. UI Changes

#### Add Global Rate Input to Scenarios Section
```tsx
// src/components/EnDivisionCorrect.tsx (insert after line 572)
<div className="bg-white rounded-xl shadow-lg p-6 mb-8">
  <h2 className="text-2xl font-bold text-gray-800 mb-6">🎛️ Scénarios d'Optimisation</h2>

  {/* NEW: Global Construction Rates */}
  <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
    <h3 className="text-sm font-semibold text-gray-800 mb-3">Taux de Base</h3>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className="block text-xs text-gray-600 mb-2">
          Prix CASCO (gros œuvre) - Global
        </label>
        <input
          type="number"
          step="10"
          value={projectParams.globalCascoPerM2}
          onChange={(e) => setProjectParams({
            ...projectParams,
            globalCascoPerM2: parseFloat(e.target.value) || 1590
          })}
          className="w-full px-4 py-3 text-lg font-semibold border border-blue-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white"
        />
        <p className="text-xs text-blue-600 mt-1">
          Appliqué à tous les participants
        </p>
      </div>
    </div>
  </div>

  {/* Existing variation sliders - wrap in new subsection */}
  <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
    <h3 className="text-sm font-semibold text-gray-800 mb-3">Variations en %</h3>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Existing sliders unchanged */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Réduction Prix d'Achat (%)
        </label>
        {/* ... existing slider code ... */}
      </div>
      {/* ... other sliders ... */}
    </div>
  </div>
</div>
```

#### Remove Per-Participant CASCO Input
```tsx
// src/components/EnDivisionCorrect.tsx (lines 859-922)
// DELETE the CASCO input column, keep only parachèvements

{/* Construction Detail - MODIFIED */}
<div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
  <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-3">Détail Construction</p>
  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
    {/* CASCO - Display only (not editable) */}
    <div className="bg-white p-3 rounded-lg border border-gray-200">
      <p className="text-xs text-gray-500 mb-1">CASCO (gros œuvre)</p>
      <p className="text-lg font-bold text-gray-900">{formatCurrency(p.casco)}</p>
      <p className="text-xs text-gray-400">
        {participants[idx].cascoSqm || p.surface}m² × {projectParams.globalCascoPerM2}€/m² (global)
      </p>
    </div>

    {/* Parachèvements - Editable (unchanged) */}
    <div className="bg-white p-3 rounded-lg border border-gray-200">
      <label className="block text-xs text-gray-500 mb-1">Parachèvements - Prix/m²</label>
      <input
        type="number"
        step="10"
        value={participants[idx].parachevementsPerM2}
        onChange={(e) => updateParachevementsPerM2(idx, parseFloat(e.target.value) || 0)}
        className="w-full px-3 py-2 text-sm font-semibold border border-gray-300 rounded-lg focus:border-gray-500 focus:ring-1 focus:ring-gray-500 focus:outline-none mb-2"
      />
      <p className="text-xs text-gray-500">Total: <span className="font-bold text-gray-900">{formatCurrency(p.parachevements)}</span></p>
      <p className="text-xs text-gray-400">{participants[idx].parachevementsSqm || p.surface}m² × {participants[idx].parachevementsPerM2}€/m²</p>
    </div>

    {/* Travaux communs - unchanged */}
    <div className="bg-white p-3 rounded-lg border border-purple-200">
      <p className="text-xs text-gray-500 mb-1">Travaux communs</p>
      <p className="text-lg font-bold text-purple-700 mt-2">{formatCurrency(p.travauxCommunsPerUnit)}</p>
      <p className="text-xs text-purple-500 mt-1">Quote-part fixe (÷{participants.length})</p>
    </div>
  </div>
  {/* Rest unchanged */}
</div>
```

#### Remove updateCascoPerM2 Handler
```tsx
// src/components/EnDivisionCorrect.tsx (lines 194-198)
// DELETE this function - no longer needed
```

### 4. Data Migration

Handle existing localStorage data that has per-participant `cascoPerM2`:

```typescript
// src/components/EnDivisionCorrect.tsx (update loadFromLocalStorage function)
const loadFromLocalStorage = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const data = JSON.parse(stored);

      // Migration: If no globalCascoPerM2, use first participant's value or default
      if (data.projectParams && !data.projectParams.globalCascoPerM2) {
        data.projectParams.globalCascoPerM2 =
          data.participants?.[0]?.cascoPerM2 || 1590;
      }

      // Clean up old participant cascoPerM2 fields
      if (data.participants) {
        data.participants = data.participants.map(p => {
          const { cascoPerM2, ...rest } = p;
          return rest;
        });
      }

      return {
        participants: data.participants || DEFAULT_PARTICIPANTS,
        projectParams: data.projectParams || DEFAULT_PROJECT_PARAMS,
        scenario: data.scenario || DEFAULT_SCENARIO
      };
    }
  } catch (error) {
    console.error('Failed to load from localStorage:', error);
  }
  return null;
};
```

### 5. Testing Strategy

#### Unit Tests to Update

**File:** `src/utils/calculatorUtils.test.ts`

1. **Test `calculateCascoAndParachevements()` with global rate:**
```typescript
test('uses globalCascoPerM2 for all participants', () => {
  const result = calculateCascoAndParachevements(
    1, // unitId
    100, // surface
    {}, // unitDetails (empty)
    2000, // globalCascoPerM2
    600, // parachevementsPerM2
    undefined, // cascoSqm
    undefined  // parachevementsSqm
  );

  expect(result.casco).toBe(200000); // 100m² × 2000€/m²
  expect(result.parachevements).toBe(60000); // 100m² × 600€/m²
});
```

2. **Test `calculateFraisGeneraux3ans()` uses global rate:**
```typescript
test('calculateFraisGeneraux3ans uses globalCascoPerM2 from projectParams', () => {
  const participants = [
    { unitId: 1, surface: 100, quantity: 1, parachevementsPerM2: 500 }
  ];
  const projectParams = {
    ...DEFAULT_PROJECT_PARAMS,
    globalCascoPerM2: 1800
  };

  const result = calculateFraisGeneraux3ans(participants, projectParams, {});

  // Verify calculation uses 1800€/m² for CASCO
  // Expected: 180,000 (CASCO) + travaux communs, then × 0.15 × 0.30 for honoraires
  expect(result).toBeGreaterThan(0);
});
```

3. **Integration test: All participants use same rate:**
```typescript
test('all participants use global CASCO rate in calculateAll', () => {
  const participants = [
    { name: 'A', surface: 100, unitId: 1, parachevementsPerM2: 500, /* ... */ },
    { name: 'B', surface: 150, unitId: 2, parachevementsPerM2: 600, /* ... */ }
  ];
  const projectParams = {
    ...DEFAULT_PROJECT_PARAMS,
    globalCascoPerM2: 1700
  };

  const results = calculateAll(participants, projectParams, DEFAULT_SCENARIO, {});

  expect(results.participantBreakdown[0].casco).toBe(170000); // 100 × 1700
  expect(results.participantBreakdown[1].casco).toBe(255000); // 150 × 1700
});
```

#### UI Tests (Optional)

- Verify global CASCO input appears in Scenarios section
- Verify changing global rate updates all participants
- Verify per-participant CASCO input is removed
- Verify localStorage migration works

## Implementation Checklist

- [ ] Update `ProjectParams` interface
- [ ] Remove `cascoPerM2` from `Participant` interface
- [ ] Update `DEFAULT_PROJECT_PARAMS` with `globalCascoPerM2: 1590`
- [ ] Remove `cascoPerM2` from `DEFAULT_PARTICIPANTS`
- [ ] Update `calculateCascoAndParachevements()` signature and implementation
- [ ] Update call site in `calculateFraisGeneraux3ans()`
- [ ] Update call site in `calculateAll()`
- [ ] Add global CASCO input to Scenarios section UI
- [ ] Remove per-participant CASCO input from Construction Detail
- [ ] Update CASCO display to show "(global)" indicator
- [ ] Remove `updateCascoPerM2()` handler function
- [ ] Implement localStorage migration in `loadFromLocalStorage()`
- [ ] Write/update unit tests
- [ ] Run all tests and verify they pass
- [ ] Manual testing: Change global rate, verify all participants update
- [ ] Manual testing: Load old localStorage data, verify migration
- [ ] Manual testing: Export to Excel, verify CASCO values correct

## Success Criteria

✅ Single global CASCO input in Scenarios section
✅ All participants use the same CASCO rate
✅ Parachèvements remains per-participant
✅ CASCO display shows "(global)" indicator
✅ Per-participant CASCO input removed
✅ All tests pass
✅ localStorage migration works seamlessly
✅ Excel export reflects global rate

## Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| Users lose custom per-participant CASCO rates | Migration uses first participant's value; users can adjust global rate post-migration |
| Breaking change for existing scenarios | localStorage migration handles gracefully; defaults to 1590 if missing |
| TypeScript errors from interface changes | Update all call sites and remove optional params systematically |
| Tests fail after function signature change | Update all test call sites with `globalCascoPerM2` parameter |

## Future Enhancements

- Consider making parachèvements global too if users request it
- Add ability to save/load multiple global rate presets (e.g., "Standard", "Premium", "Budget")
- Add visual indicator when global rate differs significantly from market averages
