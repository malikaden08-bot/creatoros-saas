'use client';

import React, { useState, useEffect } from 'react';
import {
  Cpu,
  Layers,
  RefreshCw,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Zap,
  Play,
  XCircle,
  Sliders,
  Mail,
  FileText,
  Image as ImageIcon,
  Video,
  Subtitles,
  Sparkles
} from 'lucide-react';
import { QueueName, QUEUE_NAMES, QUEUE_CONFIGS, UnifiedJobSnapshot } from '../../lib/queue/types';

export const QueueManagerDashboardView: React.FC = () => {
  const [selectedQueue, setSelectedQueue] = useState<QueueName | 'all'>('all');
  const [jobs, setJobs] = useState<UnifiedJobSnapshot[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [isDispatchOpen, setIsDispatchOpen] = useState<boolean>(false);
  const [dispatchQueue, setDispatchQueue] = useState<QueueName>('image-generation');
  const [jobName, setJobName] = useState<string>('Batch Task Processing');
  const [priority, setPriority] = useState<number>(2);
  const [retries, setRetries] = useState<number>(3);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const fetchQueueData = async () => {
    setIsLoading(true);
    try {
      const url = selectedQueue !== 'all' ? `/api/queues?queueName=${selectedQueue}` : '/api/queues';
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setMetrics(data.metrics);
        setJobs(data.jobs || []);
      }
    } catch (err) {
      console.error('Failed to fetch queues:', err);
    } fontally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQueueData();
    const interval = setInterval(fetchQueueData, 4000);
    return () => clearInterval(interval);
  }, [selectedQueue]);

  const handleDispatchJob = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/queues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          queueName: dispatchQueue,
          jobName,
          priority,
          retries,
          data: { timestamp: new Date().toISOString() }
        })
      });
      const data = await res.json();
      if (data.success) {
        setIsDispatchOpen(false);
        fetchQueueData();
      }
    } catch (err) {
      console.error('Error dispatching job:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelJob = async (jobId: string) => {
    try {
      await fetch(`/api/queues?jobId=${jobId}`, { method: 'DELETE' });
      fetchQueueData();
    } catch (err) {
      console.error('Error cancelling job:', err);
    }
  };

  const getQueueIcon = (name: QueueName) => {
    switch (name) {
      case 'image-generation': return <ImageIcon size={16} className="text-cyan-400" />;
      case 'video-generation': return <Video size={16} className="text-purple-400" />;
      case 'subtitle-generation': return <Subtitles size={16} className="text-amber-400" />;
      case 'seo-jobs': return <FileText size={16} className="text-emerald-400" />;
      case 'thumbnail-jobs': return <Sparkles size={16} className="text-pink-400" />;
      case 'email-jobs': return <Mail size={16} className="text-indigo-400" />;
    }
  };

  return (
    <div className="space-y-6 text-slate-100 font-sans">
      <div className="surface-card p-5 rounded-2xl border border-[var(--border-subtle)] flex flex-wrap items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Cpu size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-extrabold text-[var(--text-primary)]">BullMQ Queue Manager</h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                6 Worker Queues
              </span>
            </div>
            <p className="text-xs text-[var(--text-secondary)]">
              Parallel asynchronous task processing with exponential retries, priorities, progress, and cancellation.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchQueueData}
            className="p-2.5 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-default)] text-[var(--text-primary)] hover:border-purple-500 cursor-pointer transition-colors"
            title="Refresh Queues"
          >
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
          </button>

          <button
            onClick={() => setIsDispatchOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-400 hover:to-indigo-400 text-white font-bold text-xs shadow-lg shadow-purple-500/20 flex items-center gap-2 cursor-pointer transition-transform active:scale-95"
          >
            <Plus size={15} />
            <span>Dispatch New Job</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div
          onClick={() => setSelectedQueue('all')}
          className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
            selectedQueue === 'all'
              ? 'bg-purple-500/15 border-purple-500/50 shadow-lg shadow-purple-500/10'
              : 'bg-[#090d16] border-[#1b253b] hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-bold text-slate-300">
            <span>All Queues</span>
            <Layers size={14} className="text-purple-400" />
          </div>
          <div className="text-lg font-extrabold text-slate-100 mt-2">{jobs.length}</div>
          <div className="text-[10px] font-mono text-slate-400 mt-0.5">Global Buffer</div>
        </div>

        {QUEUE_NAMES.map((qName) => {
          const config = QUEUE_CONFIGS[qName];
          const qMetric = metrics?.[qName];
          const isSelected = selectedQueue === qName;

          return (
            <div
              key={qName}
              onClick={() => setSelectedQueue(qName)}
              className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                isSelected
                  ? 'bg-purple-500/15 border-purple-500/50 shadow-lg shadow-purple-500/10'
                  : 'bg-[#090d16] border-[#1b253b] hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between text-xs font-bold text-slate-200">
                <span className="truncate">{config.displayName}</span>
                {getQueueIcon(qName)}
              </div>

              <div className="flex items-baseline justify-between mt-2">
                <span className="text-lg font-extrabold text-slate-100">{qMetric?.activeCount || 0}</span>
                <span className="text-[10px] font-mono text-emerald-400">● {qMetric?.concurrency || config.concurrency} Workers</span>
              </div>

              <div className="text-[10px] font-mono text-slate-400 flex items-center justify-between mt-1 pt-1 border-t border-slate-800">
                <span>Queued: {qMetric?.queuedCount || 0}</span>
                <span>Done: {qMetric?.completedCount || 0}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="surface-card p-5 rounded-2xl border border-[var(--border-subtle)] space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
          <div className="flex items-center gap-2">
            <Layers size={18} className="text-purple-400" />
            <h3 className="text-sm font-extrabold text-slate-100">
              {selectedQueue === 'all' ? 'All Queue Jobs' : `${QUEUE_CONFIGS[selectedQueue].displayName} Jobs`}
            </h3>
          </div>
          <span className="text-[10px] font-mono text-slate-400">Retries & Concurrency Engine Active</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs font-mono">
            <thead>
              <tr className="border-b border-[#1b253b] text-slate-400 font-bold uppercase text-[10px]">
                <th className="py-2.5 px-3">Job ID</th>
                <th className="py-2.5 px-3">Name</th>
                <th className="py-2.5 px-3">Queue</th>
                <th className="py-2.5 px-3">Priority</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Progress</th>
                <th className="py-2.5 px-3">Retries</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#161f33]">
              {jobs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500 font-mono text-xs">
                    No active or queued jobs found in selected filter.
                  </td>
                </tr>
              ) : (
                jobs.map((job) => (
                  <tr key={job.id} className="hover:bg-slate-800/20 transition-colors">
                    <td className="py-3 px-3 font-bold text-slate-300">{job.id}</td>
                    <td className="py-3 px-3 font-extrabold text-slate-100">{job.name}</td>
                    <td className="py-3 px-3 flex items-center gap-1.5 text-slate-300">
                      {getQueueIcon(job.queueName)}
                      <span className="capitalize">{job.queueName.replace('-', ' ')}</span>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          job.priority === 1
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : job.priority === 2
                            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                            : 'bg-slate-500/20 text-slate-300 border border-slate-500/30'
                        }`}
                      >
                        {job.priority === 1 ? 'High' : job.priority === 2 ? 'Normal' : 'Low'}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          job.status === 'completed'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : job.status === 'active'
                            ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20 animate-pulse'
                            : job.status === 'queued'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}
                      >
                        ● {job.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-3 min-w-[140px]">
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-mono text-slate-400">
                          <span>{job.progress}%</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 ${
                              job.status === 'completed' ? 'bg-emerald-400' : 'bg-purple-400'
                            }`}
                            style={{ width: `${job.progress}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-slate-400">
                      {job.attemptsMade} / {job.maxRetries}
                    </td>
                    <td className="py-3 px-3 text-right">
                      {job.status !== 'completed' && job.status !== 'cancelled' && (
                        <button
                          onClick={() => handleCancelJob(job.id)}
                          className="px-2.5 py-1 rounded bg-rose-500/15 text-rose-300 hover:bg-rose-500/30 text-[10px] font-bold flex items-center gap-1 ml-auto cursor-pointer"
                        >
                          <XCircle size={12} />
                          Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isDispatchOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="surface-card w-full max-w-md p-6 rounded-2xl border border-[var(--border-subtle)] space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
              <h3 className="text-sm font-extrabold text-slate-100 flex items-center gap-2">
                <Plus size={16} className="text-purple-400" />
                Dispatch New BullMQ Job
              </h3>
              <button
                onClick={() => setIsDispatchOpen(false)}
                className="text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleDispatchJob} className="space-y-4 text-xs font-sans">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Target Queue</label>
                <select
                  value={dispatchQueue}
                  onChange={(e) => setDispatchQueue(e.target.value as QueueName)}
                  className="w-full p-2.5 rounded-xl bg-[#090d16] border border-[#1b253b] text-slate-100 font-mono focus:border-purple-500"
                >
                  {QUEUE_NAMES.map((q) => (
                    <option key={q} value={q}>
                      {QUEUE_CONFIGS[q].displayName} (Concurrency: {QUEUE_CONFIGS[q].concurrency})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Job Name</label>
                <input
                  type="text"
                  value={jobName}
                  onChange={(e) => setJobName(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[#090d16] border border-[#1b253b] text-slate-100 font-mono focus:border-purple-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl bg-[#090d16] border border-[#1b253b] text-slate-100 font-mono"
                  >
                    <option value={1}>1 - High Priority</option>
                    <option value={2}>2 - Normal Priority</option>
                    <option value={3}>3 - Low Priority</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Max Retries</label>
                  <input
                    type="number"
                    value={retries}
                    onChange={(e) => setRetries(Number(e.target.value))}
                    min={1}
                    max={10}
                    className="w-full p-2.5 rounded-xl bg-[#090d16] border border-[#1b253b] text-slate-100 font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsDispatchOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold hover:bg-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-purple-500 hover:bg-purple-400 text-white font-bold cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Dispatching...' : 'Dispatch Job'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
