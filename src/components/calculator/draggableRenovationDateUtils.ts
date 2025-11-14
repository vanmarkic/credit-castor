import type { Participant } from '../../utils/calculatorUtils';

/**
 * Safely converts a date value to an ISO date string (YYYY-MM-DD).
 */
function safeToISODateString(dateValue: string | Date | null | undefined, fallback: string): string {
  if (!dateValue) return fallback;
  const date = dateValue instanceof Date ? dateValue : new Date(dateValue);
  if (isNaN(date.getTime())) return fallback;
  return date.toISOString().split('T')[0];
}

/**
 * Add days to an ISO date string
 */
function addDaysToDateString(dateString: string, days: number): string {
  const date = new Date(dateString);
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
}

/**
 * Get all unique dates from participants, sorted chronologically
 */
export function getSortedParticipantDates(
  participants: Participant[],
  deedDate: string
): string[] {
  const fallbackNonFounder = addDaysToDateString(deedDate, 1);
  const dates = [
    ...new Set(
      participants.map(p => {
        const fallback = p.isFounder ? deedDate : fallbackNonFounder;
        return safeToISODateString(p.entryDate, fallback);
      })
    )
  ].sort();
  return dates;
}

/**
 * Get date entries with their top and bottom Y positions from timeline DOM
 * 
 * @param timelineContainer - Timeline container element
 * @param participants - Array of participants
 * @param deedDate - Deed date
 * @returns Array of date entries with top and bottom positions
 */
export function getDateEntriesFromTimeline(
  timelineContainer: HTMLElement | null,
  participants: Participant[],
  deedDate: string
): Array<{ date: string; y: number; top: number; bottom: number }> {
  if (!timelineContainer) return [];
  
  const sortedDates = getSortedParticipantDates(participants, deedDate);
  const entries: Array<{ date: string; y: number; top: number; bottom: number }> = [];
  const containerRect = timelineContainer.getBoundingClientRect();
  
  // Find each date entry in the DOM
  sortedDates.forEach(date => {
    const dateElement = Array.from(timelineContainer.querySelectorAll('[data-timeline-date]')).find(
      el => el.getAttribute('data-timeline-date') === date
    );
    
    if (dateElement) {
      // Find the parent container that holds both date label and participant cards
      const dateContainer = dateElement.closest('.relative.pl-20') as HTMLElement;
      
      if (dateContainer) {
        const dateContainerRect = dateContainer.getBoundingClientRect();
        const top = dateContainerRect.top - containerRect.top;
        const bottom = dateContainerRect.bottom - containerRect.top;
        // Position at the bottom of the entire date entry (including participant cards)
        // Relative to the timeline container
        entries.push({
          date,
          y: bottom, // Keep y for backward compatibility (bottom position)
          top,
          bottom
        });
      } else {
        // Fallback: use date label position + estimated card height
        const rect = dateElement.getBoundingClientRect();
        const top = rect.top - containerRect.top;
        const bottom = top + rect.height + 100; // Space for participant cards
        entries.push({
          date,
          y: bottom,
          top,
          bottom
        });
      }
    }
  });
  
  return entries;
}

