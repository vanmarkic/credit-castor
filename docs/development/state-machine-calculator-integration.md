# State Machine Calculator Integration

## Overview

The state machine has been enriched with calculator functionality to track participant financial calculations, dynamic project parameters, and construction costs.

## Added Features

### 1. Participant Financial State

**Type**: `ParticipantFinancialState`

Tracks all financial calculations for each participant:
- Purchase costs (purchase share, price per m², quantity)
- Fees (registration fees, notary fees)
- Construction costs (CASCO, parachèvements, personal renovation costs)
- Shared costs (travaux communs per unit, shared costs)
- Total costs and capital contribution
- Financing details (single loan or two-loan)
- Newcomer calculations (quotité, base price, indexation, carrying cost recovery)

### 2. Two-Loan Financing Support

Added to `Participant` interface:
- `useTwoLoans?: boolean` - Enable two-loan financing
- `loan2DelayYears?: number` - Delay before loan 2 starts (default: 2 years)
- `loan2RenovationAmount?: number` - Amount of renovation in loan 2
- `capitalForLoan1?: number` - Capital allocation for loan 1
- `capitalForLoan2?: number` - Capital allocation for loan 2

### 3. Purchase Details for Newcomers

Added to `Participant` interface:
- `purchaseDetails?: { buyingFrom, lotId, purchasePrice, breakdown }` - Tracks who newcomers buy from and price breakdown

### 4. Construction Cost Overrides

Added to `Participant` interface:
- `parachevementsPerM2?: number` - Override parachèvements cost per m²
- `cascoSqm?: number` - Override CASCO surface area
- `parachevementsSqm?: number` - Override parachèvements surface area

### 5. Dynamic Project Parameters

**Type**: `ProjectParams`

Added to `ProjectFinancials`:
- `projectParams?: ProjectParams` - Full project parameters from calculator
- `dynamicFraisGeneraux3ans?: number` - Dynamically calculated based on CASCO costs
- `fraisGenerauxBreakdown?: FraisGenerauxBreakdown` - Detailed breakdown

### 6. Calculator Integration Events

**New Events**:
- `UPDATE_PROJECT_PARAMS` - Update project parameters from calculator
- `UPDATE_UNIT_DETAILS` - Update unit details (CASCO/parachèvements)
- `CALCULATE_PARTICIPANT_FINANCIAL_STATE` - Trigger calculation for participant
- `UPDATE_PARTICIPANT_FINANCIAL_STATE` - Update participant financial state
- `RECALCULATE_ALL_PARTICIPANTS` - Recalculate all participants

### 7. State Machine Actions

**New Actions**:
- `updateProjectParams` - Updates project financials with calculator params
- `updateParticipantFinancialState` - Updates participant financial state

## Usage Example

```typescript
// Update project parameters from calculator
machine.send({
  type: 'UPDATE_PROJECT_PARAMS',
  params: {
    totalPurchase: 650000,
    globalCascoPerM2: 400,
    travauxCommuns: { enabled: true, items: [...] },
    // ... other params
  }
});

// Update participant financial state
machine.send({
  type: 'UPDATE_PARTICIPANT_FINANCIAL_STATE',
  participantId: 'alice-123',
  financialState: {
    purchaseShare: 320000,
    droitEnregistrements: 40000,
    fraisNotaireFixe: 5000,
    casco: 45000,
    parachevements: 60000,
    totalCost: 470000,
    loanNeeded: 420000,
    monthlyPayment: 2400,
    // ... other financial data
  }
});
```

## Integration Points

The state machine now supports:
1. **Calculator → State Machine**: Calculator results can update state machine financial state
2. **State Machine → Calculator**: State machine can trigger recalculation requests
3. **Bidirectional Sync**: Financial state is kept in sync between calculator and state machine

## Type Definitions

### ParticipantFinancialState

Complete financial state for a participant, calculated from calculator:

```typescript
interface ParticipantFinancialState {
  // Purchase costs
  purchaseShare: number;      // Part d'achat (surface × price per m² or quotité-based)
  pricePerM2: number;         // Calculated price per square meter
  quantity: number;           // Number of units/lots
  
  // Fees
  droitEnregistrements: number;  // Registration fees (3% or 12.5%)
  fraisNotaireFixe: number;      // Fixed notary fees (€5,000 per unit)
  
  // Construction costs
  casco: number;                    // CASCO (shell construction) cost
  parachevements: number;           // Parachèvements (finishing work) cost
  personalRenovationCost: number;   // Total renovation (CASCO + parachèvements)
  constructionCost: number;         // Total construction cost including overrides
  
  // Shared costs
  sharedCosts: number;              // Total shared costs (frais généraux + travaux communs)
  travauxCommunsPerUnit: number;    // Common works cost per unit
  
  // Total cost
  totalCost: number;                // Sum of all costs
  capitalApporte: number;           // Participant's capital contribution
  
  // Single loan financing
  loanNeeded?: number;              // Total loan amount needed
  monthlyPayment?: number;          // Monthly loan payment
  totalRepayment?: number;          // Total amount to repay
  totalInterest?: number;           // Total interest over loan duration
  financingRatio?: number;          // Loan / total cost ratio (0-1)
  
  // Two-loan financing
  loan1Amount?: number;             // Loan 1 amount (purchase + fees)
  loan1MonthlyPayment?: number;     // Loan 1 monthly payment
  loan1Interest?: number;           // Loan 1 total interest
  loan2Amount?: number;             // Loan 2 amount (renovation)
  loan2DurationYears?: number;      // Loan 2 duration (typically shorter)
  loan2MonthlyPayment?: number;     // Loan 2 monthly payment
  loan2Interest?: number;           // Loan 2 total interest
  
  // Newcomer calculations (when buying from copropriété)
  quotite?: number;                 // Ownership share: surface / total surface
  newcomerBasePrice?: number;       // Base price = quotité × total project cost
  newcomerIndexation?: number;      // Price indexation (2%/year compound)
  newcomerCarryingCostRecovery?: number; // Carrying costs recovery
}
```

### ProjectParams

Complete project parameters from calculator:

```typescript
interface ProjectParams {
  totalPurchase: number;              // Total purchase price
  mesuresConservatoires: number;      // Conservation measures cost
  demolition: number;                 // Demolition cost
  infrastructures: number;            // Infrastructure cost
  etudesPreparatoires: number;        // Preparatory studies cost
  fraisEtudesPreparatoires: number;   // Study fees
  fraisGeneraux3ans: number;          // General expenses over 3 years
  batimentFondationConservatoire: number;
  batimentFondationComplete: number;
  batimentCoproConservatoire: number;
  globalCascoPerM2: number;           // Global CASCO price per m²
  cascoTvaRate?: number;              // CASCO TVA rate (6% or 21%)
  renovationStartDate?: string;       // Renovation start date (ISO string)
  travauxCommuns?: TravauxCommuns;    // Common works configuration
}
```

### TravauxCommuns

Customizable common works with line items:

```typescript
interface TravauxCommuns {
  enabled: boolean;                   // Enable/disable common works
  items: TravauxCommunsItem[];        // List of common work items
}

interface TravauxCommunsItem {
  label: string;                      // Item description
  sqm: number;                        // Surface area in square meters
  cascoPricePerSqm: number;           // CASCO price per m²
  parachevementPricePerSqm: number;   // Parachèvement price per m²
  amount?: number;                    // Optional: stored value (calculated if not provided)
}

// Amount calculation:
// amount = (sqm × cascoPricePerSqm) + (sqm × parachevementPricePerSqm)
```

### FraisGenerauxBreakdown

Detailed breakdown of general expenses (calculated dynamically):

```typescript
interface FraisGenerauxBreakdown {
  honoraires: {
    total3Years: number;              // Total professional fees over 3 years
    yearly: number;                   // Yearly professional fees
    description: string;               // Description: "CASCO HORS TVA × 15% × 30%"
  };
  recurring: {
    precompteImmobilier: number;      // Property tax: €388.38/year
    comptable: number;                 // Accountant: €1,000/year
    podioAbonnement: number;           // Podio subscription: €600/year
    assuranceBatiment: number;         // Building insurance: €2,000/year
    fraisReservation: number;          // Reservation fees: €2,000/year
    imprevus: number;                  // Contingencies: €2,000/year
    yearly: number;                    // Total recurring costs per year
  };
  total: {
    yearly: number;                    // Total yearly: honoraires + recurring
    total3Years: number;               // Total over 3 years
  };
}

// Formula for honoraires:
// honorairesTotal3Years = totalCascoHorsTva × 0.15 × 0.30
// honorairesYearly = honorairesTotal3Years / 3
```

### UnitDetails

Unit type definitions for CASCO and parachèvements:

```typescript
interface UnitDetails {
  [unitId: number]: {
    casco: number;           // CASCO price per m² for this unit type
    parachevements: number;  // Parachèvements price per m² for this unit type
  };
}

// Example:
// {
//   1: { casco: 400, parachevements: 500 },  // Unit type 1
//   2: { casco: 450, parachevements: 600 },  // Unit type 2
// }
```

## Calculation Formulas

### Dynamic Frais Généraux

Frais généraux is calculated dynamically based on total CASCO costs:

1. **Calculate total CASCO HORS TVA** (excluding VAT):
   - Sum of all participants' CASCO costs (from unitDetails or overrides)
   - Add travaux communs CASCO portion (if enabled)
   
2. **Calculate honoraires** (professional fees):
   - `honorairesTotal3Years = totalCascoHorsTva × 15% × 30%`
   - Represents architects, stability experts, study offices, PEB, etc.
   - Distributed over 3 years: `honorairesYearly = total / 3`

3. **Calculate recurring costs** (yearly):
   - Property tax: €388.38/year
   - Accountant: €1,000/year
   - Podio subscription: €600/year
   - Building insurance: €2,000/year
   - Reservation fees: €2,000/year
   - Contingencies: €2,000/year
   - Total: €7,988.38/year

4. **Total frais généraux**:
   - `totalYearly = honorairesYearly + recurringYearly`
   - `total3Years = totalYearly × 3`

### Two-Loan Financing

When `useTwoLoans` is enabled:

**Loan 1** (Purchase + Fees):
- Covers: purchase share + registration fees + notary fees + shared costs
- Starts: immediately
- Duration: participant's `durationYears`
- Capital: `capitalForLoan1` or portion of `capitalApporte`

**Loan 2** (Renovation):
- Covers: CASCO + parachèvements (portion specified in `loan2RenovationAmount`)
- Starts: after `loan2DelayYears` (default: 2 years)
- Duration: typically shorter (calculated based on remaining renovation amount)
- Capital: `capitalForLoan2` or remaining `capitalApporte`

**Monthly Payment**:
- Only loan 1 payment applies initially
- After `loan2DelayYears`, both payments apply
- Total monthly = loan1MonthlyPayment + loan2MonthlyPayment

## Integration Workflow

### Initial Setup

1. **Update Project Parameters**:
```typescript
machine.send({
  type: 'UPDATE_PROJECT_PARAMS',
  params: {
    totalPurchase: 650000,
    globalCascoPerM2: 400,
    travauxCommuns: {
      enabled: true,
      items: [
        {
          label: 'Escaliers communs',
          sqm: 20,
          cascoPricePerSqm: 400,
          parachevementPricePerSqm: 500
        }
      ]
    },
    // ... other params
  }
});
```

2. **Update Unit Details** (optional):
```typescript
machine.send({
  type: 'UPDATE_UNIT_DETAILS',
    unitDetails: {
    1: { casco: 400, parachevements: 500 },
    2: { casco: 450, parachevements: 600 }
  }
});
```

### Participant Calculations

3. **Calculate Financial State** (from calculator):
```typescript
const calculations = calculateAll(participants, projectParams, unitDetails, deedDate, formulaParams);

// For each participant:
machine.send({
  type: 'UPDATE_PARTICIPANT_FINANCIAL_STATE',
  participantId: participant.id,
  financialState: calculations.participantBreakdown.find(p => p.name === participant.name)
});
```

### Recalculation

4. **Recalculate All** (when project params change):
```typescript
machine.send({ type: 'RECALCULATE_ALL_PARTICIPANTS' });
// This triggers recalculation for all participants
```

## Error Handling

The state machine actions are defensive:
- Invalid event types are ignored (no-op)
- Missing fields are handled gracefully
- Type mismatches are prevented by TypeScript

## State Transitions

Calculator integration events can be sent from any state:
- `UPDATE_PROJECT_PARAMS`: Updates project financials (no state change)
- `UPDATE_PARTICIPANT_FINANCIAL_STATE`: Updates participant state (no state change)
- `RECALCULATE_ALL_PARTICIPANTS`: Triggers recalculation (no state change)

These are **side-effect actions** that update context without changing the machine's state.

## Benefits

1. **Centralized Financial State**: All financial calculations tracked in state machine
2. **Type Safety**: Strongly typed financial state interfaces
3. **Audit Trail**: Financial state changes are part of state machine history
4. **Consistency**: Single source of truth for participant financial data
5. **Extensibility**: Easy to add new financial calculations to state machine
6. **Dynamic Calculations**: Frais généraux calculated based on actual CASCO costs
7. **Flexible Financing**: Support for both single and two-loan financing scenarios

