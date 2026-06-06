export interface NimMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export function getNimConfig(): { apiKey: string; baseUrl: string } | null {
  const apiKey = process.env.NVIDIA_API_KEY?.trim();
  if (!apiKey || apiKey.includes('YOUR_')) return null;
  const baseUrl = (process.env.NVIDIA_API_BASE_URL || 'https://integrate.api.nvidia.com/v1').replace(
    /\/$/,
    '',
  );
  return { apiKey, baseUrl };
}

export async function nimChatCompletion(params: {
  model: string;
  messages: NimMessage[];
  maxTokens?: number;
  temperature?: number;
}): Promise<string> {
  const config = getNimConfig();
  if (!config) {
    throw new Error('NVIDIA_API_KEY is not configured');
  }

  const response = await fetch(`${config.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: params.model,
      messages: params.messages,
      max_tokens: params.maxTokens ?? 4096,
      temperature: params.temperature ?? 0.4,
      stream: false,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`NIM API ${response.status}: ${errText.slice(0, 500)}`);
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  return data.choices?.[0]?.message?.content?.trim() || '';
}

export function parseJsonFromLlm<T>(text: string): T {
  const trimmed = text.trim();
  const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = fence ? fence[1].trim() : trimmed;
  return JSON.parse(raw) as T;
}
