# Horizontal Swimlane Timeline Design

**Date:** 2025-11-04
**Status:** Approved
**Type:** UI Enhancement

## Overview

Transform the participant financial view from a vertical list into a horizontal swimlane timeline. This visualization shows how each participant's finances evolve over time and makes clear the impact of events (newcomers joining, lot sales) on everyone's financial positions.

## Problem Statement

The current vertical list shows participants' current financial state but doesn't illustrate:
- Temporal progression (who joined when, what happened)
- How one person's actions affect others' finances
- The copropriété's evolving inventory and financial position
- Historical context for financial decisions

## Solution: Horizontal Swimlane Timeline

### Visual Layout

```
[Fixed: Names]     |  [Scrollable: Timeline →]
──────────────────────────────────────────────────────
La Copropriété     |  [T0] [Event 1] [Event 2]...
Manuela/Dragan     |  [T0] [Event 1]...
Cathy/Jim          |  [T0]...
Annabelle/Colin    |  [T0] [Event 3]...
```

**Key characteristics:**
- Time flows left to right (not to scale - events spaced for readability)
- Copropriété lane pinned at top
- Participant names in sticky left column (stays visible during horizontal scroll)
- Cards appear at moments when participant's finances change
- Desktop-only implementation (no responsive design needed)

### Card Types & Content

#### T0 Cards (Initial State)
- First card in each lane = baseline at deed date
- **Clickable button** opening ParticipantDetailModal
- Displays:
  - Participant name
  - Unit info (e.g., "Unité 3 • 150m²")
  - Coût Total: 466,202€
  - À emprunter: 316,202€ (red background)
  - Mensualité: 1,617€
- Visual affordance: "Click for details" styling

#### Event Cards (T+1, T+2, etc.)
- Appear when an event affects this participant
- Display same three metrics for consistency
- **Delta indicator**: "📉 -2,500€ coût total" (green if decrease, red if increase)
- **Context badge**: "🔄 Alice purchased from Bob" or "👋 New participant joined"
- Clickable: Opens event-specific popup (NOT full participant editor)

#### Copropriété Cards
Hybrid inventory + cash flow display:
- Available lots: "3 lots • 450m² total"
- Total inventory value: "680,000€"
- Cash position: "Balance: +50,000€"
- Delta: "Sold Unit 5 to Alice → -150m²"

### Visual Design

**Color-coded background zones:**
- Related cards (same event affecting multiple people) share subtle background tint
- Groups changes visually without cluttering with lines/arrows

**Color scheme:**
- Founders: Green accent
- Newcomers: Blue accent
- Copropriété: Purple accent (distinct from individuals)

**Card dimensions:**
- Width: ~200-250px
- Height: ~120px
- Compact but readable

### Timeline Generation Logic (KISS Approach)

**Simple principle:** Use existing participant data, no new systems.

**Data we already have:**
- `participants[]` with `entryDate` field
- `participants[].purchaseDetails` with `buyingFrom`
- Pure function `calculateAll()` that computes everyone's finances

**Timeline generation:**
1. Group participants by unique `entryDate` values
2. For each date, that's a "moment" in time
3. Run `calculateAll()` to get everyone's finances at that moment
4. Display as cards in horizontal lanes
5. Compare to previous moment to show deltas

**Data structures (minimal):**

```typescript
interface TimelineSnapshot {
  date: Date;
  participantName: string;
  totalCost: number;
  loanNeeded: number;
  monthlyPayment: number;
  isT0: boolean; // First card (clickable for full details)
  delta?: {
    totalCost: number;
    reason: string; // e.g., "Alice joined"
  };
}
```

**Simple algorithm:**
```typescript
function generateTimeline(participants, calculations) {
  const snapshots = [];
  const dates = [...new Set(participants.map(p => p.entryDate))].sort();

  dates.forEach((date, idx) => {
    const activeParticipants = participants.filter(p => p.entryDate <= date);
    const calc = calculateAll(activeParticipants, ...);

    activeParticipants.forEach((p, pIdx) => {
      const breakdown = calc.participantBreakdown[pIdx];
      snapshots.push({
        date,
        participantName: p.name,
        totalCost: breakdown.totalCost,
        loanNeeded: breakdown.loanNeeded,
        monthlyPayment: breakdown.monthlyPayment,
        isT0: idx === 0 && p.isFounder,
        delta: calculateDelta(/* compare to previous */)
      });
    });
  });

  return snapshots;
}
```

**That's it.** No event sourcing, no state machine, just visualization of existing data.

## Component Architecture

### Component Hierarchy (Simplified)

**Single component approach:**

```
HorizontalSwimLaneTimeline.tsx
├── Generates snapshots inline using useMemo
├── Renders sticky name column (CSS)
├── Renders swimlanes (map over participants)
└── Renders cards (map over snapshots per participant)
```

**That's it.** No separate utility files, no complex hierarchy. One component file.

### Component Responsibilities

**`HorizontalSwimLaneTimeline.tsx`**:
- Props: `participants`, `projectParams`, `calculations`, `deedDate`, `onOpenParticipantDetails`
- `useMemo` to generate snapshots from participants
- Renders: Sticky name column + horizontal scrollable lanes
- Click T0 card → calls `onOpenParticipantDetails(participantIndex)`
- Click other cards → shows simple tooltip (can add popup later if needed)

### Integration Points

- **Reuses** `ParticipantDetailModal` (already exists, opens via `onOpenParticipantDetails`)
- **Reuses** `calculateAll()` from `calculatorUtils.ts`
- **No new files needed** beyond the one component

### Replacement Strategy

**In EnDivisionCorrect.tsx:**
- Remove the entire vertical "Besoins de Financement Individuels" section (lines 541-667)
- Replace with new `<HorizontalSwimLaneTimeline />` component
- Keep the header section above (cost breakdown) unchanged
- Keep the "Ajouter un·e participant·e" button functionality

## User Interactions

### Card Clicks

**T0 cards (initial state):**
- Click → Opens `ParticipantDetailModal` with full financial details
- Can edit participant settings from modal
- Same behavior as current vertical list

**Event cards (T+1, T+2, etc.):**
- Click → Opens `EventPopup` showing:
  - Event description
  - Transaction details (if lot purchase/sale)
  - Shared cost redistribution breakdown
  - Delta calculation explanation
- Read-only, contextual information

**Copropriété cards:**
- Click → Shows available lots details
- Cash flow breakdown
- Transaction history

### Visual Feedback

**Hover states:**
- T0 cards: Lift shadow, show "Click for full details" tooltip
- Event cards: Lift shadow, show "Click to see event details" tooltip
- Color zones: Slightly brighten background when hovering any card in zone

**Keyboard navigation:**
- Tab through cards
- Enter to open details
- ARIA labels: "Timeline card for {name} at {date}"

## Testing Strategy

### Component Tests (Simple)

**`HorizontalSwimLaneTimeline.test.tsx`:**
- Renders with sample participants
- Generates snapshots correctly (founders at T0, newcomers later)
- Clicking T0 card calls `onOpenParticipantDetails` with correct index
- Shows delta badges when finances change
- Basic rendering (no need to test CSS layout in detail)

**That's sufficient.** Keep tests focused on logic, not styling.

## Edge Cases

| Scenario | Handling |
|----------|----------|
| No events after T0 | Timeline shows only initial cards, no horizontal scroll |
| Participant with no changes | Lane shows only T0 card even if others have events |
| Simultaneous events | Multiple participants joining same day = same color zone |
| Copro starts empty | Show "No initial inventory" in T0 card |
| Very long timeline | Add "jump to date" controls if > 10 events |

## Implementation Plan (Simplified)

### Step 1: Build the component (TDD)
1. Create `src/components/HorizontalSwimLaneTimeline.tsx`
2. Write a test that renders with sample participants
3. Implement snapshot generation (useMemo)
4. Implement basic rendering (names + cards)
5. Add horizontal scroll CSS

### Step 2: Add to UI temporarily
1. Add `<HorizontalSwimLaneTimeline />` below existing vertical list in EnDivisionCorrect.tsx
2. Test with real data
3. Verify modal opens on T0 card click

### Step 3: Replace when ready
1. Remove vertical list section (lines 541-667)
2. Keep only the timeline
3. Done

**That's the whole plan.** Three simple steps.

## Performance

- `useMemo` for snapshot generation (only recalculate when participants change)
- That's it - optimize later if needed

## Success Metrics

- Users can quickly see how newcomers affect existing participants' finances
- Temporal relationships are clear (who joined when, what happened)
- Copropriété inventory evolution is visible at a glance
- No performance degradation with 10+ participants and 20+ events

## Future Enhancements (Out of Scope)

- Export timeline as image/PDF
- Zoom controls (compact/expanded view)
- Filter by participant (highlight/dim lanes)
- Mobile responsive version
- Animation when new events appear
