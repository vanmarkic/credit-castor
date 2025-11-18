# Quotité Display Value Trace

## Step-by-Step Trace of Where the Displayed Quotité Value Comes From

### Step 1: Component Entry Point
**File**: `src/components/shared/CostBreakdownGrid.tsx`
**Line**: 73
```typescript
export function CostBreakdownGrid({ participant, participantCalc: p, projectParams, allParticipants, unitDetails, deedDate, formulaParams }: CostBreakdownGridProps)
```

### Step 2: Check if Newcomer
**File**: `src/components/shared/CostBreakdownGrid.tsx`
**Line**: 88
```typescript
const isNewcomer = !participant.isFounder;
```

### Step 3: Initialize Calculation Variable
**File**: `src/components/shared/CostBreakdownGrid.tsx`
**Line**: 91
```typescript
let newcomerPriceCalculation;
```
**Status**: `undefined` initially

### Step 4: Condition Check for Calculation
**File**: `src/components/shared/CostBreakdownGrid.tsx`
**Lines**: 92-93
```typescript
if (isNewcomer && participant.purchaseDetails?.buyingFrom === 'Copropriété' && 
    allParticipants && projectParams && deedDate && participant.entryDate) {
```
**Checks**:
- ✅ `isNewcomer` = true (non-founder)
- ✅ `participant.purchaseDetails?.buyingFrom === 'Copropriété'`
- ✅ `allParticipants` exists
- ✅ `projectParams` exists
- ✅ `deedDate` exists
- ✅ `participant.entryDate` exists

### Step 5: Filter Existing Participants
**File**: `src/components/shared/CostBreakdownGrid.tsx`
**Lines**: 97-106
```typescript
const existingParticipants = allParticipants.filter(existing => {
  const existingEntryDate = existing.entryDate || (existing.isFounder ? new Date(deedDate) : null);
  if (!existingEntryDate) return false;
  
  const buyerEntryDate = participant.entryDate 
    ? (participant.entryDate instanceof Date ? participant.entryDate : new Date(participant.entryDate))
    : new Date(deedDate);
  return existingEntryDate <= buyerEntryDate;
});
```
**Purpose**: Filter to only participants who entered on or before the buyer's entry date
**Result**: Array of participants (founders + newcomers who entered before/on same date)

### Step 6: Call Calculation Function
**File**: `src/components/shared/CostBreakdownGrid.tsx`
**Lines**: 108-115
```typescript
newcomerPriceCalculation = calculateNewcomerPurchasePrice(
  participant.surface || 0,           // newcomerSurface = 100
  existingParticipants,               // Filtered participants array
  projectParams.totalPurchase,        // 650000
  deedDate,                           // "2026-02-01"
  participant.entryDate,              // "2027-02-01T00:00:00.000Z"
  formulaParams                       // { indexationRate: 2, ... }
);
```
**Function**: `calculateNewcomerPurchasePrice` from `src/utils/calculatorUtils.ts`

### Step 7: Calculate Quotité Inside Function
**File**: `src/utils/calculatorUtils.ts`
**Line**: 999
```typescript
const quotite = calculateNewcomerQuotite(newcomerSurface, allParticipants);
```
**Parameters**:
- `newcomerSurface` = 100 (from Step 6)
- `allParticipants` = `existingParticipants` (filtered array from Step 5)

### Step 8: Quotité Calculation Logic
**File**: `src/utils/calculatorUtils.ts`
**Lines**: 953-964
```typescript
export function calculateNewcomerQuotite(
  newcomerSurface: number,        // 100
  allParticipants: Participant[]  // existingParticipants (filtered)
): number {
  const totalBuildingSurface = allParticipants.reduce((sum, p) => sum + (p.surface || 0), 0);
  
  if (totalBuildingSurface <= 0) {
    return 0;
  }
  
  return newcomerSurface / totalBuildingSurface;
}
```
**Calculation**:
- `totalBuildingSurface` = sum of all `existingParticipants` surfaces
- For Participant·e 5: 140 + 225 + 200 + 108 + 100 + 100 + 100 + 100 + 100 = 1173 m²
- `quotite` = 100 / 1173 = 0.08525149190110827

### Step 9: Return Calculation Result
**File**: `src/utils/calculatorUtils.ts`
**Lines**: 1022-1029
```typescript
return {
  quotite,              // 0.08525149190110827
  basePrice,            // quotite * totalProjectCost
  indexation,           // calculated
  carryingCostRecovery, // calculated
  totalPrice,           // basePrice + indexation + carryingCostRecovery
  yearsHeld             // calculated
};
```

### Step 10: Store Result in Component
**File**: `src/components/shared/CostBreakdownGrid.tsx`
**Line**: 91 (after Step 6 completes)
```typescript
newcomerPriceCalculation = {
  quotite: 0.08525149190110827,
  basePrice: 55413.46973572038,
  indexation: 1107.503295228625,
  carryingCostRecovery: 511.1588426103412,
  totalPrice: 57032.131873559345,
  yearsHeld: 0.999315537303217
}
```

### Step 11: Display Quotité in UI
**File**: `src/components/shared/CostBreakdownGrid.tsx`
**Line**: 235
```typescript
Quotité = {participant.surface || 0}m² ÷ {allParticipants?.reduce((s, p) => s + (p.surface || 0), 0)}m² total = {(newcomerPriceCalculation.quotite * 100).toFixed(1)}% ({Math.round(newcomerPriceCalculation.quotite * 1000)}/1000)
```

**Display Breakdown**:
1. `participant.surface || 0` = 100 m²
2. `allParticipants?.reduce((s, p) => s + (p.surface || 0), 0)` = **1273 m²** (ALL participants, not filtered!)
3. `(newcomerPriceCalculation.quotite * 100).toFixed(1)` = 8.5%
4. `Math.round(newcomerPriceCalculation.quotite * 1000)` = 85

**Displayed Text**:
```
Quotité = 100m² ÷ 1273m² total = 8.5% (85/1000)
```

## ⚠️ CRITICAL MISMATCH FOUND

### The Problem:
- **Calculation uses**: `existingParticipants` (filtered) = 1173 m² total
- **Display shows**: `allParticipants` (unfiltered) = 1273 m² total

### Why This Matters:
- The **calculated quotité** (0.0852 = 85/1000) is correct based on 1173 m²
- The **displayed total** (1273 m²) is incorrect - it includes participants who entered AFTER the buyer
- The **displayed percentage** (8.5%) is correct because it uses the calculated quotité value
- But the **displayed formula** shows the wrong denominator (1273 instead of 1173)

### When Quotité Would Show as 0:

1. **If `newcomerPriceCalculation` is undefined**:
   - Condition on line 92-93 fails
   - Try-catch on line 116-118 catches an error
   - `newcomerPriceCalculation` remains `undefined`
   - Line 231 condition `newcomerPriceCalculation ?` would be false
   - Calculation details wouldn't render

2. **If `calculateNewcomerQuotite` returns 0**:
   - `totalBuildingSurface <= 0` (line 959)
   - `newcomerSurface === 0` (would return 0/anything = 0)

3. **If `existingParticipants` array is empty**:
   - All participants filtered out
   - `totalBuildingSurface = 0`
   - Returns 0

## Debugging Checklist

To find why quotité shows as 0, check:

1. ✅ Is `isNewcomer` true?
2. ✅ Is `participant.purchaseDetails?.buyingFrom === 'Copropriété'`?
3. ✅ Do all required props exist (`allParticipants`, `projectParams`, `deedDate`, `participant.entryDate`)?
4. ✅ Does `existingParticipants` array have participants after filtering?
5. ✅ Is `totalBuildingSurface > 0` after filtering?
6. ✅ Does `calculateNewcomerPurchasePrice` throw an error (check console)?
7. ✅ Is `newcomerPriceCalculation` defined after the try-catch?

## Fix for Display Mismatch

**File**: `src/components/shared/CostBreakdownGrid.tsx`
**Line**: 235

**Current** (WRONG):
```typescript
Quotité = {participant.surface || 0}m² ÷ {allParticipants?.reduce((s, p) => s + (p.surface || 0), 0)}m² total
```

**Should be** (CORRECT):
```typescript
Quotité = {participant.surface || 0}m² ÷ {existingParticipants.reduce((s, p) => s + (p.surface || 0), 0)}m² total
```

But `existingParticipants` is scoped inside the `if` block, so we need to either:
1. Move `existingParticipants` outside the `if` block, OR
2. Calculate the total from `newcomerPriceCalculation` if available, OR
3. Store the total in the calculation result

