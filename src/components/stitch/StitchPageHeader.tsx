import { ReactNode } from 'react';
import MaterialIcon from '../ui/MaterialIcon';

export function StitchPageHeader({
  title,
  subtitle,
  action,
  breadcrumb,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  breadcrumb?: { parent: string; current: string };
}) {
  return (
    <div className="mb-stack-lg flex flex-wrap items-end justify-between gap-4">
      <div>
        {breadcrumb && (
          <nav className="mb-2 flex items-center gap-2 text-label-sm text-on-surface-variant">
            <span>{breadcrumb.parent}</span>
            <MaterialIcon name="chevron_right" className="text-[12px]" />
            <span>{breadcrumb.current}</span>
          </nav>
        )}
        <h2 className="text-headline-lg font-headline-lg tracking-tight text-primary">{title}</h2>
        {subtitle && (
          <p className="mt-1 font-body-md text-on-surface-variant">{subtitle}</p>
        )}
      </div>
      {action}
    </div>
  );
}

export function VisionGateBanner({
  ready,
  message = 'Complete the CEO → Research vision cycle on Command Center to unlock autonomous actions on this page.',
}: {
  ready: boolean;
  message?: string;
}) {
  if (ready) return null;
  return (
    <div className="mb-stack-md flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50/80 px-4 py-3">
      <MaterialIcon name="info" className="shrink-0 text-amber-700" />
      <p className="text-sm text-amber-950">{message}</p>
    </div>
  );
}

export function ActivitySparkline({ progress }: { progress: number }) {
  const pts = [28, 25, 20, 22, 15, 18, 10, 12, 5, 8, 2];
  const scale = progress / 100;
  const d = pts
    .map((y, i) => {
      const x = (i / (pts.length - 1)) * 100;
      const adjusted = 28 - (28 - y) * scale;
      return `${i === 0 ? 'M' : 'L'}${x},${adjusted}`;
    })
    .join(' ');
  return (
    <svg className="h-8 w-24 stroke-secondary fill-none stroke-2" viewBox="0 0 100 30">
      <path d={d} />
    </svg>
  );
}
