# Two-Loan Financing Feature Design

**Date:** 2025-11-03
**Status:** Approved for implementation

## Overview

Add support for participants to use two-loan financing instead of a single loan. This reflects real-world financing where:
- **Loan 1** covers initial purchase costs and partial renovation
- **Loan 2** covers remaining renovation costs, starting 1-2 years later during the renovation phase

## User Requirements

- Per-participant configuration (each participant chooses 1 or 2 loans independently)
- Same interest rate for both loans
- Both loans end on the same date (loan 2 has shorter duration)
- Loan 2 starts 2 years after loan 1 by default (editable)
- User decides how much renovation cost goes into loan 2 (absolute amount in euros)
- User decides how to allocate capital between the two loans
- Display both monthly payment amounts (years 1-2 and years 3+)
- Show single total interest for both loans combined

## Data Model

### New Participant Fields

```typescript
export interface Participant {
  // ... existing fields ...

  // Two-loan financing (optional)
  useTwoLoans?: boolean;  // Checkbox: enable 2-loan financing

  // Loan 2 configuration (only used if useTwoLoans = true)
  loan2DelayYears?: number;  // Default: 2 (when loan 2 starts after loan 1)
  loan2RenovationAmount?: number;  // Absolute € amount of (casco+parachevements) in loan 2
  capitalForLoan1?: number;  // How much of capitalApporte goes to loan 1
  capitalForLoan2?: number;  // How much of capitalApporte goes to loan 2
}
```

### New ParticipantCalculation Fields

```typescript
export interface ParticipantCalculation extends Participant {
  // ... existing fields ...

  // Two-loan breakdown (only populated if useTwoLoans = true)
  loan1Amount?: number;
  loan1MonthlyPayment?: number;
  loan1Interest?: number;

  loan2Amount?: number;
  loan2DurationYears?: number;  // Calculated to match loan 1 end date
  loan2MonthlyPayment?: number;
  loan2Interest?: number;

  // Existing fields keep their meaning:
  // loanNeeded = loan1Amount (or total if single loan)
  // monthlyPayment = loan1MonthlyPayment (or single payment if one loan)
  // totalInterest = loan1Interest + loan2Interest (combined)
}
```

## Calculation Logic

### Loan Split Formula

**Loan 1 covers:**
- Full purchase share (Part d'achat)
- Full notary fees (droit d'enregistrement)
- Full shared costs (commun)
- Renovation costs NOT in loan 2 (personalRenovationCost - loan2RenovationAmount)
- Minus capital allocated to loan 1

**Loan 2 covers:**
- Renovation amount specified by user (loan2RenovationAmount)
- Minus capital allocated to loan 2

### Duration Calculation

- Loan 1: Uses participant's `durationYears` as-is
- Loan 2: `durationYears - loan2DelayYears` (ensures same end date)

### New Function

```typescript
function calculateTwoLoanFinancing(
  purchaseShare: number,
  notaryFees: number,
  sharedCosts: number,
  personalRenovationCost: number,
  participant: Participant
): {
  loan1Amount: number;
  loan1MonthlyPayment: number;
  loan1Interest: number;
  loan2Amount: number;
  loan2DurationYears: number;
  loan2MonthlyPayment: number;
  loan2Interest: number;
  totalInterest: number;
}
```

## UI Changes

### ParticipantDetailModal

Add new section after existing loan parameters:

1. **Checkbox:** "Use two-loan financing"
2. **Conditional fields** (shown when checkbox enabled):
   - Loan 2 starts after (years) - default: 2
   - Renovation amount in loan 2 (€) - with total renovation hint
   - Capital for loan 1 (€)
   - Capital for loan 2 (€) - with total capital hint

### Results Table

**Monthly Payment Column:**
- Single loan: Show one payment amount
- Two loans: Show split display:
  - "Years 1-2: €X"
  - "Years 3+: €Y" (sum of both loans)

**Tooltip/Hover:**
- Loan 1: €X (Y years)
- Loan 2: €Z (W years, starts year N)
- Total interest: €T

## Validation Rules

1. **Capital allocation:** `capitalForLoan1 + capitalForLoan2 ≤ capitalApporte`
2. **Renovation amount:** `loan2RenovationAmount ≤ personalRenovationCost`
3. **Loan delay:** `loan2DelayYears < durationYears`
4. **Minimum loan 2 duration:** `loan2DurationYears ≥ 1`

Error messages display inline below relevant inputs.

## Excel Export

For two-loan participants, add columns:
- Loan 1 Amount
- Loan 1 Monthly Payment
- Loan 2 Amount
- Loan 2 Monthly Payment
- Loan 2 Duration (years)
- Combined Monthly Payment (Years X+)

## Testing Strategy

1. **Unit tests:**
   - `calculateTwoLoanFinancing()` with various scenarios
   - Edge cases (zero amounts, minimum durations)
   - Interest calculations

2. **Integration tests:**
   - Mixed participants (some 1-loan, some 2-loan)
   - Totals aggregation
   - Backward compatibility

3. **UI tests:**
   - Toggle visibility
   - Validation error display
   - Results formatting

## Backward Compatibility

- New fields are optional (default: `useTwoLoans = false`)
- Existing scenarios load unchanged
- No data migration needed
- Single-loan behavior remains default

## Implementation Phases

1. Add data model fields
2. Implement `calculateTwoLoanFinancing()` function (TDD)
3. Update `calculateAll()` to handle two-loan mode
4. Add UI fields in ParticipantDetailModal
5. Update results display in EnDivisionCorrect
6. Add validation logic
7. Update Excel export
8. Write comprehensive tests
