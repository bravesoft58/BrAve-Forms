-- BF-60 (verify round 1, finding C1): stop new functions defaulting to PUBLIC EXECUTE
-- Pair: supabase/migrations/_rollback/20260928202957_rollback.sql
--
-- PostgreSQL gives PUBLIC EXECUTE on every new function as a built-in global
-- default. 20260928194436 revoked it with ALTER DEFAULT PRIVILEGES ... IN SCHEMA
-- public, which is a no-op for this purpose: per-schema default privileges can
-- only add to the global setting, never remove from it (PostgreSQL 15 docs,
-- ALTER DEFAULT PRIVILEGES). A function created in public after that migration
-- was still callable by anon and authenticated through PUBLIC, so the next
-- SECURITY DEFINER function would have reopened the advisor 0028 hole. Proven in
-- a rolled-back test on production 2026-09-28: new function anon=t before this
-- statement, anon=f authenticated=f after.
--
-- The revoke has to be global (no IN SCHEMA). It covers functions the postgres
-- role creates in any schema. Schemas with their own per-schema grants (storage)
-- keep them, because per-schema grants still add. Any other function postgres
-- creates later, including one installed by an extension run as postgres, needs
-- an explicit GRANT EXECUTE to the roles that call it. That is the same
-- convention 20260928194436 set for tables and sequences.

ALTER DEFAULT PRIVILEGES FOR ROLE postgres
  REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;
