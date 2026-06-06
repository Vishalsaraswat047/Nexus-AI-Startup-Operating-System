import MaterialIcon from '../ui/MaterialIcon';
import type { ContinuousDirective } from '../../lib/executionApi';

interface DirectivesListProps {
  directives: ContinuousDirective[];
  onOpenExecution?: () => void;
}

const STATUS_BADGE: Record<ContinuousDirective['status'], string> = {
  pending: 'border-outline-variant bg-surface-container-low text-on-surface-variant',
  running: 'border-primary/40 bg-primary/10 text-primary',
  completed: 'border-tertiary/40 bg-tertiary/10 text-tertiary',
  failed: 'border-rose-500/40 bg-rose-500/10 text-rose-700',
};

const STATUS_ICON: Record<ContinuousDirective['status'], string> = {
  pending: 'circle',
  running: 'play_circle',
  completed: 'check_circle',
  failed: 'error',
};

export default function DirectivesList({ directives, onOpenExecution }: DirectivesListProps) {
  const recent = directives.slice(-8).reverse();

  if (recent.length === 0) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-dashed border-outline-variant bg-surface-container-low/40 p-4 text-sm text-on-surface-variant">
        <MaterialIcon name="bolt" className="text-amber-500" />
        <p className="flex-1">
          No CEO directives yet. Once execution starts, the CEO will issue directives to agents in real
          time.
        </p>
        {onOpenExecution && (
          <button
            type="button"
            onClick={onOpenExecution}
            className="rounded-md bg-primary px-2.5 py-1 text-xs font-bold text-on-primary"
          >
            Open
          </button>
        )}
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {recent.map((d) => (
        <li
          key={d.id}
          className="rounded-xl border border-outline-variant bg-surface-container-lowest p-3"
        >
          <div className="flex items-start gap-2">
            <div
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${STATUS_BADGE[d.status]}`}
            >
              <MaterialIcon name={STATUS_ICON[d.status]} className="text-[16px]" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-on-surface">{d.title}</p>
              {d.rationale && (
                <p className="mt-0.5 line-clamp-2 text-[11px] italic text-on-surface-variant">
                  “{d.rationale}”
                </p>
              )}
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                <span className="rounded-full border border-outline-variant bg-surface-container-low px-2 py-0.5 text-[10px] font-semibold text-on-surface-variant">
                  → {d.assignee}
                </span>
                <span className="rounded-full border border-secondary/30 bg-secondary/5 px-2 py-0.5 text-[10px] font-semibold text-secondary">
                  {d.department}
                </span>
                <span
                  className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${STATUS_BADGE[d.status]}`}
                >
                  {d.status}
                </span>
              </div>
              {d.outputSummary && (
                <p className="mt-1 text-[10px] text-on-surface-variant">
                  ✓ {d.outputSummary}
                </p>
              )}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
