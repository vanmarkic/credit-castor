import type { HiddenLotRevealedEvent } from '../../types/timeline';
import { formatCurrency } from '../../utils/formatting';

interface HiddenLotRevealedDetailsProps {
  event: HiddenLotRevealedEvent;
}

/**
 * Displays detailed information when a hidden lot is revealed and sold
 */
export function HiddenLotRevealedDetails({ event: e }: HiddenLotRevealedDetailsProps) {
  return (
    <div className="space-y-2 text-sm">
      <div className="font-semibold text-gray-900">
        Hidden lot #{e.lotId} sold to {e.buyer.name}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <div className="text-xs text-gray-500">Sale Price</div>
          <div className="font-medium text-gray-900">{formatCurrency(e.salePrice)}</div>
        </div>
        <div>
          <div className="text-xs text-gray-500">Notary Fees</div>
          <div className="font-medium text-gray-900">{formatCurrency(e.droitEnregistrements)}</div>
        </div>
        <div>
          <div className="text-xs text-gray-500">Buyer Surface</div>
          <div className="font-medium text-gray-900">{e.buyer.surface} m²</div>
        </div>
        <div>
          <div className="text-xs text-gray-500">Capital Brought</div>
          <div className="font-medium text-gray-900">
            {formatCurrency(e.buyer.capitalApporte)}
          </div>
        </div>
      </div>

      {/* Redistribution */}
      {Object.keys(e.redistribution).length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="text-xs text-gray-600 font-medium mb-2">
            Proceeds Redistributed
          </div>
          <div className="space-y-1 text-xs">
            {Object.entries(e.redistribution).map(([name, dist]) => (
              <div key={name} className="flex justify-between">
                <span className="text-gray-600">
                  {name} ({(dist.quotite * 100).toFixed(1)}%):
                </span>
                <span className="font-medium">{formatCurrency(dist.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
