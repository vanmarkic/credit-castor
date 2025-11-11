import { formatCurrency } from '../../utils/formatting';
import type {
  FraisGenerauxYearlyEvent,
  NewcomerFraisGenerauxReimbursementEvent
} from '../../types/timeline';

type FraisGenerauxEvent = FraisGenerauxYearlyEvent | NewcomerFraisGenerauxReimbursementEvent;

interface FraisGenerauxEventCardProps {
  event: FraisGenerauxEvent;
  colorZone: number;
  isT0: boolean;
  onClick?: () => void;
}

const getZoneBackgroundClass = (zoneIndex: number, isT0: boolean, eventType: string) => {
  if (isT0) {
    return 'bg-purple-50';
  }

  // Reimbursement events use emerald color
  if (eventType === 'NEWCOMER_FRAIS_GENERAUX_REIMBURSEMENT') {
    return 'bg-emerald-50';
  }

  // Yearly events use purple shades
  const colors = [
    'bg-purple-100',
    'bg-purple-50',
    'bg-indigo-50',
    'bg-violet-50',
    'bg-fuchsia-50'
  ];

  return colors[zoneIndex % colors.length];
};

export default function FraisGenerauxEventCard({
  event,
  colorZone,
  isT0,
  onClick
}: FraisGenerauxEventCardProps) {
  const isReimbursement = event.type === 'NEWCOMER_FRAIS_GENERAUX_REIMBURSEMENT';

  return (
    <div
      onClick={onClick}
      className={`
        w-full p-3 rounded-lg border-2 transition-shadow hover:shadow-md
        ${onClick ? 'cursor-pointer hover:shadow-lg' : ''}
        ${getZoneBackgroundClass(colorZone, isT0, event.type)}
        ${isReimbursement ? 'border-emerald-300' : 'border-purple-300'}
      `}
    >
      <div className="text-xs text-gray-500 mb-2">
        {event.date.toLocaleDateString('fr-BE')}
      </div>

      {isReimbursement ? (
        // Newcomer Reimbursement Card
        <>
          <div className="text-xs font-semibold text-emerald-700 mb-1">
            💰 Remboursement FG
          </div>
          <div className="text-xs text-gray-700 mb-2">
            {event.newcomerName}
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-600">Montant</span>
            <span className="text-sm font-bold text-emerald-800">
              {formatCurrency(event.totalPaid)}
            </span>
          </div>
          <div className="text-xs text-gray-500 mt-1">
            → {event.reimbursements.length} participant{event.reimbursements.length !== 1 ? 's' : ''}
          </div>
        </>
      ) : (
        // Yearly Frais Généraux Card
        <>
          <div className="text-xs font-semibold text-purple-700 mb-1">
            📋 Frais Généraux Année {event.year}
          </div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs text-gray-600">Total</span>
            <span className="text-sm font-bold text-purple-800">
              {formatCurrency(event.breakdown.total)}
            </span>
          </div>
          <div className="text-xs text-gray-500">
            {event.payments.length} participant{event.payments.length !== 1 ? 's' : ''}
            {event.year === 1 && ' (fondateurs)'}
          </div>

          {/* Quick breakdown - only for expanded or Year 1 */}
          {event.year === 1 && (
            <div className="mt-2 pt-2 border-t border-purple-200 space-y-0.5 text-xs">
              {event.breakdown.oneTimeCosts > 0 && (
                <div className="flex justify-between text-gray-600">
                  <span>Ponctuel</span>
                  <span>{formatCurrency(event.breakdown.oneTimeCosts)}</span>
                </div>
              )}
              <div className="flex justify-between text-gray-600">
                <span>Récurrent</span>
                <span>{formatCurrency(event.breakdown.recurringYearlyCosts)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Honoraires</span>
                <span>{formatCurrency(event.breakdown.honorairesThisYear)}</span>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
