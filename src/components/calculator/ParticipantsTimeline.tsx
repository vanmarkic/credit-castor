import React, { useState, useRef, useMemo } from 'react';
import { Clock, Users, ChevronDown, ChevronUp } from 'lucide-react';
import type { Participant } from '../../utils/calculatorUtils';
import { useProjectParamPermissions } from '../../hooks/useFieldPermissions';
import { DraggableRenovationDateCard } from './DraggableRenovationDateCard';

/**
 * Convert Firestore Timestamp to Date if needed
 */
function convertFirestoreTimestamp(value: any): Date | string | null | undefined {
  // Check if this is a Firestore Timestamp object (has seconds and nanoseconds)
  if (value && typeof value === 'object' && 'seconds' in value && 'nanoseconds' in value) {
    // Convert Firestore Timestamp to JavaScript Date
    return new Date(value.seconds * 1000 + value.nanoseconds / 1000000)
  }
  return value
}

/**
 * Safely converts a date value to an ISO date string (YYYY-MM-DD).
 * Returns the fallback date if the input is invalid.
 * Handles Firestore Timestamp objects automatically.
 */
function safeToISODateString(dateValue: string | Date | null | undefined | any, fallback: string): string {
  if (!dateValue) return fallback

  // Convert Firestore Timestamp if needed
  const converted = convertFirestoreTimestamp(dateValue)
  if (!converted) return fallback

  const date = converted instanceof Date ? converted : new Date(converted)

  // Check if date is valid
  if (isNaN(date.getTime())) {
    console.warn(`Invalid date value in ParticipantsTimeline: ${dateValue}, using fallback: ${fallback}`)
    return fallback
  }

  return date.toISOString().split('T')[0]
}

interface ParticipantsTimelineProps {
  participants: Participant[];
  deedDate: string;
  renovationStartDate?: string;
  onDeedDateChange: (date: string) => void;
  onRenovationStartDateChange?: (date: string) => void;
  onUpdateParticipant: (index: number, updated: Participant) => void;
}

export const ParticipantsTimeline: React.FC<ParticipantsTimelineProps> = ({
  participants,
  deedDate,
  renovationStartDate,
  onDeedDateChange,
  onRenovationStartDateChange,
  onUpdateParticipant
}) => {
  const [expandedParticipant, setExpandedParticipant] = useState<string | null>(null);
  const timelineContainerRef = useRef<HTMLDivElement>(null);
  const { canEdit: canEditRenovationStartDate, isLocked: isRenovationStartDateLocked, lockReason: renovationStartDateLockReason } = useProjectParamPermissions('renovationStartDate');

  const toggleExpand = (name: string) => {
    setExpandedParticipant(prev => prev === name ? null : name);
  };
  // Sort participants by entry date
  const sortedParticipants = [...participants].sort((a, b) => {
    const dateStrA = safeToISODateString(a.entryDate, deedDate);
    const dateStrB = safeToISODateString(b.entryDate, deedDate);
    const dateA = new Date(dateStrA);
    const dateB = new Date(dateStrB);
    return dateA.getTime() - dateB.getTime();
  });

  // Group by entry date
  const grouped = sortedParticipants.reduce((acc, p) => {
    const dateKey = safeToISODateString(p.entryDate, deedDate);
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

  // Determine where to insert the renovation date card in the timeline
  // Returns the date after which the card should be inserted, or null if before all
  const getRenovationCardInsertPosition = useMemo(() => {
    if (!renovationStartDate || !onRenovationStartDateChange) return null;
    
    const sortedDates = Object.keys(grouped).sort();
    const renovationDate = new Date(renovationStartDate).getTime();
    
    // Find the last date group that the renovation date is after
    for (let i = sortedDates.length - 1; i >= 0; i--) {
      const groupDate = new Date(sortedDates[i]).getTime();
      if (renovationDate >= groupDate) {
        return sortedDates[i];
      }
    }
    
    // If before all dates, return null (will be inserted before first)
    return null;
  }, [renovationStartDate, grouped, onRenovationStartDateChange]);

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
      <div className="flex items-center gap-3 mb-6">
        <Clock className="w-6 h-6 text-blue-600" />
        <h2 className="text-2xl font-bold text-gray-800">📅 Timeline des Participants</h2>
      </div>

      <div 
        ref={timelineContainerRef}
        className="relative" 
        data-timeline-container 
        style={{ minHeight: '200px' }}
      >
        {/* Vertical timeline line */}
        <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-300"></div>

        {/* Timeline entries */}
        <div className="space-y-6" style={{ position: 'relative', zIndex: 1 }}>
          {Object.entries(grouped).map(([date, pList]) => {
            const isFounders = date === deedDate;
            const shouldInsertRenovationCardAfter = getRenovationCardInsertPosition === date;

            return (
              <React.Fragment key={date}>
                <div className="relative pl-20 transition-all duration-300 ease-in-out">
                  {/* Timeline dot */}
                  <div className={`absolute left-6 w-5 h-5 rounded-full border-4 ${
                    isFounders
                      ? 'bg-green-500 border-green-200'
                      : 'bg-blue-500 border-blue-200'
                  }`}></div>

                  {/* Date label */}
                  <div className="mb-2" data-timeline-date={date}>
                  {isFounders ? (
                    <div className="space-y-3">
                      <div>
                        <input
                          type="date"
                          value={deedDate}
                          onChange={(e) => onDeedDateChange(e.target.value)}
                          className="text-sm font-semibold text-gray-700 px-2 py-1 border-2 border-green-300 rounded-lg focus:border-green-500 focus:ring-1 focus:ring-green-500 focus:outline-none bg-white mb-1"
                        />
                        <div className="text-xs text-green-600 font-medium">
                          T0 - Date de l'acte (Fondateurs)
                        </div>
                        <div className="text-xs text-gray-500 italic mt-1">
                          ℹ️ Changer cette date ajustera automatiquement toutes les dates d'entrée des participants et la date des travaux
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm font-semibold text-gray-700">
                      {formatDate(date)}
                    </div>
                  )}
                </div>

                  {/* Participant cards */}
                  <div className="flex flex-wrap gap-2">
                  {pList.map((p, pIdx) => {
                    const isExpanded = expandedParticipant === p.name;
                    // Find the actual index in the full participants array
                    const actualIndex = participants.findIndex(participant => participant.name === p.name);

                    return (
                      <div
                        key={pIdx}
                        data-testid={p.isFounder ? `participant-founder-${p.name}` : `participant-non-founder-${p.name}`}
                        className={`px-4 py-2 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md ${
                          p.enabled === false
                            ? 'opacity-50 bg-gray-100 border-gray-300 text-gray-600'
                            : p.isFounder
                            ? 'bg-green-50 border-green-300 text-green-800 hover:bg-green-100'
                            : 'bg-blue-50 border-blue-300 text-blue-800 hover:bg-blue-100'
                        }`}
                        onClick={() => toggleExpand(p.name)}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={p.enabled !== false}
                              onChange={(e) => {
                                e.stopPropagation();
                                if (actualIndex !== -1) {
                                  onUpdateParticipant(actualIndex, {
                                    ...p,
                                    enabled: e.target.checked
                                  });
                                }
                              }}
                              className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                              title={p.enabled === false ? "Activer ce participant" : "Désactiver ce participant"}
                            />
                            <div>
                              <div className="font-semibold">{p.name}</div>
                              <div className="text-xs opacity-75">
                                Unité {p.unitId} • {p.surface}m²
                              </div>
                              {p.purchaseDetails?.buyingFrom && (
                                <div className="text-xs mt-1 font-medium">
                                  💼 Achète de {p.purchaseDetails.buyingFrom}
                                </div>
                              )}
                            </div>
                          </div>
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 flex-shrink-0" />
                          ) : (
                            <ChevronDown className="w-4 h-4 flex-shrink-0" />
                          )}
                        </div>

                        {/* Expanded details */}
                        {isExpanded && (
                          <div className="mt-3 pt-3 border-t border-current border-opacity-20 text-xs space-y-1">
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <span className="opacity-75">Capital:</span>
                                <div className="font-semibold">
                                  {p.capitalApporte?.toLocaleString('fr-BE')} €
                                </div>
                              </div>
                              <div>
                                <span className="opacity-75">Frais notaire:</span>
                                <div className="font-semibold">{p.registrationFeesRate}%</div>
                              </div>
                              {p.interestRate && (
                                <div>
                                  <span className="opacity-75">Taux:</span>
                                  <div className="font-semibold">{p.interestRate}%</div>
                                </div>
                              )}
                              {p.durationYears && (
                                <div>
                                  <span className="opacity-75">Durée:</span>
                                  <div className="font-semibold">{p.durationYears} ans</div>
                                </div>
                              )}
                              {p.parachevementsPerM2 && (
                                <div>
                                  <span className="opacity-75">Parachèvements:</span>
                                  <div className="font-semibold">
                                    {p.parachevementsPerM2} €/m²
                                  </div>
                                </div>
                              )}
                              {p.purchaseDetails?.purchasePrice && (
                                <div>
                                  <span className="opacity-75">Prix d'achat:</span>
                                  <div className="font-semibold">
                                    {p.purchaseDetails.purchasePrice.toLocaleString('fr-BE')} €
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  </div>
                </div>

                {/* Insert renovation date card after this date group if needed */}
                {shouldInsertRenovationCardAfter && onRenovationStartDateChange && (
                  <div className="relative pl-20 mt-4">
                    {/* Timeline dot for renovation date */}
                    <div
                      className="absolute left-6 w-5 h-5 rounded-full border-4 bg-orange-500 border-orange-200 z-30 shadow-md"
                      style={{
                        transform: 'translateY(-50%)',
                      }}
                      title={`Début des rénovations: ${renovationStartDate ? new Date(renovationStartDate).toLocaleDateString('fr-BE') : ''}`}
                    ></div>
                    
                    {/* Draggable renovation date card */}
                    <DraggableRenovationDateCard
                      renovationStartDate={renovationStartDate || deedDate}
                      deedDate={deedDate}
                      participants={participants}
                      onDateChange={onRenovationStartDateChange}
                      canEdit={canEditRenovationStartDate}
                      isLocked={isRenovationStartDateLocked}
                      lockReason={renovationStartDateLockReason !== null ? renovationStartDateLockReason : undefined}
                    />
                  </div>
                )}
              </React.Fragment>
            );
          })}
          
          {/* Insert renovation card before first entry if needed */}
          {getRenovationCardInsertPosition === null && onRenovationStartDateChange && (
            <div className="relative pl-20">
              {/* Timeline dot for renovation date */}
              <div
                className="absolute left-6 w-5 h-5 rounded-full border-4 bg-orange-500 border-orange-200 z-30 shadow-md"
                style={{
                  transform: 'translateY(-50%)',
                }}
                title={`Début des rénovations: ${renovationStartDate ? new Date(renovationStartDate).toLocaleDateString('fr-BE') : ''}`}
              ></div>
              
              {/* Draggable renovation date card */}
              <DraggableRenovationDateCard
                renovationStartDate={renovationStartDate || deedDate}
                deedDate={deedDate}
                participants={participants}
                onDateChange={onRenovationStartDateChange}
              canEdit={canEditRenovationStartDate}
              isLocked={isRenovationStartDateLocked}
              lockReason={renovationStartDateLockReason !== null ? renovationStartDateLockReason : undefined}
              />
            </div>
          )}
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
            <span className="text-sm font-medium text-gray-700">Nouveaux·elles entrant·e·s</span>
          </div>
          <div className="text-2xl font-bold text-blue-700">
            {participants.filter(p => !p.isFounder).length}
          </div>
        </div>
      </div>
    </div>
  );
};
