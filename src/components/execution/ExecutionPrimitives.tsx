import { ReactNode } from 'react';
import MaterialIcon from '../ui/MaterialIcon';
import { ProgressLine } from '../stitch/StitchPrimitives';

export function ExecutionPanel({
  title,
  subtitle,
  children,
  action,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-6 shadow-sm">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-primary">{title}</h3>
          {subtitle && <p className="mt-1 text-sm text-on-surface-variant">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function StatChip({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | number;
  icon: string;
}) {
  return (
    <div className="rounded-xl border border-outline-variant bg-surface-container-low px-4 py-3">
      <div className="flex items-center gap-2 text-on-surface-variant">
        <MaterialIcon name={icon} className="text-[18px]" />
        <span className="text-xs font-semibold uppercase tracking-wide">{label}</span>
      </div>
      <p className="mt-1 text-xl font-bold text-primary">{value}</p>
    </div>
  );
}

export function PhaseProgressCard({
  name,
  stats,
  active,
}: {
  name: string;
  stats: {
    total: number;
    completed: number;
    running: number;
    blocked: number;
    progress: number;
    displayProgress?: number;
    status: string;
  };
  active?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-4 ${
        active ? 'border-primary bg-surface-container-low' : 'border-outline-variant bg-surface-container-lowest'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="font-bold text-on-surface">{name}</p>
        <span className="text-xs font-semibold uppercase text-on-surface-variant">{stats.status}</span>
      </div>
      <p className="mt-2 text-2xl font-bold text-primary">
        {stats.displayProgress ?? stats.progress}%
      </p>
      <ProgressLine pct={stats.displayProgress ?? stats.progress} />
      <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-on-surface-variant sm:grid-cols-4">
        <span>Tasks: {stats.total}</span>
        <span>Done: {stats.completed}</span>
        <span>Running: {stats.running}</span>
        <span>Blocked: {stats.blocked}</span>
      </div>
    </div>
  );
}

export function AgentPill({ name }: { name: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-outline-variant bg-surface-container-low px-3 py-1 text-xs font-semibold text-on-surface">
      <MaterialIcon name="smart_toy" className="text-[14px] text-secondary" />
      {name}
    </span>
  );
}
