# JSON vs Excel Export Comparison Analysis

**Date**: 2025-11-11
**Purpose**: Compare JSON and Excel exports to ensure data consistency

---

## Summary of Findings

### ✅ Generally Consistent
Both exports include most essential data: participants, project parameters, calculation results, and totals.

### ❌ Critical Inconsistencies Found
1. **Two-loan financing breakdown** - Excel has it, JSON missing it
2. **Timeline snapshots** - Excel optional sheet, JSON doesn't support it
3. **Some calculated fields** - Minor differences in what's exported

---

## Detailed Field Comparison

### Metadata

| Field | JSON | Excel | Notes |
|-------|------|-------|-------|
| Version tracking | ✅ `version`, `releaseVersion` | ❌ None | JSON can validate compatibility |
| Timestamp | ✅ ISO string | ✅ Localized date | Both present |
| Deed date | ✅ `deedDate` | ❌ Not explicit | JSON only |

### Project Parameters

| Category | JSON | Excel | Location |
|----------|------|-------|----------|
| All ProjectParams | ✅ Full object | ✅ All fields | Both complete |
| Expense categories | ✅ In projectParams | ✅ Detail section | Both if present |
| Unit details | ✅ Full object | ✅ Detail section | Both complete |

### Participant Input Fields

| Field | JSON participants | Excel columns | Notes |
|-------|------------------|---------------|-------|
| Basic info | ✅ name, surface, unitId, quantity | ✅ A, B, C, D | ✅ Consistent |
| Financial inputs | ✅ capitalApporte, notaryFeesRate, interestRate, durationYears | ✅ E, F, G, H | ✅ Consistent |
| Overrides | ✅ parachevementsPerM2, cascoSqm, parachevementsSqm | ✅ V, W, X | ✅ Consistent |
| Timeline | ✅ isFounder, entryDate, exitDate | ✅ Y, Z | ✅ Consistent |
| Two-loan inputs | ✅ useTwoLoans, loan2DelayYears, etc. | ✅ AF | ✅ Consistent |
| Lots owned | ✅ lotsOwned array | ✅ AA | ✅ Consistent |
| Purchase details | ✅ purchaseDetails object | ✅ AC, AD, AE | ✅ Consistent |

### Calculation Results - Participant Breakdown

| Field | JSON calculations.participantBreakdown | Excel column | Status |
|-------|---------------------------------------|--------------|--------|
| name | ✅ | A | ✅ |
| unitId | ✅ | B | ✅ |
| surface | ✅ | C | ✅ |
| quantity | ✅ | D | ✅ |
| pricePerM2 | ✅ | B7 formula | ✅ |
| purchaseShare | ✅ | I formula | ✅ |
| notaryFees | ✅ | J | ✅ |
| casco | ✅ | K | ✅ |
| parachevements | ✅ | L | ✅ |
| personalRenovationCost | ✅ | T | ✅ |
| constructionCost | ✅ | N | ✅ |
| constructionCostPerUnit | ✅ | (calculated) | ⚠️ Not explicit |
| travauxCommunsPerUnit | ✅ | M formula ref | ⚠️ Indirect |
| sharedCosts | ✅ | O | ✅ |
| totalCost | ✅ | P | ✅ |
| loanNeeded | ✅ | Q | ✅ |
| financingRatio | ✅ | ❌ Missing | ⚠️ JSON only |
| monthlyPayment | ✅ | R | ✅ |
| totalRepayment | ✅ | S | ✅ |
| totalInterest | ✅ | ❌ Missing | ⚠️ JSON only |
| **loan1Amount** | ❌ **MISSING** | ✅ AG | ❌ **INCONSISTENT** |
| **loan1MonthlyPayment** | ❌ **MISSING** | ✅ AH | ❌ **INCONSISTENT** |
| **loan1Interest** | ❌ **MISSING** | ❌ Missing | ⚠️ Neither has it |
| **loan2Amount** | ❌ **MISSING** | ✅ AI | ❌ **INCONSISTENT** |
| **loan2DurationYears** | ❌ **MISSING** | ✅ AK | ❌ **INCONSISTENT** |
| **loan2MonthlyPayment** | ❌ **MISSING** | ✅ AJ | ❌ **INCONSISTENT** |
| **loan2Interest** | ❌ **MISSING** | ❌ Missing | ⚠️ Neither has it |

### Calculation Results - Totals

| Field | JSON calculations.totals | Excel | Status |
|-------|-------------------------|-------|--------|
| purchase | ✅ | ✅ | ✅ |
| totalNotaryFees | ✅ | ✅ | ✅ |
| construction | ✅ | ✅ | ✅ |
| shared | ✅ | ✅ | ✅ |
| totalTravauxCommuns | ✅ | ✅ | ✅ |
| travauxCommunsPerUnit | ✅ | ✅ | ✅ |
| total | ✅ | ✅ | ✅ |
| capitalTotal | ✅ | ✅ | ✅ |
| totalLoansNeeded | ✅ | ✅ | ✅ |
| averageLoan | ✅ | ✅ | ✅ |
| averageCapital | ✅ | ❌ | ⚠️ JSON only |

### Timeline Snapshots

| Feature | JSON | Excel | Notes |
|---------|------|-------|-------|
| Timeline snapshots | ❌ Not supported | ✅ Optional 2nd sheet | Major gap in JSON |
| Snapshot fields | N/A | Date, participant, costs, deltas, transactions | See excelExport.ts:341-456 |

---

## Critical Inconsistencies

### 🔴 Issue #1: Two-Loan Financing Breakdown Missing from JSON

**Severity**: HIGH
**Type**: Missing calculated data

**Description**:
When a participant uses two-loan financing (`useTwoLoans: true`), the calculator computes a breakdown showing:
- Loan 1: amount, monthly payment, interest
- Loan 2: amount, duration, monthly payment, interest

**Current State**:
- ✅ Excel export: Includes all two-loan breakdown fields (columns AG-AK)
- ❌ JSON export: Does NOT include any two-loan breakdown in `calculations.participantBreakdown`
- ⚠️ JSON export: Only has the INPUT field `useTwoLoans` in `participants` array

**Code Locations**:
- Excel export: [excelExport.ts:219-233](../../src/utils/excelExport.ts#L219-L233)
- JSON export: [scenarioFileIO.ts:102-123](../../src/utils/scenarioFileIO.ts#L102-L123)
- Calculation type: [calculatorUtils.ts:122-130](../../src/utils/calculatorUtils.ts#L122-L130)

**Impact**:
- Users exporting to JSON lose important financing breakdown data
- Cannot recreate two-loan analysis from JSON export alone
- JSON files are incomplete for scenarios with two-loan financing

**Recommendation**:
Add the following fields to `calculations.participantBreakdown` in scenarioFileIO.ts:
```typescript
loan1Amount: p.loan1Amount,
loan1MonthlyPayment: p.loan1MonthlyPayment,
loan1Interest: p.loan1Interest,
loan2Amount: p.loan2Amount,
loan2DurationYears: p.loan2DurationYears,
loan2MonthlyPayment: p.loan2MonthlyPayment,
loan2Interest: p.loan2Interest
```

---

### 🟡 Issue #2: Timeline Snapshots Not in JSON Export

**Severity**: MEDIUM
**Type**: Missing feature

**Description**:
The Excel export optionally includes a "Timeline Snapshots" sheet showing participant financial state at each event date (entries, exits, sales). This data is NOT exported in JSON format.

**Current State**:
- ✅ Excel: Optional 2nd sheet via `exportCalculations` options parameter
- ❌ JSON: No support for timeline snapshots at all

**Code Locations**:
- Excel timeline sheet: [excelExport.ts:341-456](../../src/utils/excelExport.ts#L341-L456)
- Excel export call: [excelExport.ts:462-486](../../src/utils/excelExport.ts#L462-L486)
- JSON export: [scenarioFileIO.ts:79-141](../../src/utils/scenarioFileIO.ts#L79-L141)

**Impact**:
- Timeline analysis data lost in JSON export
- Cannot recreate timeline views from JSON alone

**Recommendation**:
Add optional `timelineSnapshots` field to `ScenarioData` interface and include in serialization when provided.

---

### 🟢 Issue #3: Minor Calculated Fields

**Severity**: LOW
**Type**: Minor inconsistencies

**Description**:
A few calculated fields appear in one export but not the other:

**JSON only**:
- `financingRatio` (loan-to-cost ratio)
- `totalInterest` (total interest paid over loan lifetime)
- `averageCapital` in totals

**Excel only**:
- None (Excel has everything JSON has, plus two-loan breakdown)

**Impact**: Minimal - these can be recalculated from other fields

---

## Test Coverage Analysis

### JSON Export Tests
- ✅ Good coverage in [EnDivisionCorrect.jsonExport.test.tsx](../../src/components/EnDivisionCorrect.jsonExport.test.tsx)
- ✅ Tests verify all participant fields, project params, calculations
- ❌ Does NOT test for two-loan breakdown fields
- ❌ Does NOT test timeline snapshots (expected - not supported)

### Excel Export Tests
- ✅ Tests in [excelExport.test.ts](../../src/utils/excelExport.test.ts)
- ✅ Integration tests in [excelExport.integration.test.ts](../../src/utils/excelExport.integration.test.ts)
- Need to verify if two-loan financing is tested

---

## Recommendations

### Priority 1: Fix Two-Loan Financing in JSON Export
**Action**: Modify [scenarioFileIO.ts:102-123](../../src/utils/scenarioFileIO.ts#L102-L123) to include all two-loan breakdown fields

**Files to modify**:
1. `src/utils/scenarioFileIO.ts` - Add fields to participantBreakdown mapping
2. `src/components/EnDivisionCorrect.jsonExport.test.tsx` - Add test for two-loan fields

### Priority 2: Add Timeline Snapshots to JSON Export
**Action**: Add optional timeline snapshots to ScenarioData interface

**Files to modify**:
1. `src/utils/scenarioFileIO.ts` - Add timelineSnapshots parameter and field
2. Component that calls export - Pass timeline snapshots when available

### Priority 3: Document Export Formats
**Action**: Create user-facing documentation explaining what's in each export format

---

## Files Analyzed

- ✅ [src/utils/excelExport.ts](../../src/utils/excelExport.ts)
- ✅ [src/utils/scenarioFileIO.ts](../../src/utils/scenarioFileIO.ts)
- ✅ [src/utils/storage.ts](../../src/utils/storage.ts)
- ✅ [src/utils/calculatorUtils.ts](../../src/utils/calculatorUtils.ts)
- ✅ [src/components/EnDivisionCorrect.jsonExport.test.tsx](../../src/components/EnDivisionCorrect.jsonExport.test.tsx)
- ✅ [src/utils/excelExport.test.ts](../../src/utils/excelExport.test.ts)
