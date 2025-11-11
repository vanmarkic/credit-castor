import { AlertTriangle, Download, Upload, X } from 'lucide-react';
import type { ConflictState } from '../hooks/useFirestoreSync';

interface ConflictResolutionDialogProps {
  conflictState: ConflictState;
  onResolve: (choice: 'local' | 'remote' | 'cancel') => void;
}

/**
 * Dialog for resolving sync conflicts between local and remote changes
 *
 * Shows when two users edit the same data simultaneously
 * Allows user to choose:
 * - Keep local changes (overwrite remote)
 * - Accept remote changes (discard local)
 * - Cancel (stay in conflict state)
 */
export function ConflictResolutionDialog({
  conflictState,
  onResolve,
}: ConflictResolutionDialogProps) {
  if (!conflictState.hasConflict) {
    return null;
  }

  const { localData, remoteData, message } = conflictState;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-amber-500 text-white p-6 rounded-t-lg">
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0 w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Conflit de synchronisation</h2>
              <p className="text-amber-100 text-sm mt-1">
                Des modifications concurrentes ont été détectées
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Explanation */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-sm text-gray-700">
              {message || 'Un autre utilisateur a modifié les données pendant que vous travailliez. Vous devez choisir quelle version conserver.'}
            </p>
          </div>

          {/* Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Local Changes */}
            <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
              <div className="flex items-center gap-2 mb-3">
                <Upload className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-blue-900">Vos modifications locales</h3>
              </div>
              {localData && (
                <div className="space-y-2 text-sm text-gray-700">
                  <div>
                    <span className="font-medium">Modifié par :</span> Vous
                  </div>
                  <div>
                    <span className="font-medium">Date :</span>{' '}
                    {new Date(localData.lastModifiedAt).toLocaleString('fr-BE')}
                  </div>
                  <div>
                    <span className="font-medium">Version :</span> {localData.version}
                  </div>
                  <div>
                    <span className="font-medium">Participants :</span>{' '}
                    {localData.participants.length}
                  </div>
                </div>
              )}
            </div>

            {/* Remote Changes */}
            <div className="border border-purple-200 rounded-lg p-4 bg-purple-50">
              <div className="flex items-center gap-2 mb-3">
                <Download className="w-5 h-5 text-purple-600" />
                <h3 className="font-semibold text-purple-900">Modifications distantes</h3>
              </div>
              {remoteData && (
                <div className="space-y-2 text-sm text-gray-700">
                  <div>
                    <span className="font-medium">Modifié par :</span>{' '}
                    {remoteData.lastModifiedBy}
                  </div>
                  <div>
                    <span className="font-medium">Date :</span>{' '}
                    {new Date(remoteData.lastModifiedAt).toLocaleString('fr-BE')}
                  </div>
                  <div>
                    <span className="font-medium">Version :</span> {remoteData.version}
                  </div>
                  <div>
                    <span className="font-medium">Participants :</span>{' '}
                    {remoteData.participants.length}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Warning */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800">
              <strong>⚠️ Attention :</strong> Le choix que vous faites écrasera définitivement l'autre version. Assurez-vous d'avoir exporté vos données importantes avant de continuer.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Keep Local */}
            <button
              onClick={() => onResolve('local')}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              <Upload className="w-5 h-5" />
              Garder mes modifications
            </button>

            {/* Accept Remote */}
            <button
              onClick={() => onResolve('remote')}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors"
            >
              <Download className="w-5 h-5" />
              Accepter les modifications distantes
            </button>

            {/* Cancel */}
            <button
              onClick={() => onResolve('cancel')}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
              Annuler
            </button>
          </div>

          {/* Help Text */}
          <div className="text-xs text-gray-500 text-center">
            <p>
              <strong>Conseil :</strong> Si vous n'êtes pas sûr, choisissez "Accepter les
              modifications distantes" pour éviter d'écraser le travail d'un autre utilisateur.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
