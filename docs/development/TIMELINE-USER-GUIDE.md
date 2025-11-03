# Continuous Timeline Feature - User Guide

**Version:** 1.0
**Date:** 2025-11-03
**Feature:** Continuous Timeline with Deed Date

---

## Table of Contents

1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
3. [Timeline View](#timeline-view)
4. [Participant Cash Flows](#participant-cash-flows)
5. [Copropriété Financial Health](#copropriété-financial-health)
6. [Export and Import](#export-and-import)
7. [Common Workflows](#common-workflows)
8. [FAQ](#faq)

---

## Introduction

The **Continuous Timeline** feature provides a complete chronological view of your real estate project from the deed date onwards. Unlike the traditional calculator which shows only a snapshot, the timeline tracks:

- **All events** chronologically (purchases, sales, joins, exits)
- **Individual participant journeys** with entry/exit dates
- **Cash flow details** for each participant over time
- **Copropriété financial health** including reserves and obligations
- **Time-based pricing** that accounts for actual holding duration

### Key Benefits

- 📊 **Visual Timeline:** See the entire project history at a glance
- 💰 **Accurate Pricing:** Sale prices calculated based on actual months held
- 📈 **Cash Flow Tracking:** Monitor each participant's complete financial journey
- 🏢 **Copropriété Monitoring:** Track reserves, obligations, and hidden lot sales
- 💾 **Data Portability:** Export and import timeline data as JSON

---

## Getting Started

### Step 1: Configure Deed Date in Calculator

The **deed date** is the foundation of your timeline (T0). All recurring costs and time calculations start from this date.

1. Open the calculator at `/`
2. Locate the **"Date de l'acte / Deed Date"** section (green border)
3. Set your deed date (default: February 1st, 2026)
4. This date will be used for:
   - Founder entry dates
   - Initial lot acquisition dates
   - Start of recurring monthly costs

**Example:**
```
Deed Date: 01/02/2026
→ Founders enter on: 01/02/2026
→ First loan payment: 01/03/2026
→ Recurring costs begin from: 01/02/2026
```

### Step 2: Complete Calculator Inputs

Fill in your project details as usual:
- **Projet Parameters:** Price/m², notary fees, indexation rate, etc.
- **Participants:** Names, surfaces, loan details
- **Scenarios:** If applicable

The calculator will compute initial purchase prices and costs.

### Step 3: Continue to Timeline

After reviewing calculator results:

1. Click the **"Continue to Timeline"** button (green, prominent)
2. A JSON file will download: `timeline-YYYY-MM-DD.json`
3. This file contains your complete project setup

---

## Timeline View

### Accessing the Timeline

Navigate to `/continuous-timeline-demo/` to view the timeline interface.

### Components of the Timeline View

#### 1. Timeline Visualization

**What it shows:**
- Horizontal timeline with date markers
- Event markers (color-coded by type)
- "Now" indicator (orange, pulsing)
- T0 "Deed Date" marker (green)

**Event Colors:**
- 🔵 **Blue:** Initial Purchase / Newcomer Join
- 🟣 **Purple:** Lot Sale
- 🟡 **Yellow:** Hidden Lot Revealed

**How to use:**
- Click on any event marker to see details
- Scroll horizontally on mobile
- Hover over markers for event type

#### 2. Participants Table

**What it shows:**
- All participants (active, portage, exited)
- Entry dates and status
- Lots owned (own vs portage)
- Cash flow summary

**Columns:**
- **Name:** Participant identifier
- **Entry Date:** When they joined (founders = deed date)
- **Status:** ACTIVE / PORTAGE / EXITED
- **Lots Owned:** Count and IDs (🏠 = portage)
- **Net Position:** Current cash flow balance
- **Actions:** Expand for details

**Status Badges:**
- 🟢 **Active:** Owns lots, pays full costs
- 🟡 **Portage:** Holds lots temporarily, pays interest-only
- 🔴 **Exited:** Left the project

**Founder Badge:**
- 🏅 **Founder:** Green badge for participants who entered on deed date

#### 3. Copropriété Panel

**What it shows:**
- Current cash reserves
- Monthly obligations breakdown
- Hidden lots status (available vs sold)
- Months of reserve remaining

**Alerts:**
- ⚠️ **Red background:** Reserve below 3 months of obligations
- 🟢 **Green background:** Healthy reserve

**Monthly Obligations:**
- **Loans:** Total copro loan payments
- **Insurance:** Property insurance
- **Accounting:** Admin and bookkeeping fees
- **Total:** Sum of all monthly costs

---

## Participant Cash Flows

### Viewing Cash Flow Details

**How to access:**
1. In the Participants Table, click on any row
2. The row expands to show detailed cash flow

**What you'll see:**

#### Summary Cards (Top Row)

1. **Total Invested** (Red)
   - All cash outflows (purchases, fees, costs)

2. **Total Received** (Green)
   - All cash inflows (sales, redistributions)

3. **Net Position** (Red/Green)
   - Current balance (invested - received)
   - Color: Red if negative, Green if positive

4. **Months Since Deed / Monthly Burn**
   - Time since deed date
   - Average monthly cost

#### Transaction List

**Columns:**
- **Date:** Transaction date (DD/MM/YYYY)
- **Type:** Transaction category (badge)
- **Description:** Details of transaction
- **Amount:** Cash in (+) or out (-)
- **Balance:** Running total

**Transaction Types:**

**One-Shot (Cash Events):**
- 🏠 **LOT_PURCHASE:** Initial lot purchase at deed date
- 📜 **NOTARY_FEES:** Legal fees at deed date
- 💰 **LOT_SALE:** Proceeds from selling a lot
- 🏢 **COPRO_CONTRIBUTION:** One-time copro work payment
- 🎁 **REDISTRIBUTION:** Share of hidden lot sale

**Recurring (Monthly):**
- 💳 **LOAN_PAYMENT:** Principal + interest (own lots)
- 💳 **LOAN_PAYMENT:** Interest only (portage lots)
- 🏛️ **PROPERTY_TAX:** Monthly tax
- 🛡️ **INSURANCE:** Property insurance
- 🏘️ **COMMON_CHARGES:** Copro charges

#### Filtering Transactions

Use the **Category Filter** dropdown:
- **All Transactions:** Show everything
- **One-Shot Only:** Cash events only
- **Recurring Only:** Monthly costs only

#### Exporting Cash Flow

Click **"Export to CSV"** at the bottom to download a CSV file for personal accounting.

**CSV Format:**
```csv
Date,Type,Description,Amount,Balance
01/02/2026,LOT_PURCHASE,"Lot A1 purchase",-150000,-150000
01/02/2026,NOTARY_FEES,"Notary fees for lot purchase",-10000,-160000
01/03/2026,LOAN_PAYMENT,"Monthly loan for Lot A1",-650.5,-160650.5
...
```

---

## Copropriété Financial Health

### Understanding the Copro Panel

The **Copropriété Panel** tracks the collective financial health of your project.

#### Cash Reserve

**What it is:**
- Total cash held by the copropriété
- Accumulated from initial contributions and hidden lot sales
- Used to pay collective obligations

**Healthy Reserve:**
- **≥3 months** of obligations: Green background
- **<3 months** of obligations: Red background with warning

**Example:**
```
Cash Reserve: €45,000
Monthly Obligations: €2,500
Months of Reserve: 18 months → 🟢 Healthy
```

#### Hidden Lots

**What they are:**
- Lots owned by the copropriété (not individual participants)
- Created when a participant exits and copro buys their lot
- Eventually sold to newcomers or external buyers

**Status:**
- 🟣 **Available:** Ready to sell
- 🟢 **Sold:** Proceeds added to reserves

**Display:**
Each lot shows:
- Lot ID
- Acquisition date
- Status badge

#### Monthly Obligations Breakdown

**Components:**
1. **Loans:** All copro debt payments
2. **Insurance:** Building insurance
3. **Accounting:** Admin fees

**Purpose:**
- Monitor fixed monthly costs
- Ensure reserve can cover obligations
- Plan for upcoming expenses

---

## Export and Import

### Exporting Timeline Data

**Why export:**
- Backup your project data
- Share with team members
- Archive project milestones

**How to export:**
1. In Timeline View, click **"Export JSON"** (blue button)
2. File downloads: `timeline-export-YYYY-MM-DD.json`

**JSON Format:**
```json
{
  "version": "1.0",
  "exportedAt": "2025-11-03T14:30:00.000Z",
  "events": [
    {
      "eventType": "INITIAL_PURCHASE",
      "date": "2026-02-01T00:00:00.000Z",
      "participants": [...],
      ...
    }
  ]
}
```

### Importing Timeline Data

**Use cases:**
- Load a saved project
- Continue work from calculator
- Restore from backup

**How to import:**
1. In Timeline View, click **"Import JSON"** (green button)
2. Select your JSON file
3. Timeline updates with imported data

**What gets imported:**
- All events (purchases, sales, joins, exits)
- Participant data (names, entry dates, lots)
- Project parameters (indexation, fees, etc.)
- Deed date

**Important:**
- Dates are preserved (converted from ISO format)
- Import overwrites current timeline
- Export before importing if you want to keep current data

---

## Common Workflows

### Workflow 1: New Project Setup

1. **Calculator:** Fill in deed date and participants
2. **Calculate:** Review initial results
3. **Export:** Click "Continue to Timeline" → Download JSON
4. **Timeline:** Import JSON in timeline view
5. **Monitor:** Track participants and copro health over time

### Workflow 2: Adding a New Participant

**Coming in future phase:**
1. In Timeline View, click "Add Participant Event"
2. Fill in entry date, lots purchased, financing details
3. System calculates:
   - Sale price based on months held since deed date
   - Seller's cash flow update
   - Buyer's recurring costs from entry date

### Workflow 3: Participant Exit

**Coming in future phase:**
1. Click "Record Exit Event"
2. Select exiting participant and exit date
3. Choose:
   - **Sell to newcomer:** Create sale event
   - **Copro buyback:** Move lots to hidden lots
4. System updates:
   - Exiting participant's final cash flow
   - Copro reserves (if buyback)
   - Timeline visualization

### Workflow 4: Monitoring Cash Position

**Regular checks:**
1. Open Timeline View
2. Check **Copro Panel** reserve level
   - Is it green (≥3 months)?
   - Any hidden lots to sell?
3. Review each **Participant's Net Position**
   - Who's invested most?
   - Any portage participants ready to exit?
4. Export cash flows for accounting

### Workflow 5: Planning a Sale

**Before selling:**
1. Identify the lot and seller
2. Note the acquisition date (from participant details)
3. Calculate months held: `(sale date - acquisition date)`
4. Review sale price breakdown:
   - Base price (price/m² + indexation)
   - Carrying costs (if portage)
   - Fee recovery (if <2 years)

**Example:**
```
Lot: A1
Acquired: 01/02/2026 (deed date)
Sale Date: 01/06/2027
Months Held: 16 months

Sale Price:
  Base: €150,000
  Indexation (16 months @ 2%): €4,000
  Carrying Costs: €0 (own lot)
  Fee Recovery (16 < 24 months): €6,000
  Total: €160,000
```

---

## FAQ

### General Questions

**Q: What is the deed date (T0)?**
A: The deed date is the official start of your project, when property ownership is legally transferred. All founders enter on this date, and recurring costs begin from here.

**Q: Can I change the deed date after setup?**
A: Currently, you need to recalculate in the calculator with the new date and re-export. Future versions may allow editing.

**Q: What's the difference between Active and Portage status?**
A:
- **Active:** Owns lots they live in, pays full costs (principal + interest)
- **Portage:** Temporarily holds extra lots, pays interest-only until selling

### Timeline View

**Q: Why are some participants marked as "Founder"?**
A: Founders are participants whose entry date equals the deed date. They're the original project members.

**Q: What does the orange "Now" marker mean?**
A: It shows today's date on the timeline, helping you see past vs future events.

**Q: Can I zoom or filter the timeline?**
A: Currently, you can scroll horizontally. Future versions may add zoom and date range filters.

### Cash Flow

**Q: Why is my net position negative?**
A: This is normal! You've invested in property (purchase, fees, monthly costs) but haven't sold yet. It becomes positive when you sell.

**Q: What's "Monthly Burn Rate"?**
A: The average monthly cost you're paying (loans, taxes, insurance, charges). Helps estimate ongoing expenses.

**Q: When do recurring costs start?**
A: For founders: 1 month after deed date. For newcomers: 1 month after their entry date.

**Q: Why do portage lots show different loan payments?**
A: Portage lots pay interest-only (no principal repayment) since you plan to sell them soon. This minimizes carrying costs.

### Sale Pricing

**Q: How is sale price calculated?**
A:
```
Sale Price = Base Price + Indexation + Carrying Costs + Fee Recovery

Where:
- Base Price: Original purchase price
- Indexation: Annual rate × months held
- Carrying Costs: Monthly costs × months held (portage lots only)
- Fee Recovery: 60% of notary fees if sold within 2 years
```

**Q: Why does holding duration matter?**
A:
1. **Indexation:** Longer holding = more indexation
2. **Fee Recovery:** Only applies if sold <2 years after acquisition
3. **Carrying Costs:** For portage, more months = higher costs to recover

**Q: What happens if I sell within 2 years?**
A: You can recover 60% of the notary fees you paid, added to the sale price. After 2 years, no fee recovery.

### Copropriété

**Q: What are "hidden lots"?**
A: Lots owned by the copropriété (not individuals). Created when:
- A participant exits and copro buys their lot
- Project starts with excess units

**Q: Why is the copro reserve red?**
A: The reserve has dropped below 3 months of monthly obligations. Consider:
- Selling hidden lots to boost reserves
- Reducing monthly obligations
- Increasing participant contributions

**Q: What are "monthly obligations"?**
A: Fixed costs the copropriété must pay every month:
- Loan payments (if copro has debt)
- Property insurance
- Accounting/admin fees

### Export/Import

**Q: What's in the JSON export file?**
A: Complete project data:
- All events (purchases, sales, joins, exits)
- Participant details (names, dates, lots, finances)
- Project parameters (rates, fees, settings)
- Deed date

**Q: Can I edit the JSON file manually?**
A: Yes, but be careful! Dates must be in ISO format (`YYYY-MM-DDTHH:MM:SS.sssZ`). Incorrect format will cause import errors.

**Q: Does import overwrite my current timeline?**
A: Yes! Export your current timeline first if you want to keep it.

**Q: Can I share JSON files with others?**
A: Yes! It's a standard format. Anyone with the timeline tool can import it.

---

## Technical Details

### Date Handling

**Date Format:**
- **UI Display:** DD/MM/YYYY (Belgian standard)
- **Internal Storage:** JavaScript Date objects
- **JSON Export:** ISO 8601 format (`2026-02-01T00:00:00.000Z`)

**Month Calculation:**
- Uses exact month difference (not rounded)
- Example: Jan 1 → Mar 15 = 2.5 months (rounded to 2 for fee recovery)

**Timezone:**
- All dates stored in UTC
- Displayed in local timezone

### Performance

**Timeline Projection:**
- Calculates ~100 months of cash flow in <100ms
- Optimized for up to 20 participants

**Transaction Generation:**
- One-shot: Instant
- Recurring: ~10ms per participant per year

**UI Rendering:**
- Timeline: 60fps smooth scrolling
- Cash flow: Virtualized list for 1000+ transactions

### Browser Support

**Tested on:**
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile Safari (iOS)
- Mobile Chrome (Android)

**Required features:**
- HTML5 date input
- ES6+ JavaScript
- Flexbox/Grid CSS

---

## Next Steps

1. **Try the demo:** Visit `/continuous-timeline-demo/` with sample data
2. **Set up your project:** Use the calculator to create your timeline
3. **Monitor regularly:** Check participant cash flows and copro reserves
4. **Export frequently:** Back up your data to JSON

**Questions or issues?**
- Check this guide's FAQ section
- Review the UAD Validation Checklist for technical details
- Contact the development team

---

**Document Version:** 1.0
**Last Updated:** 2025-11-03
**Maintained By:** Development Team
