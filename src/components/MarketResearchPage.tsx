import { useCallback, useEffect, useMemo, useState } from 'react';

import MaterialIcon from './ui/MaterialIcon';

import type { BusinessInsight, BusinessTwin } from '../types';

import { computeHealthScore, formatCurrency } from '../utils/businessMetrics';

import type { Milestone, DepartmentState } from '../types';

import type { VisionWorkflowState } from '../lib/visionWorkflow';

import { getCompanyId } from '../lib/companyId';

import { fetchExecutionApi, type ExecutionView } from '../lib/executionApi';

import { ProgressLine } from './stitch/StitchPrimitives';



interface MarketResearchPageProps {

  twin: BusinessTwin;

  founderEmail?: string;

  founderId?: string;

  insights: BusinessInsight[];

  milestones: Milestone[];

  departments: DepartmentState[];

  visionWorkflow: VisionWorkflowState;

}



export default function MarketResearchPage({

  twin,

  founderEmail,

  founderId,

  insights,

  milestones,

  departments,

  visionWorkflow,

}: MarketResearchPageProps) {

  const companyId = getCompanyId(twin.name, founderEmail, founderId);

  const [executionView, setExecutionView] = useState<ExecutionView | null>(null);



  const refresh = useCallback(async () => {

    try {

      const exec = await fetchExecutionApi(companyId);

      setExecutionView(exec);

    } catch {

      setExecutionView(null);

    }

  }, [companyId]);



  useEffect(() => {

    refresh();

    const id = window.setInterval(refresh, 4000);

    return () => window.clearInterval(id);

  }, [refresh]);



  const health = computeHealthScore(twin, milestones, departments) ?? 50;

  const marketingInsights = insights.filter(

    (i) => i.category === 'marketing' || i.category === 'strategy',

  );

  const display = marketingInsights.length > 0 ? marketingInsights : insights;



  const researchPhase = executionView?.allPhasesProgress.find(

    (p) => p.phaseName === 'Market Research',

  );

  const researchProgress = researchPhase?.displayProgress ?? researchPhase?.progress ?? 0;

  const researchComplete = researchPhase?.status === 'completed';

  const researchDeliverables = executionView?.execution.deliverables ?? [];

  const researchTasks =

    executionView?.execution.tasks.filter((t) => {

      const phase = executionView.execution.phases.find((p) => p.key === 'research');

      return phase && t.phaseId === phase.id;

    }) ?? [];



  const scanning =

    visionWorkflow.step === 'research_active' ||

    visionWorkflow.step === 'vision_complete' ||

    executionView?.execution.status === 'running';



  const statusPhrase = useMemo(() => {

    if (researchComplete) return 'Research complete — deliverables ready';

    if (executionView?.execution.status === 'running' && researchProgress > 0) {

      return `Research agents working — ${researchProgress}% complete`;

    }

    if (visionWorkflow.step === 'research_active') {

      return 'Analyzing competitive landscape...';

    }

    if (visionWorkflow.step === 'vision_complete') {

      return 'Research outputs ready';

    }

    if (visionWorkflow.step === 'research_approval') {

      return 'Awaiting your approval on Command Center';

    }

    return 'Start execution on Command Center to run market research';

  }, [visionWorkflow.step, researchComplete, researchProgress, executionView?.execution.status]);



  const researchOutputs = visionWorkflow.outputs.filter((o) =>

    o.toLowerCase().includes('research'),

  );



  return (

    <div className="space-y-stack-lg">

      <div className="flex flex-wrap items-end justify-between gap-4">

        <div>

          <nav className="mb-2 flex items-center gap-2 text-label-sm text-on-surface-variant">

            <span>Executive</span>

            <MaterialIcon name="chevron_right" className="text-[12px]" />

            <span>Market Intel</span>

          </nav>

          <h2 className="text-headline-lg font-headline-lg text-primary">

            Market & Strategic Research

          </h2>

          <p className="mt-1 text-sm text-on-surface-variant">

            {twin.name} · {twin.industry} · Budget {formatCurrency(twin.budget)}

          </p>

        </div>

        <div

          className={`flex items-center gap-3 rounded-xl border border-outline-variant bg-surface-container-lowest px-4 py-2 shadow-sm ${

            scanning ? '' : 'opacity-70'

          }`}

        >

          {scanning && !researchComplete && (

            <span className="relative flex h-3 w-3">

              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-secondary opacity-75" />

              <span className="relative inline-flex h-3 w-3 rounded-full bg-secondary" />

            </span>

          )}

          {researchComplete && (

            <MaterialIcon name="check_circle" className="text-[20px] text-emerald-600" />

          )}

          <span className="text-sm font-semibold text-on-surface">{statusPhrase}</span>

        </div>

      </div>



      <div className="grid grid-cols-12 gap-gutter">

        <div className="col-span-12 rounded-2xl border border-outline-variant bg-surface-container-lowest p-stack-lg shadow-sm lg:col-span-8">

          <div className="relative z-10 mb-stack-md flex items-start justify-between">

            <div>

              <h3 className="mb-1 text-headline-md font-headline-md text-primary">

                Market Research Progress

              </h3>

              <p className="text-body-sm text-on-surface-variant">

                {researchPhase

                  ? `${researchPhase.completed} of ${researchPhase.total} research units completed`

                  : 'Start execution on Command Center to begin research agents.'}

              </p>

            </div>

            <div className="text-right">

              <span className="text-headline-lg font-bold text-secondary">{researchProgress}%</span>

              {researchComplete && (

                <p className="text-[10px] font-bold uppercase text-emerald-600">Complete</p>

              )}

            </div>

          </div>

          <ProgressLine pct={researchProgress} />

          <div className="relative mt-6 flex h-[160px] items-end justify-between gap-2 overflow-hidden rounded-xl bg-surface-container-low p-6">

            {researchTasks.length > 0

              ? researchTasks.map((t) => {

                  const done = t.subtasks.filter((s) => s.status === 'completed').length;

                  const pct =

                    t.subtasks.length > 0 ? Math.round((done / t.subtasks.length) * 100) : 0;

                  return (

                    <div

                      key={t.id}

                      className={`w-full rounded-t-lg transition-all ${

                        pct === 100 ? 'bg-secondary' : pct > 0 ? 'bg-secondary/50' : 'bg-primary/10'

                      }`}

                      style={{ height: `${Math.max(pct, 8)}%` }}

                      title={t.title}

                    />

                  );

                })

              : [20, 35, 25, 40, 30, health * 0.6, 45, 50].map((h, i) => (

                  <div

                    key={i}

                    className="w-full rounded-t-lg bg-primary/10"

                    style={{ height: `${Math.min(h, 100)}%` }}

                  />

                ))}

          </div>

          {researchTasks.length > 0 && (

            <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">

              {researchTasks.map((t) => {

                const done = t.subtasks.filter((s) => s.status === 'completed').length;

                const pct =

                  t.subtasks.length > 0 ? Math.round((done / t.subtasks.length) * 100) : 0;

                return (

                  <div

                    key={t.id}

                    className="flex items-center justify-between rounded-lg border border-outline-variant/50 bg-surface px-3 py-2 text-sm"

                  >

                    <span className="truncate font-medium text-primary">{t.title}</span>

                    <span

                      className={`shrink-0 text-xs font-bold ${

                        pct === 100 ? 'text-emerald-600' : 'text-outline'

                      }`}

                    >

                      {pct}%

                    </span>

                  </div>

                );

              })}

            </div>

          )}

          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">

            {twin.challenges.slice(0, 3).map((c) => (

              <div

                key={c}

                className="rounded-xl border border-outline-variant/50 bg-surface p-4"

              >

                <p className="mb-1 text-label-sm uppercase text-on-surface-variant">Signal</p>

                <p className="text-body-md font-semibold text-primary">{c}</p>

              </div>

            ))}

          </div>

        </div>



        <div className="col-span-12 space-y-gutter lg:col-span-4">

          <div className="rounded-2xl bg-primary p-stack-lg text-on-primary shadow-lg">

            <h3 className="mb-stack-md flex items-center gap-2 text-headline-md font-headline-md">

              <MaterialIcon name="shield" />

              Live activity

            </h3>

            {visionWorkflow.activity.length === 0 ? (

              <p className="text-body-sm opacity-80">No research activity until you approve runs.</p>

            ) : (

              <div className="max-h-48 space-y-3 overflow-y-auto">

                {visionWorkflow.activity

                  .filter((a) => a.department.includes('Research') || a.agent.includes('CEO'))

                  .slice(0, 6)

                  .map((a) => (

                    <div

                      key={a.id}

                      className="rounded-xl border border-white/5 bg-white/10 p-3"

                    >

                      <p className="text-label-md font-label-md">{a.agent}</p>

                      <p className="text-body-sm opacity-80">{a.message}</p>

                    </div>

                  ))}

              </div>

            )}

          </div>



          <div className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-stack-lg shadow-sm">

            <h3 className="mb-4 text-label-md uppercase tracking-widest text-on-surface-variant">

              Your venture

            </h3>

            <div className="flex items-center gap-4">

              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary font-bold text-on-secondary">

                {twin.name.slice(0, 2).toUpperCase()}

              </div>

              <div className="flex-1">

                <p className="font-semibold">{twin.name}</p>

                <p className="text-sm text-on-surface-variant">{twin.stage}</p>

              </div>

            </div>

            <p className="mt-4 text-sm text-on-surface-variant">

              Budget cap: {formatCurrency(twin.budget)}

            </p>

            <p className="mt-2 text-sm text-on-surface-variant">

              Health score: {health}% (financial + milestone composite)

            </p>

          </div>

        </div>



        <div className="col-span-12">

          <h3 className="mb-stack-md text-headline-md font-headline-md text-primary">

            Research deliverables

          </h3>

          <p className="mb-4 text-sm text-on-surface-variant">

            Outcomes produced by research agents — each item lists what was analyzed.

          </p>

          {researchDeliverables.length === 0 ? (

            <div className="rounded-2xl border-2 border-dashed border-outline-variant py-12 text-center text-sm text-on-surface-variant">

              {scanning

                ? 'Deliverables appear as each research task completes.'

                : 'Start execution on Command Center to generate research deliverables.'}

            </div>

          ) : (

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

              {researchDeliverables.map((d) => (

                <div

                  key={d.id}

                  className="rounded-xl border border-outline-variant bg-surface-container-lowest p-4"

                >

                  <div className="flex items-start justify-between gap-2">

                    <p className="font-bold text-primary">{d.title}</p>

                    <MaterialIcon name="task_alt" className="shrink-0 text-[18px] text-emerald-600" />

                  </div>

                  <p className="mt-2 text-sm text-on-surface-variant">{d.summary}</p>

                  {d.details && d.details.length > 0 && (

                    <ul className="mt-3 space-y-1 border-t border-outline-variant/50 pt-3">

                      {d.details.map((item) => (

                        <li

                          key={item}

                          className="flex items-start gap-2 text-xs text-on-surface-variant"

                        >

                          <MaterialIcon

                            name="check"

                            className="mt-0.5 shrink-0 text-[14px] text-secondary"

                          />

                          <span>{item}</span>

                        </li>

                      ))}

                    </ul>

                  )}

                  <p className="mt-3 text-xs text-outline">{d.agent}</p>

                </div>

              ))}

            </div>

          )}

        </div>



        <div className="col-span-12">

          <h3 className="mb-stack-md text-headline-md font-headline-md text-primary">

            Strategic insights

          </h3>

          {researchOutputs.length > 0 && (

            <div className="mb-4 space-y-2 rounded-xl border border-emerald-200 bg-emerald-50/50 p-4">

              {researchOutputs.map((line) => (

                <p key={line} className="text-sm text-emerald-900">

                  {line}

                </p>

              ))}

            </div>

          )}

          {display.length === 0 ? (

            <div className="rounded-2xl border-2 border-dashed border-outline-variant py-12 text-center text-sm text-on-surface-variant">

              {scanning

                ? 'Insights will appear when research completes.'

                : 'Complete the CEO → Research vision cycle on Command Center first.'}

            </div>

          ) : (

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

              {display.map((ins) => (

                <div

                  key={ins.id}

                  className="rounded-xl border border-outline-variant bg-surface-container-lowest p-4"

                >

                  <div className="flex justify-between">

                    <p className="font-bold text-primary">{ins.title}</p>

                    <span className="text-xs font-bold text-secondary">

                      Impact {ins.impactScore}

                    </span>

                  </div>

                  <p className="mt-2 text-sm text-on-surface-variant">{ins.text}</p>

                </div>

              ))}

            </div>

          )}

        </div>



        <div className="col-span-12 rounded-2xl border-2 border-dashed border-outline-variant bg-surface-container-low/30 p-stack-lg text-center">

          <MaterialIcon name="biotech" className="mx-auto mb-4 text-4xl text-outline" />

          <h3 className="mb-2 text-headline-md text-primary">Custom domain scan</h3>

          <p className="mx-auto mb-6 max-w-md text-body-md text-on-surface-variant">

            Starts only after you approve research on the Command Center — agents never run

            autonomously without your OK.

          </p>

          <button

            type="button"

            disabled={!scanning || researchComplete}

            className="mx-auto flex items-center gap-2 rounded-lg bg-primary px-8 py-3 font-bold text-on-primary disabled:cursor-not-allowed disabled:opacity-50"

          >

            <MaterialIcon name="add" className="text-sm" />

            Start custom scan

          </button>

        </div>

      </div>

    </div>

  );

}

