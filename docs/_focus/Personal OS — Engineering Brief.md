# Personal OS — Engineering Brief
**Date:** 2026-03-29
**Author:** Dwayne M Cyrus
**Repo:** https://github.com/dwaynemcyrus/personal-os
**Stack:** Next.js, Supabase, Vercel

---

## Context

This is a personal productivity PWA built as a local-first sync architecture.
It is currently over-engineered for daily use. The goal of this brief is to
strip it back to a functional, trustworthy daily driver in the shortest time
possible while preserving the existing codebase.

---

## Guiding Principles

- Every change must make the app simpler, not more complex
- Mobile and desktop must behave identically
- All documents are markdown files with YAML frontmatter synced to Supabase
- The app reads and writes markdown — Supabase is the sync layer, not the source of truth
- Export must always produce clean portable markdown files

---

## Priority Order

Build in this exact order. Do not move to the next item until the current
one is complete and tested on both mobile and desktop.

1. Database schema updates
2. Hide Strategy tab
3. Flip FAB to command sheet
4. Template picker
5. Raw markdown editor
6. Simplify navigation to three buckets

---

## 1. Database Schema Updates

### documents table

The main documents table should match this schema exactly.
All YAML frontmatter properties map to columns where noted.
Everything else is stored in the `content` column as raw markdown body.

```sql
create table documents (
  id uuid primary key default gen_random_uuid(),
  cuid text unique not null,
  type text not null,
  subtype text,
  title text,
  status text,
  access text default 'private',
  area text,
  workbench boolean default false,
  resources jsonb default '[]',
  dependencies jsonb default '[]',
  blocked boolean default false,
  slug text,
  published boolean default false,
  tier text,
  growth text,
  rating integer,
  processed boolean,
  start_date date,
  end_date date,
  date_created timestamptz,
  date_modified timestamptz,
  date_trashed timestamptz,
  tags jsonb default '[]',
  content text,
  frontmatter jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);


habit_logs companion table
Stores individual habit log entries separately from the document body.
Each row is one log entry for one habit on one date.

create table habit_logs (
  id uuid primary key default gen_random_uuid(),
  habit_id uuid references documents(id) on delete cascade,
  date date not null,
  value numeric,
  note text,
  created_at timestamptz default now()
);


finance_entries companion table
Stores individual revenue and expense entries separately from the document body.

create table finance_entries (
  id uuid primary key default gen_random_uuid(),
  finance_id uuid references documents(id) on delete cascade,
  entry_type text not null, -- revenue | expense
  date date not null,
  counterparty text,
  category text,
  currency text,
  amount numeric,
  amount_chf numeric,
  cumulative numeric,
  note text,
  created_at timestamptz default now()
);


Export behaviour
When exporting to markdown:
	∙	habit_logs rows are reconstructed into a markdown table in the body
	∙	finance_entries rows are reconstructed into revenue and expense tables in the body
	∙	All other documents export directly from the content column
	∙	Frontmatter is reconstructed from individual columns, not from the frontmatter jsonb column
	∙	Output must be valid Obsidian-compatible markdown

2. Hide Strategy Tab
The Strategy tab and all its routes must be hidden from the UI immediately.
Do not delete any code. Comment out or conditionally render based on a
SHOW_STRATEGY environment variable defaulting to false.
Affected areas:
	∙	Bottom navigation tab bar
	∙	Any home screen links to Strategy
	∙	FAB content switcher if it references Strategy
The Strategy data and routes must remain intact and accessible by setting
SHOW_STRATEGY=true in the environment.

3. Flip FAB to Command Sheet
Current behaviour
	∙	Tap — opens content type switcher
	∙	Hold — opens quick capture / search
New behaviour
	∙	Tap — opens unified command sheet
	∙	Hold — opens content type switcher (existing behaviour moves here)
Command sheet requirements
The command sheet is the primary entry point for everything.
It must do three things from a single input:
Create
User types a title or thought, then selects a document type to create.
The document is created with the correct template and routed to the inbox.
Search
As the user types, search results appear from existing documents.
Tapping a result opens that document.
Capture
If the user types and dismisses without selecting a type, the text is
saved as an inbox item with type: inbox and status: unprocessed.
Command sheet UI
	∙	Full screen modal on mobile, centered modal on desktop
	∙	Single text input at the top, autofocused on open
	∙	Below the input: recent documents, then search results as user types
	∙	Below search results: document type buttons for quick creation
	∙	Types shown: Inbox, Task, Project, Note, Essay, Scratch
	∙	All other types accessible via a “More” expansion

4. Template Picker
When creating a new document the app must apply the correct template
based on the selected type and subtype.
Template system requirements
	∙	Templates are defined in code as TypeScript objects matching the schema
	∙	Each template defines default frontmatter values and a body structure
	∙	The template picker is accessible from the command sheet and from within documents
	∙	Selecting a template populates the frontmatter and body of the new document
	∙	Templates must match the schema reference document exactly
Template priority order to implement
Implement in this order — these are the most used daily:
	1.	inbox
	2.	journal: daily
	3.	action: task
	4.	action: project
	5.	journal: scratch
	6.	creation: essay
	7.	reference: slip
	8.	review: weekly
Remaining templates follow after these are stable.

5. Raw Markdown Editor
Every document must be viewable and editable as raw markdown including
the YAML frontmatter block.
Requirements
	∙	Toggle between rendered view and raw markdown view
	∙	Raw view shows the complete file: frontmatter + body
	∙	Edits in raw view sync back to the database on save
	∙	The app parses the frontmatter on save and updates the corresponding columns
	∙	Use CodeMirror if already in the codebase, otherwise a plain textarea is acceptable for now
	∙	Mobile and desktop must both support raw editing
Frontmatter parsing rules
	∙	Parse YAML frontmatter between --- delimiters
	∙	Map parsed keys to database columns where they exist
	∙	Store unparsed or unknown keys in the frontmatter jsonb column
	∙	Wikilinks in frontmatter e.g. [[document-title]] are stored as plain strings
	∙	Arrays in frontmatter map to jsonb columns

6. Simplify Navigation
Current navigation
	∙	Tasks (Today, Upcoming, Backlog, Someday, Logbook, Trash)
	∙	Strategy (hidden after step 2)
	∙	Notes (Notes, Todo, Today, Pinned, Locked, Trash)
	∙	Sources
New navigation
Replace with three primary buckets plus two persistent views:
Primary buckets:
	∙	Actions — surfaces tasks and projects filtered by status
	∙	Writing — surfaces all creation and transmission documents
	∙	Reference — surfaces all reference documents
Persistent views:
	∙	Inbox — unprocessed items, always visible, shows count badge
	∙	Daily Note — opens or creates today’s journal: daily document
Actions view
	∙	Today — tasks with end_date of today
	∙	Scheduled — tasks with a future end_date
	∙	Anytime — tasks with no end_date and status: open
	∙	Someday — tasks with status: someday
	∙	Projects — all action: project documents
Writing view
	∙	All creation and transmission subtypes
	∙	Filterable by subtype
	∙	Sortable by date_created, date_modified, growth
Reference view
	∙	All reference subtypes
	∙	Filterable by subtype
	∙	Searchable by title and tags

Schema Reference
See schema-reference.md in the vault for the complete type map,
universal frontmatter definition, and all template definitions.
All document types, subtypes, and frontmatter fields must conform
to the schema reference exactly.

Definition of Done
The app is considered functional when:
	1.	Strategy tab is hidden
	2.	FAB tap opens command sheet
	3.	Typing in command sheet and selecting inbox saves an unprocessed inbox item
	4.	Daily note opens or creates today’s journal: daily document
	5.	Inbox shows unprocessed items with correct count
	6.	Tasks appear in correct buckets based on status and end_date
	7.	Raw markdown editor opens any document and saves changes back to the database
	8.	Mobile and desktop render identically for all primary views
	9.	All eight priority templates are implemented and apply correctly on document creation

End of Engineering Brief


---

This is everything Claude Code needs to start. Hand it this brief plus the schema reference document and the repo link. It has the stack context, the exact SQL, the UI requirements, and a clear priority order.

Ready to produce the updated schema reference document next?​​​​​​​​​​​​​​​​
