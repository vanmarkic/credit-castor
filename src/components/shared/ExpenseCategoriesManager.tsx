import { formatCurrency } from '../../utils/formatting';
import { ExpenseCategorySection } from '../ExpenseCategorySection';
import { calculateExpenseCategoriesTotal, type ExpenseCategories, type ProjectParams } from '../../utils/calculatorUtils';

interface ExpenseCategoriesManagerProps {
  expenseCategories: ExpenseCategories;
  projectParams: ProjectParams;
  sharedCosts: number;
  onUpdateProjectParams: (params: ProjectParams) => void;
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
  onUpdateProjectParams
}: ExpenseCategoriesManagerProps) {

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
              className="w-24 px-2 py-1 text-sm font-semibold border border-blue-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
            />
            <span className="text-xs text-blue-600">€/m²</span>
          </div>

          {/* Calculation breakdown */}
          <div className="text-xs text-gray-500 space-y-0.5">
            <p>• Honoraires (15% × 30% CASCO)</p>
            <p>• Frais récurrents × 3 ans</p>
            <p className="text-gray-400 italic mt-1">Calculé automatiquement</p>
          </div>
        </div>
      </div>
    </div>
  );
}
