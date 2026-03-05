# BF-01: Database Schema + RLS Policies

**Sprint:** Sprint 1 - Foundation + First Form
**Story Points:** 5
**Priority:** CRITICAL BLOCKER
**Dependencies:** None
**Status:** NOT STARTED
**Created:** 2026-03-05
**Last Updated:** 2026-03-05T00:00:00Z
**Backlog Ref:** Andy Salvage Plan Section 11 (Database Schema Changes)

---

## Summary

Create the complete Supabase database schema for BrAve Forms v2. This includes all core tables (profiles, projects, permits, form requirements, form submissions, project users, project documents), enums, foreign keys, indexes, and Row Level Security policies. This is the foundation every other story builds on.

---

## CEO Directives

- Andy's field spec (Project Setup.docx) defines all project fields -- implement exactly as specified
- Permit-to-form trigger mapping is business logic, not optional (SAD/Dust Control -> Dust Log, NDOT Stormwater -> NDOT form, NDEP Stormwater -> NDEP form)
- Single-tenant for Q&D pilot -- RLS can be simple (auth.uid() based) without org isolation

---

## Acceptance Criteria

- [ ] `profiles` table exists with id (references auth.users), role (admin/user), full_name, email, created_at, updated_at
- [ ] `projects` table exists with all fields from Andy's spec (name, address, start_date, completion_date, superintendent_*, foreman_*, project_manager_*, owner_rep_*, acres_disturbed, soil_type, parcel_numbers, description, status, created_by, lat, lng)
- [ ] `project_permits` table exists with project_id FK, permit_type enum, permit_number, created_at
- [ ] `project_form_requirements` table exists with project_id FK, form_type enum, is_required, added_by (auto_permit/manual), created_at
- [ ] `form_submissions` table exists with project_id FK, form_type enum, submitted_by FK, data (jsonb), status (draft/submitted/reviewed), created_at, updated_at
- [ ] `project_users` table exists with project_id + user_id FKs, role (admin/member), unique constraint on (project_id, user_id)
- [ ] `project_documents` table exists with project_id FK, name, category enum, file_url, file_size, mime_type, uploaded_by, created_at
- [ ] permit_type enum: sad, dust_control, stormwater_ndot, stormwater_ndep, waterway, other
- [ ] form_type enum: dust_log, ndep_stormwater, ndot_stormwater, ndep_sad, nnph_dust_permit
- [ ] document_category enum: permit, contract, map, plan, other
- [ ] RLS enabled on all tables with policies for authenticated users
- [ ] Profile auto-created on auth.users insert via trigger
- [ ] Migration runs cleanly via Supabase dashboard or CLI
- [ ] All tables have appropriate indexes (project_id FKs, form_type + project_id on submissions)

---

## Tasks

- [ ] T-01.1: Design and write SQL migration for enums and profiles table + auth trigger (1h)
- [ ] T-01.2: Write SQL migration for projects table with all Andy spec fields (1h)
- [ ] T-01.3: Write SQL migration for project_permits, project_form_requirements, project_users (1h)
- [ ] T-01.4: Write SQL migration for form_submissions and project_documents (1h)
- [ ] T-01.5: Write RLS policies for all tables (1.5h)
- [ ] T-01.6: Add indexes and verify migration runs cleanly (0.5h)
- [ ] T-01.7: Insert seed data -- sample Q&D project with permits and form requirements (1h)

---

## Files to Modify

| File | Change |
|------|--------|
| `supabase/migrations/YYYYMMDD_001_initial_schema.sql` | CREATE -- Complete schema migration (~200 lines) |
| `supabase/seed.sql` | CREATE -- Sample Q&D project data (~50 lines) |

---

## Key Interfaces

```sql
-- Core enums
CREATE TYPE permit_type AS ENUM ('sad', 'dust_control', 'stormwater_ndot', 'stormwater_ndep', 'waterway', 'other');
CREATE TYPE form_type AS ENUM ('dust_log', 'ndep_stormwater', 'ndot_stormwater', 'ndep_sad', 'nnph_dust_permit');
CREATE TYPE document_category AS ENUM ('permit', 'contract', 'map', 'plan', 'other');
CREATE TYPE project_status AS ENUM ('active', 'completed', 'on_hold', 'archived');
CREATE TYPE submission_status AS ENUM ('draft', 'submitted', 'reviewed');
CREATE TYPE user_role AS ENUM ('admin', 'user');
CREATE TYPE project_role AS ENUM ('admin', 'member');
CREATE TYPE form_requirement_source AS ENUM ('auto_permit', 'manual');

-- Profile auto-creation trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name', 'user');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## Technical Approach

| Component | Verdict | Rationale |
|-----------|---------|-----------|
| Schema | Supabase SQL migration | Direct SQL, no ORM. Supabase manages migrations. |
| Enums | PostgreSQL native enums | Type safety at DB level, maps to TypeScript unions |
| RLS | Row Level Security | Supabase standard -- auth.uid() based policies |
| UUIDs | gen_random_uuid() | Built-in, no extension needed (gotcha: uuid_generate_v4 unavailable) |
| Profile sync | DB trigger on auth.users | Standard Supabase pattern for profile auto-creation |

---

## Testing

Manual verification:
- Run migration via Supabase dashboard SQL editor
- Verify all tables visible in Table Editor
- Insert test data via SQL
- Verify RLS blocks unauthenticated access
- Verify RLS allows authenticated user's own data
