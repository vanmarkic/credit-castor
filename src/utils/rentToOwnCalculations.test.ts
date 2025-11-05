import { describe, it, expect } from 'vitest';
import {
  calculateRentToOwnPayment,
  calculateAccumulatedEquity,
  calculateFinalPurchasePrice
} from './rentToOwnCalculations';
import { DEFAULT_RENT_TO_OWN_FORMULA } from './calculatorUtils';
import type { RentToOwnAgreement } from './calculatorUtils';

describe('Rent-to-Own Calculations', () => {
  const mockAgreement: RentToOwnAgreement = {
    id: 'rto-001',
    trialStartDate: new Date('2027-06-01'),
    trialEndDate: new Date('2028-06-01'),
    trialDurationMonths: 12,
    monthlyPayment: 1500,
    totalPaid: 0,
    equityAccumulated: 0,
    rentPaid: 0,
    rentToOwnFormula: DEFAULT_RENT_TO_OWN_FORMULA,
    provisionalBuyerId: 'buyer-123',
    sellerId: 'seller-456',
    status: 'active',
    extensionRequests: []
  };

  describe('calculateRentToOwnPayment', () => {
    it('should split payment 50/50 with default formula', () => {
      const payment = calculateRentToOwnPayment(mockAgreement, new Date('2027-07-01'));

      expect(payment.totalAmount).toBe(1500);
      expect(payment.equityPortion).toBe(750);  // 50% of 1500
      expect(payment.rentPortion).toBe(750);    // 50% of 1500
      expect(payment.percentToEquity).toBe(50);
    });

    it('should handle custom equity split (60/40)', () => {
      const customAgreement = {
        ...mockAgreement,
        rentToOwnFormula: {
          ...DEFAULT_RENT_TO_OWN_FORMULA,
          equityPercentage: 60,
          rentPercentage: 40
        }
      };

      const payment = calculateRentToOwnPayment(customAgreement, new Date('2027-07-01'));

      expect(payment.equityPortion).toBe(900);  // 60% of 1500
      expect(payment.rentPortion).toBe(600);    // 40% of 1500
    });
  });

  describe('calculateAccumulatedEquity', () => {
    it('should calculate equity for 6 months', () => {
      const equity = calculateAccumulatedEquity(
        mockAgreement,
        new Date('2027-12-01')  // 6 months after start
      );

      expect(equity).toBe(4500);  // 6 months × €750/month
    });

    it('should calculate equity for full 12 months', () => {
      const equity = calculateAccumulatedEquity(
        mockAgreement,
        new Date('2028-06-01')  // 12 months after start
      );

      expect(equity).toBe(9000);  // 12 months × €750/month
    });

    it('should not exceed trial duration', () => {
      const equity = calculateAccumulatedEquity(
        mockAgreement,
        new Date('2029-01-01')  // 19 months after start (beyond trial)
      );

      expect(equity).toBe(9000);  // Capped at 12 months
    });

    it('should return 0 before trial starts', () => {
      const equity = calculateAccumulatedEquity(
        mockAgreement,
        new Date('2027-05-01')  // Before trial start
      );

      expect(equity).toBe(0);
    });
  });

  describe('calculateFinalPurchasePrice', () => {
    it('should reduce base price by accumulated equity', () => {
      const agreementWithEquity = {
        ...mockAgreement,
        equityAccumulated: 9000
      };

      const finalPrice = calculateFinalPurchasePrice(
        agreementWithEquity,
        256490  // Base portage price
      );

      expect(finalPrice).toBe(247490);  // 256490 - 9000
    });

    it('should not go below zero', () => {
      const agreementWithHighEquity = {
        ...mockAgreement,
        equityAccumulated: 300000
      };

      const finalPrice = calculateFinalPurchasePrice(
        agreementWithHighEquity,
        256490
      );

      expect(finalPrice).toBe(0);  // Never negative
    });
  });
});
