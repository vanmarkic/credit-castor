/**
 * TimelineVisualization Component (Phase 4.2)
 *
 * Horizontal timeline visualization from deed date (T0)
 * Shows all project events chronologically
 */

import React, { useState } from 'react';
import type { DomainEvent } from '../types/timeline';
import { calculateMonthsBetween } from '../utils/coproRedistribution';

interface TimelineVisualizationProps {
  deedDate: Date;
  events: DomainEvent[];
  currentDate?: Date;
}

export default function TimelineVisualization({
  deedDate,
  events,
  currentDate = new Date(),
}: TimelineVisualizationProps) {
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);

  // Calculate timeline span in months
  const latestDate = new Date(Math.max(currentDate.getTime(), ...events.map(e => e.date.getTime())));
  const totalMonths = Math.ceil(calculateMonthsBetween(deedDate, latestDate));

  // Calculate position for each event
  const eventPositions = events.map(event => ({
    event,
    monthsFromDeed: calculateMonthsBetween(deedDate, event.date),
    percentage: (calculateMonthsBetween(deedDate, event.date) / totalMonths) * 100,
  }));

  // Current position
  const nowPercentage = (calculateMonthsBetween(deedDate, currentDate) / totalMonths) * 100;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h2 className="text-xl font-bold mb-4">Project Timeline</h2>

      {/* Timeline header */}
      <div className="mb-6">
        <div className="text-sm text-gray-600">
          Timeline from <span className="font-semibold">T0 (Deed Date)</span> to present
        </div>
        <div className="text-xs text-gray-500">
          {formatDate(deedDate)} → {formatDate(currentDate)} ({totalMonths} months)
        </div>
      </div>

      {/* Horizontal timeline */}
      <div className="relative">
        {/* Timeline bar */}
        <div className="h-2 bg-gray-200 rounded-full relative overflow-visible">
          {/* T0 marker (Deed Date) */}
          <div className="absolute -left-1 -top-3 flex flex-col items-center">
            <div className="w-6 h-6 bg-green-500 border-4 border-white rounded-full shadow-lg" />
            <div className="mt-2 text-xs font-semibold text-green-700">T0</div>
            <div className="text-xs text-gray-600">{formatDateShort(deedDate)}</div>
          </div>

          {/* Event markers */}
          {eventPositions.map(({ event, percentage, monthsFromDeed }) => (
            <div
              key={event.id}
              className="absolute -top-3"
              style={{ left: `${percentage}%` }}
            >
              <button
                onClick={() => setSelectedEvent(event.id)}
                className={`w-6 h-6 rounded-full border-4 border-white shadow-lg transition-all ${
                  selectedEvent === event.id
                    ? 'bg-blue-600 scale-125'
                    : getEventColor(event.type)
                } hover:scale-110`}
                title={`${event.type} (Month ${monthsFromDeed})`}
              />
              {selectedEvent === event.id && (
                <div className="absolute top-8 left-1/2 -translate-x-1/2 bg-white border border-gray-300 rounded-lg shadow-xl p-4 w-64 z-10">
                  <div className="text-sm font-semibold mb-2">{formatEventType(event.type)}</div>
                  <div className="text-xs text-gray-600 mb-1">
                    {formatDate(event.date)}
                  </div>
                  <div className="text-xs text-gray-500">
                    Month {monthsFromDeed} from deed date
                  </div>
                  {renderEventDetails(event)}
                </div>
              )}
            </div>
          ))}

          {/* Now marker */}
          {nowPercentage <= 100 && (
            <div
              className="absolute -top-3"
              style={{ left: `${nowPercentage}%` }}
            >
              <div className="w-6 h-6 bg-orange-500 border-4 border-white rounded-full shadow-lg animate-pulse" />
              <div className="mt-2 text-xs font-semibold text-orange-700 whitespace-nowrap">
                Now
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-8 flex flex-wrap gap-4 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-500 rounded-full" />
          <span>Deed Date (T0)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-500 rounded-full" />
          <span>Purchase</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-purple-500 rounded-full" />
          <span>Sale</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-yellow-500 rounded-full" />
          <span>Hidden Lot</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-orange-500 rounded-full" />
          <span>Current Date</span>
        </div>
      </div>
    </div>
  );
}

// ============================================
// Helper Functions
// ============================================

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-BE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function formatDateShort(date: Date): string {
  return date.toLocaleDateString('en-BE', {
    month: 'short',
    year: 'numeric',
  });
}

function getEventColor(type: string): string {
  switch (type) {
    case 'INITIAL_PURCHASE':
      return 'bg-blue-500';
    case 'NEWCOMER_JOINS':
      return 'bg-blue-400';
    case 'HIDDEN_LOT_REVEALED':
      return 'bg-yellow-500';
    case 'PARTICIPANT_EXITS':
      return 'bg-purple-500';
    case 'PORTAGE_SETTLEMENT':
      return 'bg-purple-400';
    case 'COPRO_TAKES_LOAN':
      return 'bg-red-500';
    default:
      return 'bg-gray-500';
  }
}

function formatEventType(type: string): string {
  return type
    .split('_')
    .map(word => word.charAt(0) + word.slice(1).toLowerCase())
    .join(' ');
}

function renderEventDetails(event: DomainEvent): React.ReactElement | null {
  switch (event.type) {
    case 'INITIAL_PURCHASE':
      return (
        <div className="mt-2 text-xs">
          <div className="font-semibold text-gray-700">Founders:</div>
          <ul className="list-disc list-inside text-gray-600">
            {event.participants.map(p => (
              <li key={p.name}>{p.name}</li>
            ))}
          </ul>
        </div>
      );

    case 'NEWCOMER_JOINS':
      return (
        <div className="mt-2 text-xs text-gray-600">
          <div>{event.buyer.name} bought from {event.acquisition.from}</div>
          <div>Price: €{event.acquisition.purchasePrice.toLocaleString()}</div>
        </div>
      );

    case 'HIDDEN_LOT_REVEALED':
      return (
        <div className="mt-2 text-xs text-gray-600">
          <div>Lot #{event.lotId} sold to {event.buyer.name}</div>
          <div>Price: €{event.salePrice.toLocaleString()}</div>
        </div>
      );

    case 'PARTICIPANT_EXITS':
      return (
        <div className="mt-2 text-xs text-gray-600">
          <div>{event.participant} exited</div>
          <div>Lot #{event.lotId} sold for €{event.salePrice.toLocaleString()}</div>
        </div>
      );

    default:
      return null;
  }
}
