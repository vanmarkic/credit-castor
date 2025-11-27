import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { formatCurrency } from '../../utils/formatting';
import type { Participant, ParticipantCalculation, ProjectParams } from '../../utils/calculatorUtils';

interface PropertySectionProps {
  participant: Participant;
  participantCalc: ParticipantCalculation;
  projectParams: ProjectParams;
  onUpdateSurface: (surface: number) => void;
  onUpdateQuantity: (qty: number) => void;
  onUpdateParachevementsPerM2: (value: number) => void;
  onUpdateCascoSqm: (value: number | undefined) => void;
  onUpdateParachevementsSqm: (value: number | undefined) => void;
  defaultExpanded?: boolean;
}

export function PropertySection({
  participant,
  participantCalc: p,
  projectParams,
  onUpdateSurface,
  onUpdateQuantity,
  onUpdateParachevementsPerM2,
  onUpdateCascoSqm,
  onUpdateParachevementsSqm,
  defaultExpanded = false,
}: PropertySectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const isLocked = !participant.isFounder &&
    !!participant.purchaseDetails?.buyingFrom &&
    participant.purchaseDetails?.buyingFrom !== 'Copropriété';

  // Calculate CASCO details
  const cascoSqm = participant.cascoSqm ?? p.surface ?? 0;
  const cascoPerM2 = projectParams.globalCascoPerM2 || 0;
  const cascoTvaRate = projectParams.cascoTvaRate || 6;
  const cascoBase = cascoSqm * cascoPerM2;
  const cascoWithTva = cascoBase * (1 + cascoTvaRate / 100);

  // Parachèvements details
  const parachevementsSqm = participant.parachevementsSqm ?? p.surface ?? 0;
  const parachevementsPerM2 = participant.parachevementsPerM2 ?? 0;
  const parachevementsTotal = parachevementsSqm * parachevementsPerM2;

  // Summary values for collapsed state
  const totalConstruction = cascoWithTva + parachevementsTotal;
  const summaryText = `${p.surface}m² · ${formatCurrency(totalConstruction)}`;

  return (
    <div className="bg-gray-50 rounded-lg border border-gray-200">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span>🏗️</span>
          <span className="font-medium text-gray-700">Bien immobilier</span>
          <span className="text-sm text-gray-500">({summaryText})</span>
        </div>
        <div className="flex items-center gap-3">
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronRight className="w-4 h-4 text-gray-400" />
          )}
        </div>
      </button>

      {isExpanded && (
        <div className="p-4 pt-0 border-t border-gray-200 space-y-4">
          {/* Surface and Quantity - Top row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-600 mb-1">
                Surface totale (m²)
                {isLocked && (
                  <span className="ml-2 text-orange-600 font-semibold">🔒 Portage</span>
                )}
              </label>
              <input
                type="number"
                step="1"
                value={p.surface}
                onChange={(e) => onUpdateSurface(parseFloat(e.target.value) || 0)}
                disabled={isLocked}
                className={`w-full px-3 py-2 font-medium border rounded-lg focus:outline-none ${
                  isLocked
                    ? 'border-orange-300 bg-orange-50 text-gray-700 cursor-not-allowed'
                    : 'border-gray-300 bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
                }`}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Quantité d'unités</label>
              <input
                type="number"
                step="1"
                min="1"
                value={p.quantity}
                onChange={(e) => onUpdateQuantity(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 font-medium border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white"
              />
            </div>
          </div>

          {/* Construction costs */}
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-3">
              Coûts de construction
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* CASCO - Read-only display */}
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                <p className="text-xs text-gray-500 mb-1">CASCO (gros œuvre)</p>
                <p className="text-lg font-bold text-gray-900">{formatCurrency(cascoWithTva)}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {cascoSqm}m² × {cascoPerM2}€/m² + TVA {cascoTvaRate}%
                </p>
              </div>

              {/* Parachèvements - Editable */}
              <div className="bg-white p-3 rounded-lg border border-gray-200">
                <label className="block text-xs text-gray-500 mb-1">
                  Parachèvements (€/m²)
                </label>
                <input
                  type="number"
                  step="10"
                  value={parachevementsPerM2}
                  onChange={(e) => onUpdateParachevementsPerM2(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 text-sm font-semibold border border-gray-300 rounded-lg focus:border-gray-500 focus:ring-1 focus:ring-gray-500 focus:outline-none mb-2"
                />
                <p className="text-xs text-gray-500">
                  Total: <span className="font-bold text-gray-900">{formatCurrency(parachevementsTotal)}</span>
                </p>
                <p className="text-xs text-gray-400">
                  {parachevementsSqm}m² × {parachevementsPerM2}€/m²
                </p>
              </div>
            </div>

            {/* Surface adjustments - Only show if different from total */}
            <div className="mt-4 pt-3 border-t border-gray-100">
              <p className="text-xs text-blue-700 font-medium mb-2">
                Surfaces à rénover (si différent de la surface totale)
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">
                    Surface CASCO (m²)
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    max={p.surface}
                    value={cascoSqm}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value);
                      onUpdateCascoSqm(value === p.surface ? undefined : value);
                    }}
                    placeholder={`${p.surface}m² (total)`}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">
                    Surface parachèvements (m²)
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    max={p.surface}
                    value={parachevementsSqm}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value);
                      onUpdateParachevementsSqm(value === p.surface ? undefined : value);
                    }}
                    placeholder={`${p.surface}m² (total)`}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
