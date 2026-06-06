import { ReactNode } from 'react';
import AppSidebar from './AppSidebar';
import TopNavBar from './TopNavBar';
import type { AppTab } from '../../types/navigation';

interface AppShellProps {
  activeTab: AppTab;
  onNavigate: (tab: AppTab) => void;
  founderName: string;
  businessName?: string;
  stage?: string;
  workforceCount?: number;
  onOpenProfile: () => void;
  children: ReactNode;
}

export default function AppShell({
  activeTab,
  onNavigate,
  founderName,
  businessName,
  stage,
  workforceCount,
  onOpenProfile,
  children,
}: AppShellProps) {
  return (
    <div className="min-h-screen bg-surface font-body-md text-on-surface">
      <AppSidebar
        activeTab={activeTab}
        onNavigate={onNavigate}
        founderName={founderName}
        businessName={businessName}
        stage={stage}
        workforceCount={workforceCount}
        onOpenProfile={onOpenProfile}
      />
      <main className="ml-[220px] flex min-h-screen flex-col">
        <TopNavBar
          activeTab={activeTab}
          businessName={businessName}
          stage={stage}
          onOpenProfile={onOpenProfile}
        />
        <div className="mx-auto w-full max-w-[1440px] flex-1 p-margin-page">{children}</div>
      </main>
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-stack-lg flex items-end justify-between">
      <div>
        <h2 className="text-headline-lg font-headline-lg text-primary">{title}</h2>
        {subtitle && <p className="mt-1 text-on-surface-variant">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function StitchCard({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-outline-variant bg-surface-container-lowest p-6 shadow-[0px_4px_20px_rgba(0,0,0,0.03)] ${className}`}
    >
      {children}
    </div>
  );
}
