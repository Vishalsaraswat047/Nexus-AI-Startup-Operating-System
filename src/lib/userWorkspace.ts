import type {
  BusinessTwin,
  Milestone,
  DepartmentState,
  AgentWorkforce,
  RiskItem,
  BusinessInsight,
  CorporateMemory,
} from '../types';
import type { VisionWorkflowState } from './visionWorkflow';
import { createInitialVisionWorkflow } from './visionWorkflow';
import type { BusinessType } from './authApi';
import type { NexusBusinessProfile } from '../types/businessProfile';

export interface UserWorkspace {
  twin: BusinessTwin | null;
  milestones: Milestone[];
  departments: DepartmentState[];
  workforce: AgentWorkforce[];
  risks: RiskItem[];
  insights: BusinessInsight[];
  memory: CorporateMemory;
  logs: string[];
  visionWorkflow: VisionWorkflowState;
  businessType?: BusinessType;
  onboardingCompleted?: boolean;
  businessProfile?: NexusBusinessProfile | null;
}

function workspaceKey(email: string) {
  return `nexus_ws_${email.toLowerCase().replace(/[^a-z0-9@._-]/g, '_')}`;
}

const emptyMemory = (): CorporateMemory => ({
  strategic: [],
  operational: [],
  learning: [],
  business: [],
  customer: [],
  failure: [],
});

export function emptyWorkspace(): UserWorkspace {
  return {
    twin: null,
    milestones: [],
    departments: [],
    workforce: [],
    risks: [],
    insights: [],
    memory: emptyMemory(),
    logs: ['NEXUS OS initialized successfully.'],
    visionWorkflow: createInitialVisionWorkflow(),
  };
}

/** Migrate legacy global keys into the first logged-in user's workspace (skip for new accounts). */
function migrateLegacyGlobal(email: string, skipMigration = false): UserWorkspace | null {
  if (skipMigration) return null;
  const cachedTwin = localStorage.getItem('nexus_twin');
  if (!cachedTwin) return null;
  try {
    const ws: UserWorkspace = {
      twin: JSON.parse(cachedTwin),
      milestones: JSON.parse(localStorage.getItem('nexus_milestones') || '[]'),
      departments: JSON.parse(localStorage.getItem('nexus_departments') || '[]'),
      workforce: JSON.parse(localStorage.getItem('nexus_workforce') || '[]'),
      risks: JSON.parse(localStorage.getItem('nexus_risks') || '[]'),
      insights: JSON.parse(localStorage.getItem('nexus_insights') || '[]'),
      memory: JSON.parse(
        localStorage.getItem('nexus_memory') ||
          '{"strategic":[],"operational":[],"learning":[],"business":[],"customer":[],"failure":[]}',
      ),
      logs: JSON.parse(
        localStorage.getItem('nexus_logs') ||
          '["NEXUS OS initialized successfully."]',
      ),
      visionWorkflow: JSON.parse(
        localStorage.getItem('nexus_vision_workflow') || 'null',
      ) ?? createInitialVisionWorkflow(),
    };
    saveUserWorkspace(email, ws);
    return ws;
  } catch {
    return null;
  }
}

export function loadUserWorkspace(email: string, opts?: { isNewAccount?: boolean }): UserWorkspace {
  try {
    const raw = localStorage.getItem(workspaceKey(email));
    if (raw) return { ...emptyWorkspace(), ...JSON.parse(raw) } as UserWorkspace;
  } catch {
    /* fall through */
  }
  const migrated = migrateLegacyGlobal(email, opts?.isNewAccount);
  if (migrated) return migrated;
  return emptyWorkspace();
}

export function saveUserWorkspace(email: string, ws: Partial<UserWorkspace>) {
  const current = loadUserWorkspace(email);
  const next = { ...current, ...ws };
  localStorage.setItem(workspaceKey(email), JSON.stringify(next));
}

export function clearUserWorkspaceState() {
  return emptyWorkspace();
}
