# Portage Construction Payment Configuration Design

**Created**: 2025-11-05
**Status**: Design Complete - Ready for Implementation
**Feature**: Prevent double-charging buyers for construction costs in portage sales

---

## Executive Summary

This document specifies a configuration option for portage lots that allows founders (sellers) to declare whether they will pay for CASCO and/or parachèvement during the portage period. This prevents buyers from being charged twice for the same construction costs.

**Key Features:**
- Founder configures payment responsibility at portage lot setup
- Buyer's construction costs automatically adjusted (zeroed if founder paid)
- Dependency enforcement: Parachèvement requires CASCO
- Portage price unchanged (founder recoups costs via portage pricing)
- Excel export shows who paid for construction

---

## Business Problem

### Current Behavior (The Bug)

**Portage Purchase Price Breakdown:**
```
Total Portage Price: €256,490
├─ Base acquisition: €233,175
│  ├─ Original land/building cost: €150,000
│  ├─ CASCO costs: €50,000          ← Founder paid this
│  └─ Parachèvement costs: €33,175  ← Founder paid this
├─ Indexation: €6,212
└─ Carrying costs: €17,103
```

**Buyer's Total Costs (PROBLEM!):**
```
Buyer pays:
├─ Portage purchase: €256,490       ← Includes construction!
├─ Own CASCO: €50,000               ← Paying AGAIN ✗
└─ Own Parachèvement: €33,175       ← Paying AGAIN ✗

Total: €339,665  (€83,175 overcharged!)
```

### Solution

Founder configures at portage setup:
- ☐ Founder will pay for CASCO
- ☐ Founder will pay for Parachèvement (auto-checks CASCO)

Buyer's construction costs automatically adjusted to zero if founder paid.

---

## Data Model

### TypeScript Interface Extension

```typescript
// src/stateMachine/types.ts

interface PortageLot {
  lotId: number;
  seller: string;
  entryDate: Date;
  soldDate?: Date;
  surface: number;

  // NEW: Construction payment configuration
  founderPaysCasco: boolean;          // Default: false
  founderPaysParachèvement: boolean;  // Default: false

  // ... existing fields
}
```

### Business Rules

**Dependency**: Parachèvement requires CASCO
- If `founderPaysParachèvement === true`, then `founderPaysCasco` MUST be `true`
- Enforced via UI auto-checking

**Valid States:**
- ✓ Both false: Buyer pays for both (current default)
- ✓ CASCO true, Parachèvement false: Buyer pays for parachèvement only
- ✓ Both true: Buyer pays for neither
- ✗ CASCO false, Parachèvement true: INVALID (prevented by UI)

**Single Source of Truth**: The `PortageLot` object in XState context is authoritative.

---

## XState State Machine Integration

### Context Extension

```typescript
interface ProjectContext {
  // ... existing fields
  portageLots: PortageLot[];  // Already includes new fields
}
```

### Events

```typescript
type ProjectEvents =
  | // ... existing events
  | {
      type: 'UPDATE_PORTAGE_LOT_CONFIG';
      lotId: number;
      updates: Partial<PortageLot>;
    }
  | {
      type: 'TOGGLE_FOUNDER_PAYS_CASCO';
      lotId: number;
      value: boolean;
    }
  | {
      type: 'TOGGLE_FOUNDER_PAYS_PARACHÈVEMENT';
      lotId: number;
      value: boolean;
    };
```

### Actions

```typescript
// src/stateMachine/creditCastorMachine.ts

actions: {
  toggleFounderPaysCasco: assign({
    portageLots: ({ context, event }) => {
      return context.portageLots.map(lot =>
        lot.lotId === event.lotId
          ? { ...lot, founderPaysCasco: event.value }
          : lot
      );
    }
  }),

  toggleFounderPaysParachèvement: assign({
    portageLots: ({ context, event }) => {
      return context.portageLots.map(lot =>
        lot.lotId === event.lotId
          ? {
              ...lot,
              founderPaysParachèvement: event.value,
              // Auto-check CASCO if Parachèvement is enabled
              founderPaysCasco: event.value ? true : lot.founderPaysCasco
            }
          : lot
      );
    }
  }),
}
```

### Guards (optional)

```typescript
guards: {
  isValidConstructionConfig: ({ context }, params: { lotId: number }) => {
    const lot = context.portageLots.find(l => l.lotId === params.lotId);
    if (!lot) return false;

    // Parachèvement requires CASCO
    if (lot.founderPaysParachèvement && !lot.founderPaysCasco) {
      return false;
    }

    return true;
  }
}
```

---

## Calculation Logic

### Buyer Construction Cost Calculation

```typescript
// src/utils/calculatorUtils.ts

/**
 * Calculate construction costs for a portage buyer
 * Removes costs already paid by founder during portage period
 */
function calculatePortageBuyerConstructionCosts(
  participant: Participant,
  portageLot: PortageLot,
  unitDetails: UnitDetails
): { casco: number; parachèvements: number } {

  // Get base construction costs for this participant
  const baseCasco = calculateBaseCasco(participant, unitDetails);
  const baseParachèvements = calculateBaseParachèvements(participant, unitDetails);

  // Zero out costs if founder already paid
  const casco = portageLot.founderPaysCasco ? 0 : baseCasco;
  const parachèvements = portageLot.founderPaysParachèvement ? 0 : baseParachèvements;

  return { casco, parachèvements };
}

/**
 * Get construction costs paid by founder (for display/export)
 */
function getFounderPaidConstructionCosts(
  portageLot: PortageLot,
  surface: number,
  unitDetails: UnitDetails
): { casco: number; parachèvements: number } {

  const cascoPerM2 = unitDetails.casco || 0;
  const parachèvementsPerM2 = unitDetails.parachevements || 0;

  const casco = portageLot.founderPaysCasco ? cascoPerM2 * surface : 0;
  const parachèvements = portageLot.founderPaysParachèvement
    ? parachèvementsPerM2 * surface
    : 0;

  return { casco, parachèvements };
}
```

### Integration Point

```typescript
// In calculateAll() or participant cost calculation

function calculateParticipantCosts(participant: Participant, context: ProjectContext) {
  // ... existing logic

  // Check if this participant is buying a portage lot
  const portageLot = context.portageLots.find(
    lot => lot.soldDate && participant.purchaseDetails?.lotId === lot.lotId
  );

  if (portageLot) {
    // Use portage-specific calculation
    const { casco, parachèvements } = calculatePortageBuyerConstructionCosts(
      participant,
      portageLot,
      context.unitDetails
    );

    return {
      ...costs,
      fraisCasco: casco,
      fraisParachèvements: parachèvements,
    };
  }

  // ... normal calculation for non-portage participants
}
```

---

## UI Implementation

### 1. PortageLotConfig Component Update

**Location**: `src/components/PortageLotConfig.tsx`

```tsx
interface PortageLotConfigProps {
  lot: PortageLot;
  onUpdate: (lotId: number, updates: Partial<PortageLot>) => void;
}

export function PortageLotConfig({ lot, onUpdate }: PortageLotConfigProps) {

  const handleCascoToggle = (checked: boolean) => {
    onUpdate(lot.lotId, { founderPaysCasco: checked });

    // If unchecking CASCO, also uncheck Parachèvement (dependency rule)
    if (!checked && lot.founderPaysParachèvement) {
      onUpdate(lot.lotId, {
        founderPaysCasco: false,
        founderPaysParachèvement: false
      });
    }
  };

  const handleParachèvementToggle = (checked: boolean) => {
    if (checked) {
      // Auto-check CASCO when Parachèvement is checked
      onUpdate(lot.lotId, {
        founderPaysCasco: true,
        founderPaysParachèvement: true
      });
    } else {
      onUpdate(lot.lotId, { founderPaysParachèvement: false });
    }
  };

  return (
    <div className="portage-lot-config">
      {/* ... existing fields (entry date, sale date, surface, etc.) */}

      <fieldset className="construction-payment-config">
        <legend>Paiement des travaux de construction</legend>
        <p className="helper-text">
          Qui paie pour les travaux pendant la période de portage?
        </p>

        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={lot.founderPaysCasco}
            onChange={(e) => handleCascoToggle(e.target.checked)}
          />
          <span>Le porteur (fondateur) paie le CASCO</span>
        </label>

        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={lot.founderPaysParachèvement}
            onChange={(e) => handleParachèvementToggle(e.target.checked)}
            disabled={!lot.founderPaysCasco}
          />
          <span>Le porteur (fondateur) paie les parachèvements</span>
          {!lot.founderPaysCasco && (
            <span className="dependency-note">
              (nécessite CASCO)
            </span>
          )}
        </label>

        {lot.founderPaysCasco && (
          <div className="info-box">
            ℹ️ L'acheteur ne paiera pas pour le{' '}
            {lot.founderPaysParachèvement ? 'CASCO ni les parachèvements' : 'CASCO'}
            {' '}car le porteur les a déjà payés.
          </div>
        )}
      </fieldset>
    </div>
  );
}
```

### 2. Buyer's Cost Display

**Location**: `src/components/EnDivisionCorrect.tsx` (or participant cost display)

```tsx
function ParticipantConstructionCosts({ participant, portageLot }: Props) {
  const { casco, parachèvements } = calculatePortageBuyerConstructionCosts(
    participant,
    portageLot,
    unitDetails
  );

  return (
    <div className="construction-costs">
      <div className="cost-line">
        <span>CASCO:</span>
        <span>
          €{casco.toLocaleString()}
          {portageLot.founderPaysCasco && (
            <span className="paid-by-founder"> (payé par porteur)</span>
          )}
        </span>
      </div>

      <div className="cost-line">
        <span>Parachèvements:</span>
        <span>
          €{parachèvements.toLocaleString()}
          {portageLot.founderPaysParachèvement && (
            <span className="paid-by-founder"> (payé par porteur)</span>
          )}
        </span>
      </div>
    </div>
  );
}
```

---

## Excel Export Integration

### Export Data Structure

```typescript
// src/utils/excelExport.ts

interface PortageLotExportData {
  lotId: number;
  seller: string;
  buyer: string;
  surface: number;
  purchasePrice: number;

  // NEW: Construction payment details
  constructionPaidBy: {
    casco: 'founder' | 'buyer';
    parachèvement: 'founder' | 'buyer';
  };

  founderPaidCasco: number;      // Amount founder paid
  founderPaidParachèvement: number;
  buyerPaysCasco: number;        // Amount buyer pays
  buyerPaysParachèvement: number;
}
```

### Export Sheet Builder

```typescript
function buildPortageConstructionSection(
  portageLot: PortageLot,
  buyer: Participant,
  unitDetails: UnitDetails
): SheetRow[] {

  const founderPaid = getFounderPaidConstructionCosts(
    portageLot,
    portageLot.surface,
    unitDetails
  );

  const buyerPays = calculatePortageBuyerConstructionCosts(
    buyer,
    portageLot,
    unitDetails
  );

  return [
    {
      cells: [
        { value: 'Construction - CASCO', bold: true },
        { value: '' },
        { value: '' },
      ]
    },
    {
      cells: [
        { value: '  Payé par porteur (fondateur)' },
        { value: `€${founderPaid.casco.toLocaleString()}` },
        { value: portageLot.seller },
      ]
    },
    {
      cells: [
        { value: '  Payé par acheteur' },
        { value: `€${buyerPays.casco.toLocaleString()}` },
        { value: buyer.name },
      ]
    },
    {
      cells: [
        { value: 'Construction - Parachèvements', bold: true },
        { value: '' },
        { value: '' },
      ]
    },
    {
      cells: [
        { value: '  Payé par porteur (fondateur)' },
        { value: `€${founderPaid.parachèvements.toLocaleString()}` },
        { value: portageLot.seller },
      ]
    },
    {
      cells: [
        { value: '  Payé par acheteur' },
        { value: `€${buyerPays.parachèvements.toLocaleString()}` },
        { value: buyer.name },
      ]
    },
  ];
}
```

### Example Output

```
┌─────────────────────────────────────┬──────────────┬──────────────────┐
│ Lot 2 - Vente en portage            │ Montant      │ Payé par         │
├─────────────────────────────────────┼──────────────┼──────────────────┤
│ Prix d'achat portage                │ €256,490     │ Nouveau acheteur │
├─────────────────────────────────────┼──────────────┼──────────────────┤
│ Construction - CASCO                │              │                  │
│   Payé par porteur (fondateur)      │ €50,000      │ Annabelle/Colin  │
│   Payé par acheteur                 │ €0           │ Nouveau acheteur │
├─────────────────────────────────────┼──────────────┼──────────────────┤
│ Construction - Parachèvements       │              │                  │
│   Payé par porteur (fondateur)      │ €33,175      │ Annabelle/Colin  │
│   Payé par acheteur                 │ €0           │ Nouveau acheteur │
└─────────────────────────────────────┴──────────────┴──────────────────┘
```

---

## Formula Documentation

### Business Logic Explanation

```typescript
// src/utils/formulaExplanations.ts

export const portageConstructionCostExplanation = {
  title: "Coûts de construction en portage",

  summary: `
    Lors d'une vente en portage, le porteur (fondateur) peut choisir de payer
    pour le CASCO et/ou les parachèvements pendant la période de portage.
    L'acheteur ne paie que pour les travaux non couverts par le porteur.
  `,

  rules: [
    {
      condition: "Porteur paie CASCO et parachèvements",
      result: "Acheteur ne paie aucun coût de construction",
      example: "Coût acheteur: €0 + €0 = €0"
    },
    {
      condition: "Porteur paie CASCO uniquement",
      result: "Acheteur paie uniquement les parachèvements",
      example: "Coût acheteur: €0 (CASCO) + €33,175 (parachèvements) = €33,175"
    },
    {
      condition: "Porteur ne paie rien",
      result: "Acheteur paie tous les coûts de construction",
      example: "Coût acheteur: €50,000 (CASCO) + €33,175 (parachèvements) = €83,175"
    }
  ],

  dependencies: [
    "Les parachèvements nécessitent le CASCO comme base structurelle",
    "Si le porteur paie les parachèvements, il doit payer le CASCO"
  ],

  priceRecovery: `
    Le prix d'achat portage (€256,490) reste inchangé et inclut déjà les coûts
    de construction que le porteur a payés. Le porteur récupère son investissement
    via le prix de vente portage, pas via des paiements séparés de l'acheteur.
  `
};
```

### In-App Help Text

```tsx
<InfoTooltip>
  <strong>Comment ça marche?</strong>
  <ul>
    <li>
      Le porteur décide s'il paie pour les travaux pendant qu'il détient le lot
    </li>
    <li>
      Le prix de portage (€256,490) récupère ces coûts via indexation et frais de portage
    </li>
    <li>
      L'acheteur ne paie que les travaux NON couverts par le porteur
    </li>
    <li>
      Cela évite le double paiement: le porteur récupère via le prix,
      l'acheteur ne paie pas deux fois
    </li>
  </ul>
</InfoTooltip>
```

---

## Implementation Summary

### Files to Modify

| File | Changes |
|------|---------|
| `src/stateMachine/types.ts` | Add `founderPaysCasco` + `founderPaysParachèvement` to `PortageLot` |
| `src/stateMachine/creditCastorMachine.ts` | Add toggle events + assign actions |
| `src/utils/calculatorUtils.ts` | Add `calculatePortageBuyerConstructionCosts()` + `getFounderPaidConstructionCosts()` |
| `src/components/PortageLotConfig.tsx` | Add checkboxes with auto-check logic |
| `src/components/EnDivisionCorrect.tsx` | Update cost display to show "(payé par porteur)" |
| `src/utils/excelExport.ts` | Add construction payment breakdown section |
| `src/utils/formulaExplanations.ts` | Add portage construction cost explanation |

### Key Implementation Points

1. **Dependency Enforcement**: UI handles auto-checking (Parachèvement → auto-check CASCO)
2. **Price Model**: Portage price unchanged (founder recoups via portage pricing)
3. **Single Source of Truth**: `PortageLot` in XState context
4. **Backward Compatibility**: Defaults to `false` (current behavior: buyer pays all)

---

## Next Steps

1. ✅ Design validated and documented
2. [ ] Create implementation plan using `/superpowers:write-plan`
3. [ ] Set up git worktree for isolated development
4. [ ] Implement TypeScript interfaces and state machine
5. [ ] Implement calculation functions
6. [ ] Implement UI components
7. [ ] Implement Excel export integration
8. [ ] Add formula documentation
9. [ ] Manual testing with real data
10. [ ] Commit and merge

---

**End of Design Document**

*This design extends the Credit Castor portage system to prevent double-charging buyers for construction costs by allowing founders to declare construction payment responsibility at lot setup time.*
