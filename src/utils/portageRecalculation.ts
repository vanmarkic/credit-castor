/**
 * Utility for recalculating portage lot prices when buyer entry date changes
 */

import type { Participant, PortageFormulaParams } from './calculatorUtils';
import { calculatePortageLotPrice, calculateCarryingCosts } from './portageCalculations';

/**
 * Recalculate portage lot purchase price when buyer's entry date changes
 *
 * @param buyer - The buyer participant
 * @param seller - The seller participant
 * @param deedDate - Project deed date (when seller acquired the lot)
 * @param formulaParams - Portage pricing formula parameters
 * @returns Updated purchase price, or undefined if not a portage transaction
 */
export function recalculatePortagePurchasePrice(
  buyer: Participant,
  seller: Participant,
  deedDate: string,
  formulaParams: PortageFormulaParams
): number | undefined {
  // Only recalculate for portage lot purchases
  if (!buyer.purchaseDetails || buyer.purchaseDetails.buyingFrom === 'Copropriété') {
    return undefined;
  }

  const { lotId } = buyer.purchaseDetails;

  // Find the specific lot being purchased
  const lot = seller.lotsOwned?.find(l => l.lotId === lotId);
  if (!lot || !lot.isPortage) {
    return undefined;
  }

  // Calculate years held from seller's acquired date to buyer's entry date
  const sellerAcquiredDate = lot.acquiredDate || seller.entryDate || new Date(deedDate);
  const buyerEntryDate = buyer.entryDate || new Date(deedDate);

  const yearsHeld = (buyerEntryDate.getTime() - sellerAcquiredDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);

  // Get lot pricing components
  const originalPrice = lot.originalPrice || 0;
  const originalNotaryFees = lot.originalNotaryFees || 0;
  const originalConstructionCost = lot.originalConstructionCost || 0;
  const baseAcquisition = originalPrice + originalNotaryFees + originalConstructionCost;

  // Calculate carrying costs
  const carryingCosts = calculateCarryingCosts(
    baseAcquisition,
    0, // No interim payments
    Math.round(yearsHeld * 12), // Months held
    formulaParams.averageInterestRate
  );

  // Calculate full portage price
  const priceBreakdown = calculatePortageLotPrice(
    originalPrice,
    originalNotaryFees,
    originalConstructionCost,
    yearsHeld,
    formulaParams,
    carryingCosts,
    0 // No renovations recovered
  );

  return priceBreakdown.totalPrice;
}

/**
 * Update participant with recalculated portage price
 *
 * @param buyer - The buyer participant (potentially with updated entry date)
 * @param seller - The seller participant
 * @param deedDate - Project deed date
 * @param formulaParams - Portage pricing formula parameters
 * @returns Updated buyer with new purchasePrice, or original buyer if not applicable
 */
export function updateBuyerWithRecalculatedPrice(
  buyer: Participant,
  seller: Participant,
  deedDate: string,
  formulaParams: PortageFormulaParams
): Participant {
  const newPrice = recalculatePortagePurchasePrice(buyer, seller, deedDate, formulaParams);

  if (newPrice === undefined) {
    return buyer; // Not a portage transaction, return unchanged
  }

  return {
    ...buyer,
    purchaseDetails: {
      ...buyer.purchaseDetails!,
      purchasePrice: newPrice
    }
  };
}

/**
 * Recalculate all portage transaction prices in participant list
 *
 * This should be called when entry dates change or formula parameters change.
 *
 * @param participants - Array of all participants
 * @param deedDate - Project deed date
 * @param formulaParams - Portage pricing formula parameters
 * @returns Updated participants array with recalculated prices
 */
export function recalculateAllPortagePrices(
  participants: Participant[],
  deedDate: string,
  formulaParams: PortageFormulaParams
): Participant[] {
  return participants.map(buyer => {
    if (!buyer.purchaseDetails || buyer.purchaseDetails.buyingFrom === 'Copropriété') {
      return buyer;
    }

    // Find the seller
    const seller = participants.find(p => p.name === buyer.purchaseDetails?.buyingFrom);
    if (!seller) {
      return buyer;
    }

    return updateBuyerWithRecalculatedPrice(buyer, seller, deedDate, formulaParams);
  });
}
