import type { IndexRate, Lot, Participant, ProjectContext, CarryingCosts } from './types';

/**
 * Calculate indexation growth using Belgian legal index
 */
export function calculateIndexation(
  acquisitionDate: Date,
  saleDate: Date,
  indexRates: IndexRate[]
): number {
  const yearsHeld = (saleDate.getTime() - acquisitionDate.getTime()) / (1000 * 60 * 60 * 24 * 365);

  let indexedValue = 1;
  for (let year = 0; year < Math.floor(yearsHeld); year++) {
    const rate = indexRates[year]?.rate || 1.02; // Fallback to 2%
    indexedValue *= rate;
  }

  // Handle partial year
  const partialYear = yearsHeld - Math.floor(yearsHeld);
  if (partialYear > 0) {
    const nextRate = indexRates[Math.floor(yearsHeld)]?.rate || 1.02;
    const partialGrowth = (nextRate - 1) * partialYear;
    indexedValue *= (1 + partialGrowth);
  }

  return indexedValue - 1; // Return growth percentage
}

/**
 * Calculate participant's quotité (ownership share)
 */
export function calculateQuotite(
  participant: Participant | undefined,
  context: ProjectContext
): number {
  if (!participant) return 0;

  const totalSurface = context.lots.reduce((sum, lot) => sum + lot.surface, 0);
  const participantSurface = participant.lotsOwned.reduce((sum, lot) => sum + lot.surface, 0);

  return totalSurface > 0 ? participantSurface / totalSurface : 0;
}

/**
 * Calculate carrying costs for portage lot
 */
export function calculateCarryingCosts(
  lot: Lot,
  saleDate: Date,
  context: ProjectContext
): CarryingCosts {
  if (!lot.acquisition) {
    throw new Error('Lot has no acquisition data');
  }

  const monthsHeld = (saleDate.getTime() - lot.acquisition.date.getTime()) / (1000 * 60 * 60 * 24 * 30);

  // Get participant to calculate their quotité for insurance
  const participant = context.participants.find(p =>
    p.lotsOwned.some(lo => lo.lotId === lot.id)
  );

  const quotite = calculateQuotite(participant, context);

  // Monthly costs
  const monthlyLoanInterest = calculateMonthlyLoanInterest(lot, context);
  const propertyTax = 388.38 / 12; // Annual précompte immobilier
  const buildingInsurance = (2000 * quotite) / 12; // Annual insurance × quotité
  const syndicFees = 100; // Example monthly syndic fee
  const chargesCommunes = 50; // Example monthly charges

  const total =
    (monthlyLoanInterest * monthsHeld) +
    (propertyTax * monthsHeld) +
    (buildingInsurance * monthsHeld) +
    (syndicFees * monthsHeld) +
    (chargesCommunes * monthsHeld);

  return {
    monthlyLoanInterest,
    propertyTax: propertyTax * monthsHeld,
    buildingInsurance: buildingInsurance * monthsHeld,
    syndicFees: syndicFees * monthsHeld,
    chargesCommunes: chargesCommunes * monthsHeld,
    totalMonths: monthsHeld,
    total
  };
}

/**
 * Calculate monthly loan interest
 */
function calculateMonthlyLoanInterest(
  lot: Lot,
  context: ProjectContext
): number {
  const participant = context.participants.find(p =>
    p.lotsOwned.some(lo => lo.lotId === lot.id)
  );

  if (!participant || participant.loans.length === 0) return 0;

  // Sum monthly interest from all active loans (purchase + renovation)
  return participant.loans.reduce((total, loan) => {
    return total + (loan.loanAmount * loan.interestRate) / 12;
  }, 0);
}
