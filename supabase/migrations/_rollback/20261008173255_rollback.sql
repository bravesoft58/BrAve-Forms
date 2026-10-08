-- Rollback for 20261008173255_organization_email_settings.sql (BF-74).
-- Revert the app first: the settings page and sendOrgEmail read this table.
-- Dropping the table loses every organization's email settings, including the
-- encrypted client secret; the org admin re-enters them after a re-apply.
DROP TABLE IF EXISTS public.organization_email_settings;
