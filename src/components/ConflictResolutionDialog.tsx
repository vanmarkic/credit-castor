import { AlertTriangle, Download, Upload, X, FileText, Calendar, Users, Settings } from 'lucide-react';
import type { ConflictState } from '../hooks/useFirestoreSync';

interface ConflictResolutionDialogProps {
  conflictState: ConflictState;
  onResolve: (choice: 'local' | 'remote' | 'cancel') => void;
}

/**
 * Helper to check if two objects are deeply equal
 */
function isEqual(a: any, b: any): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

/**
 * Helper to format participant names for display
 */
function formatParticipantList(participants: any[]): string {
  if (participants.length === 0) return 'Aucun';
  if (participants.length <= 3) {
    return participants.map(p => p.name).join(', ');
  }
  return `${participants.slice(0, 3).map(p => p.name).join(', ')} et ${participants.length - 3} autre(s)`;
}

/**
 * Helper to get human-readable field names for ProjectParams
 */
function getProjectParamLabel(key: string): string {
  const labels: Record<string, string> = {
    totalPurchase: 'Prix d\'achat total',
    notaryRate: 'Taux notaire',
    defaultInterestRate: 'Taux d\'intérêt',
    defaultLoanDurationYears: 'Durée du prêt (années)',
    travauxCommunsSurface: 'Surface travaux communs',
    travauxCommunsCostPerM2: 'Coût/m² travaux communs',
    useTravauxCommunsSurfaceMultiplier: 'Multiplicateur surface T.C.',
    // Add more fields as needed
  };
  return labels[key] || key;
}

/**
 * Helper to get human-readable field names for PortageFormulaParams
 */
function getPortageFormulaLabel(key: string): string {
  const labels: Record<string, string> = {
    fixedMonthlyFee: 'Frais fixes mensuels',
    emptyPropertyTaxRate: 'Taux précompte vacant',
    insuranceRate: 'Taux assurance',
    adminFeesRate: 'Taux frais admin',
    maintenanceFundRate: 'Taux fonds entretien',
    carryingCostRecovery: 'Récupération coûts portage',
    includeNotaryInBasis: 'Inclure notaire dans base',
    useDualLoanStructure: 'Structure double prêt',
    dualLoanSplitRatio: 'Ratio split prêts',
    dualLoanRate2: 'Taux prêt 2',
    dualLoanDuration2: 'Durée prêt 2',
    // Add more fields as needed
  };
  return labels[key] || key;
}

/**
 * Helper to format value for display
 */
function formatValue(value: any): string {
  if (typeof value === 'boolean') return value ? 'Oui' : 'Non';
  if (typeof value === 'number') {
    // Format as percentage if < 1 (likely a rate)
    if (value > 0 && value < 1) return `${(value * 100).toFixed(2)}%`;
    return value.toLocaleString('fr-BE');
  }
  if (value === null || value === undefined) return 'Non défini';
  return String(value);
}

/**
 * Get detailed field differences for nested objects
 */
function getFieldDifferences(local: any, remote: any): Array<{ key: string; localValue: any; remoteValue: any }> {
  const differences: Array<{ key: string; localValue: any; remoteValue: any }> = [];

  // Get all keys from both objects
  const allKeys = new Set([...Object.keys(local || {}), ...Object.keys(remote || {})]);

  allKeys.forEach(key => {
    const localValue = local?.[key];
    const remoteValue = remote?.[key];

    // Deep comparison for nested objects
    if (JSON.stringify(localValue) !== JSON.stringify(remoteValue)) {
      differences.push({ key, localValue, remoteValue });
    }
  });

  return differences;
}

/**
 * Analyze participant changes to show adds/removes/modifications
 */
function analyzeParticipantChanges(localParticipants: any[], remoteParticipants: any[]) {
  const localNames = new Set(localParticipants.map(p => p.name));
  const remoteNames = new Set(remoteParticipants.map(p => p.name));

  const added: string[] = [];
  const removed: string[] = [];
  const modified: string[] = [];

  // Find added participants
  remoteParticipants.forEach(p => {
    if (!localNames.has(p.name)) {
      added.push(p.name);
    }
  });

  // Find removed participants
  localParticipants.forEach(p => {
    if (!remoteNames.has(p.name)) {
      removed.push(p.name);
    }
  });

  // Find modified participants (same name but different data)
  localParticipants.forEach(localP => {
    const remoteP = remoteParticipants.find(r => r.name === localP.name);
    if (remoteP && JSON.stringify(localP) !== JSON.stringify(remoteP)) {
      modified.push(localP.name);
    }
  });

  return { added, removed, modified };
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

          {/* Metadata Comparison */}
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
                </div>
              )}
            </div>
          </div>

          {/* Field-Level Changes */}
          {localData && remoteData && (
            <div className="border border-gray-200 rounded-lg">
              <div className="bg-gray-100 px-4 py-3 border-b border-gray-200">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Différences détectées
                </h3>
              </div>
              <div className="p-4 space-y-3">
                {/* Participants Changed */}
                {!isEqual(localData.participants, remoteData.participants) && (() => {
                  const { added, removed, modified } = analyzeParticipantChanges(
                    localData.participants,
                    remoteData.participants
                  );
                  return (
                    <div className="flex gap-3 items-start bg-yellow-50 border border-yellow-200 rounded p-3">
                      <Users className="w-5 h-5 text-yellow-700 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 text-sm">
                        <div className="font-medium text-yellow-900 mb-2">Participants modifiés</div>
                        <div className="text-gray-700 space-y-2">
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <span className="text-blue-700 font-medium">Vous :</span> {localData.participants.length} participant(s)
                            </div>
                            <div>
                              <span className="text-purple-700 font-medium">Distant :</span> {remoteData.participants.length} participant(s)
                            </div>
                          </div>

                          {added.length > 0 && (
                            <div className="border-l-2 border-green-400 pl-2">
                              <div className="font-medium text-green-800 text-xs">✅ Ajoutés (distant)</div>
                              <div className="text-gray-700 text-xs">{added.join(', ')}</div>
                            </div>
                          )}

                          {removed.length > 0 && (
                            <div className="border-l-2 border-red-400 pl-2">
                              <div className="font-medium text-red-800 text-xs">❌ Supprimés (distant)</div>
                              <div className="text-gray-700 text-xs">{removed.join(', ')}</div>
                            </div>
                          )}

                          {modified.length > 0 && (
                            <div className="border-l-2 border-orange-400 pl-2">
                              <div className="font-medium text-orange-800 text-xs">✏️ Modifiés (distant)</div>
                              <div className="text-gray-700 text-xs">{modified.join(', ')}</div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Deed Date Changed */}
                {localData.deedDate !== remoteData.deedDate && (
                  <div className="flex gap-3 items-start bg-yellow-50 border border-yellow-200 rounded p-3">
                    <Calendar className="w-5 h-5 text-yellow-700 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 text-sm">
                      <div className="font-medium text-yellow-900 mb-1">Date d'acte modifiée</div>
                      <div className="text-gray-700 space-y-1">
                        <div>
                          <span className="text-blue-700">Vous :</span> {localData.deedDate}
                        </div>
                        <div>
                          <span className="text-purple-700">Distant :</span> {remoteData.deedDate}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Project Params Changed */}
                {!isEqual(localData.projectParams, remoteData.projectParams) && (() => {
                  const differences = getFieldDifferences(localData.projectParams, remoteData.projectParams);
                  return (
                    <div className="flex gap-3 items-start bg-yellow-50 border border-yellow-200 rounded p-3">
                      <Settings className="w-5 h-5 text-yellow-700 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 text-sm">
                        <div className="font-medium text-yellow-900 mb-2">Paramètres du projet modifiés</div>
                        {differences.length > 0 ? (
                          <div className="space-y-2">
                            {differences.map(({ key, localValue, remoteValue }) => (
                              <div key={key} className="border-l-2 border-yellow-400 pl-2">
                                <div className="font-medium text-yellow-800">{getProjectParamLabel(key)}</div>
                                <div className="text-gray-700 space-y-0.5 text-xs">
                                  <div>
                                    <span className="text-blue-700">Vous :</span> {formatValue(localValue)}
                                  </div>
                                  <div>
                                    <span className="text-purple-700">Distant :</span> {formatValue(remoteValue)}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-gray-700">
                            Les paramètres du projet ont été modifiés.
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* Portage Formula Changed */}
                {!isEqual(localData.portageFormula, remoteData.portageFormula) && (() => {
                  const differences = getFieldDifferences(localData.portageFormula, remoteData.portageFormula);
                  return (
                    <div className="flex gap-3 items-start bg-yellow-50 border border-yellow-200 rounded p-3">
                      <FileText className="w-5 h-5 text-yellow-700 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 text-sm">
                        <div className="font-medium text-yellow-900 mb-2">Formule de portage modifiée</div>
                        {differences.length > 0 ? (
                          <div className="space-y-2">
                            {differences.map(({ key, localValue, remoteValue }) => (
                              <div key={key} className="border-l-2 border-yellow-400 pl-2">
                                <div className="font-medium text-yellow-800">{getPortageFormulaLabel(key)}</div>
                                <div className="text-gray-700 space-y-0.5 text-xs">
                                  <div>
                                    <span className="text-blue-700">Vous :</span> {formatValue(localValue)}
                                  </div>
                                  <div>
                                    <span className="text-purple-700">Distant :</span> {formatValue(remoteValue)}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-gray-700">
                            Les paramètres de la formule de portage ont été modifiés.
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* No Changes Detected (shouldn't happen) */}
                {isEqual(localData.participants, remoteData.participants) &&
                  localData.deedDate === remoteData.deedDate &&
                  isEqual(localData.projectParams, remoteData.projectParams) &&
                  isEqual(localData.portageFormula, remoteData.portageFormula) && (
                  <div className="text-sm text-gray-600 italic">
                    Aucune différence détectée dans les champs principaux.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Warning */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-3">
            <p className="text-sm text-red-800 font-semibold">
              ⚠️ Attention : Choix irréversible !
            </p>
            <div className="text-sm text-red-700 space-y-2">
              <div className="flex items-start gap-2">
                <Upload className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <div>
                  <strong>"Garder mes modifications"</strong> : Écrase TOUTES les modifications distantes avec vos données locales.
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Download className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <div>
                  <strong>"Accepter les modifications distantes"</strong> : Supprime TOUTES vos modifications locales et charge les données distantes. La page sera rechargée.
                </div>
              </div>
              <div className="flex items-start gap-2">
                <X className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <div>
                  <strong>"Annuler"</strong> : Ferme ce dialogue sans rien changer. Le conflit restera actif.
                </div>
              </div>
            </div>
            <p className="text-sm text-red-800 italic">
              💡 Conseil : Exportez vos données importantes avant de choisir, ou coordonnez-vous avec l'autre utilisateur.
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
