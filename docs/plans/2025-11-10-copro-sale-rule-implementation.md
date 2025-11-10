# Copropriété Sale Rule Implementation Plan

**Date**: 2025-11-10
**Branch**: feature/copro-sale-rule
**Design Doc**: [2025-11-10-copro-sale-rule-design.md](./2025-11-10-copro-sale-rule-design.md)

## Implementation Approach

Following TDD principles with Pareto focus (80/20 rule):
- Write failing tests first
- Implement minimal code to pass
- Refactor for clarity
- Focus on core functionality first

## Phase 1: Core Calculations (Priority: HIGH)

### Task 1.1: Add CoproSalePrice Interface
**File**: `src/utils/portageCalculations.ts`
**Estimated**: 5 min

- [ ] Add `CoproSalePrice` interface after line 190
- [ ] Run TypeScript check: `npx tsc --noEmit`

### Task 1.2: Write Tests for calculateCoproSalePrice
**File**: `src/utils/portageCalculations.test.ts`
**Estimated**: 20 min

- [ ] Add test suite for `calculateCoproSalePrice`
- [ ] Test: basic calculation with all components
- [ ] Test: 30/70 distribution split
- [ ] Test: formula matches portage structure
- [ ] Test: validation errors (invalid surface, zero building surface)
- [ ] Run tests: `npm run test:run` (should fail)

### Task 1.3: Implement calculateCoproSalePrice
**File**: `src/utils/portageCalculations.ts`
**Estimated**: 15 min

- [ ] Implement function after line 485
- [ ] Follow design spec exactly
- [ ] Run tests: `npm run test:run` (should pass)

### Task 1.4: Write Tests for distributeCoproProceeds
**File**: `src/utils/portageCalculations.test.ts`
**Estimated**: 15 min

- [ ] Add test suite for `distributeCoproProceeds`
- [ ] Test: single founder (100%)
- [ ] Test: equal quotités
- [ ] Test: unequal quotités
- [ ] Test: sum equals total amount (no rounding errors)
- [ ] Test: validation errors
- [ ] Run tests: `npm run test:run` (should fail)

### Task 1.5: Implement distributeCoproProceeds
**File**: `src/utils/portageCalculations.ts`
**Estimated**: 10 min

- [ ] Implement function after `calculateCoproSalePrice`
- [ ] Use existing `ParticipantSurface` type
- [ ] Run tests: `npm run test:run` (should pass)

### Task 1.6: Commit Phase 1
- [ ] Run full test suite: `npm run test:run`
- [ ] Run TypeScript check: `npx tsc --noEmit`
- [ ] Commit with message: "feat(portage): add copro sale price calculations"

## Phase 2: Timeline Event Types (Priority: HIGH)

### Task 2.1: Add CoproSaleEvent Interface
**File**: `src/types/timeline.ts`
**Estimated**: 10 min

- [ ] Add `CoproSaleEvent` interface after `ParticipantExitsEvent` (line 188)
- [ ] Add to `DomainEvent` union type (line 196)
- [ ] Run TypeScript check: `npx tsc --noEmit`

### Task 2.2: Write Tests for CoproSaleEvent
**File**: `src/types/timeline.test.ts`
**Estimated**: 15 min

- [ ] Add test for CoproSaleEvent type checking
- [ ] Verify structure matches design
- [ ] Run tests: `npm run test:run`

### Task 2.3: Update TimelineTransaction Type
**File**: `src/types/timeline.ts`
**Estimated**: 5 min

- [ ] Add copro-sale specific fields to `TimelineTransaction` (lines 332-347)
- [ ] Run TypeScript check: `npx tsc --noEmit`

### Task 2.4: Commit Phase 2
- [ ] Run full test suite: `npm run test:run`
- [ ] Commit with message: "feat(timeline): add CoproSaleEvent type"

## Phase 3: State Machine Integration (Priority: HIGH)

### Task 3.1: Update CurrentSale Interface
**File**: `src/stateMachine/creditCastorMachine.ts`
**Estimated**: 5 min

- [ ] Add `surfacePurchased?: number` to `CurrentSale` (line 16)
- [ ] Run TypeScript check: `npx tsc --noEmit`

### Task 3.2: Update ExtendedContext Interface
**File**: `src/stateMachine/creditCastorMachine.ts`
**Estimated**: 5 min

- [ ] Add `copro: CoproEntity` to `ExtendedContext` (line 30)
- [ ] Update initial context at line 787-845
- [ ] Run TypeScript check: `npx tsc --noEmit`

### Task 3.3: Update CoproPricing Type
**File**: `src/stateMachine/types.ts`
**Estimated**: 10 min

- [ ] Locate existing `CoproPricing` interface
- [ ] Add `breakdown` field
- [ ] Add `distribution` field
- [ ] Mark `gen1CompensationPerSqm` as deprecated
- [ ] Run TypeScript check: `npx tsc --noEmit`

### Task 3.4: Write Tests for Copro Sale Flow
**File**: `src/stateMachine/creditCastorMachine.test.ts`
**Estimated**: 30 min

- [ ] Add test suite for copro sale flow
- [ ] Test: initiate copro sale
- [ ] Test: complete copro sale
- [ ] Test: verify salesHistory updated
- [ ] Test: verify copro reserves increased by 30%
- [ ] Test: verify founders received 70% by quotité
- [ ] Run tests: `npm run test:run` (should fail)

### Task 3.5: Implement recordCompletedSale for Copro Sales
**File**: `src/stateMachine/creditCastorMachine.ts`
**Estimated**: 30 min

- [ ] Update `recordCompletedSale` action (lines 197-286)
- [ ] Add copro sale branch (after line 238)
- [ ] Import calculation functions
- [ ] Calculate pricing using `calculateCoproSalePrice`
- [ ] Calculate distribution using `distributeCoproProceeds`
- [ ] Build sale object with new structure
- [ ] Run tests: `npm run test:run` (should pass)

### Task 3.6: Add Copro Reserve Update Logic
**File**: `src/stateMachine/creditCastorMachine.ts`
**Estimated**: 15 min

- [ ] Add `copro` field update to `recordCompletedSale` assign
- [ ] Update `copro.cashReserve` with 30% distribution
- [ ] Run tests: `npm run test:run`

### Task 3.7: Commit Phase 3
- [ ] Run full test suite: `npm run test:run`
- [ ] Run TypeScript check: `npx tsc --noEmit`
- [ ] Commit with message: "feat(state-machine): integrate copro sale rule"

## Phase 4: Timeline Integration (Priority: MEDIUM)

### Task 4.1: Update Timeline Projection Logic
**File**: `src/utils/calculatorToTimeline.ts` or create new file
**Estimated**: 45 min

- [ ] Write tests for CoproSaleEvent timeline projection
- [ ] Test: buyer purchase entry created
- [ ] Test: founder distribution entries created
- [ ] Test: copro reserve entry created
- [ ] Test: deltas calculated correctly
- [ ] Implement projection logic
- [ ] Run tests: `npm run test:run`

### Task 4.2: Commit Phase 4
- [ ] Run full test suite: `npm run test:run`
- [ ] Commit with message: "feat(timeline): add copro sale event projection"

## Phase 5: Export Integration (Priority: MEDIUM)

### Task 5.1: Update Excel Export
**File**: `src/utils/excelExport.ts`
**Estimated**: 30 min

- [ ] Write tests for copro sale export
- [ ] Add copro sale sheet/section
- [ ] Include distribution breakdown
- [ ] Run tests: `npm run test:run`
- [ ] Implement export logic
- [ ] Verify export matches design

### Task 5.2: Update JSON Schema
**File**: Storage/persistence files
**Estimated**: 20 min

- [ ] Define `StoredCoproSale` interface
- [ ] Add data migration function
- [ ] Write migration tests
- [ ] Implement migration
- [ ] Run tests: `npm run test:run`

### Task 5.3: Commit Phase 5
- [ ] Run full test suite: `npm run test:run`
- [ ] Commit with message: "feat(export): add copro sale export and persistence"

## Phase 6: Integration & Documentation (Priority: LOW)

### Task 6.1: End-to-End Test
**Estimated**: 30 min

- [ ] Create integration test covering full flow
- [ ] Test: copro sale from initiation to timeline to export
- [ ] Verify all data flows correctly
- [ ] Run tests: `npm run test:run`

### Task 6.2: Update Documentation
**Estimated**: 15 min

- [ ] Update CLAUDE.md if needed
- [ ] Document new formula in comments
- [ ] Add usage examples

### Task 6.3: Final Review
- [ ] Run all tests: `npm run test:run`
- [ ] Run TypeScript: `npx tsc --noEmit`
- [ ] Review all code changes
- [ ] Check for unused imports
- [ ] Verify no console.logs left

### Task 6.4: Final Commit
- [ ] Commit with message: "feat(copro-sale): complete integration and documentation"

## Merge Strategy

1. Ensure all tests pass
2. Rebase on master if needed
3. Create PR with design doc link
4. Review checklist:
   - [ ] All acceptance criteria met
   - [ ] Tests cover edge cases
   - [ ] No TypeScript errors
   - [ ] Documentation updated
   - [ ] Backward compatibility maintained

## Testing Checkpoints

After each phase:
```bash
npm run test:run
npx tsc --noEmit
```

After all phases:
```bash
npm run test:run
npm run build
npm run preview
```

## Success Metrics

- [ ] All unit tests pass (100% of new code covered)
- [ ] All integration tests pass
- [ ] TypeScript compiles without errors
- [ ] Build completes successfully
- [ ] All acceptance criteria from design doc met

## Estimated Total Time

- Phase 1: 65 min
- Phase 2: 30 min
- Phase 3: 95 min
- Phase 4: 45 min
- Phase 5: 50 min
- Phase 6: 45 min

**Total**: ~5.5 hours (excluding breaks)

## Notes

- Follow existing code patterns (portage calculations as reference)
- Keep functions pure for testability
- Use existing types where possible (ParticipantSurface, PortageFormulaParams)
- Verify backward compatibility at each step
