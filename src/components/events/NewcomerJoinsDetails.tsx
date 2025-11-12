import type { NewcomerJoinsEvent } from '../../types/timeline';
import { formatCurrency } from '../../utils/formatting';

interface NewcomerJoinsDetailsProps {
  event: NewcomerJoinsEvent;
}

/**
 * Displays detailed information when a newcomer joins the project
 */
export function NewcomerJoinsDetails({ event: e }: NewcomerJoinsDetailsProps) {
  return (
    <div className="space-y-2 text-sm">
      <div className="font-semibold text-gray-900">{e.buyer.name} joined the project</div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <div className="text-xs text-gray-500">Purchased from</div>
          <div className="font-medium text-gray-900">{e.acquisition.from}</div>
        </div>
        <div>
          <div className="text-xs text-gray-500">Lot</div>
          <div className="font-medium text-gray-900">#{e.acquisition.lotId}</div>
        </div>
        <div>
          <div className="text-xs text-gray-500">Purchase Price</div>
          <div className="font-medium text-gray-900">
            {formatCurrency(e.acquisition.purchasePrice)}
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-500">Droit d'enregistrements</div>
          <div className="font-medium text-gray-900">{formatCurrency(e.droitEnregistrements)}</div>
        </div>
        <div>
          <div className="text-xs text-gray-500">Surface</div>
          <div className="font-medium text-gray-900">{e.buyer.surface} m²</div>
        </div>
        <div>
          <div className="text-xs text-gray-500">Capital Brought</div>
          <div className="font-medium text-gray-900">
            {formatCurrency(e.financing.capitalApporte)}
          </div>
        </div>
      </div>

      {/* Price Breakdown */}
      <div className="mt-3 pt-3 border-t border-gray-200">
        <div className="text-xs text-gray-600 font-medium mb-2">Price Breakdown</div>
        <div className="space-y-1 text-xs">
          <div className="flex justify-between">
            <span className="text-gray-600">Base Price:</span>
            <span>{formatCurrency(e.acquisition.breakdown.basePrice)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Indexation:</span>
            <span>{formatCurrency(e.acquisition.breakdown.indexation)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Carrying Cost Recovery:</span>
            <span>{formatCurrency(e.acquisition.breakdown.carryingCostRecovery)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Fees Recovery:</span>
            <span>{formatCurrency(e.acquisition.breakdown.feesRecovery)}</span>
          </div>
          {e.acquisition.breakdown.renovations > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-600">Renovations:</span>
              <span>{formatCurrency(e.acquisition.breakdown.renovations)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
