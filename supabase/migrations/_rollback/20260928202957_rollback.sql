-- BF-60 C1 ROLLBACK: restore PostgreSQL's built-in PUBLIC EXECUTE default on
-- functions created by postgres.
-- Pair: supabase/migrations/20260928202957_default_function_execute_global.sql
--
-- Granting it back makes the global entry equal the built-in default, so
-- PostgreSQL drops the pg_default_acl row and the state is exactly as before.
-- New functions become callable by anon and authenticated again through PUBLIC.

ALTER DEFAULT PRIVILEGES FOR ROLE postgres
  GRANT EXECUTE ON FUNCTIONS TO PUBLIC;
