/**
 * Utility functions for synchronizing participant data consistency
 */

import type { Participant } from './calculatorUtils';

/**
 * Synchronize soldDate fields on seller lots based on buyer purchaseDetails
 *
 * When loading data from localStorage or JSON files, buyers may have purchaseDetails
 * but sellers' lots may not have soldDate set. This function ensures consistency by
 * setting soldDate on seller lots to match the buyer's entry date.
 *
 * @param participants - Array of participants to synchronize
 * @returns New array with synchronized soldDate fields
 */
export function syncSoldDatesFromPurchaseDetails(participants: Participant[]): Participant[] {
  const syncedParticipants = participants.map(p => ({ ...p }));

  // For each participant with purchaseDetails
  participants.forEach((buyer) => {
    if (!buyer.purchaseDetails || buyer.purchaseDetails.buyingFrom === 'Copropriété') {
      return; // Skip copro purchases
    }

    const { buyingFrom, lotId } = buyer.purchaseDetails;

    // Find the seller
    const sellerIdx = syncedParticipants.findIndex(p => p.name === buyingFrom);
    if (sellerIdx === -1) {
      console.warn(`Seller "${buyingFrom}" not found for buyer "${buyer.name}"`);
      return;
    }

    const seller = syncedParticipants[sellerIdx];
    if (!seller.lotsOwned || seller.lotsOwned.length === 0) {
      console.warn(`Seller "${buyingFrom}" has no lots owned`);
      return;
    }

    // Update the specific lot's soldDate
    syncedParticipants[sellerIdx] = {
      ...seller,
      lotsOwned: seller.lotsOwned.map(lot => {
        if (lot.lotId === lotId) {
          // Set soldDate to buyer's entry date
          return {
            ...lot,
            soldDate: buyer.entryDate ? new Date(buyer.entryDate) : undefined
          };
        }
        return lot;
      })
    };
  });

  return syncedParticipants;
}

/**
 * Validate that soldDate matches buyer's entry date for all portage transactions
 * Useful for debugging data consistency issues
 *
 * @param participants - Array of participants to validate
 * @returns Array of validation errors (empty if all valid)
 */
export function validateSoldDateConsistency(participants: Participant[]): string[] {
  const errors: string[] = [];

  participants.forEach(buyer => {
    if (!buyer.purchaseDetails || buyer.purchaseDetails.buyingFrom === 'Copropriété') {
      return;
    }

    const { buyingFrom, lotId } = buyer.purchaseDetails;

    const seller = participants.find(p => p.name === buyingFrom);
    if (!seller) {
      errors.push(`Buyer "${buyer.name}" references non-existent seller "${buyingFrom}"`);
      return;
    }

    const lot = seller.lotsOwned?.find(l => l.lotId === lotId);
    if (!lot) {
      errors.push(`Seller "${buyingFrom}" does not have lot ${lotId} that buyer "${buyer.name}" is trying to purchase`);
      return;
    }

    if (!lot.soldDate) {
      errors.push(`Lot ${lotId} from "${buyingFrom}" has no soldDate but is being purchased by "${buyer.name}"`);
      return;
    }

    // Check if soldDate matches buyer's entry date
    const buyerEntryTime = buyer.entryDate ? new Date(buyer.entryDate).getTime() : 0;
    const lotSoldTime = lot.soldDate ? new Date(lot.soldDate).getTime() : 0;

    if (Math.abs(buyerEntryTime - lotSoldTime) > 1000) { // Allow 1 second tolerance
      errors.push(`Lot ${lotId} soldDate (${lot.soldDate}) doesn't match buyer "${buyer.name}" entry date (${buyer.entryDate})`);
    }
  });

  return errors;
}
