# Personal OS Editor - Complete Build Specification
**Version:** 1.0 **Target:** Claude Code (Codex CLI) **Platform:** Next.js 15 PWA (Single Page Application) **Primary Device:** iPhone 15 Pro (393px width), scales to desktop **Architecture:** Offline-first, sheet-based navigation, no Next.js routing

## Table of Contents
1 ~Project Overview~
2 ~Technical Architecture~
3 ~Navigation System~
4 ~Editor Core Features~
5 ~Properties System~
6 ~Wiki-Links System~
7 ~Templates System~
8 ~Focus & Writing Modes~
9 ~Version History~
10 ~Extended Markdown~
11 ~Graph View~
12 ~Database Schema~
13 ~Implementation Phases~
14 ~Design Guidelines~
15 ~Performance Requirements~

## Project Overview
### What We're Building
A mobile-first, offline-first note editor that combines:
* **Bear's** instant markdown rendering and beautiful UI
* **IA Writer's** typewriter and focus modes for distraction-free writing
* **Obsidian's** wiki-links, properties, templates, and graph view
* **Unique integration** with task management, projects, and habits

### Core Principles
**1** **Offline-First:** Everything works without internet, syncs when available
**2** **Sheet-Based Navigation:** No URL routing, all navigation via overlapping sheets
**3** **Mobile-First:** Designed for iPhone, scales to desktop
**4** **Zero Distractions:** Clean interface, content-focused
**5** **Instant Feedback:** No lag, no loading spinners, immediate response
**6** **Personal & Private:** Single-user, no sharing features

### Target User
* Primary user: Developer/knowledge worker
* Primary device: iPhone 15 Pro
* Primary use case: Note-taking with markdown, building knowledge base
* Secondary use case: Writing distraction-free, connecting ideas

## Technical Architecture
### Stack
```
Frontend:
- Next.js 15 (as static app shell, NOT for routing)
- React 19
- TypeScript (strict mode)
- CodeMirror 6 (editor)
- Framer Motion (animations)
- Radix UI (dropdowns, date pickers, etc.)
- CSS Modules + BEM (styling)

Data Layer:
- RxDB (local-first database, IndexedDB storage)
- Supabase (cloud sync backend)
- RxJS (reactive state)

Build:
- Turbopack (Next.js 15 default)
- PWA configuration
```

### File Structure
```
personal-os/
├── src/
│   ├── app/
│   │   ├── page.tsx                    ← Single route, renders <AppShell />
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AppShell.tsx            ← Navigation state manager
│   │   │   ├── Sheet.tsx               ← Reusable sheet wrapper
│   │   │   ├── FAB.tsx                 ← Floating action button
│   │   │   ├── ContextPicker.tsx       ← 3-zone drag overlay
│   │   │   └── CommandCenter.tsx       ← Global search/quick capture
│   │   ├── editor/
│   │   │   ├── Editor.tsx              ← Main editor component
│   │   │   ├── EditorToolbar.tsx       ← Formatting toolbar
│   │   │   ├── PropertiesSheet.tsx     ← Properties panel
│   │   │   ├── WikiLinkAutocomplete.tsx
│   │   │   ├── TemplatesPicker.tsx
│   │   │   ├── VersionHistory.tsx
│   │   │   └── FocusMode.tsx
│   │   └── ui/
│   │       └── ... (Button, Input, etc.)
│   ├── features/
│   │   ├── today/
│   │   │   └── TodayView.tsx
│   │   ├── tasks/
│   │   │   ├── TasksMenu.tsx
│   │   │   ├── TasksList.tsx
│   │   │   └── ...
│   │   ├── notes/
│   │   │   ├── NotesMenu.tsx
│   │   │   ├── NotesList.tsx
│   │   │   ├── NoteDetail.tsx          ← Contains <Editor />
│   │   │   ├── ReaderList.tsx
│   │   │   └── GraphView.tsx
│   │   └── strategy/
│   │       └── ...
│   ├── lib/
│   │   ├── db.ts                       ← RxDB setup
│   │   ├── supabase.ts                 ← Supabase client
│   │   ├── sync.ts                     ← Bidirectional sync
│   │   ├── navigation.ts               ← Navigation state machine
│   │   ├── markdown/
│   │   │   ├── parser.ts               ← Markdown parsing
│   │   │   ├── wikilinks.ts            ← Wiki-link parsing
│   │   │   ├── templates.ts            ← Template variable replacement
│   │   │   └── callouts.ts             ← Callout rendering
│   │   └── editor/
│   │       ├── extensions/             ← CodeMirror extensions
│   │       │   ├── instant-render.ts   ← Hide markdown syntax
│   │       │   ├── wikilink.ts         ← Wiki-link support
│   │       │   ├── typewriter.ts       ← Typewriter mode
│   │       │   ├── focus.ts            ← Focus mode
│   │       │   └── callouts.ts         ← Callout syntax
│   │       └── themes/
│   │           ├── light.ts
│   │           └── dark.ts
│   ├── hooks/
│   │   ├── useDatabase.ts
│   │   ├── useNavigation.ts
│   │   ├── useEditor.ts
│   │   └── useBackButton.ts
│   └── types/
│       └── ... (TypeScript types)
├── docs/
│   ├── schema.md                       ← Database schema reference
│   ├── design-tokens.md                ← CSS variables
│   ├── components.md                   ← Component inventory
│   └── architecture.md                 ← System architecture
├── agents.md                           ← Agent roles for Codex CLI
├── frontend.md                         ← Frontend guidelines
├── PLANS.md                            ← Phase roadmap
├── README.md
└── NAVIGATION.md                       ← Navigation architecture (already exists)
```

## Navigation System
### Critical: No Next.js Routing
This app uses a **single route** (/) with all navigation via overlapping sheets. Do NOT use:
* ❌ Dynamic routes (/notes/[id])
* ❌ useRouter() for navigation
* ❌ <Link> components for internal navigation
* ❌ Route groups or parallel routes

### Navigation State
All navigation is managed by a state machine:
```typescript
type NavigationState = 
  | { view: 'today' }
  | { view: 'context-picker' }
  | { view: 'knowledge-menu' }
  | { view: 'knowledge-notes' }
  | { view: 'knowledge-note-detail', noteId: string }
  // ... etc
```

### Sheet System
Sheets are full-screen overlays that slide up from bottom:
* Layer 1: Today (base, always rendered)
* Layer 2: Context Picker (when FAB held)
* Layer 3+: Context sheets, lists, detail views

### FAB Behavior
```typescript
// Two distinct actions:
onTap → Opens Command Center (global search/quick capture)
onHold (500ms) → Opens Context Picker (3 zones: Execution, Knowledge, Strategy)
```

### Back Navigation
Three methods, all equivalent:
1 Tap ← button in sheet header
2 Swipe RIGHT on sheet
3 Browser back button (must be wired to navigation state)

⠀**See NAVIGATION.md for complete details.**

## Editor Core Features
### CodeMirror 6 Foundation
Use CodeMirror 6 as the editor base. It provides:
* Professional text editing
* Markdown syntax support
* Extensibility (custom extensions)
* Performance (virtual scrolling)
* Mobile support (touch events)

### Installation
```bash
npm install @codemirror/state @codemirror/view @codemirror/commands
npm install @codemirror/lang-markdown @codemirror/language
npm install @codemirror/autocomplete @codemirror/search
npm install @codemirror/history @codemirror/lint
```

### Basic Editor Component
```typescript
// src/components/editor/Editor.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { EditorState } from '@codemirror/state';
import { EditorView, keymap } from '@codemirror/view';
import { defaultKeymap } from '@codemirror/commands';
import { markdown } from '@codemirror/lang-markdown';

interface EditorProps {
  noteId: string;
  initialContent: string;
  onSave: (content: string) => void;
}

export function Editor({ noteId, initialContent, onSave }: EditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  
  useEffect(() => {
    if (!editorRef.current) return;
    
    const state = EditorState.create({
      doc: initialContent,
      extensions: [
        markdown(),
        keymap.of(defaultKeymap),
        EditorView.lineWrapping,
        // Add more extensions here
      ],
    });
    
    const view = new EditorView({
      state,
      parent: editorRef.current,
    });
    
    viewRef.current = view;
    
    return () => {
      view.destroy();
    };
  }, [noteId]);
  
  return <div ref={editorRef} className="editor" />;
}
```

### Auto-Save
Implement debounced auto-save:
* Save to RxDB after 1 second of no typing
* Show no UI feedback (silent save)
* Sync to Supabase in background
```typescript
// Debounce save
const debouncedSave = useMemo(
  () => debounce((content: string) => {
    saveToRxDB(noteId, content);
  }, 1000),
  [noteId]
);

// On content change
EditorView.updateListener.of((update) => {
  if (update.docChanged) {
    const content = update.state.doc.toString();
    debouncedSave(content);
  }
});
```

### **Instant Markdown Rendering**
This is the core feature that makes writing feel like Bear.
**Goal:** Hide markdown syntax when not editing it, show formatted result.
```
Type:   **bold text**
See:    bold text        ← Syntax hidden
Click:  **|bold text**   ← Cursor reveals syntax for editing
```
⠀
**Implementation:** Custom CodeMirror extension using decorations.
**File:** src/lib/editor/extensions/instant-render.ts
```typescript
import { Decoration, DecorationSet, EditorView, ViewPlugin, ViewUpdate } from '@codemirror/view';
import { Range } from '@codemirror/state';

// This extension hides markdown syntax when cursor is not in that range
export const instantRenderExtension = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;
    
    constructor(view: EditorView) {
      this.decorations = this.buildDecorations(view);
    }
    
    update(update: ViewUpdate) {
      if (update.docChanged || update.selectionSet) {
        this.decorations = this.buildDecorations(update.view);
      }
    }
    
    buildDecorations(view: EditorView): DecorationSet {
      const decorations: Range<Decoration>[] = [];
      const cursorPos = view.state.selection.main.head;
      
      // Find markdown syntax patterns
      const doc = view.state.doc;
      const text = doc.toString();
      
      // Example: Hide ** for bold (when cursor not inside)
      const boldRegex = /\*\*(.+?)\*\*/g;
      let match;
      
      while ((match = boldRegex.exec(text)) !== null) {
        const start = match.index;
        const end = match.index + match[0].length;
        
        // Only hide if cursor is NOT in this range
        if (cursorPos < start || cursorPos > end) {
          // Hide opening **
          decorations.push(
            Decoration.replace({ }).range(start, start + 2)
          );
          // Hide closing **
          decorations.push(
            Decoration.replace({ }).range(end - 2, end)
          );
          // Style the content as bold
          decorations.push(
            Decoration.mark({ class: 'cm-strong' }).range(start + 2, end - 2)
          );
        }
      }
      
      // TODO: Add similar logic for:
      // - Italic: _text_ or *text*
      // - Strikethrough: ~~text~~
      // - Code: `code`
      // - Headers: # heading
      // - Links: [text](url)
      // - Lists: - item, 1. item
      
      return Decoration.set(decorations);
    }
  },
  {
    decorations: v => v.decorations
  }
);
```

**CSS for formatted text:**
```css
/* src/components/editor/Editor.module.css */

.editor :global(.cm-strong) {
  font-weight: 600;
}

.editor :global(.cm-emphasis) {
  font-style: italic;
}

.editor :global(.cm-strikethrough) {
  text-decoration: line-through;
}

.editor :global(.cm-code) {
  font-family: 'SF Mono', monospace;
  background: var(--color-code-bg);
  padding: 2px 4px;
  border-radius: 3px;
}

.editor :global(.cm-link) {
  color: var(--color-link);
  text-decoration: underline;
}
```

**Note:** This is a simplified example. Full implementation requires:
* Handling all markdown syntax
* Proper cursor position detection
* Efficient decoration updates
* Edge case handling (nested syntax, etc.)

⠀Raw Text Mode
Add a toggle to view/edit raw markdown (not default).
```typescript
// Add to editor state
const [rawMode, setRawMode] = useState(false);

// Toggle extension
const extensions = [
  markdown(),
  // Only add instant render when NOT in raw mode
  ...(rawMode ? [] : [instantRenderExtension]),
];

// UI toggle
<button onClick={() => setRawMode(!rawMode)}>
  {rawMode ? 'Preview' : 'Raw'}
</button>
```

### Editor Styling
Beautiful typography is critical.
```
/* src/components/editor/Editor.module.css */

.editor {
  /* Native iOS font */
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', system-ui, sans-serif;
  
  /* Readable size */
  font-size: 17px;
  line-height: 1.6;
  letter-spacing: -0.01em;
  
  /* Generous spacing */
  padding: 20px;
  
  /* Full height */
  min-height: 100vh;
  
  /* White space */
  max-width: 100%;
  margin: 0 auto;
}

/* Headings */
.editor :global(.cm-header-1) {
  font-size: 2em;
  font-weight: 700;
  line-height: 1.2;
  margin-top: 1.5em;
  margin-bottom: 0.5em;
}

.editor :global(.cm-header-2) {
  font-size: 1.5em;
  font-weight: 600;
  margin-top: 1.2em;
  margin-bottom: 0.4em;
}

/* Lists */
.editor :global(.cm-list) {
  padding-left: 1.5em;
}

/* Code blocks */
.editor :global(.cm-code-block) {
  font-family: 'SF Mono', 'Menlo', monospace;
  font-size: 0.9em;
  background: var(--color-code-bg);
  padding: 1em;
  border-radius: 6px;
  margin: 1em 0;
}

/* Block quotes */
.editor :global(.cm-blockquote) {
  border-left: 4px solid var(--color-border);
  padding-left: 1em;
  color: var(--color-text-secondary);
  font-style: italic;
}

/* Links */
.editor :global(.cm-link) {
  color: var(--color-link);
  text-decoration: underline;
  cursor: pointer;
}
```

---

## **Properties System**

### **Overview**
Properties are structured metadata attached to notes. Unlike Obsidian's YAML frontmatter (plain text), these are:
- Visual forms (dropdowns, date pickers, tag selectors)
- Typed (text, number, date, link, etc.)
- Linked to other entities (projects, notes)
- Dynamic (each note can have different properties)

### **Properties Sheet UI**
Properties open in a sheet from the More menu (⋮).
```
Note Editor View:
┌─────────────────────────────┐
│ ←  Note Title           ⋮   │  ← More menu
├─────────────────────────────┤
│ # Heading                   │
│ Note content...             │
└─────────────────────────────┘

Tap ⋮ → "Properties"

Properties Sheet:
┌─────────────────────────────┐
│ ×  Properties           +   │  ← Add property button
├─────────────────────────────┤
│ Project                     │  ← Property name
│ [Blog Content          ▼]   │  ← Dropdown (linked)
├─────────────────────────────┤
│ Status                      │
│ [In Progress           ▼]   │  ← Dropdown (values)
├─────────────────────────────┤
│ Tags                        │
│ #react #typescript     +    │  ← Tag picker
├─────────────────────────────┤
│ Related Note                │
│ [[React Patterns]]          │  ← Wiki-link
├─────────────────────────────┤
│ Due Date                    │
│ [Feb 5, 2026           📅]  │  ← Date picker
├─────────────────────────────┤
│ Priority                    │
│ ⭐⭐⭐☆☆                     │  ← Visual picker
└─────────────────────────────┘
```

### Property Types
```typescript
// src/types/properties.ts

export type PropertyType =
  | 'text'        // Free text input
  | 'number'      // Numeric input
  | 'date'        // Date picker
  | 'checkbox'    // Boolean toggle
  | 'dropdown'    // Select from options
  | 'tags'        // Multi-tag selector
  | 'wikilink'    // Link to another note
  | 'project'     // Link to project entity
  | 'url'         // URL input
  | 'rating';     // Star rating (1-5)

export interface PropertyDefinition {
  id: string;
  name: string;
  type: PropertyType;
  options?: string[];  // For dropdown type
  required?: boolean;
  order: number;       // Display order
}

export interface PropertyValue {
  propertyId: string;
  value: any;  // Type depends on PropertyType
}

// Example property values stored in note
{
  "properties": {
    "project_id": "uuid-of-blog-content-project",
    "status": "in-progress",
    "tags": ["react", "typescript"],
    "related_note": "uuid-of-react-patterns-note",
    "due_date": "2026-02-05T00:00:00Z",
    "priority": 3
  }
}
```

### Properties Component
```
// src/components/editor/PropertiesSheet.tsx
'use client';

import { useState } from 'react';
import { Sheet } from '@/components/layout/Sheet';
import { PropertyField } from './PropertyField';

interface PropertiesSheetProps {
  isOpen: boolean;
  onClose: () => void;
  noteId: string;
  properties: Record<string, any>;
  onSave: (properties: Record<string, any>) => void;
}

export function PropertiesSheet({
  isOpen,
  onClose,
  noteId,
  properties,
  onSave,
}: PropertiesSheetProps) {
  const [localProperties, setLocalProperties] = useState(properties);
  const [availableProperties, setAvailableProperties] = useState<PropertyDefinition[]>([
    // Predefined common properties
    { id: 'project', name: 'Project', type: 'project', order: 1 },
    { id: 'status', name: 'Status', type: 'dropdown', options: ['draft', 'in-progress', 'done'], order: 2 },
    { id: 'tags', name: 'Tags', type: 'tags', order: 3 },
  ]);
  
  const handlePropertyChange = (propertyId: string, value: any) => {
    const updated = { ...localProperties, [propertyId]: value };
    setLocalProperties(updated);
    onSave(updated);  // Auto-save
  };
  
  const handleAddProperty = (property: PropertyDefinition) => {
    // Add to available properties for this note
    setAvailableProperties([...availableProperties, property]);
  };
  
  const handleRemoveProperty = (propertyId: string) => {
    const { [propertyId]: _, ...rest } = localProperties;
    setLocalProperties(rest);
    onSave(rest);
  };
  
  return (
    <Sheet isOpen={isOpen} onClose={onClose} title="Properties">
      <div className="properties">
        {availableProperties.map(property => {
          const value = localProperties[property.id];
          return (
            <PropertyField
              key={property.id}
              property={property}
              value={value}
              onChange={(value) => handlePropertyChange(property.id, value)}
              onRemove={() => handleRemoveProperty(property.id)}
            />
          );
        })}
        
        <button onClick={() => {/* Show add property picker */}}>
          + Add Property
        </button>
      </div>
    </Sheet>
  );
}
```
 
### Property Field Component
```typescript
// src/components/editor/PropertyField.tsx

import { PropertyDefinition } from '@/types/properties';
import { Input } from '@/components/ui/Input';
import { DatePicker } from '@/components/ui/DatePicker';
import { Dropdown } from '@/components/ui/Dropdown';
import { TagInput } from '@/components/ui/TagInput';
import { WikiLinkInput } from './WikiLinkInput';

interface PropertyFieldProps {
  property: PropertyDefinition;
  value: any;
  onChange: (value: any) => void;
  onRemove: () => void;
}

export function PropertyField({ property, value, onChange, onRemove }: PropertyFieldProps) {
  const renderInput = () => {
    switch (property.type) {
      case 'text':
        return <Input value={value || ''} onChange={(e) => onChange(e.target.value)} />;
      
      case 'number':
        return <Input type="number" value={value || 0} onChange={(e) => onChange(Number(e.target.value))} />;
      
      case 'date':
        return <DatePicker value={value} onChange={onChange} />;
      
      case 'checkbox':
        return <input type="checkbox" checked={value || false} onChange={(e) => onChange(e.target.checked)} />;
      
      case 'dropdown':
        return <Dropdown options={property.options || []} value={value} onChange={onChange} />;
      
      case 'tags':
        return <TagInput tags={value || []} onChange={onChange} />;
      
      case 'wikilink':
        return <WikiLinkInput noteId={value} onChange={onChange} />;
      
      case 'rating':
        return (
          <div className="rating">
            {[1,2,3,4,5].map(star => (
              <button
                key={star}
                onClick={() => onChange(star)}
                className={star <= (value || 0) ? 'active' : ''}
              >
                ⭐
              </button>
            ))}
          </div>
        );
      
      default:
        return null;
    }
  };
  
  return (
    <div className="property-field">
      <div className="property-field__header">
        <label>{property.name}</label>
        <button onClick={onRemove} className="property-field__remove">
          ×
        </button>
      </div>
      {renderInput()}
    </div>
  );
}
```

### Wiki-Links in Properties
Properties can contain wiki-links (links to other notes).
```
// src/components/editor/WikiLinkInput.tsx

import { useState, useEffect } from 'react';
import { useDatabase } from '@/hooks/useDatabase';
import { Autocomplete } from '@/components/ui/Autocomplete';

interface WikiLinkInputProps {
  noteId: string | null;
  onChange: (noteId: string) => void;
}

export function WikiLinkInput({ noteId, onChange }: WikiLinkInputProps) {
  const db = useDatabase();
  const [noteName, setNoteName] = useState('');
  const [suggestions, setSuggestions] = useState<Array<{ id: string; title: string }>>([]);
  
  // Load initial note name
  useEffect(() => {
    if (noteId && db) {
      db.notes.findOne(noteId).exec().then(note => {
        if (note) setNoteName(note.title);
      });
    }
  }, [noteId, db]);
  
  // Search for notes as user types
  const handleSearch = async (query: string) => {
    if (!db) return;
    
    const results = await db.notes
      .find({
        selector: {
          title: { $regex: new RegExp(query, 'i') },
          is_deleted: false,
        }
      })
      .limit(10)
      .exec();
    
    setSuggestions(results.map(note => ({
      id: note.id,
      title: note.title,
    })));
  };
  
  return (
    <Autocomplete
      value={noteName}
      onChange={setNoteName}
      onSearch={handleSearch}
      suggestions={suggestions}
      onSelect={(suggestion) => {
        setNoteName(suggestion.title);
        onChange(suggestion.id);
      }}
      placeholder="[[Link to note]]"
    />
  );
}
```

### **Add/Remove Properties Flow**
```
User taps "+ Add Property"
  ↓
Property Type Picker appears:
┌─────────────────────────────┐
│ ×  Add Property             │
├─────────────────────────────┤
│ Property Name               │
│ [Related Note         ]     │  ← Text input
│                             │
│ Property Type               │
│ ○ Text                      │
│ ○ Number                    │
│ ○ Date                      │
│ ● Wiki-link                 │  ← Selected
│ ○ Tags                      │
│ ○ Dropdown                  │
│                             │
│ [Add Property]              │
└─────────────────────────────┘
  ↓
User taps "Add Property"
  ↓
Property appears in Properties sheet
  ↓
User fills in value
  ↓
Auto-saves to note
```

**To remove:**
* Tap × next to property name
* Confirm deletion
* Property removed from this note only

# Wiki-Links System
### Overview
Wiki-links are double-bracketed links to other notes: [[Note Name]]
**Features:**
* Basic: [[Note Name]]
* With header: [[Note Name#Section]]
* With alias: [[Note Name|display text]]
* Combined: [[Note Name#Section|alias]]

⠀Wiki-Link Parsing
```
// src/lib/markdown/wikilinks.ts

export interface WikiLink {
  raw: string;              // Full [[...]] text
  target: string;           // Note name
  header?: string;          // Section name (if #header)
  alias?: string;           // Display text (if |alias)
  start: number;            // Character position in document
  end: number;
}

export function parseWikiLinks(text: string): WikiLink[] {
  const links: WikiLink[] = [];
  
  // Regex: [[target#header|alias]]
  // Groups: 1=target, 2=header, 3=alias
  const regex = /\\[\\[([^\\]#|]+)(?:#([^\\]|]+))?(?:\\|([^\\]]+))?\\]\\]/g;
  
  let match;
  while ((match = regex.exec(text)) !== null) {
    links.push({
      raw: match[0],
      target: match[1].trim(),
      header: match[2]?.trim(),
      alias: match[3]?.trim(),
      start: match.index,
      end: match.index + match[0].length,
    });
  }
  
  return links;
}

// Example usage:
parseWikiLinks('See [[React Hooks#useState|hooks guide]] for details')
// Returns:
[{
  raw: '[[React Hooks#useState|hooks guide]]',
  target: 'React Hooks',
  header: 'useState',
  alias: 'hooks guide',
  start: 4,
  end: 41,
}]
```

### Wiki-Link Auto-Complete
As user types `[[`, show autocomplete with note suggestions.
```typescript
// src/lib/editor/extensions/wikilink.ts

import { Completion, autocompletion } from '@codemirror/autocomplete';
import { EditorState } from '@codemirror/state';

export function wikiLinkAutocomplete(db: RxDatabase) {
  return autocompletion({
    override: [
      async (context) => {
        // Check if cursor is after [[
        const before = context.state.doc.sliceString(0, context.pos);
        const match = before.match(/\\[\\[([^\\]#|]*)$/);
        
        if (!match) return null;
        
        const query = match[1];
        
        // Search notes by title
        const notes = await db.notes
          .find({
            selector: {
              title: { $regex: new RegExp(query, 'i') },
              is_deleted: false,
            }
          })
          .limit(10)
          .exec();
        
        const options: Completion[] = notes.map(note => ({
          label: note.title,
          apply: note.title,
          type: 'text',
          info: note.content?.slice(0, 100) + '...',  // Preview
        }));
        
        return {
          from: context.pos - query.length,
          options,
        };
      }
    ],
  });
}

// If user selects note with sections, show section autocomplete
// After [[Note Name#
// Show list of headings in that note
```
### Wiki-Link Rendering
In instant-render mode, wiki-links should:
* Look like clickable links
* Show alias if present, otherwise target name
* Be clickable to open that note
```typescript
// In instant-render extension
// Detect [[...]] pattern
const wikiLinkRegex = /\\[\\[([^\\]]+)\\]\\]/g;

while ((match = wikiLinkRegex.exec(text)) !== null) {
  const start = match.index;
  const end = match.index + match[0].length;
  
  if (cursorPos < start || cursorPos > end) {
    // Parse the wiki-link
    const link = parseWikiLinks(match[0])[0];
    const displayText = link.alias || link.target;
    
    // Hide the [[ ]]
    decorations.push(
      Decoration.replace({}).range(start, start + 2)  // [[
    );
    decorations.push(
      Decoration.replace({}).range(end - 2, end)      // ]]
    );
    
    // Style as link
    decorations.push(
      Decoration.mark({
        class: 'cm-wikilink',
        attributes: {
          'data-note-id': link.target,  // For click handling
        }
      }).range(start + 2, end - 2)
    );
  }
}
```
⠀
**Click handling:**
```typescript
// In Editor component
EditorView.domEventHandlers({
  click: (event, view) => {
    const target = event.target as HTMLElement;
    
    if (target.classList.contains('cm-wikilink')) {
      const noteTitle = target.getAttribute('data-note-id');
      
      // Look up note by title
      db.notes.findOne({ selector: { title: noteTitle } }).exec()
        .then(note => {
          if (note) {
            // Navigate to note
            dispatch({ type: 'OPEN_NOTE', payload: { noteId: note.id } });
          } else {
            // Note doesn't exist - offer to create
            if (confirm(`Create note "${noteTitle}"?`)) {
              createNote(noteTitle);
            }
          }
        });
      
      return true;  // Handled
    }
  }
})
```

### Backlinks Panel
Show notes that link TO the current note.
```typescript
// Query all notes that contain [[Current Note Title]]
const backlinks = await db.notes
  .find({
    selector: {
      content: { $regex: new RegExp(`\\\\[\\\\[${currentNote.title}`, 'i') },
      is_deleted: false,
    }
  })
  .exec();

// Display in panel
<div className="backlinks">
  <h3>Linked References ({backlinks.length})</h3>
  {backlinks.map(note => (
    <div key={note.id} className="backlink">
      <a onClick={() => openNote(note.id)}>{note.title}</a>
      <p>{/* Show context snippet around the link */}</p>
    </div>
  ))}
</div>
```

### Unlinked Mentions
Show notes that mention current note's title but DON'T have wiki-link.
```typescript
// Search for title as plain text (not in [[]])
const mentions = await db.notes
  .find({
    selector: {
      content: { $regex: new RegExp(currentNote.title, 'i') },
      is_deleted: false,
    }
  })
  .exec();

// Filter out ones that already have [[title]]
const unlinked = mentions.filter(note => {
  const hasWikiLink = note.content?.includes(`[[${currentNote.title}]]`);
  return !hasWikiLink;
});
```

### Wiki-Links Database
Track links for graph view and backlinks.
```sql
-- Created automatically on note save
CREATE TABLE note_links (
  id UUID PRIMARY KEY,
  source_note_id UUID,      -- Note containing the link
  target_note_id UUID,      -- Note being linked to (or NULL if doesn't exist)
  target_title TEXT,        -- Note title (to handle non-existent notes)
  link_text TEXT,           -- Display text (alias if present)
  link_header TEXT,         -- Section/header if specified
  link_type TEXT,           -- 'content' or 'property'
  property_name TEXT,       -- If in property, which one
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

**Update links on save:**
```typescript
// After saving note content
async function updateNoteLinks(noteId: string, content: string, properties: Record<string, any>) {
  // Delete existing links from this note
  await db.note_links.find({ selector: { source_note_id: noteId } }).remove();
  
  // Parse content for wiki-links
  const contentLinks = parseWikiLinks(content);
  
  for (const link of contentLinks) {
    // Look up target note
    const targetNote = await db.notes.findOne({
      selector: { title: link.target }
    }).exec();
    
    await db.note_links.insert({
      id: uuidv4(),
      source_note_id: noteId,
      target_note_id: targetNote?.id || null,
      target_title: link.target,
      link_text: link.alias || link.target,
      link_header: link.header || null,
      link_type: 'content',
      property_name: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }
  
  // Parse properties for wiki-links
  for (const [propName, propValue] of Object.entries(properties)) {
    if (typeof propValue === 'string' && propValue.startsWith('note:')) {
      // This is a note reference
      const targetNoteId = propValue.replace('note:', '');
      
      await db.note_links.insert({
        id: uuidv4(),
        source_note_id: noteId,
        target_note_id: targetNoteId,
        target_title: '', // Look up if needed
        link_text: '',
        link_header: null,
        link_type: 'property',
        property_name: propName,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }
  }
}
```

## Templates System
### Overview
Templates are pre-formatted notes with variables that get replaced on insert.
**Example template:**
```markdown
---
type: meeting
date: {{date}}
---

# Meeting: {{title}}

**Date:** {{date:MMM DD, YYYY}}
**Attendees:** 

## Agenda
1. {{cursor}}

## Notes
-

## Action Items
- [ ] 

## Follow-up
[[Next Meeting]]
```

### Template Variables
```typescript
// src/lib/markdown/templates.ts

export const TEMPLATE_VARIABLES = {
  // Date/time
  '{{date}}': () => new Date().toISOString().split('T')[0],  // 2026-02-05
  '{{date:YYYY-MM-DD}}': () => new Date().toISOString().split('T')[0],
  '{{date:MMM DD, YYYY}}': () => {
    const d = new Date();
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  },
  '{{time}}': () => new Date().toTimeString().slice(0, 5),  // 14:30
  '{{datetime}}': () => new Date().toISOString(),
  '{{day_of_week}}': () => new Date().toLocaleDateString('en-US', { weekday: 'long' }),
  
  // Prompts (ask user for input)
  '{{title}}': () => prompt('Note title:') || 'Untitled',
  
  // Cursor position (where to place cursor after insert)
  '{{cursor}}': () => '___CURSOR___',  // Special marker, replaced with cursor position
};

export function replaceTemplateVariables(template: string): { content: string; cursorPosition: number | null } {
  let content = template;
  let cursorPosition: number | null = null;
  
  // Replace all variables
  for (const [variable, replacer] of Object.entries(TEMPLATE_VARIABLES)) {
    if (content.includes(variable)) {
      const replacement = replacer();
      content = content.replace(new RegExp(variable.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), replacement);
    }
  }
  
  // Find cursor position
  if (content.includes('___CURSOR___')) {
    cursorPosition = content.indexOf('___CURSOR___');
    content = content.replace('___CURSOR___', '');
  }
  
  return { content, cursorPosition };
}
```

### Template Storage
Templates are just notes tagged with #template.
```typescript
// Create template
await db.notes.insert({
  id: uuidv4(),
  title: 'Meeting Notes Template',
  content: meetingTemplateContent,
  properties: {
    tags: ['template'],
    category: 'work',
  },
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  is_deleted: false,
});

// Query templates
const templates = await db.notes
  .find({
    selector: {
      'properties.tags': { $in: ['template'] },
      is_deleted: false,
    }
  })
  .exec();
```

### Template Picker UI
```typescript
// src/components/editor/TemplatesPicker.tsx

export function TemplatesPicker({ isOpen, onClose, onSelect }: TemplatesPickerProps) {
  const [templates, setTemplates] = useState<Note[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  useEffect(() => {
    loadTemplates();
  }, []);
  
  const loadTemplates = async () => {
    const results = await db.notes
      .find({
        selector: {
          'properties.tags': { $in: ['template'] },
          is_deleted: false,
        }
      })
      .exec();
    setTemplates(results);
  };
  
  const filteredTemplates = templates.filter(t =>
    t.title.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const groupedTemplates = groupBy(filteredTemplates, t => t.properties?.category || 'other');
  
  return (
    <Sheet isOpen={isOpen} onClose={onClose} title="Templates">
      <input
        type="search"
        placeholder="Search templates..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />
      
      {Object.entries(groupedTemplates).map(([category, templates]) => (
        <div key={category} className="template-category">
          <h3>{category.toUpperCase()}</h3>
          {templates.map(template => (
            <button
              key={template.id}
              onClick={() => onSelect(template)}
              className="template-item"
            >
              <span className="template-item__title">{template.title}</span>
              <span className="template-item__preview">
                {template.content?.slice(0, 100)}...
              </span>
            </button>
          ))}
        </div>
      ))}
      
      <button onClick={() => {/* Create new template */}}>
        + Create Template
      </button>
    </Sheet>
  );
}
```

### Insert Template
```typescript
// In Editor component
const handleInsertTemplate = async (template: Note) => {
  // Replace variables
  const { content, cursorPosition } = replaceTemplateVariables(template.content);
  
  // Get current editor content
  const currentContent = editorView.state.doc.toString();
  
  // Insert at cursor or append
  const pos = editorView.state.selection.main.head;
  editorView.dispatch({
    changes: { from: pos, insert: content }
  });
  
  // Move cursor to {{cursor}} position if specified
  if (cursorPosition !== null) {
    editorView.dispatch({
      selection: { anchor: pos + cursorPosition }
    });
  }
  
  // Close template picker
  closeTemplatesPicker();
};
```

### Pre-Built Templates
Create these templates on first app launch:
**Daily Note:**
```markdown
---
date: {{date}}
day: {{day_of_week}}
---

# {{date:MMM DD, YYYY}}

## Tasks for Today
- [ ] {{cursor}}

## Notes
-

## Reflection
**What went well:**

**What to improve:**

**Grateful for:**
```

**Meeting Notes:**
```markdown
---
type: meeting
date: {{date}}
---

# Meeting: {{title}}

**Date:** {{date:MMM DD, YYYY}}
**Time:** {{time}}
**Attendees:** 

## Agenda
1. {{cursor}}

## Discussion
-

## Decisions
-

## Action Items
- [ ] 

## Next Steps
[[Follow-up Meeting]]
```

**Book Notes:**
```markdown
---
type: book
author: 
status: reading
rating: 
started: {{date}}
---

# 📚 {{title}}

**Author:** 
**Status:** Reading
**Started:** {{date:MMM DD, YYYY}}

## Summary
{{cursor}}

## Key Takeaways
1. 

## Quotes
> 

## My Thoughts


## Related
- [[]]
```

**Project Brief:**
```markdown
---
type: project
status: planning
---

# Project: {{title}}

**Created:** {{date:MMM DD, YYYY}}
**Status:** Planning

## Objective
{{cursor}}

## Success Criteria
- 

## Timeline
- Start: 
- End: 

## Resources
-

## Risks
-

## Next Actions
- [ ]
```

# Focus & Writing Modes
### Typewriter Mode
**Goal:** Keep cursor vertically centered as you type (text scrolls up, cursor stays in place).
```typescript
// src/lib/editor/extensions/typewriter.ts

import { EditorView, ViewPlugin } from '@codemirror/view';

export const typewriterMode = ViewPlugin.fromClass(
  class {
    update(update: ViewUpdate) {
      if (!update.docChanged && !update.selectionSet) return;
      
      const view = update.view;
      const cursorCoords = view.coordsAtPos(view.state.selection.main.head);
      
      if (!cursorCoords) return;
      
      // Calculate center of viewport
      const centerY = view.scrollDOM.clientHeight / 2;
      
      // Calculate scroll offset needed to center cursor
      const scrollTop = cursorCoords.top - view.scrollDOM.getBoundingClientRect().top - centerY;
      
      // Smooth scroll to center
      view.scrollDOM.scrollTo({
        top: scrollTop,
        behavior: 'smooth',
      });
    }
  }
);

// Enable in editor
const extensions = [
  // ... other extensions
  typewriterMode,
];
```

**Also enable** `scrollPastEnd` **to allow scrolling past end of document:**
```typescript
import { EditorView } from '@codemirror/view';

EditorView.theme({
  '&': {
    // Allow scrolling 50% of viewport past end
    'padding-bottom': '50vh',
  }
})
```

### Focus Mode
**Goal:** Dim everything except current sentence/paragraph/line.
**Three levels:**
1 Sentence focus
2 Paragraph focus
3 Line focus
```typescript
// src/lib/editor/extensions/focus.ts

import { Decoration, DecorationSet, EditorView, ViewPlugin } from '@codemirror/view';
import { Range } from '@codemirror/state';

type FocusLevel = 'sentence' | 'paragraph' | 'line';

export function focusMode(level: FocusLevel, intensity: number = 0.3) {
  return ViewPlugin.fromClass(
    class {
      decorations: DecorationSet;
      
      constructor(view: EditorView) {
        this.decorations = this.buildDecorations(view);
      }
      
      update(update: ViewUpdate) {
        if (update.docChanged || update.selectionSet) {
          this.decorations = this.buildDecorations(update.view);
        }
      }
      
      buildDecorations(view: EditorView): DecorationSet {
        const decorations: Range<Decoration>[] = [];
        const doc = view.state.doc;
        const cursorPos = view.state.selection.main.head;
        
        // Find active range based on focus level
        const activeRange = this.findActiveRange(doc, cursorPos, level);
        
        if (!activeRange) return Decoration.none;
        
        // Dim everything before active range
        if (activeRange.from > 0) {
          decorations.push(
            Decoration.mark({
              class: 'cm-dimmed',
              attributes: { style: `opacity: ${intensity}` }
            }).range(0, activeRange.from)
          );
        }
        
        // Dim everything after active range
        if (activeRange.to < doc.length) {
          decorations.push(
            Decoration.mark({
              class: 'cm-dimmed',
              attributes: { style: `opacity: ${intensity}` }
            }).range(activeRange.to, doc.length)
          );
        }
        
        return Decoration.set(decorations);
      }
      
      findActiveRange(doc: Text, pos: number, level: FocusLevel): { from: number; to: number } | null {
        const text = doc.toString();
        
        switch (level) {
          case 'line':
            // Find current line
            const line = doc.lineAt(pos);
            return { from: line.from, to: line.to };
          
          case 'sentence':
            // Find sentence boundaries (. ! ?)
            // Look backwards for sentence start
            let sentenceStart = pos;
            while (sentenceStart > 0) {
              const char = text[sentenceStart - 1];
              if (char === '.' || char === '!' || char === '?') {
                break;
              }
              sentenceStart--;
            }
            
            // Look forwards for sentence end
            let sentenceEnd = pos;
            while (sentenceEnd < text.length) {
              const char = text[sentenceEnd];
              if (char === '.' || char === '!' || char === '?') {
                sentenceEnd++;
                break;
              }
              sentenceEnd++;
            }
            
            return { from: sentenceStart, to: sentenceEnd };
          
          case 'paragraph':
            // Find paragraph boundaries (empty lines)
            let paraStart = pos;
            while (paraStart > 0) {
              const line = doc.lineAt(paraStart);
              if (line.text.trim() === '') break;
              paraStart = line.from - 1;
            }
            
            let paraEnd = pos;
            while (paraEnd < doc.length) {
              const line = doc.lineAt(paraEnd);
              if (line.text.trim() === '') break;
              paraEnd = line.to + 1;
            }
            
            return { from: paraStart, to: paraEnd };
          
          default:
            return null;
        }
      }
    },
    {
      decorations: v => v.decorations
    }
  );
}
```
⠀
**CSS for dimmed text:**
```css
.cm-dimmed {
  opacity: 0.3;
  transition: opacity 0.3s ease;
}

/* Optional: Add blur for stronger effect */
.cm-dimmed--blur {
  filter: blur(2px);
}
```

### Combined Mode: Typewriter + Focus
Enable both extensions together for ultimate distraction-free writing:
```typescript
const extensions = [
  markdown(),
  typewriterMode,
  focusMode('sentence', 0.2),  // Very dimmed
  // ... other extensions
];
```

### Focus Settings UI
```typescript
// src/components/editor/FocusSettings.tsx

export function FocusSettings() {
  const [mode, setMode] = useState<'normal' | 'typewriter' | 'focus' | 'both'>('normal');
  const [focusLevel, setFocusLevel] = useState<'sentence' | 'paragraph' | 'line'>('sentence');
  const [focusIntensity, setFocusIntensity] = useState(0.3);
  
  return (
    <Sheet title="Writing Mode">
      <div className="focus-settings">
        <h3>Writing Mode</h3>
        <div className="radio-group">
          <label>
            <input
              type="radio"
              checked={mode === 'normal'}
              onChange={() => setMode('normal')}
            />
            Normal
          </label>
          <label>
            <input
              type="radio"
              checked={mode === 'typewriter'}
              onChange={() => setMode('typewriter')}
            />
            Typewriter
          </label>
          <label>
            <input
              type="radio"
              checked={mode === 'focus'}
              onChange={() => setMode('focus')}
            />
            Focus
          </label>
          <label>
            <input
              type="radio"
              checked={mode === 'both'}
              onChange={() => setMode('both')}
            />
            Typewriter + Focus
          </label>
        </div>
        
        {(mode === 'focus' || mode === 'both') && (
          <>
            <h3>Focus Level</h3>
            <div className="radio-group">
              <label>
                <input
                  type="radio"
                  checked={focusLevel === 'sentence'}
                  onChange={() => setFocusLevel('sentence')}
                />
                Sentence
              </label>
              <label>
                <input
                  type="radio"
                  checked={focusLevel === 'paragraph'}
                  onChange={() => setFocusLevel('paragraph')}
                />
                Paragraph
              </label>
              <label>
                <input
                  type="radio"
                  checked={focusLevel === 'line'}
                  onChange={() => setFocusLevel('line')}
                />
                Line
              </label>
            </div>
            
            <h3>Focus Intensity</h3>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={focusIntensity}
              onChange={(e) => setFocusIntensity(parseFloat(e.target.value))}
            />
            <span>{Math.round(focusIntensity * 100)}% dimmed</span>
          </>
        )}
      </div>
    </Sheet>
  );
}
```

### Keyboard Shortcuts
```typescript
// src/components/editor/FocusSettings.tsx

export function FocusSettings() {
  const [mode, setMode] = useState<'normal' | 'typewriter' | 'focus' | 'both'>('normal');
  const [focusLevel, setFocusLevel] = useState<'sentence' | 'paragraph' | 'line'>('sentence');
  const [focusIntensity, setFocusIntensity] = useState(0.3);
  
  return (
    <Sheet title="Writing Mode">
      <div className="focus-settings">
        <h3>Writing Mode</h3>
        <div className="radio-group">
          <label>
            <input
              type="radio"
              checked={mode === 'normal'}
              onChange={() => setMode('normal')}
            />
            Normal
          </label>
          <label>
            <input
              type="radio"
              checked={mode === 'typewriter'}
              onChange={() => setMode('typewriter')}
            />
            Typewriter
          </label>
          <label>
            <input
              type="radio"
              checked={mode === 'focus'}
              onChange={() => setMode('focus')}
            />
            Focus
          </label>
          <label>
            <input
              type="radio"
              checked={mode === 'both'}
              onChange={() => setMode('both')}
            />
            Typewriter + Focus
          </label>
        </div>
        
        {(mode === 'focus' || mode === 'both') && (
          <>
            <h3>Focus Level</h3>
            <div className="radio-group">
              <label>
                <input
                  type="radio"
                  checked={focusLevel === 'sentence'}
                  onChange={() => setFocusLevel('sentence')}
                />
                Sentence
              </label>
              <label>
                <input
                  type="radio"
                  checked={focusLevel === 'paragraph'}
                  onChange={() => setFocusLevel('paragraph')}
                />
                Paragraph
              </label>
              <label>
                <input
                  type="radio"
                  checked={focusLevel === 'line'}
                  onChange={() => setFocusLevel('line')}
                />
                Line
              </label>
            </div>
            
            <h3>Focus Intensity</h3>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={focusIntensity}
              onChange={(e) => setFocusIntensity(parseFloat(e.target.value))}
            />
            <span>{Math.round(focusIntensity * 100)}% dimmed</span>
          </>
        )}
      </div>
    </Sheet>
  );
}
```

# Version History
### Overview
Automatically save versions of notes for undo/compare/restore.
**Triggers:**
* Manual save (Cmd+S)
* Auto-save every 30 minutes (if modified)
* Before major edits (detected by large content changes)
* On property changes

⠀Database Schema
```sql
CREATE TABLE note_versions (
  id UUID PRIMARY KEY,
  note_id UUID REFERENCES notes(id),
  content TEXT,
  properties JSONB,
  version_number INTEGER,
  created_at TIMESTAMPTZ,
  created_by TEXT,           -- "auto" or "manual"
  change_summary TEXT,        -- Optional description
  is_deleted BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_note_versions_note_id ON note_versions(note_id);
CREATE INDEX idx_note_versions_created_at ON note_versions(created_at DESC);
```

CREATE INDEX idx_note_versions_note_id ON note_versions(note_id);
CREATE INDEX idx_note_versions_created_at ON note_versions(created_at DESC);
### Save Version
```typescript
// src/lib/versions.ts

export async function saveVersion(
  noteId: string,
  content: string,
  properties: Record<string, any>,
  createdBy: 'auto' | 'manual',
  changeSummary?: string
) {
  const db = await getDatabase();
  
  // Get current version number
  const versions = await db.note_versions
    .find({ selector: { note_id: noteId } })
    .sort({ version_number: -1 })
    .limit(1)
    .exec();
  
  const versionNumber = versions.length > 0 ? versions[0].version_number + 1 : 1;
  
  await db.note_versions.insert({
    id: uuidv4(),
    note_id: noteId,
    content,
    properties,
    version_number: versionNumber,
    created_at: new Date().toISOString(),
    created_by: createdBy,
    change_summary: changeSummary || null,
    is_deleted: false,
  });
}

// Auto-save version every 30 minutes
let lastVersionSave = Date.now();

function shouldAutoSaveVersion(): boolean {
  const now = Date.now();
  const thirtyMinutes = 30 * 60 * 1000;
  
  if (now - lastVersionSave > thirtyMinutes) {
    lastVersionSave = now;
    return true;
  }
  
  return false;
}

// In editor auto-save logic
if (shouldAutoSaveVersion()) {
  await saveVersion(noteId, content, properties, 'auto');
}
```

### Version History UI
```typescript
// src/components/editor/VersionHistory.tsx

export function VersionHistory({ noteId }: { noteId: string }) {
  const [versions, setVersions] = useState<NoteVersion[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<NoteVersion | null>(null);
  
  useEffect(() => {
    loadVersions();
  }, [noteId]);
  
  const loadVersions = async () => {
    const results = await db.note_versions
      .find({
        selector: { note_id: noteId },
        sort: [{ created_at: 'desc' }],
      })
      .exec();
    
    setVersions(results);
  };
  
  return (
    <Sheet title="Version History">
      <div className="version-history">
        {/* Current (unsaved) */}
        <div className="version-item version-item--current">
          <span className="version-item__indicator">●</span>
          <div className="version-item__content">
            <strong>Current</strong>
            <span className="version-item__time">Unsaved changes</span>
          </div>
        </div>
        
        {/* Past versions */}
        {versions.map(version => (
          <div
            key={version.id}
            className="version-item"
            onClick={() => setSelectedVersion(version)}
          >
            <span className="version-item__indicator">○</span>
            <div className="version-item__content">
              <strong>v{version.version_number}</strong>
              {version.created_by === 'manual' && <span className="badge">Manual Save</span>}
              {version.change_summary && <p>{version.change_summary}</p>}
              <span className="version-item__time">
                {formatRelativeTime(version.created_at)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </Sheet>
  );
}
```

### Version Preview & Restore
```typescript
// When user taps a version
<Sheet title={`Version ${version.version_number}`}>
  <div className="version-preview">
    {/* Show content */}
    <div className="version-preview__content">
      <ReactMarkdown>{version.content}</ReactMarkdown>
    </div>
    
    {/* Actions */}
    <div className="version-preview__actions">
      <button onClick={() => compareVersions(currentContent, version.content)}>
        Compare with Current
      </button>
      <button onClick={() => restoreVersion(version)}>
        Restore This Version
      </button>
    </div>
  </div>
</Sheet>
```

### Restore Version
```typescript
async function restoreVersion(version: NoteVersion) {
  const confirmed = confirm(
    `Restore to version ${version.version_number}? ` +
    `Current content will be saved as a new version.`
  );
  
  if (!confirmed) return;
  
  // Save current state as new version
  const currentNote = await db.notes.findOne(version.note_id).exec();
  await saveVersion(
    version.note_id,
    currentNote.content,
    currentNote.properties,
    'auto',
    'Before restore'
  );
  
  // Update note with version content
  await db.notes.findOne(version.note_id).update({
    $set: {
      content: version.content,
      properties: version.properties,
      updated_at: new Date().toISOString(),
    }
  });
  
  // Reload editor
  reloadEditor();
}
```

### Compare Versions (Diff View)
Use a diff library to show changes:
```bash
npm install diff
npm install @types/diff
```

```typescript
import * as Diff from 'diff';

function compareVersions(current: string, previous: string) {
  const diff = Diff.diffWords(previous, current);
  
  return (
    <div className="diff-view">
      <div className="diff-view__column">
        <h3>Version {previousVersion}</h3>
        <pre>
          {diff.map((part, i) => (
            <span
              key={i}
              className={
                part.added ? 'diff-added' :
                part.removed ? 'diff-removed' : ''
              }
            >
              {part.value}
            </span>
          ))}
        </pre>
      </div>
      
      <div className="diff-view__column">
        <h3>Current</h3>
        <pre>{current}</pre>
      </div>
    </div>
  );
}
```

**CSS:**
```css
.diff-added {
  background: rgba(0, 255, 0, 0.2);
  color: green;
}

.diff-removed {
  background: rgba(255, 0, 0, 0.2);
  color: red;
  text-decoration: line-through;
}
```

## Extended Markdown
### Callouts (Obsidian-Style)
Syntax:
```markdown
> [!note]
> This is a note callout

> [!tip] Custom Title
> This is a tip

> [!warning]
> Be careful

> [!danger]
> Critical
```

**Callout Types:**
* `note` (blue) - General information
* `tip` (green) - Helpful suggestions
* `warning` (yellow) - Cautions
* `danger` (red) - Critical warnings
* `info` (blue) - Informational
* `success` (green) - Success messages
* `question` (purple) - Questions
* `quote` (gray) - Quotations

⠀**Rendering:**
```typescript
// src/lib/editor/extensions/callouts.ts

import { syntaxTree } from '@codemirror/language';
import { Decoration, DecorationSet, EditorView, ViewPlugin } from '@codemirror/view';

export const calloutsExtension = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;
    
    constructor(view: EditorView) {
      this.decorations = this.buildDecorations(view);
    }
    
    update(update: ViewUpdate) {
      if (update.docChanged || update.viewportChanged) {
        this.decorations = this.buildDecorations(update.view);
      }
    }
    
    buildDecorations(view: EditorView): DecorationSet {
      const decorations: Range<Decoration>[] = [];
      const doc = view.state.doc;
      
      // Find callout syntax: > [!type] or > [!type] Title
      const text = doc.toString();
      const lines = text.split('\n');
      
      let inCallout = false;
      let calloutType = '';
      let calloutTitle = '';
      let calloutStart = 0;
      let calloutEnd = 0;
      
      lines.forEach((line, i) => {
        const lineStart = doc.line(i + 1).from;
        const lineEnd = doc.line(i + 1).to;
        
        // Check for callout start
        const match = line.match(/^>\s*\[!(\w+)\](.*)$/);
        if (match && !inCallout) {
          inCallout = true;
          calloutType = match[1].toLowerCase();
          calloutTitle = match[2].trim() || calloutType;
          calloutStart = lineStart;
        }
        
        // Check for callout end (line not starting with >)
        if (inCallout && !line.startsWith('>')) {
          inCallout = false;
          calloutEnd = lineStart;
          
          // Apply decoration to entire callout
          decorations.push(
            Decoration.mark({
              class: `cm-callout cm-callout--${calloutType}`,
              attributes: {
                'data-callout-type': calloutType,
                'data-callout-title': calloutTitle,
              }
            }).range(calloutStart, calloutEnd)
          );
        }
      });
      
      return Decoration.set(decorations);
    }
  },
  {
    decorations: v => v.decorations
  }
);
```

**CSS:**
```css
/* Base callout styles */
.cm-callout {
  display: block;
  padding: 12px 16px;
  margin: 16px 0;
  border-left: 4px solid;
  border-radius: 4px;
  background: var(--callout-bg);
}

.cm-callout::before {
  content: attr(data-callout-title);
  display: block;
  font-weight: 600;
  margin-bottom: 8px;
  text-transform: uppercase;
  font-size: 0.9em;
}

/* Type-specific styles */
.cm-callout--note {
  border-color: #3b82f6;
  background: rgba(59, 130, 246, 0.1);
  color: #1e40af;
}

.cm-callout--tip {
  border-color: #10b981;
  background: rgba(16, 185, 129, 0.1);
  color: #065f46;
}

.cm-callout--warning {
  border-color: #f59e0b;
  background: rgba(245, 158, 11, 0.1);
  color: #92400e;
}

.cm-callout--danger {
  border-color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
  color: #991b1b;
}

.cm-callout--success {
  border-color: #22c55e;
  background: rgba(34, 197, 94, 0.1);
  color: #166534;
}

.cm-callout--question {
  border-color: #a855f7;
  background: rgba(168, 85, 247, 0.1);
  color: #6b21a8;
}

/* Icons (using emoji or icon font) */
.cm-callout--note::before { content: "💡 " attr(data-callout-title); }
.cm-callout--tip::before { content: "✨ " attr(data-callout-title); }
.cm-callout--warning::before { content: "⚠️ " attr(data-callout-title); }
.cm-callout--danger::before { content: "🚨 " attr(data-callout-title); }
.cm-callout--success::before { content: "✅ " attr(data-callout-title); }
.cm-callout--question::before { content: "❓ " attr(data-callout-title); }
```

### Custom Checkboxes
Syntax:
```markdown
- [ ] Regular checkbox
- [x] Completed
- [>] Forwarded/Scheduled
- [<] Cancelled
- [!] Important
- [?] Question
- [/] In progress
- [-] Irrelevant
```

**Rendering:**
```typescript
// In instant-render extension, detect checkbox variants
const checkboxRegex = /- \[(.)\]/g;

const checkboxIcons: Record<string, string> = {
  ' ': '☐',  // Empty
  'x': '☑',  // Checked
  '>': '→',  // Forwarded
  '<': '✖',  // Cancelled
  '!': '❗', // Important
  '?': '❓', // Question
  '/': '◐',  // In progress
  '-': '⊘',  // Irrelevant
};

// Apply decorations with appropriate icon
decorations.push(
  Decoration.replace({
    widget: new CheckboxWidget(checkboxIcons[match[1]])
  }).range(start, end)
);
```

**CSS:**
```css
.cm-checkbox { cursor: pointer; user-select: none; }
.cm-checkbox--checked { color: var(--color-success); }
.cm-checkbox--forwarded { color: var(--color-info); }
.cm-checkbox--cancelled { color: var(--color-danger); text-decoration: line-through; }
.cm-checkbox--important { color: var(--color-warning); font-weight: bold; }
.cm-checkbox--question { color: var(--color-info); }
.cm-checkbox--progress { color: var(--color-warning); }
.cm-checkbox--irrelevant { color: var(--color-text-tertiary); opacity: 0.5; }
```

**Interactive clicking:**
```typescript
// Click handler to cycle through states
EditorView.domEventHandlers({
  click(event, view) {
    const target = event.target as HTMLElement;
    if (target.classList.contains('cm-checkbox')) {
      const pos = view.posAtDOM(target);
      const line = view.state.doc.lineAt(pos);
      const text = line.text;
      
      // Find checkbox character
      const match = text.match(/- \[(.)\]/);
      if (!match) return;
      
      const current = match[1];
      const states = [' ', 'x', '>', '<', '!', '?', '/', '-'];
      const currentIndex = states.indexOf(current);
      const nextIndex = (currentIndex + 1) % states.length;
      const next = states[nextIndex];
      
      // Replace checkbox state
      const newText = text.replace(/- \[.\]/, `- [${next}]`);
      
      view.dispatch({
        changes: { from: line.from, to: line.to, insert: newText }
      });
      
      return true;
    }
  }
})
```

### Footnotes
Syntax:
```markdown
This is text with a footnote.[^1]

Another footnote.[^note]

[^1]: This is the footnote content.
[^note]: This is a named footnote.
```

**Parsing:**
```typescript
// Parse footnotes from document
function parseFootnotes(text: string): Map<string, string> {
  const footnotes = new Map();
  
  // Find footnote definitions: [^id]: content
  const regex = /^\[\^(.+?)\]:\s*(.+)$/gm;
  let match;
  
  while ((match = regex.exec(text)) !== null) {
    footnotes.set(match[1], match[2]);
  }
  
  return footnotes;
}

// Render footnote references with superscript numbers
const footnoteRefRegex = /\[\^(.+?)\]/g;

while ((match = footnoteRefRegex.exec(text)) !== null) {
  const id = match[1];
  const footnote = footnotes.get(id);
  
  if (footnote) {
    // Render as superscript link
    decorations.push(
      Decoration.replace({
        widget: new FootnoteWidget(id)
      }).range(start, end)
    );
  }
}
```

**Footnotes section at bottom:**
```typescript
// Render footnotes at bottom of document
function renderFootnotesSection(footnotes: Map<string, string>): string {
  if (footnotes.size === 0) return '';
  
  let html = '\n\n---\n\n## Footnotes\n\n';
  
  let index = 1;
  for (const [id, content] of footnotes) {
    html += `${index}. ${content}\n`;
    index++;
  }
  
  return html;
}
```

### Other Extended Markdown
```markdown
~~Strikethrough~~      → <s>Strikethrough</s>
==Highlight==          → <mark>Highlight</mark>
H~2~O                  → H<sub>2</sub>O
X^2^                   → X<sup>2</sup>
:smile:                → 😊 (emoji)
++Inserted++           → <ins>Inserted</ins>
```
Use similar decoration patterns to render these.

# Graph View
### Overview
Visual network of notes connected by wiki-links.
**Features:**
* Nodes = Notes
* Edges = Wiki-links
* Interactive (zoom, drag, click)
* Filter by tags/properties
* Show local graph (current note + connections)
* Show global graph (all notes)

⠀Data Structure
Query all notes and links:
```typescript
async function buildGraphData() {
  const notes = await db.notes.find({ selector: { is_deleted: false } }).exec();
  const links = await db.note_links.find().exec();
  
  // Build graph
  const nodes = notes.map(note => ({
    id: note.id,
    label: note.title,
    tags: note.properties?.tags || [],
    // Size by number of connections
    size: links.filter(l => l.source_note_id === note.id || l.target_note_id === note.id).length + 1,
  }));
  
  const edges = links.map(link => ({
    source: link.source_note_id,
    target: link.target_note_id,
  }));
  
  return { nodes, edges };
}
```

### Rendering with Force-Graph
```bash
npm install force-graph
```

### Local Graph
Show only current note and connected notes:
```typescript
// src/features/knowledge/GraphView.tsx
'use client';

import { useEffect, useRef } from 'react';
import ForceGraph2D from 'force-graph';

export function GraphView() {
  const graphRef = useRef<HTMLDivElement>(null);
  const [graphData, setGraphData] = useState<{ nodes: any[]; links: any[] }>({ nodes: [], links: [] });
  
  useEffect(() => {
    loadGraphData();
  }, []);
  
  const loadGraphData = async () => {
    const data = await buildGraphData();
    setGraphData(data);
  };
  
  useEffect(() => {
    if (!graphRef.current || !graphData.nodes.length) return;
    
    const graph = ForceGraph2D()(graphRef.current)
      .graphData(graphData)
      .nodeLabel('label')
      .nodeColor(node => {
        // Color by tags
        if (node.tags.includes('important')) return '#ef4444';
        if (node.tags.includes('work')) return '#3b82f6';
        return '#6b7280';
      })
      .nodeRelSize(4)
      .linkColor(() => '#d1d5db')
      .linkWidth(1)
      .onNodeClick(node => {
        // Open note
        dispatch({ type: 'OPEN_NOTE', payload: { noteId: node.id } });
      })
      .onNodeHover(node => {
        // Show tooltip
        if (node) {
          graphRef.current.style.cursor = 'pointer';
        } else {
          graphRef.current.style.cursor = 'default';
        }
      });
    
    return () => {
      // Cleanup
    };
  }, [graphData]);
  
  return (
    <div className="graph-view">
      <div className="graph-view__controls">
        <button onClick={() => {/* Filter by tag */}}>Filter</button>
        <button onClick={() => {/* Show local graph */}}>Local</button>
        <button onClick={() => {/* Show global graph */}}>Global</button>
      </div>
      <div ref={graphRef} className="graph-view__canvas" />
    </div>
  );
}
```

### Filters
```typescript
// Filter by tag
function filterGraphByTag(tag: string) {
  const filteredNodes = graphData.nodes.filter(node =>
    node.tags.includes(tag)
  );
  
  const filteredNodeIds = new Set(filteredNodes.map(n => n.id));
  
  const filteredEdges = graphData.edges.filter(edge =>
    filteredNodeIds.has(edge.source) && filteredNodeIds.has(edge.target)
  );
  
  return { nodes: filteredNodes, links: filteredEdges };
}

// Filter by property
function filterGraphByProperty(propertyName: string, propertyValue: any) {
  const filteredNodes = graphData.nodes.filter(node =>
    node.properties?.[propertyName] === propertyValue
  );
  
  // ... same as above
}
```

### Orphan Nodes
Show notes with no connections:
```typescript
const orphans = notes.filter(note => {
  const hasLinks = links.some(link =>
    link.source_note_id === note.id || link.target_note_id === note.id
  );
  return !hasLinks;
});

// Highlight orphans in different color
.nodeColor(node => {
  if (node.isOrphan) return '#94a3b8';  // Gray
  return '#3b82f6';  // Blue
})
```

### Performance
For large graphs (1000+ notes):
* Use canvas rendering (Force-Graph default)
* Implement virtualization (only render visible nodes)
* Use Web Workers for graph layout calculations
* Add pagination or lazy loading

## Database Schema
### Complete Schema
```sql
-- Notes
CREATE TABLE notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  content TEXT,
  properties JSONB DEFAULT '{}',
  template_id UUID REFERENCES templates(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_deleted BOOLEAN DEFAULT FALSE
);

-- Note versions
CREATE TABLE note_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  note_id UUID REFERENCES notes(id),
  content TEXT,
  properties JSONB,
  version_number INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT,           -- 'auto' or 'manual'
  change_summary TEXT,
  is_deleted BOOLEAN DEFAULT FALSE
);

-- Note links (wiki-links)
CREATE TABLE note_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_note_id UUID REFERENCES notes(id),
  target_note_id UUID REFERENCES notes(id),
  target_title TEXT,         -- For non-existent notes
  link_text TEXT,            -- Display text (alias)
  link_header TEXT,          -- Section/header if specified
  link_type TEXT,            -- 'content' or 'property'
  property_name TEXT,        -- If in property
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Templates
CREATE TABLE templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  content TEXT,
  category TEXT,             -- 'daily', 'work', 'learning', etc.
  variables JSONB,           -- List of variables
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_deleted BOOLEAN DEFAULT FALSE
);

-- Projects (for property linking)
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  status TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_deleted BOOLEAN DEFAULT FALSE
);

-- Tasks (for linking from notes)
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  project_id UUID REFERENCES projects(id),
  note_id UUID REFERENCES notes(id),  -- Link to related note
  due_date TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_deleted BOOLEAN DEFAULT FALSE
);

-- Habits (for linking from notes)
CREATE TABLE habits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_deleted BOOLEAN DEFAULT FALSE
);

-- Indexes
CREATE INDEX idx_notes_title ON notes(title);
CREATE INDEX idx_notes_properties ON notes USING GIN(properties);
CREATE INDEX idx_notes_updated_at ON notes(updated_at DESC);
CREATE INDEX idx_note_links_source ON note_links(source_note_id);
CREATE INDEX idx_note_links_target ON note_links(target_note_id);
CREATE INDEX idx_note_versions_note_id ON note_versions(note_id);
CREATE INDEX idx_templates_category ON templates(category);

-- Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_notes_updated_at BEFORE UPDATE ON notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_note_links_updated_at BEFORE UPDATE ON note_links
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_templates_updated_at BEFORE UPDATE ON templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### RxDB Schema
```typescript
// src/lib/db.ts

import { createRxDatabase, addRxPlugin } from 'rxdb';
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie';
import { RxDBDevModePlugin } from 'rxdb/plugins/dev-mode';
import { wrappedValidateZSchemaStorage } from 'rxdb/plugins/validate-z-schema';

if (process.env.NODE_ENV === 'development') {
  addRxPlugin(RxDBDevModePlugin);
}

const noteSchema = {
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 36 },
    title: { type: 'string' },
    content: { type: 'string' },
    properties: { type: 'object' },
    template_id: { type: ['string', 'null'] },
    created_at: { type: 'string', format: 'date-time' },
    updated_at: { type: 'string', format: 'date-time' },
    is_deleted: { type: 'boolean' },
  },
  required: ['id', 'title', 'created_at', 'updated_at', 'is_deleted'],
  indexes: ['updated_at', 'title'],
};

const noteVersionSchema = {
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 36 },
    note_id: { type: 'string' },
    content: { type: 'string' },
    properties: { type: 'object' },
    version_number: { type: 'number' },
    created_at: { type: 'string', format: 'date-time' },
    created_by: { type: 'string' },
    change_summary: { type: ['string', 'null'] },
    is_deleted: { type: 'boolean' },
  },
  required: ['id', 'note_id', 'version_number', 'created_at', 'created_by', 'is_deleted'],
  indexes: ['note_id', 'created_at'],
};

const noteLinkSchema = {
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 36 },
    source_note_id: { type: 'string' },
    target_note_id: { type: ['string', 'null'] },
    target_title: { type: 'string' },
    link_text: { type: 'string' },
    link_header: { type: ['string', 'null'] },
    link_type: { type: 'string' },
    property_name: { type: ['string', 'null'] },
    created_at: { type: 'string', format: 'date-time' },
    updated_at: { type: 'string', format: 'date-time' },
  },
  required: ['id', 'source_note_id', 'target_title', 'link_text', 'link_type', 'created_at', 'updated_at'],
  indexes: ['source_note_id', 'target_note_id'],
};

const templateSchema = {
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 36 },
    name: { type: 'string' },
    content: { type: 'string' },
    category: { type: ['string', 'null'] },
    variables: { type: 'object' },
    created_at: { type: 'string', format: 'date-time' },
    updated_at: { type: 'string', format: 'date-time' },
    is_deleted: { type: 'boolean' },
  },
  required: ['id', 'name', 'content', 'created_at', 'updated_at', 'is_deleted'],
  indexes: ['category'],
};

export async function getDatabase() {
  const db = await createRxDatabase({
    name: 'personalos',
    storage: wrappedValidateZSchemaStorage({ storage: getRxStorageDexie() }),
  });
  
  await db.addCollections({
    notes: { schema: noteSchema },
    note_versions: { schema: noteVersionSchema },
    note_links: { schema: noteLinkSchema },
    templates: { schema: templateSchema },
    // ... other collections
  });
  
  return db;
}
```

## Implementation Phases
### Phase 1: Foundation (Weeks 1-2)
* Set up Next.js 15 + TypeScript + strict mode
* Install dependencies (CodeMirror, RxDB, Supabase, Framer Motion, Radix UI)
* Create file structure
* Set up RxDB with basic schema
* Set up Supabase tables
* Implement basic sync (notes only)
* Create navigation shell (AppShell, Sheet, FAB)
* Create basic editor with CodeMirror
* Implement auto-save to RxDB
⠀**Deliverable:** Can create/edit notes, sync to Supabase, navigate via sheets

### Phase 2: Properties System (Weeks 3-4)
* Create properties sheet UI
* Implement property types (text, number, date, dropdown, tags)
* Add/remove properties per note
* Wiki-link property type
* Link to projects (dropdown)
* Save properties to JSONB column
* Sync properties to Supabase
⠀**Deliverable:** Can add structured metadata to notes

### Phase 3: Wiki-Links Basic (Weeks 5-6)
* Parse `[[Note Name]]` syntax
* Build wiki-link auto-complete
* Clickable wiki-links (open note)
* Create note from non-existent link
* Track links in note_links table
* Sync links to Supabase
⠀**Deliverable:** Can link between notes, auto-complete works

### Phase 4: Wiki-Links Enhanced (Weeks 7-8)
* Header links: `[[Note#Section]]`
* Aliases: `[[Note|display]]`
* Combined: `[[Note#Section|alias]]`
* Auto-complete for headers
* Backlinks panel (shows notes linking here)
* Unlinked mentions (text matches without links)
⠀**Deliverable:** Full wiki-link feature parity with Obsidian

### Phase 5: Templates (Weeks 9-10)
* Create templates table
* Template picker UI
* Template variable replacement
* Pre-built templates (Daily, Meeting, Book, Project)
* Create/edit/delete templates
* Insert template into note
* Cursor placement after insert
⠀**Deliverable:** Can use templates to quickly create formatted notes

### Phase 6: Instant Rendering (Weeks 11-12)
* Build instant-render CodeMirror extension
* Hide markdown syntax when not editing
* Show formatted text
* Reveal syntax on cursor position
* Support bold, italic, strikethrough, code, links
* Support headers, lists, block quotes
* Smooth transitions
⠀**Deliverable:** Editor feels like Bear (instant markdown rendering)

### Phase 7: Focus Modes (Weeks 13-14)
* Typewriter mode (cursor stays centered)
* Focus mode - Sentence
* Focus mode - Paragraph
* Focus mode - Line
* Focus intensity slider
* Combine typewriter + focus
* Keyboard shortcuts (Cmd+Shift+T, Cmd+Shift+F)
* Settings UI
⠀**Deliverable:** Distraction-free writing experience like IA Writer

### Phase 8: Version History (Weeks 15-16)
* Create note_versions table
* Auto-save versions (every 30 min)
* Manual save version (Cmd+S)
* Version history UI
* Preview version
* Restore version
* Compare versions (diff view)
⠀**Deliverable:** Can undo/restore/compare note versions

### Phase 9: Extended Markdown (Weeks 17-18)
* Callouts (`> [!note]`, `> [!warning]`, etc.)
* Custom checkbox states (`[x]`, `[>]`, `[!]`, etc.)
* Interactive checkbox clicking (cycle states)
* Footnotes (`[^1]`)
* Strikethrough, highlight, sub/superscript
* Emoji support
⠀**Deliverable:** Rich markdown features beyond standard

### Phase 10: Graph View (Weeks 19-20)
* Query notes + links for graph data
* Render graph with Force-Graph
* Interactive nodes (click, drag, zoom)
* Local graph (current note + connected)
* Global graph (all notes)
* Filter by tags/properties
* Show orphan notes
* Color coding by type/tag
⠀**Deliverable:** Visual knowledge graph like Obsidian

### Phase 11: Polish & Performance (Weeks 21-22)
* Optimize editor performance (large documents)
* Optimize graph rendering (large graphs)
* Add loading states
* Add error handling
* Improve mobile touch interactions
* Add haptic feedback
* Test on various devices
* Fix bugs
⠀**Deliverable:** Production-ready, polished experience

### Phase 12: PWA Configuration (Week 23)
* Add manifest.json
* Add service worker
* Add app icons
* Add splash screens
* Test install on iOS
* Test offline mode
* Configure caching strategy
⠀**Deliverable:** Installable PWA on iPhone

## Design Guidelines
### Typography
```css
:root {
  /* Font families */
  --font-sans: -apple-system, BlinkMacSystemFont, 'SF Pro Text', system-ui, sans-serif;
  --font-mono: 'SF Mono', 'Menlo', 'Monaco', 'Courier New', monospace;
  
  /* Font sizes */
  --text-xs: 12px;
  --text-sm: 14px;
  --text-base: 17px;    /* iOS standard */
  --text-lg: 20px;
  --text-xl: 24px;
  --text-2xl: 30px;
  --text-3xl: 36px;
  
  /* Line heights */
  --leading-tight: 1.2;
  --leading-normal: 1.6;
  --leading-relaxed: 1.8;
  
  /* Letter spacing */
  --tracking-tight: -0.02em;
  --tracking-normal: -0.01em;
  --tracking-wide: 0.01em;
}

body {
  font-family: var(--font-sans);
  font-size: var(--text-base);
  line-height: var(--leading-normal);
  letter-spacing: var(--tracking-normal);
}
```

### Colors
```css
:root {
  /* Light mode */
  --color-bg: #ffffff;
  --color-bg-secondary: #f5f5f7;
  --color-text: #1d1d1f;
  --color-text-secondary: #6e6e73;
  --color-text-tertiary: #86868b;
  --color-border: #d2d2d7;
  --color-link: #0071e3;
  --color-success: #34c759;
  --color-warning: #ff9500;
  --color-danger: #ff3b30;
}

@media (prefers-color-scheme: dark) {
  :root {
    --color-bg: #000000;
    --color-bg-secondary: #1c1c1e;
    --color-text: #f5f5f7;
    --color-text-secondary: #98989d;
    --color-text-tertiary: #636366;
    --color-border: #38383a;
    --color-link: #0a84ff;
    --color-success: #30d158;
    --color-warning: #ff9f0a;
    --color-danger: #ff453a;
  }
}
```

### Spacing
```css
:root {
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;
  --space-10: 40px;
  --space-12: 48px;
  --space-16: 64px;
}
```

### Animations
```css
:root {
  /* Durations */
  --duration-fast: 150ms;
  --duration-normal: 300ms;
  --duration-slow: 500ms;
  
  /* Easings */
  --ease-in: cubic-bezier(0.4, 0, 1, 1);
  --ease-out: cubic-bezier(0, 0, 0.2, 1);
  --ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
  --ease-spring: cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.sheet {
  transition: transform var(--duration-normal) var(--ease-out);
}

.fade-in {
  animation: fadeIn var(--duration-fast) var(--ease-out);
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
```

### Touch Targets
```css
/* Minimum touch target: 44px (iOS standard) */
button, a, input {
  min-height: 44px;
  min-width: 44px;
}

/* Padding for text-only buttons */
button {
  padding: var(--space-3) var(--space-4);
}
```

### Safe Area (iPhone Notch)
```css
body {
  /* Respect iPhone notch and home indicator */
  padding-top: env(safe-area-inset-top);
  padding-bottom: env(safe-area-inset-bottom);
  padding-left: env(safe-area-inset-left);
  padding-right: env(safe-area-inset-right);
}

.fab {
  /* Position FAB above home indicator */
  bottom: calc(var(--space-6) + env(safe-area-inset-bottom));
}
```

## Performance Requirements
### Critical Metrics
| **Metric** | **Target** | **Maximum** |
|:-:|:-:|:-:|
| First Contentful Paint | <1s | <2s |
| Time to Interactive | <2s | <3s |
| Editor input lag | <16ms (60fps) | <33ms (30fps) |
| Sheet open animation | 300ms smooth | 500ms acceptable |
| Auto-save debounce | 1s | 2s |
| Search results | <100ms | <300ms |
### Bundle Size
| **Asset** | **Target** | **Maximum** |
|:-:|:-:|:-:|
| Initial JS bundle | <150KB gzipped | <200KB |
| Initial CSS | <20KB gzipped | <30KB |
| Editor chunk (lazy) | <100KB gzipped | <150KB |
| Total assets | <300KB gzipped | <400KB |
### Database Performance
| **Operation** | **Target** | **Maximum** |
|:-:|:-:|:-:|
| Note save (RxDB) | <50ms | <100ms |
| Note load (RxDB) | <50ms | <100ms |
| Search (RxDB) | <100ms | <200ms |
| Sync to Supabase | Background | <5s |
### Optimization Strategies
**Code Splitting:**
```typescript
// Lazy load heavy components
const GraphView = dynamic(() => import('@/features/knowledge/GraphView'), {
  loading: () => <div>Loading graph...</div>,
});

const Editor = dynamic(() => import('@/components/editor/Editor'), {
  ssr: false,  // Don't render on server
});
```

**Debouncing:**
```typescript
// Debounce auto-save
const debouncedSave = useMemo(
  () => debounce((content: string) => saveNote(content), 1000),
  [noteId]
);
```

**Virtualization:**
```typescript
// For large lists (1000+ items)
import { FixedSizeList } from 'react-window';

<FixedSizeList
  height={600}
  itemCount={notes.length}
  itemSize={60}
>
  {({ index, style }) => (
    <NoteListItem note={notes[index]} style={style} />
  )}
</FixedSizeList>
```

**Image Optimization:**
```typescript
// Next.js Image component
import Image from 'next/image';

<Image
  src={note.coverImage}
  width={400}
  height={300}
  loading="lazy"
  placeholder="blur"
/>
```

## Testing Requirements
### Unit Tests
```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom
```

#### Test coverage:
* Wiki-link parsing
* Template variable replacement
* Markdown rendering
* Auto-save logic
* Version comparison

#### Integration Tests
* Note CRUD operations
* Sync to Supabase
* Navigation state management
* Editor interactions

#### E2E Tests
```bash
npm install -D playwright
```
* Create/edit/delete note
* Add properties to note
* Insert wiki-link with auto-complete
* Use template
* Switch between contexts
* Offline mode (disable network, verify functionality)

#### Manual Testing Checklist
**Editor:**
* Type text, see instant rendering
* Bold/italic/strikethrough work
* Wiki-links auto-complete
* Clicking wiki-link opens note
* Callouts render correctly
* Checkboxes are interactive
* Footnotes work
* Typewriter mode centers cursor
* Focus mode dims non-active text
* Raw mode shows markdown syntax

#### **Properties:**
* Open properties sheet
* Add property
* Edit property value
* Remove property
* Wiki-link in property works

#### **Templates:**
* Open template picker
* Select template
* Variables replaced correctly
* Cursor placed at {{cursor}}

#### **Version History:**
* Auto-save creates versions
* Manual save creates version
* Can preview version
* Can restore version
* Diff view shows changes

#### **Graph:**
* Graph renders
* Can click node to open note
* Can filter by tag
* Local graph shows connections
* Global graph shows all notes

#### **Offline:**
* Go offline (airplane mode)
* Create note
* Edit note
* Note persists locally
* Go online
* Note syncs to Supabase
* Other devices receive note

#### **Performance:**
* Typing has no lag
* Auto-save is invisible
* Sheets open smoothly
* Search is instant (<300ms)
* Works on old iPhone (11 or older)

## Deployment
### Build for Production
```bash
npm run build
```

### Deploy to Vercel
```bash
vercel --prod
```

### Environment Variables
```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
```

### PWA Manifest
```json
{
  "name": "Personal OS",
  "short_name": "Personal OS",
  "description": "Your personal knowledge system",
  "start_url": "/",
  "display": "standalone",
  "theme_color": "#000000",
  "background_color": "#ffffff",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

## Success Criteria
**The editor is complete when:**
✅ Can create/edit/delete notes 
✅ Markdown renders instantly (syntax hidden) 
✅ Can add/edit/remove properties 
✅ Wiki-links work with auto-complete 
✅ Can use templates 
✅ Typewriter + focus modes work 
✅ Version history tracks changes 
✅ Callouts and custom checkboxes render 
✅ Graph view shows connections 
✅ Everything works offline 
✅ Syncs across devices 
✅ Feels fast (no lag, smooth animations) 
✅ Looks beautiful (Bear-level polish) 
✅ Installable as PWA on iPhone

## Notes for Claude Code
### Do:
* ✅ Use CodeMirror 6 (not 5)
* ✅ Use Framer Motion for animations
* ✅ Use Radix UI for complex components
* ✅ Use CSS Modules + BEM for styling
* ✅ Use TypeScript strict mode
* ✅ Use RxDB for local database
* ✅ Use Supabase for sync backend
* ✅ Create reusable components
* ✅ Add proper error handling
* ✅ Add loading states where appropriate
* ✅ Test on mobile (iPhone simulator or real device)

⠀Don't:
* ❌ Use Next.js routing (app is single-page)
* ❌ Use Redux or other heavy state management
* ❌ Use inline styles (use CSS Modules)
* ❌ Use class components (use functional + hooks)
* ❌ Forget accessibility (ARIA labels, focus management)
* ❌ Skip TypeScript types (strict mode required)
* ❌ Hardcode dimensions (use CSS variables)
* ❌ Block main thread (use Web Workers for heavy operations)

**Build Order:**
Follow the implementation phases in order. Don't skip ahead to advanced features before basics work.
**Start with:** Navigation shell → Basic editor → Properties → Wiki-links → Templates → Instant rendering → Focus modes → Version history → Extended markdown → Graph view
**Each phase should be:**
1. Fully functional
2. Tested
3. Committed to git
4. Deployed to staging

## Questions for Claude Code
If you encounter any ambiguity:
1. **Architecture decisions:** Follow this spec exactly
2. **Component structure:** Use examples provided
3. **Styling approach:** CSS Modules + BEM
4. **Performance trade-offs:** Prioritize perceived performance (instant feedback)
5. **Feature priorities:** Follow phase order
6. **Edge cases:** Handle gracefully, don't crash

**This specification is complete. Begin implementation with Phase 1.**
🚀