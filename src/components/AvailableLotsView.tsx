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
import { calculatePortageLotPrice, calculatePortageLotPriceFromCopro, calculateCarryingCosts } from '../utils/portageCalculations';

interface AvailableLotsViewProps {
  availableLots: AvailableLot[];
  deedDate: Date;
  indexationRate?: number; // Default 2%
}

export default function AvailableLotsView({
  availableLots,
  deedDate,
  indexationRate = 2
}: AvailableLotsViewProps) {
  // State for copro lot surface inputs
  const [coproSurfaces, setCoproSurfaces] = useState<Record<number, number>>({});

  const founderLots = availableLots.filter(lot => lot.source === 'FOUNDER');
  const coproLots = availableLots.filter(lot => lot.source === 'COPRO');

  const yearsHeld = calculateYearsHeld(deedDate);

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
      indexationRate,
      estimatedCarryingCosts
    );
  };

  if (availableLots.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
        <p className="text-gray-600">Aucun lot disponible pour le moment</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Lots Disponibles</h2>
        <p className="text-sm text-gray-600 mt-1">
          Choisissez un lot parmi ceux proposés par les fondateurs ou la copropriété
        </p>
      </div>

      {/* Founder Portage Lots */}
      {founderLots.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-orange-700 mb-3">
            📦 Lots Portage (Fondateurs)
          </h3>
          <p className="text-xs text-gray-600 mb-3">
            Surface imposée • Prix incluant indexation et frais de portage
          </p>
          <div className="space-y-3">
            {founderLots.map(lot => {
              // For MVP, calculate simplified price
              // In production, you'd get actual lot data with prices
              const estimatedOriginalPrice = lot.surface * 1377;
              const estimatedNotaryFees = estimatedOriginalPrice * 0.125;
              const carryingCosts = calculateCarryingCosts(
                estimatedOriginalPrice,
                0,
                Math.round(yearsHeld * 12),
                4.5
              );

              const price = calculatePortageLotPrice(
                estimatedOriginalPrice,
                estimatedNotaryFees,
                yearsHeld,
                indexationRate,
                carryingCosts,
                0
              );

              return (
                <div
                  key={lot.lotId}
                  className="bg-orange-50 border-2 border-orange-300 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="font-bold text-orange-900 text-lg">
                        Lot #{lot.lotId}
                      </div>
                      <div className="text-sm text-orange-700">
                        De {lot.fromParticipant}
                      </div>
                    </div>
                    <div className="px-3 py-1 bg-orange-600 text-white text-xs font-semibold rounded-full">
                      Surface Imposée
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div className="bg-white p-3 rounded border border-orange-200">
                      <div className="text-xs text-gray-600 mb-1">Surface</div>
                      <div className="text-2xl font-bold text-orange-900">
                        {lot.surface}m²
                      </div>
                    </div>
                    <div className="bg-white p-3 rounded border border-orange-200">
                      <div className="text-xs text-gray-600 mb-1">Prix Total</div>
                      <div className="text-2xl font-bold text-orange-900">
                        €{price.totalPrice.toLocaleString('fr-BE', { maximumFractionDigits: 0 })}
                      </div>
                    </div>
                  </div>

                  {/* Price Breakdown */}
                  <div className="bg-white p-3 rounded border border-orange-200">
                    <div className="text-xs font-semibold text-gray-700 mb-2">
                      Détail du prix:
                    </div>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Prix de base</span>
                        <span className="font-semibold">€{price.basePrice.toLocaleString('fr-BE', { maximumFractionDigits: 0 })}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Indexation ({indexationRate}%)</span>
                        <span className="font-semibold">€{price.indexation.toLocaleString('fr-BE', { maximumFractionDigits: 0 })}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Frais de portage</span>
                        <span className="font-semibold">€{price.carryingCostRecovery.toLocaleString('fr-BE', { maximumFractionDigits: 0 })}</span>
                      </div>
                      {price.feesRecovery > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Récup. frais notaire</span>
                          <span className="font-semibold">€{price.feesRecovery.toLocaleString('fr-BE', { maximumFractionDigits: 0 })}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Copropriété Lots */}
      {coproLots.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-purple-700 mb-3">
            🏢 Lots Copropriété
          </h3>
          <p className="text-xs text-gray-600 mb-3">
            Choisissez votre surface • Prix calculé proportionnellement
          </p>
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
                            <span className="text-gray-600">Indexation ({indexationRate}%)</span>
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
                <strong>Lots portage:</strong> Prix fixe incluant {yearsHeld.toFixed(1)} ans d'indexation à {indexationRate}% et frais de portage du fondateur
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
