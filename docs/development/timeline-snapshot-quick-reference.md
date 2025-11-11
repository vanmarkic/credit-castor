# Timeline Snapshots - Quick Reference

## Core Interfaces

### TimelineSnapshot
```typescript
{
  date: Date                      // When this state occurred
  participantName: string
  participantIndex: number
  totalCost: number               // Total investment needed
  loanNeeded: number              // Loan amount required
  monthlyPayment: number
  isT0: boolean                   // Initial purchase event?
  colorZone: number               // Visual grouping
  transaction?: TimelineTransaction  // Financial delta
  showFinancingDetails: boolean
}
```

### TimelineTransaction
```typescript
{
  type: 'portage_sale' | 'copro_sale'
  delta: {
    totalCost: number             // Change in cost
    loanNeeded: number            // Change in loan
    reason: string                // "Sold to X" or "Distribution from copro sale"
  }
  // Portage: seller, lotPrice, indexation, carryingCosts
  // Copro: buyer, surfacePurchased, distributionToCopro
}
```

### CoproSnapshot
```typescript
{
  date: Date
  availableLots: number           // Still held by copro
  totalSurface: number            // Remaining surface
  soldThisDate: string[]          // Buyer names
  reserveIncrease: number         // 30% of sale proceeds
  colorZone: number
}
```

### Lot (owned by participant)
```typescript
{
  lotId: number                   // Unique ID for sales tracking
  surface: number
  unitId: number
  isPortage: boolean              // Second/third lot = portage
  acquiredDate: Date
  originalPrice?: number          // T0 purchase share
  originalNotaryFees?: number
  originalConstructionCost?: number
  soldDate?: Date
  soldTo?: string
  salePrice?: number
  carryingCosts?: number
}
```

---

## Key Functions

### Generate Snapshots
```typescript
// Creates Map<participantName, TimelineSnapshot[]>
// One TimelineSnapshot per affected participant per unique date
generateParticipantSnapshots(
  participants: Participant[],
  calculations: CalculationResults,
  deedDate: string,
  formulaParams: PortageFormulaParams
): Map<string, TimelineSnapshot[]>
```

### Calculate Transaction Deltas
```typescript
// Portage sale: returns transaction with lot price and delta
calculatePortageTransaction(
  seller: Participant,
  buyer: Participant,
  buyerEntryDate: Date,
  sellerBreakdown: ParticipantCalculation,
  buyerBreakdown: ParticipantCalculation,
  sellerEntryDate: Date,
  formulaParams: PortageFormulaParams,
  totalParticipants: number
): TimelineTransaction

// Copro sale: returns transaction with distribution and delta
calculateCooproTransaction(
  affectedParticipant: Participant,
  coproBuyer: Participant,
  previousSnapshot: TimelineSnapshot,
  allParticipants: Participant[]
): TimelineTransaction
```

---

## Data Flow Summary

```
Participants[] + ProjectParams
        ↓
calculateAll()  [core calculation engine]
        ↓
CalculationResults (participantBreakdown[])
        ↓
generateParticipantSnapshots()
        ↓
Map<participantName, TimelineSnapshot[]>
        ├─ Each snapshot has transaction embedded
        ├─ Each transaction has delta: {totalCost, loanNeeded, reason}
        └─ Used by HorizontalSwimLaneTimeline.tsx for rendering
```

---

## Common Patterns

### Check if Participant is Buying
```typescript
const isBuyer = participant.purchaseDetails?.buyingFrom !== undefined
const isBuyingFromCopro = participant.purchaseDetails?.buyingFrom === 'Copropriété'
const isBuyingFromPerson = participant.purchaseDetails?.buyingFrom && 
                          participant.purchaseDetails.buyingFrom !== 'Copropriété'
```

### Find Which Lot Was Sold
```typescript
const lotId = buyer.purchaseDetails?.lotId
const sellerLot = seller.lotsOwned?.find(lot => lot.lotId === lotId)
```

### Calculate Participant's Quotité in Distribution
```typescript
const participantSurface = participant.surface || 0
const totalFounderSurface = founders.reduce((sum, p) => sum + (p.surface || 0), 0)
const quotite = participantSurface / totalFounderSurface
const participantShare = distributionAmount * quotite
```

### Delta Interpretation
```typescript
// Negative = benefits participant (cost reduction, cash received)
// Positive = costs participant (cost increase, payment required)

if (delta < 0) {
  // Seller receiving payment, or founder getting redistribution
  showAsGreen()  // Cost reduction
} else {
  // Buyer paying, or adjustment to costs
  showAsRed()    // Cost increase
}
```

---

## Timeline Snapshot Lifecycle

1. **T0 (Initial Purchase)**
   - All founders get snapshots with their T0 costs
   - No transaction (it's the baseline)
   - showFinancingDetails = true

2. **Portage Sale (Newcomer joins at T1)**
   - Seller gets snapshot with negative delta (cost reduction)
   - Buyer gets snapshot with positive delta (cost increase)
   - Both have transaction embedded
   - showFinancingDetails = true for buyer, false for seller

3. **Copro Sale (Later newcomer from reserves)**
   - Buyer gets snapshot with cost
   - All active founders get snapshots with negative deltas (cash from distribution)
   - All have copro_sale transaction
   - showFinancingDetails = true for buyer, false for founders

4. **Redistribution Only (shared cost changes)**
   - Only affected founders get snapshots
   - Delta shows cost redistribution
   - showFinancingDetails = false (redistribution cards)

---

## Export Integration

### Currently in Excel Export
- Column Y: `isFounder` ("Oui"/"Non")
- Column Z: `entryDate` (formatted date)
- Columns AA-AB: `lotsOwned` details and sold dates
- Columns AC-AE: `purchaseDetails` (buyingFrom, lotId, purchasePrice)

### NOT Currently Exported
- TimelineSnapshot objects
- Transaction deltas and reasons
- Historical snapshots (only current state exported)
- CoproSnapshot data

### To Export Snapshots
Would need to:
1. Create additional sheets per participant
2. One row per TimelineSnapshot (date, costs, transaction info)
3. Include transaction delta and reason
4. Optionally create copro reserves historical sheet

---

## Color Zones

Each unique date gets a color zone index:
- T0 = zone 0
- First newcomer event = zone 1
- Second newcomer event = zone 2
- etc.

Related cards (buyer + seller at same date) share the same color zone for visual grouping.

---

## Critical Files

| File | What to Change |
|------|----------------|
| `src/utils/timelineCalculations.ts` | Snapshot generation logic |
| `src/utils/transactionCalculations.ts` | Delta calculation logic |
| `src/types/timeline.ts` | Data structures |
| `src/utils/excelExport.ts` | Add timeline sheets to export |
| `src/components/HorizontalSwimLaneTimeline.tsx` | Snapshot generation happens here |

---

## Tests to Verify

```bash
npm run test:run -- timelineCalculations.test.ts
npm run test:run -- transactionCalculations.test.ts
npm run test:run -- HorizontalSwimLaneTimeline.test.tsx
```

---

## Notes

- Snapshots are generated reactively (not stored/cached)
- Each participant can have multiple snapshots (one per event date they're involved in)
- Transaction calculation reuses existing portage formulas
- Circular dependency avoided: transactionCalculations.ts has local TimelineSnapshot copy
