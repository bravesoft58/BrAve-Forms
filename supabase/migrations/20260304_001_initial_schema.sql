-- BrAve Forms v2 - Initial Schema
-- Based on Andy's Salvage Plan (Feb 17, 2026)
-- 5 Nevada construction forms for Q&D Construction

-- Enable pgcrypto for gen_random_bytes (QR tokens)
create extension if not exists pgcrypto with schema extensions;

-- ============================================
-- PROFILES (extends Supabase Auth)
-- ============================================
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text not null,
  phone text,
  role text not null default 'user' check (role in ('admin', 'user')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================
-- PROJECTS
-- ============================================
create table projects (
  id uuid primary key default gen_random_uuid(),

  -- Required fields (per Andy's transcript)
  name text not null,
  address text not null,
  start_date date not null,
  completion_date date,

  -- Optional fields (per Project Setup.docx)
  description text,
  acres_disturbed numeric(10,2),
  soil_type text,
  parcel_numbers text,

  -- Superintendent contact
  superintendent_name text,
  superintendent_phone text,
  superintendent_email text,

  -- Foreman contact
  foreman_name text,
  foreman_phone text,
  foreman_email text,

  -- Project Manager contact
  pm_name text,
  pm_phone text,
  pm_email text,

  -- Owner Representative contact
  owner_rep_name text,
  owner_rep_phone text,
  owner_rep_email text,
  owner_rep_address text,

  -- Company info (for form auto-fill)
  company_name text default 'Q&D Construction',

  -- QR portal
  qr_token text unique default encode(extensions.gen_random_bytes(32), 'hex'),

  -- Metadata
  status text not null default 'active' check (status in ('active', 'completed', 'archived')),
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================
-- PROJECT USERS (assignment: users see only assigned projects)
-- ============================================
create table project_users (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  assigned_at timestamptz not null default now(),
  assigned_by uuid references profiles(id),
  unique(project_id, user_id)
);

-- ============================================
-- PERMITS (per project, triggers required forms)
-- ============================================
-- Permit types and their form triggers:
--   surface_area_disturbance -> daily_dust_log
--   dust_control             -> daily_dust_log
--   stormwater_ndot          -> ndot_weekly_stormwater
--   stormwater_ndep          -> ndep_weekly_stormwater
--   waterway                 -> TBD
--   other                    -> none

create table project_permits (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  permit_type text not null check (permit_type in (
    'surface_area_disturbance',
    'dust_control',
    'stormwater_ndot',
    'stormwater_ndep',
    'waterway',
    'other'
  )),
  permit_number text,
  notes text,
  created_at timestamptz not null default now()
);

-- ============================================
-- PROJECT DOCUMENTS (permits, contracts, maps, plans)
-- ============================================
create table project_documents (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  name text not null,
  file_path text not null, -- Supabase Storage path
  file_type text, -- pdf, docx, jpg, etc.
  file_size bigint,
  category text default 'general' check (category in (
    'permit', 'contract', 'map', 'plan', 'photo', 'general'
  )),
  uploaded_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

-- ============================================
-- FORM SUBMISSIONS (unified table, JSONB per form type)
-- ============================================
-- form_type determines JSONB structure:
--   daily_dust_log         -> dust log entries
--   ndep_weekly_stormwater -> NDEP 3-page checklist
--   ndot_weekly_stormwater -> NDOT 3-page form
--   ndep_sad_application   -> NDEP SAD permit application
--   nnph_dust_permit       -> NNPH dust control permit application

create table form_submissions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  form_type text not null check (form_type in (
    'daily_dust_log',
    'ndep_weekly_stormwater',
    'ndot_weekly_stormwater',
    'ndep_sad_application',
    'nnph_dust_permit'
  )),

  -- The form data (structure varies by form_type)
  data jsonb not null default '{}',

  -- Form metadata
  form_date date not null default current_date,
  status text not null default 'draft' check (status in ('draft', 'submitted', 'revised')),

  -- "Use Previous" reference
  based_on_id uuid references form_submissions(id),

  -- Signatures (stored as base64 or storage paths)
  signatures jsonb default '[]',

  -- Who submitted
  submitted_by uuid references profiles(id),
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================
-- FORM PHOTOS (attached to submissions, esp. NDOT)
-- ============================================
create table form_photos (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references form_submissions(id) on delete cascade,
  file_path text not null, -- Supabase Storage path
  caption text,
  taken_at timestamptz,
  latitude numeric(10,7),
  longitude numeric(10,7),
  created_at timestamptz not null default now()
);

-- ============================================
-- INDEXES
-- ============================================
create index idx_project_users_user on project_users(user_id);
create index idx_project_users_project on project_users(project_id);
create index idx_project_permits_project on project_permits(project_id);
create index idx_project_documents_project on project_documents(project_id);
create index idx_form_submissions_project on form_submissions(project_id);
create index idx_form_submissions_type on form_submissions(form_type);
create index idx_form_submissions_date on form_submissions(form_date desc);
create index idx_form_submissions_project_type on form_submissions(project_id, form_type, form_date desc);
create index idx_form_photos_submission on form_photos(submission_id);
create index idx_projects_qr_token on projects(qr_token);

-- ============================================
-- UPDATED_AT TRIGGER
-- ============================================
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_updated_at before update on profiles
  for each row execute function update_updated_at();
create trigger projects_updated_at before update on projects
  for each row execute function update_updated_at();
create trigger form_submissions_updated_at before update on form_submissions
  for each row execute function update_updated_at();

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
alter table profiles enable row level security;
alter table projects enable row level security;
alter table project_users enable row level security;
alter table project_permits enable row level security;
alter table project_documents enable row level security;
alter table form_submissions enable row level security;
alter table form_photos enable row level security;

-- Profiles: users can read all profiles, update own
create policy "profiles_select" on profiles for select using (true);
create policy "profiles_update_own" on profiles for update using (auth.uid() = id);

-- Projects: admins see all, users see assigned only
create policy "projects_select_admin" on projects for select
  using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

create policy "projects_select_assigned" on projects for select
  using (exists (select 1 from project_users where project_id = projects.id and user_id = auth.uid()));

create policy "projects_insert_admin" on projects for insert
  with check (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

create policy "projects_update_admin" on projects for update
  using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

-- Project users: admins manage, users can read their own assignments
create policy "project_users_select" on project_users for select
  using (user_id = auth.uid() or exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

create policy "project_users_admin" on project_users for all
  using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

-- Permits: same as project access
create policy "permits_select" on project_permits for select
  using (exists (
    select 1 from projects p
    left join project_users pu on pu.project_id = p.id
    where p.id = project_permits.project_id
    and (pu.user_id = auth.uid() or exists (select 1 from profiles where id = auth.uid() and role = 'admin'))
  ));

create policy "permits_admin" on project_permits for all
  using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

-- Documents: same as project access
create policy "documents_select" on project_documents for select
  using (exists (
    select 1 from projects p
    left join project_users pu on pu.project_id = p.id
    where p.id = project_documents.project_id
    and (pu.user_id = auth.uid() or exists (select 1 from profiles where id = auth.uid() and role = 'admin'))
  ));

create policy "documents_insert" on project_documents for insert
  with check (exists (
    select 1 from projects p
    left join project_users pu on pu.project_id = p.id
    where p.id = project_documents.project_id
    and (pu.user_id = auth.uid() or exists (select 1 from profiles where id = auth.uid() and role = 'admin'))
  ));

-- Form submissions: users can CRUD on assigned projects, admins on all
create policy "submissions_select" on form_submissions for select
  using (exists (
    select 1 from projects p
    left join project_users pu on pu.project_id = p.id
    where p.id = form_submissions.project_id
    and (pu.user_id = auth.uid() or exists (select 1 from profiles where id = auth.uid() and role = 'admin'))
  ));

create policy "submissions_insert" on form_submissions for insert
  with check (exists (
    select 1 from projects p
    left join project_users pu on pu.project_id = p.id
    where p.id = form_submissions.project_id
    and (pu.user_id = auth.uid() or exists (select 1 from profiles where id = auth.uid() and role = 'admin'))
  ));

create policy "submissions_update" on form_submissions for update
  using (exists (
    select 1 from projects p
    left join project_users pu on pu.project_id = p.id
    where p.id = form_submissions.project_id
    and (pu.user_id = auth.uid() or exists (select 1 from profiles where id = auth.uid() and role = 'admin'))
  ));

-- Form photos: same as submission access
create policy "photos_select" on form_photos for select
  using (exists (
    select 1 from form_submissions fs
    join projects p on p.id = fs.project_id
    left join project_users pu on pu.project_id = p.id
    where fs.id = form_photos.submission_id
    and (pu.user_id = auth.uid() or exists (select 1 from profiles where id = auth.uid() and role = 'admin'))
  ));

create policy "photos_insert" on form_photos for insert
  with check (exists (
    select 1 from form_submissions fs
    join projects p on p.id = fs.project_id
    left join project_users pu on pu.project_id = p.id
    where fs.id = form_photos.submission_id
    and (pu.user_id = auth.uid() or exists (select 1 from profiles where id = auth.uid() and role = 'admin'))
  ));

-- ============================================
-- QR PORTAL (anonymous read-only via token)
-- ============================================
-- Inspector access is handled at the application layer:
-- /inspector/[token] looks up project by qr_token,
-- then fetches submissions, documents, permits using service role key.
-- No RLS policy needed -- service role bypasses RLS.

-- ============================================
-- HELPER: Get required forms for a project based on permits
-- ============================================
create or replace function get_required_forms(p_project_id uuid)
returns text[] as $$
  select array_agg(distinct form_type) from (
    select case
      when permit_type in ('surface_area_disturbance', 'dust_control') then 'daily_dust_log'
      when permit_type = 'stormwater_ndot' then 'ndot_weekly_stormwater'
      when permit_type = 'stormwater_ndep' then 'ndep_weekly_stormwater'
    end as form_type
    from project_permits
    where project_id = p_project_id
    and permit_type not in ('waterway', 'other')
  ) sub
  where form_type is not null;
$$ language sql stable;

-- ============================================
-- HELPER: Get latest submission for "Use Previous"
-- ============================================
create or replace function get_latest_submission(p_project_id uuid, p_form_type text)
returns jsonb as $$
  select to_jsonb(fs.*) from form_submissions fs
  where fs.project_id = p_project_id
    and fs.form_type = p_form_type
    and fs.status = 'submitted'
  order by fs.form_date desc, fs.created_at desc
  limit 1;
$$ language sql stable;
