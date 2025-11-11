import { useMemo } from 'react';
import type { Participant } from '../utils/calculatorUtils';

export interface CoproSale {
  date: Date;
  buyer: string;
  amount: number;
  toReserves: number;
  toParticipants: number;
  description: string;
}

/**
 * Hook to calculate expected sales for the copropriété
 * Shows all lots sold to newcomers from copropriété inventory
 */
export function useCoproExpectedSales(
  allParticipants: Participant[],
  deedDate: string,
  coproReservesShare: number = 30
): { sales: CoproSale[]; totalRevenue: number; totalToReserves: number; totalToParticipants: number } {
  return useMemo(() => {
    const reservePercentage = coproReservesShare / 100;
    const participantsPercentage = 1 - reservePercentage;

    // Find all participants buying from copropriété
    const sales: CoproSale[] = allParticipants
      .filter((buyer) => buyer.purchaseDetails?.buyingFrom === 'Copropriété')
      .map((buyer) => {
        const totalAmount = buyer.purchaseDetails?.purchasePrice || 0;
        const toReserves = totalAmount * reservePercentage;
        const toParticipants = totalAmount * participantsPercentage;

        return {
          date: buyer.entryDate || new Date(deedDate),
          buyer: buyer.name,
          amount: totalAmount,
          toReserves,
          toParticipants,
          description: `Vente de lot ${buyer.purchaseDetails?.lotId || '?'} (${buyer.surface || 0}m²)`
        };
      })
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    const totalRevenue = sales.reduce((sum, sale) => sum + sale.amount, 0);
    const totalToReserves = sales.reduce((sum, sale) => sum + sale.toReserves, 0);
    const totalToParticipants = sales.reduce((sum, sale) => sum + sale.toParticipants, 0);

    return {
      sales,
      totalRevenue,
      totalToReserves,
      totalToParticipants
    };
  }, [allParticipants, deedDate, coproReservesShare]);
}
