import { useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { queryClient } from '@/lib/queryClient';
import { exportNotesZip } from '@/lib/exportNotes';
import { importNotesFromFiles } from '@/lib/importNotes';
import { createBackup, restoreBackup, wipeAllData } from '@/lib/backup';
import { showToast } from '@/components/ui/Toast';
import { useUserSettings } from '@/hooks/useUserSettings';
import { upsertUserSettings, DEFAULT_USER_SETTINGS } from '@/lib/userSettings';
import type { ItemRow } from '@/lib/db';
import { TemplatePicker } from '@/features/notes/TemplatePicker/TemplatePicker';
import styles from './SettingsPage.module.css';

export function SettingsPage() {
  const settings = useUserSettings();

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [wipeConfirming, setWipeConfirming] = useState(false);
  const [wipeInput, setWipeInput] = useState('');
  const [isWiping, setIsWiping] = useState(false);
  const [isTemplatePickerOpen, setIsTemplatePickerOpen] = useState(false);
  const [dateFormat, setDateFormat] = useState('');
  const [timeFormat, setTimeFormat] = useState('');

  const importRef = useRef<HTMLInputElement>(null);
  const restoreRef = useRef<HTMLInputElement>(null);
  const restoreMergeRef = useRef<HTMLInputElement>(null);

  // Fetch template note title for the daily note template picker display
  const { data: templateNote } = useQuery({
    queryKey: ['note', settings.daily_note_template_id],
    queryFn: async (): Promise<ItemRow | null> => {
      if (!settings.daily_note_template_id) return null;
      const { data } = await supabase
        .from('items')
        .select('id, title')
        .eq('id', settings.daily_note_template_id)
        .maybeSingle();
      return data as ItemRow | null;
    },
    enabled: Boolean(settings.daily_note_template_id),
    staleTime: 60_000,
  });

  // Keep local format state in sync with loaded settings
  const effectiveDateFormat = settings.template_date_format || DEFAULT_USER_SETTINGS.template_date_format;
  const effectiveTimeFormat = settings.template_time_format || DEFAULT_USER_SETTINGS.template_time_format;
  const displayDateFormat = dateFormat || effectiveDateFormat;
  const displayTimeFormat = timeFormat || effectiveTimeFormat;

  const handleRefreshAndSync = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    showToast('Refreshing…');
    try {
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }
      if ('databases' in indexedDB) {
        const dbs = await (indexedDB as typeof indexedDB & {
          databases: () => Promise<{ name?: string }[]>;
        }).databases();
        await Promise.all(
          dbs.map(
            (d) =>
              new Promise<void>((resolve) => {
                if (!d.name) { resolve(); return; }
                const req = indexedDB.deleteDatabase(d.name);
                req.onsuccess = () => resolve();
                req.onerror = () => resolve();
              })
          )
        );
      }
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map((r) => r.unregister()));
      }
      queryClient.clear();
      window.location.reload();
    } catch {
      setIsRefreshing(false);
      showToast('Refresh failed — please try again.');
    }
  };

  const handleExportNotes = async () => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      const count = await exportNotesZip((msg) => showToast(msg));
      showToast(`Exported ${count} note${count !== 1 ? 's' : ''}.`);
    } catch {
      showToast('Export failed — please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setIsImporting(true);
    try {
      const { imported, skipped } = await importNotesFromFiles(files, (msg) => showToast(msg));
      showToast(`Imported ${imported} note${imported !== 1 ? 's' : ''}${skipped > 0 ? `, skipped ${skipped}` : ''}.`);
      queryClient.invalidateQueries({ queryKey: ['notes'] });
    } catch {
      showToast('Import failed — is this a valid .md or .zip file?');
    } finally {
      setIsImporting(false);
    }
    e.target.value = '';
  };

  const handleBackup = async () => {
    if (isBackingUp) return;
    setIsBackingUp(true);
    try {
      await createBackup((msg) => showToast(msg));
      showToast('Backup downloaded.');
    } catch {
      showToast('Backup failed — please try again.');
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleRestore = async (e: React.ChangeEvent<HTMLInputElement>, merge: boolean) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const confirmed = window.confirm(
      merge
        ? 'Merge backup into current data? Existing items will not be overwritten.'
        : 'This will permanently replace ALL your data with the backup. Are you sure?'
    );
    if (!confirmed) { e.target.value = ''; return; }
    setIsRestoring(true);
    if (!merge) showToast('Replacing all data…');
    try {
      const { restored } = await restoreBackup(file, merge, (msg) => showToast(msg));
      if (merge) {
        showToast(`Merged ${restored} record${restored !== 1 ? 's' : ''}.`);
        queryClient.invalidateQueries();
      }
    } catch {
      showToast('Restore failed — is this a valid backup file?');
    } finally {
      setIsRestoring(false);
    }
    e.target.value = '';
  };

  const handleWipe = async () => {
    if (wipeInput !== 'delete') return;
    setIsWiping(true);
    showToast('Wiping all data…');
    try {
      await wipeAllData((msg) => showToast(msg));
      queryClient.clear();
      window.location.reload();
    } catch {
      showToast('Wipe failed — please try again.');
      setIsWiping(false);
    }
  };

  const handleDailyTemplateSelect = async (templateId: string | null) => {
    setIsTemplatePickerOpen(false);
    await upsertUserSettings({ daily_note_template_id: templateId });
    queryClient.invalidateQueries({ queryKey: ['user-settings'] });
  };

  const handleDateFormatBlur = async () => {
    const val = dateFormat.trim();
    if (!val || val === effectiveDateFormat) return;
    await upsertUserSettings({ template_date_format: val });
    queryClient.invalidateQueries({ queryKey: ['user-settings'] });
  };

  const handleTimeFormatBlur = async () => {
    const val = timeFormat.trim();
    if (!val || val === effectiveTimeFormat) return;
    await upsertUserSettings({ template_time_format: val });
    queryClient.invalidateQueries({ queryKey: ['user-settings'] });
  };

  const dailyTemplateName = templateNote?.title ?? (settings.daily_note_template_id ? 'Loading…' : null);

  return (
    <div className={styles.page}>

      {/* Templates */}
      <section className={styles.section}>
        <div className={styles.sectionLabel}>Templates</div>

        <div className={styles.templateRow}>
          <span className={styles.templateRowLabel}>Daily note template</span>
          <button
            type="button"
            className={`${styles.templateRowValue} ${!dailyTemplateName ? styles.templateNone : ''}`}
            onClick={() => setIsTemplatePickerOpen(true)}
          >
            {dailyTemplateName ?? 'None'}
          </button>
        </div>

        <div className={styles.formatRow}>
          <span className={styles.formatLabel}>Date format</span>
          <input
            type="text"
            className={styles.formatInput}
            value={displayDateFormat}
            onChange={(e) => setDateFormat(e.target.value)}
            onBlur={() => void handleDateFormatBlur()}
            onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            placeholder="YYYY-MM-DD"
          />
        </div>
        <p className={styles.formatHint}>Tokens: YYYY MM DD — used by {'{{date}}'} in templates</p>

        <div className={styles.formatRow}>
          <span className={styles.formatLabel}>Time format</span>
          <input
            type="text"
            className={styles.formatInput}
            value={displayTimeFormat}
            onChange={(e) => setTimeFormat(e.target.value)}
            onBlur={() => void handleTimeFormatBlur()}
            onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            placeholder="HH:mm:ss"
          />
        </div>
        <p className={styles.formatHint}>Tokens: HH mm ss — used by {'{{time}}'} in templates</p>
      </section>

      {/* Sync */}
      <section className={styles.section}>
        <div className={styles.sectionLabel}>Sync</div>
        <button
          type="button"
          className={styles.row}
          onClick={() => void handleRefreshAndSync()}
          disabled={isRefreshing}
          aria-busy={isRefreshing}
        >
          {isRefreshing ? 'Refreshing…' : 'Refresh & Sync'}
        </button>
      </section>

      {/* Export */}
      <section className={styles.section}>
        <div className={styles.sectionLabel}>Export</div>
        <button
          type="button"
          className={styles.row}
          onClick={() => void handleExportNotes()}
          disabled={isExporting}
          aria-busy={isExporting}
        >
          {isExporting ? 'Exporting…' : 'Export Notes as ZIP'}
        </button>
      </section>

      {/* Import */}
      <section className={styles.section}>
        <div className={styles.sectionLabel}>Import</div>
        <button
          type="button"
          className={styles.row}
          onClick={() => importRef.current?.click()}
          disabled={isImporting}
          aria-busy={isImporting}
        >
          {isImporting ? 'Importing…' : 'Import Notes (.md or .zip)'}
        </button>
        <input
          ref={importRef}
          type="file"
          accept=".md,.zip"
          multiple
          style={{ display: 'none' }}
          onChange={(e) => void handleImport(e)}
        />
      </section>

      {/* Backup & Restore */}
      <section className={styles.section}>
        <div className={styles.sectionLabel}>Backup &amp; Restore</div>
        <button
          type="button"
          className={styles.row}
          onClick={() => void handleBackup()}
          disabled={isBackingUp}
          aria-busy={isBackingUp}
        >
          {isBackingUp ? 'Backing up…' : 'Create Backup'}
        </button>
        <button
          type="button"
          className={styles.row}
          onClick={() => restoreMergeRef.current?.click()}
          disabled={isRestoring}
          aria-busy={isRestoring}
        >
          {isRestoring ? 'Restoring…' : 'Restore — Merge'}
        </button>
        <button
          type="button"
          className={`${styles.row} ${styles.rowDanger}`}
          onClick={() => restoreRef.current?.click()}
          disabled={isRestoring}
          aria-busy={isRestoring}
        >
          Restore — Replace All
        </button>
        <input ref={restoreMergeRef} type="file" accept=".json" style={{ display: 'none' }} onChange={(e) => void handleRestore(e, true)} />
        <input ref={restoreRef} type="file" accept=".json" style={{ display: 'none' }} onChange={(e) => void handleRestore(e, false)} />
      </section>

      {/* Danger Zone */}
      <section className={styles.section}>
        <div className={styles.sectionLabel}>Danger Zone</div>
        {!wipeConfirming ? (
          <button
            type="button"
            className={`${styles.row} ${styles.rowDanger}`}
            onClick={() => setWipeConfirming(true)}
            disabled={isWiping}
          >
            Wipe All Data
          </button>
        ) : (
          <div className={styles.wipeConfirm}>
            <p className={styles.wipeWarning}>
              This permanently deletes all your data. Type <strong>delete</strong> to confirm.
            </p>
            <input
              type="text"
              className={styles.wipeInput}
              placeholder="delete"
              value={wipeInput}
              onChange={(e) => setWipeInput(e.target.value)}
              autoFocus
            />
            <div className={styles.wipeActions}>
              <button
                type="button"
                className={styles.wipeCancel}
                onClick={() => { setWipeConfirming(false); setWipeInput(''); }}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.wipeSubmit}
                onClick={() => void handleWipe()}
                disabled={wipeInput !== 'delete'}
              >
                Wipe All Data
              </button>
            </div>
          </div>
        )}
      </section>

      <TemplatePicker
        open={isTemplatePickerOpen}
        onOpenChange={setIsTemplatePickerOpen}
        onSelect={(id) => void handleDailyTemplateSelect(id)}
        showBlankOption
        blankLabel="None (no template)"
      />
    </div>
  );
}
