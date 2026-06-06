import MaterialIcon from './ui/MaterialIcon';
import { StitchPageHeader } from './stitch/StitchPageHeader';
import type { BusinessTwin, AgentWorkforce } from '../types';
import { formatCurrency } from '../utils/businessMetrics';

interface AdminCenterPageProps {
  twin: BusinessTwin;
  workforce: AgentWorkforce[];
  founderName: string;
  onAddLog: (msg: string) => void;
  onResetEnterprise: () => void;
}

export default function AdminCenterPage({
  twin,
  workforce,
  founderName,
  onAddLog,
  onResetEnterprise,
}: AdminCenterPageProps) {
  const spend = twin.expenses;
  const cap = twin.budget;
  const pct = cap > 0 ? Math.min(100, Math.round((spend / cap) * 100)) : 0;
  const working = workforce.filter((a) => a.status === 'working').length;

  return (
    <div className="space-y-stack-lg">
      <StitchPageHeader
        title="Admin Center"
        subtitle={`Billing, team, and security for ${twin.name}`}
        breadcrumb={{ parent: 'System', current: 'Admin' }}
        action={
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onAddLog('Admin: Export logs requested.')}
              className="rounded-lg border border-outline-variant px-4 py-2 text-sm font-semibold hover:bg-surface-container-low"
            >
              Export Logs
            </button>
            <button
              type="button"
              onClick={() => onAddLog('Admin: System sync triggered.')}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-on-primary"
            >
              System Sync
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-gutter lg:grid-cols-3">
        <div className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-6 shadow-sm lg:col-span-2">
          <h3 className="mb-4 flex items-center gap-2 font-bold text-primary">
            <MaterialIcon name="payments" />
            Billing Overview
          </h3>
          <p className="text-3xl font-bold text-primary">{formatCurrency(spend)} / mo spend</p>
          <p className="text-sm text-on-surface-variant">
            Budget cap {formatCurrency(cap)} · {twin.stage} · {twin.funding}
          </p>
          <div className="mt-4 h-2 w-full rounded-full bg-surface-container">
            <div className="h-2 rounded-full bg-secondary transition-all" style={{ width: `${pct}%` }} />
          </div>
          <p className="mt-2 text-xs text-outline">{pct}% of monthly budget utilized</p>
          <div className="mt-6 grid grid-cols-3 gap-4">
            {[
              { label: 'MRR', value: formatCurrency(twin.revenue) },
              { label: 'Customers', value: String(twin.customers) },
              { label: 'Team', value: String(twin.teamSize) },
            ].map((s) => (
              <div key={s.label} className="rounded-lg bg-surface-container-low p-3">
                <p className="text-[10px] uppercase text-outline">{s.label}</p>
                <p className="font-bold text-primary">{s.value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-outline-variant bg-primary-container p-6 text-on-primary-container">
          <h3 className="mb-2 font-bold">Agent fleet</h3>
          <p className="text-4xl font-bold">{workforce.length}</p>
          <p className="mt-1 text-sm opacity-80">{working} currently working</p>
          <p className="mt-4 text-xs opacity-70">Standby until you approve tasks on Command Center</p>
        </div>
      </div>

      <div className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-6 shadow-sm">
        <h3 className="mb-4 font-bold text-primary">Nexus Team Nodes</h3>
        <div className="mb-4 flex items-center gap-3 rounded-xl border border-outline-variant p-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-sm font-bold text-on-primary">
            {founderName
              .split(' ')
              .map((n) => n[0])
              .join('')
              .slice(0, 2)}
          </div>
          <div>
            <p className="font-bold text-primary">{founderName}</p>
            <p className="text-xs text-outline">Founder & CEO · Full access</p>
          </div>
          <span className="ml-auto rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
            Active
          </span>
        </div>
        <p className="mb-2 text-xs font-bold uppercase text-outline">AI agents</p>
        <div className="max-h-64 space-y-2 overflow-y-auto">
          {workforce.slice(0, 20).map((a) => (
            <div
              key={a.id}
              className="flex items-center justify-between rounded-lg border border-outline-variant/50 px-3 py-2 text-sm"
            >
              <span className="font-medium text-primary">{a.name}</span>
              <span className="text-xs text-outline">{a.department}</span>
              <span
                className={`text-[9px] font-bold uppercase ${
                  a.status === 'working' ? 'text-emerald-600' : 'text-outline'
                }`}
              >
                {a.status}
              </span>
            </div>
          ))}
          {workforce.length > 20 && (
            <p className="text-center text-xs text-outline">+{workforce.length - 20} more agents</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-6">
          <MaterialIcon name="shield" className="mb-2 text-secondary" />
          <h3 className="font-bold text-primary">Security</h3>
          <p className="mt-2 text-sm text-on-surface-variant">
            Session stored locally. API keys managed in Settings.
          </p>
        </div>
        <div className="rounded-2xl border border-error-container bg-error-container/30 p-6">
          <h3 className="font-bold text-error">Danger zone</h3>
          <p className="mt-2 text-sm text-on-error-container">
            Reset clears twin, milestones, vision workflow, and all local storage.
          </p>
          <button
            type="button"
            onClick={onResetEnterprise}
            className="mt-4 rounded-lg bg-error px-4 py-2 text-sm font-semibold text-on-error"
          >
            Reset Enterprise
          </button>
        </div>
      </div>
    </div>
  );
}
