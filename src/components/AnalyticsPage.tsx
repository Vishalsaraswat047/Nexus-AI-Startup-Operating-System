import { KpiCard } from './stitch/StitchPrimitives';
import { StitchPageHeader } from './stitch/StitchPageHeader';
import MaterialIcon from './ui/MaterialIcon';
import {
  formatCurrency,
  computeBurnRate,
  computeHealthScore,
  computeRunwayLabel,
} from '../utils/businessMetrics';
import type { BusinessTwin, Milestone, DepartmentState } from '../types';

interface AnalyticsPageProps {
  twin: BusinessTwin;
  milestones: Milestone[];
  departments: DepartmentState[];
}

export default function AnalyticsPage({ twin, milestones, departments }: AnalyticsPageProps) {
  const health = computeHealthScore(twin, milestones, departments);
  const burn = computeBurnRate(twin);
  const runway = computeRunwayLabel(twin);
  const cac = twin.customers > 0 ? Math.round(twin.expenses / twin.customers) : 0;
  const ltv = twin.customers > 0 ? Math.round((twin.revenue * 12) / twin.customers) : 0;
  const bars = [
    { label: 'MRR', value: twin.revenue },
    { label: 'Expenses', value: twin.expenses },
    { label: 'Burn', value: burn },
    { label: 'Budget/mo', value: Math.round(twin.budget / 12) },
  ];
  const maxBar = Math.max(twin.budget, twin.revenue, twin.expenses, 1);

  return (
    <div className="space-y-stack-lg">
      <StitchPageHeader
        title="Enterprise Health Index"
        subtitle={`${twin.name} · ${twin.funding} · Team ${twin.teamSize} · ${twin.industry}`}
        breadcrumb={{ parent: 'Executive', current: 'Analytics' }}
      />

      <div className="grid grid-cols-1 gap-gutter md:grid-cols-4">
        <KpiCard
          icon="favorite"
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
          label="Health Score"
          value={health !== null ? `${health}%` : '—'}
          sub={<span className="text-xs text-on-surface-variant">Runway {runway}</span>}
        />
        <KpiCard
          icon="payments"
          iconBg="bg-indigo-50"
          iconColor="text-indigo-600"
          label="MRR"
          value={formatCurrency(twin.revenue)}
          sub={<span className="text-xs text-on-surface-variant">Monthly revenue</span>}
        />
        <KpiCard
          icon="group"
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
          label="CAC (est.)"
          value={cac > 0 ? formatCurrency(cac) : '—'}
          sub={<span className="text-xs text-on-surface-variant">{twin.customers} customers</span>}
        />
        <KpiCard
          icon="savings"
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
          label="LTV (est.)"
          value={ltv > 0 ? formatCurrency(ltv) : '—'}
          sub={<span className="text-xs text-on-surface-variant">Annual / customer</span>}
        />
      </div>

      <div className="grid grid-cols-1 gap-gutter lg:grid-cols-2">
        <div className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-6 shadow-sm">
          <h3 className="mb-4 font-bold text-primary">Revenue velocity</h3>
          <p className="text-sm text-on-surface-variant">
            Burn {formatCurrency(burn)}/mo · Budget cap {formatCurrency(twin.budget)}
          </p>
          <div className="mt-6 flex h-40 items-end gap-3">
            {bars.map((b) => (
              <div key={b.label} className="flex flex-1 flex-col items-center gap-2">
                <div
                  className="w-full rounded-t bg-secondary transition-all hover:bg-secondary-container"
                  style={{ height: `${Math.min(100, (b.value / maxBar) * 100)}%` }}
                  title={formatCurrency(b.value)}
                />
                <span className="text-[10px] font-bold text-outline">{b.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-6 shadow-sm">
          <h3 className="mb-4 font-bold text-primary">Operational signals</h3>
          <div className="space-y-4">
            {[
              {
                icon: 'track_changes',
                label: 'Active milestones',
                value: String(milestones.length),
              },
              {
                icon: 'corporate_fare',
                label: 'Active departments',
                value: String(departments.filter((d) => d.status === 'active').length),
              },
              {
                icon: 'local_fire_department',
                label: 'Monthly burn',
                value: formatCurrency(burn),
              },
              {
                icon: 'flag',
                label: 'Stage',
                value: twin.stage,
              },
            ].map((row) => (
              <div
                key={row.label}
                className="flex items-center justify-between rounded-lg border border-outline-variant/50 bg-surface-container-low p-3"
              >
                <div className="flex items-center gap-2">
                  <MaterialIcon name={row.icon} className="text-secondary" />
                  <span className="text-sm text-on-surface-variant">{row.label}</span>
                </div>
                <span className="font-bold text-primary">{row.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-outline-variant bg-primary-container p-6 text-on-primary-container">
        <h3 className="mb-2 font-bold text-white">Predictive outlook</h3>
        <p className="text-sm text-on-primary-container/80">
          At {twin.stage} with {formatCurrency(twin.budget)} runway cap, primary goal:{' '}
          {twin.goals[0] || 'not set'}. Health index drives autonomous replanning thresholds.
        </p>
      </div>
    </div>
  );
}
