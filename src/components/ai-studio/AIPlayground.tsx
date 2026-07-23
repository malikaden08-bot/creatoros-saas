'use client';

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  FlaskConical,
  Play,
  Copy,
  Check,
  Zap,
  DollarSign,
  Clock,
  Bookmark,
  Sparkles,
  Layers,
  Bot,
  Terminal,
  RotateCcw,
  Sliders,
  CheckCircle2,
  Paperclip,
  Image as ImageIcon,
  History,
  Star,
  Plus,
  Trash2,
  Code,
  FileText,
  Radio,
  SlidersHorizontal,
  X
} from 'lucide-react';

export type ProviderType =
  | 'auto'
  | 'openai'
  | 'gemini'
  | 'claude'
  | 'groq'
  | 'fal'
  | 'replicate'
  | 'elevenlabs'
  | 'deepgram';

export interface ModelRunResult {
  provider: ProviderType;
  model: string;
  output: string;
  latencyMs: number;
  tokens: { prompt: number; completion: number; total: number };
  usdCost: number;
  creditsDeducted: number;
  status: 'idle' | 'loading' | 'success' | 'error';
  errorMessage?: string;
  rawJson?: any;
}

export interface SavedPromptItem {
  id: string;
  title: string;
  systemPrompt: string;
  userPrompt: string;
  provider: ProviderType;
  model: string;
  isFavorite: boolean;
  createdAt: string;
}

const PROVIDER_MODELS: Record<ProviderType, Array<{ id: string; name: string }>> = {
  auto: [
    { id: 'auto', name: 'Auto-Select (Best & Fastest)' }
  ],
  openai: [
    { id: 'gpt-4o', name: 'GPT-4o (Omni Reasoning)' },
    { id: 'gpt-4o-mini', name: 'GPT-4o Mini (Fast & Cheap)' },
    { id: 'dall-e-3', name: 'DALL-E 3 (Image Generation)' },
    { id: 'whisper-1', name: 'Whisper-1 (Speech STT)' }
  ],
  gemini: [
    { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro (2M Context)' },
    { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash (Ultra Fast)' },
    { id: 'imagen-3', name: 'Imagen 3 (Google Image AI)' },
    { id: 'veo-2', name: 'Veo 2 (Generative Video)' }
  ],
  claude: [
    { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet (Code & Write)' },
    { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku (Fast Agent)' }
  ],
  groq: [
    { id: 'llama-3.3-70b-versatile', name: 'LLaMA 3.3 70B (Groq LPU Instant)' },
    { id: 'llama-3.1-8b-instant', name: 'LLaMA 3.1 8B (Sub-100ms Inference)' },
    { id: 'whisper-large-v3', name: 'Whisper Large v3 (Fast STT)' }
  ],
  fal: [
    { id: 'flux-realism', name: 'Flux Realism (Photorealistic Image)' },
    { id: 'flux-dev', name: 'Flux Dev (High Quality Image)' },
    { id: 'flux-schnell', name: 'Flux Schnell (Speed Iteration)' }
  ],
  replicate: [
    { id: 'flux-schnell', name: 'Flux Schnell (Replicate Infra)' },
    { id: 'video-luma', name: 'Luma Dream Machine (Video)' }
  ],
  elevenlabs: [
    { id: 'eleven_multilingual_v2', name: 'Multilingual v2 (Realistic TTS)' },
    { id: 'eleven_turbo_v2', name: 'Turbo v2 (Low Latency Voice)' }
  ],
  deepgram: [
    { id: 'nova-2', name: 'Nova-2 (Real-Time Subtitles & STT)' },
    { id: 'nova-2-general', name: 'Nova-2 General (Audio Transcribe)' }
  ]
};

export const AIPlayground: React.FC = () => {
  const { showToast } = useAuth();

  const [systemPrompt, setSystemPrompt] = useState(
    'You are an expert CreatorOS AI Architect. Provide concise, production-ready TypeScript code with clear explanations.'
  );
  const [userPrompt, setUserPrompt] = useState(
    'Write a function that calculates multi-provider failover routing with backoff delay.'
  );

  const [temperature, setTemperature] = useState<number>(0.7);
  const [maxTokens, setMaxTokens] = useState<number>(1000);
  const [isStreaming, setIsStreaming] = useState<boolean>(true);
  const [isComparing, setIsComparing] = useState<boolean>(true);
  const [isRunningAll, setIsRunningAll] = useState<boolean>(false);

  const [attachments, setAttachments] = useState<Array<{ name: string; url: string; type: string }>>([]);

  const [panels, setPanels] = useState<
    Array<{ id: string; provider: ProviderType; model: string; activeTab: 'output' | 'raw_json' }>
  >([
    { id: 'p-1', provider: 'groq', model: 'llama-3.3-70b-versatile', activeTab: 'output' },
    { id: 'p-2', provider: 'openai', model: 'gpt-4o', activeTab: 'output' },
    { id: 'p-3', provider: 'gemini', model: 'gemini-1.5-pro', activeTab: 'output' }
  ]);

  const [results, setResults] = useState<Record<string, ModelRunResult>>({});
  const [copiedPanelId, setCopiedPanelId] = useState<string | null>(null);

  const [savedPrompts, setSavedPrompts] = useState<SavedPromptItem[]>([
    {
      id: 'sp-1',
      title: 'YouTube Viral Hook Generator',
      systemPrompt: 'You are a YouTube growth strategist. Generate 5 attention-grabbing hooks.',
      userPrompt: 'Topic: AI Tools for Creators in 2026',
      provider: 'openai',
      model: 'gpt-4o',
      isFavorite: true,
      createdAt: new Date().toISOString()
    },
    {
      id: 'sp-2',
      title: 'Multi-Provider Failover Audit',
      systemPrompt: 'You are a principal software engineer.',
      userPrompt: 'Write a TypeScript function for automatic API fallback.',
      provider: 'groq',
      model: 'llama-3.3-70b-versatile',
      isFavorite: false,
      createdAt: new Date().toISOString()
    }
  ]);
  const [showSavePromptModal, setShowSavePromptModal] = useState<boolean>(false);
  const [savePromptTitle, setSavePromptTitle] = useState<string>('');
  const [showHistoryDrawer, setShowHistoryDrawer] = useState<boolean>(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const url = event.target?.result as string;
        setAttachments((prev) => [
          ...prev,
          { name: file.name, url, type: file.type.startsWith('image/') ? 'image' : 'file' }
        ]);
      };
      reader.readAsDataURL(file);
    });
    showToast(`Attached ${files.length} file(s) to prompt`);
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const addPanel = () => {
    if (panels.length >= 4) {
      showToast('Maximum 4 benchmark panels allowed simultaneously.');
      return;
    }
    const newId = `p-${Date.now()}`;
    setPanels((prev) => [
      ...prev,
      { id: newId, provider: 'claude', model: 'claude-3-5-sonnet-20241022', activeTab: 'output' }
    ]);
  };

  const removePanel = (panelId: string) => {
    if (panels.length <= 1) {
      showToast('Minimum 1 panel required.');
      return;
    }
    setPanels((prev) => prev.filter((p) => p.id !== panelId));
  };

  const runPanelTest = async (panelId: string, provider: ProviderType, model: string) => {
    setResults((prev) => ({
      ...prev,
      [panelId]: {
        provider,
        model,
        output: '',
        latencyMs: 0,
        tokens: { prompt: 0, completion: 0, total: 0 },
        usdCost: 0,
        creditsDeducted: 5,
        status: 'loading'
      }
    }));

    const startTime = Date.now();

    try {
      if (isStreaming) {
        const res = await fetch('/api/ai/chat?stream=true', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-user-id': 'usr-1' },
          body: JSON.stringify({
            provider,
            model,
            temperature,
            maxTokens,
            stream: true,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt }
            ]
          })
        });

        if (!res.ok || !res.body) {
          throw new Error(`HTTP ${res.status} streaming error`);
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let streamText = '';

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const event = JSON.parse(line.replace('data: ', ''));
                if (event.event === 'chunk') {
                  streamText += event.delta;
                  setResults((prev) => ({
                    ...prev,
                    [panelId]: {
                      ...prev[panelId],
                      output: streamText,
                      status: 'loading'
                    }
                  }));
                } else if (event.event === 'done') {
                  const latency = Date.now() - startTime;
                  const promptTok = event.tokenUsage?.prompt || Math.round(userPrompt.length / 4);
                  const complTok = event.tokenUsage?.completion || Math.round(streamText.length / 4);
                  const totalTok = promptTok + complTok;

                  setResults((prev) => ({
                    ...prev,
                    [panelId]: {
                      provider: event.provider || provider,
                      model: event.model || model,
                      output: streamText,
                      latencyMs: latency,
                      tokens: { prompt: promptTok, completion: complTok, total: totalTok },
                      usdCost: event.cost || (totalTok * 0.000002),
                      creditsDeducted: event.creditsDeducted || 5,
                      status: 'success',
                      rawJson: event
                    }
                  }));
                }
              } catch (e) {
                // Ignore parse errors on partial chunks
              }
            }
          }
        }
      } else {
        const res = await fetch('/api/ai/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-user-id': 'usr-1' },
          body: JSON.stringify({
            provider,
            model,
            temperature,
            maxTokens,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt }
            ]
          })
        });

        const data = await res.json();
        const latency = Date.now() - startTime;

        if (data.success && data.response) {
          const promptTok = data.response.tokenUsage?.prompt || Math.round(userPrompt.length / 4);
          const complTok = data.response.tokenUsage?.completion || Math.round(data.response.content.length / 4);
          const totalTok = promptTok + complTok;

          setResults((prev) => ({
            ...prev,
            [panelId]: {
              provider: data.response.provider || provider,
              model: data.response.model || model,
              output: data.response.content || 'Execution complete',
              latencyMs: latency,
              tokens: { prompt: promptTok, completion: complTok, total: totalTok },
              usdCost: (totalTok * 0.000002),
              creditsDeducted: data.creditsDeducted || 5,
              status: 'success',
              rawJson: data
            }
          }));
        } else {
          throw new Error(data.error || 'Execution failed');
        }
      }
    } catch (err: any) {
      setResults((prev) => ({
        ...prev,
        [panelId]: {
          ...prev[panelId],
          status: 'error',
          errorMessage: err.message || 'Model execution error'
        }
      }));
    }
  };

  const handleRunAllTests = async () => {
    setIsRunningAll(true);
    await Promise.all(panels.map((p) => runPanelTest(p.id, p.provider, p.model)));
    setIsRunningAll(false);
    showToast('Parallel Benchmark Completed!');
  };

  const handleCopyOutput = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPanelId(id);
    showToast('Copied model output!');
    setTimeout(() => setCopiedPanelId(null), 2000);
  };

  const handleSavePrompt = () => {
    if (!savePromptTitle.trim()) return;
    const newItem: SavedPromptItem = {
      id: `sp-${Date.now()}`,
      title: savePromptTitle,
      systemPrompt,
      userPrompt,
      provider: panels[0].provider,
      model: panels[0].model,
      isFavorite: false,
      createdAt: new Date().toISOString()
    };
    setSavedPrompts([newItem, ...savedPrompts]);
    setShowSavePromptModal(false);
    setSavePromptTitle('');
    showToast(`Saved prompt "${newItem.title}"!`);
  };

  const loadSavedPrompt = (item: SavedPromptItem) => {
    setSystemPrompt(item.systemPrompt);
    setUserPrompt(item.userPrompt);
    showToast(`Loaded prompt "${item.title}"`);
    setShowHistoryDrawer(false);
  };

  const toggleFavorite = (id: string) => {
    setSavedPrompts((prev) =>
      prev.map((item) => (item.id === id ? { ...item, isFavorite: !item.isFavorite } : item))
    );
  };

  const activeResults = Object.values(results).filter((r) => r.status === 'success');
  const fastestResult =
    activeResults.length > 0
      ? activeResults.reduce((prev, curr) => (curr.latencyMs < prev.latencyMs ? curr : prev))
      : null;
  const lowestCostResult =
    activeResults.length > 0
      ? activeResults.reduce((prev, curr) => (curr.usdCost < prev.usdCost ? curr : prev))
      : null;

  return (
    <div className="h-full flex flex-col gap-5 overflow-hidden text-[var(--text-primary)] font-sans">
      <div className="surface-card p-4 rounded-2xl border border-[var(--border-subtle)] flex flex-wrap items-center justify-between gap-3 shadow-sm backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <FlaskConical size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-extrabold text-[var(--text-primary)]">CreatorOS AI Playground</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                8 Providers Matrix
              </span>
            </div>
            <p className="text-xs text-[var(--text-secondary)]">
              Developer sandbox to test & benchmark OpenAI, Gemini, Claude, Groq, Fal, Replicate, ElevenLabs, & Deepgram.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowHistoryDrawer(true)}
            className="px-3.5 py-2 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-default)] text-xs font-bold text-[var(--text-primary)] hover:border-indigo-500 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <History size={14} className="text-indigo-400" />
            <span>History ({savedPrompts.length})</span>
          </button>

          <button
            onClick={() => setShowSavePromptModal(true)}
            className="px-3.5 py-2 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-default)] text-xs font-bold text-[var(--text-primary)] hover:border-amber-500 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Bookmark size={14} className="text-amber-400" />
            <span>Save Prompt</span>
          </button>

          <button
            onClick={handleRunAllTests}
            disabled={isRunningAll}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-400 hover:to-cyan-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 disabled:opacity-50 cursor-pointer transition-transform active:scale-95 flex items-center gap-2"
          >
            <Play size={14} className={isRunningAll ? 'animate-spin' : 'fill-slate-950'} />
            <span>{isRunningAll ? 'Benchmarking Providers...' : 'Run Benchmark All'}</span>
          </button>
        </div>
      </div>

      {activeResults.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-3.5 rounded-2xl bg-[#0b0f19]/90 border border-emerald-500/30 flex items-center gap-3 shadow-lg">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Zap size={20} />
            </div>
            <div>
              <div className="text-[10px] text-slate-400 font-mono uppercase font-bold tracking-wider">Fastest Latency Winner</div>
              <div className="text-sm font-extrabold text-emerald-400">
                {fastestResult?.provider.toUpperCase()} ({fastestResult?.latencyMs} ms)
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#0b0f19]/90 border border-blue-500/30 flex items-center gap-3 shadow-lg">
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <DollarSign size={20} />
            </div>
            <div>
              <div className="text-[10px] text-slate-400 font-mono uppercase font-bold tracking-wider">Lowest USD Cost</div>
              <div className="text-sm font-extrabold text-blue-400">
                {lowestCostResult?.provider.toUpperCase()} (${lowestCostResult?.usdCost.toFixed(5)})
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#0b0f19]/90 border border-purple-500/30 flex items-center gap-3 shadow-lg">
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Layers size={20} />
            </div>
            <div>
              <div className="text-[10px] text-slate-400 font-mono uppercase font-bold tracking-wider">Parallel Matrix</div>
              <div className="text-sm font-extrabold text-slate-100">
                {panels.length} Active Provider Panels
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="surface-card p-4 sm:p-5 rounded-2xl border border-[var(--border-subtle)] space-y-4 shadow-md">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[var(--text-secondary)] flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Bot size={14} className="text-indigo-400" /> System Persona Instructions
              </span>
              <span className="font-mono text-[10px] text-slate-400">System</span>
            </label>
            <textarea
              rows={3}
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              className="w-full p-3 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-default)] text-xs text-[var(--text-primary)] focus:border-indigo-500 focus:outline-none resize-none font-mono"
              placeholder="System persona instructions..."
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[var(--text-secondary)] flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Terminal size={14} className="text-cyan-400" /> User Test Prompt & Attachments
              </span>
              <span className="font-mono text-[10px] text-slate-400">Query</span>
            </label>
            <textarea
              rows={3}
              value={userPrompt}
              onChange={(e) => setUserPrompt(e.target.value)}
              className="w-full p-3 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-default)] text-xs text-[var(--text-primary)] focus:border-cyan-500 focus:outline-none resize-none font-mono"
              placeholder="Test prompt query..."
            />
          </div>
        </div>

        {attachments.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[var(--border-subtle)]">
            <span className="text-xs font-bold text-[var(--text-secondary)]">Attachments:</span>
            {attachments.map((att, idx) => (
              <div key={idx} className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-[var(--bg-canvas)] border border-[var(--border-default)] text-xs">
                {att.type === 'image' ? <ImageIcon size={14} className="text-pink-400" /> : <Paperclip size={14} className="text-cyan-400" />}
                <span className="font-mono text-[11px] truncate max-w-[120px]">{att.name}</span>
                <button onClick={() => removeAttachment(idx)} className="text-slate-400 hover:text-rose-400 cursor-pointer">
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-[var(--border-subtle)] text-xs">
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsStreaming(!isStreaming)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                  isStreaming ? 'bg-cyan-500' : 'bg-slate-700'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    isStreaming ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
              <span className="font-bold text-[var(--text-secondary)] flex items-center gap-1">
                <Radio size={14} className={isStreaming ? 'text-cyan-400 animate-pulse' : 'text-slate-400'} />
                <span>Real-Time SSE Streaming</span>
              </span>
            </div>

            <div className="flex items-center gap-2">
              <label className="font-semibold text-[var(--text-secondary)]">Temperature:</label>
              <input
                type="range"
                min="0.0"
                max="1.0"
                step="0.05"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                className="w-24 accent-cyan-400 cursor-pointer"
              />
              <span className="font-mono font-bold text-cyan-400">{temperature}</span>
            </div>

            <div className="flex items-center gap-2">
              <label className="font-semibold text-[var(--text-secondary)]">Max Tokens:</label>
              <input
                type="number"
                min={128}
                max={4096}
                step={64}
                value={maxTokens}
                onChange={(e) => setMaxTokens(parseInt(e.target.value, 10) || 1000)}
                className="w-20 p-1 rounded-lg bg-[var(--bg-canvas)] border border-[var(--border-default)] font-mono text-center font-bold text-cyan-400 text-xs"
              />
            </div>

            <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--bg-canvas)] border border-[var(--border-default)] text-xs font-semibold text-[var(--text-primary)] hover:border-cyan-500 cursor-pointer transition-colors">
              <Paperclip size={14} className="text-cyan-400" />
              <span>Attach Image/File</span>
              <input type="file" multiple accept="image/*,audio/*" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>

          <button
            onClick={addPanel}
            disabled={panels.length >= 4}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs font-bold hover:bg-indigo-500/20 disabled:opacity-40 cursor-pointer transition-colors"
          >
            <Plus size={14} />
            <span>Add Benchmark Panel ({panels.length}/4)</span>
          </button>
        </div>
      </div>

      <div className={`flex-1 overflow-y-auto grid grid-cols-1 ${
        panels.length === 1 ? 'md:grid-cols-1' : panels.length === 2 ? 'md:grid-cols-2' : 'md:grid-cols-3 lg:grid-cols-3'
      } gap-4 pr-1`}>
        {panels.map((p, idx) => {
          const res = results[p.id];
          const isFastest = fastestResult && res && fastestResult.provider === res.provider;
          const isCheapest = lowestCostResult && res && lowestCostResult.provider === res.provider;

          return (
            <div
              key={p.id}
              className={`surface-card p-4 rounded-2xl border flex flex-col justify-between space-y-3 transition-all shadow-md relative ${
                isFastest
                  ? 'border-emerald-500/50 shadow-emerald-500/10'
                  : isCheapest
                  ? 'border-blue-500/50 shadow-blue-500/10'
                  : 'border-[var(--border-default)]'
              }`}
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between pb-2 border-b border-[var(--border-subtle)]">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 font-bold font-mono text-xs flex items-center justify-center">
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span className="text-xs font-extrabold uppercase tracking-wider font-mono">
                      Panel {String.fromCharCode(65 + idx)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {isFastest && (
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold text-[9px] font-mono flex items-center gap-1">
                        <Zap size={10} /> FASTEST
                      </span>
                    )}
                    {isCheapest && (
                      <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 font-bold text-[9px] font-mono flex items-center gap-1">
                        <DollarSign size={10} /> CHEAPEST
                      </span>
                    )}
                    {panels.length > 1 && (
                      <button onClick={() => removePanel(p.id)} className="text-slate-400 hover:text-rose-400 p-1 cursor-pointer">
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Provider</label>
                    <select
                      value={p.provider}
                      onChange={(e) => {
                        const newProv = e.target.value as ProviderType;
                        const defaultModel = PROVIDER_MODELS[newProv]?.[0]?.id || 'auto';
                        setPanels(panels.map((item) => (item.id === p.id ? { ...item, provider: newProv, model: defaultModel } : item)));
                      }}
                      className="w-full p-2 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-default)] text-xs font-bold text-[var(--text-primary)] focus:border-cyan-500 focus:outline-none"
                    >
                      <option value="auto">⚡ Auto Failover</option>
                      <option value="openai">OpenAI (ChatGPT)</option>
                      <option value="gemini">Google Gemini</option>
                      <option value="claude">Anthropic Claude</option>
                      <option value="groq">Groq (LLaMA 3.3)</option>
                      <option value="fal">Fal.ai (Flux AI)</option>
                      <option value="replicate">Replicate (Flux)</option>
                      <option value="elevenlabs">ElevenLabs (TTS)</option>
                      <option value="deepgram">Deepgram (STT)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Model</label>
                    <select
                      value={p.model}
                      onChange={(e) => {
                        setPanels(panels.map((item) => (item.id === p.id ? { ...item, model: e.target.value } : item)));
                      }}
                      className="w-full p-2 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-default)] text-xs font-semibold text-[var(--text-primary)] focus:border-cyan-500 focus:outline-none"
                    >
                      {(PROVIDER_MODELS[p.provider] || []).map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex-1 bg-[#090d16] rounded-xl p-3 border border-[#1b253b] my-2 flex flex-col min-h-[220px]">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#1b253b] text-xs">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setPanels(panels.map((item) => (item.id === p.id ? { ...item, activeTab: 'output' } : item)))}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-bold cursor-pointer transition-colors ${
                        p.activeTab === 'output' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <FileText size={12} className="inline mr-1" /> Formatted Output
                    </button>
                    <button
                      onClick={() => setPanels(panels.map((item) => (item.id === p.id ? { ...item, activeTab: 'raw_json' } : item)))}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-bold cursor-pointer transition-colors ${
                        p.activeTab === 'raw_json' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Code size={12} className="inline mr-1" /> Raw JSON Response
                    </button>
                  </div>

                  {res?.status === 'success' && (
                    <span className="text-[10px] font-mono text-emerald-400">● Live Execution</span>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto max-h-[200px]">
                  {res?.status === 'loading' ? (
                    <div className="h-full flex flex-col items-center justify-center text-xs text-slate-400 space-y-2 font-mono py-12">
                      <Sparkles size={22} className="text-cyan-400 animate-spin" />
                      <span>Streaming response from {p.provider.toUpperCase()} ({p.model})...</span>
                    </div>
                  ) : p.activeTab === 'raw_json' ? (
                    <pre className="text-[11px] font-mono text-purple-300 whitespace-pre-wrap leading-relaxed">
                      {res?.rawJson ? JSON.stringify(res.rawJson, null, 2) : '// Click "Run Test" to view raw JSON response payload'}
                    </pre>
                  ) : res?.status === 'success' ? (
                    <div className="text-xs font-mono text-slate-200 whitespace-pre-wrap leading-relaxed">
                      {res.output}
                    </div>
                  ) : res?.status === 'error' ? (
                    <div className="text-xs font-mono text-rose-400 py-4 text-center">
                      Error: {res.errorMessage}
                    </div>
                  ) : (
                    <div className="text-xs font-mono text-slate-500 py-12 text-center">
                      Click "Run Test" to benchmark output
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-[var(--border-subtle)]">
                {res?.status === 'success' && (
                  <div className="grid grid-cols-3 gap-1.5 text-[10px] font-mono text-center">
                    <div className="p-1.5 rounded-lg bg-[#0a0d14] border border-[#1e293b]">
                      <div className="text-slate-400">LATENCY</div>
                      <div className="font-bold text-amber-400">{res.latencyMs} ms</div>
                    </div>
                    <div className="p-1.5 rounded-lg bg-[#0a0d14] border border-[#1e293b]">
                      <div className="text-slate-400">TOKENS</div>
                      <div className="font-bold text-cyan-400">{res.tokens.total}</div>
                    </div>
                    <div className="p-1.5 rounded-lg bg-[#0a0d14] border border-[#1e293b]">
                      <div className="text-slate-400 font-bold">EST. COST</div>
                      <div className="font-bold text-emerald-400">${res.usdCost.toFixed(5)}</div>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopyOutput(res?.output || '', p.id)}
                    disabled={!res?.output}
                    className="p-2.5 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-default)] text-[var(--text-primary)] hover:border-cyan-500 disabled:opacity-40 cursor-pointer transition-colors"
                    title="Copy Output"
                  >
                    {copiedPanelId === p.id ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                  </button>

                  <button
                    onClick={() => runPanelTest(p.id, p.provider, p.model)}
                    disabled={res?.status === 'loading'}
                    className="flex-1 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-extrabold disabled:opacity-50 cursor-pointer transition-transform active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20"
                  >
                    <Play size={12} className="fill-slate-950" />
                    <span>Run Test</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {showSavePromptModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="surface-card w-full max-w-md p-6 rounded-2xl space-y-4 border border-[var(--border-default)] shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-[var(--border-subtle)]">
              <div className="flex items-center gap-2">
                <Bookmark size={18} className="text-amber-400" />
                <h2 className="text-sm font-bold text-[var(--text-primary)]">Save Prompt to Library</h2>
              </div>
              <button onClick={() => setShowSavePromptModal(false)} className="text-slate-400 hover:text-slate-200">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-[var(--text-secondary)]">Prompt Title:</label>
                <input
                  type="text"
                  placeholder="e.g. High-Converting Script Evaluator"
                  value={savePromptTitle}
                  onChange={(e) => setSavePromptTitle(e.target.value)}
                  className="w-full p-3 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-default)] text-xs text-[var(--text-primary)] focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div className="p-3 rounded-xl bg-[#0a0d14] border border-[#1e293b] space-y-1.5 font-mono text-[11px]">
                <div className="font-bold text-slate-400">Saved System Persona:</div>
                <div className="text-slate-200 truncate">{systemPrompt}</div>
                <div className="font-bold text-slate-400 pt-1">Saved User Query:</div>
                <div className="text-cyan-400 truncate">{userPrompt}</div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border-subtle)]">
              <button
                onClick={() => setShowSavePromptModal(false)}
                className="px-4 py-2.5 rounded-xl bg-[var(--bg-muted)] text-[var(--text-secondary)] text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSavePrompt}
                className="px-4 py-2.5 rounded-xl bg-amber-500 text-slate-950 text-xs font-bold cursor-pointer shadow-md hover:bg-amber-400"
              >
                Save Prompt
              </button>
            </div>
          </div>
        </div>
      )}

      {showHistoryDrawer && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex justify-end z-50">
          <div className="w-full max-w-md bg-[#0e1320] h-full p-6 space-y-4 border-l border-[#1e293b] shadow-2xl flex flex-col justify-between overflow-y-auto">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-[#1e293b]">
                <div className="flex items-center gap-2">
                  <History size={18} className="text-indigo-400" />
                  <h2 className="text-base font-bold text-slate-100">Saved Prompts & Favorites</h2>
                </div>
                <button onClick={() => setShowHistoryDrawer(false)} className="text-slate-400 hover:text-slate-200 cursor-pointer">
                  <X size={18} />
                </button>
              </div>

              <div className="mt-4 space-y-3">
                {savedPrompts.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-xl bg-[#131929] border border-[#1f293d] hover:border-indigo-500/50 transition-all space-y-2 group"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-xs text-slate-100 group-hover:text-indigo-300">{item.title}</h4>
                      <button onClick={() => toggleFavorite(item.id)} className="cursor-pointer">
                        <Star size={14} className={item.isFavorite ? 'text-amber-400 fill-amber-400' : 'text-slate-600'} />
                      </button>
                    </div>

                    <p className="text-[11px] text-slate-400 font-mono truncate">{item.userPrompt}</p>

                    <div className="flex items-center justify-between pt-2 border-t border-[#1f293d] text-[10px] font-mono text-slate-500">
                      <span>{item.provider.toUpperCase()} ({item.model})</span>
                      <button
                        onClick={() => loadSavedPrompt(item)}
                        className="px-2.5 py-1 rounded bg-indigo-500/20 text-indigo-300 font-bold hover:bg-indigo-500/30 cursor-pointer"
                      >
                        Load Prompt
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-[#1e293b] text-center text-xs text-slate-400 font-mono">
              Total Saved Prompts: {savedPrompts.length}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
