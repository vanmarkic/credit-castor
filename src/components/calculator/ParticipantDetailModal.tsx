import { X, Star } from 'lucide-react';
import { formatCurrency } from '../../utils/formatting';
import AvailableLotsView from '../AvailableLotsView';
import PortageLotConfig from '../PortageLotConfig';
import { getAvailableLotsForNewcomer, type AvailableLot } from '../../utils/availableLots';
import type { PortageLotPrice } from '../../utils/portageCalculations';
import type { Participant, ParticipantCalculation, CalculationResults, ProjectParams, PortageFormulaParams } from '../../utils/calculatorUtils';

interface ParticipantDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  participantIndex: number;
  participant: Participant;
  participantBreakdown: ParticipantCalculation;
  deedDate: string;
  allParticipants: Participant[];
  calculations: CalculationResults;
  projectParams: ProjectParams;
  formulaParams: PortageFormulaParams;
  isPinned: boolean;
  onPin: () => void;
  onUnpin: () => void;
  onUpdateName: (name: string) => void;
  onUpdateSurface: (surface: number) => void;
  onUpdateCapital: (value: number) => void;
  onUpdateNotaryRate: (rate: number) => void;
  onUpdateInterestRate: (rate: number) => void;
  onUpdateDuration: (years: number) => void;
  onUpdateQuantity: (qty: number) => void;
  onUpdateParachevementsPerM2: (value: number) => void;
  onUpdateCascoSqm: (value: number | undefined) => void;
  onUpdateParachevementsSqm: (value: number | undefined) => void;
  onUpdateParticipant: (updated: Participant) => void;
  onAddPortageLot: () => void;
  onRemovePortageLot: (lotId: number) => void;
  onUpdatePortageLotSurface: (lotId: number, surface: number) => void;
  onRemove?: () => void;
  totalParticipants: number;
}

export default function ParticipantDetailModal({
  isOpen,
  onClose,
  participantIndex,
  participant,
  participantBreakdown: p,
  deedDate,
  allParticipants,
  calculations,
  projectParams,
  formulaParams,
  isPinned,
  onPin,
  onUnpin,
  onUpdateName,
  onUpdateSurface,
  onUpdateCapital,
  onUpdateNotaryRate,
  onUpdateInterestRate,
  onUpdateDuration,
  onUpdateQuantity,
  onUpdateParachevementsPerM2,
  onUpdateCascoSqm,
  onUpdateParachevementsSqm,
  onUpdateParticipant,
  onAddPortageLot,
  onRemovePortageLot,
  onUpdatePortageLotSurface,
  onRemove,
  totalParticipants,
}: ParticipantDetailModalProps) {
  if (!isOpen) return null;

  const idx = participantIndex;

  return (
    <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-gray-200 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            {/* Left Column: Name and Info (2 rows) */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={p.name}
                  onChange={(e) => onUpdateName(e.target.value)}
                  className="text-2xl font-bold text-gray-900 bg-transparent border-b-2 border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none px-1 py-1"
                  placeholder="Nom du·de la participant·e"
                />
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <span className="text-gray-400">Unité</span>
                  <span className="font-medium text-blue-600">{p.unitId}</span>
                </span>
                <span className="text-gray-300">•</span>
                <span>{p.surface}m²</span>
                <span className="text-gray-300">•</span>
                <span>{p.quantity || 1} {(p.quantity || 1) > 1 ? 'unités' : 'unité'}</span>
                {participant.entryDate && (
                  <>
                    <span className="text-gray-300">•</span>
                    <span className={`font-medium ${participant.isFounder ? 'text-green-600' : 'text-blue-600'}`}>
                      Entrée: {new Date(participant.entryDate).toLocaleDateString('fr-BE')}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Right Column: Key Financial Metrics */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <p className="text-xs text-gray-500 mb-1">Coût Total</p>
                <p className="text-xl font-bold text-gray-900">{formatCurrency(p.totalCost)}</p>
              </div>
              <div className="bg-red-50 rounded-lg p-3 border border-red-300">
                <p className="text-xs text-gray-600 mb-1">À emprunter</p>
                <p className="text-xl font-bold text-red-700">{formatCurrency(p.loanNeeded)}</p>
              </div>
              <div className="bg-white rounded-lg p-3 border border-gray-200">
                <p className="text-xs text-gray-500 mb-1">Mensualité</p>
                <p className="text-xl font-bold text-red-600">{formatCurrency(p.monthlyPayment)}</p>
              </div>
            </div>
          </div>

          {/* Close button - repositioned to top right */}
          <button
            onClick={onClose}
            className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-8 h-8" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto p-6">
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (isPinned) {
              onUnpin();
            } else {
              onPin();
            }
          }}
          className="absolute top-6 right-16 text-gray-400 hover:text-yellow-500 transition-colors"
          title={isPinned ? "Désépingler" : "Épingler en haut"}
        >
          <Star
            className="w-6 h-6"
            fill={isPinned ? "currentColor" : "none"}
            style={{ color: isPinned ? "#eab308" : undefined }}
          />
        </button>

        {/* Purchase Details (only for non-founders) */}
        {!participant.isFounder && (
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-3">💰 Sélection du Lot</p>

            <div className="mb-4">
              <AvailableLotsView
                availableLots={getAvailableLotsForNewcomer(
                  allParticipants,
                  [
                    { lotId: 999, surface: 300, acquiredDate: new Date(deedDate), soldDate: undefined }
                  ],
                  calculations
                )}
                deedDate={new Date(deedDate)}
                formulaParams={formulaParams}
                buyerEntryDate={participant.entryDate ? new Date(participant.entryDate) : undefined}
                onSelectLot={(lot: AvailableLot, price: PortageLotPrice) => {
                  onUpdateParticipant({
                    ...participant,
                    surface: lot.surface,
                    capitalApporte: Math.min(participant.capitalApporte || 0, price.totalPrice),
                    purchaseDetails: {
                      buyingFrom: lot.fromParticipant || 'Copropriété',
                      lotId: lot.lotId,
                      purchasePrice: price.totalPrice
                    }
                  });
                }}
              />
            </div>

            {participant.purchaseDetails?.lotId && (
              <div className="bg-green-50 border border-green-300 rounded-lg p-3 mt-3">
                <div className="flex items-start justify-between mb-2">
                  <p className="text-xs font-semibold text-green-800">✅ Lot sélectionné:</p>
                  <button
                    onClick={() => {
                      onUpdateParticipant({
                        ...participant,
                        purchaseDetails: undefined,
                        surface: 0
                      });
                    }}
                    className="text-xs text-red-600 hover:text-red-800 font-semibold hover:underline"
                  >
                    ✕ Changer de lot
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <span className="text-gray-600">Lot:</span>
                    <span className="font-semibold ml-1">#{participant.purchaseDetails.lotId}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">De:</span>
                    <span className="font-semibold ml-1">{participant.purchaseDetails.buyingFrom}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Prix:</span>
                    <span className="font-semibold ml-1">€{participant.purchaseDetails.purchasePrice?.toLocaleString('fr-BE', { maximumFractionDigits: 0 })}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Configuration Section */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-3">Configuration</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-600 mb-1">
                Surface totale (m²)
                {!participant.isFounder && participant.purchaseDetails?.buyingFrom &&
                 participant.purchaseDetails?.buyingFrom !== 'Copropriété' && (
                  <span className="ml-2 text-orange-600 font-semibold">🔒 Imposée par portage</span>
                )}
              </label>
              <input
                type="number"
                step="1"
                value={p.surface}
                onChange={(e) => onUpdateSurface(parseFloat(e.target.value) || 0)}
                disabled={!participant.isFounder && !!participant.purchaseDetails?.buyingFrom &&
                          participant.purchaseDetails?.buyingFrom !== 'Copropriété'}
                className={`w-full px-3 py-2 font-medium border rounded-lg focus:outline-none ${
                  !participant.isFounder && !!participant.purchaseDetails?.buyingFrom &&
                  participant.purchaseDetails?.buyingFrom !== 'Copropriété'
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
                onChange={(e) => onUpdateQuantity(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 font-medium border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Capital apporté</label>
              <input
                type="number"
                step="10000"
                value={p.capitalApporte}
                onChange={(e) => onUpdateCapital(parseFloat(e.target.value) || 0)}
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
                    name={`notaryRate-fullscreen-${idx}`}
                    value="3"
                    checked={p.notaryFeesRate === 3}
                    onChange={(e) => onUpdateNotaryRate(parseFloat(e.target.value))}
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
                    name={`notaryRate-fullscreen-${idx}`}
                    value="12.5"
                    checked={p.notaryFeesRate === 12.5}
                    onChange={(e) => onUpdateNotaryRate(parseFloat(e.target.value))}
                    className="w-4 h-4"
                  />
                  <span className="font-medium text-gray-700 text-sm">12.5%</span>
                </label>
              </div>
              <div className="text-sm text-gray-600">
                = {formatCurrency(p.notaryFees)}
              </div>
            </div>

            {participant.isFounder && (
              <PortageLotConfig
                portageLots={participant.lotsOwned?.filter((lot) => lot.isPortage) || []}
                onAddLot={onAddPortageLot}
                onRemoveLot={onRemovePortageLot}
                onUpdateSurface={onUpdatePortageLotSurface}
                deedDate={new Date(deedDate)}
                formulaParams={formulaParams}
              />
            )}

            <div>
              <label className="block text-xs text-gray-600 mb-1">Taux d'intérêt (%)</label>
              <input
                type="number"
                step="0.1"
                value={p.interestRate}
                onChange={(e) => onUpdateInterestRate(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 font-medium border border-gray-300 rounded-lg focus:border-gray-500 focus:ring-1 focus:ring-gray-500 focus:outline-none bg-white"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Durée (années)</label>
              <input
                type="number"
                value={p.durationYears}
                onChange={(e) => onUpdateDuration(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 font-medium border border-gray-300 rounded-lg focus:border-gray-500 focus:ring-1 focus:ring-gray-500 focus:outline-none bg-white"
              />
            </div>
          </div>

          {/* Two-Loan Financing Section */}
          <div className="border-t pt-4 mt-4">
            <label className="flex items-center gap-2 mb-4 cursor-pointer">
              <input
                type="checkbox"
                checked={participant.useTwoLoans || false}
                onChange={(e) => {
                  onUpdateParticipant({ ...participant, useTwoLoans: e.target.checked });
                }}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <span className="font-semibold text-sm">Financement en deux prêts</span>
            </label>

            {participant.useTwoLoans && (
              <div className="ml-6 space-y-3 bg-blue-50 p-4 rounded border border-blue-200">
                {/* Loan 2 delay */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Prêt 2 commence après (années)
                  </label>
                  <input
                    type="number"
                    value={participant.loan2DelayYears ?? 2}
                    onChange={(e) => {
                      onUpdateParticipant({ ...participant, loan2DelayYears: parseFloat(e.target.value) || 2 });
                    }}
                    className="w-full px-3 py-2 border rounded"
                    min="1"
                    step="0.5"
                  />
                </div>

                {/* Renovation amount in loan 2 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Montant rénovation dans prêt 2 (€)
                  </label>
                  <input
                    type="number"
                    value={participant.loan2RenovationAmount || 0}
                    onChange={(e) => {
                      onUpdateParticipant({ ...participant, loan2RenovationAmount: parseFloat(e.target.value) || 0 });
                    }}
                    className="w-full px-3 py-2 border rounded"
                    min="0"
                    step="1000"
                  />
                  <p className="text-xs text-gray-600 mt-1">
                    Rénovation totale: €{p.personalRenovationCost?.toLocaleString() || '0'}
                  </p>
                </div>

                {/* Capital allocation */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Capital pour prêt 1 (€)
                    </label>
                    <input
                      type="number"
                      value={participant.capitalForLoan1 || 0}
                      onChange={(e) => {
                        onUpdateParticipant({ ...participant, capitalForLoan1: parseFloat(e.target.value) || 0 });
                      }}
                      className="w-full px-3 py-2 border rounded"
                      min="0"
                      step="1000"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Capital pour prêt 2 (€)
                    </label>
                    <input
                      type="number"
                      value={participant.capitalForLoan2 || 0}
                      onChange={(e) => {
                        onUpdateParticipant({ ...participant, capitalForLoan2: parseFloat(e.target.value) || 0 });
                      }}
                      className="w-full px-3 py-2 border rounded"
                      min="0"
                      step="1000"
                    />
                  </div>
                </div>

                <p className="text-xs text-gray-600">
                  Capital disponible: €{participant.capitalApporte?.toLocaleString() || '0'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Cost Breakdown */}
        <div className="mb-6">
          <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-2">Décomposition des Coûts</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div className="bg-white rounded-lg p-3 border border-gray-200">
              <p className="text-xs text-gray-500 mb-1">Part d'achat</p>
              <p className="text-lg font-bold text-gray-900">{formatCurrency(p.purchaseShare)}</p>
              <p className="text-xs text-blue-600 mt-0.5">{p.surface}m²</p>
            </div>
            <div className="bg-white rounded-lg p-3 border border-gray-200">
              <p className="text-xs text-gray-500 mb-1">Frais notaire</p>
              <p className="text-lg font-bold text-gray-900">{formatCurrency(p.notaryFees)}</p>
              <p className="text-xs text-gray-400 mt-0.5">{p.notaryFeesRate}%</p>
            </div>
            <div className="bg-white rounded-lg p-3 border border-orange-200">
              <p className="text-xs text-gray-500 mb-1">CASCO</p>
              <p className="text-lg font-bold text-orange-700">{formatCurrency(p.casco)}</p>
              <p className="text-xs text-orange-500 mt-0.5">{participant.cascoSqm || p.surface}m²</p>
            </div>
            <div className="bg-white rounded-lg p-3 border border-orange-200">
              <p className="text-xs text-gray-500 mb-1">Parachèvements</p>
              <p className="text-lg font-bold text-orange-700">{formatCurrency(p.parachevements)}</p>
              <p className="text-xs text-orange-500 mt-0.5">{participant.parachevementsSqm || p.surface}m²</p>
            </div>
            <div className="bg-white rounded-lg p-3 border border-purple-200">
              <p className="text-xs text-gray-500 mb-1">Travaux communs</p>
              <p className="text-lg font-bold text-purple-700">{formatCurrency(p.travauxCommunsPerUnit)}</p>
              <p className="text-xs text-purple-500 mt-0.5">Commun fixe (÷{allParticipants.length})</p>
            </div>
            <div className="bg-white rounded-lg p-3 border border-purple-200">
              <p className="text-xs text-gray-500 mb-1">Commun</p>
              <p className="text-lg font-bold text-purple-700">{formatCurrency(p.sharedCosts)}</p>
            </div>
          </div>
        </div>

        {/* Construction Detail */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-3">Détail Construction</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
            <div className="bg-white p-3 rounded-lg border border-gray-200">
              <p className="text-xs text-gray-500 mb-1">CASCO (gros œuvre)</p>
              <p className="text-lg font-bold text-gray-900">{formatCurrency(p.casco)}</p>
              <p className="text-xs text-gray-400">
                {participant.cascoSqm || p.surface}m² × {projectParams.globalCascoPerM2}€/m² (global)
              </p>
            </div>
            <div className="bg-white p-3 rounded-lg border border-gray-200">
              <label className="block text-xs text-gray-500 mb-1">Parachèvements - Prix/m²</label>
              <input
                type="number"
                step="10"
                value={participant.parachevementsPerM2}
                onChange={(e) => onUpdateParachevementsPerM2(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 text-sm font-semibold border border-gray-300 rounded-lg focus:border-gray-500 focus:ring-1 focus:ring-gray-500 focus:outline-none mb-2"
              />
              <p className="text-xs text-gray-500">Total: <span className="font-bold text-gray-900">{formatCurrency(p.parachevements)}</span></p>
              <p className="text-xs text-gray-400">{participant.parachevementsSqm || p.surface}m² × {participant.parachevementsPerM2}€/m²</p>
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
                value={participant.cascoSqm || p.surface}
                onChange={(e) => onUpdateCascoSqm(parseFloat(e.target.value) || undefined)}
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
                value={participant.parachevementsSqm || p.surface}
                onChange={(e) => onUpdateParachevementsSqm(parseFloat(e.target.value) || undefined)}
                className="w-full px-3 py-2 text-sm font-semibold border border-blue-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                placeholder={`${p.surface}m² (total)`}
              />
              <p className="text-xs text-blue-600 mt-1">Surface totale: {p.surface}m²</p>
            </div>
          </div>
        </div>

        {/* Financing Result */}
        <div className="bg-red-50 rounded-lg p-5 border border-red-200 mb-6">
          <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-3">Emprunt Nécessaire</p>

          {/* Math Operation: Total Cost - Capital = Loan */}
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="bg-white rounded-lg p-3 border border-gray-200 flex-1">
              <p className="text-xs text-gray-500 mb-1">Coût Total hors intérêts</p>
              <p className="text-lg font-bold text-gray-900">{formatCurrency(p.totalCost)}</p>
            </div>

            <div className="text-2xl font-bold text-gray-400 flex-shrink-0">−</div>

            <div className="bg-green-50 rounded-lg p-3 border border-green-300 flex-1">
              <p className="text-xs text-gray-600 mb-1">Capital apporté</p>
              <p className="text-lg font-bold text-green-700">{formatCurrency(p.capitalApporte)}</p>
            </div>

            <div className="text-2xl font-bold text-gray-400 flex-shrink-0">=</div>

            <div className="bg-red-100 rounded-lg p-3 border border-red-300 flex-1">
              <p className="text-xs text-gray-600 mb-1">À emprunter</p>
              <p className="text-lg font-bold text-red-700">{formatCurrency(p.loanNeeded)}</p>
              <p className="text-xs text-gray-500 mt-0.5">{p.financingRatio.toFixed(1)}%</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3 border-t border-red-200">
            <div className="bg-white rounded-lg p-2 border border-red-200">
              <p className="text-xs text-gray-500 mb-1">Intérêts</p>
              <p className="text-base font-bold text-red-700">{formatCurrency(p.totalInterest)}</p>
            </div>
            <div className="bg-white rounded-lg p-2 border border-gray-200">
              <p className="text-xs text-gray-500 mb-1">À rembourser sur {p.durationYears} ans</p>
              <p className="text-base font-bold text-gray-900">{formatCurrency(p.totalRepayment)}</p>
            </div>
            <div className="bg-white rounded-lg p-2 border border-gray-200">
              <p className="text-xs text-gray-500 mb-1">Mensualité</p>
              <p className="text-base font-bold text-red-600">{formatCurrency(p.monthlyPayment)}</p>
              <p className="text-xs text-gray-400 mt-0.5">{p.durationYears} ans @ {p.interestRate}%</p>
            </div>
          </div>
        </div>

        {/* Expected Paybacks */}
        {(() => {
          const portagePaybacks = allParticipants
            .filter((buyer: any) => buyer.purchaseDetails?.buyingFrom === participant.name)
            .map((buyer: any) => ({
              date: buyer.entryDate || new Date(deedDate),
              buyer: buyer.name,
              amount: buyer.purchaseDetails?.purchasePrice || 0,
              type: 'portage' as const,
              description: 'Achat de lot portage'
            }));

          const coproSales = allParticipants
            .filter((buyer: any) => buyer.purchaseDetails?.buyingFrom === 'Copropriété')
            .map((buyer: any) => ({
              buyer: buyer.name,
              entryDate: buyer.entryDate || new Date(deedDate),
              amount: buyer.purchaseDetails?.purchasePrice || 0
            }));

          const coproRedistributions = coproSales.map((sale: any) => {
            const saleDate = new Date(sale.entryDate);
            const participantEntryDate = participant.entryDate
              ? new Date(participant.entryDate)
              : new Date(deedDate);

            if (participantEntryDate >= saleDate) {
              return null;
            }

            const monthsInProject = (saleDate.getTime() - participantEntryDate.getTime()) / (1000 * 60 * 60 * 24 * 30.44);
            const eligibleParticipants = allParticipants.filter((p: any) => {
              const pEntryDate = p.entryDate ? new Date(p.entryDate) : new Date(deedDate);
              return pEntryDate < saleDate;
            });

            const totalMonths = eligibleParticipants.reduce((sum: number, p: any) => {
              const pEntryDate = p.entryDate ? new Date(p.entryDate) : new Date(deedDate);
              const pMonths = (saleDate.getTime() - pEntryDate.getTime()) / (1000 * 60 * 60 * 24 * 30.44);
              return sum + pMonths;
            }, 0);

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

          const allPaybacks = [...portagePaybacks, ...coproRedistributions]
            .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());

          if (allPaybacks.length > 0) {
            const totalRecovered = allPaybacks.reduce((sum: number, pb: any) => sum + pb.amount, 0);

            return (
              <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
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

        {/* Entry Date Section */}
        <div className="max-w-7xl mx-auto px-6 mt-8">
          <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
            <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-3">📅 Date d'entrée</p>

            <div className="mb-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={participant.isFounder || false}
                  onChange={(e) => {
                    const defaultNewcomerDate = new Date(deedDate);
                    defaultNewcomerDate.setFullYear(defaultNewcomerDate.getFullYear() + 1);

                    onUpdateParticipant({
                      ...participant,
                      isFounder: e.target.checked,
                      entryDate: e.target.checked
                        ? new Date(deedDate)
                        : (participant.entryDate || defaultNewcomerDate),
                      purchaseDetails: e.target.checked ? undefined : participant.purchaseDetails
                    });
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
                value={participant.entryDate
                  ? new Date(participant.entryDate).toISOString().split('T')[0]
                  : deedDate}
                onChange={(e) => {
                  const newDate = new Date(e.target.value);
                  if (newDate < new Date(deedDate)) {
                    alert(`La date d'entrée ne peut pas être avant la date de l'acte (${deedDate})`);
                    return;
                  }
                  onUpdateParticipant({
                    ...participant,
                    entryDate: newDate
                  });
                }}
                disabled={participant.isFounder}
                min={deedDate}
                className={`w-full px-4 py-2 border-2 rounded-lg focus:outline-none ${
                  participant.isFounder
                    ? 'bg-gray-100 border-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-white border-green-300 focus:border-green-500 focus:ring-2 focus:ring-green-500'
                }`}
              />
              <p className="text-xs text-gray-600 mt-1">
                {participant.isFounder
                  ? 'Les fondateur·rice·s entrent tous·tes à la date de l\'acte'
                  : 'Date à laquelle ce·tte participant·e rejoint le projet (doit être >= date de l\'acte)'}
              </p>
            </div>
          </div>
        </div>

        {/* Remove participant button (when there's more than 1 participant) */}
        {totalParticipants > 1 && onRemove && (
          <div className="max-w-7xl mx-auto px-6 pb-6">
            <button
              onClick={() => {
                if (confirm(`Êtes-vous sûr de vouloir retirer ${participant.name} ?`)) {
                  onRemove();
                  onClose();
                }
              }}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
            >
              Retirer ce·tte participant·e
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
