# Formula Tooltips Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add formula tooltips to all calculated amounts in the calculator UI for transparency

**Architecture:** Install Radix UI Tooltip, create reusable FormulaTooltip component, build formula explanation utilities, wrap high-priority calculated values with tooltips showing hybrid-style formula explanations (description + values + formula reference)

**Tech Stack:**
- @radix-ui/react-tooltip (accessible tooltip primitives)
- Tailwind CSS (styling)
- lucide-react Info icon (already installed)
- Vitest (testing)

---

## Task 1: Install Radix UI Tooltip

**Files:**
- Modify: `package.json`

**Step 1: Install @radix-ui/react-tooltip**

```bash
npm install @radix-ui/react-tooltip
```

Expected: Package added to dependencies

**Step 2: Verify installation**

```bash
npm list @radix-ui/react-tooltip
```

Expected: Shows installed version

**Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "deps: add @radix-ui/react-tooltip for formula tooltips"
```

---

## Task 2: Create Formula Explanation Utilities (TDD)

**Files:**
- Create: `src/utils/formulaExplanations.ts`
- Create: `src/utils/formulaExplanations.test.ts`

**Step 1: Write the failing test**

Create `src/utils/formulaExplanations.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import {
  getTotalCostFormula,
  getPurchaseShareFormula,
  getNotaryFeesFormula,
  getMonthlyPaymentFormula,
  getLoanNeededFormula,
  getPricePerM2Formula
} from './formulaExplanations';
import type { ParticipantCalculation, CalculationTotals } from './calculatorUtils';

describe('formulaExplanations', () => {
  const mockParticipant: ParticipantCalculation = {
    name: 'Test',
    capitalApporte: 50000,
    notaryFeesRate: 12.5,
    interestRate: 4.5,
    durationYears: 25,
    surface: 112,
    quantity: 1,
    pricePerM2: 892.86,
    purchaseShare: 100000,
    notaryFees: 12500,
    casco: 30000,
    parachevements: 20000,
    personalRenovationCost: 50000,
    constructionCost: 40000,
    constructionCostPerUnit: 40000,
    travauxCommunsPerUnit: 5000,
    sharedCosts: 10000,
    totalCost: 172500,
    loanNeeded: 122500,
    financingRatio: 71.01,
    monthlyPayment: 682.15,
    totalRepayment: 204645,
    totalInterest: 82145
  };

  describe('getTotalCostFormula', () => {
    it('returns correct formula explanation', () => {
      const formula = getTotalCostFormula(mockParticipant);

      expect(formula).toHaveLength(2);
      expect(formula[0]).toBe('Total cost for this participant');
      expect(formula[1]).toContain('€100,000');
      expect(formula[1]).toContain('€12,500');
      expect(formula[1]).toContain('€40,000');
      expect(formula[1]).toContain('€10,000');
    });
  });

  describe('getPurchaseShareFormula', () => {
    it('returns correct formula with price per m2', () => {
      const formula = getPurchaseShareFormula(mockParticipant, 892.86);

      expect(formula).toHaveLength(2);
      expect(formula[0]).toBe('Your share of the building purchase');
      expect(formula[1]).toContain('€892.86/m²');
      expect(formula[1]).toContain('112m²');
      expect(formula[1]).toContain('€100,000');
    });
  });

  describe('getNotaryFeesFormula', () => {
    it('returns correct notary fees explanation', () => {
      const formula = getNotaryFeesFormula(mockParticipant);

      expect(formula).toHaveLength(2);
      expect(formula[0]).toBe('Belgian notary fees for property transfer');
      expect(formula[1]).toContain('€100,000');
      expect(formula[1]).toContain('12.5%');
      expect(formula[1]).toContain('€12,500');
    });
  });

  describe('getMonthlyPaymentFormula', () => {
    it('returns correct PMT formula explanation', () => {
      const formula = getMonthlyPaymentFormula(mockParticipant);

      expect(formula).toHaveLength(3);
      expect(formula[0]).toBe('Loan repayment over duration');
      expect(formula[1]).toContain('€122,500');
      expect(formula[1]).toContain('4.5%');
      expect(formula[1]).toContain('25 years');
      expect(formula[2]).toBe('PMT(rate/12, years×12, -principal)');
    });
  });

  describe('getLoanNeededFormula', () => {
    it('returns correct loan calculation', () => {
      const formula = getLoanNeededFormula(mockParticipant);

      expect(formula).toHaveLength(2);
      expect(formula[0]).toBe('Amount to borrow');
      expect(formula[1]).toContain('€172,500');
      expect(formula[1]).toContain('€50,000');
      expect(formula[1]).toContain('€122,500');
    });
  });

  describe('getPricePerM2Formula', () => {
    it('returns correct price per m2 calculation', () => {
      const totals: CalculationTotals = {
        purchase: 650000,
        totalNotaryFees: 81250,
        construction: 368900,
        shared: 237140,
        totalTravauxCommuns: 150000,
        travauxCommunsPerUnit: 37500,
        total: 1337290,
        capitalTotal: 490000,
        totalLoansNeeded: 847290,
        averageLoan: 211822.5,
        averageCapital: 122500
      };

      const formula = getPricePerM2Formula(totals, 728);

      expect(formula).toHaveLength(2);
      expect(formula[0]).toBe('Average price per square meter');
      expect(formula[1]).toContain('€650,000');
      expect(formula[1]).toContain('728m²');
    });
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npm run test:run src/utils/formulaExplanations.test.ts
```

Expected: FAIL - module not found

**Step 3: Write minimal implementation**

Create `src/utils/formulaExplanations.ts`:

```typescript
import type { ParticipantCalculation, CalculationTotals } from './calculatorUtils';

/**
 * Formula explanation utilities for tooltips
 * Returns string arrays where:
 * - Line 1: Brief description
 * - Line 2+: Values and formula in plain language
 */

export function getTotalCostFormula(p: ParticipantCalculation): string[] {
  return [
    'Total cost for this participant',
    `Purchase €${p.purchaseShare.toLocaleString()} + Notary €${p.notaryFees.toLocaleString()} + Construction €${p.constructionCost.toLocaleString()} + Shared €${p.sharedCosts.toLocaleString()}`
  ];
}

export function getPurchaseShareFormula(p: ParticipantCalculation, pricePerM2: number): string[] {
  return [
    'Your share of the building purchase',
    `€${pricePerM2.toFixed(2)}/m² × ${p.surface}m² = €${p.purchaseShare.toLocaleString()}`
  ];
}

export function getNotaryFeesFormula(p: ParticipantCalculation): string[] {
  return [
    'Belgian notary fees for property transfer',
    `€${p.purchaseShare.toLocaleString()} purchase × ${p.notaryFeesRate}% rate = €${p.notaryFees.toLocaleString()}`
  ];
}

export function getMonthlyPaymentFormula(p: ParticipantCalculation): string[] {
  return [
    'Loan repayment over duration',
    `€${p.loanNeeded.toLocaleString()} loan at ${p.interestRate}% over ${p.durationYears} years`,
    'PMT(rate/12, years×12, -principal)'
  ];
}

export function getLoanNeededFormula(p: ParticipantCalculation): string[] {
  return [
    'Amount to borrow',
    `€${p.totalCost.toLocaleString()} total cost - €${p.capitalApporte.toLocaleString()} capital = €${p.loanNeeded.toLocaleString()} loan`
  ];
}

export function getPersonalRenovationFormula(p: ParticipantCalculation): string[] {
  return [
    'CASCO + Parachèvements for your units',
    `€${p.casco.toLocaleString()} CASCO + €${p.parachevements.toLocaleString()} parachèvements = €${p.personalRenovationCost.toLocaleString()}`
  ];
}

export function getConstructionCostFormula(
  p: ParticipantCalculation,
  totalConstruction: number,
  totalUnits: number
): string[] {
  return [
    'Your share of shared construction',
    `€${totalConstruction.toLocaleString()} total ÷ ${totalUnits} units × ${p.quantity} quantity = €${p.constructionCost.toLocaleString()}`
  ];
}

export function getSharedCostsFormula(p: ParticipantCalculation, participantCount: number): string[] {
  return [
    'Common project expenses',
    `Infrastructure + Studies + Frais généraux ÷ ${participantCount} participants = €${p.sharedCosts.toLocaleString()}`
  ];
}

export function getPricePerM2Formula(totals: CalculationTotals, totalSurface: number): string[] {
  return [
    'Average price per square meter',
    `€${totals.purchase.toLocaleString()} total purchase ÷ ${totalSurface}m² total surface`
  ];
}

export function getTotalProjectCostFormula(totals: CalculationTotals): string[] {
  return [
    'Sum of all project expenses',
    `Purchase €${totals.purchase.toLocaleString()} + Notary €${totals.totalNotaryFees.toLocaleString()} + Construction €${totals.construction.toLocaleString()} + Shared €${totals.shared.toLocaleString()}`
  ];
}

export function getTotalLoansFormula(totals: CalculationTotals): string[] {
  return [
    'Sum of all participant loans',
    `Total of all individual loan amounts = €${totals.totalLoansNeeded.toLocaleString()}`
  ];
}
```

**Step 4: Run test to verify it passes**

```bash
npm run test:run src/utils/formulaExplanations.test.ts
```

Expected: PASS (all tests green)

**Step 5: Commit**

```bash
git add src/utils/formulaExplanations.ts src/utils/formulaExplanations.test.ts
git commit -m "feat: add formula explanation utilities with tests"
```

---

## Task 3: Create FormulaTooltip Component (TDD)

**Files:**
- Create: `src/components/FormulaTooltip.tsx`
- Create: `src/components/FormulaTooltip.test.tsx`

**Step 1: Write the failing test**

Create `src/components/FormulaTooltip.test.tsx`:

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FormulaTooltip } from './FormulaTooltip';

describe('FormulaTooltip', () => {
  it('renders children correctly', () => {
    render(
      <FormulaTooltip formula={['Test formula', 'Line 2']}>
        €100,000
      </FormulaTooltip>
    );

    expect(screen.getByText('€100,000')).toBeInTheDocument();
  });

  it('renders info icon', () => {
    const { container } = render(
      <FormulaTooltip formula={['Test']}>
        €100,000
      </FormulaTooltip>
    );

    // Check for lucide-react Info icon (svg with specific class)
    const icon = container.querySelector('svg');
    expect(icon).toBeInTheDocument();
  });

  it('has cursor-help class', () => {
    const { container } = render(
      <FormulaTooltip formula={['Test']}>
        €100,000
      </FormulaTooltip>
    );

    const wrapper = container.querySelector('.cursor-help');
    expect(wrapper).toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npm run test:run src/components/FormulaTooltip.test.tsx
```

Expected: FAIL - module not found

**Step 3: Write minimal implementation**

Create `src/components/FormulaTooltip.tsx`:

```typescript
import React from 'react';
import * as Tooltip from '@radix-ui/react-tooltip';
import { Info } from 'lucide-react';

interface FormulaTooltipProps {
  children: React.ReactNode;
  formula: string[];
}

export function FormulaTooltip({ children, formula }: FormulaTooltipProps) {
  return (
    <Tooltip.Root delayDuration={200}>
      <Tooltip.Trigger asChild>
        <span className="inline-flex items-center gap-1 cursor-help">
          {children}
          <Info className="w-3 h-3 text-gray-400 hover:text-blue-600 transition-colors" />
        </span>
      </Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content
          className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 max-w-xs shadow-lg z-50"
          sideOffset={5}
        >
          {formula.map((line, i) => (
            <div key={i} className={i === 0 ? 'font-semibold mb-1' : ''}>
              {line}
            </div>
          ))}
          <Tooltip.Arrow className="fill-gray-900" />
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}
```

**Step 4: Run test to verify it passes**

```bash
npm run test:run src/components/FormulaTooltip.test.tsx
```

Expected: PASS

**Step 5: Commit**

```bash
git add src/components/FormulaTooltip.tsx src/components/FormulaTooltip.test.tsx
git commit -m "feat: add FormulaTooltip component with Radix UI"
```

---

## Task 4: Add Tooltip Provider to EnDivisionCorrect

**Files:**
- Modify: `src/components/EnDivisionCorrect.tsx:1-10` (imports)
- Modify: `src/components/EnDivisionCorrect.tsx:~500` (return statement)

**Step 1: Add imports**

At top of `src/components/EnDivisionCorrect.tsx`, add after existing imports:

```typescript
import * as Tooltip from '@radix-ui/react-tooltip';
import { FormulaTooltip } from './FormulaTooltip';
import {
  getTotalCostFormula,
  getPurchaseShareFormula,
  getNotaryFeesFormula,
  getMonthlyPaymentFormula,
  getLoanNeededFormula,
  getPricePerM2Formula,
  getTotalProjectCostFormula,
  getTotalLoansFormula
} from '../utils/formulaExplanations';
```

**Step 2: Wrap return with Tooltip.Provider**

Find the main return statement in `EnDivisionCorrect()` function (around line 500), wrap entire JSX with:

```typescript
return (
  <Tooltip.Provider>
    {/* existing JSX content */}
  </Tooltip.Provider>
);
```

**Step 3: Test the application**

```bash
npm run dev
```

Expected: App runs without errors, no visual changes yet

**Step 4: Commit**

```bash
git add src/components/EnDivisionCorrect.tsx
git commit -m "feat: add Tooltip.Provider and import formula utilities"
```

---

## Task 5: Add Tooltips to Summary Cards (Top Section)

**Files:**
- Modify: `src/components/EnDivisionCorrect.tsx:~600-620` (summary cards)

**Step 1: Add tooltip to Total Project Cost**

Find the line around 600 that shows total cost:
```typescript
<p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(calculations.totals.total)}</p>
```

Replace with:
```typescript
<p className="text-2xl font-bold text-gray-900 mt-1">
  <FormulaTooltip formula={getTotalProjectCostFormula(calculations.totals)}>
    {formatCurrency(calculations.totals.total)}
  </FormulaTooltip>
</p>
```

**Step 2: Add tooltip to Total Capital**

Find the line showing capital total (around line 606):
```typescript
<p className="text-2xl font-bold text-green-700 mt-1">{formatCurrency(calculations.totals.capitalTotal)}</p>
```

Replace with:
```typescript
<p className="text-2xl font-bold text-green-700 mt-1">
  <FormulaTooltip formula={[
    'Sum of all participant capital contributions',
    `Total capital apporté = €${calculations.totals.capitalTotal.toLocaleString()}`
  ]}>
    {formatCurrency(calculations.totals.capitalTotal)}
  </FormulaTooltip>
</p>
```

**Step 3: Add tooltip to Total Loans**

Find the line showing total loans (around line 612):
```typescript
<p className="text-2xl font-bold text-red-700 mt-1">{formatCurrency(calculations.totals.totalLoansNeeded)}</p>
```

Replace with:
```typescript
<p className="text-2xl font-bold text-red-700 mt-1">
  <FormulaTooltip formula={getTotalLoansFormula(calculations.totals)}>
    {formatCurrency(calculations.totals.totalLoansNeeded)}
  </FormulaTooltip>
</p>
```

**Step 4: Add tooltip to Price per m²**

Find the line showing price per m² (around line 623):
```typescript
<p className="text-xs text-blue-600 mt-1">{formatCurrency(calculations.pricePerM2)}/m²</p>
```

Replace with:
```typescript
<p className="text-xs text-blue-600 mt-1">
  <FormulaTooltip formula={getPricePerM2Formula(calculations.totals, calculations.totalSurface)}>
    {formatCurrency(calculations.pricePerM2)}/m²
  </FormulaTooltip>
</p>
```

**Step 5: Test in browser**

```bash
npm run dev
```

Expected: Hover over summary card amounts to see tooltips with formulas

**Step 6: Commit**

```bash
git add src/components/EnDivisionCorrect.tsx
git commit -m "feat: add formula tooltips to summary cards"
```

---

## Task 6: Add Tooltips to Per-Participant Cards (Part 1: Top Metrics)

**Files:**
- Modify: `src/components/EnDivisionCorrect.tsx:~1000-1020` (participant summary section)

**Step 1: Add tooltip to Total Cost**

Find the participant's total cost display (around line 1007):
```typescript
<p className="text-lg font-bold text-gray-900">{formatCurrency(p.totalCost)}</p>
```

Replace with:
```typescript
<p className="text-lg font-bold text-gray-900">
  <FormulaTooltip formula={getTotalCostFormula(p)}>
    {formatCurrency(p.totalCost)}
  </FormulaTooltip>
</p>
```

**Step 2: Add tooltip to Capital Apporté**

Find capital display (around line 1011):
```typescript
<p className="text-lg font-bold text-green-700">{formatCurrency(p.capitalApporte)}</p>
```

Replace with:
```typescript
<p className="text-lg font-bold text-green-700">
  <FormulaTooltip formula={[
    'Capital contribution (equity)',
    `Amount contributed upfront = €${p.capitalApporte.toLocaleString()}`
  ]}>
    {formatCurrency(p.capitalApporte)}
  </FormulaTooltip>
</p>
```

**Step 3: Add tooltip to Loan Needed**

Find loan display (around line 1015):
```typescript
<p className="text-lg font-bold text-red-700">{formatCurrency(p.loanNeeded)}</p>
```

Replace with:
```typescript
<p className="text-lg font-bold text-red-700">
  <FormulaTooltip formula={getLoanNeededFormula(p)}>
    {formatCurrency(p.loanNeeded)}
  </FormulaTooltip>
</p>
```

**Step 4: Add tooltip to Monthly Payment**

Find monthly payment display (around line 1019):
```typescript
<p className="text-lg font-bold text-red-600">{formatCurrency(p.monthlyPayment)}</p>
```

Replace with:
```typescript
<p className="text-lg font-bold text-red-600">
  <FormulaTooltip formula={getMonthlyPaymentFormula(p)}>
    {formatCurrency(p.monthlyPayment)}
  </FormulaTooltip>
</p>
```

**Step 5: Test in browser**

```bash
npm run dev
```

Expected: Hover over participant card metrics to see formula tooltips

**Step 6: Commit**

```bash
git add src/components/EnDivisionCorrect.tsx
git commit -m "feat: add formula tooltips to participant summary metrics"
```

---

## Task 7: Add Tooltips to Per-Participant Breakdown Details

**Files:**
- Modify: `src/components/EnDivisionCorrect.tsx` (expanded participant details section)

**Note:** The exact line numbers depend on where the participant breakdown details are rendered. Look for sections showing:
- Purchase Share
- Notary Fees
- Personal Renovation Cost
- Construction Cost
- Shared Costs

**Step 1: Locate participant breakdown section**

Search for where individual cost breakdowns are displayed in the expanded participant card. This is likely after the summary metrics, in a collapsible section.

**Step 2: Add tooltip to Purchase Share**

Find purchase share display, wrap with:
```typescript
<FormulaTooltip formula={getPurchaseShareFormula(p, calculations.pricePerM2)}>
  {formatCurrency(p.purchaseShare)}
</FormulaTooltip>
```

**Step 3: Add tooltip to Notary Fees**

Find notary fees display, wrap with:
```typescript
<FormulaTooltip formula={getNotaryFeesFormula(p)}>
  {formatCurrency(p.notaryFees)}
</FormulaTooltip>
```

**Step 4: Add tooltip to Personal Renovation Cost**

Find personal renovation cost (CASCO + parachèvements), wrap with:
```typescript
<FormulaTooltip formula={getPersonalRenovationFormula(p)}>
  {formatCurrency(p.personalRenovationCost)}
</FormulaTooltip>
```

**Step 5: Add tooltip to Construction Cost**

Find construction cost display, wrap with:
```typescript
<FormulaTooltip formula={getConstructionCostFormula(
  p,
  calculations.totals.construction,
  participants.reduce((sum, part) => sum + (part.quantity || 1), 0)
)}>
  {formatCurrency(p.constructionCost)}
</FormulaTooltip>
```

**Step 6: Add tooltip to Shared Costs**

Find shared costs display, wrap with:
```typescript
<FormulaTooltip formula={getSharedCostsFormula(p, participants.length)}>
  {formatCurrency(p.sharedCosts)}
</FormulaTooltip>
```

**Step 7: Test in browser**

```bash
npm run dev
```

Expected: Expand participant details, hover over breakdown amounts to see tooltips

**Step 8: Commit**

```bash
git add src/components/EnDivisionCorrect.tsx
git commit -m "feat: add formula tooltips to participant breakdown details"
```

---

## Task 8: Run Full Test Suite and Build

**Step 1: Run all tests**

```bash
npm run test:run
```

Expected: All tests pass

**Step 2: Run TypeScript type checking**

```bash
npx tsc --noEmit
```

Expected: No type errors

**Step 3: Build the application**

```bash
npm run build
```

Expected: Build succeeds

**Step 4: Preview production build**

```bash
npm run preview
```

Expected: App runs correctly in production mode

**Step 5: Manual testing checklist**

Open browser and verify:
- [ ] Summary cards show tooltips on hover (4 tooltips: total, capital, loans, price/m²)
- [ ] Participant cards show tooltips on metrics (4 tooltips per card: total, capital, loan, monthly)
- [ ] Expanded participant details show tooltips (5 tooltips: purchase, notary, renovation, construction, shared)
- [ ] Tooltips position correctly without overflow
- [ ] Info icons are visible but not intrusive
- [ ] Tooltip formulas show correct numbers matching displayed values
- [ ] Tooltips work for all participants

**Step 6: Commit if any fixes were needed**

```bash
git add .
git commit -m "fix: address any issues found during testing"
```

---

## Task 9: Update Documentation

**Files:**
- Modify: `docs/plans/2025-11-03-formula-tooltips-implementation.md`

**Step 1: Add completion notes to plan**

At the end of this file, add:

```markdown
## Implementation Complete

**Date Completed:** 2025-11-03

**Files Modified:**
- `package.json` - Added @radix-ui/react-tooltip
- `src/components/EnDivisionCorrect.tsx` - Added Tooltip.Provider and wrapped all high-priority amounts
- `src/components/FormulaTooltip.tsx` - Created reusable tooltip component
- `src/utils/formulaExplanations.ts` - Created formula generation utilities
- `src/utils/formulaExplanations.test.ts` - Added unit tests
- `src/components/FormulaTooltip.test.tsx` - Added component tests

**Test Results:**
- All unit tests passing
- TypeScript compilation successful
- Production build successful
- Manual testing complete (all tooltips working)

**Phase 1 Complete:** High-priority tooltips implemented (11 tooltips total)
**Phase 2 (Future):** Add tooltips to breakdown section and travaux communs
**Phase 3 (Future):** Add tooltips to portage calculations and timeline view
```

**Step 2: Commit**

```bash
git add docs/plans/2025-11-03-formula-tooltips-implementation.md
git commit -m "docs: mark formula tooltips phase 1 as complete"
```

---

## Task 10: Create Final Commit and Summary

**Step 1: Review git log**

```bash
git log --oneline -10
```

Expected: See all commits from this implementation

**Step 2: Create implementation summary**

Optional: Create a summary of what was implemented and what's next.

**Step 3: Verify clean working tree**

```bash
git status
```

Expected: Nothing to commit, working tree clean

---

## Success Criteria

✅ @radix-ui/react-tooltip installed
✅ FormulaTooltip component created with tests
✅ Formula explanation utilities created with tests
✅ All high-priority tooltips added (11 total):
  - 4 summary cards (total, capital, loans, price/m²)
  - 4 per-participant metrics (total, capital, loan, monthly)
  - 5 per-participant breakdown (purchase, notary, renovation, construction, shared)
✅ All tests passing
✅ TypeScript compilation successful
✅ Production build successful
✅ Manual testing verified

## Future Enhancements (Phase 2 & 3)

- Add tooltips to breakdown section totals
- Add tooltips to travaux communs calculations
- Add tooltips to portage calculations
- Add tooltips to timeline view payments
- Add tooltips to redistribution amounts
