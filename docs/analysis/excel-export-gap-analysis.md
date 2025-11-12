# Excel Export Gap Analysis

**Date:** 2025-11-12
**Issue:** Dual loan system and other UI details missing from Excel export

## Executive Summary

The Excel export is missing several fields related to the dual loan financing system and other participant details that are displayed in the UI. This document identifies all gaps and proposes a solution.

## Missing Fields

### 1. Dual Loan System Fields (HIGH PRIORITY)

#### Input Fields (from `Participant` interface)
- ❌ `loan2RenovationAmount` - Amount of renovation costs in loan 2
- ❌ `capitalForLoan1` - Capital allocated to loan 1
- ❌ `capitalForLoan2` - Capital allocated to loan 2

#### Calculated Fields (from `ParticipantCalculation` interface)
- ❌ `loan1Interest` - Total interest for loan 1
- ❌ `loan2Interest` - Total interest for loan 2

#### Partially Included
- ⚠️ `loan2DelayYears` - Currently combined with duration in column AL, should be separate

### 2. Currently Exported Dual Loan Fields (for reference)
- ✅ `useTwoLoans` (Column AG: '2 prets')
- ✅ `loan1Amount` (Column AH: 'Pret1 montant')
- ✅ `loan1MonthlyPayment` (Column AI: 'Pret1 mens')
- ✅ `loan2Amount` (Column AJ: 'Pret2 montant')
- ✅ `loan2MonthlyPayment` (Column AK: 'Pret2 mens')
- ✅ `loan2DurationYears` (Column AL: 'Pret2 duree' - combined with delay)

## UI Components Displaying Dual Loan Data

### TwoLoanFinancingSection.tsx
- Displays input fields for configuring dual loan financing
- Shows: `useTwoLoans`, `loan2DelayYears`, `loan2RenovationAmount`, `capitalForLoan1`, `capitalForLoan2`

### FinancingResultCard.tsx
- Displays calculated loan results with detailed breakdown
- Shows: All loan amounts, interest, monthly payments, durations
- Includes combined monthly payment calculation for dual loans

### ParticipantDetailModal.tsx
- Main participant detail view
- Shows combined monthly payment in header (line 143-151)
- Displays all financing details through nested components

## Proposed Solution

### Phase 1: Add Missing Dual Loan Columns

Add the following columns to the Excel export (in `excelExport.ts`):

| New Column | Header Label | Source Field | Notes |
|------------|--------------|--------------|-------|
| AM (moved to AO) | Porteur paie CASCO | founderPaysCasco | Existing, will be shifted |
| AN (moved to AP) | Porteur paie Parachev | founderPaysParachèvement | Existing, will be shifted |
| AM | Pret1 interets | loan1Interest | New |
| AN | Pret2 interets | loan2Interest | New |
| AO | Pret2 delai (ans) | loan2DelayYears | New (separate from duration) |
| AP | Reno dans pret2 | loan2RenovationAmount | New |
| AQ | Capital pret1 | capitalForLoan1 | New |
| AR | Capital pret2 | capitalForLoan2 | New |

### Phase 2: Create Automated Parity Test

Create a test that:
1. Extracts all fields displayed in UI components
2. Extracts all fields exported to Excel
3. Compares and reports discrepancies
4. Runs in CI/CD pipeline

### Phase 3: Add to Pre-Push Hook

Integrate parity test into existing pre-push workflow:
- Run test before allowing push
- Fail if critical fields are missing
- Generate report of gaps

## Impact Analysis

### Benefits
- ✅ Complete data export for analysis
- ✅ Better debugging and audit trail
- ✅ Automated detection of future gaps

### Risks
- ⚠️ Breaking change if users rely on current column positions (mitigated by appending new columns)
- ⚠️ Increased file size (minimal - a few extra columns)

## Implementation Priority

1. **HIGH:** Add missing dual loan fields to export
2. **MEDIUM:** Create automated parity test
3. **MEDIUM:** Add test to pre-push hook

## Related Files

- `src/utils/excelExport.ts` - Export logic
- `src/utils/calculatorUtils.ts` - Type definitions
- `src/components/shared/TwoLoanFinancingSection.tsx` - Input UI
- `src/components/shared/FinancingResultCard.tsx` - Results display
- `src/components/calculator/ParticipantDetailModal.tsx` - Main detail view
