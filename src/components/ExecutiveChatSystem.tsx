import { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { getApiHeaders } from '../utils/apiKeys';
import { 
  Send, 
  Bot, 
  User, 
  MessageSquare, 
  Sparkles,
  ChevronRight,
  Plus
} from 'lucide-react';
import { BusinessTwin } from '../types';
import { EXEC_MODEL_LABELS } from '../config/agentModels';
import { StitchPageHeader } from './stitch/StitchPageHeader';
import MaterialIcon from './ui/MaterialIcon';
import { formatCurrency } from '../utils/businessMetrics';

interface Message {
  role: 'user' | 'agent';
  text: string;
}

interface ExecutiveChatSystemProps {
  twin: BusinessTwin | null;
  defaultChannel?: string;
  initialChannel?: string;
  onAddLog: (msg: string) => void;
  onUpdateTwin?: (twin: BusinessTwin) => void;
}

function ceoWelcome(goals: string[]): string {
  const goalLine =
    goals.length > 0
      ? `Active CEO goals: ${goals.map((g) => `"${g}"`).join(', ')}.`
      : 'No goals set yet — use "set goal: …" to add strategic objectives.';
  return `CEO Agent (${EXEC_MODEL_LABELS.CEO}) online.\n\n${goalLine}\n\nWhat should we prioritize next?`;
}

export default function ExecutiveChatSystem({
  twin,
  defaultChannel,
  initialChannel,
  onAddLog,
  onUpdateTwin,
}: ExecutiveChatSystemProps) {
  const [activeTab, setActiveTab] = useState(initialChannel || defaultChannel || 'CEO');
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const goals = twin?.goals ?? [];

  // Private chats partitioned by channels keys
  const [chats, setChats] = useState<Record<string, Message[]>>({
    'CEO': [{ role: 'agent', text: ceoWelcome(goals) }],
    'COO': [
      { role: 'agent', text: 'COO Agent initialized.\n\nReady for operations coordination sprints. Direct me to break down milestones dependencies or configure resource pipelines.' }
    ],
    'CTO': [
      { role: 'agent', text: 'CTO Agent initialized.\n\nSystem telemetry and container ports look secure. State your framework queries or databases scalability constraints.' }
    ],
    'CMO': [
      { role: 'agent', text: 'CMO Agent initialized.\n\nValue propositions and lead generation metrics optimized. Lets coordinate content outreach blocks or Product Hunt strategies.' }
    ],
    'CFO': [
      { role: 'agent', text: 'CFO Agent initialized.\n\nReviewing cash balances and operating budgets. Let me draft pricing projections or optimize burn rate ratios.' }
    ]
  });

  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Handle auto-scroll to bottom of chat
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chats, activeTab]);

  // Handle switching tabs
  useEffect(() => {
    if (defaultChannel) {
      setActiveTab(defaultChannel);
    }
  }, [defaultChannel]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;

    const textToSend = inputText;
    setInputText('');
    setIsLoading(true);

    // Append user message local view
    const currentChat = chats[activeTab] || [];
    const updatedChatWithUser = [...currentChat, { role: 'user', text: textToSend }];
    setChats((prev) => ({ ...prev, [activeTab]: updatedChatWithUser }));

    onAddLog(`Chat Engine: Enrouted query to ${activeTab} channel...`);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: getApiHeaders(),
        body: JSON.stringify({
          character: activeTab,
          message: textToSend,
          history: currentChat,
          twinContext: twin
        })
      });

      if (!response.ok) {
        throw new Error('Executive Connection interrupted');
      }

      const data = await response.json();
      if (data.text) {
        setChats((prev) => ({
          ...prev,
          [activeTab]: [...updatedChatWithUser, { role: 'agent', text: data.text }],
        }));
        onAddLog(`Chat Engine: Received response from ${activeTab} Agent (${data.model || 'NIM'}).`);
        if (data.updatedGoals && twin && onUpdateTwin) {
          onUpdateTwin({ ...twin, goals: data.updatedGoals });
          onAddLog(`CEO Agent: Updated strategic goals (${data.updatedGoals.length} active).`);
        }
      } else {
        throw new Error('Malformed AI response payload');
      }
    } catch (err: any) {
      console.error(err);
      setChats((prev) => ({
        ...prev,
        [activeTab]: [
          ...updatedChatWithUser,
          { role: 'agent', text: `[${activeTab} Alert] Apologies, my communications array encountered a minor telemetry hiccup. Direct me again or check if budget parameters need tuning.` }
        ]
      }));
      onAddLog(`Chat Engine Alert: Failed to communicate with ${activeTab} Agent.`);
    } finally {
      setIsLoading(false);
    }
  };

  const tabs = ['CEO', 'COO', 'CTO', 'CMO', 'CFO'];

  const getSubtext = (tab: string) => {
    if (tab === 'CEO') return 'Capital & Vision';
    if (tab === 'COO') return 'Sprint Operations';
    if (tab === 'CTO') return 'Tech & Deployments';
    if (tab === 'CMO') return 'Marketing & Growth';
    return 'Finance & Forecast';
  };

  return (
    <div className="space-y-stack-lg">
      <StitchPageHeader
        title="Executive Board Chat"
        subtitle={
          twin
            ? `${twin.name} · Budget ${formatCurrency(twin.budget)} · Channel with ${activeTab} Agent`
            : 'Select a board channel'
        }
        breadcrumb={{ parent: 'Executive', current: 'Board Chat' }}
      />

    <div className="flex h-[550px] flex-col overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest shadow-sm md:flex-row">
      <div className="flex w-full flex-col justify-between border-r border-outline-variant bg-surface-container-low md:w-60">
        <div className="space-y-4 p-4">
          <div className="flex select-none items-center gap-1.5 border-b border-outline-variant pb-2.5">
            <MaterialIcon name="forum" className="text-secondary" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-outline">
              Board Channels
            </span>
          </div>

          <div className="space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`flex w-full cursor-pointer flex-col rounded-lg p-2.5 text-left text-xs transition select-none ${
                  activeTab === tab
                    ? 'border border-outline-variant bg-surface-container-lowest shadow-sm'
                    : 'text-on-surface-variant hover:bg-surface-container'
                }`}
              >
                <div className="flex w-full items-center justify-between">
                  <span className="font-semibold text-primary">{tab} Agent</span>
                  <MaterialIcon
                    name="chevron_right"
                    className={activeTab === tab ? 'text-secondary' : 'opacity-0'}
                  />
                </div>
                <span className="mt-1 font-mono text-[9px] tracking-wide text-outline">
                  {getSubtext(tab)} · {EXEC_MODEL_LABELS[tab] || 'NIM'}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="border-t border-outline-variant p-4 font-mono text-[9px] text-on-surface-variant">
          Secure channel · NVIDIA NIM
        </div>
      </div>

      <div className="relative flex h-full flex-1 flex-col justify-between bg-surface-container-lowest">
        {/* Active Scribe Header */}
        <div className="p-3 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between select-none">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold text-slate-800">{activeTab} Strategic channel</span>
          </div>
          <span className="text-[9px] font-mono text-slate-400 uppercase tracking-widest">{activeTab}_COCKPIT_FEED</span>
        </div>

        {/* Chats Box */}
        <div 
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto p-5 space-y-4 scrollbar-thin scrollbar-thumb-slate-100 scrollbar-track-transparent"
        >
          {(chats[activeTab] || []).map((msg, index) => {
            const isUser = msg.role === 'user';
            return (
              <div 
                key={index} 
                className={`flex gap-3 max-w-[80%] ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
              >
                {/* Avatar */}
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-on-surface text-[10px] font-bold font-mono shrink-0 select-none ${
                  isUser 
                    ? 'bg-slate-800' 
                    : activeTab === 'CEO' ? 'bg-secondary' :
                      activeTab === 'COO' ? 'bg-blue-600' :
                      activeTab === 'CTO' ? 'bg-emerald-600' :
                      activeTab === 'CMO' ? 'bg-pink-600' : 'bg-violet-600'
                }`}>
                  {isUser ? 'U' : activeTab[0]}
                </div>

                {/* Bubble */}
                <div className={`p-3.5 rounded-xl border leading-relaxed text-xs shadow-xs ${
                  isUser 
                    ? 'bg-slate-900 border-slate-850 text-on-surface rounded-tr-none' 
                    : 'bg-slate-50 border-slate-150 text-slate-800 rounded-tl-none font-mono whitespace-pre-wrap'
                }`}>
                  {msg.text}
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex gap-3 mr-auto max-w-[8%] items-center select-none text-slate-400 font-mono text-[10px]">
              <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              <span>Scribe thinking...</span>
            </div>
          )}
        </div>

        {/* Input Form Box */}
        <form
          onSubmit={handleSendMessage}
          className="flex items-center gap-2 border-t border-outline-variant bg-surface-container-low p-4"
        >
          <input
            id="input-chat-box"
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={`Ask ${activeTab} Agent a strategic or operational question...`}
            className="flex-1 rounded-lg border border-outline-variant bg-surface-container-lowest px-3.5 py-2.5 text-sm outline-none focus:border-secondary focus:ring-1 focus:ring-secondary"
          />
          <button
            id="btn-chat-box-send"
            type="submit"
            disabled={!inputText.trim() || isLoading}
            className="p-2.5 bg-secondary hover:opacity-90 text-on-secondary rounded-lg transition disabled:opacity-50 flex-shrink-0 cursor-pointer shadow-xs hover:shadow"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
    </div>
  );
}
