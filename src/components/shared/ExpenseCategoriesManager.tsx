import { useState } from 'react';
import { formatCurrency } from '../../utils/formatting';
import { ExpenseCategorySection } from '../ExpenseCategorySection';
import { Plus, X } from 'lucide-react';
import {
  calculateExpenseCategoriesTotal,
  getFraisGenerauxBreakdown,
  calculateTotalTravauxCommuns,
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
  // Collapsible state for sections
  const [isTravauxCommunsExpanded, setIsTravauxCommunsExpanded] = useState(false);
  const [isFraisGenerauxExpanded, setIsFraisGenerauxExpanded] = useState(true);

  // Permission checks for collective fields
  const { canEdit: canEditGlobalCasco } = useProjectParamPermissions('globalCascoPerM2');
  const { canEdit: canEditCascoTva } = useProjectParamPermissions('cascoTvaRate');
  const { canEdit: canEditExpenseCategories } = useProjectParamPermissions('expenseCategories');

  // Calculate detailed breakdown
  const fraisGenerauxBreakdown = getFraisGenerauxBreakdown(participants, projectParams, unitDetails);

  // Initialize travauxCommuns with default values if undefined
  const travauxCommuns = projectParams.travauxCommuns ?? {
    enabled: false,
    items: [{ label: 'Rénovation complète', amount: 270000 }]
  };

  // Calculate the full travaux communs total using the utility function
  const fullTravauxCommunsTotal = calculateTotalTravauxCommuns(projectParams);

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

  /**
   * Handlers for TRAVAUX COMMUNS
   */
  const handleTravauxCommunsToggle = () => {
    onUpdateProjectParams({
      ...projectParams,
      travauxCommuns: {
        ...travauxCommuns,
        enabled: !travauxCommuns.enabled
      }
    });
  };

  const handleTravauxCommunsItemChange = (index: number, value: number) => {
    const newItems = travauxCommuns.items.map((item, i) =>
      i === index ? { ...item, amount: value } : item
    );
    onUpdateProjectParams({
      ...projectParams,
      travauxCommuns: {
        ...travauxCommuns,
        items: newItems
      }
    });
  };

  const handleTravauxCommunsItemLabelChange = (index: number, label: string) => {
    const newItems = travauxCommuns.items.map((item, i) =>
      i === index ? { ...item, label } : item
    );
    onUpdateProjectParams({
      ...projectParams,
      travauxCommuns: {
        ...travauxCommuns,
        items: newItems
      }
    });
  };

  const handleTravauxCommunsAddItem = () => {
    onUpdateProjectParams({
      ...projectParams,
      travauxCommuns: {
        ...travauxCommuns,
        items: [...travauxCommuns.items, { label: 'Nouvelle dépense', amount: 0 }]
      }
    });
  };

  const handleTravauxCommunsRemoveItem = (index: number) => {
    onUpdateProjectParams({
      ...projectParams,
      travauxCommuns: {
        ...travauxCommuns,
        items: travauxCommuns.items.filter((_, i) => i !== index)
      }
    });
  };

  return (
    <div className="space-y-3">
      {/* TRAVAUX COMMUNS section */}
      <div className={`border border-gray-200 rounded-lg overflow-hidden ${!travauxCommuns.enabled ? 'opacity-60' : ''}`}>
        <button
          onClick={() => {
            setIsTravauxCommunsExpanded(!isTravauxCommunsExpanded);
          }}
          className="flex justify-between items-center p-3 bg-gray-50 w-full transition-colors hover:bg-gray-100"
        >
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={travauxCommuns.enabled}
              onChange={(e) => {
                e.stopPropagation();
                handleTravauxCommunsToggle();
                if (!travauxCommuns.enabled) {
                  setIsTravauxCommunsExpanded(true);
                }
              }}
              className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
            />
            <svg
              className={`w-4 h-4 text-gray-600 transition-transform ${isTravauxCommunsExpanded ? 'rotate-90' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <div>
              <h4 className="text-sm font-semibold text-gray-800 uppercase tracking-wide">
                TRAVAUX COMMUNS
              </h4>
              <p className="text-xs text-gray-500 italic mt-0.5">
                Répartition : par personne (égale)
              </p>
            </div>
          </div>
          <span className={`text-sm font-bold ${travauxCommuns.enabled ? 'text-purple-700' : 'text-gray-400'}`}>
            {formatCurrency(fullTravauxCommunsTotal)}
          </span>
        </button>
        {isTravauxCommunsExpanded && (
          <div className="p-3 bg-white space-y-2">
            {/* Display custom travaux communs items only when enabled */}
            {!travauxCommuns.enabled && (
              <div className="p-3 bg-gray-50 rounded text-center">
                <p className="text-sm text-gray-500 italic">
                  Activez les travaux communs pour ajouter des éléments personnalisables
                </p>
              </div>
            )}
            {travauxCommuns.enabled && (
              <>
                {travauxCommuns.items.length > 0 && (
                  <h5 className="text-xs font-semibold text-gray-700 uppercase">Travaux additionnels (personnalisables)</h5>
                )}
                {travauxCommuns.items.map((item, index) => (
                  <div key={index} className="grid grid-cols-[1fr_auto_auto] gap-2 items-center">
                    <input
                      type="text"
                      value={item.label}
                      onChange={(e) => handleTravauxCommunsItemLabelChange(index, e.target.value)}
                      disabled={!canEditExpenseCategories}
                      className={`px-3 py-2 text-xs border border-gray-300 rounded-lg focus:border-purple-500 focus:ring-1 focus:ring-purple-500 focus:outline-none bg-white ${!canEditExpenseCategories ? 'opacity-60 cursor-not-allowed bg-gray-50' : ''}`}
                      placeholder="Label"
                    />
                    <input
                      type="number"
                      step="100"
                      value={item.amount}
                      onChange={(e) => handleTravauxCommunsItemChange(index, parseFloat(e.target.value) || 0)}
                      disabled={!canEditExpenseCategories}
                      className={`w-32 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:border-purple-500 focus:ring-1 focus:ring-purple-500 focus:outline-none bg-white ${!canEditExpenseCategories ? 'opacity-60 cursor-not-allowed bg-gray-50' : ''}`}
                    />
                    <button
                      onClick={() => handleTravauxCommunsRemoveItem(index)}
                      disabled={!canEditExpenseCategories}
                      className={`p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors ${!canEditExpenseCategories ? 'opacity-60 cursor-not-allowed' : ''}`}
                      title="Supprimer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}

                {/* Add Item Button */}
                <button
                  onClick={handleTravauxCommunsAddItem}
                  disabled={!canEditExpenseCategories}
                  className={`w-full mt-2 flex items-center justify-center gap-2 px-3 py-2 text-sm text-purple-700 border border-purple-300 rounded-lg hover:bg-purple-50 transition-colors ${!canEditExpenseCategories ? 'opacity-60 cursor-not-allowed' : ''}`}
                >
                  <Plus className="w-4 h-4" />
                  Ajouter une ligne
                </button>
              </>
            )}

            {/* Total summary */}
            <div className="mt-3 p-2 bg-purple-100 rounded border border-purple-300">
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-sm font-bold text-gray-800">TOTAL Travaux Communs</span>
                  <span className="text-sm font-bold text-purple-800">{formatCurrency(fullTravauxCommunsTotal)}</span>
                </div>
                {participants.length > 0 && (
                  <div className="text-xs text-gray-600 mt-1 italic">
                    Par participant: {formatCurrency(fullTravauxCommunsTotal / participants.length)}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

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
        <button
          onClick={() => setIsFraisGenerauxExpanded(!isFraisGenerauxExpanded)}
          className="flex justify-between items-center p-3 bg-gray-50 w-full hover:bg-gray-100 transition-colors"
        >
          <div className="flex items-center gap-2">
            <svg
              className={`w-4 h-4 text-gray-600 transition-transform ${isFraisGenerauxExpanded ? 'rotate-90' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <div>
              <h4 className="text-sm font-semibold text-gray-800 uppercase tracking-wide">
                Frais Généraux (3 ans)
              </h4>
              <p className="text-xs text-gray-500 italic mt-0.5">
                Répartition : par personne (égale)
              </p>
            </div>
          </div>
          <span className="text-sm font-bold text-purple-700">
            {formatCurrency(sharedCosts - calculateExpenseCategoriesTotal(expenseCategories))}
          </span>
        </button>
        {isFraisGenerauxExpanded && (
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
                <span className="text-xs font-medium text-gray-700">Honoraires (15% × 30% CASCO hors TVA sur 3 ans)</span>
                <span className="text-xs font-bold text-blue-700">{formatCurrency(fraisGenerauxBreakdown.honorairesTotal3Years)}</span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Base CASCO hors TVA: {formatCurrency(fraisGenerauxBreakdown.totalCasco)} | {formatCurrency(fraisGenerauxBreakdown.honorairesYearly)}/an
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
        )}
      </div>
    </div>
  );
}
