'use client';

import React, { Suspense } from 'react';
import dynamic from 'next/dynamic';

const VideoStudioLayout = dynamic(
  () => import('../../../components/video-studio/VideoStudioLayout').then((mod) => mod.VideoStudioLayout),
  {
    loading: () => (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 rounded-full border-2 border-violet-500 border-t-transparent animate-spin mx-auto" />
          <p className="text-slate-500 text-xs font-mono">Initializing Video Studio...</p>
        </div>
      </div>
    ),
    ssr: false
  }
);

export default function VideoStudioPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0a0a0f]" />}>
      <VideoStudioLayout />
    </Suspense>
  );
}
