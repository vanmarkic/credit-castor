import { Participant, ParticipantCalculation, PortageFormulaParams } from './calculatorUtils'
import { TimelineTransaction } from '../types/timeline'
import {
  calculateResalePrice,
  calculateCarryingCosts
} from './portageCalculations'

// Local interface for TimelineSnapshot to avoid circular dependency
interface TimelineSnapshot {
  date: Date;
  participantName: string;
  participantIndex: number;
  totalCost: number;
  loanNeeded: number;
  monthlyPayment: number;
  isT0: boolean;
  colorZone: number;
  transaction?: TimelineTransaction;
}

/**
 * Calculate the financial impact of a portage sale on both buyer and seller.
 *
 * The lot price is calculated using the seller's acquisition costs and the
 * time held (from seller entry date to buyer entry date), including indexation
 * and carrying costs per portage formulas.
 *
 * @param seller - The founder selling their lot
 * @param buyer - The newcomer buying the lot
 * @param buyerEntryDate - The date when buyer enters (determines years held)
 * @param sellerBreakdown - Seller's calculated costs at T0
 * @param _buyerBreakdown - Buyer's calculated costs at their entry date
 * @param sellerEntryDate - When the seller entered (for calculating years held)
 * @param formulaParams - Global formula parameters (indexation rate, carrying cost recovery)
 * @param totalParticipants - Total number of participants (for insurance calculation)
 * @returns Transaction object with calculated delta
 */
export function calculatePortageTransaction(
  seller: Participant,
  buyer: Participant,
  buyerEntryDate: Date,
  _sellerBreakdown: ParticipantCalculation,
  _buyerBreakdown: ParticipantCalculation,
  sellerEntryDate: Date,
  formulaParams: PortageFormulaParams,
  _totalParticipants: number
): TimelineTransaction {
  // Calculate years held
  const yearsHeld = (buyerEntryDate.getTime() - sellerEntryDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25)

  // Get the specific lot being sold (match by lotId from buyer's purchaseDetails)
  const sellerLot = seller.lotsOwned?.find(lot => lot.lotId === buyer.purchaseDetails?.lotId)
  if (!sellerLot) {
    throw new Error(`Seller ${seller.name} has no lot with ID ${buyer.purchaseDetails?.lotId}`)
  }

  // Calculate carrying costs using existing function
  const totalAcquisitionCost = (sellerLot.originalPrice || 0) + (sellerLot.originalNotaryFees || 0) + (sellerLot.originalConstructionCost || 0)
  const carryingCosts = calculateCarryingCosts(
    totalAcquisitionCost,
    seller.capitalApporte,
    yearsHeld * 12,
    seller.interestRate
  )

  // Calculate resale price using existing function
  const resalePrice = calculateResalePrice(
    sellerLot.originalPrice || 0,
    sellerLot.originalNotaryFees || 0,
    sellerLot.originalConstructionCost || 0,
    yearsHeld,
    formulaParams,
    carryingCosts
  )

  // Seller delta is negative (receives payment, reduces obligation)
  const sellerDelta = -resalePrice.totalPrice

  return {
    type: 'portage_sale',
    seller: seller.name,
    lotPrice: resalePrice.totalPrice,
    indexation: resalePrice.indexation,
    carryingCosts: resalePrice.carryingCostRecovery,
    delta: {
      totalCost: sellerDelta,
      loanNeeded: sellerDelta,
      reason: `Sold portage lot to ${buyer.name}`
    }
  }
}

/**
 * Calculate the financial impact of a copropriété lot sale on active participants.
 *
 * When a copro lot is sold, shared costs (syndic fees, charges communes, etc.)
 * are redistributed among all coowners. This affects everyone's total cost.
 *
 * @param _affectedParticipant - A participant affected by the copro sale
 * @param coproBuyer - The newcomer buying from copropriété
 * @param _previousSnapshot - Participant's snapshot before this date
 * @param _totalParticipants - Total number of active participants
 * @returns Transaction object with calculated delta
 */
export function calculateCooproTransaction(
  _affectedParticipant: Participant,
  coproBuyer: Participant,
  _previousSnapshot: TimelineSnapshot,
  _totalParticipants: number
): TimelineTransaction {
  // Simplified: shared costs redistributed among more/fewer people
  // Real implementation would calculate actual shared cost changes
  // For now, assume shared costs stay the same but divided among more people
  const costDelta = 0 // Will be calculated from actual shared cost changes

  return {
    type: 'copro_sale',
    delta: {
      totalCost: costDelta,
      loanNeeded: costDelta,
      reason: `${coproBuyer.name} joined (copro sale)`
    }
  }
}

/**
 * Create timeline transactions for a copropriété sale with 30/70 distribution.
 *
 * Returns an array of transactions:
 * 1. Buyer's purchase transaction (cost increase)
 * 2. Founder distribution transactions (cash received from 70% split)
 * 3. Copropriété reserve transaction (30% increase)
 *
 * @param coproSalePricing - Pricing breakdown with distribution from calculateCoproSalePrice
 * @param buyer - The participant buying from copropriété
 * @param founders - Array of founders receiving distribution
 * @param totalBuildingSurface - Total building surface for quotité calculation
 * @param saleDate - Date of the sale
 * @param surfacePurchased - Surface area purchased by buyer
 * @returns Array of timeline transactions for all parties
 */
export function createCoproSaleTransactions(
  coproSalePricing: {
    basePrice: number
    indexation: number
    carryingCostRecovery: number
    totalPrice: number
    pricePerM2: number
    distribution: {
      toCoproReserves: number
      toParticipants: number
    }
  },
  buyer: Participant,
  founders: Array<{ name: string; surface: number }>,
  totalBuildingSurface: number,
  saleDate: Date,
  surfacePurchased: number
): TimelineTransaction[] {
  const transactions: TimelineTransaction[] = []

  // 1. Buyer's purchase transaction
  transactions.push({
    type: 'copro_sale',
    buyer: buyer.name,
    date: saleDate,
    surfacePurchased,
    distributionToCopro: coproSalePricing.distribution.toCoproReserves,
    delta: {
      totalCost: coproSalePricing.totalPrice,
      loanNeeded: coproSalePricing.totalPrice - (buyer.capitalApporte || 0),
      reason: `Purchased ${surfacePurchased}m² from copropriété`
    }
  })

  // 2. Founder distribution transactions (70% split by quotité)
  const participantDistribution = new Map<string, number>()
  founders.forEach(founder => {
    const quotite = founder.surface / totalBuildingSurface
    const amount = coproSalePricing.distribution.toParticipants * quotite
    participantDistribution.set(founder.name, amount)

    // Create transaction showing cash received by each founder
    transactions.push({
      type: 'copro_sale',
      buyer: buyer.name,
      date: saleDate,
      distributionToParticipants: participantDistribution,
      delta: {
        totalCost: -amount, // Negative = cash received
        loanNeeded: -amount,
        reason: `Distribution from copro sale to ${buyer.name} (quotité: ${(quotite * 100).toFixed(1)}%)`
      }
    })
  })

  // 3. Copropriété reserve transaction
  transactions.push({
    type: 'copro_sale',
    buyer: buyer.name,
    date: saleDate,
    distributionToCopro: coproSalePricing.distribution.toCoproReserves,
    delta: {
      totalCost: 0, // Doesn't affect individual participant costs
      loanNeeded: 0,
      reason: `Copropriété reserves increased from sale to ${buyer.name} (30%)`
    }
  })

  return transactions
}
