-- Rollback for 20261008152320_waterway_contact.sql (BF-70).
-- Dropping the columns also drops their column-level grants. Any contact
-- values entered since the migration are lost; export them first if needed.
ALTER TABLE public.projects
  DROP COLUMN IF EXISTS waterway_contact_name,
  DROP COLUMN IF EXISTS waterway_contact_phone,
  DROP COLUMN IF EXISTS waterway_contact_email;
