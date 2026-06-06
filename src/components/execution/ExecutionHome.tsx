import { useCallback, useEffect, useMemo, useState } from 'react';
import type { BusinessTwin, DepartmentState, AgentWorkforce, CorporateMemory, Milestone } from '../../types';
import type { BusinessType } from '../../lib/authApi';
import { milestonesFromExecution } from '../../utils/executionToMilestones';
import { getCompanyId } from '../../lib/companyId';
import {
  fetchExecutionApi,
  tickExecutionApi,
  choosePhaseApi,
  startExecutionApi,
  submitBrandDiscoveryApi,
  type ExecutionView,
  type AgentStateView,
} from '../../lib/executionApi';
import BrandDiscoveryPanel from './BrandDiscoveryPanel';
import ExecutionChatPanel from './ExecutionChatPanel';
import IndustryOSPanel from './IndustryOSPanel';
import {
  objectiveFromTwin,
  locationFromTwin,
  targetCustomersFromTwin,
  timelineDaysFromTwin,
} from '../../lib/bootstrapExecution';
import { fetchOperationsSnapshot, resolveApprovalApi } from '../../lib/nexusOperations';
import { StitchPageHeader } from '../stitch/StitchPageHeader';
import { KpiCard } from '../stitch/StitchPrimitives';
import MaterialIcon from '../ui/MaterialIcon';
import {
  ExecutionPanel,
  StatChip,
  PhaseProgressCard,
  AgentPill,
} from './ExecutionPrimitives';

interface ExecutionHomeProps {
  twin: BusinessTwin;
  founderEmail?: string;
  founderId?: string;
  businessType?: BusinessType;
  departments: DepartmentState[];
  workforce: AgentWorkforce[];
  onAddLog: (msg: string) => void;
  onMergeMemory: (sections: Partial<CorporateMemory>) => void;
  onSyncDepartments: (activeNames: string[]) => void;
  onSyncWorkforce: (runningAgents: string[]) => void;
  onMilestonesUpdate?: (milestones: Milestone[]) => void;
  onNewCompanySetup?: () => void;
  onUpdateTwin?: (twin: BusinessTwin) => void;
}

function impactBadge(impact?: string) {
  switch (impact) {
    case 'direct':
      return { label: 'Direct revenue', cls: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/40' };
    case 'enabling':
      return { label: 'Enables revenue', cls: 'bg-amber-500/10 text-amber-700 border-amber-500/40' };
    case 'indirect':
      return { label: 'Indirect impact', cls: 'bg-slate-500/10 text-slate-700 border-slate-500/40' };
    default:
      return null;
  }
}

function roiBadge(roi?: string) {
  if (!roi) return null;
  const cls =
    roi === 'high'
      ? 'bg-primary/10 text-primary border-primary/40'
      : roi === 'medium'
        ? 'bg-secondary/10 text-secondary border-secondary/40'
        : 'bg-outline-variant text-on-surface-variant border-outline-variant';
  return { label: `${roi.toUpperCase()} ROI`, cls };
}

/**
 * CeoCommandBar — the visual anchor of the Execution Center. Shows the
 * CEO Agent as the central authority: its current directive, the round
 * number, the departments it is directing, and live status of each
 * directive (running / completed / pending). The CEO is the brain;
 * the departments are the limbs; the chat below is how the founder
 * talks to the CEO.
 */
function CeoCommandBar({ view }: { view: ExecutionView }) {
  const execution = view.execution;
  const isContinuous = execution.status === 'completed' && execution.continuousMode;
  const isAutoRun = execution.autoRunAll && execution.status === 'running' && !isContinuous;
  const directives = execution.continuousDirectives ?? [];
  const runningDirectives = directives.filter((d) => d.status === 'running');
  const completedDirectives = directives.filter((d) => d.status === 'completed');
  const latestDirective = directives[directives.length - 1];

  const statusLabel = isContinuous
    ? 'CEO is running continuous brand operations on your behalf'
    : isAutoRun
      ? 'CEO is directing every phase autonomously'
      : execution.status === 'awaiting_user'
        ? 'CEO awaits your decision'
        : execution.status === 'running'
          ? 'CEO is delegating to departments'
          : 'CEO is on standby';

  return (
    <div className="relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 via-primary/5 to-secondary/10 p-5 shadow-sm">
      <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute -bottom-12 -left-12 h-40 w-40 rounded-full bg-secondary/10 blur-3xl" />

      <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/70 text-on-primary shadow-lg">
              <MaterialIcon name="psychology" className="text-3xl" />
            </div>
            <span
              className={
                'absolute -bottom-1 -right-1 h-5 w-5 rounded-full border-2 border-surface shadow ' +
                (isContinuous || isAutoRun
                  ? 'bg-emerald-500 animate-pulse'
                  : execution.status === 'awaiting_user'
                    ? 'bg-amber-500'
                    : 'bg-slate-400')
              }
              title={statusLabel}
            />
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">
              CEO Agent · in control
            </p>
            <h2 className="text-2xl font-bold text-on-surface">
              {isContinuous
                ? `Round ${execution.continuousRound ?? 1} · Continuous brand operations`
                : isAutoRun
                  ? 'Full autonomous run engaged'
                  : execution.status === 'awaiting_user'
                    ? 'Awaiting your approval'
                    : execution.status === 'running'
                      ? 'CEO is delegating work to the team'
                      : 'CEO is on standby'}
            </h2>
            <p className="mt-1 text-sm text-on-surface-variant">{statusLabel}</p>
          </div>
        </div>

        <div className="flex-1" />

        <div className="flex flex-wrap items-center gap-2">
          {(execution.activeDepartments ?? []).slice(0, 6).map((dept) => (
            <span
              key={dept}
              className="rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary"
            >
              {dept}
            </span>
          ))}
          {execution.activeAgents.slice(0, 4).map((agent) => (
            <span
              key={agent}
              className="rounded-full border border-outline-variant bg-surface-container-low px-2.5 py-1 text-[11px] font-medium text-on-surface-variant"
            >
              {agent}
            </span>
          ))}
        </div>
      </div>

      {(isContinuous || isAutoRun) && latestDirective && (
        <div className="relative mt-4 grid gap-3 border-t border-primary/20 pt-4 md:grid-cols-3">
          <div className="rounded-xl border border-primary/20 bg-surface-container-lowest/80 p-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-primary">
              Latest directive
            </p>
            <p className="mt-1 text-sm font-semibold text-on-surface">
              {latestDirective.title}
            </p>
            {latestDirective.rationale && (
              <p className="mt-1 text-xs italic text-on-surface-variant">
                “{latestDirective.rationale}”
              </p>
            )}
            <p className="mt-2 text-[10px] uppercase tracking-wider text-on-surface-variant">
              → {latestDirective.assignee} · {latestDirective.department}
            </p>
          </div>

          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
              Running
            </p>
            <p className="mt-1 text-2xl font-bold text-emerald-700">
              {runningDirectives.length}
            </p>
            <p className="text-xs text-on-surface-variant">
              directives in flight
            </p>
          </div>

          <div className="rounded-xl border border-tertiary/20 bg-tertiary/5 p-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-tertiary">
              Delivered this round
            </p>
            <p className="mt-1 text-2xl font-bold text-tertiary">
              {completedDirectives.length}
            </p>
            <p className="text-xs text-on-surface-variant">
              tasks shipped to the business
            </p>
          </div>
        </div>
      )}

      {directives.length > 0 && (isContinuous || isAutoRun) && (
        <div className="relative mt-4 border-t border-primary/20 pt-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-primary">
            Directives CEO has issued
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {directives.slice(-12).map((d) => (
              <span
                key={d.id}
                className={
                  'rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ' +
                  (d.status === 'completed'
                    ? 'border-tertiary/40 bg-tertiary/10 text-tertiary'
                    : d.status === 'running'
                      ? 'border-primary/40 bg-primary/10 text-primary'
                      : 'border-outline-variant bg-surface-container-low text-on-surface-variant')
                }
                title={`${d.department} · ${d.assignee}`}
              >
                {d.status === 'completed' ? '✓ ' : d.status === 'running' ? '⏳ ' : '· '}
                {d.title}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ExecutionHome({
  twin,
  founderEmail,
  founderId,
  businessType,
  departments,
  workforce: _workforce,
  onAddLog,
  onMergeMemory,
  onSyncDepartments,
  onSyncWorkforce,
  onMilestonesUpdate,
  onNewCompanySetup,
  onUpdateTwin,
}: ExecutionHomeProps) {
  const companyId = getCompanyId(twin.name, founderEmail, founderId);
  const [view, setView] = useState<ExecutionView | null>(null);
  const [loadState, setLoadState] = useState<'loading' | 'none' | 'ready'>('loading');
  const [starting, setStarting] = useState(false);
  const [pendingApprovals, setPendingApprovals] = useState<
    Array<{ id: string; title: string; description: string; tier: string; actionType: string }>
  >([]);
  const [ceoSkipped, setCeoSkipped] = useState(false);
  const [brandSubmitting, setBrandSubmitting] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const [execRaw, snap] = await Promise.all([
        fetchExecutionApi(companyId),
        fetchOperationsSnapshot(companyId).catch(() => null),
      ]);
      let exec = execRaw;
      if (exec) {
        if (exec.execution.status === 'running') {
          const ticked = await tickExecutionApi(companyId);
          if (ticked && 'execution' in ticked) {
            exec = ticked as ExecutionView;
          }
        }
        setView(exec);
        setLoadState('ready');
        onSyncDepartments(exec.execution.activeDepartments);
        onSyncWorkforce(exec.runningAgents);
        onMilestonesUpdate?.(milestonesFromExecution(exec));
      } else {
        setLoadState('none');
      }
      if (snap) {
        setPendingApprovals(
          snap.state.approvals.filter((a) => a.status === 'pending'),
        );
        onMergeMemory({
          strategic: snap.memorySections.strategic,
          operational: snap.memorySections.operational,
          learning: snap.memorySections.learning,
          business: snap.memorySections.business,
          customer: snap.memorySections.customer,
          failure: snap.memorySections.failure,
        });
      }
    } catch (e) {
      console.error(e);
      setLoadState('none');
    }
  }, [companyId, onMergeMemory, onSyncDepartments, onSyncWorkforce, onMilestonesUpdate]);

  const handleStartExecution = async () => {
    setStarting(true);
    try {
      const exec = await startExecutionApi(companyId, {
        directive: objectiveFromTwin(twin),
        twin,
        location: locationFromTwin(twin),
        targetCustomers: targetCustomersFromTwin(twin),
        timelineDays: timelineDaysFromTwin(twin),
      });
      setView(exec);
      setLoadState('ready');
      onSyncDepartments(exec.execution.activeDepartments);
      onSyncWorkforce(exec.runningAgents);
      onMilestonesUpdate?.(milestonesFromExecution(exec));
      onAddLog(`Execution Engine: Started for ${twin.name} — research running automatically.`);
    } catch {
      onAddLog('Failed to start execution. Is the dev server running?');
    } finally {
      setStarting(false);
    }
  };

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!view || view.execution.status !== 'running') return;
    const id = window.setInterval(async () => {
      const next = await tickExecutionApi(companyId);
      if (next && 'execution' in next) {
        const v = next as ExecutionView;
        setView(v);
        onSyncWorkforce(v.runningAgents);
        onMilestonesUpdate?.(milestonesFromExecution(v));
        if (v.execution.status === 'awaiting_user') {
          onAddLog('Execution: Phase complete — choose your next step below.');
        }
      }
    }, 2500);
    return () => window.clearInterval(id);
  }, [view?.execution.status, companyId, onAddLog, onSyncWorkforce, onMilestonesUpdate]);

  const handleChoose = async (phaseKey: string, label: string) => {
    if (phaseKey === 'brand' && !view?.execution.brandDiscovery) {
      onAddLog('Complete brand discovery before starting brand strategy.');
      return;
    }
    try {
      const next = await choosePhaseApi(companyId, phaseKey);
      setView(next);
      onAddLog(`You approved: ${label}. Agents are executing.`);
    } catch {
      onAddLog('Failed to start next phase.');
    }
  };

  const handleBrandDiscovery = async (answers: {
    mainBrandValues: string;
    whatsNew: string;
    brandPersonality: string;
    taglineOrVision: string;
  }) => {
    setBrandSubmitting(true);
    try {
      const next = await submitBrandDiscoveryApi(companyId, answers);
      setView(next);
      onAddLog('CEO Agent: Brand discovery captured — review recommended next action.');
    } catch {
      onAddLog('Failed to submit brand discovery.');
    } finally {
      setBrandSubmitting(false);
    }
  };

  const handleApprove = async (approvalId: string) => {
    await resolveApprovalApi(companyId, approvalId, 'approved');
    onAddLog('Approval granted.');
    await refresh();
  };

  const chatContextSummary = useMemo(() => {
    if (!view) {
      return `${twin.name} · awaiting execution start`;
    }
    const { execution, currentPhase, runningAgents } = view;
    const phaseLine = currentPhase
      ? `Phase: ${currentPhase.name}`
      : execution.status === 'awaiting_user'
        ? `Awaiting your decision: ${execution.recommendations[0]?.label ?? 'next step'}`
        : 'Idle';
    const agentLine = runningAgents.length > 0 ? ` · Agents: ${runningAgents.slice(0, 3).join(', ')}` : '';
    return `${twin.name} · ${phaseLine}${agentLine}`;
  }, [view, twin.name]);

  if (loadState === 'loading') {
    return (
      <div className="rounded-2xl border border-outline-variant bg-surface-container-lowest py-16 text-center">
        <p className="text-sm font-semibold text-on-surface-variant">Loading execution state…</p>
      </div>
    );
  }

  if (!view) {
    const objective = objectiveFromTwin(twin);
    const recommendedNextAction =
      twin.challenges
        .find((c) => c.toLowerCase().startsWith('recommended next action:'))
        ?.split(':')
        .slice(1)
        .join(':')
        .trim() || 'Start Market Research';
    const activeDepartments = departments.filter((d) => d.status === 'active').map((d) => d.name);
    return (
      <div className="space-y-6 pb-4">
        <StitchPageHeader
          title="Execution Center"
          subtitle="CEO plan is ready — approve the next action to start execution"
        />
        <IndustryOSPanel
          industrySlug={twin.industry}
          businessCategory={twin.industry}
          mode={businessType === 'existing_business' ? 'existing' : 'new'}
        />
        <div className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-8 shadow-sm">
          <MaterialIcon name="play_circle" className="text-4xl text-secondary" />
          <h3 className="mt-4 text-lg font-bold text-primary">Boardroom ready</h3>
          <p className="mt-2 max-w-xl text-sm text-on-surface-variant">
            CEO discovery created your company blueprint. Nothing runs until you approve. Your
            recommended next action is below.
          </p>
          <p className="mt-3 text-sm text-on-surface">
            Objective: <span className="font-semibold">{objective}</span>
          </p>
          <p className="mt-2 text-sm text-on-surface">
            Recommended next action:{' '}
            <span className="font-semibold text-primary">{recommendedNextAction}</span>
          </p>
          <p className="mt-2 text-sm text-on-surface">
            Active departments:{' '}
            <span className="font-semibold">{activeDepartments.length ? activeDepartments.join(', ') : '—'}</span>
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              disabled={starting}
              onClick={handleStartExecution}
              className="rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-on-primary disabled:opacity-50"
            >
              {starting ? 'Starting…' : ceoSkipped ? 'Start execution now' : 'Approve & run'}
            </button>
            {!ceoSkipped && (
              <button
                type="button"
                disabled={starting}
                onClick={() => {
                  setCeoSkipped(true);
                  onAddLog('CEO plan skipped. You can approve later to start execution.');
                }}
                className="rounded-lg border border-outline-variant px-5 py-2.5 text-sm font-semibold text-on-surface-variant disabled:opacity-50"
              >
                Skip
              </button>
            )}
            {onNewCompanySetup && (
              <button
                type="button"
                onClick={onNewCompanySetup}
                className="rounded-lg border border-outline-variant px-5 py-2.5 text-sm font-semibold text-on-surface"
              >
                New company setup (launch wizard)
              </button>
            )}
          </div>
          <p className="mt-4 text-xs text-outline">
            Tip: Settings → Reset enterprise also clears your profile and shows the launch wizard
            again.
          </p>
        </div>

        <ExecutionChatPanel
          twin={twin}
          onAddLog={onAddLog}
          onUpdateTwin={onUpdateTwin}
          contextSummary={chatContextSummary}
        />
      </div>
    );
  }

  const { execution, currentPhase, phaseProgress, runningAgents, blockedTasks, agentStates, queuedTasks, waitingTasks } = view;
  const activeDeptCount = departments.filter((d) => d.status === 'active').length;
  const activeTasks = execution.tasks.filter(
    (t) => t.phaseId === execution.currentPhaseId && t.status === 'running',
  );

  return (
    <div className="space-y-6 pb-4">
      <StitchPageHeader
        title="Execution Center"
        subtitle="Live company operations — progress calculated from real task state"
        breadcrumb={{ parent: twin.name, current: 'Execution' }}
      />

      <IndustryOSPanel
        industrySlug={twin.industry}
        businessCategory={twin.industry}
        mode={businessType === 'existing_business' ? 'existing' : 'new'}
        executionState={view ? {
          completedKeys: execution.phases.filter(p => p.status === 'completed').map(p => p.key),
          currentKey: currentPhase?.key ?? null,
          pendingKeys: execution.phases.filter(p => p.status === 'pending').map(p => p.key),
        } : null}
      />

      <CeoCommandBar view={view} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          icon="flag"
          iconBg="bg-surface-container"
          iconColor="text-primary"
          label="Current objective"
          value={<span className="text-xl">{execution.objective}</span>}
          sub={
            <p className="text-xs text-on-surface-variant">
              {execution.location} · {execution.timelineDays} day timeline
            </p>
          }
        />
        <KpiCard
          icon="layers"
          iconBg="bg-surface-container"
          iconColor="text-secondary"
          label="Current phase"
          value={currentPhase?.name ?? 'Awaiting your choice'}
          sub={
            <p className="text-xs text-on-surface-variant">
              {execution.status === 'running' ? 'Agents working' : 'Decision required'}
            </p>
          }
        />
        <KpiCard
          icon="corporate_fare"
          iconBg="bg-surface-container"
          iconColor="text-primary"
          label="Active departments"
          value={execution.activeDepartments.length || activeDeptCount}
          sub={<p className="text-xs text-on-surface-variant">{execution.activeDepartments.join(', ') || '—'}</p>}
        />
        <KpiCard
          icon="gavel"
          iconBg="bg-surface-container"
          iconColor="text-primary"
          label="Approvals required"
          value={pendingApprovals.length}
          sub={<p className="text-xs text-on-surface-variant">Yellow / red gates only</p>}
        />
      </div>

      {phaseProgress && execution.status === 'running' && (
        <ExecutionPanel title={currentPhase?.name ?? 'Active phase'} subtitle="Progress = completed subtasks ÷ total (running work shown separately below)">
          <PhaseProgressCard name={phaseProgress.phaseName} stats={phaseProgress} active />
          <div className="mt-4 flex flex-wrap gap-2">
            {runningAgents.map((a) => (
              <AgentPill key={a} name={a} />
            ))}
          </div>
          {activeTasks.length > 0 && (
            <ul className="mt-4 space-y-2 border-t border-outline-variant pt-4 text-sm">
              {activeTasks.slice(0, 6).map((t) => {
                const runningSub = t.subtasks.find((s) => s.status === 'running');
                let progressMessage = runningSub?.title ?? 'Starting…';
                if (t.title.includes('Research')) {
                  progressMessage = 'Research Agent in progress';
                } else if (t.title.includes('Competitor')) {
                  progressMessage = 'Research Agent identifying competitors';
                } else if (t.title.includes('Pricing')) {
                  progressMessage = 'Pricing Agent setting price points';
                } else if (t.title.includes('Sales') || t.title.includes('Marketing')) {
                  progressMessage = 'Sales Agent building pipeline';
                } else if (t.title.includes('Hiring') || t.title.includes('Workforce')) {
                  progressMessage = 'Hiring Agent designing roles';
                } else if (t.title.includes('Operations')) {
                  progressMessage = 'Operations Agent setting up workflow';
                }
                return (
                  <li key={t.id} className="flex justify-between gap-2 text-on-surface-variant">
                    <span>
                      <span className="font-semibold text-on-surface">{t.assignee}</span> — {t.title}
                    </span>
                    <span className="shrink-0 text-xs text-secondary">{progressMessage}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </ExecutionPanel>
      )}

      {execution.status === 'running' && execution.autoRunAll && (
        <div className="flex items-center gap-3 rounded-xl border border-primary/30 bg-primary/5 p-3 text-sm">
          <div className="text-xl">⚡</div>
          <div className="flex-1">
            <p className="font-bold text-on-surface">Full autonomous run engaged</p>
            <p className="text-xs text-on-surface-variant">
              The system is automatically running every remaining phase in sequence. You can
              intervene via the chat below at any time.
            </p>
          </div>
        </div>
      )}

      {execution.status === 'completed' && execution.continuousMode && (
        <div className="rounded-xl border border-primary/40 bg-primary/5 p-4 text-sm">
          <div className="flex items-center gap-3">
            <div className="text-2xl">♾️</div>
            <div className="flex-1">
              <p className="font-bold text-on-surface">
                Continuous brand operations engaged — Round {execution.continuousRound ?? 1}
              </p>
              <p className="text-xs text-on-surface-variant">
                CEO is directing every agent (marketing, sales, product, customer success, growth) on your
                behalf. New directives are spawned every few minutes based on what was just delivered.
              </p>
            </div>
          </div>
          {(execution.continuousDirectives ?? []).length > 0 && (
            <ul className="mt-3 space-y-1 border-t border-primary/20 pt-3 text-xs">
              {execution.continuousDirectives!.slice(-6).map((d) => (
                <li key={d.id} className="flex items-center justify-between gap-2">
                  <div className="flex-1">
                    <span className="font-semibold text-on-surface">{d.title}</span>
                    <span className="ml-2 text-on-surface-variant">— {d.department}</span>
                  </div>
                  <span
                    className={
                      d.status === 'completed'
                        ? 'rounded-full bg-tertiary/20 px-2 py-0.5 text-[10px] font-bold text-tertiary'
                        : d.status === 'running'
                          ? 'rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-bold text-primary'
                          : 'rounded-full bg-outline-variant/30 px-2 py-0.5 text-[10px] font-bold text-on-surface-variant'
                    }
                  >
                    {d.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {execution.status === 'completed' && !execution.continuousMode && (
        <div className="flex items-center gap-3 rounded-xl border border-tertiary/30 bg-tertiary/5 p-4 text-sm">
          <div className="text-2xl">✅</div>
          <div className="flex-1">
            <p className="font-bold text-on-surface">All phases complete</p>
            <p className="text-xs text-on-surface-variant">
              The full autonomous run finished — research, business model, pricing, operations,
              hiring, sales, customer acquisition, brand, website, social, and scaling are all
              delivered.
            </p>
          </div>
        </div>
      )}

      {execution.status === 'awaiting_user' &&
        execution.phases.some((p) => p.key === 'research' && p.status === 'completed') &&
        !execution.brandDiscovery && (
          <BrandDiscoveryPanel onSubmit={handleBrandDiscovery} busy={brandSubmitting} />
        )}

      {execution.status === 'awaiting_user' &&
        execution.recommendations.length > 0 &&
        (execution.brandDiscovery ||
          !execution.phases.some((p) => p.key === 'research' && p.status === 'completed')) && (
          <ExecutionPanel
            title="CEO Agent — what creates revenue next"
            subtitle="Founder-mode recommendations: each one points to revenue, customers, or launch"
          >
            <div className="mb-4 flex items-start gap-3 rounded-xl border border-primary/30 bg-primary/5 p-3 text-sm">
              <div className="text-2xl">⚡</div>
              <div className="flex-1">
                <p className="font-bold text-on-surface">
                  Approve to launch the full autonomous run
                </p>
                <p className="text-xs text-on-surface-variant">
                  Once you approve, the system will automatically execute{' '}
                  <strong>every remaining phase</strong> — pricing, operations, hiring, sales,
                  customer acquisition, brand, website, social, scaling — without asking for
                  approval again. You can stop or modify at any time.
                </p>
              </div>
            </div>
            {execution.ceoRecommendation && (
              <div className="mb-4 space-y-2 rounded-xl border border-secondary/30 bg-secondary/5 p-4 text-sm">
                <p>
                  <span className="font-bold text-on-surface">Completed: </span>
                  {execution.ceoRecommendation.completedSummary}
                </p>
                <p>
                  <span className="font-bold text-on-surface">Learned: </span>
                  {execution.ceoRecommendation.learned}
                </p>
                {execution.ceoRecommendation.blocked !== 'No critical blockers detected.' && (
                  <p>
                    <span className="font-bold text-on-surface">Blocked: </span>
                    {execution.ceoRecommendation.blocked}
                  </p>
                )}
                <p>
                  <span className="font-bold text-primary">Next: </span>
                  {execution.ceoRecommendation.nextStep}
                </p>
                <p className="text-on-surface-variant">
                  <span className="font-semibold">Why: </span>
                  {execution.ceoRecommendation.reason}
                </p>
                {execution.ceoRecommendation.basedOnFindings && execution.ceoRecommendation.basedOnFindings.length > 0 && (
                  <div className="rounded-md bg-primary/5 p-2 mt-2">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-primary mb-1">Based on actual findings:</p>
                    <ul className="space-y-1">
                      {execution.ceoRecommendation.basedOnFindings.slice(0, 3).map((finding, idx) => (
                        <li key={idx} className="text-xs text-on-surface-variant flex items-start gap-1">
                          <MaterialIcon name="lightbulb" className="text-[12px] text-amber-500 mt-0.5 shrink-0" />
                          <span>{finding}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {execution.ceoRecommendation.revenueDriver && (
                  <p className="rounded-md bg-emerald-500/5 p-2 text-xs">
                    <span className="font-bold text-emerald-700">Revenue driver: </span>
                    {execution.ceoRecommendation.revenueDriver}
                  </p>
                )}
                {execution.ceoRecommendation.launchUnblocker && (
                  <p className="rounded-md bg-amber-500/5 p-2 text-xs">
                    <span className="font-bold text-amber-700">Launch impact: </span>
                    {execution.ceoRecommendation.launchUnblocker}
                  </p>
                )}
                {execution.ceoRecommendation.highestRoi && (
                  <p className="rounded-md bg-primary/5 p-2 text-xs">
                    <span className="font-bold text-primary">Highest ROI: </span>
                    {execution.ceoRecommendation.highestRoi}
                  </p>
                )}
                <p className="text-xs text-outline">
                  Departments: {execution.ceoRecommendation.departments.join(', ')}
                </p>
              </div>
            )}
            <div className="grid gap-3 md:grid-cols-3">
              {execution.recommendations.map((rec, i) => {
                const imp = impactBadge(rec.revenueImpact);
                const roi = roiBadge(rec.roi);
                return (
                  <button
                    key={rec.id}
                    type="button"
                    onClick={() => handleChoose(rec.phaseKey, rec.label)}
                    className={`rounded-xl border bg-surface-container-low p-4 text-left transition-shadow hover:shadow-md ${
                      rec.isPrimary
                        ? 'border-secondary ring-1 ring-secondary/30'
                        : 'border-outline-variant'
                    }`}
                  >
                    <p className="text-xs font-bold text-secondary">
                      {rec.isPrimary ? '★ CEO recommends' : `${i + 1}. Alternative`}
                    </p>
                    <p className="mt-2 font-bold text-primary">{rec.label}</p>
                    <p className="mt-1 text-sm text-on-surface-variant">{rec.description}</p>
                    {rec.reason && (
                      <p className="mt-2 text-xs text-on-surface-variant">{rec.reason}</p>
                    )}
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {imp && (
                        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${imp.cls}`}>
                          {imp.label}
                        </span>
                      )}
                      {roi && (
                        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${roi.cls}`}>
                          {roi.label}
                        </span>
                      )}
                      {rec.blocksLaunch && (
                        <span className="rounded-full border border-red-500/40 bg-red-500/10 px-2 py-0.5 text-[10px] font-bold text-red-700">
                          Blocks launch
                        </span>
                      )}
                      {rec.isOperational === false && (
                        <span className="rounded-full border border-outline-variant bg-surface-container px-2 py-0.5 text-[10px] font-bold text-outline">
                          Cosmetic
                        </span>
                      )}
                    </div>
                    <span className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-primary">
                      Approve & run <MaterialIcon name="arrow_forward" className="text-[14px]" />
                    </span>
                  </button>
                );
              })}
            </div>
          </ExecutionPanel>
        )}

      {pendingApprovals.length > 0 && (
        <ExecutionPanel title="Required approvals" subtitle="Strategic gates — agents pause until you decide">
          {pendingApprovals.map((a) => (
            <div
              key={a.id}
              className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-outline-variant bg-surface-container-low p-4"
            >
              <div>
                <p className="text-xs font-bold uppercase text-on-surface-variant">{a.tier}</p>
                <p className="font-bold text-on-surface">{a.title}</p>
                <p className="text-sm text-on-surface-variant">{a.description}</p>
              </div>
              <button
                type="button"
                onClick={() => handleApprove(a.id)}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-on-primary"
              >
                Approve
              </button>
            </div>
          ))}
        </ExecutionPanel>
      )}

      <div className="grid gap-4 lg:grid-cols-1">
        <ExecutionPanel title="Deliverables" subtitle="Outcomes generated by agents from actual research">
          {execution.deliverables.length === 0 ? (
            <p className="text-sm text-on-surface-variant">Deliverables appear as agents complete their research.</p>
          ) : (
            <ul className="space-y-3">
              {execution.deliverables.map((d) => (
                <li key={d.id} className="rounded-xl border border-outline-variant p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-bold text-on-surface">{d.title}</p>
                      <p className="text-xs text-on-surface-variant mt-0.5">by {d.agent}</p>
                    </div>
                    <span className="shrink-0 rounded-full bg-emerald-500/10 text-emerald-700 px-2 py-0.5 text-[10px] font-bold">
                      Delivered
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-on-surface-variant">{d.summary}</p>
                  {d.details && d.details.length > 0 && (
                    <div className="mt-3 border-t border-outline-variant/50 pt-3">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-2">Key Findings</p>
                      <ul className="space-y-1.5">
                        {d.details.map((item, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-xs text-on-surface">
                            <MaterialIcon name="lightbulb" className="mt-0.5 shrink-0 text-[14px] text-amber-500" />
                            <span>{item.replace(/^[•\-]\s*/, '')}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </ExecutionPanel>
      </div>

      {(Object.keys(agentStates).length > 0 || queuedTasks.length > 0 || waitingTasks.length > 0) && (
        <ExecutionPanel title="Agent Workload" subtitle="Real-time agent states and task queue">
          <div className="grid gap-4 md:grid-cols-3">
            {(Object.values(agentStates) as AgentStateView[]).slice(0, 6).map((state) => (
              <div key={state.name} className="rounded-xl border border-outline-variant p-3">
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${
                    state.state === 'running' ? 'bg-emerald-500 animate-pulse' :
                    state.state === 'completed' ? 'bg-emerald-600' :
                    state.state === 'failed' ? 'bg-red-500' :
                    state.state === 'blocked' ? 'bg-amber-500' :
                    state.state === 'queued' ? 'bg-blue-500' :
                    'bg-slate-400'
                  }`} />
                  <p className="font-semibold text-sm text-on-surface">{state.name}</p>
                </div>
                <p className="text-xs text-on-surface-variant mt-1 capitalize">{state.state.replace('_', ' ')}</p>
                {state.currentTaskTitle && (
                  <p className="text-xs text-primary mt-1 truncate">Task: {state.currentTaskTitle}</p>
                )}
                {state.blockedReason && (
                  <p className="text-xs text-amber-600 mt-1">{state.blockedReason}</p>
                )}
              </div>
            ))}
          </div>

          {(queuedTasks.length > 0 || waitingTasks.length > 0) && (
            <div className="mt-4 border-t border-outline-variant pt-4">
              <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-3">Task Queue</p>
              <div className="grid gap-3 md:grid-cols-2">
                {queuedTasks.length > 0 && (
                  <div>
                    <p className="text-[10px] font-bold text-blue-600 uppercase mb-2">Queued ({queuedTasks.length})</p>
                    {queuedTasks.slice(0, 5).map((t) => (
                      <div key={t.id} className="flex items-center gap-2 py-1 text-xs text-on-surface-variant">
                        <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                        <span>{t.assignee}: {t.title}</span>
                      </div>
                    ))}
                  </div>
                )}
                {waitingTasks.length > 0 && (
                  <div>
                    <p className="text-[10px] font-bold text-amber-600 uppercase mb-2">Waiting on Dependencies ({waitingTasks.length})</p>
                    {waitingTasks.slice(0, 5).map((t) => (
                      <div key={t.id} className="flex items-center gap-2 py-1 text-xs text-on-surface-variant">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                        <span>{t.assignee}: {t.title}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </ExecutionPanel>
      )}

      {(blockedTasks.length > 0 || execution.status === 'running') && (
        <ExecutionPanel title="Execution detail">
          <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {phaseProgress && (
              <>
                <StatChip label="Total units" value={phaseProgress.total} icon="checklist" />
                <StatChip label="Completed" value={phaseProgress.completed} icon="task_alt" />
                <StatChip label="Running" value={phaseProgress.running} icon="play_circle" />
                <StatChip label="Blocked" value={phaseProgress.blocked} icon="block" />
              </>
            )}
          </div>
          {blockedTasks.length > 0 && (
            <p className="text-sm text-error">Blocked: {blockedTasks.map((t) => t.title).join(', ')}</p>
          )}
          <p className="mt-2 text-xs text-on-surface-variant">
            Target customers: {execution.targetCustomers}
          </p>
        </ExecutionPanel>
      )}

      <ExecutionChatPanel
        twin={twin}
        onAddLog={onAddLog}
        onUpdateTwin={onUpdateTwin}
        contextSummary={chatContextSummary}
      />
    </div>
  );
}
