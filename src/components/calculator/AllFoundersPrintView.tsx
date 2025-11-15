import { formatCurrency } from '../../utils/formatting';
import { CostBreakdownGrid } from '../shared/CostBreakdownGrid';
import { ConstructionDetailSection } from '../shared/ConstructionDetailSection';
import { FinancingResultCard } from '../shared/FinancingResultCard';
import { ExpectedPaybacksCard } from '../shared/ExpectedPaybacksCard';
import { TwoLoanFinancingSection } from '../shared/TwoLoanFinancingSection';
import { validateTwoLoanFinancing } from '../../utils/twoLoanValidation';
import { calculateExpenseCategoriesTotal } from '../../utils/calculatorUtils';
import type { Participant, ParticipantCalculation, CalculationResults, ProjectParams, PortageFormulaParams, UnitDetails } from '../../utils/calculatorUtils';

interface AllFoundersPrintViewProps {
  founders: Participant[];
  founderCalculations: ParticipantCalculation[];
  deedDate: string;
  allParticipants: Participant[];
  calculations: CalculationResults;
  projectParams: ProjectParams;
  unitDetails: UnitDetails;
  formulaParams: PortageFormulaParams;
}

export default function AllFoundersPrintView({
  founders,
  founderCalculations,
  deedDate,
  allParticipants,
  calculations,
  projectParams,
  unitDetails,
  formulaParams,
}: AllFoundersPrintViewProps) {
  return (
    <div className="print-visible hidden print:block">
      {/* Print Header */}
      <div className="print-header mb-8">
        <h1 className="text-3xl font-bold mb-2">Détails de Tous les Fondateurs</h1>
        <p className="text-lg text-gray-600">
          Généré le {new Date().toLocaleDateString('fr-BE', { day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
        <p className="text-sm text-gray-500 mt-2">
          Date de l'acte: {new Date(deedDate).toLocaleDateString('fr-BE', { day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* Project Summary */}
      <div className="mb-8 p-6 bg-gray-50 rounded-lg border border-gray-200">
        <h2 className="text-xl font-bold mb-4">Résumé du Projet</h2>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-600 mb-1">Coût Total du Projet</p>
            <p className="text-2xl font-bold">{formatCurrency(calculations.totals.total || 0)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Nombre de Fondateurs</p>
            <p className="text-2xl font-bold">{founders.length}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Surface Totale</p>
            <p className="text-2xl font-bold">{calculations.totalSurface || 0}m²</p>
          </div>
        </div>
      </div>

      {/* Each Founder's Details */}
      {founders.map((founder, index) => {
        const p = founderCalculations[index];
        if (!p) return null;

        const validationErrors = founder.useTwoLoans
          ? validateTwoLoanFinancing(founder, p.personalRenovationCost || 0)
          : {};

        return (
          <div key={founder.name || index} className="mb-12 page-break-before">
            {/* Founder Header */}
            <div className="mb-6 pb-4 border-b-2 border-gray-300">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{p.name}</h2>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <span className="text-gray-400">Unité</span>
                  <span className="font-medium text-blue-600">{p.unitId}</span>
                </span>
                <span className="text-gray-300">•</span>
                <span>{p.surface}m²</span>
                <span className="text-gray-300">•</span>
                <span>{p.quantity || 1} {(p.quantity || 1) > 1 ? 'unités' : 'unité'}</span>
                <span className="text-gray-300">•</span>
                <span className="font-medium text-green-600">Fondateur·rice</span>
              </div>
            </div>

            {/* Key Financial Metrics */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <p className="text-xs text-gray-500 mb-1">Coût Total</p>
                <p className="text-xl font-bold text-gray-900">{formatCurrency(p.totalCost)}</p>
              </div>
              <div className="bg-red-50 rounded-lg p-4 border border-red-300">
                <p className="text-xs text-gray-600 mb-1">À emprunter</p>
                <p className="text-xl font-bold text-red-700">{formatCurrency(p.loanNeeded)}</p>
              </div>
              <div className="bg-white rounded-lg p-4 border border-gray-200">
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

            {/* Configuration Section */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-3">Configuration</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Surface totale (m²)</label>
                  <div className="text-base font-medium">{p.surface}m²</div>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Quantité</label>
                  <div className="text-base font-medium">{p.quantity || 1}</div>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Capital apporté</label>
                  <div className="text-base font-semibold text-green-700">{formatCurrency(p.capitalApporte)}</div>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Frais d'enregistrement</label>
                  <div className="text-sm text-gray-600 mb-1">{p.registrationFeesRate}%</div>
                  <div className="text-base font-medium">{formatCurrency(p.droitEnregistrements)}</div>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Taux d'intérêt (%)</label>
                  <div className="text-base font-medium">{p.interestRate}%</div>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Durée (années)</label>
                  <div className="text-base font-medium">{p.durationYears}</div>
                </div>
              </div>

              {/* Two-Loan Financing Section */}
              {founder.useTwoLoans && (
                <div className="mt-4">
                  <TwoLoanFinancingSection
                    participant={founder}
                    participantCalc={p}
                    personalRenovationCost={p.personalRenovationCost || 0}
                    validationErrors={validationErrors}
                    onUpdateParticipant={() => {}} // No-op for print view
                  />
                </div>
              )}
            </div>

            {/* Cost Breakdown */}
            <div className="mb-6">
              <CostBreakdownGrid
                participant={founder}
                participantCalc={p}
                projectParams={projectParams}
                allParticipants={allParticipants}
                unitDetails={unitDetails}
                deedDate={deedDate}
                formulaParams={formulaParams}
              />
            </div>

            {/* Construction Detail */}
            <div className="mb-6">
              <ConstructionDetailSection
                participant={founder}
                participantCalc={p}
                projectParams={projectParams}
                onUpdateParachevementsPerM2={() => {}} // No-op for print view
                onUpdateCascoSqm={() => {}} // No-op for print view
                onUpdateParachevementsSqm={() => {}} // No-op for print view
              />
            </div>

            {/* Financing Result */}
            <div className="mb-6">
              <FinancingResultCard 
                participantCalc={p}
                projectParams={projectParams}
                allParticipants={allParticipants}
                unitDetails={unitDetails}
                deedDate={deedDate}
              />
            </div>

            {/* Expected Paybacks */}
            <div className="mb-6">
              <ExpectedPaybacksCard
                participant={founder}
                allParticipants={allParticipants}
                deedDate={deedDate}
                coproReservesShare={formulaParams.coproReservesShare}
                projectParams={projectParams}
                calculations={calculations}
                formulaParams={formulaParams}
              />
            </div>
          </div>
        );
      })}

      {/* Common Costs Summary */}
      <div className="mt-12 page-break-before">
        <h2 className="text-2xl font-bold mb-6">Frais Communs (Commun)</h2>
        <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div>
              <p className="text-xs text-gray-600 mb-1">Total Frais Communs</p>
              <p className="text-lg font-bold">{formatCurrency(calculations.totals.shared || 0)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600 mb-1">Par Participant</p>
              <p className="text-lg font-bold">
                {formatCurrency((calculations.totals.shared || 0) / (founders.length || 1))}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-600 mb-1">Infrastructures</p>
              <p className="text-lg font-medium">
                {formatCurrency(projectParams.expenseCategories ? calculateExpenseCategoriesTotal(projectParams.expenseCategories) : 0)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-600 mb-1">Travaux Communs</p>
              <p className="text-lg font-medium">{formatCurrency(typeof projectParams.travauxCommuns === 'number' ? projectParams.travauxCommuns : 0)}</p>
            </div>
          </div>
          
          {projectParams.expenseCategories && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-2">Détail des Catégories</p>
              <div className="space-y-3">
                {/* Conservatoire */}
                {projectParams.expenseCategories.conservatoire && projectParams.expenseCategories.conservatoire.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-700 mb-1">Conservatoire</p>
                    <div className="grid grid-cols-2 gap-2">
                      {projectParams.expenseCategories.conservatoire.map((cat, idx) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <span className="text-gray-600">{cat.label}:</span>
                          <span className="font-medium">{formatCurrency(cat.amount || 0)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Habitabilité Sommaire */}
                {projectParams.expenseCategories.habitabiliteSommaire && projectParams.expenseCategories.habitabiliteSommaire.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-700 mb-1">Habitabilité Sommaire</p>
                    <div className="grid grid-cols-2 gap-2">
                      {projectParams.expenseCategories.habitabiliteSommaire.map((cat, idx) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <span className="text-gray-600">{cat.label}:</span>
                          <span className="font-medium">{formatCurrency(cat.amount || 0)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Premier Travaux */}
                {projectParams.expenseCategories.premierTravaux && projectParams.expenseCategories.premierTravaux.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-700 mb-1">Premier Travaux</p>
                    <div className="grid grid-cols-2 gap-2">
                      {projectParams.expenseCategories.premierTravaux.map((cat, idx) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <span className="text-gray-600">{cat.label}:</span>
                          <span className="font-medium">{formatCurrency(cat.amount || 0)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

