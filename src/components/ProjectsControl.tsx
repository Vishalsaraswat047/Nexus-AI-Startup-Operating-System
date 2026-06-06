import { useMemo, useState } from 'react';
import type { BusinessTwin, Milestone } from '../types';
import MaterialIcon from './ui/MaterialIcon';
import { ProgressLine } from './stitch/StitchPrimitives';
import { StitchPageHeader, ActivitySparkline } from './stitch/StitchPageHeader';
import { formatCurrency } from '../utils/businessMetrics';

interface ProjectsControlProps {
  twin: BusinessTwin;
  milestones: Milestone[];
  onAddLog: (msg: string) => void;
}

function milestoneStatusLabel(status: Milestone['status']): string {
  if (status === 'completed') return 'Completed';
  if (status === 'in_progress') return 'In Progress';
  return 'Planning';
}

function projectIcon(name: string): string {
  const n = name.toLowerCase();
  if (n.includes('launch') || n.includes('mvp')) return 'rocket_launch';
  if (n.includes('design') || n.includes('brand') || n.includes('landing')) return 'brush';
  if (n.includes('research') || n.includes('market')) return 'travel_explore';
  if (n.includes('ai') || n.includes('engine')) return 'psychology';
  return 'account_tree';
}

function ownerFromMilestone(m: Milestone): string {
  return m.tasks?.find((t) => t.assignee)?.assignee || 'Planner Agent';
}

function ownerIcon(owner: string): string {
  if (owner.includes('Design') || owner.includes('UI')) return 'palette';
  if (owner.includes('Engineer') || owner.includes('CTO')) return 'engineering';
  return 'smart_toy';
}

function blockerCount(m: Milestone): number {
  const pending = m.tasks?.filter((t) => t.status !== 'completed').length ?? 0;
  if (m.status === 'completed') return 0;
  return Math.min(pending + (m.progress < 30 ? (m.dependencies?.length ?? 0) : 0), 5);
}

function initials(name: string): string {
  return name
    .replace(/ Agent/g, '')
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export default function ProjectsControl({ twin, milestones, onAddLog }: ProjectsControlProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const rows = useMemo(
    () =>
      milestones.map((m) => ({
        milestone: m,
        blockers: blockerCount(m),
        owner: ownerFromMilestone(m),
        teamAvatars: (m.tasks || [])
          .map((t) => t.assignee)
          .filter((a, i, arr) => a && arr.indexOf(a) === i)
          .slice(0, 3),
      })),
    [milestones],
  );

  const selected = rows.find((r) => r.milestone.id === selectedId)?.milestone;

  const openDrawer = (id: string) => {
    setSelectedId(id);
    setDrawerOpen(true);
  };

  return (
    <div className="space-y-stack-lg">
      <StitchPageHeader
        title="Active Projects"
        subtitle={`${twin.name} · ${formatCurrency(twin.budget)} budget · ${milestones.length} initiatives from your milestone pipeline`}
        breadcrumb={{ parent: 'Executive', current: 'Projects' }}
        action={
          <div className="flex items-center gap-stack-sm">
            <button
              type="button"
              onClick={() => onAddLog('Projects: Filter panel opened.')}
              className="flex items-center gap-2 rounded-lg border border-outline-variant bg-surface px-4 py-2 text-label-md transition-colors hover:bg-surface-container-low"
            >
              <MaterialIcon name="filter_list" className="text-[18px]" />
              Filter
            </button>
            <button
              type="button"
              onClick={() => onAddLog('Projects: Sort by progress.')}
              className="flex items-center gap-2 rounded-lg border border-outline-variant bg-surface px-4 py-2 text-label-md transition-colors hover:bg-surface-container-low"
            >
              <MaterialIcon name="sort" className="text-[18px]" />
              Sort
            </button>
            <button
              type="button"
              onClick={() =>
                onAddLog('Projects: New projects are created via Goals decompose or onboarding.')
              }
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-label-md text-on-primary transition-opacity hover:opacity-90"
            >
              <MaterialIcon name="add" className="text-[18px]" />
              New Project
            </button>
          </div>
        }
      />

      {milestones.length === 0 ? (
        <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-12 text-center">
          <MaterialIcon name="account_tree" className="mx-auto mb-3 text-[40px] text-outline" />
          <p className="text-body-md text-on-surface-variant">
            No projects yet. Complete onboarding or decompose a goal on the Goals page.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest shadow-sm">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-outline-variant bg-surface-container-low">
                <th className="px-6 py-4 text-label-sm font-bold uppercase tracking-wider text-outline">
                  Project Name
                </th>
                <th className="px-6 py-4 text-center text-label-sm font-bold uppercase tracking-wider text-outline">
                  Status
                </th>
                <th className="px-6 py-4 text-label-sm font-bold uppercase tracking-wider text-outline">
                  Owner
                </th>
                <th className="px-6 py-4 text-label-sm font-bold uppercase tracking-wider text-outline">
                  Dependencies
                </th>
                <th className="px-6 py-4 text-label-sm font-bold uppercase tracking-wider text-outline">
                  Activity
                </th>
                <th className="w-10 px-6 py-4" />
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {rows.map(({ milestone: m, blockers, owner, teamAvatars }) => (
                <tr
                  key={m.id}
                  className="group cursor-pointer transition-colors hover:bg-surface-container-low"
                  onClick={() => openDrawer(m.id)}
                >
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-container text-on-primary-container">
                        <MaterialIcon name={projectIcon(m.name)} />
                      </div>
                      <div>
                        <div className="text-label-md font-bold">{m.name}</div>
                        <p className="mt-0.5 text-body-sm text-outline">{m.project}</p>
                        {teamAvatars.length > 0 && (
                          <div className="-space-x-2 mt-1 flex">
                            {teamAvatars.map((a) => (
                              <span
                                key={a}
                                className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-surface bg-surface-container-high text-[8px] font-bold"
                                title={a}
                              >
                                {initials(a)}
                              </span>
                            ))}
                            {m.tasks.length > teamAvatars.length && (
                              <span className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-surface bg-surface-container-high text-[8px] font-bold">
                                +{m.tasks.length - teamAvatars.length}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex justify-center">
                      <span
                        className={`rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-wider ${
                          m.status === 'completed'
                            ? 'border-outline-variant bg-surface-container text-on-surface-variant'
                            : m.status === 'in_progress'
                              ? 'border-secondary/20 bg-secondary-container/10 text-secondary'
                              : 'border-outline-variant bg-surface-container text-on-surface-variant'
                        }`}
                      >
                        {milestoneStatusLabel(m.status)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2">
                      <MaterialIcon name={ownerIcon(owner)} className="text-[18px] text-outline" />
                      <span className="text-body-sm">{owner}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    {blockers > 0 ? (
                      <div className="flex items-center gap-2 font-semibold text-error">
                        <MaterialIcon name="report" className="text-[18px]" />
                        <span className="text-body-sm">
                          {blockers} Blocker{blockers > 1 ? 's' : ''}
                        </span>
                      </div>
                    ) : m.dependencies?.length ? (
                      <div className="flex items-center gap-2 text-on-surface-variant">
                        <MaterialIcon name="link" className="text-[18px]" />
                        <span className="text-body-sm">{m.dependencies.length} Internal dep</span>
                      </div>
                    ) : (
                      <span className="text-body-sm italic text-outline">None</span>
                    )}
                  </td>
                  <td className="px-6 py-5">
                    <ActivitySparkline progress={m.progress} />
                  </td>
                  <td className="px-6 py-5">
                    <button
                      type="button"
                      className="text-outline opacity-0 transition-all group-hover:opacity-100 hover:text-primary"
                    >
                      <MaterialIcon name="more_vert" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {drawerOpen && selected && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 bg-primary/20 backdrop-blur-[2px]"
            aria-label="Close project drawer"
            onClick={() => setDrawerOpen(false)}
          />
          <aside className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-l border-outline-variant bg-surface-container-lowest shadow-2xl">
            <div className="flex items-center justify-between border-b border-outline-variant p-6">
              <h3 className="font-headline-md text-headline-md text-primary">{selected.name}</h3>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="text-outline hover:text-primary"
              >
                <MaterialIcon name="close" />
              </button>
            </div>
            <div className="flex-1 space-y-stack-md overflow-y-auto p-6">
              <div>
                <p className="text-label-sm font-bold uppercase text-outline">Status</p>
                <p className="mt-1 text-body-md">
                  {milestoneStatusLabel(selected.status)} · {selected.progress}%
                </p>
                <div className="mt-2">
                  <ProgressLine pct={selected.progress} />
                </div>
              </div>
              <div>
                <p className="text-label-sm font-bold uppercase text-outline">Track</p>
                <p className="mt-1 text-body-md">{selected.project}</p>
              </div>
              <div>
                <p className="mb-2 text-label-sm font-bold uppercase text-outline">Tasks</p>
                <ul className="space-y-2">
                  {(selected.tasks || []).map((t) => (
                    <li
                      key={t.id}
                      className="flex items-center justify-between rounded-lg border border-outline-variant bg-surface-container-low px-3 py-2 text-body-sm"
                    >
                      <span>{t.name}</span>
                      <span className="text-label-sm text-outline">{t.status}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </aside>
        </>
      )}
    </div>
  );
}
