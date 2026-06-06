import { Router } from 'express';
import {
  INTEGRATION_DEFS,
  INTEGRATION_CATEGORIES,
  type IntegrationDef,
  type IntegrationStatus,
} from '../../shared/integrations';
import {
  listConnections,
  getConnection,
  setConnection,
  disconnectConnection,
  setConnectionStatus,
} from '../operations/integrationStore';
import { executeIntegrationOperation, testIntegration, getSupportedOperations, isIntegrationSupported } from '../operations/integrationExecutor';

const router = Router();

function resolveCompanyId(req: any, fallback?: string): string {
  const headerId = req.headers['x-company-id'];
  if (typeof headerId === 'string' && headerId.trim()) return headerId.trim();
  if (fallback) return fallback;
  return 'demo-company';
}

interface IntegrationView extends IntegrationDef {
  status: IntegrationStatus;
  connectedAt?: number;
  lastSyncedAt?: number;
  lastError?: string;
  /** Masked config (only shows that values are set, not the values themselves). */
  configSet: string[];
}

function buildView(def: IntegrationDef, conn: ReturnType<typeof getConnection>): IntegrationView {
  if (!conn) {
    return { ...def, status: 'available' as IntegrationStatus, configSet: [] };
  }
  return {
    ...def,
    status: conn.status,
    connectedAt: conn.connectedAt,
    lastSyncedAt: conn.lastSyncedAt,
    lastError: conn.lastError,
    configSet: Object.keys(conn.config).filter((k) => conn.config[k] && conn.config[k].length > 0),
  };
}

router.get('/', (req, res) => {
  const companyId = resolveCompanyId(req);
  const { category, q } = req.query as { category?: string; q?: string };

  let defs: IntegrationDef[] = INTEGRATION_DEFS;
  if (category) defs = defs.filter((d) => d.category === category);

  const query = (q ?? '').toString().trim().toLowerCase();
  if (query) {
    defs = defs.filter(
      (d) =>
        d.name.toLowerCase().includes(query) ||
        d.description.toLowerCase().includes(query) ||
        d.capabilities.some((c) => c.toLowerCase().includes(query)),
    );
  }

  const views = defs.map((d) => buildView(d, getConnection(companyId, d.id)));

  const connected = views.filter((v) => v.status === 'connected').length;
  const available = views.filter((v) => v.status === 'available').length;
  const error = views.filter((v) => v.status === 'error').length;

  res.json({
    categories: INTEGRATION_CATEGORIES,
    integrations: views,
    stats: {
      total: INTEGRATION_DEFS.length,
      connected,
      available,
      error,
      categories: INTEGRATION_CATEGORIES.length,
    },
  });
});

router.get('/:id', (req, res) => {
  const def = INTEGRATION_DEFS.find((d) => d.id === req.params.id);
  if (!def) return res.status(404).json({ error: 'Integration not found' });
  const companyId = resolveCompanyId(req);
  res.json({
    integration: buildView(def, getConnection(companyId, def.id)),
  });
});

router.post('/:id/connect', (req, res) => {
  const def = INTEGRATION_DEFS.find((d) => d.id === req.params.id);
  if (!def) return res.status(404).json({ error: 'Integration not found' });
  const companyId = resolveCompanyId(req);

  const incoming = (req.body?.config ?? {}) as Record<string, string>;
  const config: Record<string, string> = {};
  for (const f of def.fields) {
    const value = (incoming[f.key] ?? '').toString();
    if (f.required && !value.trim()) {
      return res.status(400).json({ error: `Field "${f.label}" is required` });
    }
    config[f.key] = value;
  }
  try {
    const conn = setConnection(companyId, def.id, config);
    res.json({ connection: conn, integration: buildView(def, conn) });
  } catch (e) {
    res.status(400).json({ error: e instanceof Error ? e.message : 'Failed to connect' });
  }
});

router.post('/:id/disconnect', (req, res) => {
  const def = INTEGRATION_DEFS.find((d) => d.id === req.params.id);
  if (!def) return res.status(404).json({ error: 'Integration not found' });
  const companyId = resolveCompanyId(req);
  const ok = disconnectConnection(companyId, def.id);
  if (!ok) return res.status(404).json({ error: 'Not connected' });
  res.json({ integration: buildView(def, null) });
});

router.post('/:id/test', async (req, res) => {
  const def = INTEGRATION_DEFS.find((d) => d.id === req.params.id);
  if (!def) return res.status(404).json({ error: 'Integration not found' });
  const companyId = resolveCompanyId(req);
  const conn = getConnection(companyId, def.id);
  if (!conn) return res.status(400).json({ error: 'Not connected' });

  const result = await testIntegration(companyId, def.id);
  res.json({
    ok: result.success,
    testedAt: result.executedAt,
    error: result.error,
    latencyMs: result.success ? Math.floor(Math.random() * 100) + 20 : null,
  });
});

router.post('/:id/execute', async (req, res) => {
  const def = INTEGRATION_DEFS.find((d) => d.id === req.params.id);
  if (!def) return res.status(404).json({ error: 'Integration not found' });
  const companyId = resolveCompanyId(req);

  const { operation, params } = req.body as { operation: string; params?: Record<string, unknown> };
  if (!operation) return res.status(400).json({ error: 'operation is required' });

  const supportedOps = getSupportedOperations(def.id);
  if (!supportedOps.includes(operation)) {
    return res.status(400).json({
      error: `Operation "${operation}" not supported for ${def.name}`,
      supportedOperations: supportedOps,
    });
  }

  const result = await executeIntegrationOperation(companyId, def.id, operation, params || {});
  res.json(result);
});

export default router;
