/**
 * Storage persistence hook
 * Manages auto-save to localStorage
 */

import { useEffect } from 'react';
import { saveToLocalStorage } from '../utils/storage';
import type { Participant, ProjectParams, Scenario, PortageFormulaParams } from '../utils/calculatorUtils';

/**
 * Hook that auto-saves calculator state to localStorage
 */
export function useStoragePersistence(
  participants: Participant[],
  projectParams: ProjectParams,
  scenario: Scenario,
  deedDate: string,
  portageFormula: PortageFormulaParams,
  versionMismatch: boolean
) {
  useEffect(() => {
    // Don't save if there's a version mismatch (user needs to resolve it first)
    if (!versionMismatch) {
      saveToLocalStorage(participants, projectParams, scenario, deedDate, portageFormula);
    }
  }, [participants, projectParams, scenario, deedDate, portageFormula, versionMismatch]);
}
