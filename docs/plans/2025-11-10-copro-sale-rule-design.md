# Copropriété Sale Rule Design

**Date**: 2025-11-10
**Status**: Design
**Feature**: New buyer purchases from copropriété with 30/70 distribution

## Overview

When a new buyer purchases a lot from the copropriété (not from an individual founder), the pricing formula follows the same structure as portage sales from founders, but the payment distribution differs: 30% goes to copropriété reserves, and 70% is distributed as cash to all current participants based on their frozen T0 quotité.

## Business Rules

### Pricing Formula

Same formula structure as portage from founder:

```
Total Price = Base Price + Indexation + Carrying Cost Recovery
```

**Components**:
- **Base Price** = (Total Project Costs / Total Building Surface) × Surface Purchased
  - Uses proportional project cost (not individual lot acquisition cost)
  - Total Project Costs = sum of all purchase + notary + construction costs at T0
- **Indexation** = Compound growth on base price using `formulaParams.indexationRate`
- **Carrying Cost Recovery** = Accumulated carrying costs × `formulaParams.carryingCostRecovery` percentage

### Payment Distribution

When buyer pays the copropriété:
- **30% → Copropriété reserves** (Type C: Reinvestment, tracked as collective capital)
- **70% → Current participants** (Type A: Cash redistribution, immediate payment)

### Quotité Calculation

Uses **frozen quotité** from T0 (initial founder acquisition):
- Formula: `participant.surface / totalBuildingSurface`
- Does NOT recalculate as participants join/leave
- Only original founders receive distributions
- Same quotité used for all copropriété sales

### Key Differences from Portage Sale

| Aspect | Portage Sale | Copropriété Sale |
|--------|--------------|------------------|
| Seller | Individual founder | Copropriété entity |
| Beneficiaries | Single founder | All founders (multiple) |
| Distribution | 100% to seller | 30% reserves + 70% distributed |
| Surface | Imposed (must buy entire lot) | Free choice (buyer selects) |
| Base Price | Founder's acquisition cost | Proportional project cost |

## Data Model Changes

### New Event Type

**File**: `src/types/timeline.ts`

```typescript
export interface CoproSaleEvent extends BaseEvent {
  type: 'COPRO_SALE';
  buyer: Participant;
  lotId: number;
  surfacePurchased: number; // Buyer chooses surface (free choice)
  salePrice: number;
  breakdown: {
    basePrice: number;
    indexation: number;
    carryingCostRecovery: number;
  };
  distribution: {
    toCoproReserves: number; // 30%
    toParticipants: { // 70% split by quotité
      [participantName: string]: {
        quotite: number;
        amount: number;
      };
    };
  };
  notaryFees: number;
  financing: {
    capitalApporte: number;
    loanAmount: number;
    interestRate: number;
    durationYears: number;
  };
}
```

Add to union type:
```typescript
export type DomainEvent =
  | InitialPurchaseEvent
  | NewcomerJoinsEvent
  | HiddenLotRevealedEvent
  | PortageSettlementEvent
  | CoproTakesLoanEvent
  | ParticipantExitsEvent
  | CoproSaleEvent; // NEW
```

### State Machine Updates

**File**: `src/stateMachine/creditCastorMachine.ts`

**Update CurrentSale interface** (lines 10-23):
```typescript
interface CurrentSale {
  lotId: string;
  sellerId: string;
  buyerId: string;
  proposedPrice: number;
  saleDate: Date;
  saleType: 'portage' | 'copro' | 'classic';
  surfacePurchased?: number; // NEW: For copro sales (free choice)
  buyerApproval?: {
    candidateId: string;
    interviewDate: Date;
    approved: boolean;
    notes: string;
  };
}
```

**Update ExtendedContext** (lines 25-30):
```typescript
interface ExtendedContext extends ProjectContext {
  currentSale?: CurrentSale;
  firstSaleDate?: Date;
  currentACPLoanId?: string;
  copro: CoproEntity; // NEW: Track copropriété state
}
```

### CoproPricing Type Update

**File**: `src/stateMachine/types.ts`

```typescript
export interface CoproPricing {
  // DEPRECATED fields (keep for backward compatibility)
  baseCostPerSqm: number;
  gen1CompensationPerSqm: number;

  // Current fields
  pricePerSqm: number;
  surface: number;
  totalPrice: number;

  // NEW: Detailed breakdown
  breakdown: {
    basePrice: number;
    indexation: number;
    carryingCostRecovery: number;
  };

  // NEW: Distribution tracking
  distribution: {
    toCoproReserves: number;
    toParticipants: Map<string, number>;
  };
}
```

## Calculation Functions

**File**: `src/utils/portageCalculations.ts`

### New Interface

```typescript
export interface CoproSalePrice {
  basePrice: number;
  indexation: number;
  carryingCostRecovery: number;
  totalPrice: number;
  pricePerM2: number;
  distribution: {
    toCoproReserves: number; // 30%
    toParticipants: number;  // 70%
  };
}
```

### Calculate Copro Sale Price

```typescript
/**
 * Calculate price when buyer purchases from copropriété
 * Uses proportional project cost as base (not individual acquisition)
 *
 * Formula matches portage pricing structure:
 * Total Price = Base Price + Indexation + Carrying Cost Recovery
 *
 * Distribution: 30% to copro reserves, 70% to participants
 *
 * @param surfacePurchased - Surface buyer is purchasing (m²)
 * @param totalProjectCost - Sum of all initial costs (purchase + notary + construction)
 * @param totalBuildingSurface - Total building surface (denominator)
 * @param yearsHeld - Years copropriété held the lot
 * @param formulaParams - Global formula parameters (indexation rate, carrying cost recovery %)
 * @param totalCarryingCosts - Total carrying costs accumulated by copro
 * @returns Price breakdown with 30/70 distribution
 */
export function calculateCoproSalePrice(
  surfacePurchased: number,
  totalProjectCost: number,
  totalBuildingSurface: number,
  yearsHeld: number,
  formulaParams: PortageFormulaParams,
  totalCarryingCosts: number
): CoproSalePrice {
  // Validate inputs
  if (totalBuildingSurface <= 0) {
    throw new Error('Total building surface must be greater than zero');
  }
  if (surfacePurchased <= 0 || surfacePurchased > totalBuildingSurface) {
    throw new Error('Invalid surface purchased');
  }

  // Base price = proportional share of total project costs
  const basePrice = (totalProjectCost / totalBuildingSurface) * surfacePurchased;

  // Indexation on base price (compound growth)
  const indexation = calculateIndexation(basePrice, formulaParams.indexationRate, yearsHeld);

  // Proportional carrying costs with recovery percentage
  const surfaceRatio = surfacePurchased / totalBuildingSurface;
  const carryingCostRecovery = totalCarryingCosts * surfaceRatio * (formulaParams.carryingCostRecovery / 100);

  // Total price
  const totalPrice = basePrice + indexation + carryingCostRecovery;

  // Distribution: 30% copro reserves, 70% to participants
  const toCoproReserves = totalPrice * 0.30;
  const toParticipants = totalPrice * 0.70;

  return {
    basePrice,
    indexation,
    carryingCostRecovery,
    totalPrice,
    pricePerM2: totalPrice / surfacePurchased,
    distribution: {
      toCoproReserves,
      toParticipants
    }
  };
}
```

### Distribute Copro Proceeds

```typescript
/**
 * Distribute copro sale proceeds to participants based on frozen T0 quotité
 *
 * Uses quotité from initial founder acquisition (frozen, never recalculated).
 * Only founders receive distributions (not newcomers).
 *
 * @param totalAmount - Amount to distribute (70% of sale price)
 * @param founders - Original participants from T0 with their surfaces
 * @param totalBuildingSurface - Total building surface (frozen at T0)
 * @returns Map of participant name → cash amount
 */
export function distributeCoproProceeds(
  totalAmount: number,
  founders: ParticipantSurface[],
  totalBuildingSurface: number
): Map<string, number> {
  if (totalBuildingSurface <= 0) {
    throw new Error('Total building surface must be greater than zero');
  }

  const distribution = new Map<string, number>();

  founders.forEach(founder => {
    const quotite = founder.surface / totalBuildingSurface;
    const amount = totalAmount * quotite;
    distribution.set(founder.name, amount);
  });

  return distribution;
}
```

## State Machine Integration

**File**: `src/stateMachine/creditCastorMachine.ts`

### Update `recordCompletedSale` Action

Modify the action at lines 197-286 to handle copro sales:

```typescript
recordCompletedSale: assign({
  salesHistory: ({ context }) => {
    if (!context.currentSale) return context.salesHistory;

    const { currentSale } = context;
    const lot = context.lots.find(l => l.id === currentSale.lotId);
    if (!lot) return context.salesHistory;

    let sale: any;

    if (currentSale.saleType === 'portage') {
      // ... existing portage logic (lines 208-238)

    } else if (currentSale.saleType === 'copro') {
      // NEW: Calculate copro sale pricing with distribution

      // Get total project cost from context
      const totalProjectCost = context.projectFinancials.totalPurchasePrice;
      const totalBuildingSurface = context.lots.reduce((sum, l) => sum + l.surface, 0);

      // Calculate years held from acte transcription date (T0)
      const yearsHeld = calculateYearsHeld(
        context.acteTranscriptionDate || new Date(),
        currentSale.saleDate
      );

      // Get total carrying costs (simplified for MVP)
      const totalCarryingCosts = context.copro.monthlyObligations.totalMonthly * yearsHeld * 12;

      // Calculate price using new formula
      const pricing = calculateCoproSalePrice(
        currentSale.surfacePurchased!,
        totalProjectCost,
        totalBuildingSurface,
        yearsHeld,
        context.projectFinancials.formulaParams,
        totalCarryingCosts
      );

      // Distribute 70% to founders based on T0 quotité
      const founders = context.participants
        .filter(p => p.isFounder)
        .map(p => ({ name: p.name, surface: p.surface }));

      const participantDistribution = distributeCoproProceeds(
        pricing.distribution.toParticipants,
        founders,
        totalBuildingSurface
      );

      sale = {
        type: 'copro',
        lotId: currentSale.lotId,
        buyer: currentSale.buyerId,
        saleDate: currentSale.saleDate,
        surfacePurchased: currentSale.surfacePurchased,
        pricing: {
          basePrice: pricing.basePrice,
          indexation: pricing.indexation,
          carryingCostRecovery: pricing.carryingCostRecovery,
          totalPrice: pricing.totalPrice,
          pricePerM2: pricing.pricePerM2,
          breakdown: {
            basePrice: pricing.basePrice,
            indexation: pricing.indexation,
            carryingCostRecovery: pricing.carryingCostRecovery,
          },
          distribution: {
            toCoproReserves: pricing.distribution.toCoproReserves,
            toParticipants: participantDistribution
          }
        }
      };

    } else {
      // ... existing classic sale logic (lines 262-281)
    }

    return [...context.salesHistory, sale];
  },

  // NEW: Update copro cash reserves (30% goes here)
  copro: ({ context }) => {
    if (!context.currentSale || context.currentSale.saleType !== 'copro') {
      return context.copro;
    }

    const sale = context.salesHistory[context.salesHistory.length - 1];
    if (sale.type !== 'copro') return context.copro;

    return {
      ...context.copro,
      cashReserve: context.copro.cashReserve + sale.pricing.distribution.toCoproReserves
    };
  },

  currentSale: undefined
})
```

## Timeline Integration

**File**: `src/utils/calculatorToTimeline.ts`

### Timeline Transaction Type Update

```typescript
export interface TimelineTransaction {
  type: 'portage_sale' | 'copro_sale' | 'founder_entry';

  // Common fields
  buyer?: string;
  date: Date;

  // Portage-specific fields
  seller?: string;
  lotPrice?: number;
  indexation?: number;
  carryingCosts?: number;
  registrationFees?: number;

  // NEW: Copro sale-specific fields
  surfacePurchased?: number;
  distributionToCopro?: number;
  distributionToParticipants?: Map<string, number>;

  // Delta (impact on buyer)
  delta: {
    totalCost: number;
    loanNeeded: number;
    reason: string;
  };
}
```

### Timeline Rendering

For each `CoproSaleEvent`, create multiple timeline entries showing:

1. **Buyer perspective**: Purchase transaction (cost out)
2. **Each founder perspective**: Cash distribution received (cash in)
3. **Copropriété perspective**: Reserve increase

**Example Timeline Output**:

```
[2025-03-15] Alice purchases 50m² from copropriété
  Cost: €75,000 (base: €50,000 + indexation: €15,000 + carrying: €10,000)
  Financing: €60,000 loan, €15,000 capital

[2025-03-15] Distribution to founders (€52,500 total)
  Bob receives: €21,000 (quotité: 40%)
  Carol receives: €15,750 (quotité: 30%)
  Dave receives: €15,750 (quotité: 30%)

[2025-03-15] Copropriété reserves increase
  Amount: €22,500 (30% of sale)
```

**Implementation Pattern**: Similar to portage sales, but with multiple beneficiary entries.

## Excel/JSON Export Updates

### Excel Export Structure

**File**: `src/utils/excelExport.ts`

Add new sheet or section: **"Copropriété Sales History"**

**Columns**:
- Date
- Buyer Name
- Surface Purchased (m²)
- Base Price (€)
- Indexation (€)
- Carrying Cost Recovery (€)
- **Total Price (€)**
- To Copro Reserves (€) - 30%
- To Founders Total (€) - 70%
- [Expandable] Individual Founder Distributions

**Detail Rows** (for each founder):
- Founder Name
- Quotité (%)
- Amount Received (€)

### JSON Schema

**File**: localStorage/file format

```typescript
interface StoredCoproSale {
  type: 'copro';
  lotId: number;
  buyer: string;
  saleDate: string; // ISO date
  surfacePurchased: number;
  pricing: {
    basePrice: number;
    indexation: number;
    carryingCostRecovery: number;
    totalPrice: number;
    pricePerM2: number;
    breakdown: {
      basePrice: number;
      indexation: number;
      carryingCostRecovery: number;
    };
    distribution: {
      toCoproReserves: number;
      toParticipants: {
        [participantName: string]: number;
      };
    };
  };
  notaryFees?: number;
}
```

### Data Migration

**Backward Compatibility**:
- Existing copro sales use old `CoproPricing` format with `gen1CompensationPerSqm`
- New copro sales use enhanced format with `breakdown` and `distribution`
- Detection: Check for presence of `breakdown` field
- Migration function: Convert old format to new format on data load

```typescript
function migrateCoproSale(oldSale: any): StoredCoproSale {
  if (oldSale.pricing.breakdown) {
    return oldSale; // Already migrated
  }

  // Convert old format to new
  return {
    ...oldSale,
    pricing: {
      ...oldSale.pricing,
      breakdown: {
        basePrice: oldSale.pricing.baseCostPerSqm * oldSale.pricing.surface,
        indexation: oldSale.pricing.gen1CompensationPerSqm * oldSale.pricing.surface,
        carryingCostRecovery: 0, // Not tracked in old format
      },
      distribution: {
        toCoproReserves: 0,
        toParticipants: {} // Not tracked in old format
      }
    }
  };
}
```

## Testing Strategy

### Unit Tests

**File**: `src/utils/portageCalculations.test.ts`

```typescript
describe('calculateCoproSalePrice', () => {
  it('should calculate price using proportional project cost', () => {
    // Test base price calculation
  });

  it('should apply indexation correctly', () => {
    // Test compound growth
  });

  it('should calculate carrying cost recovery', () => {
    // Test recovery percentage application
  });

  it('should distribute 30/70 correctly', () => {
    // Test distribution split
  });

  it('should match portage formula structure', () => {
    // Verify formula consistency
  });

  it('should handle edge cases', () => {
    // Zero carrying costs
    // Minimum surface
    // Maximum surface
  });
});

describe('distributeCoproProceeds', () => {
  it('should distribute by frozen T0 quotité', () => {
    // Test quotité calculation
  });

  it('should handle single founder', () => {
    // 100% to one founder
  });

  it('should handle equal quotités', () => {
    // Multiple founders, equal shares
  });

  it('should handle unequal quotités', () => {
    // Verify proportional distribution
  });

  it('should sum to total amount', () => {
    // No rounding errors
  });
});
```

### Integration Tests

**File**: `src/stateMachine/creditCastorMachine.test.ts`

```typescript
describe('Copro Sale Flow', () => {
  it('should complete copro sale and distribute proceeds', () => {
    // Initiate sale
    // Complete sale
    // Verify salesHistory updated
    // Verify copro reserves increased by 30%
    // Verify founders received 70% split by quotité
  });

  it('should update buyer's lot ownership', () => {
    // Verify buyer receives lot
    // Verify surface tracked correctly
  });

  it('should handle multiple consecutive copro sales', () => {
    // Sale 1
    // Sale 2
    // Verify cumulative distributions
  });
});
```

### Timeline Tests

**File**: `src/types/timeline.test.ts`

```typescript
describe('CoproSaleEvent Timeline Projection', () => {
  it('should create timeline entries for all parties', () => {
    // Buyer entry
    // Each founder entry
    // Copro reserve entry
  });

  it('should calculate deltas correctly', () => {
    // Buyer's cost
    // Each founder's cash in
    // Copro reserve increase
  });

  it('should maintain chronological order', () => {
    // All entries have same date
    // Proper ordering in timeline
  });
});
```

### Export Tests

**File**: `src/utils/excelExport.test.ts`

```typescript
describe('Copro Sale Excel Export', () => {
  it('should export copro sale with distribution breakdown', () => {
    // Verify all columns present
    // Verify distribution details
  });

  it('should match calculation results', () => {
    // Numbers consistent with calculation
  });

  it('should handle multiple copro sales', () => {
    // Multiple rows in export
  });
});
```

## Implementation Phases

### Phase 1: Core Calculations
1. Add `calculateCoproSalePrice()` function
2. Add `distributeCoproProceeds()` function
3. Write unit tests
4. Verify formula matches portage structure

### Phase 2: State Machine Integration
1. Update `CurrentSale` interface
2. Update `ExtendedContext` with `copro` field
3. Modify `recordCompletedSale` action
4. Add copro reserve update logic
5. Write integration tests

### Phase 3: Timeline Integration
1. Add `CoproSaleEvent` type
2. Update timeline projection logic
3. Create multi-beneficiary timeline entries
4. Write timeline tests

### Phase 4: Export & Persistence
1. Update Excel export with copro sale sheet
2. Update JSON schema
3. Add data migration for backward compatibility
4. Write export tests

### Phase 5: UI Integration (Future)
1. Add copro sale initiation UI
2. Add surface selection input
3. Display distribution preview
4. Show individual founder receipts

## Acceptance Criteria

- [ ] Copro sale pricing matches portage formula structure (base + indexation + carrying)
- [ ] Base price uses proportional project cost (not individual acquisition)
- [ ] 30% goes to copropriété reserves
- [ ] 70% distributes to founders by frozen T0 quotité
- [ ] Timeline shows buyer purchase + multiple founder receipts + copro reserve increase
- [ ] Excel export includes copro sales with distribution breakdown
- [ ] JSON persistence supports new format with backward compatibility
- [ ] All tests pass (unit, integration, timeline, export)
- [ ] Data migration handles old copro sale format

## Open Questions

None - all clarified during design phase.

## References

- Portage calculations: `src/utils/portageCalculations.ts`
- State machine: `src/stateMachine/creditCastorMachine.ts`
- Timeline types: `src/types/timeline.ts`
- Existing redistribution logic: `calculateRedistribution()` in portageCalculations.ts (lines 296-315)
