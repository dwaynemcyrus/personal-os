import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { fetchUserSettings, DEFAULT_USER_SETTINGS } from '@/lib/userSettings';
import { replaceTemplateVariables } from '@/lib/templates';
import { getTemplateLookupKey } from '@/lib/templateSeed';

export type StoredTemplate = {
  id: string;
  subtype: string | null;
  title: string | null;
  content: string | null;
};

export async function fetchAllDocumentTemplates(): Promise<StoredTemplate[]> {
  const { data, error } = await supabase
    .from('items')
    .select('id, subtype, title, content')
    .eq('type', 'template')
    .is('date_trashed', null)
    .order('subtype', { ascending: true });

  if (error) throw error;
  return (data ?? []) as StoredTemplate[];
}

export async function fetchDocumentTemplate(
  type: string,
  subtype: string | null
): Promise<StoredTemplate | null> {
  const templateKey = getTemplateLookupKey(type, subtype);

  const { data, error } = await supabase
    .from('items')
    .select('id, subtype, title, content')
    .eq('type', 'template')
    .eq('subtype', templateKey)
    .is('date_trashed', null)
    .maybeSingle();

  if (error) throw error;
  return (data as StoredTemplate | null) ?? null;
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
