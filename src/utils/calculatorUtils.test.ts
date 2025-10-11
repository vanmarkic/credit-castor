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
      batimentFondationConservatoire: 43700,
      batimentFondationComplete: 269200,
      batimentCoproConservatoire: 56000,
    };

    it('should calculate frais généraux based on Excel formula (Honoraires + recurring costs)', () => {
      const participants: Participant[] = [
        { name: 'A', surface: 112, capitalApporte: 50000, notaryFeesRate: 12.5, unitId: 1, interestRate: 4.5, durationYears: 25, quantity: 1 },
        { name: 'B', surface: 134, capitalApporte: 170000, notaryFeesRate: 12.5, unitId: 3, interestRate: 4.5, durationYears: 25, quantity: 1 },
        { name: 'C', surface: 118, capitalApporte: 200000, notaryFeesRate: 12.5, unitId: 5, interestRate: 4.5, durationYears: 25, quantity: 1 },
        { name: 'D', surface: 108, capitalApporte: 70000, notaryFeesRate: 12.5, unitId: 6, interestRate: 4.5, durationYears: 25, quantity: 1 },
      ];

      // Total CASCO = 178080 + 213060 + 187620 + 171720 + 368900 (common works) = 1,119,380
      // Honoraires = 1,119,380 × 0.15 × 0.30 = 50,371.80
      // Recurring costs = 7,988.38 × 3 years = 23,965.14
      // One-time costs = 545
      // Total = 50,371.80 + 23,965.14 + 545 = 74,881.94 (but actual is 74,882.24 due to rounding)
      const result = calculateFraisGeneraux3ans(participants, projectParams, unitDetails);
      expect(result).toBeCloseTo(74882.24, 2);
    });

    it('should handle single participant', () => {
      const participants: Participant[] = [
        { name: 'A', surface: 112, capitalApporte: 50000, notaryFeesRate: 12.5, unitId: 1, interestRate: 4.5, durationYears: 25, quantity: 1 },
      ];

      const singleUnitDetails: UnitDetails = {
        1: { casco: 178080, parachevements: 56000 },
      };

      // Total CASCO = 178080 + 368900 (common works) = 546,980
      // Honoraires = 546,980 × 0.15 × 0.30 = 24,614.10
      // Recurring costs = 7,988.38 × 3 years = 23,965.14
      // One-time costs = 545
      // Total = 24,614.10 + 23,965.14 + 545 = 49,124.24
      const result = calculateFraisGeneraux3ans(participants, projectParams, singleUnitDetails);
      expect(result).toBeCloseTo(49124.24, 2);
    });

    it('should handle multiple units for same participant', () => {
      const participants: Participant[] = [
        { name: 'A', surface: 112, capitalApporte: 50000, notaryFeesRate: 12.5, unitId: 1, interestRate: 4.5, durationYears: 25, quantity: 2 },
      ];

      const unitDetails: UnitDetails = {
        1: { casco: 178080, parachevements: 56000 },
      };

      // Total CASCO = (178080 × 2) + 368900 (common works) = 725,060
      // Honoraires = 725,060 × 0.15 × 0.30 = 32,627.70
      // Recurring costs = 7,988.38 × 3 years = 23,965.14
      // One-time costs = 545
      // Total = 32,627.70 + 23,965.14 + 545 = 57,137.84
      const result = calculateFraisGeneraux3ans(participants, projectParams, unitDetails);
      expect(result).toBeCloseTo(57137.84, 2);
    });

    it('should match Excel formula components exactly (verification test)', () => {
      // This test verifies the formula matches the Excel file:
      // Excel: FRAIS GENERAUX sheet, C13: ='PRIX TRAVAUX'!E14*0.15*0.3
      // Where E14 = Total CASCO

      const participants: Participant[] = [
        { name: 'A', surface: 100, capitalApporte: 50000, notaryFeesRate: 12.5, unitId: 1, interestRate: 4.5, durationYears: 25, quantity: 1 },
      ];

      const unitDetails: UnitDetails = {
        1: { casco: 100000, parachevements: 50000 }, // Simple round numbers for clarity
      };

      const testParams: ProjectParams = {
        ...projectParams,
        batimentFondationConservatoire: 50000,
        batimentFondationComplete: 200000,
        batimentCoproConservatoire: 50000,
      };

      const result = calculateFraisGeneraux3ans(participants, testParams, unitDetails);

      // Break down expected result:
      const totalCasco = 100000 + 50000 + 200000 + 50000; // 400,000
      const honoraires = totalCasco * 0.15 * 0.30; // 400,000 × 0.045 = 18,000

      // Recurring yearly costs (from Excel breakdown)
      const precompteImmobilier = 388.38;
      const comptable = 1000;
      const podioAbonnement = 600;
      const assuranceBatiment = 2000;
      const fraisReservation = 2000;
      const imprevus = 2000;
      const recurringYearly = precompteImmobilier + comptable + podioAbonnement +
                              assuranceBatiment + fraisReservation + imprevus;
      const recurringTotal = recurringYearly * 3; // 23,965.14

      // One-time costs
      const oneTime = 500 + 45; // 545

      const expected = honoraires + recurringTotal + oneTime;

      expect(result).toBeCloseTo(expected, 2);

      // Verify honoraires is exactly 4.5% of total CASCO (15% × 30%)
      expect(honoraires).toBeCloseTo(totalCasco * 0.045, 2);
      expect(honoraires).toBe(18000); // Exact for round numbers
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

    it('should use custom rates when provided', () => {
      const result = calculateCascoAndParachevements(1, 100, unitDetails, 1800, 600);
      expect(result).toEqual({ casco: 180000, parachevements: 60000 });
    });

    it('should prioritize custom rates over unit details', () => {
      // Unit 1 has casco: 178080, parachevements: 56000 in unitDetails
      // But custom rates should take precedence
      const result = calculateCascoAndParachevements(1, 112, unitDetails, 2000, 700);
      expect(result).toEqual({ casco: 224000, parachevements: 78400 });
    });

    it('should prioritize custom rates over default calculation', () => {
      // Unit 99 is not in unitDetails, but custom rates should still be used
      const result = calculateCascoAndParachevements(99, 150, unitDetails, 1700, 550);
      expect(result).toEqual({ casco: 255000, parachevements: 82500 });
    });

    it('should use unit details when custom rates are undefined', () => {
      const result = calculateCascoAndParachevements(1, 112, unitDetails, undefined, undefined);
      expect(result).toEqual({ casco: 178080, parachevements: 56000 });
    });

    it('should fall back to unit details when only one custom rate is provided', () => {
      // If only cascoPerM2 is provided but parachevementsPerM2 is undefined, don't use custom rates
      const result = calculateCascoAndParachevements(1, 112, unitDetails, 2000, undefined);
      expect(result).toEqual({ casco: 178080, parachevements: 56000 });
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
      // Dynamic fraisGeneraux3ans = 74,881.94 (Honoraires + recurring costs)
      // New shared costs = 20000 + 40000 + 90000 + 59820 + 27320 + 74881.94 = 312,021.94
      expect(results.sharedCosts).toBeCloseTo(312022.24, 2);
      expect(results.sharedPerPerson).toBeCloseTo(78005.56, 2);

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
      // = 154237.29 + 19279.66 + 326305 + 78005.56 = 577,827.51
      expect(p1.totalCost).toBeCloseTo(577827.51, 1);
      expect(p1.loanNeeded).toBeCloseTo(527827.51, 1);
      expect(p1.monthlyPayment).toBeCloseTo(2933.84, 1);

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
      // Dynamic fraisGeneraux3ans = 74,881.94 (same as before - not affected by infrastructure reduction)
      // Shared costs = 20000 + 40000 + (90000*0.8) + 59820 + 27320 + 74881.94 = 294,021.94
      expect(results.sharedCosts).toBeCloseTo(294022.24, 2);

      // Construction cost should include +15%
      const p1 = results.participantBreakdown[0];
      expect(p1.constructionCost).toBeCloseTo(361417, 1);
    });

    it('should use custom cascoPerM2 and parachevementsPerM2 rates from participants', () => {
      const participants: Participant[] = [
        {
          name: 'Participant 1',
          capitalApporte: 50000,
          notaryFeesRate: 12.5,
          unitId: 1,
          surface: 100,
          interestRate: 4.5,
          durationYears: 25,
          quantity: 1,
          cascoPerM2: 1800,
          parachevementsPerM2: 600
        },
        {
          name: 'Participant 2',
          capitalApporte: 100000,
          notaryFeesRate: 12.5,
          unitId: 2,
          surface: 120,
          interestRate: 4.5,
          durationYears: 25,
          quantity: 1,
          cascoPerM2: 2000,
          parachevementsPerM2: 700
        },
      ];

      const projectParams: ProjectParams = {
        totalPurchase: 500000,
        mesuresConservatoires: 20000,
        demolition: 40000,
        infrastructures: 90000,
        etudesPreparatoires: 59820,
        fraisEtudesPreparatoires: 27320,
        fraisGeneraux3ans: 0,
        batimentFondationConservatoire: 43700,
        batimentFondationComplete: 269200,
        batimentCoproConservatoire: 56000,
      };

      const scenario: Scenario = {
        constructionCostChange: 0,
        infrastructureReduction: 0,
        purchasePriceReduction: 0,
      };

      const unitDetails: UnitDetails = {};

      const results = calculateAll(participants, projectParams, scenario, unitDetails);

      // Verify participant 1 uses custom rates: 100m² × 1800€ = 180000, 100m² × 600€ = 60000
      const p1 = results.participantBreakdown[0];
      expect(p1.casco).toBe(180000);
      expect(p1.parachevements).toBe(60000);

      // Verify participant 2 uses custom rates: 120m² × 2000€ = 240000, 120m² × 700€ = 84000
      const p2 = results.participantBreakdown[1];
      expect(p2.casco).toBe(240000);
      expect(p2.parachevements).toBe(84000);

      // Verify construction costs are calculated correctly with custom rates
      // travauxCommunsPerUnit = (43700 + 269200 + 56000) / 2 participants = 184450
      const travauxCommunsPerUnit = 184450;
      expect(p1.constructionCost).toBe(180000 + 60000 + travauxCommunsPerUnit);
      expect(p2.constructionCost).toBe(240000 + 84000 + travauxCommunsPerUnit);
    });

    it('should prioritize custom rates over unit details in calculateAll', () => {
      const participants: Participant[] = [
        {
          name: 'Participant 1',
          capitalApporte: 50000,
          notaryFeesRate: 12.5,
          unitId: 1,
          surface: 112,
          interestRate: 4.5,
          durationYears: 25,
          quantity: 1,
          cascoPerM2: 2000,
          parachevementsPerM2: 700
        },
      ];

      const projectParams: ProjectParams = {
        totalPurchase: 200000,
        mesuresConservatoires: 20000,
        demolition: 40000,
        infrastructures: 90000,
        etudesPreparatoires: 59820,
        fraisEtudesPreparatoires: 27320,
        fraisGeneraux3ans: 0,
        batimentFondationConservatoire: 43700,
        batimentFondationComplete: 269200,
        batimentCoproConservatoire: 56000,
      };

      const scenario: Scenario = {
        constructionCostChange: 0,
        infrastructureReduction: 0,
        purchasePriceReduction: 0,
      };

      // Unit 1 has predefined values in unitDetails
      const unitDetails: UnitDetails = {
        1: { casco: 178080, parachevements: 56000 },
      };

      const results = calculateAll(participants, projectParams, scenario, unitDetails);

      // Should use custom rates (112m² × 2000€ = 224000, 112m² × 700€ = 78400)
      // NOT unit details (casco: 178080, parachevements: 56000)
      const p1 = results.participantBreakdown[0];
      expect(p1.casco).toBe(224000);
      expect(p1.parachevements).toBe(78400);
    });
  });
});
