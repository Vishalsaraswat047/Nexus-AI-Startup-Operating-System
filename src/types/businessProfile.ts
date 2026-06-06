import type { BusinessType } from '../lib/authApi';

export type BusinessCategory =
  | 'SaaS'
  | 'E-commerce'
  | 'Physical Product'
  | 'Service Business'
  | 'Agency'
  | 'Hospitality'
  | 'Healthcare'
  | 'Education'
  | 'Other';

export type BusinessStage =
  | 'Idea'
  | 'Validation'
  | 'MVP'
  | 'Development'
  | 'Launch'
  | 'Growth'
  | 'Scale'
  | 'Enterprise';

export interface BusinessContextProfiles {
  businessProfile: string;
  marketProfile: string;
  goalProfile: string;
  resourceProfile: string;
  riskProfile: string;
  growthProfile: string;
  departmentRequirements: string[];
  executionRoadmap: string[];
  highestPriorityAction: string;
}

export interface NexusBusinessProfile {
  companyId?: string;
  businessName: string;
  businessType: BusinessType;
  category: BusinessCategory;
  stage: BusinessStage;
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
  teamType: 'Solo' | 'Team';
  teamSize: number;
  revenueRange: string;
  mainProducts: string;
  mainServices: string;
  currentGoals: string;
  currentProblems: string;
  stageAnswers: Record<string, string>;
  contexts: BusinessContextProfiles;
  onboardingCompletedAt: number;
}
