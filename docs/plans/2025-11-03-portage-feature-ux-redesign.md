# Portage Feature UX Redesign

**Date:** 2025-11-03
**Status:** Design Complete, Ready for Implementation
**Scope:** Make portage a real feature with transparent pricing and improved UX

## Overview

Transform the portage feature from a partially implemented component into a production-ready feature with:
- Transparent pricing formulas visible to founders and buyers
- Improved information architecture using Gestalt principles
- Global formula configuration with adjustable parameters
- Bidirectional navigation between founder config and marketplace

## Current State Analysis

### Existing Implementation
- **Calculations**: Solid pure functions in `portageCalculations.ts`
  - Founder lots: Base + Indexation + Carrying Costs
  - Copro lots: Proportional pricing based on chosen surface
- **Components**: Basic `PortageLotConfig.tsx` and `AvailableLotsView.tsx`
- **Visual Design**: Orange (founder) and purple (copro) color coding

### Current Pricing Rules

**Founder Portage Lots (Surface Imposed):**
```
Total Price = Base Acquisition + Indexation + Carrying Costs + Renovations

Where:
- Base Acquisition = Purchase + Notary Fees + Construction
- Indexation = Base × [(1 + rate)^years - 1] (compound, default 2%/year)
- Carrying Costs = Monthly Interest + Tax (€388.38/yr) + Insurance (€2000/yr)
```

**Copropriété Lots (Surface Free):**
```
Proportional pricing:
- Newcomer chooses surface (up to max)
- Price = (Base + Indexation + Carrying) × (Chosen Surface / Total Surface)
```

### Problems
- Calculations hidden from users (no transparency)
- Poor information architecture (components buried in expandable sections)
- No clear user journey for founders or newcomers
- Missing global formula configuration

## Design Principles

### Approach
- **Founder-First Flow**: Primary focus on helping founders configure and understand portage pricing
- **Transparency**: Show complete formula and breakdown for every price calculation
- **Simplicity**: Small-scale UI (1-2 lots per founder max)
- **Gestalt Principles**: Visual hierarchy through proximity, similarity, and common region

### Key Decisions
1. **Global formula** shared across all founders (not per-participant)
2. **Adjustable parameters** (indexation rate, carrying cost recovery %)
3. **Breakdown tables** for all pricing displays (Option B from brainstorming)
4. **Separate sections** for founder config vs. marketplace (connected via clickable names)
5. **Per-lot surface** configuration (not derived from participant data)

## Information Architecture

### Page Structure (Top to Bottom)

1. **Project Parameters** (existing)
2. **Expense Categories** (existing)
3. **Participants Table** (existing, with enhanced portage config in detail panels)
4. **Global Portage Formula Configuration** (NEW)
5. **Available Lots Marketplace** (NEW - enhanced)
6. **Results/Export** (existing)

### Visual Hierarchy
- **Proximity**: Related portage elements grouped (formula config → marketplace)
- **Common Region**: Clear boundaries with consistent styling
- **Continuity**: Visual flow from configuration → marketplace

## Component Designs

### 1. Global Portage Formula Configuration Panel

**Component:** `PortageFormulaConfig.tsx`
**Location:** After Participants Table, before marketplace

#### Visual Design
```
┌─────────────────────────────────────────────────────────────────┐
│ 📦 Configuration Formule de Portage                        [▼]  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [Adjustable Parameters]                                        │
│                                                                 │
│  Taux d'indexation annuel:     [2.0] %                         │
│  Récupération frais de portage: [100] %                        │
│  Taux d'intérêt moyen:         [4.5] %                         │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  [Aperçu de la formule]                                         │
│                                                                 │
│  Prix de vente = Base + Indexation + Frais de portage          │
│                                                                 │
│  Où:                                                            │
│  • Base = Achat initial + Frais notaire + Construction          │
│  • Indexation = Base × [(1 + taux)^années - 1]                 │
│  • Frais de portage = Intérêts + Taxes + Assurance             │
│                                                                 │
│  [Exemple pour 2.5 ans de portage sur lot de €60,000]          │
│  ┌─────────────────────────────────────────┬───────────────┐   │
│  │ Base acquisition                        │    €60,000    │   │
│  │ Indexation (2.0% × 2.5 ans)             │     €3,030    │   │
│  │ Frais de portage (2.5 ans)              │     €4,970    │   │
│  │   - Intérêts (4.5% sur prêt)            │     €3,375    │   │
│  │   - Taxe bâtiment inoccupé              │       €971    │   │
│  │   - Assurance                           │       €417    │   │
│  ├─────────────────────────────────────────┼───────────────┤   │
│  │ Prix total de vente                     │    €68,000    │   │
│  └─────────────────────────────────────────┴───────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### Features
- **Collapsible panel**: Starts collapsed, expands to adjust parameters
- **Live preview**: Updates as parameters change
- **Clear formula explanation**: Plain language description
- **Example calculation**: Realistic numbers showing breakdown
- **Breakdown table**: Shows all components (Base, Indexation, Carrying Costs)

#### State Management
- Parameters stored in global project state (same level as `ProjectParams`)
- New interface: `PortageFormulaParams`
  ```typescript
  interface PortageFormulaParams {
    indexationRate: number; // Annual % (default 2.0)
    carryingCostRecovery: number; // % recovery (default 100)
    averageInterestRate: number; // Annual % (default 4.5)
  }
  ```
- All founder portage lots use these global parameters
- Changes update all portage prices in real-time

### 2. Founder Portage Lot Configuration

**Component:** Enhanced `PortageLotConfig.tsx` inside `ParticipantDetailsPanel.tsx`
**Location:** Inside expanded participant detail panel

#### Visual Design
```
┌─────────────────────────────────────────────────────────────────┐
│ Alice (Fondatrice)                                         [⭐]  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ [Existing participant inputs: capital, surface, etc...]         │
│                                                                 │
│ ─────────────────────────────────────────────────────────────── │
│                                                                 │
│ 📦 Lot en Portage                                               │
│                                                                 │
│ Surface à vendre: [45] m²                                       │
│                                                                 │
│ Prix de vente (2.5 ans de portage): €68,450                    │
│                                                                 │
│ ┌─────────────────────────────────────────┬──────────────┐     │
│ │ Base acquisition (achat+notaire+casco)  │    €60,000   │     │
│ │ Indexation (2.0% × 2.5 ans)             │     €3,030   │     │
│ │ Frais de portage (2.5 ans)              │     €5,420   │     │
│ ├─────────────────────────────────────────┼──────────────┤     │
│ │ Prix total                              │    €68,450   │     │
│ └─────────────────────────────────────────┴──────────────┘     │
│                                                                 │
│ [↓ Voir dans la place de marché]                               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### Features
- **Surface input per lot**: Editable, imposed to buyer
- **Live price calculation**: Auto-updates based on time since deed date
- **Breakdown table**: Same format as global config (Gestalt similarity)
- **Anchor link**: Scrolls to marketplace and highlights the lot
- **Simple UI**: Optimized for 1-2 lots max (small scale)

#### Calculation Details
- **Time-based**: Years held = (Current Date - Deed Date) / 365.25
- **Base acquisition**: Uses participant's calculation results:
  - Purchase Share / quantity
  - Notary Fees / quantity
  - Construction Cost / quantity
- **Indexation**: Uses global `indexationRate` parameter
- **Carrying Costs**: Uses global `averageInterestRate` parameter

### 3. Available Lots Marketplace

**Component:** Enhanced `AvailableLotsView.tsx`
**Location:** Bottom of calculator page (after Portage Formula Config)

#### Visual Design
```
┌───────────────────────────────────────────────────────────────────┐
│                                                                   │
│  🏪 Place de Marché — Lots Disponibles                           │
│                                                                   │
│  Choisissez parmi les lots en portage (fondateurs) ou les lots   │
│  de la copropriété                                                │
│                                                                   │
├───────────────────────────────────────────────────────────────────┤
│                                                                   │
│  📦 Lots Portage (Surface imposée)                                │
│                                                                   │
│  ┌─────────────────────┬──────────────────────────────────┐      │
│  │ Formule générale    │  Lots disponibles                │      │
│  │                     │                                   │      │
│  │ Prix =              │  De Alice • 45m²                  │      │
│  │   Base              │  Prix: €68,450                    │      │
│  │   + Indexation      │                                   │      │
│  │   + Portage         │  ┌────────────────┬──────────┐   │      │
│  │                     │  │ Base           │ €60,000  │   │      │
│  │ Où:                 │  │ Indexation     │  €3,030  │   │      │
│  │ Base = Achat +      │  │   (2% × 2.5a)  │          │   │      │
│  │   Notaire + Casco   │  │ Portage (2.5a) │  €5,420  │   │      │
│  │                     │  ├────────────────┼──────────┤   │      │
│  │ Indexation =        │  │ Total          │ €68,450  │   │      │
│  │   Base × [(1+r)^t-1]│  └────────────────┴──────────┘   │      │
│  │                     │                                   │      │
│  │ Portage =           │  ──────────────────────────────   │      │
│  │   Intérêts +        │                                   │      │
│  │   Taxes +           │  De Bob • 60m²                    │      │
│  │   Assurance         │  Prix: €89,200                    │      │
│  │                     │                                   │      │
│  │                     │  ┌────────────────┬──────────┐   │      │
│  │                     │  │ Base           │ €78,000  │   │      │
│  │                     │  │ Indexation     │  €3,939  │   │      │
│  │                     │  │   (2% × 2.5a)  │          │   │      │
│  │                     │  │ Portage (2.5a) │  €7,261  │   │      │
│  │                     │  ├────────────────┼──────────┤   │      │
│  │                     │  │ Total          │ €89,200  │   │      │
│  │                     │  └────────────────┴──────────┘   │      │
│  └─────────────────────┴──────────────────────────────────┘      │
│                                                                   │
│  🏢 Lots Copropriété (Surface libre)                              │
│                                                                   │
│  ┌────────────────────────────────────────────────────────┐      │
│  │ Lot Copropriété                                         │      │
│  │                                                         │      │
│  │ Surface disponible: 150m² (choisissez votre surface)   │      │
│  │ Votre choix: [___] m²                                   │      │
│  │                                                         │      │
│  │ Prix estimé pour 50m²: €42,300                          │      │
│  │                                                         │      │
│  │ ┌───────────────────────────────────┬──────────────┐   │      │
│  │ │ Base proportionnelle              │    €38,000   │   │      │
│  │ │ Indexation (2.0% × 2.5 ans)       │     €1,919   │   │      │
│  │ │ Frais de portage proportionnels   │     €2,381   │   │      │
│  │ ├───────────────────────────────────┼──────────────┤   │      │
│  │ │ Prix total (50m²)                 │    €42,300   │   │      │
│  │ │ Prix au m²                        │      €846/m² │   │      │
│  │ └───────────────────────────────────┴──────────────┘   │      │
│  └────────────────────────────────────────────────────────┘      │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
```

#### Features
- **Side-by-side layout**: Generic formula on left, specific lots on right
- **Clickable names**: "De Alice" and "De Bob" are anchor links → scroll to participant panel
- **Formula + Examples**: Shows abstract formula alongside concrete calculations
- **Consistent breakdown tables**: Same format across all components
- **Color coding**: Orange for founder lots, purple for copro
- **Real-time pricing**: Updates based on current date vs deed date
- **Interactive copro surface**: Input field with live price recalculation

#### Bidirectional Navigation
- **Marketplace → Founder**: Click participant name ("De Alice") → scroll to participant panel
- **Founder → Marketplace**: Click "↓ Voir dans la place de marché" → scroll to marketplace

#### Gestalt Principles
- **Similarity**: Consistent card design, typography, table format
- **Proximity**: Related information grouped (formula + lots)
- **Figure-Ground**: Clear visual separation using backgrounds
- **Common Region**: Borders define each lot card

## Data Model Updates

### New Types

```typescript
// Global portage formula parameters
interface PortageFormulaParams {
  indexationRate: number; // Annual percentage (default: 2.0)
  carryingCostRecovery: number; // Percentage of carrying costs to recover (default: 100)
  averageInterestRate: number; // Annual percentage for loan interest (default: 4.5)
}

// Add to ProjectParams or create new global state
interface ProjectState {
  // ... existing fields
  portageFormula: PortageFormulaParams;
}
```

### Updated Calculation Functions

**Enhanced `calculatePortageLotPrice`:**
```typescript
export function calculatePortageLotPrice(
  originalPrice: number,
  originalNotaryFees: number,
  originalConstructionCost: number,
  yearsHeld: number,
  formulaParams: PortageFormulaParams, // Use global params
  renovations: number = 0
): PortageLotPrice {
  // Implementation uses formulaParams.indexationRate, etc.
}
```

## Component Hierarchy

```
EnDivisionCorrect.tsx
├── ProjectParamsInputs (existing)
├── ExpenseCategorySection (existing)
├── ParticipantsTable (existing)
│   └── ParticipantDetailsPanel (enhanced)
│       └── PortageLotConfig (simplified)
│           ├── Surface input per lot
│           ├── Price breakdown table
│           └── Anchor link to marketplace
├── PortageFormulaConfig (NEW)
│   ├── Parameter inputs
│   ├── Formula explanation
│   └── Example calculation
├── AvailableLotsView (enhanced)
│   ├── Generic formula display
│   ├── Founder portage lots (with anchor links to participants)
│   └── Copro lots (with surface input)
└── ResultsDisplay (existing)
```

## Implementation Notes

### Storage
- Add `portageFormula` to localStorage schema (requires migration)
- Default values: indexationRate=2.0, carryingCostRecovery=100, averageInterestRate=4.5

### Backward Compatibility
- Existing projects without `portageFormula` get defaults on load
- No breaking changes to existing calculation functions

### Testing Strategy
- Unit tests: Formula calculations with adjustable parameters
- Integration tests: End-to-end portage workflow (founder config → marketplace display)
- Visual regression: Ensure consistent breakdown table formatting
- Accessibility: Anchor links keyboard-navigable, proper ARIA labels

### Migration Path
1. Add `PortageFormulaParams` to state
2. Update `calculatePortageLotPrice` to accept formula params
3. Build `PortageFormulaConfig` component
4. Enhance `PortageLotConfig` (simplify, add breakdown table)
5. Enhance `AvailableLotsView` (side-by-side layout, anchor links)
6. Add anchor link handlers (smooth scroll + highlight)
7. Test full workflow
8. Document in user guide

## Success Criteria

### User Experience
- ✅ Founders understand how portage pricing works (transparent formula)
- ✅ Founders can adjust global parameters and see impact
- ✅ Buyers see clear breakdown of every lot price
- ✅ Visual connection between founder config and marketplace is obvious
- ✅ Navigation is effortless (clickable names, smooth scrolling)

### Technical
- ✅ All calculations use global formula parameters
- ✅ Price updates in real-time as parameters change
- ✅ Breakdown tables consistent across all components
- ✅ Anchor links work bidirectionally
- ✅ Small-scale UI (optimized for 1-2 lots per founder)

## Future Enhancements (Out of Scope)

- Full formula editor (user-defined formulas)
- Transaction history and state management
- Multi-step wizard for completing portage sales
- Notification system for price changes over time
- Export portage pricing as PDF report
