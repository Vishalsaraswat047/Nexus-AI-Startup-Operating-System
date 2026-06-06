import type { ReplanRecord } from './types';
import { getCompanyState, updateCompanyState } from './store';
import { appendEvent } from './eventLog';
import { assignTask, handoffTask } from './taskBus';
import { writeMemory } from './memoryOps';
import { createCooPlanFromObjective } from './ceoCoo';

function newId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export interface RiskInput {
  id: string;
  title: string;
  description: string;
  category: string;
  severity: string;
}

export function runAutomaticReplan(
  companyId: string,
  risk: RiskInput,
): ReplanRecord {
  const state = getCompanyState(companyId);
  const objective = state.ceoObjectives[0];

  appendEvent(companyId, {
    type: 'risk_detected',
    fromAgent: 'Risk Detector',
    department: 'Autonomous Control Unit',
    message: risk.title,
    payload: { riskId: risk.id, severity: risk.severity },
  });

  appendEvent(companyId, {
    type: 'replan_triggered',
    fromAgent: 'Replanning Agent',
    department: 'Autonomous Control Unit',
    message: `Analyzing: ${risk.title}`,
    payload: { riskId: risk.id },
  });

  const rootCause =
    risk.category === 'Technical'
      ? 'Delivery dependency blocked or integration latency exceeded threshold.'
      : risk.category === 'Budget'
        ? 'Burn rate exceeded planned operational envelope.'
        : 'Operational constraint detected on critical path.';

  const alternativePlan = objective
    ? `Re-sequence "${objective.objective}" milestones; add buffer for ${risk.category} mitigation.`
    : 'Bootstrap recovery sprint without active CEO objective — COO to define interim plan.';

  const cooReview =
    'COO Agent reviewed alternative plan: reassign blocked work, extend timeline by 3 days, notify founder.';

  const reassignedAgents = ['Planner Agent', 'COO Agent', 'Replanning Agent'];

  if (objective) {
    createCooPlanFromObjective(companyId, objective.id);
  }

  assignTask(companyId, {
    title: `Mitigate: ${risk.title}`,
    assignee: 'Replanning Agent',
    department: 'Autonomous Control Unit',
    fromAgent: 'COO Agent',
  });

  const mitigationTask = getCompanyState(companyId).tasks[0];
  if (mitigationTask) {
    handoffTask(
      companyId,
      mitigationTask.id,
      'Planner Agent',
      'Replanning Agent',
      'Autonomous Control Unit',
      'Planner implements revised task graph',
    );
  }

  const record: ReplanRecord = {
    id: newId('replan'),
    companyId,
    riskId: risk.id,
    rootCause,
    alternativePlan,
    cooReview,
    reassignedAgents,
    timelineDeltaDays: 3,
    createdAt: Date.now(),
  };

  updateCompanyState(companyId, (s) => ({
    ...s,
    replanHistory: [record, ...s.replanHistory].slice(0, 50),
  }));

  appendEvent(companyId, {
    type: 'replan_completed',
    fromAgent: 'Replanning Agent',
    department: 'Autonomous Control Unit',
    message: `Replan complete for ${risk.title}`,
    payload: { replanId: record.id, timelineDeltaDays: 3 },
  });

  writeMemory(companyId, {
    type: 'failure',
    content: `Risk: ${risk.title}. Root cause: ${rootCause}. Plan: ${alternativePlan}`,
    agent: 'Replanning Agent',
  });

  writeMemory(companyId, {
    type: 'learning',
    content: `Mitigation applied: ${cooReview}`,
    agent: 'Replanning Agent',
  });

  return record;
}
