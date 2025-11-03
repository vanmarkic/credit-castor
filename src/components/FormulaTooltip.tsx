import * as Tooltip from '@radix-ui/react-tooltip';
import { Info } from 'lucide-react';

interface FormulaTooltipProps {
  children: React.ReactNode;
  formula: string[];
}

export function FormulaTooltip({ children, formula }: FormulaTooltipProps) {
  return (
    <Tooltip.Root delayDuration={200}>
      <Tooltip.Trigger asChild>
        <span className="inline-flex items-center gap-1 cursor-help">
          {children}
          <Info className="w-3 h-3 text-gray-400 hover:text-blue-600 transition-colors" />
        </span>
      </Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content
          className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 max-w-xs shadow-lg z-50"
          sideOffset={5}
        >
          {formula.map((line, i) => (
            <div key={i} className={i === 0 ? 'font-semibold mb-1' : ''}>
              {line}
            </div>
          ))}
          <Tooltip.Arrow className="fill-gray-900" />
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}
