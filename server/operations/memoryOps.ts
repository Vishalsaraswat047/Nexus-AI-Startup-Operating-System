import type { MemoryWrite } from './types';
import { appendEvent } from './eventLog';
import { getCompanyState, updateCompanyState } from './store';

function newId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function writeMemory(
  companyId: string,
  params: {
    type: MemoryWrite['type'];
    content: string;
    agent: string;
  },
): MemoryWrite {
  const entry: MemoryWrite = {
    id: newId('mem'),
    companyId,
    type: params.type,
    content: params.content,
    agent: params.agent,
    timestamp: Date.now(),
  };

  updateCompanyState(companyId, (state) => ({
    ...state,
    memoryWrites: [entry, ...state.memoryWrites].slice(0, 300),
  }));

  appendEvent(companyId, {
    type: 'memory_written',
    fromAgent: params.agent,
    department: 'Autonomous Control Unit',
    message: `[${params.type}] ${params.content.slice(0, 120)}`,
    payload: { memoryId: entry.id, memoryType: params.type },
  });

  return entry;
}

export function getMemorySnapshot(companyId: string) {
  return memoryToCorporateSections(getCompanyMemoryWrites(companyId));
}

export function getCompanyMemoryWrites(companyId: string): MemoryWrite[] {
  const state = getCompanyState(companyId);
  return state.memoryWrites ?? [];
}

export function memoryToCorporateSections(writes: MemoryWrite[]) {
  const sections = {
    strategic: [] as string[],
    operational: [] as string[],
    learning: [] as string[],
    business: [] as string[],
    customer: [] as string[],
    failure: [] as string[],
  };
  for (const w of writes) {
    const line = `[${new Date(w.timestamp).toLocaleString()}] ${w.agent}: ${w.content}`;
    if (w.type === 'strategic') sections.strategic.push(line);
    else if (w.type === 'operational') sections.operational.push(line);
    else if (w.type === 'learning') sections.learning.push(line);
    else if (w.type === 'business' || w.type === 'customer')
      (w.type === 'customer' ? sections.customer : sections.business).push(line);
    else if (w.type === 'failure') sections.failure.push(line);
  }
  return sections;
}
