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

interface CoproSnapshot {
  date: Date;
  availableLots: number;
  totalSurface: number;
  soldThisDate: string[];
  reserveIncrease: number;
  colorZone: number;
}

interface HorizontalSwimLaneTimelineProps {
  participants: Participant[];
  projectParams: ProjectParams;
  calculations: CalculationResults;
  deedDate: string;
  onOpenParticipantDetails: (index: number) => void;
  onOpenCoproDetails: (snapshot: CoproSnapshot) => void;
  onAddParticipant: () => void;
  coproReservesShare?: number;
}

export default function HorizontalSwimLaneTimeline({
  participants,
  calculations,
  deedDate,
  onOpenParticipantDetails,
  onOpenCoproDetails,
  onAddParticipant,
  coproReservesShare = DEFAULT_PORTAGE_FORMULA.coproReservesShare
}: HorizontalSwimLaneTimelineProps) {

  // Generate copropriété snapshots - ONLY show cards when copro inventory changes
  const coproSnapshots = useMemo(() => {
    return generateCoproSnapshots(participants, calculations, deedDate, coproReservesShare);
  }, [participants, calculations, deedDate, coproReservesShare]);

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
      { ...DEFAULT_PORTAGE_FORMULA, coproReservesShare }
    );
  }, [participants, calculations, deedDate, coproReservesShare]);

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
          onOpenCoproDetails={onOpenCoproDetails}
          coproReservesShare={coproReservesShare}
        />
      </div>
    </div>
  );
}
