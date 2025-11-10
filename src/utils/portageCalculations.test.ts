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
  calculateYearsHeld,
  calculateCoproEstimatedPrice,
  calculateCoproSalePrice,
  distributeCoproProceeds,
  COPRO_BASE_PRICE_PER_M2,
  COPRO_CARRYING_COST_RATE,
  type CarryingCosts,
  // ResalePrice, Redistribution - unused type imports removed
} from './portageCalculations';
import type { PortageFormulaParams } from './portageCalculations';

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

describe('calculateYearsHeld', () => {
  it('should calculate years held between two dates', () => {
    const founderEntry = new Date('2020-01-01');
    const buyerEntry = new Date('2022-01-01');

    const result = calculateYearsHeld(founderEntry, buyerEntry);

    // Exactly 2 years
    expect(result).toBeCloseTo(2.0, 2);
  });

  it('should handle fractional years correctly', () => {
    const founderEntry = new Date('2020-01-01');
    const buyerEntry = new Date('2021-07-01');

    const result = calculateYearsHeld(founderEntry, buyerEntry);

    // Approximately 1.5 years (6 months = 0.5 years)
    expect(result).toBeCloseTo(1.5, 1);
  });

  it('should handle same date (zero years)', () => {
    const sameDate = new Date('2020-01-01');

    const result = calculateYearsHeld(sameDate, sameDate);

    expect(result).toBe(0);
  });

  it('should handle dates very close together', () => {
    const founderEntry = new Date('2020-01-01');
    const buyerEntry = new Date('2020-01-02'); // 1 day later

    const result = calculateYearsHeld(founderEntry, buyerEntry);

    // Should be very small but positive
    expect(result).toBeGreaterThan(0);
    expect(result).toBeLessThan(0.01); // Less than 1% of a year
  });

  it('should handle leap years correctly', () => {
    const founderEntry = new Date('2020-02-29'); // Leap year
    const buyerEntry = new Date('2021-02-28');

    const result = calculateYearsHeld(founderEntry, buyerEntry);

    // Should be approximately 1 year (using 365.25 days/year average)
    expect(result).toBeCloseTo(1.0, 2);
  });

  it('should return 0 if buyer entry is before founder entry', () => {
    const founderEntry = new Date('2022-01-01');
    const buyerEntry = new Date('2020-01-01');

    const result = calculateYearsHeld(founderEntry, buyerEntry);

    // Should clamp to 0 (no negative time)
    expect(result).toBe(0);
  });

  it('should match real-world scenario from AvailableLotsView', () => {
    // This test ensures backward compatibility with the original calculation
    const deedDate = new Date('2020-06-15');
    const buyerEntryDate = new Date('2022-09-15');

    const result = calculateYearsHeld(deedDate, buyerEntryDate);

    // Approximately 2.25 years (2 years + 3 months)
    expect(result).toBeCloseTo(2.25, 1);
  });
});

describe('calculateCoproEstimatedPrice', () => {
  const formulaParams: PortageFormulaParams = {
    indexationRate: 2,
    carryingCostRecovery: 100,
    averageInterestRate: 4.5
  };

  it('should return null for zero surface', () => {
    const result = calculateCoproEstimatedPrice(
      0,
      300,
      2.5,
      formulaParams
    );

    expect(result).toBeNull();
  });

  it('should return null for negative surface', () => {
    const result = calculateCoproEstimatedPrice(
      -50,
      300,
      2.5,
      formulaParams
    );

    expect(result).toBeNull();
  });

  it('should return null if chosen surface exceeds available surface', () => {
    const result = calculateCoproEstimatedPrice(
      350,
      300, // max available
      2.5,
      formulaParams
    );

    expect(result).toBeNull();
  });

  it('should calculate price using default constants', () => {
    // Choose 100m² from 300m² available, held for 2 years
    const result = calculateCoproEstimatedPrice(
      100,
      300,
      2,
      formulaParams
    );

    expect(result).not.toBeNull();
    expect(result!.surfaceImposed).toBe(false);
    // Surface ratio = 100/300 = 1/3
    // Should use constants: 1377€/m² and 5% carrying cost rate
    expect(result!.totalPrice).toBeGreaterThan(0);
  });

  it('should calculate proportional price for partial surface', () => {
    // Choose 75m² from 300m² available (25%)
    const result = calculateCoproEstimatedPrice(
      75,
      300,
      2,
      formulaParams
    );

    expect(result).not.toBeNull();

    // Base should be 25% of total
    const totalEstimated = 300 * COPRO_BASE_PRICE_PER_M2;
    const expectedBase = totalEstimated * (75 / 300);
    expect(result!.basePrice).toBeCloseTo(expectedBase, 0);
  });

  it('should handle fractional years correctly', () => {
    const result = calculateCoproEstimatedPrice(
      100,
      300,
      2.5, // 2.5 years
      formulaParams
    );

    expect(result).not.toBeNull();
    // Carrying costs should scale with years
    expect(result!.carryingCostRecovery).toBeGreaterThan(0);
  });

  it('should use custom formula params', () => {
    const customParams: PortageFormulaParams = {
      indexationRate: 3.0, // Higher indexation
      carryingCostRecovery: 50, // Only recover 50%
      averageInterestRate: 5.0
    };

    const result = calculateCoproEstimatedPrice(
      100,
      300,
      2,
      customParams
    );

    expect(result).not.toBeNull();
    // With 3% indexation, should have higher indexation component
    expect(result!.indexation).toBeGreaterThan(0);
  });

  it('should match AvailableLotsView calculation logic', () => {
    // This test ensures backward compatibility with the component logic
    const lotSurface = 200;
    const surfaceChosen = 75;
    const yearsHeld = 2.0;

    const result = calculateCoproEstimatedPrice(
      surfaceChosen,
      lotSurface,
      yearsHeld,
      formulaParams
    );

    expect(result).not.toBeNull();

    // Original logic:
    // estimatedOriginalPrice = 200 * 1377 = 275,400€
    // estimatedCarryingCosts = 275,400 * 0.05 * 2 = 27,540€
    const estimatedOriginalPrice = lotSurface * COPRO_BASE_PRICE_PER_M2;
    const estimatedCarryingCosts = estimatedOriginalPrice * COPRO_CARRYING_COST_RATE * yearsHeld;

    // Then calls calculatePortageLotPriceFromCopro
    const expected = calculatePortageLotPriceFromCopro(
      surfaceChosen,
      lotSurface,
      estimatedOriginalPrice,
      yearsHeld,
      formulaParams,
      estimatedCarryingCosts
    );

    expect(result!.totalPrice).toBeCloseTo(expected.totalPrice, 0);
    expect(result!.basePrice).toBeCloseTo(expected.basePrice, 0);
    expect(result!.indexation).toBeCloseTo(expected.indexation, 0);
  });

  it('should handle edge case of exactly available surface', () => {
    const result = calculateCoproEstimatedPrice(
      300,
      300, // exactly all available
      2,
      formulaParams
    );

    expect(result).not.toBeNull();
    expect(result!.surfaceImposed).toBe(false);
  });
});

// ============================================
// Copropriété Sale Price Tests
// ============================================

describe('calculateCoproSalePrice', () => {
  const formulaParams: PortageFormulaParams = {
    indexationRate: 2, // 2% per year
    carryingCostRecovery: 100 // 100% recovery
  };

  it('should calculate price using proportional project cost as base', () => {
    // Project: 500,000€ total cost, 500m² building
    // Buyer purchases 50m² (10% of building)
    // Expected base: 50,000€
    const totalProjectCost = 500000;
    const totalBuildingSurface = 500;
    const surfacePurchased = 50;
    const yearsHeld = 0;
    const totalCarryingCosts = 0;

    const result = calculateCoproSalePrice(
      surfacePurchased,
      totalProjectCost,
      totalBuildingSurface,
      yearsHeld,
      formulaParams,
      totalCarryingCosts
    );

    expect(result.basePrice).toBeCloseTo(50000, 0);
  });

  it('should apply indexation correctly using compound growth', () => {
    // Base: 100,000€, 2 years at 2%/year
    // Expected indexation: 100,000 × [(1.02)^2 - 1] = 4,040€
    const totalProjectCost = 500000;
    const totalBuildingSurface = 500;
    const surfacePurchased = 100; // 100,000€ base
    const yearsHeld = 2;
    const totalCarryingCosts = 0;

    const result = calculateCoproSalePrice(
      surfacePurchased,
      totalProjectCost,
      totalBuildingSurface,
      yearsHeld,
      formulaParams,
      totalCarryingCosts
    );

    // Indexation should be ~4,040€
    expect(result.indexation).toBeCloseTo(4040, 0);
  });

  it('should calculate carrying cost recovery proportionally', () => {
    // Total carrying costs: 10,000€
    // Surface purchased: 50m² out of 500m² (10%)
    // Expected recovery: 10,000 × 0.1 × 100% = 1,000€
    const totalProjectCost = 500000;
    const totalBuildingSurface = 500;
    const surfacePurchased = 50;
    const yearsHeld = 2;
    const totalCarryingCosts = 10000;

    const result = calculateCoproSalePrice(
      surfacePurchased,
      totalProjectCost,
      totalBuildingSurface,
      yearsHeld,
      formulaParams,
      totalCarryingCosts
    );

    expect(result.carryingCostRecovery).toBeCloseTo(1000, 0);
  });

  it('should respect carrying cost recovery percentage', () => {
    // With 60% recovery instead of 100%
    const customParams: PortageFormulaParams = {
      indexationRate: 2,
      carryingCostRecovery: 60
    };

    const totalProjectCost = 500000;
    const totalBuildingSurface = 500;
    const surfacePurchased = 50;
    const yearsHeld = 2;
    const totalCarryingCosts = 10000;

    const result = calculateCoproSalePrice(
      surfacePurchased,
      totalProjectCost,
      totalBuildingSurface,
      yearsHeld,
      customParams,
      totalCarryingCosts
    );

    // Expected: 10,000 × 0.1 × 0.6 = 600€
    expect(result.carryingCostRecovery).toBeCloseTo(600, 0);
  });

  it('should calculate total price correctly', () => {
    // Base: 50,000€, Indexation: ~2,020€, Carrying: 1,000€
    const totalProjectCost = 500000;
    const totalBuildingSurface = 500;
    const surfacePurchased = 50;
    const yearsHeld = 2;
    const totalCarryingCosts = 10000;

    const result = calculateCoproSalePrice(
      surfacePurchased,
      totalProjectCost,
      totalBuildingSurface,
      yearsHeld,
      formulaParams,
      totalCarryingCosts
    );

    const expectedTotal = result.basePrice + result.indexation + result.carryingCostRecovery;
    expect(result.totalPrice).toBeCloseTo(expectedTotal, 0);
  });

  it('should calculate price per m² correctly', () => {
    const totalProjectCost = 500000;
    const totalBuildingSurface = 500;
    const surfacePurchased = 50;
    const yearsHeld = 2;
    const totalCarryingCosts = 10000;

    const result = calculateCoproSalePrice(
      surfacePurchased,
      totalProjectCost,
      totalBuildingSurface,
      yearsHeld,
      formulaParams,
      totalCarryingCosts
    );

    const expectedPricePerM2 = result.totalPrice / surfacePurchased;
    expect(result.pricePerM2).toBeCloseTo(expectedPricePerM2, 2);
  });

  it('should distribute 30% to copro reserves and 70% to participants', () => {
    const totalProjectCost = 500000;
    const totalBuildingSurface = 500;
    const surfacePurchased = 50;
    const yearsHeld = 2;
    const totalCarryingCosts = 10000;

    const result = calculateCoproSalePrice(
      surfacePurchased,
      totalProjectCost,
      totalBuildingSurface,
      yearsHeld,
      formulaParams,
      totalCarryingCosts
    );

    expect(result.distribution.toCoproReserves).toBeCloseTo(result.totalPrice * 0.30, 0);
    expect(result.distribution.toParticipants).toBeCloseTo(result.totalPrice * 0.70, 0);
  });

  it('should match portage formula structure (base + indexation + carrying)', () => {
    // This test verifies the formula matches portage pricing structure
    const totalProjectCost = 500000;
    const totalBuildingSurface = 500;
    const surfacePurchased = 50;
    const yearsHeld = 2;
    const totalCarryingCosts = 10000;

    const result = calculateCoproSalePrice(
      surfacePurchased,
      totalProjectCost,
      totalBuildingSurface,
      yearsHeld,
      formulaParams,
      totalCarryingCosts
    );

    // Verify structure
    expect(result).toHaveProperty('basePrice');
    expect(result).toHaveProperty('indexation');
    expect(result).toHaveProperty('carryingCostRecovery');
    expect(result).toHaveProperty('totalPrice');
    expect(result).toHaveProperty('pricePerM2');
    expect(result).toHaveProperty('distribution');

    // Verify formula: total = base + indexation + carrying
    const calculatedTotal = result.basePrice + result.indexation + result.carryingCostRecovery;
    expect(result.totalPrice).toBeCloseTo(calculatedTotal, 0);
  });

  it('should throw error for zero building surface', () => {
    expect(() => {
      calculateCoproSalePrice(
        50,
        500000,
        0, // Invalid
        2,
        formulaParams,
        10000
      );
    }).toThrow('Total building surface must be greater than zero');
  });

  it('should throw error for negative surface purchased', () => {
    expect(() => {
      calculateCoproSalePrice(
        -10, // Invalid
        500000,
        500,
        2,
        formulaParams,
        10000
      );
    }).toThrow('Invalid surface purchased');
  });

  it('should throw error when surface purchased exceeds building surface', () => {
    expect(() => {
      calculateCoproSalePrice(
        600, // Exceeds 500m²
        500000,
        500,
        2,
        formulaParams,
        10000
      );
    }).toThrow('Invalid surface purchased');
  });

  it('should handle zero carrying costs', () => {
    const result = calculateCoproSalePrice(
      50,
      500000,
      500,
      2,
      formulaParams,
      0 // No carrying costs
    );

    expect(result.carryingCostRecovery).toBe(0);
    expect(result.totalPrice).toBeCloseTo(result.basePrice + result.indexation, 0);
  });

  it('should handle zero years held', () => {
    const result = calculateCoproSalePrice(
      50,
      500000,
      500,
      0, // No time passed
      formulaParams,
      10000
    );

    expect(result.indexation).toBe(0);
  });
});

// ============================================
// Copropriété Proceeds Distribution Tests
// ============================================

describe('distributeCoproProceeds', () => {
  it('should distribute to single founder (100%)', () => {
    const totalAmount = 70000;
    const founders = [
      { name: 'Alice', surface: 100 }
    ];
    const totalBuildingSurface = 100;

    const distribution = distributeCoproProceeds(
      totalAmount,
      founders,
      totalBuildingSurface
    );

    expect(distribution.size).toBe(1);
    expect(distribution.get('Alice')).toBeCloseTo(70000, 0);
  });

  it('should distribute equally with equal quotités', () => {
    const totalAmount = 70000;
    const founders = [
      { name: 'Alice', surface: 100 },
      { name: 'Bob', surface: 100 }
    ];
    const totalBuildingSurface = 200;

    const distribution = distributeCoproProceeds(
      totalAmount,
      founders,
      totalBuildingSurface
    );

    expect(distribution.size).toBe(2);
    expect(distribution.get('Alice')).toBeCloseTo(35000, 0); // 50%
    expect(distribution.get('Bob')).toBeCloseTo(35000, 0);   // 50%
  });

  it('should distribute proportionally with unequal quotités', () => {
    const totalAmount = 70000;
    const founders = [
      { name: 'Alice', surface: 40 },  // 40% quotité
      { name: 'Bob', surface: 30 },    // 30% quotité
      { name: 'Carol', surface: 30 }   // 30% quotité
    ];
    const totalBuildingSurface = 100;

    const distribution = distributeCoproProceeds(
      totalAmount,
      founders,
      totalBuildingSurface
    );

    expect(distribution.size).toBe(3);
    expect(distribution.get('Alice')).toBeCloseTo(28000, 0); // 40%
    expect(distribution.get('Bob')).toBeCloseTo(21000, 0);   // 30%
    expect(distribution.get('Carol')).toBeCloseTo(21000, 0); // 30%
  });

  it('should sum to total amount (no rounding errors)', () => {
    const totalAmount = 70000;
    const founders = [
      { name: 'Alice', surface: 40 },
      { name: 'Bob', surface: 30 },
      { name: 'Carol', surface: 30 }
    ];
    const totalBuildingSurface = 100;

    const distribution = distributeCoproProceeds(
      totalAmount,
      founders,
      totalBuildingSurface
    );

    const sum = Array.from(distribution.values()).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(totalAmount, 0);
  });

  it('should use frozen T0 quotité (founder surface / total building)', () => {
    // This test verifies the quotité formula
    const totalAmount = 70000;
    const founders = [
      { name: 'Alice', surface: 150 },
      { name: 'Bob', surface: 350 }
    ];
    const totalBuildingSurface = 500;

    const distribution = distributeCoproProceeds(
      totalAmount,
      founders,
      totalBuildingSurface
    );

    // Alice quotité: 150/500 = 30%
    // Bob quotité: 350/500 = 70%
    expect(distribution.get('Alice')).toBeCloseTo(21000, 0); // 30% of 70k
    expect(distribution.get('Bob')).toBeCloseTo(49000, 0);   // 70% of 70k
  });

  it('should throw error for zero building surface', () => {
    expect(() => {
      distributeCoproProceeds(
        70000,
        [{ name: 'Alice', surface: 100 }],
        0 // Invalid
      );
    }).toThrow('Total building surface must be greater than zero');
  });

  it('should handle multiple founders with precise quotités', () => {
    const totalAmount = 100000;
    const founders = [
      { name: 'Alice', surface: 25 },
      { name: 'Bob', surface: 25 },
      { name: 'Carol', surface: 25 },
      { name: 'Dave', surface: 25 }
    ];
    const totalBuildingSurface = 100;

    const distribution = distributeCoproProceeds(
      totalAmount,
      founders,
      totalBuildingSurface
    );

    expect(distribution.size).toBe(4);
    distribution.forEach((amount) => {
      expect(amount).toBeCloseTo(25000, 0); // Each gets 25%
    });
  });

  it('should handle large amounts without precision loss', () => {
    const totalAmount = 1000000; // 1M€
    const founders = [
      { name: 'Alice', surface: 100 },
      { name: 'Bob', surface: 100 }
    ];
    const totalBuildingSurface = 200;

    const distribution = distributeCoproProceeds(
      totalAmount,
      founders,
      totalBuildingSurface
    );

    expect(distribution.get('Alice')).toBeCloseTo(500000, 0);
    expect(distribution.get('Bob')).toBeCloseTo(500000, 0);
  });
});
