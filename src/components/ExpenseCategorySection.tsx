import { useState } from 'react';
import { ChevronDown, ChevronUp, Plus, X } from 'lucide-react';
import type { ExpenseLineItem } from '../utils/calculatorUtils';
import { formatCurrency } from '../utils/formatting';

interface ExpenseCategorySectionProps {
  title: string;
  items: ExpenseLineItem[];
  onItemChange: (index: number, value: number) => void;
  onItemLabelChange: (index: number, label: string) => void;
  onAddItem: () => void;
  onRemoveItem: (index: number) => void;
}

export function ExpenseCategorySection({
  title,
  items,
  onItemChange,
  onItemLabelChange,
  onAddItem,
  onRemoveItem
}: ExpenseCategorySectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const total = items.reduce((sum, item) => sum + item.amount, 0);

  return (
    <div className="mb-3 border border-gray-200 rounded-lg overflow-hidden">
      {/* Header - Always Visible */}
      <div
        className="flex justify-between items-center p-3 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <button className="text-gray-600 hover:text-gray-800">
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          <h4 className="text-sm font-semibold text-gray-800 uppercase tracking-wide">{title}</h4>
        </div>
        <span className="text-sm font-bold text-purple-700">{formatCurrency(total)}</span>
      </div>

      {/* Expandable Content */}
      {isExpanded && (
        <div className="p-3 bg-white space-y-2">
          {items.map((item, index) => (
            <div key={index} className="grid grid-cols-[1fr_auto_auto] gap-2 items-center">
              <input
                type="text"
                value={item.label}
                onChange={(e) => onItemLabelChange(index, e.target.value)}
                onClick={(e) => e.stopPropagation()}
                className="px-3 py-2 text-xs border border-gray-300 rounded-lg focus:border-purple-500 focus:ring-1 focus:ring-purple-500 focus:outline-none bg-white"
                placeholder="Label"
              />
              <input
                type="number"
                step="100"
                value={item.amount}
                onChange={(e) => onItemChange(index, parseFloat(e.target.value) || 0)}
                onClick={(e) => e.stopPropagation()}
                className="w-32 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:border-purple-500 focus:ring-1 focus:ring-purple-500 focus:outline-none bg-white"
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveItem(index);
                }}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Supprimer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}

          {/* Add Item Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddItem();
            }}
            className="w-full mt-2 flex items-center justify-center gap-2 px-3 py-2 text-sm text-purple-700 border border-purple-300 rounded-lg hover:bg-purple-50 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Ajouter une ligne
          </button>
        </div>
      )}
    </div>
  );
}
