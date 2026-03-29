/**
 * ArenaDocumentView — document view for Life Arena items (type === 'area').
 *
 * Renders a CodeMirror (StrategyEditor) source view for the arena document.
 * If the stored content is in the old format (missing ## Milestones), it
 * generates a full template as the fallback, preserving any existing vision text.
 */

import type { ItemRow } from '@/lib/db';
import { generateDocumentContent } from '../strategyUtils';
import { ViewShell } from './ViewShell';
import { StrategyEditor } from './StrategyEditor';

type Props = {
  doc: ItemRow;
  onBack: () => void;
};

/**
 * If the stored content is old-format (no ## Milestones section), generate
 * the full template, preserving any existing vision text.
 */
function getArenaContent(content: string | null | undefined): string {
  const raw = content ?? '';
  if (raw.includes('## Milestones')) return raw;

  // Extract vision from old format: ## Vision\n\n{text}
  const visionMatch = raw.match(/##\s*Vision\s*\n+([\s\S]*?)(?=\n##|$)/);
  const vision = visionMatch ? visionMatch[1].trim() : raw.trim();

  return generateDocumentContent('area', {
    vision,
    beAndFeel: '',
    milestones: '',
    assessmentExperience: '',
    assessmentProblem: '',
    assessmentPain: '',
    assessmentRelief: '',
    assessmentReward: '',
  });
}

export function ArenaDocumentView({ doc, onBack }: Props) {
  const fallback = getArenaContent(doc.content);

  return (
    <ViewShell title={doc.title ?? 'Life Arena'} onBack={onBack}>
      <StrategyEditor itemId={doc.id} fallbackContent={fallback} />
    </ViewShell>
  );
}
