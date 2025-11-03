import { Star } from 'lucide-react';
import { formatCurrency } from '../../utils/formatting';
import PortageLotConfig from '../PortageLotConfig';
import AvailableLotsView from '../AvailableLotsView';
import { getAvailableLotsForNewcomer } from '../../utils/availableLots';
import { FormulaTooltip } from '../FormulaTooltip';
import {
  getTotalCostFormula,
  getPurchaseShareFormula,
  getLoanNeededFormula,
  getMonthlyPaymentFormula,
  getNotaryFeesFormula,
  getPersonalRenovationFormula,
  getConstructionCostFormula,
  getSharedCostsFormula
} from '../../utils/formulaExplanations';
import type { Participant, ParticipantCalculation, CalculationResults, ProjectParams } from '../../utils/calculatorUtils';

interface ParticipantDetailsPanelProps {
  participant: Participant;
  participantCalc: ParticipantCalculation;
  participantIndex: number;
  allParticipants: Participant[];
  calculations: CalculationResults;
  projectParams: ProjectParams;
  deedDate: string;
  pinnedParticipant: string | null;
  onPinParticipant: (name: string) => void;
  onUnpinParticipant: () => void;
  onUpdateParticipant: (index: number, updates: Partial<Participant>) => void;
  onUpdateParticipantSurface: (index: number, surface: number) => void;
  onUpdateCapital: (index: number, value: number) => void;
  onUpdateNotaryRate: (index: number, value: number) => void;
  onUpdateQuantity: (index: number, value: number) => void;
  onUpdateParachevementsPerM2: (index: number, value: number) => void;
  onUpdateCascoSqm: (index: number, value: number | undefined) => void;
  onUpdateParachevementsSqm: (index: number, value: number | undefined) => void;
  onUpdateInterestRate: (index: number, value: number) => void;
  onUpdateDuration: (index: number, value: number) => void;
  onAddPortageLot: (participantIndex: number) => void;
  onRemovePortageLot: (participantIndex: number, lotId: number) => void;
  onUpdatePortageLotSurface: (participantIndex: number, lotId: number, surface: number) => void;
}

export function ParticipantDetailsPanel({
  participantCalc: p,
  participantIndex: idx,
  allParticipants: participants,
  calculations,
  projectParams,
  deedDate,
  pinnedParticipant,
  onPinParticipant,
  onUnpinParticipant,
  onUpdateParticipant,
  onUpdateParticipantSurface: updateParticipantSurface,
  onUpdateCapital: updateCapital,
  onUpdateNotaryRate: updateNotaryRate,
  onUpdateQuantity: updateQuantity,
  onUpdateParachevementsPerM2: updateParachevementsPerM2,
  onUpdateCascoSqm: updateCascoSqm,
  onUpdateParachevementsSqm: updateParachevementsSqm,
  onUpdateInterestRate: updateInterestRate,
  onUpdateDuration: updateDuration,
  onAddPortageLot: addPortageLot,
  onRemovePortageLot: removePortageLot,
  onUpdatePortageLotSurface: updatePortageLotSurface,
}: ParticipantDetailsPanelProps) {
  // Helper to update the entire participant list - delegates to parent
  const setParticipants = (updater: (prev: Participant[]) => Participant[]) => {
    const updated = updater(participants);
    // Update the specific participant at this index
    onUpdateParticipant(idx, updated[idx]);
  };

  return (
    <div className="px-6 pb-6 border-t border-gray-200 pt-4 relative">
      {/* Pin button - top-right corner */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          if (pinnedParticipant === p.name) {
            onUnpinParticipant();
          } else {
            onPinParticipant(p.name);
          }
        }}
        className="absolute top-4 right-6 text-gray-400 hover:text-yellow-500 transition-colors"
        title={pinnedParticipant === p.name ? "Désépingler" : "Épingler en haut"}
      >
        <Star
          className="w-5 h-5"
          fill={pinnedParticipant === p.name ? "currentColor" : "none"}
          style={{ color: pinnedParticipant === p.name ? "#eab308" : undefined }}
        />
      </button>

      {/* Key Financial Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
          <p className="text-xs text-gray-500 mb-1">Coût Total</p>
          <p className="text-lg font-bold text-gray-900">
            <FormulaTooltip formula={getTotalCostFormula(p)}>
              {formatCurrency(p.totalCost)}
            </FormulaTooltip>
          </p>
        </div>
        <div className="bg-green-50 rounded-lg p-3 border border-green-300">
          <p className="text-xs text-gray-600 mb-1">Capital apporté</p>
          <p className="text-lg font-bold text-green-700">{formatCurrency(p.capitalApporte)}</p>
        </div>
        <div className="bg-red-50 rounded-lg p-3 border border-red-300">
          <p className="text-xs text-gray-600 mb-1">Emprunt</p>
          <p className="text-lg font-bold text-red-700">
            <FormulaTooltip formula={getLoanNeededFormula(p)}>
              {formatCurrency(p.loanNeeded)}
            </FormulaTooltip>
          </p>
        </div>
        <div className="bg-white rounded-lg p-3 border border-gray-200">
          <p className="text-xs text-gray-500 mb-1">Mensualité</p>
          <p className="text-lg font-bold text-red-600">
            <FormulaTooltip formula={getMonthlyPaymentFormula(p)}>
              {formatCurrency(p.monthlyPayment)}
            </FormulaTooltip>
          </p>
        </div>
      </div>

      {/* Entry Date Section */}
      <div className="mb-4 p-4 bg-green-50 rounded-lg border border-green-200">
        <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-3">📅 Date d'entrée</p>

        <div className="mb-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={participants[idx].isFounder || false}
              onChange={(e) => {
                const updated = [...participants];
                // When unchecking founder (becoming newcomer), set entry date to 1 year after deed date
                const defaultNewcomerDate = new Date(deedDate);
                defaultNewcomerDate.setFullYear(defaultNewcomerDate.getFullYear() + 1);

                updated[idx] = {
                  ...updated[idx],
                  isFounder: e.target.checked,
                  entryDate: e.target.checked
                    ? new Date(deedDate)
                    : (updated[idx].entryDate || defaultNewcomerDate),
                  purchaseDetails: e.target.checked ? undefined : updated[idx].purchaseDetails
                };
                setParticipants(() => updated);
              }}
              className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">
              Fondateur (entre à la date de l'acte)
            </span>
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Date d'entrée dans le projet
          </label>
          <input
            type="date"
            value={participants[idx].entryDate
              ? new Date(participants[idx].entryDate).toISOString().split('T')[0]
              : deedDate}
            onChange={(e) => {
              const newDate = new Date(e.target.value);
              if (newDate < new Date(deedDate)) {
                alert(`La date d'entrée ne peut pas être avant la date de l'acte (${deedDate})`);
                return;
              }
              const updated = [...participants];
              updated[idx] = {
                ...updated[idx],
                entryDate: newDate
              };
              setParticipants(() => updated);
            }}
            disabled={participants[idx].isFounder}
            min={deedDate}
            className={`w-full px-4 py-2 border-2 rounded-lg focus:outline-none ${
              participants[idx].isFounder
                ? 'bg-gray-100 border-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-white border-green-300 focus:border-green-500 focus:ring-2 focus:ring-green-500'
            }`}
          />
          <p className="text-xs text-gray-600 mt-1">
            {participants[idx].isFounder
              ? 'Les fondateurs entrent tous à la date de l\'acte'
              : 'Date à laquelle ce participant rejoint le projet (doit être >= date de l\'acte)'}
          </p>
        </div>
      </div>

      {/* Purchase Details (only for non-founders) */}
      {!participants[idx].isFounder && (
        <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-3">💰 Sélection du Lot</p>

          {/* Available Lots for Purchase */}
          <div className="mb-4">
            <AvailableLotsView
              availableLots={getAvailableLotsForNewcomer(
                participants,
                [
                  // Mock copropriété lot for testing
                  { lotId: 999, surface: 300, acquiredDate: new Date(deedDate), soldDate: undefined }
                ],
                calculations
              )}
              deedDate={new Date(deedDate)}
              onSelectLot={(lot, price) => {
                const updated = [...participants];
                updated[idx] = {
                  ...updated[idx],
                  surface: lot.surface, // Set surface from selected lot
                  capitalApporte: Math.min(updated[idx].capitalApporte || 0, price.totalPrice), // Ensure capital doesn't exceed price
                  purchaseDetails: {
                    buyingFrom: lot.fromParticipant || 'Copropriété',
                    lotId: lot.lotId,
                    purchasePrice: price.totalPrice
                  }
                };
                setParticipants(() => updated);
              }}
            />
          </div>

          {/* Show selected lot details if any */}
          {participants[idx].purchaseDetails?.lotId && (
            <div className="bg-green-50 border border-green-300 rounded-lg p-3 mt-3">
              <div className="flex items-start justify-between mb-2">
                <p className="text-xs font-semibold text-green-800">✅ Lot sélectionné:</p>
                <button
                  onClick={() => {
                    const updated = [...participants];
                    updated[idx] = {
                      ...updated[idx],
                      purchaseDetails: undefined,
                      surface: 0
                    };
                    setParticipants(() => updated);
                  }}
                  className="text-xs text-red-600 hover:text-red-800 font-semibold hover:underline"
                >
                  ✕ Changer de lot
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <span className="text-gray-600">Lot:</span>
                  <span className="font-semibold ml-1">#{participants[idx].purchaseDetails.lotId}</span>
                </div>
                <div>
                  <span className="text-gray-600">De:</span>
                  <span className="font-semibold ml-1">{participants[idx].purchaseDetails.buyingFrom}</span>
                </div>
                <div>
                  <span className="text-gray-600">Prix:</span>
                  <span className="font-semibold ml-1">€{participants[idx].purchaseDetails.purchasePrice?.toLocaleString('fr-BE', { maximumFractionDigits: 0 })}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Configuration Section */}
      <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-3">Configuration</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-600 mb-1">
              Surface totale (m²)
              {!participants[idx].isFounder && participants[idx].purchaseDetails?.buyingFrom &&
               participants[idx].purchaseDetails?.buyingFrom !== 'Copropriété' && (
                <span className="ml-2 text-orange-600 font-semibold">🔒 Imposée par portage</span>
              )}
            </label>
            <input
              type="number"
              step="1"
              value={p.surface}
              onChange={(e) => updateParticipantSurface(idx, parseFloat(e.target.value) || 0)}
              disabled={!participants[idx].isFounder &&
                        !!participants[idx].purchaseDetails?.buyingFrom &&
                        participants[idx].purchaseDetails?.buyingFrom !== 'Copropriété'}
              className={`w-full px-3 py-2 font-medium border rounded-lg focus:outline-none ${
                !participants[idx].isFounder && participants[idx].purchaseDetails?.buyingFrom &&
                participants[idx].purchaseDetails?.buyingFrom !== 'Copropriété'
                  ? 'border-orange-300 bg-orange-50 text-gray-700 cursor-not-allowed'
                  : 'border-gray-300 bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
              }`}
            />
            <p className="text-xs text-gray-500 mt-1">Total pour {p.quantity || 1} {(p.quantity || 1) > 1 ? 'unités' : 'unité'}</p>
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Quantité</label>
            <input
              type="number"
              step="1"
              min="1"
              value={p.quantity}
              onChange={(e) => updateQuantity(idx, parseInt(e.target.value) || 1)}
              className="w-full px-3 py-2 font-medium border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Capital apporté</label>
            <input
              type="number"
              step="10000"
              value={p.capitalApporte}
              onChange={(e) => updateCapital(idx, parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 text-base font-semibold border border-green-300 rounded-lg focus:border-green-500 focus:ring-1 focus:ring-green-500 focus:outline-none bg-white text-green-700"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Frais de notaire</label>
            <div className="flex items-center gap-2 mb-1">
              <label className="flex items-center gap-1.5 cursor-pointer px-3 py-2 border rounded-lg transition-colors hover:bg-gray-100" style={{
                borderColor: p.notaryFeesRate === 3 ? '#9ca3af' : '#e5e7eb',
                backgroundColor: p.notaryFeesRate === 3 ? '#f3f4f6' : 'white'
              }}>
                <input
                  type="radio"
                  name={`notaryRate-${idx}`}
                  value="3"
                  checked={p.notaryFeesRate === 3}
                  onChange={(e) => updateNotaryRate(idx, parseFloat(e.target.value))}
                  className="w-4 h-4"
                />
                <span className="font-medium text-gray-700 text-sm">3%</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer px-3 py-2 border rounded-lg transition-colors hover:bg-gray-100" style={{
                borderColor: p.notaryFeesRate === 12.5 ? '#9ca3af' : '#e5e7eb',
                backgroundColor: p.notaryFeesRate === 12.5 ? '#f3f4f6' : 'white'
              }}>
                <input
                  type="radio"
                  name={`notaryRate-${idx}`}
                  value="12.5"
                  checked={p.notaryFeesRate === 12.5}
                  onChange={(e) => updateNotaryRate(idx, parseFloat(e.target.value))}
                  className="w-4 h-4"
                />
                <span className="font-medium text-gray-700 text-sm">12.5%</span>
              </label>
            </div>
            <div className="text-sm text-gray-600">
              = {formatCurrency(p.notaryFees)}
            </div>
          </div>

          {/* Portage Lot Configuration (only for founders) */}
          {participants[idx].isFounder && (
            <PortageLotConfig
              portageLots={participants[idx].lotsOwned?.filter((lot: any) => lot.isPortage) || []}
              onAddLot={() => addPortageLot(idx)}
              onRemoveLot={(lotId) => removePortageLot(idx, lotId)}
              onUpdateSurface={(lotId, surface) => updatePortageLotSurface(idx, lotId, surface)}
            />
          )}

          <div>
            <label className="block text-xs text-gray-600 mb-1">Taux d'intérêt (%)</label>
            <input
              type="number"
              step="0.1"
              value={p.interestRate}
              onChange={(e) => updateInterestRate(idx, parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 font-medium border border-gray-300 rounded-lg focus:border-gray-500 focus:ring-1 focus:ring-gray-500 focus:outline-none bg-white"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Durée (années)</label>
            <input
              type="number"
              value={p.durationYears}
              onChange={(e) => updateDuration(idx, parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 font-medium border border-gray-300 rounded-lg focus:border-gray-500 focus:ring-1 focus:ring-gray-500 focus:outline-none bg-white"
            />
          </div>
        </div>
      </div>

      {/* Cost Breakdown */}
      <div className="mb-4">
        <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-2">Décomposition des Coûts</p>
        <div className="grid grid-cols-2 md:grid-cols-7 gap-2">
          <div className="bg-white rounded-lg p-3 border border-gray-200">
            <p className="text-xs text-gray-500 mb-1">Part d'achat</p>
            <p className="text-base font-bold text-gray-900">
              <FormulaTooltip formula={getPurchaseShareFormula(p, calculations.pricePerM2)}>
                {formatCurrency(p.purchaseShare)}
              </FormulaTooltip>
            </p>
            <p className="text-xs text-blue-600 mt-0.5">{p.surface}m²</p>
          </div>

          <div className="bg-white rounded-lg p-3 border border-gray-200">
            <p className="text-xs text-gray-500 mb-1">Frais notaire</p>
            <p className="text-base font-bold text-gray-900">
              <FormulaTooltip formula={getNotaryFeesFormula(p)}>
                {formatCurrency(p.notaryFees)}
              </FormulaTooltip>
            </p>
            <p className="text-xs text-gray-400 mt-0.5">{p.notaryFeesRate}%</p>
          </div>

          <div className="bg-white rounded-lg p-3 border border-orange-200">
            <p className="text-xs text-gray-500 mb-1">Rénovation perso.</p>
            <p className="text-base font-bold text-orange-700">
              <FormulaTooltip formula={getPersonalRenovationFormula(p)}>
                {formatCurrency(p.personalRenovationCost)}
              </FormulaTooltip>
            </p>
            <p className="text-xs text-orange-500 mt-0.5">CASCO + Parachèv.</p>
          </div>

          <div className="bg-white rounded-lg p-3 border border-gray-200">
            <p className="text-xs text-gray-500 mb-1">Construction</p>
            <p className="text-base font-bold text-gray-900">
              <FormulaTooltip formula={getConstructionCostFormula(p, calculations.totals.construction, participants.length)}>
                {formatCurrency(p.constructionCost)}
              </FormulaTooltip>
            </p>
            {(p.quantity || 1) > 1 && (
              <p className="text-xs text-gray-400 mt-0.5">{formatCurrency(p.constructionCostPerUnit)}/u</p>
            )}
          </div>

          <div className="bg-white rounded-lg p-3 border border-purple-200">
            <p className="text-xs text-gray-500 mb-1">Travaux communs</p>
            <p className="text-base font-bold text-purple-700">{formatCurrency(p.travauxCommunsPerUnit)}</p>
            <p className="text-xs text-purple-500 mt-0.5">Quote-part fixe (÷{participants.length})</p>
          </div>

          <div className="bg-white rounded-lg p-3 border border-purple-200">
            <p className="text-xs text-gray-500 mb-1">Quote-part</p>
            <p className="text-base font-bold text-purple-700">
              <FormulaTooltip formula={getSharedCostsFormula(p, participants.length)}>
                {formatCurrency(p.sharedCosts)}
              </FormulaTooltip>
            </p>
          </div>

          <div className="bg-green-50 rounded-lg p-3 border border-green-300">
            <p className="text-xs text-gray-600 mb-1">Capital apporté</p>
            <p className="text-base font-bold text-green-700">{formatCurrency(p.capitalApporte)}</p>
          </div>
        </div>
      </div>

      {/* Construction Detail */}
      <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-3">Détail Construction</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
          {/* CASCO - Display only (not editable) */}
          <div className="bg-white p-3 rounded-lg border border-gray-200">
            <p className="text-xs text-gray-500 mb-1">CASCO (gros œuvre)</p>
            <p className="text-lg font-bold text-gray-900">{formatCurrency(p.casco)}</p>
            <p className="text-xs text-gray-400">
              {participants[idx].cascoSqm || p.surface}m² × {projectParams.globalCascoPerM2}€/m² (global)
            </p>
          </div>

          {/* Parachèvements - Editable */}
          <div className="bg-white p-3 rounded-lg border border-gray-200">
            <label className="block text-xs text-gray-500 mb-1">Parachèvements - Prix/m²</label>
            <input
              type="number"
              step="10"
              value={participants[idx].parachevementsPerM2}
              onChange={(e) => updateParachevementsPerM2(idx, parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 text-sm font-semibold border border-gray-300 rounded-lg focus:border-gray-500 focus:ring-1 focus:ring-gray-500 focus:outline-none mb-2"
            />
            <p className="text-xs text-gray-500">Total: <span className="font-bold text-gray-900">{formatCurrency(p.parachevements)}</span></p>
            <p className="text-xs text-gray-400">{participants[idx].parachevementsSqm || p.surface}m² × {participants[idx].parachevementsPerM2}€/m²</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
            <label className="block text-xs text-blue-700 font-medium mb-1">Surface à rénover CASCO (m²)</label>
            <input
              type="number"
              step="1"
              min="0"
              max={p.surface}
              value={participants[idx].cascoSqm || p.surface}
              onChange={(e) => updateCascoSqm(idx, parseFloat(e.target.value) || undefined)}
              className="w-full px-3 py-2 text-sm font-semibold border border-blue-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
              placeholder={`${p.surface}m² (total)`}
            />
            <p className="text-xs text-blue-600 mt-1">Surface totale: {p.surface}m²</p>
          </div>
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
            <label className="block text-xs text-blue-700 font-medium mb-1">Surface à rénover Parachèvements (m²)</label>
            <input
              type="number"
              step="1"
              min="0"
              max={p.surface}
              value={participants[idx].parachevementsSqm || p.surface}
              onChange={(e) => updateParachevementsSqm(idx, parseFloat(e.target.value) || undefined)}
              className="w-full px-3 py-2 text-sm font-semibold border border-blue-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
              placeholder={`${p.surface}m² (total)`}
            />
            <p className="text-xs text-blue-600 mt-1">Surface totale: {p.surface}m²</p>
          </div>
        </div>
      </div>

      {/* Financing Result */}
      <div className="bg-red-50 rounded-lg p-5 border border-red-200">
        <div className="flex justify-between items-center mb-4">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Emprunt Nécessaire</p>
            <p className="text-sm text-gray-600">{p.financingRatio.toFixed(1)}% du coût à financer</p>
          </div>
          <p className="text-3xl font-bold text-red-700">{formatCurrency(p.loanNeeded)}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3 border-t border-red-200">
          <div className="bg-white rounded-lg p-3 border border-gray-200">
            <p className="text-xs text-gray-500 mb-1">Mensualité</p>
            <p className="text-lg font-bold text-red-600">{formatCurrency(p.monthlyPayment)}</p>
            <p className="text-xs text-gray-400 mt-0.5">{p.durationYears} ans @ {p.interestRate}%</p>
          </div>

          <div className="bg-white rounded-lg p-3 border border-gray-200">
            <p className="text-xs text-gray-500 mb-1">Total Remboursé</p>
            <p className="text-lg font-bold text-gray-900">{formatCurrency(p.totalRepayment)}</p>
          </div>

          <div className="bg-white rounded-lg p-3 border border-red-200">
            <p className="text-xs text-gray-500 mb-1">Coût Crédit</p>
            <p className="text-lg font-bold text-red-700">{formatCurrency(p.totalInterest)}</p>
          </div>
        </div>
      </div>

      {/* Expected Paybacks - Show portage paybacks AND copropriété redistributions */}
      {(() => {
        // 1. Find all participants who are buying from this participant (portage)
        const portagePaybacks = participants
          .filter((buyer: any) => buyer.purchaseDetails?.buyingFrom === participants[idx].name)
          .map((buyer: any) => ({
            date: buyer.entryDate || new Date(deedDate),
            buyer: buyer.name,
            amount: buyer.purchaseDetails?.purchasePrice || 0,
            type: 'portage' as const,
            description: 'Achat de lot portage'
          }));

        // 2. Calculate copropriété redistributions for this participant
        const coproSales = participants
          .filter((buyer: any) => buyer.purchaseDetails?.buyingFrom === 'Copropriété')
          .map((buyer: any) => ({
            buyer: buyer.name,
            entryDate: buyer.entryDate || new Date(deedDate),
            amount: buyer.purchaseDetails?.purchasePrice || 0
          }));

        const coproRedistributions = coproSales.map((sale: any) => {
          const saleDate = new Date(sale.entryDate);
          const participantEntryDate = participants[idx].entryDate
            ? new Date(participants[idx].entryDate)
            : new Date(deedDate);

          console.log(`[Copro Redistribution] Participant: ${participants[idx].name}`);
          console.log(`  - Entry date: ${participantEntryDate.toISOString()}`);
          console.log(`  - Sale date: ${saleDate.toISOString()}`);
          console.log(`  - Buyer: ${sale.buyer}`);
          console.log(`  - Eligible: ${participantEntryDate < saleDate}`);

          // Only participants who entered before the sale date get a share
          if (participantEntryDate >= saleDate) {
            return null;
          }

          // Calculate months in project until sale
          const monthsInProject = (saleDate.getTime() - participantEntryDate.getTime()) / (1000 * 60 * 60 * 24 * 30.44);

          // Calculate total months for all eligible participants
          const eligibleParticipants = participants.filter((p: any) => {
            const pEntryDate = p.entryDate ? new Date(p.entryDate) : new Date(deedDate);
            return pEntryDate < saleDate;
          });

          const totalMonths = eligibleParticipants.reduce((sum: number, p: any) => {
            const pEntryDate = p.entryDate ? new Date(p.entryDate) : new Date(deedDate);
            const pMonths = (saleDate.getTime() - pEntryDate.getTime()) / (1000 * 60 * 60 * 24 * 30.44);
            return sum + pMonths;
          }, 0);

          // Calculate this participant's share
          const shareRatio = totalMonths > 0 ? monthsInProject / totalMonths : 0;
          const shareAmount = sale.amount * shareRatio;

          return {
            date: sale.entryDate,
            buyer: sale.buyer,
            amount: shareAmount,
            type: 'copro' as const,
            description: `Part copropriété (${(shareRatio * 100).toFixed(1)}%)`
          };
        }).filter((r: any) => r !== null);

        // 3. Combine and sort all paybacks
        const allPaybacks = [...portagePaybacks, ...coproRedistributions]
          .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());

        if (allPaybacks.length > 0) {
          const totalRecovered = allPaybacks.reduce((sum: number, pb: any) => sum + pb.amount, 0);

          return (
            <div className="mt-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
              <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-3">💰 Remboursements attendus</p>
              <div className="space-y-2">
                {allPaybacks.map((pb: any, pbIdx: number) => (
                  <div key={pbIdx} className="bg-white rounded-lg p-3 border border-purple-100">
                    <div className="flex justify-between items-center mb-1">
                      <div>
                        <span className="font-medium text-gray-800">{pb.buyer}</span>
                        <span className="text-gray-600 text-xs ml-2">
                          ({new Date(pb.date).toLocaleDateString('fr-BE', { year: 'numeric', month: 'short', day: 'numeric' })})
                        </span>
                      </div>
                      <div className="font-bold text-purple-700">
                        {formatCurrency(pb.amount)}
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      {pb.type === 'portage' ? '💼 ' : '🏢 '}{pb.description}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-purple-300 flex justify-between items-center">
                <span className="text-sm font-semibold text-gray-800">Total récupéré</span>
                <span className="text-lg font-bold text-purple-800">
                  {formatCurrency(totalRecovered)}
                </span>
              </div>
              <p className="text-xs text-purple-600 mt-2">
                Ces montants seront versés lorsque les nouveaux participants entreront dans le projet.
              </p>
            </div>
          );
        }
        return null;
      })()}
    </div>
  );
}
