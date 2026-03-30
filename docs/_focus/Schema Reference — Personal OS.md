# Schema Reference — Personal OS
**Version:** 2.0
**Date:** 2026-03-29
**Author:** Dwayne M Cyrus

> The constitution of your document system.
> Every document type, subtype, purpose, and frontmatter schema defined in one place.
> All templates conform to this reference exactly.
> Update this document whenever a template changes.

---

## Universal Frontmatter

Every document carries these fields regardless of type:

```yaml
---
cuid: "{{date:YYYYMMDD}}{{time:HHmmss}}"
type:
subtype:
title:
status:
access: private
area:
workbench: false
date_created: "{{date:YYYY-MM-DD}}T{{time:HH:mm:ss}}"
date_modified:
date_trashed:
tags:
---
```

**Field notes:**
- `cuid` — auto-generated unique ID based on timestamp, never changed
- `type` — top-level document category
- `subtype` — specific document kind within the type
- `status` — varies by type; valid values defined per subtype below
- `access` — private | public | paywall
- `tier` — ONLY present when access is paywall; values: public | member | premium
- `area` — wikilink to parent life area e.g. `[[business-development-1447-1448]]`
- `workbench` — boolean; true surfaces the document for active focus, defaults to false
- `date_created` — set once on creation, never changed
- `date_modified` — updated on every save
- `date_trashed` — populated when moved to trash, null otherwise
- `tags` — freeform array of strings

**Resources field:**
Present on selected subtypes only — not universal.
Holds an array of wikilinks to related documents in your knowledge base.
Used for queryable backlink categorization in Supabase.
Valid values defined per subtype below.

```yaml
resources:
  - "[[]]"
```

**Dependencies field:**
Present on action subtypes only.
Holds an array of wikilinks to documents that must be completed first.

```yaml
dependencies:
  - "[[]]"
blocked: false
```

---

## Type Map

| Type | Subtypes |
|------|----------|
| journal | daily, istikarah, dream, scratch, devlog |
| creation | essay, framework, lesson, manuscript, chapter, comic, poem, story, artwork, case_study |
| transmission | workshop, script, podcast, lecture |
| reference | slip, identity, principle, directive, source, literature, quote, guide, offer, asset, software, course, module |
| log | habit, goal, finance, contact, outreach |
| review | weekly, monthly, yearly, area |
| action | task, project |
| inbox | — |

---

## Valid Property Values

All preset option fields are left blank in templates.
Fill from these valid values only.

**status by type:**
- journal: active | archived
- creation: draft | revising | editing | complete | abandoned
- transmission: draft | final | delivered | archived
- reference: active | archived
- log — habit: active | archived
- log — goal: active | complete | abandoned
- log — finance: active | archived
- log — contact: lead | active | closed | dormant
- log — outreach: active | archived
- review: active | archived
- action — task: open | done | someday
- action — project: active | complete | paused | someday
- inbox: unprocessed | processed

**access:** private | public | paywall

**tier:** public | member | premium

**growth:** seedling | budding | flowering | evergreen

**medium — artwork:** illustration | painting | sculpture | digital | photography | mixed

**medium — manuscript:** novel | nonfiction | poetry | short-stories | anthology

**medium — source:** book | article | video | tweet | podcast | ebook | course

**medium — script:** youtube | short | audio | video

**asset_type:** sop | template | swipe | playbook | policy | worksheet | other

**contact_type:** prospect | client | collaborator | personal

**deal_status:** none | open | closed-won | closed-lost

**frequency — habit:** Sunday | Monday | Tuesday | Wednesday | Thursday | Friday | Saturday

---

## Companion Tables

Two subtypes have companion database tables for queryable log entries.
The markdown export reconstructs these into body tables automatically.

**habit_logs**
Stores individual habit log entries. Each row is one entry for one habit on one date.
Maps to: `log: habit` documents.

**finance_entries**
Stores individual revenue and expense entries.
Maps to: `log: finance` documents.

On export both companion tables reconstruct into markdown tables in the document body,
producing clean Obsidian-compatible files identical to hand-written markdown.

---

## Structural Notes

### Comic and Manuscript relationship
A comic series uses `creation: manuscript` as its container — the overarching
narrative arc or world document. Individual issues use `creation: comic`.
The manuscript holds the story arc, world-building notes, and links to all issues.
Issues link back to the parent manuscript via the `series` frontmatter field.
This mirrors the chapter/manuscript relationship exactly.

### Poetry and Story collections
A poetry collection or short story anthology uses `creation: manuscript`
with `medium: poetry` or `medium: short-stories`.
Individual poems and stories link back via the `series` field.

### Course and Module relationship
A course document is the container. Individual modules are separate documents
using `reference: module`, linked back to the parent course via `course: "[[]]"`.
The course frontmatter holds a queryable `modules` array of wikilinks.

### Task and Project relationship
Tasks link to their parent project via `project: "[[]]"`.
The app queries all tasks belonging to a project dynamically from Supabase.
The project body checklist is a manual Obsidian-compatible index — optional.

---

## journal

Private, chronological, unstructured writing. Not for publication.
The thinking space — raw, unfiltered, personal.

### daily

One per day. Captures daily reflections, wins, losses, and lessons.
Uses the simplified daily-template — not the exhaustive Day.md.
Habit tracking lives in `log: habit` documents — not here.

```yaml
---
cuid: "{{date:YYYYMMDD}}{{time:HHmmss}}"
type: journal
subtype: daily
title: "{{date:YYYY-MM-DD}}"
status: active
access: private
area:
workbench: false
rating:
date_created: "{{date:YYYY-MM-DD}}T{{time:HH:mm:ss}}"
date_modified:
date_trashed:
tags:
---

## Capture


## Reflection

**Wins:**

**Losses:**

**Lessons:**

**1% better tomorrow:**
```

**rating:** 1–5 numeric scale. Quick daily score queryable across days to spot trends.

---

### istikarah

A recorded conversation with Allah SWT.
Documents Quranic guidance received, personal reflections, and intentions set.
Always private. Signs section grows over time as you notice guidance manifesting.

```yaml
---
cuid: "{{date:YYYYMMDD}}{{time:HHmmss}}"
type: journal
subtype: istikarah
title:
status: active
access: private
area:
workbench: false
date_created: "{{date:YYYY-MM-DD}}T{{time:HH:mm:ss}}"
date_modified:
date_trashed:
tags:
---

## Intention

What are you seeking guidance on?

## Guidance

What did you receive from Allah SWT?

## Quranic References


## Action

What will you do as a result?

## Signs

#### {{date:YYYY-MM-DD}}

What did you notice and what does it mean?
```

---

### dream

A dream recorded on waking.
Captures narrative, symbols, feelings, and any significance noted.

```yaml
---
cuid: "{{date:YYYYMMDD}}{{time:HHmmss}}"
type: journal
subtype: dream
title:
status: active
access: private
area:
workbench: false
mood:
rating:
date_created: "{{date:YYYY-MM-DD}}T{{time:HH:mm:ss}}"
date_modified:
date_trashed:
tags:
---

## Dream


## Symbols


## Reflection

What do you think this dream means?
```

**mood:** freeform text describing the emotional tone of the dream.
**rating:** blank on creation; valid values: terrible | bad | good | excellent

---

### scratch

Freeform thinking space with no rules, format, or required structure.
A landing zone for raw thoughts before they are processed into a real type.
May become anything — or nothing. No body prompt intentionally.

```yaml
---
cuid: "{{date:YYYYMMDD}}{{time:HHmmss}}"
type: journal
subtype: scratch
title:
status: active
access: private
area:
workbench: false
date_created: "{{date:YYYY-MM-DD}}T{{time:HH:mm:ss}}"
date_modified:
date_trashed:
tags:
---
```

---

### devlog

A running journal of decisions, progress, and lessons during a software build.
One document per session. Links back to its parent project and series.

```yaml
---
cuid: "{{date:YYYYMMDD}}{{time:HHmmss}}"
type: journal
subtype: devlog
title: "{{date:YYYY-MM-DD}}"
status: active
access: private
area:
workbench: false
project: "[[]]"
series:
series_position:
date_created: "{{date:YYYY-MM-DD}}T{{time:HH:mm:ss}}"
date_modified:
date_trashed:
tags:
---

## What I worked on


## Decisions made


## Blockers


## Next session
```

**series:** plain string matching the project name e.g. Anchored
**series_position:** integer starting at 1, increments per session

---


## creation

Your intellectual and artistic output. The work itself.
Lives in the vault as documents developed over time.
Not delivery formats — see transmission for that.

### essay

A standalone written piece with a single clear point of view.
Short to medium length. Follows the mini-essay structure.
Can be published publicly or behind a paywall.

```yaml
---
cuid: "{{date:YYYYMMDD}}{{time:HHmmss}}"
type: creation
subtype: essay
title:
subtitle:
status:
access: private
area:
workbench: false
resources:
  - "[[]]"
slug:
description:
growth: seedling
tier:
cover_link:
cover_alt_text:
published: false
date_created: "{{date:YYYY-MM-DD}}T{{time:HH:mm:ss}}"
date_modified:
date_trashed:
tags:
---

## Hook


## Body


## Conclusion
```

---

### framework

A written coaching or teaching framework you have developed.
Your intellectual property. Used in coaching, content, and transmissions.

```yaml
---
cuid: "{{date:YYYYMMDD}}{{time:HHmmss}}"
type: creation
subtype: framework
title:
subtitle:
status:
access: private
area:
workbench: false
resources:
  - "[[]]"
slug:
description:
growth: seedling
tier:
published: false
date_created: "{{date:YYYY-MM-DD}}T{{time:HH:mm:ss}}"
date_modified:
date_trashed:
tags:
---

## Problem

What problem does this framework solve?

## Framework

### Principle 1


### Principle 2


### Principle 3


## Application

How is this framework applied in real life?

## Example

A concrete example of this framework in action.
```

---

### lesson

A personal experience written as a story to teach something.
First-person narrative. The story is the vehicle for the insight.

```yaml
---
cuid: "{{date:YYYYMMDD}}{{time:HHmmss}}"
type: creation
subtype: lesson
title:
subtitle:
status:
access: private
area:
workbench: false
resources:
  - "[[]]"
slug:
description:
growth: seedling
tier:
published: false
date_created: "{{date:YYYY-MM-DD}}T{{time:HH:mm:ss}}"
date_modified:
date_trashed:
tags:
---

## Story

Tell the story. Put the reader in the middle of it.

## Insight

What does the story teach?

## Application

How can the reader apply this insight in their own life?
```

---

### manuscript

A long-form writing project you are authoring.
The container document — individual chapters link back to this.
Not to be confused with a book you are reading — that is reference: source with medium: book.

```yaml
---
cuid: "{{date:YYYYMMDD}}{{time:HHmmss}}"
type: creation
subtype: manuscript
title:
subtitle:
status:
access: private
area:
workbench: false
resources:
  - "[[]]"
slug:
description:
genre:
medium:
growth: seedling
chapter_count: 0
start_date:
end_date:
published: false
tier:
cover_link:
cover_alt_text:
date_created: "{{date:YYYY-MM-DD}}T{{time:HH:mm:ss}}"
date_modified:
date_trashed:
tags:
---

## Premise

What is this manuscript about in one paragraph?

## Audience

Who is this for?

## Structure

How is this manuscript organized?

## Chapters

- [ ] Chapter 1 — [[]]
- [ ] Chapter 2 — [[]]
- [ ] Chapter 3 — [[]]

## Notes

Any additional thoughts, research, or ideas.
```

**medium valid values:** novel | nonfiction | poetry | short-stories | anthology
Also used as container for comic series — see structural notes above.

---

### chapter

A single chapter belonging to a parent manuscript.
Links back to its parent via `manuscript` and orders itself via `series_position`.

```yaml
---
cuid: "{{date:YYYYMMDD}}{{time:HHmmss}}"
type: creation
subtype: chapter
title:
subtitle:
status:
access: private
area:
workbench: false
resources:
  - "[[]]"
manuscript: "[[]]"
series:
series_position:
start_date:
end_date:
published: false
tier:
date_created: "{{date:YYYY-MM-DD}}T{{time:HH:mm:ss}}"
date_modified:
date_trashed:
tags:
---

## Summary

One paragraph describing what this chapter covers.

## Draft


```

---

### comic

A single comic issue. The chapter of a larger story arc.
The parent story arc uses `creation: manuscript`.
Panels are written inline in the script section — no separate panel documents needed.

```yaml
---
cuid: "{{date:YYYYMMDD}}{{time:HHmmss}}"
type: creation
subtype: comic
title:
subtitle:
status:
access: private
area:
workbench: false
resources:
  - "[[]]"
series:
series_position:
issue:
growth: seedling
start_date:
end_date:
published: false
tier:
cover_link:
cover_alt_text:
date_created: "{{date:YYYY-MM-DD}}T{{time:HH:mm:ss}}"
date_modified:
date_trashed:
tags:
---

## Premise

What is this issue about in one paragraph?

## Story Beats

The sequence of key moments in this issue.

-
-
-

## Script

### Page 1

**Panel 1**
- Visual:
- Dialogue:
- Caption:

**Panel 2**
- Visual:
- Dialogue:
- Caption:

## Notes


```

---

### poem

A standalone poem or part of a collection.
A poetry collection uses `creation: manuscript` with `medium: poetry` as its container.

```yaml
---
cuid: "{{date:YYYYMMDD}}{{time:HHmmss}}"
type: creation
subtype: poem
title:
subtitle:
status:
access: private
area:
workbench: false
resources:
  - "[[]]"
collection:
series:
series_position:
growth: seedling
published: false
tier:
cover_link:
cover_alt_text:
date_created: "{{date:YYYY-MM-DD}}T{{time:HH:mm:ss}}"
date_modified:
date_trashed:
tags:
---

## Poem


## Notes


```

---

### story

A short fiction piece or narrative.
A story collection uses `creation: manuscript` with `medium: short-stories` as its container.

```yaml
---
cuid: "{{date:YYYYMMDD}}{{time:HHmmss}}"
type: creation
subtype: story
title:
subtitle:
status:
access: private
area:
workbench: false
resources:
  - "[[]]"
series:
series_position:
genre:
growth: seedling
published: false
tier:
cover_link:
cover_alt_text:
date_created: "{{date:YYYY-MM-DD}}T{{time:HH:mm:ss}}"
date_modified:
date_trashed:
tags:
---

## Premise

What is this story about in one paragraph?

## Story


## Notes


```

---

### artwork

A single finished visual work for your art portfolio.
Covers all visual mediums — illustration, painting, sculpture, digital, photography, mixed.
Categorized by the `medium` field.

```yaml
---
cuid: "{{date:YYYYMMDD}}{{time:HHmmss}}"
type: creation
subtype: artwork
title:
subtitle:
status:
access: private
area:
workbench: false
resources:
  - "[[]]"
series:
series_position:
medium:
dimensions:
year:
growth: seedling
for_sale: false
price:
currency: CHF
sold: false
exhibited: false
published: false
tier:
cover_link:
cover_alt_text:
date_created: "{{date:YYYY-MM-DD}}T{{time:HH:mm:ss}}"
date_modified:
date_trashed:
tags:
---

## Description

What is this artwork about?

## Process

How was this made?

## Exhibition History

-

## Notes


```

**medium valid values:** illustration | painting | sculpture | digital | photography | mixed

---

### case_study

A documented project writeup for your portfolio.
Shows process, challenge, outcome, and impact.

```yaml
---
cuid: "{{date:YYYYMMDD}}{{time:HHmmss}}"
type: creation
subtype: case_study
title:
subtitle:
status:
access: private
area:
workbench: false
resources:
  - "[[]]"
project: "[[]]"
outcome:
growth: seedling
published: false
tier:
cover_link:
cover_alt_text:
date_created: "{{date:YYYY-MM-DD}}T{{time:HH:mm:ss}}"
date_modified:
date_trashed:
tags:
---

## Overview

What was this project and why did it matter?

## Challenge

What problem were you solving?

## Process

How did you approach it?

## Outcome

What was the result?

## Lessons

What did you learn?
```

---

## transmission

Content you produce and deliver to an audience.
Draws from your creation work and packages it for delivery.
The difference from creation: transmission is the format, creation is the substance.

### workshop

Notes and materials for an online workshop you host.
Contains facilitation notes, participant materials, and post-event additions.

```yaml
---
cuid: "{{date:YYYYMMDD}}{{time:HHmmss}}"
type: transmission
subtype: workshop
title:
subtitle:
status:
access: private
area:
workbench: false
resources:
  - "[[]]"
series:
series_position:
platform:
date_delivered:
attendees: 0
recording_link:
published: false
tier:
date_created: "{{date:YYYY-MM-DD}}T{{time:HH:mm:ss}}"
date_modified:
date_trashed:
tags:
---

## Objective

What is the goal of this workshop?

## Outline

-
-
-

## Materials

-

## Resources

-

## Notes

Post-event additions and observations.
```

---

### script

Written script for video, short, or audio content.
The delivery format — the underlying idea lives in creation.

```yaml
---
cuid: "{{date:YYYYMMDD}}{{time:HHmmss}}"
type: transmission
subtype: script
title:
subtitle:
status:
access: private
area:
workbench: false
resources:
  - "[[]]"
format:
duration_target:
series:
series_position:
published: false
tier:
date_created: "{{date:YYYY-MM-DD}}T{{time:HH:mm:ss}}"
date_modified:
date_trashed:
tags:
---

## Hook


## Body


## Call To Action


## Resources

-

## Notes


```

---

### podcast

A podcast episode document. Outline, notes, and show notes.

```yaml
---
cuid: "{{date:YYYYMMDD}}{{time:HHmmss}}"
type: transmission
subtype: podcast
title:
subtitle:
status:
access: private
area:
workbench: false
resources:
  - "[[]]"
series:
series_position:
episode:
season:
duration:
recording_link:
published: false
tier:
cover_link:
cover_alt_text:
date_created: "{{date:YYYY-MM-DD}}T{{time:HH:mm:ss}}"
date_modified:
date_trashed:
tags:
---

## Summary

What is this episode about in one paragraph?

## Outline

-
-
-

## Show Notes


## Resources

-

## Notes


```

---

### lecture

A formal teaching session. More structured than a workshop.
May be delivered live, recorded, or as part of a course.

```yaml
---
cuid: "{{date:YYYYMMDD}}{{time:HHmmss}}"
type: transmission
subtype: lecture
title:
subtitle:
status:
access: private
area:
workbench: false
resources:
  - "[[]]"
series:
series_position:
platform:
date_delivered:
recording_link:
published: false
tier:
date_created: "{{date:YYYY-MM-DD}}T{{time:HH:mm:ss}}"
date_modified:
date_trashed:
tags:
---

## Objective

What should the audience learn from this lecture?

## Outline

-
-
-

## Content


## Resources

-

## Notes


```

---

## reference

Material you return to repeatedly. Stable knowledge and resources.
Not chronological. Not action-oriented. Just what you know and use.

### slip

An atomic note with a single idea, linked to other slips via wikilinks.
The Zettelkasten permanent note. One idea only. Clear and concise.
Emerges from literature notes and daily thinking.
No resources field — the slip itself is processed knowledge.

```yaml
---
cuid: "{{date:YYYYMMDD}}{{time:HHmmss}}"
type: reference
subtype: slip
title:
status:
access: private
area:
workbench: false
source: "[[]]"
chains:
  - "[[]]"
date_created: "{{date:YYYY-MM-DD}}T{{time:HH:mm:ss}}"
date_modified:
date_trashed:
tags:
---

## Note


```

---

### identity

Documents about who you are — values, beliefs, self-image, archetypes.
A small collection of stable reference documents about your inner world.

```yaml
---
cuid: "{{date:YYYYMMDD}}{{time:HHmmss}}"
type: reference
subtype: identity
title:
subtitle:
status:
access: private
area:
workbench: false
date_created: "{{date:YYYY-MM-DD}}T{{time:HH:mm:ss}}"
date_modified:
date_trashed:
tags:
---

## Content


```

---

### principle

A principle you have defined and live by. One to two sentences maximum.
Non-negotiable. Set in stone. Part of how you operate.

```yaml
---
cuid: "{{date:YYYYMMDD}}{{time:HHmmss}}"
type: reference
subtype: principle
title:
status:
access: private
area:
workbench: false
resources:
  - "[[]]"
date_created: "{{date:YYYY-MM-DD}}T{{time:HH:mm:ss}}"
date_modified:
date_trashed:
tags:
---

## Principle


## Why


```

---

### directive

How a specific principle is applied in real life.
Always linked to a parent principle.

```yaml
---
cuid: "{{date:YYYYMMDD}}{{time:HHmmss}}"
type: reference
subtype: directive
title:
status:
access: private
area:
workbench: false
resources:
  - "[[]]"
principle: "[[]]"
date_created: "{{date:YYYY-MM-DD}}T{{time:HH:mm:ss}}"
date_modified:
date_trashed:
tags:
---

## Directive


## Application


```

---

### source

A piece of content you are consuming or have consumed.
Books, articles, videos, tweets, podcasts, ebooks — all go here.
Contains metadata and a 1-3 paragraph summary only.
No resources field — source is the origin, not a synthesis document.

```yaml
---
cuid: "{{date:YYYYMMDD}}{{time:HHmmss}}"
type: reference
subtype: source
title:
subtitle:
status:
access: private
area:
workbench: false
author: "[[]]"
medium:
url:
isbn:
start_date:
end_date:
bookmark:
cover_link:
cover_alt_text:
date_created: "{{date:YYYY-MM-DD}}T{{time:HH:mm:ss}}"
date_modified:
date_trashed:
tags:
---

## Summary

A 1-3 paragraph summary of the source in your own words.

## Key Ideas


## Literature Notes

- [[]]
```

**status valid values:** unread | reading | complete | abandoned
**medium valid values:** book | article | video | tweet | podcast | ebook | course

---

### literature

Your processed notes on a specific source.
The Zettelkasten literature note — ideas extracted and written in your own words.
Always linked back to its parent source.
No resources field — literature note is itself a processed resource.

```yaml
---
cuid: "{{date:YYYYMMDD}}{{time:HHmmss}}"
type: reference
subtype: literature
title:
status:
access: private
area:
workbench: false
source: "[[]]"
date_created: "{{date:YYYY-MM-DD}}T{{time:HH:mm:ss}}"
date_modified:
date_trashed:
tags:
---

## Notes


## Key Ideas


## Slips

Links to atomic notes extracted from this literature note.

- [[]]
```

---

### quote

A single meaningful quote from someone else.
Short, attributed, and linked to its source.

```yaml
---
cuid: "{{date:YYYYMMDD}}{{time:HHmmss}}"
type: reference
subtype: quote
title:
status:
access: private
area:
workbench: false
author: "[[]]"
source: "[[]]"
date_created: "{{date:YYYY-MM-DD}}T{{time:HH:mm:ss}}"
date_modified:
date_trashed:
tags:
---

>

```

---

### guide

Instructional reference material you return to repeatedly.
Functional not expressive — different from an essay.

```yaml
---
cuid: "{{date:YYYYMMDD}}{{time:HHmmss}}"
type: reference
subtype: guide
title:
subtitle:
status:
access: private
area:
workbench: false
resources:
  - "[[]]"
published: false
tier:
cover_link:
cover_alt_text:
date_created: "{{date:YYYY-MM-DD}}T{{time:HH:mm:ss}}"
date_modified:
date_trashed:
tags:
---

## Overview


## Steps


## Notes


```

---

### offer

A defined coaching or business offer.
Documents the problem, solution, value, delivery, and pricing.
Operational reference — not published as content.

```yaml
---
cuid: "{{date:YYYYMMDD}}{{time:HHmmss}}"
type: reference
subtype: offer
title:
status:
access: private
area:
workbench: false
problem:
solution:
price:
currency: CHF
delivery:
date_created: "{{date:YYYY-MM-DD}}T{{time:HH:mm:ss}}"
date_modified:
date_trashed:
tags:
---

## Problem


## Solution


## Value

What transformation does this offer provide?

## Delivery

How is this offer delivered?

## Pricing


## Notes


```

---

### asset

Reusable operational documents for your business.
DM templates, email sequences, marketing copy, SOPs, worksheets, playbooks.
Anything you pull from repeatedly to run your business.

```yaml
---
cuid: "{{date:YYYYMMDD}}{{time:HHmmss}}"
type: reference
subtype: asset
title:
status:
access: private
area:
workbench: false
asset_type:
date_created: "{{date:YYYY-MM-DD}}T{{time:HH:mm:ss}}"
date_modified:
date_trashed:
tags:
---

## Content


## Usage Notes

When and how to use this asset.
```

**asset_type valid values:** sop | template | swipe | playbook | policy | worksheet | other

---

### software

A finished software product document.
Specs, architecture, tech stack, repo links, and operational notes.

```yaml
---
cuid: "{{date:YYYYMMDD}}{{time:HHmmss}}"
type: reference
subtype: software
title:
subtitle:
status:
access: private
area:
workbench: false
repo:
stack:
  -
url:
date_created: "{{date:YYYY-MM-DD}}T{{time:HH:mm:ss}}"
date_modified:
date_trashed:
tags:
---

## Overview

What does this software do?

## Architecture


## Features

-

## Notes


```

---

### course

A course or program you are studying.
The container document — individual modules link back to this.

```yaml
---
cuid: "{{date:YYYYMMDD}}{{time:HHmmss}}"
type: reference
subtype: course
title:
subtitle:
status:
access: private
area:
workbench: false
institution:
instructor:
url:
start_date:
end_date:
certificate_link:
modules:
  - "[[]]"
date_created: "{{date:YYYY-MM-DD}}T{{time:HH:mm:ss}}"
date_modified:
date_trashed:
tags:
---

## Overview

What is this course about?

## Modules

- [ ] [[]]
- [ ] [[]]
- [ ] [[]]

## Key Takeaways


## Notes


```

---

### module

A single module belonging to a parent course.
Links back to its parent via `course` and orders itself via `series_position`.

```yaml
---
cuid: "{{date:YYYYMMDD}}{{time:HHmmss}}"
type: reference
subtype: module
title:
status:
access: private
area:
workbench: false
resources:
  - "[[]]"
course: "[[]]"
series:
series_position:
date_created: "{{date:YYYY-MM-DD}}T{{time:HH:mm:ss}}"
date_modified:
date_trashed:
tags:
---

## Summary


## Key Takeaways


## Notes


## Resources

- [[]]
```

---


## log

Recurring records tracked over time.
Each subtype captures a specific kind of ongoing data.

### habit

A tracked habit with frequency, target, and daily log entries.
Individual log entries stored in companion table `habit_logs`.
Exported back to markdown as a reconstructed table.

```yaml
---
cuid: "{{date:YYYYMMDD}}{{time:HHmmss}}"
type: log
subtype: habit
title:
status:
access: private
area:
workbench: false
unit:
target:
frequency:
  -
start_date:
end_date:
date_created: "{{date:YYYY-MM-DD}}T{{time:HH:mm:ss}}"
date_modified:
date_trashed:
tags:
---

| Date | Value | Note |
|------|-------|------|
|      |       |      |
```

---

### goal

A 12-week year goal with lag measure, lead measures, and weekly scores.
Always linked to a parent life area.

```yaml
---
cuid: "{{date:YYYYMMDD}}{{time:HHmmss}}"
type: log
subtype: goal
title:
status:
access: private
area:
workbench: false
resources:
  - "[[]]"
lag_measure:
lag_target:
lag_unit:
lag_actual: 0
score_overall:
start_date:
end_date:
date_created: "{{date:YYYY-MM-DD}}T{{time:HH:mm:ss}}"
date_modified:
date_trashed:
tags:
---

## Lead Measures

| Date | Lead | Target | Actual | Score | Done | Note |
|------|------|--------|--------|-------|------|------|
|      |      |        |        |       |      |      |

## Weekly Scores

| Week | Score | Lag | On Track | Reflection |
|------|-------|-----|----------|------------|
| 1    |       |     |          |            |
| 2    |       |     |          |            |
| 3    |       |     |          |            |
| 4    |       |     |          |            |
| 5    |       |     |          |            |
| 6    |       |     |          |            |
| 7    |       |     |          |            |
| 8    |       |     |          |            |
| 9    |       |     |          |            |
| 10   |       |     |          |            |
| 11   |       |     |          |            |
| 12   |       |     |          |            |

## EOW Review

**Blocker:**

**Adjustment:**

**Observations:**
```

---

### finance

A monthly financial record.
Individual entries stored in companion table `finance_entries`.
Exported back to markdown as reconstructed revenue and expense tables.

```yaml
---
cuid: "{{date:YYYYMMDD}}{{time:HHmmss}}"
type: log
subtype: finance
title:
status:
access: private
area:
workbench: false
date:
currency_primary: CHF
currency_secondary: USD
month_revenue_chf: 0
month_expenses_chf: 0
month_profit_chf: 0
date_created: "{{date:YYYY-MM-DD}}T{{time:HH:mm:ss}}"
date_modified:
date_trashed:
tags:
---

## Revenue

| Date | Client | Offer | Type | Currency | Amount | CHF | Cumulative | Note |
|------|--------|-------|------|----------|--------|-----|------------|------|
|      |        |       |      |          |        |     |            |      |

## Expenses

| Date | Vendor | Category | Currency | Amount | CHF | Cumulative | Note |
|------|--------|----------|----------|--------|-----|------------|------|
|      |        |          |          |        |     |            |      |

## EOD Review

**Rate USD/CHF:**

**Outstanding:**

**Observations:**
```

---

### contact

A record for a person in your professional or personal network.
Tracks relationship type, deal status, and interaction history.

```yaml
---
cuid: "{{date:YYYYMMDD}}{{time:HHmmss}}"
type: log
subtype: contact
title:
status:
access: private
area:
workbench: false
contact_type:
contact_status:
contacted_last:
next_follow_up:
deal_status:
deal_value:
date_created: "{{date:YYYY-MM-DD}}T{{time:HH:mm:ss}}"
date_modified:
date_trashed:
tags:
---

## Details

- Email:
- Phone:
- Handles:

## Deal

- Title:
- Notes:

## Interactions

#### {{date:YYYY-MM-DD}}

- Channel:
- Summary:
- Next:
```

**contact_type valid values:** prospect | client | collaborator | personal
**contact_status valid values:** lead | active | closed | dormant
**deal_status valid values:** none | open | closed-won | closed-lost

---

### outreach

A daily outreach log tracking DMs, comments, and conversations.
Used to measure lead generation activity against your 12 week year goals.

```yaml
---
cuid: "{{date:YYYYMMDD}}{{time:HHmmss}}"
type: log
subtype: outreach
title:
status:
access: private
area:
workbench: false
platforms:
  -
total_sent: 0
total_comments: 0
total_responses: 0
date_created: "{{date:YYYY-MM-DD}}T{{time:HH:mm:ss}}"
date_modified:
date_trashed:
tags:
---

| Name | Platform | Type | Status | Note |
|------|----------|------|--------|------|
|      |          |      |        |      |

## Observations

- Did you update total_* frontmatter fields?
- Did you create contact notes for all promoted rows?
- Any follow-ups to schedule for tomorrow?
```

---

## review

Structured reflection documents tied to a time period or life area.
Where you assess progress, extract lessons, and set direction.

### weekly

Your weekly review. Processes the past week and sets up the next.

```yaml
---
cuid: "{{date:YYYYMMDD}}{{time:HHmmss}}"
type: review
subtype: weekly
title:
status:
access: private
area:
workbench: false
resources:
  - "[[]]"
week:
theme:
score_overall:
date_created: "{{date:YYYY-MM-DD}}T{{time:HH:mm:ss}}"
date_modified:
date_trashed:
tags:
---

## Scores This Week

| Area | Target | Actual | Status |
|------|--------|--------|--------|
|      |        |        |        |

## Wins

What worked and why?

## Losses

What didn't work and why?

## Key Lessons


## Adjustments for Next Week
```

---

### monthly

Your monthly review. Sits between weekly and yearly.
Assesses the month, scores progress, and adjusts direction.

```yaml
---
cuid: "{{date:YYYYMMDD}}{{time:HHmmss}}"
type: review
subtype: monthly
title:
status:
access: private
area:
workbench: false
resources:
  - "[[]]"
month:
score_overall:
date_created: "{{date:YYYY-MM-DD}}T{{time:HH:mm:ss}}"
date_modified:
date_trashed:
tags:
---

## Scores This Month

| Area | Target | Actual | Status |
|------|--------|--------|--------|
|      |        |        |        |

## Wins

What worked and why?

## Losses

What didn't work and why?

## Key Lessons


## Adjustments for Next Month
```

---

### yearly

Your annual review. Deep reflection on the full year.
Covers gratitude, lessons, feelings, limiting beliefs, and next steps.

```yaml
---
cuid: "{{date:YYYYMMDD}}{{time:HHmmss}}"
type: review
subtype: yearly
title:
status:
access: private
area:
workbench: false
resources:
  - "[[]]"
year:
score_overall:
date_created: "{{date:YYYY-MM-DD}}T{{time:HH:mm:ss}}"
date_modified:
date_trashed:
tags:
---

## Gratitude & Experiences

### I am thankful for...


### I am proud of...


### I overcame...


### People to acknowledge...


### Unique experiences...


## Lessons & Discoveries

### Learned about myself...


### Learned about others...


### Meaningful discoveries...


## Feelings

### Positive feelings to carry forward...


### Negative feelings to let go of...


## Work To Do

### Limiting beliefs...


### What needs to change...


### Envy mapping...


### Current vs desired state...

**Pains of my current state:**

**Joys of my desired state:**

## Next Steps


```

---

### area

A life area document. One of your 12 areas of life.
Contains vision, milestones, assessment, and cycle goals.
The parent container that goals and habits link back to via the `area` field.

```yaml
---
cuid: "{{date:YYYYMMDD}}{{time:HHmmss}}"
type: review
subtype: area
title:
status:
access: private
area:
workbench: false
resources:
  - "[[]]"
be_and_feel:
  -
date_created: "{{date:YYYY-MM-DD}}T{{time:HH:mm:ss}}"
date_modified:
date_trashed:
tags:
---

## Vision


## Milestones

- [ ]

## Assessment

### Experience


### Problem


### Pain


### Relief


### Reward

## Outcome


**CYCLE 1** —
- Goal: [[]]
- Maintain:

**CYCLE 2** —
- Goal:

**CYCLE 3** —
- Goal:
```

---

## action

Things to do. The execution layer of your system.

### task

A single actionable item with a clear outcome.
Routed into Today, Scheduled, Anytime, or Someday based on end_date and status.
If a task needs significant context or multiple steps it should be a project.

```yaml
---
cuid: "{{date:YYYYMMDD}}{{time:HHmmss}}"
type: action
subtype: task
title:
status:
access: private
area:
workbench: false
project: "[[]]"
dependencies:
  - "[[]]"
blocked: false
start_date:
end_date:
date_created: "{{date:YYYY-MM-DD}}T{{time:HH:mm:ss}}"
date_modified:
date_trashed:
tags:
---

## Notes


```

**status valid values:** open | done | someday
**Routing logic:**
- end_date = today → Today
- end_date = future → Scheduled
- no end_date + status: open → Anytime
- status: someday → Someday

---

### project

A multi-step outcome requiring more than one action.
Linked to a life area. Contains next actions and milestones.
Tasks link back to this document via their `project` field.
The app queries tasks dynamically — the body checklist is an optional Obsidian index.

```yaml
---
cuid: "{{date:YYYYMMDD}}{{time:HHmmss}}"
type: action
subtype: project
title:
subtitle:
status:
access: private
area:
workbench: false
resources:
  - "[[]]"
dependencies:
  - "[[]]"
blocked: false
start_date:
end_date:
date_created: "{{date:YYYY-MM-DD}}T{{time:HH:mm:ss}}"
date_modified:
date_trashed:
tags:
---

## Outcome

What does done look like?

## Tasks

- [ ] [[]]
- [ ] [[]]
- [ ] [[]]

## Notes


```

**status valid values:** active | complete | paused | someday

---

## inbox

The capture bucket. Everything lands here first.
No subtype. No structure required beyond the universal fields.
Processed during daily or weekly review into the correct type.

```yaml
---
cuid: "{{date:YYYYMMDD}}{{time:HHmmss}}"
type: inbox
subtype:
title:
status: unprocessed
access: private
area:
workbench: false
date_created: "{{date:YYYY-MM-DD}}T{{time:HH:mm:ss}}"
date_modified:
date_trashed:
tags:
---

## Capture


```

**status valid values:** unprocessed | processed

---

*End of schema reference. Version 2.0 — 2026-03-29*
