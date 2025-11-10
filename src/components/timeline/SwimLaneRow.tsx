import type { ReactNode } from 'react';

interface SwimLaneRowProps {
  label: string;
  labelClassName?: string;
  rowClassName?: string;
  children: ReactNode;
}

export default function SwimLaneRow({
  label,
  labelClassName = '',
  rowClassName = '',
  children
}: SwimLaneRowProps) {
  return (
    <>
      {/* Sticky name column */}
      <div className={`h-40 flex items-center border-b border-gray-200 swimlane-row ${rowClassName}`}>
        <div className={`font-semibold ${labelClassName}`}>{label}</div>
      </div>

      {/* Timeline cards area */}
      <div className={`h-40 flex items-center border-b border-gray-200 swimlane-row ${rowClassName}`}>
        {children}
      </div>
    </>
  );
}
