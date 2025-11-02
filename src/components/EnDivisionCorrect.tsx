import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Calculator, Users, DollarSign, Home, Building2, Wallet, Download, Upload, RotateCcw, Save, ChevronDown, ChevronUp } from 'lucide-react';
import { calculateAll } from '../utils/calculatorUtils';
import { exportCalculations } from '../utils/excelExport';
import { XlsxWriter } from '../utils/exportWriter';

// Default values for reset functionality
const DEFAULT_PARTICIPANTS = [
  { name: 'Manuela/Dragan', capitalApporte: 50000, notaryFeesRate: 12.5, unitId: 1, surface: 112, interestRate: 4.5, durationYears: 25, quantity: 1, parachevementsPerM2: 500 },
  { name: 'Cathy/Jim', capitalApporte: 170000, notaryFeesRate: 12.5, unitId: 3, surface: 134, interestRate: 4.5, durationYears: 25, quantity: 1, parachevementsPerM2: 500 },
  { name: 'Annabelle/Colin', capitalApporte: 200000, notaryFeesRate: 12.5, unitId: 5, surface: 118, interestRate: 4.5, durationYears: 25, quantity: 1, parachevementsPerM2: 500 },
  { name: 'Julie/Séverin', capitalApporte: 70000, notaryFeesRate: 12.5, unitId: 6, surface: 108, interestRate: 4.5, durationYears: 25, quantity: 1, parachevementsPerM2: 500 }
];

const DEFAULT_PROJECT_PARAMS = {
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
};

const DEFAULT_SCENARIO = {
  constructionCostChange: 0,
  infrastructureReduction: 0,
  purchasePriceReduction: 0
};

const STORAGE_KEY = 'credit-castor-scenario';

// LocalStorage utilities
const saveToLocalStorage = (participants: any[], projectParams: any, scenario: any) => {
  try {
    const data = {
      version: 1,
      timestamp: new Date().toISOString(),
      participants,
      projectParams,
      scenario
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save to localStorage:', error);
  }
};

const loadFromLocalStorage = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const data = JSON.parse(stored);

      // Migration: If no globalCascoPerM2, use first participant's value or default
      if (data.projectParams && !data.projectParams.globalCascoPerM2) {
        data.projectParams.globalCascoPerM2 =
          data.participants?.[0]?.cascoPerM2 || 1590;
      }

      // Clean up old participant cascoPerM2 fields
      if (data.participants) {
        data.participants = data.participants.map((p: any) => {
          const { cascoPerM2, ...rest } = p;
          return rest;
        });
      }

      return {
        participants: data.participants || DEFAULT_PARTICIPANTS,
        projectParams: data.projectParams || DEFAULT_PROJECT_PARAMS,
        scenario: data.scenario || DEFAULT_SCENARIO
      };
    }
  } catch (error) {
    console.error('Failed to load from localStorage:', error);
  }
  return null;
};

const clearLocalStorage = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear localStorage:', error);
  }
};

export default function EnDivisionCorrect() {
  const [participants, setParticipants] = useState(() => {
    const stored = loadFromLocalStorage();
    return stored ? stored.participants : DEFAULT_PARTICIPANTS;
  });

  const [expandedParticipants, setExpandedParticipants] = useState<{[key: number]: boolean}>({});

  const participantRefs = useRef<(HTMLDivElement | null)[]>([]);

  const addParticipant = () => {
    const newId = Math.max(...participants.map((p: any) => p.unitId), 0) + 1;
    setParticipants([...participants, {
      name: 'Participant ' + (participants.length + 1),
      capitalApporte: 100000,
      notaryFeesRate: 12.5,
      unitId: newId,
      surface: 100,
      interestRate: 4.5,
      durationYears: 25,
      quantity: 1,
      parachevementsPerM2: 500
    }]);

    // Scroll to the newly added participant (will be at the last index after state update)
    setTimeout(() => {
      const newIndex = participants.length; // This will be the index of the newly added participant
      if (participantRefs.current[newIndex]) {
        participantRefs.current[newIndex].scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 50);
  };

  const removeParticipant = (index: number) => {
    if (participants.length > 1) {
      const newParticipants = participants.filter((_: any, i: number) => i !== index);
      setParticipants(newParticipants);
    }
  };

  const updateParticipantName = (index: number, name: string) => {
    const newParticipants = [...participants];
    newParticipants[index].name = name;
    setParticipants(newParticipants);
  };

  const updateParticipantSurface = (index: number, surface: number) => {
    const newParticipants = [...participants];
    newParticipants[index].surface = surface;
    setParticipants(newParticipants);
  };

  const unitDetails = {
    1: { casco: 178080, parachevements: 56000 },
    3: { casco: 213060, parachevements: 67000 },
    5: { casco: 187620, parachevements: 59000 },
    6: { casco: 171720, parachevements: 54000 }
  };

  const [projectParams, setProjectParams] = useState(() => {
    const stored = loadFromLocalStorage();
    return stored ? stored.projectParams : DEFAULT_PROJECT_PARAMS;
  });

  const [scenario, setScenario] = useState(() => {
    const stored = loadFromLocalStorage();
    return stored ? stored.scenario : DEFAULT_SCENARIO;
  });

  // Auto-save to localStorage whenever state changes
  useEffect(() => {
    saveToLocalStorage(participants, projectParams, scenario);
  }, [participants, projectParams, scenario]);

  const calculations = useMemo(() => {
    return calculateAll(participants, projectParams, scenario, unitDetails);
  }, [participants, projectParams, scenario]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0
    }).format(value);
  };

  const updateCapital = (index: number, value: number) => {
    const newParticipants = [...participants];
    newParticipants[index].capitalApporte = value;
    setParticipants(newParticipants);
  };

  const updateNotaryRate = (index: number, value: number) => {
    const newParticipants = [...participants];
    newParticipants[index].notaryFeesRate = value;
    setParticipants(newParticipants);
  };

  const updateInterestRate = (index: number, value: number) => {
    const newParticipants = [...participants];
    newParticipants[index].interestRate = value;
    setParticipants(newParticipants);
  };

  const updateDuration = (index: number, value: number) => {
    const newParticipants = [...participants];
    newParticipants[index].durationYears = value;
    setParticipants(newParticipants);
  };

  const updateQuantity = (index: number, value: number) => {
    const newParticipants = [...participants];
    newParticipants[index].quantity = Math.max(1, value);
    setParticipants(newParticipants);
  };

  const updateParachevementsPerM2 = (index: number, value: number) => {
    const newParticipants = [...participants];
    newParticipants[index].parachevementsPerM2 = value;
    setParticipants(newParticipants);
  };

  const updateCascoSqm = (index: number, value: number | undefined) => {
    const newParticipants = [...participants];
    newParticipants[index].cascoSqm = value;
    setParticipants(newParticipants);
  };

  const updateParachevementsSqm = (index: number, value: number | undefined) => {
    const newParticipants = [...participants];
    newParticipants[index].parachevementsSqm = value;
    setParticipants(newParticipants);
  };

  const exportToExcel = () => {
    const writer = new XlsxWriter();
    exportCalculations(calculations, projectParams, scenario, writer);
  };

  // Download scenario as JSON file
  const downloadScenario = () => {
    const data = {
      version: 1,
      timestamp: new Date().toISOString(),
      participants,
      projectParams,
      scenario
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;

    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10);
    const timeStr = now.toTimeString().slice(0, 5).replace(':', '-');
    link.download = `scenario_${dateStr}_${timeStr}.json`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Load scenario from JSON file
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadScenario = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);

        // Validate the data structure
        if (!data.participants || !data.projectParams || !data.scenario) {
          alert('Fichier invalide: structure de données manquante');
          return;
        }

        // Load the data
        setParticipants(data.participants);
        setProjectParams(data.projectParams);
        setScenario(data.scenario);

        alert('Scénario chargé avec succès!');
      } catch (error) {
        console.error('Error loading scenario:', error);
        alert('Erreur lors du chargement du fichier. Vérifiez que le fichier est valide.');
      }
    };

    reader.readAsText(file);

    // Reset the input so the same file can be loaded again
    if (event.target) {
      event.target.value = '';
    }
  };

  // Reset to defaults
  const resetToDefaults = () => {
    if (confirm('Êtes-vous sûr de vouloir réinitialiser complètement? Toutes les données seront perdues.')) {
      clearLocalStorage();
      setParticipants(DEFAULT_PARTICIPANTS);
      setProjectParams(DEFAULT_PROJECT_PARAMS);
      setScenario(DEFAULT_SCENARIO);
      alert('Données réinitialisées aux valeurs par défaut.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-100 p-6">
      <div className="max-w-7xl mx-auto">

        <div className="bg-white rounded-xl shadow-2xl p-8 mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Building2 className="w-12 h-12 text-blue-600" />
            <div>
              <h1 className="text-4xl font-bold text-gray-800">Achat en Division - Acte 1</h1>
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
                onClick={downloadScenario}
                className="bg-white hover:bg-gray-50 text-gray-700 font-medium px-3 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 border border-gray-300 text-sm"
              >
                <Download className="w-4 h-4" />
                Télécharger
              </button>

              <button
                onClick={loadScenario}
                className="bg-white hover:bg-gray-50 text-gray-700 font-medium px-3 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 border border-gray-300 text-sm"
              >
                <Upload className="w-4 h-4" />
                Charger
              </button>

              <button
                onClick={resetToDefaults}
                className="bg-white hover:bg-gray-50 text-gray-700 font-medium px-3 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 border border-gray-300 text-sm"
              >
                <RotateCcw className="w-4 h-4" />
                Réinitialiser
              </button>

              <button
                onClick={exportToExcel}
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
              onChange={handleFileUpload}
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

        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Décomposition des Coûts</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="p-3 bg-white rounded-lg border border-gray-200">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Achat Total</p>
              <p className="text-lg font-bold text-gray-900">{formatCurrency(calculations.totals.purchase)}</p>
              <p className="text-xs text-blue-600 mt-1">{formatCurrency(calculations.pricePerM2)}/m²</p>
            </div>
            <div className="p-3 bg-white rounded-lg border border-gray-200">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Frais de Notaire</p>
              <p className="text-lg font-bold text-gray-900">{formatCurrency(calculations.totals.totalNotaryFees)}</p>
              <p className="text-xs text-gray-400 mt-1">taux individuels</p>
            </div>
            <div className="p-3 bg-white rounded-lg border border-gray-200">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Construction</p>
              <p className="text-lg font-bold text-gray-900">{formatCurrency(calculations.totals.construction)}</p>
            </div>
            <div className="p-3 bg-white rounded-lg border border-purple-200">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Quote-part Infrastr.</p>
              <p className="text-lg font-bold text-purple-700">{formatCurrency(calculations.sharedCosts)}</p>
              <p className="text-xs text-purple-500 mt-1">{formatCurrency(calculations.sharedPerPerson)}/pers</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-300">
              <p className="text-xs text-gray-600 uppercase tracking-wide mb-1 font-semibold">TOTAL</p>
              <p className="text-lg font-bold text-gray-900">{formatCurrency(calculations.totals.total)}</p>
            </div>
          </div>

          <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
            <h3 className="text-sm font-semibold text-gray-800 mb-2">Détail Quote-part (infrastructures extérieures)</h3>
            <p className="text-xs text-gray-600 mb-3">
              Les bâtiments communs (€368,900) sont dans "Construction" pour éviter le double comptage.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Mesures conservatoires</label>
                <input
                  type="number"
                  step="1000"
                  value={projectParams.mesuresConservatoires}
                  onChange={(e) => setProjectParams({...projectParams, mesuresConservatoires: parseFloat(e.target.value) || 0})}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:border-purple-500 focus:ring-1 focus:ring-purple-500 focus:outline-none bg-white"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Démolition</label>
                <input
                  type="number"
                  step="1000"
                  value={projectParams.demolition}
                  onChange={(e) => setProjectParams({...projectParams, demolition: parseFloat(e.target.value) || 0})}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:border-purple-500 focus:ring-1 focus:ring-purple-500 focus:outline-none bg-white"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Infrastructures</label>
                <input
                  type="number"
                  step="1000"
                  value={projectParams.infrastructures}
                  onChange={(e) => setProjectParams({...projectParams, infrastructures: parseFloat(e.target.value) || 0})}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:border-purple-500 focus:ring-1 focus:ring-purple-500 focus:outline-none bg-white"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Études préparatoires</label>
                <input
                  type="number"
                  step="1000"
                  value={projectParams.etudesPreparatoires}
                  onChange={(e) => setProjectParams({...projectParams, etudesPreparatoires: parseFloat(e.target.value) || 0})}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:border-purple-500 focus:ring-1 focus:ring-purple-500 focus:outline-none bg-white"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Frais Études préparatoires</label>
                <input
                  type="number"
                  step="1000"
                  value={projectParams.fraisEtudesPreparatoires}
                  onChange={(e) => setProjectParams({...projectParams, fraisEtudesPreparatoires: parseFloat(e.target.value) || 0})}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:border-purple-500 focus:ring-1 focus:ring-purple-500 focus:outline-none bg-white"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Frais Généraux étalés sur 3 ans</label>
                <div className="bg-white p-3 rounded-lg border border-gray-300">
                  <p className="text-base font-bold text-purple-700">
                    {formatCurrency(calculations.sharedCosts - (projectParams.mesuresConservatoires + projectParams.demolition + projectParams.infrastructures * (1 - scenario.infrastructureReduction / 100) + projectParams.etudesPreparatoires + projectParams.fraisEtudesPreparatoires))}
                  </p>
                  <div className="text-xs text-gray-500 mt-1 space-y-0.5">
                    <p>• Honoraires (15% × 30% CASCO)</p>
                    <p>• Frais récurrents × 3 ans</p>
                  </div>
                  <p className="text-xs text-gray-400 italic mt-1">
                    Calculé automatiquement
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-3 p-3 bg-purple-100 rounded-lg border border-purple-300">
              <div className="flex justify-between items-center">
                <p className="text-sm font-semibold text-gray-700">Total quote-part:</p>
                <p className="text-lg font-bold text-purple-800">{formatCurrency(calculations.sharedCosts)}</p>
              </div>
              <p className="text-xs text-gray-600 mt-1">
                {formatCurrency(calculations.sharedPerPerson)} par personne
              </p>
            </div>
          </div>

          <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
            <h3 className="text-sm font-semibold text-gray-800 mb-2">Travaux Communs</h3>
            <p className="text-xs text-gray-600 mb-3">
              Total: €{calculations.totals.totalTravauxCommuns.toLocaleString()} divisé par {participants.length} {participants.length > 1 ? 'unités' : 'unité'} = {formatCurrency(calculations.totals.travauxCommunsPerUnit)} par personne
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Bâtiment fondation (conservatoire)</label>
                <input
                  type="number"
                  step="1000"
                  value={projectParams.batimentFondationConservatoire}
                  onChange={(e) => setProjectParams({...projectParams, batimentFondationConservatoire: parseFloat(e.target.value) || 0})}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:border-purple-500 focus:ring-1 focus:ring-purple-500 focus:outline-none bg-white"
                />
                <p className="text-xs text-gray-400 mt-1">200€/m² × 218.5m²</p>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Bâtiment fondation (complète)</label>
                <input
                  type="number"
                  step="1000"
                  value={projectParams.batimentFondationComplete}
                  onChange={(e) => setProjectParams({...projectParams, batimentFondationComplete: parseFloat(e.target.value) || 0})}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:border-purple-500 focus:ring-1 focus:ring-purple-500 focus:outline-none bg-white"
                />
                <p className="text-xs text-gray-400 mt-1">800€/m² × 336.5m²</p>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Bâtiment copro (conservatoire)</label>
                <input
                  type="number"
                  step="1000"
                  value={projectParams.batimentCoproConservatoire}
                  onChange={(e) => setProjectParams({...projectParams, batimentCoproConservatoire: parseFloat(e.target.value) || 0})}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:border-purple-500 focus:ring-1 focus:ring-purple-500 focus:outline-none bg-white"
                />
                <p className="text-xs text-gray-400 mt-1">200€/m² × 280m²</p>
              </div>
            </div>
            <div className="mt-3 p-3 bg-purple-100 rounded-lg border border-purple-300">
              <div className="flex justify-between items-center">
                <p className="text-sm font-semibold text-gray-700">Total travaux communs:</p>
                <p className="text-lg font-bold text-purple-800">{formatCurrency(calculations.totals.totalTravauxCommuns)}</p>
              </div>
              <p className="text-xs text-gray-600 mt-1">
                {formatCurrency(calculations.totals.travauxCommunsPerUnit)} par unité (÷{participants.length})
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">🎛️ Scénarios d'Optimisation</h2>

          {/* NEW: Global Construction Rates */}
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="text-sm font-semibold text-gray-800 mb-3">Taux de Base</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-600 mb-2">
                  Prix CASCO (gros œuvre) - Prix/m² - Global
                </label>
                <input
                  type="number"
                  step="10"
                  value={projectParams.globalCascoPerM2}
                  onChange={(e) => setProjectParams({
                    ...projectParams,
                    globalCascoPerM2: parseFloat(e.target.value) || 1590
                  })}
                  className="w-full px-4 py-3 text-lg font-semibold border border-blue-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white"
                />
                <p className="text-xs text-blue-600 mt-1">
                  Appliqué à tous les participants
                </p>
              </div>
            </div>
          </div>

          {/* Existing variation sliders - wrapped in subsection */}
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <h3 className="text-sm font-semibold text-gray-800 mb-3">Variations en %</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Réduction Prix d'Achat (%)
                </label>
                <input
                  type="range"
                  min="0"
                  max="20"
                  value={scenario.purchasePriceReduction}
                  onChange={(e) => setScenario({...scenario, purchasePriceReduction: parseFloat(e.target.value)})}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-gray-600 mt-1">
                  <span>0%</span>
                  <span className="font-bold">{scenario.purchasePriceReduction}%</span>
                  <span>20%</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Variation Coûts Construction (%)
                </label>
                <input
                  type="range"
                  min="-30"
                  max="30"
                  value={scenario.constructionCostChange}
                  onChange={(e) => setScenario({...scenario, constructionCostChange: parseFloat(e.target.value)})}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-gray-600 mt-1">
                  <span>-30%</span>
                  <span className="font-bold">{scenario.constructionCostChange}%</span>
                  <span>+30%</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Réduction Infrastructures (%)
                </label>
                <input
                  type="range"
                  min="0"
                  max="50"
                  value={scenario.infrastructureReduction}
                  onChange={(e) => setScenario({...scenario, infrastructureReduction: parseFloat(e.target.value)})}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-gray-600 mt-1">
                  <span>0%</span>
                  <span className="font-bold">{scenario.infrastructureReduction}%</span>
                  <span>50%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">💳 Besoins de Financement Individuels</h2>
            <button
              onClick={addParticipant}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded-lg transition-colors flex items-center gap-2"
            >
              <Users className="w-5 h-5" />
              Ajouter un participant
            </button>
          </div>
          
          <div className="space-y-6">
            {calculations.participantBreakdown.map((p, idx) => {
              const isExpanded = expandedParticipants[idx];

              return (
              <div
                key={idx}
                ref={(el) => { participantRefs.current[idx] = el; }}
                className="border border-gray-300 rounded-xl bg-white shadow-sm hover:shadow-md transition-shadow">

                {/* Always Visible Header */}
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <input
                          type="text"
                          value={p.name}
                          onChange={(e) => updateParticipantName(idx, e.target.value)}
                          className="text-xl font-bold text-gray-900 bg-transparent border-b-2 border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none px-1 py-1"
                          placeholder="Nom du participant"
                        />
                        {participants.length > 1 && (
                          <button
                            onClick={() => removeParticipant(idx)}
                            className="text-red-600 hover:text-red-700 text-xs font-medium px-2 py-1 rounded border border-red-300 hover:bg-red-50 transition-colors"
                          >
                            Retirer
                          </button>
                        )}
                        <button
                          onClick={() => setExpandedParticipants(prev => ({...prev, [idx]: !prev[idx]}))}
                          className="ml-auto text-gray-600 hover:text-gray-800 text-sm font-medium px-3 py-1 rounded border border-gray-300 hover:bg-gray-50 transition-colors flex items-center gap-2"
                        >
                          {isExpanded ? (
                            <>
                              <ChevronUp className="w-4 h-4" />
                              Réduire
                            </>
                          ) : (
                            <>
                              <ChevronDown className="w-4 h-4" />
                              Détails
                            </>
                          )}
                        </button>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <span className="text-gray-400">Unité</span>
                          <span className="font-medium text-blue-600">{p.unitId}</span>
                        </span>
                        <span className="text-gray-300">•</span>
                        <span>{p.surface}m²</span>
                        <span className="text-gray-300">•</span>
                        <span>{p.quantity || 1} {(p.quantity || 1) > 1 ? 'unités' : 'unité'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Key Financial Metrics - Always Visible */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                      <p className="text-xs text-gray-500 mb-1">Coût Total</p>
                      <p className="text-lg font-bold text-gray-900">{formatCurrency(p.totalCost)}</p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-3 border border-green-300">
                      <p className="text-xs text-gray-600 mb-1">Capital apporté</p>
                      <p className="text-lg font-bold text-green-700">{formatCurrency(p.capitalApporte)}</p>
                    </div>
                    <div className="bg-red-50 rounded-lg p-3 border border-red-300">
                      <p className="text-xs text-gray-600 mb-1">Emprunt</p>
                      <p className="text-lg font-bold text-red-700">{formatCurrency(p.loanNeeded)}</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-gray-200">
                      <p className="text-xs text-gray-500 mb-1">Mensualité</p>
                      <p className="text-lg font-bold text-red-600">{formatCurrency(p.monthlyPayment)}</p>
                    </div>
                  </div>
                </div>

                {/* Expandable Details */}
                {isExpanded && (
                  <div className="px-6 pb-6 border-t border-gray-200 pt-4">{/* Configuration Section */}
                <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-3">Configuration</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Surface totale (m²)</label>
                      <input
                        type="number"
                        step="1"
                        value={p.surface}
                        onChange={(e) => updateParticipantSurface(idx, parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 font-medium border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white"
                      />
                      <p className="text-xs text-gray-500 mt-1">Total pour {p.quantity || 1} {(p.quantity || 1) > 1 ? 'unités' : 'unité'}</p>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Quantité</label>
                      <input
                        type="number"
                        step="1"
                        min="1"
                        value={p.quantity}
                        onChange={(e) => updateQuantity(idx, parseInt(e.target.value) || 1)}
                        className="w-full px-3 py-2 font-medium border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Capital apporté</label>
                      <input
                        type="number"
                        step="10000"
                        value={p.capitalApporte}
                        onChange={(e) => updateCapital(idx, parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 text-base font-semibold border border-green-300 rounded-lg focus:border-green-500 focus:ring-1 focus:ring-green-500 focus:outline-none bg-white text-green-700"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Frais de notaire</label>
                      <div className="flex items-center gap-2 mb-1">
                        <label className="flex items-center gap-1.5 cursor-pointer px-3 py-2 border rounded-lg transition-colors hover:bg-gray-100" style={{
                          borderColor: p.notaryFeesRate === 3 ? '#9ca3af' : '#e5e7eb',
                          backgroundColor: p.notaryFeesRate === 3 ? '#f3f4f6' : 'white'
                        }}>
                          <input
                            type="radio"
                            name={`notaryRate-${idx}`}
                            value="3"
                            checked={p.notaryFeesRate === 3}
                            onChange={(e) => updateNotaryRate(idx, parseFloat(e.target.value))}
                            className="w-4 h-4"
                          />
                          <span className="font-medium text-gray-700 text-sm">3%</span>
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer px-3 py-2 border rounded-lg transition-colors hover:bg-gray-100" style={{
                          borderColor: p.notaryFeesRate === 12.5 ? '#9ca3af' : '#e5e7eb',
                          backgroundColor: p.notaryFeesRate === 12.5 ? '#f3f4f6' : 'white'
                        }}>
                          <input
                            type="radio"
                            name={`notaryRate-${idx}`}
                            value="12.5"
                            checked={p.notaryFeesRate === 12.5}
                            onChange={(e) => updateNotaryRate(idx, parseFloat(e.target.value))}
                            className="w-4 h-4"
                          />
                          <span className="font-medium text-gray-700 text-sm">12.5%</span>
                        </label>
                      </div>
                      <div className="text-sm text-gray-600">
                        = {formatCurrency(p.notaryFees)}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Taux d'intérêt (%)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={p.interestRate}
                        onChange={(e) => updateInterestRate(idx, parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 font-medium border border-gray-300 rounded-lg focus:border-gray-500 focus:ring-1 focus:ring-gray-500 focus:outline-none bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Durée (années)</label>
                      <input
                        type="number"
                        value={p.durationYears}
                        onChange={(e) => updateDuration(idx, parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 font-medium border border-gray-300 rounded-lg focus:border-gray-500 focus:ring-1 focus:ring-gray-500 focus:outline-none bg-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Cost Breakdown */}
                <div className="mb-4">
                  <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-2">Décomposition des Coûts</p>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                    <div className="bg-white rounded-lg p-3 border border-gray-200">
                      <p className="text-xs text-gray-500 mb-1">Part d'achat</p>
                      <p className="text-base font-bold text-gray-900">{formatCurrency(p.purchaseShare)}</p>
                      <p className="text-xs text-blue-600 mt-0.5">{p.surface}m²</p>
                    </div>

                    <div className="bg-white rounded-lg p-3 border border-gray-200">
                      <p className="text-xs text-gray-500 mb-1">Frais notaire</p>
                      <p className="text-base font-bold text-gray-900">{formatCurrency(p.notaryFees)}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{p.notaryFeesRate}%</p>
                    </div>

                    <div className="bg-white rounded-lg p-3 border border-gray-200">
                      <p className="text-xs text-gray-500 mb-1">Construction</p>
                      <p className="text-base font-bold text-gray-900">{formatCurrency(p.constructionCost)}</p>
                      {(p.quantity || 1) > 1 && (
                        <p className="text-xs text-gray-400 mt-0.5">{formatCurrency(p.constructionCostPerUnit)}/u</p>
                      )}
                    </div>

                    <div className="bg-white rounded-lg p-3 border border-purple-200">
                      <p className="text-xs text-gray-500 mb-1">Quote-part</p>
                      <p className="text-base font-bold text-purple-700">{formatCurrency(p.sharedCosts)}</p>
                    </div>

                    <div className="bg-green-50 rounded-lg p-3 border border-green-300">
                      <p className="text-xs text-gray-600 mb-1">Capital apporté</p>
                      <p className="text-base font-bold text-green-700">{formatCurrency(p.capitalApporte)}</p>
                    </div>
                  </div>
                </div>

                {/* Construction Detail */}
                <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-3">Détail Construction</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                    {/* CASCO - Display only (not editable) */}
                    <div className="bg-white p-3 rounded-lg border border-gray-200">
                      <p className="text-xs text-gray-500 mb-1">CASCO (gros œuvre)</p>
                      <p className="text-lg font-bold text-gray-900">{formatCurrency(p.casco)}</p>
                      <p className="text-xs text-gray-400">
                        {participants[idx].cascoSqm || p.surface}m² × {projectParams.globalCascoPerM2}€/m² (global)
                      </p>
                    </div>

                    {/* Parachèvements - Editable */}
                    <div className="bg-white p-3 rounded-lg border border-gray-200">
                      <label className="block text-xs text-gray-500 mb-1">Parachèvements - Prix/m²</label>
                      <input
                        type="number"
                        step="10"
                        value={participants[idx].parachevementsPerM2}
                        onChange={(e) => updateParachevementsPerM2(idx, parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 text-sm font-semibold border border-gray-300 rounded-lg focus:border-gray-500 focus:ring-1 focus:ring-gray-500 focus:outline-none mb-2"
                      />
                      <p className="text-xs text-gray-500">Total: <span className="font-bold text-gray-900">{formatCurrency(p.parachevements)}</span></p>
                      <p className="text-xs text-gray-400">{participants[idx].parachevementsSqm || p.surface}m² × {participants[idx].parachevementsPerM2}€/m²</p>
                    </div>

                    {/* Travaux communs - unchanged */}
                    <div className="bg-white p-3 rounded-lg border border-purple-200">
                      <p className="text-xs text-gray-500 mb-1">Travaux communs</p>
                      <p className="text-lg font-bold text-purple-700 mt-2">{formatCurrency(p.travauxCommunsPerUnit)}</p>
                      <p className="text-xs text-purple-500 mt-1">Quote-part fixe (÷{participants.length})</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                      <label className="block text-xs text-blue-700 font-medium mb-1">Surface à rénover CASCO (m²)</label>
                      <input
                        type="number"
                        step="1"
                        min="0"
                        max={p.surface}
                        value={participants[idx].cascoSqm || p.surface}
                        onChange={(e) => updateCascoSqm(idx, parseFloat(e.target.value) || undefined)}
                        className="w-full px-3 py-2 text-sm font-semibold border border-blue-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                        placeholder={`${p.surface}m² (total)`}
                      />
                      <p className="text-xs text-blue-600 mt-1">Surface totale: {p.surface}m²</p>
                    </div>
                    <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                      <label className="block text-xs text-blue-700 font-medium mb-1">Surface à rénover Parachèvements (m²)</label>
                      <input
                        type="number"
                        step="1"
                        min="0"
                        max={p.surface}
                        value={participants[idx].parachevementsSqm || p.surface}
                        onChange={(e) => updateParachevementsSqm(idx, parseFloat(e.target.value) || undefined)}
                        className="w-full px-3 py-2 text-sm font-semibold border border-blue-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                        placeholder={`${p.surface}m² (total)`}
                      />
                      <p className="text-xs text-blue-600 mt-1">Surface totale: {p.surface}m²</p>
                    </div>
                  </div>
                </div>

                {/* Financing Result */}
                <div className="bg-red-50 rounded-lg p-5 border border-red-200">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Emprunt Nécessaire</p>
                      <p className="text-sm text-gray-600">{p.financingRatio.toFixed(1)}% du coût à financer</p>
                    </div>
                    <p className="text-3xl font-bold text-red-700">{formatCurrency(p.loanNeeded)}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3 border-t border-red-200">
                    <div className="bg-white rounded-lg p-3 border border-gray-200">
                      <p className="text-xs text-gray-500 mb-1">Mensualité</p>
                      <p className="text-lg font-bold text-red-600">{formatCurrency(p.monthlyPayment)}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{p.durationYears} ans @ {p.interestRate}%</p>
                    </div>

                    <div className="bg-white rounded-lg p-3 border border-gray-200">
                      <p className="text-xs text-gray-500 mb-1">Total Remboursé</p>
                      <p className="text-lg font-bold text-gray-900">{formatCurrency(p.totalRepayment)}</p>
                    </div>

                    <div className="bg-white rounded-lg p-3 border border-red-200">
                      <p className="text-xs text-gray-500 mb-1">Coût Crédit</p>
                      <p className="text-lg font-bold text-red-700">{formatCurrency(p.totalInterest)}</p>
                    </div>
                  </div>
                </div>
                  </div>
                )}
              </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Synthèse Globale</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h3 className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-3">Projet</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Coût total:</span>
                  <span className="font-bold text-gray-900">{formatCurrency(calculations.totals.total)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Capital total:</span>
                  <span className="font-bold text-green-700">{formatCurrency(calculations.totals.capitalTotal)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-gray-300">
                  <span className="text-gray-600">Total emprunts:</span>
                  <span className="font-bold text-red-700">{formatCurrency(calculations.totals.totalLoansNeeded)}</span>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h3 className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-3">Moyennes</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Coût/personne:</span>
                  <span className="font-bold text-gray-900">{formatCurrency(calculations.totals.total / participants.length)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Capital moyen:</span>
                  <span className="font-bold text-green-700">{formatCurrency(calculations.totals.averageCapital)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Emprunt moyen:</span>
                  <span className="font-bold text-red-700">{formatCurrency(calculations.totals.averageLoan)}</span>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h3 className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-3">Fourchettes</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Emprunt min:</span>
                  <span className="font-bold text-gray-900">{formatCurrency(Math.min(...calculations.participantBreakdown.map(p => p.loanNeeded)))}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Emprunt max:</span>
                  <span className="font-bold text-gray-900">{formatCurrency(Math.max(...calculations.participantBreakdown.map(p => p.loanNeeded)))}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Écart:</span>
                  <span className="font-bold text-gray-900">{formatCurrency(Math.max(...calculations.participantBreakdown.map(p => p.loanNeeded)) - Math.min(...calculations.participantBreakdown.map(p => p.loanNeeded)))}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <h4 className="text-sm font-semibold text-gray-800 mb-3">Leviers d'Optimisation</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-sm text-gray-700">
              <div>• Négocier prix d'achat (-10% = €65K économisés)</div>
              <div>• Subventions rénovation Wallonie</div>
              <div>• Réduire coûts construction (value engineering)</div>
              <div>• Auto-construction partielle</div>
              <div>• Optimiser infrastructures (phaser les travaux)</div>
              <div>• Négocier meilleur taux d'intérêt</div>
              <div>• Augmenter capital apporté si possible</div>
              <div>• Vendre une 5ème unité en pré-construction</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}