import { formatCurrency } from '../../utils/formatting';
import type { ParticipantCalculation } from '../../utils/calculatorUtils';

interface FinancingResultCardProps {
  participantCalc: ParticipantCalculation;
}

/**
 * Displays loan calculation results
 * Shows total cost, capital, loan needed, interest, total repayment, and monthly payment
 */
export function FinancingResultCard({ participantCalc: p }: FinancingResultCardProps) {
  return (
    <div className="bg-red-50 rounded-lg p-5 border border-red-200 mb-6">
      <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-3">
        Emprunt Nécessaire
      </p>

      {/* Math Operation: Total Cost - Capital = Loan */}
      <div className="flex items-center justify-center gap-3 mb-4">
        <div className="bg-white rounded-lg p-3 border border-gray-200 flex-1">
          <p className="text-xs text-gray-500 mb-1">Coût Total hors intérêts</p>
          <p className="text-lg font-bold text-gray-900">{formatCurrency(p.totalCost)}</p>
        </div>

        <div className="text-2xl font-bold text-gray-400 flex-shrink-0">−</div>

        <div className="bg-green-50 rounded-lg p-3 border border-green-300 flex-1">
          <p className="text-xs text-gray-600 mb-1">Capital apporté</p>
          <p className="text-lg font-bold text-green-700">{formatCurrency(p.capitalApporte)}</p>
        </div>

        <div className="text-2xl font-bold text-gray-400 flex-shrink-0">=</div>

        <div className="bg-red-100 rounded-lg p-3 border border-red-300 flex-1">
          <p className="text-xs text-gray-600 mb-1">À emprunter</p>
          <p className="text-lg font-bold text-red-700">{formatCurrency(p.loanNeeded)}</p>
          <p className="text-xs text-gray-500 mt-0.5">{p.financingRatio.toFixed(1)}%</p>
        </div>
      </div>

      {/* Loan Details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3 border-t border-red-200">
        <div className="bg-white rounded-lg p-2 border border-red-200">
          <p className="text-xs text-gray-500 mb-1">Intérêts</p>
          <p className="text-base font-bold text-red-700">{formatCurrency(p.totalInterest)}</p>
        </div>

        <div className="bg-white rounded-lg p-2 border border-gray-200">
          <p className="text-xs text-gray-500 mb-1">À rembourser sur {p.durationYears} ans</p>
          <p className="text-base font-bold text-gray-900">{formatCurrency(p.totalRepayment)}</p>
        </div>

        <div className="bg-white rounded-lg p-2 border border-gray-200">
          <p className="text-xs text-gray-500 mb-1">Mensualité</p>
          <p className="text-base font-bold text-red-600">{formatCurrency(p.monthlyPayment)}</p>
          <p className="text-xs text-gray-400 mt-0.5">
            {p.durationYears} ans @ {p.interestRate}%
          </p>
        </div>
      </div>
    </div>
  );
}
