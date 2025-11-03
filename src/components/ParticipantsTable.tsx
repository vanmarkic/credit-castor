/**
 * ParticipantsTable Component (Phase 4.4)
 *
 * Displays all participants with timeline information
 * - Entry date (deed date for founders)
 * - Founder badge
 * - Current lots owned
 * - Status (Active/Portage/Exited)
 * - Expandable cash flow view
 */

import { useState } from 'react';
import type { ParticipantTimeline } from '../utils/timelineProjection';
import ParticipantCashFlowView from './ParticipantCashFlowView';

interface ParticipantsTableProps {
  participants: ParticipantTimeline[];
  deedDate: Date;
}

export default function ParticipantsTable({
  participants,
  deedDate,
}: ParticipantsTableProps) {
  const [expandedParticipant, setExpandedParticipant] = useState<string | null>(null);

  const toggleExpand = (name: string) => {
    setExpandedParticipant(prev => prev === name ? null : name);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
        <h2 className="text-xl font-bold">Participants</h2>
        <p className="text-sm text-gray-600 mt-1">
          {participants.length} participant{participants.length !== 1 ? 's' : ''} in the project
        </p>
      </div>

      <div className="divide-y divide-gray-200">
        {participants.map(timeline => {
          const { participant, status, currentLots } = timeline;
          const isFounder = participant.isFounder === true;
          const isExpanded = expandedParticipant === participant.name;

          return (
            <div key={participant.name} className="hover:bg-gray-50 transition-colors">
              {/* Participant Row */}
              <div
                className="p-4 cursor-pointer"
                onClick={() => toggleExpand(participant.name)}
              >
                <div className="flex items-center justify-between">
                  {/* Left: Name and badges */}
                  <div className="flex items-center gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-lg">{participant.name}</h3>
                        {isFounder && (
                          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded">
                            Founder
                          </span>
                        )}
                        <span className={`px-2 py-1 text-xs font-semibold rounded ${getStatusColor(status)}`}>
                          {status}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        Entry: {formatDate(participant.entryDate || deedDate)}
                        {isFounder && (
                          <span className="text-green-600 ml-2">(Deed Date)</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Lots info and expand button */}
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-sm font-semibold text-gray-700">
                        {currentLots.length} lot{currentLots.length !== 1 ? 's' : ''}
                      </div>
                      <div className="text-xs text-gray-500">
                        {currentLots.filter(l => l.isPortage).length} portage
                      </div>
                    </div>

                    <button
                      className={`p-2 rounded-lg transition-transform ${
                        isExpanded ? 'rotate-180 bg-blue-100' : 'bg-gray-100'
                      }`}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Lots owned */}
                {currentLots.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {currentLots.map(lot => (
                      <div
                        key={lot.lotId}
                        className={`px-3 py-1 rounded-lg text-xs font-medium ${
                          lot.isPortage
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        Lot #{lot.lotId} ({lot.surface}m²)
                        {lot.isPortage && ' 🏠 Portage'}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Expanded: Cash Flow */}
              {isExpanded && (
                <div className="px-4 pb-4 border-t border-gray-100">
                  <ParticipantCashFlowView
                    cashFlow={timeline.cashFlow}
                    deedDate={deedDate}
                  />
                </div>
              )}
            </div>
          );
        })}

        {participants.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            No participants yet. Add founders to start the project.
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// Helper Functions
// ============================================

function formatDate(date: Date | undefined): string {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('en-BE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'ACTIVE':
      return 'bg-green-100 text-green-700';
    case 'PORTAGE':
      return 'bg-yellow-100 text-yellow-700';
    case 'EXITED':
      return 'bg-gray-100 text-gray-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
}
