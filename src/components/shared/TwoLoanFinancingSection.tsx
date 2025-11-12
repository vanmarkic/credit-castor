import type { Participant } from '../../utils/calculatorUtils';

interface TwoLoanFinancingSectionProps {
  participant: Participant;
  personalRenovationCost: number;
  validationErrors: {
    loanDelay?: string;
    renovationAmount?: string;
    capitalAllocation?: string;
  };
  onUpdateParticipant: (updated: Participant) => void;
}

/**
 * Two-loan financing configuration section
 * Allows participants to split their financing into two loans with different timings
 */
export function TwoLoanFinancingSection({
  participant,
  personalRenovationCost,
  validationErrors,
  onUpdateParticipant
}: TwoLoanFinancingSectionProps) {
  return (
    <div className="border-t pt-4 mt-4">
      <label className="flex items-center gap-2 mb-4 cursor-pointer">
        <input
          type="checkbox"
          checked={participant.useTwoLoans || false}
          onChange={(e) => {
            onUpdateParticipant({ ...participant, useTwoLoans: e.target.checked });
          }}
          className="w-4 h-4 text-blue-600 rounded"
        />
        <span className="font-semibold text-sm">Financement en deux prêts</span>
      </label>

      {participant.useTwoLoans && (
        <div className="ml-6 space-y-3 bg-blue-50 p-4 rounded border border-blue-200">
          {/* Loan 2 delay */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Prêt 2 commence après (années)
            </label>
            <input
              type="number"
              value={participant.loan2DelayYears ?? 2}
              onChange={(e) => {
                onUpdateParticipant({ ...participant, loan2DelayYears: parseFloat(e.target.value) || 2 });
              }}
              className="w-full px-3 py-2 border rounded"
              min="1"
              step="0.5"
            />
            {validationErrors.loanDelay && (
              <div className="text-red-600 text-xs mt-1 p-2 bg-red-50 rounded">
                ⚠️ {validationErrors.loanDelay}
              </div>
            )}
          </div>

          {/* Renovation amount in loan 2 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Montant rénovation dans prêt 2 (€)
            </label>
            <p className="text-xs text-gray-600 mb-2">
              Répartition des coûts de rénovation entre les deux prêts. Le solde sera financé dans le prêt 1.
            </p>
            <input
              type="number"
              value={participant.loan2RenovationAmount || 0}
              onChange={(e) => {
                onUpdateParticipant({ ...participant, loan2RenovationAmount: parseFloat(e.target.value) || 0 });
              }}
              className="w-full px-3 py-2 border rounded"
              min="0"
              step="1000"
            />
            <div className="text-xs text-gray-600 mt-1">
              Rénovation totale: <span className="font-semibold">€{personalRenovationCost?.toLocaleString() || '0'}</span> | Dans prêt 2: <span className="font-semibold">€{(participant.loan2RenovationAmount || 0).toLocaleString()}</span> | Dans prêt 1: <span className="font-semibold">€{(personalRenovationCost - (participant.loan2RenovationAmount || 0)).toLocaleString()}</span>
            </div>
            {validationErrors.renovationAmount && (
              <div className="text-red-600 text-xs mt-1 p-2 bg-red-50 rounded">
                ⚠️ {validationErrors.renovationAmount}
              </div>
            )}
          </div>

          {/* Capital allocation */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Capital pour prêt 1 (€)
              </label>
              <input
                type="number"
                value={participant.capitalForLoan1 || 0}
                onChange={(e) => {
                  onUpdateParticipant({ ...participant, capitalForLoan1: parseFloat(e.target.value) || 0 });
                }}
                className="w-full px-3 py-2 border rounded"
                min="0"
                step="1000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Capital pour prêt 2 (€)
              </label>
              <input
                type="number"
                value={participant.capitalForLoan2 || 0}
                onChange={(e) => {
                  onUpdateParticipant({ ...participant, capitalForLoan2: parseFloat(e.target.value) || 0 });
                }}
                className="w-full px-3 py-2 border rounded"
                min="0"
                step="1000"
              />
            </div>
          </div>

          {validationErrors.capitalAllocation && (
            <div className="text-red-600 text-xs mt-1 p-2 bg-red-50 rounded">
              ⚠️ {validationErrors.capitalAllocation}
            </div>
          )}

          <p className="text-xs text-gray-600">
            Capital disponible: €{participant.capitalApporte?.toLocaleString() || '0'}
          </p>
        </div>
      )}
    </div>
  );
}
