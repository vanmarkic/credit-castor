/**
 * CoproprietéPanel Component (Phase 4.5)
 *
 * Displays copropriété financial health
 * - Cash reserve
 * - Hidden lots owned
 * - Monthly obligations
 * - Costs calculated from deed date
 */

import type { CoproEntity } from '../types/timeline';
import { calculateMonthsBetween } from '../utils/coproRedistribution';

interface CoproprietéPanelProps {
  copropropriete: CoproEntity;
  deedDate: Date;
}

export default function CoproprietéPanel({
  copropropriete,
  deedDate,
}: CoproprietéPanelProps) {
  const monthsSinceDeed = Math.ceil(calculateMonthsBetween(deedDate, new Date()));

  const totalMonthlyObligations =
    copropropriete.monthlyObligations.loanPayments +
    copropropriete.monthlyObligations.insurance +
    copropropriete.monthlyObligations.accountingFees +
    copropropriete.monthlyObligations.maintenanceReserve;

  const monthsOfReserve = totalMonthlyObligations > 0
    ? copropropriete.cashReserve / totalMonthlyObligations
    : Infinity;

  const isLowReserve = monthsOfReserve < 3;

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-purple-50 border-b border-gray-200">
        <h2 className="text-xl font-bold">{copropropriete.name}</h2>
        <p className="text-sm text-gray-600 mt-1">
          Copropriété Entity • {monthsSinceDeed} months since deed date
        </p>
      </div>

      <div className="p-6 space-y-6">
        {/* Cash Reserve - Alert if low */}
        <div className={`p-4 rounded-lg ${
          isLowReserve ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <div className={`text-sm font-semibold mb-1 ${
                isLowReserve ? 'text-red-600' : 'text-green-600'
              }`}>
                Cash Reserve
              </div>
              <div className={`text-3xl font-bold ${
                isLowReserve ? 'text-red-700' : 'text-green-700'
              }`}>
                €{copropropriete.cashReserve.toLocaleString()}
              </div>
              <div className={`text-sm mt-1 ${
                isLowReserve ? 'text-red-600' : 'text-green-600'
              }`}>
                {monthsOfReserve === Infinity ? 'Infinite' : `${monthsOfReserve.toFixed(1)} months`} of obligations
              </div>
            </div>

            {isLowReserve && (
              <div className="text-red-500">
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
            )}
          </div>

          {isLowReserve && (
            <div className="mt-3 text-sm text-red-700 font-medium">
              ⚠️ Reserve is below 3 months of obligations. Consider building up reserves.
            </div>
          )}
        </div>

        {/* Hidden Lots */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Hidden Lots Owned</h3>
          {copropropriete.lotsOwned.length > 0 ? (
            <div className="space-y-2">
              {copropropriete.lotsOwned.map(lot => (
                <div
                  key={lot.lotId}
                  className="p-3 bg-purple-50 border border-purple-200 rounded-lg"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-purple-900">
                        Lot #{lot.lotId}
                      </div>
                      <div className="text-sm text-purple-700">
                        {lot.surface}m² • Acquired {formatDate(lot.acquiredDate)}
                      </div>
                    </div>
                    {lot.soldDate ? (
                      <div className="text-right">
                        <div className="text-sm text-green-600 font-semibold">Sold</div>
                        <div className="text-xs text-gray-600">
                          €{lot.salePrice?.toLocaleString()}
                        </div>
                      </div>
                    ) : (
                      <div className="px-3 py-1 bg-purple-200 text-purple-800 text-xs font-semibold rounded">
                        Available
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-gray-500 italic">No hidden lots</div>
          )}
        </div>

        {/* Monthly Obligations */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            Monthly Obligations (from deed date)
          </h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <span className="text-sm text-gray-600">Loan Payments</span>
              <span className="font-semibold text-gray-900">
                €{copropropriete.monthlyObligations.loanPayments.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <span className="text-sm text-gray-600">Insurance</span>
              <span className="font-semibold text-gray-900">
                €{copropropriete.monthlyObligations.insurance.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <span className="text-sm text-gray-600">Accounting Fees</span>
              <span className="font-semibold text-gray-900">
                €{copropropriete.monthlyObligations.accountingFees.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <span className="text-sm text-gray-600">Maintenance Reserve</span>
              <span className="font-semibold text-gray-900">
                €{copropropriete.monthlyObligations.maintenanceReserve.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded font-semibold">
              <span className="text-blue-700">Total Monthly</span>
              <span className="text-blue-900">
                €{totalMonthlyObligations.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Loans */}
        {copropropriete.loans.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Active Loans</h3>
            <div className="space-y-2">
              {copropropriete.loans.map(loan => (
                <div
                  key={loan.id}
                  className="p-3 bg-gray-50 border border-gray-200 rounded-lg"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-semibold text-gray-900">{loan.purpose}</div>
                    <div className="text-sm text-gray-600">
                      {loan.interestRate}% • {loan.durationYears}yr
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Remaining</span>
                    <span className="font-semibold">
                      €{loan.remainingBalance.toLocaleString()} / €{loan.amount.toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// Helper Functions
// ============================================

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString('en-BE', {
    month: 'short',
    year: 'numeric',
  });
}
