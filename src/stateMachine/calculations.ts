import type { IndexRate, Lot, Participant, ProjectContext, CarryingCosts, ParticipantCosts, VotingRules, VotingResults, ParticipantVote } from './types';

/**
 * Calculate indexation growth using Belgian legal index
 */
export function calculateIndexation(
  acquisitionDate: Date,
  saleDate: Date,
  indexRates: IndexRate[]
): number {
  const yearsHeld = (saleDate.getTime() - acquisitionDate.getTime()) / (1000 * 60 * 60 * 24 * 365);
  const acquisitionYear = acquisitionDate.getFullYear();

  let indexedValue = 1;
  for (let yearOffset = 0; yearOffset < Math.floor(yearsHeld); yearOffset++) {
    const targetYear = acquisitionYear + yearOffset;
    const rateData = indexRates.find(r => r.year === targetYear);
    const rate = rateData?.rate || 1.02; // Fallback to 2%
    indexedValue *= rate;
  }

  // Handle partial year
  const partialYear = yearsHeld - Math.floor(yearsHeld);
  if (partialYear > 0) {
    const targetYear = acquisitionYear + Math.floor(yearsHeld);
    const rateData = indexRates.find(r => r.year === targetYear);
    const nextRate = rateData?.rate || 1.02;
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

/**
 * Calculate first loan amount (purchase loan)
 * Covers: 100% purchase + fees + common + 1/3 construction
 */
export function calculateFirstLoanAmount(costs: ParticipantCosts): number {
  const constructionCosts = costs.casco + costs.parachevements;

  return (
    costs.partAchat +
    costs.droitEnregistrement +
    costs.travauxCommuns +
    (constructionCosts / 3)
  );
}

/**
 * Calculate second loan amount (renovation loan)
 * Covers: 2/3 of construction costs
 */
export function calculateSecondLoanAmount(costs: ParticipantCosts): number {
  const constructionCosts = costs.casco + costs.parachevements;
  return (constructionCosts * 2) / 3;
}

/**
 * Calculate total financing needed (single loan or sum of split loans)
 */
export function calculateTotalFinancing(costs: ParticipantCosts): number {
  return (
    costs.partAchat +
    costs.droitEnregistrement +
    costs.travauxCommuns +
    costs.casco +
    costs.parachevements
  );
}

/**
 * Calculate interest savings from split loan strategy
 * @param costs - Participant's total costs
 * @param interestRate - Annual interest rate (e.g., 0.035 for 3.5%)
 * @param monthsDelayed - Months between first and second loan (typically 18-24)
 */
export function calculateSplitLoanSavings(
  costs: ParticipantCosts,
  interestRate: number,
  monthsDelayed: number
): number {
  const secondLoanAmount = calculateSecondLoanAmount(costs);

  // Interest saved by not borrowing second loan amount immediately
  const monthlyInterestRate = interestRate / 12;
  const interestSaved = secondLoanAmount * monthlyInterestRate * monthsDelayed;

  return interestSaved;
}

/**
 * Calculate voting results based on voting method
 */
export function calculateVotingResults(
  votes: Map<string, ParticipantVote>,
  votingRules: VotingRules,
  totalParticipants: number,
  totalQuotitePossible: number = 1.0
): VotingResults {
  // Democratic counting
  const totalVoters = votes.size;
  const votesFor = Array.from(votes.values()).filter(v => v.vote === 'for').length;
  const votesAgainst = Array.from(votes.values()).filter(v => v.vote === 'against').length;
  const abstentions = Array.from(votes.values()).filter(v => v.vote === 'abstain').length;

  // Quotité-weighted counting
  const quotiteFor = Array.from(votes.values())
    .filter(v => v.vote === 'for')
    .reduce((sum, v) => sum + v.quotite, 0);

  const quotiteAgainst = Array.from(votes.values())
    .filter(v => v.vote === 'against')
    .reduce((sum, v) => sum + v.quotite, 0);

  const quotiteAbstained = Array.from(votes.values())
    .filter(v => v.vote === 'abstain')
    .reduce((sum, v) => sum + v.quotite, 0);

  const totalQuotite = quotiteFor + quotiteAgainst + quotiteAbstained;

  // Calculate majorities
  const democraticMajority = votesFor > (totalVoters * (votingRules.majorityPercentage / 100));
  const quotiteMajority = quotiteFor > (totalQuotite * (votingRules.majorityPercentage / 100));

  // Quorum checks
  let quorumReached = false;
  let majorityReached = false;
  let hybridScore: number | undefined;

  switch (votingRules.method) {
    case 'one_person_one_vote':
      quorumReached = totalVoters >= (totalParticipants * (votingRules.quorumPercentage / 100));
      majorityReached = democraticMajority;
      break;

    case 'quotite_weighted':
      quorumReached = totalQuotite >= (totalQuotitePossible * (votingRules.quorumPercentage / 100));
      majorityReached = quotiteMajority;
      break;

    case 'hybrid': {
      if (!votingRules.hybridWeights) {
        throw new Error('Hybrid voting requires hybridWeights configuration');
      }

      const democraticQuorum = totalVoters >= (totalParticipants * (votingRules.quorumPercentage / 100));
      const quotiteQuorum = totalQuotite >= (totalQuotitePossible * (votingRules.quorumPercentage / 100));
      quorumReached = democraticQuorum && quotiteQuorum;

      const democraticScore = totalVoters > 0 ? votesFor / totalVoters : 0;
      const quotiteScore = totalQuotite > 0 ? quotiteFor / totalQuotite : 0;

      hybridScore =
        (democraticScore * votingRules.hybridWeights.democraticWeight) +
        (quotiteScore * votingRules.hybridWeights.quotiteWeight);

      majorityReached = hybridScore > (votingRules.majorityPercentage / 100);
      break;
    }
  }

  return {
    totalVoters,
    votesFor,
    votesAgainst,
    abstentions,
    totalQuotite,
    quotiteFor,
    quotiteAgainst,
    quotiteAbstained,
    hybridScore,
    quorumReached,
    majorityReached,
    democraticMajority,
    quotiteMajority
  };
}
