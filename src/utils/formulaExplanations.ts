/**
 * Formula explanation utilities for real estate calculator
 * Returns human-readable formula explanations for tooltips
 */

import type { ParticipantCalculation, CalculationTotals } from './calculatorUtils';
import type { PortageLotPrice } from './portageCalculations';

/**
 * Get formula explanation for total cost calculation
 */
export function getTotalCostFormula(p: ParticipantCalculation): string[] {
  return [
    "Coût total pour ce participant",
    `Achat €${p.purchaseShare.toLocaleString()} + Notaire €${p.notaryFees.toLocaleString()} + Construction €${p.constructionCost.toLocaleString()} + Commun €${p.sharedCosts.toLocaleString()}`
  ];
}

/**
 * Get formula explanation for purchase share calculation
 */
export function getPurchaseShareFormula(p: ParticipantCalculation, pricePerM2: number): string[] {
  return [
    "Votre part de l'achat du bâtiment",
    `€${pricePerM2.toFixed(2)}/m² × ${p.surface}m² = €${p.purchaseShare.toLocaleString()}`
  ];
}

/**
 * Get formula explanation for notary fees calculation
 */
export function getNotaryFeesFormula(p: ParticipantCalculation): string[] {
  return [
    "Frais de notaire belges pour le transfert",
    `€${p.purchaseShare.toLocaleString()} achat × ${p.notaryFeesRate}% taux = €${p.notaryFees.toLocaleString()}`
  ];
}

/**
 * Get formula explanation for personal renovation costs (CASCO + Parachèvements)
 */
export function getPersonalRenovationFormula(p: ParticipantCalculation): string[] {
  return [
    "CASCO + Parachèvements pour vos unités",
    `€${p.casco.toLocaleString()} CASCO + €${p.parachevements.toLocaleString()} parachèvements = €${p.personalRenovationCost.toLocaleString()}`
  ];
}

/**
 * Get formula explanation for construction cost calculation
 */
export function getConstructionCostFormula(
  p: ParticipantCalculation,
  totalConstruction: number,
  totalUnits: number
): string[] {
  return [
    "Votre part des coûts de construction partagés",
    `€${totalConstruction.toLocaleString()} total ÷ ${totalUnits} unités × ${p.quantity} quantité = €${p.constructionCost.toLocaleString()}`
  ];
}

/**
 * Get formula explanation for shared costs calculation
 */
export function getSharedCostsFormula(p: ParticipantCalculation, participantCount: number): string[] {
  return [
    "Votre part des frais communs du projet",
    `Infrastructure + Études + Frais généraux ÷ ${participantCount} participants = €${p.sharedCosts.toLocaleString()}`
  ];
}

/**
 * Get formula explanation for loan amount needed
 */
export function getLoanNeededFormula(p: ParticipantCalculation): string[] {
  return [
    "Montant à emprunter",
    `€${p.totalCost.toLocaleString()} coût total - €${p.capitalApporte.toLocaleString()} capital = €${p.loanNeeded.toLocaleString()} emprunt`
  ];
}

/**
 * Get formula explanation for monthly payment calculation
 */
export function getMonthlyPaymentFormula(p: ParticipantCalculation): string[] {
  return [
    "Remboursement mensuel du prêt",
    `€${p.loanNeeded.toLocaleString()} emprunt à ${p.interestRate}% sur ${p.durationYears} ans`,
    "PMT(taux/12, années×12, -principal)"
  ];
}

/**
 * Get formula explanation for price per m² calculation
 */
export function getPricePerM2Formula(totals: CalculationTotals, totalSurface: number): string[] {
  return [
    "Prix moyen par mètre carré",
    `€${totals.purchase.toLocaleString()} achat total ÷ ${totalSurface}m² surface totale`
  ];
}

/**
 * Get formula explanation for total project cost
 */
export function getTotalProjectCostFormula(): string[] {
  return [
    "Somme de toutes les dépenses du projet",
    "Achat + Notaire + Construction + Commun"
  ];
}

/**
 * Get formula explanation for total loans
 */
export function getTotalLoansFormula(): string[] {
  return [
    "Somme de tous les emprunts des participants",
    "Total de tous les montants d'emprunt individuels"
  ];
}

/**
 * Get formula explanation for CASCO (structural work) cost
 */
export function getCascoFormula(p: ParticipantCalculation, cascoSqm: number | undefined, globalCascoPerM2: number): string[] {
  const sqm = cascoSqm ?? p.surface;
  return [
    "Coût CASCO (gros œuvre)",
    `${sqm}m² × €${globalCascoPerM2}/m² = €${p.casco.toLocaleString()}`
  ];
}

/**
 * Get formula explanation for Parachèvements (finishing work) cost
 */
export function getParachevementsFormula(p: ParticipantCalculation, parachevementsSqm: number | undefined, parachevementsPerM2: number | undefined): string[] {
  const sqm = parachevementsSqm ?? p.surface;
  const perM2 = parachevementsPerM2 ?? 0;
  return [
    "Coût Parachèvements (finitions)",
    `${sqm}m² × €${perM2}/m² = €${p.parachevements.toLocaleString()}`
  ];
}

/**
 * Get formula explanation for Travaux Communs (common building works)
 */
export function getTravauxCommunsFormula(p: ParticipantCalculation): string[] {
  return [
    "Travaux communs du bâtiment par unité",
    `Fondations + Structure + Travaux copro ÷ participants × ${p.quantity || 1} unité(s)`,
    `= €${p.travauxCommunsPerUnit.toLocaleString()}`
  ];
}

/**
 * Get formula explanation for total repayment (principal + interest)
 */
export function getTotalRepaymentFormula(p: ParticipantCalculation): string[] {
  return [
    "Montant total remboursé sur la durée du prêt",
    `€${p.monthlyPayment.toLocaleString()} mensuel × ${p.durationYears} ans × 12 mois = €${p.totalRepayment.toLocaleString()}`
  ];
}

/**
 * Get formula explanation for total interest (cost of credit)
 */
export function getTotalInterestFormula(p: ParticipantCalculation): string[] {
  return [
    "Intérêts totaux payés (coût du crédit)",
    `€${p.totalRepayment.toLocaleString()} total remboursé - €${p.loanNeeded.toLocaleString()} principal = €${p.totalInterest.toLocaleString()}`
  ];
}

/**
 * Get formula explanation for expected paybacks total
 */
export function getExpectedPaybacksFormula(totalRecovered: number, paybackCount: number): string[] {
  return [
    "Revenus attendus du portage & ventes copropriété",
    `Somme de ${paybackCount} paiement(s) = €${totalRecovered.toLocaleString()}`,
    "Reçus lorsque de nouveaux participants rejoignent"
  ];
}

/**
 * Get formula explanation for portage lot price calculation
 */
export function getPortageLotPriceFormula(
  price: PortageLotPrice,
  yearsHeld: number,
  indexationRate: number
): string[] {
  return [
    "Calcul du prix de vente du lot en portage",
    `Base acquisition (achat+notaire+casco): €${price.basePrice.toLocaleString()}`,
    `Indexation (${indexationRate}% × ${yearsHeld.toFixed(1)} ans): €${price.indexation.toLocaleString()}`,
    `Frais de portage (${yearsHeld.toFixed(1)} ans): €${price.carryingCostRecovery.toLocaleString()}`,
    `Prix total: €${price.totalPrice.toLocaleString()}`
  ];
}

/**
 * Get formula explanation for portage construction payment configuration
 */
export function getPortageConstructionPaymentFormula(
  founderPaysCasco: boolean,
  founderPaysParachèvement: boolean,
  casco: number,
  parachevements: number
): string[] {
  if (founderPaysParachèvement && founderPaysCasco) {
    return [
      "Configuration de paiement de construction",
      "Le porteur (fondateur) a payé CASCO et parachèvement pendant la période de portage",
      `CASCO: €${casco.toLocaleString()} (récupéré via le prix de portage)`,
      `Parachèvement: €${parachevements.toLocaleString()} (récupéré via le prix de portage)`,
      "L'acheteur ne paie PAS ces coûts séparément - ils sont déjà inclus dans le prix d'achat du lot"
    ];
  } else if (founderPaysCasco && !founderPaysParachèvement) {
    return [
      "Configuration de paiement de construction",
      "Le porteur (fondateur) a payé le CASCO pendant la période de portage",
      `CASCO: €${casco.toLocaleString()} (récupéré via le prix de portage)`,
      `Parachèvement: €${parachevements.toLocaleString()} (payé par l'acheteur)`,
      "L'acheteur ne paie PAS le CASCO séparément, mais PAIE pour le parachèvement"
    ];
  } else {
    return [
      "Configuration de paiement de construction",
      "L'acheteur paie pour tous les travaux de construction",
      `CASCO: €${casco.toLocaleString()} (payé par l'acheteur)`,
      `Parachèvement: €${parachevements.toLocaleString()} (payé par l'acheteur)`,
      "Le prix de portage couvre seulement l'achat initial + frais de portage"
    ];
  }
}

/**
 * Get formula explanation for buyer's construction cost adjustment (portage)
 */
export function getBuyerConstructionCostAdjustmentFormula(
  originalCasco: number,
  originalParachevements: number,
  adjustedCasco: number,
  adjustedParachevements: number,
  founderPaysCasco: boolean,
  founderPaysParachèvement: boolean
): string[] {
  const cascoReduction = originalCasco - adjustedCasco;
  const parachevementsReduction = originalParachevements - adjustedParachevements;

  if (cascoReduction > 0 || parachevementsReduction > 0) {
    const lines = [
      "Ajustement des coûts de construction (achat de portage)",
      "Pour éviter de payer deux fois:"
    ];

    if (founderPaysCasco) {
      lines.push(`CASCO: €${originalCasco.toLocaleString()} → €${adjustedCasco.toLocaleString()} (payé par porteur)`);
    }
    if (founderPaysParachèvement) {
      lines.push(`Parachèvement: €${originalParachevements.toLocaleString()} → €${adjustedParachevements.toLocaleString()} (payé par porteur)`);
    }

    const totalReduction = cascoReduction + parachevementsReduction;
    lines.push(`Économie totale: €${totalReduction.toLocaleString()}`);

    return lines;
  }

  return [
    "Aucun ajustement de coût de construction",
    "L'acheteur paie tous les coûts de construction séparément"
  ];
}
