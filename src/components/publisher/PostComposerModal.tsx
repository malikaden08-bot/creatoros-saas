'use client';

import React, { useState } from 'react';
import { Dialog } from '../ui/DialogModal';
import { SOCIAL_ACCOUNTS } from '../../lib/mockDataPublisher';
import { SocialIcons } from '../common/SocialIcons';
import { Sparkles, Hash, Image as ImageIcon, Send, Calendar, Clock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const PostComposerModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSchedulePost: (post: any) => void;
}> = ({ isOpen, onClose, onSchedulePost }) => {
  const { showToast } = useAuth();
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['instagram', 'tiktok', 'youtube']);
  const [caption, setCaption] = useState('5 AI Automation tools every video creator needs in 2026! 🚀');
  const [hashtags, setHashtags] = useState('#CreatorOS #AIVideo #VideoAutomation');
  const [scheduledDate, setScheduledDate] = useState('2026-07-25');
  const [scheduledTime, setScheduledTime] = useState('09:00 AM');
  const [isAiGenerating, setIsAiGenerating] = useState(false);

  const togglePlatform = (p: string) => {
    if (selectedPlatforms.includes(p)) {
      setSelectedPlatforms(selectedPlatforms.filter((plat) => plat !== p));
    } else {
      setSelectedPlatforms([...selectedPlatforms, p]);
    }
  };

  const handleGenerateAiCaption = () => {
    setIsAiGenerating(true);
    setTimeout(() => {
      setIsAiGenerating(false);
      setCaption('Stop doing video editing by hand. In 2026, top content teams run entire media operations with CreatorOS! 🚀');
      showToast('Generated AI caption!');
    }, 1000);
  };

  const handleGenerateAiHashtags = () => {
    setHashtags('#CreatorOS #VideoAutomation #Subtitles2026 #ContentMarketing #SaaS2026');
    showToast('Generated AI hashtags!');
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="Compose Multi-Platform Social Post" maxWidth="max-w-xl">
      <div className="space-y-4 text-left">
        <div>
          <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1.5">Select Target Platforms (8 Supported)</label>
          <div className="grid grid-cols-4 gap-2">
            {SOCIAL_ACCOUNTS.map((acc) => {
              const isSel = selectedPlatforms.includes(acc.platform);
              return (
                <button
                  key={acc.platform}
                  onClick={() => togglePlatform(acc.platform)}
                  className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all ${
                    isSel ? 'bg-[var(--accent-warm)] text-white border-transparent shadow-xs' : 'bg-[var(--bg-canvas)] border-[var(--border-default)] text-[var(--text-secondary)]'
                  }`}
                >
                  <div className="w-4 h-4 shrink-0">
                    <SocialIcons platform={acc.platform} />
                  </div>
                  <span className="capitalize truncate">{acc.platform}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-semibold text-[var(--text-primary)]">Post Caption</label>
            <div className="flex items-center gap-2">
              <button
                onClick={handleGenerateAiCaption}
                disabled={isAiGenerating}
                className="text-[11px] font-bold text-[var(--accent-warm)] flex items-center gap-1 cursor-pointer hover:underline"
              >
                <Sparkles size={12} /> AI Caption
              </button>
              <button
                onClick={handleGenerateAiHashtags}
                className="text-[11px] font-bold text-[var(--accent-warm)] flex items-center gap-1 cursor-pointer hover:underline"
              >
                <Hash size={12} /> AI Hashtags
              </button>
            </div>
          </div>
          <textarea
            rows={4}
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            className="w-full p-3 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-default)] text-xs text-[var(--text-primary)] focus:border-[var(--accent-warm)] resize-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">Hashtags</label>
          <input
            type="text"
            value={hashtags}
            onChange={(e) => setHashtags(e.target.value)}
            className="w-full p-2.5 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-default)] text-xs text-[var(--text-primary)] font-mono"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">Publish Date</label>
            <input
              type="date"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-default)] text-xs text-[var(--text-primary)] font-mono"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">Publish Time</label>
            <input
              type="text"
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-default)] text-xs text-[var(--text-primary)] font-mono"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-[var(--border-subtle)]">
          <button
            onClick={() => {
              onSchedulePost({
                id: `post-${Date.now()}`,
                platforms: selectedPlatforms,
                caption,
                scheduledTime: `${scheduledDate} ${scheduledTime}`,
                status: 'scheduled'
              });
              showToast('Post scheduled successfully across platforms!');
              onClose();
            }}
            className="px-5 py-2.5 rounded-xl bg-[var(--accent-warm)] text-white text-xs font-bold shadow-md hover:opacity-95 flex items-center gap-1.5 cursor-pointer"
          >
            <Send size={14} />
            <span>Schedule Post ({selectedPlatforms.length} destinations)</span>
          </button>
        </div>
      </div>
    </Dialog>
  );
};
