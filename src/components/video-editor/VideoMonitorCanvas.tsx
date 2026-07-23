'use client';

import React, { useState } from 'react';
import { Play, Pause, RotateCcw, Volume2, Maximize2, Sparkles, Layers } from 'lucide-react';

export interface VideoMonitorCanvasProps {
  currentTime: number;
  isPlaying: boolean;
  onTogglePlay: () => void;
  aspectRatio: '16:9' | '9:16' | '1:1';
  onChangeAspectRatio: (ar: '16:9' | '9:16' | '1:1') => void;
  activeSubtitleStyle?: string;
  hasAiBgRemoval?: boolean;
}

export const VideoMonitorCanvas: React.FC<VideoMonitorCanvasProps> = ({
  currentTime,
  isPlaying,
  onTogglePlay,
  aspectRatio,
  onChangeAspectRatio,
  activeSubtitleStyle = 'Hormozi Amber Active',
  hasAiBgRemoval = false
}) => {
  const formatTimecode = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = Math.floor(sec % 60);
    const ms = Math.floor((sec % 1) * 100);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  const aspectStyles = {
    '16:9': 'w-full max-w-3xl aspect-video',
    '9:16': 'w-72 aspect-[9/16]',
    '1:1': 'w-96 aspect-square'
  };

  return (
    <div className="flex-1 h-full bg-stone-950 flex flex-col justify-between p-4 overflow-hidden select-none">
      <div className="flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          {['16:9', '9:16', '1:1'].map((ar) => (
            <button
              key={ar}
              onClick={() => onChangeAspectRatio(ar as any)}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold border transition-colors cursor-pointer ${
                aspectRatio === ar
                  ? 'bg-[var(--accent-warm)] text-white border-transparent shadow-xs'
                  : 'bg-stone-900 text-stone-400 border-stone-800 hover:text-white'
              }`}
            >
              {ar}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {hasAiBgRemoval && (
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
              <Sparkles size={11} /> AI Subject Mask Active
            </span>
          )}
          <span className="text-xs font-mono font-bold text-stone-400 bg-stone-900 px-3 py-1 rounded-lg border border-stone-800">
            {formatTimecode(currentTime)} / 00:48.00
          </span>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-4 min-h-0">
        <div className={`relative ${aspectStyles[aspectRatio]} bg-stone-900 border border-stone-800 rounded-2xl shadow-2xl overflow-hidden flex items-center justify-center transition-all duration-300`}>
          <img
            src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80"
            alt="Main Video Frame"
            className="w-full h-full object-cover"
          />

          <div className="absolute bottom-8 inset-x-4 text-center z-10 pointer-events-none">
            <span className="inline-block px-4 py-2 rounded-xl bg-stone-950/80 backdrop-blur-md text-amber-500 font-extrabold text-lg sm:text-2xl uppercase tracking-wider drop-shadow-xl border border-amber-500/30">
              REVOLUTIONIZING <span className="text-white">VIDEO EDITING</span>
            </span>
          </div>

          {!isPlaying && (
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
              <button
                onClick={onTogglePlay}
                className="p-5 rounded-full bg-[var(--accent-warm)] text-white shadow-2xl hover:scale-110 transition-transform cursor-pointer"
              >
                <Play size={28} />
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-stone-900 z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={onTogglePlay}
            className="p-2.5 rounded-xl bg-[var(--accent-warm)] text-white hover:opacity-90 transition-opacity cursor-pointer shadow-md"
          >
            {isPlaying ? <Pause size={18} /> : <Play size={18} />}
          </button>
          <button
            onClick={() => onTogglePlay()}
            className="p-2 rounded-lg bg-stone-900 text-stone-400 hover:text-white transition-colors cursor-pointer"
          >
            <RotateCcw size={16} />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <Volume2 size={16} className="text-stone-400" />
          <Maximize2 size={16} className="text-stone-400 cursor-pointer hover:text-white" />
        </div>
      </div>
    </div>
  );
};
