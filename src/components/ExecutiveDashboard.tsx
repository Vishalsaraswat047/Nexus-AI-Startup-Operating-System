import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Send, FolderSync } from 'lucide-react';
import {
  BusinessTwin,
  Milestone,
  RiskItem,
  DepartmentState,
  AgentWorkforce,
} from '../types';
import { getApiHeaders } from '../utils/apiKeys';
import type { AppTab } from '../types/navigation';
import MaterialIcon from './ui/MaterialIcon';
import { KpiCard, ProgressLine, SectionLink } from './stitch/StitchPrimitives';
import PageHeader from './stitch/PageHeader';
import EmptyState from './stitch/EmptyState';
import CeoStatusCard from './dashboard/CeoStatusCard';
import IndustrySummaryCard from './dashboard/IndustrySummaryCard';
import DirectivesList from './dashboard/DirectivesList';
import ApprovalsList, { type PendingApproval } from './dashboard/ApprovalsList';
import DeliverablesList, { type DashboardDeliverable } from './dashboard/DeliverablesList';
import {
  computeHealthScore,
  computeRunwayLabel,
  computeBurnRate,
  goalsOnTrack,
  activeGoalsCount,
  deriveProjectsFromMilestones,
  formatCurrency,
  formatRelativeTime,
  stageIndex,
  STAGE_TIMELINE,
} from '../utils/businessMetrics';
import type { VisionWorkflowState } from '../lib/visionWorkflow';
import VisionWorkflowPanel from './VisionWorkflowPanel';
import { getCompanyId } from '../lib/companyId';
import { useExecutionView } from '../lib/useExecutionView';
import { resolveApprovalApi, fetchOperationsSnapshot } from '../lib/nexusOperations';
import type { BusinessType } from '../lib/authApi';

interface ExecutiveDashboardProps {
  twin: BusinessTwin;
  milestones: Milestone[];
  risks: RiskItem[];
  activeDepartmentsCount: number;
  totalAgentsCount: number;
  onSimulateTick: () => void;
  isSimulating: boolean;
  logs: string[];
  departments: DepartmentState[];
  workforce: AgentWorkforce[];
  onToggleDepartmentStatus: (id: string, next: DepartmentState['status']) => void;
  onNavigate: (tab: AppTab) => void;
  onAddLog: (msg: string) => void;
  onUpdateTwin: (twin: BusinessTwin) => void;
  founderName: string;
  founderEmail?: string;
  founderId?: string;
  businessType?: BusinessType | null;
  visionWorkflow: VisionWorkflowState;
  onBeginVision: () => void;
  onSubmitCeoTask: (task: string) => void;
  onApproveCeo: () => void;
  onDeclineCeo: () => void;
  onApproveResearch: () => void;
  onDeclineResearch: () => void;
  isCeoVisionRunning: boolean;
  isResearchVisionRunning: boolean;
}

const GOAL_ICONS = ['rocket_launch', 'group_add', 'monetization_on', 'target', 'trending_up'];
const GOAL_COLORS = [
  { bg: 'bg-purple-50', text: 'text-purple-600', bar: 'bg-purple-600' },
  { bg: 'bg-emerald-50', text: 'text-emerald-600', bar: 'bg-emerald-600' },
  { bg: 'bg-orange-50', text: 'text-orange-500', bar: 'bg-orange-500' },
];

export default function ExecutiveDashboard({
  twin,
  milestones,
  risks,
  onSimulateTick,
  isSimulating,
  logs: appLogs,
  departments,
  workforce,
  onToggleDepartmentStatus,
  onNavigate,
  onAddLog,
  onUpdateTwin,
  founderName,
  founderEmail,
  founderId,
  businessType,
  visionWorkflow,
  onBeginVision,
  onSubmitCeoTask,
  onApproveCeo,
  onDeclineCeo,
  onApproveResearch,
  onDeclineResearch,
  isCeoVisionRunning,
  isResearchVisionRunning,
}: ExecutiveDashboardProps) {
  const [revenueInput, setRevenueInput] = useState(twin.revenue || 0);
  const [expensesInput, setExpensesInput] = useState(twin.expenses || 0);
  const [budgetInput, setBudgetInput] = useState(twin.budget || 0);
  const [pipelineFilter, setPipelineFilter] = useState<'all' | 'active'>('all');
  const [assistantOpen, setAssistantOpen] = useState(true);
  const [assistantInput, setAssistantInput] = useState('');
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'user' | 'assistant'; text: string }>>([
    {
      sender: 'assistant',
      text: `How can I help you today, ${founderName.split(' ')[0]}? I am synced with ${twin.name}'s operational state.`,
    },
  ]);
  const [isCopilotTyping, setIsCopilotTyping] = useState(false);
  const [pendingApprovals, setPendingApprovals] = useState<PendingApproval[]>([]);
  const [busyApproval, setBusyApproval] = useState<string | null>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  const companyId = useMemo(
    () => getCompanyId(twin.name, founderEmail, founderId),
    [twin.name, founderEmail, founderId],
  );
  const { view: execView, loading: execLoading, refresh: refreshExec } = useExecutionView(companyId);
  const { view: execViewUnused, refresh: refreshExecUnused } = useExecutionView(companyId);
  void execViewUnused;
  void refreshExecUnused;

  const refreshApprovals = useCallback(async () => {
    try {
      const snap = await fetchOperationsSnapshot(companyId);
      const pending = (snap.state.approvals ?? [])
        .filter((a) => a.status === 'pending')
        .map((a) => ({
          id: a.id,
          title: a.title,
          description: a.description,
          tier: a.tier,
          actionType: a.actionType,
        }));
      setPendingApprovals(pending);
    } catch {
      /* ignore */
    }
  }, [companyId]);

  useEffect(() => {
    setRevenueInput(twin.revenue || 0);
    setExpensesInput(twin.expenses || 0);
    setBudgetInput(twin.budget || 0);
  }, [twin]);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages]);

  useEffect(() => {
    refreshApprovals();
    const id = window.setInterval(refreshApprovals, 6000);
    return () => window.clearInterval(id);
  }, [refreshApprovals]);

  const handleResolveApproval = useCallback(
    async (id: string, status: 'approved' | 'declined') => {
      setBusyApproval(id);
      try {
        await resolveApprovalApi(companyId, id, status);
        onAddLog(`Approval ${status}: ${id}`);
        await Promise.all([refreshApprovals(), refreshExec()]);
      } catch {
        onAddLog('Approval: failed to resolve');
      } finally {
        setBusyApproval(null);
      }
    },
    [companyId, onAddLog, refreshApprovals, refreshExec],
  );

  const twinLive = { ...twin, revenue: revenueInput, expenses: expensesInput, budget: budgetInput };
  const health = computeHealthScore(twinLive, milestones, departments);
  const runway = computeRunwayLabel(twinLive);
  const burn = computeBurnRate(twinLive);
  const projects = deriveProjectsFromMilestones(milestones);
  const filteredProjects =
    pipelineFilter === 'active' ? projects.filter((p) => p.progress < 100) : projects;

  const displayGoals =
    milestones.length > 0
      ? milestones.slice(0, 3).map((m) => ({
          title: m.name,
          desc: m.project || twin.industry,
          pct: m.progress,
        }))
      : (twin.goals || []).slice(0, 3).map((g, i) => ({
          title: g,
          desc: twin.industry,
          pct: i === 0 ? 15 : 0,
        }));

  const activeRisks = risks.filter((r) => r.status === 'triggered').slice(0, 2);
  const currentStageIdx = stageIndex(twin.stage);
  const timelineProgress = Math.round(((currentStageIdx + 0.6) / 6) * 100);

  const handleUpdateFinancial = (field: 'revenue' | 'expenses' | 'budget', val: number) => {
    onUpdateTwin({ ...twin, [field]: val });
    onAddLog(`Financials: Updated ${field} to ${formatCurrency(val)}`);
  };

  const handleAssistantSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assistantInput.trim()) return;
    const query = assistantInput;
    setAssistantInput('');
    setChatMessages((prev) => [...prev, { sender: 'user', text: query }]);
    setIsCopilotTyping(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: getApiHeaders(),
        body: JSON.stringify({
          character: 'CEO',
          message: query,
          history: chatMessages.map((m) => ({
            role: m.sender === 'user' ? 'user' : 'model',
            text: m.text,
          })),
          twinContext: { ...twinLive, health: health ?? 50 },
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setChatMessages((prev) => [...prev, { sender: 'assistant', text: data.text }]);
      } else {
        throw new Error('offline');
      }
    } catch {
      setChatMessages((prev) => [
        ...prev,
        {
          sender: 'assistant',
          text: `Operational insight for ${twin.name} (${twin.stage}): Runway is ${runway}. ${milestones.length} milestones active. Ask about goals, risks, or departments.`,
        },
      ]);
    } finally {
      setIsCopilotTyping(false);
    }
  };

  const agentIcon = (role: string) => {
    if (role.includes('CEO')) return { icon: 'crown', bg: 'bg-purple-50', color: 'text-purple-600' };
    if (role.includes('COO')) return { icon: 'business_center', bg: 'bg-blue-50', color: 'text-blue-600' };
    if (role.includes('CTO')) return { icon: 'code', bg: 'bg-indigo-50', color: 'text-indigo-600' };
    if (role.includes('CMO') || role.includes('Marketing'))
      return { icon: 'campaign', bg: 'bg-amber-50', color: 'text-amber-600' };
    if (role.includes('CFO') || role.includes('Finance'))
      return { icon: 'savings', bg: 'bg-green-50', color: 'text-green-600' };
    return { icon: 'smart_toy', bg: 'bg-teal-50', color: 'text-teal-600' };
  };

  const firstName = founderName.trim() ? founderName.split(' ')[0] : 'there';
  const today = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const deliverables: DashboardDeliverable[] = useMemo(
    () => (execView?.execution.deliverables ?? []).map((d) => ({
      id: d.id,
      title: d.title,
      summary: d.summary,
      agent: d.agent,
      createdAt: d.createdAt,
      details: d.details,
    })),
    [execView],
  );

  const directives = execView?.execution.continuousDirectives ?? [];
  const industrySlug = twin.industry;

  return (
    <div className="relative space-y-6 pb-24">
      <PageHeader
        icon="dashboard"
        greeting={`${today} · ${twin.stage}`}
        title={`Good ${new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, ${firstName}!`}
        subtitle={`${twin.name} · ${twin.industry} · Budget ${formatCurrency(twin.budget)} · MRR ${formatCurrency(twin.revenue)}`}
        action={
          <>
            <button
              type="button"
              onClick={onSimulateTick}
              disabled={isSimulating}
              className="flex items-center gap-2 rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-2 text-sm font-semibold transition hover:bg-surface-container-low"
            >
              <FolderSync className={`h-4 w-4 ${isSimulating ? 'animate-spin' : ''}`} />
              Sync Workspaces
            </button>
            <button
              type="button"
              onClick={() => onNavigate('operations')}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-on-primary transition hover:bg-primary/90"
            >
              Open Execution Center
            </button>
          </>
        }
        stats={[
          { label: 'Health', value: health !== null ? `${health}%` : '—', icon: 'favorite', tone: 'emerald' },
          { label: 'Runway', value: runway, icon: 'schedule', tone: 'teal' },
          { label: 'Burn', value: formatCurrency(burn), icon: 'local_fire_department', tone: 'rose' },
          { label: 'Active Goals', value: activeGoalsCount(twin, milestones), icon: 'target', tone: 'violet' },
          { label: 'Departments', value: departments.filter((d) => d.status === 'active').length, icon: 'corporate_fare', tone: 'indigo' },
          { label: 'AI Agents', value: workforce.length, icon: 'smart_toy', tone: 'amber' },
        ]}
      />

      <CeoStatusCard
        view={execView ?? null}
        loading={execLoading}
        onOpenExecution={() => onNavigate('operations')}
      />

      {industrySlug ? (
        <IndustrySummaryCard
          industrySlug={industrySlug}
          businessType={businessType ?? 'new_brand'}
          onViewAll={() => onNavigate('operations')}
        />
      ) : (
        <EmptyState
          icon="storefront"
          title="No specific industry playbook selected"
          description="Re-run the CEO discovery to pick from 70+ industry-specific workflows (hotel, restaurant, coaching, SaaS, car wash, jewellery, etc.)."
          tone="primary"
        />
      )}

      {(pendingApprovals.length > 0 || directives.length > 0 || deliverables.length > 0) && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-amber-500/40 bg-amber-500/10 text-amber-700">
                  <MaterialIcon name="gavel" className="text-[16px]" />
                </div>
                <div>
                  <p className="text-sm font-bold text-on-surface">Pending approvals</p>
                  <p className="text-[10px] text-on-surface-variant">
                    Strategic gates — CEO paused, awaiting you
                  </p>
                </div>
              </div>
              <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                {pendingApprovals.length}
              </span>
            </div>
            <ApprovalsList
              approvals={pendingApprovals}
              busyId={busyApproval}
              onApprove={(id) => handleResolveApproval(id, 'approved')}
              onDecline={(id) => handleResolveApproval(id, 'declined')}
            />
          </div>

          <div className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-primary/40 bg-primary/10 text-primary">
                  <MaterialIcon name="bolt" className="text-[16px]" />
                </div>
                <div>
                  <p className="text-sm font-bold text-on-surface">CEO directives</p>
                  <p className="text-[10px] text-on-surface-variant">
                    Continuous operations — what CEO is directing
                  </p>
                </div>
              </div>
              {directives.length > 0 && (
                <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-bold text-primary">
                  {directives.length}
                </span>
              )}
            </div>
            <DirectivesList
              directives={directives}
              onOpenExecution={() => onNavigate('operations')}
            />
          </div>

          <div className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-emerald-500/40 bg-emerald-500/10 text-emerald-700">
                  <MaterialIcon name="inventory_2" className="text-[16px]" />
                </div>
                <div>
                  <p className="text-sm font-bold text-on-surface">Recent deliverables</p>
                  <p className="text-[10px] text-on-surface-variant">
                    Outputs agents have produced
                  </p>
                </div>
              </div>
              {deliverables.length > 0 && (
                <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                  {deliverables.length}
                </span>
              )}
            </div>
            <DeliverablesList
              deliverables={deliverables}
              onViewAll={() => onNavigate('operations')}
            />
          </div>
        </div>
      )}

      <VisionWorkflowPanel
        twin={twinLive}
        workflow={visionWorkflow}
        onBeginVision={onBeginVision}
        onSubmitCeoTask={onSubmitCeoTask}
        onApproveCeo={onApproveCeo}
        onDeclineCeo={onDeclineCeo}
        onApproveResearch={onApproveResearch}
        onDeclineResearch={onDeclineResearch}
        isCeoVisionRunning={isCeoVisionRunning}
        isResearchVisionRunning={isResearchVisionRunning}
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-6">
        <KpiCard
          icon="favorite"
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
          label="Business Health"
          value={health !== null ? `${health}%` : '—'}
          sub={
            health !== null ? (
              <div className="flex items-center gap-1 text-[12px] font-bold text-emerald-600">
                <MaterialIcon name="arrow_upward" className="text-[14px]" />
                {health >= 70 ? 'Healthy' : 'Needs attention'}
              </div>
            ) : (
              <span className="text-[12px] text-outline">Add revenue & expenses</span>
            )
          }
        />
        <KpiCard
          icon="account_balance_wallet"
          iconBg="bg-indigo-50"
          iconColor="text-indigo-600"
          label="Operating Budget"
          value={formatCurrency(budgetInput)}
          sub={
            <span className="text-[12px] text-on-surface-variant">
              From onboarding · {twin.name}
            </span>
          }
        />
        <KpiCard
          icon="payments"
          iconBg="bg-violet-50"
          iconColor="text-violet-600"
          label="Monthly Revenue"
          value={formatCurrency(revenueInput)}
          sub={
            <span className="text-[12px] text-on-surface-variant">MRR</span>
          }
        />
        <KpiCard
          icon="schedule"
          iconBg="bg-teal-50"
          iconColor="text-teal-600"
          label="Runway"
          value={runway}
          sub={
            <span className="rounded-full bg-teal-50 px-2 py-0.5 text-[12px] font-bold text-teal-600">
              {revenueInput >= expensesInput ? 'Profitable' : 'Healthy'}
            </span>
          }
        />
        <KpiCard
          icon="local_fire_department"
          iconBg="bg-rose-50"
          iconColor="text-rose-600"
          label="Burn Rate"
          value={
            <>
              {formatCurrency(burn)}{' '}
              <span className="text-sm font-normal text-on-surface-variant">/mo</span>
            </>
          }
          sub={
            <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[12px] font-bold text-rose-600">
              {burn > 0 ? 'Controlled' : 'No burn'}
            </span>
          }
        />
        <KpiCard
          icon="target"
          iconBg="bg-orange-50"
          iconColor="text-orange-600"
          label="Active Goals"
          value={activeGoalsCount(twin, milestones)}
          sub={
            <div className="text-[12px] font-bold text-emerald-600">
              {goalsOnTrack(milestones)} on track
            </div>
          }
        />
      </div>

      <div className="grid grid-cols-1 gap-gutter lg:grid-cols-12">
        <div className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-6 shadow-sm lg:col-span-4">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="font-bold text-primary">Active Goals</h3>
            <SectionLink onClick={() => onNavigate('goals')}>View all</SectionLink>
          </div>
          <div className="space-y-6">
            {displayGoals.length === 0 ? (
              <EmptyState
                variant="card"
                icon="track_changes"
                title="No goals yet"
                description="Open Goals to define your first strategic objective."
                tone="primary"
                action={
                  <button
                    type="button"
                    onClick={() => onNavigate('goals')}
                    className="rounded-md bg-primary px-3 py-1.5 text-xs font-bold text-on-primary"
                  >
                    Open Goals
                  </button>
                }
              />
            ) : (
              displayGoals.map((g, i) => {
                const c = GOAL_COLORS[i % GOAL_COLORS.length];
                return (
                  <button
                    key={g.title}
                    type="button"
                    onClick={() => onNavigate('goals')}
                    className="group w-full cursor-pointer text-left"
                  >
                    <div className="mb-2 flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`rounded-lg p-2 ${c.bg}`}>
                          <MaterialIcon
                            name={GOAL_ICONS[i % GOAL_ICONS.length]}
                            className={`text-[20px] ${c.text}`}
                          />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-primary">{g.title}</p>
                          <p className="text-[10px] text-outline">{g.desc}</p>
                        </div>
                      </div>
                      <p className="text-sm font-bold">{g.pct}%</p>
                    </div>
                    <ProgressLine pct={g.pct} color={c.bar} />
                  </button>
                );
              })
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-6 shadow-sm lg:col-span-5">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="font-bold text-primary">Project Pipeline</h3>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPipelineFilter('all')}
                className={`rounded-md px-2 py-1 text-[10px] font-bold ${
                  pipelineFilter === 'all' ? 'bg-surface-container' : 'text-outline'
                }`}
              >
                All ({projects.length})
              </button>
              <button
                type="button"
                onClick={() => setPipelineFilter('active')}
                className={`rounded-md px-2 py-1 text-[10px] font-bold ${
                  pipelineFilter === 'active' ? 'bg-surface-container' : 'text-outline'
                }`}
              >
                In Progress ({projects.filter((p) => p.progress < 100).length})
              </button>
            </div>
          </div>
          <div className="space-y-5">
            {filteredProjects.length === 0 ? (
              <EmptyState
                variant="card"
                icon="account_tree"
                title="No projects yet"
                description="Projects appear when milestones are generated from onboarding or goal decomposition."
                tone="primary"
              />
            ) : (
              filteredProjects.map((p) => (
                <button
                  key={p.name}
                  type="button"
                  onClick={() => onNavigate('projects')}
                  className="flex w-full items-center justify-between text-left"
                >
                  <div className="flex-1">
                    <div className="mb-1 flex justify-between">
                      <span className="text-sm font-bold">{p.name}</span>
                      <span className="text-xs font-bold text-secondary">{p.progress}%</span>
                    </div>
                    <ProgressLine pct={p.progress} />
                  </div>
                  <div className="ml-6 flex h-6 w-6 items-center justify-center rounded-full border-2 border-surface-container-lowest bg-surface-container text-[10px] font-bold">
                    {p.team.slice(0, 2).toUpperCase()}
                  </div>
                </button>
              ))
            )}
          </div>
          <div className="mt-8">
            <div className="mb-2 flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-outline">
                Department Status
              </h4>
              <SectionLink onClick={() => onNavigate('departments')}>Manage</SectionLink>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
              {departments.slice(0, 6).map((d) => (
                <div
                  key={d.id}
                  className="flex items-center justify-between rounded-lg p-2 transition-colors hover:bg-surface-container-low"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={`h-2 w-2 rounded-full ${
                        d.status === 'active' ? 'bg-emerald-500' : 'bg-orange-400'
                      }`}
                    />
                    <span className="text-[11px] font-semibold">{d.name.split(' ')[0]}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      onToggleDepartmentStatus(
                        d.id,
                        d.status === 'active' ? 'paused' : 'active',
                      )
                    }
                    className={`relative h-3 w-6 rounded-full ${
                      d.status === 'active' ? 'bg-secondary' : 'bg-outline-variant'
                    }`}
                    aria-label={`Toggle ${d.name}`}
                  >
                    <span
                      className={`absolute top-0.5 h-2 w-2 rounded-full bg-white transition-all ${
                        d.status === 'active' ? 'right-0.5' : 'left-0.5'
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-gutter lg:col-span-3">
          <div className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-6 shadow-sm">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="font-bold text-primary">Risk & Alerts</h3>
              <SectionLink onClick={() => onNavigate('reports')}>View all</SectionLink>
            </div>
            <div className="space-y-4">
              {activeRisks.length === 0 ? (
                <EmptyState
                  variant="card"
                  icon="verified"
                  title="No active risk alerts"
                  description="The system is monitoring all operational signals in real time."
                  tone="emerald"
                />
              ) : (
                activeRisks.map((r) => (
                  <div
                    key={r.id}
                    className={`flex items-start gap-3 rounded-xl border p-3 ${
                      r.severity === 'high'
                        ? 'border-red-100 bg-red-50/50'
                        : 'border-orange-100 bg-orange-50/50'
                    }`}
                  >
                    <MaterialIcon
                      name={r.severity === 'high' ? 'error' : 'warning'}
                      className={`text-lg ${r.severity === 'high' ? 'text-red-600' : 'text-orange-600'}`}
                    />
                    <div>
                      <div className="flex w-full justify-between gap-2">
                        <p
                          className={`text-[11px] font-bold ${r.severity === 'high' ? 'text-red-700' : 'text-orange-700'}`}
                        >
                          {r.title}
                        </p>
                        <span
                          className={`text-[10px] font-bold uppercase ${r.severity === 'high' ? 'text-red-600' : 'text-orange-600'}`}
                        >
                          {r.severity}
                        </span>
                      </div>
                      <p className="mt-0.5 text-[10px] leading-relaxed opacity-80">{r.description}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          <div className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-6 shadow-sm">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="font-bold text-primary">Recent Activity</h3>
            </div>
            <div className="space-y-4">
              {appLogs.length === 0 ? (
                <EmptyState
                  variant="card"
                  icon="terminal"
                  title="No activity yet"
                  description="Start execution to see agent activity stream here."
                  tone="slate"
                />
              ) : (
                appLogs.slice(0, 4).map((log, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-blue-100 text-blue-600">
                      <MaterialIcon name="terminal" className="text-sm" />
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-[11px] leading-tight text-primary">{log}</p>
                      <p className="mt-0.5 text-[10px] text-outline">{formatRelativeTime(log, i)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-8 shadow-sm">
        <h3 className="mb-10 font-bold text-primary">Execution Timeline</h3>
        <div className="relative">
          <div className="absolute left-0 right-0 top-[44px] z-0 h-1 bg-surface-container-high">
            <div className="h-full bg-secondary" style={{ width: `${timelineProgress}%` }} />
          </div>
          <div className="relative z-10 grid grid-cols-7">
            {STAGE_TIMELINE.map((phase, i) => {
              const done = i < currentStageIdx;
              const active = i === currentStageIdx;
              return (
                <div key={phase.id} className="group text-center">
                  <div
                    className={`mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border-2 border-white shadow-sm transition-transform group-hover:scale-110 ${
                      done
                        ? 'bg-emerald-50 ring-4 ring-emerald-100'
                        : active
                          ? 'bg-secondary text-on-secondary shadow-lg'
                          : 'bg-surface-container'
                    }`}
                  >
                    <MaterialIcon
                      name={phase.icon}
                      className={done ? 'text-emerald-600' : active ? 'text-on-secondary' : 'text-outline'}
                    />
                  </div>
                  <p className="text-xs font-bold">{phase.label}</p>
                  <p
                    className={`mt-1 text-[10px] font-bold ${done ? 'text-emerald-600' : active ? 'text-secondary' : 'text-outline'}`}
                  >
                    {done ? 'Completed' : active ? `In Progress (${twin.stage})` : 'Upcoming'}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-primary">AI Workforce</h3>
          <SectionLink onClick={() => onNavigate('workforce')}>View all agents</SectionLink>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4 xl:grid-cols-8">
          {workforce.slice(0, 7).map((agent) => {
            const meta = agentIcon(agent.role);
            const working = agent.status === 'working';
            const waiting = agent.status === 'waiting';
            return (
              <button
                key={agent.id}
                type="button"
                onClick={() => onNavigate('workforce')}
                className="group cursor-pointer rounded-xl border border-outline-variant bg-surface-container-lowest p-4 shadow-sm transition-colors hover:border-secondary"
              >
                <div className="mb-3 flex items-center gap-3">
                  <div className={`flex h-8 w-8 items-center justify-center rounded ${meta.bg}`}>
                    <MaterialIcon name={meta.icon} className={`text-sm ${meta.color}`} />
                  </div>
                  <span className="text-[11px] font-bold">{agent.name}</span>
                </div>
                <div className="mb-1 flex items-center gap-1.5">
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      working
                        ? 'animate-pulse bg-emerald-500'
                        : waiting
                          ? 'bg-amber-500'
                          : 'bg-outline-variant'
                    }`}
                  />
                  <span
                    className={`text-[9px] font-bold ${
                      working
                        ? 'text-emerald-600'
                        : waiting
                          ? 'text-amber-600'
                          : 'text-on-surface-variant'
                    }`}
                  >
                    {working ? 'Working' : waiting ? 'Awaiting approval' : 'Standby'}
                  </span>
                </div>
                <p className="text-[10px] leading-tight text-outline group-hover:text-primary">
                  {agent.currentTask}
                </p>
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => onNavigate('workforce')}
            className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-outline-variant p-4 text-outline transition-colors hover:bg-surface-container"
          >
            <MaterialIcon name="add" className="text-2xl" />
            <p className="mt-2 text-[10px] font-bold">Hire Agent</p>
          </button>
        </div>
      </div>

      {assistantOpen && (
        <div className="fixed bottom-6 right-6 z-50 flex w-80 flex-col overflow-hidden rounded-2xl border border-on-primary-container/20 bg-primary-container text-on-primary shadow-2xl">
          <div className="flex items-center justify-between border-b border-white/10 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary">
                <MaterialIcon name="smart_toy" className="text-sm text-on-secondary" />
              </div>
              <div>
                <h4 className="text-xs font-bold">Nexus Assistant</h4>
                <div className="flex items-center gap-1">
                  <span className="h-1 w-1 rounded-full bg-emerald-400" />
                  <span className="text-[9px] text-white/60">Online</span>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setAssistantOpen(false)}
              className="text-white/40 hover:text-white"
            >
              <MaterialIcon name="close" />
            </button>
          </div>
          <div ref={chatScrollRef} className="max-h-64 space-y-4 overflow-y-auto p-4">
            {chatMessages.map((msg, i) => (
              <p
                key={i}
                className={`rounded-xl border p-3 text-[11px] ${
                  msg.sender === 'user'
                    ? 'ml-4 border-white/10 bg-white/10'
                    : 'border-white/5 bg-white/5 text-on-primary-container'
                }`}
              >
                {msg.text}
              </p>
            ))}
            {isCopilotTyping && (
              <p className="text-[11px] italic text-on-primary-container">Processing...</p>
            )}
          </div>
          <form
            onSubmit={handleAssistantSubmit}
            className="flex gap-2 border-t border-white/10 bg-white/5 p-4"
          >
            <input
              value={assistantInput}
              onChange={(e) => setAssistantInput(e.target.value)}
              placeholder="Ask anything..."
              className="flex-1 border-none bg-transparent text-xs placeholder-white/40 outline-none focus:ring-0"
            />
            <button type="submit" className="rounded-lg bg-secondary p-1.5 hover:opacity-90">
              <Send className="h-4 w-4 text-on-secondary" />
            </button>
          </form>
        </div>
      )}
      {!assistantOpen && (
        <button
          type="button"
          onClick={() => setAssistantOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary-container shadow-2xl"
        >
          <MaterialIcon name="smart_toy" className="text-on-primary" />
        </button>
      )}
    </div>
  );
}
