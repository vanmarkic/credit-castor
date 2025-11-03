import type { Lot } from '../types/timeline';
import type { PortageFormulaParams } from '../utils/calculatorUtils';
import { calculateCarryingCosts, calculatePortageLotPrice } from '../utils/portageCalculations';
import { formatCurrency } from '../utils/formatting';

interface PortageLotConfigProps {
  portageLots: Lot[];
  onAddLot: () => void;
  onRemoveLot: (lotId: number) => void;
  onUpdateSurface: (lotId: number, surface: number) => void;
  deedDate: Date;
  formulaParams: PortageFormulaParams;
  participantName?: string; // For anchor link
}

export default function PortageLotConfig({
  portageLots,
  onAddLot,
  onRemoveLot,
  onUpdateSurface,
  deedDate,
  formulaParams,
  participantName
}: PortageLotConfigProps) {
  // Calculate years held
  const yearsHeld = (new Date().getTime() - deedDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);

  const handleScrollToMarketplace = () => {
    const marketplace = document.getElementById('portage-marketplace');
    if (marketplace) {
      marketplace.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="mb-4 p-4 bg-orange-50 rounded-lg border border-orange-200">
      <div className="flex justify-between items-center mb-3">
        <p className="text-xs text-orange-700 uppercase tracking-wide font-semibold">
          📦 Lot en Portage
        </p>
        {portageLots.length === 0 && (
          <button
            onClick={onAddLot}
            className="text-xs bg-orange-600 hover:bg-orange-700 text-white px-3 py-1 rounded transition-colors"
          >
            + Ajouter lot portage
          </button>
        )}
      </div>

      {portageLots && portageLots.length > 0 ? (
        <div className="space-y-4">
          {portageLots.map((lot) => {
            // Calculate price
            const originalPrice = lot.originalPrice ?? 0;
            const originalNotaryFees = lot.originalNotaryFees ?? 0;
            const originalConstructionCost = lot.originalConstructionCost ?? 0;

            const carryingCosts = calculateCarryingCosts(
              originalPrice,
              0,
              Math.round(yearsHeld * 12),
              formulaParams.averageInterestRate
            );

            const price = calculatePortageLotPrice(
              originalPrice,
              originalNotaryFees,
              originalConstructionCost,
              yearsHeld,
              formulaParams,
              carryingCosts,
              0
            );

            return (
              <div key={lot.lotId} className="bg-white p-4 rounded border border-orange-300 space-y-3">
                {/* Surface Input */}
                <div>
                  <label className="block text-xs text-gray-600 mb-1">
                    Surface à vendre (m²)
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

                {/* Price Display */}
                <div className="text-sm">
                  <div className="text-gray-700 mb-1">
                    Prix de vente ({yearsHeld.toFixed(1)} ans de portage):
                  </div>
                  <div className="text-2xl font-bold text-orange-900">
                    {formatCurrency(price.totalPrice)}
                  </div>
                </div>

                {/* Breakdown Table */}
                <div className="bg-orange-50 rounded border border-orange-200 overflow-hidden">
                  <table className="w-full text-xs">
                    <tbody>
                      <tr className="border-b border-orange-100">
                        <td className="px-3 py-2 text-gray-700">
                          Base acquisition (achat+notaire+casco)
                        </td>
                        <td className="px-3 py-2 text-right font-semibold">
                          {formatCurrency(price.basePrice)}
                        </td>
                      </tr>
                      <tr className="border-b border-orange-100">
                        <td className="px-3 py-2 text-gray-700">
                          Indexation ({formulaParams.indexationRate}% × {yearsHeld.toFixed(1)} ans)
                        </td>
                        <td className="px-3 py-2 text-right font-semibold">
                          {formatCurrency(price.indexation)}
                        </td>
                      </tr>
                      <tr className="border-b border-orange-200">
                        <td className="px-3 py-2 text-gray-700">
                          Frais de portage ({yearsHeld.toFixed(1)} ans)
                        </td>
                        <td className="px-3 py-2 text-right font-semibold">
                          {formatCurrency(price.carryingCostRecovery)}
                        </td>
                      </tr>
                      <tr className="bg-orange-100">
                        <td className="px-3 py-2 font-bold text-orange-900">
                          Prix total
                        </td>
                        <td className="px-3 py-2 text-right font-bold text-orange-900">
                          {formatCurrency(price.totalPrice)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between gap-2">
                  <button
                    onClick={handleScrollToMarketplace}
                    className="text-xs text-orange-700 hover:text-orange-900 underline"
                  >
                    ↓ Voir dans la place de marché
                  </button>
                  <button
                    onClick={() => onRemoveLot(lot.lotId)}
                    className="text-red-600 hover:text-red-700 text-xs px-2 py-1 rounded border border-red-300 hover:bg-red-50"
                  >
                    Retirer
                  </button>
                </div>
              </div>
            );
          })}

          {portageLots.length < 2 && (
            <button
              onClick={onAddLot}
              className="w-full text-xs bg-orange-600 hover:bg-orange-700 text-white px-3 py-2 rounded transition-colors"
            >
              + Ajouter un autre lot portage
            </button>
          )}
        </div>
      ) : (
        <p className="text-xs text-gray-500 italic">
          Aucun lot en portage configuré.
        </p>
      )}
    </div>
  );
}
