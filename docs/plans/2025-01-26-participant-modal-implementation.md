# Participant Modal Redesign - Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Redesign ParticipantDetailModal to show payment timeline by phase (Signature → Construction → Emménagement), with costs first and optional loan configuration.

**Architecture:** Create a PaymentTimeline component as the hero view, with collapsible sections for financing and configuration. Pure calculation functions extract phase costs from existing ParticipantCalculation data.

**Tech Stack:** React, TypeScript, Tailwind CSS, Vitest for testing

---

## Task 1: Create PhaseCosts Type and Calculation Function

**Files:**
- Create: `src/utils/phaseCostsCalculation.ts`
- Create: `src/utils/phaseCostsCalculation.test.ts`

**Step 1: Write the failing test**

```typescript
// src/utils/phaseCostsCalculation.test.ts
import { describe, it, expect } from 'vitest';
import { calculatePhaseCosts, type PhaseCosts } from './phaseCostsCalculation';
import type { ParticipantCalculation } from './calculatorUtils';

describe('calculatePhaseCosts', () => {
  it('should group costs by payment phase', () => {
    const participantCalc: Partial<ParticipantCalculation> = {
      purchaseShare: 35000,
      droitEnregistrements: 5200,
      fraisNotaireFixe: 5000,
      casco: 60000,
      sharedCosts: 15000,
      travauxCommunsPerUnit: 12500,
      parachevements: 25000,
    };

    const result = calculatePhaseCosts(participantCalc as ParticipantCalculation);

    expect(result.signature.total).toBe(45200); // 35000 + 5200 + 5000
    expect(result.construction.total).toBe(87500); // 60000 + 15000 + 12500
    expect(result.emmenagement.total).toBe(25000);
    expect(result.grandTotal).toBe(157700);
  });

  it('should include itemized breakdown for each phase', () => {
    const participantCalc: Partial<ParticipantCalculation> = {
      purchaseShare: 35000,
      droitEnregistrements: 5200,
      fraisNotaireFixe: 5000,
      casco: 60000,
      sharedCosts: 15000,
      travauxCommunsPerUnit: 12500,
      parachevements: 25000,
    };

    const result = calculatePhaseCosts(participantCalc as ParticipantCalculation);

    expect(result.signature.purchaseShare).toBe(35000);
    expect(result.signature.registrationFees).toBe(5200);
    expect(result.signature.notaryFees).toBe(5000);

    expect(result.construction.casco).toBe(60000);
    expect(result.construction.commun).toBe(15000);
    expect(result.construction.travauxCommuns).toBe(12500);

    expect(result.emmenagement.parachevements).toBe(25000);
  });

  it('should handle zero values gracefully', () => {
    const participantCalc: Partial<ParticipantCalculation> = {
      purchaseShare: 0,
      droitEnregistrements: 0,
      fraisNotaireFixe: 0,
      casco: 0,
      sharedCosts: 0,
      travauxCommunsPerUnit: 0,
      parachevements: 0,
    };

    const result = calculatePhaseCosts(participantCalc as ParticipantCalculation);

    expect(result.signature.total).toBe(0);
    expect(result.construction.total).toBe(0);
    expect(result.emmenagement.total).toBe(0);
    expect(result.grandTotal).toBe(0);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm run test:run -- src/utils/phaseCostsCalculation.test.ts`
Expected: FAIL with "Cannot find module './phaseCostsCalculation'"

**Step 3: Write minimal implementation**

```typescript
// src/utils/phaseCostsCalculation.ts
import type { ParticipantCalculation } from './calculatorUtils';

export interface PhaseCosts {
  signature: {
    purchaseShare: number;
    registrationFees: number;
    notaryFees: number;
    total: number;
  };
  construction: {
    casco: number;
    travauxCommuns: number;
    commun: number;
    total: number;
  };
  emmenagement: {
    parachevements: number;
    total: number;
  };
  grandTotal: number;
}

/**
 * Groups participant costs by payment phase timing
 * - Signature: Paid at deed signing (purchase + notary + registration)
 * - Construction: Paid progressively during construction (CASCO + commun + travaux)
 * - Emménagement: Paid when inhabitant decides to move in (parachèvements)
 */
export function calculatePhaseCosts(p: ParticipantCalculation): PhaseCosts {
  const signature = {
    purchaseShare: p.purchaseShare ?? 0,
    registrationFees: p.droitEnregistrements ?? 0,
    notaryFees: p.fraisNotaireFixe ?? 0,
    total: 0,
  };
  signature.total = signature.purchaseShare + signature.registrationFees + signature.notaryFees;

  const construction = {
    casco: p.casco ?? 0,
    travauxCommuns: p.travauxCommunsPerUnit ?? 0,
    commun: p.sharedCosts ?? 0,
    total: 0,
  };
  construction.total = construction.casco + construction.travauxCommuns + construction.commun;

  const emmenagement = {
    parachevements: p.parachevements ?? 0,
    total: 0,
  };
  emmenagement.total = emmenagement.parachevements;

  return {
    signature,
    construction,
    emmenagement,
    grandTotal: signature.total + construction.total + emmenagement.total,
  };
}
```

**Step 4: Run test to verify it passes**

Run: `npm run test:run -- src/utils/phaseCostsCalculation.test.ts`
Expected: PASS (3 tests)

**Step 5: Commit**

```bash
git add src/utils/phaseCostsCalculation.ts src/utils/phaseCostsCalculation.test.ts
git commit -m "feat: add calculatePhaseCosts function for payment timeline"
```

---

## Task 2: Create CollapsibleSection Component

**Files:**
- Create: `src/components/shared/CollapsibleSection.tsx`
- Create: `src/components/shared/CollapsibleSection.test.tsx`

**Step 1: Write the failing test**

```typescript
// src/components/shared/CollapsibleSection.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CollapsibleSection } from './CollapsibleSection';

describe('CollapsibleSection', () => {
  it('should render title and be collapsed by default', () => {
    render(
      <CollapsibleSection title="Test Section" icon="💰">
        <p>Hidden content</p>
      </CollapsibleSection>
    );

    expect(screen.getByText('Test Section')).toBeInTheDocument();
    expect(screen.getByText('💰')).toBeInTheDocument();
    expect(screen.queryByText('Hidden content')).not.toBeInTheDocument();
  });

  it('should expand when clicked', () => {
    render(
      <CollapsibleSection title="Test Section">
        <p>Hidden content</p>
      </CollapsibleSection>
    );

    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByText('Hidden content')).toBeInTheDocument();
  });

  it('should be open by default when defaultOpen is true', () => {
    render(
      <CollapsibleSection title="Test Section" defaultOpen>
        <p>Visible content</p>
      </CollapsibleSection>
    );

    expect(screen.getByText('Visible content')).toBeInTheDocument();
  });

  it('should collapse when clicked while open', () => {
    render(
      <CollapsibleSection title="Test Section" defaultOpen>
        <p>Content</p>
      </CollapsibleSection>
    );

    expect(screen.getByText('Content')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button'));
    expect(screen.queryByText('Content')).not.toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm run test:run -- src/components/shared/CollapsibleSection.test.tsx`
Expected: FAIL with "Cannot find module './CollapsibleSection'"

**Step 3: Write minimal implementation**

```typescript
// src/components/shared/CollapsibleSection.tsx
import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface CollapsibleSectionProps {
  title: string;
  icon?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function CollapsibleSection({
  title,
  icon,
  defaultOpen = false,
  children,
  className = '',
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={`border-b border-gray-200 ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between py-3 px-4 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          {icon && <span>{icon}</span>}
          <span className="text-sm font-medium text-gray-700">{title}</span>
        </div>
        {isOpen ? (
          <ChevronDown className="w-4 h-4 text-gray-400" />
        ) : (
          <ChevronRight className="w-4 h-4 text-gray-400" />
        )}
      </button>
      {isOpen && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
}
```

**Step 4: Run test to verify it passes**

Run: `npm run test:run -- src/components/shared/CollapsibleSection.test.tsx`
Expected: PASS (4 tests)

**Step 5: Commit**

```bash
git add src/components/shared/CollapsibleSection.tsx src/components/shared/CollapsibleSection.test.tsx
git commit -m "feat: add CollapsibleSection component for progressive disclosure"
```

---

## Task 3: Create PaymentPhaseCard Component

**Files:**
- Create: `src/components/shared/PaymentPhaseCard.tsx`
- Create: `src/components/shared/PaymentPhaseCard.test.tsx`

**Step 1: Write the failing test**

```typescript
// src/components/shared/PaymentPhaseCard.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PaymentPhaseCard } from './PaymentPhaseCard';

describe('PaymentPhaseCard', () => {
  it('should display phase label and total amount', () => {
    render(
      <PaymentPhaseCard
        label="SIGNATURE"
        total={45200}
        items={[
          { label: "Part d'achat", amount: 35000 },
          { label: 'Enregistrement', amount: 5200 },
          { label: 'Notaire', amount: 5000 },
        ]}
      />
    );

    expect(screen.getByText('SIGNATURE')).toBeInTheDocument();
    expect(screen.getByText('45 200 €')).toBeInTheDocument();
  });

  it('should show details when expanded', () => {
    render(
      <PaymentPhaseCard
        label="SIGNATURE"
        total={45200}
        items={[
          { label: "Part d'achat", amount: 35000 },
          { label: 'Enregistrement', amount: 5200 },
        ]}
      />
    );

    // Click to expand
    fireEvent.click(screen.getByText('Détails'));

    expect(screen.getByText("Part d'achat")).toBeInTheDocument();
    expect(screen.getByText('35 000 €')).toBeInTheDocument();
    expect(screen.getByText('Enregistrement')).toBeInTheDocument();
    expect(screen.getByText('5 200 €')).toBeInTheDocument();
  });

  it('should not render items with zero amount', () => {
    render(
      <PaymentPhaseCard
        label="CONSTRUCTION"
        total={60000}
        items={[
          { label: 'CASCO', amount: 60000 },
          { label: 'Travaux communs', amount: 0 },
        ]}
      />
    );

    fireEvent.click(screen.getByText('Détails'));

    expect(screen.getByText('CASCO')).toBeInTheDocument();
    expect(screen.queryByText('Travaux communs')).not.toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm run test:run -- src/components/shared/PaymentPhaseCard.test.tsx`
Expected: FAIL with "Cannot find module './PaymentPhaseCard'"

**Step 3: Write minimal implementation**

```typescript
// src/components/shared/PaymentPhaseCard.tsx
import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { formatCurrency } from '../../utils/formatting';

interface PaymentPhaseCardProps {
  label: string;
  total: number;
  items: Array<{ label: string; amount: number }>;
  className?: string;
}

export function PaymentPhaseCard({
  label,
  total,
  items,
  className = '',
}: PaymentPhaseCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const nonZeroItems = items.filter((item) => item.amount > 0);

  return (
    <div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
      <div className="p-4 text-center">
        <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-2">
          {label}
        </p>
        <p className="text-2xl font-bold text-gray-900">{formatCurrency(total)}</p>
      </div>

      {nonZeroItems.length > 0 && (
        <>
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full flex items-center justify-center gap-1 py-2 text-xs text-blue-600 hover:text-blue-800 border-t border-gray-100"
          >
            <span>Détails</span>
            {isExpanded ? (
              <ChevronUp className="w-3 h-3" />
            ) : (
              <ChevronDown className="w-3 h-3" />
            )}
          </button>

          {isExpanded && (
            <div className="px-4 pb-4 space-y-2">
              {nonZeroItems.map((item, idx) => (
                <div key={idx} className="flex justify-between text-sm">
                  <span className="text-gray-600">{item.label}</span>
                  <span className="font-medium text-gray-900">
                    {formatCurrency(item.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
```

**Step 4: Run test to verify it passes**

Run: `npm run test:run -- src/components/shared/PaymentPhaseCard.test.tsx`
Expected: PASS (3 tests)

**Step 5: Commit**

```bash
git add src/components/shared/PaymentPhaseCard.tsx src/components/shared/PaymentPhaseCard.test.tsx
git commit -m "feat: add PaymentPhaseCard component with expandable details"
```

---

## Task 4: Create PaymentTimeline Component

**Files:**
- Create: `src/components/shared/PaymentTimeline.tsx`
- Create: `src/components/shared/PaymentTimeline.test.tsx`

**Step 1: Write the failing test**

```typescript
// src/components/shared/PaymentTimeline.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PaymentTimeline } from './PaymentTimeline';
import type { PhaseCosts } from '../../utils/phaseCostsCalculation';

describe('PaymentTimeline', () => {
  const mockPhaseCosts: PhaseCosts = {
    signature: {
      purchaseShare: 35000,
      registrationFees: 5200,
      notaryFees: 5000,
      total: 45200,
    },
    construction: {
      casco: 60000,
      travauxCommuns: 12500,
      commun: 15000,
      total: 87500,
    },
    emmenagement: {
      parachevements: 25000,
      total: 25000,
    },
    grandTotal: 157700,
  };

  it('should display all three phases with totals', () => {
    render(<PaymentTimeline phaseCosts={mockPhaseCosts} />);

    expect(screen.getByText('SIGNATURE')).toBeInTheDocument();
    expect(screen.getByText('CONSTRUCTION')).toBeInTheDocument();
    expect(screen.getByText('EMMÉNAGEMENT')).toBeInTheDocument();

    expect(screen.getByText('45 200 €')).toBeInTheDocument();
    expect(screen.getByText('87 500 €')).toBeInTheDocument();
    expect(screen.getByText('25 000 €')).toBeInTheDocument();
  });

  it('should display grand total', () => {
    render(<PaymentTimeline phaseCosts={mockPhaseCosts} />);

    expect(screen.getByText('TOTAL')).toBeInTheDocument();
    expect(screen.getByText('157 700 €')).toBeInTheDocument();
  });

  it('should display timeline header with title', () => {
    render(<PaymentTimeline phaseCosts={mockPhaseCosts} />);

    expect(screen.getByText('MON PARCOURS DE PAIEMENT')).toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm run test:run -- src/components/shared/PaymentTimeline.test.tsx`
Expected: FAIL with "Cannot find module './PaymentTimeline'"

**Step 3: Write minimal implementation**

```typescript
// src/components/shared/PaymentTimeline.tsx
import { PaymentPhaseCard } from './PaymentPhaseCard';
import { formatCurrency } from '../../utils/formatting';
import type { PhaseCosts } from '../../utils/phaseCostsCalculation';

interface PaymentTimelineProps {
  phaseCosts: PhaseCosts;
}

export function PaymentTimeline({ phaseCosts }: PaymentTimelineProps) {
  const { signature, construction, emmenagement, grandTotal } = phaseCosts;

  return (
    <div className="mb-6">
      <h3 className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-4 text-center">
        MON PARCOURS DE PAIEMENT
      </h3>

      {/* Timeline connector line */}
      <div className="relative mb-4">
        <div className="absolute top-3 left-8 right-8 h-0.5 bg-gray-300" />
        <div className="flex justify-between px-4">
          <div className="w-6 h-6 rounded-full bg-blue-500 border-4 border-white shadow z-10" />
          <div className="w-6 h-6 rounded-full bg-orange-500 border-4 border-white shadow z-10" />
          <div className="w-6 h-6 rounded-full bg-green-500 border-4 border-white shadow z-10" />
          <div className="w-6 h-6 rounded-full bg-gray-700 border-4 border-white shadow z-10" />
        </div>
      </div>

      {/* Phase cards grid */}
      <div className="grid grid-cols-4 gap-3">
        <PaymentPhaseCard
          label="SIGNATURE"
          total={signature.total}
          items={[
            { label: "Part d'achat", amount: signature.purchaseShare },
            { label: 'Enregistrement', amount: signature.registrationFees },
            { label: 'Notaire', amount: signature.notaryFees },
          ]}
          className="border-blue-200"
        />

        <PaymentPhaseCard
          label="CONSTRUCTION"
          total={construction.total}
          items={[
            { label: 'CASCO', amount: construction.casco },
            { label: 'Travaux communs', amount: construction.travauxCommuns },
            { label: 'Commun', amount: construction.commun },
          ]}
          className="border-orange-200"
        />

        <PaymentPhaseCard
          label="EMMÉNAGEMENT"
          total={emmenagement.total}
          items={[
            { label: 'Parachèvements', amount: emmenagement.parachevements },
          ]}
          className="border-green-200"
        />

        {/* Grand Total */}
        <div className="bg-gray-100 rounded-lg border-2 border-gray-300 p-4 text-center">
          <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-2">
            TOTAL
          </p>
          <p className="text-2xl font-bold text-gray-900">
            {formatCurrency(grandTotal)}
          </p>
        </div>
      </div>

      {/* Phase labels */}
      <div className="grid grid-cols-4 gap-3 mt-2 text-center">
        <p className="text-xs text-gray-500">(Acte)</p>
        <p className="text-xs text-gray-500">(progressif)</p>
        <p className="text-xs text-gray-500">(quand je veux)</p>
        <p className="text-xs text-gray-500"></p>
      </div>
    </div>
  );
}
```

**Step 4: Run test to verify it passes**

Run: `npm run test:run -- src/components/shared/PaymentTimeline.test.tsx`
Expected: PASS (3 tests)

**Step 5: Commit**

```bash
git add src/components/shared/PaymentTimeline.tsx src/components/shared/PaymentTimeline.test.tsx
git commit -m "feat: add PaymentTimeline component with phase cards"
```

---

## Task 5: Create Loan Allocation Suggestion Function

**Files:**
- Modify: `src/utils/phaseCostsCalculation.ts`
- Modify: `src/utils/phaseCostsCalculation.test.ts`

**Step 1: Write the failing test**

Add to `src/utils/phaseCostsCalculation.test.ts`:

```typescript
describe('suggestLoanAllocation', () => {
  it('should allocate signature costs to loan 1 minus capital', () => {
    const phaseCosts: PhaseCosts = {
      signature: { purchaseShare: 35000, registrationFees: 5200, notaryFees: 5000, total: 45200 },
      construction: { casco: 60000, travauxCommuns: 12500, commun: 15000, total: 87500 },
      emmenagement: { parachevements: 25000, total: 25000 },
      grandTotal: 157700,
    };

    const result = suggestLoanAllocation(phaseCosts, 20000, false);

    expect(result.loan1Amount).toBe(25200); // 45200 - 20000 capital
    expect(result.loan2Amount).toBe(87500); // construction costs
    expect(result.includeParachevements).toBe(false);
  });

  it('should include parachevements in loan 2 when toggled', () => {
    const phaseCosts: PhaseCosts = {
      signature: { purchaseShare: 35000, registrationFees: 5200, notaryFees: 5000, total: 45200 },
      construction: { casco: 60000, travauxCommuns: 12500, commun: 15000, total: 87500 },
      emmenagement: { parachevements: 25000, total: 25000 },
      grandTotal: 157700,
    };

    const result = suggestLoanAllocation(phaseCosts, 20000, true);

    expect(result.loan2Amount).toBe(112500); // 87500 + 25000
    expect(result.includeParachevements).toBe(true);
  });

  it('should not go negative if capital exceeds signature costs', () => {
    const phaseCosts: PhaseCosts = {
      signature: { purchaseShare: 35000, registrationFees: 5200, notaryFees: 5000, total: 45200 },
      construction: { casco: 60000, travauxCommuns: 0, commun: 15000, total: 75000 },
      emmenagement: { parachevements: 25000, total: 25000 },
      grandTotal: 145200,
    };

    const result = suggestLoanAllocation(phaseCosts, 50000, false);

    expect(result.loan1Amount).toBe(0); // Capital covers signature
    expect(result.loan2Amount).toBe(70200); // 75000 - (50000 - 45200) excess capital
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm run test:run -- src/utils/phaseCostsCalculation.test.ts`
Expected: FAIL with "suggestLoanAllocation is not defined"

**Step 3: Write minimal implementation**

Add to `src/utils/phaseCostsCalculation.ts`:

```typescript
export interface LoanAllocation {
  loan1Amount: number;
  loan2Amount: number;
  includeParachevements: boolean;
  totalToFinance: number;
}

/**
 * Suggests how to split financing between two loans based on payment timing
 * - Loan 1: Signature costs (after deducting capital)
 * - Loan 2: Construction costs (+ optional parachèvements)
 *
 * Capital is first applied to signature costs, excess goes to construction
 */
export function suggestLoanAllocation(
  phaseCosts: PhaseCosts,
  capitalApporte: number,
  includeParachevements: boolean
): LoanAllocation {
  const signatureCosts = phaseCosts.signature.total;
  const constructionCosts = phaseCosts.construction.total;
  const parachevementsCosts = includeParachevements ? phaseCosts.emmenagement.total : 0;

  // Apply capital first to signature costs
  let remainingCapital = capitalApporte;
  const loan1Amount = Math.max(0, signatureCosts - remainingCapital);
  remainingCapital = Math.max(0, remainingCapital - signatureCosts);

  // Apply remaining capital to construction costs
  const loan2Amount = Math.max(0, constructionCosts + parachevementsCosts - remainingCapital);

  return {
    loan1Amount,
    loan2Amount,
    includeParachevements,
    totalToFinance: loan1Amount + loan2Amount,
  };
}
```

**Step 4: Run test to verify it passes**

Run: `npm run test:run -- src/utils/phaseCostsCalculation.test.ts`
Expected: PASS (6 tests)

**Step 5: Commit**

```bash
git add src/utils/phaseCostsCalculation.ts src/utils/phaseCostsCalculation.test.ts
git commit -m "feat: add suggestLoanAllocation function for auto loan split"
```

---

## Task 6: Create FinancingSection Component

**Files:**
- Create: `src/components/shared/FinancingSection.tsx`
- Create: `src/components/shared/FinancingSection.test.tsx`

**Step 1: Write the failing test**

```typescript
// src/components/shared/FinancingSection.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FinancingSection } from './FinancingSection';
import type { PhaseCosts } from '../../utils/phaseCostsCalculation';
import type { Participant, ParticipantCalculation } from '../../utils/calculatorUtils';

describe('FinancingSection', () => {
  const mockPhaseCosts: PhaseCosts = {
    signature: { purchaseShare: 35000, registrationFees: 5200, notaryFees: 5000, total: 45200 },
    construction: { casco: 60000, travauxCommuns: 12500, commun: 15000, total: 87500 },
    emmenagement: { parachevements: 25000, total: 25000 },
    grandTotal: 157700,
  };

  const mockParticipant: Partial<Participant> = {
    capitalApporte: 30000,
    useTwoLoans: false,
    interestRate: 3.5,
    durationYears: 25,
  };

  const mockParticipantCalc: Partial<ParticipantCalculation> = {
    loanNeeded: 127700,
    monthlyPayment: 640,
  };

  it('should display capital input and remaining to finance', () => {
    render(
      <FinancingSection
        phaseCosts={mockPhaseCosts}
        participant={mockParticipant as Participant}
        participantCalc={mockParticipantCalc as ParticipantCalculation}
        onUpdateParticipant={vi.fn()}
      />
    );

    expect(screen.getByText('Capital apporté:')).toBeInTheDocument();
    expect(screen.getByText(/Reste à financer/)).toBeInTheDocument();
  });

  it('should show single vs two loans toggle', () => {
    render(
      <FinancingSection
        phaseCosts={mockPhaseCosts}
        participant={mockParticipant as Participant}
        participantCalc={mockParticipantCalc as ParticipantCalculation}
        onUpdateParticipant={vi.fn()}
      />
    );

    expect(screen.getByText('Un seul prêt')).toBeInTheDocument();
    expect(screen.getByText('Deux prêts')).toBeInTheDocument();
  });

  it('should show auto-suggested loan amounts when two loans enabled', () => {
    const participantWithTwoLoans = { ...mockParticipant, useTwoLoans: true };

    render(
      <FinancingSection
        phaseCosts={mockPhaseCosts}
        participant={participantWithTwoLoans as Participant}
        participantCalc={mockParticipantCalc as ParticipantCalculation}
        onUpdateParticipant={vi.fn()}
      />
    );

    expect(screen.getByText('PRÊT 1 (Signature)')).toBeInTheDocument();
    expect(screen.getByText('PRÊT 2 (Construction)')).toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm run test:run -- src/components/shared/FinancingSection.test.tsx`
Expected: FAIL with "Cannot find module './FinancingSection'"

**Step 3: Write minimal implementation**

```typescript
// src/components/shared/FinancingSection.tsx
import { useMemo } from 'react';
import { formatCurrency } from '../../utils/formatting';
import { suggestLoanAllocation, type PhaseCosts } from '../../utils/phaseCostsCalculation';
import type { Participant, ParticipantCalculation } from '../../utils/calculatorUtils';

interface FinancingSectionProps {
  phaseCosts: PhaseCosts;
  participant: Participant;
  participantCalc: ParticipantCalculation;
  onUpdateParticipant: (updated: Participant) => void;
}

export function FinancingSection({
  phaseCosts,
  participant,
  participantCalc,
  onUpdateParticipant,
}: FinancingSectionProps) {
  const capitalApporte = participant.capitalApporte ?? 0;
  const useTwoLoans = participant.useTwoLoans ?? false;
  const includeParachevements = participant.loan2IncludesParachevements ?? false;

  const loanSuggestion = useMemo(
    () => suggestLoanAllocation(phaseCosts, capitalApporte, includeParachevements),
    [phaseCosts, capitalApporte, includeParachevements]
  );

  const remainingToFinance = phaseCosts.grandTotal - capitalApporte;

  return (
    <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
      {/* Capital and remaining */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Capital apporté:</span>
          <input
            type="number"
            value={capitalApporte}
            onChange={(e) =>
              onUpdateParticipant({
                ...participant,
                capitalApporte: parseFloat(e.target.value) || 0,
              })
            }
            className="w-32 px-2 py-1 border border-gray-300 rounded text-right font-medium"
            step="1000"
          />
        </div>
        <div className="text-sm">
          <span className="text-gray-600">Reste à financer: </span>
          <span className="font-bold text-red-700">{formatCurrency(Math.max(0, remainingToFinance))}</span>
        </div>
      </div>

      {/* Loan type toggle */}
      <div className="flex items-center gap-4 mb-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name="loanType"
            checked={!useTwoLoans}
            onChange={() => onUpdateParticipant({ ...participant, useTwoLoans: false })}
            className="w-4 h-4"
          />
          <span className="text-sm">Un seul prêt</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name="loanType"
            checked={useTwoLoans}
            onChange={() => onUpdateParticipant({ ...participant, useTwoLoans: true })}
            className="w-4 h-4"
          />
          <span className="text-sm">Deux prêts</span>
          <span className="text-xs text-gray-500">(recommandé)</span>
        </label>
      </div>

      {/* Two loans configuration */}
      {useTwoLoans && (
        <div className="grid grid-cols-2 gap-4">
          {/* Loan 1 */}
          <div className="bg-white rounded-lg p-4 border-2 border-blue-200">
            <p className="text-xs font-semibold text-blue-700 mb-2">PRÊT 1 (Signature)</p>
            <p className="text-lg font-bold text-gray-900">{formatCurrency(loanSuggestion.loan1Amount)}</p>
            <p className="text-xs text-gray-500 mt-1">
              {participant.durationYears} ans @ {participant.interestRate}%
            </p>
            {participantCalc.loan1MonthlyPayment && (
              <p className="text-sm font-medium text-blue-700 mt-2">
                {formatCurrency(participantCalc.loan1MonthlyPayment)}/mois
              </p>
            )}
          </div>

          {/* Loan 2 */}
          <div className="bg-white rounded-lg p-4 border-2 border-orange-200">
            <p className="text-xs font-semibold text-orange-700 mb-2">PRÊT 2 (Construction)</p>
            <p className="text-lg font-bold text-gray-900">{formatCurrency(loanSuggestion.loan2Amount)}</p>
            <p className="text-xs text-gray-500 mt-1">
              Démarre après {participant.loan2DelayYears ?? 2} an(s)
            </p>
            {participantCalc.loan2MonthlyPayment && (
              <p className="text-sm font-medium text-orange-700 mt-2">
                {formatCurrency(participantCalc.loan2MonthlyPayment)}/mois
              </p>
            )}

            {/* Parachèvements toggle */}
            <label className="flex items-center gap-2 mt-3 cursor-pointer">
              <input
                type="checkbox"
                checked={includeParachevements}
                onChange={(e) =>
                  onUpdateParticipant({
                    ...participant,
                    loan2IncludesParachevements: e.target.checked,
                  })
                }
                className="w-4 h-4"
              />
              <span className="text-xs text-gray-600">
                Inclure parachèvements (+{formatCurrency(phaseCosts.emmenagement.total)})
              </span>
            </label>
          </div>
        </div>
      )}

      {/* Single loan display */}
      {!useTwoLoans && (
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Montant à emprunter</p>
              <p className="text-xl font-bold text-gray-900">{formatCurrency(participantCalc.loanNeeded)}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Mensualité</p>
              <p className="text-xl font-bold text-red-700">{formatCurrency(participantCalc.monthlyPayment)}</p>
              <p className="text-xs text-gray-500">
                {participant.durationYears} ans @ {participant.interestRate}%
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
```

**Step 4: Run test to verify it passes**

Run: `npm run test:run -- src/components/shared/FinancingSection.test.tsx`
Expected: PASS (3 tests)

**Step 5: Commit**

```bash
git add src/components/shared/FinancingSection.tsx src/components/shared/FinancingSection.test.tsx
git commit -m "feat: add FinancingSection with auto-suggested loan allocation"
```

---

## Task 7: Refactor ParticipantDetailModal Layout

**Files:**
- Modify: `src/components/calculator/ParticipantDetailModal.tsx`

**Step 1: Read current file structure**

The modal currently has this structure:
1. Header (name, metrics)
2. Configuration section (inline, not collapsible)
3. CostBreakdownGrid
4. FinancingResultCard
5. ExpectedPaybacksCard
6. Entry Date section
7. Remove button
8. Purchase Details (newcomers)

**Step 2: Refactor to new structure**

Replace the content section of `ParticipantDetailModal.tsx` with the new layout:

```typescript
// Key imports to add at top:
import { PaymentTimeline } from '../shared/PaymentTimeline';
import { FinancingSection } from '../shared/FinancingSection';
import { CollapsibleSection } from '../shared/CollapsibleSection';
import { calculatePhaseCosts } from '../../utils/phaseCostsCalculation';

// Inside the component, add:
const phaseCosts = useMemo(
  () => calculatePhaseCosts(p),
  [p]
);

// Replace the content section with new layout structure
```

**Step 3: Implement the refactored layout**

The new layout order:
1. Header (simplified - name, unit, surface only)
2. **PaymentTimeline** (hero - 3 phases with costs)
3. **FinancingSection** (collapsed by default)
4. CollapsibleSection: Paramètres (existing config)
5. CollapsibleSection: Remboursements attendus (ExpectedPaybacksCard)
6. CollapsibleSection: Statut (entry date / founder)
7. Remove button (bottom)
8. Purchase Details (newcomers only)

**Step 4: Run full test suite**

Run: `npm run test:run`
Expected: All existing tests should still pass (no behavior change, only layout)

**Step 5: Commit**

```bash
git add src/components/calculator/ParticipantDetailModal.tsx
git commit -m "refactor: reorganize modal with PaymentTimeline as hero component"
```

---

## Task 8: Visual Polish and Responsive Adjustments

**Files:**
- Modify: `src/components/shared/PaymentTimeline.tsx`
- Modify: `src/components/shared/PaymentPhaseCard.tsx`

**Step 1: Add responsive breakpoints**

Make timeline stack vertically on mobile:

```typescript
// In PaymentTimeline.tsx, change grid to:
<div className="grid grid-cols-1 md:grid-cols-4 gap-3">
```

**Step 2: Add color coding to phase cards**

```typescript
// Different border colors per phase:
// Signature: border-blue-300, bg-blue-50
// Construction: border-orange-300, bg-orange-50
// Emménagement: border-green-300, bg-green-50
// Total: border-gray-400, bg-gray-100
```

**Step 3: Run visual check**

Run: `npm run dev`
Navigate to modal and verify layout looks correct on different screen sizes.

**Step 4: Commit**

```bash
git add src/components/shared/PaymentTimeline.tsx src/components/shared/PaymentPhaseCard.tsx
git commit -m "style: add responsive layout and color coding to timeline"
```

---

## Task 9: Integration Testing

**Files:**
- Create: `src/components/calculator/ParticipantDetailModal.integration.test.tsx`

**Step 1: Write integration test**

```typescript
// src/components/calculator/ParticipantDetailModal.integration.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ParticipantDetailModal from './ParticipantDetailModal';
// ... mock data setup

describe('ParticipantDetailModal Integration', () => {
  it('should display payment timeline with correct phase totals', () => {
    // Render modal with mock participant data
    // Verify timeline shows correct totals for each phase
  });

  it('should show financing section when expanded', () => {
    // Expand financing section
    // Verify loan configuration options appear
  });

  it('should update loan allocation when capital changes', () => {
    // Change capital input
    // Verify suggested loan amounts update
  });
});
```

**Step 2: Run integration tests**

Run: `npm run test:run -- src/components/calculator/ParticipantDetailModal.integration.test.tsx`

**Step 3: Commit**

```bash
git add src/components/calculator/ParticipantDetailModal.integration.test.tsx
git commit -m "test: add integration tests for modal payment timeline"
```

---

## Task 10: Final Cleanup and Documentation

**Files:**
- Modify: `docs/plans/2025-01-26-participant-modal-redesign.md`

**Step 1: Update design doc with implementation notes**

Add "Implementation Complete" section with:
- List of new components created
- Any deviations from original design
- Known limitations or future improvements

**Step 2: Run full test suite**

Run: `npm run test:run`
Expected: All tests pass

**Step 3: Run type check**

Run: `npx tsc --noEmit`
Expected: No type errors

**Step 4: Final commit**

```bash
git add docs/plans/2025-01-26-participant-modal-redesign.md
git commit -m "docs: mark modal redesign implementation complete"
```

---

## Summary

| Task | Component | Description |
|------|-----------|-------------|
| 1 | `phaseCostsCalculation.ts` | Pure function to group costs by phase |
| 2 | `CollapsibleSection.tsx` | Reusable collapsible wrapper |
| 3 | `PaymentPhaseCard.tsx` | Card showing phase total + expandable details |
| 4 | `PaymentTimeline.tsx` | Hero component with 3 phases + total |
| 5 | `suggestLoanAllocation()` | Auto-suggest loan split based on timing |
| 6 | `FinancingSection.tsx` | Loan configuration with auto-suggest |
| 7 | `ParticipantDetailModal.tsx` | Refactor layout to new structure |
| 8 | Visual polish | Responsive + color coding |
| 9 | Integration tests | End-to-end modal behavior |
| 10 | Documentation | Update design doc |

**Estimated commits:** 10
**Test coverage:** Unit tests for each new function/component + integration tests
