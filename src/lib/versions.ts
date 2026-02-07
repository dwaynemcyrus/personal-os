/**
 * Version History Utilities
 *
 * Handles saving, restoring, and comparing note versions.
 */

import { v4 as uuidv4 } from 'uuid';
import type { RxDatabase } from 'rxdb';
import type { DatabaseCollections, NoteVersionDocument, NoteProperties } from './db';

const AUTO_SAVE_INTERVAL_MS = 30 * 60 * 1000; // 30 minutes

// Track last version save time per note
const lastVersionSaveByNote = new Map<string, number>();

/**
 * Check if we should auto-save a version based on time elapsed
 */
export function shouldAutoSaveVersion(noteId: string): boolean {
  const now = Date.now();
  const lastSave = lastVersionSaveByNote.get(noteId) ?? 0;

  if (now - lastSave > AUTO_SAVE_INTERVAL_MS) {
    return true;
  }

  return false;
}

/**
 * Mark that a version was saved for a note
 */
export function markVersionSaved(noteId: string): void {
  lastVersionSaveByNote.set(noteId, Date.now());
}

/**
 * Get the next version number for a note
 */
async function getNextVersionNumber(
  db: RxDatabase<DatabaseCollections>,
  noteId: string
): Promise<number> {
  const versions = await db.note_versions
    .find({
      selector: { note_id: noteId, is_trashed: false },
      sort: [{ version_number: 'desc' }],
      limit: 1,
    })
    .exec();

  if (versions.length === 0) {
    return 1;
  }

  return versions[0].version_number + 1;
}

/**
 * Save a new version of a note
 */
export async function saveVersion(
  db: RxDatabase<DatabaseCollections>,
  noteId: string,
  content: string | null,
  properties: NoteProperties | null,
  createdBy: 'auto' | 'manual',
  changeSummary?: string
): Promise<NoteVersionDocument> {
  const versionNumber = await getNextVersionNumber(db, noteId);
  const timestamp = new Date().toISOString();

  const version = await db.note_versions.insert({
    id: uuidv4(),
    note_id: noteId,
    content,
    properties: properties as Record<string, unknown> | null,
    version_number: versionNumber,
    created_by: createdBy,
    change_summary: changeSummary ?? null,
    created_at: timestamp,
    updated_at: timestamp,
    is_trashed: false,
    trashed_at: null,
  });

  markVersionSaved(noteId);

  return version.toJSON() as NoteVersionDocument;
}

/**
 * Get all versions for a note, sorted by newest first
 */
export async function getVersions(
  db: RxDatabase<DatabaseCollections>,
  noteId: string
): Promise<NoteVersionDocument[]> {
  const versions = await db.note_versions
    .find({
      selector: { note_id: noteId, is_trashed: false },
      sort: [{ created_at: 'desc' }],
    })
    .exec();

  return versions.map((v) => v.toJSON() as NoteVersionDocument);
}

/**
 * Get a specific version by ID
 */
export async function getVersion(
  db: RxDatabase<DatabaseCollections>,
  versionId: string
): Promise<NoteVersionDocument | null> {
  const version = await db.note_versions.findOne(versionId).exec();
  return version ? (version.toJSON() as NoteVersionDocument) : null;
}

/**
 * Restore a note to a previous version
 * Saves current state as a new version before restoring
 */
export async function restoreVersion(
  db: RxDatabase<DatabaseCollections>,
  versionId: string
): Promise<boolean> {
  const version = await db.note_versions.findOne(versionId).exec();
  if (!version) return false;

  const versionData = version.toJSON() as NoteVersionDocument;
  const noteDoc = await db.notes.findOne(versionData.note_id).exec();
  if (!noteDoc) return false;

  const noteData = noteDoc.toJSON();

  // Save current state as a new version before restoring
  await saveVersion(
    db,
    versionData.note_id,
    noteData.content,
    noteData.properties as NoteProperties | null,
    'auto',
    'Before restore'
  );

  // Restore the note to the selected version
  const timestamp = new Date().toISOString();
  await noteDoc.patch({
    content: versionData.content,
    properties: versionData.properties as NoteProperties | null,
    updated_at: timestamp,
  });

  return true;
}

/**
 * Delete a version (soft delete)
 */
export async function deleteVersion(
  db: RxDatabase<DatabaseCollections>,
  versionId: string
): Promise<boolean> {
  const version = await db.note_versions.findOne(versionId).exec();
  if (!version) return false;

  const timestamp = new Date().toISOString();
  await version.patch({
    is_trashed: true,
    trashed_at: timestamp,
    updated_at: timestamp,
  });

  return true;
}

/**
 * Count versions for a note
 */
export async function countVersions(
  db: RxDatabase<DatabaseCollections>,
  noteId: string
): Promise<number> {
  const versions = await db.note_versions
    .find({
      selector: { note_id: noteId, is_trashed: false },
    })
    .exec();

  return versions.length;
}
