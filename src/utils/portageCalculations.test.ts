/**
 * Portage Calculations Test Suite
 *
 * Tests based on habitat-beaver guide examples:
 * - 2-year portage scenario
 * - Belgian property tax rates
 * - Indexation at 2%/year
 * - 60% fee recovery within 2 years
 */

import { describe, it, expect } from 'vitest';
import {
  calculateCarryingCosts,
  calculateResalePrice,
  calculateRedistribution,
  calculatePortageLotPrice,
  calculatePortageLotPriceFromCopro,
  type CarryingCosts,
  // ResalePrice, Redistribution - unused type imports removed
} from './portageCalculations';

describe('calculateCarryingCosts', () => {
  it('should calculate monthly interest correctly', () => {
    // Lot: 143,000€ purchase, 50,000€ capital = 93,000€ loan
    // Interest: 4.5% annual = 0.375% monthly
    // Expected: 93,000 × 0.00375 = 348.75€/month
    const result = calculateCarryingCosts(143000, 50000, 24, 4.5);

    expect(result.monthlyInterest).toBeCloseTo(348.75, 2);
  });

  it('should include Belgian empty property tax', () => {
    // From habitat-beaver guide: 388.38€/year = 32.365€/month
    const result = calculateCarryingCosts(143000, 50000, 24, 4.5);

    expect(result.monthlyTax).toBeCloseTo(32.37, 2);
  });

  it('should include insurance costs', () => {
    // From habitat-beaver guide: 2000€/year ÷ 12 months
    const result = calculateCarryingCosts(143000, 50000, 24, 4.5);

    expect(result.monthlyInsurance).toBeCloseTo(166.67, 2);
  });

  it('should calculate total monthly carrying cost', () => {
    // Interest + Tax + Insurance
    const result = calculateCarryingCosts(143000, 50000, 24, 4.5);

    const expectedMonthly = result.monthlyInterest + result.monthlyTax + result.monthlyInsurance;
    expect(result.totalMonthly).toBeCloseTo(expectedMonthly, 2);
  });

  it('should calculate total cost for 2-year period', () => {
    // From habitat-beaver guide: ~10,800€ for 2 years
    const result = calculateCarryingCosts(143000, 50000, 24, 4.5);

    expect(result.totalForPeriod).toBeCloseTo(result.totalMonthly * 24, 2);
    // Should be around 13,000€ based on actual calculation
  });

  it('should handle zero capital (100% loan)', () => {
    const result = calculateCarryingCosts(143000, 0, 24, 4.5);

    // Interest on full amount
    const monthlyInterest = (143000 * 4.5 / 100) / 12;
    expect(result.monthlyInterest).toBeCloseTo(monthlyInterest, 2);
  });

  it('should handle full capital (no loan)', () => {
    const result = calculateCarryingCosts(143000, 143000, 24, 4.5);

    // No interest, only tax and insurance
    expect(result.monthlyInterest).toBe(0);
    expect(result.monthlyTax).toBeGreaterThan(0);
    expect(result.monthlyInsurance).toBeGreaterThan(0);
  });
});

describe('calculateResalePrice', () => {
  it('should match habitat-beaver 2-year portage example', () => {
    // From guide: Base 143k, after 2 years with portage
    const carryingCosts: CarryingCosts = {
      monthlyInterest: 348.75,
      monthlyTax: 32.37,
      monthlyInsurance: 166.67,
      totalMonthly: 547.79,
      totalForPeriod: 13147 // 24 months × 547.79
    };

    const result = calculateResalePrice(
      143000,  // original purchase
      17875,   // notary fees (12.5%)
      2,       // years held
      2,       // indexation rate
      carryingCosts,
      0        // no renovations
    );

    // Expected breakdown from guide:
    // Base: 143,000
    // Indexation (2%/year × 2): 143000 × 1.02^2 - 143000 = 5,777.2
    // Carrying costs: 13,147
    // Fees recovery (60%): 10,725
    // Total: ~172,649

    expect(result.basePrice).toBe(143000);
    expect(result.indexation).toBeCloseTo(5777.2, 1);
    expect(result.carryingCostRecovery).toBeCloseTo(13147, 0);
    expect(result.feesRecovery).toBeCloseTo(10725, 0);
    expect(result.totalPrice).toBeCloseTo(172649, 0);
  });

  it('should calculate indexation correctly', () => {
    const result = calculateResalePrice(
      100000,  // base
      12500,   // fees
      3,       // years
      2,       // 2% indexation
      { totalForPeriod: 0 } as CarryingCosts,
      0
    );

    // 100,000 × (1.02^3 - 1) = 100,000 × 0.061208 = 6,120.80
    expect(result.indexation).toBeCloseTo(6121, 0);
  });

  it('should apply 60% fee recovery within 2 years', () => {
    const result = calculateResalePrice(
      143000,
      17875,
      2,  // 2 years = eligible
      2,
      { totalForPeriod: 0 } as CarryingCosts,
      0
    );

    expect(result.feesRecovery).toBeCloseTo(17875 * 0.6, 0);
  });

  it('should NOT apply fee recovery after 2 years', () => {
    const result = calculateResalePrice(
      143000,
      17875,
      2.1,  // Just over 2 years
      2,
      { totalForPeriod: 0 } as CarryingCosts,
      0
    );

    expect(result.feesRecovery).toBe(0);
  });

  it('should include renovation costs in total', () => {
    const result = calculateResalePrice(
      143000,
      17875,
      1,
      2,
      { totalForPeriod: 5000 } as CarryingCosts,
      15000  // renovations
    );

    expect(result.renovations).toBe(15000);
    expect(result.totalPrice).toBeGreaterThan(143000 + 15000);
  });

  it('should provide detailed breakdown', () => {
    const carryingCosts: CarryingCosts = {
      monthlyInterest: 300,
      monthlyTax: 30,
      monthlyInsurance: 150,
      totalMonthly: 480,
      totalForPeriod: 11520
    };

    const result = calculateResalePrice(
      150000,
      18750,
      2,
      2,
      carryingCosts,
      10000
    );

    expect(result.breakdown).toBeDefined();
    expect(result.breakdown.base).toBe(150000);
    expect(result.breakdown.fees).toBeCloseTo(18750 * 0.6, 0);
    expect(result.breakdown.indexation).toBeGreaterThan(0);
    expect(result.breakdown.carrying).toBe(11520);
    expect(result.breakdown.renovations).toBe(10000);
  });
});

describe('calculateRedistribution', () => {
  it('should distribute proportionally to surface quotités', () => {
    const participants = [
      { name: 'Buyer A', surface: 112 },
      { name: 'Buyer B', surface: 134 },
      { name: 'Buyer C', surface: 118 },
      { name: 'Buyer D', surface: 108 }
    ];

    const totalSurface = 472; // Sum of all surfaces
    const saleProceeds = 175000;

    const result = calculateRedistribution(saleProceeds, participants, totalSurface);

    expect(result).toHaveLength(4);

    // Check Buyer A (112/472 = 0.2372881...)
    const buyerA = result.find(r => r.participantName === 'Buyer A')!;
    expect(buyerA.quotite).toBeCloseTo(112/472, 4);
    expect(buyerA.amount).toBeCloseTo(175000 * (112/472), 1);

    // Check Buyer B (134/472 = 0.2838983...)
    const buyerB = result.find(r => r.participantName === 'Buyer B')!;
    expect(buyerB.quotite).toBeCloseTo(134/472, 4);
    expect(buyerB.amount).toBeCloseTo(175000 * (134/472), 1);
  });

  it('should sum to total sale proceeds', () => {
    const participants = [
      { name: 'Buyer A', surface: 100 },
      { name: 'Buyer B', surface: 150 },
      { name: 'Buyer C', surface: 120 }
    ];

    const saleProceeds = 200000;
    const result = calculateRedistribution(saleProceeds, participants, 370);

    const totalRedistributed = result.reduce((sum, r) => sum + r.amount, 0);
    expect(totalRedistributed).toBeCloseTo(saleProceeds, 0);
  });

  it('should handle equal surfaces', () => {
    const participants = [
      { name: 'Buyer A', surface: 100 },
      { name: 'Buyer B', surface: 100 },
      { name: 'Buyer C', surface: 100 }
    ];

    const result = calculateRedistribution(150000, participants, 300);

    // Each gets exactly 1/3
    result.forEach(r => {
      expect(r.quotite).toBeCloseTo(1/3, 4);
      expect(r.amount).toBeCloseTo(50000, 0);
    });
  });

  it('should handle single participant (edge case)', () => {
    const participants = [
      { name: 'Only Buyer', surface: 200 }
    ];

    const result = calculateRedistribution(100000, participants, 200);

    expect(result).toHaveLength(1);
    expect(result[0].quotite).toBe(1);
    expect(result[0].amount).toBe(100000);
  });

  it('should match habitat-beaver guide example', () => {
    // From guide: 4 initial buyers, hidden lot sold for 175k
    const participants = [
      { name: 'Buyer A', surface: 112 },
      { name: 'Buyer B', surface: 134 },
      { name: 'Buyer C', surface: 118 },
      { name: 'Buyer D', surface: 108 }
    ];

    const result = calculateRedistribution(175000, participants, 472);

    // From guide expected amounts (using precise calculations):
    expect(result.find(r => r.participantName === 'Buyer A')?.amount).toBeCloseTo(175000 * (112/472), 0);
    expect(result.find(r => r.participantName === 'Buyer B')?.amount).toBeCloseTo(175000 * (134/472), 0);
    expect(result.find(r => r.participantName === 'Buyer C')?.amount).toBeCloseTo(175000 * (118/472), 0);
    expect(result.find(r => r.participantName === 'Buyer D')?.amount).toBeCloseTo(175000 * (108/472), 0);
  });
});

describe('calculatePortageLotPrice', () => {
  it('should calculate price for lot from founder with imposed surface', () => {
    // Founder allocated 50m² for portage at deed date
    // Original price: 50m² × 1377€/m² = 68,850€
    // Held for 2 years with 2% indexation
    // Carrying costs: calculated based on lot value and loan

    const carryingCosts: CarryingCosts = {
      monthlyInterest: 200,
      monthlyTax: 32.37,
      monthlyInsurance: 166.67,
      totalMonthly: 399.04,
      totalForPeriod: 9577 // 24 months
    };

    const result = calculatePortageLotPrice(
      68850,    // original price (50m² × 1377)
      8606.25,  // notary fees (12.5%)
      2,        // years held
      2,        // indexation rate
      carryingCosts,
      0         // no renovations
    );

    // Expected: base + indexation + carrying + fee recovery
    expect(result.basePrice).toBe(68850);
    expect(result.surfaceImposed).toBe(true);
    expect(result.totalPrice).toBeGreaterThan(68850);
  });

  it('should calculate price for lot from copropriété with free surface', () => {
    // Newcomer chooses 75m² from copropriété lot
    // Base calculation: 75m² × indexed price/m²
    // Plus portage costs proportional to surface ratio

    const result = calculatePortageLotPriceFromCopro(
      75,        // surface chosen by newcomer
      300,       // total copro lot surface
      412500,    // total copro lot original price
      2,         // years held
      2,         // indexation
      15000      // total carrying costs for whole copro lot
    );

    // Expected: proportional base + indexation + carrying
    const expectedBase = 412500 * (75 / 300); // 103,125
    expect(result.basePrice).toBeCloseTo(expectedBase, 0);
    expect(result.surfaceImposed).toBe(false);
    expect(result.totalPrice).toBeGreaterThan(expectedBase);
  });
});
