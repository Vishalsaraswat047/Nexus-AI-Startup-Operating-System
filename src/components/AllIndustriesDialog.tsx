import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import MaterialIcon from './ui/MaterialIcon';
import {
  fetchIndustriesApi,
  industriesForCategory,
  type IndustryListItem,
} from '../lib/industryApi';
import type { BusinessCategory } from '../types/businessProfile';

interface AllIndustriesDialogProps {
  open: boolean;
  onClose: () => void;
}

const CATEGORY_FILTERS: Array<{ value: BusinessCategory | 'All'; label: string; icon: string }> = [
  { value: 'All', label: 'All industries', icon: 'apps' },
  { value: 'Hospitality', label: 'Hospitality', icon: 'hotel' },
  { value: 'SaaS', label: 'SaaS & Tech', icon: 'memory' },
  { value: 'E-commerce', label: 'E-commerce', icon: 'shopping_cart' },
  { value: 'Physical Product', label: 'Physical product', icon: 'inventory_2' },
  { value: 'Service Business', label: 'Services', icon: 'home_repair_service' },
  { value: 'Agency', label: 'Agency', icon: 'campaign' },
  { value: 'Healthcare', label: 'Healthcare', icon: 'medical_services' },
  { value: 'Education', label: 'Education', icon: 'school' },
];

export default function AllIndustriesDialog({ open, onClose }: AllIndustriesDialogProps) {
  const [all, setAll] = useState<IndustryListItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<BusinessCategory | 'All'>('All');

  useEffect(() => {
    if (!open || all) return;
    let cancelled = false;
    fetchIndustriesApi()
      .then((data) => {
        if (!cancelled) setAll(data);
      })
      .catch((e) => {
        if (!cancelled) setError(e?.message ?? 'Could not load industries');
      });
    return () => {
      cancelled = true;
    };
  }, [open, all]);

  useEffect(() => {
    if (!open) {
      setQuery('');
      setCategory('All');
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const filtered = useMemo(() => {
    if (!all) return [] as IndustryListItem[];
    const base =
      category === 'All' ? all : industriesForCategory(category, all);
    const q = query.trim().toLowerCase();
    if (!q) return base;
    return base.filter(
      (i) =>
        i.displayName.toLowerCase().includes(q) ||
        i.slug.toLowerCase().includes(q) ||
        i.blurb.toLowerCase().includes(q) ||
        i.keyMetrics.some((m) => m.toLowerCase().includes(q)) ||
        i.primaryAgents.some((a) => a.toLowerCase().includes(q)),
    );
  }, [all, category, query]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
        >
          <motion.div
            key="panel"
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
            className="relative flex max-h-[88vh] w-full max-w-[1100px] flex-col overflow-hidden rounded-2xl border border-outline-variant bg-surface-container-lowest shadow-2xl"
          >
            <header className="flex items-start justify-between gap-4 border-b border-outline-variant/60 bg-gradient-to-br from-primary-container/40 via-surface-container-lowest to-surface-container-lowest p-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-secondary">Industry playbooks</p>
                <h2 className="mt-1 text-2xl font-bold text-primary">
                  {all ? `${all.length} industries ready` : 'Loading 70+ industries…'}
                </h2>
                <p className="mt-1 max-w-xl text-sm text-on-surface-variant">
                  Each industry ships a Mode 1 (build from zero) + Mode 2 (audit existing) workflow
                  with tailored agents, deliverables, and CEO loop questions.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-outline-variant bg-surface-container-lowest text-on-surface-variant transition-colors hover:bg-surface-container-low hover:text-primary"
                aria-label="Close"
              >
                <MaterialIcon name="close" />
              </button>
            </header>

            <div className="border-b border-outline-variant/60 bg-surface-container-lowest p-4">
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex flex-1 items-center gap-2 rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2">
                  <MaterialIcon name="search" className="text-on-surface-variant" />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search by name, agent, metric…"
                    className="w-full bg-transparent text-sm text-on-surface outline-none placeholder:text-on-surface-variant"
                  />
                  {query && (
                    <button
                      type="button"
                      onClick={() => setQuery('')}
                      className="text-on-surface-variant hover:text-primary"
                      aria-label="Clear search"
                    >
                      <MaterialIcon name="close" className="text-[18px]" />
                    </button>
                  )}
                </div>
                <span className="shrink-0 rounded-full bg-secondary/10 px-3 py-1 text-xs font-bold text-secondary">
                  {filtered.length} shown
                </span>
              </div>

              <div className="mt-3 flex flex-wrap gap-1.5">
                {CATEGORY_FILTERS.map((c) => {
                  const active = category === c.value;
                  return (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setCategory(c.value)}
                      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                        active
                          ? 'border-primary bg-primary text-on-primary'
                          : 'border-outline-variant bg-surface-container-lowest text-on-surface-variant hover:border-primary/40 hover:text-primary'
                      }`}
                    >
                      <MaterialIcon name={c.icon} className="text-[14px]" />
                      {c.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto bg-surface-container-low p-4">
              {error && (
                <div className="flex items-center gap-2 rounded-lg border border-error/30 bg-error/5 p-3 text-sm text-error">
                  <MaterialIcon name="error" />
                  {error}
                </div>
              )}

              {!all && !error && (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-40 animate-pulse rounded-xl border border-outline-variant bg-surface-container-lowest"
                    />
                  ))}
                </div>
              )}

              {all && filtered.length === 0 && (
                <div className="rounded-xl border border-dashed border-outline-variant bg-surface-container-lowest py-12 text-center text-sm text-on-surface-variant">
                  <MaterialIcon name="search_off" className="text-3xl text-outline" />
                  <p className="mt-2">No industries match “{query}” in this category.</p>
                  <button
                    type="button"
                    onClick={() => {
                      setQuery('');
                      setCategory('All');
                    }}
                    className="mt-3 text-xs font-bold text-primary hover:underline"
                  >
                    Reset filters
                  </button>
                </div>
              )}

              {all && filtered.length > 0 && (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {filtered.map((i) => (
                    <div key={i.slug}>
                      <IndustryCard industry={i} />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-outline-variant/60 bg-surface-container-lowest px-6 py-3 text-xs text-on-surface-variant">
              <p>Sign up to pick an industry for your workspace.</p>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-1.5 font-semibold text-on-surface hover:bg-surface-container-low"
              >
                Close
              </button>
            </footer>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function IndustryCard({ industry }: { industry: IndustryListItem }) {
  return (
    <div className="group flex flex-col rounded-xl border border-outline-variant bg-surface-container-lowest p-4 transition-all hover:border-primary/40 hover:shadow-md">
      <div className="flex items-start justify-between">
        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary-container text-2xl">
          {industry.icon}
        </div>
        <span className="rounded-full bg-secondary/10 px-2 py-0.5 text-[10px] font-bold text-secondary">
          {industry.mode1StageCount} stages
        </span>
      </div>
      <h3 className="mt-3 text-sm font-bold text-on-surface">{industry.displayName}</h3>
      <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-on-surface-variant">
        {industry.blurb}
      </p>
      <div className="mt-3 flex flex-wrap gap-1">
        {industry.keyMetrics.slice(0, 2).map((m) => (
          <span
            key={m}
            className="rounded-md border border-outline-variant/60 bg-surface-container-low px-1.5 py-0.5 text-[10px] font-semibold text-on-surface-variant"
          >
            {m}
          </span>
        ))}
      </div>
      <div className="mt-auto flex items-center justify-between border-t border-outline-variant/60 pt-3 text-[10px] text-on-surface-variant">
        <div className="flex items-center gap-1">
          <MaterialIcon name="smart_toy" className="text-[12px] text-secondary" />
          {industry.primaryAgents.length} agents
        </div>
        <div className="flex items-center gap-1">
          <MaterialIcon name="loop" className="text-[12px] text-secondary" />
          {industry.mode1StageCount + industry.mode2StageCount} total
        </div>
      </div>
    </div>
  );
}
