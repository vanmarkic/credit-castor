/**
 * Supabase Data Service
 *
 * Simple load/save operations for project data.
 * No real-time sync - just fetch and persist.
 */

import { supabase, isSupabaseConfigured, getCurrentUser } from './supabase';
import {
  ProjectDataSchema,
  type ProjectData,
  type ProjectParams,
  type PortageFormula,
} from '../schemas/project';
import { type Participant } from '../schemas/participant';

// ============================================
// Type Definitions
// ============================================

export interface LoadResult {
  success: boolean;
  data?: ProjectData;
  error?: string;
}

export interface SaveResult {
  success: boolean;
  error?: string;
}

// ============================================
// Participant Row Mapping
// ============================================

function participantToRow(p: Participant, projectId: string, order: number, userId?: string) {
  return {
    project_id: projectId,
    display_order: order,
    name: p.name,
    enabled: p.enabled ?? true,
    is_founder: p.isFounder ?? false,
    entry_date: p.entryDate ? new Date(p.entryDate).toISOString().split('T')[0] : null,
    exit_date: p.exitDate ? new Date(p.exitDate).toISOString().split('T')[0] : null,
    surface: p.surface ?? 0,
    capital_apporte: p.capitalApporte,
    registration_fees_rate: p.registrationFeesRate,
    interest_rate: p.interestRate,
    duration_years: p.durationYears,
    lots_owned: p.lotsOwned ?? [],
    purchase_details: p.purchaseDetails ?? null,
    unit_id: p.unitId ?? null,
    quantity: p.quantity ?? 1,
    parachevements_per_m2: p.parachevementsPerM2 ?? null,
    casco_sqm: p.cascoSqm ?? null,
    parachevements_sqm: p.parachevementsSqm ?? null,
    use_two_loans: p.useTwoLoans ?? false,
    loan2_delay_years: p.loan2DelayYears ?? null,
    loan2_renovation_amount: p.loan2RenovationAmount ?? null,
    capital_for_loan1: p.capitalForLoan1 ?? null,
    capital_for_loan2: p.capitalForLoan2 ?? null,
    updated_by: userId ?? null,
  };
}

function rowToParticipant(row: Record<string, unknown>): Participant {
  return {
    name: row.name as string,
    capitalApporte: row.capital_apporte as number,
    registrationFeesRate: row.registration_fees_rate as number,
    interestRate: row.interest_rate as number,
    durationYears: row.duration_years as number,
    enabled: row.enabled as boolean,
    isFounder: row.is_founder as boolean,
    entryDate: row.entry_date ? new Date(row.entry_date as string) : undefined,
    exitDate: row.exit_date ? new Date(row.exit_date as string) : undefined,
    surface: row.surface as number,
    lotsOwned: row.lots_owned as Participant['lotsOwned'],
    purchaseDetails: row.purchase_details as Participant['purchaseDetails'],
    unitId: row.unit_id as number | undefined,
    quantity: row.quantity as number | undefined,
    parachevementsPerM2: row.parachevements_per_m2 as number | undefined,
    cascoSqm: row.casco_sqm as number | undefined,
    parachevementsSqm: row.parachevements_sqm as number | undefined,
    useTwoLoans: row.use_two_loans as boolean,
    loan2DelayYears: row.loan2_delay_years as number | undefined,
    loan2RenovationAmount: row.loan2_renovation_amount as number | undefined,
    capitalForLoan1: row.capital_for_loan1 as number | undefined,
    capitalForLoan2: row.capital_for_loan2 as number | undefined,
  };
}

// ============================================
// Load Project Data
// ============================================

export async function loadProject(projectId: string): Promise<LoadResult> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Supabase not configured' };
  }

  try {
    // Fetch project with participants in one query
    const { data: projectRow, error: projectError } = await supabase
      .from('projects')
      .select(`
        *,
        participants (*)
      `)
      .eq('id', projectId)
      .single();

    if (projectError) {
      if (projectError.code === 'PGRST116') {
        return { success: false, error: 'Project not found' };
      }
      return { success: false, error: projectError.message };
    }

    if (!projectRow) {
      return { success: false, error: 'No data returned' };
    }

    // Sort participants by display_order
    const sortedParticipants = (projectRow.participants || [])
      .sort((a: { display_order: number }, b: { display_order: number }) =>
        a.display_order - b.display_order
      )
      .map((row: Record<string, unknown>) => rowToParticipant(row));

    // Build ProjectData object
    const projectData: ProjectData = {
      id: projectRow.id,
      deedDate: projectRow.deed_date,
      projectParams: projectRow.project_params as ProjectParams,
      portageFormula: projectRow.portage_formula as PortageFormula,
      participants: sortedParticipants,
      updatedAt: projectRow.updated_at,
      updatedBy: projectRow.updated_by,
    };

    // Validate with Zod
    const validation = ProjectDataSchema.safeParse(projectData);
    if (!validation.success) {
      console.error('Schema validation failed:', validation.error);
      return { success: false, error: 'Data validation failed: ' + validation.error.message };
    }

    return { success: true, data: validation.data };
  } catch (err) {
    console.error('Error loading project:', err);
    return { success: false, error: String(err) };
  }
}

// ============================================
// Save Project Data
// ============================================

export async function saveProject(
  projectId: string,
  data: ProjectData
): Promise<SaveResult> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Supabase not configured' };
  }

  // 1. Validate before sending
  const validation = ProjectDataSchema.safeParse(data);
  if (!validation.success) {
    return { success: false, error: 'Validation failed: ' + validation.error.message };
  }

  const user = await getCurrentUser();
  const userId = user?.id;

  try {
    // 2. Upsert project row
    const { error: projectError } = await supabase
      .from('projects')
      .upsert({
        id: projectId,
        deed_date: data.deedDate,
        project_params: data.projectParams,
        portage_formula: data.portageFormula,
        updated_by: userId,
      });

    if (projectError) {
      return { success: false, error: 'Failed to save project: ' + projectError.message };
    }

    // 3. Delete existing participants (we'll replace them all)
    const { error: deleteError } = await supabase
      .from('participants')
      .delete()
      .eq('project_id', projectId);

    if (deleteError) {
      return { success: false, error: 'Failed to clear participants: ' + deleteError.message };
    }

    // 4. Insert all participants
    if (data.participants.length > 0) {
      const participantRows = data.participants.map((p, i) =>
        participantToRow(p, projectId, i, userId)
      );

      const { error: insertError } = await supabase
        .from('participants')
        .insert(participantRows);

      if (insertError) {
        return { success: false, error: 'Failed to save participants: ' + insertError.message };
      }
    }

    return { success: true };
  } catch (err) {
    console.error('Error saving project:', err);
    return { success: false, error: String(err) };
  }
}

// ============================================
// Create New Project
// ============================================

export async function createProject(
  deedDate: string,
  projectParams: ProjectParams,
  portageFormula?: PortageFormula
): Promise<{ success: boolean; projectId?: string; error?: string }> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Supabase not configured' };
  }

  const user = await getCurrentUser();

  const { data, error } = await supabase
    .from('projects')
    .insert({
      deed_date: deedDate,
      project_params: projectParams,
      portage_formula: portageFormula ?? {
        indexationRate: 2.0,
        carryingCostRecovery: 100,
        averageInterestRate: 4.5,
        coproReservesShare: 30,
      },
      updated_by: user?.id,
    })
    .select('id')
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, projectId: data.id };
}

// ============================================
// Delete Project
// ============================================

export async function deleteProject(projectId: string): Promise<SaveResult> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Supabase not configured' };
  }

  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', projectId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}
