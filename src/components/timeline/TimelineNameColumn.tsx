import type { Participant } from '../../utils/calculatorUtils';

interface TimelineNameColumnProps {
  participants: Participant[];
  onUpdateParticipant: (index: number, updated: Participant) => void;
}

export default function TimelineNameColumn({ participants, onUpdateParticipant }: TimelineNameColumnProps) {
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
          className={`h-40 flex items-center border-b border-gray-200 swimlane-row ${
            p.enabled === false ? 'opacity-50' : ''
          }`}
        >
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={p.enabled !== false}
              onChange={(e) => {
                onUpdateParticipant(idx, {
                  ...p,
                  enabled: e.target.checked
                });
              }}
              className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              title={p.enabled === false ? "Activer ce participant" : "Désactiver ce participant"}
            />
            <div className={`font-semibold ${p.enabled === false ? 'text-gray-500' : 'text-gray-800'}`}>
              {p.name}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
