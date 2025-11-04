# Business Logic - Validated Understanding

**Created**: 2025-11-03
**Status**: Validated with user answers
**Source**: [business-logic-assertions.md](./business-logic-assertions.md)

---

## Executive Summary

This document captures the validated business logic for Credit Castor based on user confirmation. It also identifies **critical cleanup work** needed to align the codebase with actual requirements.

### Critical Findings

1. **Event sourcing was completely dropped** - Must remove all event sourcing code and tests
2. **Legacy fields must be removed** - Only `lotsOwned` array should be used going forward
3. **Scenario tweaking features should be removed** - `purchasePriceReduction`, `constructionCostChange`, `infrastructureReduction`
4. **Terminology correction** - "Notary fees" are actually "registration fees" (taxes paid to government)
5. **Portage is Gen1→Gen2 only** - Founders/copropriété sell to newcomers, no resales beyond that
6. **Dynamic pricing model** - Not the MVP estimate (1377€/m²), but based on actual costs

---

## Validated Business Logic

### 1. Purchase & Division

✅ **Purchase price division**: Surface area × price per m²

✅ **Registration fees (not notary fees)**:
- 3% for some participants (first-time buyers, specific situations)
- 12.5% for others (standard Wallonia rate)
- These are **taxes paid to the government**, not fees paid to the notary
- **Real notary fees** (paid to the notary) will be added later

✅ **Surface field**: Represents TOTAL surface area (already multiplied by quantity in legacy code)

❌ **Scenario reductions**: Should be removed (`purchasePriceReduction`, `infrastructureReduction`)

### 2. Construction Costs

✅ **CASCO costs**: Always use global `globalCascoPerM2` (no participant overrides)

✅ **Parachèvements costs**: Can be customized per participant via `parachevementsPerM2`, else fall back to `unitDetails`

✅ **Partial renovation**: Participants can specify `cascoSqm` and `parachevementsSqm` less than total surface

✅ **Travaux communs distribution**: Divided by participant **unit quantity**, not surface
- May become hybrid (part quotité, part quantity) in future
- Same applies to recurring costs (appel de fonds, fonds de réserve)

❌ **ConstructionCostChange**: Should be removed (scenario tweaking feature)

### 3. Frais Généraux (General Expenses)

✅ **3-year coverage**: Represents construction period duration for professional fee calculation

✅ **Formula**: `(Total CASCO × 15% × 30%) + recurring costs × 3 years + one-time costs`
- **15% × 30% = Architects fees only** (not all professionals)
- Total CASCO includes personal units + travaux communs
- ⚠️ User needs to double-check this calculation

✅ **Recurring costs**: Include:
- Property tax: 388.38€/year (all properties, not just empty ones)
- Accountant: 1000€/year
- Podio: 600€/year
- Building insurance: 2000€/year (total, divided by quotité)
- Reservation fees: 2000€/year
- Contingencies: 2000€/year
- **Plus** syndic fees (copropriété management) if applicable
- **Plus** charges communes (water, electricity, cleaning, maintenance) if applicable

### 4. Shared Costs Distribution

⚠️ **All consolidated into "commun"**: Legacy infrastructure fields disappeared
- See expense categories image in assertions doc
- No more tweaking via scenario reductions

### 5. Loan & Financing

✅ **Loan amount**: `Total cost - capital contributed`

✅ **Individual terms**: Each participant can have different interest rate and duration

✅ **Monthly payment**: Standard mortgage PMT formula with monthly compounding (to be verified later)

✅ **Financing ratio**: `(loan amount / total cost) × 100`

### 6. Portage Calculations (Resale Pricing)

✅ **Portage scope**: **Only Generation 1 → Generation 2**
- Founders or copropriété sell to newcomers
- **No resale tracking for Gen 2+** (not in scope)
- Purpose: Reward founders for taking initial risk, not create full resale market

✅ **Resale price components**:
```
Base acquisition cost
+ Indexation
+ Carrying cost recovery
+ Renovations
+ Recovery of registration fees
+ Recovery of frais communs
+ Recovery of recurring costs
+ Recovery of loan interest
```

⚠️ **Base acquisition cost needs verification**: User asks to explain how it's calculated in code
- Current code: `originalPurchaseShare + originalNotaryFees + originalConstructionCost`
- User indicates it should include more (all costs founder paid)

✅ **Indexation**: **Not fixed 2%** - tied to Belgian government legal index
- User can provide index values for each year if needed

✅ **Carrying costs**: All recurring costs associated with holding:
- Monthly loan interest
- Property tax (388.38€/year - all properties, not just empty)
- Building insurance (2000€/year total ÷ quotité)
- Syndic fees (copropriété management)
- Charges communes (utilities, maintenance, etc.)

✅ **Carrying cost recovery**: Configurable percentage (default 100%)

✅ **Years held**: Fractional time between founder's purchase (deed date) and sale to newcomer

✅ **Copropriété vs Founder lots**:
- **Founder lots**: Base includes all taxes/fees paid at initial purchase
- **Copropriété lots**: Base calculated differently (less taxes since not "real estate" until revealed)

### 7. Copropriété Lots

✅ **Hidden lots origin**: Part of 2000sqm industrial space requiring permit conversion
- Property has ~500sqm already designated for housing
- Plus 2000sqm industrial space that can be converted with permit
- Permit can be enacted within 3 years of initial purchase
- Hidden lots must be declared in acte de base max 3 years after permit granted

✅ **Sale proceeds redistribution**:
- Goes to all **coowners at moment of sale** (not including buyer)
- Buyer pays copropriété, increasing its total value (benefits all including buyer)
- Coowners can use proceeds to: reduce loans, withdraw cash, or leave for future expenses

✅ **Quotité (ownership share)**:
- **Simplified**: `participant surface / total building surface`
- **Reality**: Defined in copropriété deed, influenced by lot type, location, etc. (not strictly proportional)

✅ **Surface flexibility**:
- **Founder lots**: Surface **imposed** (fixed in acte de base, changes require costs/renovation)
- **Copropriété lots**: Surface **free choice** (within available lot surface)
- **Timing factor**: Earlier buyers have more flexibility; less flexibility as renovation progresses

✅ **Pricing model**:
- **Dynamic pricing** based on actual costs incurred
- Depends on: number of participants, renovation completion, costs to date
- ❌ **Not** the MVP estimate (1377€/m² + 5% carrying cost)

### 8. Timeline & Ownership

❌ **Event sourcing**: **COMPLETELY DROPPED** - must remove all related code and tests
- May use state machine later, but not event sourcing

✅ **Founders**: Participants who entered at deed date (`isFounder: true`, `entryDate` = deed date)
- Invested time and effort from start
- Most/all did this

✅ **Lot acquisition tracking**:
- **Founders' lots**: Track acquisition date for portage pricing
- **Newcomers' lots**: No acquisition dates (no portage resale capability)

✅ **Multiple lot ownership**: Via `lotsOwned` array
- Better representation of reality
- More flexible and scalable

### 9. Data Model Migration

❌ **Remove all legacy fields**:
- Remove: `unitId`, `surface`, `quantity`
- Keep only: `lotsOwned` array
- No backward compatibility needed

---

## Action Items - Critical Cleanup

### Priority 1: Remove Event Sourcing
- [ ] Delete all event sourcing types and interfaces
- [ ] Remove event sourcing related code in utils
- [ ] Delete event sourcing tests
- [ ] Clean up timeline.ts to remove event types
- [ ] Document what event sourcing was intended for (historical context)

### Priority 2: Remove Legacy Fields
- [ ] Remove `unitId`, `surface`, `quantity` from Participant interface
- [ ] Update all calculations to use `lotsOwned` array
- [ ] Update all tests to use new data model
- [ ] Create migration guide if there's existing data

### Priority 3: Remove Scenario Tweaking Features
- [ ] Remove `purchasePriceReduction` from Scenario interface
- [ ] Remove `infrastructureReduction` from Scenario interface
- [ ] Remove `constructionCostChange` from Scenario interface
- [ ] Update calculations to remove scenario adjustments
- [ ] Update tests to remove scenario variations

### Priority 4: Fix Terminology
- [ ] Rename "notaryFeesRate" to "registrationFeesRate" or "taxRate"
- [ ] Update all variables: `notaryFees` → `registrationFees`
- [ ] Add TODO comments for future real notary fees
- [ ] Update UI labels and documentation

### Priority 5: Verify Calculations
- [ ] Verify frais généraux formula with user (15% × 30% for architects)
- [ ] Verify base acquisition cost includes all founder costs
- [ ] Verify PMT loan formula implementation
- [ ] Document Belgian legal indexation requirements

### Priority 6: Update Portage Pricing
- [ ] Update carrying costs to include all recurring costs (syndic, charges communes)
- [ ] Implement difference between founder lots vs copropriété lots (tax treatment)
- [ ] Replace fixed 2% indexation with Belgian legal index
- [ ] Update base acquisition cost to include all founder costs

### Priority 7: Update Copropriété Pricing
- [ ] Remove MVP hardcoded estimates (1377€/m², 5% carrying)
- [ ] Implement dynamic pricing based on actual costs
- [ ] Factor in: number of participants, renovation progress, actual costs incurred

---

## Questions Requiring Clarification

### Q1: Base Acquisition Cost Components ✅ ANSWERED
**User clarification**: "Where does it come from, where is it in the UI?"

**Current code** (`calculateResalePrice` in portageCalculations.ts):
```typescript
const totalAcquisitionCost = originalPurchaseShare + originalNotaryFees + originalConstructionCost;
```

**UI Location**: Not explicitly shown as "base acquisition cost" in UI. The relevant costs are:
- Purchase share (divided by surface)
- Registration fees (3% or 12.5%)
- Construction costs (CASCO + parachèvements + travaux communs)
- Frais communs (see expense categories below)

**Action**: Verify if base acquisition cost needs to be displayed in portage pricing breakdown

### Q2: Frais Généraux Formula ✅ ANSWERED
**User confirmed**: "They are all added up and then divided among the participants, at equal rate"

**Expense Categories** (from UI):
- CONSERVATOIRE: 78,000€
- HABITABILITE SOMMAIRE: 7,000€
- PREMIER TRAVAUX: 18,850€
- FRAIS GÉNÉRAUX ÉTALÉS SUR 3 ANS: 83,897€ (calculated automatically)

**Total commun**: 187,747€ → **37,549€ per person**

**Formula confirmed**:
1. Sum all expense categories (conservatoire + habitabilité + premier travaux)
2. Add frais généraux: (Total CASCO × 15% × 30%) + recurring costs × 3 years + one-time costs
3. Divide total equally among participants

### Q3: Quotité Calculation ✅ ANSWERED
**User decision**: "Auto calculated"

**Implementation**: Keep current model
- Quotité = `participant surface / total building surface`
- No user override needed
- Note: In real acte de base, can be influenced by other factors (lot type, location)

### Q4: Travaux Communs Future Distribution ✅ ANSWERED
**User decision**: "Yes" - design for future hybrid model

**Action**: Create architecture to support:
- Current: Division by quantity (number of units)
- Future: Hybrid formula (part quotité, part quantity)
- Design should make this configurable without major refactoring

---

## Belgian Real Estate Context

### Property Details
- **Total surface**: ~500sqm designated for housing + 2000sqm industrial (requires permit)
- **Permit timeline**: Can be enacted within 3 years of initial purchase
- **Acte de base timeline**: Hidden lots must be declared max 3 years after permit granted
- **Hidden lots**: Created from unclaimed surface, divided into lots for future sale

### Wallonia Registration Fees
- **3%**: First-time buyers, specific situations
- **12.5%**: Standard rate
- **Note**: Different from Flanders and Brussels

### Property Tax
- **388.38€/year**: Current property value-based tax
- **Applies to**: All properties (not just empty ones)
- **Name**: Précompte immobilier

### Building Insurance
- **2000€/year**: Total building insurance
- **Distribution**: Divided by quotité among all participants

### Professional Fees
- **Architects**: 15% × 30% of total CASCO over 3 years
- **Other professionals**: Not yet included (stability, PEB, etc.)
- **Duration**: ~3 years typical construction period

### Q5: Transaction Delta Calculation ✅ VALIDATED

**Related**: See Q2 for frais généraux calculation, Q6 for portage pricing details

**Implementation Plan**: See `docs/plans/2025-11-04-transaction-driven-timeline-implementation.md`

**User decision**: Transactions are explicit domain objects with calculated deltas

**Implementation**:
- Portage sale delta = seller receives lot price, reduces total cost by that amount
- Buyer purchase delta = buyer pays lot price, increases total cost by that amount
- Lot price calculated using portageCalculations formula at buyer's entry date
- Copro sale delta = shared costs redistributed among participants (⚠️ currently stub/placeholder)
- Transaction object embedded in timeline snapshot
- Business logic in utils/transactionCalculations.ts (pure functions)
- View layer calls transaction functions reactively during snapshot generation

**Formula Reference**:

**Lot Price Calculation**:
```
totalAcquisitionCost = originalPurchaseShare + originalNotaryFees + originalConstructionCost
indexation = totalAcquisitionCost × [(1 + rate/100)^yearsHeld - 1]  // compound interest
carryingCostRecovery = monthlyCarryingCosts × monthsHeld × recoveryPercent / 100
lotPrice = totalAcquisitionCost + indexation + carryingCostRecovery + renovations
```

**Carrying Costs** (per month):
```
loanAmount = totalAcquisitionCost - capitalContributed
monthlyInterest = loanAmount × annualRate / 12 / 100
monthlyTax = 388.38 / 12  // Belgian property tax
monthlyInsurance = 2000 / 12  // Building insurance (shared)
monthlyCarryingCosts = monthlyInterest + monthlyTax + monthlyInsurance
```

**Parameters**:
- Years held: Fractional time between seller's entry date and buyer's entry date
- Recovery percent: Configurable (default 100%)
- Indexation rate: From formula params (not hardcoded 2%)

---

## Next Steps

1. **Immediate**: Review this document for accuracy
2. **Get clarifications**: Answer Q1-Q4 above
3. **Prioritize cleanup**: Which cleanup tasks to tackle first?
4. **Plan migration**: If there's existing data using legacy fields
5. **Update documentation**: Align CLAUDE.md with validated business logic

