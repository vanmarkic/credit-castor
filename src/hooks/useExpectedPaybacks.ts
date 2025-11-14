import { useMemo } from 'react';
import { calculateCoproRedistributionForParticipant, type CoproSale } from '../utils/coproRedistribution';
import { calculateCoproSalePrice, calculateYearsHeld } from '../utils/portageCalculations';
import type { Participant, ProjectParams, CalculationResults, PortageFormulaParams } from '../utils/calculatorUtils';
import { DEFAULT_PORTAGE_FORMULA } from '../utils/calculatorUtils';

export interface Payback {
  date: Date;
  buyer: string;
  amount: number;
  type: 'portage' | 'copro';
  description: string;
}

/**
 * Hook to calculate expected paybacks for a participant
 * Includes both portage lot sales and copropriété redistributions
 * 
 * For copro sales, recalculates the redistribution amount with renovation costs excluded
 * when the sale happens before renovationStartDate.
 */
export function useExpectedPaybacks(
  participant: Participant,
  allParticipants: Participant[],
  deedDate: string,
  coproReservesShare: number = 30,
  projectParams?: ProjectParams,
  calculations?: CalculationResults,
  formulaParams?: PortageFormulaParams
): { paybacks: Payback[]; totalRecovered: number } {
  return useMemo(() => {
    // 1. Find all participants buying portage lots from this participant
    const portagePaybacks: Payback[] = allParticipants
      .filter((buyer) => buyer.purchaseDetails?.buyingFrom === participant.name)
      .map((buyer) => ({
        date: buyer.entryDate || new Date(deedDate),
        buyer: buyer.name,
        amount: buyer.purchaseDetails?.purchasePrice || 0,
        type: 'portage' as const,
        description: 'Achat de lot portage'
      }));

    // 2. Calculate copropriété redistributions for this participant
    // Recalculate with renovation cost exclusion logic when needed
    const effectiveFormulaParams = formulaParams || DEFAULT_PORTAGE_FORMULA;
    const participantsShare = 1 - (coproReservesShare / 100);
    
    // Prepare data for recalculation (if available)
    // totalProjectCost = purchase + notary fees + construction costs
    // (excludes shared costs which are ongoing operational expenses)
    const totalProjectCost = calculations?.totals
      ? (calculations.totals.purchase || 0) +
        (calculations.totals.totalDroitEnregistrements || 0) +
        (calculations.totals.construction || 0)
      : 0;
    const totalBuildingSurface = calculations?.totalSurface || 0;
    const renovationStartDate = projectParams?.renovationStartDate;
    
    // Calculate total renovation costs (CASCO + parachèvements) from all participants
    const totalRenovationCosts = calculations?.participantBreakdown
      ? calculations.participantBreakdown.reduce(
          (sum, p) => sum + (p.personalRenovationCost || 0),
          0
        )
      : 0;
    
    const deedDateObj = new Date(deedDate);
    
    const coproSales: CoproSale[] = allParticipants
      .filter((buyer) => buyer.purchaseDetails?.buyingFrom === 'Copropriété')
      .map((buyer) => {
        // Ensure saleDate is a Date object
        const saleDate = buyer.entryDate 
          ? (buyer.entryDate instanceof Date ? buyer.entryDate : new Date(buyer.entryDate))
          : deedDateObj;
        const surfacePurchased = buyer.surface || 0;
        const yearsHeld = calculateYearsHeld(deedDateObj, saleDate);
        
        // Try to recalculate with renovation cost exclusion if we have the necessary data
        let amountToParticipants: number;
        
        if (
          totalProjectCost > 0 &&
          totalBuildingSurface > 0 &&
          surfacePurchased > 0 &&
          renovationStartDate &&
          totalRenovationCosts > 0
        ) {
          // Recalculate copro sale price with renovation cost exclusion logic
          const coproSalePricing = calculateCoproSalePrice(
            surfacePurchased,
            totalProjectCost,
            totalBuildingSurface,
            yearsHeld,
            effectiveFormulaParams,
            0, // Carrying costs - simplified (could be calculated from projectFinancials if available)
            renovationStartDate,
            saleDate,
            totalRenovationCosts
          );
          
          // Use the recalculated toParticipants amount
          amountToParticipants = coproSalePricing.distribution.toParticipants;
        } else {
          // Fallback to stored purchasePrice if we don't have enough data to recalculate
          const totalPrice = buyer.purchaseDetails?.purchasePrice || 0;
          amountToParticipants = totalPrice * participantsShare;
        }
        
        return {
          buyer: buyer.name,
          entryDate: saleDate,
          amount: amountToParticipants
        };
      });

    const coproRedistributions = calculateCoproRedistributionForParticipant(
      participant,
      coproSales,
      allParticipants,
      deedDateObj
    );

    // 3. Combine and sort all paybacks by date
    const allPaybacks = [...portagePaybacks, ...coproRedistributions]
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // 4. Calculate total
    const totalRecovered = allPaybacks.reduce((sum, pb) => sum + pb.amount, 0);

    return {
      paybacks: allPaybacks,
      totalRecovered
    };
  }, [
    participant,
    allParticipants,
    deedDate,
    coproReservesShare,
    projectParams?.renovationStartDate, // Explicit dependency on renovationStartDate - triggers recalculation when changed
    projectParams, // Also include parent object for broader changes
    calculations?.totals?.purchase, // Explicit dependencies on the values we use
    calculations?.totals?.totalDroitEnregistrements,
    calculations?.totals?.construction,
    calculations?.totalSurface,
    calculations?.participantBreakdown, // Array reference - changes when participants change
    formulaParams
  ]);
}
