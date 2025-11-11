/**
 * Excel export utilities
 * Pure functions to build export data that can be tested with CSV snapshots
 */

import type { CalculationResults, ProjectParams, UnitDetails } from './calculatorUtils';
import type { ExportWriter, SheetCell, SheetData } from './exportWriter';

/**
 * Build export sheet data from calculation results
 */
export function buildExportSheetData(
  calculations: CalculationResults,
  projectParams: ProjectParams,
  unitDetails?: UnitDetails,
  date: string = new Date().toLocaleDateString('fr-FR')
): SheetData {
  const cells: SheetCell[] = [];
  const participants = calculations.participantBreakdown;

  // Helper to add cells easily
  const addCell = (row: number, col: string, value?: string | number | null, formula?: string) => {
    cells.push({ row, col, data: { value, formula } });
  };

  // Header section
  addCell(1, 'A', 'ACHAT EN DIVISION - CALCULATEUR IMMOBILIER');
  addCell(2, 'A', `Wallonie, Belgique - ${date}`);

  // Project parameters
  addCell(4, 'A', 'PARAMETRES DU PROJET');
  addCell(5, 'A', 'Prix achat total');
  addCell(5, 'B', projectParams.totalPurchase);
  // scenario removed - no longer using percentage-based adjustments
  addCell(6, 'A', 'Surface totale (m2)');
  addCell(6, 'B', calculations.totalSurface);
  addCell(7, 'A', 'Prix par m2');
  addCell(7, 'B', null, 'B5/B6');

  // Shared costs
  addCell(9, 'A', 'COUTS PARTAGES');
  addCell(10, 'A', 'Mesures conservatoires');
  addCell(10, 'B', projectParams.mesuresConservatoires);
  addCell(11, 'A', 'Demolition');
  addCell(11, 'B', projectParams.demolition);
  addCell(12, 'A', 'Infrastructures');
  addCell(12, 'B', projectParams.infrastructures);
  // scenario removed - no longer adjusting infrastructures
  addCell(13, 'A', 'Etudes preparatoires');
  addCell(13, 'B', projectParams.etudesPreparatoires);
  addCell(14, 'A', 'Frais Etudes preparatoires');
  addCell(14, 'B', projectParams.fraisEtudesPreparatoires);
  addCell(15, 'A', 'Frais Generaux 3 ans');
  addCell(15, 'B', projectParams.fraisGeneraux3ans);
  addCell(16, 'A', 'Prix CASCO/m2 Global');
  addCell(16, 'B', projectParams.globalCascoPerM2);

  // Expense categories detail (if present)
  let expenseCategoryEndRow = 17;
  if (projectParams.expenseCategories) {
    addCell(18, 'A', 'DETAIL DEPENSES COMMUNES');
    let currentRow = 19;

    // Conservatoire
    addCell(currentRow, 'A', 'CONSERVATOIRE');
    currentRow++;
    projectParams.expenseCategories.conservatoire.forEach(item => {
      addCell(currentRow, 'A', `  ${item.label}`);
      addCell(currentRow, 'B', item.amount);
      currentRow++;
    });

    // Habitabilité Sommaire
    addCell(currentRow, 'A', 'HABITABILITE SOMMAIRE');
    currentRow++;
    projectParams.expenseCategories.habitabiliteSommaire.forEach(item => {
      addCell(currentRow, 'A', `  ${item.label}`);
      addCell(currentRow, 'B', item.amount);
      currentRow++;
    });

    // Premier Travaux
    addCell(currentRow, 'A', 'PREMIER TRAVAUX');
    currentRow++;
    projectParams.expenseCategories.premierTravaux.forEach(item => {
      addCell(currentRow, 'A', `  ${item.label}`);
      addCell(currentRow, 'B', item.amount);
      currentRow++;
    });

    expenseCategoryEndRow = currentRow;
  }

  addCell(expenseCategoryEndRow, 'A', 'Total commun');
  if (projectParams.expenseCategories) {
    addCell(expenseCategoryEndRow, 'B', calculations.sharedCosts);
  } else {
    addCell(expenseCategoryEndRow, 'B', null, 'B10+B11+B12+B13+B14+B15');
  }
  addCell(expenseCategoryEndRow + 1, 'A', 'Commun par personne');
  addCell(expenseCategoryEndRow + 1, 'B', null, `B${expenseCategoryEndRow}/${participants.length}`);

  // Travaux communs
  const travauxRow = expenseCategoryEndRow + 3;
  addCell(travauxRow, 'A', 'TRAVAUX COMMUNS');
  addCell(travauxRow + 1, 'A', 'Batiment fondation (conservatoire)');
  addCell(travauxRow + 1, 'B', projectParams.batimentFondationConservatoire);
  addCell(travauxRow + 2, 'A', 'Batiment fondation (complete)');
  addCell(travauxRow + 2, 'B', projectParams.batimentFondationComplete);
  addCell(travauxRow + 3, 'A', 'Batiment copro (conservatoire)');
  addCell(travauxRow + 3, 'B', projectParams.batimentCoproConservatoire);
  addCell(travauxRow + 4, 'A', 'Total travaux communs');
  addCell(travauxRow + 4, 'B', null, `B${travauxRow + 1}+B${travauxRow + 2}+B${travauxRow + 3}`);
  addCell(travauxRow + 5, 'A', 'Par unite');
  addCell(travauxRow + 5, 'B', null, `B${travauxRow + 4}/${participants.length}`);

  // Unit details (if provided)
  let unitDetailsEndRow = travauxRow + 6;
  if (unitDetails) {
    addCell(unitDetailsEndRow + 1, 'A', 'DETAILS PAR TYPE D UNITE');
    let currentRow = unitDetailsEndRow + 2;
    Object.entries(unitDetails).forEach(([unitId, details]) => {
      addCell(currentRow, 'A', `Unite ${unitId}`);
      addCell(currentRow, 'B', `CASCO: ${details.casco}, Parachèvements: ${details.parachevements}`);
      currentRow++;
    });
    unitDetailsEndRow = currentRow;
  }

  // Cost breakdown
  const decompRow = unitDetailsEndRow + 2;
  addCell(decompRow, 'A', 'DECOMPOSITION DES COUTS');
  addCell(decompRow + 1, 'A', 'Achat Total');
  addCell(decompRow + 1, 'B', null, 'B5');

  const participantStartRow = decompRow + 6;
  addCell(decompRow + 2, 'A', 'Frais de Notaire');
  addCell(decompRow + 2, 'B', null, `SUM(J${participantStartRow}:J${participantStartRow - 1 + participants.length})`);
  addCell(decompRow + 3, 'A', 'Construction');
  addCell(decompRow + 3, 'B', null, `SUM(M${participantStartRow}:M${participantStartRow - 1 + participants.length})`);
  addCell(decompRow + 4, 'A', 'Commun Infrastructure');
  addCell(decompRow + 4, 'B', null, `B${expenseCategoryEndRow}`);
  addCell(decompRow + 5, 'A', 'TOTAL PROJET');
  addCell(decompRow + 5, 'B', null, `B${decompRow + 1}+B${decompRow + 2}+B${decompRow + 3}+B${decompRow + 4}`);

  // Participant detail header
  const headerRow = participantStartRow - 1;
  const headers = ['Nom', 'Unite', 'Surface', 'Qty', 'Capital', 'Taux notaire', 'Taux interet', 'Duree (ans)',
                   'Part achat', 'Frais notaire', 'CASCO', 'Parachevements', 'Travaux communs',
                   'Construction', 'Commun', 'TOTAL', 'Emprunt', 'Mensualite', 'Total rembourse',
                   'Reno perso', 'CASCO m2', 'Parachev m2', 'CASCO sqm', 'Parachev sqm',
                   'Fondateur', 'Date entree', 'Lots detenus', 'Date vente lot', 'Achete de', 'Lot ID achete', 'Prix achat lot',
                   '2 prets', 'Pret1 montant', 'Pret1 mens', 'Pret2 montant', 'Pret2 mens', 'Pret2 duree',
                   'Porteur paie CASCO', 'Porteur paie Parachev'];
  const cols = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', 'AA', 'AB', 'AC', 'AD', 'AE', 'AF', 'AG', 'AH', 'AI', 'AJ', 'AK', 'AL', 'AM'];

  headers.forEach((header, idx) => {
    addCell(headerRow, cols[idx], header);
  });

  // Participant data
  participants.forEach((p, idx) => {
    const r = participantStartRow + idx;
    addCell(r, 'A', p.name);
    addCell(r, 'B', p.unitId);
    addCell(r, 'C', p.surface);
    addCell(r, 'D', p.quantity || 1);
    addCell(r, 'E', p.capitalApporte);
    addCell(r, 'F', p.notaryFeesRate);
    addCell(r, 'G', p.interestRate);
    addCell(r, 'H', p.durationYears);
    addCell(r, 'I', null, `C${r}*$B$7`);
    addCell(r, 'J', null, `I${r}*F${r}/100`);
    addCell(r, 'K', p.casco);
    addCell(r, 'L', p.parachevements);
    addCell(r, 'M', null, `$B$${travauxRow + 5}`);
    addCell(r, 'N', null, `(K${r}+L${r})+M${r}*D${r}`);
    addCell(r, 'O', null, `$B$${expenseCategoryEndRow + 1}`);
    addCell(r, 'P', null, `I${r}+J${r}+N${r}+O${r}`);
    addCell(r, 'Q', null, `P${r}-E${r}`);
    addCell(r, 'R', null, `PMT(G${r}/100/12,H${r}*12,Q${r})*-1`);
    addCell(r, 'S', null, `R${r}*H${r}*12`);
    // Additional columns for overrides
    addCell(r, 'T', p.personalRenovationCost);
    addCell(r, 'U', p.parachevementsPerM2);
    addCell(r, 'V', projectParams.globalCascoPerM2);
    addCell(r, 'W', p.cascoSqm);
    addCell(r, 'X', p.parachevementsSqm);

    // Timeline fields
    addCell(r, 'Y', p.isFounder ? 'Oui' : 'Non');
    addCell(r, 'Z', p.entryDate ? new Date(p.entryDate).toLocaleDateString('fr-BE') : '');

    // Portage lots details
    if (p.lotsOwned && p.lotsOwned.length > 0) {
      const lotDetails = p.lotsOwned
        .map(lot => `Lot ${lot.lotId}${lot.isPortage ? ' (portage)' : ''}: ${lot.surface}m²`)
        .join('; ');
      addCell(r, 'AA', lotDetails);

      // Show sold date for portage lots
      const soldDates = p.lotsOwned
        .filter(lot => lot.soldDate)
        .map(lot => `Lot ${lot.lotId}: ${new Date(lot.soldDate!).toLocaleDateString('fr-BE')}`)
        .join('; ');
      addCell(r, 'AB', soldDates || '');
    } else {
      addCell(r, 'AA', '');
      addCell(r, 'AB', '');
    }

    // Purchase details (for newcomers)
    addCell(r, 'AC', p.purchaseDetails?.buyingFrom || '');
    addCell(r, 'AD', p.purchaseDetails?.lotId || '');
    addCell(r, 'AE', p.purchaseDetails?.purchasePrice || '');

    // Two-loan financing details
    if (p.useTwoLoans) {
      addCell(r, 'AF', 'Oui');
      addCell(r, 'AG', p.loan1Amount);
      addCell(r, 'AH', p.loan1MonthlyPayment);
      addCell(r, 'AI', p.loan2Amount);
      addCell(r, 'AJ', p.loan2MonthlyPayment);
      addCell(r, 'AK', `${p.loan2DurationYears} ans (démarre année ${p.loan2DelayYears || 2})`);
    } else {
      addCell(r, 'AF', 'Non');
      addCell(r, 'AG', '');
      addCell(r, 'AH', '');
      addCell(r, 'AI', '');
      addCell(r, 'AJ', '');
      addCell(r, 'AK', '');
    }

    // Construction payment details (for portage buyers)
    if (p.purchaseDetails?.lotId) {
      // Find the portage lot from all participants' lotsOwned
      const portageLot = participants
        .flatMap(seller => seller.lotsOwned || [])
        .find(lot => lot.lotId === p.purchaseDetails!.lotId && lot.isPortage);

      if (portageLot) {
        addCell(r, 'AL', portageLot.founderPaysCasco ? 'Oui' : 'Non');
        addCell(r, 'AM', portageLot.founderPaysParachèvement ? 'Oui' : 'Non');
      } else {
        addCell(r, 'AL', '');
        addCell(r, 'AM', '');
      }
    } else {
      addCell(r, 'AL', '');
      addCell(r, 'AM', '');
    }
  });

  // Totals row
  const totalRow = participantStartRow + participants.length;
  const startRow = participantStartRow;
  const endRow = totalRow - 1;

  addCell(totalRow, 'A', 'TOTAL');
  addCell(totalRow, 'B', '');
  addCell(totalRow, 'C', null, `SUM(C${startRow}:C${endRow})`);
  addCell(totalRow, 'D', null, `SUM(D${startRow}:D${endRow})`);
  addCell(totalRow, 'E', null, `SUM(E${startRow}:E${endRow})`);
  addCell(totalRow, 'F', '');
  addCell(totalRow, 'G', '');
  addCell(totalRow, 'H', '');
  addCell(totalRow, 'I', null, `SUM(I${startRow}:I${endRow})`);
  addCell(totalRow, 'J', null, `SUM(J${startRow}:J${endRow})`);
  addCell(totalRow, 'K', null, `SUM(K${startRow}:K${endRow})`);
  addCell(totalRow, 'L', null, `SUM(L${startRow}:L${endRow})`);
  addCell(totalRow, 'M', null, `SUM(M${startRow}:M${endRow})`);
  addCell(totalRow, 'N', null, `SUM(N${startRow}:N${endRow})`);
  addCell(totalRow, 'O', null, `SUM(O${startRow}:O${endRow})`);
  addCell(totalRow, 'P', null, `SUM(P${startRow}:P${endRow})`);
  addCell(totalRow, 'Q', null, `SUM(Q${startRow}:Q${endRow})`);
  addCell(totalRow, 'R', '');
  addCell(totalRow, 'S', null, `SUM(S${startRow}:S${endRow})`);
  addCell(totalRow, 'T', null, `SUM(T${startRow}:T${endRow})`);
  addCell(totalRow, 'U', '');
  addCell(totalRow, 'V', '');
  addCell(totalRow, 'W', '');
  addCell(totalRow, 'X', '');
  addCell(totalRow, 'Y', '');
  addCell(totalRow, 'Z', '');
  addCell(totalRow, 'AA', '');
  addCell(totalRow, 'AB', '');
  addCell(totalRow, 'AC', '');
  addCell(totalRow, 'AD', '');
  addCell(totalRow, 'AE', '');
  addCell(totalRow, 'AF', '');
  addCell(totalRow, 'AG', '');
  addCell(totalRow, 'AH', '');
  addCell(totalRow, 'AI', '');
  addCell(totalRow, 'AJ', '');
  addCell(totalRow, 'AK', '');
  addCell(totalRow, 'AL', '');
  addCell(totalRow, 'AM', '');

  // Summary section
  const synthRow = totalRow + 2;
  addCell(synthRow + 1, 'A', 'SYNTHESE GLOBALE');
  addCell(synthRow + 2, 'A', 'Cout total projet');
  addCell(synthRow + 2, 'B', null, `P${totalRow}`);
  addCell(synthRow + 3, 'A', 'Capital total apporte');
  addCell(synthRow + 3, 'B', null, `E${totalRow}`);
  addCell(synthRow + 4, 'A', 'Total emprunts necessaires');
  addCell(synthRow + 4, 'B', null, `Q${totalRow}`);
  addCell(synthRow + 5, 'A', 'Emprunt moyen');
  addCell(synthRow + 5, 'B', null, `AVERAGE(Q${startRow}:Q${endRow})`);
  addCell(synthRow + 6, 'A', 'Emprunt minimum');
  addCell(synthRow + 6, 'B', null, `MIN(Q${startRow}:Q${endRow})`);
  addCell(synthRow + 7, 'A', 'Emprunt maximum');
  addCell(synthRow + 7, 'B', null, `MAX(Q${startRow}:Q${endRow})`);

  // Column widths (expanded to 39 columns for portage lot tracking, two-loan financing, and construction payment tracking)
  const columnWidths = [
    { col: 0, width: 25 }, { col: 1, width: 8 }, { col: 2, width: 10 }, { col: 3, width: 8 },
    { col: 4, width: 15 }, { col: 5, width: 14 }, { col: 6, width: 12 }, { col: 7, width: 12 },
    { col: 8, width: 15 }, { col: 9, width: 15 }, { col: 10, width: 15 }, { col: 11, width: 15 },
    { col: 12, width: 15 }, { col: 13, width: 15 }, { col: 14, width: 15 }, { col: 15, width: 15 },
    { col: 16, width: 15 }, { col: 17, width: 15 }, { col: 18, width: 15 }, { col: 19, width: 15 },
    { col: 20, width: 12 }, { col: 21, width: 12 }, { col: 22, width: 12 }, { col: 23, width: 12 },
    { col: 24, width: 10 }, { col: 25, width: 12 }, { col: 26, width: 30 }, { col: 27, width: 20 },
    { col: 28, width: 20 }, { col: 29, width: 12 }, { col: 30, width: 15 },
    { col: 31, width: 10 }, { col: 32, width: 15 }, { col: 33, width: 15 }, { col: 34, width: 15 },
    { col: 35, width: 15 }, { col: 36, width: 25 }, { col: 37, width: 18 }, { col: 38, width: 20 }
  ];

  return {
    name: 'Calculateur Division',
    cells,
    columnWidths
  };
}

/**
 * Export calculation results to Excel or CSV
 */
export function exportCalculations(
  calculations: CalculationResults,
  projectParams: ProjectParams,
  unitDetails: UnitDetails | undefined,
  writer: ExportWriter,
  filename: string = 'Calculateur_Division_' + new Date().toLocaleDateString('fr-FR').replace(/\//g, '-') + '.xlsx'
): void | string {
  const wb = writer.createWorkbook();
  const sheetData = buildExportSheetData(calculations, projectParams, unitDetails);
  writer.addSheet(wb, sheetData);
  return writer.write(wb, filename);
}
