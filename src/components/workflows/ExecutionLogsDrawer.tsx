'use client';

import React from 'react';
import { EXECUTION_LOGS_HISTORY } from '../../lib/mockDataWorkflows';
import { Terminal, CheckCircle2, AlertCircle, Clock, ChevronUp } from 'lucide-react';

export const ExecutionLogsDrawer: React.FC<{
  isOpen: boolean;
  onClose: () => void;
}> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="h-48 bg-[var(--bg-surface)] border-t border-[var(--border-default)] flex flex-col shrink-0 select-none overflow-hidden z-20">
      <div className="h-9 bg-[var(--bg-muted)] border-b border-[var(--border-subtle)] px-4 flex items-center justify-between">
        <div className="flex items-center gap-2 font-mono text-xs font-bold text-[var(--text-primary)]">
          <Terminal size={14} className="text-amber-500" />
          <span>Debug Console & Execution History</span>
        </div>
        <button onClick={onClose} className="p-1 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] cursor-pointer">
          <ChevronUp size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2 font-mono text-xs">
        {EXECUTION_LOGS_HISTORY.map((log) => (
          <div key={log.id} className="p-2.5 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-default)] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              {log.status === 'success' ? (
                <CheckCircle2 size={14} className="text-emerald-500" />
              ) : (
                <AlertCircle size={14} className="text-red-500" />
              )}
              <span className="font-bold text-[var(--text-primary)]">{log.id}</span>
              <span className="text-[var(--text-secondary)] font-normal">{log.stepsCount} steps executed</span>
              {log.error && <span className="text-red-500 font-normal">({log.error})</span>}
            </div>

            <div className="flex items-center gap-3 text-[10px] text-[var(--text-tertiary)]">
              <span>{log.durationMs}ms</span>
              <span>•</span>
              <span>{log.timestamp}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
