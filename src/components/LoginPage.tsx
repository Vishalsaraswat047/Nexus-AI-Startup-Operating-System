import { useState, FormEvent, useCallback, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import MaterialIcon from './ui/MaterialIcon';
import { loginApi, signupApi, googleLoginApi, type AuthResponse } from '../lib/authApi';
import type { BusinessType } from '../lib/authApi';

export interface NexusSession {
  id: string;
  email: string;
  founderName: string;
  token: string;
  authProvider: 'email' | 'google' | 'microsoft';
  businessType: BusinessType | null;
  needsEntrance: boolean;
  onboardingCompleted?: boolean;
  businessProfile?: Record<string, unknown> | null;
  businessProfileCompanyId?: string | null;
  isNewUser?: boolean;
}

interface LoginPageProps {
  onLogin: (session: NexusSession) => void;
  onBack?: () => void;
  initialMode?: 'login' | 'signup';
}

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim() || '';
const GOOGLE_LOGIN_ENABLED = false;

function toSession(res: AuthResponse): NexusSession {
  return {
    id: res.user.id,
    email: res.user.email,
    founderName: res.user.founderName,
    token: res.token,
    authProvider: res.user.authProvider,
    businessType: res.user.businessType,
    needsEntrance: res.user.needsEntrance,
    isNewUser: res.isNewUser,
  };
}

const BRAND_FEATURES = [
  { icon: 'psychology', label: 'CEO discovery interview' },
  { icon: 'category', label: '70 industry playbooks' },
  { icon: 'groups', label: '100+ AI agent roles' },
  { icon: 'shield_lock', label: 'Per-account encrypted workspace' },
];

const BRAND_AGENTS = [
  { name: 'CEO Agent', tone: 'primary', pct: 100 },
  { name: 'Research Division', tone: 'indigo', pct: 78 },
  { name: 'Operations Agent', tone: 'emerald', pct: 92 },
];

function toneBar(tone: string) {
  return {
    primary: 'bg-primary',
    emerald: 'bg-emerald-600',
    indigo: 'bg-indigo-600',
    violet: 'bg-violet-600',
  }[tone] ?? 'bg-secondary';
}

export default function LoginPage({ onLogin, onBack, initialMode = 'login' }: LoginPageProps) {
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ssoError, setSsoError] = useState('');

  const googleButtonRef = useRef<HTMLDivElement>(null);

  const finishLogin = useCallback(
    (session: NexusSession) => {
      onLogin(session);
      if (remember) localStorage.setItem('nexus_remember', '1');
      localStorage.setItem('nexus_session', JSON.stringify(session));
      if (session.authProvider === 'google') {
        localStorage.setItem('nexus_google_email', session.email);
      }
    },
    [onLogin, remember],
  );

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    setLoading(true);
    setSsoError('');
    try {
      const res =
        mode === 'signup'
          ? await signupApi(email, password, name.trim() || '')
          : await loginApi(email, password);
      finishLogin(toSession(res));
    } catch (err) {
      setSsoError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleCredential = useCallback(
    async (credential: string) => {
      setLoading(true);
      setSsoError('');
      try {
        const res = await googleLoginApi(credential);
        finishLogin(toSession(res));
      } catch (err) {
        setSsoError(err instanceof Error ? err.message : 'Google sign-in failed');
      } finally {
        setLoading(false);
      }
    },
    [finishLogin],
  );

  useEffect(() => {
    if (!GOOGLE_LOGIN_ENABLED) return;
    if (!GOOGLE_CLIENT_ID || !googleButtonRef.current) return;

    let cancelled = false;
    const el = googleButtonRef.current;

    const init = () => {
      if (cancelled || !window.google?.accounts?.id || !el) return;
      el.innerHTML = '';
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (response) => handleGoogleCredential(response.credential),
      });
      window.google.accounts.id.renderButton(el, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        text: 'continue_with',
        width: Math.min(el.offsetWidth || 280, 400),
      });
    };

    if (window.google?.accounts?.id) {
      init();
      return () => {
        cancelled = true;
      };
    }

    const existing = document.querySelector('script[data-nexus-gsi]');
    if (existing) {
      existing.addEventListener('load', init);
      return () => {
        cancelled = true;
        existing.removeEventListener('load', init);
      };
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.dataset.nexusGsi = '1';
    script.onload = init;
    document.head.appendChild(script);

    return () => {
      cancelled = true;
    };
  }, [handleGoogleCredential]);

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-surface px-gutter">
      <div className="pointer-events-none fixed inset-0 overflow-hidden opacity-40">
        <div className="absolute -left-[5%] -top-[10%] h-[40%] w-[40%] rounded-full bg-secondary/5 blur-[120px]" />
        <div className="absolute bottom-0 right-[5%] h-[50%] w-[30%] rounded-full bg-primary-fixed-dim/10 blur-[100px]" />
      </div>

      <div className="relative z-10 my-6 grid w-full max-w-[1040px] grid-cols-1 overflow-hidden rounded-2xl border border-outline-variant bg-surface-container-lowest shadow-[0px_24px_80px_rgba(0,0,0,0.08)] md:grid-cols-[1.05fr_1fr]">
        <aside className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-primary via-primary to-secondary p-8 text-on-primary md:flex">
          <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-on-primary/10 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-16 -left-8 h-56 w-56 rounded-full bg-on-primary/10 blur-2xl" />

          <div className="relative">
            <div className="inline-flex items-center gap-2 rounded-full border border-on-primary/30 bg-on-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest">
              <span className="h-1.5 w-1.5 rounded-full bg-on-primary" />
              Enterprise OS
            </div>
            <h1 className="mt-6 text-3xl font-bold leading-tight">
              Run your company with an AI executive team
            </h1>
            <p className="mt-3 max-w-md text-sm text-on-primary/85">
              Sign in to access your private autonomous workspace — your session, your industry, your agents.
            </p>
          </div>

          <div className="relative mt-6 space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-on-primary/70">
              What you get
            </p>
            {BRAND_FEATURES.map((f) => (
              <div key={f.label} className="flex items-center gap-3 rounded-xl border border-on-primary/20 bg-on-primary/5 px-3 py-2 backdrop-blur">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-on-primary/15">
                  <MaterialIcon name={f.icon} className="text-[18px]" />
                </div>
                <p className="text-sm font-semibold">{f.label}</p>
              </div>
            ))}
          </div>

          <div className="relative mt-6 rounded-xl border border-on-primary/20 bg-on-primary/5 p-3 backdrop-blur">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[10px] font-bold uppercase tracking-widest text-on-primary/70">
                Live · Execution preview
              </p>
              <span className="inline-flex items-center gap-1 rounded-full bg-on-primary/15 px-2 py-0.5 text-[9px] font-bold">
                <span className="h-1 w-1 animate-pulse rounded-full bg-on-primary" />
                Live
              </span>
            </div>
            <div className="space-y-1.5">
              {BRAND_AGENTS.map((a) => (
                <div key={a.name} className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold">{a.name}</span>
                  <span className="text-on-primary/80">{a.pct}%</span>
                </div>
              ))}
            </div>
          </div>
        </aside>

        <main className="flex flex-col p-6 sm:p-8">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="mb-4 inline-flex w-fit items-center gap-1 text-sm font-semibold text-on-surface-variant transition-colors hover:text-primary"
            >
              <MaterialIcon name="arrow_back" className="text-[18px]" />
              Back to website
            </button>
          )}

          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary premium-shadow">
              <MaterialIcon name="smart_toy" className="text-[22px] text-on-primary" />
            </div>
            <div>
              <h1 className="font-headline-md text-headline-md tracking-tight text-primary">Nexus AI</h1>
              <p className="text-xs text-on-surface-variant">Autonomous Operating System for Executives</p>
            </div>
          </div>

          <section className="rounded-xl border border-outline-variant bg-surface-container-low p-1">
            <div className="flex">
              <button
                type="button"
                onClick={() => setMode('login')}
                className={`flex-1 rounded-lg py-2.5 text-sm font-semibold transition-all ${
                  mode === 'login'
                    ? 'bg-primary text-on-primary shadow-sm'
                    : 'text-on-surface-variant hover:bg-surface-container-lowest'
                }`}
              >
                Sign in
              </button>
              <button
                type="button"
                onClick={() => setMode('signup')}
                className={`flex-1 rounded-lg py-2.5 text-sm font-semibold transition-all ${
                  mode === 'signup'
                    ? 'bg-primary text-on-primary shadow-sm'
                    : 'text-on-surface-variant hover:bg-surface-container-lowest'
                }`}
              >
                Create account
              </button>
            </div>
          </section>

          <motion.div
            key={mode}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="mt-6"
          >
            <header className="mb-4">
              <h2 className="text-xl font-bold text-primary">
                {mode === 'login' ? 'Welcome back' : 'Create your account'}
              </h2>
              <p className="mt-1 text-sm text-on-surface-variant">
                {mode === 'login'
                  ? 'Sign in to your secure autonomous workspace.'
                  : 'New accounts get a guided entrance, then a CEO discovery interview.'}
              </p>
            </header>

            <form className="space-y-4" onSubmit={handleSubmit}>
              {mode === 'signup' && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-on-surface" htmlFor="name">
                    Your name
                  </label>
                  <div className="relative">
                    <MaterialIcon
                      name="person"
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-[20px] text-on-surface-variant"
                    />
                    <input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Alex Founder"
                      className="h-[46px] w-full rounded-lg border border-outline-variant bg-surface-container-lowest pl-11 pr-4 text-sm text-primary outline-none placeholder:text-outline focus:border-secondary focus:ring-1 focus:ring-secondary"
                    />
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-on-surface" htmlFor="email">
                  Work email
                </label>
                <div className="relative">
                  <MaterialIcon
                    name="mail"
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[20px] text-on-surface-variant"
                  />
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="h-[46px] w-full rounded-lg border border-outline-variant bg-surface-container-lowest pl-11 pr-4 text-sm text-primary outline-none placeholder:text-outline focus:border-secondary focus:ring-1 focus:ring-secondary"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-on-surface" htmlFor="password">
                  Password
                </label>
                <div className="relative">
                  <MaterialIcon
                    name="lock"
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[20px] text-on-surface-variant"
                  />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={mode === 'signup' ? 6 : undefined}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="h-[46px] w-full rounded-lg border border-outline-variant bg-surface-container-lowest pl-11 pr-12 text-sm text-primary outline-none placeholder:text-outline focus:border-secondary focus:ring-1 focus:ring-secondary"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant transition-colors hover:text-primary"
                  >
                    <MaterialIcon name={showPassword ? 'visibility_off' : 'visibility'} className="text-[20px]" />
                  </button>
                </div>
                {mode === 'signup' && (
                  <p className="text-[11px] text-on-surface-variant">
                    Use 6+ characters with at least one number.
                  </p>
                )}
              </div>

              {mode === 'login' && (
                <div className="flex items-center gap-2">
                  <input
                    id="remember"
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="h-4 w-4 rounded border-outline-variant text-secondary focus:ring-secondary"
                  />
                  <label htmlFor="remember" className="cursor-pointer text-xs text-on-surface-variant">
                    Keep me signed in for 30 days
                  </label>
                </div>
              )}

              {ssoError && (
                <div className="flex items-start gap-2 rounded-lg border border-error/30 bg-error/5 px-3 py-2 text-sm text-error">
                  <MaterialIcon name="error" className="text-[18px]" />
                  <p>{ssoError}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="flex h-[46px] w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-bold text-on-primary shadow-sm transition-all hover:bg-on-surface disabled:opacity-80"
              >
                {loading ? (
                  <>
                    <MaterialIcon name="progress_activity" className="animate-spin text-[18px]" />
                    {mode === 'signup' ? 'Creating account…' : 'Authenticating…'}
                  </>
                ) : (
                  <>
                    {mode === 'signup' ? 'Create account & continue' : 'Sign in to Nexus AI'}
                    <MaterialIcon name="arrow_forward" className="text-[18px]" />
                  </>
                )}
              </button>
            </form>

            <div ref={googleButtonRef} className="mt-4 hidden" />
          </motion.div>

          <footer className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t border-outline-variant/50 pt-4 text-[11px] text-on-surface-variant">
            <div className="flex items-center gap-2">
              <MaterialIcon name="verified_user" className="text-secondary" />
              Encrypted per-account session
            </div>
            <p>Email login only · Google sign-in disabled</p>
          </footer>
        </main>
      </div>
    </div>
  );
}
