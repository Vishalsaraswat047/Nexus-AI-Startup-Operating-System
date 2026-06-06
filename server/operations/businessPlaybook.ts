/**
 * Business-type-aware execution playbook.
 *
 * Rule: every phase is operational — it gets the company closer to revenue,
 * customers, or launch. Brand / website / social are downstream of the
 * decisions that actually create revenue.
 */

export type PhaseKey =
  | 'research'
  | 'business_model'
  | 'pricing'
  | 'operations'
  | 'hiring'
  | 'sales'
  | 'customer_acquisition'
  | 'brand'
  | 'website'
  | 'social'
  | 'listings'
  | 'scaling';

export interface PhaseDef {
  key: PhaseKey;
  name: string;
  department: string;
  order: number;
}

export interface PhaseRecommendation {
  phaseKey: PhaseKey;
  label: string;
  description: string;
  reason: string;
  revenueImpact: 'direct' | 'indirect' | 'enabling';
  blocksLaunch: boolean;
  roi: 'high' | 'medium' | 'low';
  isOperational: boolean;
}

export interface PhaseTaskDef {
  title: string;
  assignee: string;
  subs: string[];
}

/** Canonical phase catalog — every phase the engine knows about. */
export const PHASE_CATALOG: Record<PhaseKey, Omit<PhaseDef, 'order'>> = {
  research: { key: 'research', name: 'Market Research', department: 'Research Division' },
  business_model: { key: 'business_model', name: 'Business Model', department: 'Executive Layer' },
  pricing: { key: 'pricing', name: 'Pricing Strategy', department: 'Financial Control' },
  operations: { key: 'operations', name: 'Operations Setup', department: 'Autonomous Control Unit' },
  hiring: { key: 'hiring', name: 'Hiring & Workforce', department: 'Executive Layer' },
  sales: { key: 'sales', name: 'Sales Engine', department: 'Sales Operations' },
  customer_acquisition: {
    key: 'customer_acquisition',
    name: 'Customer Acquisition',
    department: 'Growth & Marketing',
  },
  brand: { key: 'brand', name: 'Brand Identity', department: 'Design Studio' },
  website: { key: 'website', name: 'Website', department: 'Engineering Core' },
  social: { key: 'social', name: 'Social Media', department: 'Growth & Marketing' },
  listings: { key: 'listings', name: 'Local Listings', department: 'Growth & Marketing' },
  scaling: { key: 'scaling', name: 'Scaling Operations', department: 'Executive Layer' },
};

/**
 * Per-category execution sequence.
 * Each entry is the phase ORDER for that business category — revenue-first.
 */
export const CATEGORY_PHASE_SEQUENCE: Record<string, PhaseKey[]> = {
  'Service Business': [
    'research',
    'business_model',
    'pricing',
    'operations',
    'hiring',
    'sales',
    'customer_acquisition',
    'brand',
    'website',
    'social',
    'listings',
    'scaling',
  ],
  Hospitality: [
    'research',
    'business_model',
    'pricing',
    'operations',
    'hiring',
    'brand',
    'listings',
    'customer_acquisition',
    'website',
    'social',
    'sales',
    'scaling',
  ],
  SaaS: [
    'research',
    'business_model',
    'pricing',
    'brand',
    'website',
    'sales',
    'customer_acquisition',
    'operations',
    'hiring',
    'social',
    'scaling',
  ],
  'E-commerce': [
    'research',
    'business_model',
    'pricing',
    'brand',
    'website',
    'operations',
    'customer_acquisition',
    'social',
    'sales',
    'hiring',
    'listings',
    'scaling',
  ],
  'Physical Product': [
    'research',
    'business_model',
    'pricing',
    'operations',
    'brand',
    'website',
    'sales',
    'customer_acquisition',
    'social',
    'hiring',
    'scaling',
  ],
  Agency: [
    'research',
    'business_model',
    'pricing',
    'sales',
    'customer_acquisition',
    'operations',
    'brand',
    'website',
    'hiring',
    'social',
    'scaling',
  ],
  Healthcare: [
    'research',
    'business_model',
    'operations',
    'pricing',
    'hiring',
    'brand',
    'website',
    'sales',
    'customer_acquisition',
    'social',
    'scaling',
  ],
  Education: [
    'research',
    'business_model',
    'pricing',
    'operations',
    'brand',
    'website',
    'customer_acquisition',
    'sales',
    'hiring',
    'social',
    'scaling',
  ],
  Other: [
    'research',
    'business_model',
    'pricing',
    'operations',
    'sales',
    'customer_acquisition',
    'brand',
    'website',
    'social',
    'hiring',
    'scaling',
  ],
};

export function phaseSequenceForCategory(category: string | undefined): PhaseKey[] {
  if (!category) return CATEGORY_PHASE_SEQUENCE.Other;
  return CATEGORY_PHASE_SEQUENCE[category] ?? CATEGORY_PHASE_SEQUENCE.Other;
}

export function phaseDefsForCategory(category: string | undefined): PhaseDef[] {
  const seq = phaseSequenceForCategory(category);
  return seq.map((key, idx) => ({
    ...PHASE_CATALOG[key],
    order: idx,
  }));
}

/* -------------------------------------------------------------------------- */
/*  Per-category RESEARCH tasks                                                */
/* -------------------------------------------------------------------------- */

const RESEARCH_TASKS_SERVICE: PhaseTaskDef[] = [
  { title: 'Local demand & territory scan', assignee: 'Market Research Agent', subs: ['Service area mapping', 'Population density', 'Income profile', 'Demand frequency', 'Seasonality'] },
  { title: 'Competitor service offerings', assignee: 'Competitor Analysis Agent', subs: ['Top 10 local competitors', 'Service menus', 'Pricing bands', 'Differentiators', 'Response time'] },
  { title: 'Target customer personas', assignee: 'Market Research Agent', subs: ['Demographics', 'Buying triggers', 'Willingness to pay', 'Channel preferences', 'Decision cycle'] },
  { title: 'Pricing benchmarks', assignee: 'Pricing Research Agent', subs: ['Service tiers', 'Add-on pricing', 'Subscription vs one-off', 'Margin targets'] },
  { title: 'Customer acquisition channels', assignee: 'Trend Research Agent', subs: ['Local SEO signals', 'Referral patterns', 'Paid channel CAC', 'Partnership leads'] },
  { title: 'Operational requirements', assignee: 'Market Research Agent', subs: ['Equipment list', 'Permits', 'Labor pool', 'Insurance basics'] },
  { title: 'Executive research brief', assignee: 'Market Research Agent', subs: ['Synthesis', 'Top risks', 'Top opportunities', 'CEO summary'] },
];

const RESEARCH_TASKS_HOSPITALITY: PhaseTaskDef[] = [
  { title: 'Competitor landscape scan', assignee: 'Competitor Analysis Agent', subs: ['Identify top 10 competitors', 'Feature matrix', 'Pricing bands', 'Positioning map', 'Gap analysis'] },
  { title: 'Target customer personas', assignee: 'Market Research Agent', subs: ['Demographics', 'Pain points', 'Booking behavior', 'Willingness to pay', 'Channel preferences'] },
  { title: 'Market size & demand', assignee: 'Trend Research Agent', subs: ['TAM estimate', 'Local demand signals', 'Seasonality', 'Search volume trends'] },
  { title: 'Location feasibility', assignee: 'Market Research Agent', subs: ['Foot traffic proxies', 'Area demographics', 'Regulatory notes', 'Supply constraints'] },
  { title: 'Review & rating benchmarks', assignee: 'Competitor Analysis Agent', subs: ['OTA ratings scan', 'Review themes', 'Response patterns', 'Reputation risks'] },
  { title: 'Pricing strategy inputs', assignee: 'Market Research Agent', subs: ['ADR benchmarks', 'Package tiers', 'Promo patterns', 'Margin targets'] },
  { title: 'Channel distribution map', assignee: 'Trend Research Agent', subs: ['OTA mix', 'Direct booking %', 'Partnership options', 'Commission impact'] },
  { title: 'Regulatory & compliance scan', assignee: 'Legal Research Agent', subs: ['Licenses list', 'Safety requirements', 'Data privacy', 'Labor basics'] },
  { title: 'Executive research brief', assignee: 'Market Research Agent', subs: ['Synthesize findings', 'Key risks', 'Opportunities', 'CEO summary draft'] },
];

const RESEARCH_TASKS_SAAS: PhaseTaskDef[] = [
  { title: 'Problem validation', assignee: 'User Research Agent', subs: ['User interview script', 'Pain ranking', 'Job-to-be-done', 'Frequency check'] },
  { title: 'Competitor product scan', assignee: 'Competitor Analysis Agent', subs: ['Top 10 competitors', 'Feature matrix', 'Pricing tiers', 'Onboarding flows', 'Reviews scan'] },
  { title: 'ICP & target personas', assignee: 'Market Research Agent', subs: ['Company size', 'Role personas', 'Budget authority', 'Buying triggers'] },
  { title: 'Pricing benchmarks', assignee: 'Pricing Research Agent', subs: ['Tier models', 'Usage vs seat', 'Free trial norms', 'Enterprise add-ons'] },
  { title: 'Distribution channels', assignee: 'SEO Research Agent', subs: ['Organic keywords', 'Paid CAC', 'PLG signals', 'Marketplace fit'] },
  { title: 'Tech stack & integration map', assignee: 'Industry Intelligence Agent', subs: ['Required integrations', 'API gaps', 'Compliance needs'] },
  { title: 'Executive research brief', assignee: 'Market Research Agent', subs: ['Synthesis', 'Wedge opportunity', 'Risks', 'CEO summary'] },
];

const RESEARCH_TASKS_ECOM: PhaseTaskDef[] = [
  { title: 'Category & demand scan', assignee: 'Market Research Agent', subs: ['Search volume', 'Trend curves', 'Seasonality', 'TAM estimate'] },
  { title: 'Competitor catalog scan', assignee: 'Competitor Analysis Agent', subs: ['Top 10 brands', 'SKU range', 'Pricing tiers', 'Bundle strategy', 'Reviews'] },
  { title: 'Customer persona & ICP', assignee: 'Market Research Agent', subs: ['Demographics', 'Triggers', 'AOV benchmarks', 'Channel mix'] },
  { title: 'Pricing & margin map', assignee: 'Pricing Research Agent', subs: ['COGS benchmarks', 'Retail price bands', 'Shipping economics', 'Discount norms'] },
  { title: 'Acquisition channel CAC', assignee: 'Trend Research Agent', subs: ['Meta/Google CAC', 'Influencer norms', 'Email LTV', 'Marketplace fees'] },
  { title: 'Sourcing & fulfillment scan', assignee: 'Market Research Agent', subs: ['Supplier options', '3PL options', 'Lead times', 'Returns rate'] },
  { title: 'Executive research brief', assignee: 'Market Research Agent', subs: ['Synthesis', 'Top SKUs', 'Risks', 'CEO summary'] },
];

const RESEARCH_TASKS_PRODUCT: PhaseTaskDef[] = [
  { title: 'Category demand & trend scan', assignee: 'Market Research Agent', subs: ['Search volume', 'Trend curves', 'Demographics', 'Geography'] },
  { title: 'Competitor product map', assignee: 'Competitor Analysis Agent', subs: ['Top 10 brands', 'SKUs', 'Positioning', 'Pricing', 'Distribution'] },
  { title: 'Manufacturing & sourcing scan', assignee: 'Market Research Agent', subs: ['Suppliers shortlist', 'MOQ benchmarks', 'Lead times', 'Cost ranges'] },
  { title: 'Compliance requirements', assignee: 'Legal Research Agent', subs: ['Labeling', 'Certifications', 'Import rules', 'Liability basics'] },
  { title: 'Distribution & retail channels', assignee: 'Trend Research Agent', subs: ['Retail buyer map', 'Wholesale terms', 'DTC channel mix', 'Marketplace fees'] },
  { title: 'Pricing & margin map', assignee: 'Pricing Research Agent', subs: ['COGS targets', 'Wholesale price', 'Retail price', 'Promo headroom'] },
  { title: 'Executive research brief', assignee: 'Market Research Agent', subs: ['Synthesis', 'Wedge SKU', 'Risks', 'CEO summary'] },
];

const RESEARCH_TASKS_AGENCY: PhaseTaskDef[] = [
  { title: 'Niche & wedge selection', assignee: 'Market Research Agent', subs: ['Vertical scan', 'Budget per vertical', 'Pain ranking', 'Wedge offer'] },
  { title: 'Competitor agency scan', assignee: 'Competitor Analysis Agent', subs: ['Top 10 agencies', 'Service menus', 'Pricing models', 'Case studies'] },
  { title: 'ICP & buyer personas', assignee: 'Market Research Agent', subs: ['Title', 'Company size', 'Budget', 'Buying triggers'] },
  { title: 'Pricing & packaging benchmarks', assignee: 'Pricing Research Agent', subs: ['Retainer ranges', 'Project rates', 'Performance pricing', 'Margin model'] },
  { title: 'Outbound channel viability', assignee: 'Trend Research Agent', subs: ['LinkedIn outbound CAC', 'Cold email reply rates', 'Partner channels'] },
  { title: 'Executive research brief', assignee: 'Market Research Agent', subs: ['Synthesis', 'Wedge offer', 'Risks', 'CEO summary'] },
];

const RESEARCH_TASKS_DEFAULT: PhaseTaskDef[] = [
  { title: 'Market & demand scan', assignee: 'Market Research Agent', subs: ['Segment sizing', 'Demand signals', 'Geography', 'Trend curves'] },
  { title: 'Competitor scan', assignee: 'Competitor Analysis Agent', subs: ['Top 10 competitors', 'Offerings', 'Pricing', 'Positioning'] },
  { title: 'Target customer personas', assignee: 'Market Research Agent', subs: ['Demographics', 'Pain points', 'Buying behavior', 'Willingness to pay'] },
  { title: 'Pricing benchmarks', assignee: 'Pricing Research Agent', subs: ['Tier models', 'Price bands', 'Margin targets'] },
  { title: 'Distribution & channel map', assignee: 'Trend Research Agent', subs: ['Channels', 'CAC estimates', 'Partnership options'] },
  { title: 'Executive research brief', assignee: 'Market Research Agent', subs: ['Synthesis', 'Key risks', 'Opportunities', 'CEO summary'] },
];

export function researchTasksForCategory(category: string | undefined): PhaseTaskDef[] {
  switch (category) {
    case 'Service Business':
      return RESEARCH_TASKS_SERVICE;
    case 'Hospitality':
      return RESEARCH_TASKS_HOSPITALITY;
    case 'SaaS':
      return RESEARCH_TASKS_SAAS;
    case 'E-commerce':
      return RESEARCH_TASKS_ECOM;
    case 'Physical Product':
      return RESEARCH_TASKS_PRODUCT;
    case 'Agency':
      return RESEARCH_TASKS_AGENCY;
    default:
      return RESEARCH_TASKS_DEFAULT;
  }
}

/* -------------------------------------------------------------------------- */
/*  Operational phase task templates                                           */
/* -------------------------------------------------------------------------- */

const TASKS_BUSINESS_MODEL: PhaseTaskDef[] = [
  { title: 'Revenue model definition', assignee: 'CEO Agent', subs: ['Revenue streams', 'Unit economics', 'Margin targets', 'Recurring vs one-off'] },
  { title: 'Cost structure & break-even', assignee: 'Finance Planner Agent', subs: ['Fixed costs', 'Variable costs', 'Break-even units', 'Runway map'] },
  { title: 'Value proposition lockdown', assignee: 'CEO Agent', subs: ['Core offer', 'Differentiator', 'Promise', 'Proof points'] },
  { title: 'Go-to-market thesis', assignee: 'Marketing Manager Agent', subs: ['Beachhead segment', 'Wedge channel', 'First 10 customers plan'] },
];

const TASKS_PRICING: PhaseTaskDef[] = [
  { title: 'Pricing model selection', assignee: 'Pricing Research Agent', subs: ['Tier vs usage', 'Bundle strategy', 'Anchor pricing', 'Discount policy'] },
  { title: 'Price points & packages', assignee: 'Finance Planner Agent', subs: ['Entry tier', 'Core tier', 'Premium tier', 'Add-ons'] },
  { title: 'Margin & profitability check', assignee: 'Finance Planner Agent', subs: ['Per-unit margin', 'LTV/CAC', 'Payback period', 'Sensitivity'] },
  { title: 'Pricing page copy & rationale', assignee: 'Copywriting Agent', subs: ['Value framing', 'Comparison table', 'FAQ', 'Objection handlers'] },
];

const TASKS_OPERATIONS: PhaseTaskDef[] = [
  { title: 'Service / delivery workflow', assignee: 'Operations Manager Agent', subs: ['Step-by-step SOP', 'Tools required', 'Quality gates', 'Handoff points'] },
  { title: 'Vendor & supplier setup', assignee: 'Operations Manager Agent', subs: ['Shortlist', 'Contract terms', 'Backup vendors', 'Onboarding'] },
  { title: 'Tooling & systems', assignee: 'Automation Agent', subs: ['CRM choice', 'Billing system', 'Comms stack', 'Inventory / scheduling'] },
  { title: 'Compliance & insurance', assignee: 'Legal Research Agent', subs: ['Licenses', 'Insurance policies', 'Contracts', 'Liability basics'] },
];

const TASKS_HIRING: PhaseTaskDef[] = [
  { title: 'Role design & headcount plan', assignee: 'Operations Manager Agent', subs: ['Critical roles', 'Hire order', 'Comp ranges', 'Contractor vs FTE'] },
  { title: 'Job descriptions & scorecards', assignee: 'Content Agent', subs: ['Role outcomes', 'Required skills', 'Day-30/60/90 plan'] },
  { title: 'Sourcing & screening plan', assignee: 'Operations Manager Agent', subs: ['Channels', 'Screening rubric', 'Interview loop', 'Reference checks'] },
  { title: 'Onboarding playbook', assignee: 'Operations Manager Agent', subs: ['Week 1 plan', 'Training assets', 'SOP handoff', 'Success metrics'] },
];

const TASKS_SALES: PhaseTaskDef[] = [
  { title: 'Sales playbook', assignee: 'Marketing Manager Agent', subs: ['ICP definition', 'Discovery script', 'Objection handlers', 'Closing flow'] },
  { title: 'Lead pipeline setup', assignee: 'Marketing Manager Agent', subs: ['CRM stages', 'Lead scoring', 'Follow-up cadence', 'Activity targets'] },
  { title: 'First-10-customers plan', assignee: 'CEO Agent', subs: ['Target list', 'Outreach plan', 'Pilot offer', 'Conversion goal'] },
  { title: 'Conversion assets', assignee: 'Copywriting Agent', subs: ['Sales deck', 'Proposal template', 'Case study v1', 'Pricing one-pager'] },
];

const TASKS_CUSTOMER_ACQUISITION: PhaseTaskDef[] = [
  { title: 'Acquisition channel test plan', assignee: 'Growth Agent', subs: ['Channel shortlist', 'Test budget split', 'KPIs', 'Decision rules'] },
  { title: 'Offer & lead magnet', assignee: 'Marketing Manager Agent', subs: ['Hook offer', 'Lead capture', 'Nurture sequence', 'Win-back flow'] },
  { title: 'Referral & partner program', assignee: 'Growth Agent', subs: ['Incentive design', 'Partner shortlist', 'Tracking setup'] },
  { title: 'CAC dashboard & weekly review', assignee: 'Growth Agent', subs: ['Channel CAC', 'Conversion %', 'Payback', 'Iteration loop'] },
];

const TASKS_BRAND: PhaseTaskDef[] = [
  { title: 'Brand positioning statement', assignee: 'UI Designer Agent', subs: ['Value prop', 'Differentiators', 'Tone of voice', 'Tagline options'] },
  { title: 'Visual identity system', assignee: 'UI Designer Agent', subs: ['Color palette', 'Typography', 'Logo concepts', 'Asset kit'] },
  { title: 'Brand guidelines doc', assignee: 'Content Agent', subs: ['Usage rules', 'Messaging', 'Photography style', 'Export PDF'] },
];

const TASKS_WEBSITE: PhaseTaskDef[] = [
  { title: 'Site architecture', assignee: 'Software Architect Agent', subs: ['Sitemap', 'Page wireframes', 'CMS choice', 'Hosting plan'] },
  { title: 'Frontend build', assignee: 'Frontend Agent', subs: ['Hero section', 'Offer / pricing pages', 'Conversion CTA', 'Mobile pass'] },
  { title: 'Deploy & verify', assignee: 'DevOps Agent', subs: ['CI pipeline', 'SSL', 'Analytics tag', 'Smoke test'] },
];

const TASKS_SOCIAL: PhaseTaskDef[] = [
  { title: 'Channel audit', assignee: 'Social Media Agent', subs: ['Instagram', 'Facebook', 'LinkedIn', 'Google Business'] },
  { title: 'Profile setup', assignee: 'Social Media Agent', subs: ['Bios', 'Links', 'Brand assets', 'Verify'] },
  { title: 'Content calendar', assignee: 'Content Agent', subs: ['30-day plan', 'Post drafts', 'Stories', 'Schedule'] },
];

const TASKS_LISTINGS: PhaseTaskDef[] = [
  { title: 'Google Business Profile', assignee: 'Local Presence Agent', subs: ['Claim listing', 'Photos', 'Services', 'Verify'] },
  { title: 'Marketplace / OTA listings', assignee: 'Local Presence Agent', subs: ['Top 3 platforms', 'Sync rates', 'Photos', 'Reviews policy'] },
  { title: 'Review monitoring', assignee: 'Local Presence Agent', subs: ['Alerts', 'Response templates', 'Weekly report'] },
];

const TASKS_SCALING: PhaseTaskDef[] = [
  { title: 'Process automation audit', assignee: 'Automation Agent', subs: ['Manual bottlenecks', 'Automation candidates', 'Tool selection', 'ROI estimate'] },
  { title: 'Team & org expansion plan', assignee: 'Operations Manager Agent', subs: ['Org chart v2', 'Hiring waves', 'Comp scaling', 'Management layer'] },
  { title: 'Growth channel doubling', assignee: 'Growth Agent', subs: ['Best CAC channel', 'Scale budget', 'Add 2nd channel', 'Retention loop'] },
  { title: 'Financial scaling model', assignee: 'Finance Planner Agent', subs: ['Revenue forecast', 'Cash needs', 'Fundraise vs profit', 'Unit economics watch'] },
];

const TASK_TEMPLATES: Record<PhaseKey, PhaseTaskDef[]> = {
  research: RESEARCH_TASKS_DEFAULT, // overridden by researchTasksForCategory
  business_model: TASKS_BUSINESS_MODEL,
  pricing: TASKS_PRICING,
  operations: TASKS_OPERATIONS,
  hiring: TASKS_HIRING,
  sales: TASKS_SALES,
  customer_acquisition: TASKS_CUSTOMER_ACQUISITION,
  brand: TASKS_BRAND,
  website: TASKS_WEBSITE,
  social: TASKS_SOCIAL,
  listings: TASKS_LISTINGS,
  scaling: TASKS_SCALING,
};

export function tasksForPhase(phaseKey: PhaseKey, category?: string): PhaseTaskDef[] {
  if (phaseKey === 'research') return researchTasksForCategory(category);
  return TASK_TEMPLATES[phaseKey] ?? [];
}

/* -------------------------------------------------------------------------- */
/*  Founder-mode recommendation framing                                        */
/* -------------------------------------------------------------------------- */

/**
 * Reasons are written from a founder's perspective:
 * "What gets us closer to revenue, customers, or launch?"
 * NOT: "What looks good on a dashboard?"
 */
const PHASE_REC_META: Record<PhaseKey, Omit<PhaseRecommendation, 'phaseKey' | 'label' | 'description'>> = {
  research: {
    reason: 'Validates demand and confirms we are building something real customers will pay for.',
    revenueImpact: 'enabling',
    blocksLaunch: true,
    roi: 'high',
    isOperational: true,
  },
  business_model: {
    reason: 'Locks revenue streams, unit economics, and the path to break-even before we spend on anything cosmetic.',
    revenueImpact: 'direct',
    blocksLaunch: true,
    roi: 'high',
    isOperational: true,
  },
  pricing: {
    reason: 'Pricing decides whether each sale makes money. Setting price before marketing prevents unprofitable growth.',
    revenueImpact: 'direct',
    blocksLaunch: true,
    roi: 'high',
    isOperational: true,
  },
  operations: {
    reason: 'You cannot deliver — and cannot collect revenue — until the operational workflow, tools, and compliance are in place.',
    revenueImpact: 'enabling',
    blocksLaunch: true,
    roi: 'high',
    isOperational: true,
  },
  hiring: {
    reason: 'Capacity to deliver = capacity to bill. Hiring the first critical roles unlocks revenue you cannot earn solo.',
    revenueImpact: 'enabling',
    blocksLaunch: false,
    roi: 'medium',
    isOperational: true,
  },
  sales: {
    reason: 'A repeatable sales motion is what turns interest into signed customers — the fastest path to first revenue.',
    revenueImpact: 'direct',
    blocksLaunch: false,
    roi: 'high',
    isOperational: true,
  },
  customer_acquisition: {
    reason: 'Predictable lead flow is what makes revenue compound. Channel tests find the lowest-CAC path to customers.',
    revenueImpact: 'direct',
    blocksLaunch: false,
    roi: 'high',
    isOperational: true,
  },
  brand: {
    reason: 'Brand earns higher conversion and trust — but only matters once the offer, pricing, and delivery work.',
    revenueImpact: 'indirect',
    blocksLaunch: false,
    roi: 'medium',
    isOperational: false,
  },
  website: {
    reason: 'Website is the conversion surface. Build it after the offer and pricing are validated so it sells, not just exists.',
    revenueImpact: 'indirect',
    blocksLaunch: false,
    roi: 'medium',
    isOperational: false,
  },
  social: {
    reason: 'Social amplifies an offer that already converts. Without proven sales motion, social spend is performative.',
    revenueImpact: 'indirect',
    blocksLaunch: false,
    roi: 'low',
    isOperational: false,
  },
  listings: {
    reason: 'For local / discovery-driven businesses, listings = inbound demand. Pairs with operations and reviews.',
    revenueImpact: 'direct',
    blocksLaunch: false,
    roi: 'high',
    isOperational: true,
  },
  scaling: {
    reason: 'Scaling kicks in once unit economics are positive — automate bottlenecks, double the best channel, expand capacity.',
    revenueImpact: 'direct',
    blocksLaunch: false,
    roi: 'high',
    isOperational: true,
  },
};

const PHASE_LABELS: Record<PhaseKey, { label: string; description: string }> = {
  research: { label: 'Market Research', description: 'Validate demand, competitors, customers, and pricing inputs.' },
  business_model: { label: 'Lock Business Model', description: 'Revenue streams, unit economics, value prop, GTM thesis.' },
  pricing: { label: 'Pricing Strategy', description: 'Tiers, packages, margin check, and pricing page rationale.' },
  operations: { label: 'Operations Setup', description: 'Delivery SOP, vendors, tooling, compliance — so you can actually serve customers.' },
  hiring: { label: 'Hiring & Workforce', description: 'Critical first hires, roles, sourcing, and onboarding plan.' },
  sales: { label: 'Sales Engine', description: 'Playbook, pipeline, first-10-customers plan, and conversion assets.' },
  customer_acquisition: { label: 'Customer Acquisition', description: 'Channel tests, lead magnet, referral loop, CAC dashboard.' },
  brand: { label: 'Brand Identity', description: 'Positioning, visual identity, and brand guidelines.' },
  website: { label: 'Website', description: 'Conversion-focused site with offer, pricing, and CTA.' },
  social: { label: 'Social Media', description: 'Channel setup and 30-day content plan.' },
  listings: { label: 'Local Listings', description: 'Google Business, marketplaces, and review monitoring.' },
  scaling: { label: 'Scale Operations', description: 'Automate, expand team, double best channel, financial scaling model.' },
};

export function buildPhaseRecommendation(phaseKey: PhaseKey): PhaseRecommendation {
  const meta = PHASE_REC_META[phaseKey];
  const label = PHASE_LABELS[phaseKey];
  return {
    phaseKey,
    label: label.label,
    description: label.description,
    ...meta,
  };
}

/**
 * Returns the next 1–3 phases that should be recommended after `justCompleted`,
 * based on the category's full execution sequence. Skips phases already done.
 */
export function nextRecommendationsForCategory(
  category: string | undefined,
  justCompleted: string,
  alreadyCompletedKeys: string[],
  maxOptions = 3,
): PhaseRecommendation[] {
  const seq = phaseSequenceForCategory(category);
  const completedSet = new Set([...alreadyCompletedKeys, justCompleted]);
  const remaining = seq.filter((k) => !completedSet.has(k));
  return remaining.slice(0, maxOptions).map(buildPhaseRecommendation);
}

/** Map a phase to the departments it activates. */
export function departmentsForPhase(phaseKey: PhaseKey, category?: string): string[] {
  const map: Record<PhaseKey, string[]> = {
    research: ['Research Division'],
    business_model: ['Executive Layer', 'Financial Control'],
    pricing: ['Financial Control', 'Research Division'],
    operations: ['Autonomous Control Unit', 'Legal & Policy'],
    hiring: ['Executive Layer', 'Autonomous Control Unit'],
    sales: ['Sales Operations', 'Growth & Marketing'],
    customer_acquisition: ['Growth & Marketing', 'Sales Operations'],
    brand: ['Design Studio', 'Growth & Marketing'],
    website: ['Engineering Core', 'Design Studio'],
    social: ['Growth & Marketing'],
    listings: ['Growth & Marketing'],
    scaling: ['Executive Layer', 'Autonomous Control Unit', 'Financial Control'],
  };
  const base = map[phaseKey] ?? ['Executive Layer'];
  if (category === 'Hospitality' && phaseKey === 'research') {
    return [...base, 'Legal & Policy'];
  }
  return base;
}
