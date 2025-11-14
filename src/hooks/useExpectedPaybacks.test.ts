import { renderHook } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useExpectedPaybacks } from './useExpectedPaybacks';
import type { Participant } from '../utils/calculatorUtils';

describe('useExpectedPaybacks', () => {
  const deedDate = '2024-01-01';
  const founder: Participant = {
    name: 'Alice',
    surface: 100,
    capitalApporte: 100000,
    registrationFeesRate: 12.5,
    interestRate: 4.5,
    durationYears: 25,
    quantity: 1,
    parachevementsPerM2: 500,
    unitId: 1,
    isFounder: true,
    entryDate: new Date(deedDate),
    lotsOwned: [
      { lotId: 1, surface: 50, isPortage: true, acquiredDate: new Date(deedDate), unitId: 1 }
    ]
  };

  it('returns empty paybacks when no buyers', () => {
    const { result } = renderHook(() =>
      useExpectedPaybacks(founder, [founder], deedDate)
    );

    expect(result.current.paybacks).toEqual([]);
    expect(result.current.totalRecovered).toBe(0);
  });

  it('calculates portage paybacks correctly', () => {
    const buyer: Participant = {
      name: 'Bob',
      surface: 50,
      capitalApporte: 50000,
      registrationFeesRate: 12.5,
      interestRate: 4.5,
      durationYears: 25,
      quantity: 1,
      parachevementsPerM2: 500,
      unitId: 1,
      isFounder: false,
      entryDate: new Date('2025-01-01'),
      purchaseDetails: {
        buyingFrom: 'Alice',
        lotId: 1,
        purchasePrice: 150000
      }
    };

    const { result } = renderHook(() =>
      useExpectedPaybacks(founder, [founder, buyer], deedDate)
    );

    expect(result.current.paybacks).toHaveLength(1);
    expect(result.current.paybacks[0]).toMatchObject({
      buyer: 'Bob',
      amount: 150000,
      type: 'portage',
      description: 'Achat de lot portage'
    });
    expect(result.current.totalRecovered).toBe(150000);
  });

  it('includes copro redistributions', () => {
    const buyer: Participant = {
      name: 'Charlie',
      surface: 50,
      capitalApporte: 50000,
      registrationFeesRate: 12.5,
      interestRate: 4.5,
      durationYears: 25,
      quantity: 1,
      parachevementsPerM2: 500,
      unitId: 1,
      isFounder: false,
      entryDate: new Date('2025-01-01'),
      purchaseDetails: {
        buyingFrom: 'Copropriété',
        lotId: 999,
        purchasePrice: 100000
      }
    };

    const { result } = renderHook(() =>
      useExpectedPaybacks(founder, [founder, buyer], deedDate)
    );

    // Should include copro redistribution (exact amount depends on time in project)
    expect(result.current.paybacks.length).toBeGreaterThan(0);
    const coproPayback = result.current.paybacks.find(pb => pb.type === 'copro');
    expect(coproPayback).toBeDefined();
    expect(coproPayback?.buyer).toBe('Charlie');
  });

  it('sorts paybacks by date', () => {
    const buyer1: Participant = {
      name: 'Bob',
      surface: 50,
      capitalApporte: 50000,
      registrationFeesRate: 12.5,
      interestRate: 4.5,
      durationYears: 25,
      quantity: 1,
      parachevementsPerM2: 500,
      unitId: 1,
      isFounder: false,
      entryDate: new Date('2026-01-01'), // Later
      purchaseDetails: {
        buyingFrom: 'Alice',
        lotId: 1,
        purchasePrice: 150000
      }
    };

    const buyer2: Participant = {
      name: 'Charlie',
      surface: 40,
      capitalApporte: 40000,
      registrationFeesRate: 12.5,
      interestRate: 4.5,
      durationYears: 25,
      quantity: 1,
      parachevementsPerM2: 500,
      unitId: 1,
      isFounder: false,
      entryDate: new Date('2025-01-01'), // Earlier
      purchaseDetails: {
        buyingFrom: 'Alice',
        lotId: 2,
        purchasePrice: 140000
      }
    };

    const founderWithMultipleLots = {
      ...founder,
      lotsOwned: [
        { lotId: 1, surface: 50, isPortage: true, acquiredDate: new Date(deedDate), unitId: 1 },
        { lotId: 2, surface: 40, isPortage: true, acquiredDate: new Date(deedDate), unitId: 1 }
      ]
    };

    const { result } = renderHook(() =>
      useExpectedPaybacks(founderWithMultipleLots, [founderWithMultipleLots, buyer1, buyer2], deedDate)
    );

    expect(result.current.paybacks).toHaveLength(2);
    expect(result.current.paybacks[0].buyer).toBe('Charlie'); // Earlier date
    expect(result.current.paybacks[1].buyer).toBe('Bob'); // Later date
  });

  it('calculates correct total recovered amount', () => {
    const buyer1: Participant = {
      name: 'Bob',
      surface: 50,
      capitalApporte: 50000,
      registrationFeesRate: 12.5,
      interestRate: 4.5,
      durationYears: 25,
      quantity: 1,
      parachevementsPerM2: 500,
      unitId: 1,
      isFounder: false,
      entryDate: new Date('2025-01-01'),
      purchaseDetails: {
        buyingFrom: 'Alice',
        lotId: 1,
        purchasePrice: 150000
      }
    };

    const buyer2: Participant = {
      name: 'Charlie',
      surface: 40,
      capitalApporte: 40000,
      registrationFeesRate: 12.5,
      interestRate: 4.5,
      durationYears: 25,
      quantity: 1,
      parachevementsPerM2: 500,
      unitId: 1,
      isFounder: false,
      entryDate: new Date('2026-01-01'),
      purchaseDetails: {
        buyingFrom: 'Alice',
        lotId: 2,
        purchasePrice: 140000
      }
    };

    const founderWithMultipleLots = {
      ...founder,
      lotsOwned: [
        { lotId: 1, surface: 50, isPortage: true, acquiredDate: new Date(deedDate), unitId: 1 },
        { lotId: 2, surface: 40, isPortage: true, acquiredDate: new Date(deedDate), unitId: 1 }
      ]
    };

    const { result } = renderHook(() =>
      useExpectedPaybacks(founderWithMultipleLots, [founderWithMultipleLots, buyer1, buyer2], deedDate)
    );

    expect(result.current.totalRecovered).toBe(290000);
  });

  it('respects coproReservesShare when calculating copro redistributions', () => {
    const buyer: Participant = {
      name: 'Charlie',
      surface: 50,
      capitalApporte: 50000,
      registrationFeesRate: 12.5,
      interestRate: 4.5,
      durationYears: 25,
      quantity: 1,
      parachevementsPerM2: 500,
      unitId: 1,
      isFounder: false,
      entryDate: new Date('2025-01-01'),
      purchaseDetails: {
        buyingFrom: 'Copropriété',
        lotId: 999,
        purchasePrice: 100000 // Total price
      }
    };

    // Default: 30% to copro reserves, 70% to participants
    const { result: defaultResult } = renderHook(() =>
      useExpectedPaybacks(founder, [founder, buyer], deedDate)
    );

    const defaultCoproPayback = defaultResult.current.paybacks.find(pb => pb.type === 'copro');
    expect(defaultCoproPayback).toBeDefined();
    // With 30% to reserves, 70% goes to participants
    // Founder's quotité: 100m² / (100m² + 50m²) = 66.67%
    // Founder gets 66.67% of 70,000€ = 46,666.67€
    const founderQuotite = 100 / (100 + 50); // 0.6667
    expect(defaultCoproPayback?.amount).toBeCloseTo(70000 * founderQuotite, 2);

    // Custom: 60% to copro reserves, 40% to participants
    const { result: customResult } = renderHook(() =>
      useExpectedPaybacks(founder, [founder, buyer], deedDate, 60)
    );

    const customCoproPayback = customResult.current.paybacks.find(pb => pb.type === 'copro');
    expect(customCoproPayback).toBeDefined();
    // With 60% to reserves, 40% goes to participants
    // Founder gets 66.67% of 40,000€ = 26,666.67€
    expect(customCoproPayback?.amount).toBeCloseTo(40000 * founderQuotite, 2);
  });

  it('applies coproReservesShare split before time-based redistribution', () => {
    const founder2: Participant = {
      name: 'Bob',
      surface: 100,
      capitalApporte: 100000,
      registrationFeesRate: 12.5,
      interestRate: 4.5,
      durationYears: 25,
      quantity: 1,
      parachevementsPerM2: 500,
      unitId: 1,
      isFounder: true,
      entryDate: new Date(deedDate),
      lotsOwned: [
        { lotId: 2, surface: 50, isPortage: true, acquiredDate: new Date(deedDate), unitId: 1 }
      ]
    };

    const buyer: Participant = {
      name: 'Charlie',
      surface: 50,
      capitalApporte: 50000,
      registrationFeesRate: 12.5,
      interestRate: 4.5,
      durationYears: 25,
      quantity: 1,
      parachevementsPerM2: 500,
      unitId: 1,
      isFounder: false,
      entryDate: new Date('2025-01-01'),
      purchaseDetails: {
        buyingFrom: 'Copropriété',
        lotId: 999,
        purchasePrice: 100000
      }
    };

    // With 40% to copro reserves, 60% goes to participants
    // Two founders entered at same time, so they split the 60k equally
    const { result: aliceResult } = renderHook(() =>
      useExpectedPaybacks(founder, [founder, founder2, buyer], deedDate, 40)
    );

    const aliceCoproPayback = aliceResult.current.paybacks.find(pb => pb.type === 'copro');
    expect(aliceCoproPayback).toBeDefined();
    // 60% of 100k = 60k, distributed by quotité
    // Alice quotité: 100m² / (100m² + 100m² + 50m²) = 40%
    // Alice gets 40% of 60,000€ = 24,000€
    const aliceQuotite = 100 / (100 + 100 + 50); // 0.4
    expect(aliceCoproPayback?.amount).toBeCloseTo(60000 * aliceQuotite, 2);

    const { result: bobResult } = renderHook(() =>
      useExpectedPaybacks(founder2, [founder, founder2, buyer], deedDate, 40)
    );

    const bobCoproPayback = bobResult.current.paybacks.find(pb => pb.type === 'copro');
    expect(bobCoproPayback).toBeDefined();
    // Bob has same quotité as Alice: 40%
    expect(bobCoproPayback?.amount).toBeCloseTo(60000 * aliceQuotite, 2);
  });
});
