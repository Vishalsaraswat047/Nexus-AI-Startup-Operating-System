import { useEffect, useState } from 'react';
import MaterialIcon from '../ui/MaterialIcon';
import { fetchIndustryApi, type IndustryDetail } from '../../lib/industryApi';

interface StageExecutionState {
  completedKeys: string[];
  currentKey: string | null;
  pendingKeys: string[];
}

interface IndustryOSPanelProps {
  industrySlug: string | null | undefined;
  businessCategory?: string;
  mode?: 'new' | 'existing';
  executionState?: StageExecutionState | null;
}

const STAGE_KEYS = [
  'research',
  'business_model',
  'pricing',
  'operations',
  'hiring',
  'sales',
  'customer_acquisition',
  'brand',
  'website',
  'social',
  'listings',
  'scaling',
];

export default function IndustryOSPanel({
  industrySlug,
  businessCategory,
  mode = 'new',
  executionState,
}: IndustryOSPanelProps) {
  const [detail, setDetail] = useState<IndustryDetail | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!industrySlug) {
      setDetail(null);
      return;
    }
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

  function getStageState(stageId: string): 'completed' | 'current' | 'pending' {
    if (!executionState) return 'pending';
    if (executionState.currentKey === stageId) return 'current';
    if (executionState.completedKeys.includes(stageId)) return 'completed';
    return 'pending';
  }

  function stageProgressPercent(stageId: string): number {
    if (!executionState) return 0;
    const stageIdx = STAGE_KEYS.indexOf(stageId);
    if (stageIdx < 0) return 0;
    const completedCount = executionState.completedKeys.filter(k => STAGE_KEYS.indexOf(k) < stageIdx).length;
    if (executionState.completedKeys.includes(stageId)) return 100;
    if (executionState.currentKey === stageId) return 50;
    return 0;
  }

  if (!industrySlug) {
    return (
      <div className="rounded-2xl border border-dashed border-outline-variant bg-surface-container-low p-5 text-sm text-on-surface-variant">
        <p className="font-bold text-on-surface">No specific industry playbook selected</p>
        <p className="mt-1">
          Re-run the CEO discovery to pick from 70+ industry-specific workflows (hotel, restaurant,
          coaching, SaaS, car wash, jewellery, etc.).
        </p>
      </div>
    );
  }

  if (loading || !detail) {
    return (
      <div className="flex items-center gap-2 rounded-2xl border border-outline-variant bg-surface-container-lowest p-4 text-xs text-on-surface-variant">
        <span className="h-3 w-3 animate-pulse rounded-full bg-secondary" />
        Loading {industrySlug} industry playbook…
      </div>
    );
  }

  const stages = mode === 'existing' ? detail.mode2 : detail.mode1;
  const stageLabel = mode === 'existing' ? 'Mode 2 — Audit & Optimize' : 'Mode 1 — Build From Zero';

  return (
    <div className="overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 via-secondary/5 to-tertiary/5 shadow-sm">
      <div className="grid gap-4 p-5 md:grid-cols-[auto,1fr]">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-secondary text-3xl text-on-primary shadow-md">
          {detail.icon}
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-bold text-on-surface">{detail.displayName}</h2>
            <span className="rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase text-primary">
              Industry OS
            </span>
            {businessCategory && (
              <span className="rounded-full border border-outline-variant bg-surface-container-low px-2 py-0.5 text-[10px] font-semibold text-on-surface-variant">
                {businessCategory}
              </span>
            )}
            {executionState && executionState.completedKeys.length > 0 && (
              <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                {executionState.completedKeys.length}/{STAGE_KEYS.length} stages done
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-on-surface-variant">{detail.blurb}</p>
        </div>
      </div>

      {detail.keyMetrics.length > 0 && (
        <div className="grid grid-cols-2 gap-2 border-y border-primary/10 bg-surface-container-lowest/60 px-5 py-3 sm:grid-cols-3 md:grid-cols-6">
          {detail.keyMetrics.map((m) => (
            <div key={m} className="text-center sm:text-left">
              <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                Metric
              </p>
              <p className="truncate text-xs font-semibold text-on-surface">{m}</p>
            </div>
          ))}
        </div>
      )}

      <div className="grid gap-4 p-5 md:grid-cols-2">
        <div>
          <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary">
            <MaterialIcon name="rocket_launch" className="text-[14px]" />
            {stageLabel} · {stages.length} stages
          </p>
          <ol className="mt-2 space-y-1.5">
            {stages.slice(0, 8).map((s, i) => {
              const state = getStageState(s.id);
              const progress = stageProgressPercent(s.id);
              return (
                <li
                  key={s.id}
                  className={`flex items-start gap-2 rounded-lg border p-2 text-sm ${
                    state === 'completed'
                      ? 'border-emerald-500/30 bg-emerald-500/5'
                      : state === 'current'
                        ? 'border-primary/40 bg-primary/5'
                        : 'border-outline-variant bg-surface-container-lowest/80'
                  }`}
                >
                  <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                    state === 'completed'
                      ? 'bg-emerald-500 text-white'
                      : state === 'current'
                        ? 'bg-primary text-white animate-pulse'
                        : 'bg-outline-variant text-on-surface-variant'
                  }`}>
                    {state === 'completed' ? (
                      <MaterialIcon name="check" className="text-[12px]" />
                    ) : (
                      i + 1
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className={`font-bold ${state === 'current' ? 'text-primary' : state === 'completed' ? 'text-emerald-700' : 'text-on-surface'}`}>
                      {s.name}
                    </p>
                    <p className="line-clamp-1 text-[11px] text-on-surface-variant">
                      {s.agents.join(' · ')}
                    </p>
                    {state === 'current' && progress > 0 && (
                      <div className="mt-1 h-1 w-full rounded-full bg-outline-variant">
                        <div
                          className="h-1 rounded-full bg-primary transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
            {stages.length > 8 && (
              <li className="rounded-lg border border-dashed border-outline-variant px-2 py-1 text-center text-[11px] font-semibold text-on-surface-variant">
                +{stages.length - 8} more stages
              </li>
            )}
          </ol>
        </div>

        <div>
          <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-secondary">
            <MaterialIcon name="support_agent" className="text-[14px]" />
            Core agents
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {detail.primaryAgents.map((a) => (
              <span
                key={a}
                className="rounded-full border border-secondary/30 bg-secondary/5 px-2.5 py-0.5 text-[11px] font-semibold text-secondary"
              >
                {a}
              </span>
            ))}
          </div>

          {detail.topLoopQuestions.length > 0 && (
            <div className="mt-4">
              <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-tertiary">
                <MaterialIcon name="loop" className="text-[14px]" />
                CEO continuous loop
              </p>
              <ul className="mt-2 space-y-1.5">
                {detail.topLoopQuestions.map((q, i) => (
                  <li
                    key={i}
                    className="rounded-md border border-tertiary/20 bg-tertiary/5 px-2.5 py-1.5 text-[11px] text-on-surface"
                  >
                    <span className="mr-1 font-bold text-tertiary">Q{i + 1}.</span>
                    {q}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
