import FraisGenerauxEventCard from './FraisGenerauxEventCard';
import type {
  FraisGenerauxYearlyEvent,
  NewcomerFraisGenerauxReimbursementEvent
} from '../../types/timeline';

type FraisGenerauxEvent = FraisGenerauxYearlyEvent | NewcomerFraisGenerauxReimbursementEvent;

interface FraisGenerauxLaneProps {
  allDates: Date[];
  events: FraisGenerauxEvent[];
  onOpenEventDetails: (event: FraisGenerauxEvent) => void;
}

/**
 * Timeline lane for displaying Frais Généraux events
 * Shows yearly payments and newcomer reimbursements
 */
export default function FraisGenerauxLane({
  allDates,
  events,
  onOpenEventDetails
}: FraisGenerauxLaneProps) {
  return (
    <div className="h-48 flex items-center border-b border-gray-200 swimlane-row bg-purple-25">
      {allDates.map((date, dateIdx) => {
        const dateStr = date.toISOString().split('T')[0];
        const event = events.find(
          e => e.date.toISOString().split('T')[0] === dateStr
        );

        return (
          <div key={dateIdx} className="w-56 flex-shrink-0 px-2">
            {event && (
              <FraisGenerauxEventCard
                event={event}
                colorZone={dateIdx}
                isT0={dateIdx === 0}
                onClick={() => onOpenEventDetails(event)}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
