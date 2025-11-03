# Continuous Timeline Redesign - Architecture Document

**Date:** 2025-11-02
**Status:** Approved Design
**Replaces:** Phase-based timeline approach

---

## Problem Statement

The initial phase-based timeline implementation has architectural flaws:
1. **Type duplication:** `Participant` vs `ParticipantDetails` (95% identical)
2. **Unclear integration:** No strategy to merge calculator and timeline UIs
3. **Wrong mental model:** Discrete phases don't match continuous participant timelines
4. **Missing domain concepts:** No `isFounder`, no per-participant entry dates, no portage tracking

## Core Requirements

1. **Timeline is primary:** Calculator is just "Phase 0 preview" - timeline is the application
2. **Continuous model:** Participants enter/exit at any time, not discrete phases
3. **Per-transaction calculations:** Resale prices computed per sale based on holding duration
4. **Portage by founders:** Only founders (`isFounder=true`) can carry extra lots
5. **Copropriété entity:** Permanent entity holding hidden lots, paying monthly obligations

## Domain Model (Unified)

### Participant

```typescript
interface Participant {
  // Identity
  name: string;
  isFounder: boolean;      // Only founders can do portage
  entryDate: Date;         // When they joined project
  exitDate?: Date;         // If they left

  // Financial details
  capitalApporte: number;
  notaryFeesRate: number;
  interestRate: number;
  durationYears: number;

  // Lots owned (own + portage)
  lotsOwned: Lot[];

  // Optional customizations
  parachevementsPerM2?: number;
  cascoSqm?: number;
  parachevementsSqm?: number;
}
```

**Key changes from old model:**
- Added `isFounder`, `entryDate`, `exitDate`
- Changed `quantity: number` to `lotsOwned: Lot[]` (explicit tracking)
- Removed `unitId` and `surface` (now per-lot)

### Lot

```typescript
interface Lot {
  lotId: number;
  surface: number;
  unitId: number;
  isPortage: boolean;      // True if carrying for someone else
  acquiredDate: Date;

  // If sold
  soldDate?: Date;
  soldTo?: string;
  salePrice?: number;
  carryingCosts?: number;  // Accumulated if isPortage=true
}
```

### Copropriété Entity

```typescript
interface CoproEntity {
  name: string;
  lotsOwned: CoproLot[];   // Hidden lots held collectively
  cashReserve: number;
  loans: Loan[];
  monthlyObligations: {
    loanPayments: number;
    insurance: number;          // 2000€/year
    accountingFees: number;     // 1000€/year
    maintenanceReserve: number;
  };
}

interface CoproLot {
  lotId: number;
  surface: number;
  acquiredDate: Date;      // Usually T0
  soldDate?: Date;
  soldTo?: string;
  salePrice?: number;
  totalCarryingCosts?: number;  // Insurance + accounting from acquired → sold
}
```

### Shared Types (No Changes)

- `ProjectParams` - Already good
- `Scenario` - Already good
- `UnitDetails` - Already good
- `Loan` - Already good

## Event Model (Continuous Timeline)

Events remain the source of truth, but interpreted differently:

### Event Types

1. **INITIAL_PURCHASE** - Founders join at T0
2. **NEWCOMER_JOINS** - Non-founder joins after T0
3. **PORTAGE_LOT_SOLD** - Founder sells portage lot to newcomer
4. **HIDDEN_LOT_SOLD** - Copro sells hidden lot
5. **COPRO_TAKES_LOAN** - Copro borrows for collective work
6. **PARTICIPANT_EXITS** - Someone leaves (sells all lots)

### Per-Transaction Calculations

```typescript
function calculateSalePrice(
  lot: Lot,
  seller: Participant,
  saleDate: Date
): SalePrice {
  const monthsHeld = monthsBetween(lot.acquiredDate, saleDate);
  const yearsHeld = monthsHeld / 12;

  return {
    base: lot.originalPrice,
    indexation: calculateIndexation(lot.originalPrice, yearsHeld),
    carryingCosts: lot.isPortage
      ? calculateMonthlyCarryingCost(lot, seller) * monthsHeld
      : 0,
    feeRecovery: yearsHeld <= 2
      ? seller.originalNotaryFees * 0.6
      : 0,
    total: /* sum */
  };
}
```

**Key:** Duration matters. Calculate at transaction time, not by phase.

## UI Architecture (Option B - Table View)

### Layout Structure

```
┌─────────────────────────────────────────────────────────────┐
│  Timeline (Horizontal, not to scale)                        │
│  ●────────────●──────────────●────────────────────→         │
│  T0          T+2yr         T+4yr                   Now      │
│  [Events as markers: clickable for details]                 │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  Participants Table (Always visible, current layout)        │
│  ┌─────────┬─────┬────────┬─────────┬──────┬──────────┐    │
│  │ Name    │Entry│Lots    │Capital  │Loan  │Status    │    │
│  ├─────────┼─────┼────────┼─────────┼──────┼──────────┤    │
│  │Buyer A  │T0   │1 (own) │50k      │143k  │Active    │    │
│  │ └► Cash Flow Details (collapsible)                  │    │
│  │Buyer B  │T0   │1 own,  │170k     │200k  │Portage   │    │
│  │         │     │1 port. │         │      │          │    │
│  │ └► Cash Flow Details (collapsible)                  │    │
│  │Emma     │T+2  │1 (own) │40k      │145k  │Active    │    │
│  │ └► Cash Flow Details (collapsible)                  │    │
│  └─────────┴─────┴────────┴─────────┴──────┴──────────┘    │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  Copropriété Panel (Collapsible)                            │
│  Cash Reserve: 12,000€  │  Lots: 2 hidden  │  Loans: 50k   │
│  Monthly: 250€ (insurance + accounting + loan)              │
│  └► Detailed cash flow visualization                        │
└─────────────────────────────────────────────────────────────┘
```

### UI Features

1. **Timeline (Horizontal Scroll)**
   - Event markers as dots on timeline
   - Click marker → show transaction details
   - Not to scale (visual representation only)
   - Responsive: scroll on mobile, full width on desktop

2. **Participants Table (Preserved Layout)**
   - Reuse existing `EnDivisionCorrect.tsx` table structure
   - Show ALL participants (past and present)
   - Status badges: Active, Portage, Exited
   - Collapsible cash flow per participant

3. **Copropriété Panel**
   - Separate collapsible section
   - Cash reserve, lots owned, loans
   - Monthly obligations breakdown
   - In/out flow visualization

## Migration Strategy

### What to Keep (~80% of code)

**Can salvage:**
- ✅ Event handlers (794 lines) - logic is sound, just adjust types
- ✅ Portage calculations (200 lines) - formulas are correct
- ✅ UI components (776 lines) - refactor for new layout
- ✅ Tests (1,342 lines) - update fixtures, logic stays
- ✅ Calculator engine (458 lines) - already shared

**Must rewrite:**
- ❌ Type system (eliminate `ParticipantDetails`)
- ❌ Phase projection (replace with continuous timeline)
- ❌ Integration layer (add calculator → timeline bridge)

### Implementation Approach

1. **Type unification** (1-2 hours)
   - Define unified `Participant` with `isFounder`, `entryDate`, `lotsOwned`
   - Remove `ParticipantDetails`
   - Update all event interfaces
   - Run tests, fix type errors

2. **Continuous timeline projection** (3-4 hours)
   - Replace phase-based `projectTimeline()` with continuous model
   - Calculate per-participant timelines from events
   - Per-transaction sale price calculations
   - Update tests

3. **UI refactor** (4-6 hours)
   - Merge calculator table layout with timeline view
   - Horizontal timeline with event markers
   - Collapsible sections for cash flows
   - Copropriété panel

4. **Integration** (2-3 hours)
   - Calculator form creates INITIAL_PURCHASE event
   - Single data model, no duplication
   - Export/import timeline JSON

## Success Criteria

- [ ] Single `Participant` type (no `ParticipantDetails`)
- [ ] Per-transaction resale price calculations working
- [ ] Continuous timeline (not phases)
- [ ] Portage tracking (`isFounder`, `Lot.isPortage`)
- [ ] Copropriété as permanent entity
- [ ] UI shows table + timeline + copro panel
- [ ] All tests passing (156+ tests)
- [ ] Calculator → timeline integration working

## Risks & Mitigations

**Risk:** Breaking existing calculator functionality
**Mitigation:** Keep calculator code, add timeline on top. Feature flag for rollout.

**Risk:** Type changes break tests massively
**Mitigation:** TDD - update types, watch tests fail, fix systematically.

**Risk:** UI redesign takes longer than estimated
**Mitigation:** Ship backend first (API-complete), iterate on UI separately.

## References

- Habitat Beaver Guide: `/Users/dragan/Documents/BEAVER/ferme-du-temple/src/content/habitat-beaver-guide.md`
- Existing calculator: `src/utils/calculatorUtils.ts`
- Current timeline (to replace): `src/utils/chronologyCalculations.ts`
- Portage formulas (keep): `src/utils/portageCalculations.ts`
