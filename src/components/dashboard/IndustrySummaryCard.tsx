import { useEffect, useState } from 'react';
import MaterialIcon from '../ui/MaterialIcon';
import { fetchIndustryApi, type IndustryDetail } from '../../lib/industryApi';

interface IndustrySummaryCardProps {
  industrySlug: string;
  businessType?: 'new_brand' | 'existing_business';
  onViewAll?: () => void;
}

export default function IndustrySummaryCard({
  industrySlug,
  businessType = 'new_brand',
  onViewAll,
}: IndustrySummaryCardProps) {
  const [detail, setDetail] = useState<IndustryDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchIndustryApi(industrySlug)
      .then((d) => {
        if (!cancelled) setDetail(d);
      })
      .catch(() => {
        if (!cancelled) setDetail(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [industrySlug]);

  const isExisting = businessType === 'existing_business';
  const stages = detail ? (isExisting ? detail.mode2 : detail.mode1) : [];
  const modeLabel = isExisting ? 'Mode 2 · Audit' : 'Mode 1 · Build';

  if (loading && !detail) {
    return (
      <div className="flex items-center gap-2 rounded-2xl border border-outline-variant bg-surface-container-lowest p-4 text-xs text-on-surface-variant">
        <span className="h-3 w-3 animate-pulse rounded-full bg-secondary" />
        Loading {industrySlug} industry playbook…
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="rounded-2xl border border-dashed border-outline-variant bg-surface-container-low/40 p-5 text-sm">
        <p className="font-bold text-on-surface">Industry playbook not found</p>
        <p className="mt-1 text-xs text-on-surface-variant">
          Slug: <code>{industrySlug}</code> — re-run discovery to pick a 70+ industry playbook.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-primary/20 bg-surface-container-lowest shadow-sm">
      <div className="flex flex-wrap items-center gap-3 border-b border-outline-variant bg-gradient-to-r from-primary/5 via-secondary/5 to-tertiary/5 p-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-secondary text-2xl text-on-primary shadow">
          {detail.icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <p className="text-base font-bold text-on-surface">{detail.displayName}</p>
            <span className="rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[9px] font-bold uppercase text-primary">
              Industry OS
            </span>
            <span className="rounded-full border border-secondary/30 bg-secondary/10 px-2 py-0.5 text-[9px] font-bold uppercase text-secondary">
              {modeLabel}
            </span>
          </div>
          <p className="mt-0.5 line-clamp-1 text-xs text-on-surface-variant">{detail.blurb}</p>
        </div>
        {onViewAll && (
          <button
            type="button"
            onClick={onViewAll}
            className="rounded-lg border border-outline-variant bg-surface-container-low px-3 py-1.5 text-xs font-bold text-on-surface-variant hover:bg-primary/5 hover:text-primary"
          >
            View all stages
          </button>
        )}
      </div>

      {detail.keyMetrics.length > 0 && (
        <div className="grid grid-cols-3 gap-x-3 gap-y-2 border-b border-outline-variant px-4 py-2 sm:grid-cols-6">
          {detail.keyMetrics.map((m) => (
            <div key={m}>
              <p className="text-[9px] font-bold uppercase tracking-wider text-on-surface-variant">
                Metric
              </p>
              <p className="truncate text-[11px] font-semibold text-on-surface">{m}</p>
            </div>
          ))}
        </div>
      )}

      <div className="px-4 py-3">
        <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
          {stages.length} stages
        </p>
        <ol className="space-y-1">
          {stages.slice(0, 5).map((s, i) => (
            <li
              key={s.id}
              className="flex items-center gap-2 rounded-lg border border-outline-variant bg-surface-container-low/40 px-2.5 py-1.5 text-xs"
            >
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                {i + 1}
              </span>
              <p className="truncate font-semibold text-on-surface">{s.name}</p>
            </li>
          ))}
          {stages.length > 5 && (
            <li className="rounded-lg border border-dashed border-outline-variant px-2.5 py-1 text-center text-[10px] font-semibold text-on-surface-variant">
              +{stages.length - 5} more stages
            </li>
          )}
        </ol>
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <MaterialIcon name="support_agent" className="text-sm text-secondary" />
          {detail.primaryAgents.slice(0, 4).map((a) => (
            <span
              key={a}
              className="rounded-full border border-secondary/30 bg-secondary/5 px-2 py-0.5 text-[10px] font-semibold text-secondary"
            >
              {a}
            </span>
          ))}
          {detail.primaryAgents.length > 4 && (
            <span className="text-[10px] font-semibold text-on-surface-variant">
              +{detail.primaryAgents.length - 4} more
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
