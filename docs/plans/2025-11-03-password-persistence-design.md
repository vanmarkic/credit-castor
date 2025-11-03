# Password Persistence Design

**Date:** 2025-11-03
**Status:** Approved

## Overview

Enable the app to remember the user's password indefinitely across browser sessions, instead of requiring re-authentication each time the browser is closed.

## User Requirements

- Password persists indefinitely until user clears browser data
- No logout button needed (simpler UX)
- Transparent behavior - user shouldn't notice the change

## Current State

- Uses `sessionStorage.setItem('authenticated', 'true')`
- Session storage clears when browser tab/window closes
- Users must re-enter password every session

## Proposed Solution

**Storage Strategy:**
Replace `sessionStorage` with `localStorage` for persistent authentication.

```typescript
// Instead of:
sessionStorage.setItem('authenticated', 'true')
sessionStorage.getItem('authenticated')

// Use:
localStorage.setItem('authenticated', 'true')
localStorage.getItem('authenticated')
```

**Why localStorage:**
- Persists across browser sessions indefinitely
- Same API as sessionStorage (drop-in replacement)
- Scoped to origin (secure, won't leak to other sites)
- Already used in the app for other features (consistent pattern)

## Implementation

**Files to modify:**
1. `src/components/AppWithPasswordGate.tsx:10` - Change initialization check from sessionStorage to localStorage
2. `src/components/PasswordGate.tsx:21` - Change storage on successful login from sessionStorage to localStorage

**Changes:**
- Two one-line replacements (sessionStorage → localStorage)
- No new dependencies
- No breaking changes

## Testing Strategy

Manual testing sufficient for this small change:
1. Enter correct password → should see main app
2. Refresh page → should remain authenticated (new behavior)
3. Close browser completely → should remain authenticated (new behavior)
4. Clear browser data → should require password again

## Edge Cases

- **First-time users:** `localStorage.getItem` returns `null`, shows password gate ✓
- **Invalid stored values:** Only `'true'` string passes the check ✓
- **Multiple tabs:** All tabs share same localStorage, consistent state ✓
- **Session migration:** Users currently authenticated via sessionStorage will need to re-enter password once (acceptable)

## Security Considerations

- No password is stored, only authentication flag
- localStorage is origin-scoped (same security as sessionStorage)
- No additional security risks introduced
