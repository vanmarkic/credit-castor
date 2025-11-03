import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ChevronDown, ChevronUp, Users } from 'lucide-react';
import * as Tooltip from '@radix-ui/react-tooltip';
import { calculateAll } from '../utils/calculatorUtils';
import { exportCalculations } from '../utils/excelExport';
import { XlsxWriter } from '../utils/exportWriter';
import { ParticipantsTimeline } from './calculator/ParticipantsTimeline';
import { ProjectHeader } from './calculator/ProjectHeader';
import { ParticipantDetailsPanel } from './calculator/ParticipantDetailsPanel';
import ParticipantDetailModal from './calculator/ParticipantDetailModal';
import { FormulaTooltip } from './FormulaTooltip';
import { formatCurrency } from '../utils/formatting';
import {
  getPricePerM2Formula,
  getTotalProjectCostFormula,
  getTotalLoansFormula
} from '../utils/formulaExplanations';
import {
  DEFAULT_PARTICIPANTS,
  DEFAULT_PROJECT_PARAMS,
  DEFAULT_SCENARIO,
  DEFAULT_DEED_DATE,
  savePinnedParticipant,
  loadPinnedParticipant,
  clearPinnedParticipant,
  saveToLocalStorage,
  loadFromLocalStorage,
  clearLocalStorage
} from '../utils/storage';

export default function EnDivisionCorrect() {
  const [participants, setParticipants] = useState(() => {
    const stored = loadFromLocalStorage();
    const baseParticipants = stored ? stored.participants : DEFAULT_PARTICIPANTS;

    // Ensure all participants have isFounder and entryDate
    return baseParticipants.map((p: any) => ({
      ...p,
      isFounder: p.isFounder !== undefined ? p.isFounder : true,
      entryDate: p.entryDate || new Date(stored?.deedDate || DEFAULT_DEED_DATE)
    }));
  });

  const [expandedParticipants, setExpandedParticipants] = useState<{[key: number]: boolean}>({});
  const [pinnedParticipant, setPinnedParticipant] = useState<string | null>(() => loadPinnedParticipant());
  const [fullscreenParticipantIndex, setFullscreenParticipantIndex] = useState<number | null>(null);

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
      parachevementsPerM2: 500,
      isFounder: true,
      entryDate: new Date(deedDate)
    }]);

    // Scroll to the newly added participant (will be at the last index after state update)
    setTimeout(() => {
      const newIndex = participants.length; // This will be the index of the newly added participant
      if (participantRefs.current[newIndex]?.scrollIntoView) {
        participantRefs.current[newIndex].scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 50);
  };

  const removeParticipant = (index: number) => {
    if (participants.length > 1) {
      // If removing the pinned participant, clear the pin
      if (participants[index].name === pinnedParticipant) {
        handleUnpinParticipant();
      }
      const newParticipants = participants.filter((_: any, i: number) => i !== index);
      setParticipants(newParticipants);
    }
  };

  const updateParticipantName = (index: number, name: string) => {
    const oldName = participants[index].name;
    const newParticipants = [...participants];
    newParticipants[index].name = name;
    setParticipants(newParticipants);

    // If renaming the pinned participant, update the pin
    if (oldName === pinnedParticipant) {
      savePinnedParticipant(name);
      setPinnedParticipant(name);
    }
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

  const [deedDate, setDeedDate] = useState(() => {
    const stored = loadFromLocalStorage();
    return stored?.deedDate || DEFAULT_DEED_DATE;
  });

  // Auto-save to localStorage whenever state changes
  useEffect(() => {
    saveToLocalStorage(participants, projectParams, scenario, deedDate);
  }, [participants, projectParams, scenario, deedDate]);

  const calculations = useMemo(() => {
    return calculateAll(participants, projectParams, scenario, unitDetails);
  }, [participants, projectParams, scenario]);

  // Reorder participant breakdown to show pinned participant first
  const orderedParticipantBreakdown = useMemo(() => {
    if (!pinnedParticipant) {
      return calculations.participantBreakdown;
    }

    const pinnedIndex = calculations.participantBreakdown.findIndex(
      (p) => p.name === pinnedParticipant
    );

    if (pinnedIndex === -1) {
      // Pinned participant not found, return original order
      return calculations.participantBreakdown;
    }

    // Move pinned participant to the front
    const reordered = [...calculations.participantBreakdown];
    const [pinnedItem] = reordered.splice(pinnedIndex, 1);
    reordered.unshift(pinnedItem);

    return reordered;
  }, [calculations.participantBreakdown, pinnedParticipant]);

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

  const handlePinParticipant = (participantName: string) => {
    savePinnedParticipant(participantName);
    setPinnedParticipant(participantName);
  };

  const handleUnpinParticipant = () => {
    clearPinnedParticipant();
    setPinnedParticipant(null);
  };

  const addPortageLot = (participantIndex: number) => {
    const newLotId = Math.max(
      ...participants.flatMap((p: any) => p.lotsOwned?.map((l: any) => l.lotId) || []),
      0
    ) + 1;

    // Update participant lotsOwned array
    const newParticipants = [...participants];
    if (!newParticipants[participantIndex].lotsOwned) {
      newParticipants[participantIndex].lotsOwned = [];
    }

    // Increase quantity (number of lots)
    const currentQuantity = newParticipants[participantIndex].quantity || 1;
    newParticipants[participantIndex].quantity = currentQuantity + 1;

    // NOTE: Surface starts at 0, will be updated when user enters portage lot surface
    // Purchase share will grow when surface is set via updatePortageLotSurface

    newParticipants[participantIndex].lotsOwned.push({
      lotId: newLotId,
      surface: 0,
      unitId: newParticipants[participantIndex].unitId || 0,
      isPortage: true,
      allocatedSurface: 0,
      acquiredDate: new Date(deedDate),
      // Acquisition costs will be calculated dynamically based on new total costs
      originalPrice: undefined,
      originalNotaryFees: undefined,
      originalConstructionCost: undefined
    });

    setParticipants(newParticipants);
  };

  const removePortageLot = (participantIndex: number, lotId: number) => {
    const newParticipants = [...participants];
    if (newParticipants[participantIndex].lotsOwned) {
      // Find the lot being removed to get its surface
      const lotToRemove = newParticipants[participantIndex].lotsOwned.find((l: any) => l.lotId === lotId);

      // Remove the lot
      newParticipants[participantIndex].lotsOwned =
        newParticipants[participantIndex].lotsOwned.filter((l: any) => l.lotId !== lotId);

      // Decrease quantity
      const currentQuantity = newParticipants[participantIndex].quantity || 1;
      newParticipants[participantIndex].quantity = Math.max(1, currentQuantity - 1);

      // Decrease total surface by the removed lot's surface
      if (lotToRemove) {
        const currentSurface = newParticipants[participantIndex].surface || 0;
        newParticipants[participantIndex].surface = Math.max(0, currentSurface - (lotToRemove.surface || 0));
      }
    }
    setParticipants(newParticipants);
  };

  const updatePortageLotSurface = (participantIndex: number, lotId: number, surface: number) => {
    const newParticipants = [...participants];
    if (newParticipants[participantIndex].lotsOwned) {
      const lot = newParticipants[participantIndex].lotsOwned.find((l: any) => l.lotId === lotId);
      if (lot) {
        // Calculate the surface change
        const oldSurface = lot.surface || 0;
        const surfaceChange = surface - oldSurface;

        // Update lot surface
        lot.surface = surface;
        lot.allocatedSurface = surface;

        // Update participant's total surface
        const currentTotalSurface = newParticipants[participantIndex].surface || 0;
        newParticipants[participantIndex].surface = currentTotalSurface + surfaceChange;
      }
    }
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
    <Tooltip.Provider>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-100 p-6">
      <div className="max-w-7xl mx-auto">

        <ProjectHeader
          deedDate={deedDate}
          onDeedDateChange={setDeedDate}
          calculations={calculations}
          participants={participants}
          onDownloadScenario={downloadScenario}
          onLoadScenario={loadScenario}
          onResetToDefaults={resetToDefaults}
          onExportToExcel={exportToExcel}
          fileInputRef={fileInputRef}
          onFileUpload={handleFileUpload}
        />

        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Décomposition des Coûts</h2>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
            <div className="p-3 bg-white rounded-lg border border-gray-200">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Achat Total</p>
              <p className="text-lg font-bold text-gray-900">{formatCurrency(calculations.totals.purchase)}</p>
              <p className="text-xs text-blue-600 mt-1">
                <FormulaTooltip formula={getPricePerM2Formula(calculations.totals, calculations.totalSurface)}>
                  {formatCurrency(calculations.pricePerM2)}/m²
                </FormulaTooltip>
              </p>
            </div>
            <div className="p-3 bg-white rounded-lg border border-gray-200">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Frais de Notaire</p>
              <p className="text-lg font-bold text-gray-900">{formatCurrency(calculations.totals.totalNotaryFees)}</p>
              <p className="text-xs text-gray-400 mt-1">taux individuels</p>
            </div>
            <div className="p-3 bg-white rounded-lg border border-orange-200">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Rénovations Perso.</p>
              <p className="text-lg font-bold text-orange-700">{formatCurrency(calculations.participantBreakdown.reduce((sum, p) => sum + p.personalRenovationCost, 0))}</p>
              <p className="text-xs text-orange-500 mt-1">CASCO + Parachèv.</p>
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
              <p className="text-lg font-bold text-gray-900">
                <FormulaTooltip formula={getTotalProjectCostFormula()}>
                  {formatCurrency(calculations.totals.total)}
                </FormulaTooltip>
              </p>
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
        </div>

        <ParticipantsTimeline
          participants={participants}
          deedDate={deedDate}
        />

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
            {orderedParticipantBreakdown.map((p) => {
              // Find the original index in the participants array
              const idx = participants.findIndex((participant: any) => participant.name === p.name);
              const isExpanded = expandedParticipants[idx];

              return (
              <div
                key={idx}
                ref={(el) => { participantRefs.current[idx] = el; }}
                className="border border-gray-300 rounded-xl bg-white shadow-sm hover:shadow-md transition-shadow">

                {/* Always Visible Header */}
                <div
                  className={`cursor-pointer transition-all ${isExpanded ? 'p-6' : 'p-4'}`}
                  onClick={() => setFullscreenParticipantIndex(idx)}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <input
                          type="text"
                          value={p.name}
                          onChange={(e) => updateParticipantName(idx, e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          className="text-lg font-bold text-gray-900 bg-transparent border-b-2 border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none px-1 py-1"
                          placeholder="Nom du participant"
                        />
                        {participants.length > 1 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeParticipant(idx);
                            }}
                            className="text-red-600 hover:text-red-700 text-xs font-medium px-2 py-1 rounded border border-red-300 hover:bg-red-50 transition-colors"
                          >
                            Retirer
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedParticipants(prev => ({...prev, [idx]: !prev[idx]}));
                          }}
                          className="text-gray-600 hover:text-gray-800 text-xs font-medium px-2 py-1 rounded border border-gray-300 hover:bg-gray-50 transition-colors flex items-center gap-1"
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
                      <div className="flex items-center gap-3 text-sm text-gray-600 mt-1">
                        <span className="flex items-center gap-1">
                          <span className="text-gray-400">Unité</span>
                          <span className="font-medium text-blue-600">{p.unitId}</span>
                        </span>
                        <span className="text-gray-300">•</span>
                        <span>{p.surface}m²</span>
                        <span className="text-gray-300">•</span>
                        <span>{p.quantity || 1} {(p.quantity || 1) > 1 ? 'unités' : 'unité'}</span>
                        {participants[idx].entryDate && (
                          <>
                            <span className="text-gray-300">•</span>
                            <span className={`font-medium ${participants[idx].isFounder ? 'text-green-600' : 'text-blue-600'}`}>
                              Entrée: {new Date(participants[idx].entryDate).toLocaleDateString('fr-BE')}
                            </span>
                          </>
                        )}
                        {participants[idx].purchaseDetails?.buyingFrom && (
                          <>
                            <span className="text-gray-300">•</span>
                            <span className="text-purple-600 text-xs">
                              Achète de {participants[idx].purchaseDetails.buyingFrom}
                            </span>
                          </>
                        )}
                        {!isExpanded && (
                          <>
                            <span className="text-gray-300">•</span>
                            <span className="font-semibold text-gray-900">{formatCurrency(p.totalCost)}</span>
                            {(() => {
                              // Calculate total expected returns for founders
                              if (!participants[idx].isFounder) return null;

                              // 1. Portage paybacks
                              const portagePaybacks = participants
                                .filter((buyer: any) => buyer.purchaseDetails?.buyingFrom === participants[idx].name)
                                .map((buyer: any) => buyer.purchaseDetails?.purchasePrice || 0);

                              // 2. Copropriété redistributions
                              const coproSales = participants
                                .filter((buyer: any) => buyer.purchaseDetails?.buyingFrom === 'Copropriété')
                                .map((buyer: any) => ({
                                  entryDate: buyer.entryDate || new Date(deedDate),
                                  amount: buyer.purchaseDetails?.purchasePrice || 0
                                }));

                              const coproRedistributions = coproSales.map((sale: any) => {
                                const saleDate = new Date(sale.entryDate);
                                const participantEntryDate = participants[idx].entryDate
                                  ? new Date(participants[idx].entryDate)
                                  : new Date(deedDate);

                                if (participantEntryDate >= saleDate) return 0;

                                const monthsInProject = (saleDate.getTime() - participantEntryDate.getTime()) / (1000 * 60 * 60 * 24 * 30.44);
                                const eligibleParticipants = participants.filter((p: any) => {
                                  const pEntryDate = p.entryDate ? new Date(p.entryDate) : new Date(deedDate);
                                  return pEntryDate < saleDate;
                                });

                                const totalMonths = eligibleParticipants.reduce((sum: number, p: any) => {
                                  const pEntryDate = p.entryDate ? new Date(p.entryDate) : new Date(deedDate);
                                  const pMonths = (saleDate.getTime() - pEntryDate.getTime()) / (1000 * 60 * 60 * 24 * 30.44);
                                  return sum + pMonths;
                                }, 0);

                                const shareRatio = totalMonths > 0 ? monthsInProject / totalMonths : 0;
                                return sale.amount * shareRatio;
                              });

                              const totalReturns = portagePaybacks.reduce((sum: number, amt: number) => sum + amt, 0) +
                                                  coproRedistributions.reduce((sum: number, amt: number) => sum + amt, 0);

                              if (totalReturns > 0) {
                                return (
                                  <>
                                    <span className="text-gray-300">•</span>
                                    <span className="font-semibold text-purple-700">{formatCurrency(totalReturns)}</span>
                                  </>
                                );
                              }
                              return null;
                            })()}
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                </div>

                {/* Expandable Details */}
                {isExpanded && (
                  <ParticipantDetailsPanel
                    participant={participants[idx]}
                    participantCalc={p}
                    participantIndex={idx}
                    allParticipants={participants}
                    calculations={calculations}
                    projectParams={projectParams}
                    deedDate={deedDate}
                    pinnedParticipant={pinnedParticipant}
                    onPinParticipant={handlePinParticipant}
                    onUnpinParticipant={handleUnpinParticipant}
                    onUpdateParticipant={(index, updates) => {
                      const newParticipants = [...participants];
                      newParticipants[index] = { ...newParticipants[index], ...updates };
                      setParticipants(newParticipants);
                    }}
                    onUpdateParticipantSurface={updateParticipantSurface}
                    onUpdateCapital={updateCapital}
                    onUpdateNotaryRate={updateNotaryRate}
                    onUpdateQuantity={updateQuantity}
                    onUpdateParachevementsPerM2={updateParachevementsPerM2}
                    onUpdateCascoSqm={updateCascoSqm}
                    onUpdateParachevementsSqm={updateParachevementsSqm}
                    onUpdateInterestRate={updateInterestRate}
                    onUpdateDuration={updateDuration}
                    onAddPortageLot={addPortageLot}
                    onRemovePortageLot={removePortageLot}
                    onUpdatePortageLotSurface={updatePortageLotSurface}
                  />
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
                  <span className="font-bold text-gray-900">
                    <FormulaTooltip formula={getTotalProjectCostFormula()}>
                      {formatCurrency(calculations.totals.total)}
                    </FormulaTooltip>
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Capital total:</span>
                  <span className="font-bold text-green-700">{formatCurrency(calculations.totals.capitalTotal)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-gray-300">
                  <span className="text-gray-600">Total emprunts:</span>
                  <span className="font-bold text-red-700">
                    <FormulaTooltip formula={getTotalLoansFormula()}>
                      {formatCurrency(calculations.totals.totalLoansNeeded)}
                    </FormulaTooltip>
                  </span>
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

        {/* Full-screen participant detail modal */}
        {fullscreenParticipantIndex !== null && (() => {
          const idx = fullscreenParticipantIndex;
          const p = orderedParticipantBreakdown.find(pb => pb.name === participants[idx].name);
          if (!p) return null;

          return (
            <ParticipantDetailModal
              isOpen={true}
              onClose={() => setFullscreenParticipantIndex(null)}
              participantIndex={idx}
              participant={participants[idx]}
              participantBreakdown={p}
              deedDate={deedDate}
              allParticipants={participants}
              calculations={calculations}
              projectParams={projectParams}
              isPinned={pinnedParticipant === p.name}
              onPin={() => handlePinParticipant(p.name)}
              onUnpin={handleUnpinParticipant}
              onUpdateName={(name) => updateParticipantName(idx, name)}
              onUpdateSurface={(surface) => updateParticipantSurface(idx, surface)}
              onUpdateCapital={(value) => updateCapital(idx, value)}
              onUpdateNotaryRate={(rate) => updateNotaryRate(idx, rate)}
              onUpdateInterestRate={(rate) => updateInterestRate(idx, rate)}
              onUpdateDuration={(years) => updateDuration(idx, years)}
              onUpdateQuantity={(qty) => updateQuantity(idx, qty)}
              onUpdateParachevementsPerM2={(value) => updateParachevementsPerM2(idx, value)}
              onUpdateCascoSqm={(value) => updateCascoSqm(idx, value)}
              onUpdateParachevementsSqm={(value) => updateParachevementsSqm(idx, value)}
              onUpdateParticipant={(updated) => {
                const newParticipants = [...participants];
                newParticipants[idx] = updated;
                setParticipants(newParticipants);
              }}
              onAddPortageLot={() => addPortageLot(idx)}
              onRemovePortageLot={(lotId) => removePortageLot(idx, lotId)}
              onUpdatePortageLotSurface={(lotId, surface) => updatePortageLotSurface(idx, lotId, surface)}
            />
          );
        })()}
      </div>
      </div>
    </Tooltip.Provider>
  );
}