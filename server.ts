import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { getNimConfig } from './server/nimClient';
import {
  buildOfflineTwin,
  decomposeGoal,
  executiveChat,
  generateTwin,
  getAgentModelInfo,
} from './server/handlers';
import operationsRouter from './server/routes/operations';
import authRouter from './server/auth/authRoutes';
import onboardingRouter from './server/routes/onboarding';
import industriesRouter from './server/routes/industries';
import integrationsRouter from './server/routes/integrations';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

app.use('/api/operations', operationsRouter);
app.use('/api/auth', authRouter);
app.use('/api/onboarding', onboardingRouter);
app.use('/api/industries', industriesRouter);
app.use('/api/integrations', integrationsRouter);

app.get('/api/check-key', (_req, res) => {
  const hasNim = !!getNimConfig();
  const hasGemini =
    !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY';
  res.json({ hasKey: hasNim || hasGemini, provider: hasNim ? 'nvidia_nim' : hasGemini ? 'gemini' : 'offline' });
});

app.get('/api/agent-model', (req, res) => {
  const agentName = String(req.query.agent || '');
  const department = req.query.department ? String(req.query.department) : undefined;
  res.json(getAgentModelInfo(agentName, department));
});

app.post('/api/generate-twin', async (req, res) => {
  try {
    const customKey = req.headers['x-gemini-api-key'] as string | undefined;
    const data = await generateTwin(req.body, customKey);
    res.json(data);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to generate digital twin';
    console.error('generate-twin:', error);
    res.status(500).json({ error: message });
  }
});

app.post('/api/chat', async (req, res) => {
  try {
    const { character, message, history, twinContext } = req.body;
    const customKey = req.headers['x-gemini-api-key'] as string | undefined;
    const result = await executiveChat(character, message, history, twinContext, customKey);

    const goalMatch = message.match(/set goal[:\s]+(.+)/i) || message.match(/new goal[:\s]+(.+)/i);
    if (goalMatch && twinContext && character === 'CEO') {
      const newGoal = goalMatch[1].trim();
      const goals = Array.isArray(twinContext.goals) ? [...twinContext.goals] : [];
      if (!goals.includes(newGoal)) goals.push(newGoal);
      return res.json({ text: result.text, model: result.model, updatedGoals: goals });
    }

    res.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to get AI Agent response';
    console.error('chat:', error);
    res.status(500).json({ error: message });
  }
});

app.post('/api/decompose-goal', async (req, res) => {
  try {
    const { goalInput, twinContext } = req.body;
    const customKey = req.headers['x-gemini-api-key'] as string | undefined;
    const data = await decomposeGoal(goalInput, twinContext, customKey);
    res.json(data);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to decompose goal';
    console.error('decompose-goal:', error);
    res.status(500).json({ error: message });
  }
});

app.post('/api/ceo-add-goal', async (req, res) => {
  const { goal, twin } = req.body;
  if (!goal?.trim() || !twin) {
    return res.status(400).json({ error: 'goal and twin required' });
  }
  const goals = [...(twin.goals || [])];
  if (!goals.includes(goal.trim())) goals.push(goal.trim());
  res.json({ goals, twin: { ...twin, goals } });
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        strictPort: false,
        hmr: { clientPort: PORT },
        watch: { ignored: ['**/data/**'] },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const httpServer = app.listen(PORT, '0.0.0.0', () => {
    const nim = getNimConfig();
    console.log(`[Nexus AI] Autonomous Business OS running on http://localhost:${PORT}`);
    console.log(`[Nexus AI] AI provider: ${nim ? 'NVIDIA NIM' : 'offline/Gemini fallback'}`);
  });

  httpServer.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE') {
      console.error(
        `[Nexus AI] Port ${PORT} is already in use. Close the other Nexus/dev server, or run with PORT=3001 npm run dev`,
      );
      process.exit(1);
    }
    throw err;
  });
}

startServer();
