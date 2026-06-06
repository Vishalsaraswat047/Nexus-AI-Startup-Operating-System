/** Client-side NVIDIA NIM model pools (mirrors server/agentModels.ts) */

export const NIM_MODEL_LABELS: Record<string, string> = {
  'deepseek-ai/deepseek-v4-pro': 'DeepSeek V4 Pro',
  'deepseek-ai/deepseek-v3.2': 'DeepSeek V3.2',
  'moonshotai/kimi-k2-thinking': 'Kimi K2 Thinking',
  'moonshotai/kimi-k2.6': 'Kimi K2.6',
  'qwen/qwen3-coder-480b-a35b-instruct': 'Qwen3 Coder 480B',
  'qwen/qwen2.5-coder-32b-instruct': 'Qwen2.5 Coder 32B',
  'mistralai/devstral-2-123b-instruct': 'Devstral 2 123B',
  'z-ai/glm5.1': 'GLM 5.1',
  'google/gemma-3n-e4b-it': 'Gemma 3n E4B',
  'google/gemma-4-31b-it': 'Gemma 4 31B',
};

const AGENT_MODEL: Record<string, string> = {
  'CEO Agent': 'deepseek-ai/deepseek-v4-pro',
  'COO Agent': 'deepseek-ai/deepseek-v4-pro',
  'CTO Agent': 'deepseek-ai/deepseek-v4-pro',
  'CFO Agent': 'deepseek-ai/deepseek-v4-pro',
  'CMO Agent': 'deepseek-ai/deepseek-v4-pro',
  'Goal Manager Agent': 'deepseek-ai/deepseek-v3.2',
  'Planner Agent': 'deepseek-ai/deepseek-v3.2',
  'Task Decomposer Agent': 'deepseek-ai/deepseek-v3.2',
  'Replanning Agent': 'deepseek-ai/deepseek-v3.2',
  'Market Research Agent': 'moonshotai/kimi-k2.6',
  'Competitor Analysis Agent': 'moonshotai/kimi-k2.6',
  'Trend Research Agent': 'moonshotai/kimi-k2.6',
  'Product Manager Agent': 'moonshotai/kimi-k2-thinking',
  'Feature Planner Agent': 'moonshotai/kimi-k2-thinking',
  'Software Architect Agent': 'qwen/qwen3-coder-480b-a35b-instruct',
  'Backend Agent': 'qwen/qwen3-coder-480b-a35b-instruct',
  'Frontend Agent': 'qwen/qwen3-coder-480b-a35b-instruct',
  'Full Stack Agent': 'qwen/qwen3-coder-480b-a35b-instruct',
  'DevOps Agent': 'mistralai/devstral-2-123b-instruct',
  'QA Agent': 'qwen/qwen2.5-coder-32b-instruct',
  'UI Designer Agent': 'google/gemma-4-31b-it',
  'Marketing Manager Agent': 'z-ai/glm5.1',
  'Content Agent': 'z-ai/glm5.1',
  'SEO Agent': 'z-ai/glm5.1',
  'Launch Agent': 'z-ai/glm5.1',
  'Finance Planner Agent': 'deepseek-ai/deepseek-v4-pro',
  'Legal Research Agent': 'deepseek-ai/deepseek-v4-pro',
  'Memory Agent': 'google/gemma-3n-e4b-it',
};

const DEPT_MODEL: Record<string, string> = {
  'Executive Layer': 'deepseek-ai/deepseek-v4-pro',
  'Autonomous Control Unit': 'deepseek-ai/deepseek-v3.2',
  'Research Division': 'moonshotai/kimi-k2.6',
  'Product Office': 'moonshotai/kimi-k2-thinking',
  'Engineering Core': 'qwen/qwen3-coder-480b-a35b-instruct',
  'Design Studio': 'google/gemma-4-31b-it',
  'Growth & Marketing': 'z-ai/glm5.1',
  'Sales Operations': 'z-ai/glm5.1',
  'Financial Control': 'deepseek-ai/deepseek-v4-pro',
  'Legal & Policy': 'deepseek-ai/deepseek-v4-pro',
};

export function getModelForAgent(agentName: string, department?: string): string {
  if (AGENT_MODEL[agentName]) return AGENT_MODEL[agentName];
  const stem = agentName.replace(/ Agent$/, '').trim();
  for (const [key, model] of Object.entries(AGENT_MODEL)) {
    const keyStem = key.replace(/ Agent$/, '');
    if (keyStem.startsWith(stem) || stem.startsWith(keyStem)) return model;
  }
  if (department && DEPT_MODEL[department]) return DEPT_MODEL[department];
  return 'deepseek-ai/deepseek-v3.2';
}

export function getModelLabel(modelId: string): string {
  return NIM_MODEL_LABELS[modelId] || modelId.split('/').pop() || modelId;
}

export const EXEC_MODEL_LABELS: Record<string, string> = {
  CEO: 'DeepSeek V4 Pro',
  COO: 'DeepSeek V4 Pro',
  CTO: 'Qwen3 Coder 480B',
  CMO: 'GLM 5.1',
  CFO: 'DeepSeek V4 Pro',
};
