import type { SocialPlatform, SocialPlatformStatus, SocialWorkflowState } from '../types';
import { updateCompanyState, getCompanyState } from '../store';
import { appendEvent, logAgentAction } from '../eventLog';
import { requestApproval, resolveApproval, gateExecution } from '../approvalPolicy';
import { handoffTask, completeTask, listTasks } from '../taskBus';
import { writeMemory } from '../memoryOps';

const PLATFORMS: SocialPlatform[] = [
  'instagram',
  'facebook',
  'linkedin',
  'youtube',
  'google_business',
];

const PLATFORM_LABELS: Record<SocialPlatform, string> = {
  instagram: 'Instagram',
  facebook: 'Facebook',
  linkedin: 'LinkedIn',
  youtube: 'YouTube',
  google_business: 'Google Business Profile',
};

function auditPlatforms(existing?: SocialPlatformStatus[]): SocialPlatformStatus[] {
  const now = Date.now();
  return PLATFORMS.map((platform) => {
    const prev = existing?.find((p) => p.platform === platform);
    return {
      platform,
      exists: prev?.exists ?? false,
      verified: prev?.verified ?? false,
      lastCheckedAt: now,
    };
  });
}

export function runSocialPresenceCheck(
  companyId: string,
  connectedIntegrations: string[] = [],
): SocialWorkflowState {
  const state = getCompanyState(companyId);
  const normalized = connectedIntegrations.map((s) => s.toLowerCase());

  const platforms = auditPlatforms(state.socialWorkflow.platforms).map((p) => {
    const label = PLATFORM_LABELS[p.platform].toLowerCase();
    const exists =
      normalized.some((i) => i.includes(p.platform.replace('_', ''))) ||
      normalized.some((i) => i.includes(label.split(' ')[0]));
    return { ...p, exists, lastCheckedAt: Date.now() };
  });

  const missing = platforms.filter((p) => !p.exists);

  let step: SocialWorkflowState['step'] = missing.length === 0 ? 'complete' : 'awaiting_approval';
  let pendingApprovalId: string | undefined;

  if (missing.length > 0) {
    const approval = requestApproval(companyId, {
      actionType: 'account_create',
      title: 'Create missing social accounts',
      description: `Missing: ${missing.map((m) => PLATFORM_LABELS[m.platform]).join(', ')}. Approve to provision accounts, bios, and profile assets.`,
      requestedBy: 'Social Media Agent',
      payload: { platforms: missing.map((m) => m.platform) },
    });
    pendingApprovalId = approval.id;
  }

  const workflow: SocialWorkflowState = {
    step,
    platforms,
    pendingApprovalId,
    lastRunAt: Date.now(),
  };

  updateCompanyState(companyId, (s) => ({ ...s, socialWorkflow: workflow }));

  appendEvent(companyId, {
    type: 'workflow_step',
    fromAgent: 'Social Media Agent',
    department: 'Growth & Marketing',
    message: `Presence check: ${platforms.filter((p) => p.exists).length}/${platforms.length} channels live`,
    payload: { missing: missing.map((m) => m.platform) },
  });

  writeMemory(companyId, {
    type: 'operational',
    content: `Social audit: ${platforms.filter((p) => p.exists).length} live, ${missing.length} need setup.`,
    agent: 'Social Media Agent',
  });

  return workflow;
}

export async function executeSocialAccountCreation(
  companyId: string,
  approvalId: string,
  brandName: string,
): Promise<SocialWorkflowState> {
  const evaluation = await gateExecution(companyId, 'account_create', {
    actionType: 'account_create',
    title: 'Create social accounts',
    description: 'Provision missing channels',
    requestedBy: 'Social Media Agent',
    approvalId,
    execute: () => ({ brandName, status: 'provisioned_simulation' }),
  });

  if (!evaluation.executed) {
    return getCompanyState(companyId).socialWorkflow;
  }

  resolveApproval(companyId, approvalId, 'approved');

  const state = getCompanyState(companyId);
  const platforms = state.socialWorkflow.platforms.map((p) => ({
    ...p,
    exists: true,
    verified: true,
    lastCheckedAt: Date.now(),
  }));

  const workflow: SocialWorkflowState = {
    step: 'complete',
    platforms,
    lastRunAt: Date.now(),
  };

  updateCompanyState(companyId, (s) => {
    const kpis = s.kpis.map((k) => {
      if (k.key === 'social_live') return { ...k, current: 'all_core_channels', updatedAt: Date.now() };
      return k;
    });
    return { ...s, socialWorkflow: workflow, kpis };
  });

  logAgentAction(
    companyId,
    'Social Media Agent',
    'Growth & Marketing',
    `Created/verified channels for ${brandName} (simulated provision — connect integrations for live API).`,
  );

  writeMemory(companyId, {
    type: 'business',
    content: `${brandName} social accounts provisioned: ${PLATFORMS.map((p) => PLATFORM_LABELS[p]).join(', ')}.`,
    agent: 'Social Media Agent',
  });

  const busTask = listTasks(companyId).find((t) => t.assignee.includes('Social'));
  if (busTask) {
    handoffTask(
      companyId,
      busTask.id,
      'Analytics Agent',
      'Social Media Agent',
      'Growth & Marketing',
      'Handoff for performance tracking',
    );
    completeTask(companyId, busTask.id, 'Social Media Agent', 'Growth & Marketing');
  }

  appendEvent(companyId, {
    type: 'kpi_updated',
    fromAgent: 'Social Media Agent',
    department: 'Growth & Marketing',
    message: 'KPI social_live updated',
    payload: { key: 'social_live' },
  });

  return workflow;
}

export function getSocialWorkflow(companyId: string): SocialWorkflowState {
  return getCompanyState(companyId).socialWorkflow;
}

export { PLATFORM_LABELS };
