'use client';

import React, { useState, useEffect } from 'react';
import { Cpu, RefreshCw, XCircle, Play, Layers } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const QueueManager = () => {
  const { showToast } = useAuth();
  const [jobs, setJobs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchJobs = async () => {
    try {
      const res = await fetch('/api/queues');
      const data = await res.json();
      if (data.success) {
        setJobs(data.jobs || []);
      }
    } catch (err) {
      console.error('Error loading queues:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
    const interval = setInterval(fetchJobs, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleCancel = async (jobId: string) => {
    try {
      await fetch(`/api/queues?jobId=${jobId}`, { method: 'DELETE' });
      showToast(`Cancelled queue job ${jobId}`);
      fetchJobs();
    } catch (err) {
      showToast('Failed to cancel job');
    }
  };

  const activeCount = jobs.filter((j) => j.status === 'active').length;
  const queuedCount = jobs.filter((j) => j.status === 'queued').length;

  return (
    <div className="surface-card p-6 space-y-4 font-sans text-slate-100">
      <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-2">
          <Cpu size={18} className="text-purple-400" />
          <h3 className="text-sm font-extrabold text-[var(--text-primary)]">BullMQ GPU Queue Manager</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-[var(--text-secondary)]">
            {activeCount} Active • {queuedCount} Queued
          </span>
          <button onClick={fetchJobs} className="p-1 text-slate-400 hover:text-purple-400 cursor-pointer">
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {jobs.length === 0 ? (
          <div className="p-6 text-center text-xs font-mono text-slate-400">
            No active BullMQ queue jobs running.
          </div>
        ) : (
          jobs.slice(0, 5).map((job) => (
            <div key={job.id} className="p-3.5 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-default)] space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-bold text-[var(--text-primary)]">{job.name}</div>
                  <div className="text-[10px] font-mono text-[var(--text-tertiary)] uppercase">
                    {job.queueName.replace('-', ' ')} • Priority P{job.priority} • Retries: {job.attemptsMade}/{job.maxRetries}
                  </div>
                </div>
                {job.status !== 'completed' && job.status !== 'cancelled' && (
                  <button onClick={() => handleCancel(job.id)} className="p-1 text-slate-400 hover:text-rose-400 cursor-pointer">
                    <XCircle size={16} />
                  </button>
                )}
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-mono text-slate-400">
                  <span className="capitalize">{job.status}</span>
                  <span>{job.progress}%</span>
                </div>
                <div className="w-full bg-[var(--border-default)] h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      job.status === 'completed' ? 'bg-emerald-400' : 'bg-purple-400'
                    }`}
                    style={{ width: `${job.progress}%` }}
                  />
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
