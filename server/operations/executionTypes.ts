export type SubtaskStatus = 'queued' | 'running' | 'blocked' | 'completed' | 'failed';
export type PhaseStatus = 'pending' | 'running' | 'completed' | 'awaiting_choice';
export type ExecutionStatus =
  | 'idle'
  | 'running'
  | 'awaiting_user'
  | 'completed';

export type AgentExecutionState = 'idle' | 'queued' | 'running' | 'blocked' | 'waiting_approval' | 'completed' | 'failed';

export interface AgentState {
  agentId: string;
  name: string;
  state: AgentExecutionState;
  currentTaskId?: string;
  currentTaskTitle?: string;
  startedAt?: number;
  completedAt?: number;
  lastOutput?: string;
  findings?: Record<string, unknown>;
  blockedReason?: string;
}

export interface BrandDiscoveryAnswers {
  mainBrandValues: string;
  whatsNew: string;
  brandPersonality: string;
  taglineOrVision: string;
  submittedAt: number;
}

export interface ExecutionSubtask {
  id: string;
  title: string;
  status: SubtaskStatus;
}

export interface ExecutionTask {
  id: string;
  phaseId: string;
  title: string;
  assignee: string;
  department: string;
  status: SubtaskStatus;
  subtasks: ExecutionSubtask[];
  blockedReason?: string;
  startedAt?: number;
  completedAt?: number;
  dependencies: string[];
  output?: string;
  findings?: Record<string, unknown>;
}

export interface ExecutionPhase {
  id: string;
  key: string;
  name: string;
  department: string;
  status: PhaseStatus;
  order: number;
}

export interface ExecutionDeliverable {
  id: string;
  phaseId: string;
  title: string;
  summary: string;
  agent: string;
  createdAt: number;
  /** Completed research units / findings for this deliverable */
  details?: string[];
}

export interface NextStepOption {
  id: string;
  phaseKey: string;
  label: string;
  description: string;
  reason?: string;
  departments?: string[];
  isPrimary?: boolean;
  /** "direct" creates revenue, "enabling" unblocks revenue, "indirect" supports brand/awareness. */
  revenueImpact?: 'direct' | 'indirect' | 'enabling';
  /** True if not doing this blocks launch / first-revenue. */
  blocksLaunch?: boolean;
  /** ROI for the founder right now. */
  roi?: 'high' | 'medium' | 'low';
  /** True for operational decisions, false for cosmetic / dashboard work. */
  isOperational?: boolean;
}

export interface CeoRecommendationView {
  completedSummary: string;
  learned: string;
  blocked: string;
  nextStep: string;
  reason: string;
  departments: string[];
  /** What concretely creates revenue from doing this next step. */
  revenueDriver?: string;
  /** What this step unblocks for launch. */
  launchUnblocker?: string;
  /** Why this is the highest-ROI move right now. */
  highestRoi?: string;
}

export interface ExecutionGraph {
  status: ExecutionStatus;
  objective: string;
  location: string;
  targetCustomers: string;
  timelineDays: number;
  currentPhaseId: string | null;
  phases: ExecutionPhase[];
  tasks: ExecutionTask[];
  deliverables: ExecutionDeliverable[];
  recommendations: NextStepOption[];
  activeAgents: string[];
  activeDepartments: string[];
  lastTickAt: number;
  startedAt: number;
  brandDiscovery: BrandDiscoveryAnswers | null;
  ceoRecommendation?: CeoRecommendationView | null;
  autoRunAll?: boolean;
  continuousMode?: boolean;
  continuousTasks?: ExecutionTask[];
  continuousDirectives?: ContinuousDirective[];
  continuousRound?: number;
  agentStates: Record<string, AgentState>;
}

export interface ContinuousDirective {
  id: string;
  title: string;
  rationale: string;
  department: string;
  assignee: string;
  createdAt: number;
  status: 'pending' | 'running' | 'completed' | 'failed';
  completedAt?: number;
  outputSummary?: string;
}

export interface PhaseProgressStats {
  phaseId: string;
  phaseName: string;
  total: number;
  completed: number;
  running: number;
  blocked: number;
  queued: number;
  progress: number;
  /** Includes partial credit for running subtasks so UI is not stuck at 0% */
  displayProgress: number;
  status: PhaseStatus;
}

export interface ExecutionView {
  execution: ExecutionGraph;
  currentPhase: ExecutionPhase | null;
  phaseProgress: PhaseProgressStats | null;
  allPhasesProgress: PhaseProgressStats[];
  runningAgents: string[];
  blockedTasks: ExecutionTask[];
  pendingApprovalsCount: number;
  agentStates: Record<string, AgentState>;
  queuedTasks: ExecutionTask[];
  waitingTasks: ExecutionTask[];
}
