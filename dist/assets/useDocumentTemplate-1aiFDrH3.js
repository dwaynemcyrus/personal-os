import{s as i,z as f,A as g}from"./index-CKZ1Uqoe.js";import"./vendor-utils-CzmbmQQ2.js";const p={daily_note_template_id:null,template_date_format:"YYYY-MM-DD",template_time_format:"HH:mm:ss"};async function y(){const{data:{user:e}}=await i.auth.getUser();if(!e)return null;const{data:t}=await i.from("user_settings").select("*").eq("user_id",e.id).maybeSingle();return t}async function P(e){const{data:{user:t}}=await i.auth.getUser();t&&await i.from("user_settings").upsert({user_id:t.id,...e,updated_at:new Date().toISOString()},{onConflict:"user_id"})}const h=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"],w=["January","February","March","April","May","June","July","August","September","October","November","December"];function s(e){return e.toString().padStart(2,"0")}function d(e,t){const a=e.getFullYear(),o=s(e.getMonth()+1),r=s(e.getDate()),n=h[e.getDay()],c=w[e.getMonth()];return t?t.replace(/YYYY/g,a.toString()).replace(/YY/g,a.toString().slice(-2)).replace(/MMMM/g,c).replace(/MMM/g,c.slice(0,3)).replace(/MM/g,o).replace(/M/g,(e.getMonth()+1).toString()).replace(/DD/g,r).replace(/D/g,e.getDate().toString()).replace(/dddd/g,n).replace(/ddd/g,n.slice(0,3)):`${a}-${o}-${r}`}function m(e,t){const a=s(e.getHours()),o=s(e.getMinutes()),r=s(e.getSeconds());return t?t.replace(/HH/g,a).replace(/H/g,e.getHours().toString()).replace(/mm/g,o).replace(/m/g,e.getMinutes().toString()).replace(/ss/g,r).replace(/s/g,e.getSeconds().toString()):`${a}:${o}:${r}`}function S(e){return`${d(e)} ${m(e,"HH:mm")}`}function D(e,t={}){const a=t.date??new Date,o=t.dateFormat??"YYYY-MM-DD",r=t.timeFormat??"HH:mm:ss";let n=e;n=n.replace(/\{\{date:([^}]+)\}\}/g,(u,l)=>d(a,l)),n=n.replace(/\{\{time:([^}]+)\}\}/g,(u,l)=>m(a,l));const c={date:d(a,o),time:m(a,r),datetime:S(a),year:a.getFullYear().toString(),month:s(a.getMonth()+1),day:s(a.getDate()),weekday:h[a.getDay()],title:t.title??""};for(const[u,l]of Object.entries(c))n=n.replace(new RegExp(`\\{\\{${u}\\}\\}`,"g"),l);return n}const L=["journal","creation","transmission","reference","log","review","action","inbox"],Y={journal:"Journal",creation:"Creation",transmission:"Transmission",reference:"Reference",log:"Log",review:"Review",action:"Action",inbox:"Inbox"},T={"journal:daily":`
## Capture


## Reflection

**Wins:**

**Losses:**

**Lessons:**

**1% better tomorrow:**`,"journal:istikarah":`
## Intention

What are you seeking guidance on?

## Guidance

What did you receive from Allah SWT?

## Quranic References


## Action

What will you do as a result?

## Signs

#### {{date:YYYY-MM-DD}}

What did you notice and what does it mean?`,"journal:dream":`
## Dream


## Symbols


## Reflection

What do you think this dream means?`,"journal:scratch":"","journal:devlog":`
## What I worked on


## Decisions made


## Blockers


## Next session`,"creation:essay":`
## Hook


## Body


## Conclusion`,"creation:framework":`
## Problem

What problem does this framework solve?

## Framework

### Principle 1


### Principle 2


### Principle 3


## Application

How is this framework applied in real life?

## Example

A concrete example of this framework in action.`,"creation:lesson":`
## Story

Tell the story. Put the reader in the middle of it.

## Insight

What does the story teach?

## Application

How can the reader apply this insight in their own life?`,"creation:manuscript":`
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

Any additional thoughts, research, or ideas.`,"creation:chapter":`
## Summary

One paragraph describing what this chapter covers.

## Draft`,"creation:comic":`
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

## Notes`,"creation:poem":`
## Poem


## Notes`,"creation:story":`
## Premise

What is this story about in one paragraph?

## Story


## Notes`,"creation:artwork":`
## Description

What is this artwork about?

## Process

How was this made?

## Exhibition History

-

## Notes`,"creation:case_study":`
## Overview

What was this project and why did it matter?

## Challenge

What problem were you solving?

## Process

How did you approach it?

## Outcome

What was the result?

## Lessons

What did you learn?`,"transmission:workshop":`
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

Post-event additions and observations.`,"transmission:script":`
## Hook


## Body


## Call To Action


## Resources

-

## Notes`,"transmission:podcast":`
## Summary

What is this episode about in one paragraph?

## Outline

-
-
-

## Show Notes


## Resources

-

## Notes`,"transmission:lecture":`
## Objective

What should the audience learn from this lecture?

## Outline

-
-
-

## Content


## Resources

-

## Notes`,"reference:slip":`
## Note`,"reference:identity":`
## Content`,"reference:principle":`
## Principle


## Why`,"reference:directive":`
## Directive


## Application`,"reference:source":`
## Summary

A 1-3 paragraph summary of the source in your own words.

## Key Ideas


## Literature Notes

- [[]]`,"reference:literature":`
## Notes


## Key Ideas


## Slips

Links to atomic notes extracted from this literature note.

- [[]]`,"reference:quote":`
>`,"reference:guide":`
## Overview


## Steps


## Notes`,"reference:offer":`
## Problem


## Solution


## Value

What transformation does this offer provide?

## Delivery

How is this offer delivered?

## Pricing


## Notes`,"reference:asset":`
## Content


## Usage Notes

When and how to use this asset.`,"reference:software":`
## Overview

What does this software do?

## Architecture


## Features

-

## Notes`,"reference:course":`
## Overview

What is this course about?

## Modules

- [ ] [[]]
- [ ] [[]]
- [ ] [[]]

## Key Takeaways


## Notes`,"reference:module":`
## Summary


## Key Takeaways


## Notes


## Resources

- [[]]`,"log:habit":`
| Date | Value | Note |
|------|-------|------|
|      |       |      |`,"log:goal":`
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

**Observations:**`,"log:finance":`
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

**Observations:**`,"log:contact":`
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
- Next:`,"log:outreach":`
| Name | Platform | Type | Status | Note |
|------|----------|------|--------|------|
|      |          |      |        |      |

## Observations

- Did you update total_* frontmatter fields?
- Did you create contact notes for all promoted rows?
- Any follow-ups to schedule for tomorrow?`,"review:weekly":`
## Scores This Week

| Area | Target | Actual | Status |
|------|--------|--------|--------|
|      |        |        |        |

## Wins

What worked and why?

## Losses

What didn't work and why?

## Key Lessons


## Adjustments for Next Week`,"review:monthly":`
## Scores This Month

| Area | Target | Actual | Status |
|------|--------|--------|--------|
|      |        |        |        |

## Wins

What worked and why?

## Losses

What didn't work and why?

## Key Lessons


## Adjustments for Next Month`,"review:yearly":`
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

## Next Steps`,"review:area":`
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
- Goal:`,"action:task":`
## Notes`,"action:project":`
## Outcome

What does done look like?

## Tasks

- [ ] [[]]
- [ ] [[]]
- [ ] [[]]

## Notes`,inbox:`
## Capture`};function b(e){return e.replace(/[_-]+/g," ").split(" ").filter(Boolean).map(t=>t.charAt(0).toUpperCase()+t.slice(1)).join(" ")}function v(e){if(e==="inbox")return"Inbox";const[t,a]=W(e),o=b(a??t);return t==="journal"?`${o} Journal`:t==="review"?`${o} Review`:o}function k(e,t){return t?`${e}:${t}`:e}function W(e){if(!e.includes(":"))return[e,null];const[t,...a]=e.split(":");return[t,a.join(":")||null]}const _=Object.entries(T).map(([e,t])=>({subtype:e,title:v(e),content:t}));async function O(){const{data:e,error:t}=await i.from("items").select("subtype").eq("type","template").is("date_trashed",null);if(t)throw t;const a=new Set((e??[]).map(r=>r.subtype).filter(r=>!!r));let o=0;for(const r of _)a.has(r.subtype)||(await f({cuid:g(),type:"template",subtype:r.subtype,title:r.title,status:"active",access:"private",area:null,workbench:!1,resources:[],dependencies:[],blocked:!1,slug:null,published:!1,tier:null,growth:null,rating:null,start_date:null,end_date:null,date_created:new Date().toISOString(),date_modified:null,date_trashed:null,tags:[],content:r.content,frontmatter:null}),o+=1);return o}async function H(){const{data:e,error:t}=await i.from("items").select("id, subtype, title, content").eq("type","template").is("date_trashed",null).order("subtype",{ascending:!0});if(t)throw t;return e??[]}async function M(e,t){const a=k(e,t),{data:o,error:r}=await i.from("items").select("id, subtype, title, content").eq("type","template").eq("subtype",a).is("date_trashed",null).maybeSingle();if(r)throw r;return o??null}async function N(e,t){const a=await M(e,t);return a?a.content??"":null}async function C(e,t={}){const a=await y();return D(e,{date:t.date??new Date,dateFormat:a?.template_date_format??p.template_date_format,timeFormat:a?.template_time_format??p.template_time_format,title:t.title??""})}async function x(e,t,a={}){const o=await N(e,t);return o===null?null:C(o,a)}export{p as D,L as T,_ as a,Y as b,O as c,H as d,C as e,y as f,x as g,D as r,W as s,P as u};
