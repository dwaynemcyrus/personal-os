import { useSyncExternalStore } from 'react';

type Listener = () => void;

const titles = new Map<string, string>();
const listeners = new Set<Listener>();

const notify = () => {
  listeners.forEach((listener) => listener());
};

const getTitle = (path: string) => {
  if (!path) return null;
  return titles.get(path) ?? null;
};

const setTitle = (path: string, title: string | null) => {
  if (!path) return;
  if (!title) {
    titles.delete(path);
  } else {
    titles.set(path, title);
  }
  notify();
};

const subscribe = (listener: Listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const usePageTitleValue = (path: string) =>
  useSyncExternalStore(
    subscribe,
    () => getTitle(path),
    () => null
  );

export const usePageTitle = (path: string) => ({
  setTitle: (title: string | null) => setTitle(path, title),
});
