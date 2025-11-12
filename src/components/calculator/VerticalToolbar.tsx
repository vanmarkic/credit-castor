import { useState } from 'react';
import { Download, Upload, RotateCcw, Save, ChevronLeft } from 'lucide-react';

interface VerticalToolbarProps {
  onDownloadScenario: () => void;
  onLoadScenario: () => void;
  onResetToDefaults: () => void;
  onExportToExcel: () => void;
}

export function VerticalToolbar({
  onDownloadScenario,
  onLoadScenario,
  onResetToDefaults,
  onExportToExcel,
}: VerticalToolbarProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed right-0 top-1/2 -translate-y-1/2 z-10">
      {/* Drawer content */}
      <div
        className={`bg-white shadow-2xl border-l border-gray-200 transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="p-4 min-w-[140px]">
          <div className="mb-3 pb-3 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-xs font-semibold text-gray-700">Scénarios</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
              title="Fermer"
            >
              <ChevronLeft className="w-4 h-4 text-gray-600" />
            </button>
          </div>

          <div className="flex flex-col gap-2">
          <button
            onClick={onDownloadScenario}
            className="bg-white hover:bg-gray-50 text-gray-700 font-medium p-2.5 rounded-lg transition-colors flex flex-col items-center justify-center gap-1 border border-gray-300"
            title="Télécharger"
          >
            <Download className="w-5 h-5" />
            <span className="text-[10px]">Télécharger</span>
          </button>

          <button
            onClick={onLoadScenario}
            className="bg-white hover:bg-gray-50 text-gray-700 font-medium p-2.5 rounded-lg transition-colors flex flex-col items-center justify-center gap-1 border border-gray-300"
            title="Charger"
          >
            <Upload className="w-5 h-5" />
            <span className="text-[10px]">Charger</span>
          </button>

          <button
            onClick={onResetToDefaults}
            className="bg-white hover:bg-gray-50 text-gray-700 font-medium p-2.5 rounded-lg transition-colors flex flex-col items-center justify-center gap-1 border border-gray-300"
            title="Réinitialiser"
          >
            <RotateCcw className="w-5 h-5" />
            <span className="text-[10px]">Réinitialiser</span>
          </button>

          <button
            onClick={onExportToExcel}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium p-2.5 rounded-lg transition-colors flex flex-col items-center justify-center gap-1 border border-blue-600"
            title="Excel"
          >
            <Download className="w-5 h-5" />
            <span className="text-[10px]">Excel</span>
          </button>
        </div>

          <p className="text-[10px] text-gray-500 mt-3 pt-3 text-center border-t border-gray-200">
            Sauvegarde auto
          </p>
        </div>
      </div>

      {/* Floppy disk button - always visible */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="absolute right-0 top-0 bg-white hover:bg-gray-50 rounded-l-lg shadow-lg border border-gray-200 p-3 transition-all"
        title={isOpen ? "Fermer" : "Gestion des Scénarios"}
      >
        <Save className="w-6 h-6 text-gray-600" />
      </button>
    </div>
  );
}
