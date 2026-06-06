import { useMemo, useState } from 'react';
import type { BusinessTwin, Milestone } from '../types';
import MaterialIcon from './ui/MaterialIcon';
import { StitchPageHeader, VisionGateBanner } from './stitch/StitchPageHeader';
import { stageIndex, STAGE_TIMELINE } from '../utils/businessMetrics';
import { formatCurrency } from '../utils/businessMetrics';
import type { VisionWorkflowState } from '../lib/visionWorkflow';
import { isVisionReady } from '../lib/visionWorkflow';

interface TimelineControlProps {
  twin: BusinessTwin;
  milestones: Milestone[];
  logs: string[];
  onAddLog: (msg: string) => void;
  visionWorkflow?: VisionWorkflowState;
}

type ViewMode = 'Quarterly' | 'Monthly' | 'Weekly';

export default function TimelineControl({
  twin,
  milestones,
  logs,
  onAddLog,
  visionWorkflow,
}: TimelineControlProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('Quarterly');
  const ready = isVisionReady(visionWorkflow);
  const currentIdx = stageIndex(twin.stage);

  const months = useMemo(() => {
    const now = new Date();
    const labels: string[] = [];
    for (let i = 0; i < 6; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      labels.push(d.toLocaleString('en-US', { month: 'short' }).toUpperCase());
    }
    return labels;
  }, []);

  const ganttRows = milestones.length > 0
    ? milestones.slice(0, 6)
    : twin.goals.slice(0, 4).map((g, i) => ({
        id: `goal-${i}`,
        name: g,
        progress: 10 + i * 15,
        project: twin.industry,
        status: 'pending' as const,
        tasks: [],
        dependencies: [],
      }));

  const stageCards = useMemo(() => {
    return STAGE_TIMELINE.slice(0, 6).map((phase, i) => {
      const done = i < currentIdx;
      const active = i === currentIdx;
      const ms = milestones.filter((m) =>
        m.project?.toLowerCase().includes(phase.label.toLowerCase().slice(0, 4)),
      );
      const items =
        ms.length > 0
          ? ms.flatMap((m) => m.tasks.slice(0, 2).map((t) => ({ name: t.name, completed: t.status === 'completed' })))
          : [
              { name: `${phase.label} checkpoint`, completed: done },
              { name: twin.goals[0] || 'Strategic objective', completed: false },
            ].slice(0, 3);
      return {
        name: phase.label,
        status: done ? ('completed' as const) : active ? ('current' as const) : ('upcoming' as const),
        date: active ? `${twin.stage} · now` : done ? 'Complete' : 'Forecasted',
        milestones: items,
      };
    });
  }, [currentIdx, milestones, twin]);

  const feed = logs.slice(0, 5).map((log, i) => ({
    id: `log-${i}`,
    title: log.split(':')[0] || 'System',
    body: log,
    time: i === 0 ? 'Just now' : `${i * 2 + 1}h ago`,
    tag: log.includes('Risk') ? 'Alert' : log.includes('Vision') ? 'Vision' : 'Operations',
  }));

  return (
    <div className="space-y-stack-lg">
      <StitchPageHeader
        title="Timeline & Milestones"
        subtitle={`${twin.name} · ${formatCurrency(twin.budget)} budget · Strategic view of project lifecycles`}
        breadcrumb={{ parent: 'Executive', current: 'Timeline' }}
        action={
          <div className="flex gap-2">
            <div className="inline-flex rounded-lg border border-outline-variant bg-surface-container-lowest p-1">
              {(['Quarterly', 'Monthly', 'Weekly'] as ViewMode[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => {
                    setViewMode(m);
                    onAddLog(`Timeline: View switched to ${m}.`);
                  }}
                  className={`rounded-md px-4 py-1.5 text-label-md ${
                    viewMode === m
                      ? 'bg-primary text-on-primary'
                      : 'text-on-surface-variant hover:bg-surface-container'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
            <button
              type="button"
              className="flex items-center gap-2 rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-2 text-label-md hover:bg-surface-container"
            >
              <MaterialIcon name="filter_list" />
              Filters
            </button>
          </div>
        }
      />

      <VisionGateBanner ready={ready} />

      <section className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest shadow-sm">
        <div className="flex items-center justify-between border-b border-outline-variant p-6">
          <h3 className="font-label-md uppercase tracking-widest text-primary">Active major initiatives</h3>
          <div className="flex gap-4 text-label-sm">
            <span className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-secondary" /> In progress
            </span>
            <span className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-primary" /> Complete
            </span>
            <span className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-surface-container-highest" /> Planning
            </span>
          </div>
        </div>
        <div className="overflow-x-auto p-6">
          <div className="min-w-[800px]">
            <div className="mb-4 grid grid-cols-6 border-b border-outline-variant pb-2">
              {months.map((m) => (
                <div key={m} className="text-label-sm font-semibold text-on-surface-variant">
                  {m}
                </div>
              ))}
            </div>
            <div className="relative space-y-6">
              <div
                className="absolute top-0 z-10 h-full w-px bg-error shadow-[0_0_8px_rgba(186,26,26,0.5)]"
                style={{ left: '55%' }}
              >
                <span className="absolute -left-8 -top-6 rounded-full bg-error px-2 py-0.5 text-[9px] font-bold text-on-error">
                  TODAY
                </span>
              </div>
              {ganttRows.map((row, idx) => {
                const pct = 'progress' in row ? row.progress : 0;
                const left = `${(idx * 12) % 40}%`;
                const width = `${Math.max(pct, 8)}%`;
                const barClass =
                  pct >= 80 ? 'bg-primary' : pct >= 30 ? 'bg-secondary' : 'bg-surface-container-highest border border-outline-variant';
                return (
                  <div key={row.id} className="group">
                    <div className="mb-2 flex justify-between">
                      <span className="text-body-sm font-semibold">{row.name}</span>
                      <span className="text-[10px] text-on-surface-variant">{pct}% complete</span>
                    </div>
                    <div className="relative h-8 w-full overflow-hidden rounded-full bg-surface-container">
                      <div
                        className={`absolute top-0 h-full transition-all group-hover:opacity-90 ${barClass}`}
                        style={{ left, width }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-gutter lg:grid-cols-12">
        <section className="space-y-stack-md lg:col-span-8">
          <h3 className="px-1 font-label-md uppercase tracking-widest text-primary">Recent event stream</h3>
          {feed.length === 0 ? (
            <p className="text-sm text-on-surface-variant">Activity appears as you run agents and vision steps.</p>
          ) : (
            feed.map((ev) => (
              <div
                key={ev.id}
                className="flex gap-6 rounded-xl border border-outline-variant bg-surface-container-lowest p-6 transition-all hover:shadow-md"
              >
                <div className="flex flex-col items-center gap-2">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full border border-outline-variant bg-surface-container text-primary">
                    <MaterialIcon name="deployed_code" filled />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="mb-2 flex justify-between">
                    <div>
                      <h4 className="font-bold text-primary">{ev.title}</h4>
                      <p className="text-label-sm font-semibold text-secondary">{ev.time}</p>
                    </div>
                    <span className="rounded bg-secondary/10 px-2 py-0.5 text-[10px] font-bold uppercase text-secondary">
                      {ev.tag}
                    </span>
                  </div>
                  <p className="text-body-sm text-on-surface-variant">{ev.body}</p>
                </div>
              </div>
            ))
          )}
        </section>

        <section className="rounded-xl border border-outline-variant bg-surface-container-lowest p-6 lg:col-span-4">
          <h3 className="mb-4 font-label-md uppercase tracking-widest text-primary">Stage milestones</h3>
          <div className="space-y-4">
            {stageCards.map((stage) => (
              <div key={stage.name} className="rounded-lg border border-outline-variant/50 p-3">
                <div className="mb-2 flex justify-between">
                  <span className="text-sm font-bold">{stage.name}</span>
                  <span
                    className={`text-[10px] font-bold uppercase ${
                      stage.status === 'completed'
                        ? 'text-emerald-600'
                        : stage.status === 'current'
                          ? 'text-secondary'
                          : 'text-outline'
                    }`}
                  >
                    {stage.status}
                  </span>
                </div>
                <p className="mb-2 text-[10px] text-outline">{stage.date}</p>
                <ul className="space-y-1">
                  {stage.milestones.map((m) => (
                    <li key={m.name} className="flex items-center gap-2 text-xs text-on-surface-variant">
                      <MaterialIcon
                        name={m.completed ? 'check_circle' : 'circle'}
                        className={`text-sm ${m.completed ? 'text-green-600' : 'text-outline'}`}
                      />
                      {m.name}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
