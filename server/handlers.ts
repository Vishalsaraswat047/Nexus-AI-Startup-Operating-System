import { GoogleGenAI } from '@google/genai';
import {
  resolveModelForAgent,
  resolveModelForExecutive,
  resolveModelForGoalDecomposition,
  resolveModelForTwinGeneration,
} from './agentModels';
import { getNimConfig, nimChatCompletion, parseJsonFromLlm, type NimMessage } from './nimClient';

function getGeminiClient(customHeaderKey?: string): GoogleGenAI | null {
  if (customHeaderKey && customHeaderKey.trim() !== '' && customHeaderKey !== 'MY_GEMINI_API_KEY') {
    return new GoogleGenAI({ apiKey: customHeaderKey.trim() });
  }
  const key = process.env.GEMINI_API_KEY;
  if (key && key !== 'MY_GEMINI_API_KEY') {
    return new GoogleGenAI({ apiKey: key });
  }
  return null;
}

async function llmText(
  model: string,
  messages: NimMessage[],
  geminiClient: GoogleGenAI | null,
  geminiSystem?: string,
): Promise<string> {
  if (getNimConfig()) {
    try {
      return await nimChatCompletion({ model, messages, maxTokens: 4096 });
    } catch (err) {
      console.error('NIM request failed, trying Gemini fallback:', err);
    }
  }
  if (!geminiClient) throw new Error('No AI provider configured (set NVIDIA_API_KEY or GEMINI_API_KEY)');
  const contents = messages
    .filter((m) => m.role !== 'system')
    .map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));
  const response = await geminiClient.models.generateContent({
    model: 'gemini-2.0-flash',
    contents,
    config: geminiSystem ? { systemInstruction: geminiSystem } : undefined,
  });
  return response.text || '';
}

export function buildOfflineTwin(body: Record<string, unknown>) {
  const name = String(body.name || 'SaaS Venture');
  const industry = String(body.industry || 'Technology');
  const goalsRaw = String(body.goals || '');
  const generatedTwin = {
    name,
    industry,
    website: String(body.website || 'https://example.com'),
    stage: String(body.stage || 'Idea'),
    teamSize: Number(body.teamSize) || 1,
    revenue: Number(body.revenue) || 0,
    expenses: Number(body.expenses) || 0,
    budget: Number(body.budget) || 1000,
    customers: Number(body.customers) || 0,
    funding: String(body.funding || 'Bootstrap'),
    goals: goalsRaw.includes(',')
      ? goalsRaw.split(',').map((g: string) => g.trim())
      : [goalsRaw || 'Launch MVP'],
    challenges: String(body.challenges || '')
      .split(',')
      .map((c: string) => c.trim())
      .filter(Boolean),
    tools: String(body.tools || '')
      .split(',')
      .map((t: string) => t.trim())
      .filter(Boolean),
    health: 85,
  };

  const generatedMilestones = [
    {
      id: 'ms-1',
      name: 'Market Research & Competitive Intelligence',
      project: 'Research',
      status: 'in_progress' as const,
      progress: 0,
      tasks: [
        {
          id: 't-1-1',
          name: 'Detail target customer personas',
          assignee: 'Market Research Agent',
          status: 'todo' as const,
          weight: 30,
        },
        {
          id: 't-1-2',
          name: 'Map competitor feature sets',
          assignee: 'Competitor Analysis Agent',
          status: 'todo' as const,
          weight: 40,
        },
      ],
      dependencies: [],
    },
    {
      id: 'ms-2',
      name: generatedTwin.goals[0] || 'Primary strategic objective',
      project: 'Product',
      status: 'pending' as const,
      progress: 0,
      tasks: [
        {
          id: 't-2-1',
          name: 'Draft PRD from CEO directive',
          assignee: 'Product Manager Agent',
          status: 'todo' as const,
          weight: 50,
        },
        {
          id: 't-2-2',
          name: 'Architecture review',
          assignee: 'Software Architect Agent',
          status: 'todo' as const,
          weight: 50,
        },
      ],
      dependencies: ['ms-1'],
    },
  ];

  const generatedRisks = [
    {
      id: 'r-1',
      category: 'Budget' as const,
      severity: (generatedTwin.budget < 2000 ? 'high' : 'medium') as const,
      title: 'Runway monitoring',
      description: `Monthly burn vs budget $${generatedTwin.budget} requires active CFO oversight.`,
      status: 'monitoring' as const,
      actionTaken: 'CFO Agent scheduled weekly burn review.',
    },
  ];

  const generatedInsights = [
    {
      id: 'in-1',
      category: 'strategy' as const,
      title: `Focus for ${name}`,
      text: `Prioritize ${generatedTwin.goals[0]} while in ${generatedTwin.stage} stage.`,
      impactScore: 90,
    },
  ];

  return { twin: generatedTwin, milestones: generatedMilestones, risks: generatedRisks, insights: generatedInsights };
}

export async function generateTwin(body: Record<string, unknown>, customGeminiKey?: string) {
  const offline = buildOfflineTwin(body);
  const model = resolveModelForTwinGeneration();
  const gemini = getGeminiClient(customGeminiKey);

  const prompt = `Create a Business Digital Twin JSON for:
Name: ${body.name}, Industry: ${body.industry}, Stage: ${body.stage}
Budget: $${body.budget}/mo, Revenue: $${body.revenue}, Goals: ${body.goals}
Challenges: ${body.challenges}, Tools: ${body.tools}

Return ONLY valid JSON: { "twin": {...}, "milestones": [...], "risks": [...], "insights": [...] }
Use real agent names like Market Research Agent, CEO Agent, Backend Agent for task assignees.
Goals array must reflect the user's stated goals exactly.`;

  try {
    const text = await llmText(model, [{ role: 'user', content: prompt }], gemini);
    const parsed = parseJsonFromLlm<typeof offline>(text);
    if (parsed.twin?.name) return parsed;
    return offline;
  } catch {
    return { ...offline, note: 'Offline synthesis (configure NVIDIA_API_KEY in .env)' };
  }
}

export async function executiveChat(
  character: string,
  message: string,
  history: Array<{ role: string; text: string }>,
  twinContext: Record<string, unknown>,
  customGeminiKey?: string,
) {
  const directives: Record<string, string> = {
    CEO: `You are the CEO Agent. You NEVER perform operational work. You ONLY: understand goals, create company objectives, define KPIs, set strategic direction, choose departments, and set priorities. Always tell the founder their directive will be logged as a CEO objective and handed to the COO for execution. Do not write code, create accounts, or execute tasks.`,
    COO: `You are the COO Agent. You convert CEO objectives into execution: projects, milestones, dependencies, task graphs, agent assignments, resource allocations, and execution plans. You do not set company vision—that is the CEO. Reference live metrics and task bus status when available.`,
    CTO: 'You are the CTO. Focus on engineering, architecture, and technical delivery.',
    CMO: 'You are the CMO. Focus on growth, marketing, and customer acquisition.',
    CFO: 'You are the CFO. Focus on runway, burn rate, and budget.',
  };

  const system = `${directives[character] || directives.CEO}
Company: ${twinContext?.name}, Industry: ${twinContext?.industry}, Stage: ${twinContext?.stage}
Budget: $${twinContext?.budget}/mo, Revenue: $${twinContext?.revenue}, Expenses: $${twinContext?.expenses}
Goals: ${JSON.stringify(twinContext?.goals || [])}
When the founder asks to set a goal, respond with a clear actionable goal and say you are logging it to the strategic roadmap.`;

  const messages: NimMessage[] = [
    { role: 'system', content: system },
    ...history.map((h) => ({
      role: (h.role === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
      content: h.text,
    })),
    { role: 'user', content: message },
  ];

  const model = resolveModelForExecutive(character);
  const gemini = getGeminiClient(customGeminiKey);

  try {
    const text = await llmText(model, messages, gemini, system);
    return { text, model };
  } catch {
    return {
      text: `[${character} Agent] Operating on ${twinContext?.name} (${twinContext?.stage}). Runway and goals are synced. What should we prioritize next?`,
      model: 'offline',
    };
  }
}

export async function decomposeGoal(goalInput: string, twinContext: Record<string, unknown>, customGeminiKey?: string) {
  const model = resolveModelForGoalDecomposition();
  const assignee = resolveModelForAgent('Task Decomposer Agent', 'Autonomous Control Unit');
  const fallback = {
    milestone: {
      id: `ms-${Date.now()}`,
      name: goalInput,
      project: 'Strategic',
      status: 'pending' as const,
      progress: 0,
      tasks: [
        {
          id: `t-${Date.now()}-1`,
          name: `Plan: ${goalInput}`,
          assignee: 'Goal Manager Agent',
          status: 'todo' as const,
          weight: 50,
        },
        {
          id: `t-${Date.now()}-2`,
          name: `Execute: ${goalInput}`,
          assignee: 'Planner Agent',
          status: 'todo' as const,
          weight: 50,
        },
      ],
      dependencies: [],
    },
  };

  const prompt = `Decompose this CEO/strategic goal into ONE milestone JSON for ${twinContext?.name}:
"${goalInput}"
Return ONLY JSON: { "milestone": { id, name, project, status, progress, tasks: [{id,name,assignee,status,weight}], dependencies } }
Use agent names from Nexus workforce (Market Research Agent, Backend Agent, etc).`;

  const gemini = getGeminiClient(customGeminiKey);
  try {
    const text = await llmText(model, [{ role: 'user', content: prompt }], gemini);
    return parseJsonFromLlm(fallback);
  } catch {
    return fallback;
  }
}

export function getAgentModelInfo(agentName: string, department?: string) {
  const modelId = resolveModelForAgent(agentName, department);
  return { agentName, modelId, department };
}
