# Design Brief: Real Estate Division Calculator
## Belgian Property Co-Purchase Application

---

## Project Overview

Design a web application that helps groups of people calculate costs when buying and dividing a property together in Belgium (Wallonia region). Think of it like a sophisticated mortgage calculator meets project management tool for co-ownership.

### User Context
- **Primary Users**: Groups of 2-8 people planning to buy property together
- **Use Case**: Pre-purchase planning and cost negotiation
- **Key Pain Point**: Understanding complex cost distribution, financing needs, and "what-if" scenarios
- **Usage Pattern**: Collaborative sessions, comparing scenarios, making decisions together

---

## Core User Journeys

### Journey 1: Initial Setup (Founders)
1. User sets the deed date (when property will be purchased) - this is "Day Zero"
2. Enters property details (purchase price, surface area)
3. Adds participants with their info (name, surface they want, capital they have)
4. Reviews total costs and financing needs
5. Plays with optimization scenarios ("what if we negotiate 10% off?")
6. Exports results to Excel or saves scenario

### Journey 2: Adding a Newcomer (Later)
1. Load existing scenario
2. Add new participant (marks them as "newcomer")
3. System shows available lots to purchase:
   - Lots being held by founders (fixed price, fixed size)
   - Lots from the co-ownership (flexible size, calculated price)
4. Newcomer selects a lot
5. System calculates their costs and updates everyone's payback schedules
6. Save updated scenario

### Journey 3: Scenario Comparison
1. User makes a copy of their scenario
2. Adjusts variables (construction costs, negotiated price, etc.)
3. Compares side-by-side to see impact
4. Shares results with group

---

## Design Principles

### 1. Progressive Disclosure
- Show critical information upfront (totals, key metrics)
- Hide detailed breakdowns until user expands
- Guide users through complexity gradually

### 2. Visual Hierarchy
- Most important = biggest and boldest
- Supporting details = smaller, lighter
- Use color to indicate category, not just decoration

### 3. Immediate Feedback
- All inputs update calculations in real-time
- Show mini-previews when hovering over actions
- Validate as user types, not on submit

### 4. Collaborative Clarity
- Each participant has distinct visual identity
- Easy to compare between participants
- Clear who owes what to whom

### 5. Trust & Transparency
- Every calculation shows its breakdown
- "Why is this number X?" should always be answerable
- No magic numbers

---

## Page Layout

### Header Section
**Purpose**: Project identity and critical actions

**Content**:
- Building icon + Project title "Achat en Division - Acte 1"
- Location subtitle "Wallonie, Belgique • Prix d'achat €650,000"
- Action bar with buttons:
  - Download scenario (save work)
  - Load scenario (resume work)
  - Reset to defaults (start over)
  - Export to Excel (share results)
  - Continue to Timeline (advanced view)
- Auto-save indicator (subtle, reassuring)

**Visual Treatment**:
- Clean white card with subtle shadow
- Blue accent color for building icon
- Button group with clear primary action (Excel export in blue, Timeline in green)

---

### Deed Date Panel (PROMINENT)
**Purpose**: Set the project's "Day Zero"

**Content**:
- Large date picker input
- Calendar icon 📅
- Label: "Date de l'acte / Deed Date"
- Explanation text: "Date when the property deed will be signed. This is T0 (Time Zero) for your project - all recurring costs and holding duration calculations start from this date."

**Visual Treatment**:
- Green border (signifies "start" or "go")
- Larger than other input fields
- Prominent position near top
- Maybe subtle green background tint

---

### Key Metrics Dashboard
**Purpose**: At-a-glance project health

**Layout**: 5 equal-width cards in a row (responsive: stack on mobile)

**Cards**:
1. **Participants** (icon: people)
   - Number of participants
   - Neutral color (gray/blue)

2. **Surface** (icon: house)
   - Total m² across all units
   - Neutral color

3. **Total Cost** (icon: dollar sign)
   - Grand total project cost
   - Neutral color (it's a fact, not good/bad)

4. **Capital Total** (icon: wallet)
   - Sum of all capital contributed
   - GREEN (positive, assets)

5. **Loans Needed** (icon: calculator)
   - Sum of all loans required
   - RED (needs to be financed)

**Visual Treatment**:
- Each card: white background, thin border, subtle shadow on hover
- Icon at top in accent color
- Small uppercase label
- Large bold number

---

### Cost Breakdown Section
**Purpose**: Show where the money goes

**Layout**: Grid of cost categories

**Categories** (5 cards):
1. Total Purchase (with per-m² rate below)
2. Notary Fees (with "individual rates" note)
3. Construction Costs (total)
4. Shared Infrastructure (with per-person amount in purple)
5. TOTAL (darker background, emphasized)

**Expandable Subsections**:
- Infrastructure detail (list of items with euro amounts)
- Common works detail (three building components)

**Visual Treatment**:
- White cards with borders
- Purple accent for shared costs
- Editable fields have light background and border
- Read-only calculations are displayed values only

---

### Scenario Optimization Panel
**Purpose**: Interactive "what-if" modeling

**Content**:
1. **Base Rates Section**
   - Global CASCO per m² input (large, prominent)
   - Explanation: "Applied to all participants"

2. **Variation Sliders Section**
   - Three sliders with live value display:
     - Purchase Price Reduction (0-20%)
     - Construction Cost Variation (-30% to +30%)
     - Infrastructure Reduction (0-50%)
   - Each shows min, current value (bold), and max

**Visual Treatment**:
- Light blue/gray background panel
- Subsections with white cards
- Sliders with visible track and handle
- Current value prominently displayed above slider

---

### Participants Timeline
**Purpose**: Visual representation of who joined when

**Content**:
- Horizontal timeline starting at deed date
- Participant names as cards on timeline
- Color-coded: founders (green) vs newcomers (blue)
- Shows duration in project

**Visual Treatment**:
- Clean timeline with date markers
- Cards with participant names and entry dates
- Connecting lines showing relationships
- Icons differentiating founders from newcomers

---

### Individual Participant Cards
**Purpose**: Detailed view of each person's costs and financing

**Card Structure**:

#### Always Visible Header
- **Left side**:
  - Name (editable inline, looks like heading until you click)
  - Small metadata row: "Unit #X • 112m² • 1 unit • Entry: [date]"
  - If newcomer: "Achète de [person/copro]"
  - Remove button (if >1 participant)

- **Right side**:
  - Expand/Collapse button

#### Always Visible: Key Metrics Row
4 mini-cards showing:
1. Total Cost (gray)
2. Capital Contributed (green)
3. Loan Needed (red)
4. Monthly Payment (red accent)

#### Expandable Detail Sections
*Revealed when user expands the card*

**Section 1: Entry Date Configuration** (green background)
- Founder checkbox
- Date picker (disabled if founder checked)
- Help text explaining founder vs newcomer

**Section 2: Purchase Details** (blue background)
*Only for NON-FOUNDERS*

**Two purchase options clearly separated:**

**Option A: Available Portage Lots (from founders)**
- Card layout, one per available lot
- Each shows:
  - Lot number badge
  - From which founder
  - "Surface Imposée" badge (orange)
  - Large surface number (e.g., "112m²")
  - Large total price
  - Expandable price breakdown:
    - Base price
    - Indexation (% × years)
    - Carrying cost recovery
    - Fees recovery
  - Click to select action (or selected state)

**Option B: Available Copropriété Lots**
- Card layout
- Each shows:
  - Lot number badge
  - "From the co-ownership"
  - "Surface Libre" badge (purple)
  - Surface input slider/field (you choose)
  - Price calculator updates live as you adjust
  - Price breakdown (same format as portage)
  - Select button

**OR: Manual Override Fields**
- Smaller section below
- Dropdown: "Buying from" (copro or participant names)
- Input: Lot ID
- Input: Purchase price

**Visual Treatment**:
- Portage lots: Orange accent color
- Copro lots: Purple accent color
- Interactive cards with hover states
- Click-to-select pattern (cards get highlight border when selected)
- Price breakdowns in small tables

**Section 3: Configuration** (gray background)
Grid of input fields:
- Surface (m²)
- Quantity of units
- Capital contributed (€) - green emphasis
- Notary fees - radio buttons (3% or 12.5%) in pill style
- Interest rate (%)
- Loan duration (years)

**Section 4: Portage Lot Configuration** (orange background)
- "Add portage lot" button at top
- List of configured lots:
  - Surface input for each
  - Remove button
  - Explanation text below
- Empty state: "No portage lots. Newcomers will only see co-ownership lots."

**Section 5: Construction Detail** (gray background)
Two columns:
- **Left**: CASCO
  - Display-only amount
  - Formula explanation: "112m² × €1,590/m²"

- **Right**: Parachèvements
  - Rate per m² input (editable)
  - Calculated total below
  - Formula: "112m² × €500/m²"

Below:
- Travaux communs (display-only, purple accent)
- Optional: Surface override fields for partial renovation

**Section 6: Cost Breakdown** (white cards)
5 mini-cards showing:
- Purchase share
- Notary fees
- Construction cost
- Shared infrastructure
- Capital contributed

**Section 7: Financing Result** (red background)
Large prominent display:
- Loan amount (huge number)
- Financing ratio as subtitle
- Three columns below:
  - Monthly payment
  - Total repayment
  - Total interest

**Section 8: Portage Paybacks** (purple background)
*Only shown if this participant has buyers*
- List of expected payments:
  - Buyer name
  - Entry date
  - Amount
- Total recovered (summed)
- Explanation text

**Section 9: Copropriété Redistribution** (blue background)
*Only shown if there are copro sales*
- List of sales this participant benefits from:
  - Buyer name
  - Sale amount
  - This participant's share
  - Calculation explanation (% share, months in project)
- Total redistributed
- Explanation text

---

### Global Summary Section
**Purpose**: Project-wide statistics and insights

**Layout**: 3 cards side-by-side

**Card 1: Project Totals**
- Total cost
- Total capital
- Total loans
(Simple list format)

**Card 2: Averages**
- Cost per person
- Average capital
- Average loan
(Simple list format)

**Card 3: Ranges**
- Min loan
- Max loan
- Spread between them
(Simple list format)

**Below**: Optimization Tips Panel (blue background)
- Grid of optimization ideas
- Each is a bullet point
- Examples: "Negotiate purchase price", "Apply for subsidies", etc.

---

## Color System

### Primary Palette
- **Blue (#3B82F6)**: Primary actions, navigation, information
- **Green (#10B981)**: Positive (capital, assets, go signals)
- **Red (#EF4444)**: Financing needs, costs, loans
- **Purple (#8B5CF6)**: Shared costs, co-ownership features
- **Orange (#F59E0B)**: Portage features, holding lots

### Semantic Colors
- **Gray (#6B7280)**: Neutral information, labels
- **Light backgrounds**: #F9FAFB for sections, #FFFFFF for cards

### Color Usage Rules
- Green = "what you have"
- Red = "what you need to borrow"
- Purple = "shared among everyone"
- Orange = "held for future sale"
- Blue = "actions and information"

---

## Typography Hierarchy

### Level 1: Page Title
- 36px, Bold
- Used once per page

### Level 2: Section Headers
- 24px, Bold
- Start of major sections

### Level 3: Card Headers
- 20px, Bold
- Participant names, subsection titles

### Level 4: Labels
- 10-12px, Uppercase, Semibold, Tracking wide
- Field labels, metadata

### Level 5: Body
- 14-16px, Regular
- Help text, explanations

### Level 6: Display Numbers
- 24-48px, Bold
- Key metrics, totals

### Level 7: Small Numbers
- 16-20px, Bold
- Inline amounts, breakdowns

---

## Interactive Patterns

### Inline Editing
- Looks like static text until hover
- On hover: light border appears
- On click: becomes input field
- Used for: Participant names

### Radio Button Groups (Pill Style)
- Horizontal pills instead of traditional radios
- Selected state: darker border + background tint
- Used for: Notary fee selection (3% vs 12.5%)

### Expand/Collapse Cards
- Chevron icon indicates state
- Smooth height transition
- "Détails" when collapsed, "Réduire" when expanded
- Saves scroll position

### Slider Inputs
- Visible track with filled portion
- Large draggable handle
- Current value displayed above slider prominently
- Min and max labels at ends

### Number Inputs with Steps
- Large, clear input fields
- Step buttons (± or arrows) for precise adjustments
- Currency fields show € symbol
- Percentage fields show % symbol

### Action Buttons
Three types:
1. **Primary**: Blue background, white text (main actions)
2. **Secondary**: White background, gray border (supporting actions)
3. **Danger**: Red border, red text (destructive actions like Remove)

### Add/Remove Lists
- "Add" button at top with + icon
- Each item has inline "Remove" button
- Smooth animations for add/remove
- Empty state message when list is empty

---

## Responsive Behavior

### Desktop (>1024px)
- Full multi-column layouts
- Side-by-side cards
- All content visible without excessive scrolling

### Tablet (768px - 1024px)
- 2-column grids become single column
- Card layouts maintained
- Slightly larger touch targets

### Mobile (<768px)
- Full single-column layout
- Collapsible sections more important
- Larger form inputs (easier to tap)
- Sticky header with action buttons

---

## States & Feedback

### Loading States
- Skeleton screens for initial load
- Inline spinners for recalculations (if needed)

### Empty States
- Friendly messages with icons
- Clear call-to-action buttons
- Example: "No portage lots configured. Click 'Add portage lot' to hold lots for future sale."

### Error States
- Red border on invalid inputs
- Inline error messages below field
- Clear guidance on how to fix
- Example: "Entry date cannot be before deed date (2026-02-01)"

### Success States
- Brief confirmation messages for saves
- Green checkmark icons
- Auto-hide after 3 seconds

### Hover States
- Slight shadow increase on cards
- Border color darkens on buttons
- Background tint on interactive elements

### Selected States
- Thicker colored border
- Subtle background color
- Checkmark or indicator

---

## Accessibility Considerations

### Color Independence
- Never use color alone to convey meaning
- Always pair with icons, labels, or text

### Keyboard Navigation
- All interactive elements focusable
- Visible focus indicators (blue outline)
- Logical tab order

### Screen Readers
- Proper heading hierarchy
- ARIA labels for icons
- Form labels properly associated

### Touch Targets
- Minimum 44×44px for all buttons
- Adequate spacing between interactive elements

---

## Micro-interactions

### Calculation Updates
- Brief highlight flash when number changes
- Subtle scale animation on new totals

### Card Expansion
- Smooth height transition (300ms)
- Content fades in as it appears

### Button Clicks
- Scale down slightly on press
- Ripple effect or brief background change

### Drag Sliders
- Track fills with color as you drag
- Haptic feedback on value changes (if mobile)

### Form Validation
- Check/X icon appears next to field as you type
- Color shifts from gray → green (valid) or gray → red (invalid)

---

## Special UI Components

### Price Breakdown Table
Compact table format:
```
Détail du prix:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Prix de base         €150,000
Indexation (2%)      €6,000
Frais de portage     €3,500
Récup. frais notaire €18,750
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TOTAL                €178,250
```

Visual treatment:
- Small text (10-12px)
- Left-aligned labels, right-aligned numbers
- Subtle borders between sections
- Bold total row

### Participant Badge
Small colored pill showing founder/newcomer status:
- Green pill: "Fondateur"
- Blue pill: "Nouveau"
- Inline with name or metadata row

### Timeline Visualization
- Horizontal line representing time
- Deed date marked as "T0"
- Participant cards positioned along timeline
- Connecting lines showing relationships
- Hover shows duration in months

### Currency Display
Format: €150,000 (Belgian format)
- Space as thousands separator
- No decimal places for large amounts
- € symbol before number
- Right-aligned in tables

---

## User Flow Diagrams

### Founder Setup Flow
```
Landing → Set deed date → Add participants → Configure costs →
Review totals → Adjust scenarios → Export/Save
```

### Newcomer Addition Flow
```
Load scenario → Add participant (uncheck founder) → Set entry date →
Browse available lots → Select lot → Review pricing →
See payback schedules → Save updated scenario
```

---

## Copy & Messaging

### Tone of Voice
- Professional but friendly
- Clear and precise (money is involved)
- Helpful and educational (not everyone understands mortgages)
- Reassuring (auto-save messages, explanations)

### Key Messages to Convey
1. "Your data is saved automatically"
2. "All prices are calculated transparently"
3. "You can try different scenarios risk-free"
4. "Everyone's costs are fair and proportional"

### Help Text Examples
- "Founders enter at the deed date and bear initial costs"
- "Portage lots have fixed surface area set by the seller"
- "Copropriété lots let you choose your desired surface"
- "Carrying costs recover the interest paid during holding period"

---

## Edge Cases to Design For

1. **Single participant**: Hide comparison features, adjust language
2. **10+ participants**: Scrolling list with search/filter
3. **No available lots**: Clear empty state for newcomers
4. **Very long names**: Truncate with tooltip on hover
5. **Extreme numbers**: Format with K/M suffixes if needed (€1.2M)
6. **Date in past**: Warning message if deed date < today
7. **Negative loan**: Show as "No loan needed" with green indicator

---

## Export Requirements

### Excel Export
- Generates downloadable .xlsx file
- All data structured in tables
- Same color coding as app
- Printable format

### JSON Export/Import
- Technical data format for save/load
- Should be invisible to user (just "works")
- Filename includes date/time stamp

---

## Future Considerations (Not in MVP)

- Multi-language support (FR/EN/NL)
- Print-friendly view
- PDF export with visual charts
- Comparison mode (view 2-3 scenarios side-by-side)
- Mobile app version
- Collaborative editing (multiple users simultaneously)

---

## Design Deliverables Expected

1. **High-fidelity mockups** for all major screens:
   - Main dashboard (with participants expanded)
   - Newcomer lot selection view
   - Mobile responsive views

2. **Component library** showing all UI patterns:
   - Buttons (all types)
   - Form inputs
   - Cards (all variations)
   - Sliders
   - Radio groups
   - Tables
   - Badges

3. **Interaction specifications**:
   - Hover states
   - Click/tap effects
   - Expansion animations
   - State changes

4. **Color palette** with semantic naming

5. **Typography scale** with usage guidelines

6. **Icon set** (or specification if using icon library)

7. **Responsive breakpoint examples**

---

## Questions for Designer to Consider

1. How do we make the lot selection process feel less overwhelming?
2. How do we visually distinguish between "what I pay now" vs "what I get back later"?
3. How do we make the timeline visualization both informative and elegant?
4. How do we handle really complex scenarios (many participants, many lots)?
5. How do we make scenario comparison intuitive without cluttering the UI?

---

## Success Metrics

A successful design will:
- Help users understand their costs in < 2 minutes
- Make scenario comparison obvious and easy
- Build trust through transparency
- Feel organized despite complexity
- Work beautifully on all devices
- Be approachable for non-technical users
