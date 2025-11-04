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
