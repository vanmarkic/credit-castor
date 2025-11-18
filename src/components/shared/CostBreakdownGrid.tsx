import { formatCurrency } from '../../utils/formatting';
import type { Participant, ParticipantCalculation, ProjectParams, PortageFormulaParams } from '../../utils/calculatorUtils';
import { 
  calculateCommunCostsBreakdown,
  calculateCommunCostsWithPortageCopro,
  calculateParticipantsAtPurchaseTime,
  calculateParticipantsAtEntryDate,
  calculateNewcomerPurchasePrice,
  type UnitDetails 
} from '../../utils/calculatorUtils';

interface CostBreakdownGridProps {
  participant: Participant;
  participantCalc: ParticipantCalculation;
  projectParams?: ProjectParams;
  allParticipants?: Participant[];
  unitDetails?: UnitDetails;
  deedDate?: string;
  formulaParams?: PortageFormulaParams;
}

/**
 * Calculate quotité for a founder as (founder's surface at T0) / (total surface of all founders at T0)
 * Returns the quotité formatted as "integer/1000" (e.g., "450/1000")
 */
function calculateQuotiteForFounder(
  founder: Participant,
  allParticipants?: Participant[]
): string | null {
  if (!founder.isFounder || !allParticipants) {
    return null;
  }

  const founderSurface = founder.surface || 0;
  if (founderSurface === 0) {
    return null;
  }

  // Calculate total surface of all founders at T0
  const totalFounderSurface = allParticipants
    .filter(p => p.isFounder === true)
    .reduce((sum, p) => sum + (p.surface || 0), 0);

  if (totalFounderSurface === 0) {
    return null;
  }

  // Calculate quotité as a fraction
  const quotite = founderSurface / totalFounderSurface;
  
  // Convert to "integer/1000" format
  // Multiply by 1000 and round to nearest integer
  const numerator = Math.round(quotite * 1000);
  const denominator = 1000;

  // Simplify the fraction if possible (find GCD)
  const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b);
  const divisor = gcd(numerator, denominator);
  const simplifiedNumerator = numerator / divisor;
  const simplifiedDenominator = denominator / divisor;

  return `${simplifiedNumerator}/${simplifiedDenominator}`;
}

/**
 * Displays a grid of cost breakdown cards
 * Shows purchase share, CASCO, commun costs, droit d'enregistrements, frais de notaire, and parachèvements
 * 
 * For founders, also displays quotité (ownership share) below the purchase share amount.
 * Quotité is calculated as: (founder's surface at T0) / (total surface of all founders at T0)
 * Expressed as "integer/1000" format (e.g., "450/1000")
 */
export function CostBreakdownGrid({ participant, participantCalc: p, projectParams, allParticipants, unitDetails, deedDate, formulaParams }: CostBreakdownGridProps) {

  // Calculate quotité for founders
  const quotite = calculateQuotiteForFounder(participant, allParticipants);

  // Calculate founder surface info for display
  const founderSurface = participant.isFounder ? (participant.surface || 0) : 0;
  const totalFounderSurface = participant.isFounder && allParticipants
    ? allParticipants
        .filter(p => p.isFounder === true)
        .reduce((sum, p) => sum + (p.surface || 0), 0)
    : 0;
  const showSurfaceInfo = participant.isFounder && founderSurface > 0 && totalFounderSurface > 0;

  // Check if participant is a newcomer (not a founder)
  const isNewcomer = !participant.isFounder;

  // Calculate newcomer price using quotité formula if applicable
  let newcomerPriceCalculation;
  let existingParticipantsTotal = 0; // Store the total surface used in calculation for display
  if (isNewcomer && participant.purchaseDetails?.buyingFrom === 'Copropriété' && 
      allParticipants && projectParams && deedDate && participant.entryDate) {
    try {
      // Calculate quotité based on ALL participants who entered on or before this buyer's entry date
      // This includes the buyer themselves in the total surface
      const existingParticipants = allParticipants.filter(existing => {
        // Include all participants who entered before or on the same day as this buyer (including the buyer)
        const existingEntryDate = existing.entryDate || (existing.isFounder ? new Date(deedDate) : null);
        if (!existingEntryDate) return false;
        
        const buyerEntryDate = participant.entryDate 
          ? (participant.entryDate instanceof Date ? participant.entryDate : new Date(participant.entryDate))
          : new Date(deedDate);
        return existingEntryDate <= buyerEntryDate;
      });
      
      // Calculate total surface of filtered participants for display
      existingParticipantsTotal = existingParticipants.reduce((sum, p) => sum + (p.surface || 0), 0);
      
      newcomerPriceCalculation = calculateNewcomerPurchasePrice(
        participant.surface || 0,
        existingParticipants, // All participants up to and including the buyer's entry date
        projectParams.totalPurchase,
        deedDate,
        participant.entryDate,
        formulaParams
      );
    } catch (error) {
      console.error('Error calculating newcomer price:', error);
    }
  }

  // Calculate commun costs breakdown using extracted function
  const communBreakdown = projectParams && allParticipants && unitDetails
    ? calculateCommunCostsBreakdown(participant, allParticipants, projectParams, unitDetails, deedDate)
    : null;

  // Calculate participants at purchase time for display
  const participantsAtPurchaseTime = allParticipants
    ? calculateParticipantsAtPurchaseTime(allParticipants, deedDate)
    : 1;

  // Calculate participants at entry date for newcomers
  const participantsAtEntryDate = isNewcomer && participant.entryDate && allParticipants
    ? calculateParticipantsAtEntryDate(allParticipants, participant.entryDate, deedDate)
    : participantsAtPurchaseTime;

  // For newcomers, apply portage copro formula if applicable
  let sharedCostsPerParticipant: number;
  let communCalculationDetails: { base: number; indexation: number; total: number; yearsHeld: number } | null = null;

  if (communBreakdown) {
    if (isNewcomer && participant.entryDate && deedDate && formulaParams) {
      // Apply portage copro formula for newcomers
      const portageResult = calculateCommunCostsWithPortageCopro(
        communBreakdown.totalCommunBeforeDivision,
        participantsAtEntryDate,
        deedDate,
        participant.entryDate,
        formulaParams
      );
      sharedCostsPerParticipant = portageResult.total;
      communCalculationDetails = portageResult;
    } else {
      // For founders, use simple division
      sharedCostsPerParticipant = communBreakdown.sharedCostsPerParticipant;
    }
  } else {
    sharedCostsPerParticipant = 0;
  }

  // Extract breakdown components for display
  const expenseCategoriesTotalForParticipant = communBreakdown?.expenseCategoriesTotal || 0;
  const honorairesPerParticipant = communBreakdown?.honorairesPerParticipant || 0;
  const frais3ansPerParticipant = communBreakdown?.frais3ansPerParticipant || 0;
  const ponctuelsPerParticipant = communBreakdown?.ponctuelsPerParticipant || 0;
  const travauxCommunsPerParticipantForParticipant = communBreakdown?.travauxCommunsPerParticipant || 0;
  const totalCommunBeforeDivision = communBreakdown?.totalCommunBeforeDivision || 0;

  return (
    <div className="mb-6">
      {/* Header - Principle: Proximity (separation from content) */}
      <h3 className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-4">
        Décomposition des Coûts
      </h3>

      <div className="grid grid-cols-3 gap-3">
        {/* Row 1: Purchase-Related Costs - Principle: Proximity + Common Region (grouped together) */}
        {/* Purchase Share */}
        {/* 
          NEWCOMER PURCHASE SHARE CALCULATION:
          
          For newcomers (non-founders), the purchase share should come from purchaseDetails.purchasePrice,
          which is calculated using the portage pricing formula. However, currently in calculatorUtils.ts
          (line 774), the purchase share is calculated using the standard formula:
          
            purchaseShare = surface × pricePerM2
          
          This is INCORRECT for newcomers because:
          
          1. If buying from a FOUNDER (portage lot):
             - Price should use: calculatePortageLotPriceFromFounder()
             - Formula: Base Price + Indexation + Carrying Cost Recovery + Fees Recovery
             - Base Price = founder's original price per lot
             - Indexation = compound growth on base price
             - This is stored in participant.purchaseDetails.purchasePrice
          
          2. If buying from COPROPRIÉTÉ:
             - Price should use: calculateCoproSalePrice() or calculatePortageLotPriceFromCopro()
             - Formula: Base Price + Indexation + Carrying Cost Recovery
             - Base Price = (Total Project Cost / Total Building Surface) × Surface Purchased
             - Indexation = compound growth on base price
             - This is also stored in participant.purchaseDetails.purchasePrice
          
          CURRENT ISSUE:
          The calculatorUtils.ts calculateAll() function at line 774 uses:
            const purchaseShare = calculatePurchaseShare(surface, pricePerM2);
          
          This calculates purchase share using the initial project price per m², which doesn't account
          for portage indexation, carrying costs, or the years held by the copropriété/founder.
          
          FIX NEEDED:
          In calculatorUtils.ts, line 774 should check if participant.purchaseDetails exists:
            const purchaseShare = p.purchaseDetails?.purchasePrice 
              ?? calculatePurchaseShare(surface, pricePerM2);
          
          This way:
          - Founders: Continue using surface × pricePerM2 (standard calculation)
          - Newcomers: Use the calculated portage price from purchaseDetails.purchasePrice
        */}
        <div className="bg-white rounded-lg p-3 border border-gray-200" data-testid="purchase-share-card">
          <p className="text-xs text-gray-500 mb-1.5">Part d'achat</p>
          <p className="text-lg font-bold text-gray-900" data-testid="purchase-share-amount">
            {/* Use calculated newcomer price if available, otherwise use stored value */}
            {newcomerPriceCalculation ? formatCurrency(newcomerPriceCalculation.totalPrice) : formatCurrency(p.purchaseShare ?? 0)}
          </p>
          {(p.surface ?? 0) > 0 && (
            <p className="text-xs text-blue-600 mt-1" data-testid="purchase-share-surface">{p.surface}m²</p>
          )}
          {isNewcomer && (newcomerPriceCalculation || participant.purchaseDetails?.purchasePrice) && (
            <div className="mt-1.5 pt-1.5 border-t border-gray-100" data-testid="newcomer-calculation-details">
              <p className="text-xs text-gray-500 italic mb-1">Calcul pour nouveau participant:</p>
              {participant.purchaseDetails?.buyingFrom === 'Copropriété' && newcomerPriceCalculation ? (
                <p className="text-xs text-gray-400 leading-relaxed" data-testid="newcomer-calculation-text">
                  <span className="font-medium">1. Calcul quotité:</span>
                  <br />
                  Quotité = {participant.surface || 0}m² ÷ {existingParticipantsTotal > 0 ? existingParticipantsTotal : allParticipants?.reduce((s, p) => s + (p.surface || 0), 0)}m² total = {(newcomerPriceCalculation.quotite * 100).toFixed(1)}% ({Math.round(newcomerPriceCalculation.quotite * 1000)}/1000)
                  <br />
                  <br />
                  <span className="font-medium">2. Prix de base = Quotité × Coût projet</span>
                  <br />
                  Prix de base = {(newcomerPriceCalculation.quotite * 100).toFixed(1)}% × {formatCurrency(projectParams?.totalPurchase || 0)} = {formatCurrency(newcomerPriceCalculation.basePrice)}
                  <br />
                  <br />
                  <span className="font-medium">3. Formule portage copro ({newcomerPriceCalculation.yearsHeld.toFixed(1)} ans):</span>
                  <br />
                  Indexation ({formulaParams?.indexationRate ?? 2}%/an): {formatCurrency(newcomerPriceCalculation.basePrice)} × {((Math.pow(1 + (formulaParams?.indexationRate ?? 2) / 100, newcomerPriceCalculation.yearsHeld) - 1) * 100).toFixed(1)}% = {formatCurrency(newcomerPriceCalculation.indexation)}
                  <br />
                  Récup. frais portage: {formatCurrency(newcomerPriceCalculation.carryingCostRecovery)}
                  <br />
                  <br />
                  <span className="font-semibold text-gray-700">Prix final = {formatCurrency(newcomerPriceCalculation.basePrice)} + {formatCurrency(newcomerPriceCalculation.indexation)} + {formatCurrency(newcomerPriceCalculation.carryingCostRecovery)} = {formatCurrency(newcomerPriceCalculation.totalPrice)}</span>
                </p>
              ) : participant.purchaseDetails?.buyingFrom !== 'Copropriété' ? (
                <p className="text-xs text-gray-400 leading-relaxed">
                  Formule portage depuis fondateur:
                  <br />
                  Prix de base + Indexation + Récupération frais de portage + Récupération honoraires
                  <br />
                  <span className="font-medium">Prix de base = Prix d'origine du fondateur par lot</span>
                  <br />
                  Indexation = croissance composée sur prix de base
                  <br />
                  <span className="text-gray-500">Stocké dans: purchaseDetails.purchasePrice</span>
                </p>
              ) : (
                <p className="text-xs text-gray-400">Aucun détail disponible</p>
              )}
              <p className="text-xs text-green-600 mt-1.5 pt-1 border-t border-green-100" data-testid="newcomer-calculation-method">
                ✓ Utilise {newcomerPriceCalculation ? 'calcul quotité + formule portage' : 'purchaseDetails.purchasePrice (formule portage calculée)'}
              </p>
            </div>
          )}
          {quotite && (
            <div className="mt-1.5 pt-1.5 border-t border-gray-100">
              <p className="text-xs text-gray-500">Quotité: {quotite}</p>
              {showSurfaceInfo && (
                <p className="text-xs text-gray-400 mt-0.5">{founderSurface}m² / {totalFounderSurface}m²</p>
              )}
            </div>
          )}
        </div>

        {/* Droit d'enregistrements - Principle: Continuity (aligned with purchase share) */}
        <div className="bg-white rounded-lg p-3 border border-gray-200" data-testid="registration-fees-card">
          <p className="text-xs text-gray-500 mb-1.5">Droit d'enregistrements</p>
          <p className="text-lg font-bold text-gray-900" data-testid="registration-fees-amount">{formatCurrency(p.droitEnregistrements ?? 0)}</p>
          <p className="text-xs text-gray-400 mt-1" data-testid="registration-fees-rate">{(p.registrationFeesRate ?? 0)}%</p>
          {(p.purchaseShare != null && p.registrationFeesRate != null) && (
            <p className="text-xs text-gray-400 mt-1.5 pt-1.5 border-t border-gray-100" data-testid="registration-fees-calculation">
              Part d'achat ({formatCurrency(p.purchaseShare)}) × {p.registrationFeesRate}% = {formatCurrency(p.droitEnregistrements ?? 0)}
            </p>
          )}
        </div>

        {/* Frais de notaire - Principle: Similarity (same border/style as purchase group) */}
        <div className="bg-white rounded-lg p-3 border border-gray-200">
          <p className="text-xs text-gray-500 mb-1.5">Frais de notaire</p>
          <p className="text-lg font-bold text-gray-900">{formatCurrency(p.fraisNotaireFixe ?? 0)}</p>
          <p className="text-xs text-gray-400 mt-1">{(p.quantity ?? 0)} lot{((p.quantity ?? 0) > 1 ? 's' : '')}</p>
        </div>

        {/* Row 2: Commun + Construction Costs - Principle: Common Region + Similarity */}
        {/* Commun - Principle: Figure-Ground (complex content needs clear visual separation) */}
        <div className="bg-white rounded-lg p-3 border border-purple-200">
          <p className="text-xs text-gray-500 mb-1.5">Commun</p>
          <p className="text-lg font-bold text-purple-700">{formatCurrency(sharedCostsPerParticipant || 0)}</p>
          {(expenseCategoriesTotalForParticipant > 0 || honorairesPerParticipant > 0 || frais3ansPerParticipant > 0 || ponctuelsPerParticipant > 0 || travauxCommunsPerParticipantForParticipant > 0) && (
            <div className="mt-2 pt-2 border-t border-purple-100 space-y-1 text-xs text-gray-600">
              {expenseCategoriesTotalForParticipant > 0 && (
                <div className="flex justify-between">
                  <span>Infrastructures</span>
                  <span className="font-medium">{formatCurrency(expenseCategoriesTotalForParticipant || 0)}</span>
                </div>
              )}
              {travauxCommunsPerParticipantForParticipant > 0 && (
                <div className="flex justify-between">
                  <span>Travaux communs</span>
                  <span className="font-medium">{formatCurrency(travauxCommunsPerParticipantForParticipant || 0)}</span>
                </div>
              )}
                  {honorairesPerParticipant > 0 && (
                    <div className="flex justify-between">
                      <span>Honoraires</span>
                      <span className="font-medium">{formatCurrency(honorairesPerParticipant || 0)}</span>
                    </div>
                  )}
                  {frais3ansPerParticipant > 0 && (
                    <div className="flex justify-between">
                      <span>Frais 3 ans</span>
                      <span className="font-medium">{formatCurrency(frais3ansPerParticipant || 0)}</span>
                    </div>
                  )}
                  {ponctuelsPerParticipant > 0 && (
                    <div className="flex justify-between">
                      <span>Ponctuels</span>
                      <span className="font-medium">{formatCurrency(ponctuelsPerParticipant || 0)}</span>
                    </div>
              )}
            </div>
          )}
          {isNewcomer && communCalculationDetails ? (
            <p className="text-xs text-gray-400 mt-2 pt-2 border-t border-purple-50">
              <span className="italic">Formule portage copro:</span>
              <br />
              <span className="font-medium">
                {formatCurrency(totalCommunBeforeDivision || 0)} ÷ {participantsAtEntryDate} participant{(participantsAtEntryDate > 1 ? 's' : '')} = {formatCurrency(communCalculationDetails.base || 0)}
                {communCalculationDetails.indexation > 0 && (
                  <>
                    <br />+ Indexation ({communCalculationDetails.yearsHeld.toFixed(2)} ans) = {formatCurrency(communCalculationDetails.indexation || 0)}
                  </>
                )}
                <br />= {formatCurrency(communCalculationDetails.total || 0)}
              </span>
            </p>
          ) : participantsAtPurchaseTime > 0 && totalCommunBeforeDivision > 0 ? (
            <p className="text-xs text-gray-400 mt-2 pt-2 border-t border-purple-50">
              <span className="italic">Répartis équitablement (non par quotité):</span>
              <br />
              <span className="font-medium">{formatCurrency(totalCommunBeforeDivision || 0)} ÷ {participantsAtPurchaseTime} participant{(participantsAtPurchaseTime > 1 ? 's' : '')} à l'achat = {formatCurrency(sharedCostsPerParticipant || 0)}</span>
            </p>
          ) : null}
        </div>

        {/* CASCO - Principle: Proximity (next to Parachèvements for construction group) */}
        <div className="bg-white rounded-lg p-3 border border-orange-200">
          <p className="text-xs text-gray-500 mb-1.5">CASCO</p>
          <p className="text-lg font-bold text-orange-700">{formatCurrency(p.casco ?? 0)}</p>
          {((participant.cascoSqm ?? p.surface ?? 0) > 0) && (
            <p className="text-xs text-orange-500 mt-1">{participant.cascoSqm ?? p.surface ?? 0}m²</p>
          )}
        </div>

        {/* Parachèvements - Principle: Similarity (same orange border) + Continuity (next to CASCO) */}
        <div className="bg-white rounded-lg p-3 border border-orange-200">
          <p className="text-xs text-gray-500 mb-1.5">Parachèvements</p>
          <p className="text-lg font-bold text-orange-700">{formatCurrency(p.parachevements ?? 0)}</p>
          {((participant.parachevementsSqm ?? p.surface ?? 0) > 0) && (
            <p className="text-xs text-orange-500 mt-1">
              {participant.parachevementsSqm ?? p.surface ?? 0}m²
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
