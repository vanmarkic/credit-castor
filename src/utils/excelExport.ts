/**
 * Excel export utilities
 * Pure functions to build export data that can be tested with CSV snapshots
 */

import type { CalculationResults, ProjectParams, Scenario } from './calculatorUtils';
import type { ExportWriter, SheetCell, SheetData } from './exportWriter';

/**
 * Build export sheet data from calculation results
 */
export function buildExportSheetData(
  calculations: CalculationResults,
  projectParams: ProjectParams,
  scenario: Scenario,
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
  addCell(6, 'A', 'Reduction negociee (%)');
  addCell(6, 'B', scenario.purchasePriceReduction);
  addCell(7, 'A', 'Prix achat ajuste');
  addCell(7, 'B', null, 'B5*(1-B6/100)');
  addCell(8, 'A', 'Surface totale (m2)');
  addCell(8, 'B', calculations.totalSurface);
  addCell(9, 'A', 'Prix par m2');
  addCell(9, 'B', null, 'B7/B8');

  // Scenarios
  addCell(11, 'A', 'SCENARIOS D OPTIMISATION');
  addCell(12, 'A', 'Variation couts construction (%)');
  addCell(12, 'B', scenario.constructionCostChange);
  addCell(13, 'A', 'Reduction infrastructures (%)');
  addCell(13, 'B', scenario.infrastructureReduction);

  // Shared costs
  addCell(15, 'A', 'COUTS PARTAGES');
  addCell(16, 'A', 'Mesures conservatoires');
  addCell(16, 'B', projectParams.mesuresConservatoires);
  addCell(17, 'A', 'Demolition');
  addCell(17, 'B', projectParams.demolition);
  addCell(18, 'A', 'Infrastructures');
  addCell(18, 'B', projectParams.infrastructures);
  addCell(19, 'A', 'Infrastructures ajustees');
  addCell(19, 'B', null, 'B18*(1-B13/100)');
  addCell(20, 'A', 'Etudes preparatoires');
  addCell(20, 'B', projectParams.etudesPreparatoires);
  addCell(21, 'A', 'Frais Etudes preparatoires');
  addCell(21, 'B', projectParams.fraisEtudesPreparatoires);
  addCell(22, 'A', 'Frais Generaux 3 ans');
  addCell(22, 'B', projectParams.fraisGeneraux3ans);
  addCell(23, 'A', 'Total quote-part');
  addCell(23, 'B', null, 'B16+B17+B19+B20+B21+B22');
  addCell(24, 'A', 'Quote-part par personne');
  addCell(24, 'B', null, `B23/${participants.length}`);

  // Travaux communs
  addCell(26, 'A', 'TRAVAUX COMMUNS');
  addCell(27, 'A', 'Batiment fondation (conservatoire)');
  addCell(27, 'B', projectParams.batimentFondationConservatoire);
  addCell(28, 'A', 'Batiment fondation (complete)');
  addCell(28, 'B', projectParams.batimentFondationComplete);
  addCell(29, 'A', 'Batiment copro (conservatoire)');
  addCell(29, 'B', projectParams.batimentCoproConservatoire);
  addCell(30, 'A', 'Total travaux communs');
  addCell(30, 'B', null, 'B27+B28+B29');
  addCell(31, 'A', 'Par unite');
  addCell(31, 'B', null, `B30/${participants.length}`);

  // Cost breakdown
  addCell(33, 'A', 'DECOMPOSITION DES COUTS');
  addCell(34, 'A', 'Achat Total');
  addCell(34, 'B', null, 'B7');
  addCell(35, 'A', 'Frais de Notaire');
  addCell(35, 'B', null, `SUM(I39:I${38 + participants.length})`);
  addCell(36, 'A', 'Construction');
  addCell(36, 'B', null, `SUM(M39:M${38 + participants.length})`);
  addCell(37, 'A', 'Quote-part Infrastructure');
  addCell(37, 'B', null, 'B23');
  addCell(38, 'A', 'TOTAL PROJET');
  addCell(38, 'B', null, 'B34+B35+B36+B37');

  // Participant detail header
  const headerRow = 40;
  const headers = ['Nom', 'Unite', 'Surface', 'Capital', 'Taux notaire', 'Taux interet', 'Duree (ans)',
                   'Part achat', 'Frais notaire', 'CASCO', 'Parachevements', 'Travaux communs',
                   'Construction', 'Quote-part', 'TOTAL', 'Emprunt', 'Mensualite', 'Total rembourse'];
  const cols = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R'];

  headers.forEach((header, idx) => {
    addCell(headerRow, cols[idx], header);
  });

  // Participant data
  participants.forEach((p, idx) => {
    const r = 41 + idx;
    addCell(r, 'A', p.name);
    addCell(r, 'B', p.unitId);
    addCell(r, 'C', p.surface);
    addCell(r, 'D', p.capitalApporte);
    addCell(r, 'E', p.notaryFeesRate);
    addCell(r, 'F', p.interestRate);
    addCell(r, 'G', p.durationYears);
    addCell(r, 'H', null, `C${r}*$B$9`);
    addCell(r, 'I', null, `H${r}*E${r}/100`);
    addCell(r, 'J', p.casco);
    addCell(r, 'K', p.parachevements);
    addCell(r, 'L', null, '$B$31');
    addCell(r, 'M', null, `(J${r}+K${r})*(1+$B$12/100)+L${r}`);
    addCell(r, 'N', null, '$B$24');
    addCell(r, 'O', null, `H${r}+I${r}+M${r}+N${r}`);
    addCell(r, 'P', null, `O${r}-D${r}`);
    addCell(r, 'Q', null, `PMT(F${r}/100/12,G${r}*12,P${r})*-1`);
    addCell(r, 'R', null, `Q${r}*G${r}*12`);
  });

  // Totals row
  const totalRow = 41 + participants.length;
  const startRow = 41;
  const endRow = totalRow - 1;

  addCell(totalRow, 'A', 'TOTAL');
  addCell(totalRow, 'B', '');
  addCell(totalRow, 'C', null, `SUM(C${startRow}:C${endRow})`);
  addCell(totalRow, 'D', null, `SUM(D${startRow}:D${endRow})`);
  addCell(totalRow, 'E', '');
  addCell(totalRow, 'F', '');
  addCell(totalRow, 'G', '');
  addCell(totalRow, 'H', null, `SUM(H${startRow}:H${endRow})`);
  addCell(totalRow, 'I', null, `SUM(I${startRow}:I${endRow})`);
  addCell(totalRow, 'J', null, `SUM(J${startRow}:J${endRow})`);
  addCell(totalRow, 'K', null, `SUM(K${startRow}:K${endRow})`);
  addCell(totalRow, 'L', null, `SUM(L${startRow}:L${endRow})`);
  addCell(totalRow, 'M', null, `SUM(M${startRow}:M${endRow})`);
  addCell(totalRow, 'N', null, `SUM(N${startRow}:N${endRow})`);
  addCell(totalRow, 'O', null, `SUM(O${startRow}:O${endRow})`);
  addCell(totalRow, 'P', null, `SUM(P${startRow}:P${endRow})`);
  addCell(totalRow, 'Q', '');
  addCell(totalRow, 'R', null, `SUM(R${startRow}:R${endRow})`);

  // Summary section
  const synthRow = totalRow + 2;
  addCell(synthRow + 1, 'A', 'SYNTHESE GLOBALE');
  addCell(synthRow + 2, 'A', 'Cout total projet');
  addCell(synthRow + 2, 'B', null, `O${totalRow}`);
  addCell(synthRow + 3, 'A', 'Capital total apporte');
  addCell(synthRow + 3, 'B', null, `D${totalRow}`);
  addCell(synthRow + 4, 'A', 'Total emprunts necessaires');
  addCell(synthRow + 4, 'B', null, `P${totalRow}`);
  addCell(synthRow + 5, 'A', 'Emprunt moyen');
  addCell(synthRow + 5, 'B', null, `AVERAGE(P${startRow}:P${endRow})`);
  addCell(synthRow + 6, 'A', 'Emprunt minimum');
  addCell(synthRow + 6, 'B', null, `MIN(P${startRow}:P${endRow})`);
  addCell(synthRow + 7, 'A', 'Emprunt maximum');
  addCell(synthRow + 7, 'B', null, `MAX(P${startRow}:P${endRow})`);

  // Column widths
  const columnWidths = [
    { col: 0, width: 25 }, { col: 1, width: 8 }, { col: 2, width: 10 }, { col: 3, width: 15 },
    { col: 4, width: 14 }, { col: 5, width: 12 }, { col: 6, width: 12 }, { col: 7, width: 15 },
    { col: 8, width: 15 }, { col: 9, width: 15 }, { col: 10, width: 15 }, { col: 11, width: 15 },
    { col: 12, width: 15 }, { col: 13, width: 15 }, { col: 14, width: 15 }, { col: 15, width: 15 },
    { col: 16, width: 15 }, { col: 17, width: 15 }
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
  scenario: Scenario,
  writer: ExportWriter,
  filename: string = 'Calculateur_Division_' + new Date().toLocaleDateString('fr-FR').replace(/\//g, '-') + '.xlsx'
): void | string {
  const wb = writer.createWorkbook();
  const sheetData = buildExportSheetData(calculations, projectParams, scenario);
  writer.addSheet(wb, sheetData);
  return writer.write(wb, filename);
}
