-- BrAve Forms v2 - Seed Data
-- Sample Q&D Construction project with permits and form requirements
-- Run via: supabase db seed OR execute_sql

-- Insert a sample project (uses service role, bypasses RLS)
INSERT INTO projects (id, name, address, start_date, completion_date, description,
  acres_disturbed, soil_type, superintendent_name, superintendent_phone,
  company_name, status)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'US-95 Widening Phase 2',
  '1234 US Highway 95, Las Vegas, NV 89101',
  '2026-03-01',
  '2026-09-30',
  'Highway widening project - 2.5 mile stretch with full earthwork and drainage improvements.',
  12.50,
  'Sandy loam with caliche',
  'Mike Rodriguez',
  '702-555-0101',
  'Q&D Construction',
  'active'
) ON CONFLICT (id) DO NOTHING;

-- Permits that trigger form requirements
INSERT INTO project_permits (id, project_id, permit_type, permit_number, notes) VALUES
  ('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001',
   'surface_area_disturbance', 'SAD-2026-0042', 'NDEP Surface Area Disturbance permit'),
  ('00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000001',
   'dust_control', 'DC-2026-1187', 'Clark County dust control permit'),
  ('00000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000001',
   'stormwater_ndot', 'SWPPP-NDOT-2026-088', 'NDOT stormwater pollution prevention plan')
ON CONFLICT (id) DO NOTHING;

-- Form requirements (auto-derived from permits + one manual)
INSERT INTO project_form_requirements (id, project_id, form_type, is_required, added_by) VALUES
  ('00000000-0000-0000-0000-000000000020', '00000000-0000-0000-0000-000000000001',
   'daily_dust_log', true, 'auto_permit'),
  ('00000000-0000-0000-0000-000000000021', '00000000-0000-0000-0000-000000000001',
   'ndot_weekly_stormwater', true, 'auto_permit'),
  ('00000000-0000-0000-0000-000000000022', '00000000-0000-0000-0000-000000000001',
   'ndep_sad_application', true, 'manual')
ON CONFLICT (project_id, form_type) DO NOTHING;
