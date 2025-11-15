/**
 * Copropriété redistribution calculations
 * 
 * When a newcomer buys from copropriété, the payment is redistributed to all existing
 * participants (founders + earlier newcomers) based on their quotités.
 */

export interface CoproSale {
  buyer: string;
  entryDate: Date | string; // Can be Date or string (from JSON/localStorage)
  amount: number; // Amount to participants (excluding reserves)
}

export interface ParticipantForRedistribution {
  name: string;
  surface: number;
  isFounder: boolean;
  entryDate: Date;
}

export interface RedistributionShare {
  participantName: string;
  quotite: number; // Their quotité before the new sale
  share: number; // Amount they receive (in euros)
  yearsHeld: number; // Years from their entry to the sale date
}

/**
 * Calculate redistribution when a newcomer buys from copropriété
 * 
 * Formula:
 * 1. Calculate each existing participant's quotité = their surface / total surface of existing participants
 * 2. Each participant receives: newcomerPayment × their quotité
 * 3. Track years held for each participant (from their entry date to sale date)
 * 
 * @param newcomerPayment - Total amount the newcomer pays
 * @param existingParticipants - All participants who own shares before this sale
 * @param saleDate - Date when the newcomer is buying
 * @returns Array of redistribution shares for each existing participant
 */
export function calculateCoproRedistribution(
  newcomerPayment: number,
  existingParticipants: ParticipantForRedistribution[],
  saleDate: Date
): RedistributionShare[] {
  // Calculate total building surface from existing participants
  const totalSurface = existingParticipants.reduce((sum, p) => sum + p.surface, 0);
  
  if (totalSurface <= 0) {
    return [];
  }
  
  // Calculate each participant's quotité and redistribution share
  return existingParticipants.map(p => {
    const quotite = p.surface / totalSurface;
    const share = newcomerPayment * quotite;
    const yearsHeld = (saleDate.getTime() - p.entryDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
    
    return {
      participantName: p.name,
      quotite,
      share,
      yearsHeld
    };
  });
}

/**
 * Calculate total expected redistribution for a participant across all future copro sales
 * 
 * This sums up all redistribution shares the participant will receive when newcomers buy from copropriété
 * 
 * @param participant - The participant to calculate expected paybacks for
 * @param allRedistributions - Array of all redistribution events
 * @returns Total amount the participant expects to receive
 */
export function calculateTotalExpectedRedistribution(
  participantName: string,
  allRedistributions: RedistributionShare[][]
): number {
  return allRedistributions.reduce((total, redistribution) => {
    const participantShare = redistribution.find(r => r.participantName === participantName);
    return total + (participantShare?.share || 0);
  }, 0);
}

/**
 * Calculate redistribution for multiple sequential newcomer purchases
 * 
 * This handles the recursive nature where:
 * - First newcomer pays, founders receive
 * - Second newcomer pays, founders + first newcomer receive
 * - Third newcomer pays, founders + first + second newcomers receive
 * etc.
 * 
 * @param newcomerPurchases - Array of {payment, saleDate} for each newcomer
 * @param initialParticipants - Founders at T0
 * @returns Array of redistribution events (one per newcomer purchase)
 */
export function calculateSequentialRedistributions(
  newcomerPurchases: Array<{ payment: number; saleDate: Date; newcomerName: string; newcomerSurface: number }>,
  initialParticipants: ParticipantForRedistribution[]
): RedistributionShare[][] {
  const redistributions: RedistributionShare[][] = [];
  const currentParticipants = [...initialParticipants];
  
  for (const purchase of newcomerPurchases) {
    // Calculate redistribution to existing participants
    const redistribution = calculateCoproRedistribution(
      purchase.payment,
      currentParticipants,
      purchase.saleDate
    );
    
    redistributions.push(redistribution);
    
    // Add this newcomer to the participants for the next iteration
    currentParticipants.push({
      name: purchase.newcomerName,
      surface: purchase.newcomerSurface,
      isFounder: false,
      entryDate: purchase.saleDate
    });
  }
  
  return redistributions;
}

/**
 * Helper to ensure a value is a Date object
 */
function ensureDate(date: Date | string | undefined, fallback: Date): Date {
  if (!date) return fallback;
  if (date instanceof Date) return date;
  return new Date(date);
}

/**
 * Calculate redistribution paybacks for a specific participant from copro sales
 * 
 * This function calculates how much a participant receives from each copro sale
 * based on their quotité at the time of each sale.
 * 
 * @param participant - The participant to calculate paybacks for
 * @param coproSales - Array of copro sales (newcomers buying from copropriété)
 * @param allParticipants - All participants in the project
 * @param deedDate - Date of the initial purchase (deed date)
 * @returns Array of Payback objects representing redistributions to this participant
 */

export function calculateCoproRedistributionForParticipant(
  participant: { name: string; surface?: number; entryDate?: Date | string; isFounder?: boolean },
  coproSales: CoproSale[],
  allParticipants: Array<{ name: string; surface?: number; entryDate?: Date | string; isFounder?: boolean }>,
  deedDate: Date
): Array<{ date: Date; buyer: string; amount: number; type: 'copro'; description: string }> {
  const paybacks: Array<{ date: Date; buyer: string; amount: number; type: 'copro'; description: string }> = [];
  
  // Normalize copro sales to ensure entryDate is a Date
  const normalizedSales = coproSales.map(sale => ({
    ...sale,
    entryDate: ensureDate(sale.entryDate, deedDate)
  }));
  
  // Process copro sales in chronological order
  const sortedSales = [...normalizedSales].sort((a, b) => a.entryDate.getTime() - b.entryDate.getTime());
  
  for (const sale of sortedSales) {
    // Only calculate if this participant existed before the sale
    const participantEntryDate = ensureDate(
      participant.entryDate || (participant.isFounder ? deedDate : undefined),
      participant.isFounder ? deedDate : new Date()
    );
    if (participantEntryDate > sale.entryDate) {
      continue; // Participant didn't exist yet, skip this sale
    }
    
    // Skip if participant has no surface
    const participantSurface = participant.surface || 0;
    if (participantSurface <= 0) {
      continue;
    }
    
    // Get all participants who existed before this sale (including this participant)
    const existingParticipants = allParticipants
      .filter(p => {
        const pEntryDate = ensureDate(
          p.entryDate || (p.isFounder ? deedDate : undefined),
          p.isFounder ? deedDate : new Date()
        );
        const pSurface = p.surface || 0;
        return pEntryDate <= sale.entryDate && pSurface > 0;
      })
      .map(p => ({
        name: p.name,
        surface: p.surface || 0,
        isFounder: p.isFounder || false,
        entryDate: ensureDate(
          p.entryDate || (p.isFounder ? deedDate : undefined),
          p.isFounder ? deedDate : new Date()
        )
      }));
    
    // Calculate redistribution for this sale
    const redistribution = calculateCoproRedistribution(
      sale.amount,
      existingParticipants,
      sale.entryDate
    );
    
    // Find this participant's share
    const participantShare = redistribution.find(r => r.participantName === participant.name);
    if (participantShare && participantShare.share > 0) {
      paybacks.push({
        date: sale.entryDate,
        buyer: sale.buyer,
        amount: participantShare.share,
        type: 'copro' as const,
        description: `Redistribution vente copropriété (quotité: ${(participantShare.quotite * 100).toFixed(1)}%)`
      });
    }
  }
  
  return paybacks;
}

/**
 * Sum all amounts in a Map<string, number>
 */
export function sumDistributionAmounts(distributionMap: Map<string, number>): number {
  let total = 0;
  for (const amount of distributionMap.values()) {
    total += amount;
  }
  return total;
}

/**
 * Calculate distribution percentages for copro reserves and participants
 */
export function calculateDistributionPercentages(
  toCoproReserves: number,
  toParticipants: number,
  totalPrice: number
): { coproReservesPercent: number; foundersPercent: number } {
  if (totalPrice <= 0) {
    return { coproReservesPercent: 0, foundersPercent: 0 };
  }
  
  const coproReservesPercent = (toCoproReserves / totalPrice) * 100;
  const foundersPercent = (toParticipants / totalPrice) * 100;
  
  return { coproReservesPercent, foundersPercent };
}

/**
 * Calculate quotité from distribution amount
 */
export function calculateQuotiteFromAmount(
  amount: number,
  totalToParticipants: number
): number {
  if (totalToParticipants <= 0) {
    return 0;
  }
  return (amount / totalToParticipants) * 100;
}

/**
 * Calculate months between two dates
 * 
 * @param startDate - Start date
 * @param endDate - End date
 * @returns Number of months (can be fractional)
 */
export function calculateMonthsBetween(startDate: Date, endDate: Date): number {
  const diffMs = endDate.getTime() - startDate.getTime();
  const diffMonths = diffMs / (1000 * 60 * 60 * 24 * 30.44); // Average days per month
  return diffMonths;
}

