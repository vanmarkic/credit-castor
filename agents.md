# AGENTS.md

This file provides structured guidance for AI agents working on the Credit Castor codebase.

## Project Context

**Project Name**: Credit Castor  
**Type**: Belgian real estate division calculator for Wallonia  
**Tech Stack**: Astro (SSG), React (UI), XState v5 (state management), Tailwind CSS (styling)  
**Architecture**: Static site generation with minimal JavaScript (React hydration only)

### Core Functionality
- Purchase share distribution (surface area based)
- Construction costs (CASCO, parachèvements, travaux communs)
- Notary fees and shared infrastructure costs
- Loan calculations and financing scenarios
- Portage system (property holding/transfer mechanism)
- Timeline-based project lifecycle management
- Multi-year cash flow projections
- Excel/CSV export functionality

## Agent Instructions

### Code Quality Rules (MANDATORY)

1. **Boy Scout Rule**: Always leave code cleaner than you found it
2. **Minimize Code**: Prefer editing/removing over adding; solve root causes, not symptoms
3. **Break Down Complexity**: Split large files/functions into smaller, focused units
4. **Meaningful Names**: Use descriptive variable/function names
5. **Root Cause Analysis**: Detect code smells and underlying issues, not just symptoms

### Development Workflow (MANDATORY)

#### Before Making Changes
1. Understand the existing architecture (see Architecture section below)
2. Identify if change affects critical data structures (see Version Management)
3. For business logic: Write failing test first (TDD)
4. For data structure changes: Run `npm run test:schema` first

#### During Development
1. **Test-Driven Development**: Write failing test → Implement → Refactor
2. **Run Tests Frequently**: Use `npm run test` (watch mode) or `npm run test:run` (CI mode)
3. **Type Checking**: Run `npx tsc --noEmit` to catch type errors
4. **Linting**: Run `npm run lint` to check code style

#### After Making Changes
1. Run `npm run test:run` to verify all tests pass
2. Run `npx tsc --noEmit` to verify no type errors
3. Run `npm run lint` to verify code style
4. If data structure changed: Run `npm run test:schema`

### Commands Reference

```bash
# Development
npm run dev              # Start Astro dev server (port 4321)

# Testing
npm run test             # Run vitest in watch mode
npm run test:run         # Run vitest once (CI mode)
npm run test:ui          # Open vitest UI
npm run test:schema      # Run schema validation tests

# Code Quality
npm run lint             # Check code style
npm run lint:fix         # Auto-fix code style issues
npx tsc --noEmit         # Type checking

# Building
npm run build            # Build static site to dist/
npm run preview          # Preview production build locally
```

## Architecture Reference

### Core Calculation Engine

**Location**: `src/utils/calculatorUtils.ts`  
**Pattern**: Pure, testable functions  
**Input Types**: `Participant[]`, `ProjectParams`, `Scenario`, `UnitDetails`  
**Output Type**: `CalculationResults` (participant breakdowns and totals)  
**Key Function**: `calculateAll()` - orchestrates all calculations

**Important Formulas**:
- Loan amortization (PMT)
- Price per m² calculations
- Notary fees
- `calculateFraisGeneraux3ans()` - 3-year general expenses (15% × 30% for honoraires + recurring costs)

### Firebase Integration

**Pattern**: Optional, graceful degradation  
**Behavior**: Works fully offline with localStorage if Firebase not configured  
**Environment Variables**: All Firebase config uses `PUBLIC_` prefix (Astro requirement)

**Key Files**:
- `src/services/firestoreSync.ts` - Real-time Firestore synchronization
- `src/services/editLockService.ts` - Optimistic locking (prevents concurrent edit conflicts)
- `src/services/participantSyncCoordinator.ts` - Per-participant data sync coordination
- `src/services/dataLoader.ts` - Unified data loading (localStorage + Firestore)

**Setup Guide**: `docs/development/firebase-setup-guide.md`

### State Management (XState v5)

**Main Machine**: `src/stateMachine/creditCastorMachine.ts`
- Orchestrates project lifecycle
- Handles participant management, lot sales, financing scenarios
- Manages phase transitions (planning → construction → sales)
- Spawns child machines (e.g., `rentToOwnMachine`)

**Supporting Files**:
- `rentToOwnMachine.ts` - Nested machine for rent-to-own agreements
- `queries.ts` - Derived state selectors
- `calculations.ts` - Pure calculation functions (called from state machine actions)
- `events.ts` - Type-safe event definitions

**Benefits**:
- Type-safe state transitions
- Clear separation: state logic vs UI
- Testable workflows (independent of React)
- Built-in state visualization

### Business Domain Modules

**Portage System** (`src/utils/portage*.ts`):
- `portageCalculations.ts` - Pricing formulas for portage sales
- `portageRecalculation.ts` - Recalculates when participants enter/exit
- Handles copropriété share redistribution

**Timeline & Cash Flow**:
- `timelineCalculations.ts` - Event-based project timeline generation
- `cashFlowProjection.ts` - Multi-year financial projections per participant
- `chronologyCalculations.ts` - Event sequencing and date calculations

**Copropriété Management**:
- `coproRedistribution.ts` - Redistribution of co-ownership shares
- `coproHealthMetrics.ts` - Financial health indicators

**Transaction Processing**:
- `transactionCalculations.ts` - Lot sale calculations
- `newcomerCalculations.ts` - New participant entry calculations

### Export System

**Architecture**: Two-layer for testability

1. **exportWriter.ts** - Interface-based abstraction (XLSX/CSV writers)
2. **excelExport.ts** - Pure function `buildExportSheetData()`
   - Returns `SheetData` (cells, formulas, column widths)
   - Writer implementations handle file I/O
   - Test with CSV writer for snapshot testing (avoids binary XLSX comparison)

### Type System

**Location**: `src/types/`
- `cashFlow.ts` - Cash flow projection types
- `timeline.ts` - Timeline event types
- `portage-config.ts` - Portage system configuration types
- `src/stateMachine/types.ts` - State machine context and state types

### Component Structure

**Main App Components**:
- `EnDivisionCorrect.tsx` - Primary calculator (544 lines - consider refactoring)
- `AppWithPasswordGate.tsx` - Authentication wrapper
- `src/pages/index.astro` - Astro page (hydrates React components)

**Component Organization**:
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

**Pattern**: `unitDetails` object maps `unitId → { casco, parachevements }`

**Participant Options**:
- Reference `unitId` for standard costs
- Override with custom `cascoPerM2` / `parachevementsPerM2`
- Specify partial renovation area with `cascoSqm` / `parachevementsSqm`

## Test Organization

### Test File Naming
- Unit tests: `*.test.ts` or `*.test.tsx` (co-located with source files)
- Business logic tests: `*.business-logic.test.ts` (separated files)
- Integration tests: `src/integration/*.test.ts`

### Test Setup
- Setup file: `src/test/setup.ts` (includes jsdom for React Testing Library)
- Test runner: Vitest (use `npm run test`, not `npm test`)

### Test Categories

**Unit Tests**: Co-located with source files  
**Integration Tests**: `src/integration/`
- `portage-workflow.test.ts` - End-to-end portage scenarios
- `portage-entrydate-recalc.test.ts` - Complex recalculation scenarios

**Business Logic Tests**: Files with `.business-logic.test.ts` suffix
- Focus on complex calculation scenarios
- Use descriptive test names for documentation

**Schema Validation Tests**: `src/utils/dataSchema.test.ts`
- Detects breaking changes in stored data structures
- Run with `npm run test:schema`
- **MUST PASS** before committing data interface changes

## Version Management & Breaking Changes

### Semantic Versioning Rules

- **Major (2.0.0)**: Breaking changes to stored data structures → triggers version warning
- **Minor (1.17.0)**: New features, backward compatible → no warning
- **Patch (1.16.1)**: Bug fixes, backward compatible → no warning

### Critical Data Structures (Breaking Changes)

**MANDATORY**: Changes to these require major version bump:
- `Participant` interface (stored in localStorage, JSON, Firestore)
- `ProjectParams` interface (stored in localStorage, JSON, Firestore)
- `PortageFormulaParams` interface (stored in localStorage, JSON, Firestore)
- `ScenarioData` interface (JSON export format)
- `FirestoreScenarioData` interface (Firestore document structure)

### Pre-Commit Checklist for Data Structure Changes

1. **Run schema validation**: `npm run test:schema`
2. **Check the guide**: `docs/development/breaking-changes-guide.md`
3. **Use the checklist**: `docs/development/pre-commit-checklist.md`
4. **If breaking change detected**:
   - Bump major version in `src/utils/version.ts`
   - Create migration function if needed
   - Update schema tests
   - Document in version history

### Quick Rules

- ✅ **Safe**: Add optional fields, deprecate old fields (keep them)
- ❌ **Breaking**: Rename fields, remove fields, change field types

### Data Migration Requirements

When making breaking changes to data structures:

1. Extract migration logic into pure, testable functions
2. Apply migrations to all data loading paths:
   - localStorage
   - File uploads
   - API calls
3. Write comprehensive unit tests for edge cases
4. Document migration in `docs/development/`
5. Create test fixtures with old format
6. Manual testing checklist before release

## Documentation Guidelines

### File Organization
- Place AI-generated `.md` files in `./docs/` (organized by subdirectory)
- Subdirectories: `development/`, `analysis/`, `history/`
- Check if existing `.md` can be updated instead of creating new files
- Only save documentation after manual review

### File Structure Reference

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
├── CLAUDE.md            # Human-readable project instructions
├── agents.md            # This file - agent instructions
└── .claudeignore        # Files to exclude from Claude context
```

## Common Patterns

### Pure Functions First
- All business logic in `src/utils/` as pure functions
- No side effects in calculation functions
- Testable without React/UI dependencies

### Test Before Implement
- Write failing test first
- Implement to make test pass
- Refactor while keeping tests green

### Small Commits
- Commit after each logical unit of work
- Each commit should be independently testable

### Verification Steps
- Run `npm run test:run` after changes
- Run `npx tsc --noEmit` to catch type errors
- Run `npm run lint` to verify code style

## Superpowers Plugin Integration

This project is configured for superpowers plugin workflows:

- **Brainstorming**: Use `/superpowers:brainstorm` before starting new features
- **Planning**: Use `/superpowers:write-plan` for complex multi-step implementations
- **Execution**: Use `/superpowers:execute-plan` to run plans in controlled batches
- **TDD**: Always write tests first using `superpowers:test-driven-development` skill
- **Debugging**: Use `superpowers:systematic-debugging` for investigating failures
- **Verification**: Use `superpowers:verification-before-completion` before claiming work is done

## Agent Decision Tree

### When Adding New Feature
1. Check if it affects data structures → If yes, check version management rules
2. Write failing test first (TDD)
3. Implement feature
4. Run all tests
5. Check TypeScript
6. Check linting
7. Update documentation if needed

### When Fixing Bug
1. Reproduce bug with test (if not already covered)
2. Identify root cause (not just symptom)
3. Fix root cause
4. Run all tests
5. Check TypeScript
6. Check linting

### When Refactoring
1. Ensure test coverage exists
2. Refactor incrementally
3. Run tests after each change
4. Maintain backward compatibility (unless major version bump)
5. Update documentation if architecture changes

### When Modifying Data Structures
1. **STOP** - Check if breaking change
2. Run `npm run test:schema`
3. If breaking: Follow pre-commit checklist
4. Create migration function if needed
5. Update all data loading paths
6. Write comprehensive tests
7. Document migration

<skills_system priority="1">

## Available Skills

<!-- SKILLS_TABLE_START -->
<usage>
When users ask you to perform tasks, check if any of the available skills below can help complete the task more effectively. Skills provide specialized capabilities and domain knowledge.

How to use skills:
- Invoke: Bash("openskills read <skill-name>")
- The skill content will load with detailed instructions on how to complete the task
- Base directory provided in output for resolving bundled resources (references/, scripts/, assets/)

Usage notes:
- Only use skills listed in <available_skills> below
- Do not invoke a skill that is already loaded in your context
- Each skill invocation is stateless
</usage>

<available_skills>

<skill>
<name>webapp-testing</name>
<description>Toolkit for interacting with and testing local web applications using Playwright. Supports verifying frontend functionality, debugging UI behavior, capturing browser screenshots, and viewing browser logs.</description>
<location>project</location>
</skill>

</available_skills>
<!-- SKILLS_TABLE_END -->

</skills_system>
