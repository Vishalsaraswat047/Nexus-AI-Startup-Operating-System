import MaterialIcon from '../ui/MaterialIcon';
import type { ExecutionView } from '../../lib/executionApi';

interface CeoStatusCardProps {
  view: ExecutionView | null;
  loading?: boolean;
  onOpenExecution?: () => void;
}

export default function CeoStatusCard({ view, loading, onOpenExecution }: CeoStatusCardProps) {
  if (loading && !view) {
    return (
      <div className="flex items-center gap-2 rounded-2xl border border-outline-variant bg-surface-container-lowest p-4 text-xs text-on-surface-variant">
        <span className="h-3 w-3 animate-pulse rounded-full bg-secondary" />
        Loading CEO status…
      </div>
    );
  }

  if (!view) {
    return (
      <div className="rounded-2xl border border-dashed border-outline-variant bg-surface-container-low/40 p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <MaterialIcon name="psychology" className="text-2xl" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold uppercase tracking-wider text-primary">CEO Agent</p>
            <p className="text-base font-bold text-on-surface">On standby</p>
            <p className="text-xs text-on-surface-variant">
              No execution has started yet. Open Execution Center to engage the CEO.
            </p>
          </div>
          {onOpenExecution && (
            <button
              type="button"
              onClick={onOpenExecution}
              className="rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-on-primary"
            >
              Start execution →
            </button>
          )}
        </div>
      </div>
    );
  }

  const execution = view.execution;
  const isContinuous =
    execution.status === 'completed' && Boolean(execution.continuousMode);
  const isAutoRun = Boolean(execution.autoRunAll) && execution.status === 'running' && !isContinuous;
  const isAwaiting = execution.status === 'awaiting_user';
  const isRunning = execution.status === 'running' && !isContinuous;

  const statusLabel = isContinuous
    ? `Round ${execution.continuousRound ?? 1} · Continuous brand operations`
    : isAutoRun
      ? 'Full autonomous run engaged'
      : isAwaiting
        ? 'Awaiting your approval'
        : isRunning
          ? 'CEO is delegating to departments'
          : 'CEO is on standby';

  const statusTone = isContinuous
    ? 'bg-tertiary/10 text-tertiary'
    : isAutoRun || isRunning
      ? 'bg-primary/10 text-primary'
      : isAwaiting
        ? 'bg-amber-500/10 text-amber-700'
        : 'bg-slate-500/10 text-slate-600';

  const dotTone = isContinuous || isAutoRun || isRunning
    ? 'bg-emerald-500 animate-pulse'
    : isAwaiting
      ? 'bg-amber-500'
      : 'bg-slate-400';

  const directives = execution.continuousDirectives ?? [];
  const runningDirectives = directives.filter((d) => d.status === 'running').length;
  const completedDirectives = directives.filter((d) => d.status === 'completed').length;
  const progress = view.phaseProgress;
  const progressPct = progress?.displayProgress ?? progress?.progress ?? 0;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 via-primary/5 to-secondary/10 p-5 shadow-sm">
      <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-12 -left-12 h-40 w-40 rounded-full bg-secondary/10 blur-3xl" />

      <div className="relative flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/70 text-on-primary shadow-lg">
              <MaterialIcon name="psychology" className="text-3xl" />
            </div>
            <span
              className={`absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full border-2 border-surface shadow ${dotTone}`}
            />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-primary">CEO Agent</p>
            <p className="text-lg font-bold text-on-surface">{statusLabel}</p>
          </div>
        </div>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <span
            className={`rounded-full border border-current/30 px-2.5 py-1 text-[10px] font-bold uppercase ${statusTone}`}
          >
            {execution.status}
          </span>
          {onOpenExecution && (
            <button
              type="button"
              onClick={onOpenExecution}
              className="rounded-lg border border-primary/30 bg-primary/5 px-3 py-1.5 text-xs font-bold text-primary hover:bg-primary/10"
            >
              Open Execution Center →
            </button>
          )}
        </div>
      </div>

      <div className="relative mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <div className="rounded-xl border border-outline-variant bg-surface-container-lowest/80 p-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Current phase</p>
          <p className="mt-1 truncate text-sm font-bold text-on-surface">
            {view.currentPhase?.name ?? '—'}
          </p>
        </div>
        <div className="rounded-xl border border-outline-variant bg-surface-container-lowest/80 p-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Phase progress</p>
          <p className="mt-1 text-sm font-bold text-on-surface">{progressPct}%</p>
          <div className="mt-1 h-1 w-full rounded-full bg-surface-container">
            <div
              className="h-1 rounded-full bg-primary"
              style={{ width: `${Math.min(100, progressPct)}%` }}
            />
          </div>
        </div>
        <div className="rounded-xl border border-outline-variant bg-surface-container-lowest/80 p-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Active directives</p>
          <p className="mt-1 text-sm font-bold text-on-surface">
            <span className="text-primary">{runningDirectives}</span>
            <span className="text-on-surface-variant"> running · </span>
            <span className="text-tertiary">{completedDirectives}</span>
            <span className="text-on-surface-variant"> done</span>
          </p>
        </div>
        <div className="rounded-xl border border-outline-variant bg-surface-container-lowest/80 p-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Active agents</p>
          <p className="mt-1 text-sm font-bold text-on-surface">
            {view.runningAgents.length}{' '}
            <span className="text-xs font-normal text-on-surface-variant">
              of {execution.activeAgents.length}
            </span>
          </p>
        </div>
      </div>

      {execution.activeDepartments.length > 0 && (
        <div className="relative mt-3 flex flex-wrap gap-1.5">
          {execution.activeDepartments.slice(0, 6).map((d) => (
            <span
              key={d}
              className="rounded-full border border-primary/30 bg-primary/5 px-2.5 py-0.5 text-[10px] font-semibold text-primary"
            >
              {d}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
