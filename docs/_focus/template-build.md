# Template System — DB-Backed Implementation Plan

**Date:** 2026-03-30
**Status:** Planned

---

## Background

Templates are currently hardcoded strings in `src/lib/templates.ts`. Only 8 of the 47 document subtypes defined in the schema have starter content, and there is no UI to view or edit them. This plan replaces the hardcoded system with database-backed templates that are editable through the existing `DocumentDetailView`.

---

## Core Design

Templates are stored as `items` rows using the existing table — no new migration needed.

| Field | Value |
|---|---|
| `type` | `'template'` |
| `subtype` | `'journal:daily'` — encodes the target doc's `type:subtype` |
| `content` | Markdown body |
| `title` | Human-readable label (e.g. "Daily Journal") |
| `status` | `'active'` |
| `access` | `'private'` |

For document types with no subtype (inbox), the key is just the type: `subtype: 'inbox'`.

Templates are per-user via existing RLS. The existing `items_type_subtype_idx` index covers the lookup query directly — no index changes needed.

---

## Templates to Seed (47 subtypes)

| Type | Subtypes |
|---|---|
| `journal` | `daily`, `scratch`, `istikarah`, `dream`, `devlog` |
| `creation` | `essay`, `framework`, `lesson`, `manuscript`, `chapter`, `comic`, `poem`, `story`, `artwork`, `case_study` |
| `transmission` | `workshop`, `script`, `podcast`, `lecture` |
| `reference` | `slip`, `literature`, `identity`, `principle`, `directive`, `source`, `quote`, `guide`, `offer`, `asset`, `software`, `course`, `module` |
| `log` | `habit`, `goal`, `finance`, `contact`, `outreach` |
| `review` | `weekly`, `monthly`, `yearly`, `area` |
| `action` | `task`, `project` |
| `inbox` | *(no subtype — key: `'inbox'`)* |

---

## Implementation Steps

### Step 1 — `src/lib/templateSeed.ts` (new)

Single source of truth for all default template content and the seeding function.

```ts
export type DefaultTemplate = {
  subtype: string;   // e.g. 'journal:daily'
  title: string;     // e.g. 'Daily Journal'
  content: string;   // markdown body
};

export const DEFAULT_TEMPLATES: DefaultTemplate[] = [
  { subtype: 'journal:daily',        title: 'Daily Journal',   content: '...' },
  { subtype: 'journal:scratch',      title: 'Scratch',         content: '...' },
  { subtype: 'journal:istikarah',    title: 'Istikarah',       content: '...' },
  { subtype: 'journal:dream',        title: 'Dream',           content: '...' },
  { subtype: 'journal:devlog',       title: 'Devlog',          content: '...' },
  // ... all 47 entries
];

/**
 * Inserts templates that don't already exist for this user.
 * Existing rows are never overwritten — user edits are preserved.
 * Returns the count of newly inserted records.
 */
export async function seedDefaultTemplates(): Promise<number>
```

Seeding logic: for each entry in `DEFAULT_TEMPLATES`, check if a row already exists with `type='template'` and `subtype=entry.subtype` for the current user. Insert only if missing.

---

### Step 2 — `src/hooks/useDocumentTemplate.ts` (new)

Reactive hook for fetching a template from the DB with a hardcoded fallback.

```ts
/**
 * Returns the DB template for a given document type/subtype.
 * Falls back to the hardcoded getDocumentTemplate() if none is found.
 */
export function useDocumentTemplate(
  type: string,
  subtype: string | null
): {
  content: string | null;
  templateId: string | null;
  isLoading: boolean;
}
```

Query: `items WHERE type='template' AND subtype='{type}:{subtype}' AND date_trashed IS NULL LIMIT 1`

Fallback: calls `getDocumentTemplate(type, subtype)` from `src/lib/templates.ts` if the DB returns nothing. This ensures the app works before templates are seeded.

---

### Step 3 — Update `src/features/documents/createAndOpen.ts`

Replace the synchronous `getDocumentTemplate(type, subtype)` call with an async DB lookup before document creation. The new document's `content` field is set to the user's current (possibly edited) template body.

```ts
// Before
content: getDocumentTemplate(config.type, config.subtype),

// After
const template = await fetchTemplateContent(config.type, config.subtype);
// ...
content: template,
```

Add `fetchTemplateContent(type, subtype): Promise<string | null>` as a one-off async helper (not a hook — called inside an event handler).

---

### Step 4 — Update `src/features/documents/TemplatePicker.tsx`

Currently hardcoded to 10 options. Replace with a DB query for all `type='template'` items, grouped by type in the sheet.

- `onSelect` receives `{ type, subtype, content }` so the body is applied directly without a second lookup
- Group templates by the prefix of `subtype` (e.g. all `journal:*` under "Journal")
- Preserve the existing sheet UI pattern

---

### Step 5 — `src/features/settings/TemplatesSection.tsx` (new)

A new section for the Settings page:

- Lists all user templates grouped by type category
- Each row taps to `pushLayer({ view: 'document-detail', documentId: template.id })` — editing happens in the existing editor
- **Seed defaults** button at the bottom — calls `seedDefaultTemplates()`, shows `"Added N templates"` via toast
- If a template type has never been seeded it shows a dimmed "Not seeded" state next to the row

---

### Step 6 — Update `src/features/settings/SettingsPage.tsx`

- Add `<TemplatesSection />` as the first section
- Remove the legacy `daily_note_template_id` picker row (superseded by the new system)

---

### Step 7 — Deprecate `getDocumentTemplate()` in `src/lib/templates.ts`

Once seeding is in place `templates.ts` becomes fallback-only. The hardcoded strings stay but are no longer the primary source. Mark the function with a deprecation comment. Remove in a future cleanup pass once all users have seeded their templates.

---

## File Change Summary

| File | Action |
|---|---|
| `src/lib/templateSeed.ts` | **Create** — 47 templates + `seedDefaultTemplates()` |
| `src/hooks/useDocumentTemplate.ts` | **Create** — reactive DB lookup with fallback |
| `src/features/settings/TemplatesSection.tsx` | **Create** — grouped list + seed button |
| `src/features/settings/SettingsPage.tsx` | **Modify** — add TemplatesSection, remove legacy picker |
| `src/features/documents/createAndOpen.ts` | **Modify** — async DB template lookup on create |
| `src/features/documents/TemplatePicker.tsx` | **Modify** — DB-driven, grouped by type |
| `src/lib/templates.ts` | **Keep** — fallback only, mark deprecated |

---

## Build Order

1. `templateSeed.ts` — data layer first; everything else depends on it
2. `useDocumentTemplate` hook — consumed by step 3 and 4
3. `TemplatesSection` + `SettingsPage` update — lets you seed and verify content in the UI before wiring up creation
4. `createAndOpen` update — new documents use the live user template
5. `TemplatePicker` update — the `¶` picker in the editor uses live templates

---

## Notes

- No database migration required — reuses existing `items` table and indexes
- Seeding is idempotent — safe to run multiple times; existing edits are never overwritten
- The fallback in `useDocumentTemplate` and `fetchTemplateContent` means the app degrades gracefully if a user hasn't seeded yet
- Template variable substitution (`{{date}}`, `{{title}}`, etc.) is handled at creation time by the existing `replaceTemplateVariables()` in `templates.ts` — no changes needed there
