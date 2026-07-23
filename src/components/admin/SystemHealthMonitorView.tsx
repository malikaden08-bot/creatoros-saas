'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RotateCw,
  Clock,
  Zap,
  Key,
  Database,
  Server,
  Cloud,
  Sparkles,
  Layers,
  Cpu,
  Volume2,
  FileText,
  ShieldAlert
} from 'lucide-react';

export interface ServiceHealthItem {
  id: string;
  name: string;
  category: 'infrastructure' | 'ai_provider';
  configured: boolean;
  healthy: boolean;
  latency: number | null;
  lastChecked: string;
  status: 'operational' | 'degraded' | 'unconfigured' | 'offline';
  environmentError: string | null;
  quota?: {
    used?: number;
    limit?: number;
    unit?: string;
    description?: string;
  } | null;
}

export interface HealthApiResponse {
  overallStatus: 'healthy' | 'partially_degraded' | 'critical';
  service: string;
  version: string;
  timestamp: string;
  uptimeSeconds: number;
  summary: {
    totalCount: number;
    configuredCount: number;
    healthyCount: number;
    operationalCount: number;
    unconfiguredCount: number;
    degradedCount: number;
  };
  environmentErrors: string[];
  items: ServiceHealthItem[];
}

const REFRESH_INTERVAL_SECONDS = 30;

export const SystemHealthMonitorView: React.FC = () => {
  const [data, setData] = useState<HealthApiResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [countdown, setCountdown] = useState<number>(REFRESH_INTERVAL_SECONDS);
  const [activeTab, setActiveTab] = useState<'all' | 'infrastructure' | 'ai_provider' | 'errors'>('all');
  const [lastUpdatedTime, setLastUpdatedTime] = useState<string>('');

  const fetchHealthData = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const res = await fetch('/api/health', { cache: 'no-store' });
      const json: HealthApiResponse = await res.json();
      setData(json);
      setLastUpdatedTime(new Date().toLocaleTimeString());
      setCountdown(REFRESH_INTERVAL_SECONDS);
    } catch (err) {
      console.error('Failed to fetch system health data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchHealthData();
  }, [fetchHealthData]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          fetchHealthData();
          return REFRESH_INTERVAL_SECONDS;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [fetchHealthData]);

  const getServiceIcon = (id: string) => {
    switch (id) {
      case 'database':
        return <Database className="w-5 h-5 text-cyan-400" />;
      case 'redis':
        return <Server className="w-5 h-5 text-indigo-400" />;
      case 'cloudinary':
        return <Cloud className="w-5 h-5 text-blue-400" />;
      case 'openai':
        return <Sparkles className="w-5 h-5 text-emerald-400" />;
      case 'gemini':
        return <Cpu className="w-5 h-5 text-amber-400" />;
      case 'claude':
        return <Layers className="w-5 h-5 text-purple-400" />;
      case 'groq':
        return <Zap className="w-5 h-5 text-amber-500" />;
      case 'fal':
        return <Sparkles className="w-5 h-5 text-pink-400" />;
      case 'replicate':
        return <Layers className="w-5 h-5 text-rose-400" />;
      case 'elevenlabs':
        return <Volume2 className="w-5 h-5 text-teal-400" />;
      case 'deepgram':
        return <FileText className="w-5 h-5 text-sky-400" />;
      default:
        return <Activity className="w-5 h-5 text-slate-400" />;
    }
  };

  const getStatusBadge = (status: ServiceHealthItem['status']) => {
    switch (status) {
      case 'operational':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
            Operational
          </span>
        );
      case 'degraded':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
            Degraded
          </span>
        );
      case 'unconfigured':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <span className="w-2 h-2 rounded-full bg-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.8)]" />
            Unconfigured
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20">
            <span className="w-2 h-2 rounded-full bg-red-400" />
            Offline
          </span>
        );
    }
  };

  const items = data?.items || [];
  const filteredItems = items.filter((item) => {
    if (activeTab === 'infrastructure') return item.category === 'infrastructure';
    if (activeTab === 'ai_provider') return item.category === 'ai_provider';
    if (activeTab === 'errors') return !item.healthy || !item.configured;
    return true;
  });

  const progressPercent = Math.round(((REFRESH_INTERVAL_SECONDS - countdown) / REFRESH_INTERVAL_SECONDS) * 100);

  return (
    <div className="space-y-8 text-slate-100 font-sans">
      <div className="bg-[#111625]/90 border border-[#1f293d] backdrop-blur-xl rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                System Telemetry Engine v3.0
              </span>
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> Updated: {lastUpdatedTime || 'Loading...'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
              AI Infrastructure & Provider Status
            </h1>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              Real-time latency, environment key validation, sliding-window rate limits, and quota tracking across 11 core CreatorOS micro-services.
            </p>
          </div>

          <div className="flex items-center gap-4 bg-[#0a0d14]/80 p-3.5 rounded-xl border border-[#1e293b]">
            <div className="text-right">
              <div className="text-xs text-slate-400 font-medium">Auto Refresh In</div>
              <div className="text-lg font-bold text-cyan-400 font-mono flex items-center justify-end gap-1">
                <span>{countdown}s</span>
              </div>
            </div>

            <div className="relative w-10 h-10 flex items-center justify-center">
              <svg className="w-10 h-10 transform -rotate-90">
                <circle
                  cx="20"
                  cy="20"
                  r="16"
                  stroke="currentColor"
                  strokeWidth="3"
                  className="text-slate-800"
                  fill="transparent"
                />
                <circle
                  cx="20"
                  cy="20"
                  r="16"
                  stroke="currentColor"
                  strokeWidth="3"
                  className="text-cyan-400 transition-all duration-1000"
                  fill="transparent"
                  strokeDasharray={100}
                  strokeDashoffset={100 - progressPercent}
                />
              </svg>
            </div>

            <button
              onClick={() => fetchHealthData(true)}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-all shadow-lg shadow-cyan-500/20 active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <RotateCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-6 border-t border-[#1e293b]">
          <div className="bg-[#0b0f19]/80 p-4 rounded-xl border border-[#1e293b]">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Overall Status</div>
            <div className="flex items-center gap-2 font-bold text-lg">
              {data?.overallStatus === 'healthy' ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <span className="text-emerald-400">100% Operational</span>
                </>
              ) : data?.overallStatus === 'partially_degraded' ? (
                <>
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                  <span className="text-amber-400">Partially Degraded</span>
                </>
              ) : (
                <>
                  <XCircle className="w-5 h-5 text-rose-400" />
                  <span className="text-rose-400">Critical Issues</span>
                </>
              )}
            </div>
          </div>

          <div className="bg-[#0b0f19]/80 p-4 rounded-xl border border-[#1e293b]">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Active Services</div>
            <div className="text-lg font-bold text-slate-100 font-mono">
              <span className="text-emerald-400">{data?.summary.operationalCount ?? 0}</span>
              <span className="text-slate-500"> / {data?.summary.totalCount ?? 11}</span>
            </div>
          </div>

          <div className="bg-[#0b0f19]/80 p-4 rounded-xl border border-[#1e293b]">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Environment Keys</div>
            <div className="text-lg font-bold text-slate-100 font-mono">
              <span className="text-cyan-400">{data?.summary.configuredCount ?? 0}</span>
              <span className="text-slate-500"> Valid</span>
            </div>
          </div>

          <div className="bg-[#0b0f19]/80 p-4 rounded-xl border border-[#1e293b]">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">System Uptime</div>
            <div className="text-lg font-bold text-purple-400 font-mono">
              {Math.floor((data?.uptimeSeconds ?? 0) / 3600)}h {Math.floor(((data?.uptimeSeconds ?? 0) % 3600) / 60)}m
            </div>
          </div>
        </div>
      </div>

      {data && data.environmentErrors.length > 0 && (
        <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-5 backdrop-blur-lg">
          <div className="flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-rose-400 mt-0.5 shrink-0" />
            <div className="flex-1">
              <h3 className="text-sm font-bold text-rose-300">
                Environment Validation Errors ({data.environmentErrors.length})
              </h3>
              <p className="text-xs text-rose-400/80 mt-0.5">
                The following API keys or connection URLs are unconfigured or using placeholder values. Associated features will automatically failover to alternative providers.
              </p>

              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2">
                {data.environmentErrors.map((err, idx) => (
                  <div key={idx} className="flex items-center gap-2 bg-[#0d0a12]/80 px-3 py-2 rounded-lg text-xs font-mono text-rose-200 border border-rose-500/20">
                    <Key className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    <span className="truncate">{err}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between border-b border-[#1f293d] pb-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'all'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'bg-[#111625] text-slate-400 hover:text-slate-200 hover:bg-[#161c2e]'
            }`}
          >
            All Services ({items.length})
          </button>
          <button
            onClick={() => setActiveTab('infrastructure')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'infrastructure'
                ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/30'
                : 'bg-[#111625] text-slate-400 hover:text-slate-200 hover:bg-[#161c2e]'
            }`}
          >
            Infrastructure (3)
          </button>
          <button
            onClick={() => setActiveTab('ai_provider')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'ai_provider'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                : 'bg-[#111625] text-slate-400 hover:text-slate-200 hover:bg-[#161c2e]'
            }`}
          >
            AI Providers (8)
          </button>
          <button
            onClick={() => setActiveTab('errors')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'errors'
                ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30'
                : 'bg-[#111625] text-slate-400 hover:text-slate-200 hover:bg-[#161c2e]'
            }`}
          >
            Warnings & Errors ({items.filter((i) => !i.healthy || !i.configured).length})
          </button>
        </div>

        <div className="text-xs text-slate-400 hidden sm:block">
          Showing <span className="font-bold text-slate-200">{filteredItems.length}</span> of {items.length} monitored nodes
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-56 bg-[#111625]/60 rounded-2xl border border-[#1f293d] animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((service) => {
            const usageRatio = service.quota && service.quota.limit ? (service.quota.used || 0) / service.quota.limit : 0;
            const usagePercent = Math.min(Math.round(usageRatio * 100), 100);

            return (
              <div
                key={service.id}
                className="bg-[#111625]/90 border border-[#1f293d] hover:border-slate-600/50 backdrop-blur-xl rounded-2xl p-6 shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-xl bg-[#0b0f19] border border-[#1f293d] group-hover:scale-105 transition-transform">
                        {getServiceIcon(service.id)}
                      </div>
                      <div>
                        <h3 className="font-bold text-base text-slate-100 group-hover:text-cyan-300 transition-colors">
                          {service.name}
                        </h3>
                        <span className="text-[11px] font-semibold tracking-wide uppercase text-slate-400">
                          {service.category === 'infrastructure' ? 'Core Infra' : 'AI Engine'}
                        </span>
                      </div>
                    </div>
                    {getStatusBadge(service.status)}
                  </div>

                  {service.environmentError && (
                    <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                      <span>{service.environmentError}</span>
                    </div>
                  )}

                  {service.quota && (
                    <div className="my-4 pt-3 border-t border-[#1f293d]/60">
                      <div className="flex justify-between items-center text-xs mb-1.5">
                        <span className="text-slate-400 font-medium">Quota / Usage</span>
                        <span className="font-mono text-slate-200 font-bold">
                          {(service.quota.used || 0).toLocaleString()} / {(service.quota.limit || 0).toLocaleString()} {service.quota.unit || ''}
                        </span>
                      </div>
                      <div className="w-full bg-[#0a0d14] h-2 rounded-full overflow-hidden p-0.5 border border-[#1e293b]">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            usagePercent > 85 ? 'bg-rose-500' : usagePercent > 60 ? 'bg-amber-500' : 'bg-cyan-400'
                          }`}
                          style={{ width: `${usagePercent}%` }}
                        />
                      </div>
                      {service.quota.description && (
                        <div className="text-[11px] text-slate-400 mt-1">
                          {service.quota.description}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-[#1f293d] flex items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center gap-1.5 font-mono">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    <span>Latency:</span>
                    <span className={`font-bold ${service.latency && service.latency < 200 ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {service.latency !== null ? `${service.latency} ms` : 'N/A'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>Checked live</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
