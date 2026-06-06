import type { ReactNode } from 'react';
import MaterialIcon from '../ui/MaterialIcon';

export interface EmptyStateProps {
  icon: string;
  title: string;
  description?: string;
  action?: ReactNode;
  variant?: 'default' | 'card' | 'inline';
  tone?: 'primary' | 'secondary' | 'tertiary' | 'emerald' | 'amber' | 'rose' | 'slate';
}

const TONE_BG: Record<NonNullable<EmptyStateProps['tone']>, string> = {
  primary: 'bg-primary/10 text-primary',
  secondary: 'bg-secondary/10 text-secondary',
  tertiary: 'bg-tertiary/10 text-tertiary',
  emerald: 'bg-emerald-500/10 text-emerald-700',
  amber: 'bg-amber-500/10 text-amber-700',
  rose: 'bg-rose-500/10 text-rose-700',
  slate: 'bg-slate-500/10 text-slate-600',
};

export default function EmptyState({
  icon,
  title,
  description,
  action,
  variant = 'default',
  tone = 'slate',
}: EmptyStateProps) {
  const iconWrap = `flex h-12 w-12 items-center justify-center rounded-2xl ${TONE_BG[tone]}`;

  if (variant === 'inline') {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-dashed border-outline-variant bg-surface-container-low/40 px-3 py-2.5 text-sm">
        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${TONE_BG[tone]}`}>
          <MaterialIcon name={icon} className="text-[18px]" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-on-surface">{title}</p>
          {description && <p className="text-xs text-on-surface-variant">{description}</p>}
        </div>
        {action}
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <div className="rounded-xl border border-dashed border-outline-variant bg-surface-container-low/40 p-5 text-center">
        <div className={`mx-auto ${iconWrap}`}>
          <MaterialIcon name={icon} className="text-2xl" />
        </div>
        <p className="mt-3 text-sm font-bold text-on-surface">{title}</p>
        {description && <p className="mt-1 text-xs text-on-surface-variant">{description}</p>}
        {action && <div className="mt-3 flex justify-center">{action}</div>}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center px-6 py-10 text-center">
      <div className={iconWrap}>
        <MaterialIcon name={icon} className="text-3xl" />
      </div>
      <p className="mt-4 text-base font-bold text-on-surface">{title}</p>
      {description && (
        <p className="mt-1 max-w-sm text-sm text-on-surface-variant">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
