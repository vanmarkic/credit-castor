import CoproInventoryCard from './CoproInventoryCard';

interface CoproSnapshot {
  date: Date;
  availableLots: number;
  totalSurface: number;
  soldThisDate: string[];
  reserveIncrease: number;
  colorZone: number;
}

interface CoproLaneProps {
  allDates: Date[];
  coproSnapshots: CoproSnapshot[];
}

export default function CoproLane({ allDates, coproSnapshots }: CoproLaneProps) {
  return (
    <div className="h-40 flex items-center border-b border-gray-200 swimlane-row bg-purple-50">
      {allDates.map((date, dateIdx) => {
        const dateStr = date.toISOString().split('T')[0];
        const snapshot = coproSnapshots.find(s => s.date.toISOString().split('T')[0] === dateStr);

        return (
          <div key={dateIdx} className="w-56 flex-shrink-0 px-2">
            {snapshot && (
              <CoproInventoryCard
                date={snapshot.date}
                availableLots={snapshot.availableLots}
                totalSurface={snapshot.totalSurface}
                soldThisDate={snapshot.soldThisDate}
                reserveIncrease={snapshot.reserveIncrease}
                colorZone={snapshot.colorZone}
                isT0={dateIdx === 0}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
