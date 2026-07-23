'use client';

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { FileText, Sparkles, Copy, Check, TrendingUp, RefreshCw, Bot, AlertTriangle } from 'lucide-react';

export const CopywritingAIStudio = ({
  subTool
}: {
  subTool: 'script' | 'blog' | 'email' | 'seo' | 'caption' | 'hashtag' | 'carousel';
}) => {
  const { showToast } = useAuth();
  const [topic, setTopic] = useState('How AI automation will replace manual video editing in 2026');
  const [tone, setTone] = useState('Authoritative Expert');
  const [provider, setProvider] = useState<'auto' | 'openai' | 'gemini' | 'claude' | 'groq'>('auto');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [errorInfo, setErrorInfo] = useState<{ message: string; code?: string; provider?: string } | null>(null);
  const [telemetry, setTelemetry] = useState<{ provider?: string; latency?: number; model?: string } | null>(null);

  const TOOL_TITLES = {
    script: 'Short-Form & Video Script Generator',
    blog: 'SEO Blog Article Writer',
    email: 'High-Converting Email Broadcast Writer',
    seo: 'SEO Headline & Meta Description Writer',
    caption: 'Instagram & LinkedIn Caption Generator',
    hashtag: 'Tiered Hashtag Generator',
    carousel: 'Social Media Carousel Generator'
  };

  const [outputContent, setOutputContent] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!topic.trim() || isGenerating) return;
    setIsGenerating(true);
    setErrorInfo(null);

    try {
      let res;

      if (subTool === 'seo') {
        res = await fetch('/api/ai/seo', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': 'usr-1',
            'x-plan-tier': 'Pro'
          },
          body: JSON.stringify({
            topic,
            targetAudience: tone,
            provider
          })
        });
      } else {
        const promptInstruction = `Write a professional ${TOOL_TITLES[subTool]} for topic: "${topic}". Tone: ${tone}.`;
        res = await fetch('/api/ai/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': 'usr-1',
            'x-plan-tier': 'Pro'
          },
          body: JSON.stringify({
            provider,
            messages: [
              { role: 'system', content: `You are an expert AI Copywriter specializing in ${subTool}.` },
              { role: 'user', content: promptInstruction }
            ]
          })
        });
      }

      const data = await res.json();

      if (!res.ok || data.success === false) {
        throw new Error(data.message || data.error || `Provider execution failed (${res.status})`);
      }

      const responseObj = data.response;
      setOutputContent(responseObj.seoContent || responseObj.content);
      setTelemetry({
        provider: responseObj.provider,
        latency: responseObj.latency,
        model: responseObj.model
      });

      showToast(`Generated copy via ${responseObj.provider.toUpperCase()} (${responseObj.latency}ms)`);
    } catch (err: any) {
      setErrorInfo({
        message: err.message || 'Copywriting generation failed',
        code: err.code || 'PROVIDER_FAILURE',
        provider: provider.toUpperCase()
      });
      showToast(`Error: ${err.message || 'Copywriting generation failed'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    if (!outputContent) return;
    navigator.clipboard.writeText(outputContent);
    setCopied(true);
    showToast('Copied content to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className="lg:col-span-5 space-y-4">
        <div className="surface-card p-5 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-[var(--border-subtle)]">
            <FileText size={18} className="text-[var(--accent-warm)]" />
            <h3 className="text-sm font-bold text-[var(--text-primary)]">{TOOL_TITLES[subTool]}</h3>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">AI Provider Router</label>
            <select
              value={provider}
              onChange={(e: any) => setProvider(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-default)] text-xs font-semibold text-[var(--text-primary)] cursor-pointer"
            >
              <option value="auto">Auto Failover (Groq → OpenAI → Gemini → Claude)</option>
              <option value="groq">Groq (LLaMA 3.3 70B)</option>
              <option value="openai">OpenAI (GPT-4o)</option>
              <option value="gemini">Google Gemini 1.5 Pro</option>
              <option value="claude">Anthropic Claude 3.5 Sonnet</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">Core Topic or Goal</label>
            <textarea
              rows={3}
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full p-3 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-default)] text-xs text-[var(--text-primary)] focus:border-[var(--accent-warm)] resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">Tone of Voice</label>
            <select
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-default)] text-xs font-semibold text-[var(--text-primary)]"
            >
              {['Authoritative Expert', 'Empathetic & Warm', 'Witty & Playful', 'High-Energy Hype', 'Minimalist Direct'].map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <button
            onClick={handleGenerate}
            disabled={isGenerating || !topic.trim()}
            className="w-full py-3 rounded-xl bg-[var(--accent-warm)] text-white text-xs font-bold shadow-md hover:opacity-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isGenerating ? <RefreshCw size={16} className="animate-spin" /> : <Sparkles size={16} />}
            <span>Generate Copy (AI Gateway)</span>
          </button>
        </div>
      </div>

      <div className="lg:col-span-7 space-y-4">
        <div className="surface-card p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
            <span className="text-xs font-bold text-[var(--text-primary)]">AI Gateway Response Output</span>
            {telemetry?.provider && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--accent-warm-light)] text-[var(--accent-warm-text)] font-bold flex items-center gap-1">
                <Bot size={12} /> {telemetry.provider.toUpperCase()} ({telemetry.latency}ms)
              </span>
            )}
          </div>

          <div className="p-4 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] leading-relaxed whitespace-pre-wrap min-h-[260px] flex items-center justify-center">
            {isGenerating ? (
              <div className="py-16 text-center space-y-2 font-mono text-[var(--text-secondary)]">
                <RefreshCw size={24} className="animate-spin text-[var(--accent-warm)] mx-auto" />
                <div>Routing request through AI Gateway via {provider.toUpperCase()}...</div>
              </div>
            ) : errorInfo ? (
              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-center space-y-2 max-w-md font-mono">
                <AlertTriangle size={24} className="text-rose-400 mx-auto" />
                <div className="text-xs font-bold text-rose-300">Provider Error ({errorInfo.provider})</div>
                <p className="text-[11px] text-rose-200">{errorInfo.message}</p>
              </div>
            ) : outputContent ? (
              <div className="w-full h-full text-left font-sans">{outputContent}</div>
            ) : (
              <div className="text-center font-mono text-[var(--text-tertiary)] text-xs">
                Click "Generate Copy" to execute real AI provider gateway
              </div>
            )}
          </div>

          {outputContent && (
            <div className="flex justify-between items-center pt-2">
              <button
                onClick={handleCopy}
                className="px-4 py-2 rounded-xl bg-[var(--bg-muted)] border border-[var(--border-default)] text-xs font-semibold text-[var(--text-primary)] hover:border-[var(--border-strong)] flex items-center gap-1.5 cursor-pointer"
              >
                {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                <span>{copied ? 'Copied!' : 'Copy to Clipboard'}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
