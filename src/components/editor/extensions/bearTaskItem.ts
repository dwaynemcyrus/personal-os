import TaskItem from '@tiptap/extension-task-item';

// ── Token model ───────────────────────────────────────────────────────────────

export const TASK_CYCLE = [' ', 'x', 'i', '!', '?', '*', '>', '<'] as const;
export type TaskToken = typeof TASK_CYCLE[number];

export const TASK_META: Record<string, { emoji: string; label: string }> = {
  ' ': { emoji: '⬜️', label: 'Incomplete' },
  'x': { emoji: '✅', label: 'Done' },
  'i': { emoji: '🧠', label: 'Idea' },
  '!': { emoji: '⚠️', label: 'Urgent' },
  '?': { emoji: '❓', label: 'Question' },
  '*': { emoji: '⭐', label: 'Important' },
  '>': { emoji: '➡️', label: 'Forwarded' },
  '<': { emoji: '📅', label: 'Scheduled' },
};

function nextToken(current: string): TaskToken {
  const idx = TASK_CYCLE.indexOf(current as TaskToken);
  return TASK_CYCLE[(idx === -1 ? 0 : idx + 1) % TASK_CYCLE.length];
}

// ── Extension ─────────────────────────────────────────────────────────────────

export const BearTaskItem = TaskItem.extend({
  name: 'taskItem',

  addAttributes() {
    return {
      // Keep standard checked attr for compatibility
      checked: {
        default: false,
        parseHTML: (el: Element) => {
          const token = el.getAttribute('data-token') ?? ' ';
          if (token !== ' ' && token) return token !== ' ';
          return el.getAttribute('data-checked') === 'true';
        },
        renderHTML: () => ({}),
      },
      // Custom multi-state token
      token: {
        default: ' ',
        parseHTML: (el: Element) => el.getAttribute('data-token') ?? ' ',
        renderHTML: (attrs: Record<string, unknown>) => ({
          'data-token': attrs.token ?? ' ',
        }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'li[data-type="taskItem"]',
        priority: 51,
      },
    ];
  },

  renderHTML({ HTMLAttributes }: { HTMLAttributes: Record<string, unknown> }) {
    const token = (HTMLAttributes['data-token'] as string) ?? ' ';
    const meta = TASK_META[token] ?? TASK_META[' '];
    return [
      'li',
      { 'data-type': 'taskItem', 'data-token': token },
      [
        'span',
        {
          class: 'bear-task-emoji',
          role: 'button',
          'aria-label': meta.label,
          'data-token': token,
          contenteditable: 'false',
        },
        meta.emoji,
      ],
      ['div', { class: 'bear-task-content' }, 0],
    ];
  },

  addKeyboardShortcuts() {
    return {
      ...this.parent?.(),
    };
  },

  // Override addNodeView to attach click cycling
  addNodeView() {
    return ({ node, getPos, editor }) => {
      const li = document.createElement('li');
      li.setAttribute('data-type', 'taskItem');

      const token = (node.attrs.token as string) ?? ' ';
      li.setAttribute('data-token', token);

      const emojiSpan = document.createElement('span');
      emojiSpan.className = 'bear-task-emoji';
      emojiSpan.setAttribute('role', 'button');
      emojiSpan.setAttribute('contenteditable', 'false');

      const meta = TASK_META[token] ?? TASK_META[' '];
      emojiSpan.textContent = meta.emoji;
      emojiSpan.setAttribute('aria-label', meta.label);

      emojiSpan.addEventListener('mousedown', (e) => e.preventDefault());
      emojiSpan.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (typeof getPos !== 'function') return;
        const pos = getPos();
        if (pos === undefined) return;
        const currentToken = editor.state.doc.nodeAt(pos)?.attrs.token ?? ' ';
        const next = nextToken(currentToken);
        editor.chain()
          .focus()
          .command(({ tr }) => {
            tr.setNodeMarkup(pos, undefined, {
              ...editor.state.doc.nodeAt(pos)?.attrs,
              token: next,
              checked: next !== ' ',
            });
            return true;
          })
          .run();
      });

      const contentDiv = document.createElement('div');
      contentDiv.className = 'bear-task-content';

      li.appendChild(emojiSpan);
      li.appendChild(contentDiv);

      return {
        dom: li,
        contentDOM: contentDiv,
        update(updatedNode) {
          if (updatedNode.type !== node.type) return false;
          const updatedToken = (updatedNode.attrs.token as string) ?? ' ';
          li.setAttribute('data-token', updatedToken);
          const updatedMeta = TASK_META[updatedToken] ?? TASK_META[' '];
          emojiSpan.textContent = updatedMeta.emoji;
          emojiSpan.setAttribute('aria-label', updatedMeta.label);
          return true;
        },
      };
    };
  },

  // Custom markdown serialization for tiptap-markdown
  addStorage() {
    return {
      markdown: {
        serialize(state: { write: (s: string) => void; renderContent: (n: unknown) => void }, node: { attrs: Record<string, unknown> }) {
          const token = (node.attrs.token as string) ?? ' ';
          state.write(`[${token}] `);
          state.renderContent(node);
        },
        parse: {
          // tiptap-markdown uses markdown-it under the hood;
          // the standard GFM task list parser handles `- [ ]` and `- [x]`.
          // Custom tokens `[i]` `[!]` etc. are parsed via the updateDOM hook
          // which runs on the raw HTML after markdown-it renders it.
          updateDOM(element: Element) {
            element.querySelectorAll('.task-list-item').forEach((item) => {
              const input = item.querySelector('input[type="checkbox"]');
              item.setAttribute('data-type', 'taskItem');

              // Try to recover original token from the raw text content
              // markdown-it renders `- [i] text` as a plain list item,
              // not a task item. We handle known GFM tokens via input.
              if (input) {
                const checked = (input as HTMLInputElement).checked;
                item.setAttribute('data-token', checked ? 'x' : ' ');
                input.remove();
              } else {
                // For non-GFM tokens, token is embedded as data-token by our serializer
                // but on fresh parse the raw text may still have `[i] ` prefix.
                // Leave token as ' ' — full custom token parsing requires
                // a markdown-it plugin (added separately in TipTapEditor).
              }
            });
          },
        },
      },
    };
  },
});
