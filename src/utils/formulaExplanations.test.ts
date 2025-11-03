import { describe, it, expect } from 'vitest';
import type { ParticipantCalculation, CalculationTotals } from './calculatorUtils';
import {
  getTotalCostFormula,
  getPurchaseShareFormula,
  getNotaryFeesFormula,
  getPersonalRenovationFormula,
  getConstructionCostFormula,
  getSharedCostsFormula,
  getLoanNeededFormula,
  getMonthlyPaymentFormula,
  getPricePerM2Formula,
  getTotalProjectCostFormula,
  getTotalLoansFormula,
} from './formulaExplanations';

// Mock participant calculation data
const mockParticipant: ParticipantCalculation = {
  name: 'Alice',
  capitalApporte: 50000,
  notaryFeesRate: 12.5,
  interestRate: 3.5,
  durationYears: 20,
  surface: 100,
  quantity: 1,
  pricePerM2: 1500,
  purchaseShare: 150000,
  notaryFees: 18750,
  casco: 30000,
  parachevements: 50000,
  personalRenovationCost: 80000,
  constructionCost: 120000,
  constructionCostPerUnit: 120000,
  travauxCommunsPerUnit: 40000,
  sharedCosts: 25000,
  totalCost: 313750,
  loanNeeded: 263750,
  financingRatio: 84.06,
  monthlyPayment: 1530.45,
  totalRepayment: 367308,
  totalInterest: 103558,
};

const mockTotals: CalculationTotals = {
  purchase: 450000,
  totalNotaryFees: 56250,
  construction: 360000,
  shared: 75000,
  totalTravauxCommuns: 120000,
  travauxCommunsPerUnit: 40000,
  total: 941250,
  capitalTotal: 150000,
  totalLoansNeeded: 791250,
  averageLoan: 263750,
  averageCapital: 50000,
};

describe('formulaExplanations', () => {
  describe('getTotalCostFormula', () => {
    it('should return description and breakdown formula', () => {
      const result = getTotalCostFormula(mockParticipant);

      expect(result).toHaveLength(2);
      expect(result[0]).toBe('Coût total pour ce participant');
      expect(result[1]).toContain('Achat');
      expect(result[1]).toContain('150,000');
      expect(result[1]).toContain('Notaire');
      expect(result[1]).toContain('18,750');
      expect(result[1]).toContain('Construction');
      expect(result[1]).toContain('120,000');
      expect(result[1]).toContain('Commun');
      expect(result[1]).toContain('25,000');
    });
  });

  describe('getPurchaseShareFormula', () => {
    it('should return purchase calculation with price per m2', () => {
      const result = getPurchaseShareFormula(mockParticipant, 1500);

      expect(result).toHaveLength(2);
      expect(result[0]).toBe('Votre part de l\'achat du bâtiment');
      expect(result[1]).toContain('1500');
      expect(result[1]).toContain('100');
      expect(result[1]).toContain('150,000');
    });
  });

  describe('getNotaryFeesFormula', () => {
    it('should return notary fees calculation', () => {
      const result = getNotaryFeesFormula(mockParticipant);

      expect(result).toHaveLength(2);
      expect(result[0]).toBe('Frais de notaire belges pour le transfert');
      expect(result[1]).toContain('150,000');
      expect(result[1]).toContain('12.5');
      expect(result[1]).toContain('18,750');
    });
  });

  describe('getPersonalRenovationFormula', () => {
    it('should return personal renovation breakdown', () => {
      const result = getPersonalRenovationFormula(mockParticipant);

      expect(result).toHaveLength(2);
      expect(result[0]).toContain('CASCO');
      expect(result[0]).toContain('Parachèvements');
      expect(result[1]).toContain('30,000');
      expect(result[1]).toContain('50,000');
      expect(result[1]).toContain('80,000');
    });
  });

  describe('getConstructionCostFormula', () => {
    it('should return construction cost calculation', () => {
      const result = getConstructionCostFormula(mockParticipant, 360000, 3);

      expect(result).toHaveLength(2);
      expect(result[0]).toContain('construction');
      expect(result[1]).toContain('360,000');
      expect(result[1]).toContain('3');
      expect(result[1]).toContain('120,000');
    });
  });

  describe('getSharedCostsFormula', () => {
    it('should return shared costs description', () => {
      const result = getSharedCostsFormula(mockParticipant, 3);

      expect(result).toHaveLength(2);
      expect(result[0]).toContain('part');
      expect(result[1]).toContain('Infrastructure');
      expect(result[1]).toContain('3');
      expect(result[1]).toContain(mockParticipant.sharedCosts.toLocaleString());
    });
  });

  describe('getLoanNeededFormula', () => {
    it('should return loan calculation', () => {
      const result = getLoanNeededFormula(mockParticipant);

      expect(result).toHaveLength(2);
      expect(result[0]).toContain('emprunter');
      expect(result[1]).toContain('313,750');
      expect(result[1]).toContain('50,000');
      expect(result[1]).toContain('263,750');
    });
  });

  describe('getMonthlyPaymentFormula', () => {
    it('should return monthly payment formula with PMT reference', () => {
      const result = getMonthlyPaymentFormula(mockParticipant);

      expect(result).toHaveLength(3);
      expect(result[0]).toContain('Remboursement');
      expect(result[1]).toContain('263,750');
      expect(result[1]).toContain('3.5');
      expect(result[1]).toContain('20');
      expect(result[2]).toBe('PMT(taux/12, années×12, -principal)');
    });
  });

  describe('getPricePerM2Formula', () => {
    it('should return price per m2 calculation', () => {
      const result = getPricePerM2Formula(mockTotals, 300);

      expect(result).toHaveLength(2);
      expect(result[0]).toContain('Prix moyen');
      expect(result[1]).toContain('450,000');
      expect(result[1]).toContain('300');
    });
  });

  describe('getTotalProjectCostFormula', () => {
    it('should return total project cost description', () => {
      const result = getTotalProjectCostFormula();

      expect(result).toHaveLength(2);
      expect(result[0]).toContain('Somme');
      expect(result[1]).toContain('Achat');
      expect(result[1]).toContain('Notaire');
      expect(result[1]).toContain('Construction');
      expect(result[1]).toContain('Commun');
    });
  });

  describe('getTotalLoansFormula', () => {
    it('should return total loans description', () => {
      const result = getTotalLoansFormula();

      expect(result).toHaveLength(2);
      expect(result[0]).toContain('Somme');
      expect(result[1]).toContain('Total');
      expect(result[1]).toContain('emprunt');
    });
  });
});
