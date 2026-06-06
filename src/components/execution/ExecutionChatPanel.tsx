import { useEffect, useRef, useState, type FormEvent } from 'react';
import { getApiHeaders } from '../../utils/apiKeys';
import type { BusinessTwin } from '../../types';
import MaterialIcon from '../ui/MaterialIcon';

interface ExecutionChatMessage {
  role: 'user' | 'agent';
  text: string;
  agent?: string;
  intent?: 'question' | 'approve' | 'reject' | 'modify' | 'change';
  ts: number;
}

interface ExecutionChatPanelProps {
  twin: BusinessTwin;
  onAddLog: (msg: string) => void;
  onUpdateTwin?: (twin: BusinessTwin) => void;
  /** Optional context block describing what is currently executing. */
  contextSummary?: string;
  /** Compact mode renders only the input bar (history collapses). */
  compact?: boolean;
}

const QUICK_ACTIONS: Array<{
  label: string;
  intent: ExecutionChatMessage['intent'];
  prompt: string;
  icon: string;
}> = [
  { label: 'Approve', intent: 'approve', prompt: 'Approve the CEO recommended next step and run it now.', icon: 'check_circle' },
  { label: 'Reject', intent: 'reject', prompt: 'Reject the current recommendation. Suggest a better next step.', icon: 'block' },
  { label: 'Modify plan', intent: 'modify', prompt: 'Modify the plan. ', icon: 'edit' },
  { label: 'Request changes', intent: 'change', prompt: 'Request changes to the current phase outputs. Specifically: ', icon: 'edit_note' },
];

function detectIntent(text: string): ExecutionChatMessage['intent'] {
  const t = text.toLowerCase();
  if (/^(approve|yes,? run|go ahead|ship it|do it)/.test(t)) return 'approve';
  if (/^(reject|no,? don't|stop|cancel|skip)/.test(t)) return 'reject';
  if (/(modify|change|update|adjust|revise)/.test(t)) return 'modify';
  return 'question';
}

export default function ExecutionChatPanel({
  twin,
  onAddLog,
  onUpdateTwin,
  contextSummary,
  compact = false,
}: ExecutionChatPanelProps) {
  const [messages, setMessages] = useState<ExecutionChatMessage[]>([
    {
      role: 'agent',
      agent: 'CEO',
      ts: Date.now(),
      text:
        'Execution Chat online. I am your CEO Agent. Ask questions, approve actions, reject recommendations, or request changes — I steer the active workflow in real time.',
    },
  ]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [expanded, setExpanded] = useState(!compact);
  const scrollerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollerRef.current) {
      scrollerRef.current.scrollTop = scrollerRef.current.scrollHeight;
    }
  }, [messages, expanded]);

  const send = async (text: string, intent: ExecutionChatMessage['intent']) => {
    if (!text.trim() || sending) return;
    const userMsg: ExecutionChatMessage = {
      role: 'user',
      text: text.trim(),
      intent,
      ts: Date.now(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setSending(true);
    onAddLog(`Execution Chat: ${intent ?? 'question'} — ${text.trim().slice(0, 80)}`);

    try {
      const history = messages.map((m) => ({
        role: m.role === 'user' ? 'user' : 'agent',
        text: m.text,
      }));

      const intentPreamble =
        intent === 'approve'
          ? 'The founder is APPROVING the current recommendation. Confirm the action, name the next concrete step the Execution Engine will start, and stop. Do not list alternatives.'
          : intent === 'reject'
            ? 'The founder is REJECTING the current recommendation. Acknowledge, then propose the next-best operational move that creates revenue or unblocks launch — not cosmetic work.'
            : intent === 'modify' || intent === 'change'
              ? 'The founder wants to MODIFY the active plan. Restate the change concisely, then list the 1-3 task adjustments the COO should make. Operational only.'
              : 'Respond as a founder-minded CEO Agent. Every answer must point to what creates revenue, unblocks launch, or is the highest-ROI next action. Never recommend cosmetic work.';

      const contextLine = contextSummary
        ? `\n\nCurrent execution context:\n${contextSummary}`
        : '';

      const enrichedMessage = `${intentPreamble}${contextLine}\n\nFounder message: ${text.trim()}`;

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: getApiHeaders(),
        body: JSON.stringify({
          character: 'CEO',
          message: enrichedMessage,
          history,
          twinContext: twin,
        }),
      });

      if (!response.ok) throw new Error('Execution chat failed');
      const data = await response.json();

      const agentMsg: ExecutionChatMessage = {
        role: 'agent',
        agent: 'CEO',
        ts: Date.now(),
        text: data.text || '[CEO Agent] No response.',
      };
      setMessages((prev) => [...prev, agentMsg]);
      onAddLog('Execution Chat: CEO Agent replied.');

      if (data.updatedGoals && onUpdateTwin) {
        onUpdateTwin({ ...twin, goals: data.updatedGoals });
        onAddLog(`CEO Agent: Updated strategic goals (${data.updatedGoals.length} active).`);
      }
    } catch (err) {
      console.error(err);
      const agentMsg: ExecutionChatMessage = {
        role: 'agent',
        agent: 'CEO',
        ts: Date.now(),
        text:
          '[CEO Agent] Network glitch — your message was logged but the model is unreachable. Try again or check the dev server.',
      };
      setMessages((prev) => [...prev, agentMsg]);
      onAddLog('Execution Chat: CEO Agent unreachable.');
    } finally {
      setSending(false);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    send(input, detectIntent(input));
  };

  const handleQuickAction = (
    intent: ExecutionChatMessage['intent'],
    prompt: string,
  ) => {
    if (intent === 'approve' || intent === 'reject') {
      send(prompt, intent);
    } else {
      // For modify/change, prefill the input so founder can complete the sentence.
      setInput(prompt);
      setExpanded(true);
    }
  };

  return (
    <div className="sticky bottom-0 z-30 -mx-2 mt-6 border-t border-outline-variant bg-surface-container-lowest shadow-[0_-8px_24px_rgba(0,0,0,0.05)]">
      <div className="mx-auto max-w-[1440px] px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
            <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
              Execution Chat · CEO Agent
            </span>
            {contextSummary && (
              <span className="hidden text-[11px] text-outline md:inline">
                · {contextSummary.slice(0, 80)}{contextSummary.length > 80 ? '…' : ''}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="inline-flex items-center gap-1 text-xs font-semibold text-secondary hover:underline"
          >
            <MaterialIcon name={expanded ? 'expand_more' : 'expand_less'} className="text-[16px]" />
            {expanded ? 'Hide history' : 'Show history'}
          </button>
        </div>

        {expanded && (
          <div
            ref={scrollerRef}
            className="mt-3 max-h-56 overflow-y-auto rounded-xl border border-outline-variant bg-surface-container-low p-3"
          >
            <div className="space-y-2 text-sm">
              {messages.map((m, idx) => {
                const isUser = m.role === 'user';
                return (
                  <div
                    key={`${m.ts}-${idx}`}
                    className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg px-3 py-2 text-xs leading-relaxed ${
                        isUser
                          ? 'bg-primary text-on-primary'
                          : 'border border-outline-variant bg-surface-container-lowest text-on-surface'
                      }`}
                    >
                      {!isUser && (
                        <p className="mb-1 text-[10px] font-bold uppercase text-secondary">
                          {m.agent ?? 'CEO'} Agent
                        </p>
                      )}
                      {isUser && m.intent && m.intent !== 'question' && (
                        <p className="mb-1 text-[10px] font-bold uppercase opacity-80">
                          {m.intent}
                        </p>
                      )}
                      <p className="whitespace-pre-wrap">{m.text}</p>
                    </div>
                  </div>
                );
              })}
              {sending && (
                <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                  <div className="h-3 w-3 animate-spin rounded-full border-2 border-secondary border-t-transparent" />
                  CEO Agent thinking…
                </div>
              )}
            </div>
          </div>
        )}

        <div className="mt-2 flex flex-wrap gap-1.5">
          {QUICK_ACTIONS.map((a) => (
            <button
              key={a.label}
              type="button"
              disabled={sending}
              onClick={() => handleQuickAction(a.intent, a.prompt)}
              className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition disabled:opacity-50 ${
                a.intent === 'approve'
                  ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20'
                  : a.intent === 'reject'
                    ? 'border-red-500/40 bg-red-500/10 text-red-700 hover:bg-red-500/20'
                    : 'border-outline-variant bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
              }`}
            >
              <MaterialIcon name={a.icon} className="text-[13px]" />
              {a.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="mt-2 flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask, modify, approve, or request a change — the CEO Agent steers the active workflow…"
            disabled={sending}
            className="flex-1 rounded-lg border border-outline-variant bg-surface-container-lowest px-3.5 py-2.5 text-sm outline-none focus:border-secondary focus:ring-1 focus:ring-secondary disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || sending}
            className="inline-flex items-center gap-1 rounded-lg bg-secondary px-4 py-2.5 text-sm font-bold text-on-secondary transition disabled:opacity-50"
          >
            <MaterialIcon name="send" className="text-[16px]" />
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
