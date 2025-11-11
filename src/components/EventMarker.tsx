import { useState } from 'react';
import { Info } from 'lucide-react';
import type { DomainEvent } from '../types/timeline';
import { EVENT_CONFIG, COLOR_CLASSES, type EventType } from './events/eventConfig';
import { EventDetails } from './events/EventDetails';

interface EventMarkerProps {
  event: DomainEvent;
}

/**
 * Displays an event marker on the timeline
 * Uses config-based approach for icons, colors, and titles
 */
export default function EventMarker({ event }: EventMarkerProps) {
  const [showDetails, setShowDetails] = useState(false);

  // Get configuration for this event type (with fallback for unknown types)
  const config = EVENT_CONFIG[event.type as EventType] || {
    icon: Info,
    color: 'gray' as const,
    title: 'Unknown Event'
  };

  const Icon = config.icon;
  const colorClasses = COLOR_CLASSES[config.color];

  return (
    <div className="flex items-start gap-3">
      {/* Timeline connector */}
      <div className="flex flex-col items-center">
        <div className="w-px h-4 bg-gray-300" />
        <div
          className={`flex items-center justify-center w-10 h-10 rounded-full ${colorClasses.icon}`}
        >
          <Icon className="w-5 h-5" />
        </div>
        <div className="w-px h-4 bg-gray-300" />
      </div>

      {/* Event card */}
      <div className="flex-1">
        <button
          onClick={() => setShowDetails(!showDetails)}
          className={`
            w-full text-left border-2 rounded-lg p-3 transition-all
            ${colorClasses.border} ${colorClasses.bg} ${colorClasses.hover}
          `}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className={`font-semibold ${colorClasses.text}`}>{config.title}</div>
              <div className="text-xs text-gray-600 mt-1">
                {new Date(event.date).toLocaleString()}
              </div>
            </div>
            <Info
              className={`w-4 h-4 ${colorClasses.text} ${
                showDetails ? 'rotate-180' : ''
              } transition-transform`}
            />
          </div>
        </button>

        {/* Expanded details */}
        {showDetails && (
          <div className="mt-2 bg-white border border-gray-200 rounded-lg p-4 animate-fadeIn">
            <EventDetails event={event} />
          </div>
        )}
      </div>
    </div>
  );
}
