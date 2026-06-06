/** NVIDIA NIM model IDs (integrate.api.nvidia.com/v1) */

export const NIM_MODELS = {
  deepseekV4Pro: 'deepseek-ai/deepseek-v4-pro',
  deepseekV32: 'deepseek-ai/deepseek-v3.2',
  kimiK2Thinking: 'moonshotai/kimi-k2-thinking',
  kimiK26: 'moonshotai/kimi-k2.6',
  qwen3Coder480B: 'qwen/qwen3-coder-480b-a35b-instruct',
  qwen25Coder32B: 'qwen/qwen2.5-coder-32b-instruct',
  devstral123B: 'mistralai/devstral-2-123b-instruct',
  glm51: 'z-ai/glm5.1',
  gemma3nE4B: 'google/gemma-3n-e4b-it',
  gemma431B: 'google/gemma-4-31b-it',
  llama32Vision90B: 'meta/llama-3.2-90b-vision-instruct',
  phi4Multimodal: 'microsoft/phi-4-multimodal-instruct',
} as const;

const AGENT_MODEL_MAP: Record<string, string> = {
  'CEO Agent': NIM_MODELS.deepseekV4Pro,
  'COO Agent': NIM_MODELS.deepseekV4Pro,
  'CTO Agent': NIM_MODELS.deepseekV4Pro,
  'CFO Agent': NIM_MODELS.deepseekV4Pro,
  'CMO Agent': NIM_MODELS.deepseekV4Pro,
  'Goal Manager Agent': NIM_MODELS.deepseekV32,
  'Planner Agent': NIM_MODELS.deepseekV32,
  'Task Decomposer Agent': NIM_MODELS.deepseekV32,
  'Agent Allocator Agent': NIM_MODELS.deepseekV32,
  'Progress Monitor Agent': NIM_MODELS.deepseekV32,
  'Risk Detector Agent': NIM_MODELS.deepseekV32,
  'Replanning Agent': NIM_MODELS.deepseekV32,
  'Outcome Evaluator Agent': NIM_MODELS.deepseekV32,
  'Memory Agent': NIM_MODELS.gemma3nE4B,
  'Learning Agent': NIM_MODELS.gemma3nE4B,
  'Knowledge Manager Agent': NIM_MODELS.gemma3nE4B,
  'Product Manager Agent': NIM_MODELS.kimiK2Thinking,
  'Feature Planner Agent': NIM_MODELS.kimiK2Thinking,
  'Customer Insight Agent': NIM_MODELS.kimiK2Thinking,
  'Requirements Agent': NIM_MODELS.kimiK2Thinking,
  'Roadmap Agent': NIM_MODELS.kimiK2Thinking,
  'Validation Agent': NIM_MODELS.kimiK2Thinking,
  'Market Research Agent': NIM_MODELS.kimiK26,
  'Competitor Analysis Agent': NIM_MODELS.kimiK26,
  'Trend Research Agent': NIM_MODELS.kimiK26,
  'Industry Intelligence Agent': NIM_MODELS.kimiK26,
  'User Research Agent': NIM_MODELS.kimiK26,
  'Pricing Research Agent': NIM_MODELS.kimiK26,
  'SEO Research Agent': NIM_MODELS.kimiK26,
  'Data Mining Agent': NIM_MODELS.kimiK26,
  'Engineering Manager Agent': NIM_MODELS.deepseekV4Pro,
  'Software Architect Agent': NIM_MODELS.qwen3Coder480B,
  'Technical Reviewer Agent': NIM_MODELS.qwen3Coder480B,
  'Frontend Agent': NIM_MODELS.qwen3Coder480B,
  'Backend Agent': NIM_MODELS.qwen3Coder480B,
  'Full Stack Agent': NIM_MODELS.qwen3Coder480B,
  'Mobile Agent': NIM_MODELS.qwen3Coder480B,
  'API Agent': NIM_MODELS.qwen3Coder480B,
  'Database Agent': NIM_MODELS.qwen3Coder480B,
  'Integration Agent': NIM_MODELS.qwen3Coder480B,
  'Automation Agent': NIM_MODELS.qwen3Coder480B,
  'DevOps Agent': NIM_MODELS.devstral123B,
  'Cloud Infrastructure Agent': NIM_MODELS.devstral123B,
  'Deployment Agent': NIM_MODELS.devstral123B,
  'Monitoring Agent': NIM_MODELS.devstral123B,
  'QA Agent': NIM_MODELS.qwen25Coder32B,
  'Testing Agent': NIM_MODELS.qwen25Coder32B,
  'Bug Investigation Agent': NIM_MODELS.qwen25Coder32B,
  'UI Designer Agent': NIM_MODELS.gemma431B,
  'UX Designer Agent': NIM_MODELS.gemma431B,
  'Branding Agent': NIM_MODELS.gemma431B,
  'Wireframe Agent': NIM_MODELS.gemma431B,
  'Design System Agent': NIM_MODELS.gemma431B,
  'Prototype Agent': NIM_MODELS.gemma431B,
  'Marketing Manager Agent': NIM_MODELS.glm51,
  'Content Agent': NIM_MODELS.glm51,
  'SEO Agent': NIM_MODELS.glm51,
  'Social Media Agent': NIM_MODELS.glm51,
  'Copywriting Agent': NIM_MODELS.glm51,
  'Launch Agent': NIM_MODELS.glm51,
  'Growth Agent': NIM_MODELS.glm51,
  'Finance Planner Agent': NIM_MODELS.deepseekV4Pro,
  'Investor Relations Agent': NIM_MODELS.kimiK2Thinking,
  'Operations Manager Agent': NIM_MODELS.deepseekV32,
  'Legal Research Agent': NIM_MODELS.deepseekV4Pro,
  'Startup Advisor Agent': NIM_MODELS.deepseekV4Pro,
  'Pitch Deck Agent': NIM_MODELS.kimiK2Thinking,
  'Investor Research Agent': NIM_MODELS.kimiK26,
};

const DEPT_POOL: Record<string, string> = {
  'Executive Layer': NIM_MODELS.deepseekV4Pro,
  'Autonomous Control Unit': NIM_MODELS.deepseekV32,
  'Research Division': NIM_MODELS.kimiK26,
  'Product Office': NIM_MODELS.kimiK2Thinking,
  'Engineering Core': NIM_MODELS.qwen3Coder480B,
  'Design Studio': NIM_MODELS.gemma431B,
  'Growth & Marketing': NIM_MODELS.glm51,
  'Sales Operations': NIM_MODELS.glm51,
  'Financial Control': NIM_MODELS.deepseekV4Pro,
  'Legal & Policy': NIM_MODELS.deepseekV4Pro,
};

const EXEC_CHARACTER_MODEL: Record<string, string> = {
  CEO: NIM_MODELS.deepseekV4Pro,
  COO: NIM_MODELS.deepseekV4Pro,
  CTO: NIM_MODELS.qwen3Coder480B,
  CMO: NIM_MODELS.glm51,
  CFO: NIM_MODELS.deepseekV4Pro,
};

export function resolveModelForAgent(agentName: string, department?: string): string {
  if (AGENT_MODEL_MAP[agentName]) return AGENT_MODEL_MAP[agentName];
  const base = agentName.replace(/ Agent$/, '').trim();
  for (const [key, model] of Object.entries(AGENT_MODEL_MAP)) {
    if (key.startsWith(base) || base.startsWith(key.replace(/ Agent$/, ''))) {
      return model;
    }
  }
  if (department && DEPT_POOL[department]) return DEPT_POOL[department];
  return NIM_MODELS.deepseekV32;
}

export function resolveModelForExecutive(character: string): string {
  return EXEC_CHARACTER_MODEL[character] || NIM_MODELS.deepseekV4Pro;
}

export function resolveModelForGoalDecomposition(): string {
  return NIM_MODELS.deepseekV32;
}

export function resolveModelForTwinGeneration(): string {
  return NIM_MODELS.deepseekV4Pro;
}

export function modelLabel(modelId: string): string {
  const entry = Object.entries(NIM_MODELS).find(([, id]) => id === modelId);
  if (!entry) return modelId.split('/').pop() || modelId;
  const labels: Record<string, string> = {
    deepseekV4Pro: 'DeepSeek V4 Pro',
    deepseekV32: 'DeepSeek V3.2',
    kimiK2Thinking: 'Kimi K2 Thinking',
    kimiK26: 'Kimi K2.6',
    qwen3Coder480B: 'Qwen3 Coder 480B',
    qwen25Coder32B: 'Qwen2.5 Coder 32B',
    devstral123B: 'Devstral 2 123B',
    glm51: 'GLM 5.1',
    gemma3nE4B: 'Gemma 3n E4B',
    gemma431B: 'Gemma 4 31B',
  };
  return labels[entry[0]] || entry[0];
}
