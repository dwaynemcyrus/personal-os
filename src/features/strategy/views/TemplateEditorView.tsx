import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { ViewShell } from './ViewShell';
import { StrategyEditor } from './StrategyEditor';

type Props = { templateId: string; onBack: () => void };

type TemplateRow = {
  id: string;
  title: string | null;
  content: string | null;
};

function useTemplate(templateId: string) {
  return useQuery({
    queryKey: ['strategy', 'template', templateId],
    queryFn: async (): Promise<TemplateRow | null> => {
      const { data, error } = await supabase
        .from('items')
        .select('id, title, content')
        .eq('id', templateId)
        .maybeSingle();
      if (error) throw error;
      return data as TemplateRow | null;
    },
    staleTime: 0,
  });
}

export function TemplateEditorView({ templateId, onBack }: Props) {
  const { data: template, isLoading } = useTemplate(templateId);

  return (
    <ViewShell
      title={template?.title ?? 'Template'}
      onBack={onBack}
    >
      {isLoading && null}
      {!isLoading && template && (
        <StrategyEditor
          itemId={template.id}
          fallbackContent={template.content ?? ''}
        />
      )}
    </ViewShell>
  );
}
