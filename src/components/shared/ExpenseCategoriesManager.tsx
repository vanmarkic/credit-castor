import { formatCurrency } from '../../utils/formatting';
import { ExpenseCategorySection } from '../ExpenseCategorySection';
import {
  calculateExpenseCategoriesTotal,
  getFraisGenerauxBreakdown,
  type ExpenseCategories,
  type ProjectParams,
  type Participant,
  type UnitDetails
} from '../../utils/calculatorUtils';
import { useProjectParamPermissions } from '../../hooks/useFieldPermissions';

interface ExpenseCategoriesManagerProps {
  expenseCategories: ExpenseCategories;
  projectParams: ProjectParams;
  sharedCosts: number;
  onUpdateProjectParams: (params: ProjectParams) => void;
  participants: Participant[];
  unitDetails: UnitDetails;
}

type CategoryKey = 'conservatoire' | 'habitabiliteSommaire' | 'premierTravaux';

const CATEGORIES: Array<{ key: CategoryKey; title: string }> = [
  { key: 'conservatoire', title: 'CONSERVATOIRE' },
  { key: 'habitabiliteSommaire', title: 'HABITABILITE SOMMAIRE' },
  { key: 'premierTravaux', title: 'PREMIER TRAVAUX' }
];

/**
 * Manages expense categories with unified update logic
 * Eliminates repetitive code by using a data-driven approach
 */
export function ExpenseCategoriesManager({
  expenseCategories,
  projectParams,
  sharedCosts,
  onUpdateProjectParams,
  participants,
  unitDetails
}: ExpenseCategoriesManagerProps) {
  // Permission checks for collective fields
  const { canEdit: canEditGlobalCasco } = useProjectParamPermissions('globalCascoPerM2');
  const { canEdit: canEditCascoTva } = useProjectParamPermissions('cascoTvaRate');
  const { canEdit: canEditExpenseCategories } = useProjectParamPermissions('expenseCategories');

  // Calculate detailed breakdown
  const fraisGenerauxBreakdown = getFraisGenerauxBreakdown(participants, projectParams, unitDetails);

  /**
   * Generic handler to update an item in any category
   */
  const handleItemChange = (categoryKey: CategoryKey, index: number, value: number) => {
    const newCategories = {
      ...expenseCategories,
      [categoryKey]: expenseCategories[categoryKey].map((item, i) =>
        i === index ? { ...item, amount: value } : item
      )
    };
    onUpdateProjectParams({ ...projectParams, expenseCategories: newCategories });
  };

  /**
   * Generic handler to update a label in any category
   */
  const handleItemLabelChange = (categoryKey: CategoryKey, index: number, label: string) => {
    const newCategories = {
      ...expenseCategories,
      [categoryKey]: expenseCategories[categoryKey].map((item, i) =>
        i === index ? { ...item, label } : item
      )
    };
    onUpdateProjectParams({ ...projectParams, expenseCategories: newCategories });
  };

  /**
   * Generic handler to add an item to any category
   */
  const handleAddItem = (categoryKey: CategoryKey) => {
    const newCategories = {
      ...expenseCategories,
      [categoryKey]: [
        ...expenseCategories[categoryKey],
        { label: 'Nouvelle dépense', amount: 0 }
      ]
    };
    onUpdateProjectParams({ ...projectParams, expenseCategories: newCategories });
  };

  /**
   * Generic handler to remove an item from any category
   */
  const handleRemoveItem = (categoryKey: CategoryKey, index: number) => {
    const newCategories = {
      ...expenseCategories,
      [categoryKey]: expenseCategories[categoryKey].filter((_, i) => i !== index)
    };
    onUpdateProjectParams({ ...projectParams, expenseCategories: newCategories });
  };

  return (
    <div className="space-y-3">
      {/* Render each category using the same handlers */}
      {CATEGORIES.map(({ key, title }) => (
        <ExpenseCategorySection
          key={key}
          title={title}
          items={expenseCategories[key]}
          onItemChange={(index, value) => handleItemChange(key, index, value)}
          onItemLabelChange={(index, label) => handleItemLabelChange(key, index, label)}
          onAddItem={() => handleAddItem(key)}
          onRemoveItem={(index) => handleRemoveItem(key, index)}
          disabled={!canEditExpenseCategories}
        />
      ))}

      {/* Frais Généraux section */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="flex justify-between items-center p-3 bg-gray-50">
          <h4 className="text-sm font-semibold text-gray-800 uppercase tracking-wide">
            Frais Généraux étalés sur 3 ans
          </h4>
          <span className="text-sm font-bold text-purple-700">
            {formatCurrency(sharedCosts - calculateExpenseCategoriesTotal(expenseCategories))}
          </span>
        </div>
        <div className="p-3 bg-white space-y-2">
          {/* Global CASCO rate input */}
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-600 whitespace-nowrap">
              Prix CASCO/m² Global:
            </label>
            <input
              type="number"
              step="10"
              value={projectParams.globalCascoPerM2}
              onChange={(e) =>
                onUpdateProjectParams({
                  ...projectParams,
                  globalCascoPerM2: parseFloat(e.target.value) || 1590
                })
              }
              disabled={!canEditGlobalCasco}
              className={`w-24 px-2 py-1 text-sm font-semibold border border-blue-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none ${!canEditGlobalCasco ? 'opacity-60 cursor-not-allowed bg-gray-50' : ''}`}
            />
            <span className="text-xs text-blue-600">€/m²</span>
          </div>

          {/* TVA rate input */}
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-600 whitespace-nowrap">
              TVA CASCO:
            </label>
            <input
              type="number"
              step="1"
              min="0"
              max="21"
              value={projectParams.cascoTvaRate ?? 6}
              onChange={(e) =>
                onUpdateProjectParams({
                  ...projectParams,
                  cascoTvaRate: parseFloat(e.target.value) || 0
                })
              }
              disabled={!canEditCascoTva}
              className={`w-16 px-2 py-1 text-sm font-semibold border border-green-300 rounded focus:border-green-500 focus:ring-1 focus:ring-green-500 focus:outline-none ${!canEditCascoTva ? 'opacity-60 cursor-not-allowed bg-gray-50' : ''}`}
            />
            <span className="text-xs text-green-600">%</span>
            <span className="text-xs text-gray-400 italic">(6% ou 21%)</span>
          </div>

          {/* Detailed breakdown */}
          <div className="mt-3 space-y-2 border-t border-gray-200 pt-3">
            <h5 className="text-xs font-semibold text-gray-700 uppercase">Détail du calcul</h5>

            {/* Honoraires */}
            <div className="bg-blue-50 p-2 rounded">
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium text-gray-700">Honoraires (15% × 30% CASCO)</span>
                <span className="text-xs font-bold text-blue-700">{formatCurrency(fraisGenerauxBreakdown.honoraires)}</span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Base CASCO: {formatCurrency(fraisGenerauxBreakdown.totalCasco)}
              </p>
            </div>

            {/* Recurring costs */}
            <div className="bg-amber-50 p-2 rounded">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-medium text-gray-700">Frais récurrents (3 ans)</span>
                <span className="text-xs font-bold text-amber-700">{formatCurrency(fraisGenerauxBreakdown.recurringTotal3Years)}</span>
              </div>
              <div className="space-y-0.5 text-xs text-gray-600 pl-2">
                <div className="flex justify-between">
                  <span>• Précompte immobilier</span>
                  <span>{formatCurrency(fraisGenerauxBreakdown.recurringYearly.precompteImmobilier)}/an</span>
                </div>
                <div className="flex justify-between">
                  <span>• Comptable</span>
                  <span>{formatCurrency(fraisGenerauxBreakdown.recurringYearly.comptable)}/an</span>
                </div>
                <div className="flex justify-between">
                  <span>• Podio abonnement</span>
                  <span>{formatCurrency(fraisGenerauxBreakdown.recurringYearly.podioAbonnement)}/an</span>
                </div>
                <div className="flex justify-between">
                  <span>• Assurance bâtiment</span>
                  <span>{formatCurrency(fraisGenerauxBreakdown.recurringYearly.assuranceBatiment)}/an</span>
                </div>
                <div className="flex justify-between">
                  <span>• Frais réservation</span>
                  <span>{formatCurrency(fraisGenerauxBreakdown.recurringYearly.fraisReservation)}/an</span>
                </div>
                <div className="flex justify-between">
                  <span>• Imprévus</span>
                  <span>{formatCurrency(fraisGenerauxBreakdown.recurringYearly.imprevus)}/an</span>
                </div>
              </div>
            </div>

            {/* One-time costs */}
            <div className="bg-green-50 p-2 rounded">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-medium text-gray-700">Frais ponctuels</span>
                <span className="text-xs font-bold text-green-700">{formatCurrency(fraisGenerauxBreakdown.oneTimeCosts.total)}</span>
              </div>
              <div className="space-y-0.5 text-xs text-gray-600 pl-2">
                <div className="flex justify-between">
                  <span>• Frais dossier crédit</span>
                  <span>{formatCurrency(fraisGenerauxBreakdown.oneTimeCosts.fraisDossierCredit)}</span>
                </div>
                <div className="flex justify-between">
                  <span>• Frais gestion crédit</span>
                  <span>{formatCurrency(fraisGenerauxBreakdown.oneTimeCosts.fraisGestionCredit)}</span>
                </div>
                <div className="flex justify-between">
                  <span>• Frais notaire base partagée</span>
                  <span>{formatCurrency(fraisGenerauxBreakdown.oneTimeCosts.fraisNotaireBasePartagee)}</span>
                </div>
              </div>
            </div>

            {/* Total */}
            <div className="bg-purple-100 p-2 rounded border border-purple-300">
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-gray-800">TOTAL Frais Généraux</span>
                <span className="text-sm font-bold text-purple-800">{formatCurrency(fraisGenerauxBreakdown.total)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
