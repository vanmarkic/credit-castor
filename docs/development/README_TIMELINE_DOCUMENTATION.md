# Timeline & Export Documentation

## Overview

This folder contains comprehensive documentation about Credit Castor's timeline snapshot system and Excel export architecture.

## Documents Included

### 1. TIMELINE_SNAPSHOT_IMPLEMENTATION_SUMMARY.md
**Purpose:** Complete implementation reference  
**Contents:**
- What has been implemented (types, snapshots, transactions, React integration, export)
- Data structures in detail with code examples
- Architecture decisions and rationale
- Current export columns explained
- Example: How snapshots are created (T0 with 2 founders, newcomer joins)
- Files and their roles
- Integration with existing systems
- Testing coverage

**Best for:** Understanding the complete system, implementation details, architecture decisions

**Read this when:** You need to understand how everything fits together, implementing new features in snapshot or export system

---

### 2. timeline-snapshots-export-architecture.md
**Purpose:** Detailed architecture and data flow documentation  
**Contents:**
- Timeline snapshot data structures (TimelineSnapshot, CoproSnapshot)
- TimelineTransaction structure and semantics
- Snapshot generation flow (3 steps)
- Lot details pattern
- Current Excel export structure (4-section flow, 39+ columns)
- Key functions involved (snapshot generation, transactions, export)
- Integration points
- Key characteristics and important notes
- Files summary
- Next steps for enhancement
- Complete data flow diagram

**Best for:** Learning the architecture, understanding data flow, integration points

**Read this when:** You need to understand how snapshots relate to export, planning architectural changes, integrating new systems

---

### 3. timeline-snapshot-quick-reference.md
**Purpose:** Quick lookup and cheat sheet  
**Contents:**
- Core interfaces (TimelineSnapshot, TimelineTransaction, CoproSnapshot, Lot)
- Key functions (generateParticipantSnapshots, calculatePortageTransaction, etc.)
- Data flow summary diagram
- Common patterns (checking if buying, finding which lot, calculating quotité, delta interpretation)
- Timeline snapshot lifecycle (T0, portage sale, copro sale, redistribution)
- Export integration summary
- Color zones explanation
- Critical files table
- Test commands

**Best for:** Quick lookups, code examples, common patterns

**Read this when:** You need to remember a specific structure, function signature, or pattern; implementing a feature that uses timeline snapshots

---

## Key Files in Codebase

### Type System
- `/src/types/timeline.ts` - All timeline type definitions (400 lines)

### Calculation & Logic
- `/src/utils/timelineCalculations.ts` - Snapshot generation (395 lines)
- `/src/utils/transactionCalculations.ts` - Transaction delta calculations (257 lines)
- `/src/utils/calculatorUtils.ts` - Core calculation engine

### Export System
- `/src/utils/excelExport.ts` - Excel sheet building (351 lines)
- `/src/utils/exportWriter.ts` - Writer abstraction: XlsxWriter + CsvWriter (192 lines)

### React Components
- `/src/components/HorizontalSwimLaneTimeline.tsx` - Main timeline component
- `/src/components/timeline/` - Supporting components (lanes, cards, header)

---

## Quick Start

### Understanding the System
1. Start with `timeline-snapshot-quick-reference.md` for core concepts
2. Read `timeline-snapshots-export-architecture.md` for data flow
3. Consult `TIMELINE_SNAPSHOT_IMPLEMENTATION_SUMMARY.md` for details

### Implementing a Feature
1. Check `timeline-snapshot-quick-reference.md` for patterns
2. Reference `TIMELINE_SNAPSHOT_IMPLEMENTATION_SUMMARY.md` for how to extend
3. Look at existing tests in `/src/utils/timelineCalculations.test.ts`

### Enhancing Excel Export
1. Read section "5. Timeline Data Usage in Current Export" in architecture doc
2. Check "11. Next Steps for Excel Export Enhancement" in architecture doc
3. Review `src/utils/excelExport.ts` to understand current structure

---

## Data Structures at a Glance

### TimelineSnapshot (Participant Financial State)
```typescript
{
  date: Date,
  participantName: string,
  totalCost: number,
  loanNeeded: number,
  monthlyPayment: number,
  isT0: boolean,
  colorZone: number,
  transaction?: TimelineTransaction,
  showFinancingDetails: boolean
}
```

### TimelineTransaction (Financial Delta)
```typescript
{
  type: 'portage_sale' | 'copro_sale',
  delta: {
    totalCost: number,
    loanNeeded: number,
    reason: string
  },
  // Type-specific fields...
}
```

### CoproSnapshot (Copropriété State)
```typescript
{
  date: Date,
  availableLots: number,
  totalSurface: number,
  soldThisDate: string[],
  reserveIncrease: number,
  colorZone: number
}
```

---

## Key Concepts

### Portage Sale
- Founder (seller) transfers a lot to newcomer (buyer)
- Lot price = original cost + indexation + carrying costs
- Seller delta: negative (cost reduction)
- Buyer delta: positive (cost increase)

### Copro Sale
- Newcomer purchases a lot from copropriété reserves
- 30% of sale price → copro reserves
- 70% distributed to founders by surface quotité
- Founder delta: negative (cash received)

### Color Zones
- Visual grouping of related events
- Each unique date gets a color zone index (0, 1, 2...)
- Related cards (buyer + seller at same date) share colorZone

### Snapshot vs Transaction
- **Snapshot:** Point-in-time financial state of a participant
- **Transaction:** Financial delta embedded in snapshot, describing what changed

---

## Common Questions

**Q: Where do I find the snapshot generation code?**  
A: `src/utils/timelineCalculations.ts`, function `generateParticipantSnapshots()`

**Q: How is transaction delta calculated?**  
A: `src/utils/transactionCalculations.ts`, functions `calculatePortageTransaction()` and `calculateCooproTransaction()`

**Q: Are snapshots stored or generated on-demand?**  
A: Generated on-demand in React components using `useMemo`. Not persisted.

**Q: How do snapshots integrate with Excel export?**  
A: Currently, only timeline fields (isFounder, entryDate, lotsOwned) are exported. Snapshot history is NOT exported.

**Q: How can I add snapshot history to Excel export?**  
A: See section "11. Next Steps for Excel Export Enhancement" in architecture document.

**Q: Why does transactionCalculations.ts have a local TimelineSnapshot copy?**  
A: Circular dependency prevention. Allows transaction logic to be independent of type definitions.

---

## Testing

```bash
# Run all timeline-related tests
npm run test:run -- timelineCalculations.test.ts
npm run test:run -- transactionCalculations.test.ts
npm run test:run -- HorizontalSwimLaneTimeline.test.tsx
npm run test:run -- excelExport.test.ts

# Run full test suite
npm run test:run
```

---

## Related Documentation

- `CLAUDE.md` - Project guidelines and architecture principles
- `docs/plans/2025-11-04-transaction-driven-timeline-implementation.md` - Implementation plan
- `docs/analysis/` - Business logic validation and analysis documents

---

## Last Updated

Generated: November 11, 2025

These documents capture the complete timeline snapshot and export architecture as implemented. They are accurate as of the current codebase state.

