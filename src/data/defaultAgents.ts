import { AgentWorkforce } from '../types';
import { getModelForAgent, getModelLabel } from '../config/agentModels';

export function enrichWorkforce(agents: AgentWorkforce[]): AgentWorkforce[] {
  return agents.map((agent) => {
    const assignedModel = getModelForAgent(agent.name, agent.department);
    return {
      ...agent,
      assignedModel,
      modelLabel: getModelLabel(assignedModel),
    };
  });
}

export const CORE_DEPARTMENTS = [
  { id: 'exec', name: 'Executive Layer', status: 'active', agentCount: 5, activity: 'Establishing long range corporate vision alignment.', brief: 'High-level strategic board modeling long range outcome pathways.' },
  { id: 'research', name: 'Research Division', status: 'active', agentCount: 8, activity: 'Monitoring rival launches & mining user feedback loops.', brief: 'Conducts pricing audits, SEO mappings, and index mining.' },
  { id: 'product', name: 'Product Office', status: 'active', agentCount: 6, activity: 'Reviewing PRD drafts and feature requirement cards.', brief: 'Maintains feature backlogs, wires user scenarios, drafts specs.' },
  { id: 'design', name: 'Design Studio', status: 'active', agentCount: 8, activity: 'Consolidation of typography charts & visual UI components.', brief: 'Delivers UI kits, high fidelity layouts, prototyping sheets.' },
  { id: 'engineering', name: 'Engineering Core', status: 'active', agentCount: 15, activity: 'Compiling bundles & ensuring continuous integration runs.', brief: 'Operates fullstack, devops, relational database setups, QA tests.' },
  { id: 'marketing', name: 'Growth & Marketing', status: 'paused', agentCount: 12, activity: 'Organizing newsletter campaigns and platform outreach copies.', brief: 'Content generators, search ranking setups, launch pipelines.' },
  { id: 'sales', name: 'Sales Operations', status: 'disabled', agentCount: 8, activity: 'Lead list mining halted. Outreach channels on standby.', brief: 'Outbound prospecting channels, proposal drafting, CRM sync.' },
  { id: 'finance', name: 'Financial Control', status: 'active', agentCount: 6, activity: 'Tracking monthly runway projections & operating costs.', brief: 'Oversees financial sheets, revenue forecasting, fundraising models.' },
  { id: 'operations', name: 'Autonomous Control Unit', status: 'active', agentCount: 10, activity: 'Evaluating goal progress loops & identifying milestones blocks.', brief: 'Deep orchestrator agents matching task schedules and handling bugs.' },
  { id: 'legal', name: 'Legal & Policy', status: 'disabled', agentCount: 5, activity: 'Audit queues clean. Document generation suspended.', brief: 'Handles terms of service, compliance checks, and non-disclosure copies.' }
] as const;

const AWAITING_DIRECTIVE = 'Awaiting your directive on Command Center';

export function idleWorkforce(agents: AgentWorkforce[]): AgentWorkforce[] {
  return agents.map((a) => ({
    ...a,
    status: 'standby' as const,
    currentTask: AWAITING_DIRECTIVE,
    workload: 'low' as const,
  }));
}

export const INITIAL_AGENTS: AgentWorkforce[] = [
  // Executive Board
  {
    id: 'ceo',
    name: 'CEO Agent',
    role: 'Chief Executive Officer',
    department: 'Executive Layer',
    status: 'standby',
    currentTask: AWAITING_DIRECTIVE,
    workload: 'medium',
    rating: 9.8,
    avatarColor: 'bg-indigo-600',
    deliverables: ['Quarterly Board Report', 'Strategic Priorities Deck', 'Capital Allocation Guide'],
    activityLog: [
      'Reviewed current sector validation benchmarks',
      'Synchronized with CTO and CFO concerning tech budget guidelines'
    ]
  },
  {
    id: 'coo',
    name: 'COO Agent',
    role: 'Chief Operating Officer',
    department: 'Executive Layer',
    status: 'standby',
    currentTask: AWAITING_DIRECTIVE,
    workload: 'high',
    rating: 9.7,
    avatarColor: 'bg-blue-600',
    deliverables: ['Company Operating Blueprint', 'Staffing Allocations Grid', 'Integration Roadmaps'],
    activityLog: [
      'Analyzed milestone dependency bottlenecks',
      'Configured task assignment queues for incoming engineering sprint'
    ]
  },
  {
    id: 'cto',
    name: 'CTO Agent',
    role: 'Chief Technology Officer',
    department: 'Executive Layer',
    status: 'standby',
    currentTask: AWAITING_DIRECTIVE,
    workload: 'high',
    rating: 9.9,
    avatarColor: 'bg-emerald-600',
    deliverables: ['System Architecture Brief', 'Vite Bundle Constraints', 'Database Security Profile'],
    activityLog: [
      'Approved Node container CJS bundling rules',
      'Conducted telemetry security check inside deployment routes'
    ]
  },
  {
    id: 'cmo',
    name: 'CMO Agent',
    role: 'Chief Marketing Officer',
    department: 'Executive Layer',
    status: 'standby',
    currentTask: 'Idle inside marketing dashboard (Division currently Paused)',
    workload: 'low',
    rating: 9.2,
    avatarColor: 'bg-pink-600',
    deliverables: ['Organic Acquisition Playbook', 'Social Launch Assets Portfolio'],
    activityLog: [
      'Pre-compiled organic SEO layout strategies',
      'Waiting for department activation signal to instantiate campaign'
    ]
  },
  {
    id: 'cfo',
    name: 'CFO Agent',
    role: 'Chief Financial Officer',
    department: 'Executive Layer',
    status: 'standby',
    currentTask: AWAITING_DIRECTIVE,
    workload: 'medium',
    rating: 9.6,
    avatarColor: 'bg-violet-600',
    deliverables: ['Runway Buffer Projections', 'Vendor Cost Allocation Matrix'],
    activityLog: [
      'Updated budget parameters corresponding to user launch model',
      'Verified zero cloud service slippage inside infrastructure accounts'
    ]
  },

  // Research
  {
    id: 'mkt-research',
    name: 'Market Research Agent',
    role: 'Market Intelligence Analyst',
    department: 'Research Division',
    status: 'standby',
    currentTask: AWAITING_DIRECTIVE,
    workload: 'medium',
    rating: 9.5,
    avatarColor: 'bg-cyan-600',
    deliverables: ['Market Fit Report', 'Pricing Strategy Canvas'],
    activityLog: [
      'Identified 2 rival setups offering similar product features',
      'Categorized target buyer personas based on organic search trends'
    ]
  },
  {
    id: 'comp-analysis',
    name: 'Competitor Analysis Agent',
    role: 'Competitive Strategy Analyst',
    department: 'Research Division',
    status: 'standby',
    currentTask: AWAITING_DIRECTIVE,
    workload: 'high',
    rating: 9.4,
    avatarColor: 'bg-sky-600',
    deliverables: ['Competitor Grid Matrix', 'Value Differentiation Sheet'],
    activityLog: [
      'Cross referenced 12 software portfolios in the industry database',
      'Flagged potential risk concerning overlap in feature definitions'
    ]
  },

  // Product Office
  {
    id: 'pm',
    name: 'Product Manager Agent',
    role: 'Senior Product Lead',
    department: 'Product Office',
    status: 'standby',
    currentTask: AWAITING_DIRECTIVE,
    workload: 'medium',
    rating: 9.7,
    avatarColor: 'bg-amber-600',
    deliverables: ['Product Requirements Document', 'Epic User Scenario Flowchart'],
    activityLog: [
      'Structured technical epics for engineering core development',
      'Mapped customer visual requirements directly to wireframe requests'
    ]
  },

  // Design Studio
  {
    id: 'ui-designer',
    name: 'UI Designer Agent',
    role: 'Product Visual craft Lead',
    department: 'Design Studio',
    status: 'standby',
    currentTask: AWAITING_DIRECTIVE,
    workload: 'medium',
    rating: 9.8,
    avatarColor: 'bg-rose-500',
    deliverables: ['Desktop Interface Mockups', 'Component Tokens Library'],
    activityLog: [
      'Completed visual alignment checks of dark slate workspace cards',
      'Exported icon asset sheets using Lucide standard imports'
    ]
  },

  // Engineering Core
  {
    id: 'software-architect',
    name: 'Software Architect Agent',
    role: 'Principal Systems Architect',
    department: 'Engineering Core',
    status: 'standby',
    currentTask: AWAITING_DIRECTIVE,
    workload: 'high',
    rating: 9.9,
    avatarColor: 'bg-teal-600',
    deliverables: ['Relational Database Diagram', 'JSON API Response Schema Spec'],
    activityLog: [
      'Completed typescript strict compiler reviews',
      'Configured server entry points to lazy load third party client wrappers'
    ]
  },
  {
    id: 'devops',
    name: 'DevOps Agent',
    role: 'Infrastructure & Container Engineer',
    department: 'Engineering Core',
    status: 'standby',
    currentTask: AWAITING_DIRECTIVE,
    workload: 'medium',
    rating: 9.5,
    avatarColor: 'bg-slate-700',
    deliverables: ['CI/CD Pipeline Configurations', 'Container Build Instructions'],
    activityLog: [
      'Verified server binds to host 0.0.0.0 and port 3000 securely',
      'Audited esbuild production script compiler warnings'
    ]
  },

  // Operations Control (Autonomous Layer)
  {
    id: 'goal-mgr',
    name: 'Goal Manager Agent',
    role: 'Objectives Orchestrator',
    department: 'Autonomous Control Unit',
    status: 'standby',
    currentTask: AWAITING_DIRECTIVE,
    workload: 'medium',
    rating: 9.8,
    avatarColor: 'bg-purple-600',
    deliverables: ['Goal Metric Status Reports', 'Corporate Milestone Projections'],
    activityLog: [
      'Scanned active task progress ratios in current milestone blocks',
      'Injected tactical execution tickets to CTO board pipelines'
    ]
  },
  {
    id: 'replanning-agent',
    name: 'Replanning Agent',
    role: 'Dynamic Redundancy Analyst',
    department: 'Autonomous Control Unit',
    status: 'standby',
    currentTask: 'Listening to risk center triggers (Standby)',
    workload: 'low',
    rating: 9.9,
    avatarColor: 'bg-teal-500',
    deliverables: ['Emergency Roadmap Revisions', 'Alternative Vendor Recommendations List'],
    activityLog: [
      'Completed calibration simulation sweeps across budget vectors',
      'Stood up secondary plan protocols for stripe/payment gate warnings'
    ]
  }
];

// Extrapolate list programmatically to represent are total of "~100 Agents"
export function getFullWorkforce(activeDeps: string[]): AgentWorkforce[] {
  // Let's create an elegant list of core agents, supplemented with specialized agents matching active departments!
  const workforce: AgentWorkforce[] = [...INITIAL_AGENTS];

  // We add specialized workers dynamically to pad out the workforce list, making it feel massive and interactive!
  const names = [
    'Feature Planner', 'Requirements Writer', 'Validation Specialist', 'User Journey Researcher',
    'SEO Keyword Analyst', 'Database Architect', 'API Endpoint Specialist', 'Frontend Stylist',
    'Backend Controller', 'Performance QA Tester', 'Integration Specialist', 'Automation Bot Agent',
    'Social Campaign Architect', 'Product Hunt Hunter', 'Pitch Deck Storyteller', 'SaaS Licensing Specialist',
    'Compliance Audit Expert', 'Contracts Architect', 'Venture Pipeline Analyzer', 'Demo Presentation Scriptwriter'
  ];

  const roles = [
    'Feature Design Engineer', 'Business Requirements Coordinator', 'Proposition Validation Officer',
    'Customer Insights Expert', 'Growth Search Optimist', 'Database Tuning Specialist', 'REST Payload Architect',
    'CSS Layout Specialist', 'Core Services Developer', 'Automated QA Engineer', 'API Integrator', 'Workflow Automation BOT',
    'Performance Acquisition Lead', 'Product Launch Campaigner', 'Investor Presentation Designer', 'Compliance Analyst',
    'Corporate Contracts Draftsman', 'Fundraising Logistics Scribe', 'Judge Analysis Specialist', 'Lead Pitch Scribe'
  ];

  const departments = [
    'Product Office', 'Product Office', 'Product Office', 'Research Division',
    'Research Division', 'Engineering Core', 'Engineering Core', 'Engineering Core',
    'Engineering Core', 'Engineering Core', 'Engineering Core', 'Engineering Core',
    'Growth & Marketing', 'Growth & Marketing', 'Financial Control', 'Legal & Policy',
    'Legal & Policy', 'Legal & Policy', 'Financial Control', 'Executive Layer'
  ];

  const colors = [
    'bg-amber-600', 'bg-amber-500', 'bg-yellow-600', 'bg-cyan-600',
    'bg-sky-600', 'bg-emerald-600', 'bg-emerald-500', 'bg-teal-600',
    'bg-indigo-600', 'bg-slate-600', 'bg-slate-500', 'bg-violet-600',
    'bg-pink-600', 'bg-pink-500', 'bg-rose-600', 'bg-orange-600',
    'bg-orange-500', 'bg-orange-400', 'bg-rose-500', 'bg-purple-700'
  ];

  for (let i = 0; i < names.length; i++) {
    const depName = departments[i];
    const isActive = activeDeps.includes(depName);
    
    workforce.push({
      id: `spec-${i}`,
      name: `${names[i]} Agent`,
      role: roles[i],
      department: depName,
      status: 'standby',
      currentTask: AWAITING_DIRECTIVE,
      workload: isActive ? (i % 3 === 0 ? 'high' : i % 3 === 1 ? 'medium' : 'low') : 'low',
      rating: Number((8.8 + (i % 12) * 0.1).toFixed(1)),
      avatarColor: colors[i % colors.length],
      deliverables: [`Deliverable ${i}-A`, `Artifact ${i}-B`],
      activityLog: [
        'Updated configuration parameters',
        isActive ? 'Active on standard worker pipeline' : 'System division paused'
      ]
    });
  }

  return enrichWorkforce(workforce);
}
