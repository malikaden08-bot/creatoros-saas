'use client';

import React, { Suspense } from 'react';
import dynamic from 'next/dynamic';

const MediaManagerLayout = dynamic(
  () => import('../../../components/media/MediaManagerLayout').then((mod) => mod.MediaManagerLayout),
  {
    loading: () => (
      <div className="min-h-screen bg-[#09090e] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin mx-auto" />
          <p className="text-slate-500 text-xs font-mono">Initializing Enterprise Media Asset Manager (MAMS)...</p>
        </div>
      </div>
    ),
    ssr: false
  }
);

export default function StoragePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#09090e]" />}>
      <MediaManagerLayout />
    </Suspense>
  );
}
