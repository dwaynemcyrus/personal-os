import { useEffect, useRef } from 'react';
import type { Editor } from '@tiptap/react';
import type { EditorMode } from './TipTapEditor';
import styles from './EditorToolbar.module.css';

type Props = {
  editor: Editor | null;
  mode: EditorMode;
};

export function EditorToolbar({ editor, mode }: Props) {
  const toolbarRef = useRef<HTMLDivElement>(null);

  // Follow the virtual keyboard on mobile using the Visual Viewport API
  useEffect(() => {
    const vv = window.visualViewport;
    const el = toolbarRef.current;
    if (!vv || !el) return;

    const update = () => {
      // Keyboard height = how much the viewport has shrunk from the bottom
      const keyboardHeight = Math.max(
        0,
        window.innerHeight - vv.height - vv.offsetTop,
      );
      el.style.setProperty('--kb-offset', `${keyboardHeight}px`);
    };

    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    update();

    return () => {
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
    };
  }, []);

  // Only show in rendered mode — source mode is raw text
  if (mode === 'source') return null;

  const cmd = (fn: () => void) => (e: React.MouseEvent) => {
    e.preventDefault();
    fn();
    editor?.commands.focus();
  };

  return (
    <div ref={toolbarRef} className={styles.toolbar} aria-label="Formatting toolbar">

      {/* Inline formatting */}
      <Btn
        label="Bold"
        active={editor?.isActive('bold') ?? false}
        onPress={cmd(() => editor?.chain().toggleBold().run())}
      >
        <BoldIcon />
      </Btn>
      <Btn
        label="Italic"
        active={editor?.isActive('italic') ?? false}
        onPress={cmd(() => editor?.chain().toggleItalic().run())}
      >
        <ItalicIcon />
      </Btn>
      <Btn
        label="Strikethrough"
        active={editor?.isActive('strike') ?? false}
        onPress={cmd(() => editor?.chain().toggleStrike().run())}
      >
        <StrikeIcon />
      </Btn>
      <Btn
        label="Inline code"
        active={editor?.isActive('code') ?? false}
        onPress={cmd(() => editor?.chain().toggleCode().run())}
      >
        <CodeIcon />
      </Btn>

      <div className={styles.sep} aria-hidden="true" />

      {/* Headings */}
      <Btn
        label="Heading 1"
        active={editor?.isActive('heading', { level: 1 }) ?? false}
        onPress={cmd(() => editor?.chain().toggleHeading({ level: 1 }).run())}
        labelText="H1"
      />
      <Btn
        label="Heading 2"
        active={editor?.isActive('heading', { level: 2 }) ?? false}
        onPress={cmd(() => editor?.chain().toggleHeading({ level: 2 }).run())}
        labelText="H2"
      />
      <Btn
        label="Heading 3"
        active={editor?.isActive('heading', { level: 3 }) ?? false}
        onPress={cmd(() => editor?.chain().toggleHeading({ level: 3 }).run())}
        labelText="H3"
      />

      <div className={styles.sep} aria-hidden="true" />

      {/* Lists */}
      <Btn
        label="Bullet list"
        active={editor?.isActive('bulletList') ?? false}
        onPress={cmd(() => editor?.chain().toggleBulletList().run())}
      >
        <BulletListIcon />
      </Btn>
      <Btn
        label="Ordered list"
        active={editor?.isActive('orderedList') ?? false}
        onPress={cmd(() => editor?.chain().toggleOrderedList().run())}
      >
        <OrderedListIcon />
      </Btn>
      <Btn
        label="Task list"
        active={editor?.isActive('taskList') ?? false}
        onPress={cmd(() => editor?.chain().toggleTaskList().run())}
      >
        <TaskListIcon />
      </Btn>

      <div className={styles.sep} aria-hidden="true" />

      {/* Blocks */}
      <Btn
        label="Blockquote"
        active={editor?.isActive('blockquote') ?? false}
        onPress={cmd(() => editor?.chain().toggleBlockquote().run())}
      >
        <BlockquoteIcon />
      </Btn>
      <Btn
        label="Code block"
        active={editor?.isActive('codeBlock') ?? false}
        onPress={cmd(() => editor?.chain().toggleCodeBlock().run())}
      >
        <CodeBlockIcon />
      </Btn>

    </div>
  );
}

// ── Reusable button ────────────────────────────────────────────────────────────

type BtnProps = {
  label: string;
  active: boolean;
  onPress: (e: React.MouseEvent) => void;
  labelText?: string;
  children?: React.ReactNode;
};

function Btn({ label, active, onPress, labelText, children }: BtnProps) {
  return (
    <button
      type="button"
      className={styles.btn}
      aria-label={label}
      aria-pressed={active}
      data-active={active}
      onMouseDown={onPress}
      // Touch devices
      onTouchEnd={(e) => { e.preventDefault(); onPress(e as unknown as React.MouseEvent); }}
    >
      {labelText ? (
        <span className={styles.btnLabel}>{labelText}</span>
      ) : (
        children
      )}
    </button>
  );
}

// ── Icons ─────────────────────────────────────────────────────────────────────

function BoldIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" />
      <path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" />
    </svg>
  );
}

function ItalicIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="4" x2="10" y2="4" />
      <line x1="14" y1="20" x2="5" y2="20" />
      <line x1="15" y1="4" x2="9" y2="20" />
    </svg>
  );
}

function StrikeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.3 4.9c-2.3-.6-4.4-1-6.2-.9-2.7 0-5.3.7-5.3 3.6 0 1.5 1.8 3.3 3.9 3.6h.2m8.2 3.7c.2.4.4.8.4 1.3 0 2.9-2.7 3.6-6.2 3.6-2.3 0-4.4-.4-6.2-.9M4 12h16" />
    </svg>
  );
}

function CodeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  );
}

function BulletListIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="9" y1="6" x2="20" y2="6" />
      <line x1="9" y1="12" x2="20" y2="12" />
      <line x1="9" y1="18" x2="20" y2="18" />
      <circle cx="4" cy="6" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="4" cy="12" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="4" cy="18" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

function OrderedListIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="10" y1="6" x2="21" y2="6" />
      <line x1="10" y1="12" x2="21" y2="12" />
      <line x1="10" y1="18" x2="21" y2="18" />
      <path d="M4 6h1v4" stroke="currentColor" strokeWidth="1.8" />
      <path d="M4 10h2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M6 14H4c0-1 2-2 2-3s-1-1.5-2-1" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function TaskListIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="6" height="6" rx="1" />
      <polyline points="5 8 6.5 9.5 9 7" strokeWidth="1.8" />
      <line x1="13" y1="8" x2="21" y2="8" />
      <rect x="3" y="14" width="6" height="6" rx="1" />
      <line x1="13" y1="17" x2="21" y2="17" />
    </svg>
  );
}

function BlockquoteIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z" opacity="0.7" />
      <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z" opacity="0.7" />
    </svg>
  );
}

function CodeBlockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="18" rx="2" />
      <path d="M8 10l-3 2 3 2" />
      <path d="M16 10l3 2-3 2" />
      <line x1="12" y1="8" x2="10" y2="16" />
    </svg>
  );
}
