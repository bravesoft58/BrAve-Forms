-- ============================================
-- FIX: project_documents category check constraint
-- Initial schema (001) created table with categories:
--   'permit','contract','map','plan','photo','general'
-- Migration 004 used CREATE TABLE IF NOT EXISTS so its
-- constraint ('other' instead of 'general') was never applied.
-- UI sends 'other' — DB rejects it. Fix: update constraint.
-- Also add missing columns from 004 if absent.
-- ============================================

-- 1. Drop the old check constraint
alter table public.project_documents
  drop constraint if exists project_documents_category_check;

-- 2. Add new constraint with all valid categories
alter table public.project_documents
  add constraint project_documents_category_check
  check (category in ('permit', 'contract', 'map', 'plan', 'photo', 'general', 'other'));

-- 3. Add missing columns from migration 004 (if table came from 001)
-- mime_type column
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'project_documents'
      and column_name = 'mime_type'
  ) then
    alter table public.project_documents add column mime_type text not null default '';
  end if;
end $$;

-- Make category NOT NULL (001 had it nullable with default 'general')
alter table public.project_documents
  alter column category set not null;

-- Make file_size NOT NULL with default
alter table public.project_documents
  alter column file_size set not null,
  alter column file_size set default 0;

-- Make uploaded_by NOT NULL
alter table public.project_documents
  alter column uploaded_by set not null;
