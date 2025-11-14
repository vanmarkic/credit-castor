/**
 * Tests for ProjectParams data migration
 *
 * Migration context:
 * - Nov 12 (b071f02): Added travauxCommuns with ExpenseLineItem[] format: { label, amount }
 * - Nov 14 (fd03a6f): Changed to TravauxCommunsItem[] format: { label, sqm, cascoPricePerSqm, parachevementPricePerSqm, amount? }
 * - Nov 14 (9dd8e6b): Added maxTotalLots field (optional, default: 10)
 * - Existing Firestore documents have OLD format without sqm fields and missing maxTotalLots
 * - Need migration to convert OLD → NEW format
 */

import { describe, test, expect } from 'vitest';
import { migrateProjectParams, migrateTravauxCommuns } from './projectParamsMigration';
import type { ProjectParams } from './calculatorUtils';

describe('migrateTravauxCommuns', () => {
  test('converts old format with amount to new format with sqm fields', () => {
    const oldFormat = {
      enabled: false,
      items: [
        {
          label: 'Rénovation complète',
          amount: 270000
        }
      ]
    };

    const result = migrateTravauxCommuns(oldFormat);

    expect(result.enabled).toBe(false);
    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toMatchObject({
      label: 'Rénovation complète',
      sqm: expect.any(Number),
      cascoPricePerSqm: expect.any(Number),
      parachevementPricePerSqm: expect.any(Number),
      amount: 270000 // Should preserve original amount
    });
  });

  test('handles already-migrated new format without changes', () => {
    const newFormat = {
      enabled: true,
      items: [
        {
          label: 'Travaux communs',
          sqm: 336,
          cascoPricePerSqm: 600,
          parachevementPricePerSqm: 200,
          amount: 268800 // (336 * 600) + (336 * 200)
        }
      ]
    };

    const result = migrateTravauxCommuns(newFormat);

    expect(result).toEqual(newFormat);
  });

  test('handles empty items array', () => {
    const input = {
      enabled: false,
      items: []
    };

    const result = migrateTravauxCommuns(input);

    expect(result).toEqual({
      enabled: false,
      items: []
    });
  });

  test('handles multiple items with old format', () => {
    const oldFormat = {
      enabled: true,
      items: [
        { label: 'Item 1', amount: 100000 },
        { label: 'Item 2', amount: 50000 }
      ]
    };

    const result = migrateTravauxCommuns(oldFormat);

    expect(result.items).toHaveLength(2);
    expect(result.items[0].sqm).toBeDefined();
    expect(result.items[0].cascoPricePerSqm).toBeDefined();
    expect(result.items[0].parachevementPricePerSqm).toBeDefined();
    expect(result.items[1].sqm).toBeDefined();
    expect(result.items[1].cascoPricePerSqm).toBeDefined();
    expect(result.items[1].parachevementPricePerSqm).toBeDefined();
  });

  test('handles null or undefined input gracefully', () => {
    expect(migrateTravauxCommuns(null as any)).toBeNull();
    expect(migrateTravauxCommuns(undefined as any)).toBeUndefined();
  });

  test('calculates sqm and prices that sum to original amount', () => {
    const oldFormat = {
      enabled: false,
      items: [
        {
          label: 'Test',
          amount: 268800 // Should result in sqm=336, casco=600, parachevements=200
        }
      ]
    };

    const result = migrateTravauxCommuns(oldFormat);

    const item = result.items[0];
    const calculatedAmount = (item.sqm * item.cascoPricePerSqm) +
                            (item.sqm * item.parachevementPricePerSqm);

    expect(calculatedAmount).toBeCloseTo(268800, 0);
  });
});

describe('migrateProjectParams', () => {
  test('adds maxTotalLots default when missing', () => {
    const oldParams: Partial<ProjectParams> = {
      totalPurchase: 650000,
      globalCascoPerM2: 1590,
      // maxTotalLots is missing
    };

    const result = migrateProjectParams(oldParams as ProjectParams);

    expect(result.maxTotalLots).toBe(10); // DEFAULT_MAX_TOTAL_LOTS
  });

  test('preserves existing maxTotalLots value', () => {
    const params: Partial<ProjectParams> = {
      totalPurchase: 650000,
      globalCascoPerM2: 1590,
      maxTotalLots: 15,
    };

    const result = migrateProjectParams(params as ProjectParams);

    expect(result.maxTotalLots).toBe(15);
  });

  test('migrates travauxCommuns from old to new format', () => {
    const oldParams: any = {
      totalPurchase: 650000,
      globalCascoPerM2: 1590,
      travauxCommuns: {
        enabled: false,
        items: [
          {
            label: 'Rénovation complète',
            amount: 270000
          }
        ]
      }
    };

    const result = migrateProjectParams(oldParams);

    expect(result.travauxCommuns?.items[0]).toMatchObject({
      label: 'Rénovation complète',
      sqm: expect.any(Number),
      cascoPricePerSqm: expect.any(Number),
      parachevementPricePerSqm: expect.any(Number),
      amount: 270000
    });
  });

  test('handles both migrations together', () => {
    const oldParams: any = {
      totalPurchase: 650000,
      globalCascoPerM2: 1590,
      // Missing maxTotalLots
      travauxCommuns: {
        enabled: true,
        items: [{ label: 'Test', amount: 100000 }]
      }
    };

    const result = migrateProjectParams(oldParams);

    expect(result.maxTotalLots).toBe(10);
    expect(result.travauxCommuns?.items[0].sqm).toBeDefined();
  });

  test('handles already-migrated params without changes', () => {
    const newParams: Partial<ProjectParams> = {
      totalPurchase: 650000,
      globalCascoPerM2: 1590,
      maxTotalLots: 12,
      travauxCommuns: {
        enabled: true,
        items: [
          {
            label: 'Travaux communs',
            sqm: 336,
            cascoPricePerSqm: 600,
            parachevementPricePerSqm: 200
          }
        ]
      }
    };

    const result = migrateProjectParams(newParams as ProjectParams);

    expect(result).toEqual(newParams);
  });
});
