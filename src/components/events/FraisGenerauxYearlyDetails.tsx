import type { FraisGenerauxYearlyEvent } from '../../types/timeline';
import { formatCurrency } from '../../utils/formatting';
import { useState } from 'react';

interface FraisGenerauxYearlyDetailsProps {
  event: FraisGenerauxYearlyEvent;
}

/**
 * Displays detailed information for a yearly frais généraux payment
 * Year 1 is expanded by default, Years 2-3 are collapsed
 */
export function FraisGenerauxYearlyDetails({ event }: FraisGenerauxYearlyDetailsProps) {
  const [isExpanded, setIsExpanded] = useState(event.year === 1);

  const { breakdown, payments, year } = event;

  return (
    <div className="space-y-2 text-sm">
      <div className="flex justify-between items-center">
        <div className="font-semibold text-purple-900">
          Frais Généraux - Year {year}
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-xs text-purple-600 hover:text-purple-800 font-medium"
        >
          {isExpanded ? '▼ Collapse' : '► Expand'}
        </button>
      </div>

      {/* Summary always visible */}
      <div className="bg-purple-50 p-2 rounded">
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-600 font-medium">Total</span>
          <span className="text-sm font-bold text-purple-800">
            {formatCurrency(breakdown.total)}
          </span>
        </div>
        <div className="text-xs text-gray-500 mt-1">
          Split among {payments.length} participant{payments.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Expanded details */}
      {isExpanded && (
        <>
          {/* Cost Breakdown */}
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="text-xs text-gray-600 font-medium mb-2">Cost Breakdown</div>
            <div className="space-y-1 text-xs">
              {breakdown.oneTimeCosts > 0 && (
                <div className="flex justify-between bg-green-50 px-2 py-1 rounded">
                  <span className="text-gray-700">One-time costs:</span>
                  <span className="font-medium text-green-700">
                    {formatCurrency(breakdown.oneTimeCosts)}
                  </span>
                </div>
              )}
              <div className="flex justify-between bg-amber-50 px-2 py-1 rounded">
                <span className="text-gray-700">Recurring Year {year}:</span>
                <span className="font-medium text-amber-700">
                  {formatCurrency(breakdown.recurringYearlyCosts)}
                </span>
              </div>
              <div className="flex justify-between bg-blue-50 px-2 py-1 rounded">
                <span className="text-gray-700">Honoraires (÷ 3):</span>
                <span className="font-medium text-blue-700">
                  {formatCurrency(breakdown.honorairesThisYear)}
                </span>
              </div>
            </div>
          </div>

          {/* Participant Payments */}
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="text-xs text-gray-600 font-medium mb-2">
              Payments{year === 1 ? ' (Founders only)' : ''}
            </div>
            <div className="space-y-1">
              {payments.map((payment, idx) => (
                <div
                  key={idx}
                  className="flex justify-between items-center text-xs bg-gray-50 px-2 py-1 rounded"
                >
                  <span className="text-gray-700">
                    {payment.participantName}
                    {payment.isFounder && year === 1 && (
                      <span className="ml-1 text-purple-600 font-medium">(Founder)</span>
                    )}
                  </span>
                  <span className="font-medium text-gray-900">
                    {formatCurrency(payment.amountOwed)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
