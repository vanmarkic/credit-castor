# Continuous Timeline Implementation Plan

**Date:** 2025-11-02
**Based on:** docs/plans/2025-11-02-continuous-timeline-redesign.md
**Approach:** TDD with UAD-driven acceptance criteria
**Estimated:** 12-17 hours total

---

## Core Design Principles

### Deed Date (Date de l'acte)
- **Default:** February 1st, 2026
- **Purpose:** T0 for the entire project - when founders collectively acquire the property
- **Effect:** All recurring costs start from this date
- **Rule:** For founders, `entryDate === deedDate` (they all join when the deed is signed)
- **For newcomers:** `entryDate` = their own deed date when buying from a founder

---

## User Acceptance Definition (UAD)

### Primary User: Real Estate Division Project Manager

**Context:** Belgian real estate cooperative member who needs to track multiple participants entering/exiting over years, manage portage scenarios, and calculate fair prices based on holding duration.

### User Stories

**US1: View Complete Project Timeline**
```
As a project manager
I want to see all project events on a continuous timeline
So that I can understand the full history of participant entries, exits, and transactions
```

**Acceptance Criteria:**
- [ ] Timeline shows all events chronologically with date labels
- [ ] Events are clickable to reveal transaction details
- [ ] Visual distinction between event types (joins, exits, sales)
- [ ] Timeline is navigable on mobile (horizontal scroll) and desktop (full width)
- [ ] "Now" marker clearly indicates current date
- [ ] T0 is the deed date (configurable, default: Feb 1, 2026)

---

**US2: Track Individual Participant Journeys**
```
As a project manager
I want to see each participant's complete journey (entry → activity → exit)
So that I can explain their financial position at any point in time
```

**Acceptance Criteria:**
- [ ] Each participant shows entry date, status (Active/Portage/Exited), and exit date if applicable
- [ ] For founders, entry date equals deed date
- [ ] Participant table displays all lots owned (own vs. portage)
- [ ] Expandable cash flow section shows monthly costs and cumulative position
- [ ] Past participants remain visible with "Exited" status
- [ ] Founders are visually distinguished from newcomers

---

**US3: Calculate Time-Based Resale Prices**
```
As a project manager
I want the system to calculate resale prices based on actual holding duration from deed date
So that I can offer fair prices to newcomers that account for indexation and carrying costs
```

**Acceptance Criteria:**
- [ ] Sale price = base + indexation + carrying costs (if portage) + fee recovery (if <2 years)
- [ ] Calculation shows breakdown of each component
- [ ] Holding duration = (sale date - lot acquisition date)
- [ ] For founders' lots: acquisition date = deed date (Feb 1, 2026)
- [ ] Portage lots accumulate monthly carrying costs from deed date
- [ ] Notary fee recovery (60%) applies only for sales within 2 years of acquisition
- [ ] System uses actual months held, not rounded years

---

**US4: Monitor Copropriété Financial Health**
```
As a project manager
I want to see the copropriété's cash position and monthly obligations
So that I can ensure we have sufficient reserves to cover collective costs
```

**Acceptance Criteria:**
- [ ] Copropriété panel shows current cash reserve
- [ ] Hidden lots owned by copro are tracked separately
- [ ] Monthly obligations breakdown: loans + insurance + accounting
- [ ] Cash flow visualization shows ins (lot sales) and outs (monthly costs)
- [ ] Alerts if cash reserve drops below 3 months of obligations
- [ ] Costs calculated from deed date onwards

---

**US5: View Participant Cash Flow Over Time** ⭐
```
As a participant
I want to see my complete cash flow history with all transactions from deed date
So that I can understand my total investment, recurring costs, and financial position at any point in time
```

**Acceptance Criteria:**

**One-Shot Transactions (Cash Events):**
- [ ] **Purchase:** Initial lot purchase price + notary fees (cash out at deed date)
- [ ] **Sale:** Lot sale proceeds received (cash in)
- [ ] **Copro contributions:** One-time payments for specific work/renovations (cash out)
- [ ] **Redistribution:** Share of hidden lot sale proceeds (cash in)

**Recurring Expenses (Monthly from deed date):**
- [ ] **Own lot expenses:**
  - Loan payment (principal + interest)
  - Property tax
  - Building insurance
  - Common charges (if applicable)
- [ ] **Portage lot expenses:**
  - Loan interest only
  - Empty property tax (higher rate)
  - Insurance
  - No common charges (unit unoccupied)

**Deed Date Integration:**
- [ ] For founders: recurring costs start from deed date (Feb 1, 2026)
- [ ] For newcomers: recurring costs start from their entry date (their own deed date)
- [ ] Cash flow timeline shows "months since deed date" on X-axis

**Visualization Requirements:**
- [ ] Timeline view: Bar chart or line graph showing cash in/out by month from deed date
- [ ] Transaction list: Chronological table with date, type, amount, running balance
- [ ] Summary cards:
  - Total invested (all cash out)
  - Total received (all cash in)
  - Net position (invested - received)
  - Monthly burn rate (average recurring expenses)
  - Months since deed date
- [ ] Filter by date range (e.g., "Show 2024 only")
- [ ] Export to CSV for personal accounting

**Calculation Logic:**
- [ ] Running balance updates with each transaction
- [ ] Recurring expenses calculated from entry date to exit date (or now)
- [ ] For founders: entry date = deed date
- [ ] Portage expenses tracked separately from own lot expenses
- [ ] One-time copro contributions added to total investment

**User Experience:**
- [ ] Expandable section in participant row (click to reveal detailed cash flow)
- [ ] Color coding: green for cash in, red for cash out
- [ ] Tooltips explain each transaction type
- [ ] Mobile-friendly: scrollable transaction list

---

**US6: Configure Deed Date in Calculator**
```
As a project manager
I want to configure the deed date (date de l'acte) when setting up the initial project
So that all cost calculations use the correct start date for our specific project timeline
```

**Acceptance Criteria:**
- [ ] Calculator form has "Deed Date" field
- [ ] Default value: February 1st, 2026
- [ ] User can select any date (past, present, or future)
- [ ] Date displayed in format: "DD/MM/YYYY" (Belgian standard)
- [ ] All founders automatically get `entryDate = deedDate`
- [ ] All initial lots get `acquiredDate = deedDate`
- [ ] Recurring cost calculations start from this deed date
- [ ] Field is clearly labeled: "Date de l'acte / Deed Date"

---

**US7: Bridge from Calculator to Timeline**
```
As a project manager
I want to start with the existing calculator for initial setup
Then transition seamlessly to timeline view for ongoing management
So that I can maintain continuity without re-entering data
```

**Acceptance Criteria:**
- [ ] Calculator form creates valid INITIAL_PURCHASE event with configured deed date
- [ ] Transition button visible after calculator results displayed
- [ ] All participant data transfers (including portage scenarios)
- [ ] Deed date preserved in timeline
- [ ] Project parameters and scenarios preserved
- [ ] User can export/import timeline JSON for backup

---

## Phase 1: Type Unification (2-3 hours)

### Task 1.1: Add Lot type with acquisition date (30 min)

**Test:**
```typescript
// src/types/timeline.test.ts
describe('Lot type', () => {
  it('should track lot ownership with acquisition date', () => {
    const lot: Lot = {
      lotId: 1,
      surface: 85,
      unitId: 101,
      isPortage: false,
      acquiredDate: new Date('2026-02-01'), // Deed date
    };
    expect(lot.acquiredDate).toEqual(new Date('2026-02-01'));
    expect(lot.isPortage).toBe(false);
  });

  it('should track sold lots with carrying costs based on holding duration', () => {
    const lot: Lot = {
      lotId: 2,
      surface: 85,
      unitId: 101,
      isPortage: true,
      acquiredDate: new Date('2026-02-01'), // Initial deed date
      soldDate: new Date('2028-02-01'), // Sold 24 months later
      soldTo: 'Emma',
      salePrice: 195000,
      carryingCosts: 12000, // 24 months of costs
    };

    const monthsHeld = 24;
    expect(lot.carryingCosts).toBe(500 * monthsHeld);
  });
});
```

**Implementation:**
- Add `Lot` interface to `src/types/timeline.ts`
- `acquiredDate: Date` - The deed date when lot was legally acquired
- Include all fields from design doc

**Validation:**
- Tests pass
- TypeScript compiles

---

### Task 1.2: Extend Participant with timeline fields (45 min)

**Test:**
```typescript
// src/utils/calculatorUtils.test.ts
describe('Participant type extensions', () => {
  it('should identify founders with entry date equal to deed date', () => {
    const deedDate = new Date('2026-02-01');
    const founder: Participant = {
      name: 'Alice',
      isFounder: true,
      entryDate: deedDate, // Founders enter at deed date
      lotsOwned: [],
      capitalApporte: 50000,
      notaryFeesRate: 0.125,
      interestRate: 0.04,
      durationYears: 20,
    };
    expect(founder.isFounder).toBe(true);
    expect(founder.entryDate).toEqual(deedDate);
  });

  it('should track newcomer with later entry date', () => {
    const newcomer: Participant = {
      name: 'Emma',
      isFounder: false,
      entryDate: new Date('2028-02-01'), // 2 years after initial deed
      lotsOwned: [],
      capitalApporte: 40000,
      notaryFeesRate: 0.125,
      interestRate: 0.04,
      durationYears: 20,
    };
    expect(newcomer.isFounder).toBe(false);
    expect(newcomer.entryDate).toEqual(new Date('2028-02-01'));
  });

  it('should track participant exit date', () => {
    const exited: Participant = {
      name: 'Bob',
      isFounder: true,
      entryDate: new Date('2026-02-01'),
      exitDate: new Date('2028-06-01'),
      lotsOwned: [],
      capitalApporte: 40000,
      notaryFeesRate: 0.125,
      interestRate: 0.04,
      durationYears: 20,
    };
    expect(exited.exitDate).toEqual(new Date('2028-06-01'));
  });

  it('should replace quantity with lotsOwned array with deed date', () => {
    const deedDate = new Date('2026-02-01');
    const withLots: Participant = {
      name: 'Charlie',
      isFounder: true,
      entryDate: deedDate,
      lotsOwned: [
        {
          lotId: 1,
          surface: 85,
          unitId: 101,
          isPortage: false,
          acquiredDate: deedDate, // Same as entry date for founders
        },
        {
          lotId: 2,
          surface: 85,
          unitId: 101,
          isPortage: true,
          acquiredDate: deedDate,
        },
      ],
      capitalApporte: 170000,
      notaryFeesRate: 0.125,
      interestRate: 0.04,
      durationYears: 20,
    };
    expect(withLots.lotsOwned).toHaveLength(2);
    expect(withLots.lotsOwned[0].acquiredDate).toEqual(deedDate);
    expect(withLots.entryDate).toEqual(deedDate);
  });
});
```

**Implementation:**
- Update `Participant` interface in `src/utils/calculatorUtils.ts`
- Add: `isFounder: boolean`
- Add: `entryDate: Date` (for founders, this equals deed date)
- Add: `exitDate?: Date`
- Change: `quantity: number` → `lotsOwned: Lot[]`
- Remove: `unitId`, `surface` (now per-lot)

**Validation:**
- Tests pass
- TypeScript shows errors in calculator (expected - fix in next task)

---

### Task 1.3: Update CoproLot type (30 min)

**Test:**
```typescript
// src/types/timeline.test.ts
describe('CoproLot type', () => {
  it('should track copropriété lot with deed date and carrying costs', () => {
    const coproLot: CoproLot = {
      lotId: 10,
      surface: 85,
      acquiredDate: new Date('2026-02-01'), // Initial deed date
      soldDate: new Date('2028-02-01'),
      soldTo: 'Emma',
      salePrice: 195000,
      totalCarryingCosts: 6000, // 24 months of copro costs
    };
    expect(coproLot.acquiredDate).toEqual(new Date('2026-02-01'));
    expect(coproLot.totalCarryingCosts).toBe(6000);
  });
});
```

**Implementation:**
- Add `CoproLot` interface to `src/types/timeline.ts`
- Update `CoproEntity.lotsOwned: number[]` → `lotsOwned: CoproLot[]`
- Each copro lot has `acquiredDate` (typically the initial deed date)

**Validation:**
- Tests pass
- TypeScript compiles

---

### Task 1.4: Add cash flow transaction types (45 min)

**Test:**
```typescript
// src/types/cashFlow.test.ts
describe('CashFlowTransaction types', () => {
  it('should represent lot purchase transaction at deed date', () => {
    const txn: CashFlowTransaction = {
      id: 'txn-001',
      participantName: 'Alice',
      date: new Date('2026-02-01'), // Deed date
      type: 'LOT_PURCHASE',
      category: 'ONE_SHOT',
      amount: -191250, // Negative = cash out
      description: 'Purchase of lot #1 (deed date)',
      metadata: {
        lotId: 1,
        purchasePrice: 170000,
        notaryFees: 21250,
      },
    };
    expect(txn.date).toEqual(new Date('2026-02-01'));
    expect(txn.amount).toBeLessThan(0);
    expect(txn.category).toBe('ONE_SHOT');
  });

  it('should represent monthly loan payment starting from deed date', () => {
    const txn: CashFlowTransaction = {
      id: 'txn-002',
      participantName: 'Alice',
      date: new Date('2026-03-01'), // First payment: 1 month after deed
      type: 'LOAN_PAYMENT',
      category: 'RECURRING',
      amount: -714,
      description: 'Monthly loan payment (Mar 2026)',
      metadata: {
        principal: 447,
        interest: 267,
        lotId: 1,
        monthsSinceDeed: 1,
      },
    };
    expect(txn.category).toBe('RECURRING');
    expect(txn.metadata?.monthsSinceDeed).toBe(1);
  });

  it('should represent lot sale proceeds', () => {
    const txn: CashFlowTransaction = {
      id: 'txn-003',
      participantName: 'Bob',
      date: new Date('2028-01-01'),
      type: 'LOT_SALE',
      category: 'ONE_SHOT',
      amount: 195000,
      description: 'Sale of lot #2 to Emma',
      metadata: {
        lotId: 2,
        buyer: 'Emma',
        salePrice: 195000,
        monthsHeld: 23, // From deed date to sale date
      },
    };
    expect(txn.amount).toBeGreaterThan(0);
  });

  it('should represent copro contribution', () => {
    const txn: CashFlowTransaction = {
      id: 'txn-004',
      participantName: 'Alice',
      date: new Date('2026-06-15'),
      type: 'COPRO_CONTRIBUTION',
      category: 'ONE_SHOT',
      amount: -5000,
      description: 'Share of roof repair costs',
      metadata: {
        workType: 'roof_repair',
        totalCost: 15000,
        share: 0.333,
      },
    };
    expect(txn.type).toBe('COPRO_CONTRIBUTION');
  });

  it('should represent redistribution from hidden lot sale', () => {
    const txn: CashFlowTransaction = {
      id: 'txn-005',
      participantName: 'Alice',
      date: new Date('2027-03-01'),
      type: 'REDISTRIBUTION',
      category: 'ONE_SHOT',
      amount: 65000,
      description: 'Share of hidden lot #10 sale',
      metadata: {
        lotId: 10,
        totalSalePrice: 195000,
        quotite: 0.333,
      },
    };
    expect(txn.amount).toBeGreaterThan(0);
  });
});
```

**Implementation:**
- Create `src/types/cashFlow.ts`
- Define `CashFlowTransaction` interface:
  ```typescript
  interface CashFlowTransaction {
    id: string;
    participantName: string;
    date: Date;
    type: TransactionType;
    category: 'ONE_SHOT' | 'RECURRING';
    amount: number; // Negative = out, Positive = in
    description: string;
    metadata?: Record<string, unknown>;
  }

  type TransactionType =
    | 'LOT_PURCHASE'
    | 'LOT_SALE'
    | 'NOTARY_FEES'
    | 'LOAN_PAYMENT'
    | 'PROPERTY_TAX'
    | 'INSURANCE'
    | 'COMMON_CHARGES'
    | 'COPRO_CONTRIBUTION'
    | 'REDISTRIBUTION';
  ```

**Validation:**
- All tests pass
- Types are well-documented with JSDoc

---

### Task 1.5: Remove ParticipantDetails type (1 hour)

**Test:**
```typescript
// src/types/timeline.test.ts
describe('Event type unification', () => {
  it('should use Participant directly in InitialPurchaseEvent with deed date', () => {
    const deedDate = new Date('2026-02-01');
    const event: InitialPurchaseEvent = {
      id: 'evt-001',
      date: deedDate, // Event date = deed date
      type: 'INITIAL_PURCHASE',
      participants: [
        {
          name: 'Alice',
          isFounder: true,
          entryDate: deedDate, // Entry date = deed date for founders
          lotsOwned: [{
            lotId: 1,
            surface: 85,
            unitId: 101,
            isPortage: false,
            acquiredDate: deedDate, // Lot acquired at deed date
          }],
          capitalApporte: 50000,
          notaryFeesRate: 0.125,
          interestRate: 0.04,
          durationYears: 20,
        },
      ],
      projectParams: {} as ProjectParams,
      scenario: {} as Scenario,
      copropropriete: { name: 'Les Acacias', hiddenLots: [] },
    };
    expect(event.date).toEqual(deedDate);
    expect(event.participants[0].isFounder).toBe(true);
    expect(event.participants[0].entryDate).toEqual(deedDate);
    expect(event.participants[0].lotsOwned[0].acquiredDate).toEqual(deedDate);
  });
});
```

**Implementation:**
- Remove `ParticipantDetails` interface from `src/types/timeline.ts`
- Update all event interfaces to use `Participant` directly
- Update event handler signatures
- Ensure `InitialPurchaseEvent.date` represents the deed date

**Validation:**
- Tests pass
- No TypeScript errors
- Run `npm run test:run` - expect failures in event handlers (fix in Phase 2)

---

## Phase 2: Continuous Timeline Projection (4-5 hours)

### UAD: Per-Transaction Calculations from Deed Date (US3)

**Manual Test Scenario:**
```
Given:
  - Deed date: Feb 1, 2026
  - Alice owns lot #2 (portage) acquired on deed date for €170,000
  - Emma wants to buy lot #2 on Feb 1, 2028 (exactly 24 months later)

Then: System calculates:
  - Holding duration: 24 months (from deed date)
  - Base: €170,000
  - Indexation: ~€5,100 (3% over 2 years)
  - Carrying costs: €12,000 (€500/month × 24 months)
  - Fee recovery: €0 (exactly 2 years, no recovery)
  - Total: €187,100
```

### Task 2.1: Add per-transaction sale price calculation (1 hour)

**Test:**
```typescript
// src/utils/timelineCalculations.test.ts
describe('calculateSalePrice from deed date', () => {
  it('should calculate holding duration from acquisition date', () => {
    const lot: Lot = {
      lotId: 1,
      surface: 85,
      unitId: 101,
      isPortage: false,
      acquiredDate: new Date('2026-02-01'), // Deed date
      originalPrice: 170000,
    };
    const saleDate = new Date('2028-02-01'); // 24 months later

    const result = calculateSalePrice(lot, saleDate);

    expect(result.monthsHeld).toBe(24);
    expect(result.base).toBe(170000);
    expect(result.indexation).toBeGreaterThan(0);
    expect(result.carryingCosts).toBe(0); // Not portage
  });

  it('should add carrying costs for portage lots from deed date', () => {
    const lot: Lot = {
      lotId: 2,
      surface: 85,
      unitId: 101,
      isPortage: true,
      acquiredDate: new Date('2026-02-01'),
      originalPrice: 170000,
      monthlyCarryingCost: 500,
    };
    const saleDate = new Date('2028-02-01');

    const result = calculateSalePrice(lot, saleDate);

    expect(result.monthsHeld).toBe(24);
    expect(result.carryingCosts).toBe(500 * 24);
  });

  it('should recover 60% notary fees if sold within 2 years of deed', () => {
    const lot: Lot = {
      lotId: 1,
      surface: 85,
      unitId: 101,
      isPortage: false,
      acquiredDate: new Date('2026-02-01'),
      originalPrice: 170000,
      originalNotaryFees: 21250,
    };
    const saleDate = new Date('2027-06-01'); // 16 months after deed

    const result = calculateSalePrice(lot, saleDate);

    expect(result.monthsHeld).toBe(16);
    expect(result.feeRecovery).toBe(21250 * 0.6);
  });

  it('should NOT recover fees if sold exactly 2 years after deed', () => {
    const lot: Lot = {
      lotId: 1,
      surface: 85,
      unitId: 101,
      isPortage: false,
      acquiredDate: new Date('2026-02-01'),
      originalPrice: 170000,
      originalNotaryFees: 21250,
    };
    const saleDate = new Date('2028-02-01'); // Exactly 24 months

    const result = calculateSalePrice(lot, saleDate);

    expect(result.monthsHeld).toBe(24);
    expect(result.feeRecovery).toBe(0); // >= 2 years, no recovery
  });

  it('should NOT recover fees if sold after 2 years', () => {
    const lot: Lot = {
      lotId: 1,
      surface: 85,
      unitId: 101,
      isPortage: false,
      acquiredDate: new Date('2026-02-01'),
      originalPrice: 170000,
      originalNotaryFees: 21250,
    };
    const saleDate = new Date('2028-06-01'); // 28 months

    const result = calculateSalePrice(lot, saleDate);

    expect(result.monthsHeld).toBe(28);
    expect(result.feeRecovery).toBe(0);
  });
});
```

**Implementation:**
- Create `src/utils/timelineCalculations.ts`
- Implement `calculateSalePrice(lot, saleDate)` function
- Calculate `monthsHeld = monthsBetween(lot.acquiredDate, saleDate)`
- Use `monthsBetween()` helper
- Import indexation formula from portage calculations
- Fee recovery only if `monthsHeld < 24`

**UAD Validation:**
- [ ] All tests pass
- [ ] Formula matches design doc spec
- [ ] Holding duration calculated from deed date
- [ ] Manual calculation matches system output

---

### Task 2.2: Build participant cash flow from events (2.5 hours)

**Test:**
```typescript
// src/utils/cashFlowProjection.test.ts
describe('buildParticipantCashFlow from deed date', () => {
  it('should create purchase transaction at deed date', () => {
    const deedDate = new Date('2026-02-01');
    const events: DomainEvent[] = [{
      id: 'evt-001',
      date: deedDate,
      type: 'INITIAL_PURCHASE',
      participants: [mockAliceFounder],
      projectParams: mockParams,
      scenario: mockScenario,
      copropropriete: mockCopro,
    }];

    const cashFlow = buildParticipantCashFlow(events, 'Alice');

    const purchase = cashFlow.transactions.find(t => t.type === 'LOT_PURCHASE');
    expect(purchase?.date).toEqual(deedDate);
    expect(purchase?.amount).toBe(-191250);
  });

  it('should generate monthly recurring expenses starting from deed date', () => {
    const deedDate = new Date('2026-02-01');
    const events = [mockInitialPurchaseEvent(deedDate)];
    const endDate = new Date('2026-12-31');

    const cashFlow = buildParticipantCashFlow(events, 'Alice', endDate);

    const loanPayments = cashFlow.transactions.filter(
      t => t.type === 'LOAN_PAYMENT'
    );

    // First payment: March 1, 2026 (1 month after deed)
    // Last payment: December 1, 2026
    expect(loanPayments).toHaveLength(10); // Feb (deed) + 10 months
    expect(loanPayments[0].date).toEqual(new Date('2026-03-01'));
    expect(loanPayments[0].metadata?.monthsSinceDeed).toBe(1);
  });

  it('should track portage lot expenses separately from deed date', () => {
    const deedDate = new Date('2026-02-01');
    const events = [mockInitialPurchaseWithPortage(deedDate)];
    const endDate = new Date('2026-12-31');

    const cashFlow = buildParticipantCashFlow(events, 'Bob', endDate);

    // Own lot: full expenses (principal + interest)
    const ownExpenses = cashFlow.transactions.filter(
      t => t.metadata?.lotId === 1 && t.type === 'LOAN_PAYMENT'
    );
    expect(ownExpenses[0].metadata?.principal).toBeGreaterThan(0);

    // Portage lot: interest only
    const portageExpenses = cashFlow.transactions.filter(
      t => t.metadata?.lotId === 2 && t.type === 'LOAN_PAYMENT'
    );
    expect(portageExpenses[0].metadata?.principal).toBe(0);
    expect(portageExpenses[0].metadata?.interest).toBeGreaterThan(0);
  });

  it('should add sale proceeds when lot sold', () => {
    const deedDate = new Date('2026-02-01');
    const saleDate = new Date('2028-01-01');
    const events = [
      mockInitialPurchaseEvent(deedDate),
      mockLotSaleEvent(saleDate),
    ];

    const cashFlow = buildParticipantCashFlow(events, 'Alice');

    const sale = cashFlow.transactions.find(t => t.type === 'LOT_SALE');
    expect(sale?.amount).toBe(195000);
    expect(sale?.date).toEqual(saleDate);
    expect(sale?.metadata?.monthsHeld).toBe(23); // From deed to sale
  });

  it('should stop recurring expenses after participant exits', () => {
    const deedDate = new Date('2026-02-01');
    const exitDate = new Date('2028-01-01');
    const events = [
      mockInitialPurchaseEvent(deedDate),
      mockParticipantExitsEvent(exitDate),
    ];
    const endDate = new Date('2028-12-31');

    const cashFlow = buildParticipantCashFlow(events, 'Alice', endDate);

    const expensesAfterExit = cashFlow.transactions.filter(
      t => t.date > exitDate && t.amount < 0
    );
    expect(expensesAfterExit).toHaveLength(0);
  });

  it('should include copro contributions', () => {
    const deedDate = new Date('2026-02-01');
    const events = [
      mockInitialPurchaseEvent(deedDate),
      mockCoproContributionEvent,
    ];

    const cashFlow = buildParticipantCashFlow(events, 'Alice');

    const contribution = cashFlow.transactions.find(
      t => t.type === 'COPRO_CONTRIBUTION'
    );
    expect(contribution?.amount).toBe(-5000);
  });

  it('should include redistribution from hidden lot sale', () => {
    const deedDate = new Date('2026-02-01');
    const events = [
      mockInitialPurchaseEvent(deedDate),
      mockHiddenLotRevealedEvent,
    ];

    const cashFlow = buildParticipantCashFlow(events, 'Alice');

    const redistribution = cashFlow.transactions.find(
      t => t.type === 'REDISTRIBUTION'
    );
    expect(redistribution?.amount).toBeGreaterThan(0);
  });

  it('should calculate running balance from deed date', () => {
    const deedDate = new Date('2026-02-01');
    const events = mockCompleteScenario(deedDate);

    const cashFlow = buildParticipantCashFlow(events, 'Alice');

    // First transaction should be at deed date (purchase)
    expect(cashFlow.transactions[0].date).toEqual(deedDate);

    // Running balance should be cumulative
    cashFlow.transactions.forEach((txn, idx) => {
      expect(txn.runningBalance).toBeDefined();
      if (idx > 0) {
        const expected = cashFlow.transactions[idx - 1].runningBalance! + txn.amount;
        expect(txn.runningBalance).toBeCloseTo(expected, 2);
      }
    });
  });

  it('should calculate summary metrics', () => {
    const deedDate = new Date('2026-02-01');
    const events = mockCompleteScenario(deedDate);

    const cashFlow = buildParticipantCashFlow(events, 'Alice');

    expect(cashFlow.summary.totalInvested).toBeGreaterThan(0);
    expect(cashFlow.summary.totalReceived).toBeGreaterThanOrEqual(0);
    expect(cashFlow.summary.netPosition).toBeDefined();
    expect(cashFlow.summary.monthlyBurnRate).toBeGreaterThan(0);
  });
});
```

**Implementation:**
- Create `src/utils/cashFlowProjection.ts`
- Function: `buildParticipantCashFlow(events, participantName, endDate?)`
- Returns `ParticipantCashFlow`:
  ```typescript
  interface ParticipantCashFlow {
    participantName: string;
    transactions: CashFlowTransaction[];
    summary: {
      totalInvested: number;
      totalReceived: number;
      netPosition: number;
      monthlyBurnRate: number;
    };
  }
  ```
- Generate transactions:
  - Initial purchase at deed date
  - Monthly expenses starting 1 month after deed date
  - For founders: start from deed date
  - For newcomers: start from their entry date
  - Stop at exit date or endDate
- Calculate running balance
- Track metadata: `monthsSinceDeed`, `monthsHeld`

**UAD Validation (US5):**
- [ ] All tests pass
- [ ] One-shot transactions at deed date
- [ ] Recurring expenses start from correct date
- [ ] Running balance accurate

---

### Task 2.3: Build participant timeline from events (1.5 hours)

**Test:**
```typescript
// src/utils/timelineProjection.test.ts
describe('buildParticipantTimeline', () => {
  it('should project founder at deed date', () => {
    const deedDate = new Date('2026-02-01');
    const events: DomainEvent[] = [mockInitialPurchaseEvent(deedDate)];

    const timeline = buildParticipantTimeline(events, 'Alice');

    expect(timeline.participant.name).toBe('Alice');
    expect(timeline.participant.isFounder).toBe(true);
    expect(timeline.participant.entryDate).toEqual(deedDate);
    expect(timeline.events).toHaveLength(1);
    expect(timeline.status).toBe('ACTIVE');
  });

  it('should include cash flow starting from deed date', () => {
    const deedDate = new Date('2026-02-01');
    const events = mockCompleteScenario(deedDate);

    const timeline = buildParticipantTimeline(events, 'Alice');

    expect(timeline.cashFlow).toBeDefined();
    expect(timeline.cashFlow.transactions.length).toBeGreaterThan(0);
    expect(timeline.cashFlow.transactions[0].date).toEqual(deedDate);
  });

  it('should track lot acquisition at deed date', () => {
    const deedDate = new Date('2026-02-01');
    const events: DomainEvent[] = [mockInitialPurchaseEvent(deedDate)];

    const timeline = buildParticipantTimeline(events, 'Alice');

    expect(timeline.lotsHistory).toHaveLength(1);
    expect(timeline.lotsHistory[0].acquiredDate).toEqual(deedDate);
    expect(timeline.currentLots).toHaveLength(1);
  });

  it('should mark participant as EXITED when all lots sold', () => {
    const deedDate = new Date('2026-02-01');
    const exitDate = new Date('2028-01-01');
    const events: DomainEvent[] = [
      mockInitialPurchaseEvent(deedDate),
      mockParticipantExitsEvent(exitDate),
    ];

    const timeline = buildParticipantTimeline(events, 'Alice');

    expect(timeline.status).toBe('EXITED');
    expect(timeline.participant.exitDate).toEqual(exitDate);
  });
});
```

**Implementation:**
- Create `buildParticipantTimeline()` in `timelineProjection.ts`
- Integrate `buildParticipantCashFlow()`
- Return `ParticipantTimeline` with:
  - `participant: Participant`
  - `events: DomainEvent[]`
  - `lotsHistory: Lot[]`
  - `currentLots: Lot[]`
  - `status: 'ACTIVE' | 'PORTAGE' | 'EXITED'`
  - `cashFlow: ParticipantCashFlow`

**UAD Validation (US2, US5):**
- [ ] All tests pass
- [ ] Cash flow integrated
- [ ] Deed date preserved

---

### Task 2.4: Build continuous timeline projection (1 hour)

**Test:**
```typescript
// src/utils/timelineProjection.test.ts
describe('projectContinuousTimeline', () => {
  it('should create timeline with deed date as T0', () => {
    const deedDate = new Date('2026-02-01');
    const events: DomainEvent[] = [
      mockInitialPurchaseWithTwoFounders(deedDate),
      mockNewcomerJoinsEvent,
    ];

    const timeline = projectContinuousTimeline(events);

    expect(timeline.deedDate).toEqual(deedDate);
    expect(timeline.participants).toHaveLength(3);
  });

  it('should include cash flow for each participant from deed date', () => {
    const deedDate = new Date('2026-02-01');
    const events = mockCompleteScenario(deedDate);

    const timeline = projectContinuousTimeline(events);

    timeline.participants.forEach(p => {
      expect(p.cashFlow).toBeDefined();
      if (p.isFounder) {
        expect(p.cashFlow.transactions[0].date).toEqual(deedDate);
      }
    });
  });
});
```

**Implementation:**
- Create `projectContinuousTimeline()` function
- Extract `deedDate` from `InitialPurchaseEvent.date`
- Build participant timelines
- Return:
  ```typescript
  interface ContinuousTimeline {
    deedDate: Date; // T0
    participants: ParticipantTimeline[];
    copropropriete: CoproEntity;
    events: DomainEvent[];
  }
  ```

**UAD Validation (US1, US3, US4, US5):**
- [ ] All tests pass
- [ ] Deed date tracked as T0
- [ ] Performance acceptable

---

## Phase 3: Event Handler Updates (3-4 hours)

### Task 3.1: Update INITIAL_PURCHASE handler (1 hour)

**Test:**
```typescript
// src/utils/chronologyCalculations.test.ts
describe('handleInitialPurchase with deed date', () => {
  it('should create participants with entry date = deed date', () => {
    const deedDate = new Date('2026-02-01');
    const event: InitialPurchaseEvent = {
      id: 'evt-001',
      date: deedDate,
      type: 'INITIAL_PURCHASE',
      participants: [mockAliceParticipant],
      projectParams: mockParams,
      scenario: mockScenario,
      copropropriete: { name: 'Les Acacias', hiddenLots: [10, 11] },
    };

    const state = handleInitialPurchase(event);

    expect(state.participants).toHaveLength(1);
    expect(state.participants[0].entryDate).toEqual(deedDate);
    expect(state.participants[0].lotsOwned[0].acquiredDate).toEqual(deedDate);
    expect(state.copropropriete.lotsOwned).toHaveLength(2);
  });

  it('should mark all initial participants as founders', () => {
    const deedDate = new Date('2026-02-01');
    const event = mockInitialPurchaseWithThreeParticipants(deedDate);

    const state = handleInitialPurchase(event);

    expect(state.participants.every(p => p.isFounder)).toBe(true);
    expect(state.participants.every(p => p.entryDate.getTime() === deedDate.getTime())).toBe(true);
  });
});
```

**Implementation:**
- Update `handleInitialPurchase()` in `chronologyCalculations.ts`
- Set all founders' `entryDate = event.date` (deed date)
- Set all lots' `acquiredDate = event.date`
- Set `isFounder: true`

**Validation:**
- Tests pass
- Calculator integration works

---

### Task 3.2: Update NEWCOMER_JOINS handler (1 hour)

**Test:**
```typescript
describe('handleNewcomerJoins', () => {
  it('should transfer lot with new acquisition date', () => {
    const deedDate = new Date('2026-02-01');
    const saleDate = new Date('2028-01-01');
    const initialState = mockStateWithAliceOwningTwoLots(deedDate);
    const event: NewcomerJoinsEvent = {
      id: 'evt-002',
      date: saleDate,
      type: 'NEWCOMER_JOINS',
      buyer: mockEmmaNewcomer,
      acquisition: {
        from: 'Alice',
        lotId: 2,
        purchasePrice: 195000,
        breakdown: mockPriceBreakdown,
      },
      notaryFees: 24375,
      financing: mockFinancing,
    };

    const newState = handleNewcomerJoins(initialState, event);

    const alice = newState.participants.find(p => p.name === 'Alice');
    const emma = newState.participants.find(p => p.name === 'Emma');

    expect(alice?.lotsOwned).toHaveLength(1);
    expect(emma?.lotsOwned).toHaveLength(1);
    expect(emma?.lotsOwned[0].lotId).toBe(2);
    expect(emma?.lotsOwned[0].acquiredDate).toEqual(saleDate); // New acquisition date
    expect(emma?.entryDate).toEqual(saleDate);
    expect(emma?.isFounder).toBe(false);
  });
});
```

**Implementation:**
- Update `handleNewcomerJoins()`
- Transfer lot with new `acquiredDate = event.date`
- Set newcomer's `entryDate = event.date`
- Set `isFounder: false`

**Validation:**
- Tests pass
- Lot transfers with correct dates

---

### Task 3.3: Update remaining handlers (1.5 hours)

**Implementation:**
- Update all remaining event handlers
- Preserve acquisition dates on lot transfers
- Work with `Lot[]` and `CoproLot[]`

**Validation:**
- All 156+ existing tests pass
- Run `npm run test:run`

---

## Phase 4: UI Refactor (5-7 hours)

### Task 4.1: Add deed date field to calculator (1 hour) ⭐ NEW

**Component:** Update `EnDivisionCorrect.tsx`

**Implementation:**
```typescript
// Add state
const [deedDate, setDeedDate] = useState<Date>(new Date('2026-02-01'));

// Add field in form
<div className="mb-4">
  <label className="block text-sm font-medium mb-2">
    Date de l'acte / Deed Date
  </label>
  <input
    type="date"
    value={deedDate.toISOString().split('T')[0]}
    onChange={(e) => setDeedDate(new Date(e.target.value))}
    className="border rounded px-3 py-2"
  />
  <p className="text-xs text-gray-500 mt-1">
    Date when the property deed will be signed (start of all costs)
  </p>
</div>
```

**Manual Test:**
```
1. Open calculator form
2. See "Date de l'acte / Deed Date" field
3. Default value: 01/02/2026
4. Change to 15/03/2026
5. Submit form
6. Verify results use new date for calculations
```

**UAD Validation (US6):**
- [ ] Field visible in calculator
- [ ] Default: February 1st, 2026
- [ ] User can change date
- [ ] Belgian format display (DD/MM/YYYY)
- [ ] Clear label and helper text

---

### Task 4.2: Create horizontal timeline component (1.5 hours)

**Component:** `TimelineVisualization.tsx`

**Implementation:**
- SVG timeline with deed date as T0
- Event markers with dates
- Click handlers for details
- Label deed date as "T0"

**Manual Test:**
```
1. Timeline shows deed date (Feb 1, 2026) at left as "T0"
2. Events positioned relative to T0
3. Hover shows "X months from deed date"
```

**UAD Validation (US1):**
- [ ] T0 clearly marked with deed date
- [ ] All checklist items pass

---

### Task 4.3: Create participant cash flow component (2.5 hours)

**Component:** `ParticipantCashFlowView.tsx`

**Implementation:**
- Transaction list starting from deed date
- Chart X-axis: "Months from deed date"
- Summary card: "Months since deed date: 23"

**Manual Test:**
```
1. Expand Alice's cash flow
2. First transaction: Feb 1, 2026 (deed date) - Purchase
3. Second transaction: Mar 1, 2026 (month 1) - Loan payment
4. Chart X-axis shows: 0, 1, 2, 3... (months from deed)
5. Summary shows: "23 months since deed date"
```

**UAD Validation (US5):**
- [ ] All transactions from deed date
- [ ] Timeline relative to deed date
- [ ] Summary shows months since deed
- [ ] All checklist items pass

---

### Task 4.4: Update participants table layout (1.5 hours)

**Component:** `ParticipantsTable.tsx`

**Implementation:**
- Show entry date (for founders = deed date)
- Display "Founder" badge if `entryDate === deedDate`
- Integrate cash flow view

**Manual Test:**
```
1. Founders show entry date: Feb 1, 2026 (deed date)
2. Founder badge visible
3. Newcomer shows later entry date: Jan 1, 2028
4. No founder badge for newcomer
```

**UAD Validation (US2):**
- [ ] Entry dates correct
- [ ] Founders identified
- [ ] All checklist items pass

---

### Task 4.5: Create copropriété panel (1.5 hours)

**Component:** `CoproprietéPanel.tsx`

**Implementation:**
- Display copro costs from deed date
- Show months since deed date

**UAD Validation (US4):**
- [ ] All checklist items pass

---

### Task 4.6: Integrate components into timeline page (1 hour)

**Page:** Update `src/pages/timeline-demo.astro`

**Manual Test:**
```
1. Full page with deed date integration
2. All components show consistent deed date
3. Timeline starts at T0 (deed date)
```

**UAD Validation:**
- [ ] Full integration works
- [ ] Deed date consistent across all views

---

## Phase 5: Calculator Integration (2-3 hours)

### Task 5.1: Bridge calculator to timeline with deed date (1.5 hours)

**Test:**
```typescript
// src/utils/calculatorToTimeline.test.ts
describe('convertCalculatorToInitialPurchaseEvent with deed date', () => {
  it('should use configured deed date as event date', () => {
    const deedDate = new Date('2026-02-01');
    const inputs = {
      participants: mockCalculatorParticipants,
      projectParams: mockProjectParams,
      scenario: mockScenario,
      deedDate: deedDate,
    };

    const event = convertCalculatorToInitialPurchaseEvent(inputs);

    expect(event.date).toEqual(deedDate);
    expect(event.type).toBe('INITIAL_PURCHASE');
  });

  it('should set all founders entry date to deed date', () => {
    const deedDate = new Date('2026-02-01');
    const inputs = mockCalculatorInputs(deedDate);

    const event = convertCalculatorToInitialPurchaseEvent(inputs);

    expect(event.participants.every(p => p.entryDate.getTime() === deedDate.getTime())).toBe(true);
    expect(event.participants.every(p => p.isFounder)).toBe(true);
  });

  it('should set all lots acquisition date to deed date', () => {
    const deedDate = new Date('2026-02-01');
    const inputs = mockCalculatorInputs(deedDate);

    const event = convertCalculatorToInitialPurchaseEvent(inputs);

    const allLots = event.participants.flatMap(p => p.lotsOwned);
    expect(allLots.every(lot => lot.acquiredDate.getTime() === deedDate.getTime())).toBe(true);
  });
});
```

**Implementation:**
- Update `convertCalculatorToInitialPurchaseEvent()` to accept `deedDate`
- Set `event.date = deedDate`
- Set all participants' `entryDate = deedDate`
- Set all lots' `acquiredDate = deedDate`
- Add "Continue to Timeline" button

**UAD Validation (US6, US7):**
- [ ] Deed date transfers correctly
- [ ] All dates synchronized
- [ ] Button functional

---

### Task 5.2: Add timeline export/import (1 hour)

**Test:**
```typescript
describe('Timeline JSON export with deed date', () => {
  it('should serialize deed date correctly', () => {
    const deedDate = new Date('2026-02-01');
    const timeline = mockCompleteTimeline(deedDate);

    const json = exportTimelineToJSON(timeline);
    const parsed = JSON.parse(json);

    expect(parsed.deedDate).toBe('2026-02-01T00:00:00.000Z');
    expect(parsed.events).toHaveLength(5);
  });

  it('should deserialize deed date as Date object', () => {
    const json = mockTimelineJSON;

    const timeline = importTimelineFromJSON(json);

    expect(timeline.deedDate).toBeInstanceOf(Date);
    expect(timeline.events[0].date).toBeInstanceOf(Date);
  });
});
```

**Implementation:**
- Serialize deed date in JSON export
- Deserialize correctly on import
- Add Export/Import buttons

**UAD Validation (US7):**
- [ ] Deed date preserved in export/import
- [ ] All checklist items pass

---

## Phase 6: Final Acceptance & Documentation (1-2 hours)

### Task 6.1: User Acceptance Testing

**Complete UAD Checklist:**

#### US1: View Complete Project Timeline ✅
- [ ] Timeline shows all events from deed date (T0)
- [ ] T0 clearly marked with deed date
- [ ] Events clickable with details
- [ ] Visual distinction between event types
- [ ] Responsive mobile/desktop
- [ ] "Now" marker visible

#### US2: Track Individual Participant Journeys ✅
- [ ] For founders: entry date = deed date
- [ ] Entry date, status, exit date visible
- [ ] Lots owned displayed
- [ ] Expandable cash flow sections
- [ ] Past participants visible
- [ ] Founders distinguished

#### US3: Calculate Time-Based Resale Prices ✅
- [ ] Holding duration from deed date
- [ ] Sale price formula correct
- [ ] Breakdown shows components
- [ ] Portage carrying costs from deed date
- [ ] Fee recovery if <2 years from deed
- [ ] Uses actual months held

#### US4: Monitor Copropriété Financial Health ✅
- [ ] Cash reserve displayed
- [ ] Costs from deed date
- [ ] Monthly obligations breakdown
- [ ] Cash flow visualization
- [ ] Alert if cash low

#### US5: View Participant Cash Flow Over Time ✅
- [ ] Transactions from deed date
- [ ] Timeline chart relative to deed date
- [ ] Summary shows months since deed
- [ ] All transaction types captured
- [ ] Running balance accurate
- [ ] Export functional

#### US6: Configure Deed Date in Calculator ✅
- [ ] Field visible
- [ ] Default: Feb 1, 2026
- [ ] User can change
- [ ] Belgian format
- [ ] Clear label
- [ ] Founders' entry date = deed date
- [ ] All lots' acquisition date = deed date
- [ ] Recurring costs start from deed date

#### US7: Bridge from Calculator to Timeline ✅
- [ ] Deed date transfers
- [ ] All data preserved
- [ ] Export/import works

---

### Task 6.2: Technical Validation

```bash
npm run test:run
```

**Expected:**
- [ ] All 180+ tests passing
- [ ] No TypeScript errors
- [ ] Build succeeds
- [ ] No console errors

---

### Task 6.3: Documentation

**Update:**
- [ ] README.md - Document deed date feature
- [ ] JSDoc comments
- [ ] User guide with deed date explanation

**User guide section:**
```markdown
## Deed Date (Date de l'acte)

The deed date is when you legally acquire the property. This is T0 (Time Zero) for your project.

### Why it matters:
- All recurring costs start from the deed date
- Resale calculations use holding duration from deed date
- Notary fee recovery (60%) applies if selling within 2 years of deed date
- Founders all enter on the deed date

### Setting the deed date:
1. In calculator, find "Date de l'acte / Deed Date" field
2. Default: February 1st, 2026
3. Change to your actual deed signing date
4. All calculations will use this as the starting point
```

---

### Task 6.4: Performance Check

**Metrics:**
- [ ] Timeline projection <100ms
- [ ] Cash flow calculation <50ms per participant
- [ ] UI renders 60fps
- [ ] Bundle size increase <75KB

---

## Success Criteria (Final Checklist)

**From design doc:**
- [ ] Single `Participant` type
- [ ] Per-transaction calculations from deed date
- [ ] Continuous timeline with T0 = deed date
- [ ] Portage tracking
- [ ] Copropriété entity
- [ ] UI integration
- [ ] All tests passing
- [ ] Calculator → timeline integration

**UAD Validation:**
- [ ] All 7 user stories satisfied
- [ ] Deed date configurable
- [ ] Default: Feb 1, 2026
- [ ] Founders' entry date = deed date
- [ ] All costs from deed date

---

## Notes

- Deed date is T0 for the entire project
- Default: February 1st, 2026 (not "today")
- For founders: `entryDate === deedDate`
- For newcomers: `entryDate` = their own purchase date
- All recurring costs calculated from deed date
- Resale holding duration = months from deed date
