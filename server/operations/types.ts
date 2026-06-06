/** Shared operations types — source of truth for event log, task bus, KPIs */

export type ApprovalTier = 'green' | 'yellow' | 'red';
export type ApprovalStatus = 'pending' | 'approved' | 'declined';

export type NexusEventType =
  | 'task_assigned'
  | 'task_handoff'
  | 'task_completed'
  | 'task_failed'
  | 'approval_requested'
  | 'approval_resolved'
  | 'ceo_objective_created'
  | 'coo_plan_created'
  | 'agent_action'
  | 'memory_written'
  | 'kpi_updated'
  | 'risk_detected'
  | 'replan_triggered'
  | 'replan_completed'
  | 'workflow_step'
  | 'ceo_recommendation'
  | 'onboarding_complete';

export interface NexusEvent {
  id: string;
  companyId: string;
  type: NexusEventType;
  timestamp: number;
  fromAgent: string;
  toAgent?: string;
  department: string;
  message: string;
  payload?: Record<string, unknown>;
}

export interface BusTask {
  id: string;
  companyId: string;
  title: string;
  status: 'queued' | 'in_progress' | 'completed' | 'failed';
  assignee: string;
  department: string;
  project?: string;
  milestoneId?: string;
  createdAt: number;
  updatedAt: number;
  handoffChain: string[];
}

export interface PendingApproval {
  id: string;
  companyId: string;
  tier: ApprovalTier;
  actionType: string;
  title: string;
  description: string;
  requestedBy: string;
  status: ApprovalStatus;
  createdAt: number;
  resolvedAt?: number;
  payload?: Record<string, unknown>;
}

export interface KpiRecord {
  id: string;
  companyId: string;
  key: string;
  label: string;
  target: number | string;
  current: number | string;
  unit?: string;
  source: 'agent_activity' | 'task_completion' | 'integration' | 'user_data';
  updatedAt: number;
}

export interface CeoObjective {
  id: string;
  companyId: string;
  objective: string;
  kpis: { key: string; label: string; target: string }[];
  timelineDays: number;
  departments: string[];
  priorities: string[];
  createdAt: number;
  userDirective: string;
}

export interface CooExecutionPlan {
  id: string;
  companyId: string;
  objectiveId: string;
  projects: { name: string; milestones: string[] }[];
  dependencies: { from: string; to: string }[];
  assignments: { task: string; agent: string; department: string }[];
  resourceNotes: string;
  createdAt: number;
}

export type SocialPlatform =
  | 'instagram'
  | 'facebook'
  | 'linkedin'
  | 'youtube'
  | 'google_business';

export interface SocialPlatformStatus {
  platform: SocialPlatform;
  exists: boolean;
  verified: boolean;
  lastCheckedAt: number;
}

export interface SocialWorkflowState {
  step:
    | 'idle'
    | 'checking'
    | 'awaiting_approval'
    | 'creating'
    | 'complete';
  platforms: SocialPlatformStatus[];
  pendingApprovalId?: string;
  lastRunAt?: number;
}

export interface ReplanRecord {
  id: string;
  companyId: string;
  riskId: string;
  rootCause: string;
  alternativePlan: string;
  cooReview: string;
  reassignedAgents: string[];
  timelineDeltaDays: number;
  createdAt: number;
}

export interface MemoryWrite {
  id: string;
  companyId: string;
  type: 'strategic' | 'operational' | 'customer' | 'business' | 'learning' | 'failure';
  content: string;
  agent: string;
  timestamp: number;
}

import type { ExecutionGraph } from './executionTypes';

export interface CompanyOperationsState {
  companyId: string;
  events: NexusEvent[];
  tasks: BusTask[];
  approvals: PendingApproval[];
  kpis: KpiRecord[];
  ceoObjectives: CeoObjective[];
  cooPlans: CooExecutionPlan[];
  memoryWrites: MemoryWrite[];
  socialWorkflow: SocialWorkflowState;
  replanHistory: ReplanRecord[];
  execution: ExecutionGraph | null;
  businessProfile?: Record<string, unknown> | null;
}

export interface DashboardMetrics {
  companyId: string;
  tasksCompleted: number;
  tasksInProgress: number;
  tasksQueued: number;
  pendingApprovals: number;
  eventsLast24h: number;
  kpiSummary: KpiRecord[];
  objectiveActive: CeoObjective | null;
  lastEventAt: number | null;
}
