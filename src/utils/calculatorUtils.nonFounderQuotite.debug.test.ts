/**
 * Debug test using actual data from the user
 * This test reproduces the exact scenario where quotité is showing as 0
 */

import { describe, it, expect } from 'vitest';
import { calculateNewcomerQuotite, calculateNewcomerPurchasePrice } from './calculatorUtils';
import type { Participant, PortageFormulaParams } from './calculatorUtils';

describe('Debug: Quotité calculation with actual user data', () => {
  // Actual data from user
  const deedDate = '2026-02-01';
  const deedDateObj = new Date(deedDate);
  
  const founders: Participant[] = [
    {
      name: 'Manuela/Dragan',
      surface: 140,
      isFounder: true,
      entryDate: new Date('2026-02-01T00:00:00.000Z'),
      capitalApporte: 150000,
      registrationFeesRate: 3,
      interestRate: 4,
      durationYears: 25,
    },
    {
      name: 'Cathy/Jim',
      surface: 225,
      isFounder: true,
      entryDate: new Date('2026-02-01T00:00:00.000Z'),
      capitalApporte: 450000,
      registrationFeesRate: 3,
      interestRate: 4.5,
      durationYears: 25,
    },
    {
      name: 'Annabelle/Colin',
      surface: 200,
      isFounder: true,
      entryDate: new Date('2026-02-01T00:00:00.000Z'),
      capitalApporte: 200000,
      registrationFeesRate: 12.5,
      interestRate: 4,
      durationYears: 25,
    },
    {
      name: 'Julie/Séverin',
      surface: 108,
      isFounder: true,
      entryDate: new Date('2026-02-01T00:00:00.000Z'),
      capitalApporte: 245000,
      registrationFeesRate: 3,
      interestRate: 4,
      durationYears: 25,
    },
  ];

  const nonFounders: Participant[] = [
    {
      name: 'Participant·e 5',
      surface: 100,
      isFounder: false,
      entryDate: new Date('2027-02-01T00:00:00.000Z'),
      capitalApporte: 40000,
      registrationFeesRate: 12.5,
      interestRate: 4,
      durationYears: 25,
      purchaseDetails: {
        buyingFrom: 'Copropriété',
        lotId: 999,
        purchasePrice: 147332.3837512903,
      },
    },
    {
      name: 'Participant·e 6',
      surface: 100,
      isFounder: false,
      entryDate: new Date('2027-02-01T00:00:00.000Z'),
      capitalApporte: 100000,
      registrationFeesRate: 12.5,
      interestRate: 4.5,
      durationYears: 25,
      purchaseDetails: {
        buyingFrom: 'Copropriété',
        lotId: 999,
        purchasePrice: 147332.3837512903,
      },
    },
    {
      name: 'Participant·e 7',
      surface: 100,
      isFounder: false,
      entryDate: new Date('2027-02-01T00:00:00.000Z'),
      capitalApporte: 100000,
      registrationFeesRate: 12.5,
      interestRate: 4.5,
      durationYears: 25,
      purchaseDetails: {
        buyingFrom: 'Copropriété',
        lotId: 999,
        purchasePrice: 147332.3837512903,
      },
    },
    {
      name: 'Participant·e 8',
      surface: 100,
      isFounder: false,
      entryDate: new Date('2027-02-01T00:00:00.000Z'),
      capitalApporte: 100000,
      registrationFeesRate: 12.5,
      interestRate: 4.5,
      durationYears: 25,
      purchaseDetails: {
        buyingFrom: 'Copropriété',
        lotId: 999,
        purchasePrice: 147332.3837512903,
      },
    },
    {
      name: 'Participant·e 9',
      surface: 100,
      isFounder: false,
      entryDate: new Date('2027-02-01T00:00:00.000Z'),
      capitalApporte: 100000,
      registrationFeesRate: 12.5,
      interestRate: 4.5,
      durationYears: 25,
      purchaseDetails: {
        buyingFrom: 'Copropriété',
        lotId: 999,
        purchasePrice: 147332.3837512903,
      },
    },
    {
      name: 'Participant·e 10',
      surface: 100,
      isFounder: false,
      entryDate: new Date('2027-02-02T00:00:00.000Z'),
      capitalApporte: 100000,
      registrationFeesRate: 12.5,
      interestRate: 4.5,
      durationYears: 25,
      purchaseDetails: {
        buyingFrom: 'Copropriété',
        lotId: 999,
        purchasePrice: 147332.3837512903,
      },
    },
  ];

  const allParticipants = [...founders, ...nonFounders];
  const totalProjectCost = 650000;

  it('should calculate quotité correctly for Participant·e 5', () => {
    const newcomer = nonFounders[0]; // Participant·e 5
    
    // Simulate the exact filtering logic from CostBreakdownGrid.tsx
    const existingParticipants = allParticipants.filter(existing => {
      const existingEntryDate = existing.entryDate || (existing.isFounder ? deedDateObj : null);
      if (!existingEntryDate) return false;
      
      const buyerEntryDate = newcomer.entryDate 
        ? (newcomer.entryDate instanceof Date ? newcomer.entryDate : new Date(newcomer.entryDate))
        : deedDateObj;
      return existingEntryDate <= buyerEntryDate;
    });

    console.log('Founders:', founders.length);
    console.log('Non-founders before filtering:', nonFounders.length);
    console.log('Existing participants after filtering:', existingParticipants.length);
    console.log('Existing participants:', existingParticipants.map(p => ({ name: p.name, surface: p.surface, entryDate: p.entryDate })));
    
    // Calculate total surface of existing participants
    const totalSurface = existingParticipants.reduce((sum, p) => sum + (p.surface || 0), 0);
    console.log('Total surface of existing participants:', totalSurface);
    console.log('Newcomer surface:', newcomer.surface);
    
    // Calculate quotité
    const quotite = calculateNewcomerQuotite(newcomer.surface || 0, existingParticipants);
    console.log('Calculated quotité:', quotite);
    console.log('Quotité as percentage:', (quotite * 100).toFixed(1) + '%');
    console.log('Quotité as fraction:', Math.round(quotite * 1000) + '/1000');
    
    // Calculation: When Participant·e 5 enters on 2027-02-01:
    // - Founders: 140 + 225 + 200 + 108 = 673 m²
    // - Non-founders entering on or before 2027-02-01: 5 participants × 100 = 500 m²
    // - Total: 673 + 500 = 1173 m²
    // - Quotité for Participant·e 5: 100 / 1173 = 0.0852... = 8.5% = 85/1000
    
    // But the test shows 100 / 873 = 0.1145... because only 2 non-founders are in the test
    // Let's verify the calculation is correct regardless of the exact number
    
    expect(quotite).toBeGreaterThan(0);
    // The actual calculation: 100 / (140 + 225 + 200 + 108 + 100 + 100 + 100 + 100 + 100) = 100 / 1173 = 0.0852...
    expect(quotite).toBeCloseTo(100 / 1173, 5); // 0.0852...
    expect(Math.round(quotite * 1000)).toBe(85); // 85/1000, NOT 0/1000
  });

  it('should calculate purchase price correctly for Participant·e 5', () => {
    const newcomer = nonFounders[0];
    const formulaParams: PortageFormulaParams = {
      indexationRate: 2,
      carryingCostRecovery: 100,
      coproReservesShare: 0,
      averageInterestRate: 4.5,
    };

    const existingParticipants = allParticipants.filter(existing => {
      const existingEntryDate = existing.entryDate || (existing.isFounder ? deedDateObj : null);
      if (!existingEntryDate) return false;
      const buyerEntryDate = newcomer.entryDate || deedDateObj;
      return existingEntryDate <= buyerEntryDate;
    });

    const result = calculateNewcomerPurchasePrice(
      newcomer.surface || 0,
      existingParticipants,
      totalProjectCost,
      deedDate,
      newcomer.entryDate!,
      formulaParams
    );

    console.log('Purchase price calculation result:', {
      quotite: result.quotite,
      basePrice: result.basePrice,
      indexation: result.indexation,
      carryingCostRecovery: result.carryingCostRecovery,
      totalPrice: result.totalPrice,
      yearsHeld: result.yearsHeld,
    });

    expect(result.quotite).toBeGreaterThan(0);
    expect(result.basePrice).toBeGreaterThan(0);
    expect(result.totalPrice).toBeGreaterThan(0);
  });

  it('should identify if the issue is in the display calculation', () => {
    const newcomer = nonFounders[0];
    
    // The display shows: allParticipants.reduce(...)
    const displayTotal = allParticipants.reduce((s, p) => s + (p.surface || 0), 0);
    console.log('Display total (allParticipants):', displayTotal); // Should be 1273
    
    // The calculation uses: existingParticipants (filtered)
    const existingParticipants = allParticipants.filter(existing => {
      const existingEntryDate = existing.entryDate || (existing.isFounder ? deedDateObj : null);
      if (!existingEntryDate) return false;
      const buyerEntryDate = newcomer.entryDate || deedDateObj;
      return existingEntryDate <= buyerEntryDate;
    });
    const calculationTotal = existingParticipants.reduce((s, p) => s + (p.surface || 0), 0);
    console.log('Calculation total (existingParticipants):', calculationTotal); // Should be 1173
    
    // Key finding: quotité calculation is NOT 0 - it's working correctly!
    // Display shows 1273 (all participants including Participant·e 10 who enters later)
    // Calculation uses 1173 (only participants who entered on or before Participant·e 5's entry date)
    // This mismatch is expected and correct - the calculation uses the right total for the entry date
    expect(displayTotal).toBe(1273); // All participants
    expect(calculationTotal).toBe(1173); // Only up to Participant·e 5's entry date (excludes Participant·e 10)
    
    const quotite = calculateNewcomerQuotite(newcomer.surface || 0, existingParticipants);
    expect(quotite).toBeGreaterThan(0);
  });
});

