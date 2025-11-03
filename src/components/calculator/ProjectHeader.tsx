import { Calculator, Users, DollarSign, Home, Building2, Wallet } from 'lucide-react';
import { formatCurrency } from '../../utils/formatting';
import type { CalculationResults, Participant } from '../../utils/calculatorUtils';

interface ProjectHeaderProps {
  calculations: CalculationResults;
  participants: Participant[];
}

export function ProjectHeader({
  calculations,
  participants,
}: ProjectHeaderProps) {
  return (
    <div className="bg-white rounded-xl shadow-2xl p-8 mb-8">
      <div className="flex items-center gap-4 mb-6">
        <Building2 className="w-12 h-12 text-blue-600" />
        <div>
          <h1 className="text-4xl font-bold text-gray-900">Achat Ferme du Temple</h1>
          <p className="text-sm text-gray-500">Wallonie, Belgique • Prix d'achat €650,000</p>
        </div>
      </div>

      <div className="bg-blue-50/50 border border-blue-200 rounded-lg p-3 mb-6 inline-block">
        <p className="text-xs text-blue-700">
          <strong>📐 Principe:</strong> L'achat est fonction des m² (€{calculations.pricePerM2.toFixed(2)}/m²).
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        <div className="bg-gray-50 rounded-lg p-2 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <Users className="w-4 h-4 text-gray-500" />
            <p className="text-sm font-semibold text-gray-700">{participants.length}</p>
          </div>
          <p className="text-[10px] text-gray-500 uppercase tracking-wide mt-1">Participants</p>
        </div>

        <div className="bg-gray-50 rounded-lg p-2 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <Home className="w-4 h-4 text-gray-500" />
            <p className="text-sm font-semibold text-gray-700">{calculations.totalSurface}m²</p>
          </div>
          <p className="text-[10px] text-gray-500 uppercase tracking-wide mt-1">Surface</p>
        </div>

        <div className="bg-gray-50 rounded-lg p-2 border border-gray-300 shadow-sm">
          <div className="flex items-center justify-between">
            <DollarSign className="w-4 h-4 text-gray-500" />
            <p className="text-sm font-semibold text-gray-700">{formatCurrency(calculations.totals.total)}</p>
          </div>
          <p className="text-[10px] text-gray-500 uppercase tracking-wide mt-1">Coût Total</p>
        </div>

        <div className="bg-green-50 rounded-lg p-2 border-2 border-green-400 shadow-md">
          <div className="flex items-center justify-between">
            <Wallet className="w-4 h-4 text-green-700" />
            <p className="text-base font-bold text-green-700">{formatCurrency(calculations.totals.capitalTotal)}</p>
          </div>
          <p className="text-[10px] text-green-700 uppercase tracking-wide mt-1 font-semibold">Capital Total</p>
        </div>

        <div className="bg-red-50 rounded-lg p-2 border-2 border-red-400 shadow-lg">
          <div className="flex items-center justify-between">
            <Calculator className="w-5 h-5 text-red-700" />
            <p className="text-lg font-extrabold text-red-700">{formatCurrency(calculations.totals.totalLoansNeeded)}</p>
          </div>
          <p className="text-[10px] text-red-700 uppercase tracking-wide mt-1 font-bold">À Emprunter</p>
        </div>
      </div>
    </div>
  );
}
