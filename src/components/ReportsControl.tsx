import { useMemo, useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { BusinessTwin } from '../types';
import MaterialIcon from './ui/MaterialIcon';
import { StitchPageHeader } from './stitch/StitchPageHeader';
import { formatCurrency } from '../utils/businessMetrics';

interface ReportsControlProps {
  twin: BusinessTwin;
}

export default function ReportsControl({ twin }: ReportsControlProps) {
  const [downloadingReportId, setDownloadingReportId] = useState<string | null>(null);
  const today = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const reportsCatalog = useMemo(
    () => [
      {
        id: 'rep-exec',
        name: `Executive Summary — ${twin.name}`,
        type: 'Business Report',
        date: today,
        icon: 'description',
        description: `Overview of ${twin.stage} performance, budget ${formatCurrency(twin.budget)}, and milestones.`,
      },
      {
        id: 'rep-proj',
        name: 'Project Performance',
        type: 'Project Report',
        date: today,
        icon: 'track_changes',
        description: 'Milestone completion rates and operational timelines.',
      },
      {
        id: 'rep-dept',
        name: 'Department Analytics',
        type: 'Department Report',
        date: today,
        icon: 'corporate_fare',
        description: 'Division workload, agent standby/working counts, and status.',
      },
      {
        id: 'rep-rev',
        name: 'Revenue & Growth Report',
        type: 'Performance Report',
        date: today,
        icon: 'trending_up',
        description: `MRR ${formatCurrency(twin.revenue)}, expenses ${formatCurrency(twin.expenses)}, runway analysis.`,
      },
      {
        id: 'rep-month',
        name: `Monthly Report — ${twin.name}`,
        type: 'Business Report',
        date: today,
        icon: 'calendar_month',
        description: 'Agent activity logs, risks, and strategic memory exports.',
      },
    ],
    [twin, today],
  );

  const revenueData = [
    { month: 'Jan', Revenue: Math.round(twin.revenue * 0.7), Overhead: Math.round(twin.expenses * 0.9) },
    { month: 'Feb', Revenue: Math.round(twin.revenue * 0.8), Overhead: Math.round(twin.expenses * 0.95) },
    { month: 'Mar', Revenue: Math.round(twin.revenue * 0.92), Overhead: twin.expenses },
    { month: 'Apr', Revenue: twin.revenue, Overhead: twin.expenses },
    { month: 'May', Revenue: Math.round(twin.revenue * 1.1), Overhead: Math.round(twin.expenses * 1.05) },
    { month: 'Jun', Revenue: Math.round(twin.revenue * 1.2), Overhead: Math.round(twin.expenses * 1.1) },
  ].map((r) => ({ ...r, Profits: r.Revenue - r.Overhead }));

  const netIncome = twin.revenue - twin.expenses;

  const handleExport = (reportId: string, name: string) => {
    setDownloadingReportId(reportId);
    const payload = {
      report: name,
      business: twin.name,
      stage: twin.stage,
      revenue: twin.revenue,
      expenses: twin.expenses,
      budget: twin.budget,
      generated: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${reportId}-${twin.name.replace(/\s+/g, '-')}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setTimeout(() => setDownloadingReportId(null), 600);
  };

  return (
    <div className="space-y-stack-lg">
      <StitchPageHeader
        title="Reports"
        subtitle={`Corporate ledgers and exports for ${twin.name}`}
        breadcrumb={{ parent: 'Executive', current: 'Reports' }}
        action={
          <button
            type="button"
            onClick={() => handleExport('custom-gen', 'Custom Audit Ledger')}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-on-primary"
          >
            <MaterialIcon name="description" />
            Generate Report
          </button>
        }
      />

      <div className="grid grid-cols-1 gap-gutter md:grid-cols-3">
        {[
          { label: 'Gross monthly inflows', value: formatCurrency(twin.revenue), icon: 'payments', sub: twin.funding },
          { label: 'Operational burn', value: formatCurrency(twin.expenses), icon: 'local_fire_department', sub: 'Monthly overhead' },
          {
            label: 'Net operating profit',
            value: `${netIncome >= 0 ? '+' : ''}${formatCurrency(Math.abs(netIncome))}`,
            icon: 'show_chart',
            sub: netIncome >= 0 ? 'Positive position' : 'Investment phase',
          },
        ].map((kpi) => (
          <div
            key={kpi.label}
            className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-6 shadow-sm"
          >
            <div className="mb-4 flex justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-outline">
                {kpi.label}
              </span>
              <MaterialIcon name={kpi.icon} className="text-secondary" />
            </div>
            <p className="text-3xl font-bold text-primary">{kpi.value}</p>
            <p className="mt-1 text-xs text-on-surface-variant">{kpi.sub}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-6 shadow-sm">
        <h3 className="mb-6 text-sm font-bold uppercase tracking-wider text-outline">
          Cash inflow vs operating overhead
        </h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4648d4" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#4648d4" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorProf" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="month" stroke="#76777d" fontSize={11} />
              <YAxis stroke="#76777d" fontSize={11} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#131b2e',
                  borderColor: '#c6c6cd',
                  borderRadius: '12px',
                  fontSize: '11px',
                }}
              />
              <Area type="monotone" dataKey="Revenue" stroke="#4648d4" strokeWidth={2} fill="url(#colorRev)" />
              <Area type="monotone" dataKey="Profits" stroke="#10B981" strokeWidth={2} fill="url(#colorProf)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="font-headline-md text-primary">Available operational summaries</h2>
        <div className="grid gap-4">
          {reportsCatalog.map((report) => (
            <div
              key={report.id}
              className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-6 transition-all hover:shadow-md"
            >
              <div className="flex items-start gap-6">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-secondary-fixed">
                  <MaterialIcon name={report.icon} className="text-secondary" />
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h3 className="mb-1 text-base font-semibold text-primary">{report.name}</h3>
                      <p className="text-xs text-on-surface-variant">{report.description}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleExport(report.id, report.name)}
                      className="flex shrink-0 items-center gap-2 rounded-lg border border-outline-variant px-3 py-1.5 text-xs font-semibold hover:bg-surface-container-low"
                    >
                      <MaterialIcon name="download" className="text-[16px]" />
                      {downloadingReportId === report.id ? 'Exporting…' : 'Export'}
                    </button>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-outline">
                    <span className="rounded bg-secondary-fixed px-2.5 py-0.5 font-bold uppercase text-on-secondary-fixed">
                      {report.type}
                    </span>
                    <span>Published {report.date}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
