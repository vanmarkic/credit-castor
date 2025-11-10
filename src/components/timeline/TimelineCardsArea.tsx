import type { Participant } from '../../utils/calculatorUtils';
import type { TimelineTransaction } from '../../types/timeline';
import CoproLane from './CoproLane';
import ParticipantLane from './ParticipantLane';

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
  participants: Participant[];
  snapshots: Map<string, TimelineSnapshot[]>;
  onOpenParticipantDetails: (index: number) => void;
}

export default function TimelineCardsArea({
  allDates,
  coproSnapshots,
  participants,
  snapshots,
  onOpenParticipantDetails
}: TimelineCardsAreaProps) {
  return (
    <div className="flex-1 min-w-0">
      {/* Copropriété lane */}
      <CoproLane allDates={allDates} coproSnapshots={coproSnapshots} />

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
