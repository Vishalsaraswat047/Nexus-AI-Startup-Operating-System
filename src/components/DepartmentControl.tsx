import { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Layers, 
  Settings2, 
  CheckCircle2, 
  PauseCircle, 
  XCircle, 
  Activity, 
  MessageSquare, 
  Users,
  Briefcase
} from 'lucide-react';
import { BusinessTwin, DepartmentState, AgentWorkforce } from '../types';
import { StitchPageHeader } from './stitch/StitchPageHeader';
import MaterialIcon from './ui/MaterialIcon';
import { formatCurrency } from '../utils/businessMetrics';
import { ProgressLine } from './stitch/StitchPrimitives';

const DEPT_ICONS: Record<string, { icon: string; bg: string; color: string }> = {
  'Engineering Core': { icon: 'code', bg: 'bg-blue-50', color: 'text-blue-600' },
  'Research Division': { icon: 'science', bg: 'bg-purple-50', color: 'text-purple-600' },
  'Design Studio': { icon: 'draw', bg: 'bg-pink-50', color: 'text-pink-600' },
  'Growth & Marketing': { icon: 'campaign', bg: 'bg-amber-50', color: 'text-amber-600' },
  'Sales Operations': { icon: 'sell', bg: 'bg-green-50', color: 'text-green-600' },
  'Financial Control': { icon: 'account_balance', bg: 'bg-teal-50', color: 'text-teal-600' },
  'Product Office': { icon: 'inventory_2', bg: 'bg-indigo-50', color: 'text-indigo-600' },
  'Legal & Policy': { icon: 'gavel', bg: 'bg-slate-100', color: 'text-slate-600' },
};

interface DepartmentControlProps {
  twin: BusinessTwin;
  departments: DepartmentState[];
  workforce: AgentWorkforce[];
  onToggleStatus: (id: string, mode: DepartmentState['status']) => void;
  activeTab: string; // for department detail select
  onSelectDepartment: (name: string) => void;
  onAddLog: (msg: string) => void;
}

export default function DepartmentControl({
  twin,
  departments,
  workforce,
  onToggleStatus,
  onSelectDepartment,
  onAddLog,
}: DepartmentControlProps) {
  const [selectedDept, setSelectedDept] = useState<DepartmentState | null>(null);

  const handleToggle = (id: string, current: DepartmentState['status']) => {
    let next: DepartmentState['status'] = 'active';
    if (current === 'active') next = 'paused';
    else if (current === 'paused') next = 'disabled';
    else next = 'active';

    onToggleStatus(id, next);
    
    const deptName = departments.find(d => d.id === id)?.name || '';
    onAddLog(`Autonomous Control Layer: Adjusted [${deptName}] department to status ${next.toUpperCase()}`);
  };

  return (
    <div className="space-y-stack-lg">
      <StitchPageHeader
        title="Departments"
        subtitle={`${twin.name} · ${formatCurrency(twin.budget)} budget · Organizational health and agent allocation`}
        breadcrumb={{ parent: 'Executive', current: 'Departments' }}
        action={
          <button
            type="button"
            onClick={() => onAddLog('Departments: Export audit requested.')}
            className="flex items-center gap-2 rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-2 text-sm font-semibold shadow-sm hover:bg-surface-container-low"
          >
            <MaterialIcon name="file_download" className="text-[18px]" />
            Export Audit
          </button>
        }
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {departments.map((dept) => {
          const deptAgents = workforce.filter((w) => w.department === dept.name);
          const workingAgents = deptAgents.filter((a) => a.status === 'working').length;
          const perf =
            dept.status === 'active'
              ? Math.min(98, 40 + workingAgents * 12 + deptAgents.length * 2)
              : dept.status === 'paused'
                ? 45
                : 20;
          const meta = DEPT_ICONS[dept.name] || { icon: 'corporate_fare', bg: 'bg-surface-container', color: 'text-outline' };
          
          return (
            <div 
              key={dept.id} 
              className={`rounded-2xl border border-outline-variant bg-surface-container-lowest p-6 shadow-sm transition hover:shadow-md ${
                dept.status === 'disabled' ? 'opacity-60' : ''
              }`}
            >
              <div className="mb-6 flex items-start justify-between">
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${meta.bg}`}>
                  <MaterialIcon name={meta.icon} className={`text-[28px] ${meta.color}`} />
                </div>
                <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
                  dept.status === 'active' ? 'bg-green-50 text-green-700' : dept.status === 'paused' ? 'bg-blue-50 text-blue-700' : 'bg-red-50 text-red-700'
                }`}>
                  {dept.status === 'active' ? 'Optimal' : dept.status === 'paused' ? 'Paused' : 'Disabled'}
                </span>
              </div>
              <h3 className="mb-1 font-headline-md text-headline-md text-primary">{dept.name}</h3>
              <p className="mb-4 text-body-sm text-on-surface-variant">{dept.brief}</p>
              <div className="space-y-4">
                <div>
                  <div className="mb-1.5 flex justify-between text-label-sm text-on-surface-variant">
                    <span>Performance</span>
                    <span className="font-bold text-primary">{perf}%</span>
                  </div>
                  <ProgressLine pct={perf} color="bg-secondary" />
                </div>
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div>
                    <p className="text-[10px] font-bold uppercase text-outline">Agents</p>
                    <p className="font-label-md text-primary">{deptAgents.length} total</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase text-outline">Working</p>
                    <p className="font-label-md text-primary">{workingAgents} working</p>
                  </div>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 border-t border-outline-variant pt-4">
                <button
                  type="button"
                  onClick={() => handleToggle(dept.id, dept.status)}
                  className="flex-1 rounded-lg bg-surface-container-low py-2 text-xs font-bold hover:bg-surface-container"
                >
                  Toggle Status
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedDept(dept);
                    onAddLog(`Departments: Opened workspace for ${dept.name}`);
                  }}
                  className="flex-1 rounded-lg bg-surface-container-low py-2 text-xs font-bold"
                >
                  Workspace
                </button>
                <button
                  type="button"
                  onClick={() => onSelectDepartment(dept.name)}
                  className="flex-1 rounded-lg bg-secondary py-2 text-xs font-bold text-on-secondary"
                >
                  Chat
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Department workspace detail */}
      {selectedDept && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-md mt-6 space-y-4"
        >
          <div className="flex items-center justify-between border-b border-outline-variant pb-3">
            <div className="flex items-center gap-2">
              <Briefcase className="w-4.5 h-4.5 text-secondary" />
              <h2 className="font-display font-semibold text-on-surface text-base">{selectedDept.name} Workspace</h2>
            </div>
            <button
              type="button"
              id="btn-close-dept-modal"
              onClick={() => setSelectedDept(null)}
              className="text-xs font-mono text-slate-400 hover:text-on-surface cursor-pointer uppercase"
            >
              Close
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            {/* Division Specs */}
            <div className="space-y-4">
              <div className="space-y-1">
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-divider">Core Briefing</span>
                <p className="text-sm text-slate-300 font-medium">{selectedDept.brief}</p>
              </div>

              <div className="space-y-1 bg-surface-container-low border border-outline-variant/60 p-3 rounded-lg">
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-divider">Telemetry Activities logs</span>
                <p className="text-xs text-slate-300 font-mono mt-1">🟢 {selectedDept.activity}</p>
              </div>
            </div>

            {/* Core agents assigned */}
            <div className="space-y-3">
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-divider block">Assigned Core Staff ({workforce.filter(w => w.department === selectedDept.name).length}):</span>
              <div className="space-y-2 max-h-40 overflow-y-auto pr-2 scrollbar-thin">
                {workforce.filter(w => w.department === selectedDept.name).map((w) => (
                  <div key={w.id} className="flex items-center justify-between bg-surface-container-low border border-outline-variant p-2.5 rounded-lg text-xs">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center text-on-surface ${w.avatarColor} font-mono text-[10px] font-bold`}>
                        {w.name[0]}
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-200">{w.name}</h4>
                        <p className="text-[9px] text-slate-400 mt-0.5">{w.role}</p>
                      </div>
                    </div>
                    <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded uppercase font-bold ${
                      w.status === 'working' ? 'bg-emerald-950/40 text-emerald-400 animate-pulse' : 'bg-[#262626] text-slate-400'
                    }`}>
                      {w.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick link to chat */}
          <div className="flex justify-end pt-3 border-t border-outline-variant">
            <button
              type="button"
              id="btn-workspace-redirect-chat"
              onClick={() => onSelectDepartment(selectedDept.name)}
              className="flex items-center gap-1.5 bg-secondary hover:opacity-90 text-on-secondary font-semibold text-xs px-4 py-2 rounded-lg hover:shadow transition select-none cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5" /> Initialize Executive Channel
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
