import { useMemo } from 'react';
import { Users } from 'lucide-react';
import type { Participant, CalculationResults, ProjectParams, PortageFormulaParams } from '../utils/calculatorUtils';
import { DEFAULT_PORTAGE_FORMULA } from '../utils/calculatorUtils';
import type { TimelineTransaction } from '../types/timeline';
import { calculatePortageTransaction, calculateCooproTransaction } from '../utils/transactionCalculations';
import { formatCurrency } from '../utils/formatting';

interface TimelineSnapshot {
  date: Date;
  participantName: string;
  participantIndex: number;
  totalCost: number;
  loanNeeded: number;
  monthlyPayment: number;
  isT0: boolean;
  colorZone: number; // Index for color-coding related events
  transaction?: TimelineTransaction;
}

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
  // Helper to get background color for color zones
  const getZoneBackgroundClass = (zoneIndex: number, isT0: boolean, _isFounder: boolean) => {
    if (isT0) {
      return 'bg-green-50';
    }

    // Alternate subtle background colors for different zones
    const colors = [
      'bg-blue-50',
      'bg-purple-50',
      'bg-indigo-50',
      'bg-cyan-50',
      'bg-teal-50'
    ];

    return colors[zoneIndex % colors.length];
  };

  // Generate copropriété snapshots - ONLY show cards when copro inventory changes
  const coproSnapshots = useMemo(() => {
    const snapshots: Array<{
      date: Date;
      availableLots: number;
      totalSurface: number;
      soldThisDate: string[];
      colorZone: number;
    }> = [];

    const dates = [...new Set(participants.map(p =>
      p.entryDate ? new Date(p.entryDate).toISOString().split('T')[0] : deedDate
    ))].sort();

    let previousLots = 0;
    let previousSurface = 0;

    dates.forEach((dateStr, idx) => {
      const date = new Date(dateStr);

      // Find participants who joined from copro at this date
      const joinedFromCopro = participants.filter(p => {
        const pEntryDate = p.entryDate ? new Date(p.entryDate) : new Date(deedDate);
        return pEntryDate.toISOString().split('T')[0] === dateStr
          && p.purchaseDetails?.buyingFrom === 'Copropriété';
      });

      // Calculate remaining lots/surface (simplified - assuming total of all participant units)
      const soldLots = participants.filter(p => {
        const pEntryDate = p.entryDate ? new Date(p.entryDate) : new Date(deedDate);
        return pEntryDate <= date && p.purchaseDetails?.buyingFrom === 'Copropriété';
      }).length;

      const soldSurface = participants
        .filter(p => {
          const pEntryDate = p.entryDate ? new Date(p.entryDate) : new Date(deedDate);
          return pEntryDate <= date && p.purchaseDetails?.buyingFrom === 'Copropriété';
        })
        .reduce((sum, p) => sum + (p.surface || 0), 0);

      const availableLots = Math.max(0, participants.length - soldLots);
      const totalSurface = calculations.totalSurface - soldSurface;

      // Only add snapshot if copro inventory changed or it's T0
      if (idx === 0 || availableLots !== previousLots || totalSurface !== previousSurface) {
        snapshots.push({
          date,
          availableLots,
          totalSurface,
          soldThisDate: joinedFromCopro.map(p => p.name),
          colorZone: idx
        });

        previousLots = availableLots;
        previousSurface = totalSurface;
      }
    });

    return snapshots;
  }, [participants, calculations, deedDate]);

  // Get all unique dates sorted
  const allDates = useMemo(() => {
    const dates = [...new Set(participants.map(p =>
      p.entryDate ? new Date(p.entryDate).toISOString().split('T')[0] : deedDate
    ))].sort();
    return dates.map(d => new Date(d));
  }, [participants, deedDate]);

  // Generate snapshots from participants - showing ALL participants at each moment
  const snapshots = useMemo(() => {
    const result: Map<string, TimelineSnapshot[]> = new Map();
    const previousSnapshots: Map<string, TimelineSnapshot> = new Map();

    // Get unique dates sorted
    const dates = [...new Set(participants.map(p =>
      p.entryDate ? new Date(p.entryDate).toISOString().split('T')[0] : deedDate
    ))].sort();

    // For each date, create snapshots ONLY for affected participants
    dates.forEach((dateStr, dateIdx) => {
      const date = new Date(dateStr);

      // Find participants who joined at this exact date
      const joiningParticipants = participants.filter(p => {
        const pEntryDate = p.entryDate ? new Date(p.entryDate) : new Date(deedDate);
        return pEntryDate.toISOString().split('T')[0] === dateStr;
      });

      // Determine who is affected at this moment
      let affectedParticipants: Participant[];

      if (dateIdx === 0) {
        // T0: All founders get cards
        affectedParticipants = joiningParticipants.filter(p => p.isFounder);
      } else {
        // Later events: only show affected participants
        affectedParticipants = [];

        joiningParticipants.forEach(newcomer => {
          // Add the newcomer
          affectedParticipants.push(newcomer);

          if (newcomer.purchaseDetails?.buyingFrom === 'Copropriété') {
            // Copro sale: ALL active participants are affected (shared costs redistribute)
            const allActive = participants.filter(p => {
              const pEntryDate = p.entryDate ? new Date(p.entryDate) : new Date(deedDate);
              return pEntryDate < date; // Active before this date
            });
            affectedParticipants.push(...allActive);
          } else if (newcomer.purchaseDetails?.buyingFrom) {
            // Portage sale: only buyer and seller affected
            const seller = participants.find(p => p.name === newcomer.purchaseDetails!.buyingFrom);
            if (seller) {
              affectedParticipants.push(seller);
            }
          }
        });

        // Remove duplicates
        affectedParticipants = Array.from(new Set(affectedParticipants));
      }

      // Create snapshots for affected participants
      affectedParticipants.forEach((p) => {
        const pIdx = participants.indexOf(p);
        const breakdown = calculations.participantBreakdown[pIdx];

        if (!breakdown) return;

        // Detect if participant is involved in a transaction
        let transaction: TimelineTransaction | undefined;

        // Check if selling portage lot
        const isSeller = joiningParticipants.some(np =>
          np.purchaseDetails?.buyingFrom === p.name
        );

        // Check if buying portage lot
        const isBuyer = joiningParticipants.includes(p) &&
          p.purchaseDetails?.buyingFrom &&
          p.purchaseDetails.buyingFrom !== 'Copropriété';

        // Check if affected by copro sale
        const coproSale = joiningParticipants.find(np =>
          np.purchaseDetails?.buyingFrom === 'Copropriété'
        );

        // Use default portage formula params (could be passed as prop in future)
        const formulaParams: PortageFormulaParams = DEFAULT_PORTAGE_FORMULA;

        if (isSeller) {
          const buyer = joiningParticipants.find(np => np.purchaseDetails?.buyingFrom === p.name);
          if (buyer) {
            const buyerIdx = participants.indexOf(buyer);
            const buyerBreakdown = calculations.participantBreakdown[buyerIdx];
            const sellerEntryDate = p.entryDate ? new Date(p.entryDate) : new Date(deedDate);

            if (buyerBreakdown) {
              transaction = calculatePortageTransaction(
                p,
                buyer,
                date,
                breakdown,
                buyerBreakdown,
                sellerEntryDate,
                formulaParams,
                participants.length
              );
            }
          }
        } else if (isBuyer) {
          const seller = participants.find(ps => ps.name === p.purchaseDetails?.buyingFrom);
          if (seller) {
            const sellerIdx = participants.indexOf(seller);
            const sellerBreakdown = calculations.participantBreakdown[sellerIdx];
            const sellerEntryDate = seller.entryDate ? new Date(seller.entryDate) : new Date(deedDate);

            if (sellerBreakdown) {
              transaction = calculatePortageTransaction(
                seller,
                p,
                date,
                sellerBreakdown,
                breakdown,
                sellerEntryDate,
                formulaParams,
                participants.length
              );
            }
          }
        } else if (coproSale) {
          const prevSnapshot = previousSnapshots.get(p.name);
          if (prevSnapshot) {
            transaction = calculateCooproTransaction(
              p,
              coproSale,
              prevSnapshot,
              participants.length
            );
          }
        }

        const snapshot: TimelineSnapshot = {
          date,
          participantName: p.name,
          participantIndex: pIdx,
          totalCost: breakdown.totalCost,
          loanNeeded: breakdown.loanNeeded,
          monthlyPayment: breakdown.monthlyPayment,
          isT0: dateIdx === 0 && (p.isFounder === true),
          colorZone: dateIdx, // Each date gets its own color zone
          transaction
        };

        if (!result.has(p.name)) {
          result.set(p.name, []);
        }
        result.get(p.name)!.push(snapshot);

        // Store for next iteration
        previousSnapshots.set(p.name, snapshot);
      });
    });

    return result;
  }, [participants, calculations, deedDate]);

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">💳 Besoins de Financement Individuels</h2>
          <p className="text-sm text-gray-600 mt-1">
            Visualisez l'évolution des besoins de financement au fil du temps
          </p>
        </div>
        <button
          onClick={onAddParticipant}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded-lg transition-colors flex items-center gap-2"
        >
          <Users className="w-5 h-5" />
          Ajouter un·e participant·e
        </button>
      </div>

      <div className="flex overflow-x-auto">
        {/* Sticky name column */}
        <div className="flex-shrink-0 w-48 pr-4">
          {/* Copropriété row */}
          <div className="h-40 flex items-center border-b border-gray-200 swimlane-row bg-purple-50">
            <div className="font-semibold text-purple-800">La Copropriété</div>
          </div>

          {/* Participant rows */}
          {participants.map((p, idx) => (
            <div
              key={idx}
              className="h-40 flex items-center border-b border-gray-200 swimlane-row"
            >
              <div className="font-semibold text-gray-800">{p.name}</div>
            </div>
          ))}
        </div>

        {/* Timeline cards area - column-based layout */}
        <div className="flex-1 min-w-0">
          {/* Copropriété lane */}
          <div className="h-40 flex items-center border-b border-gray-200 swimlane-row bg-purple-50">
            {allDates.map((date, dateIdx) => {
              const dateStr = date.toISOString().split('T')[0];
              const snapshot = coproSnapshots.find(s => s.date.toISOString().split('T')[0] === dateStr);

              return (
                <div key={dateIdx} className="w-56 flex-shrink-0 px-2">
                  {snapshot && (
                    <div
                      className={`
                        w-full p-4 rounded-lg border-2 border-purple-300 transition-shadow hover:shadow-md
                        ${getZoneBackgroundClass(snapshot.colorZone, dateIdx === 0, false)}
                      `}
                    >
                      <div className="text-xs text-gray-500 mb-2">
                        {snapshot.date.toLocaleDateString('fr-BE')}
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-purple-600">Lots disponibles</span>
                          <span className="text-sm font-bold text-purple-800">
                            {snapshot.availableLots}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-purple-600">Surface totale</span>
                          <span className="text-sm font-bold text-purple-800">
                            {snapshot.totalSurface}m²
                          </span>
                        </div>
                      </div>

                      {snapshot.soldThisDate.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-purple-200">
                          <div className="text-xs font-semibold text-red-700">
                            📉 Vendu à {snapshot.soldThisDate.join(', ')}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Participant lanes */}
          {participants.map((p, idx) => {
            const participantSnapshots = snapshots.get(p.name) || [];

            return (
              <div
                key={idx}
                className="h-70 flex items-center border-b border-gray-200 swimlane-row"
              >
                {allDates.map((date, dateIdx) => {
                  const dateStr = date.toISOString().split('T')[0];
                  const snapshot = participantSnapshots.find(s => s.date.toISOString().split('T')[0] === dateStr);

                  return (
                    <div key={dateIdx} className="w-56 flex-shrink-0 px-2">
                      {snapshot && (
                        <div
                          className={`
                            w-full p-4 rounded-lg border-2 transition-shadow hover:shadow-md cursor-pointer
                            ${snapshot.isT0 ? 'timeline-card-t0' : ''}
                            ${getZoneBackgroundClass(snapshot.colorZone, snapshot.isT0, p.isFounder === true)}
                            ${snapshot.isT0
                              ? 'border-green-300'
                              : p.isFounder ? 'border-green-200' : 'border-blue-200'
                            }
                          `}
                          onClick={() => {
                            onOpenParticipantDetails(snapshot.participantIndex);
                          }}
                        >
                          <div className="text-xs text-gray-500 mb-2">
                            {snapshot.date.toLocaleDateString('fr-BE')}
                          </div>
                          <div className="space-y-1">
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-gray-600">Coût Total</span>
                              <span className="text-sm font-bold text-gray-900">
                                {formatCurrency(snapshot.totalCost)}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-gray-600">À emprunter</span>
                              <span className="text-sm font-bold text-red-700">
                                {formatCurrency(snapshot.loanNeeded)}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-gray-600">Mensualité</span>
                              <span className="text-sm font-bold text-red-600">
                                {formatCurrency(snapshot.monthlyPayment)}
                              </span>
                            </div>
                          </div>

                          {snapshot.isT0 && (
                            <div className="mt-2 text-xs text-green-700 font-medium">
                              Cliquer pour détails →
                            </div>
                          )}

                          {snapshot.transaction && (
                            <div className="mt-2 pt-2 border-t border-current border-opacity-20">
                              <div className={`text-xs font-semibold ${
                                snapshot.transaction.delta.totalCost < 0 ? 'text-green-700' : 'text-red-700'
                              }`}>
                                {snapshot.transaction.delta.totalCost < 0 ? '📉' : '📈'}{' '}
                                {formatCurrency(Math.abs(snapshot.transaction.delta.totalCost))}
                              </div>
                              <div className="text-xs text-gray-600 mt-1">
                                {snapshot.transaction.delta.reason}
                              </div>
                              {snapshot.transaction.lotPrice && (
                                <div className="text-xs text-gray-500 mt-1">
                                  Lot price: {formatCurrency(snapshot.transaction.lotPrice)}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
