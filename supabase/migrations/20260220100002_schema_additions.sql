-- projects: add okr_id
alter table public.projects
  add column if not exists okr_id uuid references public.okrs(id) on delete set null;

-- tasks: add content, priority, depends_on, okr_id
alter table public.tasks
  add column if not exists content text,
  add column if not exists priority integer check (priority >= 1 and priority <= 4),
  add column if not exists depends_on uuid[] default '{}',
  add column if not exists okr_id uuid references public.okrs(id) on delete set null;

-- habits: add frequency, target, active, okr_id, streak, last_completed_at
alter table public.habits
  add column if not exists frequency text not null default 'daily' check (frequency in ('daily', 'weekdays', 'weekly')),
  add column if not exists target integer not null default 1,
  add column if not exists active boolean not null default true,
  add column if not exists okr_id uuid references public.okrs(id) on delete set null,
  add column if not exists streak integer not null default 0,
  add column if not exists last_completed_at timestamptz;
