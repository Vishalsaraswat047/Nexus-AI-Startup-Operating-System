import { Router } from 'express';
import {
  getCompanySnapshot,
  resetCompanyState,
  listEvents,
  listTasks,
  listPendingApprovals,
  resolveApproval,
  createCeoObjective,
  createCooPlanFromObjective,
  runSocialPresenceCheck,
  executeSocialAccountCreation,
  getSocialWorkflow,
  runAutomaticReplan,
  syncKpiFromMilestones,
  listAgentRuntimes,
  validateAgentCanExecute,
  assignTask,
  completeTask,
  startExecution,
  tickExecution,
  chooseNextPhase,
  getExecution,
  submitBrandDiscovery,
} from '../operations';

const router = Router();

router.get('/:companyId/snapshot', (req, res) => {
  const companyId = String(req.params.companyId);
  res.json(getCompanySnapshot(companyId));
});

router.post('/:companyId/reset', (req, res) => {
  resetCompanyState(String(req.params.companyId));
  res.json({ ok: true });
});

router.get('/:companyId/events', (req, res) => {
  const limit = Number(req.query.limit) || 50;
  res.json({ events: listEvents(String(req.params.companyId), limit) });
});

router.get('/:companyId/tasks', (req, res) => {
  res.json({ tasks: listTasks(String(req.params.companyId)) });
});

router.get('/:companyId/approvals/pending', (req, res) => {
  res.json({ approvals: listPendingApprovals(String(req.params.companyId)) });
});

router.post('/:companyId/approvals/:approvalId/resolve', (req, res) => {
  const { status } = req.body as { status: 'approved' | 'declined' };
  if (status !== 'approved' && status !== 'declined') {
    return res.status(400).json({ error: 'status must be approved or declined' });
  }
  const approval = resolveApproval(
    String(req.params.companyId),
    String(req.params.approvalId),
    status,
  );
  if (!approval) return res.status(404).json({ error: 'Approval not found' });
  res.json({ approval });
});

router.post('/:companyId/ceo/objective', (req, res) => {
  const { directive, twin } = req.body as { directive: string; twin: Record<string, unknown> };
  if (!directive?.trim()) return res.status(400).json({ error: 'directive required' });
  const companyId = String(req.params.companyId);
  const objective = createCeoObjective(companyId, directive.trim(), twin || {});
  res.json({ objective });
});

router.post('/:companyId/coo/plan', (req, res) => {
  const { objectiveId } = req.body as { objectiveId: string };
  const plan = createCooPlanFromObjective(String(req.params.companyId), objectiveId);
  if (!plan) return res.status(404).json({ error: 'Objective not found' });
  res.json({ plan });
});

router.post('/:companyId/workflows/social/check', (req, res) => {
  const { integrations } = req.body as { integrations?: string[] };
  const workflow = runSocialPresenceCheck(String(req.params.companyId), integrations || []);
  res.json({ workflow });
});

router.post('/:companyId/workflows/social/execute', async (req, res) => {
  const { approvalId, brandName } = req.body as { approvalId: string; brandName: string };
  if (!approvalId) return res.status(400).json({ error: 'approvalId required' });
  try {
    const workflow = await executeSocialAccountCreation(
      String(req.params.companyId),
      approvalId,
      brandName || 'Brand',
    );
    res.json({ workflow });
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : 'Execute failed' });
  }
});

router.get('/:companyId/workflows/social', (req, res) => {
  res.json({ workflow: getSocialWorkflow(String(req.params.companyId)) });
});

router.post('/:companyId/replan', (req, res) => {
  const { risk } = req.body as { risk: { id: string; title: string; description: string; category: string; severity: string } };
  if (!risk?.id) return res.status(400).json({ error: 'risk required' });
  const record = runAutomaticReplan(String(req.params.companyId), risk);
  res.json({ replan: record });
});

router.post('/:companyId/kpis/sync-milestones', (req, res) => {
  const { milestones } = req.body as { milestones: { progress: number; status: string }[] };
  syncKpiFromMilestones(String(req.params.companyId), milestones || []);
  res.json(getCompanySnapshot(String(req.params.companyId)).dashboard);
});

router.get('/agent-runtimes', (_req, res) => {
  res.json({ agents: listAgentRuntimes() });
});

router.post('/:companyId/agents/validate', (req, res) => {
  const { agentId, actionType } = req.body as { agentId: string; actionType: string };
  res.json(validateAgentCanExecute(agentId, actionType));
});

router.post('/:companyId/tasks/assign', (req, res) => {
  const body = req.body as {
    title: string;
    assignee: string;
    department: string;
    project?: string;
  };
  const task = assignTask(String(req.params.companyId), body);
  res.json({ task });
});

router.post('/:companyId/execution/start', (req, res) => {
  const companyId = String(req.params.companyId);
  const body = req.body as {
    directive: string;
    twin: Record<string, unknown>;
    location?: string;
    targetCustomers?: string;
    timelineDays?: number;
  };
  if (!body.directive?.trim()) return res.status(400).json({ error: 'directive required' });
  const view = startExecution(companyId, {
    directive: body.directive.trim(),
    twin: body.twin || {},
    location: body.location || 'Not specified',
    targetCustomers: body.targetCustomers || 'General market',
    timelineDays: body.timelineDays ?? 30,
  });
  res.json(view);
});

router.get('/:companyId/execution', (req, res) => {
  const view = getExecution(String(req.params.companyId));
  if (!view) return res.status(404).json({ error: 'No active execution' });
  res.json(view);
});

router.post('/:companyId/execution/tick', async (req, res) => {
  const view = await tickExecution(String(req.params.companyId));
  res.json(view ?? { error: 'No execution' });
});

router.post('/:companyId/execution/brand-discovery', (req, res) => {
  const body = req.body as {
    mainBrandValues: string;
    whatsNew: string;
    brandPersonality: string;
    taglineOrVision: string;
  };
  if (!body.mainBrandValues?.trim()) {
    return res.status(400).json({ error: 'mainBrandValues required' });
  }
  const view = submitBrandDiscovery(String(req.params.companyId), {
    mainBrandValues: body.mainBrandValues.trim(),
    whatsNew: (body.whatsNew || '').trim(),
    brandPersonality: (body.brandPersonality || '').trim(),
    taglineOrVision: (body.taglineOrVision || '').trim(),
  });
  res.json(view);
});

router.post('/:companyId/execution/choose', (req, res) => {
  const { phaseKey } = req.body as { phaseKey: string };
  if (!phaseKey) return res.status(400).json({ error: 'phaseKey required' });
  const view = chooseNextPhase(String(req.params.companyId), phaseKey);
  if (!view) return res.status(404).json({ error: 'Cannot start phase' });
  res.json(view);
});

router.post('/:companyId/tasks/:taskId/complete', (req, res) => {
  const { agent, department } = req.body as { agent: string; department: string };
  const task = completeTask(
    String(req.params.companyId),
    String(req.params.taskId),
    agent,
    department,
  );
  if (!task) return res.status(404).json({ error: 'Task not found' });
  res.json({ task });
});

export default router;
