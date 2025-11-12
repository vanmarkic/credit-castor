# Date Validation & TRAVAUX COMMUNS Feature Design

**Date:** 2025-11-12
**Status:** Approved for implementation

## Overview

This design covers two parallel feature sets:
1. **Date validation bugs (A)** - Fix uncaught errors when changing deed date and newcomer entry dates
2. **TRAVAUX COMMUNS feature (C)** - Add customizable common works section with equal cost distribution

## Part 1: Date Validation Architecture

### Current Problems
- Changing deed date to past values causes uncaught errors
- Selecting newcomer entry date ≤ deed date causes uncaught errors
- No validation or user feedback for invalid date selections

### Solution Approach

**Date validation at two points:**
1. **Deed date validation** - Allow any past or future date, but wrap calculations in try-catch blocks
2. **Newcomer entry date validation** - Enforce business rule: entry date must be ≥ deed date + 1 day

**Error handling pattern:**
- Use `react-hot-toast` library (already installed)
- Use `SimpleNotificationToast` component for error messages
- Show error type toast with clear French messages
- Prevent invalid state rather than just catching errors

**Business logic:**
- Newcomer entry date < deed date → Show error toast, prevent change
- Newcomer entry date = deed date → Show error toast (they should convert to founder instead)
- Founder conversion → Automatically set entry date to deed date
- Deed date changes → All dependent dates shift by the same delta

## Part 2: Date Validation Implementation Details

### Deed Date Field Changes

**UI additions:**
- Add info icon/text next to deed date input
- Info text: "Changer cette date ajustera automatiquement toutes les dates d'entrée des participants"

**When deed date changes:**
1. Calculate delta (new deed date - old deed date)
2. Shift all participant entry dates by the same delta
3. Shift any other timeline dates (lot sales, transactions, etc.) by the same delta
4. Recalculate everything

**Implementation notes:**
- Maintain relative time offsets between all dates
- Example: If newcomer entered 30 days after old deed date, they enter 30 days after new deed date
- If deed date moves forward 10 days, all dates move forward 10 days

### Newcomer Entry Date Validation

**Date picker constraints:**
- Min date: `deedDate + 1 day`
- Validation occurs before state update

**Error handling:**
- Invalid date entry → Show error toast
- Error message: "Date invalide: les nouveaux venus doivent entrer au moins 1 jour après la date de l'acte"
- Prevent the change from being saved

### Founder Conversion

**Automatic behavior:**
- When changing participant type to "Founder", automatically set entry date = deed date
- No user confirmation needed (it's the correct business rule)

### Error Toast Messages (French)

- Invalid newcomer date: "Date invalide: les nouveaux venus doivent entrer au moins 1 jour après la date de l'acte"
- Calculation error: "Erreur de calcul avec cette date. Veuillez choisir une autre date."

## Part 3: TRAVAUX COMMUNS Feature Structure

### Data Model

Add new field to `ProjectParams`:
```typescript
travauxCommuns?: {
  enabled: boolean;  // Toggle for entire section
  items: Array<{ label: string; amount: number }>;
}
```

### Default Initialization

When `travauxCommuns` is undefined (backward compatibility):
```typescript
{
  enabled: true,
  items: [{ label: 'Rénovation complète', amount: 270000 }]
}
```

### UI Placement

- First collapsible section in ExpenseCategoriesManager (before CONSERVATOIRE)
- Title: "TRAVAUX COMMUNS" (uppercase, consistent with other sections)
- Subtitle/info: "Répartition : par personne (égale)" - shown in collapsed header
- Master toggle checkbox in the header to enable/disable entire section

### Behavior When Disabled

- Section remains visible but collapsed with greyed-out styling
- Items inside are not editable
- Costs are completely excluded from all calculations (zero contribution)
- State is preserved (items remain in data, just not used)

## Part 4: TRAVAUX COMMUNS Calculation Integration

### Cost Distribution Logic

- Calculate total: sum of all TRAVAUX COMMUNS items (when enabled)
- Split equally among all participants (regardless of surface area or shares)
- Formula: `travauxCommunsPerParticipant = totalTravauxCommuns / numberOfParticipants`

### Integration Points

1. **calculatorUtils.ts** - Add function `calculateTravauxCommunsCosts()`
2. **Per-participant costs** - Add `travauxCommuns` field to participant breakdown
3. **Total project costs** - Include in overall totals
4. **Excel export** - Add TRAVAUX COMMUNS section with equal distribution shown

### Where It Appears in Results

- Participant detail cards: Show as separate line item "Travaux Communs: X €"
- Total calculations: Include in "Total à payer"
- Timeline/cash flow: Distribute costs according to project timeline (like other construction costs)

### Backward Compatibility

- Existing scenarios without `travauxCommuns` → treated as disabled with empty items
- No migration needed (undefined checks in calculations)

## Part 5: TRAVAUX COMMUNS UI Component Details

### Collapsible Header Design

- Checkbox on the left to enable/disable entire section
- Chevron icon for expand/collapse (same pattern as Frais Généraux)
- Title: "TRAVAUX COMMUNS"
- Subtitle: "Répartition : par personne (égale)" in italic gray text
- Total amount on the right in bold color (purple to match theme)

### When Expanded and Enabled

- Same editable list pattern as CONSERVATOIRE section
- Each item: editable label (text input) + editable amount (number input) + delete button (X)
- "+ Ajouter une ligne" button at bottom to add new items
- Respect `canEditExpenseCategories` permission

### When Disabled (Checkbox Unchecked)

- Header remains visible with grayed-out styling
- Content area collapses automatically
- Total shows "0 €" or grayed out
- Cannot expand while disabled
- Checkbox is the only interactive element

### Styling Consistency

- Follow exact same pattern as existing ExpenseCategorySection components
- Use same color scheme as other collapsible sections
- Maintain visual hierarchy with existing categories

## Part 6: Testing Strategy

### Unit Tests for Date Validation

- Test deed date changes cascade to all participant entry dates
- Test newcomer entry date validation (min = deed date + 1)
- Test founder conversion sets entry date = deed date
- Test error toast displays for invalid dates
- Test timeline dates shift with deed date changes

### Unit Tests for TRAVAUX COMMUNS

- Test equal cost distribution among N participants
- Test calculations when enabled vs disabled
- Test backward compatibility (undefined → disabled)
- Test adding/removing/editing items
- Test total calculation with multiple items

### Integration Tests

- Test complete workflow: enable TRAVAUX COMMUNS, add items, verify participant totals
- Test date validation edge cases with real participant scenarios
- Test Excel export includes TRAVAUX COMMUNS section
- Test state persistence (localStorage/Firestore)

### Manual Testing Checklist

- Toast notifications appear with correct French messages
- Date picker constraints work properly
- TRAVAUX COMMUNS toggle affects calculations immediately
- All permission checks work correctly

## Implementation Notes

### Files to Modify

**Date Validation:**
- Component with deed date picker (find with grep)
- Component with newcomer entry date picker (ParticipantDetailModal?)
- Timeline calculation utilities
- State machine event handlers

**TRAVAUX COMMUNS:**
- `src/types/` - Add travauxCommuns type definitions
- `src/utils/calculatorUtils.ts` - Add calculation functions
- `src/components/shared/ExpenseCategoriesManager.tsx` - Add UI section
- Excel export utilities - Add TRAVAUX COMMUNS section
- Integration tests - Add comprehensive test coverage

### Breaking Changes

This is a **minor version** change (not breaking):
- New optional field `travauxCommuns` in ProjectParams
- Backward compatible (undefined = disabled)
- No data migration required

### Implementation Order

**Batch 1 (Parallel):**
1. Date validation bugs (A)
2. TRAVAUX COMMUNS feature (C)

**Batch 2 (After review):**
3. New participant default behavior (B)
4. Collaborative editing lock (D)
