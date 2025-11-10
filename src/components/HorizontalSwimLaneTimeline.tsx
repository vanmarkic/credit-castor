import { useMemo } from 'react';
import type { Participant, CalculationResults, ProjectParams } from '../utils/calculatorUtils';
import { DEFAULT_PORTAGE_FORMULA } from '../utils/calculatorUtils';
import {
  getUniqueSortedDates,
  generateCoproSnapshots,
  generateParticipantSnapshots
} from '../utils/timelineCalculations';
import TimelineHeader from './timeline/TimelineHeader';
import TimelineNameColumn from './timeline/TimelineNameColumn';
import TimelineCardsArea from './timeline/TimelineCardsArea';

interface HorizontalSwimLaneTimelineProps {
  participants: Participant[];
  projectParams: ProjectParams;
  calculations: CalculationResults;
  deedDate: string;
  onOpenParticipantDetails: (index: number) => void;
  onAddParticipant: () => void;
}

export default function HorizontalSwimLaneTimeline({
  participants,
  calculations,
  deedDate,
  onOpenParticipantDetails,
  onAddParticipant
}: HorizontalSwimLaneTimelineProps) {

  // Generate copropriété snapshots - ONLY show cards when copro inventory changes
  const coproSnapshots = useMemo(() => {
    return generateCoproSnapshots(participants, calculations, deedDate);
  }, [participants, calculations, deedDate]);

  // Get all unique dates sorted
  const allDates = useMemo(() => {
    return getUniqueSortedDates(participants, deedDate);
  }, [participants, deedDate]);

  // Generate snapshots from participants - showing ALL participants at each moment
  const snapshots = useMemo(() => {
    return generateParticipantSnapshots(
      participants,
      calculations,
      deedDate,
      DEFAULT_PORTAGE_FORMULA
    );
  }, [participants, calculations, deedDate]);

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
      <TimelineHeader onAddParticipant={onAddParticipant} />

      <div className="flex overflow-x-auto">
        <TimelineNameColumn participants={participants} />
        <TimelineCardsArea
          allDates={allDates}
          coproSnapshots={coproSnapshots}
          participants={participants}
          snapshots={snapshots}
          onOpenParticipantDetails={onOpenParticipantDetails}
        />
      </div>
    </div>
  );
}
