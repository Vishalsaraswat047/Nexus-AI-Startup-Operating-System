import MaterialIcon from '../ui/MaterialIcon';
import type { AppTab } from '../../types/navigation';
import { TAB_LABELS } from '../../types/navigation';

interface TopNavBarProps {
  activeTab: AppTab;
  businessName?: string;
  stage?: string;
  searchPlaceholder?: string;
  onOpenProfile?: () => void;
}

export default function TopNavBar({
  activeTab,
  businessName = 'Nexus AI Inc.',
  stage = 'Growth Stage',
  searchPlaceholder = 'Search anything...',
  onOpenProfile,
}: TopNavBarProps) {
  const meta = TAB_LABELS[activeTab];
  const today = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-outline-variant bg-surface/70 px-margin-page shadow-sm backdrop-blur-xl">
      <div className="flex flex-1 items-center gap-4">
        <div className="relative w-full max-w-md rounded-lg focus-within:ring-2 focus-within:ring-secondary/20">
          <MaterialIcon
            name="search"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[20px] text-outline"
          />
          <input
            type="text"
            placeholder={searchPlaceholder}
            className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest py-2 pl-10 pr-16 text-sm outline-none focus:border-secondary focus:ring-0"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 rounded border border-outline-variant px-1.5 py-0.5 font-mono text-[10px] text-outline">
            ⌘K
          </div>
        </div>
      </div>
      <div className="flex items-center gap-6">
        <button type="button" className="text-on-surface-variant transition-colors hover:text-primary">
          <MaterialIcon name="light_mode" className="text-[24px]" />
        </button>
        <button
          type="button"
          className="relative text-on-surface-variant transition-colors hover:text-primary"
        >
          <MaterialIcon name="notifications" className="text-[24px]" />
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-error text-[10px] font-bold text-on-surface">
            3
          </span>
        </button>
        <button
          type="button"
          onClick={onOpenProfile}
          className="flex items-center gap-3 border-l border-outline-variant pl-6 transition-colors hover:opacity-80"
          title="Open profile"
        >
          <div className="text-right">
            <p className="text-sm font-bold">{businessName}</p>
            <p className="text-[10px] font-semibold uppercase tracking-tighter text-secondary">
              {stage}
            </p>
          </div>
          <div className="flex h-8 w-8 items-center justify-center rounded-full border border-outline-variant bg-surface-container-low text-xs font-bold text-primary">
            {businessName.charAt(0)}
          </div>
        </button>
        {activeTab !== 'dashboard' && (
          <div className="hidden border-l border-outline-variant pl-6 text-right lg:block">
            <p className="text-sm font-bold">{meta.title}</p>
            <p className="text-[10px] text-outline">{meta.subtitle}</p>
          </div>
        )}
        {activeTab === 'dashboard' && (
          <div className="hidden items-center gap-2 rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-2 text-sm font-semibold lg:flex">
            <MaterialIcon name="calendar_today" className="text-[20px]" />
            <span>{today}</span>
            <MaterialIcon name="chevron_right" />
          </div>
        )}
      </div>
    </header>
  );
}
