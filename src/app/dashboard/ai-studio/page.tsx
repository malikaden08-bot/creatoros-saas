'use client';

import React, { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { DashboardLayout } from '../../../components/layout/DashboardLayout';

const AIStudioLayout = dynamic(
  () => import('../../../components/ai-studio/AIStudioLayout').then((mod) => mod.AIStudioLayout),
  {
    loading: () => (
      <div className="py-20 text-center space-y-3 font-mono text-xs text-slate-400">
        <div className="w-8 h-8 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin mx-auto" />
        <div>Initializing Multi-Modal AI Studio Suite...</div>
      </div>
    ),
    ssr: false
  }
);

export default function AIStudioDashboardPage() {
  return (
    <DashboardLayout>
      <Suspense fallback={<div className="p-8 text-slate-400 font-mono text-xs text-center">Loading AI Studio...</div>}>
        <AIStudioLayout />
      </Suspense>
    </DashboardLayout>
  );
}
