import { useState } from 'react';
import { motion } from 'motion/react';
import MaterialIcon from './ui/MaterialIcon';
import type { BusinessType } from '../lib/authApi';

interface EntranceGatePageProps {
  founderName: string;
  founderEmail?: string;
  onChoose: (type: BusinessType) => Promise<void>;
  onLogout?: () => void;
}

const NEW_BRAND_HIGHLIGHTS = [
  { icon: 'psychology', label: 'CEO discovery interview' },
  { icon: 'category', label: '70 industry playbooks' },
  { icon: 'rocket_launch', label: 'Adaptive execution plan' },
  { icon: 'auto_awesome', label: 'CEO drafts your blueprint' },
];

const EXISTING_HIGHLIGHTS = [
  { icon: 'fact_check', label: 'Business audit & intake' },
  { icon: 'trending_up', label: 'Identify highest-impact moves' },
  { icon: 'workspace_premium', label: 'Mode 2 audit workflow' },
  { icon: 'insights', label: 'Live operations steering' },
];

export default function EntranceGatePage({
  founderName,
  founderEmail,
  onChoose,
  onLogout,
}: EntranceGatePageProps) {
  const [busy, setBusy] = useState<BusinessType | null>(null);

  const handle = async (type: BusinessType) => {
    setBusy(type);
    try {
      await onChoose(type);
    } finally {
      setBusy(null);
    }
  };

  const firstName = founderName.split(' ')[0] || 'there';
  const initial = firstName.charAt(0).toUpperCase() || 'N';

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-surface px-6 py-10">
      <div className="pointer-events-none fixed inset-0 overflow-hidden opacity-40">
        <div className="absolute -left-[5%] -top-[10%] h-[40%] w-[40%] rounded-full bg-secondary/5 blur-[120px]" />
        <div className="absolute -right-[5%] top-[20%] h-[35%] w-[35%] rounded-full bg-primary-fixed-dim/10 blur-[100px]" />
        <div className="absolute bottom-0 right-[5%] h-[50%] w-[30%] rounded-full bg-primary-fixed-dim/10 blur-[100px]" />
      </div>

      <main className="relative z-10 w-full max-w-[960px]">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary shadow-md">
              <MaterialIcon name="smart_toy" className="text-[20px] text-on-primary" />
            </div>
            <div>
              <p className="text-sm font-bold text-primary">Nexus AI</p>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-outline">Enterprise OS</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-full border border-outline-variant bg-surface-container-lowest px-3 py-1.5 shadow-sm">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-on-primary">
                {initial}
              </div>
              <div className="leading-tight">
                <p className="text-xs font-semibold text-on-surface">{founderName}</p>
                {founderEmail && <p className="text-[10px] text-outline">{founderEmail}</p>}
              </div>
              <span className="ml-1 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-bold text-emerald-700">
                <span className="h-1 w-1 rounded-full bg-emerald-600" />
                Active
              </span>
            </div>
            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                className="rounded-lg border border-outline-variant px-3 py-1.5 text-xs font-semibold text-on-surface-variant hover:bg-surface-container-low"
              >
                <MaterialIcon name="logout" className="text-[16px]" />
              </button>
            )}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="mb-8 text-center"
        >
          <p className="mb-2 inline-flex items-center gap-2 rounded-full border border-secondary/30 bg-secondary/5 px-3 py-1 text-xs font-bold uppercase tracking-wider text-secondary">
            <MaterialIcon name="auto_awesome" className="text-[14px]" />
            Step 1 of 2 · Entrance
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-primary md:text-4xl">
            Welcome, {firstName}
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-on-surface-variant">
            Tell us where you are today so we can shape the right operating system — your agents,
            deliverables, and continuous loop questions are tuned to your stage.
          </p>
        </motion.div>

        <div className="grid gap-5 md:grid-cols-2">
          <ChoiceCard
            tone="emerald"
            icon="rocket_launch"
            title="Create new startup"
            blurb="Hotel, SaaS, restaurant, agency, e-commerce — launch from scratch with adaptive discovery."
            highlights={NEW_BRAND_HIGHLIGHTS}
            cta="Start fresh"
            ctaIcon="arrow_forward"
            busy={busy === 'new_brand'}
            disabled={!!busy}
            onClick={() => handle('new_brand')}
          />
          <ChoiceCard
            tone="primary"
            icon="storefront"
            title="Import existing business"
            blurb="Already operating? Nexus analyzes your business and drives the next highest-impact action."
            highlights={EXISTING_HIGHLIGHTS}
            cta="Connect company"
            ctaIcon="login"
            busy={busy === 'existing_business'}
            disabled={!!busy}
            onClick={() => handle('existing_business')}
          />
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-2 text-[11px] text-on-surface-variant">
          <MaterialIcon name="edit_note" className="text-[14px]" />
          You can change this later in Settings. Next up: a CEO discovery interview.
        </div>
      </main>
    </div>
  );
}

function ChoiceCard({
  tone,
  icon,
  title,
  blurb,
  highlights,
  cta,
  ctaIcon,
  busy,
  disabled,
  onClick,
}: {
  tone: 'primary' | 'emerald';
  icon: string;
  title: string;
  blurb: string;
  highlights: { icon: string; label: string }[];
  cta: string;
  ctaIcon: string;
  busy: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  const isPrimary = tone === 'primary';
  return (
    <motion.button
      type="button"
      disabled={disabled}
      onClick={onClick}
      whileHover={{ y: -2 }}
      transition={{ type: 'spring', stiffness: 300, damping: 22 }}
      className={`group relative flex flex-col items-stretch overflow-hidden rounded-2xl border-2 bg-surface-container-lowest p-6 text-left transition-all ${
        isPrimary
          ? 'border-outline-variant hover:border-primary hover:shadow-xl'
          : 'border-outline-variant hover:border-secondary hover:shadow-xl'
      } disabled:opacity-60`}
    >
      <div
        className={`pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full blur-2xl transition-opacity ${
          isPrimary ? 'bg-primary/10 group-hover:bg-primary/20' : 'bg-secondary/10 group-hover:bg-secondary/20'
        }`}
      />
      <div className="relative flex items-center justify-between">
        <div
          className={`flex h-14 w-14 items-center justify-center rounded-xl ${
            isPrimary
              ? 'bg-primary/10 text-primary group-hover:bg-primary group-hover:text-on-primary'
              : 'bg-secondary/10 text-secondary group-hover:bg-secondary group-hover:text-on-secondary'
          } transition-colors`}
        >
          <MaterialIcon name={icon} className="text-[28px]" />
        </div>
        <span
          className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
            isPrimary ? 'bg-primary/10 text-primary' : 'bg-secondary/10 text-secondary'
          }`}
        >
          {isPrimary ? 'Mode 1' : 'Mode 2'}
        </span>
      </div>
      <h2 className="relative mt-5 text-xl font-bold text-primary">{title}</h2>
      <p className="relative mt-2 text-sm text-on-surface-variant">{blurb}</p>

      <ul className="relative mt-4 space-y-2">
        {highlights.map((h) => (
          <li key={h.label} className="flex items-center gap-2 text-xs text-on-surface">
            <MaterialIcon
              name={h.icon}
              className={isPrimary ? 'text-primary' : 'text-secondary'}
            />
            <span>{h.label}</span>
          </li>
        ))}
      </ul>

      <div className="relative mt-6 flex items-center justify-between border-t border-outline-variant/60 pt-4">
        <p
          className={`text-xs font-bold uppercase tracking-wider ${
            isPrimary ? 'text-primary' : 'text-secondary'
          }`}
        >
          {busy ? 'Saving…' : cta}
        </p>
        <div
          className={`flex h-8 w-8 items-center justify-center rounded-full ${
            isPrimary
              ? 'bg-primary/10 text-primary group-hover:bg-primary group-hover:text-on-primary'
              : 'bg-secondary/10 text-secondary group-hover:bg-secondary group-hover:text-on-secondary'
          } transition-colors`}
        >
          {busy ? (
            <MaterialIcon name="progress_activity" className="animate-spin text-[16px]" />
          ) : (
            <MaterialIcon name={ctaIcon} className="text-[16px]" />
          )}
        </div>
      </div>
    </motion.button>
  );
}
