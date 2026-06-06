import MaterialIcon from '../ui/MaterialIcon';
import type { AppTab } from '../../types/navigation';

interface NavItem {
  id: AppTab;
  icon: string;
  label: string;
}

const CORE_NAV: NavItem[] = [
  { id: 'dashboard', icon: 'dashboard', label: 'Execution' },
  { id: 'goals', icon: 'track_changes', label: 'Goals' },
  { id: 'projects', icon: 'account_tree', label: 'Projects' },
  { id: 'timeline', icon: 'calendar_today', label: 'Timeline' },
  { id: 'departments', icon: 'corporate_fare', label: 'Departments' },
  { id: 'workforce', icon: 'smart_toy', label: 'AI Workforce' },
  { id: 'reports', icon: 'description', label: 'Reports' },
];

const INTELLIGENCE_NAV: NavItem[] = [
  { id: 'chat', icon: 'forum', label: 'Executive Chat' },
  { id: 'memory', icon: 'menu_book', label: 'Knowledge Base' },
  { id: 'market', icon: 'travel_explore', label: 'Market & Research' },
  { id: 'analytics', icon: 'insights', label: 'Analytics' },
];

const SYSTEM_NAV: NavItem[] = [
  { id: 'integrations', icon: 'extension', label: 'Integrations' },
  { id: 'settings', icon: 'settings', label: 'Settings' },
  { id: 'admin', icon: 'admin_panel_settings', label: 'Admin Center' },
];

interface AppSidebarProps {
  activeTab: AppTab;
  onNavigate: (tab: AppTab) => void;
  founderName: string;
  businessName?: string;
  stage?: string;
  workforceCount?: number;
  onOpenProfile: () => void;
}

function NavButton({
  item,
  active,
  onNavigate,
}: {
  item: NavItem;
  active: boolean;
  onNavigate: (tab: AppTab) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onNavigate(item.id)}
      className={`flex w-full items-center gap-3 rounded-lg px-4 py-2.5 text-left transition-colors duration-200 active:scale-[0.98] ${
        active
          ? 'border-r-2 border-secondary bg-surface-container-low font-semibold text-primary'
          : 'text-on-surface-variant hover:bg-surface-container-low hover:text-primary'
      }`}
    >
      <MaterialIcon name={item.icon} className="text-[20px]" />
      <span className="text-sm">{item.label}</span>
    </button>
  );
}

export default function AppSidebar({
  activeTab,
  onNavigate,
  founderName,
  businessName = 'Nexus AI Inc.',
  stage = 'Growth Stage',
  workforceCount = 0,
  onOpenProfile,
}: AppSidebarProps) {
  const initials =
    founderName
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase() || 'AF';

  const agentCap = Math.min(100, Math.max(workforceCount, 1));
  const agentPct = Math.min(100, Math.round((workforceCount / 100) * 100)) || 12;

  return (
    <aside className="fixed left-0 top-0 z-50 flex h-screen w-[220px] flex-col border-r border-outline-variant bg-surface-container-lowest py-stack-md px-stack-sm">
      <div className="mb-8 px-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded bg-primary font-bold text-on-primary">
            N
          </div>
          <div>
            <h1 className="text-headline-md font-headline-md font-bold leading-tight text-primary">
              Nexus AI
            </h1>
            <p className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant">
              Enterprise OS
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto">
        <NavButton item={CORE_NAV[0]} active={activeTab === 'dashboard'} onNavigate={onNavigate} />
        <div className="mt-4 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-outline">
          Core
        </div>
        {CORE_NAV.slice(1).map((item) => (
          <NavButton key={item.id} item={item} active={activeTab === item.id} onNavigate={onNavigate} />
        ))}
        <div className="mt-4 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-outline">
          Intelligence
        </div>
        {INTELLIGENCE_NAV.map((item) => (
          <NavButton key={item.id} item={item} active={activeTab === item.id} onNavigate={onNavigate} />
        ))}
        <div className="mt-4 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-outline">
          System
        </div>
        {SYSTEM_NAV.map((item) => (
          <NavButton key={item.id} item={item} active={activeTab === item.id} onNavigate={onNavigate} />
        ))}
      </nav>

      <div className="mt-auto space-y-4 border-t border-outline-variant px-4 pt-4">
        <div className="rounded-lg bg-secondary p-3 text-on-secondary">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase">Pro Plan</span>
            <span className="rounded bg-white/20 px-1.5 py-0.5 text-[10px]">Active</span>
          </div>
          <div className="mb-2 text-xs opacity-90">
            Agents: {agentCap}/{100}
          </div>
          <div className="mb-3 h-1.5 w-full rounded-full bg-white/20">
            <div className="h-1.5 rounded-full bg-white" style={{ width: `${agentPct}%` }} />
          </div>
          <button
            type="button"
            className="w-full rounded-md bg-white py-2 text-xs font-bold text-primary transition-transform active:scale-95"
          >
            Upgrade Plan
          </button>
        </div>

        <button
          type="button"
          onClick={onOpenProfile}
          className={`flex w-full cursor-pointer items-center gap-3 rounded-lg py-2 px-1 text-left transition-colors hover:bg-surface-container-low ${
            activeTab === 'profile' ? 'bg-surface-container-low ring-1 ring-secondary/30' : ''
          }`}
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-container text-sm font-bold text-on-surface">
            {initials}
          </div>
          <div className="min-w-0 flex-1 overflow-hidden">
            <p className="truncate text-sm font-bold">{founderName}</p>
            <p className="truncate text-[10px] text-on-surface-variant">
              {businessName} · {stage}
            </p>
          </div>
          <MaterialIcon name="expand_more" className="ml-auto text-outline" />
        </button>
      </div>
    </aside>
  );
}
