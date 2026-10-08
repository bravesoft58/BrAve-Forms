-- Rollback for 20261008182217_submission_alerts.sql (BF-72).
-- Revert the app first: the Waterways actions and view page use this table.
-- Dropping it loses the record of which sheen/plume alerts were sent; the
-- inspections themselves are untouched.
DROP TABLE IF EXISTS public.submission_alerts;
