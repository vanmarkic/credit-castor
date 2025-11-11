import { X } from 'lucide-react';
import { formatCurrency } from '../../utils/formatting';
import { useCoproExpectedSales } from '../../hooks/useCoproExpectedSales';
import type { Participant } from '../../utils/calculatorUtils';

interface CoproSnapshot {
  date: Date;
  availableLots: number;
  totalSurface: number;
  soldThisDate: string[];
  reserveIncrease: number;
  colorZone: number;
}

interface CoproDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  snapshot: CoproSnapshot;
  coproReservesShare: number;
  allParticipants: Participant[];
  deedDate: string;
}

export default function CoproDetailModal({
  isOpen,
  onClose,
  snapshot,
  coproReservesShare,
  allParticipants,
  deedDate
}: CoproDetailModalProps) {
  const { sales, totalRevenue, totalToReserves, totalToParticipants } = useCoproExpectedSales(
    allParticipants,
    deedDate,
    coproReservesShare
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-gray-200 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            {/* Left Column: Name and Info */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold text-purple-900">
                  La Copropriété
                </h2>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <span className="text-gray-400">Date</span>
                  <span className="font-medium text-purple-600">
                    {snapshot.date.toLocaleDateString('fr-BE')}
                  </span>
                </span>
              </div>
            </div>

            {/* Right Column: Key Metrics */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                <p className="text-xs text-gray-500 mb-1">Lots disponibles</p>
                <p className="text-xl font-bold text-purple-900">{snapshot.availableLots}</p>
              </div>
              <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                <p className="text-xs text-gray-500 mb-1">Surface totale</p>
                <p className="text-xl font-bold text-purple-900">{snapshot.totalSurface}m²</p>
              </div>
            </div>
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-8 h-8" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto p-6">
        {/* Sales at this date */}
        {snapshot.soldThisDate.length > 0 && (
          <div className="mb-6 p-4 bg-red-50 rounded-lg border border-red-200">
            <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-3">
              📉 Ventes à cette date
            </p>
            <div className="space-y-2">
              {snapshot.soldThisDate.map((name, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-white border border-red-200 rounded-lg"
                >
                  <div className="font-semibold text-red-700">{name}</div>
                </div>
              ))}
            </div>

            {snapshot.reserveIncrease > 0 && (
              <div className="mt-4 p-3 bg-green-50 border border-green-300 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-green-700">
                    💰 Augmentation des réserves ({coproReservesShare}%)
                  </span>
                  <span className="text-lg font-bold text-green-800">
                    {formatCurrency(snapshot.reserveIncrease)}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Inventory status */}
        <div className="mb-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
          <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-3">
            📦 État de l'inventaire
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-white border border-purple-300 rounded-lg">
              <div className="text-xs text-purple-600 mb-1">Lots disponibles</div>
              <div className="text-3xl font-bold text-purple-800">
                {snapshot.availableLots}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                lots en portage disponibles pour de nouveaux participants
              </div>
            </div>
            <div className="p-4 bg-white border border-purple-300 rounded-lg">
              <div className="text-xs text-purple-600 mb-1">Surface totale</div>
              <div className="text-3xl font-bold text-purple-800">
                {snapshot.totalSurface}m²
              </div>
              <div className="text-xs text-gray-500 mt-1">
                surface totale disponible
              </div>
            </div>
          </div>
        </div>

        {/* No sales message */}
        {snapshot.soldThisDate.length === 0 && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-600 italic">
              Aucune vente enregistrée à cette date.
            </p>
          </div>
        )}

        {/* Expected Sales (Remboursements attendus) */}
        {sales.length > 0 && (
          <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
            <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-3">
              💰 Remboursements attendus
            </p>

            <div className="space-y-2">
              {sales.map((sale, idx) => (
                <div key={idx} className="bg-white rounded-lg p-3 border border-green-100">
                  <div className="flex justify-between items-center mb-1">
                    <div>
                      <span className="font-medium text-gray-800">{sale.buyer}</span>
                      <span className="text-gray-600 text-xs ml-2">
                        ({sale.date.toLocaleDateString('fr-BE', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })})
                      </span>
                    </div>
                    <div className="font-bold text-green-700">
                      {formatCurrency(sale.amount)}
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 mb-2">
                    🏢 {sale.description}
                  </div>
                  <div className="flex gap-4 text-xs">
                    <div className="flex items-center gap-1">
                      <span className="text-gray-600">Réserves ({coproReservesShare}%):</span>
                      <span className="font-semibold text-purple-700">
                        {formatCurrency(sale.toReserves)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-gray-600">Participants ({100 - coproReservesShare}%):</span>
                      <span className="font-semibold text-blue-700">
                        {formatCurrency(sale.toParticipants)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-3 border-t border-green-300 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-gray-800">Total revenus</span>
                <span className="text-lg font-bold text-green-800">
                  {formatCurrency(totalRevenue)}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-700">→ Aux réserves copro</span>
                <span className="font-bold text-purple-700">
                  {formatCurrency(totalToReserves)}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-700">→ Redistribués aux participants</span>
                <span className="font-bold text-blue-700">
                  {formatCurrency(totalToParticipants)}
                </span>
              </div>
            </div>

            <p className="text-xs text-green-600 mt-3">
              Ces montants seront versés lorsque les nouveaux participants entreront dans le projet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
