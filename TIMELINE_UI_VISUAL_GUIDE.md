# Timeline UI - Visual Design Guide

## Component Visual Descriptions

### TimelineView Component

#### Layout Structure
```
┌─────────────────────────────────────────────────────────────────┐
│ Project Timeline                                    📅 1/15/2025 │
│ 1 phase tracked                                      - Present   │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ [0] Phase 0 - Initial Purchase                 24 months  👥2│ │
│ │     1/15/2025                                              ❯ │ │
│ │ ─────────────────────────────────────────────────────────── │ │
│ │ Total Surface: 246 m²  │  Price/m²: €2,642  │  Total: €1.2M│ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                   │
│ ● Current Phase (ongoing)                                        │
└─────────────────────────────────────────────────────────────────┘
```

**Colors:**
- Phase number badge: Blue circle with white text (#2563eb)
- Border: Gray when collapsed, Blue when expanded
- Background: White cards on gray page
- Current phase dot: Green pulsing (#22c55e)

**Interactions:**
- Click phase card to expand/collapse
- Hover shows subtle shadow
- Smooth transitions on all state changes

---

### PhaseCard Component (Expanded View)

#### Section 1: Participants Table
```
┌─────────────────────────────────────────────────────────────────┐
│ 👥 Participants (2)                                          ▼   │
├─────────────────────────────────────────────────────────────────┤
│ Name        │ Surface │ Unit │ Capital   │ Total Cost │ Loan   │ Monthly │
│─────────────┼─────────┼──────┼───────────┼────────────┼────────┼─────────│
│ Buyer A     │ 112 m²  │ #1   │ €50,000   │ €415,000   │€365,000│ €2,200  │
│ Buyer B     │ 134 m²  │ #2   │ €170,000  │ €485,000   │€315,000│ €1,900  │
└─────────────────────────────────────────────────────────────────┘
```

**Styling:**
- Header: Blue icon, bold text
- Table: Striped rows on hover
- Numbers: Right-aligned
- Currency: Format with thousands separator

#### Section 2: Copropriété
```
┌─────────────────────────────────────────────────────────────────┐
│ 🏢 Copropriété                                               ▼   │
├─────────────────────────────────────────────────────────────────┤
│ Name: Copropriété Ferme du Temple      Cash Reserve: €0         │
│                                                                   │
│ Lots Owned:  [Lot #5]  [Lot #6]                                 │
│                                                                   │
│ Monthly Obligations:                                             │
│ ┌───────────────────────────────────────────────────────────┐   │
│ │ Loan Payments:        €0                                  │   │
│ │ Insurance:            €166.67                             │   │
│ │ Accounting Fees:      €83.33                              │   │
│ │ Maintenance Reserve:  €0                                  │   │
│ └───────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

**Styling:**
- Header: Green icon
- Lot badges: Green pill-shaped tags
- Monthly obligations: Gray background box

#### Section 3: Financial Snapshot
```
┌─────────────────────────────────────────────────────────────────┐
│ 💵 Financial Snapshot                                        ▼   │
├─────────────────────────────────────────────────────────────────┤
│ ┌───────────┐ ┌───────────┐ ┌───────────┐                      │
│ │ Purchase  │ │ Notary    │ │Construction│                     │
│ │ €650,000  │ │ €82,500   │ │ €391,140  │                      │
│ └───────────┘ └───────────┘ └───────────┘                      │
│                                                                   │
│ ┌───────────┐ ┌───────────┐ ┌───────────┐                      │
│ │ Shared    │ │ Capital   │ │ Loans     │                      │
│ │ €298,720  │ │ €220,000  │ │ €680,000  │                      │
│ └───────────┘ └───────────┘ └───────────┘                      │
│                                                                   │
│ ────────────────────────────────────────────────────────────     │
│ Total Project Cost                               €1,422,360      │
└─────────────────────────────────────────────────────────────────┘
```

**Color Coding:**
- Purchase: Blue background (#dbeafe)
- Notary: Purple background (#f3e8ff)
- Construction: Orange background (#fed7aa)
- Shared: Green background (#d1fae5)
- Capital: Indigo background (#e0e7ff)
- Loans: Red background (#fee2e2)

**Triggering Event Info Box:**
```
┌─────────────────────────────────────────────────────────────────┐
│ TRIGGERED BY                                                     │
│ INITIAL PURCHASE                                                 │
│ 1/15/2025, 10:00:00 AM                                          │
└─────────────────────────────────────────────────────────────────┘
```
- Light blue background
- Small text for metadata

---

### EventMarker Component

#### Compact View (Collapsed)
```
        │
        ●  ➤ Newcomer Joins
           1/20/2027, 2:30 PM
        │
```

**Event Type Visual Styles:**

1. **INITIAL_PURCHASE** (Blue)
   - Icon: 🏠 House
   - Border: Solid blue (#3b82f6)

2. **NEWCOMER_JOINS** (Green)
   - Icon: 👤+ User Plus
   - Border: Solid green (#10b981)

3. **HIDDEN_LOT_REVEALED** (Purple)
   - Icon: 👁 Eye
   - Border: Solid purple (#a855f7)

4. **PORTAGE_SETTLEMENT** (Orange)
   - Icon: ↓ Arrow Down
   - Border: Solid orange (#f97316)

5. **COPRO_TAKES_LOAN** (Red)
   - Icon: 💵 Dollar Sign
   - Border: Solid red (#ef4444)

6. **PARTICIPANT_EXITS** (Gray)
   - Icon: 👤- User Minus
   - Border: Solid gray (#6b7280)

#### Expanded View (Example: NEWCOMER_JOINS)
```
┌─────────────────────────────────────────────────────────────────┐
│ Emma joined the project                                          │
│                                                                   │
│ Purchased from: Buyer B                    Lot: #2               │
│ Purchase Price: €165,000                   Notary Fees: €20,625  │
│ Surface: 134 m²                            Capital: €40,000      │
│                                                                   │
│ ─────────────────────────────────────────────────────────────    │
│ Price Breakdown                                                  │
│                                                                   │
│ Base Price:                €143,000                              │
│ Indexation:                €5,720                                │
│ Carrying Cost Recovery:    €10,800                               │
│ Fees Recovery:             €5,480                                │
└─────────────────────────────────────────────────────────────────┘
```

---

## Responsive Design

### Desktop (> 768px)
- Full width layout with max 6xl container
- 3-column grid for financial cards
- Side-by-side phase stats
- Full table display

### Tablet (768px - 1024px)
- 2-column grid for financial cards
- Stacked phase information
- Scrollable tables

### Mobile (< 768px)
- Single column layout
- Horizontal scroll for tables
- Stacked cards
- Touch-friendly hit targets (min 44px)

---

## Animation & Transitions

### Expand/Collapse
```css
animation: fadeIn 0.2s ease-out
```
- Smooth opacity and transform
- 200ms duration
- Subtle slide-down effect

### Hover States
- Border color change
- Subtle shadow increase
- Cursor pointer
- 150ms transition

### Current Phase Indicator
```css
animation: pulse 2s infinite
```
- Green dot pulsing
- Draws attention to active phase

---

## Color Palette

### Primary Colors
- Blue: #2563eb (phases, primary actions)
- Green: #10b981 (copro, positive actions)
- Purple: #a855f7 (hidden lots, secondary)
- Orange: #f97316 (portage, warnings)
- Red: #ef4444 (loans, exits, alerts)
- Gray: #6b7280 (neutral, disabled)

### Background Colors
- Page: #f3f4f6 (light gray)
- Cards: #ffffff (white)
- Hover: #f9fafb (very light gray)
- Sections: #f9fafb (light gray)

### Text Colors
- Primary: #111827 (near black)
- Secondary: #6b7280 (medium gray)
- Muted: #9ca3af (light gray)
- Link: #2563eb (blue)

---

## Typography

### Font Family
```css
font-family: system-ui, -apple-system, sans-serif
```

### Sizes
- Page title: 3xl (30px)
- Section headers: 2xl (24px)
- Card titles: lg (18px)
- Body text: base (16px)
- Small text: sm (14px)
- Tiny text: xs (12px)

### Weights
- Bold: 700 (headings)
- Semibold: 600 (labels)
- Medium: 500 (emphasis)
- Regular: 400 (body)

---

## Spacing System (4px grid)

```
xs:  4px   (gap-1, p-1)
sm:  8px   (gap-2, p-2)
md:  12px  (gap-3, p-3)
base: 16px (gap-4, p-4)
lg:  24px  (gap-6, p-6)
xl:  32px  (gap-8, p-8)
```

---

## Icon Usage

### Lucide React Icons
- Calendar: Timeline header
- Users: Participant count
- ChevronRight: Expand indicator
- ChevronDown/Up: Accordion toggle
- Building2: Copropriété
- DollarSign: Financial data
- Home: Initial purchase
- UserPlus: Newcomer joins
- Eye: Hidden lot revealed
- ArrowDown: Portage settlement
- Info: Event details toggle

### Icon Sizes
- Small: 16px (w-4 h-4)
- Medium: 20px (w-5 h-5)
- Large: 24px (w-6 h-6)
- XL: 48px (w-12 h-12)

---

## UI States

### Loading State (Not Yet Implemented)
```
┌─────────────────────────────────────────────────────────────────┐
│ ⏳ Loading timeline...                                           │
└─────────────────────────────────────────────────────────────────┘
```

### Empty State
```
┌─────────────────────────────────────────────────────────────────┐
│                          📅                                      │
│                                                                   │
│         No timeline events yet.                                  │
│         Start by creating an initial purchase event.             │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### Error State (Not Yet Implemented)
```
┌─────────────────────────────────────────────────────────────────┐
│ ⚠️ Error loading timeline                                        │
│ Please try again or contact support.                             │
└─────────────────────────────────────────────────────────────────┘
```

---

## Accessibility Considerations (Future Improvements)

### Keyboard Navigation
- Tab through phases
- Enter to expand/collapse
- Arrow keys to navigate between phases
- Escape to collapse all

### Screen Readers
- ARIA labels on interactive elements
- Role attributes for custom components
- Alt text for icons
- Live regions for state changes

### Color Contrast
- All text meets WCAG AA standards
- 4.5:1 ratio for normal text
- 3:1 ratio for large text

---

## Print Styles (Not Yet Implemented)

```css
@media print {
  /* Expand all sections */
  /* Remove interactive elements */
  /* Optimize for A4 paper */
  /* Black & white friendly */
}
```

---

## Performance Optimizations

### Component Rendering
- Pure functional components (no unnecessary re-renders)
- Memoization opportunities:
  - formatCurrency function
  - Color mapping objects
  - Event renderers

### CSS Performance
- Hardware-accelerated animations (transform, opacity)
- Will-change hints for animated elements
- Avoid layout thrashing
- CSS containment where applicable

### Data Loading
- Lazy calculation of cash flows
- Conditional rendering of heavy sections
- Virtual scrolling for long timelines (future)

---

## Browser Compatibility

### Modern Browsers (Supported)
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### Mobile Browsers (Supported)
- iOS Safari 14+
- Chrome Android 90+
- Samsung Internet 14+

### Not Supported
- IE 11 (no support planned)
- Legacy browsers (< 2020)

---

## Component Demo Screenshots

**View the live demo at:**
```
http://localhost:4323/credit-castor/timeline-demo
```

**Key Interactions to Try:**
1. Click "Phase 0 - Initial Purchase" to expand
2. Toggle each section (Participants, Copropriété, Financial Snapshot)
3. Resize browser window to see responsive behavior
4. Hover over phase cards to see interaction feedback
5. Note the "Current Phase (ongoing)" indicator at bottom
