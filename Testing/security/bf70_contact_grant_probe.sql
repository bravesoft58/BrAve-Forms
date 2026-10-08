-- BF-70: read-only probe for the waterway contact migration (20261008152320).
-- Proves the effect, not the file (BF-60 lesson): the migration is recorded, the
-- three columns exist as nullable text, `authenticated` can UPDATE and SELECT them,
-- `anon` can do neither, table-wide UPDATE on projects is still revoked (so the
-- column grant is what lets an admin save), and the projects UPDATE policy is still
-- admin-only (so the column grant does not let a crew member change the contact).
--
-- Catalog reads only; no table rows are read or written. Safe on production. Run in
-- the Supabase SQL editor, or in a session opened with BEGIN READ ONLY. Every row
-- must show pass = true.

WITH cols(col) AS (
  VALUES ('waterway_contact_name'), ('waterway_contact_phone'), ('waterway_contact_email')
),
present AS (
  SELECT c.col,
         EXISTS (
           SELECT 1 FROM information_schema.columns i
           WHERE i.table_schema = 'public' AND i.table_name = 'projects'
             AND i.column_name = c.col AND i.data_type = 'text' AND i.is_nullable = 'YES'
         ) AS ok
  FROM cols c
),
-- has_column_privilege raises on a missing column, so only ask about present ones.
privs AS (
  SELECT p.col, r.role_name, r.priv, r.expected,
         CASE WHEN p.ok THEN has_column_privilege(r.role_name, 'public.projects', p.col, r.priv) END AS actual
  FROM present p
  CROSS JOIN (VALUES
    ('authenticated', 'UPDATE', true),
    ('authenticated', 'SELECT', true),
    ('anon',          'UPDATE', false),
    ('anon',          'SELECT', false)
  ) AS r(role_name, priv, expected)
)
SELECT 'migration 20261008152320 recorded' AS check_name,
       EXISTS (SELECT 1 FROM supabase_migrations.schema_migrations WHERE version = '20261008152320') AS pass
UNION ALL
SELECT 'column ' || col || ' exists as nullable text', ok FROM present
UNION ALL
SELECT role_name || ' ' || priv || ' on ' || col || ' = ' || expected::text,
       coalesce(actual = expected, false)
FROM privs
UNION ALL
SELECT 'authenticated has no table-wide UPDATE on projects (BF-60 still in force)',
       NOT has_table_privilege('authenticated', 'public.projects', 'UPDATE')
UNION ALL
SELECT 'every permissive UPDATE policy on projects requires is_org_admin',
       EXISTS (
         SELECT 1 FROM pg_policies
         WHERE schemaname = 'public' AND tablename = 'projects' AND cmd = 'UPDATE'
       )
       AND NOT EXISTS (
         SELECT 1 FROM pg_policies
         WHERE schemaname = 'public' AND tablename = 'projects'
           AND cmd IN ('UPDATE', 'ALL') AND permissive = 'PERMISSIVE'
           AND coalesce(qual, '') NOT LIKE '%is_org_admin%'
       );
