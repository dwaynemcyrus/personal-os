/**
 * Wiki-Link CodeMirror Extension
 *
 * Provides:
 * - Autocomplete for [[Note Name]]
 * - Clickable wiki-links
 * - Styling for wiki-links
 */

import { Extension } from '@codemirror/state';
import {
  Decoration,
  DecorationSet,
  EditorView,
  ViewPlugin,
  ViewUpdate,
  WidgetType,
} from '@codemirror/view';
import {
  autocompletion,
  CompletionContext,
  CompletionResult,
} from '@codemirror/autocomplete';
import type { RxDatabase } from 'rxdb';
import type { DatabaseCollections, NoteDocument } from '@/lib/db';
import { parseWikiLinks } from '@/lib/markdown/wikilinks';

type WikiLinkConfig = {
  db: RxDatabase<DatabaseCollections> | null;
  onLinkClick?: (target: string, noteId: string | null) => void;
  enableAutocomplete?: boolean;
  enableDecorations?: boolean;
  enableClickHandler?: boolean;
  enableTheme?: boolean;
};

/**
 * Extract headers from markdown content
 */
function extractHeaders(content: string | null): string[] {
  if (!content) return [];
  const headers: string[] = [];
  const lines = content.split('\n');
  for (const line of lines) {
    const match = line.match(/^#{1,6}\s+(.+)$/);
    if (match) {
      headers.push(match[1].trim());
    }
  }
  return headers;
}

/**
 * Create wiki-link autocomplete extension
 */
function wikiLinkAutocomplete(config: WikiLinkConfig): Extension {
  return autocompletion({
    override: [
      async (context: CompletionContext): Promise<CompletionResult | null> => {
        if (!config.db) return null;

        // Check if cursor is after [[
        const before = context.state.doc.sliceString(0, context.pos);
        const match = before.match(/\[\[([^\]\n]*)$/);

        if (!match) return null;

        const linkContent = match[1];
        const from = context.pos - linkContent.length;

        try {
          // Check if we're completing a header (after #)
          const headerMatch = linkContent.match(/^([^#]+)#(.*)$/);

          if (headerMatch) {
            // User typed [[Note#, show headers from that note
            const noteTitle = headerMatch[1].trim();
            const headerQuery = headerMatch[2].toLowerCase();

            // Find the note by title
            const docs = await config.db.notes
              .find({
                selector: {
                  is_trashed: false,
                },
              })
              .exec();

            const targetNote = docs
              .map((doc) => doc.toJSON() as NoteDocument)
              .find((note) => note.title.toLowerCase() === noteTitle.toLowerCase());

            if (!targetNote) return null;

            const headers = extractHeaders(targetNote.content);
            const filteredHeaders = headers.filter((h) =>
              h.toLowerCase().includes(headerQuery)
            );

            if (filteredHeaders.length === 0) return null;

            return {
              from: from + noteTitle.length + 1, // After the #
              options: filteredHeaders.map((header) => ({
                label: header,
                apply: `${header}]]`,
                type: 'text',
              })),
            };
          }

          // Regular note title completion
          const query = linkContent.toLowerCase();

          // Search notes by title
          const docs = await config.db.notes
            .find({
              selector: {
                is_trashed: false,
              },
            })
            .exec();

          // Filter and sort by relevance
          const notes = docs
            .map((doc) => doc.toJSON() as NoteDocument)
            .filter((note) => note.title.toLowerCase().includes(query))
            .slice(0, 10);

          if (notes.length === 0) return null;

          return {
            from,
            options: notes.map((note) => ({
              label: note.title,
              apply: `${note.title}]]`,
              type: 'text',
              info: note.content?.slice(0, 100) || 'No content',
            })),
          };
        } catch {
          return null;
        }
      },
    ],
  });
}

/**
 * Wiki-link decoration widget for clickable links
 */
class WikiLinkWidget extends WidgetType {
  constructor(
    readonly displayText: string,
    readonly target: string,
    readonly noteId: string | null
  ) {
    super();
  }

  toDOM(): HTMLElement {
    const span = document.createElement('span');
    span.className = 'cm-wikilink';
    span.textContent = this.displayText;
    span.setAttribute('data-target', this.target);
    if (this.noteId) {
      span.setAttribute('data-note-id', this.noteId);
    }
    return span;
  }

  ignoreEvent(): boolean {
    return false;
  }
}

/**
 * Create wiki-link decorations for the document
 */
function createWikiLinkDecorations(
  view: EditorView,
  noteMap: Map<string, string>
): DecorationSet {
  const decorations: Array<{
    from: number;
    to: number;
    decoration: Decoration;
  }> = [];

  const doc = view.state.doc.toString();
  const links = parseWikiLinks(doc);

  for (const link of links) {
    // Check if cursor is inside this link
    const cursorPos = view.state.selection.main.head;
    const isEditing = cursorPos >= link.start && cursorPos <= link.end;

    if (!isEditing) {
      // Find matching note
      const normalizedTarget = link.target.toLowerCase();
      const noteId = noteMap.get(normalizedTarget) || null;
      const displayText = link.alias || link.target;

      decorations.push({
        from: link.start,
        to: link.end,
        decoration: Decoration.replace({
          widget: new WikiLinkWidget(displayText, link.target, noteId),
        }),
      });
    } else {
      // Just style the raw wiki-link syntax
      decorations.push({
        from: link.start,
        to: link.end,
        decoration: Decoration.mark({ class: 'cm-wikilink-editing' }),
      });
    }
  }

  return Decoration.set(
    decorations.map(({ from, to, decoration }) =>
      decoration.range(from, to)
    ),
    true
  );
}

/**
 * Create wiki-link view plugin
 */
function wikiLinkDecorations(config: WikiLinkConfig): Extension {
  // Cache note titles -> ids for quick lookup
  let noteMap = new Map<string, string>();

  // Update note map when needed
  const updateNoteMap = async () => {
    if (!config.db) return;
    try {
      const docs = await config.db.notes
        .find({ selector: { is_trashed: false } })
        .exec();
      noteMap = new Map(
        docs.map((doc) => [doc.title.toLowerCase(), doc.id])
      );
    } catch {
      // Ignore errors
    }
  };

  // Initial load
  updateNoteMap();

  return ViewPlugin.fromClass(
    class {
      decorations: DecorationSet;

      constructor(view: EditorView) {
        this.decorations = createWikiLinkDecorations(view, noteMap);
      }

      update(update: ViewUpdate) {
        if (update.docChanged || update.selectionSet) {
          this.decorations = createWikiLinkDecorations(update.view, noteMap);
        }
      }
    },
    {
      decorations: (v) => v.decorations,
    }
  );
}

/**
 * Handle clicks on wiki-links
 */
function wikiLinkClickHandler(config: WikiLinkConfig): Extension {
  return EditorView.domEventHandlers({
    click: (event) => {
      const target = event.target as HTMLElement;

      if (target.classList.contains('cm-wikilink')) {
        event.preventDefault();
        event.stopPropagation();

        const linkTarget = target.getAttribute('data-target');
        const noteId = target.getAttribute('data-note-id');

        if (linkTarget && config.onLinkClick) {
          config.onLinkClick(linkTarget, noteId);
        }

        return true;
      }

      return false;
    },
  });
}

/**
 * Wiki-link theme styles
 */
const wikiLinkTheme = EditorView.theme({
  '.cm-wikilink': {
    color: 'var(--color-link)',
    textDecoration: 'underline',
    textDecorationStyle: 'dotted',
    cursor: 'pointer',
    padding: '0 2px',
    borderRadius: '2px',
    transition: 'background 0.15s ease',
  },
  '.cm-wikilink:hover': {
    background: 'var(--color-ink-alpha-08)',
  },
  '.cm-wikilink-editing': {
    background: 'var(--color-ink-alpha-05)',
    borderRadius: '2px',
  },
});

/**
 * Create the complete wiki-link extension
 */
export function wikiLinkExtension(config: WikiLinkConfig): Extension[] {
  const {
    enableAutocomplete = true,
    enableDecorations = true,
    enableClickHandler = true,
    enableTheme = true,
  } = config;

  const extensions: Extension[] = [];

  if (enableAutocomplete) {
    extensions.push(wikiLinkAutocomplete(config));
  }
  if (enableDecorations) {
    extensions.push(wikiLinkDecorations(config));
  }
  if (enableClickHandler) {
    extensions.push(wikiLinkClickHandler(config));
  }
  if (enableTheme) {
    extensions.push(wikiLinkTheme);
  }

  return extensions;
}
