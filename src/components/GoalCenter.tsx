import { useMemo, useState } from 'react';
import { getApiHeaders } from '../utils/apiKeys';
import { Milestone, TaskItem, BusinessTwin, RiskItem } from '../types';
import MaterialIcon from './ui/MaterialIcon';
import { ProgressLine } from './stitch/StitchPrimitives';
import { formatCurrency } from '../utils/businessMetrics';
import type { VisionWorkflowState } from '../lib/visionWorkflow';

interface GoalCenterProps {
  twin: BusinessTwin | null;
  milestones: Milestone[];
  risks?: RiskItem[];
  onUpdateMilestone: (updated: Milestone) => void;
  onDecomposeGoal: (newMilestone: Milestone) => void;
  isDecomposing: boolean;
  onAddLog: (msg: string) => void;
  visionWorkflow?: VisionWorkflowState;
}

function statusBadge(m: Milestone) {
  if (m.progress < 40 && m.status !== 'completed')
    return { label: 'RISK DETECTED', class: 'bg-red-50 text-red-700 border-red-200' };
  if (m.status === 'completed')
    return { label: 'COMPLETED', class: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
  return { label: 'ON TRACK', class: 'bg-green-50 text-green-700 border-green-200' };
}

function initiativeTag(m: Milestone): { label: string; className: string } {
  const p = (m.project || '').toLowerCase();
  if (p.includes('security') || p.includes('legal'))
    return {
      label: 'Security',
      className: 'bg-error-container text-on-error-container',
    };
  if (p.includes('product') || p.includes('engineering'))
    return {
      label: 'Product',
      className: 'bg-primary-container text-on-primary-fixed-variant',
    };
  return { label: 'Expansion', className: 'bg-secondary-fixed text-on-secondary-fixed' };
}

function initials(name: string): string {
  const parts = name.replace(/Agent/gi, '').trim().split(/\s+/);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

const AVATAR_BG = [
  'bg-slate-200',
  'bg-indigo-200',
  'bg-red-100',
  'bg-blue-100',
  'bg-amber-100',
];

export default function GoalCenter({
  twin,
  milestones,
  risks = [],
  onUpdateMilestone,
  onDecomposeGoal,
  isDecomposing,
  onAddLog,
  visionWorkflow,
}: GoalCenterProps) {
  const [newGoalInput, setNewGoalInput] = useState('');
  const [pendingGoal, setPendingGoal] = useState<string | null>(null);
  const [errorText, setErrorText] = useState('');
  const [decomposing, setDecomposing] = useState(false);
  const busy = isDecomposing || decomposing;

  const visionReady = true;
  const calculatedPhase = (m: Milestone) => m.id.startsWith('exec-');

  const completed = milestones.filter((m) => m.status === 'completed').length;
  const successRate =
    milestones.length > 0 ? Math.round((completed / milestones.length) * 1000) / 10 : 0;
  const criticalRisks = risks.filter((r) => r.severity === 'high' && r.status === 'triggered');
  const avgVelocity =
    milestones.length > 0
      ? Math.round(milestones.reduce((s, m) => s + m.progress, 0) / milestones.length)
      : 0;
  const roi =
    twin && twin.expenses > 0
      ? `${(twin.revenue / Math.max(twin.expenses, 1)).toFixed(1)}x`
      : '—';

  const inProgress = milestones.filter((m) => m.status === 'in_progress').length;
  const confidence =
    milestones.length > 0
      ? Math.min(98, Math.round(successRate * 0.6 + avgVelocity * 0.4))
      : twin
        ? 72
        : 0;

  const forecastTimeline = useMemo(() => {
    const items: { title: string; sub: string; done: boolean; active: boolean }[] = [];
    if (twin?.funding) {
      items.push({
        title: `${twin.funding} baseline`,
        sub: `Configured for ${twin.name}`,
        done: true,
        active: false,
      });
    }
    const activeM = milestones.find((m) => m.status === 'in_progress') || milestones[0];
    if (activeM) {
      items.push({
        title: activeM.name,
        sub: `In progress — ${activeM.progress}%`,
        done: false,
        active: true,
      });
    }
    const nextGoal = twin?.goals?.[0];
    if (nextGoal) {
      items.push({
        title: nextGoal.slice(0, 48) + (nextGoal.length > 48 ? '…' : ''),
        sub: `Forecasted — ${twin?.stage ?? 'next'} stage`,
        done: false,
        active: false,
      });
    }
    return items;
  }, [twin, milestones]);

  const handleToggleTask = (milestoneId: string, taskId: string) => {
    const milestone = milestones.find((m) => m.id === milestoneId);
    if (!milestone) return;

    const updatedTasks = milestone.tasks.map((task) => {
      if (task.id === taskId) {
        const nextStatus = task.status === 'completed' ? 'todo' : 'completed';
        onAddLog(
          `Goal: Toggled [${task.name}] to ${nextStatus === 'completed' ? 'Completed' : 'Backlog'}`,
        );
        return { ...task, status: nextStatus as TaskItem['status'] };
      }
      return task;
    });

    const done = updatedTasks.filter((t) => t.status === 'completed').length;
    const progress = Math.round((done / updatedTasks.length) * 100);
    const status = progress === 100 ? 'completed' : progress > 0 ? 'in_progress' : 'pending';

    onUpdateMilestone({ ...milestone, tasks: updatedTasks, progress, status });
  };

  const handleRequestPlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoalInput.trim()) return;
    if (!visionReady) {
      setErrorText('Complete the CEO → Research vision cycle on Command Center first.');
      return;
    }
    setErrorText('');
    setPendingGoal(newGoalInput.trim());
    onAddLog(`Planner: Goal decomposer requested approval for "${newGoalInput.trim()}".`);
  };

  const handleApproveDecompose = async () => {
    if (!pendingGoal || busy) return;
    setErrorText('');
    setDecomposing(true);
    onAddLog(`Planner: Approved decomposition for [${pendingGoal}]`);

    try {
      const response = await fetch('/api/decompose-goal', {
        method: 'POST',
        headers: getApiHeaders(),
        body: JSON.stringify({ goalInput: pendingGoal, twinContext: twin }),
      });
      if (!response.ok) throw new Error('Decomposition failed');
      const data = await response.json();
      onDecomposeGoal(data.milestone);
      setNewGoalInput('');
      setPendingGoal(null);
      onAddLog(
        `Planner: Milestone [${data.milestone.name}] added with ${data.milestone.tasks?.length || 0} tasks.`,
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Connection interrupted';
      setErrorText(msg);
      onAddLog(`Planner Alert: Decomposer failed — ${msg}`);
    } finally {
      setDecomposing(false);
    }
  };

  const metrics = [
    {
      label: 'Active Goals',
      value: String(milestones.length),
      sub: twin ? `${twin.name} · ${twin.stage}` : 'Add business profile',
      subIcon: 'trending_up',
      icon: 'track_changes',
      color: 'text-secondary',
    },
    {
      label: 'Success Rate',
      value: `${successRate}%`,
      sub: successRate >= 80 ? 'Highly Efficient' : 'Building momentum',
      subIcon: 'verified',
      icon: 'check_circle',
      color: 'text-green-600',
    },
    {
      label: 'Critical Risks',
      value: String(criticalRisks.length).padStart(2, '0'),
      sub: criticalRisks[0]?.title ?? 'None detected',
      subIcon: 'priority_high',
      icon: 'warning',
      color: 'text-error',
    },
    {
      label: 'ROI Forecast',
      value: roi,
      sub: twin ? `Budget ${formatCurrency(twin.budget)}` : 'Add twin data',
      subIcon: 'show_chart',
      icon: 'monetization_on',
      color: 'text-primary',
    },
    {
      label: 'Avg. Velocity',
      value: `${avgVelocity} pts`,
      sub: `${inProgress} in progress`,
      subIcon: 'rocket_launch',
      icon: 'speed',
      color: 'text-blue-500',
    },
  ];

  return (
    <div className="space-y-stack-lg">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-headline-lg font-headline-lg text-primary">Strategic Goals</h2>
          <p className="mt-1 font-body-md text-on-surface-variant">
            Autonomous tracking of high-level company directives.
            {twin && (
              <>
                {' '}
                · {twin.name} · {formatCurrency(twin.budget)} budget
              </>
            )}
          </p>
        </div>
        <button
          type="button"
          onClick={() => document.getElementById('input-goal-decomposer')?.focus()}
          className="flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 font-label-md text-label-md text-on-primary shadow-lg shadow-primary/10 transition-all hover:opacity-90 active:scale-95"
        >
          <MaterialIcon name="add" className="text-[20px]" />
          Define New Goal
        </button>
      </div>

      <div className="grid grid-cols-1 gap-gutter md:grid-cols-5">
        {metrics.map((m) => (
          <div
            key={m.label}
            className="rounded-xl border border-outline-variant bg-surface-container-lowest p-6 shadow-[0px_4px_20px_rgba(0,0,0,0.03)] transition-colors hover:border-secondary/50"
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline">
                {m.label}
              </span>
              <MaterialIcon name={m.icon} className={m.color} />
            </div>
            <div className="text-headline-md font-bold text-primary">{m.value}</div>
            <div className={`mt-1 flex items-center gap-1 text-xs ${m.color}`}>
              <MaterialIcon name={m.subIcon} className="text-[14px]" />
              <span className="truncate text-on-surface-variant">{m.sub}</span>
            </div>
          </div>
        ))}
      </div>

      <form
        onSubmit={handleRequestPlan}
        className="rounded-xl border border-outline-variant bg-surface-container-low p-5 shadow-sm"
      >
        <p className="mb-3 text-xs text-on-surface-variant">
          Submit a strategic objective — the Goal Decomposer asks for your approval before
          generating milestones.
        </p>
        <div className="flex gap-2">
          <input
            id="input-goal-decomposer"
            type="text"
            value={newGoalInput}
            onChange={(e) => setNewGoalInput(e.target.value)}
            disabled={busy || !!pendingGoal}
            placeholder={
              twin?.goals?.[0]
                ? `e.g. ${twin.goals[0]}`
                : 'Launch MVP to first 100 users'
            }
            className="h-[48px] flex-1 rounded-lg border border-outline-variant bg-surface-container-lowest px-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
          />
          <button
            type="submit"
            disabled={busy || !newGoalInput.trim() || !!pendingGoal}
            className="flex items-center gap-2 rounded-lg bg-secondary px-5 py-2.5 text-sm font-semibold text-on-secondary disabled:opacity-50"
          >
            <MaterialIcon name="auto_awesome" />
            Request AI Plan
          </button>
        </div>
        {errorText && <p className="mt-2 text-xs text-error">{errorText}</p>}
      </form>

      {pendingGoal && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-5">
          <p className="text-sm font-bold text-amber-900">Goal Manager Agent requests permission</p>
          <p className="mt-2 text-sm text-amber-950/90">
            Decompose &quot;{pendingGoal}&quot; into milestones and tasks for{' '}
            {twin?.name ?? 'your venture'}?
          </p>
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={handleApproveDecompose}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-on-primary disabled:opacity-50"
            >
              {busy && (
                <MaterialIcon name="progress_activity" className="animate-spin text-[18px]" />
              )}
              Approve & decompose
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                setPendingGoal(null);
                onAddLog('Planner: Goal decomposition declined.');
              }}
              className="rounded-lg border border-outline-variant px-4 py-2 text-sm font-semibold"
            >
              Not now
            </button>
          </div>
        </div>
      )}

      <h3 className="font-headline-md text-headline-md text-primary">Core Strategic Initiatives</h3>

      {milestones.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-outline-variant py-16 text-center">
          <MaterialIcon name="track_changes" className="text-[48px] text-outline" />
          <p className="mt-4 font-semibold text-primary">No initiatives yet</p>
          <p className="mt-2 text-sm text-on-surface-variant">
            Complete onboarding or approve a new goal above to create your roadmap.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-gutter lg:grid-cols-3">
          {milestones.map((milestone, idx) => {
            const badge = statusBadge(milestone);
            const tag = initiativeTag(milestone);
            const assignees = milestone.tasks
              .map((t) => t.assignee)
              .filter((a, i, arr) => a && arr.indexOf(a) === i)
              .slice(0, 3);
            const barColor = badge.label.includes('RISK')
              ? 'bg-error'
              : tag.label === 'Product'
                ? 'bg-primary'
                : 'bg-secondary';

            return (
              <div
                key={milestone.id}
                className={`group rounded-2xl border border-outline-variant bg-surface-container-lowest p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md ${
                  idx === 1 ? 'border-l-4 border-l-secondary' : ''
                }`}
              >
                <div className="mb-4 flex items-start justify-between">
                  <div>
                    <span
                      className={`rounded px-2 py-1 text-[10px] font-bold uppercase tracking-tighter ${tag.className}`}
                    >
                      {tag.label}
                    </span>
                    <h4 className="mt-2 font-headline-md text-headline-md text-primary">
                      {milestone.name}
                    </h4>
                  </div>
                  <span
                    className={`rounded-full border px-2 py-1 text-[10px] font-bold ${badge.class}`}
                  >
                    {badge.label}
                  </span>
                </div>
                <div className="mb-6">
                  <div className="mb-2 flex justify-between text-xs">
                    <span className="text-outline">Completion</span>
                    <span className="font-semibold">{milestone.progress}%</span>
                  </div>
                  <ProgressLine pct={milestone.progress} color={barColor} />
                </div>
                <div className="mb-6 space-y-4">
                  {milestone.tasks.map((task) => {
                    const done = task.status === 'completed';
                    const active = task.status === 'in_progress';
                    const risk = !done && milestone.progress < 40 && task.status === 'todo';
                    return (
                      <button
                        key={task.id}
                        type="button"
                        onClick={() => handleToggleTask(milestone.id, task.id)}
                        className="flex w-full items-center gap-3 text-left"
                      >
                        <MaterialIcon
                          name={
                            done
                              ? 'check_circle'
                              : risk
                                ? 'error_outline'
                                : active
                                  ? 'radio_button_checked'
                                  : 'circle'
                          }
                          className={`text-[18px] ${
                            done
                              ? 'text-green-600'
                              : risk
                                ? 'text-error'
                                : active
                                  ? 'animate-pulse text-primary'
                                  : 'text-outline opacity-30'
                          }`}
                        />
                        <span
                          className={`text-sm ${
                            active ? 'font-medium text-primary' : 'text-on-surface-variant'
                          } ${done ? 'line-through' : ''}`}
                        >
                          {task.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <div className="flex items-center justify-between border-t border-outline-variant/50 pt-4">
                  <div className="flex items-center gap-2 text-xs text-outline">
                    <MaterialIcon name="event" className="text-[16px]" />
                    {milestone.project || twin?.stage}
                  </div>
                  <div className="flex -space-x-2">
                    {assignees.map((a, i) => (
                      <div
                        key={a}
                        className={`flex h-7 w-7 items-center justify-center rounded-full border-2 border-surface text-[10px] font-bold ${AVATAR_BG[i % AVATAR_BG.length]}`}
                        title={a}
                      >
                        {initials(a)}
                      </div>
                    ))}
                    {milestone.tasks.length > assignees.length && (
                      <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-surface bg-surface-container-high text-[10px] font-bold">
                        +{milestone.tasks.length - assignees.length}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="relative overflow-hidden rounded-3xl bg-primary-container p-8 text-on-primary-container shadow-2xl">
        <div className="pointer-events-none absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-secondary/20 to-transparent" />
        <div className="relative z-10 flex flex-col gap-12 lg:flex-row">
          <div className="flex-1">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                <MaterialIcon name="psychology" className="text-on-secondary" />
              </div>
              <h3 className="text-headline-lg font-headline-lg text-white">
                Autonomous Goal Forecasting
              </h3>
            </div>
            <p className="mb-8 max-w-xl text-body-lg leading-relaxed text-on-primary-container/80">
              {twin ? (
                <>
                  Nexus AI projects outcomes for <strong className="text-white">{twin.name}</strong>{' '}
                  using {milestones.length} live milestones, {formatCurrency(twin.budget)} budget,
                  and {twin.stage} stage signals. Primary target:{' '}
                  {twin.goals[0] || 'strategic growth'}.
                </>
              ) : (
                'Connect your business twin to enable forecasting.'
              )}
            </p>
            <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
              {[
                { label: 'Confidence Score', value: `High (${confidence}%)` },
                {
                  label: 'Risk Mitigation',
                  value: criticalRisks.length > 0 ? `${criticalRisks.length} active` : 'Clear',
                },
                {
                  label: 'Trend Projection',
                  value: avgVelocity >= 50 ? 'Bullish' : 'Building',
                },
                {
                  label: 'In Progress',
                  value: `${inProgress} goals`,
                },
              ].map((box) => (
                <div
                  key={box.label}
                  className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm"
                >
                  <div className="mb-1 text-[10px] uppercase text-white/60">{box.label}</div>
                  <div className="text-xl font-bold text-white">{box.value}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="w-full rounded-2xl border border-white/10 bg-white/5 p-6 lg:w-[400px]">
            <h4 className="mb-6 font-label-md text-label-md text-white">
              Execution Timeline Forecast
            </h4>
            <div className="relative space-y-6">
              <div className="absolute bottom-2 left-3 top-2 w-px bg-white/20" />
              {forecastTimeline.length === 0 ? (
                <p className="text-sm text-white/60">Add milestones to populate forecast.</p>
              ) : (
                forecastTimeline.map((item) => (
                  <div key={item.title} className="relative flex gap-4">
                    <div
                      className={`z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                        item.done
                          ? 'bg-secondary'
                          : item.active
                            ? 'bg-secondary outline outline-4 outline-secondary/20'
                            : 'border border-white/20 bg-primary-container'
                      }`}
                    >
                      {item.done ? (
                        <MaterialIcon name="done" className="text-[14px] text-white" />
                      ) : item.active ? (
                        <span className="h-2 w-2 rounded-full bg-white" />
                      ) : null}
                    </div>
                    <div className={item.active || item.done ? '' : 'opacity-40'}>
                      <p className="text-sm font-semibold text-white">{item.title}</p>
                      <p className="text-[11px] text-white/60">{item.sub}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
            <button
              type="button"
              onClick={() => onAddLog('Forecast: Detailed prediction view requested.')}
              className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-white py-3 text-sm font-bold text-primary hover:bg-white/90"
            >
              View detailed prediction
              <MaterialIcon name="north_east" className="text-[18px]" />
            </button>
          </div>
        </div>
        <div className="relative z-10 mt-12 flex h-24 items-end gap-1 overflow-hidden px-4 opacity-40 transition-opacity hover:opacity-60">
          {[4, 8, 12, 6, 16, 10, 20, 14, 24, 18, 22, 28].map((h, i) => (
            <div
              key={i}
              className="w-full rounded-t bg-secondary"
              style={{ height: `${h * 3}px` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
