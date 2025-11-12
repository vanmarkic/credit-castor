/**
 * File I/O operations for scenario data
 * Handles serialization, deserialization, download, and upload of scenario files
 */

import { RELEASE_VERSION, isCompatibleVersion } from './version';
import type {
  Participant,
  ProjectParams,
  CalculationResults,
  PortageFormulaParams
} from './calculatorUtils';
import { DEFAULT_PORTAGE_FORMULA as PORTAGE_DEFAULTS } from './calculatorUtils';
import type { UnitDetails } from './calculatorUtils';
import type { TimelineSnapshot } from './timelineCalculations';
import { syncSoldDatesFromPurchaseDetails } from './participantSync';

export interface ScenarioData {
  version: number;
  releaseVersion: string;
  timestamp: string;
  participants: Participant[];
  projectParams: ProjectParams;
  // scenario removed - backward compatibility maintained for loading old files
  deedDate: string;
  portageFormula: PortageFormulaParams;
  unitDetails: UnitDetails;
  timelineSnapshots?: {
    [participantName: string]: TimelineSnapshot[];
  };
  calculations?: {
    totalSurface: number;
    pricePerM2: number;
    sharedCosts: number;
    sharedPerPerson: number;
    participantBreakdown: Array<{
      name: string;
      unitId?: number;
      surface?: number;
      quantity?: number;
      pricePerM2: number;
      purchaseShare: number;
      droitEnregistrements: number;
      fraisNotaireFixe: number;
      casco: number;
      parachevements: number;
      personalRenovationCost: number;
      constructionCost: number;
      constructionCostPerUnit: number;
      travauxCommunsPerUnit: number;
      sharedCosts: number;
      totalCost: number;
      loanNeeded: number;
      financingRatio: number;
      monthlyPayment: number;
      totalRepayment: number;
      totalInterest: number;
      // Two-loan financing breakdown (optional)
      loan1Amount?: number;
      loan1MonthlyPayment?: number;
      loan1Interest?: number;
      loan2Amount?: number;
      loan2DurationYears?: number;
      loan2MonthlyPayment?: number;
      loan2Interest?: number;
    }>;
    totals: {
      purchase: number;
      totalDroitEnregistrements: number;
      totalFraisNotaireFixe: number;
      construction: number;
      shared: number;
      totalTravauxCommuns: number;
      travauxCommunsPerUnit: number;
      total: number;
      capitalTotal: number;
      totalLoansNeeded: number;
      averageLoan: number;
      averageCapital: number;
    };
  };
}

export interface LoadScenarioResult {
  success: boolean;
  data?: {
    participants: Participant[];
    projectParams: ProjectParams;
    // scenario removed
    deedDate: string;
    portageFormula: PortageFormulaParams;
  };
  error?: string;
}

/**
 * Serialize scenario data to JSON
 */
export function serializeScenario(
  participants: Participant[],
  projectParams: ProjectParams,
  deedDate: string,
  portageFormula: PortageFormulaParams,
  unitDetails: UnitDetails,
  calculations: CalculationResults,
  timelineSnapshots?: Map<string, TimelineSnapshot[]>
): string {
  const data: ScenarioData = {
    version: 2,
    releaseVersion: RELEASE_VERSION,
    timestamp: new Date().toISOString(),
    participants,
    projectParams,
    // scenario removed - no longer saving percentage-based adjustments
    deedDate,
    portageFormula,
    unitDetails,
    ...(timelineSnapshots && {
      timelineSnapshots: Object.fromEntries(timelineSnapshots)
    }),
    calculations: {
      totalSurface: calculations.totalSurface,
      pricePerM2: calculations.pricePerM2,
      sharedCosts: calculations.sharedCosts,
      sharedPerPerson: calculations.sharedPerPerson,
      participantBreakdown: calculations.participantBreakdown.map(p => ({
        name: p.name,
        unitId: p.unitId,
        surface: p.surface,
        quantity: p.quantity,
        pricePerM2: p.pricePerM2,
        purchaseShare: p.purchaseShare,
        notaryFees: p.droitEnregistrements,
        casco: p.casco,
        parachevements: p.parachevements,
        personalRenovationCost: p.personalRenovationCost,
        constructionCost: p.constructionCost,
        constructionCostPerUnit: p.constructionCostPerUnit,
        travauxCommunsPerUnit: p.travauxCommunsPerUnit,
        sharedCosts: p.sharedCosts,
        totalCost: p.totalCost,
        loanNeeded: p.loanNeeded,
        financingRatio: p.financingRatio,
        monthlyPayment: p.monthlyPayment,
        totalRepayment: p.totalRepayment,
        totalInterest: p.totalInterest,
        // Two-loan financing breakdown (only populated if useTwoLoans = true)
        loan1Amount: p.loan1Amount,
        loan1MonthlyPayment: p.loan1MonthlyPayment,
        loan1Interest: p.loan1Interest,
        loan2Amount: p.loan2Amount,
        loan2DurationYears: p.loan2DurationYears,
        loan2MonthlyPayment: p.loan2MonthlyPayment,
        loan2Interest: p.loan2Interest
      })),
      totals: {
        purchase: calculations.totals.purchase,
        totalNotaryFees: calculations.totals.totalDroitEnregistrements,
        construction: calculations.totals.construction,
        shared: calculations.totals.shared,
        totalTravauxCommuns: calculations.totals.totalTravauxCommuns,
        travauxCommunsPerUnit: calculations.totals.travauxCommunsPerUnit,
        total: calculations.totals.total,
        capitalTotal: calculations.totals.capitalTotal,
        totalLoansNeeded: calculations.totals.totalLoansNeeded,
        averageLoan: calculations.totals.averageLoan,
        averageCapital: calculations.totals.averageCapital
      }
    }
  };

  return JSON.stringify(data, null, 2);
}

/**
 * Deserialize scenario data from JSON string
 */
export function deserializeScenario(jsonString: string): LoadScenarioResult {
  try {
    const data = JSON.parse(jsonString) as ScenarioData;

    // Validate the data structure
    if (!data.participants || !data.projectParams) {
      return {
        success: false,
        error: 'Fichier invalide: structure de données manquante'
      };
    }

    // Validate release version match
    if (!isCompatibleVersion(data.releaseVersion)) {
      const versionMsg = data.releaseVersion
        ? `ce fichier a été créé avec la version ${data.releaseVersion}, mais vous utilisez la version ${RELEASE_VERSION}`
        : `ce fichier n'a pas de numéro de version (ancien format)`;
      return {
        success: false,
        error: `Version incompatible: ${versionMsg}.\n\nEnvoie le fichier à Dragan.`
      };
    }

    // Sync soldDate fields from purchaseDetails to ensure consistency
    const syncedParticipants = syncSoldDatesFromPurchaseDetails(data.participants);

    // Backward compatibility: use default portageFormula if not present in file
    const portageFormula = data.portageFormula
      ? { ...PORTAGE_DEFAULTS, ...data.portageFormula }
      : PORTAGE_DEFAULTS;

    return {
      success: true,
      data: {
        participants: syncedParticipants,
        projectParams: data.projectParams,
        // scenario removed - old files may have it but we ignore it
        deedDate: data.deedDate || '',
        portageFormula
      }
    };
  } catch (error) {
    console.error('Error deserializing scenario:', error);
    return {
      success: false,
      error: 'Erreur lors du chargement du fichier. Vérifiez que le fichier est valide.'
    };
  }
}

/**
 * Download scenario as JSON file
 */
export function downloadScenarioFile(
  participants: Participant[],
  projectParams: ProjectParams,
  deedDate: string,
  portageFormula: PortageFormulaParams,
  unitDetails: UnitDetails,
  calculations: CalculationResults,
  timelineSnapshots?: Map<string, TimelineSnapshot[]>
): void {
  const jsonString = serializeScenario(
    participants,
    projectParams,
    deedDate,
    portageFormula,
    unitDetails,
    calculations,
    timelineSnapshots
  );

  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;

  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10);
  const timeStr = now.toTimeString().slice(0, 5).replace(':', '-');
  link.download = `scenario_${dateStr}_${timeStr}.json`;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Create a callback for file upload events
 */
export function createFileUploadHandler(
  onSuccess: (data: {
    participants: Participant[];
    projectParams: ProjectParams;
    // scenario removed
    deedDate: string;
    portageFormula: PortageFormulaParams;
  }) => void,
  onError: (message: string) => void
): (event: React.ChangeEvent<HTMLInputElement>) => void {
  return (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const result = deserializeScenario(content);

      if (result.success && result.data) {
        onSuccess(result.data);
      } else {
        onError(result.error || 'Erreur inconnue');
      }
    };

    reader.readAsText(file);

    // Reset the input so the same file can be loaded again
    if (event.target) {
      event.target.value = '';
    }
  };
}
