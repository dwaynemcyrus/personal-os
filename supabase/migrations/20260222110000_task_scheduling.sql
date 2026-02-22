-- Remove status column, add scheduling fields to tasks
alter table public.tasks drop column if exists status;
alter table public.tasks add column if not exists is_next boolean not null default false;
alter table public.tasks add column if not exists is_waiting boolean not null default false;
alter table public.tasks add column if not exists waiting_note text;
alter table public.tasks add column if not exists waiting_started_at timestamptz;
