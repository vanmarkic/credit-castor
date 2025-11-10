import { formatCurrency } from '../../utils/formatting';

interface CoproInventoryCardProps {
  date: Date;
  availableLots: number;
  totalSurface: number;
  soldThisDate: string[];
  reserveIncrease: number;
  colorZone: number;
  isT0: boolean;
}

const getZoneBackgroundClass = (zoneIndex: number, isT0: boolean) => {
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

export default function CoproInventoryCard({
  date,
  availableLots,
  totalSurface,
  soldThisDate,
  reserveIncrease,
  colorZone,
  isT0
}: CoproInventoryCardProps) {
  return (
    <div
      className={`
        w-full p-4 rounded-lg border-2 border-purple-300 transition-shadow hover:shadow-md
        ${getZoneBackgroundClass(colorZone, isT0)}
      `}
    >
      <div className="text-xs text-gray-500 mb-2">
        {date.toLocaleDateString('fr-BE')}
      </div>
      <div className="space-y-1">
        <div className="flex justify-between items-center">
          <span className="text-xs text-purple-600">Lots disponibles</span>
          <span className="text-sm font-bold text-purple-800">
            {availableLots}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs text-purple-600">Surface totale</span>
          <span className="text-sm font-bold text-purple-800">
            {totalSurface}m²
          </span>
        </div>
      </div>

      {soldThisDate.length > 0 && (
        <div className="mt-2 pt-2 border-t border-purple-200">
          <div className="text-xs font-semibold text-red-700">
            📉 Vendu à {soldThisDate.join(', ')}
          </div>
          {reserveIncrease > 0 && (
            <div className="text-xs font-semibold text-green-700 mt-1">
              💰 +{formatCurrency(reserveIncrease)} réserves (30%)
            </div>
          )}
        </div>
      )}
    </div>
  );
}
