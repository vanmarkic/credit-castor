import type { Lot } from '../types/timeline';

interface PortageLotConfigProps {
  portageLots: Lot[];
  onAddLot: () => void;
  onRemoveLot: (lotId: number) => void;
  onUpdateSurface: (lotId: number, surface: number) => void;
}

export default function PortageLotConfig({
  portageLots,
  onAddLot,
  onRemoveLot,
  onUpdateSurface
}: PortageLotConfigProps) {
  return (
    <div className="mb-4 p-4 bg-orange-50 rounded-lg border border-orange-200">
      <div className="flex justify-between items-center mb-3">
        <p className="text-xs text-orange-700 uppercase tracking-wide font-semibold">
          Configuration Portage
        </p>
        <button
          onClick={onAddLot}
          className="text-xs bg-orange-600 hover:bg-orange-700 text-white px-3 py-1 rounded transition-colors"
        >
          + Ajouter lot portage
        </button>
      </div>

      {portageLots && portageLots.length > 0 ? (
        <div className="space-y-2">
          {portageLots.map((lot) => (
            <div key={lot.lotId} className="bg-white p-3 rounded border border-orange-300 flex items-center gap-3">
              <div className="flex-1">
                <label className="block text-xs text-gray-600 mb-1">
                  Surface lot portage (m²)
                </label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  value={lot.allocatedSurface || 0}
                  onChange={(e) => onUpdateSurface(lot.lotId, parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 text-sm font-semibold border border-orange-300 rounded-lg focus:border-orange-500 focus:ring-1 focus:ring-orange-500 focus:outline-none"
                />
              </div>
              <button
                onClick={() => onRemoveLot(lot.lotId)}
                className="text-red-600 hover:text-red-700 text-xs px-2 py-1 rounded border border-red-300 hover:bg-red-50"
              >
                Retirer
              </button>
            </div>
          ))}
          <p className="text-xs text-orange-600 mt-2">
            Ces lots seront vendus aux nouveaux arrivants avec indexation et frais de portage.
            La surface est imposée par le fondateur.
          </p>
        </div>
      ) : (
        <p className="text-xs text-gray-500 italic">
          Aucun lot en portage. Les nouveaux arrivants verront uniquement les lots de la copropriété.
        </p>
      )}
    </div>
  );
}
