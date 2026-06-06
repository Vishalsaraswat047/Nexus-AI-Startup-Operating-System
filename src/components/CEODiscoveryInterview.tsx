import { useMemo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import MaterialIcon from './ui/MaterialIcon';
import type { BusinessType } from '../lib/authApi';
import { StitchInput, StitchSelect, ProgressLine } from './stitch/StitchPrimitives';
import IndustryPicker from './onboarding/IndustryPicker';
import {
  buildDiscoveryQuestions,
  answersToBusinessProfile,
  type DiscoveryQuestion,
} from '../lib/discoveryQuestions';
import type { BusinessCategory, BusinessStage, NexusBusinessProfile } from '../types/businessProfile';

export type CeoDiscoveryCategory = BusinessCategory;

export interface CeoDiscoveryAnswers {
  startupName: string;
  whatAreYouBuilding: string;
  category: BusinessCategory;
  industry: string;
  targetCustomer: string;
  country: string;
  initialBudget: number;
  timelineDays: number;
  teamType: 'Solo' | 'Team';
  manufacturingRequired: 'Yes' | 'No';
  existingCompetitors: string;
  businessType: BusinessType;
  problem: string;
  solution: string;
  uniqueAdvantage: string;
  vision: string;
  stage: BusinessStage;
  website: string;
  revenueRange: string;
  mainProducts: string;
  mainServices: string;
  currentGoals: string;
  currentProblems: string;
  stageAnswers: Record<string, string>;
  businessProfile: NexusBusinessProfile;
}

interface CEODiscoveryInterviewProps {
  onComplete: (answers: CeoDiscoveryAnswers) => void;
  isLoading: boolean;
  businessType: BusinessType;
  founderName: string;
}

function clampPositiveInt(n: number, fallback: number) {
  if (!Number.isFinite(n)) return fallback;
  const x = Math.floor(n);
  return x > 0 ? x : fallback;
}

export default function CEODiscoveryInterview({
  onComplete,
  isLoading,
  businessType,
  founderName,
}: CEODiscoveryInterviewProps) {
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | number>>({});
  const [askedQuestions, setAskedQuestions] = useState<Set<string>>(new Set());

  const category = answers.category as BusinessCategory | undefined;
  const stage = answers.stage as BusinessStage | undefined;

  const questions = useMemo(() => {
    const allQuestions = buildDiscoveryQuestions(businessType, category, stage);
    return allQuestions.filter((q) => !askedQuestions.has(q.key));
  }, [businessType, category, stage, askedQuestions]);

  const currentQ = questions[idx] ?? questions[questions.length - 1];

  const pct = useMemo(() => {
    const total = Math.max(questions.length - 1, 1);
    return Math.round((idx / total) * 100);
  }, [idx, questions.length]);

  const setAnswer = useCallback((key: string, value: string | number) => {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  }, []);

  const getValue = (key: string): string => {
    const v = answers[key];
    return v !== undefined ? String(v) : '';
  };

  const canAdvance = useMemo(() => {
    if (!currentQ) return false;
    if (!currentQ.required) return true;
    const v = answers[currentQ.key];
    if (v === undefined || v === '') return false;
    if (currentQ.type === 'number' && Number(v) <= 0) return false;
    return true;
  }, [currentQ, answers]);

  const next = () => {
    if (!canAdvance || isLoading) return;
    if (currentQ) setAskedQuestions((prev) => new Set(prev).add(currentQ.key));
    setIdx((i) => Math.min(questions.length - 1, i + 1));
  };

  const back = () => setIdx((i) => Math.max(0, i - 1));

  const handleFinish = () => {
    if (!canAdvance || isLoading) return;
    const profile = answersToBusinessProfile(answers, businessType);
    onComplete({
      startupName: String(answers.startupName || '').trim(),
      whatAreYouBuilding: String(answers.whatAreYouBuilding || '').trim(),
      category: (answers.category as BusinessCategory) || 'Other',
      industry: String(answers.industry || '').trim(),
      targetCustomer: String(answers.targetCustomer || '').trim(),
      country: String(answers.country || '').trim(),
      initialBudget: clampPositiveInt(Number(answers.initialBudget), 3000),
      timelineDays: clampPositiveInt(Number(answers.timelineDays), 90),
      teamType: (answers.teamType as 'Solo' | 'Team') || 'Solo',
      manufacturingRequired: (answers.manufacturingRequired as 'Yes' | 'No') || 'No',
      existingCompetitors: String(answers.existingCompetitors || '').trim(),
      businessType,
      problem: String(answers.problem || '').trim(),
      solution: String(answers.solution || '').trim(),
      uniqueAdvantage: String(answers.uniqueAdvantage || '').trim(),
      vision: String(answers.vision || '').trim(),
      stage: (answers.stage as BusinessStage) || 'Idea',
      website: String(answers.website || '').trim(),
      revenueRange: String(answers.revenueRange || '').trim(),
      mainProducts: String(answers.mainProducts || '').trim(),
      mainServices: String(answers.mainServices || '').trim(),
      currentGoals: String(answers.currentGoals || '').trim(),
      currentProblems: String(answers.currentProblems || '').trim(),
      stageAnswers: profile.stageAnswers,
      businessProfile: profile,
    });
  };

  const firstName = founderName.split(' ')[0] || 'Founder';
  const flowLabel =
    businessType === 'new_brand' ? 'New Startup Discovery' : 'Existing Business Import';
  const flowIcon = businessType === 'new_brand' ? 'rocket_launch' : 'storefront';
  const flowTone = businessType === 'new_brand' ? 'emerald' : 'primary';

  const answeredCount = Object.keys(answers).length;
  const industriesAvailable = String(answers.industry || '').trim().length > 0;

  const answeredList = useMemo(
    () =>
      questions
        .slice(0, idx)
        .map((q) => ({
          key: q.key,
          label: q.label,
          section: q.section,
          value: String(answers[q.key] ?? '').trim(),
        }))
        .filter((row) => row.value.length > 0)
        .reverse(),
    [questions, idx, answers],
  );

  return (
    <div className="relative min-h-screen overflow-hidden bg-surface">
      <div className="pointer-events-none fixed inset-0 overflow-hidden opacity-40">
        <div className="absolute -left-[5%] -top-[10%] h-[40%] w-[40%] rounded-full bg-secondary/5 blur-[120px]" />
        <div className="absolute bottom-0 right-[5%] h-[50%] w-[30%] rounded-full bg-primary-fixed-dim/10 blur-[100px]" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen max-w-[1200px] flex-col gap-6 px-4 py-6 md:grid md:min-h-[calc(100vh-2rem)] md:grid-cols-[320px_1fr] md:px-6 md:py-6">
        <aside className="hidden flex-col gap-4 md:flex">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary shadow-md">
              <MaterialIcon name="smart_toy" className="text-[20px] text-on-primary" />
            </div>
            <div>
              <p className="text-sm font-bold text-primary">Nexus AI</p>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-outline">CEO Discovery</p>
            </div>
          </div>

          <div className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-5 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                  flowTone === 'emerald' ? 'bg-emerald-50 text-emerald-700' : 'bg-primary/10 text-primary'
                }`}
              >
                <MaterialIcon name={flowIcon} />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-outline">Step 2 of 2</p>
                <p className="text-sm font-bold text-primary">{flowLabel}</p>
              </div>
            </div>
            <p className="text-xs text-on-surface-variant">
              Hi {firstName} — the CEO Agent is reading your answers to draft a tailored blueprint.
            </p>
            <div className="mt-4">
              <ProgressLine pct={pct} />
              <div className="mt-2 flex items-center justify-between text-[11px] text-on-surface-variant">
                <span>
                  Step {idx + 1} / {questions.length}
                </span>
                <span className="font-bold text-primary">{pct}%</span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-4">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-secondary">Live signals</p>
            <ul className="space-y-2 text-xs">
              <li className="flex items-center gap-2">
                <MaterialIcon
                  name={category ? 'check_circle' : 'pending'}
                  filled
                  className={category ? 'text-emerald-600' : 'text-outline'}
                />
                <span className="text-on-surface">Category selected</span>
              </li>
              <li className="flex items-center gap-2">
                <MaterialIcon
                  name={industriesAvailable ? 'check_circle' : 'pending'}
                  filled
                  className={industriesAvailable ? 'text-emerald-600' : 'text-outline'}
                />
                <span className="text-on-surface">Industry playbook chosen</span>
              </li>
              <li className="flex items-center gap-2">
                <MaterialIcon
                  name={stage ? 'check_circle' : 'pending'}
                  filled
                  className={stage ? 'text-emerald-600' : 'text-outline'}
                />
                <span className="text-on-surface">Stage defined</span>
              </li>
              <li className="flex items-center gap-2">
                <MaterialIcon
                  name={answeredCount >= 5 ? 'check_circle' : 'pending'}
                  filled
                  className={answeredCount >= 5 ? 'text-emerald-600' : 'text-outline'}
                />
                <span className="text-on-surface">
                  {answeredCount} answer{answeredCount === 1 ? '' : 's'} captured
                </span>
              </li>
            </ul>
          </div>

          <div className="rounded-2xl border border-secondary/30 bg-secondary/5 p-4">
            <div className="mb-2 flex items-center gap-2">
              <MaterialIcon name="psychology" className="text-secondary" />
              <p className="text-xs font-bold text-secondary">Adaptive interview</p>
            </div>
            <p className="text-[11px] text-on-surface-variant">
              Questions adapt to your business type, stage, and category — not a generic registration form.
            </p>
          </div>
        </aside>

        <main className="flex flex-1 flex-col">
          <div className="mb-4 flex items-center justify-between md:hidden">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                <MaterialIcon name="smart_toy" className="text-[18px] text-on-primary" />
              </div>
              <div>
                <p className="text-xs font-bold text-primary">{flowLabel}</p>
                <p className="text-[10px] text-on-surface-variant">{firstName} · Step {idx + 1}/{questions.length}</p>
              </div>
            </div>
            <span className="text-xs font-bold text-primary">{pct}%</span>
          </div>
          <div className="mb-4 md:hidden">
            <ProgressLine pct={pct} />
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentQ?.key ?? 'end'}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
              className="flex flex-1 flex-col rounded-2xl border border-outline-variant bg-surface-container-lowest p-6 shadow-sm md:p-8"
            >
              {currentQ?.section && (
                <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-secondary">
                  {currentQ.section}
                </p>
              )}
              <h2 className="text-xl font-bold text-primary md:text-2xl">{currentQ?.label}</h2>

              <div className="mt-6">
                <QuestionField
                  question={currentQ}
                  value={getValue(currentQ.key)}
                  onChange={(v) => setAnswer(currentQ.key, v)}
                  category={category}
                />
              </div>

              <div className="mt-6 grid flex-1 grid-cols-1 gap-3 md:grid-cols-2">
                {idx === questions.length - 1 ? (
                  <div className="md:col-span-2 flex items-start gap-3 rounded-xl border border-secondary/30 bg-secondary/5 p-4">
                    <MaterialIcon name="auto_awesome" className="text-secondary" />
                    <div>
                      <p className="text-xs font-bold text-secondary">CEO Agent preview</p>
                      <p className="mt-1 text-sm text-on-surface-variant">
                        After discovery, Nexus will generate your business profile, department plan, and
                        highest-priority next action.
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    {questions[idx + 1] && (
                      <div className="flex items-start gap-3 rounded-xl border border-dashed border-outline-variant/70 bg-surface-container-low/40 p-4">
                        <MaterialIcon name="arrow_forward" className="text-on-surface-variant" />
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-outline">Coming up next</p>
                          <p className="mt-1 text-xs font-semibold text-on-surface">
                            {questions[idx + 1].section ? `${questions[idx + 1].section} · ` : ''}
                            {questions[idx + 1].label}
                          </p>
                        </div>
                      </div>
                    )}
                    {answeredList.length > 0 && (
                      <div className="flex items-start gap-3 rounded-xl border border-emerald-200/60 bg-emerald-50/40 p-4">
                        <MaterialIcon name="task_alt" className="text-emerald-700" />
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-700">
                            Captured so far
                          </p>
                          <ul className="mt-1 space-y-0.5">
                            {answeredList.slice(0, 3).map((row) => (
                              <li key={row.key} className="truncate text-xs text-on-surface-variant">
                                <span className="font-semibold text-on-surface">{row.label}:</span>{' '}
                                {row.value.length > 48 ? `${row.value.slice(0, 48)}…` : row.value}
                              </li>
                            ))}
                            {answeredList.length > 3 && (
                              <li className="text-[11px] font-semibold text-emerald-700">
                                +{answeredList.length - 3} more answered
                              </li>
                            )}
                          </ul>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={back}
              disabled={idx === 0 || isLoading}
              className="inline-flex items-center gap-1 rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-2 text-sm font-semibold text-on-surface-variant transition-colors hover:bg-surface-container-low disabled:opacity-50"
            >
              <MaterialIcon name="arrow_back" className="text-[16px]" />
              Back
            </button>

            {idx < questions.length - 1 ? (
              <button
                type="button"
                onClick={next}
                disabled={!canAdvance || isLoading}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-bold text-on-primary shadow-sm transition-transform active:scale-[0.98] disabled:opacity-50"
              >
                Next
                <MaterialIcon name="arrow_forward" className="text-[16px]" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinish}
                disabled={!canAdvance || isLoading}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-bold text-on-primary shadow-sm transition-transform active:scale-[0.98] disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <MaterialIcon name="progress_activity" className="animate-spin text-[16px]" />
                    Generating business context…
                  </>
                ) : (
                  <>
                    Complete discovery & begin planning
                    <MaterialIcon name="check_circle" className="text-[16px]" />
                  </>
                )}
              </button>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

function QuestionField({
  question,
  value,
  onChange,
  category,
}: {
  question: DiscoveryQuestion;
  value: string;
  onChange: (v: string | number) => void;
  category?: BusinessCategory;
}) {
  if (question.type === 'select' && question.options) {
    return (
      <StitchSelect
        id={question.key}
        label={question.label}
        value={value}
        onChange={onChange}
        options={question.options}
      />
    );
  }

  if (question.type === 'textarea') {
    return (
      <div>
        <label htmlFor={question.key} className="mb-1 block text-xs font-semibold text-on-surface-variant">
          {question.label}
        </label>
        <textarea
          id={question.key}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={question.placeholder}
          rows={4}
          className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm text-on-surface outline-none focus:border-primary"
        />
      </div>
    );
  }

  if (question.type === 'number') {
    return (
      <StitchInput
        id={question.key}
        label={question.label}
        value={value}
        onChange={(v) => onChange(Number(v))}
        type="number"
        required={question.required}
        placeholder={question.placeholder}
      />
    );
  }

  if (question.type === 'industry') {
    return (
      <div className="space-y-1">
        <p className="text-xs text-on-surface-variant">
          Your industry is the most important signal — it tells Nexus which agents, deliverables, and
          continuous-loop questions to use.
        </p>
        <IndustryPicker
          category={category}
          value={value}
          onChange={(slug) => onChange(slug)}
        />
      </div>
    );
  }

  return (
    <StitchInput
      id={question.key}
      label={question.label}
      value={value}
      onChange={onChange}
      required={question.required}
      placeholder={question.placeholder}
    />
  );
}
