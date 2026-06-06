import MaterialIcon from '../ui/MaterialIcon';
import { formatRelativeTime } from '../../utils/businessMetrics';

export interface DashboardDeliverable {
  id: string;
  title: string;
  summary: string;
  agent: string;
  createdAt: number;
  details?: string[];
}

interface DeliverablesListProps {
  deliverables: DashboardDeliverable[];
  onViewAll?: () => void;
}

export default function DeliverablesList({ deliverables, onViewAll }: DeliverablesListProps) {
  if (deliverables.length === 0) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-dashed border-outline-variant bg-surface-container-low/40 p-4 text-sm text-on-surface-variant">
        <MaterialIcon name="inventory_2" className="text-primary" />
        <p className="flex-1">
          No deliverables yet. As agents complete phases, their outputs land here.
        </p>
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {deliverables.slice(0, 5).map((d) => (
        <li
          key={d.id}
          className="rounded-xl border border-outline-variant bg-surface-container-lowest p-3"
        >
          <div className="flex items-start gap-2">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-emerald-500/40 bg-emerald-500/10 text-emerald-700">
              <MaterialIcon name="check_circle" className="text-[16px]" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-on-surface">{d.title}</p>
              {d.summary && (
                <p className="mt-0.5 line-clamp-2 text-[11px] text-on-surface-variant">
                  {d.summary}
                </p>
              )}
              {d.details && d.details.length > 0 && (
                <ul className="mt-1.5 space-y-0.5">
                  {d.details.slice(0, 3).map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-1.5 text-[10px] text-on-surface-variant"
                    >
                      <MaterialIcon name="subdirectory_arrow_right" className="text-[12px] text-emerald-600" />
                      <span className="truncate">{item}</span>
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[10px] text-on-surface-variant">
                <span className="font-semibold text-on-surface">{d.agent}</span>
                <span>·</span>
                <span>{formatRelativeTime(d.agent + d.createdAt, 0)}</span>
              </div>
            </div>
          </div>
        </li>
      ))}
      {onViewAll && deliverables.length > 5 && (
        <li className="text-center">
          <button
            type="button"
            onClick={onViewAll}
            className="text-xs font-bold text-secondary hover:underline"
          >
            View all {deliverables.length} deliverables →
          </button>
        </li>
      )}
    </ul>
  );
}
