export type AppTab =
  | 'dashboard'
  | 'goals'
  | 'projects'
  | 'timeline'
  | 'departments'
  | 'workforce'
  | 'reports'
  | 'memory'
  | 'market'
  | 'analytics'
  | 'integrations'
  | 'settings'
  | 'admin'
  | 'operations'
  | 'chat'
  | 'profile';

export const TAB_LABELS: Record<AppTab, { title: string; subtitle: string }> = {
  dashboard: { title: 'Execution Center', subtitle: 'Live company execution' },
  goals: { title: 'Strategic Goals', subtitle: 'Q2 Planning Cycle' },
  projects: { title: 'Projects', subtitle: 'Pipeline and delivery tracking' },
  timeline: { title: 'Timeline', subtitle: 'Execution roadmap' },
  departments: { title: 'Departments', subtitle: 'Organizational units' },
  workforce: { title: 'AI Workforce', subtitle: 'Autonomous agent roster' },
  reports: { title: 'Reports', subtitle: 'Executive summaries' },
  memory: { title: 'Knowledge Base', subtitle: 'Corporate memory streams' },
  market: { title: 'Market & Research', subtitle: 'Competitive intelligence' },
  analytics: { title: 'Analytics', subtitle: 'Performance metrics' },
  integrations: { title: 'Integrations', subtitle: 'Connected tools' },
  settings: { title: 'Settings', subtitle: 'Workspace configuration' },
  admin: { title: 'Admin Center', subtitle: 'System administration' },
  operations: { title: 'Operations Engine', subtitle: 'Task bus, events, approvals, workflows' },
  chat: { title: 'Executive Chat', subtitle: 'C-suite channels' },
  profile: { title: 'Profile', subtitle: 'Operator identity & session' },
};
