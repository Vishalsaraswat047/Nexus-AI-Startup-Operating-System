import type { BusinessTwin } from '../types';

export interface OperationsSnapshot {
  state: {
    events: Array<{
      id: string;
      type: string;
      fromAgent: string;
      toAgent?: string;
      department: string;
      message: string;
      timestamp: number;
    }>;
    tasks: Array<{
      id: string;
      title: string;
      status: string;
      assignee: string;
      department: string;
    }>;
    approvals: Array<{
      id: string;
      tier: string;
      title: string;
      description: string;
      status: string;
      actionType: string;
    }>;
    kpis: Array<{
      key: string;
      label: string;
      target: string | number;
      current: string | number;
    }>;
    ceoObjectives: Array<{ id: string; objective: string; departments: string[] }>;
    socialWorkflow: {
      step: string;
      platforms: Array<{ platform: string; exists: boolean; verified: boolean }>;
      pendingApprovalId?: string;
    };
    replanHistory: Array<{ id: string; rootCause: string; alternativePlan: string }>;
    memoryWrites: unknown[];
  };
  dashboard: {
    tasksCompleted: number;
    tasksInProgress: number;
    tasksQueued: number;
    pendingApprovals: number;
    eventsLast24h: number;
    lastEventAt: number | null;
  };
  memorySections: {
    strategic: string[];
    operational: string[];
    learning: string[];
    business: string[];
    customer: string[];
    failure: string[];
  };
}

const base = '/api/operations';

export async function fetchOperationsSnapshot(companyId: string): Promise<OperationsSnapshot> {
  const res = await fetch(`${base}/${encodeURIComponent(companyId)}/snapshot`);
  if (!res.ok) throw new Error('Failed to load operations snapshot');
  return res.json();
}

export async function createCeoObjectiveApi(
  companyId: string,
  directive: string,
  twin: BusinessTwin,
): Promise<{ objective: { id: string; objective: string } }> {
  const res = await fetch(`${base}/${encodeURIComponent(companyId)}/ceo/objective`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ directive, twin }),
  });
  if (!res.ok) throw new Error('CEO objective failed');
  return res.json();
}

export async function createCooPlanApi(
  companyId: string,
  objectiveId: string,
): Promise<{ plan: { id: string } }> {
  const res = await fetch(`${base}/${encodeURIComponent(companyId)}/coo/plan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ objectiveId }),
  });
  if (!res.ok) throw new Error('COO plan failed');
  return res.json();
}

export async function resolveApprovalApi(
  companyId: string,
  approvalId: string,
  status: 'approved' | 'declined',
): Promise<void> {
  const res = await fetch(
    `${base}/${encodeURIComponent(companyId)}/approvals/${approvalId}/resolve`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    },
  );
  if (!res.ok) throw new Error('Approval resolve failed');
}

export async function runSocialCheckApi(
  companyId: string,
  integrations: string[],
): Promise<OperationsSnapshot['state']['socialWorkflow']> {
  const res = await fetch(`${base}/${encodeURIComponent(companyId)}/workflows/social/check`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ integrations }),
  });
  if (!res.ok) throw new Error('Social check failed');
  const data = await res.json();
  return data.workflow;
}

export async function executeSocialApi(
  companyId: string,
  approvalId: string,
  brandName: string,
): Promise<void> {
  const res = await fetch(`${base}/${encodeURIComponent(companyId)}/workflows/social/execute`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ approvalId, brandName }),
  });
  if (!res.ok) throw new Error('Social execute failed');
}

export async function runReplanApi(
  companyId: string,
  risk: { id: string; title: string; description: string; category: string; severity: string },
): Promise<void> {
  const res = await fetch(`${base}/${encodeURIComponent(companyId)}/replan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ risk }),
  });
  if (!res.ok) throw new Error('Replan failed');
}

export async function syncMilestoneKpisApi(
  companyId: string,
  milestones: { progress: number; status: string }[],
): Promise<void> {
  await fetch(`${base}/${encodeURIComponent(companyId)}/kpis/sync-milestones`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ milestones }),
  });
}
