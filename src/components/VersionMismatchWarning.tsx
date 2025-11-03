import { useState } from 'react';
import { Download, AlertTriangle, X } from 'lucide-react';

interface VersionMismatchWarningProps {
  storedVersion: string | undefined;
  currentVersion: string;
  onExportAndReset: () => void;
  onDismiss: () => void;
}

export function VersionMismatchWarning({
  storedVersion,
  currentVersion,
  onExportAndReset,
  onDismiss
}: VersionMismatchWarningProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExportAndReset = async () => {
    setIsExporting(true);
    try {
      await onExportAndReset();
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6 relative">
        {/* Close button */}
        <button
          onClick={onDismiss}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Fermer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Warning icon */}
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-orange-100 rounded-full p-3">
            <AlertTriangle className="w-8 h-8 text-orange-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              Version incompatible détectée
            </h2>
            <p className="text-sm text-gray-600">
              Vos données ont été créées avec une version antérieure
            </p>
          </div>
        </div>

        {/* Version info */}
        <div className="bg-gray-50 rounded-lg p-4 mb-4 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Version stockée:</span>
            <span className="font-mono font-semibold text-gray-800">
              {storedVersion || 'inconnue'}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Version actuelle:</span>
            <span className="font-mono font-semibold text-green-700">
              {currentVersion}
            </span>
          </div>
        </div>

        {/* Explanation */}
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
          <p className="text-sm text-blue-800 mb-2">
            <strong>Pourquoi ce message ?</strong>
          </p>
          <p className="text-sm text-blue-700">
            La structure des données a changé entre les versions. Pour éviter les erreurs
            et la corruption de données, nous devons réinitialiser le localStorage.
          </p>
        </div>

        {/* Instructions */}
        <div className="mb-6">
          <h3 className="font-semibold text-gray-800 mb-3">
            📋 Étapes recommandées :
          </h3>
          <ol className="space-y-2 text-sm text-gray-700">
            <li className="flex gap-2">
              <span className="font-semibold text-blue-600">1.</span>
              <span>
                Cliquez sur "Télécharger & Réinitialiser" pour sauvegarder vos données
              </span>
            </li>
            <li className="flex gap-2">
              <span className="font-semibold text-blue-600">2.</span>
              <span>
                Envoyez le fichier téléchargé à <strong>Dragan</strong> (drag.markovic@gmail.com)
              </span>
            </li>
            <li className="flex gap-2">
              <span className="font-semibold text-blue-600">3.</span>
              <span>
                Le localStorage sera automatiquement réinitialisé après le téléchargement
              </span>
            </li>
          </ol>
        </div>

        {/* Warning note */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-6">
          <p className="text-xs text-yellow-800">
            ⚠️ <strong>Important :</strong> Si vous cliquez sur "Ignorer", vous risquez de
            rencontrer des bugs et des comportements inattendus. Il est fortement recommandé
            d'exporter vos données avant de continuer.
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleExportAndReset}
            disabled={isExporting}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-5 h-5" />
            {isExporting ? 'Téléchargement...' : 'Télécharger & Réinitialiser'}
          </button>
          <button
            onClick={onDismiss}
            className="px-6 py-3 border-2 border-gray-300 hover:border-gray-400 text-gray-700 font-semibold rounded-lg transition-colors"
          >
            Ignorer (non recommandé)
          </button>
        </div>
      </div>
    </div>
  );
}
