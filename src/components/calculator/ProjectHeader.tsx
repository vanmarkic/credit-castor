import React from 'react';
import { Calculator, Users, DollarSign, Home, Building2, Wallet, Download, Upload, RotateCcw, Save } from 'lucide-react';
import { formatCurrency } from '../../utils/formatting';
import type { CalculationResults, Participant } from '../../utils/calculatorUtils';

interface ProjectHeaderProps {
  deedDate: string;
  onDeedDateChange: (date: string) => void;
  calculations: CalculationResults;
  participants: Participant[];
  onDownloadScenario: () => void;
  onLoadScenario: () => void;
  onResetToDefaults: () => void;
  onExportToExcel: () => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function ProjectHeader({
  deedDate,
  onDeedDateChange,
  calculations,
  participants,
  onDownloadScenario,
  onLoadScenario,
  onResetToDefaults,
  onExportToExcel,
  fileInputRef,
  onFileUpload,
}: ProjectHeaderProps) {
  return (
    <div className="bg-white rounded-xl shadow-2xl p-8 mb-8">
      <div className="flex items-center gap-4 mb-4">
        <Building2 className="w-12 h-12 text-blue-600" />
        <div>
          <h1 className="text-4xl font-bold text-gray-800">Achat Ferme du Temple</h1>
          <p className="text-gray-600">Wallonie, Belgique • Prix d'achat €650,000</p>
        </div>
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-5 mb-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <Save className="w-4 h-4 text-gray-600" />
          Gestion des Scénarios
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <button
            onClick={onDownloadScenario}
            className="bg-white hover:bg-gray-50 text-gray-700 font-medium px-3 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 border border-gray-300 text-sm"
          >
            <Download className="w-4 h-4" />
            Télécharger
          </button>

          <button
            onClick={onLoadScenario}
            className="bg-white hover:bg-gray-50 text-gray-700 font-medium px-3 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 border border-gray-300 text-sm"
          >
            <Upload className="w-4 h-4" />
            Charger
          </button>

          <button
            onClick={onResetToDefaults}
            className="bg-white hover:bg-gray-50 text-gray-700 font-medium px-3 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 border border-gray-300 text-sm"
          >
            <RotateCcw className="w-4 h-4" />
            Réinitialiser
          </button>

          <button
            onClick={onExportToExcel}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-3 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 border border-blue-600 text-sm"
          >
            <Download className="w-4 h-4" />
            Excel
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={onFileUpload}
          style={{ display: 'none' }}
        />

        <p className="text-xs text-gray-500 mt-3 text-center">
          Sauvegarde automatique activée
        </p>
      </div>

      <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 mb-6">
        <p className="text-sm text-blue-800">
          <strong>📐 Principe:</strong> L'achat est fonction des m² (€{calculations.pricePerM2.toFixed(2)}/m²).
          Le capital apporté est indépendant de la taille du logement.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
          <Users className="w-6 h-6 text-blue-500 mb-2" />
          <p className="text-xs text-gray-500 uppercase tracking-wide">Participants</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{participants.length}</p>
        </div>

        <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
          <Home className="w-6 h-6 text-blue-500 mb-2" />
          <p className="text-xs text-gray-500 uppercase tracking-wide">Surface</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{calculations.totalSurface}m²</p>
        </div>

        <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
          <DollarSign className="w-6 h-6 text-gray-500 mb-2" />
          <p className="text-xs text-gray-500 uppercase tracking-wide">Coût Total</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(calculations.totals.total)}</p>
        </div>

        <div className="bg-white rounded-lg p-4 border border-green-300 shadow-sm">
          <Wallet className="w-6 h-6 text-green-600 mb-2" />
          <p className="text-xs text-gray-500 uppercase tracking-wide">Capital Total</p>
          <p className="text-2xl font-bold text-green-700 mt-1">{formatCurrency(calculations.totals.capitalTotal)}</p>
        </div>

        <div className="bg-white rounded-lg p-4 border border-red-300 shadow-sm">
          <Calculator className="w-6 h-6 text-red-600 mb-2" />
          <p className="text-xs text-gray-500 uppercase tracking-wide">À Emprunter</p>
          <p className="text-2xl font-bold text-red-700 mt-1">{formatCurrency(calculations.totals.totalLoansNeeded)}</p>
        </div>
      </div>
    </div>
  );
}
