import { useState } from 'react';
import { Users, ChevronDown, ChevronUp, Building2, DollarSign } from 'lucide-react';
import type { PhaseProjection } from '../types/timeline';

interface PhaseCardProps {
  phase: PhaseProjection;
}

export default function PhaseCard({ phase }: PhaseCardProps) {
  const [expandedSections, setExpandedSections] = useState<{
    participants: boolean;
    copro: boolean;
    financials: boolean;
  }>({
    participants: true,
    copro: false,
    financials: false
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const formatCurrency = (value: number) => {
    return `€${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  };

  return (
    <div className="space-y-4 bg-gray-50 rounded-lg p-6 border border-gray-200">
      {/* Participants Section */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <button
          onClick={() => toggleSection('participants')}
          className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            <h4 className="font-semibold text-gray-900">
              Participants ({phase.participants.length})
            </h4>
          </div>
          {expandedSections.participants ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </button>

        {expandedSections.participants && (
          <div className="border-t border-gray-200">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left p-3 font-medium text-gray-700">Name</th>
                    <th className="text-right p-3 font-medium text-gray-700">Surface</th>
                    <th className="text-right p-3 font-medium text-gray-700">Unit</th>
                    <th className="text-right p-3 font-medium text-gray-700">Capital</th>
                    <th className="text-right p-3 font-medium text-gray-700">Total Cost</th>
                    <th className="text-right p-3 font-medium text-gray-700">Loan</th>
                    <th className="text-right p-3 font-medium text-gray-700">Monthly</th>
                  </tr>
                </thead>
                <tbody>
                  {phase.snapshot.participantBreakdown.map((p, idx) => (
                    <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="p-3 font-medium text-gray-900">{p.name}</td>
                      <td className="p-3 text-right text-gray-700">
                        {p.surface} m²
                        {(p.quantity || 1) > 1 && (
                          <span className="ml-1 text-xs text-gray-500">×{p.quantity}</span>
                        )}
                      </td>
                      <td className="p-3 text-right text-gray-700">#{p.unitId}</td>
                      <td className="p-3 text-right text-gray-700">
                        {formatCurrency(p.capitalApporte)}
                      </td>
                      <td className="p-3 text-right font-semibold text-gray-900">
                        {formatCurrency(p.totalCost)}
                      </td>
                      <td className="p-3 text-right text-gray-700">
                        {formatCurrency(p.loanNeeded)}
                      </td>
                      <td className="p-3 text-right text-gray-700">
                        {formatCurrency(p.monthlyPayment)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Copropriété Section */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <button
          onClick={() => toggleSection('copro')}
          className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-green-600" />
            <h4 className="font-semibold text-gray-900">Copropriété</h4>
          </div>
          {expandedSections.copro ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </button>

        {expandedSections.copro && (
          <div className="p-4 border-t border-gray-200 space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-gray-500 mb-1">Name</div>
                <div className="font-medium text-gray-900">
                  {phase.copropropriete.name || 'N/A'}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">Cash Reserve</div>
                <div className="font-medium text-gray-900">
                  {formatCurrency(phase.copropropriete.cashReserve)}
                </div>
              </div>
            </div>

            {phase.copropropriete.lotsOwned.length > 0 && (
              <div>
                <div className="text-xs text-gray-500 mb-1">Lots Owned</div>
                <div className="flex flex-wrap gap-2">
                  {phase.copropropriete.lotsOwned.map((lot, idx) => (
                    <span
                      key={lot.lotId || idx}
                      className="inline-flex items-center px-2 py-1 rounded bg-green-100 text-green-800 text-xs font-medium"
                    >
                      Lot #{lot.lotId}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div>
              <div className="text-xs text-gray-500 mb-2">Monthly Obligations</div>
              <div className="bg-gray-50 rounded p-3 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Loan Payments:</span>
                  <span className="font-medium">
                    {formatCurrency(phase.copropropriete.monthlyObligations.loanPayments)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Insurance:</span>
                  <span className="font-medium">
                    {formatCurrency(phase.copropropriete.monthlyObligations.insurance)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Accounting Fees:</span>
                  <span className="font-medium">
                    {formatCurrency(phase.copropropriete.monthlyObligations.accountingFees)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Maintenance Reserve:</span>
                  <span className="font-medium">
                    {formatCurrency(phase.copropropriete.monthlyObligations.maintenanceReserve)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Financial Snapshot Section */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <button
          onClick={() => toggleSection('financials')}
          className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-purple-600" />
            <h4 className="font-semibold text-gray-900">Financial Snapshot</h4>
          </div>
          {expandedSections.financials ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </button>

        {expandedSections.financials && (
          <div className="p-4 border-t border-gray-200">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {/* Purchase Costs */}
              <div className="bg-blue-50 rounded-lg p-3">
                <div className="text-xs text-blue-600 font-medium mb-1">Purchase</div>
                <div className="text-lg font-bold text-blue-900">
                  {formatCurrency(phase.snapshot.totals.purchase)}
                </div>
              </div>

              {/* Notary Fees */}
              <div className="bg-purple-50 rounded-lg p-3">
                <div className="text-xs text-purple-600 font-medium mb-1">Notary Fees</div>
                <div className="text-lg font-bold text-purple-900">
                  {formatCurrency(phase.snapshot.totals.totalNotaryFees)}
                </div>
              </div>

              {/* Construction */}
              <div className="bg-orange-50 rounded-lg p-3">
                <div className="text-xs text-orange-600 font-medium mb-1">Construction</div>
                <div className="text-lg font-bold text-orange-900">
                  {formatCurrency(phase.snapshot.totals.construction)}
                </div>
              </div>

              {/* Shared Costs */}
              <div className="bg-green-50 rounded-lg p-3">
                <div className="text-xs text-green-600 font-medium mb-1">Shared Costs</div>
                <div className="text-lg font-bold text-green-900">
                  {formatCurrency(phase.snapshot.totals.shared)}
                </div>
              </div>

              {/* Total Capital */}
              <div className="bg-indigo-50 rounded-lg p-3">
                <div className="text-xs text-indigo-600 font-medium mb-1">Total Capital</div>
                <div className="text-lg font-bold text-indigo-900">
                  {formatCurrency(phase.snapshot.totals.capitalTotal)}
                </div>
              </div>

              {/* Total Loans */}
              <div className="bg-red-50 rounded-lg p-3">
                <div className="text-xs text-red-600 font-medium mb-1">Total Loans</div>
                <div className="text-lg font-bold text-red-900">
                  {formatCurrency(phase.snapshot.totals.totalLoansNeeded)}
                </div>
              </div>
            </div>

            {/* Totals Summary */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-gray-700">Total Project Cost</span>
                <span className="text-xl font-bold text-gray-900">
                  {formatCurrency(phase.snapshot.totals.total)}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Triggering Event Info */}
      {phase.triggeringEvent && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="text-xs text-blue-600 font-semibold mb-1">TRIGGERED BY</div>
          <div className="text-sm font-medium text-blue-900">
            {phase.triggeringEvent.type.replace(/_/g, ' ')}
          </div>
          <div className="text-xs text-blue-700 mt-1">
            {new Date(phase.triggeringEvent.date).toLocaleString()}
          </div>
        </div>
      )}
    </div>
  );
}
