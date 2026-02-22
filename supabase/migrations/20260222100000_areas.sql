create table if not exists public.areas (
  id uuid primary key,
  title text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  is_trashed boolean not null default false,
  trashed_at timestamptz
);

alter table public.areas enable row level security;

alter table public.tasks add column if not exists area_id uuid references public.areas(id);
alter table public.projects add column if not exists area_id uuid references public.areas(id);
