/**
 * ContinuousTimelineView Component (Phase 4.6)
 *
 * Main integrated view combining all timeline components
 * - Timeline visualization from deed date
 * - Participants table with cash flows
 * - Copropriété panel
 */

import { useState, useRef } from 'react';
import type { DomainEvent } from '../types/timeline';
import { projectContinuousTimeline } from '../utils/timelineProjection';
import { exportTimelineToJSON, importTimelineFromJSON } from '../utils/timelineExport';
import { DEFAULT_PORTAGE_FORMULA } from '../utils/calculatorUtils';
import TimelineVisualization from './TimelineVisualization';
import ParticipantsTable from './ParticipantsTable';
import CoproprietéPanel from './CoproprietéPanel';
import AvailableLotsView from './AvailableLotsView';
import { getAvailableLotsForNewcomer } from '../utils/availableLots';

interface ContinuousTimelineViewProps {
  events: DomainEvent[];
}

export default function ContinuousTimelineView({
  events: initialEvents,
}: ContinuousTimelineViewProps) {
  const [activeTab, setActiveTab] = useState<'timeline' | 'participants' | 'copro' | 'available'>('timeline');
  const [events, setEvents] = useState<DomainEvent[]>(initialEvents);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Project the complete timeline from events
  const timeline = projectContinuousTimeline(events);

  // Export timeline to JSON
  const handleExport = () => {
    try {
      const json = exportTimelineToJSON(events);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `timeline-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed');
    }
  };

  // Import timeline from JSON
  const handleImport = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = event.target?.result as string;
        const importedEvents = importTimelineFromJSON(json);
        setEvents(importedEvents);
        alert(`Successfully imported ${importedEvents.length} events`);
      } catch (error) {
        console.error('Import failed:', error);
        alert('Import failed - invalid file format');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Continuous Timeline</h1>
              <p className="text-gray-600 mt-2">
                T0: {formatDate(timeline.deedDate)} • {timeline.participants.length} participants • {events.length} events
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleExport}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Export JSON
              </button>
              <button
                onClick={handleImport}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Import JSON
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('timeline')}
              className={`px-6 py-4 font-semibold border-b-2 transition-colors ${
                activeTab === 'timeline'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Timeline
            </button>
            <button
              onClick={() => setActiveTab('participants')}
              className={`px-6 py-4 font-semibold border-b-2 transition-colors ${
                activeTab === 'participants'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Participants ({timeline.participants.length})
            </button>
            <button
              onClick={() => setActiveTab('copro')}
              className={`px-6 py-4 font-semibold border-b-2 transition-colors ${
                activeTab === 'copro'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Copropriété
            </button>
            <button
              onClick={() => setActiveTab('available')}
              className={`px-6 py-4 font-semibold border-b-2 transition-colors ${
                activeTab === 'available'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              📦 Lots Disponibles
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {activeTab === 'timeline' && (
          <div className="space-y-6">
            <TimelineVisualization
              deedDate={timeline.deedDate}
              events={timeline.events}
            />

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">Deed Date</div>
                <div className="text-xl font-bold text-gray-900">
                  {formatDate(timeline.deedDate)}
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">Total Participants</div>
                <div className="text-xl font-bold text-gray-900">
                  {timeline.participants.length}
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">Total Events</div>
                <div className="text-xl font-bold text-gray-900">
                  {timeline.events.length}
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">Hidden Lots</div>
                <div className="text-xl font-bold text-gray-900">
                  {timeline.copropropriete.lotsOwned.length}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'participants' && (
          <ParticipantsTable
            participants={timeline.participants}
            deedDate={timeline.deedDate}
          />
        )}

        {activeTab === 'copro' && (
          <CoproprietéPanel
            copropropriete={timeline.copropropriete}
            deedDate={timeline.deedDate}
          />
        )}

        {activeTab === 'available' && (
          <AvailableLotsView
            availableLots={getAvailableLotsForNewcomer(
              timeline.participants,
              timeline.copropropriete.lotsOwned
            )}
            deedDate={timeline.deedDate}
            formulaParams={DEFAULT_PORTAGE_FORMULA}
          />
        )}
      </div>
    </div>
  );
}

// ============================================
// Helper Functions
// ============================================

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString('en-BE', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}
