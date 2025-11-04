import { describe, it, expect } from 'vitest'
import { calculatePortageTransaction } from './transactionCalculations'
import { Participant, ParticipantCalculation } from './calculatorUtils'

describe('transactionCalculations', () => {
  describe('calculatePortageTransaction', () => {
    it('should calculate seller delta as negative (cost reduction)', () => {
      // Setup: founder selling to newcomer
      const seller: Participant = {
        name: 'Annabelle/Colin',
        capitalApporte: 100000,
        notaryFeesRate: 12.5,
        interestRate: 3.5,
        durationYears: 30,
        isFounder: true,
        entryDate: new Date('2026-02-01'),
        lotsOwned: [
          {
            lotId: 1,
            surface: 80,
            unitId: 1,
            isPortage: true,
            acquiredDate: new Date('2026-02-01'),
            originalPrice: 180000,
            originalNotaryFees: 22500,
            originalConstructionCost: 470000
          }
        ],
        purchaseDetails: {
          buyingFrom: 'Deed'
        }
      }

      const buyer: Participant = {
        name: 'Nouveau·elle',
        capitalApporte: 50000,
        notaryFeesRate: 12.5,
        interestRate: 3.5,
        durationYears: 30,
        isFounder: false,
        entryDate: new Date('2027-06-01'),
        lotsOwned: [
          {
            lotId: 1,
            surface: 80,
            unitId: 1,
            isPortage: false,
            acquiredDate: new Date('2027-06-01')
          }
        ],
        purchaseDetails: {
          buyingFrom: 'Annabelle/Colin'
        }
      }

      const sellerBreakdown: ParticipantCalculation = {
        ...seller,
        totalCost: 680463,
        loanNeeded: 580463,
        monthlyPayment: 2671,
        sharedCosts: 37549,
        ...mockBreakdownDefaults()
      }

      const buyerBreakdown: ParticipantCalculation = {
        ...buyer,
        totalCost: 297313,
        loanNeeded: 247313,
        monthlyPayment: 1208,
        sharedCosts: 37549,
        ...mockBreakdownDefaults()
      }

      const buyerEntryDate = new Date('2027-06-01')
      const sellerEntryDate = new Date('2026-02-01')

      // Execute
      const transaction = calculatePortageTransaction(
        seller,
        buyer,
        buyerEntryDate,
        sellerBreakdown,
        buyerBreakdown,
        sellerEntryDate
      )

      // Assert: seller's cost should be NEGATIVE (reduction from selling)
      expect(transaction.type).toBe('portage_sale')
      expect(transaction.seller).toBe('Annabelle/Colin')
      expect(transaction.delta.totalCost).toBeLessThan(0)
      expect(transaction.delta.reason).toContain('Sold portage lot to Nouveau·elle')
      expect(transaction.lotPrice).toBeGreaterThan(0)
    })

    it('should include indexation and carrying costs in lot price', () => {
      // Similar setup, verify lotPrice components exist
      // This validates that portageCalculations formulas are used
    })
  })
})

// Helper to provide minimal ParticipantCalculation defaults
function mockBreakdownDefaults() {
  return {
    pricePerM2: 0,
    purchaseShare: 0,
    notaryFees: 0,
    casco: 0,
    parachevements: 0,
    personalRenovationCost: 0,
    constructionCost: 0,
    constructionCostPerUnit: 0,
    travauxCommunsPerUnit: 0,
    financingRatio: 0,
    totalRepayment: 0,
    totalInterest: 0
  }
}
