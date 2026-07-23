'use client';

import React from 'react';
import { SUPPORT_TICKETS } from '../../lib/mockDataAdmin';
import { LifeBuoy, ShieldAlert, CheckCircle2, MessageSquare } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const SupportModerationView = () => {
  const { showToast } = useAuth();

  return (
    <div className="surface-card p-6 space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-2">
          <LifeBuoy size={18} className="text-[var(--accent-warm)]" />
          <h3 className="text-sm font-bold text-[var(--text-primary)]">Helpdesk Support Tickets & AI Moderation Queue</h3>
        </div>
      </div>

      <div className="space-y-3">
        {SUPPORT_TICKETS.map((ticket) => (
          <div key={ticket.id} className="p-4 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-default)] flex items-center justify-between gap-4 text-xs">
            <div>
              <div className="font-bold text-[var(--text-primary)]">{ticket.subject}</div>
              <div className="text-[10px] font-mono text-[var(--text-tertiary)]">User: {ticket.user} • Priority: {ticket.priority.toUpperCase()} • {ticket.createdAt}</div>
            </div>

            <div className="flex items-center gap-2">
              <button onClick={() => showToast(`Resolved ticket #${ticket.id}`)} className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-bold cursor-pointer hover:opacity-90 flex items-center gap-1">
                <CheckCircle2 size={12} /> Resolve Ticket
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
