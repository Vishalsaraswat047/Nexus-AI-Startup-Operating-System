import type { BusinessTwin } from '../types';

export interface PhaseProgressStats {
  phaseId: string;
  phaseName: string;
  total: number;
  completed: number;
  running: number;
  blocked: number;
  queued: number;
  progress: number;
  displayProgress?: number;
  status: string;
}

export interface AgentStateView {
  agentId: string;
  name: string;
  state: 'idle' | 'queued' | 'running' | 'blocked' | 'waiting_approval' | 'completed' | 'failed';
  currentTaskId?: string;
  currentTaskTitle?: string;
  startedAt?: number;
  completedAt?: number;
  blockedReason?: string;
}

export interface ExecutionTaskView {
  id: string;
  phaseId: string;
  title: string;
  assignee: string;
  department: string;
  status: string;
  subtasks: Array<{ id: string; title: string; status: string }>;
  blockedReason?: string;
  dependencies: string[];
  output?: string;
  findings?: Record<string, unknown>;
}

export interface ExecutionView {
  execution: {
    status: string;
    objective: string;
    location: string;
    targetCustomers: string;
    timelineDays: number;
    currentPhaseId: string | null;
    activeAgents: string[];
    activeDepartments: string[];
    autoRunAll?: boolean;
    continuousMode?: boolean;
    continuousRound?: number;
    continuousDirectives?: Array<{
      id: string;
      title: string;
      rationale: string;
      department: string;
      assignee: string;
      createdAt: number;
      status: 'pending' | 'running' | 'completed' | 'failed';
      completedAt?: number;
      outputSummary?: string;
    }>;
    phases: Array<{ id: string; key: string; name: string; department: string; status: string }>;
    tasks: ExecutionTaskView[];
    recommendations: Array<{
      id: string;
      phaseKey: string;
      label: string;
      description: string;
      reason?: string;
      departments?: string[];
      isPrimary?: boolean;
      revenueImpact?: 'direct' | 'indirect' | 'enabling';
      blocksLaunch?: boolean;
      roi?: 'high' | 'medium' | 'low';
      isOperational?: boolean;
    }>;
    ceoRecommendation?: {
      completedSummary: string;
      learned: string;
      blocked: string;
      nextStep: string;
      reason: string;
      departments: string[];
      revenueDriver?: string;
      launchUnblocker?: string;
      highestRoi?: string;
      basedOnFindings?: string[];
    } | null;
    deliverables: Array<{
      id: string;
      title: string;
      summary: string;
      agent: string;
      createdAt: number;
      details?: string[];
    }>;
    brandDiscovery: {
      mainBrandValues: string;
      whatsNew: string;
      brandPersonality: string;
      taglineOrVision: string;
    } | null;
    agentStates: Record<string, AgentStateView>;
  };
  currentPhase: { id: string; name: string; key: string; department: string; status: string } | null;
  phaseProgress: PhaseProgressStats | null;
  allPhasesProgress: PhaseProgressStats[];
  runningAgents: string[];
  blockedTasks: ExecutionTaskView[];
  pendingApprovalsCount: number;
  agentStates: Record<string, AgentStateView>;
  queuedTasks: ExecutionTaskView[];
  waitingTasks: ExecutionTaskView[];
}

const base = '/api/operations';

export async function startExecutionApi(
  companyId: string,
  params: {
    directive: string;
    twin: BusinessTwin;
    location: string;
    targetCustomers: string;
    timelineDays: number;
  },
): Promise<ExecutionView> {
  const res = await fetch(`${base}/${encodeURIComponent(companyId)}/execution/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error('Failed to start execution');
  return res.json();
}

export async function fetchExecutionApi(companyId: string): Promise<ExecutionView | null> {
  const res = await fetch(`${base}/${encodeURIComponent(companyId)}/execution`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error('Failed to load execution');
  return res.json();
}

export async function tickExecutionApi(companyId: string): Promise<ExecutionView | null> {
  const res = await fetch(`${base}/${encodeURIComponent(companyId)}/execution/tick`, {
    method: 'POST',
  });
  if (!res.ok) return null;
  return res.json();
}

export async function submitBrandDiscoveryApi(
  companyId: string,
  answers: {
    mainBrandValues: string;
    whatsNew: string;
    brandPersonality: string;
    taglineOrVision: string;
  },
): Promise<ExecutionView> {
  const res = await fetch(`${base}/${encodeURIComponent(companyId)}/execution/brand-discovery`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(answers),
  });
  if (!res.ok) throw new Error('Failed to submit brand discovery');
  return res.json();
}

export async function choosePhaseApi(companyId: string, phaseKey: string): Promise<ExecutionView> {
  const res = await fetch(`${base}/${encodeURIComponent(companyId)}/execution/choose`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phaseKey }),
  });
  if (!res.ok) throw new Error('Failed to start phase');
  return res.json();
}
