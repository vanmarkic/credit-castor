# Claude Code Configuration

This directory contains Claude Code configuration for the credit-castor project.

## Files

### `settings.local.json`
Permissions for auto-approved commands (npm, git, testing, etc.)

### `skills/`
Project-specific skills that enforce architectural patterns:

- **verify-business-logic.md** - Ensures business logic stays pure and decoupled from UI

## Quick Reference

### Using Skills

Skills are invoked automatically by Claude when relevant. You can also manually trigger them:

```bash
# Verify business logic separation when modifying calculatorUtils.ts
# Claude will suggest this automatically, or you can mention it explicitly
```

### Modifying Permissions

To add new auto-approved commands, edit `settings.local.json`:

```json
{
  "permissions": {
    "allow": [
      "Bash(your-command:*)"
    ]
  }
}
```

Pattern syntax:
- `Bash(npm run:*)` - Matches all npm run commands
- `Read(**/*.ts)` - Matches all .ts files in any directory

### Adding Skills

Create a new `.md` file in `skills/` with this format:

```markdown
---
name: your-skill-name
description: When and why to use this skill
scopes:
  - project
  - gitignored
---

# Skill Title

Use this skill when: [conditions]

## Checklist
- [ ] Item 1
- [ ] Item 2
```

## Documentation

See `docs/development/claude-code-configuration.md` for comprehensive setup guide.
