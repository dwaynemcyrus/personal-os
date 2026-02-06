'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetClose,
} from '@/components/ui/Sheet';
import { useDatabase } from '@/hooks/useDatabase';
import type { NoteProperties, ProjectDocument } from '@/lib/db';
import styles from './PropertiesSheet.module.css';

type PropertiesSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  noteId: string;
  properties: NoteProperties | null;
  onSave: (properties: NoteProperties) => void;
};

type PropertyType = 'text' | 'dropdown' | 'tags' | 'date' | 'number';

type PropertyDefinition = {
  key: string;
  label: string;
  type: PropertyType;
  options?: string[];
};

const BUILT_IN_PROPERTIES: PropertyDefinition[] = [
  { key: 'project_id', label: 'Project', type: 'dropdown' },
  {
    key: 'status',
    label: 'Status',
    type: 'dropdown',
    options: ['draft', 'in-progress', 'review', 'complete', 'archived'],
  },
  { key: 'tags', label: 'Tags', type: 'tags' },
  { key: 'due_date', label: 'Due Date', type: 'date' },
  { key: 'priority', label: 'Priority', type: 'number' },
];

export function PropertiesSheet({
  open,
  onOpenChange,
  noteId,
  properties,
  onSave,
}: PropertiesSheetProps) {
  const { db, isReady } = useDatabase();
  const [localProperties, setLocalProperties] = useState<NoteProperties>(
    properties ?? {}
  );
  const [projects, setProjects] = useState<ProjectDocument[]>([]);
  const [tagInput, setTagInput] = useState('');

  // Sync local state when props change
  useEffect(() => {
    setLocalProperties(properties ?? {});
  }, [properties]);

  // Load projects for dropdown
  useEffect(() => {
    if (!db || !isReady) return;
    const subscription = db.projects
      .find({
        selector: { is_trashed: false },
        sort: [{ title: 'asc' }],
      })
      .$.subscribe((docs) => {
        setProjects(docs.map((doc) => doc.toJSON() as ProjectDocument));
      });
    return () => subscription.unsubscribe();
  }, [db, isReady]);

  const handleChange = useCallback(
    (key: string, value: unknown) => {
      setLocalProperties((prev) => ({
        ...prev,
        [key]: value,
      }));
    },
    []
  );

  const handleAddTag = useCallback(() => {
    const tag = tagInput.trim().toLowerCase();
    if (!tag) return;
    setLocalProperties((prev) => {
      const existing = prev.tags ?? [];
      if (existing.includes(tag)) return prev;
      return { ...prev, tags: [...existing, tag] };
    });
    setTagInput('');
  }, [tagInput]);

  const handleRemoveTag = useCallback((tag: string) => {
    setLocalProperties((prev) => ({
      ...prev,
      tags: (prev.tags ?? []).filter((t) => t !== tag),
    }));
  }, []);

  const handleSave = useCallback(() => {
    onSave(localProperties);
    onOpenChange(false);
  }, [localProperties, onSave, onOpenChange]);

  const handleClear = useCallback((key: string) => {
    setLocalProperties((prev) => {
      const next = { ...prev };
      delete next[key as keyof NoteProperties];
      return next;
    });
  }, []);

  const currentTags = useMemo(
    () => localProperties.tags ?? [],
    [localProperties.tags]
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className={styles.sheet}
        aria-label="Note properties"
      >
        <header className={styles.header}>
          <SheetTitle className={styles.title}>Properties</SheetTitle>
          <SheetClose asChild>
            <button
              type="button"
              className={styles.close}
              aria-label="Close properties"
            >
              <CloseIcon />
            </button>
          </SheetClose>
        </header>

        <div className={styles.properties}>
          {/* Project */}
          <div className={styles.field}>
            <label className={styles.label}>Project</label>
            <div className={styles.fieldRow}>
              <select
                className={styles.select}
                value={localProperties.project_id ?? ''}
                onChange={(e) =>
                  handleChange('project_id', e.target.value || null)
                }
              >
                <option value="">No project</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.title}
                  </option>
                ))}
              </select>
              {localProperties.project_id && (
                <button
                  type="button"
                  className={styles.clearButton}
                  onClick={() => handleClear('project_id')}
                  aria-label="Clear project"
                >
                  <ClearIcon />
                </button>
              )}
            </div>
          </div>

          {/* Status */}
          <div className={styles.field}>
            <label className={styles.label}>Status</label>
            <div className={styles.fieldRow}>
              <select
                className={styles.select}
                value={localProperties.status ?? ''}
                onChange={(e) =>
                  handleChange('status', e.target.value || null)
                }
              >
                <option value="">No status</option>
                <option value="draft">Draft</option>
                <option value="in-progress">In Progress</option>
                <option value="review">Review</option>
                <option value="complete">Complete</option>
                <option value="archived">Archived</option>
              </select>
              {localProperties.status && (
                <button
                  type="button"
                  className={styles.clearButton}
                  onClick={() => handleClear('status')}
                  aria-label="Clear status"
                >
                  <ClearIcon />
                </button>
              )}
            </div>
          </div>

          {/* Tags */}
          <div className={styles.field}>
            <label className={styles.label}>Tags</label>
            <div className={styles.tags}>
              {currentTags.map((tag) => (
                <span key={tag} className={styles.tag}>
                  #{tag}
                  <button
                    type="button"
                    className={styles.tagRemove}
                    onClick={() => handleRemoveTag(tag)}
                    aria-label={`Remove ${tag}`}
                  >
                    ×
                  </button>
                </span>
              ))}
              <input
                type="text"
                className={styles.tagInput}
                placeholder="Add tag..."
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
              />
            </div>
          </div>

          {/* Due Date */}
          <div className={styles.field}>
            <label className={styles.label}>Due Date</label>
            <div className={styles.fieldRow}>
              <input
                type="date"
                className={styles.input}
                value={
                  localProperties.due_date
                    ? localProperties.due_date.slice(0, 10)
                    : ''
                }
                onChange={(e) =>
                  handleChange(
                    'due_date',
                    e.target.value ? `${e.target.value}T00:00:00Z` : null
                  )
                }
              />
              {localProperties.due_date && (
                <button
                  type="button"
                  className={styles.clearButton}
                  onClick={() => handleClear('due_date')}
                  aria-label="Clear due date"
                >
                  <ClearIcon />
                </button>
              )}
            </div>
          </div>

          {/* Priority */}
          <div className={styles.field}>
            <label className={styles.label}>Priority</label>
            <div className={styles.priority}>
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  className={styles.priorityStar}
                  data-active={(localProperties.priority ?? 0) >= n}
                  onClick={() =>
                    handleChange(
                      'priority',
                      localProperties.priority === n ? null : n
                    )
                  }
                  aria-label={`Priority ${n}`}
                >
                  ★
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.saveButton}
            onClick={handleSave}
          >
            Save
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function CloseIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      className={styles.icon}
    >
      <path d="M6 6l12 12M18 6l-12 12" />
    </svg>
  );
}

function ClearIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      className={styles.clearIcon}
    >
      <path d="M6 6l12 12M18 6l-12 12" />
    </svg>
  );
}
