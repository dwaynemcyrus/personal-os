import {
  Document,
  YAMLMap,
  isMap,
  parseDocument,
} from 'yaml';

const FRONTMATTER_DELIMITER = /^---\s*$/;
const FRONTMATTER_END = /^(---|\.\.\.)\s*$/;

export type FrontmatterParseResult = {
  body: string;
  frontmatter: string | null;
  document: Document | null;
  properties: Record<string, unknown> | null;
  errors: string[];
  warnings: string[];
  lineEnding: string;
  hasFrontmatter: boolean;
};

type FrontmatterSplitResult = {
  body: string;
  frontmatter: string | null;
  lineEnding: string;
  hasFrontmatter: boolean;
  errors: string[];
};

const detectLineEnding = (content: string) => (content.includes('\r\n') ? '\r\n' : '\n');

const splitFrontmatter = (content: string): FrontmatterSplitResult => {
  const lineEnding = detectLineEnding(content);
  const lines = content.split(/\r?\n/);

  if (lines.length === 0 || !FRONTMATTER_DELIMITER.test(lines[0] ?? '')) {
    return {
      body: content,
      frontmatter: null,
      lineEnding,
      hasFrontmatter: false,
      errors: [],
    };
  }

  let endIndex = -1;
  for (let i = 1; i < lines.length; i += 1) {
    if (FRONTMATTER_END.test(lines[i] ?? '')) {
      endIndex = i;
      break;
    }
  }

  if (endIndex === -1) {
    return {
      body: content,
      frontmatter: null,
      lineEnding,
      hasFrontmatter: true,
      errors: ['Missing closing frontmatter delimiter.'],
    };
  }

  return {
    frontmatter: lines.slice(1, endIndex).join(lineEnding),
    body: lines.slice(endIndex + 1).join(lineEnding),
    lineEnding,
    hasFrontmatter: true,
    errors: [],
  };
};

const coerceProperties = (value: unknown) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
};

export const parseFrontmatter = (content: string): FrontmatterParseResult => {
  const split = splitFrontmatter(content);

  if (!split.frontmatter) {
    return {
      body: split.body,
      frontmatter: null,
      document: null,
      properties: null,
      errors: split.errors,
      warnings: [],
      lineEnding: split.lineEnding,
      hasFrontmatter: split.hasFrontmatter,
    };
  }

  const document = parseDocument(split.frontmatter, { keepSourceTokens: true });
  const errors = [
    ...split.errors,
    ...document.errors.map((error) => error.message),
  ];
  const warnings = document.warnings.map((warning) => warning.message);

  if (document.contents && !isMap(document.contents)) {
    errors.push('Frontmatter must be a key/value mapping.');
  }

  const properties = errors.length === 0 ? coerceProperties(document.toJSON()) : null;

  return {
    body: split.body,
    frontmatter: split.frontmatter,
    document,
    properties,
    errors,
    warnings,
    lineEnding: split.lineEnding,
    hasFrontmatter: split.hasFrontmatter,
  };
};

export const mergePropertiesIntoFrontmatter = (
  document: Document | null,
  properties: Record<string, unknown> | null
): Document | null => {
  if (!properties || Object.keys(properties).length === 0) {
    return null;
  }

  const nextDocument = document ?? new Document();

  if (!nextDocument.contents || !isMap(nextDocument.contents)) {
    nextDocument.contents = new YAMLMap();
  }

  const map = nextDocument.contents as YAMLMap;
  const allowedKeys = new Set(Object.keys(properties));

  for (const pair of [...map.items]) {
    const rawKey =
      typeof pair.key === 'string'
        ? pair.key
        : (pair.key as { value?: unknown }).value ?? pair.key;
    const key = String(rawKey);
    if (!allowedKeys.has(key)) {
      map.delete(rawKey);
    }
  }

  for (const [key, value] of Object.entries(properties)) {
    map.set(key, value);
  }

  return nextDocument;
};

export const serializeFrontmatter = (
  document: Document,
  lineEnding: string
): string => {
  const yaml = document.toString().trimEnd();
  const normalized = yaml.replace(/\n/g, lineEnding);

  return [
    `---`,
    normalized,
    `---`,
    '',
  ].join(lineEnding);
};

export const replaceFrontmatterBlock = (
  content: string,
  document: Document | null
): string => {
  const split = splitFrontmatter(content);
  const lineEnding = split.lineEnding;

  if (!document) {
    if (!split.hasFrontmatter) {
      return content;
    }
    return split.body;
  }

  const block = serializeFrontmatter(document, lineEnding);
  if (split.hasFrontmatter) {
    return `${block}${split.body}`;
  }

  return `${block}${content}`;
};
