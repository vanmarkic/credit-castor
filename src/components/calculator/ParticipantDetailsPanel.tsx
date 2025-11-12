import { Star } from 'lucide-react';
import { formatCurrency } from '../../utils/formatting';
import PortageLotConfig from '../PortageLotConfig';
import AvailableLotsView from '../AvailableLotsView';
import { ExpectedPaybacksCard } from '../shared/ExpectedPaybacksCard';
import { getAvailableLotsForNewcomer } from '../../utils/availableLots';
import { FormulaTooltip } from '../FormulaTooltip';
import { useParticipantFieldPermissions } from '../../hooks/useFieldPermissions';
import {
  getTotalCostFormula,
  getPurchaseShareFormula,
  getLoanNeededFormula,
  getMonthlyPaymentFormula,
  getNotaryFeesFormula,
  getFraisNotaireFixeFormula,
  getSharedCostsFormula,
  getCascoFormula,
  getParachevementsFormula,
  getTravauxCommunsFormula,
  getTotalRepaymentFormula,
  getTotalInterestFormula
} from '../../utils/formulaExplanations';
import type { Participant, ParticipantCalculation, CalculationResults, ProjectParams, PortageFormulaParams } from '../../utils/calculatorUtils';

interface ParticipantDetailsPanelProps {
  participant: Participant;
  participantCalc: ParticipantCalculation;
  participantIndex: number;
  allParticipants: Participant[];
  calculations: CalculationResults;
  projectParams: ProjectParams;
  deedDate: string;
  formulaParams: PortageFormulaParams;
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
  onUpdatePortageLotConstructionPayment?: (participantIndex: number, lotId: number, founderPaysCasco: boolean, founderPaysParachèvement: boolean) => void;
}

export function ParticipantDetailsPanel({
  participantCalc: p,
  participantIndex: idx,
  allParticipants: participants,
  calculations,
  projectParams,
  deedDate,
  formulaParams,
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
  onUpdatePortageLotConstructionPayment: updatePortageLotConstructionPayment,
}: ParticipantDetailsPanelProps) {
  // Permission checks for collective financing fields
  const { canEdit: canEditInterestRate } = useParticipantFieldPermissions('interestRate', idx);
  const { canEdit: canEditDuration } = useParticipantFieldPermissions('durationYears', idx);
  const { canEdit: canEditNotaryRate } = useParticipantFieldPermissions('registrationFeesRate', idx);

  // Helper to update the entire participant list - delegates to parent
  const setParticipants = (updater: (prev: Participant[]) => Participant[]) => {
    const updated = updater(participants);
    // Update the specific participant at this index
    onUpdateParticipant(idx, updated[idx]);
  };

  // Check if participant is buying a portage lot and get construction payment info
  const portageLotInfo = participants[idx].purchaseDetails?.lotId
    ? (() => {
        const portageLot = participants
          .flatMap(seller => seller.lotsOwned || [])
          .find(lot => lot.lotId === participants[idx].purchaseDetails!.lotId && lot.isPortage);
        return portageLot ? {
          founderPaysCasco: portageLot.founderPaysCasco || false,
          founderPaysParachèvement: portageLot.founderPaysParachèvement || false
        } : null;
      })()
    : null;

  return (
    <div
      id={`participant-${p.name}`}
      className="px-6 pb-6 border-t border-gray-200 pt-4 relative transition-all duration-200"
    >
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
              Fondateur·rice (entre à la date de l'acte)
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
              ? 'Les fondateur·rice·s entrent tous·tes à la date de l\'acte'
              : 'Date à laquelle ce·tte participant·e rejoint le projet (doit être >= date de l\'acte)'}
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
              formulaParams={formulaParams}
              onSelectLot={(lot, price) => {
                const updated = [...participants];

                // Update buyer (current participant)
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

                // Update seller's lot with soldDate (if buying from a founder)
                if (lot.source === 'FOUNDER' && lot.fromParticipant) {
                  const sellerIdx = updated.findIndex(p => p.name === lot.fromParticipant);
                  if (sellerIdx !== -1 && updated[sellerIdx].lotsOwned) {
                    updated[sellerIdx] = {
                      ...updated[sellerIdx],
                      lotsOwned: updated[sellerIdx].lotsOwned?.map(sellerLot =>
                        sellerLot.lotId === lot.lotId
                          ? { ...sellerLot, soldDate: updated[idx].entryDate }
                          : sellerLot
                      )
                    };
                  }
                }

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
                    const oldPurchaseDetails = participants[idx].purchaseDetails;

                    // Clear buyer's selection
                    updated[idx] = {
                      ...updated[idx],
                      purchaseDetails: undefined,
                      surface: 0
                    };

                    // Clear seller's soldDate if this was a portage lot
                    if (oldPurchaseDetails?.buyingFrom && oldPurchaseDetails?.lotId) {
                      const sellerIdx = updated.findIndex(p => p.name === oldPurchaseDetails.buyingFrom);
                      if (sellerIdx !== -1 && updated[sellerIdx].lotsOwned) {
                        updated[sellerIdx] = {
                          ...updated[sellerIdx],
                          lotsOwned: updated[sellerIdx].lotsOwned?.map(lot =>
                            lot.lotId === oldPurchaseDetails.lotId
                              ? { ...lot, soldDate: undefined }
                              : lot
                          )
                        };
                      }
                    }

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
            <label className="block text-xs text-gray-600 mb-1">Droit d'enregistrements</label>
            <div className="flex items-center gap-2 mb-1">
              <label className={`flex items-center gap-1.5 px-3 py-2 border rounded-lg transition-colors ${canEditNotaryRate ? 'cursor-pointer hover:bg-gray-100' : 'opacity-60 cursor-not-allowed'}`} style={{
                borderColor: p.registrationFeesRate === 3 ? '#9ca3af' : '#e5e7eb',
                backgroundColor: p.registrationFeesRate === 3 ? '#f3f4f6' : (canEditNotaryRate ? 'white' : '#f9fafb')
              }}>
                <input
                  type="radio"
                  name={`notaryRate-${idx}`}
                  value="3"
                  checked={p.registrationFeesRate === 3}
                  onChange={(e) => updateNotaryRate(idx, parseFloat(e.target.value))}
                  disabled={!canEditNotaryRate}
                  className="w-4 h-4"
                />
                <span className="font-medium text-gray-700 text-sm">3%</span>
              </label>
              <label className={`flex items-center gap-1.5 px-3 py-2 border rounded-lg transition-colors ${canEditNotaryRate ? 'cursor-pointer hover:bg-gray-100' : 'opacity-60 cursor-not-allowed'}`} style={{
                borderColor: p.registrationFeesRate === 12.5 ? '#9ca3af' : '#e5e7eb',
                backgroundColor: p.registrationFeesRate === 12.5 ? '#f3f4f6' : (canEditNotaryRate ? 'white' : '#f9fafb')
              }}>
                <input
                  type="radio"
                  name={`notaryRate-${idx}`}
                  value="12.5"
                  checked={p.registrationFeesRate === 12.5}
                  onChange={(e) => updateNotaryRate(idx, parseFloat(e.target.value))}
                  disabled={!canEditNotaryRate}
                  className="w-4 h-4"
                />
                <span className="font-medium text-gray-700 text-sm">12.5%</span>
              </label>
            </div>
            <div className="text-sm text-gray-600">
              = {formatCurrency(p.droitEnregistrements)}
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-600 mb-1">Taux d'intérêt (%)</label>
            <input
              type="number"
              step="0.1"
              value={p.interestRate}
              onChange={(e) => updateInterestRate(idx, parseFloat(e.target.value) || 0)}
              disabled={!canEditInterestRate}
              className={`w-full px-3 py-2 font-medium border border-gray-300 rounded-lg focus:border-gray-500 focus:ring-1 focus:ring-gray-500 focus:outline-none ${canEditInterestRate ? 'bg-white' : 'bg-gray-50 opacity-60 cursor-not-allowed'}`}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Durée (années)</label>
            <input
              type="number"
              value={p.durationYears}
              onChange={(e) => updateDuration(idx, parseInt(e.target.value) || 0)}
              disabled={!canEditDuration}
              className={`w-full px-3 py-2 font-medium border border-gray-300 rounded-lg focus:border-gray-500 focus:ring-1 focus:ring-gray-500 focus:outline-none ${canEditDuration ? 'bg-white' : 'bg-gray-50 opacity-60 cursor-not-allowed'}`}
            />
          </div>
        </div>

        {/* Portage Lot Configuration (only for founders) - moved outside grid for better flow */}
        {participants[idx].isFounder && (
          <div className="mt-4 pt-4 border-t border-gray-300">
            <PortageLotConfig
              portageLots={participants[idx].lotsOwned?.filter((lot: any) => lot.isPortage) || []}
              onAddLot={() => addPortageLot(idx)}
              onRemoveLot={(lotId) => removePortageLot(idx, lotId)}
              onUpdateSurface={(lotId, surface) => updatePortageLotSurface(idx, lotId, surface)}
              onUpdateConstructionPayment={updatePortageLotConstructionPayment ? (lotId, founderPaysCasco, founderPaysParachèvement) =>
                updatePortageLotConstructionPayment(idx, lotId, founderPaysCasco, founderPaysParachèvement) : undefined}
              deedDate={new Date(deedDate)}
              formulaParams={formulaParams}
            />
          </div>
        )}
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
            <p className="text-xs text-gray-500 mb-1">Droit d'enreg.</p>
            <p className="text-base font-bold text-gray-900">
              <FormulaTooltip formula={getNotaryFeesFormula(p)}>
                {formatCurrency(p.droitEnregistrements)}
              </FormulaTooltip>
            </p>
            <p className="text-xs text-gray-400 mt-0.5">{p.registrationFeesRate}%</p>
          </div>

          <div className="bg-white rounded-lg p-3 border border-gray-200">
            <p className="text-xs text-gray-500 mb-1">Frais notaire</p>
            <p className="text-base font-bold text-gray-900">
              <FormulaTooltip formula={getFraisNotaireFixeFormula(p)}>
                {formatCurrency(p.fraisNotaireFixe)}
              </FormulaTooltip>
            </p>
            <p className="text-xs text-gray-400 mt-0.5">{p.quantity} lot{p.quantity > 1 ? 's' : ''}</p>
          </div>

          <div className="bg-white rounded-lg p-3 border border-orange-200">
            <p className="text-xs text-gray-500 mb-1">CASCO</p>
            <p className="text-base font-bold text-orange-700">
              <FormulaTooltip formula={getCascoFormula(p, participants[idx].cascoSqm, projectParams.globalCascoPerM2, projectParams.cascoTvaRate)}>
                {formatCurrency(p.casco)}
              </FormulaTooltip>
            </p>
            <p className="text-xs text-orange-500 mt-0.5">
              {participants[idx].cascoSqm || p.surface}m²
              {portageLotInfo?.founderPaysCasco && p.casco === 0 && (
                <span className="ml-1 text-blue-600 font-medium">(payé par porteur)</span>
              )}
            </p>
          </div>

          <div className="bg-white rounded-lg p-3 border border-orange-200">
            <p className="text-xs text-gray-500 mb-1">Parachèvements</p>
            <p className="text-base font-bold text-orange-700">
              <FormulaTooltip formula={getParachevementsFormula(p, participants[idx].parachevementsSqm, participants[idx].parachevementsPerM2)}>
                {formatCurrency(p.parachevements)}
              </FormulaTooltip>
            </p>
            <p className="text-xs text-orange-500 mt-0.5">
              {participants[idx].parachevementsSqm || p.surface}m²
              {portageLotInfo?.founderPaysParachèvement && p.parachevements === 0 && (
                <span className="ml-1 text-blue-600 font-medium">(payé par porteur)</span>
              )}
            </p>
          </div>

          <div className="bg-white rounded-lg p-3 border border-purple-200">
            <p className="text-xs text-gray-500 mb-1">Travaux communs</p>
            <p className="text-base font-bold text-purple-700">
              <FormulaTooltip formula={getTravauxCommunsFormula(p)}>
                {formatCurrency(p.travauxCommunsPerUnit)}
              </FormulaTooltip>
            </p>
            <p className="text-xs text-purple-500 mt-0.5">Commun fixe (÷{participants.length})</p>
          </div>

          <div className="bg-white rounded-lg p-3 border border-purple-200">
            <p className="text-xs text-gray-500 mb-1">Commun</p>
            <p className="text-base font-bold text-purple-700">
              <FormulaTooltip formula={getSharedCostsFormula(p, participants.length)}>
                {formatCurrency(p.sharedCosts)}
              </FormulaTooltip>
            </p>
          </div>
        </div>
      </div>

      {/* Construction Detail */}
      <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-3">Détail Construction</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
          {/* CASCO - Display only (not editable) */}
          <div className="bg-white p-3 rounded-lg border border-gray-200">
            <p className="text-xs text-gray-500 mb-1">
              CASCO (gros œuvre)
              {portageLotInfo?.founderPaysCasco && p.casco === 0 && (
                <span className="ml-2 text-blue-600 font-medium">(payé par porteur)</span>
              )}
            </p>
            <p className="text-lg font-bold text-gray-900">
              <FormulaTooltip formula={getCascoFormula(p, participants[idx].cascoSqm, projectParams.globalCascoPerM2, projectParams.cascoTvaRate)}>
                {formatCurrency(p.casco)}
              </FormulaTooltip>
            </p>
            <p className="text-xs text-gray-400">
              {participants[idx].cascoSqm || p.surface}m² × {projectParams.globalCascoPerM2}€/m² (global){projectParams.cascoTvaRate ? ` + TVA ${projectParams.cascoTvaRate}%` : ''}
            </p>
          </div>

          {/* Parachèvements - Editable */}
          <div className="bg-white p-3 rounded-lg border border-gray-200">
            <label className="block text-xs text-gray-500 mb-1">
              Parachèvements - Prix/m²
              {portageLotInfo?.founderPaysParachèvement && p.parachevements === 0 && (
                <span className="ml-2 text-blue-600 font-medium">(payé par porteur)</span>
              )}
            </label>
            <input
              type="number"
              step="10"
              value={participants[idx].parachevementsPerM2}
              onChange={(e) => updateParachevementsPerM2(idx, parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 text-sm font-semibold border border-gray-300 rounded-lg focus:border-gray-500 focus:ring-1 focus:ring-gray-500 focus:outline-none mb-2"
            />
            <p className="text-xs text-gray-500">Total: <span className="font-bold text-gray-900">
              <FormulaTooltip formula={getParachevementsFormula(p, participants[idx].parachevementsSqm, participants[idx].parachevementsPerM2)}>
                {formatCurrency(p.parachevements)}
              </FormulaTooltip>
            </span></p>
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
        <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-3">Emprunt Nécessaire</p>

        {/* Math Operation: Total Cost - Capital = Loan */}
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="bg-white rounded-lg p-3 border border-gray-200 flex-1">
            <p className="text-xs text-gray-500 mb-1">Coût Total hors intérêts</p>
            <p className="text-lg font-bold text-gray-900">
              <FormulaTooltip formula={getTotalCostFormula(p)}>
                {formatCurrency(p.totalCost)}
              </FormulaTooltip>
            </p>
          </div>

          <div className="text-2xl font-bold text-gray-400 flex-shrink-0">−</div>

          <div className="bg-green-50 rounded-lg p-3 border border-green-300 flex-1">
            <p className="text-xs text-gray-600 mb-1">Capital apporté</p>
            <p className="text-lg font-bold text-green-700">{formatCurrency(p.capitalApporte)}</p>
          </div>

          <div className="text-2xl font-bold text-gray-400 flex-shrink-0">=</div>

          <div className="bg-red-100 rounded-lg p-3 border border-red-300 flex-1">
            <p className="text-xs text-gray-600 mb-1">À emprunter</p>
            <p className="text-lg font-bold text-red-700">
              <FormulaTooltip formula={getLoanNeededFormula(p)}>
                {formatCurrency(p.loanNeeded)}
              </FormulaTooltip>
            </p>
            <p className="text-xs text-gray-500 mt-0.5">{p.financingRatio.toFixed(1)}%</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3 border-t border-red-200">
          <div className="bg-white rounded-lg p-2 border border-red-200">
            <p className="text-xs text-gray-500 mb-1">Intérêts</p>
            <p className="text-base font-bold text-red-700">
              <FormulaTooltip formula={getTotalInterestFormula(p)}>
                {formatCurrency(p.totalInterest)}
              </FormulaTooltip>
            </p>
          </div>

          <div className="bg-white rounded-lg p-2 border border-gray-200">
            <p className="text-xs text-gray-500 mb-1">À rembourser sur {p.durationYears} ans</p>
            <p className="text-base font-bold text-gray-900">
              <FormulaTooltip formula={getTotalRepaymentFormula(p)}>
                {formatCurrency(p.totalRepayment)}
              </FormulaTooltip>
            </p>
          </div>

          <div className="bg-white rounded-lg p-2 border border-gray-200">
            <p className="text-xs text-gray-500 mb-1">
              {p.useTwoLoans && p.loan1MonthlyPayment && p.loan2MonthlyPayment ? 'Mensualité combi' : 'Mensualité'}
            </p>
            <p className="text-base font-bold text-red-600">
              <FormulaTooltip formula={getMonthlyPaymentFormula(p)}>
                {formatCurrency(
                  p.useTwoLoans && p.loan1MonthlyPayment && p.loan2MonthlyPayment
                    ? p.loan1MonthlyPayment + p.loan2MonthlyPayment
                    : p.monthlyPayment
                )}
              </FormulaTooltip>
            </p>
            <p className="text-xs text-gray-400 mt-0.5">{p.durationYears} ans @ {p.interestRate}%</p>
          </div>
        </div>
      </div>

      {/* Expected Paybacks - Show portage paybacks AND copropriété redistributions */}
      <ExpectedPaybacksCard
        participant={participants[idx]}
        allParticipants={participants}
        deedDate={deedDate}
        coproReservesShare={formulaParams.coproReservesShare}
        className="mt-4"
      />
    </div>
  );
}
