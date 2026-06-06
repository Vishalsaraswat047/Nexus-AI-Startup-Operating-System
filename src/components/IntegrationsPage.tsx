import { useMemo, useState } from 'react';
import MaterialIcon from './ui/MaterialIcon';
import { StitchPageHeader } from './stitch/StitchPageHeader';
import type { BusinessTwin } from '../types';
import { INTEGRATION_DEFS, INTEGRATION_CATEGORIES } from '../../shared/integrations';

const CATALOG = INTEGRATION_DEFS;

interface IntegrationsPageProps {
  twin: BusinessTwin;
  onAddLog: (msg: string) => void;
}

export default function IntegrationsPage({ twin, onAddLog }: IntegrationsPageProps) {
  const [category, setCategory] = useState<string>('All');
  const [search, setSearch] = useState('');
  const [connected, setConnected] = useState<Set<string>>(new Set());

  const isConnected = (id: string) => connected.has(id);

  const toggleConnection = (id: string, name: string) => {
    setConnected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        onAddLog(`Integration disconnected: ${name}`);
      } else {
        next.add(id);
        onAddLog(`Integration connected: ${name}`);
      }
      return next;
    });
  };

  const filtered = CATALOG.filter((item) => {
    const matchesCategory = category === 'All' || item.category === category;
    const matchesSearch = !search ||
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.description.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const connectedCount = connected.size;
  const categories = ['All', ...INTEGRATION_CATEGORIES.map((c) => c.id)];

  return (
    <div className="space-y-6">
      <StitchPageHeader
        title="Integration Marketplace"
        subtitle={`${connectedCount} of ${CATALOG.length} integrations connected`}
        breadcrumb={{ parent: 'Executive', current: 'Integrations' }}
      />

      <div className="flex flex-col gap-4 sm:flex-row">
        <input
          type="text"
          placeholder="Search integrations..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-2 text-sm"
        />
        <div className="flex flex-wrap gap-2">
          {categories.slice(0, 8).map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                category === cat
                  ? 'bg-primary text-on-primary'
                  : 'border border-outline-variant bg-surface-container-low text-on-surface-variant hover:bg-surface-container-low'
              }`}
            >
              {cat === 'All' ? 'All' : cat.charAt(0).toUpperCase() + cat.slice(1).replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filtered.map((item) => {
          const on = isConnected(item.id);
          return (
            <div
              key={item.id}
              className={`rounded-2xl border p-4 transition-shadow hover:shadow-md ${
                on
                  ? 'border-emerald-500/30 bg-emerald-500/5'
                  : 'border-outline-variant bg-surface-container-lowest'
              }`}
            >
              <div className="mb-3 flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                    item.tone === 'emerald' ? 'bg-emerald-500/10' :
                    item.tone === 'indigo' ? 'bg-indigo-500/10' :
                    item.tone === 'violet' ? 'bg-violet-500/10' :
                    item.tone === 'rose' ? 'bg-rose-500/10' :
                    item.tone === 'amber' ? 'bg-amber-500/10' :
                    item.tone === 'teal' ? 'bg-teal-500/10' :
                    'bg-secondary/10'
                  }`}>
                    <span className="text-lg">{item.glyph}</span>
                  </div>
                  <div>
                    <p className="font-bold text-on-surface">{item.name}</p>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-outline">
                      {item.category.replace('_', ' ')}
                      {item.region && ` · ${item.region}`}
                    </p>
                  </div>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                    on ? 'bg-emerald-100 text-emerald-700' : 'bg-surface-container text-outline'
                  }`}
                >
                  {on ? 'Connected' : 'Available'}
                </span>
              </div>

              <p className="mb-3 text-xs text-on-surface-variant line-clamp-2">{item.description}</p>

              <div className="mb-3 flex flex-wrap gap-1">
                {item.capabilities.slice(0, 3).map((cap) => (
                  <span
                    key={cap}
                    className="rounded bg-surface-container px-1.5 py-0.5 text-[10px] text-on-surface-variant"
                  >
                    {cap}
                  </span>
                ))}
                {item.capabilities.length > 3 && (
                  <span className="text-[10px] text-outline">+{item.capabilities.length - 3} more</span>
                )}
              </div>

              <button
                type="button"
                onClick={() => toggleConnection(item.id, item.name)}
                className={`w-full rounded-lg py-2 text-sm font-bold transition-colors ${
                  on
                    ? 'border border-outline-variant text-on-surface-variant hover:bg-surface-container-low'
                    : 'bg-primary text-on-primary hover:opacity-90'
                }`}
              >
                {on ? 'Configure' : 'Connect'}
              </button>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="rounded-2xl border-2 border-dashed border-outline-variant bg-surface-container-low/30 p-8 text-center">
          <MaterialIcon name="search_off" className="mx-auto mb-3 text-4xl text-outline" />
          <h3 className="font-bold text-primary">No integrations found</h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-on-surface-variant">
            Try adjusting your search or filter criteria.
          </p>
        </div>
      )}

      <div className="rounded-2xl border-2 border-dashed border-outline-variant bg-surface-container-low/30 p-8 text-center">
        <MaterialIcon name="extension" className="mx-auto mb-3 text-4xl text-outline" />
        <h3 className="font-bold text-primary">Need a custom connector?</h3>
        <p className="mx-auto mt-2 max-w-md text-sm text-on-surface-variant">
          200+ integrations available. Contact support for custom API connectors.
        </p>
      </div>
    </div>
  );
}