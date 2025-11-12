# Git Hooks Setup

## Pre-Push Hook

### What It Does

The pre-push hook automatically runs schema validation tests before every `git push` to prevent breaking changes from being accidentally pushed.

### Location

`.git/hooks/pre-push`

### How It Works

1. When you run `git push`, the hook is triggered automatically
2. It runs `npm run test:schema` to validate data structure schemas
3. If tests pass → push proceeds normally
4. If tests fail → push is blocked with helpful error message

### Example Output

**When schema validation passes:**
```bash
$ git push
🔍 Running schema validation tests before push...
✅ Schema validation passed!
```

**When breaking changes are detected:**
```bash
$ git push
🔍 Running schema validation tests before push...

❌ Schema validation FAILED!

Breaking change detected in data structures.

If this is intentional:
  1. Bump MAJOR version in src/utils/version.ts (e.g., 1.17.0 → 2.0.0)
  2. Update schema tests in src/utils/dataSchema.test.ts
  3. Document the breaking change

See: docs/development/breaking-changes-guide.md

To bypass this hook (NOT RECOMMENDED):
  git push --no-verify
```

### Bypassing the Hook

If you absolutely need to bypass the hook (not recommended):

```bash
git push --no-verify
```

**⚠️ Warning:** Only bypass if you know what you're doing and have a good reason!

### Setting Up on Another Machine

If you clone the repository on a new machine, the hook needs to be set up again (git hooks aren't tracked in the repository). Here's how:

```bash
# Navigate to the repository
cd credit-castor

# Create the pre-push hook
cat > .git/hooks/pre-push << 'EOF'
#!/bin/bash

# Pre-push hook to validate data schema for breaking changes
# This prevents accidental breaking changes from being pushed

echo "🔍 Running schema validation tests before push..."

# Run schema validation tests
npm run test:schema

# Capture the exit code
SCHEMA_TEST_EXIT_CODE=$?

if [ $SCHEMA_TEST_EXIT_CODE -ne 0 ]; then
  echo ""
  echo "❌ Schema validation FAILED!"
  echo ""
  echo "Breaking change detected in data structures."
  echo ""
  echo "If this is intentional:"
  echo "  1. Bump MAJOR version in src/utils/version.ts (e.g., 1.17.0 → 2.0.0)"
  echo "  2. Update schema tests in src/utils/dataSchema.test.ts"
  echo "  3. Document the breaking change"
  echo ""
  echo "See: docs/development/breaking-changes-guide.md"
  echo ""
  echo "To bypass this hook (NOT RECOMMENDED):"
  echo "  git push --no-verify"
  echo ""
  exit 1
fi

echo "✅ Schema validation passed!"
exit 0
EOF

# Make it executable
chmod +x .git/hooks/pre-push

# Test it
.git/hooks/pre-push
```

### Testing the Hook

To test the hook without actually pushing:

```bash
.git/hooks/pre-push
```

This will run the schema validation tests and show you what would happen during a real push.

### Troubleshooting

**Problem:** Hook doesn't run when I push

**Solution:** Check that the hook is executable:
```bash
ls -l .git/hooks/pre-push
# Should show: -rwxr-xr-x (executable)

# If not executable:
chmod +x .git/hooks/pre-push
```

**Problem:** Hook runs but tests fail incorrectly

**Solution:**
1. Run tests manually: `npm run test:schema`
2. Check if you made changes to data structures
3. Review the breaking changes guide: `docs/development/breaking-changes-guide.md`

**Problem:** I need to disable the hook temporarily

**Solution:**
```bash
# Bypass for one push
git push --no-verify

# Disable permanently (not recommended)
mv .git/hooks/pre-push .git/hooks/pre-push.disabled

# Re-enable
mv .git/hooks/pre-push.disabled .git/hooks/pre-push
```

## Other Hooks

Currently, only the pre-push hook is configured. Other hooks (pre-commit, pre-merge-commit, etc.) could be added in the future for additional validation.

## Related Documentation

- [Breaking Changes Guide](./breaking-changes-guide.md) - Comprehensive guide on breaking changes
- [Pre-Commit Checklist](./pre-commit-checklist.md) - Quick checklist for developers
- [Breaking Changes Summary](./breaking-changes-summary.md) - Overview of the system

---

**Last Updated:** 2025-11-12 (v1.17.0)
