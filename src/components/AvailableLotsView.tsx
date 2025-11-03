/**
 * AvailableLotsView Component
 *
 * Displays available lots for newcomers to purchase
 * - Portage lots from founders (imposed surface with calculated price)
 * - Copropriété lots (free surface choice with price calculator)
 */

import { useState } from 'react';
import type { AvailableLot } from '../utils/availableLots';
import type { PortageLotPrice } from '../utils/portageCalculations';
import type { PortageFormulaParams } from '../utils/calculatorUtils';
import { calculatePortageLotPrice, calculatePortageLotPriceFromCopro, calculateCarryingCosts } from '../utils/portageCalculations';
import { formatCurrency } from '../utils/formatting';

interface AvailableLotsViewProps {
  availableLots: AvailableLot[];
  deedDate: Date;
  formulaParams: PortageFormulaParams;
  onSelectLot?: (lot: AvailableLot, price: PortageLotPrice) => void;
}

export default function AvailableLotsView({
  availableLots,
  deedDate,
  formulaParams,
  onSelectLot
}: AvailableLotsViewProps) {
  const [coproSurfaces, setCoproSurfaces] = useState<Record<number, number>>({});

  const founderLots = availableLots.filter(lot => lot.source === 'FOUNDER');
  const coproLots = availableLots.filter(lot => lot.source === 'COPRO');

  const yearsHeld = calculateYearsHeld(deedDate);

  const handleScrollToParticipant = (participantName: string) => {
    const element = document.getElementById(`participant-${participantName}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Highlight briefly
      element.classList.add('ring-2', 'ring-orange-500');
      setTimeout(() => {
        element.classList.remove('ring-2', 'ring-orange-500');
      }, 2000);
    }
  };

  // Handle surface input for copro lots
  const handleCoproSurfaceChange = (lotId: number, surface: number) => {
    setCoproSurfaces(prev => ({
      ...prev,
      [lotId]: surface
    }));
  };

  // Calculate price for copro lot based on user input
  const calculateCoproPrice = (lot: AvailableLot, surfaceChosen: number): PortageLotPrice | null => {
    if (!surfaceChosen || surfaceChosen <= 0 || surfaceChosen > lot.surface) {
      return null;
    }

    // For this MVP, we'll use simplified pricing
    // In production, you'd need actual carrying costs from copro entity
    const estimatedOriginalPrice = lot.surface * 1377; // Base price per m²
    const estimatedCarryingCosts = estimatedOriginalPrice * 0.05 * yearsHeld; // 5% per year estimate

    return calculatePortageLotPriceFromCopro(
      surfaceChosen,
      lot.totalCoproSurface || lot.surface,
      estimatedOriginalPrice,
      yearsHeld,
      formulaParams,
      estimatedCarryingCosts
    );
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
      {/* Title */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <span>🏪</span>
          Place de Marché — Lots Disponibles
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          Choisissez parmi les lots en portage (fondateurs) ou les lots de la copropriété
        </p>
      </div>

      {/* Founder Portage Lots */}
      {founderLots.length > 0 && (
        <div className="bg-orange-50 rounded-lg border-2 border-orange-200 p-6">
          <h3 className="text-lg font-semibold text-orange-700 mb-4 flex items-center gap-2">
            <span>📦</span>
            Lots Portage (Surface imposée)
          </h3>

          {/* Side-by-Side: Formula + Lots */}
          <div className="grid grid-cols-[300px_1fr] gap-6">
            {/* Generic Formula */}
            <div className="bg-white p-4 rounded-lg border border-orange-300 h-fit">
              <h4 className="text-sm font-semibold text-orange-900 mb-3">
                Formule générale
              </h4>
              <div className="space-y-2 text-xs text-gray-700">
                <div className="font-semibold">Prix =</div>
                <div className="pl-2">Base</div>
                <div className="pl-2">+ Indexation</div>
                <div className="pl-2">+ Portage</div>

                <div className="pt-2 border-t border-orange-200 mt-2">
                  <div className="font-semibold mb-1">Où:</div>
                  <div>Base = Achat +</div>
                  <div className="pl-4">Notaire + Casco</div>

                  <div className="mt-1">Indexation =</div>
                  <div className="pl-4">Base × [(1+r)^t-1]</div>

                  <div className="mt-1">Portage =</div>
                  <div className="pl-4">Intérêts +</div>
                  <div className="pl-4">Taxes +</div>
                  <div className="pl-4">Assurance</div>
                </div>
              </div>
            </div>

            {/* Specific Lots */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-orange-900">
                Lots disponibles
              </h4>
              {founderLots.map(lot => {
                const originalPrice = lot.originalPrice ?? lot.surface * 1377;
                const originalNotaryFees = lot.originalNotaryFees ?? originalPrice * 0.125;
                const originalConstructionCost = lot.originalConstructionCost ?? 0;

                const carryingCosts = calculateCarryingCosts(
                  originalPrice,
                  0,
                  Math.round(yearsHeld * 12),
                  formulaParams.averageInterestRate
                );

                const price = calculatePortageLotPrice(
                  originalPrice,
                  originalNotaryFees,
                  originalConstructionCost,
                  yearsHeld,
                  formulaParams,
                  carryingCosts,
                  0
                );

                return (
                  <div
                    key={lot.lotId}
                    className="bg-white border-2 border-orange-300 rounded-lg p-4"
                  >
                    <div className="mb-3">
                      <div className="text-sm">
                        De{' '}
                        <button
                          onClick={() => handleScrollToParticipant(lot.fromParticipant || '')}
                          className="font-bold text-orange-700 hover:text-orange-900 underline"
                        >
                          {lot.fromParticipant}
                        </button>
                        {' • '}
                        <span className="font-bold">{lot.surface}m²</span>
                      </div>
                      <div className="text-lg font-bold text-orange-900 mt-1">
                        Prix: {formatCurrency(price.totalPrice)}
                      </div>
                    </div>

                    {/* Breakdown Table */}
                    <div className="bg-orange-50 rounded border border-orange-200 overflow-hidden">
                      <table className="w-full text-xs">
                        <tbody>
                          <tr className="border-b border-orange-100">
                            <td className="px-3 py-1.5 text-gray-700">Base</td>
                            <td className="px-3 py-1.5 text-right font-semibold">
                              {formatCurrency(price.basePrice)}
                            </td>
                          </tr>
                          <tr className="border-b border-orange-100">
                            <td className="px-3 py-1.5 text-gray-700">
                              Indexation
                              <div className="text-[10px] text-gray-500">
                                ({formulaParams.indexationRate}% × {yearsHeld.toFixed(1)}a)
                              </div>
                            </td>
                            <td className="px-3 py-1.5 text-right font-semibold">
                              {formatCurrency(price.indexation)}
                            </td>
                          </tr>
                          <tr className="border-b border-orange-200">
                            <td className="px-3 py-1.5 text-gray-700">
                              Portage ({yearsHeld.toFixed(1)}a)
                            </td>
                            <td className="px-3 py-1.5 text-right font-semibold">
                              {formatCurrency(price.carryingCostRecovery)}
                            </td>
                          </tr>
                          <tr className="bg-orange-100">
                            <td className="px-3 py-1.5 font-bold text-orange-900">Total</td>
                            <td className="px-3 py-1.5 text-right font-bold text-orange-900">
                              {formatCurrency(price.totalPrice)}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
            </div>
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
              const price = calculateCoproPrice(lot, chosenSurface);

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

// ============================================
// Helper Functions
// ============================================

function calculateYearsHeld(deedDate: Date): number {
  const now = new Date();
  const deed = new Date(deedDate);
  const diffMs = now.getTime() - deed.getTime();
  const diffYears = diffMs / (1000 * 60 * 60 * 24 * 365.25);
  return Math.max(0, diffYears);
}
