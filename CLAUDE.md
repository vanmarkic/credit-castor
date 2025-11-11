# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Credit Castor is a Belgian real estate division calculator for Wallonia, built with **Astro** (SSG), **React** (UI components), **XState** (state management), and **Tailwind CSS** (styling). The application manages complex real estate division scenarios including:
- Purchase share distribution based on surface area
- Construction costs (CASCO, parachèvements, travaux communs)
- Notary fees and shared infrastructure costs
- Loan calculations and financing scenarios
- Portage system (property holding/transfer mechanism)
- Timeline-based project lifecycle management
- Multi-year cash flow projections
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

# Linting
npm run lint             # Check code style
npm run lint:fix         # Auto-fix code style issues

# Building
npm run build            # Build static site to dist/
npm run preview          # Preview production build locally

# Type checking
npx tsc --noEmit         # Catch type errors without emitting files
```

## Architecture

### Core Calculation Engine
All business logic is in **pure, testable functions** in `src/utils/calculatorUtils.ts`:
- Input: `Participant[]`, `ProjectParams`, `Scenario`, `UnitDetails`
- Output: `CalculationResults` with participant breakdowns and totals
- Key function: `calculateAll()` orchestrates all calculations
- Financial formulas include loan amortization (PMT), price per m², notary fees
- `calculateFraisGeneraux3ans()` dynamically calculates 3-year general expenses based on total CASCO costs (15% × 30% for honoraires + recurring costs)

### State Management Architecture
The application uses **XState v5** for managing complex business workflows:
- **creditCastorMachine.ts** - Main state machine orchestrating project lifecycle
  - Handles participant management, lot sales, and financing scenarios
  - Manages transitions between project phases (planning, construction, sales)
  - Spawns child machines (rentToOwnMachine) for specific workflows
- **rentToOwnMachine.ts** - Nested machine for rent-to-own agreements
- **queries.ts** - Derived state selectors for the state machine
- **calculations.ts** - Pure calculation functions called from state machine actions
- **events.ts** - Type-safe event definitions for state transitions

State machines provide:
- Type-safe state transitions and event handling
- Clear separation between state logic and UI
- Testable business workflows independent of React
- Built-in state visualization capabilities

### Business Domains

**Portage System** - Property holding/transfer mechanism:
- `portageCalculations.ts` - Pricing formulas for portage sales
- `portageRecalculation.ts` - Recalculates values when participants enter/exit
- Handles copropriété share redistribution

**Timeline & Cash Flow**:
- `timelineCalculations.ts` - Event-based project timeline generation
- `cashFlowProjection.ts` - Multi-year financial projections per participant
- `chronologyCalculations.ts` - Event sequencing and date calculations

**Copropriété Management**:
- `coproRedistribution.ts` - Redistribution of co-ownership shares
- `coproHealthMetrics.ts` - Financial health indicators for the co-ownership

**Transaction Processing**:
- `transactionCalculations.ts` - Lot sale calculations
- `newcomerCalculations.ts` - New participant entry calculations

### Export System
**Two-layer architecture** for testability:
1. **exportWriter.ts** - Interface-based abstraction for XLSX/CSV writers
2. **excelExport.ts** - Pure function `buildExportSheetData()` builds sheet structure
   - Returns `SheetData` with cells, formulas, and column widths
   - Writer implementations handle actual file I/O
   - Test with CSV writer for snapshot testing (avoids binary XLSX comparison)

### Type System
- `src/types/` - Centralized type definitions
  - `cashFlow.ts` - Cash flow projection types
  - `timeline.ts` - Timeline event types
  - `portage-config.ts` - Portage system configuration types
- `src/stateMachine/types.ts` - State machine context and state types

### Component Structure
**Main App Components**:
- `EnDivisionCorrect.tsx` - Primary calculator (544 lines, consider refactoring)
- `AppWithPasswordGate.tsx` - Authentication wrapper
- `src/pages/index.astro` - Astro page that hydrates React components

**Organized by subdirectories**:
- `calculator/` - Participant management, project configuration
  - `ParticipantDetailsPanel.tsx`, `ParticipantDetailModal.tsx`
  - `ProjectHeader.tsx`, `VerticalToolbar.tsx`
  - `PortageFlow.tsx`
- `timeline/` - Visual timeline components
  - `ParticipantLane.tsx`, `CoproLane.tsx`, `SwimLaneRow.tsx`
  - `TimelineHeader.tsx`, `TimelineCardsArea.tsx`
- `events/` - Event detail displays
  - `NewcomerJoinsDetails.tsx`, `HiddenLotRevealedDetails.tsx`
- `shared/` - Reusable components
  - `FinancingResultCard.tsx`, `ExpectedPaybacksCard.tsx`
  - `CostBreakdownGrid.tsx`, `ExpenseCategoriesManager.tsx`

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

### Test Organization

- **Unit tests**: Co-located with source files (`*.test.ts`, `*.test.tsx`)
- **Integration tests**: `src/integration/` directory
  - `portage-workflow.test.ts` - End-to-end portage scenarios
  - `portage-entrydate-recalc.test.ts` - Complex recalculation scenarios
- **Business logic tests**: Separated files with `.business-logic.test.ts` suffix
  - Focus on complex calculation scenarios
  - Use descriptive test names for documentation

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
│   │   ├── calculator/  # Participant & project management
│   │   ├── timeline/    # Visual timeline components
│   │   ├── events/      # Event detail displays
│   │   └── shared/      # Reusable components
│   ├── stateMachine/    # XState state machines
│   ├── utils/           # Business logic (pure functions)
│   ├── types/           # Centralized type definitions
│   ├── pages/           # Astro pages
│   ├── integration/     # Integration tests
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

### Data Migration

When making breaking changes to data structures:
- Extract migration logic into pure, testable functions
- Apply migrations to all data loading paths (localStorage, file uploads, API calls)
- Write comprehensive unit tests for edge cases
- Document migration in docs/development/
- Create test fixtures with old format
- Manual testing checklist before release
