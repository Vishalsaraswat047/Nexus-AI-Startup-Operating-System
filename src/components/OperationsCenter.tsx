import { useCallback, useEffect, useState } from 'react';
import type { BusinessTwin, CorporateMemory } from '../types';
import { getCompanyId } from '../lib/companyId';
import {
  fetchOperationsSnapshot,
  createCeoObjectiveApi,
  createCooPlanApi,
  resolveApprovalApi,
  runSocialCheckApi,
  executeSocialApi,
  type OperationsSnapshot,
} from '../lib/nexusOperations';
import { StitchPageHeader } from './stitch/StitchPageHeader';
import MaterialIcon from './ui/MaterialIcon';

const PLATFORM_LABELS: Record<string, string> = {
  instagram: 'Instagram',
  facebook: 'Facebook',
  linkedin: 'LinkedIn',
  youtube: 'YouTube',
  google_business: 'Google Business Profile',
};

interface OperationsCenterProps {
  twin: BusinessTwin;
  founderEmail?: string;
  founderId?: string;
  integrations: string[];
  onAddLog: (msg: string) => void;
  onMergeMemory: (sections: Partial<CorporateMemory>) => void;
}

export default function OperationsCenter({
  twin,
  founderEmail,
  founderId,
  integrations,
  onAddLog,
  onMergeMemory,
}: OperationsCenterProps) {
  const companyId = getCompanyId(twin.name, founderEmail, founderId);
  const [snap, setSnap] = useState<OperationsSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [directive, setDirective] = useState('');
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const data = await fetchOperationsSnapshot(companyId);
      setSnap(data);
      onMergeMemory({
        strategic: data.memorySections.strategic,
        operational: data.memorySections.operational,
        learning: data.memorySections.learning,
        business: data.memorySections.business,
        customer: data.memorySections.customer,
        failure: data.memorySections.failure,
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [companyId, onMergeMemory]);

  useEffect(() => {
    refresh();
    const t = window.setInterval(refresh, 8000);
    return () => window.clearInterval(t);
  }, [refresh]);

  const handleCeoObjective = async () => {
    if (!directive.trim() || busy) return;
    setBusy(true);
    try {
      const { objective } = await createCeoObjectiveApi(companyId, directive.trim(), twin);
      onAddLog(`CEO: Objective created — ${objective.objective}`);
      const { plan } = await createCooPlanApi(companyId, objective.id);
      onAddLog(`COO: Execution plan ${plan.id} — tasks assigned on task bus.`);
      setDirective('');
      await refresh();
    } catch {
      onAddLog('Operations: CEO/COO pipeline failed.');
    } finally {
      setBusy(false);
    }
  };

  const handleSocialCheck = async () => {
    setBusy(true);
    try {
      await runSocialCheckApi(companyId, integrations.length ? integrations : twin.tools);
      onAddLog('Social Media Agent: Presence audit complete.');
      await refresh();
    } catch {
      onAddLog('Operations: Social audit failed.');
    } finally {
      setBusy(false);
    }
  };

  const handleApprove = async (approvalId: string, actionType: string) => {
    setBusy(true);
    try {
      await resolveApprovalApi(companyId, approvalId, 'approved');
      if (actionType === 'account_create') {
        const pending = snap?.state.approvals.find((a) => a.id === approvalId);
        await executeSocialApi(companyId, approvalId, twin.name);
        onAddLog(`Social: Accounts provisioned for ${twin.name} (connect APIs for live create).`);
      } else {
        onAddLog('Operations: Action approved.');
      }
      await refresh();
    } catch {
      onAddLog('Operations: Approval failed.');
    } finally {
      setBusy(false);
    }
  };

  const handleDecline = async (approvalId: string) => {
    await resolveApprovalApi(companyId, approvalId, 'declined');
    onAddLog('Operations: Action declined.');
    await refresh();
  };

  const pending = snap?.state.approvals.filter((a) => a.status === 'pending') ?? [];
  const events = snap?.state.events.slice(0, 12) ?? [];
  const tasks = snap?.state.tasks.slice(0, 8) ?? [];
  const dash = snap?.dashboard;
  const social = snap?.state.socialWorkflow;
  const objective = snap?.state.ceoObjectives[0];

  return (
    <div className="space-y-6">
      <StitchPageHeader
        title="Operations Engine"
        subtitle="Event log · Task bus · Approvals · Workflows — database truth only"
      />

      {loading && !snap && (
        <p className="text-sm text-on-surface-variant">Loading operations snapshot…</p>
      )}

      {dash && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {[
            { label: 'Tasks done', value: dash.tasksCompleted, icon: 'task_alt' },
            { label: 'In progress', value: dash.tasksInProgress, icon: 'pending' },
            { label: 'Queued', value: dash.tasksQueued, icon: 'queue' },
            { label: 'Pending approvals', value: dash.pendingApprovals, icon: 'gavel' },
            { label: 'Events (24h)', value: dash.eventsLast24h, icon: 'hub' },
          ].map((m) => (
            <div
              key={m.label}
              className="rounded-xl border border-outline-variant bg-surface-container-lowest p-4"
            >
              <MaterialIcon name={m.icon} className="text-primary text-xl" />
              <p className="mt-2 text-2xl font-bold text-on-surface">{m.value}</p>
              <p className="text-xs text-on-surface-variant">{m.label}</p>
            </div>
          ))}
        </div>
      )}

      <div className="rounded-xl border border-outline-variant bg-surface-container-low p-4">
        <h3 className="text-sm font-bold text-on-surface">1–4 · CEO objective → COO execution</h3>
        <p className="mt-1 text-xs text-on-surface-variant">
          CEO sets objectives only. COO builds projects, task graph, and bus assignments.
        </p>
        {objective && (
          <p className="mt-2 text-sm text-primary">
            Active: {objective.objective} · {objective.departments.join(', ')}
          </p>
        )}
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input
            className="flex-1 rounded-lg border border-outline-variant bg-surface px-3 py-2 text-sm"
            placeholder='e.g. Launch hotel brand in 30 days'
            value={directive}
            onChange={(e) => setDirective(e.target.value)}
          />
          <button
            type="button"
            disabled={busy}
            onClick={handleCeoObjective}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-on-primary disabled:opacity-50"
          >
            CEO → COO pipeline
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-outline-variant bg-surface-container-low p-4">
        <h3 className="text-sm font-bold text-on-surface">6 · Social media workflow</h3>
        <p className="mt-1 text-xs text-on-surface-variant">
          Check channels → yellow approval for missing accounts → provision → KPI update
        </p>
        <button
          type="button"
          disabled={busy}
          onClick={handleSocialCheck}
          className="mt-3 rounded-lg border border-primary px-4 py-2 text-sm font-semibold text-primary"
        >
          Run presence audit
        </button>
        {social?.platforms?.length > 0 && (
          <ul className="mt-3 space-y-1 text-sm">
            {social.platforms.map((p) => (
              <li key={p.platform} className="flex items-center gap-2">
                <MaterialIcon
                  name={p.exists ? 'check_circle' : 'radio_button_unchecked'}
                  className={p.exists ? 'text-emerald-600' : 'text-amber-600'}
                />
                {PLATFORM_LABELS[p.platform] || p.platform}
                {p.verified && <span className="text-xs text-on-surface-variant">verified</span>}
              </li>
            ))}
          </ul>
        )}
      </div>

      {pending.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-amber-900">3 · Pending approvals</h3>
          {pending.map((a) => (
            <div key={a.id} className="rounded-xl border border-amber-200 bg-amber-50/70 p-4">
              <p className="text-xs font-bold uppercase text-amber-800">{a.tier} · {a.actionType}</p>
              <p className="mt-1 text-sm font-bold text-amber-950">{a.title}</p>
              <p className="mt-1 text-sm text-amber-950/80">{a.description}</p>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => handleApprove(a.id, a.actionType)}
                  className="rounded-lg bg-primary px-3 py-1.5 text-sm font-bold text-on-primary"
                >
                  Approve
                </button>
                <button
                  type="button"
                  onClick={() => handleDecline(a.id)}
                  className="rounded-lg border border-outline-variant px-3 py-1.5 text-sm"
                >
                  Decline
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-4">
          <h3 className="text-sm font-bold">2 · Task bus</h3>
          <ul className="mt-2 max-h-64 space-y-2 overflow-y-auto text-sm">
            {tasks.length === 0 && (
              <li className="text-on-surface-variant">No tasks yet — run CEO → COO pipeline.</li>
            )}
            {tasks.map((t) => (
              <li key={t.id} className="border-b border-outline-variant/50 pb-2">
                <span className="font-medium">{t.title}</span>
                <br />
                <span className="text-xs text-on-surface-variant">
                  {t.assignee} · {t.status}
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-4">
          <h3 className="text-sm font-bold">1 · Event log (visible handoffs)</h3>
          <ul className="mt-2 max-h-64 space-y-2 overflow-y-auto text-xs">
            {events.map((e) => (
              <li key={e.id}>
                <span className="font-mono text-primary">{e.type}</span> · {e.fromAgent}
                {e.toAgent ? ` → ${e.toAgent}` : ''}
                <br />
                {e.message}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
