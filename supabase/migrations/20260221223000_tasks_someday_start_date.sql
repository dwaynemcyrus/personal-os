-- tasks: add start_date and migrate waiting -> someday status

alter table public.tasks
  add column if not exists start_date timestamptz;

-- Normalize legacy values before tightening the status constraint.
update public.tasks
set status = 'next'
where status = 'active';

update public.tasks
set status = 'someday'
where status = 'waiting';

update public.tasks
set status = 'backlog'
where status is null
  or status not in ('backlog', 'next', 'someday');

alter table public.tasks
  alter column status set default 'backlog';

alter table public.tasks
  drop constraint if exists tasks_status_check,
  add constraint tasks_status_check
    check (status in ('backlog', 'next', 'someday'));

create index if not exists idx_tasks_status on public.tasks(status);
create index if not exists idx_tasks_due_date on public.tasks(due_date);
create index if not exists idx_tasks_start_date on public.tasks(start_date);
