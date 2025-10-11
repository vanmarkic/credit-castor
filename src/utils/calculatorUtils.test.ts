import { describe, it, expect } from 'vitest';
import {
  calculatePricePerM2,
  calculateTotalSurface,
  calculateSharedCosts,
  calculateTotalTravauxCommuns,
  calculateTravauxCommunsPerUnit,
  calculatePurchaseShare,
  calculateNotaryFees,
  calculateCascoAndParachevements,
  calculateConstructionCost,
  calculateLoanAmount,
  calculateMonthlyPayment,
  calculateTotalInterest,
  calculateFinancingRatio,
  calculateFraisGeneraux3ans,
  calculateAll,
  type Participant,
  type ProjectParams,
  type Scenario,
  type UnitDetails,
} from './calculatorUtils';

describe('Calculator Utils', () => {
  describe('calculatePricePerM2', () => {
    it('should calculate price per m2 without reduction', () => {
      const result = calculatePricePerM2(650000, 472, 0);
      expect(result).toBeCloseTo(1377.12, 2);
    });

    it('should calculate price per m2 with 10% reduction', () => {
      const result = calculatePricePerM2(650000, 472, 10);
      expect(result).toBeCloseTo(1239.41, 2);
    });

    it('should calculate price per m2 with 20% reduction', () => {
      const result = calculatePricePerM2(650000, 472, 20);
      expect(result).toBeCloseTo(1101.69, 2);
    });
  });

  describe('calculateTotalSurface', () => {
    it('should sum up all participant surfaces', () => {
      const participants: Participant[] = [
        { name: 'A', surface: 112, capitalApporte: 50000, notaryFeesRate: 12.5, unitId: 1, interestRate: 4.5, durationYears: 25, quantity: 1 },
        { name: 'B', surface: 134, capitalApporte: 170000, notaryFeesRate: 12.5, unitId: 3, interestRate: 4.5, durationYears: 25, quantity: 1 },
        { name: 'C', surface: 118, capitalApporte: 200000, notaryFeesRate: 12.5, unitId: 5, interestRate: 4.5, durationYears: 25, quantity: 1 },
        { name: 'D', surface: 108, capitalApporte: 70000, notaryFeesRate: 12.5, unitId: 6, interestRate: 4.5, durationYears: 25, quantity: 1 },
      ];
      const result = calculateTotalSurface(participants);
      expect(result).toBe(472);
    });

    it('should handle single participant', () => {
      const participants: Participant[] = [
        { name: 'A', surface: 100, capitalApporte: 50000, notaryFeesRate: 12.5, unitId: 1, interestRate: 4.5, durationYears: 25, quantity: 1 },
      ];
      const result = calculateTotalSurface(participants);
      expect(result).toBe(100);
    });
  });

  describe('calculateFraisGeneraux3ans', () => {
    const unitDetails: UnitDetails = {
      1: { casco: 178080, parachevements: 56000 },
      3: { casco: 213060, parachevements: 67000 },
      5: { casco: 187620, parachevements: 59000 },
      6: { casco: 171720, parachevements: 54000 },
    };

    const projectParams: ProjectParams = {
      totalPurchase: 650000,
      mesuresConservatoires: 20000,
      demolition: 40000,
      infrastructures: 90000,
      etudesPreparatoires: 59820,
      fraisEtudesPreparatoires: 27320,
      fraisGeneraux3ans: 0, // Not used when calculating dynamically
      fraisGenerauxRate: 10.1,
      batimentFondationConservatoire: 43700,
      batimentFondationComplete: 269200,
      batimentCoproConservatoire: 56000,
    };

    it('should calculate frais généraux as 10.1% of total construction costs by default', () => {
      const participants: Participant[] = [
        { name: 'A', surface: 112, capitalApporte: 50000, notaryFeesRate: 12.5, unitId: 1, interestRate: 4.5, durationYears: 25, quantity: 1 },
        { name: 'B', surface: 134, capitalApporte: 170000, notaryFeesRate: 12.5, unitId: 3, interestRate: 4.5, durationYears: 25, quantity: 1 },
        { name: 'C', surface: 118, capitalApporte: 200000, notaryFeesRate: 12.5, unitId: 5, interestRate: 4.5, durationYears: 25, quantity: 1 },
        { name: 'D', surface: 108, capitalApporte: 70000, notaryFeesRate: 12.5, unitId: 6, interestRate: 4.5, durationYears: 25, quantity: 1 },
      ];

      // Total construction = (178080+56000) + (213060+67000) + (187620+59000) + (171720+54000) + (43700+269200+56000)
      // = 234080 + 280060 + 246620 + 225720 + 368900 = 1,355,380
      // 10.1% of 1,355,380 = 136,893.38
      const result = calculateFraisGeneraux3ans(participants, projectParams, unitDetails);
      expect(result).toBeCloseTo(136893.38, 2);
    });

    it('should calculate frais généraux with custom rate', () => {
      const participants: Participant[] = [
        { name: 'A', surface: 112, capitalApporte: 50000, notaryFeesRate: 12.5, unitId: 1, interestRate: 4.5, durationYears: 25, quantity: 1 },
        { name: 'B', surface: 134, capitalApporte: 170000, notaryFeesRate: 12.5, unitId: 3, interestRate: 4.5, durationYears: 25, quantity: 1 },
      ];

      const customParams = {
        ...projectParams,
        fraisGenerauxRate: 15,
      };

      const unitDetailsSubset: UnitDetails = {
        1: { casco: 178080, parachevements: 56000 },
        3: { casco: 213060, parachevements: 67000 },
      };

      // Total construction = 234080 + 280060 + 368900 = 883,040
      // 15% of 883,040 = 132,456
      const result = calculateFraisGeneraux3ans(participants, customParams, unitDetailsSubset);
      expect(result).toBeCloseTo(132456, 2);
    });

    it('should handle single participant', () => {
      const participants: Participant[] = [
        { name: 'A', surface: 112, capitalApporte: 50000, notaryFeesRate: 12.5, unitId: 1, interestRate: 4.5, durationYears: 25, quantity: 1 },
      ];

      const singleUnitDetails: UnitDetails = {
        1: { casco: 178080, parachevements: 56000 },
      };

      // Total construction = 234080 + 368900 = 602,980
      // 10.1% of 602,980 = 60,901.0
      const result = calculateFraisGeneraux3ans(participants, projectParams, singleUnitDetails);
      expect(result).toBeCloseTo(60900.98, 2);
    });

    it('should use default rate if not specified', () => {
      const participants: Participant[] = [
        { name: 'A', surface: 112, capitalApporte: 50000, notaryFeesRate: 12.5, unitId: 1, interestRate: 4.5, durationYears: 25, quantity: 1 },
      ];

      const paramsNoRate = {
        ...projectParams,
        fraisGenerauxRate: undefined,
      };

      const singleUnitDetails: UnitDetails = {
        1: { casco: 178080, parachevements: 56000 },
      };

      // Should default to 10.1%
      // Total construction = 602,980
      // 10.1% = 60,900.98
      const result = calculateFraisGeneraux3ans(participants, paramsNoRate, singleUnitDetails);
      expect(result).toBeCloseTo(60900.98, 2);
    });
  });

  describe('calculateSharedCosts', () => {
    const projectParams: ProjectParams = {
      totalPurchase: 650000,
      mesuresConservatoires: 20000,
      demolition: 40000,
      infrastructures: 90000,
      etudesPreparatoires: 59820,
      fraisEtudesPreparatoires: 27320,
      fraisGeneraux3ans: 136825.63,
      batimentFondationConservatoire: 43700,
      batimentFondationComplete: 269200,
      batimentCoproConservatoire: 56000,
    };

    it('should calculate shared costs without reduction', () => {
      const result = calculateSharedCosts(projectParams, 0);
      expect(result).toBeCloseTo(373965.63, 2);
    });

    it('should calculate shared costs with 20% infrastructure reduction', () => {
      const result = calculateSharedCosts(projectParams, 20);
      // 20000 + 40000 + (90000 * 0.8) + 59820 + 27320 + 136825.63 = 355965.63
      expect(result).toBeCloseTo(355965.63, 2);
    });

    it('should calculate shared costs with 50% infrastructure reduction', () => {
      const result = calculateSharedCosts(projectParams, 50);
      // 20000 + 40000 + (90000 * 0.5) + 59820 + 27320 + 136825.63 = 328965.63
      expect(result).toBeCloseTo(328965.63, 2);
    });
  });

  describe('calculateTotalTravauxCommuns', () => {
    it('should calculate total travaux communs', () => {
      const projectParams: ProjectParams = {
        totalPurchase: 650000,
        mesuresConservatoires: 20000,
        demolition: 40000,
        infrastructures: 90000,
        etudesPreparatoires: 59820,
        fraisEtudesPreparatoires: 27320,
        fraisGeneraux3ans: 136825.63,
        batimentFondationConservatoire: 43700,
        batimentFondationComplete: 269200,
        batimentCoproConservatoire: 56000,
      };
      const result = calculateTotalTravauxCommuns(projectParams);
      expect(result).toBe(368900);
    });
  });

  describe('calculateTravauxCommunsPerUnit', () => {
    it('should divide travaux communs by number of participants', () => {
      const projectParams: ProjectParams = {
        totalPurchase: 650000,
        mesuresConservatoires: 20000,
        demolition: 40000,
        infrastructures: 90000,
        etudesPreparatoires: 59820,
        fraisEtudesPreparatoires: 27320,
        fraisGeneraux3ans: 136825.63,
        batimentFondationConservatoire: 43700,
        batimentFondationComplete: 269200,
        batimentCoproConservatoire: 56000,
      };
      const result = calculateTravauxCommunsPerUnit(projectParams, 4);
      expect(result).toBe(92225);
    });

    it('should handle different participant counts', () => {
      const projectParams: ProjectParams = {
        totalPurchase: 650000,
        mesuresConservatoires: 20000,
        demolition: 40000,
        infrastructures: 90000,
        etudesPreparatoires: 59820,
        fraisEtudesPreparatoires: 27320,
        fraisGeneraux3ans: 136825.63,
        batimentFondationConservatoire: 43700,
        batimentFondationComplete: 269200,
        batimentCoproConservatoire: 56000,
      };
      const result = calculateTravauxCommunsPerUnit(projectParams, 3);
      expect(result).toBeCloseTo(122966.67, 2);
    });
  });

  describe('calculatePurchaseShare', () => {
    it('should calculate purchase share for single unit', () => {
      const result = calculatePurchaseShare(112, 1377.12, 1);
      expect(result).toBeCloseTo(154237.44, 2);
    });

    it('should calculate purchase share for multiple units', () => {
      const result = calculatePurchaseShare(112, 1377.12, 2);
      expect(result).toBeCloseTo(308474.88, 2);
    });
  });

  describe('calculateNotaryFees', () => {
    it('should calculate notary fees at 12.5%', () => {
      const purchaseShare = 154237.44;
      const result = calculateNotaryFees(purchaseShare, 12.5);
      expect(result).toBeCloseTo(19279.68, 2);
    });

    it('should calculate notary fees at different rate', () => {
      const purchaseShare = 154237.44;
      const result = calculateNotaryFees(purchaseShare, 15);
      expect(result).toBeCloseTo(23135.62, 2);
    });
  });

  describe('calculateCascoAndParachevements', () => {
    const unitDetails: UnitDetails = {
      1: { casco: 178080, parachevements: 56000 },
      3: { casco: 213060, parachevements: 67000 },
      5: { casco: 187620, parachevements: 59000 },
      6: { casco: 171720, parachevements: 54000 },
    };

    it('should return predefined values for known unit', () => {
      const result = calculateCascoAndParachevements(1, 112, unitDetails);
      expect(result).toEqual({ casco: 178080, parachevements: 56000 });
    });

    it('should calculate default values for unknown unit', () => {
      const result = calculateCascoAndParachevements(99, 100, unitDetails);
      expect(result).toEqual({ casco: 159000, parachevements: 50000 });
    });

    it('should handle all predefined units', () => {
      expect(calculateCascoAndParachevements(3, 134, unitDetails)).toEqual({ casco: 213060, parachevements: 67000 });
      expect(calculateCascoAndParachevements(5, 118, unitDetails)).toEqual({ casco: 187620, parachevements: 59000 });
      expect(calculateCascoAndParachevements(6, 108, unitDetails)).toEqual({ casco: 171720, parachevements: 54000 });
    });
  });

  describe('calculateConstructionCost', () => {
    it('should calculate construction cost without modification', () => {
      const result = calculateConstructionCost(178080, 56000, 92225, 0, 1);
      expect(result).toBe(326305);
    });

    it('should calculate construction cost with +15% increase', () => {
      const result = calculateConstructionCost(178080, 56000, 92225, 15, 1);
      // (178080 * 1.15) + (56000 * 1.15) + 92225 = 361417
      expect(result).toBeCloseTo(361417, 1);
    });

    it('should calculate construction cost with -20% decrease', () => {
      const result = calculateConstructionCost(178080, 56000, 92225, -20, 1);
      // (178080 * 0.8) + (56000 * 0.8) + 92225 = 279489
      expect(result).toBe(279489);
    });

    it('should multiply by quantity', () => {
      const result = calculateConstructionCost(178080, 56000, 92225, 0, 2);
      expect(result).toBe(652610);
    });
  });

  describe('calculateLoanAmount', () => {
    it('should calculate loan amount', () => {
      const result = calculateLoanAmount(593313.36, 50000);
      expect(result).toBeCloseTo(543313.36, 2);
    });

    it('should return zero when capital covers total cost', () => {
      const result = calculateLoanAmount(50000, 50000);
      expect(result).toBe(0);
    });

    it('should return negative when capital exceeds total cost', () => {
      const result = calculateLoanAmount(50000, 60000);
      expect(result).toBe(-10000);
    });
  });

  describe('calculateMonthlyPayment', () => {
    it('should calculate monthly payment for standard loan', () => {
      const result = calculateMonthlyPayment(543313.36, 4.5, 25);
      expect(result).toBeCloseTo(3019.91, 2);
    });

    it('should return 0 for zero loan amount', () => {
      const result = calculateMonthlyPayment(0, 4.5, 25);
      expect(result).toBe(0);
    });

    it('should return 0 for negative loan amount', () => {
      const result = calculateMonthlyPayment(-10000, 4.5, 25);
      expect(result).toBe(0);
    });

    it('should calculate correctly for different interest rates', () => {
      const result = calculateMonthlyPayment(100000, 5.0, 20);
      expect(result).toBeCloseTo(659.96, 2);
    });

    it('should calculate correctly for different durations', () => {
      const result = calculateMonthlyPayment(100000, 4.5, 15);
      expect(result).toBeCloseTo(764.99, 2);
    });
  });

  describe('calculateTotalInterest', () => {
    it('should calculate total interest paid', () => {
      const monthlyPayment = 3019.91;
      const result = calculateTotalInterest(monthlyPayment, 25, 543313.36);
      // (3019.91 * 25 * 12) - 543313.36 = 362659.64
      expect(result).toBeCloseTo(362659.64, 2);
    });

    it('should handle zero monthly payment', () => {
      const result = calculateTotalInterest(0, 25, 0);
      expect(result).toBe(0);
    });
  });

  describe('calculateFinancingRatio', () => {
    it('should calculate financing ratio', () => {
      const result = calculateFinancingRatio(543313.36, 593313.36);
      expect(result).toBeCloseTo(91.57, 2);
    });

    it('should return 0 when no loan needed', () => {
      const result = calculateFinancingRatio(0, 100000);
      expect(result).toBe(0);
    });

    it('should return 100 when fully financed', () => {
      const result = calculateFinancingRatio(100000, 100000);
      expect(result).toBe(100);
    });
  });

  describe('calculateAll - Integration', () => {
    it('should calculate all values correctly for default scenario', () => {
      const participants: Participant[] = [
        { name: 'Manuela/Dragan', capitalApporte: 50000, notaryFeesRate: 12.5, unitId: 1, surface: 112, interestRate: 4.5, durationYears: 25, quantity: 1 },
        { name: 'Cathy/Jim', capitalApporte: 170000, notaryFeesRate: 12.5, unitId: 3, surface: 134, interestRate: 4.5, durationYears: 25, quantity: 1 },
        { name: 'Annabelle/Colin', capitalApporte: 200000, notaryFeesRate: 12.5, unitId: 5, surface: 118, interestRate: 4.5, durationYears: 25, quantity: 1 },
        { name: 'Julie/Séverin', capitalApporte: 70000, notaryFeesRate: 12.5, unitId: 6, surface: 108, interestRate: 4.5, durationYears: 25, quantity: 1 },
      ];

      const projectParams: ProjectParams = {
        totalPurchase: 650000,
        mesuresConservatoires: 20000,
        demolition: 40000,
        infrastructures: 90000,
        etudesPreparatoires: 59820,
        fraisEtudesPreparatoires: 27320,
        fraisGeneraux3ans: 136825.63,
        batimentFondationConservatoire: 43700,
        batimentFondationComplete: 269200,
        batimentCoproConservatoire: 56000,
      };

      const scenario: Scenario = {
        constructionCostChange: 0,
        infrastructureReduction: 0,
        purchasePriceReduction: 0,
      };

      const unitDetails: UnitDetails = {
        1: { casco: 178080, parachevements: 56000 },
        3: { casco: 213060, parachevements: 67000 },
        5: { casco: 187620, parachevements: 59000 },
        6: { casco: 171720, parachevements: 54000 },
      };

      const results = calculateAll(participants, projectParams, scenario, unitDetails);

      // Verify totals
      expect(results.totalSurface).toBe(472);
      expect(results.pricePerM2).toBeCloseTo(1377.12, 2);
      // Dynamic fraisGeneraux3ans = 10.1% of 1,355,380 = 136,893.38 (instead of static 136,825.63)
      // New shared costs = 20000 + 40000 + 90000 + 59820 + 27320 + 136893.38 = 374,033.38
      expect(results.sharedCosts).toBeCloseTo(374033.38, 2);
      expect(results.sharedPerPerson).toBeCloseTo(93508.345, 2);

      // Verify global totals
      expect(results.totals.purchase).toBe(650000);
      expect(results.totals.totalTravauxCommuns).toBe(368900);
      expect(results.totals.travauxCommunsPerUnit).toBe(92225);
      expect(results.totals.capitalTotal).toBe(490000);

      // Verify participant 1
      const p1 = results.participantBreakdown[0];
      expect(p1.casco).toBe(178080);
      expect(p1.parachevements).toBe(56000);
      expect(p1.purchaseShare).toBeCloseTo(154237.29, 1);
      expect(p1.notaryFees).toBeCloseTo(19279.66, 1);
      expect(p1.constructionCost).toBe(326305);
      // totalCost = purchaseShare + notaryFees + constructionCost + sharedPerPerson
      // = 154237.29 + 19279.66 + 326305 + 93508.35 = 593,330.30 (was 593,313.36)
      expect(p1.totalCost).toBeCloseTo(593330.30, 1);
      expect(p1.loanNeeded).toBeCloseTo(543330.30, 1);
      expect(p1.monthlyPayment).toBeCloseTo(3020.01, 1);

      // Verify total cost matches sum of components
      const expectedTotalCost = results.totals.purchase +
        results.totals.totalNotaryFees +
        results.totals.construction +
        results.totals.shared;
      expect(results.totals.total).toBeCloseTo(expectedTotalCost, 1);
    });

    it('should calculate all values correctly with scenario modifications', () => {
      const participants: Participant[] = [
        { name: 'Manuela/Dragan', capitalApporte: 50000, notaryFeesRate: 12.5, unitId: 1, surface: 112, interestRate: 4.5, durationYears: 25, quantity: 1 },
        { name: 'Cathy/Jim', capitalApporte: 170000, notaryFeesRate: 12.5, unitId: 3, surface: 134, interestRate: 4.5, durationYears: 25, quantity: 1 },
        { name: 'Annabelle/Colin', capitalApporte: 200000, notaryFeesRate: 12.5, unitId: 5, surface: 118, interestRate: 4.5, durationYears: 25, quantity: 1 },
        { name: 'Julie/Séverin', capitalApporte: 70000, notaryFeesRate: 12.5, unitId: 6, surface: 108, interestRate: 4.5, durationYears: 25, quantity: 1 },
      ];

      const projectParams: ProjectParams = {
        totalPurchase: 650000,
        mesuresConservatoires: 20000,
        demolition: 40000,
        infrastructures: 90000,
        etudesPreparatoires: 59820,
        fraisEtudesPreparatoires: 27320,
        fraisGeneraux3ans: 136825.63,
        batimentFondationConservatoire: 43700,
        batimentFondationComplete: 269200,
        batimentCoproConservatoire: 56000,
      };

      const scenario: Scenario = {
        constructionCostChange: 15,
        infrastructureReduction: 20,
        purchasePriceReduction: 10,
      };

      const unitDetails: UnitDetails = {
        1: { casco: 178080, parachevements: 56000 },
        3: { casco: 213060, parachevements: 67000 },
        5: { casco: 187620, parachevements: 59000 },
        6: { casco: 171720, parachevements: 54000 },
      };

      const results = calculateAll(participants, projectParams, scenario, unitDetails);

      // Purchase should be reduced by 10%
      expect(results.totals.purchase).toBe(585000);

      // Infrastructure should be reduced by 20%
      // Dynamic fraisGeneraux3ans = 10.1% of 1,355,380 = 136,893.38
      // Shared costs = 20000 + 40000 + (90000*0.8) + 59820 + 27320 + 136893.38 = 356,033.38
      expect(results.sharedCosts).toBeCloseTo(356033.38, 2);

      // Construction cost should include +15%
      const p1 = results.participantBreakdown[0];
      expect(p1.constructionCost).toBeCloseTo(361417, 1);
    });
  });
});
