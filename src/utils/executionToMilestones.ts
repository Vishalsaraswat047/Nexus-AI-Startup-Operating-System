import type { Milestone } from '../types';
import type { ExecutionView } from '../lib/executionApi';

export function milestonesFromExecution(view: ExecutionView | null): Milestone[] {
  if (!view) return [];

  const { execution, allPhasesProgress } = view;

  return allPhasesProgress.map((pp, idx) => {
    const phaseTasks = execution.tasks.filter((t) => t.phaseId === pp.phaseId);
    const status =
      pp.status === 'completed'
        ? 'completed'
        : pp.status === 'running'
          ? 'in_progress'
          : 'pending';

    return {
      id: `exec-${pp.phaseId}`,
      name: pp.phaseName,
      project: execution.objective,
      status,
      progress: pp.displayProgress ?? pp.progress,
      dependencies: idx > 0 ? [`exec-${allPhasesProgress[idx - 1].phaseId}`] : [],
      tasks: phaseTasks.slice(0, 8).map((t) => ({
        id: t.id,
        name: t.title,
        assignee: t.assignee,
        status:
          t.status === 'completed'
            ? 'completed'
            : t.status === 'failed'
              ? 'failed'
              : t.status === 'running'
                ? 'in_progress'
                : 'todo',
        weight: Math.round(100 / Math.max(phaseTasks.length, 1)),
      })),
    };
  });
}
