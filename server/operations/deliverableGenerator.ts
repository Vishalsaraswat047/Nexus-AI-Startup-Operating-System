import type { ExecutionDeliverable } from './executionTypes';

export interface DeliverableContent {
  title: string;
  summary: string;
  findings: DeliverableFinding[];
  agent: string;
  phaseId: string;
  createdAt: number;
}

export interface DeliverableFinding {
  key: string;
  value: string | number | string[];
  type: 'text' | 'number' | 'list' | 'table' | 'currency';
  confidence?: 'high' | 'medium' | 'low';
}

function newId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function generateDeliverableFromAgentOutput(
  phaseId: string,
  agentName: string,
  taskTitle: string,
  agentFindings: Record<string, unknown>,
  completedSubtasks: string[],
): ExecutionDeliverable {
  const findings = extractFindings(agentFindings, taskTitle);

  const summary = generateSummary(taskTitle, findings, completedSubtasks);

  return {
    id: newId('del'),
    phaseId,
    title: taskTitle,
    summary,
    agent: agentName,
    createdAt: Date.now(),
    details: formatDetailsAsList(findings),
  };
}

function extractFindings(
  agentOutput: Record<string, unknown>,
  taskTitle: string,
): DeliverableFinding[] {
  const findings: DeliverableFinding[] = [];

  if (agentOutput.findings && typeof agentOutput.findings === 'object') {
    const findingsObj = agentOutput.findings as Record<string, unknown>;
    for (const [key, value] of Object.entries(findingsObj)) {
      if (value === null || value === undefined) continue;

      const normalizedKey = key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

      if (typeof value === 'string') {
        findings.push({
          key: normalizedKey,
          value: value.trim(),
          type: 'text',
          confidence: agentOutput.confidence as 'high' | 'medium' | 'low' | undefined,
        });
      } else if (typeof value === 'number') {
        findings.push({
          key: normalizedKey,
          value,
          type: 'number',
          confidence: agentOutput.confidence as 'high' | 'medium' | 'low' | undefined,
        });
      } else if (Array.isArray(value)) {
        const filtered = value.filter(v => v !== null && v !== undefined && v !== '');
        if (filtered.length > 0) {
          findings.push({
            key: normalizedKey,
            value: filtered.map(v => String(v)),
            type: 'list',
            confidence: agentOutput.confidence as 'high' | 'medium' | 'low' | undefined,
          });
        }
      } else if (typeof value === 'object') {
        findings.push({
          key: normalizedKey,
          value: JSON.stringify(value),
          type: 'text',
          confidence: agentOutput.confidence as 'high' | 'medium' | 'low' | undefined,
        });
      }
    }
  } else if (typeof agentOutput === 'object') {
    for (const [key, value] of Object.entries(agentOutput)) {
      if (key === 'confidence' || key === 'reasoning') continue;
      if (value === null || value === undefined) continue;

      const normalizedKey = key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

      if (typeof value === 'string' && value.trim()) {
        findings.push({
          key: normalizedKey,
          value: value.trim(),
          type: 'text',
        });
      } else if (typeof value === 'number') {
        findings.push({
          key: normalizedKey,
          value,
          type: 'number',
        });
      } else if (Array.isArray(value) && value.length > 0) {
        const filtered = value.filter(v => v !== null && v !== undefined && String(v).trim());
        if (filtered.length > 0) {
          findings.push({
            key: normalizedKey,
            value: filtered.map(v => String(v)),
            type: 'list',
          });
        }
      }
    }
  }

  return findings;
}

function generateSummary(
  taskTitle: string,
  findings: DeliverableFinding[],
  completedSubtasks: string[],
): string {
  const competitors = findings.find(f => f.key.toLowerCase().includes('competitor'));
  const pricing = findings.find(f => f.key.toLowerCase().includes('price') || f.key.toLowerCase().includes('cost'));
  const trend = findings.find(f => f.key.toLowerCase().includes('trend'));
  const legal = findings.find(f => f.key.toLowerCase().includes('license') || f.key.toLowerCase().includes('legal'));
  const gap = findings.find(f => f.key.toLowerCase().includes('gap') || f.key.toLowerCase().includes('opportunity'));
  const customer = findings.find(f => f.key.toLowerCase().includes('customer') || f.key.toLowerCase().includes('persona'));
  const revenue = findings.find(f => f.key.toLowerCase().includes('revenue') || f.key.toLowerCase().includes('margin'));
  const channel = findings.find(f => f.key.toLowerCase().includes('channel') || f.key.toLowerCase().includes('acquisition'));

  if (competitors) {
    if (Array.isArray(competitors.value)) {
      return `Identified ${competitors.value.length} competitors with detailed analysis. Key finding: ${competitors.value.slice(0, 3).join(', ')}.`;
    }
    return `Competitor analysis complete: ${competitors.value}`;
  }

  if (pricing) {
    if (Array.isArray(pricing.value)) {
      return `Pricing research complete. Recommended tiers: ${pricing.value.slice(0, 3).join(', ')}.`;
    }
    return `Pricing analysis: ${pricing.value}`;
  }

  if (legal) {
    if (Array.isArray(legal.value)) {
      return `Compliance requirements identified: ${legal.value.slice(0, 5).join(', ')}.`;
    }
    return `Legal requirements: ${legal.value}`;
  }

  if (gap) {
    if (Array.isArray(gap.value)) {
      return `Market gaps identified: ${gap.value.slice(0, 3).join(', ')}.`;
    }
    return `Opportunity analysis: ${gap.value}`;
  }

  if (customer) {
    if (Array.isArray(customer.value)) {
      return `Customer segments defined: ${customer.value.slice(0, 4).join(', ')}.`;
    }
    return `Customer analysis: ${customer.value}`;
  }

  if (revenue) {
    if (typeof revenue.value === 'string') {
      return `Financial model: ${revenue.value}`;
    }
    return `Revenue analysis complete.`;
  }

  if (channel) {
    if (Array.isArray(channel.value)) {
      return `Acquisition channels: ${channel.value.slice(0, 4).join(', ')}.`;
    }
    return `Channel strategy: ${channel.value}`;
  }

  if (trend) {
    if (Array.isArray(trend.value)) {
      return `Trends identified: ${trend.value.slice(0, 3).join(', ')}.`;
    }
    return `Trend analysis: ${trend.value}`;
  }

  const insight = findings.find(f => f.key.toLowerCase().includes('insight') || f.key.toLowerCase().includes('key'));
  if (insight) {
    return `Key insight: ${typeof insight.value === 'string' ? insight.value : JSON.stringify(insight.value)}`;
  }

  if (findings.length > 0) {
    const first = findings[0];
    if (Array.isArray(first.value)) {
      return `${first.key}: ${first.value.slice(0, 3).join(', ')}${first.value.length > 3 ? '...' : ''}`;
    }
    return `${first.key}: ${first.value}`;
  }

  return `${taskTitle} completed with ${completedSubtasks.length} subtasks processed.`;
}

function formatDetailsAsList(findings: DeliverableFinding[]): string[] {
  const lines: string[] = [];

  for (const finding of findings) {
    const prefix = `• ${finding.key}: `;

    if (Array.isArray(finding.value)) {
      if (finding.value.length <= 5) {
        lines.push(prefix + finding.value.join(', '));
      } else {
        lines.push(prefix + finding.value.slice(0, 3).join(', '));
        lines.push(`  + ${finding.value.length - 3} more items...`);
      }
    } else if (typeof finding.value === 'object') {
      lines.push(prefix + JSON.stringify(finding.value));
    } else {
      lines.push(prefix + String(finding.value));
    }
  }

  return lines;
}

export function generateResearchPhaseDeliverables(
  phaseId: string,
  taskResults: Array<{
    taskId: string;
    taskTitle: string;
    agentName: string;
    findings: Record<string, unknown>;
    completedSubtasks: string[];
  }>,
): ExecutionDeliverable[] {
  return taskResults.map(result =>
    generateDeliverableFromAgentOutput(
      phaseId,
      result.agentName,
      result.taskTitle,
      result.findings,
      result.completedSubtasks,
    ),
  );
}

export function buildDeliverableDetails(
  findings: Record<string, unknown>,
  taskTitle: string,
): string[] {
  const extracted = extractFindings(findings, taskTitle);
  return formatDetailsAsList(extracted);
}

export function formatDeliverableForDisplay(d: ExecutionDeliverable): {
  title: string;
  summary: string;
  sections: Array<{ label: string; value: string | string[] }>;
  agent: string;
  timestamp: string;
} {
  const details = d.details || [];

  const sections: Array<{ label: string; value: string | string[] }> = [];
  let currentSection: { label: string; items: string[] } | null = null;

  for (const line of details) {
    if (line.startsWith('• ')) {
      const rest = line.slice(2);
      const colonIdx = rest.indexOf(':');

      if (colonIdx > 0) {
        const label = rest.slice(0, colonIdx).trim();
        const value = rest.slice(colonIdx + 1).trim();

        if (value.includes(',')) {
          sections.push({ label, value: value.split(',').map(s => s.trim()).filter(Boolean) });
        } else {
          sections.push({ label, value });
        }
      } else {
        sections.push({ label: 'Detail', value: rest });
      }
    } else if (line.startsWith('  + ')) {
      if (currentSection) {
        currentSection.items.push(line.trim());
      }
    }
  }

  const date = new Date(d.createdAt);
  const timestamp = date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

  return {
    title: d.title,
    summary: d.summary,
    sections,
    agent: d.agent,
    timestamp,
  };
}