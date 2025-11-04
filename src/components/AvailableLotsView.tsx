/**
 * AvailableLotsView Component
 *
 * Displays available lots for newcomers to purchase
 * - Copropriété lots (free surface choice with price calculator)
 */

import { useState } from 'react';
import { isAfter } from 'date-fns';
import type { AvailableLot } from '../utils/availableLots';
import type { PortageLotPrice } from '../utils/portageCalculations';
import type { PortageFormulaParams } from '../utils/calculatorUtils';
import {
  calculateYearsHeld,
  calculateCoproEstimatedPrice,
  calculatePortageLotPrice,
  calculateCarryingCosts
} from '../utils/portageCalculations';

interface AvailableLotsViewProps {
  availableLots: AvailableLot[];
  deedDate: Date;
  formulaParams: PortageFormulaParams;
  onSelectLot?: (lot: AvailableLot, price: PortageLotPrice) => void;
  /**
   * Optional buyer entry date for calculating portage pricing.
   *
   * - In interactive mode (when onSelectLot is provided): REQUIRED. Must be after deed date.
   * - In display-only mode: Optional. Falls back to max(today, deedDate).
   *
   * This is critical for newcomer purchase scenarios where the portage price
   * should be calculated at the time of the transaction, not "as of today".
   */
  buyerEntryDate?: Date;
}

export default function AvailableLotsView({
  availableLots,
  deedDate,
  formulaParams,
  onSelectLot,
  buyerEntryDate
}: AvailableLotsViewProps) {
  const [coproSurfaces, setCoproSurfaces] = useState<Record<number, number>>({});

  const portageLots = availableLots.filter(lot => lot.source === 'FOUNDER');
  const coproLots = availableLots.filter(lot => lot.source === 'COPRO');

  // Determine sale date with proper validation
  // When in buyer mode (onSelectLot provided), require valid buyerEntryDate
  const isInteractiveMode = onSelectLot !== undefined;

  // Validate buyer entry date in interactive mode
  if (isInteractiveMode && !buyerEntryDate) {
    return (
      <div id="portage-marketplace" className="bg-red-50 border border-red-300 rounded-lg p-6">
        <p className="text-red-700 font-semibold">⚠️ Impossible de calculer le prix en portage</p>
        <p className="text-red-600 text-sm mt-2">
          Le participant doit avoir une date d'entrée valide pour acheter un lot en portage.
        </p>
      </div>
    );
  }

  // Validate that buyer entry date is after deed date (if provided)
  if (buyerEntryDate && !isAfter(buyerEntryDate, deedDate) && buyerEntryDate.getTime() !== deedDate.getTime()) {
    return (
      <div id="portage-marketplace" className="bg-red-50 border border-red-300 rounded-lg p-6">
        <p className="text-red-700 font-semibold">⚠️ Date d'entrée invalide</p>
        <p className="text-red-600 text-sm mt-2">
          La date d'entrée du participant ({buyerEntryDate.toLocaleDateString('fr-BE')})
          doit être égale ou postérieure à la date de l'acte ({deedDate.toLocaleDateString('fr-BE')}).
        </p>
      </div>
    );
  }

  // Years held: from founder entry (deed date) to buyer entry
  // In display-only mode, use today or deed date (whichever is later) as fallback
  const saleDate = buyerEntryDate || (isAfter(new Date(), deedDate) ? new Date() : deedDate);
  const yearsHeld = calculateYearsHeld(deedDate, saleDate);

  // Handle surface input for copro lots
  const handleCoproSurfaceChange = (lotId: number, surface: number) => {
    setCoproSurfaces(prev => ({
      ...prev,
      [lotId]: surface
    }));
  };

  if (availableLots.length === 0) {
    return (
      <div id="portage-marketplace" className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
        <p className="text-gray-600">Aucun lot disponible pour le moment</p>
      </div>
    );
  }

  return (
    <div id="portage-marketplace" className="space-y-6 scroll-mt-6">
      {/* Portage Lots (from Founders) */}
      {portageLots.length > 0 && (
        <div className="bg-orange-50 rounded-lg border-2 border-orange-200 p-6">
          <h3 className="text-lg font-semibold text-orange-700 mb-3 flex items-center gap-2">
            <span>🏠</span>
            Lots en Portage (Surface imposée)
          </h3>
          <div className="space-y-3">
            {portageLots.map(lot => {
              // Calculate portage price with indexation and carrying costs
              const baseAcquisitionCost = (lot.originalPrice || 0) + (lot.originalNotaryFees || 0) + (lot.originalConstructionCost || 0);
              const carryingCosts = calculateCarryingCosts(
                baseAcquisitionCost,
                0, // Assume no capital for pricing display
                yearsHeld * 12,
                formulaParams.averageInterestRate
              );

              const price = calculatePortageLotPrice(
                lot.originalPrice || 0,
                lot.originalNotaryFees || 0,
                lot.originalConstructionCost || 0,
                yearsHeld,
                formulaParams,
                carryingCosts
              );

              return (
                <div
                  key={lot.lotId}
                  className="bg-white border-2 border-orange-300 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-orange-800">Lot #{lot.lotId}</h4>
                      <p className="text-sm text-gray-600">De: {lot.fromParticipant}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Surface imposée</p>
                      <p className="text-xl font-bold text-orange-700">{lot.surface}m²</p>
                    </div>
                  </div>

                  <div className="bg-orange-100 rounded p-3 mb-3">
                    <div className="text-xs text-gray-600 mb-2">Prix de vente</div>
                    <div className="text-2xl font-bold text-orange-800">
                      {price.totalPrice.toLocaleString('fr-BE', { maximumFractionDigits: 0 })} €
                    </div>
                    <div className="text-xs text-gray-600 mt-2 space-y-1">
                      <div className="flex justify-between">
                        <span>Base (achat+notaire+casco):</span>
                        <span className="font-semibold">
                          {((lot.originalPrice || 0) + (lot.originalNotaryFees || 0) + (lot.originalConstructionCost || 0)).toLocaleString('fr-BE')} €
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Indexation ({formulaParams.indexationRate}% × {yearsHeld.toFixed(1)} ans):</span>
                        <span className="font-semibold">{price.indexation.toLocaleString('fr-BE')} €</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Frais de portage ({yearsHeld.toFixed(1)} ans):</span>
                        <span className="font-semibold">{price.carryingCostRecovery.toLocaleString('fr-BE')} €</span>
                      </div>
                    </div>
                  </div>

                  {onSelectLot && (
                    <button
                      onClick={() => onSelectLot(lot, price)}
                      className="w-full px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-lg transition-colors"
                    >
                      👆 Sélectionner ce lot ({lot.surface}m²)
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Copropriété Lots */}
      {coproLots.length > 0 && (
        <div className="bg-purple-50 rounded-lg border-2 border-purple-200 p-6">
          <h3 className="text-lg font-semibold text-purple-700 mb-3 flex items-center gap-2">
            <span>🏢</span>
            Lots Copropriété (Surface libre)
          </h3>
          <div className="space-y-3">
            {coproLots.map(lot => {
              const chosenSurface = coproSurfaces[lot.lotId] || 0;
              const price = calculateCoproEstimatedPrice(
                chosenSurface,
                lot.totalCoproSurface || lot.surface,
                yearsHeld,
                formulaParams
              );

              return (
                <div
                  key={lot.lotId}
                  className="bg-purple-50 border-2 border-purple-300 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="font-bold text-purple-900 text-lg">
                        Lot #{lot.lotId}
                      </div>
                      <div className="text-sm text-purple-700">
                        De la copropriété
                      </div>
                    </div>
                    <div className="px-3 py-1 bg-purple-600 text-white text-xs font-semibold rounded-full">
                      Surface Libre
                    </div>
                  </div>

                  <div className="mb-3">
                    <div className="bg-white p-3 rounded border border-purple-200">
                      <label className="block text-xs text-gray-600 mb-2">
                        Choisissez votre surface (max {lot.surface}m²)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max={lot.surface}
                        step="1"
                        value={chosenSurface || ''}
                        onChange={(e) => handleCoproSurfaceChange(lot.lotId, parseFloat(e.target.value) || 0)}
                        placeholder="0"
                        className="w-full px-3 py-2 text-lg font-bold border border-purple-300 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {price && (
                    <>
                      <div className="grid grid-cols-2 gap-4 mb-3">
                        <div className="bg-white p-3 rounded border border-purple-200">
                          <div className="text-xs text-gray-600 mb-1">Votre surface</div>
                          <div className="text-2xl font-bold text-purple-900">
                            {chosenSurface}m²
                          </div>
                        </div>
                        <div className="bg-white p-3 rounded border border-purple-200">
                          <div className="text-xs text-gray-600 mb-1">Prix Total</div>
                          <div className="text-2xl font-bold text-purple-900">
                            €{price.totalPrice.toLocaleString('fr-BE', { maximumFractionDigits: 0 })}
                          </div>
                        </div>
                      </div>

                      {/* Price Breakdown */}
                      <div className="bg-white p-3 rounded border border-purple-200">
                        <div className="text-xs font-semibold text-gray-700 mb-2">
                          Détail du prix:
                        </div>
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Prix de base</span>
                            <span className="font-semibold">€{price.basePrice.toLocaleString('fr-BE', { maximumFractionDigits: 0 })}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Indexation ({formulaParams.indexationRate}%)</span>
                            <span className="font-semibold">€{price.indexation.toLocaleString('fr-BE', { maximumFractionDigits: 0 })}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Frais de portage</span>
                            <span className="font-semibold">€{price.carryingCostRecovery.toLocaleString('fr-BE', { maximumFractionDigits: 0 })}</span>
                          </div>
                          <div className="flex justify-between text-purple-700 font-semibold">
                            <span>Prix au m²</span>
                            <span>€{price.pricePerM2.toLocaleString('fr-BE', { maximumFractionDigits: 0 })}/m²</span>
                          </div>
                        </div>
                      </div>

                      {/* Select Button for Copro Lots */}
                      {onSelectLot && (
                        <button
                          onClick={() => onSelectLot({
                            ...lot,
                            surface: chosenSurface // Use chosen surface, not maximum lot surface
                          }, price)}
                          className="w-full mt-3 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors"
                        >
                          👆 Sélectionner ce lot ({chosenSurface}m²)
                        </button>
                      )}
                    </>
                  )}

                  {!price && chosenSurface > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded p-2 text-xs text-red-700">
                      Surface invalide (max {lot.surface}m²)
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="text-blue-600 text-xl">ℹ️</div>
          <div className="text-xs text-blue-800">
            <div className="font-semibold mb-1">À propos des prix</div>
            <ul className="space-y-1 list-disc list-inside">
              <li>
                <strong>Lots portage:</strong> Prix fixe incluant {yearsHeld.toFixed(1)} ans d'indexation à {formulaParams.indexationRate}% et frais de portage du·de la fondateur·rice
              </li>
              <li>
                <strong>Lots copro:</strong> Choisissez votre surface. Prix calculé proportionnellement avec indexation et frais de portage
              </li>
              <li>
                Tous les prix sont indicatifs et sujets à validation lors de la transaction
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
