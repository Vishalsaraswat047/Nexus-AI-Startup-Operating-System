import { useEffect, useMemo, useState } from 'react';
import MaterialIcon from '../ui/MaterialIcon';
import { fetchIndustriesApi, industriesForCategory, type IndustryListItem } from '../../lib/industryApi';
import type { BusinessCategory } from '../../types/businessProfile';

interface IndustryPickerProps {
  category?: BusinessCategory;
  value: string;
  onChange: (slug: string) => void;
}

export default function IndustryPicker({ category, value, onChange }: IndustryPickerProps) {
  const [all, setAll] = useState<IndustryListItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
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
  }, []);

  const filtered = useMemo(() => {
    if (!all) return [] as IndustryListItem[];
    const base = category ? industriesForCategory(category, all) : all;
    const q = query.trim().toLowerCase();
    if (!q) return base;
    return base.filter(
      (i) =>
        i.displayName.toLowerCase().includes(q) ||
        i.slug.toLowerCase().includes(q) ||
        i.blurb.toLowerCase().includes(q) ||
        i.keyMetrics.some((m) => m.toLowerCase().includes(q)),
    );
  }, [all, category, query]);

  if (error) {
    return (
      <div className="rounded-lg border border-error/30 bg-error/5 p-3 text-sm text-error">
        {error}
      </div>
    );
  }

  if (!all) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-outline-variant bg-surface-container-low px-3 py-2 text-xs text-on-surface-variant">
        <span className="h-3 w-3 animate-pulse rounded-full bg-secondary" />
        Loading 70+ industry playbooks…
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2">
        <MaterialIcon name="search" className="text-on-surface-variant" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search industries — hotel, SaaS, restaurant, coaching…"
          className="w-full bg-transparent text-sm text-on-surface outline-none placeholder:text-on-surface-variant"
        />
        <span className="shrink-0 rounded-full bg-secondary/10 px-2 py-0.5 text-[10px] font-bold text-secondary">
          {filtered.length}
        </span>
      </div>

      {value && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-sm">
          <p className="text-on-surface">
            <span className="font-bold text-primary">Selected: </span>
            {all.find((i) => i.slug === value)?.displayName ?? value}
          </p>
          <button
            type="button"
            onClick={() => onChange('')}
            className="rounded-md border border-outline-variant px-2 py-0.5 text-xs font-semibold text-on-surface-variant hover:bg-surface-container"
          >
            Clear
          </button>
        </div>
      )}

      <div className="grid max-h-72 grid-cols-2 gap-2 overflow-y-auto pr-1 sm:grid-cols-3 md:grid-cols-4">
        {filtered.map((i) => {
          const isSelected = value === i.slug;
          return (
            <button
              key={i.slug}
              type="button"
              onClick={() => onChange(i.slug)}
              className={
                'flex flex-col items-start gap-1 rounded-xl border p-3 text-left transition-all ' +
                (isSelected
                  ? 'border-primary bg-primary/10 ring-2 ring-primary/30'
                  : 'border-outline-variant bg-surface-container-lowest hover:border-primary/40 hover:bg-primary/5')
              }
            >
              <div className="flex w-full items-center gap-2">
                <span className="text-xl">{i.icon}</span>
                {isSelected && <MaterialIcon name="check_circle" className="ml-auto text-primary" filled />}
              </div>
              <p className="line-clamp-1 text-sm font-bold text-on-surface">{i.displayName}</p>
              <p className="line-clamp-2 text-[11px] leading-snug text-on-surface-variant">{i.blurb}</p>
              <div className="mt-1 flex w-full items-center gap-1 text-[10px] font-semibold text-secondary">
                <MaterialIcon name="view_kanban" className="text-[12px]" />
                {i.mode1StageCount} stages
              </div>
            </button>
          );
        })}
        {filtered.length === 0 && (
          <div className="col-span-full rounded-lg border border-dashed border-outline-variant py-6 text-center text-xs text-on-surface-variant">
            No industries match “{query}”. Try a different keyword.
          </div>
        )}
      </div>

      <p className="text-[11px] text-on-surface-variant">
        Each industry has a tailored Mode 1 (build from zero) + Mode 2 (audit existing) workflow with
        the right agents, deliverables, and continuous-loop questions.
      </p>
    </div>
  );
}
