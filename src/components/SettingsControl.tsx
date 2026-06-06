import { useState, useEffect } from "react";
import { 
  Building2, 
  Users, 
  Brain, 
  Settings as SettingsIcon, 
  Database, 
  Key,
  ShieldCheck,
  RefreshCw,
  Eye,
  EyeOff,
  Save
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { Switch } from "./ui/switch";
import { getStoredApiKey, setStoredApiKey } from "../utils/apiKeys";
import { StitchPageHeader } from "./stitch/StitchPageHeader";

interface SettingsControlProps {
  onAddLog: (msg: string) => void;
  onResetEnterprise: () => void;
  onLogout?: () => void;
}

export default function SettingsControl({ onAddLog, onResetEnterprise, onLogout }: SettingsControlProps) {
  // Key Gateway States
  const [openaiKey, setOpenaiKey] = useState("");
  const [anthropicKey, setAnthropicKey] = useState("");
  const [stripeKey, setStripeKey] = useState("");
  const [geminiKey, setGeminiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<"success" | "failed" | null>(null);
  const [isKeySaved, setIsKeySaved] = useState(false);

  // Business Information States
  const [businessName, setBusinessName] = useState(() => localStorage.getItem("nexus_twin") ? JSON.parse(localStorage.getItem("nexus_twin")!).name : "Nexus Sandbox");
  const [industry, setIndustry] = useState("technology");
  const [stage, setStage] = useState("mvp");
  const [monthlyBudget, setMonthlyBudget] = useState("$10,000");

  // Model & Simulation Parameters List
  const [defaultModel, setDefaultModel] = useState("Gemini 2.5 Flash (Recommended)");
  const [simulationSpeed, setSimulationSpeed] = useState("1x Normal Velocity");
  const [isBusinessSaved, setIsBusinessSaved] = useState(false);

  useEffect(() => {
    setGeminiKey(getStoredApiKey());
  }, []);

  const handleSaveGeminiKey = () => {
    setStoredApiKey(geminiKey.trim());
    setIsKeySaved(true);
    onAddLog(`Settings Engine: Updated secure Google Gemini API Gateway credentials.`);
    setTimeout(() => setIsKeySaved(false), 3000);
  };

  const handleTestHandshake = async () => {
    setIsTesting(true);
    setTestResult(null);
    onAddLog(`Settings Engine: Dispatching handshake requests to Gemini API...`);

    try {
      const response = await fetch("/api/check-key", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "x-gemini-api-key": geminiKey.trim()
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.hasKey) {
          setTestResult("success");
          onAddLog(`Settings Engine: Handshake successful. Real-time cognitive twin logic active.`);
        } else {
          setTestResult("failed");
          onAddLog(`Settings Engine: Credentials verification failed. Sandbox mode continues.`);
        }
      } else {
        throw new Error("API rejection");
      }
    } catch {
      setTestResult("failed");
      onAddLog(`Settings Engine: Handshake rejected. Falling back to local heuristics.`);
    } finally {
      setIsTesting(false);
    }
  };

  const handleSaveBusinessInfo = () => {
    setIsBusinessSaved(true);
    onAddLog(`Settings Engine: Scribed general company settings and operational stage metadata.`);
    
    // Sync with name back to business twin in localStorage if exists
    const cachedTwin = localStorage.getItem("nexus_twin");
    if (cachedTwin) {
      try {
        const parsed = JSON.parse(cachedTwin);
        parsed.name = businessName;
        parsed.industry = industry;
        parsed.stage = stage;
        localStorage.setItem("nexus_twin", JSON.stringify(parsed));
      } catch (e) {
        console.error(e);
      }
    }

    setTimeout(() => setIsBusinessSaved(false), 3000);
  };

  return (
    <div className="mx-auto max-w-[1600px] space-y-stack-lg p-1 text-left">
      <StitchPageHeader
        title="Settings"
        subtitle="Workspace coordinates, departments, agents, models, memory, and API gateways"
        breadcrumb={{ parent: 'System', current: 'Settings' }}
      />

      <Tabs defaultValue="business" className="space-y-6">
        <TabsList className="bg-card border border-border flex flex-wrap gap-1 justify-start h-auto p-1 max-w-max">
          <TabsTrigger value="business" className="gap-2 text-xs">
            <Building2 className="w-4 h-4" />
            Business
          </TabsTrigger>
          <TabsTrigger value="departments" className="gap-2 text-xs">
            <Users className="w-4 h-4" />
            Departments
          </TabsTrigger>
          <TabsTrigger value="agents" className="gap-2 text-xs">
            <Brain className="w-4 h-4" />
            Agents
          </TabsTrigger>
          <TabsTrigger value="models" className="gap-2 text-xs">
            <SettingsIcon className="w-4 h-4" />
            Models
          </TabsTrigger>
          <TabsTrigger value="memory" className="gap-2 text-xs">
            <Database className="w-4 h-4" />
            Memory
          </TabsTrigger>
          <TabsTrigger value="api" className="gap-2 text-xs">
            <Key className="w-4 h-4" />
            API
          </TabsTrigger>
        </TabsList>

        {/* 1. Business Info */}
        <TabsContent value="business" className="space-y-6">
          <div className="p-6 rounded-2xl bg-card border border-border space-y-6">
            <h2 className="font-semibold text-on-surface text-base">Business Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="businessName">Business Name</Label>
                <Input
                  id="businessName"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="bg-surface-container-lowest border-border h-11 text-on-surface font-medium focus:border-secondary"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="industry">Industry</Label>
                <select 
                  id="industry"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="w-full h-11 text-sm text-on-surface rounded-lg border border-border bg-surface-container-lowest px-3 py-2 focus:outline-none"
                >
                  <option value="technology">Technology & AI</option>
                  <option value="ecommerce">E-commerce</option>
                  <option value="saas">SaaS Development</option>
                  <option value="healthcare">Healthcare Tech</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="stage">Business Stage</Label>
                <select 
                  id="stage"
                  value={stage}
                  onChange={(e) => setStage(e.target.value)}
                  className="w-full h-11 text-sm text-on-surface rounded-lg border border-border bg-surface-container-lowest px-3 py-2 focus:outline-none"
                >
                  <option value="idea">Idea Sandbox Phase</option>
                  <option value="validation">Validation Stage</option>
                  <option value="mvp">MVP Construction</option>
                  <option value="growth">Growth scaling</option>
                  <option value="scale">Full Scale Operating</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="budget">Monthly Budget Cap</Label>
                <Input
                  id="budget"
                  value={monthlyBudget}
                  onChange={(e) => setMonthlyBudget(e.target.value)}
                  className="bg-surface-container-lowest border-border h-11 text-on-surface font-medium"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Button onClick={handleSaveBusinessInfo} className="bg-primary hover:bg-primary/95 text-on-primary">
                Save Changes
              </Button>
              {isBusinessSaved && (
                <span className="text-xs text-emerald-400 font-medium font-mono">
                  ✓ Enterprise general attributes synchronized!
                </span>
              )}
            </div>
          </div>
        </TabsContent>

        {/* 2. Departments Toggles */}
        <TabsContent value="departments" className="space-y-6">
          <div className="p-6 rounded-2xl bg-card border border-border space-y-6">
            <h2 className="font-semibold text-on-surface text-base">Department Configurations</h2>
            <p className="text-xs text-muted-foreground">
              De-activate or toggle department operations based on enterprise priorities. Standby specialists pause automated ticking.
            </p>

            <div className="space-y-4">
              {["Product", "Engineering", "Design", "Marketing", "Sales", "Finance", "Operations", "Legal"].map((dept) => (
                <div key={dept} className="flex items-center justify-between p-4 rounded-xl bg-surface-container-low border border-border/70 hover:border-border transition duration-150">
                  <div>
                    <div className="font-semibold text-sm text-on-surface">{dept} Division Core</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      Coordinates standard deliverables for {dept.toLowerCase()} workflows.
                    </div>
                  </div>
                  <Switch defaultChecked={dept !== "Legal"} />
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* 3. Agents Collaboration rules */}
        <TabsContent value="agents" className="space-y-6">
          <div className="p-6 rounded-2xl bg-card border border-border space-y-6">
            <h2 className="font-semibold text-on-surface text-base">Agent Collaboration Rules</h2>
            <p className="text-xs text-muted-foreground">
              Formulate parameters specifying autonomous agent capabilities and operational allowances.
            </p>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-xl bg-surface-container-low border border-border/70">
                <div>
                  <div className="font-semibold text-sm text-on-surface">Auto-assign Milestones</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    Specially delegated to CEO/CFO/COO bots to queue backlog items.
                  </div>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-surface-container-low border border-border/70">
                <div>
                  <div className="font-semibold text-sm text-on-surface">Inter-Agent Sprints Chat</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    Permit specialists to chat and align on sprint requirements list.
                  </div>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-surface-container-low border border-border/70">
                <div>
                  <div className="font-semibold text-sm text-on-surface">Simulated Telemetry Logger</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    Maintain detailed terminal status coordinates logs.
                  </div>
                </div>
                <Switch defaultChecked />
              </div>
            </div>
          </div>
        </TabsContent>

        {/* 4. Model Selection Settings */}
        <TabsContent value="models" className="space-y-6">
          <div className="p-6 rounded-2xl bg-card border border-border space-y-6">
            <h2 className="font-semibold text-on-surface text-base">Cognitive Model Setting Controls</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Default LLM Model</Label>
                <select 
                  value={defaultModel}
                  onChange={(e) => {
                    setDefaultModel(e.target.value);
                    onAddLog(`Settings Engine: Re-routed agent LLM networks to [${e.target.value}].`);
                  }}
                  className="w-full h-11 text-sm text-on-surface rounded-lg border border-border bg-surface-container-lowest px-3 py-2 focus:outline-none"
                >
                  <option value="Gemini 2.5 Flash">Gemini 2.5 Flash (Recommended)</option>
                  <option value="Gemini 2.0 Pro">Gemini 2.0 Pro Experimental</option>
                  <option value="Antigravity Planner">Antigravity Planner v3</option>
                  <option value="Local Sandbox">Local Offline Intelligence Heuristics</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label>Tick Velocity Multiplier</Label>
                <select 
                  value={simulationSpeed}
                  onChange={(e) => {
                    setSimulationSpeed(e.target.value);
                    onAddLog(`Settings Engine: Configured step execution velocity to [${e.target.value}].`);
                  }}
                  className="w-full h-11 text-sm text-on-surface rounded-lg border border-border bg-surface-container-lowest px-3 py-2 focus:outline-none"
                >
                  <option value="1x Normal Velocity">1x Normal Velocity</option>
                  <option value="2x Fast Sprint Mode">2x Fast Sprint Mode</option>
                  <option value="5x Overclock">5x Overclock High-Concurrency Mode</option>
                </select>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* 5. Memory Management */}
        <TabsContent value="memory" className="space-y-6">
          <div className="p-6 rounded-2xl bg-card border border-border space-y-6">
            <h2 className="font-semibold text-on-surface text-base">Corporate Memory Indices</h2>
            <p className="text-xs text-muted-foreground">
              Define retrieval depth and persistent caching rules for corporate indexes list.
            </p>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-xl bg-surface-container-low border border-border/70">
                <div>
                  <div className="font-semibold text-sm text-on-surface">Save Automated Decisions Log</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    Scribes executive boards selections straight into memory channels.
                  </div>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-surface-container-low border border-border/70">
                <div>
                  <div className="font-semibold text-sm text-on-surface">Meeting Summarizer Engine</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    Sync chats logs to formulate business memory items.
                  </div>
                </div>
                <Switch defaultChecked />
              </div>

              {onLogout && (
                <div className="flex items-center justify-between rounded-xl border border-outline-variant bg-surface-container-low p-4">
                  <div>
                    <div className="text-sm font-semibold text-on-surface">Sign out</div>
                    <div className="mt-0.5 text-[11px] text-muted-foreground">
                      End your session and return to the login screen.
                    </div>
                  </div>
                  <Button
                    onClick={() => {
                      onLogout();
                      onAddLog('Security: Signed out of Nexus workspace.');
                    }}
                    variant="outline"
                    className="h-8 rounded-lg px-4 text-[10px] font-mono font-bold uppercase"
                  >
                    Logout
                  </Button>
                </div>
              )}

              <div className="border border-red-900/30 bg-red-950/10 p-4 rounded-xl flex items-center justify-between">
                <div>
                  <div className="font-semibold text-xs text-red-400">Force Purge LocalCache Sandbox</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">
                    Deletes current active simulation parameters and resets OS state completely.
                  </div>
                </div>
                <Button onClick={onResetEnterprise} className="bg-rose-950/50 hover:bg-rose-900 border border-red-500/40 text-[10px] uppercase font-mono font-bold hover:text-on-surface h-8 px-4 rounded-lg">
                  Purge OS Cache
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* 6. Secure Infrastructure Keys */}
        <TabsContent value="api" className="space-y-6">
          <div className="p-6 rounded-2xl bg-card border border-border space-y-6">
            <div>
              <h2 className="font-semibold text-on-surface text-base">API Credentials Configuration</h2>
              <p className="text-xs text-muted-foreground mt-1">
                Maintain keys securely stored inside server environments. Keys enable high accuracy Gemini planning engines.
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="googleGemini">Secure Gemini API Key</Label>
                <div className="relative">
                  <Input
                    id="googleGemini"
                    type={showKey ? "text" : "password"}
                    value={geminiKey}
                    onChange={(e) => setGeminiKey(e.target.value)}
                    placeholder="AI_STUDIO_GEMINI_KEY_XXXX..."
                    className="bg-surface-container-lowest border-border h-11 font-mono pr-24"
                  />
                  <div className="absolute right-1 top-1.5 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setShowKey(!showKey)}
                      className="p-1.5 text-slate-500 hover:text-on-surface"
                      title={showKey ? "Hide key" : "Show key"}
                    >
                      {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                    <Button onClick={handleSaveGeminiKey} className="h-8 text-[11px] bg-primary text-on-primary font-semibold rounded px-3">
                      Save
                    </Button>
                  </div>
                </div>
              </div>

              {/* Other key placeholders requested by pasted file */}
              <div className="space-y-1.5">
                <Label htmlFor="openai">OpenAI API Key (Optional)</Label>
                <Input
                  id="openai"
                  type="password"
                  value={openaiKey}
                  onChange={(e) => setOpenaiKey(e.target.value)}
                  placeholder="sk-...."
                  className="bg-surface-container-lowest border-border h-11"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="anthropic">Anthropic API Key (Optional)</Label>
                <Input
                  id="anthropic"
                  type="password"
                  value={anthropicKey}
                  onChange={(e) => setAnthropicKey(e.target.value)}
                  placeholder="sk-ant-...."
                  className="bg-surface-container-lowest border-border h-11"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="stripe">Stripe Secret API Key (Optional)</Label>
                <Input
                  id="stripe"
                  type="password"
                  value={stripeKey}
                  onChange={(e) => setStripeKey(e.target.value)}
                  placeholder="sk_test_...."
                  className="bg-surface-container-lowest border-border h-11"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-border mt-6">
              <Button
                type="button"
                disabled={isTesting}
                onClick={handleTestHandshake}
                className="flex items-center gap-2 text-xs font-bold border border-border hover:border-outline rounded-xl px-4 py-2.5 bg-background cursor-pointer text-slate-200 transition h-10"
              >
                {isTesting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-on-surface-variant" />
                    <span>Validating credentials handshake...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-3.5 h-3.5 text-secondary" />
                    <span>Verify Active API Connection</span>
                  </>
                )}
              </Button>

              {isKeySaved && (
                <span className="text-xs text-emerald-400 font-bold font-mono">
                  ✓ Secure Gemini key credentials stored!
                </span>
              )}

              {testResult === "success" && (
                <span className="text-xs bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg px-3 py-1.5 font-bold">
                  ✓ Connection verified successfully
                </span>
              )}

              {testResult === "failed" && (
                <span className="text-xs bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-lg px-3 py-1.5 font-bold">
                  ▲ Verification Handshake Rejected. Check details.
                </span>
              )}
            </div>

          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
