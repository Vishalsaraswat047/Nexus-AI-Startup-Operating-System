import { useMemo, useState } from 'react';
import MaterialIcon from './ui/MaterialIcon';
import { StitchPageHeader } from './stitch/StitchPageHeader';
import type { BusinessTwin } from '../types';

const CATALOG = [
  { id: 'slack', name: 'Slack', category: 'Productivity', icon: 'chat', desc: 'Team notifications and agent alerts.' },
  { id: 'github', name: 'GitHub', category: 'Development', icon: 'code', desc: 'Repos, PRs, and engineering workflows.' },
  { id: 'stripe', name: 'Stripe', category: 'Financial', icon: 'payments', desc: 'Revenue and subscription telemetry.' },
  { id: 'aws', name: 'AWS', category: 'Infrastructure', icon: 'cloud', desc: 'Cloud spend and deployment hooks.' },
  { id: 'notion', name: 'Notion', category: 'Productivity', icon: 'description', desc: 'Docs and knowledge sync.' },
  { id: 'hubspot', name: 'HubSpot', category: 'Growth', icon: 'campaign', desc: 'CRM and outbound pipelines.' },
] as const;

interface IntegrationsPageProps {
  twin: BusinessTwin;
  onAddLog: (msg: string) => void;
}

export default function IntegrationsPage({ twin, onAddLog }: IntegrationsPageProps) {
  const [category, setCategory] = useState<string>('All Services');
  const [overrides, setOverrides] = useState<Record<string, boolean>>({});

  const connectedFromTwin = useMemo(() => {
    const tools = twin.tools.map((t) => t.toLowerCase());
    return (name: string) => tools.some((t) => t.includes(name.toLowerCase()));
  }, [twin.tools]);

  const isConnected = (id: string, name: string) =>
    overrides[id] ?? connectedFromTwin(name);

  const categories = [
    'All Services',
    'Productivity',
    'Development',
    'Financial',
    'Infrastructure',
    'Growth',
  ];

  const filtered = CATALOG.filter(
    (c) => category === 'All Services' || c.category === category,
  );

  const connectedCount = CATALOG.filter((c) => isConnected(c.id, c.name)).length;

  const toggle = (id: string, name: string) => {
    const next = !isConnected(id, name);
    setOverrides((o) => ({ ...o, [id]: next }));
    onAddLog(`Integrations: ${name} ${next ? 'connected' : 'disconnected'} for ${twin.name}.`);
  };

  return (
    <div className="space-y-stack-lg">
      <StitchPageHeader
        title="Tool Integration Marketplace"
        subtitle={`${connectedCount} connected · Stack from onboarding: ${twin.tools.join(', ') || 'none'}`}
        breadcrumb={{ parent: 'Executive', current: 'Integrations' }}
        action={
          <button
            type="button"
            onClick={() => onAddLog('Integrations: Custom API connector wizard opened.')}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-on-primary"
          >
            Custom API
          </button>
        }
      />

      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setCategory(cat)}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
              category === cat
                ? 'bg-primary text-on-primary'
                : 'border border-outline-variant bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container-low'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((item) => {
          const on = isConnected(item.id, item.name);
          return (
            <div
              key={item.id}
              className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-6 shadow-[0px_4px_20px_rgba(0,0,0,0.03)] transition-shadow hover:shadow-md"
            >
              <div className="mb-4 flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary-fixed">
                    <MaterialIcon name={item.icon} className="text-secondary" />
                  </div>
                  <div>
                    <p className="font-bold text-primary">{item.name}</p>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-outline">
                      {item.category}
                    </p>
                  </div>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                    on ? 'bg-emerald-50 text-emerald-700' : 'bg-surface-container text-outline'
                  }`}
                >
                  {on ? 'Connected' : 'Available'}
                </span>
              </div>
              <p className="mb-4 text-xs text-on-surface-variant">{item.desc}</p>
              <button
                type="button"
                onClick={() => toggle(item.id, item.name)}
                className={`w-full rounded-lg py-2 text-sm font-bold ${
                  on
                    ? 'border border-outline-variant text-on-surface-variant hover:bg-surface-container-low'
                    : 'bg-secondary text-on-secondary hover:opacity-90'
                }`}
              >
                {on ? 'Disconnect' : 'Connect'}
              </button>
            </div>
          );
        })}
      </div>

      <div className="rounded-2xl border-2 border-dashed border-outline-variant bg-surface-container-low/30 p-8 text-center">
        <MaterialIcon name="extension" className="mx-auto mb-3 text-4xl text-outline" />
        <h3 className="font-bold text-primary">Need a custom connector?</h3>
        <p className="mx-auto mt-2 max-w-md text-sm text-on-surface-variant">
          Wire proprietary APIs into {twin.name}&apos;s autonomous control layer.
        </p>
      </div>
    </div>
  );
}
