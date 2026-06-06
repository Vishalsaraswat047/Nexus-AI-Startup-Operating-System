import { useState, useEffect } from 'react';
import { Key, ShieldCheck, RefreshCw, Eye, EyeOff, Save, CheckCircle, AlertTriangle } from 'lucide-react';
import { getStoredApiKey, setStoredApiKey } from '../utils/apiKeys';

interface ApiKeysConfigProps {
  onAddLog: (msg: string) => void;
}

export default function ApiKeysConfig({ onAddLog }: ApiKeysConfigProps) {
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'failed' | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    setApiKey(getStoredApiKey());
  }, []);

  const handleSave = () => {
    setStoredApiKey(apiKey.trim());
    setIsSaved(true);
    onAddLog(`API Integrations: Saved custom Gemini API Key locally.`);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    onAddLog(`API Integrations: Verifying connection with Gemini 3.5 Flash...`);

    try {
      const response = await fetch('/api/check-key', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-gemini-api-key': apiKey.trim()
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.hasKey) {
          setTestResult('success');
          onAddLog(`API Integrations: Connection established successfully! Twin model has Gemini access.`);
        } else {
          setTestResult('failed');
          onAddLog(`API Integrations: Authentication rejected. Empty or placeholder key detected.`);
        }
      } else {
        throw new Error('Connection failed');
      }
    } catch (err) {
      setTestResult('failed');
      onAddLog(`API Integrations: Verification failed. Running in offline fallback mode.`);
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6 max-w-2xl mx-auto font-sans">
      <div className="border-b border-slate-100 pb-4">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Key className="w-5 h-5 text-indigo-600" />
          Secure API Key Gateway
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Nexus Autonomous Operating System securely passes your API keys server-side for real-time sandbox predictions. Your key is stored strictly within your browser's localStorage.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-[11px] font-mono text-slate-500 uppercase tracking-wider mb-2 font-bold">
            Google Gemini API Key
          </label>
          <div className="relative">
            <input
              type={showKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="AI_STUDIO_GEMINI_KEY_XXXX..."
              className="w-full text-xs border border-slate-200 rounded-xl pl-3.5 pr-20 py-3 focus:outline-indigo-500 bg-slate-50 font-mono"
            />
            <div className="absolute right-2 top-2 flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="p-1.5 text-slate-400 hover:text-slate-600 transition"
                title={showKey ? 'Hide Key' : 'Show Key'}
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="p-1.5 bg-secondary hover:bg-indigo-700 text-on-surface rounded-lg transition text-xs font-semibold px-2.5 flex items-center gap-1 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" /> Save
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
          <button
            type="button"
            disabled={isTesting}
            onClick={handleTestConnection}
            className="flex items-center gap-2 text-xs font-bold border border-slate-200 hover:border-slate-300 rounded-xl px-4 py-2.5 bg-white cursor-pointer active:scale-95 transition"
          >
            {isTesting ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-slate-400" />
                <span>Validating Key...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
                <span>Test Connection Gateway</span>
              </>
            )}
          </button>

          {isSaved && (
            <div className="text-xs text-emerald-600 font-bold flex items-center gap-1">
              <CheckCircle className="w-4 h-4" /> Key saved successfully!
            </div>
          )}

          {testResult === 'success' && (
            <div className="text-xs bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-xl px-4 py-2 flex items-center gap-1.5 font-bold animate-fade-in animate-once">
              <CheckCircle className="w-4 h-4 text-emerald-600" /> Connection established perfectly.
            </div>
          )}

          {testResult === 'failed' && (
            <div className="text-xs bg-rose-50 border border-rose-100 text-rose-800 rounded-xl px-4 py-2 flex items-center gap-1.5 font-bold animate-fade-in animate-once">
              <AlertTriangle className="w-4 h-4 text-rose-600" /> Connection failed. Standard offline simulation active.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
