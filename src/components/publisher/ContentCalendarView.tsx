'use client';

import React, { useState } from 'react';
import { ScheduledPost } from '../../lib/mockDataPublisher';
import { SocialIcons } from '../common/SocialIcons';
import { Calendar as CalendarIcon, List, Clock, Plus, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export interface ContentCalendarViewProps {
  posts: ScheduledPost[];
  onOpenComposer: () => void;
}

export const ContentCalendarView: React.FC<ContentCalendarViewProps> = ({ posts, onOpenComposer }) => {
  const { showToast } = useAuth();
  const [viewMode, setViewMode] = useState<'calendar' | 'queue'>('calendar');

  const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="surface-card p-6 space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-2">
          <CalendarIcon size={18} className="text-[var(--accent-warm)]" />
          <h3 className="text-sm font-bold text-[var(--text-primary)]">July 2026 Content Schedule</h3>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('calendar')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
              viewMode === 'calendar' ? 'bg-[var(--accent-warm)] text-white' : 'bg-[var(--bg-muted)] text-[var(--text-secondary)]'
            }`}
          >
            <CalendarIcon size={14} /> Monthly Calendar
          </button>
          <button
            onClick={() => setViewMode('queue')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
              viewMode === 'queue' ? 'bg-[var(--accent-warm)] text-white' : 'bg-[var(--bg-muted)] text-[var(--text-secondary)]'
            }`}
          >
            <List size={14} /> Publishing Queue
          </button>
        </div>
      </div>

      {viewMode === 'calendar' ? (
        <div className="space-y-2">
          <div className="grid grid-cols-7 gap-2 text-center font-mono text-xs font-bold text-[var(--text-secondary)] py-1">
            {DAYS.map((d) => (
              <div key={d}>{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 31 }).map((_, idx) => {
              const dayNum = idx + 1;
              const dateStr = `2026-07-${dayNum.toString().padStart(2, '0')}`;
              const dayPosts = posts.filter((p) => p.scheduledTime.startsWith(dateStr));

              return (
                <div
                  key={dayNum}
                  onClick={onOpenComposer}
                  className="min-h-[100px] p-2 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-default)] hover:border-[var(--accent-warm)] transition-all space-y-1 cursor-pointer group relative"
                >
                  <div className="text-[11px] font-bold text-[var(--text-primary)] font-mono flex items-center justify-between">
                    <span>{dayNum}</span>
                    <Plus size={12} className="opacity-0 group-hover:opacity-100 text-[var(--accent-warm)]" />
                  </div>

                  {dayPosts.map((post) => (
                    <div
                      key={post.id}
                      onClick={(e) => { e.stopPropagation(); showToast(`Selected post: ${post.caption.slice(0, 20)}...`); }}
                      className="p-1.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-1 shadow-xs hover:border-[var(--border-strong)]"
                    >
                      <div className="flex items-center gap-1 overflow-x-auto">
                        {post.platforms.map((plat) => (
                          <div key={plat} className="w-3.5 h-3.5 shrink-0">
                            <SocialIcons platform={plat as any} />
                          </div>
                        ))}
                      </div>
                      <div className="text-[10px] font-bold text-[var(--text-primary)] truncate">{post.caption}</div>
                      <div className="text-[9px] font-mono text-[var(--text-tertiary)]">{post.scheduledTime.split(' ')[1]}</div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <div key={post.id} className="p-4 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-default)] flex items-center justify-between gap-4 text-xs">
              <div className="flex items-center gap-3">
                {post.mediaUrl && (
                  <img src={post.mediaUrl} alt="Cover" className="w-12 h-12 rounded-lg object-cover border border-[var(--border-subtle)]" />
                )}
                <div>
                  <div className="font-bold text-[var(--text-primary)]">{post.caption}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex items-center gap-1">
                      {post.platforms.map((plat) => (
                        <div key={plat} className="w-3.5 h-3.5">
                          <SocialIcons platform={plat as any} />
                        </div>
                      ))}
                    </div>
                    <span className="text-[10px] font-mono text-[var(--text-tertiary)]">• {post.scheduledTime}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold font-mono px-2.5 py-0.5 rounded bg-[var(--accent-warm-light)] text-[var(--accent-warm-text)]">
                  {post.status.toUpperCase()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
