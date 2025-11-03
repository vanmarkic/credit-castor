import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { PortageFormulaParams } from '../utils/calculatorUtils';
import { calculateCarryingCosts, calculateFormulaPreview } from '../utils/portageCalculations';
import { formatCurrency } from '../utils/formatting';

interface PortageFormulaConfigProps {
  formulaParams: PortageFormulaParams;
  onUpdateParams: (params: PortageFormulaParams) => void;
  deedDate: Date;
}

export default function PortageFormulaConfig({
  formulaParams,
  onUpdateParams,
  deedDate: _deedDate
}: PortageFormulaConfigProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleUpdate = (field: keyof PortageFormulaParams, value: number) => {
    onUpdateParams({
      ...formulaParams,
      [field]: value
    });
  };

  // Example calculation for preview (2.5 years on €60,000 lot)
  const exampleYears = 2.5;
  const exampleBase = 60000;
  const exampleCarryingCosts = calculateCarryingCosts(
    exampleBase,
    0,
    Math.round(exampleYears * 12),
    formulaParams.averageInterestRate
  );
  const preview = calculateFormulaPreview(
    exampleBase,
    exampleYears,
    formulaParams,
    exampleCarryingCosts
  );

  return (
    <div className="mb-6 bg-blue-50 rounded-lg border-2 border-blue-200">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-blue-100 transition-colors rounded-t-lg"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">📦</span>
          <h3 className="text-lg font-bold text-blue-900">
            Configuration Formule de Portage
          </h3>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-blue-700" />
        ) : (
          <ChevronDown className="w-5 h-5 text-blue-700" />
        )}
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-6 pb-6 pt-2 space-y-6">
          {/* Adjustable Parameters */}
          <div>
            <h4 className="text-sm font-semibold text-blue-900 mb-3">
              Paramètres ajustables
            </h4>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label
                  htmlFor="indexationRate"
                  className="block text-xs text-gray-700 mb-1"
                >
                  Taux d'indexation annuel
                </label>
                <div className="flex items-center gap-2">
                  <input
                    id="indexationRate"
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    value={formulaParams.indexationRate}
                    onChange={(e) =>
                      handleUpdate('indexationRate', parseFloat(e.target.value) || 0)
                    }
                    className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  <span className="text-sm text-gray-600">%</span>
                </div>
              </div>

              <div>
                <label
                  htmlFor="carryingCostRecovery"
                  className="block text-xs text-gray-700 mb-1"
                >
                  Récupération frais de portage
                </label>
                <div className="flex items-center gap-2">
                  <input
                    id="carryingCostRecovery"
                    type="number"
                    step="5"
                    min="0"
                    max="100"
                    value={formulaParams.carryingCostRecovery}
                    onChange={(e) =>
                      handleUpdate('carryingCostRecovery', parseFloat(e.target.value) || 0)
                    }
                    className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  <span className="text-sm text-gray-600">%</span>
                </div>
              </div>

              <div>
                <label
                  htmlFor="averageInterestRate"
                  className="block text-xs text-gray-700 mb-1"
                >
                  Taux d'intérêt moyen
                </label>
                <div className="flex items-center gap-2">
                  <input
                    id="averageInterestRate"
                    type="number"
                    step="0.1"
                    min="0"
                    max="15"
                    value={formulaParams.averageInterestRate}
                    onChange={(e) =>
                      handleUpdate('averageInterestRate', parseFloat(e.target.value) || 0)
                    }
                    className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  <span className="text-sm text-gray-600">%</span>
                </div>
              </div>
            </div>
          </div>

          <hr className="border-blue-200" />

          {/* Formula Explanation */}
          <div>
            <h4 className="text-sm font-semibold text-blue-900 mb-2">
              Aperçu de la formule
            </h4>
            <div className="bg-white p-4 rounded-lg border border-blue-200 space-y-2 text-sm">
              <div className="font-semibold text-blue-900">
                Prix de vente = Base + Indexation + Frais de portage
              </div>
              <div className="text-gray-700 space-y-1 text-xs">
                <div><strong>Où:</strong></div>
                <div>• Base = Achat initial + Frais notaire + Construction</div>
                <div>
                  • Indexation = Base × [(1 + {formulaParams.indexationRate}%)^années - 1]
                </div>
                <div>
                  • Frais de portage = (Intérêts + Taxes + Assurance) × {formulaParams.carryingCostRecovery}%
                </div>
              </div>
            </div>
          </div>

          {/* Example Calculation */}
          <div>
            <h4 className="text-sm font-semibold text-blue-900 mb-2">
              Exemple pour {exampleYears} ans de portage sur lot de {formatCurrency(exampleBase)}
            </h4>
            <div className="bg-white rounded-lg border border-blue-200 overflow-hidden">
              <table className="w-full text-sm">
                <tbody>
                  <tr className="border-b border-blue-100">
                    <td className="px-4 py-2 text-gray-700">Base acquisition</td>
                    <td className="px-4 py-2 text-right font-semibold">
                      {formatCurrency(exampleBase)}
                    </td>
                  </tr>
                  <tr className="border-b border-blue-100">
                    <td className="px-4 py-2 text-gray-700">
                      Indexation ({formulaParams.indexationRate}% × {exampleYears} ans)
                    </td>
                    <td className="px-4 py-2 text-right font-semibold">
                      {formatCurrency(preview.indexation)}
                    </td>
                  </tr>
                  <tr className="border-b border-blue-100">
                    <td className="px-4 py-2 text-gray-700">
                      Frais de portage ({exampleYears} ans)
                    </td>
                    <td className="px-4 py-2 text-right font-semibold">
                      {formatCurrency(preview.carryingCostRecovery)}
                    </td>
                  </tr>
                  <tr className="border-b border-blue-100 text-xs text-gray-600">
                    <td className="px-6 py-1">
                      - Intérêts ({formulaParams.averageInterestRate}% sur prêt)
                    </td>
                    <td className="px-4 py-1 text-right">
                      {formatCurrency(exampleCarryingCosts.monthlyInterest * exampleYears * 12)}
                    </td>
                  </tr>
                  <tr className="border-b border-blue-100 text-xs text-gray-600">
                    <td className="px-6 py-1">- Taxe bâtiment inoccupé</td>
                    <td className="px-4 py-1 text-right">
                      {formatCurrency(exampleCarryingCosts.monthlyTax * exampleYears * 12)}
                    </td>
                  </tr>
                  <tr className="border-b border-blue-200 text-xs text-gray-600">
                    <td className="px-6 py-1">- Assurance</td>
                    <td className="px-4 py-1 text-right">
                      {formatCurrency(exampleCarryingCosts.monthlyInsurance * exampleYears * 12)}
                    </td>
                  </tr>
                  <tr className="bg-blue-50">
                    <td className="px-4 py-3 font-bold text-blue-900">Prix total de vente</td>
                    <td className="px-4 py-3 text-right font-bold text-blue-900">
                      {formatCurrency(preview.totalPrice)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
