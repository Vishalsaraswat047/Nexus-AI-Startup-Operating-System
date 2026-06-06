import type {
  ExecutionGraph,
  ExecutionPhase,
  ExecutionTask,
  ExecutionSubtask,
  ExecutionDeliverable,
  NextStepOption,
  PhaseProgressStats,
  ExecutionView,
  BrandDiscoveryAnswers,
  AgentState,
  AgentExecutionState,
} from './executionTypes';
import { getCompanyState, updateCompanyState } from './store';
import { createCeoObjective, createCooPlanFromObjective } from './ceoCoo';
import { appendEvent, logAgentAction } from './eventLog';
import { assignTask, completeTask } from './taskBus';
import { writeMemory } from './memoryOps';
import { listPendingApprovals } from './approvalPolicy';
import { generateCeoRecommendation, recommendationsFromCeo } from './ceoRecommendation';
import { getBusinessProfile } from './businessProfile';
import {
  PHASE_CATALOG,
  phaseDefsForCategory,
  tasksForPhase,
  type PhaseKey,
  type PhaseTaskDef,
} from './businessPlaybook';
import {
  executeAgentTask,
  getDepartmentForAgent,
  trackAgentTask,
  removeAgentTask,
  getAgentTaskStatus,
  type AgentTaskOutput,
} from './agentExecutor';
import {
  generateDeliverableFromAgentOutput,
  generateResearchPhaseDeliverables,
} from './deliverableGenerator';

function newId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function buildSubtasks(titles: string[]): ExecutionSubtask[] {
  return titles.map((title, i) => ({
    id: newId('sub'),
    title,
    status: i === 0 ? 'queued' : 'queued',
  }));
}

function buildPhaseTasksFromDefs(
  phaseId: string,
  department: string,
  defs: PhaseTaskDef[],
  existingTasks: ExecutionTask[] = [],
): ExecutionTask[] {
  return defs.map((t) => {
    const existing = existingTasks.find(ex => ex.title === t.title && ex.phaseId === phaseId);
    if (existing) return existing;

    const subtasks = buildSubtasks(t.subs);
    return {
      id: newId('ext'),
      phaseId,
      title: t.title,
      assignee: t.assignee,
      department,
      status: 'queued' as const,
      subtasks,
      dependencies: [],
      startedAt: undefined,
      completedAt: undefined,
    };
  });
}

function taskRollupStatus(subtasks: ExecutionSubtask[]): ExecutionTask['status'] {
  if (subtasks.every((s) => s.status === 'completed')) return 'completed';
  if (subtasks.some((s) => s.status === 'blocked')) return 'blocked';
  if (subtasks.some((s) => s.status === 'failed')) return 'failed';
  if (subtasks.some((s) => s.status === 'running')) return 'running';
  return 'queued';
}

function pickNextPhaseForAutoRun(
  phases: ExecutionPhase[],
  currentKey: string,
): ExecutionPhase | null {
  const order: PhaseKey[] = [
    'research',
    'business_model',
    'pricing',
    'operations',
    'hiring',
    'sales',
    'customer_acquisition',
    'brand',
    'website',
    'social',
    'listings',
    'scaling',
  ];
  const currentIdx = order.indexOf(currentKey as PhaseKey);
  if (currentIdx < 0) return null;
  for (let i = currentIdx + 1; i < order.length; i++) {
    const candidate = phases.find((p) => p.key === order[i]);
    if (candidate && candidate.status === 'pending') return candidate;
  }
  return null;
}

export function computePhaseProgress(phase: ExecutionPhase, tasks: ExecutionTask[]): PhaseProgressStats {
  const phaseTasks = tasks.filter((t) => t.phaseId === phase.id);
  let total = 0;
  let completed = 0;
  let running = 0;
  let blocked = 0;
  let queued = 0;
  for (const t of phaseTasks) {
    for (const s of t.subtasks) {
      total++;
      if (s.status === 'completed') completed++;
      else if (s.status === 'running') running++;
      else if (s.status === 'blocked') blocked++;
      else queued++;
    }
  }
  return {
    phaseId: phase.id,
    phaseName: phase.name,
    total,
    completed,
    running,
    blocked,
    queued,
    progress: total > 0 ? Math.round((completed / total) * 100) : 0,
    displayProgress:
      total > 0
        ? Math.max(
            completed > 0 ? Math.round((completed / total) * 100) : 0,
            running > 0 ? Math.max(1, Math.round(((completed + running * 0.35) / total) * 100)) : 0,
          )
        : 0,
    status: phase.status,
  };
}

function categoryForCompany(companyId: string): string {
  const profile = getBusinessProfile(companyId);
  return profile?.category ?? 'Other';
}

function initializeAgentStates(taskAssignees: string[]): Record<string, AgentState> {
  const states: Record<string, AgentState> = {};
  for (const name of taskAssignees) {
    const id = name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    states[name] = {
      agentId: id,
      name,
      state: 'idle',
    };
  }
  return states;
}

function updateAgentState(
  states: Record<string, AgentState>,
  agentName: string,
  newState: AgentExecutionState,
  extra?: Partial<AgentState>,
): Record<string, AgentState> {
  const id = agentName.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
  return {
    ...states,
    [agentName]: {
      ...(states[agentName] || { agentId: id, name: agentName, state: 'idle' as AgentExecutionState }),
      ...extra,
      state: newState,
    },
  };
}

export function buildExecutionView(companyId: string): ExecutionView | null {
  const state = getCompanyState(companyId);
  const raw = state.execution;
  if (!raw) return null;

  const category = categoryForCompany(companyId);
  const continuousTasks = raw.continuousTasks ?? [];
  const allTasks = [...raw.tasks, ...continuousTasks];
  const agentStates = raw.agentStates || {};

  const currentPhase = raw.phases.find((p) => p.id === raw.currentPhaseId) ?? null;
  const allPhasesProgress = raw.phases.map((p) => computePhaseProgress(p, raw.tasks));
  const phaseProgress = currentPhase
    ? computePhaseProgress(currentPhase, raw.tasks)
    : null;

  const runningAgents = [
    ...new Set(
      allTasks
        .filter((t) => t.status === 'running')
        .map((t) => t.assignee),
    ),
  ];

  const blockedTasks = allTasks.filter((t) => t.status === 'blocked');
  const queuedTasks = allTasks.filter((t) => t.status === 'queued');
  const waitingTasks = allTasks.filter(
    (t) => t.status === 'queued' && t.dependencies.length > 0,
  );

  return {
    execution: raw,
    currentPhase,
    phaseProgress,
    allPhasesProgress,
    runningAgents,
    blockedTasks,
    pendingApprovalsCount: listPendingApprovals(companyId).length,
    agentStates,
    queuedTasks,
    waitingTasks,
  };
}

function recommendationsAfterPhase(
  companyId: string,
  phaseKey: string,
  execution: ExecutionGraph,
): { recommendations: NextStepOption[]; ceoRecommendation: ReturnType<typeof generateCeoRecommendation> } {
  const profile = getBusinessProfile(companyId);
  const ceoRec = generateCeoRecommendation(companyId, phaseKey, execution, {
    category: profile?.category,
    stage: profile?.stage,
    objective: execution.objective,
    location: execution.location,
  });
  return {
    recommendations: recommendationsFromCeo(ceoRec),
    ceoRecommendation: ceoRec,
  };
}

function buildPhasesForCategory(category: string): ExecutionPhase[] {
  const defs = phaseDefsForCategory(category);
  return defs.map((p) => ({
    id: newId('phase'),
    key: p.key,
    name: p.name,
    department: p.department,
    order: p.order,
    status: p.key === 'research' ? 'running' : 'pending',
  }));
}

function getExistingFindings(execution: ExecutionGraph, phaseId: string): Record<string, unknown> {
  const phaseDeliverables = execution.deliverables.filter((d) => d.phaseId === phaseId);
  const findings: Record<string, unknown> = {};

  for (const del of phaseDeliverables) {
    const title = del.title.toLowerCase().replace(/\s+/g, '_');
    findings[title] = {
      summary: del.summary,
      details: del.details,
      agent: del.agent,
    };
  }

  return findings;
}

async function executeTaskWithAgent(
  companyId: string,
  task: ExecutionTask,
  phase: ExecutionPhase,
  execution: ExecutionGraph,
  category: string,
): Promise<ExecutionTask> {
  const runningSubtask = task.subtasks.find((s) => s.status === 'queued' || s.status === 'running');

  if (!runningSubtask) {
    return { ...task, status: taskRollupStatus(task.subtasks) };
  }

  runningSubtask.status = 'running';

  trackAgentTask(task.id, {
    taskId: task.id,
    agentId: task.assignee.toLowerCase().replace(/\s+/g, '_'),
    agentName: task.assignee,
    startedAt: Date.now(),
    subtaskId: runningSubtask.id,
  });

  const existingFindings = getExistingFindings(execution, phase.id);

  const result: AgentTaskOutput = await executeAgentTask(companyId, {
    taskId: task.id,
    agentId: task.assignee.toLowerCase().replace(/\s+/g, '_'),
    agentName: task.assignee,
    taskTitle: task.title,
    subtaskTitle: runningSubtask.title,
    context: {
      objective: execution.objective,
      location: execution.location,
      targetCustomers: execution.targetCustomers,
      category,
      phase: phase.name,
      existingFindings,
    },
  });

  removeAgentTask(task.id);

  runningSubtask.status = result.status === 'completed' ? 'completed' : 'failed';

  const allSubtasksDone = task.subtasks.every((s) => s.status === 'completed');

  const nextQueued = task.subtasks.find((s) => s.status === 'queued');
  if (nextQueued && result.status === 'completed') {
    nextQueued.status = 'running';
  }

  const updatedTask: ExecutionTask = {
    ...task,
    subtasks: [...task.subtasks],
    status: allSubtasksDone ? 'completed' : taskRollupStatus(task.subtasks),
    completedAt: allSubtasksDone ? Date.now() : undefined,
    output: result.output,
    findings: result.findings,
  };

  if (allSubtasksDone) {
    const bus = getCompanyState(companyId).tasks.find((t) => t.title === task.title);
    if (bus) completeTask(companyId, bus.id, task.assignee, task.department);
  }

  return updatedTask;
}

export function startExecution(
  companyId: string,
  params: {
    directive: string;
    twin: Record<string, unknown>;
    location: string;
    targetCustomers: string;
    timelineDays: number;
  },
): ExecutionView {
  const objective = createCeoObjective(companyId, params.directive, params.twin);
  createCooPlanFromObjective(companyId, objective.id);

  const category = categoryForCompany(companyId);
  const phases = buildPhasesForCategory(category);

  const research = phases.find((p) => p.key === 'research')!;
  const researchDefs = tasksForPhase('research', category);
  const tasks = buildPhaseTasksFromDefs(research.id, research.department, researchDefs);

  const taskAssignees = [...new Set(tasks.map((t) => t.assignee))];
  const agentStates = initializeAgentStates(taskAssignees);

  if (tasks.length > 0) {
    tasks[0].subtasks[0].status = 'running';
    tasks[0].status = 'running';
    tasks[0].startedAt = Date.now();
    agentStates[tasks[0].assignee] = {
      ...agentStates[tasks[0].assignee],
      state: 'running',
      currentTaskId: tasks[0].id,
      currentTaskTitle: tasks[0].title,
      startedAt: Date.now(),
    };

    assignTask(companyId, {
      title: tasks[0].title,
      assignee: tasks[0].assignee,
      department: tasks[0].department,
      project: params.directive,
      fromAgent: 'COO Agent',
    });
  }

  const execution: ExecutionGraph = {
    status: 'running',
    objective: params.directive,
    location: params.location,
    targetCustomers: params.targetCustomers,
    timelineDays: params.timelineDays,
    currentPhaseId: research.id,
    phases,
    tasks,
    deliverables: [],
    recommendations: [],
    activeAgents: taskAssignees,
    activeDepartments: ['Research Division', 'Executive Layer', 'Autonomous Control Unit'],
    lastTickAt: Date.now(),
    startedAt: Date.now(),
    brandDiscovery: null,
    continuousMode: false,
    continuousTasks: [],
    continuousDirectives: [],
    continuousRound: 0,
    agentStates,
  };

  updateCompanyState(companyId, (s) => ({ ...s, execution }));

  appendEvent(companyId, {
    type: 'agent_action',
    fromAgent: 'COO Agent',
    department: 'Executive Layer',
    message: `Execution started for ${category} business: ${params.directive}. Research phase initiated.`,
    payload: { phase: 'research', taskCount: tasks.length, category },
  });

  writeMemory(companyId, {
    type: 'operational',
    content: `Execution started: ${params.directive} | ${params.location} | ${params.targetCustomers}`,
    agent: 'COO Agent',
  });

  logAgentAction(companyId, 'Market Research Agent', 'Research Division', 'Research phase initiated.');

  return buildExecutionView(companyId)!;
}

export async function tickExecution(companyId: string): Promise<ExecutionView | null> {
  const state = getCompanyState(companyId);
  const execution = state.execution;
  if (!execution) return buildExecutionView(companyId);

  if (execution.status !== 'running' || !execution.currentPhaseId) {
    return buildExecutionView(companyId);
  }

  const phase = execution.phases.find((p) => p.id === execution.currentPhaseId);
  if (!phase || phase.status !== 'running') return buildExecutionView(companyId);

  const category = categoryForCompany(companyId);
  let tasks = [...execution.tasks];
  let deliverables = [...execution.deliverables];
  let agentStates = { ...execution.agentStates };
  let anyTaskUpdated = false;

  for (let i = 0; i < tasks.length; i++) {
    const task = tasks[i];
    if (task.phaseId !== phase.id) continue;
    if (task.status === 'completed' || task.status === 'failed' || task.status === 'blocked') continue;

    const depsSatisfied = task.dependencies.every((depId) => {
      const dep = tasks.find((t) => t.id === depId);
      return dep && dep.status === 'completed';
    });

    if (!depsSatisfied) {
      task.status = 'blocked';
      task.blockedReason = 'Waiting for dependencies to complete';
      agentStates = updateAgentState(agentStates, task.assignee, 'blocked', {
        blockedReason: 'Waiting for dependencies',
      });
      continue;
    }

    const hasRunningSubtask = task.subtasks.some((s) => s.status === 'running');
    const hasQueuedSubtask = task.subtasks.some((s) => s.status === 'queued');

    if (hasRunningSubtask) {
      const runningSubtask = task.subtasks.find((s) => s.status === 'running');
      const agentStatus = getAgentTaskStatus(task.id);

      if (!agentStatus) {
        const updatedTask = await executeTaskWithAgent(companyId, task, phase, execution, category);
        tasks[i] = updatedTask;
        anyTaskUpdated = true;

        if (updatedTask.findings) {
          const deliverable = generateDeliverableFromAgentOutput(
            phase.id,
            task.assignee,
            task.title,
            updatedTask.findings,
            task.subtasks.filter((s) => s.status === 'completed').map((s) => s.title),
          );

          const exists = deliverables.some((d) => d.title === task.title);
          if (!exists) {
            deliverables = [deliverable, ...deliverables];
          }
        }

        agentStates = updateAgentState(agentStates, task.assignee, updatedTask.status === 'completed' ? 'completed' : 'running', {
          currentTaskId: updatedTask.id,
          currentTaskTitle: updatedTask.title,
          findings: updatedTask.findings,
          completedAt: updatedTask.completedAt,
        });
      }
    } else if (hasQueuedSubtask && task.status !== 'running') {
      const firstQueued = task.subtasks.find((s) => s.status === 'queued');
      if (firstQueued) {
        firstQueued.status = 'running';
        task.status = 'running';
        task.startedAt = Date.now();
        agentStates = updateAgentState(agentStates, task.assignee, 'running', {
          currentTaskId: task.id,
          currentTaskTitle: task.title,
          startedAt: Date.now(),
        });
        anyTaskUpdated = true;

        assignTask(companyId, {
          title: task.title,
          assignee: task.assignee,
          department: task.department,
          project: execution.objective,
          fromAgent: 'COO Agent',
        });
      }
    }
  }

  const phaseTasks = tasks.filter((t) => t.phaseId === phase.id);
  const allComplete = phaseTasks.every((t) => t.status === 'completed');

  let status: ExecutionGraph['status'] = execution.status;
  let recommendations = execution.recommendations;
  let ceoRecommendation = execution.ceoRecommendation ?? null;
  let phases = [...execution.phases];
  let currentPhaseId = execution.currentPhaseId;
  let activeAgents = [
    ...new Set(phaseTasks.filter((t) => t.status === 'running').map((t) => t.assignee)),
  ];
  let autoRunAll = execution.autoRunAll ?? false;

  if (allComplete && phase.status === 'running') {
    phases = phases.map((p) =>
      p.id === phase.id ? { ...p, status: 'completed' as const } : p,
    );

    for (const agentName of activeAgents) {
      agentStates = updateAgentState(agentStates, agentName, 'completed', {
        completedAt: Date.now(),
      });
    }

    const researchTaskResults = phaseTasks.map((t) => ({
      taskId: t.id,
      taskTitle: t.title,
      agentName: t.assignee,
      findings: t.findings || {},
      completedSubtasks: t.subtasks.filter((s) => s.status === 'completed').map((s) => s.title),
    }));

    const newDeliverables = generateResearchPhaseDeliverables(phase.id, researchTaskResults);
    const existingTitles = new Set(deliverables.map((d) => d.title));
    const uniqueNew = newDeliverables.filter((d) => !existingTitles.has(d.title));
    deliverables = [...uniqueNew, ...deliverables];

    const recBundle = recommendationsAfterPhase(companyId, phase.key, {
      ...execution,
      phases,
      tasks,
      deliverables,
    });
    recommendations = recBundle.recommendations;
    ceoRecommendation = {
      completedSummary: recBundle.ceoRecommendation.completedSummary,
      learned: recBundle.ceoRecommendation.learned,
      blocked: recBundle.ceoRecommendation.blocked,
      nextStep: recBundle.ceoRecommendation.nextStep,
      reason: recBundle.ceoRecommendation.reason,
      departments: recBundle.ceoRecommendation.departments,
      revenueDriver: recBundle.ceoRecommendation.revenueDriver,
      launchUnblocker: recBundle.ceoRecommendation.launchUnblocker,
      highestRoi: recBundle.ceoRecommendation.highestRoi,
    };

    currentPhaseId = null;
    activeAgents = [];

    writeMemory(companyId, {
      type: 'learning',
      content: `${phase.name} completed with ${phaseTasks.length} tasks delivering ${uniqueNew.length} findings for ${category} business.`,
      agent: 'COO Agent',
    });

    if (autoRunAll) {
      const nextPhase = pickNextPhaseForAutoRun(phases, phase.key);
      if (nextPhase) {
        const nextDefs = tasksForPhase(nextPhase.key as PhaseKey, category);
        const existingPhaseTasks = tasks.filter((t) => t.phaseId === nextPhase.id);
        const nextTasks = buildPhaseTasksFromDefs(nextPhase.id, nextPhase.department, nextDefs, existingPhaseTasks);

        const newTasks = nextTasks.filter((nt) => !existingPhaseTasks.some((et) => et.title === nt.title));

        for (const newTask of newTasks) {
          if (newTasks.indexOf(newTask) === 0 && newTask.subtasks.length > 0) {
            newTask.subtasks[0].status = 'running';
            newTask.status = 'running';
            newTask.startedAt = Date.now();
            agentStates = updateAgentState(agentStates, newTask.assignee, 'running', {
              currentTaskId: newTask.id,
              currentTaskTitle: newTask.title,
              startedAt: Date.now(),
            });

            assignTask(companyId, {
              title: newTask.title,
              assignee: newTask.assignee,
              department: newTask.department,
              project: execution.objective,
              fromAgent: 'COO Agent',
            });
          }
        }

        tasks = [...tasks, ...newTasks];
        phases = phases.map((p) =>
          p.id === nextPhase.id ? { ...p, status: 'running' as const } : p,
        );
        currentPhaseId = nextPhase.id;
        status = 'running';
        recommendations = [];
        ceoRecommendation = null;
        activeAgents = [...new Set(newTasks.map((t) => t.assignee))];

        const newAssignees = [...new Set(newTasks.map((t) => t.assignee))];
        for (const name of newAssignees) {
          if (!agentStates[name]) {
            const id = name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
            agentStates[name] = { agentId: id, name, state: 'idle' };
          }
        }

        const deptSet = new Set(execution.activeDepartments);
        deptSet.add(nextPhase.department);
        appendEvent(companyId, {
          type: 'agent_action',
          fromAgent: 'COO Agent',
          department: nextPhase.department,
          message: `Auto-advancing to ${nextPhase.name} (full autonomous run)`,
          payload: { phaseKey: nextPhase.key, category },
        });
      } else {
        status = 'completed';
        autoRunAll = false;
        appendEvent(companyId, {
          type: 'workflow_step',
          fromAgent: 'CEO Agent',
          department: 'Executive Layer',
          message: `All phases complete — continuous brand operations engaged.`,
          payload: { category },
        });
        writeMemory(companyId, {
          type: 'learning',
          content: `Autonomous run finished: ${phases.length} phases completed.`,
          agent: 'CEO Agent',
        });
      }
    } else {
      status = 'awaiting_user';
      appendEvent(companyId, {
        type: 'workflow_step',
        fromAgent: phase.key === 'research' ? 'CEO Agent' : 'Marketing Manager Agent',
        department: phase.key === 'research' ? 'Executive Layer' : 'Research Division',
        message:
          phase.key === 'research'
            ? `Market research complete — ${uniqueNew.length} findings produced. CEO recommends ${recommendations[0]?.label ?? 'next step'}`
            : `${phase.name} complete — choose next business-critical step`,
        payload: { recommendations: recommendations.map((r) => r.label), deliverablesCount: uniqueNew.length },
      });
    }
  }

  const updated: ExecutionGraph = {
    ...execution,
    status,
    tasks,
    phases,
    deliverables,
    recommendations,
    ceoRecommendation,
    currentPhaseId,
    activeAgents,
    autoRunAll,
    lastTickAt: Date.now(),
    agentStates,
  };

  updateCompanyState(companyId, (s) => ({ ...s, execution: updated }));
  return buildExecutionView(companyId);
}

export function chooseNextPhase(companyId: string, phaseKey: string): ExecutionView | null {
  const state = getCompanyState(companyId);
  const execution = state.execution;
  if (!execution) return null;

  const phase = execution.phases.find((p) => p.key === phaseKey);
  if (!phase) return null;

  const researchDone = execution.phases.some(
    (p) => p.key === 'research' && p.status === 'completed',
  );
  if (phaseKey === 'brand' && researchDone && !execution.brandDiscovery) {
    return buildExecutionView(companyId);
  }

  const category = categoryForCompany(companyId);
  const defs = tasksForPhase(phaseKey as PhaseKey, category);

  let tasks = [...execution.tasks];
  let agentStates = { ...execution.agentStates };

  const existingPhaseTasks = tasks.filter((t) => t.phaseId === phase.id);
  const newTasks =
    existingPhaseTasks.length > 0
      ? []
      : buildPhaseTasksFromDefs(phase.id, phase.department, defs);

  const tasksToStart = newTasks.slice(0, 1);
  for (const t of tasksToStart) {
    t.subtasks[0].status = 'running';
    t.status = 'running';
    t.startedAt = Date.now();

    agentStates = updateAgentState(agentStates, t.assignee, 'running', {
      currentTaskId: t.id,
      currentTaskTitle: t.title,
      startedAt: Date.now(),
    });

    assignTask(companyId, {
      title: t.title,
      assignee: t.assignee,
      department: t.department,
      project: execution.objective,
      fromAgent: 'COO Agent',
    });
  }

  const otherNewTasks = newTasks.slice(1);
  for (const t of otherNewTasks) {
    agentStates = updateAgentState(agentStates, t.assignee, 'queued');
  }

  tasks = [...tasks, ...newTasks];

  const phases = execution.phases.map((p) =>
    p.id === phase.id ? { ...p, status: 'running' as const } : p,
  );

  const deptSet = new Set(execution.activeDepartments);
  deptSet.add(phase.department);

  for (const name of [...new Set(newTasks.map((t) => t.assignee))]) {
    if (!agentStates[name]) {
      const id = name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
      agentStates[name] = { agentId: id, name, state: 'idle' };
    }
  }

  const updated: ExecutionGraph = {
    ...execution,
    status: 'running',
    currentPhaseId: phase.id,
    phases,
    tasks,
    recommendations: [],
    activeAgents: [...new Set(newTasks.map((t) => t.assignee))],
    activeDepartments: [...deptSet],
    lastTickAt: Date.now(),
    autoRunAll: true,
    agentStates,
  };

  updateCompanyState(companyId, (s) => ({ ...s, execution: updated }));

  appendEvent(companyId, {
    type: 'agent_action',
    fromAgent: 'COO Agent',
    department: phase.department,
    message: `Started phase: ${phase.name} — full autonomous run engaged`,
    payload: { phaseKey, category, autoRunAll: true },
  });

  writeMemory(companyId, {
    type: 'operational',
    content: `Full autonomous run: ${phase.name} started.`,
    agent: 'COO Agent',
  });

  return buildExecutionView(companyId);
}

export function getExecution(companyId: string): ExecutionView | null {
  return buildExecutionView(companyId);
}

export function submitBrandDiscovery(
  companyId: string,
  answers: Omit<BrandDiscoveryAnswers, 'submittedAt'>,
): ExecutionView | null {
  const state = getCompanyState(companyId);
  const execution = state.execution;
  const researchPhase = execution?.phases.find((p) => p.key === 'research');
  const researchDone = researchPhase?.status === 'completed';
  const canSubmit =
    execution &&
    !execution.brandDiscovery &&
    researchDone &&
    execution.status === 'awaiting_user';

  if (!canSubmit) {
    return buildExecutionView(companyId);
  }

  const brandDiscovery = {
    ...answers,
    submittedAt: Date.now(),
  };

  const recBundle = recommendationsAfterPhase(companyId, 'research', execution);
  const recommendations = recBundle.recommendations;
  const ceoRecommendation = {
    completedSummary: recBundle.ceoRecommendation.completedSummary,
    learned: recBundle.ceoRecommendation.learned,
    blocked: recBundle.ceoRecommendation.blocked,
    nextStep: recBundle.ceoRecommendation.nextStep,
    reason: recBundle.ceoRecommendation.reason,
    departments: recBundle.ceoRecommendation.departments,
    revenueDriver: recBundle.ceoRecommendation.revenueDriver,
    launchUnblocker: recBundle.ceoRecommendation.launchUnblocker,
    highestRoi: recBundle.ceoRecommendation.highestRoi,
  };

  const updated: ExecutionGraph = {
    ...execution,
    status: 'awaiting_user',
    brandDiscovery,
    recommendations,
    ceoRecommendation,
  };

  updateCompanyState(companyId, (s) => ({ ...s, execution: updated }));

  writeMemory(companyId, {
    type: 'strategic',
    content: `Brand brief: ${answers.taglineOrVision}`,
    agent: 'CEO Agent',
  });

  appendEvent(companyId, {
    type: 'agent_action',
    fromAgent: 'CEO Agent',
    department: 'Executive Layer',
    message: 'Brand discovery captured — ready for next phase selection',
    payload: { brandDiscovery: true },
  });

  return buildExecutionView(companyId);
}

export { PHASE_CATALOG };