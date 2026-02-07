'use client';

import { useCallback } from 'react';
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetClose,
} from '@/components/ui/Sheet';
import type { FocusLevel } from './extensions/focus';
import styles from './FocusSettings.module.css';

export type WritingMode = 'normal' | 'typewriter' | 'focus' | 'both';

export type WritingModeSettings = {
  mode: WritingMode;
  focusLevel: FocusLevel;
  focusIntensity: number;
};

type FocusSettingsProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: WritingModeSettings;
  onSettingsChange: (settings: WritingModeSettings) => void;
};

export function FocusSettings({
  open,
  onOpenChange,
  settings,
  onSettingsChange,
}: FocusSettingsProps) {
  const handleModeChange = useCallback(
    (mode: WritingMode) => {
      onSettingsChange({ ...settings, mode });
    },
    [settings, onSettingsChange]
  );

  const handleFocusLevelChange = useCallback(
    (focusLevel: FocusLevel) => {
      onSettingsChange({ ...settings, focusLevel });
    },
    [settings, onSettingsChange]
  );

  const handleIntensityChange = useCallback(
    (focusIntensity: number) => {
      onSettingsChange({ ...settings, focusIntensity });
    },
    [settings, onSettingsChange]
  );

  const showFocusOptions = settings.mode === 'focus' || settings.mode === 'both';

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className={styles.sheet}
        aria-label="Writing mode settings"
      >
        <header className={styles.header}>
          <SheetTitle className={styles.title}>Writing Mode</SheetTitle>
          <SheetClose asChild>
            <button
              type="button"
              className={styles.close}
              aria-label="Close settings"
            >
              <CloseIcon />
            </button>
          </SheetClose>
        </header>

        <div className={styles.settings}>
          {/* Mode Selection */}
          <div className={styles.field}>
            <label className={styles.label}>Mode</label>
            <div className={styles.modeGrid}>
              <button
                type="button"
                className={styles.modeButton}
                data-active={settings.mode === 'normal'}
                onClick={() => handleModeChange('normal')}
              >
                <span className={styles.modeIcon}>
                  <NormalIcon />
                </span>
                <span className={styles.modeName}>Normal</span>
              </button>
              <button
                type="button"
                className={styles.modeButton}
                data-active={settings.mode === 'typewriter'}
                onClick={() => handleModeChange('typewriter')}
              >
                <span className={styles.modeIcon}>
                  <TypewriterIcon />
                </span>
                <span className={styles.modeName}>Typewriter</span>
              </button>
              <button
                type="button"
                className={styles.modeButton}
                data-active={settings.mode === 'focus'}
                onClick={() => handleModeChange('focus')}
              >
                <span className={styles.modeIcon}>
                  <FocusIcon />
                </span>
                <span className={styles.modeName}>Focus</span>
              </button>
              <button
                type="button"
                className={styles.modeButton}
                data-active={settings.mode === 'both'}
                onClick={() => handleModeChange('both')}
              >
                <span className={styles.modeIcon}>
                  <BothIcon />
                </span>
                <span className={styles.modeName}>Both</span>
              </button>
            </div>
          </div>

          {/* Focus Level (only when focus is enabled) */}
          {showFocusOptions && (
            <>
              <div className={styles.field}>
                <label className={styles.label}>Focus Level</label>
                <div className={styles.segmented}>
                  <button
                    type="button"
                    className={styles.segmentedButton}
                    data-active={settings.focusLevel === 'line'}
                    onClick={() => handleFocusLevelChange('line')}
                  >
                    Line
                  </button>
                  <button
                    type="button"
                    className={styles.segmentedButton}
                    data-active={settings.focusLevel === 'sentence'}
                    onClick={() => handleFocusLevelChange('sentence')}
                  >
                    Sentence
                  </button>
                  <button
                    type="button"
                    className={styles.segmentedButton}
                    data-active={settings.focusLevel === 'paragraph'}
                    onClick={() => handleFocusLevelChange('paragraph')}
                  >
                    Paragraph
                  </button>
                </div>
              </div>

              {/* Focus Intensity */}
              <div className={styles.field}>
                <label className={styles.label}>
                  Dim Intensity: {Math.round(settings.focusIntensity * 100)}%
                </label>
                <input
                  type="range"
                  className={styles.slider}
                  min="0.1"
                  max="0.5"
                  step="0.05"
                  value={settings.focusIntensity}
                  onChange={(e) => handleIntensityChange(parseFloat(e.target.value))}
                />
                <div className={styles.sliderLabels}>
                  <span>More dim</span>
                  <span>Less dim</span>
                </div>
              </div>
            </>
          )}

          {/* Keyboard shortcuts hint */}
          <div className={styles.shortcuts}>
            <span className={styles.shortcutLabel}>Shortcuts:</span>
            <kbd className={styles.kbd}>Cmd+Shift+T</kbd>
            <span className={styles.shortcutText}>Typewriter</span>
            <kbd className={styles.kbd}>Cmd+Shift+F</kbd>
            <span className={styles.shortcutText}>Focus</span>
          </div>
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

function NormalIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

function TypewriterIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M7 15h10" />
      <circle cx="12" cy="10" r="1" fill="currentColor" />
    </svg>
  );
}

function FocusIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="3" />
      <circle cx="12" cy="12" r="8" strokeDasharray="4 2" />
    </svg>
  );
}

function BothIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
