import { useState } from 'react';
import { motion } from 'motion/react';
import { 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle, 
  TrendingUp, 
  Activity,
  Plus
} from 'lucide-react';
import { RiskItem } from '../types';

interface RiskManagementCenterProps {
  risks: RiskItem[];
  onAddLog: (msg: string) => void;
  onUpdateRisks: (updatedRisks: RiskItem[]) => void;
}

export default function RiskManagementCenter({
  risks,
  onAddLog,
  onUpdateRisks
}: RiskManagementCenterProps) {
  const [newRiskCategory, setNewRiskCategory] = useState<'Budget' | 'Growth' | 'Technical' | 'Operational' | 'Legal'>('Technical');
  const [newRiskTitle, setNewRiskTitle] = useState('');
  const [newRiskDesc, setNewRiskDesc] = useState('');
  const [newRiskSeverity, setNewRiskSeverity] = useState<'high' | 'medium' | 'low'>('medium');

  const handleMitigateRisk = (id: string) => {
    const updated = risks.map((risk) => {
      if (risk.id === id) {
        onAddLog(`Replanning Agent: Mitigated active hazard [${risk.title}] automatically.`);
        return { 
          ...risk, 
          status: 'mitigated' as const, 
          actionTaken: 'Replanning guidelines successfully validated. Operational bandwidth buffers established.' 
        };
      }
      return risk;
    });

    onUpdateRisks(updated);
  };

  const handleCreateRisk = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRiskTitle.trim() || !newRiskDesc.trim()) return;

    const newRisk: RiskItem = {
      id: `r-${Date.now()}`,
      category: newRiskCategory,
      severity: newRiskSeverity,
      title: newRiskTitle,
      description: newRiskDesc,
      status: 'triggered',
      actionTaken: 'Awaiting Autonomous Replanning evaluation loop...'
    };

    onUpdateRisks([newRisk, ...risks]);
    onAddLog(`Risk Monitor Alert: Logged customized threat hazard: [${newRiskTitle}]`);
    setNewRiskTitle('');
    setNewRiskDesc('');
  };

  return (
    <div className="space-y-6 text-left">
      {/* Overview Head */}
      <div className="border-b border-outline-variant pb-5">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-rose-500" />
          <h1 className="font-display text-2xl font-semibold tracking-tight text-on-surface">Threat & Risk Center</h1>
        </div>
        <p className="text-sm text-on-surface-variant mt-1">
          Monitor Cash, Operational, Legal, and Tech infrastructure alerts. Trace automated mitigation steps taken by the Replanning Agent.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Create custom risk form */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm space-y-4 hover:border-outline transition duration-150">
          <div className="flex items-center gap-2 text-on-surface border-b border-outline-variant pb-3">
            <Plus className="w-4 h-4 text-rose-500" />
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider">Trigger Specific Threat</span>
          </div>

          <form onSubmit={handleCreateRisk} className="space-y-4">
            <div>
              <label htmlFor="select-risk-category" className="block text-[10px] font-mono text-slate-500 uppercase mb-1">Threat Category</label>
              <select
                id="select-risk-category"
                value={newRiskCategory}
                onChange={(e) => setNewRiskCategory(e.target.value as any)}
                className="w-full text-xs border border-outline-variant rounded-md p-2 bg-surface-container-low text-on-surface focus:outline-none focus:border-rose-500"
              >
                <option>Budget</option>
                <option>Technical</option>
                <option>Legal</option>
                <option>Operational</option>
                <option>Growth</option>
              </select>
            </div>

            <div>
              <label htmlFor="select-risk-severity" className="block text-[10px] font-mono text-slate-500 uppercase mb-1">Severity Level</label>
              <select
                id="select-risk-severity"
                value={newRiskSeverity}
                onChange={(e) => setNewRiskSeverity(e.target.value as any)}
                className="w-full text-xs border border-outline-variant rounded-md p-2 bg-surface-container-low text-on-surface focus:outline-none focus:border-rose-500"
              >
                <option value="high">High Severity</option>
                <option value="medium">Medium Severity</option>
                <option value="low">Low Severity</option>
              </select>
            </div>

            <div>
              <label htmlFor="input-risk-title" className="block text-[10px] font-mono text-slate-500 uppercase mb-1">Threat Title</label>
              <input
                id="input-risk-title"
                type="text"
                value={newRiskTitle}
                onChange={(e) => setNewRiskTitle(e.target.value)}
                placeholder="e.g. Stripe webhook crash"
                className="w-full text-xs border border-outline-variant rounded-md p-2 bg-surface-container-low text-on-surface focus:outline-none focus:border-rose-500 font-medium"
              />
            </div>

            <div>
              <label htmlFor="input-risk-desc" className="block text-[10px] font-mono text-slate-500 uppercase mb-1">Detailed Description</label>
              <textarea
                id="input-risk-desc"
                rows={3}
                value={newRiskDesc}
                onChange={(e) => setNewRiskDesc(e.target.value)}
                placeholder="Details of the operational risk delay..."
                className="w-full text-xs border border-outline-variant rounded-md p-2 bg-surface-container-low text-on-surface focus:outline-none focus:border-rose-500 resize-none font-medium"
              />
            </div>

            <button
              id="btn-create-risk-trigger"
              type="submit"
              disabled={!newRiskTitle.trim() || !newRiskDesc.trim()}
              className="w-full text-center bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-on-surface rounded-lg px-4 py-2.5 text-xs font-semibold hover:shadow cursor-pointer transition select-none"
            >
              Trigger Threat Hazard Alert
            </button>
          </form>
        </div>

        {/* Right Side: Active Risks Monitor Cards */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm space-y-4 hover:border-outline transition duration-150">
            <div className="flex items-center gap-2 border-b border-outline-variant pb-3 justify-between">
              <div className="flex items-center gap-1">
                <Activity className="w-4 h-4 text-rose-500 animate-pulse" />
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-250">Active Threats Index Tracker</span>
              </div>
              <span className="text-xs text-rose-450 font-mono font-semibold">
                Unresolved Hazards: {risks.filter(r => r.status === 'triggered').length}
              </span>
            </div>

            <div className="space-y-3.5 max-h-[400px] overflow-y-auto pr-1 scrollbar-thin">
              {risks.map((risk) => {
                const isTriggered = risk.status === 'triggered';
                return (
                  <div 
                    key={risk.id} 
                    className={`border rounded-xl p-4 transition ${
                      isTriggered 
                        ? 'bg-rose-950/10 border-rose-900/30' 
                        : 'bg-surface-container-low border-outline-variant opacity-75'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-[9px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                        risk.severity === 'high' ? 'bg-rose-950 text-rose-400 border border-rose-900/40' :
                        risk.severity === 'medium' ? 'bg-amber-950 text-amber-400 border border-amber-900/40' : 'bg-[#262626] text-slate-400'
                      }`}>
                        {risk.severity} Severity
                      </span>

                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-slate-400 capitalize">{risk.category}</span>
                        {isTriggered ? (
                          <span className="w-2 h-2 rounded-full bg-rose-550 animate-pulse" />
                        ) : (
                          <span className="text-[9px] font-mono bg-emerald-950/40 text-emerald-400 border border-emerald-900/30 px-1.5 rounded font-bold uppercase select-none">
                            Mitigated
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="mt-3 text-left">
                      <h4 className="text-xs font-semibold text-on-surface">{risk.title}</h4>
                      <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">{risk.description}</p>
                    </div>

                    {/* Action log */}
                    <div className="mt-3 pt-3 border-t border-outline-variant flex flex-col md:flex-row md:items-center justify-between gap-3 text-[10px] font-mono text-secondary">
                      <div className="leading-snug">
                        <span className="font-bold uppercase tracking-wider block text-[8px] text-secondary mb-0.5">Corrective Action Taken:</span>
                        <span className="text-slate-300">{risk.actionTaken}</span>
                      </div>

                      {isTriggered && (
                        <button
                          type="button"
                          onClick={() => handleMitigateRisk(risk.id)}
                          className="text-[9px] uppercase font-bold border border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10 px-2 py-1 rounded bg-transparent shrink-0 cursor-pointer transition"
                        >
                          Resolve Alert
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
