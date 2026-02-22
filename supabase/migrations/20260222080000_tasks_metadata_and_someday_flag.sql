-- tasks: move someday out of status, add task tags metadata

alter table public.tasks
  add column if not exists is_someday boolean not null default false,
  add column if not exists tags text[] not null default '{}';

-- Backfill from legacy status values.
update public.tasks
set is_someday = true
where status in ('someday', 'waiting');

update public.tasks
set status = 'backlog'
where status in ('someday', 'waiting')
  or status is null
  or status not in ('backlog', 'next');

update public.tasks
set tags = '{}'
where tags is null;

alter table public.tasks
  alter column status set default 'backlog',
  alter column tags set default '{}';

alter table public.tasks
  drop constraint if exists tasks_status_check,
  add constraint tasks_status_check
    check (status in ('backlog', 'next'));

create index if not exists idx_tasks_is_someday on public.tasks(is_someday);
create index if not exists idx_tasks_tags_gin on public.tasks using gin(tags);
