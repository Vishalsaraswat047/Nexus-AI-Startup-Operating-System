import { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Users, 
  Search, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Activity, 
  Sparkles,
  MessageSquare,
  Play,
  Briefcase
} from 'lucide-react';
import { AgentWorkforce, BusinessTwin } from '../types';
import MaterialIcon from './ui/MaterialIcon';
import { getModelLabel } from '../config/agentModels';
import { StitchPageHeader, VisionGateBanner } from './stitch/StitchPageHeader';
import { formatCurrency } from '../utils/businessMetrics';
import type { VisionWorkflowState } from '../lib/visionWorkflow';
import { isVisionReady } from '../lib/visionWorkflow';

interface WorkforceManagerProps {
  twin: BusinessTwin;
  workforce: AgentWorkforce[];
  onSimulateTick: () => void;
  isSimulating: boolean;
  onAddLog: (msg: string) => void;
  visionWorkflow?: VisionWorkflowState;
}

export default function WorkforceManager({
  twin,
  workforce,
  onSimulateTick,
  isSimulating,
  onAddLog,
  visionWorkflow,
}: WorkforceManagerProps) {
  const [filterDepart, setFilterDepart] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAgent, setSelectedAgent] = useState<AgentWorkforce | null>(null);
  const [simulatePending, setSimulatePending] = useState(false);
  const ready = isVisionReady(visionWorkflow);

  // Departments list for filter options
  const departmentsList = ['All', ...new Set(workforce.map((w) => w.department))];

  // Filtering calculations
  const filteredWorkforce = workforce.filter((agent) => {
    const matchDep = filterDepart === 'All' || agent.department === filterDepart;
    const matchStatus = filterStatus === 'All' || agent.status === filterStatus;
    const matchSearch = agent.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        agent.role.toLowerCase().includes(searchQuery.toLowerCase());
    return matchDep && matchStatus && matchSearch;
  });

  const workingCount = workforce.filter((a) => a.status === 'working').length;

  return (
    <div className="space-y-stack-lg">
      <StitchPageHeader
        title="AI Workforce"
        subtitle={`${twin.name} · ${workforce.length} agents · ${workingCount} working · Budget ${formatCurrency(twin.budget)}`}
        breadcrumb={{ parent: 'Executive', current: 'Workforce' }}
        action={
          <button
            type="button"
            onClick={() => {
              if (!ready) {
                onAddLog('Workforce: Complete vision cycle on Command Center first.');
                return;
              }
              setSimulatePending(true);
            }}
            disabled={isSimulating}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-on-primary disabled:opacity-50"
          >
            <MaterialIcon
              name={isSimulating ? 'progress_activity' : 'play_arrow'}
              className={isSimulating ? 'animate-spin' : ''}
            />
            Run Simulation
          </button>
        }
      />
      <VisionGateBanner ready={ready} />
      {simulatePending && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-4">
          <p className="text-sm font-bold text-amber-900">COO Agent requests simulation</p>
          <p className="mt-1 text-sm text-amber-950/90">
            Advance one milestone task for {twin.name}? Agents only run after your approval.
          </p>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => {
                setSimulatePending(false);
                onSimulateTick();
              }}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-on-primary"
            >
              Approve
            </button>
            <button
              type="button"
              onClick={() => setSimulatePending(false)}
              className="rounded-lg border border-outline-variant px-4 py-2 text-sm font-semibold"
            >
              Decline
            </button>
          </div>
        </div>
      )}
      {/* Filter Toolbar */}
      <div className="flex flex-col items-center justify-between gap-4 rounded-xl border border-outline-variant bg-surface-container-lowest p-4 shadow-sm md:flex-row">
        <div className="relative w-full md:w-72">
          <MaterialIcon
            name="search"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-outline"
          />
          <label htmlFor="search-agent" className="sr-only">Search specialized agents</label>
          <input
            id="search-agent"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search specialized agents..."
            className="w-full text-sm border border-outline-variant rounded-lg pl-9 pr-4 py-2 bg-surface-container-low text-on-surface focus:outline-none focus:border-indigo-500 font-medium"
          />
        </div>

        {/* Select Dropdowns */}
        <div className="flex flex-wrap gap-3 items-center w-full md:w-auto">
          <div>
            <label htmlFor="filter-department" className="sr-only">Filter by Department</label>
            <select
              id="filter-department"
              value={filterDepart}
              onChange={(e) => setFilterDepart(e.target.value)}
              className="text-xs border border-outline-variant rounded-md px-2... py-1.5 focus:outline-none focus:border-indigo-500 bg-surface-container-low text-on-surface"
            >
              {departmentsList.map((dep) => (
                <option key={dep} value={dep}>{dep === 'All' ? 'All Divisions' : dep}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="filter-status" className="sr-only">Filter by Status</label>
            <select
              id="filter-status"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="text-xs border border-outline-variant rounded-md px-2 py-1.5 focus:outline-none focus:border-indigo-500 bg-surface-container-low text-on-surface"
            >
              <option value="All">All Statuses</option>
              <option value="working">Active (Working)</option>
              <option value="standby">Standby</option>
              <option value="waiting">Awaiting approval</option>
            </select>
          </div>

          <span className="font-mono text-xs text-on-surface-variant">
            Count: {filteredWorkforce.length}
          </span>
        </div>
      </div>

      {/* Core Split Panel: Employee Grid vs Detail Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Grid: employee lists */}
        <div className="lg:col-span-2 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[500px] overflow-y-auto pr-2 scrollbar-thin">
            {filteredWorkforce.map((agent) => (
              <div 
                key={agent.id}
                onClick={() => setSelectedAgent(agent)}
                className={`border rounded-xl p-4 bg-surface-container-lowest transition cursor-pointer text-left select-none relative hover:border-outline flex flex-col justify-between ${
                  selectedAgent?.id === agent.id ? 'border-2 border-indigo-500 ring-4 ring-indigo-950/40' : 'border-outline-variant'
                }`}
              >
                {/* Employee Info Header */}
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-on-surface ${agent.avatarColor} font-bold font-mono text-xs flex-shrink-0`}>
                    {agent.name[0]}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-display font-semibold text-on-surface text-xs leading-none truncate">{agent.name}</h3>
                    <p className="text-[10px] text-slate-400 tracking-wide mt-1 truncate">{agent.role}</p>
                    <p className="mt-0.5 truncate text-[9px] font-mono text-secondary">
                      {agent.modelLabel || getModelLabel(agent.assignedModel || '')}
                    </p>
                  </div>
                </div>

                {/* Body Metrics */}
                <div className="mt-5 space-y-3">
                  {/* Current short task description */}
                  <div className="text-[10px] font-mono text-slate-300 line-clamp-1 bg-surface-container-low border border-outline-variant p-1.5 rounded">
                    🛠️ {agent.currentTask}
                  </div>

                  {/* Status badges */}
                  <div className="flex items-center justify-between border-t border-outline-variant pt-2 text-[10px] font-mono">
                    <span className="text-slate-500">{agent.department}</span>
                    <span className={`px-1.5 py-0.2 rounded uppercase font-bold text-[9px] ${
                      agent.status === 'working' ? 'bg-emerald-950/40 text-emerald-400 animate-pulse' : 'bg-[#262626] text-slate-400'
                    }`}>
                      {agent.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Panel: detailed employee card */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-sm">
          {selectedAgent ? (
            <motion.div 
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-5 text-left"
            >
              {/* Detailed Card Head */}
              <div className="flex items-center gap-4 border-b border-outline-variant pb-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-on-surface text-base font-bold ${selectedAgent.avatarColor} font-mono`}>
                  {selectedAgent.name[0]}
                </div>
                <div>
                  <h2 className="font-display font-semibold text-on-surface text-sm">{selectedAgent.name}</h2>
                  <p className="text-xs text-slate-400 mt-0.5">{selectedAgent.role}</p>
                  <p className="mt-1 text-[10px] font-mono text-secondary">
                    Model: {selectedAgent.modelLabel || getModelLabel(selectedAgent.assignedModel || '')}
                  </p>
                </div>
              </div>

              {/* Status and Rating specs */}
              <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                <div className="p-3 bg-surface-container-low border border-outline-variant rounded-lg">
                  <span className="text-[9px] text-slate-500 uppercase">Employee Rating</span>
                  <p className="font-bold text-on-surface mt-1">⭐️ {selectedAgent.rating}/10</p>
                </div>

                <div className="p-3 bg-surface-container-low border border-outline-variant rounded-lg">
                  <span className="text-[9px] text-slate-500 uppercase">Workload Pressure</span>
                  <p className={`font-bold mt-1 capitalize ${
                    selectedAgent.workload === 'high' ? 'text-rose-450' :
                    selectedAgent.workload === 'medium' ? 'text-amber-400' : 'text-emerald-400'
                  }`}>
                    {selectedAgent.workload}
                  </p>
                </div>
              </div>

              {/* Current Task Specs */}
              <div className="space-y-1">
                <span className="text-[9px] font-mono text-slate-500 uppercase tracking-divider block">Current Mandated Task:</span>
                <p className="text-xs text-slate-200 font-medium bg-surface-container-low p-3 rounded-lg border border-outline-variant leading-relaxed font-mono">
                  {selectedAgent.currentTask}
                </p>
              </div>

              {/* Artifact Deliverables list */}
              <div className="space-y-2">
                <span className="text-[9px] font-mono text-slate-500 uppercase tracking-divider block">Worker Deliverables Artifacts:</span>
                <div className="space-y-1">
                  {selectedAgent.deliverables.map((deliv, index) => (
                    <div key={index} className="flex items-center gap-2 text-[10px] text-slate-300 font-mono">
                      <span className="text-emerald-500">✓</span>
                      <span>{deliv}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Activity log streams */}
              <div className="space-y-2 border-t border-outline-variant pt-4">
                <span className="text-[9px] font-mono text-slate-500 uppercase tracking-divider block">Worker Activity Log:</span>
                <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1 text-[10px] font-mono text-slate-400">
                  {selectedAgent.activityLog.map((log, index) => (
                    <div key={index} className="flex gap-1.5 items-start">
                      <span className="text-slate-500 font-bold">↳</span>
                      <span className="leading-relaxed">{log}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="text-center py-24 text-on-surface-variant h-full flex flex-col items-center justify-center">
              <Briefcase className="w-10 h-10 stroke-1 mx-auto text-outline animate-pulse" />
              <p className="font-display text-sm mt-3">No Agent Selected</p>
              <p className="text-xs text-slate-500 mt-1">Select any agent from the panel list to view telemetry logs, ratings, and workload.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
