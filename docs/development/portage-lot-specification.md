# Portage Lot Specification Feature

## Overview

Enables participants (founders) to allocate specific lots for portage, controlling how newcomers purchase lots with different surface and pricing rules.

## User Stories

1. **Founder allocates portage lot**
   - As a founder, I can specify that an additional lot is for portage
   - I set the surface area (e.g., 50m²)
   - Surface is imposed - newcomer cannot change it

2. **Newcomer views available lots**
   - From founders: See portage lots with imposed surface and calculated price
   - From copropriété: See lots with free surface choice

3. **Pricing calculation**
   - Founder portage: Base price + indexation + carrying costs + fee recovery (if <2 years)
   - Copro lot: Proportional base + indexation + proportional carrying costs

## Technical Implementation

### Data Model

- `Lot.isPortage: boolean` - Marks lot as portage
- `Lot.allocatedSurface?: number` - Surface allocated for portage
- `AvailableLot.surfaceImposed: boolean` - Indicates if surface can be changed

### Calculations

- `calculatePortageLotPrice()` - For founder portage (imposed surface)
- `calculatePortageLotPriceFromCopro()` - For copro lots (free surface)
- Both apply 2% indexation and carrying cost recovery

### UI Components

- Portage lot configuration in participant expandable section
- Add/remove portage lots
- Surface specification input

## Testing

- Unit tests: `portageCalculations.test.ts`
- Type tests: `portage-config.test.ts`
- Integration: `portage-workflow.test.ts`
- Available lots: `availableLots.test.ts`

## Migration Notes

- Existing participants without `lotsOwned` continue using legacy fields
- New portage lots use `lotsOwned` array
- Both systems coexist during transition
