---
name: verify-business-logic
description: Use when adding or modifying calculation logic - ensures business logic stays pure, testable, and decoupled from UI
scopes:
  - project
  - gitignored
---

# Verify Business Logic Separation

Use this skill when:
- Adding new calculation functions
- Modifying existing business logic
- Refactoring calculations
- Reviewing pull requests that touch `src/utils/calculatorUtils.ts`

## Checklist

When working with business logic, verify each item:

### 1. Pure Function Requirements
- [ ] Function has no side effects
- [ ] Function returns consistent output for same inputs
- [ ] Function doesn't modify input parameters
- [ ] Function doesn't access external state (no `window`, `localStorage`, etc.)
- [ ] Function has no React dependencies

### 2. Type Safety
- [ ] Function has explicit TypeScript types for all parameters
- [ ] Function has explicit return type
- [ ] Uses existing interfaces from `calculatorUtils.ts` or defines new ones
- [ ] No `any` types used

### 3. Documentation
- [ ] Function has JSDoc comment explaining purpose
- [ ] Complex formulas have inline comments explaining the calculation
- [ ] If based on business requirement/Excel formula, reference is documented

### 4. Testing
- [ ] Test file updated BEFORE implementation (TDD)
- [ ] Test covers happy path
- [ ] Test covers edge cases (zero, negative, undefined)
- [ ] Test covers boundary conditions
- [ ] Test description clearly explains what is being tested

### 5. Location
- [ ] New calculation logic goes in `src/utils/calculatorUtils.ts` (not in components)
- [ ] Exported for use by components
- [ ] Import added to component only after function is implemented and tested

### 6. Component Integration
- [ ] Component uses `useMemo` to call calculation functions
- [ ] Component passes data to calculation, doesn't perform calculation
- [ ] Formatting (currency, percentages) stays in UI layer
- [ ] No business logic leaks into component

## Anti-patterns to Avoid

**DON'T:**
```typescript
// In EnDivisionCorrect.tsx - BAD
const calculateTotal = () => {
  let sum = 0;
  participants.forEach(p => {
    sum += p.surface * pricePerM2;
  });
  setTotal(sum);
};
```

**DO:**
```typescript
// In calculatorUtils.ts - GOOD
export function calculateTotal(
  participants: Participant[],
  pricePerM2: number
): number {
  return participants.reduce((sum, p) => sum + p.surface * pricePerM2, 0);
}

// In component
const total = useMemo(() =>
  calculateTotal(participants, calculations.pricePerM2),
  [participants, calculations.pricePerM2]
);
```

## Verification Commands

After making changes, run these in sequence:

```bash
# 1. Type check
npx tsc --noEmit

# 2. Run tests
npm run test:run

# 3. Verify export works (if you changed export logic)
# Manual test: use the UI to export and open the Excel file
```

## Success Criteria

Before marking work complete:
- [ ] All tests pass
- [ ] TypeScript compiles without errors
- [ ] Function is pure and testable
- [ ] No business logic in components
- [ ] Documentation is clear
