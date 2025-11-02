# Global CASCO Price Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Convert CASCO pricing from per-participant to a single global constant that applies to all participants.

**Architecture:** Add `globalCascoPerM2` to ProjectParams interface, update calculation logic to use it instead of per-participant values, modify UI to show global input in Scenarios section with visual separation, implement localStorage migration.

**Tech Stack:** TypeScript, React, Vitest, React Testing Library, Astro

---

## Task 1: Update TypeScript Interfaces and Defaults

**Files:**
- Modify: `src/utils/calculatorUtils.ts:21-45`
- Modify: `src/components/EnDivisionCorrect.tsx:8-26`

**Step 1: Write failing test for ProjectParams with globalCascoPerM2**

Create or modify: `src/utils/calculatorUtils.test.ts`

Add test at the end of the file:

```typescript
describe('Global CASCO Price', () => {
  test('ProjectParams includes globalCascoPerM2', () => {
    const projectParams: ProjectParams = {
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
    };

    expect(projectParams.globalCascoPerM2).toBe(1590);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm run test:run -- calculatorUtils.test.ts`
Expected: FAIL with TypeScript error "Property 'globalCascoPerM2' does not exist on type 'ProjectParams'"

**Step 3: Add globalCascoPerM2 to ProjectParams interface**

Modify `src/utils/calculatorUtils.ts:21-32`:

```typescript
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
  globalCascoPerM2: number;
}
```

**Step 4: Remove cascoPerM2 from Participant interface**

Modify `src/utils/calculatorUtils.ts:6-19`:

```typescript
export interface Participant {
  name: string;
  capitalApporte: number;
  notaryFeesRate: number;
  unitId: number;
  surface: number;
  interestRate: number;
  durationYears: number;
  quantity: number;
  // cascoPerM2?: number; // REMOVED
  parachevementsPerM2?: number;
  cascoSqm?: number;
  parachevementsSqm?: number;
}
```

**Step 5: Update DEFAULT_PROJECT_PARAMS**

Modify `src/components/EnDivisionCorrect.tsx:15-26`:

```typescript
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
  globalCascoPerM2: 1590
};
```

**Step 6: Remove cascoPerM2 from DEFAULT_PARTICIPANTS**

Modify `src/components/EnDivisionCorrect.tsx:8-13`:

```typescript
const DEFAULT_PARTICIPANTS = [
  { name: 'Manuela/Dragan', capitalApporte: 50000, notaryFeesRate: 12.5, unitId: 1, surface: 112, interestRate: 4.5, durationYears: 25, quantity: 1, parachevementsPerM2: 500 },
  { name: 'Cathy/Jim', capitalApporte: 170000, notaryFeesRate: 12.5, unitId: 3, surface: 134, interestRate: 4.5, durationYears: 25, quantity: 1, parachevementsPerM2: 500 },
  { name: 'Annabelle/Colin', capitalApporte: 200000, notaryFeesRate: 12.5, unitId: 5, surface: 118, interestRate: 4.5, durationYears: 25, quantity: 1, parachevementsPerM2: 500 },
  { name: 'Julie/Séverin', capitalApporte: 70000, notaryFeesRate: 12.5, unitId: 6, surface: 108, interestRate: 4.5, durationYears: 25, quantity: 1, parachevementsPerM2: 500 }
];
```

**Step 7: Run test to verify it passes**

Run: `npm run test:run -- calculatorUtils.test.ts`
Expected: PASS

**Step 8: Commit**

```bash
git add src/utils/calculatorUtils.ts src/components/EnDivisionCorrect.tsx
git commit -m "refactor: add globalCascoPerM2 to ProjectParams and remove from Participant

- Add globalCascoPerM2 field to ProjectParams interface
- Remove cascoPerM2 from Participant interface
- Update DEFAULT_PROJECT_PARAMS with globalCascoPerM2: 1590
- Remove cascoPerM2 from DEFAULT_PARTICIPANTS"
```

---

## Task 2: Update calculateCascoAndParachevements Function

**Files:**
- Modify: `src/utils/calculatorUtils.ts:234-272`
- Test: `src/utils/calculatorUtils.test.ts`

**Step 1: Write failing test for updated function signature**

Add to `src/utils/calculatorUtils.test.ts` in the 'Global CASCO Price' describe block:

```typescript
test('calculateCascoAndParachevements uses globalCascoPerM2', () => {
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

test('calculateCascoAndParachevements respects custom cascoSqm', () => {
  const result = calculateCascoAndParachevements(
    1,
    100, // total surface
    {},
    2000, // globalCascoPerM2
    600,
    50, // only renovate 50m² with CASCO
    undefined
  );

  expect(result.casco).toBe(100000); // 50m² × 2000€/m²
  expect(result.parachevements).toBe(60000); // 100m² × 600€/m²
});
```

**Step 2: Run test to verify it fails**

Run: `npm run test:run -- calculatorUtils.test.ts`
Expected: FAIL with "Expected 4-6 arguments, but got 7" or similar

**Step 3: Update function signature**

Modify `src/utils/calculatorUtils.ts:234-242`:

```typescript
/**
 * Calculate CASCO and parachevements for a unit
 */
export function calculateCascoAndParachevements(
  unitId: number,
  surface: number,
  unitDetails: UnitDetails,
  globalCascoPerM2: number,
  parachevementsPerM2?: number,
  cascoSqm?: number,
  parachevementsSqm?: number
): { casco: number; parachevements: number } {
```

**Step 4: Update function implementation**

Modify `src/utils/calculatorUtils.ts:243-272`:

```typescript
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

**Step 5: Run test to verify it passes**

Run: `npm run test:run -- calculatorUtils.test.ts`
Expected: PASS (new tests pass, but existing tests will fail - we'll fix in next task)

**Step 6: Commit**

```bash
git add src/utils/calculatorUtils.ts
git commit -m "refactor: update calculateCascoAndParachevements to use globalCascoPerM2

- Add globalCascoPerM2 as required parameter
- Remove cascoPerM2 optional parameter
- CASCO always uses global rate
- Parachevements remains per-participant"
```

---

## Task 3: Update Function Call Sites

**Files:**
- Modify: `src/utils/calculatorUtils.ts:164-173` (calculateFraisGeneraux3ans)
- Modify: `src/utils/calculatorUtils.ts:386-395` (calculateAll)
- Test: `src/utils/calculatorUtils.test.ts`

**Step 1: Update call site in calculateFraisGeneraux3ans**

Modify `src/utils/calculatorUtils.ts:164-173`:

```typescript
  for (const participant of participants) {
    const { casco } = calculateCascoAndParachevements(
      participant.unitId,
      participant.surface,
      unitDetails,
      projectParams.globalCascoPerM2,
      participant.parachevementsPerM2,
      participant.cascoSqm,
      participant.parachevementsSqm
    );
    totalCasco += casco * participant.quantity;
  }
```

**Step 2: Update call site in calculateAll**

Modify `src/utils/calculatorUtils.ts:386-395`:

```typescript
  const participantBreakdown: ParticipantCalculation[] = participants.map(p => {
    const { casco, parachevements } = calculateCascoAndParachevements(
      p.unitId,
      p.surface,
      unitDetails,
      projectParams.globalCascoPerM2,
      p.parachevementsPerM2,
      p.cascoSqm,
      p.parachevementsSqm
    );
```

**Step 3: Run all tests**

Run: `npm run test:run`
Expected: PASS (all calculator tests should now pass)

**Step 4: Commit**

```bash
git add src/utils/calculatorUtils.ts
git commit -m "refactor: update call sites to pass globalCascoPerM2

- Update calculateFraisGeneraux3ans to use projectParams.globalCascoPerM2
- Update calculateAll to use projectParams.globalCascoPerM2
- All calculation tests now passing"
```

---

## Task 4: Add Global CASCO Input to UI

**Files:**
- Modify: `src/components/EnDivisionCorrect.tsx:571-631`

**Step 1: Add global CASCO input section**

Modify `src/components/EnDivisionCorrect.tsx` - find the Scenarios section (around line 571) and replace with:

```tsx
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

          {/* Existing variation sliders - wrapped in subsection */}
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <h3 className="text-sm font-semibold text-gray-800 mb-3">Variations en %</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Réduction Prix d'Achat (%)
                </label>
                <input
                  type="range"
                  min="0"
                  max="20"
                  value={scenario.purchasePriceReduction}
                  onChange={(e) => setScenario({...scenario, purchasePriceReduction: parseFloat(e.target.value)})}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-gray-600 mt-1">
                  <span>0%</span>
                  <span className="font-bold">{scenario.purchasePriceReduction}%</span>
                  <span>20%</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Variation Coûts Construction (%)
                </label>
                <input
                  type="range"
                  min="-30"
                  max="30"
                  value={scenario.constructionCostChange}
                  onChange={(e) => setScenario({...scenario, constructionCostChange: parseFloat(e.target.value)})}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-gray-600 mt-1">
                  <span>-30%</span>
                  <span className="font-bold">{scenario.constructionCostChange}%</span>
                  <span>+30%</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Réduction Infrastructures (%)
                </label>
                <input
                  type="range"
                  min="0"
                  max="50"
                  value={scenario.infrastructureReduction}
                  onChange={(e) => setScenario({...scenario, infrastructureReduction: parseFloat(e.target.value)})}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-gray-600 mt-1">
                  <span>0%</span>
                  <span className="font-bold">{scenario.infrastructureReduction}%</span>
                  <span>50%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
```

**Step 2: Test in browser**

Run: `npm run dev`
Navigate to: http://localhost:4321
Expected: Global CASCO input visible in blue box above scenario sliders

**Step 3: Commit**

```bash
git add src/components/EnDivisionCorrect.tsx
git commit -m "feat: add global CASCO price input to Scenarios section

- Create 'Taux de Base' subsection with blue background
- Add global CASCO per m² input field
- Wrap scenario sliders in 'Variations en %' subsection
- Visual separation using Gestalt principles"
```

---

## Task 5: Remove Per-Participant CASCO Input and Update Display

**Files:**
- Modify: `src/components/EnDivisionCorrect.tsx:194-198` (remove handler)
- Modify: `src/components/EnDivisionCorrect.tsx:859-922` (update Construction Detail section)

**Step 1: Remove updateCascoPerM2 handler function**

Find and delete `src/components/EnDivisionCorrect.tsx:194-198`:

```typescript
  const updateCascoPerM2 = (index, value) => {
    const newParticipants = [...participants];
    newParticipants[index].cascoPerM2 = value;
    setParticipants(newParticipants);
  };
```

**Step 2: Update Construction Detail section to remove editable CASCO input**

Modify `src/components/EnDivisionCorrect.tsx` - find the "Détail Construction" section (around line 859) and replace the grid with:

```tsx
                {/* Construction Detail */}
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

                    {/* Parachèvements - Editable */}
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                      <label className="block text-xs text-blue-700 font-medium mb-1">Surface à rénover CASCO (m²)</label>
                      <input
                        type="number"
                        step="1"
                        min="0"
                        max={p.surface}
                        value={participants[idx].cascoSqm || p.surface}
                        onChange={(e) => updateCascoSqm(idx, parseFloat(e.target.value) || undefined)}
                        className="w-full px-3 py-2 text-sm font-semibold border border-blue-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                        placeholder={`${p.surface}m² (total)`}
                      />
                      <p className="text-xs text-blue-600 mt-1">Surface totale: {p.surface}m²</p>
                    </div>
                    <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                      <label className="block text-xs text-blue-700 font-medium mb-1">Surface à rénover Parachèvements (m²)</label>
                      <input
                        type="number"
                        step="1"
                        min="0"
                        max={p.surface}
                        value={participants[idx].parachevementsSqm || p.surface}
                        onChange={(e) => updateParachevementsSqm(idx, parseFloat(e.target.value) || undefined)}
                        className="w-full px-3 py-2 text-sm font-semibold border border-blue-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                        placeholder={`${p.surface}m² (total)`}
                      />
                      <p className="text-xs text-blue-600 mt-1">Surface totale: {p.surface}m²</p>
                    </div>
                  </div>
                </div>
```

**Step 3: Update addParticipant to not include cascoPerM2**

Find `addParticipant` function (around line 87) and modify:

```typescript
  const addParticipant = () => {
    const newId = Math.max(...participants.map(p => p.unitId), 0) + 1;
    setParticipants([...participants, {
      name: 'Participant ' + (participants.length + 1),
      capitalApporte: 100000,
      notaryFeesRate: 12.5,
      unitId: newId,
      surface: 100,
      interestRate: 4.5,
      durationYears: 25,
      quantity: 1,
      parachevementsPerM2: 500
    }]);

    setTimeout(() => {
      const newIndex = participants.length;
      if (participantRefs.current[newIndex]) {
        participantRefs.current[newIndex].scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 50);
  };
```

**Step 4: Test in browser**

Run: `npm run dev`
Navigate to: http://localhost:4321
Expected:
- CASCO shows as read-only with "(global)" indicator
- Parachèvements still editable
- Changing global CASCO in Scenarios updates all participants

**Step 5: Commit**

```bash
git add src/components/EnDivisionCorrect.tsx
git commit -m "refactor: remove per-participant CASCO input, display global rate

- Remove updateCascoPerM2 handler function
- Convert CASCO to read-only display with global rate indicator
- Keep parachèvements editable per participant
- Update addParticipant to exclude cascoPerM2"
```

---

## Task 6: Implement LocalStorage Migration

**Files:**
- Modify: `src/components/EnDivisionCorrect.tsx:52-67`

**Step 1: Update loadFromLocalStorage function**

Modify `src/components/EnDivisionCorrect.tsx:52-67`:

```typescript
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

**Step 2: Test migration manually**

Test steps:
1. Open browser console on http://localhost:4321
2. Run: `localStorage.setItem('credit-castor-scenario', JSON.stringify({version: 1, participants: [{cascoPerM2: 1800, parachevementsPerM2: 500, name: "Test"}], projectParams: {totalPurchase: 650000}, scenario: {}}))`
3. Refresh page
4. Check that globalCascoPerM2 = 1800 in Scenarios section
5. Check that participant no longer has cascoPerM2

**Step 3: Commit**

```bash
git add src/components/EnDivisionCorrect.tsx
git commit -m "feat: add localStorage migration for global CASCO price

- Migrate old cascoPerM2 from first participant to globalCascoPerM2
- Remove cascoPerM2 from all participants during load
- Default to 1590 if no value found
- Backward compatible with existing saved scenarios"
```

---

## Task 7: Update Tests

**Files:**
- Test: `src/utils/calculatorUtils.test.ts`
- Test: `src/components/EnDivisionCorrect.test.tsx`

**Step 1: Add integration test for global CASCO**

Add to `src/utils/calculatorUtils.test.ts` in the 'Global CASCO Price' describe block:

```typescript
test('all participants use global CASCO rate in calculateAll', () => {
  const participants: Participant[] = [
    {
      name: 'A',
      capitalApporte: 100000,
      notaryFeesRate: 12.5,
      unitId: 1,
      surface: 100,
      interestRate: 4.5,
      durationYears: 25,
      quantity: 1,
      parachevementsPerM2: 500
    },
    {
      name: 'B',
      capitalApporte: 150000,
      notaryFeesRate: 12.5,
      unitId: 2,
      surface: 150,
      interestRate: 4.5,
      durationYears: 25,
      quantity: 1,
      parachevementsPerM2: 600
    }
  ];

  const projectParams: ProjectParams = {
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
    globalCascoPerM2: 1700
  };

  const scenario: Scenario = {
    constructionCostChange: 0,
    infrastructureReduction: 0,
    purchasePriceReduction: 0
  };

  const results = calculateAll(participants, projectParams, scenario, {});

  expect(results.participantBreakdown[0].casco).toBe(170000); // 100 × 1700
  expect(results.participantBreakdown[1].casco).toBe(255000); // 150 × 1700
});
```

**Step 2: Run all tests**

Run: `npm run test:run`
Expected: All calculator tests PASS

**Step 3: Update component tests if needed**

Check if `src/components/EnDivisionCorrect.test.tsx` needs updates. Look for any tests that reference cascoPerM2 in participants and update them to use projectParams.globalCascoPerM2 instead.

**Step 4: Run all tests again**

Run: `npm run test:run`
Expected: All tests PASS

**Step 5: Commit**

```bash
git add src/utils/calculatorUtils.test.ts src/components/EnDivisionCorrect.test.tsx
git commit -m "test: add tests for global CASCO price feature

- Test calculateCascoAndParachevements with globalCascoPerM2
- Test integration with calculateAll
- Verify all participants use same global rate
- Update component tests for new structure"
```

---

## Task 8: Manual Testing and Verification

**Files:**
- N/A (manual testing only)

**Step 1: Test global CASCO changes affect all participants**

1. Run: `npm run dev`
2. Navigate to: http://localhost:4321
3. Note current CASCO values for all participants
4. Change global CASCO in Scenarios section from 1590 to 2000
5. Verify all participant CASCO costs updated proportionally

**Step 2: Test parachèvements remains per-participant**

1. Change parachèvements for first participant to 700
2. Verify only that participant's construction cost changed
3. Verify other participants unchanged

**Step 3: Test localStorage persistence**

1. Change global CASCO to 1800
2. Refresh browser
3. Verify global CASCO still shows 1800

**Step 4: Test adding new participant**

1. Click "Ajouter un participant"
2. Verify new participant uses global CASCO rate
3. Verify new participant has default parachèvements (500)

**Step 5: Test Excel export**

1. Click "Excel" export button
2. Open exported file
3. Verify CASCO costs use global rate
4. Verify calculations are correct

**Step 6: Document any issues found**

If any issues found, create new tasks to fix them before proceeding.

---

## Task 9: Final Verification and Documentation

**Files:**
- Run all tests
- Update: `CLAUDE.md` (if needed)

**Step 1: Run full test suite**

Run: `npm run test:run`
Expected: All tests PASS

**Step 2: Run TypeScript type checking**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Build production**

Run: `npm run build`
Expected: Successful build

**Step 4: Final commit**

```bash
git add .
git commit -m "chore: final verification for global CASCO price feature

- All tests passing
- TypeScript types correct
- Production build successful
- Feature complete and ready for review"
```

---

## Success Criteria

✅ Single global CASCO input in Scenarios section with blue background
✅ All participants use the same CASCO rate
✅ Parachèvements remains per-participant
✅ CASCO display shows "(global)" indicator
✅ Per-participant CASCO input removed
✅ All tests passing (calculator + component)
✅ TypeScript compiles without errors
✅ LocalStorage migration works seamlessly
✅ Excel export reflects global rate
✅ Production build successful

---

## Notes for Engineer

- **DRY:** Don't repeat yourself - reuse existing patterns
- **YAGNI:** You aren't gonna need it - implement only what's specified
- **TDD:** Write test first, see it fail, implement, see it pass
- **Commits:** Commit after each task (every 10-15 minutes max)
- **Questions:** If anything is unclear, ask before proceeding

**Skills referenced:**
- @superpowers:test-driven-development - Write tests first always
- @superpowers:verification-before-completion - Verify tests pass before claiming done
