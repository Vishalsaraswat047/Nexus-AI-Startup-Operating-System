import dotenv from 'dotenv';
dotenv.config();

const base = 'http://localhost:3000';

async function main() {
  const check = await fetch(`${base}/api/check-key`);
  const checkJson = await check.json();
  console.log('check-key', check.status, checkJson);

  const chatBody = {
    character: 'CEO',
    message: 'Reply with exactly: OK',
    history: [],
    twinContext: {
      name: 'SmokeTest',
      stage: 'Idea',
      budget: 5000,
      revenue: 0,
      expenses: 500,
      goals: ['Test'],
    },
  };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 90000);
  try {
    const chatRes = await fetch(`${base}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(chatBody),
      signal: controller.signal,
    });
    clearTimeout(timer);
    const chatJson = await chatRes.json();
    console.log('chat', chatRes.status, {
      model: chatJson.model,
      textPreview: String(chatJson.text || chatJson.error || '').slice(0, 120),
    });
  } catch (e) {
    clearTimeout(timer);
    console.log('chat', 'FAIL', e.message);
  }
}

async function testNimDirect() {
  const key = process.env.NVIDIA_API_KEY?.trim();
  const baseUrl = (process.env.NVIDIA_API_BASE_URL || 'https://integrate.api.nvidia.com/v1').replace(
    /\/$/,
    '',
  );
  if (!key || key.includes('YOUR_')) {
    console.log('nim-direct', 'SKIP no key');
    return;
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 60000);
  try {
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'deepseek-ai/deepseek-v4-pro',
        messages: [{ role: 'user', content: 'Reply with exactly: OK' }],
        max_tokens: 16,
        stream: false,
      }),
      signal: controller.signal,
    });
    clearTimeout(timer);
    const text = await res.text();
    console.log('nim-direct', res.status, text.slice(0, 200));
  } catch (e) {
    clearTimeout(timer);
    console.log('nim-direct', 'FAIL', e.message);
  }
}

async function testRoute(path, body) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 120000);
  try {
    const res = await fetch(`${base}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    clearTimeout(timer);
    const json = await res.json();
    console.log(path, res.status, Object.keys(json).join(','));
    return res.ok;
  } catch (e) {
    clearTimeout(timer);
    console.log(path, 'FAIL', e.message);
    return false;
  }
}

main()
  .then(() => testNimDirect())
  .then(() =>
    testRoute('/api/decompose-goal', {
      goalInput: 'Launch MVP',
      twinContext: { name: 'SmokeTest', stage: 'Idea', budget: 5000 },
    }),
  );
