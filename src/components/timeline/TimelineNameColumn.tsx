import type { Participant } from '../../utils/calculatorUtils';

interface TimelineNameColumnProps {
  participants: Participant[];
}

export default function TimelineNameColumn({ participants }: TimelineNameColumnProps) {
  return (
    <div className="flex-shrink-0 w-48 pr-4">
      {/* Copropriété row */}
      <div className="h-40 flex items-center border-b border-gray-200 swimlane-row bg-purple-50">
        <div className="font-semibold text-purple-800">La Copropriété</div>
      </div>

      {/* Frais Généraux row */}
      <div className="h-48 flex items-center border-b border-gray-200 swimlane-row bg-purple-25">
        <div className="font-semibold text-purple-700">Frais Généraux</div>
      </div>

      {/* Participant rows */}
      {participants.map((p, idx) => (
        <div
          key={idx}
          className="h-40 flex items-center border-b border-gray-200 swimlane-row"
        >
          <div className="font-semibold text-gray-800">{p.name}</div>
        </div>
      ))}
    </div>
  );
}
