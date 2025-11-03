# Portage Feature UX Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform portage from partially implemented component into production-ready feature with transparent pricing formulas, global configuration, and improved UX.

**Architecture:** Three-component system: (1) Global PortageFormulaConfig for adjustable parameters, (2) Enhanced PortageLotConfig in participant panels with breakdown tables, (3) Enhanced AvailableLotsView marketplace with side-by-side formula/lots display. All components share global formula parameters and use consistent breakdown table design.

**Tech Stack:** React, TypeScript, Tailwind CSS, existing portageCalculations utilities

**Design Reference:** `docs/plans/2025-11-03-portage-feature-ux-redesign.md`

---

## Task 1: Add Global Portage Formula State

**Files:**
- Modify: `src/utils/calculatorUtils.ts:70-84`
- Test: `src/utils/calculatorUtils.test.ts`

**Step 1: Write failing test for PortageFormulaParams type**

Add to `src/utils/calculatorUtils.test.ts`:

```typescript
import type { PortageFormulaParams } from './calculatorUtils';

describe('PortageFormulaParams', () => {
  it('should have default portage formula parameters', () => {
    const defaults: PortageFormulaParams = {
      indexationRate: 2.0,
      carryingCostRecovery: 100,
      averageInterestRate: 4.5
    };

    expect(defaults.indexationRate).toBe(2.0);
    expect(defaults.carryingCostRecovery).toBe(100);
    expect(defaults.averageInterestRate).toBe(4.5);
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npm run test:run -- src/utils/calculatorUtils.test.ts
```

Expected: FAIL - "Module has no exported member 'PortageFormulaParams'"

**Step 3: Add PortageFormulaParams interface**

Add to `src/utils/calculatorUtils.ts` after `Scenario` interface (around line 76):

```typescript
export interface PortageFormulaParams {
  indexationRate: number; // Annual percentage (default: 2.0)
  carryingCostRecovery: number; // Percentage of carrying costs to recover (default: 100)
  averageInterestRate: number; // Annual percentage for loan interest (default: 4.5)
}

export const DEFAULT_PORTAGE_FORMULA: PortageFormulaParams = {
  indexationRate: 2.0,
  carryingCostRecovery: 100,
  averageInterestRate: 4.5
};
```

**Step 4: Run test to verify it passes**

```bash
npm run test:run -- src/utils/calculatorUtils.test.ts
```

Expected: PASS

**Step 5: Commit**

```bash
git add src/utils/calculatorUtils.ts src/utils/calculatorUtils.test.ts
git commit -m "feat: add PortageFormulaParams interface and defaults"
```

---

## Task 2: Update portageCalculations to Accept Formula Params

**Files:**
- Modify: `src/utils/portageCalculations.ts:128-170`
- Modify: `src/utils/portageCalculations.ts:189-217`
- Test: `src/utils/portageCalculations.test.ts`

**Step 1: Write failing test for updated calculateResalePrice**

Add to `src/utils/portageCalculations.test.ts`:

```typescript
import type { PortageFormulaParams } from './calculatorUtils';

describe('calculateResalePrice with formula params', () => {
  it('should use custom indexation rate from formula params', () => {
    const customFormula: PortageFormulaParams = {
      indexationRate: 3.0, // Custom rate
      carryingCostRecovery: 100,
      averageInterestRate: 4.5
    };

    const carryingCosts = calculateCarryingCosts(60000, 0, 30, 4.5);
    const result = calculateResalePrice(
      60000,
      7500,
      0,
      2.5,
      customFormula,
      carryingCosts,
      0
    );

    // With 3% indexation over 2.5 years
    const expectedIndexation = 60000 * (Math.pow(1.03, 2.5) - 1);
    expect(result.indexation).toBeCloseTo(expectedIndexation, 0);
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npm run test:run -- src/utils/portageCalculations.test.ts
```

Expected: FAIL - "Expected 5 arguments, but got 7"

**Step 3: Update calculateResalePrice signature and implementation**

Modify `src/utils/portageCalculations.ts:128-170`:

```typescript
import type { PortageFormulaParams } from './calculatorUtils';

/**
 * Calculate fair resale price using habitat-beaver formula
 *
 * Formula breakdown:
 * - Base acquisition cost (purchase price + notary fees + construction costs)
 * - + Indexation (compound interest using rate from formula params)
 * - + Carrying cost recovery
 * - + Additional renovations after initial acquisition
 *
 * @param originalPurchaseShare - Original purchase price
 * @param originalNotaryFees - Notary fees paid at purchase
 * @param originalConstructionCost - Construction costs (CASCO + parachevements + travaux communs)
 * @param yearsHeld - Years the lot was carried
 * @param formulaParams - Global formula parameters (indexation rate, etc.)
 * @param carryingCosts - Calculated carrying costs
 * @param renovationsConducted - Any additional renovation costs after acquisition
 * @returns Complete breakdown of resale price
 */
export function calculateResalePrice(
  originalPurchaseShare: number,
  originalNotaryFees: number,
  originalConstructionCost: number,
  yearsHeld: number,
  formulaParams: PortageFormulaParams,
  carryingCosts: CarryingCosts,
  renovationsConducted: number = 0
): ResalePrice {
  // Total acquisition cost = purchase + notary + construction
  const totalAcquisitionCost = originalPurchaseShare + originalNotaryFees + originalConstructionCost;

  // Calculate indexation on total acquisition cost (compound) using formula params
  const indexationRate = formulaParams.indexationRate;
  const indexationMultiplier = Math.pow(1 + indexationRate / 100, yearsHeld);
  const indexation = totalAcquisitionCost * (indexationMultiplier - 1);

  // Fee recovery no longer applicable (fees included in acquisition cost)
  const feesRecovery = 0;

  // Apply carrying cost recovery percentage from formula params
  const carryingCostRecovery = carryingCosts.totalForPeriod * (formulaParams.carryingCostRecovery / 100);

  // Total price
  const totalPrice =
    totalAcquisitionCost +
    indexation +
    carryingCostRecovery +
    renovationsConducted;

  return {
    basePrice: totalAcquisitionCost,
    feesRecovery,
    indexation,
    carryingCostRecovery,
    renovations: renovationsConducted,
    totalPrice,
    breakdown: {
      base: totalAcquisitionCost,
      fees: feesRecovery,
      indexation,
      carrying: carryingCostRecovery,
      renovations: renovationsConducted
    }
  };
}
```

**Step 4: Update calculatePortageLotPrice to use formulaParams**

Modify `src/utils/portageCalculations.ts:189-217`:

```typescript
/**
 * Calculate price for portage lot from founder (surface imposed)
 */
export function calculatePortageLotPrice(
  originalPrice: number,
  originalNotaryFees: number,
  originalConstructionCost: number,
  yearsHeld: number,
  formulaParams: PortageFormulaParams,
  carryingCosts: CarryingCosts,
  renovations: number = 0
): PortageLotPrice {
  const resale = calculateResalePrice(
    originalPrice,
    originalNotaryFees,
    originalConstructionCost,
    yearsHeld,
    formulaParams,
    carryingCosts,
    renovations
  );

  return {
    basePrice: resale.basePrice,
    surfaceImposed: true,
    indexation: resale.indexation,
    carryingCostRecovery: resale.carryingCostRecovery,
    feesRecovery: resale.feesRecovery,
    totalPrice: resale.totalPrice,
    pricePerM2: 0 // Not applicable - surface is imposed
  };
}
```

**Step 5: Update calculatePortageLotPriceFromCopro signature**

Modify `src/utils/portageCalculations.ts:222-256`:

```typescript
/**
 * Calculate price for portage lot from copropriété (surface free)
 */
export function calculatePortageLotPriceFromCopro(
  surfaceChosen: number,
  totalCoproLotSurface: number,
  totalCoproLotOriginalPrice: number,
  yearsHeld: number,
  formulaParams: PortageFormulaParams,
  totalCarryingCosts: number
): PortageLotPrice {
  // Calculate proportional base price
  const surfaceRatio = surfaceChosen / totalCoproLotSurface;
  const basePrice = totalCoproLotOriginalPrice * surfaceRatio;

  // Calculate indexation using formula params
  const indexationRate = formulaParams.indexationRate;
  const indexationMultiplier = Math.pow(1 + indexationRate / 100, yearsHeld);
  const indexation = basePrice * (indexationMultiplier - 1);

  // Proportional carrying costs with recovery percentage
  const carryingCostRecovery = totalCarryingCosts * surfaceRatio * (formulaParams.carryingCostRecovery / 100);

  // No fee recovery for copro lots (copro doesn't recover fees)
  const feesRecovery = 0;

  const totalPrice = basePrice + indexation + carryingCostRecovery;
  const pricePerM2 = totalPrice / surfaceChosen;

  return {
    basePrice,
    surfaceImposed: false,
    indexation,
    carryingCostRecovery,
    feesRecovery,
    totalPrice,
    pricePerM2
  };
}
```

**Step 6: Run test to verify it passes**

```bash
npm run test:run -- src/utils/portageCalculations.test.ts
```

Expected: PASS

**Step 7: Commit**

```bash
git add src/utils/portageCalculations.ts src/utils/portageCalculations.test.ts
git commit -m "feat: update portage calculations to use formula params"
```

---

## Task 3: Create PortageFormulaConfig Component

**Files:**
- Create: `src/components/PortageFormulaConfig.tsx`
- Create: `src/components/PortageFormulaConfig.test.tsx`

**Step 1: Write failing test for PortageFormulaConfig**

Create `src/components/PortageFormulaConfig.test.tsx`:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PortageFormulaConfig from './PortageFormulaConfig';
import type { PortageFormulaParams } from '../utils/calculatorUtils';

describe('PortageFormulaConfig', () => {
  it('should render formula parameters inputs', () => {
    const params: PortageFormulaParams = {
      indexationRate: 2.0,
      carryingCostRecovery: 100,
      averageInterestRate: 4.5
    };

    render(
      <PortageFormulaConfig
        formulaParams={params}
        onUpdateParams={() => {}}
        deedDate={new Date('2023-01-01')}
      />
    );

    expect(screen.getByText(/Configuration Formule de Portage/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Taux d'indexation annuel/i)).toHaveValue(2.0);
    expect(screen.getByLabelText(/Récupération frais de portage/i)).toHaveValue(100);
    expect(screen.getByLabelText(/Taux d'intérêt moyen/i)).toHaveValue(4.5);
  });

  it('should call onUpdateParams when indexation rate changes', async () => {
    const user = userEvent.setup();
    const mockUpdate = vi.fn();
    const params: PortageFormulaParams = {
      indexationRate: 2.0,
      carryingCostRecovery: 100,
      averageInterestRate: 4.5
    };

    render(
      <PortageFormulaConfig
        formulaParams={params}
        onUpdateParams={mockUpdate}
        deedDate={new Date('2023-01-01')}
      />
    );

    const input = screen.getByLabelText(/Taux d'indexation annuel/i);
    await user.clear(input);
    await user.type(input, '3.0');

    expect(mockUpdate).toHaveBeenCalledWith({
      ...params,
      indexationRate: 3.0
    });
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npm run test:run -- src/components/PortageFormulaConfig.test.tsx
```

Expected: FAIL - "Cannot find module './PortageFormulaConfig'"

**Step 3: Create PortageFormulaConfig component**

Create `src/components/PortageFormulaConfig.tsx`:

```typescript
import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { PortageFormulaParams } from '../utils/calculatorUtils';
import { calculateCarryingCosts } from '../utils/portageCalculations';
import { formatCurrency } from '../utils/formatting';

interface PortageFormulaConfigProps {
  formulaParams: PortageFormulaParams;
  onUpdateParams: (params: PortageFormulaParams) => void;
  deedDate: Date;
}

export default function PortageFormulaConfig({
  formulaParams,
  onUpdateParams,
  deedDate
}: PortageFormulaConfigProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleUpdate = (field: keyof PortageFormulaParams, value: number) => {
    onUpdateParams({
      ...formulaParams,
      [field]: value
    });
  };

  // Example calculation for preview (2.5 years on €60,000 lot)
  const exampleYears = 2.5;
  const exampleBase = 60000;
  const exampleCarryingCosts = calculateCarryingCosts(
    exampleBase,
    0,
    Math.round(exampleYears * 12),
    formulaParams.averageInterestRate
  );
  const exampleIndexation = exampleBase * (Math.pow(1 + formulaParams.indexationRate / 100, exampleYears) - 1);
  const exampleCarryingRecovery = exampleCarryingCosts.totalForPeriod * (formulaParams.carryingCostRecovery / 100);
  const exampleTotal = exampleBase + exampleIndexation + exampleCarryingRecovery;

  return (
    <div className="mb-6 bg-blue-50 rounded-lg border-2 border-blue-200">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-blue-100 transition-colors rounded-t-lg"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">📦</span>
          <h3 className="text-lg font-bold text-blue-900">
            Configuration Formule de Portage
          </h3>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-blue-700" />
        ) : (
          <ChevronDown className="w-5 h-5 text-blue-700" />
        )}
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-6 pb-6 pt-2 space-y-6">
          {/* Adjustable Parameters */}
          <div>
            <h4 className="text-sm font-semibold text-blue-900 mb-3">
              Paramètres ajustables
            </h4>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label
                  htmlFor="indexationRate"
                  className="block text-xs text-gray-700 mb-1"
                >
                  Taux d'indexation annuel
                </label>
                <div className="flex items-center gap-2">
                  <input
                    id="indexationRate"
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    value={formulaParams.indexationRate}
                    onChange={(e) =>
                      handleUpdate('indexationRate', parseFloat(e.target.value) || 0)
                    }
                    className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  <span className="text-sm text-gray-600">%</span>
                </div>
              </div>

              <div>
                <label
                  htmlFor="carryingCostRecovery"
                  className="block text-xs text-gray-700 mb-1"
                >
                  Récupération frais de portage
                </label>
                <div className="flex items-center gap-2">
                  <input
                    id="carryingCostRecovery"
                    type="number"
                    step="5"
                    min="0"
                    max="100"
                    value={formulaParams.carryingCostRecovery}
                    onChange={(e) =>
                      handleUpdate('carryingCostRecovery', parseFloat(e.target.value) || 0)
                    }
                    className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  <span className="text-sm text-gray-600">%</span>
                </div>
              </div>

              <div>
                <label
                  htmlFor="averageInterestRate"
                  className="block text-xs text-gray-700 mb-1"
                >
                  Taux d'intérêt moyen
                </label>
                <div className="flex items-center gap-2">
                  <input
                    id="averageInterestRate"
                    type="number"
                    step="0.1"
                    min="0"
                    max="15"
                    value={formulaParams.averageInterestRate}
                    onChange={(e) =>
                      handleUpdate('averageInterestRate', parseFloat(e.target.value) || 0)
                    }
                    className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  <span className="text-sm text-gray-600">%</span>
                </div>
              </div>
            </div>
          </div>

          <hr className="border-blue-200" />

          {/* Formula Explanation */}
          <div>
            <h4 className="text-sm font-semibold text-blue-900 mb-2">
              Aperçu de la formule
            </h4>
            <div className="bg-white p-4 rounded-lg border border-blue-200 space-y-2 text-sm">
              <div className="font-semibold text-blue-900">
                Prix de vente = Base + Indexation + Frais de portage
              </div>
              <div className="text-gray-700 space-y-1 text-xs">
                <div><strong>Où:</strong></div>
                <div>• Base = Achat initial + Frais notaire + Construction</div>
                <div>
                  • Indexation = Base × [(1 + {formulaParams.indexationRate}%)^années - 1]
                </div>
                <div>
                  • Frais de portage = (Intérêts + Taxes + Assurance) × {formulaParams.carryingCostRecovery}%
                </div>
              </div>
            </div>
          </div>

          {/* Example Calculation */}
          <div>
            <h4 className="text-sm font-semibold text-blue-900 mb-2">
              Exemple pour {exampleYears} ans de portage sur lot de {formatCurrency(exampleBase)}
            </h4>
            <div className="bg-white rounded-lg border border-blue-200 overflow-hidden">
              <table className="w-full text-sm">
                <tbody>
                  <tr className="border-b border-blue-100">
                    <td className="px-4 py-2 text-gray-700">Base acquisition</td>
                    <td className="px-4 py-2 text-right font-semibold">
                      {formatCurrency(exampleBase)}
                    </td>
                  </tr>
                  <tr className="border-b border-blue-100">
                    <td className="px-4 py-2 text-gray-700">
                      Indexation ({formulaParams.indexationRate}% × {exampleYears} ans)
                    </td>
                    <td className="px-4 py-2 text-right font-semibold">
                      {formatCurrency(exampleIndexation)}
                    </td>
                  </tr>
                  <tr className="border-b border-blue-100">
                    <td className="px-4 py-2 text-gray-700">
                      Frais de portage ({exampleYears} ans)
                    </td>
                    <td className="px-4 py-2 text-right font-semibold">
                      {formatCurrency(exampleCarryingRecovery)}
                    </td>
                  </tr>
                  <tr className="border-b border-blue-100 text-xs text-gray-600">
                    <td className="px-6 py-1">
                      - Intérêts ({formulaParams.averageInterestRate}% sur prêt)
                    </td>
                    <td className="px-4 py-1 text-right">
                      {formatCurrency(exampleCarryingCosts.monthlyInterest * exampleYears * 12)}
                    </td>
                  </tr>
                  <tr className="border-b border-blue-100 text-xs text-gray-600">
                    <td className="px-6 py-1">- Taxe bâtiment inoccupé</td>
                    <td className="px-4 py-1 text-right">
                      {formatCurrency(exampleCarryingCosts.monthlyTax * exampleYears * 12)}
                    </td>
                  </tr>
                  <tr className="border-b border-blue-200 text-xs text-gray-600">
                    <td className="px-6 py-1">- Assurance</td>
                    <td className="px-4 py-1 text-right">
                      {formatCurrency(exampleCarryingCosts.monthlyInsurance * exampleYears * 12)}
                    </td>
                  </tr>
                  <tr className="bg-blue-50">
                    <td className="px-4 py-3 font-bold text-blue-900">Prix total de vente</td>
                    <td className="px-4 py-3 text-right font-bold text-blue-900">
                      {formatCurrency(exampleTotal)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
```

**Step 4: Run test to verify it passes**

```bash
npm run test:run -- src/components/PortageFormulaConfig.test.tsx
```

Expected: PASS

**Step 5: Commit**

```bash
git add src/components/PortageFormulaConfig.tsx src/components/PortageFormulaConfig.test.tsx
git commit -m "feat: create PortageFormulaConfig component"
```

---

## Task 4: Enhance PortageLotConfig with Breakdown Table

**Files:**
- Modify: `src/components/PortageLotConfig.tsx`
- Modify: `src/components/PortageLotConfig.test.tsx`

**Step 1: Write test for breakdown table display**

Add to `src/components/PortageLotConfig.test.tsx`:

```typescript
import type { PortageFormulaParams } from '../utils/calculatorUtils';

it('should display price breakdown table for portage lot', () => {
  const lot: Lot = {
    lotId: 1,
    surface: 45,
    allocatedSurface: 45,
    isPortage: true,
    originalPrice: 60000,
    originalNotaryFees: 7500,
    originalConstructionCost: 0
  };

  const formulaParams: PortageFormulaParams = {
    indexationRate: 2.0,
    carryingCostRecovery: 100,
    averageInterestRate: 4.5
  };

  render(
    <PortageLotConfig
      portageLots={[lot]}
      onAddLot={() => {}}
      onRemoveLot={() => {}}
      onUpdateSurface={() => {}}
      deedDate={new Date('2023-01-01')}
      formulaParams={formulaParams}
    />
  );

  expect(screen.getByText(/Base acquisition/i)).toBeInTheDocument();
  expect(screen.getByText(/Indexation/i)).toBeInTheDocument();
  expect(screen.getByText(/Frais de portage/i)).toBeInTheDocument();
  expect(screen.getByText(/Prix total/i)).toBeInTheDocument();
});
```

**Step 2: Run test to verify it fails**

```bash
npm run test:run -- src/components/PortageLotConfig.test.tsx
```

Expected: FAIL - Missing props

**Step 3: Update PortageLotConfig component**

Replace `src/components/PortageLotConfig.tsx`:

```typescript
import type { Lot } from '../types/timeline';
import type { PortageFormulaParams } from '../utils/calculatorUtils';
import { calculateCarryingCosts, calculatePortageLotPrice } from '../utils/portageCalculations';
import { formatCurrency } from '../utils/formatting';

interface PortageLotConfigProps {
  portageLots: Lot[];
  onAddLot: () => void;
  onRemoveLot: (lotId: number) => void;
  onUpdateSurface: (lotId: number, surface: number) => void;
  deedDate: Date;
  formulaParams: PortageFormulaParams;
  participantName?: string; // For anchor link
}

export default function PortageLotConfig({
  portageLots,
  onAddLot,
  onRemoveLot,
  onUpdateSurface,
  deedDate,
  formulaParams,
  participantName
}: PortageLotConfigProps) {
  // Calculate years held
  const yearsHeld = (new Date().getTime() - deedDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);

  const handleScrollToMarketplace = () => {
    const marketplace = document.getElementById('portage-marketplace');
    if (marketplace) {
      marketplace.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="mb-4 p-4 bg-orange-50 rounded-lg border border-orange-200">
      <div className="flex justify-between items-center mb-3">
        <p className="text-xs text-orange-700 uppercase tracking-wide font-semibold">
          📦 Lot en Portage
        </p>
        {portageLots.length === 0 && (
          <button
            onClick={onAddLot}
            className="text-xs bg-orange-600 hover:bg-orange-700 text-white px-3 py-1 rounded transition-colors"
          >
            + Ajouter lot portage
          </button>
        )}
      </div>

      {portageLots && portageLots.length > 0 ? (
        <div className="space-y-4">
          {portageLots.map((lot) => {
            // Calculate price
            const originalPrice = lot.originalPrice ?? 0;
            const originalNotaryFees = lot.originalNotaryFees ?? 0;
            const originalConstructionCost = lot.originalConstructionCost ?? 0;

            const carryingCosts = calculateCarryingCosts(
              originalPrice,
              0,
              Math.round(yearsHeld * 12),
              formulaParams.averageInterestRate
            );

            const price = calculatePortageLotPrice(
              originalPrice,
              originalNotaryFees,
              originalConstructionCost,
              yearsHeld,
              formulaParams,
              carryingCosts,
              0
            );

            return (
              <div key={lot.lotId} className="bg-white p-4 rounded border border-orange-300 space-y-3">
                {/* Surface Input */}
                <div>
                  <label className="block text-xs text-gray-600 mb-1">
                    Surface à vendre (m²)
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    value={lot.allocatedSurface || 0}
                    onChange={(e) => onUpdateSurface(lot.lotId, parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-sm font-semibold border border-orange-300 rounded-lg focus:border-orange-500 focus:ring-1 focus:ring-orange-500 focus:outline-none"
                  />
                </div>

                {/* Price Display */}
                <div className="text-sm">
                  <div className="text-gray-700 mb-1">
                    Prix de vente ({yearsHeld.toFixed(1)} ans de portage):
                  </div>
                  <div className="text-2xl font-bold text-orange-900">
                    {formatCurrency(price.totalPrice)}
                  </div>
                </div>

                {/* Breakdown Table */}
                <div className="bg-orange-50 rounded border border-orange-200 overflow-hidden">
                  <table className="w-full text-xs">
                    <tbody>
                      <tr className="border-b border-orange-100">
                        <td className="px-3 py-2 text-gray-700">
                          Base acquisition (achat+notaire+casco)
                        </td>
                        <td className="px-3 py-2 text-right font-semibold">
                          {formatCurrency(price.basePrice)}
                        </td>
                      </tr>
                      <tr className="border-b border-orange-100">
                        <td className="px-3 py-2 text-gray-700">
                          Indexation ({formulaParams.indexationRate}% × {yearsHeld.toFixed(1)} ans)
                        </td>
                        <td className="px-3 py-2 text-right font-semibold">
                          {formatCurrency(price.indexation)}
                        </td>
                      </tr>
                      <tr className="border-b border-orange-200">
                        <td className="px-3 py-2 text-gray-700">
                          Frais de portage ({yearsHeld.toFixed(1)} ans)
                        </td>
                        <td className="px-3 py-2 text-right font-semibold">
                          {formatCurrency(price.carryingCostRecovery)}
                        </td>
                      </tr>
                      <tr className="bg-orange-100">
                        <td className="px-3 py-2 font-bold text-orange-900">
                          Prix total
                        </td>
                        <td className="px-3 py-2 text-right font-bold text-orange-900">
                          {formatCurrency(price.totalPrice)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between gap-2">
                  <button
                    onClick={handleScrollToMarketplace}
                    className="text-xs text-orange-700 hover:text-orange-900 underline"
                  >
                    ↓ Voir dans la place de marché
                  </button>
                  <button
                    onClick={() => onRemoveLot(lot.lotId)}
                    className="text-red-600 hover:text-red-700 text-xs px-2 py-1 rounded border border-red-300 hover:bg-red-50"
                  >
                    Retirer
                  </button>
                </div>
              </div>
            );
          })}

          {portageLots.length < 2 && (
            <button
              onClick={onAddLot}
              className="w-full text-xs bg-orange-600 hover:bg-orange-700 text-white px-3 py-2 rounded transition-colors"
            >
              + Ajouter un autre lot portage
            </button>
          )}
        </div>
      ) : (
        <p className="text-xs text-gray-500 italic">
          Aucun lot en portage configuré.
        </p>
      )}
    </div>
  );
}
```

**Step 4: Run test to verify it passes**

```bash
npm run test:run -- src/components/PortageLotConfig.test.tsx
```

Expected: PASS

**Step 5: Commit**

```bash
git add src/components/PortageLotConfig.tsx src/components/PortageLotConfig.test.tsx
git commit -m "feat: enhance PortageLotConfig with breakdown table and pricing"
```

---

## Task 5: Enhance AvailableLotsView with Side-by-Side Layout

**Files:**
- Modify: `src/components/AvailableLotsView.tsx`
- Modify: `src/components/AvailableLotsView.test.tsx`

**Step 1: Write test for side-by-side layout**

Add to `src/components/AvailableLotsView.test.tsx`:

```typescript
it('should display generic formula alongside specific lots', () => {
  const lots: AvailableLot[] = [
    {
      lotId: 1,
      surface: 45,
      source: 'FOUNDER',
      surfaceImposed: true,
      fromParticipant: 'Alice',
      originalPrice: 60000,
      originalNotaryFees: 7500,
      originalConstructionCost: 0
    }
  ];

  const formulaParams: PortageFormulaParams = {
    indexationRate: 2.0,
    carryingCostRecovery: 100,
    averageInterestRate: 4.5
  };

  render(
    <AvailableLotsView
      availableLots={lots}
      deedDate={new Date('2023-01-01')}
      formulaParams={formulaParams}
    />
  );

  expect(screen.getByText(/Formule générale/i)).toBeInTheDocument();
  expect(screen.getByText(/Lots disponibles/i)).toBeInTheDocument();
  expect(screen.getByText(/De Alice/i)).toBeInTheDocument();
});
```

**Step 2: Run test to verify it fails**

```bash
npm run test:run -- src/components/AvailableLotsView.test.tsx
```

Expected: FAIL

**Step 3: Update AvailableLotsView component**

Replace `src/components/AvailableLotsView.tsx` with the enhanced version (content too long, showing key sections):

```typescript
import { useState } from 'react';
import type { AvailableLot } from '../utils/availableLots';
import type { PortageLotPrice } from '../utils/portageCalculations';
import type { PortageFormulaParams } from '../utils/calculatorUtils';
import { calculatePortageLotPrice, calculatePortageLotPriceFromCopro, calculateCarryingCosts } from '../utils/portageCalculations';
import { formatCurrency } from '../utils/formatting';

interface AvailableLotsViewProps {
  availableLots: AvailableLot[];
  deedDate: Date;
  formulaParams: PortageFormulaParams;
  onSelectLot?: (lot: AvailableLot, price: PortageLotPrice) => void;
}

export default function AvailableLotsView({
  availableLots,
  deedDate,
  formulaParams,
  onSelectLot
}: AvailableLotsViewProps) {
  const [coproSurfaces, setCoproSurfaces] = useState<Record<number, number>>({});

  const founderLots = availableLots.filter(lot => lot.source === 'FOUNDER');
  const coproLots = availableLots.filter(lot => lot.source === 'COPRO');

  const yearsHeld = calculateYearsHeld(deedDate);

  const handleScrollToParticipant = (participantName: string) => {
    const element = document.getElementById(`participant-${participantName}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Highlight briefly
      element.classList.add('ring-2', 'ring-orange-500');
      setTimeout(() => {
        element.classList.remove('ring-2', 'ring-orange-500');
      }, 2000);
    }
  };

  if (availableLots.length === 0) {
    return (
      <div id="portage-marketplace" className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
        <p className="text-gray-600">Aucun lot disponible pour le moment</p>
      </div>
    );
  }

  return (
    <div id="portage-marketplace" className="space-y-6 scroll-mt-6">
      {/* Title */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <span>🏪</span>
          Place de Marché — Lots Disponibles
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          Choisissez parmi les lots en portage (fondateurs) ou les lots de la copropriété
        </p>
      </div>

      {/* Founder Portage Lots */}
      {founderLots.length > 0 && (
        <div className="bg-orange-50 rounded-lg border-2 border-orange-200 p-6">
          <h3 className="text-lg font-semibold text-orange-700 mb-4 flex items-center gap-2">
            <span>📦</span>
            Lots Portage (Surface imposée)
          </h3>

          {/* Side-by-Side: Formula + Lots */}
          <div className="grid grid-cols-[300px_1fr] gap-6">
            {/* Generic Formula */}
            <div className="bg-white p-4 rounded-lg border border-orange-300 h-fit">
              <h4 className="text-sm font-semibold text-orange-900 mb-3">
                Formule générale
              </h4>
              <div className="space-y-2 text-xs text-gray-700">
                <div className="font-semibold">Prix =</div>
                <div className="pl-2">Base</div>
                <div className="pl-2">+ Indexation</div>
                <div className="pl-2">+ Portage</div>

                <div className="pt-2 border-t border-orange-200 mt-2">
                  <div className="font-semibold mb-1">Où:</div>
                  <div>Base = Achat +</div>
                  <div className="pl-4">Notaire + Casco</div>

                  <div className="mt-1">Indexation =</div>
                  <div className="pl-4">Base × [(1+r)^t-1]</div>

                  <div className="mt-1">Portage =</div>
                  <div className="pl-4">Intérêts +</div>
                  <div className="pl-4">Taxes +</div>
                  <div className="pl-4">Assurance</div>
                </div>
              </div>
            </div>

            {/* Specific Lots */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-orange-900">
                Lots disponibles
              </h4>
              {founderLots.map(lot => {
                const originalPrice = lot.originalPrice ?? lot.surface * 1377;
                const originalNotaryFees = lot.originalNotaryFees ?? originalPrice * 0.125;
                const originalConstructionCost = lot.originalConstructionCost ?? 0;

                const carryingCosts = calculateCarryingCosts(
                  originalPrice,
                  0,
                  Math.round(yearsHeld * 12),
                  formulaParams.averageInterestRate
                );

                const price = calculatePortageLotPrice(
                  originalPrice,
                  originalNotaryFees,
                  originalConstructionCost,
                  yearsHeld,
                  formulaParams,
                  carryingCosts,
                  0
                );

                return (
                  <div
                    key={lot.lotId}
                    className="bg-white border-2 border-orange-300 rounded-lg p-4"
                  >
                    <div className="mb-3">
                      <div className="text-sm">
                        De{' '}
                        <button
                          onClick={() => handleScrollToParticipant(lot.fromParticipant || '')}
                          className="font-bold text-orange-700 hover:text-orange-900 underline"
                        >
                          {lot.fromParticipant}
                        </button>
                        {' • '}
                        <span className="font-bold">{lot.surface}m²</span>
                      </div>
                      <div className="text-lg font-bold text-orange-900 mt-1">
                        Prix: {formatCurrency(price.totalPrice)}
                      </div>
                    </div>

                    {/* Breakdown Table */}
                    <div className="bg-orange-50 rounded border border-orange-200 overflow-hidden">
                      <table className="w-full text-xs">
                        <tbody>
                          <tr className="border-b border-orange-100">
                            <td className="px-3 py-1.5 text-gray-700">Base</td>
                            <td className="px-3 py-1.5 text-right font-semibold">
                              {formatCurrency(price.basePrice)}
                            </td>
                          </tr>
                          <tr className="border-b border-orange-100">
                            <td className="px-3 py-1.5 text-gray-700">
                              Indexation
                              <div className="text-[10px] text-gray-500">
                                ({formulaParams.indexationRate}% × {yearsHeld.toFixed(1)}a)
                              </div>
                            </td>
                            <td className="px-3 py-1.5 text-right font-semibold">
                              {formatCurrency(price.indexation)}
                            </td>
                          </tr>
                          <tr className="border-b border-orange-200">
                            <td className="px-3 py-1.5 text-gray-700">
                              Portage ({yearsHeld.toFixed(1)}a)
                            </td>
                            <td className="px-3 py-1.5 text-right font-semibold">
                              {formatCurrency(price.carryingCostRecovery)}
                            </td>
                          </tr>
                          <tr className="bg-orange-100">
                            <td className="px-3 py-1.5 font-bold text-orange-900">Total</td>
                            <td className="px-3 py-1.5 text-right font-bold text-orange-900">
                              {formatCurrency(price.totalPrice)}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Copropriété Lots (existing code, keep as-is) */}
      {coproLots.length > 0 && (
        <div className="bg-purple-50 rounded-lg border-2 border-purple-200 p-6">
          <h3 className="text-lg font-semibold text-purple-700 mb-3 flex items-center gap-2">
            <span>🏢</span>
            Lots Copropriété (Surface libre)
          </h3>
          {/* ... existing copro lot rendering ... */}
        </div>
      )}
    </div>
  );
}

function calculateYearsHeld(deedDate: Date): number {
  const now = new Date();
  const deed = new Date(deedDate);
  const diffMs = now.getTime() - deed.getTime();
  const diffYears = diffMs / (1000 * 60 * 60 * 24 * 365.25);
  return Math.max(0, diffYears);
}
```

**Step 4: Run test to verify it passes**

```bash
npm run test:run -- src/components/AvailableLotsView.test.tsx
```

Expected: PASS

**Step 5: Commit**

```bash
git add src/components/AvailableLotsView.tsx src/components/AvailableLotsView.test.tsx
git commit -m "feat: enhance AvailableLotsView with side-by-side formula/lots layout"
```

---

## Task 6: Integrate Components into Main Calculator

**Files:**
- Modify: `src/components/EnDivisionCorrect.tsx`
- Modify: `src/utils/storage.ts` (add portageFormula to state)

**Step 1: Update storage to include portageFormula**

Modify `src/utils/storage.ts` to add `portageFormula` field:

```typescript
import { DEFAULT_PORTAGE_FORMULA, type PortageFormulaParams } from './calculatorUtils';

// In the state interface, add:
portageFormula?: PortageFormulaParams;

// In loadProject function, add default:
portageFormula: savedData.portageFormula || DEFAULT_PORTAGE_FORMULA,

// In saveProject function, include portageFormula in saved data
```

**Step 2: Add portageFormula state to EnDivisionCorrect**

Add state and handler to `src/components/EnDivisionCorrect.tsx`:

```typescript
import { DEFAULT_PORTAGE_FORMULA, type PortageFormulaParams } from '../utils/calculatorUtils';
import PortageFormulaConfig from './PortageFormulaConfig';

// Add to component state (around line 50-60):
const [portageFormula, setPortageFormula] = useState<PortageFormulaParams>(DEFAULT_PORTAGE_FORMULA);

// Add update handler:
const handleUpdatePortageFormula = (params: PortageFormulaParams) => {
  setPortageFormula(params);
};
```

**Step 3: Pass formulaParams to PortageLotConfig**

Update `ParticipantDetailsPanel` props to include `formulaParams`:

```typescript
// In EnDivisionCorrect.tsx, when rendering ParticipantDetailsPanel:
<ParticipantDetailsPanel
  // ... existing props
  formulaParams={portageFormula}
  deedDate={deedDate}
/>
```

**Step 4: Render PortageFormulaConfig before marketplace**

Add to `src/components/EnDivisionCorrect.tsx` (after participants table, before results):

```typescript
{/* Portage Formula Configuration */}
<PortageFormulaConfig
  formulaParams={portageFormula}
  onUpdateParams={handleUpdatePortageFormula}
  deedDate={new Date(deedDate)}
/>

{/* Available Lots Marketplace */}
{(participants.some(p => p.isFounder && p.lotsOwned?.some(l => l.isPortage)) || coproLots.length > 0) && (
  <AvailableLotsView
    availableLots={getAvailableLotsForNewcomer(participants, coproLots, calculations)}
    deedDate={new Date(deedDate)}
    formulaParams={portageFormula}
  />
)}
```

**Step 5: Update storage save/load**

Ensure `portageFormula` is saved/loaded in `src/utils/storage.ts`.

**Step 6: Test integration**

```bash
npm run test:run
```

Expected: All tests PASS

**Step 7: Manual testing**

```bash
npm run dev
```

- Open app, expand portage formula config
- Adjust indexation rate, verify example updates
- Add portage lot to founder, verify breakdown table shows
- Check marketplace shows lot with clickable name
- Click name, verify scroll to participant panel
- Click "Voir dans la place de marché", verify scroll to marketplace

**Step 8: Commit**

```bash
git add src/components/EnDivisionCorrect.tsx src/utils/storage.ts
git commit -m "feat: integrate portage components into main calculator"
```

---

## Task 7: Add Participant ID Anchors for Navigation

**Files:**
- Modify: `src/components/calculator/ParticipantDetailsPanel.tsx`

**Step 1: Add id attribute to participant panel**

Modify `src/components/calculator/ParticipantDetailsPanel.tsx`:

```typescript
// In the root div, add id attribute:
<div
  id={`participant-${p.name}`}
  className="px-6 pb-6 border-t border-gray-200 pt-4 relative transition-all duration-200"
>
```

**Step 2: Test navigation**

Manual test:
1. Open app with multiple participants
2. Add portage lot to Alice
3. Scroll to marketplace
4. Click "De Alice" link
5. Verify smooth scroll to Alice's panel
6. Verify brief highlight (ring effect)

**Step 3: Commit**

```bash
git add src/components/calculator/ParticipantDetailsPanel.tsx
git commit -m "feat: add participant anchors for bidirectional navigation"
```

---

## Task 8: Update Tests and Documentation

**Files:**
- Modify: `src/components/EnDivisionCorrect.integration.test.tsx`
- Create: `docs/user-guides/portage-feature-guide.md`

**Step 1: Add integration test for portage workflow**

Add to `src/components/EnDivisionCorrect.integration.test.tsx`:

```typescript
describe('Portage feature integration', () => {
  it('should show portage formula config and marketplace when portage lots exist', async () => {
    const user = userEvent.setup();

    // ... setup with founder having portage lot

    render(<EnDivisionCorrect />);

    // Expand portage formula config
    const configButton = screen.getByText(/Configuration Formule de Portage/i);
    await user.click(configButton);

    // Verify formula parameters visible
    expect(screen.getByLabelText(/Taux d'indexation/i)).toBeInTheDocument();

    // Verify marketplace shows lot
    expect(screen.getByText(/Place de Marché/i)).toBeInTheDocument();

    // Verify breakdown tables present
    const breakdownTables = screen.getAllByText(/Base acquisition/i);
    expect(breakdownTables.length).toBeGreaterThan(0);
  });
});
```

**Step 2: Run integration tests**

```bash
npm run test:run -- src/components/EnDivisionCorrect.integration.test.tsx
```

Expected: PASS

**Step 3: Create user guide documentation**

Create `docs/user-guides/portage-feature-guide.md` with usage instructions (skip for brevity).

**Step 4: Commit**

```bash
git add src/components/EnDivisionCorrect.integration.test.tsx docs/user-guides/portage-feature-guide.md
git commit -m "docs: add portage feature integration tests and user guide"
```

---

## Task 9: Final Testing and Cleanup

**Step 1: Run full test suite**

```bash
npm run test:run
```

Expected: All tests PASS

**Step 2: Type check**

```bash
npx tsc --noEmit
```

Expected: No errors

**Step 3: Build production**

```bash
npm run build
```

Expected: Build succeeds

**Step 4: Manual smoke test**

```bash
npm run preview
```

Test checklist:
- [ ] Portage formula config expands/collapses
- [ ] Adjusting parameters updates example calculation
- [ ] Adding portage lot shows breakdown table
- [ ] Marketplace displays lots with correct pricing
- [ ] Clicking participant name scrolls and highlights
- [ ] Clicking marketplace link scrolls to marketplace
- [ ] Copro lots calculate price correctly with chosen surface
- [ ] All breakdown tables use consistent formatting

**Step 5: Final commit**

```bash
git add -A
git commit -m "feat: complete portage feature UX redesign implementation"
```

---

## Success Criteria

✅ **User Experience:**
- Founders understand pricing through transparent formulas
- Founders can adjust global parameters and see impact
- Buyers see clear breakdown of every lot price
- Visual connection via color and clickable names is clear
- Navigation is effortless (smooth scrolling, highlighting)

✅ **Technical:**
- All calculations use global formula parameters
- Prices update in real-time as parameters change
- Breakdown tables consistent across all components
- Anchor links work bidirectionally
- Small-scale UI optimized for 1-2 lots per founder
- All tests pass
- TypeScript compiles without errors
- Production build succeeds

---

## Future Enhancements (Out of Scope)

- Full formula editor (user-defined formulas)
- Transaction history and state management
- Multi-step wizard for completing portage sales
- Notification system for price changes over time
- Export portage pricing as PDF report
