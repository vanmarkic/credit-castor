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
    notaryFeesRate: 12.5,
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
      notaryFeesRate: 12.5,
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
      notaryFeesRate: 12.5,
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
      notaryFeesRate: 12.5,
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
      notaryFeesRate: 12.5,
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
      notaryFeesRate: 12.5,
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
      notaryFeesRate: 12.5,
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
});
