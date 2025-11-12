# Label Audit Documentation Index

This folder contains a comprehensive audit of variable names, type properties, UI labels, and function names in the Credit Castor real estate calculator, compared against the underlying computations.

## Documents in This Audit

### 1. Main Audit Report
**File:** `label-audit-2025-11-12.md`

Complete audit findings organized by topic:
- Executive summary
- 11 identified issues (critical, moderate, low severity)
- Detailed analysis of each issue
- Impact assessment
- Positive findings
- Testing implications

**Start here** for the comprehensive overview.

### 2. Code Examples & Detailed Findings
**File:** `label-audit-code-examples.md`

Concrete code examples showing each issue:
- Current problematic code
- Why it's confusing
- Recommended fixes with examples
- File list for each fix
- Impact scenarios (what happens if NOT fixed)

**Use this** when implementing fixes or for detailed understanding.

### 3. Quick Reference Summary
**File:** None (printed to console)

Quick checklist format covering:
- Critical issues
- Moderate issues
- Low severity issues
- Action items
- Positive findings

**Use this** for quick daily reference.

---

## Key Findings at a Glance

### Critical Issues (3)
1. **Dual "Notary Fee" Terminology** - `notaryFeesRate` used only for droitEnregistrements but suggests it applies to all notary fees
2. **Excel Header Ambiguous** - "Frais notaire" unclear (refers to fixed €1,000/lot but could mean percentage-based)
3. **Refactoring Incomplete** - Recent commit properly separated droitEnregistrements from fraisNotaireFixe, but Participant interface field not renamed

### Moderate Issues (8)
- Frais généraux components undocumented (€388.38, €1,000, hardcoded with no source)
- Property naming: `totalCasco` misleading (should be `totalCascoHorsTva`)
- Travaux communs definition unclear (why separate from "Commun" costs?)
- Building cost categories undefined ("Batiment fondation conservatoire" vs "complete"?)
- CASCO acronym never explained in code
- ParticipantCalculation inheritance confusing
- And more (see full report)

### Low Severity Issues (3)
- Abbreviated label "Droit d'enreg." unclear
- Mixed French/English in Excel headers
- Minor refactoring opportunities

### Positive Findings (5)
- Recent refactoring properly separated fees
- Portage system terminology clear
- Formula explanations correct
- Type definitions mostly consistent
- French terminology follows conventions

---

## How to Use This Audit

### For Understanding Current Issues
1. Read the Executive Summary in `label-audit-2025-11-12.md`
2. Find your topic in the "DETAILED FINDINGS" sections
3. Cross-reference with `label-audit-code-examples.md` for code examples

### For Fixing Issues
1. Identify which issue affects your work
2. Check the "Recommendation" section in the main report
3. Review code examples in the examples file
4. Check "Files Affected" for scope of changes
5. Refer to "Testing Implications" for test updates needed

### For Code Review
1. Use the Priority Action Items checklist
2. Reference the issue descriptions when reviewing PRs
3. Point developers to specific issue sections
4. Use code examples to show correct vs incorrect patterns

---

## Priority Action Plan

### CRITICAL (Start Here)
- [ ] Rename `Participant.notaryFeesRate` → `registrationFeesRate` (50+ files)
- [ ] Update `getNotaryFeesFormula()` to clarify it's for registration fees

### HIGH (Next Sprint)
- [ ] Update Excel header "Frais notaire" → "Frais de notaire fixe"
- [ ] Rename `totalCasco` → `totalCascoHorsTva`
- [ ] Add JSDoc for CASCO definition
- [ ] Document building cost categories
- [ ] Document frais généraux amounts with sources

### MEDIUM (Backlog)
- [ ] Use full "Droit d'enregistrements" label
- [ ] Clarify travaux communs terminology
- [ ] Translate "Qty" to French

### BACKLOG
- [ ] Refactor ParticipantCalculation interface

---

## French Real Estate Terms Reference

This audit covers Belgian real estate terminology. Key terms explained:

- **Droit d'Enregistrements** = Registration fee (percentage-based on purchase price)
- **Frais de Notaire** = Notary fees (fixed or percentage-based)
- **Frais Notaire Fixe** = Fixed notary fees (€1,000 per lot)
- **Frais Généraux** = General expenses (3-year operating costs)
- **CASCO** = Structural work (Gros Œuvre)
- **Parachèvements** = Finishing work (Finitions)
- **Travaux Communs** = Common/shared building works
- **Portage** = Property holding/transfer mechanism
- **Copropriété** = Co-ownership

---

## File Impact Summary

### Files Most Affected
- `src/utils/calculatorUtils.ts` - Core calculations, type definitions
- `src/components/calculator/ParticipantDetailsPanel.tsx` - UI labels
- `src/components/shared/CostBreakdownGrid.tsx` - UI labels
- `src/utils/excelExport.ts` - Export headers and structure
- `src/utils/formulaExplanations.ts` - User-facing explanations

### Test Impact
- ~40+ test fixture files use `notaryFeesRate`
- No test logic changes needed (only property names)
- All calculation tests already correct

---

## Related Documentation

- CLAUDE.md - Project guidelines and architecture
- /src/utils/calculatorUtils.ts - Implementation details
- /src/utils/formulaExplanations.ts - Current formula docs
- /docs/development/ - Other implementation notes

---

## Questions?

If you have questions about specific findings:
1. Check the issue number in the summary table
2. Read the detailed section in `label-audit-2025-11-12.md`
3. Review code examples in `label-audit-code-examples.md`
4. Check the "Files Affected" list

---

Audit Date: November 12, 2025
Audit Scope: Very Thorough
Codebase: Credit Castor v1.16.0
