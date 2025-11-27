import { useState, useMemo } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { formatCurrency } from '../../utils/formatting';
import { suggestLoanAllocation, type PhaseCosts } from '../../utils/phaseCostsCalculation';
import type { Participant, ParticipantCalculation } from '../../utils/calculatorUtils';

interface FinancingSectionProps {
  phaseCosts: PhaseCosts;
  participant: Participant;
  participantCalc: ParticipantCalculation;
  onUpdateParticipant: (updated: Participant) => void;
  defaultExpanded?: boolean;
}

export function FinancingSection({
  phaseCosts,
  participant,
  participantCalc,
  onUpdateParticipant,
  defaultExpanded = false,
}: FinancingSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const capitalApporte = participant.capitalApporte ?? 0;
  const useTwoLoans = participant.useTwoLoans ?? false;
  const includeParachevements = participant.loan2IncludesParachevements ?? false;

  const loanSuggestion = useMemo(
    () => suggestLoanAllocation(phaseCosts, capitalApporte, includeParachevements),
    [phaseCosts, capitalApporte, includeParachevements]
  );

  const remainingToFinance = phaseCosts.grandTotal - capitalApporte;

  // Calculate combined monthly payment for summary
  const monthlyPayment = useTwoLoans
    ? (participantCalc.loan1MonthlyPayment ?? 0) + (participantCalc.loan2MonthlyPayment ?? 0)
    : participantCalc.monthlyPayment;

  const loanTypeLabel = useTwoLoans ? '2 prêts' : '1 prêt';

  return (
    <div className="bg-gray-50 rounded-lg border border-gray-200">
      {/* Collapsed header with mini-summary */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span>💰</span>
          <span className="font-medium text-gray-700">Financement</span>
          <span className="text-sm text-gray-500">
            ({loanTypeLabel})
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-bold text-blue-700">{monthlyPayment} €/mois</span>
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronRight className="w-4 h-4 text-gray-400" />
          )}
        </div>
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="p-4 pt-0 border-t border-gray-200">
          {/* Capital and remaining */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Capital apporté:</span>
              <input
                type="number"
                value={capitalApporte}
                onChange={(e) =>
                  onUpdateParticipant({
                    ...participant,
                    capitalApporte: parseFloat(e.target.value) || 0,
                  })
                }
                className="w-32 px-2 py-1 border border-gray-300 rounded text-right font-medium"
                step="1000"
              />
            </div>
            <div className="text-sm">
              <span className="text-gray-600">Reste à financer: </span>
              <span className="font-bold text-red-700">
                {formatCurrency(Math.max(0, remainingToFinance))}
              </span>
            </div>
          </div>

          {/* Loan type toggle */}
          <div className="flex items-center gap-4 mb-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="loanType"
                checked={!useTwoLoans}
                onChange={() => onUpdateParticipant({ ...participant, useTwoLoans: false })}
                className="w-4 h-4"
              />
              <span className="text-sm">Un seul prêt</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="loanType"
                checked={useTwoLoans}
                onChange={() => onUpdateParticipant({ ...participant, useTwoLoans: true })}
                className="w-4 h-4"
              />
              <span className="text-sm">Deux prêts</span>
              <span className="text-xs text-gray-500">(recommandé)</span>
            </label>
          </div>

          {/* Two loans configuration */}
          {useTwoLoans && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {/* Loan 1 */}
                <div className="bg-white rounded-lg p-4 border-2 border-blue-200">
                  <p className="text-xs font-semibold text-blue-700 mb-2">PRÊT 1 (Signature)</p>
                  <p className="text-lg font-bold text-gray-900">
                    {formatCurrency(loanSuggestion.loan1Amount)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {participant.durationYears} ans @ {participant.interestRate}%
                  </p>
                  {participantCalc.loan1MonthlyPayment && (
                    <p className="text-sm font-medium text-blue-700 mt-2">
                      {formatCurrency(participantCalc.loan1MonthlyPayment)}/mois
                    </p>
                  )}
                </div>

                {/* Loan 2 */}
                <div className="bg-white rounded-lg p-4 border-2 border-orange-200">
                  <p className="text-xs font-semibold text-orange-700 mb-2">PRÊT 2 (Construction)</p>
                  <p className="text-lg font-bold text-gray-900">
                    {formatCurrency(loanSuggestion.loan2Amount)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Démarre après {participant.loan2DelayYears ?? 2} an(s)
                  </p>
                  {participantCalc.loan2MonthlyPayment && (
                    <p className="text-sm font-medium text-orange-700 mt-2">
                      {formatCurrency(participantCalc.loan2MonthlyPayment)}/mois
                    </p>
                  )}
                </div>
              </div>

              {/* Parachèvements payment choice - reframed as HOW to pay */}
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <p className="text-sm font-medium text-gray-700 mb-3">
                  Comment payer les parachèvements?
                </p>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="parachevementPayment"
                      checked={!includeParachevements}
                      onChange={() =>
                        onUpdateParticipant({
                          ...participant,
                          loan2IncludesParachevements: false,
                        })
                      }
                      className="w-4 h-4"
                    />
                    <span className="text-sm">Cash (payer plus tard)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="parachevementPayment"
                      checked={includeParachevements}
                      onChange={() =>
                        onUpdateParticipant({
                          ...participant,
                          loan2IncludesParachevements: true,
                        })
                      }
                      className="w-4 h-4"
                    />
                    <span className="text-sm">
                      Ajouter au prêt 2 (+{formatCurrency(phaseCosts.emmenagement.total)})
                    </span>
                  </label>
                </div>
              </div>
            </>
          )}

          {/* Single loan display */}
          {!useTwoLoans && (
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Montant à emprunter</p>
                  <p className="text-xl font-bold text-gray-900">
                    {formatCurrency(participantCalc.loanNeeded)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Mensualité</p>
                  <p className="text-xl font-bold text-red-700">
                    {formatCurrency(participantCalc.monthlyPayment)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {participant.durationYears} ans @ {participant.interestRate}%
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
