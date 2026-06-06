import fs from 'fs';
import path from 'path';
import type { CompanyOperationsState, SocialWorkflowState } from './types';

const DATA_DIR = path.join(process.cwd(), 'data');
const STORE_FILE = path.join(DATA_DIR, 'nexus-operations.json');

type StoreFile = {
  companies: Record<string, CompanyOperationsState>;
};

function defaultSocialWorkflow(): SocialWorkflowState {
  return { step: 'idle', platforms: [] };
}

export function emptyCompanyState(companyId: string): CompanyOperationsState {
  return {
    companyId,
    events: [],
    tasks: [],
    approvals: [],
    kpis: [],
    ceoObjectives: [],
    cooPlans: [],
    memoryWrites: [],
    socialWorkflow: defaultSocialWorkflow(),
    replanHistory: [],
    execution: null,
  };
}

function readStore(): StoreFile {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    if (!fs.existsSync(STORE_FILE)) {
      const empty: StoreFile = { companies: {} };
      fs.writeFileSync(STORE_FILE, JSON.stringify(empty, null, 2));
      return empty;
    }
    const raw = fs.readFileSync(STORE_FILE, 'utf-8');
    return JSON.parse(raw) as StoreFile;
  } catch {
    return { companies: {} };
  }
}

function writeStore(store: StoreFile): void {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(STORE_FILE, JSON.stringify(store, null, 2));
}

export function getCompanyState(companyId: string): CompanyOperationsState {
  const store = readStore();
  if (!store.companies[companyId]) {
    store.companies[companyId] = emptyCompanyState(companyId);
    writeStore(store);
  }
  const raw = store.companies[companyId];
  return {
    ...emptyCompanyState(companyId),
    ...raw,
    execution: raw.execution ?? null,
  };
}

export function updateCompanyState(
  companyId: string,
  updater: (state: CompanyOperationsState) => CompanyOperationsState,
): CompanyOperationsState {
  const store = readStore();
  const current = store.companies[companyId] ?? emptyCompanyState(companyId);
  const next = updater(current);
  store.companies[companyId] = next;
  writeStore(store);
  return next;
}

export function resetCompanyState(companyId: string): void {
  const store = readStore();
  store.companies[companyId] = emptyCompanyState(companyId);
  writeStore(store);
}
