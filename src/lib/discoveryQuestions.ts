import type { BusinessType } from './authApi';
import type {
  BusinessCategory,
  BusinessStage,
  BusinessContextProfiles,
  NexusBusinessProfile,
} from '../types/businessProfile';

export type QuestionFieldType = 'text' | 'textarea' | 'number' | 'select' | 'industry';

export interface DiscoveryQuestion {
  key: string;
  label: string;
  placeholder?: string;
  required?: boolean;
  type?: QuestionFieldType;
  options?: Array<{ value: string; label: string }>;
  section?: string;
}

const CATEGORY_OPTIONS: Array<{ value: BusinessCategory; label: string }> = [
  { value: 'SaaS', label: 'SaaS' },
  { value: 'E-commerce', label: 'E-commerce' },
  { value: 'Physical Product', label: 'Physical Product' },
  { value: 'Service Business', label: 'Service Business' },
  { value: 'Agency', label: 'Agency' },
  { value: 'Hospitality', label: 'Hospitality' },
  { value: 'Healthcare', label: 'Healthcare' },
  { value: 'Education', label: 'Education' },
  { value: 'Other', label: 'Other' },
];

const STAGE_OPTIONS: Array<{ value: BusinessStage; label: string }> = [
  { value: 'Idea', label: 'Idea — I have only an idea' },
  { value: 'Validation', label: 'Validation — testing the market' },
  { value: 'MVP', label: 'MVP — building first version' },
  { value: 'Development', label: 'Development — actively building' },
  { value: 'Launch', label: 'Launch — going to market' },
  { value: 'Growth', label: 'Growth — acquiring customers' },
  { value: 'Scale', label: 'Scale — expanding operations' },
  { value: 'Enterprise', label: 'Enterprise — mature business' },
];

const STAGE_QUESTIONS: Record<BusinessStage, DiscoveryQuestion[]> = {
  Idea: [
    { key: 'businessIdea', label: 'Describe your business idea in detail', type: 'textarea', required: true },
    { key: 'targetAudience', label: 'Who is your target audience?', required: true },
    { key: 'market', label: 'What market are you entering?', required: true },
    { key: 'skills', label: 'What skills do you bring?', placeholder: 'e.g. Engineering, sales, hospitality' },
    { key: 'currentResources', label: 'What resources do you already have?', placeholder: 'e.g. Savings, network, property' },
    { key: 'mainGoal', label: 'What is your main goal right now?', required: true },
  ],
  Validation: [
    { key: 'problemValidation', label: 'How have you validated the problem?', type: 'textarea' },
    { key: 'customerInterviews', label: 'Customer interviews conducted?', placeholder: 'Number or summary' },
    { key: 'marketResearch', label: 'Market research done so far?', type: 'textarea' },
    { key: 'competitorResearch', label: 'Competitor research findings?', type: 'textarea' },
    { key: 'currentFindings', label: 'Key findings so far', type: 'textarea', required: true },
    { key: 'mainGoal', label: 'Primary goal for this phase', required: true },
  ],
  MVP: [
    { key: 'prototypeAvailable', label: 'Do you have a prototype?', type: 'select', options: [{ value: 'Yes', label: 'Yes' }, { value: 'No', label: 'No' }] },
    { key: 'designCompleted', label: 'Is design completed?', type: 'select', options: [{ value: 'Yes', label: 'Yes' }, { value: 'Partial', label: 'Partial' }, { value: 'No', label: 'No' }] },
    { key: 'developmentStarted', label: 'Has development started?', type: 'select', options: [{ value: 'Yes', label: 'Yes' }, { value: 'No', label: 'No' }] },
    { key: 'techStack', label: 'Tech stack (if applicable)', placeholder: 'e.g. React, Node, PostgreSQL' },
    { key: 'expectedUsers', label: 'Expected initial users?', type: 'number' },
    { key: 'mainGoal', label: 'MVP goal', required: true },
  ],
  Development: [
    { key: 'frontendProgress', label: 'Frontend progress (%)', type: 'number' },
    { key: 'backendProgress', label: 'Backend progress (%)', type: 'number' },
    { key: 'featuresComplete', label: 'Features completed', type: 'textarea' },
    { key: 'featuresRemaining', label: 'Features remaining', type: 'textarea' },
    { key: 'currentRoadblocks', label: 'Current roadblocks', type: 'textarea', required: true },
    { key: 'targetLaunchDate', label: 'Target launch date', placeholder: 'e.g. Q3 2026' },
  ],
  Launch: [
    { key: 'websiteLive', label: 'Is your website live?', type: 'select', options: [{ value: 'Yes', label: 'Yes' }, { value: 'No', label: 'No' }] },
    { key: 'usersAcquired', label: 'Users or customers acquired?', type: 'number' },
    { key: 'marketingStarted', label: 'Marketing started?', type: 'select', options: [{ value: 'Yes', label: 'Yes' }, { value: 'No', label: 'No' }] },
    { key: 'salesProcess', label: 'Sales process in place?', type: 'textarea' },
    { key: 'currentRevenue', label: 'Current revenue (monthly)?', type: 'number' },
    { key: 'mainBottlenecks', label: 'Main bottlenecks', type: 'textarea', required: true },
  ],
  Growth: [
    { key: 'monthlyUsers', label: 'Monthly users', type: 'number' },
    { key: 'monthlyRevenue', label: 'Monthly revenue', type: 'number' },
    { key: 'marketingChannels', label: 'Active marketing channels', type: 'textarea' },
    { key: 'conversionRate', label: 'Conversion rate (%)', placeholder: 'e.g. 2.5' },
    { key: 'retentionRate', label: 'Retention rate (%)', placeholder: 'e.g. 65' },
    { key: 'growthGoals', label: 'Growth goals', type: 'textarea', required: true },
    { key: 'currentChallenges', label: 'Current challenges', type: 'textarea', required: true },
  ],
  Scale: [
    { key: 'departments', label: 'Departments in your company', type: 'textarea' },
    { key: 'employees', label: 'Number of employees', type: 'number' },
    { key: 'operatingCosts', label: 'Monthly operating costs', type: 'number' },
    { key: 'expansionPlans', label: 'Expansion plans', type: 'textarea' },
    { key: 'fundingStatus', label: 'Funding status', placeholder: 'Bootstrap, Seed, Series A…' },
    { key: 'automationOpportunities', label: 'Automation opportunities', type: 'textarea' },
  ],
  Enterprise: [
    { key: 'annualRevenue', label: 'Annual revenue', type: 'number' },
    { key: 'marketExpansionGoals', label: 'Market expansion goals', type: 'textarea', required: true },
    { key: 'strategicPriorities', label: 'Strategic priorities', type: 'textarea', required: true },
    { key: 'automationOpportunities', label: 'Automation opportunities', type: 'textarea' },
  ],
};

const CATEGORY_STAGE_HINTS: Partial<Record<BusinessCategory, BusinessStage>> = {
  Hospitality: 'Launch',
  SaaS: 'MVP',
  'Physical Product': 'Validation',
};

export function buildDiscoveryQuestions(
  businessType: BusinessType,
  category?: BusinessCategory,
  stage?: BusinessStage,
): DiscoveryQuestion[] {
  const questions: DiscoveryQuestion[] = [];

  if (businessType === 'new_brand') {
    questions.push(
      { key: 'startupName', label: 'What is your business name?', required: true, section: 'Foundation' },
      {
        key: 'whatAreYouBuilding',
        label: 'Describe your business',
        type: 'textarea',
        required: true,
        placeholder: 'Hotel in Jaipur, SaaS platform, protein bar brand, agency…',
        section: 'Foundation',
      },
      { key: 'problem', label: 'What problem are you solving?', type: 'textarea', required: true, section: 'Foundation' },
      { key: 'solution', label: 'What is your solution?', type: 'textarea', required: true, section: 'Foundation' },
      { key: 'targetCustomer', label: 'Who is your target customer?', required: true, section: 'Foundation' },
      { key: 'uniqueAdvantage', label: 'What is your unique advantage?', type: 'textarea', section: 'Foundation' },
      { key: 'vision', label: 'What is your vision?', type: 'textarea', section: 'Foundation' },
      {
        key: 'category',
        label: 'Business category',
        type: 'select',
        options: CATEGORY_OPTIONS,
        required: true,
        section: 'Classification',
      },
      {
        key: 'industry',
        label: 'Pick your specific industry playbook',
        type: 'industry',
        required: true,
        section: 'Classification',
        placeholder: 'e.g. Hotel, Restaurant, Coaching, SaaS, Car Wash, Jewellery…',
      },
      {
        key: 'stage',
        label: 'Current stage',
        type: 'select',
        options: STAGE_OPTIONS,
        required: true,
        section: 'Classification',
      },
      { key: 'country', label: 'Which country / market?', required: true, section: 'Resources' },
      { key: 'initialBudget', label: 'Budget available (USD)', type: 'number', required: true, section: 'Resources' },
      { key: 'timelineDays', label: 'Timeline (days)', type: 'number', required: true, section: 'Resources' },
      {
        key: 'teamType',
        label: 'Team structure',
        type: 'select',
        options: [{ value: 'Solo', label: 'Solo founder' }, { value: 'Team', label: 'Team' }],
        required: true,
        section: 'Resources',
      },
    );
  } else {
    questions.push(
      { key: 'startupName', label: 'Business name', required: true, section: 'Existing Business' },
      { key: 'website', label: 'Website URL', placeholder: 'https://…', section: 'Existing Business' },
      {
        key: 'category',
        label: 'Industry category',
        type: 'select',
        options: CATEGORY_OPTIONS,
        required: true,
        section: 'Existing Business',
      },
      {
        key: 'industry',
        label: 'Pick your specific industry playbook',
        type: 'industry',
        required: true,
        section: 'Existing Business',
      },
      {
        key: 'stage',
        label: 'Business stage',
        type: 'select',
        options: STAGE_OPTIONS,
        required: true,
        section: 'Existing Business',
      },
      { key: 'revenueRange', label: 'Revenue range', placeholder: 'e.g. $10k–$50k/mo', section: 'Existing Business' },
      { key: 'teamSize', label: 'Team size', type: 'number', section: 'Existing Business' },
      { key: 'mainProducts', label: 'Main products', type: 'textarea', section: 'Existing Business' },
      { key: 'mainServices', label: 'Main services', type: 'textarea', section: 'Existing Business' },
      { key: 'currentGoals', label: 'Current goals', type: 'textarea', required: true, section: 'Existing Business' },
      { key: 'currentProblems', label: 'Current problems / bottlenecks', type: 'textarea', required: true, section: 'Existing Business' },
      { key: 'country', label: 'Primary market / country', required: true, section: 'Existing Business' },
      { key: 'whatAreYouBuilding', label: 'Brief business description', type: 'textarea', required: true, section: 'Existing Business' },
      { key: 'targetCustomer', label: 'Target customer', required: true, section: 'Existing Business' },
    );
  }

  const resolvedCategory = category ?? (businessType === 'new_brand' ? undefined : 'Other');
  const resolvedStage =
    stage ??
    (resolvedCategory ? CATEGORY_STAGE_HINTS[resolvedCategory] : undefined) ??
    (businessType === 'existing_business' ? 'Growth' : 'Idea');

  const stageQs = STAGE_QUESTIONS[resolvedStage] ?? [];
  for (const q of stageQs) {
    questions.push({ ...q, key: `stage_${q.key}`, section: `${resolvedStage} Stage` });
  }

  if (resolvedCategory === 'Hospitality' && businessType === 'new_brand') {
    questions.push(
      { key: 'hospitality_property', label: 'Do you own, lease, or plan to buy property?', type: 'select', options: [{ value: 'Own', label: 'Own property' }, { value: 'Lease', label: 'Lease property' }, { value: 'Buy', label: 'Plan to buy' }, { value: 'None', label: 'Not yet decided' }], section: 'Hospitality' },
      { key: 'hospitality_existing', label: 'Existing hotel or new hotel?', type: 'select', options: [{ value: 'New', label: 'New hotel' }, { value: 'Existing', label: 'Existing hotel' }], section: 'Hospitality' },
    );
  }

  if (resolvedCategory === 'Physical Product') {
    questions.push(
      { key: 'manufacturingRequired', label: 'Manufacturing required?', type: 'select', options: [{ value: 'Yes', label: 'Yes' }, { value: 'No', label: 'No' }], section: 'Product' },
      { key: 'existingCompetitors', label: 'Existing competitors (optional)', type: 'textarea', section: 'Product' },
    );
  } else if (businessType === 'new_brand') {
    questions.push(
      { key: 'existingCompetitors', label: 'Existing competitors (optional)', type: 'textarea', section: 'Market' },
    );
  }

  return questions;
}

export function generateBusinessContext(
  answers: Record<string, string | number>,
  businessType: BusinessType,
): BusinessContextProfiles {
  const name = String(answers.startupName || 'Your business');
  const category = String(answers.category || 'Other') as BusinessCategory;
  const stage = String(answers.stage || 'Idea') as BusinessStage;
  const building = String(answers.whatAreYouBuilding || '');
  const target = String(answers.targetCustomer || '');
  const budget = Number(answers.initialBudget) || 5000;
  const country = String(answers.country || '');

  const departmentRequirements = departmentsForCategory(category, stage, businessType);
  const highestPriorityAction = recommendedFirstAction(category, stage, answers, businessType);

  const executionRoadmap = buildExecutionRoadmap(category, stage, businessType);

  return {
    businessProfile: `${name} is a ${category} business at the ${stage} stage. ${building}. Target: ${target}. Market: ${country}.`,
    marketProfile: `Category: ${category}. Competitors: ${answers.existingCompetitors || 'To be researched'}. Stage focus: ${stage}-appropriate validation and demand signals.`,
    goalProfile: String(answers.mainGoal || answers.currentGoals || answers.vision || `Launch and grow ${name}`),
    resourceProfile: `Budget: $${budget}. Team: ${answers.teamType || 'Solo'}. Timeline: ${answers.timelineDays || 90} days.`,
    riskProfile: inferRisks(category, stage, answers),
    growthProfile: `Primary growth lever for ${category} at ${stage}: ${growthLever(category, stage)}`,
    departmentRequirements,
    executionRoadmap,
    highestPriorityAction,
  };
}

function departmentsForCategory(
  category: BusinessCategory,
  stage: BusinessStage,
  businessType: BusinessType,
): string[] {
  const base = ['Executive Layer', 'Research Division', 'Autonomous Control Unit', 'Financial Control'];
  const map: Record<BusinessCategory, string[]> = {
    SaaS: ['Product Office', 'Engineering Core', 'Design Studio', 'Growth & Marketing'],
    'E-commerce': ['Product Office', 'Design Studio', 'Growth & Marketing', 'Sales Operations'],
    'Physical Product': ['Product Office', 'Design Studio', 'Growth & Marketing', 'Legal & Policy'],
    'Service Business': ['Growth & Marketing', 'Sales Operations'],
    Agency: ['Design Studio', 'Growth & Marketing', 'Sales Operations'],
    Hospitality: ['Design Studio', 'Growth & Marketing', 'Legal & Policy'],
    Healthcare: ['Product Office', 'Legal & Policy', 'Engineering Core'],
    Education: ['Product Office', 'Design Studio', 'Growth & Marketing'],
    Other: ['Growth & Marketing'],
  };
  const deps = [...base, ...(map[category] || map.Other)];
  if (businessType === 'existing_business' && (stage === 'Growth' || stage === 'Scale')) {
    deps.push('Sales Operations');
  }
  return [...new Set(deps)];
}

function recommendedFirstAction(
  category: BusinessCategory,
  stage: BusinessStage,
  answers: Record<string, string | number>,
  businessType: BusinessType,
): string {
  // Focus on revenue-generating actions and business-critical decisions
  if (category === 'Hospitality' && answers.hospitality_property === 'None') {
    return 'Find Hotel Property';
  }
  if (category === 'Physical Product' && answers.manufacturingRequired === 'Yes') {
    return 'Manufacturing Discovery';
  }
  if (stage === 'Idea' || stage === 'Validation') {
    return 'Start Market Research';
  }
  if (stage === 'MVP' || stage === 'Development') {
    return category === 'SaaS' ? 'Product Strategy & UI Design' : 'Start Market Research';
  }
  if (businessType === 'existing_business') {
    return 'Operational Audit & Growth Plan';
  }
  if (stage === 'Launch' || stage === 'Growth') {
    return 'Marketing & Distribution';
  }
  if (stage === 'Scale' || stage === 'Enterprise') {
    return 'Scale Operations & Optimization';
  }
  return 'Start Market Research';
}

function buildExecutionRoadmap(
  category: BusinessCategory,
  stage: BusinessStage,
  businessType: BusinessType,
): string[] {
  // Define the correct department activation sequence based on business type
  const roadmaps: Record<BusinessCategory, string[]> = {
    Hospitality: [
      'Market Research',
      'Property Acquisition',
      'Hotel Design',
      'Procurement & Setup',
      'Legal & Compliance',
      'Brand Identity',
      'Digital Presence',
      'Marketing Launch',
      'Operations',
    ],
    'Physical Product': [
      'Market Research',
      'Manufacturing Discovery',
      'Compliance Requirements',
      'Ingredient Sourcing',
      'Packaging Design',
      'Branding',
      'Website',
      'Distribution',
      'Retail Outreach',
      'Marketing',
    ],
    SaaS: [
      'Problem Validation',
      'Market Research',
      'Product Strategy',
      'UI Design',
      'Frontend Development',
      'Backend Development',
      'Testing',
      'Deployment',
      'Marketing',
      'Sales',
      'Customer Success',
    ],
    'E-commerce': [
      'Market Research',
      'Product Sourcing',
      'Branding',
      'Website',
      'Marketing',
      'Fulfillment',
    ],
    'Service Business': [
      'Market Research',
      'Offer Packaging',
      'Branding',
      'Website',
      'Sales',
      'Delivery',
    ],
    Agency: [
      'Market Research',
      'Positioning',
      'Portfolio',
      'Website',
      'Outbound Sales',
      'Delivery',
    ],
    Healthcare: [
      'Compliance Research',
      'Product Strategy',
      'Regulatory',
      'Development',
      'Launch',
    ],
    Education: [
      'Market Research',
      'Curriculum Design',
      'Platform Build',
      'Marketing',
      'Enrollment',
    ],
    Other: [
      'Market Research',
      'Brand Strategy',
      'Website',
      'Marketing',
      'Operations',
    ],
  };

  const roadmap = [...(roadmaps[category] || roadmaps.Other)];
  if (businessType === 'existing_business') {
    roadmap.unshift('Business Audit');
  }
  if (stage === 'Growth' || stage === 'Scale') {
    roadmap.push('Optimization', 'Scale Operations');
  }
  return roadmap;
}

// Function to determine department activation sequence based on business type
export function getDepartmentActivationSequence(
  category: BusinessCategory,
  stage: BusinessStage,
  businessType: BusinessType,
): string[] {
  // Define the correct department activation sequence for each business type
  const sequences: Record<BusinessCategory, string[]> = {
    SaaS: [
      'Research Division',
      'Product Office',
      'Engineering Core',
      'Design Studio',
      'Financial Control',
      'Growth & Marketing',
      'Sales Operations',
      'Customer Success'
    ],
    'E-commerce': [
      'Research Division',
      'Product Office',
      'Design Studio',
      'Growth & Marketing',
      'Sales Operations',
      'Fulfillment Operations',
      'Financial Control'
    ],
    'Physical Product': [
      'Research Division',
      'Product Office',
      'Design Studio',
      'Legal & Policy',
      'Growth & Marketing',
      'Sales Operations',
      'Manufacturing',
      'Supply Chain'
    ],
    'Service Business': [
      'Research Division',
      'Growth & Marketing',
      'Sales Operations',
      'Operations',
      'Financial Control'
    ],
    Agency: [
      'Research Division',
      'Design Studio',
      'Growth & Marketing',
      'Sales Operations',
      'Project Delivery'
    ],
    Hospitality: [
      'Research Division',
      'Design Studio',
      'Legal & Policy',
      'Operations',
      'Growth & Marketing',
      'Sales Operations'
    ],
    Healthcare: [
      'Research Division',
      'Product Office',
      'Legal & Policy',
      'Engineering Core',
      'Regulatory Affairs',
      'Clinical Operations'
    ],
    Education: [
      'Research Division',
      'Product Office',
      'Design Studio',
      'Growth & Marketing',
      'Curriculum Development'
    ],
    Other: [
      'Research Division',
      'Growth & Marketing',
      'Financial Control',
      'Operations'
    ]
  };

  // Return the appropriate sequence based on business category
  return sequences[category] || sequences.Other;
}

function inferRisks(
  category: BusinessCategory,
  stage: BusinessStage,
  answers: Record<string, string | number>,
): string {
  const risks: string[] = [];
  if (stage === 'Idea') risks.push('Unvalidated market assumption');
  if (category === 'Hospitality' && answers.hospitality_property === 'None') {
    risks.push('Property not secured — blocks operations');
  }
  if (category === 'Physical Product' && answers.manufacturingRequired === 'Yes') {
    risks.push('Manufacturing and supply chain complexity');
  }
  if (Number(answers.initialBudget) < 3000) risks.push('Limited budget constrains speed');
  return risks.length ? risks.join('. ') + '.' : 'Standard startup execution risks.';
}

function growthLever(category: BusinessCategory, stage: BusinessStage): string {
  if (stage === 'Idea' || stage === 'Validation') return 'Problem-solution fit and demand validation';
  if (category === 'Hospitality') return 'Occupancy rate and review reputation';
  if (category === 'SaaS') return 'Activation, retention, and expansion revenue';
  if (category === 'Physical Product') return 'Distribution and retail partnerships';
  return 'Customer acquisition and conversion optimization';
}

export function answersToBusinessProfile(
  answers: Record<string, string | number>,
  businessType: BusinessType,
): NexusBusinessProfile {
  const stageAnswers: Record<string, string> = {};
  for (const [k, v] of Object.entries(answers)) {
    if (k.startsWith('stage_')) stageAnswers[k.replace('stage_', '')] = String(v);
  }

  const contexts = generateBusinessContext(answers, businessType);

  return {
    businessName: String(answers.startupName || ''),
    businessType,
    category: (answers.category as BusinessCategory) || 'Other',
    stage: (answers.stage as BusinessStage) || 'Idea',
    description: String(answers.whatAreYouBuilding || ''),
    problem: String(answers.problem || ''),
    solution: String(answers.solution || ''),
    targetCustomer: String(answers.targetCustomer || ''),
    uniqueAdvantage: String(answers.uniqueAdvantage || ''),
    vision: String(answers.vision || ''),
    country: String(answers.country || ''),
    website: String(answers.website || ''),
    industry: String(answers.industry || categoryToIndustry(String(answers.category || 'Other'))),
    budget: Number(answers.initialBudget) || 5000,
    timelineDays: Number(answers.timelineDays) || 90,
    teamType: (answers.teamType as 'Solo' | 'Team') || 'Solo',
    teamSize: Number(answers.teamSize) || (answers.teamType === 'Team' ? 3 : 1),
    revenueRange: String(answers.revenueRange || ''),
    mainProducts: String(answers.mainProducts || ''),
    mainServices: String(answers.mainServices || ''),
    currentGoals: String(answers.currentGoals || ''),
    currentProblems: String(answers.currentProblems || ''),
    stageAnswers,
    contexts,
    onboardingCompletedAt: Date.now(),
  };
}

export function categoryToIndustry(category: string): string {
  if (['SaaS', 'E-commerce', 'AI Product'].includes(category)) return 'Technology';
  if (category === 'Hospitality') return 'Hospitality';
  if (category === 'Healthcare') return 'Healthcare';
  if (category === 'Education') return 'Education';
  return 'General Business';
}
