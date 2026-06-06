import type { VercelRequest, VercelResponse } from '@vercel/node';

async function handleOperations(req: VercelRequest, res: VercelResponse) {
  const { url = '', method, query, body } = req;

  try {
    const path = url.replace('/api/operations', '').split('?')[0];
    const pathParts = path.split('/').filter(Boolean);

    if (pathParts.length === 0) {
      return res.status(404).json({ error: 'Route not found' });
    }

    const companyId = pathParts[0] || query.companyId || 'default-company';
    const remaining = pathParts.slice(1);
    const resource = remaining[0];
    const subResource = remaining[1];
    const action = remaining[remaining.length - 1];

    if (resource === 'agent-runtimes' && method === 'GET') {
      const { listAgentRuntimes } = await import('../server/operations/agentRuntime');
      return res.json({ agents: listAgentRuntimes() });
    }

    if (resource === 'execution') {
      const { startExecution, tickExecution, chooseNextPhase, getExecution, submitBrandDiscovery } = await import('../server/operations/executionEngine');

      if (method === 'GET') {
        const view = getExecution(companyId);
        if (!view) {
          return res.status(404).json({ error: 'No active execution' });
        }
        return res.json(view);
      }

      if (method === 'POST') {
        if (action === 'start') {
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

        if (action === 'tick') {
          const view = await tickExecution(companyId);
          return res.json(view ?? { error: 'No execution' });
        }

        if (action === 'choose') {
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

        if (action === 'brand-discovery') {
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

    if (resource === 'snapshot' && method === 'GET') {
      const { getCompanySnapshot } = await import('../server/operations/store');
      return res.json(getCompanySnapshot(companyId));
    }

    if (resource === 'events' && method === 'GET') {
      const { listEvents } = await import('../server/operations/eventLog');
      const limit = Number(query.limit) || 50;
      return res.json({ events: listEvents(companyId, limit) });
    }

    if (resource === 'tasks') {
      if (method === 'GET') {
        const { listTasks } = await import('../server/operations/taskBus');
        return res.json({ tasks: listTasks(companyId) });
      }
      if (method === 'POST') {
        const { assignTask } = await import('../server/operations/taskBus');
        const { title, assignee, department, project } = body as {
          title?: string;
          assignee?: string;
          department?: string;
          project?: string;
        };
        if (!title || !assignee || !department) {
          return res.status(400).json({ error: 'title, assignee, department required' });
        }
        const task = assignTask(companyId, { title, assignee, department, project });
        return res.json({ task });
      }
    }

    if (resource === 'approvals' && subResource === 'pending' && method === 'GET') {
      const { listPendingApprovals } = await import('../server/operations/approvalPolicy');
      return res.json({ approvals: listPendingApprovals(companyId) });
    }

    if (resource === 'approvals' && subResource && method === 'POST') {
      const { resolveApproval } = await import('../server/operations/approvalPolicy');
      const { status } = body as { status?: 'approved' | 'declined' };
      if (status !== 'approved' && status !== 'declined') {
        return res.status(400).json({ error: 'status must be approved or declined' });
      }
      const approval = resolveApproval(companyId, subResource, status);
      if (!approval) {
        return res.status(404).json({ error: 'Approval not found' });
      }
      return res.json({ approval });
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