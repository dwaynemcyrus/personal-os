-- Enable RLS on all tables that don't have it yet
alter table public.projects        enable row level security;
alter table public.tasks           enable row level security;
alter table public.notes           enable row level security;
alter table public.habits          enable row level security;
alter table public.habit_completions enable row level security;
alter table public.time_entries    enable row level security;
alter table public.note_links      enable row level security;
alter table public.templates       enable row level security;
alter table public.note_versions   enable row level security;

-- Drop the incomplete templates policy before replacing it
drop policy if exists "Users can manage their own templates" on public.templates;

-- Single permissive policy per table: any authenticated user has full access.
-- This is correct for a private single-user app — the auth layer IS the access control.
create policy "authenticated_all" on public.projects
  for all to authenticated using (true) with check (true);

create policy "authenticated_all" on public.tasks
  for all to authenticated using (true) with check (true);

create policy "authenticated_all" on public.notes
  for all to authenticated using (true) with check (true);

create policy "authenticated_all" on public.habits
  for all to authenticated using (true) with check (true);

create policy "authenticated_all" on public.habit_completions
  for all to authenticated using (true) with check (true);

create policy "authenticated_all" on public.time_entries
  for all to authenticated using (true) with check (true);

create policy "authenticated_all" on public.note_links
  for all to authenticated using (true) with check (true);

create policy "authenticated_all" on public.templates
  for all to authenticated using (true) with check (true);

create policy "authenticated_all" on public.note_versions
  for all to authenticated using (true) with check (true);

create policy "authenticated_all" on public.captures
  for all to authenticated using (true) with check (true);

create policy "authenticated_all" on public.okrs
  for all to authenticated using (true) with check (true);

create policy "authenticated_all" on public.tags
  for all to authenticated using (true) with check (true);

create policy "authenticated_all" on public.areas
  for all to authenticated using (true) with check (true);
