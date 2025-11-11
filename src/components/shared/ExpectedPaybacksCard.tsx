import { formatCurrency } from '../../utils/formatting';
import { FormulaTooltip } from '../FormulaTooltip';
import { getExpectedPaybacksFormula } from '../../utils/formulaExplanations';
import { useExpectedPaybacks } from '../../hooks/useExpectedPaybacks';
import type { Participant } from '../../utils/calculatorUtils';

interface ExpectedPaybacksCardProps {
  participant: Participant;
  allParticipants: Participant[];
  deedDate: string;
  /** Optional CSS class for custom styling */
  className?: string;
}

/**
 * Displays expected paybacks for a participant
 * Includes both portage lot sales and copropriété redistributions
 */
export function ExpectedPaybacksCard({
  participant,
  allParticipants,
  deedDate,
  className = ''
}: ExpectedPaybacksCardProps) {
  const { paybacks, totalRecovered } = useExpectedPaybacks(
    participant,
    allParticipants,
    deedDate
  );

  // Don't render if no paybacks
  if (paybacks.length === 0) {
    return null;
  }

  return (
    <div className={`p-4 bg-purple-50 rounded-lg border border-purple-200 ${className}`}>
      <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-3">
        💰 Remboursements attendus
      </p>

      <div className="space-y-2">
        {paybacks.map((pb, idx) => (
          <div key={idx} className="bg-white rounded-lg p-3 border border-purple-100">
            <div className="flex justify-between items-center mb-1">
              <div>
                <span className="font-medium text-gray-800">{pb.buyer}</span>
                <span className="text-gray-600 text-xs ml-2">
                  ({new Date(pb.date).toLocaleDateString('fr-BE', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })})
                </span>
              </div>
              <div className="font-bold text-purple-700">
                {formatCurrency(pb.amount)}
              </div>
            </div>
            <div className="text-xs text-gray-500">
              {pb.type === 'portage' ? '💼 ' : '🏢 '}{pb.description}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 pt-3 border-t border-purple-300 flex justify-between items-center">
        <span className="text-sm font-semibold text-gray-800">Total récupéré</span>
        <span className="text-lg font-bold text-purple-800">
          <FormulaTooltip formula={getExpectedPaybacksFormula(totalRecovered, paybacks.length)}>
            {formatCurrency(totalRecovered)}
          </FormulaTooltip>
        </span>
      </div>

      <p className="text-xs text-purple-600 mt-2">
        Ces montants seront versés lorsque les nouveaux participants entreront dans le projet.
      </p>
    </div>
  );
}
