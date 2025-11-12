import { formatCurrency } from '../../utils/formatting';
import type { TimelineTransaction } from '../../types/timeline';

interface ParticipantFinancingCardProps {
  date: Date;
  totalCost: number;
  loanNeeded: number;
  monthlyPayment: number;
  isT0: boolean;
  isFounder: boolean;
  colorZone: number;
  transaction?: TimelineTransaction;
  onClick: () => void;
  showFinancingDetails: boolean; // Hide for redistribution cards
  // Two-loan financing
  useTwoLoans?: boolean;
  loan1MonthlyPayment?: number;
  loan2MonthlyPayment?: number;
}

const getZoneBackgroundClass = (zoneIndex: number, isT0: boolean, _isFounder: boolean) => {
  if (isT0) {
    return 'bg-green-50';
  }

  const colors = [
    'bg-blue-50',
    'bg-purple-50',
    'bg-indigo-50',
    'bg-cyan-50',
    'bg-teal-50'
  ];

  return colors[zoneIndex % colors.length];
};

export default function ParticipantFinancingCard({
  date,
  totalCost,
  loanNeeded,
  monthlyPayment,
  isT0,
  isFounder,
  colorZone,
  transaction,
  onClick,
  showFinancingDetails,
  useTwoLoans,
  loan1MonthlyPayment,
  loan2MonthlyPayment
}: ParticipantFinancingCardProps) {
  const displayMonthlyPayment = useTwoLoans && loan1MonthlyPayment && loan2MonthlyPayment
    ? loan1MonthlyPayment + loan2MonthlyPayment
    : monthlyPayment;
  const monthlyLabel = useTwoLoans && loan1MonthlyPayment && loan2MonthlyPayment
    ? 'Mensualité combi'
    : 'Mensualité';
  return (
    <div
      className={`
        w-full p-4 rounded-lg border-2 transition-shadow hover:shadow-md cursor-pointer
        ${isT0 ? 'timeline-card-t0' : ''}
        ${getZoneBackgroundClass(colorZone, isT0, isFounder)}
        ${isT0
          ? 'border-green-300'
          : isFounder ? 'border-green-200' : 'border-blue-200'
        }
      `}
      onClick={onClick}
    >
      <div className="text-xs text-gray-500 mb-2">
        {date.toLocaleDateString('fr-BE')}
      </div>

      {showFinancingDetails && (
        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-600">Coût Total</span>
            <span className="text-sm font-bold text-gray-900">
              {formatCurrency(totalCost)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-600">À emprunter</span>
            <span className="text-sm font-bold text-red-700">
              {formatCurrency(loanNeeded)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-600">{monthlyLabel}</span>
            <span className="text-sm font-bold text-red-600">
              {formatCurrency(displayMonthlyPayment)}
            </span>
          </div>
        </div>
      )}

      {isT0 && (
        <div className="mt-2 text-xs text-green-700 font-medium">
          Cliquer pour détails →
        </div>
      )}

      {transaction && (
        <div className={`${showFinancingDetails ? 'mt-2 pt-2 border-t border-current border-opacity-20' : ''}`}>
          <div className={`text-xs font-semibold ${
            transaction.delta.totalCost < 0 ? 'text-green-700' : 'text-red-700'
          }`}>
            {transaction.delta.totalCost < 0 ? '📉' : '📈'}{' '}
            {formatCurrency(Math.abs(transaction.delta.totalCost))}
          </div>
          <div className="text-xs text-gray-600 mt-1">
            {transaction.delta.reason}
          </div>
        </div>
      )}
    </div>
  );
}
