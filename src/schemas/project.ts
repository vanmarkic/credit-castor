/**
 * Zod schemas for Project-level data validation
 *
 * These schemas validate:
 * - ProjectParams
 * - PortageFormulaParams
 * - Combined ProjectData (all data for load/save)
 */

import { z } from 'zod';
import { ParticipantsArraySchema } from './participant';

// ============================================
// Expense Categories Schema
// ============================================

export const ExpenseLineItemSchema = z.object({
  label: z.string().min(1),
  amount: z.number().min(0),
});

export const ExpenseCategoriesSchema = z.object({
  conservatoire: z.array(ExpenseLineItemSchema),
  habitabiliteSommaire: z.array(ExpenseLineItemSchema),
  premierTravaux: z.array(ExpenseLineItemSchema),
});

// ============================================
// Travaux Communs Schema
// ============================================

export const TravauxCommunsItemSchema = z.object({
  label: z.string().min(1),
  sqm: z.number().min(0),
  cascoPricePerSqm: z.number().min(0),
  parachevementPricePerSqm: z.number().min(0),
  amount: z.number().min(0).optional(),
});

export const TravauxCommunsSchema = z.object({
  enabled: z.boolean(),
  items: z.array(TravauxCommunsItemSchema),
});

// ============================================
// Project Params Schema
// ============================================

export const ProjectParamsSchema = z.object({
  totalPurchase: z.number().positive('Purchase amount required'),
  mesuresConservatoires: z.number().min(0),
  demolition: z.number().min(0),
  infrastructures: z.number().min(0),
  etudesPreparatoires: z.number().min(0),
  fraisEtudesPreparatoires: z.number().min(0),
  fraisGeneraux3ans: z.number().min(0),
  batimentFondationConservatoire: z.number().min(0),
  batimentFondationComplete: z.number().min(0),
  batimentCoproConservatoire: z.number().min(0),
  globalCascoPerM2: z.number().min(0),

  // Optional fields
  cascoTvaRate: z.number().min(0).max(100).optional(),
  expenseCategories: ExpenseCategoriesSchema.optional(),
  travauxCommuns: TravauxCommunsSchema.optional(),
  maxTotalLots: z.number().int().positive().optional(),
  renovationStartDate: z.string().optional(),
});

export type ProjectParamsInput = z.input<typeof ProjectParamsSchema>;
export type ProjectParams = z.output<typeof ProjectParamsSchema>;

// ============================================
// Portage Formula Schema
// ============================================

export const PortageFormulaSchema = z.object({
  indexationRate: z.number().min(0).max(100).default(2.0),
  carryingCostRecovery: z.number().min(0).max(100).default(100),
  averageInterestRate: z.number().min(0).max(100).default(4.5),
  coproReservesShare: z.number().min(0).max(100).default(30),
});

export type PortageFormulaInput = z.input<typeof PortageFormulaSchema>;
export type PortageFormula = z.output<typeof PortageFormulaSchema>;

// ============================================
// Combined Project Data Schema
// ============================================

export const ProjectDataSchema = z.object({
  id: z.string().uuid().optional(),
  deedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD format'),
  projectParams: ProjectParamsSchema,
  portageFormula: PortageFormulaSchema,
  participants: ParticipantsArraySchema,
  updatedAt: z.string().datetime().optional(),
  updatedBy: z.string().uuid().optional(),
});

// Cross-entity validations
export const ProjectDataWithRulesSchema = ProjectDataSchema.refine(
  (data) => {
    // Rule D1/D2: Founder entryDate = deedDate, non-founder entryDate > deedDate
    const deedDate = new Date(data.deedDate);
    for (const p of data.participants) {
      if (p.isFounder && p.entryDate) {
        // Founders should have entryDate = deedDate
        const entry = new Date(p.entryDate);
        if (entry.toDateString() !== deedDate.toDateString()) {
          return false;
        }
      }
      if (!p.isFounder && p.entryDate) {
        // Non-founders should have entryDate > deedDate
        const entry = new Date(p.entryDate);
        if (entry <= deedDate) {
          return false;
        }
      }
    }
    return true;
  },
  { message: 'Founder entry dates must match deed date; non-founder entry dates must be after deed date' }
).refine(
  (data) => {
    // Rule B2: Total lots <= maxTotalLots
    const maxLots = data.projectParams.maxTotalLots ?? 14;
    const totalLots = data.participants.reduce(
      (sum, p) => sum + (p.lotsOwned?.length ?? 0),
      0
    );
    return totalLots <= maxLots;
  },
  { message: 'Total lots exceed maximum allowed' }
);

export type ProjectDataInput = z.input<typeof ProjectDataSchema>;
export type ProjectData = z.output<typeof ProjectDataSchema>;

// ============================================
// Supabase row types (snake_case)
// ============================================

export const SupabaseProjectRowSchema = z.object({
  id: z.string().uuid(),
  deed_date: z.string(),
  project_params: ProjectParamsSchema,
  portage_formula: PortageFormulaSchema,
  updated_at: z.string().nullable(),
  updated_by: z.string().uuid().nullable(),
});

export const SupabaseParticipantRowSchema = z.object({
  id: z.string().uuid(),
  project_id: z.string().uuid(),
  display_order: z.number().int(),
  name: z.string(),
  email: z.string().nullable(),
  enabled: z.boolean(),
  is_founder: z.boolean(),
  entry_date: z.string().nullable(),
  exit_date: z.string().nullable(),
  surface: z.number(),
  capital_apporte: z.number(),
  registration_fees_rate: z.number(),
  interest_rate: z.number(),
  duration_years: z.number().int(),
  lots_owned: z.array(z.any()).nullable(),
  purchase_details: z.any().nullable(),
  unit_id: z.number().int().nullable(),
  quantity: z.number().int().nullable(),
  parachevements_per_m2: z.number().nullable(),
  casco_sqm: z.number().nullable(),
  parachevements_sqm: z.number().nullable(),
  use_two_loans: z.boolean(),
  loan2_delay_years: z.number().int().nullable(),
  loan2_renovation_amount: z.number().nullable(),
  capital_for_loan1: z.number().nullable(),
  capital_for_loan2: z.number().nullable(),
  updated_at: z.string().nullable(),
  updated_by: z.string().uuid().nullable(),
});
