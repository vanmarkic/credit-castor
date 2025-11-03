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
import type { PortageFormulaParams } from './calculatorUtils';

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
    // Updated test: portage acquisition now includes construction costs
    // Total acquisition = purchase + notary + construction
    const originalPrice = 143000;
    const originalNotaryFees = 17875;
    const originalConstructionCost = 0; // No construction in this test
    const totalAcquisition = originalPrice + originalNotaryFees + originalConstructionCost;

    const carryingCosts: CarryingCosts = {
      monthlyInterest: 348.75,
      monthlyTax: 32.37,
      monthlyInsurance: 166.67,
      totalMonthly: 547.79,
      totalForPeriod: 13147 // 24 months × 547.79
    };

    const formulaParams: PortageFormulaParams = {
      indexationRate: 2,
      carryingCostRecovery: 100,
      averageInterestRate: 4.5
    };

    const result = calculateResalePrice(
      originalPrice,
      originalNotaryFees,
      originalConstructionCost,
      2,       // years held
      formulaParams,
      carryingCosts,
      0        // no renovations
    );

    // Expected with new logic (notary fees in base, no separate recovery):
    // Base: 160,875 (143k + 17,875)
    // Indexation: 160875 × (1.02^2 - 1) = 6,499.86
    // Carrying costs: 13,147
    // Total: 160,875 + 6,499.86 + 13,147 = 180,521.86

    expect(result.basePrice).toBe(totalAcquisition);
    expect(result.indexation).toBeCloseTo(6499.35, 1);
    expect(result.carryingCostRecovery).toBeCloseTo(13147, 0);
    expect(result.feesRecovery).toBe(0); // No separate fee recovery in new logic
    expect(result.totalPrice).toBeCloseTo(180521.35, 1);
  });

  it('should calculate indexation correctly', () => {
    const originalPrice = 100000;
    const originalNotaryFees = 12500;
    const originalConstructionCost = 0;

    const formulaParams: PortageFormulaParams = {
      indexationRate: 2,
      carryingCostRecovery: 100,
      averageInterestRate: 4.5
    };

    const result = calculateResalePrice(
      originalPrice,
      originalNotaryFees,
      originalConstructionCost,
      3,       // years
      formulaParams,
      { totalForPeriod: 0 } as CarryingCosts,
      0
    );

    // 112,500 × (1.02^3 - 1) = 112,500 × 0.061208 = 6,885.90
    expect(result.indexation).toBeCloseTo(6886, 0);
  });

  it('should include notary fees in base acquisition cost (not separate recovery)', () => {
    const originalPrice = 143000;
    const originalNotaryFees = 17875;
    const originalConstructionCost = 0;

    const formulaParams: PortageFormulaParams = {
      indexationRate: 2,
      carryingCostRecovery: 100,
      averageInterestRate: 4.5
    };

    const result = calculateResalePrice(
      originalPrice,
      originalNotaryFees,
      originalConstructionCost,
      2,  // 2 years
      formulaParams,
      { totalForPeriod: 0 } as CarryingCosts,
      0
    );

    // Notary fees are now part of base acquisition, not recovered separately
    expect(result.basePrice).toBe(originalPrice + originalNotaryFees + originalConstructionCost);
    expect(result.feesRecovery).toBe(0);
  });

  it('should NOT apply fee recovery (fees are in base)', () => {
    const formulaParams: PortageFormulaParams = {
      indexationRate: 2,
      carryingCostRecovery: 100,
      averageInterestRate: 4.5
    };

    const result = calculateResalePrice(
      143000,
      17875,
      0, // construction
      2.1,  // Just over 2 years
      formulaParams,
      { totalForPeriod: 0 } as CarryingCosts,
      0
    );

    // No separate fee recovery in new logic
    expect(result.feesRecovery).toBe(0);
  });

  it('should include renovation costs in total', () => {
    const originalPrice = 143000;
    const originalNotaryFees = 17875;
    const originalConstructionCost = 0;

    const formulaParams: PortageFormulaParams = {
      indexationRate: 2,
      carryingCostRecovery: 100,
      averageInterestRate: 4.5
    };

    const result = calculateResalePrice(
      originalPrice,
      originalNotaryFees,
      originalConstructionCost,
      1,
      formulaParams,
      { totalForPeriod: 5000 } as CarryingCosts,
      15000  // renovations
    );

    expect(result.renovations).toBe(15000);
    expect(result.totalPrice).toBeGreaterThan(originalPrice + originalNotaryFees + 15000);
  });

  it('should provide detailed breakdown', () => {
    const originalPrice = 150000;
    const originalNotaryFees = 18750;
    const originalConstructionCost = 0;
    const totalAcquisition = originalPrice + originalNotaryFees + originalConstructionCost;

    const formulaParams: PortageFormulaParams = {
      indexationRate: 2,
      carryingCostRecovery: 100,
      averageInterestRate: 4.5
    };

    const carryingCosts: CarryingCosts = {
      monthlyInterest: 300,
      monthlyTax: 30,
      monthlyInsurance: 150,
      totalMonthly: 480,
      totalForPeriod: 11520
    };

    const result = calculateResalePrice(
      originalPrice,
      originalNotaryFees,
      originalConstructionCost,
      2,
      formulaParams,
      carryingCosts,
      10000
    );

    expect(result.breakdown).toBeDefined();
    expect(result.breakdown.base).toBe(totalAcquisition);
    expect(result.breakdown.fees).toBe(0); // No separate fee recovery in new logic
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

  it('should redistribute to founders + one newcomer', () => {
    // Scenario: 2 founders at T0, 1 newcomer joins at T+1
    // Founders: A (112m²), B (134m²)
    // Newcomer: N (50m²)
    // Total building: 296m²
    // Copro sells hidden lot for 100k at T+2
    const participants = [
      { name: 'Founder A', surface: 112 },
      { name: 'Founder B', surface: 134 },
      { name: 'Newcomer N', surface: 50 }
    ];

    const totalBuildingSurface = 296;
    const saleProceeds = 100000;

    const result = calculateRedistribution(saleProceeds, participants, totalBuildingSurface);

    expect(result).toHaveLength(3);

    // Founder A: (112/296) × 100k
    const founderA = result.find(r => r.participantName === 'Founder A')!;
    expect(founderA.quotite).toBeCloseTo(112/296, 4);
    expect(founderA.amount).toBeCloseTo(100000 * (112/296), 0);

    // Founder B: (134/296) × 100k
    const founderB = result.find(r => r.participantName === 'Founder B')!;
    expect(founderB.quotite).toBeCloseTo(134/296, 4);
    expect(founderB.amount).toBeCloseTo(100000 * (134/296), 0);

    // Newcomer N: (50/296) × 100k
    const newcomerN = result.find(r => r.participantName === 'Newcomer N')!;
    expect(newcomerN.quotite).toBeCloseTo(50/296, 4);
    expect(newcomerN.amount).toBeCloseTo(100000 * (50/296), 0);

    // Verify sum equals sale proceeds
    const total = result.reduce((sum, r) => sum + r.amount, 0);
    expect(total).toBeCloseTo(saleProceeds, 0);
  });

  it('should redistribute to founders + multiple newcomers', () => {
    // Scenario: 2 founders + 2 newcomers
    // Founders: A (112m²), B (134m²)
    // Newcomers: N1 (50m²), N2 (75m²)
    // Total building: 371m²
    // Copro sells hidden lot for 150k
    const participants = [
      { name: 'Founder A', surface: 112 },
      { name: 'Founder B', surface: 134 },
      { name: 'Newcomer 1', surface: 50 },
      { name: 'Newcomer 2', surface: 75 }
    ];

    const totalBuildingSurface = 371;
    const saleProceeds = 150000;

    const result = calculateRedistribution(saleProceeds, participants, totalBuildingSurface);

    expect(result).toHaveLength(4);

    // Founder A: (112/371) × 150k
    expect(result.find(r => r.participantName === 'Founder A')?.amount).toBeCloseTo(150000 * (112/371), 0);

    // Founder B: (134/371) × 150k
    expect(result.find(r => r.participantName === 'Founder B')?.amount).toBeCloseTo(150000 * (134/371), 0);

    // Newcomer 1: (50/371) × 150k
    expect(result.find(r => r.participantName === 'Newcomer 1')?.amount).toBeCloseTo(150000 * (50/371), 0);

    // Newcomer 2: (75/371) × 150k
    expect(result.find(r => r.participantName === 'Newcomer 2')?.amount).toBeCloseTo(150000 * (75/371), 0);

    // Verify sum equals sale proceeds
    const total = result.reduce((sum, r) => sum + r.amount, 0);
    expect(total).toBeCloseTo(saleProceeds, 0);
  });

  it('should handle backward compatibility (founders only)', () => {
    // Scenario: Only founders, no newcomers yet
    // This tests backward compatibility with original behavior
    const participants = [
      { name: 'Founder A', surface: 112 },
      { name: 'Founder B', surface: 134 }
    ];

    const totalBuildingSurface = 246;
    const saleProceeds = 100000;

    const result = calculateRedistribution(saleProceeds, participants, totalBuildingSurface);

    expect(result).toHaveLength(2);

    // Founder A: (112/246) × 100k
    expect(result.find(r => r.participantName === 'Founder A')?.amount).toBeCloseTo(100000 * (112/246), 0);

    // Founder B: (134/246) × 100k
    expect(result.find(r => r.participantName === 'Founder B')?.amount).toBeCloseTo(100000 * (134/246), 0);

    // Verify sum equals sale proceeds
    const total = result.reduce((sum, r) => sum + r.amount, 0);
    expect(total).toBeCloseTo(saleProceeds, 0);
  });
});

describe('calculatePortageLotPrice', () => {
  it('should calculate price for lot from founder with imposed surface', () => {
    // Founder allocated 50m² for portage at deed date
    // Original acquisition cost breakdown:
    // - Purchase price: 50m² × 1377€/m² = 68,850€
    // - Notary fees: 8,606.25€ (12.5%)
    // - Construction: 50,000€ (CASCO + parachevements + travaux communs share)
    // Total acquisition: 127,456.25€
    // Held for 2 years with 2% indexation
    // Carrying costs: calculated based on lot value and loan

    const originalPrice = 68850;
    const originalNotaryFees = 8606.25;
    const originalConstructionCost = 50000;
    const totalAcquisitionCost = originalPrice + originalNotaryFees + originalConstructionCost;

    const carryingCosts: CarryingCosts = {
      monthlyInterest: 200,
      monthlyTax: 32.37,
      monthlyInsurance: 166.67,
      totalMonthly: 399.04,
      totalForPeriod: 9577 // 24 months
    };

    const formulaParams: PortageFormulaParams = {
      indexationRate: 2,
      carryingCostRecovery: 100,
      averageInterestRate: 4.5
    };

    const result = calculatePortageLotPrice(
      originalPrice,
      originalNotaryFees,
      originalConstructionCost,
      2,        // years held
      formulaParams,
      carryingCosts,
      0         // no renovations
    );

    // Expected: base acquisition cost (purchase + notary + construction) + indexation + carrying
    expect(result.basePrice).toBe(totalAcquisitionCost);
    expect(result.surfaceImposed).toBe(true);
    expect(result.totalPrice).toBeGreaterThan(totalAcquisitionCost);

    // Verify indexation is applied to total acquisition cost
    const expectedIndexation = totalAcquisitionCost * (Math.pow(1.02, 2) - 1);
    expect(result.indexation).toBeCloseTo(expectedIndexation, 2);
  });

  it('should calculate price for lot from copropriété with free surface', () => {
    // Newcomer chooses 75m² from copropriété lot
    // Base calculation: 75m² × indexed price/m²
    // Plus portage costs proportional to surface ratio

    const formulaParams: PortageFormulaParams = {
      indexationRate: 2,
      carryingCostRecovery: 100,
      averageInterestRate: 4.5
    };

    const result = calculatePortageLotPriceFromCopro(
      75,        // surface chosen by newcomer
      300,       // total copro lot surface
      412500,    // total copro lot original price
      2,         // years held
      formulaParams,
      15000      // total carrying costs for whole copro lot
    );

    // Expected: proportional base + indexation + carrying
    const expectedBase = 412500 * (75 / 300); // 103,125
    expect(result.basePrice).toBeCloseTo(expectedBase, 0);
    expect(result.surfaceImposed).toBe(false);
    expect(result.totalPrice).toBeGreaterThan(expectedBase);
  });
});

describe('calculateResalePrice with formula params', () => {
  it('should use custom indexation rate from formula params', () => {
    const customFormula: PortageFormulaParams = {
      indexationRate: 3.0, // Custom rate
      carryingCostRecovery: 100,
      averageInterestRate: 4.5
    };

    const carryingCosts = calculateCarryingCosts(60000, 0, 30, 4.5);
    const result = calculateResalePrice(
      60000,
      7500,
      0,
      2.5,
      customFormula,
      carryingCosts,
      0
    );

    // With 3% indexation over 2.5 years on total acquisition cost
    const totalAcquisition = 60000 + 7500 + 0; // 67,500
    const expectedIndexation = totalAcquisition * (Math.pow(1.03, 2.5) - 1);
    expect(result.indexation).toBeCloseTo(expectedIndexation, 0);
  });
});
