import { formatCurrency } from '../../utils/formatting';
import type { Participant, ParticipantCalculation } from '../../utils/calculatorUtils';

interface CostBreakdownGridProps {
  participant: Participant;
  participantCalc: ParticipantCalculation;
}

/**
 * Displays a grid of cost breakdown cards
 * Shows purchase share, CASCO, commun costs, notary fees, and parachèvements
 */
export function CostBreakdownGrid({ participant, participantCalc: p }: CostBreakdownGridProps) {
  return (
    <div className="mb-6">
      <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-2">
        Décomposition des Coûts
      </p>
      <div className="grid grid-cols-3 gap-3">
        {/* Purchase Share */}
        <div className="bg-white rounded-lg p-3 border border-gray-200">
          <p className="text-xs text-gray-500 mb-1">Part d'achat</p>
          <p className="text-lg font-bold text-gray-900">{formatCurrency(p.purchaseShare)}</p>
          <p className="text-xs text-blue-600 mt-0.5">{p.surface}m²</p>
        </div>

        {/* CASCO */}
        <div className="bg-white rounded-lg p-3 border border-orange-200">
          <p className="text-xs text-gray-500 mb-1">CASCO</p>
          <p className="text-lg font-bold text-orange-700">{formatCurrency(p.casco)}</p>
          <p className="text-xs text-orange-500 mt-0.5">{participant.cascoSqm || p.surface}m²</p>
        </div>

        {/* Commun */}
        <div className="bg-white rounded-lg p-3 border border-purple-200">
          <p className="text-xs text-gray-500 mb-1">Commun</p>
          <p className="text-lg font-bold text-purple-700">{formatCurrency(p.sharedCosts)}</p>
        </div>

        {/* Notary Fees */}
        <div className="bg-white rounded-lg p-3 border border-gray-200">
          <p className="text-xs text-gray-500 mb-1">Frais notaire</p>
          <p className="text-lg font-bold text-gray-900">{formatCurrency(p.notaryFees)}</p>
          <p className="text-xs text-gray-400 mt-0.5">{p.notaryFeesRate}%</p>
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
