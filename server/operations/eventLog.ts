import type { NexusEvent, NexusEventType, CompanyOperationsState } from './types';
import { getCompanyState, updateCompanyState } from './store';

function newId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function appendEvent(
  companyId: string,
  partial: Omit<NexusEvent, 'id' | 'companyId' | 'timestamp'> & { timestamp?: number },
): NexusEvent {
  const event: NexusEvent = {
    id: newId('evt'),
    companyId,
    timestamp: partial.timestamp ?? Date.now(),
    type: partial.type,
    fromAgent: partial.fromAgent,
    toAgent: partial.toAgent,
    department: partial.department,
    message: partial.message,
    payload: partial.payload,
  };

  updateCompanyState(companyId, (state) => ({
    ...state,
    events: [event, ...state.events].slice(0, 500),
  }));

  return event;
}

export function listEvents(companyId: string, limit = 50): NexusEvent[] {
  return getCompanyState(companyId).events.slice(0, limit);
}

export function getDashboardFromState(state: CompanyOperationsState) {
  const now = Date.now();
  const dayAgo = now - 86_400_000;
  const eventsLast24h = state.events.filter((e) => e.timestamp >= dayAgo).length;
  const tasksCompleted = state.tasks.filter((t) => t.status === 'completed').length;
  const tasksInProgress = state.tasks.filter((t) => t.status === 'in_progress').length;
  const tasksQueued = state.tasks.filter((t) => t.status === 'queued').length;
  const pendingApprovals = state.approvals.filter((a) => a.status === 'pending').length;
  const objectiveActive =
    state.ceoObjectives.length > 0 ? state.ceoObjectives[0] : null;
  const lastEventAt = state.events[0]?.timestamp ?? null;

  return {
    companyId: state.companyId,
    tasksCompleted,
    tasksInProgress,
    tasksQueued,
    pendingApprovals,
    eventsLast24h,
    kpiSummary: state.kpis,
    objectiveActive,
    lastEventAt,
  };
}

export function logAgentAction(
  companyId: string,
  agent: string,
  department: string,
  message: string,
  payload?: Record<string, unknown>,
): NexusEvent {
  return appendEvent(companyId, {
    type: 'agent_action',
    fromAgent: agent,
    department,
    message,
    payload,
  });
}

export function eventTypeLabel(type: NexusEventType): string {
  return type.replace(/_/g, ' ');
}
