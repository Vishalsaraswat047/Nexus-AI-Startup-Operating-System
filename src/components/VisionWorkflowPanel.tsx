import { useState } from 'react';
import MaterialIcon from './ui/MaterialIcon';
import { ProgressLine } from './stitch/StitchPrimitives';
import {
  type VisionWorkflowState,
  type VisionStep,
  VISION_STEP_LABELS,
  stepProgress,
} from '../lib/visionWorkflow';
import { formatCurrency } from '../utils/businessMetrics';
import type { BusinessTwin } from '../types';

interface VisionWorkflowPanelProps {
  twin: BusinessTwin;
  workflow: VisionWorkflowState;
  onBeginVision: () => void;
  onSubmitCeoTask: (task: string) => void;
  onApproveCeo: () => void;
  onDeclineCeo: () => void;
  onApproveResearch: () => void;
  onDeclineResearch: () => void;
  isCeoRunning: boolean;
  isResearchRunning: boolean;
}

const STEP_ORDER: VisionStep[] = [
  'not_started',
  'awaiting_ceo_task',
  'ceo_approval',
  'ceo_active',
  'research_approval',
  'research_active',
  'vision_complete',
];

export default function VisionWorkflowPanel({
  twin,
  workflow,
  onBeginVision,
  onSubmitCeoTask,
  onApproveCeo,
  onDeclineCeo,
  onApproveResearch,
  onDeclineResearch,
  isCeoRunning,
  isResearchRunning,
}: VisionWorkflowPanelProps) {
  const [taskDraft, setTaskDraft] = useState(workflow.ceoTask);

  const currentIdx = STEP_ORDER.indexOf(workflow.step);
  const scanning =
    workflow.step === 'research_active' || workflow.step === 'ceo_active';

  return (
    <section className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-6 shadow-sm">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-secondary">
            Step-wise vision
          </p>
          <h3 className="mt-1 text-xl font-bold text-primary">
            {twin.name} · {VISION_STEP_LABELS[workflow.step]}
          </h3>
          <p className="mt-1 text-sm text-on-surface-variant">
            Budget {formatCurrency(twin.budget)} · {twin.industry} · {twin.stage}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-secondary-fixed px-3 py-1 text-xs font-bold text-on-secondary-fixed">
            {twin.stage}
          </span>
          <span className="rounded-full border border-outline-variant px-3 py-1 text-xs font-semibold text-primary">
            Runway cap {formatCurrency(twin.budget)}
          </span>
        </div>
      </div>

      <ProgressLine pct={stepProgress(workflow.step)} color="bg-secondary" />
      <div className="mt-4 flex flex-wrap gap-2">
        {STEP_ORDER.filter((s) => s !== 'not_started').map((s, i) => {
          const done = currentIdx > STEP_ORDER.indexOf(s);
          const active = workflow.step === s;
          return (
            <span
              key={s}
              className={`rounded-md px-2 py-1 text-[10px] font-bold ${
                done
                  ? 'bg-emerald-50 text-emerald-700'
                  : active
                    ? 'bg-secondary text-on-secondary'
                    : 'bg-surface-container text-outline'
              }`}
            >
              {i + 1}. {VISION_STEP_LABELS[s].replace(' awaiting approval', '')}
            </span>
          );
        })}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-gutter lg:grid-cols-2">
        <div className="space-y-4">
          {workflow.step === 'not_started' && (
            <div className="rounded-xl border-2 border-dashed border-outline-variant p-6 text-center">
              <MaterialIcon name="play_circle" className="mx-auto text-3xl text-secondary" />
              <p className="mt-3 text-sm text-on-surface-variant">
                Agents are on standby. Nothing runs until you start the vision cycle.
              </p>
              <button
                type="button"
                onClick={onBeginVision}
                className="mt-4 rounded-lg bg-primary px-6 py-2.5 text-sm font-bold text-on-primary hover:opacity-90"
              >
                Start vision — CEO first
              </button>
            </div>
          )}

          {workflow.step === 'awaiting_ceo_task' && (
            <div className="space-y-3">
              <label className="text-sm font-semibold text-primary" htmlFor="ceo-task">
                What should the CEO agent work on?
              </label>
              <textarea
                id="ceo-task"
                value={taskDraft}
                onChange={(e) => setTaskDraft(e.target.value)}
                rows={3}
                placeholder={`e.g. Validate ${twin.name}'s positioning in ${twin.industry} with a $${twin.budget.toLocaleString()} budget frame`}
                className="w-full rounded-lg border border-outline-variant bg-surface-container-low p-3 text-sm focus:border-secondary focus:outline-none focus:ring-1 focus:ring-secondary"
              />
              <button
                type="button"
                disabled={!taskDraft.trim()}
                onClick={() => onSubmitCeoTask(taskDraft.trim())}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-on-primary disabled:opacity-50"
              >
                Submit to CEO for approval
              </button>
            </div>
          )}

          {workflow.step === 'ceo_approval' && (
            <ApprovalCard
              title="CEO Agent requests permission"
              body={`Run strategic brief: "${workflow.ceoTask}"? This will use your brand (${twin.name}) and budget context.`}
              onApprove={onApproveCeo}
              onDecline={onDeclineCeo}
            />
          )}

          {workflow.step === 'ceo_active' && (
            <StatusCard
              icon="crown"
              title="CEO Agent working"
              body={workflow.ceoTask}
              loading={isCeoRunning}
            />
          )}

          {workflow.step === 'research_approval' && (
            <ApprovalCard
              title="Research division requests permission"
              body={workflow.researchBrief}
              onApprove={onApproveResearch}
              onDecline={onDeclineResearch}
            />
          )}

          {workflow.step === 'research_active' && (
            <StatusCard
              icon="science"
              title="Research agents working"
              body={workflow.researchBrief}
              loading={isResearchRunning}
            />
          )}

          {workflow.step === 'vision_complete' && (
            <div className="rounded-xl bg-emerald-50/80 p-4 text-sm text-emerald-800">
              Initial vision cycle complete. Use Goals, Market Research, or Chat to continue —
              each new agent action will ask for your approval.
            </div>
          )}

          {workflow.outputs.length > 0 && (
            <div className="rounded-xl border border-outline-variant bg-surface-container-low p-4">
              <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-outline">
                Output
              </h4>
              <ul className="space-y-2">
                {workflow.outputs.map((line) => (
                  <li key={line} className="text-sm text-primary">
                    {line}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-outline-variant bg-surface-container-low p-4">
          <div className="mb-4 flex items-center justify-between">
            <h4 className="font-bold text-primary">Live activity</h4>
            {scanning && (
              <span className="flex items-center gap-1.5 text-[10px] font-bold text-secondary">
                <span className="h-2 w-2 animate-pulse rounded-full bg-secondary" />
                In progress
              </span>
            )}
          </div>
          {workflow.activity.length === 0 ? (
            <p className="text-sm text-on-surface-variant">No agent activity yet.</p>
          ) : (
            <ul className="max-h-64 space-y-3 overflow-y-auto">
              {workflow.activity.map((a) => (
                <li key={a.id} className="flex gap-3 text-left">
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                      a.kind === 'approval'
                        ? 'bg-amber-50 text-amber-600'
                        : a.kind === 'output'
                          ? 'bg-emerald-50 text-emerald-600'
                          : a.kind === 'working'
                            ? 'bg-blue-50 text-blue-600'
                            : 'bg-surface-container text-on-surface-variant'
                    }`}
                  >
                    <MaterialIcon
                      name={
                        a.kind === 'approval'
                          ? 'verified_user'
                          : a.kind === 'output'
                            ? 'task_alt'
                            : a.kind === 'working'
                              ? 'sync'
                              : 'info'
                      }
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-primary">
                      {a.agent}{' '}
                      <span className="font-normal text-outline">· {a.department}</span>
                    </p>
                    <p className="text-[11px] leading-snug text-on-surface-variant">{a.message}</p>
                    <p className="mt-0.5 text-[9px] text-outline">
                      {new Date(a.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}

function ApprovalCard({
  title,
  body,
  onApprove,
  onDecline,
}: {
  title: string;
  body: string;
  onApprove: () => void;
  onDecline: () => void;
}) {
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4">
      <p className="text-sm font-bold text-amber-900">{title}</p>
      <p className="mt-2 text-sm text-amber-950/80">{body}</p>
      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={onApprove}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-on-primary"
        >
          Approve & run
        </button>
        <button
          type="button"
          onClick={onDecline}
          className="rounded-lg border border-outline-variant px-4 py-2 text-sm font-semibold text-on-surface-variant"
        >
          Not now
        </button>
      </div>
    </div>
  );
}

function StatusCard({
  icon,
  title,
  body,
  loading,
}: {
  icon: string;
  title: string;
  body: string;
  loading: boolean;
}) {
  return (
    <div className="rounded-xl border border-secondary/30 bg-secondary-fixed/30 p-4">
      <div className="flex items-center gap-2">
        <MaterialIcon name={icon} className="text-secondary" />
        <p className="text-sm font-bold text-primary">{title}</p>
        {loading && (
          <MaterialIcon name="progress_activity" className="animate-spin text-secondary" />
        )}
      </div>
      <p className="mt-2 text-sm text-on-surface-variant">{body}</p>
    </div>
  );
}
