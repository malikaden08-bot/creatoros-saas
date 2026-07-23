'use client';

import React, { useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { VOICE_OPTIONS } from '../../lib/mockDataAI';
import { Mic, Music, Play, Pause, Download, Sparkles, RefreshCw, Volume2, AlertTriangle, Bot } from 'lucide-react';

export const AudioAIStudio = ({ subTool }: { subTool: 'voice-gen' | 'music-gen' }) => {
  const { showToast } = useAuth();
  const [selectedVoice, setSelectedVoice] = useState(VOICE_OPTIONS[0]);
  const [scriptText, setScriptText] = useState('In 2026, top creators run entire media operations using CreatorOS.');
  const [genre, setGenre] = useState('Lo-Fi Chill Hop');
  const [bpm, setBpm] = useState(85);
  const [provider, setProvider] = useState<'auto' | 'elevenlabs' | 'openai'>('auto');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [audioSrc, setAudioSrc] = useState<string | null>(null);
  const [errorInfo, setErrorInfo] = useState<{ message: string; code?: string; provider?: string } | null>(null);
  const [telemetry, setTelemetry] = useState<{ provider?: string; model?: string; latency?: number } | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handleGenerate = async () => {
    if (!scriptText.trim() || isGenerating) return;
    setIsGenerating(true);
    setErrorInfo(null);

    try {
      const res = await fetch('/api/ai/voice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': 'usr-1',
          'x-plan-tier': 'Pro'
        },
        body: JSON.stringify({
          text: scriptText,
          voice: selectedVoice.name,
          provider
        })
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || errJson.error || `Voice synthesis failed (${res.status})`);
      }

      const audioBlob = await res.blob();
      const objectUrl = URL.createObjectURL(audioBlob);
      setAudioSrc(objectUrl);
      setTelemetry({
        provider: res.headers.get('x-provider') || 'elevenlabs',
        latency: parseInt(res.headers.get('x-latency-ms') || '280', 10)
      });

      showToast('Synthesized audio track via ElevenLabs / OpenAI Gateway!');
    } catch (err: any) {
      setErrorInfo({
        message: err.message || 'Voice synthesis failed',
        code: err.code || 'PROVIDER_FAILURE',
        provider: provider.toUpperCase()
      });
      showToast(`Error: ${err.message || 'Voice synthesis failed'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const togglePlayback = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className="lg:col-span-5 space-y-4">
        <div className="surface-card p-5 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-[var(--border-subtle)]">
            {subTool === 'voice-gen' ? <Mic size={18} className="text-[var(--accent-warm)]" /> : <Music size={18} className="text-[var(--accent-warm)]" />}
            <h3 className="text-sm font-bold text-[var(--text-primary)]">
              {subTool === 'voice-gen' ? 'Voice Generator (Text to Speech)' : 'AI Soundtrack & Music Generator'}
            </h3>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">Voice AI Gateway Provider</label>
            <select
              value={provider}
              onChange={(e: any) => setProvider(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-default)] text-xs font-semibold text-[var(--text-primary)] cursor-pointer"
            >
              <option value="auto">Auto Failover (ElevenLabs → OpenAI TTS)</option>
              <option value="elevenlabs">ElevenLabs Multilingual v2</option>
              <option value="openai">OpenAI TTS-1 HD</option>
            </select>
          </div>

          {subTool === 'voice-gen' ? (
            <>
              <div>
                <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">Select Voice Model</label>
                <select
                  value={selectedVoice.id}
                  onChange={(e) => {
                    const v = VOICE_OPTIONS.find((voice) => voice.id === e.target.value);
                    if (v) setSelectedVoice(v);
                  }}
                  className="w-full p-2.5 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-default)] text-xs font-semibold text-[var(--text-primary)]"
                >
                  {VOICE_OPTIONS.map((v) => (
                    <option key={v.id} value={v.id}>{v.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">Script Text</label>
                <textarea
                  rows={4}
                  value={scriptText}
                  onChange={(e) => setScriptText(e.target.value)}
                  className="w-full p-3 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-default)] text-xs text-[var(--text-primary)] resize-none"
                />
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">Soundtrack Genre</label>
                <select
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-default)] text-xs font-semibold text-[var(--text-primary)]"
                >
                  {['Lo-Fi Chill Hop', 'Cinematic Orchestral', 'Upbeat Electronic Synth', 'Ambient Background'].map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold text-[var(--text-primary)] mb-1">
                  <span>Tempo Speed</span>
                  <span className="font-mono">{bpm} BPM</span>
                </div>
                <input
                  type="range"
                  min="60"
                  max="140"
                  value={bpm}
                  onChange={(e) => setBpm(parseInt(e.target.value))}
                  className="w-full accent-[var(--accent-warm)] cursor-pointer"
                />
              </div>
            </>
          )}

          <button
            onClick={handleGenerate}
            disabled={isGenerating || !scriptText.trim()}
            className="w-full py-3 rounded-xl bg-[var(--accent-warm)] text-white text-xs font-bold shadow-md hover:opacity-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isGenerating ? <RefreshCw size={16} className="animate-spin" /> : <Sparkles size={16} />}
            <span>Synthesize Audio Track (10 credits)</span>
          </button>
        </div>
      </div>

      <div className="lg:col-span-7 space-y-4">
        <div className="surface-card p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
            <span className="text-xs font-bold text-[var(--text-primary)]">Audio Gateway Sandbox</span>
            {telemetry?.provider && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--accent-warm-light)] text-[var(--accent-warm-text)] font-bold flex items-center gap-1">
                <Bot size={12} /> {telemetry.provider.toUpperCase()} ({telemetry.latency}ms)
              </span>
            )}
          </div>

          {errorInfo ? (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-center space-y-2 max-w-md mx-auto font-mono">
              <AlertTriangle size={24} className="text-rose-400 mx-auto" />
              <div className="text-xs font-bold text-rose-300">Provider Error ({errorInfo.provider})</div>
              <p className="text-[11px] text-rose-200">{errorInfo.message}</p>
            </div>
          ) : (
            <div className="p-6 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-default)] space-y-4 text-center">
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={togglePlayback}
                  disabled={!audioSrc}
                  className="p-4 rounded-full bg-[var(--accent-warm)] text-white shadow-lg hover:scale-105 transition-transform cursor-pointer disabled:opacity-40"
                >
                  {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                </button>
                <div className="text-left">
                  <div className="text-xs font-bold text-[var(--text-primary)]">
                    {subTool === 'voice-gen' ? selectedVoice.name : `${genre} (${bpm} BPM)`}
                  </div>
                  <div className="text-[10px] font-mono text-[var(--text-tertiary)]">
                    {audioSrc ? 'Ready for playback • 48kHz HD' : 'No audio synthesized yet'}
                  </div>
                </div>
              </div>

              {audioSrc && (
                <audio
                  ref={audioRef}
                  src={audioSrc}
                  onEnded={() => setIsPlaying(false)}
                  className="hidden"
                />
              )}

              <div className="flex items-end justify-center gap-1 h-12 pt-2">
                {[30, 60, 45, 90, 75, 40, 85, 95, 60, 40, 80, 50, 90, 65, 30].map((h, i) => (
                  <div
                    key={i}
                    className="w-1.5 bg-[var(--accent-warm)] rounded-full transition-all duration-150"
                    style={{ height: isPlaying ? `${Math.floor(Math.random() * 60) + 20}%` : audioSrc ? `${h}%` : '15%' }}
                  />
                ))}
              </div>
            </div>
          )}

          {audioSrc && (
            <div className="flex justify-end gap-2 pt-2">
              <a
                href={audioSrc}
                download="synthesized_voice.mp3"
                className="px-4 py-2 rounded-xl bg-[var(--accent-warm)] text-white text-xs font-bold shadow-md hover:opacity-95 flex items-center gap-1.5 cursor-pointer"
              >
                <Download size={14} /> Download Audio
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
