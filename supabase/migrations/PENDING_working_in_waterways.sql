-- BF-58.1: Working in Waterways form type and per-project waterway sites
-- Pair: supabase/migrations/_rollback/PENDING_rollback.sql
--
-- 1. projects.waterway_sites: the project's fixed list of waterway locations,
--    a JSON array of {name, descriptor}. Only admins write it, through
--    updateProject; the element shape is validated by Zod there. The database
--    only guarantees it is an array.
-- 2. The two form-type CHECK constraints gain 'working_in_waterways'.
-- 3. Backfill: every project that already carries a Waterway permit gets the
--    auto_permit requirement row, which the app would otherwise only derive on
--    the next project edit. Production at 2026-09-25: NDOT 4541 and RNO 18.
--
-- Compatibility with the code deployed before BF-58.1 merges: the new column
-- has a default and old code never reads it; the CHECKs only widen. The old
-- updateProject re-derives requirement rows from a map without this form type,
-- so an edit of a waterway project before the deploy deletes the backfilled
-- row. The backfill is idempotent and is re-run once after the deploy.

-- =========================================================================
-- 1. Per-project waterway sites
-- =========================================================================
ALTER TABLE public.projects
  ADD COLUMN waterway_sites jsonb NOT NULL DEFAULT '[]'::jsonb
  CONSTRAINT projects_waterway_sites_is_array
    CHECK (jsonb_typeof(waterway_sites) = 'array');

COMMENT ON COLUMN public.projects.waterway_sites IS
  'BF-58.1: waterway sites for the Working in Waterways form, [{name, descriptor}]. Submissions snapshot the site, so edits here do not rewrite past records.';

-- =========================================================================
-- 2. Form-type CHECK constraints
-- =========================================================================
ALTER TABLE public.form_submissions
  DROP CONSTRAINT form_submissions_form_type_check,
  ADD CONSTRAINT form_submissions_form_type_check CHECK (form_type IN (
    'daily_dust_log', 'ndep_weekly_stormwater', 'ndot_weekly_stormwater',
    'ndep_sad_application', 'nnph_dust_permit', 'working_in_waterways'
  ));

ALTER TABLE public.project_form_requirements
  DROP CONSTRAINT project_form_requirements_form_type_check,
  ADD CONSTRAINT project_form_requirements_form_type_check CHECK (form_type IN (
    'daily_dust_log', 'ndep_weekly_stormwater', 'ndot_weekly_stormwater',
    'ndep_sad_application', 'nnph_dust_permit', 'working_in_waterways'
  ));

-- =========================================================================
-- 3. Backfill requirement rows for existing Waterway permits (idempotent)
-- =========================================================================
INSERT INTO public.project_form_requirements (project_id, form_type, added_by)
SELECT DISTINCT pp.project_id, 'working_in_waterways', 'auto_permit'
FROM public.project_permits pp
WHERE pp.permit_type = 'waterway'
ON CONFLICT (project_id, form_type) DO NOTHING;
