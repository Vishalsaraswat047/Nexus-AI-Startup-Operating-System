import { getCompanyState, updateCompanyState } from './store';
import { writeMemory } from './memoryOps';
import { appendEvent } from './eventLog';

export interface StoredBusinessProfile {
  companyId: string;
  businessName: string;
  businessType: string;
  category: string;
  stage: string;
  description: string;
  problem: string;
  solution: string;
  targetCustomer: string;
  uniqueAdvantage: string;
  vision: string;
  country: string;
  website: string;
  industry: string;
  budget: number;
  timelineDays: number;
  teamType: string;
  teamSize: number;
  revenueRange: string;
  mainProducts: string;
  mainServices: string;
  currentGoals: string;
  currentProblems: string;
  stageAnswers: Record<string, string>;
  contexts: {
    businessProfile: string;
    marketProfile: string;
    goalProfile: string;
    resourceProfile: string;
    riskProfile: string;
    growthProfile: string;
    departmentRequirements: string[];
    executionRoadmap: string[];
    highestPriorityAction: string;
  };
  onboardingCompletedAt: number;
  updatedAt: number;
}

export function saveBusinessProfile(
  companyId: string,
  profile: Omit<StoredBusinessProfile, 'companyId' | 'updatedAt'>,
): StoredBusinessProfile {
  const stored: StoredBusinessProfile = {
    ...profile,
    companyId,
    updatedAt: Date.now(),
  };

  updateCompanyState(companyId, (state) => ({
    ...state,
    businessProfile: stored,
  }));

  writeMemory(companyId, {
    type: 'business',
    content: stored.contexts.businessProfile,
    agent: 'CEO Agent',
  });

  writeMemory(companyId, {
    type: 'strategic',
    content: `Goal: ${stored.contexts.goalProfile}. Priority: ${stored.contexts.highestPriorityAction}`,
    agent: 'CEO Agent',
  });

  appendEvent(companyId, {
    type: 'onboarding_complete',
    fromAgent: 'CEO Agent',
    department: 'Executive Layer',
    message: `Business discovery complete: ${stored.businessName}`,
    payload: {
      category: stored.category,
      stage: stored.stage,
      highestPriorityAction: stored.contexts.highestPriorityAction,
    },
  });

  return stored;
}

export function getBusinessProfile(companyId: string): StoredBusinessProfile | null {
  const state = getCompanyState(companyId);
  return (state as { businessProfile?: StoredBusinessProfile }).businessProfile ?? null;
}
