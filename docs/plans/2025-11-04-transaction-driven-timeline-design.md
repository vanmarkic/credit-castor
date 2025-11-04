# Design: Transaction-Driven Timeline

**Created**: 2025-11-04
**Status**: Validated
**Problem**: Timeline currently derives deltas by comparing snapshots from the same calculation state, resulting in €0 deltas even though transactions occur.

---

## Problem Statement

Current timeline shows:
- T0: Annabelle/Colin €680k total cost
- T+16mo: Annabelle/Colin €680k total cost (identical, using same calculation state)
- Delta: €0

But in reality:
- Annabelle/Colin sells portage lot at T+16mo for €680k
- They receive cash that reduces their obligation
- Should show delta: -€680k (or at least the financial impact)

**Root cause**: Using a single `CalculationResults` object for all temporal snapshots. Need explicit transaction calculations based on portage/copro formulas.

---

## Solution Architecture

### 1. Data Model: Transactions Embedded in Snapshots

```typescript
interface TimelineTransaction {
  type: 'portage_sale' | 'copro_sale' | 'founder_entry'

  // Portage-specific
  seller?: string              // name of selling founder
  lotPrice?: number            // calculated via portageCalculations
  indexation?: number          // (future: component breakdown)
  carryingCosts?: number       // (future: component breakdown)
  registrationFees?: number    // (future: component breakdown)

  // All transactions
  delta: {
    totalCost: number         // signed: negative for seller, positive for buyer
    loanNeeded: number        // same sign as totalCost
    reason: string
  }
}

interface TimelineSnapshot {
  date: Date
  participantName: string
  participantIndex: number
  totalCost: number
  loanNeeded: number
  monthlyPayment: number
  isT0: boolean
  colorZone: number
  transaction?: TimelineTransaction  // NEW: embedded, optional
}
```

### 2. Business Logic Layer: Pure Functions

**File**: `src/utils/transactionCalculations.ts` (NEW)

```typescript
/**
 * Calculate the financial impact of a portage sale on both buyer and seller.
 *
 * @param seller - The founder selling their lot
 * @param buyer - The newcomer buying the lot
 * @param buyerEntryDate - The date when buyer enters (determines years held for indexation)
 * @param sellerBreakdown - Seller's calculated costs at T0
 * @param buyerBreakdown - Buyer's calculated costs at their entry date
 * @returns Transaction object with deltas for both parties
 */
export function calculatePortageTransaction(
  seller: Participant,
  buyer: Participant,
  buyerEntryDate: Date,
  sellerBreakdown: ParticipantCalculation,
  buyerBreakdown: ParticipantCalculation
): TimelineTransaction

/**
 * Calculate the financial impact of a copropriété sale.
 * Affects all active participants through shared cost redistribution.
 *
 * @param affectedParticipant - A participant affected by the copro sale
 * @param copraSaleInfo - Info about which copro lots were sold
 * @param previousSnapshot - Participant's previous financial state (for delta)
 * @returns Transaction object with deltas
 */
export function calculateCooproTransaction(
  affectedParticipant: Participant,
  copraSaleInfo: { buyer: Participant, lotsAdded: number },
  previousSnapshot: TimelineSnapshot
): TimelineTransaction
```

**Key principles:**
- Pure functions: no side effects, no React
- Input: participants, calculations, dates
- Output: transaction with calculated delta
- Uses existing portage formulas from `portageCalculations.ts`
- Lot price calculated at buyer's entry date per business logic documentation

### 3. View Layer: Reactive Snapshot Generation

**File**: `src/components/HorizontalSwimLaneTimeline.tsx` (MODIFIED)

During snapshot generation in `useMemo`:
1. For each date, identify affected participants (existing logic)
2. For each affected participant, check if they're involved in a transaction
3. If yes, call `calculatePortageTransaction()` or `calculateCooproTransaction()`
4. Embed transaction in snapshot
5. Render transaction delta in card footer

### 4. Temporal Snapshot Generation

**Timeline generation logic:**
1. Get all unique dates from participant entry dates (sorted)
2. At T0 (deed date): all founders get snapshots (no transactions yet)
3. At T+16mo (buyer entry):
   - Portage sale: buyer and seller get snapshots with transactions
   - Copro sale: all active participants get snapshots with transactions
4. Other participants at each date: no change → no snapshot (existing behavior)

**Transaction object availability:**
- T0 snapshot: `transaction` undefined (founders entering together, no sale)
- T+16mo snapshot: `transaction` defined (sale event)
- Used to render delta section in card

---

## Implementation Steps

### Phase 1: Create Business Logic (TDD)
1. Write tests for `calculatePortageTransaction()` in `transactionCalculations.test.ts`
2. Implement `calculatePortageTransaction()` function
3. Write tests for `calculateCooproTransaction()`
4. Implement `calculateCooproTransaction()` function

### Phase 2: Integrate into View
1. Update `TimelineSnapshot` interface to include `transaction` field
2. Update snapshot generation in `HorizontalSwimLaneTimeline.tsx` to:
   - Detect transaction involvement
   - Call calculation functions
   - Embed transaction in snapshot
3. Update rendering to display transaction delta (replace delta-only logic)

### Phase 3: Testing & Documentation
1. Update tests to verify transactions are calculated
2. Verify timeline renders with proper deltas
3. Document transaction logic in `docs/analysis/business-logic-validated.md`

---

## Testing Strategy (TDD)

### Unit Tests: `transactionCalculations.test.ts`

**Test 1: Portage sale - seller's perspective**
- Input: founder lot sold to newcomer, entry dates 16 months apart
- Expected: seller delta = -lotPrice (cost reduction)
- Reason: "Sold portage lot to Nouveau·elle"

**Test 2: Portage sale - buyer's perspective**
- Input: buyer entering, purchasing from founder
- Expected: buyer delta = +lotPrice (cost increase)
- Reason: "Purchased from Annabelle/Colin"

**Test 3: Portage lot price calculation**
- Input: seller with known purchase date, buyer entry date
- Expected: lotPrice includes indexation, carrying costs per portage formula
- Verify against existing `calculateResalePrice()` results

**Test 4: Copro sale - affected participant**
- Input: one lot sold from copro inventory
- Expected: all active participants get cost redistribution delta
- Reason: "Participant X joined (copro sale)"

**Integration Tests: `HorizontalSwimLaneTimeline.test.tsx`**

**Test 5: Snapshot with transaction embedded**
- Setup: participants with portage sale event
- Expected: snapshot at sale date contains transaction object
- Transaction has correct delta and reason

**Test 6: Rendering transaction delta**
- Setup: render timeline with transaction
- Expected: delta section displays with amount and reason
- Visual verification of delta sign (red for cost increase, green for reduction)

---

## Data Flow Diagram

```
Participant data changes
    ↓
HorizontalSwimLaneTimeline.useMemo triggers
    ↓
For each date and affected participant:
    ├─ Check: Is this participant selling/buying a portage lot?
    │  └─ YES → call calculatePortageTransaction()
    │           ↓
    │           Access portageCalculations formulas
    │           Calculate lot price at buyer's entry date
    │           Return transaction with delta
    │
    ├─ Check: Is this participant affected by copro sale?
    │  └─ YES → call calculateCooproTransaction()
    │           ↓
    │           Calculate cost redistribution impact
    │           Return transaction with delta
    │
    └─ Embed transaction in snapshot
        ↓
Render snapshot with transaction delta in card footer
```

---

## Open Questions / Future Work

1. **Component breakdown (Option B "maybe")**
   - Currently: transaction.delta shows only total cost change
   - Future: break down into indexation, carrying costs, registration fees
   - Requires storing components in TimelineTransaction

2. **Loan impact calculation**
   - Currently: loan delta assumed proportional to cost delta
   - May need more sophisticated formula based on loan terms

3. **Copro inventory tracking**
   - Currently: copro snapshots show when inventory changes
   - Transaction should link to inventory change (which lots sold)

---

## Success Criteria

- ✅ Seller's second card shows non-zero delta (cost reduction)
- ✅ Buyer's card shows delta (cost increase)
- ✅ Delta reason clearly states transaction type
- ✅ All calculation logic in utils, not in view
- ✅ Tests validate transaction calculations match portage formulas
- ✅ Business logic documented in business-logic-validated.md
