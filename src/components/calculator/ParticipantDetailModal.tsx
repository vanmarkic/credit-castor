import { useMemo } from 'react';
import { X, Star } from 'lucide-react';
import { formatCurrency } from '../../utils/formatting';
import AvailableLotsView from '../AvailableLotsView';
import PortageLotConfig from '../PortageLotConfig';
import { ExpectedPaybacksCard } from '../shared/ExpectedPaybacksCard';
import { TwoLoanFinancingSection } from '../shared/TwoLoanFinancingSection';
import { ConstructionDetailSection } from '../shared/ConstructionDetailSection';
import { CostBreakdownGrid } from '../shared/CostBreakdownGrid';
import { FinancingResultCard } from '../shared/FinancingResultCard';
import { getAvailableLotsForNewcomer, type AvailableLot } from '../../utils/availableLots';
import type { PortageLotPrice } from '../../utils/portageCalculations';
import type { Participant, ParticipantCalculation, CalculationResults, ProjectParams, PortageFormulaParams, UnitDetails } from '../../utils/calculatorUtils';
import { validateTwoLoanFinancing } from '../../utils/twoLoanValidation';

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
  unitDetails: UnitDetails;
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
  onUpdatePortageLotConstructionPayment?: (lotId: number, founderPaysCasco: boolean, founderPaysParachèvement: boolean) => void;
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
  unitDetails,
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
  onUpdatePortageLotConstructionPayment,
  onRemove,
  totalParticipants,
}: ParticipantDetailModalProps) {
  const idx = participantIndex;

  const validationErrors = useMemo(() => {
    if (!participant.useTwoLoans) {
      return {};
    }
    return validateTwoLoanFinancing(participant, p.personalRenovationCost || 0);
  }, [participant, p.personalRenovationCost]);

  if (!isOpen) return null;

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
                <p className="text-xs text-gray-500 mb-1">
                  {p.useTwoLoans && p.loan1MonthlyPayment && p.loan2MonthlyPayment ? 'Mensualité combi' : 'Mensualité'}
                </p>
                <p className="text-xl font-bold text-red-600">
                  {formatCurrency(
                    p.useTwoLoans && p.loan1MonthlyPayment && p.loan2MonthlyPayment
                      ? p.loan1MonthlyPayment + p.loan2MonthlyPayment
                      : p.monthlyPayment
                  )}
                </p>
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
              <label className="block text-xs text-gray-600 mb-1">Frais d'enregistrement</label>
              <div className="flex items-center gap-2 mb-1">
                <label className="flex items-center gap-1.5 cursor-pointer px-3 py-2 border rounded-lg transition-colors hover:bg-gray-100" style={{
                  borderColor: p.registrationFeesRate === 3 ? '#9ca3af' : '#e5e7eb',
                  backgroundColor: p.registrationFeesRate === 3 ? '#f3f4f6' : 'white'
                }}>
                  <input
                    type="radio"
                    name={`notaryRate-fullscreen-${idx}`}
                    value="3"
                    checked={p.registrationFeesRate === 3}
                    onChange={(e) => onUpdateNotaryRate(parseFloat(e.target.value))}
                    className="w-4 h-4"
                  />
                  <span className="font-medium text-gray-700 text-sm">3%</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer px-3 py-2 border rounded-lg transition-colors hover:bg-gray-100" style={{
                  borderColor: p.registrationFeesRate === 12.5 ? '#9ca3af' : '#e5e7eb',
                  backgroundColor: p.registrationFeesRate === 12.5 ? '#f3f4f6' : 'white'
                }}>
                  <input
                    type="radio"
                    name={`notaryRate-fullscreen-${idx}`}
                    value="12.5"
                    checked={p.registrationFeesRate === 12.5}
                    onChange={(e) => onUpdateNotaryRate(parseFloat(e.target.value))}
                    className="w-4 h-4"
                  />
                  <span className="font-medium text-gray-700 text-sm">12.5%</span>
                </label>
              </div>
              <div className="text-sm text-gray-600">
                = {formatCurrency(p.droitEnregistrements)}
              </div>
            </div>

            {participant.isFounder && (
              <PortageLotConfig
                portageLots={participant.lotsOwned?.filter((lot) => lot.isPortage) || []}
                onAddLot={onAddPortageLot}
                onRemoveLot={onRemovePortageLot}
                onUpdateSurface={onUpdatePortageLotSurface}
                onUpdateConstructionPayment={onUpdatePortageLotConstructionPayment}
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
          <TwoLoanFinancingSection
            participant={participant}
            personalRenovationCost={p.personalRenovationCost || 0}
            validationErrors={validationErrors}
            onUpdateParticipant={onUpdateParticipant}
          />
        </div>

        {/* Cost Breakdown */}
        <CostBreakdownGrid
          participant={participant}
          participantCalc={p}
          projectParams={projectParams}
          allParticipants={allParticipants}
          unitDetails={unitDetails}
        />

        {/* Construction Detail */}
        <ConstructionDetailSection
          participant={participant}
          participantCalc={p}
          projectParams={projectParams}
          onUpdateParachevementsPerM2={onUpdateParachevementsPerM2}
          onUpdateCascoSqm={onUpdateCascoSqm}
          onUpdateParachevementsSqm={onUpdateParachevementsSqm}
        />

        {/* Financing Result */}
        <FinancingResultCard participantCalc={p} />

        {/* Expected Paybacks */}
        <ExpectedPaybacksCard
          participant={participant}
          allParticipants={allParticipants}
          deedDate={deedDate}
          coproReservesShare={formulaParams.coproReservesShare}
        />

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
                value={(() => {
                  if (!participant.entryDate) return deedDate;
                  const date = new Date(participant.entryDate);
                  return isNaN(date.getTime()) ? deedDate : date.toISOString().split('T')[0];
                })()}
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
