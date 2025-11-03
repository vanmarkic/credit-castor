import { useMemo } from 'react';
import type { Participant, CalculationResults, ProjectParams } from '../utils/calculatorUtils';
import { formatCurrency } from '../utils/formatting';

interface TimelineSnapshot {
  date: Date;
  participantName: string;
  participantIndex: number;
  totalCost: number;
  loanNeeded: number;
  monthlyPayment: number;
  isT0: boolean;
  delta?: {
    totalCost: number;
    loanNeeded: number;
    reason: string;
  };
}

interface HorizontalSwimLaneTimelineProps {
  participants: Participant[];
  projectParams: ProjectParams;
  calculations: CalculationResults;
  deedDate: string;
  onOpenParticipantDetails: (index: number) => void;
}

export default function HorizontalSwimLaneTimeline({
  participants,
  projectParams,
  calculations,
  deedDate,
  onOpenParticipantDetails
}: HorizontalSwimLaneTimelineProps) {
  // Generate snapshots from participants
  const snapshots = useMemo(() => {
    const result: Map<string, TimelineSnapshot[]> = new Map();

    // Get unique dates sorted
    const dates = [...new Set(participants.map(p =>
      p.entryDate ? new Date(p.entryDate).toISOString().split('T')[0] : deedDate
    ))].sort();

    // For each date, create snapshots for all active participants
    dates.forEach((dateStr, dateIdx) => {
      const date = new Date(dateStr);

      participants.forEach((p, pIdx) => {
        const pEntryDate = p.entryDate ? new Date(p.entryDate) : new Date(deedDate);
        const pDateStr = pEntryDate.toISOString().split('T')[0];

        // Only create snapshot if this participant has entered by this date
        if (pDateStr === dateStr) {
          const breakdown = calculations.participantBreakdown[pIdx];

          if (!breakdown) return;

          const snapshot: TimelineSnapshot = {
            date,
            participantName: p.name,
            participantIndex: pIdx,
            totalCost: breakdown.totalCost,
            loanNeeded: breakdown.loanNeeded,
            monthlyPayment: breakdown.monthlyPayment,
            isT0: dateIdx === 0 && p.isFounder
          };

          if (!result.has(p.name)) {
            result.set(p.name, []);
          }
          result.get(p.name)!.push(snapshot);
        }
      });
    });

    return result;
  }, [participants, calculations, deedDate]);

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">💳 Timeline Financier</h2>
      <p className="text-sm text-gray-600 mb-4">
        Visualisez l'évolution des besoins de financement au fil du temps
      </p>

      <div className="flex overflow-x-auto">
        {/* Sticky name column */}
        <div className="flex-shrink-0 w-48 pr-4">
          {participants.map((p, idx) => (
            <div
              key={idx}
              className="h-40 flex items-center border-b border-gray-200 swimlane-row"
            >
              <div className="font-semibold text-gray-800">{p.name}</div>
            </div>
          ))}
        </div>

        {/* Timeline cards area */}
        <div className="flex-1 min-w-0">
          {participants.map((p, idx) => {
            const participantSnapshots = snapshots.get(p.name) || [];

            return (
              <div
                key={idx}
                className="h-40 flex items-center gap-4 border-b border-gray-200 swimlane-row"
              >
                {participantSnapshots.map((snapshot, sIdx) => (
                  <div
                    key={sIdx}
                    className={`
                      w-56 p-4 rounded-lg border-2 transition-shadow hover:shadow-md
                      ${snapshot.isT0
                        ? 'timeline-card-t0 cursor-pointer bg-green-50 border-green-300'
                        : 'bg-blue-50 border-blue-300'
                      }
                      ${p.isFounder ? 'border-green-300' : 'border-blue-300'}
                    `}
                    onClick={() => {
                      if (snapshot.isT0) {
                        onOpenParticipantDetails(snapshot.participantIndex);
                      }
                    }}
                  >
                    <div className="text-xs text-gray-500 mb-2">
                      {snapshot.date.toLocaleDateString('fr-BE')}
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-600">Coût Total</span>
                        <span className="text-sm font-bold text-gray-900">
                          {formatCurrency(snapshot.totalCost)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-600">À emprunter</span>
                        <span className="text-sm font-bold text-red-700">
                          {formatCurrency(snapshot.loanNeeded)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-600">Mensualité</span>
                        <span className="text-sm font-bold text-red-600">
                          {formatCurrency(snapshot.monthlyPayment)}
                        </span>
                      </div>
                    </div>

                    {snapshot.isT0 && (
                      <div className="mt-2 text-xs text-green-700 font-medium">
                        Cliquer pour détails →
                      </div>
                    )}

                    {snapshot.delta && (
                      <div className="mt-2 pt-2 border-t border-current border-opacity-20">
                        <div className={`text-xs font-semibold ${
                          snapshot.delta.totalCost < 0 ? 'text-green-700' : 'text-red-700'
                        }`}>
                          {snapshot.delta.totalCost < 0 ? '📉' : '📈'}{' '}
                          {formatCurrency(Math.abs(snapshot.delta.totalCost))}
                        </div>
                        <div className="text-xs text-gray-600 mt-1">
                          {snapshot.delta.reason}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
