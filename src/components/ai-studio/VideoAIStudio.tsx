'use client';

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Video, Sparkles, Download, RefreshCw, Play, Film, Bot, AlertTriangle } from 'lucide-react';

export const VideoAIStudio = ({ subTool }: { subTool: 'text-to-video' | 'image-to-video' }) => {
  const { showToast } = useAuth();
  const [prompt, setPrompt] = useState('Cinematic aerial drone shot of modern glass skyscraper at sunset, warm lighting, 60fps');
  const [durationSec, setDurationSec] = useState(5);
  const [provider, setProvider] = useState<'auto' | 'openai' | 'gemini' | 'claude' | 'replicate'>('auto');
  const [isGenerating, setIsGenerating] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [errorInfo, setErrorInfo] = useState<{ message: string; code?: string; provider?: string } | null>(null);
  const [telemetry, setTelemetry] = useState<{ provider?: string; model?: string; latency?: number } | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim() || isGenerating) return;
    setIsGenerating(true);
    setErrorInfo(null);

    try {
      const res = await fetch('/api/ai/video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': 'usr-1',
          'x-plan-tier': 'Pro'
        },
        body: JSON.stringify({
          prompt,
          durationSeconds: durationSec,
          provider
        })
      });

      const data = await res.json();

      if (!res.ok || data.success === false) {
        throw new Error(data.message || data.error || `Video rendering failed (${res.status})`);
      }

      const responseObj = data.response;
      setVideoUrl(responseObj.videoUrl);
      setTelemetry({
        provider: responseObj.provider,
        model: responseObj.model,
        latency: responseObj.latency
      });

      showToast(`Rendered video loop via ${responseObj.provider.toUpperCase()} (100 credits)`);
    } catch (err: any) {
      setErrorInfo({
        message: err.message || 'Video generation failed',
        code: err.code || 'PROVIDER_FAILURE',
        provider: provider.toUpperCase()
      });
      showToast(`Error: ${err.message || 'Video generation failed'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className="lg:col-span-5 space-y-4">
        <div className="surface-card p-5 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-[var(--border-subtle)]">
            <Film size={18} className="text-[var(--accent-warm)]" />
            <h3 className="text-sm font-bold text-[var(--text-primary)]">
              {subTool === 'text-to-video' ? 'Text to Video Generator' : 'Image to Video Animator'}
            </h3>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">AI Video Gateway Provider</label>
            <select
              value={provider}
              onChange={(e: any) => setProvider(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-default)] text-xs font-semibold text-[var(--text-primary)] cursor-pointer"
            >
              <option value="auto">Auto Failover (Gemini Veo → Replicate Luma)</option>
              <option value="gemini">Google Gemini Veo</option>
              <option value="replicate">Replicate (Luma Dream Machine)</option>
              <option value="openai">OpenAI Sora</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">Motion Scene Prompt</label>
            <textarea
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full p-3 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-default)] text-xs text-[var(--text-primary)] focus:border-[var(--accent-warm)] resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1.5">Clip Duration</label>
            <div className="grid grid-cols-2 gap-2">
              {[5, 10].map((dur) => (
                <button
                  key={dur}
                  onClick={() => setDurationSec(dur)}
                  className={`py-1.5 rounded-lg text-xs font-mono font-bold border cursor-pointer ${
                    durationSec === dur ? 'bg-[var(--accent-warm)] text-white border-transparent' : 'bg-[var(--bg-muted)] text-[var(--text-secondary)] border-[var(--border-default)]'
                  }`}
                >
                  {dur} Seconds Clip
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={isGenerating || !prompt.trim()}
            className="w-full py-3 rounded-xl bg-[var(--accent-warm)] text-white text-xs font-bold shadow-md hover:opacity-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isGenerating ? <RefreshCw size={16} className="animate-spin" /> : <Video size={16} />}
            <span>Render Video (100 credits)</span>
          </button>
        </div>
      </div>

      <div className="lg:col-span-7 space-y-4">
        <div className="surface-card p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
            <span className="text-xs font-bold text-[var(--text-primary)]">Video Gateway Sandbox</span>
            {telemetry?.provider && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--accent-warm-light)] text-[var(--accent-warm-text)] font-bold flex items-center gap-1">
                <Bot size={12} /> {telemetry.provider.toUpperCase()} ({telemetry.latency}ms)
              </span>
            )}
          </div>

          <div className="relative aspect-video rounded-xl bg-stone-950 border border-[var(--border-default)] overflow-hidden flex items-center justify-center p-4">
            {isGenerating ? (
              <div className="text-center space-y-2">
                <RefreshCw size={24} className="animate-spin text-[var(--accent-warm)] mx-auto" />
                <div className="text-xs font-mono text-stone-400">Posting to /api/ai/video Gateway...</div>
              </div>
            ) : errorInfo ? (
              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-center space-y-2 max-w-md font-mono">
                <AlertTriangle size={24} className="text-rose-400 mx-auto" />
                <div className="text-xs font-bold text-rose-300">Provider Error ({errorInfo.provider})</div>
                <p className="text-[11px] text-rose-200">{errorInfo.message}</p>
              </div>
            ) : videoUrl ? (
              <video src={videoUrl} controls autoPlay loop className="w-full h-full object-cover" />
            ) : (
              <div className="text-center space-y-2 text-stone-500 font-mono text-xs">
                <Video size={32} className="mx-auto text-stone-600" />
                <div>Click "Render Video" to run real generative video provider engine</div>
              </div>
            )}
          </div>

          {videoUrl && (
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => window.open(videoUrl, '_blank')}
                className="px-4 py-2 rounded-xl bg-[var(--accent-warm)] text-white text-xs font-bold shadow-md hover:opacity-95 flex items-center gap-1.5 cursor-pointer"
              >
                <Download size={14} /> Download MP4
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
