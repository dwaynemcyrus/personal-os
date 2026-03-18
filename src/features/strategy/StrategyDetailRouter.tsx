import { useNavigationActions } from '@/components/providers';
import { isStrategySection } from './types';
import { CurrentCycleView } from './views/CurrentCycleView';
import { ScorecardView } from './views/ScorecardView';
import { WeeklyPlansListView } from './views/WeeklyPlansListView';
import { WeeklyPlanDetailView } from './views/WeeklyPlanDetailView';
import { ReviewsListView } from './views/ReviewsListView';
import { LifeAreasListView } from './views/LifeAreasListView';
import { ArchiveView } from './views/ArchiveView';
import { GoalDetailView } from './views/GoalDetailView';
import { DocumentView } from './views/DocumentView';
import { TemplatesListView } from './views/TemplatesListView';
import { TemplateEditorView } from './views/TemplateEditorView';

type ParsedId =
  | { kind: 'section'; section: string }
  | { kind: 'goal'; id: string }
  | { kind: 'weekly-plan'; id: string }
  | { kind: 'document'; id: string }
  | { kind: 'template'; id: string };

function parseStrategyId(strategyId: string): ParsedId {
  if (isStrategySection(strategyId)) return { kind: 'section', section: strategyId };

  const colonIdx = strategyId.indexOf(':');
  if (colonIdx !== -1) {
    const prefix = strategyId.slice(0, colonIdx);
    const id = strategyId.slice(colonIdx + 1);
    if (prefix === 'goal') return { kind: 'goal', id };
    if (prefix === 'weekly-plan') return { kind: 'weekly-plan', id };
    if (prefix === 'document') return { kind: 'document', id };
    if (prefix === 'template') return { kind: 'template', id };
  }

  // Bare UUID → treat as a document
  return { kind: 'document', id: strategyId };
}

type Props = { strategyId: string };

export function StrategyDetailRouter({ strategyId }: Props) {
  const { goBack } = useNavigationActions();
  const parsed = parseStrategyId(strategyId);

  if (parsed.kind === 'section') {
    switch (parsed.section) {
      case 'current-cycle':
        return <CurrentCycleView onBack={goBack} />;
      case 'scorecard':
        return <ScorecardView onBack={goBack} />;
      case 'weekly-plans':
        return <WeeklyPlansListView onBack={goBack} />;
      case 'reviews':
        return <ReviewsListView onBack={goBack} />;
      case 'life-areas':
        return <LifeAreasListView onBack={goBack} />;
      case 'archive':
        return <ArchiveView onBack={goBack} />;
      case 'templates':
        return <TemplatesListView onBack={goBack} />;
      default:
        return <DocumentView documentId={strategyId} onBack={goBack} />;
    }
  }

  if (parsed.kind === 'goal') {
    return <GoalDetailView goalId={parsed.id} onBack={goBack} />;
  }

  if (parsed.kind === 'weekly-plan') {
    return <WeeklyPlanDetailView planId={parsed.id} onBack={goBack} />;
  }

  if (parsed.kind === 'template') {
    return <TemplateEditorView templateId={parsed.id} onBack={goBack} />;
  }

  return <DocumentView documentId={parsed.id} onBack={goBack} />;
}
