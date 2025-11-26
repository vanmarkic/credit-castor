import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { formatCurrency } from '../../utils/formatting';

type PhaseVariant = 'fixed' | 'progressive' | 'flexible';

interface PaymentPhaseCardProps {
  label: string;
  subtitle: string;
  icon: string;
  total: number;
  items: Array<{ label: string; amount: number }>;
  variant?: PhaseVariant;
  className?: string;
}

const variantStyles: Record<PhaseVariant, string> = {
  fixed: 'border-2 border-blue-300 bg-blue-50',      // Solid - certain
  progressive: 'border-2 border-orange-300 bg-orange-50', // Standard - spread over time
  flexible: 'border-2 border-dashed border-green-300 bg-green-50', // Dashed - flexible
};

export function PaymentPhaseCard({
  label,
  subtitle,
  icon,
  total,
  items,
  variant = 'fixed',
  className = '',
}: PaymentPhaseCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const nonZeroItems = items.filter((item) => item.amount > 0);

  return (
    <div className={`rounded-lg ${variantStyles[variant]} ${className}`}>
      <div className="p-4 text-center">
        <div className="text-2xl mb-1">{icon}</div>
        <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1">
          {label}
        </p>
        <p className="text-xs text-gray-400 italic mb-2">{subtitle}</p>
        <p className="text-2xl font-bold text-gray-900">{formatCurrency(total)}</p>
      </div>

      {nonZeroItems.length > 0 && (
        <>
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full flex items-center justify-center gap-1 py-2 text-xs text-blue-600 hover:text-blue-800 border-t border-gray-200"
          >
            <span>Détails</span>
            {isExpanded ? (
              <ChevronUp className="w-3 h-3" />
            ) : (
              <ChevronDown className="w-3 h-3" />
            )}
          </button>

          {isExpanded && (
            <div className="px-4 pb-4 space-y-2 bg-white/50 rounded-b-lg">
              {nonZeroItems.map((item, idx) => (
                <div key={idx} className="flex justify-between text-sm">
                  <span className="text-gray-600">{item.label}</span>
                  <span className="font-medium text-gray-900">
                    {formatCurrency(item.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
