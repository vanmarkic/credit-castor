# Redistribution to All Participants Design

## Overview

Update the `calculateRedistribution` function to distribute copropriété hidden lot sale proceeds to **all current participants** (founders + newcomers), not just founders. Each participant receives a share proportional to their quotité in the building.

## Business Context

**Belgian Copropriété Quotité Model:**

In Belgian copropriété law, every co-owner has a **quotité** (ownership share) in the common property. This quotité determines their share of:
- Common expenses
- Redistribution when copropriété sells hidden lots
- Voting rights in assemblies

**Key Principle:** `Quotité = (participant's surface) / (total building surface)`

## How Quotité Evolves

**T0 (Initial purchase):**
- Only founders have quotité based on their owned surface
- Example: Founder A owns 112m², Founder B owns 134m². Total = 246m²
- Quotités: A = 112/246, B = 134/246

**When newcomer joins (e.g., T+2):**
- Newcomer gets quotité = (their surface) / (total building surface)
- Example: Newcomer N buys 50m². Total building = 296m²
- Quotités: A = 112/296, B = 134/296, N = 50/296

**When copro sells hidden lot:**
- All participants with quotité receive proportional redistribution
- Example: Copro sells lot for 100k€
  - A receives: (112/296) × 100k = 37,837€
  - B receives: (134/296) × 100k = 45,270€
  - N receives: (50/296) × 100k = 16,892€

**Important:** Founders' quotité stays constant in absolute terms (e.g., A always has 112m²), but their percentage of total quotité decreases as newcomers join.

## Current vs. New Implementation

### Current Signature
```typescript
calculateRedistribution(
  saleProceeds: number,
  initialCopropietaires: ParticipantSurface[],  // ❌ Only founders
  totalSurfaceAtPurchase: number                 // ❌ Fixed at T0
): Redistribution[]
```

**Current behavior:**
- Only redistributes to founders (initial co-owners)
- Uses total surface at purchase time (T0)
- Newcomers get nothing when copro sells hidden lots

### New Signature
```typescript
calculateRedistribution(
  saleProceeds: number,
  allCurrentParticipants: ParticipantSurface[],  // ✅ Founders + newcomers
  totalBuildingSurface: number                    // ✅ Building's total surface
): Redistribution[]
```

**New behavior:**
- Redistributes to all current participants (founders + all newcomers who have joined)
- Uses total building surface (constant denominator)
- Every participant with quotité receives proportional share

## Calculation Logic

```typescript
for each participant in allCurrentParticipants:
  quotité = participant.surface / totalBuildingSurface
  amount = saleProceeds × quotité

return array of { participantName, quotité, amount }
```

**Validation:** Sum of all redistributions must equal `saleProceeds` (within floating-point precision)

## Testing Strategy

### Test Scenario 1: Backward Compatibility (Founders Only)
```typescript
// Setup: 2 founders, no newcomers
Founder A: 112m²
Founder B: 134m²
Total building: 246m²
Sale proceeds: 100,000€

Expected:
- A receives: (112/246) × 100k = 45,528€
- B receives: (134/246) × 100k = 54,471€
- Sum = 100,000€
```

### Test Scenario 2: With One Newcomer
```typescript
// Setup: 2 founders + 1 newcomer
Founder A: 112m²
Founder B: 134m²
Newcomer N: 50m²
Total building: 296m²
Sale proceeds: 100,000€

Expected:
- A receives: (112/296) × 100k = 37,837€
- B receives: (134/296) × 100k = 45,270€
- N receives: (50/296) × 100k = 16,892€
- Sum = 100,000€
```

### Test Scenario 3: Multiple Newcomers
```typescript
// Setup: 2 founders + 2 newcomers
Founder A: 112m²
Founder B: 134m²
Newcomer N1: 50m²
Newcomer N2: 75m²
Total building: 371m²
Sale proceeds: 150,000€

Expected:
- A receives: (112/371) × 150k = 45,283€
- B receives: (134/371) × 150k = 54,177€
- N1 receives: (50/371) × 150k = 20,188€
- N2 receives: (75/371) × 150k = 30,350€
- Sum = 150,000€
```

### Test Scenario 4: Equal Surface Participants
```typescript
// Edge case: All participants have equal surface
Participant A: 100m²
Participant B: 100m²
Participant C: 100m²
Total building: 300m²
Sale proceeds: 150,000€

Expected:
- Each receives: (100/300) × 150k = 50,000€
- Quotité for each: 1/3
```

### Test Scenario 5: Single Participant
```typescript
// Edge case: Only one participant
Founder A: 200m²
Total building: 200m²
Sale proceeds: 100,000€

Expected:
- A receives: (200/200) × 100k = 100,000€
- Quotité: 1 (100%)
```

## Migration & Impact Analysis

### Call-Site Analysis
✅ **Low risk** - Function is currently only used in test files
- `src/utils/portageCalculations.test.ts` - Will update tests
- Not yet used in production code (timeline/chronology handlers not implemented)

### Breaking Changes
1. **Parameter names changed** (semantic clarity):
   - `initialCopropietaires` → `allCurrentParticipants`
   - `totalSurfaceAtPurchase` → `totalBuildingSurface`

2. **Behavior changed**:
   - Was: Only founders receive redistribution
   - Now: All current participants receive redistribution

3. **No TypeScript compilation errors** - Types remain compatible (`ParticipantSurface[]` and `number`)

### Documentation Updates
- Update JSDoc comment to reflect new behavior
- Update parameter descriptions with clear semantics
- Add examples showing newcomer inclusion
- Note breaking change from "founders only" to "all participants"

## Implementation Checklist

- [ ] Update `calculateRedistribution` function signature and JSDoc
- [ ] Update implementation to use new parameter names
- [ ] Update existing tests to use new parameter names
- [ ] Add new test: "with one newcomer" scenario
- [ ] Add new test: "with multiple newcomers" scenario
- [ ] Add new test: "equal surface participants" edge case
- [ ] Verify all tests pass
- [ ] Run TypeScript type check
- [ ] Commit changes

## Future Integration

When implementing `HiddenLotRevealedEvent` handler in timeline projection:

```typescript
// Example usage in timeline reducer
const allParticipants = getCurrentParticipants(state); // founders + newcomers
const totalSurface = getTotalBuildingSurface(projectParams);

const redistribution = calculateRedistribution(
  event.salePrice,
  allParticipants.map(p => ({ name: p.name, surface: p.totalSurface })),
  totalSurface
);

// Apply redistribution to participant cash flows
```

## Questions & Decisions

**Q: How do newcomers get quotité?**
**A:** Any participant who owns surface in the building gets quotité = (their surface) / (total building surface). This applies to:
- Founders (from T0)
- Newcomers who buy from founder's portage lot
- Newcomers who buy from copropriété hidden lot

**Q: Does buying from a founder vs. copro affect quotité differently?**
**A:** No. Quotité is purely based on owned surface, regardless of acquisition source.

**Q: What happens to founders' quotité when newcomers join?**
**A:** Founders' absolute quotité (surface in m²) stays constant, but their percentage of total quotité decreases as the denominator (total participants' surface) grows.

**Q: Should redistribution be equal or proportional?**
**A:** Proportional to quotité (surface-based), not equal split. This aligns with Belgian copropriété law.
