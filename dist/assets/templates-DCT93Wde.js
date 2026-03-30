import{p as w,i as y,D as E,Y as T}from"./vendor-utils-CEmgTSPg.js";const b=/^---\s*$/,Y=/^(---|\.\.\.)\s*$/,$=e=>e.includes(`\r
`)?`\r
`:`
`,M=e=>{const t=$(e),r=e.split(/\r?\n/);if(r.length===0||!b.test(r[0]??""))return{body:e,frontmatter:null,lineEnding:t,hasFrontmatter:!1,errors:[]};let a=-1;for(let n=1;n<r.length;n+=1)if(Y.test(r[n]??"")){a=n;break}return a===-1?{body:e,frontmatter:null,lineEnding:t,hasFrontmatter:!0,errors:["Missing closing frontmatter delimiter."]}:{frontmatter:r.slice(1,a).join(t),body:r.slice(a+1).join(t),lineEnding:t,hasFrontmatter:!0,errors:[]}},N=e=>!e||typeof e!="object"||Array.isArray(e)?null:e,h=e=>{const t=M(e);if(!t.frontmatter)return{body:t.body,frontmatter:null,document:null,properties:null,errors:t.errors,warnings:[],lineEnding:t.lineEnding,hasFrontmatter:t.hasFrontmatter};const r=w(t.frontmatter,{keepSourceTokens:!0}),a=[...t.errors,...r.errors.map(s=>s.message)],n=r.warnings.map(s=>s.message);r.contents&&!y(r.contents)&&a.push("Frontmatter must be a key/value mapping.");const o=a.length===0?N(r.toJSON()):null;return{body:t.body,frontmatter:t.frontmatter,document:r,properties:o,errors:a,warnings:n,lineEnding:t.lineEnding,hasFrontmatter:t.hasFrontmatter}},F=(e,t)=>["---",e.toString().trimEnd().replace(/\n/g,t),"---",""].join(t),W=(e,t)=>{const r=M(e),a=r.lineEnding;if(!t)return r.hasFrontmatter?r.body:e;const n=F(t,a);return r.hasFrontmatter?`${n}${r.body}`:`${n}${e}`},f=(e,t)=>{const r=e??new E;(!r.contents||!y(r.contents))&&(r.contents=new T);const a=r.contents,n=new Set;for(const o of a.items){const s=typeof o.key=="string"?o.key:String(o.key.value??o.key);n.add(s)}for(const[o,s]of Object.entries(t))n.has(o)||a.set(o,s);return r},k=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"],A=["January","February","March","April","May","June","July","August","September","October","November","December"];function l(e){return e.toString().padStart(2,"0")}function g(e,t){const r=e.getFullYear(),a=l(e.getMonth()+1),n=l(e.getDate()),o=k[e.getDay()],s=A[e.getMonth()];return t?t.replace(/YYYY/g,r.toString()).replace(/YY/g,r.toString().slice(-2)).replace(/MMMM/g,s).replace(/MMM/g,s.slice(0,3)).replace(/MM/g,a).replace(/M/g,(e.getMonth()+1).toString()).replace(/DD/g,n).replace(/D/g,e.getDate().toString()).replace(/dddd/g,o).replace(/ddd/g,o.slice(0,3)):`${r}-${a}-${n}`}function u(e,t){const r=l(e.getHours()),a=l(e.getMinutes()),n=l(e.getSeconds());return t?t.replace(/HH/g,r).replace(/H/g,e.getHours().toString()).replace(/mm/g,a).replace(/m/g,e.getMinutes().toString()).replace(/ss/g,n).replace(/s/g,e.getSeconds().toString()):`${r}:${a}:${n}`}function j(e){return`${g(e)} ${u(e,"HH:mm")}`}function x(e,t={}){const r=t.date??new Date,a=t.dateFormat??"YYYY-MM-DD",n=t.timeFormat??"HH:mm:ss";let o=e;o=o.replace(/\{\{date:([^}]+)\}\}/g,(c,i)=>g(r,i)),o=o.replace(/\{\{time:([^}]+)\}\}/g,(c,i)=>u(r,i));const s={date:g(r,a),time:u(r,n),datetime:j(r),year:r.getFullYear().toString(),month:l(r.getMonth()+1),day:l(r.getDate()),weekday:k[r.getDay()],title:t.title??""};for(const[c,i]of Object.entries(s))o=o.replace(new RegExp(`\\{\\{${c}\\}\\}`,"g"),i);return o}function L(e,t,r=0){if(!e.trim())return t;const n=h(e),o=h(t);let s=e,c=r;if(o.hasFrontmatter&&o.properties){if(n.hasFrontmatter&&n.document){const m=f(n.document,o.properties);s=W(e,m);const p=e.length-n.body.length,D=s.length-n.body.length-p;c=Math.min(Math.max(0,r+(r>=p?D:0)),s.length)}else if(!n.hasFrontmatter){const m=F(f(null,o.properties),`
`);s=m+e,c=r+m.length}}const i=o.body;if(!i.trim())return s;const S=`
`+i.trimStart(),d=Math.min(Math.max(0,c),s.length);return s.slice(0,d)+S+s.slice(d)}function O(e,t){return e==="journal"&&t==="daily"?`## Morning Briefing

What are the three most important things today?

-
-
-

## Time Blocks

| Block | Focus |
|-------|-------|
| Morning | |
| Afternoon | |
| Evening | |

## Evening Capture

What happened? What carries forward?

`:e==="journal"&&t==="scratch"?`## Stream

`:e==="action"&&t==="task"?`## Notes

`:e==="action"&&t==="project"?`## Outcome

What does done look like?

## Tasks

- [ ]
- [ ]
- [ ]

## Notes

`:e==="creation"&&t==="essay"?`## Hook



## Argument



## Evidence



## Counterargument



## Conclusion


`:e==="reference"&&t==="slip"?`## Source



## Note



## Links

`:e==="reference"&&t==="literature"?`## Source



## Summary



## Key Ideas

-

## Quotes

>

## Links

`:e==="review"&&t==="weekly"?`## Last Week

What happened? What went well? What didn't?

## Incomplete

What carried over? What do I do with it?

## This Week

What are the priorities?

-
-
-

## Projects Check

Any stalled projects? Any to close?

## Inbox Clear

Is inbox empty?

`:null}export{O as g,L as m,h as p,x as r};
