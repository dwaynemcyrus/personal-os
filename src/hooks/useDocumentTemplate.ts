import { useQuery } from '@tanstack/react-query';
import { stringify } from 'yaml';
import { supabase } from '@/lib/supabase';
import type { DocumentPatch, DocumentRow, NewDocument } from '@/lib/db';
import { fetchUserSettings, DEFAULT_USER_SETTINGS } from '@/lib/userSettings';
import { replaceTemplateVariables } from '@/lib/templates';
import { getTemplateLookupKey } from '@/lib/templateSeed';
import { parseRawToDocumentPatch } from '@/lib/documentRaw';

export type StoredTemplateSummary = {
  id: string;
  type: string;
  subtype: string | null;
  title: string | null;
  content: string | null;
};

export type StoredTemplateDocument = DocumentRow;

export async function fetchAllDocumentTemplates(): Promise<StoredTemplateSummary[]> {
  const { data, error } = await supabase
    .from('items')
    .select('id, type, subtype, title, content')
    .eq('is_template', true)
    .is('date_trashed', null)
    .order('type', { ascending: true })
    .order('subtype', { ascending: true });

  if (error) throw error;
  return (data ?? []) as StoredTemplateSummary[];
}

export async function fetchDocumentTemplate(
  type: string,
  subtype: string | null
): Promise<StoredTemplateDocument | null> {
  const { data, error } = await supabase
    .from('items')
    .select('*')
    .eq('is_template', true)
    .eq('type', type)
    .eq('subtype', subtype)
    .is('date_trashed', null)
    .maybeSingle();

  if (error) throw error;
  return (data as StoredTemplateDocument | null) ?? null;
}

export async function fetchTemplateContent(
  type: string,
  subtype: string | null
): Promise<string | null> {
  const template = await fetchDocumentTemplate(type, subtype);
  return template ? (template.content ?? '') : null;
}

type ResolveTemplateOptions = {
  title?: string | null;
  date?: Date;
};

const ARRAY_PATCH_KEYS = [
  'resources',
  'dependencies',
  'tags',
  'frequency',
  'stack',
  'modules',
  'be_and_feel',
  'chains',
  'platforms',
] as const;

const BOOLEAN_PATCH_KEYS = [
  'workbench',
  'blocked',
  'published',
  'for_sale',
  'sold',
  'exhibited',
] as const;

const NUMBER_PATCH_KEYS = [
  'rating',
  'price',
  'deal_value',
  'lag_target',
  'lag_actual',
  'attendees',
  'total_sent',
  'total_comments',
  'total_responses',
  'chapter_count',
  'series_position',
  'episode',
  'season',
] as const;

const SCALAR_PATCH_KEYS = [
  'title',
  'status',
  'subtype',
  'access',
  'area',
  'slug',
  'tier',
  'growth',
  'medium',
  'format',
  'asset_type',
  'author',
  'bookmark',
  'certificate_link',
  'collection',
  'contact_status',
  'contact_type',
  'course',
  'cover_alt_text',
  'cover_link',
  'currency',
  'currency_primary',
  'currency_secondary',
  'contacted_last',
  'date',
  'date_created',
  'date_delivered',
  'date_modified',
  'date_trashed',
  'deal_status',
  'delivery',
  'description',
  'dimensions',
  'duration_target',
  'end_date',
  'genre',
  'institution',
  'instructor',
  'isbn',
  'issue',
  'lag_measure',
  'lag_unit',
  'manuscript',
  'month',
  'month_expenses_chf',
  'month_profit_chf',
  'month_revenue_chf',
  'mood',
  'next_follow_up',
  'outcome',
  'platform',
  'principle',
  'problem',
  'project',
  'recording_link',
  'repo',
  'score_overall',
  'series',
  'solution',
  'source',
  'start_date',
  'subtitle',
  'target',
  'theme',
  'unit',
  'url',
  'week',
  'year',
] as const;

const NON_MERGED_TEMPLATE_KEYS = new Set<keyof DocumentPatch>([
  'title',
  'status',
  'subtype',
  'access',
  'date_created',
  'date_modified',
  'date_trashed',
]);

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((entry): entry is string => typeof entry === 'string' && entry.trim().length > 0);
}

function buildTemplateRawDocument(template: StoredTemplateDocument): string {
  const frontmatter = template.frontmatter ?? {};
  const yamlString = stringify(frontmatter, { lineWidth: 0 }).trimEnd();
  if (!yamlString) return template.content ?? '';
  return `---\n${yamlString}\n---\n${template.content ?? ''}`;
}

function getResolvedTemplatePatch(rawTemplate: string): DocumentPatch {
  return parseRawToDocumentPatch(rawTemplate);
}

export async function resolveTemplateDocumentPatch(
  type: string,
  subtype: string | null,
  options: ResolveTemplateOptions = {}
): Promise<DocumentPatch | null> {
  const template = await fetchDocumentTemplate(type, subtype);
  if (!template) return null;

  const resolvedRaw = await resolveTemplateBody(buildTemplateRawDocument(template), options);
  return getResolvedTemplatePatch(resolvedRaw);
}

function isMeaningfulString(value: string | null | undefined): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function mergeExtraFrontmatter(
  currentFrontmatter: Record<string, unknown> | null | undefined,
  incomingFrontmatter: Record<string, unknown> | null | undefined
): Record<string, unknown> | null {
  const next: Record<string, unknown> = { ...(currentFrontmatter ?? {}) };

  for (const [key, value] of Object.entries(incomingFrontmatter ?? {})) {
    if (!(key in next)) {
      next[key] = value;
    }
  }

  return Object.keys(next).length > 0 ? next : null;
}

export function mergeTemplatePatchIntoDocument(
  doc: DocumentRow,
  templatePatch: DocumentPatch
): DocumentPatch {
  const patch: DocumentPatch = {
    content: templatePatch.content ?? null,
  };

  for (const key of ARRAY_PATCH_KEYS) {
    const incoming = templatePatch[key];
    const normalized = normalizeStringArray(incoming);
    if (normalized.length > 0 && doc[key].length === 0) {
      patch[key] = normalized;
    }
  }

  for (const key of BOOLEAN_PATCH_KEYS) {
    const incoming = templatePatch[key];
    if (incoming === true && doc[key] !== true) {
      patch[key] = true;
    }
  }

  for (const key of NUMBER_PATCH_KEYS) {
    const incoming = templatePatch[key];
    if (typeof incoming === 'number' && doc[key] === null) {
      patch[key] = incoming;
    }
  }

  for (const key of SCALAR_PATCH_KEYS) {
    if (NON_MERGED_TEMPLATE_KEYS.has(key)) continue;
    const incoming = templatePatch[key];
    const current = doc[key];
    if (isMeaningfulString(incoming as string | null | undefined) && !isMeaningfulString(current as string | null | undefined)) {
      patch[key] = incoming as never;
    }
  }

  patch.frontmatter = mergeExtraFrontmatter(doc.frontmatter, templatePatch.frontmatter ?? null);
  return patch;
}

export async function instantiateDocumentFromTemplate(
  type: string,
  subtype: string | null,
  options: ResolveTemplateOptions & {
    cuid: string;
    defaultStatus: string;
    title?: string | null;
  }
): Promise<NewDocument | null> {
  const patch = await resolveTemplateDocumentPatch(type, subtype, options);
  if (!patch) return null;

  const scalar = patch as Partial<Record<(typeof SCALAR_PATCH_KEYS)[number], string | null>>;
  const arrays = patch as Partial<Record<(typeof ARRAY_PATCH_KEYS)[number], unknown>>;
  const booleans = patch as Partial<Record<(typeof BOOLEAN_PATCH_KEYS)[number], boolean>>;
  const numbers = patch as Partial<Record<(typeof NUMBER_PATCH_KEYS)[number], number | null>>;

  return {
    cuid: options.cuid,
    type,
    subtype: subtype ?? null,
    is_template: false,
    title: options.title ?? scalar.title ?? null,
    status: options.defaultStatus,
    access: scalar.access ?? 'private',
    area: scalar.area ?? null,
    workbench: booleans.workbench ?? false,
    resources: normalizeStringArray(arrays.resources),
    dependencies: normalizeStringArray(arrays.dependencies),
    blocked: booleans.blocked ?? false,
    slug: scalar.slug ?? null,
    published: booleans.published ?? false,
    tier: scalar.tier ?? null,
    growth: scalar.growth ?? null,
    rating: numbers.rating ?? null,
    medium: scalar.medium ?? null,
    format: scalar.format ?? null,
    asset_type: scalar.asset_type ?? null,
    for_sale: booleans.for_sale ?? false,
    sold: booleans.sold ?? false,
    exhibited: booleans.exhibited ?? false,
    price: numbers.price ?? null,
    deal_value: numbers.deal_value ?? null,
    lag_target: numbers.lag_target ?? null,
    lag_actual: numbers.lag_actual ?? null,
    attendees: numbers.attendees ?? null,
    total_sent: numbers.total_sent ?? null,
    total_comments: numbers.total_comments ?? null,
    total_responses: numbers.total_responses ?? null,
    chapter_count: numbers.chapter_count ?? null,
    series_position: numbers.series_position ?? null,
    episode: numbers.episode ?? null,
    season: numbers.season ?? null,
    date_delivered: scalar.date_delivered ?? null,
    contacted_last: scalar.contacted_last ?? null,
    next_follow_up: scalar.next_follow_up ?? null,
    frequency: normalizeStringArray(arrays.frequency),
    stack: normalizeStringArray(arrays.stack),
    modules: normalizeStringArray(arrays.modules),
    be_and_feel: normalizeStringArray(arrays.be_and_feel),
    chains: normalizeStringArray(arrays.chains),
    platforms: normalizeStringArray(arrays.platforms),
    author: scalar.author ?? null,
    bookmark: scalar.bookmark ?? null,
    certificate_link: scalar.certificate_link ?? null,
    collection: scalar.collection ?? null,
    contact_status: scalar.contact_status ?? null,
    contact_type: scalar.contact_type ?? null,
    course: scalar.course ?? null,
    cover_alt_text: scalar.cover_alt_text ?? null,
    cover_link: scalar.cover_link ?? null,
    currency: scalar.currency ?? null,
    currency_primary: scalar.currency_primary ?? null,
    currency_secondary: scalar.currency_secondary ?? null,
    date: scalar.date ?? null,
    deal_status: scalar.deal_status ?? null,
    delivery: scalar.delivery ?? null,
    description: scalar.description ?? null,
    dimensions: scalar.dimensions ?? null,
    duration_target: scalar.duration_target ?? null,
    genre: scalar.genre ?? null,
    institution: scalar.institution ?? null,
    instructor: scalar.instructor ?? null,
    isbn: scalar.isbn ?? null,
    issue: scalar.issue ?? null,
    lag_measure: scalar.lag_measure ?? null,
    lag_unit: scalar.lag_unit ?? null,
    manuscript: scalar.manuscript ?? null,
    month: scalar.month ?? null,
    month_expenses_chf: scalar.month_expenses_chf ?? null,
    month_profit_chf: scalar.month_profit_chf ?? null,
    month_revenue_chf: scalar.month_revenue_chf ?? null,
    mood: scalar.mood ?? null,
    outcome: scalar.outcome ?? null,
    platform: scalar.platform ?? null,
    principle: scalar.principle ?? null,
    problem: scalar.problem ?? null,
    project: scalar.project ?? null,
    recording_link: scalar.recording_link ?? null,
    repo: scalar.repo ?? null,
    score_overall: scalar.score_overall ?? null,
    series: scalar.series ?? null,
    solution: scalar.solution ?? null,
    source: scalar.source ?? null,
    subtitle: scalar.subtitle ?? null,
    target: scalar.target ?? null,
    theme: scalar.theme ?? null,
    unit: scalar.unit ?? null,
    url: scalar.url ?? null,
    week: scalar.week ?? null,
    year: scalar.year ?? null,
    start_date: scalar.start_date ?? null,
    end_date: scalar.end_date ?? null,
    date_created: scalar.date_created ?? options.date?.toISOString() ?? new Date().toISOString(),
    date_modified: null,
    date_trashed: null,
    tags: normalizeStringArray(arrays.tags),
    content: patch.content ?? null,
    frontmatter: patch.frontmatter ?? null,
  };
}

export async function resolveTemplateBody(
  content: string,
  options: ResolveTemplateOptions = {}
): Promise<string> {
  const settings = await fetchUserSettings();

  return replaceTemplateVariables(content, {
    date: options.date ?? new Date(),
    dateFormat: settings?.template_date_format ?? DEFAULT_USER_SETTINGS.template_date_format,
    timeFormat: settings?.template_time_format ?? DEFAULT_USER_SETTINGS.template_time_format,
    title: options.title ?? '',
  });
}

export async function resolveDocumentTemplateContent(
  type: string,
  subtype: string | null,
  options: ResolveTemplateOptions = {}
): Promise<string | null> {
  const content = await fetchTemplateContent(type, subtype);
  if (content === null) return null;
  return resolveTemplateBody(content, options);
}

export function useDocumentTemplate(
  type: string,
  subtype: string | null
): {
  content: string | null;
  templateId: string | null;
  isLoading: boolean;
} {
  const templateKey = getTemplateLookupKey(type, subtype);
  const { data, isLoading } = useQuery({
    queryKey: ['document-template', templateKey],
    queryFn: () => fetchDocumentTemplate(type, subtype),
    staleTime: 60_000,
  });

  return {
    content: data ? (data.content ?? '') : null,
    templateId: data?.id ?? null,
    isLoading,
  };
}
