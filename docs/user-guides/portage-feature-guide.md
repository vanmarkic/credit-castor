# Portage Feature User Guide

## Overview

The **Portage Feature** allows founders to temporarily hold property lots while waiting for new buyers, and enables transparent pricing calculation with recovery of carrying costs (interest, taxes, insurance).

## Key Concepts

### What is Portage?
Portage is when a founder retains ownership of a property lot and offers it for sale to newcomers at a fair price that includes:
- Original acquisition costs (purchase + notary + construction)
- **Indexation**: Annual price appreciation on the base acquisition cost
- **Carrying Cost Recovery**: Interest, taxes, and insurance paid during the holding period

### Carrying Costs
Monthly costs that accumulate while the founder holds the property:
- **Interest**: Based on the property's original value and the average interest rate
- **Unoccupied Building Tax**: Tax on vacant properties (standard Belgian rate)
- **Insurance**: Property insurance cost

## Using the Portage Feature

### Step 1: Mark a Lot as Portage

1. In the **Participant Details Panel** for a founder:
   - Under "Lots Owned", click **"+ Ajouter lot portage"**
   - Configure the lot surface and optional construction costs
   - The lot is now marked as **"📦 Lot en Portage"**

2. A **Price Breakdown Table** appears showing:
   - Base acquisition cost (purchase + notary + construction)
   - Indexation applied (based on years held)
   - Carrying cost recovery (interest + taxes + insurance)
   - **Total resale price** for the lot

### Step 2: Configure Global Portage Formula

Before offering lots to newcomers, optionally adjust the **Portage Formula Configuration**:

1. Scroll down to **"Configuration Formule de Portage"** (blue box with 📦)
2. Click to expand the section
3. Adjust these parameters:
   - **Taux d'indexation annuel** (Indexation Rate): Default 2.0% per year
   - **Récupération frais de portage** (Carrying Cost Recovery %): Default 100%
   - **Taux d'intérêt moyen** (Average Interest Rate): Default 4.5% annually

4. An example calculation shows how adjustments impact pricing (for a sample €60,000 lot over 2.5 years)

### Step 3: Review Available Lots in Marketplace

The **"Place de Marché — Lots Disponibles"** section displays:

- **Portage Lots** (from founders):
  - Source: Founder name (clickable link)
  - Surface: m² being offered
  - **Left side**: Generic formula explanation
  - **Right side**: Specific lot pricing with breakdown table
  - Shows Base → Indexation → Carrying Costs → Total Price

- **Copropriété Lots** (shared building):
  - Available surface from the building's common area
  - Price calculated per m² based on the chosen surface
  - Proportional indexation and carrying costs

### Step 4: Understand Pricing Breakdown

Each portage lot shows a breakdown table:

| Component | Calculation | Purpose |
|-----------|-------------|---------|
| **Base** | Purchase + Notary + Construction | Original cost to acquire |
| **Indexation** | Base × (1 + rate%)^years | Accounts for inflation/appreciation |
| **Carrying Costs** | Interest + Tax + Insurance (× recovery %) | Reimburse founder's expenses |
| **Total** | Sum of above | Fair resale price |

### Step 5: Bidirectional Navigation

The feature includes smart navigation:
- In the participant panel: Click **"↓ Voir dans la place de marché"** to jump to the marketplace
- In the marketplace: Click the **founder's name** to jump to their panel (with brief highlight)

## Parameters Explained

### Indexation Rate
- **Default**: 2.0% per year
- Controls annual price appreciation
- Used to calculate inflation adjustment on base acquisition cost
- Formula: `Base × [1 + rate/100]^years`

### Carrying Cost Recovery %
- **Default**: 100%
- What percentage of accumulated carrying costs to recover from the buyer
- Set to 100% to fully recover; set to 50% to absorb half the costs
- Formula: `Total Carrying Costs × (recovery % / 100)`

### Average Interest Rate
- **Default**: 4.5% per year
- Used only to calculate the monthly interest component of carrying costs
- Affects the "Intérêts" line in the breakdown
- Does NOT affect the price indexation (that uses the separate "Indexation Rate")

## Common Scenarios

### Scenario 1: Founder Holds for 2.5 Years, Then Sells
- Lot purchased: €60,000
- Notary fees: €7,500
- Held for: 2.5 years
- **Base**: €67,500
- **Indexation** (2% × 2.5y): +€3,431
- **Carrying costs** (estimated): +€6,200
- **Total resale price**: ~€77,131

### Scenario 2: Increase Recovery Rate for Expensive Carrying
- If the property is expensive or interest rates are high
- Increase "Récupération frais de portage" from 100% to 120-150%
- This ensures the founder fully recovers all holding costs

### Scenario 3: Buyer Reduces Carrying Cost Impact
- Set "Récupération frais de portage" to 75%
- Founder absorbs 25% of carrying costs as goodwill
- Results in lower resale price for the buyer

## Best Practices

1. **Review formula parameters regularly**: Keep indexation rate realistic with market conditions
2. **Disclose carrying costs transparently**: The breakdown table makes all costs visible
3. **Adjust recovery % for fairness**: Consider both founder and buyer interests
4. **Check marketplace before offering**: Verify no duplicate lots or overlapping surfaces
5. **Use navigation links**: Help newcomers quickly find founder contact info in participant panels

## Troubleshooting

**Q: Why did my portage lot price change?**
- A: Formula parameters were adjusted, or years held changed (deed date relative to today)

**Q: How do I remove a portage lot?**
- A: In the participant panel, click **"Retirer"** on the lot's breakdown table

**Q: Can I set custom indexation rates per lot?**
- A: Currently, all lots use the global formula. Custom rates require a manual override (future feature)

**Q: What if carrying costs are very high?**
- A: Increase the "Taux d'intérêt moyen" or check the breakdown table; consider increasing recovery %

## Formula Reference

### Complete Portage Price Calculation

```
Total Resale Price = Base + Indexation + Carrying Cost Recovery

Where:
  Base = Original Purchase + Notary Fees + Construction
  Indexation = Base × [(1 + indexationRate/100)^yearsHeld - 1]
  Carrying Cost Recovery = (Monthly Interest + Monthly Tax + Monthly Insurance) × months × recovery%

  Monthly Interest = (Base × averageInterestRate) / (12 × 100)
  Monthly Tax = Base-dependent (Belgian unoccupied property tax)
  Monthly Insurance = Base-dependent (standard Belgian rate)
```

## See Also

- [Portage Feature Design](../design/portage-feature-ux-redesign.md)
- [Calculator Architecture](../development/)
- [Storage and State Management](../development/)
