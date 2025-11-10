import type { Participant } from '../../utils/calculatorUtils';
import type { TimelineTransaction } from '../../types/timeline';
import ParticipantFinancingCard from './ParticipantFinancingCard';

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

interface ParticipantLaneProps {
  participant: Participant;
  allDates: Date[];
  snapshots: TimelineSnapshot[];
  onOpenParticipantDetails: (index: number) => void;
}

export default function ParticipantLane({
  participant,
  allDates,
  snapshots,
  onOpenParticipantDetails
}: ParticipantLaneProps) {
  return (
    <div className="h-40 flex items-center border-b border-gray-200 swimlane-row">
      {allDates.map((date, dateIdx) => {
        const dateStr = date.toISOString().split('T')[0];
        const snapshot = snapshots.find(s => s.date.toISOString().split('T')[0] === dateStr);

        return (
          <div key={dateIdx} className="w-56 flex-shrink-0 px-2">
            {snapshot && (
              <ParticipantFinancingCard
                date={snapshot.date}
                totalCost={snapshot.totalCost}
                loanNeeded={snapshot.loanNeeded}
                monthlyPayment={snapshot.monthlyPayment}
                isT0={snapshot.isT0}
                isFounder={participant.isFounder === true}
                colorZone={snapshot.colorZone}
                transaction={snapshot.transaction}
                onClick={() => onOpenParticipantDetails(snapshot.participantIndex)}
                showFinancingDetails={snapshot.showFinancingDetails}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
