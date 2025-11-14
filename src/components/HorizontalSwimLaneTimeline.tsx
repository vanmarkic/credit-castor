import { useMemo, useState } from 'react';
import type { Participant, CalculationResults, ProjectParams, UnitDetails } from '../utils/calculatorUtils';
import { DEFAULT_PORTAGE_FORMULA } from '../utils/calculatorUtils';
import {
  getUniqueSortedDates,
  generateCoproSnapshots,
  generateParticipantSnapshots
} from '../utils/timelineCalculations';
import { generateAllFraisGenerauxEvents } from '../utils/fraisGenerauxYearly';
import type {
  FraisGenerauxYearlyEvent,
  NewcomerFraisGenerauxReimbursementEvent
} from '../types/timeline';
import TimelineHeader from './timeline/TimelineHeader';
import TimelineNameColumn from './timeline/TimelineNameColumn';
import TimelineCardsArea from './timeline/TimelineCardsArea';
import FraisGenerauxDetailModal from './calculator/FraisGenerauxDetailModal';

type FraisGenerauxEvent = FraisGenerauxYearlyEvent | NewcomerFraisGenerauxReimbursementEvent;

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
  onUpdateParticipant: (index: number, updated: Participant) => void;
  coproReservesShare?: number;
  unitDetails?: UnitDetails;
}

export default function HorizontalSwimLaneTimeline({
  participants,
  projectParams,
  calculations,
  deedDate,
  onOpenParticipantDetails,
  onOpenCoproDetails,
  onAddParticipant,
  onUpdateParticipant,
  coproReservesShare = DEFAULT_PORTAGE_FORMULA.coproReservesShare,
  unitDetails = {}
}: HorizontalSwimLaneTimelineProps) {
  // Frais Généraux modal state
  const [fraisGenerauxEvent, setFraisGenerauxEvent] = useState<FraisGenerauxEvent | null>(null);

  // Generate copropriété snapshots - ONLY show cards when copro inventory changes
  const coproSnapshots = useMemo(() => {
    return generateCoproSnapshots(participants, calculations, deedDate, coproReservesShare, projectParams);
  }, [participants, calculations, deedDate, coproReservesShare, projectParams]);

  // Generate frais généraux events
  const fraisGenerauxEvents = useMemo(() => {
    return generateAllFraisGenerauxEvents(
      participants,
      projectParams,
      unitDetails,
      new Date(deedDate)
    );
  }, [participants, projectParams, unitDetails, deedDate]);

  // Get all unique dates sorted (include frais généraux event dates)
  const allDates = useMemo(() => {
    const participantDates = getUniqueSortedDates(participants, deedDate);
    const fraisGenerauxDates = fraisGenerauxEvents.map(e => e.date);
    const allUniqueDates = [...participantDates, ...fraisGenerauxDates];

    // Deduplicate and sort
    const uniqueDateStrings = new Set(allUniqueDates.map(d => d.toISOString().split('T')[0]));
    return Array.from(uniqueDateStrings)
      .map(dateStr => new Date(dateStr))
      .sort((a, b) => a.getTime() - b.getTime());
  }, [participants, deedDate, fraisGenerauxEvents]);

  // Generate snapshots from participants - showing ALL participants at each moment
  const snapshots = useMemo(() => {
    return generateParticipantSnapshots(
      participants,
      calculations,
      deedDate,
      { ...DEFAULT_PORTAGE_FORMULA, coproReservesShare },
      projectParams
    );
  }, [participants, calculations, deedDate, coproReservesShare, projectParams]);

  return (
    <>
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <TimelineHeader onAddParticipant={onAddParticipant} />

        <div className="flex overflow-x-auto">
          <TimelineNameColumn participants={participants} onUpdateParticipant={onUpdateParticipant} />
          <TimelineCardsArea
            allDates={allDates}
            coproSnapshots={coproSnapshots}
            fraisGenerauxEvents={fraisGenerauxEvents}
            participants={participants}
            snapshots={snapshots}
            onOpenParticipantDetails={onOpenParticipantDetails}
            onOpenCoproDetails={onOpenCoproDetails}
            onOpenFraisGenerauxDetails={setFraisGenerauxEvent}
            coproReservesShare={coproReservesShare}
          />
        </div>
      </div>

      {/* Frais Généraux Detail Modal */}
      {fraisGenerauxEvent && (
        <FraisGenerauxDetailModal
          event={fraisGenerauxEvent}
          onClose={() => setFraisGenerauxEvent(null)}
        />
      )}
    </>
  );
}
