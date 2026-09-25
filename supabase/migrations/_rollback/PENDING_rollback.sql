-- BF-58.1 ROLLBACK: remove the Working in Waterways form type and site list.
-- Pair: supabase/migrations/PENDING_working_in_waterways.sql
--
-- DESTRUCTIVE: deletes every working_in_waterways submission (and its
-- form_photos rows through the FK cascade) and every project's waterway site
-- list, because the narrowed CHECKs cannot hold them. Photo files in Storage
-- are not touched. Export the rows first if they must be kept:
--   SELECT * FROM public.form_submissions WHERE form_type = 'working_in_waterways';
-- Deploy the pre-BF-58.1 app code together with this rollback.

DELETE FROM public.form_submissions WHERE form_type = 'working_in_waterways';
DELETE FROM public.project_form_requirements WHERE form_type = 'working_in_waterways';

ALTER TABLE public.form_submissions
  DROP CONSTRAINT form_submissions_form_type_check,
  ADD CONSTRAINT form_submissions_form_type_check CHECK (form_type IN (
    'daily_dust_log', 'ndep_weekly_stormwater', 'ndot_weekly_stormwater',
    'ndep_sad_application', 'nnph_dust_permit'
  ));

ALTER TABLE public.project_form_requirements
  DROP CONSTRAINT project_form_requirements_form_type_check,
  ADD CONSTRAINT project_form_requirements_form_type_check CHECK (form_type IN (
    'daily_dust_log', 'ndep_weekly_stormwater', 'ndot_weekly_stormwater',
    'ndep_sad_application', 'nnph_dust_permit'
  ));

ALTER TABLE public.projects DROP COLUMN waterway_sites;
