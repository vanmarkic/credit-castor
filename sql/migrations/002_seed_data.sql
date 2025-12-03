-- Credit Castor Seed Data
-- Supabase/Postgres migration
-- Version: 002_seed_data
-- Date: 2025-11-30

-- ============================================
-- Create Default Project with Seed Data
-- ============================================

-- Insert the project
INSERT INTO projects (id, deed_date, project_params, portage_formula)
VALUES (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  '2026-02-01',
  '{
    "totalPurchase": 650000,
    "mesuresConservatoires": 0,
    "demolition": 0,
    "infrastructures": 0,
    "etudesPreparatoires": 0,
    "fraisEtudesPreparatoires": 0,
    "fraisGeneraux3ans": 0,
    "batimentFondationConservatoire": 0,
    "batimentFondationComplete": 0,
    "batimentCoproConservatoire": 0,
    "globalCascoPerM2": 1590,
    "cascoTvaRate": 6,
    "maxTotalLots": 11,
    "renovationStartDate": "2027-02-23",
    "expenseCategories": {
      "conservatoire": [
        {"label": "Traitement Mérule", "amount": 40000},
        {"label": "Démolition (mérule)", "amount": 20000},
        {"label": "nettoyage du site", "amount": 6000},
        {"label": "toitures", "amount": 10000},
        {"label": "sécurité du site? (portes, accès..)", "amount": 2000}
      ],
      "habitabiliteSommaire": [
        {"label": "plomberie", "amount": 1000},
        {"label": "électricité (refaire un tableau)", "amount": 1000},
        {"label": "retirer des lignes (électrique)", "amount": 2000},
        {"label": "isolation thermique", "amount": 1000},
        {"label": "cloisons", "amount": 2000},
        {"label": "chauffage", "amount": 0}
      ],
      "premierTravaux": [
        {"label": "poulailler", "amount": 150},
        {"label": "atelier maintenance (et reparation)", "amount": 500},
        {"label": "stockage ressources/énergie/consommables (eau, bois,...)", "amount": 700},
        {"label": "verger prix par 1ha", "amount": 2000},
        {"label": "atelier construction", "amount": 2500},
        {"label": "Cuisine (commune)", "amount": 3000},
        {"label": "travaux chapelle rudimentaires", "amount": 5000},
        {"label": "local + outil jardin", "amount": 5000}
      ]
    },
    "travauxCommuns": {
      "enabled": true,
      "items": [
        {
          "label": "Rénovation complète",
          "sqm": 338,
          "cascoPricePerSqm": 600,
          "parachevementPricePerSqm": 200,
          "amount": 270000
        }
      ]
    }
  }'::jsonb,
  '{
    "indexationRate": 2,
    "carryingCostRecovery": 100,
    "averageInterestRate": 4.5,
    "coproReservesShare": 0
  }'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  deed_date = EXCLUDED.deed_date,
  project_params = EXCLUDED.project_params,
  portage_formula = EXCLUDED.portage_formula;

-- ============================================
-- Insert Participants (9 participants)
-- ============================================

-- Clear existing participants for this project
DELETE FROM participants WHERE project_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

-- Participant 1: Manuela/Dragan (Founder)
INSERT INTO participants (
  project_id, display_order, name, enabled, is_founder, entry_date,
  surface, capital_apporte, registration_fees_rate, interest_rate, duration_years,
  unit_id, quantity, parachevements_per_m2, casco_sqm, parachevements_sqm,
  use_two_loans, loan2_delay_years, loan2_renovation_amount, capital_for_loan2
)
VALUES (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 0, 'Manuela/Dragan', true, true, '2026-02-01',
  150, 50000, 3, 4, 25,
  1, 1, 500, 140, 120,
  true, 1.5, 200000, 100000
);

-- Participant 2: Cathy/Jim (Founder)
INSERT INTO participants (
  project_id, display_order, name, enabled, is_founder, entry_date,
  surface, capital_apporte, registration_fees_rate, interest_rate, duration_years,
  unit_id, quantity, parachevements_per_m2, casco_sqm, parachevements_sqm,
  use_two_loans, loan2_renovation_amount, capital_for_loan1, capital_for_loan2
)
VALUES (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 1, 'Cathy/Jim', true, true, '2026-02-01',
  225, 450000, 3, 4.5, 25,
  3, 1, 250, 175, 225,
  true, 266925, 150000, 300000
);

-- Participant 3: Annabelle/Colin (Founder with lot)
INSERT INTO participants (
  project_id, display_order, name, enabled, is_founder, entry_date,
  surface, capital_apporte, registration_fees_rate, interest_rate, duration_years,
  unit_id, quantity, parachevements_per_m2, casco_sqm, parachevements_sqm,
  lots_owned
)
VALUES (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 2, 'Annabelle/Colin', true, true, '2026-02-01',
  200, 200000, 12.5, 4, 25,
  5, 1, 500, 120, 120,
  '[{
    "lotId": 1,
    "unitId": 5,
    "acquiredDate": "2026-02-01T00:00:00.000Z",
    "isPortage": false,
    "allocatedSurface": 118,
    "surface": 118
  }]'::jsonb
);

-- Participant 4: Julie/Séverin (Founder)
INSERT INTO participants (
  project_id, display_order, name, enabled, is_founder, entry_date,
  surface, capital_apporte, registration_fees_rate, interest_rate, duration_years,
  unit_id, quantity, parachevements_per_m2,
  use_two_loans, loan2_renovation_amount, capital_for_loan1, capital_for_loan2
)
VALUES (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 3, 'Julie/Séverin', true, true, '2026-02-01',
  150, 245000, 3, 4, 25,
  6, 1, 500,
  true, 236023.2, 70000, 175000
);

-- Participant 5: Participant·e 5 (Non-founder, buying from Copropriété)
INSERT INTO participants (
  project_id, display_order, name, enabled, is_founder, entry_date,
  surface, capital_apporte, registration_fees_rate, interest_rate, duration_years,
  unit_id, quantity, parachevements_per_m2,
  purchase_details
)
VALUES (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 4, 'Participant·e 5', true, false, '2027-02-01',
  60, 50000, 3, 4, 25,
  7, 1, 500,
  '{
    "buyingFrom": "Copropriété",
    "lotId": 999,
    "purchasePrice": 88399.43025077418,
    "breakdown": {
      "basePrice": 82620,
      "indexation": 1651.257766174592,
      "carryingCostRecovery": 4128.17248459959,
      "feesRecovery": 0,
      "renovations": 0
    }
  }'::jsonb
);

-- Participant 6: Participant·e 6 (Non-founder)
INSERT INTO participants (
  project_id, display_order, name, enabled, is_founder, entry_date,
  surface, capital_apporte, registration_fees_rate, interest_rate, duration_years,
  unit_id, quantity, parachevements_per_m2,
  purchase_details
)
VALUES (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 5, 'Participant·e 6', true, false, '2027-02-01',
  101, 100000, 12.5, 4.5, 25,
  8, 1, 500,
  '{
    "buyingFrom": "Copropriété",
    "lotId": 999,
    "purchasePrice": 147332.3837512903
  }'::jsonb
);

-- Participant 7: Participant·e 7 (Non-founder)
INSERT INTO participants (
  project_id, display_order, name, enabled, is_founder, entry_date,
  surface, capital_apporte, registration_fees_rate, interest_rate, duration_years,
  unit_id, quantity, parachevements_per_m2,
  purchase_details
)
VALUES (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 6, 'Participant·e 7', true, false, '2027-02-01',
  100, 100000, 12.5, 4.5, 25,
  9, 1, 500,
  '{
    "buyingFrom": "Copropriété",
    "lotId": 999,
    "purchasePrice": 147332.3837512903
  }'::jsonb
);

-- Participant 8: Participant·e 8 (Non-founder)
INSERT INTO participants (
  project_id, display_order, name, enabled, is_founder, entry_date,
  surface, capital_apporte, registration_fees_rate, interest_rate, duration_years,
  unit_id, quantity, parachevements_per_m2,
  purchase_details
)
VALUES (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 7, 'Participant·e 8', true, false, '2027-02-01',
  100, 100000, 12.5, 4.5, 25,
  10, 1, 500,
  '{
    "buyingFrom": "Copropriété",
    "lotId": 999,
    "purchasePrice": 147332.3837512903
  }'::jsonb
);

-- Participant 9: Participant·e 9 (Non-founder)
INSERT INTO participants (
  project_id, display_order, name, enabled, is_founder, entry_date,
  surface, capital_apporte, registration_fees_rate, interest_rate, duration_years,
  unit_id, quantity, parachevements_per_m2,
  purchase_details
)
VALUES (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 8, 'Participant·e 9', true, false, '2027-02-01',
  100, 100000, 12.5, 4.5, 25,
  11, 1, 500,
  '{
    "buyingFrom": "Copropriété",
    "lotId": 999,
    "purchasePrice": 147332.3837512903
  }'::jsonb
);
