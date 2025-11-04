import { describe, it, expect } from 'vitest'
import { calculatePortageTransaction, calculateCooproTransaction } from './transactionCalculations'
import { Participant, ParticipantCalculation, PortageFormulaParams } from './calculatorUtils'

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
            lotId: 2,  // Match buyer's purchaseDetails.lotId
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
          buyingFrom: 'Deed',
          lotId: 1,
          purchasePrice: 233175
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
          buyingFrom: 'Annabelle/Colin',
          lotId: 2,  // Buying the portage lot (lotId: 2)
          purchasePrice: 256490
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

      const formulaParams: PortageFormulaParams = {
        indexationRate: 2,  // 2%
        carryingCostRecovery: 100,  // 100%
        averageInterestRate: 4.5  // 4.5%
      }

      // Execute
      const transaction = calculatePortageTransaction(
        seller,
        buyer,
        buyerEntryDate,
        sellerBreakdown,
        buyerBreakdown,
        sellerEntryDate,
        formulaParams,
        5  // totalParticipants
      )

      // Assert: seller's cost should be NEGATIVE (reduction from selling)
      expect(transaction.type).toBe('portage_sale')
      expect(transaction.seller).toBe('Annabelle/Colin')
      expect(transaction.delta.totalCost).toBeLessThan(0)
      expect(transaction.delta.reason).toContain('Sold portage lot to Nouveau·elle')
      expect(transaction.lotPrice).toBeGreaterThan(0)
    })

    it('should include indexation and carrying costs in lot price', () => {
      // Setup: same as first test
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
            lotId: 2,  // Match buyer's purchaseDetails.lotId
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
          buyingFrom: 'Deed',
          lotId: 1,
          purchasePrice: 233175
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
          buyingFrom: 'Annabelle/Colin',
          lotId: 2,  // Buying the portage lot (lotId: 2)
          purchasePrice: 256490
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

      const formulaParams: PortageFormulaParams = {
        indexationRate: 2,  // 2%
        carryingCostRecovery: 100,  // 100%
        averageInterestRate: 4.5  // 4.5%
      }

      const sellerLot = seller.lotsOwned![0]
      const baseAcquisitionCost =
        (sellerLot.originalPrice || 0) +
        (sellerLot.originalNotaryFees || 0) +
        (sellerLot.originalConstructionCost || 0)

      // Execute
      const transaction = calculatePortageTransaction(
        seller,
        buyer,
        buyerEntryDate,
        sellerBreakdown,
        buyerBreakdown,
        sellerEntryDate,
        formulaParams,
        5  // totalParticipants
      )

      // Verify components are present
      expect(transaction.indexation).toBeGreaterThan(0)
      expect(transaction.carryingCosts).toBeGreaterThan(0)

      // Verify they contribute to lot price
      expect(transaction.lotPrice).toBeGreaterThan(baseAcquisitionCost)
    })
  })

  describe('calculateCooproTransaction', () => {
    it('should calculate cost redistribution delta for copro sale', () => {
      const participant: Participant = {
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
            isPortage: false,
            acquiredDate: new Date('2026-02-01')
          }
        ],
        purchaseDetails: {
          buyingFrom: 'Deed',
          lotId: 1,
          purchasePrice: 233175
        }
      }

      const coproBuyer: Participant = {
        name: 'New Copro Participant',
        capitalApporte: 50000,
        notaryFeesRate: 12.5,
        interestRate: 3.5,
        durationYears: 30,
        isFounder: false,
        entryDate: new Date('2027-06-01'),
        lotsOwned: [
          {
            lotId: 2,
            surface: 150,
            unitId: 2,
            isPortage: false,
            acquiredDate: new Date('2027-06-01')
          }
        ],
        purchaseDetails: {
          buyingFrom: 'Copropriété',
          lotId: 100,
          purchasePrice: 150000
        }
      }

      const participantPreviousSnapshot = {
        date: new Date('2026-02-01'),
        participantName: 'Annabelle/Colin',
        participantIndex: 0,
        totalCost: 680463,
        loanNeeded: 580463,
        monthlyPayment: 2671,
        isT0: true,
        colorZone: 0
      }

      // Execute
      const transaction = calculateCooproTransaction(
        participant,
        coproBuyer,
        participantPreviousSnapshot,
        5 // total participants
      )

      // Assert: cost should change due to shared cost redistribution
      expect(transaction.type).toBe('copro_sale')
      expect(transaction.delta.reason).toContain('joined (copro sale)')
      // Could be positive or negative depending on whether new participant adds/reduces shared costs
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
