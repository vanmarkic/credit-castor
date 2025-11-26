# Participant Detail Modal Redesign

## Overview

Redesign the `ParticipantDetailModal` to be **inhabitant-centered** rather than configuration-centered. The core question the modal must answer: **"How much do I need to pay, and when?"**

## Problem Statement

Current modal issues:
- Wall of numbers without clear hierarchy
- Configuration options shown first (power user focus)
- Loan amounts prominent even when not needed
- No clear timeline of when costs occur
- Technical labels (CASCO, parachèvements) without context

## Design Principles

1. **Costs first, loans second** - Some inhabitants pay cash
2. **Timeline-based** - Show the payment journey, not just totals
3. **Progressive disclosure** - Details available but not overwhelming
4. **Human language** - "Signature", "Construction", "Emménagement" not "Loan 1/2"

## Cost Timing Model

| Phase | Costs | Payment Style |
|-------|-------|---------------|
| **Signature (Acte)** | Purchase share, Registration fees, Notary fees | Lump sum at deed |
| **Construction** | CASCO, Travaux communs, Frais généraux (Commun) | Progressive installments |
| **Emménagement** | Parachèvements | When inhabitant decides to move in |

## New Modal Structure

### Hierarchy (top to bottom)

1. **Header** - Identity (name, unit, surface)
2. **Timeline** - The hero: 3 phases with cost totals + expandable details
3. **Financement** - Collapsed: loan configuration (optional)
4. **Paramètres** - Collapsed: surface, capital, rates, unit type
5. **Remboursements attendus** - Collapsed: founders' expected paybacks
6. **Statut** - Collapsed: founder checkbox, entry date
7. **Supprimer** - Bottom: destructive action

### Timeline Component (The Hero)

```
●━━━━━━━━━━━━━━━━━━━●━━━━━━━━━━━━━━━━━━━━━━━━━━━━●━━━━━━━━━━━━━━━━●
SIGNATURE           CONSTRUCTION                 EMMÉNAGEMENT     TOTAL

┌────────────────┐  ┌────────────────────────┐  ┌────────────────┐ ┌─────┐
│    €45,200     │  │       €87,500          │  │    €25,000     │ │€157k│
└────────────────┘  └────────────────────────┘  └────────────────┘ └─────┘
▼ Détails           ▼ Détails                   ▼ Détails
```

**Expanded details example (Signature):**
```
Part d'achat        €35,000
Enregistrement       €5,200
Notaire              €5,000
```

**Expanded details example (Construction):**
```
CASCO               €60,000
Travaux communs     €12,500
Commun              €15,000
```

### Financing Section (Collapsed by Default)

When expanded:

```
Capital apporté: [€30,000____]     Reste à financer: €127,700

○ Un seul prêt     ● Deux prêts (recommandé)

┌─ PRÊT 1 (Signature) ─────────┐  ┌─ PRÊT 2 (Construction) ────────────┐
│ Montant: €45,200 (auto)      │  │ Montant: €82,500 (auto)            │
│ Durée: [25] ans              │  │ Durée: [25] ans                    │
│ Taux: [3.5]%                 │  │ Taux: [3.5]%                       │
│ Mensualité: €226             │  │ Démarre après: [2] ans             │
│                              │  │ Mensualité: €413                   │
│ [Ajuster montant ▼]          │  │                                    │
└──────────────────────────────┘  │ ☐ Inclure parachèvements (+€25k)  │
                                  └────────────────────────────────────┘

Mensualité combinée (ans 2-25): €639/mois
```

**Loan allocation logic (auto-suggest):**
- Loan 1 = Signature costs (purchase + notary + registration)
- Loan 2 = Construction costs (CASCO + commun + travaux)
- Parachèvements = Optional toggle to add to Loan 2

**Override capability:**
- User can manually adjust amounts if bank requires different split
- System recalculates monthly payments instantly

## Component Architecture

### New Components to Create

1. **PaymentTimeline.tsx**
   - Props: `participant`, `participantCalc`, `projectParams`
   - Displays 3-phase timeline with costs
   - Expandable detail sections per phase
   - Calculates phase totals from existing calculation data

2. **FinancingSection.tsx**
   - Props: `participant`, `participantCalc`, `onUpdate`
   - Collapsed by default
   - Single vs two-loan toggle
   - Auto-suggest loan allocation with override
   - Includes parachèvements toggle for Loan 2

3. **CollapsibleSection.tsx** (shared)
   - Generic collapsible wrapper for progressive disclosure
   - Props: `title`, `icon`, `defaultOpen`, `children`

### Components to Refactor

1. **ParticipantDetailModal.tsx**
   - Reorganize layout to new hierarchy
   - Move configuration into collapsible Paramètres section
   - Add PaymentTimeline as hero component

2. **CostBreakdownGrid.tsx**
   - Keep but use inside timeline detail expansions
   - Or deprecate in favor of simpler per-phase lists

### Components to Keep

- `ExpectedPaybacksCard.tsx` - Move into collapsible section
- `TwoLoanFinancingSection.tsx` - Refactor into new FinancingSection
- `ConstructionDetailSection.tsx` - Move into Paramètres section

## Data Flow

### Phase Cost Calculation

```typescript
interface PhaseCosts {
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

function calculatePhaseCosts(
  participant: Participant,
  participantCalc: ParticipantCalculation
): PhaseCosts {
  // Extract from existing calculation results
  // Group by payment timing
}
```

### Loan Auto-Allocation

```typescript
interface LoanAllocation {
  loan1Amount: number;  // Signature costs - capital
  loan2Amount: number;  // Construction costs (+ optional parachèvements)
  includeParachevements: boolean;
}

function suggestLoanAllocation(
  phaseCosts: PhaseCosts,
  capitalApporte: number,
  includeParachevements: boolean
): LoanAllocation {
  const loan1 = Math.max(0, phaseCosts.signature.total - capitalApporte);
  const loan2 = phaseCosts.construction.total +
    (includeParachevements ? phaseCosts.emmenagement.total : 0);
  return { loan1Amount: loan1, loan2Amount: loan2, includeParachevements };
}
```

## Migration Strategy

1. **Phase 1**: Create `PaymentTimeline` component standalone
2. **Phase 2**: Create `CollapsibleSection` wrapper
3. **Phase 3**: Create `FinancingSection` with auto-allocation
4. **Phase 4**: Refactor `ParticipantDetailModal` layout
5. **Phase 5**: Test with real scenarios, iterate

## Success Criteria

- [ ] Inhabitant can see total cost per phase at a glance
- [ ] Loan configuration is optional and collapsed by default
- [ ] Two-loan split is auto-suggested based on cost timing
- [ ] User can override loan amounts if needed
- [ ] All existing functionality preserved (just reorganized)
- [ ] Modal feels simpler despite same information density

## Out of Scope

- Changing calculation logic (pure presentation refactor)
- Mobile-specific responsive design (follow existing patterns)
- New features beyond reorganization