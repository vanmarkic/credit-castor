# Copropriété Sale Rule Implementation Summary

**Date**: 2025-11-10
**Status**: ✅ Complete
**Branch**: master (merged)

## Overview

Implemented a new business rule where newcomers can purchase directly from the copropriété with a 30/70 distribution split:
- **30%** → Copropriété reserves (reinvestment)
- **70%** → Distributed to all founders by their frozen T0 quotité

## Pricing Formula

The copro sale uses the same formula as portage sales:

```
Total Price = Base Price + Indexation + Carrying Cost Recovery

Where:
- Base Price = (Total Project Cost / Total Building Surface) × Surface Purchased
- Indexation = Base Price × (1 + indexation_rate)^years_held - Base Price
- Carrying Cost Recovery = (Total Carrying Costs × Surface Ratio) × Recovery %
- Surface Ratio = Surface Purchased / Total Building Surface
```

## Implementation Details

### Phase 1: Core Calculations ✅
**Files**: `src/utils/portageCalculations.ts`, `portageCalculations.test.ts`

Added two new functions:
- `calculateCoproSalePrice()` - Calculates pricing with 30/70 distribution
- `distributeCoproProceeds()` - Splits 70% among founders by quotité

**Tests**: 21 comprehensive tests covering:
- Proportional pricing calculation
- Indexation with compound growth
- Carrying cost recovery
- 30/70 distribution accuracy
- Edge cases (zero costs, single/multiple founders)

### Phase 2: Timeline Types ✅
**Files**: `src/types/timeline.ts`

Added `CoproSaleEvent` interface:
```typescript
export interface CoproSaleEvent extends BaseEvent {
  type: 'COPRO_SALE';
  buyer: Participant;
  lotId: number;
  surfacePurchased: number;
  salePrice: number;
  breakdown: { basePrice, indexation, carryingCostRecovery };
  distribution: {
    toCoproReserves: number;
    toParticipants: { [name]: { quotite, amount } };
  };
  notaryFees: number;
  financing: { ... };
}
```

Updated `TimelineTransaction` with copro-specific fields.

### Phase 3: State Machine Integration ✅
**Files**: `src/stateMachine/creditCastorMachine.ts`, `types.ts`

Enhanced copro sale handling:
- Updated `CurrentSale` interface with `surfacePurchased?` field
- Enhanced `CoproPricing` type with `breakdown?` and `distribution?` fields
- Implemented pricing calculation in `recordCompletedSale` action
- Auto-updates `acpBankAccount` with 30% reserve
- Calculates participant surface from `lotsOwned` array

**Tests**: Enhanced state machine tests to verify 30/70 distribution.

### Phase 4: Timeline Integration ✅
**Files**: `src/utils/transactionCalculations.ts`, `chronologyCalculations.ts`

Added timeline transaction creation:
- `createCoproSaleTransactions()` - Creates transaction array:
  1. Buyer purchase transaction (cost increase)
  2. Individual founder distribution transactions (cash received)
  3. Copropriété reserve transaction (30% tracking)

- `applyCoproSale()` event handler - Processes CoproSaleEvent:
  1. Adds buyer as participant
  2. Removes/reduces copro lot
  3. Updates copro cash reserve (+30%)
  4. Records all transactions

**Tests**: 12 new tests for transaction creation covering:
- Correct number of transactions
- Positive/negative deltas
- 70% distribution by quotité
- 30% reserve tracking
- Single/multiple founders

### Phase 5: Data Persistence ✅
**Files**: `src/stateMachine/types.ts`

Data structures already support persistence:
- `CoproSale` interface with enhanced `CoproPricing`
- Optional fields (`breakdown?`, `distribution?`) for backward compatibility
- State machine stores in `salesHistory: Sale[]`
- XState persistence handles serialization

### Phase 6: Testing & Fixes ✅
**Files**: `creditCastorMachine.test.ts`

Fixed test setup:
- Populated founder `lotsOwned` arrays with surface data
- Resolved division-by-zero issues in tests
- All copro sale tests passing

## Test Results

```
✓ portageCalculations.test.ts (21 new tests for copro pricing)
✓ transactionCalculations.test.ts (12 new tests for timeline transactions)
✓ chronologyCalculations.test.ts (50 tests including copro event handling)
✓ creditCastorMachine.test.ts (28 tests including 2 copro sale flows)

Total: 513 tests passing
```

## Key Technical Decisions

1. **Proportional Base Price**: Uses `(totalProjectCost / totalBuildingSurface) × surfacePurchased` rather than individual lot acquisition cost
2. **Frozen T0 Quotité**: Distribution uses founder surface at T0, never recalculated
3. **Backward Compatibility**: Optional fields in `CoproPricing` allow old data to load
4. **Multiple Beneficiaries**: Timeline shows separate transaction for each founder receiving distribution

## Files Modified

- `src/utils/portageCalculations.ts` - Core pricing functions
- `src/utils/portageCalculations.test.ts` - Pricing tests
- `src/types/timeline.ts` - Event types
- `src/stateMachine/types.ts` - Enhanced CoproPricing
- `src/stateMachine/creditCastorMachine.ts` - State machine logic
- `src/stateMachine/creditCastorMachine.test.ts` - State machine tests
- `src/utils/transactionCalculations.ts` - Timeline transactions
- `src/utils/transactionCalculations.test.ts` - Transaction tests
- `src/utils/chronologyCalculations.ts` - Event handling

## Phase 7: UI Rendering & Bug Fixes ✅
**Files**: `src/components/CoproSaleDistributionView.tsx`, `transactionCalculations.ts`

Added dedicated UI component for copro sale distribution display:
- `CoproSaleDistributionView.tsx` - Comprehensive component showing:
  - Sale header with buyer, date, and surface
  - Total price prominently displayed
  - Pricing formula breakdown (base + indexation + carrying)
  - 30% copropriété reserves (blue highlight)
  - 70% founders total (green highlight)
  - Table with individual founder distributions (name, quotité %, amount)
  - Explanatory note about frozen T0 quotité

**Bug Fix**: Timeline "0 €" Display Issue
- **Problem**: Founders' timeline cards showed "0 €" instead of their distribution amount when newcomer joined via copro sale
- **Root Cause**: `calculateCooproTransaction()` was a stub that always returned 0
- **Solution**: Implemented actual calculation:
  - Extracts purchase price from `coproBuyer.purchaseDetails.purchasePrice`
  - Calculates 70% distribution amount
  - Divides among founders (equal distribution for now)
  - Returns negative delta (cash received)
- **Limitation**: Uses equal distribution; quotité-based would require access to all participants
- **Tests**: 15 comprehensive RTL tests + 14 transaction calculation tests all passing

**Enhancement**: Copro Reserve Display
- **Feature**: Copropriété lane now displays the 30% cash reserve increase when a sale occurs
- **Display**: Shows "💰 +€34,500 réserves (30%)" in green below "📉 Vendu à [buyer]"
- **Calculation**: Automatically sums 30% of all copro sales at that date
- **Visual**: Complete 30/70 split now visible - founders see cash received, copro sees reserves increase

## Commits

1. `feat(portage): add copro sale price calculations` - Phase 1
2. `feat(timeline): add CoproSaleEvent type` - Phase 2
3. `feat(state-machine): integrate copro sale rule with 30/70 distribution` - Phase 3
4. `feat(timeline): add copro sale transaction projection` - Phase 4
5. `fix(tests): add lotsOwned data to copro sale test founders` - Test fixes
6. `feat(ui): add copro sale distribution view with RTL tests` - Phase 7
7. `fix(timeline): calculate 70% founder distribution for copro sales` - Bug fix
8. `feat(timeline): display 30% copro reserve increase on sales` - UI enhancement

## Future Enhancements

- Excel/CSV export for sales history (not implemented - no sales export exists yet)
- Configurable formula parameters in UI
- Historical tracking of carrying costs per lot
- Integration tests for full copro sale workflow

## References

- Design Doc: `docs/plans/2025-11-10-copro-sale-rule-design.md`
- Implementation Plan: `docs/plans/2025-11-10-copro-sale-rule-implementation.md`
