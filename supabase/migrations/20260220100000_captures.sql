create table if not exists public.captures (
  id uuid primary key default gen_random_uuid(),
  body text not null,
  source text,
  processed boolean not null default false,
  processed_at timestamptz,
  result_type text,
  result_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  is_trashed boolean not null default false,
  trashed_at timestamptz
);

alter table public.captures enable row level security;
