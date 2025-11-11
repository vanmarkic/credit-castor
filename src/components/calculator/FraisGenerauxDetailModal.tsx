import { X } from 'lucide-react';
import type {
  FraisGenerauxYearlyEvent,
  NewcomerFraisGenerauxReimbursementEvent
} from '../../types/timeline';
import { FraisGenerauxYearlyDetails } from '../events/FraisGenerauxYearlyDetails';
import { NewcomerReimbursementDetails } from '../events/NewcomerReimbursementDetails';

type FraisGenerauxEvent = FraisGenerauxYearlyEvent | NewcomerFraisGenerauxReimbursementEvent;

interface FraisGenerauxDetailModalProps {
  event: FraisGenerauxEvent;
  onClose: () => void;
}

/**
 * Modal for displaying detailed Frais Généraux event information
 */
export default function FraisGenerauxDetailModal({
  event,
  onClose
}: FraisGenerauxDetailModalProps) {
  const isReimbursement = event.type === 'NEWCOMER_FRAIS_GENERAUX_REIMBURSEMENT';

  return (
    <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-gray-200 z-10 shadow-sm">
        <div className="max-w-4xl mx-auto p-6">
          <div className="flex items-start justify-between">
            {/* Left: Title and Info */}
            <div className="flex flex-col gap-2">
              <h2 className="text-2xl font-bold text-purple-900">
                {isReimbursement ? (
                  <>💰 Remboursement Frais Généraux</>
                ) : (
                  <>📋 Frais Généraux - Année {event.year}</>
                )}
              </h2>
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <span className="text-gray-400">Date</span>
                  <span className="font-medium text-purple-600">
                    {event.date.toLocaleDateString('fr-BE')}
                  </span>
                </span>
              </div>
            </div>

            {/* Close button */}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-8 h-8" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          {isReimbursement ? (
            <NewcomerReimbursementDetails event={event} />
          ) : (
            <FraisGenerauxYearlyDetails event={event} />
          )}
        </div>
      </div>
    </div>
  );
}
