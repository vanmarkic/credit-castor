# Formula Tooltips Design

**Date:** 2025-11-03
**Status:** Approved
**Goal:** Provide transparency over all calculated amounts by showing formula explanations in tooltips

## Overview

Add formula tooltips to calculated amounts throughout the calculator UI. Each calculated value displays a small info icon (ⓘ) that reveals a tooltip on hover showing the calculation breakdown in a readable, hybrid format.

## Architecture

### Technology Stack
- **@radix-ui/react-tooltip**: Accessible, unstyled tooltip primitives
- **Tailwind CSS**: Styling for tooltip content
- **lucide-react Info icon**: Consistent with existing UI (already in dependencies)

### Component Structure
```tsx
<Tooltip.Provider>
  <Tooltip.Root>
    <Tooltip.Trigger>
      <span>€250,000</span>
      <Info className="inline ml-1 w-3 h-3" />
    </Tooltip.Trigger>
    <Tooltip.Content>
      [Formula explanation in hybrid style]
    </Tooltip.Content>
  </Tooltip.Root>
</Tooltip.Provider>
```

### Formula Display Style (Hybrid Format)
- **Line 1**: Brief description of what's being calculated
- **Line 2**: Key values in plain language with actual numbers
- **Line 3**: Formula reference (when applicable, e.g., "PMT formula")

**Example:**
```
"Monthly Payment"
"€50,000 loan × 4.5% over 25 years"
"PMT(rate/12, years×12, -principal)"
```

## Tooltip Coverage Priority

### High Priority (Phase 1)

**Per-Participant Calculations:**
1. Total Cost
2. Purchase Share
3. Notary Fees
4. Personal Renovation Cost (CASCO + parachèvements)
5. Construction Cost
6. Shared Costs
7. Loan Needed
8. Monthly Payment

**Summary Totals:**
9. Price per m²
10. Total Project Cost
11. Total Loans Needed

### Medium Priority (Phase 2)
- Total Construction breakdown
- Total Shared Costs breakdown
- Travaux Communs per Unit

### Lower Priority (Phase 3)
- Portage calculations
- Timeline view payments
- Redistribution amounts

## Formula Explanations

### Per-Participant Tooltips

**Total Cost:**
```
"Total cost for this participant"
"Purchase €X + Notary €Y + Construction €Z + Shared €W"
```

**Purchase Share:**
```
"Your share of the building purchase"
"€X/m² × Y m² = €Z"
```

**Notary Fees:**
```
"Belgian notary fees for property transfer"
"€X purchase × Y% rate = €Z"
```

**Personal Renovation Cost:**
```
"CASCO + Parachèvements for your units"
"€X CASCO + €Y parachèvements = €Z"
```

**Construction Cost:**
```
"Your share of shared construction"
"€X total ÷ Y units × Z quantity = €W"
```

**Shared Costs:**
```
"Common project expenses"
"Infrastructure + Studies + Frais généraux ÷ participants"
```

**Loan Needed:**
```
"Amount to borrow"
"€X total cost - €Y capital = €Z loan"
```

**Monthly Payment:**
```
"Loan repayment over duration"
"€X loan at Y% over Z years"
"PMT(rate/12, years×12, -principal)"
```

### Summary Tooltips

**Price per m²:**
```
"Average price per square meter"
"€X total purchase ÷ Y m² total surface"
```

**Total Project Cost:**
```
"Sum of all project expenses"
"Purchase + Notary + Construction + Shared"
```

**Total Loans Needed:**
```
"Sum of all participant loans"
"Total of all individual loan amounts"
```

## Implementation Details

### 1. Reusable Tooltip Component

**File:** `src/components/FormulaTooltip.tsx`

```tsx
import * as Tooltip from '@radix-ui/react-tooltip';
import { Info } from 'lucide-react';

interface FormulaTooltipProps {
  children: React.ReactNode; // The amount to display
  formula: string[]; // Array of lines for the tooltip
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

### 2. Formula Generation Utilities

**File:** `src/utils/formulaExplanations.ts`

```tsx
import type { ParticipantCalculation, CalculationTotals } from './calculatorUtils';

export function getTotalCostFormula(p: ParticipantCalculation): string[] {
  return [
    "Total cost for this participant",
    `Purchase €${p.purchaseShare.toLocaleString()} + Notary €${p.notaryFees.toLocaleString()} + Construction €${p.constructionCost.toLocaleString()} + Shared €${p.sharedCosts.toLocaleString()}`
  ];
}

export function getPurchaseShareFormula(p: ParticipantCalculation, pricePerM2: number): string[] {
  return [
    "Your share of the building purchase",
    `€${pricePerM2.toFixed(2)}/m² × ${p.surface}m² = €${p.purchaseShare.toLocaleString()}`
  ];
}

export function getNotaryFeesFormula(p: ParticipantCalculation): string[] {
  return [
    "Belgian notary fees for property transfer",
    `€${p.purchaseShare.toLocaleString()} purchase × ${p.notaryFeesRate}% rate = €${p.notaryFees.toLocaleString()}`
  ];
}

export function getMonthlyPaymentFormula(p: ParticipantCalculation): string[] {
  return [
    "Loan repayment over duration",
    `€${p.loanNeeded.toLocaleString()} loan at ${p.interestRate}% over ${p.durationYears} years`,
    "PMT(rate/12, years×12, -principal)"
  ];
}

export function getLoanNeededFormula(p: ParticipantCalculation): string[] {
  return [
    "Amount to borrow",
    `€${p.totalCost.toLocaleString()} total cost - €${p.capitalApporte.toLocaleString()} capital = €${p.loanNeeded.toLocaleString()} loan`
  ];
}

export function getPersonalRenovationFormula(p: ParticipantCalculation): string[] {
  return [
    "CASCO + Parachèvements for your units",
    `€${p.casco.toLocaleString()} CASCO + €${p.parachevements.toLocaleString()} parachèvements = €${p.personalRenovationCost.toLocaleString()}`
  ];
}

export function getConstructionCostFormula(
  p: ParticipantCalculation,
  totalConstruction: number,
  totalUnits: number
): string[] {
  return [
    "Your share of shared construction",
    `€${totalConstruction.toLocaleString()} total ÷ ${totalUnits} units × ${p.quantity} quantity = €${p.constructionCost.toLocaleString()}`
  ];
}

export function getSharedCostsFormula(p: ParticipantCalculation, participantCount: number): string[] {
  return [
    "Common project expenses",
    `Infrastructure + Studies + Frais généraux ÷ ${participantCount} participants`
  ];
}

export function getPricePerM2Formula(totals: CalculationTotals, totalSurface: number): string[] {
  return [
    "Average price per square meter",
    `€${totals.purchase.toLocaleString()} total purchase ÷ ${totalSurface}m² total surface`
  ];
}

export function getTotalProjectCostFormula(): string[] {
  return [
    "Sum of all project expenses",
    "Purchase + Notary + Construction + Shared"
  ];
}

export function getTotalLoansFormula(): string[] {
  return [
    "Sum of all participant loans",
    "Total of all individual loan amounts"
  ];
}
```

### 3. Usage Pattern

Wrap the main component in `Tooltip.Provider`:
```tsx
// In EnDivisionCorrect.tsx
import * as Tooltip from '@radix-ui/react-tooltip';

export default function EnDivisionCorrect() {
  return (
    <Tooltip.Provider>
      {/* existing component content */}
    </Tooltip.Provider>
  );
}
```

Replace existing currency displays:
```tsx
// Before:
<p className="text-lg font-bold">{formatCurrency(p.totalCost)}</p>

// After:
<p className="text-lg font-bold">
  <FormulaTooltip formula={getTotalCostFormula(p)}>
    {formatCurrency(p.totalCost)}
  </FormulaTooltip>
</p>
```

## Testing Strategy

### Unit Tests

**File:** `src/utils/formulaExplanations.test.ts`

```tsx
import { describe, it, expect } from 'vitest';
import { getTotalCostFormula, getPurchaseShareFormula, getMonthlyPaymentFormula } from './formulaExplanations';
import type { ParticipantCalculation } from './calculatorUtils';

describe('formulaExplanations', () => {
  it('generates correct total cost formula', () => {
    const participant: ParticipantCalculation = {
      name: 'Test',
      purchaseShare: 100000,
      notaryFees: 12500,
      constructionCost: 50000,
      sharedCosts: 10000,
      totalCost: 172500,
      // ... other required fields
    } as ParticipantCalculation;

    const formula = getTotalCostFormula(participant);
    expect(formula[0]).toBe('Total cost for this participant');
    expect(formula[1]).toContain('€100,000');
    expect(formula[1]).toContain('€12,500');
    expect(formula[1]).toContain('€50,000');
    expect(formula[1]).toContain('€10,000');
  });

  it('generates correct purchase share formula', () => {
    const participant: ParticipantCalculation = {
      surface: 112,
      purchaseShare: 100000,
      // ... other fields
    } as ParticipantCalculation;

    const formula = getPurchaseShareFormula(participant, 892.86);
    expect(formula[0]).toBe('Your share of the building purchase');
    expect(formula[1]).toContain('€892.86/m²');
    expect(formula[1]).toContain('112m²');
  });

  it('generates correct monthly payment formula', () => {
    const participant: ParticipantCalculation = {
      loanNeeded: 50000,
      interestRate: 4.5,
      durationYears: 25,
      // ... other fields
    } as ParticipantCalculation;

    const formula = getMonthlyPaymentFormula(participant);
    expect(formula[0]).toBe('Loan repayment over duration');
    expect(formula[1]).toContain('€50,000');
    expect(formula[1]).toContain('4.5%');
    expect(formula[1]).toContain('25 years');
    expect(formula[2]).toBe('PMT(rate/12, years×12, -principal)');
  });
});
```

### Integration/Visual Testing
- Manual hover testing on all tooltips
- Verify positioning doesn't overflow screen
- Test on mobile (tap to show tooltip)
- Verify formulas show correct values for different scenarios
- Test with extreme values (very long numbers)

## Rollout Plan

### Phase 1: High Priority (Initial Implementation)
1. Install `@radix-ui/react-tooltip`
2. Create `FormulaTooltip` component
3. Create `formulaExplanations.ts` utilities with unit tests
4. Add tooltips to per-participant calculations (8 tooltips)
5. Add tooltips to summary cards (3 tooltips)
6. Manual testing and validation

### Phase 2: Medium Priority (Follow-up)
- Add tooltips to breakdown section
- Add tooltips to travaux communs section

### Phase 3: Polish (Optional)
- Add tooltips to portage calculations
- Add tooltips to timeline view payments
- Add tooltips to redistribution amounts

## Accessibility

- ✅ Radix UI handles ARIA attributes automatically
- ✅ Info icon has `cursor-help` for visual affordance
- ✅ Keyboard accessible (focus + hover works)
- ✅ Screen readers will announce tooltip content
- ✅ Tooltips close on Escape key
- ✅ Works on touch devices (tap to show)

## Design Decisions

1. **Why Radix UI?** Unstyled primitives work perfectly with Tailwind, accessible out of the box, handles positioning automatically
2. **Why info icon?** Clear visual affordance that tooltip exists, doesn't clutter the UI
3. **Why hybrid formula style?** Balances readability with precision - gives context without overwhelming users
4. **Why utility functions?** Type-safe, DRY, testable, maintainable
5. **Why phased rollout?** Start with most-questioned values, validate approach, then expand coverage

## Benefits

- **Transparency**: Users understand how every number is calculated
- **Trust**: No "black box" calculations
- **Educational**: Users learn real estate division math
- **Debugging**: Easier to spot calculation errors
- **Support**: Fewer questions about "how did you get this number?"
