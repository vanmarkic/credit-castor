import { describe, it, expect } from 'vitest'
import {
  calculatePortageTransaction,
  calculateCooproTransaction,
  createCoproSaleTransactions
} from './transactionCalculations'
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
        surface: 80, // Founder surface for quotité calculation
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
        colorZone: 0,
        showFinancingDetails: true
      }

      // Create mock participants array with founders
      const allParticipants: Participant[] = [
        participant, // Annabelle/Colin with 80m²
        {
          ...participant,
          name: 'Other Founder',
          surface: 120, // Other founder with 120m²
          isFounder: true
        },
        coproBuyer // The newcomer
      ]

      // Execute
      const transaction = calculateCooproTransaction(
        participant,
        coproBuyer,
        participantPreviousSnapshot,
        allParticipants
      )

      // Assert: Should calculate based on quotité
      expect(transaction.type).toBe('copro_sale')
      expect(transaction.delta.reason).toContain('joined (copro sale)')

      // Verify calculation: 150000 * 0.7 * (80 / 200) = 42000
      // Participant has 80m² out of 200m² total founder surface (40% quotité)
      // 70% of 150000 = 105000, participant gets 40% = 42000
      expect(transaction.delta.totalCost).toBe(-42000)
    })
  })

  describe('createCoproSaleTransactions', () => {
    const mockBuyer: Participant = {
      name: 'New Buyer',
      capitalApporte: 50000,
      notaryFeesRate: 12.5,
      interestRate: 3.5,
      durationYears: 30,
      isFounder: false,
      entryDate: new Date('2027-06-01'),
      lotsOwned: [],
      purchaseDetails: {
        buyingFrom: 'Copropriété',
        lotId: 100,
        purchasePrice: 150000
      }
    }

    const mockFounders = [
      { name: 'Founder A', surface: 80 },
      { name: 'Founder B', surface: 120 }
    ]

    const totalBuildingSurface = 200 // 80 + 120
    const surfacePurchased = 50
    const saleDate = new Date('2027-06-01')

    const mockCoproSalePricing = {
      basePrice: 100000,
      indexation: 5000,
      carryingCostRecovery: 10000,
      totalPrice: 115000,
      pricePerM2: 2300,
      distribution: {
        toCoproReserves: 34500,    // 30% of 115000
        toParticipants: 80500       // 70% of 115000
      }
    }

    it('should return correct number of transactions (1 buyer + N founders + 1 copro)', () => {
      const transactions = createCoproSaleTransactions(
        mockCoproSalePricing,
        mockBuyer,
        mockFounders,
        totalBuildingSurface,
        saleDate,
        surfacePurchased
      )

      // 1 buyer + 2 founders + 1 copro = 4 transactions
      expect(transactions).toHaveLength(4)
    })

    it('should create buyer transaction with positive delta (cost increase)', () => {
      const transactions = createCoproSaleTransactions(
        mockCoproSalePricing,
        mockBuyer,
        mockFounders,
        totalBuildingSurface,
        saleDate,
        surfacePurchased
      )

      const buyerTransaction = transactions[0]

      expect(buyerTransaction.type).toBe('copro_sale')
      expect(buyerTransaction.buyer).toBe('New Buyer')
      expect(buyerTransaction.surfacePurchased).toBe(50)
      expect(buyerTransaction.delta.totalCost).toBe(115000) // Positive = cost increase
      expect(buyerTransaction.delta.loanNeeded).toBe(65000) // 115000 - 50000 capital
      expect(buyerTransaction.delta.reason).toContain('Purchased 50m² from copropriété')
    })

    it('should create founder transactions with negative deltas (cash received)', () => {
      const transactions = createCoproSaleTransactions(
        mockCoproSalePricing,
        mockBuyer,
        mockFounders,
        totalBuildingSurface,
        saleDate,
        surfacePurchased
      )

      // Transactions 1 and 2 should be for founders
      const founderATx = transactions[1]
      const founderBTx = transactions[2]

      // Both should have negative deltas (cash received)
      expect(founderATx.delta.totalCost).toBeLessThan(0)
      expect(founderBTx.delta.totalCost).toBeLessThan(0)

      // Verify reasons mention distribution
      expect(founderATx.delta.reason).toContain('Distribution from copro sale')
      expect(founderBTx.delta.reason).toContain('Distribution from copro sale')
    })

    it('should split 70% among founders by quotité', () => {
      const transactions = createCoproSaleTransactions(
        mockCoproSalePricing,
        mockBuyer,
        mockFounders,
        totalBuildingSurface,
        saleDate,
        surfacePurchased
      )

      const founderATx = transactions[1]
      const founderBTx = transactions[2]

      // Founder A: 80/200 = 40% of 80500 = 32200
      // Founder B: 120/200 = 60% of 80500 = 48300
      expect(founderATx.delta.totalCost).toBe(-32200)
      expect(founderBTx.delta.totalCost).toBe(-48300)

      // Verify they sum to 70% of total
      const totalDistributed = Math.abs(founderATx.delta.totalCost) + Math.abs(founderBTx.delta.totalCost)
      expect(totalDistributed).toBe(80500)
    })

    it('should create copro reserve transaction tracking 30%', () => {
      const transactions = createCoproSaleTransactions(
        mockCoproSalePricing,
        mockBuyer,
        mockFounders,
        totalBuildingSurface,
        saleDate,
        surfacePurchased
      )

      const coproTx = transactions[3]

      expect(coproTx.type).toBe('copro_sale')
      expect(coproTx.distributionToCopro).toBe(34500) // 30% of 115000
      expect(coproTx.delta.totalCost).toBe(0) // Doesn't affect participant costs
      expect(coproTx.delta.loanNeeded).toBe(0)
      expect(coproTx.delta.reason).toContain('Copropriété reserves increased')
      expect(coproTx.delta.reason).toContain('30%')
    })

    it('should include correct quotité percentage in founder transaction reasons', () => {
      const transactions = createCoproSaleTransactions(
        mockCoproSalePricing,
        mockBuyer,
        mockFounders,
        totalBuildingSurface,
        saleDate,
        surfacePurchased
      )

      const founderATx = transactions[1]
      const founderBTx = transactions[2]

      // Founder A: 80/200 = 40%
      // Founder B: 120/200 = 60%
      expect(founderATx.delta.reason).toContain('quotité: 40.0%')
      expect(founderBTx.delta.reason).toContain('quotité: 60.0%')
    })

    it('should handle single founder (100% quotité)', () => {
      const singleFounder = [{ name: 'Solo Founder', surface: 200 }]

      const transactions = createCoproSaleTransactions(
        mockCoproSalePricing,
        mockBuyer,
        singleFounder,
        200, // totalBuildingSurface
        saleDate,
        surfacePurchased
      )

      // 1 buyer + 1 founder + 1 copro = 3 transactions
      expect(transactions).toHaveLength(3)

      const founderTx = transactions[1]
      expect(founderTx.delta.totalCost).toBe(-80500) // Gets all 70%
      expect(founderTx.delta.reason).toContain('quotité: 100.0%')
    })

    it('should handle unequal quotités correctly', () => {
      const unequalFounders = [
        { name: 'Founder A', surface: 30 },
        { name: 'Founder B', surface: 70 },
        { name: 'Founder C', surface: 100 }
      ]

      const transactions = createCoproSaleTransactions(
        mockCoproSalePricing,
        mockBuyer,
        unequalFounders,
        200, // totalBuildingSurface
        saleDate,
        surfacePurchased
      )

      const founderATx = transactions[1]
      const founderBTx = transactions[2]
      const founderCTx = transactions[3]

      // Founder A: 30/200 = 15% of 80500 = 12075
      // Founder B: 70/200 = 35% of 80500 = 28175
      // Founder C: 100/200 = 50% of 80500 = 40250
      expect(founderATx.delta.totalCost).toBe(-12075)
      expect(founderBTx.delta.totalCost).toBe(-28175)
      expect(founderCTx.delta.totalCost).toBe(-40250)

      // Verify sum equals 70% (no rounding errors)
      const totalDistributed =
        Math.abs(founderATx.delta.totalCost) +
        Math.abs(founderBTx.delta.totalCost) +
        Math.abs(founderCTx.delta.totalCost)
      expect(totalDistributed).toBe(80500)
    })

    it('should include sale date in transactions', () => {
      const transactions = createCoproSaleTransactions(
        mockCoproSalePricing,
        mockBuyer,
        mockFounders,
        totalBuildingSurface,
        saleDate,
        surfacePurchased
      )

      transactions.forEach(tx => {
        expect(tx.date).toEqual(saleDate)
      })
    })

    it('should reference buyer name in all transactions', () => {
      const transactions = createCoproSaleTransactions(
        mockCoproSalePricing,
        mockBuyer,
        mockFounders,
        totalBuildingSurface,
        saleDate,
        surfacePurchased
      )

      transactions.forEach(tx => {
        expect(tx.buyer).toBe('New Buyer')
      })
    })

    it('should populate distributionToParticipants Map for founder transactions', () => {
      const transactions = createCoproSaleTransactions(
        mockCoproSalePricing,
        mockBuyer,
        mockFounders,
        totalBuildingSurface,
        saleDate,
        surfacePurchased
      )

      const founderATx = transactions[1]
      const founderBTx = transactions[2]

      // Both founder transactions should have the distributionToParticipants map
      expect(founderATx.distributionToParticipants).toBeInstanceOf(Map)
      expect(founderBTx.distributionToParticipants).toBeInstanceOf(Map)

      // The map should contain entries for both founders
      expect(founderATx.distributionToParticipants?.get('Founder A')).toBe(32200)
      expect(founderATx.distributionToParticipants?.get('Founder B')).toBe(48300)
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
