import { Users } from 'lucide-react';

interface TimelineHeaderProps {
  onAddParticipant: () => void;
}

export default function TimelineHeader({ onAddParticipant }: TimelineHeaderProps) {
  return (
    <div className="flex justify-between items-center mb-4">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">💳 Besoins de Financement Individuels</h2>
        <p className="text-sm text-gray-600 mt-1">
          Visualisez l'évolution des besoins de financement au fil du temps
        </p>
      </div>
      <button
        onClick={onAddParticipant}
        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded-lg transition-colors flex items-center gap-2"
      >
        <Users className="w-5 h-5" />
        Ajouter un·e participant·e
      </button>
    </div>
  );
}
