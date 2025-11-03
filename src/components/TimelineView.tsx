import { useState } from 'react';
import { Calendar, Users, ChevronRight } from 'lucide-react';
import type { PhaseProjection } from '../types/timeline';
import PhaseCard from './PhaseCard';
import EventMarker from './EventMarker';

interface TimelineViewProps {
  phases: PhaseProjection[];
}

export default function TimelineView({ phases }: TimelineViewProps) {
  const [selectedPhase, setSelectedPhase] = useState<number | null>(null);

  if (phases.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>No timeline events yet. Start by creating an initial purchase event.</p>
      </div>
    );
  }

  const handlePhaseClick = (phaseNumber: number) => {
    setSelectedPhase(selectedPhase === phaseNumber ? null : phaseNumber);
  };

  return (
    <div className="space-y-6">
      {/* Timeline Header */}
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Project Timeline</h2>
          <p className="text-sm text-gray-600 mt-1">
            {phases.length} phase{phases.length !== 1 ? 's' : ''} tracked
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Calendar className="w-4 h-4" />
          <span>
            {new Date(phases[0].startDate).toLocaleDateString()} - Present
          </span>
        </div>
      </div>

      {/* Timeline Visualization */}
      <div className="relative">
        {phases.map((phase, index) => (
          <div key={phase.phaseNumber} className="relative">
            {/* Phase Segment */}
            <div
              onClick={() => handlePhaseClick(phase.phaseNumber)}
              className={`
                relative border rounded-lg p-6 mb-4 cursor-pointer transition-all
                ${
                  selectedPhase === phase.phaseNumber
                    ? 'border-blue-500 bg-blue-50 shadow-md'
                    : 'border-gray-300 bg-white hover:border-gray-400 hover:shadow-sm'
                }
              `}
            >
              {/* Phase Header */}
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white text-sm font-semibold">
                      {phase.phaseNumber}
                    </span>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        Phase {phase.phaseNumber}
                        {phase.phaseNumber === 0 && ' - Initial Purchase'}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {new Date(phase.startDate).toLocaleDateString()}
                        {phase.endDate && (
                          <>
                            {' → '}
                            {new Date(phase.endDate).toLocaleDateString()}
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {/* Duration Badge */}
                  {phase.durationMonths !== undefined && (
                    <div className="text-right">
                      <div className="text-xs text-gray-500">Duration</div>
                      <div className="text-sm font-semibold text-gray-900">
                        {phase.durationMonths} month{phase.durationMonths !== 1 ? 's' : ''}
                      </div>
                    </div>
                  )}

                  {/* Participants Count */}
                  <div className="text-right">
                    <div className="text-xs text-gray-500">Participants</div>
                    <div className="flex items-center gap-1 text-sm font-semibold text-gray-900">
                      <Users className="w-4 h-4" />
                      {phase.participants.length}
                    </div>
                  </div>

                  {/* Expand indicator */}
                  <ChevronRight
                    className={`w-5 h-5 text-gray-400 transition-transform ${
                      selectedPhase === phase.phaseNumber ? 'rotate-90' : ''
                    }`}
                  />
                </div>
              </div>

              {/* Phase Summary Stats */}
              <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-200">
                <div>
                  <div className="text-xs text-gray-500">Total Surface</div>
                  <div className="text-sm font-semibold text-gray-900">
                    {phase.snapshot.totalSurface.toLocaleString()} m²
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Price per m²</div>
                  <div className="text-sm font-semibold text-gray-900">
                    €{phase.snapshot.pricePerM2.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Total Cost</div>
                  <div className="text-sm font-semibold text-gray-900">
                    €{phase.snapshot.totals.total.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </div>
                </div>
              </div>
            </div>

            {/* Expanded Phase Details */}
            {selectedPhase === phase.phaseNumber && (
              <div className="mb-4 ml-8 animate-fadeIn">
                <PhaseCard phase={phase} />
              </div>
            )}

            {/* Event Marker (if not last phase) */}
            {index < phases.length - 1 && (
              <div className="relative ml-8 mb-4">
                <EventMarker event={phases[index + 1].triggeringEvent!} />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Current Phase Indicator */}
      {phases.length > 0 && !phases[phases.length - 1].endDate && (
        <div className="ml-8 flex items-center gap-2 text-sm text-gray-600 font-medium">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          Current Phase (ongoing)
        </div>
      )}
    </div>
  );
}
