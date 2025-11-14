/**
 * Data migration utilities for ProjectParams
 *
 * Handles backward compatibility when ProjectParams schema changes:
 * - travauxCommuns: OLD format (ExpenseLineItem) → NEW format (TravauxCommunsItem with sqm fields)
 * - maxTotalLots: Missing → Default value (10)
 */

import type { ProjectParams, TravauxCommuns, TravauxCommunsItem } from './calculatorUtils';
import { DEFAULT_MAX_TOTAL_LOTS } from './lotValidation';

/**
 * Default values for migrating old travauxCommuns format
 * These represent reasonable defaults based on the application's typical usage
 */
// const DEFAULT_TRAVAUX_SQM = 336; // Default surface area in m²
const DEFAULT_CASCO_PRICE_PER_SQM = 600; // Default CASCO price per m²
const DEFAULT_PARACHEVEMENTS_PRICE_PER_SQM = 200; // Default parachèvements price per m²

/**
 * Old format for TravauxCommuns item (before sqm fields were added)
 */
interface OldTravauxCommunsItem {
  label: string;
  amount: number;
}

/**
 * Type guard: Check if a TravauxCommuns item has the OLD format (just label + amount)
 */
function isOldFormat(item: OldTravauxCommunsItem | TravauxCommunsItem): item is OldTravauxCommunsItem {
  return (
    'label' in item &&
    'amount' in item &&
    !('sqm' in item) &&
    !('cascoPricePerSqm' in item) &&
    !('parachevementPricePerSqm' in item)
  );
}

/**
 * Migrate a single TravauxCommuns item from OLD to NEW format
 *
 * Strategy: Use the original amount to back-calculate reasonable sqm and price values
 * that sum back to the original amount.
 *
 * OLD format: { label, amount }
 * NEW format: { label, sqm, cascoPricePerSqm, parachevementPricePerSqm, amount? }
 */
function migrateTravauxCommunsItem(item: OldTravauxCommunsItem | TravauxCommunsItem): TravauxCommunsItem {
  // Already in new format
  if (!isOldFormat(item)) {
    return item;
  }

  const { label, amount } = item;

  // Calculate sqm based on amount and default prices
  // Formula: amount = (sqm * casco) + (sqm * parachevements)
  //         amount = sqm * (casco + parachevements)
  //         sqm = amount / (casco + parachevements)
  const totalPricePerSqm = DEFAULT_CASCO_PRICE_PER_SQM + DEFAULT_PARACHEVEMENTS_PRICE_PER_SQM;
  const calculatedSqm = Math.round(amount / totalPricePerSqm);

  return {
    label,
    sqm: calculatedSqm,
    cascoPricePerSqm: DEFAULT_CASCO_PRICE_PER_SQM,
    parachevementPricePerSqm: DEFAULT_PARACHEVEMENTS_PRICE_PER_SQM,
    amount, // Preserve original amount for backward compatibility
  };
}

/**
 * Old format for TravauxCommuns (before sqm fields were added)
 */
interface OldTravauxCommuns {
  enabled: boolean;
  items: OldTravauxCommunsItem[];
}

/**
 * Migrate travauxCommuns from OLD to NEW format
 *
 * @param travauxCommuns - TravauxCommuns object (may be old or new format)
 * @returns Migrated TravauxCommuns with NEW format items
 */
export function migrateTravauxCommuns(
  travauxCommuns: TravauxCommuns | OldTravauxCommuns | null | undefined
): TravauxCommuns | null | undefined {
  if (!travauxCommuns) {
    return travauxCommuns;
  }

  return {
    enabled: travauxCommuns.enabled,
    items: travauxCommuns.items.map(migrateTravauxCommunsItem),
  };
}

/**
 * Migrate ProjectParams to current schema
 *
 * Applies all necessary migrations:
 * - Adds maxTotalLots if missing
 * - Migrates travauxCommuns from old to new format
 *
 * @param projectParams - ProjectParams object (may be old schema)
 * @returns Migrated ProjectParams with current schema
 */
export function migrateProjectParams(projectParams: ProjectParams): ProjectParams {
  // Migration 1: Add maxTotalLots if missing
  const maxTotalLots = projectParams.maxTotalLots && projectParams.maxTotalLots > 0
    ? projectParams.maxTotalLots
    : DEFAULT_MAX_TOTAL_LOTS;

  // Migration 2: Migrate travauxCommuns if present
  const travauxCommuns = projectParams.travauxCommuns
    ? migrateTravauxCommuns(projectParams.travauxCommuns)
    : projectParams.travauxCommuns;

  return {
    ...projectParams,
    maxTotalLots,
    travauxCommuns: travauxCommuns || undefined,
  };
}
