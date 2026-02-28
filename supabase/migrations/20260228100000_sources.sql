create table if not exists public.sources (
  id uuid primary key,
  url text not null,
  title text,
  content_type text not null default 'article',
  read_status text not null default 'inbox',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  is_trashed boolean not null default false,
  trashed_at timestamptz,
  owner uuid references auth.users(id),
  device_id text,
  revision integer not null default 0,
  deleted boolean not null default false
);

alter table public.sources enable row level security;

create policy "authenticated_all" on public.sources
  for all to authenticated using (true) with check (true);

alter publication supabase_realtime add table public.sources;
