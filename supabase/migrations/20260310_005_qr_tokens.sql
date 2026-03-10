-- QR tokens for inspector portal access
create table qr_tokens (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  token uuid not null default gen_random_uuid() unique,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  created_by uuid not null references auth.users(id)
);

-- Index for token lookups
create index idx_qr_tokens_token on qr_tokens(token);

-- RLS: authenticated users can manage tokens for their projects
alter table qr_tokens enable row level security;

create policy "Users can manage QR tokens for assigned projects"
  on qr_tokens for all
  using (
    project_id in (
      select project_id from project_users where user_id = auth.uid()
    )
  );
