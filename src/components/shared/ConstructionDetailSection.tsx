import { formatCurrency } from '../../utils/formatting';
import type { Participant, ParticipantCalculation, ProjectParams } from '../../utils/calculatorUtils';

interface ConstructionDetailSectionProps {
  participant: Participant;
  participantCalc: ParticipantCalculation;
  projectParams: ProjectParams;
  onUpdateParachevementsPerM2: (value: number) => void;
  onUpdateCascoSqm: (value: number | undefined) => void;
  onUpdateParachevementsSqm: (value: number | undefined) => void;
}

/**
 * Construction detail section showing CASCO and Parachèvements configuration
 * Allows editing of surface areas and unit prices
 */
export function ConstructionDetailSection({
  participant,
  participantCalc: p,
  projectParams,
  onUpdateParachevementsPerM2,
  onUpdateCascoSqm,
  onUpdateParachevementsSqm
}: ConstructionDetailSectionProps) {
  return (
    <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
      <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-3">Détail Construction</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
        {/* CASCO Display */}
        <div className="bg-white p-3 rounded-lg border border-gray-200">
          <p className="text-xs text-gray-500 mb-1">CASCO (gros œuvre)</p>
          <p className="text-lg font-bold text-gray-900">{formatCurrency(p.casco)}</p>
          <p className="text-xs text-gray-400">
            {participant.cascoSqm || p.surface}m² × {projectParams.globalCascoPerM2}€/m² (global){projectParams.cascoTvaRate ? ` + TVA ${projectParams.cascoTvaRate}%` : ''}
          </p>
        </div>

        {/* Parachèvements Editable */}
        <div className="bg-white p-3 rounded-lg border border-gray-200">
          <label className="block text-xs text-gray-500 mb-1">Parachèvements - Prix/m²</label>
          <input
            type="number"
            step="10"
            value={participant.parachevementsPerM2}
            onChange={(e) => onUpdateParachevementsPerM2(parseFloat(e.target.value) || 0)}
            className="w-full px-3 py-2 text-sm font-semibold border border-gray-300 rounded-lg focus:border-gray-500 focus:ring-1 focus:ring-gray-500 focus:outline-none mb-2"
          />
          <p className="text-xs text-gray-500">
            Total: <span className="font-bold text-gray-900">{formatCurrency(p.parachevements)}</span>
          </p>
          <p className="text-xs text-gray-400">
            {participant.parachevementsSqm || p.surface}m² × {participant.parachevementsPerM2}€/m²
          </p>
        </div>
      </div>

      {/* Surface Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
          <label className="block text-xs text-blue-700 font-medium mb-1">
            Surface à rénover CASCO (m²)
          </label>
          <input
            type="number"
            step="1"
            min="0"
            max={p.surface}
            value={participant.cascoSqm || p.surface}
            onChange={(e) => onUpdateCascoSqm(parseFloat(e.target.value) || undefined)}
            className="w-full px-3 py-2 text-sm font-semibold border border-blue-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
            placeholder={`${p.surface}m² (total)`}
          />
          <p className="text-xs text-blue-600 mt-1">Surface totale: {p.surface}m²</p>
        </div>

        <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
          <label className="block text-xs text-blue-700 font-medium mb-1">
            Surface à rénover Parachèvements (m²)
          </label>
          <input
            type="number"
            step="1"
            min="0"
            max={p.surface}
            value={participant.parachevementsSqm || p.surface}
            onChange={(e) => onUpdateParachevementsSqm(parseFloat(e.target.value) || undefined)}
            className="w-full px-3 py-2 text-sm font-semibold border border-blue-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
            placeholder={`${p.surface}m² (total)`}
          />
          <p className="text-xs text-blue-600 mt-1">Surface totale: {p.surface}m²</p>
        </div>
      </div>
    </div>
  );
}
