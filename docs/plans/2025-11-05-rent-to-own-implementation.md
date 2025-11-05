# Rent-to-Own (Location-Accession) Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement rent-to-own functionality that allows trial periods before purchase commitment with equity buildup

**Architecture:** Compositional wrapper pattern - RentToOwnAgreement wraps existing sale types (portage/copro/classic). Follows existing patterns: pure functions in utils/, pluggable formulas like portageFormula, XState v5 machines in stateMachine/, co-located tests.

**Tech Stack:** TypeScript, XState v5, Vitest, React

**Design Reference:** [docs/plans/2025-11-05-rent-to-own-design.md](./2025-11-05-rent-to-own-design.md)

---

## Phase 1: Core Types & Formula (Days 1-3)

### Task 1: Add Rent-to-Own Types to calculatorUtils.ts

**Files:**
- Modify: `src/utils/calculatorUtils.ts:1-100` (add new interfaces after existing types)
- Create: `src/utils/calculatorUtils.test.ts` (add tests for type validation)

**Step 1: Write failing test for type structure**

Add to `src/utils/calculatorUtils.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import type { RentToOwnFormulaParams, RentToOwnAgreement } from './calculatorUtils';

describe('Rent-to-Own Types', () => {
  it('should accept valid RentToOwnFormulaParams', () => {
    const formula: RentToOwnFormulaParams = {
      version: 'v1',
      equityPercentage: 50,
      rentPercentage: 50,
      minTrialMonths: 3,
      maxTrialMonths: 24,
      equityForfeitureOnBuyerExit: 100,
      equityReturnOnCommunityReject: 100,
      allowExtensions: true,
      maxExtensions: 2,
      extensionIncrementMonths: 6
    };

    expect(formula.version).toBe('v1');
    expect(formula.equityPercentage + formula.rentPercentage).toBe(100);
  });

  it('should validate equity/rent split sums to 100', () => {
    const formula: RentToOwnFormulaParams = {
      version: 'v1',
      equityPercentage: 60,
      rentPercentage: 40,
      minTrialMonths: 3,
      maxTrialMonths: 24,
      equityForfeitureOnBuyerExit: 100,
      equityReturnOnCommunityReject: 100,
      allowExtensions: true
    };

    expect(formula.equityPercentage + formula.rentPercentage).toBe(100);
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npm run test -- src/utils/calculatorUtils.test.ts
```

Expected: `TypeScript error: Cannot find name 'RentToOwnFormulaParams'`

**Step 3: Add type definitions to calculatorUtils.ts**

Add after line 93 (after DEFAULT_PORTAGE_FORMULA):

```typescript
// Rent-to-Own Formula (pluggable like portageFormula)
export interface RentToOwnFormulaParams {
  version: 'v1';  // For future evolution

  // Equity/rent split configuration
  equityPercentage: number;  // 0-100, e.g., 50 = 50% to equity
  rentPercentage: number;    // Must sum to 100 with equityPercentage

  // Duration bounds
  minTrialMonths: number;    // Default: 3
  maxTrialMonths: number;    // Default: 24

  // Termination rules
  equityForfeitureOnBuyerExit: number;  // 0-100, e.g., 100 = loses all equity
  equityReturnOnCommunityReject: number; // 0-100, e.g., 100 = gets all equity back

  // Extension rules
  allowExtensions: boolean;
  maxExtensions?: number;
  extensionIncrementMonths?: number;  // e.g., 6 months per extension
}

export const DEFAULT_RENT_TO_OWN_FORMULA: RentToOwnFormulaParams = {
  version: 'v1',

  equityPercentage: 50,  // 50/50 split
  rentPercentage: 50,

  minTrialMonths: 3,
  maxTrialMonths: 24,

  equityForfeitureOnBuyerExit: 100,  // Buyer walks = loses all equity
  equityReturnOnCommunityReject: 100, // Community rejects = full refund

  allowExtensions: true,
  maxExtensions: 2,
  extensionIncrementMonths: 6
};

// Extension request tracking
export interface ExtensionRequest {
  requestDate: Date;
  additionalMonths: number;
  approved: boolean | null;  // null = pending vote
}

// Rent-to-Own Agreement (wraps any sale type)
export interface RentToOwnAgreement {
  id: string;
  // underlyingSale would reference Sale type from state machine
  // For now, we'll add basic structure

  // Trial configuration
  trialStartDate: Date;
  trialEndDate: Date;
  trialDurationMonths: number;  // 3-24 months

  // Financial tracking
  monthlyPayment: number;
  totalPaid: number;
  equityAccumulated: number;
  rentPaid: number;

  // Formula plugin
  rentToOwnFormula: RentToOwnFormulaParams;

  // Participants
  provisionalBuyerId: string;  // Participant ID
  sellerId: string;  // Participant ID or 'copropriete'

  // Status
  status: 'active' | 'ending_soon' | 'decision_pending' | 'completed' | 'cancelled';
  extensionRequests: ExtensionRequest[];
}
```

**Step 4: Extend Participant interface with provisional status fields**

Add to Participant interface (around line 8-52):

```typescript
export interface Participant {
  name: string;
  capitalApporte: number;
  notaryFeesRate: number;
  interestRate: number;
  durationYears: number;

  // ... existing fields ...

  // Rent-to-own provisional status (NEW)
  participantStatus?: 'provisional' | 'full';  // Default 'full'
  hasVotingRights?: boolean;          // Default true, false for provisional
  excludeFromQuotite?: boolean;       // Default false, true for provisional
  canAttendMeetings?: boolean;        // Default true
  rentToOwnAgreementId?: string;      // Link to agreement if provisional

  // ... rest of existing fields ...
}
```

**Step 5: Run test to verify it passes**

```bash
npm run test -- src/utils/calculatorUtils.test.ts
```

Expected: `PASS` for rent-to-own type tests

**Step 6: Commit**

```bash
git add src/utils/calculatorUtils.ts src/utils/calculatorUtils.test.ts
git commit -m "feat(types): add rent-to-own types and formula to calculatorUtils

- Add RentToOwnFormulaParams interface with pluggable equity/rent split
- Add DEFAULT_RENT_TO_OWN_FORMULA (50/50 split, 3-24 months, extensions allowed)
- Add ExtensionRequest interface for trial period extensions
- Add RentToOwnAgreement interface as compositional wrapper
- Extend Participant with provisional status fields
- Add type validation tests

Part of rent-to-own feature implementation.

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 2: Implement Rent-to-Own Calculation Functions

**Files:**
- Create: `src/utils/rentToOwnCalculations.ts`
- Create: `src/utils/rentToOwnCalculations.test.ts`

**Step 1: Write failing tests for calculation functions**

Create `src/utils/rentToOwnCalculations.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import {
  calculateRentToOwnPayment,
  calculateAccumulatedEquity,
  calculateFinalPurchasePrice
} from './rentToOwnCalculations';
import { DEFAULT_RENT_TO_OWN_FORMULA } from './calculatorUtils';
import type { RentToOwnAgreement } from './calculatorUtils';

describe('Rent-to-Own Calculations', () => {
  const mockAgreement: RentToOwnAgreement = {
    id: 'rto-001',
    trialStartDate: new Date('2027-06-01'),
    trialEndDate: new Date('2028-06-01'),
    trialDurationMonths: 12,
    monthlyPayment: 1500,
    totalPaid: 0,
    equityAccumulated: 0,
    rentPaid: 0,
    rentToOwnFormula: DEFAULT_RENT_TO_OWN_FORMULA,
    provisionalBuyerId: 'buyer-123',
    sellerId: 'seller-456',
    status: 'active',
    extensionRequests: []
  };

  describe('calculateRentToOwnPayment', () => {
    it('should split payment 50/50 with default formula', () => {
      const payment = calculateRentToOwnPayment(mockAgreement, new Date('2027-07-01'));

      expect(payment.totalAmount).toBe(1500);
      expect(payment.equityPortion).toBe(750);  // 50% of 1500
      expect(payment.rentPortion).toBe(750);    // 50% of 1500
      expect(payment.percentToEquity).toBe(50);
    });

    it('should handle custom equity split (60/40)', () => {
      const customAgreement = {
        ...mockAgreement,
        rentToOwnFormula: {
          ...DEFAULT_RENT_TO_OWN_FORMULA,
          equityPercentage: 60,
          rentPercentage: 40
        }
      };

      const payment = calculateRentToOwnPayment(customAgreement, new Date('2027-07-01'));

      expect(payment.equityPortion).toBe(900);  // 60% of 1500
      expect(payment.rentPortion).toBe(600);    // 40% of 1500
    });
  });

  describe('calculateAccumulatedEquity', () => {
    it('should calculate equity for 6 months', () => {
      const equity = calculateAccumulatedEquity(
        mockAgreement,
        new Date('2027-12-01')  // 6 months after start
      );

      expect(equity).toBe(4500);  // 6 months × €750/month
    });

    it('should calculate equity for full 12 months', () => {
      const equity = calculateAccumulatedEquity(
        mockAgreement,
        new Date('2028-06-01')  // 12 months after start
      );

      expect(equity).toBe(9000);  // 12 months × €750/month
    });

    it('should not exceed trial duration', () => {
      const equity = calculateAccumulatedEquity(
        mockAgreement,
        new Date('2029-01-01')  // 19 months after start (beyond trial)
      );

      expect(equity).toBe(9000);  // Capped at 12 months
    });

    it('should return 0 before trial starts', () => {
      const equity = calculateAccumulatedEquity(
        mockAgreement,
        new Date('2027-05-01')  // Before trial start
      );

      expect(equity).toBe(0);
    });
  });

  describe('calculateFinalPurchasePrice', () => {
    it('should reduce base price by accumulated equity', () => {
      const agreementWithEquity = {
        ...mockAgreement,
        equityAccumulated: 9000
      };

      const finalPrice = calculateFinalPurchasePrice(
        agreementWithEquity,
        256490  // Base portage price
      );

      expect(finalPrice).toBe(247490);  // 256490 - 9000
    });

    it('should not go below zero', () => {
      const agreementWithHighEquity = {
        ...mockAgreement,
        equityAccumulated: 300000
      };

      const finalPrice = calculateFinalPurchasePrice(
        agreementWithHighEquity,
        256490
      );

      expect(finalPrice).toBe(0);  // Never negative
    });
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npm run test -- src/utils/rentToOwnCalculations.test.ts
```

Expected: `Cannot find module './rentToOwnCalculations'`

**Step 3: Implement calculation functions**

Create `src/utils/rentToOwnCalculations.ts`:

```typescript
/**
 * Rent-to-Own calculation functions
 * All functions are pure and testable
 */

import type { RentToOwnAgreement, RentToOwnFormulaParams } from './calculatorUtils';

export interface RentToOwnPayment {
  month: Date;
  totalAmount: number;
  equityPortion: number;    // Builds toward purchase
  rentPortion: number;      // Compensates seller for use
  percentToEquity: number;  // From formula (e.g., 50%)
}

/**
 * Calculate monthly payment breakdown
 */
export function calculateRentToOwnPayment(
  agreement: RentToOwnAgreement,
  month: Date
): RentToOwnPayment {
  const { monthlyPayment, rentToOwnFormula } = agreement;
  const { equityPercentage, rentPercentage } = rentToOwnFormula;

  const equityPortion = monthlyPayment * (equityPercentage / 100);
  const rentPortion = monthlyPayment * (rentPercentage / 100);

  return {
    month,
    totalAmount: monthlyPayment,
    equityPortion,
    rentPortion,
    percentToEquity: equityPercentage
  };
}

/**
 * Calculate accumulated equity over time
 */
export function calculateAccumulatedEquity(
  agreement: RentToOwnAgreement,
  asOfDate: Date = new Date()
): number {
  // Calculate months elapsed since trial start
  const msElapsed = asOfDate.getTime() - agreement.trialStartDate.getTime();

  // Return 0 if before trial starts
  if (msElapsed < 0) {
    return 0;
  }

  // Convert to months (using average month length of 30.44 days)
  const monthsElapsed = Math.floor(msElapsed / (1000 * 60 * 60 * 24 * 30.44));

  // Cap at trial duration
  const paymentsCount = Math.min(monthsElapsed, agreement.trialDurationMonths);

  // Calculate equity per month
  const equityPerMonth = agreement.monthlyPayment * (agreement.rentToOwnFormula.equityPercentage / 100);

  return paymentsCount * equityPerMonth;
}

/**
 * Calculate final purchase price (sale price - equity)
 */
export function calculateFinalPurchasePrice(
  agreement: RentToOwnAgreement,
  baseSalePrice: number
): number {
  const equity = agreement.equityAccumulated;
  return Math.max(0, baseSalePrice - equity);
}
```

**Step 4: Run test to verify it passes**

```bash
npm run test -- src/utils/rentToOwnCalculations.test.ts
```

Expected: `PASS` - all rent-to-own calculation tests pass

**Step 5: Commit**

```bash
git add src/utils/rentToOwnCalculations.ts src/utils/rentToOwnCalculations.test.ts
git commit -m "feat(utils): add rent-to-own calculation functions

- calculateRentToOwnPayment(): splits monthly payment into equity/rent
- calculateAccumulatedEquity(): tracks equity buildup over time
- calculateFinalPurchasePrice(): applies equity to reduce final price
- All functions are pure and fully tested
- Handles edge cases: before trial, after trial, negative results

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 3: Add Rent-to-Own to Storage with Migration

**Files:**
- Modify: `src/utils/storage.ts:1-200` (add rentToOwnFormula and migration)

**Step 1: Write failing test for storage migration**

Add to `src/utils/storage.ts` (or create test file if doesn't exist):

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { saveToLocalStorage, loadFromLocalStorage, DEFAULT_RENT_TO_OWN_FORMULA } from './storage';

describe('Rent-to-Own Storage Migration', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should add rentToOwnFormula to new saves', () => {
    const testData = {
      participants: [],
      projectParams: {},
      deedDate: '2026-02-01',
      portageFormula: {}
    };

    saveToLocalStorage(testData.participants, testData.projectParams, testData.deedDate, testData.portageFormula);

    const loaded = loadFromLocalStorage();
    expect(loaded).toBeTruthy();
    expect(loaded?.rentToOwnFormula).toEqual(DEFAULT_RENT_TO_OWN_FORMULA);
  });

  it('should migrate old data without rentToOwnFormula', () => {
    // Simulate old saved data without rent-to-own fields
    const oldData = {
      version: '1.0.0',
      participants: [],
      projectParams: {},
      deedDate: '2026-02-01',
      portageFormula: {}
    };

    localStorage.setItem('credit-castor-data', JSON.stringify(oldData));

    const loaded = loadFromLocalStorage();
    expect(loaded).toBeTruthy();
    expect(loaded?.rentToOwnFormula).toEqual(DEFAULT_RENT_TO_OWN_FORMULA);
  });

  it('should add provisional participant fields during migration', () => {
    const oldData = {
      version: '1.0.0',
      participants: [{
        name: 'Test',
        capitalApporte: 50000,
        // Missing: participantStatus, hasVotingRights, etc.
      }],
      projectParams: {},
      deedDate: '2026-02-01',
      portageFormula: {}
    };

    localStorage.setItem('credit-castor-data', JSON.stringify(oldData));

    const loaded = loadFromLocalStorage();
    expect(loaded).toBeTruthy();
    expect(loaded?.participants[0].participantStatus).toBe('full');
    expect(loaded?.participants[0].hasVotingRights).toBe(true);
    expect(loaded?.participants[0].excludeFromQuotite).toBe(false);
    expect(loaded?.participants[0].canAttendMeetings).toBe(true);
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npm run test -- src/utils/storage
```

Expected: `FAIL` - rentToOwnFormula not found in loaded data

**Step 3: Update storage.ts to export DEFAULT_RENT_TO_OWN_FORMULA**

Add import at top of `src/utils/storage.ts`:

```typescript
import { DEFAULT_PORTAGE_FORMULA, DEFAULT_RENT_TO_OWN_FORMULA, type PortageFormulaParams, type RentToOwnFormulaParams, type Participant, type ProjectParams } from './calculatorUtils';
```

**Step 4: Update saveToLocalStorage function signature**

Find the `saveToLocalStorage` function and update it to include rentToOwnFormula:

```typescript
export function saveToLocalStorage(
  participants: Participant[],
  projectParams: ProjectParams,
  deedDate: string,
  portageFormula: PortageFormulaParams,
  rentToOwnFormula: RentToOwnFormulaParams = DEFAULT_RENT_TO_OWN_FORMULA
) {
  const data = {
    version: RELEASE_VERSION,
    participants,
    projectParams,
    deedDate,
    portageFormula,
    rentToOwnFormula  // NEW
  };
  localStorage.setItem('credit-castor-data', JSON.stringify(data));
}
```

**Step 5: Update loadFromLocalStorage with migration**

Find the `loadFromLocalStorage` function and add migration logic:

```typescript
export function loadFromLocalStorage(): {
  participants: Participant[];
  projectParams: ProjectParams;
  deedDate: string;
  portageFormula: PortageFormulaParams;
  rentToOwnFormula: RentToOwnFormulaParams;  // NEW
  isCompatible: boolean;
  storedVersion?: string;
} | null {
  const stored = localStorage.getItem('credit-castor-data');
  if (!stored) return null;

  try {
    const data = JSON.parse(stored);
    const storedVersion = data.version || 'unknown';
    const isCompatible = isCompatibleVersion(storedVersion);

    // Migrate participants to add provisional fields
    const migratedParticipants = (data.participants || []).map((p: Participant) => ({
      ...p,
      participantStatus: p.participantStatus || 'full',
      hasVotingRights: p.hasVotingRights !== undefined ? p.hasVotingRights : true,
      excludeFromQuotite: p.excludeFromQuotite || false,
      canAttendMeetings: p.canAttendMeetings !== undefined ? p.canAttendMeetings : true
    }));

    return {
      participants: migratedParticipants,
      projectParams: data.projectParams || {},
      deedDate: data.deedDate || DEFAULT_DEED_DATE,
      portageFormula: data.portageFormula || DEFAULT_PORTAGE_FORMULA,
      rentToOwnFormula: data.rentToOwnFormula || DEFAULT_RENT_TO_OWN_FORMULA,  // NEW: Add default if missing
      isCompatible,
      storedVersion
    };
  } catch (error) {
    console.error('Failed to load from localStorage:', error);
    return null;
  }
}
```

**Step 6: Export DEFAULT_RENT_TO_OWN_FORMULA**

Add to exports at top of storage.ts (after other exports):

```typescript
export { DEFAULT_RENT_TO_OWN_FORMULA } from './calculatorUtils';
```

**Step 7: Run test to verify it passes**

```bash
npm run test -- src/utils/storage
```

Expected: `PASS` - all storage migration tests pass

**Step 8: Commit**

```bash
git add src/utils/storage.ts
git commit -m "feat(storage): add rent-to-own formula to localStorage with migration

- Add rentToOwnFormula parameter to saveToLocalStorage
- Migrate old data to include DEFAULT_RENT_TO_OWN_FORMULA
- Add provisional participant fields during migration (participantStatus, hasVotingRights, etc.)
- Backward compatible - defaults applied for missing fields
- All existing data continues to work

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 4: Update Calculator State Hook to Include Rent-to-Own Formula

**Files:**
- Modify: `src/hooks/useCalculatorState.ts:1-120` (add rentToOwnFormula state)

**Step 1: Add rentToOwnFormula to useCalculatorState**

Find the state declarations in `useCalculatorState.ts` and add:

```typescript
const [rentToOwnFormula, setRentToOwnFormula] = useState<RentToOwnFormulaParams>(() => {
  const stored = loadFromLocalStorage();
  return stored?.rentToOwnFormula || DEFAULT_RENT_TO_OWN_FORMULA;
});
```

**Step 2: Add to return object**

Update the return object to include:

```typescript
return {
  participants,
  projectParams,
  deedDate,
  portageFormula,
  rentToOwnFormula,  // NEW
  pinnedParticipant,
  fullscreenParticipantIndex,
  versionMismatch,
  setParticipants,
  setProjectParams,
  setDeedDate,
  setPortageFormula,
  setRentToOwnFormula,  // NEW
  setPinnedParticipant,
  setFullscreenParticipantIndex,
  setVersionMismatch,
  handlePinParticipant,
  handleUnpinParticipant,
  participantRefs
};
```

**Step 3: Update CalculatorState interface**

Find the `CalculatorState` interface and add:

```typescript
export interface CalculatorState {
  // State values
  participants: Participant[];
  projectParams: ProjectParams;
  deedDate: string;
  portageFormula: PortageFormulaParams;
  rentToOwnFormula: RentToOwnFormulaParams;  // NEW
  pinnedParticipant: string | null;
  fullscreenParticipantIndex: number | null;
  versionMismatch: { show: boolean; storedVersion?: string };

  // State setters
  setParticipants: (participants: Participant[]) => void;
  setProjectParams: (params: ProjectParams) => void;
  setDeedDate: (date: string) => void;
  setPortageFormula: (formula: PortageFormulaParams) => void;
  setRentToOwnFormula: (formula: RentToOwnFormulaParams) => void;  // NEW
  setPinnedParticipant: (name: string | null) => void;
  setFullscreenParticipantIndex: (index: number | null) => void;
  setVersionMismatch: (mismatch: { show: boolean; storedVersion?: string }) => void;

  // Helper methods
  handlePinParticipant: (participantName: string) => void;
  handleUnpinParticipant: () => void;

  // Refs
  participantRefs: React.MutableRefObject<(HTMLDivElement | null)[]>;
}
```

**Step 4: Add import for RentToOwnFormulaParams**

At top of file, update import:

```typescript
import type { Participant, ProjectParams, PortageFormulaParams, RentToOwnFormulaParams, CalculationResults } from '../utils/calculatorUtils';
import { DEFAULT_PORTAGE_FORMULA, DEFAULT_RENT_TO_OWN_FORMULA } from '../utils/calculatorUtils';
```

**Step 5: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: No errors

**Step 6: Commit**

```bash
git add src/hooks/useCalculatorState.ts
git commit -m "feat(hooks): add rentToOwnFormula to calculator state

- Add rentToOwnFormula state with DEFAULT_RENT_TO_OWN_FORMULA
- Load from localStorage on initialization
- Add setter to CalculatorState interface
- Maintains consistency with portageFormula pattern

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Phase 2: State Machine Integration (Days 4-7)

### Task 5: Create Rent-to-Own State Machine

**Files:**
- Create: `src/stateMachine/rentToOwnMachine.ts`
- Create: `src/stateMachine/rentToOwnMachine.test.ts`

**Step 1: Write failing tests for state machine**

Create `src/stateMachine/rentToOwnMachine.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { createActor } from 'xstate';
import { rentToOwnMachine } from './rentToOwnMachine';
import { DEFAULT_RENT_TO_OWN_FORMULA } from '../utils/calculatorUtils';

describe('RentToOwnMachine', () => {
  it('should start in trial_active state', () => {
    const actor = createActor(rentToOwnMachine, {
      input: {
        id: 'rto-001',
        trialStartDate: new Date('2027-06-01'),
        trialEndDate: new Date('2028-06-01'),
        trialDurationMonths: 12,
        monthlyPayment: 1500,
        totalPaid: 0,
        equityAccumulated: 0,
        rentPaid: 0,
        rentToOwnFormula: DEFAULT_RENT_TO_OWN_FORMULA,
        provisionalBuyerId: 'buyer-123',
        sellerId: 'seller-456',
        status: 'active',
        extensionRequests: []
      }
    });

    actor.start();
    expect(actor.getSnapshot().value).toBe('trial_active');
  });

  it('should transition to trial_ending when 30 days remain', () => {
    const nearEndDate = new Date();
    nearEndDate.setDate(nearEndDate.getDate() + 29);  // 29 days from now

    const actor = createActor(rentToOwnMachine, {
      input: {
        id: 'rto-001',
        trialStartDate: new Date('2027-06-01'),
        trialEndDate: nearEndDate,
        trialDurationMonths: 12,
        monthlyPayment: 1500,
        totalPaid: 0,
        equityAccumulated: 0,
        rentPaid: 0,
        rentToOwnFormula: DEFAULT_RENT_TO_OWN_FORMULA,
        provisionalBuyerId: 'buyer-123',
        sellerId: 'seller-456',
        status: 'active',
        extensionRequests: []
      }
    });

    actor.start();
    // Should auto-transition to trial_ending
    expect(actor.getSnapshot().value).toBe('trial_ending');
  });

  it('should record payment and update equity', () => {
    const actor = createActor(rentToOwnMachine, {
      input: {
        id: 'rto-001',
        trialStartDate: new Date('2027-06-01'),
        trialEndDate: new Date('2028-06-01'),
        trialDurationMonths: 12,
        monthlyPayment: 1500,
        totalPaid: 0,
        equityAccumulated: 0,
        rentPaid: 0,
        rentToOwnFormula: DEFAULT_RENT_TO_OWN_FORMULA,
        provisionalBuyerId: 'buyer-123',
        sellerId: 'seller-456',
        status: 'active',
        extensionRequests: []
      }
    });

    actor.start();

    actor.send({
      type: 'RECORD_PAYMENT',
      amount: 1500,
      date: new Date('2027-07-01')
    });

    const context = actor.getSnapshot().context;
    expect(context.totalPaid).toBe(1500);
    expect(context.equityAccumulated).toBe(750);  // 50% of 1500
    expect(context.rentPaid).toBe(750);  // 50% of 1500
  });

  it('should transition to community_vote when buyer requests purchase', () => {
    const nearEndDate = new Date();
    nearEndDate.setDate(nearEndDate.getDate() + 15);

    const actor = createActor(rentToOwnMachine, {
      input: {
        id: 'rto-001',
        trialStartDate: new Date('2027-06-01'),
        trialEndDate: nearEndDate,
        trialDurationMonths: 12,
        monthlyPayment: 1500,
        totalPaid: 18000,
        equityAccumulated: 9000,
        rentPaid: 9000,
        rentToOwnFormula: DEFAULT_RENT_TO_OWN_FORMULA,
        provisionalBuyerId: 'buyer-123',
        sellerId: 'seller-456',
        status: 'ending_soon',
        extensionRequests: []
      }
    });

    actor.start();

    actor.send({ type: 'BUYER_REQUEST_PURCHASE' });

    expect(actor.getSnapshot().value).toBe('community_vote');
  });

  it('should transition to buyer_declined when buyer declines', () => {
    const nearEndDate = new Date();
    nearEndDate.setDate(nearEndDate.getDate() + 15);

    const actor = createActor(rentToOwnMachine, {
      input: {
        id: 'rto-001',
        trialStartDate: new Date('2027-06-01'),
        trialEndDate: nearEndDate,
        trialDurationMonths: 12,
        monthlyPayment: 1500,
        totalPaid: 18000,
        equityAccumulated: 9000,
        rentPaid: 9000,
        rentToOwnFormula: DEFAULT_RENT_TO_OWN_FORMULA,
        provisionalBuyerId: 'buyer-123',
        sellerId: 'seller-456',
        status: 'ending_soon',
        extensionRequests: []
      }
    });

    actor.start();

    actor.send({ type: 'BUYER_DECLINE_PURCHASE' });

    expect(actor.getSnapshot().value).toBe('buyer_declined');
  });

  it('should allow extension when extensions are allowed and limit not reached', () => {
    const nearEndDate = new Date();
    nearEndDate.setDate(nearEndDate.getDate() + 15);

    const actor = createActor(rentToOwnMachine, {
      input: {
        id: 'rto-001',
        trialStartDate: new Date('2027-06-01'),
        trialEndDate: nearEndDate,
        trialDurationMonths: 12,
        monthlyPayment: 1500,
        totalPaid: 18000,
        equityAccumulated: 9000,
        rentPaid: 9000,
        rentToOwnFormula: DEFAULT_RENT_TO_OWN_FORMULA,
        provisionalBuyerId: 'buyer-123',
        sellerId: 'seller-456',
        status: 'ending_soon',
        extensionRequests: []
      }
    });

    actor.start();

    actor.send({ type: 'REQUEST_EXTENSION', additionalMonths: 6 });

    expect(actor.getSnapshot().value).toBe('extension_vote');
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npm run test -- src/stateMachine/rentToOwnMachine.test.ts
```

Expected: `Cannot find module './rentToOwnMachine'`

**Step 3: Implement rentToOwnMachine.ts**

Create `src/stateMachine/rentToOwnMachine.ts`:

```typescript
import { setup, assign } from 'xstate';
import type { RentToOwnAgreement, ExtensionRequest } from '../utils/calculatorUtils';
import { calculateRentToOwnPayment } from '../utils/rentToOwnCalculations';

// Events
type RentToOwnEvents =
  | { type: 'RECORD_PAYMENT'; amount: number; date: Date }
  | { type: 'BUYER_REQUEST_PURCHASE' }
  | { type: 'BUYER_DECLINE_PURCHASE' }
  | { type: 'REQUEST_EXTENSION'; additionalMonths: number }
  | { type: 'EXTENSION_APPROVED' }
  | { type: 'EXTENSION_REJECTED' }
  | { type: 'VOTE_APPROVED' }
  | { type: 'VOTE_REJECTED' };

export const rentToOwnMachine = setup({
  types: {} as {
    context: RentToOwnAgreement;
    events: RentToOwnEvents;
    input: RentToOwnAgreement;
  },

  guards: {
    isTrialEnding: ({ context }) => {
      const daysRemaining = (context.trialEndDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
      return daysRemaining <= 30;  // Last month
    },

    canExtend: ({ context }) => {
      if (!context.rentToOwnFormula.allowExtensions) return false;
      const maxExtensions = context.rentToOwnFormula.maxExtensions || 0;
      const currentExtensions = context.extensionRequests.filter(e => e.approved === true).length;
      return currentExtensions < maxExtensions;
    }
  },

  actions: {
    recordPayment: assign({
      totalPaid: ({ context, event }) => {
        if (event.type !== 'RECORD_PAYMENT') return context.totalPaid;
        return context.totalPaid + event.amount;
      },
      equityAccumulated: ({ context, event }) => {
        if (event.type !== 'RECORD_PAYMENT') return context.equityAccumulated;
        const payment = calculateRentToOwnPayment(context, event.date);
        return context.equityAccumulated + payment.equityPortion;
      },
      rentPaid: ({ context, event }) => {
        if (event.type !== 'RECORD_PAYMENT') return context.rentPaid;
        const payment = calculateRentToOwnPayment(context, event.date);
        return context.rentPaid + payment.rentPortion;
      }
    }),

    extendTrial: assign({
      trialEndDate: ({ context }) => {
        const increment = context.rentToOwnFormula.extensionIncrementMonths || 6;
        const newDate = new Date(context.trialEndDate);
        newDate.setMonth(newDate.getMonth() + increment);
        return newDate;
      },
      trialDurationMonths: ({ context }) => {
        const increment = context.rentToOwnFormula.extensionIncrementMonths || 6;
        return context.trialDurationMonths + increment;
      },
      status: () => 'active' as const
    })
  }
}).createMachine({
  id: 'rentToOwn',
  initial: 'trial_active',

  context: ({ input }) => input,

  states: {
    trial_active: {
      on: {
        RECORD_PAYMENT: {
          actions: 'recordPayment'
        }
      },

      always: [
        {
          target: 'trial_ending',
          guard: 'isTrialEnding'
        }
      ]
    },

    trial_ending: {
      on: {
        BUYER_REQUEST_PURCHASE: 'community_vote',
        BUYER_DECLINE_PURCHASE: 'buyer_declined',
        REQUEST_EXTENSION: {
          target: 'extension_vote',
          guard: 'canExtend'
        }
      }
    },

    community_vote: {
      on: {
        VOTE_APPROVED: 'purchase_finalization',
        VOTE_REJECTED: 'community_rejected'
      }
    },

    extension_vote: {
      on: {
        EXTENSION_APPROVED: {
          target: 'trial_active',
          actions: 'extendTrial'
        },
        EXTENSION_REJECTED: 'trial_ending'
      }
    },

    purchase_finalization: {
      // Would invoke finalizePurchase service here
      after: {
        100: 'completed'  // Temporary - would be replaced with actual service
      }
    },

    buyer_declined: {
      type: 'final'
    },

    community_rejected: {
      type: 'final'
    },

    completed: {
      type: 'final'
    }
  }
});
```

**Step 4: Run test to verify it passes**

```bash
npm run test -- src/stateMachine/rentToOwnMachine.test.ts
```

Expected: `PASS` - all state machine tests pass

**Step 5: Commit**

```bash
git add src/stateMachine/rentToOwnMachine.ts src/stateMachine/rentToOwnMachine.test.ts
git commit -m "feat(state-machine): implement rent-to-own state machine

- Create rentToOwnMachine with XState v5
- States: trial_active → trial_ending → community_vote/buyer_declined/extension_vote
- Guards: isTrialEnding (30 days), canExtend (respects max extensions)
- Actions: recordPayment (tracks equity/rent), extendTrial (adds months)
- Auto-transitions to trial_ending when deadline approaches
- Comprehensive tests for all transitions and edge cases

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Phase 3: Query Functions & UI Scaffolding (Days 8-10)

### Task 6: Add Rent-to-Own Query Functions

**Files:**
- Modify: `src/stateMachine/queries.ts` (add rent-to-own queries)
- Modify: `src/stateMachine/queries.test.ts` (add tests)

**Step 1: Write failing tests for query functions**

Add to `src/stateMachine/queries.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { getProvisionalParticipants, getVotingParticipants, getRentToOwnDeadlines } from './queries';
import type { Participant } from '../utils/calculatorUtils';

describe('Rent-to-Own Queries', () => {
  describe('getProvisionalParticipants', () => {
    it('should return only provisional participants', () => {
      const participants: Participant[] = [
        { name: 'Alice', participantStatus: 'full', capitalApporte: 50000, notaryFeesRate: 12.5, interestRate: 4.5, durationYears: 25 },
        { name: 'Bob', participantStatus: 'provisional', capitalApporte: 50000, notaryFeesRate: 12.5, interestRate: 4.5, durationYears: 25 },
        { name: 'Carol', participantStatus: 'full', capitalApporte: 50000, notaryFeesRate: 12.5, interestRate: 4.5, durationYears: 25 }
      ];

      const provisionals = getProvisionalParticipants(participants);

      expect(provisionals).toHaveLength(1);
      expect(provisionals[0].name).toBe('Bob');
    });

    it('should return empty array when no provisionals', () => {
      const participants: Participant[] = [
        { name: 'Alice', participantStatus: 'full', capitalApporte: 50000, notaryFeesRate: 12.5, interestRate: 4.5, durationYears: 25 }
      ];

      const provisionals = getProvisionalParticipants(participants);

      expect(provisionals).toHaveLength(0);
    });
  });

  describe('getVotingParticipants', () => {
    it('should exclude provisional participants', () => {
      const participants: Participant[] = [
        { name: 'Alice', participantStatus: 'full', hasVotingRights: true, capitalApporte: 50000, notaryFeesRate: 12.5, interestRate: 4.5, durationYears: 25 },
        { name: 'Bob', participantStatus: 'provisional', hasVotingRights: false, capitalApporte: 50000, notaryFeesRate: 12.5, interestRate: 4.5, durationYears: 25 },
        { name: 'Carol', participantStatus: 'full', hasVotingRights: true, capitalApporte: 50000, notaryFeesRate: 12.5, interestRate: 4.5, durationYears: 25 }
      ];

      const voters = getVotingParticipants(participants);

      expect(voters).toHaveLength(2);
      expect(voters.map(p => p.name)).toEqual(['Alice', 'Carol']);
    });

    it('should exclude participants without voting rights', () => {
      const participants: Participant[] = [
        { name: 'Alice', participantStatus: 'full', hasVotingRights: true, capitalApporte: 50000, notaryFeesRate: 12.5, interestRate: 4.5, durationYears: 25 },
        { name: 'Bob', participantStatus: 'full', hasVotingRights: false, capitalApporte: 50000, notaryFeesRate: 12.5, interestRate: 4.5, durationYears: 25 }
      ];

      const voters = getVotingParticipants(participants);

      expect(voters).toHaveLength(1);
      expect(voters[0].name).toBe('Alice');
    });
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npm run test -- src/stateMachine/queries.test.ts
```

Expected: `Cannot find name 'getProvisionalParticipants'`

**Step 3: Implement query functions**

Add to `src/stateMachine/queries.ts`:

```typescript
import type { Participant, RentToOwnAgreement } from '../utils/calculatorUtils';

/**
 * Get all provisional participants (in rent-to-own trial)
 */
export function getProvisionalParticipants(participants: Participant[]): Participant[] {
  return participants.filter(p => p.participantStatus === 'provisional');
}

/**
 * Get participants eligible to vote (excludes provisionals and those without voting rights)
 */
export function getVotingParticipants(participants: Participant[]): Participant[] {
  return participants.filter(p =>
    p.participantStatus !== 'provisional' && p.hasVotingRights !== false
  );
}

/**
 * Get rent-to-own deadline warnings
 */
export function getRentToOwnDeadlines(agreements: RentToOwnAgreement[]): Array<{
  type: 'rent_to_own_ending';
  severity: 'warning' | 'critical';
  message: string;
  agreementId: string;
}> {
  const warnings: Array<{
    type: 'rent_to_own_ending';
    severity: 'warning' | 'critical';
    message: string;
    agreementId: string;
  }> = [];

  agreements.forEach(agreement => {
    const daysRemaining = Math.floor(
      (agreement.trialEndDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );

    if (daysRemaining <= 30 && daysRemaining > 0) {
      warnings.push({
        type: 'rent_to_own_ending',
        severity: daysRemaining <= 7 ? 'critical' : 'warning',
        message: `Rent-to-own trial ends in ${daysRemaining} days`,
        agreementId: agreement.id
      });
    }
  });

  return warnings;
}
```

**Step 4: Run test to verify it passes**

```bash
npm run test -- src/stateMachine/queries.test.ts
```

Expected: `PASS` - all query tests pass

**Step 5: Commit**

```bash
git add src/stateMachine/queries.ts src/stateMachine/queries.test.ts
git commit -m "feat(queries): add rent-to-own query functions

- getProvisionalParticipants(): filters participants in trial
- getVotingParticipants(): excludes provisionals from voting
- getRentToOwnDeadlines(): generates deadline warnings
- Migration-friendly pattern (works with flat arrays)
- Fully tested with edge cases

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Phase 4: UI Integration (Days 11-15)

### Task 7: Add Provisional Participant Badge to UI

**Files:**
- Modify: `src/components/EnDivisionCorrect.tsx` (add provisional badge to participant names)

**Step 1: Add provisional participant badge rendering**

Find the participant name rendering section (around the participant breakdown table) and update it to show a badge for provisional participants:

```tsx
{/* Participant name with provisional badge */}
<h3 className="text-lg font-semibold">
  {participant.name}
  {participant.participantStatus === 'provisional' && (
    <span className="ml-2 inline-flex items-center px-2 py-1 text-xs font-medium text-yellow-800 bg-yellow-100 rounded-full">
      En Essai
    </span>
  )}
</h3>

{/* Show trial info for provisional participants */}
{participant.participantStatus === 'provisional' && participant.rentToOwnAgreementId && (
  <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md text-sm">
    <p className="font-medium text-yellow-900">Période d'essai en cours</p>
    <p className="text-yellow-700 mt-1">
      Participant provisoire - Pas de droits de vote
    </p>
  </div>
)}
```

**Step 2: Verify it renders correctly**

```bash
npm run dev
```

Navigate to the calculator and verify:
- Provisional participants show "En Essai" badge
- Yellow info box appears for provisional participants

**Step 3: Commit**

```bash
git add src/components/EnDivisionCorrect.tsx
git commit -m "feat(ui): add provisional participant badge

- Show 'En Essai' badge for provisional participants
- Display trial status info box
- Visual distinction between full and provisional participants

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Summary & Verification

### What We've Built

1. **Core Types & Formula**
   - ✅ RentToOwnFormulaParams interface
   - ✅ DEFAULT_RENT_TO_OWN_FORMULA (50/50 split)
   - ✅ RentToOwnAgreement interface
   - ✅ Participant extended with provisional fields

2. **Calculation Functions**
   - ✅ calculateRentToOwnPayment()
   - ✅ calculateAccumulatedEquity()
   - ✅ calculateFinalPurchasePrice()

3. **Storage & Migration**
   - ✅ rentToOwnFormula saved to localStorage
   - ✅ Migration adds provisional participant fields
   - ✅ Backward compatible with existing data

4. **State Machine**
   - ✅ rentToOwnMachine with full lifecycle
   - ✅ Auto-transitions to trial_ending
   - ✅ Extension voting support

5. **Query Functions**
   - ✅ getProvisionalParticipants()
   - ✅ getVotingParticipants()
   - ✅ getRentToOwnDeadlines()

6. **UI Integration**
   - ✅ Provisional participant badges
   - ✅ Trial status display

### Verification Steps

**Run all tests:**

```bash
npm run test
```

Expected: All tests pass

**Type checking:**

```bash
npx tsc --noEmit
```

Expected: No TypeScript errors

**Build:**

```bash
npm run build
```

Expected: Successful build

**Manual testing:**

```bash
npm run dev
```

1. Open browser to http://localhost:4321
2. Verify calculator loads
3. Check for provisional participant UI

---

## Next Steps (Future Work)

### Phase 5: Complete UI Integration

1. **Rent-to-Own Setup Modal**
   - Create `RentToOwnSetupModal` component
   - Add to sale initiation flow
   - Allow configuring trial duration, monthly payment

2. **Rent-to-Own Management Dashboard**
   - Show active rent-to-own agreements
   - Display equity accumulation progress
   - Deadline warnings

3. **Voting UI Updates**
   - Show provisionals as observers
   - Exclude from voting calculations

### Phase 6: End-to-End Testing

1. **Integration Tests**
   - Rent-to-own + portage sale
   - Rent-to-own + copro sale
   - Extension flow
   - Purchase completion flow

2. **E2E Tests**
   - Full trial lifecycle
   - Multiple simultaneous trials

### Phase 7: Documentation

1. User guide for rent-to-own
2. Formula configuration UI
3. State diagram visualization

---

## Implementation Notes

**TDD Approach:**
- Every feature starts with a failing test
- Tests verify behavior before implementation
- Commit after each passing test

**DRY Principle:**
- Reuse existing patterns (portageFormula, localStorage migration)
- Compositional wrapper pattern eliminates code duplication
- Query functions abstract data access

**YAGNI Principle:**
- Implement only what's specified in design
- No speculative features
- Extensible architecture for future additions

**Skills Used:**
- @superpowers:test-driven-development for all implementations
- @superpowers:verification-before-completion for commits
- @superpowers:systematic-debugging if issues arise

---

**End of Implementation Plan**

*Follow this plan task-by-task using superpowers:executing-plans or superpowers:subagent-driven-development.*
