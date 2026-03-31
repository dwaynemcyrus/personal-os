import { createDocument } from './db';
import { generateCuid } from './cuid';
import { supabase } from './supabase';

export type DefaultTemplate = {
  subtype: string;
  title: string;
  content: string;
};

export const TEMPLATE_TYPE_ORDER = [
  'journal',
  'creation',
  'transmission',
  'reference',
  'log',
  'review',
  'action',
  'inbox',
] as const;

export const TEMPLATE_TYPE_LABELS: Record<(typeof TEMPLATE_TYPE_ORDER)[number], string> = {
  journal: 'Journal',
  creation: 'Creation',
  transmission: 'Transmission',
  reference: 'Reference',
  log: 'Log',
  review: 'Review',
  action: 'Action',
  inbox: 'Inbox',
};

const DEFAULT_TEMPLATE_CONTENT: Record<string, string> = {
  'journal:daily': `
## Capture


## Reflection

**Wins:**

**Losses:**

**Lessons:**

**1% better tomorrow:**`,
  'journal:istikarah': `
## Intention

What are you seeking guidance on?

## Guidance

What did you receive from Allah SWT?

## Quranic References


## Action

What will you do as a result?

## Signs

#### {{date:YYYY-MM-DD}}

What did you notice and what does it mean?`,
  'journal:dream': `
## Dream


## Symbols


## Reflection

What do you think this dream means?`,
  'journal:scratch': '',
  'journal:devlog': `
## What I worked on


## Decisions made


## Blockers


## Next session`,
  'creation:essay': `
## Hook


## Body


## Conclusion`,
  'creation:framework': `
## Problem

What problem does this framework solve?

## Framework

### Principle 1


### Principle 2


### Principle 3


## Application

How is this framework applied in real life?

## Example

A concrete example of this framework in action.`,
  'creation:lesson': `
## Story

Tell the story. Put the reader in the middle of it.

## Insight

What does the story teach?

## Application

How can the reader apply this insight in their own life?`,
  'creation:manuscript': `
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

Any additional thoughts, research, or ideas.`,
  'creation:chapter': `
## Summary

One paragraph describing what this chapter covers.

## Draft`,
  'creation:comic': `
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

## Notes`,
  'creation:poem': `
## Poem


## Notes`,
  'creation:story': `
## Premise

What is this story about in one paragraph?

## Story


## Notes`,
  'creation:artwork': `
## Description

What is this artwork about?

## Process

How was this made?

## Exhibition History

-

## Notes`,
  'creation:case_study': `
## Overview

What was this project and why did it matter?

## Challenge

What problem were you solving?

## Process

How did you approach it?

## Outcome

What was the result?

## Lessons

What did you learn?`,
  'transmission:workshop': `
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

Post-event additions and observations.`,
  'transmission:script': `
## Hook


## Body


## Call To Action


## Resources

-

## Notes`,
  'transmission:podcast': `
## Summary

What is this episode about in one paragraph?

## Outline

-
-
-

## Show Notes


## Resources

-

## Notes`,
  'transmission:lecture': `
## Objective

What should the audience learn from this lecture?

## Outline

-
-
-

## Content


## Resources

-

## Notes`,
  'reference:slip': `
## Note`,
  'reference:identity': `
## Content`,
  'reference:principle': `
## Principle


## Why`,
  'reference:directive': `
## Directive


## Application`,
  'reference:source': `
## Summary

A 1-3 paragraph summary of the source in your own words.

## Key Ideas


## Literature Notes

- [[]]`,
  'reference:literature': `
## Notes


## Key Ideas


## Slips

Links to atomic notes extracted from this literature note.

- [[]]`,
  'reference:quote': `
>`,
  'reference:guide': `
## Overview


## Steps


## Notes`,
  'reference:offer': `
## Problem


## Solution


## Value

What transformation does this offer provide?

## Delivery

How is this offer delivered?

## Pricing


## Notes`,
  'reference:asset': `
## Content


## Usage Notes

When and how to use this asset.`,
  'reference:software': `
## Overview

What does this software do?

## Architecture


## Features

-

## Notes`,
  'reference:course': `
## Overview

What is this course about?

## Modules

- [ ] [[]]
- [ ] [[]]
- [ ] [[]]

## Key Takeaways


## Notes`,
  'reference:module': `
## Summary


## Key Takeaways


## Notes


## Resources

- [[]]`,
  'log:habit': `
| Date | Value | Note |
|------|-------|------|
|      |       |      |`,
  'log:goal': `
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

**Observations:**`,
  'log:finance': `
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

**Observations:**`,
  'log:contact': `
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
- Next:`,
  'log:outreach': `
| Name | Platform | Type | Status | Note |
|------|----------|------|--------|------|
|      |          |      |        |      |

## Observations

- Did you update total_* frontmatter fields?
- Did you create contact notes for all promoted rows?
- Any follow-ups to schedule for tomorrow?`,
  'review:weekly': `
## Scores This Week

| Area | Target | Actual | Status |
|------|--------|--------|--------|
|      |        |        |        |

## Wins

What worked and why?

## Losses

What didn't work and why?

## Key Lessons


## Adjustments for Next Week`,
  'review:monthly': `
## Scores This Month

| Area | Target | Actual | Status |
|------|--------|--------|--------|
|      |        |        |        |

## Wins

What worked and why?

## Losses

What didn't work and why?

## Key Lessons


## Adjustments for Next Month`,
  'review:yearly': `
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

## Next Steps`,
  'review:area': `
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
- Goal:`,
  'action:task': `
## Notes`,
  'action:project': `
## Outcome

What does done look like?

## Tasks

- [ ] [[]]
- [ ] [[]]
- [ ] [[]]

## Notes`,
  inbox: `
## Capture`,
};

function titleCase(value: string): string {
  return value
    .replace(/[_-]+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function buildTemplateTitle(subtypeKey: string): string {
  if (subtypeKey === 'inbox') return 'Inbox';

  const [type, subtype] = splitTemplateKey(subtypeKey);
  const label = titleCase(subtype ?? type);

  if (type === 'journal') return `${label} Journal`;
  if (type === 'review') return `${label} Review`;

  return label;
}

export function getTemplateLookupKey(type: string, subtype: string | null): string {
  return subtype ? `${type}:${subtype}` : type;
}

export function splitTemplateKey(subtypeKey: string): [string, string | null] {
  if (!subtypeKey.includes(':')) return [subtypeKey, null];

  const [type, ...rest] = subtypeKey.split(':');
  return [type, rest.join(':') || null];
}

export const DEFAULT_TEMPLATES: DefaultTemplate[] = Object.entries(DEFAULT_TEMPLATE_CONTENT).map(
  ([subtype, content]) => ({
    subtype,
    title: buildTemplateTitle(subtype),
    content,
  })
);

type ExistingTemplateRow = {
  subtype: string | null;
};

export async function seedDefaultTemplates(): Promise<number> {
  const { data: existing, error } = await supabase
    .from('items')
    .select('subtype')
    .eq('type', 'template')
    .is('date_trashed', null);

  if (error) throw error;

  const existingKeys = new Set(
    ((existing ?? []) as ExistingTemplateRow[])
      .map((row) => row.subtype)
      .filter((value): value is string => Boolean(value))
  );

  let inserted = 0;

  for (const template of DEFAULT_TEMPLATES) {
    if (existingKeys.has(template.subtype)) continue;

    await createDocument({
      cuid: generateCuid(),
      type: 'template',
      subtype: template.subtype,
      title: template.title,
      status: 'active',
      access: 'private',
      area: null,
      workbench: false,
      resources: [],
      dependencies: [],
      blocked: false,
      slug: null,
      published: false,
      tier: null,
      growth: null,
      rating: null,
      start_date: null,
      end_date: null,
      date_created: new Date().toISOString(),
      date_modified: null,
      date_trashed: null,
      tags: [],
      content: template.content,
      frontmatter: null,
    });

    inserted += 1;
  }

  return inserted;
}
