# Timeline Snapshots & Excel Export Architecture

## Overview

This document explains the complete flow of timeline snapshots (temporal financial states) and how they integrate with the Excel export system in Credit Castor.

---

## 1. Timeline Snapshot Data Structure

### Primary Snapshot Types

#### `TimelineSnapshot` (src/utils/timelineCalculations.ts)
Represents a participant's financial state at a specific point in time.

```typescript
interface TimelineSnapshot {
  date: Date
  participantName: string
  participantIndex: number
  totalCost: number              // Total cost of ownership
  loanNeeded: number             // Loan required (totalCost - capital)
  monthlyPayment: number         // Monthly loan payment
  isT0: boolean                  // Is this the initial purchase event?
  colorZone: number              // For visual grouping of related events
  transaction?: TimelineTransaction  // Financial delta from event
  showFinancingDetails: boolean  // Hide details for redistribution-only cards
}
```

**When created:** For each affected participant at each unique date (T0, portage sales, copro sales, etc.)

**Key feature:** Embeds `TimelineTransaction` object containing the financial delta

---

#### `CoproSnapshot` (src/utils/timelineCalculations.ts)
Represents copropriété (condominium) inventory and reserves at a specific date.

```typescript
interface CoproSnapshot {
  date: Date
  availableLots: number          // Unsold lots still owned by copro
  totalSurface: number           // Remaining surface area
  soldThisDate: string[]         // Names of buyers who purchased this date
  reserveIncrease: number        // 30% of sale proceeds (copro allocation)
  colorZone: number              // Visual grouping index
}
```

**When created:** Only when copro inventory changes (lots sold to newcomers)

---

### Supporting Data Structure: TimelineTransaction

Embedded in `TimelineSnapshot`, represents the financial impact of a transaction.

```typescript
interface TimelineTransaction {
  type: 'portage_sale' | 'copro_sale' | 'founder_entry'

  // Common fields
  buyer?: string
  date?: Date

  // Portage sale fields (lot sold between participants)
  seller?: string
  lotPrice?: number              // Total resale price
  indexation?: number            // Price increase from indexation
  carryingCosts?: number         // Accumulated carrying costs
  registrationFees?: number

  // Copro sale fields (lot sold from copropriété reserves)
  surfacePurchased?: number
  distributionToCopro?: number   // 30% of sale price
  distributionToParticipants?: Map<string, number>  // 70% split by quotité

  // Financial delta
  delta: {
    totalCost: number            // Change in total cost
    loanNeeded: number           // Change in loan needed
    reason: string               // Human-readable description
  }
}
```

---

## 2. Timeline Snapshot Generation Flow

### Step 1: Extract Unique Dates
**Function:** `getUniqueSortedDates(participants, deedDate)`

```typescript
// Gets all unique entry dates across all participants
// Sorts chronologically: T0, newcomer 1 entry, newcomer 2 entry, etc.
const dates = getUniqueSortedDates(participants, deedDate)
// Output: [2026-02-01, 2027-06-01, 2028-12-01]
```

### Step 2: For Each Date, Generate Snapshots
**Function:** `generateParticipantSnapshots(participants, calculations, deedDate, formulaParams)`

For each date:
1. Find participants joining at this exact date
2. Determine who is affected:
   - **T0:** All founders
   - **Portage sale:** Buyer + seller + anyone getting redistribution
   - **Copro sale:** Buyer + all active founders (shared costs redistribute)
3. Create snapshot for each affected participant
4. Calculate transaction if participant is involved in event

### Step 3: Transaction Calculation
**Functions:** `calculatePortageTransaction()`, `calculateCooproTransaction()`

**Portage Sale:**
```
lotPrice = basePrice + indexation + carryingCosts
sellerDelta = -lotPrice  (negative = cost reduction)
buyerDelta = +lotPrice   (positive = cost increase)
```

**Copro Sale:**
```
salePrice = buyer's purchase price
70% distribution = salePrice × 0.70
30% to reserves  = salePrice × 0.30

founderShare = 70% distribution × (founderSurface / totalFounderSurface)
founderDelta = -founderShare  (negative = cash received)
```

---

## 3. Lot Details Pattern (from timeline.ts)

Each participant can own multiple lots:

```typescript
interface Lot {
  lotId: number
  surface: number
  unitId: number
  isPortage: boolean
  acquiredDate: Date
  originalPrice?: number           // T0 purchase share
  originalNotaryFees?: number
  originalConstructionCost?: number
  monthlyCarryingCost?: number

  // Portage configuration
  allocatedSurface?: number
  founderPaysCasco?: boolean       // Founder covers CASCO during portage
  founderPaysParachèvement?: boolean

  // Sale tracking
  soldDate?: Date
  soldTo?: string
  salePrice?: number
  carryingCosts?: number
}
```

**Usage in snapshots:** When a portage lot is sold, the exact `lotId` identifies which lot was transferred.

---

## 4. Current Excel Export Structure

### High-Level Flow

```
CalculationResults + Participants
           ↓
buildExportSheetData()  (pure function)
           ↓
SheetData { cells[], columnWidths[] }
           ↓
ExportWriter (interface)
  ├─ XlsxWriter (production)
  └─ CsvWriter (testing)
           ↓
.xlsx or CSV output
```

### SheetData Structure

```typescript
interface SheetData {
  name: string                    // "Calculateur Division"
  cells: SheetCell[]             // Grid of data
  columnWidths?: ColumnWidth[]   // Column sizing
}

interface SheetCell {
  row: number
  col: string                     // 'A', 'B', 'AA', etc.
  data: {
    value?: string | number | null
    formula?: string             // Excel formula like "=B5/B6"
  }
}

interface ColumnWidth {
  col: number                     // 0-based index
  width: number                   // Width in characters
}
```

### Current Excel Export Sections

**Current export covers:**
1. Header (title, date)
2. Project parameters (total purchase, total surface, price/m²)
3. Shared costs (mesures, demo, infrastructure, études, etc.)
4. Expense category details (conservatoire, habitabilité, premier travaux)
5. Common works (travaux communs breakdown)
6. Unit details (optional, if provided)
7. Cost decomposition summary
8. **Participant detail header row** (38+ columns!)
9. Participant data rows (1 per participant)
10. Totals row
11. Summary section (global synthesis)

### Participant Columns (A to AM = 39 columns!)

| Col | Field | Content |
|-----|-------|---------|
| A | Name | Participant name |
| B | Unit ID | unitId |
| C | Surface | Surface area |
| D | Qty | Quantity of lots |
| E | Capital | Capital apporte |
| F-H | Loan terms | Interest rate, duration |
| I | Purchase share | Formula: C×pricePerM² |
| J | Notary fees | Calculated |
| K-M | Construction | CASCO, parachèvements, travaux communs |
| N | Construction total | Formula |
| O | Commun | Shared infrastructure |
| P | Total cost | Formula: I+J+N+O |
| Q | Loan needed | Formula: P-E |
| R | Monthly payment | PMT formula |
| S | Total repaid | R×duration |
| T | Personal reno | personalRenovationCost |
| U-X | Override fields | parachevementsPerM2, cascoSqm, etc. |
| Y | Founder | "Oui"/"Non" |
| Z | Entry date | entryDate formatted |
| AA | Lots owned | "Lot 1, Lot 2 (portage)" |
| AB | Sold dates | When portage lots were sold |
| AC-AE | Purchase details | buyingFrom, lotId, purchasePrice |
| AF-AK | Two-loan financing | loan amounts, durations |
| AL-AM | Constructor pays | founderPaysCasco, founderPaysParachèvement |

---

## 5. Timeline Data Usage in Current Export

Currently, **timeline-specific data is included but not organized as timeline snapshots:**

```typescript
// In buildExportSheetData():

// Timeline fields are added to participant rows:
addCell(r, 'Y', p.isFounder ? 'Oui' : 'Non')
addCell(r, 'Z', p.entryDate ? new Date(p.entryDate).toLocaleDateString('fr-BE') : '')

// Portage lots details
if (p.lotsOwned && p.lotsOwned.length > 0) {
  const lotDetails = p.lotsOwned
    .map(lot => `Lot ${lot.lotId}${lot.isPortage ? ' (portage)' : ''}: ${lot.surface}m²`)
    .join('; ')
  addCell(r, 'AA', lotDetails)
  
  // Sold dates
  const soldDates = p.lotsOwned
    .filter(lot => lot.soldDate)
    .map(lot => `Lot ${lot.lotId}: ${new Date(lot.soldDate!).toLocaleDateString('fr-BE')}`)
    .join('; ')
  addCell(r, 'AB', soldDates || '')
}

// Purchase details (for newcomers)
addCell(r, 'AC', p.purchaseDetails?.buyingFrom || '')
addCell(r, 'AD', p.purchaseDetails?.lotId || '')
addCell(r, 'AE', p.purchaseDetails?.purchasePrice || '')
```

**Missing:** Timeline snapshots and transaction deltas are **not currently exported**

---

## 6. Key Functions Involved

### Snapshot Generation
- **`generateParticipantSnapshots()`** - Main function, returns Map<participantName, TimelineSnapshot[]>
- **`generateCoproSnapshots()`** - Generates copro inventory snapshots
- **`getUniqueSortedDates()`** - Extracts and sorts event dates
- **`determineAffectedParticipants()`** - Identifies who is impacted by each event

### Transaction Calculations
- **`calculatePortageTransaction()`** - Computes lot price and deltas for portage sales
- **`calculateCooproTransaction()`** - Computes distribution deltas for copro sales
- **`createCoproSaleTransactions()`** - Generates multi-party transactions for copro events

### Export Building
- **`buildExportSheetData()`** - Converts CalculationResults to Excel sheet structure
- **`exportCalculations()`** - Orchestrates export using ExportWriter

### Formula Reuse
- **`calculateResalePrice()`** - Portage formula: base + indexation + carrying costs
- **`calculateCarryingCosts()`** - Monthly interest + property tax + insurance × months held

---

## 7. Integration Points

### Where Snapshots Are Used
1. **HorizontalSwimLaneTimeline.tsx** - Renders timeline cards with snapshot data
2. **TimelineCardsArea.tsx** - Displays participant and copro cards
3. **ParticipantLane.tsx** - Individual participant timeline lane
4. **CoproLane.tsx** - Copropriété reserves lane

### Where Export Happens
1. **EnDivisionCorrect.tsx** - Main calculator component, exports via button
2. **excelExport.ts** - Pure function `buildExportSheetData()` and `exportCalculations()`
3. **exportWriter.ts** - Interface abstraction, XlsxWriter + CsvWriter implementations

### Data Flow
```
Calculator Input
  ├─ Participants[]
  ├─ ProjectParams
  └─ UnitDetails
       ↓
   calculateAll()  [in calculatorUtils.ts]
       ↓
   CalculationResults
       ├─ participantBreakdown[]  (used by BOTH)
       ├─ totalSurface
       └─ sharedCosts
         ↙         ↘
    Timeline        Excel
    Snapshots      Export
       ↓              ↓
  generateParticipant  buildExportSheetData()
    Snapshots()           ↓
       ↓              SheetData
  TimelineSnapshot[]  (cells + widths)
  (with transactions)      ↓
       ↓              ExportWriter
  HorizontalSwimLane   ├─ XlsxWriter
  Timeline.tsx         └─ CsvWriter
```

---

## 8. Key Characteristics

### Timeline Snapshots
- **When created:** Reactively at each unique date
- **Scope:** Per-participant financial state
- **Contains:** Absolute values (totalCost, loanNeeded, monthlyPayment) + transaction delta
- **Frequency:** Multiple snapshots per participant if events occur at different dates
- **Computation:** Uses existing `calculateAll()` results, adds transaction logic

### Excel Export
- **When created:** On user action (export button)
- **Scope:** Single flat sheet with all participant data
- **Contains:** Timeline fields (isFounder, entryDate, lotsOwned, purchaseDetails) but NOT snapshot history
- **Frequency:** Single snapshot in time (current state)
- **Computation:** Builds cell grid from CalculationResults + ProjectParams

### Transaction Objects
- **Scope:** Single event (one lot sale, one copro sale)
- **Contains:** Calculated delta (totalCost, loanNeeded, reason)
- **Embedded in:** TimelineSnapshot objects
- **Calculation:** Pure functions using existing portage formulas

---

## 9. Important Notes

1. **Circular dependency prevention:**
   - `transactionCalculations.ts` has local TimelineSnapshot interface copy
   - Avoids importing from timeline.ts to prevent circular imports

2. **Lot identification:**
   - Portage sales are matched via `lotId` in `purchaseDetails`
   - Exact lot object is found via `seller.lotsOwned.find(lot => lot.lotId === buyerLotId)`

3. **Surface tracking:**
   - T0: Each participant gets one "own" lot + N-1 "portage" lots
   - Sales: Portage lots are transferred between participants
   - Copro sales: Surface is removed from copro inventory, added to participant ownership

4. **Color zones:**
   - Group related events visually
   - Each unique date gets a color zone index (0, 1, 2, ...)
   - Related cards (buyer + seller at same date) share colorZone

5. **Financing details visibility:**
   - Shown for: T0 founders + direct buyers (portage/copro)
   - Hidden for: Portage sellers + redistribution-only affected participants

---

## 10. Files Summary

| File | Purpose | Key Exports |
|------|---------|-------------|
| `src/types/timeline.ts` | Type definitions | TimelineSnapshot, CoproSnapshot, TimelineTransaction, Lot, etc. |
| `src/utils/timelineCalculations.ts` | Snapshot generation | generateParticipantSnapshots(), generateCoproSnapshots(), determineAffectedParticipants() |
| `src/utils/transactionCalculations.ts` | Delta calculations | calculatePortageTransaction(), calculateCooproTransaction(), createCoproSaleTransactions() |
| `src/utils/excelExport.ts` | Export builder | buildExportSheetData(), exportCalculations() |
| `src/utils/exportWriter.ts` | Writer abstraction | ExportWriter interface, XlsxWriter, CsvWriter |
| `src/utils/calculatorUtils.ts` | Core calculations | calculateAll() [input to snapshots and export] |
| `src/components/HorizontalSwimLaneTimeline.tsx` | Timeline UI | Generates snapshots, renders cards |
| `src/components/timeline/*.tsx` | Timeline lanes | ParticipantLane, CoproLane, TimelineCardsArea, TimelineHeader |

---

## 11. Next Steps for Excel Export Enhancement

To include timeline snapshots in the export, you would:

1. Create additional sheets per participant showing their snapshot history
2. For each TimelineSnapshot at each date, add a row showing:
   - Date
   - Total cost at that point
   - Loan needed
   - Monthly payment
   - Transaction delta (if applicable)
   - Transaction reason

3. Create a copro reserves sheet showing CoproSnapshot history

4. Maintain the current flat sheet as "Current State" and add timeline sheets

---

## Diagram: Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│ Calculator Input (Participants[], ProjectParams, etc.)     │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ├─→ calculateAll()
                   │       ↓
                   │   CalculationResults
                   │   (participantBreakdown[])
                   │
         ┌─────────┴──────────┐
         ↓                    ↓
   Timeline Logic        Excel Export
         │                    │
    (React Component)    (buildExportSheetData)
         │                    │
    ┌────┴──────┐         ┌───┴────┐
    │            │         │        │
generateParticipant   buildSheetCells
 Snapshots()        addFormulas
    │            │    formatColumns
    ↓            ↓         ↓
Snapshot[]  CoproSnapshot[] SheetData{}
  + Trans          │        {cells, widths}
                   │             │
              ┌────┴─────────────┤
              │                  │
        HorizontalSwimLane   ExportWriter
        Timeline.tsx         {XlsxWriter,
        (renders cards)       CsvWriter}
                                 │
                                 ↓
                         .xlsx or CSV file
```

