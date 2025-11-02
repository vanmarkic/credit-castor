# Claude Code Configuration Guide

**Last Updated:** 2025-11-02

This document explains the Claude Code configuration for the credit-castor project, optimized for use with the superpowers plugin.

## Overview

The project is configured to enable Claude Code to work efficiently with:
- Test-driven development workflows
- Business logic separation verification
- Automated testing and type checking
- Git operations and GitHub integration
- Superpowers plugin workflows

## Configuration Files

### `.claudeignore`

Excludes unnecessary files from Claude's context to improve performance and reduce token usage.

**What's excluded:**
- `node_modules/` - Dependencies (thousands of files)
- Build outputs (`dist/`, `.astro/`)
- Environment files (`.env*`)
- IDE files (`.vscode/`, `.idea/`)
- Generated files (`*.xlsx`, `*.log`)
- OS files (`.DS_Store`, `Thumbs.db`)

**Why this matters:** Claude Code reads all non-ignored files as context. Excluding build artifacts and dependencies prevents token waste and speeds up responses.

### `.claude/settings.local.json`

Defines auto-approved commands that Claude can run without asking permission.

**Approved operations:**
- **NPM commands:** `npm install`, `npm uninstall`, `npm run:*`
- **Testing:** `npx vitest:*`, `npx tsc:*`
- **Development:** `node:*`, `open:*` (for opening browsers)
- **Process management:** `lsof:*`, `xargs kill:*`
- **Git operations:** `git status`, `git diff`, `git log`, `git add`, `git commit`, `git push`, `git pull`, `git restore`, `git stash`, `git branch`, `git checkout`, `git rm`
- **GitHub CLI:** `gh:*` (for creating PRs, issues, etc.)
- **File reading:** All `.ts`, `.tsx`, `.js`, `.json`, `.md`, `.astro` files

**Why this matters:** These permissions allow Claude to work autonomously on common development tasks without interrupting you for approval.

### `CLAUDE.md`

Project-specific instructions that Claude reads on every conversation.

**Key sections:**
1. **Project Overview** - What the app does, tech stack
2. **Development Commands** - How to run, test, build
3. **Architecture** - Where business logic lives, how components are structured
4. **Code Quality Principles** - Boy Scout Rule, minimize code, break down complexity
5. **Test-Driven Development** - Red-Green-Refactor workflow
6. **Documentation Guidelines** - Where to save generated docs
7. **Working with Claude Code** - Superpowers integration, file organization, common patterns

**Why this matters:** Claude reads this file automatically, so documented patterns become consistent behaviors.

### `.claude/skills/verify-business-logic.md`

Custom skill for maintaining architectural separation between business logic and UI.

**When to use:**
- Adding new calculation functions
- Modifying existing business logic
- Refactoring calculations
- Reviewing PRs that touch `src/utils/calculatorUtils.ts`

**What it enforces:**
1. Pure function requirements (no side effects, no React dependencies)
2. Type safety (explicit types, no `any`)
3. Documentation (JSDoc, formula explanations)
4. Testing (TDD, edge cases, boundary conditions)
5. Proper location (calculations in utils, not components)
6. Clean component integration (useMemo, no logic leakage)

**How to invoke:**
```bash
# Claude will automatically suggest this skill when relevant
# Or manually trigger: /verify-business-logic
```

**Why this matters:** Maintains the excellent 9/10 separation score by preventing business logic from creeping into UI components.

## Documentation Structure

```
docs/
├── README.md                           # This directory overview
├── development/                        # Implementation docs
│   └── claude-code-configuration.md    # This file
├── analysis/                           # Code reviews, audits
└── history/                            # Decisions, retrospectives
```

**Guidelines:**
- Check for existing docs before creating new ones
- Use descriptive filenames (e.g., `feature-export-refactor-plan.md`)
- Include dates for time-sensitive content (e.g., `2025-11-sprint-retrospective.md`)
- Review and edit AI-generated content before committing

## Superpowers Integration

The project is configured to work with superpowers plugin workflows:

### Available Workflows

1. **Brainstorming** (`/superpowers:brainstorm`)
   - Use before starting new features
   - Refines rough ideas into designs through Socratic questioning

2. **Planning** (`/superpowers:write-plan`)
   - Creates detailed implementation plans
   - Breaks down complex features into bite-sized tasks

3. **Execution** (`/superpowers:execute-plan`)
   - Runs plans in controlled batches
   - Review checkpoints between batches

4. **TDD** (`superpowers:test-driven-development`)
   - Write tests first, watch them fail, then implement
   - Ensures tests actually verify behavior

5. **Debugging** (`superpowers:systematic-debugging`)
   - Four-phase framework (investigate, analyze, hypothesize, implement)
   - Understand before attempting solutions

6. **Verification** (`superpowers:verification-before-completion`)
   - Run commands and confirm output before claiming success
   - Evidence before assertions

## Common Workflows

### Starting a New Feature

```bash
# 1. Brainstorm the design
/superpowers:brainstorm

# 2. Create implementation plan
/superpowers:write-plan

# 3. Execute in controlled batches
/superpowers:execute-plan
```

### Fixing a Bug

```bash
# 1. Use systematic debugging
# Claude will use superpowers:systematic-debugging skill

# 2. Write failing test first (TDD)
# Add test case that reproduces the bug

# 3. Fix the bug
# Make the test pass

# 4. Verify
npm run test:run
npx tsc --noEmit
```

### Adding Business Logic

```bash
# 1. Verify current architecture
# Claude will analyze business logic separation

# 2. Write test first
# In src/utils/calculatorUtils.test.ts

# 3. Implement pure function
# In src/utils/calculatorUtils.ts

# 4. Integrate into component
# Use useMemo in EnDivisionCorrect.tsx

# 5. Verify separation maintained
# Claude will use verify-business-logic skill
```

## Best Practices

### For Developers

1. **Keep CLAUDE.md updated** - Document new patterns, constraints, decisions
2. **Use .claudeignore liberally** - Exclude files that waste context
3. **Define permissions upfront** - Add common commands to settings.local.json
4. **Create project-specific skills** - Codify important architectural patterns
5. **Organize documentation** - Use docs/ structure consistently

### For Claude Code

1. **Check CLAUDE.md first** - Always read project instructions before starting
2. **Use TodoWrite for multi-step tasks** - Track progress transparently
3. **Follow TDD** - Write tests before implementation
4. **Verify before claiming completion** - Run tests, type check, verify output
5. **Use project skills** - Apply verify-business-logic when touching calculatorUtils.ts

## Testing the Configuration

### Verify Permissions Work

```bash
# These should run without prompting:
npm run test:run
npx tsc --noEmit
git status
```

### Verify .claudeignore Works

Ask Claude: "What files can you see in this project?"

**Should see:** `src/`, `CLAUDE.md`, `package.json`, config files
**Should NOT see:** `node_modules/`, `dist/`, `.env*`

### Verify Skill Works

Ask Claude: "Add a new calculation function to calculatorUtils.ts"

**Expected behavior:**
1. Claude suggests using verify-business-logic skill
2. Creates test first (TDD)
3. Implements pure function
4. Verifies separation maintained
5. Runs verification commands

## Troubleshooting

### Claude asks for permission repeatedly

**Problem:** Command not in settings.local.json
**Solution:** Add the command pattern to the `allow` array

### Claude reads too many files / slow responses

**Problem:** .claudeignore missing or incomplete
**Solution:** Add file patterns to .claudeignore

### Business logic ends up in components

**Problem:** Skill not being applied
**Solution:** Explicitly invoke verify-business-logic skill

### Tests not running automatically

**Problem:** TDD workflow not followed
**Solution:** Use superpowers:test-driven-development skill

## Maintenance

### When to Update Configuration

- **New file types:** Add to .claudeignore if they're generated/build artifacts
- **New workflows:** Document in CLAUDE.md
- **New architectural patterns:** Create skill in .claude/skills/
- **New commands:** Add to settings.local.json if used frequently

### Reviewing Configuration

Run this checklist monthly:
- [ ] .claudeignore excludes all build artifacts
- [ ] settings.local.json has commonly used commands
- [ ] CLAUDE.md reflects current architecture and patterns
- [ ] Skills are up-to-date with current practices
- [ ] docs/ is organized and duplicate-free

## Resources

- [Claude Code Documentation](https://docs.claude.com/claude-code)
- [Superpowers Plugin](https://github.com/superpowers-dev/superpowers)
- Project CLAUDE.md (root of this repo)
- Verify Business Logic Skill (.claude/skills/verify-business-logic.md)

---

**Next Steps:**
1. Try running a workflow to verify configuration works
2. Ask Claude to explain the architecture (tests CLAUDE.md)
3. Request a new feature (tests brainstorming → planning → execution)
4. Check that business logic separation is maintained (tests skill)
