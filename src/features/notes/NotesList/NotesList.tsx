import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { queryClient } from '@/lib/queryClient';
import { useNavigationActions } from '@/components/providers';
import { showToast } from '@/components/ui/Toast';
import { useGroupedNotes } from '../hooks/useGroupedNotes';
import type { NoteGroup } from '../hooks/useGroupedNotes';
import { createNoteFromTemplate } from '../hooks/useCreateNoteFromTemplate';
import { TemplatePicker } from '../TemplatePicker/TemplatePicker';
import {
  extractNoteSnippet,
  extractNoteTitle,
  formatNoteTitle,
  formatRelativeTime,
} from '../noteUtils';
import type { ItemRow } from '@/lib/db';
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

type NotesListProps = {
  group: NoteGroup;
};

export function NotesList({ group }: NotesListProps) {
  const { pushLayer, goBack } = useNavigationActions();
  const { notes, isLoading } = useGroupedNotes(group);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [isTemplatesExpanded, setIsTemplatesExpanded] = useState(false);

  const { data: templateNotes = [] } = useQuery({
    queryKey: ['notes', 'templates'],
    queryFn: async (): Promise<Pick<ItemRow, 'id' | 'title'>[]> => {
      const { data } = await supabase
        .from('items')
        .select('id, title')
        .eq('type', 'note')
        .eq('subtype', 'template')
        .eq('is_trashed', false)
        .order('title', { ascending: true });
      return (data ?? []) as Pick<ItemRow, 'id' | 'title'>[];
    },
    staleTime: 60_000,
  });

  const handleNotePress = (noteId: string) => {
    pushLayer({ view: 'note-detail', noteId });
  };

  const handleNewNote = async (templateId: string | null) => {
    setIsPickerOpen(false);
    try {
      const noteId = await createNoteFromTemplate(templateId);
      queryClient.invalidateQueries({ queryKey: ['notes', 'list'] });
      pushLayer({ view: 'note-detail', noteId });
    } catch {
      showToast('Could not create note — please try again.');
    }
  };

  const handleNewFromTemplate = async (templateId: string) => {
    try {
      const noteId = await createNoteFromTemplate(templateId);
      queryClient.invalidateQueries({ queryKey: ['notes', 'list'] });
      pushLayer({ view: 'note-detail', noteId });
    } catch {
      showToast('Could not create note — please try again.');
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
        {canCreate && (
          <button
            type="button"
            className={styles.newButton}
            onClick={() => setIsPickerOpen(true)}
            aria-label="New note"
          >
            <PlusIcon />
          </button>
        )}
      </div>

      <div className={styles.list}>
        {isLoading ? (
          <p className={styles.empty}>Loading...</p>
        ) : notes.length === 0 ? (
          <p className={styles.empty}>No notes here yet.</p>
        ) : (
          notes.map((note) => {
            const rawContent = ((note as unknown as { item_content?: { content?: string | null } }).item_content?.content ?? note.content ?? '').slice(0, 500);
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
                  {note.is_pinned ? (
                    <span className={styles.itemPinned}>Pinned</span>
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
        <div className={styles.templatesHeader}>
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
          <button
            type="button"
            className={styles.templatesNewButton}
            onClick={async () => {
              try {
                const noteId = await createNoteFromTemplate(null, { subtype: 'template' });
                pushLayer({ view: 'note-detail', noteId });
              } catch {
                showToast('Could not create template — please try again.');
              }
            }}
            aria-label="New template"
          >
            <PlusIcon />
          </button>
        </div>

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
                    onClick={() => pushLayer({ view: 'note-detail', noteId: t.id })}
                  >
                    <span>{t.title ?? 'Untitled'}</span>
                  </button>
                  <button
                    type="button"
                    className={styles.templateUseButton}
                    onClick={() => void handleNewFromTemplate(t.id)}
                    title={`Create new note from "${t.title ?? 'Untitled'}"`}
                    aria-label={`Use "${t.title ?? 'Untitled'}"`}
                  >
                    <span aria-hidden="true">›</span>
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <TemplatePicker
        open={isPickerOpen}
        onOpenChange={setIsPickerOpen}
        onSelect={(id) => void handleNewNote(id)}
        showBlankOption
      />
    </div>
  );
}
