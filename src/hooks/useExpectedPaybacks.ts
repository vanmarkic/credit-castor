import { useMemo } from 'react';
import { calculateCoproRedistributionForParticipant, type CoproSale } from '../utils/coproRedistribution';
import type { Participant } from '../utils/calculatorUtils';

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
 */
export function useExpectedPaybacks(
  participant: Participant,
  allParticipants: Participant[],
  deedDate: string
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
    const coproSales: CoproSale[] = allParticipants
      .filter((buyer) => buyer.purchaseDetails?.buyingFrom === 'Copropriété')
      .map((buyer) => ({
        buyer: buyer.name,
        entryDate: buyer.entryDate || new Date(deedDate),
        amount: buyer.purchaseDetails?.purchasePrice || 0
      }));

    const coproRedistributions = calculateCoproRedistributionForParticipant(
      participant,
      coproSales,
      allParticipants,
      new Date(deedDate)
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
  }, [participant, allParticipants, deedDate]);
}
