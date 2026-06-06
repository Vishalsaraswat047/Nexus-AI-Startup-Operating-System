import type { BusinessTwin, Milestone, RiskItem, DepartmentState, AgentWorkforce } from '../types';

export function computeHealthScore(
  twin: BusinessTwin,
  milestones: Milestone[],
  departments: DepartmentState[],
): number | null {
  const { revenue, expenses, budget } = twin;
  if (expenses === 0 && revenue === 0) return null;

  let score = 50;
  if (expenses > 0) {
    if (revenue >= expenses) {
      score += 30;
    } else {
      const netBurn = expenses - revenue;
      const runway = budget / netBurn;
      if (runway >= 12) score += 30;
      else if (runway >= 6) score += 20;
      else if (runway >= 3) score += 10;
      else score -= 15;
    }
  }
  if (milestones.length > 0) {
    const avg = milestones.reduce((s, m) => s + (m.progress || 0), 0) / milestones.length;
    score += Math.round((avg / 100) * 20);
  }
  const active = departments.filter((d) => d.status === 'active').length;
  score += Math.round((active / Math.max(departments.length, 1)) * 10);
  return Math.min(Math.max(score, 10), 100);
}

export function computeRunwayLabel(twin: BusinessTwin): string {
  const { revenue, expenses, budget } = twin;
  if (expenses === 0) return 'Requires financial data';
  if (revenue >= expenses) return 'Infinite (Profitable)';
  if (budget === 0) return 'Requires cash budget';
  const months = budget / (expenses - revenue);
  return `${months.toFixed(1)} Months`;
}

export function computeBurnRate(twin: BusinessTwin): number {
  return Math.max(twin.expenses - twin.revenue, 0);
}

export function goalsOnTrack(milestones: Milestone[]): number {
  return milestones.filter((m) => m.status === 'in_progress' || m.progress >= 50).length;
}

export function activeGoalsCount(twin: BusinessTwin, milestones: Milestone[]): number {
  if (milestones.length > 0) return milestones.length;
  return twin.goals?.length ?? 0;
}

export function deriveProjectsFromMilestones(milestones: Milestone[]) {
  const map: Record<string, { name: string; progress: number; count: number; team: string }> = {};
  milestones.forEach((m) => {
    const name = m.project || 'Operations';
    if (!map[name]) {
      map[name] = {
        name,
        progress: 0,
        count: 0,
        team: m.tasks?.[0]?.assignee?.replace(/Agent/g, '').trim() || 'Core',
      };
    }
    map[name].progress += m.progress || 0;
    map[name].count += 1;
  });
  return Object.values(map).map((p) => ({
    ...p,
    progress: Math.round(p.progress / p.count),
  }));
}

export function formatCurrency(n: number): string {
  return `$${n.toLocaleString()}`;
}

export function formatRelativeTime(logLine: string, index: number): string {
  if (index === 0) return 'Just now';
  if (index === 1) return '2 min ago';
  if (index === 2) return '18 min ago';
  if (index === 3) return '1 hr ago';
  return `${index + 1} hrs ago`;
}

export const STAGE_TIMELINE = [
  { id: 'Idea', icon: 'lightbulb', label: 'Idea' },
  { id: 'Validation', icon: 'search', label: 'Research' },
  { id: 'MVP', icon: 'verified', label: 'Validation' },
  { id: 'Launch', icon: 'code', label: 'MVP Build' },
  { id: 'Growth', icon: 'rocket', label: 'Launch' },
  { id: 'Scale', icon: 'trending_up', label: 'Growth' },
  { id: 'Scale+', icon: 'flag', label: 'Scale' },
] as const;

export function stageIndex(stage: string): number {
  const order = ['Idea', 'Validation', 'MVP', 'Launch', 'Growth', 'Scale'];
  const i = order.indexOf(stage);
  return i >= 0 ? i : 0;
}

export function riskSeverityColor(severity: RiskItem['severity']): string {
  if (severity === 'high') return 'red';
  if (severity === 'medium') return 'orange';
  return 'amber';
}
