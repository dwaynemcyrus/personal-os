# Strategy Section — Full Spec

## What Strategy Is

Strategy is the **planning and review layer** of the personal OS. It holds the documents that define _where you're going_ and _how you'll evaluate progress_. It does not hold active work (Execution) or freeform writing/capture (Knowledge).

**Primary framework:** The 12 Week Year (Brian Moran).  
**No OKRs.** One goal framework, one system.

---

## Planning Hierarchy

### 1. Life Areas (Persistent)

Life areas are the top-level organizing concept. They persist year-over-year and represent the major domains of your life (e.g., Health, Career, Relationships, Finance, Personal Growth).

- **One markdown file per area**
- Each area contains a **Vision** — a narrative description of where you want to be in that domain
- Visions are long-term and updated infrequently (annually or less)
- Areas are referenced by all downstream planning docs via wiki-links
- **Cycle status** is updated at the start of each 12-week cycle (during the 13th-week review):
  - **`active`** — has a 12-week goal with tactics this cycle, gets strategic focus
  - **`maintenance`** — no cycle goal, but has ongoing habits/routines keeping it alive
  - **`waiting`** — not relevant right now, no habits or goals, revisit when circumstances change
- Only 2–3 areas should be `active` per cycle (12 Week Year constraint)

```
---
type: area
name: Career
cycle_status: active
current_cycle: "[[12-Week 2026-1]]"
---

# Career

## Vision

I run a profitable software product business...
```

```
---
type: area
name: Real Estate
cycle_status: waiting
current_cycle: "[[12-Week 2026-1]]"
---

# Real Estate

## Vision

I own rental properties that generate passive income...
```

### 2. Annual Outcomes (One per Area per Year)

Each life area gets its own annual outcomes document, translating the area's vision into concrete results for the year.

- **One markdown file per area per year**
- Links back to the area's vision doc
- Sets the direction that 12-Week Year cycles will execute against
- Keeps each area's annual planning self-contained and independently reviewable

```
---
type: annual-outcomes
year: 2026
area: "[[Career]]"
status: active
---

# Career — 2026 Outcomes

Vision: [[Career]]

## Outcomes
1. Launch personal OS MVP
2. Grow getanchored.app to 100 users
3. Publish 24 technical blog posts
```

```
---
type: annual-outcomes
year: 2026
area: "[[Health]]"
status: active
---

# Health — 2026 Outcomes

Vision: [[Health]]

## Outcomes
1. Run a half marathon
2. Maintain 3x/week strength training
3. Establish consistent sleep schedule (10:30pm–6:30am)
```

### 3. 12-Week Year Cycle (3 per Year)

Each cycle is the core execution planning unit. One overview document per cycle, plus individual goal documents.

#### 3a. Cycle Overview Doc

High-level view of all goals, timeline, and links to individual goal docs.

```
---
type: 12-week-overview
cycle: 2026-1
start_date: 2026-01-06
end_date: 2026-03-30
status: active
---

# 12-Week Year — 2026 Cycle 1

## Goals
1. [[12W Goal - Launch MVP]]
2. [[12W Goal - Run 3x Weekly]]
3. [[12W Goal - Emergency Fund Phase 1]]

## Schedule
- Weeks 1–4: Foundation phase
- Weeks 5–8: Build phase
- Weeks 9–12: Ship phase
- Week 13: Recovery & planning
```

#### 3b. Individual Goal Docs

One document per goal within the cycle. Contains the goal definition with explicit **lag measure** (the outcome you want) and **lead measures** (the tactics you control). The weekly scorecard tracks leads only — if you consistently execute the leads, the lags follow.

Each lead measure defines its **scoring type**:
- **binary** — yes/no, did you do it? (e.g., "Write blog post")
- **numeric** — did you hit the target number? Records actual value. (e.g., "Code 2hrs" → log hours; "Save $850" → log amount)

For numeric measures, the scorecard scores it as complete/incomplete based on whether the target was met, but the actual value is stored for context and trend tracking.

```
---
type: 12-week-goal
cycle: "[[12-Week 2026-1]]"
area: "[[Career]]"
annual_outcomes: "[[Career — 2026 Outcomes]]"
status: active
---

# Launch MVP

## Lag Measure (Outcome)
Ship auth, editor, and sync to 5 beta testers by end of cycle.

## Lead Measures (Tactics)
These are the recurring actions scored on the weekly scorecard:

| Tactic | Type | Target | Frequency | Link |
|---|---|---|---|---|
| Code daily | numeric | 2 hrs | Mon–Fri | [[Habit: Deep Work]] |
| Ship feature | binary | — | Weekly | [[Project: MVP Launch]] |
| Write blog post | binary | — | Weekly | |
| Review progress | binary | — | Fri | |

## Progress Notes
Week 1: Set up project scaffold...
```

**Key behavior:** Tactics can optionally wiki-link to:
- A **habit** in Execution (if the tactic is a recurring behavior worth daily tracking)
- A **project** in Execution (if the tactic implies a deliverable with subtasks)
- Nothing (if the tactic is just a weekly plan line item)

### 4. Weekly Plan (One per Week)

Derived from the active 12-week tactics. Standalone document per week.

#### Auto-Generation

New weekly plans are **pre-populated** from the active cycle's lead measures:
- The app reads all lead measures from active goal docs
- Tactics are grouped by goal and filtered by their frequency (e.g., daily tactics appear as a Mon–Fri block, weekly tactics appear once, specific-day tactics appear on their day)
- The user can edit, remove, or add items on top of the pre-populated list before saving
- Pre-population reduces friction and ensures the week is driven by 12-week tactics, not invented from scratch

#### Saturday Nudge

Every Saturday, the app prompts the user to create next week's plan. The nudge appears in the same three locations as cycle transition nudges:
- Home page (Today view) banner
- Plans tab badge
- Plans list banner

The nudge links directly to the weekly plan creation form with lead measures pre-populated. It persists until the plan is created or dismissed.

```
┌─────────────────────────────────────┐
│ ┌─────────────────────────────────┐ │
│ │ 📋 Time to plan next week.     │ │
│ │              [Create plan]      │ │
│ └─────────────────────────────────┘ │
│                                     │
│ SATURDAY, JAN 18                    │
│ ...                                 │
└─────────────────────────────────────┘
```

#### Weekly Plan Creation Form

```
┌─────────────────────────────────────┐
│         WEEKLY PLAN                 │
│         Week 4 · Jan 20–26         │
│                                     │
│  PRE-POPULATED TACTICS              │
│                                     │
│  From [[12W Goal - Launch MVP]]:    │
│  ☑ Code 2hrs daily (Mon–Fri)       │
│  ☑ Ship one feature                │
│  ☑ Write blog post                 │
│                                     │
│  From [[12W Goal - Run 3x Weekly]]:│
│  ☑ Run Mon / Wed / Fri             │
│                                     │
│  ADDITIONAL ITEMS                   │
│  ┌─────────────────────────────────┐│
│  │ Dentist appointment Thursday   ││
│  └─────────────────────────────────┘│
│  [+ Add item]                       │
│                                     │
│  NOTES FOR THE WEEK                 │
│  ┌─────────────────────────────────┐│
│  │ Light week — focus on shipping ││
│  │ signup flow.                   ││
│  └─────────────────────────────────┘│
│                                     │
│              [Save ✓]               │
└─────────────────────────────────────┘
```

#### Output Document

```
---
type: weekly-plan
week: 2026-W04
cycle: "[[12-week-2026-1]]"
cycle_week: 4
start_date: 2026-01-20
end_date: 2026-01-26
status: active
---

# Weekly Plan — Week 4

## Tactics This Week
From [[12W Goal - Launch MVP]]:
- [ ] Code 2hrs daily (Mon–Fri)
- [ ] Ship: Signup flow
- [ ] Write blog post

From [[12W Goal - Run 3x Weekly]]:
- [ ] Run Mon / Wed / Fri

## Additional
- [ ] Dentist appointment Thursday

## Notes
Light week — focus on shipping signup flow.
```

---

## Review Hierarchy

Reviews mirror the planning levels. All reviews live in Strategy.

### Daily Review (Wizard-Driven)

- **One markdown file per day**, generated by a short wizard (5 min max)
- Wizard walks through structured fields; output is saved as a markdown doc with frontmatter
- Tactic completion for the day is recorded here (feeds the weekly scorecard)
- **Not a journal** — the daily note in Knowledge is the freeform capture space; this is the end-of-day scorecard
- Intended for end-of-day use, but can be opened anytime
- Ends with a gentle nudge to prepare tomorrow's priorities (not a full cross-context flow — deferred to post-V1)

#### Wizard Fields (in order)

**Screen 1: Lead Measure Scoring**

The wizard auto-populates today's lead measures from the active cycle's goal docs, filtered by frequency (e.g., only shows Mon–Fri tactics on weekdays).

For each tactic:
- **Binary measures:** toggle (yes/no) + optional note field
- **Numeric measures:** number input (actual value) + target shown for reference + optional note field

A tactic is scored as **complete** if:
- Binary: toggled yes
- Numeric: actual value ≥ target

```
┌─────────────────────────────────────┐
│         DAILY REVIEW                │
│         Jan 15, 2026                │
│                                     │
│  LEAD MEASURES                      │
│                                     │
│  From: Launch MVP                   │
│  ┌─────────────────────────────────┐│
│  │ Code daily          target: 2h ││
│  │ Actual: [2.25] hrs        ✅   ││
│  │ Note: [Shipped auth login]     ││
│  ├─────────────────────────────────┤│
│  │ Write blog post                ││
│  │ [  ] Done                  ❌   ││
│  │ Note: [Pushed to Thursday]     ││
│  └─────────────────────────────────┘│
│                                     │
│  From: Run 3x Weekly               │
│  ┌─────────────────────────────────┐│
│  │ Run (Wed)                      ││
│  │ [✓] Done                  ✅   ││
│  │ Note: [5K, felt good]         ││
│  └─────────────────────────────────┘│
│                                     │
│              [Next →]               │
└─────────────────────────────────────┘
```

**Screen 2: Reflection**

Four free-text fields, each with a prompt:

```
┌─────────────────────────────────────┐
│         DAILY REVIEW                │
│         Reflection                  │
│                                     │
│  What went well today?              │
│  ┌─────────────────────────────────┐│
│  │ Shipped auth login flow ahead  ││
│  │ of schedule.                   ││
│  └─────────────────────────────────┘│
│                                     │
│  What didn't go well?               │
│  ┌─────────────────────────────────┐│
│  │ Skipped blog post — energy was ││
│  │ low after the run.             ││
│  └─────────────────────────────────┘│
│                                     │
│  Wins (things to celebrate)         │
│  ┌─────────────────────────────────┐│
│  │ Auth shipped and tested. Run   ││
│  │ felt strong.                   ││
│  └─────────────────────────────────┘│
│                                     │
│  How can I get 1% better tomorrow?  │
│  ┌─────────────────────────────────┐│
│  │ Schedule blog post as first    ││
│  │ task before deep work block.   ││
│  └─────────────────────────────────┘│
│                                     │
│          [← Back]  [Next →]         │
└─────────────────────────────────────┘
```

**Screen 3: Tomorrow's Priority + Save**

One free-text field for tomorrow's top priority, followed by the auto-calculated score and a save button.

```
┌─────────────────────────────────────┐
│         DAILY REVIEW                │
│         Wrap Up                     │
│                                     │
│  Tomorrow's #1 priority             │
│  ┌─────────────────────────────────┐│
│  │ Blog post first thing, then    ││
│  │ start signup flow.             ││
│  └─────────────────────────────────┘│
│                                     │
│  ─────────────────────────────────  │
│                                     │
│  TODAY'S SCORE                      │
│  67% (2 of 3 lead measures)        │
│  [Adjust score manually]           │
│                                     │
│  ─────────────────────────────────  │
│                                     │
│  💡 Don't forget to prep            │
│  tomorrow's tasks in your           │
│  daily note.                        │
│                                     │
│          [← Back]  [Save ✓]        │
└─────────────────────────────────────┘
```

- Score is auto-calculated: (completed tactics / total tactics for the day) × 100
- "Adjust score manually" lets the user override the percentage if needed
- Gentle nudge at bottom reminds user to prep tomorrow's tasks in their daily note (Knowledge) — no cross-context flow, just a reminder

#### Output Document

The wizard saves the following markdown file:

```
---
type: daily-review
date: 2026-01-15
week: "[[weekly-plan-2026-w03]]"
score: 67
score_auto: 67
score_manual: null
tactics_completed: 2
tactics_total: 3
---

# Daily Review — Jan 15, 2026

## Lead Measures
| Tactic | Target | Actual | Done | Note |
|---|---|---|---|---|
| Code daily | 2 hrs | 2.25 hrs | ✅ | Shipped auth login |
| Write blog post | — | — | ❌ | Pushed to Thursday |
| Run (Wed) | — | — | ✅ | 5K, felt good |

## What went well
Shipped auth login flow ahead of schedule.

## What didn't go well
Skipped blog post — energy was low after the run.

## Wins
Auth shipped and tested. Run felt strong.

## How to get 1% better
Schedule blog post as first task before deep work block.

## Tomorrow's priority
Blog post first thing, then start signup flow.
```

Frontmatter includes both `score_auto` (calculated) and `score_manual` (user override, null if not adjusted). The `score` field reflects whichever is active.

### Weekly Review (Wizard-Driven)

- **One markdown file per week**
- Evaluates the week against the weekly plan
- Contains the **weekly scorecard** — % of tactics completed (calculated from daily reviews)
- Links back to the weekly plan and forward to the next week's plan
- Uses the same wizard pattern as the daily review, pre-populated with aggregated data from the week's daily reviews

#### Wizard Fields (in order)

**Screen 1: Scorecard Summary (Pre-Populated)**

Auto-populated from daily review data for the week. Shows each lead measure's completion across the week. User can review and adjust if daily reviews were missed or inaccurate.

```
┌─────────────────────────────────────┐
│         WEEKLY REVIEW               │
│         Week 3 · Jan 13–19          │
│                                     │
│  SCORECARD: 85%                     │
│                                     │
│  From: Launch MVP                   │
│                   M  T  W  T  F     │
│  Code 2hrs daily  ✓  ✓  ✓  ✓  ✓    │
│  Ship feature     ✓  ·  ·  ·  ·    │
│  Write blog post  ·  ·  ·  ·  ❌    │
│  Review progress  ·  ·  ·  ·  ✓    │
│                                     │
│  From: Run 3x Weekly               │
│                   M  T  W  T  F     │
│  Run              ✓  ·  ✓  ·  ✓    │
│                                     │
│  Completed: 11/13 · 85%            │
│  [Adjust score manually]           │
│                                     │
│              [Next →]               │
└─────────────────────────────────────┘
```

**Screen 2: Reflection**

```
┌─────────────────────────────────────┐
│         WEEKLY REVIEW               │
│         Reflection                  │
│                                     │
│  Wins this week                     │
│  ┌─────────────────────────────────┐│
│  │ Auth system shipped and tested.││
│  │ Consistent running schedule.   ││
│  └─────────────────────────────────┘│
│                                     │
│  What didn't go well?               │
│  ┌─────────────────────────────────┐│
│  │ Missed blog post again — need  ││
│  │ a time block, not leftovers.   ││
│  └─────────────────────────────────┘│
│                                     │
│  Lessons learned                    │
│  ┌─────────────────────────────────┐│
│  │ Blog posts need a scheduled    ││
│  │ time block, not leftover       ││
│  │ energy.                        ││
│  └─────────────────────────────────┘│
│                                     │
│  How can I get 1% better next week? │
│  ┌─────────────────────────────────┐│
│  │ Block Tuesday 9am for blog     ││
│  │ writing. Non-negotiable.       ││
│  └─────────────────────────────────┘│
│                                     │
│          [← Back]  [Next →]         │
└─────────────────────────────────────┘
```

**Screen 3: Next Week Focus + Save**

```
┌─────────────────────────────────────┐
│         WEEKLY REVIEW               │
│         Next Week                   │
│                                     │
│  Top priorities for next week       │
│  ┌─────────────────────────────────┐│
│  │ Catch up on blog post.         ││
│  │ Start signup flow.             ││
│  └─────────────────────────────────┘│
│                                     │
│  Anything to adjust in your         │
│  lead measures or approach?         │
│  ┌─────────────────────────────────┐│
│  │ No changes — just need to      ││
│  │ protect the blog time block.   ││
│  └─────────────────────────────────┘│
│                                     │
│  WEEK SCORE: 85%                    │
│                                     │
│          [← Back]  [Save ✓]        │
└─────────────────────────────────────┘
```

#### Output Document

```
---
type: weekly-review
week: "[[Weekly Plan 2026-W03]]"
cycle: "[[12-Week 2026-1]]"
cycle_week: 3
scorecard: 85
scorecard_auto: 85
scorecard_manual: null
date: 2026-01-19
---

# Weekly Review — Week 3

## Scorecard: 85%
| Tactic | M | T | W | T | F | Score |
|---|---|---|---|---|---|---|
| Code 2hrs daily | ✅ | ✅ | ✅ | ✅ | ✅ | 5/5 |
| Ship feature | ✅ | · | · | · | · | 1/1 |
| Write blog post | · | · | · | · | ❌ | 0/1 |
| Review progress | · | · | · | · | ✅ | 1/1 |
| Run | ✅ | · | ✅ | · | ✅ | 3/3 |

## Wins
Auth system shipped and tested. Consistent running schedule.

## What didn't go well
Missed blog post again — need a time block, not leftovers.

## Lessons
Blog posts need a scheduled time block, not leftover energy.

## How to get 1% better
Block Tuesday 9am for blog writing. Non-negotiable.

## Next week focus
Catch up on blog post. Start signup flow.

## Adjustments
No changes — just need to protect the blog time block.
```

### 12-Week Review

- **One markdown file per cycle**
- Evaluates the full 12-week period against its goals
- Aggregates weekly scorecard data
- Informs planning for the next cycle

```
---
type: 12-week-review
cycle: "[[12-Week 2026-1]]"
date: 2026-03-30
overall_score: 78
---

# 12-Week Review — 2026 Cycle 1

## Goal Results
### [[12W Goal - Launch MVP]] — 85%
MVP shipped to 5 beta testers. Auth, editor, sync all functional.
Blog posts: 9/12 weeks (75%).

### [[12W Goal - Run 3x Weekly]] — 92%
Missed only 1 week (illness). Half marathon training on track.

### [[12W Goal - Emergency Fund Phase 1]] — 58%
Saved 3.5 months of 6-month target. Income dipped in Feb.

## Overall Score: 78%

## What worked
- Morning deep work blocks
- Friday review habit

## What to change next cycle
- Automate savings transfer
- Schedule blog posts on calendar

## Inputs for next cycle
- Carry forward: emergency fund goal
- New: onboard 20 beta users
```

### 13th-Week Review (Recovery & Planning)

- **One markdown file per break week**
- Distinct from the 12-week review — this is about recovery, celebration, and planning the next cycle
- Template includes: reflection on the cycle, rest/recovery intentions, and initial goal drafting for the next cycle

```
---
type: 13th-week-review
after_cycle: "[[12-Week 2026-1]]"
next_cycle: "[[12-Week 2026-2]]"
date: 2026-04-01
---

# 13th Week — Recovery & Planning

## Celebrate
What am I proud of from this cycle?

## Rest
What will I do this week to recharge?

## Reflect
What patterns emerged? What do I want to carry forward or leave behind?

## Next Cycle Draft
Initial goals for [[12-Week 2026-2]]:
1. ...
2. ...
3. ...

## Area Status Reassessment
Review each area and update its `cycle_status` for the next cycle:
| Area | Current Status | Next Cycle Status | Reason |
|---|---|---|---|
| [[Career]] | active | active | Continue MVP growth |
| [[Health]] | active | maintenance | Half marathon done, maintain gym habit |
| [[Finance]] | active | waiting | Emergency fund complete, no new goal |
| [[Relationships]] | waiting | active | Prioritize networking next cycle |
```

### Annual Review (Wizard-Driven)

- **One markdown file per year**
- Evaluates the year against the annual outcomes and area visions
- Aggregates all three 12-week cycle reviews
- Informs next year's annual outcomes

#### Wizard Fields (in order)

**Screen 1: Cycle Summary (Pre-Populated)**

Auto-populated from the three 12-week cycle reviews. Shows each cycle's overall score and goal results.

```
┌─────────────────────────────────────┐
│         ANNUAL REVIEW               │
│         2026                        │
│                                     │
│  CYCLE SCORES                       │
│                                     │
│  Cycle 1 (Jan–Mar)          78%    │
│  Cycle 2 (May–Aug)          82%    │
│  Cycle 3 (Sep–Nov)          74%    │
│                                     │
│  Average: 78%                       │
│                                     │
│              [Next →]               │
└─────────────────────────────────────┘
```

**Screen 2: Area-by-Area Outcomes Review**

For each area that had annual outcomes, the wizard shows the outcomes and asks for a status + notes. Pre-populated with outcome text from the annual outcomes docs.

```
┌─────────────────────────────────────┐
│         ANNUAL REVIEW               │
│         By Area                     │
│                                     │
│  ── Career ──                       │
│  Outcomes from [[Career — 2026]]    │
│                                     │
│  1. Launch personal OS MVP          │
│     [Achieved ▼]                    │
│     Note: [Shipped in March]        │
│                                     │
│  2. Grow getanchored.app to 100     │
│     [Partially achieved ▼]          │
│     Note: [67 users — 67%]         │
│                                     │
│  ── Health ──                       │
│  1. Run a half marathon             │
│     [Achieved ▼]                    │
│     Note: [Completed October]       │
│                                     │
│  ...                                │
│                                     │
│          [← Back]  [Next →]         │
└─────────────────────────────────────┘
```

Outcome status options: `Achieved`, `Partially achieved`, `Not achieved`, `Deferred`.

**Screen 3: Reflection**

```
┌─────────────────────────────────────┐
│         ANNUAL REVIEW               │
│         Reflection                  │
│                                     │
│  What were the biggest wins         │
│  this year?                         │
│  ┌─────────────────────────────────┐│
│  │                                ││
│  └─────────────────────────────────┘│
│                                     │
│  What were the biggest challenges?  │
│  ┌─────────────────────────────────┐│
│  │                                ││
│  └─────────────────────────────────┘│
│                                     │
│  What patterns or lessons           │
│  emerged across the year?           │
│  ┌─────────────────────────────────┐│
│  │                                ││
│  └─────────────────────────────────┘│
│                                     │
│          [← Back]  [Next →]         │
└─────────────────────────────────────┘
```

**Screen 4: Vision Updates + Next Year Inputs**

```
┌─────────────────────────────────────┐
│         ANNUAL REVIEW               │
│         Looking Ahead               │
│                                     │
│  Which area visions need updating?  │
│  ┌─────────────────────────────────┐│
│  │ Career vision needs refresh —  ││
│  │ product business is now real,  ││
│  │ shift focus to growth...       ││
│  └─────────────────────────────────┘│
│                                     │
│  Inputs for next year's outcomes    │
│  ┌─────────────────────────────────┐│
│  │ Scale to 500 users. Hire       ││
│  │ first contractor. Run a full   ││
│  │ marathon...                    ││
│  └─────────────────────────────────┘│
│                                     │
│          [← Back]  [Save ✓]        │
└─────────────────────────────────────┘
```

#### Output Document

```
---
type: annual-review
year: 2026
date: 2026-12-28
cycle_scores:
  - cycle: "[[12-Week 2026-1]]"
    score: 78
  - cycle: "[[12-Week 2026-2]]"
    score: 82
  - cycle: "[[12-Week 2026-3]]"
    score: 74
average_score: 78
---

# 2026 Annual Review

## Cycle Scores
- Cycle 1 (Jan–Mar): 78%
- Cycle 2 (May–Aug): 82%
- Cycle 3 (Sep–Nov): 74%
- Average: 78%

## By Area

### [[Career — 2026 Outcomes]]
| Outcome | Status | Note |
|---|---|---|
| Launch personal OS MVP | Achieved | Shipped in March |
| Grow getanchored.app to 100 users | Partially achieved | 67 users (67%) |

### [[Health — 2026 Outcomes]]
| Outcome | Status | Note |
|---|---|---|
| Run a half marathon | Achieved | Completed October |
| 3x/week strength | Partially achieved | Averaged 2.4x/week |

## Biggest wins
...

## Biggest challenges
...

## Patterns and lessons
...

## Vision updates
Career vision needs refresh — product business is now real, shift focus to growth...

## Inputs for 2027
Scale to 500 users. Hire first contractor. Run a full marathon...
```

---

## Weekly Scorecard (Live View)

Not a document — a **computed view** in the Strategy UI.

- Tracks **lead measures only** (tactics/actions you control), never lag measures (outcomes)
- Pulls tactic completion data from daily reviews for the current week
- Shows: each lead measure, which days it was completed, and the overall % for the week
- Also shows historical weeks for the current 12-week cycle as a trend line
- Accessible anytime from Strategy, not just during reviews
- The core 12 Week Year principle: score the process (leads), not the result (lags)

---

## Plans UI — List View & Navigation

The Plans tab follows the same minimal list style as Tasks and Notes. The top-level list is the entry point; tapping any item navigates to a full-page view.

### Top-Level List (Plans Tab)

```
┌─────────────────────────────────────┐
│                                     │
│ Current Cycle                     › │
│ 2026 Cycle 1 · Week 3 of 12        │
│                                     │
│ Scorecard                         › │
│ This week: 85%                      │
│                                     │
│ Weekly Plans                    3 › │
│                                     │
│ Reviews                        12 › │
│                                     │
│ Life Areas                      8 › │
│                                     │
│ Archive                         2 › │
│                                     │
│─────────────────────────────────────│
│                                     │
│  Tasks    Plans    Notes   Sources  │
│            ───                      │
└─────────────────────────────────────┘
```

- **Current Cycle** — subtitle shows cycle name + current week number
- **Scorecard** — subtitle shows this week's lead measure score (%)
- **Weekly Plans** — count shows plans for current cycle
- **Reviews** — count shows reviews for current cycle
- **Life Areas** — count shows total areas
- **Archive** — count shows past completed cycles

### Drill-Down: Current Cycle → Full Page

Tapping "Current Cycle" opens the cycle overview as a full page. Shows the 2–3 active goals with their lag measures and links to individual goal docs.

```
┌─────────────────────────────────────┐
│ ‹ Plans     2026 Cycle 1            │
│                                     │
│ Week 3 of 12 · Jan 6 – Mar 30      │
│                                     │
│ GOALS                               │
│                                     │
│ Launch MVP                        › │
│ [[Career]] · 3 lead measures        │
│                                     │
│ Run 3x Weekly                     › │
│ [[Health]] · 2 lead measures        │
│                                     │
│ Emergency Fund Phase 1            › │
│ [[Finance]] · 2 lead measures       │
│                                     │
│ SCHEDULE                            │
│ Weeks 1–4: Foundation               │
│ Weeks 5–8: Build                    │
│ Weeks 9–12: Ship                    │
│ Week 13: Recovery & planning        │
│                                     │
└─────────────────────────────────────┘
```

Tapping a goal opens that goal's full-page doc (lag measure, lead measures, progress notes).

### Drill-Down: Scorecard → Full Page

Tapping "Scorecard" opens the live scorecard as a full page.

```
┌─────────────────────────────────────┐
│ ‹ Plans     Scorecard               │
│                                     │
│ WEEK 3 · 85%                        │
│                                     │
│                  M  T  W  T  F  S  S│
│ Code 2hrs daily  ✓  ✓  ✓  ·  ·  ·  ·│
│ Ship feature     ✓  ·  ·  ·  ·  ·  ·│
│ Blog post        ·  ·  ·  ·  ·  ·  ·│
│ Run 3x           ✓  ·  ✓  ·  ·  ·  ·│
│ Transfer $850    ✓  ·  ·  ·  ·  ·  ·│
│                                     │
│ CYCLE TREND                         │
│ Wk1: ▓▓▓▓▓▓▓░░░ 72%               │
│ Wk2: ▓▓▓▓▓▓▓▓░░ 80%               │
│ Wk3: ▓▓▓▓▓▓▓▓▓░ 85%  ← current    │
│                                     │
└─────────────────────────────────────┘
```

### Drill-Down: Weekly Plans → Full Page

Tapping "Weekly Plans" opens a list of weekly plans for the current cycle.

```
┌─────────────────────────────────────┐
│ ‹ Plans     Weekly Plans            │
│                                     │
│ CURRENT                             │
│ Week 3 · Jan 13–19        active  › │
│                                     │
│ PAST                                │
│ Week 2 · Jan 6–12            85%  › │
│ Week 1 · Dec 30–Jan 5       72%  › │
│                                     │
│ UPCOMING                            │
│ Week 4 · Jan 20–26               › │
│                                     │
└─────────────────────────────────────┘
```

Tapping a week opens that weekly plan's full-page document.

### Drill-Down: Reviews → Full Page (Grouped)

Tapping "Reviews" opens a grouped list showing the most recent reviews per type.

```
┌─────────────────────────────────────┐
│ ‹ Plans     Reviews                 │
│                                     │
│ DAILY                               │
│ Jan 17, 2026                   80%  │
│ Jan 16, 2026                   90%  │
│ Jan 15, 2026                   75%  │
│ Show all...                         │
│                                     │
│ WEEKLY                              │
│ Week 3 · Jan 13–19            85%  │
│ Week 2 · Jan 6–12             72%  │
│ Show all...                         │
│                                     │
│ 12-WEEK                             │
│ 2025 Cycle 3                  74%  │
│ Show all...                         │
│                                     │
│ 13TH WEEK                          │
│ After 2025 Cycle 3              ›  │
│ Show all...                         │
│                                     │
│ ANNUAL                              │
│ 2025                             ›  │
│ Show all...                         │
│                                     │
└─────────────────────────────────────┘
```

- Each group shows the 2–3 most recent entries
- Daily and weekly reviews show their score (%) since that's the primary signal
- 12-week, 13th-week, and annual reviews show drill-through arrow only (accessed rarely)
- "Show all..." expands to full list of that review type

Tapping any review opens that review's full-page document.

### Drill-Down: Life Areas → Full Page

Tapping "Life Areas" opens the list of all areas with their current cycle status.

```
┌─────────────────────────────────────┐
│ ‹ Plans     Life Areas              │
│                                     │
│ ACTIVE                              │
│ Career                            › │
│ Health                            › │
│                                     │
│ MAINTENANCE                         │
│ Finance                           › │
│ Personal Growth                   › │
│ Relationships                     › │
│                                     │
│ WAITING                             │
│ Real Estate                       › │
│ Spirituality                      › │
│ Community                         › │
│                                     │
└─────────────────────────────────────┘
```

Tapping an area opens that area's full-page vision doc. From there, the area's annual outcomes doc is accessible via wiki-link.

### Drill-Down: Archive → Full Page

Tapping "Archive" opens a list of past completed cycles.

```
┌─────────────────────────────────────┐
│ ‹ Plans     Archive                 │
│                                     │
│ 2025 Cycle 3              74%     › │
│ Sep 1 – Nov 23                      │
│                                     │
│ 2025 Cycle 2              82%     › │
│ May 26 – Aug 17                     │
│                                     │
│ 2025 Cycle 1              78%     › │
│ Feb 17 – May 11                     │
│                                     │
│ ANNUAL REVIEWS                      │
│ 2025                              › │
│                                     │
└─────────────────────────────────────┘
```

Tapping a cycle opens that cycle's overview doc (read-only archive). Annual reviews are also accessible here.

---

## Setup Wizard

### First-Time Experience

When the Plans tab is opened with no data, a prompt is shown:

```
┌─────────────────────────────────────┐
│                                     │
│         Welcome to Plans            │
│                                     │
│  Set up your planning system with   │
│  a guided walkthrough, or start     │
│  from scratch.                      │
│                                     │
│  ┌───────────────────────────────┐  │
│  │       Guided Setup            │  │
│  │  Walk through each step       │  │
│  └───────────────────────────────┘  │
│                                     │
│  ┌───────────────────────────────┐  │
│  │       Start Manual            │  │
│  │  Create documents yourself    │  │
│  └───────────────────────────────┘  │
│                                     │
│─────────────────────────────────────│
│  Tasks    Plans    Notes   Sources  │
│            ───                      │
└─────────────────────────────────────┘
```

### Wizard Steps

The wizard uses simple form fields (not the full markdown editor). Each step saves a real, populated markdown document with proper frontmatter when the user taps "Next." The user can skip steps and return later.

**Step 1: Life Areas**

```
┌─────────────────────────────────────┐
│         Step 1 of 6                 │
│         LIFE AREAS                  │
│                                     │
│  Define the major domains of your   │
│  life. You can add more later.      │
│                                     │
│  Area name                          │
│  ┌───────────────────────────────┐  │
│  │ Career                        │  │
│  └───────────────────────────────┘  │
│                                     │
│  Vision (where do you want to be?)  │
│  ┌───────────────────────────────┐  │
│  │ I run a profitable software   │  │
│  │ product business that gives   │  │
│  │ me creative freedom...        │  │
│  └───────────────────────────────┘  │
│                                     │
│  [+ Add another area]              │
│                                     │
│  Areas added: Career, Health,       │
│  Finance, Relationships             │
│                                     │
│          [Back]  [Next →]           │
└─────────────────────────────────────┘
```

Output: One markdown file per area (e.g., `Career.md`) with `type: area`, `cycle_status: waiting` (set in Step 3).

**Step 2: Annual Outcomes**

For each area created in Step 1, the wizard asks for this year's outcomes.

```
┌─────────────────────────────────────┐
│         Step 2 of 6                 │
│         ANNUAL OUTCOMES             │
│                                     │
│  What do you want to achieve this   │
│  year in each area?                 │
│                                     │
│  ── Career ──                       │
│  Outcome 1                          │
│  ┌───────────────────────────────┐  │
│  │ Launch personal OS MVP        │  │
│  └───────────────────────────────┘  │
│  Outcome 2                          │
│  ┌───────────────────────────────┐  │
│  │ Grow getanchored.app to 100   │  │
│  └───────────────────────────────┘  │
│  [+ Add outcome]                    │
│                                     │
│  ── Health ──                       │
│  Outcome 1                          │
│  ┌───────────────────────────────┐  │
│  │ Run a half marathon           │  │
│  └───────────────────────────────┘  │
│  [+ Add outcome]                    │
│                                     │
│          [← Back]  [Next →]         │
└─────────────────────────────────────┘
```

Output: One annual outcomes file per area (e.g., `Career — 2026 Outcomes.md`).

**Step 3: Area Priorities**

Set the cycle status for each area. Enforces the 2–3 active limit.

```
┌─────────────────────────────────────┐
│         Step 3 of 6                 │
│         AREA PRIORITIES             │
│                                     │
│  Which areas will you focus on      │
│  this cycle? Pick 2–3 active.       │
│                                     │
│  Career        [Active ▼]           │
│  Health        [Active ▼]           │
│  Finance       [Maintenance ▼]      │
│  Relationships [Waiting ▼]          │
│  ...                                │
│                                     │
│  Active: 2 of 3 max                 │
│                                     │
│          [← Back]  [Next →]         │
└─────────────────────────────────────┘
```

Output: Updates `cycle_status` on each area doc's frontmatter.

**Step 4: 12-Week Cycle**

Create the cycle overview with start/end dates.

```
┌─────────────────────────────────────┐
│         Step 4 of 6                 │
│         12-WEEK CYCLE               │
│                                     │
│  Set up your first 12-week cycle.   │
│                                     │
│  Cycle name                         │
│  ┌───────────────────────────────┐  │
│  │ 2026 Cycle 1                  │  │
│  └───────────────────────────────┘  │
│                                     │
│  Start date                         │
│  ┌───────────────────────────────┐  │
│  │ Jan 6, 2026                   │  │
│  └───────────────────────────────┘  │
│                                     │
│  End date (auto-calculated)         │
│  ┌───────────────────────────────┐  │
│  │ Mar 30, 2026                  │  │
│  └───────────────────────────────┘  │
│                                     │
│          [← Back]  [Next →]         │
└─────────────────────────────────────┘
```

Output: Cycle overview doc (e.g., `12-Week 2026-1.md`). End date auto-calculated as start + 12 weeks.

**Step 5: Goals + Lead/Lag Measures**

For each active area, define a goal with its lag measure and lead measures (tactics).

```
┌─────────────────────────────────────┐
│         Step 5 of 6                 │
│         GOALS                       │
│                                     │
│  Define 1 goal per active area.     │
│                                     │
│  ── Career (Active) ──              │
│                                     │
│  Goal name                          │
│  ┌───────────────────────────────┐  │
│  │ Launch MVP                    │  │
│  └───────────────────────────────┘  │
│                                     │
│  Lag measure (the outcome)          │
│  ┌───────────────────────────────┐  │
│  │ Ship to 5 beta testers by     │  │
│  │ end of cycle                  │  │
│  └───────────────────────────────┘  │
│                                     │
│  Lead measures (tactics you do)     │
│  ┌───────────────────────────────┐  │
│  │ Code 2hrs every weekday       │  │
│  └───────────────────────────────┘  │
│  ┌───────────────────────────────┐  │
│  │ Ship one feature per week     │  │
│  └───────────────────────────────┘  │
│  [+ Add lead measure]              │
│                                     │
│  ── Health (Active) ──              │
│  ...                                │
│                                     │
│          [← Back]  [Next →]         │
└─────────────────────────────────────┘
```

Output: One goal doc per goal (e.g., `12W Goal - Launch MVP.md`). Cycle overview doc updated with goal links.

**Step 6: First Weekly Plan**

Auto-generates the first weekly plan from the lead measures defined in Step 5.

```
┌─────────────────────────────────────┐
│         Step 6 of 6                 │
│         WEEKLY PLAN                 │
│                                     │
│  Your first weekly plan, based on   │
│  your lead measures:                │
│                                     │
│  From Launch MVP:                   │
│  ☑ Code 2hrs daily (Mon–Fri)       │
│  ☑ Ship one feature                │
│  ☑ Write dev blog post             │
│                                     │
│  From Run 3x Weekly:               │
│  ☑ Run Mon / Wed / Fri             │
│                                     │
│  Add anything else this week?       │
│  ┌───────────────────────────────┐  │
│  │                               │  │
│  └───────────────────────────────┘  │
│  [+ Add item]                       │
│                                     │
│        [← Back]  [Finish ✓]        │
└─────────────────────────────────────┘
```

Output: Weekly plan doc (e.g., `Weekly Plan 2026-W02.md`). Lead measures are pre-populated and checked; user can add additional items.

### Wizard Completion

After "Finish," the user lands on the populated Plans list view. All documents are created and linked via wiki-links.

### Re-Running the Wizard

The wizard is accessible anytime from the Plans list via a settings/menu option:

```
┌─────────────────────────────────────┐
│ ⋮ Menu                              │
│                                     │
│ Re-run full setup wizard          › │
│ ─────────────────────────────────── │
│ Add Life Area            (Step 1) › │
│ Set Annual Outcomes      (Step 2) › │
│ Update Area Priorities   (Step 3) › │
│ New 12-Week Cycle        (Step 4) › │
│ Add Goal                 (Step 5) › │
│ New Weekly Plan          (Step 6) › │
│                                     │
└─────────────────────────────────────┘
```

- **Re-run full wizard** — walks through all 6 steps again (existing docs can be edited or skipped)
- **Individual steps** — jump directly to any step for ongoing use (e.g., "New 12-Week Cycle" at the start of each cycle, "New Weekly Plan" each week)

---

## Create Button Patterns

### Top-Level Plans List

A universal "Create new..." button at the bottom of the Plans list opens a type picker:

```
┌─────────────────────────────────────┐
│                                     │
│ Current Cycle                     › │
│ Scorecard                         › │
│ Weekly Plans                      › │
│ Reviews                           › │
│ Life Areas                        › │
│ Archive                           › │
│                                     │
│ ─────────────────────────────────── │
│ Create new...                       │
│                                     │
│─────────────────────────────────────│
│  Tasks    Plans    Notes   Sources  │
└─────────────────────────────────────┘
```

Tapping "Create new..." shows a type picker:

```
┌─────────────────────────────────────┐
│         CREATE NEW                  │
│                                     │
│ Life Area                         › │
│ Annual Outcomes                   › │
│ 12-Week Cycle                     › │
│ 12-Week Goal                      › │
│ Weekly Plan                       › │
│ Daily Review                      › │
│ Weekly Review                     › │
│ 12-Week Review                    › │
│ 13th-Week Review                  › │
│ Annual Review                     › │
│                                     │
│         [Cancel]                    │
└─────────────────────────────────────┘
```

Each option opens a form (simple fields, same style as the wizard) that outputs a populated markdown doc.

### Context-Aware Create Buttons

When inside a drill-down list, a "+" button creates the relevant document type for that context:

| Current view | "+" creates |
|---|---|
| Weekly Plans list | New weekly plan (pre-populated with current cycle's lead measures) |
| Reviews list | Offers: Daily / Weekly / 12-Week / 13th-Week / Annual |
| Life Areas list | New life area doc |
| Current Cycle → Goals | New 12-week goal for the active cycle |

The context-aware button uses the same simple form fields as the wizard — not the full editor. The doc is created on save and can be edited afterward in the full editor.

---

## Cycle Transition Flow

### Trigger

The app detects when the current date passes the end of Week 12 in the active cycle. This triggers gentle nudges — not forced actions.

### Nudge Locations

Nudges appear in three places simultaneously and persist until the transition is complete:

**1. Home page (Today view):**
```
┌─────────────────────────────────────┐
│ ┌─────────────────────────────────┐ │
│ │ 🎯 Cycle 1 is complete.        │ │
│ │ Ready to review & plan next?   │ │
│ │              [Start transition] │ │
│ └─────────────────────────────────┘ │
│                                     │
│ TUESDAY, MAR 31                     │
│ ...                                 │
└─────────────────────────────────────┘
```

**2. Plans tab badge:**
A small indicator dot on the "Plans" tab label in the bottom bar, signaling action needed.

**3. Plans list banner:**
```
┌─────────────────────────────────────┐
│ ┌─────────────────────────────────┐ │
│ │ Cycle 1 complete.              │ │
│ │ Step 1 of 5: 12-Week Review    │ │
│ │              [Continue]         │ │
│ └─────────────────────────────────┘ │
│                                     │
│ Current Cycle                     › │
│ ...                                 │
└─────────────────────────────────────┘
```

If the transition was started and paused, the banner shows which step to resume.

### Transition Steps

Tapping "Start transition" or "Continue" enters a connected flow. Each step is a full-page form. The user can exit at any point — progress is saved and the flow resumes from where they left off.

**Step 1: 12-Week Review**

Form pre-populated with data from the cycle:
- Scorecard averages per goal (pulled from weekly reviews)
- Overall cycle score (calculated)
- Goal list with completion status

User fills in:
- Result notes per goal
- What worked / what to change
- Inputs for next cycle

Output: 12-Week Review doc. Current cycle status updated to `archived` (docs become read-only by default, toggleable).

**Step 2: 13th-Week Review**

Form with prompts:
- Celebrate: what are you proud of?
- Rest: what will you do to recharge this week?
- Reflect: what patterns emerged?

Output: 13th-Week Review doc.

**Step 3: Area Status Reassessment**

Shows all areas with their current status. User updates for the next cycle.

```
┌─────────────────────────────────────┐
│    AREA STATUS — NEXT CYCLE         │
│                                     │
│  Career        [Active ▼]     was: Active      │
│  Health        [Maintenance ▼] was: Active      │
│  Finance       [Waiting ▼]    was: Maintenance  │
│  Relationships [Active ▼]     was: Waiting      │
│                                     │
│  Active: 2 of 3 max                │
│                                     │
│          [← Back]  [Next →]         │
└─────────────────────────────────────┘
```

Enforces the 2–3 active limit. Shows previous status for context.

Output: Updates `cycle_status` on each area doc.

**Step 4: New Cycle Setup**

Same as wizard Step 4 — cycle name, start date, auto-calculated end date.

Output: New cycle overview doc.

**Step 5: Goals + First Weekly Plan**

Combined step:
- Define 1 goal per active area (lag measure + lead measures), same as wizard Step 5
- Auto-generate the first weekly plan from the new lead measures, same as wizard Step 6

Output: Goal docs + first weekly plan for the new cycle.

### Transition Completion

After Step 5, the user lands on the Plans list with the new cycle active:
- "Current Cycle" shows the new cycle
- "Archive" now includes the completed cycle
- All nudges (home banner, tab badge, plans banner) are dismissed
- Old cycle docs are read-only by default (status: `archived`)

### Archive Read-Only Behavior

- Documents with `status: archived` open in read-only mode by default
- A toggle/button in the document view allows switching to edit mode if needed (e.g., to add a late note)
- Archived docs are accessible from the Archive drill-down in the Plans list

### Transition State Tracking

The app tracks transition progress in a lightweight internal state (not a user-facing document):

```
transition_state:
  from_cycle: "12-Week 2026-1"
  current_step: 3          # 1-5, or null if not started
  started_at: 2026-03-31
  completed_steps:
    - 12-week-review: "12-Week Review 2026-1.md"
    - 13th-week-review: "13th Week 2026-1.md"
```

This allows the app to resume the flow from any step and show progress in the Plans banner.

---

## Navigation Pattern Summary

All navigation from the Plans list follows the same pattern used across the app:

```
Plans list (tab view)
  ↓ tap item
Full-page view (document or computed view)
  ↓ tap ‹ back
Plans list
```

Wiki-links within any full-page document navigate to the linked document as another full page. The back button always returns to the previous view.

---

## File Naming Convention

All Plans documents use **kebab-case** file names following Obsidian conventions. This ensures wiki-links resolve correctly and file names are URL-safe.

| Document Type | Naming Pattern | Example |
|---|---|---|
| Life Area | `area-{name}.md` | `area-career.md` |
| Annual Outcomes | `annual-outcomes-{area}-{year}.md` | `annual-outcomes-career-2026.md` |
| 12-Week Overview | `12-week-{year}-{cycle}.md` | `12-week-2026-1.md` |
| 12-Week Goal | `12w-goal-{slug}.md` | `12w-goal-launch-mvp.md` |
| Weekly Plan | `weekly-plan-{year}-w{nn}.md` | `weekly-plan-2026-w03.md` |
| Daily Review | `daily-review-{yyyy-mm-dd}.md` | `daily-review-2026-01-15.md` |
| Weekly Review | `weekly-review-{year}-w{nn}.md` | `weekly-review-2026-w03.md` |
| 12-Week Review | `12-week-review-{year}-{cycle}.md` | `12-week-review-2026-1.md` |
| 13th-Week Review | `13th-week-review-{year}-{cycle}.md` | `13th-week-review-2026-1.md` |
| Annual Review | `annual-review-{year}.md` | `annual-review-2026.md` |

**Rules:**
- All lowercase, hyphens only (no spaces, no special characters)
- Wiki-links use the filename without `.md`: `[[daily-review-2026-01-15]]`
- Goal slugs are derived from the goal name: "Launch MVP" → `launch-mvp`
- Week numbers are zero-padded: `w03` not `w3`
- The app auto-generates filenames from wizard/form inputs — the user never types a filename

---

## Week-Within-Cycle Tracking

Each weekly plan and weekly review includes a `cycle_week` frontmatter field that maps the week to its position within the active 12-week cycle (1–12). This is required for:
- Displaying "Week 3 of 12" in the UI
- Calculating cycle progress percentage
- Ordering weeks within the scorecard trend view

The `cycle_week` is **auto-calculated** by the app based on the weekly plan's `start_date` relative to the cycle's `start_date`.

**Frontmatter addition to weekly plan:**
```
---
type: weekly-plan
week: 2026-W03
cycle: "[[12-week-2026-1]]"
cycle_week: 3
start_date: 2026-01-13
end_date: 2026-01-19
status: active
---
```

**Frontmatter addition to weekly review:**
```
---
type: weekly-review
week: "[[weekly-plan-2026-w03]]"
cycle: "[[12-week-2026-1]]"
cycle_week: 3
scorecard: 85
date: 2026-01-19
---
```

**Calculation:**
`cycle_week = floor((weekly_plan.start_date - cycle.start_date) / 7) + 1`

The cycle overview's "Week X of 12" subtitle on the Plans list is derived from the current date relative to the cycle's `start_date`.

---

## Editing Existing Documents

### Daily Review — Edit Flow

Once a daily review is saved, reopening it opens the **markdown document in the full editor** (not the wizard). This keeps the wizard as a fast creation tool and the editor as the full editing environment.

- Tapping a daily review in the Reviews list opens the rendered markdown document
- User edits directly in the editor (same as any other note)
- If the user changes the lead measure table (e.g., flips a ❌ to ✅), the `score`, `score_auto`, `tactics_completed` frontmatter fields are **not** auto-recalculated — the user must manually update them or the values remain as originally saved
- This is a V1 simplification; auto-recalculation on edit can be added post-V1

### Weekly Review — Edit Flow

Same as daily review: reopening opens the markdown in the full editor.

### All Other Document Types

All Plans documents open in the full markdown editor when tapped from any list or drill-down view. The wizard/form is only used for **creation** — all subsequent edits happen in the editor.

---

## Document Type Summary

| Type | Cadence | Count/Year | Location |
|---|---|---|---|
| Life Area | Persistent | ~5–8 | Strategy |
| Annual Outcomes | Yearly per area | ~5–8 | Strategy |
| 12-Week Overview | 3x/year | 3 | Strategy |
| 12-Week Goal | 3x/year | ~3–5 per cycle | Strategy |
| Weekly Plan | Weekly | ~48 | Strategy |
| Daily Review | Daily | ~365 | Strategy |
| Weekly Review | Weekly | ~48 | Strategy |
| 12-Week Review | 3x/year | 3 | Strategy |
| 13th-Week Review | 3x/year | 3 | Strategy |
| Annual Review | Yearly | 1 | Strategy |

---

## What Strategy Links To (But Does Not Own)

| In Execution | Linked via |
|---|---|
| Projects | Wiki-link from tactic → `[[Project: X]]` |
| Habits | Wiki-link from tactic → `[[Habit: X]]` |
| Tasks | Owned by projects in Execution; not directly in Strategy |

| In Knowledge | Linked via |
|---|---|
| Daily Notes | Weekly plan or daily review can reference `[[2026-01-15]]` |
| General Notes | Any Strategy doc can wiki-link to knowledge notes |

---

## What Strategy Does NOT Contain

- Daily notes / journal entries (Knowledge)
- Projects, tasks, habits (Execution)
- Monthly plans or monthly reviews (not part of 12 Week Year)
- OKRs (dropped — one framework only)
- Freeform writing or capture (Knowledge)

---

## Template Definitions

All Plan document types are backed by **editable markdown templates** stored in the app. Templates define the default structure (frontmatter schema + body sections) that the wizard and create forms use to generate new documents. Users can customize templates to fit their workflow.

### Template Storage

- Templates are stored as markdown files in a dedicated `templates/plans/` folder within the app's file system
- Each template has a `type: template` frontmatter field plus a `template_for` field identifying which document type it generates
- Editing a template changes the output of all future documents created from it — existing documents are not affected

### Template List

| Template | File | Used By |
|---|---|---|
| Life Area | `templates/plans/area.md` | Setup wizard Step 1, Create new → Life Area |
| Annual Outcomes | `templates/plans/annual-outcomes.md` | Setup wizard Step 2, Create new → Annual Outcomes |
| 12-Week Overview | `templates/plans/12-week-overview.md` | Setup wizard Step 4, Cycle transition Step 4 |
| 12-Week Goal | `templates/plans/12-week-goal.md` | Setup wizard Step 5, Cycle transition Step 5, Create new → 12-Week Goal |
| Weekly Plan | `templates/plans/weekly-plan.md` | Setup wizard Step 6, Saturday nudge, Create new → Weekly Plan |
| Daily Review | `templates/plans/daily-review.md` | Daily review wizard, Create new → Daily Review |
| Weekly Review | `templates/plans/weekly-review.md` | Create new → Weekly Review |
| 12-Week Review | `templates/plans/12-week-review.md` | Cycle transition Step 1 |
| 13th-Week Review | `templates/plans/13th-week-review.md` | Cycle transition Step 2 |
| Annual Review | `templates/plans/annual-review.md` | Create new → Annual Review |

### Template Format

Templates use `{{variable}}` syntax for dynamic content that the wizard/form fills in. Static sections define the document structure.

**Example: Life Area template**

```
---
type: template
template_for: area
---
---
type: area
name: "{{name}}"
cycle_status: waiting
current_cycle: null
---

# {{name}}

## Vision

{{vision}}
```

**Example: Daily Review template**

```
---
type: template
template_for: daily-review
---
---
type: daily-review
date: "{{date}}"
week: "[[{{weekly_plan_link}}]]"
score: {{score}}
score_auto: {{score_auto}}
score_manual: null
tactics_completed: {{tactics_completed}}
tactics_total: {{tactics_total}}
---

# Daily Review — {{date_formatted}}

## Lead Measures
{{lead_measures_table}}

## What went well
{{what_went_well}}

## What didn't go well
{{what_didnt_go_well}}

## Wins
{{wins}}

## How to get 1% better
{{one_percent_better}}

## Tomorrow's priority
{{tomorrows_priority}}
```

**Example: 12-Week Goal template**

```
---
type: template
template_for: 12-week-goal
---
---
type: 12-week-goal
cycle: "[[{{cycle_link}}]]"
area: "[[{{area_link}}]]"
annual_outcomes: "[[{{annual_outcomes_link}}]]"
status: active
---

# {{goal_name}}

## Lag Measure (Outcome)
{{lag_measure}}

## Lead Measures (Tactics)
{{lead_measures_table}}

## Progress Notes
{{progress_notes}}
```

**Example: Weekly Plan template**

```
---
type: template
template_for: weekly-plan
---
---
type: weekly-plan
week: "{{week_iso}}"
cycle: "[[{{cycle_link}}]]"
start_date: "{{start_date}}"
end_date: "{{end_date}}"
status: active
---

# Weekly Plan — Week {{week_number}}

## Tactics This Week
{{auto_populated_tactics}}

## Additional
{{additional_items}}

## Notes
{{notes}}
```

### Template Variables

Variables fall into two categories:

**Auto-filled** — the app calculates these, user doesn't enter them:
- `{{date}}`, `{{date_formatted}}`, `{{week_iso}}`, `{{start_date}}`, `{{end_date}}`, `{{week_number}}`
- `{{score}}`, `{{score_auto}}`, `{{tactics_completed}}`, `{{tactics_total}}`
- `{{cycle_link}}`, `{{weekly_plan_link}}` (derived from active cycle)
- `{{auto_populated_tactics}}` (pulled from active goal docs)
- `{{lead_measures_table}}` (generated from wizard/form input)

**User-filled** — entered via wizard/form fields:
- `{{name}}`, `{{vision}}`, `{{goal_name}}`, `{{lag_measure}}`
- `{{what_went_well}}`, `{{what_didnt_go_well}}`, `{{wins}}`, `{{one_percent_better}}`, `{{tomorrows_priority}}`
- `{{additional_items}}`, `{{notes}}`, `{{progress_notes}}`

### Customizing Templates

Users can edit templates from a "Templates" section accessible via the Plans menu (same menu that offers wizard re-runs):

```
┌─────────────────────────────────────┐
│ ⋮ Menu                              │
│                                     │
│ Re-run full setup wizard          › │
│ ─────────────────────────────────── │
│ Add Life Area            (Step 1) › │
│ ...                                 │
│ ─────────────────────────────────── │
│ Edit Templates                    › │
│                                     │
└─────────────────────────────────────┘
```

Tapping "Edit Templates" opens the template list. Tapping a template opens it in the full markdown editor. Users can:
- Add or remove sections
- Change prompts/labels
- Add new `{{variable}}` placeholders (the app will show an empty field for unknown variables in the wizard/form)
- Reorder sections

Changes only affect future documents — existing docs are untouched.

---

## Data Storage Model

All Strategy documents are stored as rows in the `items` table (PowerSync/Supabase). There is no separate file system — the markdown content (body + frontmatter) is stored in the `content` column, and key fields from frontmatter are promoted to indexed columns so the app can query them efficiently without parsing markdown.

### Common fields (all strategy document types)

| `items` column | Purpose |
|---|---|
| `id` | UUID primary key |
| `type` | Document type (see values below) |
| `title` | Document display title |
| `content` | Full markdown body (excludes frontmatter — frontmatter is reconstructed from columns on export) |
| `filename` | Kebab-case file slug (e.g., `12w-goal-launch-mvp`) — used for wiki-link resolution |
| `item_status` | `active`, `maintenance`, `waiting`, `archived` |
| `owner` | User ID (auth.uid()) |
| `created_at`, `updated_at` | Standard timestamps |
| `is_trashed`, `trashed_at` | Soft delete |

### Type values

| Spec term | `items.type` value |
|---|---|
| Life Area | `area` |
| Annual Outcomes | `annual-outcomes` |
| 12-Week Overview | `12-week-overview` |
| 12-Week Goal | `12-week-goal` |
| Lead Measure (tactic) | `lead-measure` |
| Weekly Plan | `weekly-plan` |
| Daily Review | `daily-review` |
| Weekly Review | `weekly-review` |
| 12-Week Review | `12-week-review` |
| 13th-Week Review | `13th-week-review` |
| Annual Review | `annual-review` |

### Type-specific field mappings

**`area`**
| Spec field | `items` column |
|---|---|
| `cycle_status` | `item_status` (`active`/`maintenance`/`waiting`) |
| `current_cycle` wiki-link | `parent_id` → current cycle overview item |

**`annual-outcomes`**
| Spec field | `items` column |
|---|---|
| `year` | `subtype` (e.g., `"2026"`) |
| `area` wiki-link | `parent_id` → area item |
| `status` | `item_status` |

**`12-week-overview`**
| Spec field | `items` column |
|---|---|
| `start_date` | `period_start` |
| `end_date` | `period_end` |
| `status` | `item_status` |
| `cycle` identifier | `title` (e.g., `"2026 Cycle 1"`) + `filename` |

**`12-week-goal`**
| Spec field | `items` column |
|---|---|
| `cycle` wiki-link | `parent_id` → 12-week-overview item |
| `area` wiki-link | stored as `item_links` entry |
| `annual_outcomes` wiki-link | stored as `item_links` entry |
| `status` | `item_status` |
| `lag_measure` text | `description` |

**`lead-measure`** (child rows of a `12-week-goal`)
| Spec field | `items` column |
|---|---|
| tactic name | `title` |
| `type` (binary/numeric) | `subtype` (`binary` or `numeric`) |
| `target` value | `target` |
| `frequency` (Mon–Fri, weekly, etc.) | `frequency` |
| parent goal | `parent_id` → 12-week-goal item |
| linked habit/project wiki-link | `item_links` entry (optional) |

Lead measures are stored as **separate child rows** (not only inline in the goal's markdown). This enables the daily review wizard and weekly scorecard to query active tactics efficiently without parsing markdown.

**`weekly-plan`**
| Spec field | `items` column |
|---|---|
| `week` (ISO week) | `subtype` (e.g., `"2026-W03"`) |
| `cycle` wiki-link | `parent_id` → 12-week-overview item |
| `cycle_week` | `sort_order` |
| `start_date` | `period_start` |
| `end_date` | `period_end` |
| `status` | `item_status` |

**`daily-review`**
| Spec field | `items` column |
|---|---|
| `date` | `period_start` (date portion) |
| `week` wiki-link | `parent_id` → weekly-plan item |
| `score` (active score) | `progress` |
| `score_auto` | stored in `content` frontmatter only |
| `score_manual` | stored in `content` frontmatter only |
| `tactics_completed` | stored in `content` frontmatter only |
| `tactics_total` | stored in `content` frontmatter only |

**`weekly-review`**
| Spec field | `items` column |
|---|---|
| `week` wiki-link | `parent_id` → weekly-plan item |
| `cycle_week` | `sort_order` |
| `scorecard` (%) | `progress` |
| `date` | `period_start` |

**`12-week-review`**
| Spec field | `items` column |
|---|---|
| `cycle` wiki-link | `parent_id` → 12-week-overview item |
| `overall_score` | `progress` |
| `date` | `period_start` |

**`13th-week-review`**
| Spec field | `items` column |
|---|---|
| `after_cycle` wiki-link | `parent_id` → completed cycle overview |
| `next_cycle` wiki-link | stored as `item_links` entry |
| `date` | `period_start` |

**`annual-review`**
| Spec field | `items` column |
|---|---|
| `year` | `subtype` (e.g., `"2026"`) |
| `average_score` | `progress` |
| `date` | `period_start` |

### Wiki-link resolution

Wiki-links are stored in the `item_links` table:
- `source_id` → the item containing the link
- `target_id` → resolved item id (null if unresolved)
- `target_title` → the raw link text (e.g., `"Career"`, `"12-week-2026-1"`)

The app resolves links by matching `target_title` against `items.filename` (exact match) or `items.title` (case-insensitive fallback). On save, the app scans the document content for `[[...]]` patterns and upserts `item_links` rows.

### Key queries

**Get the active cycle:**
```sql
SELECT * FROM items
WHERE type = '12-week-overview'
AND item_status = 'active'
AND is_trashed = FALSE
LIMIT 1;
```

**Get today's lead measures (for daily review wizard):**
```sql
SELECT lm.*
FROM items lm
JOIN items goal ON lm.parent_id = goal.id
WHERE lm.type = 'lead-measure'
AND lm.is_trashed = FALSE
AND goal.type = '12-week-goal'
AND goal.item_status = 'active'
AND goal.parent_id = :active_cycle_id
AND goal.is_trashed = FALSE;
```

Then filter in-app by `lm.frequency` vs the current day of the week.

**Get this week's daily reviews (for weekly review scorecard):**
```sql
SELECT * FROM items
WHERE type = 'daily-review'
AND parent_id = :weekly_plan_id
AND is_trashed = FALSE
ORDER BY period_start ASC;
```

**Get cycle progress (for "Week X of 12" display):**
Computed in-app: `floor((today - cycle.period_start) / 7) + 1`, capped at 12.

**Get scorecard trend (all weekly reviews for current cycle):**
```sql
SELECT * FROM items
WHERE type = 'weekly-review'
AND parent_id IN (
  SELECT id FROM items
  WHERE type = 'weekly-plan'
  AND parent_id = :active_cycle_id
)
AND is_trashed = FALSE
ORDER BY sort_order ASC;
```

---

## Lead Measure Tactic Completion Tracking

Daily tactic completions (the data that feeds the scorecard) are tracked in a separate table/item type, not inside the daily review document:

### `tactic-entry` items

Each time a lead measure is scored in the daily review wizard, a `tactic-entry` item is created (or updated):

| `items` column | Value |
|---|---|
| `type` | `tactic-entry` |
| `parent_id` | lead-measure item id |
| `period_start` | date scored (YYYY-MM-DD) |
| `completed` | true/false |
| `progress` | actual value (for numeric measures; null for binary) |
| `body` | optional note text |
| `description` | links back to daily-review item id (stored as plain id, not wiki-link) |

This structure lets the scorecard query completions directly:

```sql
-- Completion rate for a lead measure in the current cycle
SELECT
  COUNT(*) FILTER (WHERE completed = TRUE) as completed_count,
  COUNT(*) as total_count
FROM items
WHERE type = 'tactic-entry'
AND parent_id = :lead_measure_id
AND period_start >= :cycle_start
AND is_trashed = FALSE;
```

And per-week:
```sql
SELECT * FROM items
WHERE type = 'tactic-entry'
AND parent_id = :lead_measure_id
AND period_start >= :week_start
AND period_start <= :week_end
AND is_trashed = FALSE;
```

---

## Cycle State Tracking

The app tracks cycle transition progress using a dedicated singleton item, not inside any planning document:

| `items` column | Value |
|---|---|
| `type` | `cycle-transition-state` |
| `subtype` | `active` (only one at a time) |
| `parent_id` | the cycle being transitioned out of |
| `sort_order` | current step number (1–5, or 0 if not started) |
| `body` | JSON blob: `{ "from_cycle_id": "...", "completed_steps": {...}, "started_at": "..." }` |

The app queries for a `cycle-transition-state` item on load. If found and `sort_order > 0`, nudges are shown. The item is deleted (soft-deleted) when the transition completes.

**Get transition state:**
```sql
SELECT * FROM items
WHERE type = 'cycle-transition-state'
AND subtype = 'active'
AND is_trashed = FALSE
LIMIT 1;
```

Similarly, the **Saturday weekly plan nudge** is tracked by querying whether a `weekly-plan` item exists for the upcoming ISO week:
```sql
SELECT id FROM items
WHERE type = 'weekly-plan'
AND subtype = :next_week_iso   -- e.g. '2026-W04'
AND is_trashed = FALSE
LIMIT 1;
```
If no row is found and today is Saturday, show the nudge.

---

## Today View Integration

The Today tab (home page) surfaces strategy-relevant information without requiring the user to navigate to Plans.

### Today view: strategy surface points

**1. Active lead measures for today**

Below the daily task list, Today shows the lead measures scheduled for today (filtered by frequency vs current day of the week). Each measure has a quick-complete toggle:

```
┌─────────────────────────────────────┐
│ TUESDAY, JAN 15                     │
│                                     │
│ TODAY'S TACTICS                     │
│                                     │
│  Launch MVP                         │
│  [  ] Code 2hrs        target: 2h  │
│  [  ] Write blog post              │
│                                     │
│  Run 3x Weekly                      │
│  [✓] Run                           │
│                                     │
└─────────────────────────────────────┘
```

Tapping the checkbox starts the daily review wizard pre-filled with that tactic. Tapping anywhere else on the tactic row opens the parent goal doc.

This is a **V1 fast path** — the full daily review wizard is triggered from here but is also accessible directly from Plans → Reviews.

**2. Cycle transition nudge banner**

When a cycle transition is pending (current date > cycle `period_end`), a banner appears at the top of Today:

```
┌─────────────────────────────────────┐
│ ┌─────────────────────────────────┐ │
│ │ 🎯 Cycle 1 is complete.        │ │
│ │ Ready to review & plan next?   │ │
│ │              [Start transition] │ │
│ └─────────────────────────────────┘ │
│ ...                                 │
└─────────────────────────────────────┘
```

**3. Saturday weekly plan nudge banner**

When today is Saturday and no weekly plan exists for next week:

```
┌─────────────────────────────────────┐
│ ┌─────────────────────────────────┐ │
│ │ 📋 Time to plan next week.     │ │
│ │              [Create plan]      │ │
│ └─────────────────────────────────┘ │
│ ...                                 │
└─────────────────────────────────────┘
```

**4. No active cycle**

When there is no active cycle, the Today view shows no tactics section. The Plans tab badge shows a dot prompting setup.

### Today view: what it does NOT show

- The weekly scorecard (accessible from Plans → Scorecard)
- Planning documents (cycle overview, goals, life areas) — those live in Plans
- Review wizard (daily review is triggered from Today but the wizard opens as a full-screen flow)

---

## Search and Filter within Plans

### Plans list search

A search bar at the top of each drill-down list filters items by title. Search is local (SQLite), no server round-trip required.

```
┌─────────────────────────────────────┐
│ ‹ Plans     Reviews                 │
│ ┌─────────────────────────────────┐ │
│ │ 🔍 Search reviews...           │ │
│ └─────────────────────────────────┘ │
│                                     │
│ DAILY                               │
│ ...                                 │
└─────────────────────────────────────┘
```

Search is available in:
- Weekly Plans list
- Reviews list (searches across all review types by date/title)
- Life Areas list
- Archive list

Search is **not** available on the top-level Plans list (it has only 6 fixed rows).

### Filter by date range (post-V1)

Date range filtering within drill-down lists (e.g., "show daily reviews from last 30 days") is deferred to post-V1. The current week and most recent entries are always shown first.

---

## V1 Build Scope

### In V1

The following features are required for a usable V1:

**Setup & structure:**
- Setup wizard (all 6 steps)
- Life area docs (create + view + edit)
- Annual outcomes docs (create + view + edit)
- 12-week cycle overview (create + view + edit)
- 12-week goal docs (create + view + edit)
- Lead measure child items (created during goal setup)

**Weekly workflow:**
- Weekly plan creation (with pre-populated tactics from active goals)
- Saturday nudge (Today view banner)
- Weekly plan view (full-page doc)

**Daily workflow:**
- Daily review wizard (all 3 screens)
- Today view: tactics surface + quick-complete toggle
- Tactic-entry items (completion tracking)

**Reviews & scorecard:**
- Weekly review wizard (all 3 screens)
- Scorecard live view (current week grid + cycle trend)
- Plans list with all drill-downs (Current Cycle, Scorecard, Weekly Plans, Reviews, Life Areas, Archive)

**Cycle transition:**
- Cycle transition nudge (Today + Plans tab badge + Plans banner)
- Cycle transition flow (all 5 steps)
- Archive (read-only view of past cycles)

**Templates:**
- Default templates for all document types
- Template variables auto-filled during creation
- Edit Templates accessible from Plans menu

### Post-V1

These features are deferred:

- **Date range filtering** within Reviews list
- **Auto-recalculate** daily review score when user edits the lead measure table in the full editor
- **Annual review wizard** (the annual review doc can be created manually in V1)
- **13th-week review wizard** (same — create manually from the type picker)
- **Multi-device conflict resolution** — PowerSync handles this at the row level; strategy-specific merge logic (e.g., if two devices score the same tactic simultaneously) is deferred
- **Tomorrow's priority cross-context flow** — the daily review ends with a nudge to prep tomorrow's tasks in Knowledge, but no automated cross-context navigation
- **Lead measure linking to habits/projects** — the wiki-link columns in `item_links` for lead measures are stored but the linking UI (choosing a habit or project from the tactic form) is post-V1; users can add wiki-links manually in the editor
- **Cycle health indicators** — e.g., visual warning if a goal is behind pace at week 6 of 12
- **Weekly plan "Upcoming" section** — showing next week's plan before it starts; V1 only shows current + past plans for the cycle

---

## Error States and Empty States

### No active cycle

When the user opens Plans with no active cycle (e.g., fresh install or mid-transition):

```
┌─────────────────────────────────────┐
│                                     │
│         Welcome to Plans            │
│                                     │
│  Set up your planning system with   │
│  a guided walkthrough, or start     │
│  from scratch.                      │
│                                     │
│  ┌───────────────────────────────┐  │
│  │       Guided Setup            │  │
│  └───────────────────────────────┘  │
│                                     │
│  ┌───────────────────────────────┐  │
│  │       Start Manual            │  │
│  └───────────────────────────────┘  │
│                                     │
└─────────────────────────────────────┘
```

The "Current Cycle" and "Scorecard" rows are hidden until a cycle exists.

### No weekly plan for current week

The "Weekly Plans" row shows `0` and tapping it shows:
```
No plan this week yet.
[Create weekly plan]
```

### No daily reviews yet this week

The scorecard grid shows all cells as `·` (pending). Score is shown as `—` rather than `0%` until at least one tactic-entry exists.

### Lead measures with no frequency match today

If all active lead measures are weekly (not daily), the Today view tactics section shows:
```
No tactics scheduled for today.
```

The daily review wizard is still accessible from Plans → Reviews → Daily.

### Archived cycle with no review docs

If a user archives a cycle without completing the transition wizard (e.g., they created the next cycle manually), the Archive entry shows no score and no link to a 12-week review. The entry is still browsable.
