import { Participant, ParticipantCalculation, PortageFormulaParams } from './calculatorUtils'
import { TimelineTransaction } from '../types/timeline'
import {
  calculateResalePrice,
  calculateCarryingCosts
} from './portageCalculations'

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
  sellerBreakdown: ParticipantCalculation,
  _buyerBreakdown: ParticipantCalculation,
  sellerEntryDate: Date,
  formulaParams: PortageFormulaParams,
  totalParticipants: number
): TimelineTransaction {
  // Calculate years held
  const yearsHeld = (buyerEntryDate.getTime() - sellerEntryDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25)

  // Get seller's lot
  const sellerLot = seller.lotsOwned?.[0]
  if (!sellerLot) {
    throw new Error(`Seller ${seller.name} has no lots to sell`)
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
