export * from './types';
export { getCompanyState, updateCompanyState, resetCompanyState, emptyCompanyState } from './store';
export { appendEvent, listEvents, getDashboardFromState, logAgentAction } from './eventLog';
export { assignTask, handoffTask, completeTask, listTasks } from './taskBus';
export {
  classifyAction,
  evaluateAction,
  requestApproval,
  resolveApproval,
  listPendingApprovals,
  gateExecution,
} from './approvalPolicy';
export { createCeoObjective, createCooPlanFromObjective } from './ceoCoo';
export { generateCeoRecommendation, recommendationsFromCeo } from './ceoRecommendation';
export { saveBusinessProfile, getBusinessProfile } from './businessProfile';
export { writeMemory, memoryToCorporateSections } from './memoryOps';
export { getAgentRuntime, listAgentRuntimes, validateAgentCanExecute, AGENT_RUNTIME_REGISTRY } from './agentRuntime';
export { runSocialPresenceCheck, executeSocialAccountCreation, getSocialWorkflow, PLATFORM_LABELS } from './workflows/socialMedia';
export { runAutomaticReplan } from './replanning';
export {
  startExecution,
  tickExecution,
  chooseNextPhase,
  getExecution,
  buildExecutionView,
  computePhaseProgress,
  submitBrandDiscovery,
} from './executionEngine';
export type { ExecutionView, ExecutionGraph, PhaseProgressStats } from './executionTypes';

import { getCompanyState, updateCompanyState } from './store';
import { getDashboardFromState } from './eventLog';
import { memoryToCorporateSections } from './memoryOps';

export function getCompanySnapshot(companyId: string) {
  const state = getCompanyState(companyId);
  return {
    state,
    dashboard: getDashboardFromState(state),
    memorySections: memoryToCorporateSections(state.memoryWrites),
  };
}

export function syncKpiFromMilestones(
  companyId: string,
  milestones: { progress: number; status: string }[],
) {
  const avg =
    milestones.length > 0
      ? Math.round(milestones.reduce((s, m) => s + (m.progress || 0), 0) / milestones.length)
      : 0;

  updateCompanyState(companyId, (state) => {
    const kpis = state.kpis.map((k) => {
      if (k.key === 'goal_progress') {
        return { ...k, current: avg, updatedAt: Date.now() };
      }
      return k;
    });
    const hasProgress = kpis.some((k) => k.key === 'goal_progress');
    if (!hasProgress && milestones.length > 0) {
      kpis.unshift({
        id: `kpi-${Date.now()}`,
        companyId,
        key: 'goal_progress',
        label: 'Milestone progress',
        target: 100,
        current: avg,
        unit: '%',
        source: 'task_completion',
        updatedAt: Date.now(),
      });
    }
    return { ...state, kpis };
  });
}
