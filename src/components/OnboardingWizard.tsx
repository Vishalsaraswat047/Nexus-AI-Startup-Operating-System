import { useState } from 'react';
import { motion } from 'motion/react';
import { Sparkles, Building2, ArrowRight, ArrowLeft, Key } from 'lucide-react';
import { setStoredApiKey } from '../utils/apiKeys';
import { Button } from './ui/button';
import MaterialIcon from './ui/MaterialIcon';

interface OnboardingWizardProps {
  onComplete: (data: any) => void;
  isLoading: boolean;
}

export default function OnboardingWizard({ onComplete, isLoading }: OnboardingWizardProps) {
  const [option, setOption] = useState<'create' | 'import' | null>(null);
  const [step, setStep] = useState(1);
  
  // Form fields
  const [name, setName] = useState('');
  const [industry, setIndustry] = useState('');
  const [website, setWebsite] = useState('');
  const [stage, setStage] = useState('Idea');
  const [teamSize, setTeamSize] = useState('1');
  const [revenue, setRevenue] = useState('0');
  const [expenses, setExpenses] = useState('0');
  const [budget, setBudget] = useState('3000');
  const [customers, setCustomers] = useState('0');
  const [funding, setFunding] = useState('Bootstrap');
  const [goals, setGoals] = useState('');
  const [challenges, setChallenges] = useState('');
  const [tools, setTools] = useState('');
  const [userApiKey, setUserApiKey] = useState('');
  const [goalPreset, setGoalPreset] = useState<'automation' | 'analytics' | 'workforce'>('automation');
  const [industrySelect, setIndustrySelect] = useState('');

  const GOAL_PRESETS = {
    automation: 'Automate repetitive operational tasks across departments.',
    analytics: 'Deep-dive insights and predictive market forecasting.',
    workforce: 'Deploy autonomous agents to handle client support and operations.',
  } as const;

  const handleOptionSelect = (selectedOption: 'create' | 'import') => {
    setOption(selectedOption);
    setStage(selectedOption === 'create' ? 'Idea' : 'MVP');
    setTeamSize(selectedOption === 'create' ? '1' : '5');
    setRevenue('0');
    setExpenses('0');
    setBudget('');
    setCustomers('0');
    setFunding(selectedOption === 'create' ? 'Bootstrap' : 'Seed Capital');
    setName('');
    setIndustry('');
    setIndustrySelect('');
    setWebsite('');
    setGoals('');
    setChallenges('');
    setTools('');
    setStep(2);
  };

  const handleNext = () => setStep((prev) => prev + 1);
  const handleBack = () => {
    if (step === 2) {
      setOption(null);
      setStep(1);
    } else {
      setStep((prev) => prev - 1);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const resolvedIndustry = industry || industrySelect || 'Software as a Service';
    const resolvedGoals = goals.trim() || GOAL_PRESETS[goalPreset];
    if (!name || !resolvedIndustry) {
      alert('Please fill out Business Name and Industry.');
      return;
    }

    // Save custom API key if provided
    if (userApiKey.trim()) {
      setStoredApiKey(userApiKey.trim());
    }

    onComplete({
      type: option,
      name,
      industry: resolvedIndustry,
      website: website || 'https://sandbox.nexus.ai',
      stage,
      teamSize: Number(teamSize) || 1,
      revenue: Number(revenue) || 0,
      expenses: Number(expenses) || 0,
      budget: Number(budget) || 1000,
      customers: Number(customers) || 0,
      funding,
      goals: resolvedGoals,
      challenges,
      tools
    });
  };

  const totalSteps = option === 'create' ? 2 : 3;
  const progressPct = !option ? 0 : Math.round((step / totalSteps) * 100);
  const activeStepLabel = step === 1 ? 0 : step === 2 ? 1 : 2;
  const stepLabels = ['Identity', 'Framework', 'Deployment'];

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-surface p-gutter text-on-surface">
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -left-[5%] -top-[10%] h-[40%] w-[40%] rounded-full bg-secondary/5 blur-[120px]" />
        <div className="absolute -bottom-[10%] -right-[5%] h-[30%] w-[30%] rounded-full bg-primary-fixed-dim/10 blur-[100px]" />
      </div>

      <main className="relative z-10 flex w-full max-w-[640px] flex-col gap-stack-lg">
        <header className="flex flex-col gap-stack-md text-center">
          <div className="mb-4 flex flex-col items-center gap-stack-sm">
            <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
              <MaterialIcon name="auto_awesome" className="text-[28px] text-on-primary" />
            </div>
            <h1 className="text-headline-md font-headline-md tracking-tight text-primary">Nexus AI</h1>
            <p className="mx-auto max-w-sm text-body-sm text-on-surface-variant">
              Configure your autonomous operating system environment to begin.
            </p>
          </div>
          {option && (
            <>
              <div className="h-1 w-full overflow-hidden rounded-full bg-surface-container">
                <div
                  className="h-full bg-primary transition-all duration-700 ease-out"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <div className="flex justify-between px-1">
                {stepLabels.map((label, i) => (
                  <span
                    key={label}
                    className={`text-label-md font-label-md ${
                      i <= activeStepLabel ? 'text-primary' : 'text-on-surface-variant opacity-40'
                    }`}
                  >
                    {label}
                  </span>
                ))}
              </div>
            </>
          )}
        </header>

      <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-stack-lg shadow-[0px_4px_20px_rgba(0,0,0,0.03)]">

        <div>
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 text-center space-y-6">
              <div className="relative w-16 h-16">
                <div className="absolute inset-0 rounded-full border-4 border-slate-900 animate-pulse" />
                <div className="absolute inset-x-0 top-0 h-16 w-16 rounded-full border-4 border-t-[#4F46E5] animate-spin" />
              </div>
              <div>
                <p className="font-display font-medium text-lg text-on-surface mb-2">Instantiating Business Digital Twin...</p>
                <p className="text-sm text-on-surface-variant max-w-sm mx-auto leading-relaxed">
                  Connecting autonomous boards (CEO, CFO, COO) to analyze your metrics, structure project milestones, and load the workspace directory.
                </p>
              </div>
            </div>
          ) : step === 1 ? (
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-12 text-center py-6"
            >
              <div className="space-y-6">
                <div className="flex justify-center">
                  <div className="w-16 h-16 rounded-2xl bg-secondary/10 flex items-center justify-center">
                    <Sparkles className="w-8 h-8 text-secondary" />
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h1 className="text-4xl font-semibold tracking-tight text-on-surface md:text-5xl">
                    Welcome to Nexus AI
                  </h1>
                  <p className="text-lg text-muted-foreground max-w-md mx-auto leading-relaxed">
                    The Autonomous Business Operating System
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
                <Button
                  id="btn-onboarding-new"
                  onClick={() => handleOptionSelect('create')}
                  size="lg"
                  className="h-14 px-8 text-base bg-primary hover:bg-primary/90 flex items-center justify-center text-on-surface font-semibold rounded-xl"
                >
                  <Sparkles className="w-5 h-5 mr-2" />
                  Create New Startup
                </Button>
                
                <Button
                  id="btn-onboarding-import"
                  onClick={() => handleOptionSelect('import')}
                  size="lg"
                  variant="outline"
                  className="h-14 px-8 text-base border-border hover:bg-card flex items-center justify-center text-on-surface"
                >
                  <Building2 className="w-5 h-5 mr-2" />
                  Import Existing Business
                </Button>
              </div>
            </motion.div>
          ) : step === 2 && option === 'create' ? (
            <form onSubmit={handleSubmit} className="flex flex-col gap-stack-lg">
              <div>
                <label htmlFor="input-name" className="font-label-md text-label-md text-on-surface-variant">
                  Business Name
                </label>
                <input
                  id="input-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Acme Corp AI"
                  className="mt-2 h-[48px] w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-4 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                />
              </div>

              <div>
                <label htmlFor="industry-select" className="font-label-md text-label-md text-on-surface-variant">
                  Industry
                </label>
                <select
                  id="industry-select"
                  required
                  value={industrySelect || industry}
                  onChange={(e) => {
                    setIndustrySelect(e.target.value);
                    setIndustry(e.target.options[e.target.selectedIndex].text);
                  }}
                  className="mt-2 h-[48px] w-full cursor-pointer appearance-none rounded-lg border border-outline-variant bg-surface-container-lowest px-4 outline-none focus:border-primary"
                >
                  <option value="">Select industry vertical</option>
                  <option value="fintech">FinTech & Asset Management</option>
                  <option value="saas">Software as a Service</option>
                  <option value="logistics">Logistics & Supply Chain</option>
                  <option value="healthcare">Healthcare Intelligence</option>
                  <option value="other">Other / Multi-Sector</option>
                </select>
              </div>

              <div>
                <span className="font-label-md text-label-md text-on-surface-variant">Primary Goal</span>
                <div className="mt-2 grid grid-cols-1 gap-3">
                  {(Object.keys(GOAL_PRESETS) as Array<keyof typeof GOAL_PRESETS>).map((key) => (
                    <label
                      key={key}
                      className="flex cursor-pointer items-center gap-4 rounded-lg border border-outline-variant p-4 transition-colors hover:bg-surface-container-low"
                    >
                      <input
                        type="radio"
                        name="goal"
                        checked={goalPreset === key}
                        onChange={() => {
                          setGoalPreset(key);
                          setGoals(GOAL_PRESETS[key]);
                        }}
                        className="h-4 w-4 border-outline-variant text-primary focus:ring-primary"
                      />
                      <div className="flex flex-col">
                        <span className="font-body-md font-semibold text-primary capitalize">
                          {key === 'automation' ? 'Workflow Automation' : key === 'analytics' ? 'Strategic Analytics' : 'AI Workforce'}
                        </span>
                        <span className="font-body-sm text-on-surface-variant">{GOAL_PRESETS[key]}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-4 text-left border-t border-outline-variant pt-4">
                <p className="text-xs font-semibold uppercase text-outline">Deployment details</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="input-budget" className="block text-[10px] font-mono text-on-surface-variant uppercase tracking-wider mb-2 font-semibold">Operating Budget ($/mo)</label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-3 text-slate-500 text-xs">$</span>
                      <input
                        id="input-budget"
                        type="number"
                        min="0"
                        value={budget}
                        onChange={(e) => setBudget(e.target.value)}
                        className="w-full text-xs border border-outline-variant rounded-lg pl-8 pr-3.5 py-2.5 bg-surface-container-low text-on-surface focus:outline-none focus:border-secondary"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="input-tools" className="block text-[10px] font-mono text-on-surface-variant uppercase tracking-wider mb-2 font-semibold">Tech Stack Tools (Comma separated)</label>
                    <input
                      id="input-tools"
                      type="text"
                      value={tools}
                      onChange={(e) => setTools(e.target.value)}
                      placeholder="React, Netlify, Tailwind"
                      className="w-full text-xs border border-outline-variant rounded-lg px-3.5 py-2.5 bg-surface-container-low text-on-surface focus:outline-none focus:border-secondary"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="input-goals" className="block text-[10px] font-mono text-on-surface-variant uppercase tracking-wider mb-2 font-semibold">Primary Goal Statement *</label>
                  <textarea
                    id="input-goals"
                    required
                    rows={2}
                    value={goals}
                    onChange={(e) => setGoals(e.target.value)}
                    placeholder="e.g. Launch a public validation MVP and gather initial 50 testers"
                    className="w-full text-xs border border-outline-variant rounded-lg px-3.5 py-2.5 bg-surface-container-low text-on-surface focus:outline-none focus:border-secondary resize-none"
                  />
                </div>

                <div className="bg-indigo-950/20 border border-indigo-900/30 rounded-xl p-4 space-y-2">
                  <div className="flex items-center gap-2 text-indigo-200 font-semibold text-xs">
                    <Key className="w-4 h-4 text-secondary" />
                    <span>Gemini API Key Setup (Optional but recommended)</span>
                  </div>
                  <p className="text-[10px] text-on-surface-variant leading-relaxed">
                    Enter your Google Gemini API Key here. Keys are strictly kept server-side to proxy requests. If left blank, Nexus runs in an interactive offline sandbox code simulation.
                  </p>
                  <input
                    type="password"
                    placeholder="AI_STUDIO_GEMINI_KEY_XXXX..."
                    value={userApiKey}
                    onChange={(e) => setUserApiKey(e.target.value)}
                    className="w-full text-xs border border-outline-variant rounded-lg px-3.5 py-2.5 bg-surface text-on-surface focus:outline-none focus:border-secondary"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-outline-variant">
                <button
                  type="button"
                  onClick={handleBack}
                  className="flex items-center gap-1 text-[11px] font-mono text-on-surface-variant hover:text-on-surface cursor-pointer font-semibold transition"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> BACK
                </button>
                <button
                  type="submit"
                  className="mt-4 flex h-[56px] w-full items-center justify-center gap-2 rounded-lg bg-primary font-label-md text-label-md text-on-primary transition-all hover:opacity-90 active:scale-[0.98]"
                >
                  Initialize Configuration
                  <MaterialIcon name="arrow_forward" className="text-[20px]" />
                </button>
              </div>
            </form>
          ) : step === 2 && option === 'import' ? (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div className="border-b border-outline-variant pb-3 text-left">
                <h2 className="font-display font-medium text-base text-on-surface">Existing Business: Corporate Identity</h2>
                <p className="text-xs text-on-surface-variant">Specify core identity coordinates.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                <div>
                  <label htmlFor="input-name-ext" className="block text-[10px] font-mono text-on-surface-variant uppercase tracking-wider mb-2 font-semibold">Business Name *</label>
                  <input
                    id="input-name-ext"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Starlight Agency"
                    className="w-full text-xs border border-outline-variant rounded-lg px-3.5 py-2.5 bg-surface-container-low text-on-surface focus:outline-none focus:border-secondary"
                  />
                </div>

                <div>
                  <label htmlFor="input-industry-ext" className="block text-[10px] font-mono text-on-surface-variant uppercase tracking-wider mb-2 font-semibold">Industry / Sector *</label>
                  <input
                    id="input-industry-ext"
                    type="text"
                    required
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    placeholder="e.g. Marketing Agency"
                    className="w-full text-xs border border-outline-variant rounded-lg px-3.5 py-2.5 bg-surface-container-low text-on-surface focus:outline-none focus:border-secondary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
                <div>
                  <label htmlFor="input-website" className="block text-[10px] font-mono text-on-surface-variant uppercase tracking-wider mb-2 font-semibold">Domain Website</label>
                  <input
                    id="input-website"
                    type="text"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="https://mysite.com"
                    className="w-full text-xs border border-outline-variant rounded-lg px-3.5 py-2.5 bg-surface-container-low text-on-surface focus:outline-none focus:border-secondary"
                  />
                </div>

                <div>
                  <label htmlFor="select-stage" className="block text-[10px] font-mono text-on-surface-variant uppercase tracking-wider mb-2 font-semibold">Business Stage</label>
                  <select
                    id="select-stage"
                    value={stage}
                    onChange={(e) => setStage(e.target.value)}
                    className="w-full text-xs border border-outline-variant rounded-lg px-2.5 py-2.5 bg-surface-container-low text-on-surface focus:outline-none focus:border-secondary"
                  >
                    <option>Validation</option>
                    <option>MVP</option>
                    <option>Launch</option>
                    <option>Growth</option>
                    <option>Scale</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="input-team" className="block text-[10px] font-mono text-on-surface-variant uppercase tracking-wider mb-2 font-semibold">Staff Members</label>
                  <input
                    id="input-team"
                    type="number"
                    min="1"
                    value={teamSize}
                    onChange={(e) => setTeamSize(e.target.value)}
                    className="w-full text-xs border border-outline-variant rounded-lg px-3.5 py-2.5 bg-surface-container-low text-on-surface focus:outline-none focus:border-secondary"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-outline-variant">
                <button
                  type="button"
                  onClick={handleBack}
                  className="flex items-center gap-1 text-[11px] font-mono text-on-surface-variant hover:text-on-surface cursor-pointer font-semibold transition"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> BACK
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="flex items-center gap-1 text-xs font-semibold bg-secondary hover:opacity-90 text-on-secondary rounded-lg px-5 py-3 shadow transition cursor-pointer"
                >
                  NEXT METRICS <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="border-b border-outline-variant pb-3 text-left">
                <h2 className="font-display font-medium text-base text-on-surface">Existing Business: Financial Metrics</h2>
                <p className="text-xs text-on-surface-variant">Specify active operating financials.</p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-left">
                <div>
                  <label htmlFor="input-rev" className="block text-[10px] font-mono text-on-surface-variant uppercase tracking-wider mb-2 font-semibold">Monthly MRR Revenue ($)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-slate-500 text-xs">$</span>
                    <input
                      id="input-rev"
                      type="number"
                      min="0"
                      value={revenue}
                      onChange={(e) => setRevenue(e.target.value)}
                      className="w-full text-xs border border-outline-variant rounded-lg pl-7 pr-3.5 py-2.5 bg-surface-container-low text-on-surface focus:outline-none focus:border-secondary"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="input-expense" className="block text-[10px] font-mono text-on-surface-variant uppercase tracking-wider mb-2 font-semibold">Operating Expenses ($/mo)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-slate-500 text-xs">$</span>
                    <input
                      id="input-expense"
                      type="number"
                      min="0"
                      value={expenses}
                      onChange={(e) => setExpenses(e.target.value)}
                      className="w-full text-xs border border-outline-variant rounded-lg pl-7 pr-3.5 py-2.5 bg-surface-container-low text-on-surface focus:outline-none focus:border-secondary"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-left">
                <div>
                  <label htmlFor="input-runway" className="block text-[10px] font-mono text-on-surface-variant uppercase tracking-wider mb-2 font-semibold">Active Cash Reserve ($)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-slate-500 text-xs">$</span>
                    <input
                      id="input-runway"
                      type="number"
                      min="0"
                      value={budget}
                      onChange={(e) => setBudget(e.target.value)}
                      className="w-full text-xs border border-outline-variant rounded-lg pl-7 pr-3.5 py-2.5 bg-surface-container-low text-on-surface focus:outline-none focus:border-secondary"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="input-customer-cohort" className="block text-[10px] font-mono text-on-surface-variant uppercase tracking-wider mb-2 font-semibold">Active Customers</label>
                  <input
                    id="input-customer-cohort"
                    type="number"
                    min="0"
                    value={customers}
                    onChange={(e) => setCustomers(e.target.value)}
                    className="w-full text-xs border border-outline-variant rounded-lg px-3.5 py-2.5 bg-surface-container-low text-on-surface focus:outline-none focus:border-secondary"
                  />
                </div>
              </div>

              <div className="text-left">
                <label htmlFor="input-goals-ext" className="block text-[10px] font-mono text-on-surface-variant uppercase tracking-wider mb-2 font-semibold">Primary Goal Statement *</label>
                <textarea
                  id="input-goals-ext"
                  required
                  rows={2}
                  value={goals}
                  onChange={(e) => setGoals(e.target.value)}
                  placeholder="e.g. Automation scaling of marketing routes to multiply customer volume"
                  className="w-full text-xs border border-outline-variant rounded-lg px-3.5 py-2.5 bg-surface-container-low text-on-surface focus:outline-none focus:border-secondary resize-none"
                />
              </div>

              <div className="bg-indigo-950/20 border border-indigo-900/30 rounded-xl p-4 space-y-2 text-left">
                <div className="flex items-center gap-2 text-indigo-200 font-semibold text-xs">
                  <Key className="w-4 h-4 text-secondary" />
                  <span>Gemini API Key Configuration (Optional)</span>
                </div>
                <input
                  type="password"
                  placeholder="AI_STUDIO_GEMINI_KEY_XXXX..."
                  value={userApiKey}
                  onChange={(e) => setUserApiKey(e.target.value)}
                  className="w-full text-xs border border-outline-variant rounded-lg px-3.5 py-2.5 bg-surface text-on-surface focus:outline-none focus:border-secondary"
                />
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-outline-variant">
                <button
                  type="button"
                  onClick={handleBack}
                  className="flex items-center gap-1 text-[11px] font-mono text-on-surface-variant hover:text-on-surface cursor-pointer font-semibold transition"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> BACK
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 text-xs font-semibold bg-secondary hover:opacity-90 text-on-secondary rounded-lg px-5 py-3 shadow transition cursor-pointer"
                >
                  Launch Operations OS <Sparkles className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
        <footer className="flex items-center justify-between px-2 text-on-surface-variant">
          <p className="font-body-sm text-body-sm">Growth Stage: Alpha</p>
          <p className="font-body-sm text-body-sm">Nexus AI Enterprise OS</p>
        </footer>
      </main>
    </div>
  );
}
