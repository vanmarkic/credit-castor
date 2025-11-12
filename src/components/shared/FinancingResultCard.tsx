import { formatCurrency } from '../../utils/formatting';
import type { ParticipantCalculation } from '../../utils/calculatorUtils';

interface FinancingResultCardProps {
  participantCalc: ParticipantCalculation;
}

/**
 * Displays loan calculation results
 * Shows total cost, capital, loan needed, interest, total repayment, and monthly payment
 * When useTwoLoans is enabled, displays two separate loan sections
 */
export function FinancingResultCard({ participantCalc: p }: FinancingResultCardProps) {
  const hasTwoLoans = p.useTwoLoans && p.loan1Amount && p.loan2Amount;

  return (
    <div className="bg-red-50 rounded-lg p-5 border border-red-200 mb-6">
      <div className="flex items-center gap-2 mb-3">
        <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">
          Emprunt Nécessaire
        </p>
        <span className="bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded">
          {p.financingRatio.toFixed(1)}% financé
        </span>
        {hasTwoLoans && (
          <span className="bg-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded">
            2 prêts
          </span>
        )}
      </div>

      {/* Math Operation: Total Cost - Capital = Loan */}
      <div className="flex items-center justify-center gap-3 mb-3">
        <div className="bg-white rounded-lg p-3 border border-gray-200 flex-1">
          <p className="text-xs text-gray-500 mb-1">Coût du projet</p>
          <p className="text-lg font-bold text-gray-900">{formatCurrency(p.totalCost)}</p>
        </div>

        <div className="text-xl font-bold text-gray-400 flex-shrink-0">−</div>

        <div className="bg-green-50 rounded-lg p-3 border border-green-300 flex-1">
          <p className="text-xs text-gray-500 mb-1">Capital apporté</p>
          <p className="text-lg font-bold text-green-700">{formatCurrency(p.capitalApporte)}</p>
        </div>

        <div className="text-xl font-bold text-gray-400 flex-shrink-0">=</div>

        <div className="bg-red-100 rounded-lg p-3 border-2 border-red-400 flex-1">
          <p className="text-xs text-gray-500 mb-1">À emprunter</p>
          <p className="text-xl font-bold text-red-700">{formatCurrency(p.loanNeeded)}</p>
        </div>
      </div>

      {hasTwoLoans ? (
        /* Two-loan breakdown */
        <div className="space-y-4 pt-3 border-t border-red-200">
          {/* Loan 1 */}
          <div className="bg-white rounded-lg p-4 border-2 border-blue-300">
            <div className="flex items-center gap-2 mb-3">
              <span className="bg-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded">
                PRÊT 1
              </span>
              <span className="text-xs text-gray-600">Immédiat</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <p className="text-xs text-gray-500 mb-1">Montant</p>
                <p className="text-base font-bold text-gray-900">{formatCurrency(p.loan1Amount || 0)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Intérêts</p>
                <p className="text-base font-bold text-red-700">{formatCurrency(p.loan1Interest || 0)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Total remboursé</p>
                <p className="text-base font-bold text-gray-900">{formatCurrency((p.loan1Amount || 0) + (p.loan1Interest || 0))}</p>
              </div>
              <div className="bg-blue-50 rounded p-2">
                <p className="text-xs text-gray-500 mb-1">Mensualité</p>
                <p className="text-xl font-bold text-blue-700">{formatCurrency(p.loan1MonthlyPayment || 0)}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {p.durationYears} ans @ {p.interestRate}%
                </p>
              </div>
            </div>
          </div>

          {/* Loan 2 */}
          <div className="bg-white rounded-lg p-4 border-2 border-purple-300">
            <div className="flex items-center gap-2 mb-3">
              <span className="bg-purple-600 text-white text-xs font-bold px-2 py-0.5 rounded">
                PRÊT 2
              </span>
              <span className="text-xs text-gray-600">Démarre après {p.loan2DelayYears || 2} an(s)</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <p className="text-xs text-gray-500 mb-1">Montant</p>
                <p className="text-base font-bold text-gray-900">{formatCurrency(p.loan2Amount || 0)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Intérêts</p>
                <p className="text-base font-bold text-red-700">{formatCurrency(p.loan2Interest || 0)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Total remboursé</p>
                <p className="text-base font-bold text-gray-900">{formatCurrency((p.loan2Amount || 0) + (p.loan2Interest || 0))}</p>
              </div>
              <div className="bg-purple-50 rounded p-2">
                <p className="text-xs text-gray-500 mb-1">Mensualité</p>
                <p className="text-xl font-bold text-purple-700">{formatCurrency(p.loan2MonthlyPayment || 0)}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {p.loan2DurationYears} ans @ {p.interestRate}%
                </p>
              </div>
            </div>
          </div>

          {/* Combined monthly payment - highlighted */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 border-2 border-gray-400">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="bg-gray-700 text-white text-xs font-bold px-2 py-0.5 rounded">
                  MENSUALITÉ COMBINÉE
                </span>
                <span className="text-xs text-gray-600">
                  Années {p.loan2DelayYears || 2} à {p.durationYears}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">Intérêts totaux</p>
                <p className="text-base font-bold text-red-700">{formatCurrency(p.totalInterest)}</p>
              </div>

              <div>
                <p className="text-xs text-gray-500 mb-1">Total à rembourser</p>
                <p className="text-base font-bold text-gray-900">{formatCurrency(p.totalRepayment)}</p>
              </div>

              <div className="md:col-span-1 bg-white rounded-lg p-3 border-2 border-gray-400">
                <p className="text-xs text-gray-500 mb-1">Mensualité totale</p>
                <p className="text-3xl font-bold text-gray-900">{formatCurrency((p.loan1MonthlyPayment || 0) + (p.loan2MonthlyPayment || 0))}</p>
                <div className="flex items-center gap-2 mt-2 text-xs text-gray-600">
                  <span className="text-blue-600 font-semibold">{formatCurrency(p.loan1MonthlyPayment || 0)}</span>
                  <span>+</span>
                  <span className="text-purple-600 font-semibold">{formatCurrency(p.loan2MonthlyPayment || 0)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Single loan display */
        <div className="pt-3 border-t border-red-200">
          <div className="bg-white rounded-lg p-4 border-2 border-red-300">
            <div className="flex items-center gap-2 mb-3">
              <span className="bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded">
                PRÊT UNIQUE
              </span>
              <span className="text-xs text-gray-600">{p.durationYears} ans @ {p.interestRate}%</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <p className="text-xs text-gray-500 mb-1">Montant</p>
                <p className="text-base font-bold text-gray-900">{formatCurrency(p.loanNeeded)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Intérêts</p>
                <p className="text-base font-bold text-red-700">{formatCurrency(p.totalInterest)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Total remboursé</p>
                <p className="text-base font-bold text-gray-900">{formatCurrency(p.totalRepayment)}</p>
              </div>
              <div className="bg-red-50 rounded p-2">
                <p className="text-xs text-gray-500 mb-1">Mensualité</p>
                <p className="text-2xl font-bold text-red-700">{formatCurrency(p.monthlyPayment)}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  pendant {p.durationYears} ans
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
