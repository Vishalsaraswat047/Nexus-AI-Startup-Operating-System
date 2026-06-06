import MaterialIcon from './ui/MaterialIcon';
import { useState } from 'react';
import AllIndustriesDialog from './AllIndustriesDialog';

interface LandingPageProps {
  onLogin: () => void;
  onGetStarted?: () => void;
  signedInAs?: string;
}

const FEATURES = [
  {
    icon: 'smart_toy',
    title: 'AI Workforce',
    desc: 'Deploy CEO, COO, CMO, and specialist agents that execute real tasks across your company.',
    tone: 'primary',
  },
  {
    icon: 'track_changes',
    title: 'Strategic Goals',
    desc: 'Decompose objectives into milestones, track completion, and let agents drive delivery.',
    tone: 'emerald',
  },
  {
    icon: 'travel_explore',
    title: 'Market Research',
    desc: 'Automated competitor scans, ICP personas, pricing analysis, and executive briefs.',
    tone: 'indigo',
  },
  {
    icon: 'forum',
    title: 'Executive Chat',
    desc: 'Talk to your C-suite AI agents in dedicated channels synced to live operations.',
    tone: 'violet',
  },
  {
    icon: 'menu_book',
    title: 'Corporate Memory',
    desc: 'Strategic, operational, and learning memory streams that agents read and write.',
    tone: 'teal',
  },
  {
    icon: 'insights',
    title: 'Analytics & Reports',
    desc: 'Health scores, runway, execution timelines, and board-ready summaries.',
    tone: 'rose',
  },
];

const STEPS = [
  {
    num: '01',
    title: 'Sign in',
    desc: 'Secure email login — your workspace is private and per-account.',
    icon: 'lock_open',
  },
  {
    num: '02',
    title: 'Tell us your path',
    desc: 'New business or existing business — we tailor the OS to you.',
    icon: 'alt_route',
  },
  {
    num: '03',
    title: 'Pick your industry',
    desc: 'Hotel, SaaS, restaurant, agency, coaching — 70 playbooks ready.',
    icon: 'category',
  },
  {
    num: '04',
    title: 'CEO discovery',
    desc: 'A conversation-first setup. CEO drafts blueprint before the dashboard starts.',
    icon: 'psychology',
  },
  {
    num: '05',
    title: 'Run operations',
    desc: 'Approvals, deliverables, research, and live execution.',
    icon: 'rocket_launch',
  },
];

const PREVIEW_AGENTS = [
  { agent: 'CEO Agent', task: 'Setting company objective', pct: 100, tone: 'primary' },
  { agent: 'Market Research', task: 'Competitor landscape scan', pct: 78, tone: 'indigo' },
  { agent: 'Operations Agent', task: 'Building execution graph', pct: 92, tone: 'emerald' },
  { agent: 'Brand Agent', task: 'Drafting positioning brief', pct: 45, tone: 'violet' },
];

const INDUSTRY_HIGHLIGHTS = [
  { icon: '🏨', name: 'Hotel' },
  { icon: '🍽️', name: 'Restaurant' },
  { icon: '💻', name: 'SaaS' },
  { icon: '🛒', name: 'E-commerce' },
  { icon: '🏋️', name: 'Fitness' },
  { icon: '🏥', name: 'Clinic' },
  { icon: '🎓', name: 'Coaching' },
  { icon: '🏠', name: 'Real Estate' },
];

function toneBg(tone: string) {
  return {
    primary: 'bg-primary-container text-on-primary-container',
    emerald: 'bg-emerald-50 text-emerald-700',
    indigo: 'bg-indigo-50 text-indigo-700',
    violet: 'bg-violet-50 text-violet-700',
    teal: 'bg-teal-50 text-teal-700',
    rose: 'bg-rose-50 text-rose-700',
    amber: 'bg-amber-50 text-amber-700',
    slate: 'bg-slate-100 text-slate-700',
  }[tone] ?? 'bg-primary-container text-on-primary-container';
}

function toneBar(tone: string) {
  return {
    primary: 'bg-primary',
    emerald: 'bg-emerald-600',
    indigo: 'bg-indigo-600',
    violet: 'bg-violet-600',
    teal: 'bg-teal-600',
    rose: 'bg-rose-600',
  }[tone] ?? 'bg-secondary';
}

export default function LandingPage({ onLogin, onGetStarted, signedInAs }: LandingPageProps) {
  const start = onGetStarted ?? onLogin;
  const continueLabel = signedInAs ? `Continue as ${signedInAs.split(' ')[0]}` : 'Get started';
  const [showAllIndustries, setShowAllIndustries] = useState(false);
  return (
    <div className="min-h-screen bg-surface text-on-surface">
      <div className="pointer-events-none fixed inset-0 overflow-hidden opacity-50">
        <div className="absolute -left-[10%] top-0 h-[50%] w-[50%] rounded-full bg-secondary/10 blur-[140px]" />
        <div className="absolute -right-[5%] top-[20%] h-[35%] w-[40%] rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute bottom-0 right-0 h-[40%] w-[35%] rounded-full bg-primary-container/20 blur-[120px]" />
      </div>

      <header className="relative z-10 border-b border-outline-variant/60 bg-surface/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary font-bold text-on-primary shadow-md">
              N
            </div>
            <div>
              <p className="text-sm font-bold text-primary">Nexus AI</p>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-outline">
                Enterprise OS
              </p>
            </div>
          </div>
          <nav className="hidden items-center gap-8 text-sm font-medium text-on-surface-variant md:flex">
            <a href="#features" className="transition-colors hover:text-primary">Features</a>
            <a href="#industries" className="transition-colors hover:text-primary">Industries</a>
            <a href="#how-it-works" className="transition-colors hover:text-primary">How it works</a>
            <a href="#security" className="transition-colors hover:text-primary">Security</a>
          </nav>
          <div className="flex items-center gap-3">
            {signedInAs && (
              <span className="hidden items-center gap-2 rounded-full border border-secondary/30 bg-secondary/5 px-3 py-1 text-xs font-semibold text-secondary md:inline-flex">
                <span className="h-1.5 w-1.5 rounded-full bg-secondary" />
                Signed in · {signedInAs.split(' ')[0]}
              </span>
            )}
            <button
              type="button"
              onClick={onLogin}
              className="rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-on-primary transition-transform active:scale-[0.98]"
            >
              {signedInAs ? 'Continue' : 'Log in'}
            </button>
          </div>
        </div>
      </header>

      <main className="relative z-10">
        <section className="mx-auto max-w-[1200px] px-6 pb-20 pt-16 md:pt-24">
          <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_1fr]">
            <div>
              <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-secondary/30 bg-secondary/5 px-3 py-1 text-xs font-bold uppercase tracking-wider text-secondary">
                <MaterialIcon name="bolt" className="text-[14px]" />
                Autonomous Operating System · 70 industry playbooks
              </p>
              <h1 className="text-4xl font-bold leading-tight tracking-tight text-primary md:text-5xl lg:text-[56px]">
                Run your company with an AI executive team
              </h1>
              <p className="mt-6 max-w-lg text-lg text-on-surface-variant">
                Nexus AI Enterprise OS orchestrates research, brand, web, marketing, and operations
                through autonomous agents — with your approval at every strategic gate.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <button
                  type="button"
                  onClick={start}
                  className="flex items-center gap-2 rounded-xl bg-primary px-8 py-4 text-base font-bold text-on-primary shadow-lg transition-transform active:scale-[0.98]"
                >
                  {continueLabel}
                  <MaterialIcon name="arrow_forward" className="text-[20px]" />
                </button>
                <a
                  href="#features"
                  className="flex items-center gap-2 rounded-xl border border-outline-variant bg-surface-container-lowest px-8 py-4 text-base font-semibold transition-colors hover:bg-surface-container-low"
                >
                  Explore features
                </a>
              </div>
              <div className="mt-10 flex flex-wrap gap-x-6 gap-y-2 text-sm text-on-surface-variant">
                <span className="flex items-center gap-2">
                  <MaterialIcon name="verified_user" className="text-secondary" />
                  Encrypted sessions
                </span>
                <span className="flex items-center gap-2">
                  <MaterialIcon name="groups" className="text-secondary" />
                  100+ agent roles
                </span>
                <span className="flex items-center gap-2">
                  <MaterialIcon name="speed" className="text-secondary" />
                  Live execution engine
                </span>
                <span className="flex items-center gap-2">
                  <MaterialIcon name="category" className="text-secondary" />
                  70 industry playbooks
                </span>
              </div>
            </div>

            <div className="relative">
              <div className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-6 shadow-[0px_20px_60px_rgba(0,0,0,0.08)]">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-primary">Execution Center</p>
                    <p className="text-[11px] text-on-surface-variant">Live · 4 departments active</p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-600" />
                    Live
                  </span>
                </div>
                <div className="space-y-3">
                  {PREVIEW_AGENTS.map((row) => (
                    <div key={row.agent} className="rounded-xl border border-outline-variant/60 bg-surface-container-lowest p-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-semibold text-on-surface">{row.agent}</span>
                        <span className="text-xs font-bold text-secondary">{row.pct}%</span>
                      </div>
                      <p className="mt-1 text-xs text-on-surface-variant">{row.task}</p>
                      <div className="mt-2 h-1.5 rounded-full bg-surface-container">
                        <div
                          className={`h-1.5 rounded-full ${toneBar(row.tone)}`}
                          style={{ width: `${row.pct}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex items-center justify-between rounded-xl border border-secondary/30 bg-secondary/5 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <MaterialIcon name="notifications_active" className="text-secondary" />
                    <p className="text-xs text-on-surface">2 approvals waiting on you</p>
                  </div>
                  <MaterialIcon name="chevron_right" className="text-on-surface-variant" />
                </div>
              </div>
              <div className="absolute -right-4 -top-4 hidden h-20 w-20 rotate-12 items-center justify-center rounded-2xl border border-outline-variant bg-primary-container text-3xl shadow-lg md:flex">
                🤖
              </div>
            </div>
          </div>
        </section>

        <section id="industries" className="border-y border-outline-variant/50 bg-surface-container-low/40 py-12">
          <div className="mx-auto max-w-[1200px] px-6">
            <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-secondary">Industry playbooks</p>
                <h2 className="text-2xl font-bold text-primary">Built for 70 industries, tailored for yours</h2>
              </div>
              <button
                type="button"
                onClick={() => setShowAllIndustries(true)}
                className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/5 px-4 py-1.5 text-sm font-semibold text-primary transition-colors hover:bg-primary/10"
              >
                See all 70 industries
                <MaterialIcon name="arrow_forward" className="text-[16px]" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
              {INDUSTRY_HIGHLIGHTS.map((i) => (
                <div
                  key={i.name}
                  className="flex flex-col items-center gap-2 rounded-xl border border-outline-variant bg-surface-container-lowest p-3 transition-shadow hover:shadow-md"
                >
                  <span className="text-3xl">{i.icon}</span>
                  <p className="text-xs font-semibold text-on-surface">{i.name}</p>
                </div>
              ))}
            </div>
            <p className="mt-4 text-center text-xs text-on-surface-variant">
              +62 more · from healthcare to hospitality, from coaching to crypto
              <button
                type="button"
                onClick={() => setShowAllIndustries(true)}
                className="ml-2 font-semibold text-primary hover:underline"
              >
                Browse all
              </button>
            </p>
          </div>
        </section>

        <section id="features" className="py-20">
          <div className="mx-auto max-w-[1200px] px-6">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-xs font-bold uppercase tracking-widest text-secondary">Features</p>
              <h2 className="mt-2 text-3xl font-bold text-primary">Everything your startup needs</h2>
              <p className="mt-3 text-on-surface-variant">
                One operating system for strategy, research, workforce, memory, and execution.
              </p>
            </div>
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((f) => (
                <div
                  key={f.title}
                  className="group rounded-2xl border border-outline-variant bg-surface-container-lowest p-6 transition-shadow hover:shadow-md"
                >
                  <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl ${toneBg(f.tone)}`}>
                    <MaterialIcon name={f.icon} className="text-[22px]" />
                  </div>
                  <h3 className="font-bold text-primary">{f.title}</h3>
                  <p className="mt-2 text-sm text-on-surface-variant">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="how-it-works" className="border-t border-outline-variant/50 bg-surface-container-low/40 py-20">
          <div className="mx-auto max-w-[1200px] px-6">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-xs font-bold uppercase tracking-widest text-secondary">How you get started</p>
              <h2 className="mt-2 text-3xl font-bold text-primary">Five steps to autonomous operations</h2>
            </div>
            <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-5">
              {STEPS.map((s) => (
                <div
                  key={s.num}
                  className="relative rounded-2xl border border-outline-variant bg-surface-container-lowest p-5"
                >
                  <div className="flex items-center justify-between">
                    <p className="font-mono text-2xl font-bold text-secondary/50">{s.num}</p>
                    <MaterialIcon name={s.icon} className="text-on-surface-variant" />
                  </div>
                  <h3 className="mt-3 font-bold text-primary">{s.title}</h3>
                  <p className="mt-2 text-sm text-on-surface-variant">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="security" className="bg-primary-container py-16 text-on-primary-container">
          <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-8 px-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest opacity-80">Security</p>
              <h2 className="mt-2 text-2xl font-bold">Built for founders who move fast</h2>
              <p className="mt-2 max-w-md opacity-90">
                Per-account workspaces, server-side sessions, and email login — your company data
                stays tied to your account.
              </p>
              <div className="mt-4 flex flex-wrap gap-3 text-xs">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-on-primary-container/30 bg-on-primary-container/10 px-3 py-1 font-semibold">
                  <MaterialIcon name="verified_user" className="text-[14px]" /> Encrypted at rest
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-on-primary-container/30 bg-on-primary-container/10 px-3 py-1 font-semibold">
                  <MaterialIcon name="history" className="text-[14px]" /> 30-day sessions
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-on-primary-container/30 bg-on-primary-container/10 px-3 py-1 font-semibold">
                  <MaterialIcon name="cloud_done" className="text-[14px]" /> Server-side sync
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={onLogin}
              className="rounded-xl bg-on-primary px-8 py-4 font-bold text-primary shadow-lg transition-transform active:scale-[0.98]"
            >
              Log in to Nexus AI
            </button>
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-outline-variant py-8">
        <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-3 px-6 text-sm text-outline">
          <p>© {new Date().getFullYear()} Nexus AI Enterprise OS</p>
          <p>Autonomous Business Operating System</p>
        </div>
      </footer>

      <AllIndustriesDialog open={showAllIndustries} onClose={() => setShowAllIndustries(false)} />
    </div>
  );
}
