'use client';

import { useSyncExternalStore } from 'react';
import styles from './Toast.module.css';

type ToastState = {
  id: number;
  message: string;
};

let currentToast: ToastState | null = null;
let hideTimer: ReturnType<typeof setTimeout> | null = null;
const listeners = new Set<() => void>();

const emitChange = () => {
  listeners.forEach((listener) => listener());
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

const getSnapshot = () => currentToast;
const getServerSnapshot = () => null;

export const showToast = (message: string) => {
  currentToast = { id: Date.now(), message };
  emitChange();

  if (hideTimer) {
    clearTimeout(hideTimer);
  }

  hideTimer = setTimeout(() => {
    currentToast = null;
    emitChange();
  }, 4000);
};

export function ToastHost() {
  const toast = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  if (!toast) return null;

  return (
    <div className={styles.toast} role="status" aria-live="polite" aria-atomic="true">
      <div className={styles.toastCard} key={toast.id}>
        {toast.message}
      </div>
    </div>
  );
}
