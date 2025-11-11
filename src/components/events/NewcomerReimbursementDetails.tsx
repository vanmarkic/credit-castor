import type { NewcomerFraisGenerauxReimbursementEvent } from '../../types/timeline';
import { formatCurrency } from '../../utils/formatting';

interface NewcomerReimbursementDetailsProps {
  event: NewcomerFraisGenerauxReimbursementEvent;
}

/**
 * Displays detailed information when a newcomer reimburses founders
 * for Year 1 frais généraux overpayment
 */
export function NewcomerReimbursementDetails({ event }: NewcomerReimbursementDetailsProps) {
  const { newcomerName, reimbursements, totalPaid, year, description } = event;

  return (
    <div className="space-y-2 text-sm">
      <div className="font-semibold text-emerald-900">
        {newcomerName} - Frais Généraux Reimbursement
      </div>

      <div className="text-xs text-gray-600 italic">
        {description}
      </div>

      {/* Total Paid */}
      <div className="bg-emerald-50 p-2 rounded border border-emerald-200">
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-600 font-medium">Total Paid (Year {year})</span>
          <span className="text-sm font-bold text-emerald-800">
            {formatCurrency(totalPaid)}
          </span>
        </div>
      </div>

      {/* Reimbursement Breakdown */}
      <div className="mt-3 pt-3 border-t border-gray-200">
        <div className="text-xs text-gray-600 font-medium mb-2">Reimbursements</div>
        <div className="space-y-1">
          {reimbursements.map((reimb, idx) => (
            <div
              key={idx}
              className="flex justify-between items-center text-xs bg-gray-50 px-2 py-1 rounded"
            >
              <span className="text-gray-700">
                To {reimb.toParticipant}
              </span>
              <span className="font-medium text-gray-900">
                {formatCurrency(reimb.amount)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Explanation */}
      <div className="mt-2 text-xs text-gray-500 italic bg-gray-50 p-2 rounded">
        💡 Newcomers reimburse existing participants for their overpayment.
        Costs are recalculated to split equally among all active participants.
      </div>
    </div>
  );
}
