/**
 * ParticipantCashFlowView Component (Phase 4.3)
 *
 * Displays complete cash flow for a participant
 * - Transaction list chronologically
 * - Summary cards
 * - Timeline chart relative to deed date
 */

import { useState } from 'react';
import type { ParticipantCashFlow } from '../types/cashFlow';

interface ParticipantCashFlowViewProps {
  cashFlow: ParticipantCashFlow;
  deedDate: Date;
}

export default function ParticipantCashFlowView({
  cashFlow,
  deedDate,
}: ParticipantCashFlowViewProps) {
  const [filter, setFilter] = useState<'all' | 'one_shot' | 'recurring'>('all');

  const filteredTransactions = cashFlow.transactions.filter(txn => {
    if (filter === 'all') return true;
    if (filter === 'one_shot') return txn.category === 'ONE_SHOT';
    if (filter === 'recurring') return txn.category === 'RECURRING';
    return true;
  });

  const monthsSinceDeed = monthsBetween(deedDate, new Date());

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h3 className="text-lg font-bold mb-4">
        Cash Flow: {cashFlow.participantName}
      </h3>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-xs text-red-600 font-semibold mb-1">Total Invested</div>
          <div className="text-2xl font-bold text-red-700">
            €{Math.abs(cashFlow.summary.totalInvested).toLocaleString()}
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="text-xs text-green-600 font-semibold mb-1">Total Received</div>
          <div className="text-2xl font-bold text-green-700">
            €{cashFlow.summary.totalReceived.toLocaleString()}
          </div>
        </div>

        <div className={`border rounded-lg p-4 ${
          cashFlow.summary.netPosition < 0 ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'
        }`}>
          <div className={`text-xs font-semibold mb-1 ${
            cashFlow.summary.netPosition < 0 ? 'text-red-600' : 'text-green-600'
          }`}>
            Net Position
          </div>
          <div className={`text-2xl font-bold ${
            cashFlow.summary.netPosition < 0 ? 'text-red-700' : 'text-green-700'
          }`}>
            €{Math.abs(cashFlow.summary.netPosition).toLocaleString()}
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="text-xs text-blue-600 font-semibold mb-1">Months Since Deed</div>
          <div className="text-2xl font-bold text-blue-700">{monthsSinceDeed}</div>
          <div className="text-xs text-blue-600 mt-1">
            Burn: €{cashFlow.summary.monthlyBurnRate.toLocaleString()}/mo
          </div>
        </div>
      </div>

      {/* Filter Buttons */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          All ({cashFlow.transactions.length})
        </button>
        <button
          onClick={() => setFilter('one_shot')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'one_shot'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          One-Shot ({cashFlow.transactions.filter(t => t.category === 'ONE_SHOT').length})
        </button>
        <button
          onClick={() => setFilter('recurring')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'recurring'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Recurring ({cashFlow.transactions.filter(t => t.category === 'RECURRING').length})
        </button>
      </div>

      {/* Transaction List */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="max-h-96 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="text-left p-3 font-semibold text-gray-700">Date</th>
                <th className="text-left p-3 font-semibold text-gray-700">Type</th>
                <th className="text-left p-3 font-semibold text-gray-700">Description</th>
                <th className="text-right p-3 font-semibold text-gray-700">Amount</th>
                <th className="text-right p-3 font-semibold text-gray-700">Balance</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map(txn => {
                const monthsSinceDeed = txn.metadata?.monthsSinceDeed as number | undefined;
                return (
                <tr key={txn.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="p-3 text-gray-600">
                    {formatDate(txn.date)}
                    {monthsSinceDeed !== undefined && (
                      <div className="text-xs text-gray-400">
                        Month {monthsSinceDeed}
                      </div>
                    )}
                  </td>
                  <td className="p-3">
                    <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                      txn.category === 'ONE_SHOT'
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {formatType(txn.type)}
                    </span>
                  </td>
                  <td className="p-3 text-gray-600">{txn.description}</td>
                  <td className={`p-3 text-right font-semibold ${
                    txn.amount < 0 ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {txn.amount < 0 ? '-' : '+'}€{Math.abs(txn.amount).toLocaleString()}
                  </td>
                  <td className="p-3 text-right font-mono text-gray-700">
                    €{(txn.runningBalance || 0).toLocaleString()}
                  </td>
                </tr>
              );})}
            </tbody>
          </table>
        </div>
      </div>

      {/* Export Button */}
      <div className="mt-4">
        <button
          onClick={() => exportToCSV(cashFlow)}
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
        >
          Export to CSV
        </button>
      </div>
    </div>
  );
}

// ============================================
// Helper Functions
// ============================================

function monthsBetween(start: Date, end: Date): number {
  const startDate = new Date(start);
  const endDate = new Date(end);
  return (
    (endDate.getFullYear() - startDate.getFullYear()) * 12 +
    (endDate.getMonth() - startDate.getMonth())
  );
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-BE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatType(type: string): string {
  return type
    .split('_')
    .map(word => word.charAt(0) + word.slice(1).toLowerCase())
    .join(' ');
}

function exportToCSV(cashFlow: ParticipantCashFlow): void {
  const headers = ['Date', 'Type', 'Category', 'Description', 'Amount', 'Balance'];
  const rows = cashFlow.transactions.map(txn => [
    txn.date.toISOString(),
    txn.type,
    txn.category,
    txn.description,
    txn.amount.toString(),
    (txn.runningBalance || 0).toString(),
  ]);

  const csv = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
  ].join('\n');

  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${cashFlow.participantName}_cashflow.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
