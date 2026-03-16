import { useRef, useState } from 'react';
import { Sheet, SheetContent, SheetClose, SheetTitle } from '@/components/ui/Sheet';
import { CloseIcon } from '@/components/ui/icons';
import { exportNotesZip } from '@/lib/exportNotes';
import { importNotesFromFiles } from '@/lib/importNotes';
import { createBackup, restoreBackup } from '@/lib/backup';
import { queryClient } from '@/lib/queryClient';
import { showToast } from '@/components/ui/Toast';
import styles from './SettingsSheet.module.css';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function SettingsSheet({ open, onOpenChange }: Props) {
  const [status, setStatus] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const importRef = useRef<HTMLInputElement>(null);
  const restoreRef = useRef<HTMLInputElement>(null);
  const restoreMergeRef = useRef<HTMLInputElement>(null);

  const handleRefreshAndSync = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    onOpenChange(false);
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

  const handleRestore = async (
    e: React.ChangeEvent<HTMLInputElement>,
    merge: boolean
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const confirmed = window.confirm(
      merge
        ? 'Merge backup into current data? Existing items will not be overwritten.'
        : 'This will permanently replace ALL your data with the backup. Are you sure?'
    );
    if (!confirmed) { e.target.value = ''; return; }
    setStatus('Restoring…');
    try {
      const { restored } = await restoreBackup(file, merge);
      setStatus(`Restored ${restored} record${restored !== 1 ? 's' : ''}.`);
    } catch {
      setStatus('Restore failed — is this a valid backup file?');
    }
    e.target.value = '';
  };

  return (
    <Sheet open={open} onOpenChange={(next) => { if (!next) setStatus(null); onOpenChange(next); }}>
      <SheetContent side="bottom" className={styles.sheet} ariaLabel="Settings">
        <header className={styles.header}>
          <SheetTitle className={styles.headerTitle}>Settings</SheetTitle>
          <SheetClose asChild>
            <button type="button" className={styles.closeBtn} aria-label="Close settings">
              <CloseIcon />
            </button>
          </SheetClose>
        </header>

        <div className={styles.body}>
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
            >
              Restore — Merge
            </button>
            <button
              type="button"
              className={`${styles.row} ${styles.rowDanger}`}
              onClick={() => restoreRef.current?.click()}
            >
              Restore — Replace All
            </button>
            <input
              ref={restoreMergeRef}
              type="file"
              accept=".json"
              style={{ display: 'none' }}
              onChange={(e) => handleRestore(e, true)}
            />
            <input
              ref={restoreRef}
              type="file"
              accept=".json"
              style={{ display: 'none' }}
              onChange={(e) => handleRestore(e, false)}
            />
          </section>

          {status && <p className={styles.status}>{status}</p>}
        </div>
      </SheetContent>
    </Sheet>
  );
}
