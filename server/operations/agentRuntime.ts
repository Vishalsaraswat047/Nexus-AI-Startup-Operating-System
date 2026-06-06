import type { ApprovalTier } from './types';

/** Production agent definition — 10 required components */
export interface AgentRuntimeDefinition {
  id: string;
  role: string;
  knowledge: string[];
  skills: string[];
  tools: string[];
  permissions: string[];
  approvalRules: { actionType: string; tier: ApprovalTier }[];
  memoryAccess: ('strategic' | 'operational' | 'customer' | 'business' | 'learning' | 'failure')[];
  executionEngine: 'workflow' | 'llm_advisory' | 'integration';
  communication: { channels: string[]; reportsTo: string };
  kpiTracking: string[];
}

const BASE_TOOLS = ['task_bus', 'memory_write', 'event_log'];
const EXEC_TOOLS = [...BASE_TOOLS, 'objective_api', 'delegation'];
const WORKER_TOOLS = [...BASE_TOOLS, 'workflow_runner', 'approval_request'];

export const AGENT_RUNTIME_REGISTRY: Record<string, AgentRuntimeDefinition> = {
  ceo: {
    id: 'ceo',
    role: 'Chief Executive Officer — objectives and KPIs only; never executes work',
    knowledge: ['company vision', 'market position', 'runway constraints'],
    skills: ['objective_setting', 'kpi_definition', 'department_selection', 'priority_ranking'],
    tools: ['objective_api', 'kpi_api', 'delegation'],
    permissions: ['create_objective', 'assign_departments'],
    approvalRules: [],
    memoryAccess: ['strategic', 'business'],
    executionEngine: 'llm_advisory',
    communication: { channels: ['executive_bus'], reportsTo: 'User' },
    kpiTracking: ['goal_completion', 'department_activation'],
  },
  coo: {
    id: 'coo',
    role: 'Chief Operating Officer — converts objectives into execution',
    knowledge: ['milestones', 'dependencies', 'resource allocation'],
    skills: ['project_creation', 'task_graph', 'agent_assignment', 'timeline_management'],
    tools: EXEC_TOOLS,
    permissions: ['create_plan', 'assign_tasks', 'handoff_tasks', 'trigger_replan'],
    approvalRules: [{ actionType: 'publish', tier: 'yellow' }],
    memoryAccess: ['strategic', 'operational', 'learning'],
    executionEngine: 'workflow',
    communication: { channels: ['task_bus', 'department_managers'], reportsTo: 'CEO Agent' },
    kpiTracking: ['tasks_completed', 'milestone_velocity', 'blocked_tasks'],
  },
  'marketing-manager': {
    id: 'marketing-manager',
    role: 'Marketing Manager — orchestrates marketing projects',
    knowledge: ['brand guidelines', 'campaign calendar', 'channel strategy'],
    skills: ['project_bootstrap', 'content_pipeline', 'influencer_coordination'],
    tools: WORKER_TOOLS,
    permissions: ['create_marketing_projects', 'delegate_to_workers'],
    approvalRules: [
      { actionType: 'publish', tier: 'yellow' },
      { actionType: 'account_create', tier: 'yellow' },
    ],
    memoryAccess: ['operational', 'business', 'customer'],
    executionEngine: 'workflow',
    communication: { channels: ['task_bus'], reportsTo: 'COO Agent' },
    kpiTracking: ['content_scheduled', 'social_channels_live'],
  },
  'social-media': {
    id: 'social-media',
    role: 'Social Media Agent — channel presence and scheduling',
    knowledge: ['platform requirements', 'bio templates', 'brand assets'],
    skills: ['presence_audit', 'account_setup', 'content_schedule', 'analytics_handoff'],
    tools: [...WORKER_TOOLS, 'social_presence_workflow'],
    permissions: ['audit_channels', 'request_account_creation'],
    approvalRules: [
      { actionType: 'account_create', tier: 'yellow' },
      { actionType: 'social_post', tier: 'yellow' },
    ],
    memoryAccess: ['operational', 'business'],
    executionEngine: 'workflow',
    communication: { channels: ['task_bus'], reportsTo: 'Marketing Manager Agent' },
    kpiTracking: ['instagram', 'facebook', 'linkedin', 'youtube', 'google_business'],
  },
  'replanning-agent': {
    id: 'replanning-agent',
    role: 'Replanning Agent — failure recovery and COO coordination',
    knowledge: ['risk patterns', 'dependency graphs', 'historical failures'],
    skills: ['root_cause_analysis', 'alternative_plans', 'timeline_adjustment'],
    tools: [...BASE_TOOLS, 'replan_api'],
    permissions: ['trigger_replan', 'reassign_agents'],
    approvalRules: [],
    memoryAccess: ['learning', 'failure', 'operational'],
    executionEngine: 'workflow',
    communication: { channels: ['task_bus', 'coo'], reportsTo: 'COO Agent' },
    kpiTracking: ['risks_mitigated', 'replan_cycles'],
  },
};

export function getAgentRuntime(agentId: string): AgentRuntimeDefinition | undefined {
  return AGENT_RUNTIME_REGISTRY[agentId];
}

export function listAgentRuntimes(): AgentRuntimeDefinition[] {
  return Object.values(AGENT_RUNTIME_REGISTRY);
}

export function validateAgentCanExecute(
  agentId: string,
  actionType: string,
): { ok: boolean; reason?: string } {
  const def = getAgentRuntime(agentId);
  if (!def) return { ok: true };
  if (agentId === 'ceo' && !['create_objective', 'assign_departments'].includes(actionType)) {
    return { ok: false, reason: 'CEO Agent does not execute work — delegate to COO.' };
  }
  return { ok: true };
}
