/**
 * Zod schemas for Participant validation
 *
 * These schemas validate data at all boundaries:
 * - Loading from Supabase
 * - Saving to Supabase
 * - JSON import
 */

import { z } from 'zod';

// ============================================
// Lot Schema
// ============================================

export const LotSchema = z.object({
  lotId: z.number().int().positive(),
  surface: z.number().positive(),
  unitId: z.number().int().nonnegative(),
  isPortage: z.boolean(),
  acquiredDate: z.coerce.date(),
  originalPrice: z.number().optional(),
  originalNotaryFees: z.number().optional(),
  originalConstructionCost: z.number().optional(),
  monthlyCarryingCost: z.number().optional(),

  // Portage lot configuration
  allocatedSurface: z.number().positive().optional(),
  founderPaysCasco: z.boolean().optional(),
  founderPaysParachèvement: z.boolean().optional(),

  // Sale tracking
  soldDate: z.coerce.date().optional(),
  soldTo: z.string().optional(),
  salePrice: z.number().optional(),
  carryingCosts: z.number().optional(),
});

export type LotInput = z.input<typeof LotSchema>;
export type Lot = z.output<typeof LotSchema>;

// ============================================
// Purchase Details Schema
// ============================================

export const PurchaseBreakdownSchema = z.object({
  basePrice: z.number(),
  indexation: z.number(),
  carryingCostRecovery: z.number(),
  feesRecovery: z.number(),
  renovations: z.number(),
});

export const PurchaseDetailsSchema = z.object({
  buyingFrom: z.string().min(1, 'Buyer source required'),
  lotId: z.number().int().positive('Lot ID required'),
  purchasePrice: z.number().positive('Purchase price required'),
  breakdown: PurchaseBreakdownSchema.optional(),
});

// ============================================
// Participant Schema
// ============================================

export const ParticipantSchema = z.object({
  // Required fields
  name: z.string().min(1, 'Name is required'),
  capitalApporte: z.number().min(0, 'Capital must be non-negative'),
  registrationFeesRate: z.number().min(0).max(100),
  interestRate: z.number().min(0).max(100),
  durationYears: z.number().int().positive().max(40),

  // Two-loan financing (optional)
  useTwoLoans: z.boolean().optional(),
  loan2DelayYears: z.number().int().min(0).optional(),
  loan2RenovationAmount: z.number().min(0).optional(),
  loan2IncludesParachevements: z.boolean().optional(),
  capitalForLoan1: z.number().min(0).optional(),
  capitalForLoan2: z.number().min(0).optional(),

  // Timeline fields
  isFounder: z.boolean().optional(),
  entryDate: z.coerce.date().optional(),
  exitDate: z.coerce.date().optional(),
  lotsOwned: z.array(LotSchema).optional(),

  // Purchase details (for newcomers)
  purchaseDetails: PurchaseDetailsSchema.optional(),

  // Legacy fields
  unitId: z.number().int().optional(),
  surface: z.number().min(0).optional(),
  quantity: z.number().int().positive().optional(),

  // Optional overrides
  parachevementsPerM2: z.number().min(0).optional(),
  cascoSqm: z.number().min(0).optional(),
  parachevementsSqm: z.number().min(0).optional(),

  // Enable/disable
  enabled: z.boolean().optional().default(true),
});

// Cross-field validations
export const ParticipantWithRulesSchema = ParticipantSchema.refine(
  (data) => {
    // Rule D3: exitDate > entryDate (if both set)
    if (data.entryDate && data.exitDate) {
      return data.exitDate > data.entryDate;
    }
    return true;
  },
  { message: 'Exit date must be after entry date', path: ['exitDate'] }
);

export type ParticipantInput = z.input<typeof ParticipantSchema>;
export type Participant = z.output<typeof ParticipantSchema>;

// ============================================
// Participant Array Schema (with cross-entity rules)
// ============================================

export const ParticipantsArraySchema = z.array(ParticipantWithRulesSchema).refine(
  (participants) => {
    // Rule C5: At least one enabled participant
    const enabledCount = participants.filter(p => p.enabled !== false).length;
    return enabledCount > 0;
  },
  { message: 'At least one participant must be enabled' }
).refine(
  (participants) => {
    // Rule B1: lotId must be unique across all participants
    const allLotIds = participants.flatMap(p =>
      p.lotsOwned?.map(lot => lot.lotId) ?? []
    );
    const uniqueIds = new Set(allLotIds);
    return allLotIds.length === uniqueIds.size;
  },
  { message: 'Lot IDs must be unique across all participants' }
);
