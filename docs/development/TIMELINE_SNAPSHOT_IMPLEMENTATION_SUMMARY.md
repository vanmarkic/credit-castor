# Timeline Snapshots Implementation Summary

## What Has Been Implemented

### 1. Type System (src/types/timeline.ts)
Complete event sourcing architecture with:
- **TimelineSnapshot**: Participant's financial state at a point in time
- **CoproSnapshot**: Copropriété inventory state
- **TimelineTransaction**: Financial delta embedded in snapshots
- **Lot**: Individual lot ownership tracking
- **Domain Events**: INITIAL_PURCHASE, NEWCOMER_JOINS, HIDDEN_LOT_REVEALED, PORTAGE_SETTLEMENT, COPRO_SALE, etc.
- **Projections**: PhaseProjection combines snapshot + cash flows for temporal analysis

### 2. Snapshot Generation (src/utils/timelineCalculations.ts)

**Main Functions:**

```typescript
// Extract chronological sequence of events
getUniqueSortedDates(participants, deedDate): Date[]

// Generate participant snapshots with transactions embedded
generateParticipantSnapshots(
  participants, calculations, deedDate, formulaParams
): Map<string, TimelineSnapshot[]>

// Generate copropriété inventory snapshots
generateCoproSnapshots(participants, calculations, deedDate): CoproSnapshot[]

// Determine who is affected by each event (buyers, sellers, redistributed)
determineAffectedParticipants(
  joiningParticipants, allParticipants, date, deedDate, isT0
): Participant[]
```

**Key Logic:**
- T0: All founders get snapshots (baseline)
- Portage sale: Buyer + seller + affected parties
- Copro sale: Buyer + all founders (shared costs redistribute)
- Only creates snapshots when participants/costs actually change

### 3. Transaction Calculations (src/utils/transactionCalculations.ts)

**Functions:**

```typescript
// Calculate portage sale delta (lot sold between participants)
calculatePortageTransaction(
  seller, buyer, buyerEntryDate,
  sellerBreakdown, buyerBreakdown,
  sellerEntryDate, formulaParams, totalParticipants
): TimelineTransaction

// Calculate copro sale deltas (70% distribution to founders)
calculateCooproTransaction(
  affectedParticipant, coproBuyer,
  previousSnapshot, allParticipants
): TimelineTransaction

// Create multi-party transactions for copro sales
createCoproSaleTransactions(
  coproSalePricing, buyer, founders,
  totalBuildingSurface, saleDate, surfacePurchased
): TimelineTransaction[]
```

**Calculations:**

Portage Sale:
```
lotPrice = basePrice + indexation + carryingCosts
sellerDelta = -lotPrice (cost reduction)
Reuses: calculateResalePrice(), calculateCarryingCosts()
```

Copro Sale:
```
salePrice = buyer's purchase price
30% → copro reserves
70% → founders by quotité (surface share)
founderDelta = -(70% × founderQuotité)
```

### 4. React Integration (src/components/HorizontalSwimLaneTimeline.tsx)

Generates snapshots reactively using `useMemo`:
```typescript
const snapshots = useMemo(() => {
  return generateParticipantSnapshots(
    participants, calculations, deedDate, formulaParams
  )
}, [participants, calculations, deedDate])
```

Results in:
- Map<participantName, TimelineSnapshot[]>
- Each snapshot has `transaction` embedded
- Rendered as color-coded cards in swim lanes

### 5. Export Integration (src/utils/excelExport.ts)

**Current state:**
- Timeline fields ARE included in export (columns Y-AM):
  - Y: isFounder
  - Z: entryDate
  - AA-AB: lotsOwned with sold dates
  - AC-AE: purchaseDetails
  - AF-AK: Two-loan financing
  - AL-AM: Constructor payment options

**NOT currently exported:**
- TimelineSnapshot objects
- Transaction deltas and reasons
- Historical snapshots (only current state)
- CoproSnapshot data

---

## Data Structures in Detail

### TimelineSnapshot (from current code)
```typescript
interface TimelineSnapshot {
  date: Date                                    // Event date
  participantName: string                       // Participant involved
  participantIndex: number                      // Index in participants[]
  totalCost: number                             // Total investment at this date
  loanNeeded: number                            // Loan required
  monthlyPayment: number                        // Monthly loan payment
  isT0: boolean                                 // Initial purchase event?
  colorZone: number                             // Visual grouping index (0, 1, 2...)
  transaction?: TimelineTransaction             // Financial delta from this event
  showFinancingDetails: boolean                 // Show/hide financing breakdown
}
```

### TimelineTransaction (from current code)
```typescript
interface TimelineTransaction {
  type: 'portage_sale' | 'copro_sale' | 'founder_entry'

  // Portage sale fields
  seller?: string                               // Founder selling
  lotPrice?: number                             // Total resale price
  indexation?: number                           // Price increase from inflation
  carryingCosts?: number                        // Accumulated costs held
  registrationFees?: number

  // Copro sale fields
  buyer?: string
  date?: Date
  surfacePurchased?: number                     // m² purchased
  distributionToCopro?: number                  // 30% of sale price
  distributionToParticipants?: Map<string, number>  // 70% by quotité

  // Financial delta (mandatory)
  delta: {
    totalCost: number                           // Change in total cost
    loanNeeded: number                          // Change in loan needed
    reason: string                              // "Sold to X" or "Distribution from..."
  }
}
```

### CoproSnapshot
```typescript
interface CoproSnapshot {
  date: Date
  availableLots: number                         // Unsold lots still held
  totalSurface: number                          // Remaining surface area
  soldThisDate: string[]                        // Buyer names at this date
  reserveIncrease: number                       // 30% of sale proceeds
  colorZone: number                             // Visual grouping
}
```

### Lot (owned by participant)
```typescript
interface Lot {
  lotId: number                                 // Unique identifier for tracking sales
  surface: number
  unitId: number
  isPortage: boolean                            // Is this a portage lot?
  acquiredDate: Date
  originalPrice?: number                        // Initial purchase share
  originalNotaryFees?: number
  originalConstructionCost?: number
  monthlyCarryingCost?: number                  // For portage tracking
  
  // Portage configuration
  allocatedSurface?: number
  founderPaysCasco?: boolean
  founderPaysParachèvement?: boolean
  
  // Sale tracking
  soldDate?: Date
  soldTo?: string
  salePrice?: number
  carryingCosts?: number                        // Accumulated by time held
}
```

---

## Architecture Decisions

### 1. Snapshots Are Reactive, Not Stored
- Generated on-demand from participants array
- Recalculated when participants or calculations change
- Used primarily for UI rendering
- Not persisted to localStorage/database

### 2. Transactions Embedded in Snapshots
- Not separate objects in store
- Calculated during snapshot generation
- Contains both absolute state (totalCost) and delta (reason, amount)
- Pure function calculation

### 3. Two-Layer Export System
**Interface-based abstraction:**
- `ExportWriter` interface defines contract
- `XlsxWriter` for production (writes .xlsx files)
- `CsvWriter` for testing (returns formatted string for snapshots)

**Pure function composition:**
- `buildExportSheetData()`: Produces SheetData (cells + widths)
- Writer handles format-specific serialization

### 4. Circular Dependency Prevention
- `transactionCalculations.ts` has local TimelineSnapshot interface copy
- Avoids circular import from types/timeline.ts
- Keeps transaction logic decoupled from type system

### 5. Lot Identification by ID
- Each lot gets unique `lotId` (counter-based at creation)
- Portage sales tracked via `lotId` in `purchaseDetails`
- Enables finding exact lot: `seller.lotsOwned.find(lot => lot.lotId === buyerId)`

---

## Current Export Columns Explained

| Column | Field | Formula/Source | Purpose |
|--------|-------|-----------------|---------|
| A | Name | Direct | Participant identifier |
| B | Unit ID | Direct | Unit reference |
| C | Surface | Direct | Building surface area |
| D | Qty | Direct | Number of lots owned |
| E | Capital | Direct | Capital apporté |
| F-H | Loan terms | Direct | Interest rate, duration |
| I | Purchase share | =C×pricePerM² | Distribution of purchase price |
| J | Notary fees | =I×rate | Notary fees proportional |
| K-M | Construction | Direct/Calculated | CASCO, parachèvements, travaux |
| N | Construction total | =K+L+M | Sum of construction |
| O | Commun | =totalCommun/qty | Shared infrastructure allocation |
| P | Total cost | =I+J+N+O | Total investment required |
| Q | Loan needed | =P-E | Loan amount (total - capital) |
| R | Monthly payment | =PMT(rate, months, Q) | Monthly loan payment |
| S | Total repaid | =R×duration×12 | Total interest paid |
| T-X | Overrides | Direct | Custom costs per participant |
| Y | Founder | Condition | T0 participant? |
| Z | Entry date | Formatted | When participant joined |
| AA | Lots owned | Formatted | "Lot 1, Lot 2 (portage)" |
| AB | Sold dates | Formatted | When each portage lot sold |
| AC-AE | Purchase details | Direct | From, lotId, price for newcomers |
| AF-AK | Two-loan financing | Direct | Deferred loan configuration |
| AL-AM | Constructor pays | Condition | Founder covers construction? |

---

## How Snapshots Are Created: Example

### Scenario: T0 with 2 founders, then 1 newcomer joins at T+12mo

**Step 1: Extract dates**
```
Dates: [2026-02-01 (T0), 2027-02-01 (newcomer)]
```

**Step 2: Generate snapshots at T0 (2026-02-01)**
```
- Find joiners at T0: [Founder1, Founder2]
- Affected participants: [Founder1, Founder2] (isT0=true)
- For each founder:
  - Get breakdown from calculations
  - No transaction (baseline)
  - Create snapshot: {date, name, totalCost, loanNeeded, isT0: true, colorZone: 0}
```

**Step 3: Generate snapshots at T1 (2027-02-01)**
```
- Find joiners at T1: [Newcomer1]
- Check purchaseDetails.buyingFrom: "Founder1" (portage sale)
- Affected: [Newcomer1, Founder1, Founder2] (buyer + seller + redistribution)

For Newcomer1:
  - Buyer transaction: calculatePortageTransaction(Founder1, Newcomer1, ...)
    → lotPrice = original cost + indexation + carrying costs
    → delta: +lotPrice (cost increase)
  - Snapshot: {date: 2027-02-01, name: "Newcomer1", totalCost: X, 
               transaction: {type: 'portage_sale', delta: ...},
               showFinancingDetails: true, colorZone: 1}

For Founder1:
  - Seller transaction: same as above but delta = -lotPrice
  - Snapshot: {date: 2027-02-01, name: "Founder1", totalCost: Y-lotPrice,
               transaction: {type: 'portage_sale', seller: "Founder1", delta: ...},
               showFinancingDetails: false, colorZone: 1}

For Founder2:
  - No direct transaction, but shared costs may change
  - Only snapshot if costs actually changed
  - Snapshot: {date: 2027-02-01, name: "Founder2", totalCost: Z±delta,
               transaction?: (if redistribution occurred), colorZone: 1}
```

**Result:**
```typescript
snapshotsMap.get("Founder1") = [
  {date: 2026-02-01, ...T0...},
  {date: 2027-02-01, ...with portage_sale transaction...}
]
snapshotsMap.get("Newcomer1") = [
  {date: 2027-02-01, ...with portage_sale transaction...}
]
snapshotsMap.get("Founder2") = [
  {date: 2026-02-01, ...T0...},
  {date: 2027-02-01, ...possibly with redistribution...}
]
```

---

## Files and Their Roles

### Type Definitions
- **src/types/timeline.ts** (400 lines)
  - All interfaces: Lot, TimelineSnapshot, CoproSnapshot, TimelineTransaction
  - Domain events: InitialPurchaseEvent, NewcomerJoinsEvent, CoproSaleEvent, etc.
  - Projections: PhaseProjection, Timeline, cash flow types

### Calculation Logic
- **src/utils/timelineCalculations.ts** (395 lines)
  - `getUniqueSortedDates()`: Extract event dates
  - `generateParticipantSnapshots()`: Main snapshot generation
  - `generateCoproSnapshots()`: Copropriété inventory tracking
  - `determineAffectedParticipants()`: Who is impacted by each event

- **src/utils/transactionCalculations.ts** (257 lines)
  - `calculatePortageTransaction()`: Lot sale delta calculation
  - `calculateCooproTransaction()`: Distribution delta calculation
  - `createCoproSaleTransactions()`: Multi-party transactions
  - Reuses: calculateResalePrice(), calculateCarryingCosts()

### Export System
- **src/utils/excelExport.ts** (351 lines)
  - `buildExportSheetData()`: Creates SheetData structure
  - `exportCalculations()`: Orchestrates export
  - Includes timeline fields in participant columns

- **src/utils/exportWriter.ts** (192 lines)
  - ExportWriter interface
  - XlsxWriter implementation (uses xlsx library)
  - CsvWriter implementation (for testing, returns formatted string)

### UI Rendering
- **src/components/HorizontalSwimLaneTimeline.tsx** (main component)
  - Calls `generateParticipantSnapshots()` in useMemo
  - Renders snapshots as colored cards in swim lanes
  - Shows transaction deltas with reasons

- **src/components/timeline/*** (supporting components)
  - ParticipantLane: Individual participant's timeline
  - CoproLane: Copropriété reserves timeline
  - TimelineCardsArea: Card display area
  - TimelineHeader: Column headers with dates

---

## Integration with Existing Systems

### Reuses From calculatorUtils.ts
- `calculateAll()`: Core calculation engine (produces CalculationResults)
- `ParticipantCalculation`: Breakdown per participant
- `PortageFormulaParams`: Formula parameters (indexation rate, etc.)

### Reuses From portageCalculations.ts
- `calculateResalePrice()`: Lot resale price with indexation
- `calculateCarryingCosts()`: Accumulated carrying costs

### Used By React Components
- EnDivisionCorrect.tsx: Main calculator, triggers export
- HorizontalSwimLaneTimeline.tsx: Displays timeline with snapshots
- Timeline lanes and cards: Render snapshot data

---

## Testing Coverage

Tests exist for:
- src/utils/timelineCalculations.test.ts
- src/utils/transactionCalculations.test.ts
- src/types/timeline.test.ts
- src/components/HorizontalSwimLaneTimeline.test.tsx
- src/utils/excelExport.test.ts (integration test with CSV writer)

Test strategy:
- Unit tests for snapshot generation logic
- Transaction calculation tests with mock data
- Component tests render snapshots and verify display
- Export tests use CSV writer for snapshot testing (vs binary XLSX)

---

## Summary

**Timeline snapshots** are a complete event-sourcing system for tracking participant financial states over time. They:

1. Extract chronological event sequence from participants
2. Generate snapshots (participant state + transaction delta) at each key date
3. Calculate financial deltas using portage formulas
4. Embed transactions in snapshots for rendering
5. Support React component rendering via swim lane UI
6. Partially integrate with Excel export (timeline fields only, not snapshot history)

The system is **pure-function based**, **tested**, and **ready for enhancement** (e.g., exporting full timeline history to additional Excel sheets).

