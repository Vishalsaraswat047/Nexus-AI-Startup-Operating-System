export type VisionStep =
  | 'not_started'
  | 'awaiting_ceo_task'
  | 'ceo_approval'
  | 'ceo_active'
  | 'research_approval'
  | 'research_active'
  | 'vision_complete';

export interface ActivityEntry {
  id: string;
  agent: string;
  department: string;
  message: string;
  timestamp: number;
  kind: 'info' | 'working' | 'output' | 'approval';
}

export interface VisionWorkflowState {
  step: VisionStep;
  ceoTask: string;
  researchBrief: string;
  outputs: string[];
  activity: ActivityEntry[];
}

export const VISION_STEP_LABELS: Record<VisionStep, string> = {
  not_started: 'Ready',
  awaiting_ceo_task: 'Define CEO directive',
  ceo_approval: 'CEO awaiting approval',
  ceo_active: 'CEO executing',
  research_approval: 'Research awaiting approval',
  research_active: 'Research executing',
  vision_complete: 'Initial vision cycle complete',
};

export function createInitialVisionWorkflow(): VisionWorkflowState {
  return {
    step: 'not_started',
    ceoTask: '',
    researchBrief: '',
    outputs: [],
    activity: [],
  };
}

export function loadVisionWorkflow(): VisionWorkflowState {
  try {
    const raw = localStorage.getItem('nexus_vision_workflow');
    if (raw) {
      return { ...createInitialVisionWorkflow(), ...JSON.parse(raw) };
    }
  } catch {
    /* use default */
  }
  return createInitialVisionWorkflow();
}

export function saveVisionWorkflow(state: VisionWorkflowState): void {
  localStorage.setItem('nexus_vision_workflow', JSON.stringify(state));
}

export function appendActivity(
  state: VisionWorkflowState,
  entry: Omit<ActivityEntry, 'id' | 'timestamp'> & { timestamp?: number },
): VisionWorkflowState {
  const activity: ActivityEntry[] = [
    {
      id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      timestamp: entry.timestamp ?? Date.now(),
      agent: entry.agent,
      department: entry.department,
      message: entry.message,
      kind: entry.kind,
    },
    ...state.activity,
  ].slice(0, 40);
  return { ...state, activity };
}

export function isVisionReady(workflow?: VisionWorkflowState): boolean {
  return !workflow || workflow.step === 'vision_complete';
}

export function stepProgress(step: VisionStep): number {
  const order: VisionStep[] = [
    'not_started',
    'awaiting_ceo_task',
    'ceo_approval',
    'ceo_active',
    'research_approval',
    'research_active',
    'vision_complete',
  ];
  const idx = order.indexOf(step);
  return Math.round((idx / (order.length - 1)) * 100);
}
