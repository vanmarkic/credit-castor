import { describe, it, expect } from 'vitest';
import { calculatePortageLotPrice, calculatePortageLotPriceFromCopro, calculateCarryingCosts } from '../utils/portageCalculations';
import { getAvailableLotsForNewcomer } from '../utils/availableLots';
import { DEFAULT_PORTAGE_FORMULA } from '../utils/calculatorUtils';
import type { Participant } from '../utils/calculatorUtils';
import type { CoproLot } from '../types/timeline';

describe('Portage Workflow Integration', () => {
  it('should handle complete portage scenario', () => {
    // Setup: 2 founders at T0
    const participants: Participant[] = [
      {
        name: 'Founder A',
        capitalApporte: 50000,
        notaryFeesRate: 12.5,
        interestRate: 4.5,
        durationYears: 25,
        isFounder: true,
        lotsOwned: [
          {
            lotId: 1,
            surface: 112,
            unitId: 1,
            isPortage: false,
            acquiredDate: new Date('2026-02-01'),
            originalPrice: 154224,
            originalNotaryFees: 19278
          },
          {
            lotId: 2,
            surface: 50,
            unitId: 2,
            isPortage: true,
            allocatedSurface: 50,
            acquiredDate: new Date('2026-02-01'),
            originalPrice: 68850,
            originalNotaryFees: 8606.25
          }
        ]
      }
    ];

    const coproLots: CoproLot[] = [
      {
        lotId: 10,
        surface: 300,
        acquiredDate: new Date('2026-02-01')
      }
    ];

    // T+2 years: Newcomer arrives
    const availableLots = getAvailableLotsForNewcomer(participants, coproLots);

    expect(availableLots).toHaveLength(2); // 1 founder portage + 1 copro

    // Check founder portage lot (imposed 50m²)
    const founderLot = availableLots.find(l => l.source === 'FOUNDER');
    expect(founderLot).toBeDefined();
    expect(founderLot!.surfaceImposed).toBe(true);
    expect(founderLot!.surface).toBe(50);

    // Calculate price for founder portage lot
    // Should use actual lot data if available from founderLot
    const originalPrice = founderLot!.originalPrice ?? 68850;
    const originalNotaryFees = founderLot!.originalNotaryFees ?? 8606.25;
    const originalConstructionCost = founderLot!.originalConstructionCost ?? 0;
    const totalAcquisition = originalPrice + originalNotaryFees + originalConstructionCost;

    const carryingCosts = calculateCarryingCosts(originalPrice, 0, 24, 4.5);
    const founderPrice = calculatePortageLotPrice(
      originalPrice,
      originalNotaryFees,
      originalConstructionCost,
      2,
      DEFAULT_PORTAGE_FORMULA,
      carryingCosts,
      0
    );

    expect(founderPrice.surfaceImposed).toBe(true);
    expect(founderPrice.totalPrice).toBeGreaterThan(totalAcquisition); // Base + indexation + carrying

    // Check copro lot (free surface)
    const coproLot = availableLots.find(l => l.source === 'COPRO');
    expect(coproLot).toBeDefined();
    expect(coproLot!.surfaceImposed).toBe(false);

    // Calculate price for 75m² from copro lot
    const coproPrice = calculatePortageLotPriceFromCopro(
      75,
      300,
      412500,
      2,
      DEFAULT_PORTAGE_FORMULA,
      15000
    );

    expect(coproPrice.surfaceImposed).toBe(false);
    expect(coproPrice.pricePerM2).toBeGreaterThan(0);
  });
});
