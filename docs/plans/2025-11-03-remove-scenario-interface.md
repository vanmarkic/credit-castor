# Remove Scenario Interface - Implementation Plan

**Date**: 2025-11-03
**Status**: Approved - Ready for implementation
**Related**: [business-logic-validated.md](../analysis/business-logic-validated.md)

## Overview

Remove the `Scenario` interface and all scenario-based percentage adjustments from the calculator. These were "what-if" simulation features that are no longer needed since real numbers are being used instead of estimates.

## What We're Removing

### Scenario Interface (3 fields)
```typescript
export interface Scenario {
  constructionCostChange: number; // percentage adjustment to construction costs
  infrastructureReduction: number; // percentage reduction to infrastructure
  purchasePriceReduction: number; // percentage reduction to purchase price
}
```

### Why Remove
- User confirmed: "We have enough ways to actually tweak the scenario" with real numbers
- Infrastructure fields already consolidated into expense categories
- Simplifies calculator by removing unused complexity
- Real data coming in soon, no need for percentage-based simulations

## Implementation Strategy

### Phase 1: Remove Scenario from Calculation Functions

**Files to update:**
- `src/utils/calculatorUtils.ts` - Core calculation engine
- `src/utils/chronologyCalculations.ts` - Timeline calculations
- `src/utils/cashFlowProjection.ts` - Cash flow projections
- `src/utils/calculatorToTimeline.ts` - Calculator to timeline conversion

**Changes:**
1. Remove `Scenario` interface definition
2. Update `calculateAll()` signature: `(participants, projectParams, unitDetails)`
3. Remove scenario parameters from all helper functions:
   - `calculatePricePerM2`: Remove `purchasePriceReduction`
   - `calculateSharedCosts`: Remove `infrastructureReduction`
   - `calculateConstructionCost`: Remove `constructionCostChange`
4. Remove all adjustment calculations from function bodies

### Phase 2: Clean Up Type Definitions

**Files to update:**
- `src/types/timeline.ts` - Remove from ProjectionState
- `src/utils/scenarioFileIO.ts` - Remove ScenarioData or entire file

**Changes:**
1. Remove `scenario: Scenario` from `ProjectionState` interface
2. Delete `ScenarioData` interface or entire scenarioFileIO module if only used for scenarios

### Phase 3: Update Storage & UI

**Files to update:**
- `src/utils/storage.ts` - Remove from persisted state
- `src/components/EnDivisionCorrect.tsx` - Remove scenario state/props
- `src/components/EnDivisionCorrect.test.tsx` - Remove from component tests

**Changes:**
1. Remove scenario field from localStorage schema (graceful degradation - ignore if present)
2. Remove scenario state management from React components
3. Remove any scenario-related UI controls (if they exist)

### Phase 4: Update Tests

**Files to update (all test files that use Scenario):**
- `src/utils/calculatorUtils.test.ts`
- `src/utils/excelExport.test.ts`
- `src/utils/excelExport.integration.test.ts`
- `src/utils/scenarioFileIO.test.ts`
- `src/utils/cashFlowProjection.test.ts`
- `src/utils/chronologyCalculations.test.ts`
- `src/utils/calculatorToTimeline.test.ts`
- Plus any other test files that reference Scenario

**Changes:**
1. Remove scenario setup: Delete lines like `const scenario = { constructionCostChange: 0, ... }`
2. Update function calls: Remove scenario parameter
3. Keep all assertions: Results should be identical (no adjustments = base calculations)

## Verification Plan

### Before Implementation
1. Run full test suite: `npm run test:run`
2. Document baseline (all tests should pass)

### During Implementation
1. Fix TypeScript compilation errors incrementally
2. Update tests as each module is modified
3. Verify no new test failures

### After Implementation
1. Run full test suite: `npm run test:run` (all should pass)
2. Check TypeScript compilation: `npx tsc --noEmit` (no errors)
3. Manual smoke test in UI
4. Verify localStorage backward compatibility (old data loads, scenario ignored)

## Key Principles

**Keep calculations, remove adjustments:**
- Construction costs: Use actual `projectParams.globalCascoPerM2` (no percentage changes)
- Purchase price: Use actual `projectParams.totalPurchase` (no reductions)
- Infrastructure: Already in expense categories (no reductions)

**Backward compatibility:**
- Old localStorage data with `scenario` field will load fine (field just ignored)
- No breaking changes for users
- No data migration needed

## Files Affected (13 total)

**Core (4):** calculatorUtils.ts, chronologyCalculations.ts, cashFlowProjection.ts, calculatorToTimeline.ts
**Types (2):** timeline.ts, scenarioFileIO.ts
**Storage (2):** storage.ts, scenarioFileIO.test.ts
**Tests (3):** calculatorUtils.test.ts, excelExport.test.ts, excelExport.integration.test.ts
**Components (2):** EnDivisionCorrect.tsx, EnDivisionCorrect.test.tsx

## Example Changes

### Before:
```typescript
const scenario = {
  constructionCostChange: 0,
  infrastructureReduction: 0,
  purchasePriceReduction: 0
};
const results = calculateAll(participants, projectParams, scenario, unitDetails);

// In calculatePricePerM2:
const adjustedPurchase = totalPurchase * (1 - purchasePriceReduction / 100);
```

### After:
```typescript
const results = calculateAll(participants, projectParams, unitDetails);

// In calculatePricePerM2:
// No adjustment - use actual purchase price
return totalPurchase / totalSurface;
```

## Rollout

1. ✅ Design validated with user
2. ⏳ Run baseline tests
3. ⏳ Implement changes (all 13 files)
4. ⏳ Fix TypeScript compilation
5. ⏳ Update all tests
6. ⏳ Verify tests pass
7. ⏳ Manual smoke test
8. ⏳ Commit with clear message

## Success Criteria

- ✅ All tests pass
- ✅ TypeScript compiles cleanly
- ✅ No Scenario references remain in codebase
- ✅ Calculation results unchanged (equivalent to scenario with 0% adjustments)
- ✅ UI works correctly
- ✅ Old localStorage data loads without errors
