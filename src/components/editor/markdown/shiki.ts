import type { BundledLanguage, BundledTheme, Highlighter } from 'shiki';

const SHIKI_LANGUAGES = [
  'javascript',
  'typescript',
  'yaml',
  'html',
  'css',
  'json',
  'markdown',
  'python',
] as const;

const SHIKI_LANGUAGE_SET = new Set<string>(SHIKI_LANGUAGES);

const LANGUAGE_ALIASES: Record<string, (typeof SHIKI_LANGUAGES)[number]> = {
  js: 'javascript',
  ts: 'typescript',
  yml: 'yaml',
  md: 'markdown',
  py: 'python',
};

const SHIKI_THEME: BundledTheme = 'ayu-dark';

let highlighterPromise: Promise<Highlighter> | null = null;

export const getShikiHighlighter = (): Promise<Highlighter> => {
  if (!highlighterPromise) {
    highlighterPromise = import('shiki').then(({ getSingletonHighlighter }) =>
      getSingletonHighlighter({
        themes: [SHIKI_THEME],
        langs: [...SHIKI_LANGUAGES] as BundledLanguage[],
      })
    );
  }

  return highlighterPromise;
};

export const resolveShikiLanguage = (lang?: string | null): BundledLanguage | null => {
  if (!lang) return null;
  const normalized = lang.trim().toLowerCase();
  const resolved = LANGUAGE_ALIASES[normalized] ?? normalized;

  if (SHIKI_LANGUAGE_SET.has(resolved)) {
    return resolved as BundledLanguage;
  }

  return null;
};

export const SHIKI_THEME_NAME: BundledTheme = SHIKI_THEME;
