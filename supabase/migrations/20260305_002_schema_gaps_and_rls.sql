-- BrAve Forms v2 - Schema Gaps & RLS Performance Fix
-- BF-01: Fills gaps vs story ACs, fixes slow RLS patterns
-- Applied: 2026-03-05

-- ============================================
-- 1. PROFILE AUTO-CREATION TRIGGER
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', ''),
    'user'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 2. PROJECT FORM REQUIREMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS project_form_requirements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  form_type text NOT NULL CHECK (form_type IN (
    'daily_dust_log', 'ndep_weekly_stormwater', 'ndot_weekly_stormwater',
    'ndep_sad_application', 'nnph_dust_permit'
  )),
  is_required boolean NOT NULL DEFAULT true,
  added_by text NOT NULL DEFAULT 'manual' CHECK (added_by IN ('auto_permit', 'manual')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(project_id, form_type)
);
ALTER TABLE project_form_requirements ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_form_requirements_project ON project_form_requirements(project_id);

-- ============================================
-- 3. ADD project_users.role COLUMN
-- ============================================
ALTER TABLE project_users ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'member'
  CHECK (role IN ('admin', 'member'));

-- ============================================
-- 4. FIX STATUS CHECK CONSTRAINTS
-- ============================================
ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_status_check;
ALTER TABLE projects ADD CONSTRAINT projects_status_check
  CHECK (status IN ('active', 'completed', 'on_hold', 'archived'));

ALTER TABLE form_submissions DROP CONSTRAINT IF EXISTS form_submissions_status_check;
ALTER TABLE form_submissions ADD CONSTRAINT form_submissions_status_check
  CHECK (status IN ('draft', 'submitted', 'reviewed', 'revised'));

-- ============================================
-- 5. SECURITY DEFINER HELPER FUNCTIONS (RLS perf)
-- ============================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.get_user_project_ids()
RETURNS uuid[] AS $$
BEGIN
  RETURN ARRAY(
    SELECT project_id FROM public.project_users
    WHERE user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================
-- 6. DROP ALL EXISTING RLS POLICIES
-- ============================================
DROP POLICY IF EXISTS "profiles_select" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
DROP POLICY IF EXISTS "projects_select_admin" ON projects;
DROP POLICY IF EXISTS "projects_select_assigned" ON projects;
DROP POLICY IF EXISTS "projects_select" ON projects;
DROP POLICY IF EXISTS "projects_insert_admin" ON projects;
DROP POLICY IF EXISTS "projects_insert" ON projects;
DROP POLICY IF EXISTS "projects_update_admin" ON projects;
DROP POLICY IF EXISTS "projects_update" ON projects;
DROP POLICY IF EXISTS "project_users_select" ON project_users;
DROP POLICY IF EXISTS "project_users_admin" ON project_users;
DROP POLICY IF EXISTS "project_users_insert" ON project_users;
DROP POLICY IF EXISTS "project_users_update" ON project_users;
DROP POLICY IF EXISTS "project_users_delete" ON project_users;
DROP POLICY IF EXISTS "permits_select" ON project_permits;
DROP POLICY IF EXISTS "permits_admin" ON project_permits;
DROP POLICY IF EXISTS "permits_insert" ON project_permits;
DROP POLICY IF EXISTS "permits_update" ON project_permits;
DROP POLICY IF EXISTS "permits_delete" ON project_permits;
DROP POLICY IF EXISTS "documents_select" ON project_documents;
DROP POLICY IF EXISTS "documents_insert" ON project_documents;
DROP POLICY IF EXISTS "submissions_select" ON form_submissions;
DROP POLICY IF EXISTS "submissions_insert" ON form_submissions;
DROP POLICY IF EXISTS "submissions_update" ON form_submissions;
DROP POLICY IF EXISTS "photos_select" ON form_photos;
DROP POLICY IF EXISTS "photos_insert" ON form_photos;
DROP POLICY IF EXISTS "form_requirements_select" ON project_form_requirements;
DROP POLICY IF EXISTS "form_requirements_insert" ON project_form_requirements;
DROP POLICY IF EXISTS "form_requirements_update" ON project_form_requirements;
DROP POLICY IF EXISTS "form_requirements_delete" ON project_form_requirements;

-- ============================================
-- 7. RECREATE ALL RLS POLICIES (perf patterns)
-- ============================================
-- Pattern: TO authenticated, (select is_admin()), = ANY(get_user_project_ids())

-- --- PROFILES ---
CREATE POLICY "profiles_select" ON profiles
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE TO authenticated
  USING ((select auth.uid()) = id);

-- --- PROJECTS ---
CREATE POLICY "projects_select" ON projects
  FOR SELECT TO authenticated
  USING (
    (select is_admin())
    OR id = ANY(get_user_project_ids())
  );

CREATE POLICY "projects_insert" ON projects
  FOR INSERT TO authenticated
  WITH CHECK ((select is_admin()));

CREATE POLICY "projects_update" ON projects
  FOR UPDATE TO authenticated
  USING ((select is_admin()));

-- --- PROJECT USERS ---
CREATE POLICY "project_users_select" ON project_users
  FOR SELECT TO authenticated
  USING (
    (select is_admin())
    OR user_id = (select auth.uid())
  );

CREATE POLICY "project_users_insert" ON project_users
  FOR INSERT TO authenticated
  WITH CHECK ((select is_admin()));

CREATE POLICY "project_users_update" ON project_users
  FOR UPDATE TO authenticated
  USING ((select is_admin()));

CREATE POLICY "project_users_delete" ON project_users
  FOR DELETE TO authenticated
  USING ((select is_admin()));

-- --- PROJECT PERMITS ---
CREATE POLICY "permits_select" ON project_permits
  FOR SELECT TO authenticated
  USING (
    (select is_admin())
    OR project_id = ANY(get_user_project_ids())
  );

CREATE POLICY "permits_insert" ON project_permits
  FOR INSERT TO authenticated
  WITH CHECK ((select is_admin()));

CREATE POLICY "permits_update" ON project_permits
  FOR UPDATE TO authenticated
  USING ((select is_admin()));

CREATE POLICY "permits_delete" ON project_permits
  FOR DELETE TO authenticated
  USING ((select is_admin()));

-- --- PROJECT DOCUMENTS ---
CREATE POLICY "documents_select" ON project_documents
  FOR SELECT TO authenticated
  USING (
    (select is_admin())
    OR project_id = ANY(get_user_project_ids())
  );

CREATE POLICY "documents_insert" ON project_documents
  FOR INSERT TO authenticated
  WITH CHECK (
    (select is_admin())
    OR project_id = ANY(get_user_project_ids())
  );

-- --- FORM SUBMISSIONS ---
CREATE POLICY "submissions_select" ON form_submissions
  FOR SELECT TO authenticated
  USING (
    (select is_admin())
    OR project_id = ANY(get_user_project_ids())
  );

CREATE POLICY "submissions_insert" ON form_submissions
  FOR INSERT TO authenticated
  WITH CHECK (
    (select is_admin())
    OR project_id = ANY(get_user_project_ids())
  );

CREATE POLICY "submissions_update" ON form_submissions
  FOR UPDATE TO authenticated
  USING (
    (select is_admin())
    OR project_id = ANY(get_user_project_ids())
  );

-- --- FORM PHOTOS ---
CREATE POLICY "photos_select" ON form_photos
  FOR SELECT TO authenticated
  USING (
    (select is_admin())
    OR submission_id IN (
      SELECT id FROM form_submissions
      WHERE project_id = ANY(get_user_project_ids())
    )
  );

CREATE POLICY "photos_insert" ON form_photos
  FOR INSERT TO authenticated
  WITH CHECK (
    (select is_admin())
    OR submission_id IN (
      SELECT id FROM form_submissions
      WHERE project_id = ANY(get_user_project_ids())
    )
  );

-- --- PROJECT FORM REQUIREMENTS ---
CREATE POLICY "form_requirements_select" ON project_form_requirements
  FOR SELECT TO authenticated
  USING (
    (select is_admin())
    OR project_id = ANY(get_user_project_ids())
  );

CREATE POLICY "form_requirements_insert" ON project_form_requirements
  FOR INSERT TO authenticated
  WITH CHECK ((select is_admin()));

CREATE POLICY "form_requirements_update" ON project_form_requirements
  FOR UPDATE TO authenticated
  USING ((select is_admin()));

CREATE POLICY "form_requirements_delete" ON project_form_requirements
  FOR DELETE TO authenticated
  USING ((select is_admin()));
