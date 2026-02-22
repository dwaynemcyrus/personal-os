create table if not exists public.tags (
  id uuid primary key,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  is_trashed boolean not null default false,
  trashed_at timestamptz
);

alter table public.tags enable row level security;
