import { nimChatCompletion, type NimMessage } from '../nimClient';
import { resolveModelForAgent } from '../agentModels';
import { writeMemory } from './memoryOps';
import { appendEvent, logAgentAction } from './eventLog';
import { getCompanyState } from './store';

export type AgentStatus = 'idle' | 'queued' | 'running' | 'blocked' | 'waiting_approval' | 'completed' | 'failed';

export interface AgentTaskOutput {
  taskId: string;
  agentId: string;
  status: 'completed' | 'failed';
  output: string;
  findings: Record<string, unknown>;
  completedAt: number;
}

export interface AgentExecutionRequest {
  taskId: string;
  agentId: string;
  agentName: string;
  taskTitle: string;
  subtaskTitle: string;
  context: {
    objective: string;
    location: string;
    targetCustomers: string;
    category: string;
    phase: string;
    existingFindings?: Record<string, unknown>;
  };
}

const AGENT_SYSTEM_PROMPTS: Record<string, string> = {
  'Market Research Agent': `You are a Market Research Agent. Your job is to conduct thorough market research for a new business launch.

When given a research task, you must:
1. Analyze the business objective, location, and target customers
2. Provide specific, actionable findings - NOT generic advice
3. Return structured data with real numbers, names, and specifics where possible
4. If you don't have real data, provide realistic estimates based on typical market conditions

Always return JSON with this structure:
{
  "findings": {
    "key_insight": "specific finding",
    "data_points": ["specific data point 1", "specific data point 2"],
    "recommendations": ["specific recommendation 1", "specific recommendation 2"]
  },
  "confidence": "high|medium|low",
  "reasoning": "why this finding is relevant"
}`,

  'Competitor Analysis Agent': `You are a Competitor Analysis Agent. Your job is to identify and analyze competitors for a new business.

When analyzing competitors, you must:
1. Identify 5-10 specific competitors in the target location
2. Analyze their pricing, services, positioning
3. Find gaps and opportunities
4. Return structured findings with specific names and data

Always return JSON with this structure:
{
  "findings": {
    "competitors": [
      {
        "name": "Competitor Name",
        "pricing": "₹XXX for basic service",
        "positioning": "target customer segment",
        "strengths": ["strength 1", "strength 2"],
        "weaknesses": ["weakness 1", "weakness 2"]
      }
    ],
    "market_gaps": ["specific gap 1", "specific gap 2"],
    "opportunities": ["specific opportunity 1", "specific opportunity 2"],
    "average_pricing": "₹XXX-₹XXX range"
  },
  "confidence": "high|medium|low"
}`,

  'Pricing Research Agent': `You are a Pricing Research Agent. Your job is to research and recommend pricing for a new business.

When researching pricing, you must:
1. Analyze competitor pricing in the target market
2. Consider cost structure and margin requirements
3. Recommend specific price points with rationale
4. Provide tiered pricing options if appropriate

Always return JSON with this structure:
{
  "findings": {
    "competitor_pricing": {
      "basic": "₹XXX",
      "premium": "₹XXX",
      "notes": "what's included"
    },
    "recommended_pricing": {
      "entry": { "price": "₹XXX", "includes": "what's included", "rationale": "why" },
      "core": { "price": "₹XXX", "includes": "what's included", "rationale": "why" },
      "premium": { "price": "₹XXX", "includes": "what's included", "rationale": "why" }
    },
    "margin_analysis": {
      "cost_per_unit": "₹XXX",
      "margin_percentage": "XX%",
      "payback_period": "X months"
    }
  },
  "confidence": "high|medium|low"
}`,

  'Trend Research Agent': `You are a Trend Research Agent. Your job is to identify trends and opportunities for a new business.

When researching trends, you must:
1. Identify relevant market trends in the target location
2. Analyze customer acquisition channels
3. Find partnership and growth opportunities
4. Return specific, actionable trend data

Always return JSON with this structure:
{
  "findings": {
    "market_trends": [
      { "trend": "specific trend", "impact": "high|medium|low", "opportunity": "what it means" }
    ],
    "acquisition_channels": [
      { "channel": "channel name", "cac_estimate": "₹XXX", "conversion_rate": "X%", "notes": "specifics" }
    ],
    "partnership_opportunities": ["specific partner type 1", "specific partner type 2"],
    "seasonality": "any seasonal patterns"
  },
  "confidence": "high|medium|low"
}`,

  'Legal Research Agent': `You are a Legal Research Agent. Your job is to identify legal and compliance requirements for a new business.

When researching legal requirements, you must:
1. Identify required licenses and permits
2. Note compliance requirements
3. Identify insurance needs
4. Return specific requirements for the location and industry

Always return JSON with this structure:
{
  "findings": {
    "required_licenses": ["license 1", "license 2"],
    "permits": ["permit 1", "permit 2"],
    "compliance_requirements": ["requirement 1", "requirement 2"],
    "insurance_needs": ["insurance type 1", "insurance type 2"],
    "estimated_timeline": "X-X weeks for setup",
    "estimated_cost": "₹XXXXX"
  },
  "confidence": "high|medium|low"
}`,

  'Finance Planner Agent': `You are a Finance Planner Agent. Your job is to plan finances and unit economics for a new business.

When planning finances, you must:
1. Define revenue model and streams
2. Calculate cost structure
3. Project break-even timeline
4. Provide specific numbers based on market research

Always return JSON with this structure:
{
  "findings": {
    "revenue_model": "description of revenue streams",
    "cost_structure": {
      "fixed_costs": "₹XXXXX/month",
      "variable_costs": "₹XXX per unit",
      "total_initial_investment": "₹XXXXX"
    },
    "unit_economics": {
      "price_per_unit": "₹XXX",
      "cost_per_unit": "₹XXX",
      "gross_margin": "XX%"
    },
    "break_even": {
      "units_per_month": XXX,
      "timeline_months": X
    },
    "runway_months": X
  },
  "confidence": "high|medium|low"
}`,

  'Operations Manager Agent': `You are an Operations Manager Agent. Your job is to design operational workflows for a new business.

When designing operations, you must:
1. Define the service delivery workflow
2. Identify required tools and systems
3. Plan vendor/supplier requirements
4. Provide specific SOP steps

Always return JSON with this structure:
{
  "findings": {
    "delivery_workflow": ["Step 1", "Step 2", "Step 3"],
    "required_tools": ["tool 1", "tool 2"],
    "required_vendors": ["vendor type 1", "vendor type 2"],
    "quality_gates": ["gate 1", "gate 2"],
    "timeline_to_operations": "X weeks"
  },
  "confidence": "high|medium|low"
}`,

  'Growth Agent': `You are a Growth Agent. Your job is to plan customer acquisition and growth strategies.

When planning growth, you must:
1. Identify acquisition channels with specific CAC estimates
2. Design lead magnet and nurture strategies
3. Plan referral and partnership programs
4. Define metrics and review cycles

Always return JSON with this structure:
{
  "findings": {
    "channel_strategy": [
      {
        "channel": "channel name",
        "cac": "₹XXX",
        "conversion_rate": "X%",
        "budget_allocation": "XX%",
        "test_timeline": "X weeks"
      }
    ],
    "lead_magnet": "specific lead magnet idea",
    "referral_program": "specific program design",
    "kpis": ["KPI 1", "KPI 2"],
    "review_cycle": "weekly|monthly"
  },
  "confidence": "high|medium|low"
}`,

  'CEO Agent': `You are the CEO Agent. Your job is to orchestrate the business launch, not execute tasks yourself.

When CEO Agent receives updates, you must:
1. Review agent findings and provide strategic guidance
2. Identify blockers and opportunities
3. Recommend next actions based on completed work
4. Never try to do research or operational work - delegate to specialized agents

Always return JSON with this structure:
{
  "findings": {
    "strategic_guidance": "specific guidance based on findings",
    "blockers": ["blocker 1", "blocker 2"],
    "opportunities": ["opportunity 1", "opportunity 2"],
    "next_recommendations": ["recommendation 1", "recommendation 2"]
  },
  "confidence": "high|medium|low"
}`,
};

const DEFAULT_AGENT_PROMPT = `You are a specialized business agent. Your job is to complete your assigned task thoroughly and return structured findings.

When completing a task, you must:
1. Analyze the context provided
2. Provide specific, actionable findings - NOT generic advice
3. Return structured data with real specifics where possible
4. If you don't have real data, provide realistic estimates based on typical market conditions

Always return JSON with this structure:
{
  "findings": {
    "key_insight": "specific finding",
    "data_points": ["specific data point 1", "specific data point 2"],
    "recommendations": ["specific recommendation 1", "specific recommendation 2"]
  },
  "confidence": "high|medium|low",
  "reasoning": "why this finding is relevant"
}`;

function buildExecutionPrompt(req: AgentExecutionRequest): string {
  const { agentName, taskTitle, subtaskTitle, context } = req;

  let contextSection = `
BUSINESS CONTEXT:
- Objective: ${context.objective}
- Location: ${context.location}
- Target Customers: ${context.targetCustomers}
- Industry: ${context.category}
- Current Phase: ${context.phase}
`;

  if (context.existingFindings && Object.keys(context.existingFindings).length > 0) {
    contextSection += `\nPREVIOUS FINDINGS FROM THIS PHASE:\n${JSON.stringify(context.existingFindings, null, 2)}`;
  }

  return `Task: ${subtaskTitle}
${contextSection}

Please conduct research and return structured findings in JSON format. Be specific and actionable - no generic advice.`;
}

export async function executeAgentTask(
  companyId: string,
  req: AgentExecutionRequest,
): Promise<AgentTaskOutput> {
  const { taskId, agentId, agentName, subtaskTitle, context } = req;
  const startTime = Date.now();

  logAgentAction(companyId, agentName, getDepartmentForAgent(agentName), `Starting: ${subtaskTitle}`);

  appendEvent(companyId, {
    type: 'agent_action',
    fromAgent: agentName,
    department: getDepartmentForAgent(agentName),
    message: `Executing: ${subtaskTitle}`,
    payload: { taskId, agentId, phase: context.phase },
  });

  try {
    const model = resolveModelForAgent(agentName);

    const systemPrompt = AGENT_SYSTEM_PROMPTS[agentName] || DEFAULT_AGENT_PROMPT;

    const messages: NimMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: buildExecutionPrompt(req) },
    ];

    const maxTokens = 2048;
    const temperature = 0.4;

    let output = '';
    let findings: Record<string, unknown> = {};

    try {
      output = await nimChatCompletion({ model, messages, maxTokens, temperature });

      try {
        const jsonMatch = output.match(/```json\s*([\s\S]*?)\s*```/) ||
                          output.match(/```\s*([\s\S]*?)\s*```/) ||
                          output.match(/(\{[\s\S]*\})/);

        if (jsonMatch) {
          const jsonStr = jsonMatch[1] || jsonMatch[0];
          const parsed = JSON.parse(jsonStr.trim());
          findings = parsed.findings || parsed;
        } else {
          findings = { raw_output: output, parsed_manually: true };
        }
      } catch {
        findings = { raw_output: output, parse_error: true };
      }
    } catch (llmError) {
      output = `LLM execution completed with issues: ${llmError instanceof Error ? llmError.message : 'Unknown error'}`;
      findings = {
        error: llmError instanceof Error ? llmError.message : 'Unknown error',
        fallback: true,
      };
    }

    const completedAt = Date.now();
    const duration = completedAt - startTime;

    logAgentAction(
      companyId,
      agentName,
      getDepartmentForAgent(agentName),
      `Completed: ${subtaskTitle} (${Math.round(duration / 1000)}s)`,
    );

    writeMemory(companyId, {
      type: 'operational',
      content: `${agentName} completed "${subtaskTitle}": ${JSON.stringify(findings).slice(0, 500)}`,
      agent: agentName,
    });

    return {
      taskId,
      agentId,
      status: 'completed',
      output,
      findings,
      completedAt,
    };
  } catch (error) {
    const completedAt = Date.now();

    logAgentAction(
      companyId,
      agentName,
      getDepartmentForAgent(agentName),
      `Failed: ${subtaskTitle} - ${error instanceof Error ? error.message : 'Unknown error'}`,
    );

    writeMemory(companyId, {
      type: 'failure',
      content: `${agentName} failed on "${subtaskTitle}": ${error instanceof Error ? error.message : 'Unknown error'}`,
      agent: agentName,
    });

    return {
      taskId,
      agentId,
      status: 'failed',
      output: error instanceof Error ? error.message : 'Unknown error',
      findings: { error: error instanceof Error ? error.message : 'Unknown error' },
      completedAt,
    };
  }
}

export function getDepartmentForAgent(agentName: string): string {
  const deptMap: Record<string, string> = {
    'Market Research Agent': 'Research Division',
    'Competitor Analysis Agent': 'Research Division',
    'Pricing Research Agent': 'Financial Control',
    'Trend Research Agent': 'Growth & Marketing',
    'Legal Research Agent': 'Legal & Policy',
    'Finance Planner Agent': 'Financial Control',
    'Operations Manager Agent': 'Autonomous Control Unit',
    'Growth Agent': 'Growth & Marketing',
    'CEO Agent': 'Executive Layer',
    'Marketing Manager Agent': 'Growth & Marketing',
    'Content Agent': 'Design Studio',
    'UI Designer Agent': 'Design Studio',
    'Social Media Agent': 'Growth & Marketing',
    'Copywriting Agent': 'Design Studio',
    'Software Architect Agent': 'Engineering Core',
    'Frontend Agent': 'Engineering Core',
    'DevOps Agent': 'Engineering Core',
    'Automation Agent': 'Autonomous Control Unit',
    'User Research Agent': 'Research Division',
    'Industry Intelligence Agent': 'Research Division',
    'Local Presence Agent': 'Growth & Marketing',
  };

  return deptMap[agentName] || 'Executive Layer';
}

export interface RunningAgentTask {
  taskId: string;
  agentId: string;
  agentName: string;
  startedAt: number;
  subtaskId: string;
}

const runningTasks = new Map<string, RunningAgentTask>();

export function trackAgentTask(taskId: string, info: RunningAgentTask): void {
  runningTasks.set(taskId, info);
}

export function getRunningAgentTasks(): RunningAgentTask[] {
  return Array.from(runningTasks.values());
}

export function removeAgentTask(taskId: string): void {
  runningTasks.delete(taskId);
}

export function getAgentTaskStatus(taskId: string): RunningAgentTask | undefined {
  return runningTasks.get(taskId);
}