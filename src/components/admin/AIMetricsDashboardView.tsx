'use client';

import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  Download,
  RefreshCw,
  Zap,
  DollarSign,
  Clock,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Coins,
  Cpu,
  Calendar
} from 'lucide-react';
import { AIMetricsSummary, ProviderBreakdown } from '../../services/ai-metrics';

export const AIMetricsDashboardView: React.FC = () => {
  const [metrics, setMetrics] = useState<AIMetricsSummary | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [timeframe, setTimeframe] = useState<'daily' | 'monthly'>('daily');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchMetrics = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/ai/metrics');
      const data = await res.json();
      if (data.success && data.summary) {
        setMetrics(data.summary);
      } else {
        throw new Error(data.message || 'Failed to fetch AI metrics');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error loading AI metrics');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  const handleExportCsv = () => {
    window.open('/api/ai/metrics?format=csv', '_blank');
  };

  if (isLoading) {
    return (
      <div className="py-20 text-center space-y-3 font-mono text-xs text-slate-400">
        <RefreshCw size={28} className="animate-spin text-cyan-400 mx-auto" />
        <div>Fetching Real-Time AI Metrics & Provider Telemetry...</div>
      </div>
    );
  }

  if (errorMsg || !metrics) {
    return (
      <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-center space-y-3 font-mono">
        <AlertTriangle size={32} className="text-rose-400 mx-auto" />
        <div className="text-sm font-bold text-rose-300">Metrics Load Error</div>
        <p className="text-xs text-rose-200">{errorMsg || 'Unable to render metrics'}</p>
        <button
          onClick={fetchMetrics}
          className="px-4 py-2 rounded-xl bg-rose-500/20 text-rose-300 text-xs font-bold hover:bg-rose-500/30 cursor-pointer"
        >
          Retry Load
        </button>
      </div>
    );
  }

  const maxDailyVal = Math.max(...metrics.dailyUsage.map((d) => d.requests), 1);
  const maxMonthlyVal = Math.max(...metrics.monthlyUsage.map((m) => m.requests), 1);

  return (
    <div className="space-y-6 text-slate-100 font-sans">
      <div className="surface-card p-5 rounded-2xl border border-[var(--border-subtle)] flex flex-wrap items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <BarChart3 size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-extrabold text-[var(--text-primary)]">AI Telemetry & Usage Metrics</h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Live Telemetry
              </span>
            </div>
            <p className="text-xs text-[var(--text-secondary)]">
              Multi-provider requests, token consumption, latency, credit usage, and financial cost tracking.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchMetrics}
            className="p-2.5 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-default)] text-[var(--text-primary)] hover:border-cyan-500 cursor-pointer transition-colors"
            title="Refresh Metrics"
          >
            <RefreshCw size={16} />
          </button>

          <button
            onClick={handleExportCsv}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-400 hover:to-cyan-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 flex items-center gap-2 cursor-pointer transition-transform active:scale-95"
          >
            <Download size={15} />
            <span>Export Telemetry CSV</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="p-4 rounded-2xl bg-[#090d16] border border-[#1b253b] space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-[11px] font-mono font-bold uppercase">
            <span>Total Requests</span>
            <Zap size={14} className="text-cyan-400" />
          </div>
          <div className="text-xl font-extrabold text-slate-100">{metrics.totalRequests.toLocaleString()}</div>
          <div className="text-[10px] font-mono text-emerald-400">● {metrics.totalSuccess} Succeeded</div>
        </div>

        <div className="p-4 rounded-2xl bg-[#090d16] border border-[#1b253b] space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-[11px] font-mono font-bold uppercase">
            <span>Success Rate</span>
            <CheckCircle2 size={14} className="text-emerald-400" />
          </div>
          <div className="text-xl font-extrabold text-emerald-400">{metrics.overallSuccessRate}%</div>
          <div className="text-[10px] font-mono text-rose-400">{metrics.totalFailures} Failures Recorded</div>
        </div>

        <div className="p-4 rounded-2xl bg-[#090d16] border border-[#1b253b] space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-[11px] font-mono font-bold uppercase">
            <span>Total Tokens</span>
            <Cpu size={14} className="text-purple-400" />
          </div>
          <div className="text-xl font-extrabold text-purple-300">{(metrics.totalTokens / 1000000).toFixed(2)}M</div>
          <div className="text-[10px] font-mono text-slate-400">Prompt + Completion</div>
        </div>

        <div className="p-4 rounded-2xl bg-[#090d16] border border-[#1b253b] space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-[11px] font-mono font-bold uppercase">
            <span>Credits Used</span>
            <Coins size={14} className="text-amber-400" />
          </div>
          <div className="text-xl font-extrabold text-amber-400">{metrics.totalCreditsUsed.toLocaleString()}</div>
          <div className="text-[10px] font-mono text-slate-400">Account Balance Ledger</div>
        </div>

        <div className="p-4 rounded-2xl bg-[#090d16] border border-[#1b253b] space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-[11px] font-mono font-bold uppercase">
            <span>Avg Latency</span>
            <Clock size={14} className="text-cyan-400" />
          </div>
          <div className="text-xl font-extrabold text-cyan-400">{metrics.overallAvgLatencyMs} ms</div>
          <div className="text-[10px] font-mono text-slate-400">Round-trip average</div>
        </div>

        <div className="p-4 rounded-2xl bg-[#090d16] border border-[#1b253b] space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-[11px] font-mono font-bold uppercase">
            <span>Total Cost</span>
            <DollarSign size={14} className="text-emerald-400" />
          </div>
          <div className="text-xl font-extrabold text-emerald-400">${metrics.totalCostUsd.toFixed(2)}</div>
          <div className="text-[10px] font-mono text-slate-400">Financial API Usage</div>
        </div>
      </div>

      <div className="surface-card p-5 rounded-2xl border border-[var(--border-subtle)] space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
          <div className="flex items-center gap-2">
            <Calendar size={18} className="text-cyan-400" />
            <h3 className="text-sm font-extrabold text-slate-100">
              {timeframe === 'daily' ? '30-Day Daily Request Timeline' : '12-Month Usage History'}
            </h3>
          </div>

          <div className="flex items-center gap-1 bg-[#090d16] p-1 rounded-xl border border-[#1b253b] text-xs">
            <button
              onClick={() => setTimeframe('daily')}
              className={`px-3 py-1 rounded-lg font-mono font-bold cursor-pointer transition-colors ${
                timeframe === 'daily' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'text-slate-400'
              }`}
            >
              30 Days Daily
            </button>
            <button
              onClick={() => setTimeframe('monthly')}
              className={`px-3 py-1 rounded-lg font-mono font-bold cursor-pointer transition-colors ${
                timeframe === 'monthly' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : 'text-slate-400'
              }`}
            >
              12 Months
            </button>
          </div>
        </div>

        <div className="h-44 flex items-end justify-between gap-1.5 pt-4 px-2">
          {(timeframe === 'daily' ? metrics.dailyUsage : metrics.monthlyUsage).map((pt: any, idx) => {
            const req = pt.requests;
            const pct = Math.min(100, Math.max(10, Math.round((req / (timeframe === 'daily' ? maxDailyVal : maxMonthlyVal)) * 100)));
            const label = timeframe === 'daily' ? pt.date.slice(8) : pt.month.slice(5);

            return (
              <div key={idx} className="flex-1 flex flex-col items-center gap-1 group relative">
                <div className="absolute -top-10 hidden group-hover:flex flex-col items-center bg-slate-900 border border-slate-700 p-1.5 rounded text-[10px] font-mono text-cyan-300 z-20 whitespace-nowrap shadow-xl">
                  <span>{pt.date || pt.month}: {pt.requests} requests</span>
                  <span>Tokens: {(pt.tokens / 1000).toFixed(0)}k | ${pt.costUsd}</span>
                </div>

                <div
                  className={`w-full rounded-t-md transition-all duration-300 ${
                    timeframe === 'daily' ? 'bg-cyan-500/70 hover:bg-cyan-400' : 'bg-purple-500/70 hover:bg-purple-400'
                  }`}
                  style={{ height: `${pct}%` }}
                />
                <span className="text-[9px] font-mono text-slate-500 truncate">{label}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="surface-card p-5 rounded-2xl border border-[var(--border-subtle)] space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
          <div className="flex items-center gap-2">
            <Layers size={18} className="text-emerald-400" />
            <h3 className="text-sm font-extrabold text-slate-100">Provider Usage, Latency & Cost Breakdown</h3>
          </div>
          <span className="text-[10px] font-mono text-slate-400">All 8 AI Provider Matrix</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs font-mono">
            <thead>
              <tr className="border-b border-[#1b253b] text-slate-400 font-bold uppercase text-[10px]">
                <th className="py-2.5 px-3">Provider</th>
                <th className="py-2.5 px-3 text-right">Requests</th>
                <th className="py-2.5 px-3 text-right">Success Rate</th>
                <th className="py-2.5 px-3 text-right">Failures</th>
                <th className="py-2.5 px-3 text-right">Total Tokens</th>
                <th className="py-2.5 px-3 text-right">Credits Used</th>
                <th className="py-2.5 px-3 text-right">Avg Latency</th>
                <th className="py-2.5 px-3 text-right">Cost (USD)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#161f33]">
              {metrics.providers.map((p) => (
                <tr key={p.provider} className="hover:bg-slate-800/20 transition-colors">
                  <td className="py-3 px-3 font-bold text-slate-100">{p.provider}</td>
                  <td className="py-3 px-3 text-right font-extrabold text-cyan-400">{p.totalRequests.toLocaleString()}</td>
                  <td className="py-3 px-3 text-right font-bold text-emerald-400">{p.successRate}%</td>
                  <td className="py-3 px-3 text-right text-rose-400 font-bold">{p.failureCount}</td>
                  <td className="py-3 px-3 text-right text-slate-300">{p.totalTokens.toLocaleString()}</td>
                  <td className="py-3 px-3 text-right text-amber-400">{p.creditsUsed.toLocaleString()}</td>
                  <td className="py-3 px-3 text-right text-cyan-300">{p.avgLatencyMs} ms</td>
                  <td className="py-3 px-3 text-right font-bold text-emerald-400">${p.costUsd.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
