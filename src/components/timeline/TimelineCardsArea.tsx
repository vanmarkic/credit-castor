import type { Participant } from '../../utils/calculatorUtils';
import type {
  TimelineTransaction,
  FraisGenerauxYearlyEvent,
  NewcomerFraisGenerauxReimbursementEvent
} from '../../types/timeline';
import CoproLane from './CoproLane';
import FraisGenerauxLane from './FraisGenerauxLane';
import ParticipantLane from './ParticipantLane';

type FraisGenerauxEvent = FraisGenerauxYearlyEvent | NewcomerFraisGenerauxReimbursementEvent;

interface CoproSnapshot {
  date: Date;
  availableLots: number;
  totalSurface: number;
  soldThisDate: string[];
  reserveIncrease: number;
  colorZone: number;
}

interface TimelineSnapshot {
  date: Date;
  participantName: string;
  participantIndex: number;
  totalCost: number;
  loanNeeded: number;
  monthlyPayment: number;
  isT0: boolean;
  colorZone: number;
  transaction?: TimelineTransaction;
  showFinancingDetails: boolean;
}

interface TimelineCardsAreaProps {
  allDates: Date[];
  coproSnapshots: CoproSnapshot[];
  fraisGenerauxEvents: FraisGenerauxEvent[];
  participants: Participant[];
  snapshots: Map<string, TimelineSnapshot[]>;
  onOpenParticipantDetails: (index: number) => void;
  onOpenCoproDetails: (snapshot: CoproSnapshot) => void;
  onOpenFraisGenerauxDetails: (event: FraisGenerauxEvent) => void;
  coproReservesShare: number;
}

export default function TimelineCardsArea({
  allDates,
  coproSnapshots,
  fraisGenerauxEvents,
  participants,
  snapshots,
  onOpenParticipantDetails,
  onOpenCoproDetails,
  onOpenFraisGenerauxDetails,
  coproReservesShare
}: TimelineCardsAreaProps) {
  return (
    <div className="flex-1 min-w-0">
      {/* Copropriété lane */}
      <CoproLane
        allDates={allDates}
        coproSnapshots={coproSnapshots}
        coproReservesShare={coproReservesShare}
        onOpenCoproDetails={onOpenCoproDetails}
      />

      {/* Frais Généraux lane */}
      <FraisGenerauxLane
        allDates={allDates}
        events={fraisGenerauxEvents}
        onOpenEventDetails={onOpenFraisGenerauxDetails}
      />

      {/* Participant lanes */}
      {participants.map((p, idx) => {
        const participantSnapshots = snapshots.get(p.name) || [];

        return (
          <ParticipantLane
            key={idx}
            participant={p}
            allDates={allDates}
            snapshots={participantSnapshots}
            onOpenParticipantDetails={onOpenParticipantDetails}
          />
        );
      })}
    </div>
  );
}
