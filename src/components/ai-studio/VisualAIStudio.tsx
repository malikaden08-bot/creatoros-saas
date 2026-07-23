'use client';

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Image as ImageIcon, Sparkles, Download, RefreshCw, Wand2, Layers, Cloud, Database, AlertTriangle } from 'lucide-react';

export const VisualAIStudio = ({ subTool }: { subTool: 'text-to-image' | 'image-gen' | 'logo-gen' | 'thumbnail-gen' | 'avatar-gen' }) => {
  const { showToast } = useAuth();
  const [provider, setProvider] = useState<'auto' | 'openai' | 'flux' | 'recraft' | 'stability' | 'fal' | 'replicate'>('auto');
  const [prompt, setPrompt] = useState('Studio portrait of modern content creator, warm lighting, 8k photorealistic');
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '16:9' | '9:16' | '4:3'>('16:9');
  const [stylePreset, setStylePreset] = useState('Photorealistic');
  const [isGenerating, setIsGenerating] = useState(false);
  const [outputImage, setOutputImage] = useState<string | null>(null);
  const [errorInfo, setErrorInfo] = useState<{ message: string; code?: string; provider?: string } | null>(null);
  const [metaInfo, setMetaInfo] = useState<{ provider?: string; model?: string; storageUrl?: string; assetId?: string; latency?: number } | null>(null);

  const TOOL_TITLES = {
    'text-to-image': 'Text to Image AI Engine',
    'image-gen': 'High-Resolution Image Generator',
    'logo-gen': 'Vector Logo Generator',
    'thumbnail-gen': 'High-CTR Social Thumbnail Generator',
    'avatar-gen': 'AI Creator Avatar Generator'
  };

  const handleGenerate = async () => {
    if (!prompt.trim() || isGenerating) return;
    setIsGenerating(true);
    setErrorInfo(null);

    try {
      const res = await fetch('/api/ai/image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': 'usr-1',
          'x-plan-tier': 'Pro'
        },
        body: JSON.stringify({
          provider,
          prompt,
          aspectRatio,
          stylePreset
        })
      });

      const data = await res.json();

      if (!res.ok || data.success === false) {
        throw new Error(data.message || data.error || `Provider execution failed (${res.status})`);
      }

      const responseObj = data.response;
      setOutputImage(responseObj.imageUrl);
      setMetaInfo({
        provider: responseObj.provider,
        model: responseObj.model,
        storageUrl: responseObj.storageUrl,
        assetId: responseObj.assetId,
        latency: responseObj.latency
      });

      showToast(`Generated image via ${responseObj.provider.toUpperCase()} (Saved to Storage & DB)`);
    } catch (err: any) {
      setErrorInfo({
        message: err.message || 'Image generation failed',
        code: err.code || 'PROVIDER_FAILURE',
        provider: provider.toUpperCase()
      });
      showToast(`Error: ${err.message || 'Image generation failed'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className="lg:col-span-5 space-y-4">
        <div className="surface-card p-5 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-[var(--border-subtle)]">
            <Wand2 size={18} className="text-[var(--accent-warm)]" />
            <h3 className="text-sm font-bold text-[var(--text-primary)]">{TOOL_TITLES[subTool]}</h3>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">Image Model Provider</label>
            <select
              value={provider}
              onChange={(e: any) => setProvider(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-default)] text-xs font-semibold text-[var(--text-primary)]"
            >
              <option value="auto">Auto Failover (OpenAI → FLUX → Recraft → Stability → Fal → Replicate)</option>
              <option value="openai">OpenAI DALL-E 3</option>
              <option value="flux">FLUX 1.1 Pro</option>
              <option value="recraft">Recraft V3 Vector</option>
              <option value="stability">Stability SD3.5 Ultra</option>
              <option value="fal">Fal.ai FLUX</option>
              <option value="replicate">Replicate FLUX</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">Visual Prompt</label>
            <textarea
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full p-3 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-default)] text-xs text-[var(--text-primary)] focus:border-[var(--accent-warm)] resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1.5">Aspect Ratio</label>
            <div className="grid grid-cols-4 gap-2">
              {(['16:9', '9:16', '1:1', '4:3'] as const).map((ar) => (
                <button
                  key={ar}
                  onClick={() => setAspectRatio(ar)}
                  className={`py-1.5 rounded-lg text-xs font-mono font-bold border cursor-pointer ${
                    aspectRatio === ar ? 'bg-[var(--accent-warm)] text-white border-transparent' : 'bg-[var(--bg-muted)] text-[var(--text-secondary)] border-[var(--border-default)]'
                  }`}
                >
                  {ar}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">Style Preset</label>
            <select
              value={stylePreset}
              onChange={(e) => setStylePreset(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-default)] text-xs font-semibold text-[var(--text-primary)]"
            >
              {['Photorealistic', 'Minimalist Vector', '3D Render', 'Anime Aesthetic', 'Cinematic Film'].map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <button
            onClick={handleGenerate}
            disabled={isGenerating || !prompt.trim()}
            className="w-full py-3 rounded-xl bg-[var(--accent-warm)] text-white text-xs font-bold shadow-md hover:opacity-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isGenerating ? <RefreshCw size={16} className="animate-spin" /> : <Sparkles size={16} />}
            <span>Generate Graphic (15 credits)</span>
          </button>
        </div>
      </div>

      <div className="lg:col-span-7 space-y-4">
        <div className="surface-card p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
            <span className="text-xs font-bold text-[var(--text-primary)]">Rendered Output & Cloud Storage Record</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--accent-warm-light)] text-[var(--accent-warm-text)]">{aspectRatio} • {stylePreset}</span>
          </div>

          <div className="relative aspect-video rounded-xl bg-stone-950 border border-[var(--border-default)] overflow-hidden flex items-center justify-center p-4">
            {isGenerating ? (
              <div className="text-center space-y-2">
                <RefreshCw size={24} className="animate-spin text-[var(--accent-warm)] mx-auto" />
                <div className="text-xs font-mono text-stone-400">Routing through Image Gateway & Uploading to Cloud Storage...</div>
              </div>
            ) : errorInfo ? (
              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-center space-y-2 max-w-md font-mono">
                <AlertTriangle size={24} className="text-rose-400 mx-auto" />
                <div className="text-xs font-bold text-rose-300">Provider Error ({errorInfo.provider})</div>
                <p className="text-[11px] text-rose-200">{errorInfo.message}</p>
              </div>
            ) : outputImage ? (
              <img src={outputImage} alt="Rendered Visual" className="w-full h-full object-cover" />
            ) : (
              <div className="text-center space-y-2 text-stone-500 font-mono text-xs">
                <ImageIcon size={32} className="mx-auto text-stone-600" />
                <div>Click "Generate Graphic" to run real image provider engine</div>
              </div>
            )}
          </div>

          {metaInfo && metaInfo.storageUrl && (
            <div className="p-3 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-subtle)] space-y-1.5 text-[11px] font-mono text-[var(--text-secondary)]">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1 text-[var(--text-primary)] font-bold">
                  <Cloud size={13} className="text-[var(--accent-warm)]" /> Cloud Storage CDN:
                </span>
                <span className="truncate max-w-[280px] text-[var(--accent-warm)]">{metaInfo.storageUrl}</span>
              </div>
              <div className="flex items-center justify-between border-t border-[var(--border-subtle)] pt-1">
                <span className="flex items-center gap-1 text-[var(--text-primary)] font-bold">
                  <Database size={13} className="text-emerald-500" /> Database Asset ID:
                </span>
                <span>{metaInfo.assetId} ({metaInfo.provider?.toUpperCase()} • {metaInfo.latency}ms)</span>
              </div>
            </div>
          )}

          {outputImage && (
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => showToast(`Copied CDN URL: ${metaInfo?.storageUrl || outputImage}`)}
                className="px-4 py-2 rounded-xl bg-[var(--bg-muted)] border border-[var(--border-default)] text-xs font-semibold text-[var(--text-primary)] hover:border-[var(--border-strong)] flex items-center gap-1.5 cursor-pointer"
              >
                <Layers size={14} /> Copy CDN URL
              </button>
              <button
                onClick={() => window.open(outputImage, '_blank')}
                className="px-4 py-2 rounded-xl bg-[var(--accent-warm)] text-white text-xs font-bold shadow-md hover:opacity-95 flex items-center gap-1.5 cursor-pointer"
              >
                <Download size={14} /> Download Image
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
