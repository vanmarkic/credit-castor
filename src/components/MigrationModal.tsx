/**
 * Migration Modal - Selective data migration to Firestore
 *
 * Allows users to choose which individual participant data to migrate,
 * while excluding shared/common project parameters.
 */

import { useState } from 'react';
import type { Participant, ProjectParams, PortageFormulaParams } from '../utils/calculatorUtils';

export interface MigrationData {
  participants: Participant[];
  projectParams: ProjectParams;
  deedDate: string;
  portageFormula: PortageFormulaParams;
}

export interface MigrationModalProps {
  data: MigrationData;
  onConfirm: (selectedParticipants: Participant[]) => void;
  onCancel: () => void;
}

export function MigrationModal({ data, onConfirm, onCancel }: MigrationModalProps) {
  const [selectedParticipants, setSelectedParticipants] = useState<Set<string>>(
    new Set(data.participants.map(p => p.name))
  );

  const handleToggleParticipant = (name: string) => {
    const newSelected = new Set(selectedParticipants);
    if (newSelected.has(name)) {
      newSelected.delete(name);
    } else {
      newSelected.add(name);
    }
    setSelectedParticipants(newSelected);
  };

  const handleSelectAll = () => {
    setSelectedParticipants(new Set(data.participants.map(p => p.name)));
  };

  const handleDeselectAll = () => {
    setSelectedParticipants(new Set());
  };

  const handleConfirm = () => {
    const participantsToMigrate = data.participants.filter(p =>
      selectedParticipants.has(p.name)
    );
    onConfirm(participantsToMigrate);
  };

  const participantCount = data.participants.length;
  const selectedCount = selectedParticipants.size;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            🔄 Migration vers Firestore
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Choisissez les participants à migrer
          </p>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-blue-800">
              <strong>Note importante:</strong> Seules les données individuelles des participants seront migrées.
              Les paramètres communs du projet (prix d'achat, frais partagés, etc.) ne seront pas inclus.
            </p>
          </div>

          {/* Selection controls */}
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-gray-700">
              <strong>{selectedCount}</strong> sur <strong>{participantCount}</strong> participant{participantCount > 1 ? 's' : ''} sélectionné{selectedCount > 1 ? 's' : ''}
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSelectAll}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Tout sélectionner
              </button>
              <span className="text-gray-300">|</span>
              <button
                onClick={handleDeselectAll}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Tout désélectionner
              </button>
            </div>
          </div>

          {/* Participant list */}
          <div className="space-y-2">
            {data.participants.map((participant) => {
              const isSelected = selectedParticipants.has(participant.name);
              return (
                <label
                  key={participant.name}
                  className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-blue-50 border-blue-300'
                      : 'bg-white border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => handleToggleParticipant(participant.name)}
                    className="mt-1 w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900">{participant.name}</div>
                    <div className="text-sm text-gray-600 mt-1 space-y-0.5">
                      <div>Capital apporté: {participant.capitalApporte.toLocaleString('fr-FR')} €</div>
                      <div>Surface: {participant.surface} m²</div>
                      {participant.isFounder && (
                        <div className="text-xs text-green-600 font-medium">✓ Fondateur</div>
                      )}
                      {!participant.isFounder && participant.purchaseDetails && (
                        <div className="text-xs text-orange-600 font-medium">
                          → Nouvel arrivant (acquiert lot #{participant.purchaseDetails.lotId})
                        </div>
                      )}
                    </div>
                  </div>
                </label>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors font-medium"
          >
            Annuler
          </button>
          <button
            onClick={handleConfirm}
            disabled={selectedCount === 0}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              selectedCount === 0
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            Migrer {selectedCount > 0 && `(${selectedCount})`}
          </button>
        </div>
      </div>
    </div>
  );
}
