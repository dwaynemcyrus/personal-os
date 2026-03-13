import { autocompletion, CompletionContext, CompletionResult } from '@codemirror/autocomplete';

export function wikilinkAutocomplete(getTitles: () => string[]) {
  return autocompletion({
    override: [
      (context: CompletionContext): CompletionResult | null => {
        const before = context.matchBefore(/\[\[[^\]\n]*$/);
        if (!before) return null;
        const query = before.text.slice(2).toLowerCase();
        const titles = getTitles().filter((t) =>
          t.toLowerCase().includes(query)
        );
        if (!titles.length && !context.explicit) return null;
        return {
          from: before.from,
          options: titles.map((title) => ({
            label: title,
            apply: (view, _c, from, _to) => {
              view.dispatch({
                changes: { from, to: context.pos, insert: `[[${title}]]` },
                selection: { anchor: from + title.length + 4 },
              });
            },
          })),
          filter: false,
        };
      },
    ],
  });
}
