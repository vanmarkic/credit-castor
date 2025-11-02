# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Credit Castor is a Belgian real estate division calculator for Wallonia, built with **Astro** (SSG), **React** (UI components), and **Tailwind CSS** (styling). The application calculates costs for property division purchases, including:
- Purchase share distribution based on surface area
- Construction costs (CASCO, parachèvements, travaux communs)
- Notary fees and shared infrastructure costs
- Loan calculations and financing scenarios
- Excel/CSV export functionality

The app is designed to generate a static site with minimal JavaScript (only React hydration for interactive features).

## Development Commands

```bash
# Development
npm run dev              # Start Astro dev server (default port 4321)

# Testing
npm run test             # Run vitest in watch mode
npm run test:run         # Run vitest once (CI mode)
npm run test:ui          # Open vitest UI

# Building
npm run build            # Build static site to dist/
npm run preview          # Preview production build locally
```

## Architecture

### Core Calculation Engine
All business logic is in **pure, testable functions** in `src/utils/calculatorUtils.ts`:
- Input: `Participant[]`, `ProjectParams`, `Scenario`, `UnitDetails`
- Output: `CalculationResults` with participant breakdowns and totals
- Key function: `calculateAll()` orchestrates all calculations
- Financial formulas include loan amortization (PMT), price per m², notary fees
- `calculateFraisGeneraux3ans()` dynamically calculates 3-year general expenses based on total CASCO costs (15% × 30% for honoraires + recurring costs)

### Export System
**Two-layer architecture** for testability:
1. **exportWriter.ts** - Interface-based abstraction for XLSX/CSV writers
2. **excelExport.ts** - Pure function `buildExportSheetData()` builds sheet structure
   - Returns `SheetData` with cells, formulas, and column widths
   - Writer implementations handle actual file I/O
   - Test with CSV writer for snapshot testing (avoids binary XLSX comparison)

### Component Structure
- `EnDivisionCorrect.tsx` - Main React calculator component (form inputs + results table)
- `AppWithPasswordGate.tsx` - Wrapper with password protection
- `src/pages/index.astro` - Astro page that hydrates React components

### Unit Details Pattern
The `unitDetails` object maps `unitId → { casco, parachevements }` for predefined unit types. Participants can:
- Reference a unitId for standard costs
- Override with custom `cascoPerM2` / `parachevementsPerM2`
- Specify partial renovation area with `cascoSqm` / `parachevementsSqm`

## Code Quality Principles

- **Boy Scout Rule**: Leave code cleaner than you found it
- **Minimize code**: Prefer editing/removing over adding; solve root causes, not symptoms
- **Break down complexity**: Split large files/functions into smaller, focused units
- **Meaningful names**: Use descriptive variable/function names

## Test-Driven Development

- **Red-Green-Refactor**: Write failing test first, then implement
- **Vitest for all tests**: Use `npm run test` (not `npm test`)
- **Run tests frequently**: Verify changes automatically until working
- All test files use `.test.ts` or `.test.tsx` suffix
- Setup file: `src/test/setup.ts` (includes jsdom for React Testing Library)

## Documentation Guidelines

- Place AI-generated `.md` files in `./docs/` (organized by subdirectory: development/, analysis/, history/)
- Check if existing `.md` can be updated instead of creating new files
- Only save documentation after manual review

## Working with Claude Code

### Superpowers Plugin Integration
This project is configured to work optimally with the superpowers plugin. Key workflows:
- **Brainstorming**: Use `/superpowers:brainstorm` before starting new features
- **Planning**: Use `/superpowers:write-plan` for complex multi-step implementations
- **Execution**: Use `/superpowers:execute-plan` to run plans in controlled batches
- **TDD**: Always write tests first using the `superpowers:test-driven-development` skill
- **Debugging**: Use `superpowers:systematic-debugging` for investigating failures
- **Verification**: Use `superpowers:verification-before-completion` before claiming work is done

### File Organization
```
credit-castor/
├── src/
│   ├── components/       # UI layer (React components)
│   ├── utils/           # Business logic (pure functions)
│   ├── pages/           # Astro pages
│   └── test/            # Test setup
├── docs/
│   ├── development/     # Implementation docs, plans, progress
│   ├── analysis/        # Architecture analysis, code reviews
│   └── history/         # Decision logs, retrospectives
├── .claude/
│   └── settings.local.json  # Claude Code permissions
├── CLAUDE.md            # This file - project instructions
└── .claudeignore        # Files to exclude from Claude context
```

### Common Patterns
- **Pure functions first**: All business logic in `src/utils/` as pure functions
- **Test before implement**: Write failing tests, then make them pass
- **Small commits**: Commit after each logical unit of work
- **Run tests after changes**: Always verify with `npm run test:run`
- **Check TypeScript**: Run `npx tsc --noEmit` to catch type errors
