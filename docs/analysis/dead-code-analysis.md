# Dead Code Analysis

**Date**: 2025-01-XX  
**Status**: Analysis Complete

## Summary

This document identifies dead code (unused files, functions, and exports) across the codebase that can be safely removed to reduce maintenance burden and improve code clarity.

## Dead Code Findings

### 1. Timeline Projection Module (Unused in Production)

**File**: `src/utils/timelineProjection.ts`  
**Status**: Only used in tests, not imported anywhere in production code

**Exports**:
- `buildParticipantTimeline()` - Builds participant timeline from events
- `ParticipantTimeline` interface
- `ParticipantStatus` type

**Usage**: Only imported in `src/utils/timelineProjection.test.ts`

**Recommendation**: 
- **Option A**: Remove if not needed for future features
- **Option B**: Keep if planned for future timeline features (document why)

**Related**: This appears to be from a dropped event sourcing feature (see `ParticipantsTable.tsx` comments)

---

### 2. Participants Table Component (Explicitly Unused)

**File**: `src/components/ParticipantsTable.tsx`  
**Status**: Explicitly marked as unused from dropped event sourcing feature

**Evidence**:
- File header comment: "NOTE: This component is from the dropped event sourcing feature and is not currently used."
- Contains `@ts-expect-error` comments indicating broken types
- Not imported anywhere in production code

**Dependencies**:
- Uses `ParticipantCashFlowView` (also unused)
- References `timelineProjection` (removed, see comment on line 18)

**Recommendation**: **Remove** - explicitly marked as unused and from dropped feature

---

### 3. Participant Cash Flow View Component (Unused)

**File**: `src/components/ParticipantCashFlowView.tsx`  
**Status**: Only used by `ParticipantsTable.tsx` (which is unused)

**Usage**: Only imported in `src/components/ParticipantsTable.tsx`

**Recommendation**: **Remove** - only used by unused component

---

### 4. Timeline View Component (Test Only)

**File**: `src/components/TimelineView.tsx`  
**Status**: Only used in tests, not in production

**Usage**: Only imported in `src/components/TimelineView.test.tsx`

**Dependencies**:
- Uses `PhaseCard` component
- Uses `EventMarker` component
- Uses `projectTimeline()` from `chronologyCalculations.ts`

**Note**: `projectTimeline()` is also only used in tests, suggesting this entire timeline view feature may be unused.

**Recommendation**: 
- **Option A**: Remove if timeline view feature is not needed
- **Option B**: Keep if planned for future UI feature (document why)

---

### 5. CSV Export Utilities (Unused)

**File**: `src/utils/csvExport.ts`  
**Status**: Only used by `ParticipantCashFlowView.tsx` (which is unused)

**Exports**:
- `exportToCSV()` - Main export function
- `generateCsv()` - CSV generation
- `downloadCsv()` - Browser download
- `formatCsvRow()` - Row formatting
- `escapeCsvCell()` - Cell escaping
- `CSVExportOptions` interface

**Usage**: Only imported in `src/components/ParticipantCashFlowView.tsx`

**Recommendation**: **Remove** - only used by unused component

**Note**: If CSV export is needed in the future, this utility is well-written and could be re-added. Consider keeping if CSV export is planned.

---

### 6. Project Timeline Function (Test Only)

**File**: `src/utils/chronologyCalculations.ts`  
**Function**: `projectTimeline()`

**Status**: Only used in tests, not in production code

**Usage**: 
- Used in `src/utils/chronologyCalculations.test.ts`
- Used in `src/components/TimelineView.test.tsx` (which tests unused component)

**Recommendation**: 
- **Option A**: Remove if timeline projection feature is not needed
- **Option B**: Keep if planned for future features (document why)

**Note**: Other functions in `chronologyCalculations.ts` (`createInitialState()`, `applyEvent()`) are used by `timelineProjection.ts`, but since that's also unused, they may be dead code too.

---

## Dead Code Removal Priority

### High Priority (Safe to Remove)
1. ✅ **ParticipantsTable.tsx** - Explicitly marked as unused
2. ✅ **ParticipantCashFlowView.tsx** - Only used by unused component
3. ✅ **csvExport.ts** - Only used by unused component

### Medium Priority (Verify Before Removing)
4. ⚠️ **timelineProjection.ts** - May be needed for future features
5. ⚠️ **TimelineView.tsx** - May be needed for future UI
6. ⚠️ **projectTimeline()** in chronologyCalculations.ts - May be needed for future features

### Low Priority (Keep for Now)
- Functions in `chronologyCalculations.ts` that are used by `timelineProjection.ts` - Keep if timeline projection is planned

---

## Impact Analysis

### Files That Can Be Safely Removed
- `src/components/ParticipantsTable.tsx` (171 lines)
- `src/components/ParticipantCashFlowView.tsx` (190 lines)
- `src/utils/csvExport.ts` (159 lines)

**Total**: ~520 lines of dead code

### Test Files to Remove/Update
- `src/components/TimelineView.test.tsx` - Remove if component is removed
- `src/utils/timelineProjection.test.ts` - Remove if module is removed

---

## Recommendations

1. **Immediate Action**: Remove high-priority dead code (ParticipantsTable, ParticipantCashFlowView, csvExport)
2. **Document Decision**: For medium-priority items, document whether they're needed for future features
3. **Clean Up Tests**: Remove or update test files for removed components
4. **Verify Dependencies**: Before removing `timelineProjection.ts`, verify if it's needed for future timeline features

---

## Notes

- All dead code appears to be from a dropped event sourcing feature
- The current timeline implementation uses `timelineCalculations.ts` (snapshot-based) instead of the event-sourcing approach
- CSV export utilities are well-written but unused - consider keeping if CSV export is planned

---

## Related Documentation

- See `src/components/ParticipantsTable.tsx` line 4-5 for explicit "dropped event sourcing feature" comment
- See `docs/development/` for timeline implementation documentation
- Current timeline system: `src/utils/timelineCalculations.ts` (snapshot-based)

