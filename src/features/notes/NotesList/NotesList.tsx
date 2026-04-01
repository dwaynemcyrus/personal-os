import { useEffect, useState } from 'react';
import { queryClient } from '@/lib/queryClient';
import { useNavigationActions } from '@/components/providers';
import {
  Dropdown,
  DropdownCheckboxItem,
  DropdownContent,
  DropdownTrigger,
} from '@/components/ui/Dropdown';
import { showToast } from '@/components/ui/Toast';
import { createAndOpen } from '@/features/documents/createAndOpen';
import { useGroupedNotes } from '../hooks/useGroupedNotes';
import type { NoteGroup, NoteListSort } from '../hooks/useGroupedNotes';
import { useTemplates } from '../hooks/useTemplates';
import {
  extractNoteSnippet,
  extractNoteTitle,
  formatNoteTitle,
  formatRelativeTime,
} from '../noteUtils';
import { BackIcon, PlusIcon } from '@/components/ui/icons';
import styles from './NotesList.module.css';

const GROUP_LABELS: Record<NoteGroup, string> = {
  all: 'Notes',
  todo: 'Todo',
  today: 'Today',
  locked: 'Locked',
  pinned: 'Pinned',
  trash: 'Trash',
};

const SORT_OPTIONS: Array<{ value: NoteListSort; label: string }> = [
  { value: 'date_modified', label: 'Modified' },
  { value: 'date_created', label: 'Created' },
  { value: 'growth', label: 'Growth' },
];

function getTimestampTitle(): string {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
}

function getDocumentMetaLabel(note: { type: string; subtype: string | null; status: string | null }): string | null {
  const kind = note.subtype ?? note.type;
  if (!kind && !note.status) return null;
  return [kind, note.status].filter(Boolean).join(' · ');
}

type NotesListProps = {
  group: NoteGroup;
};

export function NotesList({ group }: NotesListProps) {
  const { pushLayer, goBack } = useNavigationActions();
  const [sort, setSort] = useState<NoteListSort>('date_modified');
  const [isTemplatesExpanded, setIsTemplatesExpanded] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const { notes, isLoading } = useGroupedNotes(group, sort);

  const { data: templateNotes = [] } = useTemplates();

  const handleNotePress = (noteId: string) => {
    pushLayer({ view: 'document-detail', documentId: noteId });
  };

  const handleNewDocument = async () => {
    if (isCreating) return;
    setIsCreating(true);
    try {
      const noteId = await createAndOpen({
        type: 'journal',
        subtype: 'scratch',
        defaultStatus: 'active',
        title: getTimestampTitle(),
      });
      queryClient.invalidateQueries({ queryKey: ['notes', 'list'] });
      queryClient.invalidateQueries({ queryKey: ['notes', 'counts'] });
      pushLayer({ view: 'document-detail', documentId: noteId });
    } catch {
      showToast('Could not create document — please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const label = GROUP_LABELS[group] ?? 'Notes';
  const canCreate = group !== 'trash' && group !== 'locked';

  useEffect(() => {
    if (group === 'locked') {
      showToast('Locked notes coming soon');
    }
  }, [group]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button
          type="button"
          className={styles.backButton}
          onClick={goBack}
          aria-label="Go back"
        >
          <BackIcon />
        </button>
        <h1 className={styles.title}>{label}</h1>
        <div className={styles.headerActions}>
          <Dropdown>
            <DropdownTrigger asChild>
              <button
                type="button"
                className={styles.moreButton}
                aria-label="Sort notes list"
              >
                ⋯
              </button>
            </DropdownTrigger>
            <DropdownContent align="end" sideOffset={8}>
              {SORT_OPTIONS.map((option) => (
                <DropdownCheckboxItem
                  key={option.value}
                  checked={sort === option.value}
                  onCheckedChange={() => setSort(option.value)}
                >
                  {option.label}
                </DropdownCheckboxItem>
              ))}
            </DropdownContent>
          </Dropdown>
          {canCreate && (
            <button
              type="button"
              className={styles.newButton}
              onClick={() => void handleNewDocument()}
              disabled={isCreating}
              aria-label="New scratch document"
            >
              <PlusIcon />
            </button>
          )}
        </div>
      </div>

      <div className={styles.list}>
        {isLoading ? (
          <p className={styles.empty}>Loading...</p>
        ) : notes.length === 0 ? (
          <p className={styles.empty}>No documents here yet.</p>
        ) : (
          notes.map((note) => {
            const rawContent = (note.content ?? '').slice(0, 500);
            const title = formatNoteTitle(extractNoteTitle(rawContent || null, note.title ?? ''));
            const snippet = extractNoteSnippet(rawContent || null);
            const updatedLabel = formatRelativeTime(note.updated_at);
            return (
              <button
                key={note.id}
                type="button"
                className={styles.item}
                onClick={() => handleNotePress(note.id)}
              >
                <div className={styles.itemHeader}>
                  <div className={styles.itemTitle}>{title}</div>
                </div>
                {snippet ? (
                  <div className={styles.itemSnippet}>{snippet}</div>
                ) : null}
                <div className={styles.itemMeta}>
                  <span className={styles.itemDate}>{updatedLabel}</span>
                  {getDocumentMetaLabel(note) ? (
                    <span className={styles.itemPinned}>{getDocumentMetaLabel(note)}</span>
                  ) : null}
                  {Array.isArray(note.tags) && note.tags.includes('imported') ? (
                    <span className={styles.itemImported}>Imported</span>
                  ) : null}
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* Templates section — collapsible, at the bottom */}
      <div className={styles.templatesSection}>
        <button
          type="button"
          className={styles.templatesToggle}
          onClick={() => setIsTemplatesExpanded((v) => !v)}
          aria-expanded={isTemplatesExpanded}
        >
          <span>Templates{templateNotes.length > 0 ? ` (${templateNotes.length})` : ''}</span>
          <span
            className={`${styles.templatesChevron} ${isTemplatesExpanded ? styles['templatesChevron--open'] : ''}`}
            aria-hidden="true"
          >
            ▾
          </span>
        </button>

        {isTemplatesExpanded && (
          <div className={styles.templatesList}>
            {templateNotes.length === 0 ? (
              <p className={styles.empty}>No templates yet.</p>
            ) : (
              templateNotes.map((t) => (
                <div key={t.id} className={styles.templateItemRow}>
                  <button
                    type="button"
                    className={styles.templateItem}
                    onClick={() => pushLayer({ view: 'document-detail', documentId: t.id })}
                  >
                    <span>{t.title ?? t.subtype ?? 'Untitled'}</span>
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
