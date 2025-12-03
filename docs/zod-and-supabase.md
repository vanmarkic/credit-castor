# Credit Castor Migration: Zod Decision

## Context

Migrating Credit Castor from Firestore to Supabase. Currently not using Zod.

## Recommendation

**Start without Zod** — add it later only if specific pain points emerge.

## Why Supabase alone is likely sufficient

Supabase provides:

- Generated TypeScript types from your schema (`supabase gen types typescript`)
- Database constraints (NOT NULL, CHECK, unique, foreign keys)
- Row Level Security for access control

For a loan calculator/simulator where most operations are read → calculate → display → save, this covers most validation needs.

## When to reconsider adding Zod

1. **Complex form validation** — need detailed inline error messages
2. **Data transformation** — parsing CSV imports, coercing strings to numbers
3. **Shared validation** — same rules needed client-side and in Edge Functions
4. **External data** — webhooks or third-party API integrations

## Lightweight alternative for forms

HTML5 validation + Supabase types often cover 80% of needs:

```tsx
<input 
  type="number" 
  min={1} 
  max={300} 
  required 
  {...register('duration')} 
/>
```

## If you do add Zod later

Keep separation of concerns:

```typescript
// Zod for input validation
const LoanSimulationSchema = z.object({
  amount: z.number().positive(),
  duration: z.number().int().min(1).max(300),
  rate: z.number().min(0).max(100),
});

// Supabase types for DB operations
import type { Database } from './types/supabase';
type Loan = Database['public']['Tables']['loans']['Row'];
```

## Decision

→ Ship migration with Supabase types + database constraints only  
→ Fewer dependencies, faster migration  
→ Add Zod to specific forms later if validation becomes painful