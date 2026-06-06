import fs from 'fs';
import path from 'path';
import { getCompanyId as defaultCompanyId } from '../auth/helpers';
import type { IntegrationConnection, IntegrationStatus } from '../../shared/integrations';

interface ConnectionsDb {
  connections: IntegrationConnection[];
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_PATH = path.join(DATA_DIR, 'integration-connections.json');

function ensureDb(): ConnectionsDb {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DB_PATH)) {
    const empty: ConnectionsDb = { connections: [] };
    fs.writeFileSync(DB_PATH, JSON.stringify(empty, null, 2));
    return empty;
  }
  try {
    return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8')) as ConnectionsDb;
  } catch {
    return { connections: [] };
  }
}

function saveDb(db: ConnectionsDb) {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

function newId(): string {
  return `conn-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function listConnections(companyId: string): IntegrationConnection[] {
  const db = ensureDb();
  return db.connections.filter((c) => c.companyId === companyId);
}

export function getConnection(
  companyId: string,
  integrationId: string,
): IntegrationConnection | null {
  const db = ensureDb();
  return (
    db.connections.find(
      (c) => c.companyId === companyId && c.integrationId === integrationId,
    ) ?? null
  );
}

export function setConnection(
  companyId: string,
  integrationId: string,
  config: Record<string, string>,
): IntegrationConnection {
  const db = ensureDb();
  const existing = db.connections.find(
    (c) => c.companyId === companyId && c.integrationId === integrationId,
  );
  const requiredFields = Object.entries(config).filter(([_, v]) => !v || !v.trim());
  if (requiredFields.length > 0) {
    throw new Error('All required fields must be filled');
  }
  if (existing) {
    existing.config = { ...existing.config, ...config };
    existing.status = 'connected' as IntegrationStatus;
    existing.connectedAt = Date.now();
    existing.lastSyncedAt = Date.now();
    saveDb(db);
    return existing;
  }
  const conn: IntegrationConnection = {
    id: newId(),
    integrationId,
    companyId,
    status: 'connected' as IntegrationStatus,
    config,
    connectedAt: Date.now(),
    lastSyncedAt: Date.now(),
  };
  db.connections.push(conn);
  saveDb(db);
  return conn;
}

export function disconnectConnection(companyId: string, integrationId: string): boolean {
  const db = ensureDb();
  const idx = db.connections.findIndex(
    (c) => c.companyId === companyId && c.integrationId === integrationId,
  );
  if (idx < 0) return false;
  db.connections.splice(idx, 1);
  saveDb(db);
  return true;
}

export function setConnectionStatus(
  companyId: string,
  integrationId: string,
  status: IntegrationStatus,
  lastError?: string,
): IntegrationConnection | null {
  const db = ensureDb();
  const conn = db.connections.find(
    (c) => c.companyId === companyId && c.integrationId === integrationId,
  );
  if (!conn) return null;
  conn.status = status;
  if (lastError) conn.lastError = lastError;
  else delete conn.lastError;
  saveDb(db);
  return conn;
}
