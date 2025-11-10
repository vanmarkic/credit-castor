/**
 * CoproSaleDistributionView Component
 *
 * Displays copropriété sale with 30/70 distribution breakdown
 * Shows buyer payment, founder distributions, and reserve increase
 */

import type { CoproSale } from '../stateMachine/types';

interface CoproSaleDistributionViewProps {
  sale: CoproSale;
}

export default function CoproSaleDistributionView({ sale }: CoproSaleDistributionViewProps) {
  const { pricing, buyer, saleDate, surface } = sale;

  // Check if we have the new distribution format
  const hasDistribution = pricing.distribution && pricing.breakdown;

  // Calculate dynamic distribution percentages
  const coproReservesPercent = hasDistribution
    ? (pricing.distribution!.toCoproReserves / pricing.totalPrice) * 100
    : 30;
  const totalToParticipants = hasDistribution
    ? Array.from(pricing.distribution!.toParticipants.values()).reduce((sum, amt) => sum + amt, 0)
    : 0;
  const foundersPercent = hasDistribution
    ? (totalToParticipants / pricing.totalPrice) * 100
    : 70;

  if (!hasDistribution) {
    // Fall back to old format display
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-bold mb-4">
          Copropriété Sale to {buyer}
        </h3>
        <div className="text-sm text-gray-600">
          {formatDate(saleDate)} • {surface}m² @ €{pricing.pricePerSqm.toLocaleString()}/m²
        </div>
        <div className="mt-4 text-2xl font-bold text-blue-700">
          €{pricing.totalPrice.toLocaleString()}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6" data-testid="copro-sale-distribution">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-lg font-bold text-gray-800">
            Copropriété Sale to {buyer}
          </h3>
          <div className="text-sm text-gray-600 mt-1">
            {formatDate(saleDate)} • {surface}m² purchased
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-600">Total Price</div>
          <div className="text-2xl font-bold text-blue-700">
            €{pricing.totalPrice.toLocaleString()}
          </div>
          <div className="text-sm text-gray-600">
            €{pricing.pricePerSqm.toLocaleString()}/m²
          </div>
        </div>
      </div>

      {/* Pricing Breakdown */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Pricing Formula</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Base Price</span>
            <span className="font-mono" data-testid="base-price">
              €{pricing.breakdown!.basePrice.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Indexation</span>
            <span className="font-mono" data-testid="indexation">
              €{pricing.breakdown!.indexation.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Carrying Cost Recovery</span>
            <span className="font-mono" data-testid="carrying-costs">
              €{pricing.breakdown!.carryingCostRecovery.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between pt-2 border-t border-gray-300 font-semibold">
            <span>Total</span>
            <span className="font-mono">
              €{pricing.totalPrice.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Distribution Split */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Copropriété Reserves */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-blue-700 mb-2 flex items-center">
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z"/>
              <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd"/>
            </svg>
            Copropriété Reserves ({coproReservesPercent.toFixed(0)}%)
          </h4>
          <div className="text-2xl font-bold text-blue-700" data-testid="copro-reserves-amount">
            €{pricing.distribution!.toCoproReserves.toLocaleString()}
          </div>
          <div className="text-xs text-blue-600 mt-1">
            Reinvested in collective assets
          </div>
        </div>

        {/* Founders Distribution */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-green-700 mb-2 flex items-center">
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z"/>
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd"/>
            </svg>
            Founders Distribution ({foundersPercent.toFixed(0)}%)
          </h4>
          <div className="text-2xl font-bold text-green-700" data-testid="founders-total-amount">
            €{pricing.distribution!.toParticipants.toLocaleString()}
          </div>
          <div className="text-xs text-green-600 mt-1">
            Split by quotité
          </div>
        </div>
      </div>

      {/* Individual Founder Distributions */}
      <div className="mt-6">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">
          Individual Distributions (by quotité)
        </h4>
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-3 font-semibold text-gray-700">Founder</th>
                <th className="text-right p-3 font-semibold text-gray-700">Quotité</th>
                <th className="text-right p-3 font-semibold text-gray-700">Amount Received</th>
              </tr>
            </thead>
            <tbody>
              {Array.from(pricing.distribution!.toParticipants.entries()).map(([founderName, amount]) => {
                // Calculate quotité from amount and total distribution to participants
                const totalToParticipants = Array.from(pricing.distribution!.toParticipants.values())
                  .reduce((sum, amt) => sum + amt, 0);
                const quotite = (amount / totalToParticipants) * 100;

                return (
                  <tr
                    key={founderName}
                    className="border-t border-gray-100 hover:bg-gray-50"
                    data-testid={`founder-distribution-${founderName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                  >
                    <td className="p-3 text-gray-700 font-medium">{founderName}</td>
                    <td className="p-3 text-right text-gray-600 font-mono">
                      {quotite.toFixed(1)}%
                    </td>
                    <td className="p-3 text-right font-bold text-green-600" data-testid={`amount-${founderName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}>
                      €{amount.toLocaleString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-gray-50 border-t-2 border-gray-300">
              <tr>
                <td className="p-3 font-semibold text-gray-700">Total</td>
                <td className="p-3 text-right text-gray-600">100.0%</td>
                <td className="p-3 text-right font-bold text-gray-700">
                  €{totalToParticipants.toLocaleString()}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Summary Note */}
      <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded text-sm text-amber-800">
        <strong>Note:</strong> The {foundersPercent.toFixed(0)}% distribution is split among founders according to their
        frozen T0 quotité (surface ownership at initial acquisition). Each founder receives
        cash that reduces their net position in the project.
      </div>
    </div>
  );
}

// ============================================
// Helper Functions
// ============================================

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-BE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}
