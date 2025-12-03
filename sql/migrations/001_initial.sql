-- Credit Castor Database Schema
-- Supabase/Postgres migration
-- Version: 001_initial
-- Date: 2025-11-30

-- ============================================
-- Projects Table
-- ============================================
-- Project-level settings (one row per project)

CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deed_date DATE NOT NULL,
  project_params JSONB NOT NULL,
  portage_formula JSONB NOT NULL DEFAULT '{
    "indexationRate": 2.0,
    "carryingCostRecovery": 100,
    "averageInterestRate": 4.5,
    "coproReservesShare": 30
  }'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- ============================================
-- Participants Table
-- ============================================
-- One row per participant, linked to a project

CREATE TABLE IF NOT EXISTS participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  display_order INT NOT NULL,

  -- Core fields
  name TEXT NOT NULL,
  email TEXT,  -- Optional link to Supabase auth user
  enabled BOOLEAN DEFAULT true,

  -- Timeline fields
  is_founder BOOLEAN DEFAULT false,
  entry_date DATE,
  exit_date DATE,

  -- Financial fields
  surface NUMERIC NOT NULL DEFAULT 0,
  capital_apporte NUMERIC NOT NULL DEFAULT 0,
  registration_fees_rate NUMERIC NOT NULL DEFAULT 12.5,
  interest_rate NUMERIC NOT NULL DEFAULT 4.5,
  duration_years INT NOT NULL DEFAULT 25,

  -- Lots owned (JSONB array of Lot objects)
  lots_owned JSONB DEFAULT '[]'::jsonb,

  -- Purchase details for newcomers (JSONB)
  purchase_details JSONB,

  -- Legacy/optional fields
  unit_id INT,
  quantity INT DEFAULT 1,
  parachevements_per_m2 NUMERIC,
  casco_sqm NUMERIC,
  parachevements_sqm NUMERIC,

  -- Two-loan financing
  use_two_loans BOOLEAN DEFAULT false,
  loan2_delay_years INT,
  loan2_renovation_amount NUMERIC,
  capital_for_loan1 NUMERIC,
  capital_for_loan2 NUMERIC,

  -- Metadata
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Constraints
  UNIQUE(project_id, display_order),
  CONSTRAINT exit_after_entry CHECK (exit_date IS NULL OR exit_date > entry_date)
);

-- ============================================
-- Indexes
-- ============================================

CREATE INDEX IF NOT EXISTS idx_participants_project ON participants(project_id);
CREATE INDEX IF NOT EXISTS idx_participants_email ON participants(email);
CREATE INDEX IF NOT EXISTS idx_participants_enabled ON participants(project_id, enabled);

-- ============================================
-- Row Level Security (RLS)
-- ============================================

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;

-- Projects: Allow authenticated users to read/write
-- (In production, you'd add more granular policies)
CREATE POLICY "Authenticated users can read projects"
  ON projects FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert projects"
  ON projects FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update projects"
  ON projects FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Participants: Same policies
CREATE POLICY "Authenticated users can read participants"
  ON participants FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert participants"
  ON participants FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update participants"
  ON participants FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete participants"
  ON participants FOR DELETE
  TO authenticated
  USING (true);

-- ============================================
-- Auto-update timestamp trigger
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER participants_updated_at
  BEFORE UPDATE ON participants
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ============================================
-- Default project (optional - for single-project mode)
-- ============================================

-- Uncomment to create a default project:
-- INSERT INTO projects (id, deed_date, project_params)
-- VALUES (
--   'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
--   '2026-02-01',
--   '{
--     "totalPurchase": 500000,
--     "mesuresConservatoires": 0,
--     "demolition": 0,
--     "infrastructures": 0,
--     "etudesPreparatoires": 0,
--     "fraisEtudesPreparatoires": 0,
--     "fraisGeneraux3ans": 0,
--     "batimentFondationConservatoire": 0,
--     "batimentFondationComplete": 0,
--     "batimentCoproConservatoire": 0,
--     "globalCascoPerM2": 800
--   }'::jsonb
-- );
