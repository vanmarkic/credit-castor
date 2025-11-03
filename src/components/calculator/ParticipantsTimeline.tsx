import React from 'react';
import { Clock, Users } from 'lucide-react';
import type { Participant } from '../../utils/calculatorUtils';

interface ParticipantsTimelineProps {
  participants: Participant[];
  deedDate: string;
}

export const ParticipantsTimeline: React.FC<ParticipantsTimelineProps> = ({
  participants,
  deedDate
}) => {
  // Sort participants by entry date
  const sortedParticipants = [...participants].sort((a, b) => {
    const dateA = a.entryDate ? new Date(a.entryDate) : new Date(deedDate);
    const dateB = b.entryDate ? new Date(b.entryDate) : new Date(deedDate);
    return dateA.getTime() - dateB.getTime();
  });

  // Group by entry date
  const grouped = sortedParticipants.reduce((acc, p) => {
    const dateKey = p.entryDate
      ? new Date(p.entryDate).toISOString().split('T')[0]
      : deedDate;
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(p);
    return acc;
  }, {} as Record<string, Participant[]>);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-BE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
      <div className="flex items-center gap-3 mb-6">
        <Clock className="w-6 h-6 text-blue-600" />
        <h2 className="text-2xl font-bold text-gray-800">=e Timeline des Participants</h2>
      </div>

      <div className="relative">
        {/* Vertical timeline line */}
        <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-300"></div>

        {/* Timeline entries */}
        <div className="space-y-6">
          {Object.entries(grouped).map(([date, pList]) => {
            const isFounders = date === deedDate;

            return (
              <div key={date} className="relative pl-20">
                {/* Timeline dot */}
                <div className={`absolute left-6 w-5 h-5 rounded-full border-4 ${
                  isFounders
                    ? 'bg-green-500 border-green-200'
                    : 'bg-blue-500 border-blue-200'
                }`}></div>

                {/* Date label */}
                <div className="mb-2">
                  <div className="text-sm font-semibold text-gray-700">
                    {formatDate(date)}
                  </div>
                  {isFounders && (
                    <div className="text-xs text-green-600 font-medium">
                      T0 - Date de l'acte (Fondateurs)
                    </div>
                  )}
                </div>

                {/* Participant cards */}
                <div className="flex flex-wrap gap-2">
                  {pList.map((p, pIdx) => (
                    <div
                      key={pIdx}
                      className={`px-4 py-2 rounded-lg border-2 ${
                        p.isFounder
                          ? 'bg-green-50 border-green-300 text-green-800'
                          : 'bg-blue-50 border-blue-300 text-blue-800'
                      }`}
                    >
                      <div className="font-semibold">{p.name}</div>
                      <div className="text-xs opacity-75">
                        Unité {p.unitId} " {p.surface}m²
                      </div>
                      {p.purchaseDetails?.buyingFrom && (
                        <div className="text-xs mt-1 font-medium">
                          ’ Achète de {p.purchaseDetails.buyingFrom}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Summary stats */}
      <div className="mt-6 pt-6 border-t border-gray-200 grid grid-cols-2 gap-4">
        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium text-gray-700">Fondateurs</span>
          </div>
          <div className="text-2xl font-bold text-green-700">
            {participants.filter(p => p.isFounder).length}
          </div>
        </div>

        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-gray-700">Nouveaux entrants</span>
          </div>
          <div className="text-2xl font-bold text-blue-700">
            {participants.filter(p => !p.isFounder).length}
          </div>
        </div>
      </div>
    </div>
  );
};
