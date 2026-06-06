import type {
  ContinuousDirective,
  ExecutionGraph,
  ExecutionTask,
} from './executionTypes';
import { getCompanyState, updateCompanyState } from './store';
import { assignTask } from './taskBus';
import { appendEvent } from './eventLog';
import { writeMemory } from './memoryOps';
import { getBusinessProfile } from './businessProfile';
import { nimChatCompletion, parseJsonFromLlm, type NimMessage } from '../nimClient';
import { resolveModelForExecutive } from '../agentModels';
import { getMemorySnapshot } from './memoryOps';

const DIRECTIVES_PER_ROUND = 4;
const MIN_SECONDS_BETWEEN_ROUNDS = 10;

/**
 * Templates of CEO directives the system can issue on behalf of the founder.
 * These are the kinds of brand-operations work that happen AFTER the initial
 * launch phases: ongoing marketing, sales, customer success, product, ops.
 * Each template includes a department + assignee so the right agent picks it up.
 */
const DIRECTIVE_TEMPLATES: Array<{
  title: string;
  rationale: string;
  department: string;
  assignee: string;
  subs: string[];
  category?: string;
}> = [
  {
    title: 'Launch this week\'s social content sprint',
    rationale: 'Continuous marketing presence drives top-of-funnel awareness.',
    department: 'Marketing Department',
    assignee: 'Marketing Manager Agent',
    subs: [
      'Draft 3 LinkedIn posts announcing the latest deliverable',
      'Schedule 5 Instagram reels aligned to brand voice',
      'Write a customer-success story email for the list',
    ],
  },
  {
    title: 'Run outbound sales to identified ICP prospects',
    rationale: 'Direct revenue: 50 targeted cold emails can yield 5-10 first calls.',
    department: 'Sales Department',
    assignee: 'Sales Manager Agent',
    subs: [
      'Pull 50 high-fit prospects from research list',
      'Personalize first-touch email for each segment',
      'Queue follow-up sequence (Day 3, Day 7, Day 14)',
    ],
  },
  {
    title: 'Activate one new acquisition channel',
    rationale: 'Diversifying acquisition reduces single-channel dependency.',
    department: 'Growth Department',
    assignee: 'Growth Manager Agent',
    subs: [
      'Pick highest-ROI un-tested channel from research',
      'Allocate $200 test budget to campaign',
      'Set up tracking pixel + UTM conventions',
    ],
  },
  {
    title: 'Ship a customer-feedback loop',
    rationale: 'Direct revenue: 1 in 5 detractors recovered is +20% LTV.',
    department: 'Customer Success Department',
    assignee: 'Customer Success Agent',
    subs: [
      'Send NPS survey to last 30 days of customers',
      'Tag responses by sentiment and feature request',
      'Draft reply sequences for detractors',
    ],
  },
  {
    title: 'Push a product improvement based on signal',
    rationale: 'Operational + direct: small UX wins compound into conversion lift.',
    department: 'Product Department',
    assignee: 'Product Manager Agent',
    subs: [
      'Review last 20 support tickets for patterns',
      'Pick top friction point with revenue impact',
      'Spec a 1-week fix and route to engineering',
    ],
  },
  {
    title: 'Refresh the landing page with latest proof',
    rationale: 'Operational: recent wins in copy drive higher signup conversion.',
    department: 'Marketing Department',
    assignee: 'Copywriter Agent',
    subs: [
      'Pull the strongest metric from last sprint',
      'Rewrite hero + sub-headline with proof point',
      'A/B test against current variant',
    ],
  },
  {
    title: 'Run a founder-led content piece',
    rationale: 'Founder presence compounds: 1 long-form post = 30 days of social.',
    department: 'Executive Layer',
    assignee: 'CEO Agent',
    subs: [
      'Pick a contrarian take from this week\'s learnings',
      'Draft 800-word founder essay',
      'Distribute to email list + 3 social channels',
    ],
  },
  {
    title: 'Optimize the pricing page for conversion',
    rationale: 'Direct revenue: pricing-page tests are the highest-leverage UX work.',
    department: 'Marketing Department',
    assignee: 'CRO Specialist Agent',
    subs: [
      'Audit current pricing-page heatmap + scroll data',
      'Hypothesize 2 changes (anchor / decoy / bundling)',
      'Ship A/B test and monitor for 7 days',
    ],
  },
  {
    title: 'Spin up a weekly metrics review',
    rationale: 'Operational: what gets measured gets improved.',
    department: 'Operations Department',
    assignee: 'Operations Manager Agent',
    subs: [
      'Define 5 KPIs (CAC, LTV, activation, retention, MRR)',
      'Wire dashboards from existing data sources',
      'Schedule 15-min Monday review with CEO',
    ],
  },
  {
    title: 'Activate a referral program',
    rationale: 'Direct revenue: referred users convert 3-5x and churn 2x less.',
    department: 'Growth Department',
    assignee: 'Growth Manager Agent',
    subs: [
      'Design double-sided incentive aligned to AOV',
      'Build referral link infrastructure',
      'Launch to top 10% of customers first',
    ],
  },
];

function pickDirectiveTemplates(
  count: number,
  recentlyUsed: Set<string>,
  category: string,
): typeof DIRECTIVE_TEMPLATES {
  const filtered = DIRECTIVE_TEMPLATES.filter((t) => !recentlyUsed.has(t.title));
  // Service business gets more customer-acquisition heavy mix
  const isService = /service|consult|agency|local/i.test(category);
  if (isService) {
    return [...filtered]
      .sort((a, b) => {
        const aScore = /sales|outbound|customer|referral/i.test(a.title) ? 0 : 1;
        const bScore = /sales|outbound|customer|referral/i.test(b.title) ? 0 : 1;
        return aScore - bScore;
      })
      .slice(0, count);
  }
  return [...filtered].slice(0, count);
}

function newId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function buildSubtasks(titles: string[]): ExecutionTask['subtasks'] {
  return titles.map((title) => ({
    id: newId('sub'),
    title,
    status: 'queued' as const,
  }));
}

function buildTaskFromDirective(
  directive: ContinuousDirective,
): ExecutionTask {
  return {
    id: newId('ct'),
    phaseId: 'continuous',
    title: directive.title,
    assignee: directive.assignee,
    department: directive.department,
    status: 'queued',
    subtasks: buildSubtasks([]),
    dependencies: [],
    startedAt: Date.now(),
  };
}

/**
 * Generate the next batch of CEO directives. The CEO uses the LLM to:
 * 1. Read the full business profile (category, stage, target customer, value prop, pricing, etc.)
 * 2. Read what has been delivered (recent tasks, recent deliverables, recent directives)
 * 3. Reason about what the highest-leverage next move is for THIS specific business
 * 4. Produce 3-4 directives, each with a specific department + agent
 *
 * Falls back to the curated template list if the LLM is unavailable.
 */
export async function generateNextDirectives(
  companyId: string,
): Promise<ContinuousDirective[]> {
  const state = getCompanyState(companyId);
  const execution = state.execution;
  const profile = getBusinessProfile(companyId);
  const memory = getMemorySnapshot(companyId);

  const recentTitles = new Set<string>();
  const directives = execution?.continuousDirectives ?? [];
  for (const d of directives.slice(-20)) recentTitles.add(d.title);

  // Try LLM-driven reasoning first
  try {
    const llmDirectives = await askCeoForDirectives(
      profile,
      execution,
      memory,
      recentTitles,
    );
    if (llmDirectives.length > 0) {
      return llmDirectives;
    }
  } catch (err) {
    console.error('[continuousOps] CEO reasoning fallback to templates:', err);
  }

  // Fallback: template rotation by category
  const category = profile?.category ?? 'Other';
  const templates = pickDirectiveTemplates(DIRECTIVES_PER_ROUND, recentTitles, category);
  const now = Date.now();
  return templates.map((t) => ({
    id: newId('dir'),
    title: t.title,
    rationale: t.rationale,
    department: t.department,
    assignee: t.assignee,
    createdAt: now,
    status: 'pending',
  }));
}

interface CeoDirectiveIdea {
  title: string;
  rationale: string;
  department: string;
  assignee: string;
  expectedOutcome: string;
}

async function askCeoForDirectives(
  profile: ReturnType<typeof getBusinessProfile>,
  execution: ExecutionGraph | null,
  memory: ReturnType<typeof getMemorySnapshot>,
  recentTitles: Set<string>,
): Promise<ContinuousDirective[]> {
  if (!profile) return [];

  const businessSummary = `
Business: ${profile.businessName}
Category: ${profile.category}
Stage: ${profile.stage}
Description: ${profile.description}
Problem we solve: ${profile.problem}
Our solution: ${profile.solution}
Target customer: ${profile.targetCustomer}
Unique advantage: ${profile.uniqueAdvantage}
Country: ${profile.country}
Industry: ${profile.industry}
Budget: $${profile.budget}/mo
Team type: ${profile.teamType}, size ${profile.teamSize}
Revenue range: ${profile.revenueRange}
Main products: ${profile.mainProducts}
Main services: ${profile.mainServices}
Current goals: ${profile.currentGoals}
Current problems: ${profile.currentProblems}
Highest priority action (per CEO): ${profile.contexts?.highestPriorityAction}
`.trim();

  const completedPhases = (execution?.phases ?? [])
    .filter((p) => p.status === 'completed')
    .map((p) => p.name);
  const lastDirectives = (execution?.continuousDirectives ?? [])
    .slice(-6)
    .map((d) => `${d.status === 'completed' ? '✓' : '⏳'} ${d.title} (${d.department})`);
  const lastDeliverables = (execution?.deliverables ?? [])
    .slice(0, 6)
    .map((d) => `• ${d.title}`);
  const memoryHighlights = [
    ...(memory?.strategic ?? []).slice(0, 4),
    ...(memory?.operational ?? []).slice(0, 4),
    ...(memory?.learning ?? []).slice(0, 3),
  ];

  const avoidList = Array.from(recentTitles).slice(0, 12);

  const systemPrompt = `You are the CEO of ${profile.businessName}. You deeply understand THIS specific business — its category, stage, target customer, value prop, pricing, and operating constraints. You are NOT giving generic startup advice. You are deciding what the founder's team should do NEXT, in the next ~15 minutes of autonomous work, to drive real revenue / customers / launch progress.

Rules:
1. Every directive must point to revenue, customers, or launch progress. No "build brand" or "post on social" if the offer isn't selling yet.
2. Each directive must be specific to THIS business, not generic.
3. Each directive names exactly one department and one agent role.
4. Avoid any directive titles in the AVOID list (already done recently).
5. Output ONLY valid JSON in the format specified. No prose, no markdown fences.`;

  const userPrompt = `Business context:
${businessSummary}

Completed launch phases: ${completedPhases.join(', ') || 'none yet'}

Recent deliverables:
${lastDeliverables.join('\n') || 'none'}

Recent directives (so we don't repeat them):
${lastDirectives.join('\n') || 'none'}

Memory highlights from the team's prior work:
${memoryHighlights.join('\n') || 'none'}

DO NOT repeat any of these:
${avoidList.map((t) => `- ${t}`).join('\n')}

Decide the ${DIRECTIVES_PER_ROUND} highest-leverage next directives for THIS business. For each, write a one-sentence rationale that explains the business reasoning (not generic motivation). Return JSON:

{
  "directives": [
    {
      "title": "Action verb + specific deliverable (e.g. 'Send 30 personalized cold emails to SaaS CTOs in fintech identified in research')",
      "rationale": "One sentence grounded in THIS business's situation and what was just delivered.",
      "department": "Marketing Department" | "Sales Department" | "Growth Department" | "Customer Success Department" | "Product Department" | "Operations Department" | "Executive Layer",
      "assignee": "<role> Agent (e.g. 'Sales Manager Agent', 'Marketing Manager Agent', 'CEO Agent', 'Copywriter Agent', 'Growth Manager Agent', 'Product Manager Agent', 'Customer Success Agent', 'Operations Manager Agent')",
      "expectedOutcome": "What success looks like in measurable terms (e.g. '5 booked demos', '20% lift in landing-page conversion', '3 paying customers onboarded')."
    }
  ]
}`;

  const model = resolveModelForExecutive('CEO');
  const messages: NimMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ];

  const text = await nimChatCompletion({
    model,
    messages,
    temperature: 0.55,
    maxTokens: 1800,
  });
  if (!text) return [];

  const parsed = parseJsonFromLlm<{ directives: CeoDirectiveIdea[] }>(text);
  if (!Array.isArray(parsed?.directives)) return [];

  const now = Date.now();
  return parsed.directives
    .filter((d) => d?.title && d?.department && d?.assignee)
    .map((d) => ({
      id: newId('dir'),
      title: String(d.title).slice(0, 160),
      rationale: String(d.rationale || '').slice(0, 400),
      department: String(d.department),
      assignee: String(d.assignee),
      createdAt: now,
      status: 'pending' as const,
    }));
}

/**
 * Materialize a set of directives as ExecutionTasks on the bus. Called
 * once per round. Returns the new tasks so they can be added to the
 * execution graph's continuousTasks.
 */
export function deployDirectivesAsTasks(
  companyId: string,
  directives: ContinuousDirective[],
): ExecutionTask[] {
  const state = getCompanyState(companyId);
  const execution = state.execution;
  if (!execution) return [];

  const tasks: ExecutionTask[] = [];
  for (const d of directives) {
    const task = buildTaskFromDirective(d);
    task.subtasks = buildSubtasks(
      pickSubtasksForDirective(d.title),
    );
    task.subtasks[0].status = 'running';
    task.status = 'running';
    tasks.push(task);
    assignTask(companyId, {
      title: task.title,
      assignee: task.assignee,
      department: task.department,
      project: execution.objective,
      fromAgent: 'CEO Agent',
    });
    d.status = 'running';
  }
  return tasks;
}

function pickSubtasksForDirective(title: string): string[] {
  const t = DIRECTIVE_TEMPLATES.find((x) => x.title === title);
  if (t) return t.subs;
  return ['Plan the work', 'Execute', 'Verify and report'];
}

/**
 * Decide whether it's time to spawn a new round of directives.
 * Rule: at least MIN_SECONDS_BETWEEN_ROUNDS seconds since the last round
 * AND at least one task from the previous round has completed.
 */
export function shouldSpawnNextRound(execution: ExecutionGraph): boolean {
  if (!execution.continuousMode) return false;
  const directives = execution.continuousDirectives ?? [];
  if (directives.length === 0) return true;

  const lastDirective = directives[directives.length - 1];
  const elapsed = (Date.now() - lastDirective.createdAt) / 1000;
  if (elapsed < MIN_SECONDS_BETWEEN_ROUNDS) return false;

  const tasks = execution.continuousTasks ?? [];
  const completedCount = tasks.filter((t) => t.status === 'completed').length;
  const runningCount = tasks.filter((t) => t.status === 'running').length;

  // Always spawn if nothing is running and we have very few tasks
  if (runningCount === 0 && completedCount > 0) return true;
  // Spawn once at least 2 tasks have completed
  if (completedCount >= 2) return true;
  return false;
}

/**
 * Spawn the next round of directives. Called from tickExecution when
 * shouldSpawnNextRound is true. The CEO call is async (LLM); we don't
 * block the engine tick — directives appear on the next refresh.
 */
export function spawnNextRound(companyId: string): void {
  const state = getCompanyState(companyId);
  const execution = state.execution;
  if (!execution) return;

  const round = (execution.continuousRound ?? 0) + 1;
  appendEvent(companyId, {
    type: 'agent_action',
    fromAgent: 'CEO Agent',
    department: 'Executive Layer',
    message: `Round ${round}: CEO is reasoning about the next highest-leverage moves for ${state.execution.objective}...`,
    payload: { round },
  });

  void (async () => {
    try {
      const nextDirectives = await generateNextDirectives(companyId);
      const newTasks = deployDirectivesAsTasks(companyId, nextDirectives);

      const latest = getCompanyState(companyId).execution;
      if (!latest) return;
      const previousDirectives = latest.continuousDirectives ?? [];
      const previousTasks = latest.continuousTasks ?? [];

      updateCompanyState(companyId, (s) => ({
        ...s,
        execution: {
          ...s.execution!,
          continuousDirectives: [...previousDirectives, ...nextDirectives],
          continuousTasks: [...previousTasks, ...newTasks],
          continuousRound: round,
        },
      }));

      appendEvent(companyId, {
        type: 'agent_action',
        fromAgent: 'CEO Agent',
        department: 'Executive Layer',
        message: `Round ${round}: CEO directed ${nextDirectives.length} new brand operations across ${new Set(nextDirectives.map((d) => d.department)).size} departments.`,
        payload: { round, directiveTitles: nextDirectives.map((d) => d.title) },
      });

      writeMemory(companyId, {
        type: 'operational',
        content: `Continuous ops round ${round}: ${nextDirectives.map((d) => d.title).join('; ')}.`,
        agent: 'CEO Agent',
      });
    } catch (err) {
      console.error('[continuousOps] spawnNextRound failed:', err);
    }
  })();
}

/**
 * Enter continuous mode. Called when the last phase completes and
 * autoRunAll is true. Initializes the directives + tasks arrays.
 * The first round is generated asynchronously (CEO LLM call).
 */
export function enterContinuousMode(companyId: string): void {
  const state = getCompanyState(companyId);
  const execution = state.execution;
  if (!execution) return;

  updateCompanyState(companyId, (s) => ({
    ...s,
    execution: {
      ...s.execution!,
      continuousMode: true,
      continuousRound: 1,
      status: 'running',
      continuousDirectives: [],
      continuousTasks: [],
    },
  }));

  appendEvent(companyId, {
    type: 'workflow_step',
    fromAgent: 'CEO Agent',
    department: 'Executive Layer',
    message: `Continuous brand operations engaged — CEO is analyzing the business and the work delivered so far to decide the first round of directives.`,
    payload: {},
  });

  void (async () => {
    try {
      const firstDirectives = await generateNextDirectives(companyId);
      const firstTasks = deployDirectivesAsTasks(companyId, firstDirectives);

      const latest = getCompanyState(companyId).execution;
      if (!latest) return;
      updateCompanyState(companyId, (s) => ({
        ...s,
        execution: {
          ...s.execution!,
          continuousDirectives: [...(s.execution?.continuousDirectives ?? []), ...firstDirectives],
          continuousTasks: [...(s.execution?.continuousTasks ?? []), ...firstTasks],
        },
      }));

      appendEvent(companyId, {
        type: 'workflow_step',
        fromAgent: 'CEO Agent',
        department: 'Executive Layer',
        message: `CEO round 1 directives issued (${firstDirectives.length} tasks) based on the business profile and recent deliverables.`,
        payload: { directiveTitles: firstDirectives.map((d) => d.title) },
      });

      writeMemory(companyId, {
        type: 'strategic',
        content: `CEO round 1 continuous-ops directives: ${firstDirectives.map((d) => `${d.title} (${d.department})`).join('; ')}.`,
        agent: 'CEO Agent',
      });
    } catch (err) {
      console.error('[continuousOps] enterContinuousMode initial round failed:', err);
    }
  })();
}

/**
 * Tick the continuous task list. Mirrors the phase-tick logic but
 * iterates only the continuous tasks array.
 */
export function tickContinuousTasks(
  execution: ExecutionGraph,
  taskRollupStatus: (subs: ExecutionTask['subtasks']) => ExecutionTask['status'],
  companyId: string,
): {
  tasks: ExecutionTask[];
  directives: ContinuousDirective[];
  deliverables: ExecutionGraph['deliverables'];
  completed: number;
} {
  let tasks = [...(execution.continuousTasks ?? [])];
  const directives = [...(execution.continuousDirectives ?? [])];
  const deliverables = [...execution.deliverables];
  let completed = 0;

  for (const task of tasks) {
    if (task.status === 'completed' || task.status === 'blocked') continue;

    const sub = task.subtasks.find((s) => s.status === 'running');
    if (sub) {
      sub.status = 'completed';
      const nextQueued = task.subtasks.find((s) => s.status === 'queued');
      if (nextQueued) {
        nextQueued.status = 'running';
      } else {
        task.status = 'completed';
        task.completedAt = Date.now();
        completed++;

        const matching = directives.find((d) => d.title === task.title);
        if (matching) {
          matching.status = 'completed';
          matching.completedAt = Date.now();
          matching.outputSummary = `Delivered by ${task.assignee} (${task.department}): ${task.subtasks.map((s) => s.title).join('; ')}.`;
        }

        deliverables.unshift({
          id: newId('del'),
          phaseId: 'continuous',
          title: task.title,
          summary: `CEO directive complete: ${task.title}. ${task.subtasks.map((s) => s.title).join(' · ')}`,
          agent: task.department,
          createdAt: Date.now(),
        });
      }
      task.status = taskRollupStatus(task.subtasks);
    } else {
      const first = task.subtasks.find((s) => s.status === 'queued');
      if (first) {
        first.status = 'running';
      }
    }
  }

  return { tasks, directives, deliverables, completed };
}
