import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import MaterialIcon from './ui/MaterialIcon';

interface BusinessContextLoaderProps {
  startupName?: string;
  industry?: string;
  category?: string;
}

interface Stage {
  id: string;
  icon: string;
  label: string;
  detail: string;
  weight: number;
}

const STAGES: Stage[] = [
  {
    id: 'analyze',
    icon: 'menu_book',
    label: 'Reading your answers',
    detail: 'Parsing founder profile, goals, and constraints',
    weight: 12,
  },
  {
    id: 'industry',
    icon: 'category',
    label: 'Mapping to your industry playbook',
    detail: 'Loading Mode 1 + Mode 2 stages, agents, deliverables',
    weight: 18,
  },
  {
    id: 'model',
    icon: 'schema',
    label: 'Drafting business model',
    detail: 'Pricing, customer segments, value proposition',
    weight: 16,
  },
  {
    id: 'departments',
    icon: 'account_tree',
    label: 'Building department plan',
    detail: 'Activating CEO, Research, Ops, Brand, Marketing',
    weight: 18,
  },
  {
    id: 'agents',
    icon: 'smart_toy',
    label: 'Spinning up AI agents',
    detail: 'Initialising 100+ specialist roles',
    weight: 14,
  },
  {
    id: 'brief',
    icon: 'auto_awesome',
    label: 'Compiling executive brief',
    detail: 'Highest-priority action + risk + runway',
    weight: 12,
  },
  {
    id: 'ready',
    icon: 'check_circle',
    label: 'Ready to launch',
    detail: 'Welcome to your autonomous workspace',
    weight: 10,
  },
];

const ACTIVITY_LINES = [
  'CEO Agent reading answers…',
  'Industry playbook matched',
  'Building pricing matrix…',
  'Mapping target personas…',
  'Activating Market Research Division…',
  'Spinning up COO execution graph…',
  'Drafting go-to-market sequence…',
  'Compiling health score…',
  'Setting first directive…',
  'Brief ready for review',
];

export default function BusinessContextLoader({
  startupName,
  industry,
  category,
}: BusinessContextLoaderProps) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const [activityIdx, setActivityIdx] = useState(0);
  const [dots, setDots] = useState(0);

  useEffect(() => {
    const total = STAGES.reduce((sum, s) => sum + s.weight, 0);
    const tickMs = 90;
    const interval = window.setInterval(() => {
      setProgress((prev) => {
        const currentStage = STAGES[activeIdx];
        const currentBase = STAGES.slice(0, activeIdx).reduce((sum, s) => sum + s.weight, 0);
        const stageStart = (currentBase / total) * 100;
        const stageEnd = ((currentBase + currentStage.weight) / total) * 100;
        const stageProgress = stageEnd - stageStart;
        const tickDelta = stageProgress / (currentStage.weight * 4);
        const next = prev + tickDelta;
        if (next >= stageEnd) {
          if (activeIdx < STAGES.length - 1) {
            setActiveIdx((i) => i + 1);
          }
          return Math.min(stageEnd, 100);
        }
        return next;
      });
    }, tickMs);
    return () => window.clearInterval(interval);
  }, [activeIdx]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setActivityIdx((i) => (i + 1) % ACTIVITY_LINES.length);
    }, 1600);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setDots((d) => (d + 1) % 4);
    }, 500);
    return () => window.clearInterval(interval);
  }, []);

  const roundedPct = useMemo(() => Math.min(100, Math.round(progress)), [progress]);
  const stageEnd = useMemo(() => {
    const total = STAGES.reduce((sum, s) => sum + s.weight, 0);
    const currentBase = STAGES.slice(0, activeIdx).reduce((sum, s) => sum + s.weight, 0);
    return ((currentBase + STAGES[activeIdx].weight) / total) * 100;
  }, [activeIdx]);

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-surface px-4 py-10">
      <div className="pointer-events-none fixed inset-0 overflow-hidden opacity-50">
        <div className="absolute -left-[10%] -top-[10%] h-[50%] w-[50%] rounded-full bg-secondary/10 blur-[140px]" />
        <div className="absolute -right-[10%] top-[20%] h-[40%] w-[40%] rounded-full bg-primary/15 blur-[120px]" />
        <div className="absolute bottom-0 right-[5%] h-[45%] w-[35%] rounded-full bg-primary-container/30 blur-[120px]" />
      </div>

      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {Array.from({ length: 20 }).map((_, i) => (
          <motion.span
            key={i}
            className="absolute h-1.5 w-1.5 rounded-full bg-secondary/30"
            initial={{
              x: `${Math.random() * 100}%`,
              y: '110%',
              opacity: 0,
            }}
            animate={{
              y: '-10%',
              opacity: [0, 0.8, 0],
            }}
            transition={{
              duration: 8 + Math.random() * 6,
              repeat: Infinity,
              delay: Math.random() * 8,
              ease: 'linear',
            }}
          />
        ))}
      </div>

      <main className="relative z-10 w-full max-w-[760px]">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="rounded-3xl border border-outline-variant bg-surface-container-lowest p-8 shadow-[0px_24px_80px_rgba(0,0,0,0.10)] md:p-10"
        >
          <header className="flex flex-col items-center text-center">
            <div className="relative mb-5">
              <motion.div
                className="absolute inset-0 rounded-2xl bg-primary/20 blur-xl"
                animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.8, 0.4] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
              />
              <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-on-primary shadow-lg">
                <MaterialIcon name="auto_awesome" className="text-[32px]" />
              </div>
            </div>

            <p className="text-[10px] font-bold uppercase tracking-widest text-secondary">
              CEO Discovery · Generating context
            </p>
            <h1 className="mt-2 text-2xl font-bold text-primary md:text-3xl">
              Building your operating system
            </h1>
            <p className="mt-2 max-w-md text-sm text-on-surface-variant">
              {startupName ? (
                <>
                  Drafting the blueprint for{' '}
                  <span className="font-bold text-primary">{startupName}</span>
                  {industry ? (
                    <>
                      {' '}
                      · <span className="text-secondary">{industry}</span>
                    </>
                  ) : category ? (
                    <>
                      {' '}
                      · <span className="text-secondary">{category}</span>
                    </>
                  ) : null}
                </>
              ) : (
                <>The CEO Agent is reading your answers and activating the right agents.</>
              )}
            </p>
          </header>

          <section className="mt-8">
            <div className="flex items-baseline justify-between">
              <p className="text-xs font-bold text-on-surface">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={STAGES[activeIdx].id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.2 }}
                  >
                    {STAGES[activeIdx].label}
                  </motion.span>
                </AnimatePresence>
                <span className="ml-1 text-on-surface-variant">{'.'.repeat(dots)}</span>
              </p>
              <motion.p
                key={roundedPct}
                initial={{ scale: 1.15 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.2 }}
                className="font-mono text-sm font-bold text-primary"
              >
                {roundedPct}%
              </motion.p>
            </div>

            <div className="relative mt-2 h-2.5 overflow-hidden rounded-full bg-surface-container">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-primary via-secondary to-primary"
                style={{ width: `${progress}%` }}
                transition={{ duration: 0.15, ease: 'linear' }}
              />
              <motion.div
                className="absolute top-0 h-full w-1/3 rounded-full bg-gradient-to-r from-transparent via-white/40 to-transparent"
                animate={{ x: ['-100%', '300%'] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
                style={{ left: 0 }}
              />
            </div>

            <p className="mt-2 text-[11px] text-on-surface-variant">
              {STAGES[activeIdx].detail}
            </p>
          </section>

          <section className="mt-7 grid grid-cols-1 gap-3 md:grid-cols-7">
            {STAGES.map((stage, i) => {
              const isActive = i === activeIdx;
              const isDone = i < activeIdx;
              return (
                <motion.div
                  key={stage.id}
                  initial={false}
                  animate={{
                    scale: isActive ? 1.05 : 1,
                  }}
                  transition={{ duration: 0.25 }}
                  className={`flex flex-col items-center gap-1 rounded-xl border p-3 text-center transition-colors ${
                    isActive
                      ? 'border-primary bg-primary/10'
                      : isDone
                        ? 'border-emerald-200 bg-emerald-50/50'
                        : 'border-outline-variant bg-surface-container-lowest'
                  }`}
                >
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${
                      isActive
                        ? 'bg-primary text-on-primary'
                        : isDone
                          ? 'bg-emerald-600 text-on-primary'
                          : 'bg-surface-container text-on-surface-variant'
                    }`}
                  >
                    {isDone ? (
                      <MaterialIcon name="check" className="text-[20px]" />
                    ) : (
                      <MaterialIcon
                        name={stage.icon}
                        className={`text-[18px] ${isActive ? 'animate-pulse' : ''}`}
                      />
                    )}
                  </div>
                  <p
                    className={`text-[10px] font-semibold leading-tight ${
                      isActive ? 'text-primary' : isDone ? 'text-emerald-700' : 'text-on-surface-variant'
                    }`}
                  >
                    {stage.label}
                  </p>
                </motion.div>
              );
            })}
          </section>

          <section className="mt-7 rounded-2xl border border-outline-variant bg-surface-container-low p-4">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-60" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-600" />
              </span>
              <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                Live activity
              </p>
            </div>
            <div className="mt-2 h-5 overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.p
                  key={activityIdx}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25 }}
                  className="text-sm text-on-surface"
                >
                  {ACTIVITY_LINES[activityIdx]}
                </motion.p>
              </AnimatePresence>
            </div>
          </section>

          <footer className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-outline-variant/50 pt-5 text-[11px] text-on-surface-variant">
            <p className="inline-flex items-center gap-1.5">
              <MaterialIcon name="cloud_sync" className="text-[14px] text-secondary" />
              Syncing to your secure workspace…
            </p>
            <p className="font-mono text-[10px] text-outline">stage_end: {Math.round(stageEnd)}%</p>
          </footer>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-6 text-center text-[11px] text-on-surface-variant"
        >
          Hang tight — your dashboard, departments, and continuous CEO loop are coming online.
        </motion.p>
      </main>
    </div>
  );
}
