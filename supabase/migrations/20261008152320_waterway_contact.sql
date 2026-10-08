-- BF-70: project-level waterway contact (name, phone, email).
--
-- Shown beside "Visible sheen/plume?" on the Working in Waterways form
-- ("If yes, call {name} at {phone} immediately") and, in BF-72, the recipient
-- of the sheen alert email. Project-level only (Tim, 2026-10-08): an
-- organisation default waits for a second customer. Follows the
-- superintendent/foreman/pm/owner_rep triples already on projects.

ALTER TABLE public.projects
  ADD COLUMN waterway_contact_name text,
  ADD COLUMN waterway_contact_phone text,
  ADD COLUMN waterway_contact_email text;

-- BF-60 revoked table-wide UPDATE on projects and grants columns one by one.
-- Postgres checks the privilege per column or for the whole table, so a column
-- added without its own grant is silently read-only through the user client:
-- the admin's save reports success and the three fields never change.
GRANT UPDATE (waterway_contact_name, waterway_contact_phone, waterway_contact_email)
  ON TABLE public.projects TO authenticated;
