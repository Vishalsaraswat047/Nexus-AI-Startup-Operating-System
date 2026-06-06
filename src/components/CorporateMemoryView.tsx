import { useState } from 'react';
import type { BusinessTwin, CorporateMemory } from '../types';
import MaterialIcon from './ui/MaterialIcon';
import { StitchPageHeader } from './stitch/StitchPageHeader';

interface CorporateMemoryViewProps {
  twin: BusinessTwin;
  memory: CorporateMemory;
  onUpdateMemory: (section: keyof CorporateMemory, items: string[]) => void;
  onAddLog: (msg: string) => void;
}

const sectionsConfig: {
  id: keyof CorporateMemory;
  name: string;
  icon: string;
  description: string;
}[] = [
  {
    id: 'business',
    name: 'Business Memory',
    icon: 'database',
    description: 'Company overview, tools, market positioning, and integrations.',
  },
  {
    id: 'strategic',
    name: 'Strategy & Goals',
    icon: 'track_changes',
    description: 'Vision, runway, budget targets, and milestone outlines.',
  },
  {
    id: 'operational',
    name: 'Operational Flow',
    icon: 'lightbulb',
    description: 'Sprint schedules, task status, and assignee directory.',
  },
  {
    id: 'learning',
    name: 'Lessons & Insights',
    icon: 'menu_book',
    description: 'Post-mortems, risks mitigated, and team learnings.',
  },
  {
    id: 'customer',
    name: 'Customer Memory',
    icon: 'groups',
    description: 'ICP, feedback, and customer interaction history from agent actions.',
  },
  {
    id: 'failure',
    name: 'Failure Memory',
    icon: 'warning',
    description: 'Risks, root causes, and replanning outcomes — never repeat mistakes.',
  },
];

export default function CorporateMemoryView({
  twin,
  memory,
  onUpdateMemory,
  onAddLog,
}: CorporateMemoryViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [addingToSection, setAddingToSection] = useState<keyof CorporateMemory | null>(null);
  const [newItemInput, setNewItemInput] = useState('');

  const handleAddItem = (section: keyof CorporateMemory) => {
    if (!newItemInput.trim()) return;
    const updated = [...(memory[section] || []), newItemInput.trim()];
    onUpdateMemory(section, updated);
    onAddLog(`Corporate Memory: Added entry to ${section}.`);
    setNewItemInput('');
    setAddingToSection(null);
  };

  const handleRemoveItem = (section: keyof CorporateMemory, index: number) => {
    const updated = (memory[section] || []).filter((_, i) => i !== index);
    onUpdateMemory(section, updated);
    onAddLog(`Corporate Memory: Removed entry from ${section}.`);
  };

  const totalItems = Object.values(memory).flat().length;

  return (
    <div className="space-y-stack-lg">
      <StitchPageHeader
        title="Knowledge Base"
        subtitle={`${twin.name} · ${totalItems} indexed memory entries`}
        breadcrumb={{ parent: 'Executive', current: 'Knowledge' }}
      />

      <div className="relative">
        <MaterialIcon
          name="search"
          className="absolute left-4 top-1/2 -translate-y-1/2 text-outline"
        />
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search corporate intelligence memory..."
          className="h-12 w-full rounded-xl border border-outline-variant bg-surface-container-lowest pl-12 pr-4 text-sm outline-none focus:border-secondary focus:ring-1 focus:ring-secondary"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {sectionsConfig.map((section) => {
          const liveItems = memory[section.id] || [];
          const filteredItems = liveItems.filter((item) =>
            item.toLowerCase().includes(searchQuery.toLowerCase()),
          );

          return (
            <div
              key={section.id}
              className="flex flex-col justify-between space-y-4 rounded-2xl border border-outline-variant bg-surface-container-lowest p-6 shadow-sm"
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary-fixed">
                      <MaterialIcon name={section.icon} className="text-secondary" />
                    </div>
                    <div>
                      <h2 className="text-base font-semibold text-primary">{section.name}</h2>
                      <p className="mt-1 text-xs text-on-surface-variant">
                        {filteredItems.length} live records
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setAddingToSection(addingToSection === section.id ? null : section.id);
                      setNewItemInput('');
                    }}
                    className="flex h-8 items-center gap-1 rounded-lg border border-outline-variant px-2.5 text-xs font-semibold hover:bg-surface-container-low"
                  >
                    <MaterialIcon name="add" className="text-[16px]" />
                    Add
                  </button>
                </div>
                <p className="text-xs leading-relaxed text-on-surface-variant">{section.description}</p>

                {addingToSection === section.id && (
                  <div className="flex gap-2 rounded-xl border border-outline-variant bg-surface-container-low p-3">
                    <input
                      type="text"
                      value={newItemInput}
                      onChange={(e) => setNewItemInput(e.target.value)}
                      placeholder="Add knowledge entry..."
                      className="flex-1 border-none bg-transparent text-xs outline-none"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAddItem(section.id);
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => handleAddItem(section.id)}
                      disabled={!newItemInput.trim()}
                      className="rounded-lg bg-primary px-3 py-1 text-[10px] font-bold text-on-primary disabled:opacity-50"
                    >
                      Save
                    </button>
                  </div>
                )}

                <div className="max-h-56 space-y-2 overflow-y-auto pr-1">
                  {filteredItems.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-outline-variant py-8 text-center text-[11px] text-on-surface-variant">
                      No records in this bucket.
                    </div>
                  ) : (
                    filteredItems.map((item, idx) => (
                      <div
                        key={`${item}-${idx}`}
                        className="flex items-start justify-between gap-3 rounded-xl border border-outline-variant/50 bg-surface-container-low p-3"
                      >
                        <p className="flex-1 text-xs leading-relaxed text-primary">
                          <span className="mr-1.5 text-secondary">↳</span>
                          {item}
                        </p>
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(section.id, idx)}
                          className="text-outline hover:text-error"
                          title="Delete"
                        >
                          <MaterialIcon name="delete" className="text-[18px]" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
