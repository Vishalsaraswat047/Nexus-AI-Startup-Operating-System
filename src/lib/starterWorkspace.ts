import type { BusinessTwin, DepartmentState } from '../types';
import { CORE_DEPARTMENTS, getFullWorkforce, idleWorkforce } from '../data/defaultAgents';
import { createInitialVisionWorkflow } from './visionWorkflow';
import { emptyWorkspace, type UserWorkspace } from './userWorkspace';
import type { BusinessType } from './authApi';

export function createStarterWorkspace(
  founderName: string,
  businessType: BusinessType,
): UserWorkspace {
  const first = founderName.split(' ')[0] || 'Founder';
  const isNew = businessType === 'new_brand';

  const twin: BusinessTwin = {
    name: isNew ? `${first}'s Venture` : `${first}'s Company`,
    industry: isNew ? 'Startup' : 'General Business',
    website: '',
    stage: isNew ? 'Ideation' : 'Operating',
    teamSize: 1,
    revenue: isNew ? 0 : 10000,
    expenses: 5000,
    budget: 5000,
    customers: isNew ? 0 : 50,
    funding: 'Bootstrap',
    goals: [
      isNew
        ? 'Launch and validate my new venture'
        : 'Scale operations with AI executive support',
    ],
    challenges: [],
    tools: [],
    health: 72,
  };

  const initialDeps: DepartmentState[] = CORE_DEPARTMENTS.map((dept) => {
    const autoActive = [
      'Executive Layer',
      'Research Division',
      'Autonomous Control Unit',
    ].includes(dept.name);
    return {
      id: dept.id,
      name: dept.name,
      status: autoActive ? ('active' as const) : ('paused' as const),
      agentCount: dept.agentCount,
      activity: autoActive ? 'Ready on Command Center' : dept.activity,
      brief: dept.brief,
    };
  });

  const activeDepNames = initialDeps.filter((d) => d.status === 'active').map((d) => d.name);
  const initialWorkforce = idleWorkforce(getFullWorkforce(activeDepNames));

  const base = emptyWorkspace();
  return {
    ...base,
    twin,
    departments: initialDeps,
    workforce: initialWorkforce,
    businessType,
    memory: {
      strategic: [twin.goals[0]],
      operational: [`Business type: ${isNew ? 'New brand' : 'Existing business'}`],
      learning: [],
      business: [`Industry: ${twin.industry}`, `Stage: ${twin.stage}`],
      customer: [],
      failure: [],
    },
    logs: [
      'NEXUS OS initialized successfully.',
      `Welcome ${founderName} — configure your company from the Command Center.`,
    ],
    visionWorkflow: createInitialVisionWorkflow(),
  };
}
