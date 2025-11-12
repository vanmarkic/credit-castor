# Label Audit: Code Examples & Detailed Findings

## Issue 1.1: Dual Notary Fee Concepts - Code Examples

### Current State (Confusing)

```typescript
// In calculatorUtils.ts - Participant interface
export interface Participant {
  notaryFeesRate: number;  // <-- MISLEADING NAME
  // ... other fields
}

// How notaryFeesRate is actually used:
export function calculateDroitEnregistrements(
  purchaseShare: number,
  notaryFeesRate: number  // <-- Used ONLY for registration fees, not fraisNotaireFixe
): number {
  return purchaseShare * (notaryFeesRate / 100);
}

// The fraisNotaireFixe is calculated completely differently:
export function calculateFraisNotaireFixe(quantity: number): number {
  return quantity * 1000;  // Fixed €1,000 per lot - uses quantity, NOT notaryFeesRate
}
```

### The Problem in Practice

```typescript
// Example participant:
const alice: Participant = {
  name: "Alice",
  surface: 100,
  quantity: 1,
  capitalApporte: 50000,
  notaryFeesRate: 12.5,  // <-- Is this for registration OR fixed fee?
  // ...
};

// Calculation results:
const calc = calculateAll([alice], projectParams, unitDetails);
const aliceCalc = calc.participantBreakdown[0];

console.log(aliceCalc.droitEnregistrements);  // €21,250 = €170K × 12.5%
console.log(aliceCalc.fraisNotaireFixe);      // €1,000 = 1 lot × €1,000

// The "notaryFeesRate" field name is MISLEADING because:
// - It's used ONLY for droitEnregistrements calculation
// - It has NOTHING to do with fraisNotaireFixe calculation
// - A new developer might think it applies to both
```

### Correct Naming

```typescript
// SHOULD BE:
export interface Participant {
  registrationFeesRate: number;  // or droitEnregistrementsRate
  // ... other fields
}

// Now it's clear what this field is for:
export function calculateDroitEnregistrements(
  purchaseShare: number,
  registrationFeesRate: number
): number {
  return purchaseShare * (registrationFeesRate / 100);
}
```

---

## Issue 2.1 & 2.2: Frais Généraux Undocumented Components

### Current Hardcoded Values (No Source)

```typescript
// In calculatorUtils.ts, getFraisGenerauxBreakdown()
export function getFraisGenerauxBreakdown(
  participants: Participant[],
  projectParams: ProjectParams,
  unitDetails: UnitDetails
): FraisGenerauxBreakdown {
  // ... calculation of totalCascoHorsTva ...

  // Calculate Honoraires = Total CASCO × 15% × 30%
  // WHERE DO 15% and 30% COME FROM? Not documented!
  const honorairesTotal3Years = totalCascoHorsTva * 0.15 * 0.30;

  // RECURRING YEARLY COSTS - Where do these values come from?
  const precompteImmobilier = 388.38;      // Why 388.38?
  const comptable = 1000;                  // Why €1,000?
  const podioAbonnement = 600;             // Why €600?
  const assuranceBatiment = 2000;          // Why €2,000?
  const fraisReservation = 2000;           // Why €2,000?
  const imprevus = 2000;                   // Why €2,000?

  // ONE-TIME COSTS
  const fraisDossierCredit = 500;          // Why €500?
  const fraisGestionCredit = 45;           // Why €45?
  const fraisNotaireBasePartagee = 5000;   // Why €5,000?
  // This is confusing: another "notaire" fee but different from fraisNotaireFixe!

  // ... rest of function
}
```

### Problem: Missing Justification

```typescript
// Example: User sees "€7,272/year in Frais Généraux" broken down as:
// - Honoraires: €2,100/year (15% × 30% of CASCO)
// - Recurring: €5,172/year
//   - Precompte immobilier: €388.38
//   - Comptable: €1,000
//   - Podio abonnement: €600
//   - Assurance bâtiment: €2,000
//   - Frais réservation: €2,000
//   - Imprévus: €2,000
// - One-time: €545
//   - Frais dossier crédit: €500
//   - Frais gestion crédit: €45
//   - Frais notaire base partagée: €5,000

// Questions users might ask:
// 1. Where do these amounts come from?
// 2. Why 388.38 for precompte? That's oddly specific.
// 3. Why is insurance €2,000/year when my actual insurance is €1,500?
// 4. What is "Frais notaire base partagée" and why is it €5,000?
// 5. Why does it say "notaire" when there's already "Frais notaire" (fraisNotaireFixe)?
```

### Recommendation: Add Documentation

```typescript
/**
 * Get detailed breakdown of frais généraux 3 ans
 * 
 * PROFESSIONAL FEES (Honoraires):
 * = Total CASCO × 15% × 30%
 * Covers: architects, stability experts, PEB reports, etc.
 * Formula source: [cite source - Excel original? Standard practice?]
 * 
 * RECURRING ANNUAL COSTS (3-year total):
 * - Precompte immobilier: €388.38/year (Belgian property tax estimate)
 * - Comptable: €1,000/year (accounting services)
 * - Podio abonnement: €600/year (property management software)
 * - Assurance bâtiment: €2,000/year (building insurance estimate)
 * - Frais réservation: €2,000/year (reserve fund contributions)
 * - Imprévus: €2,000/year (contingency for unexpected costs)
 * 
 * ONE-TIME COSTS (Year 1 only):
 * - Frais dossier crédit: €500 (loan application fees)
 * - Frais gestion crédit: €45 (loan management fee)
 * - Frais notaire base partagée: €5,000 (shared notary fee base - separate from fraisNotaireFixe!)
 */
export function getFraisGenerauxBreakdown(...): FraisGenerauxBreakdown {
  // ...
}
```

---

## Issue 2.2: totalCasco Property Name Misleading

### Current (Confusing)

```typescript
export interface FraisGenerauxBreakdown {
  totalCasco: number;  // <-- What does this mean?
  honorairesYearly: number;
  honorairesTotal3Years: number;
  // ...
}

// How it's calculated:
let totalCascoHorsTva = 0;
for (const participant of participants) {
  const actualCascoSqm = participant.cascoSqm !== undefined ? participant.cascoSqm : participant.surface;
  const cascoHorsTva = actualCascoSqm * projectParams.globalCascoPerM2;
  totalCascoHorsTva += cascoHorsTva * participant.quantity;
}

// Add common building works CASCO (without TVA)
totalCascoHorsTva += calculateTotalTravauxCommuns(projectParams);

// Now use it for honoraires
const honorairesTotal3Years = totalCascoHorsTva * 0.15 * 0.30;

return {
  totalCasco: totalCascoHorsTva,  // Confusing! This is NOT total CASCO
  // ...
};
```

### Why It's Confusing

```typescript
// When code says "totalCasco", a reader thinks:
// "Oh, this is the total CASCO cost for all participants"

// But actually:
// - It's ONLY the CASCO component (no parachèvements)
// - It's HORS TVA (before tax)
// - It includes travaux communs (common building works)
// - It's used ONLY for honoraires calculation (15% × 30%)

// Example:
projectParams.globalCascoPerM2 = 1000;  // €1,000/m²
participants[0].surface = 100;           // 100 m²
participants[0].quantity = 1;

// When code runs:
// totalCascoHorsTva = (100m² × €1,000) + travaux communs
// totalCascoHorsTva = €100,000 + €50,000 (example)
// totalCascoHorsTva = €150,000

// This is returned as "totalCasco: 150000"
// But this value is NOT "total CASCO" - it's specifically 
// "CASCO HORS TVA for honoraires calculation"
```

### Better Naming

```typescript
export interface FraisGenerauxBreakdown {
  totalCascoHorsTva: number;      // Clear: includes TVA rate info
  // or
  totalCascoForHonoraires: number; // Clear: indicates it's for honoraires calc
  honorairesYearly: number;
  honorairesTotal3Years: number;
  // ...
}
```

---

## Issue 3.2: Building Cost Categories Undefined

### Current Confusing Names

```typescript
// In ProjectParams interface:
export interface ProjectParams {
  // ... other fields
  batimentFondationConservatoire: number;  // What's this?
  batimentFondationComplete: number;       // Difference from above?
  batimentCoproConservatoire: number;      // What's "Copro" work?
  // ...
}

// In Excel export:
addCell(travauxRow + 1, 'A', 'Batiment fondation (conservatoire)');
addCell(travauxRow + 1, 'B', projectParams.batimentFondationConservatoire);
addCell(travauxRow + 2, 'A', 'Batiment fondation (complete)');
addCell(travauxRow + 2, 'B', projectParams.batimentFondationComplete);
addCell(travauxRow + 3, 'A', 'Batiment copro (conservatoire)');
addCell(travauxRow + 3, 'B', projectParams.batimentCoproConservatoire);
```

### What Users See

```
TRAVAUX COMMUNS
Batiment fondation (conservatoire):   50,000€
Batiment fondation (complete):        30,000€
Batiment copro (conservatoire):       20,000€
Total travaux communs:               100,000€
Par unité (÷ 4):                      25,000€
```

### Missing Context

Questions users can't answer:
1. What's the difference between "fondation conservatoire" and "fondation complete"?
2. Is "conservatoire" a cost level? A building status?
3. What does "Batiment copro" mean vs "Batiment"?
4. Why are there TWO "conservatoire" categories?
5. When should I use each one?
6. Do they all get split among participants?

### Recommended Documentation

```typescript
/**
 * TRAVAUX COMMUNS (Common Building Works)
 * 
 * These costs cover building-wide structural and common work,
 * divided equally among all participants (÷ number of participants).
 * 
 * batimentFondationConservatoire:
 * - Minimal safety compliance work on building foundation/structure
 * - Emergency stabilization work only
 * - Used when building is occupied and only critical repairs needed
 * - Example: €50,000 for emergency shoring of basement wall
 * 
 * batimentFondationComplete:
 * - Full foundation/structural renovation and upgrade
 * - Complete replacement or major reconstruction
 * - Used when building undergoes full renovation
 * - Example: €30,000 for new foundation reinforcement in renovation
 * 
 * batimentCoproConservatoire:
 * - Shared copropriété building work (roof, common areas, exterior)
 * - Building-wide infrastructure (electrical, plumbing, heating)
 * - Minimal level of upgrade for conservatoire approach
 * - Example: €20,000 for roof repair and electrical safety upgrades
 * 
 * Calculation:
 * - All three categories are summed together
 * - Total is divided equally among all participants
 * - Each participant pays: (conservatoire + complete + copro) ÷ number_of_participants
 */
```

---

## Issue 4.2: CASCO Acronym Never Defined

### Current (No Definition)

```typescript
// In calculatorUtils.ts:
export function calculateCascoAndParachevements(
  unitId: number,
  surface: number,
  unitDetails: UnitDetails,
  globalCascoPerM2: number,
  parachevementsPerM2?: number,
  cascoSqm?: number,
  parachevementsSqm?: number,
  cascoTvaRate: number = 0
): { casco: number; parachevements: number } {
  // Function body
}

// No explanation of what CASCO means
// No indication whether it's an acronym

// Only in UI comments:
// formulaExplanations.ts line 144: "CASCO (gros œuvre)"
```

### What Users Need to Know

```
CASCO = Structural Work (Gros Œuvre in French)

Includes:
- Foundation and structural frame
- Load-bearing walls and columns  
- Roof structure and framing
- Building exterior envelope (exterior walls)
- Building-wide infrastructure support systems
- Does NOT include finishing work

Excludes (included in Parachèvements instead):
- Interior walls and partitions
- Flooring materials
- Interior doors and windows
- Plumbing fixtures and connections
- Electrical wiring and outlets
- HVAC installation
- Interior finishes, paint, etc.

Example calculation:
- Building: 5,000 m² total
- CASCO cost: €1,000/m²
- Total CASCO: 5,000 × €1,000 = €5,000,000
- Each participant's share depends on surface area
```

### Recommended JSDoc

```typescript
/**
 * STRUCTURAL COSTS
 * 
 * CASCO = Structural work (Gros Œuvre)
 * - Foundation, frame, roof structure, exterior envelope
 * - Does NOT include finishing/interior work
 * - Typical range: €800-1,500/m² depending on building type and location
 * 
 * Parachèvements = Finishing work (Finitions)
 * - Interior partitions, flooring, plumbing, electrical, HVAC
 * - Interior finishes, paint, fixtures
 * - Typical range: €400-800/m² depending on quality level
 * 
 * Example:
 *   Surface: 100 m²
 *   CASCO: 100 × €1,000 = €100,000
 *   Parachèvements: 100 × €500 = €50,000
 *   Total personal renovation: €150,000
 */
export function calculateCascoAndParachevements(...) {
  // ...
}
```

---

## Impact of NOT Fixing These Issues

### User Confusion Scenarios

1. **New user question:** "What's the difference between 'Droit d'enregistrements' and 'Frais notaire'?"
   - Current answer: Scattered across code, no single documentation
   - Result: User has to reverse-engineer from formulas

2. **Spreadsheet auditor question:** "Where do the Frais Généraux amounts come from?"
   - Current answer: "They're hardcoded, no source documented"
   - Result: Audit fails, user loses trust

3. **Developer question:** "What does this property 'notaryFeesRate' do?"
   - Current answer: "It calculates droitEnregistrements"
   - Expected answer: "It calculates registration fees"
   - Result: Confusion about variable naming conventions

4. **User entering building costs:** "Should I put €50K in 'Batiment fondation conservatoire' or 'Batiment fondation complete'?"
   - Current answer: No guidance in code
   - Result: User guesses, enters wrong amount

---

## Files Requiring Changes

### CRITICAL (notaryFeesRate rename)
- src/utils/calculatorUtils.ts
- src/components/calculator/ParticipantDetailsPanel.tsx
- src/components/calculator/ParticipantDetailModal.tsx
- src/components/EnDivisionCorrect.tsx
- src/utils/formulaExplanations.ts
- src/types/cashFlow.ts
- src/types/timeline.test.ts
- src/integration/portage-workflow.test.ts
- src/integration/portage-entrydate-recalc.test.ts
- src/hooks/useParticipantOperations.ts
- src/hooks/useExpectedPaybacks.ts
- src/utils/scenarioFileIO.ts
- All test files with Participant fixtures

### HIGH (Documentation & Renaming)
- src/utils/excelExport.ts (header change)
- src/utils/calculatorUtils.ts (totalCasco → totalCascoHorsTva, add frais généraux docs)
- src/components/calculator/ParticipantDetailsPanel.tsx (clarify labels)

### MEDIUM (Minor Improvements)
- src/utils/formulaExplanations.ts (CASCO definition)
- Various components (use full "Droit d'enregistrements" label)

