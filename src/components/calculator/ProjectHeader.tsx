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
      <div className="flex items-center gap-4 mb-4">
        <Building2 className="w-12 h-12 text-blue-600" />
        <div>
          <h1 className="text-4xl font-bold text-gray-800">Achat Ferme du Temple</h1>
          <p className="text-gray-600">Wallonie, Belgique • Prix d'achat €650,000</p>
        </div>
      </div>

      <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 mb-6">
        <p className="text-sm text-blue-800">
          <strong>📐 Principe:</strong> L'achat est fonction des m² (€{calculations.pricePerM2.toFixed(2)}/m²).
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
          <Users className="w-6 h-6 text-blue-500 mb-2" />
          <p className="text-xs text-gray-500 uppercase tracking-wide">Participants</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{participants.length}</p>
        </div>

        <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
          <Home className="w-6 h-6 text-blue-500 mb-2" />
          <p className="text-xs text-gray-500 uppercase tracking-wide">Surface</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{calculations.totalSurface}m²</p>
        </div>

        <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
          <DollarSign className="w-6 h-6 text-gray-500 mb-2" />
          <p className="text-xs text-gray-500 uppercase tracking-wide">Coût Total</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(calculations.totals.total)}</p>
        </div>

        <div className="bg-white rounded-lg p-4 border border-green-300 shadow-sm">
          <Wallet className="w-6 h-6 text-green-600 mb-2" />
          <p className="text-xs text-gray-500 uppercase tracking-wide">Capital Total</p>
          <p className="text-2xl font-bold text-green-700 mt-1">{formatCurrency(calculations.totals.capitalTotal)}</p>
        </div>

        <div className="bg-white rounded-lg p-4 border border-red-300 shadow-sm">
          <Calculator className="w-6 h-6 text-red-600 mb-2" />
          <p className="text-xs text-gray-500 uppercase tracking-wide">À Emprunter</p>
          <p className="text-2xl font-bold text-red-700 mt-1">{formatCurrency(calculations.totals.totalLoansNeeded)}</p>
        </div>
      </div>
    </div>
  );
}
