import type { DomainEvent, NewcomerJoinsEvent, HiddenLotRevealedEvent } from '../../types/timeline';
import { NewcomerJoinsDetails } from './NewcomerJoinsDetails';
import { HiddenLotRevealedDetails } from './HiddenLotRevealedDetails';

interface EventDetailsProps {
  event: DomainEvent;
}

/**
 * Routes to the appropriate event detail component based on event type
 */
export function EventDetails({ event }: EventDetailsProps) {
  switch (event.type) {
    case 'NEWCOMER_JOINS':
      return <NewcomerJoinsDetails event={event as NewcomerJoinsEvent} />;

    case 'HIDDEN_LOT_REVEALED':
      return <HiddenLotRevealedDetails event={event as HiddenLotRevealedEvent} />;

    default:
      return (
        <div className="text-sm text-gray-600">
          Event details not implemented for {event.type}
        </div>
      );
  }
}
