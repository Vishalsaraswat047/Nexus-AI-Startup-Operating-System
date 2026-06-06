import type { ReactNode } from 'react';
import MaterialIcon from '../ui/MaterialIcon';

export interface PageHeaderStat {
  label: string;
  value: ReactNode;
  icon?: string;
  tone?: 'primary' | 'secondary' | 'tertiary' | 'emerald' | 'amber' | 'rose' | 'indigo' | 'violet' | 'teal' | 'slate';
}

const TONE_BG: Record<NonNullable<PageHeaderStat['tone']>, string> = {
  primary: 'bg-primary/10 text-primary',
  secondary: 'bg-secondary/10 text-secondary',
  tertiary: 'bg-tertiary/10 text-tertiary',
  emerald: 'bg-emerald-500/10 text-emerald-700',
  amber: 'bg-amber-500/10 text-amber-700',
  rose: 'bg-rose-500/10 text-rose-700',
  indigo: 'bg-indigo-500/10 text-indigo-700',
  violet: 'bg-violet-500/10 text-violet-700',
  teal: 'bg-teal-500/10 text-teal-700',
  slate: 'bg-slate-500/10 text-slate-700',
};

export interface PageHeaderProps {
  icon?: string;
  title: string;
  subtitle?: string;
  greeting?: string;
  breadcrumb?: { parent: string; current: string };
  action?: ReactNode;
  stats?: PageHeaderStat[];
  variant?: 'hero' | 'compact';
}

export default function PageHeader({
  icon,
  title,
  subtitle,
  greeting,
  breadcrumb,
  action,
  stats,
  variant = 'hero',
}: PageHeaderProps) {
  if (variant === 'compact') {
    return (
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          {breadcrumb && (
            <nav className="mb-2 flex items-center gap-2 text-xs text-on-surface-variant">
              <span>{breadcrumb.parent}</span>
              <MaterialIcon name="chevron_right" className="text-[12px]" />
              <span className="font-semibold text-on-surface">{breadcrumb.current}</span>
            </nav>
          )}
          <h2 className="text-2xl font-bold tracking-tight text-primary">{title}</h2>
          {subtitle && <p className="mt-1 text-sm text-on-surface-variant">{subtitle}</p>}
        </div>
        {action}
      </div>
    );
  }

  return (
    <div className="relative mb-6 overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-secondary/5 to-tertiary/10 p-6 shadow-sm">
      <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-secondary/10 blur-3xl" />

      <div className="relative flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-start gap-4">
          {icon && (
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/70 text-on-primary shadow-lg">
              <MaterialIcon name={icon} className="text-3xl" />
            </div>
          )}
          <div>
            {breadcrumb && (
              <nav className="mb-1 flex items-center gap-1.5 text-xs text-on-surface-variant">
                <span>{breadcrumb.parent}</span>
                <MaterialIcon name="chevron_right" className="text-[12px]" />
                <span className="font-semibold text-on-surface">{breadcrumb.current}</span>
              </nav>
            )}
            {greeting && (
              <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                {greeting}
              </p>
            )}
            <h1 className="text-3xl font-bold tracking-tight text-on-surface">{title}</h1>
            {subtitle && <p className="mt-1 text-sm text-on-surface-variant">{subtitle}</p>}
          </div>
        </div>
        {action && <div className="flex flex-wrap items-center gap-2">{action}</div>}
      </div>

      {stats && stats.length > 0 && (
        <div className="relative mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {stats.map((s, i) => {
            const tone = s.tone ?? 'primary';
            const toneCls = TONE_BG[tone];
            return (
              <div
                key={i}
                className="rounded-xl border border-outline-variant bg-surface-container-lowest/70 p-3 backdrop-blur"
              >
                <div className="flex items-center gap-1.5">
                  {s.icon && (
                    <div className={`flex h-5 w-5 items-center justify-center rounded ${toneCls}`}>
                      <MaterialIcon name={s.icon} className="text-[14px]" />
                    </div>
                  )}
                  <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                    {s.label}
                  </p>
                </div>
                <p className="mt-1 truncate text-base font-bold text-on-surface">{s.value}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
