/**
 * Tests for Timeline Calculations
 *
 * Following TDD approach - Phase 2, Task 2.1
 */

import { describe, it, expect } from 'vitest';
import { calculateSalePrice } from './timelineCalculations';
import type { Lot } from '../types/timeline';

describe('calculateSalePrice from deed date', () => {
  it('should calculate holding duration from acquisition date', () => {
    const lot: Lot = {
      lotId: 1,
      surface: 85,
      unitId: 101,
      isPortage: false,
      acquiredDate: new Date('2026-02-01'), // Deed date
      originalPrice: 170000,
    };
    const saleDate = new Date('2028-02-01'); // 24 months later

    const result = calculateSalePrice(lot, saleDate);

    expect(result.monthsHeld).toBe(24);
    expect(result.base).toBe(170000);
    expect(result.indexation).toBeGreaterThan(0);
    expect(result.carryingCosts).toBe(0); // Not portage
  });

  it('should add carrying costs for portage lots from deed date', () => {
    const lot: Lot = {
      lotId: 2,
      surface: 85,
      unitId: 101,
      isPortage: true,
      acquiredDate: new Date('2026-02-01'),
      originalPrice: 170000,
      monthlyCarryingCost: 500,
    };
    const saleDate = new Date('2028-02-01');

    const result = calculateSalePrice(lot, saleDate);

    expect(result.monthsHeld).toBe(24);
    expect(result.carryingCosts).toBe(500 * 24);
  });

  it('should recover 60% notary fees if sold within 2 years of deed', () => {
    const lot: Lot = {
      lotId: 1,
      surface: 85,
      unitId: 101,
      isPortage: false,
      acquiredDate: new Date('2026-02-01'),
      originalPrice: 170000,
      originalNotaryFees: 21250,
    };
    const saleDate = new Date('2027-06-01'); // 16 months after deed

    const result = calculateSalePrice(lot, saleDate);

    expect(result.monthsHeld).toBe(16);
    expect(result.feeRecovery).toBe(21250 * 0.6);
  });

  it('should NOT recover fees if sold exactly 2 years after deed', () => {
    const lot: Lot = {
      lotId: 1,
      surface: 85,
      unitId: 101,
      isPortage: false,
      acquiredDate: new Date('2026-02-01'),
      originalPrice: 170000,
      originalNotaryFees: 21250,
    };
    const saleDate = new Date('2028-02-01'); // Exactly 24 months

    const result = calculateSalePrice(lot, saleDate);

    expect(result.monthsHeld).toBe(24);
    expect(result.feeRecovery).toBe(0); // >= 2 years, no recovery
  });

  it('should NOT recover fees if sold after 2 years', () => {
    const lot: Lot = {
      lotId: 1,
      surface: 85,
      unitId: 101,
      isPortage: false,
      acquiredDate: new Date('2026-02-01'),
      originalPrice: 170000,
      originalNotaryFees: 21250,
    };
    const saleDate = new Date('2028-06-01'); // 28 months

    const result = calculateSalePrice(lot, saleDate);

    expect(result.monthsHeld).toBe(28);
    expect(result.feeRecovery).toBe(0);
  });
});
