create table if not exists public.okrs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  type text not null check (type in ('yearly', '12week', 'objective', 'key_result')),
  parent_id uuid references public.okrs(id) on delete set null,
  period_start date,
  period_end date,
  status text not null default 'draft' check (status in ('draft', 'active', 'complete', 'abandoned')),
  progress integer not null default 0 check (progress >= 0 and progress <= 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  is_trashed boolean not null default false,
  trashed_at timestamptz
);

alter table public.okrs enable row level security;
