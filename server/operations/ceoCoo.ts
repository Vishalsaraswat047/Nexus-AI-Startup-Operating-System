import type { CeoObjective, CooExecutionPlan, KpiRecord } from './types';
import { appendEvent } from './eventLog';
import { getCompanyState, updateCompanyState } from './store';
import { assignTask } from './taskBus';
import { writeMemory } from './memoryOps';

function newId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

const DEFAULT_DEPARTMENTS_BY_INDUSTRY: Record<string, string[]> = {
  Hospitality: ['Marketing', 'Operations', 'Sales', 'Design'],
  Technology: ['Engineering', 'Product', 'Marketing', 'Sales'],
  default: ['Marketing', 'Operations', 'Product', 'Engineering'],
};

export function createCeoObjective(
  companyId: string,
  userDirective: string,
  twin: Record<string, unknown>,
): CeoObjective {
  const industry = String(twin.industry || 'Technology');
  const departments =
    DEFAULT_DEPARTMENTS_BY_INDUSTRY[industry] ||
    DEFAULT_DEPARTMENTS_BY_INDUSTRY.default;

  const objective: CeoObjective = {
    id: newId('obj'),
    companyId,
    objective: userDirective,
    kpis: [
      { key: 'website_live', label: 'Website live', target: 'Yes' },
      { key: 'social_live', label: 'Social media live', target: 'All core channels' },
      { key: 'maps_listing', label: 'Google Maps / Business Profile', target: 'Verified' },
      { key: 'first_conversion', label: 'First bookings / conversions', target: '>= 1' },
    ],
    timelineDays: 30,
    departments,
    priorities: departments.map((d, i) => `${i + 1}. ${d}`),
    createdAt: Date.now(),
    userDirective,
  };

  updateCompanyState(companyId, (state) => {
    const kpis: KpiRecord[] = objective.kpis.map((k) => ({
      id: newId('kpi'),
      companyId,
      key: k.key,
      label: k.label,
      target: k.target,
      current: 'not_started',
      source: 'agent_activity' as const,
      updatedAt: Date.now(),
    }));

    return {
      ...state,
      ceoObjectives: [objective, ...state.ceoObjectives].slice(0, 20),
      kpis: [...kpis, ...state.kpis.filter((x) => !objective.kpis.some((o) => o.key === x.key))],
    };
  });

  appendEvent(companyId, {
    type: 'ceo_objective_created',
    fromAgent: 'CEO Agent',
    department: 'Executive Layer',
    message: `Objective set: ${userDirective}`,
    payload: { objectiveId: objective.id, departments, timelineDays: 30 },
  });

  writeMemory(companyId, {
    type: 'strategic',
    content: `CEO objective: ${userDirective}. KPIs: ${objective.kpis.map((k) => k.label).join(', ')}. Timeline: ${objective.timelineDays} days.`,
    agent: 'CEO Agent',
  });

  return objective;
}

export function createCooPlanFromObjective(
  companyId: string,
  objectiveId: string,
): CooExecutionPlan | null {
  const state = getCompanyState(companyId);
  const objective = state.ceoObjectives.find((o) => o.id === objectiveId);
  if (!objective) return null;

  const projects = objective.departments.map((dept) => ({
    name: `${dept} — ${objective.objective}`,
    milestones: [
      `Kickoff ${dept}`,
      `Deliver ${dept} outcomes`,
      `${dept} KPI verification`,
    ],
  }));

  const assignments = [
    {
      task: 'Operational task graph synthesis',
      agent: 'Planner Agent',
      department: 'Autonomous Control Unit',
    },
    {
      task: 'Marketing pipeline bootstrap',
      agent: 'Marketing Manager Agent',
      department: 'Growth & Marketing',
    },
    {
      task: 'Social presence audit',
      agent: 'Social Media Agent',
      department: 'Growth & Marketing',
    },
    {
      task: 'Engineering delivery track',
      agent: 'Engineering Manager Agent',
      department: 'Engineering Core',
    },
  ];

  const plan: CooExecutionPlan = {
    id: newId('plan'),
    companyId,
    objectiveId,
    projects,
    dependencies: projects.slice(1).map((p, i) => ({
      from: projects[i].name,
      to: p.name,
    })),
    assignments,
    resourceNotes: `Budget context from twin; departments: ${objective.departments.join(', ')}`,
    createdAt: Date.now(),
  };

  updateCompanyState(companyId, (s) => ({
    ...s,
    cooPlans: [plan, ...s.cooPlans].slice(0, 30),
  }));

  appendEvent(companyId, {
    type: 'coo_plan_created',
    fromAgent: 'COO Agent',
    department: 'Executive Layer',
    message: `Execution plan for: ${objective.objective}`,
    payload: { planId: plan.id, projectCount: projects.length },
  });

  writeMemory(companyId, {
    type: 'operational',
    content: `COO plan ${plan.id}: ${projects.length} projects, ${assignments.length} initial assignments.`,
    agent: 'COO Agent',
  });

  for (const a of assignments) {
    assignTask(companyId, {
      title: a.task,
      assignee: a.agent,
      department: a.department,
      project: objective.objective,
      fromAgent: 'COO Agent',
    });
  }

  return plan;
}
