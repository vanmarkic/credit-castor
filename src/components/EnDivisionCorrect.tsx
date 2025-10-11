import React, { useState, useMemo } from 'react';
import { Calculator, Users, DollarSign, Home, Building2, Wallet, TrendingUp, Download } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function EnDivisionCorrect() {
  const [participants, setParticipants] = useState([
    { name: 'Manuela/Dragan', capitalApporte: 50000, notaryFeesRate: 12.5, unitId: 1, surface: 112, interestRate: 4.5, durationYears: 25, quantity: 1 },
    { name: 'Cathy/Jim', capitalApporte: 170000, notaryFeesRate: 12.5, unitId: 3, surface: 134, interestRate: 4.5, durationYears: 25, quantity: 1 },
    { name: 'Annabelle/Colin', capitalApporte: 200000, notaryFeesRate: 12.5, unitId: 5, surface: 118, interestRate: 4.5, durationYears: 25, quantity: 1 },
    { name: 'Julie/Séverin', capitalApporte: 70000, notaryFeesRate: 12.5, unitId: 6, surface: 108, interestRate: 4.5, durationYears: 25, quantity: 1 }
  ]);

  const addParticipant = () => {
    const newId = Math.max(...participants.map(p => p.unitId), 0) + 1;
    setParticipants([...participants, {
      name: 'Participant ' + (participants.length + 1),
      capitalApporte: 100000,
      notaryFeesRate: 12.5,
      unitId: newId,
      surface: 100,
      interestRate: 4.5,
      durationYears: 25,
      quantity: 1
    }]);
  };

  const removeParticipant = (index) => {
    if (participants.length > 1) {
      const newParticipants = participants.filter((_, i) => i !== index);
      setParticipants(newParticipants);
    }
  };

  const updateParticipantName = (index, name) => {
    const newParticipants = [...participants];
    newParticipants[index].name = name;
    setParticipants(newParticipants);
  };

  const updateParticipantSurface = (index, surface) => {
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

  const [projectParams, setProjectParams] = useState({
    totalPurchase: 650000,
    mesuresConservatoires: 20000,
    demolition: 40000,
    infrastructures: 90000,
    etudesPreparatoires: 59820,
    fraisEtudesPreparatoires: 27320,
    fraisGeneraux3ans: 136825.63,
    batimentFondationConservatoire: 43700,
    batimentFondationComplete: 269200,
    batimentCoproConservatoire: 56000
  });

  const [loanParams, setLoanParams] = useState({
    interestRate: 4.5,
    durationYears: 25
  });

  const [scenario, setScenario] = useState({
    constructionCostChange: 0,
    infrastructureReduction: 0,
    purchasePriceReduction: 0
  });

  const calculations = useMemo(() => {
    const totalSurface = participants.reduce((sum, p) => sum + p.surface, 0);
    const adjustedPurchase = projectParams.totalPurchase * (1 - scenario.purchasePriceReduction / 100);
    const pricePerM2 = adjustedPurchase / totalSurface;
    
    const sharedCosts = 
      projectParams.mesuresConservatoires +
      projectParams.demolition +
      (projectParams.infrastructures * (1 - scenario.infrastructureReduction / 100)) +
      projectParams.etudesPreparatoires +
      projectParams.fraisEtudesPreparatoires +
      projectParams.fraisGeneraux3ans;
    
    const sharedPerPerson = sharedCosts / participants.length;
    
    const totalTravauxCommuns = 
      projectParams.batimentFondationConservatoire +
      projectParams.batimentFondationComplete +
      projectParams.batimentCoproConservatoire;
    const travauxCommunsPerUnit = totalTravauxCommuns / participants.length;
    
    const participantBreakdown = participants.map(p => {
      let casco, parachevements;

      if (unitDetails[p.unitId]) {
        casco = unitDetails[p.unitId].casco;
        parachevements = unitDetails[p.unitId].parachevements;
      } else {
        casco = p.surface * 1590;
        parachevements = p.surface * 500;
      }

      const quantity = p.quantity || 1;
      const purchaseShare = p.surface * pricePerM2 * quantity;
      const notaryFees = purchaseShare * (p.notaryFeesRate / 100);

      const constructionCostPerUnit =
        (casco * (1 + scenario.constructionCostChange / 100)) +
        (parachevements * (1 + scenario.constructionCostChange / 100)) +
        travauxCommunsPerUnit;
      const constructionCost = constructionCostPerUnit * quantity;

      const totalCost = purchaseShare + notaryFees + constructionCost + sharedPerPerson;
      const loanNeeded = totalCost - p.capitalApporte;
      const financingRatio = (loanNeeded / totalCost) * 100;
      
      const monthlyRate = (p.interestRate / 100) / 12;
      const months = p.durationYears * 12;
      const monthlyPayment = loanNeeded > 0 
        ? loanNeeded * (monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1)
        : 0;
      
      const totalRepayment = monthlyPayment * months;
      const totalInterest = totalRepayment - loanNeeded;
      
      return {
        ...p,
        quantity,
        pricePerM2,
        purchaseShare,
        notaryFees,
        casco,
        parachevements,
        constructionCost,
        constructionCostPerUnit,
        travauxCommunsPerUnit,
        sharedCosts: sharedPerPerson,
        totalCost,
        loanNeeded,
        financingRatio,
        monthlyPayment,
        totalRepayment,
        totalInterest
      };
    });

    const totals = {
      purchase: adjustedPurchase,
      totalNotaryFees: participantBreakdown.reduce((sum, p) => sum + p.notaryFees, 0),
      construction: participantBreakdown.reduce((sum, p) => sum + p.constructionCost, 0),
      shared: sharedCosts,
      totalTravauxCommuns,
      travauxCommunsPerUnit,
      total: adjustedPurchase + 
             participantBreakdown.reduce((sum, p) => sum + p.notaryFees, 0) +
             participantBreakdown.reduce((sum, p) => sum + p.constructionCost, 0) + 
             sharedCosts,
      capitalTotal: participants.reduce((sum, p) => sum + p.capitalApporte, 0),
      totalLoansNeeded: participantBreakdown.reduce((sum, p) => sum + p.loanNeeded, 0),
      averageLoan: participantBreakdown.reduce((sum, p) => sum + p.loanNeeded, 0) / participants.length,
      averageCapital: participants.reduce((sum, p) => sum + p.capitalApporte, 0) / participants.length
    };

    return {
      totalSurface,
      pricePerM2,
      sharedCosts,
      sharedPerPerson,
      participantBreakdown,
      totals
    };
  }, [participants, projectParams, loanParams, scenario]);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('fr-FR', { 
      style: 'currency', 
      currency: 'EUR',
      maximumFractionDigits: 0 
    }).format(value);
  };

  const updateCapital = (index, value) => {
    const newParticipants = [...participants];
    newParticipants[index].capitalApporte = value;
    setParticipants(newParticipants);
  };

  const updateNotaryRate = (index, value) => {
    const newParticipants = [...participants];
    newParticipants[index].notaryFeesRate = value;
    setParticipants(newParticipants);
  };

  const updateInterestRate = (index, value) => {
    const newParticipants = [...participants];
    newParticipants[index].interestRate = value;
    setParticipants(newParticipants);
  };

  const updateDuration = (index, value) => {
    const newParticipants = [...participants];
    newParticipants[index].durationYears = value;
    setParticipants(newParticipants);
  };

  const updateQuantity = (index, value) => {
    const newParticipants = [...participants];
    newParticipants[index].quantity = Math.max(1, value);
    setParticipants(newParticipants);
  };

  const exportToExcel = () => {
    const wb = XLSX.utils.book_new();
    
    // Créer une seule feuille avec toutes les données
    const wsData = [
      ['ACHAT EN DIVISION - CALCULATEUR IMMOBILIER'],
      ['Wallonie, Belgique - ' + new Date().toLocaleDateString('fr-FR')],
      [],
      ['PARAMETRES DU PROJET'],
      ['Prix achat total', projectParams.totalPurchase],
      ['Reduction negociee (%)', scenario.purchasePriceReduction],
      ['Prix achat ajuste'],
      ['Surface totale (m2)', calculations.totalSurface],
      ['Prix par m2'],
      [],
      ['SCENARIOS D OPTIMISATION'],
      ['Variation couts construction (%)', scenario.constructionCostChange],
      ['Reduction infrastructures (%)', scenario.infrastructureReduction],
      [],
      ['COUTS PARTAGES'],
      ['Mesures conservatoires', projectParams.mesuresConservatoires],
      ['Demolition', projectParams.demolition],
      ['Infrastructures', projectParams.infrastructures],
      ['Infrastructures ajustees'],
      ['Etudes preparatoires', projectParams.etudesPreparatoires],
      ['Frais Etudes preparatoires', projectParams.fraisEtudesPreparatoires],
      ['Frais Generaux 3 ans', projectParams.fraisGeneraux3ans],
      ['Total quote-part'],
      ['Quote-part par personne'],
      [],
      ['TRAVAUX COMMUNS'],
      ['Batiment fondation (conservatoire)', projectParams.batimentFondationConservatoire],
      ['Batiment fondation (complete)', projectParams.batimentFondationComplete],
      ['Batiment copro (conservatoire)', projectParams.batimentCoproConservatoire],
      ['Total travaux communs'],
      ['Par unite'],
      [],
      ['DECOMPOSITION DES COUTS'],
      ['Achat Total'],
      ['Frais de Notaire'],
      ['Construction'],
      ['Quote-part Infrastructure'],
      ['TOTAL PROJET'],
      [],
      ['DETAIL PAR PARTICIPANT']
    ];
    
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    
    // Ajouter les formules pour la section paramètres
    ws['B7'] = { t: 'n', f: 'B5*(1-B6/100)' };
    ws['B9'] = { t: 'n', f: 'B7/B8' };
    
    // Formules pour coûts partagés
    ws['B21'] = { t: 'n', f: 'B20*(1-B13/100)' };
    ws['B25'] = { t: 'n', f: 'B18+B19+B21+B22+B23+B24' };
    ws['B26'] = { t: 'n', f: 'B25/' + participants.length };
    
    // Formules pour travaux communs
    ws['B32'] = { t: 'n', f: 'B29+B30+B31' };
    ws['B33'] = { t: 'n', f: 'B32/' + participants.length };
    
    // Formules pour décomposition des coûts
    ws['B36'] = { t: 'n', f: 'B7' };
    ws['B37'] = { t: 'n', f: 'SUM(I41:I' + (40 + participants.length) + ')' };
    ws['B38'] = { t: 'n', f: 'SUM(M41:M' + (40 + participants.length) + ')' };
    ws['B39'] = { t: 'n', f: 'B25' };
    ws['B40'] = { t: 'n', f: 'B36+B37+B38+B39' };
    
    // Ajouter les en-têtes de colonnes du détail
    const headerRow = ['Nom', 'Unite', 'Surface', 'Capital', 'Taux notaire', 'Taux interet', 'Duree (ans)', 'Part achat', 'Frais notaire', 'CASCO', 'Parachevements', 'Travaux communs', 'Construction', 'Quote-part', 'TOTAL', 'Emprunt', 'Mensualite', 'Total rembourse'];
    XLSX.utils.sheet_add_aoa(ws, [headerRow], { origin: 'A40' });
    
    // Ajouter les participants avec formules
    calculations.participantBreakdown.forEach((p, idx) => {
      const r = 41 + idx;
      const row = [
        p.name,
        p.unitId,
        p.surface,
        p.capitalApporte,
        p.notaryFeesRate,
        p.interestRate,
        p.durationYears,
        null, // Part achat - formule
        null, // Frais notaire - formule
        p.casco,
        p.parachevements,
        null, // Travaux communs - formule
        null, // Construction - formule
        null, // Quote-part - formule
        null, // TOTAL - formule
        null, // Emprunt - formule
        null, // Mensualité - formule
        null  // Total remboursé - formule
      ];
      XLSX.utils.sheet_add_aoa(ws, [row], { origin: 'A' + r });
      
      // Formules pour chaque participant
      ws['H' + r] = { t: 'n', f: 'C' + r + '*$B$9' };
      ws['I' + r] = { t: 'n', f: 'H' + r + '*E' + r + '/100' };
      ws['L' + r] = { t: 'n', f: '$B$33' };
      ws['M' + r] = { t: 'n', f: '(J' + r + '+K' + r + ')*(1+$B$12/100)+L' + r };
      ws['N' + r] = { t: 'n', f: '$B$26' };
      ws['O' + r] = { t: 'n', f: 'H' + r + '+I' + r + '+M' + r + '+N' + r };
      ws['P' + r] = { t: 'n', f: 'O' + r + '-D' + r };
      ws['Q' + r] = { t: 'n', f: 'PMT(F' + r + '/100/12,G' + r + '*12,P' + r + ')*-1' };
      ws['R' + r] = { t: 'n', f: 'Q' + r + '*G' + r + '*12' };
    });
    
    // Ajouter ligne totaux
    const totalRow = 41 + participants.length;
    const startRow = 41;
    const endRow = totalRow - 1;
    
    const totalRowData = [
      'TOTAL',
      '',
      null, // Surface - formule
      null, // Capital - formule
      '',
      '',
      '',
      null, // Part achat - formule
      null, // Frais notaire - formule
      null, // CASCO - formule
      null, // Parachevements - formule
      null, // Travaux communs - formule
      null, // Construction - formule
      null, // Quote-part - formule
      null, // TOTAL - formule
      null, // Emprunt - formule
      '',
      null  // Total remboursé - formule
    ];
    XLSX.utils.sheet_add_aoa(ws, [totalRowData], { origin: 'A' + totalRow });
    
    // Formules pour les totaux
    ws['C' + totalRow] = { t: 'n', f: 'SUM(C' + startRow + ':C' + endRow + ')' };
    ws['D' + totalRow] = { t: 'n', f: 'SUM(D' + startRow + ':D' + endRow + ')' };
    ws['H' + totalRow] = { t: 'n', f: 'SUM(H' + startRow + ':H' + endRow + ')' };
    ws['I' + totalRow] = { t: 'n', f: 'SUM(I' + startRow + ':I' + endRow + ')' };
    ws['J' + totalRow] = { t: 'n', f: 'SUM(J' + startRow + ':J' + endRow + ')' };
    ws['K' + totalRow] = { t: 'n', f: 'SUM(K' + startRow + ':K' + endRow + ')' };
    ws['L' + totalRow] = { t: 'n', f: 'SUM(L' + startRow + ':L' + endRow + ')' };
    ws['M' + totalRow] = { t: 'n', f: 'SUM(M' + startRow + ':M' + endRow + ')' };
    ws['N' + totalRow] = { t: 'n', f: 'SUM(N' + startRow + ':N' + endRow + ')' };
    ws['O' + totalRow] = { t: 'n', f: 'SUM(O' + startRow + ':O' + endRow + ')' };
    ws['P' + totalRow] = { t: 'n', f: 'SUM(P' + startRow + ':P' + endRow + ')' };
    ws['R' + totalRow] = { t: 'n', f: 'SUM(R' + startRow + ':R' + endRow + ')' };
    
    // Ajouter synthèse
    const synthRow = totalRow + 2;
    XLSX.utils.sheet_add_aoa(ws, [
      [],
      ['SYNTHESE GLOBALE'],
      ['Cout total projet', null],
      ['Capital total apporte', null],
      ['Total emprunts necessaires', null],
      ['Emprunt moyen', null],
      ['Emprunt minimum', null],
      ['Emprunt maximum', null]
    ], { origin: 'A' + synthRow });
    
    // Formules pour la synthèse
    ws['B' + (synthRow + 2)] = { t: 'n', f: 'O' + totalRow };
    ws['B' + (synthRow + 3)] = { t: 'n', f: 'D' + totalRow };
    ws['B' + (synthRow + 4)] = { t: 'n', f: 'P' + totalRow };
    ws['B' + (synthRow + 5)] = { t: 'n', f: 'AVERAGE(P' + startRow + ':P' + endRow + ')' };
    ws['B' + (synthRow + 6)] = { t: 'n', f: 'MIN(P' + startRow + ':P' + endRow + ')' };
    ws['B' + (synthRow + 7)] = { t: 'n', f: 'MAX(P' + startRow + ':P' + endRow + ')' };
    
    // Définir la largeur des colonnes
    ws['!cols'] = [
      {wch: 25}, {wch: 8}, {wch: 10}, {wch: 15}, {wch: 14},
      {wch: 12}, {wch: 12}, {wch: 15}, {wch: 15}, {wch: 15},
      {wch: 15}, {wch: 15}, {wch: 15}, {wch: 15}, {wch: 15},
      {wch: 15}, {wch: 15}, {wch: 15}
    ];
    
    XLSX.utils.book_append_sheet(wb, ws, 'Calculateur Division');
    
    const fileName = 'Calculateur_Division_' + new Date().toLocaleDateString('fr-FR').replace(/\//g, '-') + '.xlsx';
    XLSX.writeFile(wb, fileName);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-100 p-6">
      <div className="max-w-7xl mx-auto">
        
        <div className="bg-white rounded-xl shadow-2xl p-8 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Building2 className="w-12 h-12 text-blue-600" />
              <div>
                <h1 className="text-4xl font-bold text-gray-800">Achat en Division - 4 Unités</h1>
                <p className="text-gray-600">Wallonie, Belgique • Prix d'achat €650,000</p>
              </div>
            </div>
            <button
              onClick={exportToExcel}
              className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors flex items-center gap-2 shadow-lg"
            >
              <Download className="w-5 h-5" />
              Exporter Excel
            </button>
          </div>

          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800">
              <strong>📐 Principe:</strong> L'achat est fonction des m² (€{calculations.pricePerM2.toFixed(2)}/m²). 
              Le capital apporté est indépendant de la taille du logement.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-blue-50 rounded-lg p-4 border-2 border-blue-200">
              <Users className="w-8 h-8 text-blue-600 mb-2" />
              <p className="text-sm text-gray-600">Participants</p>
              <p className="text-3xl font-bold text-gray-800">{participants.length}</p>
            </div>

            <div className="bg-green-50 rounded-lg p-4 border-2 border-green-200">
              <Home className="w-8 h-8 text-green-600 mb-2" />
              <p className="text-sm text-gray-600">Surface</p>
              <p className="text-3xl font-bold text-gray-800">{calculations.totalSurface}m²</p>
            </div>

            <div className="bg-purple-50 rounded-lg p-4 border-2 border-purple-200">
              <DollarSign className="w-8 h-8 text-purple-600 mb-2" />
              <p className="text-sm text-gray-600">Coût Total</p>
              <p className="text-2xl font-bold text-gray-800">{formatCurrency(calculations.totals.total)}</p>
            </div>

            <div className="bg-orange-50 rounded-lg p-4 border-2 border-orange-200">
              <Wallet className="w-8 h-8 text-orange-600 mb-2" />
              <p className="text-sm text-gray-600">Capital Total</p>
              <p className="text-2xl font-bold text-gray-800">{formatCurrency(calculations.totals.capitalTotal)}</p>
            </div>

            <div className="bg-red-50 rounded-lg p-4 border-2 border-red-200">
              <Calculator className="w-8 h-8 text-red-600 mb-2" />
              <p className="text-sm text-gray-600">À Emprunter</p>
              <p className="text-2xl font-bold text-gray-800">{formatCurrency(calculations.totals.totalLoansNeeded)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Décomposition des Coûts</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-gray-600">Achat Total</p>
              <p className="text-xl font-bold text-gray-800">{formatCurrency(calculations.totals.purchase)}</p>
              <p className="text-xs text-gray-500 mt-1">{formatCurrency(calculations.pricePerM2)}/m²</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Frais de Notaire</p>
              <p className="text-xl font-bold text-gray-800">{formatCurrency(calculations.totals.totalNotaryFees)}</p>
              <p className="text-xs text-gray-500 mt-1">taux individuels</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Construction</p>
              <p className="text-xl font-bold text-gray-800">{formatCurrency(calculations.totals.construction)}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Quote-part Infrastr.</p>
              <p className="text-xl font-bold text-gray-800">{formatCurrency(calculations.sharedCosts)}</p>
              <p className="text-xs text-gray-500 mt-1">{formatCurrency(calculations.sharedPerPerson)}/pers</p>
            </div>
            <div className="p-4 bg-green-100 rounded-lg border-2 border-green-300">
              <p className="text-sm text-gray-600 font-semibold">TOTAL</p>
              <p className="text-xl font-bold text-green-600">{formatCurrency(calculations.totals.total)}</p>
            </div>
          </div>

          <div className="mt-6 p-4 bg-yellow-50 border-2 border-yellow-200 rounded-lg">
            <h3 className="font-semibold text-gray-800 mb-3">📋 Détail Quote-part (infrastructures extérieures):</h3>
            <p className="text-xs text-gray-600 mb-3">
              Les bâtiments communs (€368,900) sont dans "Construction" pour éviter le double comptage.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Mesures conservatoires</label>
                <input
                  type="number"
                  step="1000"
                  value={projectParams.mesuresConservatoires}
                  onChange={(e) => setProjectParams({...projectParams, mesuresConservatoires: parseFloat(e.target.value) || 0})}
                  className="w-full px-3 py-2 text-sm border-2 border-yellow-300 rounded-lg focus:border-yellow-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Démolition</label>
                <input
                  type="number"
                  step="1000"
                  value={projectParams.demolition}
                  onChange={(e) => setProjectParams({...projectParams, demolition: parseFloat(e.target.value) || 0})}
                  className="w-full px-3 py-2 text-sm border-2 border-yellow-300 rounded-lg focus:border-yellow-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Infrastructures</label>
                <input
                  type="number"
                  step="1000"
                  value={projectParams.infrastructures}
                  onChange={(e) => setProjectParams({...projectParams, infrastructures: parseFloat(e.target.value) || 0})}
                  className="w-full px-3 py-2 text-sm border-2 border-yellow-300 rounded-lg focus:border-yellow-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Études préparatoires</label>
                <input
                  type="number"
                  step="1000"
                  value={projectParams.etudesPreparatoires}
                  onChange={(e) => setProjectParams({...projectParams, etudesPreparatoires: parseFloat(e.target.value) || 0})}
                  className="w-full px-3 py-2 text-sm border-2 border-yellow-300 rounded-lg focus:border-yellow-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Frais Études préparatoires</label>
                <input
                  type="number"
                  step="1000"
                  value={projectParams.fraisEtudesPreparatoires}
                  onChange={(e) => setProjectParams({...projectParams, fraisEtudesPreparatoires: parseFloat(e.target.value) || 0})}
                  className="w-full px-3 py-2 text-sm border-2 border-yellow-300 rounded-lg focus:border-yellow-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Frais Généraux 3 ans</label>
                <input
                  type="number"
                  step="1000"
                  value={projectParams.fraisGeneraux3ans}
                  onChange={(e) => setProjectParams({...projectParams, fraisGeneraux3ans: parseFloat(e.target.value) || 0})}
                  className="w-full px-3 py-2 text-sm border-2 border-yellow-300 rounded-lg focus:border-yellow-500 focus:outline-none"
                />
              </div>
            </div>
            <div className="mt-3 p-3 bg-yellow-100 rounded-lg border-2 border-yellow-400">
              <div className="flex justify-between items-center">
                <p className="text-sm font-semibold text-gray-700">Total quote-part:</p>
                <p className="text-xl font-bold text-yellow-700">{formatCurrency(calculations.sharedCosts)}</p>
              </div>
              <p className="text-xs text-gray-600 mt-1">
                {formatCurrency(calculations.sharedPerPerson)} par personne
              </p>
            </div>
          </div>

          <div className="mt-4 p-4 bg-purple-50 border-2 border-purple-200 rounded-lg">
            <h3 className="font-semibold text-gray-800 mb-3">🏢 Travaux Communs (€{calculations.totals.totalTravauxCommuns.toLocaleString()} total):</h3>
            <p className="text-xs text-gray-600 mb-3">
              Ces coûts sont divisés par {participants.length} {participants.length > 1 ? 'unités' : 'unité'} = {formatCurrency(calculations.totals.travauxCommunsPerUnit)} par personne
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Bâtiment fondation (conservatoire)</label>
                <input
                  type="number"
                  step="1000"
                  value={projectParams.batimentFondationConservatoire}
                  onChange={(e) => setProjectParams({...projectParams, batimentFondationConservatoire: parseFloat(e.target.value) || 0})}
                  className="w-full px-3 py-2 text-sm border-2 border-purple-300 rounded-lg focus:border-purple-500 focus:outline-none"
                />
                <p className="text-xs text-gray-500 mt-1">200€/m² × 218.5m²</p>
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Bâtiment fondation (complète)</label>
                <input
                  type="number"
                  step="1000"
                  value={projectParams.batimentFondationComplete}
                  onChange={(e) => setProjectParams({...projectParams, batimentFondationComplete: parseFloat(e.target.value) || 0})}
                  className="w-full px-3 py-2 text-sm border-2 border-purple-300 rounded-lg focus:border-purple-500 focus:outline-none"
                />
                <p className="text-xs text-gray-500 mt-1">800€/m² × 336.5m²</p>
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Bâtiment copro (conservatoire)</label>
                <input
                  type="number"
                  step="1000"
                  value={projectParams.batimentCoproConservatoire}
                  onChange={(e) => setProjectParams({...projectParams, batimentCoproConservatoire: parseFloat(e.target.value) || 0})}
                  className="w-full px-3 py-2 text-sm border-2 border-purple-300 rounded-lg focus:border-purple-500 focus:outline-none"
                />
                <p className="text-xs text-gray-500 mt-1">200€/m² × 280m²</p>
              </div>
            </div>
            <div className="mt-3 p-3 bg-purple-100 rounded-lg border-2 border-purple-400">
              <div className="flex justify-between items-center">
                <p className="text-sm font-semibold text-gray-700">Total travaux communs:</p>
                <p className="text-xl font-bold text-purple-700">{formatCurrency(calculations.totals.totalTravauxCommuns)}</p>
              </div>
              <p className="text-xs text-gray-600 mt-1">
                {formatCurrency(calculations.totals.travauxCommunsPerUnit)} par unité (÷{participants.length})
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">🎛️ Scénarios d'Optimisation</h2>
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
            {calculations.participantBreakdown.map((p, idx) => (
              <div key={idx} className="border-2 border-blue-200 rounded-lg p-6 bg-gradient-to-r from-white to-blue-50">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <input
                        type="text"
                        value={p.name}
                        onChange={(e) => updateParticipantName(idx, e.target.value)}
                        className="text-2xl font-bold text-gray-800 bg-transparent border-b-2 border-transparent hover:border-blue-300 focus:border-blue-500 focus:outline-none px-2 py-1"
                        placeholder="Nom du participant"
                      />
                      {participants.length > 1 && (
                        <button
                          onClick={() => removeParticipant(idx)}
                          className="text-red-600 hover:text-red-800 text-sm font-semibold px-3 py-1 rounded border-2 border-red-300 hover:border-red-500 transition-colors"
                        >
                          Retirer
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <div className="flex items-center gap-2">
                        <p className="text-sm text-gray-600">Unité {p.unitId} •</p>
                        <input
                          type="number"
                          step="1"
                          min="1"
                          value={p.quantity}
                          onChange={(e) => updateQuantity(idx, parseInt(e.target.value) || 1)}
                          className="w-16 px-2 py-1 text-sm font-semibold border-2 border-blue-300 rounded focus:border-blue-500 focus:outline-none"
                        />
                        <p className="text-sm text-gray-600">{p.quantity > 1 ? 'unités' : 'unité'} •</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          step="1"
                          value={p.surface}
                          onChange={(e) => updateParticipantSurface(idx, parseFloat(e.target.value) || 0)}
                          className="w-20 px-2 py-1 text-sm font-semibold border-2 border-gray-300 rounded focus:border-blue-500 focus:outline-none"
                        />
                        <p className="text-sm text-gray-600">m²/unité • {formatCurrency(p.pricePerM2)}/m²</p>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Coût Total {p.quantity > 1 ? `(${p.quantity} unités)` : ''}</p>
                    <p className="text-3xl font-bold text-gray-800">{formatCurrency(p.totalCost)}</p>
                    {p.quantity > 1 && (
                      <p className="text-sm text-gray-500 mt-1">{formatCurrency(p.totalCost / p.quantity)}/unité</p>
                    )}
                  </div>
                </div>

                <div className="mb-4 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border-2 border-green-200">
                  <p className="text-sm font-semibold text-gray-700 mb-3">⚙️ Configuration:</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Capital apporté (€)</label>
                      <input
                        type="number"
                        step="10000"
                        value={p.capitalApporte}
                        onChange={(e) => updateCapital(idx, parseFloat(e.target.value) || 0)}
                        className="w-full px-4 py-2 text-lg font-bold border-2 border-green-300 rounded-lg focus:border-green-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Frais de notaire (%)</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          step="0.5"
                          value={p.notaryFeesRate}
                          onChange={(e) => updateNotaryRate(idx, parseFloat(e.target.value) || 0)}
                          className="flex-1 px-4 py-2 font-bold border-2 border-orange-300 rounded-lg focus:border-orange-500 focus:outline-none"
                        />
                        <span className="text-sm font-bold text-orange-600">
                          = {formatCurrency(p.notaryFees)}
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Taux d'intérêt (%)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={p.interestRate}
                        onChange={(e) => updateInterestRate(idx, parseFloat(e.target.value) || 0)}
                        className="w-full px-4 py-2 font-bold border-2 border-blue-300 rounded-lg focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Durée (années)</label>
                      <input
                        type="number"
                        value={p.durationYears}
                        onChange={(e) => updateDuration(idx, parseInt(e.target.value) || 0)}
                        className="w-full px-4 py-2 font-bold border-2 border-blue-300 rounded-lg focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
                  <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                    <p className="text-xs text-gray-600 mb-1">Part d'achat</p>
                    <p className="text-lg font-bold text-blue-600">{formatCurrency(p.purchaseShare)}</p>
                    <p className="text-xs text-gray-500">{p.surface * p.quantity}m² total</p>
                    {p.quantity > 1 && (
                      <p className="text-xs text-gray-400">{formatCurrency(p.purchaseShare / p.quantity)}/unité</p>
                    )}
                  </div>

                  <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                    <p className="text-xs text-gray-600 mb-1">Frais notaire</p>
                    <p className="text-lg font-bold text-orange-600">{formatCurrency(p.notaryFees)}</p>
                    <p className="text-xs text-gray-500">{p.notaryFeesRate}%</p>
                    {p.quantity > 1 && (
                      <p className="text-xs text-gray-400">{formatCurrency(p.notaryFees / p.quantity)}/unité</p>
                    )}
                  </div>

                  <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                    <p className="text-xs text-gray-600 mb-1">Construction</p>
                    <p className="text-lg font-bold text-purple-600">{formatCurrency(p.constructionCost)}</p>
                    {p.quantity > 1 && (
                      <p className="text-xs text-gray-400">{formatCurrency(p.constructionCostPerUnit)}/unité</p>
                    )}
                  </div>

                  <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                    <p className="text-xs text-gray-600 mb-1">Quote-part</p>
                    <p className="text-lg font-bold text-gray-600">{formatCurrency(p.sharedCosts)}</p>
                  </div>

                  <div className="bg-green-50 rounded-lg p-4 shadow-sm border-2 border-green-300">
                    <p className="text-xs text-gray-600 mb-1">Capital apporté</p>
                    <p className="text-lg font-bold text-green-600">{formatCurrency(p.capitalApporte)}</p>
                  </div>
                </div>
                
                <div className="mb-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <p className="text-xs font-semibold text-purple-800 mb-2">🔨 Détail Construction:</p>
                  <div className="grid grid-cols-3 gap-3 text-xs">
                    <div className="bg-white p-2 rounded">
                      <p className="text-gray-600">CASCO (gros œuvre)</p>
                      <p className="font-bold text-purple-700">{formatCurrency(p.casco)}</p>
                      <p className="text-gray-500">{(p.casco / p.surface).toFixed(0)}€/m²</p>
                    </div>
                    <div className="bg-white p-2 rounded">
                      <p className="text-gray-600">Parachèvements</p>
                      <p className="font-bold text-purple-700">{formatCurrency(p.parachevements)}</p>
                      <p className="text-gray-500">{(p.parachevements / p.surface).toFixed(0)}€/m²</p>
                    </div>
                    <div className="bg-white p-2 rounded">
                      <p className="text-gray-600">Travaux communs</p>
                      <p className="font-bold text-purple-700">{formatCurrency(p.travauxCommunsPerUnit)}</p>
                      <p className="text-xs text-gray-500">Quote-part fixe (÷{participants.length})</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-lg p-6 border-2 border-red-300">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h4 className="text-xl font-bold text-gray-800">💰 Emprunt Nécessaire</h4>
                      <p className="text-sm text-gray-600">{p.financingRatio.toFixed(1)}% du coût à financer</p>
                    </div>
                    <p className="text-4xl font-bold text-red-600">{formatCurrency(p.loanNeeded)}</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t-2 border-red-200">
                    <div className="bg-white rounded-lg p-3 shadow-sm">
                      <p className="text-xs text-gray-600 mb-1">Mensualité</p>
                      <p className="text-2xl font-bold text-orange-600">{formatCurrency(p.monthlyPayment)}</p>
                      <p className="text-xs text-gray-500">{p.durationYears} ans @ {p.interestRate}%</p>
                    </div>
                    
                    <div className="bg-white rounded-lg p-3 shadow-sm">
                      <p className="text-xs text-gray-600 mb-1">Total Remboursé</p>
                      <p className="text-2xl font-bold text-gray-700">{formatCurrency(p.totalRepayment)}</p>
                    </div>
                    
                    <div className="bg-white rounded-lg p-3 shadow-sm">
                      <p className="text-xs text-gray-600 mb-1">Coût Crédit</p>
                      <p className="text-2xl font-bold text-red-600">{formatCurrency(p.totalInterest)}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg p-8 text-white">
          <h2 className="text-3xl font-bold mb-6">📊 Synthèse Globale</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-white/10 rounded-lg p-6 backdrop-blur">
              <h3 className="text-xl font-semibold mb-4">Projet</h3>
              <ul className="space-y-2">
                <li className="flex justify-between">
                  <span>Coût total:</span>
                  <span className="font-bold">{formatCurrency(calculations.totals.total)}</span>
                </li>
                <li className="flex justify-between">
                  <span>Capital total:</span>
                  <span className="font-bold">{formatCurrency(calculations.totals.capitalTotal)}</span>
                </li>
                <li className="flex justify-between border-t border-white/30 pt-2">
                  <span>Total emprunts:</span>
                  <span className="font-bold text-yellow-300">{formatCurrency(calculations.totals.totalLoansNeeded)}</span>
                </li>
              </ul>
            </div>

            <div className="bg-white/10 rounded-lg p-6 backdrop-blur">
              <h3 className="text-xl font-semibold mb-4">Moyennes</h3>
              <ul className="space-y-2">
                <li className="flex justify-between">
                  <span>Coût/personne:</span>
                  <span className="font-bold">{formatCurrency(calculations.totals.total / participants.length)}</span>
                </li>
                <li className="flex justify-between">
                  <span>Capital moyen:</span>
                  <span className="font-bold">{formatCurrency(calculations.totals.averageCapital)}</span>
                </li>
                <li className="flex justify-between">
                  <span>Emprunt moyen:</span>
                  <span className="font-bold">{formatCurrency(calculations.totals.averageLoan)}</span>
                </li>
              </ul>
            </div>

            <div className="bg-white/10 rounded-lg p-6 backdrop-blur">
              <h3 className="text-xl font-semibold mb-4">Fourchettes</h3>
              <ul className="space-y-2">
                <li className="flex justify-between">
                  <span>Emprunt min:</span>
                  <span className="font-bold">{formatCurrency(Math.min(...calculations.participantBreakdown.map(p => p.loanNeeded)))}</span>
                </li>
                <li className="flex justify-between">
                  <span>Emprunt max:</span>
                  <span className="font-bold">{formatCurrency(Math.max(...calculations.participantBreakdown.map(p => p.loanNeeded)))}</span>
                </li>
                <li className="flex justify-between">
                  <span>Écart:</span>
                  <span className="font-bold">{formatCurrency(Math.max(...calculations.participantBreakdown.map(p => p.loanNeeded)) - Math.min(...calculations.participantBreakdown.map(p => p.loanNeeded)))}</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="bg-white/10 rounded-lg p-6 backdrop-blur">
            <h4 className="text-lg font-semibold mb-3">💡 Leviers d'Optimisation:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <ul className="space-y-2">
                <li>→ Négocier prix d'achat (-10% = €65K économisés)</li>
                <li>→ Réduire coûts construction (value engineering)</li>
                <li>→ Optimiser infrastructures (phaser les travaux)</li>
                <li>→ Augmenter capital apporté si possible</li>
              </ul>
              <ul className="space-y-2">
                <li>→ Subventions rénovation Wallonie</li>
                <li>→ Auto-construction partielle</li>
                <li>→ Négocier meilleur taux d'intérêt</li>
                <li>→ Vendre une 5ème unité en pré-construction</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}