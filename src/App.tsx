import { useState, useEffect } from 'react';

import LoginPage, { type NexusSession } from './components/LoginPage';
import LandingPage from './components/LandingPage';
import EntranceGatePage from './components/EntranceGatePage';
import CEODiscoveryInterview, { type CeoDiscoveryAnswers } from './components/CEODiscoveryInterview';
import { fetchMeApi, logoutApi, saveEntranceApi, type BusinessType } from './lib/authApi';
import {
  loadUserWorkspace,
  saveUserWorkspace,
  clearUserWorkspaceState,
  type UserWorkspace,
} from './lib/userWorkspace';
import { createStarterWorkspace } from './lib/starterWorkspace';
import MaterialIcon from './components/ui/MaterialIcon';
import ExecutionHome from './components/execution/ExecutionHome';
import ExecutiveDashboard from './components/ExecutiveDashboard';
import BusinessContextLoader from './components/BusinessContextLoader';
import { enrichWorkforce } from './data/defaultAgents';
import { getApiHeaders } from './utils/apiKeys';
import GoalCenter from './components/GoalCenter';
import DepartmentControl from './components/DepartmentControl';
import WorkforceManager from './components/WorkforceManager';
import ExecutiveChatSystem from './components/ExecutiveChatSystem';
import CorporateMemoryView from './components/CorporateMemoryView';
import ProjectsControl from './components/ProjectsControl';
import TimelineControl from './components/TimelineControl';
import ReportsControl from './components/ReportsControl';
import SettingsControl from './components/SettingsControl';
import MarketResearchPage from './components/MarketResearchPage';
import AnalyticsPage from './components/AnalyticsPage';
import IntegrationsPage from './components/IntegrationsPage';
import AdminCenterPage from './components/AdminCenterPage';
import ProfilePage from './components/ProfilePage';
import AppShell from './components/layout/AppShell';
import { getCompanyId, resetCompanyId } from './lib/companyId';
import { saveDiscoveryProfileApi } from './lib/onboardingApi';
import { categoryToIndustry } from './lib/discoveryQuestions';
import { runReplanApi, syncMilestoneKpisApi } from './lib/nexusOperations';
import { milestonesFromExecution } from './utils/executionToMilestones';
import type { AppTab } from './types/navigation';

import {
  BusinessTwin,
  Milestone,
  DepartmentState,
  AgentWorkforce,
  RiskItem,
  BusinessInsight,
  CorporateMemory,
} from './types';

import { getFullWorkforce, CORE_DEPARTMENTS, idleWorkforce } from './data/defaultAgents';
import {
  appendActivity,
  createInitialVisionWorkflow,
  loadVisionWorkflow,
  saveVisionWorkflow,
  type VisionWorkflowState,
} from './lib/visionWorkflow';

type AppGate = 'landing' | 'login' | 'entrance' | 'onboarding' | 'app';

function isPlaceholderTwin(twin: BusinessTwin | null): boolean {
  if (!twin) return true;
  return twin.name.endsWith("'s Venture") || twin.name.endsWith("'s Company");
}

function needsDiscovery(ws: UserWorkspace): boolean {
  return !ws.onboardingCompleted || isPlaceholderTwin(ws.twin);
}

function parseStoredSession(): NexusSession | null {
  try {
    const raw = localStorage.getItem('nexus_session');
    if (!raw) return null;
    const parsed = JSON.parse(raw) as NexusSession;
    if (!parsed?.email || !parsed?.token) return null;
    return parsed;
  } catch {
    return null;
  }
}

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>('dashboard');
  const [chatChannelRedirect, setChatChannelRedirect] = useState('CEO');

  const [isOnboardingLoading, setIsOnboardingLoading] = useState(false);
  const [isSimulatingTick, setIsSimulatingTick] = useState(false);

  const [twin, setTwin] = useState<BusinessTwin | null>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [departments, setDepartments] = useState<DepartmentState[]>([]);
  const [workforce, setWorkforce] = useState<AgentWorkforce[]>([]);
  const [risks, setRisks] = useState<RiskItem[]>([]);
  const [insights, setInsights] = useState<BusinessInsight[]>([]);
  const [memory, setMemory] = useState<CorporateMemory>({
    strategic: [],
    operational: [],
    learning: [],
    business: [],
    customer: [],
    failure: [],
  });

  const [logs, setLogs] = useState<string[]>([]);
  const [visionWorkflow, setVisionWorkflow] = useState<VisionWorkflowState>(loadVisionWorkflow);
  const [isCeoVisionRunning, setIsCeoVisionRunning] = useState(false);
  const [isResearchVisionRunning, setIsResearchVisionRunning] = useState(false);
  const [gate, setGate] = useState<AppGate>('landing');
  const [loginMode, setLoginMode] = useState<'login' | 'signup'>('login');
  const [sessionHydrated, setSessionHydrated] = useState(false);
  const [session, setSession] = useState<NexusSession | null>(null);
  const [founderName, setFounderName] = useState('');

  const applyWorkspace = (ws: UserWorkspace) => {
    setTwin(ws.twin);
    setMilestones(ws.milestones);
    setDepartments(ws.departments);
    setWorkforce(enrichWorkforce(ws.workforce));
    setRisks(ws.risks);
    setInsights(ws.insights);
    setMemory(ws.memory);
    setLogs(ws.logs);
    setVisionWorkflow(ws.visionWorkflow);
    saveVisionWorkflow(ws.visionWorkflow);
  };

  /** Landing → Login → Entrance (new/existing) → Discovery questions → App.
   *  Entrance is shown on every login/signup so the user can confirm or switch
   *  between new/existing. handleEntrance then routes to app (if already
   *  onboarded) or onboarding. */
  const routeAfterAuth = (_s: NexusSession, _ws: UserWorkspace) => {
    setGate('entrance');
  };

  const continueFromLanding = () => {
    if (!session) {
      setGate('login');
      return;
    }
    const ws = loadUserWorkspace(session.email);
    routeAfterAuth(session, ws);
  };

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const stored = parseStoredSession();
      if (!stored) {
        setSessionHydrated(true);
        return;
      }

      try {
        const { user } = await fetchMeApi(stored.token);
        if (cancelled) return;

        const fresh: NexusSession = {
          ...stored,
          id: user.id,
          email: user.email,
          founderName: user.founderName,
          authProvider: user.authProvider,
          businessType: user.businessType,
          needsEntrance: user.needsEntrance,
          onboardingCompleted: user.onboardingCompleted,
          businessProfile: user.businessProfile ?? null,
          businessProfileCompanyId: user.businessProfileCompanyId ?? null,
        };
        localStorage.setItem('nexus_session', JSON.stringify(fresh));

        const ws = loadUserWorkspace(fresh.email, {
          isNewAccount: fresh.needsEntrance,
        });
        if (user.onboardingCompleted && user.businessProfile && !ws.onboardingCompleted) {
          const profile = user.businessProfile as unknown as UserWorkspace['businessProfile'];
          ws.onboardingCompleted = true;
          ws.businessProfile = profile;
          saveUserWorkspace(fresh.email, {
            onboardingCompleted: true,
            businessProfile: profile,
          });
        }
        applyWorkspace(ws);
        setSession(fresh);
        setFounderName(fresh.founderName);
        // Stay on landing until user signs in — landing → login → entrance → questions
      } catch {
        localStorage.removeItem('nexus_session');
        setGate('landing');
      } finally {
        if (!cancelled) setSessionHydrated(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!session?.email || !sessionHydrated) return;
    saveUserWorkspace(session.email, {
      twin,
      milestones,
      departments,
      workforce,
      risks,
      insights,
      memory,
      logs,
      visionWorkflow,
      businessType: session.businessType ?? undefined,
      onboardingCompleted: twin ? true : undefined,
    });
  }, [
    session,
    twin,
    milestones,
    departments,
    workforce,
    risks,
    insights,
    memory,
    logs,
    visionWorkflow,
    sessionHydrated,
  ]);

  const handleAddLog = (msg: string) => {
    setLogs((prev) => {
      const next = [msg, ...prev].slice(0, 50);
      localStorage.setItem('nexus_logs', JSON.stringify(next));
      return next;
    });
  };

  const handleUpdateTwin = (updatedTwin: BusinessTwin) => {
    setTwin(updatedTwin);
    localStorage.setItem('nexus_twin', JSON.stringify(updatedTwin));
  };

  const handleUpdateFounderName = (name: string) => {
    if (!name.trim()) return;
    setFounderName(name);
    localStorage.setItem('nexus_founder_name', name);
    handleAddLog(`Security: Modified active executive operator signature to "${name}".`);
  };

  const handleSyncDepartments = (activeNames: string[]) => {
    setDepartments((prev) => {
      const updated = prev.map((d) => ({
        ...d,
        status: activeNames.includes(d.name)
          ? ('active' as const)
          : d.status === 'active'
            ? ('paused' as const)
            : d.status,
      }));
      localStorage.setItem('nexus_departments', JSON.stringify(updated));
      return updated;
    });
  };

  const handleSyncWorkforce = (runningAgents: string[]) => {
    setWorkforce((prev) => {
      const updated = enrichWorkforce(
        prev.map((a) => ({
          ...a,
          status: runningAgents.includes(a.name)
            ? ('working' as const)
            : a.status === 'working'
              ? ('standby' as const)
              : a.status,
          currentTask: runningAgents.includes(a.name)
            ? 'Executing workflow'
            : a.currentTask.includes('Executing')
              ? 'Awaiting next phase'
              : a.currentTask,
        })),
      );
      localStorage.setItem('nexus_workforce', JSON.stringify(updated));
      return updated;
    });
  };

  const handleCeoDiscoveryComplete = async (answers: CeoDiscoveryAnswers) => {
    setIsOnboardingLoading(true);
    handleAddLog(`CEO Discovery: Understanding ${answers.startupName} and generating business context…`);

    const profile = answers.businessProfile;
    const nextAction = profile.contexts.highestPriorityAction;

    const buildCeoObjective = () => {
      const base = `for ${answers.targetCustomer} (${answers.country})`;
      const tl = `${answers.timelineDays} days`;
      switch (answers.category) {
        case 'SaaS':
          return `Build an MVP ${base} in ${tl}`;
        case 'Hospitality':
          return `Launch ${answers.whatAreYouBuilding} ${base} in ${tl}`;
        case 'Physical Product':
          return `Validate product-market fit and plan initial sourcing ${base} within ${tl}`;
        case 'Agency':
          return `Package an offer and land first clients ${base} in ${tl}`;
        case 'E-commerce':
          return `Launch and scale e-commerce ${base} in ${tl}`;
        case 'Healthcare':
        case 'Education':
          return `Build and launch ${answers.whatAreYouBuilding} ${base} in ${tl}`;
        default:
          return `Launch and validate ${answers.whatAreYouBuilding} in ${tl}`;
      }
    };

    try {
      const ceoObjective = buildCeoObjective();

      const response = await fetch('/api/generate-twin', {
        method: 'POST',
        headers: getApiHeaders(),
        body: JSON.stringify({
          type: 'create',
          name: answers.startupName,
          industry: String(answers.industry || categoryToIndustry(answers.category)),
          goals: ceoObjective,
          budget: answers.initialBudget,
          stage: answers.stage,
          teamSize: answers.teamType === 'Solo' ? 1 : (profile.teamSize || 3),
          revenue: 0,
          expenses: Math.round(answers.initialBudget * 0.4),
          customers: 0,
          funding: 'Bootstrap',
          challenges: [
            `Location: ${answers.country}`,
            `Business category: ${answers.category}`,
            `Stage: ${answers.stage}`,
            `Target customer: ${answers.targetCustomer}`,
            `Problem: ${answers.problem || profile.contexts.goalProfile}`,
            `Manufacturing required: ${answers.manufacturingRequired}`,
            `Existing competitors: ${answers.existingCompetitors || 'None'}`,
            `Timeline: ${answers.timelineDays} days`,
            `Recommended next action: ${nextAction}`,
            `Execution roadmap: ${profile.contexts.executionRoadmap.slice(0, 4).join(' → ')}`,
          ].join(', '),
          tools: '',
          website: answers.website || '',
        }),
      });

      if (!response.ok) {
        throw new Error('Onboarding generation failed');
      }

      const data = await response.json();

      const subTwin: BusinessTwin = data.twin;
      const subMilestones: Milestone[] = data.milestones;
      const subRisks: RiskItem[] = data.risks;
      const subInsights: BusinessInsight[] = data.insights;

      const activeDepNames = new Set<string>(profile.contexts.departmentRequirements);

      const initialDeps: DepartmentState[] = CORE_DEPARTMENTS.map((dept) => {
        const autoActive = activeDepNames.has(dept.name);
        return {
          id: dept.id,
          name: dept.name,
          status: autoActive ? ('active' as const) : ('paused' as const),
          agentCount: dept.agentCount,
          activity: autoActive ? 'CEO: active division — executing next gates' : dept.activity,
          brief: dept.brief,
        };
      });

      const initialWorkforce = idleWorkforce(
        getFullWorkforce(initialDeps.filter((d) => d.status === 'active').map((d) => d.name)),
      );

      const freshVision = createInitialVisionWorkflow();
      setVisionWorkflow({ ...freshVision, step: 'vision_complete' });
      saveVisionWorkflow({ ...freshVision, step: 'vision_complete' });

      const initialMemory: CorporateMemory = {
        strategic: [
          `CEO Objective: ${ceoObjective}`,
          `Timeline: ${answers.timelineDays} days`,
          `Priority action: ${nextAction}`,
          profile.contexts.goalProfile,
        ],
        operational: [
          `Location: ${answers.country}`,
          `Stage: ${answers.stage}`,
          profile.contexts.resourceProfile,
        ],
        learning: [profile.contexts.marketProfile],
        business: [
          profile.contexts.businessProfile,
          `Budget: $${answers.initialBudget}`,
          profile.contexts.growthProfile,
        ],
        customer: [`Target customer: ${answers.targetCustomer}`, profile.contexts.marketProfile],
        failure: [profile.contexts.riskProfile],
      };

      setTwin({ ...subTwin, goals: [ceoObjective], challenges: [...(subTwin.challenges || []), `Recommended next action: ${nextAction}`] });
      setMilestones(subMilestones);
      setDepartments(initialDeps);
      setWorkforce(initialWorkforce);
      setRisks(subRisks);
      setInsights(subInsights);
      setMemory(initialMemory);

      localStorage.setItem('nexus_twin', JSON.stringify(subTwin));
      localStorage.setItem('nexus_milestones', JSON.stringify(subMilestones));
      localStorage.setItem('nexus_departments', JSON.stringify(initialDeps));
      localStorage.setItem('nexus_workforce', JSON.stringify(initialWorkforce));
      localStorage.setItem('nexus_risks', JSON.stringify(subRisks));
      localStorage.setItem('nexus_insights', JSON.stringify(subInsights));
      localStorage.setItem('nexus_memory', JSON.stringify(initialMemory));

      const companyId = getCompanyId(answers.startupName, session?.email, session?.id);
      try {
        await saveDiscoveryProfileApi(companyId, profile, session?.token);
      } catch {
        handleAddLog('Note: Business profile saved locally; server sync will retry on execution start.');
      }

      if (session?.email) {
        saveUserWorkspace(session.email, {
          onboardingCompleted: true,
          businessProfile: profile,
        });
      }

      handleAddLog(
        `CEO: Business context ready. Highest-priority action: ${nextAction}. Approve to start execution.`,
      );
      setActiveTab('dashboard');
      setGate('app');
    } catch (err) {
      console.error(err);
      handleAddLog(`Onboarding Error: CEO discovery generation interrupted.`);
    } finally {
      setIsOnboardingLoading(false);
    }
  };

  const handleLogin = (s: NexusSession) => {
    setSession(s);
    setFounderName(s.founderName);
    localStorage.setItem('nexus_founder_name', s.founderName);
    const ws = loadUserWorkspace(s.email, { isNewAccount: s.needsEntrance });
    if (s.onboardingCompleted && s.businessProfile && !ws.onboardingCompleted) {
      const profile = s.businessProfile as unknown as UserWorkspace['businessProfile'];
      ws.onboardingCompleted = true;
      ws.businessProfile = profile;
      saveUserWorkspace(s.email, { onboardingCompleted: true, businessProfile: profile });
    }
    applyWorkspace(ws);
    routeAfterAuth(s, ws);
  };

  const handleEntrance = async (businessType: BusinessType) => {
    if (!session?.token) return;
    const { user } = await saveEntranceApi(session.token, businessType);
    const updated: NexusSession = {
      ...session,
      businessType: user.businessType,
      needsEntrance: false,
    };
    setSession(updated);
    localStorage.setItem('nexus_session', JSON.stringify(updated));

    const serverOnboarded = !!updated.onboardingCompleted;
    const existingWs = loadUserWorkspace(updated.email);

    if (serverOnboarded && !needsDiscovery(existingWs)) {
      applyWorkspace(existingWs);
      saveUserWorkspace(updated.email, { businessType });
      setGate('app');
      return;
    }

    const starter = createStarterWorkspace(updated.founderName, businessType);
    applyWorkspace(starter);
    saveUserWorkspace(updated.email, starter);
    setGate('onboarding');
  };

  const handleLogout = async () => {
    if (session?.token) {
      await logoutApi(session.token).catch(() => {});
    }
    localStorage.removeItem('nexus_session');
    setSession(null);
    applyWorkspace(clearUserWorkspaceState());
    setGate('landing');
  };

  const handleNewCompanySetup = () => {
    if (
      !window.confirm(
        'Start fresh company setup? Your current company data will be cleared (session stays logged in).',
      )
    ) {
      return;
    }
    localStorage.removeItem('nexus_twin');
    localStorage.removeItem('nexus_milestones');
    localStorage.removeItem('nexus_departments');
    localStorage.removeItem('nexus_workforce');
    localStorage.removeItem('nexus_risks');
    localStorage.removeItem('nexus_insights');
    localStorage.removeItem('nexus_memory');
    localStorage.removeItem('nexus_logs');
    localStorage.removeItem('nexus_vision_workflow');
    resetCompanyId();
    setTwin(null);
    setMilestones([]);
    setDepartments([]);
    setWorkforce([]);
    setRisks([]);
    setInsights([]);
    setMemory({
      strategic: [],
      operational: [],
      learning: [],
      business: [],
      customer: [],
      failure: [],
    });
    if (session?.email) {
      saveUserWorkspace(session.email, { onboardingCompleted: false, businessProfile: null });
    }
    setGate('entrance');
    handleAddLog('Setup: Cleared company profile — choose new or existing business to continue.');
  };

  const handleResetEnterprise = () => {
    if (
      window.confirm(
        'Do you want to reset your Nexus Digital Twin enterprise? All sprints and goals configurations will be cleared.',
      )
    ) {
      if (session?.email) {
        saveUserWorkspace(session.email, clearUserWorkspaceState());
      }
      setTwin(null);
      setMilestones([]);
      setDepartments([]);
      setWorkforce([]);
      setRisks([]);
      setInsights([]);
      resetCompanyId();
      setMemory({
        strategic: [],
        operational: [],
        learning: [],
        business: [],
        customer: [],
        failure: [],
      });
      setLogs(['NEXUS OS Reset completed. Ready for configuration onboarding...']);
      const resetVision = createInitialVisionWorkflow();
      setVisionWorkflow(resetVision);
      saveVisionWorkflow(resetVision);
      setActiveTab('dashboard');
      setGate(session ? 'entrance' : 'landing');
    }
  };

  const patchVision = (patch: Partial<VisionWorkflowState> | ((prev: VisionWorkflowState) => VisionWorkflowState)) => {
    setVisionWorkflow((prev) => {
      const next = typeof patch === 'function' ? patch(prev) : { ...prev, ...patch };
      saveVisionWorkflow(next);
      return next;
    });
  };

  const setAgentsByIds = (
    ids: string[],
    status: AgentWorkforce['status'],
    currentTask: string,
  ) => {
    setWorkforce((prev) => {
      const updated = enrichWorkforce(
        prev.map((a) =>
          ids.includes(a.id) ? { ...a, status, currentTask } : a,
        ),
      );
      localStorage.setItem('nexus_workforce', JSON.stringify(updated));
      return updated;
    });
  };

  const handleBeginVision = () => {
    patchVision((prev) =>
      appendActivity(
        { ...prev, step: 'awaiting_ceo_task' },
        {
          agent: 'System',
          department: 'Command Center',
          message: 'Vision cycle started. Define the CEO directive — nothing runs automatically.',
          kind: 'info',
        },
      ),
    );
    handleAddLog('Vision: Step-wise cycle started. CEO agent awaits your task.');
  };

  const handleSubmitCeoTask = (task: string) => {
    patchVision((prev) =>
      appendActivity(
        { ...prev, step: 'ceo_approval', ceoTask: task },
        {
          agent: 'CEO Agent',
          department: 'Executive Layer',
          message: `Requested approval to run: "${task}"`,
          kind: 'approval',
        },
      ),
    );
    handleAddLog(`Vision: CEO awaiting your approval for "${task}".`);
  };

  const handleApproveCeo = () => {
    if (isCeoVisionRunning) return;
    setIsCeoVisionRunning(true);
    const task = visionWorkflow.ceoTask;
    const brand = twin?.name ?? 'your venture';
    const budget = twin?.budget ?? 0;

    patchVision((prev) =>
      appendActivity(
        { ...prev, step: 'ceo_active' },
        {
          agent: 'CEO Agent',
          department: 'Executive Layer',
          message: `Executing strategic brief for ${brand} (budget ${budget.toLocaleString()}).`,
          kind: 'working',
        },
      ),
    );
    setAgentsByIds(['ceo'], 'working', task);
    handleAddLog(`Vision: CEO approved — working on "${task}".`);

    window.setTimeout(() => {
      const ceoOutput = `Strategic brief for ${brand}: align ${task} with ${budget.toLocaleString()} monthly runway and ${twin?.stage ?? 'current'} stage priorities.`;
      const researchBrief = `Market research for ${brand} in ${twin?.industry ?? 'your industry'}: competitor scan, ICP, and pricing bands tied to ${budget.toLocaleString()} budget.`;

      patchVision((prev) =>
        appendActivity(
          {
            ...prev,
            step: 'research_approval',
            researchBrief,
            outputs: [...prev.outputs, ceoOutput],
          },
          {
            agent: 'CEO Agent',
            department: 'Executive Layer',
            message: 'CEO brief complete. Research division requests permission to continue.',
            kind: 'output',
          },
        ),
      );
      setAgentsByIds(['ceo'], 'standby', 'Brief complete — awaiting research approval');
      setIsCeoVisionRunning(false);
      handleAddLog('Vision: CEO complete. Approve research division to continue.');
    }, 2800);
  };

  const handleDeclineCeo = () => {
    patchVision((prev) =>
      appendActivity(
        { ...prev, step: 'awaiting_ceo_task' },
        {
          agent: 'CEO Agent',
          department: 'Executive Layer',
          message: 'CEO run declined. Edit your task and submit again.',
          kind: 'info',
        },
      ),
    );
    handleAddLog('Vision: CEO run declined by operator.');
  };

  const handleApproveResearch = () => {
    if (isResearchVisionRunning || !twin) return;
    setIsResearchVisionRunning(true);

    const updatedDeps = departments.map((d) =>
      d.id === 'research' ? { ...d, status: 'active' as const } : d,
    );
    setDepartments(updatedDeps);
    localStorage.setItem('nexus_departments', JSON.stringify(updatedDeps));

    patchVision((prev) =>
      appendActivity(
        { ...prev, step: 'research_active' },
        {
          agent: 'Market Research Agent',
          department: 'Research Division',
          message: prev.researchBrief,
          kind: 'working',
        },
      ),
    );
    setAgentsByIds(
      ['mkt-research', 'comp-analysis'],
      'working',
      visionWorkflow.researchBrief,
    );
    handleAddLog('Vision: Research division approved and running.');

    window.setTimeout(() => {
      const researchOutput = `Research memo for ${twin.name}: sector signals in ${twin.industry}, budget-fit GTM options under ${twin.budget.toLocaleString()}/mo.`;
      patchVision((prev) =>
        appendActivity(
          {
            ...prev,
            step: 'vision_complete',
            outputs: [...prev.outputs, researchOutput],
          },
          {
            agent: 'Market Research Agent',
            department: 'Research Division',
            message: 'Research cycle complete. Outputs available on dashboard and Market Research.',
            kind: 'output',
          },
        ),
      );
      setAgentsByIds(
        ['mkt-research', 'comp-analysis'],
        'standby',
        'Research complete — awaiting next directive',
      );
      setIsResearchVisionRunning(false);
      handleAddLog('Vision: Initial CEO → Research cycle complete.');
    }, 3200);
  };

  const handleDeclineResearch = () => {
    patchVision((prev) =>
      appendActivity(
        { ...prev, step: 'research_approval' },
        {
          agent: 'Research Division',
          department: 'Research Division',
          message: 'Research run declined. Approve when ready — CEO outputs remain available.',
          kind: 'info',
        },
      ),
    );
    handleAddLog('Vision: Research run declined by operator.');
  };

  const handleToggleDepartmentStatus = (id: string, nextStatus: DepartmentState['status']) => {
    const updated = departments.map((dept) => {
      if (dept.id === id) {
        return { ...dept, status: nextStatus };
      }
      return dept;
    });

    setDepartments(updated);
    localStorage.setItem('nexus_departments', JSON.stringify(updated));

    const activeDepNames = updated.filter((d) => d.status === 'active').map((d) => d.name);
    const updatedWorkforce = enrichWorkforce(
      workforce.map((agent) => {
        const isDepActive = activeDepNames.includes(agent.department);
        return {
          ...agent,
          status: 'standby' as const,
          currentTask: isDepActive
            ? agent.currentTask.includes('Awaiting')
              ? 'Department active — awaiting your task approval'
              : agent.currentTask
            : 'Idle on Standby (Department Paused)',
        };
      }),
    );

    setWorkforce(updatedWorkforce);
    localStorage.setItem('nexus_workforce', JSON.stringify(updatedWorkforce));
  };

  const handleUpdateMilestone = (updated: Milestone) => {
    const updatedMilestones = milestones.map((m) => (m.id === updated.id ? updated : m));
    setMilestones(updatedMilestones);
    localStorage.setItem('nexus_milestones', JSON.stringify(updatedMilestones));
  };

  const handleDecomposeGoal = (newMilestone: Milestone) => {
    const updated = [...milestones, newMilestone];
    setMilestones(updated);
    localStorage.setItem('nexus_milestones', JSON.stringify(updated));
  };

  const handleUpdateMemory = (section: keyof CorporateMemory, items: string[]) => {
    const updated = { ...memory, [section]: items };
    setMemory(updated);
    localStorage.setItem('nexus_memory', JSON.stringify(updated));
  };

  const handleMergeMemory = (sections: Partial<CorporateMemory>) => {
    setMemory((prev) => {
      const mergeList = (key: keyof CorporateMemory) => {
        const incoming = sections[key];
        if (!incoming?.length) return prev[key] || [];
        const combined = [...incoming, ...(prev[key] || [])];
        return [...new Set(combined)].slice(0, 80);
      };
      const updated: CorporateMemory = {
        strategic: mergeList('strategic'),
        operational: mergeList('operational'),
        learning: mergeList('learning'),
        business: mergeList('business'),
        customer: mergeList('customer'),
        failure: mergeList('failure'),
      };
      localStorage.setItem('nexus_memory', JSON.stringify(updated));
      return updated;
    });
  };

  const handleSimulateTick = () => {
    if (isSimulatingTick) return;
    setIsSimulatingTick(true);

    handleAddLog(`Autonomous Control Layer: Instigating tactical sprint simulation sweeps...`);

    setTimeout(() => {
      let taskUpdated = false;
      let taskName = '';
      let assigneeName = '';

      const modifiedMilestones = milestones.map((milestone) => {
        if (taskUpdated || milestone.status === 'completed') return milestone;

        const updatedTasks = milestone.tasks.map((task) => {
          if (!taskUpdated && task.status !== 'completed') {
            taskUpdated = true;
            taskName = task.name;
            assigneeName = task.assignee;
            return { ...task, status: 'completed' as const };
          }
          return task;
        });

        if (taskUpdated) {
          const completedCount = updatedTasks.filter((t) => t.status === 'completed').length;
          const progress = Math.round((completedCount / updatedTasks.length) * 100);
          const status = progress === 100 ? ('completed' as const) : ('in_progress' as const);

          return {
            ...milestone,
            tasks: updatedTasks,
            progress,
            status,
          };
        }

        return milestone;
      });

      if (taskUpdated) {
        setMilestones(modifiedMilestones);
        localStorage.setItem('nexus_milestones', JSON.stringify(modifiedMilestones));
        handleAddLog(`Agent Workforce: Agent [${assigneeName}] completed deliverable artifact [${taskName}].`);

        const companyId = getCompanyId(twin!.name, session?.email, session?.id);
        syncMilestoneKpisApi(companyId, modifiedMilestones).catch(() => {});

        if (Math.random() < 0.35) {
          const riskIncidents = [
            {
              category: 'Technical',
              title: 'Relational Schema payload bottleneck',
              description: 'Under stress tests, database integrations reported increased latency.',
            },
            {
              category: 'Budget',
              title: 'Cloud server budget threshold slipped',
              description: 'High frequency agent calls increased operational server costs by $80.',
            },
            {
              category: 'Legal',
              title: 'Privacy compliance parameters warning',
              description: 'Updated landing forms must add customizable GDPR terms cookies.',
            },
          ];

          const incident = riskIncidents[Math.floor(Math.random() * riskIncidents.length)];
          const newRisk: RiskItem = {
            id: `r-${Date.now()}`,
            category: incident.category as RiskItem['category'],
            severity: 'high',
            title: incident.title,
            description: incident.description,
            status: 'triggered',
            actionTaken: 'Awaiting Autonomous Replanning evaluation loops...',
          };

          const nextRisks = [newRisk, ...risks];
          setRisks(nextRisks);
          localStorage.setItem('nexus_risks', JSON.stringify(nextRisks));

          handleAddLog(`Risk Monitor Alert: Registered new operational alert [${incident.title}]!`);

          const companyId = getCompanyId(twin!.name, session?.email, session?.id);
          runReplanApi(companyId, {
            id: newRisk.id,
            title: newRisk.title,
            description: newRisk.description,
            category: newRisk.category,
            severity: newRisk.severity,
          })
            .then(() => {
              handleAddLog(`Replanning Agent: COO review complete — task graph updated on task bus.`);
              setRisks((prevRisks) => {
                const revised = prevRisks.map((r) => {
                  if (r.id === newRisk.id) {
                    return {
                      ...r,
                      status: 'mitigated' as const,
                      actionTaken:
                        'Automatic replan: root cause logged, COO reassigned agents, timeline +3 days.',
                    };
                  }
                  return r;
                });
                localStorage.setItem('nexus_risks', JSON.stringify(revised));
                return revised;
              });
              handleMergeMemory({
                failure: [`[${incident.title}] ${incident.description}`],
                learning: [`Mitigated via replan engine for ${twin!.name}.`],
              });
              handleAddLog(
                `Strategic Memory: Threat [${incident.title}] mitigated via operations replan loop.`,
              );
            })
            .catch(() => {
              handleAddLog(`Replanning Agent: Server replan unavailable — local mitigation only.`);
            });
        }
      } else {
        handleAddLog(
          `Goal Evaluation: All milestone task checklists are fully completed on the current strategic roadmap! No standby tasks detected.`,
        );
      }

      setIsSimulatingTick(false);
    }, 1200);
  };

  const redirectChatToChannel = (name: string) => {
    const mapping: Record<string, string> = {
      'Executive Layer': 'CEO',
      'Research Division': 'CEO',
      'Product Office': 'COO',
      'Design Studio': 'CTO',
      'Engineering Core': 'CTO',
      'Growth & Marketing': 'CMO',
      'Sales Operations': 'CMO',
      'Financial Control': 'CFO',
      'Autonomous Control Unit': 'COO',
      'Legal & Policy': 'CFO',
    };

    const channel = mapping[name] || 'CEO';
    setChatChannelRedirect(channel);
    setActiveTab('chat');
  };

  const openProfile = () => setActiveTab('profile');

  if (!sessionHydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface text-on-surface-variant">
        <MaterialIcon name="progress_activity" className="animate-spin text-[32px] text-secondary" />
      </div>
    );
  }

  if (gate === 'landing') {
    return (
      <LandingPage
        onLogin={() => {
          setLoginMode('login');
          if (session) continueFromLanding();
          else setGate('login');
        }}
        onGetStarted={() => {
          setLoginMode('signup');
          if (session) continueFromLanding();
          else setGate('login');
        }}
        signedInAs={session?.founderName}
      />
    );
  }

  if (gate === 'login') {
    return (
      <LoginPage
        initialMode={loginMode}
        onLogin={handleLogin}
        onBack={() => setGate('landing')}
      />
    );
  }

  if (!session) {
    return (
      <LandingPage
        onLogin={() => {
          setLoginMode('login');
          setGate('login');
        }}
        onGetStarted={() => {
          setLoginMode('signup');
          setGate('login');
        }}
      />
    );
  }

  if (gate === 'entrance') {
    return (
      <EntranceGatePage
        founderName={session.founderName}
        founderEmail={session.email}
        onChoose={handleEntrance}
        onLogout={handleLogout}
      />
    );
  }

  if (gate === 'onboarding' && !session.businessType) {
    return (
      <EntranceGatePage
        founderName={session.founderName}
        founderEmail={session.email}
        onChoose={handleEntrance}
        onLogout={handleLogout}
      />
    );
  }

  if (gate === 'onboarding') {
    if (isOnboardingLoading) {
      return <BusinessContextLoader />;
    }
    return (
      <CEODiscoveryInterview
        onComplete={handleCeoDiscoveryComplete}
        isLoading={isOnboardingLoading}
        businessType={session.businessType}
        founderName={session.founderName}
      />
    );
  }

  const handleMilestonesFromExecution = (ms: Milestone[]) => {
    if (ms.length === 0) return;
    setMilestones(ms);
    localStorage.setItem('nexus_milestones', JSON.stringify(ms));
    const companyId = getCompanyId(twin.name, session?.email, session?.id);
    syncMilestoneKpisApi(companyId, ms).catch(() => {});
  };

  const executionHome = (
    <ExecutionHome
      twin={twin}
      founderEmail={session?.email}
      founderId={session?.id}
      businessType={session?.businessType}
      departments={departments}
      workforce={workforce}
      onAddLog={handleAddLog}
      onMergeMemory={handleMergeMemory}
      onSyncDepartments={handleSyncDepartments}
      onSyncWorkforce={handleSyncWorkforce}
      onMilestonesUpdate={handleMilestonesFromExecution}
      onNewCompanySetup={handleNewCompanySetup}
      onUpdateTwin={handleUpdateTwin}
    />
  );

  const navigate = (tab: AppTab) => setActiveTab(tab);

  const executiveDashboard = twin ? (
    <ExecutiveDashboard
      twin={twin}
      milestones={milestones}
      risks={risks}
      activeDepartmentsCount={departments.filter((d) => d.status === 'active').length}
      totalAgentsCount={workforce.length}
      onSimulateTick={handleSimulateTick}
      isSimulating={isSimulatingTick}
      logs={logs}
      departments={departments}
      workforce={workforce}
      onToggleDepartmentStatus={(id, next) => {
        setDepartments((prev) => {
          const updated = prev.map((d) => (d.id === id ? { ...d, status: next } : d));
          localStorage.setItem('nexus_departments', JSON.stringify(updated));
          return updated;
        });
      }}
      onNavigate={navigate}
      onAddLog={handleAddLog}
      onUpdateTwin={handleUpdateTwin}
      founderName={founderName || session?.founderName || 'Operator'}
      founderEmail={session?.email}
      founderId={session?.id}
      businessType={session?.businessType}
      visionWorkflow={visionWorkflow}
      onBeginVision={handleBeginVision}
      onSubmitCeoTask={handleSubmitCeoTask}
      onApproveCeo={handleApproveCeo}
      onDeclineCeo={handleDeclineCeo}
      onApproveResearch={handleApproveResearch}
      onDeclineResearch={handleDeclineResearch}
      isCeoVisionRunning={isCeoVisionRunning}
      isResearchVisionRunning={isResearchVisionRunning}
    />
  ) : null;

  return (
    <AppShell
      activeTab={activeTab}
      onNavigate={navigate}
      founderName={founderName}
      businessName={twin.name}
      stage={twin.stage}
      workforceCount={workforce.length}
      onOpenProfile={openProfile}
    >
      {activeTab === 'dashboard' && (executiveDashboard ?? executionHome)}

      {activeTab === 'operations' && executionHome}

      {activeTab === 'goals' && (
        <GoalCenter
          twin={twin}
          milestones={milestones}
          risks={risks}
          onUpdateMilestone={handleUpdateMilestone}
          onDecomposeGoal={handleDecomposeGoal}
          isDecomposing={isSimulatingTick}
          onAddLog={handleAddLog}
          visionWorkflow={visionWorkflow}
        />
      )}

      {activeTab === 'projects' && (
        <ProjectsControl twin={twin} milestones={milestones} onAddLog={handleAddLog} />
      )}

      {activeTab === 'departments' && (
        <DepartmentControl
          twin={twin}
          departments={departments}
          workforce={workforce}
          onToggleStatus={handleToggleDepartmentStatus}
          activeTab="exec"
          onSelectDepartment={redirectChatToChannel}
          onAddLog={handleAddLog}
        />
      )}

      {activeTab === 'workforce' && (
        <WorkforceManager
          twin={twin}
          workforce={workforce}
          onSimulateTick={handleSimulateTick}
          isSimulating={isSimulatingTick}
          onAddLog={handleAddLog}
          visionWorkflow={visionWorkflow}
        />
      )}

      {activeTab === 'timeline' && (
        <TimelineControl
          twin={twin}
          milestones={milestones}
          logs={logs}
          onAddLog={handleAddLog}
          visionWorkflow={visionWorkflow}
        />
      )}

      {activeTab === 'reports' && <ReportsControl twin={twin} />}

      {activeTab === 'memory' && (
        <CorporateMemoryView
          twin={twin}
          memory={memory}
          onUpdateMemory={handleUpdateMemory}
          onAddLog={handleAddLog}
        />
      )}

      {activeTab === 'market' && (
        <MarketResearchPage
          twin={twin}
          founderEmail={session?.email}
          founderId={session?.id}
          insights={insights}
          milestones={milestones}
          departments={departments}
          visionWorkflow={visionWorkflow}
        />
      )}

      {activeTab === 'analytics' && (
        <AnalyticsPage twin={twin} milestones={milestones} departments={departments} />
      )}

      {activeTab === 'integrations' && (
        <IntegrationsPage twin={twin} onAddLog={handleAddLog} />
      )}

      {activeTab === 'settings' && (
        <SettingsControl
          onAddLog={handleAddLog}
          onResetEnterprise={handleResetEnterprise}
          onLogout={handleLogout}
        />
      )}

      {activeTab === 'profile' && session && (
        <ProfilePage
          session={session}
          twin={twin}
          founderName={founderName}
          onUpdateFounderName={handleUpdateFounderName}
          onLogout={handleLogout}
          onAddLog={handleAddLog}
          onNavigateSettings={() => setActiveTab('settings')}
        />
      )}

      {activeTab === 'admin' && (
        <AdminCenterPage
          twin={twin}
          workforce={workforce}
          founderName={founderName}
          onAddLog={handleAddLog}
          onResetEnterprise={handleResetEnterprise}
        />
      )}

      {activeTab === 'chat' && (
        <ExecutiveChatSystem
          twin={twin}
          initialChannel={chatChannelRedirect}
          onAddLog={handleAddLog}
          onUpdateTwin={handleUpdateTwin}
        />
      )}
    </AppShell>
  );
}
