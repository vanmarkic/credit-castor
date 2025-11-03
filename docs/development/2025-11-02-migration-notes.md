# Scenario Migration: v1.0.2 to v1.0.3

**Migration Date:** 2025-11-02
**Breaking Change:** CASCO price moved from per-participant to global

## What Changed

### v1.0.2 Format
```json
{
  "participants": [
    { "cascoPerM2": 1590, ... }
  ],
  "projectParams": { ... }
}
```

### v1.0.3 Format
```json
{
  "participants": [
    { ... }  // No cascoPerM2
  ],
  "projectParams": {
    "globalCascoPerM2": 1590
  }
}
```

## Migration Strategy

**Function:** `migrateScenarioData()` in `src/components/EnDivisionCorrect.tsx`

**Logic:**
1. If `projectParams.globalCascoPerM2` missing → use first participant's `cascoPerM2` or default to 1590
2. Remove `cascoPerM2` from all participants
3. Apply defaults for missing data

**Applied to:**
- localStorage (on page load)
- File uploads (JSON scenario files)

## Backward Compatibility

✅ v1.0.2 files load successfully
✅ v1.0.3 files work normally (no-op)
✅ Mixed scenarios (some participants with cascoPerM2) handled gracefully

## Edge Cases

- **No cascoPerM2:** Defaults to 1590
- **Empty participants:** Uses DEFAULT_PARTICIPANTS
- **Multiple cascoPerM2 values:** Uses first participant's value

## Testing

See `src/components/EnDivisionCorrect.test.tsx` for unit tests.
See `docs/development/2025-11-02-manual-test-results.md` for manual test results.
