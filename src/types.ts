export interface BusinessTwin {
  name: string;
  industry: string;
  website: string;
  stage: string;
  teamSize: number;
  revenue: number;
  expenses: number;
  budget: number;
  customers: number;
  funding: string;
  goals: string[];
  challenges: string[];
  tools: string[];
  health: number;
}

export interface TaskItem {
  id: string;
  name: string;
  assignee: string;
  status: 'todo' | 'in_progress' | 'completed' | 'failed';
  weight: number; // contribution to milestones
}

export interface Milestone {
  id: string;
  name: string;
  project: string;
  status: 'pending' | 'in_progress' | 'completed';
  progress: number;
  tasks: TaskItem[];
  dependencies: string[];
}

export interface DepartmentState {
  id: string;
  name: string;
  status: 'active' | 'paused' | 'disabled';
  agentCount: number;
  activity: string;
  brief: string;
}

export interface AgentWorkforce {
  id: string;
  name: string;
  role: string;
  department: string;
  status: 'working' | 'waiting' | 'standby';
  currentTask: string;
  workload: 'low' | 'medium' | 'high';
  rating: number;
  avatarColor: string;
  deliverables: string[];
  activityLog: string[];
  /** NVIDIA NIM model pool assignment */
  assignedModel?: string;
  modelLabel?: string;
}

export interface RiskItem {
  id: string;
  category: 'Budget' | 'Growth' | 'Technical' | 'Operational' | 'Legal';
  severity: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  status: 'triggered' | 'mitigated' | 'monitoring';
  actionTaken: string;
}

export interface CorporateMemory {
  strategic: string[];
  operational: string[];
  learning: string[];
  business: string[];
  customer: string[];
  failure: string[];
}

export interface BusinessInsight {
  id: string;
  category: 'strategy' | 'finance' | 'operations' | 'marketing';
  title: string;
  text: string;
  impactScore: number; // 0-100
}

export interface OperationalState {
  twin: BusinessTwin | null;
  milestones: Milestone[];
  departments: DepartmentState[];
  workforce: AgentWorkforce[];
  risks: RiskItem[];
  insights: BusinessInsight[];
  memory: CorporateMemory;
  approvedLogs: string[];
  executionMode: 'advisory' | 'approval' | 'autonomous';
}
