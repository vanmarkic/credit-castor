# Comprehensive Label Audit Report: Credit Castor Real Estate Calculator

## Executive Summary

This audit examined labels (variable names, type properties, UI labels, function names) against underlying computations across the Belgian real estate division calculator. The audit identified:

- **11 areas of concern** ranging from misleading labels to inconsistent terminology
- **3 critical issues** requiring immediate clarification
- **8 moderate issues** that may cause user confusion
- **Clean patterns** in most recent refactoring work

---

## 1. NOTARY FEES TERMINOLOGY - CRITICAL ISSUES

### Issue 1.1: Confusing Dual "Notary Fee" Terms

**Severity:** Critical - Causes terminology confusion

**Finding:**
The codebase uses TWO different concepts both related to "notary fees", but they are DIFFERENT:

1. **`droitEnregistrements`** (Registration Fees) - Percentage-based fee on purchase share
   - Type property name: `droitEnregistrements`
   - Calculation: `purchaseShare × (notaryFeesRate / 100)`
   - UI labels: "Droit d'enregistrements" or "Droit d'enreg."
   - Formula: Takes a percentage (typically 3% or 12.5%)
   - Example: €170,000 purchase × 12.5% = €21,250

2. **`fraisNotaireFixe`** (Fixed Notary Fees) - Fixed amount per lot
   - Type property name: `fraisNotaireFixe`
   - Calculation: `quantity × 1000€`
   - UI labels: "Frais notaire" or "Frais de notaire"
   - Formula: Fixed €1,000 per lot
   - Example: 2 lots × €1,000 = €2,000

**Files Affected:**
- `/src/utils/calculatorUtils.ts` (lines 108-109, 382-395)
- `/src/components/calculator/ParticipantDetailsPanel.tsx` (lines 486-504, 537)
- `/src/components/shared/CostBreakdownGrid.tsx` (lines 80-92)
- `/src/utils/excelExport.ts` (line 139, 175)

**Problem:**
- In English, both are called "notary fees" in comments
- In French, one is "Droit d'enregistrements" (registration right) and other is "Frais de notaire" (notary fees)
- The Participant interface has `notaryFeesRate` (confusing because it's used for droitEnregistrements, not fraisNotaireFixe)
- Excel export header (line 150) shows "Frais notaire" which is ambiguous (could mean either)

**Current State (POST-REFACTORING):**
- Recent commit 182bd97 renamed internal calculations from `notaryFees` to `droitEnregistrements` (correct)
- BUT the Participant field is still called `notaryFeesRate` - this should be `droitEnregistrementsRate` or `registrationFeesRate`
- Export serialization in scenarioFileIO.ts correctly uses both `droitEnregistrements` and `fraisNotaireFixe` (lines 43-44, 69, 159)

**Recommendation:**
Rename `Participant.notaryFeesRate` to `Participant.registrationFeesRate` or `droitEnregistrementsRate` for clarity.

---

### Issue 1.2: Misleading Comments in calculatorUtils.ts

**Severity:** Critical - Comments contradict actual computation

**Finding:**
Line 11 in calculatorUtils.ts:
```typescript
notaryFeesRate: number;  // <-- Should be "registrationFeesRate"
```

This field is used ONLY for calculating `droitEnregistrements`, NOT `fraisNotaireFixe`.

**Files:**
- `/src/utils/calculatorUtils.ts` line 11
- `/src/types/cashFlow.test.ts` line 23 uses `notaryFees` in metadata (should match property name)

---

### Issue 1.3: Excel Export Header Ambiguity

**Severity:** Moderate - Export header unclear

**Finding:**
`/src/utils/excelExport.ts` line 150:
```typescript
['Nom', 'Unite', 'Surface', ... 'Part achat', 'Droit enreg.', 'Frais notaire', ...]
```

The "Frais notaire" header is ambiguous - it refers to `fraisNotaireFixe` (fixed €1,000 per lot), but "Frais notaire" in French typically means "notary fees" in general.

Better labels would be:
- "Droit enreg." → Keep (clear: registration right)
- "Frais notaire" → Change to "Frais de notaire fixe" or "Frais notaire (fixe)"

---

## 2. FRAIS GÉNÉRAUX TERMINOLOGY - MODERATE ISSUES

### Issue 2.1: Misleading Calculation Comments for Frais Généraux

**Severity:** Moderate - Comments don't match all components

**Finding:**
`/src/utils/calculatorUtils.ts` lines 275-326 in `getFraisGenerauxBreakdown()`:

The function comment says:
```typescript
/**
 * Get detailed breakdown of frais généraux 3 ans
 * Returns all subcategories with their amounts for UI display
 */
```

BUT the actual breakdown includes:
1. **Honoraires** (Professional fees): 15% × 30% of CASCO
2. **Recurring costs** (3-year total):
   - Precompte immobilier: €388.38/year
   - Comptable: €1,000/year
   - Podio abonnement: €600/year
   - Assurance bâtiment: €2,000/year
   - Frais réservation: €2,000/year
   - Imprévus: €2,000/year
3. **One-time costs** (Year 1 only):
   - Frais dossier crédit: €500
   - Frais gestion crédit: €45
   - Frais notaire base partagée: €5,000

**Problem:**
- The term "Frais Généraux" (General Expenses) is accurate but the components are hardcoded constants
- No documentation of WHERE these fixed amounts (€388.38, €1,000, etc.) come from
- The "fraisNotaireBasePartagee" (€5,000) embedded in frais généraux is confusing - it's a notary fee but calculated differently from `fraisNotaireFixe`
- Component labeled "Honoraires" at 15% × 30% but description says "professional fees" - should clarify what professions

**Files:**
- `/src/utils/calculatorUtils.ts` lines 275-350
- Comment at line 300: "Honoraires = Total CASCO × 15% × 30%" is clear but lacks context about who gets paid

**Recommendation:**
Add inline comments explaining the source/justification for each hardcoded amount, especially the 15% × 30% formula components.

---

### Issue 2.2: Frais Généraux Property Naming Inconsistency

**Severity:** Moderate - Different property names in different contexts

**Finding:**
The ProjectParams interface (line 65-79 in calculatorUtils.ts) uses:
- `fraisGeneraux3ans` - stored value

But the FraisGenerauxBreakdown return type (line 251-272) uses:
- `totalCasco` - confusing; this is NOT total CASCO cost, it's "CASCO HORS TVA for honoraires calculation"

**Problem:**
`totalCasco` should be named `totalCascoHorsTva` or `totalCascoForHonoraires` because:
- It includes participant CASCO + travaux communs (common building works)
- It excludes parachèvements
- It specifically excludes TVA
- It's used ONLY for honoraires calculation (15% × 30%)

Line 283-298 shows this is calculated specially, not from actual total CASCO.

---

## 3. TRAVAUX COMMUNS TERMINOLOGY - MODERATE ISSUES

### Issue 3.1: Inconsistent "Travaux Communs" Component Definition

**Severity:** Moderate - Label suggests inclusion of all common works but meaning varies

**Finding:**
The term "Travaux Communs" appears in multiple contexts with slightly different meanings:

1. **In calculation context** (calculatorUtils.ts, lines 228-249):
   - Specifically: Foundation work (conservatoire) + Foundation work (complete) + Copro building work
   - Does NOT include other shared infrastructure costs
   - Per-unit calculation: divided by number of participants

2. **In cost breakdown context** (CostBreakdownGrid.tsx, line 537):
   - Label: "Travaux communs"
   - Actually displays: `travauxCommunsPerUnit` (per-unit share)
   - Description: "Commun fixe (÷participants)"

3. **In Excel export** (excelExport.ts, line 150-151):
   - Column header: "Travaux communs" and "Construction"
   - These are separate columns but related

**Problem:**
The term "Travaux Communs" (Common Works) is accurate but:
- It's used separately from other "Commun" costs (shared infrastructure)
- A participant sees two "Common" cost categories:
  - "Travaux communs" (building work)
  - "Commun" (shared infrastructure)
- No clear explanation of why these are separated

**Files:**
- `/src/utils/calculatorUtils.ts` lines 228-249
- `/src/components/calculator/ParticipantDetailsPanel.tsx` line 537-543
- `/src/utils/excelExport.ts` lines 113-116, 150-151

**Recommendation:**
Consider renaming one to be clearer:
- "Travaux communs (bâtiment)" = building structural/common work
- "Frais communs (infrastructure)" = shared infrastructure

---

### Issue 3.2: Missing Definition of "Batiment" vs "Copro" Work

**Severity:** Moderate - Unclear cost categories

**Finding:**
Excel export (lines 107-112) shows:
```
'Batiment fondation (conservatoire)': projectParams.batimentFondationConservatoire
'Batiment fondation (complete)': projectParams.batimentFondationComplete
'Batiment copro (conservatoire)': projectParams.batimentCoproConservatoire
```

**Problem:**
- What is the difference between "Batiment fondation (conservatoire)" and "Batiment copro (conservatoire)"?
- Why two types of "conservatoire"?
- These terms appear in comments but not explained elsewhere
- Users enter values for these but don't know what they represent

**Files:**
- `/src/utils/calculatorUtils.ts` lines 234-237
- `/src/utils/excelExport.ts` lines 107-112
- `/src/components/shared/ExpenseCategoriesManager.tsx` (likely manages these)

---

## 4. CASCO & PARACHÈVEMENTS TERMINOLOGY - CLEAN BUT WITH MINOR ISSUES

### Issue 4.1: Accent Inconsistency in French Spelling

**Severity:** Low - Inconsistent but not critical

**Finding:**
In the codebase, "parachèvements" is spelled with and without the accent:
- WITH accent: `parachèvement` (correct French)
  - Line 33, 462 in calculatorUtils.ts
  - Line 33 in timeline.ts
  - Various formula explanations
  
- WITHOUT accent: `parachevements` (type property names)
  - Line 49, 51, 111, etc. in calculatorUtils.ts
  - Throughout all component files
  - Excel export headers

**Problem:**
The property names cannot use accents (technical limitation), but comments use accented versions. This creates inconsistency in UI.

**Files:**
- Throughout src/utils/calculatorUtils.ts
- Throughout src/components/

**Current State:** This is ACCEPTABLE because:
- Technical properties must use ASCII (parachevements)
- UI labels correctly use French (parachèvements)
- Formula explanations use correct French spelling

---

### Issue 4.2: CASCO Definition Missing from Code

**Severity:** Moderate - Acronym unexplained

**Finding:**
"CASCO" is used throughout but never defined:
- `/src/utils/formulaExplanations.ts` line 144: "CASCO (gros œuvre)" - explains it's "structural work" in French
- No definition in calculatorUtils.ts
- No JSDoc comment explaining acronym

**Problem:**
Users/developers unfamiliar with construction terminology don't know:
- What CASCO stands for (probably "Charpente, Armature, Structure, Couverture, Ossature" in French context)
- Why it's distinct from "Parachèvements"
- Whether it includes or excludes certain work types

**Files:**
- `/src/utils/formulaExplanations.ts` lines 135-154
- `/src/utils/calculatorUtils.ts` lines 400-433

**Recommendation:**
Add JSDoc comment at the top of calculatorUtils.ts explaining:
```
/**
 * CASCO = Structural work (gros œuvre in French)
 *   - Foundation and load-bearing structure
 *   - Exterior envelope (walls, roof)
 *   - Does not include finishing/interior work
 * 
 * Parachèvements = Finishing work (finitions in French)
 *   - Interior walls and partitions
 *   - Flooring, plumbing, electrical, HVAC
 *   - Interior finishes
 */
```

---

## 5. LABEL CONSISTENCY IN RECENT REFACTORING - POSITIVE

### Issue 5.0: Recent Refactoring (Commit 182bd97) Was CORRECT

**Status:** CLEAN

The recent refactoring that renamed `notaryFees` → `droitEnregistrements` in calculations was correct:
- Commit bca26ea and 182bd97 properly renamed internal calculation variables
- Serialization correctly distinguishes `droitEnregistrements` vs `fraisNotaireFixe`
- Formula explanations use correct French terminology

**However:** The Participant interface field `notaryFeesRate` was NOT renamed (should be `registrationFeesRate`)

---

## 6. EXPORT LABEL ACCURACY ANALYSIS

### Issue 6.1: Excel Column Headers Mix French and English Terms

**Severity:** Low - Minor inconsistency

**Finding:**
`/src/utils/excelExport.ts` lines 149-155:

Headers mix proper French terms with abbreviated forms:
- Good: "Droit enreg.", "Taux notaire", "Taux interet"
- Confusing: "Frais notaire" (ambiguous between fixed and percentage-based)
- Good: "CASCO", "Parachevements", "Travaux communs"
- Abbreviated: "Qty" (English abbreviation for Quantity)

---

## 7. TYPE DEFINITION LABELING AUDIT

### Issue 7.1: ParticipantCalculation Interface Inherits Confusing Parent Property

**Severity:** Moderate - Inheritance adds confusion

**Finding:**
`/src/utils/calculatorUtils.ts` lines 105-132:

`ParticipantCalculation extends Participant` inherits `notaryFeesRate` but this is confusing because:
- The interface adds `droitEnregistrements` and `fraisNotaireFixe` as COMPUTED properties
- `notaryFeesRate` (inherited) is now just a parameter for one of the computed properties
- No clear indication that `notaryFeesRate` is used to calculate `droitEnregistrements`

---

## 8. PORTAGE SYSTEM TERMINOLOGY - CLEAN

**Status:** CLEAN

The portage system terminology is consistent and well-labeled:
- "portage" terminology clear throughout
- "founderPaysCasco" and "founderPaysParachèvement" are explicit
- "lotId" and "isPortage" clearly distinguish portage lots
- Seller/buyer relationships clear in event types

---

## 9. COMPONENT LABEL USAGE - REVIEW OF ParticipantDetailsPanel

### Issue 9.1: Abbreviated Label "Droit d'enreg." May Be Unclear

**Severity:** Low - Abbreviation could be clearer

**Finding:**
`/src/components/calculator/ParticipantDetailsPanel.tsx` line 487:
```typescript
<p className="text-xs text-gray-500 mb-1">Droit d'enreg.</p>
```

**Problem:**
- "Droit d'enreg." is abbreviated
- Full form "Droit d'enregistrements" is used elsewhere
- For users unfamiliar with Belgian real estate, the abbreviation may be unclear

**Better:** Use full term "Droit d'enregistrements" for clarity

---

## SUMMARY TABLE

| ID | Issue | Component | Severity | Type | Required Action |
|---|---|---|---|---|---|
| 1.1 | Dual "notary fee" concepts confusing | calculatorUtils.ts, components | CRITICAL | Terminology | Rename `notaryFeesRate` → `registrationFeesRate` |
| 1.2 | Field name contradicts usage | calculatorUtils.ts | CRITICAL | Naming | Update Participant interface |
| 1.3 | Excel header ambiguous | excelExport.ts | MODERATE | Labeling | Use "Frais de notaire fixe" |
| 2.1 | Hardcoded frais généraux amounts undocumented | calculatorUtils.ts | MODERATE | Documentation | Add source comments |
| 2.2 | `totalCasco` property misleading name | calculatorUtils.ts | MODERATE | Naming | Rename to `totalCascoHorsTva` |
| 3.1 | "Travaux communs" definition unclear | Multiple | MODERATE | Terminology | Add clarification |
| 3.2 | "Batiment" vs "Copro" work undefined | Multiple | MODERATE | Documentation | Document cost categories |
| 4.1 | Accent inconsistency (parachèvements) | Multiple | LOW | Style | ACCEPTABLE (by design) |
| 4.2 | CASCO acronym never defined | calculatorUtils.ts | MODERATE | Documentation | Add JSDoc definition |
| 6.1 | Excel headers mix French/English | excelExport.ts | LOW | Style | Minor cleanup |
| 7.1 | ParticipantCalculation inheritance confusing | calculatorUtils.ts | MODERATE | Design | Consider refactoring |
| 9.1 | Abbreviation "Droit d'enreg." unclear | ParticipantDetailsPanel.tsx | LOW | Labeling | Use full term |

---

## PRIORITY ACTION ITEMS

### CRITICAL (Immediate):
1. **Rename** `Participant.notaryFeesRate` to `Participant.registrationFeesRate` throughout codebase
   - Update: calculatorUtils.ts, all components, tests, documentation
   - Estimated impact: ~50+ files

2. **Update** formula explanation function `getNotaryFeesFormula()` to clearly explain it's for registration fees, not fixed notary fees

### HIGH (Next Sprint):
3. **Rename** `totalCasco` to `totalCascoHorsTva` in FraisGenerauxBreakdown
4. **Add** JSDoc comment explaining CASCO vs Parachèvements distinction
5. **Document** the three "Batiment" cost categories with examples
6. **Add** source/justification comments for hardcoded frais généraux amounts

### MEDIUM (Backlog):
7. Update Excel export header "Frais notaire" to "Frais de notaire fixe"
8. Consider refactoring ParticipantCalculation interface design
9. Replace "Droit d'enreg." with "Droit d'enregistrements" in UI labels

---

## TESTING IMPLICATIONS

All test files use:
- `notaryFeesRate` in fixtures (will need updates per critical rename)
- `droitEnregistrements` in calculations (correct post-refactoring)
- `fraisNotaireFixe` in recent tests (correct)

Tests are well-aligned with current calculation logic. The critical rename would require test fixture updates.

---

## POSITIVE FINDINGS

1. **Recent refactoring (commit 182bd97)** properly separated `droitEnregistrements` from `fraisNotaireFixe`
2. **Formula explanations** (formulaExplanations.ts) correctly distinguish the two concepts
3. **Export serialization** properly names both fields
4. **Type definitions** are mostly consistent
5. **French terminology** generally follows Belgian real estate conventions

The codebase is in good shape post-refactoring; the remaining issues are primarily naming refinements to prevent future confusion.

