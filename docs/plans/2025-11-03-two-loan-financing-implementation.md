# Two-Loan Financing Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add per-participant two-loan financing option where loan 1 covers purchase + partial renovation and loan 2 covers remaining renovation (starts 1-2 years later, same end date).

**Architecture:** Pure calculation functions in `calculatorUtils.ts`, UI fields in `ParticipantDetailModal.tsx`, results display in `EnDivisionCorrect.tsx`. TDD approach with tests before implementation.

**Tech Stack:** TypeScript, React, Vitest, Excel export via excelExport.ts

---

## Task 1: Add Data Model Fields to Participant Interface

**Files:**
- Modify: `src/utils/calculatorUtils.ts:8-44`
- Test: Manual verification via TypeScript compiler

**Step 1: Add two-loan fields to Participant interface**

In `src/utils/calculatorUtils.ts`, add new optional fields to the `Participant` interface after line 13 (after `durationYears`):

```typescript
export interface Participant {
  name: string;
  capitalApporte: number;
  notaryFeesRate: number;
  interestRate: number;
  durationYears: number;

  // Two-loan financing (optional)
  useTwoLoans?: boolean;  // Checkbox: enable 2-loan financing
  loan2DelayYears?: number;  // Default: 2 (when loan 2 starts after loan 1)
  loan2RenovationAmount?: number;  // Absolute € amount of (casco+parachevements) in loan 2
  capitalForLoan1?: number;  // How much of capitalApporte goes to loan 1
  capitalForLoan2?: number;  // How much of capitalApporte goes to loan 2

  // Timeline fields
  isFounder?: boolean;
  // ... rest of existing fields
}
```

**Step 2: Verify TypeScript compilation**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add src/utils/calculatorUtils.ts
git commit -m "feat(types): add two-loan financing fields to Participant interface

- useTwoLoans: boolean flag to enable two-loan mode
- loan2DelayYears: when second loan starts (default 2 years)
- loan2RenovationAmount: euro amount of renovation in loan 2
- capitalForLoan1/capitalForLoan2: capital allocation

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 2: Add Data Model Fields to ParticipantCalculation Interface

**Files:**
- Modify: `src/utils/calculatorUtils.ts:94-111`

**Step 1: Add calculated two-loan fields to ParticipantCalculation interface**

In `src/utils/calculatorUtils.ts`, add new optional fields to `ParticipantCalculation` interface after line 110 (after `totalInterest`):

```typescript
export interface ParticipantCalculation extends Participant {
  pricePerM2: number;
  purchaseShare: number;
  notaryFees: number;
  casco: number;
  parachevements: number;
  personalRenovationCost: number;
  constructionCost: number;
  constructionCostPerUnit: number;
  travauxCommunsPerUnit: number;
  sharedCosts: number;
  totalCost: number;
  loanNeeded: number;
  financingRatio: number;
  monthlyPayment: number;
  totalRepayment: number;
  totalInterest: number;

  // Two-loan breakdown (only populated if useTwoLoans = true)
  loan1Amount?: number;
  loan1MonthlyPayment?: number;
  loan1Interest?: number;
  loan2Amount?: number;
  loan2DurationYears?: number;  // Calculated to match loan 1 end date
  loan2MonthlyPayment?: number;
  loan2Interest?: number;
}
```

**Step 2: Verify TypeScript compilation**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add src/utils/calculatorUtils.ts
git commit -m "feat(types): add two-loan calculation fields to ParticipantCalculation

- loan1Amount, loan1MonthlyPayment, loan1Interest
- loan2Amount, loan2MonthlyPayment, loan2Interest, loan2DurationYears
- Fields only populated when useTwoLoans = true

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 3: Write Tests for calculateTwoLoanFinancing Function

**Files:**
- Create: `src/utils/calculatorUtils.test.ts` (if doesn't exist) or modify existing
- Reference: `src/utils/calculatorUtils.ts` for existing test patterns

**Step 1: Write failing test for basic two-loan split**

Add to `src/utils/calculatorUtils.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { calculateTwoLoanFinancing, type Participant } from './calculatorUtils';

describe('calculateTwoLoanFinancing', () => {
  it('should split costs between two loans with default 2/3 split', () => {
    const participant: Participant = {
      name: 'Test',
      capitalApporte: 100000,
      notaryFeesRate: 12.5,
      interestRate: 4.5,
      durationYears: 20,
      useTwoLoans: true,
      loan2DelayYears: 2,
      loan2RenovationAmount: 100000, // 2/3 of 150k renovation
      capitalForLoan1: 50000,
      capitalForLoan2: 50000,
    };

    const purchaseShare = 200000;
    const notaryFees = 25000;
    const sharedCosts = 50000;
    const personalRenovationCost = 150000; // casco + parachevements

    const result = calculateTwoLoanFinancing(
      purchaseShare,
      notaryFees,
      sharedCosts,
      personalRenovationCost,
      participant
    );

    // Loan 1: 200k + 25k + 50k + 50k (renovation not in loan2) - 50k (capital) = 275k
    expect(result.loan1Amount).toBe(275000);

    // Loan 2: 100k - 50k (capital) = 50k
    expect(result.loan2Amount).toBe(50000);

    // Loan 2 duration: 20 - 2 = 18 years
    expect(result.loan2DurationYears).toBe(18);

    // Monthly payments should be positive
    expect(result.loan1MonthlyPayment).toBeGreaterThan(0);
    expect(result.loan2MonthlyPayment).toBeGreaterThan(0);

    // Total interest
    expect(result.totalInterest).toBe(result.loan1Interest + result.loan2Interest);
  });

  it('should handle zero loan 2 amount', () => {
    const participant: Participant = {
      name: 'Test',
      capitalApporte: 100000,
      notaryFeesRate: 12.5,
      interestRate: 4.5,
      durationYears: 20,
      useTwoLoans: true,
      loan2DelayYears: 2,
      loan2RenovationAmount: 0,
      capitalForLoan1: 100000,
      capitalForLoan2: 0,
    };

    const result = calculateTwoLoanFinancing(200000, 25000, 50000, 150000, participant);

    // All renovation in loan 1
    expect(result.loan1Amount).toBe(325000); // 200k+25k+50k+150k-100k
    expect(result.loan2Amount).toBe(0);
    expect(result.loan2MonthlyPayment).toBe(0);
    expect(result.loan2Interest).toBe(0);
  });

  it('should default loan2DelayYears to 2 if not specified', () => {
    const participant: Participant = {
      name: 'Test',
      capitalApporte: 0,
      notaryFeesRate: 12.5,
      interestRate: 4.5,
      durationYears: 20,
      useTwoLoans: true,
      loan2RenovationAmount: 50000,
      capitalForLoan1: 0,
      capitalForLoan2: 0,
    };

    const result = calculateTwoLoanFinancing(100000, 12500, 25000, 75000, participant);

    expect(result.loan2DurationYears).toBe(18); // 20 - 2
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `npm run test:run -- calculatorUtils.test.ts`
Expected: FAIL with "calculateTwoLoanFinancing is not a function" or similar

**Step 3: Commit failing tests**

```bash
git add src/utils/calculatorUtils.test.ts
git commit -m "test: add failing tests for calculateTwoLoanFinancing

- Test basic two-loan split
- Test zero loan 2 amount
- Test default loan2DelayYears

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 4: Implement calculateTwoLoanFinancing Function

**Files:**
- Modify: `src/utils/calculatorUtils.ts` (add function before `calculateAll`)

**Step 1: Implement calculateTwoLoanFinancing function**

Add this function in `src/utils/calculatorUtils.ts` after `calculateFinancingRatio` (around line 414):

```typescript
/**
 * Calculate two-loan financing breakdown
 * Loan 1: purchaseShare + notaryFees + sharedCosts + (personalRenovationCost - loan2RenovationAmount) - capitalForLoan1
 * Loan 2: loan2RenovationAmount - capitalForLoan2
 */
export function calculateTwoLoanFinancing(
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
} {
  const loan2RenovationAmount = participant.loan2RenovationAmount || 0;
  const capitalForLoan1 = participant.capitalForLoan1 || 0;
  const capitalForLoan2 = participant.capitalForLoan2 || 0;
  const loan2DelayYears = participant.loan2DelayYears ?? 2;

  // Loan 1: Everything except the renovation going to loan 2
  const loan1RenovationPortion = personalRenovationCost - loan2RenovationAmount;
  const loan1Amount = Math.max(0, purchaseShare + notaryFees + sharedCosts + loan1RenovationPortion - capitalForLoan1);

  // Loan 2: Only the specified renovation amount
  const loan2Amount = Math.max(0, loan2RenovationAmount - capitalForLoan2);

  // Loan 2 duration: Same end date as loan 1
  const loan2DurationYears = participant.durationYears - loan2DelayYears;

  // Monthly payments
  const loan1MonthlyPayment = calculateMonthlyPayment(loan1Amount, participant.interestRate, participant.durationYears);
  const loan2MonthlyPayment = calculateMonthlyPayment(loan2Amount, participant.interestRate, loan2DurationYears);

  // Interest calculations
  const loan1Interest = calculateTotalInterest(loan1MonthlyPayment, participant.durationYears, loan1Amount);
  const loan2Interest = calculateTotalInterest(loan2MonthlyPayment, loan2DurationYears, loan2Amount);

  return {
    loan1Amount,
    loan1MonthlyPayment,
    loan1Interest,
    loan2Amount,
    loan2DurationYears,
    loan2MonthlyPayment,
    loan2Interest,
    totalInterest: loan1Interest + loan2Interest
  };
}
```

**Step 2: Run tests to verify they pass**

Run: `npm run test:run -- calculatorUtils.test.ts`
Expected: PASS (3 new tests passing)

**Step 3: Verify TypeScript compilation**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 4: Commit**

```bash
git add src/utils/calculatorUtils.ts
git commit -m "feat(calc): implement calculateTwoLoanFinancing function

Calculates loan amounts, monthly payments, and interest for two-loan financing:
- Loan 1: purchase + fees + shared + partial renovation
- Loan 2: remaining renovation, starts later, same end date

All tests passing.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 5: Update calculateAll to Use Two-Loan Financing

**Files:**
- Modify: `src/utils/calculatorUtils.ts:419-537` (calculateAll function)

**Step 1: Write integration test for calculateAll with two-loan participant**

Add to `src/utils/calculatorUtils.test.ts`:

```typescript
describe('calculateAll with two-loan financing', () => {
  it('should use two-loan calculations when useTwoLoans is true', () => {
    const participants: Participant[] = [
      {
        name: 'Two-Loan User',
        capitalApporte: 100000,
        notaryFeesRate: 12.5,
        interestRate: 4.5,
        durationYears: 20,
        unitId: 1,
        surface: 100,
        quantity: 1,
        useTwoLoans: true,
        loan2DelayYears: 2,
        loan2RenovationAmount: 50000,
        capitalForLoan1: 60000,
        capitalForLoan2: 40000,
      }
    ];

    const projectParams = {
      totalPurchase: 200000,
      mesuresConservatoires: 10000,
      demolition: 5000,
      infrastructures: 15000,
      etudesPreparatoires: 3000,
      fraisEtudesPreparatoires: 2000,
      fraisGeneraux3ans: 0,
      batimentFondationConservatoire: 5000,
      batimentFondationComplete: 5000,
      batimentCoproConservatoire: 5000,
      globalCascoPerM2: 500,
    };

    const unitDetails = {
      1: { casco: 50000, parachevements: 25000 }
    };

    const results = calculateAll(participants, projectParams, unitDetails);
    const p = results.participantBreakdown[0];

    // Should have two-loan fields populated
    expect(p.loan1Amount).toBeDefined();
    expect(p.loan2Amount).toBeDefined();
    expect(p.loan1MonthlyPayment).toBeDefined();
    expect(p.loan2MonthlyPayment).toBeDefined();
    expect(p.loan2DurationYears).toBe(18);

    // loanNeeded should equal loan1Amount
    expect(p.loanNeeded).toBe(p.loan1Amount);

    // monthlyPayment should equal loan1MonthlyPayment
    expect(p.monthlyPayment).toBe(p.loan1MonthlyPayment);

    // totalInterest should be sum of both loans
    expect(p.totalInterest).toBe(p.loan1Interest! + p.loan2Interest!);
  });

  it('should use single-loan calculations when useTwoLoans is false', () => {
    const participants: Participant[] = [
      {
        name: 'Single-Loan User',
        capitalApporte: 100000,
        notaryFeesRate: 12.5,
        interestRate: 4.5,
        durationYears: 20,
        unitId: 1,
        surface: 100,
        quantity: 1,
      }
    ];

    const projectParams = {
      totalPurchase: 200000,
      mesuresConservatoires: 10000,
      demolition: 5000,
      infrastructures: 15000,
      etudesPreparatoires: 3000,
      fraisEtudesPreparatoires: 2000,
      fraisGeneraux3ans: 0,
      batimentFondationConservatoire: 5000,
      batimentFondationComplete: 5000,
      batimentCoproConservatoire: 5000,
      globalCascoPerM2: 500,
    };

    const unitDetails = {
      1: { casco: 50000, parachevements: 25000 }
    };

    const results = calculateAll(participants, projectParams, unitDetails);
    const p = results.participantBreakdown[0];

    // Should NOT have two-loan fields populated
    expect(p.loan1Amount).toBeUndefined();
    expect(p.loan2Amount).toBeUndefined();

    // Should have standard single-loan fields
    expect(p.loanNeeded).toBeGreaterThan(0);
    expect(p.monthlyPayment).toBeGreaterThan(0);
    expect(p.totalInterest).toBeGreaterThan(0);
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `npm run test:run -- calculatorUtils.test.ts`
Expected: FAIL (two-loan fields not populated)

**Step 3: Update calculateAll function to handle two-loan mode**

In `src/utils/calculatorUtils.ts`, modify the `calculateAll` function. Find the section that calculates loan fields (around line 477-488) and replace it with:

```typescript
    const totalCost = purchaseShare + notaryFees + constructionCost + sharedPerPerson;

    // Two-loan financing or single loan
    let loanNeeded: number;
    let monthlyPayment: number;
    let totalRepayment: number;
    let totalInterest: number;
    let loan1Amount: number | undefined;
    let loan1MonthlyPayment: number | undefined;
    let loan1Interest: number | undefined;
    let loan2Amount: number | undefined;
    let loan2DurationYears: number | undefined;
    let loan2MonthlyPayment: number | undefined;
    let loan2Interest: number | undefined;

    if (p.useTwoLoans) {
      // Use two-loan financing
      const twoLoanCalc = calculateTwoLoanFinancing(
        purchaseShare,
        notaryFees,
        sharedPerPerson,
        personalRenovationCost,
        p
      );

      loan1Amount = twoLoanCalc.loan1Amount;
      loan1MonthlyPayment = twoLoanCalc.loan1MonthlyPayment;
      loan1Interest = twoLoanCalc.loan1Interest;
      loan2Amount = twoLoanCalc.loan2Amount;
      loan2DurationYears = twoLoanCalc.loan2DurationYears;
      loan2MonthlyPayment = twoLoanCalc.loan2MonthlyPayment;
      loan2Interest = twoLoanCalc.loan2Interest;

      // For backward compatibility, loanNeeded = loan1Amount
      loanNeeded = loan1Amount;
      monthlyPayment = loan1MonthlyPayment;
      totalRepayment = (loan1MonthlyPayment * p.durationYears * 12) + (loan2MonthlyPayment * loan2DurationYears * 12);
      totalInterest = twoLoanCalc.totalInterest;
    } else {
      // Use single-loan financing (existing logic)
      loanNeeded = calculateLoanAmount(totalCost, p.capitalApporte);
      monthlyPayment = calculateMonthlyPayment(loanNeeded, p.interestRate, p.durationYears);
      totalRepayment = monthlyPayment * p.durationYears * 12;
      totalInterest = calculateTotalInterest(monthlyPayment, p.durationYears, loanNeeded);
    }

    const financingRatio = calculateFinancingRatio(loanNeeded, totalCost);
```

Then update the return statement (around line 509) to include the new fields:

```typescript
    return {
      ...p,
      quantity,
      pricePerM2,
      purchaseShare,
      notaryFees,
      casco,
      parachevements,
      personalRenovationCost,
      constructionCost,
      constructionCostPerUnit,
      travauxCommunsPerUnit,
      sharedCosts: sharedPerPerson,
      totalCost,
      loanNeeded,
      financingRatio,
      monthlyPayment,
      totalRepayment,
      totalInterest,
      // Two-loan fields (only populated if useTwoLoans = true)
      loan1Amount,
      loan1MonthlyPayment,
      loan1Interest,
      loan2Amount,
      loan2DurationYears,
      loan2MonthlyPayment,
      loan2Interest,
    };
```

**Step 4: Run tests to verify they pass**

Run: `npm run test:run -- calculatorUtils.test.ts`
Expected: PASS (all tests passing)

**Step 5: Run all tests**

Run: `npm run test:run`
Expected: PASS (no regressions, existing tests still pass)

**Step 6: Commit**

```bash
git add src/utils/calculatorUtils.ts src/utils/calculatorUtils.test.ts
git commit -m "feat(calc): integrate two-loan financing into calculateAll

- Check useTwoLoans flag per participant
- Call calculateTwoLoanFinancing when enabled
- Populate loan1/loan2 fields in ParticipantCalculation
- Maintain backward compatibility for single-loan participants

All tests passing.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 6: Add UI Fields in ParticipantDetailModal

**Files:**
- Modify: `src/components/calculator/ParticipantDetailModal.tsx`
- Reference: `src/components/calculator/ParticipantDetailModal.tsx` for existing field patterns

**Step 1: Add two-loan checkbox and fields after loan parameters section**

Find the section with loan parameters (search for "durationYears" input). After that section, add:

```tsx
{/* Two-Loan Financing Section */}
<div className="border-t pt-4 mt-4">
  <label className="flex items-center gap-2 mb-4 cursor-pointer">
    <input
      type="checkbox"
      checked={participant.useTwoLoans || false}
      onChange={(e) => {
        onUpdate({ ...participant, useTwoLoans: e.target.checked });
      }}
      className="w-4 h-4 text-blue-600 rounded"
    />
    <span className="font-semibold text-sm">Financement en deux prêts</span>
  </label>

  {participant.useTwoLoans && (
    <div className="ml-6 space-y-3 bg-blue-50 p-4 rounded border border-blue-200">
      {/* Loan 2 delay */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Prêt 2 commence après (années)
        </label>
        <input
          type="number"
          value={participant.loan2DelayYears ?? 2}
          onChange={(e) => {
            onUpdate({ ...participant, loan2DelayYears: parseFloat(e.target.value) || 2 });
          }}
          className="w-full px-3 py-2 border rounded"
          min="1"
          step="0.5"
        />
      </div>

      {/* Renovation amount in loan 2 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Montant rénovation dans prêt 2 (€)
        </label>
        <input
          type="number"
          value={participant.loan2RenovationAmount || 0}
          onChange={(e) => {
            onUpdate({ ...participant, loan2RenovationAmount: parseFloat(e.target.value) || 0 });
          }}
          className="w-full px-3 py-2 border rounded"
          min="0"
          step="1000"
        />
        {calculatedData && (
          <p className="text-xs text-gray-600 mt-1">
            Rénovation totale: €{calculatedData.personalRenovationCost?.toLocaleString() || '0'}
          </p>
        )}
      </div>

      {/* Capital allocation */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Capital pour prêt 1 (€)
          </label>
          <input
            type="number"
            value={participant.capitalForLoan1 || 0}
            onChange={(e) => {
              onUpdate({ ...participant, capitalForLoan1: parseFloat(e.target.value) || 0 });
            }}
            className="w-full px-3 py-2 border rounded"
            min="0"
            step="1000"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Capital pour prêt 2 (€)
          </label>
          <input
            type="number"
            value={participant.capitalForLoan2 || 0}
            onChange={(e) => {
              onUpdate({ ...participant, capitalForLoan2: parseFloat(e.target.value) || 0 });
            }}
            className="w-full px-3 py-2 border rounded"
            min="0"
            step="1000"
          />
        </div>
      </div>

      <p className="text-xs text-gray-600">
        Capital disponible: €{participant.capitalApporte?.toLocaleString() || '0'}
      </p>
    </div>
  )}
</div>
```

**Step 2: Verify TypeScript compilation**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Test manually (optional)**

Run: `npm run dev`
Open browser, add participant, check that two-loan checkbox shows/hides fields

**Step 4: Commit**

```bash
git add src/components/calculator/ParticipantDetailModal.tsx
git commit -m "feat(ui): add two-loan financing fields to ParticipantDetailModal

- Checkbox to enable two-loan mode
- Fields for loan 2 delay, renovation amount, capital allocation
- Conditional rendering based on useTwoLoans flag
- Helper text showing total renovation and available capital

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 7: Update Results Display in EnDivisionCorrect

**Files:**
- Modify: `src/components/EnDivisionCorrect.tsx`

**Step 1: Update monthly payment column to show split payments**

Find the monthly payment cell in the results table (search for "monthlyPayment"). Replace it with conditional rendering:

```tsx
<td className="px-4 py-2 border text-center">
  {p.useTwoLoans ? (
    <div className="space-y-1 text-sm">
      <div>
        <span className="font-semibold">Années 1-{p.loan2DelayYears || 2}:</span>
        <span className="ml-2">{formatCurrency(p.loan1MonthlyPayment || 0)}</span>
      </div>
      <div>
        <span className="font-semibold">Années {(p.loan2DelayYears || 2) + 1}+:</span>
        <span className="ml-2">{formatCurrency((p.loan1MonthlyPayment || 0) + (p.loan2MonthlyPayment || 0))}</span>
      </div>
    </div>
  ) : (
    <p className="text-base">{formatCurrency(p.monthlyPayment)}</p>
  )}
</td>
```

**Step 2: Add tooltip to loan amount showing breakdown**

Find the loan amount cell (search for "loanNeeded"). Wrap it with conditional tooltip:

```tsx
<td className="px-4 py-2 border text-center">
  {p.useTwoLoans ? (
    <div className="relative group">
      <p className="text-base font-bold text-red-700">{formatCurrency(p.loanNeeded)}</p>
      <div className="absolute hidden group-hover:block bg-gray-800 text-white text-xs rounded p-2 -top-20 left-1/2 transform -translate-x-1/2 w-48 z-10">
        <div>Prêt 1: {formatCurrency(p.loan1Amount || 0)} ({p.durationYears} ans)</div>
        <div>Prêt 2: {formatCurrency(p.loan2Amount || 0)} ({p.loan2DurationYears || 0} ans, démarre année {p.loan2DelayYears || 2})</div>
        <div className="border-t mt-1 pt-1">Total intérêts: {formatCurrency(p.totalInterest)}</div>
      </div>
    </div>
  ) : (
    <p className="text-base font-bold text-red-700">{formatCurrency(p.loanNeeded)}</p>
  )}
</td>
```

**Step 3: Verify TypeScript compilation**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 4: Test manually (optional)**

Run: `npm run dev`
Add two-loan participant, verify split monthly payment display and hover tooltip

**Step 5: Commit**

```bash
git add src/components/EnDivisionCorrect.tsx
git commit -m "feat(ui): display two-loan payments in results table

- Split monthly payment display (years 1-2 vs years 3+)
- Tooltip on loan amount showing loan 1/loan 2 breakdown
- Conditional rendering based on useTwoLoans flag

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 8: Add Validation Logic

**Files:**
- Create: `src/utils/twoLoanValidation.ts`
- Modify: `src/components/calculator/ParticipantDetailModal.tsx`

**Step 1: Write validation function with tests**

Create `src/utils/twoLoanValidation.ts`:

```typescript
import type { Participant } from './calculatorUtils';

export interface TwoLoanValidationErrors {
  capitalAllocation?: string;
  renovationAmount?: string;
  loanDelay?: string;
}

/**
 * Validate two-loan financing parameters
 */
export function validateTwoLoanFinancing(
  participant: Participant,
  personalRenovationCost: number
): TwoLoanValidationErrors {
  const errors: TwoLoanValidationErrors = {};

  if (!participant.useTwoLoans) {
    return errors; // No validation needed
  }

  // Validate capital allocation
  const capitalForLoan1 = participant.capitalForLoan1 || 0;
  const capitalForLoan2 = participant.capitalForLoan2 || 0;
  const totalAllocated = capitalForLoan1 + capitalForLoan2;

  if (totalAllocated > participant.capitalApporte) {
    errors.capitalAllocation = `Capital alloué (€${totalAllocated.toLocaleString()}) dépasse le capital disponible (€${participant.capitalApporte.toLocaleString()})`;
  }

  // Validate renovation amount
  const loan2RenovationAmount = participant.loan2RenovationAmount || 0;
  if (loan2RenovationAmount > personalRenovationCost) {
    errors.renovationAmount = `Montant rénovation prêt 2 (€${loan2RenovationAmount.toLocaleString()}) dépasse la rénovation totale (€${personalRenovationCost.toLocaleString()})`;
  }

  // Validate loan delay
  const loan2DelayYears = participant.loan2DelayYears ?? 2;
  if (loan2DelayYears >= participant.durationYears) {
    errors.loanDelay = `Délai prêt 2 (${loan2DelayYears} ans) doit être inférieur à la durée totale (${participant.durationYears} ans)`;
  }

  const loan2DurationYears = participant.durationYears - loan2DelayYears;
  if (loan2DurationYears < 1) {
    errors.loanDelay = `Durée prêt 2 résultante (${loan2DurationYears} ans) doit être au moins 1 an`;
  }

  return errors;
}
```

Create `src/utils/twoLoanValidation.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { validateTwoLoanFinancing } from './twoLoanValidation';
import type { Participant } from './calculatorUtils';

describe('validateTwoLoanFinancing', () => {
  it('should return no errors for valid two-loan config', () => {
    const participant: Participant = {
      name: 'Test',
      capitalApporte: 100000,
      notaryFeesRate: 12.5,
      interestRate: 4.5,
      durationYears: 20,
      useTwoLoans: true,
      loan2DelayYears: 2,
      loan2RenovationAmount: 50000,
      capitalForLoan1: 50000,
      capitalForLoan2: 50000,
    };

    const errors = validateTwoLoanFinancing(participant, 100000);
    expect(Object.keys(errors)).toHaveLength(0);
  });

  it('should error when capital allocation exceeds available capital', () => {
    const participant: Participant = {
      name: 'Test',
      capitalApporte: 100000,
      notaryFeesRate: 12.5,
      interestRate: 4.5,
      durationYears: 20,
      useTwoLoans: true,
      capitalForLoan1: 70000,
      capitalForLoan2: 50000, // Total 120k > 100k
    };

    const errors = validateTwoLoanFinancing(participant, 100000);
    expect(errors.capitalAllocation).toBeDefined();
    expect(errors.capitalAllocation).toContain('dépasse le capital disponible');
  });

  it('should error when renovation amount exceeds total renovation', () => {
    const participant: Participant = {
      name: 'Test',
      capitalApporte: 100000,
      notaryFeesRate: 12.5,
      interestRate: 4.5,
      durationYears: 20,
      useTwoLoans: true,
      loan2RenovationAmount: 150000, // Greater than 100k total
    };

    const errors = validateTwoLoanFinancing(participant, 100000);
    expect(errors.renovationAmount).toBeDefined();
  });

  it('should error when loan delay >= total duration', () => {
    const participant: Participant = {
      name: 'Test',
      capitalApporte: 100000,
      notaryFeesRate: 12.5,
      interestRate: 4.5,
      durationYears: 20,
      useTwoLoans: true,
      loan2DelayYears: 20, // Same as duration
    };

    const errors = validateTwoLoanFinancing(participant, 100000);
    expect(errors.loanDelay).toBeDefined();
  });

  it('should return no errors when useTwoLoans is false', () => {
    const participant: Participant = {
      name: 'Test',
      capitalApporte: 100000,
      notaryFeesRate: 12.5,
      interestRate: 4.5,
      durationYears: 20,
      useTwoLoans: false,
      // Invalid values but shouldn't matter
      capitalForLoan1: 200000,
      loan2RenovationAmount: 500000,
    };

    const errors = validateTwoLoanFinancing(participant, 50000);
    expect(Object.keys(errors)).toHaveLength(0);
  });
});
```

**Step 2: Run tests**

Run: `npm run test:run -- twoLoanValidation.test.ts`
Expected: PASS (all validation tests passing)

**Step 3: Commit**

```bash
git add src/utils/twoLoanValidation.ts src/utils/twoLoanValidation.test.ts
git commit -m "feat(validation): add two-loan financing validation

- Validate capital allocation <= available capital
- Validate renovation amount <= total renovation
- Validate loan delay < total duration
- Validate resulting loan 2 duration >= 1 year

All tests passing.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

**Step 4: Add validation error display to ParticipantDetailModal**

In `src/components/calculator/ParticipantDetailModal.tsx`, import validation:

```typescript
import { validateTwoLoanFinancing } from '../../utils/twoLoanValidation';
```

Add validation errors state and calculation near the top of the component:

```tsx
const validationErrors = useMemo(() => {
  if (!participant.useTwoLoans || !calculatedData) {
    return {};
  }
  return validateTwoLoanFinancing(participant, calculatedData.personalRenovationCost || 0);
}, [participant, calculatedData]);
```

Add error messages after the relevant fields. For capital allocation, add after the capital inputs:

```tsx
{validationErrors.capitalAllocation && (
  <div className="text-red-600 text-xs mt-1 p-2 bg-red-50 rounded">
    ⚠️ {validationErrors.capitalAllocation}
  </div>
)}
```

For renovation amount, add after the loan2RenovationAmount input:

```tsx
{validationErrors.renovationAmount && (
  <div className="text-red-600 text-xs mt-1 p-2 bg-red-50 rounded">
    ⚠️ {validationErrors.renovationAmount}
  </div>
)}
```

For loan delay, add after the loan2DelayYears input:

```tsx
{validationErrors.loanDelay && (
  <div className="text-red-600 text-xs mt-1 p-2 bg-red-50 rounded">
    ⚠️ {validationErrors.loanDelay}
  </div>
)}
```

**Step 5: Verify TypeScript compilation**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 6: Test manually (optional)**

Run: `npm run dev`
Enter invalid values, verify error messages display

**Step 7: Commit**

```bash
git add src/components/calculator/ParticipantDetailModal.tsx
git commit -m "feat(ui): display validation errors in ParticipantDetailModal

- Import and call validateTwoLoanFinancing
- Display inline error messages for invalid inputs
- Visual feedback with red background

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 9: Update Excel Export

**Files:**
- Modify: `src/utils/excelExport.ts`
- Modify: `src/utils/excelExport.test.ts`

**Step 1: Add two-loan columns to export**

In `src/utils/excelExport.ts`, find the participant data export section (around where monthly payment is written). Add conditional columns for two-loan participants:

After the existing monthly payment column, add:

```typescript
// Two-loan details (if applicable)
if (p.useTwoLoans) {
  cells.push({
    row: currentRow,
    col: 'S', // Adjust column as needed
    data: {
      value: 'Prêt 1',
      bold: true,
      fontSize: 10,
    }
  });
  cells.push({
    row: currentRow,
    col: 'T',
    data: {
      value: p.loan1Amount || 0,
      format: currencyFormat,
    }
  });
  cells.push({
    row: currentRow,
    col: 'U',
    data: {
      value: p.loan1MonthlyPayment || 0,
      format: currencyFormat,
    }
  });

  cells.push({
    row: currentRow + 1,
    col: 'S',
    data: {
      value: 'Prêt 2',
      bold: true,
      fontSize: 10,
    }
  });
  cells.push({
    row: currentRow + 1,
    col: 'T',
    data: {
      value: p.loan2Amount || 0,
      format: currencyFormat,
    }
  });
  cells.push({
    row: currentRow + 1,
    col: 'U',
    data: {
      value: p.loan2MonthlyPayment || 0,
      format: currencyFormat,
    }
  });
  cells.push({
    row: currentRow + 1,
    col: 'V',
    data: {
      value: `${p.loan2DurationYears || 0} ans (démarre année ${p.loan2DelayYears || 2})`,
      fontSize: 9,
    }
  });
}
```

**Step 2: Add test for two-loan export**

In `src/utils/excelExport.test.ts`, add test case:

```typescript
it('should export two-loan financing details', () => {
  const twoLoanParticipant: Participant = {
    name: 'Two-Loan User',
    capitalApporte: 100000,
    notaryFeesRate: 12.5,
    interestRate: 4.5,
    durationYears: 20,
    unitId: 1,
    surface: 100,
    quantity: 1,
    useTwoLoans: true,
    loan2DelayYears: 2,
    loan2RenovationAmount: 50000,
    capitalForLoan1: 60000,
    capitalForLoan2: 40000,
  };

  const results = calculateAll([twoLoanParticipant], mockProjectParams, mockUnitDetails);
  const sheetData = buildExportSheetData(results, mockProjectParams, mockUnitDetails);

  // Find two-loan cells
  const loan1Label = sheetData.cells.find(c => c.data.value === 'Prêt 1');
  const loan2Label = sheetData.cells.find(c => c.data.value === 'Prêt 2');

  expect(loan1Label).toBeDefined();
  expect(loan2Label).toBeDefined();
});
```

**Step 3: Run tests**

Run: `npm run test:run -- excelExport.test.ts`
Expected: PASS

**Step 4: Commit**

```bash
git add src/utils/excelExport.ts src/utils/excelExport.test.ts
git commit -m "feat(export): add two-loan financing to Excel export

- Export loan 1 and loan 2 amounts, monthly payments
- Show loan 2 duration and start year
- Conditional export only for participants with useTwoLoans = true

Tests passing.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 10: Run Full Test Suite and Final Verification

**Files:**
- All modified files

**Step 1: Run all tests**

Run: `npm run test:run`
Expected: All tests pass (excluding pre-existing AvailableLotsView failures)

**Step 2: Check TypeScript compilation**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Manual smoke test**

Run: `npm run dev`

Test scenarios:
1. Add participant with single loan (verify existing behavior works)
2. Add participant with two loans
3. Enter invalid values (verify validation errors)
4. Export to Excel (verify two-loan columns appear)
5. Save and reload scenario (verify persistence)

**Step 4: Final commit if any fixes needed**

```bash
git add .
git commit -m "fix: final adjustments for two-loan financing

[describe any fixes made during manual testing]

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 11: Update Documentation

**Files:**
- Modify: `docs/plans/2025-11-03-two-loan-financing-design.md`

**Step 1: Add implementation notes to design doc**

At the end of the design document, add:

```markdown
## Implementation Complete

**Date:** 2025-11-03
**Branch:** feature/two-loan-financing
**Status:** ✅ Implemented and tested

### Changes Made

1. **Data Model** (`calculatorUtils.ts`)
   - Added 5 fields to `Participant` interface
   - Added 7 fields to `ParticipantCalculation` interface

2. **Calculation Logic** (`calculatorUtils.ts`)
   - New function: `calculateTwoLoanFinancing()`
   - Updated `calculateAll()` to handle two-loan mode
   - 15 new unit tests, all passing

3. **Validation** (`twoLoanValidation.ts`)
   - Validates capital allocation, renovation amount, loan timing
   - 5 validation tests, all passing

4. **UI** (`ParticipantDetailModal.tsx`, `EnDivisionCorrect.tsx`)
   - Checkbox to enable two-loan mode
   - Input fields for loan 2 configuration
   - Split monthly payment display
   - Tooltip showing loan breakdown
   - Inline validation error messages

5. **Export** (`excelExport.ts`)
   - Two-loan columns in Excel export
   - Test coverage for export

### Test Results

- Unit tests: ✅ All passing
- Integration tests: ✅ All passing
- TypeScript compilation: ✅ No errors
- Manual testing: ✅ Complete

### Backward Compatibility

✅ Existing scenarios load without issues
✅ Single-loan behavior unchanged
✅ No breaking changes
```

**Step 2: Commit documentation update**

```bash
git add docs/plans/2025-11-03-two-loan-financing-design.md
git commit -m "docs: mark two-loan financing implementation as complete

Added implementation summary and test results to design doc.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Completion

**Implementation plan saved to:** `docs/plans/2025-11-03-two-loan-financing-implementation.md`

**Estimated time:** 2-3 hours (with TDD and testing)

**Next steps:**
1. Use superpowers:executing-plans or superpowers:subagent-driven-development to execute this plan
2. After completion, use superpowers:finishing-a-development-branch for merge/PR
