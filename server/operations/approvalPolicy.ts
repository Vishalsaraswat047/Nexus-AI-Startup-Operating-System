import type { ApprovalTier, PendingApproval, ApprovalStatus } from './types';
import { appendEvent } from './eventLog';
import { updateCompanyState, getCompanyState } from './store';

const ACTION_TIERS: Record<string, ApprovalTier> = {
  research: 'green',
  analysis: 'green',
  draft: 'green',
  planning: 'green',
  monitoring: 'green',
  memory_write: 'green',
  kpi_update: 'green',
  publish: 'yellow',
  email_send: 'yellow',
  account_create: 'yellow',
  business_listing: 'yellow',
  outreach: 'yellow',
  social_post: 'yellow',
  payment: 'red',
  purchase: 'red',
  ad_spend: 'red',
  legal_commitment: 'red',
  contract_sign: 'red',
  delete_data: 'red',
};

export function classifyAction(actionType: string): ApprovalTier {
  const key = actionType.toLowerCase().replace(/\s+/g, '_');
  if (ACTION_TIERS[key]) return ACTION_TIERS[key];
  if (key.includes('payment') || key.includes('delete') || key.includes('legal'))
    return 'red';
  if (key.includes('publish') || key.includes('account') || key.includes('outreach'))
    return 'yellow';
  return 'green';
}

export function tierRequiresUserApproval(tier: ApprovalTier): boolean {
  return tier === 'yellow' || tier === 'red';
}

export interface ActionEvaluation {
  tier: ApprovalTier;
  allowed: boolean;
  requiresUserApproval: boolean;
  reason: string;
}

export function evaluateAction(
  actionType: string,
  approvedIds: Set<string>,
  pendingForAction?: string,
): ActionEvaluation {
  const tier = classifyAction(actionType);
  if (tier === 'green') {
    return {
      tier,
      allowed: true,
      requiresUserApproval: false,
      reason: 'Green actions run automatically.',
    };
  }
  if (pendingForAction && approvedIds.has(pendingForAction)) {
    return {
      tier,
      allowed: true,
      requiresUserApproval: false,
      reason: 'Approval granted.',
    };
  }
  return {
    tier,
    allowed: false,
    requiresUserApproval: true,
    reason:
      tier === 'red'
        ? 'Red actions require explicit founder approval.'
        : 'Yellow actions require approval before execution.',
  };
}

function newId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function requestApproval(
  companyId: string,
  params: {
    actionType: string;
    title: string;
    description: string;
    requestedBy: string;
    payload?: Record<string, unknown>;
  },
): PendingApproval {
  const tier = classifyAction(params.actionType);
  const approval: PendingApproval = {
    id: newId('apr'),
    companyId,
    tier,
    actionType: params.actionType,
    title: params.title,
    description: params.description,
    requestedBy: params.requestedBy,
    status: 'pending',
    createdAt: Date.now(),
    payload: params.payload,
  };

  updateCompanyState(companyId, (state) => ({
    ...state,
    approvals: [approval, ...state.approvals],
  }));

  appendEvent(companyId, {
    type: 'approval_requested',
    fromAgent: params.requestedBy,
    department: 'Autonomous Control Unit',
    message: `[${tier.toUpperCase()}] ${params.title}`,
    payload: { approvalId: approval.id, actionType: params.actionType },
  });

  return approval;
}

export function resolveApproval(
  companyId: string,
  approvalId: string,
  status: Exclude<ApprovalStatus, 'pending'>,
  resolvedBy = 'Founder',
): PendingApproval | null {
  let resolved: PendingApproval | null = null;

  updateCompanyState(companyId, (state) => {
    const approvals = state.approvals.map((a) => {
      if (a.id !== approvalId) return a;
      resolved = {
        ...a,
        status,
        resolvedAt: Date.now(),
      };
      return resolved;
    });
    return { ...state, approvals };
  });

  if (resolved) {
    appendEvent(companyId, {
      type: 'approval_resolved',
      fromAgent: resolvedBy,
      department: 'Command Center',
      message: `Approval ${status}: ${resolved.title}`,
      payload: { approvalId, status },
    });
  }

  return resolved;
}

export function listPendingApprovals(companyId: string): PendingApproval[] {
  return getCompanyState(companyId).approvals.filter((a) => a.status === 'pending');
}

export function gateExecution(
  companyId: string,
  actionType: string,
  params: {
    title: string;
    description: string;
    requestedBy: string;
    execute: () => Record<string, unknown> | Promise<Record<string, unknown>>;
    approvalId?: string;
  },
): Promise<{ executed: boolean; approval?: PendingApproval; result?: Record<string, unknown> }> {
  const state = getCompanyState(companyId);
  const approvedIds = new Set(
    state.approvals.filter((a) => a.status === 'approved').map((a) => a.id),
  );
  const evaluation = evaluateAction(actionType, approvedIds, params.approvalId);

  if (!evaluation.allowed) {
    const approval = requestApproval(companyId, {
      actionType,
      title: params.title,
      description: params.description,
      requestedBy: params.requestedBy,
    });
    return Promise.resolve({ executed: false, approval });
  }

  return Promise.resolve(params.execute()).then((result) => ({
    executed: true,
    result,
  }));
}
