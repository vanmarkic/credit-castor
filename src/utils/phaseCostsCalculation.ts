import type { ParticipantCalculation } from './calculatorUtils';

export interface PhaseCosts {
  signature: {
    purchaseShare: number;
    registrationFees: number;
    notaryFees: number;
    total: number;
  };
  construction: {
    casco: number;
    travauxCommuns: number;
    commun: number;
    total: number;
  };
  emmenagement: {
    parachevements: number;
    total: number;
  };
  grandTotal: number;
}

/**
 * Groups participant costs by payment phase timing
 * - Signature: Paid at deed signing (purchase + notary + registration)
 * - Construction: Paid progressively during construction (CASCO + commun + travaux)
 * - Emménagement: Paid when inhabitant decides to move in (parachèvements)
 */
export function calculatePhaseCosts(p: ParticipantCalculation): PhaseCosts {
  const signature = {
    purchaseShare: p.purchaseShare ?? 0,
    registrationFees: p.droitEnregistrements ?? 0,
    notaryFees: p.fraisNotaireFixe ?? 0,
    total: 0,
  };
  signature.total = signature.purchaseShare + signature.registrationFees + signature.notaryFees;

  const construction = {
    casco: p.casco ?? 0,
    travauxCommuns: p.travauxCommunsPerUnit ?? 0,
    commun: p.sharedCosts ?? 0,
    total: 0,
  };
  construction.total = construction.casco + construction.travauxCommuns + construction.commun;

  const emmenagement = {
    parachevements: p.parachevements ?? 0,
    total: 0,
  };
  emmenagement.total = emmenagement.parachevements;

  return {
    signature,
    construction,
    emmenagement,
    grandTotal: signature.total + construction.total + emmenagement.total,
  };
}
