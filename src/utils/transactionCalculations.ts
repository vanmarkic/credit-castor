import { Participant, ParticipantCalculation } from './calculatorUtils'
import { TimelineTransaction } from '../types/timeline'

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
 * @param buyerBreakdown - Buyer's calculated costs at their entry date
 * @param sellerEntryDate - When the seller entered (for calculating years held)
 * @returns Transaction object with calculated delta
 */
export function calculatePortageTransaction(
  seller: Participant,
  buyer: Participant,
  buyerEntryDate: Date,
  sellerBreakdown: ParticipantCalculation,
  _buyerBreakdown: ParticipantCalculation,
  sellerEntryDate: Date
): TimelineTransaction {
  // Calculate years held
  const yearsHeld = (buyerEntryDate.getTime() - sellerEntryDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25)

  // Get original costs from seller's lots (first lot)
  const sellerLot = seller.lotsOwned?.[0]
  const originalPurchaseShare = sellerLot?.originalPrice || 0
  const originalNotaryFees = sellerLot?.originalNotaryFees || 0
  const originalConstructionCost = sellerLot?.originalConstructionCost || 0

  // Calculate indexation (2% default rate)
  const indexationRate = 0.02
  const basePrice = originalPurchaseShare + originalNotaryFees + originalConstructionCost
  const indexation = basePrice * (Math.pow(1 + indexationRate, yearsHeld) - 1)

  // Calculate carrying costs
  const monthlyLoanInterest = (sellerBreakdown.loanNeeded * seller.interestRate / 100) / 12
  const monthlyPropertyTax = 388.38 / 12 // Annual property tax divided by 12
  const monthlyInsurance = 2000 / 12 / 5 // Assuming 5 participants, adjust as needed
  const totalMonthlyCarrying = monthlyLoanInterest + monthlyPropertyTax + monthlyInsurance
  const carryingCostRecoveryPercent = 1.0 // 100% recovery by default
  const carryingCostRecovery = totalMonthlyCarrying * yearsHeld * 12 * carryingCostRecoveryPercent

  // Calculate lot price
  const lotPrice = basePrice + indexation + carryingCostRecovery

  // Delta for seller: they receive lot price, reducing their obligation
  const sellerDelta = -lotPrice

  return {
    type: 'portage_sale',
    seller: seller.name,
    lotPrice,
    indexation,
    carryingCosts: carryingCostRecovery,
    delta: {
      totalCost: sellerDelta,
      loanNeeded: sellerDelta, // Proportional for now
      reason: `Sold portage lot to ${buyer.name}`
    }
  }
}
