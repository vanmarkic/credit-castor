# Portage Lot Specification Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Enable participants to specify portage lots in their card, and control how newcomers see and purchase lots (from founders' portage vs copropriété).

**Architecture:**
- Extend `Participant` interface with portage lot configuration
- Extend `Lot` interface to track whether lot is allocated for portage
- Update calculation logic to handle portage lot pricing with indexation and carrying costs
- Modify UI to allow founders to specify portage lot allocation

**Tech Stack:** TypeScript, React, Vitest, Astro

---

## Task 1: Extend Type Definitions for Portage Configuration

**Files:**
- Modify: `src/types/timeline.ts:19-34`

**Step 1: Write failing test for portage lot configuration**

Create test file: `src/types/portage-config.test.ts`

```typescript
import { describe, it, expect } from 'vitest';

describe('Portage Lot Configuration', () => {
  it('should allow participant to specify portage lot allocation', () => {
    const participant = {
      name: 'Founder A',
      isFounder: true,
      lotsOwned: [
        {
          lotId: 1,
          surface: 112,
          unitId: 1,
          isPortage: false,
          acquiredDate: new Date('2026-02-01')
        },
        {
          lotId: 2,
          surface: 50,
          unitId: 2,
          isPortage: true,
          allocatedSurface: 50,
          acquiredDate: new Date('2026-02-01')
        }
      ]
    };

    expect(participant.lotsOwned).toHaveLength(2);
    expect(participant.lotsOwned[1].isPortage).toBe(true);
    expect(participant.lotsOwned[1].allocatedSurface).toBe(50);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm run test:run src/types/portage-config.test.ts`
Expected: FAIL - allocatedSurface property does not exist on type Lot

**Step 3: Extend Lot interface with portage configuration**

In `src/types/timeline.ts:19-34`, add:

```typescript
export interface Lot {
  lotId: number;
  surface: number;
  unitId: number;
  isPortage: boolean;
  acquiredDate: Date;
  originalPrice?: number;
  originalNotaryFees?: number;
  monthlyCarryingCost?: number;

  // Portage lot configuration
  allocatedSurface?: number; // Surface allocated to portage (if isPortage=true)

  // Sale tracking
  soldDate?: Date;
  soldTo?: string;
  salePrice?: number;
  carryingCosts?: number;
}
```

**Step 4: Run test to verify it passes**

Run: `npm run test:run src/types/portage-config.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/types/timeline.ts src/types/portage-config.test.ts
git commit -m "feat: extend Lot interface with portage configuration

- Add allocatedSurface field to track portage lot surface area
- Add test for portage lot configuration on participant

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 2: Calculate Portage Lot Price with Indexation

**Files:**
- Modify: `src/utils/portageCalculations.ts:167-201`
- Test: `src/utils/portageCalculations.test.ts`

**Step 1: Write failing test for portage lot pricing from founder**

Add to `src/utils/portageCalculations.test.ts`:

```typescript
describe('calculatePortageLotPrice', () => {
  it('should calculate price for lot from founder with imposed surface', () => {
    // Founder allocated 50m² for portage at deed date
    // Original price: 50m² × 1377€/m² = 68,850€
    // Held for 2 years with 2% indexation
    // Carrying costs: calculated based on lot value and loan

    const carryingCosts: CarryingCosts = {
      monthlyInterest: 200,
      monthlyTax: 32.37,
      monthlyInsurance: 166.67,
      totalMonthly: 399.04,
      totalForPeriod: 9577 // 24 months
    };

    const result = calculatePortageLotPrice(
      68850,    // original price (50m² × 1377)
      8606.25,  // notary fees (12.5%)
      2,        // years held
      2,        // indexation rate
      carryingCosts,
      0         // no renovations
    );

    // Expected: base + indexation + carrying + fee recovery
    expect(result.basePrice).toBe(68850);
    expect(result.surfaceImposed).toBe(true);
    expect(result.totalPrice).toBeGreaterThan(68850);
  });

  it('should calculate price for lot from copropriété with free surface', () => {
    // Newcomer chooses 75m² from copropriété lot
    // Base calculation: 75m² × indexed price/m²
    // Plus portage costs proportional to surface ratio

    const result = calculatePortageLotPriceFromCopro(
      75,        // surface chosen by newcomer
      300,       // total copro lot surface
      412500,    // total copro lot original price
      2,         // years held
      2,         // indexation
      15000      // total carrying costs for whole copro lot
    );

    // Expected: proportional base + indexation + carrying
    const expectedBase = 412500 * (75 / 300); // 103,125
    expect(result.basePrice).toBeCloseTo(expectedBase, 0);
    expect(result.surfaceImposed).toBe(false);
    expect(result.totalPrice).toBeGreaterThan(expectedBase);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm run test:run src/utils/portageCalculations.test.ts`
Expected: FAIL - calculatePortageLotPrice is not defined

**Step 3: Implement calculatePortageLotPrice function**

Add to `src/utils/portageCalculations.ts` after `calculateResalePrice`:

```typescript
export interface PortageLotPrice {
  basePrice: number;
  surfaceImposed: boolean;
  indexation: number;
  carryingCostRecovery: number;
  feesRecovery: number;
  totalPrice: number;
  pricePerM2: number;
}

/**
 * Calculate price for portage lot from founder (surface imposed)
 */
export function calculatePortageLotPrice(
  originalPrice: number,
  originalNotaryFees: number,
  yearsHeld: number,
  indexationRate: number,
  carryingCosts: CarryingCosts,
  renovations: number = 0
): PortageLotPrice {
  const resale = calculateResalePrice(
    originalPrice,
    originalNotaryFees,
    yearsHeld,
    indexationRate,
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

/**
 * Calculate price for portage lot from copropriété (surface free)
 */
export function calculatePortageLotPriceFromCopro(
  surfaceChosen: number,
  totalCoproLotSurface: number,
  totalCoproLotOriginalPrice: number,
  yearsHeld: number,
  indexationRate: number,
  totalCarryingCosts: number
): PortageLotPrice {
  // Calculate proportional base price
  const surfaceRatio = surfaceChosen / totalCoproLotSurface;
  const basePrice = totalCoproLotOriginalPrice * surfaceRatio;

  // Calculate indexation
  const indexationMultiplier = Math.pow(1 + indexationRate / 100, yearsHeld);
  const indexation = basePrice * (indexationMultiplier - 1);

  // Proportional carrying costs
  const carryingCostRecovery = totalCarryingCosts * surfaceRatio;

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

**Step 4: Run test to verify it passes**

Run: `npm run test:run src/utils/portageCalculations.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/utils/portageCalculations.ts src/utils/portageCalculations.test.ts
git commit -m "feat: add portage lot pricing calculations

- Implement calculatePortageLotPrice for founder portage lots
- Implement calculatePortageLotPriceFromCopro for copro lots
- Support imposed surface (founders) vs free surface (copro)
- Apply indexation and carrying costs proportionally

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 3: Create Portage Lot Configuration Component

**Files:**
- Create: `src/components/PortageLotConfig.tsx`
- Test: Manual UI testing

**Step 1: Write the PortageLotConfig component**

Create `src/components/PortageLotConfig.tsx`:

```typescript
import React from 'react';
import type { Lot } from '../types/timeline';

interface PortageLotConfigProps {
  participantIndex: number;
  portageLots: Lot[];
  onAddLot: () => void;
  onRemoveLot: (lotId: number) => void;
  onUpdateSurface: (lotId: number, surface: number) => void;
}

export default function PortageLotConfig({
  participantIndex,
  portageLots,
  onAddLot,
  onRemoveLot,
  onUpdateSurface
}: PortageLotConfigProps) {
  return (
    <div className="mb-4 p-4 bg-orange-50 rounded-lg border border-orange-200">
      <div className="flex justify-between items-center mb-3">
        <p className="text-xs text-orange-700 uppercase tracking-wide font-semibold">
          Configuration Portage
        </p>
        <button
          onClick={onAddLot}
          className="text-xs bg-orange-600 hover:bg-orange-700 text-white px-3 py-1 rounded transition-colors"
        >
          + Ajouter lot portage
        </button>
      </div>

      {portageLots && portageLots.length > 0 ? (
        <div className="space-y-2">
          {portageLots.map((lot) => (
            <div key={lot.lotId} className="bg-white p-3 rounded border border-orange-300 flex items-center gap-3">
              <div className="flex-1">
                <label className="block text-xs text-gray-600 mb-1">
                  Surface lot portage (m²)
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
              <button
                onClick={() => onRemoveLot(lot.lotId)}
                className="text-red-600 hover:text-red-700 text-xs px-2 py-1 rounded border border-red-300 hover:bg-red-50"
              >
                Retirer
              </button>
            </div>
          ))}
          <p className="text-xs text-orange-600 mt-2">
            Ces lots seront vendus aux nouveaux arrivants avec indexation et frais de portage.
            La surface est imposée par le fondateur.
          </p>
        </div>
      ) : (
        <p className="text-xs text-gray-500 italic">
          Aucun lot en portage. Les nouveaux arrivants verront uniquement les lots de la copropriété.
        </p>
      )}
    </div>
  );
}
```

**Step 2: Test component rendering**

Create test file `src/components/PortageLotConfig.test.tsx`:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import PortageLotConfig from './PortageLotConfig';

describe('PortageLotConfig', () => {
  it('should render empty state when no portage lots', () => {
    const { container } = render(
      <PortageLotConfig
        participantIndex={0}
        portageLots={[]}
        onAddLot={vi.fn()}
        onRemoveLot={vi.fn()}
        onUpdateSurface={vi.fn()}
      />
    );

    expect(screen.getByText(/Aucun lot en portage/i)).toBeInTheDocument();
  });

  it('should call onAddLot when add button clicked', () => {
    const onAddLot = vi.fn();

    render(
      <PortageLotConfig
        participantIndex={0}
        portageLots={[]}
        onAddLot={onAddLot}
        onRemoveLot={vi.fn()}
        onUpdateSurface={vi.fn()}
      />
    );

    const addButton = screen.getByText(/Ajouter lot portage/i);
    fireEvent.click(addButton);

    expect(onAddLot).toHaveBeenCalledTimes(1);
  });

  it('should render portage lots with surface input', () => {
    const lots = [
      {
        lotId: 1,
        surface: 50,
        unitId: 1,
        isPortage: true,
        allocatedSurface: 50,
        acquiredDate: new Date('2026-02-01')
      }
    ];

    render(
      <PortageLotConfig
        participantIndex={0}
        portageLots={lots}
        onAddLot={vi.fn()}
        onRemoveLot={vi.fn()}
        onUpdateSurface={vi.fn()}
      />
    );

    const input = screen.getByDisplayValue('50');
    expect(input).toBeInTheDocument();
  });
});
```

**Step 3: Run component tests**

Run: `npm run test:run src/components/PortageLotConfig.test.tsx`
Expected: 3 tests PASS

**Step 4: Commit**

```bash
git add src/components/PortageLotConfig.tsx src/components/PortageLotConfig.test.tsx
git commit -m "feat: create PortageLotConfig component

- Extract portage lot UI into separate component
- Add prop interface for lot management callbacks
- Render empty state and portage lot list
- Add component tests for rendering and interactions

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 4: Update Participant Data Structure to Include Portage Lots

**Files:**
- Modify: `src/components/EnDivisionCorrect.tsx:10-15` (DEFAULT_PARTICIPANTS)
- Modify: `src/components/EnDivisionCorrect.tsx:115-118` (useState initialization)

**Step 1: Write test for participant with portage lots**

Add to `src/types/portage-config.test.ts`:

```typescript
it('should serialize participant with portage lots to localStorage', () => {
  const participant = {
    name: 'Founder A',
    capitalApporte: 50000,
    isFounder: true,
    lotsOwned: [
      {
        lotId: 1,
        surface: 112,
        unitId: 1,
        isPortage: false,
        acquiredDate: new Date('2026-02-01')
      },
      {
        lotId: 2,
        surface: 50,
        unitId: 2,
        isPortage: true,
        allocatedSurface: 50,
        acquiredDate: new Date('2026-02-01')
      }
    ]
  };

  const serialized = JSON.stringify(participant);
  const deserialized = JSON.parse(serialized);

  expect(deserialized.lotsOwned).toHaveLength(2);
  expect(deserialized.lotsOwned[1].isPortage).toBe(true);
});
```

**Step 2: Run test to verify it passes**

Run: `npm run test:run src/types/portage-config.test.ts`
Expected: PASS (this is a validation test)

**Step 3: Update participant state to sync portage lots**

In `EnDivisionCorrect.tsx`, modify the `addPortageLot` function:

```typescript
const addPortageLot = (participantIndex: number) => {
  const newLotId = Math.max(
    ...participants.flatMap((p: any) => p.lotsOwned?.map((l: any) => l.lotId) || []),
    0
  ) + 1;

  // Update participant lotsOwned array
  const newParticipants = [...participants];
  if (!newParticipants[participantIndex].lotsOwned) {
    newParticipants[participantIndex].lotsOwned = [];
  }

  newParticipants[participantIndex].lotsOwned.push({
    lotId: newLotId,
    surface: 0,
    unitId: newParticipants[participantIndex].unitId || 0,
    isPortage: true,
    allocatedSurface: 0,
    acquiredDate: new Date(deedDate)
  });

  setParticipants(newParticipants);
};

const removePortageLot = (participantIndex: number, lotId: number) => {
  const newParticipants = [...participants];
  if (newParticipants[participantIndex].lotsOwned) {
    newParticipants[participantIndex].lotsOwned =
      newParticipants[participantIndex].lotsOwned.filter((l: any) => l.lotId !== lotId);
  }
  setParticipants(newParticipants);
};

const updatePortageLotSurface = (participantIndex: number, lotId: number, surface: number) => {
  const newParticipants = [...participants];
  if (newParticipants[participantIndex].lotsOwned) {
    const lot = newParticipants[participantIndex].lotsOwned.find((l: any) => l.lotId === lotId);
    if (lot) {
      lot.surface = surface;
      lot.allocatedSurface = surface;
    }
  }
  setParticipants(newParticipants);
};
```

**Step 4: Test localStorage persistence**

Run: `npm run dev`
Actions:
1. Add a portage lot
2. Refresh the page
3. Verify the portage lot persists

**Step 5: Commit**

```bash
git add src/components/EnDivisionCorrect.tsx src/types/portage-config.test.ts
git commit -m "feat: sync portage lots with participant state

- Update participant lotsOwned array when adding/removing portage lots
- Persist portage lots through localStorage
- Set isPortage flag and allocatedSurface correctly
- Add validation test for localStorage serialization

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 5: Display Available Lots for Newcomers

**Files:**
- Create: `src/utils/availableLots.ts`
- Test: `src/utils/availableLots.test.ts`

**Step 1: Write failing test for available lots logic**

Create `src/utils/availableLots.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { getAvailableLotsForNewcomer } from './availableLots';

describe('getAvailableLotsForNewcomer', () => {
  it('should return portage lots from founders with imposed surface', () => {
    const participants = [
      {
        name: 'Founder A',
        isFounder: true,
        lotsOwned: [
          { lotId: 1, surface: 112, isPortage: false, allocatedSurface: undefined },
          { lotId: 2, surface: 50, isPortage: true, allocatedSurface: 50 }
        ]
      }
    ];

    const coproLots = [];

    const result = getAvailableLotsForNewcomer(participants, coproLots);

    expect(result).toHaveLength(1);
    expect(result[0].lotId).toBe(2);
    expect(result[0].source).toBe('FOUNDER');
    expect(result[0].surfaceImposed).toBe(true);
    expect(result[0].surface).toBe(50);
  });

  it('should return copro lots with free surface', () => {
    const participants = [];
    const coproLots = [
      { lotId: 10, surface: 300, acquiredDate: new Date() }
    ];

    const result = getAvailableLotsForNewcomer(participants, coproLots);

    expect(result).toHaveLength(1);
    expect(result[0].lotId).toBe(10);
    expect(result[0].source).toBe('COPRO');
    expect(result[0].surfaceImposed).toBe(false);
    expect(result[0].surface).toBe(300);
  });

  it('should combine portage lots and copro lots', () => {
    const participants = [
      {
        name: 'Founder A',
        isFounder: true,
        lotsOwned: [
          { lotId: 2, surface: 50, isPortage: true, allocatedSurface: 50 }
        ]
      }
    ];

    const coproLots = [
      { lotId: 10, surface: 300, acquiredDate: new Date() }
    ];

    const result = getAvailableLotsForNewcomer(participants, coproLots);

    expect(result).toHaveLength(2);
    expect(result.find(l => l.source === 'FOUNDER')).toBeDefined();
    expect(result.find(l => l.source === 'COPRO')).toBeDefined();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm run test:run src/utils/availableLots.test.ts`
Expected: FAIL - getAvailableLotsForNewcomer is not defined

**Step 3: Implement available lots logic**

Create `src/utils/availableLots.ts`:

```typescript
import type { Participant } from './calculatorUtils';
import type { CoproLot } from '../types/timeline';

export interface AvailableLot {
  lotId: number;
  surface: number;
  source: 'FOUNDER' | 'COPRO';
  surfaceImposed: boolean;
  fromParticipant?: string; // If source = FOUNDER
  totalCoproSurface?: number; // If source = COPRO (for ratio calculation)
}

/**
 * Get all lots available for a newcomer to purchase
 *
 * Rules:
 * - Founders' portage lots (isPortage = true) with imposed surface
 * - Copropriété lots with free surface choice
 */
export function getAvailableLotsForNewcomer(
  participants: Participant[],
  coproLots: CoproLot[]
): AvailableLot[] {
  const available: AvailableLot[] = [];

  // Add portage lots from founders
  for (const participant of participants) {
    if (participant.isFounder && participant.lotsOwned) {
      for (const lot of participant.lotsOwned) {
        if (lot.isPortage && !lot.soldDate) {
          available.push({
            lotId: lot.lotId,
            surface: lot.allocatedSurface || lot.surface,
            source: 'FOUNDER',
            surfaceImposed: true,
            fromParticipant: participant.name
          });
        }
      }
    }
  }

  // Add copro lots
  for (const coproLot of coproLots) {
    if (!coproLot.soldDate) {
      available.push({
        lotId: coproLot.lotId,
        surface: coproLot.surface,
        source: 'COPRO',
        surfaceImposed: false,
        totalCoproSurface: coproLot.surface
      });
    }
  }

  return available;
}
```

**Step 4: Run test to verify it passes**

Run: `npm run test:run src/utils/availableLots.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/utils/availableLots.ts src/utils/availableLots.test.ts
git commit -m "feat: implement available lots logic for newcomers

- Create getAvailableLotsForNewcomer function
- Return portage lots from founders (imposed surface)
- Return copro lots (free surface)
- Mark source and surface constraints clearly

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 6: Integration Test - End-to-End Portage Scenario

**Files:**
- Create: `src/integration/portage-workflow.test.ts`

**Step 1: Write integration test for complete portage workflow**

```typescript
import { describe, it, expect } from 'vitest';
import { calculatePortageLotPrice, calculatePortageLotPriceFromCopro, calculateCarryingCosts } from '../utils/portageCalculations';
import { getAvailableLotsForNewcomer } from '../utils/availableLots';
import type { Participant } from '../utils/calculatorUtils';
import type { CoproLot } from '../types/timeline';

describe('Portage Workflow Integration', () => {
  it('should handle complete portage scenario', () => {
    // Setup: 2 founders at T0
    const participants: Participant[] = [
      {
        name: 'Founder A',
        capitalApporte: 50000,
        notaryFeesRate: 12.5,
        interestRate: 4.5,
        durationYears: 25,
        isFounder: true,
        lotsOwned: [
          {
            lotId: 1,
            surface: 112,
            unitId: 1,
            isPortage: false,
            acquiredDate: new Date('2026-02-01'),
            originalPrice: 154224,
            originalNotaryFees: 19278
          },
          {
            lotId: 2,
            surface: 50,
            unitId: 2,
            isPortage: true,
            allocatedSurface: 50,
            acquiredDate: new Date('2026-02-01'),
            originalPrice: 68850,
            originalNotaryFees: 8606.25
          }
        ]
      }
    ];

    const coproLots: CoproLot[] = [
      {
        lotId: 10,
        surface: 300,
        acquiredDate: new Date('2026-02-01')
      }
    ];

    // T+2 years: Newcomer arrives
    const availableLots = getAvailableLotsForNewcomer(participants, coproLots);

    expect(availableLots).toHaveLength(2); // 1 founder portage + 1 copro

    // Check founder portage lot (imposed 50m²)
    const founderLot = availableLots.find(l => l.source === 'FOUNDER');
    expect(founderLot).toBeDefined();
    expect(founderLot!.surfaceImposed).toBe(true);
    expect(founderLot!.surface).toBe(50);

    // Calculate price for founder portage lot
    const carryingCosts = calculateCarryingCosts(68850, 0, 24, 4.5);
    const founderPrice = calculatePortageLotPrice(
      68850,
      8606.25,
      2,
      2,
      carryingCosts,
      0
    );

    expect(founderPrice.surfaceImposed).toBe(true);
    expect(founderPrice.totalPrice).toBeGreaterThan(68850); // Base + indexation + carrying

    // Check copro lot (free surface)
    const coproLot = availableLots.find(l => l.source === 'COPRO');
    expect(coproLot).toBeDefined();
    expect(coproLot!.surfaceImposed).toBe(false);

    // Calculate price for 75m² from copro lot
    const coproPrice = calculatePortageLotPriceFromCopro(
      75,
      300,
      412500,
      2,
      2,
      15000
    );

    expect(coproPrice.surfaceImposed).toBe(false);
    expect(coproPrice.pricePerM2).toBeGreaterThan(0);
  });
});
```

**Step 2: Run integration test**

Run: `npm run test:run src/integration/portage-workflow.test.ts`
Expected: PASS

**Step 3: Commit**

```bash
git add src/integration/portage-workflow.test.ts
git commit -m "test: add end-to-end portage workflow integration test

- Test complete scenario with founders and copro lots
- Verify available lots logic
- Verify pricing for both imposed and free surface
- Validate 2-year holding period with indexation

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 7: Update Documentation

**Files:**
- Create: `docs/development/portage-lot-specification.md`

**Step 1: Create documentation**

```markdown
# Portage Lot Specification Feature

## Overview

Enables participants (founders) to allocate specific lots for portage, controlling how newcomers purchase lots with different surface and pricing rules.

## User Stories

1. **Founder allocates portage lot**
   - As a founder, I can specify that an additional lot is for portage
   - I set the surface area (e.g., 50m²)
   - Surface is imposed - newcomer cannot change it

2. **Newcomer views available lots**
   - From founders: See portage lots with imposed surface and calculated price
   - From copropriété: See lots with free surface choice

3. **Pricing calculation**
   - Founder portage: Base price + indexation + carrying costs + fee recovery (if <2 years)
   - Copro lot: Proportional base + indexation + proportional carrying costs

## Technical Implementation

### Data Model

- `Lot.isPortage: boolean` - Marks lot as portage
- `Lot.allocatedSurface?: number` - Surface allocated for portage
- `AvailableLot.surfaceImposed: boolean` - Indicates if surface can be changed

### Calculations

- `calculatePortageLotPrice()` - For founder portage (imposed surface)
- `calculatePortageLotPriceFromCopro()` - For copro lots (free surface)
- Both apply 2% indexation and carrying cost recovery

### UI Components

- Portage lot configuration in participant expandable section
- Add/remove portage lots
- Surface specification input

## Testing

- Unit tests: `portageCalculations.test.ts`
- Type tests: `portage-config.test.ts`
- Integration: `portage-workflow.test.ts`
- Available lots: `availableLots.test.ts`

## Migration Notes

- Existing participants without `lotsOwned` continue using legacy fields
- New portage lots use `lotsOwned` array
- Both systems coexist during transition
```

**Step 2: Commit documentation**

```bash
git add docs/development/portage-lot-specification.md
git commit -m "docs: add portage lot specification feature documentation

- Document user stories and use cases
- Explain data model and calculations
- List testing approach
- Note migration strategy

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Execution Handoff

Plan complete and saved to `docs/plans/2025-11-03-portage-lot-specification.md`. Two execution options:

**1. Subagent-Driven (this session)** - I dispatch fresh subagent per task, review between tasks, fast iteration

**2. Parallel Session (separate)** - Open new session with executing-plans, batch execution with checkpoints

**Which approach?**
