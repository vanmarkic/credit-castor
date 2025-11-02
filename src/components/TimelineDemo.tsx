import TimelineView from './TimelineView';
import { projectTimeline } from '../utils/chronologyCalculations';
import type { InitialPurchaseEvent } from '../types/timeline';

/**
 * Demo component showcasing timeline visualization with test data
 * Uses the same test helpers from chronologyCalculations.test.ts
 */
export default function TimelineDemo() {
  // Create test data
  const initialEvent: InitialPurchaseEvent = {
    id: 'evt_001',
    type: 'INITIAL_PURCHASE',
    date: new Date('2025-01-15T10:00:00Z'),
    participants: [
      {
        name: 'Buyer A',
        surface: 112,
        unitId: 1,
        capitalApporte: 50000,
        notaryFeesRate: 3,
        interestRate: 4.5,
        durationYears: 25,
        parachevementsPerM2: 500
      },
      {
        name: 'Buyer B',
        surface: 134,
        unitId: 2,
        capitalApporte: 170000,
        notaryFeesRate: 12.5,
        interestRate: 4.5,
        durationYears: 25,
        parachevementsPerM2: 500
      }
    ],
    projectParams: {
      totalPurchase: 650000,
      mesuresConservatoires: 20000,
      demolition: 40000,
      infrastructures: 90000,
      etudesPreparatoires: 59820,
      fraisEtudesPreparatoires: 27320,
      fraisGeneraux3ans: 0,
      batimentFondationConservatoire: 43700,
      batimentFondationComplete: 269200,
      batimentCoproConservatoire: 56000,
      globalCascoPerM2: 1590
    },
    scenario: {
      constructionCostChange: 0,
      infrastructureReduction: 0,
      purchasePriceReduction: 0
    },
    copropropriete: {
      name: 'Copropriété Ferme du Temple',
      hiddenLots: [5, 6]
    }
  };

  // Commented out for now due to cash flow calculation bug
  // const newcomerEvent: NewcomerJoinsEvent = { ... };
  // const hiddenLotEvent: HiddenLotRevealedEvent = { ... };

  const unitDetails = {
    1: { casco: 178080, parachevements: 56000 },
    2: { casco: 213060, parachevements: 67000 },
    5: { casco: 159000, parachevements: 50000 }
  };

  // Project timeline from events
  // NOTE: Currently only using single event due to bug in chronologyCalculations
  // TODO: Fix cash flow calculation bug and then use: [initialEvent, newcomerEvent, hiddenLotEvent]
  const events = [initialEvent];
  const phases = projectTimeline(events, unitDetails);

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Timeline Visualization Demo
          </h1>
          <p className="text-gray-600">
            Interactive timeline showing project phases and events using test data from the event sourcing system.
          </p>
        </div>

        {/* Timeline */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <TimelineView phases={phases} />
        </div>

        {/* Info Panel */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-3">Demo Information</h3>
          <div className="space-y-2 text-sm text-blue-800">
            <p>
              <strong>Events:</strong> {events.length} events in timeline
            </p>
            <p>
              <strong>Phases:</strong> {phases.length} phases generated
            </p>
            <p>
              <strong>Features:</strong> Click on phases to expand details, click on event markers to see transaction breakdowns
            </p>
            <p>
              <strong>Data:</strong> Using test helpers from chronologyCalculations.test.ts
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
