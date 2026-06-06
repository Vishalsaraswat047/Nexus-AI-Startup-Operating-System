import type { VercelRequest, VercelResponse } from '@vercel/node';

async function handleOperations(req: VercelRequest, res: VercelResponse) {
  const { method, query, body } = req;
  const url = req.url || '';

  try {
    const params = query as Record<string, string | string[] | undefined>;
    const companyId = params.companyId as string || 'default-company';
    const path = params.path as string || '';

    if (url.includes('agent-runtimes') && method === 'GET') {
      const { listAgentRuntimes } = await import('../server/operations/agentRuntime');
      return res.json({ agents: listAgentRuntimes() });
    }

    if (url.includes('execution')) {
      const { startExecution, tickExecution, chooseNextPhase, getExecution, submitBrandDiscovery } = await import('../server/operations/executionEngine');

      if (method === 'GET') {
        const view = getExecution(companyId);
        if (!view) {
          return res.status(404).json({ error: 'No active execution' });
        }
        return res.json(view);
      }

      if (method === 'POST') {
        if (url.includes('/start')) {
          if (!body.directive?.trim()) {
            return res.status(400).json({ error: 'directive required' });
          }
          const view = startExecution(companyId, {
            directive: body.directive.trim(),
            twin: body.twin || {},
            location: body.location || 'Not specified',
            targetCustomers: body.targetCustomers || 'General market',
            timelineDays: body.timelineDays ?? 30,
          });
          return res.json(view);
        }

        if (url.includes('/tick')) {
          const view = await tickExecution(companyId);
          return res.json(view ?? { error: 'No execution' });
        }

        if (url.includes('/choose')) {
          const { phaseKey } = body as { phaseKey?: string };
          if (!phaseKey) {
            return res.status(400).json({ error: 'phaseKey required' });
          }
          const view = chooseNextPhase(companyId, phaseKey);
          if (!view) {
            return res.status(404).json({ error: 'Cannot start phase' });
          }
          return res.json(view);
        }

        if (url.includes('brand-discovery')) {
          const { mainBrandValues, whatsNew, brandPersonality, taglineOrVision } = body as {
            mainBrandValues?: string;
            whatsNew?: string;
            brandPersonality?: string;
            taglineOrVision?: string;
          };
          if (!mainBrandValues?.trim()) {
            return res.status(400).json({ error: 'mainBrandValues required' });
          }
          const view = submitBrandDiscovery(companyId, {
            mainBrandValues: mainBrandValues.trim(),
            whatsNew: (whatsNew || '').trim(),
            brandPersonality: (brandPersonality || '').trim(),
            taglineOrVision: (taglineOrVision || '').trim(),
          });
          return res.json(view);
        }
      }
    }

    if (url.includes('snapshot') && method === 'GET') {
      const { getCompanySnapshot } = await import('../server/operations/store');
      return res.json(getCompanySnapshot(companyId));
    }

    if (url.includes('events') && method === 'GET') {
      const { listEvents } = await import('../server/operations/eventLog');
      const limit = Number(params.limit) || 50;
      return res.json({ events: listEvents(companyId, limit) });
    }

    if (url.includes('/tasks') && method === 'GET') {
      const { listTasks } = await import('../server/operations/taskBus');
      return res.json({ tasks: listTasks(companyId) });
    }

    if (url.includes('approvals/pending') && method === 'GET') {
      const { listPendingApprovals } = await import('../server/operations/approvalPolicy');
      return res.json({ approvals: listPendingApprovals(companyId) });
    }

    return res.status(404).json({ error: 'Route not found' });
  } catch (error: unknown) {
    console.error('API Error:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
}

export default handleOperations;