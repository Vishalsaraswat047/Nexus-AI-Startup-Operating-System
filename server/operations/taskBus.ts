import type { BusTask } from './types';
import { appendEvent } from './eventLog';
import { updateCompanyState, getCompanyState } from './store';

function newId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function assignTask(
  companyId: string,
  params: {
    title: string;
    assignee: string;
    department: string;
    project?: string;
    milestoneId?: string;
    fromAgent?: string;
  },
): BusTask {
  const now = Date.now();
  const task: BusTask = {
    id: newId('task'),
    companyId,
    title: params.title,
    status: 'queued',
    assignee: params.assignee,
    department: params.department,
    project: params.project,
    milestoneId: params.milestoneId,
    createdAt: now,
    updatedAt: now,
    handoffChain: [params.fromAgent || 'COO Agent'],
  };

  updateCompanyState(companyId, (state) => ({
    ...state,
    tasks: [task, ...state.tasks],
  }));

  appendEvent(companyId, {
    type: 'task_assigned',
    fromAgent: params.fromAgent || 'COO Agent',
    toAgent: params.assignee,
    department: params.department,
    message: `Assigned: ${params.title}`,
    payload: { taskId: task.id },
  });

  return task;
}

export function handoffTask(
  companyId: string,
  taskId: string,
  toAgent: string,
  fromAgent: string,
  department: string,
  note: string,
): BusTask | null {
  let updated: BusTask | null = null;

  updateCompanyState(companyId, (state) => {
    const tasks = state.tasks.map((t) => {
      if (t.id !== taskId) return t;
      updated = {
        ...t,
        assignee: toAgent,
        department,
        status: 'in_progress' as const,
        updatedAt: Date.now(),
        handoffChain: [...t.handoffChain, fromAgent, toAgent],
      };
      return updated;
    });
    return { ...state, tasks };
  });

  if (updated) {
    appendEvent(companyId, {
      type: 'task_handoff',
      fromAgent,
      toAgent,
      department,
      message: note,
      payload: { taskId },
    });
  }

  return updated;
}

export function completeTask(
  companyId: string,
  taskId: string,
  agent: string,
  department: string,
): BusTask | null {
  let updated: BusTask | null = null;

  updateCompanyState(companyId, (state) => {
    const tasks = state.tasks.map((t) => {
      if (t.id !== taskId) return t;
      updated = {
        ...t,
        status: 'completed' as const,
        updatedAt: Date.now(),
      };
      return updated;
    });
    return { ...state, tasks };
  });

  if (updated) {
    appendEvent(companyId, {
      type: 'task_completed',
      fromAgent: agent,
      department,
      message: `Completed: ${updated.title}`,
      payload: { taskId },
    });
  }

  return updated;
}

export function listTasks(companyId: string): BusTask[] {
  return getCompanyState(companyId).tasks;
}
