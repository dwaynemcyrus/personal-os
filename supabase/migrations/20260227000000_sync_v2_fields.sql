-- Sync Architecture v2.0: add owner, device_id, revision, deleted to all synced tables
do $$
declare
  t text;
begin
  foreach t in array array[
    'projects','tasks','notes','habits','habit_completions',
    'time_entries','note_links','templates','note_versions',
    'captures','okrs','tags','areas'
  ]
  loop
    execute format('alter table public.%I add column if not exists owner uuid references auth.users(id)', t);
    execute format('alter table public.%I add column if not exists device_id text', t);
    execute format('alter table public.%I add column if not exists revision integer not null default 0', t);
    execute format('alter table public.%I add column if not exists deleted boolean not null default false', t);
  end loop;
end $$;

-- Enable Realtime for all synced tables
alter publication supabase_realtime add table public.projects;
alter publication supabase_realtime add table public.tasks;
alter publication supabase_realtime add table public.notes;
alter publication supabase_realtime add table public.habits;
alter publication supabase_realtime add table public.habit_completions;
alter publication supabase_realtime add table public.time_entries;
alter publication supabase_realtime add table public.note_links;
alter publication supabase_realtime add table public.templates;
alter publication supabase_realtime add table public.note_versions;
alter publication supabase_realtime add table public.captures;
alter publication supabase_realtime add table public.okrs;
alter publication supabase_realtime add table public.tags;
alter publication supabase_realtime add table public.areas;
