import { formatCurrency } from '../../utils/formatting';
import type { Participant, ParticipantCalculation, ProjectParams } from '../../utils/calculatorUtils';
import { getFraisGenerauxBreakdown, calculateExpenseCategoriesTotal, calculateTotalTravauxCommuns, type UnitDetails } from '../../utils/calculatorUtils';

interface CostBreakdownGridProps {
  participant: Participant;
  participantCalc: ParticipantCalculation;
  projectParams?: ProjectParams;
  allParticipants?: Participant[];
  unitDetails?: UnitDetails;
}

/**
 * Calculate quotité for a founder as (founder's surface at T0) / (total surface of all founders at T0)
 * Returns the quotité formatted as "integer/1000" (e.g., "450/1000")
 */
function calculateQuotiteForFounder(
  founder: Participant,
  allParticipants?: Participant[]
): string | null {
  if (!founder.isFounder || !allParticipants) {
    return null;
  }

  const founderSurface = founder.surface || 0;
  if (founderSurface === 0) {
    return null;
  }

  // Calculate total surface of all founders at T0
  const totalFounderSurface = allParticipants
    .filter(p => p.isFounder === true)
    .reduce((sum, p) => sum + (p.surface || 0), 0);

  if (totalFounderSurface === 0) {
    return null;
  }

  // Calculate quotité as a fraction
  const quotite = founderSurface / totalFounderSurface;
  
  // Convert to "integer/1000" format
  // Multiply by 1000 and round to nearest integer
  const numerator = Math.round(quotite * 1000);
  const denominator = 1000;

  // Simplify the fraction if possible (find GCD)
  const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b);
  const divisor = gcd(numerator, denominator);
  const simplifiedNumerator = numerator / divisor;
  const simplifiedDenominator = denominator / divisor;

  return `${simplifiedNumerator}/${simplifiedDenominator}`;
}

/**
 * Displays a grid of cost breakdown cards
 * Shows purchase share, CASCO, commun costs, droit d'enregistrements, frais de notaire, and parachèvements
 * 
 * For founders, also displays quotité (ownership share) below the purchase share amount.
 * Quotité is calculated as: (founder's surface at T0) / (total surface of all founders at T0)
 * Expressed as "integer/1000" format (e.g., "450/1000")
 */
export function CostBreakdownGrid({ participant, participantCalc: p, projectParams, allParticipants, unitDetails }: CostBreakdownGridProps) {

  // Calculate quotité for founders
  const quotite = calculateQuotiteForFounder(participant, allParticipants);

  // Calculate frais généraux breakdown if data is available
  const fraisGenerauxBreakdown = projectParams && allParticipants && unitDetails
    ? getFraisGenerauxBreakdown(allParticipants, projectParams, unitDetails)
    : null;

  // Calculate expense categories total per participant
  const expenseCategoriesTotal = projectParams?.expenseCategories
    ? calculateExpenseCategoriesTotal(projectParams.expenseCategories) / (allParticipants?.length || 1)
    : 0;

  // Calculate travaux communs total per participant
  const travauxCommunsPerParticipant = projectParams && allParticipants
    ? calculateTotalTravauxCommuns(projectParams) / allParticipants.length
    : 0;

  return (
    <div className="mb-6">
  
        <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">
          Décomposition des Coûts
        </p>
      
        <div className="grid grid-cols-3 gap-3">
        {/* Purchase Share */}
        <div className="bg-white rounded-lg p-3 border border-gray-200">
          <p className="text-xs text-gray-500 mb-1">Part d'achat</p>
          <p className="text-lg font-bold text-gray-900">{formatCurrency(p.purchaseShare)}</p>
          <p className="text-xs text-blue-600 mt-0.5">{p.surface}m²</p>
          {quotite && (
            <p className="text-xs text-gray-500 mt-0.5">Quotité: {quotite}</p>
          )}
        </div>

        {/* Commun */}
        <div className="bg-white rounded-lg p-3 border border-purple-200">
          <p className="text-xs text-gray-500 mb-1">Commun</p>
          <p className="text-lg font-bold text-purple-700">{formatCurrency(p.sharedCosts + travauxCommunsPerParticipant)}</p>
          {(expenseCategoriesTotal > 0 || fraisGenerauxBreakdown || travauxCommunsPerParticipant > 0) && (
            <div className="mt-2 pt-2 border-t border-purple-100 space-y-0.5 text-xs text-gray-600">
              {expenseCategoriesTotal > 0 && (
                <div className="flex justify-between">
                  <span>Infrastructures</span>
                  <span className="font-medium">{formatCurrency(expenseCategoriesTotal)}</span>
                </div>
              )}
              {travauxCommunsPerParticipant > 0 && (
                <div className="flex justify-between">
                  <span>Travaux communs</span>
                  <span className="font-medium">{formatCurrency(travauxCommunsPerParticipant)}</span>
                </div>
              )}
              {fraisGenerauxBreakdown && (
                <>
                  <div className="flex justify-between">
                    <span>Honoraires</span>
                    <span className="font-medium">{formatCurrency(fraisGenerauxBreakdown.honorairesTotal3Years / allParticipants!.length)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Frais 3 ans</span>
                    <span className="font-medium">{formatCurrency(fraisGenerauxBreakdown.recurringTotal3Years / allParticipants!.length)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Ponctuels</span>
                    <span className="font-medium">{formatCurrency(fraisGenerauxBreakdown.oneTimeCosts.total / allParticipants!.length)}</span>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* CASCO */}
        <div className="bg-white rounded-lg p-3 border border-orange-200">
          <p className="text-xs text-gray-500 mb-1">CASCO</p>
          <p className="text-lg font-bold text-orange-700">{formatCurrency(p.casco)}</p>
          <p className="text-xs text-orange-500 mt-0.5">{participant.cascoSqm || p.surface}m²</p>
        </div>

        {/* Droit d'enregistrements (Registration Fees) */}
        <div className="bg-white rounded-lg p-3 border border-gray-200">
          <p className="text-xs text-gray-500 mb-1">Droit d'enregistrements</p>
          <p className="text-lg font-bold text-gray-900">{formatCurrency(p.droitEnregistrements)}</p>
          <p className="text-xs text-gray-400 mt-0.5">{p.registrationFeesRate}%</p>
        </div>

        {/* Frais de notaire (Fixed Notary Fees) */}
        <div className="bg-white rounded-lg p-3 border border-gray-200">
          <p className="text-xs text-gray-500 mb-1">Frais de notaire</p>
          <p className="text-lg font-bold text-gray-900">{formatCurrency(p.fraisNotaireFixe)}</p>
          <p className="text-xs text-gray-400 mt-0.5">{p.quantity} lot{(p.quantity || 1) > 1 ? 's' : ''}</p>
        </div>

        {/* Parachèvements */}
        <div className="bg-white rounded-lg p-3 border border-orange-200">
          <p className="text-xs text-gray-500 mb-1">Parachèvements</p>
          <p className="text-lg font-bold text-orange-700">{formatCurrency(p.parachevements)}</p>
          <p className="text-xs text-orange-500 mt-0.5">
            {participant.parachevementsSqm || p.surface}m²
          </p>
        </div>
      </div>
    
    </div>
  );
}
